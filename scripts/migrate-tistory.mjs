import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultPostsDirectory = join(projectRoot, 'src/content/posts');
const defaultAssetDirectory = join(projectRoot, 'public/images/posts');
const migrationManifestPath = join(projectRoot, 'src/content/tistory-migration-manifest.json');
const namedCategories = new Set(['Git', '일상', 'project', 'Study', 'MacOS', 'Algorithm']);
const slugPattern = /^[a-z]+(?:-[a-z]+)*$/;

function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function hasClass(node, expected) {
  return (attr(node, 'class') ?? '').split(/\s+/).includes(expected);
}

function textContent(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(textContent).join('');
}

function findAll(node, predicate, results = []) {
  if (predicate(node)) results.push(node);
  for (const child of node.childNodes ?? []) findAll(child, predicate, results);
  return results;
}

function nearestParentWithClass(node, className) {
  let parent = node.parentNode;
  while (parent) {
    if (hasClass(parent, className)) return parent;
    parent = parent.parentNode;
  }
  return undefined;
}

function meta(document, name) {
  const node = findAll(document, (item) => item.nodeName === 'meta' && (attr(item, 'property') === name || attr(item, 'name') === name))[0];
  return node ? attr(node, 'content')?.trim() : undefined;
}

function articleNode(document) {
  const candidates = findAll(document, (item) => item.nodeName === 'div' && hasClass(item, 'article'));
  return candidates.find((item) => nearestParentWithClass(item, 'permalink-template')) ?? candidates[0]
    ?? findAll(document, (item) => item.nodeName === 'article')[0];
}

function protectedPost(document) {
  return Boolean(findAll(document, (item) => hasClass(item, 'protected-form')).length);
}

function contentNode(article) {
  return findAll(article, (item) => hasClass(item, 'contents_style'))[0] ?? article;
}

function escapeInline(value) {
  return value.replace(/([\\`*_{}\[\]<>])/g, '\\$1');
}

function cleanText(value) {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

function block(value) {
  const trimmed = value.trim();
  return trimmed ? `${trimmed}\n\n` : '';
}

function codeFence(value) {
  const longestTicks = Math.max(0, ...(value.match(/`+/g) ?? []).map((item) => item.length));
  return '`'.repeat(Math.max(3, longestTicks + 1));
}

function hasBlockChild(node) {
  return (node.childNodes ?? []).some((child) => ['img', 'pre', 'table'].includes(child.tagName?.toLowerCase()));
}

function imageExtension(url, contentType) {
  const byType = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  }[contentType?.split(';')[0]];
  if (byType) return byType;
  try {
    const extension = extname(new URL(url).pathname).toLowerCase();
    return /^\.(?:avif|gif|jpe?g|png|svg|webp)$/.test(extension) ? extension : '.img';
  } catch {
    return '.img';
  }
}

function sourceSlug(title) {
  const normalized = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const candidate = normalized.toLowerCase().match(/[a-z]+/g)?.join('-') ?? '';
  if (candidate) return candidate;
  const alphabeticHash = [...createHash('sha256').update(title).digest().subarray(0, 12)]
    .map((byte) => String.fromCharCode(97 + (byte % 26)))
    .join('');
  return `post-${alphabeticHash}`;
}

function yamlString(value) {
  return JSON.stringify(value ?? '');
}

function frontmatter(post) {
  return [
    '---',
    `title: ${yamlString(post.title)}`,
    `description: ${yamlString(post.description)}`,
    `pubDate: ${post.pubDate.toISOString()}`,
    `category: ${yamlString(post.category)}`,
    `tags: ${JSON.stringify(post.tags)}`,
    `slug: ${yamlString(post.slug)}`,
    `sourceUrl: ${yamlString(post.sourceUrl)}`,
    `draft: ${post.draft}`,
    '---',
    '',
  ].join('\n');
}

function categoryFromDocument(document) {
  const entryInfo = findAll(document, (item) => item.nodeName === '#text' && item.value?.includes('window.T.entryInfo'))[0]?.value;
  const label = entryInfo?.match(/"categoryLabel":"([^"]*)"/)?.[1];
  return namedCategories.has(label) ? label : 'uncategorized';
}

function tagsFromDocument(document) {
  const script = findAll(document, (item) => item.nodeName === '#text' && item.value?.includes('"tags"'))
    .map((item) => item.value)
    .find((value) => /"tags"\s*:\s*\[/.test(value));
  const raw = script?.match(/"tags"\s*:\s*(\[[^\]]*\])/s)?.[1];
  if (raw) {
    try {
      const tags = JSON.parse(raw);
      if (Array.isArray(tags)) return tags.filter((tag) => typeof tag === 'string');
    } catch {
      // Fall back to visible tag links when a skin embeds non-JSON JavaScript.
    }
  }
  return [...new Set(findAll(document, (item) => item.nodeName === 'a' && (attr(item, 'href') ?? '').includes('/tag/'))
    .map((item) => cleanText(textContent(item)))
    .filter(Boolean))];
}

async function localAsset(url, { slug, assetDirectory, fetchImpl, assets, missingAssets }) {
  if (!url || url.startsWith('data:')) return url;
  const seen = assets.find((asset) => asset.sourceUrl === url);
  if (seen) return seen.localPath;

  try {
    const response = await fetchImpl(url, { headers: { 'user-agent': 'Tistory-to-Astro-migration/1.0' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const extension = imageExtension(url, response.headers.get('content-type'));
    const filename = `${createHash('sha256').update(url).digest('hex').slice(0, 20)}${extension}`;
    const directory = join(assetDirectory, slug);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), Buffer.from(await response.arrayBuffer()));
    const localPath = `/images/posts/${slug}/${filename}`;
    assets.push({ sourceUrl: url, localPath });
    return localPath;
  } catch (error) {
    missingAssets.push({ sourceUrl: url, reason: error instanceof Error ? error.message : String(error) });
    return url;
  }
}

async function markdownFromNodes(nodes, context) {
  let output = '';
  for (const node of nodes ?? []) output += await markdownFromNode(node, context);
  return output;
}

async function inlineMarkdown(nodes, context) {
  return (await markdownFromNodes(nodes, { ...context, inline: true })).replace(/\n+/g, ' ').trim();
}

async function tableMarkdown(node, context) {
  const rows = findAll(node, (item) => item.nodeName === 'tr');
  const values = await Promise.all(rows.map(async (row) => {
    const cells = (row.childNodes ?? []).filter((item) => item.nodeName === 'th' || item.nodeName === 'td');
    return Promise.all(cells.map(async (cell) => (await inlineMarkdown(cell.childNodes, context)).replace(/\|/g, '\\|')));
  }));
  const usable = values.filter((row) => row.length);
  if (!usable.length) return '';
  const width = Math.max(...usable.map((row) => row.length));
  const normalized = usable.map((row) => [...row, ...Array(width - row.length).fill('')]);
  const header = normalized[0];
  return `| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n${normalized.slice(1).map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n`;
}

async function markdownFromNode(node, context) {
  if (node.nodeName === '#text') {
    // Formatting newlines between HTML blocks must not indent the following
    // Markdown block (notably a fenced code block or heading).
    if (!context.inline && /^\s+$/.test(node.value)) return '';
    return escapeInline(node.value.replace(/\s+/g, ' '));
  }
  if (node.nodeName === '#comment') return '';
  const name = node.tagName?.toLowerCase();
  if (!name) return markdownFromNodes(node.childNodes, context);

  if (/^h[1-6]$/.test(name)) return block(`${'#'.repeat(Number(name[1]))} ${await inlineMarkdown(node.childNodes, context)}`);
  if (name === 'p') {
    const body = hasBlockChild(node)
      ? await markdownFromNodes(node.childNodes, context)
      : await inlineMarkdown(node.childNodes, context);
    return block(body);
  }
  if (name === 'div' || name === 'section') {
    const body = await markdownFromNodes(node.childNodes, context);
    return block(body);
  }
  if (name === 'br') return '\n';
  if (name === 'hr') return '---\n\n';
  if (name === 'strong' || name === 'b') return `**${await inlineMarkdown(node.childNodes, context)}**`;
  if (name === 'em' || name === 'i') return `*${await inlineMarkdown(node.childNodes, context)}*`;
  if (name === 'del' || name === 's' || name === 'strike') return `~~${await inlineMarkdown(node.childNodes, context)}~~`;
  if (name === 'code' && node.parentNode?.tagName?.toLowerCase() !== 'pre') return `\`${(await inlineMarkdown(node.childNodes, context)).replace(/`/g, '\\`')}\``;
  if (name === 'a') {
    const href = attr(node, 'href') ?? '';
    const label = await inlineMarkdown(node.childNodes, context);
    const markdown = href ? `[${label || href}](${href})` : label;
    return context.inline ? markdown : block(markdown);
  }
  if (name === 'img') {
    const src = attr(node, 'src') ?? attr(node, 'data-src') ?? attr(node, 'data-original');
    const localPath = await localAsset(src, context);
    const markdown = localPath ? `![${attr(node, 'alt') ?? ''}](${localPath})` : '';
    return context.inline ? markdown : block(markdown);
  }
  if (name === 'pre') {
    // A preformatted block is the one place where source whitespace is content.
    // Do not pass it through cleanText(), trim(), or inline Markdown conversion.
    const value = textContent(node);
    const fence = codeFence(value);
    return `${fence}\n${value}${value.endsWith('\n') ? '' : '\n'}${fence}\n\n`;
  }
  if (name === 'table') return tableMarkdown(node, context);
  if (name === 'blockquote') {
    const body = (await markdownFromNodes(node.childNodes, context)).trim();
    return body ? block(body.split('\n').map((line) => line ? `> ${line}` : '>').join('\n')) : '';
  }
  if (name === 'ul' || name === 'ol') {
    const items = (node.childNodes ?? []).filter((item) => item.tagName?.toLowerCase() === 'li');
    const lines = await Promise.all(items.map(async (item, index) => {
      const body = (await markdownFromNodes(item.childNodes, context)).trim();
      return `${name === 'ol' ? `${index + 1}.` : '-'} ${body}`;
    }));
    return lines.length ? `${lines.join('\n')}\n\n` : '';
  }
  if (name === 'iframe' || name === 'video') {
    const src = attr(node, 'src');
    return src ? `[Embedded media](${src})\n\n` : '';
  }
  return markdownFromNodes(node.childNodes, context);
}

export function assertUniqueSlugs(slugs) {
  const seen = new Set();
  for (const slug of slugs) {
    assertValidSlug(slug);
    if (seen.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
    seen.add(slug);
  }
}

export function assertValidSlug(slug) {
  if (typeof slug !== 'string' || !slugPattern.test(slug)) {
    throw new Error(`Invalid slug: ${String(slug)}. Slugs must match ${slugPattern}.`);
  }
}

export async function migrateHtmlExport(html, options) {
  const document = parse(html);
  const sourceUrl = options.sourceUrl;
  const assets = [];
  const missingAssets = [];
  const article = articleNode(document);
  if (!article) throw new Error(`No article body found in ${sourceUrl}`);
  const articleHeading = findAll(article, (item) => /^h1$/i.test(item.tagName ?? ''))[0];
  const title = (meta(document, 'og:title') ?? cleanText(articleHeading ? textContent(articleHeading) : '')) || 'post';
  const slug = options.slug ?? sourceSlug(title);
  assertValidSlug(slug);
  const description = meta(document, 'og:description') ?? '';
  const dateValue = meta(document, 'article:published_time');
  const pubDate = dateValue ? new Date(dateValue) : new Date(0);
  if (Number.isNaN(pubDate.valueOf())) throw new Error(`Invalid publication date in ${sourceUrl}`);
  const post = {
    title,
    description,
    pubDate,
    category: categoryFromDocument(document),
    tags: tagsFromDocument(document),
    slug,
    sourceUrl,
    draft: false,
  };
  // Block renderers own their boundaries.  In particular, never run a whole
  // document cleanup pass here: it would alter whitespace inside fenced code.
  const markdown = (await markdownFromNodes(contentNode(article).childNodes, {
    slug,
    assetDirectory: options.assetDirectory ?? defaultAssetDirectory,
    fetchImpl: options.fetchImpl ?? fetch,
    assets,
    missingAssets,
  })).trim();
  return { post, markdown, assets, missingAssets };
}

function postUrlsFromSitemap(xml, source) {
  const urls = [...xml.matchAll(/<loc>(https:\/\/0418\.tistory\.com\/(\d+))<\/loc>/g)].map((match) => match[1]);
  return [...new Set(urls)];
}

function postUrlsFromCategoryIndex(html) {
  return [...new Set([...html.matchAll(/href="\/(\d+)(?:\?[^\"]*)?"/g)].map((match) => `https://0418.tistory.com/${match[1]}`))];
}

function categoryPageCount(html) {
  return Math.max(1, ...[...html.matchAll(/[?&]page=(\d+)/g)].map((match) => Number(match[1])));
}

async function sourcePosts(source, fetchImpl) {
  if (/^https?:\/\//.test(source)) {
    const url = new URL(source);
    if (url.pathname !== '/' && /^\/\d+\/?$/.test(url.pathname)) return [{ sourceUrl: url.href, html: await (await fetchImpl(url.href)).text() }];
    const sitemap = await (await fetchImpl(new URL('/sitemap.xml', url))).text();
    const categoryIndex = await (await fetchImpl(new URL('/category', url))).text();
    const categoryPages = await Promise.all(Array.from({ length: categoryPageCount(categoryIndex) }, async (_, index) => (
      index === 0 ? categoryIndex : (await fetchImpl(new URL(`/category?page=${index + 1}`, url))).text()
    )));
    const urls = [...new Set([
      ...postUrlsFromSitemap(sitemap, source),
      ...categoryPages.flatMap(postUrlsFromCategoryIndex),
    ])];
    if (!urls.length) throw new Error(`No public posts found in sitemap: ${source}`);
    return Promise.all(urls.map(async (sourceUrl) => ({ sourceUrl, html: await (await fetchImpl(sourceUrl)).text() })));
  }
  const stat = await readdir(source, { withFileTypes: true }).catch(() => undefined);
  if (stat) {
    const files = stat.filter((entry) => entry.isFile() && entry.name.endsWith('.html')).map((entry) => entry.name).sort();
    return Promise.all(files.map(async (file) => ({ sourceUrl: `https://0418.tistory.com/${basename(file, '.html')}`, html: await readFile(join(source, file), 'utf8') })));
  }
  return [{ sourceUrl: `https://0418.tistory.com/${basename(source, '.html')}`, html: await readFile(source, 'utf8') }];
}

async function main() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  if (sourceIndex === -1 || !args[sourceIndex + 1]) throw new Error('Usage: node scripts/migrate-tistory.mjs --source <URL|export.html|directory> [--overwrite]');
  const source = args[sourceIndex + 1];
  const overwrite = args.includes('--overwrite');
  const inputs = await sourcePosts(source, fetch);
  await mkdir(defaultPostsDirectory, { recursive: true });
  const results = [];
  for (const input of inputs) {
    if (protectedPost(parse(input.html))) {
      results.push({ skipped: { sourceUrl: input.sourceUrl, reason: 'protected post; public page has no article body' } });
      continue;
    }
    const result = await migrateHtmlExport(input.html, { sourceUrl: input.sourceUrl });
    if (result.missingAssets.length) throw new Error(`Missing assets for ${input.sourceUrl}: ${result.missingAssets.map((asset) => asset.sourceUrl).join(', ')}`);
    results.push(result);
  }
  const generated = results.filter((result) => !result.skipped);
  assertUniqueSlugs(generated.map((result) => result.post.slug));
  for (const result of generated) {
    const categoryDirectory = join(defaultPostsDirectory, result.post.category);
    const target = join(categoryDirectory, `${result.post.slug}.md`);
    if (!overwrite && await readFile(target, 'utf8').then(() => true).catch(() => false)) throw new Error(`Refusing to overwrite existing post: ${relative(projectRoot, target)}`);
    await mkdir(categoryDirectory, { recursive: true });
    await writeFile(target, `${frontmatter(result.post)}${result.markdown}\n`);
  }
  const manifest = {
    version: 1,
    source,
    sourceUrls: inputs.map((input) => input.sourceUrl),
    entries: generated.map((result) => ({
      slug: result.post.slug,
      sourceUrl: result.post.sourceUrl,
      category: result.post.category,
      markdownPath: `src/content/posts/${result.post.category}/${result.post.slug}.md`,
      imagePaths: result.assets.map((asset) => asset.localPath),
    })),
    skippedSources: results.flatMap((result) => result.skipped ? [result.skipped] : []),
  };
  await writeFile(migrationManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({
    sourceCount: inputs.length,
    generatedCount: generated.length,
    skippedSources: manifest.skippedSources,
    missingAssets: generated.flatMap((result) => result.missingAssets),
  }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

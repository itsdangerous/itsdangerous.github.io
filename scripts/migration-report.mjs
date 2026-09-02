import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const postsDirectory = join(projectRoot, 'src/content/posts');

function value(frontmatter, field) {
  return frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim();
}

function unquote(value) {
  try { return JSON.parse(value); } catch { return value?.replace(/^['"]|['"]$/g, ''); }
}

async function sourceCount(source) {
  const url = new URL(source);
  const sitemap = await (await fetch(new URL('/sitemap.xml', url))).text();
  const categoryIndex = await (await fetch(new URL('/category', url))).text();
  const pageCount = Math.max(1, ...[...categoryIndex.matchAll(/[?&]page=(\d+)/g)].map((match) => Number(match[1])));
  const categoryPages = await Promise.all(Array.from({ length: pageCount }, async (_, index) => (
    index === 0 ? categoryIndex : (await fetch(new URL(`/category?page=${index + 1}`, url))).text()
  )));
  const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/0418\.tistory\.com\/\d+)<\/loc>/g)].map((match) => match[1]);
  const categoryUrls = categoryPages.flatMap((html) => [...html.matchAll(/href="\/(\d+)(?:\?[^\"]*)?"/g)].map((match) => `https://0418.tistory.com/${match[1]}`));
  return [...new Set([...sitemapUrls, ...categoryUrls])];
}

async function sourceStatus(sourceUrl) {
  const html = await (await fetch(sourceUrl)).text();
  return {
    sourceUrl,
    reason: html.includes('protected-form')
      ? 'protected post; public page has no article body'
      : 'source was discovered but has no migrated Markdown file',
  };
}

const args = process.argv.slice(2);
const source = args[args.indexOf('--source') + 1] ?? 'https://0418.tistory.com/';
const filenames = (await readdir(postsDirectory)).filter((file) => file.endsWith('.md')).sort();
const posts = await Promise.all(filenames.map(async (filename) => ({ filename, content: await readFile(join(postsDirectory, filename), 'utf8') })));
const categories = Object.fromEntries(posts.reduce((counts, post) => {
  const category = unquote(value(post.content, 'category')) ?? 'uncategorized';
  counts.set(category, (counts.get(category) ?? 0) + 1);
  return counts;
}, new Map()).entries());
const slugs = posts.map((post) => unquote(value(post.content, 'slug')));
const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
const migratedSourceUrls = new Set(posts.map((post) => unquote(value(post.content, 'sourceUrl'))));
const localImages = posts.flatMap((post) => [...post.content.matchAll(/!\[[^\]]*\]\((\/images\/posts\/[^)]+)\)/g)].map((match) => match[1]));
const missingAssets = [];
for (const image of localImages) {
  try { await readFile(join(projectRoot, 'public', image)); } catch { missingAssets.push(image); }
}
const sourceUrls = await sourceCount(source);
const unmigratedUrls = sourceUrls.filter((url) => !migratedSourceUrls.has(url));
console.log(JSON.stringify({
  sourceCount: sourceUrls.length,
  generatedCount: posts.length,
  missingAssets,
  duplicateSlugs: [...new Set(duplicates)],
  categoryCounts: categories,
  unmigratedSources: await Promise.all(unmigratedUrls.map(sourceStatus)),
}, null, 2));

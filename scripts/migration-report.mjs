import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = join(projectRoot, 'src/content/tistory-migration-manifest.json');

function imageDestinations(markdown) {
  return [...markdown.matchAll(/!\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g)].map((match) => match[1]);
}

function categoryCounts(entries) {
  return Object.fromEntries(entries.reduce((counts, entry) => {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    return counts;
  }, new Map()).entries());
}

async function markdownForEntry(entry, projectDirectory, missingAssets) {
  const path = join(projectDirectory, entry.markdownPath);
  try {
    return await readFile(path, 'utf8');
  } catch {
    missingAssets.push({ path: entry.markdownPath, reason: 'migrated Markdown file is missing' });
    return '';
  }
}

async function inspectImage(destination, entry, projectDirectory, missingAssets) {
  if (!destination.startsWith('/images/posts/') || destination.includes('/../')) {
    missingAssets.push({
      path: destination,
      post: entry.slug,
      reason: 'image destination must be a local /images/posts/ path',
    });
    return;
  }
  try {
    await access(join(projectDirectory, 'public', destination));
  } catch {
    missingAssets.push({ path: destination, post: entry.slug, reason: 'local image file is missing' });
  }
}

export async function inspectManifest(manifest, projectDirectory = projectRoot) {
  const missingAssets = [];
  for (const entry of manifest.entries) {
    const markdown = await markdownForEntry(entry, projectDirectory, missingAssets);
    for (const destination of imageDestinations(markdown)) await inspectImage(destination, entry, projectDirectory, missingAssets);
  }
  const slugs = manifest.entries.map((entry) => entry.slug);
  const sourceUrls = manifest.entries.map((entry) => entry.sourceUrl);
  const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  const duplicateSourceUrls = sourceUrls.filter((sourceUrl, index) => sourceUrls.indexOf(sourceUrl) !== index);
  return {
    sourceCount: manifest.sourceUrls.length,
    generatedCount: manifest.entries.length,
    missingAssets,
    duplicateSlugs: [...new Set(duplicateSlugs)],
    duplicateSourceUrls: [...new Set(duplicateSourceUrls)],
    categoryCounts: categoryCounts(manifest.entries),
    unmigratedSources: manifest.skippedSources,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  console.log(JSON.stringify(await inspectManifest(manifest), null, 2));
}

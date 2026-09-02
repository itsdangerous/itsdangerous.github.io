import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const astroDist = resolve(dirname(require.resolve('astro/package.json')), 'dist');
const { resolveConfig, createSettings, createNodeLogger } = await import(pathToFileURL(join(astroDist, 'core/config/index.js')).href);
const { createContainer } = await import(pathToFileURL(join(astroDist, 'core/dev/container.js')).href);

let container: Awaited<ReturnType<typeof createContainer>>;

beforeAll(async () => {
  const root = process.cwd();
  const { astroConfig } = await resolveConfig({ root }, 'dev');
  const settings = await createSettings(astroConfig, root);
  container = await createContainer({
    isRestart: true,
    inlineConfig: { root },
    logger: createNodeLogger({ logLevel: 'silent' }),
    settings,
  });
});

afterAll(async () => {
  await container?.close();
});

describe('post content', () => {
  it('loads every migrated entry through Astro with unique slugs and source URLs', async () => {
    const manifest = JSON.parse(await readFile(join(process.cwd(), 'src/content/tistory-migration-manifest.json'), 'utf8'));
    const { getCollection } = await container.viteServer.ssrLoadModule('astro:content');
    const posts = (await getCollection('posts')).filter((post: { data: { sourceUrl?: string } }) => manifest.sourceUrls.includes(post.data.sourceUrl));

    expect(posts).toHaveLength(manifest.entries.length);
    expect(posts.every((post: { data: { pubDate: unknown } }) => post.data.pubDate instanceof Date)).toBe(true);
    expect(new Set(posts.map((post: { slug: string }) => post.slug)).size).toBe(posts.length);
    expect(new Set(posts.map((post: { data: { sourceUrl?: string } }) => post.data.sourceUrl)).size).toBe(posts.length);
    expect(posts.every((post: { slug: string }) => /^[a-z]+(?:-[a-z]+)*$/.test(post.slug))).toBe(true);
    await Promise.all(manifest.entries.map(async (entry: { category: string; markdownPath: string; slug: string }) => {
      const frontmatter = await readFile(join(process.cwd(), entry.markdownPath), 'utf8');
      expect(entry.markdownPath).toBe(`src/content/posts/${entry.category}/${entry.slug}.md`);
      expect(frontmatter).toContain(`slug: "${entry.slug}"`);
    }));
  });
});

import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('Tistory migration fixture', () => {
  it('converts saved article HTML into post Markdown without changing the source', async () => {
    const { migrateHtmlExport } = await import('../../scripts/migrate-tistory.mjs');
    const assetDirectory = await mkdtemp(join(tmpdir(), 'tistory-migration-'));
    temporaryDirectories.push(assetDirectory);
    const source = '<article><h1>Fixture post</h1><p>Preserved <a href="https://example.com">link</a>.</p><pre><code>const answer = 42;</code></pre><table><tr><th>key</th><th>value</th></tr><tr><td>a</td><td>b</td></tr></table><blockquote><p>quoted text</p></blockquote><img src="https://assets.example.test/image.png" alt="fixture image"></article>';
    const result = await migrateHtmlExport(source, {
      assetDirectory,
      fetchImpl: async () => new Response('fixture image', { headers: { 'content-type': 'image/png' } }),
      sourceUrl: 'https://0418.tistory.com/999',
    });

    expect(source).toContain('<pre><code>const answer = 42;</code></pre>');
    expect(result.markdown).toContain('# Fixture post');
    expect(result.markdown).toContain('[link](https://example.com)');
    expect(result.markdown).toContain('```\nconst answer = 42;\n```');
    expect(result.markdown).toContain('| key | value |');
    expect(result.markdown).toContain('> quoted text');
    expect(result.markdown).toContain('![fixture image](/images/posts/fixture-post/');
    expect(result.post.category).toBe('uncategorized');
    expect(result.post.slug).toBe('fixture-post');
    await expect(access(join(assetDirectory, 'fixture-post', basename(result.assets[0].localPath)))).resolves.toBeUndefined();
  });

  it('rejects duplicate slugs before writing posts', async () => {
    const { assertUniqueSlugs } = await import('../../scripts/migrate-tistory.mjs');

    expect(() => assertUniqueSlugs(['same-post', 'same-post'])).toThrow(/Duplicate slug: same-post/);
  });
});

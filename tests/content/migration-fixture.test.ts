import { describe, expect, it } from 'vitest';

describe('Tistory migration fixture', () => {
  it('converts saved article HTML into post Markdown without changing the source', async () => {
    const { migrateHtmlExport } = await import('../../scripts/migrate-tistory.mjs');
    const source = '<article><h1>Fixture post</h1><p>Preserved <a href="https://example.com">link</a>.</p></article>';
    const result = await migrateHtmlExport(source, { sourceUrl: 'https://0418.tistory.com/fixture-post' });

    expect(source).toBe('<article><h1>Fixture post</h1><p>Preserved <a href="https://example.com">link</a>.</p></article>');
    expect(result.markdown).toContain('# Fixture post');
    expect(result.markdown).toContain('[link](https://example.com)');
    expect(result.assets).toEqual([]);
  });

  it('rejects duplicate slugs before writing posts', async () => {
    const { assertUniqueSlugs } = await import('../../scripts/migrate-tistory.mjs');

    expect(() => assertUniqueSlugs(['same-post', 'same-post'])).toThrow(/Duplicate slug: same-post/);
  });
});

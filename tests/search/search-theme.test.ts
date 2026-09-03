import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Pagefind theme overrides', () => {
  it('scopes variables below the generated Pagefind root defaults', () => {
    const source = readFileSync('src/pages/blog/search.astro', 'utf8');
    expect(source).toContain("[data-theme='midnight'] .search-page");
    expect(source).toContain("[data-theme='light'] .search-page");
  });
});

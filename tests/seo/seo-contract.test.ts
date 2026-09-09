import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('SEO contract', () => {
  it('renders shared social metadata and JSON-LD from the common layout', () => {
    const layout = read('src/shared/layouts/SiteLayout.astro');
    const seo = read('src/shared/components/SeoHead.astro');

    expect(layout).toContain('<SeoHead');
    expect(seo).toContain('og:title');
    expect(seo).toContain('twitter:card');
    expect(seo).toContain('application/ld+json');
  });

  it('gives the splash home page a canonical URL', () => {
    const splash = read('src/domains/main/layouts/SplashLayout.astro');

    expect(splash).toContain('<SeoHead');
    expect(splash).toContain("canonicalPath=\"/\"");
  });

  it('marks the search utility page as non-indexable', () => {
    const search = read('src/pages/blog/search.astro');

    expect(search).toContain('robots="noindex, follow"');
  });

  it('filters utility and admin pages from the generated sitemap', () => {
    const config = read('astro.config.mjs');

    expect(config).toContain('filter:');
    expect(config).toContain("!page.includes('/admin/')");
    expect(config).toContain("!page.includes('/blog/search/')");
  });
});

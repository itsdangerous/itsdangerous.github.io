import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('blog routes', () => {
  it('defines main, blog, space, about, and guestbook pages', () => {
    for (const path of [
      'src/pages/index.astro',
      'src/pages/blog/index.astro',
      'src/pages/blog/posts/index.astro',
      'src/pages/blog/posts/[...slug].astro',
      'src/pages/blog/categories/index.astro',
      'src/pages/blog/search.astro',
      'src/pages/portfolio.astro',
      'src/pages/games.astro',
      'src/pages/about.astro',
      'src/pages/guestbook.astro',
    ]) {
      expect(existsSync(path)).toBe(true);
    }
  });

  it('keeps the root route as a tactile sealed-volume splash', () => {
    const splash = readFileSync('src/styles/splash.css', 'utf8');
    const rootPage = readFileSync('src/pages/index.astro', 'utf8');

    expect(splash).toContain("url('/splash-leather-texture.webp')");
    expect(rootPage).toContain('book-splash');
    expect(rootPage).not.toContain('Open the volume');
  });
});

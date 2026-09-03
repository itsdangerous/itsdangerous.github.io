import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('blog routes', () => {
  it('defines main, blog, independent spaces, about, and guestbook pages', () => {
    for (const path of [
      'src/pages/index.astro',
      'src/pages/blog/index.astro',
      'src/pages/blog/posts/index.astro',
      'src/pages/blog/posts/[...slug].astro',
      'src/pages/blog/categories/index.astro',
      'src/pages/blog/search.astro',
      'src/pages/portfolio.astro',
      'src/pages/games.astro',
      'src/pages/works.astro',
      'src/pages/playroom.astro',
      'src/pages/about.astro',
      'src/pages/guestbook.astro',
    ]) {
      expect(existsSync(path)).toBe(true);
    }
  });

  it('gives independent spaces their own layout without the blog sidebar', () => {
    const layout = readFileSync('src/domains/main/layouts/MainSpaceLayout.astro', 'utf8');

    expect(layout).not.toContain('<Header');
    expect(layout).not.toContain('SiteLayout');

    for (const path of [
      'src/domains/main/routes/works.astro',
      'src/domains/main/routes/playroom.astro',
      'src/domains/main/routes/about.astro',
    ]) {
      expect(readFileSync(path, 'utf8')).toContain('class="main-space-page"');
    }
    expect(readFileSync('src/pages/works.astro', 'utf8')).toContain("domains/main/routes/works.astro");
    expect(readFileSync('src/pages/playroom.astro', 'utf8')).toContain("domains/main/routes/playroom.astro");
    expect(readFileSync('src/pages/about.astro', 'utf8')).toContain("domains/main/routes/about.astro");
  });

  it('keeps splash chapter labels aligned with their independent routes', () => {
    const rootPage = readFileSync('src/pages/index.astro', 'utf8');

    expect(rootPage).toContain('book-splash__chapter-index');
    expect(rootPage).toContain('I');
    expect(rootPage).toContain('II');
    expect(rootPage).toContain('III');
    expect(rootPage).toContain('IV');
    expect(rootPage).toContain('<a href="/works/">');
    expect(rootPage).toContain('<a href="/playroom/">');
    expect(rootPage).toContain('<a href="/about/">');
    expect(rootPage).toContain('<span>Works</span>');
    expect(rootPage).toContain('<span>Playroom</span>');
    expect(rootPage).toContain('<span>About</span>');
  });

  it('keeps the blog sidebar rooted in the blog domain', () => {
    const header = readFileSync('src/shared/components/Header.astro', 'utf8');

    expect(header).toContain('<a href="/blog/"');
    expect(header).toContain('<span>Home</span>');
    expect(header).toContain('<a href="/blog/posts/"');
    expect(header).toContain('<span>Posts</span>');
    expect(header).not.toContain('<a href="/"');
    expect(header).not.toContain('<span>Blog</span>');
    expect(header).not.toContain('pathname.startsWith(`${href}posts/`)');
    expect(header).toContain("pathname === '/blog/'");
  });

  it('limits the blog home to five recent posts', () => {
    const blogHome = readFileSync('src/pages/blog/index.astro', 'utf8');

    expect(blogHome).toContain('.slice(0, 5)');
  });

  it('keeps the root route as a tactile sealed-volume splash', () => {
    const splash = readFileSync('src/domains/main/styles/splash.css', 'utf8');
    const rootPage = readFileSync('src/pages/index.astro', 'utf8');

    expect(splash).toContain("url('/splash-leather-texture.webp')");
    expect(rootPage).toContain('book-splash');
    expect(rootPage).not.toContain('Open the volume');
  });

  it('preloads the splash texture before the first paint', () => {
    const layout = readFileSync('src/domains/main/layouts/SplashLayout.astro', 'utf8');

    expect(layout).toContain('<link rel="preload" as="image" href="/splash-leather-texture.webp"');
  });

  it('uses the approved leather texture for the shared sidebar', () => {
    const styles = readFileSync('src/shared/styles/global.css', 'utf8');
    const layout = readFileSync('src/shared/layouts/SiteLayout.astro', 'utf8');

    expect(styles).toContain("url('/splash-leather-texture.webp')");
    expect(styles).not.toContain("url('/sidebar-texture.webp')");
    expect(layout).toContain('<link rel="preload" as="image" href="/splash-leather-texture.webp"');
  });

  it('keeps the splash crest in one source component', () => {
    const rootPage = readFileSync('src/pages/index.astro', 'utf8');

    expect(rootPage).toContain("import BookCrest from '../domains/main/components/BookCrest.astro';");
    expect(existsSync('public/emblem.svg')).toBe(false);
    expect(existsSync('public/keeper-seal.svg')).toBe(false);
  });

  it('uses the embroidered title mark as the shared brand', () => {
    const header = readFileSync('src/shared/components/Header.astro', 'utf8');

    expect(header).toContain('splash-title-embroidered.webp');
    expect(header).not.toContain('site-header__profile');
  });

  it('gives sidebar navigation the same editorial glow as the splash index', () => {
    const styles = readFileSync('src/shared/styles/global.css', 'utf8');

    expect(styles).toContain('.site-header nav a:hover span');
    expect(styles).toContain('text-shadow: 0 0 0.5rem');
    expect(styles).toContain('transition: color 160ms ease, text-shadow 160ms ease');
    expect(styles).toContain('.site-header nav a:hover span');
    expect(styles).toContain('transform: translateY(-1px);');
    expect(styles).toContain('align-items: center;');
  });

  it('uses the guarded loading transition across every page layout', () => {
    const loader = readFileSync('src/shared/components/PageLoader.astro', 'utf8');

    expect(loader).toContain('data-page-loader');
    expect(loader).toContain('document.fonts');
    expect(loader).toContain('window.setTimeout(showLoader, 1000)');
    expect(loader).toContain('2500');
    expect(loader).toContain('page-loading');
    expect(loader).toContain('  body > :not([data-page-loader]) {\n    animation: page-content-reveal 420ms ease both;');
    expect(loader).not.toContain('page-content-subtle-reveal');

    for (const path of [
      'src/shared/layouts/SiteLayout.astro',
      'src/domains/main/layouts/SplashLayout.astro',
      'src/domains/main/layouts/MainSpaceLayout.astro',
    ]) {
      expect(readFileSync(path, 'utf8')).toContain('<PageLoader />');
    }
  });

});

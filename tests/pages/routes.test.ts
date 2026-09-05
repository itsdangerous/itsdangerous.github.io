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
    const styles = readFileSync('src/domains/main/styles/main-space.css', 'utf8');

    expect(layout).not.toContain('<Header');
    expect(layout).not.toContain('SiteLayout');
    expect(layout).toContain('splash-leather-cover-texture.webp');
    expect(styles).toContain("url('/splash-leather-cover-texture.webp')");

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

    expect(rootPage).not.toContain('book-splash__chapter-index');
    expect(rootPage).toContain('<a href="/works/">');
    expect(rootPage).toContain('<a href="/playroom/">');
    expect(rootPage).toContain('<a href="/about/">');
    expect(rootPage).toContain('<a href="/works/">Works</a>');
    expect(rootPage).toContain('<a href="/playroom/">Playroom</a>');
    expect(rootPage).toContain('<a href="/about/">About</a>');
    expect(rootPage).not.toContain('Personal Archive');
    expect(rootPage).not.toContain('Vol. I');
    expect(rootPage.indexOf('class="book-splash__crest"')).toBeLessThan(rootPage.indexOf('class="book-splash__center"'));
    expect(rootPage.indexOf('class="book-splash__title"')).toBeLessThan(rootPage.indexOf('class="book-splash__chapters"'));
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

  it('makes the blog home a search-first landing page', () => {
    const blogHome = readFileSync('src/pages/blog/index.astro', 'utf8');

    expect(blogHome).toContain('class="home-search"');
    expect(blogHome).not.toContain('Recent Posts');
    expect(blogHome).not.toContain('<PostCard');
    expect(blogHome).toContain('id="pagefind-search-home"');
    expect(blogHome).toContain('data-home-typing');
    expect(blogHome).toContain('읽고, 쓰고, 남겨둔 것들.');
    expect(blogHome).toContain("'언젠가 답이 됩니다.'");
    expect(blogHome).toContain("'아직 끝나지 않았습니다.'");
    expect(blogHome).toContain('무엇을 함께 찾아볼까요?');
    expect(readFileSync('src/shared/styles/global.css', 'utf8')).toContain('white-space: nowrap;');
    expect(readFileSync('src/shared/styles/global.css', 'utf8')).toContain('color: var(--color-signature-blue);');
    expect(readFileSync('src/shared/styles/global.css', 'utf8')).toContain('color: var(--color-signature-yellow);');
  });

  it('keeps the root route as a tactile sealed-volume splash', () => {
    const splash = readFileSync('src/domains/main/styles/splash.css', 'utf8');
    const rootPage = readFileSync('src/pages/index.astro', 'utf8');

    expect(existsSync('public/splash-leather-cover-texture.webp')).toBe(true);
    expect(splash).toContain("url('/splash-leather-cover-texture.webp')");
    expect(splash).not.toContain("url('/splash-leather-texture.webp')");
    expect(rootPage).toContain('book-splash');
    expect(rootPage).not.toContain('Open the volume');
  });

  it('preloads the splash texture before the first paint', () => {
    const layout = readFileSync('src/domains/main/layouts/SplashLayout.astro', 'utf8');

    expect(layout).toContain('<link rel="preload" as="image" href="/splash-leather-cover-texture.webp"');
  });

  it('crops the splash cover texture for the shared sidebar', () => {
    const styles = readFileSync('src/shared/styles/global.css', 'utf8');
    const layout = readFileSync('src/shared/layouts/SiteLayout.astro', 'utf8');

    expect(styles).toContain("url('/splash-leather-cover-texture.webp')");
    expect(styles).toMatch(/background-position:\s*center,\s*24% center;/);
    expect(styles).not.toContain("url('/splash-leather-texture.webp')");
    expect(styles).not.toContain("url('/sidebar-texture.webp')");
    expect(layout).toContain('<link rel="preload" as="image" href="/splash-leather-cover-texture.webp"');
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

    expect(styles).toContain('.site-header nav :is(a, .site-header__nav-search):hover span');
    expect(styles).toContain('text-shadow: 0 0 0.5rem');
    expect(styles).toMatch(/transition:\s*color 160ms ease,\s*text-shadow 160ms ease/);
    expect(styles).toContain('.site-header nav :is(a, .site-header__nav-search):hover span');
    expect(styles).toContain('transform: translateY(-1px);');
    expect(styles).toContain('align-items: center;');
  });

  it('scopes the serif typeface to blog prose without changing the UI font', () => {
    const tokens = readFileSync('src/shared/styles/tokens.css', 'utf8');
    const blogStyles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');

    expect(tokens).toContain('--font-ui:');
    expect(tokens).toContain('--font-prose:');
    expect(tokens).toContain('--font-sans: var(--font-ui);');
    expect(tokens).toContain('--font-display: var(--font-prose);');
    expect(blogStyles).toContain('font-family: var(--font-prose);');
  });

  it('layers the manuscript-paper texture into the site background without changing theme colors', () => {
    const blogStyles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');
    const globalStyles = readFileSync('src/shared/styles/global.css', 'utf8');

    expect(existsSync('public/article-manuscript-paper-texture.webp')).toBe(true);
    expect(blogStyles).not.toContain('article-manuscript-paper-texture');
    expect(globalStyles).toContain('html::before');
    expect(globalStyles).toMatch(/background:\s*url\(['"]\/article-manuscript-paper-texture\.webp['"]\) center \/ 40rem\s*repeat;/);
    expect(globalStyles).toContain('mix-blend-mode: soft-light;');
    expect(globalStyles).toContain('filter: brightness(0.6) contrast(3);');
    expect(globalStyles).toMatch(/html\[data-theme=['"]light['"]\]::before/);
    expect(globalStyles).toContain('opacity: 0.32;');
    expect(globalStyles).toContain('mix-blend-mode: multiply;');
    expect(globalStyles).toContain('filter: grayscale(1) sepia(0.12) brightness(0.96) contrast(1.12);');
  });

  it('gives floating surfaces the shared leather-cover texture', () => {
    const globalStyles = readFileSync('src/shared/styles/global.css', 'utf8');
    const blogStyles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');

    expect(globalStyles).toContain('.feature-bundle__toggle');
    expect(globalStyles).toContain('.feature-bundle__panel');
    expect(globalStyles).toContain("url('/splash-leather-cover-texture.webp')");
    expect(blogStyles).toContain('.code-shell__copy::after');
    expect(blogStyles).toContain('.article-shell > .article__desktop-toc:has(.table-of-contents__desktop:hover)');
    expect(blogStyles).toContain('.table-of-contents__desktop a,');
    expect(blogStyles).toContain('background-repeat: no-repeat;');
    expect(blogStyles).toContain('.code-copy-toast');
    expect(blogStyles).toContain("url('/splash-leather-cover-texture.webp')");
    expect(blogStyles).toContain('.article__content table');
    expect(blogStyles).toContain('background-repeat: no-repeat;');
  });

  it('opens the desktop TOC at its full floating width without a narrow-width transition', () => {
    const blogStyles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');

    expect(blogStyles).toContain('.article-shell > .article__desktop-toc:has(.table-of-contents__desktop:hover),');
    expect(blogStyles).toContain('width: 15rem;');
    expect(blogStyles).not.toContain('transition: width 220ms ease;');
  });

  it('limits the desktop TOC trigger to the rail and keeps it open over the floating panel', () => {
    const blogStyles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');

    expect(blogStyles).toContain('width: calc(var(--toc-column-width) + 0.5rem);');
    expect(blogStyles).toContain(':has(.table-of-contents__desktop:hover)');
    expect(blogStyles).toContain('width: 15rem;');
  });

  it('gives TOC heading links consistent interactive rows', () => {
    const blogStyles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');

    expect(blogStyles).toContain('min-height: 2.6rem;');
    expect(blogStyles).toContain('.table-of-contents__desktop a:hover,');
    expect(blogStyles).toContain('background: color-mix(in srgb, var(--color-accent) 12%, transparent);');
  });

  it('uses clean unnumbered cards in every blog archive', () => {
    const card = readFileSync('src/domains/blog/components/PostCard.astro', 'utf8');

    expect(card).toContain('<li class="post-card">');
    expect(card).not.toContain('post-card__number');
    expect(card).not.toContain('index?: number');

    for (const path of [
      'src/pages/blog/posts/index.astro',
      'src/pages/blog/posts/[page].astro',
      'src/pages/blog/categories/[category].astro',
      'src/pages/blog/categories/[category]/[page].astro',
      'src/pages/blog/tags/[tag].astro',
      'src/pages/blog/tags/[tag]/[page].astro',
    ]) {
      expect(readFileSync(path, 'utf8')).not.toContain('index={');
    }
  });

  it('fades only the page content while keeping the sidebar outside the transition', () => {
    const loader = readFileSync('src/shared/components/PageLoader.astro', 'utf8');

    expect(loader).toContain('data-page-loader');
    expect(loader).toContain('document.fonts');
    expect(loader).toContain('window.setTimeout(showLoader, 1000)');
    expect(loader).toContain('2500');
    expect(loader).toContain('page-loading');
    expect(loader).toContain('  body > :not([data-page-loader]):not(.site-frame) {\n    animation: page-content-reveal 420ms ease both;');
    expect(loader).toContain('  .site-content {\n    animation: page-content-reveal 420ms ease both;');
    expect(loader).toContain('  html.page-loading .site-content { opacity: 0; }');
    expect(loader).not.toContain('html.page-loading body > :not([data-page-loader]) { opacity: 0; }');
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

import { expect, test } from '@playwright/test';

test('sealed-volume splash keeps its chapter navigation inside the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const chapters = page.locator('.book-splash__chapters').first();
  const secondaryChapters = page.locator('.book-splash__chapters--secondary');
  await expect(chapters).toBeVisible();
  await expect(secondaryChapters).toBeVisible();
  expect(await chapters.evaluate((element) => (
    element.getBoundingClientRect().bottom <= window.innerHeight
  ))).toBe(true);
  expect(await secondaryChapters.evaluate((element) => (
    element.getBoundingClientRect().bottom <= window.innerHeight
  ))).toBe(true);
});

test('root splash links to each independent site space', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.book-splash__chapters a')).toHaveCount(5);
  await expect(page.locator('.book-splash__chapters a[href="/blog/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/works/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/playroom/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/about/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/guestbook/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters--secondary a')).toHaveCount(2);
  await expect(page.locator('.book-splash__chapters:not(.book-splash__chapters--secondary) a')).toHaveCount(3);
  await expect(page.locator('.book-splash__chapters').first()).toContainText('Journal');
});

test('splash secondary links stay small and stacked at the lower left', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const secondary = page.locator('.book-splash__chapters--secondary');
  const face = page.locator('.book-splash__face');
  const secondaryBox = await secondary.boundingBox();
  const faceBox = await face.boundingBox();
  expect(secondaryBox).not.toBeNull();
  expect(faceBox).not.toBeNull();
  expect(secondaryBox!.x).toBeLessThan(faceBox!.x + 140);
  expect(await secondary.evaluate((element) => getComputedStyle(element).flexDirection)).toBe('column');
  expect(await secondary.locator('a').first().evaluate((element) => getComputedStyle(element).fontSize)).toBe('14px');

  const [aboutBox, guestbookBox] = await Promise.all([
    secondary.locator('a[href="/about/"]').boundingBox(),
    secondary.locator('a[href="/guestbook/"]').boundingBox(),
  ]);
  expect(aboutBox).not.toBeNull();
  expect(guestbookBox).not.toBeNull();
  expect(aboutBox!.y).toBeLessThan(guestbookBox!.y);

  await expect(secondary.locator('.book-splash__chapter-hint')).toHaveCount(0);
});

test('sidebar reading icons show collapse-style tooltips on hover and focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/');

  const controls = page.locator('.site-header__controls');
  const themeToggle = controls.locator('[data-theme-toggle]');
  const focusToggle = controls.locator('[data-focus-mode]');
  const searchButton = controls.locator('[data-search-open]');

  await expect(themeToggle.locator('.site-header__control-hint')).toHaveText('라이트 테마로 전환');
  await expect(focusToggle.locator('.site-header__control-hint')).toHaveText('집중해서 보기');
  await expect(searchButton.locator('.site-header__control-hint')).toHaveText('검색 열기');
  await expect(themeToggle.locator('.site-header__control-hint')).toBeHidden();
  await themeToggle.hover();
  await expect(themeToggle.locator('.site-header__control-hint')).toBeVisible();
  expect(await themeToggle.evaluate((element) => getComputedStyle(element).filter)).toBe('none');
  expect(await themeToggle.locator('.site-header__control-hint').evaluate((element) => {
    const style = getComputedStyle(element);
    return { filter: style.filter, textShadow: style.textShadow };
  })).toEqual({ filter: 'none', textShadow: 'none' });
  await focusToggle.focus();
  await expect(focusToggle.locator('.site-header__control-hint')).toBeVisible();
  expect(await focusToggle.evaluate((element) => getComputedStyle(element).filter)).toBe('none');
});

test('independent spaces show a standalone coming soon page', async ({ page }) => {
  for (const route of ['/works/', '/playroom/', '/about/']) {
    await page.goto(route);
    await expect(page.locator('.main-space-page')).toBeVisible();
    await expect(page.locator('.main-space-page')).toContainText('Coming soon');
    await expect(page.locator('.site-header')).toHaveCount(0);
  }
});

test('blog sidebar home and posts links stay inside the blog', async ({ page }) => {
  await page.goto('/blog/');

  await expect(page.locator('.site-header nav a[href="/blog/"] span')).toHaveText('Home');
  await expect(page.locator('.site-header nav a[href="/blog/posts/"] span')).toHaveText('Posts');
  await expect(page.locator('.site-header nav a[href="/guestbook/"]')).toHaveCount(0);

  await page.goto('/blog/posts/');
  await expect(page.locator('.site-header nav a[href="/blog/"]')).not.toHaveClass(/is-current/);
  await expect(page.locator('.site-header nav a[href="/blog/posts/"]')).toHaveClass(/is-current/);
});

test('blog home shows five recent posts', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator('.recent .post-card')).toHaveCount(5);
});

test('page opacity fade remains available when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/categories/Algorithm/');

  await expect(page.locator('.site-content')).toHaveCSS('animation-name', 'page-content-reveal');
  await expect(page.locator('.site-frame')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.page-loader__rule')).toHaveCSS('animation-name', 'none');
});

test('top scroll progress tracks the full document scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  const progress = page.locator('[data-scroll-progress]');
  const fill = progress.locator('.scroll-progress__fill');
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  await expect(progress).toHaveCSS('position', 'fixed');
  await expect(progress).toHaveCSS('overflow', 'hidden');
  await expect(fill).toHaveCSS('position', 'absolute');

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(progress).toHaveAttribute('aria-valuenow', '100');
});

test('blog lists recent posts with stable article links', async ({ page }) => {
  await page.goto('/blog/');

  const firstPost = page.locator('.post-card').first();
  await expect(firstPost).toBeVisible();
  await expect(firstPost.locator('h3 a')).toHaveAttribute('href', /^\/blog\/posts\/[a-z]+(?:-[a-z]+)*\/$/);
});

test('all posts are paginated in groups of ten', async ({ page }) => {
  await page.goto('/blog/posts/');
  await expect(page.locator('.post-card')).toHaveCount(10);
  await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveText('1');
  await expect(page.locator('[data-pagination]')).toHaveCSS('justify-content', 'center');
  await expect(page.locator('[data-pagination] [data-pagination-first]')).toHaveCount(0);
  await expect(page.locator('[data-pagination] [data-pagination-prev]')).toHaveCount(0);
  await expect(page.locator('[data-pagination] a[rel="next"]')).toHaveAttribute('href', '/blog/posts/2/');
  await expect(page.locator('[data-pagination] a[data-pagination-last]')).toHaveAttribute('href', '/blog/posts/3/');

  await page.goto('/blog/posts/2/');
  await expect(page.locator('.post-card')).toHaveCount(10);
  await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveText('2');
  await expect(page.locator('[data-pagination] a[data-pagination-first]')).toHaveAttribute('href', '/blog/posts/');
  await expect(page.locator('[data-pagination] a[data-pagination-first] svg')).toHaveCount(1);
  await expect(page.locator('[data-pagination] a[rel="prev"]')).toHaveAttribute('href', '/blog/posts/');
  await expect(page.locator('[data-pagination] a[data-pagination-prev] svg')).toHaveCount(1);
  await expect(page.locator('[data-pagination] a[rel="next"]')).toHaveAttribute('href', '/blog/posts/3/');
  await expect(page.locator('[data-pagination] a[data-pagination-next] svg')).toHaveCount(1);
  await expect(page.locator('[data-pagination] a[data-pagination-last]')).toHaveAttribute('href', '/blog/posts/3/');
  await expect(page.locator('[data-pagination] a[data-pagination-last] svg')).toHaveCount(1);

  await page.goto('/blog/posts/3/');
  await expect(page.locator('.post-card')).toHaveCount(9);
  await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveText('3');
  await expect(page.locator('[data-pagination] a[rel="prev"]')).toHaveAttribute('href', '/blog/posts/2/');
  await expect(page.locator('[data-pagination] a[data-pagination-first]')).toHaveAttribute('href', '/blog/posts/');
  await expect(page.locator('[data-pagination] [data-pagination-next]')).toHaveCount(0);
  await expect(page.locator('[data-pagination] [data-pagination-last]')).toHaveCount(0);
});

test('category lists over ten posts are paginated too', async ({ page }) => {
  await page.goto('/blog/categories/Study/');
  await expect(page.locator('.post-card')).toHaveCount(10);
  await expect(page.locator('[data-pagination] a[rel="next"]')).toHaveAttribute('href', '/blog/categories/Study/2/');

  await page.goto('/blog/categories/Study/2/');
  await expect(page.locator('.post-card')).toHaveCount(2);
  await expect(page.locator('[data-pagination] a[rel="prev"]')).toHaveAttribute('href', '/blog/categories/Study/');
  await expect(page.locator('[data-pagination]')).toHaveCSS('justify-content', 'center');
});

test('short pages fill at least the viewport height', async ({ page }) => {
  for (const route of ['/about/', '/blog/categories/', '/guestbook/', '/blog/posts/3/']) {
    await page.goto(route);
    expect(await page.locator('.site-content').evaluate((element) => (
      element.getBoundingClientRect().height >= window.innerHeight
    ))).toBe(true);
  }
});

test('sidebar keeps tools and reading controls in their intended locations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/');

  const sidebar = page.locator('.site-header');
  const controls = sidebar.locator('.site-header__controls');
  const themeToggle = controls.locator('[data-theme-toggle]');
  const focusToggle = controls.locator('[data-focus-mode]');
  const searchButton = controls.locator('[data-search-open]');

  await expect(sidebar.locator('nav a[href="/blog/tools/markdown-viewer/?home=1"]')).toHaveText('Markdown Viewer');
  await expect(sidebar.locator('nav a[href="/guestbook/"]')).toHaveCount(0);
  await expect(controls).toBeVisible();
  await expect(searchButton.locator('[data-search-icon="dark"]')).toBeVisible();
  await expect(searchButton.locator('.site-header__control-hint')).toHaveText('검색 열기');
  await expect(searchButton.locator('kbd')).toHaveCount(0);
  await expect(themeToggle).toBeVisible();
  await expect(themeToggle.locator('.site-header__control-hint')).toHaveText('라이트 테마로 전환');
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeHidden();
  await expect(focusToggle).toBeVisible();
  await expect(focusToggle.locator('.site-header__control-hint')).toHaveText('집중해서 보기');
  await expect(controls).toHaveCSS('justify-content', 'space-between');

  const [sidebarBottom, controlsBottom] = await Promise.all([
    sidebar.boundingBox(),
    controls.boundingBox(),
  ]);
  expect(sidebarBottom).not.toBeNull();
  expect(controlsBottom).not.toBeNull();
  expect(controlsBottom!.y + controlsBottom!.height).toBeGreaterThan(sidebarBottom!.y + sidebarBottom!.height - 120);

  const [searchBox, themeBox, focusBox] = await Promise.all([
    searchButton.boundingBox(),
    themeToggle.boundingBox(),
    focusToggle.boundingBox(),
  ]);
  expect(searchBox).not.toBeNull();
  expect(themeBox).not.toBeNull();
  expect(focusBox).not.toBeNull();
  expect(themeBox!.x).toBeLessThan(focusBox!.x);
  expect(focusBox!.x).toBeLessThan(searchBox!.x);

  await page.locator('[data-feature-toggle]').click();
  await expect(page.locator('[data-feature-panel]')).toBeVisible();
  await expect(page.locator('[data-feature-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-feature-panel]')).toHaveText('To be Continue');
  await expect(page.locator('[data-feature-panel] [data-theme-toggle]')).toHaveCount(0);
  await expect(page.locator('[data-feature-panel] [data-focus-mode]')).toHaveCount(0);
  await expect(themeToggle.locator('img[data-theme-icon="sun"]')).toHaveAttribute('src', '/images/theme-sun.png');
  await expect(themeToggle.locator('img[data-theme-icon="moon"]')).toHaveAttribute('src', '/images/theme-moon-dark.png');
  expect(await themeToggle.locator('img[data-theme-icon="moon"]').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeHidden();
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toHaveCSS('width', '28px');
  await expect(searchButton.locator('[data-search-icon="dark"]')).toHaveAttribute('src', '/images/search-eye-dark-embroidered.png');

  await searchButton.click();
  await expect(page.locator('[data-search-modal]')).toBeVisible();
  await expect(page.locator('.search-modal .pagefind-ui__search-input')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-search-modal]')).toBeHidden();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(themeToggle).toHaveAttribute('aria-checked', 'true');
  await expect(themeToggle.locator('.site-header__control-hint')).toHaveText('다크 테마로 전환');
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeHidden();
  await expect(searchButton.locator('[data-search-icon="light"]')).toBeVisible();
});

test('focus mode keeps a lower-left exit control visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  await page.locator('[data-focus-mode]').click();
  await expect(page.locator('html')).toHaveAttribute('data-focus-mode', '');
  await expect(page.locator('.site-header')).toBeHidden();

  const exitButton = page.locator('[data-focus-exit]');
  await expect(exitButton).toBeVisible();
  await expect(exitButton).toHaveAttribute('title', '집중 보기 종료');
  const exitBox = await exitButton.boundingBox();
  expect(exitBox).not.toBeNull();
  expect(exitBox!.x).toBeLessThan(48);
  expect(exitBox!.y).toBeGreaterThan(780);

  await exitButton.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-focus-mode');
  await expect(page.locator('.site-header')).toBeVisible();
});

test('home search opens the modal with the typed query', async ({ page }) => {
  await page.goto('/blog/');

  await page.locator('[data-home-search-input]').fill('git');
  await page.locator('[data-home-search-form]').press('Enter');

  await expect(page.locator('[data-search-modal]')).toBeVisible();
  await expect(page.locator('.search-modal .pagefind-ui__search-input')).toHaveValue('git');
});

test('article shows a wide mobile TOC below the header', async ({ page }) => {
  await page.goto('/blog/posts/git-reset-vs-git-revert/');

  const desktopToc = page.locator('.article__desktop-toc .table-of-contents__desktop');
  await expect(desktopToc).toBeVisible();
  await expect(desktopToc).toHaveCSS('position', 'sticky');
  await expect(page.locator('.article__desktop-toc details.table-of-contents__mobile')).toBeHidden();

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(desktopToc).toBeHidden();
  await expect(page.locator('.article__mobile-toc .table-of-contents__desktop')).toBeHidden();
  await expect(page.locator('.article__mobile-toc details.table-of-contents__mobile')).toBeVisible();
});

test('article initial load does not inject a TOC hash or jump the scroll position', async ({ page }) => {
  await page.goto('/blog/posts/macos-space/');
  await page.waitForTimeout(300);

  expect(new URL(page.url()).hash).toBe('');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('long desktop TOC scrolls independently within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/blog/posts/macos-space/');

  const toc = page.locator('.article__desktop-toc .table-of-contents__desktop');
  await toc.hover();
  await expect(toc).toHaveCSS('overflow-y', 'auto');
  const metrics = await toc.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(metrics.height).toBeLessThanOrEqual(700 - 64);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
});

test('sidebar and desktop TOC keep their top offsets when scrolling begins', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  const sidebar = page.locator('.site-header');
  const toc = page.locator('.article__desktop-toc .table-of-contents__desktop');
  const initial = {
    sidebarTop: (await sidebar.boundingBox())!.y,
    tocTop: (await toc.boundingBox())!.y,
  };

  await page.evaluate(() => window.scrollTo(0, 40));

  expect((await sidebar.boundingBox())!.y).toBe(initial.sidebarTop);
  expect((await toc.boundingBox())!.y).toBe(initial.tocTop);
});

test('desktop TOC aligns to the right edge of the content viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  const toc = await page.locator('.article__desktop-toc').boundingBox();
  const article = await page.locator('.article').boundingBox();
  const content = await page.locator('.site-content').boundingBox();
  expect(toc).not.toBeNull();
  expect(article).not.toBeNull();
  expect(content).not.toBeNull();
  expect(toc!.x + toc!.width).toBe(content!.x + content!.width - 16);
  const tocBreathingGap = 32;
  expect(Math.abs(
    (article!.x + (article!.width / 2)) - ((content!.x + toc!.x - tocBreathingGap) / 2),
  )).toBeLessThan(1);
});

test('desktop article and TOC keep a breathing gap near the layout breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1240, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  const article = await page.locator('.article').boundingBox();
  const toc = await page.locator('.article__desktop-toc').boundingBox();
  expect(article).not.toBeNull();
  expect(toc).not.toBeNull();
  expect(toc!.x - (article!.x + article!.width)).toBeGreaterThanOrEqual(32);
});

test('desktop TOC starts as a rail and expands on hover', async ({ page }) => {
  for (const width of [1240, 1680]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/blog/posts/macos-space/');

    const article = page.locator('.article');
    const toc = page.locator('.article__desktop-toc');
    const tocList = toc.locator('.table-of-contents__desktop > ol');
    const collapsedWidth = (await article.boundingBox())!.width;

    await expect(toc).toHaveAttribute('data-toc-collapsed');
    await expect(toc).toBeVisible();
    await expect(toc.locator('.table-of-contents__collapsed-preview')).toBeVisible();
    await expect(toc.locator('[data-toc-preview]')).toHaveCount(
      await page.locator('.article__desktop-toc a').evaluateAll(
        (links) => new Set(
          links
            .filter((link) => link.closest('li')?.className.includes('depth-2'))
            .map((link) => link.getAttribute('href')),
        ).size,
      ),
    );
    await expect(tocList).toBeHidden();

    await toc.locator('.table-of-contents__desktop').hover();
    await expect(tocList).toBeVisible();
    await expect.poll(async () => (await article.boundingBox())!.width).toBe(collapsedWidth);
    await expect.poll(async () => (await toc.boundingBox())!.width).toBeGreaterThan(40);

    await page.locator('.article h1').hover();
    await expect(tocList).toBeHidden();
    await expect.poll(async () => (await article.boundingBox())!.width).toBe(collapsedWidth);
  }
});

test('the 900px breakpoint uses the wide mobile TOC', async ({ page }) => {
  for (const width of [390, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/blog/posts/macos-space/');

    await expect(page.locator('.site-frame')).toHaveCSS('display', 'block');
    expect((await page.locator('.site-header').boundingBox())!.height).toBeLessThan(200);
    await expect(page.locator('.site-header nav')).toHaveCSS('flex-direction', 'row');
    await expect(page.locator('.site-header nav')).toHaveCSS('justify-content', 'space-between');
    await expect(page.locator('.article__desktop-toc')).toBeHidden();
    await expect(page.locator('.article__mobile-toc .table-of-contents__mobile')).toBeVisible();
    await expect(page.locator('[data-toc-top-toggle]')).toBeHidden();
  }
});

test('blog navigation hides on downward scroll and returns on upward scroll', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  const header = page.locator('.site-header');
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(header).toHaveAttribute('data-scroll-hidden');

  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(header).not.toHaveAttribute('data-scroll-hidden');
});

test('sidebar mode keeps the left sidebar fixed while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  const sidebar = page.locator('.site-header');
  const initial = await sidebar.boundingBox();
  await page.evaluate(() => window.scrollTo(0, 500));

  await expect(sidebar).not.toHaveAttribute('data-scroll-hidden');
  const scrolled = await sidebar.boundingBox();
  expect(scrolled).not.toBeNull();
  expect(scrolled!.y).toBe(initial!.y);
});

test('desktop TOC updates its active color and URL hash as headings pass', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/posts/git-reset-vs-git-revert/');

  await page.locator('#특징').evaluate((heading) => {
    const top = heading.getBoundingClientRect().top + window.scrollY - 40;
    window.scrollTo(0, top);
  });

  const activeLink = page.locator('.article__desktop-toc nav a[href="#특징"]');
  const inactiveLink = page.locator('.article__desktop-toc nav a[href="#git-revert"]');
  const parentLink = page.locator('.article__desktop-toc nav a[href="#git-reset"]');
  await expect(activeLink).toHaveAttribute('aria-current', 'location');
  await expect(parentLink).toHaveAttribute('aria-current', 'location');
  await expect.poll(() => page.evaluate(() => decodeURIComponent(window.location.hash))).toBe('#특징');
  expect(await activeLink.evaluate((link) => getComputedStyle(link).color))
    .not.toBe(await inactiveLink.evaluate((link) => getComputedStyle(link).color));
  await expect(page.locator('.article__desktop-toc [data-toc-preview="git-reset"]'))
    .toHaveAttribute('data-active');
  await expect(page.locator('.article__desktop-toc [data-toc-preview="특징"]')).toHaveCount(0);
});

test('clicking a heading keeps that heading active until the next heading passes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/posts/macos-space/');

  await page.locator('.article__desktop-toc nav a[href="#5-recovery-mode에서-sip-부분-해제하기"]').click();

  await expect(page.locator('.article__desktop-toc nav a[href="#5-recovery-mode에서-sip-부분-해제하기"]'))
    .toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.article__desktop-toc nav a[href="#왜-필요한가"]'))
    .not.toHaveAttribute('aria-current', 'location');
});

test('article metadata keeps the publication date in Asia/Seoul', async ({ page }) => {
  await page.goto('/blog/posts/macos-xcrun-error-invalied-active-developer-path/');

  await expect(page.locator('.article-meta time')).toHaveText('2022년 12월 2일');
});

test('narrow articles do not create document-level horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });

  for (const slug of [
    'database-erd-quickdbd-erd-drawing',
    'macos-xcrun-error-invalied-active-developer-path',
    'python-django-aws-ec-github',
  ]) {
    await page.goto(`/blog/posts/${slug}/`);
    expect(await page.locator('html').evaluate(
      (element) => element.scrollWidth === element.clientWidth,
    )).toBe(true);
  }

  const codeBlock = page.locator('pre').first();
  await expect(codeBlock).toHaveCSS('overflow-x', 'auto');
  expect(await codeBlock.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
});

test('long code stays horizontally scrollable inside its shell', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/blog/posts/telegram-bot/');

  const shell = page.locator('.code-shell').first();
  const codePanel = shell.locator('pre');
  const customScrollbar = shell.locator('.code-shell__scrollbar');
  const customThumb = customScrollbar.getByRole('scrollbar');

  await expect(codePanel).toHaveCSS('overflow-x', 'auto');
  await expect(codePanel).toHaveCSS('overscroll-behavior-x', 'contain');
  expect(await codePanel.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await expect(customScrollbar).toBeVisible();
  await expect(customThumb).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(customThumb).toHaveAttribute('aria-valuenow', '0');

  await customThumb.focus();
  await page.keyboard.press('End');

  await expect(customThumb).toHaveAttribute('aria-valuenow', '100');
  expect(await codePanel.evaluate(
    (element) => Math.round(element.scrollLeft + element.clientWidth) === element.scrollWidth,
  )).toBe(true);

  await page.keyboard.press('Home');
  const thumbBox = await customThumb.boundingBox();
  const trackBox = await customScrollbar.locator('.code-shell__scrollbar-track').boundingBox();
  expect(thumbBox).not.toBeNull();
  expect(trackBox).not.toBeNull();

  await page.mouse.move(thumbBox!.x + (thumbBox!.width / 2), thumbBox!.y + (thumbBox!.height / 2));
  await page.mouse.down();
  await page.mouse.move(trackBox!.x + trackBox!.width - 2, thumbBox!.y + (thumbBox!.height / 2));
  await page.mouse.up();

  expect(await codePanel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.locator('html').evaluate(
    (element) => element.scrollWidth === element.clientWidth,
  )).toBe(true);
});

test('short markdown tables fit their content instead of stretching to the article width', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/blog/posts/telegram-bot/');

  const content = await page.locator('.article__content').boundingBox();
  const table = page.locator('.article__content table').first();
  const tableBox = await table.boundingBox();

  expect(content).not.toBeNull();
  expect(tableBox).not.toBeNull();
  expect(tableBox!.width).toBeLessThan(content!.width);
});

test('markdown code blocks show a shell marker and individually dismissible copy confirmations', async ({ page }) => {
  await page.goto('/blog/posts/telegram-bot/');

  const shell = page.locator('.code-shell').first();
  await expect(shell.locator('.code-shell__marker')).toHaveText('>_');

  const copyButton = shell.getByRole('button', { name: 'Copy code' });
  await copyButton.click();
  await copyButton.click();

  const toasts = page.locator('.code-copy-toast');
  await expect(toasts).toHaveCount(2);
  await expect(toasts.first()).toHaveText(/Copied to clipboard/);
  await expect(toasts.first()).toHaveCSS('animation-name', 'code-copy-toast-rise');

  await toasts.first().getByRole('button', { name: 'Dismiss copy confirmation' }).click();
  await expect(toasts).toHaveCount(1);
  await expect(toasts).toHaveCount(0, { timeout: 3500 });
});

test('code shells use theme-specific textured surfaces', async ({ page }) => {
  await page.goto('/blog/posts/telegram-bot/');

  const shell = page.locator('.code-shell').first();
  const codePanel = shell.locator('pre');
  const shellHeader = shell.locator('.code-shell__header');
  const darkSurface = await shell.evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    texture: getComputedStyle(element, '::before').backgroundImage,
    textureBlend: getComputedStyle(element, '::before').backgroundBlendMode,
    textureColor: getComputedStyle(element, '::before').backgroundColor,
    textureOpacity: getComputedStyle(element, '::before').opacity,
  }));

  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'light';
  });

  const lightSurface = await shell.evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    texture: getComputedStyle(element, '::before').backgroundImage,
    textureBlend: getComputedStyle(element, '::before').backgroundBlendMode,
    textureColor: getComputedStyle(element, '::before').backgroundColor,
    textureOpacity: getComputedStyle(element, '::before').opacity,
  }));

  expect(darkSurface.color).not.toBe(lightSurface.color);
  expect(darkSurface.texture).not.toBe('none');
  expect(darkSurface.texture).toContain('code-shell-texture.webp');
  expect(darkSurface.textureBlend).toContain('luminosity');
  expect(darkSurface.textureColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(darkSurface.textureOpacity).toBe('0.72');
  expect(lightSurface.texture).not.toBe(darkSurface.texture);
  expect(lightSurface.textureColor).not.toBe(darkSurface.textureColor);
  expect(lightSurface.color).toBe('rgb(210, 206, 198)');
  expect(lightSurface.texture).toContain('light-code-shell-texture-v2.webp');
  expect(lightSurface.textureBlend).toContain('multiply');
  expect(lightSurface.textureOpacity).toBe('0.32');
  await expect(codePanel).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(codePanel).toHaveCSS('color', 'rgb(47, 48, 50)');
  await expect(shellHeader).toHaveCSS('background-color', 'rgb(195, 189, 179)');
  const customThumb = shell.locator('.code-shell__scrollbar-thumb');
  const lightScrollbar = await customThumb.evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    texture: getComputedStyle(element, '::before').backgroundImage,
  }));
  expect(lightScrollbar.texture).toContain('light-code-shell-texture-v2.webp');

  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'midnight';
  });

  const darkScrollbar = await customThumb.evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    texture: getComputedStyle(element, '::before').backgroundImage,
  }));
  expect(darkScrollbar.color).not.toBe(lightScrollbar.color);
  expect(darkScrollbar.texture).toContain('code-shell-texture.webp');
  const headerTexture = await shellHeader.evaluate(
    (element) => getComputedStyle(element, '::before').backgroundImage,
  );
  expect(headerTexture).toContain('code-shell-texture.webp');
  expect(await shellHeader.evaluate((element) => getComputedStyle(element, '::before').backgroundPosition))
    .not.toBe(await shell.evaluate((element) => getComputedStyle(element, '::before').backgroundPosition));
});

test('table headers share the texture asset while light code headers use a quieter darker treatment', async ({ page }) => {
  await page.goto('/blog/posts/telegram-bot/');

  const tableHeader = page.locator('.article__content thead').first();
  const codeHeader = page.locator('.article__content .code-shell__header').first();

  for (const theme of ['midnight', 'light']) {
    await page.locator('html').evaluate((element, nextTheme) => {
      element.dataset.theme = nextTheme;
    }, theme);

    const readHeaderSurface = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const texture = getComputedStyle(element, '::before');

      return {
        backgroundColor: style.backgroundColor,
        content: texture.content,
        image: texture.backgroundImage,
        blend: texture.backgroundBlendMode,
        opacity: texture.opacity,
        position: texture.backgroundPosition,
        repeat: texture.backgroundRepeat,
        size: texture.backgroundSize,
        filter: texture.filter,
      };
    };

    const tableSurface = await tableHeader.evaluate(readHeaderSurface);
    const codeSurface = await codeHeader.evaluate(readHeaderSurface);

    expect(tableSurface.content).toBe('\"\"');
    expect(tableSurface.image).toContain(
      theme === 'light' ? 'light-code-shell-texture-v2.webp' : 'code-shell-texture.webp',
    );
    expect(tableSurface.blend).toContain(theme === 'light' ? 'multiply' : 'luminosity');
    expect(tableSurface.repeat).toContain('repeat');
    expect(tableSurface.size).toContain('576px');

    if (theme === 'light') {
      expect(tableSurface.backgroundColor).toBe('rgb(221, 216, 206)');
      expect(codeSurface.backgroundColor).toBe('rgb(195, 189, 179)');
      expect(codeSurface.image).toContain('light-code-shell-texture-v2.webp');
      expect(tableSurface.opacity).toBe('0.52');
      expect(codeSurface.opacity).toBe('0.32');
      expect(tableSurface.image).not.toBe(codeSurface.image);
      expect(tableSurface.backgroundColor).not.toBe(codeSurface.backgroundColor);
    } else {
      expect(tableSurface).toEqual(codeSurface);
    }
  }

  await expect(tableHeader.locator('th').first()).toHaveCSS('background-image', 'none');
});

test('TOC omits headings without a target or label', async ({ page }) => {
  await page.goto('/blog/posts/algorithm-java-swea/');

  await expect(page.locator('.table-of-contents__desktop a[href="#"]')).toHaveCount(0);
  const labels = await page.locator('.table-of-contents__desktop a').allTextContents();
  expect(labels.every((label) => label.trim().length > 0)).toBe(true);
});

import { expect, test } from '@playwright/test';

test('sealed-volume splash keeps its chapter navigation inside the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const chapters = page.locator('.book-splash__chapters');
  await expect(chapters).toBeVisible();
  expect(await chapters.evaluate((element) => (
    element.getBoundingClientRect().bottom <= window.innerHeight
  ))).toBe(true);
});

test('root splash links to each independent site space', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.book-splash__chapters a')).toHaveCount(4);
  await expect(page.locator('.book-splash__chapters a[href="/blog/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/works/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/playroom/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapters a[href="/about/"]')).toBeVisible();
  await expect(page.locator('.book-splash__chapter-index')).toHaveText(/I|II|III|IV/);
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

  await expect(page.locator('.site-frame')).toHaveCSS('animation-name', 'page-content-reveal');
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

test('sidebar search matches the primary navigation while feature controls stay compact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/');

  const controls = page.locator('.feature-bundle__controls');
  await page.locator('[data-feature-toggle]').click();
  await expect(page.locator('[data-feature-panel]')).toBeVisible();
  await expect(page.locator('[data-feature-toggle]')).toHaveAttribute('aria-expanded', 'true');
  const themeToggle = controls.locator('[data-theme-toggle]');
  const searchButton = page.locator('.site-header nav [data-search-open]');
  const [themeBox, searchBox] = await Promise.all([themeToggle.boundingBox(), searchButton.boundingBox()]);

  expect(themeBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(searchBox!.width).toBeGreaterThan(80);
  await expect(controls).toHaveCSS('display', 'flex');
  await expect(controls).toHaveCSS('justify-content', 'flex-start');
  await expect(themeToggle).not.toHaveAttribute('class');
  await expect(searchButton).not.toHaveAttribute('class');
  await expect(themeToggle.locator('img[data-theme-icon="sun"]')).toHaveAttribute('src', '/images/theme-sun.png');
  await expect(themeToggle.locator('img[data-theme-icon="moon"]')).toHaveAttribute('src', '/images/theme-moon-dark.png');
  expect(await themeToggle.locator('img[data-theme-icon="moon"]').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeHidden();
  await expect(searchButton.locator('span')).toHaveText('Search');
  await expect(searchButton.locator('svg')).toHaveCount(0);
  await expect(searchButton).toHaveCSS('font-family', /Cormorant/);
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toHaveCSS('width', '28px');
  await expect(searchButton).toHaveCSS('border-top-width', '0px');
  await expect(searchButton).toHaveCSS('background-image', 'none');

  await searchButton.click();
  await expect(page.locator('[data-search-modal]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-search-modal]')).toBeHidden();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(themeToggle).toHaveAttribute('aria-checked', 'true');
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeHidden();
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeVisible();
  await expect(searchButton.locator('span')).toBeVisible();
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
  }));

  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'light';
  });

  const lightSurface = await shell.evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    texture: getComputedStyle(element, '::before').backgroundImage,
  }));

  expect(darkSurface.color).not.toBe(lightSurface.color);
  expect(darkSurface.texture).not.toBe('none');
  expect(darkSurface.texture).toContain('code-shell-texture.webp');
  expect(lightSurface.texture).not.toBe(darkSurface.texture);
  await expect(codePanel).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(codePanel).toHaveCSS('color', 'rgb(31, 35, 40)');
  await expect(shellHeader).toHaveCSS('background-color', 'rgb(230, 234, 237)');
  const customThumb = shell.locator('.code-shell__scrollbar-thumb');
  const lightScrollbar = await customThumb.evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    texture: getComputedStyle(element, '::before').backgroundImage,
  }));
  expect(lightScrollbar.texture).toContain('code-shell-texture.webp');

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

test('TOC omits headings without a target or label', async ({ page }) => {
  await page.goto('/blog/posts/algorithm-java-swea/');

  await expect(page.locator('.table-of-contents__desktop a[href="#"]')).toHaveCount(0);
  const labels = await page.locator('.table-of-contents__desktop a').allTextContents();
  expect(labels.every((label) => label.trim().length > 0)).toBe(true);
});

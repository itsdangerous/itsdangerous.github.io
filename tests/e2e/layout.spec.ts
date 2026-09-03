import { expect, test } from '@playwright/test';

test('home lists recent posts with stable article links', async ({ page }) => {
  await page.goto('/');

  const firstPost = page.locator('.post-card').first();
  await expect(firstPost).toBeVisible();
  await expect(firstPost.locator('h3 a')).toHaveAttribute('href', /^\/posts\/[a-z]+(?:-[a-z]+)*\/$/);
});

test('all posts are paginated in groups of ten', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.locator('.post-card')).toHaveCount(10);
  await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveText('1');
  await expect(page.locator('[data-pagination]')).toHaveCSS('justify-content', 'center');
  await expect(page.locator('[data-pagination] [data-pagination-first]')).toHaveCount(0);
  await expect(page.locator('[data-pagination] [data-pagination-prev]')).toHaveCount(0);
  await expect(page.locator('[data-pagination] a[rel="next"]')).toHaveAttribute('href', '/posts/2/');
  await expect(page.locator('[data-pagination] a[data-pagination-last]')).toHaveAttribute('href', '/posts/3/');

  await page.goto('/posts/2/');
  await expect(page.locator('.post-card')).toHaveCount(10);
  await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveText('2');
  await expect(page.locator('[data-pagination] a[data-pagination-first]')).toHaveAttribute('href', '/posts/');
  await expect(page.locator('[data-pagination] a[data-pagination-first] svg')).toHaveCount(1);
  await expect(page.locator('[data-pagination] a[rel="prev"]')).toHaveAttribute('href', '/posts/');
  await expect(page.locator('[data-pagination] a[data-pagination-prev] svg')).toHaveCount(1);
  await expect(page.locator('[data-pagination] a[rel="next"]')).toHaveAttribute('href', '/posts/3/');
  await expect(page.locator('[data-pagination] a[data-pagination-next] svg')).toHaveCount(1);
  await expect(page.locator('[data-pagination] a[data-pagination-last]')).toHaveAttribute('href', '/posts/3/');
  await expect(page.locator('[data-pagination] a[data-pagination-last] svg')).toHaveCount(1);

  await page.goto('/posts/3/');
  await expect(page.locator('.post-card')).toHaveCount(9);
  await expect(page.locator('[data-pagination] [aria-current="page"]')).toHaveText('3');
  await expect(page.locator('[data-pagination] a[rel="prev"]')).toHaveAttribute('href', '/posts/2/');
  await expect(page.locator('[data-pagination] a[data-pagination-first]')).toHaveAttribute('href', '/posts/');
  await expect(page.locator('[data-pagination] [data-pagination-next]')).toHaveCount(0);
  await expect(page.locator('[data-pagination] [data-pagination-last]')).toHaveCount(0);
});

test('category lists over ten posts are paginated too', async ({ page }) => {
  await page.goto('/categories/Study/');
  await expect(page.locator('.post-card')).toHaveCount(10);
  await expect(page.locator('[data-pagination] a[rel="next"]')).toHaveAttribute('href', '/categories/Study/2/');

  await page.goto('/categories/Study/2/');
  await expect(page.locator('.post-card')).toHaveCount(2);
  await expect(page.locator('[data-pagination] a[rel="prev"]')).toHaveAttribute('href', '/categories/Study/');
  await expect(page.locator('[data-pagination]')).toHaveCSS('justify-content', 'center');
});

test('short pages fill at least the viewport height', async ({ page }) => {
  for (const route of ['/about/', '/categories/', '/guestbook/', '/posts/3/']) {
    await page.goto(route);
    expect(await page.locator('.site-content').evaluate((element) => (
      element.getBoundingClientRect().height >= window.innerHeight
    ))).toBe(true);
  }
});

test('sidebar controls stay compact and left-aligned without styling wrapper classes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const controls = page.locator('.site-header__controls');
  const themeToggle = controls.locator('[data-theme-toggle]');
  const searchButton = controls.locator('[data-search-open]');
  const [themeBox, searchBox] = await Promise.all([
    themeToggle.boundingBox(),
    searchButton.boundingBox(),
  ]);

  expect(themeBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(searchBox!.x - (themeBox!.x + themeBox!.width)).toBeLessThanOrEqual(12);
  await expect(controls).toHaveCSS('display', 'flex');
  await expect(controls).toHaveCSS('justify-content', 'flex-start');
  await expect(themeToggle).not.toHaveAttribute('class');
  await expect(searchButton).not.toHaveAttribute('class');
  await expect(themeToggle.locator('img[data-theme-icon="sun"]')).toHaveAttribute('src', '/images/theme-sun.png');
  await expect(themeToggle.locator('img[data-theme-icon="moon"]')).toHaveAttribute('src', '/images/theme-moon-dark.png');
  await expect(searchButton.locator('img[data-search-icon="dark"]')).toHaveAttribute('src', '/images/search-eye-dark.png');
  await expect(searchButton.locator('img[data-search-icon="light"]')).toHaveAttribute('src', '/images/search-eye-light.png');
  expect(await themeToggle.locator('img[data-theme-icon="moon"]').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await searchButton.locator('img[data-search-icon="dark"]').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeHidden();
  await expect(searchButton.locator('[data-search-icon="dark"]')).toBeVisible();
  await expect(searchButton.locator('[data-search-icon="light"]')).toBeHidden();
  await expect(searchButton.locator('[data-search-shortcut]')).toHaveCSS('color', 'rgb(195, 154, 88)');
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toHaveCSS('width', '28px');
  await expect(searchButton).toHaveCSS('border-top-width', '0px');
  await expect(searchButton).toHaveCSS('background-image', 'none');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(themeToggle).toHaveAttribute('aria-checked', 'true');
  await expect(themeToggle.locator('[data-theme-icon="moon"]')).toBeHidden();
  await expect(themeToggle.locator('[data-theme-icon="sun"]')).toBeVisible();
  await expect(searchButton.locator('[data-search-icon="dark"]')).toBeHidden();
  await expect(searchButton.locator('[data-search-icon="light"]')).toBeVisible();
  await expect(searchButton.locator('[data-search-shortcut]')).toHaveCSS('color', 'rgb(139, 106, 67)');
});

test('article shows a sticky desktop TOC and a mobile disclosure', async ({ page }) => {
  await page.goto('/posts/git-reset-vs-git-revert/');

  const desktopToc = page.locator('.article__desktop-toc .table-of-contents__desktop');
  await expect(desktopToc).toBeVisible();
  await expect(desktopToc).toHaveCSS('position', 'sticky');
  await expect(page.locator('.article__desktop-toc details.table-of-contents__mobile')).toBeHidden();

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(desktopToc).toBeHidden();
  await expect(page.locator('.article__mobile-toc details.table-of-contents__mobile')).toBeVisible();
});

test('long desktop TOC scrolls independently within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/posts/macos-space/');

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

test('desktop TOC aligns to the right edge of the content viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/posts/macos-space/');

  const toc = await page.locator('.article__desktop-toc').boundingBox();
  const content = await page.locator('.site-content').boundingBox();
  expect(toc).not.toBeNull();
  expect(content).not.toBeNull();
  expect(toc!.x + toc!.width).toBe(content!.x + content!.width);
});

test('desktop TOC updates its active color and URL hash as headings pass', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/posts/git-reset-vs-git-revert/');

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
});

test('clicking a heading keeps that heading active until the next heading passes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/posts/macos-space/');

  await page.locator('.article__desktop-toc nav a[href="#5-recovery-mode에서-sip-부분-해제하기"]').click();

  await expect(page.locator('.article__desktop-toc nav a[href="#5-recovery-mode에서-sip-부분-해제하기"]'))
    .toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.article__desktop-toc nav a[href="#왜-필요한가"]'))
    .not.toHaveAttribute('aria-current', 'location');
});

test('article metadata keeps the Tistory date in Asia/Seoul', async ({ page }) => {
  await page.goto('/posts/macos-xcrun-error-invalied-active-developer-path/');

  await expect(page.locator('.article-meta time')).toHaveText('2022년 12월 2일');
});

test('narrow articles do not create document-level horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });

  for (const slug of [
    'database-erd-quickdbd-erd-drawing',
    'macos-xcrun-error-invalied-active-developer-path',
    'python-django-aws-ec-github',
  ]) {
    await page.goto(`/posts/${slug}/`);
    expect(await page.locator('html').evaluate(
      (element) => element.scrollWidth === element.clientWidth,
    )).toBe(true);
  }

  const codeBlock = page.locator('pre').first();
  await expect(codeBlock).toHaveCSS('overflow-x', 'auto');
  expect(await codeBlock.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
});

test('short markdown tables fit their content instead of stretching to the article width', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/posts/telegram-bot/');

  const content = await page.locator('.article__content').boundingBox();
  const table = page.locator('.article__content table').first();
  const tableBox = await table.boundingBox();

  expect(content).not.toBeNull();
  expect(tableBox).not.toBeNull();
  expect(tableBox!.width).toBeLessThan(content!.width);
});

test('markdown code blocks show a shell marker and individually dismissible copy confirmations', async ({ page }) => {
  await page.goto('/posts/telegram-bot/');

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
});

test('code shells use theme-specific textured surfaces', async ({ page }) => {
  await page.goto('/posts/telegram-bot/');

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
  const headerTexture = await shellHeader.evaluate(
    (element) => getComputedStyle(element, '::before').backgroundImage,
  );
  expect(headerTexture).toContain('code-shell-texture.webp');
  expect(await shellHeader.evaluate((element) => getComputedStyle(element, '::before').backgroundPosition))
    .not.toBe(await shell.evaluate((element) => getComputedStyle(element, '::before').backgroundPosition));
});

test('TOC omits headings without a target or label', async ({ page }) => {
  await page.goto('/posts/algorithm-java-swea/');

  await expect(page.locator('.table-of-contents__desktop a[href="#"]')).toHaveCount(0);
  const labels = await page.locator('.table-of-contents__desktop a').allTextContents();
  expect(labels.every((label) => label.trim().length > 0)).toBe(true);
});

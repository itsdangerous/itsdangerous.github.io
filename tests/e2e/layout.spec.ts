import { expect, test } from '@playwright/test';

test('home lists recent posts with stable article links', async ({ page }) => {
  await page.goto('/');

  const firstPost = page.locator('.post-card').first();
  await expect(firstPost).toBeVisible();
  await expect(firstPost.locator('h3 a')).toHaveAttribute('href', /^\/posts\/[a-z]+(?:-[a-z]+)*\/$/);
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

test('TOC omits headings without a target or label', async ({ page }) => {
  await page.goto('/posts/algorithm-java-swea/');

  await expect(page.locator('.table-of-contents__desktop a[href="#"]')).toHaveCount(0);
  const labels = await page.locator('.table-of-contents__desktop a').allTextContents();
  expect(labels.every((label) => label.trim().length > 0)).toBe(true);
});

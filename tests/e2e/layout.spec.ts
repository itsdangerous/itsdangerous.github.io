import { expect, test } from '@playwright/test';

test('home lists recent posts with stable article links', async ({ page }) => {
  await page.goto('/');

  const firstPost = page.locator('.post-card').first();
  await expect(firstPost).toBeVisible();
  await expect(firstPost.locator('h3 a')).toHaveAttribute('href', /^\/posts\/[a-z]+(?:-[a-z]+)*\/$/);
});

test('article shows a sticky desktop TOC and a mobile disclosure', async ({ page }) => {
  await page.goto('/posts/git-reset-vs-git-revert/');

  const desktopToc = page.locator('.article__desktop-toc .table-of-contents__desktop');
  await expect(desktopToc).toBeVisible();
  await expect(desktopToc).toHaveCSS('position', 'sticky');

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(desktopToc).toBeHidden();
  await expect(page.locator('.article__mobile-toc details.table-of-contents__mobile')).toBeVisible();
});

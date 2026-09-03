import { expect, test } from '@playwright/test';

test('theme menu persists the selected theme after reload', async ({ page }) => {
  await page.goto('/blog/');

  const picker = page.getByRole('switch');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
  await picker.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('Pagefind search results navigate to the matching article', async ({ page }) => {
  await page.goto('/blog/search/');

  const search = page.locator('#pagefind-search input').first();
  await expect(search).toBeVisible();
  await search.fill('git reset');

  const result = page.locator('a.pagefind-ui__result-link[href="/blog/posts/git-reset-vs-git-revert/"]');
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/blog\/posts\/git-reset-vs-git-revert\/(?:#.*)?$/);
});

test('article comments use the public pathname Giscus mapping without login', async ({ page }) => {
  await page.route('https://giscus.app/**', (route) => route.abort());
  await page.goto('/blog/posts/git-reset-vs-git-revert/');

  const giscus = page.locator('[data-giscus-root]');
  await expect(giscus).toHaveAttribute('data-repo', 'itsdangerous/test-discussions');
  await expect(giscus).toHaveAttribute('data-repo-id', 'R_kgDOtest');
  await expect(giscus).toHaveAttribute('data-category', 'Announcements');
  await expect(giscus).toHaveAttribute('data-category-id', 'DIC_kwDOtest');
  await expect(giscus).toHaveAttribute('data-mapping', 'pathname');
});

test('guestbook exposes its configured Giscus discussion route without login', async ({ page }) => {
  await page.route('https://giscus.app/**', (route) => route.abort());
  await page.goto('/guestbook/');

  await expect(page).toHaveURL('/guestbook/');
  await expect(page.getByRole('heading', { name: '방명록' })).toBeVisible();
  const giscus = page.locator('[data-giscus-root]');
  await expect(giscus).toHaveAttribute('data-mapping', 'number');
  await expect(giscus).toHaveAttribute('data-discussion-number', '42');
});

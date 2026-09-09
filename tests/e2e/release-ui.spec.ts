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

test('article comments use the canonical page key without login', async ({ page }) => {
  await page.route('**/api/comments?**', route => route.fulfill({ json: { items: [], total: 0, next: null } }));
  await page.goto('/blog/posts/git-reset-vs-git-revert/');

  await expect(page.locator('[data-comments]')).toHaveAttribute('data-page', '/blog/posts/git-reset-vs-git-revert/');
  await expect(page.locator('[data-compose]')).toBeVisible();
});

test('guestbook has a separate anonymous comment page', async ({ page }) => {
  await page.route('**/api/comments?**', route => route.fulfill({ json: { items: [], total: 0, next: null } }));
  await page.goto('/guestbook/');

  await expect(page).toHaveURL('/guestbook/');
  await expect(page.getByRole('heading', { name: '방명록' })).toBeVisible();
  await expect(page.locator('[data-comments]')).toHaveAttribute('data-page', '/guestbook/');
  await expect(page.getByRole('button', { name: '인사 남기기' })).toBeVisible();
});

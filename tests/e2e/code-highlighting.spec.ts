import { expect, test } from '@playwright/test';

test('light theme preserves Shiki token colors inside syntax-highlighted code blocks', async ({ page }) => {
  await page.goto('/blog/posts/algorithm-java-swea/');

  const codeBlock = page.locator('pre[data-language="java"]').first();
  await expect(codeBlock).toBeVisible();

  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'light';
  });

  const tokenColors = await codeBlock.locator('code span[style*="color"]').evaluateAll((tokens) => (
    [...new Set(tokens.map((token) => getComputedStyle(token).color))]
  ));

  expect(tokenColors.length).toBeGreaterThan(2);
});

test('light theme remaps Bash options from bright blue to muted ink', async ({ page }) => {
  await page.goto('/blog/posts/macos-space/');

  const codeBlock = page.locator('pre[data-language="bash"]').nth(1);
  await expect(codeBlock).toBeVisible();

  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'light';
  });

  const tokenColors = await codeBlock.locator('code span[style*="color"]').evaluateAll((tokens) => (
    [...new Set(tokens.map((token) => getComputedStyle(token).color))]
  ));

  expect(tokenColors).not.toContain('rgb(121, 184, 255)');
  expect(tokenColors).toContain('rgb(73, 109, 134)');
});

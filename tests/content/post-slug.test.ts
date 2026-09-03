import { describe, expect, it } from 'vitest';
import { getPostSlug } from '../../src/domains/blog/content/post-slug';

describe('blog post slug', () => {
  it('derives a stable URL slug from a content-layer id', () => {
    expect(getPostSlug({ id: 'Study/telegram-bot.md' })).toBe('telegram-bot');
    expect(getPostSlug({ id: 'git-reset-vs-git-revert' })).toBe('git-reset-vs-git-revert');
  });
});

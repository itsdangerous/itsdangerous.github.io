import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('domain boundaries', () => {
  it('defines the site domain roots', () => {
    for (const path of [
      'src/domains/main',
      'src/domains/blog',
      'src/domains/portfolio',
      'src/domains/games',
      'src/shared',
    ]) {
      expect(existsSync(path)).toBe(true);
    }
  });

  it('keeps the root entry independent from blog ownership', () => {
    expect(readFileSync('src/pages/index.astro', 'utf8')).not.toContain('domains/blog');
  });

  it('keeps blog implementation under the blog domain', () => {
    for (const path of [
      'src/domains/blog/content/config.ts',
      'src/domains/blog/content/posts',
      'src/domains/blog/components/PostCard.astro',
      'src/domains/blog/components/CodeShellEnhancer.astro',
      'src/domains/blog/layouts/BlogLayout.astro',
      'src/domains/blog/layouts/PostLayout.astro',
      'src/domains/blog/styles/blog.css',
    ]) {
      expect(existsSync(path)).toBe(true);
    }
  });
});

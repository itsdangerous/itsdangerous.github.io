import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('blog routes', () => {
  it('defines home, archive, article, about, and guestbook pages', () => {
    for (const path of [
      'src/pages/index.astro',
      'src/pages/posts/index.astro',
      'src/pages/posts/[...slug].astro',
      'src/pages/about.astro',
      'src/pages/guestbook.astro',
    ]) {
      expect(existsSync(path)).toBe(true);
    }
  });
});

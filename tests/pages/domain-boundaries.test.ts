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
});

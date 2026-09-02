import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';

describe('Astro shell', () => {
  it('has the project manifest and home page source', () => {
    expect(existsSync('package.json')).toBe(true);
    expect(existsSync('src/pages/index.astro')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Pagefind', () => {
  it('is part of the production build command', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.build).toContain('pagefind --site dist');
  });
});

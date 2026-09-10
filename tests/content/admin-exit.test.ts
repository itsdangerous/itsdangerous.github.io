import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('admin exit link', () => {
  it('links from the sidebar to the public site', () => {
    const source = readFileSync('admin/src/main.ts', 'utf8');
    expect(source).toContain('class="exit" href="https://extransload.github.io/"');
    expect(source).toContain('>Exit</a>');
  });
});

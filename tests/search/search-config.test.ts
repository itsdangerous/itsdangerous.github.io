import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Pagefind', () => {
  it('is part of the production build command', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.build).toContain('pagefind --site dist');
  });

  it('places Pagefind assets in the shared layout slots and explains dev-server availability', () => {
    const source = readFileSync('src/pages/search.astro', 'utf8');
    const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');

    expect(source).toContain('<Fragment slot="head">');
    expect(source).toContain('<Fragment slot="body-end">');
    expect(source).toContain('개발 서버에서는 Pagefind 색인이 생성되지 않습니다');
    expect(layout).toContain('<slot name="head" />');
    expect(layout).toContain('<slot name="body-end" />');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('release configuration', () => {
  it('has a Pages workflow and site metadata', () => {
    expect(existsSync('.github/workflows/deploy.yml')).toBe(true);
    expect(existsSync('public/robots.txt')).toBe(true);
    expect(existsSync('public/favicon.svg')).toBe(true);
    expect(existsSync('src/pages/rss.xml.ts')).toBe(true);
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain('itsdangerous.github.io');
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain('@astrojs/sitemap');

    const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('actions/upload-pages-artifact@v3');
    expect(workflow).toContain('actions/deploy-pages@v4');

    expect(readFileSync('public/robots.txt', 'utf8')).toContain(
      'Sitemap: https://itsdangerous.github.io/sitemap-index.xml',
    );
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkKoreanEmphasis from '../../src/shared/markdown/remark-korean-emphasis.js';

describe('Korean inline emphasis', () => {
  it('registers the plugin for Astro Markdown and the client-side viewer', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain('remarkKoreanEmphasis');
    expect(readFileSync('src/shared/markdown/render-viewer.ts', 'utf8')).toContain('remarkKoreanEmphasis');
  });

  it('handles emphasis immediately followed by Korean text', () => {
    const html = unified()
      .use(remarkParse)
      .use(remarkKoreanEmphasis)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync('**상호 배제(mutual exclusion)**다');

    expect(String(html)).toBe('<p><strong>상호 배제(mutual exclusion)</strong>다</p>');
  });
});

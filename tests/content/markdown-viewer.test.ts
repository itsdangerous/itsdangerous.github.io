import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/pages/blog/tools/markdown-viewer/index.astro', 'utf8');

describe('Markdown Viewer input surface', () => {
  it('keeps the file input available to browser picker APIs', () => {
    expect(source).toContain('class="markdown-viewer__file-input"');
    expect(source).toContain("input.showPicker()");
    expect(source).toContain("else input.click()");
  });

  it('uses the dropzone as the drag target and keeps the heading clean', () => {
    expect(source).toContain('data-dropzone aria-label="Markdown 파일 놓기"');
    expect(source).not.toContain('<p class="eyebrow">Tools</p>');
    expect(source).toContain('<h1>Markdown Viewer</h1>');
    expect(source).not.toContain('Markdown 파일을 끌어다 놓으세요');
    expect(source).not.toContain('<span>또는</span>');
  });
});

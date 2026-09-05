import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Markdown callouts', () => {
  it('registers the custom callout directive with Astro Markdown', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');

    expect(config).toContain("import remarkDirective from 'remark-directive';");
    expect(config).toContain("import remarkCallouts from './src/shared/markdown/remark-callouts.js';");
    expect(config).toContain('remarkPlugins: [remarkDirective, remarkCallouts]');
  });

  it('maps supported directives to styled callout surfaces', () => {
    const plugin = readFileSync('src/shared/markdown/remark-callouts.js', 'utf8');
    const styles = readFileSync('src/domains/blog/styles/blog.css', 'utf8');

    expect(plugin).toContain('note:');
    expect(plugin).toContain('tip:');
    expect(plugin).toContain('warning:');
    expect(plugin).toContain('important:');
    expect(plugin).toContain('success:');
    expect(styles).toContain('.article__content .callout');
    expect(styles).toContain('.article__content blockquote');
    expect(styles).toContain('.article__content table');
    expect(styles).toContain('border-left: 3px solid color-mix(in srgb, var(--color-accent) 58%, var(--color-surface));');
    expect(styles).toContain("url('/splash-leather-cover-texture.webp')");
    expect(styles).toContain('.callout--note');
    expect(styles).toContain('.callout--tip');
    expect(styles).toContain('.callout--warning');
    expect(styles).toContain('.callout--important');
    expect(styles).toContain('.callout--success');
    expect(styles).toContain('--callout-accent');
    expect(styles).toContain('--callout-background');
    expect(styles).toContain("[data-theme='light'] .article__content .callout--warning");
    expect(styles).toContain('background-blend-mode: soft-light;');
    expect(styles).not.toContain('border-left: 3px solid color-mix(in srgb, var(--callout-accent)');
  });
});

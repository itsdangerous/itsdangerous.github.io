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
    const surfaces = readFileSync('src/domains/blog/styles/editorial-surfaces.css', 'utf8');
    const sharedLayerStart = surfaces.indexOf('.editorial-surface::before,');
    const sharedLayerSelector = surfaces.slice(sharedLayerStart, surfaces.indexOf('{', sharedLayerStart));

    expect(plugin).toContain('note:');
    expect(plugin).toContain('tip:');
    expect(plugin).toContain('warning:');
    expect(plugin).toContain('important:');
    expect(plugin).toContain('success:');
    expect(plugin).toContain("className: ['callout__icon']");
    expect(styles).toContain('.article__content .callout');
    expect(styles).toContain('.article__content blockquote');
    expect(styles).toContain('.article__content table');
    expect(surfaces).toContain('.editorial-surface');
    expect(surfaces).toContain('.article__content table::before');
    expect(surfaces).toContain('--surface-background: var(--color-code-shell);');
    expect(surfaces).toContain("--surface-texture-image: url('/code-shell-texture.webp');");
    expect(surfaces).toContain('--surface-texture-size: 36rem 36rem;');
    expect(surfaces).toContain('--surface-texture-repeat: repeat;');
    expect(surfaces).toContain('--surface-texture-tint: color-mix(in srgb, var(--surface-background) 72%, var(--color-background));');
    expect(surfaces).toContain('background-color: var(--surface-texture-tint);');
    expect(surfaces).toContain('.article__content thead');
    expect(sharedLayerSelector).toContain('.article__content thead::before');
    expect(surfaces).toContain('[data-theme=\'light\'] .article__content table::before');
    expect(surfaces).toContain('[data-theme=\'light\'] .article__content thead::before');
    expect(styles).toContain('border-left: 3px solid color-mix(in srgb, var(--color-accent) 58%, var(--color-surface));');
    expect(surfaces).toContain('var(--surface-texture-image)');
    expect(styles).toContain('.callout--note');
    expect(styles).toContain('.callout--tip');
    expect(styles).toContain('.callout--warning');
    expect(styles).toContain('.callout--important');
    expect(styles).toContain('.callout--success');
    expect(styles).toContain('--callout-accent');
    expect(styles).toContain('--callout-background');
    expect(styles).toContain('--surface-texture-opacity: 0.42;');
    expect(styles).toContain('.article__content .callout__title {\n  display: flex;\n  align-items: center;');
    expect(styles).toContain('.article__content .callout__icon');
    expect(styles).toContain('font-size: 1.125rem;');
    expect(styles).not.toContain('vertical-align: -0.18em;');
    expect(styles).toContain("[data-theme='light'] .article__content .callout--warning");
    expect(surfaces).toContain('--surface-texture-opacity: 0.34;');
    expect(surfaces).toContain('background-blend-mode: multiply, luminosity;');
    expect(styles).not.toContain('border-left: 3px solid color-mix(in srgb, var(--callout-accent)');
  });
});

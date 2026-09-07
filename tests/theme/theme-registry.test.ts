import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { themes, getTheme } from '../../src/shared/themes/registry';
import { applyTheme, earlyThemeScript, THEME_STORAGE_KEY } from '../../src/shared/scripts/theme-init';

describe('themes', () => {
  it('gives the light theme a warm editorial palette for tactile surfaces', () => {
    const lightStyles = readFileSync('src/shared/themes/light.css', 'utf8');

    expect(lightStyles).toContain('--color-surface: #fffdf8;');
    expect(lightStyles).toContain('--color-surface-raised: #f1ede4;');
    expect(lightStyles).toContain('--color-border: #cfc6b7;');
    expect(lightStyles).toContain('--color-code-shell: #e8e4dc;');
    expect(lightStyles).toContain('--color-code-shell-header: #ddd8ce;');
    expect(lightStyles).toContain('--color-code-shell-edge: rgb(117 96 69 / 30%);');
  });

  it('contains midnight as the first default theme and resolves IDs', () => {
    expect(themes[0].id).toBe('midnight');
    expect(getTheme('light').id).toBe('light');
    expect(getTheme('unknown').id).toBe('midnight');
  });

  it('applies a valid theme and falls back for invalid IDs', () => {
    const root = { dataset: {} } as HTMLElement;
    expect(applyTheme('light', root).id).toBe('light');
    expect(root.dataset.theme).toBe('light');
    expect(applyTheme('invalid', root).id).toBe('midnight');
    expect(root.dataset.theme).toBe('midnight');
  });

  it('contains the storage key in the early initialization script', () => {
    expect(earlyThemeScript).toContain(THEME_STORAGE_KEY);
  });
});

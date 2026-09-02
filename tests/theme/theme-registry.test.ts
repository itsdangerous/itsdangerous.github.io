import { describe, expect, it } from 'vitest';
import { themes, getTheme } from '../../src/themes/registry';
import { applyTheme, earlyThemeScript, THEME_STORAGE_KEY } from '../../src/scripts/theme-init';

describe('themes', () => {
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

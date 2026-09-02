import { getTheme, themes } from '../themes/registry';

export const THEME_STORAGE_KEY = 'blog-theme';

export function applyTheme(id: string | null | undefined, root: HTMLElement = document.documentElement) {
  const theme = getTheme(id);
  root.dataset.theme = theme.id;
  return theme;
}

export function initializeTheme(root: HTMLElement = document.documentElement) {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
  return applyTheme(stored, root);
}

export const earlyThemeScript = `
(() => {
  const validThemes = ${JSON.stringify(themes.map((theme) => theme.id))};
  try {
    const saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    document.documentElement.dataset.theme = validThemes.includes(saved ?? '') ? saved : '${themes[0].id}';
  } catch {
    document.documentElement.dataset.theme = '${themes[0].id}';
  }
})();
`;

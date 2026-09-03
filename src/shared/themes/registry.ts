export interface ThemeDefinition {
  id: string;
  label: string;
  giscusTheme: string;
}

export const themes: ThemeDefinition[] = [
  { id: 'midnight', label: 'Midnight', giscusTheme: 'https://itsdangerous.github.io/giscus-dark.css' },
  { id: 'light', label: 'Light', giscusTheme: 'https://itsdangerous.github.io/giscus-light.css' },
];

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}

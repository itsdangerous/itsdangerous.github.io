export interface ThemeDefinition {
  id: string;
  label: string;
  giscusTheme: string;
}

export const themes: ThemeDefinition[] = [
  { id: 'midnight', label: 'Midnight', giscusTheme: 'dark' },
  { id: 'light', label: 'Light', giscusTheme: 'light' },
];

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}

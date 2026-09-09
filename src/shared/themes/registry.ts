export interface ThemeDefinition {
  id: string;
  label: string;
}

export const themes: ThemeDefinition[] = [
  { id: 'midnight', label: 'Midnight' },
  { id: 'light', label: 'Light' },
];

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}

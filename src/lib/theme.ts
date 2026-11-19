/**
 * Theme preference. Three values, not two: "system" has to be storable, because
 * a reader who never touched the control and a reader who deliberately chose to
 * follow the OS want the same thing today and different things tomorrow.
 */

export const THEME_STORAGE_KEY = 'trady-theme'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export function isThemePreference(value: unknown): value is ThemePreference {
  return (THEME_PREFERENCES as ReadonlyArray<unknown>).includes(value)
}

/** The attribute value Meridian reads. Only 'dark' is a real theme; anything else is the default. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): 'light' | 'dark' {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

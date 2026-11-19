'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme'

/**
 * Two states, not three. "Auto" reads as a third theme in a one-button
 * control — the glyph tells you nothing about what you will get — so the
 * toggle offers the only two things a reader actually wants to choose
 * between. The OS preference still decides the FIRST paint, via the inline
 * script in the layout; this control is how you overrule it.
 */
/**
 * Drawn, not typed. The Unicode ☾ renders as a hairline crescent in most
 * faces — thinner than every other mark in the header and visibly broken next
 * to them — and its weight cannot be controlled from CSS.
 */
function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}
const LABEL: Record<'light' | 'dark', string> = { light: 'Light', dark: 'Dark' }

/**
 * One button that flips between light and dark, sized for the marketing
 * header where a three-segment control would crowd the nav.
 *
 * The preference is shared with the app (same storage key), so a reader who
 * picks dark here stays in dark inside their workspace. The hero stage is
 * deliberately dark in BOTH themes: that band is the editor's room, not a
 * surface that follows the page.
 */
export function ThemeCycle() {
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) setPreference(stored)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(preference, media.matches)
    }
    apply()
    if (preference !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  const cycle = useCallback(() => {
    setPreference((current) => {
      const resolved =
        current === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : current
      const next: ThemePreference = resolved === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Storage can be denied; the theme still applies for this page.
      }
      return next
    })
  }, [])

  // 'system' still resolves to one of the two for display, so the button
  // never shows a state the reader cannot act on.
  const shown: 'light' | 'dark' =
    preference === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference

  return (
    <button
      type="button"
      className="theme-cycle"
      onClick={cycle}
      aria-label={`Colour theme: ${LABEL[shown]}. Change it.`}
      title={`Theme: ${LABEL[shown]}`}
    >
      {shown === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

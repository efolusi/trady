'use client'

import { SegmentedControl } from '@efolusi/meridian'
import { useCallback, useEffect, useState } from 'react'
import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme'

const OPTIONS = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

/** A fieldset used purely for its grouping semantics carries no chrome. */
const FIELDSET_RESET = { border: 0, padding: 0, margin: 0, minWidth: 0 } as const

/**
 * Light / dark / follow-the-OS.
 *
 * The initial value is read in an effect rather than during render because
 * localStorage does not exist on the server, and reading it during render is how
 * this control ends up as a hydration mismatch on every page. The inline script
 * in the root layout has already applied the right theme by then, so the effect
 * is only catching the control up to what the page is already showing.
 */
export function ThemeControl() {
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
    // Only 'system' tracks the OS. Without the guard an explicit choice would be
    // silently overwritten the next time the OS flipped at sunset.
    if (preference !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  const change = useCallback((id: string) => {
    if (!isThemePreference(id)) return
    setPreference(id)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // Storage can be denied (private mode, blocked third-party context). The
      // theme still applies for this page; it just will not be remembered.
    }
  }, [])

  // On a phone the three-segment control is the widest thing in a topbar that
  // cannot wrap — it was the piece being pushed off screen. The phone gets one
  // icon button that cycles the same three states; larger viewports keep the
  // explicit segments.
  const next: Record<ThemePreference, ThemePreference> = {
    system: 'light',
    light: 'dark',
    dark: 'system',
  }
  const label = { system: 'Auto', light: 'Light', dark: 'Dark' }[preference]
  // Lucide glyphs (24px grid, stroke 2), inlined the way the efolusi landing
  // does: Meridian's icon set has no sun or moon, and a unicode glyph reads as
  // a typo next to real icons.
  const icons: Record<ThemePreference, React.ReactNode> = {
    system: (
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
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
    light: (
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
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
    dark: (
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
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  }

  // The name lives on a wrapping fieldset because Meridian's SegmentedControl
  // types do not admit arbitrary DOM attributes, even though the implementation
  // spreads them onto its own role="group" element. This names the group without
  // patching the library.
  return (
    <>
      <fieldset className="hide-sm" style={FIELDSET_RESET} aria-label="Colour theme">
        <SegmentedControl options={OPTIONS} value={preference} onChange={change} />
      </fieldset>
      <button
        type="button"
        className="theme-cycle show-sm"
        aria-label={`Colour theme: ${label}. Tap to change.`}
        title={`Theme: ${label}`}
        onClick={() => change(next[preference])}
      >
        {icons[preference]}
      </button>
    </>
  )
}

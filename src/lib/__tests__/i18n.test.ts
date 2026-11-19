import { describe, expect, it } from 'vitest'

import { dictionaries, isLocale, LOCALES } from '../i18n'

/**
 * The failure this guards against is not a missing key, which TypeScript
 * already catches. It is a key that exists in both dictionaries and holds the
 * SAME English string, because whoever added it copied the English block and
 * meant to come back. That ships as a page which is bilingual everywhere
 * except the sentence nobody re-read, and no type or build error says so.
 */

/** Every leaf string in a dictionary, keyed by its dotted path. */
function leaves(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]]
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
  }
  return []
}

describe('dictionaries', () => {
  it('defines every locale the router can route to', () => {
    for (const locale of LOCALES) {
      expect(dictionaries[locale], `no dictionary for ${locale}`).toBeDefined()
      expect(isLocale(locale)).toBe(true)
    }
  })

  it('has the same shape in both languages', () => {
    const en = leaves(dictionaries.en).map(([k]) => k)
    const id = leaves(dictionaries.id).map(([k]) => k)
    expect(id).toEqual(en)
  })

  it('translates the sign-in hand-off rather than leaving it English', () => {
    // Called out by name because it is the newest section and the one most
    // likely to be added on the English side only: it lives outside the
    // /en and /id routes, so a missed translation is invisible on the pages
    // people actually browse.
    const en = dictionaries.en.signInScreen
    const id = dictionaries.id.signInScreen
    for (const key of ['title', 'redirecting', 'unreachable', 'retry'] as const) {
      expect(id[key], `signInScreen.${key} is still English`).not.toBe(en[key])
      expect(id[key].trim().length).toBeGreaterThan(0)
    }
  })

  it('leaves almost nothing untranslated overall', () => {
    // Not zero: some strings are legitimately identical across languages
    // (brand names, "Efolusi", short labels like "EN"). The threshold catches
    // a whole section copied over, which is the mistake worth failing on.
    const en = new Map(leaves(dictionaries.en))
    const id = new Map(leaves(dictionaries.id))
    const identical = [...en].filter(([k, v]) => id.get(k) === v).map(([k]) => k)
    expect(identical.length / en.size, `identical strings: ${identical.join(', ')}`).toBeLessThan(
      0.2,
    )
  })
})

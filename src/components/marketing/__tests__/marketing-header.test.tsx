import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { dictionaries } from '@/lib/i18n'
import { MarketingHeader } from '../MarketingHeader'

/**
 * The language switch has to leave the page the hard way.
 *
 * `<html lang>` is set once, in the root layout, from a request header. A
 * client-side navigation does not re-render that layout, so switching language
 * through next/link swapped the copy to Indonesian while the document still
 * declared lang="en" — the same bug this branch fixes, surviving one click. A
 * plain anchor forces a full document load, so the server sets the attribute
 * again.
 */
vi.mock('../HeaderSession', () => ({ HeaderSession: () => null }))
vi.mock('../ThemeCycle', () => ({ ThemeCycle: () => null }))
vi.mock('@/components/BrandMark', () => ({ BrandMark: () => null }))

function langSwitch(locale: 'en' | 'id'): string {
  const markup = renderToStaticMarkup(<MarketingHeader t={dictionaries[locale]} locale={locale} />)
  const match = /<a[^>]*class="mk-header__lang"[^>]*>/.exec(markup)
  expect(match, 'no language switch in the header').not.toBeNull()
  return match?.[0] ?? ''
}

describe('marketing header language switch', () => {
  it('points at the other language and declares it', () => {
    expect(langSwitch('en')).toContain('href="/id"')
    // React spells the prop back out as written; HTML attribute names are
    // case-insensitive, so the browser reads it as hreflang either way.
    expect(langSwitch('en')).toContain('hrefLang="id"')
    expect(langSwitch('id')).toContain('href="/en"')
    expect(langSwitch('id')).toContain('hrefLang="en"')
  })

  it('is a plain anchor, so the document reloads and re-declares its language', () => {
    // next/link renders an <a> too, but with its own router props; what this
    // pins is that the element carries no client-router attributes at all.
    expect(langSwitch('id')).not.toContain('data-prefetch')
  })
})

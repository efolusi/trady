import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { dictionaries } from '@/lib/i18n'

/**
 * The skip link contract, on every frame that has a <main>.
 *
 * Three things have to hold together, and each one fails silently on its own:
 * the link is the first focusable element, its href names the landmark's id,
 * and the landmark has tabindex="-1". Without the last one Safari and Firefox
 * scroll to the content and leave focus in the header, so the next Tab goes
 * straight back to the navigation that was just skipped. The browser check
 * that document.activeElement becomes <main> after activation is in the PR;
 * this file pins the markup that makes it possible.
 *
 * No DOM in this suite (vitest runs in node), so "first focusable" is read
 * from the markup: the first <a href>, <button>, <input>, <select>,
 * <textarea> or element with a non-negative tabindex.
 */
vi.mock('next/navigation', () => ({ usePathname: () => '/projects' }))
vi.mock('@/components/marketing/HeaderSession', () => ({ HeaderSession: () => null }))
vi.mock('@/components/marketing/ThemeCycle', () => ({ ThemeCycle: () => null }))
vi.mock('@/components/BrandMark', () => ({ BrandMark: () => null }))

const { MarketingShell } = await import('../marketing/MarketingShell')

const FOCUSABLE =
  /<(a\s[^>]*href=|button[\s>]|input[\s>]|select[\s>]|textarea[\s>]|[a-z]+\s[^>]*tabindex="(?!-)[^"]*")[^>]*>/i

function firstFocusable(html: string): string {
  const match = FOCUSABLE.exec(html)
  expect(match, 'nothing focusable in the markup').not.toBeNull()
  return match?.[0] ?? ''
}

function expectTarget(html: string) {
  const mains = html.match(/<main[\s>][^>]*>/g) ?? []
  expect(mains).toHaveLength(1)
  expect(mains[0]).toContain('id="main"')
  expect(mains[0]).toContain('tabindex="-1"')
  // The old id; nothing links to it, and a second id would be a second target.
  expect(html).not.toContain('id="content"')
}

describe('skip link', () => {
  it.each(['en', 'id'] as const)(
    'is the first focusable element of the marketing frame, in %s',
    (locale) => {
      const t = dictionaries[locale]
      const html = renderToStaticMarkup(
        <MarketingShell t={t} locale={locale}>
          <p>page</p>
        </MarketingShell>,
      )
      const first = firstFocusable(html)
      expect(first).toContain('href="#main"')
      expect(first).toContain('ef-skip')
      expect(html).toContain(`>${t.skipToContent}</a>`)
      expectTarget(html)
    },
  )

  it('is labelled in both languages', () => {
    expect(dictionaries.en.skipToContent).toBe('Skip to content')
    expect(dictionaries.id.skipToContent).toBe('Langsung ke konten')
  })
})

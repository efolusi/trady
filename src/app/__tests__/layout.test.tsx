import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `<html lang>` per locale.
 *
 * The bug this pins: the root layout hardcoded `lang="en"` while wrapping the
 * Indonesian routes too, so every page under /id went out as English. A screen
 * reader then pronounced Indonesian copy with English phonetics, and search
 * engines indexed the Indonesian pages as English. Asserted on the SERVER
 * markup on purpose: patching the attribute after hydration would leave the
 * first response, which is what a crawler reads, still wrong.
 */
const requestHeaders = new Headers()

vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
}))

// The layout imports the app's stylesheets; nothing here renders them.
vi.mock('@efolusi/meridian/styles.css', () => ({}))
vi.mock('../globals.css', () => ({}))


async function render(locale: string | null): Promise<string> {
  requestHeaders.delete('x-locale')
  if (locale !== null) requestHeaders.set('x-locale', locale)
  const { default: RootLayout } = await import('../layout')
  return renderToStaticMarkup(await RootLayout({ children: null }))
}

function langOf(markup: string): string | undefined {
  return /<html[^>]*\slang="([^"]*)"/.exec(markup)?.[1]
}

describe('root layout', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('declares Indonesian for a request under /id', async () => {
    expect(langOf(await render('id'))).toBe('id')
  })

  it('declares English for a request under /en', async () => {
    expect(langOf(await render('en'))).toBe('en')
  })

  it('falls back to English where the middleware sets no language', async () => {
    // The app, /signin and the unprefixed legal pages are English, and a
    // document rendered outside the matcher must still declare a language.
    expect(langOf(await render(null))).toBe('en')
    expect(langOf(await render('fr'))).toBe('en')
  })
})

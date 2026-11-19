import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'

import { safeReturnPath } from '../lib/app-routes'
import { config, middleware } from '../middleware'

/**
 * Language routing for the signed-out landing page.
 *
 * This had no tests and did not run at all: the file sat at `apps/web/middleware.ts`
 * while the app lives under `apps/web/src/`, so Next resolved no middleware and
 * the deployed build shipped an empty middleware manifest. Every Indonesian
 * visitor landed on English, and a stored choice was ignored, because the only
 * thing left running was the unconditional `redirect('/en')` fallback in
 * app/page.tsx — which looks correct in isolation and hid the failure.
 *
 * The tests below are behavioural, so they would have passed even while the
 * middleware was dead. What actually pins the wiring is `config.matcher`, and a
 * curl against production after deploy.
 */

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
})

function request(
  path: string,
  init: { cookies?: Record<string, string>; country?: string; origin?: string } = {},
) {
  const headers = new Headers()
  if (init.country) headers.set('cf-ipcountry', init.country)
  const cookie = Object.entries(init.cookies ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(new URL(path, init.origin ?? 'https://trady.efolusi.com'), { headers })
}

/** The URL a response redirects to, failing the test if it does not redirect. */
function redirectUrl(res: { headers: Headers }): URL {
  const location = res.headers.get('location')
  expect(location, 'expected a redirect').not.toBeNull()
  return new URL(location ?? '', 'https://trady.efolusi.com')
}

function redirectPath(res: { headers: Headers }): string {
  return redirectUrl(res).pathname
}

describe('landing language routing', () => {
  it('sends a first-time Indonesian visitor to the Indonesian page', () => {
    const res = middleware(request('/', { country: 'ID' }))
    expect(res.status).toBe(307)
    expect(redirectPath(res)).toBe('/id')
  })

  it('sends everyone else to English', () => {
    expect(redirectPath(middleware(request('/', { country: 'SG' })))).toBe('/en')
  })

  it('uses the canonical external origin behind a reverse proxy', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://dev-trady.efolusi.com'
    const proxied = request('/?source=proxy', {
      country: 'ID',
      origin: 'https://localhost:13002',
    })
    proxied.headers.set('host', 'dev-trady.efolusi.com')
    proxied.headers.set('x-forwarded-host', 'dev-trady.efolusi.com')
    proxied.headers.set('x-forwarded-proto', 'https')

    expect(redirectUrl(middleware(proxied)).toString()).toBe(
      'https://dev-trady.efolusi.com/id?source=proxy',
    )
  })

  it('fails closed when the configured canonical origin is unsafe', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://user:password@dev-trady.efolusi.com'
    expect(() =>
      middleware(request('/', { country: 'ID', origin: 'https://localhost:13002' })),
    ).toThrow(/NEXT_PUBLIC_SITE_URL must be an absolute HTTP\(S\) origin/)
  })

  it('lets a stored choice beat the country guess', () => {
    // The failure this replaces: an Indonesian reader who switched to English
    // was thrown back to Indonesian on every visit, and vice versa.
    expect(redirectPath(middleware(request('/', { country: 'ID', cookies: { lang: 'en' } })))).toBe(
      '/en',
    )
    expect(redirectPath(middleware(request('/', { country: 'US', cookies: { lang: 'id' } })))).toBe(
      '/id',
    )
  })

  it('remembers the language page being read, including a manual switch', () => {
    const res = middleware(request('/id', { cookies: { lang: 'en' } }))
    expect(res.cookies.get('lang')?.value).toBe('id')
  })

  it('does not rewrite the cookie when it already matches', () => {
    const res = middleware(request('/id', { cookies: { lang: 'id' } }))
    expect(res.cookies.get('lang')).toBeUndefined()
  })

  it('runs on every page but not on static files', () => {
    const [pattern] = config.matcher
    const re = new RegExp(`^${pattern}$`)
    for (const path of ['/', '/en', '/id/pricing', '/pricing', '/terms', '/nope']) expect(re.test(path), path).toBe(true)
    for (const path of ['/_next/static/x.js', '/brand/demo-clip.mp4', '/robots.txt', '/sitemap.xml', '/favicon.ico']) {
      expect(re.test(path), path).toBe(false)
    }
  })

  it('sends a CSP on every page, without unsafe-inline scripts in production', () => {
    const original = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_API_ORIGIN = 'https://api.example.test'
    try {
      const csp = middleware(request('/en/pricing')).headers.get('content-security-policy') ?? ''
      expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/)
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/)
      for (const part of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "connect-src 'self' https://api.example.test"]) {
        expect(csp).toContain(part)
      }
      const nonce = /'nonce-([^']+)'/.exec(csp)?.[1]
      expect(middleware(request('/en')).headers.get('x-middleware-request-x-nonce')).not.toBe(nonce)
    } finally {
      ;(process.env as Record<string, string>).NODE_ENV = original ?? 'test'
      process.env.NEXT_PUBLIC_API_ORIGIN = ''
    }
  })

  it('tells the render which language the path was in', () => {
    // The root layout has no params, so this header is the only thing that can
    // make /id/pricing ship `<html lang="id">` on the first response. Next
    // surfaces an overridden request header on the response as
    // `x-middleware-request-<name>`.
    const header = (path: string) =>
      middleware(request(path)).headers.get('x-middleware-request-x-locale')
    expect(header('/id')).toBe('id')
    expect(header('/id/pricing')).toBe('id')
    expect(header('/en/privacy')).toBe('en')
  })

  it('remembers the language from a page below the language root', () => {
    const res = middleware(request('/id/pricing', { cookies: { lang: 'en' } }))
    expect(res.cookies.get('lang')?.value).toBe('id')
  })
})

describe('app routes moved to the app host', () => {
  it.each([
    '/usage',
    '/projects',
    '/projects/new',
    '/projects/0b7c8f8e-1111-4c4c-9999-000000000000',
    '/clips/abc',
    '/social',
    '/editor',
    '/signin',
  ])('sends %s to the same path on the app host', (path) => {
    const res = middleware(request(path))
    expect(res.status).toBe(308)
    const url = redirectUrl(res)
    expect(url.origin).toBe('https://app.trady.efolusi.com')
    expect(url.pathname).toBe(path)
  })

  it('keeps the query string', () => {
    const url = redirectUrl(middleware(request('/projects/new?from=p1&focus=prompt')))
    expect(`${url.pathname}${url.search}`).toBe('/projects/new?from=p1&focus=prompt')
  })

  it('uses the configured app origin', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://dev-app.trady.efolusi.com'
    const url = redirectUrl(middleware(request('/usage')))
    expect(url.origin).toBe('https://dev-app.trady.efolusi.com')
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  it('leaves look-alike paths alone', () => {
    for (const path of ['/usage-guide', '/projectsx', '/editorial']) {
      const res = middleware(request(path))
      expect(res.headers.get('location')).toBeNull()
    }
  })
})

describe('safeReturnPath', () => {
  it('keeps a same-site path and its query', () => {
    expect(safeReturnPath('/usage')).toBe('/usage')
    expect(safeReturnPath('/projects/new?from=p1')).toBe('/projects/new?from=p1')
  })

  it.each([
    undefined,
    '',
    'usage',
    'https://evil.example/usage',
    '//evil.example',
    '/\\evil.example',
    '/\tevil',
    'javascript:alert(1)',
    ['/usage', '/clips'],
  ])('refuses %j', (value) => {
    expect(safeReturnPath(value as string | string[] | undefined)).toBeUndefined()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
const originalApiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN

async function loadSso(siteUrl?: string, apiOrigin?: string) {
  vi.resetModules()

  if (siteUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = siteUrl

  if (apiOrigin === undefined) delete process.env.NEXT_PUBLIC_API_ORIGIN
  else process.env.NEXT_PUBLIC_API_ORIGIN = apiOrigin

  return import('../sso')
}

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl

  if (originalApiOrigin === undefined) delete process.env.NEXT_PUBLIC_API_ORIGIN
  else process.env.NEXT_PUBLIC_API_ORIGIN = originalApiOrigin

  vi.resetModules()
})

describe('SSO URLs', () => {
  it('returns to the configured app origin', async () => {
    const { SSO_SIGN_IN_URL, SSO_SIGN_UP_URL } = await loadSso(
      'https://dev-app.trady.efolusi.com/',
      'https://dev-trady-api.efolusi.com',
    )
    const url = new URL(SSO_SIGN_IN_URL)

    expect(url.origin).toBe('https://dev-trady-api.efolusi.com')
    expect(url.pathname).toBe('/api/v1/auth/oauth2/start/efolusi')
    expect(url.searchParams.get('returnTo')).toBe('https://dev-app.trady.efolusi.com')
    expect(SSO_SIGN_UP_URL).toBe(SSO_SIGN_IN_URL)
  })

  it('returns to the production app origin by default', async () => {
    const { SSO_SIGN_IN_URL } = await loadSso(undefined, 'https://trady-api.efolusi.com')

    expect(new URL(SSO_SIGN_IN_URL).searchParams.get('returnTo')).toBe('https://app.trady.efolusi.com')
  })

  it.each([
    '/relative',
    '//attacker.example',
    'javascript:alert(1)',
    'https://user:password@dev-trady.efolusi.com',
    'https://dev-trady.efolusi.com/path',
    'https://dev-trady.efolusi.com?next=https://attacker.example',
  ])('rejects unsafe app origin %s', async (siteUrl) => {
    await expect(loadSso(siteUrl, 'https://dev-trady-api.efolusi.com')).rejects.toThrow()
  })
})

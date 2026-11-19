import { afterEach, describe, expect, it, vi } from 'vitest'

const original = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME

afterEach(() => {
  vi.resetModules()
  if (original === undefined) delete process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME
  else process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME = original
})

describe('web session cookie configuration', () => {
  it('keeps the production-compatible default', async () => {
    delete process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME
    const { SESSION_COOKIE_NAME } = await import('../session-cookie.js')
    expect(SESSION_COOKIE_NAME).toBe('trady_session')
  })

  it('uses the isolated dev cookie name', async () => {
    process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME = 'dev_trady_session'
    const { SESSION_COOKIE_NAME } = await import('../session-cookie.js')
    expect(SESSION_COOKIE_NAME).toBe('dev_trady_session')
  })

  it('fails the build or startup for an invalid name', async () => {
    process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME = 'dev trady session'
    await expect(import('../session-cookie.js')).rejects.toThrow(/valid RFC 6265 token/)
  })
})

import { apiError } from '@/lib/contracts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, newIdempotencyKey, request } from '../client'
import { ApiError, ContractError, NetworkError } from '../errors'
import type { ResponseSchema } from '../schema'

const okSchema: ResponseSchema<{ ok: true }> = {
  safeParse(value: unknown) {
    return value !== null && typeof value === 'object' && 'ok' in value
      ? { success: true, data: { ok: true } }
      : { success: false, error: { issues: [{ path: ['ok'], message: 'expected ok' }] } }
  },
}

function jsonResponse(body: unknown, status = 200, statusText = ''): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function lastCall(): [string, RequestInit] {
  const call = fetchMock.mock.calls.at(-1)
  if (!call) throw new Error('fetch was never called')
  return call as [string, RequestInit]
}

describe('request', () => {
  it('returns the parsed body on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await expect(request('/x', okSchema)).resolves.toEqual({ ok: true })
  })

  it('turns the error envelope into an ApiError carrying the contract code', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        apiError('insufficient_credits', 'Not enough credits.', {
          requiredSeconds: 600,
          availableSeconds: 120,
        }),
        402,
      ),
    )
    const failure = await request('/x', okSchema).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ kind: 'api', status: 402, code: 'insufficient_credits' })
  })

  it('derives a code from the status when the body is not the contract envelope', async () => {
    // A gateway HTML page is not the API breaking its contract, and reporting it
    // as drift would send the reader after the wrong bug.
    fetchMock.mockResolvedValue(new Response('<html>502</html>', { status: 502 }))
    const failure = await request('/x', okSchema).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiError)
    expect((failure as ApiError).code).toBe('internal')
  })

  it('maps a known status back to its contract code', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 404, statusText: 'Not Found' }))
    const failure = await request('/x', okSchema).catch((error: unknown) => error)
    expect((failure as ApiError).code).toBe('not_found')
  })

  it('raises ContractError when a 200 does not match the schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: 1 }))
    const failure = await request('/x', okSchema).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ContractError)
    expect((failure as ContractError).issues[0]?.message).toBe('expected ok')
  })

  it('raises NetworkError when nothing answers', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const failure = await request('/x', okSchema).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(NetworkError)
  })

  it('rethrows an abort untouched, because the caller aborted on purpose', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    const failure = await request('/x', okSchema).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(DOMException)
    expect(failure).not.toBeInstanceOf(NetworkError)
  })

  it('sends the session cookie rather than relying on a token alone', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await request('/x', okSchema)
    expect(lastCall()[1].credentials).toBe('include')
  })
})

describe('api routes', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }))
  })

  it('builds the versioned list path and drops undefined query values', async () => {
    await api.listProjects({ cursor: 'abc', limit: 10 })
    expect(lastCall()[0]).toBe('/api/v1/projects?cursor=abc&limit=10')
  })

  it('omits every absent filter instead of serialising "undefined"', async () => {
    await api.listProjects()
    expect(lastCall()[0]).toBe('/api/v1/projects')
  })

  it('encodes the id into a by-id path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await api.getClip('a/b').catch(() => undefined)
    expect(lastCall()[0]).toBe('/api/v1/clips/a%2Fb')
  })

  it('never puts a credential in the query string', async () => {
    await api.listProjects({ cursor: 'abc' })
    expect(lastCall()[0]).not.toMatch(/token|authorization|bearer/i)
  })
})

describe('idempotency', () => {
  it('sends the key header on a mutation', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'x', deletedAt: '' }))
    await api
      .deleteProject('11111111-1111-4111-8111-111111111111', 'key-abcdefgh')
      .catch(() => undefined)
    const headers = new Headers(lastCall()[1].headers)
    expect(headers.get('idempotency-key')).toBe('key-abcdefgh')
  })

  it('does not send one on a read, where it would mean nothing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }))
    await api.listProjects()
    const headers = new Headers(lastCall()[1].headers)
    expect(headers.get('idempotency-key')).toBeNull()
  })

  it('generates keys long enough for idempotencyKeySchema (min 8)', () => {
    const key = newIdempotencyKey()
    expect(key.length).toBeGreaterThanOrEqual(8)
    expect(key.length).toBeLessThanOrEqual(255)
    expect(newIdempotencyKey()).not.toBe(key)
  })
})

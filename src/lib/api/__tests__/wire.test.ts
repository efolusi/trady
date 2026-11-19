import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../client'

/**
 * The exact bytes on the wire, checked against literal strings.
 *
 * Every other test in this app builds its expectation from the same
 * `@trady/contracts` constants the client builds the request from, which proves
 * the two agree with each other and nothing else. The paths below are written
 * out by hand on purpose: they are what the Fastify server registers
 * (API_BASE_PATH plus API_ROUTES) and what nginx proxies under /api/, so a
 * change to either constant has to be a deliberate edit here rather than a
 * silent 404 in production.
 */

const ID = '9f1c6d0e-4c6f-4a1b-8f9e-2a3b4c5d6e7f'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(
    // Never a valid payload: these tests read the request, and a response that
    // parses would mean maintaining a fixture per route for no added coverage.
    new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function capture(call: () => Promise<unknown>): Promise<[string, RequestInit]> {
  await call().catch(() => undefined)
  const last = fetchMock.mock.calls.at(-1)
  if (!last) throw new Error('fetch was never called')
  return last as [string, RequestInit]
}

function headersOf(init: RequestInit): Headers {
  return new Headers(init.headers)
}

describe('request paths', () => {
  it('GET /api/v1/me', async () => {
    const [url, init] = await capture(() => api.me())
    expect(url).toBe('/api/v1/me')
    expect(init.method).toBe('GET')
  })

  it('GET /api/v1/usage', async () => {
    const [url] = await capture(() => api.listUsage())
    expect(url).toBe('/api/v1/usage')
  })

  it('GET /api/v1/projects', async () => {
    const [url] = await capture(() => api.listProjects())
    expect(url).toBe('/api/v1/projects')
  })

  it('POST /api/v1/projects', async () => {
    const [url, init] = await capture(() =>
      api.createProject(
        {
          source: { kind: 'url', url: 'https://example.com/v' },
          targetClipCount: 10,
          aspectRatio: '9:16',
        },
        'idempotency-key-1',
      ),
    )
    expect(url).toBe('/api/v1/projects')
    expect(init.method).toBe('POST')
  })

  it('GET and DELETE /api/v1/projects/:id', async () => {
    const [getUrl] = await capture(() => api.getProject(ID))
    expect(getUrl).toBe(`/api/v1/projects/${ID}`)

    const [deleteUrl, deleteInit] = await capture(() => api.deleteProject(ID, 'idempotency-key-2'))
    expect(deleteUrl).toBe(`/api/v1/projects/${ID}`)
    expect(deleteInit.method).toBe('DELETE')
  })

  it('GET /api/v1/projects/:id/clips', async () => {
    const [url] = await capture(() => api.listClips(ID))
    expect(url).toBe(`/api/v1/projects/${ID}/clips`)
  })

  it('GET /api/v1/clips/:id', async () => {
    const [url] = await capture(() => api.getClip(ID))
    expect(url).toBe(`/api/v1/clips/${ID}`)
  })

  it('POST /api/v1/clips/:id/download', async () => {
    const [url, init] = await capture(() => api.requestClipDownload(ID, 'mp4', 'idempotency-key-3'))
    expect(url).toBe(`/api/v1/clips/${ID}/download`)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ format: 'mp4' }))
  })

  it('POST /api/v1/uploads', async () => {
    const [url, init] = await capture(() =>
      api.createUpload(
        { filename: 'a.mp4', contentType: 'video/mp4', sizeBytes: 1024 },
        'idempotency-key-4',
      ),
    )
    expect(url).toBe('/api/v1/uploads')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(
      JSON.stringify({ filename: 'a.mp4', contentType: 'video/mp4', sizeBytes: 1024 }),
    )
  })

  it('GET /readyz, outside the versioned base path', async () => {
    // The orchestrator probes this before auth, tenancy or routing exist, so a
    // version bump must never move it.
    const [url] = await capture(() => api.readiness())
    expect(url).toBe('/readyz')
  })
})

describe('query parameters', () => {
  it('names the project list filters as listProjectsQuerySchema does', async () => {
    const [url] = await capture(() =>
      api.listProjects({ cursor: 'c1', limit: 25, status: 'rendering' }),
    )
    expect(url).toBe('/api/v1/projects?cursor=c1&limit=25&status=rendering')
  })

  it('names the clip list filters as listClipsQuerySchema does', async () => {
    const [url] = await capture(() =>
      api.listClips(ID, { cursor: 'c2', limit: 10, sort: 'timeline', status: 'ready' }),
    )
    expect(url).toBe(`/api/v1/projects/${ID}/clips?cursor=c2&limit=10&sort=timeline&status=ready`)
  })

  it('names the usage filters as listUsageQuerySchema does', async () => {
    const [url] = await capture(() => api.listUsage({ cursor: 'c3', limit: 5, kind: 'reserve' }))
    expect(url).toBe('/api/v1/usage?cursor=c3&limit=5&kind=reserve')
  })

  it('omits an unset filter rather than sending the string "undefined"', async () => {
    const [url] = await capture(() => api.listProjects({ cursor: undefined, status: undefined }))
    expect(url).toBe('/api/v1/projects')
  })
})

describe('headers', () => {
  it('sends the idempotency key on every mutation, lowercased as the contract names it', async () => {
    const [, init] = await capture(() =>
      api.createProject(
        {
          source: { kind: 'url', url: 'https://example.com/v' },
          targetClipCount: 10,
          aspectRatio: '9:16',
        },
        'idempotency-key-5',
      ),
    )
    expect(headersOf(init).get('idempotency-key')).toBe('idempotency-key-5')
  })

  it('sends no idempotency key on a read', async () => {
    const [, init] = await capture(() => api.listProjects())
    expect(headersOf(init).has('idempotency-key')).toBe(false)
  })

  it('carries the session cookie rather than a token in the URL', async () => {
    const [url, init] = await capture(() => api.me())
    expect(init.credentials).toBe('include')
    expect(url).not.toContain('token')
  })
})

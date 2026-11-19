import { API_BASE_PATH, API_ROUTES, decodeCursor, encodeCursor } from '@/lib/contracts'
import { describe, expect, it } from 'vitest'
import { apiUrl, buildPath, buildQuery } from '../routes'

describe('buildPath', () => {
  it('fills the id placeholder', () => {
    expect(buildPath(API_ROUTES.project, { id: 'abc' })).toBe('/projects/abc')
  })

  it('encodes the parameter, so a stray slash cannot become another route', () => {
    expect(buildPath(API_ROUTES.clipDownload, { id: '../projects' })).toBe(
      '/clips/..%2Fprojects/download',
    )
  })

  it('throws rather than sending a request at a literal ":id"', () => {
    expect(() => buildPath(API_ROUTES.project)).toThrow(/missing path parameter/)
  })

  it('leaves a route with no placeholders alone', () => {
    expect(buildPath(API_ROUTES.projects)).toBe('/projects')
  })
})

describe('buildQuery', () => {
  it('drops undefined instead of serialising it', () => {
    expect(buildQuery({ cursor: undefined, limit: 25 })).toBe('?limit=25')
  })

  it('returns an empty string when nothing survives', () => {
    expect(buildQuery({ cursor: undefined })).toBe('')
  })

  it('round-trips a cursor byte for byte', () => {
    // encodeCursor already percent-encodes, so a second pass has to survive
    // decoding: a cursor that arrives back mangled makes the server answer
    // validation_failed on a page the client built itself.
    const cursor = encodeCursor({
      createdAt: '2026-07-22T00:00:00.000Z',
      id: '11111111-2222-4333-8444-555555555555',
    })
    const parsed = new URLSearchParams(buildQuery({ cursor }))
    expect(parsed.get('cursor')).toBe(cursor)
    expect(decodeCursor(cursor)?.id).toBe('11111111-2222-4333-8444-555555555555')
  })
})

describe('apiUrl', () => {
  it('puts every route under the versioned base path', () => {
    expect(apiUrl('', API_ROUTES.me)).toBe(`${API_BASE_PATH}/me`)
  })

  it('keeps an absolute origin in front', () => {
    expect(apiUrl('https://api.example.com', API_ROUTES.usage, undefined, { limit: 5 })).toBe(
      'https://api.example.com/api/v1/usage?limit=5',
    )
  })
})

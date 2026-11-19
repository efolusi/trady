import { describe, expect, it } from 'vitest'
import {
  ApiError,
  asRequestFailure,
  ContractError,
  describeFailure,
  insufficientCreditsDetails,
  isRequestFailure,
  NetworkError,
  rateLimitDetails,
} from '../errors'

describe('asRequestFailure', () => {
  it('passes a known failure straight through', () => {
    const failure = new ApiError(404, 'not_found', 'gone')
    expect(asRequestFailure(failure)).toBe(failure)
  })

  it('treats an unrecognised throw as a network failure, which is what it is to a screen', () => {
    expect(asRequestFailure(new Error('boom'))).toBeInstanceOf(NetworkError)
  })

  it('recognises all three kinds', () => {
    expect(isRequestFailure(new NetworkError('/x', null))).toBe(true)
    expect(isRequestFailure(new ContractError('/x', []))).toBe(true)
    expect(isRequestFailure(new Error('plain'))).toBe(false)
  })
})

describe('describeFailure', () => {
  it('shows the server copy for an API error, because the message is the server’s to write', () => {
    const copy = describeFailure(new ApiError(409, 'conflict', 'That clip is not ready yet.'))
    expect(copy.description).toBe('That clip is not ready yet.')
  })

  it('never offers a retry for contract drift, since the next answer will be identical', () => {
    const copy = describeFailure(
      new ContractError('/x', [{ path: ['items', 0, 'score'], message: 'expected number' }]),
    )
    expect(copy.retryable).toBe(false)
    expect(copy.description).toContain('items.0.score')
  })

  it('offers a retry when nothing answered', () => {
    expect(describeFailure(new NetworkError('/x', null)).retryable).toBe(true)
  })

  it('does not offer a retry for a validation failure the user has to fix', () => {
    expect(describeFailure(new ApiError(400, 'validation_failed', 'bad')).retryable).toBe(false)
  })
})

describe('typed details', () => {
  it('parses the credit shortfall the UI needs to render a useful prompt', () => {
    const failure = new ApiError(402, 'insufficient_credits', 'no credit', {
      requiredSeconds: 600,
      availableSeconds: 120,
    })
    expect(insufficientCreditsDetails(failure)).toEqual({
      requiredSeconds: 600,
      availableSeconds: 120,
    })
  })

  it('returns null when the details do not match, rather than half-rendering them', () => {
    const failure = new ApiError(402, 'insufficient_credits', 'no credit', { nope: true })
    expect(insufficientCreditsDetails(failure)).toBeNull()
  })

  it('does not read credit details off an unrelated code', () => {
    const failure = new ApiError(429, 'rate_limited', 'slow down', { retryAfterSeconds: 30 })
    expect(insufficientCreditsDetails(failure)).toBeNull()
    expect(rateLimitDetails(failure)).toEqual({ retryAfterSeconds: 30 })
  })
})

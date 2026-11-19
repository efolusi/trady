import { describe, expect, it } from 'vitest'
import {
  formatBytes,
  formatCredits,
  formatDuration,
  formatLedgerDelta,
  formatPercent,
  formatRelativeTime,
} from '../format'

describe('formatDuration', () => {
  it('drops the hour field below an hour', () => {
    expect(formatDuration(95)).toBe('1:35')
  })

  it('shows hours for a full podcast', () => {
    expect(formatDuration(4215)).toBe('1:10:15')
  })

  it('pads seconds so the column does not jitter', () => {
    expect(formatDuration(61)).toBe('1:01')
  })

  it('has a placeholder for a duration the API has not learned yet', () => {
    expect(formatDuration(null)).toBe('--:--')
  })
})

describe('formatCredits', () => {
  it('reads in seconds when that is the honest unit', () => {
    expect(formatCredits(45)).toBe('45s')
  })

  it('reads in minutes in the middle', () => {
    expect(formatCredits(600)).toBe('10 min')
  })

  it('reads in hours once minutes stop being useful', () => {
    expect(formatCredits(36_000)).toBe('10 hr')
  })

  it('keeps the sign on a negative balance, which an adjustment can produce', () => {
    expect(formatCredits(-120)).toBe('-2 min')
  })
})

describe('formatLedgerDelta', () => {
  it('signs a reserve, which is negative by the contract convention', () => {
    expect(formatLedgerDelta(-2640)).toBe('-44 min')
  })

  it('signs a release, which is positive', () => {
    expect(formatLedgerDelta(2640)).toBe('+44 min')
  })

  it('renders a commit as a bare zero, because it is a marker and not a charge', () => {
    // A commit carrying a sign here is what makes people believe they were
    // billed twice for one project.
    expect(formatLedgerDelta(0)).toBe('0')
  })
})

describe('formatBytes', () => {
  it('scales to the largest sensible unit', () => {
    expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe('5.0 GB')
  })

  it('never shows a fraction of a byte', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('says so when the API has no size yet', () => {
    expect(formatBytes(null)).toBe('unknown size')
  })
})

describe('formatPercent', () => {
  it('clamps, because a progress number out of range is still a bar', () => {
    expect(formatPercent(1.4)).toBe('100%')
    expect(formatPercent(-0.2)).toBe('0%')
  })
})

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-07-22T12:00:00.000Z')

  it('takes now as a parameter so server and client render the same string', () => {
    expect(formatRelativeTime('2026-07-22T11:00:00.000Z', now)).toBe('1 hour ago')
  })

  it('handles a future timestamp, which expiresAt always is', () => {
    expect(formatRelativeTime('2026-07-24T12:00:00.000Z', now)).toBe('in 2 days')
  })

  it('does not throw on a value that is not a timestamp', () => {
    expect(formatRelativeTime('not a date', now)).toBe('unknown')
  })
})

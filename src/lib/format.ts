/**
 * Display helpers. Every one of them takes the API's units (seconds, bytes,
 * ISO-8601 UTC) and produces text, so no screen does arithmetic on a payload.
 */

/** h:mm:ss above an hour, m:ss below. Matches how the player labels a position. */
export function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || !Number.isFinite(totalSeconds)) return '--:--'
  const whole = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const seconds = whole % 60
  const paddedSeconds = String(seconds).padStart(2, '0')
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
  return `${minutes}:${paddedSeconds}`
}

/**
 * Credits are whole seconds of source media. Showing "5400" would be accurate
 * and useless, so the balance reads in the unit people buy it in.
 */
export function formatCredits(seconds: number): string {
  const sign = seconds < 0 ? '-' : ''
  const whole = Math.abs(Math.round(seconds))
  if (whole < 60) return `${sign}${whole}s`
  const minutes = Math.round(whole / 60)
  if (minutes < 120) return `${sign}${minutes} min`
  const hours = whole / 3600
  return `${sign}${hours.toFixed(hours < 10 ? 1 : 0)} hr`
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return 'unknown size'
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${BYTE_UNITS[unit]}`
}

export function formatPercent(fraction: number): string {
  return `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`
}

const RELATIVE_STEPS: ReadonlyArray<[limitSeconds: number, divisor: number, unit: string]> = [
  [60, 1, 'second'],
  [3600, 60, 'minute'],
  [86400, 3600, 'hour'],
  [604800, 86400, 'day'],
  [2629800, 604800, 'week'],
  [31557600, 2629800, 'month'],
]

/**
 * Relative time from an ISO timestamp.
 *
 * `now` is a parameter rather than a call to Date.now inside, because the server
 * and the client render this on either side of hydration and a value that
 * disagrees by one tick is a hydration mismatch warning on every list row.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 'unknown'
  const deltaSeconds = (then - now) / 1000
  const magnitude = Math.abs(deltaSeconds)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [limit, divisor, unit] of RELATIVE_STEPS) {
    if (magnitude < limit) {
      return formatter.format(
        Math.round(deltaSeconds / divisor),
        unit as Intl.RelativeTimeFormatUnit,
      )
    }
  }
  return formatter.format(Math.round(deltaSeconds / 31557600), 'year')
}

export function formatDateTime(iso: string): string {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return 'unknown'
  return new Date(parsed).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const CATEGORY_LABELS: Record<string, string> = {
  viral: 'Viral',
  informational: 'Informational',
  story: 'Story',
  hot_take: 'Hot take',
  qna: 'Q&A',
  quotable: 'Quotable',
  other: 'Other',
}

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

/** Signed, because the ledger's sign convention is the point of the column. */
export function formatLedgerDelta(deltaSeconds: number): string {
  if (deltaSeconds === 0) return '0'
  const sign = deltaSeconds > 0 ? '+' : '-'
  return `${sign}${formatCredits(Math.abs(deltaSeconds))}`
}

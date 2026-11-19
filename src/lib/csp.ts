/**
 * The Content-Security-Policy, built per request with a fresh nonce.
 *
 * In production script-src is 'self' plus the nonce, so an injected inline
 * <script> does not run. Next reads the nonce from the request's CSP header and
 * stamps it on its own scripts; the root layout stamps it on the theme script.
 * Development keeps 'unsafe-inline' and 'unsafe-eval' for Next's dev tooling and
 * sets no nonce, because a nonce makes browsers ignore 'unsafe-inline'.
 */

export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/** The API host the browser talks to (the session check and checkout). */
function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'https://trady-api.efolusi.com'
  if (!raw) return ''
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

export function buildCsp({ nonce, isProduction }: { nonce?: string | undefined; isProduction: boolean }): string {
  const api = apiOrigin() ? ` ${apiOrigin()}` : ''
  const scriptSrc = isProduction
    ? ["'self'", nonce ? `'nonce-${nonce}'` : ''].filter(Boolean).join(' ')
    : "'self' 'unsafe-inline' 'unsafe-eval'"
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Inline style attributes are a far weaker vector than scripts; nonces for
    // styles are impractical with React style objects.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    `connect-src 'self'${api}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

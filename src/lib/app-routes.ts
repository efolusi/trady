/**
 * The signed-in product routes, in one place.
 *
 * Two things read this list and they must agree: SiteShell, which gives these
 * paths the app frame, and the middleware, which sends a visitor with no
 * session on any of them to /signin. They used to disagree by omission: the
 * middleware only ran on the landing routes, so a stranger opening /usage or
 * /projects/<id> got a 200 with the whole app shell and a "not signed in"
 * banner instead of the sign-in hand-off.
 *
 * ADD A ROUTE HERE when you add a page under src/app that is part of the app,
 * and add the matching pair to `config.matcher` in src/middleware.ts (Next
 * needs that array as literals, so it cannot be built from this one; a test
 * checks the two stay in step).
 */
export const APP_PREFIXES = ['/projects', '/clips', '/usage', '/social', '/editor'] as const

/** True for an app route or anything below it; false for `/usage-guide`. */
export function isAppPath(pathname: string): boolean {
  return APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * A path-and-query that is safe to send the browser back to after sign-in, or
 * undefined.
 *
 * Only same-site relative paths survive: a leading single slash, no second
 * slash or backslash right after it (`//evil.example` and `/\evil.example` are
 * protocol-relative to a browser), no control characters, and nothing that
 * resolves to a different origin. The API checks the origin again before it
 * redirects, so this is the first of two locks, not the only one.
 */
export function safeReturnPath(
  candidate: string | string[] | undefined | null,
): string | undefined {
  if (typeof candidate !== 'string') return undefined
  if (candidate.length === 0 || candidate.length > 2048) return undefined
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return undefined
  }
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting them is the point.
  if (/[\u0000-\u001f\u007f\\]/.test(candidate)) return undefined
  const base = 'https://return-path.invalid'
  let resolved: URL
  try {
    resolved = new URL(candidate, base)
  } catch {
    return undefined
  }
  if (resolved.origin !== base) return undefined
  return `${resolved.pathname}${resolved.search}`
}

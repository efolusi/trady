/** Production-compatible session cookie name used when no deployment override exists. */
export const DEFAULT_SESSION_COOKIE_NAME = 'trady_session'

// RFC 6265 cookie-name token characters. Keeping the validation here means the
// API and web build cannot silently disagree about an invalid deployment value.
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

export function parseSessionCookieName(value: string | undefined): string {
  const name = value === undefined || value.length === 0 ? DEFAULT_SESSION_COOKIE_NAME : value
  if (name.length > 128 || !COOKIE_NAME.test(name)) {
    throw new Error('session cookie name must be a valid RFC 6265 token of at most 128 bytes')
  }
  return name
}

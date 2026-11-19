import { parseSessionCookieName } from '@/lib/contracts'

// NEXT_PUBLIC_* is intentional: Next must inline the same cookie name into the
// edge middleware and the server-rendered root page. Production omits it and
// retains `trady_session`; dev sets `dev_trady_session` alongside the API's
// SESSION_COOKIE_NAME.
export const SESSION_COOKIE_NAME = parseSessionCookieName(
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME,
)

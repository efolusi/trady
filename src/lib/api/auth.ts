import { API_BASE_PATH } from '@/lib/contracts'
import { API_ORIGIN } from './config'
import { NetworkError } from './errors'

/**
 * Sign-out.
 *
 * Separate from `client.ts` because it is the one call whose whole job is to
 * end the session rather than use it. Sign-IN is not here at all any more: it is
 * an OpenID Connect redirect flow that begins at the API (see lib/sso.ts), so
 * the browser navigates rather than fetches.
 *
 * Nothing here ever touches the token. The server sets an HttpOnly cookie,
 * which is exactly what stops a script on this page from reading it, so the
 * only thing the browser does is send `credentials: 'include'` on every later
 * request.
 */

const AUTH = {
  logout: `${API_ORIGIN}${API_BASE_PATH}/auth/logout`,
} as const

async function post(url: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      credentials: 'include',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (cause) {
    throw new NetworkError(url, cause)
  }
}

/**
 * Never throws. A sign-out that fails still has to end the session as far as
 * this tab is concerned; leaving someone on a page that looks signed in because
 * the network blipped is worse than a silent success.
 */
export async function signOut(): Promise<void> {
  try {
    await post(AUTH.logout)
  } catch {
    // Intentionally swallowed; see above.
  }
}

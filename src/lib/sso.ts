import { API_BASE_PATH } from '@/lib/contracts'
import { API_ORIGIN } from './api/config'
import { appOrigin, appUrl } from './site'

/**
 * The one sign-in for every Efolusi product lives at my.efolusi.com;
 * trady has no auth forms of its own.
 *
 * Nothing here links to accounts directly any more. Sign-in is an OpenID
 * Connect authorization code flow now, and the flow has to BEGIN at the API:
 * that is where the state, the nonce and the PKCE verifier are minted and
 * parked in a signed cookie, and a link that jumped straight to the provider
 * would arrive at the callback with no transaction to match. So both buttons
 * point at /auth/oauth2/start/efolusi and the API does the redirecting.
 *
 * `returnTo` is ABSOLUTE. A relative value resolves against the API host and
 * 404s, which this repo has shipped once already; the API additionally refuses
 * any origin that is not the web app's, so a tampered link cannot turn a
 * sign-in into an open redirect.
 */
function startUrl(returnTo: string): string {
  return `${API_ORIGIN}${API_BASE_PATH}/auth/oauth2/start/efolusi?returnTo=${encodeURIComponent(returnTo)}`
}

export const SSO_SIGN_IN_URL = startUrl(appOrigin())

/**
 * Sign-in that comes back to a specific page, for a visitor the middleware
 * stopped on an app route. `returnPath` must already have been through
 * `safeReturnPath` (lib/app-routes.ts); it is joined onto this site's origin, so
 * the most a bad value can do is name a page here that does not exist.
 */
export function ssoSignInUrl(returnPath?: string): string {
  return returnPath ? startUrl(appUrl(returnPath)) : SSO_SIGN_IN_URL
}

/**
 * Sign-up is the same flow. The provider shows its own sign-up affordance to a
 * visitor with no central session, and a separate entry point here would only
 * be a second thing to keep correct.
 */
export const SSO_SIGN_UP_URL = SSO_SIGN_IN_URL

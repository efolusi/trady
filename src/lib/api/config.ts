/**
 * Runtime configuration for the API client.
 *
 * The reads are written out literally because Next only inlines
 * `process.env.NEXT_PUBLIC_*` when it can see the whole expression at build
 * time. Indexing `process.env` with a variable produces `undefined` in the
 * browser and works fine in tests, which is the worst possible combination.
 */

/**
 * Empty means same origin, which is the deployed shape: the API is served
 * behind the same host so the session cookie is first-party and no CORS
 * preflight sits in front of every request.
 */
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? ''

/**
 * A development-only bearer token. Real sessions travel as a cookie, which is
 * why every request is sent with `credentials: 'include'`; this exists so the
 * app can be pointed at an API that only has API-key auth wired up yet.
 */
export const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? ''

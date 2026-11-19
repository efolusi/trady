/**
 * Runtime configuration for the API client.
 *
 * The reads are written out literally because Next only inlines
 * `process.env.NEXT_PUBLIC_*` when it can see the whole expression at build
 * time. Indexing `process.env` with a variable produces `undefined` in the
 * browser and works fine in tests, which is the worst possible combination.
 */

/**
 * The API is its own host: the site is a Worker on trady.efolusi.com, so a
 * relative path would land on the site. Set NEXT_PUBLIC_API_ORIGIN to point
 * elsewhere (an empty value means same origin, for local development).
 */
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'https://trady-api.efolusi.com'

/**
 * A development-only bearer token. Real sessions travel as a cookie, which is
 * why every request is sent with `credentials: 'include'`; this exists so the
 * app can be pointed at an API that only has API-key auth wired up yet.
 */
export const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? ''

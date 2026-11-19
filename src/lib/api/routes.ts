import { API_BASE_PATH, API_ROUTES } from '@/lib/contracts'

export type QueryValue = string | number | boolean | undefined

/**
 * Fills the `:id` placeholders in a contract route.
 *
 * The id is encoded even though it is a UUID by the time the API sees it,
 * because this function is reached with whatever came out of the router, and a
 * path parameter concatenated raw is how a stray slash turns one request into a
 * request for a different resource.
 */
export function buildPath(route: string, params: Record<string, string> = {}): string {
  return route.replace(/:([a-zA-Z]+)/g, (_match, name: string) => {
    const value = params[name]
    if (value === undefined) throw new Error(`missing path parameter "${name}" for route ${route}`)
    return encodeURIComponent(value)
  })
}

/**
 * Undefined values are dropped rather than serialised as the string
 * "undefined", which is what a naive template produces and what makes an
 * optional filter silently match nothing.
 */
export function buildQuery(query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    params.set(key, String(value))
  }
  const serialised = params.toString()
  return serialised.length > 0 ? `?${serialised}` : ''
}

/** Absolute or same-origin URL for a route under the versioned base path. */
export function apiUrl(
  origin: string,
  route: string,
  params?: Record<string, string>,
  query?: Record<string, QueryValue>,
): string {
  return `${origin}${API_BASE_PATH}${buildPath(route, params)}${buildQuery(query)}`
}

export { API_ROUTES }

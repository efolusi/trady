/**
 * The site's public origin, for absolute URLs in sitemap, robots and metadata.
 *
 * From the environment so a preview or a different domain works without a code
 * change; the default is the production domain. No trailing slash, so callers
 * build `${siteUrl()}/path` without doubling it.
 */
function checkedOrigin(raw: string, name: string): string {
  const url = new URL(raw)

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be an absolute HTTP(S) origin`)
  }

  return url.origin
}

export function siteUrl(): string {
  return checkedOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trady.efolusi.com', 'NEXT_PUBLIC_SITE_URL')
}

/** The Trady app (projects, editor, clips, usage, sign-in) on its own host. */
export function appOrigin(): string {
  return checkedOrigin(process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.trady.efolusi.com', 'NEXT_PUBLIC_APP_URL')
}

/** A path on the app host. Joined as text, so a path like //host cannot become a new host. */
export function appUrl(path = '/'): string {
  return new URL(`${appOrigin()}${path.startsWith('/') ? path : `/${path}`}`).toString()
}

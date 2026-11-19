import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

const PRODUCTION_HOST = 'trady.efolusi.com'

/**
 * Allow the public marketing pages, keep crawlers out of the signed-in app.
 *
 * The dashboard, project and clip pages are per-tenant and behind auth; there is
 * nothing there for a crawler but a redirect to sign-in, and listing them only
 * wastes crawl budget. The API is disallowed for the same reason.
 */
export default function robots(): MetadataRoute.Robots {
  // Only the production origin is indexable. dev-trady and any preview served
  // the same Allow rules with a dev Host and sitemap, which invites a crawler to
  // index a copy of the site.
  if (new URL(siteUrl()).hostname !== PRODUCTION_HOST) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/projects', '/clips', '/usage', '/editor', '/signin', '/api/'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  }
}

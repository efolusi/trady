import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Only the public, indexable pages. The signed-in app is deliberately absent —
 * it is per-tenant and behind auth, so it does not belong in a sitemap any more
 * than it belongs in robots' allow list.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const pages = [
    { path: '/', priority: 1 },
    { path: '/pricing', priority: 0.9 },
    { path: '/terms', priority: 0.3 },
    { path: '/privacy', priority: 0.3 },
    // The language versions, which the pages already declare as hreflang
    // alternates and this file did not list at all. A page nobody can find is
    // not translated in any sense that matters: the bare paths redirect by
    // guessed geography, so /id is the only stable address an Indonesian
    // reader (or a crawler) can be given.
    { path: '/en', priority: 1 },
    { path: '/id', priority: 1 },
    { path: '/en/pricing', priority: 0.9 },
    { path: '/id/pricing', priority: 0.9 },
    { path: '/en/terms', priority: 0.3 },
    { path: '/id/terms', priority: 0.3 },
    { path: '/en/privacy', priority: 0.3 },
    { path: '/id/privacy', priority: 0.3 },
  ]
  return pages.map((page) => ({
    url: `${base}${page.path}`,
    changeFrequency: 'weekly' as const,
    priority: page.priority,
  }))
}

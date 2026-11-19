import { API_BASE_PATH, listPlansResponseSchema, type PlanSummary } from '@/lib/contracts'

/**
 * Fetch the public plan catalogue for the pricing page, SERVER-SIDE.
 *
 * Rendered on the server, not in the browser, on purpose: pricing is the page
 * search engines and AI answer engines read, so the prices must be in the HTML
 * rather than filled in by a client fetch. SSR runs in the Cloudflare Worker
 * now, so "server-side" means the public API origin — the compose-network
 * shortcut (http://api:3001) only exists for a self-hosted SSR container and
 * is unreachable from the Worker, where it rendered /pricing as a 500.
 */
const INTERNAL_API_ORIGIN =
  process.env.TRADY_INTERNAL_API_ORIGIN ??
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  'https://trady-api.efolusi.com'

export async function fetchPlans(): Promise<PlanSummary[]> {
  const res = await fetch(`${INTERNAL_API_ORIGIN}${API_BASE_PATH}/plans`, {
    // Prices change rarely; let Next cache the render and revalidate hourly so
    // the pricing page is not a per-request round trip to the API.
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    throw new Error(`plans fetch failed: ${res.status}`)
  }
  return listPlansResponseSchema.parse(await res.json()).plans
}

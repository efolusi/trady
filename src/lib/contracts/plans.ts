import type { PlanTier } from './api.js'

/**
 * What each plan entitles a workspace to, as code the server enforces.
 *
 * The plan catalogue used to carry these as JSON nobody read: a free workspace
 * could run as many projects at once as a Business one, and the pricing card
 * still listed the difference. This is now the single definition. The seed in
 * packages/db writes it into `plans.limits` and `plans.features` for the
 * pricing page, and the server reads it from here when it decides something,
 * so the page and the enforcement cannot drift apart.
 *
 * It lives in contracts rather than in packages/db because both enforcement
 * points (the API's project create and the analysis worker) must be able to
 * import it without opening a database pool at module load.
 */

export const PLAN_FEATURES = [
  'url_ingest',
  'manual_upload',
  'captions',
  'face_tracking',
  'social_publishing',
] as const

export type PlanFeature = (typeof PLAN_FEATURES)[number]

export interface PlanEntitlements {
  /**
   * Projects that may be in flight at once: queued, ingesting, transcribing,
   * analysing, or with clips still rendering. The box has one render worker,
   * so this is what stops one workspace from queueing everyone else behind it.
   */
  maxConcurrentProjects: number
  features: readonly PlanFeature[]
}

const BASE: readonly PlanFeature[] = ['url_ingest', 'manual_upload', 'captions']

export const PLAN_ENTITLEMENTS: Readonly<Record<PlanTier, PlanEntitlements>> = {
  free: { maxConcurrentProjects: 1, features: BASE },
  starter: { maxConcurrentProjects: 2, features: BASE },
  pro: { maxConcurrentProjects: 4, features: [...BASE, 'face_tracking'] },
  business: {
    maxConcurrentProjects: 8,
    features: [...BASE, 'face_tracking', 'social_publishing'],
  },
}

export function planIncludes(tier: PlanTier, feature: PlanFeature): boolean {
  return PLAN_ENTITLEMENTS[tier].features.includes(feature)
}

export function maxConcurrentProjects(tier: PlanTier): number {
  return PLAN_ENTITLEMENTS[tier].maxConcurrentProjects
}

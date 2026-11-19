/**
 * Plan features that are listed but not shippable yet.
 *
 * A key in here still appears on its tier — it is what makes the tier worth
 * more — but it renders with a "coming soon" badge so nobody reads it as
 * something today's price buys. Charging for a feature that does not exist is
 * not reversible; holding the claim is.
 *
 * social_publishing: the scheduler, the queue, the status machine and the
 * publish worker all exist and are tested, but the two ports that reach a
 * platform — SocialConnector (apps/api/src/adapters/social-service.ts) and
 * PublishTarget (packages/jobs/src/workers/publish.ts) — have no per-platform
 * implementation. A scheduled post is therefore never delivered anywhere.
 * Remove the key the day a real target ships; do not remove it from the plan.
 */
export const UNSHIPPED_FEATURES: ReadonlySet<string> = new Set(['social_publishing'])

export function isUnshipped(featureKey: string): boolean {
  return UNSHIPPED_FEATURES.has(featureKey)
}

import type { Dictionary, Locale } from './i18n'

/**
 * How a plan card prices itself.
 *
 * Kept apart from the page so the words can be tested against what billing
 * does. A paid plan is a one-time purchase: settlement credits its minutes
 * once and nothing renews. The free plan's minutes are granted once, when the
 * workspace is created. Neither is monthly, so nothing here says so.
 */

export function formatUsd(cents: number): string {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

/** Whole rupiah, as a plain price. */
export function formatIdr(rupiah: number): string {
  return rupiah === 0 ? '' : `Rp${rupiah.toLocaleString('id-ID')}`
}

export function creditsLine(
  t: Dictionary,
  plan: { priceUsdCents: number; monthlyCredits: number },
  locale: Locale,
): string {
  const value = Math.round(plan.monthlyCredits / 60).toLocaleString(
    locale === 'id' ? 'id-ID' : 'en-US',
  )
  const template = plan.priceUsdCents === 0 ? t.pricing.creditsOnSignup : t.pricing.creditsOnce
  return template.replace('{minutes}', value)
}

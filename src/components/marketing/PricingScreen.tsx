import { appUrl } from '@/lib/site'
import Link from 'next/link'
import styles from '@/app/pricing/pricing.module.css'
import { ChoosePlanButton } from '@/components/ChoosePlanButton'
import { Container } from '@/components/marketing/Container'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Section } from '@/components/marketing/Section'
import { fetchPlans } from '@/lib/api/plans'
import { type Dictionary, dictionaries, type Locale } from '@/lib/i18n'
import { creditsLine, formatIdr, formatUsd } from '@/lib/pricing'
import { isUnshipped } from '@/lib/unshipped-features'

/**
 * The API stores feature keys, not sentences. A buyer should never read
 * url_ingest; an unknown key falls back to a cleaned-up version of itself so a
 * new feature shows up readable before the dictionary learns about it.
 */
function featureLabel(t: Dictionary, key: string): string {
  return t.pricing.features[key] ?? key.replaceAll('_', ' ')
}

/**
 * No Product/Offer JSON-LD while prices are provisional (see
 * packages/db/src/seed-plans.ts): structured data gets quoted verbatim by
 * search and answer engines, and a placeholder price indexed as fact is worse
 * than no price at all. Restore it when pricing is committed.
 *
 * The same FAQ as the visible list below, as FAQPage structured data. Google
 * The same FAQ as the visible list below, as FAQPage structured data. Google
 * requires the marked-up questions to match on-page text word for word, which
 * is why both read from FAQ rather than drifting apart.
 */
function faqJsonLd(t: Dictionary): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.pricing.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  })
}

export async function PricingScreen({ locale }: { locale: Locale }) {
  const t = dictionaries[locale]
  // The API can be down; the page still renders and says so instead of a 500.
  const plans = await fetchPlans().catch(() => null)

  return (
    <MarketingShell t={t} locale={locale}>
      <Section id="pricing">
        <Container>
          <h1>{t.pricing.title}</h1>
          <p>{t.pricing.lede}</p>

          {plans === null ? <p role="status">{t.pricing.unavailable}</p> : null}
          <div className={styles.grid}>
            {(plans ?? []).map((plan) => (
              <div key={plan.tier} className={styles.card}>
                <span className={styles.tier}>{plan.name}</span>
                <span className={styles.price}>{formatUsd(plan.priceUsdCents)}</span>
                {plan.priceIdr > 0 ? (
                  <span className={styles.priceIdr}>{formatIdr(plan.priceIdr)}</span>
                ) : null}
                <span className={styles.credits}>{creditsLine(t, plan, locale)}</span>
                {plan.features.length > 0 ? (
                  <ul className={styles.features}>
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={isUnshipped(feature) ? styles.featureSoon : undefined}
                      >
                        {featureLabel(t, feature)}
                        {isUnshipped(feature) ? (
                          <span className={styles.comingSoon}>{t.pricing.comingSoon}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {plan.priceUsdCents === 0 ? (
                  <Link className={styles.cta} href={appUrl('/signin')}>
                    {t.pricing.startFree}
                  </Link>
                ) : (
                  <ChoosePlanButton planId={plan.id} planName={plan.name} className={styles.cta} />
                )}
              </div>
            ))}
          </div>
          <p className={styles.provisionalNote}>{t.pricing.billingNote}</p>
          <p className={styles.provisionalNote}>{t.pricing.provisionalNote}</p>
        </Container>
      </Section>

      <Section id="faq">
        <Container width="text">
          <h2 className={styles.faqHeading}>{t.pricing.faqTitle}</h2>
          <dl className={styles.faq}>
            {t.pricing.faq.map((item) => (
              <div className={styles.faqItem} key={item.question}>
                <dt className={styles.faqQuestion}>{item.question}</dt>
                <dd className={styles.faqAnswer}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {/* JSON-LD as a script text child, not dangerouslySetInnerHTML: the
          payload is our own serialised catalogue whose values are plain strings
          and URLs (no <, >, & or `</script>`), so React's text escaping does not
          corrupt it, and the linter's XSS guard stays meaningful elsewhere. */}
      <script type="application/ld+json">{faqJsonLd(t)}</script>
    </MarketingShell>
  )
}

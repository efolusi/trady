import type { ReactNode } from 'react'
import type { Dictionary, Locale } from '@/lib/i18n'
import { Container } from './Container'
import styles from './LegalPage.module.css'
import { MarketingShell } from './MarketingShell'
import { Section } from './Section'

/**
 * The frame both legal documents render inside.
 *
 * It exists so the two pages cannot drift apart: same header shape, same
 * measure, same heading hierarchy, same last-updated line. Everything here is
 * a server component, so neither document ships a byte of JavaScript.
 *
 * The measure is Container's `text` (720px, Meridian's --container-text) with
 * .mk-prose capping the line at 68ch, which is the reading measure the brief
 * asked for and the one the rest of the site already uses for prose.
 */

/** The date shown on both documents. One constant so they cannot disagree. */
export const LEGAL_LAST_UPDATED = '2026-11-19'

/**
 * A real-world detail that has not been decided yet.
 *
 * Inventing a company name, an address, a jurisdiction or a support inbox in a
 * legal document is the kind of mistake that is invisible until it matters, so
 * unknowns are rendered visibly instead. Every use is listed in the handover
 * notes; nothing marked this way should reach production.
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark className={styles.placeholder} title="Placeholder: the owner must fill this in">
      {children}
    </mark>
  )
}

/** One numbered-free section of a document: a heading and its prose. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-heading`}>
      <h2 className={styles.heading} id={`${id}-heading`}>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** A sub-heading inside a section, for documents that need a third level. */
export function LegalSubheading({ children }: { children: ReactNode }) {
  return <h3 className={styles.subheading}>{children}</h3>
}

/** An unordered list set to the same measure and rhythm as the prose. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>
}

export function LegalPage({
  eyebrow,
  title,
  lede,
  note,
  locale,
  t,
  children,
}: {
  eyebrow: string
  title: string
  /** The one paragraph under the headline. */
  lede: string
  /** The honest note about the product being young. Rendered above the body. */
  note: ReactNode
  /** Which language the reader asked for; picks the header, footer and chrome. */
  locale: Locale
  t: Dictionary
  children: ReactNode
}) {
  return (
    <MarketingShell t={t} locale={locale}>
      <Section>
        <Container width="text">
          <header className={styles.header}>
            <p className="mk-eyebrow">{eyebrow}</p>
            <h1 className={`mk-display-lg ${styles.title}`}>{title}</h1>
            <p className={`mk-lede ${styles.lede}`}>{lede}</p>
            <p className={styles.updated}>
              {t.legal.lastUpdated}{' '}
              <time className="mk-measured" dateTime={LEGAL_LAST_UPDATED}>
                {LEGAL_LAST_UPDATED}
              </time>
            </p>
          </header>
          <div className={styles.note}>{note}</div>
          {children}
        </Container>
      </Section>
    </MarketingShell>
  )
}

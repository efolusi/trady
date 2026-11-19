import Link from 'next/link'
import type { ReactNode } from 'react'
import { dictionaries, type LegalBlock, type LegalDoc, type Locale } from '@/lib/i18n'
import { LegalList, LegalPage, LegalSection, LegalSubheading } from './LegalPage'

/**
 * Renders one legal document, in one language, from the dictionary.
 *
 * The prose used to be JSX inside src/app/privacy and src/app/terms, which is
 * why those two pages were the last English-only pages on the site: a second
 * language meant a second copy of the markup, and two copies of a legal
 * document is how they end up saying different things. The sentences live in
 * lib/i18n.ts now and this file is the only thing that knows how to draw them.
 *
 * Still a server component, so neither document ships a byte of JavaScript.
 */

/**
 * The session lifetime, in days.
 *
 * Here rather than in the dictionary because it is a fact about the code, not
 * a sentence: apps/api/src/auth/session.ts, SESSION_TTL_SECONDS. A translator
 * must not be able to change what the page claims.
 */
const SESSION_LIFETIME_DAYS = 14

const SUPPORT_EMAIL = 'hi@efolusi.com'

/** `{token}` and the text around it, in order. */
const TOKEN = /(\{[a-zA-Z]+\})/

/**
 * Substitutes the `{tokens}` a dictionary string may carry.
 *
 * An unknown token is rendered as it is written rather than dropped: a
 * document with a visible `{whatever}` in it is a bug someone reports, and a
 * document with a silently missing address is a bug nobody notices.
 */
function inline(text: string, locale: Locale): ReactNode {
  const t = dictionaries[locale]
  return text.split(TOKEN).map((part, i) => {
    const key = `${i}-${part}`
    switch (part) {
      case '{email}':
        return (
          <a href={`mailto:${SUPPORT_EMAIL}`} key={key}>
            {SUPPORT_EMAIL}
          </a>
        )
      case '{privacyLink}':
        return (
          <Link href={`/${locale}/privacy`} key={key}>
            {t.legal.privacyLinkLabel}
          </Link>
        )
      case '{sessionDays}':
        return (
          <span className="mk-measured" key={key}>
            {SESSION_LIFETIME_DAYS}
          </span>
        )
      case '{address}':
        return (
          <span key={key}>
            Bumi Cikande Indah, Blok D12 No 15, Cikande, Kab. Serang, Banten 42186
          </span>
        )
      case '{openRouterLead}':
        return <strong key={key}>OpenRouter.</strong>
      default:
        return <span key={key}>{part}</span>
    }
  })
}

function renderBlock(block: LegalBlock, locale: Locale, key: string): ReactNode {
  if ('h3' in block) return <LegalSubheading key={key}>{block.h3}</LegalSubheading>
  if ('list' in block) {
    return (
      <LegalList key={key}>
        {block.list.map((item) => (
          <li key={item}>{inline(item, locale)}</li>
        ))}
      </LegalList>
    )
  }
  return (
    <p className="mk-prose" key={key}>
      {inline(block.p, locale)}
    </p>
  )
}

export function LegalDocument({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  const t = dictionaries[locale]
  return (
    <LegalPage
      eyebrow={doc.eyebrow}
      lede={doc.lede}
      locale={locale}
      note={
        <>
          {doc.note.map((paragraph) => (
            <p key={paragraph}>{inline(paragraph, locale)}</p>
          ))}
          {/* English is the text that binds. Saying so on the English page
              would be noise, so the line appears only where it is true. */}
          {locale !== 'en' ? <p>{t.legal.governingNote}</p> : null}
        </>
      }
      t={t}
      title={doc.title}
    >
      {Object.entries(doc.sections).map(([id, section]) => (
        <LegalSection id={id} key={id} title={section.title}>
          {section.blocks.map((block, i) => renderBlock(block, locale, `${id}-${i}`))}
        </LegalSection>
      ))}
    </LegalPage>
  )
}

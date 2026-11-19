import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'
import type { Dictionary, Locale } from '@/lib/i18n'
import { Container } from './Container'
import { HeaderSession } from './HeaderSession'
import { ThemeCycle } from './ThemeCycle'

/**
 * The header a stranger sees.
 *
 * This is NOT Meridian's TopNav, and it must not become it. TopNav is the
 * signed-in app frame in components/AppShell.tsx: it carries the credit balance,
 * the tenant badge, sign out and the theme control. A visitor who has never
 * signed in has none of those, and showing an empty version of the app chrome is
 * exactly the working-skeleton impression this redesign exists to remove.
 *
 * Three things live here and nothing else: the wordmark, one way in for people
 * who already have an account, and the site's one primary call to action. Both
 * actions navigate, so both are anchors rather than Meridian Buttons; see
 * `.mk-btn` in globals.css for why.
 *
 * The actions depend on the session, which lives in an HttpOnly cookie, so
 * that half is a client component (HeaderSession) and the rest stays static.
 */
export function MarketingHeader({ t, locale }: { t: Dictionary; locale: Locale }) {
  const home = `/${locale}`
  const other = locale === 'id' ? '/en' : '/id'
  return (
    <header className="mk-header">
      <Container>
        <div className="mk-header__inner">
          <Link href={home} className="mk-wordmark">
            <BrandMark size={24} />
            Trady
          </Link>
          <nav className="mk-header__nav" aria-label="Site">
            <Link href={`${home}#features`}>{t.nav.features}</Link>
            <Link href={`${home}#how-it-works`}>{t.nav.how}</Link>
            <Link href={`${home}/pricing`}>{t.nav.pricing}</Link>
          </nav>
          <div className="mk-header__actions">
            {/* The other language, named in ITS own language: a reader who
                cannot read this page can still recognise the way out.

                A plain <a>, never next/link: `<html lang>` lives in the root
                layout, which does not re-render on a client-side navigation,
                so a <Link> here swapped the copy to Indonesian while the
                document still said lang="en" (and, with the shared layout,
                left the address bar on the old prefix). Crossing languages has
                to be a full document load. Same-language links stay <Link>. */}
            <a
              className="mk-header__lang"
              href={other}
              hrefLang={other.slice(1)}
              aria-label={t.switchTo}
            >
              {locale === 'id' ? 'EN' : 'ID'}
            </a>
            <ThemeCycle />
            <HeaderSession
              labels={{
                open: t.nav.open,
                signIn: t.nav.signIn,
                signUp: t.nav.signUp,
                signUpShort: t.nav.signUpShort,
              }}
            />
          </div>
        </div>
      </Container>
    </header>
  )
}

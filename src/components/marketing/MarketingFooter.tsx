import { appUrl } from '@/lib/site'
import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'
import type { Dictionary, Locale } from '@/lib/i18n'
import { Container } from './Container'

/**
 * The footer for the signed-out site, and the only place the legal pages are
 * linked from. The app's own frame has no footer and does not want one.
 *
 * Laid out the way efolusi.com's is: brand and one line on the left, short
 * link columns on the right, and the legal entity on its own row. The entity
 * and its punctuation match the efolusi.com footer exactly.
 *
 * The routes below are owned by the pages workstream. They are listed here
 * rather than passed in because a footer whose links are configurable is a
 * footer that can ship with none.
 */
export function MarketingFooter({ t, locale }: { t: Dictionary; locale: Locale }) {
  const home = `/${locale}`
  const product = [
    { href: `${home}#features`, label: t.nav.features },
    { href: `${home}#how-it-works`, label: t.nav.how },
    { href: `${home}/pricing`, label: t.footer.pricing },
    { href: appUrl('/signin'), label: t.nav.signIn },
  ]
  const legal = [
    { href: `${home}/privacy`, label: t.footer.privacy },
    { href: `${home}/terms`, label: t.footer.terms },
  ]
  const year = new Date().getFullYear()

  return (
    <footer className="mk-footer">
      <Container>
        <div className="mk-footer__top">
          <div className="mk-footer__brand">
            <Link href={home} className="mk-wordmark">
              <BrandMark size={20} />
              Trady
            </Link>
            <p className="mk-footer__tagline">{t.footer.tagline}</p>
          </div>
          <nav className="mk-footer__col" aria-labelledby="mk-footer-product">
            <h2 id="mk-footer-product">{t.footer.product}</h2>
            <ul>
              {product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="mk-footer__col" aria-labelledby="mk-footer-legal">
            <h2 id="mk-footer-legal">{t.footer.legal}</h2>
            <ul>
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mk-footer__bottom">
          <p>{t.footer.rights.replace('{year}', String(year))}</p>
          <p>{t.footer.madeIn}</p>
        </div>
      </Container>
    </footer>
  )
}

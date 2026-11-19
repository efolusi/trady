import { SkipLink } from '@efolusi/meridian'
import type { Dictionary, Locale } from '@/lib/i18n'
import { MarketingFooter } from './MarketingFooter'
import { MarketingHeader } from './MarketingHeader'

/**
 * The frame every signed-out page renders inside: header, main, footer.
 *
 * Wrap your page in this. Do not wrap it in AppShell as well, and do not add a
 * second <main>: SiteShell leaves marketing routes bare precisely so this can
 * own the document landmarks.
 *
 * It stays a server component, so the header, the footer and their links never
 * reach the client bundle. Only the selection timeline is interactive, and it
 * carries its own 'use client'.
 */
export function MarketingShell({
  children,
  t,
  locale,
}: {
  children: React.ReactNode
  t: Dictionary
  locale: Locale
}) {
  return (
    // `.mk-site` scopes the Efolusi landing standard (radii, 64px header,
    // 52/40/36 controls) to the signed-out site; the app keeps Meridian's
    // defaults. See the conformance block in globals.css.
    <div className="mk-site">
      {/* First focusable element on the page, so one Tab and Enter skips the
          header. The target needs tabIndex -1, or Safari and Firefox scroll to
          it and leave focus in the header. */}
      <SkipLink href="#main">{t.skipToContent}</SkipLink>
      <MarketingHeader t={t} locale={locale} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  )
}

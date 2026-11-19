import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { Container } from '@/components/marketing/Container'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Section } from '@/components/marketing/Section'
import { dictionaries, type Locale } from '@/lib/i18n'

/**
 * The 404 page, in the reader's language.
 *
 * Every unknown path gets the signed-out site's own frame: header, footer, the
 * landing typography and a way back. It used to depend on the path: only /en
 * and /id got the marketing frame, and anything else (which is most of what a
 * stranger mistypes, /zzz-nope included) fell through to the signed-in app
 * chrome with a bare message inside it. SiteShell now leaves an unknown path
 * bare so this page can bring the frame itself; see APP_PREFIXES in lib/app-routes.ts.
 *
 * A server component, so the header and footer stay off the client bundle and
 * so `metadata` below is read: Next renders this file as the `/_not-found`
 * route and resolves its metadata like any other page's. The language comes
 * from the request in the same order the middleware uses for '/': the prefix
 * the reader was under, then their stored choice, then the edge country.
 */
const COPY = {
  en: {
    eyebrow: 'Error 404',
    title: 'This page does not exist.',
    body: 'The link may be old, or the address may have a typo. The home page and pricing are both one click away.',
    documentTitle: 'Trady · page not found',
    home: 'Go to the home page',
    pricing: 'See pricing',
  },
  id: {
    eyebrow: 'Galat 404',
    title: 'Halaman ini tidak ada.',
    body: 'Tautannya mungkin sudah lama, atau alamatnya salah ketik. Halaman utama dan harga hanya sekali klik.',
    documentTitle: 'Trady · halaman tidak ditemukan',
    home: 'Ke halaman utama',
    pricing: 'Lihat harga',
  },
} as const

function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'id'
}

/**
 * The language the reader was in, in the same order the middleware uses for
 * '/': the prefix they were under (set as a request header by the middleware,
 * so `/id/typo` is Indonesian before any cookie exists), then their stored
 * choice, then the edge country.
 */
async function requestLocale(): Promise<Locale> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()])
  const fromPath = headerStore.get('x-locale') ?? undefined
  if (isLocale(fromPath)) return fromPath
  const stored = cookieStore.get('lang')?.value
  if (isLocale(stored)) return stored
  return headerStore.get('cf-ipcountry') === 'ID' ? 'id' : 'en'
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale()
  return {
    // Absolute, because the root template ('%s · Trady') would otherwise
    // append the brand a second time.
    title: { absolute: COPY[locale].documentTitle },
    // Next marks /_not-found noindex on its own; stating it here keeps the
    // page out of the index even if that default ever changes.
    robots: { index: false, follow: true },
  }
}

export default async function NotFound() {
  const locale = await requestLocale()
  const copy = COPY[locale]

  return (
    <MarketingShell t={dictionaries[locale]} locale={locale}>
      <Section>
        <Container>
          <div className="mk-notfound">
            <span className="mk-eyebrow">{copy.eyebrow}</span>
            <h1 className="mk-display-lg">{copy.title}</h1>
            <p className="mk-prose">{copy.body}</p>
            <div className="mk-notfound__actions">
              <Link href={`/${locale}`} className="mk-btn mk-btn--primary mk-btn--lg">
                {copy.home}
              </Link>
              <Link href={`/${locale}/pricing`} className="mk-btn mk-btn--outline mk-btn--lg">
                {copy.pricing}
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </MarketingShell>
  )
}

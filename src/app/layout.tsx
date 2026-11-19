import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
// Imported once, at the root. This is the only Meridian stylesheet: it pulls in
// the six token files (fonts, colors, typography, spacing, effects, base).
// Individual components inject their own CSS at runtime, so nothing else needs
// importing here.
import '@efolusi/meridian/styles.css'
import './globals.css'
import { dictionaries, LOCALE_HEADER, localeFromHeader } from '@/lib/i18n'
import { THEME_STORAGE_KEY } from '@/lib/theme'

export const metadata: Metadata = {
  // Absolute-URL base for every canonical, OpenGraph and sitemap link. Without
  // it a page's `alternates.canonical: '/pricing'` stays relative and search
  // engines cannot resolve it.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trady.efolusi.com'),
  // Every route's title gets the suffix from the template. The landing pages
  // already lead with the brand, so they opt out with `title.absolute`.
  title: { default: 'Trady', template: '%s · Trady' },
  description:
    'Trady turns one long video into vertical clips with word by word captions, and tells you which moments are worth cutting.',
  openGraph: {
    siteName: 'Trady',
    type: 'website',
    locale: 'en_US',
  },
}

/** Browser chrome colour, matched to --surface-page in each theme. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#191512' },
  ],
}

/**
 * Applies the stored or preferred theme before first paint.
 *
 * Meridian themes off `data-theme` on the root element, and the comment this
 * replaces claimed to avoid the light-to-dark flash while hardcoding "light".
 * Doing it in an effect repaints after hydration, which is the flash every
 * dark-mode user notices; a blocking inline script is the only way to have the
 * attribute set before the browser paints.
 */
const themeScript = `(function(){try{
var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var dark=stored==='dark'||((stored===null||stored==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme=dark?'dark':'light';
}catch(e){}})()`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Which language the reader is in. Set by middleware.ts, the only thing in a
  // server render that knows the path: this layout wraps /en and /id alike and
  // gets no params, so without the header every Indonesian page went out as
  // `<html lang="en">`. Reading a header makes the document dynamic, which is
  // the price of having the attribute right in the FIRST response rather than
  // patched in after hydration.
  const headerList = await headers()
  const lang = dictionaries[localeFromHeader(headerList.get(LOCALE_HEADER))].htmlLang
  // The CSP nonce from middleware.ts; the inline theme script must carry it.
  const nonce = headerList.get('x-nonce') ?? undefined
  return (
    // suppressHydrationWarning because the script below rewrites data-theme
    // before React hydrates, so the server's guess and the live DOM legitimately
    // differ on exactly this attribute.
    <html lang={lang} data-theme="light" data-density="comfortable" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a blocking inline script is the
            only way to set the theme before first paint, and the content is a compile-time
            constant with no interpolated input. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'

type Locale = 'en' | 'id'
type OpenGraph = NonNullable<Metadata['openGraph']>

/**
 * The OpenGraph fields every marketing route shares, for one language.
 *
 * Next.js does not deep-merge `openGraph`: a page that sets it replaces the
 * layout's object wholesale, including `siteName`, `locale` and the image from
 * `app/opengraph-image.tsx`. Without this, an Indonesian page either inherited
 * the layout's `en_US` or, once it set its own `openGraph`, lost the locale and
 * the share card entirely. Spread this first, then add page-specific fields.
 */
export function openGraphFor(locale: Locale): OpenGraph {
  return {
    siteName: 'Trady',
    type: 'website',
    locale: locale === 'id' ? 'id_ID' : 'en_US',
    alternateLocale: locale === 'id' ? ['en_US'] : ['id_ID'],
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Trady: turn one long video into vertical, captioned clips',
      },
    ],
  }
}

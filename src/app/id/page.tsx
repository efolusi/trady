import type { Metadata } from 'next'
import { LandingPage } from '@/components/marketing/LandingPage'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/**
 * The Indonesian landing page.
 *
 * A real route rather than a client-side language switch: the copy has to be
 * in the HTML for search engines, and a reader who lands here from a shared
 * link must get Indonesian without a flash of English first. `/` stays the
 * English page and doubles as the signed-in dashboard, which is why the two
 * are separate files instead of one [lang] segment.
 */
export const metadata: Metadata = {
  // Absolute: the root template would append a second "· Trady". The pattern is
  // "Product · value proposition", the same as efolusi.com's own title.
  title: { absolute: 'Trady · Ubah rekaman panjang jadi klip pendek ber-caption' },
  description:
    'Trady mengubah satu video panjang menjadi klip vertikal pendek dengan caption per kata, lengkap dengan skor, kategori, dan timecode-nya. Mulai gratis.',
  alternates: { canonical: '/id', languages: { en: '/en', id: '/id', 'x-default': '/en' } },
  openGraph: {
    ...openGraphFor('id'),
    title: 'Trady · Ubah rekaman panjang jadi klip pendek ber-caption',
    description:
      'Trady mengubah satu video panjang menjadi klip vertikal pendek dengan caption per kata, lengkap dengan skor, kategori, dan timecode-nya. Mulai gratis.',
    url: '/id',
  },
  twitter: { card: 'summary_large_image' },
}

export default function IndonesianLandingPage() {
  return <LandingPage t={dictionaries.id} locale="id" />
}

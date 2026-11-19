import type { Metadata } from 'next'
import { LandingPage } from '@/components/marketing/LandingPage'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/**
 * The English landing page.
 *
 * Both languages live under their own prefix — /en and /id — so neither is a
 * special case and every link, canonical and alternate has an obvious shape.
 * `/` is the dashboard for signed-in visitors and a language gateway for
 * everyone else (see middleware.ts).
 */
export const metadata: Metadata = {
  // Absolute: the root template would append a second "· Trady". The pattern is
  // "Product · value proposition", the same as efolusi.com's own title.
  title: { absolute: 'Trady · Turn long recordings into short, captioned clips' },
  description:
    'Trady turns one long video into short vertical clips with word-timed captions, each with its score, category and timecode. Start free.',
  alternates: { canonical: '/en', languages: { en: '/en', id: '/id', 'x-default': '/en' } },
  openGraph: {
    ...openGraphFor('en'),
    title: 'Trady · Turn long recordings into short, captioned clips',
    description:
      'Trady turns one long video into short vertical clips with word-timed captions, each with its score, category and timecode. Start free.',
    url: '/en',
  },
  twitter: { card: 'summary_large_image' },
}

export default function EnglishLandingPage() {
  return <LandingPage t={dictionaries.en} locale="en" />
}

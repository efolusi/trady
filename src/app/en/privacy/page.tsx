import type { Metadata } from 'next'
import { LegalDocument } from '@/components/marketing/LegalDocument'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/**
 * Privacy, under a language prefix like every other marketing route.
 *
 * The bare /privacy kept working for old links (see src/app/privacy), but a
 * visitor reading the Indonesian site should be able to walk to /id/privacy
 * and land somewhere, rather than on a 404 that looks like the site is half
 * finished.
 */
export const metadata: Metadata = {
  title: dictionaries.en.legal.privacy.metaTitle,
  description: dictionaries.en.legal.privacy.metaDescription,
  alternates: {
    canonical: '/en/privacy',
    languages: { en: '/en/privacy', id: '/id/privacy', 'x-default': '/en/privacy' },
  },
  // No openGraph title: Next.js fills it (and the Twitter card's) from the
  // resolved page title, so the shared card reads the same as the tab.
  openGraph: {
    ...openGraphFor('en'),
    description: dictionaries.en.legal.privacy.metaDescription,
    url: '/en/privacy',
    type: 'article',
  },
}

export default function EnglishPrivacyPage() {
  return <LegalDocument doc={dictionaries.en.legal.privacy} locale="en" />
}

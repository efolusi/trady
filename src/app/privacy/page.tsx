import type { Metadata } from 'next'
import { LegalDocument } from '@/components/marketing/LegalDocument'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/** Kept for links made before the language prefixes existed. */
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

export default function PrivacyPage() {
  return <LegalDocument doc={dictionaries.en.legal.privacy} locale="en" />
}

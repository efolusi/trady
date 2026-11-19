import type { Metadata } from 'next'
import { LegalDocument } from '@/components/marketing/LegalDocument'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/** Kept for links made before the language prefixes existed. */
export const metadata: Metadata = {
  title: dictionaries.en.legal.terms.metaTitle,
  description: dictionaries.en.legal.terms.metaDescription,
  alternates: {
    canonical: '/en/terms',
    languages: { en: '/en/terms', id: '/id/terms', 'x-default': '/en/terms' },
  },
  // No openGraph title: Next.js fills it (and the Twitter card's) from the
  // resolved page title, so the shared card reads the same as the tab.
  openGraph: {
    ...openGraphFor('en'),
    description: dictionaries.en.legal.terms.metaDescription,
    url: '/en/terms',
    type: 'article',
  },
}

export default function TermsPage() {
  return <LegalDocument doc={dictionaries.en.legal.terms} locale="en" />
}

import type { Metadata } from 'next'
import { LegalDocument } from '@/components/marketing/LegalDocument'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/**
 * Terms in Indonesian.
 *
 * A real route rather than a client-side language switch, for the same reason
 * the landing page is: the text has to be in the HTML, and a reader who lands
 * here from a shared link must get Indonesian without a flash of English. The
 * page carries a visible note that the English version governs, so translating
 * the terms does not create a second legal text competing with the first.
 */
export const metadata: Metadata = {
  title: dictionaries.id.legal.terms.metaTitle,
  description: dictionaries.id.legal.terms.metaDescription,
  alternates: {
    canonical: '/id/terms',
    languages: { en: '/en/terms', id: '/id/terms', 'x-default': '/en/terms' },
  },
  // No openGraph title: Next.js fills it (and the Twitter card's) from the
  // resolved page title, so the shared card reads the same as the tab.
  openGraph: {
    ...openGraphFor('id'),
    description: dictionaries.id.legal.terms.metaDescription,
    url: '/id/terms',
    type: 'article',
  },
}

export default function IndonesianTermsPage() {
  return <LegalDocument doc={dictionaries.id.legal.terms} locale="id" />
}

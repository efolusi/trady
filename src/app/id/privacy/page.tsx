import type { Metadata } from 'next'
import { LegalDocument } from '@/components/marketing/LegalDocument'
import { dictionaries } from '@/lib/i18n'
import { openGraphFor } from '@/lib/open-graph'

/**
 * Privacy in Indonesian.
 *
 * A real route rather than a client-side language switch, for the same reason
 * the landing page is: the text has to be in the HTML, and a reader who lands
 * here from a shared link must get Indonesian without a flash of English. The
 * page carries a visible note that the English version governs, so translating
 * a policy does not create a second legal text competing with the first.
 */
export const metadata: Metadata = {
  title: dictionaries.id.legal.privacy.metaTitle,
  description: dictionaries.id.legal.privacy.metaDescription,
  alternates: {
    canonical: '/id/privacy',
    languages: { en: '/en/privacy', id: '/id/privacy', 'x-default': '/en/privacy' },
  },
  // No openGraph title: Next.js fills it (and the Twitter card's) from the
  // resolved page title, so the shared card reads the same as the tab.
  openGraph: {
    ...openGraphFor('id'),
    description: dictionaries.id.legal.privacy.metaDescription,
    url: '/id/privacy',
    type: 'article',
  },
}

export default function IndonesianPrivacyPage() {
  return <LegalDocument doc={dictionaries.id.legal.privacy} locale="id" />
}

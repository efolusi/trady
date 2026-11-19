import type { Metadata } from 'next'
import { PricingScreen } from '@/components/marketing/PricingScreen'
import { openGraphFor } from '@/lib/open-graph'

/** Kept for links made before the language prefixes existed. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  alternates: {
    canonical: '/en/pricing',
    languages: { en: '/en/pricing', id: '/id/pricing', 'x-default': '/en/pricing' },
  },
  openGraph: openGraphFor('en'),
}

export default function Page() {
  return <PricingScreen locale="en" />
}

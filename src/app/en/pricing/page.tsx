import type { Metadata } from 'next'
import { PricingScreen } from '@/components/marketing/PricingScreen'
import { openGraphFor } from '@/lib/open-graph'

/**
 * Pricing, under a language prefix like every other marketing route.
 *
 * The bare /pricing kept working for old links (see src/app/pricing), but a
 * visitor reading the Indonesian site should be able to walk to /id/pricing
 * and land somewhere, rather than on a 404 that looks like the site is half
 * finished.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Trady pricing: charged per minute of source video, never per clip, and a run that finds nothing is never billed.',
  alternates: {
    canonical: '/en/pricing',
    languages: { en: '/en/pricing', id: '/id/pricing', 'x-default': '/en/pricing' },
  },
  openGraph: openGraphFor('en'),
}

export default function Page() {
  return <PricingScreen locale="en" />
}

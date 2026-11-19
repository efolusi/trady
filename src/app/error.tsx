'use client'

import { ErrorScreen } from '@/components/ErrorScreen'

/**
 * The boundary Next renders when a page below the root layout throws. The
 * layout, and with it the app frame or the bare signed-out chrome, stays in
 * place; only the page is swapped for this.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  return <ErrorScreen digest={error.digest} onRetry={reset} />
}

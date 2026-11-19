'use client'

// Rendered INSTEAD of the root layout, so it has to bring the document and the
// stylesheets the layout would have imported.
import '@efolusi/meridian/styles.css'
import './globals.css'
import { ErrorScreen } from '@/components/ErrorScreen'

/**
 * The last boundary: the root layout itself threw. Without this file Next
 * shows its own unstyled "Application error" line. No theme script here on
 * purpose: if the layout failed, the less this page depends on, the better,
 * and the light theme is the safe default.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  return (
    <html lang="en" data-theme="light" data-density="comfortable">
      <body>
        <ErrorScreen digest={error.digest} onRetry={reset} />
      </body>
    </html>
  )
}

'use client'

import { Button } from '@efolusi/meridian'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * What a reader sees when a page throws, shared by app/error.tsx and
 * app/global-error.tsx.
 *
 * Next's own fallback is a bare "Application error" line on a white page,
 * which reads as the site being down and tells nobody what to do. This keeps
 * the product's type and buttons, offers the two things that help (try again,
 * go home) and never prints the error itself: messages and stacks are for the
 * server logs, and Next already strips them from production builds anyway.
 * The digest is shown because it is an opaque id support can match to a log
 * line, not a detail of the failure.
 */
const COPY = {
  en: {
    eyebrow: 'Something went wrong',
    title: 'This page could not load.',
    body: 'It may be a hiccup on our side. Try again, and if it keeps happening, head back to the home page and start from there.',
    retry: 'Try again',
    home: 'Go to the home page',
    reference: 'Reference',
  },
  id: {
    eyebrow: 'Terjadi kesalahan',
    title: 'Halaman ini gagal dimuat.',
    body: 'Mungkin ada gangguan sesaat di sisi kami. Coba lagi, dan kalau masih terjadi, kembali ke halaman utama lalu mulai dari sana.',
    retry: 'Coba lagi',
    home: 'Ke halaman utama',
    reference: 'Kode referensi',
  },
} as const

/** Indonesian under /id, English everywhere else, which is how the site is split. */
export function errorLocale(pathname: string | null): 'en' | 'id' {
  return pathname !== null && /^\/id(?=\/|$)/.test(pathname) ? 'id' : 'en'
}

export function ErrorScreen({
  digest,
  onRetry,
}: {
  digest?: string | undefined
  onRetry: () => void
}): React.JSX.Element {
  const pathname = usePathname()
  const locale = errorLocale(pathname)
  const copy = COPY[locale]
  // '/' is the dashboard for a signed-in reader and the landing page for
  // everyone else, so it is the right "home" from the app too.
  const home = locale === 'id' ? '/id' : '/'

  const content = (
    <div className="mk-container">
      <div className="mk-notfound" role="alert">
        <span className="mk-eyebrow">{copy.eyebrow}</span>
        <h1 className="mk-display-lg">{copy.title}</h1>
        <p className="mk-prose">{copy.body}</p>
        <div className="mk-notfound__actions">
          <Button size="lg" iconLeft="refresh-cw" onClick={onRetry}>
            {copy.retry}
          </Button>
          <Link href={home} className="mk-btn mk-btn--outline mk-btn--lg">
            {copy.home}
          </Link>
        </div>
        {digest ? (
          <p className="muted">
            {copy.reference}: <code>{digest}</code>
          </p>
        ) : null}
      </div>
    </div>
  )

  // Nothing wraps an error page on the site, so it brings its own landmark.
  return (
    <main id="main" tabIndex={-1}>
      {content}
    </main>
  )
}

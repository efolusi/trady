import { type NextRequest, NextResponse } from 'next/server'
import { isAppPath } from './lib/app-routes'
import { appUrl, siteUrl } from './lib/site'

/**
 * Sends a first-time Indonesian visitor from `/` to the Indonesian landing page.
 *
 * Cloudflare resolves the country at the edge (`cf-ipcountry`), so this costs
 * no lookup and no third-party call. A choice wins over the guess: visiting
 * either language writes `lang`, and that cookie decides every later visit.
 *
 * The app (projects, editor, clips, usage, social, sign-in) lives on its own
 * host now. Old links to those routes get a 308 to the same path there.
 */
const COOKIE = 'lang'
const YEAR = 60 * 60 * 24 * 365

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Remember whichever language page is being read, including a manual switch,
  // and tell the render which language the path was in. The header is what the
  // root layout reads to set `<html lang>`: a first-time reader of /id/harga
  // has no `lang` cookie yet, and a server component outside a [lang] segment
  // cannot see the path any other way.
  const onLanguagePath = /^\/(en|id)(?=\/|$)/.exec(pathname)
  if (onLanguagePath) {
    const current = onLanguagePath[1] as 'en' | 'id'
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', current)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (request.cookies.get(COOKIE)?.value !== current) {
      response.cookies.set(COOKIE, current, { maxAge: YEAR, path: '/', sameSite: 'lax' })
    }
    return response
  }

  // The app moved to its own host: old links to app routes follow it there.
  if (isAppPath(pathname) || pathname === '/signin') {
    return NextResponse.redirect(appUrl(`${pathname}${request.nextUrl.search}`), 308)
  }

  if (pathname !== '/') return NextResponse.next()

  // A session means this is the dashboard, not a landing page.
  const stored = request.cookies.get(COOKIE)?.value
  const locale =
    stored === 'en' || stored === 'id'
      ? stored
      : request.headers.get('cf-ipcountry') === 'ID'
        ? 'id'
        : 'en'

  // `request.nextUrl` is the internal Node listener behind nginx (for example
  // https://localhost:13002), even when Host/X-Forwarded-* describe the public
  // request correctly. Build redirects from the validated canonical site
  // origin so an internal listener can never escape into a Location header.
  const url = new URL(siteUrl())
  url.pathname = `/${locale}`
  url.search = request.nextUrl.search
  // 307: the destination depends on who is asking and must not be cached as a
  // fact about this URL.
  return NextResponse.redirect(url, 307)
}

// Literals, because Next reads this statically. `:path*` matches zero or more
// segments, so '/usage/:path*' covers the bare '/usage' too, the same way
// '/id/:path*' covers '/id'. Keep the app entries in step with APP_PREFIXES;
// the middleware test fails if they drift.
export const config = {
  matcher: [
    '/',
    '/en/:path*',
    '/id/:path*',
    '/projects/:path*',
    '/clips/:path*',
    '/usage/:path*',
    '/social/:path*',
    '/editor/:path*',
    '/signin',
  ],
}

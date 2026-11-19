import { type NextRequest, NextResponse } from 'next/server'
import { isAppPath } from './lib/app-routes'
import { buildCsp, generateNonce } from './lib/csp'
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

  // The app moved to its own host: old links to app routes follow it there.
  if (isAppPath(pathname) || pathname === '/signin') {
    return NextResponse.redirect(appUrl(`${pathname}${request.nextUrl.search}`), 308)
  }

  // Every page gets a CSP with a fresh nonce. Next reads it from the request
  // header and nonces its own scripts; the layout reads x-nonce for the theme
  // script. Development uses no nonce (see lib/csp.ts).
  const isProduction = process.env.NODE_ENV === 'production'
  const nonce = isProduction ? generateNonce() : undefined
  const csp = buildCsp({ nonce, isProduction })
  const requestHeaders = new Headers(request.headers)
  if (nonce) {
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('content-security-policy', csp)
  }
  const next = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // Remember whichever language page is being read, including a manual switch,
  // and tell the render which language the path was in. The header is what the
  // root layout reads to set `<html lang>`: a first-time reader of /id/harga
  // has no `lang` cookie yet, and a server component outside a [lang] segment
  // cannot see the path any other way.
  const onLanguagePath = /^\/(en|id)(?=\/|$)/.exec(pathname)
  if (onLanguagePath) {
    const current = onLanguagePath[1] as 'en' | 'id'
    requestHeaders.set('x-locale', current)
    const response = next()
    if (request.cookies.get(COOKIE)?.value !== current) {
      response.cookies.set(COOKIE, current, { maxAge: YEAR, path: '/', sameSite: 'lax' })
    }
    return response
  }

  if (pathname !== '/') return next()

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

// Every page runs this, for the CSP; static files and images do not need it.
// A literal, because Next reads it statically.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|brand/|favicon.ico|icon.svg|apple-icon.png|icon-192.png|icon-512.png|manifest.webmanifest|robots.txt|sitemap.xml|llms.txt|opengraph-image).*)',
  ],
}

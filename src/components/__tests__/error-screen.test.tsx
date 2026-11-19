import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

/**
 * The branded error boundary. What it must never do is show the reader the
 * failure itself; what it must always do is offer a retry and a way home.
 */
let pathname = '/usage'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

const { ErrorScreen, errorLocale } = await import('../ErrorScreen')
const { default: ErrorBoundary } = await import('../../app/error')

function render(path: string, error: Error & { digest?: string }): string {
  pathname = path
  return renderToStaticMarkup(<ErrorBoundary error={error} reset={() => {}} />)
}

describe('error boundary', () => {
  it('never prints the message or the stack', () => {
    const error = Object.assign(new Error('db password is hunter2'), { digest: '12345' })
    const html = render('/usage', error)
    expect(html).not.toContain('hunter2')
    expect(html).not.toContain('error-screen.test')
    expect(html).toContain('12345')
  })

  it('offers a retry and a way home', () => {
    const html = render('/projects/abc', new Error('x'))
    expect(html).toContain('Try again')
    expect(html).toContain('href="/"')
  })

  it('speaks Indonesian under /id', () => {
    const html = render('/id/pricing', new Error('x'))
    expect(html).toContain('Coba lagi')
    expect(html).toContain('href="/id"')
  })

  it('brings its own landmark', () => {
    pathname = '/en/pricing'
    expect(renderToStaticMarkup(<ErrorScreen onRetry={() => {}} />)).toContain(
      '<main id="main" tabindex="-1">',
    )
  })

  it('picks the language from the path prefix', () => {
    expect(errorLocale('/id')).toBe('id')
    expect(errorLocale('/id/terms')).toBe('id')
    expect(errorLocale('/identity')).toBe('en')
    expect(errorLocale(null)).toBe('en')
  })
})

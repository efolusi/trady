import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { dictionaries } from '@/lib/i18n'
import { SelectionTimeline } from '../SelectionTimeline'

/**
 * The blocks are a few pixels wide, so the finger-sized way to move between
 * them is a pair of step buttons. These pin that the buttons exist, are named
 * in the page's language, and that the blocks are no longer pointer targets
 * (the band maps every tap by time instead). Sizes are measured in a browser;
 * see the PR.
 */
function render(locale: 'en' | 'id'): string {
  const t = dictionaries[locale].hero
  return renderToStaticMarkup(
    <SelectionTimeline
      label={t.figureLabel}
      previousLabel={t.previousMoment}
      nextLabel={t.nextMoment}
    />,
  )
}

describe('selection timeline step buttons', () => {
  it.each(['en', 'id'] as const)('are labelled in %s', (locale) => {
    const html = render(locale)
    const t = dictionaries[locale].hero
    expect(html).toContain(`aria-label="${t.previousMoment}"`)
    expect(html).toContain(`aria-label="${t.nextMoment}"`)
  })

  it('come before the band, so they are reached before the 32 blocks', () => {
    const html = render('en')
    expect(html.indexOf('mk-timeline__step')).toBeLessThan(html.indexOf('mk-timeline__band'))
  })

  it('are never disabled, which would drop focus to the page', () => {
    expect(render('en')).not.toMatch(/<button[^>]*mk-timeline__step[^>]*disabled=""/)
  })
})

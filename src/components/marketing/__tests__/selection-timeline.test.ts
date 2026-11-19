import { describe, expect, it } from 'vitest'
import { EPISODE_DURATION_SECONDS, SELECTED_MOMENTS } from '../episode-fixture'
import { nearestMomentIndex } from '../SelectionTimeline'

/**
 * A tap on the band picks a moment by time. Block width is the clip's duration
 * to scale, so the narrowest block is under 5px on a phone and no finger can
 * hit one; the band itself is the target instead. That makes this mapping the
 * whole correctness of the interaction, and none of it is visible in the
 * markup, so it is tested directly.
 */
describe('nearestMomentIndex', () => {
  it('returns the moment a point falls inside', () => {
    SELECTED_MOMENTS.forEach((moment, index) => {
      const middle = moment.startSeconds + moment.durationSeconds / 2
      expect(nearestMomentIndex(middle)).toBe(index)
    })
  })

  it('returns the nearest moment for a point in a gap between two', () => {
    const [first, second] = SELECTED_MOMENTS
    if (!first || !second) throw new Error('the fixture must hold at least two moments')
    const gapStart = first.startSeconds + first.durationSeconds
    const gap = second.startSeconds - gapStart
    // The gaps are wide enough to have a clear near side; the fixture test
    // guards the ordering this relies on.
    expect(gap).toBeGreaterThan(0)
    expect(nearestMomentIndex(gapStart + gap * 0.1)).toBe(0)
    expect(nearestMomentIndex(gapStart + gap * 0.9)).toBe(1)
  })

  it('clamps to the ends rather than running off them', () => {
    expect(nearestMomentIndex(-600)).toBe(0)
    expect(nearestMomentIndex(EPISODE_DURATION_SECONDS + 600)).toBe(SELECTED_MOMENTS.length - 1)
  })

  it('does not assume the moments are evenly spaced', () => {
    // The even-spacing shortcut `round(fraction * (n - 1))` is wrong wherever
    // the picks bunch up. Prove at least one point where the two disagree, so
    // this test fails if someone simplifies the mapping back to it.
    const disagreements = SELECTED_MOMENTS.filter((moment, index) => {
      const middle = moment.startSeconds + moment.durationSeconds / 2
      const evenly = Math.round((middle / EPISODE_DURATION_SECONDS) * (SELECTED_MOMENTS.length - 1))
      return evenly !== index
    })
    expect(disagreements.length).toBeGreaterThan(0)
  })
})

/**
 * Why the blocks are not tap targets, as a number. If the fixture or the
 * layout ever spreads the moments out enough for a 24px target each without
 * overlap, this fails and the per block targets can come back.
 */
describe('block spacing', () => {
  it('is too tight for a 24px target per block at tablet width', () => {
    // The band is about 660px wide at a 768px viewport.
    const bandWidth = 660
    const centres = SELECTED_MOMENTS.map(
      (m) => ((m.startSeconds + m.durationSeconds / 2) / EPISODE_DURATION_SECONDS) * bandWidth,
    )
    const pitches = centres.slice(1).map((c, i) => c - (centres[i] ?? 0))
    expect(Math.min(...pitches)).toBeLessThan(24)
  })
})

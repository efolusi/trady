import { describe, expect, it } from 'vitest'
import {
  EPISODE_DURATION_SECONDS,
  SELECTED_MOMENTS,
  SELECTION_SUMMARY,
  SELECTION_SUMMARY_LINE,
} from '../episode-fixture'

/**
 * The fixture is marketing copy and a figure at the same time, which is exactly
 * the kind of thing that rots: someone adds a moment, the picture changes, and
 * the sentence beside it still says 32. These tests are the reason it cannot.
 *
 * They also pin the fixture to the product's real rules, so the landing page
 * cannot advertise a selection the pipeline would never produce.
 */
describe('episode fixture', () => {
  it('claims the episode length the design was built around', () => {
    expect(EPISODE_DURATION_SECONDS).toBe(4404)
    expect(SELECTION_SUMMARY.episodeTimecode).toBe('1:13:24')
  })

  it('is the 32 moments the copy promises', () => {
    expect(SELECTED_MOMENTS).toHaveLength(32)
    expect(SELECTION_SUMMARY.clipCount).toBe(32)
  })

  it('has a median clip of one minute four seconds', () => {
    expect(SELECTION_SUMMARY.medianClipSeconds).toBe(64)
    expect(SELECTION_SUMMARY.medianClipTimecode).toBe('1:04')
  })

  it('spells the summary the way the direction words it', () => {
    expect(SELECTION_SUMMARY_LINE).toBe(
      '73 minutes watched, 32 clips found, median 1 minute 4 seconds',
    )
  })

  // MIN_CLIP_SECONDS / MAX_CLIP_SECONDS in packages/pipeline/src/analysis/analyze.ts.
  it('respects the product rule that a clip runs 30 to 180 seconds', () => {
    for (const moment of SELECTED_MOMENTS) {
      expect(moment.durationSeconds).toBeGreaterThanOrEqual(30)
      expect(moment.durationSeconds).toBeLessThanOrEqual(180)
    }
  })

  it('scores every moment on the 0 to 99 scale the API returns', () => {
    for (const moment of SELECTED_MOMENTS) {
      expect(Number.isInteger(moment.score)).toBe(true)
      expect(moment.score).toBeGreaterThanOrEqual(0)
      expect(moment.score).toBeLessThanOrEqual(99)
    }
  })

  it('runs in order, without overlaps, inside the episode', () => {
    let previousEnd = 0
    for (const moment of SELECTED_MOMENTS) {
      expect(moment.startSeconds).toBeGreaterThanOrEqual(previousEnd)
      previousEnd = moment.startSeconds + moment.durationSeconds
    }
    expect(previousEnd).toBeLessThanOrEqual(EPISODE_DURATION_SECONDS)
  })

  it('gives every moment a unique id, because they are React keys', () => {
    const ids = new Set(SELECTED_MOMENTS.map((moment) => moment.id))
    expect(ids.size).toBe(SELECTED_MOMENTS.length)
  })

  // Not decoration: a run of one category would make the band look sorted when
  // the point of the figure is that selection is spread across the episode.
  it('covers the whole episode and more than one category', () => {
    const categories = new Set(SELECTED_MOMENTS.map((moment) => moment.category))
    expect(categories.size).toBeGreaterThanOrEqual(4)

    const first = SELECTED_MOMENTS[0]
    const last = SELECTED_MOMENTS[SELECTED_MOMENTS.length - 1]
    if (!first || !last) throw new Error('fixture is empty')
    expect(first.startSeconds).toBeLessThan(EPISODE_DURATION_SECONDS * 0.05)
    expect(last.startSeconds + last.durationSeconds).toBeGreaterThan(
      EPISODE_DURATION_SECONDS * 0.95,
    )
  })
})

import type { TranscriptDocument } from '@/lib/contracts'
import { describe, expect, it } from 'vitest'
import {
  cutsAfterDeleting,
  segmentIndexAt,
  segmentsToMeridianTranscript,
  toMeridianTranscript,
} from '../meridian-transcript.js'

const doc: TranscriptDocument = {
  version: 1,
  language: 'en',
  durationSeconds: 30,
  model: 'openai/whisper-large-v3',
  diarized: true,
  segments: [
    {
      ordinal: 0,
      text: 'welcome back',
      start: 0,
      end: 2,
      speaker: 'A',
      words: [
        { text: 'welcome', start: 0, end: 1 },
        { text: 'back', start: 1, end: 2 },
      ],
    },
    {
      ordinal: 1,
      text: 'today we ship',
      start: 2,
      end: 5,
      speaker: 'B',
      words: [
        { text: 'today', start: 2, end: 3 },
        { text: 'we', start: 3, end: 4 },
        { text: 'ship', start: 4, end: 5 },
      ],
    },
    // Deliberate gap at 5..8 so the silence case is covered.
    {
      ordinal: 2,
      text: 'thanks for watching',
      start: 8,
      end: 11,
      speaker: 'A',
      words: [
        { text: 'thanks', start: 8, end: 9 },
        { text: 'for', start: 9, end: 10 },
        { text: 'watching', start: 10, end: 11 },
      ],
    },
  ],
}

describe('toMeridianTranscript', () => {
  it('renames word fields to the shape Meridian expects', () => {
    const items = toMeridianTranscript(doc)
    expect(items[0]?.words).toEqual([
      { t: 0, w: 'welcome' },
      { t: 1, w: 'back' },
    ])
  })

  it('carries speaker labels through for multi-speaker layouts', () => {
    const items = toMeridianTranscript(doc)
    expect(items.map((i) => i.speaker)).toEqual(['A', 'B', 'A'])
  })

  it('omits speaker entirely when the transcript was not diarized', () => {
    const items = toMeridianTranscript({
      ...doc,
      diarized: false,
      segments: doc.segments.map(({ speaker: _drop, ...rest }) => rest),
    })
    expect(items.every((i) => !('speaker' in i))).toBe(true)
  })

  it('preserves word count exactly, since timings drive caption sync', () => {
    const items = toMeridianTranscript(doc)
    const before = doc.segments.reduce((n, s) => n + s.words.length, 0)
    const after = items.reduce((n, i) => n + (i.words?.length ?? 0), 0)
    expect(after).toBe(before)
  })
})

describe('segmentIndexAt', () => {
  const items = toMeridianTranscript(doc)

  it('finds the segment covering a position', () => {
    expect(segmentIndexAt(items, 3)).toBe(1)
  })

  it('treats a segment start as inside that segment', () => {
    expect(segmentIndexAt(items, 2)).toBe(1)
  })

  it('highlights nothing during a gap rather than holding the previous line lit', () => {
    expect(segmentIndexAt(items, 6.5)).toBe(-1)
  })

  it('highlights nothing past the end', () => {
    expect(segmentIndexAt(items, 99)).toBe(-1)
  })
})

describe('cutsAfterDeleting', () => {
  const items = toMeridianTranscript(doc)

  it('returns the full set when nothing is deleted', () => {
    const cuts = cutsAfterDeleting(items, new Set())
    // Segments 0 and 1 are adjacent (0..2, 2..5) so they merge into one range.
    expect(cuts).toEqual([
      { sourceStart: 0, sourceEnd: 5 },
      { sourceStart: 8, sourceEnd: 11 },
    ])
  })

  it('drops a deleted sentence from the middle', () => {
    const cuts = cutsAfterDeleting(items, new Set([1]))
    expect(cuts).toEqual([
      { sourceStart: 0, sourceEnd: 2 },
      { sourceStart: 8, sourceEnd: 11 },
    ])
  })

  it('merges neighbours that become adjacent, rather than emitting a cut per sentence', () => {
    const cuts = cutsAfterDeleting(items, new Set([2]))
    expect(cuts).toEqual([{ sourceStart: 0, sourceEnd: 5 }])
  })

  it('returns nothing when every segment is deleted', () => {
    expect(cutsAfterDeleting(items, new Set([0, 1, 2]))).toEqual([])
  })

  it('never produces overlapping cuts, which the render plan rejects', () => {
    const cuts = cutsAfterDeleting(items, new Set([1]))
    const sorted = [...cuts].sort((a, b) => a.sourceStart - b.sourceStart)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]?.sourceStart).toBeGreaterThanOrEqual(sorted[i - 1]?.sourceEnd ?? 0)
    }
  })
})

describe('segmentsToMeridianTranscript', () => {
  it('accepts bare segments, which is what clip detail ships', () => {
    // GET /clips/:id returns only the segments overlapping the clip window,
    // with no document to wrap them in.
    expect(segmentsToMeridianTranscript(doc.segments)).toEqual(toMeridianTranscript(doc))
  })

  it('leaves timings on the source timeline', () => {
    // Every timing in the API is source-relative and the caller subtracts the
    // clip start itself. Shifting here would be a second timeline in one
    // payload, which is an off-by-a-clip caption bug waiting to happen.
    const window = doc.segments.slice(2)
    const items = segmentsToMeridianTranscript(window)
    expect(items[0]?.start).toBe(8)
    expect(items[0]?.words?.[0]?.t).toBe(8)
  })
})

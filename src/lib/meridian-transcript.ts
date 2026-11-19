import type { Segment, TranscriptDocument } from '@/lib/contracts'

/**
 * Adapter between our transcript model and Meridian's `Transcript` component.
 *
 * The two disagree only in field names: Meridian uses `{ w, t }` per word where
 * we use `{ text, start }`. That is a small difference, and precisely why it
 * belongs in one tested function rather than being reshaped inline wherever a
 * transcript is rendered. Word timings drive the karaoke highlight, so getting
 * the mapping subtly wrong produces captions that drift out of sync with the
 * audio rather than an error anyone would notice in review.
 */

export interface MeridianTranscriptWord {
  t: number
  w: string
}

export interface MeridianTranscriptItem {
  start: number
  end?: number
  speaker?: string
  text?: string
  words?: MeridianTranscriptWord[]
}

/**
 * Segments, not a whole document, because clip detail ships only the segments
 * overlapping its window and has no document to wrap them in. Timings are left
 * on the source timeline: the contract keeps every timing source-relative and
 * the caller subtracts the clip start when it needs clip-relative time.
 */
export function segmentsToMeridianTranscript(
  segments: ReadonlyArray<Segment>,
): MeridianTranscriptItem[] {
  return segments.map((segment) => {
    const item: MeridianTranscriptItem = {
      start: segment.start,
      end: segment.end,
      text: segment.text,
      words: segment.words.map((word) => ({ t: word.start, w: word.text })),
    }
    // Only set speaker when diarization actually produced one. Passing
    // undefined explicitly would render an empty speaker label rather than
    // omitting it.
    if (segment.speaker !== undefined) item.speaker = segment.speaker
    return item
  })
}

export function toMeridianTranscript(doc: TranscriptDocument): MeridianTranscriptItem[] {
  return segmentsToMeridianTranscript(doc.segments)
}

/**
 * Which segment covers a given playback position.
 *
 * Returns -1 before the first segment or inside a gap, rather than clamping to
 * the nearest one: during silence between segments nothing should be
 * highlighted, and clamping would leave the previous line lit up through the
 * pause.
 */
export function segmentIndexAt(items: MeridianTranscriptItem[], seconds: number): number {
  return items.findIndex(
    (item) => seconds >= item.start && seconds < (item.end ?? Number.POSITIVE_INFINITY),
  )
}

/**
 * Source ranges to keep after deleting a set of segments.
 *
 * This is the whole of text-based editing: removing a sentence from the
 * transcript produces a new cut list, which the render plan already understands.
 * Adjacent survivors are merged so the plan does not accumulate a cut per
 * sentence, which would defeat the overlap validation and make the render shard
 * boundaries needlessly fragmented.
 */
export function cutsAfterDeleting(
  items: MeridianTranscriptItem[],
  deletedIndices: ReadonlySet<number>,
): Array<{ sourceStart: number; sourceEnd: number }> {
  const kept = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !deletedIndices.has(index))
    .map(({ item }) => ({
      sourceStart: item.start,
      sourceEnd: item.end ?? item.start,
    }))
    .filter((range) => range.sourceEnd > range.sourceStart)

  const merged: Array<{ sourceStart: number; sourceEnd: number }> = []
  for (const range of kept) {
    const previous = merged[merged.length - 1]
    if (previous && range.sourceStart <= previous.sourceEnd) {
      previous.sourceEnd = Math.max(previous.sourceEnd, range.sourceEnd)
    } else {
      merged.push({ ...range })
    }
  }
  return merged
}

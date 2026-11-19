import { z } from 'zod'

/**
 * The transcript document, as stored in object storage.
 *
 * Word-level timing is not optional detail here: karaoke captions, text-based
 * editing and silence trimming all read from it. A transcript without word
 * timings degrades three separate features at once, so the schema requires it
 * and the ASR adapter must fail loudly rather than return segments only.
 */

export const wordSchema = z.object({
  text: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).optional(),
  speaker: z.string().optional(),
})

export const segmentSchema = z.object({
  ordinal: z.number().int().nonnegative(),
  text: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  speaker: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  words: z.array(wordSchema),
})

export const transcriptDocumentSchema = z
  .object({
    version: z.literal(1),
    language: z.string().min(2),
    durationSeconds: z.number().positive(),
    model: z.string(),
    diarized: z.boolean().default(false),
    segments: z.array(segmentSchema),
  })
  .refine((doc) => doc.segments.every((s) => s.end >= s.start), {
    message: 'segment end must not precede its start',
  })
  .refine((doc) => doc.segments.some((s) => s.words.length > 0), {
    message:
      'transcript has no word-level timings; captions and text-based editing require them, ' +
      'so an ASR response without a words array must be treated as a failure rather than ' +
      'silently accepted',
  })

/**
 * One chunk of a fanned-out transcription.
 *
 * OpenRouter caps multipart uploads at 25 MB and upstream providers time out
 * around 60 seconds of processing, so long media is split, transcribed in
 * parallel, and stitched. `offsetSeconds` is what makes the stitch work:
 * each provider returns timings relative to its own chunk, and every one of
 * them has to be shifted back into the timeline of the original media.
 */
export const transcriptionChunkSchema = z.object({
  index: z.number().int().nonnegative(),
  offsetSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  /** Chunks overlap so a word split across a boundary is recoverable. */
  overlapSeconds: z.number().nonnegative(),
  storageKey: z.string(),
})

export type Word = z.infer<typeof wordSchema>
export type Segment = z.infer<typeof segmentSchema>
export type TranscriptDocument = z.infer<typeof transcriptDocumentSchema>
export type TranscriptionChunk = z.infer<typeof transcriptionChunkSchema>

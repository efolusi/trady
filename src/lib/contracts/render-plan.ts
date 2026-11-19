import { z } from 'zod'

/**
 * The render plan: the single description of what a clip looks like.
 *
 * The browser editor mutates this, the Remotion composition renders from it,
 * and the render farm consumes exactly the same document. That is the whole
 * reason for choosing a browser-based renderer: one schema means the preview
 * and the exported file cannot drift apart, and "looks right in the editor,
 * wrong in the download" stops being a class of bug that can exist.
 *
 * Everything here is data, never pixels. The crop path is a list of keyframes,
 * not a pre-cropped video, so the user can override what the tracker decided
 * without anything being re-encoded.
 */

export const aspectRatioSchema = z.enum(['9:16', '1:1', '4:5', '16:9'])

export const DIMENSIONS: Record<z.infer<typeof aspectRatioSchema>, [number, number]> = {
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '16:9': [1920, 1080],
}

/** A crop keyframe in source coordinates. Interpolated and smoothed at render time. */
export const cropKeyframeSchema = z.object({
  timeSeconds: z.number().nonnegative(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  /** Set when a human moved it. The tracker must never overwrite a manual keyframe. */
  manual: z.boolean().default(false),
})

export const layoutSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fill'), keyframes: z.array(cropKeyframeSchema) }),
  z.object({
    type: z.literal('split'),
    orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    panes: z.array(z.object({ speaker: z.string(), keyframes: z.array(cropKeyframeSchema) })),
  }),
  z.object({
    type: z.literal('pip'),
    main: z.array(cropKeyframeSchema),
    inset: z.array(cropKeyframeSchema),
    insetPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    insetScale: z.number().min(0.1).max(0.6).default(0.3),
  }),
  z.object({
    type: z.literal('screenshare'),
    screen: z.array(cropKeyframeSchema),
    speaker: z.array(cropKeyframeSchema),
    speakerHeightPct: z.number().min(10).max(50).default(30),
  }),
  /** Switches layout automatically from the active-speaker signal. */
  z.object({
    type: z.literal('dynamic'),
    switches: z.array(
      z.object({
        atSeconds: z.number().nonnegative(),
        layout: z.enum(['fill', 'split', 'pip', 'screenshare']),
        activeSpeaker: z.string().optional(),
      }),
    ),
    keyframes: z.array(cropKeyframeSchema),
  }),
])

export const captionStyleSchema = z.object({
  animation: z.enum(['karaoke', 'word_pop', 'typewriter', 'block', 'highlight_box']),
  fontFamily: z.string(),
  /**
   * Render workers have no system fonts. A family name alone silently falls
   * back to a default, and the export quietly stops matching the preview, so
   * the actual file must travel with the plan.
   */
  fontUrl: z.string().url(),
  fontSizePct: z.number().min(1).max(20),
  fontWeight: z.number().int().min(100).max(900).default(700),
  color: z.string(),
  highlightColor: z.string(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().nonnegative().default(0),
  backgroundColor: z.string().optional(),
  uppercase: z.boolean().default(false),
  maxWordsPerLine: z.number().int().min(1).max(12).default(4),
  positionYPct: z.number().min(0).max(100).default(72),
  emojiEnabled: z.boolean().default(false),
  keywordEmphasis: z.boolean().default(true),
})

/**
 * A non-destructive edit list. Removals (filler words, silences, deleted
 * sentences) are expressed as retained ranges of the source rather than by
 * mutating the transcript, so every edit stays reversible and the original
 * timing is always recoverable.
 */
export const cutSchema = z.object({
  sourceStart: z.number().nonnegative(),
  sourceEnd: z.number().nonnegative(),
  reason: z.enum(['selection', 'filler_word', 'silence', 'stutter', 'manual']).default('selection'),
})

export const overlaySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string(),
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().nonnegative(),
    style: z.record(z.string(), z.union([z.string(), z.number()])),
    xPct: z.number(),
    yPct: z.number(),
  }),
  z.object({
    type: z.literal('image'),
    assetId: z.string().uuid(),
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().nonnegative(),
    xPct: z.number(),
    yPct: z.number(),
    widthPct: z.number().positive(),
    opacity: z.number().min(0).max(1).default(1),
  }),
  z.object({
    type: z.literal('broll'),
    assetId: z.string().uuid(),
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().nonnegative(),
    /** full replaces the speaker, inset overlays a corner. */
    mode: z.enum(['full', 'inset']).default('full'),
    source: z.enum(['stock', 'ai_image', 'ai_video', 'upload']),
  }),
])

export const audioTrackSchema = z.object({
  assetId: z.string().uuid(),
  kind: z.enum(['music', 'sfx', 'voiceover', 'dub']),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative(),
  gainDb: z.number().default(0),
  /** Music ducks under speech. Without this the captions are readable and the audio is not. */
  duckUnderSpeech: z.boolean().default(true),
})

export const renderPlanSchema = z
  .object({
    version: z.literal(1),
    aspectRatio: aspectRatioSchema,
    fps: z.number().int().min(24).max(60).default(30),
    sourceAssetId: z.string().uuid(),

    cuts: z.array(cutSchema).min(1),
    layout: layoutSchema,

    captions: z
      .object({
        enabled: z.boolean().default(true),
        style: captionStyleSchema,
        /** Word overrides for corrected text or retimed emphasis. */
        overrides: z
          .array(
            z.object({
              wordIndex: z.number().int().nonnegative(),
              text: z.string().optional(),
              start: z.number().nonnegative().optional(),
              end: z.number().nonnegative().optional(),
              emphasis: z.boolean().optional(),
            }),
          )
          .default([]),
      })
      .optional(),

    overlays: z.array(overlaySchema).default([]),
    audioTracks: z.array(audioTrackSchema).default([]),

    brand: z
      .object({
        brandKitId: z.string().uuid().optional(),
        logoAssetId: z.string().uuid().optional(),
        logoPositionPct: z.tuple([z.number(), z.number()]).optional(),
        introAssetId: z.string().uuid().optional(),
        outroAssetId: z.string().uuid().optional(),
      })
      .optional(),

    watermark: z.boolean().default(false),
  })
  .refine((plan) => plan.cuts.every((c) => c.sourceEnd > c.sourceStart), {
    message: 'every cut must end after it starts',
  })
  .refine(
    (plan) => {
      const sorted = [...plan.cuts].sort((a, b) => a.sourceStart - b.sourceStart)
      return sorted.every((cut, i) => i === 0 || cut.sourceStart >= (sorted[i - 1]?.sourceEnd ?? 0))
    },
    {
      // Overlapping cuts would duplicate footage in the output. It renders
      // without error and looks like a stutter, which is far harder to
      // diagnose after the fact than a rejected plan.
      message: 'cuts must not overlap',
    },
  )

export type RenderPlan = z.infer<typeof renderPlanSchema>
export type CropKeyframe = z.infer<typeof cropKeyframeSchema>
export type CaptionStyle = z.infer<typeof captionStyleSchema>
export type Layout = z.infer<typeof layoutSchema>

/** Output duration after cuts. The render farm shards on this, so it must be exact. */
export function planDurationSeconds(plan: RenderPlan): number {
  return plan.cuts.reduce((total, cut) => total + (cut.sourceEnd - cut.sourceStart), 0)
}

export function planFrameCount(plan: RenderPlan): number {
  return Math.ceil(planDurationSeconds(plan) * plan.fps)
}

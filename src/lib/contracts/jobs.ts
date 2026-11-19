import { z } from 'zod'
import { transcriptionChunkSchema } from './transcript.js'

/**
 * Queue payload contracts.
 *
 * A worker reading from a queue is a trust boundary like any HTTP handler, and
 * it is the one most often left unvalidated because the messages "come from us".
 * They do not always: a compromised producer, a replayed message, or a schema
 * change mid-deploy all put unexpected shapes on the queue. Every payload is
 * parsed before it is acted on.
 *
 * `tenantId` travels on every job because workers must re-derive their tenant
 * scope from the payload and then verify it against the project they are about
 * to touch. A job is never trusted to be talking about its own tenant.
 */

const jobBase = z.object({
  tenantId: z.string().uuid(),
  projectId: z.string().uuid(),
  correlationId: z.string(),
  /** Makes every stage safe to replay. Keyed on (project, stage, input hash). */
  idempotencyKey: z.string(),
})

export const ingestJobSchema = jobBase.extend({
  stage: z.literal('ingest'),
  source: z.enum(['upload', 'url']),
  /**
   * Never interpolated into a shell command. yt-dlp is invoked with an argument
   * array, because a URL is user input and a URL that reaches a shell is a
   * remote code execution bug.
   */
  sourceUrl: z.string().url().optional(),
  uploadStorageKey: z.string().optional(),
})

export const probeJobSchema = jobBase.extend({
  stage: z.literal('probe'),
  assetId: z.string().uuid(),
})

export const extractAudioJobSchema = jobBase.extend({
  stage: z.literal('extract_audio'),
  assetId: z.string().uuid(),
})

export const transcribeChunkJobSchema = jobBase.extend({
  stage: z.literal('transcribe_chunk'),
  chunk: transcriptionChunkSchema,
  model: z.string(),
  language: z.string().optional(),
})

export const mergeTranscriptJobSchema = jobBase.extend({
  stage: z.literal('merge_transcript'),
  chunkCount: z.number().int().positive(),
})

export const analyzeJobSchema = jobBase.extend({
  stage: z.literal('analyze'),
  prompt: z.string().max(2000).optional(),
  targetClipCount: z.number().int().min(1).max(50).default(10),
  /** Re-prompting reuses the cached transcript and must not re-charge credits. */
  reusesCachedTranscript: z.boolean().default(false),
})

export const trackJobSchema = jobBase.extend({
  stage: z.literal('track'),
  clipId: z.string().uuid(),
  /** Sampled, not per-frame. Full-rate detection does not fit the CPU budget. */
  sampleFps: z.number().min(1).max(15).default(5),
  targetPrompt: z.string().max(200).optional(),
})

export const renderShardJobSchema = jobBase.extend({
  stage: z.literal('render_shard'),
  clipId: z.string().uuid(),
  renderJobId: z.string().uuid(),
  planVersion: z.number().int().positive(),
  shardIndex: z.number().int().nonnegative(),
  shardCount: z.number().int().positive(),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
})

export const muxJobSchema = jobBase.extend({
  stage: z.literal('mux'),
  clipId: z.string().uuid(),
  renderJobId: z.string().uuid(),
})

export const publishJobSchema = jobBase.extend({
  stage: z.literal('publish'),
  scheduledPostId: z.string().uuid(),
})

export const jobSchema = z.discriminatedUnion('stage', [
  ingestJobSchema,
  probeJobSchema,
  extractAudioJobSchema,
  transcribeChunkJobSchema,
  mergeTranscriptJobSchema,
  analyzeJobSchema,
  trackJobSchema,
  renderShardJobSchema,
  muxJobSchema,
  publishJobSchema,
])

export type Job = z.infer<typeof jobSchema>
export type JobStage = Job['stage']

export const QUEUE_NAMES = {
  media: 'media',
  ai: 'ai',
  vision: 'vision',
  render: 'render',
  social: 'social',
} as const

/** Which worker owns each stage. One place, so routing cannot disagree with itself. */
export const STAGE_QUEUE: Record<JobStage, (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]> = {
  ingest: QUEUE_NAMES.media,
  probe: QUEUE_NAMES.media,
  extract_audio: QUEUE_NAMES.media,
  transcribe_chunk: QUEUE_NAMES.ai,
  merge_transcript: QUEUE_NAMES.ai,
  analyze: QUEUE_NAMES.ai,
  track: QUEUE_NAMES.vision,
  render_shard: QUEUE_NAMES.render,
  mux: QUEUE_NAMES.media,
  publish: QUEUE_NAMES.social,
}

/**
 * Queue priority. Lower runs first.
 *
 * On a single box with roughly seven cores available for rendering, ordering is
 * not a refinement, it is the product: everything a paying tenant experiences
 * as speed is decided here.
 */
export const PLAN_PRIORITY = {
  business: 10,
  pro: 30,
  starter: 60,
  free: 100,
} as const

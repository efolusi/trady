import { z } from 'zod'
import { CLIP_CATEGORIES } from './analysis.js'
import { type JobStage, type PLAN_PRIORITY, STAGE_QUEUE } from './jobs.js'
import { aspectRatioSchema, captionStyleSchema, renderPlanSchema } from './render-plan.js'
import { segmentSchema, wordSchema } from './transcript.js'

/**
 * The HTTP contract. One file, because the API server, the workers and the web
 * UI are built in parallel against it and a contract split across modules drifts
 * between them within a week.
 *
 * Three rules run through everything below and are not negotiable at a call site:
 *
 *   1. The tenant is resolved from the caller's session or API key, never from a
 *      request field, path parameter or header. Nothing in this file accepts a
 *      tenantId, and that is deliberate.
 *   2. A resource belonging to another tenant returns 404, never 403. A 403
 *      confirms the id exists, which turns a guessable id into a cross-tenant
 *      existence oracle. Under RLS the row is simply not visible, so "forbidden"
 *      and "absent" are the same answer and the API must not distinguish them.
 *   3. Lists are cursor paginated. OFFSET is banned on these tables: it degrades
 *      linearly with depth and silently skips or repeats rows when the underlying
 *      set changes between pages, which it always does here.
 */

const uuidSchema = z.string().uuid()

/** Always serialised with `toISOString()`, so always UTC with a `Z` suffix. */
const isoDateTimeSchema = z.string().datetime()

/** Every by-id route. Non-UUID ids are rejected before any query runs. */
export const idParamSchema = z.object({ id: uuidSchema })

export type IdParam = z.infer<typeof idParamSchema>

// -- conventions ------------------------------------------------------------

export const API_BASE_PATH = '/api/v1'

/**
 * Health probes live at the root, outside `/api`, and outside versioning. The
 * orchestrator asks them before auth, tenancy or routing exist, and a version
 * bump must never move the path a liveness probe is pointed at.
 */
export const HEALTH_PATH = '/healthz'
export const READY_PATH = '/readyz'

/** Paths relative to `API_BASE_PATH`. The server registers these, the UI builds on them. */
export const API_ROUTES = {
  projects: '/projects',
  project: '/projects/:id',
  projectClips: '/projects/:id/clips',
  clip: '/clips/:id',
  clipDownload: '/clips/:id/download',
  clipPublishingHandoffs: '/clips/:id/publishing-handoffs',
  publishingHandoff: '/publishing-handoffs/:id',
  publishingHandoffConsume: '/publishing-handoffs/:id/consume',
  publishingHandoffRevoke: '/publishing-handoffs/:id/revoke',
  uploads: '/uploads',
  multipartUploads: '/uploads/multipart',
  multipartUploadComplete: '/uploads/multipart/complete',
  me: '/me',
  usage: '/usage',
  plans: '/plans',
  checkout: '/checkout',
  socialAccounts: '/social/accounts',
  socialAccount: '/social/accounts/:id',
  socialConnect: '/social/accounts/connect',
  socialCallback: '/social/accounts/callback',
  scheduledPosts: '/social/posts',
  scheduledPost: '/social/posts/:id',
} as const

/**
 * Sent by the client on every mutation. Replaying the same key inside the window
 * returns the original response rather than performing the work again.
 *
 * This is the only thing standing between a double-tapped button (or a proxy
 * retry) and a project charged twice. Lowercased because HTTP header names are
 * case-insensitive and every runtime that normalises them lowercases.
 */
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key'
export const IDEMPOTENCY_WINDOW_SECONDS = 24 * 60 * 60
export const idempotencyKeySchema = z.string().min(8).max(255)

/** Bearer only. A token in a query string ends up in access logs and referrers. */
export const AUTHORIZATION_HEADER = 'authorization'

export const API_ERROR_CODES = [
  'validation_failed',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'insufficient_credits',
  'feature_unavailable',
  'internal',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES)

/**
 * The single error shape. Clients switch on `code`, which is stable, and show
 * `message`, which is not: message text is for humans and may change freely.
 *
 * `details` is typed per code (see the schemas below) rather than as one union,
 * because a client that does not recognise a code must still be able to parse
 * the envelope.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1).max(500),
    details: z.unknown().optional(),
  }),
})

export type ApiErrorResponse = z.infer<typeof apiErrorSchema>

export const ERROR_STATUS: Record<ApiErrorCode, number> = {
  validation_failed: 400,
  unauthorized: 401,
  // Reachable only for an in-tenant permission failure (a viewer deleting a
  // project). Never for a cross-tenant read: that is not_found by rule 2.
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  // 402 rather than 403: the caller is authorised, the account is out of credit.
  insufficient_credits: 402,
  // The request is well formed and authorised, but the feature it needs is not
  // shipped (for example scheduling a post while no platform can publish it).
  // 422 rather than 409: waiting will not make it succeed.
  feature_unavailable: 422,
  rate_limited: 429,
  internal: 500,
}

/** `details` for validation_failed. Paths are dotted, matching Zod issue paths. */
export const validationDetailsSchema = z.object({
  issues: z.array(z.object({ path: z.string(), message: z.string() })).max(50),
})

/** `details` for rate_limited. Mirrors the `Retry-After` header. */
export const rateLimitDetailsSchema = z.object({
  retryAfterSeconds: z.number().int().nonnegative(),
})

/**
 * `details` for insufficient_credits. The UI needs the shortfall to render a
 * useful prompt, and computing it client-side from a stale balance is wrong
 * exactly when it matters.
 */
export const insufficientCreditsDetailsSchema = z.object({
  requiredSeconds: z.number().int().nonnegative(),
  availableSeconds: z.number().int(),
})

export type ValidationDetails = z.infer<typeof validationDetailsSchema>
export type RateLimitDetails = z.infer<typeof rateLimitDetailsSchema>
export type InsufficientCreditsDetails = z.infer<typeof insufficientCreditsDetailsSchema>

export function apiError(code: ApiErrorCode, message: string, details?: unknown): ApiErrorResponse {
  return { error: details === undefined ? { code, message } : { code, message, details } }
}

// -- pagination -------------------------------------------------------------

export const DEFAULT_PAGE_LIMIT = 25

/**
 * The ceiling exists because the limit is attacker-controlled and every item is
 * a row plus signed URLs. Without it one request can ask for the whole table.
 */
export const MAX_PAGE_LIMIT = 100

export const paginationQuerySchema = z.object({
  /** Opaque. Clients pass back `nextCursor` verbatim and never construct one. */
  cursor: z.string().min(1).max(512).optional(),
  // Coerced because it arrives as a query-string value, always a string.
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

/**
 * Builds the response envelope for a list of `item`.
 *
 * `nextCursor` is null on the last page and never absent, so a client cannot
 * confuse "no more pages" with "the field was omitted by an older server".
 */
export function paginated<Item extends z.ZodType>(item: Item) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  })
}

export interface Paginated<Item> {
  items: Item[]
  nextCursor: string | null
}

/**
 * The keyset a cursor carries: the sort key plus the id that breaks its ties.
 * Both are needed. `createdAt` alone repeats or skips rows whenever two rows
 * share a timestamp, which happens constantly when clips are inserted in a batch.
 */
export const cursorPositionSchema = z.object({
  createdAt: isoDateTimeSchema,
  id: uuidSchema,
})

export type CursorPosition = z.infer<typeof cursorPositionSchema>

const CURSOR_SEPARATOR = '~'

/**
 * Cursors are unsigned on purpose. They contain no secret and grant no access:
 * the query they feed is tenant-scoped by RLS, so a forged cursor can only move
 * the caller around inside their own rows. Signing them would add key rotation
 * to protect nothing.
 */
export function encodeCursor(position: CursorPosition): string {
  return encodeURIComponent(`${position.createdAt}${CURSOR_SEPARATOR}${position.id}`)
}

/**
 * Null for anything malformed, so the caller answers validation_failed. A bad
 * cursor must never degrade into "start from the beginning", which is how a
 * paginating client ends up walking the table from row one on every retry.
 */
export function decodeCursor(cursor: string): CursorPosition | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(cursor)
  } catch {
    return null
  }
  const parts = decoded.split(CURSOR_SEPARATOR)
  if (parts.length !== 2) return null
  const result = cursorPositionSchema.safeParse({ createdAt: parts[0], id: parts[1] })
  return result.success ? result.data : null
}

// -- pipeline status --------------------------------------------------------

/**
 * The phases the user is shown, in order. These are coarser than the job stages
 * in jobs.ts by design: `probe` and `extract_audio` are engineering detail, and
 * a progress bar that names them is a progress bar nobody can read.
 *
 * The mapping back to the worker vocabulary is JOB_STAGE_PROJECT_STAGE below, so
 * there is exactly one translation and no second set of stage names.
 */
export const PIPELINE_PHASES = ['ingesting', 'transcribing', 'analyzing', 'rendering'] as const

export type PipelinePhase = (typeof PIPELINE_PHASES)[number]

export const pipelinePhaseSchema = z.enum(PIPELINE_PHASES)

export const PROJECT_STAGES = ['queued', ...PIPELINE_PHASES, 'done', 'failed'] as const

export type ProjectStage = (typeof PROJECT_STAGES)[number]

export const projectStageSchema = z.enum(PROJECT_STAGES)

/**
 * Every job stage the workers run, taken from the routing table rather than
 * restated, so a stage added to jobs.ts cannot be missing here.
 */
export const JOB_STAGES = Object.keys(STAGE_QUEUE) as JobStage[]

/**
 * Which phase a running job puts the project in.
 *
 * `publish` maps to `done` because publishing happens after the pipeline has
 * finished: a scheduled post must never drag a completed project backwards into
 * a working state in the UI.
 */
export const JOB_STAGE_PROJECT_STAGE: Record<JobStage, ProjectStage> = {
  ingest: 'ingesting',
  probe: 'ingesting',
  extract_audio: 'ingesting',
  transcribe_chunk: 'transcribing',
  merge_transcript: 'transcribing',
  analyze: 'analyzing',
  track: 'rendering',
  render_shard: 'rendering',
  mux: 'rendering',
  publish: 'done',
}

/**
 * How much of the overall bar each phase owns. Weighted by observed wall-clock,
 * not by phase count: transcription and rendering are where the minutes go, and
 * an even split makes the bar sit at 50% for most of the job.
 */
export const PHASE_PROGRESS_WEIGHTS: Record<PipelinePhase, number> = {
  ingesting: 0.1,
  transcribing: 0.35,
  analyzing: 0.15,
  rendering: 0.4,
}

/**
 * Overall 0..1 progress. Lives here rather than in the UI so the API's number
 * and the client's optimistic number cannot disagree and make the bar jump
 * backwards on refresh.
 */
export function overallProgress(phase: PipelinePhase, phaseProgress: number): number {
  const clamped = Math.max(0, Math.min(1, phaseProgress))
  let base = 0
  for (const earlier of PIPELINE_PHASES) {
    if (earlier === phase) break
    base += PHASE_PROGRESS_WEIGHTS[earlier]
  }
  return Math.round((base + PHASE_PROGRESS_WEIGHTS[phase] * clamped) * 1000) / 1000
}

/**
 * Stable failure codes. The UI branches on these; it must never parse a message.
 *
 * They line up with the IngestError codes in packages/pipeline: `invalid_url`
 * and `blocked_scheme` surface as invalid_source_url, `download_failed` as
 * source_unavailable, `probe_failed` as unsupported_media or no_audio_track.
 */
export const PROJECT_FAILURE_CODES = [
  'invalid_source_url',
  'source_unavailable',
  'host_requires_sign_in',
  'unsupported_media',
  'no_audio_track',
  'source_too_long',
  'transcription_failed',
  'analysis_failed',
  'render_failed',
  'insufficient_credits',
  'canceled',
  'internal',
] as const

export type ProjectFailureCode = (typeof PROJECT_FAILURE_CODES)[number]

export const projectFailureCodeSchema = z.enum(PROJECT_FAILURE_CODES)

/**
 * The only text the API is allowed to put in a failed status message.
 *
 * Upstream failure text comes from yt-dlp, ffmpeg and third-party model APIs. It
 * routinely contains local paths, storage keys and request ids, and it lands in
 * a browser. Mapping to fixed copy keeps all of that server-side, in the logs
 * where it is useful, and out of the response where it is a leak.
 */
export const FAILURE_MESSAGES: Record<ProjectFailureCode, string> = {
  invalid_source_url: 'That link could not be read. Check it and try a different URL.',
  source_unavailable: 'The video could not be downloaded. It may be private or region locked.',
  host_requires_sign_in:
    'The site refused the download and asked for a signed-in account. Download the video yourself and upload the file.',
  unsupported_media: 'That file format is not supported.',
  no_audio_track: 'This video has no audio, so there is nothing to transcribe.',
  source_too_long: 'This video is longer than your plan allows.',
  transcription_failed: 'Transcription did not complete. You can try again.',
  analysis_failed: 'Clip selection did not complete. You can try again.',
  render_failed: 'One or more clips failed to render. You can try again.',
  insufficient_credits: 'Not enough credits to process this video.',
  canceled: 'This project was canceled.',
  internal: 'Something went wrong on our side. You can try again.',
}

/** Whether retrying unchanged can plausibly succeed. Drives whether the UI offers a retry. */
export const FAILURE_RETRYABLE: Record<ProjectFailureCode, boolean> = {
  invalid_source_url: false,
  source_unavailable: true,
  // Retrying changes nothing: the host wants a signed-in human, and will want
  // one again in a minute. Uploading the file is the way through.
  host_requires_sign_in: false,
  unsupported_media: false,
  no_audio_track: false,
  source_too_long: false,
  transcription_failed: true,
  analysis_failed: true,
  render_failed: true,
  // Retryable only after a top-up, which is a user action, so the UI sends the
  // caller to billing instead of showing a retry button that will fail again.
  insufficient_credits: false,
  canceled: false,
  internal: true,
}

const statusBase = {
  /** 0..1, monotonic across the whole project. See overallProgress. */
  progress: z.number().min(0).max(1),
  /** Safe to render directly. Never carries provider text, paths or ids. */
  message: z.string().min(1).max(200),
}

/**
 * Project status as a discriminated union so the UI renders from the payload
 * instead of inferring. Every variant carries what that state needs and nothing
 * else: a `clipsTotal` that is meaningless while transcribing is not present,
 * rather than present as zero and quietly wrong.
 */
export const projectStatusSchema = z.discriminatedUnion('stage', [
  z.object({
    stage: z.literal('queued'),
    ...statusBase,
    /** Null when the queue is not backed up enough for a position to be meaningful. */
    queuePosition: z.number().int().nonnegative().nullable(),
  }),
  z.object({ stage: z.literal('ingesting'), ...statusBase }),
  z.object({ stage: z.literal('transcribing'), ...statusBase }),
  z.object({ stage: z.literal('analyzing'), ...statusBase }),
  z.object({
    stage: z.literal('rendering'),
    ...statusBase,
    clipsRendered: z.number().int().nonnegative(),
    clipsTotal: z.number().int().positive(),
  }),
  z.object({
    stage: z.literal('done'),
    ...statusBase,
    clipCount: z.number().int().nonnegative(),
  }),
  z.object({
    stage: z.literal('failed'),
    ...statusBase,
    failureCode: projectFailureCodeSchema,
    /** Null when the project failed before any phase started, e.g. out of credit. */
    failedPhase: pipelinePhaseSchema.nullable(),
  }),
])

export type ProjectStatus = z.infer<typeof projectStatusSchema>

/**
 * Per-phase detail for the project page.
 *
 * `skipped` is a real state, not a fallback: re-prompting reuses the cached
 * transcript, so transcribing legitimately never runs on that pass and showing
 * it as pending forever would look like a stall.
 */
export const phaseProgressSchema = z.object({
  phase: pipelinePhaseSchema,
  state: z.enum(['pending', 'active', 'done', 'failed', 'skipped']),
  progress: z.number().min(0).max(1),
  startedAt: isoDateTimeSchema.nullable(),
  finishedAt: isoDateTimeSchema.nullable(),
  /** Units completed and expected, e.g. 3 of 12 transcription chunks. Null when unknown. */
  completed: z.number().int().nonnegative().nullable(),
  total: z.number().int().nonnegative().nullable(),
})

export type PhaseProgress = z.infer<typeof phaseProgressSchema>

// -- projects ---------------------------------------------------------------

/**
 * http(s) only. `z.url()` accepts `file://` and every other scheme the URL
 * parser knows, and this string is on its way to yt-dlp, which will act on a
 * good number of them. parseSource in the ingest worker rejects them again and
 * also blocks private hosts; this is the first of the two, at the boundary where
 * the caller can still be told why.
 */
const httpUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => /^https?:/i.test(value), {
    message: 'only http(s) source URLs are accepted',
  })

/**
 * A project starts from a link or from an upload that has already landed in
 * storage. Never from bytes on this request: see the uploads section.
 */
export const projectSourceInputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('url'),
    url: httpUrlSchema,
  }),
  z.object({
    kind: z.literal('upload'),
    /** From POST /uploads. The API verifies the object exists before queueing. */
    uploadId: uuidSchema,
  }),
])

export type ProjectSourceInput = z.infer<typeof projectSourceInputSchema>

export const createProjectRequestSchema = z.object({
  source: projectSourceInputSchema,
  title: z.string().min(1).max(200).optional(),
  folderId: uuidSchema.optional(),
  /** Untrusted. Fenced with fenceUntrusted before it reaches a model. */
  prompt: z.string().max(2000).optional(),
  // Bounds match analyzeJobSchema so a request that validates here cannot fail
  // validation again on the queue, where the user is no longer around to see it.
  targetClipCount: z.number().int().min(1).max(50).default(10),
  aspectRatio: aspectRatioSchema.default('9:16'),
  language: z.string().min(2).max(16).optional(),
})

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>

/** What ingest learned about the source. Every field is null until probe runs. */
export const sourceMetadataSchema = z.object({
  kind: z.enum(['url', 'upload']),
  url: z.string().url().nullable(),
  /**
   * As classified by the ingest parser: youtube, vimeo, direct, other. A plain
   * string because that list belongs to the parser, and forking it into an enum
   * here guarantees the two drift.
   */
  platform: z.string().nullable(),
  filename: z.string().nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  fps: z.number().positive().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  language: z.string().nullable(),
})

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>

export const projectSummarySchema = z.object({
  id: uuidSchema,
  title: z.string(),
  status: projectStatusSchema,
  folderId: uuidSchema.nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  clipCount: z.number().int().nonnegative(),
  /** Short-lived signed URL, never a bucket path. Null until ingest produces one. */
  thumbnailUrl: z.string().url().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export type ProjectSummary = z.infer<typeof projectSummarySchema>

/**
 * Failure detail is not repeated here: it lives on `status`, in the failed
 * variant, where the type system forces the UI to handle it.
 */
export const projectDetailSchema = projectSummarySchema.extend({
  source: sourceMetadataSchema,
  prompt: z.string().nullable(),
  phases: z.array(phaseProgressSchema),
  /** Retention is policy, not cleanup. The UI warns before the reaper runs. */
  expiresAt: isoDateTimeSchema.nullable(),
})

export type ProjectDetail = z.infer<typeof projectDetailSchema>

/** 201 with the project already carrying a status, so the UI can poll immediately. */
export const createProjectResponseSchema = projectDetailSchema

export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  status: projectStageSchema.optional(),
})

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>

/** Newest first: ordered by (createdAt desc, id desc), which is what the cursor encodes. */
export const listProjectsResponseSchema = paginated(projectSummarySchema)

export type ListProjectsResponse = Paginated<ProjectSummary>

/** GET by id for a project in another tenant returns 404. See rule 2. */
export const getProjectResponseSchema = projectDetailSchema

export type GetProjectResponse = ProjectDetail

/**
 * Soft delete. The row is marked and the media is reaped asynchronously, so the
 * response reports when it happened rather than pretending the bytes are gone.
 */
export const deleteProjectResponseSchema = z.object({
  id: uuidSchema,
  deletedAt: isoDateTimeSchema,
})

export type DeleteProjectResponse = z.infer<typeof deleteProjectResponseSchema>

// -- clips ------------------------------------------------------------------

export const CLIP_STATUSES = ['proposed', 'queued', 'rendering', 'ready', 'failed'] as const

export type ClipStatus = (typeof CLIP_STATUSES)[number]

export const clipStatusSchema = z.enum(CLIP_STATUSES)

/**
 * The stored category, which analysis already normalised.
 *
 * Deliberately `z.enum(CLIP_CATEGORIES)` and not the tolerant `clipCategorySchema`
 * from analysis.ts: that one exists to absorb whatever an LLM returns, and that
 * tolerance belongs at the model boundary only. A stray category coming out of
 * our own database is a bug we want to see, not one to coerce to 'other'.
 */
export const clipCategoryResponseSchema = z.enum(CLIP_CATEGORIES)

const scoreValueSchema = z.number().int().min(0).max(99)

/**
 * Decomposed, matching clip_scores. The sub-scores ship because the UI explains
 * the number, and because the weighting is versioned: an old overall stays
 * interpretable only next to the parts it was computed from.
 */
export const clipScoreSchema = z.object({
  overall: scoreValueSchema,
  hookStrength: scoreValueSchema,
  emotionalArc: scoreValueSchema,
  standaloneValue: scoreValueSchema,
  trendAlignment: scoreValueSchema,
  rationale: z.string().nullable(),
  scoringVersion: z.string(),
})

export type ClipScore = z.infer<typeof clipScoreSchema>

/**
 * Signed, short-lived URLs. Never a public object path: storage keys are
 * `{tenant}/{project}/{asset}` and therefore guessable, and a permanent URL
 * outlives the membership that authorised it.
 */
export const clipMediaSchema = z.object({
  thumbnailUrl: z.string().url().nullable(),
  /** Progressive MP4 or HLS for scrubbing. Null until the render lands. */
  previewUrl: z.string().url().nullable(),
  /** When the URLs above stop working. Null when there are none yet. */
  expiresAt: isoDateTimeSchema.nullable(),
})

export type ClipMedia = z.infer<typeof clipMediaSchema>

export const clipSummarySchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  status: clipStatusSchema,
  title: z.string(),
  description: z.string().nullable(),
  category: clipCategoryResponseSchema,
  hashtags: z.array(z.string()).max(15),
  /** Source timeline, in seconds. Every timing in this API is source-relative. */
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative(),
  /** Output length after cuts, which is not endSeconds - startSeconds once silences are trimmed. */
  durationSeconds: z.number().nonnegative(),
  aspectRatio: aspectRatioSchema,
  score: clipScoreSchema,
  media: clipMediaSchema,
  createdAt: isoDateTimeSchema,
})

export type ClipSummary = z.infer<typeof clipSummarySchema>

export const listClipsQuerySchema = paginationQuerySchema.extend({
  /**
   * `score` for the review grid, `timeline` for the editor. Both are stable
   * total orders once tie-broken by id, which is what makes them cursorable.
   */
  sort: z.enum(['score', 'timeline']).default('score'),
  category: clipCategoryResponseSchema.optional(),
  status: clipStatusSchema.optional(),
})

export type ListClipsQuery = z.infer<typeof listClipsQuerySchema>

export const listClipsResponseSchema = paginated(clipSummarySchema)

export type ListClipsResponse = Paginated<ClipSummary>

/**
 * Clip detail is the editor payload: the render plan is the one document the
 * editor mutates and the renderer consumes, so it ships whole rather than as a
 * summary the editor would have to refetch.
 *
 * Transcript timings stay on the source timeline. The editor subtracts
 * `startSeconds` when it needs clip-relative time; doing the subtraction here
 * would mean two timelines in one payload and an off-by-a-clip bug in the
 * captions the first time someone forgets which they are holding.
 */
export const clipDetailSchema = clipSummarySchema.extend({
  planVersion: z.number().int().positive(),
  renderPlan: renderPlanSchema,
  /** Segments overlapping the clip window, for text-based editing. */
  transcript: z.array(segmentSchema),
  /** Flattened word timings for caption rendering and karaoke highlighting. */
  captionWords: z.array(wordSchema),
  /** Null when captions are disabled for this clip. */
  captionStyle: captionStyleSchema.nullable(),
  failureReason: z.string().nullable(),
})

export type ClipDetail = z.infer<typeof clipDetailSchema>

export type GetClipResponse = ClipDetail

export const CLIP_DOWNLOAD_FORMATS = ['mp4', 'srt', 'vtt'] as const

export type ClipDownloadFormat = (typeof CLIP_DOWNLOAD_FORMATS)[number]

export const clipDownloadRequestSchema = z.object({
  format: z.enum(CLIP_DOWNLOAD_FORMATS).default('mp4'),
})

export type ClipDownloadRequest = z.infer<typeof clipDownloadRequestSchema>

/**
 * Short by design. The URL is a bearer credential for one object: anything long
 * lived ends up pasted into a chat and shared past the tenant boundary.
 */
export const DOWNLOAD_URL_TTL_SECONDS = 300

/**
 * POST rather than GET because it mints a credential and is audit logged, and
 * because a GET would be prefetched by browsers and link unfurlers.
 *
 * Requesting a download for a clip that is not `ready` is 409 conflict, not 404:
 * the clip exists and the caller can see it.
 */
export const clipDownloadResponseSchema = z.object({
  url: z.string().url(),
  expiresAt: isoDateTimeSchema,
  filename: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative().nullable(),
})

export type ClipDownloadResponse = z.infer<typeof clipDownloadResponseSchema>

// -- uploads ----------------------------------------------------------------

/**
 * Cloudflare's proxy rejects request bodies above roughly this size, and source
 * videos are routinely far larger.
 *
 * So media never travels through the API. This endpoint hands back a presigned
 * target and the browser PUTs straight to object storage. Any future endpoint
 * that accepts a media body is a bug: it will work in local development, where
 * there is no proxy, and fail in production on the first real podcast.
 */
export const PROXY_BODY_LIMIT_BYTES = 100 * 1024 * 1024

/**
 * What an upload can actually be, not what S3 would allow.
 *
 * S3's single-PUT ceiling is 5 GB, and this said so. But the production path is
 * browser -> Cloudflare -> nginx -> MinIO, and Cloudflare caps a proxied request
 * body at 100 MB. A 5 GB promise meant the API accepted a request it knew the
 * network would reject, and the user found out partway through the upload of
 * their first real podcast.
 *
 * So the limit is the proxy's, and the API refuses too-large files up front,
 * where the message can say what the limit is. Getting past it needs multipart
 * upload — several parts, each under the cap — which is a feature, not a
 * constant.
 */
export const MAX_UPLOAD_BYTES = PROXY_BODY_LIMIT_BYTES

export const UPLOAD_TARGET_TTL_SECONDS = 15 * 60

/**
 * An allowlist, not a `video/*` prefix test. The declared type is signed into
 * the upload policy and comes back as the object's Content-Type, so accepting
 * `text/html` here is stored XSS on the storage origin.
 */
export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
  'video/mpeg',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/flac',
] as const

export type UploadContentType = (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number]

export const createUploadRequestSchema = z.object({
  /**
   * Display only. It is never used to build the storage key, because a filename
   * is user input and a storage key built from user input is a path traversal
   * into another tenant's prefix.
   */
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_UPLOAD_CONTENT_TYPES),
  /** Declared up front so an over-plan upload is refused before any bytes move. */
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  checksumSha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
})

export type CreateUploadRequest = z.infer<typeof createUploadRequestSchema>

export const createUploadResponseSchema = z.object({
  /** Passed to POST /projects once the PUT succeeds. */
  uploadId: uuidSchema,
  method: z.literal('PUT'),
  url: z.string().url(),
  /** Must be sent verbatim on the PUT; they are part of the signature. */
  headers: z.record(z.string(), z.string()),
  storageKey: z.string(),
  expiresAt: isoDateTimeSchema,
  /** The signed policy enforces this too. Echoed so the client can fail fast. */
  maxBytes: z.number().int().positive(),
})

export type CreateUploadResponse = z.infer<typeof createUploadResponseSchema>

// -- multipart upload (files over the single-PUT proxy cap) ------------------

/**
 * Part size for multipart uploads: 64 MiB.
 *
 * Each part is PUT through the same browser -> Cloudflare -> nginx -> MinIO path
 * as a single upload, so every part must clear the 100 MB proxy body cap. 64 MiB
 * leaves margin under it while keeping the part count low — S3 allows at most
 * 10000 parts, and at this size that is 640 GB of headroom, far past anything we
 * accept.
 */
export const MULTIPART_PART_SIZE_BYTES = 64 * 1024 * 1024

/** S3's floor for every part except the last. Below it, CompleteMultipartUpload fails. */
export const MULTIPART_MIN_PART_SIZE_BYTES = 5 * 1024 * 1024

/** S3's hard limit on parts per upload. */
export const MULTIPART_MAX_PARTS = 10_000

/**
 * The ceiling for a multipart upload: 5 GiB.
 *
 * Not a network limit — parts get past that — but a product one: a source video
 * larger than this is almost never a clip candidate and is more likely a mistake
 * than a podcast, and every gigabyte accepted is credits reserved and CPU spent.
 */
export const MAX_MULTIPART_BYTES = 5 * 1024 * 1024 * 1024

export interface MultipartPlan {
  partSize: number
  partCount: number
}

/**
 * How many parts a file of `sizeBytes` splits into, and how big each is.
 *
 * Every part is `partSize` except the last, which is the remainder. Pure so the
 * server and the browser agree on the boundaries without a round trip: the
 * server signs a URL per part number, and the client slices the file at exactly
 * these offsets. Throws below the multipart floor and above the ceiling, so a
 * caller cannot ask for a single 1 KiB part (S3 rejects the complete) or a
 * 12-part-of-10000 upload of something absurd.
 */
export function planMultipartUpload(sizeBytes: number): MultipartPlan {
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error('multipart size must be a positive integer')
  }
  if (sizeBytes > MAX_MULTIPART_BYTES) {
    throw new Error(`multipart size ${sizeBytes} exceeds the ${MAX_MULTIPART_BYTES} ceiling`)
  }
  // A file that fits in one part still uploads as one part rather than erroring:
  // multipart with a single part is legal, and the route decides single-PUT vs
  // multipart by size elsewhere.
  const partSize = MULTIPART_PART_SIZE_BYTES
  const partCount = Math.ceil(sizeBytes / partSize)
  if (partCount > MULTIPART_MAX_PARTS) {
    throw new Error(`multipart size ${sizeBytes} needs more than ${MULTIPART_MAX_PARTS} parts`)
  }
  return { partSize, partCount }
}

/** Begin a multipart upload. Same allowlisted content type as a single upload. */
export const createMultipartUploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_UPLOAD_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_MULTIPART_BYTES),
  checksumSha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
})

export type CreateMultipartUploadRequest = z.infer<typeof createMultipartUploadRequestSchema>

export const multipartPartTargetSchema = z.object({
  partNumber: z.number().int().min(1).max(MULTIPART_MAX_PARTS),
  url: z.string().url(),
})

/**
 * Where to PUT each part, plus the id needed to complete. The client PUTs each
 * URL, keeps the ETag each returns, and sends them all back to complete.
 */
export const createMultipartUploadResponseSchema = z.object({
  uploadId: uuidSchema,
  /** The provider's multipart id, opaque to the client, echoed back on complete. */
  providerUploadId: z.string(),
  storageKey: z.string(),
  partSize: z.number().int().positive(),
  parts: z.array(multipartPartTargetSchema),
  expiresAt: isoDateTimeSchema,
})

export type CreateMultipartUploadResponse = z.infer<typeof createMultipartUploadResponseSchema>

/** One finished part: its number and the ETag storage returned for it. */
export const completedPartSchema = z.object({
  partNumber: z.number().int().min(1).max(MULTIPART_MAX_PARTS),
  etag: z.string().min(1),
})

export const completeMultipartUploadRequestSchema = z.object({
  uploadId: uuidSchema,
  providerUploadId: z.string(),
  /**
   * Echoed from the begin response. The server checks it is inside the caller's
   * own `{tenant}/uploads/` prefix before touching storage, so a tampered key
   * can only ever point at the caller's own space — and the provider id S3
   * issued for that exact key will not match any other object anyway.
   */
  storageKey: z.string(),
  parts: z.array(completedPartSchema).min(1),
})

export type CompleteMultipartUploadRequest = z.infer<typeof completeMultipartUploadRequestSchema>

export const completeMultipartUploadResponseSchema = z.object({
  uploadId: uuidSchema,
  storageKey: z.string(),
})

export type CompleteMultipartUploadResponse = z.infer<typeof completeMultipartUploadResponseSchema>

// -- me ---------------------------------------------------------------------

/**
 * Restated from the database enums rather than imported: contracts is the
 * dependency of packages/db, not the other way round, and inverting that would
 * pull Drizzle into the browser bundle. These two lists and the pgEnums must be
 * changed together.
 */
export const MEMBER_ROLES = ['owner', 'admin', 'editor', 'viewer'] as const

export type MemberRole = (typeof MEMBER_ROLES)[number]

export const memberRoleSchema = z.enum(MEMBER_ROLES)

/** `satisfies` ties this to PLAN_PRIORITY: a tier removed there fails to compile here. */
export const PLAN_TIERS = ['free', 'starter', 'pro', 'business'] as const satisfies ReadonlyArray<
  keyof typeof PLAN_PRIORITY
>

export type PlanTier = (typeof PLAN_TIERS)[number]

export const planTierSchema = z.enum(PLAN_TIERS)

/**
 * One plan as the public pricing page shows it. Prices are carried in BOTH
 * currencies rather than converted in the browser: `priceUsdCents` is canonical,
 * `priceIdr` is whole rupiah (no minor unit), so the page renders per locale
 * without doing FX itself. `monthlyCredits` is whole seconds of source media,
 * the same unit the ledger keeps.
 */
export const planSummarySchema = z.object({
  /** The catalogue id, passed to checkout. Not a secret — a product SKU. */
  id: uuidSchema,
  tier: planTierSchema,
  name: z.string(),
  monthlyCredits: z.number().int().nonnegative(),
  priceUsdCents: z.number().int().nonnegative(),
  priceIdr: z.number().int().nonnegative(),
  features: z.array(z.string()),
})

export type PlanSummary = z.infer<typeof planSummarySchema>

/** Public: the pricing page reads this unauthenticated. Ordered cheapest first. */
export const listPlansResponseSchema = z.object({
  plans: z.array(planSummarySchema),
})

export type ListPlansResponse = z.infer<typeof listPlansResponseSchema>

/**
 * Start a checkout for a plan through the canonical Pay service. Provider
 * routing is owned by Pay; the product cannot select or call a gateway.
 */
export const createCheckoutRequestSchema = z
  .object({
    planId: uuidSchema,
    checkoutKey: z.string().min(16).max(128).optional(),
    /**
     * The payer's contact, optional. A selected Pay adapter may require a phone;
     * a buyer who provides
     * one here gets it on the invoice, and one who does not falls back to a
     * placeholder rather than blocking the checkout. Ignored on the direct path.
     */
    payerEmail: z.string().email().optional(),
    payerPhone: z.string().min(10).max(20).optional(),
  })
  .strict()

export type CreateCheckoutRequest = z.infer<typeof createCheckoutRequestSchema>

/** Where to send the customer to pay, plus our own invoice id for later reference. */
export const createCheckoutResponseSchema = z.object({
  invoiceId: uuidSchema,
  checkoutUrl: z.string().url(),
})

export type CreateCheckoutResponse = z.infer<typeof createCheckoutResponseSchema>

// -- social publishing ------------------------------------------------------

/**
 * The destinations a clip can publish to. Mirrors the `social_platform` enum in
 * @trady/db; kept as a plain const here because this package stays Drizzle-free
 * so the browser bundle can import it. If the two lists drift, a connect for the
 * missing platform fails validation here before it reaches the database.
 */
export const SOCIAL_PLATFORMS = [
  'youtube',
  'youtube_shorts',
  'tiktok',
  'instagram',
  'facebook',
  'linkedin',
  'x',
] as const

export const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS)
export type SocialPlatform = z.infer<typeof socialPlatformSchema>

/**
 * A connected account. There is NO token field, by design and not omission: the
 * access and refresh tokens never leave the server, so the shape the UI receives
 * has no place to put one. `disconnectedAt` set means the platform rejected our
 * token and the user must reconnect.
 */
export const socialAccountSummarySchema = z.object({
  id: uuidSchema,
  platform: socialPlatformSchema,
  externalAccountId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  scopes: z.array(z.string()),
  tokenExpiresAt: isoDateTimeSchema.nullable(),
  disconnectedAt: isoDateTimeSchema.nullable(),
  disconnectedReason: z.string().nullable(),
  createdAt: isoDateTimeSchema,
})

export type SocialAccountSummary = z.infer<typeof socialAccountSummarySchema>

export const listSocialAccountsResponseSchema = z.object({
  accounts: z.array(socialAccountSummarySchema),
})

export type ListSocialAccountsResponse = z.infer<typeof listSocialAccountsResponseSchema>

/**
 * Begin connecting a destination. The server hands back the platform's OAuth
 * authorization URL to send the user to; the tokens come back through the broker
 * on the callback, never through this request, so nothing token-shaped is
 * accepted here.
 */
export const connectSocialAccountRequestSchema = z.object({
  platform: socialPlatformSchema,
})

export type ConnectSocialAccountRequest = z.infer<typeof connectSocialAccountRequestSchema>

export const connectSocialAccountResponseSchema = z.object({
  authorizationUrl: z.string().url(),
})

export type ConnectSocialAccountResponse = z.infer<typeof connectSocialAccountResponseSchema>

export const postStatusSchema = z.enum([
  'scheduled',
  'publishing',
  'published',
  'failed',
  'canceled',
])

export type PostStatus = z.infer<typeof postStatusSchema>

/**
 * Queue a clip to publish to a connected account at a time. Caption and hashtags
 * are per-platform because their limits and tone differ; `scheduledFor` is UTC,
 * and a slot in the past is allowed — it publishes on the next scheduler tick.
 */
export const schedulePostRequestSchema = z.object({
  clipId: uuidSchema,
  socialAccountId: uuidSchema,
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string().min(1).max(100)).max(30).default([]),
  scheduledFor: isoDateTimeSchema,
})

export type SchedulePostRequest = z.infer<typeof schedulePostRequestSchema>

export const scheduledPostSummarySchema = z.object({
  id: uuidSchema,
  clipId: uuidSchema,
  socialAccountId: uuidSchema,
  status: postStatusSchema,
  caption: z.string(),
  hashtags: z.array(z.string()),
  scheduledFor: isoDateTimeSchema,
  publishedAt: isoDateTimeSchema.nullable(),
  externalUrl: z.string().url().nullable(),
  failureReason: z.string().nullable(),
  attempt: z.number().int().nonnegative(),
})

export type ScheduledPostSummary = z.infer<typeof scheduledPostSummarySchema>

export const listScheduledPostsQuerySchema = z.object({
  clipId: uuidSchema.optional(),
})

export type ListScheduledPostsQuery = z.infer<typeof listScheduledPostsQuerySchema>

export const listScheduledPostsResponseSchema = z.object({
  posts: z.array(scheduledPostSummarySchema),
})

export type ListScheduledPostsResponse = z.infer<typeof listScheduledPostsResponseSchema>

/**
 * Credits are whole seconds of source media, matching the ledger, so rounding
 * happens once at display time instead of drifting across partial charges.
 *
 * `balanceSeconds` is the sum of the ledger and can go negative after an
 * adjustment; `availableSeconds` is what is actually spendable now.
 */
export const creditBalanceSchema = z.object({
  balanceSeconds: z.number().int(),
  reservedSeconds: z.number().int().nonnegative(),
  availableSeconds: z.number().int(),
  /** When the current allowance expires. Null on plans without a period. */
  periodEndsAt: isoDateTimeSchema.nullable(),
})

export type CreditBalance = z.infer<typeof creditBalanceSchema>

/**
 * The active tenant is whichever membership the session resolved. It is reported
 * here, never accepted from the client, which is why there is no tenant field on
 * any request in this file.
 */
export const meResponseSchema = z.object({
  user: z.object({
    id: uuidSchema,
    email: z.string().email(),
    name: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
  }),
  tenant: z.object({
    id: uuidSchema,
    slug: z.string(),
    name: z.string(),
    planTier: planTierSchema,
  }),
  role: memberRoleSchema,
  credits: creditBalanceSchema,
})

export type MeResponse = z.infer<typeof meResponseSchema>

// -- usage ------------------------------------------------------------------

export const LEDGER_KINDS = [
  'grant',
  'topup',
  'reserve',
  'commit',
  'release',
  'adjustment',
  'expiry',
] as const

export type LedgerKind = (typeof LEDGER_KINDS)[number]

export const ledgerKindSchema = z.enum(LEDGER_KINDS)

/**
 * The sign convention, enforced rather than documented.
 *
 * A project reserves (-N) when it starts, then either commits or releases. The
 * commit is a marker with a zero delta: the money already left the balance at
 * reserve time, so a commit carrying -N would charge the same project twice, and
 * a double charge is the one billing bug a user cannot be talked out of. That
 * case is a schema failure here, not a support ticket later.
 *
 * `expiry` is negative because it removes an unused allowance; `adjustment` is a
 * manual correction in either direction, but never zero, because a zero-delta
 * adjustment is a row that says nothing.
 */
export function isValidLedgerDelta(kind: LedgerKind, deltaSeconds: number): boolean {
  switch (kind) {
    case 'grant':
    case 'topup':
    case 'release':
      return deltaSeconds > 0
    case 'reserve':
    case 'expiry':
      return deltaSeconds < 0
    case 'commit':
      return deltaSeconds === 0
    case 'adjustment':
      return deltaSeconds !== 0
  }
}

export const creditLedgerEntrySchema = z
  .object({
    id: uuidSchema,
    kind: ledgerKindSchema,
    deltaSeconds: z.number().int(),
    /** Set on reserve, and carried by the commit or release that resolves it. */
    reservationId: uuidSchema.nullable(),
    projectId: uuidSchema.nullable(),
    reason: z.string(),
    createdAt: isoDateTimeSchema,
    /** Running balance after this entry, so the UI never re-sums the ledger. */
    balanceAfterSeconds: z.number().int(),
  })
  .refine((entry) => isValidLedgerDelta(entry.kind, entry.deltaSeconds), {
    message: 'ledger delta sign does not match its kind',
  })

export type CreditLedgerEntry = z.infer<typeof creditLedgerEntrySchema>

export const listUsageQuerySchema = paginationQuerySchema.extend({
  kind: ledgerKindSchema.optional(),
})

export type ListUsageQuery = z.infer<typeof listUsageQuerySchema>

/** Newest first. Append-only, so a cursor into it never goes stale. */
export const listUsageResponseSchema = paginated(creditLedgerEntrySchema)

export type ListUsageResponse = Paginated<CreditLedgerEntry>

// -- health -----------------------------------------------------------------

/**
 * Liveness. Answers from process state alone and touches nothing external.
 *
 * A liveness probe that checks the database restarts every healthy instance
 * during a database blip, which turns a recoverable dependency failure into a
 * full outage plus a cold-start stampede.
 *
 * `version` and `uptimeSeconds` are only sent to a caller on the host itself
 * (loopback, not proxied). The public answer is `{ status }`, because the
 * running SHA tells an attacker exactly which advisories apply.
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string().optional(),
  uptimeSeconds: z.number().nonnegative().optional(),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>

/**
 * Readiness. This one does check dependencies, because "ready" means ready to
 * serve traffic. `degraded` is distinct from unready: the instance still takes
 * requests when a non-critical dependency is down.
 *
 * `checks` is only sent to a caller on the host itself (loopback, not
 * proxied). The public answer is `{ status }` with the same HTTP status code,
 * so an uptime monitor reading only the code sees no change.
 */
export const readinessResponseSchema = z.object({
  status: z.enum(['ready', 'degraded', 'unready']),
  checks: z
    .array(
      z.object({
        name: z.string(),
        ok: z.boolean(),
        latencyMs: z.number().nonnegative().nullable(),
        /** Sanitised. This endpoint is usually unauthenticated. */
        error: z.string().nullable(),
      }),
    )
    .optional(),
})

export type ReadinessResponse = z.infer<typeof readinessResponseSchema>

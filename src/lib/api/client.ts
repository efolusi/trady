import type {
  ApiErrorCode,
  ClipDetail,
  ClipDownloadFormat,
  ClipDownloadResponse,
  ClipStatus,
  ClipSummary,
  CompleteMultipartUploadRequest,
  CompleteMultipartUploadResponse,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  CreateMultipartUploadRequest,
  CreateMultipartUploadResponse,
  CreateProjectRequest,
  CreateUploadRequest,
  CreateUploadResponse,
  CreditLedgerEntry,
  DeleteProjectResponse,
  LedgerKind,
  MeResponse,
  Paginated,
  ProjectDetail,
  ProjectStage,
  ProjectSummary,
  ReadinessResponse,
  ScheduledPostSummary,
  SchedulePostRequest,
  SocialAccountSummary,
  SocialPlatform,
} from '@/lib/contracts'
import {
  API_ERROR_CODES,
  AUTHORIZATION_HEADER,
  apiErrorSchema,
  clipDetailSchema,
  clipDownloadResponseSchema,
  completeMultipartUploadResponseSchema,
  connectSocialAccountResponseSchema,
  createCheckoutResponseSchema,
  createMultipartUploadResponseSchema,
  createProjectResponseSchema,
  createUploadResponseSchema,
  deleteProjectResponseSchema,
  ERROR_STATUS,
  getProjectResponseSchema,
  IDEMPOTENCY_KEY_HEADER,
  listClipsResponseSchema,
  listProjectsResponseSchema,
  listScheduledPostsResponseSchema,
  listSocialAccountsResponseSchema,
  listUsageResponseSchema,
  meResponseSchema,
  READY_PATH,
  readinessResponseSchema,
  scheduledPostSummarySchema,
} from '@/lib/contracts'
import { API_ORIGIN, API_TOKEN } from './config'
import { ApiError, ContractError, NetworkError } from './errors'
import { API_ROUTES, apiUrl, type QueryValue } from './routes'
import type { ResponseSchema } from './schema'

/**
 * The only module in this app that calls fetch.
 *
 * Every response is parsed with the schema from packages/contracts before it is
 * returned, so a backend that drifts from the contract fails here, once, with
 * the offending path named, instead of surfacing as an undefined field rendered
 * as a blank three screens away.
 */

type Method = 'GET' | 'POST' | 'DELETE'

/**
 * `| undefined` is spelled out on every optional because the repo compiles with
 * exactOptionalPropertyTypes, under which `signal?: AbortSignal` rejects an
 * explicitly passed `undefined`. Every caller here forwards an optional signal
 * straight through, so the alternative is a conditional spread at fourteen call
 * sites.
 */
export interface RequestOptions {
  method?: Method | undefined
  body?: unknown
  idempotencyKey?: string | undefined
  signal?: AbortSignal | undefined
}

/** Status -> code, derived from the contract's mapping so the two cannot drift. */
const CODE_BY_STATUS = new Map<number, ApiErrorCode>(
  API_ERROR_CODES.map((code) => [ERROR_STATUS[code], code]),
)

async function send(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, init)
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers({ accept: 'application/json' })
  if (options.body !== undefined) headers.set('content-type', 'application/json')
  // Never a query parameter: tokens in a URL end up in access logs, referrers
  // and browser history.
  if (API_TOKEN) headers.set(AUTHORIZATION_HEADER, `Bearer ${API_TOKEN}`)
  if (options.idempotencyKey) headers.set(IDEMPOTENCY_KEY_HEADER, options.idempotencyKey)
  return headers
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.length === 0) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * A failed response that does not parse as the contract envelope is almost
 * always a proxy or gateway page rather than our API, so it is reported as an
 * ApiError derived from the status rather than as contract drift. Calling a 502
 * HTML page "the server broke its contract" sends the reader after the wrong bug.
 */
function toApiError(response: Response, body: unknown): ApiError {
  const parsed = apiErrorSchema.safeParse(body)
  if (parsed.success) {
    const { code, message, details } = parsed.data.error
    return new ApiError(response.status, code, message, details)
  }
  const code = CODE_BY_STATUS.get(response.status) ?? 'internal'
  return new ApiError(
    response.status,
    code,
    response.statusText || `Request failed with status ${response.status}.`,
  )
}

export async function request<T>(
  url: string,
  schema: ResponseSchema<T>,
  options: RequestOptions = {},
): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers: buildHeaders(options),
    // The session is a cookie. Bearer is the fallback for API-key auth.
    credentials: 'include',
  }
  if (options.body !== undefined) init.body = JSON.stringify(options.body)
  if (options.signal) init.signal = options.signal

  let response: Response
  try {
    response = await send(url, init)
  } catch (cause) {
    // An abort is the caller's own doing (unmount, superseded request) and must
    // not be reported to the user as the API being down.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new NetworkError(url, cause)
  }

  const body = await readJson(response)
  if (!response.ok) throw toApiError(response, body)

  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ContractError(url, parsed.error.issues)
  return parsed.data
}

/**
 * A mutation that answers 204 with no body — disconnect, cancel. Same error
 * handling as `request`, but nothing to parse, so no schema is required.
 */
export async function requestVoid(url: string, options: RequestOptions = {}): Promise<void> {
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers: buildHeaders(options),
    credentials: 'include',
  }
  if (options.body !== undefined) init.body = JSON.stringify(options.body)
  if (options.signal) init.signal = options.signal

  let response: Response
  try {
    response = await send(url, init)
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new NetworkError(url, cause)
  }
  if (!response.ok) throw toApiError(response, await readJson(response))
}

/** A route under `/api/v1`. */
function v(
  route: string,
  params?: Record<string, string>,
  query?: Record<string, QueryValue>,
): string {
  return apiUrl(API_ORIGIN, route, params, query)
}

/**
 * Idempotency keys. `crypto.randomUUID` is present in every browser this app
 * targets, but not on an insecure non-localhost origin, and a page that throws
 * on submit there would be a strange way to find that out.
 */
export function newIdempotencyKey(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export interface ListProjectsParams {
  cursor?: string | undefined
  limit?: number | undefined
  status?: ProjectStage | undefined
}

export interface ListClipsParams {
  cursor?: string | undefined
  limit?: number | undefined
  sort?: 'score' | 'timeline' | undefined
  status?: ClipStatus | undefined
}

export interface ListUsageParams {
  cursor?: string | undefined
  limit?: number | undefined
  kind?: LedgerKind | undefined
}

export const api = {
  me(signal?: AbortSignal): Promise<MeResponse> {
    return request(v(API_ROUTES.me), meResponseSchema, { signal })
  },

  listProjects(
    params: ListProjectsParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ProjectSummary>> {
    return request(
      v(API_ROUTES.projects, undefined, {
        cursor: params.cursor,
        limit: params.limit,
        status: params.status,
      }),
      listProjectsResponseSchema,
      { signal },
    )
  },

  createProject(
    body: CreateProjectRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<ProjectDetail> {
    return request(v(API_ROUTES.projects), createProjectResponseSchema, {
      method: 'POST',
      body,
      idempotencyKey,
      signal,
    })
  },

  getProject(id: string, signal?: AbortSignal): Promise<ProjectDetail> {
    return request(v(API_ROUTES.project, { id }), getProjectResponseSchema, { signal })
  },

  deleteProject(
    id: string,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<DeleteProjectResponse> {
    return request(v(API_ROUTES.project, { id }), deleteProjectResponseSchema, {
      method: 'DELETE',
      idempotencyKey,
      signal,
    })
  },

  listClips(
    projectId: string,
    params: ListClipsParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ClipSummary>> {
    return request(
      v(
        API_ROUTES.projectClips,
        { id: projectId },
        {
          cursor: params.cursor,
          limit: params.limit,
          sort: params.sort,
          status: params.status,
        },
      ),
      listClipsResponseSchema,
      { signal },
    )
  },

  getClip(id: string, signal?: AbortSignal): Promise<ClipDetail> {
    return request(v(API_ROUTES.clip, { id }), clipDetailSchema, { signal })
  },

  requestClipDownload(
    id: string,
    format: ClipDownloadFormat,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<ClipDownloadResponse> {
    return request(v(API_ROUTES.clipDownload, { id }), clipDownloadResponseSchema, {
      method: 'POST',
      body: { format },
      idempotencyKey,
      signal,
    })
  },

  createUpload(
    body: CreateUploadRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<CreateUploadResponse> {
    return request(v(API_ROUTES.uploads), createUploadResponseSchema, {
      method: 'POST',
      body,
      idempotencyKey,
      signal,
    })
  },

  createMultipartUpload(
    body: CreateMultipartUploadRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<CreateMultipartUploadResponse> {
    return request(v(API_ROUTES.multipartUploads), createMultipartUploadResponseSchema, {
      method: 'POST',
      body,
      idempotencyKey,
      signal,
    })
  },

  completeMultipartUpload(
    body: CompleteMultipartUploadRequest,
    signal?: AbortSignal,
  ): Promise<CompleteMultipartUploadResponse> {
    return request(v(API_ROUTES.multipartUploadComplete), completeMultipartUploadResponseSchema, {
      method: 'POST',
      body,
      signal,
    })
  },

  /** Start a hosted checkout for a plan; returns where to send the customer to pay. */
  createCheckout(
    body: CreateCheckoutRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<CreateCheckoutResponse> {
    return request(v(API_ROUTES.checkout), createCheckoutResponseSchema, {
      method: 'POST',
      body,
      idempotencyKey,
      signal,
    })
  },

  // -- social publishing ----------------------------------------------------

  listSocialAccounts(signal?: AbortSignal): Promise<SocialAccountSummary[]> {
    return request(v(API_ROUTES.socialAccounts), listSocialAccountsResponseSchema, { signal }).then(
      (r) => r.accounts,
    )
  },

  /** Begin an OAuth connect; returns the URL to send the user to. */
  beginConnect(
    platform: SocialPlatform,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<string> {
    return request(v(API_ROUTES.socialConnect), connectSocialAccountResponseSchema, {
      method: 'POST',
      body: { platform },
      idempotencyKey,
      signal,
    }).then((r) => r.authorizationUrl)
  },

  disconnectSocialAccount(id: string, signal?: AbortSignal): Promise<void> {
    return requestVoid(v(API_ROUTES.socialAccount, { id }), { method: 'DELETE', signal })
  },

  schedulePost(
    body: SchedulePostRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<ScheduledPostSummary> {
    return request(v(API_ROUTES.scheduledPosts), scheduledPostSummarySchema, {
      method: 'POST',
      body,
      idempotencyKey,
      signal,
    })
  },

  listScheduledPosts(
    params: { clipId?: string } = {},
    signal?: AbortSignal,
  ): Promise<ScheduledPostSummary[]> {
    return request(
      v(API_ROUTES.scheduledPosts, undefined, { clipId: params.clipId }),
      listScheduledPostsResponseSchema,
      { signal },
    ).then((r) => r.posts)
  },

  cancelScheduledPost(id: string, signal?: AbortSignal): Promise<void> {
    return requestVoid(v(API_ROUTES.scheduledPost, { id }), { method: 'DELETE', signal })
  },

  listUsage(
    params: ListUsageParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<CreditLedgerEntry>> {
    return request(
      v(API_ROUTES.usage, undefined, {
        cursor: params.cursor,
        limit: params.limit,
        kind: params.kind,
      }),
      listUsageResponseSchema,
      { signal },
    )
  },

  /** Root path, outside the versioned base. Used by the connectivity banner. */
  readiness(signal?: AbortSignal): Promise<ReadinessResponse> {
    return request(`${API_ORIGIN}${READY_PATH}`, readinessResponseSchema, { signal })
  },
}

export type ApiClient = typeof api

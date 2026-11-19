import type { ApiErrorCode, InsufficientCreditsDetails, RateLimitDetails } from '@/lib/contracts'
import { insufficientCreditsDetailsSchema, rateLimitDetailsSchema } from '@/lib/contracts'
import { formatIssuePath, type SchemaIssue } from './schema'

/**
 * Three failures, kept apart because the screens react to them differently.
 *
 * `api` is the server answering in the contract envelope and is the only one the
 * user can usually act on. `network` means nothing answered at all, which during
 * development is the normal state of a backend being built in parallel, and
 * showing it as "something went wrong" would send people hunting for a bug in
 * their own data. `schema` is the server answering with a shape the contract does
 * not describe: that is drift, and it has to be loud rather than degrade into
 * undefined fields rendering as blanks.
 */
export type RequestFailureKind = 'api' | 'network' | 'schema'

export class ApiError extends Error {
  readonly kind = 'api' as const
  readonly status: number
  readonly code: ApiErrorCode
  readonly details: unknown

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export class NetworkError extends Error {
  readonly kind = 'network' as const
  readonly url: string

  constructor(url: string, cause: unknown) {
    super('The API could not be reached.')
    this.name = 'NetworkError'
    this.url = url
    this.cause = cause
  }
}

export class ContractError extends Error {
  readonly kind = 'schema' as const
  readonly url: string
  readonly issues: ReadonlyArray<SchemaIssue>

  constructor(url: string, issues: ReadonlyArray<SchemaIssue>) {
    super(`The API response did not match the contract (${issues.length} issue(s)).`)
    this.name = 'ContractError'
    this.url = url
    this.issues = issues
  }
}

export type RequestFailure = ApiError | NetworkError | ContractError

export function isRequestFailure(value: unknown): value is RequestFailure {
  return (
    value instanceof ApiError || value instanceof NetworkError || value instanceof ContractError
  )
}

/**
 * Anything thrown inside a request becomes a RequestFailure so the render path
 * has one shape to switch on. An unrecognised throw is reported as a network
 * failure because that is what it is from the screen's point of view: no usable
 * answer arrived.
 */
export function asRequestFailure(value: unknown, url = ''): RequestFailure {
  if (isRequestFailure(value)) return value
  return new NetworkError(url, value)
}

export function isApiErrorCode(failure: RequestFailure, code: ApiErrorCode): boolean {
  return failure.kind === 'api' && failure.code === code
}

/** Typed `details` for the two codes the UI actually reads them for. */
export function insufficientCreditsDetails(
  failure: RequestFailure,
): InsufficientCreditsDetails | null {
  if (!isApiErrorCode(failure, 'insufficient_credits')) return null
  const parsed = insufficientCreditsDetailsSchema.safeParse((failure as ApiError).details)
  return parsed.success ? parsed.data : null
}

export function rateLimitDetails(failure: RequestFailure): RateLimitDetails | null {
  if (!isApiErrorCode(failure, 'rate_limited')) return null
  const parsed = rateLimitDetailsSchema.safeParse((failure as ApiError).details)
  return parsed.success ? parsed.data : null
}

export interface FailureCopy {
  title: string
  description: string
  /** Whether repeating the same request unchanged is worth offering. */
  retryable: boolean
}

/**
 * One place that turns a failure into what the user reads.
 *
 * `message` from an ApiError is server copy and is shown verbatim; the other two
 * kinds have no server copy to show, so they get text that names the actual
 * situation instead of a generic apology.
 */
export function describeFailure(failure: RequestFailure): FailureCopy {
  switch (failure.kind) {
    case 'api':
      return {
        title: apiErrorTitle(failure.code),
        description: failure.message,
        retryable: failure.code === 'internal' || failure.code === 'rate_limited',
      }
    case 'network':
      return {
        title: 'Cannot reach the API',
        description:
          'No response came back from the server. It may still be starting up, or the API base URL may be wrong.',
        retryable: true,
      }
    case 'schema':
      return {
        title: 'Unexpected response from the API',
        description: `The server answered with a shape this build does not understand: ${failure.issues
          .slice(0, 3)
          .map((issue) => `${formatIssuePath(issue.path)} ${issue.message}`)
          .join('; ')}`,
        retryable: false,
      }
  }
}

function apiErrorTitle(code: ApiErrorCode): string {
  switch (code) {
    case 'validation_failed':
      return 'That request was not valid'
    case 'unauthorized':
      return 'Sign in to continue'
    case 'forbidden':
      return 'You do not have permission'
    case 'not_found':
      return 'Not found'
    case 'conflict':
      return 'Not ready yet'
    case 'rate_limited':
      return 'Too many requests'
    case 'insufficient_credits':
      return 'Out of credits'
    case 'feature_unavailable':
      return 'Not available yet'
    case 'internal':
      return 'Something went wrong'
  }
}

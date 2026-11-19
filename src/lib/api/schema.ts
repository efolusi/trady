/**
 * The slice of a contract schema this app actually uses.
 *
 * Declared structurally rather than as `z.ZodType` so the browser bundle never
 * takes a direct dependency on zod. packages/contracts owns that dependency and
 * every schema it exports satisfies this by construction, so widening it here
 * costs nothing and keeps the web package's dependency list honest about what it
 * imports directly.
 */

export interface SchemaIssue {
  readonly path: ReadonlyArray<PropertyKey>
  readonly message: string
}

export interface SchemaFailure {
  readonly issues: ReadonlyArray<SchemaIssue>
}

export type SchemaResult<T> = { success: true; data: T } | { success: false; error: SchemaFailure }

export interface ResponseSchema<T> {
  safeParse(value: unknown): SchemaResult<T>
}

/** Dotted, matching how the API reports validation issues, so both read alike. */
export function formatIssuePath(path: ReadonlyArray<PropertyKey>): string {
  return path.length === 0 ? '(root)' : path.map((part) => String(part)).join('.')
}

/**
 * One human sentence per invalid field.
 *
 * Raw schema issues are written for the wire, not for a person, and a single
 * bad value routinely produces several of them: an empty URL fails `.url()`
 * ("Invalid input") and then the http(s) refinement ("only http(s) source URLs
 * are accepted"), so the form showed two lines, both prefixed with the
 * internal path `source.url`. Collapse to the first issue per path and replace
 * it with the caller's own wording when it has some.
 */
export function humanizeIssues(
  issues: ReadonlyArray<SchemaIssue>,
  messages: Readonly<Record<string, string>> = {},
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const issue of issues) {
    const path = formatIssuePath(issue.path)
    if (seen.has(path)) continue
    seen.add(path)
    // Falling back to the raw message keeps a field we have not written copy
    // for readable, rather than silently dropping its error.
    out.push(messages[path] ?? issue.message)
  }
  return out
}

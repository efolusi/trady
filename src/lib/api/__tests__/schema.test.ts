import { createProjectRequestSchema } from '@/lib/contracts'
import { describe, expect, it } from 'vitest'
import { formatIssuePath, humanizeIssues } from '../schema'

describe('formatIssuePath', () => {
  it('dots the path and names the root', () => {
    expect(formatIssuePath(['source', 'url'])).toBe('source.url')
    expect(formatIssuePath([])).toBe('(root)')
  })
})

describe('humanizeIssues', () => {
  it('keeps one message per field and drops the internal path', () => {
    // What an empty URL actually produced: two issues on the same field, both
    // rendered with their path prefix, so the form showed
    // "source.url: Invalid input" above "source.url: only http(s) source URLs
    // are accepted".
    const parsed = createProjectRequestSchema.safeParse({
      source: { kind: 'url', url: '' },
      targetClipCount: 10,
      aspectRatio: '9:16',
    })
    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const messages = humanizeIssues(parsed.error.issues, {
      'source.url': 'Enter a video link that starts with http:// or https://.',
    })
    expect(messages).toEqual(['Enter a video link that starts with http:// or https://.'])
  })

  it('falls back to the schema message for a field with no copy of its own', () => {
    expect(humanizeIssues([{ path: ['title'], message: 'Too long' }])).toEqual(['Too long'])
  })

  it('reports each invalid field once', () => {
    expect(
      humanizeIssues(
        [
          { path: ['source', 'url'], message: 'a' },
          { path: ['source', 'url'], message: 'b' },
          { path: ['targetClipCount'], message: 'c' },
        ],
        { 'source.url': 'Bad link.' },
      ),
    ).toEqual(['Bad link.', 'c'])
  })
})

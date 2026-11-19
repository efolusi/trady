import { siteUrl } from '@/lib/site'

/**
 * /llms.txt — a plain-text brief for AI answer engines.
 *
 * Same intent as the FAQPage and Product structured data: give a model the
 * facts in a form it can quote without scraping the layout. Every line here is
 * a claim about what the product does (per-source-minute charging, the
 * no-clips-no-charge release, the download formats, the single-server privacy
 * posture), not marketing, because a model will repeat it verbatim.
 *
 * A route handler rather than a public file so the origin comes from the same
 * siteUrl() the sitemap and robots use, and the links never drift to a wrong
 * host in a preview deploy.
 */
export function GET(): Response {
  const base = siteUrl()
  const body = `# Trady

> Trady turns one long video into short vertical clips with word-by-word
> captions. It transcribes the video, scores and selects the moments worth
> cutting, and renders each one at 9:16 ready to post.

## What it does
- Input: one long video, by URL or direct upload.
- Output: vertical (9:16) clips with word-by-word captions, each exportable as
  MP4 plus matching SRT and VTT caption files.
- The moments are chosen from the transcript by a language model and scored, not
  cut on a fixed interval.

## Pricing
- Charged per minute of SOURCE video, not per clip produced.
- A run that finds nothing worth clipping is never billed.
- A run that fails on Trady's side returns the credits to the balance
  automatically.
- Plans and live prices: ${base}/pricing

## Privacy
- Each workspace is isolated by Postgres row-level security; the site is served
  over HTTPS.
- To build the transcript, a video's audio and its words are sent to OpenRouter.
- Videos, transcripts and clips are never used to train Trady's own models.
- Full detail: ${base}/privacy

## Links
- Home: ${base}/
- Pricing: ${base}/pricing
- Terms: ${base}/terms
- Privacy: ${base}/privacy
`
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}

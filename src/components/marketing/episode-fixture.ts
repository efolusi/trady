import type { ClipCategory } from '@/lib/contracts'
import { formatDuration } from '@/lib/format'

/**
 * One episode, as Trady read it.
 *
 * This is marketing, not live data: the numbers are baked in so the landing page
 * renders the same thing for a stranger with no account and no API. Everything a
 * page says about this episode is derived from the arrays below rather than
 * written out again in prose, because the failure mode of a hand-written
 * marketing number is that it drifts from the figure beside it and nobody
 * notices for a year.
 *
 * The shape obeys the real product rules, so the picture is not a lie:
 *   - every clip runs at least 30 seconds (MIN_CLIP_SECONDS in
 *     packages/pipeline/src/analysis/analyze.ts) and at most 180
 *   - categories come from CLIP_CATEGORIES in @trady/contracts
 *   - scores are the 0-99 composite the API returns on every clip
 *   - no two moments overlap, and none runs past the end of the episode
 *
 * The invariants above are asserted in __tests__/episode-fixture.test.ts, so
 * editing a row that breaks one of them fails the suite rather than shipping a
 * timeline that quietly disagrees with the product.
 */

export interface SelectedMoment {
  id: string
  /** Offset from the start of the episode, in seconds. */
  startSeconds: number
  /** At least 60, by product rule. */
  durationSeconds: number
  category: ClipCategory
  /** Composite score, 0-99, the same scale clip_scores stores. */
  score: number
  /** The line a creator would recognise the moment by. */
  title: string
}

/** 1:13:24 of source. */
export const EPISODE_DURATION_SECONDS = 4404

export const SELECTED_MOMENTS: readonly SelectedMoment[] = [
  {
    id: 'm01',
    startSeconds: 96,
    durationSeconds: 147,
    category: 'story',
    score: 91,
    title: 'The five year detour that became the company',
  },
  {
    id: 'm02',
    startSeconds: 281,
    durationSeconds: 63,
    category: 'hot_take',
    score: 64,
    title: 'Why the first hire was a mistake',
  },
  {
    id: 'm03',
    startSeconds: 418,
    durationSeconds: 80,
    category: 'informational',
    score: 73,
    title: 'How the pricing model actually works',
  },
  {
    id: 'm04',
    startSeconds: 519,
    durationSeconds: 63,
    category: 'quotable',
    score: 58,
    title: 'You cannot outsource taste',
  },
  {
    id: 'm05',
    startSeconds: 712,
    durationSeconds: 66,
    category: 'viral',
    score: 86,
    title: 'The launch that broke the database',
  },
  {
    id: 'm06',
    startSeconds: 823,
    durationSeconds: 108,
    category: 'story',
    score: 79,
    title: 'Getting fired on a Tuesday',
  },
  {
    id: 'm07',
    startSeconds: 993,
    durationSeconds: 62,
    category: 'informational',
    score: 62,
    title: 'What churn really measures',
  },
  {
    id: 'm08',
    startSeconds: 1073,
    durationSeconds: 63,
    category: 'qna',
    score: 70,
    title: 'Do you regret raising that round',
  },
  {
    id: 'm09',
    startSeconds: 1224,
    durationSeconds: 72,
    category: 'hot_take',
    score: 83,
    title: 'Growth teams are mostly theatre',
  },
  {
    id: 'm10',
    startSeconds: 1329,
    durationSeconds: 60,
    category: 'informational',
    score: 55,
    title: 'Reading the funnel backwards',
  },
  {
    id: 'm11',
    startSeconds: 1499,
    durationSeconds: 93,
    category: 'story',
    score: 88,
    title: 'The customer who called every morning',
  },
  {
    id: 'm12',
    startSeconds: 1619,
    durationSeconds: 63,
    category: 'quotable',
    score: 66,
    title: 'Ship it before you believe in it',
  },
  {
    id: 'm13',
    startSeconds: 1734,
    durationSeconds: 65,
    category: 'viral',
    score: 94,
    title: 'The pitch meeting that went sideways',
  },
  {
    id: 'm14',
    startSeconds: 1895,
    durationSeconds: 77,
    category: 'informational',
    score: 71,
    title: 'Why retention beats acquisition',
  },
  {
    id: 'm15',
    startSeconds: 2013,
    durationSeconds: 61,
    category: 'qna',
    score: 60,
    title: 'What would you tell a first time founder',
  },
  {
    id: 'm16',
    startSeconds: 2144,
    durationSeconds: 121,
    category: 'story',
    score: 89,
    title: 'Two years of building the wrong thing',
  },
  {
    id: 'm17',
    startSeconds: 2289,
    durationSeconds: 63,
    category: 'hot_take',
    score: 76,
    title: 'Most advice is survivorship bias',
  },
  {
    id: 'm18',
    startSeconds: 2470,
    durationSeconds: 60,
    category: 'quotable',
    score: 57,
    title: 'Small teams move because they must',
  },
  {
    id: 'm19',
    startSeconds: 2566,
    durationSeconds: 68,
    category: 'informational',
    score: 68,
    title: 'How the model was trained',
  },
  {
    id: 'm20',
    startSeconds: 2692,
    durationSeconds: 88,
    category: 'viral',
    score: 92,
    title: 'The email that leaked everywhere',
  },
  {
    id: 'm21',
    startSeconds: 2809,
    durationSeconds: 63,
    category: 'qna',
    score: 63,
    title: 'Where do you find your engineers',
  },
  {
    id: 'm22',
    startSeconds: 2955,
    durationSeconds: 62,
    category: 'informational',
    score: 74,
    title: 'The economics of a free tier',
  },
  {
    id: 'm23',
    startSeconds: 3064,
    durationSeconds: 70,
    category: 'hot_take',
    score: 81,
    title: 'Design by committee is a slow death',
  },
  {
    id: 'm24',
    startSeconds: 3200,
    durationSeconds: 63,
    category: 'quotable',
    score: 59,
    title: 'Culture is what you tolerate',
  },
  {
    id: 'm25',
    startSeconds: 3294,
    durationSeconds: 99,
    category: 'story',
    score: 85,
    title: 'The weekend the servers stayed down',
  },
  {
    id: 'm26',
    startSeconds: 3495,
    durationSeconds: 61,
    category: 'informational',
    score: 61,
    title: 'Reading a cohort chart properly',
  },
  {
    id: 'm27',
    startSeconds: 3600,
    durationSeconds: 63,
    category: 'viral',
    score: 90,
    title: 'The demo that sold the company',
  },
  {
    id: 'm28',
    startSeconds: 3718,
    durationSeconds: 74,
    category: 'qna',
    score: 69,
    title: 'What did you get wrong about hiring',
  },
  {
    id: 'm29',
    startSeconds: 3814,
    durationSeconds: 62,
    category: 'quotable',
    score: 65,
    title: 'Speed is a feature you can lose',
  },
  {
    id: 'm30',
    startSeconds: 3967,
    durationSeconds: 63,
    category: 'informational',
    score: 72,
    title: 'How support informs the roadmap',
  },
  {
    id: 'm31',
    startSeconds: 4068,
    durationSeconds: 84,
    category: 'hot_take',
    score: 87,
    title: 'Roadmaps are guesses with confidence',
  },
  {
    id: 'm32',
    startSeconds: 4219,
    durationSeconds: 67,
    category: 'story',
    score: 77,
    title: 'Starting over at thirty eight',
  },
]

/** Even count means the two middle values, which is why this is not `[n/2]`. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

/**
 * Seconds spelled out in words, for a sentence rather than a table. "1 minute 4
 * seconds" reads; "1:04" in the middle of prose does not, and the mono rule says
 * a timecode belongs beside the figure, not inside a clause.
 */
function spellSeconds(seconds: number): string {
  const whole = Math.round(seconds)
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  const parts: string[] = []
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
  if (rest > 0 || minutes === 0) parts.push(`${rest} ${rest === 1 ? 'second' : 'seconds'}`)
  return parts.join(' ')
}

const durations = SELECTED_MOMENTS.map((moment) => moment.durationSeconds)

/**
 * Every number the marketing copy is allowed to say about this episode.
 *
 * Derived, never typed twice. A page that wants "32 clips" reads `clipCount`; if
 * a moment is added to the array above, the sentence changes with the picture.
 */
export const SELECTION_SUMMARY = {
  /** "1:13:24" — mono, next to the figure. */
  episodeTimecode: formatDuration(EPISODE_DURATION_SECONDS),
  episodeDurationSeconds: EPISODE_DURATION_SECONDS,
  /** Floored, because 73.4 minutes of video is 73 minutes watched. */
  watchedMinutes: Math.floor(EPISODE_DURATION_SECONDS / 60),
  clipCount: SELECTED_MOMENTS.length,
  medianClipSeconds: median(durations),
  /** "1:04" */
  medianClipTimecode: formatDuration(median(durations)),
  shortestClipSeconds: Math.min(...durations),
  longestClipSeconds: Math.max(...durations),
} as const

/**
 * The figure's caption, and the only place this sentence exists. Currently:
 * "73 minutes watched, 32 clips found, median 1 minute 4 seconds".
 */
export const SELECTION_SUMMARY_LINE = [
  `${SELECTION_SUMMARY.watchedMinutes} minutes watched`,
  `${SELECTION_SUMMARY.clipCount} clips found`,
  `median ${spellSeconds(SELECTION_SUMMARY.medianClipSeconds)}`,
].join(', ')

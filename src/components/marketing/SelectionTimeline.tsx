'use client'

import { useRef, useState } from 'react'
import { formatCategory, formatDuration } from '@/lib/format'
import {
  EPISODE_DURATION_SECONDS,
  SELECTED_MOMENTS,
  SELECTION_SUMMARY,
  SELECTION_SUMMARY_LINE,
  type SelectedMoment,
} from './episode-fixture'

/**
 * One episode rendered as a band of time: a thin rule for the whole 1:13:24, and
 * the moments Trady selected sitting on it. Block width is the clip's duration
 * to scale; block height is its score.
 *
 * It is here because the buyer's real question is "will it pick the right
 * moments", and a band of actual picks answers that faster than a sentence can.
 * It is also honest about what is being sold, which is selection rather than
 * editing. The numbers come from ./episode-fixture, which every piece of copy on
 * the page reads too, so the figure and the prose cannot drift apart.
 *
 * Accessibility is built in rather than bolted on:
 *   - it is a <figure> with a real <figcaption>, so the summary is the figure's
 *     accessible name
 *   - the blocks are an ordered list of buttons, each labelled with its title,
 *     category, position, length and score, so a screen reader reads the
 *     selection as a list of 32 moments instead of finding an unlabelled bar
 *   - roving tabindex: the band is one tab stop and the arrow keys move along
 *     it, because 32 consecutive tab stops in a hero is a keyboard trap in
 *     everything but name
 *   - the reveal honours prefers-reduced-motion (see globals.css)
 *   - a tap anywhere on the band picks the moment nearest that point in time,
 *     so the touch target is the whole band rather than a 5px block
 *   - the blocks themselves take no pointer events, and two step buttons sized
 *     like every other control (44px on a finger) move between moments. 32
 *     targets at their true positions cannot each be 24px wide: at 768px the
 *     band is about 660px and the closest two moments sit 12px apart, so any
 *     per block target would overlap its neighbour. The steps are the
 *     equivalent control WCAG 2.5.8 allows instead.
 */
export function SelectionTimeline({
  className,
  label,
  previousLabel,
  nextLabel,
}: {
  className?: string
  /** Heading on the figure. It must say the episode is an example: the fixture is illustrative. */
  label: string
  /** Accessible names of the step buttons, in the page's language. */
  previousLabel: string
  nextLabel: string
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  // Which moment the arrow keys will land on next. Independent of `activeIndex`,
  // which also tracks the mouse.
  const [tabIndex, setTabIndex] = useState(0)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  const active = activeIndex === null ? null : SELECTED_MOMENTS[activeIndex]
  // Said once, politely, when a step button changes the moment. The readout is
  // hidden from assistive technology because a focused block already says it
  // all, but a step button keeps focus on itself, so nothing else would.
  const [stepped, setStepped] = useState<number | null>(null)
  const last = SELECTED_MOMENTS.length - 1

  /* The first press selects the moment the arrow keys would land on; after
     that each press moves one. Focus stays on the step button, so a finger can
     keep tapping it. */
  function step(delta: 1 | -1) {
    const base = activeIndex ?? tabIndex - delta
    const to = Math.max(0, Math.min(last, base + delta))
    setTabIndex(to)
    setActiveIndex(to)
    setStepped(to)
  }

  /** Hover follows the same time mapping as a tap, since the blocks take no pointer events. */
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    const band = event.currentTarget.getBoundingClientRect()
    if (band.width === 0) return
    setActiveIndex(
      nearestMomentIndex(((event.clientX - band.left) / band.width) * EPISODE_DURATION_SECONDS),
    )
  }

  function onPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
    // A touch fires pointerleave as the finger lifts, which would wipe the
    // moment it just picked.
    if (event.pointerType === 'mouse') setActiveIndex(null)
  }

  function move(to: number) {
    const clamped = Math.max(0, Math.min(SELECTED_MOMENTS.length - 1, to))
    setTabIndex(clamped)
    buttons.current[clamped]?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLOListElement>) {
    const from = tabIndex
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        move(from + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        move(from - 1)
        break
      case 'Home':
        move(0)
        break
      case 'End':
        move(SELECTED_MOMENTS.length - 1)
        break
      default:
        return
    }
    // Only reached when a key above matched, so ordinary keys still work.
    event.preventDefault()
  }

  /* A tap anywhere on the band selects the moment nearest that point in time.
     Block width is the clip's duration to scale, so the narrowest is under 5px
     on a phone: a finger cannot pick one, and widening them would make the
     figure lie about how long the moments are. Pointing at a POSITION is also
     the right mental model for a scrubber, so the band itself is the target:
     its full height, its full width, no gesture, no drag threshold, and no
     touch-action change that could fight the page's vertical scroll.

     Mapping is by TIME, not by even spacing - the 32 moments sit at irregular
     offsets, so `index = round(fraction * (n - 1))` would land on the wrong one
     wherever the picks bunch up. */
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Every tap goes through the same mapping, including one that landed on a
    // block: a point inside a moment resolves to that moment, so the block gets
    // selected either way and there is no second code path to keep in step.
    const band = event.currentTarget.getBoundingClientRect()
    if (band.width === 0) return
    const seconds = ((event.clientX - band.left) / band.width) * EPISODE_DURATION_SECONDS
    const nearest = nearestMomentIndex(seconds)
    setTabIndex(nearest)
    // Set the readout here rather than leaning on the block's own focus
    // handler: a tap that lands between two blocks has to move the readout too,
    // and making the tap own that state keeps the two paths from disagreeing.
    setActiveIndex(nearest)
    buttons.current[nearest]?.focus()
  }

  return (
    <figure className={className ? `mk-timeline ${className}` : 'mk-timeline'}>
      <div className="mk-timeline__head">
        <span className="mk-eyebrow">{label}</span>
        <div className="mk-timeline__steps">
          <button
            type="button"
            className="mk-timeline__step"
            aria-label={previousLabel}
            // aria-disabled, not disabled: a disabled button drops the focus
            // of the finger or key that just pressed it to <body>.
            aria-disabled={activeIndex === 0}
            onClick={() => step(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="mk-timeline__step"
            aria-label={nextLabel}
            aria-disabled={activeIndex === last}
            onClick={() => step(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <p className="mk-timeline__readout" aria-hidden="true">
          {active ? <MomentReadout moment={active} /> : 'Founder interview, one hour thirteen'}
        </p>
        <span className="sr-only" aria-live="polite">
          {stepped === null
            ? ''
            : momentLabel(SELECTED_MOMENTS[stepped] as SelectedMoment, stepped)}
        </span>
      </div>

      <div
        className="mk-timeline__band"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {/* Decorative: the rule's meaning is stated in the caption and in every
            moment's label, so announcing it again adds nothing. */}
        <div className="mk-timeline__rule" aria-hidden="true" />

        {/* The key handler sits on the list rather than on each button because
            it routes between them; the <ol> keeps its list semantics, takes no
            focus and no role, and only listens. */}
        <ol
          className="mk-timeline__track"
          aria-label={`${SELECTION_SUMMARY.clipCount} moments Trady selected, in order. Use the arrow keys to move between them.`}
          onKeyDown={onKeyDown}
        >
          {SELECTED_MOMENTS.map((moment, index) => (
            <li
              key={moment.id}
              className="mk-timeline__slot"
              style={
                {
                  left: `${percent(moment.startSeconds / EPISODE_DURATION_SECONDS)}%`,
                  width: `${percent(moment.durationSeconds / EPISODE_DURATION_SECONDS)}%`,
                  // Drives the stagger. Index order is chronological order, so
                  // the reveal sweeps left to right.
                  '--mk-index': index,
                } as React.CSSProperties
              }
            >
              <button
                type="button"
                ref={(node) => {
                  buttons.current[index] = node
                }}
                className={
                  index === activeIndex
                    ? 'mk-timeline__moment mk-timeline__moment--active'
                    : 'mk-timeline__moment'
                }
                // Height is the score against the full 0-99 scale, not against
                // the range these 32 happen to cover. A stretched axis would
                // make an average pick look like a great one.
                style={{ height: `${percent(moment.score / 99)}%` }}
                tabIndex={index === tabIndex ? 0 : -1}
                onFocus={() => {
                  setTabIndex(index)
                  setActiveIndex(index)
                }}
                onBlur={() => setActiveIndex(null)}
              >
                <span className="sr-only">{momentLabel(moment, index)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mk-timeline__ends" aria-hidden="true">
        <span className="mk-measured">0:00</span>
        <span className="mk-measured">{SELECTION_SUMMARY.episodeTimecode}</span>
      </div>

      <figcaption className="mk-timeline__caption mk-measured">{SELECTION_SUMMARY_LINE}</figcaption>
    </figure>
  )
}

/**
 * The moment nearest a point in the episode, by TIME rather than by even
 * spacing: the 32 picks sit at irregular offsets, so
 * `round(fraction * (n - 1))` would land on the wrong one wherever they bunch
 * up. A point inside a moment scores zero, so it always wins; otherwise the
 * gap to the nearer edge decides, and the earlier moment wins a tie because
 * `forEach` keeps the first strictly-smaller distance.
 *
 * Exported for the test: the mapping is the whole correctness of the tap, and
 * it is not observable from the rendered markup.
 */
export function nearestMomentIndex(seconds: number): number {
  let nearest = 0
  let best = Number.POSITIVE_INFINITY
  SELECTED_MOMENTS.forEach((moment, index) => {
    const start = moment.startSeconds
    const end = start + moment.durationSeconds
    const distance = seconds < start ? start - seconds : seconds > end ? seconds - end : 0
    if (distance < best) {
      best = distance
      nearest = index
    }
  })
  return nearest
}

/** The hover and focus line. Mono on the values, sentence case on the words. */
function MomentReadout({ moment }: { moment: SelectedMoment }) {
  return (
    <>
      <b>{moment.title}</b>
      {'. '}
      {formatCategory(moment.category)}
      {', '}
      <span className="mk-measured">{formatDuration(moment.startSeconds)}</span>
      {' for '}
      <span className="mk-measured">{formatDuration(moment.durationSeconds)}</span>
      {', scored '}
      <span className="mk-measured">{moment.score}</span>
    </>
  )
}

/**
 * What a screen reader hears on each moment. Everything the block encodes
 * visually is in here, in the order it matters: which one, what it is, where it
 * sits, how long it runs, how it scored.
 */
function momentLabel(moment: SelectedMoment, index: number): string {
  return [
    `Moment ${index + 1} of ${SELECTION_SUMMARY.clipCount}.`,
    `${moment.title}.`,
    `${formatCategory(moment.category)}.`,
    `Starts at ${formatDuration(moment.startSeconds)},`,
    `runs ${formatDuration(moment.durationSeconds)}.`,
    `Scored ${moment.score} out of 99.`,
  ].join(' ')
}

/** Four decimals: 60 seconds of 4404 is 1.3624%, and rounding it flattens the band. */
function percent(fraction: number): number {
  return Number((fraction * 100).toFixed(4))
}

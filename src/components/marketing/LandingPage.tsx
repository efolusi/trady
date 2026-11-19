import Link from 'next/link'
import { formatDuration } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { SSO_SIGN_UP_URL } from '../../lib/sso'
import { CaptionHeadline } from './CaptionHeadline'
import { ClipPreview } from './ClipPreview'
import { ClipStack } from './ClipStack'
import { Container } from './Container'
import { cx } from './cx'
import { SELECTED_MOMENTS } from './episode-fixture'
import { FaqSection } from './FaqSection'
import styles from './landing.module.css'
import { MarketingShell } from './MarketingShell'
import { Section } from './Section'
import { SelectionTimeline } from './SelectionTimeline'

/**
 * The page a signed-out visitor lands on.
 *
 * Structure, in the order the buyer's questions arrive: what did it actually do
 * (the timeline), how does it work, what do I get back, what does it cost, and
 * one way in. The timeline is the argument; the prose around it only names
 * things.
 *
 * EVERY NUMBER ON THIS PAGE COMES FROM ./episode-fixture, and the fixture is
 * illustrative, so the page labels it as an example wherever it appears and
 * never states its figures as a run Trady did. Not one of them is
 * typed into a sentence by hand, because a hand-typed marketing number drifts
 * from the figure beside it and nobody notices for a year. If a claim needs a
 * number this project has not measured, the claim is cut instead: that is why
 * the credits section describes the model and prints no price.
 *
 * A server component. Only the timeline is interactive and it carries its own
 * 'use client'.
 */

/**
 * HowTo structured data for the user's actual task, not the internal stages.
 *
 * The six STAGES above are what the SYSTEM does; a HowTo describes what the
 * PERSON does, which is the shorter true sequence: sign in, add a video, let
 * Trady work, review and download. Kept to what the product actually does today
 * — no active-speaker crop claim, because the shipped reframe is a centre crop
 * until the vision stage lands — since an answer engine repeats these steps
 * verbatim. The visible "how it works" section is the on-page backing.
 */
const HOW_TO_STEPS: ReadonlyArray<{ name: string; text: string }> = [
  {
    name: 'Create an account',
    text: 'Sign up and open a workspace. Everything you make lives inside it.',
  },
  {
    name: 'Add one long video',
    text: 'Start a project by pasting a video URL or uploading a file, such as a podcast, interview, stream or webinar.',
  },
  {
    name: 'Let Trady find the moments',
    text: 'Trady transcribes the video with word-level timing, then reads the whole transcript to score and select the moments worth cutting.',
  },
  {
    name: 'Review the clips',
    text: 'See every moment it picked, each with its score, category and timecode, before you post anything.',
  },
  {
    name: 'Download',
    text: 'Each moment exports as a vertical 9:16 MP4 with word-by-word captions, plus matching SRT and VTT files.',
  },
]

function howToJsonLd(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to turn a long video into short vertical clips with Trady',
    step: HOW_TO_STEPS.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  })
}

/** The five highest-scoring rows of the example shortlist — the cue sheet. */
const CUE_SHEET = [...SELECTED_MOMENTS].sort((a, b) => b.score - a.score).slice(0, 5)

/** A 16px arrow for the text-link call to action. Decorative. */
function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function LandingPage({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <MarketingShell t={t} locale={locale}>
      <Section className={cx(styles.heroSection)}>
        <Container>
          <div className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className="mk-eyebrow">{t.hero.eyebrow}</span>
              {/* The headline set the way the product sets captions: word by
                  word, with one word held in a caption box. */}
              <CaptionHeadline words={t.hero.headline} />
              <p className="mk-lede">{t.hero.lede}</p>
              <div className={styles.actions}>
                <a href={SSO_SIGN_UP_URL} className="mk-btn mk-btn--primary mk-btn--lg">
                  {t.hero.ctaPrimary}
                </a>
                <Link href="#how-it-works" className="mk-textlink">
                  {t.hero.ctaSecondary}
                  <ArrowRight />
                </Link>
              </div>
              <ul className={styles.chips} aria-label={t.hero.eyebrow}>
                {t.hero.chips.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            </div>

            <div className={styles.player}>
              <SelectionTimeline
                label={t.hero.figureLabel}
                previousLabel={t.hero.previousMoment}
                nextLabel={t.hero.nextMoment}
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section id="features" tone="rule">
        <Container>
          <div className={styles.head}>
            <h2 className="mk-display-lg">{t.stack.title}</h2>
            <p className="mk-prose">{t.stack.lede}</p>
          </div>
          <ClipStack t={t} />
        </Container>
      </Section>

      <Section tone="rule">
        <Container>
          <div className={styles.capability}>
            <div className={styles.capabilityCopy}>
              <h2 className={styles.capabilityTitle}>{t.find.title}</h2>
              <p className="mk-prose">{t.find.body}</p>
            </div>
            <figure className={styles.cueSheet}>
              {CUE_SHEET.map((moment) => (
                <div key={moment.title} className={styles.cueRow}>
                  <span className={`${styles.cueTime} mk-measured`}>
                    {formatDuration(moment.startSeconds)}
                  </span>
                  <span className={styles.cueTitle}>{moment.title}</span>
                  <span className={`${styles.cueScore} mk-measured`}>{moment.score}</span>
                </div>
              ))}
              <figcaption className={styles.clipCaptionFigure}>{t.find.figure}</figcaption>
            </figure>
          </div>

          <div className={styles.capability}>
            <div className={styles.capabilityCopy}>
              <h2 className={styles.capabilityTitle}>{t.captions.title}</h2>
              <p className="mk-prose">{t.captions.body}</p>
            </div>
            <ClipPreview caption={t.captions.figure} />
          </div>

          <div className={styles.capability}>
            <div className={styles.capabilityCopy}>
              <h2 className={styles.capabilityTitle}>{t.reframe.title}</h2>
              <p className="mk-prose">{t.reframe.body}</p>
            </div>
            <div className={styles.reframe} aria-hidden="true">
              <div className={styles.reframeWide}>
                <div className={styles.reframeKeep} />
              </div>
              <svg
                aria-hidden="true"
                className={styles.reframeArrow}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
              <div className={styles.reframeTall}>
                <span>9:16</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="rule" id="how-it-works" className={cx(styles.anchored)}>
        <Container>
          <div className={styles.head}>
            <span className="mk-eyebrow">{t.how.eyebrow}</span>
            <h2 className="mk-display-lg">{t.how.title}</h2>
          </div>
          <ol className={styles.steps3}>
            {t.how.steps.map((step) => (
              <li key={step.title} className={styles.step3}>
                <span className={styles.step3Time}>{step.time}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <FaqSection t={t} />

      <Section tone="brand">
        <Container>
          <div className={styles.close}>
            <h2 className="mk-display-lg">{t.close.title}</h2>
            <p className="mk-prose">{t.close.body}</p>
            <a href={SSO_SIGN_UP_URL} className="mk-btn mk-btn--cream mk-btn--lg">
              {t.close.cta}
            </a>
          </div>
        </Container>
      </Section>

      {/* HowTo as a script text child, same reasoning as the pricing JSON-LD:
          the payload is our own serialised steps of plain strings, so React's
          text escaping leaves it intact and the linter's XSS guard stays
          meaningful. */}
      <script type="application/ld+json">{howToJsonLd()}</script>
    </MarketingShell>
  )
}

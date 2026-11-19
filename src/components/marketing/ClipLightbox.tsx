'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './landing.module.css'

export interface Sample {
  src: string
  poster: string
  lang: string
  title: string
  category: string
}

/**
 * Four sample clips as still posters, each opening in a dialog when clicked.
 *
 * They used to autoplay in place: four videos looping at once on one screen,
 * which is noisy to look at, downloads four files before anyone asks, and
 * gives the reader nothing to do. A poster with a play affordance is quiet
 * until it is wanted, and the dialog is where a clip gets the size and the
 * sound to actually be judged.
 *
 * The dialog is a plain overlay rather than <dialog>: it has to trap nothing,
 * only close on Escape, on a backdrop click and on its own button, which is
 * three lines here and a polyfill argument there.
 */
export function ClipLightbox({ samples }: { samples: readonly Sample[] }) {
  const [open, setOpen] = useState<Sample | null>(null)
  const rail = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const close = useCallback(() => setOpen(null), [])

  // Which arrows are worth offering. Recomputed on scroll and on resize,
  // because "is there more to the right" changes with the viewport too.
  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // One card short of a full page, so something the reader was already looking
  // at stays on screen and the movement reads as a slide, not a jump.
  const slide = (direction: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + 16 : el.clientWidth
    el.scrollBy({ left: direction * Math.max(step, el.clientWidth - step), behavior: 'smooth' })
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    // The page behind a modal must not scroll; restored on close.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, close])

  return (
    <>
      <div className={styles.clipRail}>
        <button
          type="button"
          className={`${styles.railArrow} ${styles.railArrowPrev} ${atStart ? styles.railArrowOff : ''}`}
          onClick={() => slide(-1)}
          aria-label="Previous clips"
        >
          ‹
        </button>
        <div className={styles.clipStack} ref={rail} onScroll={measure}>
          {samples.map((sample) => (
            <figure key={sample.src} className={styles.stackCard}>
              <button
                type="button"
                className={styles.stackFrame}
                onClick={() => setOpen(sample)}
                aria-label={`Play: ${sample.title}`}
              >
                <span className={styles.stackLang}>{sample.lang}</span>
                {/* next/image, unlike the signed-URL thumbnails elsewhere: these
                    posters are static assets under /public, so the optimiser can
                    size and cache them. `fill` because the frame already fixes
                    the 9/16 box; `sizes` mirrors the rail's four-up / two-up /
                    one-up breakpoints so no card downloads a full-width file. */}
                <Image
                  className={styles.stackPoster}
                  src={sample.poster}
                  alt=""
                  fill
                  sizes="(max-width: 520px) 78vw, (max-width: 900px) 50vw, 25vw"
                />
                <span className={styles.stackPlay} aria-hidden="true">
                  ▶
                </span>
              </button>
              <figcaption className={styles.stackMeta}>
                <span className={styles.stackTag}>{sample.category}</span>
                <span className={styles.stackTitle}>{sample.title}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.railArrow} ${styles.railArrowNext} ${atEnd ? styles.railArrowOff : ''}`}
          onClick={() => slide(1)}
          aria-label="More clips"
        >
          ›
        </button>
      </div>

      {open ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={(event) => {
            if (event.target === event.currentTarget) close()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}
        >
          <div className={styles.lightboxInner}>
            {/* biome-ignore lint/a11y/useMediaCaption: the captions are burned into the picture, which is the feature being shown */}
            <video
              className={styles.lightboxVideo}
              src={open.src}
              poster={open.poster}
              controls
              autoPlay
              playsInline
            />
            <div className={styles.lightboxMeta}>
              <span className={styles.stackTag}>
                {open.lang} · {open.category}
              </span>
              <span className={styles.stackTitle}>{open.title}</span>
            </div>
          </div>
          <button type="button" className={styles.lightboxClose} onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
      ) : null}
    </>
  )
}

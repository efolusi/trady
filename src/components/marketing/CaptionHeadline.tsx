'use client'

import { Fragment, useEffect, useState } from 'react'
import styles from './caption-headline.module.css'

/**
 * The headline set the way Trady sets captions: word by word, each one
 * arriving on its own beat, with the measured numbers held in caption boxes.
 * This is the product doing its one trick on its own name — not decoration.
 *
 * One orchestrated page-load moment; nothing else on the page animates.
 * prefers-reduced-motion gets the finished frame with no sequence.
 */
export function CaptionHeadline({
  words,
}: {
  /** The headline, one entry per caption beat. `box` marks a measured value. */
  words: ReadonlyArray<{ text: string; box?: boolean }>
}) {
  // Rendered static on the server (every word visible) so the headline exists
  // for crawlers and for anyone whose JS never lands; the class that arms the
  // animation is added only after mount.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setArmed(true)
  }, [])

  return (
    <h1 className={`${styles.headline} ${armed ? styles.armed : ''}`}>
      {words.map((word, i) => (
        // The fragment carries the space BETWEEN beats as a real text node.
        // Flex layout ignores whitespace-only children (the column-gap stays
        // the visual rhythm), but without it the accessible name and the
        // crawled text ran the words together ("Tradymenonton73menit…").
        <Fragment
          key={`${word.text}-${
            // biome-ignore lint/suspicious/noArrayIndexKey: order is the identity of a caption beat
            i
          }`}
        >
          {i > 0 ? ' ' : null}
          <span
            className={word.box ? styles.box : styles.word}
            style={{ '--beat': i } as React.CSSProperties}
          >
            {word.text}
          </span>
        </Fragment>
      ))}
    </h1>
  )
}

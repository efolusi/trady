import { AspectRatio } from '@efolusi/meridian'
import { cx } from './cx'
import styles from './landing.module.css'

/**
 * A finished clip, playing.
 *
 * This used to be a drawn approximation of one — a 9:16 frame with caption
 * words in it — because there was nothing real to show. There is now: the file
 * came out of the pipeline (transcribe, score, reframe, burn captions), so the
 * page shows the product's own output instead of an illustration of it.
 *
 * Muted, looping and controlless on purpose: it is evidence, not a player.
 * Muted is also what lets it autoplay at all — browsers refuse a clip with
 * sound — and it keeps the page quiet while the four sample cards below wait
 * to be asked.
 */

export function ClipPreview({ caption }: { caption: string }) {
  return (
    <figure className={styles.clip}>
      <AspectRatio ratio={9 / 16} className={cx(styles.clipFrame)}>
        {/* A real Trady render, not a mock: this file came out of the pipeline
            (transcribe → score → reframe → burn captions) and is the clip the
            figcaption describes. Muted + playsInline so it can autoplay, and
            no controls: it is evidence, not a player. */}
        <video
          className="thumb"
          src="/brand/demo-clip.mp4"
          poster="/brand/demo-clip-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="A vertical clip Trady cut, with word-by-word captions"
        />
      </AspectRatio>
      <figcaption className={styles.clipCaptionFigure}>{caption}</figcaption>
    </figure>
  )
}

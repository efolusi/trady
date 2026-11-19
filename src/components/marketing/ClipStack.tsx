import type { Dictionary } from '@/lib/i18n'
import { ClipLightbox, type Sample } from './ClipLightbox'

/**
 * Clips Trady actually produced, on a rail.
 *
 * These are pipeline output, not artwork: every clip transcribed with word
 * timing, scored, reframed to a vertical crop that follows the speaker, and
 * rendered with its captions burned in. All Indonesian at the moment, which is
 * not a decision so much as what has been run through the product since the
 * fixes: "does it understand Indonesian" is the first question an Indonesian
 * buyer asks, so it is the right gap to have. An English source belongs here
 * once one has been through the same path.
 *
 * EVERY CLIP HERE CAME OUT OF THE PRODUCT, after the reframe and caption work
 * landed. The set this replaces did not: those files were cut by a scratch
 * script running an earlier crop that centred on the speaker's mouth and slid
 * about once a second. Showing them was advertising the exact defect the
 * customer had complained about, so they are gone rather than kept for variety.
 *
 * SOURCES MUST BE CLEAN. Sources that subtitle themselves, or sit under a
 * permanent burned-in timecode, are out: Trady's captions land on top of
 * someone else's and our own feature looks broken. A multi-camera grid is out
 * for a second reason: with six panels there is no single subject to reframe
 * onto, so the vertical crop has nothing to demonstrate.
 *
 * Shown as still posters that open in a dialog when clicked. Videos looping at
 * once on one screen is noise nobody asked for, and it downloads every file
 * before anyone decides to watch; a poster is quiet until it is wanted, and the
 * dialog is where a clip can be judged at size and with sound.
 *
 * Ordered to alternate sources rather than grouped by video, so the first
 * screenful reads as range instead of as several angles on one podcast.
 */
const SAMPLES: readonly Sample[] = [
  {
    src: '/brand/clips/holywings-1.mp4',
    poster: '/brand/clips/holywings-1.jpg',
    lang: 'ID',
    title: 'Kalau nggak pakai AI, saya pecat',
    category: 'hot take',
  },
  {
    src: '/brand/clips/miliar-1.mp4',
    poster: '/brand/clips/miliar-1.jpg',
    lang: 'ID',
    title: 'Zona blunder: kehilangan uang dalam semalam',
    category: 'story',
  },
  {
    src: '/brand/clips/holywings-2.mp4',
    poster: '/brand/clips/holywings-2.jpg',
    lang: 'ID',
    title: 'Dari modal 200 juta ke miliaran, lalu berhenti',
    category: 'story',
  },
  {
    src: '/brand/clips/miliar-2.mp4',
    poster: '/brand/clips/miliar-2.jpg',
    lang: 'ID',
    title: 'Naikkan penghasilan, bukan tanya makro',
    category: 'hot take',
  },
  {
    src: '/brand/clips/miliar-4.mp4',
    poster: '/brand/clips/miliar-4.jpg',
    lang: 'ID',
    title: 'Kekayaan sejati itu membosankan',
    category: 'quotable',
  },
  {
    src: '/brand/clips/holywings-3.mp4',
    poster: '/brand/clips/holywings-3.jpg',
    lang: 'ID',
    title: 'Gen Z minum lebih sedikit, dan klub merasakannya',
    category: 'informational',
  },
  {
    src: '/brand/clips/miliar-3.mp4',
    poster: '/brand/clips/miliar-3.jpg',
    lang: 'ID',
    title: 'Prioritaskan penghasilan, bukan investasi kecil',
    category: 'hot take',
  },
  {
    src: '/brand/clips/miliar-5.mp4',
    poster: '/brand/clips/miliar-5.jpg',
    lang: 'ID',
    title: 'Kenyataan pahit mencapai 1 miliar pertama',
    category: 'story',
  },
] as const

export function ClipStack({ t }: { t: Dictionary }) {
  void t
  return <ClipLightbox samples={SAMPLES} />
}

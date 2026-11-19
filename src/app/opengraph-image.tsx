import { ImageResponse } from 'next/og'
import {
  BRAND_MARK_PATH,
  BRAND_MARK_TRANSFORM,
  BRAND_MARK_VIEWBOX,
} from '@/components/brand-mark-path'

/**
 * The social-share card, generated rather than hand-drawn.
 *
 * Next renders this once per deploy and serves it as a static PNG, so every
 * page that does not set its own `openGraph.images` gets a real branded card
 * instead of a link with no preview. Kept to ImageResponse's flexbox subset and
 * its built-in font: fetching a web font here would make the card a network
 * round trip that fails closed to a blank image the first time the font host is
 * slow.
 */

export const runtime = 'nodejs'
export const alt = 'Trady: turn one long video into vertical, captioned clips'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BRAND = '#7c4a1e'
const INK = '#f6efe6'

export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px',
        background: `linear-gradient(135deg, #1c140d 0%, ${BRAND} 100%)`,
        color: INK,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 40, letterSpacing: 4, opacity: 0.8 }}>
        trady.efolusi.com
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <svg viewBox={BRAND_MARK_VIEWBOX} width={188} height={120} role="img" aria-label="Trady">
            <g transform={BRAND_MARK_TRANSFORM}>
              <path d={BRAND_MARK_PATH} fill={INK} fillRule="evenodd" clipRule="evenodd" />
            </g>
          </svg>
          <div style={{ display: 'flex', fontSize: 132, fontWeight: 800, lineHeight: 1 }}>
            Trady
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 52, fontWeight: 500, maxWidth: 900 }}>
          One long video in, vertical clips with word-by-word captions out.
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 34, opacity: 0.85 }}>
        Charged per source minute · a run that finds nothing is never billed
      </div>
    </div>,
    { ...size },
  )
}

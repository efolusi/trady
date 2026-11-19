import {
  BRAND_MARK_PATH,
  BRAND_MARK_RATIO,
  BRAND_MARK_TRANSFORM,
  BRAND_MARK_VIEWBOX,
} from './brand-mark-path'

/**
 * The product mark as it appears in UI: the bare otter silhouette, no tile.
 *
 * `size` is the mark box B (24 nav / 20 footer / 40 auth across products): the
 * side of a square with the same area as the rendered ink. The silhouette is
 * wide (ratio ~1.59), so width = size*sqrt(ratio), height = size/sqrt(ratio),
 * with no further multiplier.
 * Ink comes from `currentColor`, set to `var(--logo-mark)` by `.brand-mark` in
 * globals.css, which follows the theme (brand-800 light, brand-300 dark).
 *
 * `tile` is kept for a possible future use; no caller should pass it today.
 * Decorative: the wordmark text next to it carries the name.
 */
export function BrandMark({
  size = 24,
  tile = false,
  className,
}: {
  size?: number
  tile?: boolean
  className?: string
}) {
  const root = Math.sqrt(BRAND_MARK_RATIO)
  const width = Math.round(size * root * 100) / 100
  const height = Math.round((size / root) * 100) / 100
  return (
    <span
      className={['brand-mark', tile ? 'brand-mark--tile' : null, className]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        className="brand-mark__glyph"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={BRAND_MARK_VIEWBOX}
        width={width}
        height={height}
        aria-hidden="true"
        focusable="false"
      >
        <g transform={BRAND_MARK_TRANSFORM}>
          <path d={BRAND_MARK_PATH} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
        </g>
      </svg>
    </span>
  )
}

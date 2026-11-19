/**
 * One band of the page, carrying the site's single vertical rhythm.
 *
 * The padding is on the section rather than between sections so a toned band
 * fills the whole gap instead of leaving a stripe of page colour above it.
 *
 * `tone` follows the Efolusi landing standard: bands are separated by a 1px
 * hairline (`rule`), not by alternating fills, and the brown `brand` band is
 * used at most twice on a page. Both are Meridian semantic tokens, so the two
 * themes follow without a second palette.
 */
export function Section({
  tone = 'page',
  id,
  className,
  children,
}: {
  /** @default 'page' */
  tone?: 'page' | 'rule' | 'brand'
  id?: string
  className?: string
  children: React.ReactNode
}) {
  const classes = ['mk-section']
  if (tone !== 'page') classes.push(`mk-section--${tone}`)
  if (className) classes.push(className)
  return (
    <section id={id} className={classes.join(' ')}>
      {children}
    </section>
  )
}

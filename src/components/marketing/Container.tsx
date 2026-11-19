/**
 * The horizontal bound. 1200px for anything with structure, 720px for running
 * prose (the legal pages), and gutters that hold at 360px.
 *
 * It is separate from <Section> on purpose: a section paints a full-bleed band,
 * a container narrows the content inside it. Nest them, do not merge them.
 */
export function Container({
  width = 'wide',
  className,
  children,
}: {
  /** 'text' is Meridian's --container-text, the reading measure. @default 'wide' */
  width?: 'wide' | 'text'
  className?: string
  children: React.ReactNode
}) {
  const classes = ['mk-container']
  if (width === 'text') classes.push('mk-container--text')
  if (className) classes.push(className)
  return <div className={classes.join(' ')}>{children}</div>
}

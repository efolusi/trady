'use client'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StatusDot,
} from '@efolusi/meridian'
import { type CSSProperties, Fragment, type HTMLAttributes, type ReactNode } from 'react'

export interface TradyCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  padding?: number
  interactive?: boolean
}

export function TradyCard({
  title,
  subtitle,
  actions,
  padding,
  interactive,
  children,
  style,
  ...props
}: TradyCardProps) {
  const contentStyle: CSSProperties | undefined = padding === undefined ? undefined : { padding }
  return (
    <Card {...(interactive === undefined ? {} : { interactive })} style={style} {...props}>
      {title || subtitle || actions ? (
        <CardHeader>
          <div>
            {title ? <CardTitle>{title}</CardTitle> : null}
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </div>
          {actions ? <CardAction>{actions}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent style={contentStyle}>{children}</CardContent>
    </Card>
  )
}

type TradyTone = 'neutral' | 'accent' | 'brand' | 'success' | 'warning' | 'danger'

const BADGE_VARIANT: Record<TradyTone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  accent: 'outline',
  brand: 'default',
  success: 'outline',
  warning: 'outline',
  danger: 'destructive',
}

export function TradyBadge({
  tone = 'neutral',
  size: _size,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: TradyTone; size?: 'sm' | 'md' }) {
  return <Badge {...props} variant={BADGE_VARIANT[tone]} data-tone={tone} />
}

export function TradyEmpty({
  icon,
  title,
  description,
  action,
  bordered: _bordered,
}: {
  icon?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  bordered?: boolean
}) {
  return (
    <Empty>
      <EmptyHeader>
        {icon ? (
          <EmptyMedia variant="icon">
            <Icon name={icon} aria-hidden />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export function TradyAlert({
  tone = 'info',
  title,
  description,
  action,
}: {
  tone?: 'info' | 'warning' | 'danger'
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <Alert variant={tone === 'danger' ? 'destructive' : 'default'} data-tone={tone}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {action ? <AlertAction>{action}</AlertAction> : null}
    </Alert>
  )
}

export interface TradySelectOption {
  value: string
  label: ReactNode
}

export function TradySelect({
  label,
  options,
  value,
  onChange,
  disabled,
  style,
}: {
  label?: ReactNode
  options: TradySelectOption[]
  value?: string
  onChange?: (event: { target: { value: string } }) => void
  disabled?: boolean
  style?: CSSProperties
}) {
  const control = (
    <Select
      {...(value === undefined ? {} : { value })}
      onValueChange={(next) => onChange?.({ target: { value: next } })}
      {...(disabled === undefined ? {} : { disabled })}
    >
      <SelectTrigger style={style}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  return label ? (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {control}
    </Field>
  ) : (
    control
  )
}

export function TradySkeleton({
  lines,
  variant: _variant,
  width,
  height,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  lines?: number
  variant?: string
  width?: number | string
  height?: number | string
}) {
  if (lines && lines > 1) {
    return (
      <div className="stack-sm" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: decorative skeleton lines are static and never reorder
          <Skeleton key={`line-${index + 1}`} />
        ))}
      </div>
    )
  }
  return <Skeleton {...props} style={{ width, height, ...style }} />
}

export function TradyBreadcrumbs({ items }: { items: Array<{ label: ReactNode; href?: string }> }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          // The separator is its own <li>, so it sits beside the item rather
          // than inside it: <li> in <li> is invalid and fails hydration.
          <Fragment key={item.href ?? String(item.label)}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 ? <BreadcrumbSeparator /> : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function TradyStatusDot({
  state,
  ...props
}: {
  state: 'ok' | 'warn' | 'err' | 'busy' | 'off'
  pulse?: boolean
  label?: ReactNode
}) {
  return <StatusDot status={state} {...props} />
}

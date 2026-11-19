/** Producer contract Pay 616aab98: explicit quote units, never settlement assets. */
export interface PayQuoteIntent {
  version: 1
  productId: string
  mode: 'test' | 'live'
  amountMinor: string
  currency: 'USD'
  currencyExponent: 2
}
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

export function matchesPayQuotePaid(
  event: unknown,
  intent: PayQuoteIntent,
  invoiceId: string,
  paymentId: string,
): boolean {
  const e = object(event)
  if (
    e?.schemaVersion !== 1 ||
    e.eventType !== 'transaction.paid' ||
    typeof e.eventId !== 'string' ||
    !e.eventId ||
    typeof e.occurredAt !== 'string' ||
    !Number.isFinite(Date.parse(e.occurredAt))
  )
    return false
  const payment = object(e.paymentIdentity),
    invoice = object(e.invoiceIdentity),
    money = object(e.money)
  if (!payment || !invoice || !money) return false
  if (
    ![e, payment, invoice].every(
      (scope) => scope.productId === intent.productId && scope.mode === intent.mode,
    )
  )
    return false
  return (
    e.txnId === paymentId &&
    payment.paymentId === paymentId &&
    invoice.invoiceId === invoiceId &&
    invoice.authority === 'product' &&
    money.unitVersion === 1 &&
    money.unitStatus === 'resolved' &&
    money.basis === 'quote' &&
    money.settlementAsset === null &&
    typeof money.amountMinor === 'string' &&
    /^(0|[1-9][0-9]*)$/.test(money.amountMinor) &&
    money.amountMinor === intent.amountMinor &&
    e.amountMinor === intent.amountMinor &&
    money.currency === intent.currency &&
    e.currency === intent.currency &&
    money.currencyExponent === intent.currencyExponent
  )
}

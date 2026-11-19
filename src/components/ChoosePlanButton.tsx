'use client'

import { useRef, useState } from 'react'
import { api, newIdempotencyKey } from '@/lib/api/client'
import { asRequestFailure, describeFailure, isApiErrorCode } from '@/lib/api/errors'
import { appUrl } from '@/lib/site'

/**
 * The pricing "Choose plan" action.
 *
 * Paying is a tenant action, so a signed-out visitor is sent to sign in rather
 * than shown an error; a signed-in one is handed to Pay's hosted checkout. Pay
 * owns the underlying provider route. The
 * plan id is passed, never a price: the server strikes the amount from the
 * catalogue, so the client cannot name what it pays.
 */
export function ChoosePlanButton({
  planId,
  planName,
  className,
}: {
  planId: string
  planName: string
  className?: string | undefined
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkoutKey = useRef<string | null>(null)

  async function checkout() {
    setError(null)
    setPending(true)
    try {
      checkoutKey.current ??= newIdempotencyKey()
      const result = await api.createCheckout(
        { planId, checkoutKey: checkoutKey.current },
        checkoutKey.current,
      )
      window.location.href = result.checkoutUrl
    } catch (cause) {
      const failure = asRequestFailure(cause)
      // Not signed in: go authenticate rather than surface a 401 on a pricing page.
      if (isApiErrorCode(failure, 'unauthorized')) {
        window.location.href = appUrl('/signin?next=/usage')
        return
      }
      setError(describeFailure(failure).title)
      setPending(false)
    }
  }

  return (
    <div className="stack-sm">
      <button
        type="button"
        className={className}
        onClick={() => void checkout()}
        disabled={pending}
      >
        {pending ? 'Starting…' : `Choose ${planName}`}
      </button>
      {error ? <span className="mk-quiet">{error}</span> : null}
    </div>
  )
}

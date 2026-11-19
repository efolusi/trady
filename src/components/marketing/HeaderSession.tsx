'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { appUrl } from '@/lib/site'
import { SSO_SIGN_UP_URL } from '../../lib/sso'

/**
 * The right-hand side of the marketing header, which depends on who is asking.
 *
 * A signed-in reader arriving on the landing page should see the way back into
 * their workspace, not an invitation to create the account they already have.
 * The session is an HttpOnly cookie, so the only way to know is to ask the API;
 * until it answers, the signed-out pair renders (the common case, and the state
 * a stranger would see anyway) rather than a spinner in the header.
 */
export function HeaderSession({
  labels,
}: {
  /** Plain strings, not the dictionary: this is a client component. */
  labels: { open: string; signIn: string; signUp: string; signUpShort: string }
}) {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    api
      .me(controller.signal)
      .then(() => setSignedIn(true))
      .catch(() => {
        // 401 is the ordinary answer here, and a network failure is not proof
        // of being signed out either way. Both leave the signed-out pair up.
      })
    return () => controller.abort()
  }, [])

  if (signedIn) {
    return (
      <a href={appUrl('/')} className="mk-btn mk-btn--primary">
        {labels.open}
      </a>
    )
  }

  return (
    <>
      <a href={appUrl('/signin')} className="mk-btn mk-btn--quiet">
        {labels.signIn}
      </a>
      <a href={SSO_SIGN_UP_URL} className="mk-btn mk-btn--primary">
        {/* Full sentence where it fits; on a phone the row cannot wrap and the
            long label was the piece pushed off screen. */}
        <span className="hide-xs">{labels.signUp}</span>
        <span className="show-xs">{labels.signUpShort}</span>
      </a>
    </>
  )
}

import { describe, expect, it } from 'vitest'

import { dictionaries } from '../i18n'
import { DELETE_PROJECT_DESCRIPTION, retentionNotice } from '../retention-copy'

/**
 * No purge worker exists, so the project screen must not say media is removed.
 * The delete dialog used to promise "removed shortly after" while the privacy
 * page said removal is manual; this keeps the two from drifting apart again.
 */
describe('project retention copy', () => {
  // A positive promise of removal; "is not removed" is the honest negation and passes.
  const promises =
    /(?<!not )(removed (shortly|on)|will be (removed|deleted|erased)|is (removed|deleted|erased) (after|on|within))/i

  it('does not promise that deleting a project erases its media', () => {
    expect(DELETE_PROJECT_DESCRIPTION).not.toMatch(promises)
    expect(DELETE_PROJECT_DESCRIPTION).toMatch(/not erased automatically/)
  })

  it('does not promise that expiry removes media', () => {
    const notice = retentionNotice('1 Jan 2027')
    expect(notice).not.toMatch(promises)
    expect(notice).toMatch(/no automatic purge yet/)
  })

  it('agrees with the privacy page, which says there is no automatic purge', () => {
    const retention = JSON.stringify(dictionaries.en.legal.privacy.sections.retention)
    expect(retention).toMatch(/There is no automatic purge yet/)
  })
})

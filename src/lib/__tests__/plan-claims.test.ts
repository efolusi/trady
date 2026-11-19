import { describe, expect, it } from 'vitest'

import { dictionaries, LOCALES } from '../i18n'

/**
 * Copy that describes a plan perk has to say which plans it is on.
 *
 * Reframing that follows the speaker (face_tracking) is enforced per plan by
 * the render worker: Pro and Business get it, Free and Starter keep the centre
 * crop. The landing page used to describe it as something every clip gets,
 * which stopped being true the moment the plan was checked.
 */
describe('plan perk claims', () => {
  it('names the plans that get speaker-following framing, in every language', () => {
    for (const locale of LOCALES) {
      const body = dictionaries[locale].reframe.body
      expect(body, `${locale} reframe copy`).toMatch(/\bPro\b/)
      expect(body, `${locale} reframe copy`).toMatch(/\bBusiness\b/)
    }
  })

  it('never offers a watermark either way, since no plan renders one', () => {
    for (const locale of LOCALES) {
      expect(JSON.stringify(dictionaries[locale]), locale).not.toMatch(/watermark|tanda air/i)
    }
  })
})

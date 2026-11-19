import { describe, expect, it } from 'vitest'

import { dictionaries, LOCALES } from '../i18n'
import { creditsLine, formatIdr } from '../pricing'

/**
 * Pricing copy has to describe what billing does.
 *
 * A paid plan is settled once: the invoice credits its minutes a single time
 * and nothing renews (Pay is called for a one-off hosted invoice, and no code
 * charges again). The free plan's minutes are a one-time grant at sign-up.
 * The cards used to say "/ month" and the rupiah price "/bln", which promised
 * a monthly allowance nobody would receive.
 */

const MONTHLY = /\bmonth|\bmonthly|\/\s*bln|\bbulan(an)?\b|\bper bulan/i

const plan = (priceUsdCents: number) => ({ priceUsdCents, monthlyCredits: 300 * 60 })

describe('billing copy', () => {
  it('never prices a plan per month, in any language', () => {
    for (const locale of LOCALES) {
      const t = dictionaries[locale]
      expect(JSON.stringify(t.pricing), `${locale} pricing`).not.toMatch(MONTHLY)
      expect(creditsLine(t, plan(4900), locale), `${locale} paid card`).not.toMatch(MONTHLY)
      expect(creditsLine(t, plan(0), locale), `${locale} free card`).not.toMatch(MONTHLY)
    }
    expect(formatIdr(784000)).not.toMatch(MONTHLY)
  })

  it('says a paid plan is paid for once and the free minutes come at sign-up', () => {
    expect(creditsLine(dictionaries.en, plan(4900), 'en')).toBe(
      '300 minutes of source video, paid once',
    )
    expect(creditsLine(dictionaries.en, plan(0), 'en')).toBe(
      '300 minutes of source video when you sign up',
    )
    expect(creditsLine(dictionaries.id, plan(4900), 'id')).toBe(
      '300 menit video sumber, sekali bayar',
    )
    expect(creditsLine(dictionaries.id, plan(0), 'id')).toBe(
      '300 menit video sumber saat mendaftar',
    )
  })

  it('tells the buyer nothing renews, on the pricing page and in the terms', () => {
    const renews = { en: /nothing renews|does not renew/i, id: /tidak diperpanjang/i }
    for (const locale of LOCALES) {
      const t = dictionaries[locale]
      expect(t.pricing.billingNote, `${locale} pricing note`).toMatch(renews[locale])
      const terms = JSON.stringify(t.legal.terms.sections.credits)
      expect(terms, `${locale} terms`).toMatch(renews[locale])
    }
  })

  it('formats rupiah as a plain price', () => {
    expect(formatIdr(784000)).toBe('Rp784.000')
    expect(formatIdr(0)).toBe('')
  })
})

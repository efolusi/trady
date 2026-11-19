import { describe, expect, it } from 'vitest'

import { dictionaries, LOCALES } from '../i18n'
import { isUnshipped, UNSHIPPED_FEATURES } from '../unshipped-features'

/**
 * The failure this guards against is a plan that quietly starts selling a
 * feature nobody built. social_publishing is on the Business tier and has been
 * since the plans were seeded, but nothing delivers a post to a platform. It
 * stays listed — it is the tier's differentiator — and it stays badged.
 */

describe('unshipped features', () => {
  it('still holds the social publishing claim', () => {
    // Delete this expectation only together with the per-platform
    // PublishTarget, in the same commit that makes a post actually arrive.
    expect(isUnshipped('social_publishing')).toBe(true)
  })

  it('does not badge a feature that ships today', () => {
    for (const key of ['url_ingest', 'manual_upload', 'captions', 'face_tracking']) {
      expect(isUnshipped(key), `${key} is shipped and must not be badged`).toBe(false)
    }
  })

  it('has a readable sentence and a badge in every language', () => {
    for (const locale of LOCALES) {
      const t = dictionaries[locale]
      expect(t.pricing.comingSoon.trim().length, `${locale} has no badge text`).toBeGreaterThan(0)
      for (const key of UNSHIPPED_FEATURES) {
        // A badge on a raw key like "social publishing" is worse than no badge:
        // the reader cannot tell what is being withheld.
        expect(t.pricing.features[key], `${locale} has no sentence for ${key}`).toBeDefined()
      }
    }
  })

  it('never promises direct publishing in the marketing copy', () => {
    // The pricing badge is undone by one landing-page sentence saying the clips
    // go straight out to your channels, so both are checked from one place.
    const claims = [/publish straight to your channels/i, /langsung terbitkan ke kanal/i]
    for (const locale of LOCALES) {
      for (const step of dictionaries[locale].how.steps) {
        for (const claim of claims) {
          expect(step.body, `${locale} how-it-works still claims direct publishing`).not.toMatch(
            claim,
          )
        }
      }
    }
  })
})

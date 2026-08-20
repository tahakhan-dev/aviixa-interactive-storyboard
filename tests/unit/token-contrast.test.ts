import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { contrastRatio, compositeOver } from './contrast'

const CSS = readFileSync('app/globals.css', 'utf8')
function token(name: string): string {
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(CSS)
  if (!m?.[1]) throw new Error(`Token ${name} not found or not a 6-digit hex`)
  return m[1]
}

const TONES = ['ok', 'info', 'attention', 'blocked', 'stale', 'neutral'] as const
/** StatusPill paints the label in the tone colour over a 10% tint of ITSELF. */
const PILL_TINT_ALPHA = 0.1

describe('status token contrast, measured where it actually renders', () => {
  // This used to composite over --color-surface (#ffffff). That is the
  // LIGHTEST surface in the palette, so the tint came out lighter than it
  // ever renders and the measurement was structurally incapable of failing:
  // every tone passed here while --color-status-ok shipped at 4.383:1 on
  // /hub/ and axe caught it in the e2e suite instead. A tint is only as
  // light as what it sits on, so the guard has to measure the DARKEST
  // surface a pill can sit on -- --color-surface-sunken, which backs 28 of
  // the token-backed panels including the /hub/ section that failed.
  const surface = token('--color-surface-sunken')

  it.each(TONES)('%s passes AA at 12px on the composited pill background', (tone) => {
    const c = token(`--color-status-${tone}`)
    const rendered = compositeOver(c, surface, PILL_TINT_ALPHA)
    expect(contrastRatio(c, rendered)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(TONES)('%s also passes against that surface untinted', (tone) => {
    expect(contrastRatio(token(`--color-status-${tone}`), surface)).toBeGreaterThanOrEqual(4.5)
  })

  // Slice 1 shipped a token with 0.05 of headroom that would have flipped to
  // failing the first time anything shifted. Require real margin.
  it.each(TONES)('%s carries at least 0.25 of headroom on the tint', (tone) => {
    const c = token(`--color-status-${tone}`)
    expect(contrastRatio(c, compositeOver(c, surface, PILL_TINT_ALPHA))).toBeGreaterThanOrEqual(4.75)
  })

  it('measures the tint, not the surface — the two differ for every tone', () => {
    for (const tone of TONES) {
      const c = token(`--color-status-${tone}`)
      const onSurface = contrastRatio(c, surface)
      const onTint = contrastRatio(c, compositeOver(c, surface, PILL_TINT_ALPHA))
      expect(onTint, tone).toBeLessThan(onSurface)
    }
  })
})

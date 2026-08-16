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
  const surface = token('--color-surface')

  it.each(TONES)('%s passes AA at 12px on the composited pill background', (tone) => {
    const c = token(`--color-status-${tone}`)
    const rendered = compositeOver(c, surface, PILL_TINT_ALPHA)
    expect(contrastRatio(c, rendered)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(TONES)('%s also passes against the plain surface', (tone) => {
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

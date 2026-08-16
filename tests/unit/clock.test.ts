import { describe, it, expect } from 'vitest'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

describe('clock', () => {
  it('returns the same instant until advanced', () => {
    const c = fixedClock(CANONICAL_EPOCH_MS)
    expect(c.now()).toBe(CANONICAL_EPOCH_MS)
    expect(c.now()).toBe(CANONICAL_EPOCH_MS)
  })

  it('issues a strictly increasing logical tick', () => {
    const c = fixedClock(CANONICAL_EPOCH_MS)
    const a = c.logicalTick()
    const b = c.logicalTick()
    expect(b).toBeGreaterThan(a)
  })

  it('pins the canonical epoch so replays are reproducible', () => {
    expect(new Date(CANONICAL_EPOCH_MS).toISOString()).toBe(
      '2026-03-02T06:00:00.000Z',
    )
  })
})

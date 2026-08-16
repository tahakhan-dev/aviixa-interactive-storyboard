import { describe, it, expect } from 'vitest'
import {
  SCREEN_STATES, screenState, FRONTLINE_ONLY_STATES, type ScreenStateId,
} from '@/ui/screen-state'

describe('the thirteen screen states', () => {
  it('defines exactly thirteen', () => {
    expect(SCREEN_STATES).toHaveLength(13)
  })

  it('numbers them STATE-01 through STATE-13 with no gaps', () => {
    expect(SCREEN_STATES.map((s) => s.id)).toEqual(
      Array.from({ length: 13 }, (_, i) => `STATE-${String(i + 1).padStart(2, '0')}`),
    )
  })

  it('names them exactly as the frozen source does', () => {
    expect(SCREEN_STATES.map((s) => s.name)).toEqual([
      'Empty', 'Loading', 'Success', 'Validation', 'Permission-denied',
      'Read-only', 'Offline', 'Stale-data', 'Queued',
      'Artificial-intelligence-degraded', 'Artificial-intelligence-unavailable',
      'Failure', 'Recovery',
    ])
  })

  it('gives every state a contract sentence a non-specialist can act on', () => {
    for (const s of SCREEN_STATES) {
      expect(s.contract.length, s.id).toBeGreaterThan(40)
      expect(s.contract, s.id).not.toMatch(/^[A-Z-]+$/)
    }
  })

  it('records what each state must never do', () => {
    expect(screenState('STATE-01').neverDo).toMatch(/blank panel/i)
    expect(screenState('STATE-02').neverDo).toMatch(/zero/i)
    expect(screenState('STATE-09').neverDo).toMatch(/applied|complete/i)
  })

  // Frozen source: "Only the Frontline Worker Application has a true offline state."
  it('restricts the offline state to the Frontline surface alone', () => {
    expect(FRONTLINE_ONLY_STATES).toEqual(['STATE-07'])
    expect(screenState('STATE-07').frontlineOnly).toBe(true)
    for (const s of SCREEN_STATES) {
      if (s.id !== 'STATE-07') expect(s.frontlineOnly, s.id).toBe(false)
    }
  })

  it('uses none of the forbidden state words as a state name', () => {
    const names = SCREEN_STATES.map((s) => s.name.toLowerCase()).join(' ')
    for (const forbidden of ['synced', 'sent', 'done']) {
      expect(names, forbidden).not.toContain(forbidden)
    }
  })

  it('throws on an unknown state id rather than returning undefined', () => {
    expect(() => screenState('STATE-99' as ScreenStateId)).toThrow()
  })
})

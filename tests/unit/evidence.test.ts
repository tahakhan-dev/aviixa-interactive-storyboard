import { describe, it, expect } from 'vitest'
import { projectImpact, projectEvidence } from '@/scenario/evidence'

const committed = {
  status: 'accepted', committed: true,
  priorStateHash: 'a'.repeat(64), nextStateHash: 'b'.repeat(64),
  affectedSurfaces: ['SURF-DOH', 'SURF-CC'],
  events: [{ id: 'E1' }], audit: [{ id: 'A1' }], notifications: [],
  commands: [], schedules: [],
  decision: { outcome: 'allowed' },
} as never

describe('evidence projections', () => {
  it('summarises impact without inventing anything not in the transition', () => {
    const p = projectImpact(committed)
    expect(p.affectedSurfaces).toEqual(['SURF-DOH', 'SURF-CC'])
    expect(p.eventCount).toBe(1)
    expect(p.auditCount).toBe(1)
    expect(p.notificationCount).toBe(0)
  })

  it('is pure — the same input gives an equal result and the input is unchanged', () => {
    const before = JSON.stringify(committed)
    const a = projectImpact(committed)
    const b = projectImpact(committed)
    expect(a).toEqual(b)
    expect(JSON.stringify(committed)).toBe(before)
  })

  it('carries both state hashes so a reviewer can see the transition moved', () => {
    const e = projectEvidence(committed)
    expect(e.priorStateHash).not.toBe(e.nextStateHash)
  })

  it('produces no review record — evidence is a projection, not a review action', () => {
    const e = projectEvidence(committed)
    expect(Object.keys(e)).not.toContain('reviewerLabel')
    expect(Object.keys(e)).not.toContain('status')
  })
})

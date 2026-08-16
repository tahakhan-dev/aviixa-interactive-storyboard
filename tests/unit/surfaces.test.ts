import { describe, it, expect } from 'vitest'
import { SURFACES, surfaceById, type SurfaceId } from '@/domain/surfaces'

describe('surfaces', () => {
  it('defines exactly five surfaces', () => {
    expect(SURFACES).toHaveLength(5)
  })

  it('uses the canonical identifiers', () => {
    expect(SURFACES.map((s) => s.id).sort()).toEqual([
      'SURF-CC',
      'SURF-DOH',
      'SURF-FL',
      'SURF-SA',
      'SURF-STU',
    ])
  })

  it('gives every surface a full human-readable name with no bare acronym', () => {
    for (const s of SURFACES) {
      expect(s.name.length).toBeGreaterThan(10)
      expect(s.name).not.toMatch(/^SURF-/)
    }
  })

  it('never defines Tenant Administration as a surface', () => {
    expect(SURFACES.map((s) => s.name).join(' ')).not.toMatch(
      /Tenant Administration/i,
    )
  })

  it('resolves a surface by id', () => {
    expect(surfaceById('SURF-CC' as SurfaceId).name).toBe(
      'Client Command Center',
    )
  })

  it('records the module id prefix and expected module count for each surface', () => {
    const counts = Object.fromEntries(
      SURFACES.map((s) => [s.id, s.canonicalModuleCount]),
    )
    expect(counts).toEqual({
      'SURF-SA': 19,
      'SURF-DOH': 19,
      'SURF-STU': 18,
      'SURF-CC': 13,
      'SURF-FL': 12,
    })
    const total = SURFACES.reduce((n, s) => n + s.canonicalModuleCount, 0)
    expect(total).toBe(81)
  })
})

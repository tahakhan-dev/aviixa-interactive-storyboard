import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  emptyDomainState,
  tenantPartition,
  withTenant,
} from '@/domain/state'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
const OTHER = tenantId('TEN-OTHER')

describe('scenario domain state', () => {
  it('has exactly one platform partition', () => {
    const s = emptyDomainState(RUN)
    expect(s.platform).toBeDefined()
    expect(Object.keys(s.tenants)).toHaveLength(0)
  })

  it('starts its ledgers empty and append-only', () => {
    const s = emptyDomainState(RUN)
    expect(s.ledgers.audit).toEqual([])
    expect(s.ledgers.events).toEqual([])
    expect(s.ledgers.commands).toEqual([])
    expect(s.ledgers.notifications).toEqual([])
    expect(s.ledgers.schedules).toEqual([])
  })

  it('keeps tenant partitions isolated from one another', () => {
    let s = emptyDomainState(RUN)
    s = withTenant(s, BRIGHT, (p) => ({ ...p, displayName: 'Bright Bikes' }))
    s = withTenant(s, OTHER, (p) => ({ ...p, displayName: 'Other Co' }))
    expect(tenantPartition(s, BRIGHT)?.displayName).toBe('Bright Bikes')
    expect(tenantPartition(s, OTHER)?.displayName).toBe('Other Co')
  })

  it('never mutates the prior state when a tenant changes', () => {
    const before = emptyDomainState(RUN)
    const after = withTenant(before, BRIGHT, (p) => ({
      ...p,
      displayName: 'Bright Bikes',
    }))
    expect(before.tenants[BRIGHT]).toBeUndefined()
    expect(after.tenants[BRIGHT]?.displayName).toBe('Bright Bikes')
    expect(after).not.toBe(before)
  })

  it('leaves a sibling tenant object identical when one tenant changes', () => {
    let s = emptyDomainState(RUN)
    s = withTenant(s, BRIGHT, (p) => ({ ...p, displayName: 'Bright Bikes' }))
    s = withTenant(s, OTHER, (p) => ({ ...p, displayName: 'Other Co' }))
    const brightBefore = s.tenants[BRIGHT]
    const next = withTenant(s, OTHER, (p) => ({ ...p, displayName: 'Renamed' }))
    expect(next.tenants[BRIGHT]).toBe(brightBefore)
  })

  // CRITICAL 1: a plain `{}`-backed tenants map resolves 'constructor' etc.
  // to something truthy via Object.prototype, so a naive `!== undefined`
  // existence check never fires for a tenant that was never registered.
  describe('CRITICAL 1: tenantPartition never borrows Object.prototype', () => {
    it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'])(
      'reports %s as an unregistered tenant, not the inherited value',
      (raw) => {
        const s = emptyDomainState(RUN)
        expect(tenantPartition(s, tenantId(raw))).toBeUndefined()
      },
    )

    it('still reports a genuinely registered tenant after another poisoned lookup', () => {
      let s = emptyDomainState(RUN)
      s = withTenant(s, BRIGHT, (p) => ({ ...p, displayName: 'Bright Bikes' }))
      expect(tenantPartition(s, tenantId('constructor'))).toBeUndefined()
      expect(tenantPartition(s, BRIGHT)?.displayName).toBe('Bright Bikes')
    })
  })
})

import { describe, it, expect } from 'vitest'
import { branchFrom } from '@/scenario/lineage'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { hashState } from '@/domain/hash'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const RUN = scenarioRunId('RUN-1')
const T = tenantId('TEN-A')
const base = () => ({
  ...withTenant(emptyDomainState(RUN), T, (p) => ({ ...p, displayName: 'A', lifecycleState: 'ACTIVE' as const })),
  sequence: 5,
})

describe('checkpoint branching', () => {
  it('creates a new run id carrying the parent', () => {
    const clock = fixedClock(CANONICAL_EPOCH_MS)
    const { lineage } = branchFrom(base(), 3, scenarioRunId('RUN-2'), clock)
    expect(lineage.runId).toBe('RUN-2')
    expect(lineage.parentRunId).toBe('RUN-1')
    expect(lineage.branchedFromSequence).toBe(3)
  })

  // The whole point: history is never rewritten.
  it('leaves the parent state byte-identical', async () => {
    const parent = base()
    const before = await hashState(parent)
    branchFrom(parent, 3, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS))
    expect(await hashState(parent)).toBe(before)
  })

  it('gives the branch the new run id, not the parent’s', () => {
    const { state } = branchFrom(base(), 3, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS))
    expect(state.runId).toBe('RUN-2')
  })

  it('refuses a branch point beyond the parent’s sequence', () => {
    expect(() => branchFrom(base(), 99, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS)))
      .toThrow(/sequence/i)
  })

  it('refuses to reuse the parent’s run id', () => {
    expect(() => branchFrom(base(), 3, RUN, fixedClock(CANONICAL_EPOCH_MS)))
      .toThrow(/run id/i)
  })

  // Minor (final review): `branchFrom` used to be `async` with no `await` in
  // its body -- a pointless Promise wrapper around synchronous work, forcing
  // every caller to `await` (or `.then`) something that never actually
  // suspends. Fixed to a plain synchronous function; this is the regression
  // lock so it does not quietly grow an `await` back in without a reason.
  it('is synchronous -- returns a plain object, not a Promise', () => {
    const result = branchFrom(base(), 3, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS))
    expect(result).not.toBeInstanceOf(Promise)
  })
})

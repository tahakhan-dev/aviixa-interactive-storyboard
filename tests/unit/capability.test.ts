import { describe, it, expect } from 'vitest'
import { permittedUnder, type ActionClass } from '@/persistence/capability'
import type { StorageBootstrapState } from '@/persistence/bootstrap'

const DURABLE: readonly ActionClass[] = [
  'durableEvidence', 'requiredAudit', 'captureAcceptance', 'queueAcceptance',
  'approval', 'publication', 'release', 'hold', 'synchronisation',
  'lifecycleChange', 'checkpointCredit',
]
const SAFE: readonly ActionClass[] = [
  'navigate', 'readFixture', 'presentation', 'failurePreview', 'sandboxDemo',
]

describe('persistence capability matrix', () => {
  it('permits everything when storage is durable', () => {
    for (const a of [...SAFE, ...DURABLE]) {
      expect(permittedUnder('ready-durable', a), a).toBe(true)
    }
  })

  it('permits only the non-durable action classes in ephemeral preview', () => {
    for (const a of SAFE) expect(permittedUnder('ephemeral-preview', a), a).toBe(true)
    for (const a of DURABLE) expect(permittedUnder('ephemeral-preview', a), a).toBe(false)
  })

  it('blocks every durable action class in every failure exit', () => {
    const exits = [
      'upgrade-blocked', 'persistence-denied', 'quota-limited',
      'corrupt-quarantined', 'migration-failed-read-only', 'ephemeral-preview',
    ] as const
    for (const s of exits) {
      for (const a of DURABLE) expect(permittedUnder(s, a), `${s}/${a}`).toBe(false)
    }
  })

  it('blocks even navigation before the store is installed', () => {
    expect(permittedUnder('opening', 'navigate')).toBe(false)
  })

  // Beyond the brief: the table is declared as Record<StorageBootstrapState, ...>,
  // so it is complete by construction (a missing key is a compile error, not
  // a runtime gap) -- but that only proves the TABLE is exhaustive, not that
  // `permittedUnder` actually consults it for every state rather than, say,
  // defaulting unknown states to permissive. Drive every declared state
  // through every action class and check the safe/durable split holds for
  // ALL fourteen, not just the ones the brief happened to name.
  it('never permits a durable action class outside ready-durable, for every declared state', () => {
    const allStates: readonly StorageBootstrapState[] = [
      'uninitialized', 'client-mounted', 'opening', 'reading',
      'runtime-validating', 'checksum-verifying', 'migrating', 'ready-durable',
      'upgrade-blocked', 'persistence-denied', 'quota-limited',
      'corrupt-quarantined', 'migration-failed-read-only', 'ephemeral-preview',
    ]
    for (const s of allStates) {
      for (const a of DURABLE) {
        expect(permittedUnder(s, a), `${s}/${a}`).toBe(s === 'ready-durable')
      }
    }
  })

  it('permits nothing at all in every in-progress state', () => {
    const inProgress: readonly StorageBootstrapState[] = [
      'uninitialized', 'client-mounted', 'opening', 'reading',
      'runtime-validating', 'checksum-verifying', 'migrating',
    ]
    for (const s of inProgress) {
      for (const a of [...SAFE, ...DURABLE]) {
        expect(permittedUnder(s, a), `${s}/${a}`).toBe(false)
      }
    }
  })

  // BLOCKING 3: spec §5.3's table, row for row. The spec was amended (bb92eef)
  // after the capability code landed (c1d2821) to permit `presentation` on
  // the three RECOVERABLE failure exits (quota-limited, upgrade-blocked,
  // migration-failed-read-only) -- it touches no durable store, so blocking
  // it buys no safety. `persistence-denied` and `corrupt-quarantined` stay
  // at the two genuinely read-only classes, because store integrity is
  // itself in question there. This test is the row-for-row backstop the
  // spec asks for so the table can never silently drift from §5.3 again.
  it('matches spec §5.3 exactly, row for row, for all eight table rows', () => {
    const SPEC_5_3: Record<StorageBootstrapState | 'every in-progress state', readonly ActionClass[]> = {
      'ready-durable': [...SAFE, ...DURABLE],
      'ephemeral-preview': SAFE,
      'quota-limited': ['navigate', 'readFixture', 'presentation'],
      'upgrade-blocked': ['navigate', 'readFixture', 'presentation'],
      'migration-failed-read-only': ['navigate', 'readFixture', 'presentation'],
      'persistence-denied': ['navigate', 'readFixture'],
      'corrupt-quarantined': ['navigate', 'readFixture'],
      'every in-progress state': [],
      // Every in-progress state shares row 8's answer (none); listed
      // individually here only so every declared union member is checked.
      'uninitialized': [],
      'client-mounted': [],
      opening: [],
      reading: [],
      'runtime-validating': [],
      'checksum-verifying': [],
      migrating: [],
    }
    const ALL_CLASSES: readonly ActionClass[] = [...SAFE, ...DURABLE]
    for (const [state, permitted] of Object.entries(SPEC_5_3)) {
      if (state === 'every in-progress state') continue
      for (const action of ALL_CLASSES) {
        expect(
          permittedUnder(state as StorageBootstrapState, action),
          `${state}/${action}`,
        ).toBe(permitted.includes(action))
      }
    }
  })

  // §5.3's own stated reason: presentation touches no store at all, so it is
  // the one safe class the spec singles out as recoverable on the three
  // uncorrupted exits but still blocked where store integrity is in doubt.
  it('permits presentation on the three recoverable exits, blocks it where store integrity is in question', () => {
    for (const s of ['quota-limited', 'upgrade-blocked', 'migration-failed-read-only'] as const) {
      expect(permittedUnder(s, 'presentation'), s).toBe(true)
    }
    for (const s of ['persistence-denied', 'corrupt-quarantined'] as const) {
      expect(permittedUnder(s, 'presentation'), s).toBe(false)
    }
  })

  it('fails closed to false for a state outside the declared union, rather than throwing', () => {
    // `state` is typed as the closed StorageBootstrapState union, so every
    // legitimate caller is covered -- but permittedUnder is a boolean gate
    // that may be consulted with unchecked/upstream input, and a gate that
    // crashes instead of denying is not "fails closed."
    const unmapped = 'not-a-real-state' as unknown as StorageBootstrapState
    expect(() => permittedUnder(unmapped, 'navigate')).not.toThrow()
    expect(permittedUnder(unmapped, 'navigate')).toBe(false)
    expect(permittedUnder(unmapped, 'durableEvidence')).toBe(false)
  })
})

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
})

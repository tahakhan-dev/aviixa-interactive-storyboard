import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import type { RoleId } from '@/domain/roles'
import { permitsRead, type PermissionOutcome } from '@/policy/decision'
import type { AccessContext } from '@/policy/evaluate'
import {
  cellFor,
  cellFromSource,
  columnAttribution,
  columnClass,
  missingCells,
  type LiveEvaluation,
  type MatrixColumn,
} from '@/policy/columns'
import {
  MATRIX_A,
  MATRIX_B,
  SCHEDULE_OPERATIONS,
  TENANT_TIMING_GRANTS,
  TENANT_TIMING_IS_SAME_SURFACE,
  matrixFor,
  operationEnumeratedAs,
  readableScheduleAudit,
  scheduleAttribution,
  scheduleDecision,
  scheduleRow,
  type ScheduleAuditReference,
  type ScheduleOperationId,
} from '@/policy/schedule-operations'

/**
 * 45A.7's two matrices, measured on the frozen source by reading each body to
 * where it stops. Every locator below was opened and the whole line read.
 *
 *   Matrix A  header L99233  10 pipe columns, 9 actors (4 platform + 5 non-human)
 *                            22 rows L99235-L99256, 198 cells
 *   Matrix B  header L99260   6 pipe columns, 5 tenant roles
 *                            22 rows L99262-L99283, 110 cells
 */

const RUN = scenarioRunId('RUN-SLICE10-SCHEDPERM')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
const OTHER = tenantId('TEN-NORTHFORGE')

function twoActiveTenants() {
  const one = withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
  return withTenant(one, OTHER, (p) => ({
    ...p,
    displayName: 'North Forge',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function identity(over: Partial<IdentitySimulationState> = {}): IdentitySimulationState {
  return {
    signedIn: true,
    role: 'READONLY_AUDITOR',
    tenant: BRIGHT,
    siteScope: [],
    areaScope: [],
    qualifications: [],
    deviceId: null,
    stepUpActive: false,
    accessSessionId: null,
    ...over,
  }
}

function ctx(over: Partial<AccessContext> = {}): AccessContext {
  return {
    state: twoActiveTenants(),
    identity: identity(),
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'person-omar',
    ...over,
  }
}

/** A live evaluation for a tenant-domain role. */
const tenantLive = (role: RoleId): LiveEvaluation => ({
  req: { action: 'SCHEDULE_OP', sourceRefs: ['L99260'] },
  ctx: ctx({ identity: identity({ role }) }),
})

/** A live evaluation for a platform-domain role, which holds no tenant. */
const platformLive = (role: RoleId): LiveEvaluation => ({
  req: { action: 'SCHEDULE_OP', sourceRefs: ['L99233'] },
  ctx: ctx({ identity: identity({ role, tenant: null }) }),
})

const column = (matrix: typeof MATRIX_A, header: string): MatrixColumn => {
  const found = matrix.columns.find((c) => c.header === header)
  if (found === undefined) throw new Error(`no ${header} column in ${matrix.name}`)
  return found
}

const outcomeTally = (matrix: typeof MATRIX_A): Record<string, number> => {
  const tally: Record<string, number> = {}
  for (const row of matrix.rows) {
    for (const col of matrix.columns) {
      const { outcome } = cellFor(row, col)
      tally[outcome] = (tally[outcome] ?? 0) + 1
    }
  }
  return tally
}

describe('45A.7 the two matrices, as transcribed', () => {
  /**
   * A MEMBERSHIP LIST, NOT A LENGTH, AND DECLARED OUTSIDE THE MODULE. Typed
   * `readonly ScheduleOperationId[]`, so deleting an operation from
   * `SCHEDULE_OPERATIONS` fails twice: red here, and a `tsc` error on the
   * literal naming the identifier that no longer exists. `toHaveLength(22)` is
   * satisfied by any 22 identifiers at all.
   */
  const ENUMERATED: readonly ScheduleOperationId[] = [
    'PER-SCHED-01',
    'PER-SCHED-02',
    'PER-SCHED-03',
    'PER-SCHED-04',
    'PER-SCHED-05',
    'PER-SCHED-06',
    'PER-SCHED-07',
    'PER-SCHED-08',
    'PER-SCHED-09',
    'PER-SCHED-10',
    'PER-SCHED-11',
    'PER-SCHED-12',
    'PER-SCHED-13',
    'PER-SCHED-14',
    'PER-SCHED-15',
    'PER-SCHED-16',
    'PER-SCHED-17',
    'PER-SCHED-18',
    'PER-SCHED-19',
    'PER-SCHED-20',
    'PER-SCHED-21',
    'PER-SCHED-22',
  ]

  it('governs the twenty-two operations L99229 enumerates, in its order', () => {
    // L99229 states "Twenty-two operations are governed" and enumerates 22.
    // The stated count and the enumeration agree; both are asserted.
    expect(ENUMERATED).toHaveLength(22)
    expect(SCHEDULE_OPERATIONS.map(([id]) => id)).toEqual(ENUMERATED)
    expect(MATRIX_A.rows.map((r) => r.id)).toEqual(ENUMERATED)
    expect(MATRIX_B.rows.map((r) => r.id)).toEqual(ENUMERATED)
  })

  it('keeps both wordings where L99229 and the matrix rows disagree', () => {
    // Nine of twenty-two differ. This is the one whose fuller form a reader
    // would otherwise never see.
    expect(scheduleRow(MATRIX_A, 'PER-SCHED-02').operation).toBe('view occurrences and receipts')
    expect(scheduleRow(MATRIX_B, 'PER-SCHED-02').operation).toBe('view occurrences and receipts')
    expect(operationEnumeratedAs('PER-SCHED-02')).toBe(
      'view occurrence history and effect receipts',
    )
  })

  it('has 9 actor columns and 198 cells in Matrix A, 5 and 110 in Matrix B', () => {
    // The column count is asserted alongside the completeness check because
    // `missingCells` is empty for an empty column list.
    expect(MATRIX_A.columns).toHaveLength(9)
    expect(MATRIX_B.columns).toHaveLength(5)
    expect(MATRIX_A.rows.length * MATRIX_A.columns.length).toBe(198)
    expect(MATRIX_B.rows.length * MATRIX_B.columns.length).toBe(110)
    for (const matrix of [MATRIX_A, MATRIX_B]) {
      for (const row of matrix.rows) {
        expect(missingCells(row, matrix.columns)).toEqual([])
      }
    }
  })

  it('splits Matrix A into 4 platform role columns and 5 non-human identity columns', () => {
    expect(MATRIX_A.columns.map(columnClass)).toEqual([
      'PLATFORM',
      'PLATFORM',
      'PLATFORM',
      'PLATFORM',
      'NON_HUMAN',
      'NON_HUMAN',
      'NON_HUMAN',
      'NON_HUMAN',
      'NON_HUMAN',
    ])
    expect(MATRIX_B.columns.map(columnClass)).toEqual([
      'TENANT',
      'TENANT',
      'TENANT',
      'TENANT',
      'TENANT',
    ])
  })

  it('tallies the tokens the source actually carries', () => {
    expect(outcomeTally(MATRIX_A)).toEqual({
      explicitlyProhibited: 123,
      allowedWithConditions: 41,
      allowed: 30,
      readOnly: 2,
      notApplicable: 2,
    })
    expect(outcomeTally(MATRIX_B)).toEqual({
      explicitlyProhibited: 58,
      unavailable: 43,
      allowedWithConditions: 8,
      readOnly: 1,
    })
  })

  it('reads the Integration identity column as 2 Not applicable and 20 prohibitions', () => {
    // The common brief's pre-verification says this column is entirely `Not
    // applicable`. It is not: only L99235 and L99236 are.
    const integration = column(MATRIX_A, 'Integration identity')
    const outcomes = MATRIX_A.rows.map((row) => cellFor(row, integration).outcome)
    expect(outcomes.filter((o) => o === 'notApplicable')).toHaveLength(2)
    expect(outcomes.filter((o) => o === 'explicitlyProhibited')).toHaveLength(20)
    const first = cellFor(scheduleRow(MATRIX_A, 'PER-SCHED-01'), integration)
    expect(first.detail).toBe('no integration schedule exists at V1')
    expect(cellFor(scheduleRow(MATRIX_A, 'PER-SCHED-02'), integration).outcome).toBe(
      'notApplicable',
    )
    expect(cellFor(scheduleRow(MATRIX_A, 'PER-SCHED-03'), integration).outcome).toBe(
      'explicitlyProhibited',
    )
  })

  it('carries every locator for the two identities its single header covers', () => {
    const integration = column(MATRIX_A, 'Integration identity')
    if (integration.kind !== 'identity') throw new Error('expected an identity column')
    // One header, two register rows, both opening "Integration identity, ".
    expect(integration.identitySourceRefs).toEqual(['L17884', 'L17885'])
    const controller = column(MATRIX_A, 'Scheduler Controller')
    if (controller.kind !== 'identity') throw new Error('expected an identity column')
    // Two spellings of one identity, in two chapters. Neither is dropped.
    expect(controller.identitySourceRefs).toEqual(['L17887', 'L98883'])
  })

  /**
   * THE PREFIX TRAP, PINNED AT THE MECHANISM THAT STOPS IT. `Allowed` is a
   * prefix of `Allowed with conditions`, and 49 of these 308 cells are the
   * longer token. What rejects the short match is the SEPARATOR REQUIREMENT,
   * not the order of the token table: a token must be followed by a separator
   * the source uses, or by the end of the cell. Both halves are asserted, on
   * the exact cell shapes these two matrices carry.
   */
  it('never reads a conditioned grant as an unconditional one', () => {
    expect(cellFromSource('Allowed with conditions, reason required')).toEqual({
      outcome: 'allowedWithConditions',
      detail: 'reason required',
    })
    expect(cellFromSource('Allowed')).toEqual({
      outcome: 'allowed',
      detail: 'Allowed, stated bare in the source',
    })
    // The separator requirement: a token followed by neither a separator nor
    // the end of the cell is not that token.
    expect(() => cellFromSource('Allowed with conditions and a comma')).toThrow(/nine source/)
    for (const matrix of [MATRIX_A, MATRIX_B]) {
      for (const row of matrix.rows) {
        for (const col of matrix.columns) {
          const cell = cellFor(row, col)
          if (cell.outcome !== 'allowedWithConditions') continue
          expect(cell.detail).not.toBe('Allowed with conditions, stated bare in the source')
          expect(cell.detail.startsWith('with conditions')).toBe(false)
        }
      }
    }
  })
})

describe('one entry point, and it cannot read the wrong matrix', () => {
  it('routes a column to the matrix its own security domain names', () => {
    expect(matrixFor(column(MATRIX_B, 'Tenant Admin'))).toBe(MATRIX_B)
    expect(matrixFor(column(MATRIX_A, 'Support'))).toBe(MATRIX_A)
    expect(matrixFor(column(MATRIX_A, 'Scheduler Controller'))).toBe(MATRIX_A)
    expect(() =>
      matrixFor({
        kind: 'aggregate',
        header: 'Any tenant role',
        members: ['TENANT_ADMIN'],
        sourceRef: 'L45653',
      }),
    ).toThrow(/aggregate/)
  })

  it('answers a platform role from Matrix A and a tenant role from Matrix B', () => {
    // L99235: Support is `Read-only` on view definition.
    const support = scheduleDecision('PER-SCHED-01', column(MATRIX_A, 'Support'), platformLive('SUPPORT'))
    expect(support.outcome).toBe('readOnly')
    // L99262: every tenant role reads `Unavailable` on the same operation.
    const admin = scheduleDecision('PER-SCHED-01', column(MATRIX_B, 'Tenant Admin'), tenantLive('TENANT_ADMIN'))
    expect(admin.outcome).toBe('unavailable')
    expect(admin.reasonCode).toBe('MATRIX_STATES_UNAVAILABLE')
  })

  it('keeps a conditioned grant conditioned once the live evaluation passes', () => {
    // L99283, the Tenant Admin cell, verbatim.
    const decision = scheduleDecision(
      'PER-SCHED-22',
      column(MATRIX_B, 'Tenant Admin'),
      tenantLive('TENANT_ADMIN'),
    )
    expect(decision.outcome).toBe('allowedWithConditions')
    expect(decision.conditionToEnable).toBe('within registry bounds, in the tenant administration area')
  })

  it('answers a non-human identity from its own declared grant and refuses a session', () => {
    const worker = column(MATRIX_A, 'Scheduled Execution Worker')
    const decision = scheduleDecision('PER-SCHED-01', worker, null)
    expect(decision.outcome).toBe('allowedWithConditions')
    expect(decision.explanation).toBe('claimed definitions only')
    expect(decision.sourceRefs).toContain('L17888')
    // Rule two: a scheduled run must not reuse a human session.
    expect(() => scheduleDecision('PER-SCHED-01', worker, platformLive('ADMIN'))).toThrow(
      /non-human identity/,
    )
    // And the mirror: a role column answered from the matrix alone.
    expect(() => scheduleDecision('PER-SCHED-01', column(MATRIX_A, 'Support'), null)).toThrow(
      /needs a live evaluation/,
    )
  })
})

describe('Matrix B holds eight conditional grants, and they are on this surface', () => {
  /** Transcribed from the rows, not derived from the constant under test. */
  const EIGHT: readonly (readonly [ScheduleOperationId, RoleId, string])[] = [
    ['PER-SCHED-10', 'TENANT_ADMIN', 'L99271'],
    ['PER-SCHED-10', 'QUALITY_MANAGER', 'L99271'],
    ['PER-SCHED-11', 'TENANT_ADMIN', 'L99272'],
    ['PER-SCHED-13', 'TENANT_ADMIN', 'L99274'],
    ['PER-SCHED-13', 'QUALITY_MANAGER', 'L99274'],
    ['PER-SCHED-22', 'TENANT_ADMIN', 'L99283'],
    ['PER-SCHED-22', 'SUPERVISOR', 'L99283'],
    ['PER-SCHED-22', 'QUALITY_MANAGER', 'L99283'],
  ]

  it('finds exactly those eight, on four rows, across three roles', () => {
    expect(EIGHT).toHaveLength(8)
    expect(TENANT_TIMING_GRANTS.map((g) => [g.operation, g.role, g.sourceRef])).toEqual(
      EIGHT.map((e) => [...e]),
    )
    const byRole = (role: RoleId) => TENANT_TIMING_GRANTS.filter((g) => g.role === role).length
    expect([byRole('TENANT_ADMIN'), byRole('SUPERVISOR'), byRole('QUALITY_MANAGER')]).toEqual([
      4, 1, 3,
    ])
    expect(byRole('READONLY_AUDITOR') + byRole('WORKER')).toBe(0)
  })

  it('carries each cell’s own stated condition verbatim', () => {
    const conditions = TENANT_TIMING_GRANTS.map((g) => g.condition)
    expect(conditions).toContain(
      'only for tenant-owned settings such as digest delivery times and report schedules',
    )
    expect(conditions).toContain('only the run-extension act within the tenant cap')
    expect(conditions).toContain('within registry bounds, in the tenant administration area')
    for (const condition of conditions) expect(condition.trim()).not.toBe('')
  })

  it('states the same-surface reading and names no other surface', () => {
    const { statement, whyNotAllRefusals, sourceRefs } = TENANT_TIMING_IS_SAME_SURFACE
    expect(statement).toContain('tenant administration area')
    expect(statement).toContain('on this surface')
    // Not a cross-surface statement: no other surface is named anywhere in it.
    for (const elsewhere of [
      'Command Center',
      'Standards and Operations Studio',
      'Frontline',
      'Super Admin',
      'SURF-',
    ]) {
      expect(statement).not.toContain(elsewhere)
      expect(whyNotAllRefusals).not.toContain(elsewhere)
    }
    // The clause that licenses the eight. Dropped, this matrix is 110
    // refusals, and every one of the eight assertions above would be wrong.
    expect(whyNotAllRefusals).toContain(
      "What they hold is authority over the tenant's own timing settings and visibility of the resulting business outcomes.",
    )
    expect(sourceRefs).toEqual(['L99201', 'L99258', 'L99283'])
  })
})

describe('audit attribution, for all three column kinds', () => {
  it('pairs every column of both matrices with its attribution', () => {
    expect(MATRIX_A.columns.map(columnAttribution)).toEqual([
      'SESSION_IDENTITY',
      'SESSION_IDENTITY',
      'SESSION_IDENTITY',
      'SESSION_IDENTITY',
      'THE_NAMED_IDENTITY',
      'THE_NAMED_IDENTITY',
      'THE_NAMED_IDENTITY',
      'THE_NAMED_IDENTITY',
      'THE_NAMED_IDENTITY',
    ])
    expect(MATRIX_B.columns.map(columnAttribution)).toEqual(
      MATRIX_B.columns.map(() => 'SESSION_IDENTITY'),
    )
  })

  it('names the session identity as actor and the role as authority', () => {
    expect(
      scheduleAttribution(column(MATRIX_B, 'Quality Manager'), tenantLive('QUALITY_MANAGER'), null),
    ).toEqual({ actor: 'person-omar', authority: 'Quality Manager' })
  })

  it('names the identity as actor and the human decision as authority', () => {
    expect(
      scheduleAttribution(column(MATRIX_A, 'Scheduler Controller'), null, 'DEF-42 approved by Noah'),
    ).toEqual({ actor: 'Scheduler Controller', authority: 'DEF-42 approved by Noah' })
    // No human decided, so there is no human authority to record. Null, never
    // the identity written twice.
    expect(scheduleAttribution(column(MATRIX_A, 'Data-pipeline identity'), null, null)).toEqual({
      actor: 'Data-pipeline identity',
      authority: null,
    })
  })

  it('refuses the three conflations rule two forbids', () => {
    const role = column(MATRIX_B, 'Tenant Admin')
    // A second authority beside the role.
    expect(() => scheduleAttribution(role, tenantLive('TENANT_ADMIN'), 'a human decision')).toThrow(
      /authority is the role/,
    )
    // A role row with no actor to name.
    const noActor: LiveEvaluation = {
      req: { action: 'SCHEDULE_OP', sourceRefs: ['L99283'] },
      ctx: ctx({ identity: identity({ role: 'TENANT_ADMIN' }), actorOfRecord: null }),
    }
    expect(() => scheduleAttribution(role, noActor, null)).toThrow(/no actor of record/)
    // A non-human identity attributed to a human session.
    expect(() =>
      scheduleAttribution(column(MATRIX_A, 'Scheduler Controller'), platformLive('ADMIN'), null),
    ).toThrow(/human session/)
    // An aggregate names a set, not an actor. Neither matrix has one.
    expect(() =>
      scheduleAttribution(
        { kind: 'aggregate', header: 'Any tenant role', members: ['TENANT_ADMIN'], sourceRef: 'L45653' },
        null,
        null,
      ),
    ).toThrow(/not an actor/)
  })
})

describe('the audit read scope is a selector, not a render', () => {
  const refs: readonly ScheduleAuditReference[] = [
    { eventId: 'EV-1', operation: 'PER-SCHED-13', resourceTenant: BRIGHT, sourceRef: 'L99274' },
    { eventId: 'EV-2', operation: 'PER-SCHED-18', resourceTenant: BRIGHT, sourceRef: 'L99279' },
    // The one AC-30D-105 exists for: an event referencing another tenant's
    // object. Nothing on the reader's own screen distinguishes it.
    { eventId: 'EV-3', operation: 'PER-SCHED-13', resourceTenant: OTHER, sourceRef: 'L99274' },
  ]

  it('gives the Read-only Auditor its own tenant’s rows and drops the other tenant’s', () => {
    const kept = readableScheduleAudit(refs, column(MATRIX_B, 'Read-only Auditor'), tenantLive('READONLY_AUDITOR'))
    // Positive control first: an empty result would satisfy the drop on its own.
    expect(kept.map((r) => r.eventId)).toEqual(['EV-1', 'EV-2'])
  })

  it('licenses the read from the Read-only Auditor’s own cell, L99263', () => {
    const auditor = column(MATRIX_B, 'Read-only Auditor')
    const licence = scheduleDecision('PER-SCHED-02', auditor, tenantLive('READONLY_AUDITOR'))
    expect(licence.outcome).toBe('readOnly')
    expect(licence.explanation).toBe('through the tenant audit log only')
    expect(permitsRead(licence)).toBe(true)
  })

  it('gives no rows at all to a tenant role whose cell permits no read', () => {
    // L99263 grants the Read-only Auditor alone. The Tenant Admin's cell on
    // that row is `Unavailable`, so the occurrence log is not theirs to read.
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'WORKER'] as const) {
      const header = { TENANT_ADMIN: 'Tenant Admin', SUPERVISOR: 'Supervisor', QUALITY_MANAGER: 'Quality Manager', WORKER: 'Worker' }[role]
      expect(readableScheduleAudit(refs, column(MATRIX_B, header), tenantLive(role))).toEqual([])
    }
  })

  it('refuses to answer for a column that has no audit-reading screen', () => {
    expect(() =>
      readableScheduleAudit(refs, column(MATRIX_A, 'Scheduler Controller'), tenantLive('READONLY_AUDITOR')),
    ).toThrow(/no audit-reading screen/)
  })

  it('drops a row referencing a tenant this state has never heard of', () => {
    const unknown: readonly ScheduleAuditReference[] = [
      { eventId: 'EV-9', operation: 'PER-SCHED-13', resourceTenant: tenantId('TEN-GHOST'), sourceRef: 'L99274' },
    ]
    expect(
      readableScheduleAudit(unknown, column(MATRIX_B, 'Read-only Auditor'), tenantLive('READONLY_AUDITOR')),
    ).toEqual([])
  })
})

describe('the outcome union covers both matrices', () => {
  it('uses only tokens the nine-member union already carries', () => {
    const used = new Set<PermissionOutcome>()
    for (const matrix of [MATRIX_A, MATRIX_B]) {
      for (const row of matrix.rows) {
        for (const col of matrix.columns) used.add(cellFor(row, col).outcome)
      }
    }
    expect([...used].sort()).toEqual([
      'allowed',
      'allowedWithConditions',
      'explicitlyProhibited',
      'notApplicable',
      'readOnly',
      'unavailable',
    ])
  })
})

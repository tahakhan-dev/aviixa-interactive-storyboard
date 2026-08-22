import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import { rolesInDomain, type RoleId } from '@/domain/roles'
import { REASON_CODES, permitsAction, type PermissionOutcome } from '@/policy/decision'
import type { AccessContext } from '@/policy/evaluate'
import {
  aggregateResolvesTo,
  cellFor,
  cellFromSource,
  columnAttribution,
  columnClass,
  columnKey,
  evaluateColumnAccess,
  missingCells,
  rolesPermitting,
  type AggregateColumn,
  type ColumnMatrixRow,
  type IdentityColumn,
  type MatrixColumn,
  type RoleColumn,
} from '@/policy/columns'

/**
 * The three matrices of slice 10 whose columns are not tenant roles, measured
 * on the frozen source rather than taken from the brief. Every locator below
 * was opened and the whole line read.
 *
 * 45A.7 Matrix A     header L99233  10 columns (1 operation + 9 actors, 5 non-human)  22 rows L99235-L99256
 * 45A.7 Matrix B     header L99260   6 columns (1 operation + 5 tenant roles)         22 rows L99262-L99283
 * `MOD-SA-18`        header L46160   7 columns (1 action + 6 mixed actors)             8 rows L46162-L46169
 * `MOD-SA-14`        header L45653   6 columns (1 action + 4 platform + 1 aggregate)   7 rows L45655-L45661
 */

const RUN = scenarioRunId('RUN-SLICE10-COLUMNS')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')

function activeTenantState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function identity(over: Partial<IdentitySimulationState> = {}): IdentitySimulationState {
  return {
    signedIn: true,
    role: 'TENANT_ADMIN',
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
    state: activeTenantState(),
    identity: identity(),
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'person-1',
    ...over,
  }
}

const live = (role: RoleId) => ({
  req: { action: 'PER_SCHED_22', sourceRefs: ['L99283'] },
  ctx: ctx({ identity: identity({ role }) }),
})

// --- the columns, as the source's headers name them -------------------------

const TENANT_ADMIN: RoleColumn = { kind: 'role', header: 'Tenant Admin', role: 'TENANT_ADMIN' }
const SUPERVISOR: RoleColumn = { kind: 'role', header: 'Supervisor', role: 'SUPERVISOR' }
const QUALITY_MANAGER: RoleColumn = {
  kind: 'role',
  header: 'Quality Manager',
  role: 'QUALITY_MANAGER',
}
const AUDITOR: RoleColumn = {
  kind: 'role',
  header: 'Read-only Auditor',
  role: 'READONLY_AUDITOR',
}
const WORKER: RoleColumn = { kind: 'role', header: 'Worker', role: 'WORKER' }
const ADMIN: RoleColumn = { kind: 'role', header: 'Admin', role: 'ADMIN' }

/** L99233 column six; the identity itself is defined at L98885 and L17888. */
const SCHED_WORKER: IdentityColumn = {
  kind: 'identity',
  header: 'Scheduled Execution Worker',
  identitySourceRefs: ['L98885', 'L17888'],
}

/** L99233 column ten. Its header covers TWO register rows: L17884 and L17885. */
const INTEGRATION: IdentityColumn = {
  kind: 'identity',
  header: 'Integration identity',
  identitySourceRefs: ['L17884', 'L17885'],
}

/** `MOD-SA-14` column six, L45653. */
const ANY_TENANT_ROLE: AggregateColumn = {
  kind: 'aggregate',
  header: 'Any tenant role',
  members: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
  sourceRef: 'L45653',
}

const MATRIX_B_COLUMNS: readonly MatrixColumn[] = [
  TENANT_ADMIN,
  SUPERVISOR,
  QUALITY_MANAGER,
  AUDITOR,
  WORKER,
]

/**
 * `PER-SCHED-22` edit tenant-owned timing settings, Matrix B row 22, L99283.
 * Transcribed through `cellFromSource` so the token rule is exercised on real
 * source text rather than on outcomes hand-written to agree with it.
 */
const PER_SCHED_22: ColumnMatrixRow = {
  id: 'PER-SCHED-22',
  operation: '`PER-SCHED-22` edit tenant-owned timing settings',
  sourceRef: 'L99283',
  cells: {
    'role:TENANT_ADMIN': cellFromSource(
      'Allowed with conditions, within registry bounds, in the tenant administration area',
    ),
    'role:SUPERVISOR': cellFromSource(
      'Allowed with conditions, only the run-extension act within the tenant cap',
    ),
    'role:QUALITY_MANAGER': cellFromSource(
      'Allowed with conditions, only report formats and review-related settings the role owns',
    ),
    'role:READONLY_AUDITOR': cellFromSource('Explicitly prohibited'),
    'role:WORKER': cellFromSource('Explicitly prohibited'),
  },
}

/** `PER-SCHED-02` view occurrences and receipts, Matrix B row 2, L99263. */
const PER_SCHED_02_B: ColumnMatrixRow = {
  id: 'PER-SCHED-02',
  operation: '`PER-SCHED-02` view occurrences and receipts',
  sourceRef: 'L99263',
  cells: {
    'role:TENANT_ADMIN': cellFromSource('Unavailable'),
    'role:SUPERVISOR': cellFromSource('Unavailable'),
    'role:QUALITY_MANAGER': cellFromSource('Unavailable'),
    'role:READONLY_AUDITOR': cellFromSource('Read-only, through the tenant audit log only'),
    'role:WORKER': cellFromSource('Unavailable'),
  },
}

/** `PER-SCHED-01` view definition, Matrix A row 1, L99235 — the two identities. */
const PER_SCHED_01_A: ColumnMatrixRow = {
  id: 'PER-SCHED-01',
  operation: '`PER-SCHED-01` view definition',
  sourceRef: 'L99235',
  cells: {
    'role:ADMIN': cellFromSource('Allowed'),
    'identity:Scheduled Execution Worker': cellFromSource(
      'Allowed with conditions, claimed definitions only',
    ),
    'identity:Integration identity': cellFromSource(
      'Not applicable — no integration schedule exists at V1',
    ),
  },
}

/**
 * `MOD-SA-14` row 5, L45659 — the aggregate cell whose stated condition names
 * fewer roles than its own header does.
 */
const SA_14_AUTHOR_TENANT_NOTIFICATION: ColumnMatrixRow = {
  id: 'MOD-SA-14-05',
  operation: 'Author or override a tenant-internal notification',
  sourceRef: 'L45659',
  cells: {
    'role:ADMIN': cellFromSource('Explicitly prohibited'),
    'aggregate:Any tenant role': {
      ...cellFromSource(
        'Allowed with conditions — the Tenant Admin configures tenant notification ' +
          'preferences within the mandatory baseline',
      ),
      narrowsTo: ['TENANT_ADMIN'],
    },
  },
}

describe('the matrix column type', () => {
  it('keys a column on a role, a named non-human identity, or an aggregate', () => {
    expect(columnKey(TENANT_ADMIN)).toBe('role:TENANT_ADMIN')
    expect(columnKey(SCHED_WORKER)).toBe('identity:Scheduled Execution Worker')
    expect(columnKey(ANY_TENANT_ROLE)).toBe('aggregate:Any tenant role')
  })

  it('prefixes the key so an identity cannot collide with a role of the same name', () => {
    const impostor: IdentityColumn = {
      kind: 'identity',
      header: 'WORKER',
      identitySourceRefs: ['L17888'],
    }
    expect(columnKey(impostor)).not.toBe(columnKey(WORKER))
  })

  it('reads the tenant/platform split from the role registry, not a second list', () => {
    expect(columnClass(TENANT_ADMIN)).toBe('TENANT')
    expect(columnClass(ADMIN)).toBe('PLATFORM')
    expect(columnClass(SCHED_WORKER)).toBe('NON_HUMAN')
    expect(columnClass(ANY_TENANT_ROLE)).toBe('AGGREGATE')
  })

  it('covers Matrix B with exactly the five registry tenant roles', () => {
    const fromRegistry = rolesInDomain('TENANT').map((r) => r.id)
    expect(fromRegistry).toHaveLength(5)
    expect(
      MATRIX_B_COLUMNS.filter((c): c is RoleColumn => c.kind === 'role').map((c) => c.role),
    ).toEqual(fromRegistry)
  })
})

describe('what may and may not be attributed — L99197', () => {
  it('never attributes an audit row to a role: the session identity is the actor', () => {
    expect(columnAttribution(TENANT_ADMIN)).toBe('SESSION_IDENTITY')
    expect(columnAttribution(ADMIN)).toBe('SESSION_IDENTITY')
  })

  it('attributes a non-human column to the identity itself', () => {
    expect(columnAttribution(SCHED_WORKER)).toBe('THE_NAMED_IDENTITY')
    expect(columnAttribution(INTEGRATION)).toBe('THE_NAMED_IDENTITY')
  })

  it('attributes an aggregate column to nothing at all', () => {
    expect(columnAttribution(ANY_TENANT_ROLE)).toBe('NOT_ATTRIBUTABLE')
  })

  it('gives no two column kinds the same attribution', () => {
    const all = [TENANT_ADMIN, SCHED_WORKER, ANY_TENANT_ROLE].map(columnAttribution)
    expect(new Set(all).size).toBe(all.length)
  })

  it('refuses to evaluate an aggregate column at all', () => {
    expect(() =>
      evaluateColumnAccess(SA_14_AUTHOR_TENANT_NOTIFICATION, ANY_TENANT_ROLE, null, []),
    ).toThrow(/aggregate/)
  })

  it('resolves an aggregate to the cell narrowing, not the header, where they disagree', () => {
    const cell = cellFor(SA_14_AUTHOR_TENANT_NOTIFICATION, ANY_TENANT_ROLE)
    expect(ANY_TENANT_ROLE.members).toHaveLength(5)
    expect(aggregateResolvesTo(ANY_TENANT_ROLE, cell)).toEqual(['TENANT_ADMIN'])
    // And with no narrowing it is the header's own membership.
    expect(aggregateResolvesTo(ANY_TENANT_ROLE, { outcome: 'allowed', detail: 'x' })).toEqual(
      ANY_TENANT_ROLE.members,
    )
  })

  it('refuses to answer a non-human column from a human session', () => {
    expect(() =>
      evaluateColumnAccess(PER_SCHED_01_A, SCHED_WORKER, live('ADMIN'), []),
    ).toThrow(/human session/)
  })

  it('answers a non-human column from its own declared authority', () => {
    const d = evaluateColumnAccess(PER_SCHED_01_A, SCHED_WORKER, null, [])
    expect(d.outcome).toBe('allowedWithConditions')
    expect(d.conditionToEnable).toBe('claimed definitions only')
    // The identity's own definition locators travel with the decision, so an
    // audit row can be found by either spelling the source uses.
    expect(d.sourceRefs).toEqual(['L99235', 'L98885', 'L17888'])
  })

  it('fails closed on a role column answered from the matrix alone', () => {
    expect(() => evaluateColumnAccess(PER_SCHED_22, TENANT_ADMIN, null, MATRIX_B_COLUMNS)).toThrow(
      /needs a live evaluation/,
    )
  })
})

describe('the evaluator, layered on evaluateAccess and never forking it', () => {
  it('takes the role list from the row, so no caller can hand-write one', () => {
    // Matrix B row 22, L99283: three tenant roles are conditionally allowed
    // and two are explicitly prohibited.
    expect(rolesPermitting(PER_SCHED_22, MATRIX_B_COLUMNS)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
    ])
    // Row 2, L99263: the Auditor's `Read-only` is not an action grant.
    expect(rolesPermitting(PER_SCHED_02_B, MATRIX_B_COLUMNS)).toEqual([])
  })

  it('returns the cell condition rather than a bare allow when the live check passes', () => {
    const d = evaluateColumnAccess(
      PER_SCHED_22,
      TENANT_ADMIN,
      live('TENANT_ADMIN'),
      MATRIX_B_COLUMNS,
    )
    expect(d.outcome).toBe('allowedWithConditions')
    expect(d.conditionToEnable).toBe('within registry bounds, in the tenant administration area')
  })

  it('lets the live evaluation refuse a cell the matrix permits', () => {
    const suspended = withTenant(activeTenantState(), BRIGHT, (p) => ({
      ...p,
      lifecycleState: 'HARD_SUSPENDED' as const,
    }))
    const d = evaluateColumnAccess(
      PER_SCHED_22,
      TENANT_ADMIN,
      { req: { action: 'PER_SCHED_22', sourceRefs: ['L99283'] }, ctx: ctx({ state: suspended }) },
      MATRIX_B_COLUMNS,
    )
    expect(d.outcome).toBe('unavailable')
    expect(d.reasonCode).toBe('TENANT_SUSPENDED')
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
  })

  it('answers a non-permitting cell in the cell’s own words and never asks the live check', () => {
    // L99283 prohibits the Auditor. `evaluateAccess` would refuse it too, but
    // with ROLE_NOT_GRANTED — a reason the source did not state over a refusal
    // it did.
    const d = evaluateColumnAccess(PER_SCHED_22, AUDITOR, live('READONLY_AUDITOR'), MATRIX_B_COLUMNS)
    expect(d.outcome).toBe('explicitlyProhibited')
    expect(d.reasonCode).toBe('EXPLICIT_DENY')
    expect(d.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })

  it('reports a bare `Unavailable` as the matrix stating it, naming no cause the source did not', () => {
    const d = evaluateColumnAccess(
      PER_SCHED_02_B,
      SUPERVISOR,
      live('SUPERVISOR'),
      MATRIX_B_COLUMNS,
    )
    expect(d.outcome).toBe('unavailable')
    expect(d.reasonCode).toBe('MATRIX_STATES_UNAVAILABLE')
    expect(REASON_CODES.MATRIX_STATES_UNAVAILABLE).toMatch(/permission matrix/)
  })

  it('renders `Read-only` on an action row as no action grant', () => {
    const d = evaluateColumnAccess(PER_SCHED_02_B, AUDITOR, live('READONLY_AUDITOR'), MATRIX_B_COLUMNS)
    expect(d.outcome).toBe('readOnly')
    expect(permitsAction(d)).toBe(false)
    expect(d.explanation).toBe('through the tenant audit log only')
  })

  it('carries `Not applicable` with its required stated reason', () => {
    const d = evaluateColumnAccess(PER_SCHED_01_A, INTEGRATION, null, [])
    expect(d.outcome).toBe('notApplicable')
    expect(d).toHaveProperty('notApplicableReason', 'no integration schedule exists at V1')
  })

  it('carries the two outcomes first exercised in this slice, which no route here renders', () => {
    // `cachedReadOnlyOffline` L100427 and `queuedOffline` L73774. Wave 2's
    // `MOD-DOH-10` route is the caller that will render them; this evaluator
    // only has to carry them without collapsing either into `unavailable`.
    const row: ColumnMatrixRow = {
      id: 'X-OFFLINE',
      operation: 'Displays occurrence state',
      sourceRef: 'L100427',
      cells: {
        'identity:Scheduled Execution Worker': cellFromSource(
          'Cached read-only while offline — consequences only',
        ),
        'identity:Integration identity': cellFromSource('Queued while offline'),
      },
    }
    const cached = evaluateColumnAccess(row, SCHED_WORKER, null, [])
    expect(cached.outcome).toBe('cachedReadOnlyOffline')
    expect(permitsAction(cached)).toBe(false)
    const queued = evaluateColumnAccess(row, INTEGRATION, null, [])
    expect(queued.outcome).toBe('queuedOffline')
    expect(permitsAction(queued)).toBe(true)
  })
})

describe('a blank cell is prohibited — L10238', () => {
  it('throws on a missing cell rather than defaulting one', () => {
    expect(() => cellFor(PER_SCHED_02_B, ADMIN)).toThrow(/no cell for role:ADMIN/)
  })

  it('throws on a blank detail', () => {
    const row: ColumnMatrixRow = {
      id: 'X-BLANK',
      operation: 'x',
      sourceRef: 'L10238',
      cells: { 'role:WORKER': { outcome: 'allowed', detail: '   ' } },
    }
    expect(() => cellFor(row, WORKER)).toThrow(/blank detail/)
  })

  it('names the columns a row has no cell for', () => {
    expect(missingCells(PER_SCHED_22, MATRIX_B_COLUMNS)).toEqual([])
    expect(missingCells(PER_SCHED_22, [...MATRIX_B_COLUMNS, ADMIN])).toEqual(['role:ADMIN'])
  })
})

describe('the source token rule — `Allowed` is a prefix of `Allowed with conditions`', () => {
  it('reads a conditioned grant as conditioned, not as an unconditional one', () => {
    expect(cellFromSource('Allowed with conditions, own definitions only')).toEqual({
      outcome: 'allowedWithConditions',
      detail: 'own definitions only',
    })
    expect(cellFromSource('Allowed')).toEqual({
      outcome: 'allowed',
      detail: 'Allowed, stated bare in the source',
    })
  })

  it('reads all three separator forms these matrices actually use', () => {
    // Comma (L99263), em dash (L46163), and the bare token (L99237, L99262).
    expect(cellFromSource('Read-only, through the tenant audit log only').outcome).toBe('readOnly')
    expect(cellFromSource('Allowed — in the Delivery Operations Hub')).toEqual({
      outcome: 'allowed',
      detail: 'in the Delivery Operations Hub',
    })
    expect(cellFromSource('Explicitly prohibited').outcome).toBe('explicitlyProhibited')
    expect(cellFromSource('Unavailable').outcome).toBe('unavailable')
  })

  it('strips the source’s own backticks, which some cells carry and some do not', () => {
    expect(cellFromSource('`Allowed with conditions` — content-related only').outcome).toBe(
      'allowedWithConditions',
    )
  })

  it('refuses `Not applicable` with no stated reason', () => {
    expect(() => cellFromSource('Not applicable')).toThrow(/no stated reason/)
    expect(cellFromSource('Not applicable — tenant scope only').outcome).toBe('notApplicable')
  })

  it('throws rather than guessing on text that is not one of the nine tokens', () => {
    expect(() => cellFromSource('Allowedish')).toThrow(/not one of the nine source tokens/)
    expect(() => cellFromSource('Permitted')).toThrow(/not one of the nine source tokens/)
  })

  it('reads all nine tokens of the closed set at L10238', () => {
    const nine: readonly [string, PermissionOutcome][] = [
      ['Allowed', 'allowed'],
      ['Allowed with conditions, x', 'allowedWithConditions'],
      ['Read-only', 'readOnly'],
      ['Cached read-only while offline', 'cachedReadOnlyOffline'],
      ['Queued while offline', 'queuedOffline'],
      ['Unavailable', 'unavailable'],
      ['Explicitly prohibited', 'explicitlyProhibited'],
      ['Client Decision Required', 'clientDecisionRequired'],
      ['Not applicable — x', 'notApplicable'],
    ]
    expect(new Set(nine.map(([, o]) => o)).size).toBe(9)
    for (const [text, outcome] of nine) {
      expect(cellFromSource(text).outcome, text).toBe(outcome)
    }
  })
})

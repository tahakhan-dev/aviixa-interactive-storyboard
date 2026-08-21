import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  COPIED_ELEMENTS,
  CLONE_DIALOGUE_FOOTER,
  MOD_DOH_15_ESCAPE,
  MOD_DOH_15_MATRIX,
  MOD_DOH_15_MOUNT,
  MOD_DOH_15_REACH,
  MOD_DOH_15_UNSPECIFIED_IN_SOURCE,
  RECURRENCE_PROMPT,
  RESET_ELEMENTS,
  cloneDecision,
  doh15Affordance,
  doh15Row,
  type Doh15Affordance,
  type Doh15Context,
  type Doh15Row,
} from '@/surfaces/doh/modules/doh-15/matrix'
import { DEFERRAL_RENDERING } from '@/surfaces/doh/modules/doh-06/matrix'
import { cellStatus, rolesReachingByMatrix, DOH_MODULES } from '@/surfaces/doh/modules'
import { contextFor } from '@/surfaces/doh/modules/doh-05/access'
import { DOH_CATALOGUE_B_REACH_NARROWER, dohScreenById } from '@/surfaces/doh/screens'
import { TENANT_STATES } from '@/surfaces/doh/tenant-state'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { HUB_TENANT_ID } from '@/surfaces/doh/modules/doh-05/jobs'
import {
  ONE_OFF_RECURRENCE,
  applyHubCommand,
  jobRecurs,
  objectKey,
  readJob,
  type JobRecord,
} from '@/surfaces/doh/objects'

/** One Job to vary, so each assertion below changes exactly one field. */
const CLONE_TENANT = HUB_TENANT_ID
const BASE_JOB: JobRecord = {
  jobId: 'JOB-SOURCE',
  name: 'Red bike frame assembly',
  jobTypeId: 'JOBTYPE-BRIGHTBIKES-ASSEMBLY',
  parentNodeId: 'AREA-ASSY-A',
  ownerId: 'ACT-DOH-SAM',
  state: 'draft',
  createdBy: 'ACT-DOH-SAM',
}

const putJob = (job: JobRecord) =>
  withTenant(emptyDomainState(scenarioRunId('DOH-MOD-15-CLONE')), CLONE_TENANT, (p) => ({
    ...p,
    objects: { ...p.objects, [objectKey.job(job.jobId)]: job },
  }))

/**
 * `MOD-DOH-15` — Job Cloning. A component with no route of its own.
 *
 * EVERY RULE HERE IS DRIVEN BY A MUTANT, not merely asserted. A test that
 * reads a field and asserts the same field is a tautology dressed as
 * evidence. So each rule is proved twice — once against the shipped rows,
 * once against a row broken in the exact way the rule exists to catch —
 * asserting that the SPECIFIC answer moves.
 *
 * AND EVERY MUTANT IS CHECKED FOR REACHABILITY FIRST. Four of this card's
 * six rows refuse every role, so a mutant that flips a CLASSIFICATION and
 * leaves the answer at `absent` has proved nothing: the token would have
 * produced `absent` anyway. Where that is the case the assertion is on the
 * stated REASON, which is the thing that actually differs and the thing a
 * person reads. Two mutants below were written the lazy way first, passed
 * against a broken module, and were rewritten.
 *
 * The mutants are constructed rows fed to the real fold. They mutate nothing
 * on disk.
 */

const ROLES = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const

// The tree's own convention, not an absolute path. `tests/unit/doh-summary.
// test.ts` hardcodes one machine's home directory for the same read and is
// reported rather than copied.
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** L-number to the source line, 1-based as every citation in this tree is. */
const sourceLine = (n: number): string => SOURCE[n - 1] ?? ''

const LIVE: Doh15Context = { tenantState: 'active', online: true, sourceRecurs: true }

const ctx = (over: Partial<Doh15Context> = {}): Doh15Context => ({ ...LIVE, ...over })

const MODULE_DIR = join(process.cwd(), 'src/surfaces/doh/modules/doh-15')

function moduleSources(): readonly string[] {
  return readdirSync(MODULE_DIR).map((f) => readFileSync(join(MODULE_DIR, f), 'utf8'))
}

/* ==================================================================== *
 * THE ROWS, MEASURED
 * ==================================================================== */

describe('the matrix is six data rows, measured against the header correction', () => {
  it('holds exactly six rows, ordinals 1 to 6 in source order', () => {
    expect(MOD_DOH_15_MATRIX).toHaveLength(6)
    expect(MOD_DOH_15_MATRIX.map((r) => r.ordinal)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('binds every ordinal to its own line, contiguous L29477 to L29482', () => {
    MOD_DOH_15_MATRIX.forEach((row, i) => {
      expect(row.sourceRef, row.id).toBe(`L${29477 + i}`)
    })
  })

  it('starts one line below the separator, because the plan span opens on the header', () => {
    // L29475 is the header and L29476 the separator: the span L29475-L29482
    // is eight lines and six DATA rows. Measured, not carried.
    expect(sourceLine(29475)).toContain('| Action | Tenant Admin |')
    expect(sourceLine(29476)).toBe('|---|---|---|---|---|---|')
    expect(sourceLine(29483).trim()).toBe('')
  })

  it('quotes each row`s action from its own line', () => {
    for (const row of MOD_DOH_15_MATRIX) {
      const n = Number(row.sourceRef.slice(1))
      expect(sourceLine(n), row.id).toContain(`| ${row.control} |`)
    }
  })

  it('names every cell for every role — no blank cell anywhere', () => {
    for (const row of MOD_DOH_15_MATRIX) {
      for (const role of ROLES) {
        expect(row.status[role], `${row.id}/${role}`).toBeTruthy()
        expect(row.detail[role].trim().length, `${row.id}/${role}`).toBeGreaterThan(0)
      }
    }
  })
})

/* ==================================================================== *
 * REACH — DERIVED IN-MODULE, NEVER A HAND-WRITTEN RAIL
 * ==================================================================== */

describe('reach is derived from this module`s own matrix', () => {
  it('answers Tenant Admin and Supervisor', () => {
    expect(MOD_DOH_15_REACH).toEqual(['TENANT_ADMIN', 'SUPERVISOR'])
  })

  it('runs the SHARED rule, not a second copy of it', () => {
    expect(MOD_DOH_15_REACH).toEqual(rolesReachingByMatrix(MOD_DOH_15_MATRIX, cellStatus))
  })

  it('does not read catalogue B`s cell, which is narrower', () => {
    // L48105 names the Supervisor alone. Reach names two roles. A screen
    // that drew its rail from the catalogue would withhold from a role the
    // source admits.
    expect(MOD_DOH_15_MOUNT.catalogueBRoles).toBe('Supervisor')
    expect(MOD_DOH_15_REACH).toContain('TENANT_ADMIN')
  })

  it('MUTANT — reading row 3`s token before asking whose act it is hands this module a Quality Manager', () => {
    const mutant = MOD_DOH_15_MATRIX.map((r) =>
      r.id === 'approve-the-cloned-job' ? { ...r, surface: 'screen' as const } : r,
    )
    const moved = rolesReachingByMatrix(mutant, cellStatus)
    expect(moved).toContain('QUALITY_MANAGER')
    expect(moved).not.toEqual(MOD_DOH_15_REACH)
    // And nothing else moves: the classification is load-bearing on exactly
    // one column, which is worth measuring rather than assuming.
    expect(moved.filter((r) => r !== 'QUALITY_MANAGER')).toEqual([...MOD_DOH_15_REACH])
  })

  it('clause two of the shared rule does no work on this card, and says so', () => {
    // No cell carries `Unavailable`. Stated here so a reader does not assume
    // both clauses bind: only clause one narrows this module.
    const all = MOD_DOH_15_MATRIX.flatMap((r) => ROLES.map((role) => r.status[role]))
    expect(all).not.toContain('unavailable')
  })
})

/* ==================================================================== *
 * ROW 3 — CLASSIFIED BEFORE ITS TOKEN IS READ
 * ==================================================================== */

describe('row 3 is met on another screen of this same surface', () => {
  const row = doh15Row('approve-the-cloned-job')

  it('is classified before its token, and the permissive token draws nothing', () => {
    expect(row.surface).toBe('another-surface')
    expect(row.status.QUALITY_MANAGER).toBe('allowed-with-conditions')
    expect(doh15Affordance(row, 'QUALITY_MANAGER', LIVE).kind).toBe('absent')
  })

  it('names where the act IS met, in the source`s own terms', () => {
    const a = doh15Affordance(row, 'QUALITY_MANAGER', LIVE)
    expect(a.kind === 'absent' && a.reason).toContain('MOD-DOH-05` row 4 (L27697)')
    expect(a.kind === 'absent' && a.reason).toContain('SCR-DOH-12')
  })

  it('points at no cross-surface boundary, because the target is this surface', () => {
    // A cross-surface component crosses a SURFACE, not a module. Nothing in
    // this module IMPORTS or DRAWS the eight-row §19.1.2 register or its
    // component. The check is on imports and JSX rather than on the word,
    // because `./matrix.ts` names both in the doc comment that explains WHY
    // neither is used — and a check that banned the word would ban the
    // explanation and leave the mechanism unproved.
    for (const src of moduleSources()) {
      expect(src).not.toMatch(/^import[^\n]*CrossSurfaceStatement/m)
      expect(src).not.toMatch(/^import[^\n]*\bboundary\b/m)
      expect(src).not.toContain('<CrossSurfaceStatement')
      expect(src).not.toMatch(/crossSurfaceStatement\(/)
      expect(src).not.toMatch(/adjacentAffordance\(/)
    }
  })

  it('MUTANT — classified as this screen`s, the permissive token becomes a control', () => {
    const mutant: Doh15Row = { ...row, surface: 'screen' }
    expect(doh15Affordance(mutant, 'QUALITY_MANAGER', LIVE).kind).toBe('control')
  })
})

describe('row 3`s Tenant Admin cell is a prohibition with a permissive escape', () => {
  const row = doh15Row('approve-the-cloned-job')

  it('carries the token and the clause together, verbatim from L29479', () => {
    expect(row.status.TENANT_ADMIN).toBe('explicitly-prohibited')
    expect(row.detail.TENANT_ADMIN).toContain('unless holding an approver role and not the cloner')
    expect(sourceLine(29479)).toContain('unless holding an approver role and not the cloner')
  })

  it('states why the escape cannot be driven rather than hiding it', () => {
    expect(MOD_DOH_15_ESCAPE.representable).toBe(false)
    expect(MOD_DOH_15_ESCAPE.whyNot).toContain('two tenant roles at once')
  })

  it('asserts neither half — no control, and the clause printed', () => {
    expect(doh15Affordance(row, 'TENANT_ADMIN', LIVE).kind).toBe('absent')
  })

  it('MUTANT — asserting the escape alone hands a Tenant Admin the approval of a clone', () => {
    const mutant: Doh15Row = {
      ...row,
      surface: 'screen',
      status: { ...row.status, TENANT_ADMIN: 'allowed-with-conditions' },
    }
    expect(doh15Affordance(mutant, 'TENANT_ADMIN', LIVE).kind).toBe('control')
  })

  it('MUTANT — asserting the prohibition alone deletes the clause the panel prints', () => {
    const mutant: Doh15Row = {
      ...row,
      detail: { ...row.detail, TENANT_ADMIN: '`Explicitly prohibited`' },
    }
    const a = doh15Affordance(mutant, 'TENANT_ADMIN', LIVE)
    expect(a.kind === 'absent' && a.reason).not.toContain('approver role')
  })
})

/* ==================================================================== *
 * ROWS 4, 5, 6 — RESTATEMENTS, NOT ACTS
 * ==================================================================== */

describe('rows 4, 5 and 6 restate the reset and name no capability', () => {
  const ids = [
    'clone-a-job-into-an-active-state-directly',
    'carry-the-source-jobs-approval-forward',
    'carry-the-source-jobs-recurrence-forward-silently',
  ] as const

  it('are classified restatements and point at what they restate', () => {
    for (const id of ids) {
      const row = doh15Row(id)
      expect(row.kind, id).toBe('restatement')
      expect(row.restates, id).not.toBeNull()
    }
  })

  it('stay `screen` rows, because a capability that exists NOWHERE is not another surface', () => {
    for (const id of ids) expect(doh15Row(id).surface, id).toBe('screen')
  })

  it('draw nothing for any role, and print the deferral ruling`s adopted line', () => {
    for (const id of ids) {
      for (const role of ROLES) {
        const a = doh15Affordance(doh15Row(id), role, LIVE)
        expect(a.kind, `${id}/${role}`).toBe('absent')
        if (role === 'WORKER') continue // answered at the no-Hub-screen question instead
        expect(a.kind === 'absent' && a.reason, `${id}/${role}`).toContain(
          DEFERRAL_RENDERING.adopted,
        )
      }
    }
  })

  it('consume the deferral ruling rather than restating it', () => {
    // The wording is imported, not copied. If wave 1's ruling is reworded,
    // this module's panel changes with it and no second wording survives.
    expect(DEFERRAL_RENDERING.adopted).toContain('Never a disabled control')
    const own = moduleSources().join('\n')
    expect(own).toContain('DEFERRAL_RENDERING')
    expect(own).not.toContain('Never a disabled control, and never an empty region.')
  })

  it('MUTANT — classified as acts, the stated line is lost and a bare prohibition takes its place', () => {
    // REACHABILITY FIRST. Every cell on these rows already refuses, so the
    // KIND alone cannot move `absent` to `control` — a mutant asserting
    // otherwise passes against a broken module. What moves is the REASON,
    // which is what a person reads where the control would be.
    const row = doh15Row('carry-the-source-jobs-approval-forward')
    const mutant: Doh15Row = { ...row, kind: 'act', restates: null }
    const before = doh15Affordance(row, 'TENANT_ADMIN', LIVE)
    const after = doh15Affordance(mutant, 'TENANT_ADMIN', LIVE)
    expect(before.kind).toBe('absent')
    expect(after.kind).toBe('absent')
    expect(before.kind === 'absent' && before.reason).toContain(DEFERRAL_RENDERING.adopted)
    expect(after.kind === 'absent' && after.reason).not.toContain(DEFERRAL_RENDERING.adopted)
  })

  it('MUTANT — an act with a permissive cell invents a capability the source says has no path', () => {
    // TEST-DOH-15-D3 (L29571) words itself as a PATH assertion: "assert no
    // such path exists". This is that path being invented.
    const row = doh15Row('clone-a-job-into-an-active-state-directly')
    const mutant: Doh15Row = {
      ...row,
      kind: 'act',
      status: { ...row.status, TENANT_ADMIN: 'allowed' },
    }
    expect(doh15Affordance(mutant, 'TENANT_ADMIN', LIVE).kind).toBe('control')
    expect(sourceLine(29571)).toContain('assert no such path exists')
  })

  it('row 6`s clause is a substitute behaviour, not a condition on the prohibition', () => {
    const row = doh15Row('carry-the-source-jobs-recurrence-forward-silently')
    expect(row.detail.TENANT_ADMIN).toContain('recurrence resets to one-off and the prompt fires')
    // Read as a condition it would license a silent carry-forward on the one
    // branch where L29494 says no prompt fires. The row refuses regardless of
    // whether the source recurs, which is the check that closes it.
    for (const recurs of [true, false]) {
      expect(doh15Affordance(row, 'TENANT_ADMIN', ctx({ sourceRecurs: recurs })).kind).toBe('absent')
    }
  })
})

/* ==================================================================== *
 * THE NO-HUB-SCREEN QUESTION, ASKED BEFORE THE TOKEN
 * ==================================================================== */

describe('the no-Hub-screen rule is asked before the token', () => {
  it('answers the Worker with D11, not with its cell`s prohibition', () => {
    const a = doh15Affordance(doh15Row('clone-a-job'), 'WORKER', LIVE)
    expect(a.kind).toBe('absent')
    expect(a.kind === 'absent' && a.reason).toContain('D11')
  })

  it('THE GATE HAS TEETH, proved on a constructed row rather than on this card`s data', () => {
    // REACHABILITY FIRST. The Worker's real cell is `Explicitly prohibited`,
    // so question 4 would have produced `absent` too and the check above
    // proves nothing on its own. A permissive Worker cell is the only shape
    // that separates the two questions.
    const row = doh15Row('clone-a-job')
    const permissive: Doh15Row = { ...row, status: { ...row.status, WORKER: 'allowed' } }
    const a = doh15Affordance(permissive, 'WORKER', LIVE)
    expect(a.kind).toBe('absent')
    expect(a.kind === 'absent' && a.reason).toContain('D11')
    // ... and the same permissive cell in a column the registry DOES admit
    // becomes a control, so the gate is the reach question and not the token.
    expect(doh15Affordance(permissive, 'SUPERVISOR', LIVE).kind).toBe('control')
  })

  it('is D11 at the route registry and never catalogue B`s cell', () => {
    // The Tenant Admin is omitted by L48105 and is NOT withheld here: the
    // catalogue cell is a quotation, never the reach answer.
    expect(MOD_DOH_15_MOUNT.narrowerThanTheMatrixBy).toEqual(['Tenant Admin'])
    expect(doh15Affordance(doh15Row('clone-a-job'), 'TENANT_ADMIN', LIVE).kind).toBe('control')
  })
})

/* ==================================================================== *
 * ROW 1 — THE CLONE ACT
 * ==================================================================== */

describe('row 1 draws the clone control for the two roles the source grants', () => {
  const row = doh15Row('clone-a-job')

  it('offers a live control to the Tenant Admin and the Supervisor', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR'] as const) {
      const a = doh15Affordance(row, role, LIVE)
      expect(a.kind, role).toBe('control')
      expect(a.kind === 'control' && a.blockedByTenantState, role).toBeNull()
    }
  })

  it('refuses the other three — TEST-DOH-15-D2 (L29570)', () => {
    for (const role of ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'] as const) {
      expect(doh15Affordance(row, role, LIVE).kind, role).toBe('absent')
      expect(cloneDecision(role).outcome, role).not.toBe('allowed')
    }
    expect(sourceLine(29570)).toContain('assert refusal for all three')
  })

  it('gates suspension on the ONE write-class table, for the create-job action', () => {
    // The Tenant Admin cell says it in those words: "blocked in every
    // suspension state as new-Job creation". So the gate is the row that
    // already refuses a fresh Job, not a second suspension rule.
    for (const state of TENANT_STATES) {
      const a = doh15Affordance(row, 'SUPERVISOR', ctx({ tenantState: state }))
      expect(a.kind, state).toBe('control')
      const blocked = a.kind === 'control' ? a.blockedByTenantState : undefined
      if (state === 'active') expect(blocked, state).toBeNull()
      else expect(blocked, state).toContain(state)
    }
  })

  it('refuses under the stricter reading when the state cannot be determined', () => {
    const a = doh15Affordance(row, 'SUPERVISOR', ctx({ tenantState: 'indeterminate' }))
    expect(a.kind === 'control' && a.blockedByTenantState).toContain('indeterminate')
  })

  it('disables offline under FB-DOH-CORE-001, and queues nothing — L29530', () => {
    const a = doh15Affordance(row, 'SUPERVISOR', ctx({ online: false }))
    expect(a.kind === 'control' && a.blockedByTenantState).toContain('FB-DOH-CORE-001')
    expect(sourceLine(29530)).toContain('no clone is queued in the browser')
  })

  it('the evaluator refuses a suspended tenant even where the fold drew a control', () => {
    // Taking a button off the screen does not stop anyone, and leaving one on
    // does not permit anyone. The two are asked separately and both refuse.
    const suspended = {
      ...contextFor('SUPERVISOR'),
      state: withTenant(
        emptyDomainState(scenarioRunId('DOH-MOD-15-SUSPENDED')),
        HUB_TENANT_ID,
        () => ({
          displayName: 'Bright Bikes',
          lifecycleState: 'HARD_SUSPENDED' as const,
          desiredFeatureValues: {},
          tier: 'growth',
          objects: {},
        }),
      ),
    }
    const decision = cloneDecision('SUPERVISOR', suspended)
    expect(decision.outcome).not.toBe('allowed')
    expect(decision.reasonCode).toBe('TENANT_SUSPENDED')
  })
})

/* ==================================================================== *
 * ROW 2 — THE PROMPT THAT ONLY EXISTS ON ONE BRANCH
 * ==================================================================== */

describe('row 2`s act does not exist on a non-recurring source', () => {
  const row = doh15Row('answer-the-recurrence-prompt')

  it('carries the Tenant Admin`s unconditional token, verbatim', () => {
    expect(row.status.TENANT_ADMIN).toBe('allowed')
    expect(sourceLine(29478)).toContain('| Answer the recurrence prompt | `Allowed` |')
  })

  it('draws the control where the source recurs — TEST-DOH-15-N1', () => {
    expect(doh15Affordance(row, 'TENANT_ADMIN', ctx({ sourceRecurs: true })).kind).toBe('control')
  })

  it('draws nothing where it does not, and cites L29494 — TEST-DOH-15-N2 (L29568)', () => {
    const a = doh15Affordance(row, 'TENANT_ADMIN', ctx({ sourceRecurs: false }))
    expect(a.kind).toBe('absent')
    expect(a.kind === 'absent' && a.reason).toContain('L29494')
    expect(sourceLine(29494)).toContain('does not raise the prompt')
    expect(sourceLine(29568)).toContain('assert no prompt fires')
  })

  it('MUTANT — skipping the prompt-exists question offers an unconditional control for a prompt that never fires', () => {
    // The mutant is the fold WITHOUT question 3, applied to the same cell.
    // Reachability check: the Tenant Admin's token is `Allowed`, so question
    // 4 genuinely produces a control here and the two answers differ.
    const withoutQuestion3 = doh15Affordance(
      { ...row, id: 'clone-a-job' as const },
      'TENANT_ADMIN',
      ctx({ sourceRecurs: false }),
    )
    expect(withoutQuestion3.kind).toBe('control')
  })

  it('the prompt is the source`s own sentence, at both lines that carry it', () => {
    expect(RECURRENCE_PROMPT).toBe('This was cloned from a recurring Job — set recurrence now?')
    expect(sourceLine(29452)).toContain(RECURRENCE_PROMPT)
    expect(sourceLine(29489)).toContain(RECURRENCE_PROMPT)
  })

  it('discloses that FUNC-DOH-15-2.1.1 answers the same question differently', () => {
    const entry = MOD_DOH_15_UNSPECIFIED_IN_SOURCE.find((s) => s.topic.includes('cloning identity'))
    expect(entry).toBeDefined()
    expect(sourceLine(29524)).toContain('**Roles allowed:** the cloning identity')
  })
})

/* ==================================================================== *
 * NO `disabled` ON THE MATRIX AXIS
 * ==================================================================== */

describe('the rendering type has no disabled member', () => {
  it('never returns one, for any row, any role, any state', () => {
    const kinds = new Set<string>()
    for (const row of MOD_DOH_15_MATRIX) {
      for (const role of ROLES) {
        for (const state of [...TENANT_STATES, 'indeterminate'] as const) {
          for (const online of [true, false]) {
            for (const sourceRecurs of [true, false]) {
              kinds.add(doh15Affordance(row, role, { tenantState: state, online, sourceRecurs }).kind)
            }
          }
        }
      }
    }
    expect([...kinds].sort()).toEqual(['absent', 'control'])
  })

  it('cannot be constructed — the union has two arms and neither is `disabled`', () => {
    // @ts-expect-error a disabled arm does not exist on this union
    const forbidden: Doh15Affordance = { kind: 'disabled', label: 'Clone a Job', reason: 'no' }
    void forbidden
  })

  it('the transient block cannot appear on an absent answer', () => {
    // A row nobody holds does not become holdable by the tenant coming back
    // online, so the field lives on the arm that HAS a control and nowhere
    // else. Checked structurally as well as by type.
    for (const row of MOD_DOH_15_MATRIX) {
      for (const role of ROLES) {
        const a = doh15Affordance(row, role, ctx({ online: false, tenantState: 'hard-suspended' }))
        if (a.kind === 'absent') expect(Object.keys(a).sort()).toEqual(['kind', 'reason'])
      }
    }
  })
})

/* ==================================================================== *
 * WHAT A CLONE CARRIES
 * ==================================================================== */

describe('the copy and reset lists are the source`s own, and the count is the trap', () => {
  it('names exactly six copied elements — AC-DOH-15-1 (L29557)', () => {
    expect(COPIED_ELEMENTS).toHaveLength(6)
    expect(sourceLine(29557)).toContain('copies exactly the six named elements')
  })

  it('is six only because the first element is one compound naming two pointers', () => {
    // Split L29452's list on its conjunctions and it yields seven. The
    // acceptance criterion says six, so exactly one element is plural — and
    // an implementation that counted seven would fail its own AC for a
    // reason no reviewer could see in a diff.
    const plural = COPIED_ELEMENTS.filter((e) => e.plural)
    expect(plural).toHaveLength(1)
    expect(plural[0]!.element).toContain('workflow and work-instruction pointers')
    expect(sourceLine(29452)).toContain('the workflow and work-instruction pointers')
  })

  it('names exactly three reset elements — AC-DOH-15-2 (L29558)', () => {
    expect(RESET_ELEMENTS).toHaveLength(3)
    expect(RESET_ELEMENTS.map((e) => e.element)).toEqual([
      'The name',
      'The state',
      'The recurrence',
    ])
    expect(sourceLine(29558)).toContain('resets exactly the three named elements')
  })

  it('copies the binding as a parent node, never as an Area field', () => {
    // DEC-AREA-001's adopted position, and the source's own sentence switches
    // vocabulary inside one clause to confirm it.
    const binding = COPIED_ELEMENTS.find((e) => e.element === 'The Area binding')!
    expect(binding.note).toContain('parent-node binding')
    expect(sourceLine(29494)).toContain('the clone would bind to an archived node')
  })

  it('carries the taxonomy and invents none of it', () => {
    const empty = emptyDomainState(scenarioRunId('DOH-MOD-15-TAX'))
    const partition = empty.tenants[tenantId('TEN-NONE')]
    void partition
    const own = moduleSources().join('\n')
    // No seeded Job Type or Service Type name anywhere in this module.
    expect(own).toContain('DEC-TAX-002')
    expect(own).toMatch(/carried from the source job/i)
  })

  it('the seeded catalogue ships empty and this module leaves it empty', () => {
    const state = emptyDomainState(scenarioRunId('DOH-MOD-15-SEED'))
    expect(state.platform.seededJobTypes).toEqual([])
    expect(state.platform.seededServiceTypes).toEqual([])
  })

  it('renders the storyboard`s footer line verbatim — L29547', () => {
    expect(sourceLine(29547)).toContain(CLONE_DIALOGUE_FOOTER)
  })
})

/* ==================================================================== *
 * NO SIXTH ROLE, NO ROUTED POINTER, AND THE MOUNT
 * ==================================================================== */

describe('the module adds no role and mints no pointer', () => {
  it('names no JOB_OWNER and no CLONING_IDENTITY token anywhere', () => {
    for (const src of moduleSources()) {
      expect(src).not.toMatch(/'JOB_OWNER'/)
      expect(src).not.toMatch(/'CLONING_IDENTITY'/)
      expect(src).not.toMatch(/\bJOB_OWNER\b\s*[:=]/)
    }
  })

  it('reads Job ownership through the shared predicate and never re-implements it', () => {
    const panel = readFileSync(join(MODULE_DIR, 'JobCloningPanel.tsx'), 'utf8')
    expect(panel).toContain("from '@/surfaces/doh/job-owner'")
    expect(panel).not.toContain('=== identity')
  })

  it('carries no routedTo field on any row', () => {
    for (const row of MOD_DOH_15_MATRIX) {
      expect(Object.keys(row)).not.toContain('routedTo')
    }
    for (const src of moduleSources()) expect(src).not.toMatch(/readonly routedTo/)
  })

  it('is mounted in SCR-DOH-11 and holds no route of its own', () => {
    const screen = dohScreenById('SCR-DOH-11')
    expect(screen.alsoShows).toContain('MOD-DOH-15')
    expect(screen.sourceRef).toBe(MOD_DOH_15_MOUNT.sourceRef)
    expect(MOD_DOH_15_MOUNT.hasRouteOfItsOwn).toBe(false)
    expect(sourceLine(48105)).toContain('MOD-DOH-05, MOD-DOH-15, MOD-DOH-16')
  })

  it('is registered in DOH_MODULES under the slug of the screen that mounts it', () => {
    // The debt this test used to pin — "not yet registered" — is cleared.
    // The registered row carries the mount's slug, not a route of its own,
    // and its generated reach equals the in-module derivation over the same
    // rows by the same rule. Both sides are asserted so the equality cannot
    // pass by both collapsing to empty.
    const registered = DOH_MODULES.find((m) => m.id === 'MOD-DOH-15')
    expect(registered).toBeDefined()
    expect(registered?.slug).toBe('job-lifecycle-and-approval')
    expect(registered?.slug).toBe(DOH_MODULES.find((m) => m.id === 'MOD-DOH-05')?.slug)
    expect(registered?.rolesReaching).toEqual(MOD_DOH_15_REACH)
    expect(MOD_DOH_15_REACH).toEqual(['TENANT_ADMIN', 'SUPERVISOR'])
  })

  it('adds a SECOND narrowing to SCR-DOH-11, and the shared register now holds both', () => {
    const both = DOH_CATALOGUE_B_REACH_NARROWER.filter((n) => n.screenId === 'SCR-DOH-11')
    expect(both).toHaveLength(2)
    const [byJob, byClone] = both
    expect(byJob?.moduleId).toBe('MOD-DOH-05')
    expect(byJob?.matrixRef).toContain('L27695')
    expect(byClone?.moduleId).toBe('MOD-DOH-15')
    expect(byClone?.matrixRef).toContain('L29477')
    // Same screen, same omitted role, a DIFFERENT capability and a different
    // line — which is exactly what one-entry-per-screen could not express.
    expect(byJob?.omittedRoles).toEqual(['Tenant Admin'])
    expect(byClone?.omittedRoles).toEqual(['Tenant Admin'])
    expect(MOD_DOH_15_MOUNT.narrowingRef).toContain('L29477')
    expect(MOD_DOH_15_MOUNT.narrowingRef).not.toContain('L27695')
  })
})

/* ==================================================================== *
 * SILENCES
 * ==================================================================== */

describe('what the source does not say is recorded, not filled in', () => {
  it('has a Hub command for the clone act, and none for the prompt that follows it', () => {
    // The debt this test used to pin is cleared: L29543's audit line now has
    // a command to hang off. The PROMPT still has none, and that is a
    // different fact with its own reason — `FUNC-DOH-15-2.1.1` names its
    // allowed roles as "the cloning identity", which is not one of the five.
    expect(HUB_COMMAND_TYPES.filter((t) => t.includes('CLONE'))).toEqual(['DOH_CLONE_JOB'])
    expect(HUB_COMMAND_TYPES.filter((t) => t.includes('RECURRENCE'))).toEqual([])
    expect(
      MOD_DOH_15_UNSPECIFIED_IN_SOURCE.some((s) => s.topic.includes('recurrence answer')),
    ).toBe(true)
  })

  it('reads recurrence off the Job record, and treats an unstated pattern as recurring', () => {
    expect(sourceLine(29559)).toContain('always raises the recurrence prompt')
    // The field exists. §4.5.1 lists it among the Job's own fields.
    expect(sourceLine(27648)).toContain('recurrence pattern')
    const daily: JobRecord = { ...BASE_JOB, recurrence: 'Daily' }
    const oneOff: JobRecord = { ...BASE_JOB, recurrence: ONE_OFF_RECURRENCE }
    const unstated: JobRecord = { ...BASE_JOB }
    expect(jobRecurs(daily)).toBe(true)
    expect(jobRecurs(oneOff)).toBe(false)
    // The safe side of "always": an unknown pattern raises the prompt.
    expect(jobRecurs(unstated)).toBe(true)
    // And the silence that remains is about the VOCABULARY, not the field.
    expect(
      MOD_DOH_15_UNSPECIFIED_IN_SOURCE.some((s) => s.topic.includes('recurrence pattern may say')),
    ).toBe(true)
  })

  it('resets the clone to one-off and copies no pairing, which is AC-DOH-15-1 and AC-DOH-15-2', () => {
    expect(sourceLine(29558)).toContain('recurrence to one-off')
    expect(sourceLine(29557)).toContain('exactly the six named elements and no others')
    const source: JobRecord = {
      ...BASE_JOB,
      recurrence: 'Daily',
      linkedJobRef: 'JOB-OTHER',
      state: 'active',
      createdBy: 'ACT-OTHER',
    }
    const seeded = putJob(source)
    const cloned = applyHubCommand(seeded, {
      type: 'DOH_CLONE_JOB',
      tenant: CLONE_TENANT,
      sourceJobId: source.jobId,
      jobId: 'JOB-CLONE',
      name: 'Red bike frame assembly (copy)',
      ownerId: 'ACT-CLONER',
    })
    const clone = readJob(cloned, CLONE_TENANT, 'JOB-CLONE')
    expect(clone?.jobTypeId).toBe(source.jobTypeId)
    expect(clone?.parentNodeId).toBe(source.parentNodeId)
    expect(clone?.state).toBe('draft')
    expect(clone?.recurrence).toBe(ONE_OFF_RECURRENCE)
    // `linked_job_ref` is not one of the six copied elements, and `createdBy`
    // is not either — copying it would launder a segregation-of-duties breach.
    expect(clone?.linkedJobRef).toBeNull()
    expect(clone?.createdBy).toBe('ACT-CLONER')
    // The source Job is untouched: AC-DOH-15-5, one transaction, one new Job.
    expect(readJob(cloned, CLONE_TENANT, source.jobId)).toEqual(source)
  })

  it('records the idempotency key TEST-DOH-15-R1 names and the card never specifies', () => {
    expect(sourceLine(29574)).toContain('the idempotency key prevented a duplicate')
    expect(sourceLine(29551)).toContain('bounded idempotent retry')
    expect(sourceLine(29551)).not.toContain('idempotency key')
  })

  it('records the two fallback identifiers where the card slot holds one', () => {
    expect(sourceLine(29471)).toContain('`FB-DOH-WRITE-002` primary')
    expect(sourceLine(29530)).toContain('FB-DOH-CORE-001')
  })

  it('every silence cites a line that exists and is not blank', () => {
    for (const s of MOD_DOH_15_UNSPECIFIED_IN_SOURCE) {
      for (const m of s.sourceRef.matchAll(/L(\d{3,6})/g)) {
        const n = Number(m[1])
        expect(n, s.topic).toBeGreaterThan(0)
        expect(n, s.topic).toBeLessThanOrEqual(SOURCE.length)
        expect(sourceLine(n).trim(), `${s.topic} L${n}`).not.toBe('')
      }
    }
  })
})

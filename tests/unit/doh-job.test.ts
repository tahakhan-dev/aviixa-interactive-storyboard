import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEC_AREA_001_POSITION,
  DEC_TAX_002_SEEDED_COUNTS,
  MOD_DOH_05_ACTS,
  MOD_DOH_05_ESCAPE,
  MOD_DOH_05_MATRIX,
  MOD_DOH_05_REACH,
  MOD_DOH_05_UNSPECIFIED_IN_SOURCE,
  actsOfRow,
  doh05Act,
  doh05Row,
  rolesGranted,
  type Doh05Row,
} from '@/surfaces/doh/modules/doh-05/matrix'
import {
  DOH_05_IDENTITIES,
  SEEDED_JOBS,
  approvalQueueFor,
  identityFor,
  isPausedByArchivalCascade,
} from '@/surfaces/doh/modules/doh-05/jobs'
import {
  actDecision,
  adoptVersionDecision,
  approveDecision,
} from '@/surfaces/doh/modules/doh-05/access'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import { inlineControlsOnAdjacentCapabilities } from '@/surfaces/doh/boundary'
import { DOH_CATALOGUE_B_REACH_NARROWER, dohScreenById } from '@/surfaces/doh/screens'
import { JOB_STATES } from '@/surfaces/doh/objects'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { permitsAction } from '@/policy/decision'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'

/**
 * `MOD-DOH-05` — Job Lifecycle and Approval.
 *
 * EVERY RULE IN THIS SUITE IS DRIVEN BY A MUTANT, not only asserted. A test
 * that reads a field and asserts the same field is a tautology dressed as
 * evidence: it stays green when the value is wrong in a way the rule cares
 * about, because the rule was never asked. So each rule below is proved
 * twice — once against the shipped rows, and once against a row deliberately
 * broken in the exact way the rule exists to catch, asserting that the
 * SPECIFIC answer moves and, where it matters, that nothing else does.
 *
 * The mutants are constructed rows fed to the real derivations. They mutate
 * nothing on disk, so they are safe to run in parallel with the file-level
 * plants recorded in this task's report.
 */

const ROLES = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const

const MODULE_DIR = join(process.cwd(), 'src/surfaces/doh/modules/doh-05')

/**
 * Comment-stripped, for the same reason `tests/coverage/contract-gates.test.ts`
 * strips before its scans: this module's own prose names `JOB_OWNER` and
 * `createdBy` precisely in order to DENY them, and a raw scan would fail on
 * the sentence explaining why the thing it forbids is absent.
 */
function moduleSources(): ReadonlyMap<string, string> {
  return new Map(
    readdirSync(MODULE_DIR)
      .filter((f) => f.endsWith('.ts'))
      .map((f) => [
        f,
        readFileSync(join(MODULE_DIR, f), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/[^\n]*/g, ''),
      ]),
  )
}

/** One row, replaced in place, so the derivations run over a real list. */
function matrixWith(replacement: Doh05Row): readonly Doh05Row[] {
  return MOD_DOH_05_MATRIX.map((row) => (row.id === replacement.id ? replacement : row))
}

const jobById = (id: string) => SEEDED_JOBS.find((j) => j.record.jobId === id)!

/* ==================================================================== *
 * THE ROWS, COUNTED
 * ==================================================================== */

describe('the matrix is fourteen rows, measured rather than carried', () => {
  it('holds exactly fourteen rows, ordinals 1 to 14 in source order', () => {
    expect(MOD_DOH_05_MATRIX).toHaveLength(14)
    expect(MOD_DOH_05_MATRIX.map((r) => r.ordinal)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ])
  })

  it('binds every ordinal to its own line, contiguous from L27694 to L27707', () => {
    // The span in the plan starts on the table HEADER at L27692, so row 1 is
    // L27694 and row 14 is L27707. A reader who took the span's first line as
    // row 1 would end at L27705 and lose the archival and view rows.
    for (const row of MOD_DOH_05_MATRIX) {
      expect(row.sourceRef.startsWith(`L${27693 + row.ordinal}`), row.id).toBe(true)
    }
    expect(MOD_DOH_05_MATRIX[0]!.sourceRef).toBe('L27694')
    expect(MOD_DOH_05_MATRIX[13]!.sourceRef).toBe('L27707')
  })

  it('names every cell for every role — no blank cell anywhere', () => {
    for (const row of MOD_DOH_05_MATRIX) {
      for (const role of ROLES) {
        expect(row.status[role], `${row.id}.${role}`).toBeTruthy()
        expect(row.detail[role].trim(), `${row.id}.${role}`).not.toBe('')
      }
    }
  })
})

/* ==================================================================== *
 * ROW 11 — TWO STATUSES IN ONE CELL
 * ==================================================================== */

describe('row 11 states two statuses in one cell and both halves render', () => {
  const row = doh05Row('modify-recurrence-on-an-active-job')

  it('keeps both halves of the Quality Manager cell', () => {
    expect(row.ordinal).toBe(11)
    expect(row.status.QUALITY_MANAGER).toBe('explicitly-prohibited')
    expect(row.secondAct).not.toBeNull()
    expect(row.secondAct!.status.QUALITY_MANAGER).toBe('allowed')
  })

  it('yields two acts from one row', () => {
    expect(actsOfRow(row).map((a) => a.id)).toEqual([
      'modify-recurrence-on-an-active-job',
      'approve-a-recurrence-modification',
    ])
  })

  // THE FIRST OF THE TWO SILENT FAILURES: keeping only the grant would draw a
  // propose control for the one role the source forbids to propose.
  it('draws no propose control for the Quality Manager', () => {
    const decision = actDecision('QUALITY_MANAGER', 'modify-recurrence-on-an-active-job')
    expect(decision.outcome).toBe('explicitlyProhibited')
  })

  // THE SECOND: keeping only the prohibition would remove the approve control
  // the recurrence gate cannot run without.
  it('draws the approve control for the Quality Manager', () => {
    const decision = actDecision('QUALITY_MANAGER', 'approve-a-recurrence-modification')
    expect(decision.outcome).toBe('allowed')
  })

  it('grants the approving half to the Quality Manager alone, and says nothing about two roles', () => {
    const approve = doh05Act('approve-a-recurrence-modification')
    expect(rolesGranted(approve)).toEqual(['QUALITY_MANAGER'])
    // Silent, not refused: `null` is the row saying nothing. Asserting
    // `explicitly-prohibited` here would be this build answering for it.
    expect(approve.status.TENANT_ADMIN).toBeNull()
    expect(approve.status.SUPERVISOR).toBeNull()
    // Stated, and stated for both halves: neither cell carries a "for
    // proposing" qualifier, so its prohibition covers the whole row.
    expect(approve.status.READONLY_AUDITOR).toBe('explicitly-prohibited')
    expect(approve.status.WORKER).toBe('explicitly-prohibited')
  })

  it('MUTANT — dropping the second half removes exactly the approve act', () => {
    const collapsed: Doh05Row = { ...row, secondAct: null }
    const acts = matrixWith(collapsed).flatMap(actsOfRow)
    expect(acts.map((a) => a.id)).not.toContain('approve-a-recurrence-modification')
    expect(acts).toHaveLength(MOD_DOH_05_ACTS.length - 1)
    // And it changes nothing else: the propose act survives untouched.
    expect(acts.map((a) => a.id)).toContain('modify-recurrence-on-an-active-job')
  })

  it('MUTANT — keeping only the grant gives the Quality Manager a propose act', () => {
    const grantOnly: Doh05Row = {
      ...row,
      status: { ...row.status, QUALITY_MANAGER: 'allowed' },
      secondAct: null,
    }
    const propose = actsOfRow(grantOnly)[0]!
    expect(rolesGranted(propose)).toContain('QUALITY_MANAGER')
    // The shipped row does not.
    expect(rolesGranted(doh05Act('modify-recurrence-on-an-active-job'))).not.toContain(
      'QUALITY_MANAGER',
    )
  })

  it('MUTANT — which half is primary does not move who reaches the module', () => {
    // Stated because it is the tempting shortcut: if reach were sensitive to
    // the choice, picking a half would silently re-draw the rail. It is not,
    // and that is measured rather than assumed.
    const swapped: Doh05Row = { ...row, status: { ...row.status, QUALITY_MANAGER: 'allowed' } }
    expect(rolesReachingByMatrix(matrixWith(swapped), cellStatus)).toEqual(MOD_DOH_05_REACH)
  })
})

/* ==================================================================== *
 * ROW 4 — A PROHIBITION CARRYING A PERMISSIVE ESCAPE
 * ==================================================================== */

describe('row 4 is a prohibition with a permissive escape, and asserts neither half', () => {
  const row = doh05Row('approve-a-job')

  it('carries the token and the clause together', () => {
    expect(row.ordinal).toBe(4)
    expect(row.status.TENANT_ADMIN).toBe('explicitly-prohibited')
    expect(row.detail.TENANT_ADMIN).toContain(
      'unless the Tenant Admin also holds an approver role and did not create it',
    )
    expect(row.escape).toBe(MOD_DOH_05_ESCAPE)
    expect(row.escape!.representable).toBe(false)
  })

  it('refuses the Tenant Admin without asserting either half', () => {
    const decision = approveDecision('TENANT_ADMIN', jobById('JOB-REDBIKE'))
    // ROLE_NOT_GRANTED — "no role on this row grants you this". NOT
    // SEGREGATION_OF_DUTIES, which would imply the escape had been taken and
    // only the maker-checker rule stood in the way.
    expect(decision.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(decision.outcome).toBe('explicitlyProhibited')
  })

  it('refuses both non-approver roles at the ROLE stage, in two different spellings', () => {
    // FOUND BY THE COMPONENT SUITE, AND THE REASON THE RENDERING RULE KEYS ON
    // THE STAGE. One row produces both `BASE_ROLE` spellings: the Supervisor's
    // flat prohibition is in the command spec's `deniedRoles`, so EXPLICIT_DENY;
    // the Tenant Admin is in NEITHER list, deliberately, so that its
    // prohibition-with-an-escape asserts neither half — so ROLE_NOT_GRANTED.
    // A rendering rule keyed on the reason code drew a disabled control for
    // the categorical cell and nothing for the cell with the escape.
    const job = jobById('JOB-REDBIKE')
    const supervisor = approveDecision('SUPERVISOR', job)
    const admin = approveDecision('TENANT_ADMIN', job)
    expect(supervisor.reasonCode).toBe('EXPLICIT_DENY')
    expect(admin.reasonCode).toBe('ROLE_NOT_GRANTED')
    for (const decision of [supervisor, admin]) {
      expect(decision.stage).toBe('BASE_ROLE')
      expect(decision.outcome).toBe('explicitlyProhibited')
    }
    // And the later-stage refusal is NOT one of these: it is a statement about
    // this Job and this person, which is what a disabled control is for.
    expect(approveDecision('QUALITY_MANAGER', jobById('JOB-WHEELTRUE')).stage).not.toBe('BASE_ROLE')
  })

  it('states why the escape cannot be driven rather than hiding it', () => {
    expect(MOD_DOH_05_ESCAPE.whyNot).toContain('two tenant roles at once')
    expect(
      MOD_DOH_05_UNSPECIFIED_IN_SOURCE.some((s) => s.about.includes('escape')),
      'the escape is recorded as a silence, not filled in',
    ).toBe(true)
  })

  it('MUTANT — asserting the prohibition alone deletes the clause the screen prints', () => {
    const flattened: Doh05Row = { ...row, escape: null }
    expect(flattened.escape).toBeNull()
    expect(doh05Row('approve-a-job').escape).not.toBeNull()
  })

  it('MUTANT — asserting the escape alone hands the Tenant Admin the approval', () => {
    const permissive: Doh05Row = {
      ...row,
      status: { ...row.status, TENANT_ADMIN: 'allowed-with-conditions' },
    }
    const act = actsOfRow(permissive)[0]!
    expect(rolesGranted(act)).toContain('TENANT_ADMIN')
    expect(rolesGranted(doh05Act('approve-a-job'))).toEqual(['QUALITY_MANAGER'])
  })
})

/* ==================================================================== *
 * ROW 5 — A RESTATEMENT, NOT A SECOND ACT
 * ==================================================================== */

describe('row 5 is the negative restatement of row 4 and yields no act', () => {
  const row = doh05Row('approve-a-job-the-same-identity-created')

  it('is classified a restatement and points at the row it restates', () => {
    expect(row.ordinal).toBe(5)
    expect(row.kind).toBe('restatement')
    expect(row.restates).toBe('approve-a-job')
    expect(row.status).toEqual({
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    })
  })

  it('produces no act anywhere in the module', () => {
    expect(actsOfRow(row)).toEqual([])
    expect(MOD_DOH_05_ACTS.map((a) => a.rowId)).not.toContain(
      'approve-a-job-the-same-identity-created',
    )
  })

  it('MUTANT — classifying it as an act invents a capability nobody holds', () => {
    const promoted: Doh05Row = { ...row, kind: 'act', restates: null }
    const acts = matrixWith(promoted).flatMap(actsOfRow)
    expect(acts).toHaveLength(MOD_DOH_05_ACTS.length + 1)
    expect(acts.map((a) => a.rowId)).toContain('approve-a-job-the-same-identity-created')
    // And the invented act is one no role could ever hold — which is exactly
    // the shape that survives review: a row that renders and refuses everyone.
    expect(rolesGranted(acts.find((a) => a.rowId === promoted.id)!)).toEqual([])
  })
})

/* ==================================================================== *
 * ROW 8 — MET ON ANOTHER SCREEN
 * ==================================================================== */

describe('row 8 describes another screen and draws no control here', () => {
  const row = doh05Row('maintain-the-tag-to-qualification-set-mapping')

  it('is classified before its token is read', () => {
    expect(row.ordinal).toBe(8)
    expect(row.surface).toBe('another-surface')
    // The token is permissive and stays permissive on screen. What is refused
    // is the CONTROL, not the source's own word.
    expect(row.status.TENANT_ADMIN).toBe('allowed-with-conditions')
    expect(row.detail.TENANT_ADMIN).toContain('in the tenant administration area')
  })

  it('points at no cross-surface boundary, because the target is this surface', () => {
    // The eight-row register is cross-SURFACE. The tenant administration area
    // is `SCR-DOH-23`, a screen group of SURF-DOH itself, so a register
    // pointer here would claim a boundary that does not exist.
    // Structural, because `Doh05Row` declares no `boundary` field at all —
    // the shared `AdjacentRow` shape makes it optional, and this row's answer
    // is to carry no key rather than to carry an empty one.
    expect(Object.keys(row)).not.toContain('boundary')
    expect(dohScreenById('SCR-DOH-23').name).toBe('Tenant administration area')
  })

  it('yields no act, so no screen can draw a control from it', () => {
    expect(actsOfRow(row)).toEqual([])
    expect(MOD_DOH_05_ACTS.map((a) => a.rowId)).not.toContain(row.id)
  })

  it('passes the shared adjacent-capability gate, and the gate saw something', () => {
    // A GATE THAT PASSES ON AN EMPTY SCAN PROVES NOTHING, so the scan is
    // asserted non-empty before its result is. This module contributes
    // exactly one adjacent row, and if a later edit reclassified it the walk
    // would go quiet rather than red — which is the failure mode this second
    // assertion exists for.
    const adjacent = MOD_DOH_05_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(adjacent.map((r) => r.id)).toEqual(['maintain-the-tag-to-qualification-set-mapping'])
    expect(
      inlineControlsOnAdjacentCapabilities(MOD_DOH_05_MATRIX, ROLES, (r, role) =>
        cellStatus(r, role),
      ),
    ).toEqual([])
  })

  it('the gate has teeth, proved on a constructed row rather than on this module’s data', () => {
    // The shipped row is honest, so the gate cannot fire on it. Borrowed from
    // wave 0's own treatment of the same problem: prove the teeth on a row of
    // exactly the offending shape rather than deleting a check that has
    // nothing to bite on today.
    const offending = {
      id: 'constructed-adjacent-row-with-a-control',
      surface: 'screen' as const,
      boundary: 'workflow-and-instruction-authoring' as const,
    }
    expect(
      inlineControlsOnAdjacentCapabilities([offending], ROLES, () => 'allowed'),
    ).toHaveLength(1)
  })

  it('MUTANT — reclassifying it as this screen draws a control from the permissive token', () => {
    // WORTH SAYING PLAINLY: the shared gate does NOT catch this one. Its
    // misclassification arm fires on a row that points at a boundary and is
    // classified `screen`, and this row deliberately points at no boundary
    // because its target is not cross-surface. So the row's own suite is the
    // only thing standing between a permissive token and a button.
    const misclassified: Doh05Row = { ...row, surface: 'screen' }
    const acts = matrixWith(misclassified).flatMap(actsOfRow)
    expect(acts.map((a) => a.rowId)).toContain(row.id)
    expect(rolesGranted(acts.find((a) => a.rowId === row.id)!)).toEqual(['TENANT_ADMIN'])
    expect(
      inlineControlsOnAdjacentCapabilities(matrixWith(misclassified), ROLES, (r, role) =>
        cellStatus(r, role),
      ),
      'the shared gate cannot see this shape, and that is why this test exists',
    ).toEqual([])
  })
})

/* ==================================================================== *
 * ROW 10 — THE JOB-OWNER PREDICATE, CONSUMED
 * ==================================================================== */

describe('row 10 is gated by the shared Job-Owner predicate and adds no sixth role', () => {
  const owned = jobById('JOB-BRAKECHECK') // owner: Sam, the Supervisor

  it('offers the decision to the identity the Job’s owner field names', () => {
    expect(owned.record.ownerId).toBe(DOH_05_IDENTITIES.SUPERVISOR)
    expect(adoptVersionDecision('SUPERVISOR', owned, '2.1.0').outcome).toBe('allowed')
  })

  it('refuses every identity the owner field does not name, whatever their role', () => {
    for (const role of ['TENANT_ADMIN', 'QUALITY_MANAGER'] as const) {
      const decision = adoptVersionDecision(role, owned, '2.1.0')
      expect(decision.reasonCode, role).toBe('ROLE_NOT_GRANTED')
    }
  })

  it('refuses through the shared predicate, not through a copy of it', () => {
    const decision = adoptVersionDecision('TENANT_ADMIN', owned, '2.1.0')
    expect(
      decision.sourceRefs.some((ref) => ref.includes('Job Owner is a field on the Job record')),
      'the refusal carries the shared predicate’s own reason',
    ).toBe(true)
  })

  it('names no JOB_OWNER in any role list, anywhere in the module', () => {
    for (const act of MOD_DOH_05_ACTS) {
      expect(Object.keys(act.status).sort()).toEqual([...ROLES].sort())
    }
    // THE SHAPE MATTERS, and a plain substring scan gets it wrong in both
    // directions. It fires on the module's own on-screen sentence saying no
    // such role exists — which is text a reader needs — and stripping quoted
    // strings to silence that would blind it to `allowedRoles: ['JOB_OWNER']`,
    // the only shape that is actually the defect. So the scan is for a role
    // TOKEN: a standalone quoted member, or an object key.
    const asRoleToken = /'JOB_OWNER'|"JOB_OWNER"|\bJOB_OWNER\s*:/
    for (const [file, src] of moduleSources()) {
      expect(asRoleToken.test(src), file).toBe(false)
    }
    // Positive control: the pattern is not vacuous.
    expect(asRoleToken.test("allowedRoles: ['JOB_OWNER']")).toBe(true)
    expect(asRoleToken.test('{ JOB_OWNER: "allowed" }')).toBe(true)
    expect(asRoleToken.test('there is no `JOB_OWNER` in any role list')).toBe(false)
  })

  it('MUTANT — an unconditional row hands the act to three roles that do not own the Job', () => {
    // The row's own cells are already conditional for all three. The mutation
    // that matters is not in the row at all — it is skipping the predicate.
    expect(rolesGranted(doh05Act('decide-a-notified-class-version-adoption'))).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
    ])
    // Which is why the row alone is not the gate: read without the predicate,
    // this row admits three roles on EVERY Job. With it, exactly one identity
    // on this one Job.
    expect(adoptVersionDecision('QUALITY_MANAGER', owned, '2.1.0').outcome).toBe(
      'explicitlyProhibited',
    )
  })
})

/* ==================================================================== *
 * THE APPROVAL GATE — ONE SPELLING
 * ==================================================================== */

describe('the approval gate is the evaluator’s existing maker-checker and nothing else', () => {
  it('refuses a creator approving their own Job, at the segregation-of-duties stage', () => {
    const own = jobById('JOB-WHEELTRUE') // created by Elena, the Quality Manager
    const decision = approveDecision('QUALITY_MANAGER', own)
    expect(decision.reasonCode).toBe('SEGREGATION_OF_DUTIES')
    expect(decision.stage).toBe('SEGREGATION_OF_DUTIES')
  })

  it('allows the same role on a Job somebody else created', () => {
    expect(approveDecision('QUALITY_MANAGER', jobById('JOB-REDBIKE')).outcome).toBe('allowed')
  })

  it('partitions the queue on the creator field and agrees with the gate on every Job', () => {
    // FOUND BY THIS TEST, AND WORTH STATING RATHER THAN PATCHING AWAY. The
    // first version of it asserted `SEGREGATION_OF_DUTIES` for every role's
    // own Jobs and went red on the Supervisor, who is refused `EXPLICIT_DENY`
    // at the ROLE stage long before the evaluator reaches segregation of
    // duties. That is the evaluator working as documented — the earliest
    // failing stage wins, so a denial never leaks a later stage's reason —
    // and it means only the Quality Manager ever meets the segregation
    // refusal at all. What the partition and the gate must agree on is the
    // ANSWER, not the reason.
    for (const role of ROLES) {
      const queue = approvalQueueFor(identityFor(role))
      for (const job of queue.awaitingAnotherApprover) {
        expect(job.record.createdBy).toBe(identityFor(role))
        expect(
          permitsAction(approveDecision(role, job)),
          `${role}/${job.record.jobId} is in the no-decision panel and must carry no approval`,
        ).toBe(false)
      }
    }
  })

  it('reaches the segregation stage only for the one role the row grants', () => {
    const own = jobById('JOB-WHEELTRUE') // created by Elena, the Quality Manager
    expect(approveDecision('QUALITY_MANAGER', own).stage).toBe('SEGREGATION_OF_DUTIES')
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'READONLY_AUDITOR', 'WORKER'] as const) {
      // Refused earlier, on the role, so the segregation rule is never even
      // consulted for them. Asserting the segregation reason here would have
      // claimed a stage that never ran.
      expect(approveDecision(role, own).stage, role).not.toBe('SEGREGATION_OF_DUTIES')
      expect(permitsAction(approveDecision(role, own)), role).toBe(false)
    }
  })

  it('holds the Quality Manager’s own Job out of her decidable queue entirely', () => {
    const queue = approvalQueueFor(DOH_05_IDENTITIES.QUALITY_MANAGER)
    expect(queue.decidable.map((j) => j.record.jobId)).toEqual(['JOB-REDBIKE'])
    expect(queue.awaitingAnotherApprover.map((j) => j.record.jobId)).toEqual(['JOB-WHEELTRUE'])
  })

  it('spells maker-checker once — the decision layer compares no creator to any viewer', () => {
    // THE LINE THIS DRAWS, found by writing it too bluntly first. There IS a
    // creator-versus-viewer comparison in this module, in `approvalQueueFor`,
    // and it is not the defect: `SB-DOH-017` requires the queue to be split
    // on exactly that field, and a partition decides which LIST a Job is in.
    // The defect would be that comparison deciding whether the CONTROL
    // renders — a second maker-checker beside the evaluator's. So the scan is
    // on the decision layer, which is where a second spelling would live.
    const access = moduleSources().get('access.ts')!
    expect(access).not.toMatch(/createdBy\s*[!=]==/)
    expect(access).not.toMatch(/approvalQueueFor/)
    // The one place `createdBy` is read in the decision layer is where it is
    // HANDED to the evaluator, which is the mechanism rather than a copy of it.
    expect(access).toContain('createdBy: job.record.createdBy')
    expect(access).toContain('hubAccessRequest')
  })

  /**
   * THE DISABLED BRANCH IS NOT DEAD CODE, AND THE FIXTURE IS WHY IT LOOKS
   * LIKE IT. Every refusal a persona can reach THROUGH THE QUEUE is a
   * `BASE_ROLE` one, because the partition has already removed the two cases
   * that refuse later: a Job in the wrong state and a Job this viewer
   * created. So the disabled rendering never fires on the queue as seeded.
   *
   * It is kept, and proved reachable here rather than deleted, because it is
   * the guard for the partition and the gate DISAGREEING — a deep link, a
   * stale list, a Job that changed state between render and press. Deleting a
   * guard because today's fixture never triggers it is the "helper scoped to
   * exclude the defect it names" shape, and what it would leave behind is an
   * ENABLED Approve on a Job that cannot be approved.
   *
   * This is a matrix-axis question only in the sense that it is NOT one:
   * `OBJECT_STATE` and `SEGREGATION_OF_DUTIES` are statements about this Job
   * and this person, both of which can be otherwise for a different Job,
   * which is exactly what a disabled control carrying its reason is for. No
   * deferred or non-existent capability renders as a disabled control
   * anywhere in this module — those render as a stated line and no control.
   */
  it('reaches a later-stage refusal on real data, off the queue’s own partition', () => {
    // Active, not pending_approval, and created by somebody other than the
    // viewer — so the role stage passes and the object-state stage refuses.
    const active = jobById('JOB-BRAKECHECK')
    expect(active.record.state).toBe('active')
    const decision = approveDecision('QUALITY_MANAGER', active)
    expect(decision.stage).toBe('OBJECT_STATE')
    expect(permitsAction(decision)).toBe(false)
    // And it is NOT the categorical shape, so it renders disabled with its
    // reason rather than absent.
    expect(decision.stage).not.toBe('BASE_ROLE')
    // The queue never shows it, which is the partition doing its job — and
    // the reason this branch needed proving somewhere other than the screen.
    expect(
      approvalQueueFor(identityFor('QUALITY_MANAGER')).decidable.map((j) => j.record.jobId),
    ).not.toContain('JOB-BRAKECHECK')
  })

  it('MUTANT — a second spelling agrees today, which is exactly why it survives review', () => {
    const own = jobById('JOB-WHEELTRUE')
    const secondSpelling = own.record.createdBy === DOH_05_IDENTITIES.QUALITY_MANAGER
    // Same answer as the evaluator, on this Job, today. A duplicate that
    // agrees passes review; it is the day one of the two is changed that it
    // costs, and by then nothing points at the other. The rule is therefore
    // enforced structurally by the scan above, not by this comparison being
    // wrong.
    expect(secondSpelling).toBe(true)
    expect(approveDecision('QUALITY_MANAGER', own).reasonCode).toBe('SEGREGATION_OF_DUTIES')
  })
})

/* ==================================================================== *
 * REACH, AND CATALOGUE B
 * ==================================================================== */

describe('reach is derived from the matrix, never from catalogue B', () => {
  it('offers the module to four roles and withholds it from the Worker', () => {
    expect(MOD_DOH_05_REACH).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
  })

  it('withholds from the Worker on the Unavailable token, not on an empty column', () => {
    const view = doh05Row('view-jobs')
    expect(view.status.WORKER).toBe('unavailable')
    const relaxed: Doh05Row = { ...view, status: { ...view.status, WORKER: 'read-only' } }
    expect(rolesReachingByMatrix(matrixWith(relaxed), cellStatus)).toContain('WORKER')
  })

  it('is wider than catalogue B on the Job editor, and the narrowing is registered', () => {
    const editor = dohScreenById('SCR-DOH-11')
    expect(editor.catalogueBRoles).not.toContain('Tenant Admin')
    expect(doh05Row('edit-a-draft-job').status.TENANT_ADMIN).toBe('allowed')
    expect(MOD_DOH_05_REACH).toContain('TENANT_ADMIN')
    expect(
      DOH_CATALOGUE_B_REACH_NARROWER.some(
        (n) => n.screenId === 'SCR-DOH-11' && n.omittedRoles.includes('Tenant Admin'),
      ),
    ).toBe(true)
  })

  it('MUTANT — a rail hand-written from catalogue B loses the Tenant Admin', () => {
    const fromCatalogue = dohScreenById('SCR-DOH-11')
      .catalogueBRoles.split(',')
      .map((s) => s.trim())
    expect(fromCatalogue).toEqual(['Supervisor'])
    expect(fromCatalogue).toHaveLength(1)
    expect(MOD_DOH_05_REACH.length).toBeGreaterThan(fromCatalogue.length)
  })
})

/* ==================================================================== *
 * THE ACT LIST
 * ==================================================================== */

describe('thirteen acts against fourteen rows, and the arithmetic is derived', () => {
  it('drops the restatement, drops the adjacent row, and splits the two-status row', () => {
    expect(MOD_DOH_05_ACTS).toHaveLength(13)
    const actBearing = MOD_DOH_05_MATRIX.filter(
      (r) => r.kind === 'act' && r.surface === 'screen',
    )
    const splits = MOD_DOH_05_MATRIX.filter((r) => r.secondAct !== null)
    expect(actBearing).toHaveLength(12)
    expect(splits).toHaveLength(1)
    expect(MOD_DOH_05_ACTS).toHaveLength(actBearing.length + splits.length)
  })

  it('gives every act a unique id', () => {
    const ids = MOD_DOH_05_ACTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks exactly one act as the second half of a cell', () => {
    expect(MOD_DOH_05_ACTS.filter((a) => a.fromSecondHalfOfCell).map((a) => a.id)).toEqual([
      'approve-a-recurrence-modification',
    ])
  })
})

/* ==================================================================== *
 * THE TWO DECISIONS THIS MODULE CONSUMES
 * ==================================================================== */

describe('DEC-AREA-001 is consumed as an adopted position, not re-derived', () => {
  it('is classified as a derived clarification and never as a SoW fact', () => {
    expect(DEC_AREA_001_POSITION.classification).toBe(
      'Derived Clarification — adopted working position',
    )
    expect(DEC_AREA_001_POSITION.neverClassifiedAs).toBe('SoW Fact')
    expect(DEC_AREA_001_POSITION.ratification).toContain('Outstanding')
  })

  it('is deliberately absent from the open-decision canon', () => {
    // The canon's component renders every reading with none preferred. This
    // decision HAS a position taken; rendering it there would understate what
    // has been decided, and the canon is a wave-0 file this task does not edit.
    expect(OPEN_DECISION_IDS as readonly string[]).not.toContain('DEC-AREA-001')
  })

  it('binds every Job to one parent node and stores no Area', () => {
    for (const job of SEEDED_JOBS) {
      expect(job.record.parentNodeId, job.record.jobId).toBeTruthy()
      expect(Object.keys(job.record)).not.toContain('areaId')
    }
    expect(DEC_AREA_001_POSITION.consequence).toContain('WALKING UP')
  })
})

describe('DEC-TAX-002 ships the seeded catalogue empty and invents no name', () => {
  it('records eight and eight as counts and zero as what ships', () => {
    expect(DEC_TAX_002_SEEDED_COUNTS.jobTypes).toBe(8)
    expect(DEC_TAX_002_SEEDED_COUNTS.serviceTypes).toBe(8)
    expect(DEC_TAX_002_SEEDED_COUNTS.shippedAtV1).toBe(0)
  })

  it('leaves the platform’s seeded catalogues empty', () => {
    const platform = emptyDomainState(scenarioRunId('DOH-MOD-05-TEST')).platform
    expect(platform.seededJobTypes).toEqual([])
    expect(platform.seededServiceTypes).toEqual([])
  })

  it('names every Job Type in the fixture as a tenant-created entry', () => {
    for (const job of SEEDED_JOBS) {
      expect(job.record.jobTypeId.startsWith('JOBTYPE-BRIGHTBIKES-'), job.record.jobId).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE ARCHIVAL CASCADE PAUSE
 * ==================================================================== */

describe('the cascade pause is derived, and there is no fifth Job state', () => {
  it('keeps the state union at four', () => {
    expect(JOB_STATES).toEqual(['draft', 'pending_approval', 'active', 'archived'])
  })

  it('derives the pause from the bound node rather than writing a state', () => {
    const paused = jobById('JOB-OLDJIG')
    expect(isPausedByArchivalCascade(paused)).toBe(true)
    // The stored state is untouched, which is what lets the pause lift by
    // itself when the node archival is abandoned.
    expect(paused.record.state).toBe('active')
  })

  it('MUTANT — an archived Job is not "paused" by a cascade on its node', () => {
    const archived = { ...jobById('JOB-OLDJIG'), record: { ...jobById('JOB-OLDJIG').record, state: 'archived' as const } }
    expect(isPausedByArchivalCascade(archived)).toBe(false)
  })
})

/* ==================================================================== *
 * WHAT IS NOT SAID
 * ==================================================================== */

describe('the module’s silences are recorded rather than filled in', () => {
  it('records three, each with a locator', () => {
    expect(MOD_DOH_05_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThanOrEqual(3)
    for (const silence of MOD_DOH_05_UNSPECIFIED_IN_SOURCE) {
      expect(silence.sourceRef, silence.about).toMatch(/L\d{5}/)
      expect(silence.what.trim()).not.toBe('')
    }
  })

  it('records the silent half of row 11 as a silence and not as a status', () => {
    const silence = MOD_DOH_05_UNSPECIFIED_IN_SOURCE.find((s) => s.about.includes('Row 11'))
    expect(silence).toBeDefined()
    const approve = doh05Act('approve-a-recurrence-modification')
    const silentRoles = ROLES.filter((r) => approve.status[r] === null)
    expect(silentRoles).toEqual(['TENANT_ADMIN', 'SUPERVISOR'])
  })
})

/* ==================================================================== *
 * EVERY ACT IS DECIDED THROUGH THE EVALUATOR
 * ==================================================================== */

describe('no screen in this module holds a role list', () => {
  it('answers every act for every role through evaluateAccess', () => {
    for (const act of MOD_DOH_05_ACTS) {
      for (const role of ROLES) {
        const decision = actDecision(role, act.id)
        expect(decision.outcome, `${act.id}/${role}`).toBeTruthy()
        const granted = rolesGranted(act).includes(role)
        expect(decision.outcome === 'allowed', `${act.id}/${role}`).toBe(granted)
      }
    }
  })

  it('never grants an act to the Worker', () => {
    const workerGrants = MOD_DOH_05_ACTS.filter((a) => rolesGranted(a).includes('WORKER'))
    expect(workerGrants.map((a) => a.id)).toEqual([])
  })

  /**
   * EVERY DERIVED ACT IS DRAWN, AND NOTHING IS DRAWN THAT IS NOT A DERIVED
   * ACT — across BOTH routes, which is the property splitting this module
   * into two tasks would have destroyed.
   *
   * WHY THIS REPLACED AN ABSENCE ASSERTION. The component suite asks whether
   * a control named after row 5 exists, and that question can never fail: the
   * screens name the acts they draw, so an act invented by a wrong
   * classification is simply never mentioned and the absence assertion stays
   * green over a matrix that has grown a capability nobody holds. This asks
   * the reachable question instead — the drawn set against the derived set —
   * so a fourteenth act goes red for being undrawn rather than passing for
   * being unmentioned.
   */
  it('draws exactly the acts the matrix derives, across both routes', () => {
    const lifecycle = readFileSync(
      join(process.cwd(), 'app/hub/job-lifecycle-and-approval/JobLifecycleScreen.tsx'),
      'utf8',
    )
    const drawnDirectly = new Set(
      [...lifecycle.matchAll(/\bact\('([a-z0-9-]+)'\)/g)].map((m) => m[1]!),
    )
    // Two acts are decided through their command spec rather than through the
    // plain per-act helper, because both carry a per-instance condition the
    // matrix row cannot hold: row 4's maker-checker and row 10's owner field.
    const drawnByCommand = ['approve-a-job', 'decide-a-notified-class-version-adoption']
    // One act is met by the list rendering rather than by a control. A read
    // capability has no button, and pretending it does would invent one.
    const metByRendering = ['view-jobs']
    const drawn = new Set([...drawnDirectly, ...drawnByCommand, ...metByRendering])

    expect([...drawn].sort()).toEqual([...MOD_DOH_05_ACTS.map((a) => a.id)].sort())
  })

  it('names the restatement row nowhere as a control', () => {
    const screens = [
      'app/hub/job-lifecycle-and-approval/JobLifecycleScreen.tsx',
      'app/hub/job-approval-queue/JobApprovalQueueScreen.tsx',
    ].map((p) => readFileSync(join(process.cwd(), p), 'utf8'))
    for (const src of screens) {
      // It may be looked up as a ROW — the queue prints it as the reason
      // attached to row 4 — but never asked for as an act.
      expect(src).not.toContain("act('approve-a-job-the-same-identity-created')")
    }
  })

  it('holds no allowedRoles literal in either screen file', () => {
    const screens = [
      'app/hub/job-lifecycle-and-approval/JobLifecycleScreen.tsx',
      'app/hub/job-approval-queue/JobApprovalQueueScreen.tsx',
    ].map((p) => readFileSync(join(process.cwd(), p), 'utf8'))
    for (const src of screens) {
      expect(src).not.toContain('allowedRoles')
      const statuses: readonly ControlStatus[] = ['allowed', 'explicitly-prohibited']
      for (const status of statuses) {
        // The screens print the LABEL, never the union member as a decision.
        expect(src.includes(`=== '${status}'`)).toBe(false)
      }
    }
  })
})

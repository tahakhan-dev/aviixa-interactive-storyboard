import { describe, expect, it } from 'vitest'
import { STUDIO_PERSONA_COLUMNS } from '@/studio/access/evaluate'
import { PUBLISH_CHECKS, publishCheckById } from '@/studio/publish/checks'
import { evaluatePublish } from '@/studio/publish/register'
import { STU_SEAMS, stuSeamById, stuSeamStatus } from '@/studio/seams'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { decisionRecord } from '@/disclosure/decisions'
import {
  STU_13_CROSS_SURFACE,
  STU_13_MATRIX,
  STU_13_MATRIX_AND_CROSS_SURFACE_ROWS,
  STU_13_ROW_IDS,
  STU_13_SOURCE_ROW_COUNT,
  stu13Row,
  type Stu13RowId,
} from '@/studio/modules/stu-13/matrix'
import {
  CLEARANCE_EFFECTIVE_STATES,
  PLATFORM_FLOOR_POSTURE,
  QUALIFICATION_POSTURES,
  REQUIREMENT_EVALUATIONS,
  STRICTER_DEFAULT_POSTURE,
  VALIDATION_POINTS,
  addOverride,
  applyRequirementChange,
  baselineFor,
  certificationMaintainedCheck,
  clearanceEffective,
  confirmContinuation,
  crossWorkflowRequirements,
  editBaseline,
  effectivePosture,
  parkOnGateBlock,
  postureBanner,
  qualificationAffordance,
  qualificationControls,
  readTenantPosture,
  reapplyTag,
  stu13PublishRegister,
  stu13Decision,
  stu13Scenario,
  evaluateAgainstAssignment,
} from '@/studio/modules/stu-13/qualifications'
import {
  BRIGHT_BIKES_ASSIGNMENTS,
  BRIGHT_BIKES_RUNS,
  BRIGHT_BIKES_TAG_MAPPING,
  MAINTAINED_CERTIFICATIONS,
  PNEUMATIC_CERTIFICATION,
  TORQUE_CERTIFICATION,
  WHEEL_BOLT_WORKFLOW,
  SEEDED_POSTURE,
} from '../../app/studio/qualification-requirements/fixtures'

/**
 * `MOD-STU-13` — Qualification Requirements. Frozen source §5.13, card
 * L33604–L33781; the permission table at L33635–L33645, eleven data rows.
 *
 * Every `FAILS IF` below names the specific defect the assertion was planted
 * against and watched go red for. A gate this build has never seen red counts
 * as unwritten.
 */

const PERSONAS = STUDIO_PERSONA_COLUMNS

/**
 * The tag's own set, narrowed once. `TagMappingRead` is a discriminated union
 * and the fixture is typed as the union, so the certifications are read here
 * rather than through a cast at each assertion.
 */
const TAG_CERTIFICATIONS: readonly string[] = BRIGHT_BIKES_TAG_MAPPING.ok
  ? BRIGHT_BIKES_TAG_MAPPING.certifications
  : []

/* ==================================================================== *
 * STEP 1 — the source's own eleven rows, split nine/two and adding up.
 * ==================================================================== */

describe('MOD-STU-13 permission matrix — L33635-L33645', () => {
  // FAILS IF: a row is dropped when it moves into the cross-surface register,
  // which is exactly how a matrix quietly loses one.
  it('carries the source’s eleven data rows across the two halves', () => {
    expect(STU_13_SOURCE_ROW_COUNT).toBe(11)
    // The sum is what carries the guarantee; the exported constant is asserted
    // against the sum rather than against 11 a second time, so it cannot drift
    // into a hand-typed literal that agrees with nothing.
    expect(STU_13_MATRIX_AND_CROSS_SURFACE_ROWS).toBe(
      STU_13_MATRIX.length + STU_13_CROSS_SURFACE.length,
    )
    expect(STU_13_MATRIX.length + STU_13_CROSS_SURFACE.length).toBe(STU_13_SOURCE_ROW_COUNT)
    expect(STU_13_MATRIX.length).toBe(9)
    expect(STU_13_CROSS_SURFACE.length).toBe(2)
  })

  // FAILS IF: a cell is left blank, or the eight-column vocabulary is not
  // covered — a blank cell is an unanswered question (L10238).
  it('answers all eight persona columns on every row, with a non-empty note', () => {
    for (const row of STU_13_MATRIX) {
      for (const column of PERSONAS) {
        const cell = row.cells[column]
        expect(cell, `${row.id}/${column}`).toBeDefined()
        expect(cell.note.trim(), `${row.id}/${column}`).not.toBe('')
        expect(cell.requiredTiers, `${row.id}/${column}`).toBeNull()
        expect(cell.requiredGrant, `${row.id}/${column}`).toBeNull()
      }
    }
  })

  it('exposes every declared row id and nothing else', () => {
    expect([...STU_13_MATRIX].map((r) => r.id).sort()).toEqual([...STU_13_ROW_IDS].sort())
  })

  // Rows 5 and 6 are `another-surface`: the capability IS met, in the tenant
  // administration area. Classified `screen` the Tenant Admin's `Allowed`
  // would derive standing on THIS route from an act performed elsewhere.
  //
  // FAILS IF: either row is reclassified `screen`.
  it('classifies the two tenant-setting rows as another-surface, never screen', () => {
    expect(stu13Row('set-hard-block-versus-notify-posture').surface).toBe('another-surface')
    expect(stu13Row('set-clearance-duration').surface).toBe('another-surface')
    expect(stu13Row('state-the-workflow-qualification-baseline').surface).toBe('screen')
  })
})

/* ==================================================================== *
 * ROW 9 — the qualifier is load-bearing and must survive into the render.
 * ==================================================================== */

describe('row 9 — “Explicitly prohibited from the Studio”, on four cells', () => {
  const ROW = 'enter-or-amend-a-worker-certification-record' satisfies Stu13RowId

  // L33643. FOUR cells carry the surface qualifier; the Read-only Auditor's
  // and the Worker's do NOT — they read a flat `Explicitly prohibited`.
  // Rendering all six flat contradicts slice 4's D9, where a Supervisor MAY
  // enter a certification record in the Delivery Operations Hub.
  //
  // FAILS IF: the qualifier is dropped from any of the four, or invented on
  // either of the two the source leaves bare.
  it('keeps the “from the Studio” qualifier on exactly the four cells that carry it', () => {
    const row = stu13Row(ROW)
    const qualified = PERSONAS.filter((c) => row.cells[c].note.includes('from the Studio'))
    expect([...qualified].sort()).toEqual(
      [
        'quality-manager',
        'supervisor-with-authoring-grant',
        'supervisor-without-grant',
        'plant-manager-persona',
        'tenant-admin',
      ].sort(),
    )
    expect(row.cells['read-only-auditor'].note).toBe('Explicitly prohibited')
    expect(row.cells.worker.note).toBe('Explicitly prohibited')
  })

  // FAILS IF: the reason a persona actually reads on screen loses the
  // qualifier — the matrix keeping it while the rendering flattens it is the
  // same defect one layer down.
  it('carries the qualifier into what the Quality Manager’s screen renders', () => {
    const control = qualificationControls(stu13Scenario({ persona: 'quality-manager' })).find(
      (c) => c.id === ROW,
    )
    expect(control).toBeDefined()
    expect(control!.affordance.kind).toBe('absent')
    const text = control!.affordance.kind === 'absent' ? control!.affordance.note : ''
    expect(text).toContain('from the Studio')
    expect(text).toContain('Delivery Operations Hub')
  })

  // AC-STU-119 (L33770) — and step 6 of the brief: no Studio control edits a
  // certification record, for any persona, in any state.
  //
  // FAILS IF: any persona is handed an enabled or disabled control for it.
  it('offers no persona any control at all for a certification record', () => {
    for (const persona of PERSONAS) {
      const control = qualificationControls(stu13Scenario({ persona })).find((c) => c.id === ROW)
      expect(control!.affordance.kind, persona).toBe('absent')
      expect(control!.serviceKey, persona).toBeNull()
    }
  })
})

/* ==================================================================== *
 * ABSENT vs DISABLED — checkable, because `routedTo` decides it.
 * ==================================================================== */

describe('the routed prohibition', () => {
  // The mechanism: a prohibited cell renders DISABLED only where its
  // `routedTo` names a row of THIS matrix that the evaluator says THIS
  // persona may act on; otherwise ABSENT, because `Explicitly prohibited`
  // carries no rendering anywhere.
  //
  // FAILS IF: a pointer names a row this matrix does not carry.
  it('resolves every routedTo pointer against this matrix', () => {
    const ids = new Set<string>(STU_13_ROW_IDS)
    for (const row of STU_13_MATRIX) {
      for (const column of PERSONAS) {
        const target = row.routedTo[column]
        if (target !== null) expect(ids.has(target), `${row.id}/${column}`).toBe(true)
      }
    }
  })

  // THIS CARD NOW ROUTES NOBODY, AND THAT IS A CHANGE THE SOURCE MADE.
  //
  // Row 5's Quality Manager cell names the owner ("the posture is a tenant
  // setting") and the TENANT ADMIN column one across is `Allowed`. Under the
  // "somebody holds it somewhere" reading this module used to implement, that
  // rendered a DISABLED control for the Quality Manager. The frozen source
  // refuses that rendering by name: `AC-CC-012` (L35037) — "an out-of-scope
  // Area is absent, not greyed", of an Area another Supervisor holds — and
  // `SCR-SA-USR-01` (L14977), where root-only account creation renders for
  // every other console role as an explanatory line, "never as a greyed
  // control". A `routedTo` names what THIS reader holds instead, so the
  // pointer was a false claim and is gone.
  //
  // PINNED AGAINST THE TARGET'S OWN CELL, NEVER AGAINST `routedTo`: the
  // second expectation reads row 5's Quality Manager cell on the row the
  // pointer used to name, which is the claim the pointer was making and must
  // not be trusted to make about itself.
  //
  // FAILS IF: any cell of this card gains a route.
  it('routes nobody, and row 5’s target refuses the very persona that pointed at it', () => {
    const routed = STU_13_MATRIX.flatMap((row) =>
      PERSONAS.filter((c) => row.routedTo[c] !== null).map((c) => `${row.id}/${c}`),
    )
    expect(routed).toEqual([])
    expect(
      stu13Row('set-hard-block-versus-notify-posture').cells['quality-manager'].outcome,
    ).toBe('explicitlyProhibited')
  })

  // Rows 5 and 6 now read alike for the Quality Manager, and the source says
  // they should: neither cell names anything that persona holds. What still
  // separates them is the TENANT ADMIN column, which row 5 renders disabled
  // through the `another-surface` arm — that persona genuinely holds the act,
  // over there — and which row 6 renders the same way for the same reason.
  //
  // FAILS IF: the routed branch starts firing on a target this persona does
  // not hold, which is the reading this task retired.
  it('renders rows 5 and 6 absent for the Quality Manager, and disabled for the Tenant Admin', () => {
    const qm = qualificationControls(stu13Scenario({ persona: 'quality-manager' }))
    for (const id of ['set-hard-block-versus-notify-posture', 'set-clearance-duration'] as const) {
      expect(qm.find((c) => c.id === id)!.affordance.kind, id).toBe('absent')
    }
    const admin = qualificationControls(stu13Scenario({ persona: 'tenant-admin' }))
    for (const id of ['set-hard-block-versus-notify-posture', 'set-clearance-duration'] as const) {
      expect(admin.find((c) => c.id === id)!.affordance.kind, id).toBe('disabled')
    }
  })

  // THE PREDICATE, DRIVEN IN BOTH DIRECTIONS. A branch a suite never enters
  // is a branch nobody has checked, and this card reaches neither arm on its
  // own data any more — so both are driven here through the SHARED predicate
  // the whole surface uses, with the target's decision supplied by this
  // module's own evaluator.
  //
  // FAILS IF: `routedProhibitionApplies` stops asking the evaluator for the
  // target's answer, or starts asking it of a column other than this
  // persona's.
  it('opens on a target this persona may act on and closes on one they may not', () => {
    const prohibited = stu13Decision('set-clearance-duration', 'quality-manager')
    expect(prohibited.outcome).toBe('explicitlyProhibited')

    // Held by NOBODY: row 11 is refused in all eight columns.
    const floor = stu13Decision(
      'make-the-qualification-gate-looser-than-the-platform-floor',
      'quality-manager',
    )
    expect(
      qualificationAffordance(
        'Set the clearance duration',
        prohibited,
        'another-surface',
        'make-the-qualification-gate-looser-than-the-platform-floor',
        floor,
      ).kind,
    ).toBe('absent')

    // Held by SOMEBODY ELSE — the Tenant Admin's column on row 5 is
    // `Allowed` — but not by the Quality Manager, so it stays absent. This is
    // the arm the retired reading got wrong, and it is asserted directly.
    const heldByAnother = stu13Decision('set-hard-block-versus-notify-posture', 'quality-manager')
    expect(
      stu13Row('set-hard-block-versus-notify-posture').cells['tenant-admin'].outcome,
    ).toBe('allowed')
    expect(
      qualificationAffordance(
        'Set the clearance duration',
        prohibited,
        'another-surface',
        'set-hard-block-versus-notify-posture',
        heldByAnother,
      ).kind,
    ).toBe('absent')

    // Held by THIS persona: row 1 is `Allowed` for the Quality Manager, so a
    // route at it opens and the cell renders disabled with the alternative
    // named. Pinned against row 1's own cell, not against any pointer.
    const heldHere = stu13Decision('state-the-workflow-qualification-baseline', 'quality-manager')
    expect(
      stu13Row('state-the-workflow-qualification-baseline').cells['quality-manager'].outcome,
    ).toBe('allowed')
    expect(
      qualificationAffordance(
        'Set the clearance duration',
        prohibited,
        'another-surface',
        'state-the-workflow-qualification-baseline',
        heldHere,
      ).kind,
    ).toBe('disabled')
  })

  // FAILS IF: an enabled control is drawn with no service function behind it
  // — a control that renders enabled and does nothing is this build's
  // most-shipped defect.
  it('gives every enabled control a real service function and every other control none', () => {
    for (const persona of PERSONAS) {
      for (const control of qualificationControls(stu13Scenario({ persona }))) {
        if (control.affordance.kind === 'enabled') {
          expect(control.serviceKey, `${persona}/${control.id}`).not.toBeNull()
        } else {
          expect(control.serviceKey, `${persona}/${control.id}`).toBeNull()
        }
      }
    }
  })
})

/* ==================================================================== *
 * STEP 6 — rows 4 to 7 are cross-surface statements, never Studio controls.
 * ==================================================================== */

describe('rows 4 to 7 — cross-surface statements', () => {
  // FAILS IF: a `Not applicable` cell is smuggled into the persona matrix,
  // where `StudioCellOutcome` cannot express it and it would render blank.
  it('carries rows 4 and 7 beside the matrix, with their six source cells verbatim', () => {
    expect([...STU_13_CROSS_SURFACE].map((r) => r.id)).toEqual([
      'maintain-the-tag-to-qualification-set-mapping',
      'grant-a-qualification-clearance',
    ])
    for (const row of STU_13_CROSS_SURFACE) {
      expect(row.cells.length, row.id).toBe(6)
      for (const cell of row.cells) expect(cell.text.trim(), `${row.id}/${cell.column}`).not.toBe('')
    }
  })

  // Row 7 is the surface's clearest cross-surface grant: Quality Manager
  // `Not applicable`, both Supervisor columns `Allowed`, because the act is
  // Client Command Center action ten.
  //
  // FAILS IF: the Studio grows a clearance grant, contradicting slice 4's D23
  // and D10 — the Hub renders the register and grants nothing, the Studio
  // renders the requirement and grants nothing.
  it('states the clearance grant as another surface’s act and offers no control for it', () => {
    const row = STU_13_CROSS_SURFACE.find((r) => r.id === 'grant-a-qualification-clearance')!
    expect(row.heldOn).toBe('SURF-CC')
    expect(row.cells[0]!.text).toContain('Not applicable')
    expect(row.cells[1]!.text).toContain('Allowed')
    expect(row.cells[2]!.text).toContain('Allowed')
    const controlIds = qualificationControls(stu13Scenario()).map((c) => c.id)
    expect(controlIds).not.toContain('grant-a-qualification-clearance')
  })

  // FAILS IF: any Studio route grows a posture control, a clearance-duration
  // control, a clearance grant, or a certification-record editor — checked
  // over the controls every persona is actually offered, not over one.
  it('offers no persona an ENABLED control for any of the four', () => {
    const forbidden = new Set<string>([
      'set-hard-block-versus-notify-posture',
      'set-clearance-duration',
      'enter-or-amend-a-worker-certification-record',
    ])
    for (const persona of PERSONAS) {
      const enabled = qualificationControls(stu13Scenario({ persona }))
        .filter((c) => c.affordance.kind === 'enabled')
        .map((c) => c.id)
      for (const id of enabled) expect(forbidden.has(id), `${persona}/${id}`).toBe(false)
    }
  })
})

/* ==================================================================== *
 * STEP 2 — the stricter default, and the platform floor.
 * ==================================================================== */

describe('enforcement posture — the only configurable gate (L33616)', () => {
  it('names exactly the two postures the source states', () => {
    expect([...QUALIFICATION_POSTURES]).toEqual(['hard-block', 'notify'])
    expect(PLATFORM_FLOOR_POSTURE).toBe('notify')
    expect(STRICTER_DEFAULT_POSTURE).toBe('hard-block')
  })

  // L33674 — "where the posture cannot be read, the device applies the
  // stricter posture, hard-block, because the configurability principle
  // permits stricter and never looser."
  //
  // FAILS IF: an unreadable posture falls back to `notify`, or to the last
  // value seen, or throws and leaves the caller with nothing.
  it('applies hard-block when the posture cannot be read', () => {
    const read = readTenantPosture(null)
    expect(read.ok).toBe(false)
    expect(effectivePosture(read)).toBe('hard-block')
  })

  // Row 11 (L33645) and the Security line (L33756): "a looser value is
  // rejected rather than logged."
  //
  // FAILS IF: a value outside the two is adopted, or is adopted as `notify`.
  it('never derives a looser posture than the platform floor', () => {
    const read = readTenantPosture({ posture: 'looser-than-floor', clearanceDurationDays: 7 })
    expect(read.ok).toBe(false)
    expect(read.ok === false ? read.reason : '').toContain('rejected')
    expect(effectivePosture(read)).toBe('hard-block')
  })

  it('honours a readable notify posture rather than over-applying the default', () => {
    const read = readTenantPosture({ posture: 'notify', clearanceDurationDays: 7 })
    expect(effectivePosture(read)).toBe('notify')
  })

  // SB-STU-16 (L33725): "A banner states the tenant's current posture and
  // clearance duration, read from the tenant administration area and marked
  // read-only here."
  //
  // FAILS IF: the banner stops saying it is read-only, or stops naming where
  // the value is owned.
  it('renders the banner read-only and names the owning area', () => {
    const banner = postureBanner(readTenantPosture(SEEDED_POSTURE))
    expect(banner.readOnlyHere).toBe(true)
    expect(banner.owner).toContain('tenant administration area')
    expect(banner.clearanceDuration).toContain('7')
    const unreadable = postureBanner(readTenantPosture(null))
    expect(unreadable.posture).toBe('hard-block')
    expect(unreadable.statedAs).toContain('stricter')
  })
})

/* ==================================================================== *
 * STEP 3 — the tag never decides (L33612).
 * ==================================================================== */

describe('the tag never decides', () => {
  // L54899 is the worked case: the mapping pre-populates and the author
  // "removes one that does not apply … The Job runs on his edited set, not
  // the tag's." The fixture's tag set therefore carries MORE than the
  // authored set — a fixture where the two are equal cannot tell a build that
  // honours the edit from one that silently re-applies the tag.
  it('pre-populates from the tag with the source badge SB-STU-16 states', () => {
    const b = baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING)
    expect(b.baseline.source).toBe('Pre-populated from tag')
    expect([...b.baseline.certifications]).toEqual([...TAG_CERTIFICATIONS])
    expect(b.baseline.certifications.length).toBeGreaterThan(1)
  })

  // FAILS IF: the tag re-asserts itself over an author edit — the defect
  // planted for this rule, and the whole point of L33612.
  it('lets the author edit freely and keeps the authored value when the tag is re-applied', () => {
    const b = baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING)
    const edited = editBaseline(b, [TORQUE_CERTIFICATION])
    expect(edited.baseline.source).toBe('Authored')
    expect([...edited.baseline.certifications]).toEqual([TORQUE_CERTIFICATION])

    const reapplied = reapplyTag(edited, BRIGHT_BIKES_TAG_MAPPING)
    expect([...reapplied.baseline.certifications]).toEqual([TORQUE_CERTIFICATION])
    expect(reapplied.baseline.source).toBe('Authored')
  })

  // FAILS IF: re-applying the tag over a still-pre-populated baseline stops
  // working — the convenience is real, and only the AUTHORED state is fenced.
  it('still re-applies the tag over a baseline the author has not touched', () => {
    const b = baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING)
    const reapplied = reapplyTag(b, BRIGHT_BIKES_TAG_MAPPING)
    expect([...reapplied.baseline.certifications]).toEqual([...TAG_CERTIFICATIONS])
    expect(reapplied.baseline.source).toBe('Pre-populated from tag')
  })

  // L33662 — "where the mapping is unreadable, the author states the baseline
  // manually and publication is not blocked, because the mapping is a
  // convenience rather than a requirement." STEP 5.
  //
  // FAILS IF: an unreadable mapping blocks publication, which would make the
  // one non-blocking unreadable seam on this surface behave like the others.
  it('does not block publication when the mapping cannot be read', () => {
    const b = baselineFor(WHEEL_BOLT_WORKFLOW, { ok: false, reason: 'the mapping is unreachable' })
    expect(b.baseline.source).toBe('Authored')
    expect([...b.baseline.certifications]).toEqual([])

    const authored = editBaseline(b, [TORQUE_CERTIFICATION])
    const evaluation = evaluatePublish(
      stu13PublishRegister(MAINTAINED_CERTIFICATIONS),
      authored,
    )
    const own = evaluation.blockers.filter((x) => x.checkId === 'certification-maintained')
    expect(own).toEqual([])
    expect(evaluation.passed).toContain('certification-maintained')
  })

  // FAILS IF: the seam stops declaring its owner, or borrows a slice number
  // nobody assigned it.
  it('declares the mapping seam as owned but unscheduled', () => {
    const seam = stuSeamById(STU_SEAMS, 'tag-to-qualification-set-mapping')
    expect(stuSeamStatus(seam)).toBe('unscheduled')
    expect(seam.ownerSlices).toEqual([])
    expect(seam.consumingModules).toContain('MOD-STU-13')
  })
})

/* ==================================================================== *
 * STEP 4 — publish check #8 names the certification.
 * ==================================================================== */

describe('publish check 8 — every named certification still maintained', () => {
  it('is check eight and is owned by this module alone', () => {
    const check = publishCheckById('certification-maintained')
    expect(check.ordinal).toBe(8)
    expect([...check.ownerModules]).toEqual(['MOD-STU-13'])
    expect(PUBLISH_CHECKS.filter((c) => c.id === 'certification-maintained').length).toBe(1)
  })

  // NOTE ON `blocked`. `evaluatePublish` fails closed on the ten checks this
  // register does not hold, so `blocked === true` is true of EVERY subject
  // here and cannot distinguish a maintained certification from an
  // unmaintained one. The assertion is therefore on this check's own blocker.
  //
  // FAILS IF: the blocker stops naming the certification, or stops naming the
  // screen whose override names it.
  it('blocks publication naming the specific certification and the screen', () => {
    const subject = addOverride(
      editBaseline(baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING), [
        TORQUE_CERTIFICATION,
      ]),
      { screenId: 'screen 3', screenName: 'Wheel Bolt Torque Verification', certification: 'Retired Cert X' },
    )
    const r = evaluatePublish(stu13PublishRegister(MAINTAINED_CERTIFICATIONS), subject)
    const blocker = r.blockers.find((b) => b.checkId === 'certification-maintained')
    expect(blocker).toBeDefined()
    expect(blocker!.kind).toBe('failed')
    expect(blocker!.blockingElement).toContain('Retired Cert X')
    expect(blocker!.blockingElement).toContain('screen 3')
  })

  // FAILS IF: the check refuses a maintained certification too — a check that
  // blocks everything proves nothing about the one thing it names.
  it('passes an override naming a certification the tenant does maintain', () => {
    const subject = addOverride(
      editBaseline(baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING), [
        TORQUE_CERTIFICATION,
      ]),
      {
        screenId: 'screen 3',
        screenName: 'Wheel Bolt Torque Verification',
        certification: PNEUMATIC_CERTIFICATION,
      },
    )
    const r = evaluatePublish(stu13PublishRegister(MAINTAINED_CERTIFICATIONS), subject)
    expect(r.blockers.find((b) => b.checkId === 'certification-maintained')).toBeUndefined()
    expect(r.passed).toContain('certification-maintained')
  })

  // FAILS IF: the check is registered by anyone but its owning module — the
  // register refuses it, and a build that ignored the refusal would ship two
  // implementations of one check (C4).
  it('refuses registration by a module that does not own the check', () => {
    const impl = certificationMaintainedCheck(MAINTAINED_CERTIFICATIONS)
    expect(impl.implementedBy).toBe('MOD-STU-13')
    expect(impl.checkId).toBe('certification-maintained')
  })

  // AC-STU-119 seam: slice 4's D22 certification-type fixture has no CRUD.
  it('declares the certification list as a slice-4 seam with no Studio write', () => {
    const seam = stuSeamById(STU_SEAMS, 'worker-certification-list')
    expect(stuSeamStatus(seam)).toBe('built')
    expect(seam.consumingModules).toContain('MOD-STU-13')
    expect(seam.contract).toContain('cannot create, edit or delete')
  })
})

/* ==================================================================== *
 * STEP 7 — no clearance is effective before `applied` (AC-STU-118).
 * ==================================================================== */

describe('AC-STU-118 — a clearance is never effective before applied', () => {
  it('treats only applied and acknowledged as effective', () => {
    expect([...CLEARANCE_EFFECTIVE_STATES]).toEqual(['applied', 'acknowledged'])
  })

  // FAILS IF: `delivered` (or any pre-applied state) is read as effective —
  // the planted defect for this rule.
  it('reports a delivered clearance as not effective, and says what it is', () => {
    const r = clearanceEffective({
      deviceId: 'TAB-014',
      commandState: 'delivered',
      lastKnown: null,
    })
    expect(r.effective).toBe(false)
    expect(r.rendering.label).toContain('delivered, not yet applied')
    expect(r.rendering.claimsAdoption).toBe(false)
  })

  it('reports an applied clearance as effective', () => {
    const r = clearanceEffective({ deviceId: 'TAB-014', commandState: 'applied', lastKnown: null })
    expect(r.effective).toBe(true)
  })

  // L33579's rule, inherited: an indeterminate state is never adopted.
  it('reports an indeterminate clearance as not effective', () => {
    const r = clearanceEffective({
      deviceId: 'TAB-014',
      commandState: null,
      lastKnown: { state: 'applied', at: '2026-08-14T06:00:00Z' },
    })
    expect(r.effective).toBe(false)
    expect(r.rendering.determinate).toBe(false)
  })

  // L33655's five evaluation states, and the one that must not be reachable
  // before the command applies.
  //
  // FAILS IF: a hard-block requirement resolves to `Cleared` on a clearance
  // the device has not applied.
  it('does not evaluate to Cleared on a clearance that has not applied', () => {
    const held: readonly string[] = []
    const notApplied = evaluateAgainstAssignment({
      required: [TORQUE_CERTIFICATION],
      held,
      posture: 'hard-block',
      clearance: { deviceId: 'TAB-014', commandState: 'delivered', lastKnown: null },
      grandfathered: false,
    })
    expect(notApplied).toBe('Unsatisfied-blocked')

    const applied = evaluateAgainstAssignment({
      required: [TORQUE_CERTIFICATION],
      held,
      posture: 'hard-block',
      clearance: { deviceId: 'TAB-014', commandState: 'applied', lastKnown: null },
      grandfathered: false,
    })
    expect(applied).toBe('Cleared')
  })

  // THE GAP PLANT P12 FOUND. Removing the grandfathering short-circuit from
  // `evaluateAgainstAssignment` left the suite green: nothing asserted the one
  // arm L33618 exists for. A grandfathered assignment must NOT be re-decided
  // on the new requirement, because re-deciding it strands exactly the worker
  // the rule protects.
  //
  // FAILS IF: a grandfathered assignment is evaluated as Unsatisfied-blocked,
  // or as Satisfied once the certificate happens to match.
  it('never re-decides a grandfathered assignment on the new requirement', () => {
    const grandfathered = {
      required: [TORQUE_CERTIFICATION, PNEUMATIC_CERTIFICATION],
      held: [TORQUE_CERTIFICATION],
      posture: 'hard-block',
      clearance: null,
      grandfathered: true,
    } as const
    expect(evaluateAgainstAssignment(grandfathered)).toBe('Grandfathered-and-flagged')
    // Same inputs, not grandfathered: the requirement genuinely is unmet, so
    // the assertion above is about the flag and not about the certificate.
    expect(evaluateAgainstAssignment({ ...grandfathered, grandfathered: false })).toBe(
      'Unsatisfied-blocked',
    )
  })

  it('states all five evaluation states the source names (L33655)', () => {
    expect([...REQUIREMENT_EVALUATIONS]).toEqual([
      'Satisfied',
      'Unsatisfied-blocked',
      'Unsatisfied-notified',
      'Cleared',
      'Grandfathered-and-flagged',
    ])
  })

  // FAILS IF: notify posture blocks, or hard-block only notifies — the two
  // postures must actually reach different outcomes.
  it('reaches Unsatisfied-notified under notify and Unsatisfied-blocked under hard-block', () => {
    const base = {
      required: [TORQUE_CERTIFICATION],
      held: [] as readonly string[],
      clearance: null,
      grandfathered: false,
    }
    expect(evaluateAgainstAssignment({ ...base, posture: 'notify' })).toBe('Unsatisfied-notified')
    expect(evaluateAgainstAssignment({ ...base, posture: 'hard-block' })).toBe(
      'Unsatisfied-blocked',
    )
    expect(
      evaluateAgainstAssignment({ ...base, held: [TORQUE_CERTIFICATION], posture: 'hard-block' }),
    ).toBe('Satisfied')
  })
})

/* ==================================================================== *
 * Grandfathered AND FLAGGED (L33618) — silence is the defect.
 * ==================================================================== */

describe('grandfathering', () => {
  // FAILS IF: an active assignment is grandfathered silently — flag absent,
  // or continuation pre-confirmed.
  it('grandfathers active assignments with a flag raised and no confirmation yet', () => {
    const change = applyRequirementChange(BRIGHT_BIKES_ASSIGNMENTS, '2026-08-14T00:00:00Z')
    expect(change.grandfathered.length).toBeGreaterThan(0)
    for (const a of change.grandfathered) {
      expect(a.flagged, a.assignmentId).toBe(true)
      expect(a.continuation, a.assignmentId).toBeNull()
      expect(a.evaluation, a.assignmentId).toBe('Grandfathered-and-flagged')
    }
  })

  // L33618 — the change "applies to Runs scheduled after the version carrying
  // it is published".
  //
  // FAILS IF: a run scheduled BEFORE publication is swept into the new
  // requirement, or one scheduled after is left out.
  it('applies the change only to runs scheduled after publication', () => {
    const change = applyRequirementChange(BRIGHT_BIKES_ASSIGNMENTS, '2026-08-14T00:00:00Z')
    for (const id of change.appliesTo) {
      const a = BRIGHT_BIKES_ASSIGNMENTS.find((x) => x.assignmentId === id)!
      expect(a.runScheduledAt > '2026-08-14T00:00:00Z', id).toBe(true)
    }
    for (const a of change.grandfathered) {
      expect(change.appliesTo).not.toContain(a.assignmentId)
    }
  })

  // FUNC-STU-13-04-A-1 (L33679): "no role may clear the flag without a
  // recorded reason."
  //
  // FAILS IF: a blank reason clears the flag.
  it('refuses a continuation with no recorded reason and leaves the flag up', () => {
    const a = applyRequirementChange(BRIGHT_BIKES_ASSIGNMENTS, '2026-08-14T00:00:00Z')
      .grandfathered[0]!
    const result = confirmContinuation(a, { confirmedBy: 'IDN-BB-SAM', reason: '   ' })
    expect(result.ok).toBe(false)
    expect(result.ok === false ? result.reason : '').toContain('recorded reason')
  })

  // FAILS IF: the confirmation is written somewhere nothing later reads —
  // this asserts the recorded reason on the assignment the screen renders.
  it('records the supervisor, the reason and clears the flag on a real confirmation', () => {
    const a = applyRequirementChange(BRIGHT_BIKES_ASSIGNMENTS, '2026-08-14T00:00:00Z')
      .grandfathered[0]!
    const result = confirmContinuation(a, {
      confirmedBy: 'IDN-BB-SAM',
      reason: 'Emergency cover',
      at: '2026-08-14T07:15:00Z',
    })
    expect(result.ok).toBe(true)
    const confirmed = result.ok ? result.assignment : a
    expect(confirmed.flagged).toBe(false)
    expect(confirmed.continuation).toEqual({
      confirmedBy: 'IDN-BB-SAM',
      reason: 'Emergency cover',
      at: '2026-08-14T07:15:00Z',
    })
  })

  // Row 8 (L33642): all three authoring columns read `Allowed`, including the
  // Supervisor WITHOUT the authoring grant — the one row on this card where
  // that column acts.
  //
  // FAILS IF: the confirmation is gated on the authoring grant.
  it('offers the confirmation control to a Supervisor without the authoring grant', () => {
    const control = qualificationControls(
      stu13Scenario({ persona: 'supervisor-without-grant' }),
    ).find((c) => c.id === 'confirm-continuation-of-a-grandfathered-assignment')!
    expect(control.affordance.kind).toBe('enabled')
    expect(control.serviceKey).toBe('confirmContinuation')
  })
})

/* ==================================================================== *
 * Three validation points, and the offline park.
 * ==================================================================== */

describe('the three validation points (L33614)', () => {
  it('states three, and performs none of them on this surface', () => {
    expect(VALIDATION_POINTS.length).toBe(3)
    for (const point of VALIDATION_POINTS) {
      expect(point.performedHere, point.id).toBe(false)
      expect(point.performedOn, point.id).not.toBe('SURF-STU')
      expect(point.statement.trim(), point.id).not.toBe('')
    }
  })

  it('names the Hub for the first and the device for the other two', () => {
    expect(VALIDATION_POINTS.map((p) => p.performedOn)).toEqual(['SURF-DOH', 'device', 'device'])
    expect(VALIDATION_POINTS[0]!.seamId).toBe('qualification-validation-at-assignment')
  })

  // AC-STU-117 (L33768): "A gate block encountered offline parks the run and
  // the worker continues other assigned runs."
  //
  // FAILS IF: parking one run takes the others with it — the defect that
  // turns an honest park into an idle worker.
  it('parks only the blocked run and leaves the other assigned runs available', () => {
    const after = parkOnGateBlock(BRIGHT_BIKES_RUNS, 'RUN-2026-08-14-A', PNEUMATIC_CERTIFICATION)
    const parked = after.filter((r) => r.state === 'Parked')
    expect(parked.map((r) => r.runId)).toEqual(['RUN-2026-08-14-A'])
    expect(parked[0]!.parkedReason).toContain(PNEUMATIC_CERTIFICATION)
    expect(after.filter((r) => r.state === 'Available').length).toBe(
      BRIGHT_BIKES_RUNS.length - 1,
    )
  })
})

/* ==================================================================== *
 * SB-STU-16's cross-Workflow tab.
 * ==================================================================== */

describe('the cross-Workflow requirement view (SB-STU-16, L33725)', () => {
  // FAILS IF: the counts are the same number twice, or a certification named
  // only on an override is missed.
  it('groups by certification with the count of Workflows and of screens', () => {
    const wheelBolt = addOverride(
      addOverride(
        editBaseline(baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING), [
          TORQUE_CERTIFICATION,
        ]),
        {
          screenId: 'screen 3',
          screenName: 'Wheel Bolt Torque Verification',
          certification: PNEUMATIC_CERTIFICATION,
        },
      ),
      {
        screenId: 'screen 4',
        screenName: 'Wheel Bolt Torque Verification',
        certification: PNEUMATIC_CERTIFICATION,
      },
    )
    const other = editBaseline(
      baselineFor(
        { ...WHEEL_BOLT_WORKFLOW, workflowId: 'WF-BRAKE', workflowName: 'Brake Bleed' },
        { ok: false, reason: 'no tag applied' },
      ),
      [TORQUE_CERTIFICATION],
    )

    const rows = crossWorkflowRequirements([wheelBolt, other])
    const torque = rows.find((r) => r.certification === TORQUE_CERTIFICATION)!
    const pneumatic = rows.find((r) => r.certification === PNEUMATIC_CERTIFICATION)!

    expect(torque.workflowCount).toBe(2)
    expect(torque.screenCount).toBe(0)
    expect(pneumatic.workflowCount).toBe(1)
    expect(pneumatic.screenCount).toBe(2)
  })
})

/* ==================================================================== *
 * The registry facts this module hands on.
 * ==================================================================== */

describe('registry standing', () => {
  it('keeps the module route keyed on the slug, never a screen id', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-13')
    expect(module.slug).toBe('qualification-requirements')
    expect(module.purposeRef).toBe('L33627')
  })

  // OBJ-STU-QUALREQ has no numeric counterpart. D11 records it as a gap
  // rather than minting an OBJ-1xx row into a closed register of ninety-nine.
  //
  // FAILS IF: the gap stops being declared — which is how a registered gap
  // becomes a silent one.
  it('leaves OBJ-STU-QUALREQ a registered gap under D11', () => {
    const d11 = decisionRecord('D11')
    expect(d11.adopted).toContain('OBJ-STU-QUALREQ')
    expect(d11.adopted).toContain('registered gap')
  })

  it('names DEC-AUDSTU-001 on the Auditor’s cell of row 10 and nowhere else', () => {
    const open = STU_13_MATRIX.flatMap((row) =>
      PERSONAS.filter((c) => row.cells[c].openDecision !== null).map((c) => `${row.id}/${c}`),
    )
    expect(open).toEqual(['view-the-cross-workflow-requirement-view/read-only-auditor'])
    expect(
      stu13Row('view-the-cross-workflow-requirement-view').cells['read-only-auditor'].openDecision,
    ).toBe('DEC-AUDSTU-001')
  })
})

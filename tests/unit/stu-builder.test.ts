/**
 * `MOD-STU-04` — the Workflow Builder.
 *
 * Every case carries a `// FAILS IF:` naming the SINGLE change that makes it
 * red. A case whose `FAILS IF` cannot be written is a case that asserts
 * nothing, and this build has shipped four of those.
 *
 * NODE ENVIRONMENT. `tests/unit/**` runs under `environment: 'node'`
 * (`vitest.config.ts`), so there is no DOM here and `render`/`screen` do not
 * exist. The brief's step-2 and step-4 cases are written with JSX and
 * `@testing-library` helpers in a `.ts` file inside this project — they
 * cannot compile, let alone run. They are carried here against the RENDERING
 * MODEL instead, which is the stronger form of the same assertion: a control
 * that is `absent` in the model cannot be drawn, whereas a DOM query proves
 * only that one component did not draw it today. Reported as a finding.
 */
import { describe, expect, it } from 'vitest'
import { tenantId } from '@/domain/ids'
import { permitsAction } from '@/policy/decision'
import { PUBLISH_CHECKS, publishChecksOwnedBy } from '@/studio/publish/checks'
import { evaluatePublish, registerPublishChecks } from '@/studio/publish/register'
import { JOURNEY_STEPS } from '@/studio/journey/effects'
import { INITIAL_JOURNEY_STATE, type JourneyState } from '@/studio/journey/fixture'
import { reachByStudioMatrix, STU_PERSONAS } from '@/studio/modules'
import { STUDIO_PERSONA_COLUMNS } from '@/studio/access/evaluate'
import { INHERITABLE_DEFAULTS, WORKFLOW_SETTINGS } from '@/studio/vocab/authoring'
import { SEEDED_LIBRARY_REGISTER } from '@/studio/modules/stu-07/libraries'
import {
  STU_04_MATRIX,
  STU_04_CAPABILITY_IDS,
  stu04Row,
  type Stu04CapabilityId,
} from '@/studio/modules/stu-04/matrix'
import {
  PLATFORM_DEVIATION_CAPTURE_SCREEN,
  REASONABLE_BRANCH_DEPTH,
  SEEDED_CANVAS_REGISTER,
  SEEDED_BUILDER_WORKFLOW,
  WORKFLOW_KEYS,
  branchTarget,
  builderDraftProjection,
  drawnOrder,
  forkGuidance,
  gateFailureTarget,
  inheritableDefaults,
  previewSequence,
  sequenceDetectionReference,
  structureFingerprint,
  validateStructure,
  workflowSettings,
  type WorkflowDraft,
} from '@/studio/modules/stu-04/workflow'
import {
  BUILDER_WRITE_ACTIONS,
  addScreenNode,
  builderService,
  drawBranch,
  onReconnect,
  overrideGateFailureTarget,
  removeScreenNode,
  reorderScreenNodes,
  setInheritableDefault,
  setWorkflowSetting,
  submissionEligibility,
  type BuilderActor,
  type BuilderAuditEntry,
  type BuilderAuditWrite,
} from '@/studio/modules/stu-04/writes'
import {
  BUILDER_CONTROLS,
  SEVERITY_PROHIBITION_NOTE,
  VALIDATION_PANEL_HEADING,
  builderAffordance,
  builderCheckRegister,
  builderControls,
  decisionForRow,
  draftCanvasFor,
  escalationTemplateOptions,
  publishedCanvasFor,
  readableWorkflows,
  scenario,
  validationPanel,
} from '@/studio/modules/stu-04/rendering'

const ACTOR: BuilderActor = {
  identityId: 'IDN-BB-SAM',
  displayName: 'supervisor-with-authoring-grant',
  tenant: tenantId('TEN-BRIGHT-BIKES'),
}

const ACCEPTS: BuilderAuditWrite = () => ({ ok: true })
const REFUSES: BuilderAuditWrite = () => ({ ok: false, reason: 'the tenant audit log is unreachable' })

function recording(): { write: BuilderAuditWrite; entries: BuilderAuditEntry[] } {
  const entries: BuilderAuditEntry[] = []
  return {
    entries,
    write: (entry) => {
      entries.push(entry)
      return { ok: true }
    },
  }
}

/** The author's own decision for one capability — a real evaluator answer. */
function authorDecision(id: Stu04CapabilityId) {
  return decisionForRow(stu04Row(id), scenario({ persona: 'quality-manager' }))
}

const wf = () => SEEDED_BUILDER_WORKFLOW

/* ==================================================================== *
 * STEP 1 — the source's own table.
 * ==================================================================== */

describe('the permission matrix transcribed from L32059-L32070', () => {
  it('carries ten data rows and answers all eight persona columns on every one', () => {
    // FAILS IF: a row is dropped from STU_04_MATRIX, or a cell is omitted
    // for one of the eight columns (a blank cell reads as "withheld"
    // without anybody writing it down).
    expect(STU_04_MATRIX).toHaveLength(10)
    for (const row of STU_04_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].note.trim()).not.toBe('')
      }
    }
  })

  it('closes the capability vocabulary against the matrix in both directions', () => {
    // FAILS IF: a capability id is added to the union without a row, or a
    // row is added without an id — the exhaustiveness check catches one
    // direction at compile time and this catches the other at run time.
    expect(STU_04_MATRIX.map((r) => r.id).sort()).toEqual([...STU_04_CAPABILITY_IDS].sort())
    expect(new Set(STU_04_CAPABILITY_IDS).size).toBe(STU_04_CAPABILITY_IDS.length)
  })

  it('states the derivation for the one column the card does not head', () => {
    // FAILS IF: the Plant Manager cell stops being mirrored from the
    // without-grant column, or the derivation stops naming the decision it
    // was derived from — a filled cell with no written derivation is a
    // guess nobody can audit.
    for (const row of STU_04_MATRIX) {
      expect(row.derivation['plant-manager-persona'], row.id).toContain('DEC-ROLE-001')
      expect(row.cells['plant-manager-persona']).toEqual(row.cells['supervisor-without-grant'])
      // Every column the card DOES head is a transcription, not an inference.
      expect(row.derivation['quality-manager'], row.id).toBeNull()
      expect(row.derivation['implementation-team'], row.id).toBeNull()
    }
  })

  it('offers the module route to seven personas and withholds it from the Worker', () => {
    // FAILS IF: any cell of rows 2 or 10 stops reading `readOnly` for the
    // Supervisor-without-grant, the Plant Manager persona or the Tenant
    // Admin — those three reach this route ONLY through the published
    // canvas. Also red if the Worker gains any non-refusing cell.
    const reach = reachByStudioMatrix(STU_04_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach).toEqual({
      'quality-manager': 'offered',
      'supervisor-with-authoring-grant': 'offered',
      'supervisor-without-grant': 'offered',
      'plant-manager-persona': 'offered',
      'tenant-admin': 'offered',
      'read-only-auditor': 'client-decision-open',
      worker: 'withheld',
      'implementation-team': 'offered',
    })
    // The vocabulary is the shell's, not a second list maintained here.
    expect(Object.keys(reach).sort()).toEqual(STU_PERSONAS.map((p) => p.id).sort())
  })
})

/* ==================================================================== *
 * STEP 2 — R15. Two reads, and the draft canvas is not one of them.
 * ==================================================================== */

describe('R15 — the draft canvas is not READ by a role without the grant', () => {
  it('refuses the draft canvas to a Supervisor without the grant and to the Tenant Admin', () => {
    // FAILS IF: row 1's `supervisor-without-grant` or `tenant-admin` cell is
    // softened from `explicitlyProhibited` to `readOnly` — the single change
    // a "one canvas with a read-only flag" build makes.
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      const r = draftCanvasFor(scenario({ persona }), SEEDED_CANVAS_REGISTER, 'WF-BB-TORQUE')
      expect(r.ok).toBe(false)
      expect(r.outcome).toBe('explicitlyProhibited')
      // No draft comes back at all. Not a disabled editor around one.
      expect('workflow' in r).toBe(false)
    }
  })

  it('does not READ the draft register when it refuses — the read, not the render', () => {
    // FAILS IF: `draftCanvasFor` looks the workflow up before asking the
    // evaluator. This is AC-STU-048 and AC-STU-151 tested as reads: a list
    // that loads every draft and then hides some has already loaded them.
    let reads = 0
    const spying = {
      get drafts() {
        reads += 1
        return SEEDED_CANVAS_REGISTER.drafts
      },
      published: SEEDED_CANVAS_REGISTER.published,
    }
    draftCanvasFor(scenario({ persona: 'supervisor-without-grant' }), spying, 'WF-BB-TORQUE')
    expect(reads).toBe(0)
    draftCanvasFor(scenario({ persona: 'quality-manager' }), spying, 'WF-BB-TORQUE')
    expect(reads).toBe(1)
  })

  it('gives those same roles the PUBLISHED canvas read-only with the cause named', () => {
    // FAILS IF: row 2's cell for either persona changes token, or the
    // evaluator stops carrying the cell's own words into `reason`.
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      const r = publishedCanvasFor(scenario({ persona }), SEEDED_CANVAS_REGISTER, 'WF-BB-TORQUE')
      expect(r.outcome).toBe('readOnly')
      expect(r.cause).toBeTruthy()
      expect(r.cause).toMatch(/read-only/i)
      expect(r.ok).toBe(true)
    }
  })

  it('renders no editing affordance at all for a read-only role', () => {
    // FAILS IF: any control's affordance stops being `absent` for a
    // read-only persona — including if one becomes a DISABLED control,
    // which L32171 forbids by name ("rather than a disabled editor").
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      const drawn = builderControls(scenario({ persona }))
      const editing = drawn.filter((c) => c.capabilityId !== 'preview-the-sequence')
      expect(editing.length).toBeGreaterThan(0)
      expect(editing.map((c) => c.affordance.kind)).toEqual(editing.map(() => 'absent'))
    }
  })

  it('withholds every draft from what a read-only role READS, naming the reason', () => {
    // FAILS IF: `readableWorkflows` filters after loading, or stops naming
    // the missing condition (AC-STU-155).
    const r = readableWorkflows(scenario({ persona: 'tenant-admin' }), SEEDED_CANVAS_REGISTER)
    // Guarded: `every` on an empty list is true, and a filter that returned
    // nothing would satisfy the line below without enforcing anything.
    expect(r.workflows.length).toBeGreaterThan(0)
    expect(r.workflows.every((w) => w.lifecycle === 'Published')).toBe(true)
    expect(r.withheldCount).toBe(SEEDED_CANVAS_REGISTER.drafts.length)
    expect(r.withheldReason).toBeTruthy()
    const author = readableWorkflows(scenario({ persona: 'quality-manager' }), SEEDED_CANVAS_REGISTER)
    expect(author.withheldCount).toBe(0)
    expect(author.workflows.length).toBeGreaterThan(r.workflows.length)
  })

  it('keeps the Read-only Auditor an open decision on both canvases', () => {
    // FAILS IF: DEC-AUDSTU-001 is guessed in either direction on rows 1, 2
    // or 10 — AC-STU-157 forbids assuming either answer.
    const s = scenario({ persona: 'read-only-auditor' })
    expect(draftCanvasFor(s, SEEDED_CANVAS_REGISTER, 'WF-BB-TORQUE').outcome).toBe(
      'clientDecisionRequired',
    )
    expect(publishedCanvasFor(s, SEEDED_CANVAS_REGISTER, 'WF-BB-TORQUE').outcome).toBe(
      'clientDecisionRequired',
    )
  })
})

/* ==================================================================== *
 * STEP 3 — R4. One structure.
 * ==================================================================== */

describe('R4 — the sequence-detection reference is DERIVED from the drawn graph', () => {
  it('has no second store: the workflow carries exactly six fields and none is a reference', () => {
    // FAILS IF: any field is added to `WorkflowDraft`. The expected set is
    // written out HERE rather than read from `WORKFLOW_KEYS`, and that is
    // the whole point: a build that stored a second reference would add it
    // to the exported list too, and an assertion comparing the object with
    // that list would agree with itself. Found by planting exactly that
    // defect and watching this case stay green.
    const SIX = ['branches', 'defaults', 'id', 'lifecycle', 'nodes', 'settings']
    expect(Object.keys(wf()).sort()).toEqual(SIX)
    expect([...WORKFLOW_KEYS].sort()).toEqual(SIX)
    expect(WORKFLOW_KEYS).not.toContain('sequenceReference')
    expect(WORKFLOW_KEYS).not.toContain('detectionOrder')
  })

  it('changes the reference when the drawn order changes — asserted before AND after', () => {
    // FAILS IF: `reorderScreenNodes` returns a workflow whose node order is
    // unchanged, or `sequenceDetectionReference` reads anything but
    // `wf.nodes`. This is the reorder-that-renders-but-changes-nothing
    // defect, pinned by observing the effect on both sides of the act.
    const before = drawnOrder(wf())
    expect(sequenceDetectionReference(wf()).order).toEqual(before)

    const swapped = [before[1]!, before[0]!, ...before.slice(2)]
    const result = reorderScreenNodes({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      order: swapped,
    })

    expect(result.ok).toBe(true)
    const after = drawnOrder(result.workflow)
    expect(after).not.toEqual(before)
    expect(after).toEqual(swapped)
    expect(sequenceDetectionReference(result.workflow).order).toEqual(after)
    // And the original object is untouched, so nothing else read a stale copy.
    expect(drawnOrder(wf())).toEqual(before)
  })

  it('carries the branch targets into the reference, not only the order', () => {
    // FAILS IF: `sequenceDetectionReference` drops `branchTargets` —
    // AC-STU-056 names "the drawn screen order AND branch targets".
    const reference = sequenceDetectionReference(wf())
    expect(reference.branchTargets).toEqual(wf().branches)
    expect(reference.branchTargets.length).toBeGreaterThan(0)
  })

  it('exports no mutator from the structure module, so nothing bypasses the audit path', async () => {
    // FAILS IF: a `withScreenRemoved`-style pure mutator is exported from
    // `workflow.ts`. Every mutation must route through `writes.ts`, which is
    // the only file that reaches the audit sink.
    const structure = await import('@/studio/modules/stu-04/workflow')
    const mutators = Object.keys(structure).filter((name) =>
      /^(set|add|remove|reorder|draw|override|delete|with)[A-Z]/.test(name),
    )
    expect(mutators).toEqual([])
  })
})

/* ==================================================================== *
 * STEP 4 — the counts that must never be minted.
 * ==================================================================== */

describe('AC-STU-054 / AC-STU-055 — four settings, exactly two defaults, no severity', () => {
  it('carries exactly four settings and exactly two inheritable defaults', () => {
    // FAILS IF: a fifth setting or a third inheritable default is added —
    // and it is keyed on task 3's closed vocabularies, so a third default
    // has to be minted THERE first, where the source's own "exactly" is
    // quoted.
    expect(Object.keys(workflowSettings(wf()))).toHaveLength(4)
    expect(Object.keys(inheritableDefaults(wf()))).toHaveLength(2)
    expect(Object.keys(workflowSettings(wf())).sort()).toEqual([...WORKFLOW_SETTINGS].sort())
    expect(Object.keys(inheritableDefaults(wf())).sort()).toEqual([...INHERITABLE_DEFAULTS].sort())
  })

  it('offers no route and no control that sets a workflow-level default severity', () => {
    // FAILS IF: a `setDefaultSeverity` write is added to the service, or a
    // control is added for the severity row. Both halves of AC-STU-055 —
    // "no user interface control OR application programming interface
    // route" — are asserted over closed key sets rather than by absence of
    // one name.
    expect(builderService).not.toHaveProperty('setDefaultSeverity')
    expect(Object.keys(builderService).sort()).toEqual([...BUILDER_WRITE_ACTIONS_AS_KEYS].sort())
    expect(Object.keys(builderService).some((k) => /severity/i.test(k))).toBe(false)
    expect(BUILDER_WRITE_ACTIONS.some((a) => /severity/i.test(a))).toBe(false)
    expect(BUILDER_CONTROLS.some((c) => /severity/i.test(c.label))).toBe(false)
    expect(
      // Compared as a STRING on purpose: the control list's own type
      // already excludes the severity capability, and `tsc` rejects the
      // narrow comparison as having no overlap. Widening keeps the runtime
      // check real for the day somebody widens the type.
      BUILDER_CONTROLS.some(
        (c) => (c.capabilityId as string) === 'set-a-workflow-level-default-severity',
      ),
    ).toBe(false)
  })

  it('refuses the severity row in all eight columns and renders it as an absence', () => {
    // FAILS IF: any one of the eight cells on row 6 stops reading
    // `explicitlyProhibited`, or the row gains a `routedTo` pointer that
    // would turn the absence into a disabled control implying a condition
    // that could one day become true.
    const row = stu04Row('set-a-workflow-level-default-severity')
    for (const column of STUDIO_PERSONA_COLUMNS) {
      expect(row.cells[column].outcome).toBe('explicitlyProhibited')
      expect(row.routedTo[column]).toBeNull()
    }
    expect(SEVERITY_PROHIBITION_NOTE).toMatch(/never a workflow default/i)
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(
        builderControls(scenario({ persona })).some(
          (c) => (c.capabilityId as string) === 'set-a-workflow-level-default-severity',
        ),
      ).toBe(false)
    }
  })
})

// The keys `builderService` must carry — one per write action, and nothing
// else. Declared beside the actions rather than inside the case so a reader
// can see there is no third list.
const BUILDER_WRITE_ACTIONS_AS_KEYS = [
  'setWorkflowSetting',
  'setInheritableDefault',
  'addScreenNode',
  'removeScreenNode',
  'reorderScreenNodes',
  'drawBranch',
  'overrideGateFailureTarget',
] as const

/* ==================================================================== *
 * STEP 5 — dangling branch, no silent reroute, no submission.
 * ==================================================================== */

describe('AC-STU-058 — a dangling branch refuses submission rather than rerouting', () => {
  function withoutScreen3(): WorkflowDraft {
    const removed = removeScreenNode({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      nodeId: 'S3',
    })
    expect(removed.ok).toBe(true)
    return removed.workflow
  }

  it('flags a dangling branch and refuses submission rather than rerouting', () => {
    // FAILS IF: `removeScreenNode` also removes or repoints the branches
    // aimed at the removed screen — "the platform does not silently
    // reroute" (L32120).
    const broken = withoutScreen3()
    const validation = validateStructure(broken)
    expect(validation.valid).toBe(false)
    expect(validation.blockers.map((b) => b.element)).toContain('branch S2 -> S3')
    expect(branchTarget(broken, 'S2')).toBe('S3')
    expect(submissionEligibility(broken, validation).ok).toBe(false)
  })

  it('names the specific screen on every validation item, so each one is clickable', () => {
    // FAILS IF: a finding is emitted with `screenId: null` — SB-STU-07:
    // "Each validation item names the specific screen and is clickable."
    const validation = validateStructure(withoutScreen3())
    expect(validation.blockers.length).toBeGreaterThan(0)
    for (const blocker of validation.blockers) {
      expect(blocker.screenId).not.toBeNull()
      expect(blocker.message.trim()).not.toBe('')
    }
  })

  it('clears once the author supplies a target, and only then', () => {
    // FAILS IF: validation caches its answer instead of recomputing over the
    // structure it is handed (TEST-STU-065).
    const broken = withoutScreen3()
    const repointed = drawBranch({
      workflow: broken,
      actor: ACTOR,
      decision: authorDecision('draw-a-conditional-branch'),
      writeAudit: ACCEPTS,
      // The same (from, condition) key as the branch that now dangles, so
      // this RETARGETS it rather than adding a second arrow.
      branch: { from: 'S2', to: 'S4', condition: 'the drawing reference is legible' },
    })
    expect(repointed.ok).toBe(true)
    expect(validateStructure(repointed.workflow).valid).toBe(true)
  })

  it('recommends a split on deep variant trees WITHOUT blocking', () => {
    // FAILS IF: the fork-depth recommendation is promoted to a blocker —
    // "the recommendation never blocks" (L32120).
    const deep = deepTree()
    const validation = validateStructure(deep)
    expect(validation.recommendations.length).toBeGreaterThan(0)
    expect(validation.recommendations.every((r) => r.kind === 'fork-guidance')).toBe(true)
    expect(validation.blockers).toEqual([])
    expect(submissionEligibility(deep, validation).ok).toBe(true)
    expect(forkGuidance(deep).recommendSplit).toBe(true)
    expect(forkGuidance(wf()).recommendSplit).toBe(false)
  })

  it('refuses an unreachable node and names it', () => {
    // FAILS IF: `validateStructure` stops walking the arrows and only checks
    // branch resolution — the "every node reachable" half of
    // FUNC-STU-04-02-B-2.
    const orphaned = drawBranch({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('draw-a-conditional-branch'),
      writeAudit: ACCEPTS,
      // S3's only drawn arrow now skips S4 entirely, so S4 is reached by
      // nothing: an out-of-order jump the detector would have to allow.
      branch: { from: 'S3', to: 'S5', condition: 'measurement within the specification limits' },
    }).workflow
    const validation = validateStructure(orphaned)
    expect(validation.valid).toBe(false)
    expect(validation.blockers.some((b) => b.kind === 'unreachable-node' && b.screenId === 'S4')).toBe(
      true,
    )
  })

  it('refuses a structure with anything other than exactly one entry point', () => {
    // FAILS IF: the entry-point clause of the states line (L32080) is
    // dropped from `validateStructure`.
    const twoEntries = addScreenNode({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      node: {
        id: 'S-ORPHAN',
        ordinal: 12,
        name: 'Orphaned rework capture',
        kind: 'deviation-capture',
        gated: false,
        gateFailureOverride: null,
      },
      // Between S2 and S3. S2's drawn arrow goes straight to S3, so nothing
      // points at the inserted node: a second entry point, and unreachable.
      position: 2,
    }).workflow
    const validation = validateStructure(twoEntries)
    expect(validation.blockers.some((b) => b.kind === 'entry-point')).toBe(true)
  })
})

/** A branch tree past the depth the fork guidance recommends splitting. */
function deepTree(): WorkflowDraft {
  let current = wf()
  for (let i = 0; i < REASONABLE_BRANCH_DEPTH + 1; i += 1) {
    const from = `S${i + 1}`
    const to = `S${i + 2}`
    current = drawBranch({
      workflow: current,
      actor: ACTOR,
      decision: authorDecision('draw-a-conditional-branch'),
      writeAudit: ACCEPTS,
      branch: { from, to, condition: `conditional re-check ${i + 1}` },
    }).workflow
    current = drawBranch({
      workflow: current,
      actor: ACTOR,
      decision: authorDecision('draw-a-conditional-branch'),
      writeAudit: ACCEPTS,
      branch: { from, to: PLATFORM_DEVIATION_CAPTURE_SCREEN, condition: `out of tolerance ${i + 1}` },
    }).workflow
  }
  return current
}

/* ==================================================================== *
 * STEP 6 — reconnect re-runs structural validation IN FULL.
 * ==================================================================== */

describe('L32152 — reconnect discards a validation computed before a dependency changed', () => {
  it('discards the stale pass and keeps submission disabled until a full re-run', () => {
    // FAILS IF: `onReconnect` returns the last validation run instead of
    // null, or `submissionEligibility` accepts a run whose fingerprint no
    // longer matches the structure it is asked about.
    const before = wf()
    const passed = validateStructure(before)
    expect(passed.valid).toBe(true)
    expect(submissionEligibility(before, passed).ok).toBe(true)

    // The dependency changes DURING the disconnection: another author
    // deletes the target screen (the source's own example, L32152).
    const changed = removeScreenNode({
      workflow: before,
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      nodeId: 'S3',
    }).workflow

    // The stale pass must not survive the reconnection...
    expect(onReconnect(passed)).toBeNull()
    const afterReconnect = submissionEligibility(changed, onReconnect(passed))
    expect(afterReconnect.ok).toBe(false)
    expect(afterReconnect.reason).toMatch(/re-runs in full/i)

    // ...and even if it did, the fingerprint no longer matches the structure.
    expect(structureFingerprint(changed)).not.toBe(passed.computedOver)
    const stale = submissionEligibility(changed, passed)
    expect(stale.ok).toBe(false)
    expect(stale.reason).toMatch(/stale/i)

    // A full re-run then reports the real blocker rather than the staleness.
    const rerun = validateStructure(changed)
    const final = submissionEligibility(changed, rerun)
    expect(final.ok).toBe(false)
    expect(final.blockers.map((b) => b.element)).toContain('branch S2 -> S3')
  })
})

/* ==================================================================== *
 * STEP 7 — the gate-failure default.
 * ==================================================================== */

describe('AC-STU-057 — the gate-failure default and its packaged form', () => {
  it('routes a gated screen with no drawn failure path to the platform-standard screen', () => {
    // FAILS IF: `gateFailureTarget` returns null for a gated screen with no
    // override — "the author does not have to draw a failure path on every
    // gated screen" (L32044).
    const gated = wf().nodes.filter((n) => n.gated)
    expect(gated.length).toBeGreaterThan(0)
    for (const node of gated) {
      expect(gateFailureTarget(wf(), node.id)).toBe(PLATFORM_DEVIATION_CAPTURE_SCREEN)
    }
    const ungated = wf().nodes.find((n) => !n.gated)!
    expect(gateFailureTarget(wf(), ungated.id)).toBeNull()
  })

  it('takes a per-screen override and carries it into the reference', () => {
    // FAILS IF: `overrideGateFailureTarget` writes a value the reference
    // does not read — a control that writes state nothing reads is this
    // build's first defect shape.
    const gatedId = wf().nodes.find((n) => n.gated)!.id
    const result = overrideGateFailureTarget({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('override-the-platform-standard-gate-failure-target'),
      writeAudit: ACCEPTS,
      nodeId: gatedId,
      target: 'S11',
    })
    expect(result.ok).toBe(true)
    expect(gateFailureTarget(result.workflow, gatedId)).toBe('S11')
    expect(
      sequenceDetectionReference(result.workflow).gateFailureTargets.find((g) => g.from === gatedId)
        ?.to,
    ).toBe('S11')
  })

  it('refuses an override that removes the default without supplying a target', () => {
    // FAILS IF: the FUNC-STU-04-02-C-1 rule ("no role may remove the default
    // without supplying an override target") is dropped.
    const gatedId = wf().nodes.find((n) => n.gated)!.id
    const result = overrideGateFailureTarget({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('override-the-platform-standard-gate-failure-target'),
      writeAudit: ACCEPTS,
      nodeId: gatedId,
      target: '',
    })
    expect(result.ok).toBe(false)
    expect(result.workflow).toBe(wf())
  })

  it('refuses an override whose target is not packaged, and flags it structurally', () => {
    // FAILS IF: an override target outside the workflow and outside the
    // platform-standard set is accepted — "the override target must itself
    // be packaged or the override is rejected at publication" (L32107).
    const gatedId = wf().nodes.find((n) => n.gated)!.id
    const result = overrideGateFailureTarget({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('override-the-platform-standard-gate-failure-target'),
      writeAudit: ACCEPTS,
      nodeId: gatedId,
      target: 'SCR-SOMEWHERE-ELSE',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/packaged/i)
  })

  it('names the packaged deviation-capture form through the seam registry, not a second list', async () => {
    // FAILS IF: the work-package seam row is renamed or removed — the
    // pointer this module makes to task 19's manifest goes red rather than
    // silently pointing at nothing. This is the "sentence pointing at
    // content elsewhere pinned by a test that fails when its target is
    // removed" rule.
    const { STU_OWNED_SEAMS } = await import('@/studio/seams')
    const manifest = STU_OWNED_SEAMS.find((s) => s.id === 'work-package-definition-and-manifest')
    expect(manifest).toBeDefined()
    expect(manifest!.consumingSlices).toContain(8)
  })
})

/* ==================================================================== *
 * STEP 8 — the audit path, on every write.
 * ==================================================================== */

describe('every write routes through the one audit path', () => {
  it('appends exactly one entry per accepted write, naming identity and action', () => {
    // FAILS IF: any write is wired around `commit` — the count is asserted
    // over EVERY write in the service, so an audit path wired to one
    // handler of seven fails here rather than being demonstrated where it
    // costs nothing.
    const sink = recording()
    let current = wf()
    const decision = authorDecision('add-remove-and-reorder-screen-nodes')
    const settings = authorDecision('set-the-four-workflow-settings')

    current = setWorkflowSetting({
      workflow: current,
      actor: ACTOR,
      decision: settings,
      writeAudit: sink.write,
      setting: 'name',
      value: 'Assembly — Wheel Bolt Torque Verification',
    }).workflow
    current = setInheritableDefault({
      workflow: current,
      actor: ACTOR,
      decision: authorDecision('set-the-default-coaching-trigger-percentage'),
      writeAudit: sink.write,
      default: 'default-coaching-trigger-percentage',
      value: 80,
      escalationTemplates: [],
    }).workflow
    current = addScreenNode({
      workflow: current,
      actor: ACTOR,
      decision,
      writeAudit: sink.write,
      node: {
        id: 'S12',
        ordinal: 12,
        name: 'Final wash',
        kind: 'standard',
        gated: false,
        gateFailureOverride: null,
      },
    }).workflow
    current = reorderScreenNodes({
      workflow: current,
      actor: ACTOR,
      decision,
      writeAudit: sink.write,
      order: [...drawnOrder(current)].reverse(),
    }).workflow
    current = removeScreenNode({
      workflow: current,
      actor: ACTOR,
      decision,
      writeAudit: sink.write,
      nodeId: 'S12',
    }).workflow
    current = drawBranch({
      workflow: current,
      actor: ACTOR,
      decision: authorDecision('draw-a-conditional-branch'),
      writeAudit: sink.write,
      branch: { from: 'S5', to: 'S4', condition: 'rework re-check' },
    }).workflow
    current = overrideGateFailureTarget({
      workflow: current,
      actor: ACTOR,
      decision: authorDecision('override-the-platform-standard-gate-failure-target'),
      writeAudit: sink.write,
      nodeId: wf().nodes.find((n) => n.gated)!.id,
      target: 'S11',
    }).workflow

    // Seven writes landed on one workflow, and the last one is readable off
    // it — so the chain above is seven real mutations, not seven no-ops that
    // would make the entry count meaningless.
    expect(gateFailureTarget(current, wf().nodes.find((n) => n.gated)!.id)).toBe('S11')
    expect(drawnOrder(current)).not.toEqual(drawnOrder(wf()))

    expect(sink.entries).toHaveLength(BUILDER_WRITE_ACTIONS.length)
    expect(sink.entries.map((e) => e.action).sort()).toEqual([...BUILDER_WRITE_ACTIONS].sort())
    for (const entry of sink.entries) {
      expect(entry.actorIdentityId).toBe(ACTOR.identityId)
      expect(entry.element.trim()).not.toBe('')
      expect(entry.sourceRefs.length).toBeGreaterThan(0)
    }
  })

  it('reorders the nodes before the audit fails and leaves the drawn order unchanged', () => {
    // FAILS IF: the mutation is applied before the audit append, or the
    // audit failure returns a NEW register. The reorder is a real one — the
    // order genuinely differs — so this cannot pass by the act being a
    // no-op, which is how this build once demonstrated the contract where it
    // cost nothing.
    const before = drawnOrder(wf())
    const swapped = [before[1]!, before[0]!, ...before.slice(2)]
    expect(swapped).not.toEqual(before)

    // The same act on an accepting sink DOES change the order, so the
    // assertion below is about the audit and not about a broken reorder.
    const accepted = reorderScreenNodes({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      order: swapped,
    })
    expect(drawnOrder(accepted.workflow)).toEqual(swapped)

    const refused = reorderScreenNodes({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: REFUSES,
      order: swapped,
    })
    expect(refused.ok).toBe(false)
    expect(drawnOrder(refused.workflow)).toEqual(before)
    expect(refused.workflow).toBe(wf())
    expect(sequenceDetectionReference(refused.workflow).order).toEqual(before)
  })

  it('appends nothing when the evaluator refuses, because a refused action is not an action', () => {
    // FAILS IF: the audit append moves above the authorisation refusal.
    const sink = recording()
    const result = reorderScreenNodes({
      workflow: wf(),
      actor: ACTOR,
      decision: decisionForRow(
        stu04Row('add-remove-and-reorder-screen-nodes'),
        scenario({ persona: 'tenant-admin' }),
      ),
      writeAudit: sink.write,
      order: [...drawnOrder(wf())].reverse(),
    })
    expect(result.ok).toBe(false)
    expect(sink.entries).toEqual([])
    expect(drawnOrder(result.workflow)).toEqual(drawnOrder(wf()))
  })
})

/* ==================================================================== *
 * The controls — no dead ones, and no invented ones.
 * ==================================================================== */

describe('every control does something and every disabled one names a reason', () => {
  it('offers a control for every capability that has one, and for no other', () => {
    // FAILS IF: a control is invented for a capability the source's table
    // does not carry, or one of the seven acting rows loses its control.
    const covered = new Set(BUILDER_CONTROLS.map((c) => c.capabilityId))
    expect([...covered].sort()).toEqual(
      [
        'add-remove-and-reorder-screen-nodes',
        'draw-a-conditional-branch',
        'override-the-platform-standard-gate-failure-target',
        'preview-the-sequence',
        'set-the-default-coaching-trigger-percentage',
        'set-the-default-escalation-routing-template',
        'set-the-four-workflow-settings',
      ].sort(),
    )
    for (const control of BUILDER_CONTROLS) {
      expect(STU_04_CAPABILITY_IDS).toContain(control.capabilityId)
    }
  })

  it('enables every control for the author and names a handler for each', () => {
    // FAILS IF: a control's affordance stops being derived from the
    // evaluator, or a control is added with no write action behind it.
    const drawn = builderControls(scenario({ persona: 'quality-manager' }))
    expect(drawn).toHaveLength(BUILDER_CONTROLS.length)
    for (const control of drawn) {
      expect(control.affordance.kind).toBe('enabled')
      // Every control that writes names the write it performs. `preview` is
      // a read and says so rather than pointing at a write that does not
      // exist.
      if (control.capabilityId === 'preview-the-sequence') {
        expect(control.action).toBeNull()
      } else {
        expect(BUILDER_WRITE_ACTIONS).toContain(control.action!)
      }
    }
  })

  it('renders a routed prohibition as a disabled control ONLY where the route permits acting', () => {
    // FAILS IF: `builderAffordance` stops checking the routed decision and
    // renders a disabled control on the strength of the pointer alone —
    // which would put a disabled draft-canvas control in front of a persona
    // who may only READ the published one.
    const prohibited = decisionForRow(
      stu04Row('open-the-canvas-for-a-draft-workflow'),
      scenario({ persona: 'supervisor-without-grant' }),
    )
    const readOnlyRoute = decisionForRow(
      stu04Row('open-the-canvas-read-only-for-a-published-version'),
      scenario({ persona: 'supervisor-without-grant' }),
    )
    expect(permitsAction(readOnlyRoute.decision)).toBe(false)
    expect(
      builderAffordance('Open the canvas', prohibited, 'open-the-canvas-read-only-for-a-published-version', readOnlyRoute)
        .kind,
    ).toBe('absent')

    // The pointer IS live: a route that genuinely permits acting produces
    // the disabled control with the alternative named.
    const acting = decisionForRow(
      stu04Row('add-remove-and-reorder-screen-nodes'),
      scenario({ persona: 'quality-manager' }),
    )
    expect(permitsAction(acting.decision)).toBe(true)
    const routed = builderAffordance(
      'Open the canvas',
      prohibited,
      'add-remove-and-reorder-screen-nodes',
      acting,
    )
    expect(routed.kind).toBe('disabled')
    expect(routed.kind === 'disabled' ? routed.reason : '').toMatch(/instead/i)
  })

  it('routes row 1 to the published canvas for the three read-only columns and nowhere else', () => {
    // FAILS IF: the routing pointer is hung off the ROW rather than the
    // CELL — a row-level pointer would route the Worker, who holds nothing
    // on either canvas.
    const row = stu04Row('open-the-canvas-for-a-draft-workflow')
    const routed = STUDIO_PERSONA_COLUMNS.filter((c) => row.routedTo[c] !== null)
    expect(routed.sort()).toEqual(
      ['supervisor-without-grant', 'plant-manager-persona', 'tenant-admin'].sort(),
    )
    expect(row.routedTo.worker).toBeNull()
  })
})

/* ==================================================================== *
 * The right panel — C4. Reads the registry; implements only check #1.
 * ==================================================================== */

describe('C4 — the validation panel reads the eleven checks and implements one', () => {
  it('registers structural validity and nothing else', () => {
    // FAILS IF: this module registers a check it does not own — the
    // register returns `not-an-owner` rather than silently accepting it.
    const register = builderCheckRegister()
    expect([...register.implementations.keys()]).toEqual(['structural-validity'])
    expect(publishChecksOwnedBy('MOD-STU-04').map((c) => c.id)).toEqual(['structural-validity'])

    const trespass = registerPublishChecks(register, {
      checkId: 'severity-mapping',
      implementedBy: 'MOD-STU-04',
      run: () => ({ outcome: 'passed' as const }),
    })
    expect(trespass.ok).toBe(false)
    expect(trespass.ok === false ? trespass.failure : '').toBe('not-an-owner')
  })

  it('lists all eleven checks, answering one here and declaring the other ten unowned', () => {
    // FAILS IF: the panel renders only the checks this module implements —
    // the storyboard's live list names severity mapping and the curated
    // coaching default, which are siblings' and must appear as declared
    // absences rather than be silently missing.
    const panel = validationPanel(wf(), builderCheckRegister())
    expect(panel.items).toHaveLength(PUBLISH_CHECKS.length)
    expect(panel.items.filter((i) => i.implementedHere)).toHaveLength(1)
    const severity = panel.items.find((i) => i.checkId === 'severity-mapping')!
    expect(severity.implementedHere).toBe(false)
    expect(severity.ownerModules).toContain('MOD-STU-05')
    expect(severity.kind).toBe('cannot-run')
    expect(panel.heading).toBe(VALIDATION_PANEL_HEADING)
    expect(panel.heading).toMatch(/sequence-detection reference used at run time/)
  })

  it('answers structural validity from the same walk the canvas draws', () => {
    // FAILS IF: the registered implementation re-derives validity instead of
    // calling `validateStructure`, which is how the panel and the canvas
    // would come to disagree.
    const register = builderCheckRegister()
    expect(evaluatePublish(register, wf()).passed).toContain('structural-validity')
    const broken = removeScreenNode({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      nodeId: 'S3',
    }).workflow
    const blocked = evaluatePublish(register, broken).blockers.find(
      (b) => b.checkId === 'structural-validity',
    )
    expect(blocked?.kind).toBe('failed')
    expect(blocked?.blockingElement).toMatch(/branch S2 -> S3/)
  })
})

/* ==================================================================== *
 * The two inheritable defaults, and the routing picker (C7).
 * ==================================================================== */

describe('the default escalation routing template reads task 11’s library', () => {
  it('offers the in-force templates from the Content Libraries register', () => {
    // FAILS IF: the picker is stubbed with a hand-written list instead of
    // reading MOD-STU-07's register — C7, no routing-pointer stub.
    const options = escalationTemplateOptions(SEEDED_LIBRARY_REGISTER)
    expect(options.length).toBeGreaterThan(0)
    expect(options.map((o) => o.id)).toContain('ROU-SEVERITY-BANDS')
    // A Draft template is not in force and is not offered.
    expect(options.map((o) => o.id)).not.toContain('ROU-DEFAULT')
  })

  it('cannot set the workflow default where no template exists, and says why', () => {
    // FAILS IF: the alternate path at L32120 is dropped — "Where no
    // escalation routing template exists, the workflow default cannot be
    // set".
    const result = setInheritableDefault({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('set-the-default-escalation-routing-template'),
      writeAudit: ACCEPTS,
      default: 'default-escalation-routing-template',
      value: 'ROU-SEVERITY-BANDS',
      escalationTemplates: [],
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/no escalation routing template/i)
    expect(inheritableDefaults(result.workflow)['default-escalation-routing-template']).toBe(
      inheritableDefaults(wf())['default-escalation-routing-template'],
    )
  })

  it('sets the default from a template that does exist', () => {
    // FAILS IF: the write records a value `inheritableDefaults` does not
    // read back.
    const result = setInheritableDefault({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('set-the-default-escalation-routing-template'),
      writeAudit: ACCEPTS,
      default: 'default-escalation-routing-template',
      value: 'ROU-SEVERITY-BANDS',
      escalationTemplates: escalationTemplateOptions(SEEDED_LIBRARY_REGISTER).map((o) => o.id),
    })
    expect(result.ok).toBe(true)
    expect(inheritableDefaults(result.workflow)['default-escalation-routing-template']).toBe(
      'ROU-SEVERITY-BANDS',
    )
  })
})

/* ==================================================================== *
 * The preview walk, and the keyboard route to a branch target.
 * ==================================================================== */

describe('the Preview Sequence control walks the graph in worker order', () => {
  it('walks every node once, entry first, following the drawn arrows', () => {
    // FAILS IF: `previewSequence` returns `wf.nodes` unwalked — the control
    // would then agree with the order by accident rather than by walking.
    const walk = previewSequence(wf())
    expect(walk.map((s) => s.nodeId)).toEqual(drawnOrder(wf()))
    expect(new Set(walk.map((s) => s.nodeId)).size).toBe(walk.length)
    expect(walk[0]!.arrivedVia).toMatch(/entry/i)

    // Reorder and the walk follows, because it reads the same structure.
    const swapped = reorderScreenNodes({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      // The last two swapped: every arrow still resolves, so the walk is
      // comparable with the drawn order rather than being cut short by an
      // orphan the reorder itself created.
      order: [...drawnOrder(wf()).slice(0, 9), 'S11', 'S10'],
    }).workflow
    expect(previewSequence(swapped).map((s) => s.nodeId)).toEqual(drawnOrder(swapped))
    expect(previewSequence(swapped).map((s) => s.nodeId)).not.toEqual(previewSequence(wf()).map((s) => s.nodeId))
  })

  it('offers every branch target as a selectable list entry, not only as a drag', () => {
    // FAILS IF: the branch-target options are derived from anything but the
    // nodes plus the platform-standard screen — L48332 requires branch
    // targets "selectable from a list as well as by drag".
    const control = BUILDER_CONTROLS.find((c) => c.capabilityId === 'draw-a-conditional-branch')!
    expect(control.targetOptions(wf()).map((o) => o.id)).toEqual([
      ...drawnOrder(wf()),
      PLATFORM_DEVIATION_CAPTURE_SCREEN,
    ])
  })
})

/* ==================================================================== *
 * The journey — the states this module produces must satisfy the next
 * step's requirements, folded rather than asserted.
 * ==================================================================== */

describe('the builder’s output satisfies the next journey step’s requirements', () => {
  function stateWith(draft: JourneyState['draft']): JourneyState {
    return { ...INITIAL_JOURNEY_STATE, draft }
  }

  function step(n: number) {
    const found = JOURNEY_STEPS.find((s) => s.number === n)
    if (found === undefined) throw new Error(`No journey step ${n}`)
    return found
  }

  it('produces, from the REAL writes, the draft the journey’s own step 4 produces', () => {
    // FAILS IF: the builder's projection stops matching the fixture — for
    // instance if a reorder leaves `screenOrder` untouched, which is the
    // defect a picture of a canvas would ship.
    const projected = builderDraftProjection(wf(), validateStructure(wf()))
    const fixture = step(4).produces(step(3).produces(step(2).produces(step(1).produces(INITIAL_JOURNEY_STATE))))
    expect(projected.screenOrder).toEqual(fixture.draft!.screenOrder)
    expect(projected.name).toEqual(fixture.draft!.name)
    expect(projected.locales).toEqual(fixture.draft!.locales)
    expect(projected.inheritableDefaults).toHaveLength(2)
  })

  it('meets step 5’s requirement after the screens are laid out', () => {
    // FAILS IF: `builderDraftProjection` reports an empty `screenOrder`
    // for a canvas that has nodes — step 5 refuses to proceed on that.
    const state = stateWith({
      ...step(4).produces(step(3).produces(step(2).produces(step(1).produces(INITIAL_JOURNEY_STATE))))
        .draft!,
      ...builderDraftProjection(wf(), validateStructure(wf())),
    })
    expect(step(5).requires(state)).toEqual({ met: true })
  })

  it('meets step 6’s requirement only once branches have been drawn', () => {
    // FAILS IF: `branchesDrawn` is projected as a constant rather than
    // read from the drawn branches — step 6, the nine sections, is
    // unreachable until the canvas actually carries a branch.
    const withBranches = builderDraftProjection(wf(), validateStructure(wf()))
    expect(withBranches.branchesDrawn).toBe(true)
    expect(step(6).requires(stateWith({ ...emptyDraft(), ...withBranches }))).toEqual({ met: true })

    const bare: WorkflowDraft = { ...wf(), branches: [] }
    const withoutBranches = builderDraftProjection(bare, validateStructure(bare))
    expect(withoutBranches.branchesDrawn).toBe(false)
    expect(step(6).requires(stateWith({ ...emptyDraft(), ...withoutBranches })).met).toBe(false)
  })

  it('meets step 9’s requirement only once validation has run', () => {
    // FAILS IF: the projection reports `validation: 'passed'` for a
    // structure that has not been validated — step 9 (save) refuses while
    // validation is `not-run`.
    const unrun = builderDraftProjection(wf(), null)
    expect(unrun.validation).toBe('not-run')
    expect(step(9).requires(stateWith({ ...emptyDraft(), ...unrun })).met).toBe(false)

    const run = builderDraftProjection(wf(), validateStructure(wf()))
    expect(run.validation).toBe('passed')
    expect(step(9).requires(stateWith({ ...emptyDraft(), ...run }))).toEqual({ met: true })

    const broken = removeScreenNode({
      workflow: wf(),
      actor: ACTOR,
      decision: authorDecision('add-remove-and-reorder-screen-nodes'),
      writeAudit: ACCEPTS,
      nodeId: 'S3',
    }).workflow
    expect(builderDraftProjection(broken, validateStructure(broken)).validation).toBe('blocked')
  })

  it('names this module as the owner of journey steps 3, 4 and 5', () => {
    // FAILS IF: the journey fixture re-assigns one of these steps to
    // another module — the seam between this task and its siblings is the
    // fixture's own `ownerModule`, not a sentence in a brief.
    expect(step(3).ownerModule).toBe('MOD-STU-04')
    expect(step(4).ownerModule).toBe('MOD-STU-04')
    expect(step(5).ownerModule).toBe('MOD-STU-04')
    expect(step(8).ownerModule).toMatch(/MOD-STU-04/)
  })
})

function emptyDraft(): NonNullable<JourneyState['draft']> {
  const opened = JOURNEY_STEPS[0]!.produces(INITIAL_JOURNEY_STATE)
  return opened.draft!
}

/* ==================================================================== *
 * Determinism.
 * ==================================================================== */

describe('determinism', () => {
  it('produces the same fingerprint and the same walk on every call', () => {
    // FAILS IF: any of these reads a clock, a counter or a random source.
    expect(structureFingerprint(wf())).toBe(structureFingerprint(wf()))
    expect(previewSequence(wf())).toEqual(previewSequence(wf()))
    expect(validateStructure(wf())).toEqual(validateStructure(wf()))
    const s = scenario({ persona: 'quality-manager' })
    expect(builderControls(s).map((c) => c.affordance.kind)).toEqual(
      builderControls(s).map((c) => c.affordance.kind),
    )
  })
})

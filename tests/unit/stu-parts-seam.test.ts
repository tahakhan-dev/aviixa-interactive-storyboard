import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { reachByStudioMatrix, stuModuleById, STU_MODULES } from '@/studio/modules'
import { publishCheckById } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
} from '@/studio/publish/register'
import { STU_SEAMS, stuSeamById, stuSeamStatus } from '@/studio/seams'
import { DOH_MODULES } from '@/surfaces/doh/modules'
import {
  confirmedPartsRegistry,
  DEC_PARTSTUB_001,
  PART_SEAM_WRITABLE_FIELDS,
  REGISTRY_PART_STATES,
  unconfirmedPartsRegistry,
  unreachablePartsRegistry,
  type PartsRegistrySeam,
} from '@/studio/seams/parts/registry'
import { TENANT_STATES, type TenantWriteState } from '@/surfaces/doh/tenant-state'
import {
  STU_10_CROSS_SURFACE,
  STU_10_MATRIX,
  STU_10_MATRIX_AND_CROSS_SURFACE_ROWS,
  STU_10_ROW_IDS,
  STU_10_SOURCE_ROW_COUNT,
  stu10Row,
  type Stu10RowId,
} from '@/studio/modules/stu-10/matrix'
import {
  inlineAddPart,
  partReferencePublishCheck,
  partsAffordance,
  SEEDED_DRAFT,
  stepReferences,
  unresolvableReferences,
  type AuthoringDraft,
  type PartsAuditEntry,
  type PartsPublishSubject,
} from '@/studio/modules/stu-10/seam'
import { PartsMiniForm, type PartsMiniFormProps } from '@/studio/modules/stu-10/PartsMiniForm'

/**
 * `MOD-STU-10` — the Parts-Registry Authoring Seam.
 *
 * THE FAR SIDE OF THIS SEAM WAS UNSCHEDULED AND HAS SINCE SHIPPED.
 * `MOD-DOH-19` was registered `not-represented`, was excluded from slice 4
 * and was named in no later slice's stated scope; slice 6 built it. The
 * UNCONFIRMED path is still the one this file exercises hardest, for a
 * reason that never depended on the schedule: R21 — "a stub that returns a
 * minted identifier without a confirmed hand-off is invisible until a
 * package carries an unresolvable part reference." A far side that usually
 * confirms does not make an unconfirmed hand-off impossible; it makes it
 * rarer, which is worse.
 *
 * NO ASSERTION HERE MAY PASS ON AN EMPTY SET. `AC-STU-094` makes an empty
 * reference list the ORDINARY case, which is precisely the shape a vacuous
 * assertion hides in — so every test that asserts an empty list also asserts
 * the non-empty counterpart in the same case.
 */

const ALL_PERSONAS: readonly StudioPersonaColumn[] = STUDIO_PERSONA_COLUMNS
const AUTHOR: StudioPersonaColumn = 'supervisor-with-authoring-grant'

const accepting = (): { readonly ok: true } => ({ ok: true })

function miniFormMarkup(over: Partial<PartsMiniFormProps> = {}): string {
  const props: PartsMiniFormProps = {
    stepId: 'STEP-1',
    persona: AUTHOR,
    references: [],
    registry: confirmedPartsRegistry,
    tenantState: 'active',
    onAdd: () => undefined,
    onCancel: () => undefined,
    ...over,
  }
  return renderToStaticMarkup(createElement(PartsMiniForm, props))
}

const countOf = (haystack: string, needle: string): number => haystack.split(needle).length - 1

/* ==================================================================== *
 * THE MATRIX — L33113-L33119, seven data rows.
 * ==================================================================== */

describe('MOD-STU-10 permission matrix', () => {
  // FAILS IF: a row is dropped from either half.
  it('accounts for all seven source rows across the matrix and the cross-surface register', () => {
    expect(STU_10_SOURCE_ROW_COUNT).toBe(7)
    expect(STU_10_MATRIX).toHaveLength(6)
    expect(STU_10_CROSS_SURFACE).toHaveLength(1)
    expect(STU_10_MATRIX_AND_CROSS_SURFACE_ROWS).toBe(STU_10_SOURCE_ROW_COUNT)
  })

  // FAILS IF: any row loses a persona column or leaves a cell blank.
  it('answers all eight persona columns on every row, with no blank cell', () => {
    expect(ALL_PERSONAS).toHaveLength(8)
    expect(STU_10_MATRIX.length).toBe(6)
    for (const row of STU_10_MATRIX) {
      for (const persona of ALL_PERSONAS) {
        expect(row.cells[persona], `${row.id} / ${persona}`).toBeDefined()
        expect(row.cells[persona].note.trim(), `${row.id} / ${persona}`).not.toBe('')
      }
    }
  })

  // FAILS IF: any one of the thirty-two cells across these four rows stops
  // refusing. Minting, editing, deleting and forcing refuse EVERY column.
  it('refuses minting, editing, deleting and forcing in every one of the eight columns', () => {
    const universal: readonly Stu10RowId[] = [
      'mint-the-part-identifier',
      'edit-registry-fields-beyond-the-name',
      'delete-a-part-from-the-studio',
      'force-a-step-to-carry-a-part-reference',
    ]
    expect(universal).toHaveLength(4)
    for (const id of universal) {
      for (const persona of ALL_PERSONAS) {
        expect(stu10Row(id).cells[persona].outcome, `${id} / ${persona}`).toBe(
          'explicitlyProhibited',
        )
      }
    }
  })

  // FAILS IF: row 4 is added to the persona matrix, or its six source cells
  // are dropped or reworded.
  it('keeps “complete a skeletal part record” out of the matrix and verbatim beside it', () => {
    expect(STU_10_MATRIX.map((row) => row.capability)).not.toContain(
      'Complete a skeletal part record',
    )
    const row4 = STU_10_CROSS_SURFACE[0]
    expect(row4.heldOn).toBe('SURF-DOH')
    expect(row4.cells).toHaveLength(6)
    expect(row4.cells.map((c) => c.text)).toEqual([
      'Not applicable — completion happens in the Delivery Operations Hub parts registry',
      'Not applicable — same reason',
      'Not applicable — same reason',
      'Allowed — in the Delivery Operations Hub, subject to its own permissions',
      'Read-only',
      'Explicitly prohibited',
    ])
    expect(row4.owner).toContain('MOD-DOH-19')
  })

  // FAILS IF: reach moves. The Auditor is `withheld` here rather than
  // `client-decision-open` because this card defers to DEC-AUDSTU-001
  // nowhere — its only Auditor read is row 4, a Hub act.
  it('derives reach from the screen rows alone', () => {
    const reach = reachByStudioMatrix(STU_10_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach).toEqual({
      'quality-manager': 'offered',
      'supervisor-with-authoring-grant': 'offered',
      'supervisor-without-grant': 'withheld',
      'plant-manager-persona': 'withheld',
      'tenant-admin': 'withheld',
      'read-only-auditor': 'withheld',
      worker: 'withheld',
      'implementation-team': 'offered',
    })
  })

  // FAILS IF: the row-id vocabulary and the matrix stop agreeing.
  it('keeps the row-id vocabulary and the matrix in step', () => {
    expect([...STU_10_ROW_IDS]).toEqual(STU_10_MATRIX.map((row) => row.id))
  })

  // FAILS IF: MOD-STU-10 is ever given a route of its own.
  it('offers no route of its own', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-10')
    expect(module.slug).toBeNull()
    expect(module.noRouteReason).toMatch(/inline mini-form/i)
  })
})

/* ==================================================================== *
 * THE UNSCHEDULED SEAM — declared, never guessed.
 * ==================================================================== */

describe('the parts registry seam', () => {
  // FAILS IF: the seam goes back to declaring no owning slice, or acquires
  // one nobody shipped. `MOD-DOH-19` was unscheduled when this row was
  // written and slice 6 shipped it, so the declaration this test used to
  // pin has become the wrong one. The number is checked against the SHIPPED
  // module rather than against itself.
  it('names the slice that shipped its owner, and no longer declares it unscheduled', () => {
    const seam = stuSeamById(STU_SEAMS, 'parts-registry')
    expect(seam.ownerSlices).toEqual([6])
    expect(stuSeamStatus(seam)).toBe('scheduled')
    expect(seam.owner).toContain('MOD-DOH-19')
    expect(seam.consumingModules).toEqual(['MOD-STU-10'])
    // Non-vacuous, and this is what makes the number true rather than
    // asserted: the Hub spine actually carries the module now.
    const owner = DOH_MODULES.find((m) => m.id === 'MOD-DOH-19')
    expect(owner?.slug).toBe('parts-registry')
    expect(owner?.rolesReaching.length).toBeGreaterThan(0)
    // And the register still holds four genuinely unscheduled rows, so
    // `unscheduled` has not quietly stopped being reachable.
    expect(STU_SEAMS.filter((x) => stuSeamStatus(x) === 'unscheduled')).toHaveLength(4)
  })

  // FAILS IF: the panel goes on saying a dependency has no slice after its
  // owner shipped, or stops declaring the seam at all.
  it('stops saying “no slice assigned” on the panel and names the slice instead', () => {
    const html = miniFormMarkup()
    expect(html).toContain('Cross-slice seam — not built here')
    expect(html).toContain('MOD-DOH-19')
    expect(html).not.toContain('Owner stated, no slice assigned')
    expect(html).toMatch(/owned by slice 6/)
  })

  // FAILS IF: a second writable field, an edit path or a delete path appears
  // on the seam. L33207: "exactly one writable field".
  it('exposes exactly one writable field and no edit or delete path', () => {
    expect([...PART_SEAM_WRITABLE_FIELDS]).toEqual(['name'])
    for (const seam of [
      confirmedPartsRegistry,
      unconfirmedPartsRegistry,
      unreachablePartsRegistry,
    ] as const) {
      expect(seam).not.toHaveProperty('editPart')
      expect(seam).not.toHaveProperty('deletePart')
      expect(seam).not.toHaveProperty('setPartId')
      // The whole surface of the interface, written down. A new member has
      // to be added here deliberately rather than arriving unnoticed.
      expect(Object.keys(seam).sort()).toEqual([
        'createSkeletal',
        'disposition',
        'id',
        'reachable',
        'resolve',
        'search',
      ])
    }
  })

  // FAILS IF: `createSkeletal` grows an identifier parameter. The suppression
  // directive below then has nothing to suppress and `tsc` reports it as
  // unused, which is a compile error rather than a quietly passing test.
  it('accepts no author input on the identifier at the type level', () => {
    const seam: PartsRegistrySeam = confirmedPartsRegistry
    // AC-STU-092 / TEST-STU-098 — the platform mints the identifier; there is
    // no parameter through which an author could hand one in.
    // @ts-expect-error AC-STU-092 — the seam accepts a name and nothing else.
    void seam.createSkeletal(SEEDED_DRAFT.tenant, 'Bolt M12', 'PRT-FORGED')
    expect(REGISTRY_PART_STATES).toEqual(['Skeletal', 'Complete'])
  })

  // FAILS IF: DEC-PARTSTUB-001 is ever rendered as a settled interval.
  it('renders DEC-PARTSTUB-001 as unspecified in source, with all three options', () => {
    expect(DEC_PARTSTUB_001.status).toMatch(/not specified in the Statement of Work/i)
    expect(DEC_PARTSTUB_001.options).toHaveLength(3)
    const html = miniFormMarkup()
    expect(html).toContain('DEC-PARTSTUB-001')
    expect(html).toMatch(/not specified in the Statement of Work/i)
    expect(html).toContain('A tenant-configurable interval defaulting to seven days')
    expect(html).toContain('No interval is applied by this build')
  })
})

/* ==================================================================== *
 * STEP 2 — THE UNCONFIRMED PATH IS THE ONE THE GATE EXERCISES.
 * ==================================================================== */

describe('the hand-off must be confirmed before any reference exists', () => {
  // FAILS IF: a reference is attached without a confirmed hand-off — R21's
  // invisible stub. The step's references are read back, so an assertion
  // about the RESULT alone could not catch a write that happened anyway.
  it('creates NO reference when the hand-off is unconfirmed', () => {
    const r = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Bolt M12',
      registry: unconfirmedPartsRegistry,
      writeAudit: accepting,
    })
    expect(r.ok).toBe(false)
    expect(stepReferences(r.draft, 'STEP-1')).toEqual([])
    expect(r.ok === false ? r.reason : '').toMatch(/could not be confirmed/i)
    // And the draft handed in is the very same object, not a copy that
    // happens to look equal.
    expect(r.draft).toBe(SEEDED_DRAFT)
  })

  // FAILS IF: the confirmed path stops attaching a Skeletal reference, or
  // starts attaching it in the Complete state the Studio may never set.
  it('creates a Skeletal reference only on a confirmed hand-off', () => {
    const r = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Bolt M12',
      registry: confirmedPartsRegistry,
      writeAudit: accepting,
    })
    expect(r.ok).toBe(true)
    const refs = stepReferences(r.draft, 'STEP-1')
    expect(refs).toHaveLength(1)
    expect(refs[0]).toMatchObject({ state: 'Skeletal', name: 'Bolt M12' })
    expect(refs[0]?.partId).toMatch(/^PRT-/)
    // The OTHER step is untouched — a write that leaked across steps would
    // pass every assertion about STEP-1.
    expect(stepReferences(r.draft, 'STEP-2')).toEqual([])
    expect(stepReferences(SEEDED_DRAFT, 'STEP-1')).toEqual([])
  })

  // FAILS IF: an unreachable registry starts attaching references, or stops
  // telling the author they may continue without one.
  it('attaches nothing when the registry cannot be reached and says so', () => {
    const r = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Bolt M12',
      registry: unreachablePartsRegistry,
      writeAudit: accepting,
    })
    expect(r.ok).toBe(false)
    expect(stepReferences(r.draft, 'STEP-1')).toEqual([])
    expect(r.ok === false ? r.reason : '').toMatch(/cannot be reached/i)
    expect(r.ok === false ? r.reason : '').toMatch(/optional per part/i)
  })

  // FAILS IF: `stepReferences` starts returning `[]` for an unknown step —
  // which would make every emptiness assertion above pass on a typo.
  it('refuses to answer for a step the draft does not hold', () => {
    expect(() => stepReferences(SEEDED_DRAFT, 'STEP-404')).toThrow(/no step named/i)
  })
})

/* ==================================================================== *
 * STEP 3 — A COMMERCIAL STATE IS NEVER A TECHNICAL FAULT.
 * ==================================================================== */

describe('suspension is not a registry outage', () => {
  // FAILS IF: the suspension refusal starts borrowing outage words, or the
  // suspension check moves after the reachability check.
  it('names the suspension state, not a registry outage', () => {
    const r = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Bolt',
      registry: confirmedPartsRegistry,
      tenantState: 'soft-suspended',
      writeAudit: accepting,
    })
    expect(r.ok).toBe(false)
    const reason = r.ok === false ? r.reason : ''
    expect(reason).toMatch(/suspend/i)
    expect(reason).not.toMatch(/unavailable|down|outage|error/i)
    expect(stepReferences(r.draft, 'STEP-1')).toEqual([])
  })

  // FAILS IF: a suspension is reported through a registry the seam never
  // reached. The registry here is REACHABLE, so only ordering can produce
  // the suspension sentence.
  it('reports the suspension even where the registry is perfectly reachable', () => {
    expect(confirmedPartsRegistry.reachable).toBe(true)
    for (const state of ['soft-suspended', 'hard-suspended', 'compliance-suspended'] as const) {
      const r = inlineAddPart({
        draft: SEEDED_DRAFT,
        stepId: 'STEP-1',
        persona: AUTHOR,
        name: 'Bolt',
        registry: confirmedPartsRegistry,
        tenantState: state,
        writeAudit: accepting,
      })
      expect(r.ok, state).toBe(false)
      expect(r.ok === false ? r.reason : '', state).toContain(state)
    }
  })

  // FAILS IF: this module grows its own write-class table. The seam reads
  // slice 4's, so every state it blocks is slice 4's answer, not a copy.
  it('inherits slice 4’s write-class table rather than restating it', () => {
    expect(TENANT_STATES).toHaveLength(5)
    const blocked: TenantWriteState[] = []
    for (const state of TENANT_STATES) {
      const rendering = partsAffordance(
        'inline-add-a-part-through-the-mini-form',
        AUTHOR,
        'Add',
        { tenantState: state },
      )
      if (rendering.kind === 'disabled') blocked.push(state)
    }
    expect(blocked).toEqual([
      'soft-suspended',
      'hard-suspended',
      'compliance-suspended',
      'archived',
    ])
  })

  // FAILS IF: the panel renders an enabled Add under suspension.
  it('disables the mini-form under suspension with the state named', () => {
    const html = miniFormMarkup({ tenantState: 'soft-suspended' })
    expect(html).toContain('aria-disabled="true"')
    expect(html).toMatch(/soft-suspended state is blocking master-data writes/i)
    expect(html).not.toMatch(/registry is down|registry is unavailable/i)
  })
})

/* ==================================================================== *
 * STEP 4/5 — ONE FIELD, TWO CONTROLS, AND NEVER A FORCED REFERENCE.
 * ==================================================================== */

describe('the mini-form and reference optionality', () => {
  // FAILS IF: a third control or a second field is drawn.
  it('draws one field and two controls and nothing else', () => {
    const html = miniFormMarkup()
    expect(countOf(html, '<input')).toBe(1)
    expect(html).toContain('Part name')
    expect(countOf(html, '<button')).toBe(2)
    expect(html).toContain('>Add<')
    expect(html).toContain('>Cancel<')
    expect(html).toContain(
      'This creates a skeletal record in the parts registry. Complete it in the Delivery Operations Hub. The platform assigns the identifier.',
    )
  })

  // FAILS IF: a step with no reference stops passing the check, or the
  // check starts passing everything. BOTH halves are asserted here — the
  // first alone is satisfied by a check that can only ever pass.
  it('submits with zero references and blocks on an unresolvable one', () => {
    const empty: PartsPublishSubject = { draft: SEEDED_DRAFT, registry: confirmedPartsRegistry }
    expect(stepReferences(SEEDED_DRAFT, 'STEP-1')).toEqual([])
    expect(partReferencePublishCheck.run(empty)).toEqual({ outcome: 'passed' })

    const dangling: AuthoringDraft = {
      ...SEEDED_DRAFT,
      steps: [
        {
          stepId: 'STEP-1',
          references: [{ partId: 'PRT-GONE', name: 'Wheel bolt retaining clip', state: 'Skeletal' }],
        },
        { stepId: 'STEP-2', references: [] },
      ],
    }
    const verdict = partReferencePublishCheck.run({
      draft: dangling,
      registry: confirmedPartsRegistry,
    })
    expect(verdict.outcome).toBe('blocked')
  })

  // FAILS IF: the blocking element drops the STEP or drops the PART NAME.
  // Each half is its own assertion, so dropping either turns one red.
  it('flags an unresolvable reference by step and by part name', () => {
    const dangling: AuthoringDraft = {
      ...SEEDED_DRAFT,
      steps: [
        { stepId: 'STEP-1', references: [] },
        {
          stepId: 'STEP-2',
          references: [{ partId: 'PRT-GONE', name: 'Wheel bolt retaining clip', state: 'Skeletal' }],
        },
      ],
    }
    const flagged = unresolvableReferences({ draft: dangling, registry: confirmedPartsRegistry })
    expect(flagged).toHaveLength(1)
    expect(flagged[0]).toContain('STEP-2')
    expect(flagged[0]).toContain('Wheel bolt retaining clip')
  })

  // FAILS IF: this module registers a check it does not own, or the
  // `library-pointer` row stops naming it.
  it('registers the part-reference half of publish check 7 and nothing else', () => {
    const check = publishCheckById('library-pointer')
    expect(check.ordinal).toBe(7)
    expect(check.ownerModules).toContain('MOD-STU-10')
    expect(partReferencePublishCheck.checkId).toBe('library-pointer')
    expect(partReferencePublishCheck.implementedBy).toBe('MOD-STU-10')

    const registered = registerPublishChecks(
      createPublishCheckRegister<PartsPublishSubject>(),
      partReferencePublishCheck,
    )
    expect(registered.ok).toBe(true)
    if (!registered.ok) return

    // The other ten checks are unregistered here, so publication is blocked
    // eleven ways — and the part-reference blocker must be the one that
    // NAMES the step and the part, not one of the ten "cannot run" rows.
    const dangling: AuthoringDraft = {
      ...SEEDED_DRAFT,
      steps: [
        {
          stepId: 'STEP-1',
          references: [{ partId: 'PRT-GONE', name: 'Retaining clip', state: 'Skeletal' }],
        },
      ],
    }
    const evaluation = evaluatePublish(registered.register, {
      draft: dangling,
      registry: confirmedPartsRegistry,
    })
    expect(evaluation.blocked).toBe(true)
    const mine = evaluation.blockers.find((b) => b.checkId === 'library-pointer')
    expect(mine?.kind).toBe('failed')
    expect(mine?.blockingElement).toContain('STEP-1')
    expect(mine?.blockingElement).toContain('Retaining clip')
  })

  // FAILS IF: an unreachable registry starts passing the check — the
  // fail-closed rule, FB-STU-09 / AC-STU-149.
  it('blocks rather than assumes when the registry cannot answer', () => {
    const verdict = partReferencePublishCheck.run({
      draft: SEEDED_DRAFT,
      registry: unreachablePartsRegistry,
    })
    expect(verdict.outcome).toBe('cannot-run')
  })

  // FAILS IF: the panel stops saying a reference is optional when a step
  // carries none, or starts drawing an empty state instead.
  it('says a step needs no part reference rather than showing an empty state', () => {
    const html = miniFormMarkup()
    expect(html).toContain('data-testid="no-references"')
    expect(html).toMatch(/optional per part/i)
    expect(html).not.toMatch(/There are no /i)
  })

  // FAILS IF: a Skeletal badge stops rendering, or renders on a Complete one.
  it('badges a Skeletal reference and not a Complete one', () => {
    const skeletal = miniFormMarkup({
      references: [{ partId: 'PRT-1', name: 'Retaining clip', state: 'Skeletal' }],
    })
    expect(skeletal).toContain('Skeletal')
    const complete = miniFormMarkup({
      references: [{ partId: 'PRT-1', name: 'Retaining clip', state: 'Complete' }],
    })
    expect(complete).toContain('Retaining clip')
    expect(complete).not.toContain('>Skeletal<')
  })

  // FAILS IF: row 4's statement stops rendering, or a control appears for it.
  it('states completion as a Hub act with no Studio control for it', () => {
    const html = miniFormMarkup()
    const start = html.indexOf('data-testid="completion-cross-surface"')
    expect(start).toBeGreaterThan(-1)
    const region = html.slice(start, html.indexOf('Cross-slice seam'))
    expect(region).toContain('Delivery Operations Hub parts registry')
    expect(region).not.toContain('<button')
  })
})

/* ==================================================================== *
 * STEP 7 — THE AUDIT PATH.
 * ==================================================================== */

describe('the inline add goes through the audit path', () => {
  // FAILS IF: the audit append moves after the reference is attached. The
  // SAME call runs twice — accepted, then refused — and the observable
  // mutation is the reference on the step.
  it('attaches the reference when the audit is accepted and not at all when it fails', () => {
    const written: PartsAuditEntry[] = []
    const accepted = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Wheel bolt retaining clip',
      registry: confirmedPartsRegistry,
      writeAudit: (entry) => {
        written.push(entry)
        return { ok: true }
      },
    })
    expect(accepted.ok).toBe(true)
    expect(stepReferences(accepted.draft, 'STEP-1')).toHaveLength(1)
    expect(written).toHaveLength(1)

    const refused = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Wheel bolt retaining clip',
      registry: confirmedPartsRegistry,
      writeAudit: () => ({ ok: false, reason: 'the tenant audit log rejected the append' }),
    })
    expect(refused.ok).toBe(false)
    expect(stepReferences(refused.draft, 'STEP-1')).toEqual([])
    expect(refused.draft).toBe(SEEDED_DRAFT)
    expect(refused.ok === false ? refused.reason : '').toMatch(/audit write failed/i)
  })

  // FAILS IF: any domain refusal or the unconfirmed hand-off reaches the
  // sink. The sink THROWS, so one call turns this red.
  it('never reaches the audit sink on a refusal', () => {
    const explode = (): never => {
      throw new Error('the audit sink was reached by a refused action')
    }
    for (const persona of ['tenant-admin', 'worker', 'read-only-auditor', 'supervisor-without-grant'] as const) {
      const r = inlineAddPart({
        draft: SEEDED_DRAFT,
        stepId: 'STEP-1',
        persona,
        name: 'Bolt',
        registry: confirmedPartsRegistry,
        writeAudit: explode,
      })
      expect(r.ok, persona).toBe(false)
    }
    for (const over of [
      { registry: unconfirmedPartsRegistry },
      { registry: unreachablePartsRegistry },
      { tenantState: 'soft-suspended' as TenantWriteState },
      { name: '   ' },
      { stepId: 'STEP-404' },
    ]) {
      const r = inlineAddPart({
        draft: SEEDED_DRAFT,
        stepId: 'STEP-1',
        persona: AUTHOR,
        name: 'Bolt',
        registry: confirmedPartsRegistry,
        writeAudit: explode,
        ...over,
      })
      expect(r.ok, JSON.stringify(Object.keys(over))).toBe(false)
    }
  })

  // FAILS IF: the audit entry starts carrying a role, or drops the step, the
  // minted identifier or the part name.
  it('audits identity and action, never “acting as role”', () => {
    let entry: PartsAuditEntry | null = null
    inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-2',
      persona: AUTHOR,
      name: 'Retaining clip',
      registry: confirmedPartsRegistry,
      writeAudit: (e) => {
        entry = e
        return { ok: true }
      },
    })
    const written = entry as PartsAuditEntry | null
    expect(written).not.toBeNull()
    expect(written?.actorIdentityId).toBe('IDN-STU10-SUP-GRANT')
    expect(written?.action).toBe('inline-add-part')
    expect(written?.stepId).toBe('STEP-2')
    expect(written?.partName).toBe('Retaining clip')
    expect(written?.partId).toMatch(/^PRT-/)
    expect(Object.keys(written ?? {})).not.toContain('role')
    expect(JSON.stringify(written)).not.toMatch(/SUPERVISOR|QUALITY_MANAGER/)
  })
})

/* ==================================================================== *
 * PER-CONTROL AFFORDANCES AND DETERMINISM.
 * ==================================================================== */

describe('per-control affordances', () => {
  // FAILS IF: an affordance is derived from a role list, or a prohibited
  // persona is drawn a disabled control it must not have at all.
  it('answers the inline-add control per persona through the evaluator', () => {
    expect(ALL_PERSONAS).toHaveLength(8)
    const enabled: StudioPersonaColumn[] = []
    const absent: StudioPersonaColumn[] = []
    for (const persona of ALL_PERSONAS) {
      const rendering = partsAffordance(
        'inline-add-a-part-through-the-mini-form',
        persona,
        'Add',
      )
      if (rendering.kind === 'enabled') enabled.push(persona)
      if (rendering.kind === 'absent') absent.push(persona)
    }
    expect(enabled).toEqual([
      'quality-manager',
      'supervisor-with-authoring-grant',
      'implementation-team',
    ])
    expect(absent).toEqual([
      'supervisor-without-grant',
      'plant-manager-persona',
      'tenant-admin',
      'read-only-auditor',
      'worker',
    ])
  })

  // FAILS IF: a prohibited persona is drawn the Add control.
  it('draws no Add control for a prohibited persona', () => {
    const html = miniFormMarkup({ persona: 'read-only-auditor' })
    expect(html).not.toContain('>Add<')
    expect(html).toContain('>Cancel<')
  })

  // FAILS IF: minting is derived from anything but a counter-free rule.
  it('mints deterministically and renders deterministically', () => {
    expect(miniFormMarkup()).toBe(miniFormMarkup())
    const once = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Bolt M12',
      registry: confirmedPartsRegistry,
      writeAudit: accepting,
    })
    const twice = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: AUTHOR,
      name: 'Bolt M12',
      registry: confirmedPartsRegistry,
      writeAudit: accepting,
    })
    expect(JSON.stringify(once.draft)).toBe(JSON.stringify(twice.draft))
  })
})

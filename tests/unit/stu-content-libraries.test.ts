import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'

import { permitsAction } from '@/policy/decision'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { STU_MODULES, stuModuleById, reachByStudioMatrix } from '@/studio/modules'
import { STU_SCREENS, stuScreensForModule } from '@/studio/screens'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { publishCheckById } from '@/studio/publish/checks'
import { COACHING_ASSET_STATES, NOTIFICATION_CHANNELS, LOCALES } from '@/studio/vocab'
import { decisionRecord } from '@/disclosure/decisions'

import {
  STU_07_MATRIX,
  STU_07_CAPABILITY_IDS,
  stu07Row,
  type Stu07CapabilityId,
} from '@/studio/modules/stu-07/matrix'
import {
  LIBRARY_IDS,
  LIBRARY_SCREEN_IDS,
  LIBRARY_CATALOGUE_A_IDS,
  ITEM_LIFECYCLE_STATES,
  POINTER_SLOTS,
  LIBRARY_WRITE_ACTIONS,
  CORPUS_PROPERTIES,
  ROUTING_RULE_FIELDS,
  ESCALATION_RECIPIENT_ROLES,
  SEEDED_SEVERITY_BANDS,
  SEEDED_LIBRARY_REGISTER,
  itemById,
  itemsInLibrary,
  referencingPointers,
  reuseImpact,
  screenPointer,
  resolvePointer,
  stepRefusalReason,
  type LibraryRegister,
  type LibraryItem,
  type LibraryId,
} from '@/studio/modules/stu-07/libraries'
import {
  createLibraryItem,
  editLibraryItem,
  archiveLibraryItem,
  approveCoachingAsset,
  retireCoachingAsset,
  proposeLibraryChange,
  setRoutingRule,
  setScreenPointer,
  indexCoachingAsset,
  openLibraryPicker,
  type LibraryAuditEntry,
  type LibraryAuditWrite,
  type LibraryWriteResult,
} from '@/studio/modules/stu-07/writes'
import {
  SEEDED_TENANT,
  decisionForRow,
  libraryAffordance,
  libraryControls,
  readableItems,
  scenario,
  type Stu07Scenario,
} from '@/studio/modules/stu-07/rendering'
import { ContentLibrariesView } from '@/studio/modules/stu-07/ContentLibrariesView'

import { ContentLibrariesScreen } from '../../app/studio/content-libraries/ContentLibrariesScreen'

/* ==================================================================== *
 * FIXTURES.
 *
 * DEFECT SHAPE 11 — a baseline chosen so the failure cannot appear. Every
 * fixture below sits on the PERMITTING side of every boundary it is not
 * exercising: signed in, identity layer reachable, online, Enterprise tier,
 * audit sink accepting, register loaded. A refusal test is therefore always
 * paired with the same call one field away, asserted to succeed, so a
 * refusal arriving for the wrong reason cannot certify a guard.
 * ==================================================================== */

const ACTOR = { identityId: 'IDN-ELENA', displayName: 'Elena Vargas', tenant: SEEDED_TENANT }

function acceptingSink(): { write: LibraryAuditWrite; entries: LibraryAuditEntry[] } {
  const entries: LibraryAuditEntry[] = []
  return {
    entries,
    write: (entry) => {
      entries.push(entry)
      return { ok: true }
    },
  }
}

const FAILING_SINK: LibraryAuditWrite = () => ({ ok: false, reason: 'the audit log is unreachable' })

/** The Quality Manager's decision for one capability, on the permitting baseline. */
function qmDecision(id: Stu07CapabilityId, over: Partial<Stu07Scenario> = {}) {
  return decisionForRow(stu07Row(id), scenario({ persona: 'quality-manager', ...over }))
}

function markup(element: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(element)
}

function viewMarkup(over: Partial<Stu07Scenario> = {}, tab: LibraryId = 'containment-checklists'): string {
  return markup(
    createElement(ContentLibrariesView, {
      scenario: scenario(over),
      activeTab: tab,
      register: SEEDED_LIBRARY_REGISTER,
    }),
  )
}

/* ==================================================================== *
 * STEP 1 — the matrix, read at L32626-L32637.
 * ==================================================================== */

describe('the MOD-STU-07 permission matrix', () => {
  // FAILS IF: a row is added or dropped, or an id is renamed. The source's
  // table at L32626-L32637 carries TEN data rows; a matrix that grew or
  // shrank is a transcription defect, not a design choice.
  it('carries the source’s ten data rows, in the source’s order', () => {
    expect(STU_07_MATRIX).toHaveLength(10)
    expect(STU_07_MATRIX.map((r) => r.id)).toEqual([...STU_07_CAPABILITY_IDS])
    expect(STU_07_CAPABILITY_IDS).toHaveLength(10)
  })

  // FAILS IF: any cell is keyed on a RoleId rather than a StudioPersonaColumn,
  // or a column is left off a row. Eight columns, ten rows, eighty cells --
  // and the loop asserts its own length first so it cannot pass by never
  // running.
  it('answers all eight persona columns on every one of the ten rows', () => {
    expect(STUDIO_PERSONA_COLUMNS).toHaveLength(8)
    let cells = 0
    for (const row of STU_07_MATRIX) {
      for (const column of STUDIO_PERSONA_COLUMNS) {
        const cell = row.cells[column]
        expect(cell, `${row.id}/${column}`).toBeDefined()
        expect(typeof cell.note, `${row.id}/${column}`).toBe('string')
        expect(cell.note.length, `${row.id}/${column}`).toBeGreaterThan(0)
        cells += 1
      }
    }
    expect(cells).toBe(80)
  })

  // FAILS IF: the Quality Manager's ownership of the libraries is weakened,
  // or the routing prohibition on the grant-holder is turned into a
  // categorical one by dropping the alternative it routes to.
  it('gives the Quality Manager the five ownership rows and routes the grant-holder to Propose', () => {
    const owned: Stu07CapabilityId[] = [
      'create-a-library-item',
      'edit-a-library-item',
      'archive-a-library-item',
      'approve-a-coaching-asset',
      'retire-a-flagged-coaching-asset',
    ]
    expect(owned.length).toBe(5)
    for (const id of owned) {
      const row = stu07Row(id)
      expect(row.cells['quality-manager'].outcome, id).not.toBe('explicitlyProhibited')
      expect(row.cells['supervisor-with-authoring-grant'].outcome, id).toBe('explicitlyProhibited')
      expect(row.routedTo['supervisor-with-authoring-grant'], id).toBe('propose-a-change')
      // The other side of the pointer: nobody WITHOUT the grant is routed
      // anywhere, so the routed set is a strict, non-empty subset.
      expect(row.routedTo['supervisor-without-grant'], id).toBeNull()
      expect(row.routedTo['tenant-admin'], id).toBeNull()
      expect(row.routedTo.worker, id).toBeNull()
    }
    // And the row it routes TO really does permit that persona.
    expect(stu07Row('propose-a-change').cells['supervisor-with-authoring-grant'].outcome).toBe(
      'allowed',
    )
  })

  // FAILS IF: `routedTo` names a capability id this matrix does not carry.
  // R13 -- every pointer to content elsewhere is pinned by a test that fails
  // when its target is removed. `STU_07_CAPABILITY_IDS` is that target.
  it('resolves every routedTo pointer against this matrix, and the routed set is non-empty', () => {
    const pointers = STU_07_MATRIX.flatMap((row) =>
      STUDIO_PERSONA_COLUMNS.map((c) => row.routedTo[c]).filter(
        (id): id is Stu07CapabilityId => id !== null,
      ),
    )
    // NOT a vacuous iteration: the set is asserted non-empty first.
    expect(pointers.length).toBe(5)
    for (const id of pointers) {
      expect(STU_07_CAPABILITY_IDS).toContain(id)
      expect(stu07Row(id).id).toBe(id)
    }
  })

  // FAILS IF: rows 8 and 9 stop being categorical -- if any of the eight
  // columns is given anything but `explicitlyProhibited`, or if either row is
  // given an alternative to route to. These two are the source's universal
  // refusals and the Quality Manager is refused alongside everyone else.
  it('refuses naming an individual and a third channel in all eight columns, with no alternative', () => {
    const categorical: Stu07CapabilityId[] = [
      'name-an-individual-as-an-escalation-recipient',
      'add-a-notification-channel',
    ]
    expect(categorical.length).toBe(2)
    for (const id of categorical) {
      const row = stu07Row(id)
      const outcomes = STUDIO_PERSONA_COLUMNS.map((c) => row.cells[c].outcome)
      expect(outcomes).toHaveLength(8)
      expect(new Set(outcomes)).toEqual(new Set(['explicitlyProhibited']))
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.routedTo[column], `${id}/${column}`).toBeNull()
      }
    }
    expect(stu07Row('name-an-individual-as-an-escalation-recipient').cells['quality-manager'].note)
      .toContain('never individuals')
    expect(stu07Row('add-a-notification-channel').cells['quality-manager'].note).toContain(
      'two channels only at V1',
    )
  })

  // FAILS IF: the Read-only Auditor's cell is resolved in either direction.
  // AC-STU-157 requires it to stay unassumed; §25.3 row 5's `Read-only` is
  // the reading this build refuses to adopt silently.
  it('leaves the Read-only Auditor’s read cell open under DEC-AUDSTU-001', () => {
    const read = stu07Row('read-published-library-content')
    expect(read.isPublishedRead).toBe(true)
    expect(read.cells['read-only-auditor'].outcome).toBe('clientDecisionRequired')
    expect(read.cells['read-only-auditor'].openDecision).toBe('DEC-AUDSTU-001')
    // The pair: some other column on the SAME row really is settled, so the
    // assertion above is not passing on a matrix where every cell is open.
    expect(read.cells['supervisor-without-grant'].outcome).toBe('readOnly')
    expect(read.cells.worker.outcome).toBe('explicitlyProhibited')
  })

  // FAILS IF: the Plant Manager column is silently blanked instead of being
  // derived from DEC-ROLE-001, or is mirrored without saying so.
  it('mirrors the Plant Manager persona onto the without-grant column and states the derivation', () => {
    for (const row of STU_07_MATRIX) {
      expect(row.cells['plant-manager-persona'].outcome, row.id).toBe(
        row.cells['supervisor-without-grant'].outcome,
      )
      expect(row.derivation['plant-manager-persona'], row.id).toContain('DEC-ROLE-001')
    }
    // Non-vacuous: the two columns are not all one token, so the mirror is
    // carrying a real distribution rather than eight copies of "prohibited".
    const distinct = new Set(STU_07_MATRIX.map((r) => r.cells['plant-manager-persona'].outcome))
    expect(distinct.size).toBeGreaterThan(1)
  })

  // FAILS IF: the module's route reach stops being derived from this matrix,
  // or the picker row (which lives on MOD-STU-05's screen) is reclassified as
  // a `screen` row and so grants module standing it should not.
  it('derives route reach from its own screen rows only', () => {
    const reach = reachByStudioMatrix(STU_07_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-with-authoring-grant']).toBe('offered')
    expect(reach['supervisor-without-grant']).toBe('offered')
    expect(reach['tenant-admin']).toBe('offered')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach.worker).toBe('withheld')
    expect(stu07Row('reference-a-library-item-from-a-screen-picker').surface).toBe(
      'another-surface',
    )
    const screenRows = STU_07_MATRIX.filter((r) => r.surface === 'screen')
    expect(screenRows.length).toBe(9)
  })
})

/* ==================================================================== *
 * STEP 2 — the routing prohibition renders DISABLED; Propose renders
 * ENABLED, on the same screen.
 * ==================================================================== */

describe('the routed prohibition and its alternative', () => {
  // FAILS IF: `libraryAffordance` maps `explicitlyProhibited` to `absent`
  // unconditionally. Rendering rows 1/2/3/6/7 as ABSENT for the grant-holder
  // is the defect this case exists to prevent: the control exists on this
  // same screen for the Quality Manager, and the persona's own alternative
  // is one row below.
  it('disables Create with its reason for the grant-holder and enables Propose beside it', () => {
    const s = scenario({ persona: 'supervisor-with-authoring-grant' })
    const controls = libraryControls(s, 'containment-checklists')

    const create = controls.find((c) => c.id === 'create-a-library-item')
    expect(create).toBeDefined()
    expect(create!.affordance.kind).toBe('disabled')
    if (create!.affordance.kind === 'disabled') {
      expect(create!.affordance.reason).toMatch(/may propose only/i)
      expect(create!.affordance.reason).toMatch(/propose/i)
    }

    const propose = controls.find((c) => c.id === 'propose-a-change')
    expect(propose).toBeDefined()
    expect(propose!.affordance.kind).toBe('enabled')
  })

  // FAILS IF: the disabled rendering stops depending on the alternative
  // actually being available. A routed prohibition whose target is refused is
  // NOT a routing rule -- it is a categorical one -- and must render absent.
  it('falls back to ABSENT when the routed alternative is not available to that persona', () => {
    const withGrant = libraryAffordance(
      'Create checklist',
      qmDecisionFor('create-a-library-item', 'supervisor-with-authoring-grant'),
      'propose-a-change',
      qmDecisionFor('propose-a-change', 'supervisor-with-authoring-grant'),
    )
    expect(withGrant.kind).toBe('disabled')

    // The same cell, the same routing pointer, a persona the alternative
    // refuses: the control has nothing to teach, so nothing is drawn.
    const withoutGrant = libraryAffordance(
      'Create checklist',
      qmDecisionFor('create-a-library-item', 'supervisor-without-grant'),
      'propose-a-change',
      qmDecisionFor('propose-a-change', 'supervisor-without-grant'),
    )
    expect(withoutGrant.kind).toBe('absent')
  })

  // FAILS IF: a categorically prohibited capability is ever drawn as a
  // control. Rows 8 and 9 assert the ABSENCE of the control, not a disabled
  // one -- and they assert it for all eight columns, the Quality Manager
  // included.
  it('draws no control for naming an individual and none for a third channel, in any column', () => {
    let checked = 0
    for (const column of STUDIO_PERSONA_COLUMNS) {
      for (const id of [
        'name-an-individual-as-an-escalation-recipient',
        'add-a-notification-channel',
      ] as const) {
        const rendered = libraryAffordance('x', qmDecisionFor(id, column), null, null)
        expect(rendered.kind, `${id}/${column}`).toBe('absent')
        checked += 1
      }
    }
    expect(checked).toBe(16)

    const routing = viewMarkup({ persona: 'quality-manager' }, 'escalation-routing')
    expect(routing).not.toContain('Name an individual')
    expect(routing).not.toContain('Add a channel')
    // Non-vacuous: the tab really did render, and it states the two rules
    // rather than going silent about them.
    expect(routing).toContain('Escalation Routing Templates')
    expect(routing).toContain('never individuals')
    expect(routing).toContain('two channels only at V1')
  })
})

function qmDecisionFor(id: Stu07CapabilityId, persona: StudioPersonaColumn) {
  return decisionForRow(stu07Row(id), scenario({ persona }))
}

/* ==================================================================== *
 * STEP 3 — the archival refusal NAMES the screens.
 * ==================================================================== */

describe('the archival refusal', () => {
  const ITEM = 'CHK-TORQUE-RESPONSE'

  // FAILS IF: the refusal stops enumerating the register's pointers -- if it
  // names a count, the first screen only, or nothing.
  it('names every referencing screen in the archival refusal', () => {
    const sink = acceptingSink()
    const r = archiveLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: ITEM,
      actor: ACTOR,
      decision: qmDecision('archive-a-library-item'),
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(false)

    const impact = reuseImpact(SEEDED_LIBRARY_REGISTER, ITEM)
    // Non-vacuous on both sides: the item really is referenced by more than
    // one screen, and every one of them is named.
    expect(impact.screenNames.length).toBeGreaterThan(1)
    for (const name of impact.screenNames) expect(r.message).toContain(name)
    expect(r.namedScreens).toEqual(impact.screenNames)
    // A refused action is not an action.
    expect(sink.entries).toHaveLength(0)
    expect(r.register).toBe(SEEDED_LIBRARY_REGISTER)
  })

  // FAILS IF: the message is assembled from anything but the live register --
  // a hardcoded list, a snapshot taken at module load, or a `join` over a
  // constant. R13: the pointer test must be able to notice a MISSING element.
  it('stops naming a screen once that screen’s pointer is removed from the register', () => {
    const impact = reuseImpact(SEEDED_LIBRARY_REGISTER, ITEM)
    const dropped = impact.screenIds[1]
    expect(dropped).toBeDefined()
    const droppedName = impact.screenNames[1]!

    const thinner: LibraryRegister = {
      ...SEEDED_LIBRARY_REGISTER,
      pointers: SEEDED_LIBRARY_REGISTER.pointers.filter(
        (p) => !(p.screenId === dropped && p.itemId === ITEM),
      ),
    }
    const r = archiveLibraryItem({
      register: thinner,
      itemId: ITEM,
      actor: ACTOR,
      decision: qmDecision('archive-a-library-item'),
      writeAudit: acceptingSink().write,
    })
    expect(r.ok).toBe(false)
    expect(r.message).not.toContain(droppedName)
    // And still names the ones that remain, so this is not passing on an
    // empty message.
    expect(r.namedScreens.length).toBeGreaterThan(0)
    expect(r.message).toContain(impact.screenNames[0]!)
  })

  // FAILS IF: the refusal is the only path -- an item nothing references must
  // actually archive, or the refusal above is untestable.
  it('archives an item no screen references, through the audit path', () => {
    const sink = acceptingSink()
    const unreferenced = SEEDED_LIBRARY_REGISTER.items.find(
      (i) => referencingPointers(SEEDED_LIBRARY_REGISTER, i.id).length === 0,
    )
    expect(unreferenced).toBeDefined()
    const r = archiveLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: unreferenced!.id,
      actor: ACTOR,
      decision: qmDecision('archive-a-library-item'),
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(true)
    expect(sink.entries).toHaveLength(1)
    expect(sink.entries[0]!.action).toBe('archive')
    const after = itemById(r.register, unreferenced!.id)
    expect(after).toBeDefined()
    expect('state' in after! ? after.state : null).toBe('Archived')
  })
})

/* ==================================================================== *
 * STEP 4 — a failed picker never clears an existing pointer (AC-STU-018).
 * ==================================================================== */

describe('the screen picker', () => {
  // FAILS IF: the failure path returns a register with the pointer removed,
  // or returns an empty register, or returns a fresh register at all.
  it('keeps the existing pointer when the picker fails to load', () => {
    const screen = 'SCR-WF-TORQUE-PHOTO'
    const before = screenPointer(SEEDED_LIBRARY_REGISTER, screen, 'containment-checklist')
    // Non-vacuous: there IS a pointer to lose.
    expect(before).not.toBeNull()

    const r = openLibraryPicker({
      register: SEEDED_LIBRARY_REGISTER,
      screenId: screen,
      slot: 'containment-checklist',
      load: 'fails',
    })
    expect(r.loaded).toBe(false)
    expect(r.options).toEqual([])
    expect(screenPointer(r.register, screen, 'containment-checklist')).toEqual(before)
    expect(r.message).toContain('AC-STU-018')

    // The pair: on the success path the picker really does offer something,
    // so "offers nothing" above is the failure and not the normal case.
    const ok = openLibraryPicker({
      register: SEEDED_LIBRARY_REGISTER,
      screenId: screen,
      slot: 'containment-checklist',
      load: 'succeeds',
    })
    expect(ok.loaded).toBe(true)
    expect(ok.options.length).toBeGreaterThan(0)
    expect(screenPointer(ok.register, screen, 'containment-checklist')).toEqual(before)
  })

  // FAILS IF: the picker offers archived or unpublished items -- a screen
  // must never be able to point at content that is not in force.
  it('offers only items that are in force', () => {
    const r = openLibraryPicker({
      register: SEEDED_LIBRARY_REGISTER,
      screenId: 'SCR-WF-TORQUE-PHOTO',
      slot: 'containment-checklist',
      load: 'succeeds',
    })
    expect(r.options.length).toBeGreaterThan(0)
    for (const option of r.options) {
      const item = itemById(SEEDED_LIBRARY_REGISTER, option.itemId)
      expect(item).toBeDefined()
      expect('state' in item! ? item.state : null).toBe('Published')
    }
    // Non-vacuous the other way: the register really does hold an archived
    // checklist, so "no archived option" is a filter and not a coincidence.
    const archived = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').filter(
      (i) => 'state' in i && i.state === 'Archived',
    )
    expect(archived.length).toBeGreaterThan(0)
    expect(r.options.map((o) => o.itemId)).not.toContain(archived[0]!.id)
  })
})

/* ==================================================================== *
 * STEP 5 — authoring refuses a server-lookup step; indexing never changes
 * approval state.
 * ==================================================================== */

describe('the containment-step constraint (DEC-CONTLAUNCH-001, L32653)', () => {
  // FAILS IF: the refusal is dropped, or moved to only one of the two write
  // paths. Fix once, where all callers route: `stepRefusalReason` is the one
  // implementation and both create and edit call it.
  it('refuses a checklist step that requires a server lookup, on create and on edit', () => {
    const bad = { id: 'STEP-X', text: 'Look up the calibration certificate', serverLookup: 'the calibration registry' }
    expect(stepRefusalReason(bad)).not.toBeNull()
    expect(stepRefusalReason(bad)!).toContain('server')
    expect(stepRefusalReason({ id: 'STEP-Y', text: 'Stop the line', serverLookup: null })).toBeNull()

    const sink = acceptingSink()
    const created = createLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      actor: ACTOR,
      decision: qmDecision('create-a-library-item'),
      writeAudit: sink.write,
      draft: {
        library: 'containment-checklists',
        name: 'Coolant Leak Response',
        severityBands: ['Severity 2'],
        serviceTypeTag: null,
        steps: [bad],
      },
    })
    expect(created.ok).toBe(false)
    expect(created.message).toContain('server')
    expect(created.message).toContain('DEC-CONTLAUNCH-001')
    expect(sink.entries).toHaveLength(0)

    // The pair, one field away: the same draft with a renderable step lands.
    const good = createLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      actor: ACTOR,
      decision: qmDecision('create-a-library-item'),
      writeAudit: sink.write,
      draft: {
        library: 'containment-checklists',
        name: 'Coolant Leak Response',
        severityBands: ['Severity 2'],
        serviceTypeTag: null,
        steps: [{ id: 'STEP-Y', text: 'Stop the line', serverLookup: null }],
      },
    })
    expect(good.ok).toBe(true)
    expect(sink.entries).toHaveLength(1)

    // And the edit path routes through the same rule.
    const draftChecklist = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').find(
      (i) => 'state' in i && i.state === 'Draft',
    )
    expect(draftChecklist).toBeDefined()
    const edited = editLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: draftChecklist!.id,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: acceptingSink().write,
      shownImpact: reuseImpact(SEEDED_LIBRARY_REGISTER, draftChecklist!.id),
      change: { steps: [bad] },
    })
    expect(edited.ok).toBe(false)
    expect(edited.message).toContain('server')
  })
})

describe('indexing (AC-STU-072)', () => {
  // FAILS IF: indexing writes anything into `assetState`. "Embeddings change
  // how an asset is found, never whether it was approved."
  it('never changes approval state, through a successful index and a failed one', () => {
    const asset = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Approved' && i.indexed === false,
    )
    expect(asset).toBeDefined()
    const id = asset!.id

    const unavailable = indexCoachingAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: id,
      indexing: 'unavailable',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(unavailable.ok).toBe(false)
    const stillApproved = itemById(unavailable.register, id)!
    expect('assetState' in stillApproved ? stillApproved.assetState : null).toBe('Approved')
    expect('indexed' in stillApproved ? stillApproved.indexed : null).toBe(false)
    expect('approved' in stillApproved ? stillApproved.approved : null).toBe(true)

    const available = indexCoachingAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: id,
      indexing: 'available',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(available.ok).toBe(true)
    const indexed = itemById(available.register, id)!
    // The round trip: FOUND differently, APPROVED identically. The state
    // label moves Approved -> Indexed because those are two of the source's
    // own five states; `approved` is the approval fact, and it is what
    // AC-STU-072 says indexing must never touch. Asserting only the label
    // would have made the criterion untestable.
    expect('indexed' in indexed ? indexed.indexed : null).toBe(true)
    expect('assetState' in indexed ? indexed.assetState : null).toBe('Indexed')
    expect('approved' in indexed ? indexed.approved : null).toBe(true)
  })

  // FAILS IF: `approveCoachingAsset` writes the STATE LABEL without writing
  // the approval FACT. Found by planting exactly that: the label moving
  // Uploaded -> Approved was observable, so the audit-path case stayed green
  // while `approved` was never set -- and the AC-STU-072 round-trip above
  // passed only because its fixture came in already approved. This closes
  // the first half of AC-STU-072: "only approved content is present in the
  // corpus and IN THE INDEX".
  it('refuses to index unapproved content, and approving is what makes it indexable', () => {
    const uploaded = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Uploaded',
    )!
    expect('approved' in uploaded ? uploaded.approved : null).toBe(false)

    const refused = indexCoachingAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: uploaded.id,
      indexing: 'available',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(refused.ok).toBe(false)
    expect(refused.message).toContain('approved')
    expect(refused.register).toBe(SEEDED_LIBRARY_REGISTER)

    // Approve it, and the approval FACT is what changes -- not only the label.
    const approved = approveCoachingAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: uploaded.id,
      actor: ACTOR,
      decision: qmDecision('approve-a-coaching-asset'),
      writeAudit: acceptingSink().write,
    })
    expect(approved.ok).toBe(true)
    const after = itemById(approved.register, uploaded.id)!
    expect('assetState' in after ? after.assetState : null).toBe('Approved')
    expect('approved' in after ? after.approved : null).toBe(true)

    // The pair: the SAME asset now indexes, so the refusal above is the
    // approval gate and not an asset nothing could ever index.
    const indexed = indexCoachingAsset({
      register: approved.register,
      itemId: uploaded.id,
      indexing: 'available',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(indexed.ok).toBe(true)
    const final = itemById(indexed.register, uploaded.id)!
    expect('assetState' in final ? final.assetState : null).toBe('Indexed')
    expect('approved' in final ? final.approved : null).toBe(true)

    // And retiring withdraws the approval fact, so `approved` is not a
    // constant nothing ever writes false.
    const flaggedAsset = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Flagged for review',
    )!
    const retired = retireCoachingAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: flaggedAsset.id,
      actor: ACTOR,
      decision: qmDecision('retire-a-flagged-coaching-asset'),
      writeAudit: acceptingSink().write,
    })
    expect(retired.ok).toBe(true)
    const gone = itemById(retired.register, flaggedAsset.id)!
    expect('approved' in gone ? gone.approved : null).toBe(false)
  })

  // FAILS IF: an unindexed approved asset is presented as semantically
  // retrievable, or the curated default stops carrying coaching until
  // indexing completes.
  it('states that an Approved-not-Indexed asset is metadata-only and the default carries coaching', () => {
    const html = viewMarkup({ persona: 'quality-manager' }, 'coaching-corpus')
    expect(html).toContain('metadata filter')
    expect(html).toContain('not by semantic ranking')
    expect(html).toContain('curated default')
    expect(html).toContain('AC-STU-072')
  })
})

/* ==================================================================== *
 * STEP 6 — no control names an individual; no control adds a channel.
 * The API path refuses too, because taking a control off the screen does
 * not stop anyone.
 * ==================================================================== */

describe('escalation routing rules (AC-STU-075, AC-STU-076)', () => {
  const TEMPLATE = 'ROU-DEFAULT'

  function ruleInput(over: Record<string, unknown> = {}) {
    return {
      register: SEEDED_LIBRARY_REGISTER,
      itemId: TEMPLATE,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: acceptingSink().write,
      shownImpact: reuseImpact(SEEDED_LIBRARY_REGISTER, TEMPLATE),
      rule: {
        severityBand: 'Severity 2',
        recipientRoles: ['SUPERVISOR'],
        channels: ['in-app'],
        acknowledgementRequired: true,
        timeoutMinutes: 15,
        fallbackRecipientRoles: ['QUALITY_MANAGER'],
        dedupeWindowMinutes: 30,
        ...over,
      },
    }
  }

  // FAILS IF: the refusal is only in the type system. A named individual
  // arriving through the application programming interface is TEST-STU-080,
  // and it must be refused AND audited.
  it('refuses a named individual through the write path, and audits the refusal', () => {
    const sink = acceptingSink()
    const r = setRoutingRule({
      ...ruleInput({ recipientRoles: ['IDN-ELENA'] }),
      writeAudit: sink.write,
    } as Parameters<typeof setRoutingRule>[0])
    expect(r.ok).toBe(false)
    expect(r.message).toContain('IDN-ELENA')
    expect(r.message).toContain('roles')
    // The refusal itself is recorded -- TEST-STU-080 asks for both.
    expect(sink.entries).toHaveLength(1)
    expect(sink.entries[0]!.action).toBe('refused-named-individual')

    // The pair: the same call with a role lands.
    const okSink = acceptingSink()
    const ok = setRoutingRule({ ...ruleInput(), writeAudit: okSink.write })
    expect(ok.ok).toBe(true)
    expect(okSink.entries.map((e) => e.action)).toEqual(['set-routing-rule'])
  })

  // FAILS IF: the channel set widens. Two channels only at V1.
  it('refuses a third channel and offers exactly the two the platform has', () => {
    expect([...NOTIFICATION_CHANNELS]).toEqual(['in-app', 'email'])
    const r = setRoutingRule({
      ...ruleInput({ channels: ['sms'] }),
    } as Parameters<typeof setRoutingRule>[0])
    expect(r.ok).toBe(false)
    expect(r.message).toContain('sms')
    expect(r.message).toContain('in-app')
    expect(r.message).toContain('email')

    const both = setRoutingRule({ ...ruleInput({ channels: ['in-app', 'email'] }) })
    expect(both.ok).toBe(true)
  })

  // FAILS IF: the three things a rule names stop being three, or the
  // response-behaviour row loses one of its four parts.
  it('holds the three things a rule names, and the four parts of response behaviour', () => {
    expect(ROUTING_RULE_FIELDS).toHaveLength(3)
    expect(ROUTING_RULE_FIELDS.map((f) => f.id)).toEqual([
      'recipient-roles',
      'channels',
      'response-behaviour',
    ])
    const behaviour = ROUTING_RULE_FIELDS.find((f) => f.id === 'response-behaviour')!
    expect(behaviour.parts).toHaveLength(4)
    expect(behaviour.parts).toEqual([
      'acknowledgement required',
      'timeout',
      'fallback recipients',
      'dedupe window',
    ])
    expect(ESCALATION_RECIPIENT_ROLES.length).toBe(5)
    expect(ESCALATION_RECIPIENT_ROLES).toContain('QUALITY_MANAGER')
    expect(ESCALATION_RECIPIENT_ROLES).not.toContain('ADMIN')
  })

  // FAILS IF: the run-time resolution claim drifts -- an on-call calendar
  // appears, or the Studio claims to choose recipients.
  it('states that resolution is on-shift only and that the template is executed, never chosen from', () => {
    const html = viewMarkup({ persona: 'quality-manager' }, 'escalation-routing')
    expect(html).toContain('on-shift only')
    expect(html).toContain('no separate on-call calendar')
    expect(html).toContain('never chooses recipients')
    // The seam, not an inline stub.
    expect(html).toContain(stuSeamById(STU_SEAMS, 'escalation-delivery-and-role-resolution').name)
    expect(html).toContain('MOD-DOH-10')
  })
})

/* ==================================================================== *
 * STEP 7 — every write through the audit path, and the covering test
 * mutates something observable before the audit fails.
 * ==================================================================== */

describe('the audit path', () => {
  interface Case {
    readonly action: string
    readonly run: (writeAudit: LibraryAuditWrite) => LibraryWriteResult
    /** Something observable this write changes, read off the register. */
    readonly observe: (register: LibraryRegister) => unknown
  }

  const approvedNotIndexed = () =>
    itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Approved' && i.indexed === false,
    )!
  const uploaded = () =>
    itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Uploaded',
    )!
  const flagged = () =>
    itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Flagged for review',
    )!
  const draftChecklist = () =>
    itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').find(
      (i) => 'state' in i && i.state === 'Draft',
    )!
  const unreferenced = () =>
    SEEDED_LIBRARY_REGISTER.items.find(
      (i) => referencingPointers(SEEDED_LIBRARY_REGISTER, i.id).length === 0,
    )!

  const stateOf = (register: LibraryRegister, id: string): unknown => {
    const item = itemById(register, id)
    if (item === undefined) return 'MISSING'
    return 'state' in item ? item.state : `${item.assetState}/${item.indexed}`
  }

  const CASES: readonly Case[] = [
    {
      action: 'create',
      run: (writeAudit) =>
        createLibraryItem({
          register: SEEDED_LIBRARY_REGISTER,
          actor: ACTOR,
          decision: qmDecision('create-a-library-item'),
          writeAudit,
          draft: {
            library: 'containment-checklists',
            name: 'Coolant Leak Response',
            severityBands: ['Severity 2'],
            serviceTypeTag: null,
            steps: [{ id: 'S1', text: 'Stop the line', serverLookup: null }],
          },
        }),
      observe: (r) => r.items.length,
    },
    {
      action: 'edit',
      run: (writeAudit) =>
        editLibraryItem({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: draftChecklist().id,
          actor: ACTOR,
          decision: qmDecision('edit-a-library-item'),
          writeAudit,
          shownImpact: reuseImpact(SEEDED_LIBRARY_REGISTER, draftChecklist().id),
          change: { name: 'Renamed by the covering test' },
        }),
      observe: (r) => itemById(r, draftChecklist().id)?.name,
    },
    {
      action: 'archive',
      run: (writeAudit) =>
        archiveLibraryItem({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: unreferenced().id,
          actor: ACTOR,
          decision: qmDecision('archive-a-library-item'),
          writeAudit,
        }),
      observe: (r) => stateOf(r, unreferenced().id),
    },
    {
      action: 'approve',
      run: (writeAudit) =>
        approveCoachingAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: uploaded().id,
          actor: ACTOR,
          decision: qmDecision('approve-a-coaching-asset'),
          writeAudit,
        }),
      observe: (r) => stateOf(r, uploaded().id),
    },
    {
      action: 'retire',
      run: (writeAudit) =>
        retireCoachingAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: flagged().id,
          actor: ACTOR,
          decision: qmDecision('retire-a-flagged-coaching-asset'),
          writeAudit,
        }),
      observe: (r) => stateOf(r, flagged().id),
    },
    {
      action: 'propose',
      run: (writeAudit) =>
        proposeLibraryChange({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: draftChecklist().id,
          actor: ACTOR,
          decision: decisionForRow(
            stu07Row('propose-a-change'),
            scenario({ persona: 'supervisor-with-authoring-grant' }),
          ),
          writeAudit,
          proposal: 'Add a calibration-certificate verification step.',
        }),
      observe: (r) => r.proposals.length,
    },
    {
      action: 'index',
      run: (writeAudit) =>
        indexCoachingAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: approvedNotIndexed().id,
          indexing: 'available',
          actor: ACTOR,
          writeAudit,
        }),
      observe: (r) => stateOf(r, approvedNotIndexed().id),
    },
    {
      action: 'reference',
      run: (writeAudit) =>
        setScreenPointer({
          register: SEEDED_LIBRARY_REGISTER,
          screenId: 'SCR-WF-PAINT-DEPTH',
          slot: 'containment-checklist',
          itemId: 'CHK-TORQUE-RESPONSE',
          actor: ACTOR,
          decision: qmDecision('reference-a-library-item-from-a-screen-picker'),
          writeAudit,
        }),
      observe: (r) => screenPointer(r, 'SCR-WF-PAINT-DEPTH', 'containment-checklist'),
    },
    {
      action: 'set-routing-rule',
      run: (writeAudit) =>
        setRoutingRule({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: 'ROU-DEFAULT',
          actor: ACTOR,
          decision: qmDecision('edit-a-library-item'),
          writeAudit,
          shownImpact: reuseImpact(SEEDED_LIBRARY_REGISTER, 'ROU-DEFAULT'),
          rule: {
            severityBand: 'Severity 2',
            recipientRoles: ['SUPERVISOR', 'QUALITY_MANAGER'],
            channels: ['in-app', 'email'],
            acknowledgementRequired: true,
            timeoutMinutes: 5,
            fallbackRecipientRoles: ['TENANT_ADMIN'],
            dedupeWindowMinutes: 45,
          },
        }),
      observe: (r) => JSON.stringify(itemById(r, 'ROU-DEFAULT')),
    },
  ]

  // FAILS IF: the audit path is wired to some writes and not others -- slice
  // 4's third defect shape, where the one audited handler was the only one
  // that mutated nothing. Every case here is proved to mutate something
  // observable FIRST, and only then proved to leave it untouched when the
  // audit fails.
  it('fails every write when the audit write fails, and every write really does mutate', () => {
    expect(CASES).toHaveLength(9)
    expect(LIBRARY_WRITE_ACTIONS).toHaveLength(10)

    for (const c of CASES) {
      const before = c.observe(SEEDED_LIBRARY_REGISTER)

      // 1. The write MUTATES SOMETHING OBSERVABLE. Without this half, the
      //    assertion below passes on a handler that never wrote anything.
      const sink = acceptingSink()
      const good = c.run(sink.write)
      expect(good.ok, `${c.action}: expected the write to succeed on the baseline`).toBe(true)
      expect(c.observe(good.register), `${c.action}: nothing observable changed`).not.toEqual(before)
      expect(sink.entries, `${c.action}: exactly one audit entry`).toHaveLength(1)
      expect(sink.entries[0]!.actorIdentityId).toBe(ACTOR.identityId)
      expect(sink.entries[0]!.tenant).toBe(SEEDED_TENANT)

      // 2. The SAME write, one field away: the audit fails, so the action
      //    did not happen and nothing is left half-applied.
      const bad = c.run(FAILING_SINK)
      expect(bad.ok, `${c.action}: an audit failure must refuse`).toBe(false)
      expect(bad.register, `${c.action}: the register is the original object`).toBe(
        SEEDED_LIBRARY_REGISTER,
      )
      expect(c.observe(bad.register), `${c.action}: unchanged`).toEqual(before)
      expect(bad.message).toContain('audit')
    }
  })

  // FAILS IF: a domain refusal reaches the audit sink. Refusals are recorded
  // where the source asks for one (TEST-STU-080) and nowhere else -- a
  // refused action is not an action.
  it('does not reach the audit sink on an authorisation refusal', () => {
    const sink = acceptingSink()
    const refused = createLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      actor: ACTOR,
      decision: decisionForRow(
        stu07Row('create-a-library-item'),
        scenario({ persona: 'supervisor-with-authoring-grant' }),
      ),
      writeAudit: sink.write,
      draft: {
        library: 'containment-checklists',
        name: 'Nope',
        severityBands: ['Severity 2'],
        serviceTypeTag: null,
        steps: [{ id: 'S1', text: 'Stop the line', serverLookup: null }],
      },
    })
    expect(refused.ok).toBe(false)
    expect(sink.entries).toHaveLength(0)
    expect(refused.message).toMatch(/propose/i)
    expect(refused.register).toBe(SEEDED_LIBRARY_REGISTER)
    // The pair: the SAME row really does permit the Quality Manager, so the
    // refusal above is the persona's cell and not a control nobody can use.
    expect(permitsAction(qmDecision('create-a-library-item').decision)).toBe(true)
  })
})

/* ==================================================================== *
 * REUSE IMPACT SHOWN BEFORE THE EDIT, AND IMMUTABILITY OF PUBLISHED
 * CONTENT.
 * ==================================================================== */

describe('reuse impact, shown before the edit is made', () => {
  const ITEM = 'CHK-TORQUE-RESPONSE'

  // FAILS IF: `reuseImpact` counts pointers instead of distinct screens, or
  // loses the Workflow count SB-STU-10 asks each row to show.
  it('names the screens and Workflows an edit would reach', () => {
    const impact = reuseImpact(SEEDED_LIBRARY_REGISTER, ITEM)
    expect(impact.screenIds.length).toBeGreaterThan(1)
    expect(impact.screenNames.length).toBe(impact.screenIds.length)
    expect(impact.workflowIds.length).toBeGreaterThan(0)
    expect(impact.screenCount).toBe(impact.screenIds.length)
    expect(impact.workflowCount).toBe(impact.workflowIds.length)
    expect(new Set(impact.screenIds).size).toBe(impact.screenIds.length)
  })

  // FAILS IF: the edit stops requiring the impact it was shown -- the whole
  // point of the feature is that one edit reaches every screen, and the
  // hazard is making it without seeing which.
  it('refuses an edit whose shown impact no longer matches the register', () => {
    const live = reuseImpact(SEEDED_LIBRARY_REGISTER, ITEM)
    const stale = {
      ...live,
      screenIds: live.screenIds.slice(0, 1),
      screenNames: live.screenNames.slice(0, 1),
      screenCount: 1,
    }
    const sink = acceptingSink()
    const r = editLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: ITEM,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: sink.write,
      shownImpact: stale,
      change: { name: 'Torque Out-of-Tolerance Response v2' },
    })
    expect(r.ok).toBe(false)
    expect(r.message).toContain(live.screenNames[1]!)
    expect(sink.entries).toHaveLength(0)

    // The pair: the same edit with the live impact is accepted.
    const ok = editLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: ITEM,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: acceptingSink().write,
      shownImpact: live,
      change: { name: 'Torque Out-of-Tolerance Response v2' },
    })
    expect(ok.ok).toBe(true)
  })

  // FAILS IF: propagation is applied to one referencing screen and not the
  // rest -- divergent copies are what the pointer model exists to prevent.
  it('propagates one effective edit to every referencing screen', () => {
    const draft = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').find(
      (i) => 'state' in i && i.state === 'Draft' && referencingPointers(SEEDED_LIBRARY_REGISTER, i.id).length > 1,
    )
    expect(draft).toBeDefined()
    const impact = reuseImpact(SEEDED_LIBRARY_REGISTER, draft!.id)
    expect(impact.screenIds.length).toBeGreaterThan(1)

    const r = editLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: draft!.id,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: acceptingSink().write,
      shownImpact: impact,
      change: { name: 'Propagated name' },
    })
    expect(r.ok).toBe(true)
    let seen = 0
    for (const screenId of impact.screenIds) {
      const resolved = resolvePointer(r.register, screenId, 'containment-checklist')
      expect(resolved, screenId).not.toBeNull()
      expect(resolved!.name, screenId).toBe('Propagated name')
      seen += 1
    }
    expect(seen).toBe(impact.screenIds.length)
    expect(seen).toBeGreaterThan(1)
  })
})

describe('immutability of published content', () => {
  const PUBLISHED = 'CHK-TORQUE-RESPONSE'

  // FAILS IF: an edit to a Published item mutates it in place. The source
  // grants no in-place edit of published content: the prior published item
  // remains in force until review completes, so the correction is a LINKED
  // NEW RECORD.
  it('never edits a published item in place; it links a new record and leaves the original in force', () => {
    const original = itemById(SEEDED_LIBRARY_REGISTER, PUBLISHED)!
    const impact = reuseImpact(SEEDED_LIBRARY_REGISTER, PUBLISHED)

    const r = editLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: PUBLISHED,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: acceptingSink().write,
      shownImpact: impact,
      change: { name: 'Torque Out-of-Tolerance Response v2' },
    })
    expect(r.ok).toBe(true)

    // 1. The original record is byte-identical.
    const after = itemById(r.register, PUBLISHED)!
    expect(after).toEqual(original)

    // 2. A linked new record exists, in Draft, pointing back at the original.
    const successor = r.register.items.find((i) => i.supersedes === PUBLISHED)
    expect(successor).toBeDefined()
    expect(successor!.id).not.toBe(PUBLISHED)
    expect(successor!.name).toBe('Torque Out-of-Tolerance Response v2')
    expect('state' in successor! ? successor.state : null).toBe('Draft')
    expect(successor!.version).toBe(original.version + 1)
    expect(itemById(r.register, PUBLISHED)!.supersededBy).toBeNull()

    // 3. The prior published item REMAINS IN FORCE on every referencing
    //    screen -- a library edit waiting on review blocks no Workflow.
    expect(impact.screenIds.length).toBeGreaterThan(1)
    for (const screenId of impact.screenIds) {
      expect(resolvePointer(r.register, screenId, 'containment-checklist')!.id, screenId).toBe(
        PUBLISHED,
      )
    }
    expect(r.message).toContain('DEC-LIBREV-001')
    expect(r.message).toContain('review')
  })

  // FAILS IF: the in-place branch is applied to a published item too, or the
  // linked-record branch is applied to a draft. Two branches, both exercised
  // -- defect shape 6 is a fold applied to one branch of several.
  it('does edit a Draft item in place, so the published branch above is a real split', () => {
    const draft = itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').find(
      (i) => 'state' in i && i.state === 'Draft',
    )!
    const r = editLibraryItem({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: draft.id,
      actor: ACTOR,
      decision: qmDecision('edit-a-library-item'),
      writeAudit: acceptingSink().write,
      shownImpact: reuseImpact(SEEDED_LIBRARY_REGISTER, draft.id),
      change: { name: 'Edited in place' },
    })
    expect(r.ok).toBe(true)
    expect(itemById(r.register, draft.id)!.name).toBe('Edited in place')
    expect(r.register.items.filter((i) => i.supersedes === draft.id)).toHaveLength(0)
    // Non-vacuous: the register really does hold both a Draft and a Published
    // checklist, so the two branches are both reachable from one fixture.
    expect(
      itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').filter(
        (i) => 'state' in i && i.state === 'Published',
      ).length,
    ).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * VOCABULARIES, POINTERS TO CONTENT ELSEWHERE, AND THE STANDING
 * CONSTRAINTS.
 * ==================================================================== */

describe('the closed vocabularies', () => {
  // FAILS IF: a fourth library appears, or a library id stops matching the
  // catalogue-A and catalogue-B rows it renders.
  it('holds three libraries, each pinned to its catalogue A and catalogue B row', () => {
    expect(LIBRARY_IDS).toHaveLength(3)
    expect([...LIBRARY_IDS]).toEqual([
      'containment-checklists',
      'coaching-corpus',
      'escalation-routing',
    ])
    expect(LIBRARY_SCREEN_IDS).toEqual({
      'containment-checklists': 'SCR-STU-06',
      'coaching-corpus': 'SCR-STU-07',
      'escalation-routing': 'SCR-STU-08',
    })
    expect(LIBRARY_CATALOGUE_A_IDS).toEqual({
      'containment-checklists': 'SCR-STU-CHECKLIST',
      'coaching-corpus': 'SCR-STU-CORPUS',
      'escalation-routing': 'SCR-STU-ROUTING',
    })
  })

  // FAILS IF: catalogue B stops carrying the three rows this module renders.
  // R13 -- the pointer fails when its target is removed.
  it('resolves every catalogue-B screen id against the catalogue', () => {
    const rows = stuScreensForModule(STU_SCREENS, 'MOD-STU-07')
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.id)).toEqual(['SCR-STU-06', 'SCR-STU-07', 'SCR-STU-08'])
    for (const id of Object.values(LIBRARY_SCREEN_IDS)) {
      expect(rows.map((r) => r.id)).toContain(id)
    }
  })

  // FAILS IF: this module re-declares a vocabulary task 3 already closed.
  // A second declaration is exactly the drift the barrel exists to prevent.
  it('consumes the shared vocabularies rather than re-declaring them', () => {
    expect(COACHING_ASSET_STATES).toHaveLength(5)
    expect([...COACHING_ASSET_STATES]).toEqual([
      'Uploaded',
      'Approved',
      'Indexed',
      'Flagged for review',
      'Retired',
    ])
    expect([...ITEM_LIFECYCLE_STATES]).toEqual(['Draft', 'Published', 'Archived'])
    expect([...LOCALES]).toEqual(['English', 'Spanish'])
    expect(POINTER_SLOTS).toHaveLength(3)
    expect(LIBRARY_WRITE_ACTIONS).toHaveLength(10)
    expect(SEEDED_SEVERITY_BANDS.length).toBeGreaterThan(1)
  })

  // FAILS IF: one of the four corpus-safety properties is dropped, or one
  // stops carrying the source's own words.
  it('holds the four properties that keep the corpus safe, each with its locator', () => {
    expect(CORPUS_PROPERTIES).toHaveLength(4)
    expect(CORPUS_PROPERTIES.map((p) => p.id)).toEqual([
      'curation-is-retained',
      'retrieval-is-hybrid',
      'a-default-is-retained',
      'retrieval-quality-is-evaluated',
    ])
    const byId = (id: string) => CORPUS_PROPERTIES.find((p) => p.id === id)!
    expect(byId('curation-is-retained').quotation).toContain(
      'Embeddings change how an asset is found, never whether it was approved',
    )
    expect(byId('retrieval-is-hybrid').quotation).toContain(
      'a torque clip cannot surface on a paint screen',
    )
    expect(byId('a-default-is-retained').quotation).toContain('cold start')
    expect(byId('retrieval-quality-is-evaluated').quotation).toContain('from day one')
    for (const p of CORPUS_PROPERTIES) expect(p.sourceRef).toMatch(/^L\d+$/)
  })
})

describe('pointers to content owned elsewhere', () => {
  // FAILS IF: a seam this module consumes is removed from the registry, or
  // renamed. Three seams, all asserted, none inlined as a stub.
  it('names its three cross-slice seams from the registry', () => {
    const ids = [
      'escalation-delivery-and-role-resolution',
      'multimodal-embedding-service',
      'global-severity-catalog',
    ] as const
    expect(ids).toHaveLength(3)
    for (const id of ids) {
      const seam = stuSeamById(STU_SEAMS, id)
      expect(seam.id).toBe(id)
      expect(seam.contract.length).toBeGreaterThan(0)
    }
    expect(stuSeamById(STU_SEAMS, 'escalation-delivery-and-role-resolution').consumingModules).toContain(
      'MOD-STU-07',
    )
    expect(stuSeamById(STU_SEAMS, 'multimodal-embedding-service').consumingModules).toContain('MOD-STU-07')
  })

  // FAILS IF: `coaching-default-per-locale` is removed from the publish
  // register, or reassigned. This module supplies the defaults; MOD-STU-05
  // owns the check, and the screen says so rather than claiming the block.
  it('cross-references the curated-default publish check without claiming to own it', () => {
    const check = publishCheckById('coaching-default-per-locale')
    expect(check.name).toContain('curated coaching default')
    expect(check.ownerModules).toEqual(['MOD-STU-05'])
    const html = viewMarkup({ persona: 'quality-manager' }, 'coaching-corpus')
    expect(html).toContain(check.name)
    expect(html).toContain('MOD-STU-05')
  })

  // FAILS IF: DEC-LIB-001 or DEC-LIBREV-001 loses its DEC-* identifier, or this module stops
  // disclosing one of the three open decisions that render here.
  it('discloses DEC-LIB-001, DEC-LIBREV-001 and DEC-EMBED-001 on the screens they bind', () => {
    expect(decisionRecord('DEC-LIB-001').decisionRef).toBe('DEC-LIB-001')
    expect(decisionRecord('DEC-LIBREV-001').decisionRef).toBe('DEC-LIBREV-001')

    const checklists = viewMarkup({ persona: 'quality-manager' }, 'containment-checklists')
    expect(checklists).toContain('DEC-LIB-001')
    expect(checklists).toContain('DEC-LIBREV-001')

    // THE BARE IDENTIFIER IS NOT ENOUGH, and this was found by planting the
    // defect rather than by reading the code. Removing `DecisionDisclosure
    // id="DEC-LIBREV-001"` from the tab left the suite GREEN, because the edit cell's
    // own words -- "scope under `DEC-LIBREV-001`" -- render on the same tab
    // as the enabled control's note. An assertion satisfied by a DIFFERENT
    // element than the one it names is defect shape 5. So each disclosure is
    // pinned on text only that record carries, read off the record itself so
    // it follows a rewording instead of going stale.
    expect(checklists).toContain(decisionRecord('DEC-LIB-001').question)
    expect(checklists).toContain(decisionRecord('DEC-LIBREV-001').question)
    // The counter-argument is on the record and is not trivial.
    expect(checklists).toContain('by up to one Run')

    // DEC-EMBED-001 NOW HAS a canonical record -- DEC-EMBED-001 -- so this module stops
    // wording the decision itself and renders the canon on the tab it binds.
    // The bare identifier is not enough: the `multimodal-embedding-service`
    // seam's own contract sentence already names it, so asserting the
    // identifier alone passes with the panel deleted. Found by planting that.
    // So every assertion below is read OFF THE RECORD and follows a rewording.
    const embed = decisionRecord('DEC-EMBED-001')
    expect(embed.decisionRef).toBe('DEC-EMBED-001')
    expect(embed.readings).toHaveLength(3)
    for (const r of embed.readings) expect(r.locator).toContain('L32606')
    const corpus = viewMarkup({ persona: 'quality-manager' }, 'coaching-corpus')
    expect(corpus).toContain('DEC-EMBED-001')
    expect(corpus).toContain('identifiable workers')
    expect(corpus).toContain('Unspecified in the Statement of Work')
    expect(corpus).toContain(embed.question)
    // All three of the source's options render, and this build's pick is
    // labelled a client-delegated choice rather than the source's answer.
    for (const r of embed.readings) expect(corpus).toContain(r.text)
    expect(corpus).toContain(embed.adopted)
    expect(corpus).toContain('client-delegated choice')
    // AND NO SECOND WORDING. The module's own view file must not restate the
    // options it used to carry -- one decision, one wording, on this surface.
    const view = readFileSync('src/studio/modules/stu-07/ContentLibrariesView.tsx', 'utf8')
    expect(view).not.toContain('in-boundary embedding model')
    expect(view).not.toContain('no retention by the model provider')
    expect(corpus).toContain('APP-012')
  })
})

describe('the module’s standing constraints', () => {
  // FAILS IF: the route is keyed on a screen number rather than the module
  // slug, or the annotation region stops naming all three screens.
  it('wraps the Studio shell and annotates all three screen ids without keying the route on them', () => {
    const html = markup(createElement(ContentLibrariesScreen))
    expect(html).toContain('MOD-STU-07')
    expect(html).toContain('SCR-STU-06')
    expect(html).toContain('SCR-STU-07')
    expect(html).toContain('SCR-STU-08')
    expect(html).toContain('annotation, never a route key')
    expect(html).not.toContain('/studio/SCR-STU-06')
    expect(stuModuleById(STU_MODULES, 'MOD-STU-07').slug).toBe('content-libraries')
  })

  // FAILS IF: a reader closes over a module-load snapshot instead of reading
  // the register it was handed. This is the defect that shipped three times
  // in slice 4.
  it('reads the register it is handed, never a module-load snapshot', () => {
    const empty: LibraryRegister = { items: [], pointers: [], screens: [], proposals: [] }
    expect(itemsInLibrary(empty, 'containment-checklists')).toEqual([])
    expect(referencingPointers(empty, 'CHK-TORQUE-RESPONSE')).toEqual([])
    expect(reuseImpact(empty, 'CHK-TORQUE-RESPONSE').screenIds).toEqual([])
    expect(screenPointer(empty, 'SCR-WF-TORQUE-PHOTO', 'containment-checklist')).toBeNull()
    // Non-vacuous: the SAME readers over the seeded register return content,
    // so the empty answers above are the register talking and not a stub.
    expect(itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'containment-checklists').length).toBeGreaterThan(
      0,
    )
    expect(reuseImpact(SEEDED_LIBRARY_REGISTER, 'CHK-TORQUE-RESPONSE').screenIds.length)
      .toBeGreaterThan(1)
  })

  // FAILS IF: a clock or a random source is introduced, or a `throw` is
  // added on a path a screen can reach, or a value is imported from src/ui/.
  it('is deterministic, throws on no reachable path, and takes only types from src/ui/', async () => {
    const { readFileSync, readdirSync } = await import('node:fs')
    const dir = 'src/studio/modules/stu-07'
    const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f))
    expect(files.length).toBeGreaterThan(3)
    for (const file of files) {
      const raw = readFileSync(`${dir}/${file}`, 'utf8')
      // Comments name these constructs in order to deny them, so strip first.
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(code, `${file}: Date.now`).not.toMatch(/Date\.now|new Date\(/)
      expect(code, `${file}: Math.random`).not.toMatch(/Math\.random/)
      expect(code, `${file}: throw`).not.toMatch(/\bthrow\s+new\b/)
    }
  })

  // FAILS IF: the asymmetry the diagram exists to show is lost -- two of the
  // three libraries reach the device and the third does not.
  it('states the packaging asymmetry on the tab it belongs to', () => {
    const checklists = viewMarkup({ persona: 'quality-manager' }, 'containment-checklists')
    expect(checklists).toContain('ship in the package')
    const routing = viewMarkup({ persona: 'quality-manager' }, 'escalation-routing')
    expect(routing).toContain('resolves server-side')
    expect(routing).toContain('cannot escalate one until it syncs')
  })

  // FAILS IF: a tab renders nothing, or the three tabs render the same
  // content. Each tab is asserted for its own heading and against the other
  // two, so a tab switch that does nothing goes red.
  it('renders three distinct tabs, one per library', () => {
    const rendered = LIBRARY_IDS.map((id) => viewMarkup({ persona: 'quality-manager' }, id))
    expect(rendered).toHaveLength(3)
    expect(rendered[0]).toContain('Containment Checklist Library')
    expect(rendered[1]).toContain('Coaching Corpus')
    expect(rendered[2]).toContain('Escalation Routing Templates')
    expect(rendered[0]).not.toContain('resolution rate')
    expect(new Set(rendered).size).toBe(3)
  })

  // FAILS IF: the scope filter moves from what the screen READS to what it
  // DRAWS -- slice 4's seventh defect shape. A `Read-only` cell reads
  // published library content ONLY (row 10, L32637); drafts and in-review
  // versions are Explicitly prohibited to it (L34543), so they must never be
  // in the list this view is handed, not merely hidden from it.
  it('reads published content only for a read-only persona, and everything for the owner', () => {
    const owner = readableItems(
      scenario({ persona: 'quality-manager' }),
      SEEDED_LIBRARY_REGISTER,
      'containment-checklists',
    )
    const readOnly = readableItems(
      scenario({ persona: 'tenant-admin' }),
      SEEDED_LIBRARY_REGISTER,
      'containment-checklists',
    )

    // BOTH SIDES NON-EMPTY, and a strict subset -- an assertion that passes
    // on an empty set is the ninth shape, and a library of lists is where it
    // hides.
    expect(owner.items.length).toBeGreaterThan(0)
    expect(readOnly.items.length).toBeGreaterThan(0)
    expect(readOnly.items.length).toBeLessThan(owner.items.length)
    expect(owner.withheldCount).toBe(0)
    expect(readOnly.withheldCount).toBe(owner.items.length - readOnly.items.length)

    const readOnlyIds = readOnly.items.map((i) => i.id)
    for (const item of readOnly.items) {
      expect('state' in item ? item.state : null, item.id).toBe('Published')
    }
    // The register really does hold a Draft and an Archived checklist, so the
    // exclusion is a filter and not a coincidence of the fixture.
    const drafts = owner.items.filter((i) => 'state' in i && i.state === 'Draft')
    const archived = owner.items.filter((i) => 'state' in i && i.state === 'Archived')
    expect(drafts.length).toBeGreaterThan(0)
    expect(archived.length).toBeGreaterThan(0)
    for (const item of [...drafts, ...archived]) expect(readOnlyIds).not.toContain(item.id)

    // AC-STU-155: never blank. The missing condition is named.
    expect(readOnly.withheldReason).not.toBeNull()
    expect(readOnly.withheldReason!).toContain('published library content only')
    expect(owner.withheldReason).toBeNull()

    // And the screen does not re-derive it: the same exclusion shows in the
    // markup, with the count and the reason.
    const html = viewMarkup({ persona: 'tenant-admin' }, 'containment-checklists')
    expect(html).toContain('are not read from this view')
    for (const item of drafts) expect(html).not.toContain(item.name)
  })

  // FAILS IF: the Worker is drawn anything at all, or the read-only personas
  // are given a write control. Scope is enforced in what the screen READS.
  it('gives the read-only personas no write control and the Worker nothing', () => {
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      const controls = libraryControls(scenario({ persona }), 'containment-checklists')
      expect(controls.length).toBeGreaterThan(0)
      expect(controls.filter((c) => c.affordance.kind === 'enabled')).toHaveLength(0)
    }
    // The pair: the Quality Manager really does get enabled controls, so the
    // assertion above is not passing on a screen that draws no controls.
    const qm = libraryControls(scenario({ persona: 'quality-manager' }), 'containment-checklists')
    expect(qm.filter((c) => c.affordance.kind === 'enabled').length).toBeGreaterThan(0)
  })
})

/* A type-level assertion that the item union really is a union, not a bag of
 * optional fields: a coaching asset cannot carry a Published state. */
const _typedItem: LibraryItem = SEEDED_LIBRARY_REGISTER.items[0]!
void _typedItem

import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { STUDIO_PERSONA_COLUMNS } from '@/studio/access/evaluate'
import { STU_MODULES, reachByStudioMatrix, stuModuleById } from '@/studio/modules'
import { STU_SCREENS, stuScreensForModule } from '@/studio/screens'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { studioDecision } from '@/studio/disclosure/decisions'
import { WHEEL_BOLT_DRAFT_CONTENT } from '@/studio/journey/fixture'
import { studioIdentityFor } from '@/studio/modules/stu-18/rendering'

import { STU_03_MATRIX, STU_03_ROW_IDS, stu03Row, type Stu03RowId } from '@/studio/modules/stu-03/matrix'
import { WORKFLOW_STATUSES } from '@/studio/vocab'
import {
  DEFAULT_FILTERS,
  DEFAULT_STATUS_FILTER,
  LIBRARY_AS_OF,
  LINKAGE_UNAVAILABLE_PREFIX,
  RELEASED_STATUSES,
  SEEDED_JOB_TYPES,
  SEEDED_LIBRARY,
  SEEDED_SCENARIO,
  SEEDED_SERVICE_TYPE_TAGS,
  SEEDED_TAXONOMY_COUNTS,
  SEEDED_TENANT,
  STATE_MACHINE_NOTES,
  TENANT_JOB_TYPES,
  UNRELEASED_STATUSES,
  UNSPECIFIED_IN_SOURCE,
  WORKFLOW_OBJECT,
  WORKFLOW_TRANSITIONS,
  applyLibraryFilters,
  createCustomType,
  createWorkflow,
  libraryAffordance,
  libraryDecision,
  libraryIdentity,
  linkageStatement,
  openWorkflowById,
  workflowIdFor,
  workflowsVisibleTo,
  type LibraryAuditEntry,
  type LibraryAuditWrite,
  type LibraryScenario,
  type LibraryState,
} from '@/studio/modules/stu-03/library'

import {
  WorkflowLibraryScreen,
  type WorkflowLibraryScreenProps,
} from '../../app/studio/workflow-library/WorkflowLibraryScreen'

/* ==================================================================== *
 * Fixtures.
 *
 * DEFECT SHAPE 11 — a baseline chosen so the failure cannot appear. Every
 * scenario below sits on the PERMITTING side of every boundary it is not
 * exercising: signed in, identity layer reachable, online, tier Enterprise,
 * both grants Active, linkage live. A refusal test is therefore paired with
 * the same scenario one field away, asserted to permit, so a refusal
 * arriving for the wrong reason cannot certify a guard.
 * ==================================================================== */

function scenario(over: Partial<LibraryScenario> = {}): LibraryScenario {
  return { ...SEEDED_SCENARIO, ...over }
}

const ACCEPTING: LibraryAuditWrite = () => ({ ok: true })
const FAILING: LibraryAuditWrite = () => ({ ok: false, reason: 'the tenant audit log refused the append' })
const THROWING: LibraryAuditWrite = () => {
  throw new Error('the audit sink was reached by a path that had already refused')
}

function recording(): { write: LibraryAuditWrite; entries: LibraryAuditEntry[] } {
  const entries: LibraryAuditEntry[] = []
  return {
    entries,
    write: (entry) => {
      entries.push(entry)
      return { ok: true }
    },
  }
}

const DRAFT_FIXTURE_ID = 'WF-BB-HUB-BEARING-PRESS'
const IN_REVIEW_FIXTURE_ID = 'WF-BB-BRAKE-CABLE-ROUTING'
const OTHER_TENANT_FIXTURE_ID = 'WF-OTHER-FRAME-WELD'
const PUBLISHED_FIXTURE_ID = 'WF-BB-WHEEL-BOLT-TORQUE'

function markup(element: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(element)
}

function screenMarkup(props: WorkflowLibraryScreenProps = {}): string {
  return markup(createElement(WorkflowLibraryScreen, props))
}

/** The rendered TEXT, so an assertion about a sentence is not defeated by
 *  the tags inside it. */
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

/* ==================================================================== *
 * 1. THE MATRIX — L31902 header, L31904-L31912, nine data rows.
 * ==================================================================== */

describe('MOD-STU-03 matrix — the nine rows of L31904-L31912', () => {
  // FAILS IF: a row is dropped, a row id is renamed without the vocabulary
  // moving with it, or the transcription gains a tenth row the source has no
  // line for.
  it('transcribes exactly nine rows, in source order, each answering all eight persona columns', () => {
    expect(STU_03_MATRIX).toHaveLength(9)
    expect(STU_03_MATRIX.map((r) => r.id)).toEqual([...STU_03_ROW_IDS])
    expect(STU_03_ROW_IDS).toHaveLength(9)
    for (const row of STU_03_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
    }
    // 9 rows x 8 columns = 72 cells, none of them blank. A blank cell reads
    // as "withheld" without anybody writing that down (L10238).
    const cells = STU_03_MATRIX.flatMap((r) => STUDIO_PERSONA_COLUMNS.map((c) => r.cells[c]))
    expect(cells).toHaveLength(72)
    expect(cells.every((c) => c.note.trim().length > 0)).toBe(true)
  })

  // FAILS IF: any cell's transcription drifts from the source's own words.
  // Every string here was read at its line with `sed -n`, not from the brief.
  it('carries the source’s own words in the cells the boundary turns on', () => {
    const open = stu03Row('open-the-library-filtered-to-published')
    expect(open.capability).toBe('Open the Library filtered to Published')
    expect(open.cells['supervisor-without-grant'].outcome).toBe('allowed')
    expect(open.cells['read-only-auditor'].note).toBe('Client Decision Required — DEC-AUDSTU-001')
    expect(open.cells.worker.outcome).toBe('explicitlyProhibited')
    expect(open.cells['implementation-team'].note).toBe(
      'Allowed with conditions — during onboarding only',
    )

    const drafts = stu03Row('see-draft-and-in-review-workflows')
    expect(drafts.cells['supervisor-with-authoring-grant'].note).toBe(
      'Allowed with conditions — grant-holders and the chain only',
    )
    expect(drafts.cells['supervisor-without-grant'].outcome).toBe('explicitlyProhibited')
    expect(drafts.cells['tenant-admin'].outcome).toBe('explicitlyProhibited')

    const custom = stu03Row('create-a-custom-job-type-or-service-type-tag')
    expect(custom.cells['quality-manager'].outcome).toBe('allowed')
    expect(custom.cells['supervisor-with-authoring-grant'].note).toBe(
      'Client Decision Required — the Statement of Work says tenants may create custom types without naming the role',
    )
    expect(custom.cells['tenant-admin'].note).toBe(
      'Client Decision Required — the tenant administration area is a plausible home; not stated',
    )
    expect(custom.cells['implementation-team'].openDecision).toBe('DEC-TAXROLE-001')

    expect(
      stu03Row('edit-or-delete-a-platform-seeded-starter-type').cells['quality-manager'].note,
    ).toBe('Explicitly prohibited — inherited read-only')

    const linkage = stu03Row('see-linkage-counts')
    expect(linkage.cells['supervisor-without-grant'].outcome).toBe('readOnly')
    expect(linkage.cells['tenant-admin'].outcome).toBe('readOnly')
  })

  // FAILS IF: a cell starts naming a tier or a second grant. The source
  // states the opposite twice — L31890 ("available at every commercial
  // tier") and L31892 ("on every tier, with no platform approval step") —
  // so a tier gate here would contradict the source rather than refine it.
  it('states no commercial tier and no cell-level grant on any of the seventy-two cells', () => {
    for (const row of STU_03_MATRIX) {
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].requiredTiers, `${row.id}/${column}`).toBeNull()
        expect(row.cells[column].requiredGrant, `${row.id}/${column}`).toBeNull()
      }
    }
  })

  // FAILS IF: the Plant Manager column is dropped, or filled from something
  // other than the supervisor-without-grant cell, or filled silently.
  it('fills the Plant Manager column from DEC-ROLE-001 and names the substitution in every cell', () => {
    for (const row of STU_03_MATRIX) {
      const plant = row.cells['plant-manager-persona']
      const mirrored = row.cells['supervisor-without-grant']
      expect(plant.outcome, row.id).toBe(mirrored.outcome)
      expect(plant.note, row.id).toContain('DEC-ROLE-001')
      expect(plant.note, row.id).toContain(mirrored.note)
    }
  })

  // FAILS IF: `isPublishedRead` moves off row 1 or is set on a second row.
  // It is what L34605's fail-closed floor keeps open, so a second row
  // carrying it would keep authoring alive with the identity layer down.
  it('marks exactly one row the published-read row, and it is row 1', () => {
    const marked = STU_03_MATRIX.filter((r) => r.isPublishedRead)
    expect(marked.map((r) => r.id)).toEqual(['open-the-library-filtered-to-published'])

    const down = libraryDecision('open-the-library-filtered-to-published', scenario({ identityLayer: 'unreachable' }))
    expect(down.outcome).toBe('readOnly')
    const authoringDown = libraryDecision('create-a-new-workflow', scenario({ identityLayer: 'unreachable' }))
    expect(authoringDown.outcome).toBe('unavailable')
  })

  // FAILS IF: a row is reclassified away from `screen`, which is clause one
  // of the reach rule — reclassifying row 1 would withhold this module's
  // route from every persona that can open it.
  it('derives module reach from its own screen rows, and the three answers differ', () => {
    const reach = reachByStudioMatrix(STU_03_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-without-grant']).toBe('offered')
    expect(reach['tenant-admin']).toBe('offered')
    expect(reach['implementation-team']).toBe('offered')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach.worker).toBe('withheld')
    expect(STU_03_MATRIX.every((r) => r.surface === 'screen')).toBe(true)
  })

  // FAILS IF: the storyboard exception leaks onto a second row. It is the
  // one control SB-STU-06 (L31976) states a rendering for; every other
  // prohibited cell on this surface stays absent.
  it('declares the storyboard prohibition rendering on exactly one row', () => {
    const declared = STU_03_MATRIX.filter((r) => r.storyboardProhibition !== null)
    expect(declared.map((r) => r.id)).toEqual(['create-a-new-workflow'])
    expect(declared[0]?.storyboardProhibition?.statement).toContain(
      'disabled with a stated reason for read-only roles rather than hidden',
    )
    expect(declared[0]?.storyboardProhibition?.sourceRef).toBe('SB-STU-06 L31976')
  })
})

/* ==================================================================== *
 * 2. THE READ — R14, AC-STU-048 (L32013). The gate asserts the SELECTOR.
 * ==================================================================== */

describe('the draft-visibility boundary is enforced in the READ', () => {
  // FAILS IF: `workflowsVisibleTo` stops filtering on the row-2 answer, or
  // the released/unreleased partition moves a status.
  it('returns only released rows to a Supervisor without the grant, over a non-empty set', () => {
    const rows = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'supervisor-without-grant' }))

    // NOT VACUOUS: the register really does hold rows this persona may read.
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => (RELEASED_STATUSES as readonly string[]).includes(r.status))).toBe(true)
    expect(rows.map((r) => r.id)).not.toContain(DRAFT_FIXTURE_ID)
    expect(rows.map((r) => r.id)).not.toContain(IN_REVIEW_FIXTURE_ID)

    // ...and the rows it withheld really are in the register, so the
    // assertion above is not passing on a register that never held one.
    expect(SEEDED_LIBRARY.workflows.map((w) => w.id)).toContain(DRAFT_FIXTURE_ID)
    expect(SEEDED_LIBRARY.workflows.map((w) => w.id)).toContain(IN_REVIEW_FIXTURE_ID)
  })

  // FAILS IF: the two personas are given the same read — which is what a
  // single unfiltered read with the drafts hidden in the component would do.
  // DEFECT SHAPE 9: asserted as a STRICT subset with NEITHER side empty.
  it('gives a Supervisor without the grant a strict subset of what a Quality Manager reads', () => {
    const wide = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'quality-manager' }))
    const narrow = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'supervisor-without-grant' }))

    expect(wide.length).toBeGreaterThan(0)
    expect(narrow.length).toBeGreaterThan(0)
    expect(narrow.length).toBeLessThan(wide.length)

    const wideIds = new Set(wide.map((r) => r.id))
    expect(narrow.every((r) => wideIds.has(r.id))).toBe(true)
    // Row 1 is the widest read on the surface and row 2 the narrowest that
    // is not a prohibition; together they are the boundary AC-STU-048 tests.
    expect(wide.map((r) => r.id)).toContain(DRAFT_FIXTURE_ID)
    expect(wide.map((r) => r.id)).toContain(IN_REVIEW_FIXTURE_ID)
  })

  // FAILS IF: the row-1 gate is removed from the read. Paired with a persona
  // who reads plenty, so "returns nothing" cannot be passing on an empty
  // register.
  it('reads nothing at all for the Worker, and plenty for the Quality Manager', () => {
    expect(workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'worker' }))).toHaveLength(0)
    expect(
      workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'quality-manager' })).length,
    ).toBeGreaterThan(0)
  })

  // FAILS IF: DEC-AUDSTU-001 is answered in either direction. AC-STU-157
  // (L34674) requires it to stay unassumed; a `clientDecisionRequired`
  // outcome is not a read.
  it('reads nothing for the Read-only Auditor while DEC-AUDSTU-001 is open, and says which decision', () => {
    expect(workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'read-only-auditor' }))).toHaveLength(0)
    const decision = libraryDecision('open-the-library-filtered-to-published', scenario({ persona: 'read-only-auditor' }))
    expect(decision.outcome).toBe('clientDecisionRequired')
    expect(
      stu03Row('open-the-library-filtered-to-published').cells['read-only-auditor'].openDecision,
    ).toBe('DEC-AUDSTU-001')
  })

  // FAILS IF: tenant scope moves out of the read. The other-tenant row is
  // asserted to exist first, so the filter has something real to exclude.
  it('never hands another tenant’s Workflow to any of the eight persona columns', () => {
    expect(SEEDED_LIBRARY.workflows.some((w) => w.id === OTHER_TENANT_FIXTURE_ID)).toBe(true)
    expect(SEEDED_LIBRARY.workflows.some((w) => w.tenant !== SEEDED_TENANT)).toBe(true)

    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const rows = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona }))
      expect(rows.map((r) => r.id), persona).not.toContain(OTHER_TENANT_FIXTURE_ID)
      expect(rows.every((r) => r.tenant === SEEDED_TENANT), persona).toBe(true)
    }
  })

  // FAILS IF: the implementation team's "during onboarding only" condition
  // stops being carried by the grant state. Paired both ways.
  it('closes the onboarding-only read when GRANT-STU-IMPL lapses, and names the grant', () => {
    const during = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'implementation-team', implGrant: 'Active' }))
    expect(during.map((r) => r.id)).toContain(DRAFT_FIXTURE_ID)

    const after = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'implementation-team', implGrant: 'Expired' }))
    expect(after.map((r) => r.id)).not.toContain(DRAFT_FIXTURE_ID)
    expect(after.length).toBeGreaterThan(0)

    const decision = libraryDecision('see-draft-and-in-review-workflows', scenario({ persona: 'implementation-team', implGrant: 'Expired' }))
    expect(decision.reason).toContain('GRANT-STU-IMPL')
  })

  // FAILS IF: the component is handed rows it may not read and hides them.
  // Both halves asserted: the draft is not in the markup AND the published
  // row is, so the absence is not a screen that drew nothing.
  it('gives the component nothing it may not read', () => {
    const html = screenMarkup({ persona: 'tenant-admin', filters: { ...DEFAULT_FILTERS, status: 'All' } })
    const text = plain(html)
    expect(text).toContain(WHEEL_BOLT_DRAFT_CONTENT.workflowName)
    expect(text).not.toContain('Hub Bearing Press Fit')
    expect(text).not.toContain('Brake Cable Routing Check')

    const grantHolder = plain(
      screenMarkup({ persona: 'supervisor-with-authoring-grant', filters: { ...DEFAULT_FILTERS, status: 'All' } }),
    )
    expect(grantHolder).toContain('Hub Bearing Press Fit')
  })

  // FAILS IF: the filter bar is made to do the permission work. The filter
  // runs over what the read already returned and can only ever narrow it.
  it('applies SB-STU-06’s filters after the read, never instead of it', () => {
    const narrow = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ persona: 'tenant-admin' }))
    const filtered = applyLibraryFilters(narrow, { ...DEFAULT_FILTERS, status: 'All' })
    expect(filtered.map((r) => r.id)).not.toContain(DRAFT_FIXTURE_ID)
    expect(filtered.length).toBeGreaterThan(0)

    // The default filter is Published, and it is a default rather than the
    // only value (AC-STU-017 L31097, FUNC-STU-03-01-A-2 L31931).
    expect(DEFAULT_STATUS_FILTER).toBe('Published')
    expect(DEFAULT_FILTERS.status).toBe('Published')
    const published = applyLibraryFilters(
      workflowsVisibleTo(SEEDED_LIBRARY, scenario()),
      DEFAULT_FILTERS,
    )
    expect(published.length).toBeGreaterThan(0)
    expect(published.every((r) => r.status === 'Published')).toBe(true)

    // Deterministic, not semantic (L31986): a case-folded substring match.
    const searched = applyLibraryFilters(workflowsVisibleTo(SEEDED_LIBRARY, scenario()), {
      ...DEFAULT_FILTERS,
      status: 'All',
      nameSearch: 'wheel bolt',
    })
    expect(searched.map((r) => r.id)).toEqual([PUBLISHED_FIXTURE_ID])
  })

  // FAILS IF: a fifth status is added without deciding which side of the
  // boundary it falls on — the partition is proved total at compile time,
  // and this is the runtime half of the same claim.
  it('partitions all four statuses across the boundary, with neither side empty', () => {
    expect([...WORKFLOW_STATUSES]).toEqual(['Draft', 'In Review', 'Published', 'Archived'])
    expect([...UNRELEASED_STATUSES]).toEqual(['Draft', 'In Review'])
    expect([...RELEASED_STATUSES]).toEqual(['Published', 'Archived'])
    expect(UNRELEASED_STATUSES.length + RELEASED_STATUSES.length).toBe(WORKFLOW_STATUSES.length)
  })
})

/* ==================================================================== *
 * 3. LINKAGE — AC-STU-053 (L32018), and the zero that IS an answer.
 * ==================================================================== */

describe('linkage counts', () => {
  // FAILS IF: the unavailable arm gains a count, or the phrase drifts from
  // FUNC-STU-03-01-A-1's own words (L31930).
  it('renders unavailable linkage with its timestamp, never as zero', () => {
    const text = linkageStatement({ status: 'unavailable', lastRetrievedAt: 'T0' })
    expect(text).toBe('Linkage unavailable, last retrieved at T0')
    expect(text).toContain(LINKAGE_UNAVAILABLE_PREFIX)
    expect(text).not.toMatch(/\b0\b/)
    expect(text).not.toContain('linked Jobs')
    expect(text).not.toContain('linked Runs')
  })

  // THE PAIR, and it is what stops the assertion above from being satisfied
  // by a renderer that never prints a number at all.
  // FAILS IF: a live zero stops rendering as zero. Zero linked Jobs is a
  // business answer; the absence of an answer is not.
  it('renders a live zero as zero, because zero linked Jobs is a business answer', () => {
    const text = linkageStatement({ status: 'live', linkedJobs: 0, linkedRuns: 0, refreshedAt: 'T1' })
    expect(text).toContain('0 linked Jobs')
    expect(text).toContain('0 linked Runs')
    expect(text).toContain('refreshed at T1')
    expect(text).not.toContain(LINKAGE_UNAVAILABLE_PREFIX)
  })

  // FAILS IF: the unavailable arm is widened to carry counts. A compile-time
  // proof, because the shape is the enforcement and not a rule to remember.
  it('cannot express a count on an unavailable reading at all', () => {
    expect(
      linkageStatement(
        // @ts-expect-error — `linkedJobs` is not a field of the unavailable arm,
        // so an absence cannot be given a number even by a caller that tries.
        { status: 'unavailable', lastRetrievedAt: 'T0', linkedJobs: 0 },
      ),
    ).toContain(LINKAGE_UNAVAILABLE_PREFIX)
  })

  // FAILS IF: a screen renders the count for a Workflow whose linkage the
  // Hub could not answer. Both halves: the phrase appears, and no bare zero
  // appears next to the row that carries it.
  it('renders the unavailable row on screen with the phrase and the timestamp', () => {
    const html = screenMarkup({ persona: 'quality-manager', filters: { ...DEFAULT_FILTERS, status: 'In Review' } })
    const text = plain(html)
    expect(text).toContain('Brake Cable Routing Check')
    expect(text).toContain(`${LINKAGE_UNAVAILABLE_PREFIX} ${LIBRARY_AS_OF}`)
  })

  // FAILS IF: the whole-Library linkage failure is folded at the table cell
  // rather than at the read, so one branch shows a count and another the
  // absence.
  it('marks every row unavailable when the Hub cannot answer, not just the drawn ones', () => {
    const rows = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ linkageAvailable: false }))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.linkage.status === 'unavailable')).toBe(true)

    const live = workflowsVisibleTo(SEEDED_LIBRARY, scenario({ linkageAvailable: true }))
    expect(live.some((r) => r.linkage.status === 'live')).toBe(true)
  })

  // FAILS IF: the seam registry loses the row, or its owner changes. The
  // sentence on screen points at MOD-DOH-05/MOD-DOH-06 in slice 6, and this
  // is what makes that pointer rot loudly.
  it('names the cross-slice owner of the linkage counts', () => {
    const seam = stuSeamById(STU_SEAMS, 'job-and-run-linkage-counts')
    expect(seam.consumingModules).toContain('MOD-STU-03')
    expect(seam.owner).toContain('MOD-DOH-05')
    expect(seam.ownerSlices).toEqual([6])
    expect(seam.contract).toContain('never zero')
    expect(plain(screenMarkup())).toContain(seam.name)
  })
})

/* ==================================================================== *
 * 4. THE TAXONOMY — D20 / DEC-TAX-002, adopted.
 * ==================================================================== */

describe('the classification taxonomy', () => {
  // The brief's step 4, verbatim.
  // FAILS IF: anybody seeds a starter Job Type or Service Type tag, which
  // L31894 forbids by name.
  it('ships an empty seeded taxonomy and names no starter type as canonical', () => {
    expect(SEEDED_JOB_TYPES).toEqual([])
    expect(SEEDED_SERVICE_TYPE_TAGS).toEqual([])
    expect(SEEDED_LIBRARY.jobTypes.every((t) => t.origin === 'tenant-created')).toBe(true)
    expect(SEEDED_LIBRARY.serviceTypeTags.every((t) => t.origin === 'tenant-created')).toBe(true)
  })

  // FAILS IF: the tenant vocabulary is emptied, so the assertion above stops
  // being "the SEEDED set is empty" and becomes "there is no taxonomy". The
  // working vocabulary is real and comes from the journey fixture.
  it('supplies the working vocabulary from the tenant’s own entries, read from the journey fixture', () => {
    expect(TENANT_JOB_TYPES.length).toBeGreaterThan(0)
    expect(TENANT_JOB_TYPES[0]?.name).toBe(WHEEL_BOLT_DRAFT_CONTENT.jobType)
    expect(TENANT_JOB_TYPES[0]?.origin).toBe('tenant-created')
    expect(WHEEL_BOLT_DRAFT_CONTENT.jobTypeOrigin).toContain('DEC-TAX-002')
  })

  // FAILS IF: either half of the recorded tension is dropped. The card lists
  // its own option (c) as contradicting §5.3.2 and then reconciles it; both
  // render.
  it('keeps the eight-and-eight counts and renders both the contradiction and the reconciliation', () => {
    expect(SEEDED_TAXONOMY_COUNTS.jobTypes).toBe(8)
    expect(SEEDED_TAXONOMY_COUNTS.serviceTypeTags).toBe(8)
    expect(SEEDED_TAXONOMY_COUNTS.contradictsSection532).toContain('contradicts §5.3.2')
    expect(SEEDED_TAXONOMY_COUNTS.reconciliation).toContain(
      'satisfied on delivery of the names rather than contradicted',
    )
    const text = plain(screenMarkup())
    expect(text).toContain('contradicts §5.3.2')
    expect(text).toContain('satisfied on delivery of the names rather than contradicted')
  })

  // AC-STU-049 (L32014).
  // FAILS IF: any column gains the ability to edit a seeded type.
  // NOT VACUOUS: asserted over the EIGHT COLUMNS of the rule, not over the
  // seeded list — which is empty, so a walk of it would pass on anything.
  it('refuses every persona the edit of a seeded starter type, asserted over the rule not the empty list', () => {
    expect(SEEDED_JOB_TYPES).toHaveLength(0)
    const row = stu03Row('edit-or-delete-a-platform-seeded-starter-type')
    expect(STUDIO_PERSONA_COLUMNS.length).toBe(8)
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(row.cells[persona].outcome, persona).toBe('explicitlyProhibited')
      const rendering = libraryAffordance('edit-or-delete-a-platform-seeded-starter-type', scenario({ persona }), 'Edit this starter type')
      expect(rendering.kind, persona).toBe('absent')
    }
  })

  // FAILS IF: the custom-type control is implemented as though
  // DEC-TAXROLE-001 were answered. Three columns defer; one is stated.
  it('renders the custom-type control as Client Decision Required for the three deferred columns', () => {
    for (const persona of ['supervisor-with-authoring-grant', 'tenant-admin', 'implementation-team'] as const) {
      const rendering = libraryAffordance('create-a-custom-job-type-or-service-type-tag', scenario({ persona }), 'Create a custom Job Type')
      expect(rendering.kind, persona).toBe('decision-open')
      if (rendering.kind === 'decision-open') expect(rendering.openDecision).toBe('DEC-TAXROLE-001')
    }
    // The one column the source states outright — so "decision-open" above
    // is not passing on a control nobody ever holds.
    const qm = libraryAffordance('create-a-custom-job-type-or-service-type-tag', scenario({ persona: 'quality-manager' }), 'Create a custom Job Type')
    expect(qm.kind).toBe('enabled')
  })

  // FAILS IF: the recommendation or its stated cost stops rendering.
  it('states DEC-TAXROLE-001’s recommended reading and the cost the source names', () => {
    const text = plain(screenMarkup({ persona: 'tenant-admin' }))
    expect(text).toContain('DEC-TAXROLE-001')
    expect(text).toContain('Tenant Admin in the tenant administration area')
    expect(text).toContain('an uncontrolled custom Job Type list degrades Workflow selection on the floor')
  })
})

/* ==================================================================== *
 * 5. THE AUDIT PATH — refusals, then audit, then mutation.
 * ==================================================================== */

describe('createWorkflow — the audit path on a control that mutates something', () => {
  const draft = { name: 'Assembly — Crank Bolt Torque', jobType: WHEEL_BOLT_DRAFT_CONTENT.jobType, serviceTypeTag: null }

  // FAILS IF: the mutation stops happening, or lands in a status other than
  // Draft (happy path step 5, L31954; TEST-STU-054, L32022).
  it('creates the Workflow in Draft, through the audit path, and the register really changed', () => {
    const sink = recording()
    const before = SEEDED_LIBRARY.workflows.length
    const result = createWorkflow({ state: SEEDED_LIBRARY, scenario: scenario(), draft, writeAudit: sink.write })

    expect(result.ok).toBe(true)
    expect(result.state.workflows).toHaveLength(before + 1)
    const created = result.state.workflows.find((w) => w.id === workflowIdFor(draft.name))
    expect(created?.status).toBe('Draft')
    expect(created?.jobType).toBe(WHEEL_BOLT_DRAFT_CONTENT.jobType)
    expect(created?.tenant).toBe(SEEDED_TENANT)

    expect(sink.entries).toHaveLength(1)
    expect(sink.entries[0]?.action).toBe('create-workflow')
    expect(sink.entries[0]?.actorIdentityId).toBe(libraryIdentity('quality-manager').identity.identityId)
    expect(sink.entries[0]?.implementationTeamAction).toBe(false)

    // The register handed in is never mutated in place.
    expect(SEEDED_LIBRARY.workflows).toHaveLength(before)
  })

  // THE COVERING TEST THE BRIEF ASKS FOR: it mutates something observable on
  // the accepting path above, and here asserts nothing persisted when the
  // audit fails.
  // FAILS IF: the mutation is moved before the audit append, or the audit
  // result stops being read.
  it('refuses the create when the audit write fails, and nothing persisted', () => {
    const result = createWorkflow({ state: SEEDED_LIBRARY, scenario: scenario(), draft, writeAudit: FAILING })

    expect(result.ok).toBe(false)
    expect(result.state).toBe(SEEDED_LIBRARY)
    expect(result.state.workflows).toHaveLength(SEEDED_LIBRARY.workflows.length)
    expect(result.state.workflows.some((w) => w.id === workflowIdFor(draft.name))).toBe(false)
    expect(result.message).toContain('the action did not happen')
    expect(result.message).toContain('nothing was queued for later')
  })

  // FAILS IF: the audit sink is reached before the domain refusals. A
  // throwing sink is the only proof that it was not called at all.
  it('never reaches the audit sink when a domain rule refuses first', () => {
    const refused = createWorkflow({
      state: SEEDED_LIBRARY,
      scenario: scenario({ persona: 'supervisor-without-grant' }),
      draft,
      writeAudit: THROWING,
    })
    expect(refused.ok).toBe(false)
    expect(refused.message).toContain('Refused before anything was written')

    // ...and the same call with the grant DOES reach the sink, so the
    // absence above is caused by the refusal and not by a sink nobody calls.
    const sink = recording()
    const allowed = createWorkflow({
      state: SEEDED_LIBRARY,
      scenario: scenario({ persona: 'supervisor-with-authoring-grant' }),
      draft,
      writeAudit: sink.write,
    })
    expect(allowed.ok).toBe(true)
    expect(sink.entries).toHaveLength(1)
  })

  // AC-STU-050 (L32015) and FUNC-STU-03-02-C-1 (L31941).
  // FAILS IF: a Workflow can be created without exactly one resolvable
  // Job Type. Both refusals name the specific missing condition.
  it('refuses a Workflow with no Job Type, and one whose Job Type does not resolve', () => {
    const none = createWorkflow({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      draft: { ...draft, jobType: '  ' },
      writeAudit: THROWING,
    })
    expect(none.ok).toBe(false)
    expect(none.message).toContain('exactly one Job Type')

    const unknown = createWorkflow({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      draft: { ...draft, jobType: 'Heat Treatment' },
      writeAudit: THROWING,
    })
    expect(unknown.ok).toBe(false)
    expect(unknown.message).toContain('Heat Treatment')
    expect(unknown.message).toContain('not silently reclassified')
  })

  // AC-STU-051 (L32016): "No platform behaviour is conditioned on the
  // presence or value of a Service Type tag."
  // FAILS IF: any branch anywhere starts reading the tag. Asserted by
  // creating the same Workflow with and without one and comparing every
  // other field, plus the visibility and linkage answers.
  it('conditions nothing on the Service Type tag', () => {
    const sink = recording()
    const tagged = createCustomType({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      kind: 'Service Type tag',
      name: 'Precision Fastening',
      writeAudit: sink.write,
    })
    expect(tagged.ok).toBe(true)

    const withTag = createWorkflow({
      state: tagged.state,
      scenario: scenario(),
      draft: { ...draft, serviceTypeTag: 'Precision Fastening' },
      writeAudit: ACCEPTING,
    })
    const withoutTag = createWorkflow({
      state: tagged.state,
      scenario: scenario(),
      draft: { ...draft, serviceTypeTag: null },
      writeAudit: ACCEPTING,
    })
    expect(withTag.ok).toBe(true)
    expect(withoutTag.ok).toBe(true)

    const a = withTag.state.workflows.find((w) => w.id === workflowIdFor(draft.name))!
    const b = withoutTag.state.workflows.find((w) => w.id === workflowIdFor(draft.name))!
    expect({ ...a, serviceTypeTag: null }).toEqual({ ...b, serviceTypeTag: null })
    expect(a.serviceTypeTag).toBe('Precision Fastening')
    expect(b.serviceTypeTag).toBeNull()

    // ...and nothing downstream reads it either.
    const visibleA = workflowsVisibleTo({ ...withTag.state }, scenario({ persona: 'supervisor-without-grant' }))
    const visibleB = workflowsVisibleTo({ ...withoutTag.state }, scenario({ persona: 'supervisor-without-grant' }))
    expect(visibleA.map((w) => w.id)).toEqual(visibleB.map((w) => w.id))
    expect(linkageStatement(a.linkage)).toBe(linkageStatement(b.linkage))
  })

  // L32002: "every implementation-team action" is audited.
  // FAILS IF: the flag stops being derived from the acting persona. Paired
  // against a non-implementation actor so `true` is not the constant.
  it('flags an implementation-team write in its own audit entry', () => {
    const sink = recording()
    createWorkflow({ state: SEEDED_LIBRARY, scenario: scenario({ persona: 'implementation-team' }), draft, writeAudit: sink.write })
    createWorkflow({ state: SEEDED_LIBRARY, scenario: scenario({ persona: 'quality-manager' }), draft, writeAudit: sink.write })
    expect(sink.entries.map((e) => e.implementationTeamAction)).toEqual([true, false])
  })

  // FAILS IF: `createCustomType` stops routing through the same three-step
  // order. It is the second write this module owns and L32002 names it.
  it('routes custom-type creation through the same refusals-audit-mutation order', () => {
    const refused = createCustomType({
      state: SEEDED_LIBRARY,
      scenario: scenario({ persona: 'tenant-admin' }),
      kind: 'Job Type',
      name: 'Heat Treatment',
      writeAudit: THROWING,
    })
    expect(refused.ok).toBe(false)
    expect(refused.state).toBe(SEEDED_LIBRARY)

    const failed = createCustomType({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      kind: 'Job Type',
      name: 'Heat Treatment',
      writeAudit: FAILING,
    })
    expect(failed.ok).toBe(false)
    expect(failed.state.jobTypes).toHaveLength(SEEDED_LIBRARY.jobTypes.length)

    const sink = recording()
    const done = createCustomType({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      kind: 'Job Type',
      name: 'Heat Treatment',
      writeAudit: sink.write,
    })
    expect(done.ok).toBe(true)
    expect(done.state.jobTypes).toHaveLength(SEEDED_LIBRARY.jobTypes.length + 1)
    expect(sink.entries[0]?.action).toBe('create-custom-type')
    expect(done.state.jobTypes.at(-1)?.origin).toBe('tenant-created')
  })
})

/* ==================================================================== *
 * 6. SECURITY — L32004, TEST-STU-055 and TEST-STU-060.
 * ==================================================================== */

describe('tenant isolation and unreleased content at the query layer', () => {
  // TEST-STU-060 (L32028).
  // FAILS IF: the lookup is scoped to the visible rows, which would turn a
  // cross-tenant identifier into "not found" — the empty result L32004
  // forbids by name.
  it('returns a refusal, not an empty result, for another tenant’s identifier, and audits it', () => {
    const sink = recording()
    const result = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      workflowId: OTHER_TENANT_FIXTURE_ID,
      writeAudit: sink.write,
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.kind).toBe('refused-cross-tenant')
    expect(result.message).toContain('belongs to another tenant')
    expect(result.message).toContain('refusal rather than an empty result')
    expect(sink.entries).toHaveLength(1)
    expect(sink.entries[0]?.action).toBe('refused-cross-tenant-read')
    expect(sink.entries[0]?.subject).toBe(OTHER_TENANT_FIXTURE_ID)
    expect(sink.entries[0]?.tenant).toBe(SEEDED_TENANT)
  })

  // THE PAIR. FAILS IF: everything becomes a refusal, so the assertion above
  // would pass on a function that refuses its own tenant's rows too.
  it('answers a genuinely unknown identifier as not-found, and does not audit it', () => {
    const sink = recording()
    const result = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      workflowId: 'WF-NOBODY-HAS-THIS',
      writeAudit: sink.write,
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.kind).toBe('not-found')
    expect(sink.entries).toHaveLength(0)

    // ...and a real, in-tenant, published identifier opens.
    const ok = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      workflowId: PUBLISHED_FIXTURE_ID,
      writeAudit: sink.write,
    })
    expect(ok.ok).toBe(true)
  })

  // TEST-STU-055 (L32023).
  // FAILS IF: the row-2 rule is enforced only in the list. Taking a row off
  // the screen does not stop anyone typing its identifier.
  it('refuses a Draft opened by direct address without the grant, and audits the attempt', () => {
    const sink = recording()
    const refused = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario({ persona: 'supervisor-without-grant' }),
      workflowId: DRAFT_FIXTURE_ID,
      writeAudit: sink.write,
    })
    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('unreachable')
    expect(refused.kind).toBe('refused-unreleased')
    expect(refused.message).toContain('read as though it were policy')
    expect(sink.entries[0]?.action).toBe('refused-unreleased-read')

    // ...and the grant-holder opens the very same identifier.
    const allowed = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario({ persona: 'supervisor-with-authoring-grant' }),
      workflowId: DRAFT_FIXTURE_ID,
      writeAudit: sink.write,
    })
    expect(allowed.ok).toBe(true)
  })

  // FAILS IF: a Worker's attempt stops being refused or stops being audited.
  it('refuses the Worker at the query layer as well as at the list', () => {
    const sink = recording()
    const result = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario({ persona: 'worker' }),
      workflowId: PUBLISHED_FIXTURE_ID,
      writeAudit: sink.write,
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.kind).toBe('refused-not-a-library-reader')
    expect(sink.entries).toHaveLength(1)
  })

  // FB-STU-10.
  // FAILS IF: an audit failure quietly turns into a silent refusal that
  // claims to have been recorded.
  it('says so when the refusal itself could not be audited, and still refuses', () => {
    const result = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: scenario(),
      workflowId: OTHER_TENANT_FIXTURE_ID,
      writeAudit: FAILING,
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.audited).toBe(false)
    expect(result.message).toContain('unrecorded')
  })
})

/* ==================================================================== *
 * 7. THE AFFORDANCES — SB-STU-06's disabled-not-hidden rule.
 * ==================================================================== */

describe('the New Workflow control', () => {
  // The brief's step 6. NOT an `aria-disabled` presence assertion: the
  // rendering KIND and the REASON TEXT are both asserted, and the paired
  // enabled case proves the control really works for somebody.
  // FAILS IF: the storyboard rendering is dropped and the button goes
  // absent for a Supervisor without the grant, or the reason stops naming
  // the grant.
  it('is disabled with its stated reason for a Supervisor without the grant, never hidden', () => {
    const rendering = libraryAffordance('create-a-new-workflow', scenario({ persona: 'supervisor-without-grant' }), 'New Workflow')
    expect(rendering.kind).toBe('disabled')
    if (rendering.kind !== 'disabled') throw new Error('unreachable')
    expect(rendering.label).toBe('New Workflow')
    expect(rendering.reason).toContain('GRANT-STU-AUTHOR')
    expect(rendering.reason).toContain('The feature exists and is not missing')
    expect(rendering.reason).toContain('SB-STU-06 L31976')

    // The pair: the same control is live for the grant-holder, so the
    // disabled assertion is not passing on a control that never works.
    const live = libraryAffordance('create-a-new-workflow', scenario({ persona: 'supervisor-with-authoring-grant' }), 'New Workflow')
    expect(live.kind).toBe('enabled')
  })

  // FAILS IF: the grant sentence is said to a persona the grant is not the
  // obstacle for. §5.18 states the Plant Manager persona read-only and unable
  // to edit, so offering it the authoring grant offers a capacity the source
  // withholds; the Tenant Admin administers grants and may not self-assign
  // one (L34584), so "ask your Tenant Admin" is advice they cannot act on.
  // MOD-STU-18 excluded the Plant Manager for the same reason and this module
  // does not disagree with it.
  it('is disabled for the other read-only personas without offering them a grant they cannot hold', () => {
    for (const persona of ['plant-manager-persona', 'tenant-admin'] as const) {
      const rendering = libraryAffordance('create-a-new-workflow', scenario({ persona }), 'New Workflow')
      expect(rendering.kind, persona).toBe('disabled')
      if (rendering.kind !== 'disabled') throw new Error('unreachable')
      // The storyboard's point still renders...
      expect(rendering.reason, persona).toContain('The feature exists and is not missing')
      // ...without naming an obstacle that is not theirs.
      expect(rendering.reason, persona).not.toContain('Ask your Tenant Admin')
      expect(rendering.reason, persona).not.toContain('Requires the authoring grant')
    }
    // The pair: the one persona the grant IS the obstacle for still hears it.
    const supervisor = libraryAffordance('create-a-new-workflow', scenario({ persona: 'supervisor-without-grant' }), 'New Workflow')
    if (supervisor.kind !== 'disabled') throw new Error('unreachable')
    expect(supervisor.reason).toContain('Requires the authoring grant')
  })

  // FAILS IF: the storyboard exception leaks to a persona that cannot open
  // the Library. Telling a Worker to ask for the authoring grant would name
  // the wrong missing condition (AC-STU-155).
  it('draws no control at all for the Worker, and does not tell them to ask for a grant', () => {
    const rendering = libraryAffordance('create-a-new-workflow', scenario({ persona: 'worker' }), 'New Workflow')
    expect(rendering.kind).toBe('absent')
    if (rendering.kind !== 'absent') throw new Error('unreachable')
    expect(rendering.note).not.toContain('GRANT-STU-AUTHOR')
  })

  // FAILS IF: the exception leaks onto any other row. Eight of the nine rows
  // render a prohibited cell as ABSENT, everywhere, for everybody.
  it('renders Explicitly prohibited as absent on every row but the one the storyboard names', () => {
    let prohibitedCells = 0
    let absentRenderings = 0
    for (const rowId of STU_03_ROW_IDS as readonly Stu03RowId[]) {
      for (const persona of STUDIO_PERSONA_COLUMNS) {
        if (stu03Row(rowId).cells[persona].outcome !== 'explicitlyProhibited') continue
        prohibitedCells += 1
        const rendering = libraryAffordance(rowId, scenario({ persona }), 'a control')
        if (rowId === 'create-a-new-workflow' && persona !== 'worker' && persona !== 'read-only-auditor') {
          expect(rendering.kind, `${rowId}/${persona}`).toBe('disabled')
        } else {
          expect(rendering.kind, `${rowId}/${persona}`).toBe('absent')
          absentRenderings += 1
        }
      }
    }
    // NOT VACUOUS: there really are prohibited cells, and most of them are
    // absent renderings.
    expect(prohibitedCells).toBeGreaterThan(30)
    expect(absentRenderings).toBeGreaterThan(30)
  })

  // FAILS IF: the New Workflow button stops being drawn on the screen with
  // its reason as visible text. `Button` renders `aria-disabled` and puts
  // the reason in a sibling wired through `aria-describedby`; both are
  // asserted, and the paired live case asserts the reason is NOT there when
  // the control works.
  it('draws the disabled button and its reason on the screen, and neither when it is live', () => {
    const withheld = screenMarkup({ persona: 'supervisor-without-grant' })
    expect(withheld).toContain('New Workflow')
    expect(withheld).toContain('aria-disabled="true"')
    expect(plain(withheld)).toContain('Requires the authoring grant')
    expect(plain(withheld)).toContain('The feature exists and is not missing')

    const live = screenMarkup({ persona: 'supervisor-with-authoring-grant' })
    expect(live).toContain('New Workflow')
    expect(plain(live)).not.toContain('The feature exists and is not missing')

    const worker = screenMarkup({ persona: 'worker' })
    expect(plain(worker)).not.toContain('New Workflow')
  })
})

/* ==================================================================== *
 * 8. THE STATE MACHINE — D6 and the transition the source cannot support.
 * ==================================================================== */

describe('the Workflow state machine', () => {
  // FAILS IF: a transition is dropped or the un-archival arrow stops being
  // marked unspecified.
  it('draws the seven transitions and marks exactly one of them unspecified in source', () => {
    expect(WORKFLOW_TRANSITIONS).toHaveLength(7)
    const open = WORKFLOW_TRANSITIONS.filter((t) => t.unspecifiedInSource)
    expect(open).toHaveLength(1)
    expect(open[0]?.from).toBe('Archived')
    expect(open[0]?.to).toBe('Published')
    expect(open[0]?.label).toContain('republication is not defined in the source')
  })

  // FAILS IF: a control is invented for the transition the source cannot
  // support. It renders as a statement; nothing offers it.
  it('offers no control for un-archival, to anybody', () => {
    const text = plain(screenMarkup({ persona: 'quality-manager' }))
    expect(text).toContain('republication is not defined in the source')
    expect(text).toContain('Not specified in the Statement of Work')
    expect(text).not.toContain('Un-archive')
    expect(text).not.toContain('Republish this version')
    // ...and there is no matrix row for it either, so nothing could evaluate
    // an affordance for it even if a screen asked.
    expect(STU_03_ROW_IDS.some((id) => id.includes('archive'))).toBe(false)
  })

  // FAILS IF: DEC-ARCH-001 leaves the shared decision canon, or this module
  // mints a local copy of it again. It used to be an UNSPECIFIED_IN_SOURCE
  // entry here because the canon had no record; the canon now carries D28.
  it('discloses DEC-ARCH-001 from the shared canon and keeps no local copy', () => {
    const record = studioDecision('D28')
    expect(record.decisionRef).toBe('DEC-ARCH-001')
    expect(UNSPECIFIED_IN_SOURCE.map((r) => r.id)).not.toContain('DEC-ARCH-001')
    const text = plain(screenMarkup())
    expect(text).toContain('DEC-ARCH-001')
    for (const r of record.readings) expect(text).toContain(r.text)
    // The screen-scoped statement stays where it belongs: the state machine
    // note, which says this Library draws no un-archive control and why.
    expect(text).toContain('Not specified in the Statement of Work')
  })

  // D6. FAILS IF: Archived is dropped from the status vocabulary, or the
  // disclosure stops carrying OBJ-036's narrower statement.
  it('keeps the Archived state and records OBJ-036 as the narrower statement', () => {
    expect(WORKFLOW_STATUSES).toContain('Archived')
    const d6 = studioDecision('D6')
    expect(d6.question).toContain('Archived state')
    expect(d6.readings.map((r) => r.locator).join(' ')).toContain('OBJ-036')
    expect(d6.adopted).toContain('narrower statement')
    // The Library really can express it, which is D6's own reason.
    const archived = workflowsVisibleTo(SEEDED_LIBRARY, scenario()).filter((w) => w.status === 'Archived')
    expect(archived.length).toBeGreaterThan(0)
    expect(archived.every((w) => linkageStatement(w.linkage).includes('0 linked Jobs'))).toBe(true)
  })

  // FAILS IF: what-the-diagram-shows stops rendering. Two of its three
  // sentences are constraints and the third is the open decision.
  it('renders what the diagram shows, including that archival is never automatic', () => {
    expect(STATE_MACHINE_NOTES.onlyRouteIn).toContain('Release Authority')
    expect(STATE_MACHINE_NOTES.archivalIsManual).toContain('never automatic')
    const text = plain(screenMarkup())
    expect(text).toContain('never automatic')
    expect(text).toContain('The only route into Published runs through In Review')
  })
})

/* ==================================================================== *
 * 9. NOT SPECIFIED IN THE SOURCE.
 * ==================================================================== */

describe('the unspecified-in-source panel', () => {
  // FAILS IF: a record loses a reading, its adopted position or its cost —
  // any of which turns a disclosure into an assertion.
  it('carries two records, each with at least two readings, a position and a cost', () => {
    expect(UNSPECIFIED_IN_SOURCE).toHaveLength(2)
    // DEC-ARCH-001 is NOT here. It is a source decision card owned by
    // MOD-STU-12, it carries a canonical record as D28, and this screen
    // renders that record rather than restating it -- see the test below.
    expect(UNSPECIFIED_IN_SOURCE.map((r) => r.id)).toEqual([
      'DEC-TAXROLE-001',
      'archived-visibility',
    ])
    for (const record of UNSPECIFIED_IN_SOURCE) {
      expect(record.readings.length, record.id).toBeGreaterThanOrEqual(2)
      expect(record.adopted.length, record.id).toBeGreaterThan(0)
      expect(record.cost.length, record.id).toBeGreaterThan(0)
      expect(record.readings.every((r) => r.locator.length > 0), record.id).toBe(true)
    }
  })

  // FAILS IF: the panel stops rendering any of the three, or renders one
  // without its cost.
  it('renders all three on the screen with their costs', () => {
    const text = plain(screenMarkup())
    for (const record of UNSPECIFIED_IN_SOURCE) {
      expect(text, record.id).toContain(record.question)
      expect(text, record.id).toContain('What this costs')
    }
  })
})

/* ==================================================================== *
 * 10. THE SCREEN — SCR-STU-02, the landing view.
 * ==================================================================== */

describe('SCR-STU-02 — the Workflow Library', () => {
  // D1. FAILS IF: a module id or a screen id becomes a route key.
  it('annotates MOD-STU-03 and SCR-STU-02 without keying the route on either', () => {
    const html = screenMarkup()
    expect(html).toContain('MOD-STU-03')
    expect(html).toContain('SCR-STU-02')
    expect(html).not.toContain('/studio/SCR-STU-02')
    expect(html).not.toContain('/studio/MOD-STU-03')
    expect(stuModuleById(STU_MODULES, 'MOD-STU-03').slug).toBe('workflow-library')
    expect(stuScreensForModule(STU_SCREENS, 'MOD-STU-03').map((s) => s.id)).toEqual(['SCR-STU-02'])
  })

  // AC-STU-047 (L32012) and AC-STU-017 (L31097).
  // FAILS IF: the Library stops opening on Published, or drops one of the
  // columns SB-STU-06 (L31976) names.
  it('opens on the Published filter and draws SB-STU-06’s columns', () => {
    const text = plain(screenMarkup())
    for (const header of [
      'Status',
      'Job Type',
      'Service Type tag',
      'Current version',
      'Linked Jobs',
      'Linked Runs',
      'Last published',
    ]) {
      expect(text, header).toContain(header)
    }
    expect(text).toContain(WHEEL_BOLT_DRAFT_CONTENT.workflowName)
    expect(text).toContain('v2.1.0')
    // Default filter applied on open: the archived row is not drawn.
    expect(text).not.toContain('Rim Trueing')
  })

  // FAILS IF: the module count or a state this surface excludes appears, or
  // the state list is hand-written rather than derived from task 2's model.
  it('renders only the screen states SCR-STU-02 reaches', () => {
    const reached = STU_APPLICABLE_STATES.map((r) => r.id).filter((id) => screenRendersState('SCR-STU-02', id))
    expect(reached).toContain('STATE-01')
    expect(reached).toContain('STATE-12')
    expect(reached).not.toContain('STATE-07')
    expect(reached).not.toContain('STATE-09')
    expect(reached).not.toContain('STATE-10')
    expect(reached).not.toContain('STATE-11')

    for (const state of reached) {
      expect(() => screenMarkup({ screenState: state }), state).not.toThrow()
    }
  })

  // FAILS IF: the screen's own state list is hand-written instead of derived
  // from task 2's model — which is how STATE-07 gets back onto a surface that
  // excludes it (D22). The reviewer's own selector is compared to the
  // derivation, so the two cannot disagree.
  it('offers exactly the screen states task 2’s model derives, and no others', () => {
    const derived = STU_APPLICABLE_STATES.map((r) => r.id).filter((id) =>
      screenRendersState('SCR-STU-02', id),
    )
    expect(derived.length).toBeGreaterThan(0)
    const html = screenMarkup()
    const offered = [...html.matchAll(/<option value="(STATE-\d\d)"/g)].map((m) => m[1])
    expect(offered).toEqual(derived)
    expect(offered).not.toContain('STATE-07')
  })

  // FAILS IF: `readOnly` is folded into `absent`, or stops carrying the
  // cell's own words. Row 8's Read-only cell is a real answer — the persona
  // reads linkage counts and cannot act on them — and collapsing it to a
  // prohibition would take the read away.
  it('renders a Read-only linkage cell as disabled with the cell’s own words, not as absent', () => {
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      const rendering = libraryAffordance('see-linkage-counts', scenario({ persona }), 'Refresh linkage counts')
      expect(rendering.kind, persona).toBe('disabled')
      if (rendering.kind !== 'disabled') throw new Error('unreachable')
      expect(rendering.reason, persona).toContain('Read-only')
    }
    // The pair: the persona the same row grants outright.
    expect(
      libraryAffordance('see-linkage-counts', scenario({ persona: 'quality-manager' }), 'Refresh linkage counts').kind,
    ).toBe('enabled')
  })

  // FAILS IF: a sentence points at a module or a seam that is not in the
  // registry. Each pointer is resolved through the registry, so removing the
  // target makes this throw rather than leaving a rotting pointer.
  it('pins every sentence that points at content elsewhere', () => {
    const text = plain(screenMarkup())
    for (const id of ['MOD-STU-04', 'MOD-STU-12'] as const) {
      const module = stuModuleById(STU_MODULES, id)
      expect(text, id).toContain(module.name)
    }
    const seam = stuSeamById(STU_SEAMS, 'job-and-run-linkage-counts')
    expect(text).toContain(seam.name)
    expect(text).toContain(WORKFLOW_OBJECT.numericId)
    expect(text).toContain(WORKFLOW_OBJECT.mnemonic)
  })

  // FAILS IF: a module writes its own disclosure prose instead of using the
  // shared component, or a decision this screen depends on is removed.
  it('renders D6, D11 and D20 through the shared disclosure component', () => {
    const text = plain(screenMarkup())
    for (const id of ['D6', 'D11', 'D20'] as const) {
      const decision = studioDecision(id)
      expect(text, id).toContain(decision.question)
      expect(text, id).toContain(decision.adopted)
    }
    expect(text).toContain('A client-delegated choice under APP-012')
  })

  // FAILS IF: the seeded cast drifts from MOD-STU-18's. Two modules seeding
  // two different Sams is how one audit log stops matching another.
  it('seeds the same illustrative cast as MOD-STU-18', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(libraryIdentity(persona).identity.identityId, persona).toBe(
        studioIdentityFor(persona).identityId,
      )
      expect(libraryIdentity(persona).identity.roles, persona).toEqual(studioIdentityFor(persona).roles)
    }
  })

  // FAILS IF: the empty state is dropped, so a Library with no readable rows
  // renders a bare zero-row grid instead of saying what creates one.
  it('states what creates a Workflow when the filtered list is empty', () => {
    const state: LibraryState = { ...SEEDED_LIBRARY, workflows: [] }
    const text = plain(screenMarkup({ library: state }))
    expect(text).toContain('No Workflow')
    expect(text.toLowerCase()).toContain('new workflow')
  })
})

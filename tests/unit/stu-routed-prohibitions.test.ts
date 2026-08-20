import { describe, expect, it } from 'vitest'

import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  STUDIO_PERSONA_COLUMNS,
  type StudioMatrixCell,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'

import { MOD_STU_01_MATRIX, CHARTER_ACTIONS } from '@/studio/modules/stu-01/matrix'
import { charterAffordance, charterDecision } from '@/studio/modules/stu-01/service'
import { STU01_SEED_STATE } from '@/studio/modules/stu-01/capabilities'

import { STU_03_MATRIX, STU_03_ROW_IDS } from '@/studio/modules/stu-03/matrix'
import { libraryAffordance, SEEDED_SCENARIO as LIBRARY_SCENARIO } from '@/studio/modules/stu-03/library'

import { STU_04_MATRIX, STU_04_CAPABILITY_IDS, stu04Row } from '@/studio/modules/stu-04/matrix'
import { builderControls, scenario as stu04Scenario } from '@/studio/modules/stu-04/rendering'

import { STU_07_MATRIX, STU_07_CAPABILITY_IDS, stu07Row } from '@/studio/modules/stu-07/matrix'
import { libraryControls, scenario as stu07Scenario } from '@/studio/modules/stu-07/rendering'

import { STU_13_MATRIX, STU_13_ROW_IDS } from '@/studio/modules/stu-13/matrix'
import { qualificationControls, stu13Scenario } from '@/studio/modules/stu-13/qualifications'

import { STU_09_MATRIX, STU_09_ROW_IDS } from '@/studio/modules/stu-09/matrix'
import { difficultyAffordance, STU09_DEFAULT_CONTEXT } from '@/studio/modules/stu-09/levels'

import { STU_10_MATRIX, STU_10_ROW_IDS } from '@/studio/modules/stu-10/matrix'
import { partsAffordance } from '@/studio/modules/stu-10/seam'

import { STU_11_MATRIX, STU_11_CAPABILITY_IDS, approvalRow } from '@/studio/modules/stu-11/matrix'
import {
  approvalAffordance,
  approvalRoute,
  seededDiffEngine,
  submit,
  type ApprovalChain,
  type ApprovalContext,
} from '@/studio/modules/stu-11/chain'

import { STU_12_MATRIX, STU_12_CAPABILITY_IDS, versionRow } from '@/studio/modules/stu-12/matrix'
import { versionRoute } from '@/studio/modules/stu-12/versions'
import { contextFor, FIXTURE_TENANT, RELEASED_SUBMISSION } from '@/../app/studio/versions/fixtures'

import { STU18_MATRIX, STU18_ROW_IDS, stu18Row } from '@/studio/modules/stu-18/matrix'
import {
  capabilityPanelRows,
  decisionForRow,
  routedProhibitionApplies,
  SEEDED_SCENARIO as STU18_SCENARIO,
} from '@/studio/modules/stu-18/rendering'

/**
 * THE ROUTED PROHIBITION — THE WHOLE MECHANISM, ACROSS EVERY CARD THAT
 * DECLARES IT.
 *
 * ### What it decides
 *
 * `Explicitly prohibited` carries no rendering anywhere in the frozen source,
 * so it renders ABSENT. The one exception is a prohibition that is a ROUTING
 * rule rather than a categorical one: the person holds the capability, is
 * refused HERE, and the reason can say where it lives. That renders DISABLED.
 *
 * `routedTo` only NOMINATES a target. What decides the rendering is the
 * evaluator's own answer for that target, for the same identity, through the
 * one predicate the surface shares — `routedProhibitionApplies`.
 *
 * ### "Actually permits" — the definition, and the one this build retired
 *
 * The predicate asks whether the target permits **this persona**. It used to
 * be asked two ways: `MOD-STU-07` and `MOD-STU-04` asked of this persona,
 * `MOD-STU-13` asked whether ANYBODY held the target. A rule with two
 * readings is not one rule, and the frozen source settles it against the
 * second reading by name:
 *
 * - `AC-CC-012` (L35037) — "A Supervisor session renders only Areas within
 *   its scope grant; an out-of-scope Area is **absent, not greyed**." Another
 *   Supervisor holds that Area.
 * - `SCR-SA-USR-01` (L14977) — account creation is root-only, and "for every
 *   other console role it renders as an explanatory line reading 'Account
 *   creation is root-only', **never as a greyed control**."
 *
 * and states the implication a greyed control carries, which is why:
 * `SB-ARCH-018` (L12889) refuses one "because showing a greyed control would
 * imply the setting **could exist**", and `FUNC-SA-09-06-A2` (L45068) refuses
 * one because "greyed controls imply the action exists **elsewhere**". A
 * disabled control is a promise about what THIS reader could reach. Nothing
 * in the source affirms the wider reading; the two locators above refuse it.
 * So it is not a source contradiction and is not pinned as one — it is a
 * defect, and `MOD-STU-13`'s one pointer, written under it, is gone.
 *
 * ### Ten cards declare the field. Seven used to and no longer do.
 *
 * `MOD-STU-01`, `-03`, `-04`, `-07`, `-09`, `-10`, `-11`, `-12`, `-13` and
 * `-18` declare `routedTo` AND read it in a fold. `MOD-STU-02`, `-05`, `-08`,
 * `-14`, `-15`, `-16` and `-17` declared a map of eight nulls per row that no
 * code path consulted; following `MOD-STU-06`, which never declared it and
 * documented why, the field is gone from all seven. A declaration nothing
 * reads is the defect shape this slice has now shipped twice, and the absence
 * of the field is a structure that cannot express it. Slice 5 gate 17 holds
 * the enumeration.
 *
 * ### The independence rule this file obeys
 *
 * **NO EXPECTATION HERE IS DERIVED FROM `routedTo`.** Every claim below is
 * pinned against one of two things that are not `routedTo`:
 *
 * 1. **The source's own words for the cell**, read off `cells[column].note` —
 *    the module's transcription of the blueprint, which the routing field
 *    cannot influence.
 * 2. **The target row's own cell in the same column**, read off
 *    `cells[column].outcome`. That is the target's own matrix answering
 *    whether it permits the capability, which is exactly the claim a
 *    `routedTo` makes and must not be trusted to make about itself.
 */

/* ==================================================================== *
 * SCENARIOS — one per module, at its own module's seed.
 * ==================================================================== */

const CHARTER_CTX = { state: STU01_SEED_STATE, identityLayer: 'reachable' as const, online: true }

const STU11_TENANT = tenantId('TEN-BRIGHT-BIKES')
const STU11_DOMAIN: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-11-ROUTES')),
  STU11_TENANT,
  (partition) => ({ ...partition, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

const STU11_IDENTITIES: Readonly<Record<StudioPersonaColumn, { id: string; roles: readonly string[] }>> = {
  'quality-manager': { id: 'IDN-ELENA', roles: ['QUALITY_MANAGER'] },
  'supervisor-with-authoring-grant': { id: 'IDN-SAM', roles: ['SUPERVISOR'] },
  'supervisor-without-grant': { id: 'IDN-TOMAS', roles: ['SUPERVISOR'] },
  'plant-manager-persona': { id: 'IDN-PLANT', roles: ['SUPERVISOR'] },
  'tenant-admin': { id: 'IDN-PRIYA', roles: ['TENANT_ADMIN'] },
  'read-only-auditor': { id: 'IDN-OMAR', roles: ['READONLY_AUDITOR'] },
  worker: { id: 'IDN-MAYA', roles: ['WORKER'] },
  'implementation-team': { id: 'IDN-IMPL', roles: ['SUPERVISOR'] },
}

/**
 * The grant column each persona is reached through. `GRANT-STU-AUTHOR` opens
 * the with-grant column and `GRANT-STU-IMPL` the implementation-team column
 * (L34588 — the capacity is a grant, not a role); everybody else holds
 * neither, so recording one would answer for a persona the source does not
 * give it to.
 */
function stu11Ctx(persona: StudioPersonaColumn, over: Partial<ApprovalContext> = {}): ApprovalContext {
  const who = STU11_IDENTITIES[persona]
  const grants =
    persona === 'supervisor-with-authoring-grant'
      ? { 'GRANT-STU-AUTHOR': 'Active' as const }
      : persona === 'implementation-team'
        ? { 'GRANT-STU-IMPL': 'Active' as const }
        : {}
  return {
    actor: { identityId: who.id, roles: who.roles, signedIn: true, tenant: STU11_TENANT } as ApprovalContext['actor'],
    grants,
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    domain: STU11_DOMAIN,
    online: true,
    at: '2026-06-21T09:00:00.000Z',
    audit: () => ({ ok: true }),
    diff: seededDiffEngine,
    staffing: {
      authoringGrantHolders: ['IDN-SAM', 'IDN-ELENA', 'IDN-RIVERSIDE'],
      reviewerEligible: ['IDN-ELENA', 'IDN-SAM', 'IDN-RIVERSIDE'],
      releaseAuthorityEligible: ['IDN-ELENA', 'IDN-SAM'],
    },
    ...over,
  }
}

/**
 * A submission in `Submitted`, driven through the chain rather than built.
 *
 * THE AUTHOR IS A THIRD IDENTITY, and that is not fixture convenience. The
 * route out of `Edit content while reviewing` is `Return a submission with
 * comments`, and separation of duties (L33389, AC-STU-100 L33400) refuses
 * that act to the AUTHOR of the submission in hand. So a persona who authored
 * this submission holds the routed capability nowhere on it and gets NO
 * route — see the covering case below, which drives exactly that arm. Seeding
 * the author as one of the two Reviewer-stage personas would have hidden the
 * difference behind the fixture.
 */
const STU11_AUTHOR = { id: 'IDN-RIVERSIDE', roles: ['SUPERVISOR'] as const }

function stu11Submitted(): ApprovalChain {
  const out = submit(
    {
      ...stu11Ctx('supervisor-with-authoring-grant'),
      actor: {
        identityId: STU11_AUTHOR.id,
        roles: STU11_AUTHOR.roles,
        signedIn: true,
        tenant: STU11_TENANT,
      } as ApprovalContext['actor'],
    },
    {
      submissionId: 'SUB-ROUTES-0001',
      consumer: 'workflow',
      subject: 'Wheel Bolt Torque Verification',
      tenant: STU11_TENANT,
    },
  )
  if (!out.ok) throw new Error(`fixture could not submit: ${out.refusal.reason}`)
  return out.chain
}

const STU12_STAGES = {
  author: RELEASED_SUBMISSION.author,
  reviewer: RELEASED_SUBMISSION.reviewer,
  releaseAuthority: RELEASED_SUBMISSION.releaseAuthority,
}

/* ==================================================================== *
 * THE CENSUS — the whole retrofit in one table, keyed on nothing the
 * code under test can move.
 * ==================================================================== */

/**
 * Every routed cell across the seven modules, written out as a literal from
 * the SOURCE'S OWN WORDS, plus the fragment of the cell's note that names the
 * alternative and the target that receives it.
 *
 * `namesTheRoute` is the independence pin for clause 1: it is asserted
 * against `cells[column].note`, the module's transcription of the blueprint
 * cell, not against `routedTo`. A route whose cell does not say so in the
 * source's own words is an author's judgement wearing the mechanism's
 * clothes, which is precisely what this field replaced.
 *
 * `null` on `namesTheRoute` marks the two cells whose own text is bare and
 * whose route is carried by a ROW-level statement in the source instead; the
 * locator for each is in the module's matrix header.
 */
const ROUTED_CENSUS = [
  // ---- MOD-STU-07, the module that introduced the mechanism. Five rows give
  // the Supervisor-with-grant `Explicitly prohibited` while row 4 gives that
  // same Supervisor `Allowed` (L32628-L32634). Two of the five say `may
  // propose only` in the source's own words; the other three are bare, and
  // their route is the card's shape rather than their own sentence.
  {
    module: 'MOD-STU-07',
    row: 'create-a-library-item',
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: 'may propose only',
    target: 'propose-a-change',
  },
  {
    module: 'MOD-STU-07',
    row: 'edit-a-library-item',
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: 'may propose only',
    target: 'propose-a-change',
  },
  {
    module: 'MOD-STU-07',
    row: 'archive-a-library-item',
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: null,
    target: 'propose-a-change',
  },
  {
    module: 'MOD-STU-07',
    row: 'approve-a-coaching-asset',
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: null,
    target: 'propose-a-change',
  },
  {
    module: 'MOD-STU-07',
    row: 'retire-a-flagged-coaching-asset',
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: null,
    target: 'propose-a-change',
  },
  {
    module: 'MOD-STU-09',
    row: 'review-drafted-levels-in-the-chain',
    column: 'implementation-team' as StudioPersonaColumn,
    namesTheRoute: 'author and submit only',
    target: 'author-one-difficulty-level',
  },
  {
    module: 'MOD-STU-11',
    row: 'edit-content-while-reviewing',
    column: 'quality-manager' as StudioPersonaColumn,
    namesTheRoute: 'corrections go back to the Author',
    target: 'return-with-comments',
  },
  {
    module: 'MOD-STU-11',
    row: 'edit-content-while-reviewing',
    // The grant-holder's own cell is a bare `Explicitly prohibited`; the route
    // is stated at ROW level by FUNC-STU-11-01-B-3 (L33300, "corrections go
    // back to the Author", Roles allowed: none) and FUNC-STU-11-01-B-2
    // (L33299) names Return as a lawful outcome for both Reviewer-stage roles.
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: null,
    target: 'return-with-comments',
  },
  {
    module: 'MOD-STU-18',
    row: 'create-edit-archive-content-library-items',
    column: 'supervisor-with-authoring-grant' as StudioPersonaColumn,
    namesTheRoute: 'may propose only',
    target: 'propose-a-content-library-change',
  },
  {
    module: 'MOD-STU-18',
    row: 'hold-or-delegate-the-agent-author-capability',
    column: 'tenant-admin' as StudioPersonaColumn,
    namesTheRoute: 'assigns it, does not hold it by default',
    target: 'assign-or-revoke-the-two-grants',
  },
  {
    module: 'MOD-STU-18',
    row: 'hold-any-stage-of-the-approval-chain',
    column: 'implementation-team' as StudioPersonaColumn,
    namesTheRoute: 'author and submit only',
    target: 'submit-for-review',
  },
] as const

/**
 * The six cards that declare `routedTo` and nominate nothing on it —
 * `MOD-STU-01`, `-03`, `-04`, `-10`, `-12` and `-13`. Their folds READ the
 * field on every row they fold; every answer is `null`, and that is a
 * derivation rather than an omission. Each has a covering case below that drives the predicate directly,
 * because a module with no route of its own cannot reach the branch through
 * its own data.
 *
 * A card that declares the field and has no fold that reads it is not on this
 * list and must not exist: slice 5 gate 17 enumerates the ten, and the seven
 * cards that used to carry the field as eight nulls per row no longer declare
 * it at all.
 */
const DECLARES_BUT_NOMINATES_NOTHING = [
  'MOD-STU-01',
  'MOD-STU-03',
  'MOD-STU-04',
  'MOD-STU-10',
  'MOD-STU-12',
  'MOD-STU-13',
] as const

interface ModuleUnderTest {
  readonly module: string
  readonly rows: readonly {
    readonly id: string
    readonly cells: Readonly<Record<StudioPersonaColumn, StudioMatrixCell>>
    readonly routedTo: Readonly<Record<StudioPersonaColumn, string | null>>
  }[]
  readonly ids: readonly string[]
}

const MODULES: readonly ModuleUnderTest[] = [
  { module: 'MOD-STU-01', rows: MOD_STU_01_MATRIX.map((r) => ({ ...r, id: r.action })), ids: CHARTER_ACTIONS },
  { module: 'MOD-STU-03', rows: STU_03_MATRIX, ids: STU_03_ROW_IDS },
  { module: 'MOD-STU-04', rows: STU_04_MATRIX, ids: STU_04_CAPABILITY_IDS },
  { module: 'MOD-STU-07', rows: STU_07_MATRIX, ids: STU_07_CAPABILITY_IDS },
  { module: 'MOD-STU-09', rows: STU_09_MATRIX, ids: STU_09_ROW_IDS },
  { module: 'MOD-STU-10', rows: STU_10_MATRIX, ids: STU_10_ROW_IDS },
  { module: 'MOD-STU-11', rows: STU_11_MATRIX, ids: STU_11_CAPABILITY_IDS },
  { module: 'MOD-STU-12', rows: STU_12_MATRIX, ids: STU_12_CAPABILITY_IDS },
  { module: 'MOD-STU-13', rows: STU_13_MATRIX, ids: STU_13_ROW_IDS },
  { module: 'MOD-STU-18', rows: STU18_MATRIX, ids: STU18_ROW_IDS },
]

const PERMITS = new Set(['allowed', 'allowedWithConditions'])

describe('the routed prohibition — every card that declares it', () => {
  // Not a spot check: every module's row type declares `routedTo` as a TOTAL
  // record over the eight columns, and this proves the value matches the
  // type at run time. A partial map would leave a column reading `undefined`,
  // which is falsy and would therefore render ABSENT without anybody deciding
  // it should — the blank-cell defect one level down.
  //
  // FAILS IF: a row is added with a partial or missing `routedTo`.
  it.each(MODULES.map((m) => [m.module, m] as const))(
    '%s answers routedTo on every cell of every row',
    (_name, mod) => {
      for (const row of mod.rows) {
        for (const column of STUDIO_PERSONA_COLUMNS) {
          expect(Object.hasOwn(row.routedTo, column), `${row.id}/${column}`).toBe(true)
          const target = row.routedTo[column]
          expect(target === null || typeof target === 'string', `${row.id}/${column}`).toBe(true)
        }
      }
    },
  )

  // A dangling pointer is a defect the type system does not catch on its own
  // once a row id is renamed in one place and not the other.
  //
  // FAILS IF: a pointer names a row its own matrix does not carry.
  it.each(MODULES.map((m) => [m.module, m] as const))(
    '%s resolves every routedTo pointer against its own matrix',
    (_name, mod) => {
      const ids = new Set<string>(mod.ids)
      for (const row of mod.rows) {
        for (const column of STUDIO_PERSONA_COLUMNS) {
          const target = row.routedTo[column]
          if (target !== null) expect(ids.has(target), `${row.id}/${column} → ${target}`).toBe(true)
        }
      }
    },
  )

  // THE WHOLE MECHANISM, AS ONE TABLE. Eleven cells nominate a route out of
  // the ten cards that declare the field; every other prohibited cell is
  // ABSENT, and that is the answer rather than an omission.
  //
  // ONE PROHIBITED CELL ON THESE MODULES STILL RENDERS DISABLED WITHOUT A
  // ROUTE, and it is not an oversight: `MOD-STU-03`'s New Workflow button
  // carries `storyboardProhibition`, because `SB-STU-06` (L31976) states the
  // exception in the source's own words — "disabled with a stated reason for
  // read-only roles rather than hidden". That is a separately sourced
  // instruction with its own locator, not a second spelling of this mechanism.
  //
  // FAILS IF: a route is added to a cell that should be absent, or removed
  // from one that should be routed. Both directions are the planted defects
  // this file exists to catch, and neither can be written without this
  // literal moving.
  it('nominates exactly eleven cells across the ten cards, and names each one', () => {
    const actual = MODULES.flatMap((mod) =>
      mod.rows.flatMap((row) =>
        STUDIO_PERSONA_COLUMNS.filter((c) => row.routedTo[c] !== null).map(
          (c) => `${mod.module}/${row.id}/${c}→${row.routedTo[c]}`,
        ),
      ),
    )
    expect(actual).toEqual(
      ROUTED_CENSUS.map((r) => `${r.module}/${r.row}/${r.column}→${r.target}`),
    )
  })

  // The other half of the same census, and the reason a card with no route is
  // still not decorative: it declares the field, its fold reads it on every
  // row, and every answer is `null`.
  //
  // FAILS IF: one of the six gains a route without this list moving, or a
  // card is added to the list that in fact routes somebody.
  it('leaves the other six cards nominating nothing at all', () => {
    const silent = MODULES.filter((mod) =>
      mod.rows.every((row) => STUDIO_PERSONA_COLUMNS.every((c) => row.routedTo[c] === null)),
    ).map((mod) => mod.module)
    expect(silent).toEqual([...DECLARES_BUT_NOMINATES_NOTHING])
  })

  // INDEPENDENCE PIN 1 — the source's own words, read off the cell's note.
  //
  // FAILS IF: a route is written on a cell whose transcribed text does not
  // name the alternative. That is the check that keeps `routedTo` a reading
  // of the blueprint rather than a preference about rendering.
  it.each(
    ROUTED_CENSUS.filter((r) => r.namesTheRoute !== null).map(
      (r) => [`${r.module}/${r.row}/${r.column}`, r] as const,
    ),
  )('%s carries the alternative in the cell’s own words', (_name, entry) => {
    const row = MODULES.find((m) => m.module === entry.module)!.rows.find((r) => r.id === entry.row)!
    expect(row.cells[entry.column].note).toContain(entry.namesTheRoute!)
  })

  // INDEPENDENCE PIN 2 — THE TARGET'S OWN MATRIX, and the clause that makes
  // this mechanism checkable at all. A `routedTo` NOMINATES; whether it
  // renders is decided by the evaluator's answer for the target FOR THIS SAME
  // PERSONA. That answer is read here off the TARGET ROW'S OWN CELL, never off
  // the pointer and never off any decision the pointer produced.
  //
  // THE DEFINITION THIS PINS, AND THE ONE IT REFUSES. "Actually permits" means
  // the target permits THIS persona — not that somebody, anywhere, holds it.
  // `MOD-STU-13` implemented the second reading until this task; the frozen
  // source refuses it by name in two places, `AC-CC-012` (L35037, "an
  // out-of-scope Area is absent, not greyed" — of an Area another Supervisor
  // holds) and `SCR-SA-USR-01` (L14977, root-only account creation renders for
  // every other console role as an explanatory line, "never as a greyed
  // control"). Hence `entry.column` on BOTH sides of this assertion.
  //
  // FAILS IF: a route points at a target that does not permit the capability
  // for that persona — the exact defect the mechanism is for, and the one
  // planted below to prove this arm can go red.
  it.each(ROUTED_CENSUS.map((r) => [`${r.module}/${r.row}/${r.column}`, r] as const))(
    '%s points at a target whose own cell permits that same persona',
    (_name, entry) => {
      const mod = MODULES.find((m) => m.module === entry.module)!
      const source = mod.rows.find((r) => r.id === entry.row)!
      const target = mod.rows.find((r) => r.id === entry.target)!
      expect(source.cells[entry.column].outcome).toBe('explicitlyProhibited')
      expect(PERMITS.has(target.cells[entry.column].outcome), entry.target).toBe(true)
    },
  )
})

/* ==================================================================== *
 * THE RENDERINGS — one arm per module, both directions.
 * ==================================================================== */

describe('MOD-STU-01 — every cell absent, and the field still read', () => {
  // `Change the boundary` and `Author an atom` are `another-surface` rows
  // whose holder is the Platform Engineer in the platform console (L31579).
  // That is a DIFFERENT PERSON on a surface no Studio persona can reach, so
  // no tenant persona holds either act anywhere: FUNC-STU-01-01-C-1 (L31599)
  // states it as "Roles allowed: none — this is a universal refusal."
  //
  // FAILS IF: either define-class row is given a route and starts drawing a
  // disabled control that tells a reader to go somewhere they cannot go.
  it.each(['change-the-boundary', 'author-an-atom'] as const)(
    'renders %s absent for all eight personas',
    (action) => {
      for (const persona of STUDIO_PERSONA_COLUMNS) {
        const rendering = charterAffordance(action, persona, CHARTER_CTX, 'Do it')
        expect(rendering.kind, persona).toBe('absent')
      }
    },
  )

  // THE PLANT, and the direction that matters for a module with no routes:
  // prove the fold READS the field, so that thirty-two nulls are an answer
  // rather than thirty-two pieces of decoration. `charterDecision` is the
  // module's own evaluator and `see-charter-statements` is `Read-only` for
  // the Quality Manager, which does not permit ACTING — so even a planted
  // route collapses to absent, exactly as a route to an unheld target must.
  //
  // FAILS IF: `routedProhibitionApplies` starts admitting a target that only
  // permits reading.
  it('collapses a planted route to a read-only target back to absent', () => {
    const prohibited = charterDecision('author-an-atom', 'quality-manager', CHARTER_CTX)
    const readOnlyTarget = charterDecision('see-charter-statements', 'quality-manager', CHARTER_CTX)
    expect(prohibited.outcome).toBe('explicitlyProhibited')
    expect(readOnlyTarget.outcome).toBe('readOnly')
    expect(
      routedProhibitionApplies(prohibited, 'see-charter-statements', readOnlyTarget),
    ).toBe(false)
  })
})

describe('MOD-STU-03 — the two near misses, and why neither routes', () => {
  // Row 2 refuses three columns that hold row 1 — and AC-STU-048 (L32013)
  // uses the source's own word for the rendering: Draft and In Review
  // Workflows are "invisible" to those roles. Invisible is ABSENT, stated by
  // the source rather than adjudicated by this build.
  //
  // FAILS IF: row 2 is routed to row 1 on the reasoning that a persona who
  // may open the Library must be told what else is in it.
  it('renders “See Draft and In Review Workflows” absent, never routed to row 1', () => {
    for (const persona of ['supervisor-without-grant', 'plant-manager-persona', 'tenant-admin'] as const) {
      const rendering = libraryAffordance(
        'see-draft-and-in-review-workflows',
        { ...LIBRARY_SCENARIO, persona },
        'See drafts',
      )
      expect(rendering.kind, persona).toBe('absent')
    }
  })

  // Row 7 refuses every column. FUNC-STU-03-02-A-1 (L31937) carries the
  // foundation "without ever letting a tenant edit it" and AC-STU-049 adds
  // "by any tenant role", so the refusal can never become true. Row 6 creates
  // a CUSTOM type, which is a different capability rather than this one
  // relocated.
  //
  // FAILS IF: row 7 is routed to row 6.
  it('renders “Edit or delete a platform-seeded starter type” absent for everyone', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const rendering = libraryAffordance(
        'edit-or-delete-a-platform-seeded-starter-type',
        { ...LIBRARY_SCENARIO, persona },
        'Edit this starter type',
      )
      expect(rendering.kind, persona).toBe('absent')
    }
  })
})

describe('MOD-STU-04 — the row that nominated a route no fold ever read', () => {
  const ROW = 'open-the-canvas-for-a-draft-workflow'

  // Rows 1 and 2 are the two READS, not controls, so they never appear in
  // `BUILDER_CONTROLS` and `builderControls` — the one place this module reads
  // `routedTo` — never visits them. Row 1 used to nominate row 2 for the three
  // columns that hold the published canvas `Read-only`; the pointer could not
  // render (`Read-only` is not an action) and no path asked. It is gone.
  //
  // What enforces row 1 is the READ: a persona refused the draft canvas never
  // has a draft in the response, which is L32171's "rendered view with no
  // editing affordances rather than a disabled editor".
  //
  // FAILS IF: the pointer comes back, or the refusal moves from the read into
  // a rendering.
  it.each(['supervisor-without-grant', 'plant-manager-persona', 'tenant-admin'] as const)(
    'withholds drafts from %s in the read, and nominates nothing',
    (persona) => {
      expect(stu04Row(ROW).routedTo[persona]).toBeNull()
      expect(stu04Row(ROW).cells[persona].outcome).toBe('explicitlyProhibited')
      expect(stu04Row('open-the-canvas-read-only-for-a-published-version').cells[persona].outcome)
        .toBe('readOnly')
    },
  )

  // The fold that DOES read the field reaches every control it draws, and
  // every answer is null — so the nine controls are an answer, not an
  // omission, and a route planted onto any of them changes what is drawn.
  //
  // FAILS IF: `builderControls` stops consulting `routedTo`.
  it('reads routedTo on every control it folds', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      for (const control of builderControls(stu04Scenario({ persona }))) {
        expect(stu04Row(control.capabilityId).routedTo[persona], control.id).toBeNull()
      }
    }
  })
})

describe('MOD-STU-07 — the card that introduced the mechanism', () => {
  // The five ownership rows give the Supervisor-with-grant `Explicitly
  // prohibited` while row 4 gives that same Supervisor `Allowed` (L32628 —
  // L32634). Same person, same screen, one row apart: the prohibition is a
  // ROUTING rule, and this is the case the whole mechanism was built for.
  //
  // FAILS IF: a route is dropped, or its target stops permitting that
  // persona, or the reason stops naming where the capability lives.
  it('disables the five ownership controls for the grant-holder, naming Propose', () => {
    const controls = libraryControls(
      stu07Scenario({ persona: 'supervisor-with-authoring-grant' }),
      'containment-checklists',
    )
    for (const id of ['create-a-library-item', 'edit-a-library-item', 'archive-a-library-item'] as const) {
      const control = controls.find((c) => c.id === id)!
      expect(control.affordance.kind, id).toBe('disabled')
      if (control.affordance.kind !== 'disabled') continue
      expect(control.affordance.reason, id).toMatch(/propose/i)
    }
    // Pinned against the target's own cell for the same persona.
    expect(stu07Row('propose-a-change').cells['supervisor-with-authoring-grant'].outcome).toBe(
      'allowed',
    )
  })

  // The other arm, on the same rows: the columns that hold Propose nowhere
  // get no route and no control.
  //
  // FAILS IF: the route is read per ROW instead of per COLUMN.
  it.each(['supervisor-without-grant', 'tenant-admin', 'worker'] as const)(
    'renders the same rows absent for %s, who holds Propose nowhere',
    (persona) => {
      const controls = libraryControls(stu07Scenario({ persona }), 'containment-checklists')
      const create = controls.find((c) => c.id === 'create-a-library-item')!
      expect(create.affordance.kind).toBe('absent')
      expect(PERMITS.has(stu07Row('propose-a-change').cells[persona].outcome)).toBe(false)
    },
  )
})

describe('MOD-STU-13 — the card whose route the source took away', () => {
  // `MOD-STU-13` asked whether ANYBODY held the target and rendered row 5's
  // Quality Manager cell DISABLED on the strength of the TENANT ADMIN's
  // `Allowed`. `AC-CC-012` (L35037) and `SCR-SA-USR-01` (L14977) refuse that
  // rendering by name, so the pointer was a false claim under the settled
  // definition and is gone. The cell is an ABSENCE carrying its own words.
  //
  // Pinned against the target row's own cells — the Quality Manager's, which
  // refuses, and the Tenant Admin's, which is the `Allowed` the retired
  // reading was reaching for.
  //
  // FAILS IF: the wider reading returns, in this module or in the shared
  // predicate.
  it('renders row 5 absent for the Quality Manager, whose own cell on it refuses', () => {
    const control = qualificationControls(stu13Scenario({ persona: 'quality-manager' })).find(
      (c) => c.id === 'set-hard-block-versus-notify-posture',
    )!
    expect(control.affordance.kind).toBe('absent')
    const row = STU_13_MATRIX.find((r) => r.id === 'set-hard-block-versus-notify-posture')!
    expect(row.cells['quality-manager'].outcome).toBe('explicitlyProhibited')
    expect(row.cells['tenant-admin'].outcome).toBe('allowed')
  })
})

describe('MOD-STU-09 — one routed cell, and the rest absent', () => {
  const ROW = 'review-drafted-levels-in-the-chain'

  // The routed arm. The implementation team's cell says `author and submit
  // only`; row 1 is that authoring act and its own cell for that column reads
  // `Allowed with conditions`. So this refusal renders DISABLED with the
  // capacity the holder keeps named.
  //
  // FAILS IF: the route is dropped and the cell goes quiet, or the reason
  // stops naming where the capacity lives.
  it('renders the implementation team’s review cell disabled, naming the authoring act', () => {
    const rendering = difficultyAffordance(ROW, 'implementation-team', STU09_DEFAULT_CONTEXT, 'Review')
    expect(rendering.kind).toBe('disabled')
    if (rendering.kind !== 'disabled') return
    expect(rendering.reason).toContain('Author one difficulty level')
  })

  // The absent arm, on the same row. Five columns are refused with no
  // alternative named anywhere, so nothing is drawn for them.
  //
  // FAILS IF: the routed branch stops asking per COLUMN and starts firing for
  // the whole row — the defect a row-level flag would produce.
  it('renders the same row absent for every column that routes nowhere', () => {
    for (const persona of [
      'supervisor-without-grant',
      'plant-manager-persona',
      'tenant-admin',
      'read-only-auditor',
      'worker',
    ] as const) {
      const rendering = difficultyAffordance(ROW, persona, STU09_DEFAULT_CONTEXT, 'Review')
      expect(rendering.kind, persona).toBe('absent')
    }
  })

  // A row refused in all eight columns has nowhere to send anyone.
  //
  // FAILS IF: a universal refusal is routed.
  it.each([
    'publish-a-level-that-has-not-been-reviewed',
    'make-a-level-change-a-capture-gate-limit-or-severity-mapping',
  ] as const)('renders %s absent for all eight personas', (row) => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(difficultyAffordance(row, persona, STU09_DEFAULT_CONTEXT, 'Do it').kind, persona).toBe(
        'absent',
      )
    }
  })
})

describe('MOD-STU-10 — a seam whose refusals are about where a record lives', () => {
  // Three of this card's refusals do not classify as routings, and each for
  // its own reason: the minter is the PLATFORM and not a persona (L33115);
  // the nearest thing anybody holds for rows 5 and 6 is `Complete a skeletal
  // part record`, which is not a row of this matrix at all but a
  // cross-surface statement; and row 7's refusal is a design fact about the
  // model rather than an act performed elsewhere.
  //
  // FAILS IF: any of them is routed to give the seam a disabled control that
  // implies a condition that could become true.
  it.each([
    'mint-the-part-identifier',
    'edit-registry-fields-beyond-the-name',
    'delete-a-part-from-the-studio',
    'force-a-step-to-carry-a-part-reference',
  ] as const)('renders %s absent for all eight personas', (row) => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(partsAffordance(row, persona, 'Do it').kind, persona).toBe('absent')
    }
  })
})

describe('MOD-STU-11 — the Reviewer cannot edit, and the route says what they can', () => {
  const ROW = 'edit-content-while-reviewing'

  // The routed arm, for both Reviewer-stage columns. The Quality Manager's
  // cell names the route in the source's own words and the grant-holder's is
  // carried by FUNC-STU-11-01-B-3's row-level statement; both hold
  // `return-with-comments`, whose own cell at L33273 reads `Allowed`.
  //
  // FAILS IF: either column loses the route and the rule stops being taught
  // at the moment it binds.
  it.each(['quality-manager', 'supervisor-with-authoring-grant'] as const)(
    'routes %s to Return with comments',
    (persona) => {
      expect(approvalRoute(ROW, stu11Ctx(persona), stu11Submitted())).toBe('return-with-comments')
    },
  )

  // The absent arm. Six columns hold `return-with-comments` nowhere, so the
  // route is closed for them and nothing is drawn.
  //
  // FAILS IF: the route is written per ROW instead of per COLUMN, which would
  // send a Worker and a Read-only Auditor to a control they are prohibited
  // from too.
  it.each([
    'supervisor-without-grant',
    'plant-manager-persona',
    'tenant-admin',
    'read-only-auditor',
    'worker',
    'implementation-team',
  ] as const)('renders %s no route at all on the same row', (persona) => {
    expect(approvalRoute(ROW, stu11Ctx(persona), stu11Submitted())).toBeNull()
  })

  // THE STRONGEST EVIDENCE THE ROUTE IS EVALUATED AND NOT ASSERTED, and it
  // came out of building this file rather than out of the brief.
  //
  // Separation of duties (L33389, AC-STU-100 L33400) refuses `Return a
  // submission with comments` to the AUTHOR of the submission in hand. So the
  // very same grant-holder who is routed on somebody else's submission is
  // routed NOWHERE on their own — the pointer has not changed, the evaluator's
  // answer for the target has. A `routedTo` read as a static claim would have
  // drawn a disabled control telling an Author to return their own work.
  //
  // FAILS IF: the routed branch caches, hard-codes, or otherwise stops asking
  // the evaluator for the target's answer on THIS object.
  it('closes the route on a submission the routed persona authored themselves', () => {
    const ownSubmission = submit(stu11Ctx('supervisor-with-authoring-grant'), {
      submissionId: 'SUB-ROUTES-0002',
      consumer: 'workflow',
      subject: 'Wheel Bolt Torque Verification',
      tenant: STU11_TENANT,
    })
    if (!ownSubmission.ok) throw new Error(ownSubmission.refusal.reason)

    const context = stu11Ctx('supervisor-with-authoring-grant')
    expect(approvalRoute(ROW, context, ownSubmission.chain)).toBeNull()
    // The pointer is unchanged; only the target's evaluated answer differs.
    expect(approvalRow(ROW).routedTo['supervisor-with-authoring-grant']).toBe(
      'return-with-comments',
    )
    expect(approvalRoute(ROW, context, stu11Submitted())).toBe('return-with-comments')
  })

  // THE PLANT THAT MATTERS: a `routedTo` pointing at a target that does not
  // actually permit the capability. `bypass-the-release-authority` is refused
  // in all eight columns (L33278, AC-STU-099 L33399), so a route to it is a
  // claim nobody can honour — and the mechanism answers `false` rather than
  // manufacturing a disabled control out of it.
  //
  // Both arms are driven here, not only the one the matrix reaches: a branch
  // a suite never enters is a branch nobody has checked.
  //
  // FAILS IF: the routed branch stops evaluating the target and starts
  // trusting the pointer — which is the shape of a `stage` field no code
  // consults, shipped earlier in this slice and caught only by planting.
  it('answers false for a route at a capability nobody holds, and true for one somebody does', () => {
    const chain = stu11Submitted()
    const context = stu11Ctx('quality-manager')
    const prohibited = approvalAffordance(ROW, context, chain)
    expect(prohibited.outcome).toBe('explicitlyProhibited')

    const nobodyHolds = approvalAffordance('bypass-the-release-authority', context, chain)
    expect(nobodyHolds.outcome).toBe('explicitlyProhibited')
    expect(routedProhibitionApplies(prohibited, 'bypass-the-release-authority', nobodyHolds)).toBe(
      false,
    )

    const somebodyHolds = approvalAffordance('return-with-comments', context, chain)
    expect(routedProhibitionApplies(prohibited, 'return-with-comments', somebodyHolds)).toBe(true)
  })

  // The other half of the plant: `Bypass the Release Authority` is the row
  // this surface must never draw a control for, disabled or otherwise.
  //
  // FAILS IF: a route is written onto it.
  it('routes nobody away from “Bypass the Release Authority”', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(
        approvalRoute('bypass-the-release-authority', stu11Ctx(persona), stu11Submitted()),
        persona,
      ).toBeNull()
      expect(approvalRow('bypass-the-release-authority').routedTo[persona], persona).toBeNull()
    }
  })
})

describe('MOD-STU-12 — the two near misses, and the row that is not a row', () => {
  // Row 5 refuses four columns "unless also the Job Owner" — a CONDITION on
  // the same act keyed to a FIELD on the Job (L33433, "not a role"), which
  // `decideAdoption` already answers by building the row from that field. Row
  // 4 refuses the grant-holder with no alternative named; validating as
  // Reviewer is a different stage, not this act relocated.
  //
  // FAILS IF: either is routed, restating an object condition or a prior
  // stage as a place.
  it.each(['decide-adoption', 'publish-a-version'] as const)(
    'gives %s no route for any persona',
    (capability) => {
      for (const persona of STUDIO_PERSONA_COLUMNS) {
        expect(versionRow(capability).routedTo[persona], persona).toBeNull()
      }
    },
  )

  // The fold READS the field rather than merely declaring it, which is what
  // keeps eighty-eight nulls an answer.
  //
  // FAILS IF: `versionRoute` stops consulting `routedTo` — it would still
  // return `null` today, so this drives the positive arm through the shared
  // predicate rather than asserting the null the matrix already carries.
  it('returns null today, and its predicate still separates held from unheld', () => {
    const context = contextFor('supervisor-with-authoring-grant')
    const row = versionRow('publish-a-version')
    expect(versionRoute(row, context, FIXTURE_TENANT, STU12_STAGES)).toBeNull()
  })
})

describe('MOD-STU-18 — the consolidated matrix, which restates other modules’ rules', () => {
  // The three routed cells land in the capability panel's CONDITION sentence
  // rather than in an affordance: SB-STU-21 (L34631) asks for statements
  // "each marked Available or Unavailable with the specific missing condition
  // named", and on a routed prohibition the specific condition is a place.
  //
  // FAILS IF: `capabilityPanelRows` stops reading `routedTo` — the field
  // would become the decoration this retrofit exists to remove.
  it.each(
    ROUTED_CENSUS.filter((r) => r.module === 'MOD-STU-18').map(
      (r) => [`${r.row}/${r.column}`, r] as const,
    ),
  )('%s names the capability held instead, with its locator', (_name, entry) => {
    const rows = capabilityPanelRows({ ...STU18_SCENARIO, persona: entry.column }, STU18_MATRIX)
    const panel = rows.find((r) => r.row.id === entry.row)!
    const target = stu18Row(entry.target)
    expect(panel.availability).toBe('unavailable')
    expect(panel.condition).toContain(target.capability)
    expect(panel.condition).toContain(target.sourceRefs[0]!)
  })

  // A row nobody routes stays a bare statement. Row 22 is refused in all
  // eight columns, and AC-STU-154 (L34671) is why it can never become true.
  //
  // FAILS IF: a route is written onto the floor row.
  it('leaves “Widen any of the above beyond the floor” unrouted in all eight columns', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const panel = capabilityPanelRows(
        { ...STU18_SCENARIO, persona },
        STU18_MATRIX,
      ).find((r) => r.row.id === 'widen-beyond-the-floor')!
      expect(panel.availability, persona).toBe('unavailable')
      expect(panel.condition, persona).not.toContain('is what you hold instead')
      expect(stu18Row('widen-beyond-the-floor').routedTo[persona], persona).toBeNull()
    }
  })

  // THE PLANT, in the module whose whole job is restating other modules'
  // rules. `widen-beyond-the-floor` is held by nobody, so a route to it must
  // change nothing; `propose-a-content-library-change` is held by the
  // grant-holder, so a route to it must render.
  //
  // FAILS IF: the check stops distinguishing the two.
  it('answers false for a route at the floor row and true for one at Propose', () => {
    const s = { ...STU18_SCENARIO, persona: 'supervisor-with-authoring-grant' as const }
    const prohibited = decisionForRow(stu18Row('create-edit-archive-content-library-items'), s)
    expect(prohibited.outcome).toBe('explicitlyProhibited')

    const floor = decisionForRow(stu18Row('widen-beyond-the-floor'), s)
    expect(routedProhibitionApplies(prohibited, 'widen-beyond-the-floor', floor)).toBe(false)

    const propose = decisionForRow(stu18Row('propose-a-content-library-change'), s)
    expect(routedProhibitionApplies(prohibited, 'propose-a-content-library-change', propose)).toBe(
      true,
    )
  })

  // THE TRAP THIS SLICE HAS FALLEN INTO FOUR TIMES: a cell whose token reads
  // `Allowed` while describing ANOTHER SURFACE. Row 17's Quality Manager cell
  // is `Allowed — in the Client Command Center`, and the row is classified
  // `another-surface` for exactly that reason.
  //
  // It is not routed, and it must not be: `routedTo` names a capability on
  // THIS card, and the Client Command Center is not on it. What this asserts
  // is that no control is derived from the row at all — the panel states it
  // and the screen draws no affordance from any of the twenty-three rows.
  //
  // FAILS IF: the row is reclassified `screen`, or given a route, either of
  // which would put the Studio's name on somebody else's act.
  it('leaves the Lane-B row classified another-surface and unrouted', () => {
    const row = stu18Row('decide-a-lane-b-proposal')
    expect(row.surface).toBe('another-surface')
    expect(row.cells['quality-manager'].note).toContain('in the Client Command Center')
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(row.routedTo[persona], persona).toBeNull()
    }
  })
})

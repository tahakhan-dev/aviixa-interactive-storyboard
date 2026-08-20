import type { PermissionOutcome } from '@/policy/decision'
import {
  STUDIO_PERSONA_COLUMNS,
  type StudioMatrixCell,
  type StudioMatrixRow,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-01` — Charter and Position. The two matrices this module owns.
 *
 * WHAT THIS FILE IS AND IS NOT. It is a transcription of two tables of the
 * frozen source, plus the two per-cell answers the eight-column vocabulary
 * demands and the source's own seven-actor table does not state. It is NOT a
 * second evaluator: the row goes to `evaluateStudioAccess` (task 1) and the
 * verdict comes back from there. `StudioMatrixRow` and `StudioMatrixCell` are
 * task 1's types and are extended here, never redefined.
 *
 * THE SHAPE PROBLEM, STATED ONCE. The source's table at L31571-L31579 is the
 * only module matrix on this surface written ACTOR-PER-ROW; every other is
 * action-per-row, and the reach generator, the evaluator and the eight persona
 * columns all assume action-per-row. So it is transposed here: four action
 * rows, eight persona cells each. Transposition loses nothing — every cell of
 * the source table survives, cell for cell — but it does raise two questions
 * the source's own table never answers, and both are answered explicitly and
 * marked, never filled in silently. See `derivation` below.
 */

/* ==================================================================== *
 * THE FOUR ACTIONS — the source table's four column headers (L31571).
 * ==================================================================== */

export type CharterAction =
  | 'see-charter-statements'
  | 'change-the-boundary'
  | 'author-an-atom'
  | 'enable-a-capability'

export const CHARTER_ACTIONS = [
  'see-charter-statements',
  'change-the-boundary',
  'author-an-atom',
  'enable-a-capability',
] as const satisfies readonly CharterAction[]

type MissingFromCharterActions = Exclude<CharterAction, (typeof CHARTER_ACTIONS)[number]>
const _charterActionsExhaustive: MissingFromCharterActions extends never ? true : never = true
void _charterActionsExhaustive

/** The header cell each action was transposed from, verbatim (L31571). */
export const CHARTER_ACTION_HEADINGS = {
  'see-charter-statements': 'See the charter statements',
  'change-the-boundary': 'Change the boundary',
  'author-an-atom': 'Author an atom',
  'enable-a-capability': 'Enable a capability within entitlement',
} as const satisfies Readonly<Record<CharterAction, string>>

/* ==================================================================== *
 * THE ROW TYPE.
 * ==================================================================== */

/**
 * One transposed row. `StudioMatrixRow` is task 1's and carries the cells;
 * this adds only what the surface needs beyond it.
 *
 * `derivation` IS PER-CELL, NOT PER-ROW, for the same reason `requiredGrant`
 * and `requiredTiers` are (task 1, §5.1): a row is not uniform across its
 * columns. Six of the eight columns are transcribed from the source's own
 * table and carry `null`. Two — the Plant Manager persona and the
 * implementation team — are not actors in the source's seven-row table at
 * all, and each carries the sentence and the locator its answer was read
 * from. An unmarked answer in either column would read as a transcription of
 * a cell nobody wrote.
 */
export interface CharterMatrixRow extends StudioMatrixRow {
  readonly action: CharterAction
  /**
   * `screen` for the two the Studio actually renders. `another-surface` for
   * the two define-class rows: they are refused for every tenant actor and
   * held by the Platform Engineer in the platform console, so counting them
   * as screen rows would offer this module's route on a capability no Studio
   * screen carries.
   */
  readonly surface: StudioMatrixRowSurface
  /**
   * PER COLUMN, never per row. Task 11's mechanism (`MOD-STU-07`), retrofitted
   * here. Where a prohibited cell's own words name an alternative THIS persona
   * holds, this is that capability's id; `null` is the answer for a categorical
   * prohibition, and it is written on every column rather than omitted.
   *
   * The pointer is CHECKED, never asserted: the fold asks
   * `routedProhibitionApplies` for the routed row's own decision, and a route
   * whose target does not permit this persona collapses back to ABSENT.
   */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, CharterAction | null>>
  readonly derivation: Readonly<Record<StudioPersonaColumn, string | null>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

/* -------------------------------------------------------------------- *
 * The two derived columns, and where each answer was read.
 * -------------------------------------------------------------------- */

/**
 * `DEC-ROLE-001` (L34522): this blueprint "treats Plant Manager as a persona
 * whose Studio access is delivered by a Supervisor role without the authoring
 * grant, which produces exactly the access §5.18 describes". So the persona's
 * cell is the without-grant column's cell — not a guess, a stated delivery
 * mechanism. Where the consolidated matrix states the Plant Manager column
 * directly, that locator is cited instead and the two agree.
 */
const PLANT_MANAGER_VIA_SUPERVISOR =
  'MOD-STU-01’s table names no Plant Manager column. DEC-ROLE-001 (L34522) treats Plant Manager as a persona ' +
  'whose Studio access is delivered by a Supervisor role without the authoring grant, so this cell is that ' +
  'column’s cell. Derived Clarification.'

const PLANT_MANAGER_DIRECT =
  'MOD-STU-01’s table names no Plant Manager column, but the consolidated matrix states this persona’s cell ' +
  'directly: “Enable or disable an atomic capability | … | Plant Manager persona | Explicitly prohibited” ' +
  '(L34555). Transcribed from there, and it agrees with DEC-ROLE-001’s delivery via a Supervisor without the ' +
  'grant (L34522). Derived Clarification.'

const IMPLEMENTATION_TEAM_READS =
  'MOD-STU-01’s table names no implementation-team column. L34520 provisions the team “a provisioned, temporary ' +
  'authoring capacity during onboarding — author and submit only, fully audited”, and the consolidated matrix ' +
  'admits it to the Studio “Allowed with conditions — onboarding only” (L34541). A capacity that may author ' +
  'reads the charter that bounds it, on the same read-only footing as every other admitted actor. ' +
  'Derived Clarification.'

const UNIVERSAL_REFUSAL =
  'MOD-STU-01’s table names no column for this persona, and none is needed: FUNC-STU-01-01-C-1 (L31599) states ' +
  'the refusal as universal — “Roles allowed: none — this is a universal refusal. Roles prohibited: every tenant ' +
  'role and every platform role acting through a tenant surface.” Corroborated by L34010 and L34562, where every ' +
  'tenant column reads Explicitly prohibited. Derived Clarification.'

const IMPLEMENTATION_TEAM_NO_ENABLEMENT =
  'MOD-STU-01’s table names no implementation-team column, but the consolidated matrix states it directly: ' +
  '“Enable or disable an atomic capability | … | `GRANT-STU-IMPL` | Explicitly prohibited” (L34555). Transcribed ' +
  'from there. Derived Clarification.'

/* ==================================================================== *
 * THE MATRIX — L31571-L31579, transposed. Seven data rows in, four out.
 * ==================================================================== */

/**
 * Every column answers `null` — this row routes nobody anywhere. Written
 * down rather than left off: a cell that omits the field and a cell that
 * says "no route" read identically at a glance, and only one is an answer.
 */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, CharterAction | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

export const MOD_STU_01_MATRIX = [
  {
    action: 'see-charter-statements',
    capability: 'See the charter statements',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L31571', 'L31573', 'L31574', 'L31575', 'L31576', 'L31577', 'L31578'],
    cells: {
      'quality-manager': cell('readOnly', 'Read-only'),
      'supervisor-with-authoring-grant': cell('readOnly', 'Read-only'),
      'supervisor-without-grant': cell('readOnly', 'Read-only'),
      'plant-manager-persona': cell('readOnly', 'Read-only'),
      'tenant-admin': cell('readOnly', 'Read-only'),
      'read-only-auditor': cell(
        'clientDecisionRequired',
        'Client Decision Required — `DEC-AUDSTU-001`',
        'DEC-AUDSTU-001',
      ),
      worker: cell('explicitlyProhibited', 'Explicitly prohibited'),
      'implementation-team': cell('readOnly', 'Read-only'),
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': PLANT_MANAGER_VIA_SUPERVISOR,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': IMPLEMENTATION_TEAM_READS,
    },
  },
  {
    action: 'change-the-boundary',
    capability: 'Change the boundary',
    // Held by the Platform Engineer as "engineering change plus Admin
    // approval" (L31579) — an act of the platform console, not of a Studio
    // screen. See CHARTER_PLATFORM_ENGINEER_CELLS.
    surface: 'another-surface',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L31571', 'L31573', 'L31574', 'L31575', 'L31576', 'L31577', 'L31578', 'L31599'],
    cells: Object.fromEntries(
      STUDIO_PERSONA_COLUMNS.map((c) => [c, cell('explicitlyProhibited', 'Explicitly prohibited')]),
    ) as Readonly<Record<StudioPersonaColumn, StudioMatrixCell>>,
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': UNIVERSAL_REFUSAL,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': UNIVERSAL_REFUSAL,
    },
  },
  {
    action: 'author-an-atom',
    capability: 'Author an atom',
    surface: 'another-surface',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L31571', 'L31573', 'L31574', 'L31575', 'L31576', 'L31577', 'L31578', 'L34010'],
    cells: Object.fromEntries(
      STUDIO_PERSONA_COLUMNS.map((c) => [c, cell('explicitlyProhibited', 'Explicitly prohibited')]),
    ) as Readonly<Record<StudioPersonaColumn, StudioMatrixCell>>,
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': UNIVERSAL_REFUSAL,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': UNIVERSAL_REFUSAL,
    },
  },
  {
    action: 'enable-a-capability',
    capability: 'Enable a capability within entitlement',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L31571', 'L31573', 'L31574', 'L31575', 'L31576', 'L31577', 'L31578', 'L34555'],
    cells: {
      // TRANSCRIBED, AND CONTRADICTED ELSEWHERE IN THE SOURCE. See
      // ENABLEMENT_AUTHORITY_READINGS: this cell is one of three readings,
      // and it is the only one that gives anybody the act.
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — within entitlement, audited',
      ),
      'supervisor-with-authoring-grant': cell(
        'clientDecisionRequired',
        'Client Decision Required — the Statement of Work names an authorised user without naming the role; see `DEC-CAPAUTH-001` in section 20.2.15',
        'DEC-CAPAUTH-001',
      ),
      'supervisor-without-grant': cell('explicitlyProhibited', 'Explicitly prohibited'),
      'plant-manager-persona': cell('explicitlyProhibited', 'Explicitly prohibited'),
      'tenant-admin': cell(
        'clientDecisionRequired',
        'Client Decision Required — `DEC-CAPAUTH-001`',
        'DEC-CAPAUTH-001',
      ),
      'read-only-auditor': cell('explicitlyProhibited', 'Explicitly prohibited'),
      worker: cell('explicitlyProhibited', 'Explicitly prohibited'),
      'implementation-team': cell('explicitlyProhibited', 'Explicitly prohibited'),
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': PLANT_MANAGER_DIRECT,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': IMPLEMENTATION_TEAM_NO_ENABLEMENT,
    },
  },
] as const satisfies readonly CharterMatrixRow[]

/** Total over the four. Never throws; the exhaustiveness check above is why. */
export function charterRow(action: CharterAction): CharterMatrixRow {
  const found = MOD_STU_01_MATRIX.find((r) => r.action === action)
  // Unreachable for a well-typed caller: every CharterAction has a row, and
  // a fifth member of the union fails to compile at _charterActionsExhaustive.
  if (found === undefined) throw new Error(`No MOD-STU-01 matrix row for ${action}`)
  return found
}

/* ==================================================================== *
 * THE PLATFORM ENGINEER ROW — the source's seventh actor (L31579).
 *
 * `ROLE-PLAT-ENG` is NOT one of the eight Studio persona columns: those
 * eight are the tenant surface's, and the consolidated matrix (L34539) does
 * not head a Platform Engineer column at all. Folding this row into one of
 * the eight would assert a tenant-side control the source places on the
 * platform console. Dropping it would lose a row of the source's own table.
 * So it is carried here, verbatim, and rendered as a cross-surface statement.
 * ==================================================================== */

export interface CharterPlatformEngineerCell {
  readonly action: CharterAction
  readonly note: string
  readonly sourceRef: string
}

export const CHARTER_PLATFORM_ENGINEER_CELLS = [
  {
    action: 'see-charter-statements',
    note: 'Not applicable — the charter is a tenant-surface boundary, expressed platform-side as registry and entitlement controls',
    sourceRef: 'L31579',
  },
  {
    action: 'change-the-boundary',
    note: 'Allowed with conditions — engineering change plus Admin approval',
    sourceRef: 'L31579',
  },
  {
    action: 'author-an-atom',
    note: 'Allowed with conditions — handler engineered, evaluation scenarios written, evaluation gate passed',
    sourceRef: 'L31579',
  },
  {
    action: 'enable-a-capability',
    note: 'Allowed with conditions — sets the entitlement rather than the enablement',
    sourceRef: 'L31579',
  },
] as const satisfies readonly CharterPlatformEngineerCell[]

/* ==================================================================== *
 * THE ENABLEMENT-AUTHORITY CONFLICT.
 *
 * Three places in the frozen source answer "may the Quality Manager enable a
 * capability", and they do not agree. Not settled here, and not tidied away:
 * all three render, with their locators, beside the control they govern.
 * ==================================================================== */

export interface EnablementAuthorityReading {
  readonly text: string
  readonly locator: string
}

export const ENABLEMENT_AUTHORITY_READINGS = [
  {
    text: 'MOD-STU-01’s own permission table gives the Quality Manager “Allowed with conditions — within entitlement, audited”, which would make one persona hold the act outright.',
    locator: 'L31573',
  },
  {
    text: 'MOD-STU-15’s first matrix row reads “Client Decision Required — DEC-CAPAUTH-001” in all four of its tenant columns, and the consolidated matrix’s enable-or-disable row reads it in three of eight, the Quality Manager’s among them.',
    locator: 'L34009 · L34555',
  },
  {
    text: 'This module card’s own Source status line classifies the question rather than answering it: “Capability enablement authority: Client Decision Required — DEC-CAPAUTH-001, newly proposed in section 20.2.15.”',
    locator: 'L31678',
  },
] as const satisfies readonly EnablementAuthorityReading[]

/**
 * The working position, rendered wherever the readings are. Two of the three
 * readings — including this module card's own Source status line — say the
 * authority is undecided, so the control is disabled for everyone and names
 * the decision. Building an operator for the Quality Manager alone would
 * pre-empt `DEC-CAPAUTH-001` in the direction one cell of three supports.
 */
export const ENABLEMENT_AUTHORITY_POSITION =
  'The enablement control is rendered disabled for every persona, with DEC-CAPAUTH-001 named, over a seeded ' +
  'enablement state so the nine configuration sections still render. A client-delegated choice under APP-012, ' +
  'not a position the source settled.'

/**
 * THE ONE PLACE THE CONFLICT IS RESOLVED, and the row every caller evaluates
 * against.
 *
 * `MOD_STU_01_MATRIX` above stays a faithful transcription of L31571-L31579 —
 * it is a record of the source, and editing it to fit a ruling would destroy
 * the evidence. The ruling is applied here instead, once: a cell that would
 * hand the act to somebody while two other statements of the same question
 * say the authority is undecided becomes `Client Decision Required`, carrying
 * its original wording forward inside the note.
 *
 * BOTH THE SCREEN AND THE SERVICE READ THIS. If the screen disabled the
 * control while the service kept the permitting cell, a crafted request would
 * succeed exactly where the screen refuses — which is the failure L31668
 * exists to prevent, and the reason this is a function rather than a second
 * exported array.
 *
 * It is deliberately NOT a second exported matrix: `scripts/build-stu-module-
 * reach.mjs` finds a module's matrix by shape, and two qualifying arrays in
 * one directory make it refuse to write.
 */
export function enablementRow(): CharterMatrixRow {
  const transcribed = charterRow('enable-a-capability')
  const cells = Object.fromEntries(
    STUDIO_PERSONA_COLUMNS.map((column) => {
      const source = transcribed.cells[column]
      if (source.outcome !== 'allowedWithConditions') return [column, source]
      return [
        column,
        {
          ...source,
          outcome: 'clientDecisionRequired' as const,
          note:
            `${source.note} — but MOD-STU-15 row 1 (L34009), the consolidated matrix’s enable-or-disable row ` +
            '(L34555) and this module card’s own Source status line (L31678) all read this authority as ' +
            'Client Decision Required under DEC-CAPAUTH-001. Two of the three readings say nobody holds it, so ' +
            'the act is not handed to anybody while the decision is open.',
          openDecision: 'DEC-CAPAUTH-001',
        },
      ]
    }),
  ) as Readonly<Record<StudioPersonaColumn, StudioMatrixCell>>

  return { ...transcribed, cells }
}

/* ==================================================================== *
 * THE TIER AUTHORITY MATRIX — L30757-L30765.
 *
 * This one governs every module on the surface. It is quoted ONCE, here,
 * and every other module reads it through this export rather than
 * transcribing it a second time.
 * ==================================================================== */

export type AuthorityTier =
  | 'tier-1-console'
  | 'tier-2-studio'
  | 'tier-3-command-center'
  | 'floor-frontline'

export const AUTHORITY_TIERS = [
  'tier-1-console',
  'tier-2-studio',
  'tier-3-command-center',
  'floor-frontline',
] as const satisfies readonly AuthorityTier[]

type MissingFromTiers = Exclude<AuthorityTier, (typeof AUTHORITY_TIERS)[number]>
const _tiersExhaustive: MissingFromTiers extends never ? true : never = true
void _tiersExhaustive

/** The column headings, verbatim (L30757). */
export const AUTHORITY_TIER_HEADINGS = {
  'tier-1-console': 'Tier 1: Super Admin platform console',
  'tier-2-studio': 'Tier 2: Standards and Operations Studio',
  'tier-3-command-center': 'Tier 3: Client Command Center',
  'floor-frontline': 'Floor: Frontline Worker Application',
} as const satisfies Readonly<Record<AuthorityTier, string>>

export type TierAction =
  | 'author-an-atomic-capability'
  | 'register-an-atomic-capability'
  | 'set-a-tenants-capability-entitlement'
  | 'enable-a-capability-within-entitlement'
  | 'configure-a-capability-per-screen'
  | 'compose-a-reasoning-agent-from-capabilities'
  | 'execute-a-configured-capability-at-run-time'

export const TIER_ACTIONS = [
  'author-an-atomic-capability',
  'register-an-atomic-capability',
  'set-a-tenants-capability-entitlement',
  'enable-a-capability-within-entitlement',
  'configure-a-capability-per-screen',
  'compose-a-reasoning-agent-from-capabilities',
  'execute-a-configured-capability-at-run-time',
] as const satisfies readonly TierAction[]

type MissingFromTierActions = Exclude<TierAction, (typeof TIER_ACTIONS)[number]>
const _tierActionsExhaustive: MissingFromTierActions extends never ? true : never = true
void _tierActionsExhaustive

/**
 * Four of slice 3's nine outcomes, derived with `Extract` so a rename over
 * there fails to compile here rather than splitting the vocabulary. This
 * table is the one place on the surface `notApplicable` is a real cell value:
 * three of its cells state that the act simply is not an act of that tier.
 */
export type TierCellOutcome = Extract<
  PermissionOutcome,
  'allowed' | 'allowedWithConditions' | 'explicitlyProhibited' | 'notApplicable'
>

export interface TierAuthorityCell {
  readonly outcome: TierCellOutcome
  /** The table's own cell text, verbatim. */
  readonly note: string
}

export interface TierAuthorityRow {
  readonly action: TierAction
  /** The row's own left-hand label, verbatim. */
  readonly heading: string
  readonly cells: Readonly<Record<AuthorityTier, TierAuthorityCell>>
  readonly sourceRef: string
}

const PROHIBITED: TierAuthorityCell = {
  outcome: 'explicitlyProhibited',
  note: 'Explicitly prohibited',
}

export const TIER_AUTHORITY_MATRIX = [
  {
    action: 'author-an-atomic-capability',
    heading: 'Author an atomic capability',
    sourceRef: 'L30759',
    cells: {
      'tier-1-console': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — engineering change, evaluation gate, maker-checker approval',
      },
      'tier-2-studio': PROHIBITED,
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': PROHIBITED,
    },
  },
  {
    action: 'register-an-atomic-capability',
    heading: 'Register an atomic capability',
    sourceRef: 'L30760',
    cells: {
      'tier-1-console': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — Platform Engineer submits, Admin approves',
      },
      'tier-2-studio': PROHIBITED,
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': PROHIBITED,
    },
  },
  {
    action: 'set-a-tenants-capability-entitlement',
    heading: 'Set a tenant’s capability entitlement',
    sourceRef: 'L30761',
    cells: {
      'tier-1-console': { outcome: 'allowed', note: 'Allowed' },
      'tier-2-studio': PROHIBITED,
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': PROHIBITED,
    },
  },
  {
    action: 'enable-a-capability-within-entitlement',
    heading: 'Enable a capability within entitlement',
    sourceRef: 'L30762',
    cells: {
      'tier-1-console': { outcome: 'allowed', note: 'Allowed' },
      'tier-2-studio': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — authorised Studio user, within entitlement',
      },
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': PROHIBITED,
    },
  },
  {
    action: 'configure-a-capability-per-screen',
    heading: 'Configure a capability per screen',
    sourceRef: 'L30763',
    cells: {
      'tier-1-console': {
        outcome: 'notApplicable',
        note: 'Not applicable — the console does not hold tenant Workflow content',
      },
      'tier-2-studio': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — authoring grant required',
      },
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': PROHIBITED,
    },
  },
  {
    action: 'compose-a-reasoning-agent-from-capabilities',
    heading: 'Compose a reasoning agent from capabilities',
    sourceRef: 'L30764',
    cells: {
      'tier-1-console': {
        outcome: 'notApplicable',
        note: 'Not applicable — composition is a tenant act performed in the Studio',
      },
      'tier-2-studio': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — Agent Author capability, Growth or Enterprise tier',
      },
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': PROHIBITED,
    },
  },
  {
    action: 'execute-a-configured-capability-at-run-time',
    heading: 'Execute a configured capability at run time',
    sourceRef: 'L30765',
    cells: {
      'tier-1-console': {
        outcome: 'notApplicable',
        note: 'Not applicable — execution happens on the device and in the orchestrator',
      },
      'tier-2-studio': PROHIBITED,
      'tier-3-command-center': PROHIBITED,
      'floor-frontline': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — within the pinned work package',
      },
    },
  },
] as const satisfies readonly TierAuthorityRow[]

/** Total over the seven actions and four tiers. */
export function tierAuthority(action: TierAction, tier: AuthorityTier): TierAuthorityCell {
  const row = TIER_AUTHORITY_MATRIX.find((r) => r.action === action)
  // Unreachable: _tierActionsExhaustive proves every action has a row.
  if (row === undefined) throw new Error(`No tier-authority row for ${action}`)
  return row.cells[tier]
}

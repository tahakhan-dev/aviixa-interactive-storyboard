import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import {
  ARMING_PANEL_HEADING,
  ARMING_PANEL_STATEMENTS,
} from '@/studio/modules/stu-05/sections'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  affordanceFor,
  studioGrantsFor,
  studioIdentityFor,
  type CapabilityAffordance,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import {
  STU_02_CROSS_SURFACE,
  STU_02_MATRIX,
  stu02Row,
  type Stu02CrossSurfaceStatement,
  type Stu02MatrixRow,
  type Stu02RowId,
} from './matrix'

/**
 * `MOD-STU-02`'s rendering rule.
 *
 * ### THE ONE RULE THIS FILE EXISTS TO HOLD
 *
 * **An `another-surface` row never becomes an enabled Studio control,
 * whatever its token reads.** Row 7's Quality Manager cell reads `Allowed
 * with conditions` and row 7 is still not a control here, because the cell's
 * own words put the act in the tenant administration area. The check is made
 * ONCE, on the row's `surface` classification, at the single place both
 * branches converge — `agentConfigurationControls` filters, and
 * `crossSurfaceStatements` picks up exactly what it dropped, so a row can
 * never fall between the two or appear in both.
 *
 * The covering test asserts this STRUCTURALLY — over every row's `surface`
 * against the control list — rather than by naming row 7. A gate keyed on
 * the id of the row it forbids passes the moment somebody adds a second
 * cross-surface row, which is the likeliest way the defect returns.
 *
 * ### THERE IS NO WRITE ON THIS ROUTE
 *
 * Rows 1 to 6 are `Allowed` for the Quality Manager and the grant holder,
 * and every one of them is authored somewhere else: L31852 names
 * `MOD-STU-05`, `MOD-STU-07` and `MOD-STU-13` as the modules that supply
 * them. So each control carries `authoredIn` — the section and module that
 * owns the write — and this module exports no write function at all. A
 * second `setTiming` here would be a second spelling of `MOD-STU-05`'s, and
 * the two would drift.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the components it feeds only draw.
 */

export type Stu02Scenario = Stu18Scenario

export const STU02_DEFAULT_CONTEXT: Stu02Scenario = SEEDED_SCENARIO

export function stu02Scenario(over: Partial<Stu02Scenario> = {}): Stu02Scenario {
  return { ...STU02_DEFAULT_CONTEXT, ...over }
}

/** THE ONE ACCESS CALL THIS MODULE MAKES — per control, over a matrix row. */
export function stu02Decision(
  rowId: Stu02RowId,
  persona: StudioPersonaColumn,
  ctx: Stu02Scenario = STU02_DEFAULT_CONTEXT,
): StudioAccessDecision {
  const s: Stu02Scenario = { ...ctx, persona }
  return evaluateStudioAccess({
    row: stu02Row(rowId),
    identity: studioIdentityFor(persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // No row of this card occupies an approval stage. MOD-STU-11 owns the chain.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
}

/* ==================================================================== *
 * THE CONTROLS THIS SCREEN OFFERS.
 * ==================================================================== */

const CONTROL_LABELS = {
  'set-a-screens-timing-expectation-and-coaching-trigger':
    'Set the timing expectation and coaching trigger',
  'designate-a-screens-curated-coaching-defaults': 'Designate the curated coaching defaults',
  'map-a-band-to-a-severity-level': 'Map a band to a severity level',
  'select-the-containment-checklist-for-a-band': 'Select the containment checklist',
  'select-or-override-the-escalation-routing-template': 'Select the escalation routing template',
  'set-the-repeated-coaching-alert-threshold-per-workflow':
    'Set the repeated-coaching alert threshold',
  'change-the-shift-handoff-agents-run-time': 'Change the Shift Handoff Agent’s run time',
  'change-an-agents-own-reasoning-logic': 'Change an agent’s own reasoning logic',
  'release-a-severity-1-hold-from-the-studio': 'Release a Severity 1 hold',
} as const satisfies Readonly<Record<Stu02RowId, string>>

/**
 * WHERE THE WRITE ACTUALLY LIVES, per row. `null` on the one row nobody
 * anywhere holds — and that is the honest answer rather than an omission,
 * because there is no section that authors an agent's own reasoning logic.
 */
const AUTHORED_IN = {
  'set-a-screens-timing-expectation-and-coaching-trigger':
    'Section 3, Timing — MOD-STU-05’s configuration panel',
  'designate-a-screens-curated-coaching-defaults':
    'Section 6, Coaching content — MOD-STU-05, over MOD-STU-07’s Coaching Corpus',
  'map-a-band-to-a-severity-level':
    'Section 7, Deviation rules and severity mapping — MOD-STU-05',
  'select-the-containment-checklist-for-a-band':
    'Section 7, by pointer into MOD-STU-07’s Containment Checklist Library',
  'select-or-override-the-escalation-routing-template':
    'Section 7, by pointer into MOD-STU-07’s Escalation Routing Templates',
  'set-the-repeated-coaching-alert-threshold-per-workflow':
    'The Workflow settings of MOD-STU-04, as a per-Workflow override of the tenant default',
  'change-an-agents-own-reasoning-logic': null,
} as const satisfies Readonly<Partial<Record<Stu02RowId, string | null>>>

export interface AgentConfigurationControl {
  readonly id: Stu02RowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  /**
   * The section and module that owns the write, or `null` where no module
   * anywhere authors it. NEVER a handler bound in this module: this module
   * authors nothing, and a control here that appeared to write would be the
   * second spelling of somebody else's write.
   */
  readonly authoredIn: string | null
  readonly sourceRefs: readonly string[]
}

/**
 * The rows this screen draws as capabilities of its OWN surface — every
 * `screen` row of the matrix, and only those.
 *
 * ROWS 5 AND 6 OF THE MATRIX ARE NOT SPECIAL-CASED OUT. Row 8 is refused in
 * all eight columns and it is still here, rendering as an ABSENCE with the
 * rule stated, so the list is the same length for every persona and
 * `AC-STU-155`'s "shown with its reason rather than hidden" holds.
 */
export function agentConfigurationControls(
  s: Stu02Scenario,
  rows: readonly Stu02MatrixRow[] = STU_02_MATRIX,
): readonly AgentConfigurationControl[] {
  return rows
    .filter((row) => row.surface === 'screen')
    .map((row) => {
      const decision = stu02Decision(row.id, s.persona, s)
      const authoredIn: string | null =
        row.id in AUTHORED_IN
          ? (AUTHORED_IN as Readonly<Record<string, string | null>>)[row.id] ?? null
          : null
      return {
        id: row.id,
        label: CONTROL_LABELS[row.id],
        affordance: affordanceFor(CONTROL_LABELS[row.id], decision),
        authoredIn,
        sourceRefs: row.sourceRefs,
      }
    })
}

/* ==================================================================== *
 * THE CROSS-SURFACE STATEMENTS — the complement of the control list.
 * ==================================================================== */

export interface CrossSurfaceReading {
  readonly row: Stu02MatrixRow
  readonly statement: Stu02CrossSurfaceStatement
  readonly label: string
  /**
   * Always `false`. Not a field anybody sets: the type is the literal, so a
   * change that made an `another-surface` row editable here fails to compile
   * rather than shipping behind a green suite.
   */
  readonly editableHere: false
}

/**
 * Exactly the rows `agentConfigurationControls` dropped. Derived from the
 * SAME classification, so the two lists partition the matrix and neither a
 * gap nor an overlap is possible.
 */
export function crossSurfaceStatements(
  rows: readonly Stu02MatrixRow[] = STU_02_MATRIX,
): readonly CrossSurfaceReading[] {
  return rows
    .filter((row) => row.surface !== 'screen')
    .map((row) => {
      const statement = STU_02_CROSS_SURFACE.find((c) => c.rowId === row.id)
      if (statement === undefined) {
        throw new Error(
          `MOD-STU-02: row "${row.id}" is classified ${row.surface} but STU_02_CROSS_SURFACE ` +
            'carries no statement for it. A row taken off the control list without a statement ' +
            'to replace it is a capability that has gone quiet, which is the one outcome ' +
            'AC-STU-155 forbids.',
        )
      }
      return { row, statement, label: CONTROL_LABELS[row.id], editableHere: false }
    })
}

/* ==================================================================== *
 * C10 — THE READ-ONLY CROSS-REFERENCE TO THE ARMING CONFIRMATION.
 * ==================================================================== */

/**
 * `SB-STU-05` (L31814) is the severity-arming confirmation panel, and it
 * belongs to `MOD-STU-05`'s Section 7. This module CROSS-REFERENCES it and
 * does not implement it: the heading and the four statements are imported
 * from where they are authored, never retyped, so the two can never disagree.
 *
 * `DEC-STUXREF-001` (D23) rides with it: §5.2.2 cites "(5.5.9)" for the
 * place the Studio surfaces the arming consequence, and §5.5.9 is Tool and
 * Equipment. The behaviour is at §5.5.8, Deviation rules and severity
 * mapping. The off-by-one matters because downstream traceability keyed on
 * the cited number would point at the wrong configuration section.
 */
export interface ArmingCrossReference {
  readonly heading: string
  readonly statements: readonly string[]
  readonly implementedBy: string
  readonly citedSection: string
  readonly actualSection: string
  readonly openDecision: 'D23'
  readonly readOnlyHere: true
  readonly sourceRefs: readonly string[]
}

export const ARMING_CROSS_REFERENCE: ArmingCrossReference = {
  heading: ARMING_PANEL_HEADING,
  statements: [...ARMING_PANEL_STATEMENTS],
  implementedBy:
    'MOD-STU-05, Section 7 — Deviation rules and severity mapping. This screen shows the panel’s ' +
    'own words as a read; the confirmation is taken where the band is mapped, and is recorded with ' +
    'the authored band.',
  citedSection: '§5.5.9, Tool and equipment — the cited section, and the wrong one',
  actualSection: '§5.5.8, Deviation rules and severity mapping — where the behaviour is stated',
  openDecision: 'D23',
  readOnlyHere: true,
  sourceRefs: ['L31814', 'L31869', 'AC-STU-043 L31843'],
}

/* ==================================================================== *
 * LOCAL DISCLOSURES — records the Studio decision canon does not carry.
 * ==================================================================== */

/**
 * `DecisionDisclosure` renders `D1`-`D29` against `decisions.ts`. Neither
 * `DEC-GATE-001` nor `DEC-CONTLAUNCH-001` has a record there, and both are
 * live on this module's own card. They are disclosed HERE, in the same shape,
 * and reported as a gap for the canon rather than filed under a neighbouring
 * identifier.
 */
export const STU_02_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-GATE-001',
    question: 'Is an action agent governed by pre-authorised policy or by a runtime human gate?',
    readings: [
      {
        text:
          '§5.2 and §3.7: because per-event human approval is impossible mid-Run, the Prevention ' +
          'Agent’s and the Deviation and Containment Agent’s governance takes the form of ' +
          'pre-authorised, Studio-authored policy — every asset they can deliver and every ' +
          'response they can execute passed curation and the approval chain before it could fire.',
        locator: 'DEC-GATE-001 · L31692',
      },
      {
        text:
          '§8.3.2 states that action agents change state and every one routes through a human ' +
          'gate before any effect, and §8.3.3 labels the Prevention Agent "action, gated".',
        locator: 'DEC-GATE-001 · L31692',
      },
    ],
    adopted:
      'The adopted working position, taken 2026-08-14, declares gating PER AGENT in the agent ' +
      'record’s governance-binding field: the Prevention Agent carries `authoring-time policy`, ' +
      'the Deviation and Containment Agent carries `runtime human gate` for proposals beyond ' +
      'pre-authorised containment. The practical consequence this screen is bound by, verbatim: ' +
      'the Studio "must never present pre-authorised policy as though it were a runtime human gate".',
    canonNote:
      'The Studio decision canon (D1-D29) carries no record for DEC-GATE-001, and it is live on ' +
      'MOD-STU-02’s own card. Declared here as a gap for the canon rather than filed under a ' +
      'neighbouring identifier.',
  },
  {
    decisionRef: 'DEC-CONTLAUNCH-001',
    question: 'Who launches the containment checklist — the device, or the agent?',
    readings: [
      {
        text:
          '§3.4 and §7.9.1 layer b place the launch on the device, locally and offline-capable, ' +
          'from the version-pinned work package, at the instant of classification.',
        locator: 'DEC-CONTLAUNCH-001 · L31721',
      },
      {
        text:
          '§5.2.2 and §5.7.1 attribute the launch to the Deviation and Containment Agent, which ' +
          '§7.9.1 layer c places server-side and online-only.',
        locator: 'DEC-CONTLAUNCH-001 · L31721',
      },
    ],
    adopted:
      'Option A, taken 2026-08-14 because it is the safer reading: the device launches the ' +
      'pre-authorised containment checklist locally with no network required, and the agent ' +
      'enriches the deviation brief afterwards and never triggers the checklist. Classified ' +
      'Derived Clarification — adopted working position, not a SoW Fact. Nothing on this screen ' +
      'claims a checklist was launched.',
    canonNote:
      'No record in D1-D29 for DEC-CONTLAUNCH-001. Declared here as a gap for the canon.',
  },
] as const

/* ==================================================================== *
 * THE SIMULATION BOUNDARY, STATED ON THE SCREEN.
 * ==================================================================== */

/**
 * The sentence this surface most needs and is most able to get wrong. The
 * module's own Artificial-intelligence behaviour line (L31856) is the source:
 * "The agents themselves are artificial-intelligence components, but this
 * module contains none: it is the authoring of their inputs."
 */
export const AGENT_SIMULATION_STATEMENT =
  'This screen configures agents; it does not run them. No model executes here, no coaching asset ' +
  'is retrieved, no deviation is classified and no brief is assembled. Every value below is ' +
  'authored configuration read from a seeded draft, and every agent behaviour described is the ' +
  'contract the agent would act under — not a record that it acted.'

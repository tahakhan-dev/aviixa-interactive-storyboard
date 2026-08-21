import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import {
  CAPABILITY_REGISTER,
  capabilitiesForTenant,
  consequenceLine,
  type AtomicCapabilityRow,
} from '@/studio/modules/stu-01/capabilities'
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
  GOVERNANCE_GATES,
  type ComposedAgent,
  type GateRecord,
  type GovernanceGate,
} from './builder'
import {
  STU_15_CROSS_SURFACE,
  STU_15_MATRIX,
  stu15Row,
  type Stu15CrossSurfaceStatement,
  type Stu15MatrixRow,
  type Stu15RowId,
} from './matrix'

/**
 * `MOD-STU-15`'s rendering rule.
 *
 * ### THE TIER REFUSAL IS SHOWN, NOT HIDDEN — AND ITS WORDING IS THE
 * ### STORYBOARD'S, NOT THE EVALUATOR'S
 *
 * `SB-STU-18` (L34096): "**Compose controls are shown with the reason
 * 'Requires the Growth or Enterprise tier' where the tier is below Growth,
 * rather than hidden.**" `AC-STU-133` (L34138) says the same as an acceptance
 * criterion: "with the requirement stated rather than the control hidden."
 *
 * Task 1's evaluator produces its own, longer sentence for a tier refusal —
 * "requires the Growth or Enterprise **commercial** tier, and this tenant is
 * on Starter" — which is a true and more informative statement and is **not
 * the storyboard's string**. A matcher written against the storyboard would
 * not have found it. So `TIER_REQUIREMENT_LINE` carries the storyboard's own
 * sentence verbatim and is composed IN FRONT of the evaluator's, and the
 * covering test pins the storyboard string against what the control actually
 * renders rather than against this constant on its own.
 *
 * **FINDING, recorded rather than averaged.** L67946's alternate workflow
 * reads "A Starter-tier tenant sees **no** Agent Builder, because Agent
 * Author capability is tier-gated", which is the opposite rendering from
 * `SB-STU-18` and `AC-STU-133`. The module card's storyboard and its own
 * acceptance criterion govern — the criterion is at named-test strength and
 * the whole point of both is that hiding teaches nothing — and the
 * divergence is stated on screen rather than smoothed away.
 *
 * ### NO ENABLEMENT CONTROL LIVES HERE (C11)
 *
 * Row 1's four tenant columns all read `Client Decision Required —
 * DEC-CAPAUTH-001`, so nobody holds enablement. `MOD-STU-01` owns the Atomic
 * Capability view and its register; this module READS that register so the
 * "configuration follows capability" mechanism is visible, and offers no
 * switch. There is no second copy of the six-row mapping table here.
 *
 * NO POLICY UNDER `src/ui/`.
 */

export type Stu15Scenario = Stu18Scenario

export const STU15_DEFAULT_CONTEXT: Stu15Scenario = SEEDED_SCENARIO

export function stu15Scenario(over: Partial<Stu15Scenario> = {}): Stu15Scenario {
  return { ...STU15_DEFAULT_CONTEXT, ...over }
}

/** THE ONE ACCESS CALL THIS MODULE MAKES — per control, over a matrix row. */
export function stu15Decision(
  rowId: Stu15RowId,
  persona: StudioPersonaColumn,
  ctx: Stu15Scenario = STU15_DEFAULT_CONTEXT,
): StudioAccessDecision {
  const s: Stu15Scenario = { ...ctx, persona }
  return evaluateStudioAccess({
    row: stu15Row(rowId),
    identity: studioIdentityFor(persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // MOD-STU-11 owns the chain. No row of this card declares a stage — see
    // `rowOf` in ./matrix.ts — so no stage occupancy is claimed here.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
}

/* ==================================================================== *
 * SB-STU-18's PERMANENT LINE AND THE TIER SENTENCE.
 * ==================================================================== */

/** `SB-STU-18` (L34096): "A permanent line reads:" — and this is that line. */
export const AGENT_BUILDER_PERMANENT_LINE =
  'The Agent Builder composes reasoning agents only. Action agents are configured, not composed.'

/** `SB-STU-18`'s own reason string for a tier below Growth, verbatim. */
export const TIER_REQUIREMENT_LINE = 'Requires the Growth or Enterprise tier.'

/**
 * The `SB-STU-18` / `AC-STU-133` divergence from L67946, stated on screen
 * rather than resolved in a comment nobody reads.
 */
export const TIER_RENDERING_DIVERGENCE =
  'The source states this two ways. SB-STU-18 (L34096) and AC-STU-133 (L34138) require the compose ' +
  'control to be SHOWN with the tier requirement stated rather than hidden; the alternate workflow ' +
  'at L67946 says a Starter-tier tenant "sees no Agent Builder". The storyboard and the acceptance ' +
  'criterion govern here, because a hidden control teaches a reader nothing about what is missing. ' +
  'Both readings are on the record.'

/* ==================================================================== *
 * THE CONTROLS.
 * ==================================================================== */

const CONTROL_LABELS = {
  'enable-or-disable-a-capability-within-entitlement': 'Enable or disable a capability',
  'author-an-atomic-capability': 'Author an atomic capability',
  'compose-a-reasoning-agent': 'Compose a reasoning agent',
  'compose-an-action-agent': 'Compose an action agent',
  'configure-a-standard-action-agent-through-the-nine-section-panel':
    'Configure a standard agent through the nine-section panel',
  'submit-a-composed-agent-to-the-evaluation-gate': 'Submit to the evaluation gate',
  'bypass-the-evaluation-gate': 'Bypass the evaluation gate',
  'route-a-composed-agent-through-the-approval-chain': 'Route through the approval chain',
  'perform-the-platform-level-review': 'Perform the platform-level review',
  'map-a-composed-agent-to-workflows-screens-and-triggers':
    'Map to Workflows, screens, and triggers',
  'assign-or-revoke-the-agent-author-delegation': 'Assign or revoke the Agent Author delegation',
  'view-composed-agent-status-and-mappings': 'View composed-agent status and mappings',
} as const satisfies Readonly<Record<Stu15RowId, string>>

/**
 * The service function each control invokes, `null` where the control is
 * never an act on this route. Typed against the service's own keys, so a
 * control naming a function the service does not export fails to compile —
 * which is the difference between "a handler was passed" and "the control
 * does something".
 */
export type BuilderServiceKey =
  | 'composeReasoningAgent'
  | 'submitToEvaluationGate'
  | 'mapComposedAgent'
  | 'deployComposedAgent'

const CONTROL_SERVICE = {
  'enable-or-disable-a-capability-within-entitlement': null,
  'author-an-atomic-capability': null,
  'compose-a-reasoning-agent': 'composeReasoningAgent',
  'compose-an-action-agent': null,
  'configure-a-standard-action-agent-through-the-nine-section-panel': null,
  'submit-a-composed-agent-to-the-evaluation-gate': 'submitToEvaluationGate',
  'bypass-the-evaluation-gate': null,
  'route-a-composed-agent-through-the-approval-chain': null,
  'map-a-composed-agent-to-workflows-screens-and-triggers': 'mapComposedAgent',
  'view-composed-agent-status-and-mappings': null,
} as const satisfies Readonly<Partial<Record<Stu15RowId, BuilderServiceKey | null>>>

export interface AgentBuilderControl {
  readonly id: Stu15RowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  readonly serviceKey: BuilderServiceKey | null
  /** Non-null only where the tier is what withheld this control. */
  readonly tierRequirement: string | null
  readonly sourceRefs: readonly string[]
}

/**
 * Every `screen` row of the matrix, in matrix order.
 *
 * ROWS 2, 4 AND 7 STAY IN THE LIST AND RENDER AS ABSENCES. Authoring an
 * atom, composing an action agent and bypassing the evaluation gate are
 * refused in every column, and showing each with its reason is
 * `AC-STU-155`'s requirement applied to a boundary rather than to a
 * permission. None of them carries a service key, which is the honest answer
 * rather than an omission: there is no function for an act the platform
 * refuses to everyone.
 */
export function agentBuilderControls(
  s: Stu15Scenario,
  rows: readonly Stu15MatrixRow[] = STU_15_MATRIX,
): readonly AgentBuilderControl[] {
  return rows
    .filter((row) => row.surface === 'screen')
    .map((row) => {
      const decision = stu15Decision(row.id, s.persona, s)
      const tierWithheld =
        decision.decision.reasonCode === 'ENTITLEMENT_MISSING' &&
        row.cells[s.persona].requiredTiers !== null
      const base = affordanceFor(CONTROL_LABELS[row.id], decision)
      // The storyboard's own sentence, in front of the evaluator's fuller
      // one. Composed here rather than written into the matrix cell, because
      // the cell states the CONDITION and this states the RENDERING.
      const affordance: CapabilityAffordance =
        tierWithheld && base.kind === 'disabled'
          ? { ...base, reason: `${TIER_REQUIREMENT_LINE} ${base.reason}` }
          : base
      const serviceKey: BuilderServiceKey | null =
        affordance.kind === 'enabled' && row.id in CONTROL_SERVICE
          ? (CONTROL_SERVICE as Readonly<Record<string, BuilderServiceKey | null>>)[row.id] ?? null
          : null
      return {
        id: row.id,
        label: CONTROL_LABELS[row.id],
        affordance,
        serviceKey,
        tierRequirement: tierWithheld ? TIER_REQUIREMENT_LINE : null,
        sourceRefs: row.sourceRefs,
      }
    })
}

/* ==================================================================== *
 * THE CROSS-SURFACE STATEMENTS — the complement of the control list.
 * ==================================================================== */

export interface Stu15CrossSurfaceReading {
  readonly row: Stu15MatrixRow
  readonly statement: Stu15CrossSurfaceStatement
  readonly label: string
  readonly editableHere: false
}

export function stu15CrossSurfaceStatements(
  rows: readonly Stu15MatrixRow[] = STU_15_MATRIX,
): readonly Stu15CrossSurfaceReading[] {
  return rows
    .filter((row) => row.surface !== 'screen')
    .map((row) => {
      const statement = STU_15_CROSS_SURFACE.find((c) => c.rowId === row.id)
      if (statement === undefined) {
        throw new Error(
          `MOD-STU-15: row "${row.id}" is classified ${row.surface} but STU_15_CROSS_SURFACE ` +
            'carries no statement for it. A row taken off the control list with nothing to ' +
            'replace it is a capability that has gone quiet.',
        )
      }
      return { row, statement, label: CONTROL_LABELS[row.id], editableHere: false }
    })
}

/* ==================================================================== *
 * THE GOVERNANCE TAB — SB-STU-18's progress track.
 * ==================================================================== */

export interface GovernanceTrackStep {
  readonly gate: GovernanceGate
  readonly record: GateRecord
  /** What the track prints for this gate. Never a bare token. */
  readonly line: string
}

/**
 * `SB-STU-18` (L34096): "A Governance tab per agent shows the three gates as
 * a progress track with each gate's outcome, timestamp, and decider."
 *
 * A gate that was never reached prints so, and a gate whose result is
 * unknown prints UNKNOWN — never `pending`, which would claim a submission
 * nobody made, and never `passed`, which would claim a review nobody did.
 */
export function governanceTrack(agent: ComposedAgent): readonly GovernanceTrackStep[] {
  return GOVERNANCE_GATES.map((gate) => {
    const record: GateRecord = agent.gates.find((g) => g.gate === gate.id) ?? {
      gate: gate.id,
      outcome: 'not-reached',
      at: null,
      decider: null,
      failingScenarios: [],
    }
    const stamp = record.at === null ? 'no timestamp' : record.at
    const decider = record.decider === null ? 'no decider recorded' : record.decider
    const line =
      record.outcome === 'not-reached'
        ? `${gate.name}: not reached. ${gate.decidedBy}.`
        : record.outcome === 'unknown'
          ? `${gate.name}: unknown — the result is displayed as unknown and is never inferred (${stamp}).`
          : record.outcome === 'failed'
            ? `${gate.name}: failed (${stamp}, ${decider}). Failing scenarios: ${
                record.failingScenarios.length === 0
                  ? 'none named by the harness'
                  : record.failingScenarios.join(', ')
              }.`
            : `${gate.name}: passed (${stamp}, ${decider}).`
    return { gate, record, line }
  })
}

/* ==================================================================== *
 * CONFIGURATION FOLLOWS CAPABILITY — READ, NEVER RE-DECLARED.
 * ==================================================================== */

export interface CapabilityEnablementReading {
  readonly row: AtomicCapabilityRow
  /** MOD-STU-01's own consequence sentence, produced from the row. */
  readonly consequence: string
}

/**
 * The six-row "configuration follows capability" table (L33977-L33982) is
 * `MOD-STU-01`'s data and is READ here, never copied. A second transcription
 * of the same six rows is two things to keep true, and the screen that
 * carried the stale one would be right for exactly as long as nobody edited
 * the other.
 *
 * SCOPE IS ENFORCED IN THE READ: `capabilitiesForTenant` filters by tenant
 * before a row reaches this function, so a caller cannot read one tenant's
 * register and draw another's.
 */
export function capabilityEnablementReadings(
  registers = [CAPABILITY_REGISTER],
  tenant = CAPABILITY_REGISTER.tenant,
): readonly CapabilityEnablementReading[] {
  return capabilitiesForTenant(registers, tenant).map((row) => ({
    row,
    consequence: consequenceLine(row),
  }))
}

/**
 * DEC-CAPAUTH-001's position, stated where the mechanism renders: the view is read-only,
 * the enablement controls are absent, and `DEC-CAPAUTH-001` is named.
 */
export const NO_ENABLEMENT_OPERATOR_STATEMENT =
  'Nobody holds capability enablement. All four tenant columns of this module’s row 1 read Client ' +
  'Decision Required — DEC-CAPAUTH-001, and the consolidated matrix repeats it, so the whole ' +
  '“configuration follows capability” mechanism has no authorised operator until the client rules. ' +
  'The enablement state below is seeded so the nine configuration sections render; the Agent ' +
  'Builder offers no switch for it, and the Atomic Capability area (MOD-STU-01) is where the ' +
  'mechanism is shown.'

/* ==================================================================== *
 * LOCAL DISCLOSURE AND THE REGISTERED OBJECT GAP.
 * ==================================================================== */

/**
 * `DEC-AGENTLC-001` has no record in the Studio decision canon (`D1`-`D29`)
 * and is live on this module's own card. Disclosed here in the same shape
 * and reported as a gap for the canon.
 */
export const STU_15_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-AGENTLC-001',
    question:
      'How is a deployed composed agent deprecated, disabled or rolled back, and what happens to its in-flight runs?',
    readings: [
      {
        text:
          'The submission, review, and approval path for a composed agent is stated in full. ' +
          'Deprecation, disablement, rollback of a deployed composed agent, and the fate of its ' +
          'in-flight runs are not stated at all.',
        locator: 'DEC-AGENTLC-001 · L33994 · states line L34030',
      },
      {
        text:
          'The source’s own recommendation is (a) a tenant-side disable control with immediate ' +
          'effect and an audited reason, plus (c) a versioned composed-agent lifecycle mirroring ' +
          'Workflow versioning with rollback to a prior composition — because the tenant that ' +
          'composed it is best placed to notice it misbehaving, and a reasoning agent changes no ' +
          'state, so disabling it removes an artifact rather than interrupting an operation.',
        locator: 'DEC-AGENTLC-001 · L33994',
      },
    ],
    adopted:
      'Rendered as UNSPECIFIED. No off switch is invented: there is no disable control, no ' +
      'deprecation state and no rollback path on this route, and the screen says plainly that a ' +
      'composed reasoning agent has no stated off switch short of the platform-wide emergency ' +
      'pause. AC-STU-135 requires exactly this — the three are not implemented silently and the ' +
      'decision is surfaced. Decision owner: the platform architect with the client’s quality lead.',
    canonNote:
      'The Studio decision canon carries no record for DEC-AGENTLC-001. Declared here as a gap for ' +
      'the canon rather than filed under a neighbouring identifier.',
  },
] as const

/**
 * D11's registered gap, carried on the module that produces the object so a
 * later census reads it from the code rather than from a report.
 *
 * D11 adopts the NUMERIC object register as canonical and records that three
 * mnemonics have no numeric counterpart — `OBJ-STU-QUALREQ`,
 * **`OBJ-STU-CAPSTATE`** and `OBJ-STU-LOCALE`. `OBJ-STU-CAPSTATE` is this
 * module's own Outputs object (L34026), and minting an `OBJ-1xx` row for it
 * would inflate a closed register of ninety-nine.
 */
export const OBJ_STU_CAPSTATE_GAP = {
  mnemonic: 'OBJ-STU-CAPSTATE',
  numericCounterpart: null,
  producedBy: 'MOD-STU-15 — "OBJ-STU-CAPSTATE changes that reshape configuration surfaces" (L34026)',
  disclosure: 'D11',
  handTo: 'The coverage-register task, as a registered gap rather than a minted row',
  sourceRefs: ['L34026', 'L34028', 'D11 · L31122-L31138 · L8589-L8875'],
} as const

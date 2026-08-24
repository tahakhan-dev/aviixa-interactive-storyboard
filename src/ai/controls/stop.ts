import { AI_AGENT_ROSTER } from '@/ai/agents/roster'
import { PAUSE_SCOPES, type PauseScope } from '@/ai/join/mode-failure'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import type { DecisionReading } from '@/disclosure/decisions'
import {
  cellFromSource,
  columnKey,
  evaluateColumnAccess,
  type ColumnCell,
  type ColumnKey,
  type ColumnMatrixRow,
  type IdentityColumn,
} from '@/policy/columns'
import type { PermissionDecision } from '@/policy/decision'

import { APP_012_LABEL, localDecision } from './decisions'

/**
 * THE PAUSE, THE RESUME AND THE KILL SWITCH — THREE CONTROLS, TWO SETTINGS
 * CATEGORIES, TWO APPROVAL CLASSES, AND ONE PLACE THAT REFUSES AN AGENT.
 *
 * §40.15, heading L87779. This module holds the mechanisms; the eight rollback
 * forms are `./rollback`, the blast radius is `./blast-radius`, and the four
 * decisions none of these can hand to `DecisionDisclosure` are `./decisions`.
 *
 * ── THE PAUSE HAS TWO SCOPES AND THIS BUILD SHIPS TWO ──────────────────────
 * L87785 — "platform-wide, or per tenant" — and L87821, the initiation step.
 * The scope vocabulary is NOT declared here: it is `PAUSE_SCOPES` in
 * `@/ai/join/mode-failure`, because the same two words key the mode-to-failure
 * join and two spellings of a closed vocabulary is this build's most persistent
 * defect. A site-scoped pause is a third scope the source does not grant
 * (`Recommendation — R&D`, `DEC-AIPAUSE-001`, L91229) and it is carried below
 * as a NON-shippable record rather than as a member.
 *
 * ── THE KILL SWITCH IS NOT THE PAUSE, AND EVERYTHING ABOUT IT IS UNSTATED ──
 * L87795: the kill switch is an Orchestration setting; the emergency pause is a
 * Governance and Safety setting and is critical-class. Two distinct stop
 * mechanisms, two settings categories, two approval classes. The same line says
 * the source states none of the kill switch's scope, threshold, initiating
 * authority or approval class — four attributes, each carried individually, so
 * a register that quietly supplied one goes red rather than reading plausibly.
 * Its card is L87797, one line further down than a paraphrase of the section
 * would reach for — the line between the paragraph and the card is blank, which
 * is why an off-by-one lands on nothing and still looks like a near miss. No
 * number is written here for that blank line: `locator-fidelity` reads any
 * `L`-number in a comment as a citation and refuses one that names a blank
 * span, correctly, and it caught an earlier draft of this very paragraph.
 *
 * ── RESUME IS ITS OWN ACT AND NO CLOCK MAY REACH IT ────────────────────────
 * `AC-AI-015-5` (L87890): resume has its own approval and its own audit record,
 * and "no automatic resume exists". There is no timer, no window and no
 * scheduling primitive anywhere in this module or in the route that renders it,
 * and `tests/unit/ai-controls-stop.test.ts` runs the scan `TEST-AI-015-5`
 * (L87902) describes over both.
 *
 * ── AC-AI-015-7 IS ENFORCED IN ONE PLACE, THROUGH THE EXISTING MECHANISM ───
 * L87892: "No agent can initiate a pause, a resume, a kill, or any rollback."
 * All four acts route through `refuseAgentInitiation`, which builds an
 * `IdentityColumn` per roster agent — the slice-10 non-human column type — and
 * answers through `evaluateColumnAccess`. That evaluator's identity arm THROWS
 * when handed a human session (L99197: "A scheduled run must not reuse an
 * expired human session or a stale bearer token"), so the refusal cannot be
 * answered from whoever is looking at the screen. A second bespoke check here
 * would be a second vocabulary; this is the one that already exists.
 *
 * WHAT "ENFORCED" MEANS HERE, PRECISELY. There is no pause, resume, kill or
 * rollback ACT in this build, so there is nothing for the refusal to intercept:
 * `refuseAgentInitiation` composes the refusal and its record, and the incident
 * console renders both. `TEST-AI-015-7` (L87904) asks for refusal AND audit;
 * the audit half has no sink anywhere under `src/` and is owed rather than
 * built. The console says so on screen instead of letting a present tense imply
 * a capability that is only composed.
 *
 * The refusal is AUDITED, because `TEST-AI-015-7` (L87904) asserts "refusal and
 * audit in every case" and a refusal nobody records is indistinguishable from
 * an attempt that never happened.
 *
 * ── PROVENANCE ─────────────────────────────────────────────────────────────
 * `PROV-4`. Transcribed rules and one policy evaluation. No agent produced any
 * of it, and nothing here may be described as live artificial intelligence.
 */

/* ==================================================================== *
 * THE THREE FIXED SEMANTICS (L87789-L87791).
 * ==================================================================== */

export interface PauseSemantic {
  readonly id: string
  /** The bolded lead of the numbered item, without its markers. */
  readonly heading: string
  /** The whole item, verbatim, less its `N. ` prefix. What a screen prints. */
  readonly quotation: string
  readonly sourceRef: string
}

export const PAUSE_SEMANTICS = [
  {
    id: 'checkpoint-at-stage-boundary',
    heading: 'Checkpoint at stage boundary',
    quotation:
      '**Checkpoint at stage boundary.** In-flight agent runs checkpoint at their next stage boundary and park; raised gates stay human-decidable; resume is a separate audited act. Pause and resume are each critical-class actions `[SoW Fact — §8.7.5, §8.8.3]`.',
    sourceRef: 'L87789',
  },
  {
    id: 'renders-as-unavailability-never-silence',
    heading: 'It renders as agent unavailability, never silence',
    quotation:
      '**It renders as agent unavailability, never silence.** Tenant Client Command Centers show an honest "agents paused by the platform" state; nothing pretends the agents are merely quiet `[SoW Fact — §8.7.5]`.',
    sourceRef: 'L87790',
  },
  {
    id: 'never-suppresses-the-deterministic-layer',
    heading: 'It never suppresses the on-device deterministic layer',
    quotation:
      "**It never suppresses the on-device deterministic layer.** Deterministic detection and the floor's local safety behaviour — gates, specification checks, severity classification, the Severity 1 hold — continue untouched. The Frontline architecture makes this physically true: the safety layer runs on-device. **The pause governs agents, nothing else** `[SoW Fact — §8.7.5]`.",
    sourceRef: 'L87791',
  },
] as const satisfies readonly PauseSemantic[]

/* ==================================================================== *
 * SCOPES — TWO SHIPPED, ONE DISCLOSED AND INOPERABLE.
 * ==================================================================== */

/**
 * The scopes this build ships, consumed from the shared vocabulary rather than
 * re-listed. Re-listing them here is how a third scope gets added in one place
 * and not the other.
 */
export const PAUSE_SHIPPED_SCOPES: readonly PauseScope[] = PAUSE_SCOPES

/**
 * A scope the source names and does not grant. Rendered, inoperable, with every
 * reading — never absent, because the source names it, and never working,
 * because the authority behind it is an open question.
 */
export interface UnshippableScope {
  readonly id: string
  /** The control, in the source's own words. */
  readonly label: string
  /** Always false here. There is no path that sets it true. */
  readonly shippable: false
  /** The decision that governs it. Not a member of the exported canon union. */
  readonly decision: string
  /** Every reading, none obeyed. */
  readonly readings: readonly DecisionReading[]
  /** Every line in the frozen source that names the decision. */
  readonly locators: readonly string[]
  /** What this build did, labelled as a build approval. */
  readonly buildPosition: string
}

/**
 * The readings and the locators are NOT written here. They are
 * `./decisions`'s single local record for `DEC-AIPAUSE-001`, held by reference:
 * an earlier draft of this file spelled them out and that was two homes for one
 * decision, which is the defect the local-disclosure pattern exists to prevent
 * inside the canon and prevents no less well outside it.
 */
const SITE_SCOPE_DECISION = localDecision('DEC-AIPAUSE-001')

export const SITE_SCOPED_PAUSE: UnshippableScope = {
  id: 'site-scoped-pause',
  label: 'Site-scoped pause',
  shippable: false,
  decision: SITE_SCOPE_DECISION.id,
  readings: SITE_SCOPE_DECISION.readings,
  locators: SITE_SCOPE_DECISION.locators,
  buildPosition: `${SITE_SCOPE_DECISION.buildPosition} ${APP_012_LABEL}`,
}

/* ==================================================================== *
 * THE TWO STOP MECHANISMS.
 * ==================================================================== */

export interface StopMechanism {
  readonly id: string
  readonly label: string
  /** The settings category the source files it under. */
  readonly settingsCategory: string
  /** The approval class, or the source's own statement that there is none. */
  readonly approvalClass: string
  readonly sourceRefs: readonly string[]
  /** What it does to a run in flight, in the source's own terms. */
  readonly effect: string
}

export const STOP_MECHANISMS = [
  {
    id: 'emergency-pause',
    label: 'Emergency pause',
    settingsCategory: 'Governance and Safety',
    approvalClass: 'Critical class, root approves',
    sourceRefs: ['L87789', 'L87795', 'L87862'],
    effect:
      'Suspends agent activity at the chosen scope. In-flight agent runs checkpoint at their next ' +
      'stage boundary and park; raised gates stay human-decidable; the on-device deterministic ' +
      'layer is untouched.',
  },
  {
    id: 'runaway-loop-kill-switch',
    label: 'Runaway-loop kill switch',
    settingsCategory: 'Orchestration',
    approvalClass: 'Not specified — `DEC-KILL-001`',
    sourceRefs: ['L87795', 'L87797', 'L87864', 'L91231'],
    effect:
      'Terminates a runaway loop. The pause parks agent activity gracefully at stage boundaries ' +
      'while the kill switch terminates; the source requires that both exist and that they are not ' +
      'conflated on the screen (L91231).',
  },
] as const satisfies readonly StopMechanism[]

/**
 * The kill switch's four unstated attributes, each carried separately.
 *
 * They are separate fields rather than one sentence because a register that
 * supplied ONE of them — a scope, say, borrowed from the pause — would still
 * read plausibly against a paraphrase. Each is asserted individually against
 * L87795's own words by the covering test.
 */
export const KILL_SWITCH = {
  id: 'runaway-loop-kill-switch',
  sourceRef: 'L87795',
  cardRef: 'L87797',
  decision: 'DEC-KILL-001',
  unstated: ['scope', 'threshold', 'initiating authority', 'approval class'] as const,
  whyItMatters:
    'An operator facing a misbehaving agent at 02:00 needs to know which control to reach for and ' +
    'whether reaching for it requires waking the root account. If the kill switch is ' +
    'engineering-class and the pause is critical-class, the fast control and the governed control ' +
    'are different controls, and that must be deliberate rather than accidental (L87797).',
  notConflated:
    'The pause parks agent activity gracefully at stage boundaries; the kill switch terminates a ' +
    'runaway loop. Both must exist and must not be conflated on the screen (L91231).',
} as const

/* ==================================================================== *
 * RESUME.
 * ==================================================================== */

export const RESUME_IS_SEPARATE = {
  id: 'emergency-resume',
  label: 'Resume',
  sourceRefs: ['L87789', 'L87828', 'L87876', 'L87890'],
  criterion: 'AC-AI-015-5',
  quotation:
    'Resume is a separate action with its own approval and its own audit record; no automatic ' +
    'resume exists.',
  whatIsForbidden:
    'No timer, no window and no scheduled path may reach a resume. `TEST-AI-015-5` (L87902) is the ' +
    'test that would find one: it attempts an automatic resume after a timer and asserts none ' +
    'occurs. The one thing a pause cannot do is resume itself (L87876).',
} as const

/* ==================================================================== *
 * THE TEN NUMBERED STEPS (L87820-L87829).
 * ==================================================================== */

export interface PauseWorkflowStep {
  /** The item, verbatim, less its `N. ` prefix. */
  readonly text: string
  readonly sourceRef: string
}

const WORKFLOW_TEXT = [
  'A condition warrants stopping agent activity: a suspected isolation defect, a provider behaving anomalously, a capability regression, or a support case affecting one tenant.',
  'The pause is initiated at the chosen scope — per tenant or platform-wide `[SoW Fact — §8.7.5]`. Initiation authority is `DEC-PAUSE-001`.',
  'In-flight agent runs checkpoint at their next stage boundary and park `[SoW Fact — §8.7.5]`.',
  'Raised gate items stay human-decidable; a Quality Manager may still approve, adjust or decline them `[SoW Fact — §8.7.5]`.',
  'The tenant\'s Client Command Center renders an honest "agents paused by the platform" state `[SoW Fact — §8.7.5]`.',
  'The on-device deterministic layer continues untouched: gates, specification checks, severity classification and the Severity 1 hold `[SoW Fact — §8.7.5]`.',
  'Scheduled agent activity, such as the shift handoff brief, does not produce an artifact; the absence is shown as unavailability, not silence.',
  'The condition is diagnosed and addressed.',
  'Resume is initiated as a separate act and separately audited, at critical class `[SoW Fact — §8.7.5, §8.8.3]`.',
  'Parked runs are handled per the replay decision, `DEC-REPLAY-001`.',
] as const

/** The first step's line. Each step's locator is derived from its position. */
export const PAUSE_WORKFLOW_FIRST_LINE = 87_820

export const PAUSE_RESUME_WORKFLOW: readonly PauseWorkflowStep[] = WORKFLOW_TEXT.map(
  (text, index) => ({ text, sourceRef: `L${String(PAUSE_WORKFLOW_FIRST_LINE + index)}` }),
)

/* ==================================================================== *
 * AC-AI-015-7 — THE ONE PLACE ALL FOUR ACTS REFUSE A NON-HUMAN IDENTITY.
 * ==================================================================== */

/**
 * The four acts `AC-AI-015-7` (L87892) names, in the order it names them. A
 * fifth act added here without a matching clause in that line would be this
 * build claiming a criterion the source does not carry.
 */
export type StopAct = 'pause' | 'resume' | 'kill' | 'rollback'

export const STOP_ACTS = ['pause', 'resume', 'kill', 'rollback'] as const satisfies readonly StopAct[]

type MissingFromStopActs = Exclude<StopAct, (typeof STOP_ACTS)[number]>
const _stopActsExhaustive: MissingFromStopActs extends never ? true : never = true
void _stopActsExhaustive

/**
 * One non-human identity column per agent on the chapter-44 roster. The roster
 * is the population — four agents, including the Vision Reasoning Agent whose
 * governance the source states as an absence — because the criterion says
 * "every agent identity" and an identity list assembled by hand would be short
 * by exactly the agent nobody remembered.
 */
export const AGENT_IDENTITY_COLUMNS: readonly IdentityColumn[] = AI_AGENT_ROSTER.map(
  (agent): IdentityColumn => ({
    kind: 'identity',
    header: agent.name,
    identitySourceRefs: [agent.sourceRef],
  }),
)

/**
 * The cell every act reads for every agent identity, from the frozen source's
 * own token. Parsed rather than constructed, so the outcome is the one the
 * tree's single source-cell parser gives that token and not a second opinion.
 */
const PROHIBITED: ColumnCell = cellFromSource(
  'Explicitly prohibited — no agent can initiate a pause, a resume, a kill, or any rollback (AC-AI-015-7, L87892)',
)

function refusalRow(act: StopAct): ColumnMatrixRow {
  const cells: Record<string, ColumnCell> = {}
  for (const column of AGENT_IDENTITY_COLUMNS) {
    cells[columnKey(column)] = PROHIBITED
  }
  return {
    id: `AC-AI-015-7:${act}`,
    operation: `Initiate ${act} from a non-human identity`,
    cells: cells as Readonly<Partial<Record<ColumnKey, ColumnCell>>>,
    sourceRef: 'L87892',
  }
}

export interface AuditedRefusal {
  readonly act: StopAct
  readonly identity: IdentityColumn
  readonly decision: PermissionDecision
  /**
   * What an audit record for this refusal WOULD CARRY. `TEST-AI-015-7` (L87904)
   * asks for "refusal and audit in every case", and a refusal nobody records is
   * indistinguishable from an attempt that never happened.
   *
   * IT IS NOT WRITTEN ANYWHERE, AND THE FIELD NAME SHOULD NOT BE READ AS IF IT
   * WERE. There is no audit sink in this build; this is a composed string with
   * no consumer beyond the screen that prints it, and there is no pause,
   * resume, kill or rollback ACT here for the refusal to guard either. The
   * audit half of `TEST-AI-015-7` is owed, not met, and the incident console
   * states that in its own words rather than implying otherwise by tense.
   */
  readonly auditRecord: string
  readonly sourceRefs: readonly string[]
}

/**
 * THE ONE PLACE. Every one of the four acts routes here, and it answers through
 * the shared column evaluator with `live = null` — a non-human identity's cell
 * is answered from its own declared authority, never from a human session
 * (L99197). Passing one would throw inside that evaluator rather than here,
 * which is the point of not writing a second check.
 */
export function refuseAgentInitiation(act: StopAct, identity: IdentityColumn): AuditedRefusal {
  const row = refusalRow(act)
  const decision = evaluateColumnAccess(row, identity, null, AGENT_IDENTITY_COLUMNS)
  return {
    act,
    identity,
    decision,
    auditRecord:
      `Refused: ${identity.header} attempted to initiate ${act}. AC-AI-015-7 (L87892) — no agent ` +
      'can initiate a pause, a resume, a kill, or any rollback. Recorded with the identity, the ' +
      'act and the criterion, because a refusal nobody records cannot be told from an attempt that ' +
      'never happened (TEST-AI-015-7, L87904).',
    sourceRefs: ['L87892', 'L87904', 'L87816'],
  }
}

/** Every act against every identity. The matrix `TEST-AI-015-7` describes. */
export const AGENT_INITIATION_REFUSALS: readonly AuditedRefusal[] = STOP_ACTS.flatMap((act) =>
  AGENT_IDENTITY_COLUMNS.map((identity) => refuseAgentInitiation(act, identity)),
)

/* ==================================================================== *
 * THE FRONTLINE SIDE OF THE PAUSE — A STATED ABSTENTION.
 * ==================================================================== */

/**
 * THE CONFLICT THIS TASK WAS ASSIGNED AND DISCLOSED NOWHERE.
 *
 * `AC-AI-015-4` (L87889): "The affected tenant's Command Center renders an
 * explicit paused state; no surface renders silence." `SB-AI-015`'s second
 * clause (L87854), marked `Derived Clarification` on the same line, rules that
 * the Frontline Worker Application surface shows nothing at all about the pause.
 * §42.3 requires the worker's mode chip to read "Live coaching paused by the
 * platform" — corroborated at L89289, L89348 and the matrix rows L89368/L89369,
 * two of which the source marks `SoW Fact — §8.7.5`.
 *
 * The task brief assigns the pause's side of this to task 14, and the diff that
 * built this module disclosed it nowhere and stated no abstention. From outside,
 * a stated abstention and an oversight are indistinguishable, which is the whole
 * reason this record exists rather than nothing at all.
 *
 * IT POINTS RATHER THAN RESTATES. The canon already holds every reading and
 * every locator as `DEC-AIDISCLOSE-001` in `src/disclosure/decisions.ts` — a
 * file this task may not edit — and writing local readings here would be the
 * second home `DecisionDisclosure` exists to prevent. So this names the record,
 * names the two criteria, and says which half of the surface this task builds.
 */
export const FRONTLINE_PAUSE_DISCLOSURE = {
  decision: 'DEC-AIDISCLOSE-001',
  canonHome: 'src/disclosure/decisions.ts',
  conflict:
    '`AC-AI-015-4` (L87889) requires that no surface renders silence during a pause. ' +
    "`SB-AI-015`'s second clause (L87854), marked `Derived Clarification` on that same line, " +
    'rules that the Frontline Worker Application surface shows nothing at all about it. §42.3 ' +
    'requires the worker chip to read "Live coaching paused by the platform" rather than ' +
    '"offline", because the distinction decides whether a worker walks to a better signal.',
  whatThisTaskOwns:
    'The Super Admin platform console side: the pause and resume controls, their approval states, ' +
    'the blast-radius enumeration and the incident console that renders them. Every one of those ' +
    'renders the paused state explicitly, so nothing this task builds renders silence.',
  whatThisTaskDoesNotOwn:
    'The Frontline Worker Application chip. No file under `src/frontline/` or `app/frontline/` is ' +
    'on this task\'s path list, this task changes none of them, and it therefore neither builds ' +
    'nor suppresses a worker-facing indicator. The overlay that would is a later task.',
  adopted:
    'Neither reading is adopted here and this task builds neither. The one thing the source does ' +
    'settle is carried: L87826 rules that a missing scheduled artifact is shown as ' +
    'unavailability, not silence, and the pause/resume workflow transcribes that step verbatim.',
  locators: ['L87889', 'L87854', 'L89289', 'L89348', 'L89368', 'L89369', 'L87826'],
} as const

/* ==================================================================== *
 * PROVENANCE.
 * ==================================================================== */

/** The one class every rendering path over this module emits. */
export const STOP_CONTROLS_PROVENANCE: ProvenanceClassId = 'PROV-4'

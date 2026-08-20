import {
  WHEEL_BOLT_CONFIGURATION,
  configuredScreen,
  type ConfigurationDraft,
  type ScreenConfiguration,
} from '@/studio/modules/stu-05/sections'
import { STU_SEAMS, stuSeamById, type StudioSeamDefinition } from '@/studio/seams'
import type { ConfigurationSection } from '@/studio/vocab'

/**
 * `MOD-STU-02`'s data: the three standard agents, what each needs from the
 * Studio, the three deterministic detection mechanisms, and the READ over
 * the authored configuration those parameters actually resolve to.
 *
 * ### THIS MODULE AUTHORS NOTHING, AND THAT IS THE DESIGN
 *
 * Its Interconnections line (L31852) states where every value it needs is
 * authored: "`MOD-STU-05` supplies the configuration sections; `MOD-STU-07`
 * supplies the pointers; `MOD-STU-13` supplies qualification context;
 * `MOD-STU-14` carries the result to the device; `MOD-STU-16` proposes
 * refinements to these values through Lane B." Its Outputs line (L31745) is
 * "Agent operating parameters carried inside the published Workflow
 * version" — a consequence of authoring done elsewhere, not a store of its
 * own. So there is **no write function in this module**, and the covering
 * test asserts the absence structurally rather than trusting this comment.
 *
 * BRIEF DEFECT, RECORDED: the task brief quotes `MOD-STU-02` as *"owns
 * nothing; composes 05, 07 and 13"*. **That sentence is not in the frozen
 * source.** Every occurrence of "owns nothing" in the blueprint is about the
 * Client Command Center (L6950, L13128, L35313, L47457, L49568). The
 * SUBSTANCE is corroborated by L31852 above and by the "Where it is
 * configured" column of L31707-L31709, and this file is built on those.
 *
 * ### THE HONESTY CONSTRAINT THIS FILE IS MOST EXPOSED TO
 *
 * This is the artificial-intelligence surface. Nothing here runs a model,
 * retrieves a coaching asset, classifies a deviation, or assembles a brief.
 * What it renders is the CONFIGURATION and the CONTRACT: the parameters a
 * human authored, where each one was authored, and what each agent would do
 * with it. `agentParameterReadings` reads a seeded draft and says so.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

/* ==================================================================== *
 * THE THREE STANDARD AGENTS — L31707-L31709, three data rows.
 * ==================================================================== */

export type StandardAgentId = 'prevention' | 'deviation-and-containment' | 'shift-handoff'

export const STANDARD_AGENT_IDS = [
  'prevention',
  'deviation-and-containment',
  'shift-handoff',
] as const satisfies readonly StandardAgentId[]

type MissingFromAgentIds = Exclude<StandardAgentId, (typeof STANDARD_AGENT_IDS)[number]>
const _agentIdsExhaustive: MissingFromAgentIds extends never ? true : never = true
void _agentIdsExhaustive

/**
 * L31690: "a reasoning agent produces an analytical artifact — a brief,
 * report, or summary — and changes no state, so it carries no per-event
 * approval gate. An action agent changes state or reaches a worker, and acts
 * only under governance."
 */
export type AgentKind = 'action agent' | 'reasoning agent'

/**
 * `DEC-GATE-001`'s adopted working position (L31692), which "declares gating
 * per agent in the agent record's **governance-binding field**": the
 * Prevention Agent carries `authoring-time policy`, the Deviation and
 * Containment Agent carries `runtime human gate` for proposals beyond
 * pre-authorised containment.
 *
 * **THE THIRD MEMBER IS NOT A THIRD READING OF THE SAME QUESTION.** The
 * Shift Handoff Agent is a reasoning agent and L31709 gives it "no
 * governance gate" — a stated fact, not a position under `DEC-GATE-001`.
 *
 * The practical consequence, verbatim (L31692): the Studio "must never
 * present pre-authorised policy as though it were a runtime human gate."
 * That is why this is a THREE-VALUED FIELD on the agent record and not a
 * boolean `gated`: a boolean would render the Prevention Agent's
 * authoring-time approval and the Deviation and Containment Agent's runtime
 * gate identically, which is the exact misrepresentation the sentence
 * forbids.
 */
export type GovernanceBinding = 'authoring-time policy' | 'runtime human gate' | 'no governance gate'

export const GOVERNANCE_BINDINGS = [
  'authoring-time policy',
  'runtime human gate',
  'no governance gate',
] as const satisfies readonly GovernanceBinding[]

type MissingFromBindings = Exclude<GovernanceBinding, (typeof GOVERNANCE_BINDINGS)[number]>
const _bindingsExhaustive: MissingFromBindings extends never ? true : never = true
void _bindingsExhaustive

export interface StandardAgent {
  readonly id: StandardAgentId
  /** The table's first column, verbatim. */
  readonly name: string
  /** The table's second column, verbatim. */
  readonly typeWording: string
  readonly kind: AgentKind
  /** The table's third column, verbatim. */
  readonly studioMustSupply: string
  /** The table's fourth column, verbatim. */
  readonly configuredIn: string
  readonly governanceBinding: GovernanceBinding
  /** Why the binding reads what it reads, with its locator. */
  readonly governanceNote: string
  readonly sourceRef: string
}

export const STANDARD_AGENTS = [
  {
    id: 'prevention',
    name: 'Prevention Agent',
    typeWording: 'Action agent, governed by pre-authorised Studio-authored policy',
    kind: 'action agent',
    studioMustSupply:
      'A timing expectation: the maximum and minimum expected duration for the screen and the point, as a percentage of the maximum, at which coaching should appear. Coaching content to deliver: the tenant’s approved per-language coaching corpus from which the agent retrieves, plus the screen’s curated default for cold start. The qualification and proof context: what the worker must be qualified for and what proof the screen requires, so the agent can recognise the nature of the difficulty — a missing photo, a hesitation, a repeated gate block',
    configuredIn: 'Timing section; Coaching Corpus and Section 6 of the screen; Section 4 and Section 9',
    governanceBinding: 'authoring-time policy',
    governanceNote:
      'DEC-GATE-001’s adopted working position, taken 2026-08-14 (L31692). The authoring approval IS the whole of the human approval for this agent, which is why the Studio must author the pre-authorised policy completely — and why this screen must never present that policy as though it were a runtime human gate.',
    sourceRef: 'L31707',
  },
  {
    id: 'deviation-and-containment',
    name: 'Deviation and Containment Agent',
    typeWording: 'Action agent, human-gated where it proposes beyond pre-authorised containment',
    kind: 'action agent',
    studioMustSupply:
      'Time bounds for the time-deviation mechanism; screen order and branch targets for the sequence mechanism; specification limits and gate-and-proof configuration for the specification and evidence mechanism; the severity mapping into the global catalog; the containment checklist; the escalation routing template',
    configuredIn:
      'Timing section; the canvas; Specification Limits and Gate-and-Proof sections; Section 7',
    governanceBinding: 'runtime human gate',
    governanceNote:
      'DEC-GATE-001’s adopted working position (L31692): a runtime human gate for proposals BEYOND pre-authorised containment. Inside pre-authorised containment the configured response applies; the checklist and the routing are policy, chosen by the quality engineer and never by the agent (L31721).',
    sourceRef: 'L31708',
  },
  {
    id: 'shift-handoff',
    name: 'Shift Handoff Agent',
    typeWording: 'Reasoning agent, no governance gate',
    kind: 'reasoning agent',
    studioMustSupply:
      'Mostly indirect: the deviations, coaching events, gate outcomes, and qualification requirements the Workflow configuration produced during the shift. The one direct authoring concern is qualification requirements, cross-referenced against the incoming shift plan to flag readiness gaps',
    configuredIn: 'MOD-STU-13, indirectly via all authored configuration',
    governanceBinding: 'no governance gate',
    governanceNote:
      'The table’s own second column (L31709), a SoW Fact rather than a position under DEC-GATE-001: a reasoning agent produces an analytical artifact and changes no state, so it carries no per-event approval gate (L31690).',
    sourceRef: 'L31709',
  },
] as const satisfies readonly StandardAgent[]

type MissingFromAgents = Exclude<StandardAgentId, (typeof STANDARD_AGENTS)[number]['id']>
const _agentsExhaustive: MissingFromAgents extends never ? true : never = true
void _agentsExhaustive

export function standardAgent(
  agents: readonly StandardAgent[],
  id: StandardAgentId,
): StandardAgent {
  const found = agents.find((a) => a.id === id)
  if (found === undefined) throw new Error(`MOD-STU-02: no standard agent named "${id}".`)
  return found
}

/* ==================================================================== *
 * THE THREE DETERMINISTIC DETECTION MECHANISMS — L31715-L31717.
 * ==================================================================== */

/**
 * L31690, the first governing boundary: "detection is deterministic;
 * interpretation is agentic. Whether a deviation has occurred is decided by
 * fixed rules — time, sequence, specification and evidence — never by
 * artificial intelligence. An agent activates only after a deterministic
 * trigger fires."
 *
 * `firesBeforeAnyAgent` is `true` on all three and is written on each row
 * rather than asserted once in prose, because the diagram's own reading
 * (L31812) is the thing a build can get wrong: "Every agent arrow starts
 * downstream of the deterministic layer, never upstream of it. No agent has
 * an edge into severity classification."
 */
export interface DetectionMechanism {
  readonly id: 'time' | 'sequence' | 'specification-or-evidence'
  /** First column, verbatim. */
  readonly name: string
  /** Second column, verbatim. */
  readonly triggeredBy: string
  /** Third column, verbatim. */
  readonly configuredIn: string
  readonly firesBeforeAnyAgent: true
  readonly sourceRef: string
}

export const DETECTION_MECHANISMS = [
  {
    id: 'time',
    name: 'Time deviation',
    triggeredBy:
      'Screen duration exceeds the maximum, or completes below the minimum, which suggests a skip',
    configuredIn: 'Timing section: maximum and minimum duration',
    firesBeforeAnyAgent: true,
    sourceRef: 'L31715',
  },
  {
    id: 'sequence',
    name: 'Sequence deviation',
    triggeredBy:
      'A screen is reached out of order, or a required predecessor screen was skipped',
    configuredIn: 'The canvas: screen order and branch targets',
    firesBeforeAnyAgent: true,
    sourceRef: 'L31716',
  },
  {
    id: 'specification-or-evidence',
    name: 'Specification or evidence deviation',
    triggeredBy:
      'A measurement falls outside the specification limits, or a screen is closed without the required proof',
    configuredIn: 'Specification Limits and Gate-and-Proof sections',
    firesBeforeAnyAgent: true,
    sourceRef: 'L31717',
  },
] as const satisfies readonly DetectionMechanism[]

/**
 * The no-artificial-intelligence statement, L31858, quoted because it is the
 * one sentence that keeps an emergency pause from reading as a floor outage:
 * "With every agent disabled by an emergency pause, the deterministic layer
 * configured here continues untouched… Emergency pause renders as agent
 * unavailability, never silence, and the deterministic backbone has no off
 * switch."
 */
export const EMERGENCY_PAUSE_STATEMENT =
  'With every agent disabled by an emergency pause, the deterministic layer configured here ' +
  'continues untouched: gates, specification checks, severity classification, and the Severity 1 ' +
  'hold continue. Emergency pause renders as agent unavailability, never silence, and the ' +
  'deterministic backbone has no off switch.'

/* ==================================================================== *
 * THE CONFIGURATION READ — what the authored draft actually resolves to.
 * ==================================================================== */

/**
 * One parameter an agent needs, with the value the authored draft currently
 * carries and the section that authored it.
 *
 * `section` is a `ConfigurationSection` from the shared vocabulary wherever
 * one applies, so that a reader following "where is this authored" lands on
 * MOD-STU-05's own section names rather than on a second set of labels
 * invented here. `null` is for the two parameters authored outside the nine
 * sections — the canvas (MOD-STU-04) and qualification requirements
 * (MOD-STU-13) — and `authoredIn` names them in words.
 */
export interface AgentParameterReading {
  readonly agent: StandardAgentId
  readonly parameter: string
  /** What the seeded draft carries, rendered. Never a live value. */
  readonly value: string
  readonly section: ConfigurationSection | null
  readonly authoredIn: string
  readonly sourceRef: string
}

/** The draft this module reads. A seeded fixture, and every screen says so. */
export const AGENT_CONFIGURATION_DRAFT: ConfigurationDraft = WHEEL_BOLT_CONFIGURATION

/**
 * The parameter map for ONE screen of the draft.
 *
 * SCOPE IS ENFORCED IN THE READ, at the one place both branches converge:
 * `configuredScreen` resolves the screen out of the draft that was handed
 * in, so a caller cannot read one draft and draw another. There is no second
 * path that skips it.
 */
export function agentParameterReadings(
  draft: ConfigurationDraft,
  screenId: string,
): readonly AgentParameterReading[] {
  // `configuredScreen` THROWS on a screen the draft does not hold, and that
  // is MOD-STU-05's own rule kept rather than softened: "an empty answer and
  // a missing screen are different things, and only one of them is true." A
  // `?? []` here would be a second spelling of that decision, in the
  // direction the owning module refused.
  const screen: ScreenConfiguration = configuredScreen(draft, screenId)

  const bands = screen.severityBands
  const firstBand = bands[0] ?? null
  const checklist = bands.find((b) => b.containmentChecklistId !== null)?.containmentChecklistId
  const routing = bands.find((b) => b.routingTemplateId !== null)?.routingTemplateId

  return [
    {
      agent: 'prevention',
      parameter: 'Maximum and minimum expected duration',
      value: `${screen.timing.maximumSeconds} seconds maximum, ${screen.timing.minimumSeconds} seconds minimum`,
      section: 'Timing',
      authoredIn: 'Timing section, MOD-STU-05',
      sourceRef: 'L31707 · L31715',
    },
    {
      agent: 'prevention',
      parameter: 'Coaching trigger, as a percentage of the maximum',
      value: `${screen.timing.triggerPercent} per cent${
        screen.timing.triggerInherited ? ', inherited from the Workflow default' : ', overridden on this screen'
      }`,
      section: 'Timing',
      authoredIn: 'Timing section, MOD-STU-05',
      sourceRef: 'L31707',
    },
    {
      agent: 'prevention',
      parameter: 'Curated coaching defaults, per locale',
      value:
        screen.coachingDefaults.length === 0
          ? 'None designated'
          : screen.coachingDefaults.map((d) => `${d.locale}: ${d.itemId}`).join(' · '),
      section: 'Coaching content',
      authoredIn: 'Coaching Corpus (MOD-STU-07) and Section 6 of the screen',
      sourceRef: 'L31707',
    },
    {
      agent: 'prevention',
      parameter: 'Difficulty context — the proof requirement and the qualification context',
      value: `${screen.gate} gate; ${
        screen.qualificationOverride?.active === true
          ? `screen-level certification ${screen.qualificationOverride.certification}`
          : 'no screen-level qualification override'
      }`,
      section: 'Gate and proof',
      authoredIn: 'Section 4 and Section 9 of the screen',
      sourceRef: 'L31707 · FUNC-STU-02-01-C-1 L31760',
    },
    {
      agent: 'deviation-and-containment',
      parameter: 'Specification limits',
      value:
        screen.limits === null || !screen.limits.active
          ? 'Not a measurement screen — no specification limits'
          : `${screen.limits.lower} to ${screen.limits.upper} ${screen.limits.unit}, drawing ${screen.limits.drawingReference}`,
      section: 'Specification limits',
      authoredIn: 'Specification Limits section, MOD-STU-05',
      sourceRef: 'L31708 · L31717',
    },
    {
      agent: 'deviation-and-containment',
      parameter: 'Severity mapping into the global catalog',
      value:
        firstBand === null
          ? 'No band mapped'
          : bands.map((b) => `${b.band} → ${b.level}`).join(' · '),
      section: 'Deviation rules and severity mapping',
      authoredIn: 'Section 7 of the screen, MOD-STU-05',
      sourceRef: 'L31708',
    },
    {
      agent: 'deviation-and-containment',
      parameter: 'Containment checklist pointer',
      value: checklist ?? 'No containment checklist attached on this screen',
      section: 'Deviation rules and severity mapping',
      authoredIn: 'Content Libraries, MOD-STU-07, referenced by pointer from Section 7',
      sourceRef: 'L31708 · FUNC-STU-02-02-B-2 L31766',
    },
    {
      agent: 'deviation-and-containment',
      parameter: 'Escalation routing template pointer',
      value: routing ?? 'No routing template attached on this screen',
      section: 'Deviation rules and severity mapping',
      authoredIn: 'Content Libraries, MOD-STU-07, referenced by pointer from Section 7',
      sourceRef: 'L31708 · FUNC-STU-02-02-B-3 L31767',
    },
    {
      agent: 'deviation-and-containment',
      parameter: 'Screen order and branch targets',
      value: `${draft.screens.length} screens in the authored sequence; ${draft.workflowName}`,
      section: null,
      authoredIn: 'The canvas, MOD-STU-04 — not one of the nine sections',
      sourceRef: 'L31708 · L31716',
    },
    {
      agent: 'shift-handoff',
      parameter: 'Qualification requirements, cross-referenced against the incoming shift plan',
      value:
        screen.qualificationOverride?.active === true
          ? `Screen-level: ${screen.qualificationOverride.certification}`
          : 'Workflow baseline only on this screen',
      section: 'Qualification override',
      authoredIn: 'MOD-STU-13, indirectly via all authored configuration',
      sourceRef: 'L31709',
    },
  ]
}

/* ==================================================================== *
 * THE SHIFT HANDOFF LEAD TIME — READ HERE, ADMINISTERED ELSEWHERE.
 * ==================================================================== */

/**
 * L31723: the Shift Handoff Agent "runs on a schedule — a configurable
 * period before shift end, defaulting to about 30 minutes". L67942 states
 * the same default against a named Shift end time and gives the schedule its
 * identifier.
 *
 * THE VALUE IS NOT COMPUTED FROM A CLOCK, and it is not this surface's to
 * change. The Shift's end time arrives through the declared seam
 * (`shift-timing-for-handoff-schedule`, MOD-DOH-03) whose contract is
 * already registered: "Default 30 minutes before shift end, computed against
 * the Shift's own end time rather than a clock this surface holds."
 */
export const SHIFT_HANDOFF_LEAD_TIME_MINUTES = 30

export const SHIFT_HANDOFF_SCHEDULE_ID = 'SCHED-HANDOFF-001'

/**
 * The Shift this build reads the end time from.
 *
 * L67942 names `SHIFT-DAY` with a 14:00 end time. Slice 4's Hub register
 * names its own shifts (`SHIFT-ARD-EARLY` and siblings) and does not carry a
 * `SHIFT-DAY` row; `src/` may not value-import `app/`, so this module cannot
 * read that register directly and does not pretend to. The source's own
 * identifier and time are carried here as the seam's seeded answer, and the
 * divergence from the Hub's register is stated rather than smoothed.
 */
export const SHIFT_HANDOFF_SHIFT_ID = 'SHIFT-DAY'
export const SHIFT_HANDOFF_SHIFT_END = '14:00'

export interface ShiftHandoffLeadTimeReading {
  readonly label: string
  readonly value: string
  /** What the Studio may do with it here. Always a read. */
  readonly editableHere: false
  /** The cell's own words, verbatim from L31737. */
  readonly ownershipStatement: string
  readonly scheduleId: string
  readonly computedAgainst: string
  readonly seam: StudioSeamDefinition
  readonly sourceRefs: readonly string[]
}

/**
 * `SB-010-01` (L68013) lists "the Shift Handoff Agent's lead time before
 * shift end" as a panel FIELD of the agent configuration screen. It is a
 * field, and it is READ-ONLY here, and those two facts are not in tension:
 * the field displays a value the tenant administration area owns.
 */
export function shiftHandoffLeadTime(
  seams: readonly StudioSeamDefinition[] = STU_SEAMS,
): ShiftHandoffLeadTimeReading {
  return {
    label: 'Lead time before shift end',
    value: `${SHIFT_HANDOFF_LEAD_TIME_MINUTES} minutes before shift end`,
    editableHere: false,
    ownershipStatement:
      'A tenant-level setting administered in the tenant administration area, read here.',
    scheduleId: SHIFT_HANDOFF_SCHEDULE_ID,
    computedAgainst: `${SHIFT_HANDOFF_SHIFT_ID}, which ends at ${SHIFT_HANDOFF_SHIFT_END}`,
    seam: stuSeamById(seams, 'shift-timing-for-handoff-schedule'),
    sourceRefs: ['L31737', 'L31723', 'L67942', 'L68013'],
  }
}

import type { RoleId } from '@/domain/roles'
import { saTenant } from '@/surfaces/sa/tenants'

/**
 * MOD-SA-12 Usage and Metering — the seeded fixtures this module's screen
 * steps through. No backend, no clock: every "as of" value below is a
 * fixture string, never a computed time (spec §8, and the no-ambient-Date
 * rule).
 *
 * The binding constraint on this file is spec §6 and census risk R5. A
 * Worker-Shift is a BILLING UNIT — `AC-GOAL-060` (L2241): "a worker attached
 * to work in one calendar shift meters exactly one Worker-Shift regardless of
 * run count". Every figure here is therefore a COUNT for one
 * tenant in one calendar month. There is no per-worker row, no per-site or
 * per-shift row, no rate and no comparison between people in this file,
 * and none can be derived from what it carries: the counts are stored
 * already aggregated at tenant-month, so no finer series exists to render.
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` identifiers are the plan's
 * annotation for the same four accounts `@/domain/roles` already carries;
 * both are rendered so a reviewer can match one to the other. The
 * selector is a VIEW SWITCHER, not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface UsagePlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const USAGE_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly UsagePlatformRole[]

/* ------------------------------------------------------------------ *
 * Closed vocabularies. `as const satisfies` keeps each member literal-
 * narrowed, so the exhaustiveness checks below are real rather than
 * vacuous (a plain `: readonly T[]` annotation would widen the const).
 * ------------------------------------------------------------------ */

/**
 * `OBJ-SA-LADDERSTATE` (L45404) — the SURF-SA-owned object, and the
 * vocabulary this module renders. Two other cuts exist in the source
 * (L4648's five short labels, L26875's four `below_80`-style tokens on the
 * Delivery Operations Hub side); both are recorded in
 * `USAGE_SOURCE_CONFLICTS` rather than merged.
 */
export type LadderState =
  | 'under 80 percent'
  | 'at 80 percent'
  | 'at 100 percent'
  | 'in burst'
  | 'above 125 percent flagged'

export const LADDER_STATES = [
  'under 80 percent',
  'at 80 percent',
  'at 100 percent',
  'in burst',
  'above 125 percent flagged',
] as const satisfies readonly LadderState[]

type MissingLadderState = Exclude<LadderState, (typeof LADDER_STATES)[number]>
const _ladderStatesExhaustive: MissingLadderState extends never ? true : never = true
void _ladderStatesExhaustive

/** The four metered storage dimensions (L96973, L45356). */
export type StorageDimension =
  | 'evidence media'
  | 'workflow packages'
  | 'the parts registry'
  | 'training content'

export const STORAGE_DIMENSIONS = [
  'evidence media',
  'workflow packages',
  'the parts registry',
  'training content',
] as const satisfies readonly StorageDimension[]

type MissingStorageDimension = Exclude<StorageDimension, (typeof STORAGE_DIMENSIONS)[number]>
const _storageDimensionsExhaustive: MissingStorageDimension extends never ? true : never = true
void _storageDimensionsExhaustive

/** `OBJ-SA-LEDGEREVENT`'s five metering dimensions (L45352, L45404). */
export type MeteringDimensionId =
  | 'worker-shift'
  | 'agent-run'
  | 'tokens-by-router-role'
  | 'storage'
  | 'seat-or-device'

export interface MeteringDimension {
  readonly id: MeteringDimensionId
  /** The source's own name for the dimension. */
  readonly name: string
  /** A tenant-month count. Never a rate, never a per-person figure. */
  readonly countLabel: string
  readonly note: string
}

/**
 * Figures are seeded for the selected tenant-month only. Each is a COUNT
 * of events already folded to tenant-month; nothing here carries a finer
 * key, so no finer view can be built from it.
 */
export const METERING_DIMENSIONS = [
  {
    id: 'worker-shift',
    name: 'Worker-Shift',
    countLabel: '143 metered',
    note: 'One for each worker attached to work in one calendar shift, regardless of run count (AC-GOAL-060, L2241). Stored as a tenant-month total and held at that grain.',
  },
  {
    id: 'agent-run',
    name: 'Agent-run',
    countLabel: '4,812 metered',
    note: 'A count of runs folded to the tenant-month. An artificial-intelligence outage reduces what meters next; it never rewrites what was already metered.',
  },
  {
    id: 'tokens-by-router-role',
    name: 'Tokens by router role',
    countLabel: '11,940,600 tokens',
    note: 'Totalled across router roles for the tenant-month. The router-role catalog is owned by Platform Settings, not by this module.',
  },
  {
    id: 'storage',
    name: 'Storage',
    countLabel: '1,284 gigabyte-months',
    note: 'Broken out below across the four metered storage dimensions (L96973).',
  },
  {
    id: 'seat-or-device',
    name: 'Seat or device',
    countLabel: '37 registrations',
    note: 'A registration count, not a person count. The commercial model meters Worker-Shifts and not seats (DEC-SEAT-001, L17858).',
  },
] as const satisfies readonly MeteringDimension[]

type MissingMeteringDimension = Exclude<
  MeteringDimensionId,
  (typeof METERING_DIMENSIONS)[number]['id']
>
const _meteringDimensionsExhaustive: MissingMeteringDimension extends never ? true : never = true
void _meteringDimensionsExhaustive

/* ------------------------------------------------------------------ *
 * The usage ladder — four rungs (L2197, L45354, L57283, L96505).
 * ------------------------------------------------------------------ */

export interface LadderRung {
  readonly threshold: string
  readonly whatHappens: string
  /** Restated on every rung: a rung is a status, never an enforcement. */
  readonly outcome: string
  readonly sourceRef: string
}

export const LADDER_RUNGS = [
  {
    threshold: '80 per cent of the monthly allocation',
    whatHappens: 'An in-product banner renders on the tenant’s own surface.',
    outcome: 'A notice. Work continues untouched.',
    sourceRef: 'L2197, L57283',
  },
  {
    threshold: '100 per cent of the monthly allocation',
    whatHappens: 'An escalation notification fires.',
    outcome: 'A notification. The ceiling is not a stop.',
    sourceRef: 'L2197, L57283',
  },
  {
    threshold: '100 to 125 per cent — the burst-tolerance band',
    whatHappens:
      'Burst tolerance applies and a burst-entry event is recorded in the ledger as its own event.',
    outcome: 'The burst band does not stop the floor (AC-GOAL-064, L2241).',
    sourceRef: 'L2197, L45354, AC-SA-12-04 L45456',
  },
  {
    threshold: 'Above 125 per cent',
    whatHappens:
      'The tenant is flagged for a commercial conversation held outside the platform.',
    outcome: 'A flag. The platform does not stop the floor at a threshold (L2237).',
    sourceRef: 'L2197, L57283, L96505',
  },
] as const satisfies readonly LadderRung[]

/* ------------------------------------------------------------------ *
 * The cross-tenant usage table (SCR-SA-18, L42810 / L45385).
 *
 * One row per TENANT per MONTH. That is the finest grain that exists on
 * this surface, and the reason the table is safe: it compares commercial
 * accounts, which is what a ledger is for, and it names no worker, site,
 * area, shift or run at any point.
 * ------------------------------------------------------------------ */

export interface TenantMonthUsage {
  readonly tenantLabel: string
  /** The calendar month the count belongs to. Never finer. */
  readonly monthLabel: string
  readonly tierBand: string
  /** Worker-Shifts per month, from the published tier record. */
  readonly allocationCeiling: number
  /** Worker-Shifts metered in that month. A count, never a rate. */
  readonly workerShifts: number
  readonly ladderState: LadderState
  readonly sourceRef: string
}

export const TENANT_MONTH_USAGE = [
  {
    tenantLabel: saTenant('TEN-BRIGHTBIKES').name,
    monthLabel: 'July 2026',
    tierBand: 'Growth (100 to 199 Worker-Shifts per month)',
    allocationCeiling: 199,
    workerShifts: 143,
    ladderState: 'under 80 percent',
    sourceRef: 'L7631, L26900',
  },
  {
    tenantLabel: 'Riverside Plant',
    monthLabel: 'July 2026',
    tierBand: 'Enterprise (200 and above Worker-Shifts per month)',
    allocationCeiling: 200,
    workerShifts: 160,
    ladderState: 'at 80 percent',
    sourceRef: 'L45387, L15292',
  },
  {
    tenantLabel: 'Halden Tooling',
    monthLabel: 'July 2026',
    tierBand: 'Growth (100 to 199 Worker-Shifts per month)',
    allocationCeiling: 199,
    workerShifts: 199,
    ladderState: 'at 100 percent',
    sourceRef: 'L45244',
  },
  {
    tenantLabel: 'Kessler Werke',
    monthLabel: 'July 2026',
    tierBand: 'Enterprise (200 and above Worker-Shifts per month)',
    allocationCeiling: 200,
    workerShifts: 205,
    ladderState: 'in burst',
    sourceRef: 'L45387',
  },
  {
    tenantLabel: 'Northgate Assembly',
    monthLabel: 'July 2026',
    tierBand: 'Starter (under 100 Worker-Shifts per month)',
    allocationCeiling: 99,
    workerShifts: 128,
    ladderState: 'above 125 percent flagged',
    sourceRef: 'L45244, L96505',
  },
] as const satisfies readonly TenantMonthUsage[]

/** The tenant whose per-tenant ledger the screen opens on. */
export const LEDGER_TENANT_LABEL = 'Bright Bikes'

/* ------------------------------------------------------------------ *
 * Ladder events. A threshold event fires ONCE PER CROSSING, not once per
 * evaluation (WF-USAGE-LADDER, L117965), and burst entry is recorded as
 * its own event (AC-SA-12-04, L45456).
 * ------------------------------------------------------------------ */

export interface LadderEvent {
  readonly tenantLabel: string
  readonly monthLabel: string
  readonly event: string
  readonly sourceRef: string
}

export const LADDER_EVENTS = [
  {
    tenantLabel: 'Riverside Plant',
    monthLabel: 'July 2026',
    event: '80 per cent threshold crossing',
    sourceRef: 'L117965',
  },
  {
    tenantLabel: 'Kessler Werke',
    monthLabel: 'July 2026',
    event: '100 per cent threshold crossing',
    sourceRef: 'L117965',
  },
  {
    tenantLabel: 'Kessler Werke',
    monthLabel: 'July 2026',
    event: 'Burst entry',
    sourceRef: 'AC-SA-12-04, L45456',
  },
  {
    tenantLabel: 'Northgate Assembly',
    monthLabel: 'July 2026',
    event: 'Above 125 per cent — flagged for a commercial conversation',
    sourceRef: 'L96505',
  },
] as const satisfies readonly LadderEvent[]

/* ------------------------------------------------------------------ *
 * The four storage dimension series (storyboard SB-45-12-01, L97034).
 * ------------------------------------------------------------------ */

export interface StorageSeriesRow {
  readonly dimension: StorageDimension
  readonly monthLabel: string
  readonly volumeLabel: string
  /**
   * Meter drift (L97055): where a dimension's measured volume diverges
   * from the actual stored volume, the client is told the telemetry is
   * unreliable for that dimension rather than shown a number that is
   * wrong. STATE-10 turns this on.
   */
  readonly driftsUnderDegradation: boolean
}

export const STORAGE_SERIES = [
  {
    dimension: 'evidence media',
    monthLabel: 'July 2026',
    volumeLabel: '1,061 gigabyte-months',
    driftsUnderDegradation: true,
  },
  {
    dimension: 'workflow packages',
    monthLabel: 'July 2026',
    volumeLabel: '148 gigabyte-months',
    driftsUnderDegradation: false,
  },
  {
    dimension: 'the parts registry',
    monthLabel: 'July 2026',
    volumeLabel: '9 gigabyte-months',
    driftsUnderDegradation: false,
  },
  {
    dimension: 'training content',
    monthLabel: 'July 2026',
    volumeLabel: '66 gigabyte-months',
    driftsUnderDegradation: false,
  },
] as const satisfies readonly StorageSeriesRow[]

/* ------------------------------------------------------------------ *
 * Freshness. Fixture strings, never a computed clock.
 * ------------------------------------------------------------------ */

export const USAGE_AS_OF = 'as of 17 August 2026, 06:00 UTC'
export const USAGE_STALE_AS_OF = 'as of 16 August 2026, 06:00 UTC — stale, 26 hours old'
export const USAGE_ORIGIN = 'from the event-sourced usage ledger, folded to tenant-month'

/* ------------------------------------------------------------------ *
 * Prohibitions. Each is ABSENT: nothing is drawn, and a one-line note
 * sits where a control would be. None is a disabled control, because a
 * disabled control implies an enabled state exists somewhere.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const USAGE_ABSENT_CONTROLS = [
  {
    label: 'Invoicing, payment execution and pricing',
    note: 'No invoicing, payment execution or pricing capability exists anywhere on the platform, for any account including the root (AC-SA-12-02, L45456). The tier record carries no price metadata (L56912). Pricing and collection happen outside the platform (§4.6, L2773).',
  },
  {
    label: 'A breakdown of Worker-Shifts below the tenant',
    note: 'There is no breakdown of Worker-Shifts below the tenant-month on this console — no per-worker, per-site, per-area, per-shift or per-run view exists for any account including the root. A Worker-Shift is a billing unit on a commercial ledger; a finer cut of it is a measure of people, and this surface does not hold one.',
  },
  {
    label: 'A control that blocks work at a threshold',
    note: 'No ladder threshold blocks work; the strongest outcome is a flag (AC-SA-12-03, L45456). There is no stop, suspend or hard-cap control on this module for any account, so none is drawn.',
  },
  {
    label: 'Delete or purge on a storage surface',
    note: 'No delete or purge control exists on any storage-related surface — the absence is itself the control (L97037), and it is consistent with the platform’s no-purge model.',
  },
  {
    label: 'A drill-through from a usage figure to tenant records',
    note: 'No link resolves from a usage figure to record-level tenant content, for any account including the root (AC-SA-000-07, AC-SEC-801). Reaching tenant content needs a named access class, requested from Support Access.',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * Affordances the source does not define. Named, never invented: a
 * plausible invented control reads back as a requirement.
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const USAGE_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The ledger extract’s format, destination and cadence',
    note: 'L45385 names the export control, its two holders and that the export is itself audited. It names no file format, no destination system and no schedule, so none is offered and no destination picker is drawn.',
  },
  {
    affordance: 'The permitted range for a ladder threshold',
    note: 'The ladder is described as tunable per tenant (L2197) with defaults at 80, 100 and 125 per cent, but the source states no permitted minimum, maximum or ordering rule. The threshold form therefore validates against the three stated defaults only, and says so.',
  },
  {
    affordance: 'Re-derivation after a metering rule change',
    note: 'The metering workflow ends at "a metering rule change triggers reprocessing over the event stream" (L45360), but the source names no control, no actor and no trigger for that reprocessing. The terminal state is rendered; no button for it is.',
  },
  {
    affordance: 'Declaring a storage dimension’s telemetry unreliable',
    note: 'L97055 states that on meter drift the client is told the cost telemetry is unreliable for the affected dimension. It names no control that makes that declaration and no role that holds it, so the state is rendered and the control is not.',
  },
  {
    affordance: 'Whether the burst ceiling of 125 per cent is per tier or platform-wide',
    note: 'The tier record carries "threshold defaults" (L2195) and the ladder is called tunable per tenant (L2197); the source never says which of the two owns the 125 per cent burst ceiling. No editor is drawn for it either way.',
  },
  {
    affordance: 'A ladder for the four non-Worker-Shift metering dimensions',
    note: 'The ladder is defined against the monthly Worker-Shift allocation only (L2197, L45354). The source defines no threshold, no event and no banner for agent-runs, tokens, storage or registrations, so no ladder is drawn for them.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

/* ------------------------------------------------------------------ *
 * Conflicts in the source, stated rather than resolved silently.
 * ------------------------------------------------------------------ */

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const USAGE_SOURCE_CONFLICTS = [
  {
    topic: 'Two screen numbers for one module',
    conflict:
      'This module’s screen is SCR-SA-18 in one numbering scheme (L42810, L45385) and SCR-SA-15 in the other (L48744).',
    resolution:
      'D1 — names are canonical and the numbers are annotations only. Both are printed above; this route is keyed on the module slug, never on a number.',
  },
  {
    topic: 'Three ladder-state vocabularies',
    conflict:
      'OBJ-SA-LADDERSTATE gives five states at L45404; L4648 gives five short labels (below 80, 80, 100, burst, above 125); L26875 gives four Delivery Operations Hub tokens (below_80, at_or_above_80, at_or_above_100_burst, above_125_flagged).',
    resolution:
      'The SURF-SA-owned object wins: the five states at L45404 are the vocabulary rendered here. The other two are recorded, not merged.',
  },
  {
    topic: 'roles_allowed for this module differs in every chunk',
    conflict:
      'Admin alone (L2442, L4623); Admin, Support and Platform Engineer (L7694); root and Admin (L11669); root, Admin and Support (L21089); all four (L42746, L45389).',
    resolution:
      'D16 — module-level roles_allowed is authoritative nowhere. All four roles read every panel here; each control names its own holders from the line that defines it.',
  },
] as const satisfies readonly SourceConflict[]

/* ------------------------------------------------------------------ *
 * Workflows. The extraction attaches no `module_id` to any workflow, so
 * each row records HOW it was matched to MOD-SA-12.
 * ------------------------------------------------------------------ */

export interface UsageWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  /** The matching method, stated so a reviewer can check it. */
  readonly matchedBy: string
}

export const USAGE_WORKFLOWS = [
  {
    id: 'unnumbered — §23.12 usage metering (L45360)',
    name: 'Operational events to ledger, ladder, and export',
    actor: 'The usage ledger',
    trigger: 'Operational events occur across the five metering dimensions',
    terminalStates: [
      'exported to the client’s commercial systems',
      'flagged above 125 per cent',
      'reprocessed after a metering rule change',
    ],
    matchedBy:
      'line proximity — L45360 sits inside the MOD-SA-12 block whose module record is at L45389 and whose screens are at L45385',
  },
  {
    id: 'WF-USAGE-LADDER (L117965)',
    name: 'Evaluate the usage ladder',
    actor: 'IDENT-METER',
    trigger: 'A threshold crossing at 80, 100 or 125 per cent, plus burst entry',
    terminalStates: ['a threshold event fires once per crossing, not once per evaluation'],
    matchedBy:
      'screen co-location — the SB-SA-USAGE-01 storyboard at the same line, L117965, does carry module_id MOD-SA-12',
  },
  {
    // R4-N: this row used to carry the identifier `WF-LEDGER-EXPORT`, which
    // the frozen source does not carry at any line. It was minted by the extraction
    // (`registries/raw/extract/CHK-001.json`) for the workflow the source
    // introduces unnamed at L2765 as “Numbered workflow — from execution to
    // the client’s commercial system”. A build-invented identifier presented
    // as a source citation is worse than no identifier, so the row takes the
    // same unnumbered form as the §23.12 row above.
    id: 'unnumbered — §4.6 from execution to the client’s commercial system (L2765)',
    name: 'From execution to the client’s commercial system',
    actor: 'The client’s platform team',
    trigger: 'Workers execute and consumption meters',
    terminalStates: [
      'ledger exported; pricing, invoicing and collection happen outside the platform',
    ],
    matchedBy:
      'name — the export control this module owns (L45385) is the SURF-SA half of this workflow’s two surfaces. The extraction keys it WF-LEDGER-EXPORT, a name it minted rather than read: the frozen source introduces this workflow under no identifier at all',
  },
  {
    id: 'WF-SA-TIER-ASSIGN (L15838)',
    name: 'Attach a published tier',
    actor: 'Admin',
    trigger: 'A tenant crosses a usage ladder threshold',
    terminalStates: ['a published tier is attached to the tenant'],
    matchedBy:
      'trigger — the ladder crossing that starts it is metered here, but the workflow itself belongs to Tiers, Entitlements and Caps and is cross-referenced only',
  },
] as const satisfies readonly UsageWorkflow[]

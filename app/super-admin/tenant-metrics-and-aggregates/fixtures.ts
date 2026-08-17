import type { RoleId } from '@/domain/roles'

/**
 * MOD-SA-10 Tenant Metrics and Aggregates — the seeded fixtures this
 * module's screen steps through. No backend, no clock: every "as of" value
 * below is a fixture string, never a computed time (spec §8, and the
 * no-ambient-Date rule).
 *
 * Nothing here was invented to fill a panel. The frozen source fixes the
 * per-tenant measure COUNT at fifteen (L45134, L107244) but the extraction
 * available to this build names exactly one of them — the override-patterns
 * measure at `AC-SA-10-04` (L45230). The other fourteen are named as
 * unspecified rather than guessed: a plausible invented measure reads back
 * as a requirement, and on this module it would read back as a licence to
 * meter something the source never agreed to meter.
 */

/* ------------------------------------------------------------------ *
 * Closed vocabularies. `as const satisfies` keeps each member literal-
 * narrowed, so the exhaustiveness checks below are real rather than
 * vacuous.
 * ------------------------------------------------------------------ */

/** `OBJ-SA-METRIC` (L45179, L45180). Closed at four. */
export type MetricState = 'current' | 'stale' | 'unavailable' | 'reconciled'
export const METRIC_STATES = [
  'current',
  'stale',
  'unavailable',
  'reconciled',
] as const satisfies readonly MetricState[]
type MissingMetricState = Exclude<MetricState, (typeof METRIC_STATES)[number]>
const _metricStatesExhaustive: MissingMetricState extends never ? true : never = true
void _metricStatesExhaustive

/**
 * `OBJ-SA-DISTRIBUTION` is "derived, never authored" and the source gives it
 * NO states (L45179). It therefore has no state vocabulary here either — an
 * empty state list is a fact about the object, not a gap to fill.
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` identifiers are the plan's
 * annotation for the same four accounts `@/domain/roles` already carries.
 * The selector is a VIEW SWITCHER, not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface Sa10PlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

/**
 * The ONLY citations for "all four console roles read the per-tenant
 * measures". L45164 is this module's own §8.10 functions entry; L97152–L97155
 * are the four per-role permission rows. A module-level `roles_allowed` line
 * (L42744 for MOD-SA-10) is deliberately NOT here: D16 holds that entry
 * authoritative nowhere, so citing it beside D16 would contradict D16.
 *
 * The read decision and the STATE-05 banner both read this array, so the
 * grant and the citation printed for it cannot drift apart.
 */
export const SA10_READ_MEASURES_SOURCE_REFS = [
  'L45164',
  'L97152',
  'L97153',
  'L97154',
  'L97155',
] as const

export const SA10_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly Sa10PlatformRole[]

/* ------------------------------------------------------------------ *
 * Filters. Spec §6 / risk R5: the line holds at the tenant. The period
 * filter offers tenant-months and nothing finer, because a finer grain
 * offered once is a finer grain someone will ask to break down.
 * ------------------------------------------------------------------ */

export interface TenantMonth {
  readonly id: string
  readonly label: string
}

export const SA10_TENANT_MONTHS = [
  { id: '2026-06', label: '2026-06 (tenant-month)' },
  { id: '2026-07', label: '2026-07 (tenant-month)' },
  { id: '2026-08', label: '2026-08 (tenant-month)' },
] as const satisfies readonly TenantMonth[]

export interface Sa10Tenant {
  readonly id: string
  readonly name: string
}

/** Fixture tenants, drawn from the source's own illustrative cast. */
export const SA10_TENANTS = [
  { id: 'TEN-BRIGHT-BIKES', name: 'Bright Bikes' },
  { id: 'TEN-NORTHWIND-TOOLS', name: 'Northwind Tools' },
] as const satisfies readonly Sa10Tenant[]

/* ------------------------------------------------------------------ *
 * Measures.
 * ------------------------------------------------------------------ */

/** L45134 and L107244 both fix the count. Rendered as a fact, never as an
 *  inventory of fifteen invented names. */
export const SA10_MEASURE_COUNT = 15

export interface Sa10Measure {
  readonly id: string
  readonly name: string
  /** A COUNT on a tenant-month. Never a rate, never a division, never a
   *  proportion — spec §6. Rendered verbatim. */
  readonly value: string
  /** The census's third tile element, alongside value and completeness. */
  readonly comparisonWindow: string
  readonly completeness: string
  readonly asOf: string
  readonly origin: string
  readonly sourceRef: string
}

/**
 * The one per-tenant measure the extraction actually names: the
 * override-patterns measure `AC-SA-10-04` governs — "queryable for frequency
 * and clustering and never returns record contents" (L45230). Frequency is
 * rendered as a COUNT within the selected tenant-month; nothing is divided
 * by anything, because a division is the first step toward a rate and a rate
 * is the first step toward a person.
 */
export const SA10_MEASURES = [
  {
    id: 'override-patterns',
    name: 'Override patterns',
    value: '12 overrides recorded in the month',
    comparisonWindow: 'One tenant-month against the preceding tenant-month',
    completeness: 'Complete — no telemetry gap recorded in this window',
    asOf: 'As of 2026-08-01 00:00 UTC',
    origin: 'from the telemetry aggregation for the closed tenant-month',
    sourceRef: 'AC-SA-10-04, L45230',
  },
] as const satisfies readonly Sa10Measure[]

/** Clustering, the second half of `AC-SA-10-04`. Counts of overrides by the
 *  dimensions the cardinality allow-list permits — never a record, never a
 *  reason string, never a person. */
export interface Sa10Cluster {
  readonly dimension: string
  readonly count: string
}

export const SA10_OVERRIDE_CLUSTERS = [
  { dimension: 'Workflow definition, one version', count: '7 in the month' },
  { dimension: 'Severity level', count: '5 in the month' },
] as const satisfies readonly Sa10Cluster[]

/* ------------------------------------------------------------------ *
 * The anonymised comparative (OBJ-SA-DISTRIBUTION, L45179).
 * ------------------------------------------------------------------ */

export interface Sa10DistributionBand {
  readonly id: string
  /** No tenant is named, in any band, for any role including the root. */
  readonly band: string
  readonly tenantCount: string
}

export const SA10_DISTRIBUTION = [
  { id: 'band-low', band: 'Lower band', tenantCount: '4 tenants' },
  { id: 'band-middle', band: 'Middle band', tenantCount: '9 tenants' },
  { id: 'band-upper', band: 'Upper band', tenantCount: '3 tenants' },
] as const satisfies readonly Sa10DistributionBand[]

export const SA10_DISTRIBUTION_AS_OF = 'As of 2026-08-01 00:00 UTC'
export const SA10_DISTRIBUTION_ORIGIN =
  'from the anonymised aggregation for the closed tenant-month'
export const SA10_STALE_AS_OF = 'As of 2026-07-01 00:00 UTC — older than one tenant-month'
export const SA10_STALE_ORIGIN = 'from the last aggregation that completed'

/* ------------------------------------------------------------------ *
 * The observability cardinality allow-list (L107315). Rendered because it
 * is where the support-not-surveillance line is actually enforced: worker
 * identity is not a dimension the platform will carry at all, so no screen
 * can later be asked to break a measure down by one.
 * ------------------------------------------------------------------ */

export const SA10_PERMITTED_DIMENSIONS = [
  'tenant identifier',
  'surface',
  'module',
  'agent identifier',
  'atom identifier',
  'workflow identifier with version',
  'severity level',
  'access class',
  'outcome status',
] as const

export const SA10_PROHIBITED_DIMENSIONS = [
  'worker identity',
  'Unit or serial identifier',
  'Lot identifier',
  'Run identifier',
  'Step Execution identifier',
  'Data Capture identifier',
  'free-text reason strings',
  'any authored content value',
] as const

/* ------------------------------------------------------------------ *
 * Prohibitions rendered ABSENT — nothing drawn, a one-line note where a
 * control would be (spec §3).
 * ------------------------------------------------------------------ */

export interface Sa10AbsentControl {
  readonly label: string
  readonly note: string
}

export const SA10_ABSENT_CONTROLS = [
  {
    label: 'De-anonymise a comparative',
    note: 'No such control exists for any account, including the root. Anonymisation precedes aggregation as an enforced invariant, so there is no earlier state to return to and no approval path to one — absence is the control (AC-SA-10-03 L45230, L97560, L2143).',
  },
  {
    label: 'Open a record behind a measure',
    note: 'No drill-through from a measure to record-level tenant content exists here, for any role including the root. No metric, alert or dashboard is treated as audit evidence anywhere (AC-SA-000-07 L42885, AC-SEC-801 L104316, AC-4803 L107299).',
  },
  {
    label: 'Author or edit a measure or a distribution',
    note: 'Both objects are derived, never authored (L45179). Nothing on this console writes one, so no editing control is drawn for any role.',
  },
  {
    label: 'Return record contents from the override-audit query',
    note: 'The override audit answers frequency and clustering only and never returns record contents (AC-SA-10-04, L45230). The result shape carries no record, so there is no control to ask for one.',
  },
  {
    label: 'Break a measure down below the tenant-month',
    note: 'No per-worker, per-shift, per-run or sub-month series exists on this surface. Worker identity is not a dimension the platform carries at emission, and an emission carrying a prohibited dimension fails the build rather than being dropped later (L107315, AC-4810 L107368).',
  },
] as const satisfies readonly Sa10AbsentControl[]

/* ------------------------------------------------------------------ *
 * Workflows this module renders. MATCHING METHOD: the extraction carries
 * NO workflow with `module_id` MOD-SA-10, so both below were matched by
 * NAME and LINE PROXIMITY to the module's own source block — §8.10 spans
 * roughly L45134-L45230, and the module's second appearance is L107350.
 * ------------------------------------------------------------------ */

export interface Sa10Workflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly matchedBy: string
}

export const SA10_WORKFLOWS = [
  {
    id: 'unnumbered — §23.10 metrics derivation',
    name: 'Telemetry from tenant operations to layer-one and layer-two metrics',
    actor: 'Telemetry pipeline',
    trigger: 'Tenant operations generate events',
    terminalStates: [
      'rendered with as-of timestamps',
      'incident raised in MOD-SA-01',
      'reconciled after a telemetry gap with the degraded window recorded',
    ],
    matchedBy:
      'line proximity — L45140, inside this module’s own §8.10 block (L45134–L45230); the entry carries no module identifier',
  },
  {
    id: 'unnumbered — observability',
    name: 'Observability workflow for a single signal',
    actor: 'Emitting component',
    trigger: 'A component emits a signal with permitted dimensions only',
    terminalStates: [
      'aggregated and retained under metrics retention',
      'any question requiring proof leaves the observability path and is answered from the audit log',
    ],
    matchedBy:
      'line proximity — L107323, alongside the module’s second appearance at L107350; the entry carries no module identifier',
  },
] as const satisfies readonly Sa10Workflow[]

/* ------------------------------------------------------------------ *
 * Affordances the source does not define. Named, never invented.
 * ------------------------------------------------------------------ */

export interface Sa10Unspecified {
  readonly affordance: string
  readonly note: string
}

export const SA10_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The names of fourteen of the fifteen per-tenant measures',
    note: 'The source fixes the count at fifteen (L45134, L107244) and names exactly one — the override-patterns measure at AC-SA-10-04 (L45230). Fourteen tiles are not drawn from invented names: on this module in particular, an invented measure reads back as a licence to meter something nobody agreed to meter.',
  },
  {
    affordance: 'The identities of the five standard report data sets',
    note: 'DEC-REPORT-001 (L45138) is open and Client Decision Required. Until it is answered, what this console must not duplicate is undefined, so no report affordance is drawn.',
  },
  {
    affordance: 'The query control for the override audit',
    note: 'AC-SA-10-04 states the override audit is queryable for frequency and clustering, but names no control, no role list and no query form. The result shape is rendered; the query affordance is not invented.',
  },
  {
    affordance: 'An export of a measure or a comparative',
    note: 'No export control is named for this module either way. The usage-ledger export belongs to MOD-SA-12 (L45385). Nothing here is drawn as an export, and nothing here is drawn as an export refusal, because the source states neither.',
  },
  {
    affordance: 'The comparison window a tenant is measured against',
    note: 'The census fixes the tile shape as value, comparison window and completeness indicator, but the source does not state which window a comparative uses or how a peer group is formed. The window shown is a fixture label, not a stated rule.',
  },
  {
    affordance: 'Which console role, if any, may open a tenant’s own audit log view from a measure',
    note: 'L107350 attributes that onward action to the Platform Engineer alone, and this same surface puts tenant operational content in that role’s may-not list (L97154) while D17 holds the prohibition on a Platform Engineer session. No other console role is named for it anywhere. The grant is not moved to a role the source never names: the action is drawn absent, and the silence is named here.',
  },
  {
    affordance: 'A refresh or re-aggregate control',
    note: 'The metrics-derivation workflow ends at "reconciled after a telemetry gap with the degraded window recorded" (L45140), but names no operator-initiated re-aggregation. Recovery is rendered as a state, not as a button.',
  },
] as const satisfies readonly Sa10Unspecified[]

/* ------------------------------------------------------------------ *
 * Conflicts in the source, stated rather than resolved silently.
 * ------------------------------------------------------------------ */

export interface Sa10Conflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const SA10_CONFLICTS = [
  {
    topic: 'Who holds the two onward actions from a measure',
    conflict:
      'L107350 attributes both onward actions — open the tenant’s own audit log view, and request a support session — to the Platform Engineer. The same source puts tenant operational content in that role’s may-not list on this very surface (L97154), and D17 records the direct conflict between L20740, which forbids the Platform Engineer a support session, and L65401, which allows one.',
    resolution:
      'D17 holds: the prohibition wins, because Band A / Band B separation is the more restated principle and the narrower grant is the safer prototype. The two actions then part company. L107350 attributes the session request to the Platform Engineer AND to Support, so with the Platform Engineer held shut it still exists for one role: it renders drawn-and-inert, with its reason named, for every other role. L107350 attributes the audit-log view to the Platform Engineer alone, so with that role held shut it exists for nobody at all, and §3 reserves absence for exactly that — it is drawn as a note where a control would be. Neither action is attributed to the root or to the platform Admin anywhere in the source, so neither is granted to them here.',
  },
  {
    topic: 'A tenant’s own audit log is tenant content',
    conflict:
      'L107350 names "open the tenant’s own audit log view" as an onward action from a measure, while AC-SA-000-07 (L42885) and AC-SEC-801 (L104316) forbid record-level tenant content outside a named access class.',
    resolution:
      'The tension is not resolved by drawing the action: its one attributed role is refused on this surface, so it renders absent. Had a role carried it, it would still have resolved to the session-request form and never to the log itself — L107350 describes the other onward action, "request a support session", as the only route from a measure toward record-level content.',
  },
  {
    topic: 'Eight tabs versus seven on the tenant detail page',
    conflict:
      'The extraction records the count contradiction at L45126 inside this module’s block, though the tabs belong to MOD-SA-09.',
    resolution:
      'Not resolved here. D20 owns it in MOD-SA-09, and this module renders the two tabs SCR-SA-16 names and no others.',
  },
] as const satisfies readonly Sa10Conflict[]

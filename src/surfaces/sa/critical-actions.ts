/**
 * The critical-class actions that escalate to the root (`AC-WF-ROLE-018-01`:
 * "All ten critical actions route to the root; class cannot be downgraded").
 *
 * D12 / the source's own contradiction (extraction chunk CHK-017, L55942):
 * the passage is TITLED "The ten critical-class actions escalating to the
 * root" and a nearby numeric fact (L55963) states the value as ten — but the
 * `ordered_states` list at that same line names ELEVEN distinct items, with
 * "emergency pause" and "emergency resume" given as two separate entries.
 * The extraction's own `contradictions` array records this directly at
 * L55942: "described as 'the ten named critical actions' but the list as
 * written names eleven items."
 *
 * Per spec §4 D12: **build the eleven**, flag the discrepancy. A list short
 * by one silently drops a root approval — the source's arithmetic error is
 * not license to under-build the escalation surface.
 */
export type SaCriticalActionId =
  | 'tier-publication'
  | 'compliance-suspension'
  | 'all-tenant-broadcast'
  | 'device-wipe'
  | 'emergency-pause'
  | 'emergency-resume'
  | 'erasure-and-archival-execution'
  | 'retention-value-changes'
  | 'legal-hold-place-and-release'
  | 'severity-catalog-changes'
  | 'floor-register-changes'

export interface SaCriticalActionDefinition {
  readonly id: SaCriticalActionId
  readonly name: string
  readonly sourceRef: string
}

export const CRITICAL_ACTIONS = [
  { id: 'tier-publication', name: 'Tier publication', sourceRef: 'L55942, L56912' },
  { id: 'compliance-suspension', name: 'Compliance suspension', sourceRef: 'L55942, L55162' },
  { id: 'all-tenant-broadcast', name: 'All-tenant broadcast', sourceRef: 'L55942' },
  { id: 'device-wipe', name: 'Device wipe', sourceRef: 'L55942, L55965' },
  { id: 'emergency-pause', name: 'Emergency pause', sourceRef: 'L55942, L54979' },
  { id: 'emergency-resume', name: 'Emergency resume', sourceRef: 'L55942' },
  {
    id: 'erasure-and-archival-execution',
    name: 'Erasure and archival execution',
    sourceRef: 'L55942',
  },
  { id: 'retention-value-changes', name: 'Retention-value changes', sourceRef: 'L55942' },
  {
    id: 'legal-hold-place-and-release',
    name: 'Legal-hold place and release',
    sourceRef: 'L55942',
  },
  { id: 'severity-catalog-changes', name: 'Severity-catalog changes', sourceRef: 'L55942' },
  { id: 'floor-register-changes', name: 'Floor-register changes', sourceRef: 'L55942' },
] as const satisfies readonly SaCriticalActionDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `SaCriticalActionId` gains or
// loses a member that `CRITICAL_ACTIONS` does not list exactly once.
type MissingFromCriticalActions = Exclude<SaCriticalActionId, (typeof CRITICAL_ACTIONS)[number]['id']>
const _criticalActionsExhaustive: MissingFromCriticalActions extends never ? true : never = true
void _criticalActionsExhaustive

/** D12: the discrepancy, stated for a reviewer, never resolved silently. */
export const CRITICAL_ACTION_COUNT_NOTE =
  'The frozen source titles this list "the ten critical-class actions" and states the value as ten (L55963), but the enumeration at L55942 names eleven distinct items — emergency pause and emergency resume are given as two separate entries. This registry carries all eleven the source actually enumerates; none were added to reach a round number, and none were dropped to match the stated count.'

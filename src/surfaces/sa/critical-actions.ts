/**
 * The critical-class actions that escalate to the root. `AC-WF-ROLE-018-01`
 * (L55969) — "All ten critical actions route to the root." The class-downgrade
 * rule is a second criterion beside it, `AC-WF-ROLE-018-02` "Class cannot be
 * downgraded." (L55969), and the two are not one sentence; an earlier revision
 * here quoted them joined by a semicolon, which the source does not write.
 *
 * ── D12: eleven, and why that is a reading rather than a fact ─────────────
 *
 * **Derived Clarification.** The eleven-item list below is this build's
 * reading of a source that contradicts itself, not a count the source states.
 *
 * The evidence it is derived FROM. In words the source says ten, repeatedly
 * and in four separate chapters: L4964, L21015, L55963 and L55969. Wherever
 * it writes the enumeration out, the list runs to eleven. L55942 names them
 * with "emergency pause and resume" run together as one phrase, which is what
 * lets the count read as ten. L15360 writes the same enumeration and settles
 * the ambiguity in the source's own voice, listing "emergency pause and
 * resume separately" (L15360) inside a sentence that opens "Approves the ten
 * critical-class actions". A list whose own wording says two items are
 * separate cannot also be a list of ten.
 *
 * The reading taken: eleven. The source itself says pause and resume are
 * separate acts, and a registry short by one silently drops a root approval —
 * an under-built escalation surface is the failure that costs something,
 * where an over-built one is merely wrong about arithmetic.
 *
 * The competing reading: ten, treating pause-and-resume as a single critical
 * action so that the stated count holds and L55942's phrasing is taken at
 * face value. That reading leaves resume without an approval gate of its own,
 * which L15360 contradicts. It is recorded rather than settled in silence,
 * and `CRITICAL_ACTION_COUNT_NOTE` renders it on every screen that draws the
 * list.
 *
 * The build's extraction reached the same finding independently, and its
 * words are ITS words: the `contradictions` entry it holds against line 55942
 * reads "The critical-action enumeration is described as ‘the ten named
 * critical actions’ but the list as written names eleven items", and the
 * `state_vocabularies` entry beside it supplies the eleven-item
 * `ordered_states` array under the coined name "The ten critical-class
 * actions escalating to the root". Both live in
 * `registries/raw/extract/CHK-017.json`. Neither sentence appears in the
 * frozen source, and neither is cited to a frozen-source line here.
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
  'Derived Clarification, not a stated count. In words the frozen source says ten (L4964, L21015, L55963), but every enumeration it writes out names eleven distinct items: L55942 runs emergency pause and resume together into one phrase, while L15360 writes the same list as "emergency pause and resume separately" (L15360) in a sentence that still calls them the ten critical-class actions. This registry carries all eleven, because the source itself says pause and resume are separate acts and a list short by one silently drops a root approval. The competing reading — ten, with pause-and-resume as a single action — is recorded here rather than settled in silence. None were added to reach a round number, and none were dropped to match the stated count.'

/**
 * The six ENFORCED invariants (frozen source L2143). They render "locked
 * with no off position for any account including the root" (`AC-GOAL-051`,
 * L2181), and `AC-SA-INV-003` (L47849) forbids an off control, an approval
 * path AND a configuration key for any of them, on any screen.
 *
 * Spec §3 (the single most load-bearing decision in this slice): these
 * render as the ABSENT rendering — a status chip, never a control. See
 * `@/ui/sa/InvariantChip`.
 */
export type SaInvariantId =
  | 'evaluation-gate'
  | 'sandbox-before-publish'
  | 'encryption-at-rest'
  | 'encryption-in-transit'
  | 'cross-tenant-analytics-anonymisation'
  | 'one-transaction-audit-guarantee'

export interface SaInvariantDefinition {
  readonly id: SaInvariantId
  readonly name: string
  /** Plain language: what is enforced, and why no off position exists. */
  readonly description: string
  readonly sourceRef: string
}

export const SA_INVARIANTS = [
  {
    id: 'evaluation-gate',
    name: 'The evaluation gate',
    description:
      'A capability with a pending or failing evaluation scenario cannot be enabled, for any account.',
    sourceRef: 'L2143, L65361',
  },
  {
    id: 'sandbox-before-publish',
    name: 'Sandbox-before-publish',
    description: 'Nothing reaches a tenant without first running in the sandbox.',
    sourceRef: 'L2143',
  },
  {
    id: 'encryption-at-rest',
    name: 'Encryption at rest',
    description: 'Stored data is encrypted, with no account holding a control to switch it off.',
    sourceRef: 'L2143',
  },
  {
    id: 'encryption-in-transit',
    name: 'Encryption in transit',
    description: 'Data moving across the platform is encrypted, with no account holding a control to switch it off.',
    sourceRef: 'L2143',
  },
  {
    id: 'cross-tenant-analytics-anonymisation',
    name: 'Cross-tenant analytics anonymisation',
    description:
      'Anonymisation precedes aggregation for every cross-tenant comparative, and cannot be disabled by any account including the root.',
    sourceRef: 'L2143, L45179, L97560',
  },
  {
    id: 'one-transaction-audit-guarantee',
    name: 'The one-transaction audit guarantee',
    description:
      'A state transition and its audit record commit in the same transaction — the platform never writes one without the other.',
    sourceRef: 'L2143, AC-SA-01-08 L43075',
  },
] as const satisfies readonly SaInvariantDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `SaInvariantId` gains or loses
// a member that `SA_INVARIANTS` does not list exactly once.
type MissingFromInvariants = Exclude<SaInvariantId, (typeof SA_INVARIANTS)[number]['id']>
const _invariantsExhaustive: MissingFromInvariants extends never ? true : never = true
void _invariantsExhaustive

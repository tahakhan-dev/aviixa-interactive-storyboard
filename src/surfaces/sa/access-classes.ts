/**
 * The three named access classes — the only route to tenant content
 * (frozen source L4612, L14777). "No ambient browsing exists anywhere on
 * the console" (`AC-SA-005`, L11710).
 */
export type SaAccessClassId =
  | 'normal-support-session'
  | 'compliance-emergency-path'
  | 'jbs-access-grant'

export interface SaAccessClassDefinition {
  readonly id: SaAccessClassId
  readonly name: string
  readonly description: string
  readonly sourceRef: string
}

export const ACCESS_CLASSES = [
  {
    id: 'normal-support-session',
    name: 'The normal support session',
    description:
      'Read-only without exception — "a data repair is not support" (L16022). The tenant ends it from its own banner.',
    sourceRef: 'L4612, L9966, L16022',
  },
  {
    id: 'compliance-emergency-path',
    name: 'The compliance-emergency path',
    description:
      'Requires two named authorisations. Writes into tenant data are only ever made through this path.',
    sourceRef: 'L4612, L14777',
  },
  {
    id: 'jbs-access-grant',
    name: 'The JBS access grant',
    description:
      'No standing access. Every touch is scoped, time-boxed, reason-linked, audited and mirrored.',
    sourceRef: 'L4612, L14777',
  },
] as const satisfies readonly SaAccessClassDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `SaAccessClassId` gains or
// loses a member that `ACCESS_CLASSES` does not list exactly once.
type MissingFromAccessClasses = Exclude<SaAccessClassId, (typeof ACCESS_CLASSES)[number]['id']>
const _accessClassesExhaustive: MissingFromAccessClasses extends never ? true : never = true
void _accessClassesExhaustive

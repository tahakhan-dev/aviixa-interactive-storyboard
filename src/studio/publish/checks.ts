/**
 * S3 — the eleven publish-time checks, as data.
 *
 * Publish-time validation on `SURF-STU` is a **fail-closed gate set, not a
 * warning set** (frozen source L48330): "`STATE-04` validation on this
 * surface carries a special weight: the locale completeness check and the
 * missing-severity-mapping check are publication blockers, not warnings."
 *
 * C4 — this registry exists so that **no check is implemented twice**. The
 * Workflow Builder's live validation panel and the publish path both READ
 * it; a module implementing a sibling's check is a defect. `ownerModules`
 * below is the authority on which module owns which check.
 *
 * There is deliberately no way to publish past a failed check. `FB-STU-09`
 * (L31453) states the terminal safe state as "Nothing published; prior
 * version remains in force", and this build's own rule is that a fallback
 * may never weaken a gate, a hold or an approval — so no definition here
 * carries a waiver, an acknowledgement, or a severity below "blocks".
 */

export type PublishCheckId =
  | 'structural-validity'
  | 'severity-mapping'
  | 'capture-type'
  | 'specification-limits'
  | 'coaching-default-per-locale'
  | 'locale-completeness'
  | 'library-pointer'
  | 'certification-maintained'
  | 'capability-dependency'
  | 'severity-one-arming'
  | 'chain-staffable'

/**
 * How the source classifies the check's own words. `SoW Fact` where the
 * cited line states a publication block outright; `Derived Clarification`
 * where this build has read a save-time or submission-time refusal forward
 * to publication. The difference renders — it is not resolved silently.
 */
export type PublishCheckSourceClass = 'SoW Fact' | 'Derived Clarification'

export interface PublishCheckDefinition {
  readonly id: PublishCheckId
  /** 1..11, the order S3 states them in and the order evaluation runs in. */
  readonly ordinal: number
  /** The check, in the words the design specification uses for it. */
  readonly name: string
  /** What a failure refuses, in the frozen source's own words. */
  readonly refuses: string
  /** What the blocking element must NAME. A message that names nothing is a defect. */
  readonly namesElement: string
  /** Frozen-source line locators. */
  readonly sourceRef: string
  readonly sourceClass: PublishCheckSourceClass
  /** Where the source's wording and this registry's placement differ. */
  readonly note: string | null
  /** The module(s) that register the implementation. Nobody else may implement it. */
  readonly ownerModules: readonly string[]
  /** The fallback contract the source attaches, or null where it names none. */
  readonly fallbackContract: string | null
}

export const PUBLISH_CHECKS = [
  {
    id: 'structural-validity',
    ordinal: 1,
    name: 'Structural validity — every node reachable, every branch target resolvable, exactly one entry point',
    refuses:
      'Publication of a Workflow whose canvas would put an unreachable screen or a dangling branch on the floor.',
    namesElement: 'the unreachable node or the unresolvable branch target',
    sourceRef: 'L32101 (FUNC-STU-04-02-B-2)',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-04'],
    fallbackContract: 'FB-STU-09',
  },
  {
    id: 'severity-mapping',
    ordinal: 2,
    name: 'A severity mapping on every screen that can deviate',
    refuses:
      'Publication where a measurement screen carries no mapping covering an out-of-tolerance reading, because the on-device classifier would have no band to classify into.',
    namesElement: 'the screen with no severity mapping',
    sourceRef: 'L32308 (FUNC-STU-05-08-A-2), L48330',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-05'],
    fallbackContract: 'FB-STU-07',
  },
  {
    id: 'capture-type',
    ordinal: 3,
    name: 'A capture type inside the adopted seven',
    refuses:
      'Publication of a capture type outside the adopted DEC-CAP-001 set of seven, because publishing a type the device cannot render would strand a worker mid-Run.',
    namesElement: 'the offending capture type and the screen carrying it',
    sourceRef: 'L32291 (FUNC-STU-05-03-A-1)',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-05'],
    fallbackContract: 'FB-STU-09',
  },
  {
    id: 'specification-limits',
    ordinal: 4,
    name: 'Specification limits complete with unit and drawing reference on every measurement screen',
    refuses:
      'Publication of a measurement screen with no limits, because the specification gate would have nothing to check against.',
    namesElement: 'the measurement screen and the missing field',
    sourceRef: 'L32301 (FUNC-STU-05-06-A-1)',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-05'],
    fallbackContract: 'FB-STU-09',
  },
  {
    id: 'coaching-default-per-locale',
    ordinal: 5,
    name: 'A curated coaching default per declared locale',
    refuses: 'Publication in a declared locale whose curated coaching default is missing.',
    namesElement: 'the locale with no designated default',
    sourceRef: 'L32304 (FUNC-STU-05-07-A-1)',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-05'],
    fallbackContract: 'FB-STU-04',
  },
  {
    id: 'locale-completeness',
    ordinal: 6,
    name: 'Locale completeness across every worker-facing element',
    refuses:
      'Publication where a worker-facing element is absent in a declared locale — "the one check that stands between a declared locale and a blank screen on the floor".',
    namesElement: 'the worker-facing element and the locale it is missing from',
    sourceRef: 'L34409 (FUNC-STU-17-03-A-1), AC-STU-149 L34487',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-17'],
    fallbackContract: 'FB-STU-09',
  },
  {
    id: 'library-pointer',
    ordinal: 7,
    name: 'Every library pointer resolvable',
    refuses:
      'Publication carrying an unresolvable pointer, "rather than rendering an empty section"; an unresolvable part reference blocks submission, "because a package carrying an unresolvable part reference would break the consumption record".',
    namesElement: 'the step and the pointer — block title, asset or part name — that will not resolve',
    sourceRef: 'L32483 (FUNC-STU-06-02-A-1), L33211',
    sourceClass: 'SoW Fact',
    note:
      'L32483 states a publication block; L33211 states a SUBMISSION block for the part-reference half. Both are carried here as one check because both refuse the same thing — an unresolvable pointer reaching the floor — and the earlier of the two stages governs.',
    ownerModules: ['MOD-STU-06', 'MOD-STU-07', 'MOD-STU-10'],
    fallbackContract: 'FB-STU-04',
  },
  {
    id: 'certification-maintained',
    ordinal: 8,
    name: 'Every named certification still maintained',
    refuses:
      'Publication of an override naming a certification the tenant does not maintain.',
    namesElement: 'the certification and the screen whose override names it',
    sourceRef: 'L32321 (FUNC-STU-05-10-A-1)',
    sourceClass: 'SoW Fact',
    note: null,
    ownerModules: ['MOD-STU-13'],
    fallbackContract: 'FB-STU-09',
  },
  {
    id: 'capability-dependency',
    ordinal: 9,
    name: 'Every capability dependency satisfiable',
    refuses:
      'Publication of any Workflow whose screens depend on a capability the tenant has disabled.',
    namesElement: 'the dependent screens',
    sourceRef: 'L30782 (AC-STU-007)',
    sourceClass: 'SoW Fact',
    note: 'The source states this as an acceptance criterion rather than as a fallback-bearing function, so no FB-STU contract is claimed for it.',
    ownerModules: ['MOD-STU-01'],
    fallbackContract: null,
  },
  {
    id: 'severity-one-arming',
    ordinal: 10,
    name: 'A recorded Severity 1 arming confirmation',
    refuses:
      'Publication of a band mapped to Severity 1 with no recorded author confirmation, because Severity 1 arms an automatic lot hold releasable only by a Quality Manager and "no author arms the platform’s strongest reflex by accident".',
    namesElement: 'the band and the screen whose Severity 1 mapping carries no confirmation',
    sourceRef: 'L32313 (FUNC-STU-05-08-C-1)',
    sourceClass: 'Derived Clarification',
    note:
      'FINDING. L32313 states a SAVE-time refusal under FB-STU-10 — "if the confirmation cannot be recorded, the mapping is not saved" — and does not itself state a publication block. Carrying it as publish check 10 reads that refusal forward: a Severity 1 mapping that reached storage without a confirmation must not reach the floor. The stricter reading is the safe direction, and the divergence renders rather than being resolved silently.',
    ownerModules: ['MOD-STU-05'],
    fallbackContract: 'FB-STU-10',
  },
  {
    id: 'chain-staffable',
    ordinal: 11,
    name: 'A staffable chain',
    refuses:
      'A submission that cannot be completed, and therefore any version, package or Job linkage downstream of it — FB-SEQ-012’s one-person quality team.',
    namesElement: 'the shortfall — which chain stage has no eligible distinct holder',
    sourceRef: 'L33307 (FUNC-STU-11-02-A-2), FB-SEQ-012 L68262',
    sourceClass: 'Derived Clarification',
    note:
      'FINDING. L33307 states the check runs "before submission", not before publication, and the source classes the function itself `Client Decision Required` under DEC-RELAUTH-001. It is carried here because a submission that cannot be staffed can never publish: "work does not get published faster, it does not get published at all" (L68291). The open decision is named rather than answered.',
    ownerModules: ['MOD-STU-11'],
    fallbackContract: 'FB-STU-09',
  },
] as const satisfies readonly PublishCheckDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `PublishCheckId` gains or
// loses a member that `PUBLISH_CHECKS` does not list exactly once.
type MissingFromPublishChecks = Exclude<PublishCheckId, (typeof PUBLISH_CHECKS)[number]['id']>
const _publishChecksExhaustive: MissingFromPublishChecks extends never ? true : never = true
void _publishChecksExhaustive

const BY_ID = new Map<PublishCheckId, PublishCheckDefinition>(
  PUBLISH_CHECKS.map((c) => [c.id, c]),
)

export function publishCheckById(id: PublishCheckId): PublishCheckDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown publish check: ${id}`)
  return found
}

/** The checks a given module owns. A module implementing anything else is a defect (C4). */
export function publishChecksOwnedBy(moduleId: string): readonly PublishCheckDefinition[] {
  return PUBLISH_CHECKS.filter((c: PublishCheckDefinition) => c.ownerModules.includes(moduleId))
}

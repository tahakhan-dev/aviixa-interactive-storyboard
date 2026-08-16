/**
 * Coverage status vocabulary and the fourteen registry descriptors the
 * master prompt names. Consolidated in one file deliberately: the status
 * vocabulary is four string literals and one counting function, and a
 * separate `status.ts` for that would be exactly the speculative scaffolding
 * this project has already removed elsewhere (an unused `LinkButton`
 * primitive, three unwired object stores).
 */

/**
 * Deliberately none of these reads as `implemented` or `complete` — this
 * application has no backend, so either word would claim a production
 * capability that does not exist. A status here says only what the
 * storyboard itself shows: something was demonstrated, a client decision
 * blocks it, it does not apply, or it is not represented at all.
 */
export type CoverageStatus =
  | 'demonstrated-in-storyboard'
  | 'decision-blocked'
  | 'not-applicable'
  | 'not-represented'

// Controller addendum (registries, §7-8): a plain `readonly CoverageStatus[]`
// annotation WIDENS the literal array back to the union type, which makes
// `(typeof COVERAGE_STATUSES)[number]` collapse to plain `CoverageStatus` and
// any exhaustiveness check below type-check unconditionally, whether or not
// the array actually lists every member -- the same defect this build
// already shipped once for a different const (see `_AssertReviewStatusesExhaustive`
// in `@/review/records.ts` and `CONNECTIVITY_MODES` in `@/scenario/controls.ts`).
// `as const satisfies readonly CoverageStatus[]` keeps the literal tuple type
// while still verifying every element is a valid `CoverageStatus`.
export const COVERAGE_STATUSES = [
  'demonstrated-in-storyboard',
  'decision-blocked',
  'not-applicable',
  'not-represented',
] as const satisfies readonly CoverageStatus[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `CoverageStatus` gains or
// loses a member that `COVERAGE_STATUSES` does not list exactly once.
type MissingFromCoverageStatuses = Exclude<CoverageStatus, (typeof COVERAGE_STATUSES)[number]>
const _coverageStatusesExhaustive: MissingFromCoverageStatuses extends never ? true : never = true
void _coverageStatusesExhaustive

/**
 * One row describing a source-derived inventory. `expectedCount` is `null`
 * unless `registries/generated/source-reconciliation.json` fixes a single
 * closed number for it — most of these fourteen names cover more than one
 * ambiguous or overlapping identifier namespace in the frozen source, and
 * asserting one count for them would be exactly the kind of unearned
 * precision this slice's honesty requirement forbids. `sourceNote` carries
 * the reconciliation verdict so the screen can show why a number is what it
 * is (or why there isn't one).
 */
/** The closed fourteen registry slugs the master prompt names. */
export type RegistrySlug =
  | 'modules'
  | 'features'
  | 'sub-features'
  | 'functions'
  | 'workflows'
  | 'business-use-cases'
  | 'business-objects'
  | 'events'
  | 'commands'
  | 'notifications'
  | 'offline-scenarios'
  | 'ai-storyboards'
  | 'scheduled-work'
  | 'actionable-controls'

export interface RegistryDescriptor {
  readonly slug: RegistrySlug
  readonly title: string
  readonly idPrefix: string
  readonly expectedCount: number | null
  readonly sourceNote: string
}

// Same widening hazard and same fix as `COVERAGE_STATUSES` above: `as const
// satisfies` keeps every `slug` literal narrowed to `RegistrySlug`, so the
// exhaustiveness check just below is a real compile-time proof that all
// fourteen slugs are present exactly once, not two strings that happen to
// coincide today.
export const REGISTRY_DESCRIPTORS = [
  {
    slug: 'modules',
    title: 'Modules',
    idPrefix: 'MOD-',
    expectedCount: 81,
    sourceNote:
      '81 canonical modules: 19 Super Admin + 19 Delivery Operations Hub + 13 Command Center ' +
      '+ 12 Frontline (SoW Fact) + 18 Studio (Derived Clarification, DEC-STUDIO-001). ' +
      'MOD-SA-20 is a denied alias, not a module (source-reconciliation.json).',
  },
  {
    slug: 'features',
    title: 'Features',
    idPrefix: 'FEAT-',
    expectedCount: null,
    sourceNote:
      'No closed feature-count register exists in the frozen source; FEAT-* identifiers are ' +
      'scoped per surface (FEAT-SA, FEAT-DOH, FEAT-STU, ...) with no published cross-surface total.',
  },
  {
    slug: 'sub-features',
    title: 'Sub-features',
    idPrefix: 'SUB-',
    expectedCount: null,
    sourceNote:
      'No closed sub-feature total; SUB-* identifiers are scoped per surface ' +
      '(SUB-DOH, SUB-CC, SUB-SA, SUB-STU, ...) with no published cross-surface total.',
  },
  {
    slug: 'functions',
    title: 'Functions',
    idPrefix: 'FUNC-',
    expectedCount: null,
    sourceNote:
      'No closed function total; FUNC-* identifiers are scoped per surface ' +
      '(FUNC-SA, FUNC-CC, FUNC-DOH, FUNC-STU, ...) with no published cross-surface total.',
  },
  {
    slug: 'workflows',
    title: 'Workflows',
    idPrefix: 'WF-',
    expectedCount: null,
    sourceNote:
      'The source fixes no workflow total anywhere in 122,241 lines. 81 is the MODULE count ' +
      'and nothing else; conflating the two is a named implementation risk in ' +
      'source-reconciliation.json. Real closed workflow-shaped sets exist instead: 8 critical ' +
      'workflows, 33 master sequences, 20 handoffs (UC-HO-01..20).',
  },
  {
    slug: 'business-use-cases',
    title: 'Business Use Cases',
    idPrefix: 'UC-',
    expectedCount: null,
    sourceNote:
      'The UC-* namespace is a family of role-scoped registers (UC-WKR, UC-SUP, UC-TADM, ' +
      'UC-HO, ...), not one closed count across roles.',
  },
  {
    slug: 'business-objects',
    title: 'Business Objects',
    idPrefix: 'OBJ-',
    expectedCount: 99,
    sourceNote:
      '99 object cards OBJ-001..OBJ-099 in Chapter 7, confirmed with zero delta against the ' +
      'canonical catalogue. The 382-identifier assembled total includes mnemonic pointers ' +
      '(e.g. OBJ-SURFACE) into the same 99 concepts, not a second catalogue ' +
      '(source-reconciliation.json).',
  },
  {
    slug: 'events',
    title: 'Events',
    idPrefix: 'EVT-',
    expectedCount: null,
    sourceNote:
      'No closed event-count register exists; the EVT-* namespace mixes two separate numeric ' +
      'sequences and a large mnemonic set across chapters.',
  },
  {
    slug: 'commands',
    title: 'Commands',
    idPrefix: 'CMD-',
    expectedCount: null,
    sourceNote:
      'The source fixes 5 command classes, but 16 command instances and 57 CMD-* identifiers ' +
      'are separate, larger registers; this descriptor does not assert one count across the three.',
  },
  {
    slug: 'notifications',
    title: 'Notifications',
    idPrefix: 'NOTIF-',
    expectedCount: null,
    sourceNote:
      'Ambiguous across scopes the source keeps separate: 19 notification states, 87 categories ' +
      'in 13 families, 2 channels.',
  },
  {
    slug: 'offline-scenarios',
    title: 'Offline Scenarios',
    idPrefix: 'UC-OFF-',
    expectedCount: 70,
    sourceNote:
      '70 exactly: UC-OFF-001..UC-OFF-070, verified unique, confirmed with zero delta ' +
      '(source-reconciliation.json).',
  },
  {
    slug: 'ai-storyboards',
    title: 'AI Storyboards',
    idPrefix: 'SB-AI-',
    expectedCount: null,
    sourceNote:
      'Two distinct thirty-item registers exist (SB-001..030 platform walkthroughs and ' +
      'SB-AI-01..30 AI/fallback storyboards) plus SB-031..033; the source does not fix one ' +
      'combined count.',
  },
  {
    slug: 'scheduled-work',
    title: 'Scheduled Work',
    idPrefix: 'SCHED-',
    expectedCount: null,
    sourceNote:
      'The discovery count (35 findings) and the buildable count (24 deployable obligations) ' +
      'diverge; the source does not fix one candidate count for scheduled work.',
  },
  {
    slug: 'actionable-controls',
    title: 'Actionable Controls',
    // Fix round 1: this registry is the semantic `controls[]` extraction --
    // labelled UI actions like "End-session", "Resolve All" -- not the
    // DNC-* do-not-use-cron register. It has no identifier prefix; rows are
    // keyed on their exact label text, because the frozen source never gave
    // these actions an id at all.
    idPrefix: '',
    expectedCount: 608,
    sourceNote:
      '608 distinct actionable UI controls, deduped by exact label text from 759 raw ' +
      'extraction entries (spec §2.10). The separate DNC-01..DNC-22 do-not-use-cron register ' +
      '(22, verified unique, zero delta) — controls that must always remain a live human ' +
      'decision and may never be enforced by a scheduled sweep — is disclosed on this same ' +
      'index under its own register label, never merged into the 608 ' +
      '(source-reconciliation.json).',
  },
] as const satisfies readonly RegistryDescriptor[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `RegistrySlug` gains or loses a
// member that `REGISTRY_DESCRIPTORS` does not list exactly once.
type MissingFromRegistryDescriptors = Exclude<
  RegistrySlug,
  (typeof REGISTRY_DESCRIPTORS)[number]['slug']
>
const _registryDescriptorsExhaustive: MissingFromRegistryDescriptors extends never
  ? true
  : never = true
void _registryDescriptorsExhaustive

/** Every status key is present, so a zero renders as a zero rather than an absent row. */
export function countByStatus(
  entries: readonly { readonly status: CoverageStatus }[],
): Record<CoverageStatus, number> {
  const counts = Object.fromEntries(COVERAGE_STATUSES.map((status) => [status, 0])) as Record<
    CoverageStatus,
    number
  >
  for (const entry of entries) {
    counts[entry.status] += 1
  }
  return counts
}

/**
 * THE WORK-PACKAGE LIFECYCLE — §35.1, "The work-package lifecycle end to end",
 * heading at L79041.
 *
 * A package has stages, and the point of naming them is stated at L79047:
 * "Naming twenty-one lifecycle stages is not bureaucracy; it is what makes the
 * honesty rules of Chapter 34 enforceable for content."
 *
 * ── FOUR COUNTS FOR ONE LIFECYCLE, ALL MEASURED, NONE TIDIED ───────────────
 * The section describes its own machine four times and the four do not agree.
 * Every number below was counted out of the frozen source, not taken from the
 * dispatch, and the covering suite re-counts all four rather than trusting
 * this comment:
 *
 *     21   named stages, in prose            L79049, one sentence
 *     18   states in the state diagram       L79073-L79090
 *     16   steps in the numbered workflow    L79053-L79068
 *     13   rows in the stage-authority matrix L79126-L79138
 *
 * THE 21-TO-18 GAP RECONCILES EXACTLY, and it reconciles in the source's own
 * words rather than by this build's arithmetic:
 *
 *   - Signing has no state of its own because the diagram FOLDS it into
 *     manifest creation — L79078 reads `Manifested : Manifested - manifest
 *     created and signed`. `STAGE_TO_STATE` sends both stages there.
 *   - Rollback has no state at all. Its own clause says why: the source
 *     "addresses for content versioning but not for a deployed package on a
 *     device", so there is nothing to draw.
 *   - Reconciliation has no state at all. It is telemetry about a package that
 *     has already left the machine.
 *
 * 21 - 1 fold - 2 unstated = 18. `STAGE_TO_STATE` is a total record so the
 * three nulls are declared rather than missing, and a gate counts them.
 *
 * The 16-step and 13-row counts are NOT reconciled here and must not be. The
 * workflow collapses stages into steps and the matrix collapses them into
 * authority rows on different seams — the matrix's row 6 is "Manifest creation
 * and signing" and its row 9 is "Activation and pinning" — so a mapping either
 * way would be this build's reading of a join the source never wrote.
 * `LIFECYCLE_COUNTS` records all four numbers with their locators and asserts
 * no single count is the count.
 *
 * ── WHAT IS SoW FACT HERE AND WHAT IS NOT ──────────────────────────────────
 * Per stage, off the stage's own clause. L79159 states the split for the
 * section: authoring, validation, approval, publication, generation, delivery,
 * pinning, storage discipline and reconciliation telemetry are `SoW Fact`;
 * "Manifest creation, signing, explicit integrity validation, revocation,
 * expiry, corruption handling, incompatible-version handling and rollback are
 * `Not specified in the Statement of Work`". `status` is therefore read off
 * the clause, never asserted beside it, and the suite re-derives every one.
 *
 * ── WHAT THIS MODULE DOES NOT DO ───────────────────────────────────────────
 * It runs nothing. There is no package record here, no transition function
 * that moves one, and no verification. §35.6's verification gauntlet is task
 * 11's `integrity.ts`; delivery and storage are task 10's. This file is the
 * lifecycle's SHAPE, and the one product invariant it carries — `AC-PKG-104`,
 * L79149 — is a property of that shape rather than of any run.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

/* ── the twenty-one stages, L79049 ─────────────────────────────────────── */

/**
 * What the source says about each stage's standing. Four values, because the
 * clauses carry four and collapsing `rollback` into either neighbour would
 * assert something the source declines to.
 */
export type StageStatus =
  | 'SoW Fact'
  | 'proposed'
  | 'Not specified in the Statement of Work'
  | 'partially addressed'

export type LifecycleStageId =
  | 'authoring'
  | 'validation'
  | 'approval'
  | 'publication'
  | 'package-generation'
  | 'manifest-creation'
  | 'signing'
  | 'encryption'
  | 'download'
  | 'integrity-validation'
  | 'local-storage'
  | 'activation'
  | 'version-pinning'
  | 'expiry'
  | 'revocation'
  | 'replacement'
  | 'rollback'
  | 'corruption-handling'
  | 'incompatible-version-handling'
  | 'deletion'
  | 'reconciliation'

export interface LifecycleStage {
  readonly id: LifecycleStageId
  /** The italicised name, in the source's own casing. */
  readonly name: string
  /** The stage's own predicate from L79049, verbatim. */
  readonly clause: string
  /** Read OFF the clause. The suite re-derives it and compares. */
  readonly status: StageStatus
}

/**
 * All twenty-one live in ONE sentence at L79049, each italicised and followed
 * by its predicate. Two of them — corruption handling and incompatible-version
 * handling — share a single predicate there, so they carry the same clause
 * text and the suite asserts that sharing rather than inventing two.
 */
export const LIFECYCLE_STAGES = [
  {
    id: 'authoring',
    name: 'Authoring',
    clause:
      'is the Studio act of building screens through the nine configuration sections `[SoW Fact — §5.5.1]`.',
    status: 'SoW Fact',
  },
  {
    id: 'validation',
    name: 'Validation',
    clause:
      'is the pre-submission check, including at least one severity mapping per measurement screen `[SoW Fact — §3.3]` and locale completeness, which blocks publication in an incomplete locale `[SoW Fact — §5.17]`.',
    status: 'SoW Fact',
  },
  {
    id: 'approval',
    name: 'Approval',
    clause:
      'is the three-stage chain, with the Reviewer necessarily a different person from the Author and the Release Authority never bypassable `[SoW Fact — §5.11.1]`.',
    status: 'SoW Fact',
  },
  {
    id: 'publication',
    name: 'Publication',
    clause:
      'mints a semantic version and classifies the change as patch or notified `[SoW Fact — §5.12.1]`.',
    status: 'SoW Fact',
  },
  {
    id: 'package-generation',
    name: 'Package generation',
    clause: 'assembles the per-run artefact at assignment `[SoW Fact — §5.14.1]`.',
    status: 'SoW Fact',
  },
  {
    id: 'manifest-creation',
    name: 'Manifest creation',
    clause: 'describes the artefact — proposed, see Section 35.3.',
    status: 'proposed',
  },
  {
    id: 'signing',
    name: 'Signing',
    clause: 'binds the manifest to the content so tampering is detectable — proposed.',
    status: 'proposed',
  },
  {
    id: 'encryption',
    name: 'Encryption',
    clause:
      'protects it in transit and at rest, both of which are enforced platform invariants with no off position `[SoW Fact — §8.7.4]`.',
    status: 'SoW Fact',
  },
  {
    id: 'download',
    name: 'Download',
    clause: 'is the transfer by one of the two delivery paths `[SoW Fact — §7.6]`.',
    status: 'SoW Fact',
  },
  {
    id: 'integrity-validation',
    name: 'Integrity validation',
    clause: "is the device's check before use — proposed as an explicit stage.",
    status: 'proposed',
  },
  {
    id: 'local-storage',
    name: 'Local storage',
    clause: 'places it in the app-managed encrypted store `[SoW Fact — §7.11]`.',
    status: 'SoW Fact',
  },
  {
    id: 'activation',
    name: 'Activation',
    clause: 'makes the run ready and enterable `[SoW Fact — §7.6]`.',
    status: 'SoW Fact',
  },
  {
    id: 'version-pinning',
    name: 'Version pinning',
    clause: "binds the run to that package for the run's life `[SoW Fact — §7.10.6]`.",
    status: 'SoW Fact',
  },
  {
    id: 'expiry',
    name: 'Expiry',
    clause:
      'is `Not specified in the Statement of Work` — see `DEC-PKGEXP-001` in Section 35.7.',
    status: 'Not specified in the Statement of Work',
  },
  {
    id: 'revocation',
    name: 'Revocation',
    clause: 'is `Not specified in the Statement of Work` — proposed in Section 35.3.',
    status: 'Not specified in the Statement of Work',
  },
  {
    id: 'replacement',
    name: 'Replacement',
    clause:
      'is the arrival of a newer package for future runs, never for an in-flight one `[SoW Fact — §7.10.6]`.',
    status: 'SoW Fact',
  },
  {
    id: 'rollback',
    name: 'Rollback',
    clause:
      'is reverting to a prior version, which the source addresses for content versioning but not for a deployed package on a device.',
    status: 'partially addressed',
  },
  {
    id: 'corruption-handling',
    name: 'Corruption handling',
    clause: 'are `Not specified in the Statement of Work` and proposed in Section 35.6.',
    status: 'Not specified in the Statement of Work',
  },
  {
    id: 'incompatible-version-handling',
    name: 'incompatible-version handling',
    clause: 'are `Not specified in the Statement of Work` and proposed in Section 35.6.',
    status: 'Not specified in the Statement of Work',
  },
  {
    id: 'deletion',
    name: 'Deletion',
    clause:
      'is the release of local storage after complete-and-synced `[SoW Fact — §7.10.7]`.',
    status: 'SoW Fact',
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation',
    clause:
      'records which package version each run actually executed against `[SoW Fact — §8.13.2]`.',
    status: 'SoW Fact',
  },
] as const satisfies readonly LifecycleStage[]

/**
 * `.includes()` stops type-checking on an `as const` array because the element
 * type narrows to its own members, so the predicate lives beside the constant
 * rather than the constant being widened back.
 */
export function isLifecycleStageId(value: string): value is LifecycleStageId {
  return LIFECYCLE_STAGES.some((s) => s.id === value)
}

export function stage(id: LifecycleStageId): LifecycleStage {
  const found = LIFECYCLE_STAGES.find((s) => s.id === id)
  if (found === undefined) throw new Error(`§35.1: no lifecycle stage "${id}".`)
  return found
}

/* ── the eighteen diagram states, L79073-L79090 ────────────────────────── */

export type LifecycleStateId =
  | 'Authored'
  | 'Validated'
  | 'Approved'
  | 'Published'
  | 'Generated'
  | 'Manifested'
  | 'Distributable'
  | 'Downloading'
  | 'IntegrityChecked'
  | 'Stored'
  | 'Active'
  | 'Pinned'
  | 'Superseded'
  | 'Revoked'
  | 'Corrupt'
  | 'Incompatible'
  | 'Expired'
  | 'Released'

export interface LifecycleState {
  readonly id: LifecycleStateId
  readonly line: number
  /** The diagram's own label, verbatim, hyphens and all. */
  readonly label: string
}

export const LIFECYCLE_STATES = [
  { id: 'Authored', line: 79073, label: 'Authored - content built in the Studio' },
  { id: 'Validated', line: 79074, label: 'Validated - locale complete and mappings present' },
  { id: 'Approved', line: 79075, label: 'Approved - three stage chain complete' },
  { id: 'Published', line: 79076, label: 'Published - semantic version minted' },
  { id: 'Generated', line: 79077, label: 'Generated - per run package assembled' },
  { id: 'Manifested', line: 79078, label: 'Manifested - manifest created and signed' },
  {
    id: 'Distributable',
    line: 79079,
    label: 'Distributable - encrypted and available for download',
  },
  { id: 'Downloading', line: 79080, label: 'Downloading - transfer in progress' },
  {
    id: 'IntegrityChecked',
    line: 79081,
    label: 'Integrity checked - signature and checksum verified',
  },
  { id: 'Stored', line: 79082, label: 'Stored - written to the encrypted on device store' },
  { id: 'Active', line: 79083, label: 'Active - run is ready and enterable' },
  { id: 'Pinned', line: 79084, label: 'Pinned - bound to the run for the runs life' },
  { id: 'Superseded', line: 79085, label: 'Superseded - a newer version exists for future runs' },
  { id: 'Revoked', line: 79086, label: 'Revoked - withdrawn before or during use' },
  { id: 'Corrupt', line: 79087, label: 'Corrupt - integrity check failed' },
  { id: 'Incompatible', line: 79088, label: 'Incompatible - application version below the minimum' },
  { id: 'Expired', line: 79089, label: 'Expired - validity horizon passed' },
  {
    id: 'Released',
    line: 79090,
    label: 'Released - local footprint freed after complete and synced',
  },
] as const satisfies readonly LifecycleState[]

/** The diagram's start and end marker. It is a marker, never a state. */
export const DIAGRAM_TERMINUS = '[*]'
export type LifecycleNode = LifecycleStateId | typeof DIAGRAM_TERMINUS

export interface LifecycleTransition {
  readonly from: LifecycleNode
  readonly to: LifecycleNode
  readonly line: number
}

/**
 * Every arrow in the block, in the order drawn, including the entry from the
 * terminus and the four exits back to it. Twenty-four arrows; nineteen of them
 * join two real states.
 */
export const LIFECYCLE_TRANSITIONS = [
  { from: '[*]', to: 'Authored', line: 79072 },
  { from: 'Authored', to: 'Validated', line: 79091 },
  { from: 'Validated', to: 'Approved', line: 79092 },
  { from: 'Approved', to: 'Published', line: 79093 },
  { from: 'Published', to: 'Generated', line: 79094 },
  { from: 'Generated', to: 'Manifested', line: 79095 },
  { from: 'Manifested', to: 'Distributable', line: 79096 },
  { from: 'Distributable', to: 'Downloading', line: 79097 },
  { from: 'Downloading', to: 'IntegrityChecked', line: 79098 },
  { from: 'IntegrityChecked', to: 'Stored', line: 79099 },
  { from: 'IntegrityChecked', to: 'Corrupt', line: 79100 },
  { from: 'Stored', to: 'Active', line: 79101 },
  { from: 'Stored', to: 'Incompatible', line: 79102 },
  { from: 'Active', to: 'Pinned', line: 79103 },
  { from: 'Pinned', to: 'Released', line: 79104 },
  { from: 'Published', to: 'Superseded', line: 79105 },
  { from: 'Distributable', to: 'Revoked', line: 79106 },
  { from: 'Active', to: 'Revoked', line: 79107 },
  { from: 'Active', to: 'Expired', line: 79108 },
  { from: 'Corrupt', to: 'Downloading', line: 79109 },
  { from: 'Released', to: '[*]', line: 79110 },
  { from: 'Revoked', to: '[*]', line: 79111 },
  { from: 'Expired', to: '[*]', line: 79112 },
  { from: 'Incompatible', to: '[*]', line: 79113 },
] as const satisfies readonly LifecycleTransition[]

/** Every arrow LEAVING a state, terminus exits included. */
export function outwardTransitions(from: LifecycleStateId): readonly LifecycleTransition[] {
  return LIFECYCLE_TRANSITIONS.filter((t) => t.from === from)
}

/**
 * `AC-PKG-104` (L79149). Held by `LIFECYCLE_TRANSITIONS` having exactly one
 * arrow out of `Pinned`, which is a property of the transcription — so the
 * criterion cannot be satisfied by a guard someone deletes later. The suite
 * derives both halves from the source and would go red on a transcription that
 * added a second outward arrow.
 */
export const AC_PKG_104 =
  'A pinned package has exactly one outward lifecycle transition, to released.'

/**
 * L79116 — "Three exits — Revoked, Expired and Incompatible — are terminal for
 * that package and require a replacement before the run can proceed; Corrupt
 * is the one recoverable failure, returning to Downloading for a re-pull."
 *
 * Read off the arrows rather than listed: a failure state is terminal when its
 * only outward arrow reaches the terminus. `Released` reaches the terminus too
 * and is not a failure — it is the normal end, which is why this is computed
 * over the arrows and named as the source names it rather than hardcoded.
 */
export function reachesTerminusOnly(from: LifecycleStateId): boolean {
  const out = outwardTransitions(from)
  return out.length > 0 && out.every((t) => t.to === DIAGRAM_TERMINUS)
}

/**
 * The one recoverable failure. L79109 draws `Corrupt --> Downloading`, and it
 * is the only arrow in the block that goes backwards.
 */
export function isRecoverableFailure(from: LifecycleStateId): boolean {
  return outwardTransitions(from).some((t) => t.to !== DIAGRAM_TERMINUS)
}

/**
 * Twenty-one stages onto eighteen states. A TOTAL record, so a stage with no
 * state says `null` out loud instead of going missing — `signing` folds into
 * `Manifested` because L79078's own label says "manifest created and signed",
 * and `rollback` and `reconciliation` are drawn nowhere at all.
 */
export const STAGE_TO_STATE: Readonly<Record<LifecycleStageId, LifecycleStateId | null>> = {
  authoring: 'Authored',
  validation: 'Validated',
  approval: 'Approved',
  publication: 'Published',
  'package-generation': 'Generated',
  'manifest-creation': 'Manifested',
  signing: 'Manifested',
  encryption: 'Distributable',
  download: 'Downloading',
  'integrity-validation': 'IntegrityChecked',
  'local-storage': 'Stored',
  activation: 'Active',
  'version-pinning': 'Pinned',
  expiry: 'Expired',
  revocation: 'Revoked',
  replacement: 'Superseded',
  rollback: null,
  'corruption-handling': 'Corrupt',
  'incompatible-version-handling': 'Incompatible',
  deletion: 'Released',
  reconciliation: null,
}

/* ── the four counts, recorded rather than reconciled ──────────────────── */

export interface LifecycleCount {
  readonly what: string
  readonly counted: number
  readonly locator: string
}

/**
 * Four descriptions of one machine. Only the first has a claimed number beside
 * it in the prose — L79047's "twenty-one lifecycle stages" — and that one
 * claim does reconcile with its own enumeration. The other three are simply
 * different granularities the section never joins, and this build does not
 * join them either.
 */
export const LIFECYCLE_COUNTS = [
  { what: 'named stages, in prose', counted: 21, locator: 'L79049; claim at L79047' },
  { what: 'states in the state diagram', counted: 18, locator: 'L79073-L79090' },
  { what: 'steps in the numbered chronological workflow', counted: 16, locator: 'L79053-L79068' },
  { what: 'rows in the stage-authority matrix', counted: 13, locator: 'L79126-L79138' },
] as const satisfies readonly LifecycleCount[]

/* ── the stage-authority matrix, L79124-L79138 ─────────────────────────── */

/** The five columns of L79124, in the source's own order. */
export const STAGE_AUTHORITY_COLUMNS = [
  'Stage',
  'Who acts',
  'Surface',
  'Audited',
  'Source status',
] as const

export type StageAuthorityColumn = (typeof STAGE_AUTHORITY_COLUMNS)[number]

export interface StageAuthorityRow {
  /** The first column, which is the row key rather than a cell. */
  readonly stage: string
  readonly line: number
  readonly cells: Readonly<Record<Exclude<StageAuthorityColumn, 'Stage'>, string>>
}

/**
 * Thirteen rows, transcribed HEADER-KEYED. Its stage names are the matrix's
 * own and are deliberately not reconciled to `LifecycleStageId`: row 6 is
 * "Manifest creation and signing" where the prose has two stages, row 9 is
 * "Activation and pinning" where the prose has two, and row 12 is "Deletion of
 * local footprint" where the prose says "Deletion". Keying this on the stage
 * ids would have forced three joins the source never makes.
 */
export const STAGE_AUTHORITY_MATRIX = [
  {
    stage: 'Authoring',
    line: 79126,
    cells: {
      'Who acts': 'Author with an authoring grant on Supervisor or Quality Manager',
      Surface: 'Standards and Operations Studio',
      Audited: '`Allowed` — publish events ingest into the tenant audit log',
      'Source status': '`SoW Fact — §5.11.1, §5.18, §1.4 seam 18`',
    },
  },
  {
    stage: 'Validation',
    line: 79127,
    cells: {
      'Who acts': 'Platform, automatically',
      Surface: 'Standards and Operations Studio',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §3.3, §5.17`',
    },
  },
  {
    stage: 'Approval',
    line: 79128,
    cells: {
      'Who acts': 'Reviewer then Release Authority',
      Surface: 'Standards and Operations Studio',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §5.11.1`',
    },
  },
  {
    stage: 'Publication',
    line: 79129,
    cells: {
      'Who acts': 'Release Authority',
      Surface: 'Standards and Operations Studio',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §5.12.1`',
    },
  },
  {
    stage: 'Package generation',
    line: 79130,
    cells: {
      'Who acts': 'Platform, at run assignment',
      Surface: 'Server-side',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §5.14.1`',
    },
  },
  {
    stage: 'Manifest creation and signing',
    line: 79131,
    cells: {
      'Who acts': 'Platform, automatically',
      Surface: 'Server-side',
      Audited: '`Client Decision Required` — proposed in Section 35.3',
      'Source status': '`Recommendation — R&D`',
    },
  },
  {
    stage: 'Download',
    line: 79132,
    cells: {
      'Who acts': 'Device, automatically; supervisor may force an on-demand re-pull',
      Surface: 'Frontline and Delivery Operations Hub',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §5.14.1, §7.6`',
    },
  },
  {
    stage: 'Integrity validation',
    line: 79133,
    cells: {
      'Who acts': 'Device',
      Surface: 'Frontline',
      Audited: '`Client Decision Required` — proposed',
      'Source status': '`Recommendation — R&D`',
    },
  },
  {
    stage: 'Activation and pinning',
    line: 79134,
    cells: {
      'Who acts': 'Device and platform',
      Surface: 'Frontline',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §5.14.1, §7.10.6`',
    },
  },
  {
    stage: 'Expiry',
    line: 79135,
    cells: {
      'Who acts': '`Client Decision Required` — undefined in the source',
      Surface: '`Not applicable — no surface owns an undefined behaviour`',
      Audited: '`Client Decision Required`',
      'Source status': '`Client Decision Required — DEC-PKGEXP-001`',
    },
  },
  {
    stage: 'Revocation',
    line: 79136,
    cells: {
      'Who acts': '`Client Decision Required` — undefined in the source',
      Surface: '`Not applicable — no surface owns an undefined behaviour`',
      Audited: '`Client Decision Required`',
      'Source status': '`Recommendation — R&D`, Section 35.3',
    },
  },
  {
    stage: 'Deletion of local footprint',
    line: 79137,
    cells: {
      'Who acts': 'Device, after complete-and-synced with confirmed receipt',
      Surface: 'Frontline',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §7.10.7`',
    },
  },
  {
    stage: 'Reconciliation',
    line: 79138,
    cells: {
      'Who acts': 'Platform',
      Surface: 'Super Admin telemetry and Delivery Operations Hub record',
      Audited: '`Allowed`',
      'Source status': '`SoW Fact — §8.13.2`',
    },
  },
] as const satisfies readonly StageAuthorityRow[]

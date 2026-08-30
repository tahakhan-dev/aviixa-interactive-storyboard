import type { DecisionReading } from '@/disclosure/decisions'
import { A2_DISCLOSURES } from '@/frontline/modules/fl-a2/service'
import type { PermissionOutcome } from '@/policy/decision'

/**
 * SECTION 35.5 — STORAGE DISCIPLINE AND THE DEFERRED STORAGE-FULL BEHAVIOUR.
 * The section opens at L79428.
 *
 * THIS FILE WRITES NO FIFTH SPELLING OF `DEC-STORE-001`.
 *
 * FOUR local disclosure records already carry it, not three: `MOD-FL-A2`,
 * `MOD-FL-A4` and `MOD-FL-A6` under `src/frontline/modules/`, and
 * `src/studio/modules/stu-14/rendering.ts`. Every one exists because
 * `src/disclosure/decisions.ts` carries no record for it — it is not a member
 * of that file's `DecisionId` union. `MOD-FL-A2`'s record is READ below and
 * re-exported, not
 * retyped. `src/offline/capability.ts` and `src/offline/event-matrix.ts`
 * already carry the identifier too, as cells of transcribed registers rather
 * than as disclosures, so this file adds no register row either.
 * `DEC_STORE_001_SHIPPED_RECORDS` pins the count of four so a fifth cannot
 * land unremarked, and the covering suite recounts it from the tree.
 *
 * WHAT IT DOES ADD IS A COUNTED FINDING THE EXISTING RECORDS CANNOT CARRY.
 * All four shipped disclosures descend from `FB-FL-STORE-01` at L40116,
 * which names THREE candidate behaviours and recommends "(b) and (c) with (a)
 * as the terminal state". §35.5's own treatment at L79469 names FOUR, and its
 * recommendation at L79470 is a different order — "(c) then (d) then (a)".
 * The letters do not even mean the same thing across the two: L40116's (a) is
 * "block new capture with a clear message and force a sync"; L79469's is
 * "hard stop at a reserved-capacity threshold, refusing new captures and
 * directing the worker to a supervisor". The decision owner differs too.
 *
 * BOTH READINGS AND BOTH LOCATORS ARE RECORDED AND NEITHER IS CHOSEN. That
 * is `STORAGE_FULL_OPTION_SET_DIVERGENCE` below. It is a finding about the
 * source, not a fourth disclosure: it holds no `adopted` field and no field in
 * which one option set could be marked the real one.
 *
 * AND NOTHING HERE IMPLEMENTS ANY OF THEM. `AC-PKG-505` (L79500): "No
 * storage-full behaviour and no reserved-capacity threshold is implemented
 * before `DEC-STORE-001` is decided." There is no threshold constant in this
 * file and `package-storage.test.ts` is the static analysis `TEST-PKG-505`
 * (L79508) asks for.
 */

/** Every locator this module cites, for the covering suite to re-open. */
export const STORAGE_LOCATORS = {
  /** `## 35.5 Storage discipline and the deferred storage-full behaviour` */
  section: 79428,
  /** `**Business purpose and rules.**` introducing the four positions. */
  positionsIntro: 79434,
  positionsFirst: 79436,
  positionsLast: 79439,
  /** The eviction rule coupled to Chapter 34's honesty rules. */
  evictionCoupling: 79441,
  /** `**The deferred behaviour, stated properly.**` */
  deferredBehaviour: 79466,
  /** The four lettered options §35.5 names. */
  optionsFour: 79469,
  /** §35.5's layered recommendation, (c) then (d) then (a). */
  recommendationLayered: 79470,
  /** §35.5's decision owner. */
  decisionOwner: 79472,
  /** `| Rule | Enforcement point | Behaviour under an outage | Status |` */
  rulesHeader: 79480,
  rulesFirstRow: 79482,
  rulesLastRow: 79488,
  acceptanceHeader: 79494,
  acceptanceFirstRow: 79496,
  acceptanceLastRow: 79500,
  testHeader: 79502,
  testFirstRow: 79504,
  testLastRow: 79508,
  /** `FB-FL-STORE-01`, the three-option treatment the shipped records carry. */
  optionsThree: 40116,
} as const

/* ==================================================================== *
 * THE FOUR STORAGE POSITIONS.
 *
 * L79434 introduces them — "The source states four storage positions" — and
 * L79436-L79439 are the four. Each position's bolded lead sentence is
 * transcribed; the fourth IS the deferral, which is why the deferral is a
 * position rather than an afterthought.
 * ==================================================================== */

export type StoragePositionId =
  | 'eviction-after-receipt-and-integrity'
  | 'pre-staging-policy'
  | 'minimal-on-device-scope'
  | 'storage-full-deferred'

export interface StoragePosition {
  readonly id: StoragePositionId
  readonly n: number
  readonly statement: string
  readonly sourceRef: number
}

export const STORAGE_POSITIONS = [
  {
    id: 'eviction-after-receipt-and-integrity',
    n: 1,
    statement:
      'Media is evicted from the device only after confirmed server receipt plus an integrity check — never on the strength of an attempted upload.',
    sourceRef: 79436,
  },
  {
    id: 'pre-staging-policy',
    n: 2,
    statement:
      "Pre-staging policy: today's runs are fully staged; near-horizon runs are staged lazily; eviction follows complete-and-synced.",
    sourceRef: 79437,
  },
  {
    id: 'minimal-on-device-scope',
    n: 3,
    statement:
      "Minimal on-device scope: the device holds only what the assigned runs require — never the wider tenant's data — and holds it only briefly; the long-horizon record is owned upstream.",
    sourceRef: 79438,
  },
  {
    id: 'storage-full-deferred',
    n: 4,
    statement:
      'Storage-full behaviour is defined explicitly, per platform, in the Functional Specification.',
    sourceRef: 79439,
  },
] as const satisfies readonly StoragePosition[]

type MissingFromPositions = Exclude<StoragePositionId, (typeof STORAGE_POSITIONS)[number]['id']>
const _positionsAreExhaustive: MissingFromPositions extends never ? true : never = true
void _positionsAreExhaustive

/* ==================================================================== *
 * THE STORAGE-RULES MATRIX — SEVEN DATA ROWS, FOUR COLUMNS.
 *
 * Header L79480 reads `Rule | Enforcement point | Behaviour under an outage |
 * Status`; separator L79481; data L79482-L79488.
 *
 * ROW 6'S STATUS INVERTS IF YOU TRANSCRIBE THE TOKEN AND DROP THE TAIL. Its
 * cell is "`Explicitly prohibited` to do otherwise" — the prohibition is on
 * the INVERSE of the rule, not on the rule. Recording it as
 * `explicitlyProhibited` against the rule "Media never touches the device
 * gallery" would read as prohibiting the protection. `statusText` keeps the
 * cell verbatim and `outcomeAppliesTo` names the subject, so the outcome
 * token can never be read alone.
 * ==================================================================== */

export type StorageRuleId =
  | 'eviction-after-receipt-and-integrity'
  | 'today-fully-staged'
  | 'near-horizon-lazy'
  | 'coaching-assets-storage-conditional'
  | 'minimal-scope'
  | 'never-device-gallery'
  | 'storage-exhausted'

export interface StorageRuleRow {
  readonly id: StorageRuleId
  /** The `Rule` cell, verbatim. */
  readonly rule: string
  /** The `Enforcement point` cell, verbatim. */
  readonly enforcementPoint: string
  /** The `Behaviour under an outage` cell, verbatim. */
  readonly underOutage: string
  /** The `Status` cell, verbatim, backticks and all. */
  readonly statusText: string
  readonly outcome: PermissionOutcome
  /**
   * What the outcome token attaches to. `'the rule'` on six rows; on the
   * gallery row it is the inverse, which is the whole reason this field is
   * here and is not `null` anywhere.
   */
  readonly outcomeAppliesTo: string
  readonly sourceRef: number
}

export const STORAGE_RULES = [
  {
    id: 'eviction-after-receipt-and-integrity',
    rule: 'Eviction only after confirmed receipt plus integrity check',
    enforcementPoint: 'Device eviction routine',
    underOutage: 'Eviction suspended entirely',
    statusText: '`Allowed` — `SoW Fact — §7.10.7`',
    outcome: 'allowed',
    outcomeAppliesTo: 'the rule as stated',
    sourceRef: 79482,
  },
  {
    id: 'today-fully-staged',
    rule: "Today's runs fully staged",
    enforcementPoint: 'Staging policy at shift start',
    underOutage: 'Staging deferred to lazy pull',
    statusText: '`Allowed` — `SoW Fact — §7.10.7`',
    outcome: 'allowed',
    outcomeAppliesTo: 'the rule as stated',
    sourceRef: 79483,
  },
  {
    id: 'near-horizon-lazy',
    rule: 'Near-horizon runs staged lazily',
    enforcementPoint: 'Staging policy',
    underOutage: 'Unchanged',
    statusText: '`Allowed` — `SoW Fact — §7.10.7`',
    outcome: 'allowed',
    outcomeAppliesTo: 'the rule as stated',
    sourceRef: 79484,
  },
  {
    id: 'coaching-assets-storage-conditional',
    rule: 'Coaching assets subject to available storage',
    enforcementPoint: 'Package generation and device staging',
    underOutage: 'Omitted first under pressure',
    statusText: '`Allowed with conditions` — `SoW Fact — §5.14.1`',
    outcome: 'allowedWithConditions',
    outcomeAppliesTo: 'the rule as stated',
    sourceRef: 79485,
  },
  {
    id: 'minimal-scope',
    rule: 'Minimal on-device scope, never wider tenant data',
    enforcementPoint: 'Package generation scope binding',
    underOutage: 'Unchanged; scope is never widened to pre-fetch',
    statusText: '`Allowed` — `SoW Fact — §7.10.7`',
    outcome: 'allowed',
    outcomeAppliesTo: 'the rule as stated',
    sourceRef: 79486,
  },
  {
    id: 'never-device-gallery',
    rule: 'Media never touches the device gallery',
    enforcementPoint: 'Capture path',
    underOutage: 'Unchanged in every mode',
    statusText: '`Explicitly prohibited` to do otherwise — `SoW Fact — §7.8.4`',
    outcome: 'explicitlyProhibited',
    outcomeAppliesTo: 'doing otherwise — letting media reach the device gallery',
    sourceRef: 79487,
  },
  {
    id: 'storage-exhausted',
    rule: 'Storage exhausted',
    enforcementPoint: 'Deferred',
    underOutage: '`Client Decision Required`',
    statusText: '`Client Decision Required — DEC-STORE-001`',
    outcome: 'clientDecisionRequired',
    outcomeAppliesTo: 'the rule as stated',
    sourceRef: 79488,
  },
] as const satisfies readonly StorageRuleRow[]

type MissingFromRules = Exclude<StorageRuleId, (typeof STORAGE_RULES)[number]['id']>
const _rulesAreExhaustive: MissingFromRules extends never ? true : never = true
void _rulesAreExhaustive

export function storageRule(id: StorageRuleId): StorageRuleRow {
  const found = STORAGE_RULES.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no §35.5 storage rule: ${id}`)
  return found
}

/* ==================================================================== *
 * THE EVICTION GATE — THE ONLY BRANCH IN THIS FILE.
 *
 * There is exactly one route to eviction and it passes through two
 * independent confirmations (L79464, on the diagram at L79443-L79462). Every
 * other path returns to retention.
 *
 * THREE INDEPENDENT PRECONDITIONS, NOT TWO. `AC-PKG-501` (L79496) names
 * receipt and integrity; the diagram's own eviction node at L79449 adds the
 * third — "Eligible for eviction once the run is complete and synced" — and
 * position 2 at L79437 says "eviction follows complete-and-synced". Dropping
 * that third would evict a confirmed object belonging to a run still under
 * way.
 *
 * `AC-PKG-502` (L79497) — "Eviction is suspended in every mode where receipt
 * cannot be confirmed" — needs no separate mode list and gets none. Every
 * such mode presents as `receiptConfirmed: false`, so one predicate holds the
 * criterion for all of them rather than a guard per outage mode.
 *
 * THE VERDICT IS NOT A BOOLEAN. A bare `false` loses which confirmation was
 * missing, and the reason is the thing an auditor asks for.
 */

export type RetentionReason =
  | 'receipt-not-confirmed'
  | 'integrity-check-not-passed'
  | 'run-not-complete-and-synced'

export interface EvictionCandidate {
  readonly objectId: string
  /** Confirmed server receipt. An attempted upload is not receipt (L79436). */
  readonly receiptConfirmed: boolean
  /** Receipt without an integrity check is not proof of a usable file (L79436). */
  readonly integrityCheckPassed: boolean
  /** L79437, L79449: eviction follows complete-and-synced. */
  readonly runCompleteAndSynced: boolean
}

export type EvictionVerdict =
  | { readonly evict: true }
  | {
      readonly evict: false
      readonly retainedBecause: RetentionReason
      readonly line: string
      readonly sourceRef: number
    }

const RETENTION_LINES: Readonly<Record<RetentionReason, { line: string; sourceRef: number }>> = {
  'receipt-not-confirmed': {
    line: 'An attempted upload is not receipt',
    sourceRef: 79436,
  },
  'integrity-check-not-passed': {
    line: 'receipt without an integrity check is not proof of a usable file',
    sourceRef: 79436,
  },
  'run-not-complete-and-synced': {
    line: 'Eligible for eviction once the run is complete and synced',
    sourceRef: 79449,
  },
}

export function mayEvict(candidate: EvictionCandidate): EvictionVerdict {
  const missing: RetentionReason | null = !candidate.receiptConfirmed
    ? 'receipt-not-confirmed'
    : !candidate.integrityCheckPassed
      ? 'integrity-check-not-passed'
      : !candidate.runCompleteAndSynced
        ? 'run-not-complete-and-synced'
        : null
  if (missing === null) return { evict: true }
  return { evict: false, retainedBecause: missing, ...RETENTION_LINES[missing] }
}

/* ==================================================================== *
 * `DEC-STORE-001`, READ FROM THE SHIPPED RECORD.
 *
 * `MOD-FL-A2` disclosed it in the canon's own shape, with `DecisionReading`
 * imported rather than redeclared and the canon gap declared on `canonNote`.
 * That record is the one this module consumes. If the canon ever absorbs it,
 * `MOD-FL-A2`'s own suite goes red first and this re-export follows the move
 * rather than surviving it as a duplicate.
 * ==================================================================== */

const A2_STORE_DISCLOSURE = A2_DISCLOSURES.find((d) => d.decisionRef === 'DEC-STORE-001')

if (A2_STORE_DISCLOSURE === undefined) {
  throw new Error('MOD-FL-A2 no longer discloses DEC-STORE-001')
}

/**
 * The shipped disclosure, re-exported under this module's name so a reader of
 * §35.5 finds it without a fourth copy existing.
 */
export const DEC_STORE_001 = A2_STORE_DISCLOSURE

/**
 * The four files that already hold a local disclosure record keyed to
 * `DEC-STORE-001`, and this file is not among them. Recounted from the tree by
 * the covering suite, so a fifth landing anywhere goes red here rather than
 * being noticed by nobody.
 */
export const DEC_STORE_001_SHIPPED_RECORDS = [
  'src/frontline/modules/fl-a2/service.ts',
  'src/frontline/modules/fl-a4/service.ts',
  'src/frontline/modules/fl-a6/service.ts',
  'src/studio/modules/stu-14/rendering.ts',
] as const satisfies readonly string[]

/**
 * The divergence, recorded and not resolved.
 *
 * `readings` is the canon's own `DecisionReading`, imported — exactly two
 * fields, so there is no field in which one option set could be marked the
 * real one. This record deliberately carries no `adopted` and no
 * `recommendation`: §35.5's layered order is one of the two readings, not
 * this build's choice.
 */
export interface SourceDivergence {
  readonly about: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** Why neither reading is chosen here. */
  readonly whyNeitherIsChosen: string
}

export const STORAGE_FULL_OPTION_SET_DIVERGENCE: SourceDivergence = {
  about: 'DEC-STORE-001',
  question:
    'How many candidate behaviours does the source name for device storage-full, and in what ' +
    'recommended order? The two treatments give different answers and the three shipped ' +
    'disclosures in this tree all carry only the first.',
  readings: [
    {
      text:
        'Three options. "The options are (a) block new capture with a clear message and force a ' +
        'sync, (b) block new media capture only while permitting non-media captures, (c) refuse to ' +
        'start additional Runs while permitting completion of Runs in progress. The recommendation ' +
        'is a combination of (b) and (c) with (a) as the terminal state." Decision owner: the ' +
        'client, through the Frontline Functional Specification.',
      locator: 'FB-FL-STORE-01 · L40116',
    },
    {
      text:
        'Four options. "(a) Hard stop at a reserved-capacity threshold, refusing new captures and ' +
        'directing the worker to a supervisor. (b) Degrade capture fidelity, for example reducing ' +
        'image resolution, while preserving all measurement and gate data. (c) Refuse only ' +
        'optional content, evicting coaching assets and lazily staged near-horizon packages first ' +
        'while preserving every capture. (d) Block new run entry while allowing the current unit ' +
        'to complete." The recommendation is "a layered combination of (c) then (d) then (a), in ' +
        'that order". Decision owner: the client\'s product owner with the Quality Manager ' +
        'function.',
      locator: 'DEC-STORE-001 · L79469 (options), L79470 (recommendation), L79472 (owner)',
    },
  ],
  whyNeitherIsChosen:
    'The two sets are not a longer and a shorter statement of one list: the letters carry ' +
    'different behaviours, the recommended orders differ, and the named decision owners differ. ' +
    'Choosing either would decide what a device does when it cannot write, which is the decision ' +
    'the source explicitly defers. Both are recorded with their locators and nothing in this ' +
    'module implements either.',
}

/* ==================================================================== *
 * ACCEPTANCE CRITERIA AND TESTS, TRANSCRIBED. FIVE AND FIVE.
 * ==================================================================== */

export interface StorageCriterion {
  readonly id: string
  readonly statement: string
  readonly sourceStatus: string
  readonly sourceRef: number
}

export const STORAGE_ACCEPTANCE = [
  {
    id: 'AC-PKG-501',
    statement:
      'No media object is evicted without both confirmed server receipt and a passed integrity check.',
    sourceStatus: '`SoW Fact — §7.10.7`',
    sourceRef: 79496,
  },
  {
    id: 'AC-PKG-502',
    statement: 'Eviction is suspended in every mode where receipt cannot be confirmed.',
    sourceStatus: '`Derived Clarification` from §7.10.7',
    sourceRef: 79497,
  },
  {
    id: 'AC-PKG-503',
    statement: 'The device never holds data outside the scope its assigned runs require.',
    sourceStatus: '`SoW Fact — §7.10.7`',
    sourceRef: 79498,
  },
  {
    id: 'AC-PKG-504',
    statement:
      'Optional coaching assets are the first content released under storage pressure, and their absence never renders a run unenterable.',
    sourceStatus: '`SoW Fact — §5.14.1`',
    sourceRef: 79499,
  },
  {
    id: 'AC-PKG-505',
    statement:
      'No storage-full behaviour and no reserved-capacity threshold is implemented before `DEC-STORE-001` is decided.',
    sourceStatus: '`Client Decision Required`',
    sourceRef: 79500,
  },
] as const satisfies readonly StorageCriterion[]

export interface StorageTest {
  readonly id: string
  readonly test: string
  readonly method: string
  readonly sourceRef: number
}

export const STORAGE_TESTS = [
  {
    id: 'TEST-PKG-501',
    test: 'Interrupt an upload mid-transfer and assert no eviction occurs.',
    method: 'Partial-upload test.',
    sourceRef: 79504,
  },
  {
    id: 'TEST-PKG-502',
    test: 'Fail the integrity check on a received object and assert the device retains its copy.',
    method: 'Integrity-failure test.',
    sourceRef: 79505,
  },
  {
    id: 'TEST-PKG-503',
    test: "Inspect the on-device store and assert it contains no data outside the assigned runs' scope.",
    method: 'Scope inspection test.',
    sourceRef: 79506,
  },
  {
    id: 'TEST-PKG-504',
    test: 'Constrain storage and assert coaching assets are released first with the run still enterable.',
    method: 'Storage-pressure test.',
    sourceRef: 79507,
  },
  {
    id: 'TEST-PKG-505',
    test: 'Static analysis asserting no reserved-capacity threshold constant exists.',
    method: 'Configuration audit.',
    sourceRef: 79508,
  },
] as const satisfies readonly StorageTest[]

/* ==================================================================== *
 * §35.5'S TABLE CENSUS, COUNTED RATHER THAN CLAIMED.
 *
 * The task brief said §35.5 "carries 23 table rows across its tables". It
 * carries THREE tables and SEVENTEEN data rows; 23 is the count that includes
 * every header and every `|---|` separator. Both numbers are recorded because
 * a gate that rests on the wrong one goes green on a truncated table: the
 * separator row splits into non-empty cells and passes a naive shape check.
 * ==================================================================== */

export const STORAGE_TABLE_CENSUS = {
  tables: [
    {
      what: 'Supporting matrix — storage rules and their enforcement points',
      header: 79480,
      separator: 79481,
      firstRow: 79482,
      lastRow: 79488,
      dataRows: 7,
      columns: 4,
    },
    {
      what: 'Acceptance criteria',
      header: 79494,
      separator: 79495,
      firstRow: 79496,
      lastRow: 79500,
      dataRows: 5,
      columns: 3,
    },
    {
      what: 'Tests',
      header: 79502,
      separator: 79503,
      firstRow: 79504,
      lastRow: 79508,
      dataRows: 5,
      columns: 3,
    },
  ],
  dataRows: 17,
  /** Data rows plus three headers plus three separators. */
  linesIncludingHeadersAndSeparators: 23,
} as const

/** The counted shape of §35.5, for a gate to rest on. */
export const STORAGE_SHAPE = {
  positions: STORAGE_POSITIONS.length,
  rules: STORAGE_RULES.length,
  acceptanceCriteria: STORAGE_ACCEPTANCE.length,
  tests: STORAGE_TESTS.length,
  /** Occurrences of `DEC-STORE-001` inside §35.5, counted over L79428-L79511. */
  decStore001MentionsInSection: 6,
  decStore001MentionLines: [79439, 79466, 79488, 79490, 79500, 79510],
} as const

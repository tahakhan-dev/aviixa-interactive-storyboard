/**
 * THE THIRTY-SEVEN OFFLINE BLOCKERS, AND §37.1'S SIX AUTHORISATION VALUES.
 *
 * Chapter 37 opens at L80717, "37. Offline Blockers and Limitations". Its
 * register index is a five-column table: header L81160, separator L81161,
 * data L81162-L81198 — thirty-seven rows, counted row by row rather than
 * inferred from the span.
 *
 * ── THE FAMILY COUNTS HAVE THREE INDEPENDENT READINGS AND ALL THREE AGREE ──
 * A count worth resting a gate on is one two readings reach separately. This
 * one has three, and they were taken from three different parts of the source:
 *
 *   reading 1  the index table's own `Family` column, L81162-L81198
 *   reading 2  which §37.2-§37.6 section carries the blocker's detail entry
 *   reading 3  the acceptance-criterion block each section numbers itself in
 *
 *              Content 12 · Authority 10 · Device 8 · Distributed 3 ·
 *              Intelligence 4  =  37
 *
 * Reading 3 is the sharpest because nothing forces it: §37.2 numbers its
 * criteria `AC-37-201`…`212`, §37.3 `301`…`310`, §37.4 `401`…`408`, §37.5
 * `501`…`503`, §37.6 `601`…`604`. Measured over all 122,241 lines those
 * families hold exactly 12, 10, 8, 3 and 4 distinct identifiers. A
 * transcription that dropped or duplicated a row would disagree with a
 * numbering scheme it never touched.
 *
 * `FAMILY_COUNT_READINGS` carries all three so the gate compares readings
 * rather than comparing this file to itself.
 *
 * ── `Source status` IS PER ROW, AND THE COLUMN IS NOT A CLOSED VOCABULARY ──
 * Three classifications open the thirty-seven cells — `SoW Fact`,
 * `Derived Clarification`, `User-Mandated Product Extension` — but the cells
 * themselves are not those three strings. Five distinct shapes are present:
 * a bare classification, one with an em-dashed section list, one with a
 * `from §…` provenance, and `OFF-BLK-05`'s, which is a `SoW Fact` carrying an
 * open item on its face. So `sourceStatus` holds the cell VERBATIM and
 * `classificationOf` derives the opening classification from it.
 *
 * Typing the whole table with one classification is the defect §36.4 has:
 * that section classifies its own table `Derived Clarification` while eight of
 * its twelve rows open `SoW Fact`. Here the counts are 20 `SoW Fact`, 7
 * `Derived Clarification`, 10 `User-Mandated Product Extension` — and L81200
 * states the last of those three independently: "Ten blockers are
 * `User-Mandated Product Extension` additions with inline justification."
 *
 * ── THE SIX VALUES ARE A TABLE, NOT THE SECTION'S RULES ────────────────────
 * §37.1 is titled "The Offline Authorization Limits" (L80775). It states
 * THREE rules — L80781 opens "Three rules, each quoted from the source and
 * each load-bearing for the whole register", and they are the trust window
 * (L80783), clearance duration and next-gate enforcement (L80785) and the
 * parked run (L80787). Its supporting table is SIX rows: header L80833,
 * separator L80834, data L80835-L80840, seven columns, L80831 promising "No
 * cell is blank."
 *
 * Three and six are different enumerations of different things, and the word
 * "six" does not occur anywhere in §37.1 — measured over L80775-L80888. Both
 * are carried: `AUTHORIZATION_RULES` names the three with their locators,
 * `OFFLINE_AUTHORIZATION_LIMITS` transcribes the six. Neither is collapsed
 * into the other, because rows 2, 4, 5 and 6 of the table have no rule and
 * rule 3 has no row.
 *
 * ── STEP NUMBERS COME FROM THE STEP MODEL ──────────────────────────────────
 * L80801 is step 9 of §37.1's numbered workflow and names three protocol
 * steps by number. A bare integer here would be a fourth private copy of an
 * ordering that already lives in `@/offline/protocol`, so the three are
 * resolved through `step()` and `REVALIDATION_STEPS` records what L80801
 * claims each one does. The gate asserts the claim against the step's own
 * title, so a renumbering breaks here rather than silently.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT DO ────────────────────────────────
 * It mints no `DEC-*` record. `OFF-BLK-05` names `DEC-STORE-001` and
 * `OFF-BLK-32` names `DEC-WIPE-001` in their own cells; four files already
 * hold a record for the first, and a fifth spelling is the defect this build
 * records most often. The cells are transcribed and the decisions are left
 * where they live.
 *
 * It does not transcribe the thirty-seven detail entries. `detailLine` points
 * at each one so the prose is one `sed` away, and the three contradictions
 * below are the ones that bear on the register's own claims about itself.
 */

import { PROTOCOL_STEPS, step, type ProtocolStep } from '@/offline/protocol'
import type { DecisionReading } from '@/disclosure/decisions'

/** The five values the index table's `Family` column uses. Closed at five. */
export type BlockerFamily = 'Content' | 'Authority' | 'Device' | 'Intelligence' | 'Distributed'

/**
 * The three classifications that OPEN a `Source status` cell. Closed at three.
 * None is a prefix of another, which is what makes `classificationOf`'s
 * prefix match safe — `Allowed` / `Allowed with conditions` is the shape that
 * has beaten an outcome check in this build before, and it is absent here.
 * `classificationOf` asserts exactly one match anyway, so introducing a prefix
 * pair later throws rather than picking the first.
 */
export type BlockerClassification =
  | 'SoW Fact'
  | 'Derived Clarification'
  | 'User-Mandated Product Extension'

export const BLOCKER_CLASSIFICATIONS = [
  'SoW Fact',
  'Derived Clarification',
  'User-Mandated Product Extension',
] as const satisfies readonly BlockerClassification[]

/** The §37 subsection carrying a blocker's detail entry. */
export type BlockerSection = '37.2' | '37.3' | '37.4' | '37.5' | '37.6'

/**
 * One row of the register index, header-keyed from L81160:
 * Identifier | Blocker | Family | Worker outcome | Source status.
 *
 * `blocker` is the index table's short title. The detail entry's title is
 * often longer — the index writes `Invalid signature` where L80934 writes
 * `Invalid package signature` — so `detailLine` is carried rather than a
 * second title, and the two are never conflated.
 *
 * `sourceStatus` is the cell verbatim, backticks removed. `workerOutcome` is
 * the honest half of the register: most rows say a blocked run is not a
 * blocked device.
 */
export interface OfflineBlocker {
  readonly identifier: string
  readonly blocker: string
  readonly family: BlockerFamily
  readonly workerOutcome: string
  readonly sourceStatus: string
  /** Frozen-source line of this row in the register index. */
  readonly indexLine: number
  /** Frozen-source line of this blocker's own detail entry in §37.2-§37.6. */
  readonly detailLine: number
  readonly section: BlockerSection
}

export const OFFLINE_BLOCKERS = [
  {
    identifier: 'OFF-BLK-01',
    blocker: 'Missing package',
    family: 'Content',
    workerOutcome: 'Run not-yet-ready; other runs continue',
    sourceStatus: 'SoW Fact — §7.6',
    indexLine: 81162,
    detailLine: 80930,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-02',
    blocker: 'Expired package',
    family: 'Content',
    workerOutcome: 'Run blocked; other runs continue',
    sourceStatus: 'Derived Clarification from §7.10.6',
    indexLine: 81163,
    detailLine: 80932,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-03',
    blocker: 'Invalid signature',
    family: 'Content',
    workerOutcome: 'Run refused; other runs continue',
    sourceStatus: 'Derived Clarification',
    indexLine: 81164,
    detailLine: 80934,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-04',
    blocker: 'Corrupt local data',
    family: 'Device',
    workerOutcome: 'Salvage mode; no new capture',
    sourceStatus: 'Derived Clarification from §7.19',
    indexLine: 81165,
    detailLine: 81070,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-05',
    blocker: 'Insufficient storage',
    family: 'Device',
    workerOutcome: 'Warning; behaviour TBD — Client Decision Required, DEC-STORE-001',
    sourceStatus: 'SoW Fact — §7.10.7 with an open item',
    indexLine: 81166,
    detailLine: 81072,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-06',
    blocker: 'Unsupported application version',
    family: 'Device',
    workerOutcome: 'Offline execution continues; sync refused',
    sourceStatus: 'SoW Fact — §8.13.1',
    indexLine: 81167,
    detailLine: 81074,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-07',
    blocker: 'Unsupported model version',
    family: 'Intelligence',
    workerOutcome: 'Authored instructions substitute; run continues',
    sourceStatus: 'Derived Clarification from §7.12',
    indexLine: 81168,
    detailLine: 81148,
    section: '37.6',
  },
  {
    identifier: 'OFF-BLK-08',
    blocker: 'Expired authentication',
    family: 'Authority',
    workerOutcome: 'Controlled stop; no new work',
    sourceStatus: 'SoW Fact — §7.10.5, §8.13.1',
    indexLine: 81169,
    detailLine: 81016,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-09',
    blocker: 'Revoked role',
    family: 'Authority',
    workerOutcome: 'Reduced scope; completed work unaffected',
    sourceStatus: 'SoW Fact — §4.8.4',
    indexLine: 81170,
    detailLine: 81018,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-10',
    blocker: 'Expired qualification',
    family: 'Authority',
    workerOutcome: 'Run parks; other runs continue',
    sourceStatus: 'SoW Fact — §7.13.2, §7.10.5',
    indexLine: 81171,
    detailLine: 81020,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-11',
    blocker: 'Suspended user',
    family: 'Authority',
    workerOutcome: 'Session ends; data preserved',
    sourceStatus: 'SoW Fact — §7.11',
    indexLine: 81172,
    detailLine: 81022,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-12',
    blocker: 'Suspended tenant',
    family: 'Authority',
    workerOutcome: 'Soft, hard or compliance behaviour',
    sourceStatus: 'SoW Fact — §4.2.3, §7.11',
    indexLine: 81173,
    detailLine: 81024,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-13',
    blocker: 'Suspended device',
    family: 'Authority',
    workerOutcome: 'Device locked; worker moves device',
    sourceStatus: 'SoW Fact — §8.13.3',
    indexLine: 81174,
    detailLine: 81026,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-14',
    blocker: 'Missing assignment',
    family: 'Authority',
    workerOutcome: 'Run absent from the list',
    sourceStatus: 'SoW Fact — §7.6, §7.1.5',
    indexLine: 81175,
    detailLine: 81028,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-15',
    blocker: 'Missing specification limits',
    family: 'Content',
    workerOutcome: 'Screen refuses capture; run parks',
    sourceStatus: 'SoW Fact — §3.1, §7.8.1',
    indexLine: 81176,
    detailLine: 80936,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-16',
    blocker: 'Missing evaluation',
    family: 'Content',
    workerOutcome: 'Agent content suppressed; run continues',
    sourceStatus: 'SoW Fact — §3.1, §8.7.4',
    indexLine: 81177,
    detailLine: 80938,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-17',
    blocker: 'Missing approval',
    family: 'Content',
    workerOutcome: 'Content suppressed or run parks',
    sourceStatus: 'SoW Fact — §5.11.1',
    indexLine: 81178,
    detailLine: 80940,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-18',
    blocker: 'Missing safety rules',
    family: 'Content',
    workerOutcome: 'Run unstartable, no fallback',
    sourceStatus: 'SoW Fact — §7.9.1, §7.9.4',
    indexLine: 81179,
    detailLine: 80942,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-19',
    blocker: 'Broken peripheral',
    family: 'Device',
    workerOutcome: 'Camera fallback; manual where authored',
    sourceStatus: 'SoW Fact — §7.8.2',
    indexLine: 81180,
    detailLine: 81076,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-20',
    blocker: 'Lost encryption key',
    family: 'Device',
    workerOutcome: 'Unrecoverable unsynced data, named explicitly',
    sourceStatus: 'Derived Clarification from §7.11',
    indexLine: 81181,
    detailLine: 81078,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-21',
    blocker: 'Clock drift',
    family: 'Device',
    workerOutcome: 'Work continues; ordering by server receipt',
    sourceStatus: 'SoW Fact — §7.10.4, §6.11.3',
    indexLine: 81182,
    detailLine: 81080,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-22',
    blocker: 'Queue corruption',
    family: 'Device',
    workerOutcome: 'Capture continues; upload deferred to rebuild',
    sourceStatus: 'Derived Clarification from §7.19',
    indexLine: 81183,
    detailLine: 81082,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-23',
    blocker: 'Multi-device conflict',
    family: 'Distributed',
    workerOutcome: 'No worker-facing effect, by design',
    sourceStatus: 'SoW Fact — §7.10.8, §6.11',
    indexLine: 81184,
    detailLine: 81112,
    section: '37.5',
  },
  {
    identifier: 'OFF-BLK-24',
    blocker: 'Long-duration outage',
    family: 'Distributed',
    workerOutcome: 'Floor continues; trust window eventually stops new work',
    sourceStatus: 'SoW Fact — §4.13.1, §7.10.5',
    indexLine: 81185,
    detailLine: 81114,
    section: '37.5',
  },
  {
    identifier: 'OFF-BLK-25',
    blocker: 'Missing authorized human',
    family: 'Authority',
    workerOutcome: 'Run parks; substitute sign-off path',
    sourceStatus: 'SoW Fact — §7.13.3',
    indexLine: 81186,
    detailLine: 81030,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-26',
    blocker: 'Artificial intelligence unavailable',
    family: 'Intelligence',
    workerOutcome: 'Authored instructions; safety fully active',
    sourceStatus: 'SoW Fact — §7.9.1, §7.12',
    indexLine: 81187,
    detailLine: 81150,
    section: '37.6',
  },
  {
    identifier: 'OFF-BLK-27',
    blocker: 'Cached guidance unavailable',
    family: 'Intelligence',
    workerOutcome: 'Step blocked; run parks',
    sourceStatus: 'Derived Clarification from §7.12',
    indexLine: 81188,
    detailLine: 81152,
    section: '37.6',
  },
  {
    identifier: 'OFF-BLK-28',
    blocker: 'Missing severity bundle or containment',
    family: 'Content',
    workerOutcome: 'Floor behaviour or unstartable run',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81189,
    detailLine: 80944,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-29',
    blocker: 'Missing locale rendering',
    family: 'Content',
    workerOutcome: 'Authored language substitutes',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81190,
    detailLine: 80946,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-30',
    blocker: 'Missing difficulty level',
    family: 'Content',
    workerOutcome: 'Nearest authored level substitutes',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81191,
    detailLine: 80948,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-31',
    blocker: 'No holdable scope for Severity 1',
    family: 'Distributed',
    workerOutcome: 'Run-level freeze',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81192,
    detailLine: 81116,
    section: '37.5',
  },
  {
    identifier: 'OFF-BLK-32',
    blocker: 'Pending wipe, unreachable device',
    family: 'Device',
    workerOutcome: 'Honest pending state; DEC-WIPE-001 open',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81193,
    detailLine: 81084,
    section: '37.4',
  },
  {
    identifier: 'OFF-BLK-33',
    blocker: 'Forced-sync action offline',
    family: 'Authority',
    workerOutcome: 'Run parks at the sign-off step',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81194,
    detailLine: 81032,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-34',
    blocker: 'Missing part reference',
    family: 'Content',
    workerOutcome: 'Step continues; consumption unresolved',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81195,
    detailLine: 80950,
    section: '37.2',
  },
  {
    identifier: 'OFF-BLK-35',
    blocker: 'Training Library unreachable',
    family: 'Intelligence',
    workerOutcome: 'No effect on any run',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81196,
    detailLine: 81154,
    section: '37.6',
  },
  {
    identifier: 'OFF-BLK-36',
    blocker: 'Substitute hierarchy unresolvable',
    family: 'Authority',
    workerOutcome: 'Run parks',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81197,
    detailLine: 81034,
    section: '37.3',
  },
  {
    identifier: 'OFF-BLK-37',
    blocker: 'Version change without package',
    family: 'Content',
    workerOutcome: 'Pinned versions continue; change waits',
    sourceStatus: 'User-Mandated Product Extension',
    indexLine: 81198,
    detailLine: 80952,
    section: '37.2',
  },
] as const satisfies readonly OfflineBlocker[]

/** Locators for the index table itself. Counted, not inferred from the span. */
export const BLOCKER_REGISTER_LOCATORS = {
  chapterHeading: 80717,
  headerLine: 81160,
  separatorLine: 81161,
  firstDataLine: 81162,
  lastDataLine: 81198,
  /** L81158, "Complete register index. Every cell explicit." */
  indexIntroLine: 81158,
  /** L81200, the section's own traceability paragraph. */
  traceabilityLine: 81200,
} as const

/**
 * One reading of the family counts, and where it was taken from. Three
 * readings, taken from three unrelated parts of the source, so the gate
 * compares independent evidence instead of this file with itself.
 */
export interface FamilyCountReading {
  readonly reading: string
  readonly locator: string
  readonly counts: Readonly<Record<BlockerFamily, number>>
}

export const FAMILY_COUNT_READINGS = [
  {
    reading: "The index table's own Family column",
    locator: 'L81160 header · rows L81162-L81198',
    counts: { Content: 12, Authority: 10, Device: 8, Intelligence: 4, Distributed: 3 },
  },
  {
    reading: 'Which §37.2-§37.6 section carries the blocker detail entry',
    locator: 'L80889 · L80977 · L81038 · L81088 · L81120',
    counts: { Content: 12, Authority: 10, Device: 8, Intelligence: 4, Distributed: 3 },
  },
  {
    reading: "The acceptance-criterion family each section numbers itself in",
    locator: 'AC-37-2xx · AC-37-3xx · AC-37-4xx · AC-37-5xx · AC-37-6xx',
    counts: { Content: 12, Authority: 10, Device: 8, Intelligence: 4, Distributed: 3 },
  },
] as const satisfies readonly FamilyCountReading[]

/**
 * The acceptance-criterion prefix each section numbers itself in, per family.
 * Reading 3's key: the numbering is the source's, this map is only the join.
 */
export const FAMILY_CRITERION_PREFIX = {
  Content: 'AC-37-2',
  Authority: 'AC-37-3',
  Device: 'AC-37-4',
  Distributed: 'AC-37-5',
  Intelligence: 'AC-37-6',
} as const satisfies Readonly<Record<BlockerFamily, string>>

/** Total, from the rows. Never a literal. */
export const BLOCKER_COUNT = OFFLINE_BLOCKERS.length

export function blockersInFamily(family: BlockerFamily): readonly OfflineBlocker[] {
  return OFFLINE_BLOCKERS.filter((b) => b.family === family)
}

export function blockerFamilyCounts(): Readonly<Record<BlockerFamily, number>> {
  const counts: Record<BlockerFamily, number> = {
    Content: 0,
    Authority: 0,
    Device: 0,
    Intelligence: 0,
    Distributed: 0,
  }
  for (const b of OFFLINE_BLOCKERS) counts[b.family] += 1
  return counts
}

/**
 * The classification a row's `Source status` cell OPENS with, derived from the
 * verbatim cell rather than stored beside it — one source of truth per row.
 * Throws where the cell opens with none of the three, and where it opens with
 * more than one, so a future prefix pair cannot be silently resolved by
 * declaration order.
 */
export function classificationOf(blocker: OfflineBlocker): BlockerClassification {
  const hits = BLOCKER_CLASSIFICATIONS.filter((c) => blocker.sourceStatus.startsWith(c))
  if (hits.length !== 1) {
    throw new Error(
      `${blocker.identifier}: Source status "${blocker.sourceStatus}" opens with ${hits.length} of the three classifications, not one.`,
    )
  }
  return hits[0] as BlockerClassification
}

export function blockersClassified(
  classification: BlockerClassification,
): readonly OfflineBlocker[] {
  return OFFLINE_BLOCKERS.filter((b) => classificationOf(b) === classification)
}

export function findBlocker(identifier: string): OfflineBlocker | null {
  return OFFLINE_BLOCKERS.find((b) => b.identifier === identifier) ?? null
}

/* ── §37.1, THE AUTHORISATION SECTION ─────────────────────────────────────── */

/** One of the three rules §37.1 states, with the line that states it. */
export interface AuthorizationRule {
  readonly rule: 1 | 2 | 3
  readonly name: string
  readonly sourceLine: number
}

/**
 * The three. L80781 — "Three rules, each quoted from the source and each
 * load-bearing for the whole register."
 */
export const AUTHORIZATION_RULES = [
  { rule: 1, name: 'The offline trust window', sourceLine: 80783 },
  { rule: 2, name: 'Clearance duration and next-gate enforcement', sourceLine: 80785 },
  { rule: 3, name: 'The parked run', sourceLine: 80787 },
] as const satisfies readonly AuthorizationRule[]

export const AUTHORIZATION_RULES_CLAIM_LINE = 80781

/**
 * One row of §37.1's supporting table, header-keyed from L80833:
 * Value | Default | Platform ceiling | Floor | Set by | Enforced where | Status.
 *
 * `defaultValue` rather than `default`, which is a reserved word. Every cell
 * is a non-empty string because L80831 says so and the transcription confirms
 * it; a blank cell here would be untypeable, which is the point.
 */
export interface AuthorizationLimit {
  readonly value: string
  readonly defaultValue: string
  readonly platformCeiling: string
  readonly floor: string
  readonly setBy: string
  readonly enforcedWhere: string
  readonly status: string
  readonly sourceLine: number
}

export const OFFLINE_AUTHORIZATION_LIMITS = [
  {
    value: 'Offline credential and clearance trust window',
    defaultValue: 'Approximately 24 hours',
    platformCeiling: '72 hours',
    floor: 'Tenant may shorten without limit',
    setBy: 'Tenant, within platform bounds',
    enforcedWhere: 'On-device, at each authority evaluation',
    status: 'SoW Fact — §7.10.5, §8.13.1, §1.7',
    sourceLine: 80835,
  },
  {
    value: 'Clock-skew threshold',
    defaultValue: 'Approximately 5 minutes',
    platformCeiling: '60 minutes',
    floor: 'Tenant may tighten without limit',
    setBy: 'Tenant',
    enforcedWhere: 'On-device flagging plus server-side ordering',
    status: 'SoW Fact — §1.7, §6.11.3, §7.10.4',
    sourceLine: 80836,
  },
  {
    value: 'Qualification clearance duration',
    defaultValue: 'Described by example only — a shift, or a day or two',
    platformCeiling: 'TBD — Client Decision Required, DEC-OFF-001',
    floor: 'TBD — Client Decision Required, DEC-OFF-001',
    setBy: 'Tenant, uniformly, deliberately not per-user',
    enforcedWhere: 'On-device, at the next gate evaluation',
    status: 'SoW Fact for the mechanism; the numeric bounds are Client Decision Required',
    sourceLine: 80837,
  },
  {
    value: 'Qualification-expiry warning schedule',
    defaultValue: '14 / 7 / 1 / 0 days',
    platformCeiling: 'Tenants may warn earlier, never later',
    floor: 'Not applicable — the schedule is a maximum lateness, not a minimum',
    setBy: 'Tenant',
    enforcedWhere: 'Delivered inside the single digest',
    status: 'SoW Fact — §3.6, §1.7',
    sourceLine: 80838,
  },
  {
    value: 'Qualification enforcement posture',
    defaultValue: 'Strict blocking',
    platformCeiling: 'Not applicable — posture is a choice, not a numeric bound',
    floor: 'Notify-without-blocking is the only alternative; nothing looser exists',
    setBy: 'Tenant, in the tenant administration area',
    enforcedWhere: 'On-device gate evaluation',
    status: 'SoW Fact — §3.1, §7.13.1',
    sourceLine: 80839,
  },
  {
    value: 'Second override, same area, same shift',
    defaultValue: 'Escalates to the Quality Manager',
    platformCeiling: 'Not applicable — an escalation rule, not a numeric bound',
    floor: 'Not applicable — as above',
    setBy: 'Platform',
    enforcedWhere: 'Server-side on clearance grant',
    status: 'SoW Fact — §3.6',
    sourceLine: 80840,
  },
] as const satisfies readonly AuthorizationLimit[]

export const AUTHORIZATION_LIMIT_LOCATORS = {
  sectionHeading: 80775,
  /** L80831, "No cell is blank." */
  tableIntroLine: 80831,
  headerLine: 80833,
  separatorLine: 80834,
  firstDataLine: 80835,
  lastDataLine: 80840,
} as const

/**
 * The two blockers §37.1's own workflow routes to, at L80799 and L80800. They
 * are looked up rather than described, so a register edit that drops either
 * breaks here.
 */
export const TRUST_WINDOW_EXPIRY_BLOCKER = 'OFF-BLK-08'
export const FORCED_SYNC_OFFLINE_BLOCKER = 'OFF-BLK-33'

/**
 * L80801 — "At reconnection, steps 6, 10 and 22 of the protocol revalidate
 * credentials, revalidate qualifications and deliver any pending clearance."
 *
 * The numbers are resolved through the step model rather than written here.
 * `claim` is what L80801 says that step does; the gate holds it against the
 * step's own title in `@/offline/protocol`.
 */
export interface RevalidationStep {
  readonly step: ProtocolStep
  readonly claim: string
}

export const REVALIDATION_STEPS = [
  { step: step(6), claim: 'revalidate credentials' },
  { step: step(10), claim: 'revalidate qualifications' },
  { step: step(22), claim: 'deliver any pending clearance' },
] as const satisfies readonly RevalidationStep[]

export const REVALIDATION_STEPS_CLAIM_LINE = 80801

/**
 * Compile-time proof the step model is the one imported, not re-declared. If
 * `PROTOCOL_STEPS` stops being the array `step()` reads, this stops compiling.
 */
const _stepsComeFromTheProtocol: readonly ProtocolStep[] = PROTOCOL_STEPS
void _stepsComeFromTheProtocol

/* ── WHAT THE REGISTER SAYS ABOUT ITSELF THAT IT DOES NOT DO ──────────────── */

/**
 * A claim the chapter makes about its own register, and the measurement of the
 * register against it. `adopted` is `null` on every one: these are the source
 * disagreeing with itself, and choosing would be this build deciding what a
 * worker is told when their unsynced work is gone.
 */
export interface RegisterSelfClaim {
  readonly key: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: null
  readonly measured: string
  /**
   * The measurement in numbers, so the gate compares the source's count with
   * this file's claim rather than reading `measured` as prose. A wrong number
   * here is a red test, which is the only reason to carry it twice.
   */
  readonly counts: Readonly<Record<string, number>>
}

export const REGISTER_SELF_CLAIMS = [
  {
    key: 'message-count',
    question: 'How many user-facing message texts does the register carry — thirty-seven, or more?',
    readings: [
      {
        text:
          'Thirty-seven, one per blocker. The chapter field contract requires every entry to ' +
          'define the exact user-facing message text without exception and without blanks, and ' +
          'TEST-37-004 is a string audit of "all thirty-seven messages".',
        locator: 'field contract L80725 · TEST-37-004 L80769',
      },
      {
        text:
          'Forty-two. Thirty-three entries carry one `Message text:` field; four carry more, ' +
          'qualified by audience or by state — OFF-BLK-12 three, for soft, hard and compliance ' +
          'suspension, and OFF-BLK-23, OFF-BLK-24 and OFF-BLK-32 two each, one worker-facing and ' +
          'one to an operator or Tenant Admin. Measured over the entry lines of all thirty-seven.',
        locator: 'OFF-BLK-12 L81024 · OFF-BLK-23 L81112 · OFF-BLK-24 L81114 · OFF-BLK-32 L81084',
      },
    ],
    adopted: null,
    measured: '33 entries with one field, 4 with more, 42 message texts across 37 blockers',
    counts: { entries: 37, messageFields: 42, entriesWithExactlyOneField: 33 },
  },
  {
    key: 'worker-facing-message-is-universal',
    question: 'Does every blocker carry a worker-facing message?',
    readings: [
      {
        text:
          'Yes. The field contract admits no exception, and the blocked-state panel storyboard ' +
          'describes a reassurance line "present in every blocker without exception".',
        locator: 'field contract L80725 · SCR-FL-BLOCK-01 L80758',
      },
      {
        text:
          'No, and the register names the exception itself. OFF-BLK-23 records its worker message ' +
          'as none, because conflict resolution is a Command Center surface: "This is the one ' +
          'blocker in the register with no worker-facing message". OFF-BLK-24 states no message ' +
          "of its own either, applying OFF-BLK-08's text.",
        locator: 'OFF-BLK-23 L81112 · OFF-BLK-24 L81114',
      },
    ],
    adopted: null,
    measured: '36 of 37 entries carry a worker-facing message; OFF-BLK-23 declares none',
    counts: { entries: 37, entriesDeclaringNoWorkerMessage: 1 },
  },
  {
    key: 'work-is-saved',
    question:
      'Is a blocker guaranteed to leave locally committed work recoverable, and to say so?',
    readings: [
      {
        text:
          'Yes, absolutely. Governing rule one is that a blocker never destroys local data, and ' +
          'AC-37-002 requires that no blocker "deletes, truncates or renders unrecoverable any ' +
          'locally committed capture". The panel storyboard puts the reassurance line in every ' +
          'blocker without exception.',
        locator: 'rule 1 L80729 · AC-37-002 L80767 · SCR-FL-BLOCK-01 L80758',
      },
      {
        text:
          "No. OFF-BLK-20's message text tells the worker that unsynced work is gone — \"Any work " +
          'not yet sent cannot be recovered from this tablet." — and its own index row names the ' +
          'outcome as unrecoverable unsynced data. The register states the exception on the face ' +
          'of the table the absolute is written above.',
        locator: 'message L81078 · index row L81181',
      },
    ],
    adopted: null,
    measured:
      'the sentence "Your work is saved." is present verbatim in 27 of the 37 entries; of the ' +
      'other ten, seven carry a variant wording, two are the multi-audience entries, and ' +
      "OFF-BLK-20's says the opposite",
    counts: { entries: 37, entriesWithTheReassuranceVerbatim: 27 },
  },
] as const satisfies readonly RegisterSelfClaim[]

/**
 * The one row whose `Worker outcome` cell contradicts AC-37-002. Named, so the
 * claim above is reachable from the row and not only from prose.
 */
export const UNRECOVERABLE_DATA_BLOCKER = 'OFF-BLK-20'

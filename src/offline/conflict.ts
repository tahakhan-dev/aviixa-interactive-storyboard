import type { DecisionReading } from '@/disclosure/decisions'
import { FALLBACK_LOCAL_DISCLOSURES } from '@/fallbacks/disclosure'

/**
 * CONFLICT AUTHORITY, THE CLOCK-SKEW GUARD, AND THE ONE QUESTION THIS BUILD
 * MUST NOT ANSWER. Frozen source §36.3 and §36.4.
 *
 * ── THE RECORD HOLDS BOTH VERSIONS. THERE IS NO WINNER FIELD ON IT ─────────
 * L80142 states the absolute rule: a valid worker capture is never silently
 * overwritten, and where last-write-wins would discard one the losing version
 * is preserved in full — "both values, both timestamps, both workers" — and
 * the conflict is recorded, displayed, and available for review. That is the
 * shape of `ConflictRecord`: a two-element tuple of `ConflictVersion`, each
 * carrying its own worker, its own device capture timestamp, its own
 * server-receipt timestamp, and its own skew reading. Nothing on the record
 * says which one won, because a resolution is a separate value that the record
 * outlives. Deleting a version is not a thing this module can express.
 *
 * The panel that renders it is specified the same way at L80300, which asks
 * for both values, both device timestamps, both server-receipt timestamps,
 * both workers, the computed deviation, and the tenant threshold in force.
 * Every one of those is a field below.
 *
 * ── TWELVE FAMILIES, TWELVE RULES, AND THE COLLAPSE THAT IS FORBIDDEN ──────
 * `CONFLICT_AUTHORITY` transcribes the per-object authority table at
 * L80185-L80198 — header L80185, separator L80186, twelve data rows — cell by
 * cell and header-keyed, four columns: Object family, Who wins, Why, When it
 * must instead route to human resolution.
 *
 * The families DO NOT share a rule. Exactly two of the twelve reach a plain
 * last-write-wins outcome, and the source says so itself at L80181 — "only two
 * object families ever reach a plain last-write-wins outcome, and that the
 * measurement family never does". `LAST_WRITE_WINS_FAMILIES` is therefore
 * DERIVED from the transcribed `whoWins` cells rather than hand-set, so it
 * cannot say two while the rows say something else.
 *
 * ── WHAT THIS MODULE COMPUTES, AND THE LINE IT DOES NOT CROSS ──────────────
 * `resolveConflict` walks the numbered workflow at L80146-L80155 and nothing
 * more. It computes a last-write winner ONLY for the two last-write-wins
 * families, because only there is the winner a function of the two writes in
 * the record. Ten families resolve on PROVENANCE — the server's assignment
 * record, the pinned package version, a governance act, the device's own
 * classification — and a conflict record holding two device-side writes does
 * not carry which side is which. `lastWriteWinner` stays `null` there rather
 * than being guessed, and `rule` carries the row's own words so the caller
 * applies the rule the source wrote instead of one this module invented.
 *
 * ── THE SKEW CHECK RUNS FIRST, AND THAT ORDER IS THE POINT ─────────────────
 * L80181 again — "an untrusted clock disqualifies a write from winning
 * anything, regardless of what kind of object it is" — and the same sentence
 * says the skew check runs before the object-family rule, not after. So the
 * skew branch is the first branch, and a measurement conflict with one
 * skew-flagged write reports the skew reason, not the family reason.
 *
 * ── THE FLAG OUTLIVES THE CORRECTION, STRUCTURALLY ─────────────────────────
 * `AC-36-408` at L80363: "The skew flag persists on historical writes after
 * the device clock is corrected." L80343 gives the reason in the recovery
 * bullet — the record must remain honest about the condition under which it
 * was made — and L80335 states the exit trigger the same way: existing flags
 * persist on the writes they were applied to.
 *
 * A boolean would be cleared by the very operation that records the fix. So
 * the correction is recorded INSIDE the flag: `SkewFlag.deviceClockCorrectedAt`
 * moves from `null` to a timestamp, and `recordDeviceClockCorrection` returns
 * `SkewFlag`, never `SkewFlag | null`. The only function in this module that
 * touches a clock correction cannot produce an unflagged write.
 *
 * THE CEILING ON THAT, NAMED RATHER THAN IMPLIED: a caller can still build a
 * fresh `ConflictVersion` object with `skewFlagged: null`, because a plain
 * object literal is always assignable. What is removed is the only spelling a
 * build under pressure would reach for. Closing the rest needs an opaque
 * constructor for `ConflictVersion`, which is a larger change than this task
 * owns and which nothing in the source asks for.
 *
 * ── FOUR THINGS IN §36.3 THAT DO NOT LINE UP ───────────────────────────────
 * Counted, not tidied. `CONFLICT_SOURCE_FINDINGS` carries them with locators.
 *
 * ── AND ONE QUESTION THIS BUILD REFUSES TO ANSWER ──────────────────────────
 * See `DEC_FB_008_DISCLOSURE`. Chapter 36 states as `SoW Fact` the very
 * question chapter 38 records as unresolved, a safety claim is at stake, and
 * both readings are carried with neither chosen.
 *
 * This module is data plus one pure function. It reads no clock of its own and
 * writes nothing.
 */

/* ==================================================================== *
 * THE TWELVE OBJECT FAMILIES.
 * ==================================================================== */

/**
 * One identifier per data row of the authority table, in source order. CLOSED
 * AT TWELVE: `AC-36-301` (L80239) says "all twelve object families" and
 * L80231 says the acceptance tests are "one per object family row".
 */
export type ConflictFamilyId =
  | 'run-level-state'
  | 'shared-checklist-item'
  | 'individual-measurement-capture'
  | 'evidence-object'
  | 'deviation-record-and-severity-classification'
  | 'hold-state'
  | 'containment-checklist-item'
  | 'unit-or-lot-binding'
  | 'assignment-state'
  | 'qualification-and-clearance-state'
  | 'configuration-specification-limits-and-workflow-version'
  | 'server-side-correction'

/** One row of the per-object authority table. Four cells, all verbatim. */
export interface ConflictAuthorityRow {
  readonly id: ConflictFamilyId
  /** The frozen-source line this row's four cells were read from. */
  readonly sourceLine: number
  /** Column 1, `Object family`. */
  readonly family: string
  /** Column 2, `Who wins`. */
  readonly whoWins: string
  /**
   * Column 3, `Why`. Carries the row's own source classification inline, and
   * five of the twelve carry two classifications in one cell — see
   * `leadClassificationOf`, which reads the token the cell OPENS with rather
   * than picking one.
   */
  readonly why: string
  /** Column 4, `When it must instead route to human resolution`. */
  readonly humanResolution: string
}

/**
 * The twelve rows of L80187-L80198, transcribed header-keyed and cell by cell.
 * Order is source order, which is also the order `TEST-36-401` onward would
 * have walked had the other six been written — see `CONFLICT_SOURCE_FINDINGS`.
 */
export const CONFLICT_AUTHORITY = [
  {
    id: 'run-level-state',
    sourceLine: 80187,
    family:
      "Run-level state, for example a run's shared progress marker",
    whoWins:
      'Last write wins by device capture timestamp',
    why:
      "`SoW Fact — §4.13.2, §6.11.2` — this is the source's named case, and run-level state is genuinely shared",
    humanResolution:
      'Either write is skew-flagged; or the state transition is one the run lifecycle forbids from that predecessor state',
  },
  {
    id: 'shared-checklist-item',
    sourceLine: 80188,
    family:
      'Shared checklist item completed by two workers',
    whoWins:
      'Last write wins by device capture timestamp',
    why:
      '`SoW Fact — §6.11.1` names this exact case; both completions are true, and the record needs one',
    humanResolution:
      'Either write is skew-flagged; or the item belongs to a pre-authorised containment checklist, where both completions are retained and neither is discarded',
  },
  {
    id: 'individual-measurement-capture',
    sourceLine: 80189,
    family:
      'Individual measurement capture',
    whoWins:
      'Neither is overwritten',
    why:
      '`Derived Clarification` — a measurement is evidence of a physical reading, and discarding one is discarding evidence; evidence is immutable at creation `SoW Fact — §7.8.4`',
    humanResolution:
      'Always, where two measurements genuinely compete for the same capture slot; and immediately to the deviation mechanism where they disagree beyond specification limits `SoW Fact — §6.11.5`',
  },
  {
    id: 'evidence-object',
    sourceLine: 80190,
    family:
      'Evidence object, for example a photograph',
    whoWins:
      'Neither replaces the other; both are retained and both are bound',
    why:
      '`SoW Fact — §7.8.4` — captured evidence is immutable and cannot be edited after capture',
    humanResolution:
      'Never automatically discarded; a reviewer marks which is the operative proof through the append-only correction path',
  },
  {
    id: 'deviation-record-and-severity-classification',
    sourceLine: 80191,
    family:
      'Deviation record and severity classification',
    whoWins:
      "The device's on-device classification stands",
    why:
      '`SoW Fact — §7.9.2` — classification is the act of record and the server mirrors it; no artificial intelligence and no later write reclassifies',
    humanResolution:
      'A Quality Manager may reclassify at review time with a recorded reason `SoW Fact — §3.3`, which is a governance act, not a conflict resolution',
  },
  {
    id: 'hold-state',
    sourceLine: 80192,
    family:
      'Hold state, including the automatic Severity 1 hold',
    whoWins:
      'The hold stands; no device write lifts it',
    why:
      '`SoW Fact — §3.3, §7.9.2` — release is Quality Manager only, uniformly, arriving as a lot-release command',
    humanResolution:
      'Never resolvable as a sync conflict; release is Command Center action 4 and nothing else',
  },
  {
    id: 'containment-checklist-item',
    sourceLine: 80193,
    family:
      'Containment checklist item',
    whoWins:
      'Both completions retained; no discard',
    why:
      '`Derived Clarification` from `SoW Fact — §3.4` — containment is a safety record and a discarded completion is a missing safety record',
    humanResolution:
      'Where the two completions imply contradictory containment outcomes, to the Quality Manager',
  },
  {
    id: 'unit-or-lot-binding',
    sourceLine: 80194,
    family:
      'Unit or lot binding',
    whoWins:
      'The earliest valid binding stands; a later contradictory binding is quarantined',
    why:
      '`Derived Clarification` — rebinding a capture to a different serial after the fact would corrupt genealogy `SoW Fact — §2.3, §7.17.1`',
    humanResolution:
      'Always, where a contradictory binding arrives; the Quality Manager decides',
  },
  {
    id: 'assignment-state',
    sourceLine: 80195,
    family:
      'Assignment state, including reassignment and substitution',
    whoWins:
      "The server's assignment record wins over any device belief",
    why:
      '`Derived Clarification` from `SoW Fact — §7.2.2, §2.2` — assignment is a Hub act delivered by command, never a device decision',
    humanResolution:
      "Where the device's completed work was performed under a since-superseded assignment, to the Supervisor, with pre-substitution steps staying attributed to the original worker",
  },
  {
    id: 'qualification-and-clearance-state',
    sourceLine: 80196,
    family:
      'Qualification and clearance state',
    whoWins:
      'The server record wins',
    why:
      '`SoW Fact — §3.6, §7.13.1` — qualifications are supervisor-entered with full audit, no self-attestation',
    humanResolution:
      'Where a device performed a gated step under a clearance the server shows as expired, to the Quality Manager',
  },
  {
    id: 'configuration-specification-limits-and-workflow-version',
    sourceLine: 80197,
    family:
      'Configuration, specification limits and workflow version',
    whoWins:
      'The pinned package version that the run executed under stands',
    why:
      '`SoW Fact — §7.10.6, §3.8` — a run finishes on the version it started on and the version number is the audit receipt',
    humanResolution:
      'Never a conflict; a later version is a different pinning, not a competing write',
  },
  {
    id: 'server-side-correction',
    sourceLine: 80198,
    family:
      'Server-side correction made under the append-only path while a device was offline',
    whoWins:
      "The correction stands as a governance act; the device's original capture is retained as the record it corrects",
    why:
      '`SoW Fact — §6.11.1` names this case; `SoW Fact — §7.7.3` fixes correction as append-only',
    humanResolution:
      "Where the device's later capture is itself a new physical reading rather than a stale copy, to the Quality Manager",
  },
] as const satisfies readonly ConflictAuthorityRow[]

/** Compile-time proof that no family id was dropped from the table. */
type FamilyIdsNotInTable = Exclude<
  ConflictFamilyId,
  (typeof CONFLICT_AUTHORITY)[number]['id']
>
const _everyFamilyHasARow: FamilyIdsNotInTable extends never ? true : never = true
void _everyFamilyHasARow

/** The row for a family. Throws rather than returning a silent default. */
export function authorityFor(id: ConflictFamilyId): ConflictAuthorityRow {
  const row = CONFLICT_AUTHORITY.find((r) => r.id === id)
  if (row === undefined) {
    throw new Error(`no authority row for object family ${id}`)
  }
  return row
}

/**
 * The `Who wins` cell rows 1 and 2 both carry, verbatim. Named once so
 * `LAST_WRITE_WINS_FAMILIES` is a comparison against the transcription rather
 * than a second, hand-maintained list of which families race on a clock.
 */
export const LAST_WRITE_WINS_CELL = 'Last write wins by device capture timestamp'

/**
 * The families that reach a plain last-write-wins outcome, derived from the
 * cells. L80181 states the count in the source's own words.
 */
export const LAST_WRITE_WINS_FAMILIES: readonly ConflictAuthorityRow[] =
  CONFLICT_AUTHORITY.filter((r) => r.whoWins === LAST_WRITE_WINS_CELL)

/**
 * The classification token a `Why` cell OPENS with.
 *
 * `Derived Clarification`, and stated as one: four of the twelve cells carry
 * BOTH tokens — row L80189 opens `Derived Clarification` and closes on
 * `SoW Fact — §7.8.4`, and row L80195 — "`Derived Clarification` from
 * `SoW Fact — §7.2.2, §2.2`" — so a single-token field would be a pick. What
 * is mechanical, and therefore what this returns, is which token the cell
 * begins with. The rest of the cell stays intact on `why`.
 */
export function leadClassificationOf(
  row: ConflictAuthorityRow,
): 'SoW Fact' | 'Derived Clarification' {
  return row.why.startsWith('`Derived Clarification') ? 'Derived Clarification' : 'SoW Fact'
}

/* ==================================================================== *
 * THE SKEW GUARD. §36.4, L80248-L80365.
 * ==================================================================== */

/**
 * A skew reading on one write. Its presence IS the flag; there is no separate
 * boolean, so there is nothing to set false.
 *
 * The two numbers are the pair the panel is specified to show at L80300 — the
 * computed deviation and the tenant threshold in force — held per write rather
 * than looked up later, because the threshold is tenant-set and can be
 * tightened after the write was made (L80308: default approximately 5 minutes,
 * platform ceiling 60).
 */
export interface SkewFlag {
  /** The computed deviation of device time from server receipt, in minutes. */
  readonly deviationMinutes: number
  /** The tenant's clock-skew threshold at the moment this write was judged. */
  readonly thresholdMinutesInForce: number
  /**
   * When the device's clock was afterwards corrected, or `null` if it has not
   * been. `AC-36-408` (L80363) requires the flag to persist through exactly
   * this event, so the correction is recorded here INSIDE the flag instead of
   * being expressible as the flag's removal.
   */
  readonly deviceClockCorrectedAt: string | null
}

/**
 * Record that the device's clock was corrected after this write was flagged.
 *
 * Takes a `SkewFlag` and returns a `SkewFlag` — not `SkewFlag | null` — so the
 * one operation that would want to clear a flag has no way to spell it.
 * `TEST-36-508` (L80363) is correct the clock, re-query historical writes,
 * assert the flags persist.
 */
export function recordDeviceClockCorrection(
  flag: SkewFlag,
  deviceClockCorrectedAt: string,
): SkewFlag {
  return { ...flag, deviceClockCorrectedAt }
}

/* ==================================================================== *
 * THE CONFLICT RECORD AND ITS RESOLUTION.
 * ==================================================================== */

/** One of the two competing writes. */
export interface ConflictVersion {
  /** The value this write carries, as the panel displays it. */
  readonly value: string
  /** The worker the write is attributed to. Attribution follows the login and is unaffected by skew (L80319). */
  readonly workerId: string
  /** The device's own capture timestamp. What last-write-wins orders on, where it applies at all. */
  readonly deviceCaptureTimestamp: string
  /** Server-receipt time, which is authoritative for record ordering (L80256). */
  readonly serverReceiptTimestamp: string
  /** The skew reading, or `null` where the deviation was within the threshold. */
  readonly skewFlagged: SkewFlag | null
}

/**
 * Both versions, both timestamps, both workers — L80142. A fixed pair, never a
 * growable list and never a single value with a shadow copy of the loser.
 */
export interface ConflictRecord {
  readonly objectFamily: ConflictFamilyId
  readonly versions: readonly [ConflictVersion, ConflictVersion]
  /**
   * Whether the two competing values disagree beyond the screen's
   * specification limits. Step 8 (L80153) passes such a conflict ADDITIONALLY
   * to the rule-based deviation mechanism, and `AC-36-304` (L80242) turns on
   * it. This module cannot compute it: the limits live on the screen, not on
   * the conflict.
   */
  readonly beyondSpecificationLimits: boolean
  /**
   * The row's own non-skew human-resolution condition, named by the caller
   * when it holds, or `null`.
   *
   * Column 4 is prose about facts outside this record — whether a state
   * transition is one the run lifecycle forbids, whether a checklist item
   * belongs to a pre-authorised containment checklist. This module will not
   * pretend to evaluate them; it takes the caller's word and quotes it back on
   * the resolution.
   */
  readonly familyHumanTrigger: string | null
}

/**
 * What the record carries while a conflict is open. Only meaningful on an
 * `individual review` route: L80152, L80215 and L80275 all speak of what the
 * record carries "meanwhile", and an automatic resolution has no meanwhile.
 *
 * `0` and `1` index `ConflictRecord.versions`.
 */
export type CarriedMeanwhile =
  | 0
  | 1
  | 'the pre-conflict value'
  | 'the safer version, which is a reviewer judgement'

export interface ConflictResolution {
  readonly route: 'automatic' | 'individual review'
  /** The rule that settled the route, in the source's own words. */
  readonly rule: string
  /** Which step or which row settled it, with its locator. */
  readonly because: string
  /** What the record carries meanwhile, or `null` on an automatic route. */
  readonly carriesMeanwhile: CarriedMeanwhile | null
  /**
   * The winning index for the two last-write-wins families only. `null`
   * everywhere else — including automatic routes, whose winner turns on
   * provenance a conflict record does not carry.
   */
  readonly lastWriteWinner: 0 | 1 | null
  /** Step 8 (L80153). ADDITIONAL to the route, never instead of it. */
  readonly toDeviationMechanism: boolean
}

function captureMillis(version: ConflictVersion, side: 0 | 1): number {
  const t = Date.parse(version.deviceCaptureTimestamp)
  if (Number.isNaN(t)) {
    throw new Error(
      `version ${side} has an unparseable device capture timestamp: ${version.deviceCaptureTimestamp}`,
    )
  }
  return t
}

/**
 * The numbered workflow of L80146-L80155, and nothing beyond it.
 *
 * Branch order is the source's: skew first (step 4, L80149), then the object
 * family rule (step 5, L80150). L80181 says why that order and not the other —
 * an untrusted clock disqualifies a write from winning anything, regardless of
 * what kind of object it is.
 *
 * TWO `Derived Clarification`s, both named here rather than hidden:
 *
 * 1. A column-4 cell that OPENS with the word Always routes to human
 *    resolution on every real conflict of that family. Rows L80189 and L80194
 *    are the two, and each qualifies Always with a clause a `ConflictRecord`
 *    satisfies by construction — two measurements genuinely competing for the
 *    same capture slot, a contradictory binding arriving. Read off the cell
 *    rather than hand-listed, so it cannot disagree with the transcription.
 * 2. Two identical device capture timestamps yield no last write. The source
 *    does not address a tie; L80214 states its conservative instinct for the
 *    case it does not cover — preserve both, resolve nothing automatically,
 *    route to Quality Manager review — and picking a side of a tie would be
 *    the silent overwrite L80142 forbids.
 */
export function resolveConflict(record: ConflictRecord): ConflictResolution {
  const [a, b] = record.versions
  const toDeviationMechanism = record.beyondSpecificationLimits

  if (a.skewFlagged !== null && b.skewFlagged !== null) {
    return {
      route: 'individual review',
      rule: 'Where both writes are skew-flagged, neither may win unreviewed; the record carries the pre-conflict value and both writes are presented for individual review',
      because: 'the secondary fallback of FB-SYNC-02, L80215',
      carriesMeanwhile: 'the pre-conflict value',
      lastWriteWinner: null,
      toDeviationMechanism,
    }
  }

  if (a.skewFlagged !== null || b.skewFlagged !== null) {
    return {
      route: 'individual review',
      rule: 'Where either competing write is skew-flagged, automatic resolution is suppressed and the conflict routes to individual Quality Manager review; the record carries the unflagged version meanwhile',
      because: 'step 4 of the numbered workflow, L80149',
      carriesMeanwhile: a.skewFlagged !== null ? 1 : 0,
      lastWriteWinner: null,
      toDeviationMechanism,
    }
  }

  const row = authorityFor(record.objectFamily)

  if (row.humanResolution.startsWith('Always')) {
    return {
      route: 'individual review',
      rule: row.whoWins,
      because: `the authority table's own human-resolution cell for ${row.id}, L${row.sourceLine}`,
      carriesMeanwhile: 'the safer version, which is a reviewer judgement',
      lastWriteWinner: null,
      toDeviationMechanism,
    }
  }

  if (record.familyHumanTrigger !== null) {
    return {
      route: 'individual review',
      rule: row.humanResolution,
      because: `the caller reports the row's human-resolution condition holds: ${record.familyHumanTrigger}`,
      carriesMeanwhile: 'the safer version, which is a reviewer judgement',
      lastWriteWinner: null,
      toDeviationMechanism,
    }
  }

  if (row.whoWins !== LAST_WRITE_WINS_CELL) {
    return {
      route: 'automatic',
      rule: row.whoWins,
      because: `the authority table's rule for ${row.id}, L${row.sourceLine}; which write it names turns on provenance this record does not carry`,
      carriesMeanwhile: null,
      lastWriteWinner: null,
      toDeviationMechanism,
    }
  }

  const ta = captureMillis(a, 0)
  const tb = captureMillis(b, 1)

  if (ta === tb) {
    return {
      route: 'individual review',
      rule: row.whoWins,
      because:
        'the two device capture timestamps are identical, so there is no last write; the conservative default of L80214 applies',
      carriesMeanwhile: 'the safer version, which is a reviewer judgement',
      lastWriteWinner: null,
      toDeviationMechanism,
    }
  }

  return {
    route: 'automatic',
    rule: row.whoWins,
    because: `the authority table's rule for ${row.id}, L${row.sourceLine}; the loser is preserved and the conflict event is audited, step 6, L80151`,
    carriesMeanwhile: null,
    lastWriteWinner: ta > tb ? 0 : 1,
    toDeviationMechanism,
  }
}

/* ==================================================================== *
 * WHAT DID NOT LINE UP IN §36.3. COUNTED, NOT TIDIED.
 * ==================================================================== */

export interface ConflictSourceFinding {
  readonly what: string
  readonly evidence: string
  readonly sourceRef: string
}

export const CONFLICT_SOURCE_FINDINGS = [
  {
    what: "The prose enumeration of the object families names eleven of the table's twelve.",
    evidence:
      'Step 2 of the numbered workflow lists the families a record type is identified as, and stops ' +
      'at configuration and version state. The twelfth row of the table — a server-side correction ' +
      'made under the append-only path while a device was offline — is not in that list, and it is ' +
      'the one §6.11.1 names in the source itself as a genuine conflict case. A classifier written ' +
      'from the prose has no family for it, and no family is the one condition the fallback at ' +
      'L80214 sends to the most conservative rule in the table.',
    sourceRef: 'numbered workflow step 2 · L80147 · the missing row L80198',
  },
  {
    what: 'Twelve acceptance tests are promised, one per object family row. Six exist.',
    evidence:
      'The fallback contract block says the acceptance tests are TEST-36-401 through TEST-36-412, ' +
      'one per object family row. The acceptance-criteria table below it — header L80237, six data ' +
      'rows L80239-L80244 — names TEST-36-401 through TEST-36-406 and stops. Measured against the ' +
      'frozen source, TEST-36-407 through TEST-36-411 occur nowhere in the document at all, and ' +
      'TEST-36-412 occurs exactly once, inside the promise itself. So the promised per-family ' +
      'coverage is short by six, and the six that exist are grouped by property rather than by ' +
      'family.',
    sourceRef: 'the promise L80231 · the table L80237-L80244',
  },
  {
    what: 'The flowchart offers five family branches against the table’s twelve rows.',
    evidence:
      'The object-family decision node fans out to five branches, two of which each carry two ' +
      'families — shared run level state or shared checklist item, and severity classification or ' +
      'hold state. Containment checklist item, unit or lot binding, qualification and clearance ' +
      'state, and configuration, specification limits and workflow version appear in no branch by ' +
      'name. The diagram is a summary of the table and is not a second statement of it; a build ' +
      'that transcribed the diagram would ship five rules where the source states twelve.',
    sourceRef: 'branches L80164-L80168 · rows L80187-L80198',
  },
  {
    what: 'The section classifies the whole authority table Derived Clarification. Eight of its twelve rows classify themselves SoW Fact.',
    evidence:
      'The source-status bullet and the traceability paragraph both say the per-object authority ' +
      'table is Derived Clarification in whole. Read cell by cell, eight of the twelve Why cells ' +
      'OPEN with SoW Fact and carry section references with it, and four open with Derived ' +
      'Clarification. Both statements are recorded: the table-level classification stays quoted ' +
      'where the source put it, and leadClassificationOf reads each row rather than inheriting the ' +
      'table-level one. This matters most on the hold-state row, whose SoW Fact is the claim ' +
      'DEC-FB-008 records as unresolved.',
    sourceRef: 'source status L80233 · traceability L80246 · the rows L80187-L80198',
  },
] as const satisfies readonly ConflictSourceFinding[]

/* ==================================================================== *
 * THE ONE QUESTION THIS BUILD MUST NOT ANSWER.
 *
 * `src/disclosure/decisions.ts` carries no `DEC-FB-*` record — no such
 * identifier is in its `DecisionId` union. That file is not this task's to
 * edit — one later task lifts the
 * whole Chapter 38 set at once — so this is disclosed here, in the canon's own
 * record shape, with `DecisionReading` IMPORTED rather than redeclared.
 *
 * THE READINGS ARE IMPORTED, NOT RE-SPELLED, AND THAT IS THE WHOLE RULING.
 * `src/fallbacks/disclosure.ts` already discloses `DEC-FB-008` from the
 * chapter-38 side. This module holds the chapter-36 side — L80192 is a row of
 * the table transcribed above — so the same decision now has two homes, which
 * is the shape `MOD-FL-A5` and `MOD-FL-A6` already met on `DEC-CLOCKWIN-001`.
 * They solved it by pinning their readings character-for-character with a
 * gate. Importing the array is that, one degree stronger: there is no second
 * spelling to drift, because there is no second spelling. If the fallbacks
 * record moves, this module fails at import rather than quietly keeping a
 * stale copy.
 *
 * BOTH READINGS AND BOTH LOCATORS ARE RECORDED AND NEITHER IS CHOSEN. There is
 * no field on the record below in which one reading could be marked the
 * answer, and the canon's `DecisionReading` has exactly two fields for exactly
 * that reason. `adopted` says what this build does, which is nothing.
 * ==================================================================== */

const DEC_FB_008_IN_FALLBACKS = FALLBACK_LOCAL_DISCLOSURES.find(
  (d) => d.decisionRef === 'DEC-FB-008',
)

if (DEC_FB_008_IN_FALLBACKS === undefined) {
  throw new Error(
    'src/fallbacks/disclosure.ts no longer carries DEC-FB-008. This module imports its ' +
      'readings rather than re-spelling them; if that record moved, this module follows it ' +
      'and does not grow a copy.',
  )
}

/**
 * The canon's record shape, minus the canon's key. No `id`, because this is
 * not in the canon and must not look as though it is.
 */
export interface OfflineConflictDisclosure {
  readonly decisionRef: 'DEC-FB-008'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does, and why. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why this is disclosed locally rather than through the canon. */
  readonly canonNote: string
  /**
   * The object families of the table above whose transcribed cells carry the
   * hold and the severity classification.
   *
   * THIS ATTACHMENT IS THIS BUILD'S READING, NOT THE SOURCE'S. `DEC-FB-008`
   * occurs twice in the whole document, at L82477 and at its index row
   * L115322, and neither occurrence is inside the authority table or names a
   * family. The two named here are the rows whose own words are the claim
   * chapter 38 refuses.
   */
  readonly bearsOnFamilies: readonly ConflictFamilyId[]
  /** Says, on the record, that `bearsOnFamilies` is this build's binding. */
  readonly bearsOnNote: string
}

export const DEC_FB_008_DISCLOSURE = {
  decisionRef: 'DEC-FB-008',
  question: DEC_FB_008_IN_FALLBACKS.question,
  readings: DEC_FB_008_IN_FALLBACKS.readings,
  adopted: DEC_FB_008_IN_FALLBACKS.adopted,
  canonNote:
    'The decision canon at @/disclosure/decisions carries no record for DEC-FB-008 — it is ' +
    'not a member of that file’s DecisionId union — and that file is ' +
    'another task’s single edit. Disclosed here in the canon’s own shape so the lift is a move ' +
    'rather than a rewrite, and declared as a gap rather than filed under a neighbouring ' +
    'identifier. The readings are the array @/fallbacks/disclosure already carries, imported, so ' +
    'the two homes this decision now has cannot drift into two readings of it.',
  bearsOnFamilies: ['hold-state', 'deviation-record-and-severity-classification'],
  bearsOnNote:
    'This build’s binding, not the source’s. DEC-FB-008 is attached to no object family and to no ' +
    'contract anywhere: it occurs twice in the whole document and neither occurrence is inside a ' +
    'table. The two families named are the rows whose own SoW Fact cells state the answer chapter ' +
    '38 records as unresolved — the hold-state row, and the severity-classification row it rests ' +
    'on.',
} as const satisfies OfflineConflictDisclosure

/**
 * `DEC-CLOCKWIN-001` IS NOT DISCLOSED HERE, AND THAT IS DELIBERATE.
 *
 * It bites here harder than anywhere: a device whose clock is fast but WITHIN
 * the tenant threshold carries no `SkewFlag` at all, so `resolveConflict` takes
 * the last-write-wins branch and hands the win to a capture that happened
 * earlier in real time. The skew guard never fires, because by its own
 * definition nothing is wrong.
 *
 * But two modules already disclose it — `MOD-FL-A5` because its classification
 * is the act of record, `MOD-FL-A6` because the threshold is row 7 of its
 * matrix — and they pinned their readings character-for-character to each
 * other precisely so a third spelling could not appear. A third local
 * disclosure is the second-spelling defect this build has recorded three
 * times, so this is a POINTER and `offline-conflict.test.ts` asserts that this
 * file contains no copy of their readings.
 */
export const DEC_CLOCKWIN_001_DISCLOSED_ELSEWHERE = {
  decisionRef: 'DEC-CLOCKWIN-001',
  disclosedBy: [
    'src/frontline/modules/fl-a5/service.ts',
    'src/frontline/modules/fl-a6/service.ts',
  ],
  whyItBitesHere:
    'A within-threshold fast clock produces no SkewFlag, so the skew branch of resolveConflict ' +
    'never runs and the two last-write-wins families settle on a device timestamp the source ' +
    'elsewhere says is not authoritative for ordering. The gap is the ordinary case §7.10.4 does ' +
    'not address.',
  whyNotDisclosedHere:
    'Two Frontline modules already carry it and pinned their readings to each other so they cannot ' +
    'drift. A third stand-in would be a third spelling of one decision, which is the defect that ' +
    'pinning exists to prevent. This module points at them instead.',
  sourceRef: 'DEC-CLOCKWIN-001 · L42598 · index row L115289',
} as const

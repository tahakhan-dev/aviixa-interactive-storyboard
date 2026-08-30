import { CC11_DATA_SETS, type Cc11DataSet } from '@/surfaces/cc/modules/cc-11/report-sets'

/**
 * THE FIVE SETS, AND THE TWO OF THEM THIS BUILD IS FORBIDDEN TO BUILD.
 *
 * ── THE NAMES ARE NOT RE-LISTED HERE, ON PURPOSE ──────────────────────────
 * `MOD-CC-11` already transcribed all five, both Parts' wordings, each with
 * its own line, in `src/surfaces/cc/modules/cc-11/report-sets.ts`. A second
 * list of the same ten strings is a second home for the thing most likely to
 * change — the source itself calls the list "proposed" and puts its identity
 * in the client's hands — so this module DERIVES from that one and adds only
 * what the Hub side owns and nothing on the tree carries: the build position.
 *
 * THE IMPORT RUNS AGAINST THE SOURCE'S OWNERSHIP DIRECTION AND THAT IS
 * DISCLOSED RATHER THAN HIDDEN. The Hub owns the data and the Client Command
 * Center renders it (L29906), so the names would more properly live here and
 * be read there. They do not, because the Command Center half shipped first.
 * Re-transcribing them here to correct the direction would create the
 * duplication instead of the coupling, and a duplicated set name is the defect
 * that reaches a reader; a backwards import is a defect a reviewer reads.
 * Recorded in `DOH_18_SET_SOURCE_DIRECTION` so it is a finding and not a
 * habit.
 *
 * ── WHAT `DEC-REPORT-001` BLOCKS, AND WHERE THE RULING ACTUALLY IS ────────
 * L113023, whole line: "**Blocking or non-blocking:** Blocking for Delivery
 * Operations Hub Band B module 18 sets 4 and 5; non-blocking for sets 1 to
 * 3." The register row states the same as a build instruction — "Build sets 1
 * to 3; hold 4 and 5" (L113037).
 *
 * The slice plan cited L113022 for that ruling. L113022 is the line above it
 * and reads "Implementation impact: Moderate for composition changes; trivial
 * for wording", which is a cost estimate and not an instruction.
 *
 * WHAT IS NOT OPEN, so no disclosure pretends it is. L113013: "The two
 * sections name the same five sets with two different wordings for sets 4 and
 * 5, and both sections declare the identity open. The count of five and the
 * ownership by the Delivery Operations Hub with rendering in the Client
 * Command Center are settled and not in question."
 *
 * WHY IT IS A HOLD AND NOT A RENAME-LATER. L113016: "Building set 4 as
 * clearance frequency and later swapping it for a deviation-trend set is not a
 * rename; it is a new query, new grouping, and new test coverage."
 *
 * ── A DECISION-BLOCKED SET IS NOT AN UNBUILT SET ──────────────────────────
 * It renders, it names the decision, it shows both candidate wordings and
 * chooses neither, and it is never counted as implemented. So there is no
 * check mark on it and it is not marked `unavailable` — `unavailable` says a
 * capability is absent, and this one is present, identified twice, and held.
 *
 * ── AND THE BLOCK IS DERIVED, NOT LISTED ──────────────────────────────────
 * A set is blocked when the two Parts write it different names, which is the
 * gap L113013 describes. That derivation is then checked against the ruling's
 * own ordinals, declared as a literal list below. Two independent statements:
 * a set that stopped diverging, or a ruling that moved, turns one of them red
 * rather than both quietly agreeing.
 */

/**
 * The ordinals L113023 and L113037 name. A LITERAL LIST, not a count — a
 * length is satisfied by any two sets at all, and this is the one thing on
 * the card a reader could act on.
 */
export const DEC_REPORT_001_BLOCKS = [4, 5] as const satisfies readonly number[]

export type Doh18SetBuild = 'buildable' | 'decision-blocked'

export interface Doh18DataSet {
  readonly ordinal: number
  readonly build: Doh18SetBuild
  /**
   * The one name, where both Parts agree. `null` on a blocked set — a single
   * name on a set whose identity is held would be the choice this module is
   * forbidden to make.
   */
  readonly agreedName: string | null
  /**
   * Both wordings, always. On a buildable set they are the same string twice
   * and that is the evidence the set is buildable; on a blocked set they are
   * the two candidates and neither is marked as the answer.
   */
  readonly hubWording: { readonly text: string; readonly locator: string }
  readonly commandCenterWording: { readonly text: string; readonly locator: string }
  /** Where the numbers come from, verbatim from §4.10.5's third column. */
  readonly hubSource: string
  /** `null` on a buildable set. Never a checkmark and never `unavailable`. */
  readonly blockedBy: {
    readonly decisionRef: string
    readonly rulingLocator: string
    readonly registerRowLocator: string
    readonly whyHeldRatherThanRenamedLater: string
  } | null
}

const BLOCK = {
  decisionRef: 'DEC-REPORT-001',
  rulingLocator:
    'L113023 — "Blocking for Delivery Operations Hub Band B module 18 sets 4 and 5; non-blocking for sets 1 to 3."',
  registerRowLocator: 'L113037 — the register row: "Build sets 1 to 3; hold 4 and 5."',
  whyHeldRatherThanRenamedLater:
    'L113016 — building set 4 under one wording and later swapping it "is not a rename; it is a new query, new grouping, and new test coverage."',
} as const

function toDataSet(set: Cc11DataSet): Doh18DataSet {
  const diverges = set.hubName !== set.commandCenterName
  return {
    ordinal: set.ordinal,
    build: diverges ? 'decision-blocked' : 'buildable',
    agreedName: diverges ? null : set.hubName,
    hubWording: { text: set.hubName, locator: `L${set.hubLine}` },
    commandCenterWording: {
      text: set.commandCenterName,
      locator: `L${set.commandCenterLine}`,
    },
    hubSource: set.hubSource,
    blockedBy: diverges ? BLOCK : null,
  }
}

export const DOH_18_DATA_SETS: readonly Doh18DataSet[] = CC11_DATA_SETS.map(toDataSet)

/** Computed, never typed. L113013 settles the count and nothing else about the list. */
export const DOH_18_SET_COUNT: number = DOH_18_DATA_SETS.length

/** Three. Computed from the build position, so a set silently promoted moves the sentence. */
export const DOH_18_BUILDABLE: readonly Doh18DataSet[] = DOH_18_DATA_SETS.filter(
  (s) => s.build === 'buildable',
)

/** Two, and never counted as implemented. */
export const DOH_18_BLOCKED: readonly Doh18DataSet[] = DOH_18_DATA_SETS.filter(
  (s) => s.build === 'decision-blocked',
)

/**
 * The derivation against the ruling. Non-empty is a defect either way round,
 * and the message says which way: a set the source stopped diverging on, or a
 * ruling that no longer matches the divergence.
 */
export function blockDisagreements(): readonly string[] {
  const derived = DOH_18_BLOCKED.map((s) => s.ordinal)
  const out: string[] = []
  for (const ordinal of DEC_REPORT_001_BLOCKS) {
    if (!derived.includes(ordinal)) {
      out.push(
        `set ${ordinal} is named in DEC-REPORT-001's ruling and the two Parts now write it the same name`,
      )
    }
  }
  for (const ordinal of derived) {
    if (!(DEC_REPORT_001_BLOCKS as readonly number[]).includes(ordinal)) {
      out.push(
        `set ${ordinal} is written two ways by the two Parts and DEC-REPORT-001's ruling does not name it`,
      )
    }
  }
  return out
}

/**
 * The sentence the component renders above the list, assembled from the two
 * computed counts so it cannot claim five are built while two are held.
 */
export const DOH_18_BUILD_POSITION: string =
  `The source names ${DOH_18_SET_COUNT} standard report data sets and this module builds ` +
  `${DOH_18_BUILDABLE.length} of them. The remaining ${DOH_18_BLOCKED.length} are ` +
  'decision-blocked, not absent and not implemented: DEC-REPORT-001 is blocking for them and ' +
  'non-blocking for the rest, so each renders below with both candidate wordings and neither ' +
  'chosen. The count of five and the ownership of the data by this surface are settled and are ' +
  'not what is open.'

/**
 * `DEC-REPORT-001` IS ALREADY DISCLOSED AND IS NOT DISCLOSED AGAIN HERE.
 *
 * `MOD-CC-11` carries the local disclosure, in the canon's own shape, at
 * `src/surfaces/cc/modules/cc-11/report-sets.ts`, together with all three of
 * the source's cards and their three non-comparable option lists.
 * `src/disclosure/decisions.ts` carries no record for the identifier and
 * `tests/unit/cc-11.test.ts` asserts that absence, so a second home here
 * would be the trap `DecisionDisclosure` exists to prevent and would break
 * that assertion's whole point.
 *
 * What this module adds is the half that disclosure does not carry: the HUB
 * BUILD POSITION. `MOD-CC-11` records every one of the five as unconfirmed
 * and draws no distinction between them; the ruling does, and it names this
 * module by number.
 */
export const DOH_18_DECISION_HOME = {
  decisionRef: 'DEC-REPORT-001',
  disclosedAt: 'src/surfaces/cc/modules/cc-11/report-sets.ts',
  registerRow: 'L38946 — chapter 21\'s own register: `DEC-REPORT-001` | Pre-existing | 21.14 | Client product owner',
  cardSpan: 'L113009-L113026',
  whatThisModuleAdds:
    'The build position. MOD-CC-11 marks all five identities unconfirmed and separates none of them; DEC-REPORT-001 is blocking for sets 4 and 5 and non-blocking for sets 1 to 3, and it names this module by number when it says so.',
} as const

/** The backwards import, recorded where a reviewer reading the import will find it. */
export const DOH_18_SET_SOURCE_DIRECTION = {
  statement:
    'This module reads the five sets\' names from the Command Center module that renders them, and the source states the ownership the other way round: the Delivery Operations Hub owns the data and the Client Command Center renders it. The Command Center half shipped first and transcribed both Parts\' wordings with their lines. Re-transcribing them here would put the same ten strings in two files, which is the failure that reaches a reader; the import direction is the one a reviewer reads. Lifting the transcription to this surface and having MOD-CC-11 read it is a task of its own and is not done from inside this module.',
  ownershipRef: 'L29906',
} as const

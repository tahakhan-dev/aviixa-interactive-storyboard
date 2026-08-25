import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  describeFrozenSourcePin,
  expectPopulationFloor,
  frozenSourceBytes,
  frozenSourceLines,
  sweptSources,
} from './absence-sweep'

/**
 * STATEMENTS THIS BUILD PUBLISHED ABOUT THE FROZEN SOURCE THAT THE FROZEN
 * SOURCE REFUTES, AND THE PLACES NO EXISTING GATE LOOKED.
 *
 * Audit round 4, findings R4-01 and R4-06; audit round 5, finding R5-A01.
 * Same shape every time: a claim ABOUT the document, rendered to a reader,
 * somewhere the suite does not read.
 *
 * ── R4-01, THE FAMILY-MEMBER-ABSENT DISCLOSURE ───────────────────────────
 *
 * Six Super Admin module pages rendered a panel saying an acceptance
 * criterion is missing from the frozen source, and abstained from building
 * it. The cited lines carry the complete runs:
 *
 *   L45684 carries AC-SA-14-01 to -07.  The page said 01,02,03,04,06,07.
 *   L45938 carries AC-SA-16-01 to -07.  The page said 01,02,06.
 *   L45342 carries AC-SA-11-01 to -06.  The page said 01,02,03,04,06.
 *   L43253-L43262 carry AC-SA-02-01 to -10.  The page said 01,03,06,07.
 *   L44875-L44886 carry AC-SA-08-01 to -12.  The page said all but 02,03,04,11.
 *   L45456 carries AC-SA-12-01 to -07.  The page said 02,03,04,07.
 *
 * Sixteen real criteria, several of them prohibitions on a platform surface,
 * reported to a reader as absent from the document that states them. The
 * audit found three of the six pages; the run-gap detector below found the
 * other three on its first run.
 *
 * NOTHING COULD RED. Every citation is a bare line number, so
 * `locator-fidelity` grades it WEAK, and a line that exists and is non-blank
 * passes -- which L45684 is. The claim was never about the LINE. It was about
 * the IDENTIFIER, and no gate read it that way.
 *
 * ── R4-06, THE BLANK-LINE CITATION ───────────────────────────────────────
 *
 * Three of the 5,018 `sourceLine` fields across the seventeen generated
 * registries cited a blank line, each exactly one line below the heading that
 * names it, and two of the three were printed to a reader as the workflow's
 * identity: the placeholder id `unstated@` with the blank line's own number
 * appended, which is an L-prefixed number and therefore a citation of a blank
 * line. The three numbers are written as bare `line` values below and never in
 * that form, because writing one here would make this comment the offence it
 * describes -- a mistake this build has already made twice in a register. `locator-fidelity`'s own doctrine calls a citation of a blank
 * line always wrong; it scans `src`, `app`, `tests` and `scripts`, and these
 * are bare numbers in `registries/generated`. The extractor is anchored to
 * the heading in `scripts/build-registries.mjs`. This is what keeps it there.
 *
 * ── R5-A01, WHICH IS R4-01 AGAIN AND THIS FILE'S OWN FAILURE ─────────────
 *
 * Round 5 found four more instances of R4-01's class, and NOT ONE of them was
 * visible to the file you are reading. Two independent reasons, both replayed
 * in node: the run detector required bare `-NN` continuations and these
 * enumerations spell every identifier in full, so it returned an empty run
 * and never ran; and none of the eight absence markers matched any of the
 * four phrasings used. A gate written to convict a class held the wording its
 * author happened to have in front of him.
 *
 * The widened detectors below then returned a FIFTH instance on their first
 * run, in `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts`, which
 * no auditor reported and which the round-5 register's "exactly these four
 * and nothing else" excludes. Fixing those five then exposed a SIXTH, in
 * `app/super-admin/data-lifecycle-and-archival/fixtures.ts`, whose claim's
 * subject is a pronoun in a later sentence. Nineteen source-stated
 * obligations across the four, two more in the fifth and three in the sixth.
 *
 * Each widening is documented where it was made, with the count it was
 * measured at and the false positives it was narrowed against. What it still
 * cannot see is written down too, in detector 2's comment, because the
 * alternative -- claiming the class is now closed -- is what round 4 did.
 *
 * ── WHY THE DETECTORS ARE REPLAYED AND NOT ONLY RUN ──────────────────────
 *
 * Round 3's finding was a correct fix that emptied a gate's population, and
 * this file is exactly that risk: closing R4-01 and R5-A01 takes the offender
 * population to zero AND takes the run-gap population to zero with it, so a
 * detector that had silently stopped matching would look identical to a clean
 * tree. So each detector is replayed against the eleven disclosures AS THEY
 * SHIPPED and must convict all twelve; the blank-line predicate is run
 * against three real blank lines and the three real headings above them; the
 * two SUBJECT populations each detector sweeps carry floors of their own; and
 * a third population that cannot empty -- every `AC-*` identifier this build
 * names -- carries a floor.
 */

describeFrozenSourcePin('rendered absence claims')

/* ==================================================================== *
 * The swept tree
 * ==================================================================== */

const SWEPT_FILES = [...sweptSources('app'), ...sweptSources('src')]

function textOf(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8')
}

/* ==================================================================== *
 * DETECTOR 1 — an enumerated identifier run with a gap in it
 * ==================================================================== */

/**
 * `AC-SA-11-01, -02, -03, -04 and -06` is a claim with a hole in it, and the
 * hole is the assertion: whatever number the enumeration skips is being
 * reported as not existing.
 *
 * ── ROUND 5 WIDENED THIS, AND THE WIDENING COST SOMETHING ────────────────
 *
 * The round-4 rule required the continuation to be a BARE `-NN`. Round 5's
 * four instances spell every member in full -- `AC-SA-18-03, AC-SA-18-07 and
 * AC-SA-18-09` -- so the detector returned an empty run and never ran. A
 * population of zero reads exactly like compliance, which is the vacuity
 * shape this file was written to avoid and then shipped.
 *
 * Dropping the bare requirement outright was MEASURED against this tree and
 * is not safe on its own: it returns 34 runs, of which 31 are
 * `MOD-STU-02 to MOD-STU-15` ranges or `STATE-01, STATE-02, STATE-04` lists
 * of things that merely share a prefix. A fully-spelled enumeration and a
 * fully-spelled list are the same string; nothing in the shape tells them
 * apart.
 *
 * WHAT TELLS THEM APART IS THE SENTENCE. So the rule is now conditional:
 *
 *   - a BARE continuation (`-03, -07 and -09`) convicts unconditionally, as
 *     it did in round 4 -- measured 3 hits on the round-4 tree, all real;
 *   - a FULLY SPELLED continuation convicts only where the enclosing sentence
 *     also carries an absence marker, which is what makes the enumeration a
 *     claim rather than a list.
 *
 * `(?!-)` keeps `-01-A2` out: `FUNC-SA-11-01-A1, -01-A2` is a sub-family
 * enumeration whose numbering says nothing about a gap.
 */
const RUN_HEAD = /\b([A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]+)*?)-(\d{2})(?!-)/g

export interface RunGap {
  readonly file: string
  readonly stem: string
  /** The members the enumeration skipped that the frozen source does carry. */
  readonly carried: readonly string[]
  /** True where at least one continuation spelled the stem out in full. */
  readonly spelled: boolean
}

/** The sentence `index` falls in, by the same full-stop rule as detector 2. */
function sentenceAt(text: string, index: number): string {
  const from = Math.max(0, text.lastIndexOf('.', index - 1))
  const to = text.indexOf('.', index)
  return text.slice(from, to === -1 ? text.length : to + 1)
}

function runGapsIn(file: string, text: string): RunGap[] {
  const found: RunGap[] = []
  RUN_HEAD.lastIndex = 0
  let hit: RegExpExecArray | null
  while ((hit = RUN_HEAD.exec(text)) !== null) {
    const stem = hit[1] as string
    const escaped = stem.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    const continuation = new RegExp(`^(?:,| and|, and)\\s+(?:${escaped})?-(\\d{2})(?!-)`)
    const members = [Number(hit[2])]
    let spelled = false
    let cursor = RUN_HEAD.lastIndex
    for (;;) {
      const next = continuation.exec(text.slice(cursor))
      if (next === null) break
      members.push(Number(next[1]))
      if (next[0].includes(stem)) spelled = true
      cursor += next[0].length
    }
    RUN_HEAD.lastIndex = cursor
    if (members.length < 2) continue
    if (spelled && !carriesAbsenceMarker(sentenceAt(text, hit.index))) continue
    const lo = Math.min(...members)
    const hi = Math.max(...members)
    const gaps: string[] = []
    for (let n = lo; n <= hi; n += 1) {
      if (!members.includes(n)) gaps.push(`${stem}-${String(n).padStart(2, '0')}`)
    }
    const carried = gaps.filter((id) => frozenSourceBytes.includes(id))
    if (carried.length > 0) found.push({ file, stem, carried, spelled })
  }
  return found
}

/**
 * Every enumerated run in `text`, gap or no gap, claim or no claim: the
 * SUBJECT population detector 1 works over. Counted so that "no offender" can
 * be told apart from "nothing looked at" -- round 3's shape.
 */
function enumeratedRunsIn(text: string): string[] {
  const runs: string[] = []
  RUN_HEAD.lastIndex = 0
  let hit: RegExpExecArray | null
  while ((hit = RUN_HEAD.exec(text)) !== null) {
    const stem = hit[1] as string
    const escaped = stem.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    const continuation = new RegExp(`^(?:,| and|, and)\\s+(?:${escaped})?-(\\d{2})(?!-)`)
    let members = 1
    let cursor = RUN_HEAD.lastIndex
    for (;;) {
      const next = continuation.exec(text.slice(cursor))
      if (next === null) break
      members += 1
      cursor += next[0].length
    }
    RUN_HEAD.lastIndex = cursor
    if (members > 1) runs.push(stem)
  }
  return runs
}

/* ==================================================================== *
 * DETECTOR 2 — prose saying the source does not carry a named identifier
 * ==================================================================== */

/**
 * WHAT A SENTENCE LOOKS LIKE WHEN IT SAYS THE DOCUMENT DOES NOT CARRY A THING.
 *
 * ── WHY THIS LIST WAS REBUILT, AND WHAT IT COST ─────────────────────────
 *
 * Round 4's eight markers were transcribed from the six disclosures their
 * author had in front of him. Round 5 found four more instances and NONE of
 * the eight matched any of them: "not carried by the extraction", "never
 * extracted", "never described", "no definition anywhere in the extract",
 * "unknown to this build". A gate that holds the wording its author happened
 * to see is not a gate on the class.
 *
 * ── THE SHAPE, MEASURED RATHER THAN GUESSED ─────────────────────────────
 *
 * Three widenings were run over the 618 swept files and counted:
 *
 *   1. any negation plus any reference to the source, in one sentence naming
 *      a carried identifier -- 385 hits. Almost all true: "the source names
 *      no format", "the extraction attaches no module_id to any workflow".
 *   2. a negation within 30 characters of a carriage verb -- 55 hits, same
 *      problem.
 *   3. the rule below -- 6 hits: the five real instances, plus one sentence
 *      acquitted for a reason recorded in `TRUE_ABSENCE_ACQUITTALS` and one
 *      `carried over` that the marker now excludes.
 *
 * The discriminator is GRAMMATICAL VOICE, and it survives rewording in a way
 * a phrase list does not. An offender says the identifier ITSELF was not
 * carried, extracted, described or captured -- passive, no object. An honest
 * sentence says the source or the extraction CARRIES no <thing> -- active,
 * with an object that is not the identifier. So `carries no Submit row`,
 * `attaches no module_id`, `defines no release control` and `names no owner`
 * all acquit, and they are 49 of the 55.
 *
 * `carried over` is excluded: "counted from the line itself, not carried over
 * from the brief" is about a COUNT's provenance and was this rule's only
 * false positive of that shape.
 *
 * `source\b(?!-)` and not `source`: without the boundary, "absent from the
 * source-reconciliation artefact" in `app/hub/shift-management/fixtures.ts`
 * -- a true statement about a DERIVED artefact -- reads as a claim about the
 * frozen document and is convicted for naming `DEC-SHIFT-001`, which the
 * source does carry. That was this detector's first false positive and it is
 * why the boundary is there.
 *
 * ── WHAT WOULD STILL GET PAST IT, ASKED HONESTLY ────────────────────────
 *
 * A sentence that names the identifier and denies its content without using
 * any of these verbs. "The source is silent on that criterion." "It is
 * indexed and nothing more." "We could not find it." None of them matches,
 * and each would read to a reader exactly as the five convicted ones did.
 *
 * THE STRUCTURAL RULE THAT WOULD CATCH THOSE -- any identifier named in
 * rendered text alongside any negation, checked against the source -- IS THE
 * 385-HIT RULE, and it was measured rather than assumed. It cannot be the
 * gate: 380 of the 385 are honest sentences about what the source leaves
 * open, which is the disclosure this build is REQUIRED to make. Turning them
 * red would make the gate an argument for deleting the disclosures.
 *
 * So the honest position is that this rule holds the SHAPE rather than the
 * WORDING, which is strictly more than round 4's, and it is still not a proof
 * about the class. What closes the remaining gap is not a wider regex but the
 * positive population below -- every `AC-*` identifier this build names must
 * exist in the source -- and the acquittal list, which forces a future author
 * to argue a true absence in writing rather than let it pass unremarked.
 */
const ABSENCE_MARKERS: readonly RegExp[] = [
  /not represented anywhere this build can read/gi,
  /(?:is|are) missing from the (?:frozen )?source\b(?!-)/gi,
  /absent from the (?:frozen )?source\b(?!-)/gi,
  /(?:occurs?|appears?) nowhere in (?:the frozen source\b(?!-)|it)/gi,
  /(?:does not|do not) (?:occur|appear|exist) (?:anywhere )?in the (?:frozen )?source\b(?!-)/gi,
  /there is no [`A-Z][^.]{0,60} in the frozen source\b(?!-)/gi,
  /no such (?:criterion|acceptance criterion|identifier)/gi,
  /nowhere in the (?:frozen )?source\b(?!-)/gi,
  // Round 5. The passive carriage verbs, negated and with no object.
  /\b(?:not|never) (?:carried(?! over)|extracted|described|captured)\b/gi,
  /\b(?:do|does|did) not (?:appear|occur|exist) (?:anywhere )?(?:in|within) (?:the )?(?:frozen source|source|extraction|extract|blueprint|document)(?![-\w])/gi,
  /\b(?:appears?|occurs?|exists?) nowhere (?:in )?(?:the )?(?:frozen source|source|extraction|extract|blueprint|document)(?![-\w])/gi,
  /\bno (?:definition|description) (?:anywhere )?(?:in|within)\b/gi,
  /\bunknown (?:to this build|here|anywhere)\b/gi,
  /\b(?:content|criteria|criterion) (?:is|are) unknown\b/gi,
]

/** True where any marker fires anywhere in `text`. Detector 1 asks this of a
 *  sentence before it will treat a fully-spelled enumeration as a claim. */
function carriesAbsenceMarker(text: string): boolean {
  return ABSENCE_MARKERS.some((m) => {
    m.lastIndex = 0
    return m.test(text)
  })
}

/**
 * An AVIIXA identifier: two or more upper-case segments joined by hyphens.
 * Deliberately NOT anchored to a prefix allow-list -- a claim about an
 * invented prefix is exactly as wrong as one about a real prefix, and an
 * allow-list is a thing to forget to update.
 */
const IDENTIFIER = /\b[A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]+)+\b/g

export interface AbsenceClaim {
  readonly file: string
  /** Identifiers the claim's own sentence names that the source does carry. */
  readonly carried: readonly string[]
}

/**
 * A SENTENCE, and not a wider window. A 600-character window was measured
 * against this tree and paired four markers with identifiers sitting in
 * neighbouring prose that the claim was not about -- `WF-ROLE-021` beside a
 * claim about a THRESHOLD VALUE, `MOD-DOH-10` beside a claim about the `S10-`
 * prefix. The binding a claim has to an identifier is that it names it.
 *
 * ── ONE SENTENCE BACK, AND ONLY BEHIND AN ANAPHOR ───────────────────────
 *
 * One sentence is not always enough, and a SIXTH instance of the class proved
 * it after the five above were fixed:
 *
 *   affordance: 'AC-SA-17-03 and AC-SA-17-10'
 *   note: '... extracted as 01, 02, 04, 05, 06, 07, 08, 09 and 11. Two
 *          identifiers in the run are absent from the extraction, so whatever
 *          THEY require is unknown to this build.'
 *
 * The marker fires in the note's SECOND sentence, which names no identifier;
 * the identifiers are in the row's label, two sentences back. The claim's
 * subject is a pronoun.
 *
 * So the window steps back one further sentence, and ONLY when the marker's
 * own sentence (a) names no identifier at all and (b) carries an anaphor.
 * Both conditions are needed and both were measured: stepping back
 * unconditionally returns 7 hits over this tree and re-admits exactly the
 * false pairing the paragraph above rejects -- `WF-ROLE-021` beside a claim
 * about a threshold value. Behind the anaphor it returns 5, of which 1 is the
 * sixth instance and 3 are recorded below with their reasons.
 */
const ANAPHOR = /\b(?:they|them|their|its|it)\b/i

function prosClaimsIn(file: string, text: string): AbsenceClaim[] {
  const found: AbsenceClaim[] = []
  for (const marker of ABSENCE_MARKERS) {
    marker.lastIndex = 0
    let hit: RegExpExecArray | null
    while ((hit = marker.exec(text)) !== null) {
      const to = text.indexOf('.', marker.lastIndex)
      const end = to === -1 ? text.length : to + 1
      let from = Math.max(0, text.lastIndexOf('.', hit.index - 1))
      let named = [...new Set(text.slice(from, end).match(IDENTIFIER) ?? [])].sort()
      if (named.length === 0 && ANAPHOR.test(text.slice(from, end))) {
        from = Math.max(0, text.lastIndexOf('.', from - 1))
        named = [...new Set(text.slice(from, end).match(IDENTIFIER) ?? [])].sort()
      }
      const carried = named.filter((id) => frozenSourceBytes.includes(id))
      if (carried.length > 0) found.push({ file, carried })
    }
  }
  return found
}

/**
 * Every absence-marker hit in `text`: the SUBJECT population detector 2 works
 * over, counted for the same reason as `enumeratedRunsIn`.
 */
function absenceMarkerHitsIn(text: string): string[] {
  const hits: string[] = []
  for (const marker of ABSENCE_MARKERS) {
    marker.lastIndex = 0
    let hit: RegExpExecArray | null
    while ((hit = marker.exec(text)) !== null) hits.push(hit[0])
  }
  return hits
}

/**
 * THE SENTENCES THAT FIRE A MARKER AND ARE TRUE, WITH THE REASON.
 *
 * KEYED ON THE FILE **AND** THE IDENTIFIERS CONVICTED, never on the file
 * alone. A whole-file acquittal is a hole the size of the file: the next
 * absence claim written into `src/offline/conflict.ts` would inherit the
 * excuse. The key is the sorted identifier list the detector reports, so
 * acquitting one sentence acquits exactly that sentence.
 *
 * Compared for EQUALITY in both directions, the shape
 * `slice-09-gates.test.ts` already uses for its five recorded offenders: a
 * fourth claim goes red until it is fixed or argued here, and a fixed one
 * goes red until its row is deleted. An exemption list that cannot outlive
 * its subject cannot rot into a permission.
 */
const TRUE_ABSENCE_ACQUITTALS = [
  {
    file: 'src/offline/conflict.ts',
    carried: 'TEST-36-412',
    reason:
      'The shape this detector cannot resolve from text: one sentence carrying a true absence ' +
      'about one identifier and a positive statement about another. The absence is about ' +
      'TEST-36-407 to TEST-36-411, which the frozen source really does not contain; the ' +
      'conviction is for TEST-36-412, named in the same sentence’s POSITIVE half — "occurs ' +
      'exactly once, inside the promise itself". Both halves are measured below rather than ' +
      'taken on trust.',
  },
  {
    file: 'src/offline/use-cases/group-a-d/catalogue.ts',
    carried: 'AC-37A-002, AC-37A-005',
    reason:
      'A marker-sense collision, not a claim about the document. The sentence that fires is ' +
      '"not carried: nothing in this build reads them" — about which registers this BUILD ' +
      'consumes. The two criteria are pulled in from the sentence before it, which says the ' +
      'opposite of an absence: they are quoted VERBATIM because they are claims about their ' +
      'own exact words.',
  },
  {
    file: 'src/surfaces/cc/modules/cc-08/AgentActivityPanel.tsx',
    carried: 'MOD-CC-08',
    reason:
      'The same collision. "is never described as live artificial intelligence" is a statement ' +
      'about how this panel RENDERS a record of absence, not about what the frozen source ' +
      'carries; MOD-CC-08 is pulled in from the surrounding markup attribute.',
  },
] as const

/** The acquittal's own claim, measured. Without this the row above is prose,
 *  and unmeasured prose is what round 4 shipped six times. */
const ACQUITTED_ABSENT_IDS = [
  'TEST-36-407',
  'TEST-36-408',
  'TEST-36-409',
  'TEST-36-410',
  'TEST-36-411',
] as const

/* ==================================================================== *
 * The twelve disclosures, as they shipped
 * ==================================================================== */

/**
 * Verbatim from the tree before the fix stream that deleted each one. They
 * are the detectors' calibration: each one must still be convicted, by one
 * detector or the other, or the detector has stopped seeing the defect it was
 * written for.
 *
 * SIX FROM ROUND 4, SIX FROM ROUND 5. The round-4 six are why the run-gap
 * detector exists; the round-5 six are why it was not enough. Four of the six
 * came from the round-5 register; the fifth and the sixth were returned by
 * the widened detectors on their first two runs.
 *
 * Each round-5 entry is one panel row's `what` and `why` joined by an em dash
 * and the first letter of the `why` lower-cased. That is not decoration: the
 * page renders the two as adjacent paragraphs with NO full stop between them,
 * and both detectors window on the full stop. Joining them with one would put
 * the identifier in a different sentence from the marker and calibrate the
 * gate against a string the tree never held. Everything after the first
 * letter is the shipped bytes.
 */
const DISCLOSURES_AS_SHIPPED: readonly (readonly [string, string])[] = [
  [
    'tiers-entitlements-and-caps',
    'The extraction carries AC-SA-11-01, -02, -03, -04 and -06 at L45342. The gap at -05 is ' +
      'not represented anywhere this build can read, and no affordance on this screen stands ' +
      'in for it.',
  ],
  [
    'jbs-access',
    'The extraction carries AC-SA-16-01, -02 and -06 at L45938. The three gaps in between are ' +
      'not represented anywhere this build can read, and no affordance on this screen stands ' +
      'in for them.',
  ],
  [
    'atom-registry',
    'The extraction carries AC-SA-02-01, -03, -06 and -07. The gaps in the numbering are not ' +
      'represented anywhere this build can read, and nothing on this screen stands in for them.',
  ],
  [
    'platform-notifications-and-tenant-communications',
    'The acceptance criteria extracted at L45684 run AC-SA-14-01, -02, -03, -04, -06 and -07. ' +
      'There is no AC-SA-14-05 in the frozen source.',
  ],
  [
    'console-users-roles-and-change-approvals',
    'The extraction carries AC-SA-08-01, -05, -06, -07, -08, -09, -10 and -12 for this module ' +
      'and no others. Four identifiers in the run are absent from the frozen source, so ' +
      'nothing was built to satisfy them.',
  ],
  [
    'usage-and-metering',
    'The extraction carries AC-SA-12-02, -03, -04 and -07 for this module and no others; the ' +
      'numbering implies at least three more that were never captured.',
  ],
  // ── Round 5, R5-A01. None of these matched a round-4 marker, and none of
  // them is a run under the round-4 bare-`-NN` rule.
  [
    'platform-audit',
    'SB-RBAC-04, the enforcement-parity view — named as a screen of this module at L20953 and ' +
      'never described. No layout, no columns, no controls and no acceptance criteria were ' +
      'extracted for it, so nothing is drawn for it.',
  ],
  [
    'platform-audit',
    'AC-SA-18-03, AC-SA-18-07 and AC-SA-18-09 — indexed in the module’s acceptance set and never ' +
      'extracted (census C24). Three of this module’s ten criteria are therefore unknown to this ' +
      'build.',
  ],
  [
    'platform-audit',
    'FUNC-SA-18-01-A1 through FUNC-SA-18-04-A4 — nine function identifiers are listed on the ' +
      'module row (L46125) with no definition anywhere in the extract. Nine unknown functions is ' +
      'not nine controls, and none was drawn.',
  ],
  [
    'trace-viewer',
    'AC-SA-06-01, AC-SA-06-02, AC-SA-06-05, AC-SA-06-06 and AC-SA-06-07 are not carried by the ' +
      'extraction; only -03, -04 and -08 were extracted. Their content is unknown here and is ' +
      'not guessed at.',
  ],
  // THE FIFTH, WHICH NO AUDITOR REPORTED. The round-5 register names four and
  // says a wider sweep "returned exactly these four sentences and nothing
  // else". The widened rule below returned a fifth on its first run:
  // `AC-SA-09-07` is at L45098 and `AC-SA-09-09` at L45100, both with full
  // text. A gate written to convict a class convicts the class.
  [
    'tenants-lifecycle-and-pilots',
    'AC-SA-09-07 and AC-SA-09-09 do not appear anywhere in the extraction. The criteria for ' +
      'this module run 01 to 06, 08, and 10 to 14 — two identifiers in the middle of the run ' +
      'are simply absent, and nothing here fills the gap.',
  ],
  // THE SIXTH, which the five fixes above could not see either: the marker's
  // own sentence names no identifier and its subject is a pronoun. This is
  // what the one-sentence-back lookback exists for. L46074 carries all twelve
  // AC-SA-17 criteria; the note omits -03, -10 AND -12, and its own screen
  // already enforced -03 and -10 while saying they were unknowable.
  [
    'data-lifecycle-and-archival',
    'AC-SA-17-03 and AC-SA-17-10 — the acceptance criteria for this module are extracted as ' +
      '01, 02, 04, 05, 06, 07, 08, 09 and 11. Two identifiers in the run are absent from the ' +
      'extraction, so whatever they require is unknown to this build. They are named here ' +
      'rather than passed over in silence.',
  ],
]

describe('R4-01: no rendered text says the frozen source lacks an identifier it carries', () => {
  it('sweeps a file population that has not collapsed', () => {
    expectPopulationFloor(SWEPT_FILES, 600, 'app/ and src/ .ts and .tsx sources')
  })

  it('convicts all twelve disclosures as they shipped', () => {
    expect(DISCLOSURES_AS_SHIPPED).toHaveLength(12)
    for (const [page, text] of DISCLOSURES_AS_SHIPPED) {
      const convicted = [
        ...runGapsIn(page, text).flatMap((r) => r.carried),
        ...prosClaimsIn(page, text).flatMap((c) => c.carried),
      ]
      expect(convicted, `the detectors no longer see the disclosure on /${page}/`)
        .not.toEqual([])
    }
  })

  /**
   * THE SUBJECT POPULATIONS, ASSERTED SEPARATELY FROM THE OFFENDERS.
   *
   * Round 3's finding was a correct fix that emptied a gate's population, and
   * both offender assertions below are "found nothing". After R5-A01 the
   * offender count is zero by design, so a detector that had stopped matching
   * anything at all would look identical to a clean tree. These two count what
   * the detectors are LOOKING AT rather than what they found: enumerated runs
   * in the tree, and sentences that fire an absence marker. Neither can reach
   * zero while this build still discloses what the source leaves open.
   *
   * Measured on the tree these floors were written against: 48 runs and 41
   * marker hits. FLOORS AND NOT EQUALITIES -- an exact count is a stored copy
   * of a derived answer and goes stale the next time a screen grows a
   * sentence. What an absence claim needs is only that the population has not
   * silently collapsed.
   */
  it('still has a subject population for both detectors', () => {
    const runs = SWEPT_FILES.flatMap((f) => enumeratedRunsIn(textOf(f)))
    expectPopulationFloor(runs, 30, 'enumerated identifier runs under app/ and src/')
    const marked = SWEPT_FILES.flatMap((f) => absenceMarkerHitsIn(textOf(f)))
    expectPopulationFloor(marked, 25, 'sentences firing an absence marker under app/ and src/')
  })

  it('acquits an enumeration whose gaps the source really does not carry', () => {
    // The same detector on the same shape with a family the document has
    // never heard of: a rule that convicted this would convict everything.
    expect(runGapsIn('probe', 'The extraction carries AC-GHOST-999-01, -02 and -05.')).toEqual([])
  })

  it('acquits a true absence claim about a build-local identifier', () => {
    // `DEC-OFFMODE-001` is this build's own name for a question the source
    // leaves open under no name at all, so saying so is true and is the point
    // of saying it. A detector that reddened here would punish honesty.
    expect(
      prosClaimsIn('probe', 'DEC-OFFMODE-001 appears NOWHERE in the frozen source.'),
    ).toEqual([])
  })

  it('finds no enumerated run whose gap the frozen source carries', () => {
    const offenders = SWEPT_FILES.flatMap((f) => runGapsIn(f, textOf(f))).map(
      (r) =>
        `${r.file}: ${r.stem} skips ${r.carried.join(', ')}` +
        `${r.spelled ? ' (fully-spelled enumeration in an absence-marked sentence)' : ''}`,
    )
    expect(offenders).toEqual([])
  })

  /**
   * The acquittal's own claim. `TRUE_ABSENCE_ACQUITTALS` says one sentence is
   * true; this is what makes that a measurement rather than an assertion of
   * good faith. If the frozen source ever carried one of these, the row would
   * be wrong and the sentence would be the defect it is excused from being.
   */
  it('measures the absence the one acquittal rests on', () => {
    expect(ACQUITTED_ABSENT_IDS.filter((id) => frozenSourceBytes.includes(id))).toEqual([])
    expect(frozenSourceBytes.includes('TEST-36-412'), 'the positive half of the same sentence')
      .toBe(true)
  })

  it('finds no prose claim naming an identifier the frozen source carries', () => {
    const key = (c: { file: string; carried: readonly string[] }) =>
      `${c.file}: ${c.carried.join(', ')}`
    const acquitted = new Set<string>(
      TRUE_ABSENCE_ACQUITTALS.map((a) => `${a.file}: ${a.carried}`),
    )
    const claims = SWEPT_FILES.flatMap((f) => prosClaimsIn(f, textOf(f)))
    expect(claims.map(key).filter((k) => !acquitted.has(k))).toEqual([])
    // EQUALITY, both directions. A row that no longer describes a live
    // sentence is red until it is deleted, so the list cannot outlive its
    // subject and become a standing permission.
    expect([...new Set(claims.map(key))].sort()).toEqual([...acquitted].sort())
  })

  /**
   * THE POPULATION THAT CANNOT EMPTY. The two assertions above are both
   * "found nothing", which is the shape most at risk of passing because it
   * stopped looking. This one is the same question asked positively over 784
   * identifiers, and it also catches the inverse defect the build has already
   * shipped once: an extractor that continued a numbering sequence and
   * invented twelve acceptance criteria the source does not contain.
   */
  it('names no AC identifier the frozen source does not carry', () => {
    const named = [
      ...new Set(
        SWEPT_FILES.flatMap((f) => [...textOf(f).matchAll(/\bAC-[A-Z0-9]+(?:-[A-Z0-9]+)+\b/g)])
          .map((m) => m[0])
          .filter((id): id is string => id !== undefined),
      ),
    ].sort()
    expectPopulationFloor(named, 700, 'AC-* identifiers named under app/ and src/')
    expect(named.filter((id) => !frozenSourceBytes.includes(id))).toEqual([])
  })
})

/* ==================================================================== *
 * R4-06 — no generated citation points at a blank line
 * ==================================================================== */

const GENERATED_DIR = join(process.cwd(), 'registries', 'generated')

function generatedJsonFiles(dir: string, into: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    // Nine release gates plant and delete probes on the real filesystem, and
    // a walk that does not skip them lists one and then ENOENTs on it the
    // moment its owner cleans up. `tests/coverage/prohibited-patterns.test.ts`
    // convicted this walk for exactly that.
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) generatedJsonFiles(full, into)
    else if (entry.endsWith('.json')) into.push(full)
  }
  return into
}

export interface GeneratedCitation {
  readonly file: string
  readonly line: number
}

function generatedCitations(): readonly GeneratedCitation[] {
  const out: GeneratedCitation[] = []
  for (const file of generatedJsonFiles(GENERATED_DIR)) {
    const walk = (node: unknown): void => {
      if (node === null || typeof node !== 'object') return
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === 'sourceLine' && typeof v === 'number') out.push({ file, line: v })
        else walk(v)
      }
    }
    walk(JSON.parse(readFileSync(file, 'utf8')))
  }
  return out
}

/** True when the frozen source's line `n` is blank, or is not a line at all. */
function citesNothing(n: number): boolean {
  return (frozenSourceLines[n - 1] ?? '').trim() === ''
}

function short(file: string): string {
  return file.slice(process.cwd().length + 1)
}

describe('R4-06: no generated sourceLine cites a blank line of the frozen source', () => {
  const citations = generatedCitations()

  it('reads a sourceLine population that has not collapsed', () => {
    expectPopulationFloor(citations, 5_000, 'sourceLine fields under registries/generated')
  })

  /**
   * THE PREDICATE, ON THE THREE LINES THAT WERE ACTUALLY CITED. Each pair
   * below is a blank line and the heading immediately above it -- the line the
   * extractor recorded, and the line the row cites now. They are bare numbers
   * and not L-prefixed ones on purpose: an L-prefixed number is a citation
   * wherever it appears, including in a comment about a bad citation, and
   * `locator-fidelity` convicted an earlier draft of this very block.
   *
   * Without this case a `citesNothing` that had stopped recognising a blank
   * line would let the assertion below pass over a tree full of them.
   */
  it('tells a blank line and the heading above it apart', () => {
    for (const [blank, heading] of [
      [101_683, 101_682],
      [34_886, 34_885],
      [95_239, 95_238],
    ] as const) {
      expect(citesNothing(blank), `L${blank} should be blank`).toBe(true)
      expect(citesNothing(heading), `L${heading} should be the heading`).toBe(false)
    }
  })

  it('cites no blank line anywhere', () => {
    const blank = citations
      .filter((c) => citesNothing(c.line))
      .map((c) => `${short(c.file)} L${c.line}`)
    expect(blank).toEqual([])
  })

  /**
   * A composite row id is itself a citation: the placeholder id carries an
   * L-prefixed line number inside it, and an L-prefixed number is a citation
   * wherever it appears. Two of the three blank citations reached a reader in
   * exactly that form, as the
   * workflow's own identity on the Workflow Index.
   */
  it('embeds no blank line in a generated row id', () => {
    const offenders: string[] = []
    for (const file of generatedJsonFiles(GENERATED_DIR)) {
      for (const m of readFileSync(file, 'utf8').matchAll(/"[^"]*@L(\d+)[^"]*"/g)) {
        if (citesNothing(Number(m[1]))) offenders.push(`${short(file)} ${m[0]}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

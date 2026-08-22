import type { DecisionReading } from '@/disclosure/decisions'
import type { FallbackContractId } from './contracts'

/**
 * THE THREE FALLBACK DECISIONS THIS BUILD CARRIES, AND THE ONE IT MUST NOT
 * SETTLE.
 *
 * `src/disclosure/decisions.ts` holds twenty-nine records and not one of them
 * is a `DEC-FB-*`. That file is not this task’s to edit — one later task lifts
 * the whole Chapter 38 set at once — so these are disclosed HERE, in the
 * canon’s own record shape, with `DecisionReading` IMPORTED rather than
 * redeclared so that the lift is a move rather than a rewrite. The gap itself
 * is declared on `canonNote` rather than papered over by filing under a
 * neighbouring identifier, which is how a client searching the canon for one
 * of these would find someone else’s decision instead.
 *
 * `fallback-contracts.test.ts` asserts every identifier below is ABSENT from
 * `OPEN_DECISION_IDS`. The moment one is lifted into the canon this suite goes
 * red and forces the switch, so the duplicate cannot outlive the gap.
 *
 * ── `DEC-FB-002` IS NOT ONE DECISION ───────────────────────────────────────
 * L82852 names it among the decisions raised in §38.4.1 — the sentence reads
 * that `DEC-FB-001`, `DEC-FB-002`, `DEC-FB-003` and `DEC-FB-004` are raised
 * there — and the decision index at L115316 counts `DEC-FB-002` as ONE
 * identifier with two references. But no card for it exists. What exists is
 * two LETTERED sub-decisions asking different questions: `DEC-FB-002a` at
 * L82673, inside `FB-UPLOAD-002`, and `DEC-FB-002b` at L83372, inside
 * `FB-CAP-002`. Measured against the frozen source, the bare string
 * `DEC-FB-002` occurs exactly twice in the whole document — at L82852 and at
 * L115316 — which is the index’s own count, so the index counted the mentions
 * and never the cards. Both letters are carried below under their own
 * identifiers. No `DEC-FB-002` card is invented, and the two are not merged:
 * one asks about media size and count, the other about device-storage
 * occupancy, and a single answer to both would be an answer to neither.
 *
 * ── AND THE ONE THIS SLICE MUST NOT SETTLE ─────────────────────────────────
 * Chapter 36 states as `SoW Fact` the very question chapter 38 records as
 * unresolved, and a safety claim is at stake.
 *
 * The conflict-authority resolver at L80185-L80198 gives the hold-state family
 * its answer at L80192 — the hold stands, no device write lifts it, classified
 * `SoW Fact` against §3.3 and §7.9.2 on the ground that "release is Quality
 * Manager only, uniformly, arriving as a lot-release command". Chapter 38 asks
 * the same question at L82477 and refuses it: "This blueprint records the
 * contradiction as `DEC-FB-008` and preserves both readings". §4.13.2’s
 * last-write-wins rule read generally would let a later in-specification write
 * retire a hold the platform elsewhere says only a Quality Manager may
 * release; read the other way the Severity 1 floor is platform-fixed and
 * exempt, which the source never says explicitly.
 *
 * BOTH READINGS AND BOTH LOCATORS ARE RECORDED AND NEITHER IS CHOSEN.
 * `DEC-FB-008`’s `adopted` field states that this build takes no position, and
 * the record carries no field in which one reading could be marked the answer
 * — the canon’s `DecisionReading` has exactly two fields for exactly that
 * reason.
 *
 * This module is data. It computes nothing and decides nothing.
 */

export type FallbackDecisionRef = 'DEC-FB-002a' | 'DEC-FB-002b' | 'DEC-FB-008'

/**
 * The canon’s record shape, minus the canon’s key. There is no `id` because
 * these are not in the canon and must not look as though they are, and no
 * `pins` because the closed vocabularies these touch are another task’s.
 * `readings` is the canon’s own type, imported.
 */
export interface FallbackLocalDisclosure {
  readonly decisionRef: FallbackDecisionRef
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /**
   * What this build does, and why. Never presented as the source’s ruling.
   * For `DEC-FB-008` it is the statement that this build does nothing.
   */
  readonly adopted: string
  /** Why this is disclosed locally rather than through the canon. */
  readonly canonNote: string
  /**
   * The contracts whose own text is where this question bites.
   *
   * THIS ATTACHMENT IS THIS BUILD’S READING, NOT THE SOURCE’S. For
   * `DEC-FB-002a` and `DEC-FB-002b` the source states it — each identifier
   * appears in exactly one contract’s own `Recovery Time Objective and
   * Recovery Point Objective` cell and nowhere else. For `DEC-FB-008` the
   * source states nothing: the identifier appears twice in the whole document
   * and neither occurrence is inside a contract, so the contracts named are
   * the ones whose transcribed cells carry the Severity 1 floor and the hold,
   * and the binding is labelled here rather than presented as transcription.
   */
  readonly bearsOn: readonly FallbackContractId[]
}

export const FALLBACK_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-FB-002a',
    question:
      'What is the maximum size and count of evidence media a single capture may hold?',
    readings: [
      {
        text:
          'The contract states the limits are not settled: media size limits are TBD — Client ' +
          'Decision Required, DEC-FB-002a, which asks the maximum size and count of evidence ' +
          'media a single capture may hold. It is raised inside FB-UPLOAD-002’s recovery-' +
          'objectives cell and nowhere else.',
        locator: 'DEC-FB-002a · L82673 · FB-UPLOAD-002 heading L82648',
      },
      {
        text:
          'The decision index carries no row for DEC-FB-002a at all. Its nearest row is ' +
          'DEC-FB-002, credited to Chapter 38 with two references — which are the two bare ' +
          'mentions at L82852 and the index row itself, not this card.',
        locator: 'DEC-FB-002 index row · L115316',
      },
    ],
    adopted:
      'No size and no count is invented. The contract is transcribed with its TBD intact, and ' +
      'this card is carried under its own letter so that answering it cannot be mistaken for ' +
      'answering DEC-FB-002b. Decision owner: the client, as an input to the Frontline capture ' +
      'specification.',
    canonNote:
      'The decision canon carries no record for DEC-FB-002a, and none for DEC-FB-002 either. ' +
      'Declared here as a gap for the canon rather than filed under a neighbouring identifier.',
    bearsOn: ['FB-UPLOAD-002'],
  },
  {
    decisionRef: 'DEC-FB-002b',
    question:
      'At what device-storage occupancy does the platform warn, and at what occupancy does it ' +
      'stop accepting new media?',
    readings: [
      {
        text:
          'The contract states the thresholds are not settled: capacity thresholds TBD — Client ' +
          'Decision Required, DEC-FB-002b, which asks the device-storage occupancy at which the ' +
          'platform warns and at which it stops accepting new media. It is raised inside ' +
          'FB-CAP-002’s recovery-objectives cell and nowhere else.',
        locator: 'DEC-FB-002b · L83372 · FB-CAP-002 heading L83347',
      },
      {
        text:
          'This is a different question from DEC-FB-002a. One bounds a single capture, the other ' +
          'bounds the device. A platform-wide media cap could satisfy either and would answer ' +
          'neither, which is why the two letters are not merged into the DEC-FB-002 the index ' +
          'names.',
        locator: 'DEC-FB-002 raised at L82852 · index row L115316',
      },
    ],
    adopted:
      'No warning threshold and no stop threshold is invented. The contract is transcribed with ' +
      'its TBD intact. Decision owner: the client, as an input to the Frontline device ' +
      'specification, and it interacts with DEC-STORE-001 on storage-full behaviour generally.',
    canonNote:
      'The decision canon carries no record for DEC-FB-002b. Declared here as a gap for the ' +
      'canon rather than filed under a neighbouring identifier.',
    bearsOn: ['FB-CAP-002'],
  },
  {
    decisionRef: 'DEC-FB-008',
    question:
      'May last-write-wins discard an earlier Severity 1 classification, and so retire a hold ' +
      'only a Quality Manager may release?',
    readings: [
      {
        text:
          'CHAPTER 36, AS SoW Fact. The conflict-authority resolver gives the hold-state family — ' +
          'including the automatic Severity 1 hold — the answer that the hold stands and no ' +
          'device write lifts it, classified SoW Fact against §3.3 and §7.9.2 because release is ' +
          'Quality Manager only, uniformly, arriving as a lot-release command. The same row adds ' +
          'that this is never resolvable as a sync conflict.',
        locator: 'L80192 · authority resolver L80185-L80198',
      },
      {
        text:
          'CHAPTER 38, AS AN OPEN DECISION. The same question is recorded as a contradiction ' +
          'discovered at step 6 and not resolved: §4.13.2 states offline sync conflicts resolve ' +
          'last-write-wins by device capture timestamp, §3.3 and §7.9.2 state the on-device ' +
          'severity classification is the act of record, and the Statement of Work does not state ' +
          'whether last-write-wins may discard the earlier Severity 1 classification. The ' +
          'blueprint records the contradiction as DEC-FB-008, preserves both readings, and says ' +
          'in terms that it does not choose.',
        locator: 'DEC-FB-008 · L82477',
      },
      {
        text:
          'The two are not reconcilable by reading order. Chapter 36 classifies its answer SoW ' +
          'Fact — the strongest claim the blueprint makes — and chapter 38 classifies the same ' +
          'question Client Decision Required. Only two references to DEC-FB-008 exist in the ' +
          'whole document, L82477 and its index row, so nothing later withdraws either claim.',
        locator: 'DEC-FB-008 index row · L115322',
      },
    ],
    adopted:
      'NOTHING. This build takes no position. Both readings are carried above with their own ' +
      'locators and neither is marked the answer, because a safety claim is at stake and ' +
      'choosing one would be this build asserting either that an automatic mechanism may undo ' +
      'the platform’s strongest safety reflex, or that a SoW Fact settles a question the source ' +
      'itself left open. Chapter 38’s own recommendation — exempt Severity 1 classifications and ' +
      'hold records from last-write-wins entirely and route every such conflict to the Command ' +
      'Center sync-conflict panel — is the source’s recommendation and is recorded as such, not ' +
      'adopted here. Decision owner: the client’s quality lead with the platform engineering ' +
      'lead.',
    canonNote:
      'The decision canon carries no record for DEC-FB-008. It is the strongest false claim ' +
      'available in this slice: a build that transcribed only chapter 36 would ship a SoW Fact ' +
      'over an open safety question, and a build that transcribed only chapter 38 would lose ' +
      'that the source elsewhere states the answer. Declared here as a gap for the canon.',
    bearsOn: ['FB-DEV-002', 'FB-DEV-003'],
  },
] as const satisfies readonly FallbackLocalDisclosure[]

/**
 * The identifiers this module discloses, as a runtime value, so the
 * absent-from-canon gate compares two arrays rather than restating literals it
 * took from the value under test.
 */
export const FALLBACK_DECISION_REFS = [
  'DEC-FB-002a',
  'DEC-FB-002b',
  'DEC-FB-008',
] as const satisfies readonly FallbackDecisionRef[]

const _refsExhaustive: Exclude<
  FallbackDecisionRef,
  (typeof FALLBACK_DECISION_REFS)[number]
> extends never
  ? true
  : never = true
void _refsExhaustive

/**
 * The identifier the source raises but never writes a card for. It is NOT a
 * member of `FallbackDecisionRef`, because carrying it as a disclosable record
 * would be inventing the card §38.4.1 does not contain.
 */
export const UNCARDED_DECISION_REF = 'DEC-FB-002'

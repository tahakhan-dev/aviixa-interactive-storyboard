import type { DecisionReading } from '@/disclosure/decisions'
import type { CcDecisionId } from './register'

/**
 * FOUR DECISIONS THIS SURFACE CARRIES THAT THE CANON DOES NOT.
 *
 * `src/disclosure/decisions.ts` carries no record for any of these four —
 * not one is a member of its exported `DecisionId` union. It is not edited
 * here. This follows the `Stu14LocalDisclosure` idiom
 * — a local record in the canon's own shape, plus a gate asserting the
 * identifier is ABSENT from the canon, so the day someone lifts one of these
 * into the canon the suite goes red and forces the switch instead of leaving
 * two spellings of one decision alive.
 *
 * THE READING TYPE IS THE CANON'S OWN `DecisionReading`, IMPORTED RATHER
 * THAN RE-DECLARED. It has exactly two fields, `text` and `locator`, so
 * there is nowhere on a reading to mark it as the winner — not by a
 * `preferred` flag, not by an `adopted` field, not by anything a later hand
 * could add without changing a shared type every other record in the canon
 * depends on.
 *
 * ADOPTION IS A SEPARATE ARM, NOT A FIELD. `CcDecisionPosition` is a union
 * of two shapes and the open one has no slot for an adopted position at all.
 * The adopted arm cannot be constructed without `adoptedLocator`, so a
 * position can never be recorded as adopted without naming the frozen-source
 * line that adopts it. This is what keeps a recommendation from graduating
 * into an adoption by inattention: three of the four below carry a
 * recommendation in the source and none of those three is adopted.
 */

/** Exactly two readings. A third is a type error, not a review comment. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

export type CcDecisionPosition =
  | {
      readonly kind: 'open'
      readonly readings: TwoReadings
    }
  | {
      readonly kind: 'adopted-in-source'
      readonly readings: TwoReadings
      /** Verbatim from the line that records the adoption. */
      readonly adoptedText: string
      /** The frozen-source line carrying that adoption. Required. */
      readonly adoptedLine: number
    }

/**
 * A POINTER THAT CAN POINT AT ITSELF IS NOT A POINTER.
 *
 * A `heldBy` naming the file that declares it proves nothing: the declaring
 * file necessarily names every identifier it declares. So the holder must be
 * outside this directory, and it must itself carry the decision's own
 * frozen-source line — a path alone would be satisfied by any file that
 * happened to mention the identifier in a comment.
 */
export interface HeldElsewhere {
  /** Repo-relative, and never under `src/surfaces/cc/decisions/`. */
  readonly path: string
  /** The frozen-source line that file must itself carry. */
  readonly locatorLine: number
}

export interface CcLocalDisclosure {
  readonly decisionRef: CcDecisionId
  readonly question: string
  readonly position: CcDecisionPosition
  /** Why this is disclosed here rather than through the canon. Never blank. */
  readonly canonNote: string
  /** Where this decision is already disclosed on the tree, if anywhere. */
  readonly heldBy: HeldElsewhere | null
}

export const CC_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-CCWRITE-001',
    question:
      'Are the ten the complete inventory of Command Center writes, or the inventory of authority-bearing operational actions only?',
    position: {
      kind: 'open',
      readings: [
        {
          text:
            'Reading A — the ten are the complete inventory of Command Center writes, and the ' +
            'outside acts are defects in the enumeration. The source names report-format ' +
            'authoring and manual close of a stuck run as writes it deliberately places outside ' +
            'the ten, and marking a prior case relevant and one-tap feedback on agent outputs as ' +
            'writes enumerated nowhere at all.',
          locator: 'DEC-CCWRITE-001 · L35350',
        },
        {
          text:
            'Reading B — the ten are the inventory of authority-bearing operational actions, and ' +
            'authoring, lifecycle and learning-signal writes are legitimately a different class. ' +
            'The set is then closed as a set of operational actions and is not the complete set ' +
            'of writes originating on the surface.',
          locator: 'DEC-CCWRITE-001 · L35350',
        },
      ],
    },
    canonNote:
      'The canon carries no record for DEC-CCWRITE-001. Its whole content — the contradiction, ' +
      'both readings, three options, the recommendation and the decision owner — is on the one ' +
      'line L35350, which runs past a thousand characters; a truncated read of it returns a ' +
      'fragment and has already produced one false "not supported by the source" finding on this ' +
      'build. The source recommends option (a), restating the closed set as ten operational ' +
      'actions plus a named closed list of non-operational writes. A recommendation is not an ' +
      'adoption and this record does not promote it to one.',
    heldBy: null,
  },
  {
    decisionRef: 'DEC-CONFLICTCAP-001',
    question:
      "What is the cap on the sync-conflict review panel's visible list, how does a reviewer reach conflicts beyond it, and what does Resolve All do to them?",
    position: {
      kind: 'open',
      readings: [
        {
          text:
            'As DEC-CONFLICTCAP-001, raised by chapter 21 in the section that specifies this very ' +
            'panel. It asks three things — the cap value, reachability beyond the cap, and Resolve ' +
            "All's scope over unlisted conflicts — and recommends stating the cap value and " +
            'providing paging, with Resolve All acting on the current page only and saying so. ' +
            'Owner: the client product owner with the quality lead.',
          locator: 'DEC-CONFLICTCAP-001 · L38076 · register row L38955 · §21.13 heading L38048',
        },
        {
          text:
            'As DEC-SYNC-006, raised by chapter 37B for the same panel, which chapter 36 names as ' +
            'the source status of the cap value. It asks one thing — the numeric cap — and ' +
            'recommends a single platform value at V1 converting to tenant-set if feedback ' +
            'demands. Owner: the client product owner with the Command Center design owner. That ' +
            "recommendation is DEC-CONFLICTCAP-001's option (c), which DEC-CONFLICTCAP-001 does " +
            'not recommend.',
          // Raised on its CARD at L80504 — "The cap, and why it is a design
          // feature" — with the question, the options, the recommendation and
          // the owner. L81737 is §37B's consolidated register ROW, and the
          // source's own index records this decision as first raised in
          // chapter 36. Citing the register row as the raise cites the index
          // rather than the decision, which is the same class of error as a
          // module reaching a decision through a coverage map.
          locator: 'DEC-SYNC-006 · card L80504 · register row L81737 · source status L80587',
        },
      ],
    },
    canonNote:
      'BOTH IDENTIFIERS ARE RAISED BY THE FROZEN SOURCE, in two chapters, for two sections that ' +
      'name the same panel. (An earlier note here said their headings were "the same six words"; ' +
      'they are not. §21.13 opens `Module MOD-CC-10 — The Sync-Conflict Review Panel` and §36.6 ' +
      'opens `The Sync-Conflict Review Panel`. The shared phrase is four words and one heading ' +
      'carries a module identifier the other does not — a detail that matters because it is the ' +
      'only evidence offered that the two sections are about one subject.) Neither identifier ' +
      "cites the other, and the source's own decision index records them as first raised in " +
      'different chapters (L115407 and L115111). So this is not one decision under two spellings ' +
      "and not two unrelated decisions: it is one panel's cap asked twice, with two owners and " +
      'two recommendations that do not agree. Neither reading is chosen here. Neither identifier ' +
      'is in the canon.',
    heldBy: {
      path: 'src/offline/decisions-37b.ts',
      locatorLine: 81737,
    },
  },
  {
    decisionRef: 'DEC-CONTLAUNCH-001',
    question: 'Which component launches the containment checklist — the device, or the agent?',
    position: {
      kind: 'adopted-in-source',
      readings: [
        {
          text:
            'The device launches the pre-authorised containment checklist locally, from the ' +
            'version-pinned work package, at the instant of classification, with no network ' +
            'required.',
          locator: 'DEC-CONTLAUNCH-001 · L114872 · adopted position L114874',
        },
        {
          text:
            'The Deviation and Containment Agent launches the configured checklist. Under the ' +
            'adopted position that description is the server-side mirror of an act that has ' +
            'already happened locally, and the underlying source contradiction stays on the ' +
            'record rather than being closed by the adoption.',
          locator: 'DEC-CONTLAUNCH-001 · L114872 · adopted position L114874',
        },
      ],
      adoptedText:
        'Option A, adopted on 2026-08-14 on the instruction of the party commissioning this ' +
        'blueprint, because it is the safer reading — it is the only reading under which an ' +
        'offline worker receives containment guidance at the moment of a Severity 1 breach.',
      adoptedLine: 114874,
    },
    canonNote:
      "Chapter 21 names this identifier exactly once, at L36937, inside MOD-CC-04's recorded " +
      'contradiction, and its register does not carry a row for it. Two consequences bind other ' +
      'tasks on this surface and both are stated at L36937: the containment checklist is not ' +
      "among the agent's steps at all, and a gate item appears alongside a Severity 1 event only " +
      'where the agent proposes beyond pre-authorised policy. The containment panel therefore ' +
      'renders a server-side mirror and never a launch. The canon carries no record for it.',
    heldBy: null,
  },
  {
    decisionRef: 'DEC-CLEAR-001',
    question: 'May a granted qualification clearance be revoked before its duration elapses?',
    position: {
      kind: 'open',
      readings: [
        {
          text:
            'Revocation exists and is simply unwritten. The source states that the Statement of ' +
            'Work defines clearance grant and clearance expiry but never says whether a granted ' +
            'clearance may be revoked before its duration elapses, nor what happens to a run ' +
            'already resumed under it, and recommends adding a revocation command applied at ' +
            'next sync.',
          locator: 'DEC-CLEAR-001 · L49887',
        },
        {
          text:
            'Clearances are irrevocable within their duration, which is the source’s own option ' +
            '(c). A supervisor who grants one in error has no stated path to withdraw it and the ' +
            'worker may proceed for up to a full shift.',
          locator: 'DEC-CLEAR-001 · L49887',
        },
      ],
    },
    canonNote:
      'Chapter 21 never names this identifier — it is not one of the seventeen the chapter ' +
      'references — yet it governs the tenth of the chapter’s closed ten operational actions, ' +
      '"Grant a qualification clearance" at L38691. It is raised in chapter 26 at L49887, inside ' +
      'the seams section, against the qualification-clearance seam. A clearance that cannot be ' +
      'revoked is a different security posture from one that can, and no line of this build ' +
      'chooses between them. The canon carries no record for it.',
    heldBy: null,
  },
] as const satisfies readonly CcLocalDisclosure[]

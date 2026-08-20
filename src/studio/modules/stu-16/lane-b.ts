import { laneBEntersTheChain, seededLaneBClassifier, type LaneBRouting } from '@/studio/modules/stu-11/laneb'
import { nextVersionNumber } from '@/studio/modules/stu-12/versions'
import type { VersionBumpClass } from '@/studio/vocab'

/**
 * **LANE B — configured values, the single human decision, and the package
 * test (L34171).**
 *
 * ## THIS FILE HOLDS NO REFERENCE TO LANE A
 *
 * The other half of the boundary `./lane-a.ts` describes. Lane A's selection
 * weights are not importable here and are not named here; this file owns the
 * configured operating value and nothing that ranks anything.
 * `tests/unit/stu-learning.test.ts` scans both files for an edge in either
 * direction and finds none.
 *
 * ## THE STUDIO CANNOT DECIDE, BY OMISSION RATHER THAN BY GUARD
 *
 * L34171: *"**A proposal is never auto-approved — the decision is always
 * human, made exactly once**"*, in the Client Command Center. L34185 assigns
 * the surfaces: the Studio owns *"the procedural and semantic writes and the
 * learning read view; the Client Command Center owns the Lane-B decision"*.
 * `SB-STU-19` (L34293): *"the Studio displays, it does not decide."*
 *
 * So the decision is a RECORD THAT ARRIVES — `LaneBDecisionReceipt` — and
 * **nothing under `src/studio/modules/stu-16/` or `app/studio/learning/`
 * constructs one.** There is no `approve`, no `reject`, no `decide`, and no
 * function whose return type is a receipt. `applyPackageTest` cannot be
 * called without one and there is nowhere to get one from, which is a
 * stronger statement than a guard refusing to approve: a guard can be
 * deleted by a later refactor along with the test that watched it, and an
 * absent constructor cannot.
 *
 * The covering test scans for the STRUCTURE, not for the names — an object
 * literal writing a `deciderIdentityId` — because a future `confirmChange()`
 * that minted one would pass any check written against the word "approve".
 *
 * ## WHAT THE STUDIO HOLDS IS AN *OPEN* PROPOSAL
 *
 * L34212 names six proposal states. Two of them are states an undecided
 * proposal passes through and four are post-decision. `OpenProposal.state`
 * is typed to the two, so the shape the Studio's own panel renders cannot
 * express a decided proposal at all. `SB-STU-19` asks for *"open Lane-B
 * proposals"* and that is exactly what the type is.
 *
 * ## AGEING NEVER EXPIRES
 *
 * L34171: *"Undecided proposals age visibly with a 30-day stale flag and
 * never expire silently."* `FUNC-STU-16-03-A-2` (L34234): *"Roles
 * prohibited: none may suppress the flag."* `expired` is typed `false` — the
 * literal, not the boolean — so no arithmetic and no future branch can set
 * it true without changing the type and failing to compile.
 *
 * ## IN-FLIGHT RUNS, PROTECTED BY OMISSION
 *
 * L34171 and `AC-STU-139` (L34333): *"In-flight runs stay pinned regardless"*
 * of any learning outcome. `applyPackageTest` takes a proposal, a receipt and
 * a version number, and returns a version number. **It never receives a run
 * register, never imports one, and has no parameter or return field through
 * which a run could be reached** — so it cannot re-base one. This is
 * `MOD-STU-12`'s move for the same guarantee, made the same way.
 */

/* ==================================================================== *
 * THE STATES — L34212.
 * ==================================================================== */

/**
 * L34212, in the source's own order: *"A Lane-B proposal is Proposed,
 * Stale-flagged at 30 days, Approved, Rejected, Published as a patch, or
 * Applied immediately for a server-only value."*
 *
 * The full vocabulary is declared once, here, because the screen states the
 * contract. What the Studio's own records may HOLD is `OpenProposalState`,
 * two members of it.
 */
export type LaneBProposalState =
  | 'Proposed'
  | 'Stale-flagged'
  | 'Approved'
  | 'Rejected'
  | 'Published as a patch'
  | 'Applied immediately'

export const LANE_B_PROPOSAL_STATES = [
  'Proposed',
  'Stale-flagged',
  'Approved',
  'Rejected',
  'Published as a patch',
  'Applied immediately',
] as const satisfies readonly LaneBProposalState[]

type MissingFromProposalStates = Exclude<
  LaneBProposalState,
  (typeof LANE_B_PROPOSAL_STATES)[number]
>
const _proposalStatesExhaustive: MissingFromProposalStates extends never ? true : never = true
void _proposalStatesExhaustive

/**
 * L34212's last sentence, kept as a statement rather than left implicit:
 * *"Lane-A refinements have no proposal state because they are applied
 * automatically, logged, and reversible."* There is no Lane-A state union in
 * this build for the same reason.
 */
export const LANE_A_HAS_NO_PROPOSAL_STATE =
  'Lane-A refinements have no proposal state. They are applied automatically, logged, and ' +
  'reversible (L34212), so there is nothing for a person to decide and no queue for them to sit in.'

/** The two states an UNDECIDED proposal passes through. The Studio holds only these. */
export type OpenProposalState = Extract<LaneBProposalState, 'Proposed' | 'Stale-flagged'>

/* ==================================================================== *
 * THE PROPOSAL — SB-STU-19's second panel, field by field.
 * ==================================================================== */

/**
 * `FUNC-STU-16-03-A-1` (L34233): *"Assemble an evidence-backed proposal
 * carrying the current value, the proposed value, and the scope of impact."*
 * `SB-STU-19` (L34293) adds the evidence summary, the age, and the stale
 * badge past 30 days.
 */
export interface OpenProposal {
  readonly id: string
  /** The configured operating value's field — a `ConfigurationSection` where it is one. */
  readonly field: string
  readonly summary: string
  readonly currentValue: string
  readonly proposedValue: string
  readonly scopeOfImpact: string
  readonly evidenceSummary: string
  readonly ageInDays: number
  readonly state: OpenProposalState
  /**
   * Always `false`, and typed `false` rather than `boolean`. L34171: an
   * undecided proposal "never expires silently". Nothing can set this true
   * without changing the type.
   */
  readonly expired: false
  /**
   * Whether the value lives inside a published Workflow version. `null`
   * where `DEC-PKGFIELD-001` leaves it unassigned — see `applyPackageTest`,
   * which refuses to route what it cannot classify.
   */
  readonly packageBorne: boolean | null
}

/**
 * The proof that `expired` stays the literal.
 *
 * A plant proved this is worth a line: widening the field to `boolean` alone
 * changes no value, breaks no runtime assertion, and compiles — so the
 * invariant would have been gone with nothing red, and the NEXT edit is the
 * one that sets it true. This check fails the moment the type is widened,
 * which is the moment it is worth failing.
 */
const _expiredIsAlwaysFalse: OpenProposal['expired'] extends false ? true : never = true
void _expiredIsAlwaysFalse

/** L34171 — "a 30-day stale flag". */
export const STALE_FLAG_DAYS = 30

/**
 * The state an undecided proposal is in at this age. Derived, never stored
 * twice: a proposal carrying both an age and an independently-set state is
 * how the two come to disagree.
 */
export function openProposalStateAt(ageInDays: number): OpenProposalState {
  return ageInDays >= STALE_FLAG_DAYS ? 'Stale-flagged' : 'Proposed'
}

/**
 * Age an undecided proposal. Deterministic — the age is a parameter, never a
 * clock read — and `expired` is untouched because it cannot be anything but
 * `false`.
 */
export function advanceProposalAge(proposal: OpenProposal, ageInDays: number): OpenProposal {
  return { ...proposal, ageInDays, state: openProposalStateAt(ageInDays) }
}

/** The badge text `SB-STU-19` asks for, and the reason it is not an expiry. */
export function staleBadge(proposal: OpenProposal): string | null {
  if (proposal.state !== 'Stale-flagged') return null
  return `Stale — undecided for ${proposal.ageInDays} days. It is still open: an undecided proposal never expires silently (L34171), and the Quality Manager is notified again at the stale flag.`
}

/**
 * Two open proposals, both from the card's own material: the Bright Bikes
 * coaching-trigger proposal the illustrative example works through (L34324)
 * and a server-only routing target. Neither carries a decision, because
 * nothing in this module can make one.
 */
export const SEEDED_OPEN_PROPOSALS = [
  {
    id: 'PROP-2026-07-014',
    field: 'Timing',
    summary: 'Fire coaching on screen 6 earlier for less-experienced workers',
    currentValue: '80 per cent of expected time',
    proposedValue: '75 per cent of expected time',
    scopeOfImpact:
      'Screen 6 of Wheel Bolt Torque, every Job on the published version, Bright Bikes only.',
    evidenceSummary:
      '412 runs since the value was set. Where coaching fired at 80 per cent the screen was ' +
      'completed first time in 61 per cent of runs by workers in their first month, against 84 ' +
      'per cent for the rest. Seeded evidence — see the panel note.',
    ageInDays: 6,
    state: 'Proposed',
    expired: false,
    packageBorne: true,
  },
  {
    id: 'PROP-2026-06-002',
    field: 'Deviation rules and severity mapping',
    summary: 'Route minor overspray deviations to the line lead rather than to quality',
    currentValue: 'Quality Manager',
    proposedValue: 'Line lead, with the Quality Manager notified',
    scopeOfImpact:
      'Escalation routing for the minor severity band. Server-side; it never reaches a device.',
    evidenceSummary:
      '38 minor overspray deviations. Median time to acknowledgement 41 minutes to quality ' +
      'against 7 minutes to the line lead on the escalations that reached one. Seeded evidence.',
    ageInDays: 47,
    state: 'Stale-flagged',
    expired: false,
    packageBorne: false,
  },
] as const satisfies readonly OpenProposal[]

export const LANE_B_SIMULATION_NOTE =
  'These proposals are seeded fixtures. Nothing here was derived from work anybody did, no ' +
  'evidence was gathered, and no proposal was assembled by a model. The screen renders the ' +
  'contract a real proposal would arrive under.'

/* ==================================================================== *
 * THE DECISION — a record that ARRIVES. Nothing here constructs one.
 * ==================================================================== */

/**
 * What crosses the seam from `MOD-CC-06` / `MOD-CC-13` action 3, slice 9.
 *
 * `FUNC-STU-16-03-B-1` (L34237): *"Accept or reject exactly once in the
 * Client Command Center."* The two verbs are the source's own.
 * `deciderIdentityId` is an IDENTITY, never a role — L34657, and the audit
 * trail records identity and action rather than "acting as role".
 */
export interface LaneBDecisionReceipt {
  readonly proposalId: string
  readonly outcome: 'accepted' | 'rejected'
  readonly deciderIdentityId: string
  readonly decidedAt: string
}

/* ==================================================================== *
 * THE PACKAGE TEST — machinery, and it follows the decision.
 * ==================================================================== */

/**
 * L34171: *"What follows the decision is machinery: on approval, **the
 * package test applies by object type**. A package-borne value — anything
 * that lives inside a published Workflow version — **auto-publishes as a
 * patch version** ... **A server-only value applies immediately.** The
 * publication is automatic and fully audited; no second approval, no
 * ceremony."*
 */
export type PackageTestOutcome =
  | {
      readonly route: 'package-borne'
      readonly state: Extract<LaneBProposalState, 'Published as a patch'>
      /** `MOD-STU-12`'s own bump vocabulary, never a second spelling of it. */
      readonly bump: Extract<VersionBumpClass, 'PATCH'>
      readonly versionNumber: string
      readonly note: string
      readonly chain: LaneBRouting
    }
  | {
      readonly route: 'server-only'
      readonly state: Extract<LaneBProposalState, 'Applied immediately'>
      readonly note: string
      readonly chain: LaneBRouting
    }
  | {
      readonly route: 'rejected'
      readonly state: Extract<LaneBProposalState, 'Rejected'>
      readonly note: string
      readonly chain: null
    }
  | {
      readonly route: 'undetermined'
      readonly state: Extract<LaneBProposalState, 'Approved'>
      readonly openDecision: 'DEC-PKGFIELD-001'
      readonly note: string
      readonly chain: LaneBRouting
    }

/**
 * Route a DECIDED proposal. The receipt is required and this module cannot
 * make one, so there is no path from an open proposal to a routed value that
 * does not pass through a person on another surface.
 *
 * `currentVersionNumber` is the published Workflow version the patch would be
 * minted from. **No run is a parameter and none is a return field** — see the
 * file note: this function cannot re-base work that is already under way,
 * because it cannot reach it.
 */
export function applyPackageTest(
  proposal: OpenProposal,
  receipt: LaneBDecisionReceipt,
  currentVersionNumber: string,
): PackageTestOutcome {
  if (receipt.proposalId !== proposal.id) {
    throw new Error(
      `MOD-STU-16: decision receipt ${receipt.proposalId} does not belong to proposal ` +
        `${proposal.id}. Routing a value on another proposal's decision would make "the decision ` +
        'is made exactly once" (L34171) false while looking true.',
    )
  }

  if (receipt.outcome === 'rejected') {
    return {
      route: 'rejected',
      state: 'Rejected',
      chain: null,
      note:
        `Rejected by ${receipt.deciderIdentityId} at ${receipt.decidedAt}. The rejection is ` +
        'recorded and the same proposal does not recur identically without new evidence ' +
        '(L34214). The configured value is unchanged.',
    }
  }

  // The three-stage chain question, answered by MOD-STU-11's classifier —
  // the one implementation of DEC-LANEB-001's recommended hybrid. Not a
  // second copy of it.
  const chain = laneBEntersTheChain(seededLaneBClassifier.classify(proposal.field))

  if (proposal.packageBorne === null) {
    return {
      route: 'undetermined',
      state: 'Approved',
      openDecision: 'DEC-PKGFIELD-001',
      chain,
      note:
        'Approved, and it stops here. Whether this value ships inside the package or lives only ' +
        'server-side is DEC-PKGFIELD-001 (L33807), which is open: the field-by-field assignment ' +
        'is stated to exist in the package contract of Part VII and is nowhere written down. An ' +
        'approved value cannot be routed to the patch path or the immediate path without it, and ' +
        'guessing which would be inventing the assignment. Nothing was published and nothing was ' +
        'applied.',
    }
  }

  if (proposal.packageBorne) {
    return {
      route: 'package-borne',
      state: 'Published as a patch',
      bump: 'PATCH',
      versionNumber: nextVersionNumber(currentVersionNumber, 'PATCH'),
      chain,
      note:
        `Approved by ${receipt.deciderIdentityId} at ${receipt.decidedAt}. The value lives inside ` +
        `a published Workflow version, so it auto-publishes as a patch from ` +
        `${currentVersionNumber} and adopts per the tenant's adoption timing. The publication is ` +
        'automatic and fully audited: no second approval, no ceremony (L34171). Runs already ' +
        'under way finish on the values they started with, and nothing on this path can reach ' +
        'them to change that.',
    }
  }

  return {
    route: 'server-only',
    state: 'Applied immediately',
    chain,
    note:
      `Approved by ${receipt.deciderIdentityId} at ${receipt.decidedAt}. The value never reaches ` +
      'a device, so it needs no version and applies immediately (L34171). Runs already under way ' +
      'finish on the values they started with.',
  }
}

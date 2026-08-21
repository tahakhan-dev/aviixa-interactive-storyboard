import type { DohCanonicalModuleId, DohModuleId } from './modules'

/**
 * The SURF-DOH spine, part 6 of 6: the cross-slice seam registry. Spec §5.
 *
 * SEVEN ROWS BECAME EIGHT. `regulated-industry-mode` was named by
 * `MOD-DOH-08` and by its screen and registered nowhere — see its own row.
 *
 * A silent stub is the defect this registry exists to prevent (R10): each
 * seam is a named interface with a seeded fixture behind it, rendered by
 * `@/ui/doh/SeamNotice`, stating plainly which slice owns the missing half.
 */
/**
 * The slice being built. `dohSeamStatus` reads it, so "closed" is DERIVED
 * from the slice that owns the counterpart rather than restated as a second
 * field a hand edit could put out of step with the `ownerSlice` beside it —
 * the shape `stuSeamStatus` in `@/studio/seams` already ships.
 *
 * THREE SEAMS CLOSE AT THIS NUMBER, and each was checked against what slice
 * 4 recorded before the number moved, because a seam closed without reading
 * its recorded expectation is a seam closed on a guess:
 *
 * - `worker-shift-meter` — slice 4 recorded MOD-DOH-07 as owner. L26876
 *   lists MOD-DOH-01's dependency as "the Worker-Shift meter inputs from
 *   assignment and substitution", and assignment and substitution are
 *   MOD-DOH-07's whole remit. AC-DOH-01-1 (L27039) is the contract the
 *   closure must satisfy: one per worker per calendar shift regardless of
 *   run count, and one per substituting worker who actually worked.
 *   RECORDED EXPECTATION CORRECT.
 * - `archival-cascade` — slice 4 recorded MOD-DOH-05 as owner. L7161:
 *   archiving a Site or Area auto-pauses every Job bound to it, notifies
 *   the Tenant Admin with the list, and prompts reassignment before
 *   archival completes. Jobs and the derived `paused` state are
 *   MOD-DOH-05's (L7197, L7206). RECORDED EXPECTATION CORRECT.
 * - `qualification-gate` — slice 4 recorded "two of the three enforcement
 *   points", MOD-DOH-07 at assignment and MOD-DOH-06 at run start.
 *   RECORDED EXPECTATION WRONG, AND IT WAS WRONG IN THE DIRECTION THAT
 *   OVERSTATES. The source's three points are "at assignment, at run start,
 *   and at override-carrying screens" (AC-PROD-032 L1548, restated L19444,
 *   L24028, L8423) — but MOD-DOH-07's own Security row says where each one
 *   runs, and it is not two Hub points and one elsewhere: "Qualification
 *   validation runs server-side at assignment and again at run start and at
 *   override-carrying screens ON THE DEVICE" (L28112), restated as step 7 of
 *   its own workflow — "Validation runs again at run start and at
 *   override-carrying screens on the device" (L28136). Run start is a device
 *   act: MOD-DOH-06's own lifecycle has `Scheduled --> InProgress : worker
 *   starts on the Frontline Worker Application`, its twelve matrix rows
 *   (L27909-L27920) carry no gate action at all, and the validation is made
 *   against requirements in the pinned work package (L83073).
 *
 *   SO THE HUB HAS ONE ENFORCEMENT POINT, NOT TWO, and MOD-DOH-07 holds it.
 *   MOD-DOH-06 was never an owner of this seam and owes nothing on it; the
 *   row said it did, and derived `closed` over the pair, which told three
 *   screens that a slice-6 Hub module had delivered a run-start gate that is
 *   not a Hub capability. The closure is total because the Hub half is one
 *   half and it is built — not because two halves both landed.
 *
 * The other four rows are untouched: their `ownerSlice` is 10 and they stay
 * open, which is what a slice-6 build should say about them. The eighth row
 * added here, `regulated-industry-mode`, is slice 12`s and stays open too.
 */
const THIS_SLICE = 6

export type DohSeamId =
  | 'regulated-industry-mode'
  | 'worker-shift-meter'
  | 'archival-cascade'
  | 'shift-digest-delivery'
  | 'platform-access-history-audit'
  | 'qualification-gate'
  | 'tenant-contact-email-delivery'
  | 'certification-expiry-digest'

export interface DohSeamDefinition {
  readonly id: DohSeamId
  /** The built module that needs the missing half. */
  readonly consumingModule: DohModuleId
  /**
   * The module that owns the missing half — not necessarily in slice 4.
   *
   * ONE OWNER, AND THE TYPE IS WHAT MAKES IT ONE. This was a bare `string`,
   * and `qualification-gate` used the room that gave it to carry TWO module
   * ids in one field: `'MOD-DOH-06 / MOD-DOH-07'`. `dohSeamStatus` derives
   * one answer from one `ownerSlice`, so a row with two owners got a single
   * verdict covering two halves and nothing anywhere could tell them apart —
   * which is how this row came to render "closed at slice 6" over a half
   * that MOD-DOH-06 was never going to build (see the header note above).
   *
   * `DohCanonicalModuleId` is the surface's whole nineteen-module inventory,
   * so an owner outside this slice is still expressible — `MOD-DOH-10`,
   * `MOD-DOH-11` and `MOD-DOH-17` all own open rows below — but two owners
   * in one string is now a compile error rather than a sentence a reader has
   * to notice. A seam with genuinely two owning halves is two seams.
   */
  readonly ownerModule: DohCanonicalModuleId
  readonly ownerSlice: number
  readonly description: string
}

export const DOH_SEAMS = [
  {
    /**
     * THE EIGHTH SEAM, AND IT DID NOT EXIST. `MOD-DOH-08` row 14 (L28313)
     * states that the review toggle is "forced on and not disableable in
     * Regulated-Industry mode", so this slice READS `MOD-DOH-17` and builds
     * none of it — and there was no seam row for that, only prose on the
     * module and on its screen.
     *
     * A SEAM THAT DOES NOT EXIST AND A SEAM RECORDED AS UNSCHEDULED READ THE
     * SAME FROM A SCREEN, AND ONLY ONE IS TRUE. `SeamNotice` can only draw a
     * registered row; with none, the screen had to hand-write the sentence,
     * which is the silent-stub shape (R10) this registry exists to prevent —
     * the absence was invisible to every gate that walks `DOH_SEAMS`.
     *
     * `MOD-DOH-06` names `MOD-DOH-17` too, at its rows 10 and 11, but that
     * reference is NOT a dependency and is deliberately not a second
     * consuming module here: those rows send a setting to `SCR-DOH-23`, and
     * the note records that the ownerless screen group carries `MOD-DOH-17`
     * and the Part IX settings register. Registering `MOD-DOH-06` as a
     * consumer would claim a dependency on Regulated-Industry mode that
     * module does not have.
     */
    id: 'regulated-industry-mode',
    consumingModule: 'MOD-DOH-08',
    ownerModule: 'MOD-DOH-17',
    ownerSlice: 12,
    description:
      'MOD-DOH-08 row 14 (L28313) makes the review toggle "forced on and not disableable in Regulated-Industry mode". MOD-DOH-08 renders the constraint and no control; MOD-DOH-17 (card L29714-L29874) owns the mode itself, and the re-plan rules it to slice 12 because every enforcement target it names sits in slice 6 or slice 10 (L29736). The toggle is set in the tenant administration area, SCR-DOH-23 (L48117), which is slice 12`s to build as well.',
  },
  {
    id: 'worker-shift-meter',
    consumingModule: 'MOD-DOH-01',
    ownerModule: 'MOD-DOH-07',
    ownerSlice: 6,
    /**
     * "STUBS THE INPUTS HERE" WAS THE HEADING'S OWN CONTRADICTION. The row
     * reads under "Cross-slice seam — closed at slice 6", and said in the
     * next line that the inputs are stubbed. Both cannot be true, and the
     * one that stopped being true is the stub: MOD-DOH-07 landed in this
     * slice and emits them (`SEAMS_CLOSED_HERE` in
     * `@/surfaces/doh/modules/doh-07/rulings`). The description is written
     * in the tense of the seam's own status from here rather than frozen at
     * the moment the consumer was built.
     */
    description:
      'Worker-Shift meter inputs are assignment events MOD-DOH-07 emits. MOD-DOH-01 ships the ' +
      'meter as a state machine; MOD-DOH-07 landed in this slice and now supplies the inputs it ' +
      'was built against, one per worker per calendar shift regardless of run count and one per ' +
      'substituting worker who actually worked (AC-DOH-01-1, L27039).',
  },
  {
    id: 'archival-cascade',
    consumingModule: 'MOD-DOH-02',
    ownerModule: 'MOD-DOH-05',
    ownerSlice: 6,
    description:
      'A Site or Area archival cascade enumerates the Jobs it must pause; MOD-DOH-05 owns Jobs ' +
      'and the cascade completion.',
  },
  {
    id: 'shift-digest-delivery',
    consumingModule: 'MOD-DOH-03',
    ownerModule: 'MOD-DOH-10',
    ownerSlice: 10,
    description:
      'The per-shift digest-time field registers a delivery preference; MOD-DOH-10 owns the ' +
      'delivery itself.',
  },
  {
    id: 'platform-access-history-audit',
    consumingModule: 'MOD-DOH-13',
    ownerModule: 'MOD-DOH-11',
    ownerSlice: 10,
    description:
      "Platform Access History reads the tenant's own audit records; MOD-DOH-11 owns the audit " +
      'store — one audit truth per tenant (D14), never a second store built to make this slice ' +
      'self-contained.',
  },
  {
    id: 'qualification-gate',
    consumingModule: 'MOD-DOH-04',
    ownerModule: 'MOD-DOH-07',
    ownerSlice: 6,
    description:
      'MOD-DOH-04 owns the qualification record and its evaluator; MOD-DOH-07 enforces the gate ' +
      'at assignment, server-side, and that is the whole of the Hub half. The source names three ' +
      'enforcement points — at assignment, at run start, and at override-carrying screens ' +
      '(AC-PROD-032 L1548) — and puts the other two on the device, against the pinned work ' +
      'package: "again at run start and at override-carrying screens on the device" (L28112, ' +
      'restated L28136). One of the three is this surface’s; two of the three are SURF-FL’s and ' +
      'were never a Hub half of this seam.',
  },
  {
    id: 'tenant-contact-email-delivery',
    consumingModule: 'MOD-DOH-12',
    ownerModule: 'MOD-DOH-10',
    ownerSlice: 10,
    description:
      'The tenant contact email is a field MOD-DOH-12 records on its configuration screen; ' +
      'MOD-DOH-10 owns everything after that. Sending is not delivery, delivery is not ' +
      'opening, opening is not acknowledgement, and acknowledgement is not the business action ' +
      '— four transport states, none of them the outcome, and no screen may collapse them ' +
      'into one.',
  },
  {
    id: 'certification-expiry-digest',
    consumingModule: 'MOD-DOH-14',
    ownerModule: 'MOD-DOH-10',
    ownerSlice: 10,
    description:
      'MOD-DOH-14 originates no notification of its own; its one notification row, and its ' +
      'fallback-of-fallback when the projection cannot compute, are both the certification-' +
      'expiry section of the per-shift digest. MOD-DOH-14 owns only the expiry facts that ' +
      'section carries — MOD-DOH-10 owns the digest and its delivery. This is not ' +
      'shift-digest-delivery: that seam’s consumer is MOD-DOH-03’s digest-time ' +
      'preference field, a different module and a different dependency. The fallback-of-' +
      'fallback is unavailable until slice 10 ships MOD-DOH-10, so this degraded path is not ' +
      'something the Calendar can reach today.',
  },
] as const satisfies readonly DohSeamDefinition[]

type MissingFromSeams = Exclude<DohSeamId, (typeof DOH_SEAMS)[number]['id']>
const _seamsExhaustive: MissingFromSeams extends never ? true : never = true
void _seamsExhaustive

const BY_ID = new Map(DOH_SEAMS.map((s) => [s.id, s]))

export function dohSeamById(id: DohSeamId): DohSeamDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown SURF-DOH seam: ${id}`)
  return found
}

/**
 * DERIVED FROM `ownerSlice`, NEVER STORED — the same ruling
 * `stuSeamStatus` makes on `SURF-STU`. `closed` means the slice that owns
 * the missing half is this one or an earlier one, so the notice must stop
 * saying "not built here"; `open` means it is still a later slice's.
 *
 * A STORED FLAG WOULD BE A SECOND THING TO KEEP TRUE, and the one the
 * notice reads. Closing these three by editing three rows would have left
 * `ownerSlice` and the flag free to disagree; deriving means the only way
 * to close a seam is to be the slice that owns it.
 *
 * DRAWING A CLOSED SEAM AS AN ABSENCE IS A FALSE ABSENCE — slice 4's
 * defect shape 4 — which is why this is a two-state answer and not a
 * three-state one with a "closing" middle. Slice 6 either ships the owning
 * module or it does not ship, and the gates task runs strictly after every
 * build task precisely so this cannot go out half-true.
 */
export type DohSeamStatus = 'open' | 'closed'

export function dohSeamStatus(seam: DohSeamDefinition): DohSeamStatus {
  return seam.ownerSlice <= THIS_SLICE ? 'closed' : 'open'
}

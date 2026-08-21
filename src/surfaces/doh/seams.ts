import type { DohModuleId } from './modules'

/**
 * The SURF-DOH spine, part 6 of 6: the seven named cross-slice seams. Spec §5.
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
 *   points", MOD-DOH-07 at assignment and MOD-DOH-06 at run start. The
 *   source's three are "at assignment, at run start, and at
 *   override-carrying screens" (AC-PROD-032 L1548, restated L19444,
 *   L24028, L8423). The third is Client Command Center action 10 (L22182
 *   `[J16]`) — a different surface, never a Hub half of this seam, which
 *   is why slice 4 named two modules and not three. RECORDED EXPECTATION
 *   CORRECT, and the closure is total for the seam as recorded.
 *
 * The other four rows are untouched: their `ownerSlice` is 10 and they stay
 * open, which is what a slice-6 build should say about them.
 */
const THIS_SLICE = 6

export type DohSeamId =
  | 'worker-shift-meter'
  | 'archival-cascade'
  | 'shift-digest-delivery'
  | 'platform-access-history-audit'
  | 'qualification-gate'
  | 'tenant-contact-email-delivery'
  | 'certification-expiry-digest'

export interface DohSeamDefinition {
  readonly id: DohSeamId
  /** The slice-4 module that needs the missing half. */
  readonly consumingModule: DohModuleId
  /** The module that owns the missing half — not necessarily in slice 4. */
  readonly ownerModule: string
  readonly ownerSlice: number
  readonly description: string
}

export const DOH_SEAMS = [
  {
    id: 'worker-shift-meter',
    consumingModule: 'MOD-DOH-01',
    ownerModule: 'MOD-DOH-07',
    ownerSlice: 6,
    description:
      'Worker-Shift meter inputs are assignment events MOD-DOH-07 emits. MOD-DOH-01 ships the ' +
      'meter as a state machine and stubs the inputs here.',
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
    ownerModule: 'MOD-DOH-06 / MOD-DOH-07',
    ownerSlice: 6,
    description:
      'MOD-DOH-04 owns the qualification record and its evaluator; the gate at assignment ' +
      '(MOD-DOH-07) and at run start (MOD-DOH-06) is enforced in slice 6 — two of the three ' +
      'enforcement points.',
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

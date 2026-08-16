import type { Clock } from '@/domain/clock'
import type { SurfaceId } from '@/domain/surfaces'

// Failure-signalling convention (documented in full at the top of
// `@/review/store`): `createReviewRecord` below is synchronous and throws on
// an invalid caller-controlled argument (a required comment left empty) --
// that is a programming error in the immediate caller, not an IO failure, so
// it is exempt from the "never throw" rule that governs this module's IO
// boundary (`@/review/store`'s `putReviewRecord`/`listReviewRecords`/
// `resetReview`).
/**
 * Deliberately none of these reads as an approval. The frozen source's own
 * product review chain (Author -> Reviewer -> Release Authority) grants
 * Workflow approval, Job approval, Quality release, production authorisation
 * -- none of that vocabulary belongs here. A client-review action is a
 * comment on the storyboard, never a business-state transition.
 */
export type ReviewStatus = 'accepted-for-review' | 'needs-change' | 'question' | 'comment'

// I3 (final review): this used to be annotated `readonly ReviewStatus[]`,
// which WIDENS the literal array back to the union type -- TypeScript then
// has no way to tell "this array lists every member of the union" from
// "this array lists three of the four members," so a status added to
// `ReviewStatus` without a matching entry here is not a compile error.
// `satisfies` keeps the literal tuple type (so the exhaustiveness check
// below can verify it) while still checking every element is a valid
// `ReviewStatus`.
export const REVIEW_STATUSES = [
  'accepted-for-review',
  'needs-change',
  'question',
  'comment',
] as const satisfies readonly ReviewStatus[]

// Compile-time exhaustiveness check: fails to compile if `ReviewStatus`
// gains (or loses) a member that `REVIEW_STATUSES` does not list exactly
// once. `(typeof REVIEW_STATUSES)[number]` is the literal union actually
// present in the array; this only type-checks if it is identical to
// `ReviewStatus` in both directions.
type _AssertReviewStatusesExhaustive = [ReviewStatus] extends [(typeof REVIEW_STATUSES)[number]]
  ? [(typeof REVIEW_STATUSES)[number]] extends [ReviewStatus]
    ? true
    : never
  : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only compile-time check
const _reviewStatusesExhaustive: _AssertReviewStatusesExhaustive = true

/** A change request with no text is not actionable. */
const COMMENT_REQUIRED_STATUSES: readonly ReviewStatus[] = ['needs-change', 'question']

export interface CreateReviewRecordInput {
  /** What kind of thing this comment is anchored to (e.g. "screen"). */
  readonly anchorType: string
  readonly anchorId: string
  readonly surface: SurfaceId
  readonly reviewerLabel: string
  readonly status: ReviewStatus
  readonly comment: string
  /** The `hashState` fingerprint of the product state the reviewer saw. */
  readonly sourceFingerprint: string
  readonly scenarioVersion: string
  readonly buildHash: string
}

export interface ReviewRecord extends CreateReviewRecordInput {
  readonly id: string
  readonly createdAtLogical: number
}

/**
 * A review-only append record. Deliberately carries NOTHING that would let
 * it be mistaken for a product `DomainEvent`, `AuditEvent`, notification,
 * command, or schedule -- no `correlationId`, no `tenant`, no
 * `affectedSurfaces`, no `commandState`, no `auditExpectation`.
 */
export interface ReviewEvent {
  readonly id: string
  readonly recordId: string
  readonly kind: string
  readonly createdAtLogical: number
}

// Fix round 1 (CRITICAL): a `clock.logicalTick()` + module-scope counter
// scheme USED to live here. It was unique only within one module lifetime --
// `idSequence` reset to 0 on every re-evaluation of this module, which is
// every browser page reload, and `reviewRecords` (unlike domain state) is
// durable ACROSS reloads by design. The first review comment made in any two
// sessions, before the clock ever advanced, produced the identical id
// `rr-<epoch>-1-1`; `put()` (keyPath `id`) then silently replaced the first
// reviewer's record with the second's. See
// tests/unit/review-records.test.ts's "ids stay unique across a simulated
// page reload" test, which reproduces exactly that.
//
// `crypto.randomUUID()` fixes it by not depending on any in-memory counter
// at all. Review ids are deliberately OUTSIDE the determinism constraint
// that governs the kernel: they are never fed to `canonicalSerialize`/
// `hashState`, never part of a `ScenarioDomainState` snapshot, and never
// replayed through `reduce` -- they exist only as local storage keys for a
// reviewer-feedback store, so nothing about them needs to reproduce
// identically from an identical command sequence the way kernel-produced
// state must. This is NOT precedent for using randomness anywhere in
// `src/kernel/`, `src/domain/`, or `src/persistence/` -- those still derive
// everything from the injected `Clock`, exactly as before.
function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createReviewRecord(input: CreateReviewRecordInput, clock: Clock): ReviewRecord {
  if (COMMENT_REQUIRED_STATUSES.includes(input.status) && input.comment.trim() === '') {
    throw new Error(`A "${input.status}" review record requires a non-empty comment`)
  }
  return {
    ...input,
    id: nextId('rr'),
    createdAtLogical: clock.now(),
  }
}

export function createReviewEvent(recordId: string, kind: string, clock: Clock): ReviewEvent {
  return {
    id: nextId('re'),
    recordId,
    kind,
    createdAtLogical: clock.now(),
  }
}

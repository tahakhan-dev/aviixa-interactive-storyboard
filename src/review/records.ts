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

/**
 * How much the reviewer thinks this comment matters -- a description of the
 * reviewer's own assessment of the storyboard, and nothing more: it carries
 * no production or release authority, and nothing in the product consumes
 * it as a release gate. (Fix round 1, review, Minor 5: `blocking` here
 * means "the reviewer considers this blocking to THEIR review", not a
 * product release-blocking classification -- the previous wording denied
 * that reading directly above the member that most invites it.) `question`
 * deliberately reuses the string `'question'` that also appears in
 * `ReviewStatus`: they are different closed vocabularies (one asks "what
 * kind of comment is this", the other "how much does it matter"), and the
 * literal overlap is coincidental, not a shared type.
 */
export type ReviewSeverity = 'blocking' | 'major' | 'minor' | 'question'

// Same `as const satisfies` shape as REVIEW_STATUSES above, for the same
// reason: a plain `readonly ReviewSeverity[]` annotation would widen the
// literal tuple back to the union, making the exhaustiveness check below
// vacuous.
export const REVIEW_SEVERITIES = [
  'blocking',
  'major',
  'minor',
  'question',
] as const satisfies readonly ReviewSeverity[]

type _AssertReviewSeveritiesExhaustive = [ReviewSeverity] extends [(typeof REVIEW_SEVERITIES)[number]]
  ? [(typeof REVIEW_SEVERITIES)[number]] extends [ReviewSeverity]
    ? true
    : never
  : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only compile-time check
const _reviewSeveritiesExhaustive: _AssertReviewSeveritiesExhaustive = true

/**
 * What has happened to a review record since it was written. Deliberately
 * none of these reads as an approval either -- `accepted` here means
 * "the client accepted this comment for consideration", never a sign-off
 * on the change described in it. See the module-level note above.
 */
export type ReviewDisposition = 'open' | 'accepted' | 'declined' | 'superseded'

export const REVIEW_DISPOSITIONS = [
  'open',
  'accepted',
  'declined',
  'superseded',
] as const satisfies readonly ReviewDisposition[]

type _AssertReviewDispositionsExhaustive = [ReviewDisposition] extends [(typeof REVIEW_DISPOSITIONS)[number]]
  ? [(typeof REVIEW_DISPOSITIONS)[number]] extends [ReviewDisposition]
    ? true
    : never
  : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only compile-time check
const _reviewDispositionsExhaustive: _AssertReviewDispositionsExhaustive = true

export interface CreateReviewRecordInput {
  /** What kind of thing this comment is anchored to (e.g. "screen"). */
  readonly anchorType: string
  readonly anchorId: string
  readonly surface: SurfaceId
  /** The module this comment concerns. A page-level comment need not name one. */
  readonly module?: string
  /** The function this comment concerns. Named `functionId`, never `function` -- a reserved word. */
  readonly functionId?: string
  readonly route?: string
  readonly screen?: string
  /** The storyboard step the reviewer was on when they wrote this. */
  readonly storyState?: string
  readonly reviewerLabel: string
  readonly status: ReviewStatus
  readonly severity: ReviewSeverity
  readonly comment: string
  /** What the reviewer wants changed. Optional -- not every comment asks for a specific change. */
  readonly requestedChange?: string
  /** The `hashState` fingerprint of the product state the reviewer saw. */
  readonly sourceFingerprint: string
  readonly scenarioVersion: string
  readonly buildHash: string
}

export interface ReviewRecord extends CreateReviewRecordInput {
  readonly id: string
  readonly createdAtLogical: number
  readonly updatedAtLogical: number
  readonly disposition: ReviewDisposition
  readonly response: string | null
  readonly supersededBy: string | null
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
  // requestedChange is optional -- a comment need not ask for a specific
  // change. But when the status IS asking for a change and the caller DID
  // supply a requestedChange, it must not be blank: a present-but-whitespace
  // value is a caller bug, not an absent one.
  if (input.status === 'needs-change' && input.requestedChange !== undefined && input.requestedChange.trim() === '') {
    throw new Error('A "needs-change" review record\'s requested change must not be blank')
  }
  const now = clock.now()
  return {
    ...input,
    id: nextId('rr'),
    createdAtLogical: now,
    updatedAtLogical: now,
    disposition: 'open',
    response: null,
    supersededBy: null,
  }
}

/**
 * Returns a NEW record marking `record` as superseded by `bySupersedingId`.
 * Records are append-only: this never mutates its argument.
 *
 * Refuses exactly two things, both checkable without a record set:
 *   - superseding a record BY ITS OWN ID (`bySupersedingId === record.id`).
 *     (Fix round 1, review, Minor 4: this comment used to say "a cycle, not
 *     a supersession" -- true of this one case, but this function has no
 *     record set, so it cannot detect a LONGER cycle, e.g. A -> B -> C -> A.
 *     `supersedeWithinSet` below is the layer that knows the set and
 *     refuses those too.)
 *   - a clock that would move `updatedAtLogical` before `record`'s own
 *     `createdAtLogical` (Minor 3: `app/review/page.tsx` seeds a fresh
 *     wall-clock `fixedClock` per page load while review records are
 *     durable across reloads, so a clock regression between sessions is
 *     reachable in principle).
 */
export function superseded(record: ReviewRecord, bySupersedingId: string, clock: Clock): ReviewRecord {
  if (bySupersedingId === record.id) {
    throw new Error('A review record cannot supersede itself')
  }
  const updatedAtLogical = clock.now()
  if (updatedAtLogical < record.createdAtLogical) {
    throw new Error("A review record's updatedAtLogical must not precede its createdAtLogical")
  }
  return {
    ...record,
    disposition: 'superseded',
    supersededBy: bySupersedingId,
    updatedAtLogical,
  }
}

export type SupersedeResult =
  | { readonly ok: true; readonly record: ReviewRecord }
  | { readonly ok: false; readonly reason: string }

/**
 * The layer that KNOWS the record set (`superseded()` above does not --
 * spec §2.1 acceptance: "`supersededBy` referencing a record that does not
 * exist is refused," which `superseded()` alone cannot enforce). Refuses,
 * with a typed result rather than a throw:
 *   - a `bySupersedingId` that names no record in `knownRecords` (a
 *     dangling reference)
 *   - a supersession CYCLE of any length, not just the immediate
 *     self-reference `superseded()` refuses on its own: walks the forward
 *     `supersededBy` chain starting at `bySupersedingId`; if that walk ever
 *     reaches `record.id`, accepting this supersession would close a loop
 *     back to where it started (A -> B -> C -> A). The immediate
 *     self-reference is the length-0 case of the same walk (the chain
 *     starts AT `record.id`), so this subsumes `superseded()`'s own check
 *     rather than duplicating it under a different rule.
 * On success, delegates the actual record construction to `superseded()`.
 */
export function supersedeWithinSet(
  knownRecords: readonly ReviewRecord[],
  record: ReviewRecord,
  bySupersedingId: string,
  clock: Clock,
): SupersedeResult {
  const byId = new Map(knownRecords.map((r) => [r.id, r] as const))
  if (!byId.has(bySupersedingId)) {
    return { ok: false, reason: `supersededBy "${bySupersedingId}" does not reference a known record` }
  }

  let current: string | undefined = bySupersedingId
  const walked = new Set<string>()
  while (current !== undefined) {
    if (current === record.id) {
      return { ok: false, reason: `Superseding "${record.id}" by "${bySupersedingId}" would form a supersession cycle` }
    }
    if (walked.has(current)) break // an unrelated pre-existing cycle elsewhere; not this call's concern
    walked.add(current)
    current = byId.get(current)?.supersededBy ?? undefined
  }

  return { ok: true, record: superseded(record, bySupersedingId, clock) }
}

export function createReviewEvent(recordId: string, kind: string, clock: Clock): ReviewEvent {
  return {
    id: nextId('re'),
    recordId,
    kind,
    createdAtLogical: clock.now(),
  }
}

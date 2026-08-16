import type { Clock } from '@/domain/clock'
import type { SurfaceId } from '@/domain/surfaces'

/**
 * Deliberately none of these reads as an approval. The frozen source's own
 * product review chain (Author -> Reviewer -> Release Authority) grants
 * Workflow approval, Job approval, Quality release, production authorisation
 * -- none of that vocabulary belongs here. A client-review action is a
 * comment on the storyboard, never a business-state transition.
 */
export type ReviewStatus = 'accepted-for-review' | 'needs-change' | 'question' | 'comment'

export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  'accepted-for-review',
  'needs-change',
  'question',
  'comment',
] as const

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

// Ids must be unique without `Math.random()`. `clock.logicalTick()` alone is
// not enough: two records can be created against two DIFFERENT `Clock`
// instances (e.g. two `fixedClock(CANONICAL_EPOCH_MS)` calls), each of which
// starts its own tick counter at 0 -- so their first ticks would collide. A
// counter held here, at module scope, keeps incrementing across calls
// regardless of which clock instance is passed, so it is the actual source
// of uniqueness; the clock's tick and epoch are folded in too so an id also
// carries when-in-story it was made.
let idSequence = 0

function nextId(prefix: string, clock: Clock): string {
  idSequence += 1
  return `${prefix}-${clock.now()}-${clock.logicalTick()}-${idSequence}`
}

export function createReviewRecord(input: CreateReviewRecordInput, clock: Clock): ReviewRecord {
  if (COMMENT_REQUIRED_STATUSES.includes(input.status) && input.comment.trim() === '') {
    throw new Error(`A "${input.status}" review record requires a non-empty comment`)
  }
  return {
    ...input,
    id: nextId('rr', clock),
    createdAtLogical: clock.now(),
  }
}

export function createReviewEvent(recordId: string, kind: string, clock: Clock): ReviewEvent {
  return {
    id: nextId('re', clock),
    recordId,
    kind,
    createdAtLogical: clock.now(),
  }
}

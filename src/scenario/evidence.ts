import type { CommittedTransition } from '@/domain/transition'
import type { SurfaceId } from '@/domain/surfaces'

/**
 * A read-only summary of what a committed transition touched. Every field is
 * read straight off the transition; nothing here is guessed or computed from
 * outside information. `initiatingSurface` is always `null`: the domain
 * model records which surfaces a transition AFFECTED
 * (`CommittedTransition.affectedSurfaces`) but never which surface a command
 * was issued FROM, and the two are not interchangeable — e.g.
 * `CC_RELEASE_LOT_HOLD` (`src/kernel/reduce.ts`) is issued from the Command
 * Center (SURF-CC) but lists `['SURF-DOH', 'SURF-CC', 'SURF-FL']`, DOH
 * first, because DOH owns the lot record. Reporting `affectedSurfaces[0]` as
 * "where this came from" would be inventing a fact the transition does not
 * carry, which is exactly what this projection must not do.
 */
export interface ImpactProjection {
  readonly initiatingSurface: SurfaceId | null
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly objectsChanged: readonly string[]
  readonly eventCount: number
  readonly auditCount: number
  readonly notificationCount: number
}

/**
 * Evidence of one interaction, for a reviewer to inspect. Deliberately
 * carries none of `ReviewRecord`'s fields (no `reviewerLabel`, no `status`,
 * no `comment`) — this is a derived view of product truth, not a reviewer
 * action, and only an explicit reviewer action produces a `ReviewRecord`.
 */
export interface InteractionEvidenceRecord {
  readonly commandType: string | null
  readonly outcome: string
  readonly priorStateHash: string
  readonly nextStateHash: string
  readonly affectedSurfaces: readonly SurfaceId[]
}

/**
 * Read-only, pure: summarises impact without inventing anything not in the
 * transition. `c.objectTransitions` is always populated by the kernel
 * (`src/kernel/reduce.ts`), including as `[]` when a command changes no
 * object — but this is a boundary function that may see a partial test
 * double, so the fallback below only ever protects against an absent field;
 * it never substitutes a guessed value for a present one.
 */
export function projectImpact(c: CommittedTransition): ImpactProjection {
  return {
    initiatingSurface: null,
    affectedSurfaces: c.affectedSurfaces,
    objectsChanged: (c.objectTransitions ?? []).map((t) => t.objectId),
    eventCount: c.events.length,
    auditCount: c.audit.length,
    notificationCount: c.notifications.length,
  }
}

/** Read-only, pure: one evidence record derived from a committed transition. */
export function projectEvidence(c: CommittedTransition): InteractionEvidenceRecord {
  return {
    commandType: c.commands[0]?.kind ?? null,
    outcome: c.decision.outcome,
    priorStateHash: c.priorStateHash,
    nextStateHash: c.nextStateHash,
    affectedSurfaces: c.affectedSurfaces,
  }
}

import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import type { JobRecord } from '@/surfaces/doh/objects'
import {
  DOH_05_IDENTITIES,
  SEEDED_JOBS,
  displayNameFor,
  type SeededJob,
} from '@/surfaces/doh/modules/doh-05/jobs'

/**
 * The paired Jobs this storyboard shows, and the ONE Area-keyed rule the
 * whole module turns on.
 *
 * ── WHY THE NODE PATH IS WALKED AND NOT READ ──────────────────────────────
 * `DEC-AREA-001`'s adopted position (L27650) binds a Job to one PARENT NODE
 * at the tenant's configured depth — an Area for a two-level tenant, a
 * Location (Cell) for a three-level one — and its consequence is stated in
 * the same paragraph: every Area-keyed rule resolves from the Job's parent
 * node by walking UP the node path. `MOD-DOH-16` is Area-keyed on three of
 * its six rows, so the walk is this module's scope check and a direct read
 * of `parentNodeId` would be wrong on exactly the Jobs that make the
 * decision interesting.
 *
 * `JOB-WHEELTRUE` is that Job. `MOD-DOH-05` seeds it at `CELL-WHEEL-2`, a
 * Location, and a Supervisor scoped to `AREA-ASSY-A` holds scope over it —
 * but only through the walk. Compare `parentNodeId` against the scope
 * directly and the Cell-bound Job falls out of every Area scope in the
 * tenant, silently, and the paired lane renders a scope placeholder to
 * somebody who is entitled to see it. The unit suite plants exactly that.
 *
 * ── WHAT IS FIXTURE AND WHAT IS SOURCE ────────────────────────────────────
 * The PAIR is the source's own Illustrative Example (L29683): a
 * frame-preparation Job on the Paint Area paired with `JOB-REDBIKE` on
 * `AREA-ASSY-A`, the paint side cancelled, and Sam — `JOB-REDBIKE`'s Owner —
 * flagged. `MOD-DOH-05` already seeds both Jobs, so neither is invented here.
 *
 * The NODE HIERARCHY below is a build fixture and is labelled as one. The
 * source names `AREA-ASSY-A`, the Paint Area and `CELL-WHEEL-2`, but it
 * never states which Area `CELL-WHEEL-2` sits under, because nothing in the
 * source needed to know. A hierarchy is required to walk one, so one is
 * declared here and marked, rather than asserted as a source fact.
 */

export type NodeKind = 'site' | 'area' | 'cell'

export interface HierarchyNode {
  readonly id: string
  readonly kind: NodeKind
  /** `null` at the Site, which is the root of a tenant's own hierarchy. */
  readonly parent: string | null
}

/**
 * BUILD FIXTURE, NOT A SOURCE CLAIM. The parent of `CELL-WHEEL-2` is chosen
 * here because the source does not state it; every other edge follows the
 * three-level Site / Area / Location model of §4.3.
 */
export const NODES: Readonly<Record<string, HierarchyNode>> = {
  'SITE-BRIGHTBIKES-01': { id: 'SITE-BRIGHTBIKES-01', kind: 'site', parent: null },
  'AREA-ASSY-A': { id: 'AREA-ASSY-A', kind: 'area', parent: 'SITE-BRIGHTBIKES-01' },
  'AREA-PAINT': { id: 'AREA-PAINT', kind: 'area', parent: 'SITE-BRIGHTBIKES-01' },
  'AREA-BAY-OLD': { id: 'AREA-BAY-OLD', kind: 'area', parent: 'SITE-BRIGHTBIKES-01' },
  'CELL-WHEEL-2': { id: 'CELL-WHEEL-2', kind: 'cell', parent: 'AREA-ASSY-A' },
}

/**
 * THE WALK. `DEC-AREA-001`'s consequence, implemented once.
 *
 * Returns the Area a node resolves to, or `null` where the path reaches the
 * Site without passing through one. `null` is the honest answer for a Job
 * bound above the Area level and it is NOT collapsed to "out of scope" here:
 * the caller decides what an unresolvable Area means for its own rule, and
 * a walk that answered the scope question itself would be two rules in one
 * function.
 *
 * The loop is bounded by the node count rather than by trust: a hierarchy
 * edited into a cycle would otherwise hang the render rather than fail.
 */
export function areaOf(nodeId: string): string | null {
  let current: HierarchyNode | undefined = NODES[nodeId]
  for (let steps = 0; steps <= Object.keys(NODES).length; steps++) {
    if (current === undefined) return null
    if (current.kind === 'area') return current.id
    if (current.parent === null) return null
    current = NODES[current.parent]
  }
  return null
}

/* ==================================================================== *
 * SCOPE
 * ==================================================================== */

/**
 * A viewer's Area scope. `null` means tenant scope — every Area — which is
 * what the Tenant Admin, the Quality Manager and the Read-only Auditor hold
 * on this storyboard's fixtures; a list means Area scope, which narrows.
 * A scope NARROWS a role and never widens it, so the list is never additive
 * with a role grant.
 */
export interface ViewerScope {
  readonly identityId: string
  readonly areaIds: readonly string[] | null
}

export interface ScopeVerdict {
  readonly held: boolean
  readonly jobId: string
  /** The Area the Job's parent node resolved to, by the walk. */
  readonly area: string | null
  readonly reason: string
}

/**
 * Does this viewer hold scope over THIS Job?
 *
 * Fails closed on an unresolvable Area: a Job whose parent node reaches no
 * Area cannot be checked against an Area scope, and the safe answer for a
 * rule whose whole purpose is stopping a scope leak (L29629) is no.
 */
export function scopeVerdict(job: JobRecord, scope: ViewerScope): ScopeVerdict {
  const area = areaOf(job.parentNodeId)
  if (scope.areaIds === null) {
    return {
      held: true,
      jobId: job.jobId,
      area,
      reason: `Tenant scope. ${job.jobId} renders in full.`,
    }
  }
  if (area === null) {
    return {
      held: false,
      jobId: job.jobId,
      area,
      reason: `${job.jobId} is bound to ${job.parentNodeId}, whose node path reaches no Area, so an Area scope cannot be tested against it. Refused rather than assumed, because pairing may not become a scope-leak path.`,
    }
  }
  const held = scope.areaIds.includes(area)
  return {
    held,
    jobId: job.jobId,
    area,
    reason: held
      ? `${job.jobId} is bound to ${job.parentNodeId}, which resolves to ${area} by walking up the node path, and ${area} is in this viewer's Area scope.`
      : `${job.jobId} is bound to ${job.parentNodeId}, which resolves to ${area} by walking up the node path, and ${area} is not in this viewer's Area scope.`,
  }
}

/** The text SB-DOH-028 (L29681) specifies for a lane the viewer cannot see. */
export const SCOPE_PLACEHOLDER_TEXT =
  'Paired Job in another Area. You do not have access to its detail.'

/** The chip text SB-DOH-028 (L29681) specifies for a changed partner. */
export const FLAG_CHIP_TEXT = 'Paired Job changed — review required'

/* ==================================================================== *
 * THE PAIRS
 * ==================================================================== */

/** Why a partner Job carries a review flag. Both triggers are L29674, L29675. */
export type FlagTrigger = 'cancelled' | 'materially-changed'

export interface PairedJobs {
  readonly pairId: string
  readonly a: SeededJob
  readonly b: SeededJob
  /**
   * `null` where no flag is raised. Where set, it names WHICH side changed;
   * the flag then routes to the OTHER side's owner field, which is the whole
   * content of the routing rule and the reason this is not a boolean.
   */
  readonly changedSide: { readonly jobId: string; readonly trigger: FlagTrigger } | null
  readonly note: string
}

function job(jobId: string): SeededJob {
  const found = SEEDED_JOBS.find((j) => j.record.jobId === jobId)
  if (found === undefined) throw new Error(`MOD-DOH-05 seeds no Job ${jobId}`)
  return found
}

/**
 * `as const satisfies` rather than a `readonly PairedJobs[]` annotation: the
 * annotation widens every literal below to its declared type, so `pairId`
 * becomes `string` and a typo in `pairById` would be a runtime throw instead
 * of a compile error. Slice 2c's gate 2 enforces this shape across `src/` and
 * `app/`, and it caught this file.
 */
export const SEEDED_PAIRS = [
  {
    pairId: 'PAIR-PAINT-ASSY',
    a: job('JOB-PAINTLINE'),
    b: job('JOB-REDBIKE'),
    changedSide: { jobId: 'JOB-PAINTLINE', trigger: 'cancelled' },
    note: 'The source’s own Illustrative Example (L29683): the paint Job’s run is cancelled with the reason Material shortage, and Sam, as JOB-REDBIKE’s Owner, is flagged for review. Nothing happens to JOB-REDBIKE automatically.',
  },
  {
    pairId: 'PAIR-WHEEL-PAINT',
    a: job('JOB-WHEELTRUE'),
    b: job('JOB-PAINTLINE'),
    changedSide: null,
    note: 'The DEC-AREA-001 case. JOB-WHEELTRUE is bound to a Location, not an Area, so a Supervisor scoped to AREA-ASSY-A holds scope over it only through the walk up the node path. Its partner sits in AREA-PAINT and renders as a scope placeholder to that Supervisor, which is also why neither pairing control is offered on this pair.',
  },
] as const satisfies readonly PairedJobs[]

export function pairById(pairId: string): PairedJobs {
  const found = SEEDED_PAIRS.find((p) => p.pairId === pairId)
  if (found === undefined) throw new Error(`Unknown MOD-DOH-16 pair: ${pairId}`)
  return found
}

/** The two Jobs of a pair, in lane order. */
export function lanesOf(pair: PairedJobs): readonly [SeededJob, SeededJob] {
  return [pair.a, pair.b]
}

/**
 * The Job whose OWNER FIELD the flag routes to: the partner of the side that
 * changed. `null` where no flag is raised.
 *
 * This is the sentence L29586 states and L29626 repeats — cancelling or
 * materially changing one paired Job flags the PAIRED Job's Owner — and it
 * is computed rather than stored so that a fixture cannot record a flag
 * routed to the wrong side.
 */
export function flaggedJob(pair: PairedJobs): SeededJob | null {
  if (pair.changedSide === null) return null
  return pair.changedSide.jobId === pair.a.record.jobId ? pair.b : pair.a
}

/* ==================================================================== *
 * VIEWER SCOPES — the storyboard's own personas
 * ==================================================================== */

/**
 * BUILD FIXTURE. The source states no Area assignment for any persona; what
 * it states is that the Supervisor's cells on rows 1, 2 and 3 are scoped and
 * the other reading roles' are not. So the Supervisor is given a narrowing
 * Area scope and the rest tenant scope, which is the minimum that makes the
 * scoped cells testable, and the Worker gets a scope it never uses because
 * row 3 withholds the module from it outright.
 */
export const VIEWER_SCOPES: Readonly<Record<TenantRoleId, ViewerScope>> = {
  TENANT_ADMIN: { identityId: DOH_05_IDENTITIES.TENANT_ADMIN, areaIds: null },
  SUPERVISOR: { identityId: DOH_05_IDENTITIES.SUPERVISOR, areaIds: ['AREA-ASSY-A'] },
  QUALITY_MANAGER: { identityId: DOH_05_IDENTITIES.QUALITY_MANAGER, areaIds: null },
  READONLY_AUDITOR: { identityId: DOH_05_IDENTITIES.READONLY_AUDITOR, areaIds: null },
  WORKER: { identityId: DOH_05_IDENTITIES.WORKER, areaIds: [] },
}

export { displayNameFor }

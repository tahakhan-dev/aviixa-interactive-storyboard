/**
 * Task 1 (unit-02) — the shared scope-reference helper. Every later task in
 * this unit that writes a row referencing a Site/Area/Location id (a
 * Shift's `siteId`, a Qualification's `areaIds`, a Device's `locationId`,
 * and so on) calls this rather than re-deriving the same three lookups.
 *
 * WHY THIS IS NOT `resolveTenantId` (`./repository.ts`). `resolveTenantId`
 * answers "which tenant does THIS row belong to" by walking `RELATIONS`
 * from the row itself outward. It never asks the question this module
 * exists for: "does the row THIS row POINTS AT actually exist, is it
 * still active (not archived), and does it belong to the same tenant as
 * the row making the reference." `authorizeWrite`'s own `resolveTenantId`
 * call would silently accept a reference to an ARCHIVED Site or Area
 * (archived is still a resolvable tenant), and it never runs at all for a
 * reference field that isn't the write's OWN `resourceTenant` derivation —
 * a Worker's `qualification.areaIds`, for one, is never walked by
 * `authorizeWrite` at all. This module is the one place that question gets
 * asked, so every writer asks it the same way.
 *
 * Each function reports the FIRST problem it finds, in this order:
 * not-found, tenant-mismatch, archived. `wrong-parent` is checked first
 * where an `expected*Id` is supplied — a caller who already knows what the
 * parent SHOULD be gets that mismatch named before existence/tenant/status
 * are even consulted, since a row that fails `wrong-parent` is the wrong
 * row regardless of what state it's otherwise in.
 *
 * A dangling or foreign PARENT reference is reported as the PARENT's own
 * problem (its own `collection`/`id`), not remapped onto the child row
 * being checked — `checkAreaReference` returns `checkSiteReference`'s
 * result verbatim when the Area's own `siteId` doesn't resolve cleanly,
 * because "this Area's Site is archived" is a true statement and "this
 * Area is archived" is not. A caller that only wants to know THIS row's
 * own id in the problem should build a UI message from the returned
 * `collection`/`id`, not assume they always match the id it passed in.
 */
import type { Area, Location, Site } from './schemas/org'
import type { Store } from './store'

export type ScopeReferenceProblem =
  | { kind: 'not-found'; collection: 'sites' | 'areas' | 'locations'; id: string }
  | { kind: 'archived'; collection: 'sites' | 'areas' | 'locations'; id: string }
  | { kind: 'tenant-mismatch'; collection: 'sites' | 'areas' | 'locations'; id: string; expectedTenantId: string }
  | { kind: 'wrong-parent'; collection: 'areas' | 'locations'; id: string; expectedParentId: string }

export function checkSiteReference(store: Store, tenantId: string, siteId: string): ScopeReferenceProblem | null {
  const sites = store.get('sites') as readonly Site[]
  const site = sites.find((s) => s.id === siteId)
  if (!site) return { kind: 'not-found', collection: 'sites', id: siteId }
  if (site.tenantId !== tenantId) return { kind: 'tenant-mismatch', collection: 'sites', id: siteId, expectedTenantId: tenantId }
  if (site.status === 'archived') return { kind: 'archived', collection: 'sites', id: siteId }
  return null
}

export function checkAreaReference(
  store: Store,
  tenantId: string,
  areaId: string,
  expectedSiteId?: string,
): ScopeReferenceProblem | null {
  const areas = store.get('areas') as readonly Area[]
  const area = areas.find((a) => a.id === areaId)
  if (!area) return { kind: 'not-found', collection: 'areas', id: areaId }
  if (expectedSiteId !== undefined && area.siteId !== expectedSiteId) {
    return { kind: 'wrong-parent', collection: 'areas', id: areaId, expectedParentId: expectedSiteId }
  }
  // Area carries no `tenantId` of its own (`schemas/org.ts#Area`) — resolve
  // through its Site, and report that Site's own problem verbatim (see
  // this file's header for why this is not remapped onto the Area).
  const siteProblem = checkSiteReference(store, tenantId, area.siteId)
  if (siteProblem !== null) return siteProblem
  if (area.status === 'archived') return { kind: 'archived', collection: 'areas', id: areaId }
  return null
}

export function checkLocationReference(
  store: Store,
  tenantId: string,
  locationId: string,
  expectedAreaId?: string,
): ScopeReferenceProblem | null {
  const locations = store.get('locations') as readonly Location[]
  const location = locations.find((l) => l.id === locationId)
  if (!location) return { kind: 'not-found', collection: 'locations', id: locationId }
  if (expectedAreaId !== undefined && location.areaId !== expectedAreaId) {
    return { kind: 'wrong-parent', collection: 'locations', id: locationId, expectedParentId: expectedAreaId }
  }
  // Location carries no `tenantId` of its own either — resolve through its
  // Area (which itself resolves through its Site), reporting the deepest
  // problem's own collection/id verbatim, same reasoning as above.
  const areaProblem = checkAreaReference(store, tenantId, location.areaId)
  if (areaProblem !== null) return areaProblem
  if (location.status === 'archived') return { kind: 'archived', collection: 'locations', id: locationId }
  return null
}

/**
 * A short, human sentence for a `ScopeReferenceProblem` — the one place a
 * caller turns the typed problem into a `deny(...)` explanation or a
 * screen-facing message, so the wording never drifts between call sites.
 */
export function scopeReferenceMessage(problem: ScopeReferenceProblem): string {
  switch (problem.kind) {
    case 'not-found':
      return `No "${problem.collection}" row with id "${problem.id}" exists.`
    case 'archived':
      return `The "${problem.collection}" row "${problem.id}" is archived and can no longer be referenced.`
    case 'tenant-mismatch':
      return `The "${problem.collection}" row "${problem.id}" does not belong to tenant "${problem.expectedTenantId}".`
    case 'wrong-parent':
      return `The "${problem.collection}" row "${problem.id}" does not belong to the expected parent "${problem.expectedParentId}".`
  }
}

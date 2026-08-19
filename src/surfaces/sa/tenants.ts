/**
 * The illustrative tenants, named once.
 *
 * `Bright Bikes` is the frozen source's own recurring fictional tenant —
 * "the recurring fictional illustrative tenant, identifier TEN-BRIGHTBIKES;
 * never the client". Five SURF-SA screens used that name and a sixth invented
 * "Brightbikes Manufacturing"; "North Forge" and "North Forge Components"
 * diverged the same way. A cross-module review found it, because no screen on
 * its own is wrong — only the set is.
 *
 * These are FICTIONAL and illustrative. No real tenant, worker, device or
 * customer data appears anywhere in this build.
 */
export interface SaTenantFixture {
  readonly id: string
  /** The source's own name for this tenant. Never re-worded per screen. */
  readonly name: string
  /** `name (ID)`, the form most screens render in a table cell. */
  readonly label: string
}

function tenant(id: string, name: string): SaTenantFixture {
  return { id, name, label: `${name} (${id})` }
}

export const SA_TENANTS = [
  tenant('TEN-BRIGHTBIKES', 'Bright Bikes'),
  tenant('TEN-NORTHFORGE', 'North Forge'),
  tenant('TEN-RIVALCO', 'Rival Co'),
  tenant('TEN-CLEARWATER', 'Clearwater Tooling'),
  tenant('TEN-NORTHFIELD', 'Northfield Assembly'),
  tenant('TEN-NORTHWIND-TOOLS', 'Northwind Tools'),
  tenant('TEN-HARBOUR', 'Harbour Tooling'),
  tenant('TEN-VALEWORKS', 'Valeworks'),
  tenant('TEN-OLDMILL', 'Old Mill Fabrication'),
  tenant('TEN-MERIDIAN', 'Meridian Castings'),
  tenant('TEN-ASHFIELD', 'Ashfield Precision'),
] as const satisfies readonly SaTenantFixture[]

export function saTenant(id: string): SaTenantFixture {
  const found = SA_TENANTS.find((t) => t.id === id)
  if (found === undefined) {
    throw new Error(`No illustrative tenant ${id}. Add it to SA_TENANTS rather than naming it inline.`)
  }
  return found
}

import type { DohModuleId } from './modules'

/**
 * The SURF-DOH spine, part 5 of 6: screen identifiers. Spec §2 S4, D1.
 *
 * Catalogue B (`SCR-DOH-01`…`23`, source L48095-L48117) is canonical.
 * Catalogue A (`SCR-DOH-001`…`026`) uses the SAME two-to-three-digit-looking
 * identifiers for DIFFERENT screens — `SCR-DOH-23` is the tenant
 * administration area while `SCR-DOH-023` is Platform Access History — so a
 * three-digit `SCR-DOH-NNN` literal is forbidden anywhere in this codebase.
 * Names are canonical; the ids below are annotations only, never route keys.
 *
 * DELIBERATELY PARTIAL: this registers only the catalogue-B rows slice 4's
 * own eight modules use, verified line-by-line against the census. Catalogue
 * B runs to `SCR-DOH-23`, but the remaining rows belong to modules 05-08,
 * 10, 11 and 15-19 — out of this slice (`DOH_OUT_OF_SLICE_MODULES`) — and
 * asserting a canonical name for a screen this slice does not build would be
 * exactly the kind of invented catalogue row D4 refuses to mint.
 */
export interface DohScreenDefinition {
  readonly id: string
  readonly name: string
  /** `null` for chrome shared by every module (the rail) or a screen group
   *  confirmed ownerless by the source (D2's tenant administration area). */
  readonly moduleId: DohModuleId | null
  readonly sourceRef: string
}

export const DOH_SCREENS = [
  {
    id: 'SCR-DOH-01',
    name: 'Sign-in',
    moduleId: 'MOD-DOH-09',
    sourceRef: 'L48095, FEAT-DOH-0903',
  },
  {
    id: 'SCR-DOH-02',
    name: 'Operations home',
    moduleId: null, // The module rail — shared across MOD-DOH-01..19, owned by no module (S3).
    sourceRef: 'L48096',
  },
  {
    id: 'SCR-DOH-03',
    name: 'Tier and usage read view',
    moduleId: 'MOD-DOH-01',
    sourceRef: 'L48097, SB-DOH-013 L27029',
  },
  {
    id: 'SCR-DOH-04',
    name: 'Location hierarchy configuration',
    moduleId: 'MOD-DOH-02',
    sourceRef: 'L48098, SB-DOH-014 L27217',
  },
  {
    id: 'SCR-DOH-05',
    name: 'Shift management',
    moduleId: 'MOD-DOH-03',
    sourceRef: 'L48099, SB-DOH-015 L27377',
  },
  {
    id: 'SCR-DOH-07',
    name: 'Worker list',
    moduleId: 'MOD-DOH-04',
    sourceRef: 'L48101',
  },
  {
    id: 'SCR-DOH-08',
    name: 'Worker record and qualifications',
    moduleId: 'MOD-DOH-04',
    sourceRef: 'L48102',
  },
  {
    id: 'SCR-DOH-09',
    name: 'Qualification Calendar',
    moduleId: 'MOD-DOH-14',
    sourceRef: 'L48103, SB-DOH-026 L29412',
  },
  {
    id: 'SCR-DOH-18',
    name: 'Users, roles and scopes',
    moduleId: 'MOD-DOH-09',
    sourceRef: 'L48112',
  },
  {
    id: 'SCR-DOH-21',
    name: 'Integration settings',
    moduleId: 'MOD-DOH-12',
    sourceRef: 'L48115',
  },
  {
    id: 'SCR-DOH-22',
    name: 'Platform Access History and announcements',
    moduleId: 'MOD-DOH-13',
    sourceRef: 'L48116, SB-DOH-025 L29274',
  },
  {
    id: 'SCR-DOH-23',
    name: 'Tenant administration area',
    moduleId: null, // Ownerless screen group, D2 — a group, not a surface (AC-PROD-040).
    sourceRef: 'L48117',
  },
] as const satisfies readonly DohScreenDefinition[]

export type DohScreenId = (typeof DOH_SCREENS)[number]['id']

const BY_ID = new Map(DOH_SCREENS.map((s) => [s.id, s]))

export function dohScreenById(id: DohScreenId): DohScreenDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown SURF-DOH screen: ${id}`)
  return found
}

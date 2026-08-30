/**
 * Slice 5, task 3 -- the Studio's identifier vocabularies.
 *
 * Each set is `as const satisfies readonly T[]` with a real exhaustiveness
 * check: `Exclude<Union, (typeof SET)[number]> extends never ? true : never`.
 * Adding a member to the union without adding it to the array stops the
 * `Exclude` resolving to `never` and the assignment below fails to compile.
 * A closed set with no exhaustiveness check is a list.
 */

/**
 * The eighteen Studio modules. **Derived, never source-backed.** L30897:
 * "The Statement of Work provides no canonical module count for the Standards
 * and Operations Studio." L30899 states the derivation rule -- "One module per
 * numbered section of Part V, in section order, with the section's own heading
 * as the module name" -- and the inventory table runs L30911-L30930.
 *
 * `AC-STU-014` (L30992) binds this build's own screens: no document, screen or
 * interface may present a Studio module count as a Statement-of-Work fact.
 * Anything rendering this count renders `DEC-STUDIO-001` beside it.
 */
export type StudioModuleId =
  | 'MOD-STU-01'
  | 'MOD-STU-02'
  | 'MOD-STU-03'
  | 'MOD-STU-04'
  | 'MOD-STU-05'
  | 'MOD-STU-06'
  | 'MOD-STU-07'
  | 'MOD-STU-08'
  | 'MOD-STU-09'
  | 'MOD-STU-10'
  | 'MOD-STU-11'
  | 'MOD-STU-12'
  | 'MOD-STU-13'
  | 'MOD-STU-14'
  | 'MOD-STU-15'
  | 'MOD-STU-16'
  | 'MOD-STU-17'
  | 'MOD-STU-18'

export const STUDIO_MODULE_IDS = [
  'MOD-STU-01',
  'MOD-STU-02',
  'MOD-STU-03',
  'MOD-STU-04',
  'MOD-STU-05',
  'MOD-STU-06',
  'MOD-STU-07',
  'MOD-STU-08',
  'MOD-STU-09',
  'MOD-STU-10',
  'MOD-STU-11',
  'MOD-STU-12',
  'MOD-STU-13',
  'MOD-STU-14',
  'MOD-STU-15',
  'MOD-STU-16',
  'MOD-STU-17',
  'MOD-STU-18',
] as const satisfies readonly StudioModuleId[]

const _studioModuleIdsExhaustive: Exclude<StudioModuleId, (typeof STUDIO_MODULE_IDS)[number]> extends never ? true : never = true
void _studioModuleIdsExhaustive

/**
 * Screen catalogue B, L48259-L48273 -- fifteen rows, the route key under D1.
 * It is the only catalogue carrying roles-that-can-open, module-and-feature
 * and navigation entry point, and `AC-SCR-STU-001` (L48346) asserts all
 * fifteen exist. Catalogue A's three orphans are sub-views, not routes.
 */
export type StudioScreenId =
  | 'SCR-STU-01'
  | 'SCR-STU-02'
  | 'SCR-STU-03'
  | 'SCR-STU-04'
  | 'SCR-STU-05'
  | 'SCR-STU-06'
  | 'SCR-STU-07'
  | 'SCR-STU-08'
  | 'SCR-STU-09'
  | 'SCR-STU-10'
  | 'SCR-STU-11'
  | 'SCR-STU-12'
  | 'SCR-STU-13'
  | 'SCR-STU-14'
  | 'SCR-STU-15'

export const STUDIO_SCREEN_IDS = [
  'SCR-STU-01',
  'SCR-STU-02',
  'SCR-STU-03',
  'SCR-STU-04',
  'SCR-STU-05',
  'SCR-STU-06',
  'SCR-STU-07',
  'SCR-STU-08',
  'SCR-STU-09',
  'SCR-STU-10',
  'SCR-STU-11',
  'SCR-STU-12',
  'SCR-STU-13',
  'SCR-STU-14',
  'SCR-STU-15',
] as const satisfies readonly StudioScreenId[]

const _studioScreenIdsExhaustive: Exclude<StudioScreenId, (typeof STUDIO_SCREEN_IDS)[number]> extends never ? true : never = true
void _studioScreenIdsExhaustive

/**
 * The ten Studio fallback contracts, L31443-L31454. Each is defined once in
 * the source's own table and referenced by identifier throughout §20.2.
 * `FB-STU-10` is the strictest: an action that cannot be audited does not
 * happen, and there is no first fallback that permits it to proceed unaudited.
 */
export type StudioFallbackId =
  | 'FB-STU-01'
  | 'FB-STU-02'
  | 'FB-STU-03'
  | 'FB-STU-04'
  | 'FB-STU-05'
  | 'FB-STU-06'
  | 'FB-STU-07'
  | 'FB-STU-08'
  | 'FB-STU-09'
  | 'FB-STU-10'

export const FALLBACK_CONTRACTS = [
  'FB-STU-01',
  'FB-STU-02',
  'FB-STU-03',
  'FB-STU-04',
  'FB-STU-05',
  'FB-STU-06',
  'FB-STU-07',
  'FB-STU-08',
  'FB-STU-09',
  'FB-STU-10',
] as const satisfies readonly StudioFallbackId[]

const _fallbackContractsExhaustive: Exclude<StudioFallbackId, (typeof FALLBACK_CONTRACTS)[number]> extends never ? true : never = true
void _fallbackContractsExhaustive

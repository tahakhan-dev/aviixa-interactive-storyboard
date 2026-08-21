import type { RoleId } from '@/domain/roles'
import { DOH_MODULES, type DohCanonicalModuleId } from './modules'

/**
 * The SURF-DOH spine, part 5 of 6: screen identifiers. Spec §2 S4, D1.
 *
 * Catalogue B (`SCR-DOH-01`…`23`, source L48095-L48117, **23 data rows
 * counted**) is canonical. Catalogue A (L26051-L26076, **26 data rows
 * counted**) uses the SAME two-to-three-digit-looking identifiers for
 * DIFFERENT screens — catalogue B's `SCR-DOH-23` is the tenant
 * administration area while catalogue A's three-digit row at L26073 is
 * Platform Access History — so a three-digit `SCR-DOH-NNN` literal is
 * forbidden anywhere in this codebase, including in the disclosures below,
 * which name catalogue A's rows by LOCATOR AND NAME and never by literal.
 * Names are canonical; the ids below are annotations only, never route keys.
 *
 * WHAT THIS REGISTERS. Slice 4 registered the twelve catalogue-B rows its
 * own eight modules use. Slice 6 adds the nine its seven modules use:
 * `SCR-DOH-06` and `SCR-DOH-10` through `SCR-DOH-17`. Still deliberately
 * partial — `SCR-DOH-19` (Notification policy, `MOD-DOH-10`) and
 * `SCR-DOH-20` (Audit log explorer, `MOD-DOH-11`) belong to slice 10, and
 * asserting a canonical row for a screen no built module claims is exactly
 * the invented catalogue row D4 refuses to mint. 21 of catalogue B's 23.
 *
 * THIS REGISTRY CARRIES NO RAIL, AND THAT IS A C1 RULING RATHER THAN AN
 * OMISSION. `catalogueBRoles` is the source's own "Roles that can open it"
 * cell, quoted; it is NOT who may reach the screen. On five of the nine
 * slice-6 rows the cell is measurably NARROWER than the module's own
 * control matrix — see `DOH_CATALOGUE_B_REACH_NARROWER`, which names the
 * matrix line and the roles in each case. Reach comes from
 * `rolesReachingByMatrix` applied to the module's real matrix at build
 * time, and `dohScreenReach` below is the only way to get a role list out
 * of a screen row. A hand-written rail on a screen is the drift slice 5
 * moved its own reach to build time to make impossible.
 */
export interface DohScreenDefinition {
  readonly id: string
  readonly name: string
  /**
   * The module whose screen this is — catalogue B's "Modules and features
   * shown" column, first entry. `null` for chrome shared by every module
   * (the rail) or a screen group confirmed ownerless by the source (D2's
   * tenant administration area).
   *
   * `DohCanonicalModuleId`, not `DohModuleId`: `SCR-DOH-10` names
   * `MOD-DOH-05` from the moment the catalogue does, whether or not this
   * build has landed a route for it. The alternative — leaving it `null`
   * until the module lands — makes an unbuilt module indistinguishable
   * from a genuinely ownerless screen group, which is the one distinction
   * D2 exists to keep.
   */
  readonly moduleId: DohCanonicalModuleId | null
  /**
   * The REST of catalogue B's "Modules and features shown" cell, where it
   * names more than one module. `SCR-DOH-11` is the only slice-6 row that
   * does: L48105 mounts `MOD-DOH-15` and `MOD-DOH-16` inside the Job
   * editor, which is why `MOD-DOH-15` gets a component and no route of its
   * own. Empty on every other row.
   */
  readonly alsoShows: readonly DohCanonicalModuleId[]
  /**
   * VERBATIM from catalogue B's "Roles that can open it" column.
   *
   * NOT A RAIL AND NOT A REACH SET. Read `dohScreenReach` for that. This
   * is a quotation of a source cell that `DOH_CATALOGUE_B_REACH_NARROWER`
   * shows to be narrower than the matrix on five rows; parsing it into a
   * role list would ship the narrowing as if it were the answer.
   */
  readonly catalogueBRoles: string
  /** VERBATIM from catalogue B's "Navigation entry point" column — where
   *  the screen is reached from, and therefore whether it is a route of its
   *  own or a sub-view of the row it names. */
  readonly navigationEntry: string
  readonly sourceRef: string
}

export const DOH_SCREENS = [
  {
    id: 'SCR-DOH-01',
    name: 'Sign-in',
    moduleId: 'MOD-DOH-09',
    alsoShows: [],
    catalogueBRoles: 'All five tenant roles',
    navigationEntry: 'Application entry',
    sourceRef: 'L48095, FEAT-DOH-0903',
  },
  {
    id: 'SCR-DOH-02',
    name: 'Operations home',
    moduleId: null, // The module rail — shared across MOD-DOH-01..19, owned by no module (S3).
    alsoShows: [],
    catalogueBRoles: 'All five tenant roles',
    navigationEntry: 'After sign-in',
    sourceRef: 'L48096',
  },
  {
    id: 'SCR-DOH-03',
    name: 'Tier and usage read view',
    moduleId: 'MOD-DOH-01',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home',
    sourceRef: 'L48097, SB-DOH-013 L27029',
  },
  {
    id: 'SCR-DOH-04',
    name: 'Location hierarchy configuration',
    moduleId: 'MOD-DOH-02',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home, configuration group',
    sourceRef: 'L48098, SB-DOH-014 L27217',
  },
  {
    id: 'SCR-DOH-05',
    name: 'Shift management',
    moduleId: 'MOD-DOH-03',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home, configuration group',
    sourceRef: 'L48099, SB-DOH-015 L27377',
  },
  {
    id: 'SCR-DOH-06',
    name: 'Parts registry',
    moduleId: 'MOD-DOH-19',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin, Supervisor',
    navigationEntry: 'Operations home, configuration group',
    sourceRef: 'L48100',
  },
  {
    id: 'SCR-DOH-07',
    name: 'Worker list',
    moduleId: 'MOD-DOH-04',
    alsoShows: [],
    catalogueBRoles: 'Supervisor, Quality Manager, Tenant Admin, Read-only Auditor',
    navigationEntry: 'Operations home, people group',
    sourceRef: 'L48101',
  },
  {
    id: 'SCR-DOH-08',
    name: 'Worker record and qualifications',
    moduleId: 'MOD-DOH-04',
    alsoShows: [],
    catalogueBRoles: 'Supervisor, Quality Manager, Read-only Auditor',
    navigationEntry: 'Worker list',
    sourceRef: 'L48102',
  },
  {
    id: 'SCR-DOH-09',
    name: 'Qualification Calendar',
    moduleId: 'MOD-DOH-14',
    alsoShows: [],
    catalogueBRoles: 'Quality Manager, Supervisor, Read-only Auditor',
    navigationEntry: 'Operations home, people group',
    sourceRef: 'L48103, SB-DOH-026 L29413',
  },
  {
    id: 'SCR-DOH-10',
    name: 'Job list',
    moduleId: 'MOD-DOH-05',
    alsoShows: [],
    catalogueBRoles: 'Supervisor, Quality Manager, Tenant Admin, Read-only Auditor',
    navigationEntry: 'Operations home, work group',
    sourceRef: 'L48104',
  },
  {
    id: 'SCR-DOH-11',
    name: 'Job editor',
    moduleId: 'MOD-DOH-05',
    // L48105 is where catalogue B mounts MOD-DOH-15 and MOD-DOH-16. It is
    // the source of MOD-DOH-15 having no screen of its own.
    alsoShows: ['MOD-DOH-15', 'MOD-DOH-16'],
    catalogueBRoles: 'Supervisor',
    navigationEntry: 'Job list',
    sourceRef: 'L48105',
  },
  {
    id: 'SCR-DOH-12',
    name: 'Job approval queue',
    moduleId: 'MOD-DOH-05',
    alsoShows: [],
    catalogueBRoles: 'Quality Manager',
    navigationEntry: 'Operations home, work group',
    sourceRef: 'L48106',
  },
  {
    id: 'SCR-DOH-13',
    name: 'Run schedule board',
    moduleId: 'MOD-DOH-06',
    alsoShows: [],
    catalogueBRoles: 'Supervisor, Quality Manager, Read-only Auditor',
    navigationEntry: 'Operations home, work group',
    sourceRef: 'L48107',
  },
  {
    id: 'SCR-DOH-14',
    name: 'Run detail and oversight',
    moduleId: 'MOD-DOH-06',
    alsoShows: [],
    catalogueBRoles: 'Supervisor, Quality Manager, Read-only Auditor',
    navigationEntry: 'Run schedule board',
    sourceRef: 'L48108',
  },
  {
    id: 'SCR-DOH-15',
    name: 'Assignment and substitution',
    moduleId: 'MOD-DOH-07',
    alsoShows: [],
    catalogueBRoles: 'Supervisor',
    navigationEntry: 'Run detail',
    sourceRef: 'L48109',
  },
  {
    id: 'SCR-DOH-16',
    name: 'Execution Summary review queue',
    moduleId: 'MOD-DOH-08',
    alsoShows: [],
    catalogueBRoles: 'Quality Manager, Read-only Auditor',
    navigationEntry: 'Operations home, quality group',
    // Catalogue A reverses this row and the next — see DOH_CATALOGUE_AB_SWAP.
    sourceRef: 'L48110',
  },
  {
    id: 'SCR-DOH-17',
    name: 'Execution Summary detail and Anomaly Register',
    moduleId: 'MOD-DOH-08',
    alsoShows: [],
    catalogueBRoles: 'Quality Manager, Read-only Auditor',
    navigationEntry: 'Review queue',
    sourceRef: 'L48111',
  },
  {
    id: 'SCR-DOH-18',
    name: 'Users, roles and scopes',
    moduleId: 'MOD-DOH-09',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home, administration group',
    sourceRef: 'L48112',
  },
  {
    id: 'SCR-DOH-21',
    name: 'Integration settings',
    moduleId: 'MOD-DOH-12',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home, administration group',
    sourceRef: 'L48115',
  },
  {
    id: 'SCR-DOH-22',
    name: 'Platform Access History and announcements',
    moduleId: 'MOD-DOH-13',
    alsoShows: [],
    catalogueBRoles: 'Tenant Admin, Read-only Auditor',
    navigationEntry: 'Operations home, administration group',
    sourceRef: 'L48116',
  },
  {
    id: 'SCR-DOH-23',
    name: 'Tenant administration area',
    moduleId: null, // Ownerless screen group, D2 — a group, not a surface (AC-PROD-040).
    // L48117's cell reads "Part IX settings register, MOD-DOH-17". The
    // settings register is not a module; MOD-DOH-17 is, and it is slice 12.
    alsoShows: ['MOD-DOH-17'],
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home, administration group',
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

/**
 * WHO MAY REACH A SCREEN — the only answer this file gives, and it is
 * DERIVED rather than stored.
 *
 * It reads the owning module's `rolesReaching`, which
 * `scripts/build-doh-module-reach.mjs` writes by applying
 * `rolesReachingByMatrix` to that module's real control matrix. There is no
 * second copy of the rule and no second copy of the answer, and in
 * particular there is no path from `catalogueBRoles` to a role list:
 * `DOH_CATALOGUE_B_REACH_NARROWER` records that the catalogue cell is
 * narrower than the matrix on five of the nine slice-6 rows, so a screen
 * that drew its rail from the catalogue would withhold from roles the
 * source admits.
 *
 * `null` IS THE HONEST ANSWER FOR A MODULE THAT HAS NOT LANDED, and it is
 * not an empty set. Ten slice-6 tasks follow this one; until a module's
 * matrix and fixture exist there is nothing to derive from, and an empty
 * array would be a derivation that never ran wearing the clothes of one
 * that did. It is also not a permanent state: the moment a module task adds
 * its fixture and `DOH_MODULES` row, the generator produces its reach and
 * this function starts answering — with no edit here.
 */
export function dohScreenReach(id: DohScreenId): readonly RoleId[] | null {
  const moduleId = dohScreenById(id).moduleId
  if (moduleId === null) return null
  return DOH_MODULES.find((m) => m.id === moduleId)?.rolesReaching ?? null
}

/**
 * THE C1 TRAP, MEASURED. Catalogue B's "Roles that can open it" cell is
 * narrower than the owning module's own control matrix on FIVE of the nine
 * slice-6 rows. Each entry names the matrix line whose cell admits a role
 * the catalogue omits, for the same capability the screen's own row names.
 *
 * MEASURED HERE FOR THE NINE SLICE-6 ROWS ONLY. The twelve slice-4 rows
 * were not re-measured in this task and their absence from this list is
 * therefore silence, not a finding of "not narrower". Saying so is cheaper
 * than a list that reads as exhaustive and is not.
 *
 * `SCR-DOH-14` IS DELIBERATELY ABSENT and is the reason the criterion is
 * "the screen's own capability row" rather than "the module's reach".
 * MOD-DOH-06's matrix has one view row, L27910, and it belongs to the
 * schedule board; no row names the run detail's own view act. Comparing
 * against MODULE reach instead would mark `SCR-DOH-12` and `SCR-DOH-14`
 * narrower too — true but vacuous, since every screen of a multi-screen
 * module is narrower than its module.
 *
 * THE PLAN NAMED FOUR. `SCR-DOH-06` is the fifth, found by measuring rather
 * than by transcribing: L30074 gives the Quality Manager and the Read-only
 * Auditor `Read-only` on the parts registry, which is a holding status, and
 * catalogue B's cell names neither.
 */
export interface DohCatalogueNarrowing {
  readonly screenId: DohScreenId
  /** The roles the matrix admits and catalogue B's cell omits. */
  readonly omittedRoles: readonly string[]
  /** The matrix line, and the capability row it is. */
  readonly matrixRef: string
}

export const DOH_CATALOGUE_B_REACH_NARROWER = [
  {
    screenId: 'SCR-DOH-06',
    omittedRoles: ['Quality Manager', 'Read-only Auditor'],
    matrixRef: 'L30074 — MOD-DOH-19 "View the registry", `Read-only` for both',
  },
  {
    screenId: 'SCR-DOH-11',
    omittedRoles: ['Tenant Admin'],
    matrixRef: 'L27695 — MOD-DOH-05 "Edit a draft Job", unconditional `Allowed`',
  },
  {
    screenId: 'SCR-DOH-13',
    omittedRoles: ['Tenant Admin'],
    matrixRef: 'L27910 — MOD-DOH-06 "View the schedule, today plus 7 days", `Allowed`',
  },
  {
    screenId: 'SCR-DOH-15',
    omittedRoles: ['Tenant Admin', 'Quality Manager', 'Read-only Auditor'],
    matrixRef:
      'L28125 — MOD-DOH-07 "View assignments", `Allowed` / `Allowed` / `Read-only` respectively',
  },
  {
    screenId: 'SCR-DOH-17',
    omittedRoles: ['Tenant Admin'],
    matrixRef:
      'L28306 — MOD-DOH-08 "View the Anomaly Register", `Allowed`; L28300 "View an Execution Summary" says `Allowed` too',
  },
] as const satisfies readonly DohCatalogueNarrowing[]

/**
 * THE ONE VIEW WITH NO CATALOGUE-B ROW, registered as an uncatalogued
 * STORYBOARD name with no `SCR-DOH-*` id minted — the treatment slice 5
 * gave `MOD-STU-14`'s offline package manifest, whose view is the
 * storyboard `SB-STU-17` and which borrows no catalogue-B id
 * (`src/studio/modules.ts`, `uncataloguedScreen`).
 *
 * Catalogue A does carry a row for it, at L26074, under a banned
 * three-digit literal — so the literal is not written here either, and the
 * row is named by locator. That row also gives it a "Primary role" of
 * "Supervisor and Job Owner", and **Job Owner is a field on the Job record,
 * not a role** (L27652, L7151, L16282): treating it as a sixth role opens a
 * privilege-escalation path the source closes. Catalogue A's row is
 * narrower than the matrix as well — L29615 gives the Tenant Admin and the
 * Quality Manager `Allowed` and the Read-only Auditor `Read-only` on the
 * paired scheduling view.
 */
export interface DohUncataloguedScreenName {
  /** The source's own storyboard identifier. Never an `SCR-DOH-*` id. */
  readonly name: string
  readonly moduleId: DohCanonicalModuleId
  readonly note: string
  readonly sourceRef: string
}

export const DOH_UNCATALOGUED_SCREEN_NAMES = [
  {
    name: 'SB-DOH-028',
    moduleId: 'MOD-DOH-16',
    note: 'The paired scheduling view. Catalogue B carries no row for MOD-DOH-16 at all, so no catalogue-B id is borrowed and none is minted; the storyboard name is the annotation. Catalogue A names it at L26074 under a three-digit literal this codebase forbids, with a "Primary role" of "Supervisor and Job Owner" — Job Owner is a field on the Job record, not a role.',
    sourceRef: 'L29681 (SB-DOH-028); L29615 (matrix view row); L26074 (catalogue A, by locator)',
  },
] as const satisfies readonly DohUncataloguedScreenName[]

/**
 * THE CATALOGUE A/B SWAP — grade C3, disclosed rather than silently picked.
 *
 * The two catalogues assign the review queue and the Summary detail to
 * OPPOSITE identifiers. Catalogue B, which is canonical here, makes
 * `SCR-DOH-16` the Execution Summary review queue (L48110) and
 * `SCR-DOH-17` the Execution Summary detail and Anomaly Register (L48111).
 * Catalogue A reverses them: its row at L26066 is the Execution Summary
 * view and its row at L26067 is the Quality Manager review queue. Both of
 * catalogue A's identifiers are three-digit literals, which is why they are
 * named here by locator and name only.
 *
 * WHAT THIS BUILD DOES AND DOES NOT SETTLE. It follows catalogue B, because
 * catalogue B is this surface's canonical register and every other row in
 * `DOH_SCREENS` already keys on it. It does NOT claim catalogue A is wrong,
 * and no reader of `SCR-DOH-16`/`SCR-DOH-17` may assume the source agrees
 * with itself: a citation of "SCR-DOH-16" in any other chapter has to be
 * read against BOTH catalogues before it means anything. The divergence
 * renders; it is not tidied away in either direction.
 */
export const DOH_CATALOGUE_AB_SWAP = {
  id: 'CONTRADICTION-CATALOGUES-SWAP',
  grade: 'C3',
  followed: 'catalogue B',
  catalogueB: [
    { screenId: 'SCR-DOH-16', name: 'Execution Summary review queue', sourceRef: 'L48110' },
    {
      screenId: 'SCR-DOH-17',
      name: 'Execution Summary detail and Anomaly Register',
      sourceRef: 'L48111',
    },
  ],
  catalogueA: [
    { sourceRef: 'L26066', name: 'Execution Summary view' },
    { sourceRef: 'L26067', name: 'Quality Manager review queue' },
  ],
  statement:
    'Catalogue A and catalogue B swap the Execution Summary review queue and the Summary detail across the same two trailing numbers. This build follows catalogue B, the canonical register for this surface; catalogue A’s two rows are recorded by locator and name because their identifiers are the banned three-digit form. Neither catalogue is declared wrong, and a cross-chapter citation of either number must be resolved against both before it is relied on.',
} as const

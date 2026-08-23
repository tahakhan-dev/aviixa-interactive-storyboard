import { rolesInDomain, type RoleId } from '@/domain/roles'
import {
  DOH_MODULES,
  cellStatus,
  rolesReachingByMatrix,
  type DohCanonicalModuleId,
  type DohControlMatrixRow,
} from './modules'
import { doh05Row } from './modules/doh-05/matrix'
import { matrixRow as doh06Row } from './modules/doh-06/matrix'
import { assignmentRow as doh07Row } from './modules/doh-07/matrix'
import { doh08Row } from './modules/doh-08/matrix'
import { doh15Row } from './modules/doh-15/matrix'
import { doh19Row } from './modules/doh-19/matrix'

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
 * `SCR-DOH-06` and `SCR-DOH-10` through `SCR-DOH-17`. Slice 10 adds the last
 * two, `SCR-DOH-19` (Notification policy, `MOD-DOH-10`, L48113) and
 * `SCR-DOH-20` (Audit log explorer, `MOD-DOH-11`, L48114), when and only
 * when their modules acquired routes: asserting a canonical row for a screen
 * no built module claims is the invented catalogue row D4 refuses to mint,
 * and a row nothing reads is the same defect pointed the other way. Both are
 * read the moment they land — `screenAnnotation` in `app/hub/HubShell.tsx`
 * derives the module index's annotation from this register, so before these
 * rows the two modules would have been the only rows of the index printing
 * none. Every row of catalogue B is now registered.
 *
 * THIS REGISTRY CARRIES NO RAIL, AND THAT IS A C1 RULING RATHER THAN AN
 * OMISSION. `catalogueBRoles` is the source's own "Roles that can open it"
 * cell, quoted; it is NOT who may reach the screen. On five of the nine
 * slice-6 rows the cell is measurably NARROWER than the module's own
 * control matrix — see `DOH_CATALOGUE_B_REACH_NARROWER`, which derives the
 * omitted roles from the matrix row and names the line in each case. Reach comes from
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
    id: 'SCR-DOH-19',
    name: 'Notification policy',
    moduleId: 'MOD-DOH-10',
    alsoShows: [],
    // "Tenant Admin" alone, and the screen renders more than that cell
    // admits: catalogue A's row for the same module at L26070 is
    // "Notification policy and preferences", primary role "Tenant Admin sets
    // policy; each user sets preferences". The screen is the two halves and
    // the name here is catalogue B's, verbatim, because catalogue B is the
    // canonical register (D1) — not because it is the whole screen.
    catalogueBRoles: 'Tenant Admin',
    navigationEntry: 'Operations home, administration group',
    sourceRef: 'L48113',
  },
  {
    id: 'SCR-DOH-20',
    name: 'Audit log explorer',
    moduleId: 'MOD-DOH-11',
    alsoShows: [],
    catalogueBRoles: 'Read-only Auditor, Tenant Admin, Quality Manager',
    navigationEntry: 'Operations home, administration group',
    sourceRef: 'L48114',
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
 * `DOH_CATALOGUE_B_REACH_NARROWER` DERIVES that the catalogue cell is
 * narrower than the matrix on five of the nine slice-6 rows — six times
 * over, because `SCR-DOH-11` is narrowed by two different modules — so a
 * screen that drew its rail from the catalogue would withhold from roles the
 * source admits.
 *
 * `null` IS THE HONEST ANSWER FOR A SCREEN NO MODULE OWNS, and it is not an
 * empty set. It was also the answer for a module that had not landed, and
 * for one wave every slice-6 row answered `null` for that second reason;
 * the registry task moved all seven modules into `DOH_MODULES` and those
 * rows now answer, with no edit here — which was the design. What is left
 * answering `null` is `SCR-DOH-02`, the rail, and `SCR-DOH-23`, the
 * ownerless tenant administration area: two rows whose `moduleId` is `null`
 * because the source gives them no module, not because a build has not
 * caught up. An empty array in either case would be a derivation that never
 * ran wearing the clothes of one that did.
 */
export function dohScreenReach(id: DohScreenId): readonly RoleId[] | null {
  const moduleId = dohScreenById(id).moduleId
  if (moduleId === null) return null
  return DOH_MODULES.find((m) => m.id === moduleId)?.rolesReaching ?? null
}

/**
 * THE C1 TRAP, DERIVED. Catalogue B's "Roles that can open it" cell is
 * narrower than the owning module's own control matrix on five of the
 * slice-6 screens, and on one of them TWICE.
 *
 * NOTHING BELOW IS A HAND-WRITTEN ROLE LIST ANY MORE, and that is the whole
 * change. The register used to carry `omittedRoles` as prose, which is how
 * it came to hold one entry per SCREEN while `SCR-DOH-11` is narrowed by two
 * different modules, and how "the plan named four" survived one round longer
 * than the measurement did. What is declared here is the one thing a
 * derivation cannot supply — WHICH matrix row is a given screen's own
 * capability row, which is a reading of the source — and everything else is
 * computed from that row and that cell.
 *
 * THE RULE, in one sentence: a screen is narrowed when its module's own
 * capability row admits a role that catalogue B's cell for that screen does
 * not name. "Admits" is `rolesReachingByMatrix` applied to that single row —
 * the ONE implementation of the holding rule, not a second copy of it.
 *
 * THE WORKER IS NOT COUNTED, and the exclusion is `MOD-DOH-07`'s own ruling
 * (`CATALOGUE_B_NARROWING` in `@/surfaces/doh/modules/doh-07/rulings`)
 * applied to every row rather than to the one that measured it. D11 withholds
 * the whole surface from the Worker, so where the matrix admits the Worker
 * and the catalogue does not, the catalogue and the ROUTE REGISTRY agree and
 * only the matrix dissents — that dissent is disclosed on the row itself and
 * is not a catalogue defect. It bites on exactly two rows, L27910 and L28125,
 * and without it both would report a role nobody can reach.
 *
 * `SCR-DOH-14` HAS NO ANCHOR, which is why it is absent and why the criterion
 * is "the screen's own capability row" rather than "the module's reach".
 * `MOD-DOH-06`'s matrix has one view row, L27910, and it belongs to the
 * schedule board; no row names the run detail's own view act. Comparing
 * against MODULE reach instead would mark `SCR-DOH-12` and `SCR-DOH-14`
 * narrower too — true but vacuous, since every screen of a multi-screen
 * module is narrower than its module.
 *
 * THREE ANCHORS DERIVE TO NO NARROWING AND ARE DROPPED — `SCR-DOH-10`,
 * `SCR-DOH-12` and `SCR-DOH-16`. They are anchored anyway, so the filter is
 * a live question rather than a list of foregone answers: `SCR-DOH-16`'s
 * L28301 admits exactly the two roles its cell names while its sibling
 * `SCR-DOH-17` is narrowed, and that difference is measured here rather than
 * asserted.
 *
 * MEASURED FOR THE SLICE-6 ROWS ONLY. The twelve slice-4 rows were not
 * anchored and their absence is silence, not a finding of "not narrower".
 */
export interface DohCatalogueNarrowing {
  readonly screenId: DohScreenId
  /** Which module narrows it — a screen mounting three can be narrowed by each. */
  readonly moduleId: DohCanonicalModuleId
  /** The roles the matrix admits and catalogue B's cell omits. Derived. */
  readonly omittedRoles: readonly string[]
  /** The matrix line, and the capability row it is. Derived from the row. */
  readonly matrixRef: string
}

/**
 * THE ONE DECLARED INPUT: which row of which module's matrix is this
 * screen's own capability row. Everything else below is computed.
 *
 * Ordered by screen, then by the order catalogue B's own "Modules and
 * features shown" cell names the modules — so `SCR-DOH-11`'s `MOD-DOH-05`
 * anchor precedes its `MOD-DOH-15` one, as L48105 does.
 */
const NARROWING_ANCHORS = [
  { screenId: 'SCR-DOH-06', moduleId: 'MOD-DOH-19', row: doh19Row('view-the-registry') },
  { screenId: 'SCR-DOH-10', moduleId: 'MOD-DOH-05', row: doh05Row('view-jobs') },
  { screenId: 'SCR-DOH-11', moduleId: 'MOD-DOH-05', row: doh05Row('edit-a-draft-job') },
  { screenId: 'SCR-DOH-11', moduleId: 'MOD-DOH-15', row: doh15Row('clone-a-job') },
  { screenId: 'SCR-DOH-12', moduleId: 'MOD-DOH-05', row: doh05Row('approve-a-job') },
  { screenId: 'SCR-DOH-13', moduleId: 'MOD-DOH-06', row: doh06Row('view-the-schedule') },
  { screenId: 'SCR-DOH-15', moduleId: 'MOD-DOH-07', row: doh07Row('view-assignments') },
  { screenId: 'SCR-DOH-16', moduleId: 'MOD-DOH-08', row: doh08Row('work-the-review-queue') },
  { screenId: 'SCR-DOH-17', moduleId: 'MOD-DOH-08', row: doh08Row('view-the-anomaly-register') },
] as const satisfies readonly {
  readonly screenId: DohScreenId
  readonly moduleId: DohCanonicalModuleId
  readonly row: DohControlMatrixRow
}[]

/**
 * Role id to the name catalogue B writes, read out of the role registry so a
 * renamed role cannot leave a stale spelling here. A cell naming a token this
 * map does not know is a cell this parser has not been taught, and it throws
 * below rather than silently reporting every role as omitted.
 */
const TENANT_ROLE_NAMES = new Map(rolesInDomain('TENANT').map((r) => [r.id, r.name]))

function omittedByCatalogue(
  row: DohControlMatrixRow,
  cell: string,
): readonly string[] {
  // The single-row matrix is the point: `rolesReachingByMatrix` over one row
  // answers "which roles hold this row", by the one implementation of the
  // holding rule and with no second copy of it here.
  const admitted = rolesReachingByMatrix([row], cellStatus)
  return admitted
    .filter((role) => role !== 'WORKER')
    .map((role) => {
      const name = TENANT_ROLE_NAMES.get(role)
      if (name === undefined) throw new Error(`No registry name for tenant role ${role}`)
      return name
    })
    .filter((name) => !cell.includes(name))
}

export const DOH_CATALOGUE_B_REACH_NARROWER: readonly DohCatalogueNarrowing[] =
  NARROWING_ANCHORS.map(({ screenId, moduleId, row }) => ({
    screenId,
    moduleId,
    omittedRoles: omittedByCatalogue(row, dohScreenById(screenId).catalogueBRoles),
    matrixRef: `${row.sourceRef} — ${moduleId} "${row.control}"`,
  })).filter((n) => n.omittedRoles.length > 0)

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
    note: 'The paired scheduling view. Catalogue B gives MOD-DOH-16 no SCREEN OF ITS OWN — it names the module once, inside SCR-DOH-11`s "Modules and features shown" cell at L48105, where the Job editor mounts it alongside MOD-DOH-15 — so this view has no catalogue-B id to borrow and none is minted; the storyboard name is the annotation. (The note used to read "carries no row for MOD-DOH-16 at all", which is false: `alsoShows` on SCR-DOH-11 in this same file records the L48105 mount. The treatment was right for the wrong reason.) Catalogue A names the view at L26074 under a three-digit literal this codebase forbids, with a "Primary role" of "Supervisor and Job Owner" — Job Owner is a field on the Job record, not a role.',
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

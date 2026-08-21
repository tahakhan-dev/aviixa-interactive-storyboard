import { surfaceById, type SurfaceId } from '@/domain/surfaces'
import { routeBySurface, routeOpenDecisionFor, routesForRole } from '@/routes/definitions'
import type { RoleId } from '@/domain/roles'
import type { ControlStatus, MatrixRowSurface } from './modules'

/* ==================================================================== *
 * THE BOUNDARY REGISTER — §19.1.2, the eight adjacent capabilities the
 * Delivery Operations Hub feeds and does not own.
 * ==================================================================== */

/**
 * WHY THIS IS DATA AND NOT PROSE, AND WHY IT IS NOT A SEAM.
 *
 * `@/surfaces/doh/seams` and `@/ui/doh/SeamNotice` describe a capability
 * that belongs on this surface and has not been BUILT YET: "owned by module
 * X, slice N" is a claim about a schedule, and it comes true when slice N
 * ships. Every one of the seven registered seams is that shape — each names
 * a `MOD-DOH-*` owner and a slice number.
 *
 * The eight rows below are the opposite claim. The capability is not late;
 * it lives on another surface PERMANENTLY, and the Hub "does not carry its
 * user interface or its decision rights" (L25715). Telling a reader that
 * the Custom Report Builder is "not built here, owned by module X, slice N"
 * would be a statement about the product that is not true and never becomes
 * true. That is the distinction the two components keep apart, and
 * `tests/unit/doh-boundary.test.ts` holds the seam registry to its half of
 * it rather than trusting the two to stay separate by habit.
 *
 * COUNTED, NOT QUOTED FROM A COUNT. The table is L25717 (header), L25718
 * (separator), L25719-L25726 (eight data rows) — counted off the frozen
 * source rather than taken from the plan's "8 rows at L25717-L25726", which
 * gets the count right and the span two lines wide. The source states the
 * same eight twice more: "all eight registered boundaries route through Hub
 * services" (AC-DOH-012-1, L25765) and "The eight-row boundary register is
 * `SoW Fact` at §4.1.2" (L25777).
 */
export type DohBoundaryId =
  | 'cross-tenant-administration'
  | 'compliance-emergency-access'
  | 'usage-and-billing-administration'
  | 'offline-sync-conflict-review'
  | 'custom-report-builder'
  | 'qualification-clearance-granting'
  | 'workflow-and-instruction-authoring'
  | 'step-execution-and-capture'

export interface DohBoundaryRow {
  readonly id: DohBoundaryId
  /** Column 1, verbatim. */
  readonly capability: string
  /**
   * Column 2 resolved to a registered surface. Row 3's cell says more than
   * a surface name and `owningSurfaceText` keeps the rest of it.
   */
  readonly owningSurface: SurfaceId
  /** Column 2, verbatim. */
  readonly owningSurfaceText: string
  /** Column 3, verbatim: what this surface contributes to a capability it does not own. */
  readonly hubContributes: string
  /** Column 4, verbatim. */
  readonly sourceStatus: string
  /** The row's own line in the frozen source. */
  readonly sourceRef: string
}

export const DOH_BOUNDARY_REGISTER = [
  {
    id: 'cross-tenant-administration',
    capability:
      'Cross-tenant administration: tenant onboarding, tier, entitlement and cap configuration, suspension state, pilot management, tenant-group management, the Regulated-Industry mode toggle, retention control, legal hold, feature enablement',
    owningSurface: 'SURF-SA',
    owningSurfaceText: 'Super Admin platform console',
    hubContributes:
      "Enforces the resulting state on every screen and application programming interface; records every transition in `tenant_state_history` and the audit log; renders the tenant's own read-only position",
    sourceStatus: '[SoW Fact — §4.1.2, §4.2]',
    sourceRef: 'L25719',
  },
  {
    id: 'compliance-emergency-access',
    capability:
      'The compliance emergency-access procedure, dual-authorised and fully logged, entirely separate from support sessions',
    owningSurface: 'SURF-SA',
    owningSurfaceText: 'Super Admin platform console',
    hubContributes:
      "Mirrors every access event into the tenant's own audit trail and surfaces it in Platform Access History",
    sourceStatus: '[SoW Fact — §4.1.2, §4.12.1]',
    sourceRef: 'L25720',
  },
  {
    id: 'usage-and-billing-administration',
    capability: 'Usage and billing administration and the usage-ledger export machinery',
    owningSurface: 'SURF-SA',
    owningSurfaceText:
      'Super Admin platform console; pricing and invoicing sit entirely outside the platform',
    hubContributes:
      "Owns the Worker-Shift meter's operational inputs and renders the tenant's read-only ledger view",
    sourceStatus: '[SoW Fact — §4.1.2, §4.11.5]',
    sourceRef: 'L25721',
  },
  {
    id: 'offline-sync-conflict-review',
    capability: 'Offline sync-conflict review panel',
    owningSurface: 'SURF-CC',
    owningSurfaceText: 'Client Command Center',
    hubContributes:
      'Audits every conflict event; holds the clock-skew threshold as a tenant setting',
    sourceStatus: '[SoW Fact — §4.1.2, §4.13.2]',
    sourceRef: 'L25722',
  },
  {
    id: 'custom-report-builder',
    capability:
      'Custom Report Builder user interface — rendering, saved formats, scheduling of the five standard report data sets',
    owningSurface: 'SURF-CC',
    owningSurfaceText: 'Client Command Center',
    hubContributes: 'Owns the data behind all five data sets and computes them',
    sourceStatus: '[SoW Fact — §4.1.2, §4.10.5]',
    sourceRef: 'L25723',
  },
  {
    id: 'qualification-clearance-granting',
    capability:
      'Qualification clearance granting, which is Client Command Center action number 10',
    owningSurface: 'SURF-CC',
    owningSurfaceText: 'Client Command Center',
    hubContributes:
      'Owns the clearance record and its enforcement; records grant, duration, reason, lapse',
    sourceStatus: '[SoW Fact — §4.1.2, §4.4.6]',
    sourceRef: 'L25724',
  },
  {
    id: 'workflow-and-instruction-authoring',
    capability:
      'Workflow and work-instruction authoring, versioning, republish classification, the Agent Builder',
    owningSurface: 'SURF-STU',
    owningSurfaceText: 'Standards and Operations Studio',
    hubContributes:
      'Holds the Job-to-workflow reference and the adoption decision routing to the Job Owner',
    sourceStatus: '[SoW Fact — §4.1.2, §4.5.3]',
    sourceRef: 'L25725',
  },
  {
    id: 'step-execution-and-capture',
    capability: 'Step execution, data capture, offline operation, device modes',
    owningSurface: 'SURF-FL',
    owningSurfaceText: 'Frontline Worker Application',
    hubContributes: 'Files every resulting capture event as the official record',
    sourceStatus: '[SoW Fact — §4.1.2, §4.1.1]',
    sourceRef: 'L25726',
  },
] as const satisfies readonly DohBoundaryRow[]

type MissingFromRegister = Exclude<DohBoundaryId, (typeof DOH_BOUNDARY_REGISTER)[number]['id']>
const _registerExhaustive: MissingFromRegister extends never ? true : never = true
void _registerExhaustive

const BY_ID = new Map<DohBoundaryId, DohBoundaryRow>(
  DOH_BOUNDARY_REGISTER.map((row) => [row.id, row]),
)

export function dohBoundaryById(id: DohBoundaryId): DohBoundaryRow {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown Delivery Operations Hub boundary: ${id}`)
  return found
}

/**
 * THE OTHER HALF OF THE SPLIT, KEPT HONEST BY A CHECK RATHER THAN BY HABIT.
 *
 * A seam claims a SCHEDULE — "owned by module X, slice N" — so every seam's
 * owner has to be a Hub module. A seam whose owner is a surface is not a
 * seam at all; it is a boundary register row wearing a seam's wording, and
 * `SeamNotice` would render "not built here, arrives in slice N" over an act
 * that is never going to be built here.
 *
 * Returns the ids of seams making that claim. Empty is the only healthy
 * answer, and `tests/unit/doh-boundary.test.ts` proves the check bites by
 * handing it a seam owned by the Client Command Center.
 */
const HUB_MODULE_ID = /^MOD-DOH-\d{2}$/

export function seamsClaimingAPermanentBoundary(
  seams: readonly { readonly id: string; readonly ownerModule: string }[],
): readonly string[] {
  return seams
    .filter((s) => !s.ownerModule.split('/').every((part) => HUB_MODULE_ID.test(part.trim())))
    .map((s) => s.id)
}

/* ==================================================================== *
 * THE GATE — no adjacent capability carries an inline control.
 * ==================================================================== */

/**
 * The shape this fold reads off a control-matrix row. Structural rather than
 * `DohControlMatrixRow`, because the six shipped Hub matrices key their cells
 * two different ways and slice 6's seven modules are not written yet; what
 * every one of them has is a classification and, where the row is one of the
 * eight, a pointer into the register.
 */
export interface AdjacentRow {
  readonly id: string
  readonly surface: MatrixRowSurface
  /**
   * The register row this capability is, or `undefined` where the row is
   * adjacent to something the register does not list (an outside system
   * calling in, the platform console's own device module). A pointer that
   * nothing reads is worse than no pointer — a reviewer reads it as a
   * verified fact — so `adjacentAffordance` reads this on every row, and
   * `inlineControlsOnAdjacentCapabilities` fails a row that carries one and
   * is not classified adjacent.
   */
  readonly boundary?: DohBoundaryId
}

export type AdjacentAffordance =
  /** Met on another surface. A statement and, where the pointer checks out, a link. Never a control. */
  | { readonly kind: 'cross-surface'; readonly boundary: DohBoundaryRow | null }
  /** This screen's own row. What it renders is the module's business, not this file's. */
  | { readonly kind: 'own-row' }

/**
 * THE GATE, as one fold: **the classification decides, not the token.**
 *
 * It is handed the token DELIBERATELY and ignores it. A fold that never saw
 * the token could not be shown to disregard it, and disregarding it is the
 * whole rule: four tasks on this build have been caught by a cell reading
 * `Allowed` that describes an act on another surface — MOD-DOH-08 row 7,
 * "Release a Severity 1 lot hold", reads `Allowed` for the Quality Manager
 * at L28307 and the act is Client Command Center action 4. A Hub screen that
 * folded that token into a button would ship a second release path for one
 * record.
 *
 * Note what this does NOT do: it does not correct, downgrade or hide the
 * token. The source says `Allowed` and the matrix goes on saying `Allowed`
 * on screen, with its own cell text and its own locator. What is refused is
 * the CONTROL, which is what AC-DOH-012-3 (L25767) asks for — "a Hub screen
 * that touches an adjacent capability renders a cross-surface link and no
 * inline editing affordance for that capability."
 */
export function adjacentAffordance(row: AdjacentRow, status: ControlStatus): AdjacentAffordance {
  void status
  if (row.surface !== 'another-surface') return { kind: 'own-row' }
  return { kind: 'cross-surface', boundary: row.boundary ? dohBoundaryById(row.boundary) : null }
}

/**
 * Every row on which an adjacent capability would carry an inline control.
 * Non-empty is the defect `TEST-DOH-012-3` (L25774) names: "Inspect every Hub
 * screen listed against the boundary register; assert no inline control
 * exists for an adjacent-owned capability."
 *
 * TWO DEFECT SHAPES, ONE ANSWER, because they are one defect from the
 * reader's chair:
 *
 * 1. an `another-surface` row the fold above would let through as a control;
 * 2. a row pointing at a register boundary and classified `screen` — the
 *    MISCLASSIFICATION, which is the shape that actually ships. Nobody
 *    writes `surface: 'another-surface'` and then draws a button on it; what
 *    happens is that the cell reads `Allowed`, the row gets classified by
 *    its token, and the button follows honestly from a wrong classification.
 *
 * A note on what this gate can prove TODAY: the six shipped slice-4 matrices
 * carry fourteen `another-surface` rows and not one of them holds a
 * permissive token, so shape 1 cannot fire on the current tree and the walk
 * over it passes vacuously. That is a fact about slice 4, not about the
 * gate: slice 6 is where a permissive token first lands on an adjacent row.
 * The teeth are therefore proved on constructed rows of exactly that shape
 * in `tests/unit/doh-boundary.test.ts`, and the walk over real fixtures is
 * kept so the day a module task writes one it is already wired.
 */
export function inlineControlsOnAdjacentCapabilities<Row extends AdjacentRow, Role extends string>(
  rows: readonly Row[],
  roles: readonly Role[],
  statusOf: (row: Row, role: Role) => ControlStatus,
): readonly string[] {
  const offenders: string[] = []
  for (const row of rows) {
    if (row.boundary !== undefined && row.surface !== 'another-surface') {
      offenders.push(
        `${row.id}: points at boundary \`${row.boundary}\` and is classified \`${row.surface}\``,
      )
      continue
    }
    if (row.surface !== 'another-surface') continue
    for (const role of roles) {
      if (adjacentAffordance(row, statusOf(row, role)).kind !== 'cross-surface') {
        offenders.push(`${row.id}: renders a control for ${role}`)
      }
    }
  }
  return offenders
}

/* ==================================================================== *
 * WHAT A CROSS-SURFACE STATEMENT SAYS, FOR ONE ROW AND ONE VIEWER.
 * ==================================================================== */

/**
 * Three states, and the third is not a shade of either other one.
 *
 * - `link` — the viewer's own role reaches the owning surface, so the
 *   statement carries the link AC-DOH-012-3 asks for.
 * - `statement` — it does not, so there is no link. Three of the eight rows
 *   are owned by the Super Admin platform console, which "has no
 *   tenant-visible interface" (L25707): a link there would point at a
 *   console this surface cannot reach. SB-DOH-003 renders exactly that case
 *   as a line rather than a control — "Tier and cap changes are administered
 *   by platform support" (L25757).
 * - `open-decision` — whether the role reaches the owning surface is an OPEN
 *   question the source refuses to answer, and drawing no link would assert
 *   the refusal it withholds. One pair is in this position: the Read-only
 *   Auditor and the Standards and Operations Studio, under DEC-AUDSTU-001
 *   (recorded in `@/routes/definitions`; AC-STU-157 L34674 forbids assuming
 *   either answer).
 */
export type CrossSurfaceLinkState = 'link' | 'statement' | 'open-decision'

export interface CrossSurfaceStatementModel {
  readonly boundary: DohBoundaryRow
  /** Registered name of the owning surface — never a bare `SURF-*`. */
  readonly owningSurfaceName: string
  readonly linkState: CrossSurfaceLinkState
  /** Set only on `link`. `SB-DOH-003`'s own wording, L25757. */
  readonly linkLabel: string | null
  readonly linkHref: string | null
  /** Why there is no link, or which decision is open. Never blank. */
  readonly note: string
}

/**
 * THE POINTER IS CHECKED, NEVER ASSERTED — slice 5's `routedTo` rule, read
 * off the registry that already answers it rather than derived a second
 * time. A cross-surface link is a routing pointer, and a reviewer reads a
 * routing pointer as a verified fact; so the link renders only where
 * `@/routes/definitions` actually admits this role to the target surface,
 * and a target the role cannot open collapses to the plain statement. That
 * is the same discipline `routedProhibitionApplies` applies on the Studio
 * surface: a pointer whose target does not permit the viewer changes
 * nothing on screen.
 */
export function crossSurfaceStatement(
  id: DohBoundaryId,
  viewerRole: RoleId,
): CrossSurfaceStatementModel {
  const boundary = dohBoundaryById(id)
  const owningSurfaceName = surfaceById(boundary.owningSurface).name
  const route = routeBySurface(boundary.owningSurface)
  const openDecision = routeOpenDecisionFor(boundary.owningSurface, viewerRole)
  const admits = routesForRole(viewerRole).some((r) => r.id === route.id)

  if (admits) {
    return {
      boundary,
      owningSurfaceName,
      linkState: 'link',
      linkLabel: `Open in the ${owningSurfaceName}`,
      linkHref: route.pathname,
      note: `Owned there, not here. The Delivery Operations Hub ${lowerFirst(boundary.hubContributes)}.`,
    }
  }
  if (openDecision !== null) {
    return {
      boundary,
      owningSurfaceName,
      linkState: 'open-decision',
      linkLabel: null,
      linkHref: null,
      note: `Whether your role opens the ${owningSurfaceName} is an open question: ${openDecision.decision}. No link is drawn and none is refused.`,
    }
  }
  return {
    boundary,
    owningSurfaceName,
    linkState: 'statement',
    linkLabel: null,
    linkHref: null,
    note: `The ${owningSurfaceName} is not a surface your role opens, so no link is drawn to it. The Delivery Operations Hub ${lowerFirst(boundary.hubContributes)}.`,
  }
}

/** The verbatim contribution cell reads as a sentence continuation, not a sentence. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

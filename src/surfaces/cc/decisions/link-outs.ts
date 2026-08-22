import type { RoleId } from '@/domain/roles'
import { surfaceById, type SurfaceId } from '@/domain/surfaces'
import { routeBySurface, routeOpenDecisionFor, routesForRole } from '@/routes/definitions'

/**
 * THE CELLS WHERE A FAITHFUL TRANSCRIPTION PRODUCES THE WRONG SCREEN.
 *
 * The Command Center owns no operational record. Twelve rows of its twelve
 * module matrices describe an act whose note, in the cell's own words, places
 * that act on another surface — and under the build's one rendering rule
 * every one of them draws something the source does not ask for.
 *
 * TWO SHAPES, FAILING IN OPPOSITE DIRECTIONS, which is why one of them was
 * invisible to the guard the Frontline surface already has.
 *
 * - Shape A: the token is `Explicitly prohibited` and the note names the
 *   owning surface. `src/ui/WriteControl.tsx` draws `explicitlyProhibited`
 *   at `BASE_ROLE` as a `ProhibitionNotice` with `kind: 'absent'` — a plain
 *   note where a control would be, and no link. So a correct transcription
 *   yields an empty cell in exactly the places the source spells out a
 *   destination. `FUNC-CC-0801-1-2` (L37781) states the affordance in the
 *   positive — "Link to the Standards and Operations Studio for switching,
 *   never switch here … Online: link rendered" — and `AC-CC-301` (L37802)
 *   generalises it: "No control on this panel switches, configures or fixes
 *   an agent; each such control is a link to the Standards and Operations
 *   Studio or the platform side."
 *
 * - Shape B: the token is permissive and the note still places the act
 *   elsewhere. `WriteControl` draws a live control, which is worse than an
 *   absence: it offers to perform, here, an act executed on another
 *   surface's record. `MOD-CC-02`'s manual-close row (L36459) ends "reached
 *   by a link from the drill" inside a cell that begins `Allowed with
 *   conditions`.
 *
 * ONE ROW IS BOTH SHAPES AT ONCE. `Reclassify severity` (L36845) reads
 * `Explicitly prohibited` in the Tenant Admin column with the destination in
 * the note, and `Allowed with conditions` in the Quality Manager column with
 * the same destination. One row, two columns, two wrong renderings, one
 * required affordance.
 *
 * TRANSCRIBED HEADER-KEYED, NEVER POSITIONALLY. All nine matrices these rows
 * come from carry the identical header — `| Capability on this module |
 * Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |`
 * — and that was checked per matrix rather than assumed from the first.
 *
 * WHAT THIS FILE IS NOT. It is not a claim that reclassifying severity is
 * forbidden outright. `AC-CC-221` (L37000) says "Severity displayed always
 * equals the on-device classification; no server-side or agent value
 * overrides it", which forbids the DISPLAY being overridden. L36845 permits
 * the Quality Manager to reclassify at review time on the Hub anomaly
 * record. Reading the acceptance criterion as a flat prohibition would erase
 * the link the matrix requires — the same defect, reached from the other
 * side.
 *
 * `MOD-CC-02` ALREADY CARRIES A LOCAL VERSION OF THIS for its own manual-
 * close row (`CC02_MANUAL_CLOSE_LINK` and `ManualCloseLink` in
 * `src/surfaces/cc/modules/cc-02/`). That module's file is another task's
 * path and is read here, never written. This is what it should have
 * consumed: its link is a bare `<a href>` over a href handed in, where the
 * pointer here is CHECKED against `@/routes/definitions` and collapses to a
 * statement when the viewer's role cannot open the destination.
 */

export type OwningSurface = Exclude<SurfaceId, 'SURF-CC'>

/** The header of all nine matrices, in the source's own order. */
export const CC_MATRIX_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type CcMatrixColumn = (typeof CC_MATRIX_COLUMNS)[number]

/** The two status tokens that appear on these rows, in the source's spelling. */
export const CC_LINK_OUT_TOKENS = [
  'Explicitly prohibited',
  'Allowed with conditions',
] as const satisfies readonly string[]

export type CcLinkOutToken = (typeof CC_LINK_OUT_TOKENS)[number]

/**
 * What the build's one rendering rule draws for that token, so the cost of
 * transcribing faithfully is on the record beside the transcription.
 */
export type WriteControlRendering = 'absent' | 'control'

/**
 * WHO OWNS THE ACT — and the second arm is the source declining to say.
 *
 * Three of these twelve notes name two candidate owners and pick neither:
 * "configurable defaults held platform-side and in tenant settings",
 * "Studio or platform action", "tenant configuration and Studio settings".
 * The ambiguous arm carries both and the model draws NO link for it, so
 * there is no code path anywhere that consults a candidate to build a
 * destination. A winner is not merely unmarked; it is unreachable.
 */
export type LinkOutOwner =
  | {
      readonly kind: 'named'
      readonly surface: OwningSurface
      /** The place on that surface, in the cell's own words. */
      readonly place: string
    }
  | {
      readonly kind: 'ambiguous'
      /** Both candidates, in the cell's own words. Neither is chosen. */
      readonly candidates: readonly [string, string]
    }

export interface CcLinkOutCell {
  readonly id: string
  readonly moduleId: string
  /** Column one of the row, verbatim. */
  readonly capability: string
  /** Header-keyed, never positional. */
  readonly column: CcMatrixColumn
  /**
   * THE WHOLE ROW, VERBATIM — not the cell.
   *
   * The cell is derived from it by `cellTextOf`, keyed on the header. Storing
   * the row rather than the cell costs nothing and buys two things: the
   * transcription gate compares a whole source line for equality instead of a
   * fragment, and the guard below can fall back to the row when a cell's own
   * words are silent about the owner. The second is not hypothetical — see
   * `cc-04-reclassify-severity-quality-manager`.
   */
  readonly rowText: string
  /** The row's own line in the frozen source. */
  readonly line: number
  readonly token: CcLinkOutToken
  readonly writeControlWouldDraw: WriteControlRendering
  readonly owner: LinkOutOwner
  /**
   * What the source requires be drawn.
   *
   * DELIBERATELY WIDER THAN THE VALUE EVERY ROW CARRIES. Typing this `'link'`
   * would make `linkOutsMisclassified` unreachable by construction — the
   * precise defect that left `controlsOnActsHeldElsewhere`'s second loop
   * green through a planted misclassification for a whole slice. A guard
   * whose offence is a type error is not a guard; it is a comment. The
   * misclassification stays CONSTRUCTIBLE so the guard can be seen going red.
   */
  readonly sourceRequires: 'link' | 'control' | 'absent'
}

export const CC_LINK_OUT_CELLS = [
  {
    id: 'cc-01-board-ranking',
    moduleId: 'MOD-CC-01',
    capability: 'Change what the board ranks or how it flags',
    column: 'Tenant Admin',
    rowText:
      '| Change what the board ranks or how it flags | Explicitly prohibited — configuration lives in the Standards and Operations Studio | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 36270,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: {
      kind: 'named',
      surface: 'SURF-STU',
      place: 'where the board configuration lives',
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-02-refresh-interval',
    moduleId: 'MOD-CC-02',
    capability: 'Configure the refresh interval',
    column: 'Tenant Admin',
    rowText:
      '| Configure the refresh interval | Explicitly prohibited — tenant settings live in the Delivery Operations Hub tenant administration area | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 36457,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the tenant administration area',
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-02-connectivity-thresholds',
    moduleId: 'MOD-CC-02',
    capability: 'Configure the connectivity-loss thresholds',
    column: 'Tenant Admin',
    rowText:
      '| Configure the connectivity-loss thresholds | Explicitly prohibited — configurable defaults held platform-side and in tenant settings | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 36458,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: {
      kind: 'ambiguous',
      candidates: ['held platform-side', 'in tenant settings'],
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-02-manual-close-supervisor',
    moduleId: 'MOD-CC-02',
    capability: 'Manually close a stuck run',
    column: 'Supervisor',
    rowText:
      '| Manually close a stuck run | Explicitly prohibited | Allowed with conditions — performed on the Delivery Operations Hub run record with a mandatory note, reached by a link from the drill | Allowed with conditions — same conditions | Explicitly prohibited | Explicitly prohibited |',
    line: 36459,
    token: 'Allowed with conditions',
    writeControlWouldDraw: 'control',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the run record, with a mandatory note',
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-04-reclassify-severity-tenant-admin',
    moduleId: 'MOD-CC-04',
    capability: 'Reclassify severity',
    column: 'Tenant Admin',
    rowText:
      '| Reclassify severity | Explicitly prohibited — reclassification is a review-time act on the Delivery Operations Hub anomaly record | Explicitly prohibited | Allowed with conditions — at review time on the anomaly record, with a recorded reason | Explicitly prohibited | Explicitly prohibited |',
    line: 36845,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the anomaly record, at review time',
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-04-reclassify-severity-quality-manager',
    moduleId: 'MOD-CC-04',
    capability: 'Reclassify severity',
    column: 'Quality Manager',
    rowText:
      '| Reclassify severity | Explicitly prohibited — reclassification is a review-time act on the Delivery Operations Hub anomaly record | Explicitly prohibited | Allowed with conditions — at review time on the anomaly record, with a recorded reason | Explicitly prohibited | Explicitly prohibited |',
    line: 36845,
    token: 'Allowed with conditions',
    writeControlWouldDraw: 'control',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the anomaly record, at review time, with a recorded reason',
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-05-gate-policy',
    moduleId: 'MOD-CC-05',
    capability: 'Change gate policy, approvers or timeouts',
    column: 'Tenant Admin',
    rowText:
      '| Change gate policy, approvers or timeouts | Explicitly prohibited — authored in the Standards and Operations Studio | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 37084,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'where gate policy is authored' },
    sourceRequires: 'link',
  },
  {
    id: 'cc-06-edit-configured-value',
    moduleId: 'MOD-CC-06',
    capability: 'Edit a configured value directly',
    column: 'Tenant Admin',
    rowText:
      '| Edit a configured value directly | Explicitly prohibited — authoring lives in the Standards and Operations Studio | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 37300,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'where authoring lives' },
    sourceRequires: 'link',
  },
  {
    id: 'cc-08-switch-agent',
    moduleId: 'MOD-CC-08',
    capability: 'Switch an agent on or off',
    column: 'Tenant Admin',
    rowText:
      '| Switch an agent on or off | Explicitly prohibited — a Standards and Operations Studio action, linked from here | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 37671,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'where an agent is switched' },
    sourceRequires: 'link',
  },
  {
    id: 'cc-08-reconfigure-agent',
    moduleId: 'MOD-CC-08',
    capability: 'Reconfigure or fix an agent',
    column: 'Tenant Admin',
    rowText:
      '| Reconfigure or fix an agent | Explicitly prohibited — Studio or platform action | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 37672,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: { kind: 'ambiguous', candidates: ['Studio', 'platform action'] },
    sourceRequires: 'link',
  },
  {
    id: 'cc-09-routing-timers-channels',
    moduleId: 'MOD-CC-09',
    capability: 'Change routing, timers or channels',
    column: 'Tenant Admin',
    rowText:
      '| Change routing, timers or channels | Explicitly prohibited — authored in the Standards and Operations Studio | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 37870,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'where routing is authored' },
    sourceRequires: 'link',
  },
  {
    id: 'cc-10-clock-skew-threshold',
    moduleId: 'MOD-CC-10',
    capability: 'Change the clock-skew threshold',
    column: 'Tenant Admin',
    rowText:
      '| Change the clock-skew threshold | Explicitly prohibited — a tenant setting in the Delivery Operations Hub tenant administration area | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 38091,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the tenant administration area',
    },
    sourceRequires: 'link',
  },
  {
    id: 'cc-12-agent-run-time',
    moduleId: 'MOD-CC-12',
    capability: "Configure the agent's run time or the grace period",
    column: 'Tenant Admin',
    rowText:
      '| Configure the agent\'s run time or the grace period | Explicitly prohibited — tenant configuration and Studio settings | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 38489,
    token: 'Explicitly prohibited',
    writeControlWouldDraw: 'absent',
    owner: { kind: 'ambiguous', candidates: ['tenant configuration', 'Studio settings'] },
    sourceRequires: 'link',
  },
] as const satisfies readonly CcLinkOutCell[]

/**
 * The names a cell's own words use for a surface that is not this one.
 * Derived from `SURFACES` so a rename cannot leave this list behind, plus
 * the two informal spellings the source actually uses for the platform side
 * — it writes "platform-side" and "platform action", never the console's
 * registered name.
 */
const OWNING_SURFACE_WORDS: readonly string[] = [
  surfaceById('SURF-DOH').name,
  surfaceById('SURF-STU').name,
  'Studio',
  'platform-side',
  'platform action',
  'tenant settings',
  'tenant configuration',
]

/**
 * THE GUARD, AND IT STARTS FROM THE CELL'S OWN WORDS.
 *
 * `controlsOnActsHeldElsewhere` in `src/frontline/matrix.ts` had a loop that
 * was unreachable by construction because it started from the classification
 * it was supposed to doubt, and a slice-7 module found it by planting a
 * misclassified row and watching it stay green. So this one never reads
 * `sourceRequires` to decide whether a link is required: it reads the cell
 * text, and a row whose words place the act elsewhere while the row says
 * anything other than `link` is the offence.
 *
 * WHAT IT CANNOT SEE, stated rather than implied: a cell that places an act
 * elsewhere WITHOUT naming a surface or a settings home. No rule over these
 * strings can catch that one, and this sentence is here so the next reader
 * does not mistake the function's silence for the case's absence.
 */
export function linkOutsMisclassified(
  cells: readonly CcLinkOutCell[],
): readonly string[] {
  const offenders: string[] = []
  for (const cell of cells) {
    const text = cellTextOf(cell)
    const inCell = OWNING_SURFACE_WORDS.find((w) => text.includes(w))
    const named = inCell ?? OWNING_SURFACE_WORDS.find((w) => cell.rowText.includes(w))
    if (named === undefined) {
      offenders.push(
        `${cell.id}: is registered as an act held elsewhere but neither its cell nor its row names another surface — "${text}"`,
      )
      continue
    }
    if (cell.sourceRequires !== 'link') {
      const where = inCell === undefined ? "that row's own words" : "that cell's own words"
      offenders.push(
        `${cell.id}: requires \`${cell.sourceRequires}\` while ${where} place the act on the ${named} — "${text}"`,
      )
    }
  }
  return offenders
}

/**
 * THE ONE CELL RESOLVED BY ITS ROW RATHER THAN BY ITSELF, named rather than
 * left for a reader to discover.
 *
 * `Reclassify severity`'s Quality Manager cell (L36845) reads "Allowed with
 * conditions — at review time on the anomaly record, with a recorded reason".
 * It names a RECORD and no surface. Which anomaly record is stated once on
 * that row, in the Tenant Admin cell beside it: "the Delivery Operations Hub
 * anomaly record". Resolving it from the row is still resolving it from the
 * source's own words, but it is a weaker resolution than the other twelve and
 * this is where that is said. The guard reports which one carried it.
 *
 * This is the case `controlsOnActsHeldElsewhere` says no rule over these
 * strings can catch. A rule over the ROW catches it. A rule over the row
 * still cannot catch a cell whose whole row is silent, and none of these is.
 */
export const RESOLVED_BY_ROW_NOT_CELL = [
  'cc-04-reclassify-severity-quality-manager',
] as const satisfies readonly string[]

/** The cell itself, split out of the row header-keyed. */
export function cellTextOf(cell: CcLinkOutCell): string {
  const cols = cell.rowText
    .split('|')
    .slice(2, -1)
    .map((c) => c.trim())
  return cols[CC_MATRIX_COLUMNS.indexOf(cell.column)] ?? ''
}

export type CcLinkState = 'link' | 'statement' | 'open-decision' | 'owner-undecided'

export interface CcLinkOutModel {
  readonly cell: CcLinkOutCell
  readonly linkState: CcLinkState
  readonly linkLabel: string | null
  readonly linkHref: string | null
  /** Why there is no link, or where it goes. Never blank. */
  readonly note: string
  readonly sourceRef: string
}

/**
 * THE POINTER IS CHECKED, NEVER ASSERTED — the same discipline
 * `frontlineCrossSurfaceModel` applies, re-derived over the same route
 * registry because that function is typed `Exclude<SurfaceId, 'SURF-FL'>`
 * and this surface is a place it points AT.
 *
 * The ambiguous arm never reaches a route lookup at all, so no destination
 * can be built from a candidate the source did not choose.
 */
export function ccLinkOutModel(cell: CcLinkOutCell, viewerRole: RoleId): CcLinkOutModel {
  const sourceRef = `${cell.moduleId} · ${cell.column} · L${cell.line}`

  if (cell.owner.kind === 'ambiguous') {
    const [a, b] = cell.owner.candidates
    return {
      cell,
      linkState: 'owner-undecided',
      linkLabel: null,
      linkHref: null,
      note:
        `Held off this surface. The cell names two owners — "${a}" and "${b}" — and chooses ` +
        `neither, so no link is drawn to either and no control is offered here.`,
      sourceRef,
    }
  }

  const owningSurfaceName = surfaceById(cell.owner.surface).name
  const route = routeBySurface(cell.owner.surface)
  const admits = routesForRole(viewerRole).some((r) => r.id === route.id)
  const open = routeOpenDecisionFor(cell.owner.surface, viewerRole)

  if (admits) {
    return {
      cell,
      linkState: 'link',
      linkLabel: `Open the ${owningSurfaceName}`,
      linkHref: route.pathname,
      note: `Owned there, not here — ${cell.owner.place}.`,
      sourceRef,
    }
  }
  if (open !== null) {
    return {
      cell,
      linkState: 'open-decision',
      linkLabel: null,
      linkHref: null,
      note:
        `Whether your role opens the ${owningSurfaceName} is an open question: ${open.decision}. ` +
        `No link is drawn and none is refused.`,
      sourceRef,
    }
  }
  return {
    cell,
    linkState: 'statement',
    linkLabel: null,
    linkHref: null,
    note:
      `Owned by the ${owningSurfaceName} — ${cell.owner.place} — which your role does not open, ` +
      `so no link is drawn to it. The act is not performed here in any case.`,
    sourceRef,
  }
}

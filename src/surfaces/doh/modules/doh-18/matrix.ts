import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import type { DohBoundaryId } from '@/surfaces/doh/boundary'
import type { DohControlMatrixRow } from '@/surfaces/doh/modules'

/**
 * `MOD-DOH-18` — Standard Report Data Sets (5), §19.20.
 *
 * ── THE SPANS, COUNTED RATHER THAN INFERRED FROM A SPAN ───────────────────
 * The data-set table: header L29882, separator L29883, **5 data rows**
 * L29884-L29888. The identity card: header L29900, separator L29901, **14
 * data rows** L29902-L29915. The control matrix: header L29919, separator
 * L29920, **8 data rows** L29921-L29928. The body stops there: the next line
 * is blank and the one after it opens the numbered happy path (L29930). The
 * brief gave the matrix as "around L29919-L29928", which is the table and not
 * its body. `tests/unit/doh-18.test.ts` reads the blank line rather than
 * citing it here — a citation of a blank line is what
 * `tests/coverage/locator-fidelity.test.ts` refuses, and it is right to.
 *
 * ── THIS MODULE HAS NO SCREEN, AND THE CATALOGUE SAYS SO BY OMISSION ──────
 * Catalogue B is 23 rows, L48095-L48117, and not one of them names
 * `MOD-DOH-18` in its "Modules and features shown" cell. The only row that
 * covers it covers it by range: `SCR-DOH-02`, Operations home, whose cell
 * reads "The module rail across MOD-DOH-01 to MOD-DOH-19" (L48096). So there
 * is no route, no `page.tsx` and no rail entry of its own — the same shape as
 * `MOD-DOH-15`, which catalogue B mounts inside `SCR-DOH-11` (L48105).
 *
 * The other half of the rendering is not this surface's at all. L29906: the
 * Hub "owns the data; the Client Command Center renders it", and `MOD-CC-11`
 * shipped that half at `app/command-center/reports-and-report-builder`.
 *
 * ── WHAT THE CLASSIFICATION DECIDES HERE, AND WHY IT IS NOT THE TOKEN ─────
 * FOUR of the eight rows are met on another surface, and only TWO of them say
 * so in the cell. That asymmetry is the whole reason this file classifies
 * rows instead of folding tokens:
 *
 * - Rows 3 and 7 name their other surface in the cell itself. L29923 gives
 *   the Tenant Admin `Allowed with conditions` — through the Client Command
 *   Center Builder, and the Quality Manager `Allowed with conditions` —
 *   through the Builder. L29927 gives the Tenant Admin `Allowed with
 *   conditions` — only through a composed reasoning agent built in the
 *   Standards and Operations Studio, and the Quality Manager the same
 *   condition.
 * - Rows 2 and 4 read a BARE `Allowed` for the same two actors and are the
 *   same boundary. L29880, whole line: the Hub "owns the data behind the five
 *   standard report data sets; rendering, layout, saved formats and scheduled
 *   delivery are Client Command Center capabilities through the Custom Report
 *   Builder." Row 2 is report formats and row 4 is a per-format option, so
 *   both are saved formats. The §19.1.2 register row says the same in its own
 *   capability cell — "Custom Report Builder user interface — rendering,
 *   saved formats, scheduling of the five standard report data sets" (L25723)
 *   — and `MOD-CC-11`'s matrix holds both acts on that surface for exactly
 *   these two actors: "Author a saved format" (L38292) and "Enable the
 *   re-send-on-material-correction option per format" (L38295).
 *
 *   That is this build's recorded trap shape: `MOD-DOH-08` row 8 reads
 *   `Allowed` for the Quality Manager and the act is Client Command Center
 *   action 4. A bare permissive token on a row this surface does not own is
 *   how a second write path for one record ships honestly.
 *
 * ── ONE ROW IS OFF-REGISTER, AND THE REASON IS THE CONTRIBUTION CELL ──────
 * Row 7's surface is `SURF-STU` and the register's Studio row does name the
 * Agent Builder in its capability cell (L25725). Its HUB-CONTRIBUTION cell
 * reads "Holds the Job-to-workflow reference and the adoption decision
 * routing to the Job Owner", and `CrossSurfaceStatement` prints that cell as
 * its note. Printing it under "Request a report beyond the five sets" would
 * put a statement about workflow adoption under a statement about report
 * composition — the same defect `MOD-DOH-19` declined for the same register
 * row. So row 7 carries no `boundary` and is rendered through
 * `CrossSurfaceStatement`'s off-register shape, which prints why.
 *
 * ── WHAT IS NOT A TRAP ON THIS CARD, STATED SO IT IS NOT LOOKED FOR ───────
 * Row 1 gives the Read-only Auditor `Read-only` and the act is "Query a
 * standard data set" — a read. That is `Read-only` on a read row, not
 * `MOD-DOH-10`'s `Read-only` on an action row. And no cell on this card
 * backticks a condition INSIDE the backticks, so `cellFromSource`'s
 * closing-backtick defect cannot reach these eight rows; nothing here calls
 * it, because this matrix is keyed on the five tenant roles.
 */

export type Doh18ControlId =
  | 'query-a-standard-data-set'
  | 'author-and-export-report-formats'
  | 'schedule-a-report-delivery'
  | 'enable-re-send-on-material-correction'
  | 'create-a-sixth-data-set'
  | 'deliver-a-report-into-a-tenant-system'
  | 'request-a-report-beyond-the-five-sets'
  | 'present-a-data-set-as-real-time'

export interface Doh18Row extends DohControlMatrixRow<Doh18ControlId> {
  /**
   * The §19.1.2 register row this act IS, where the register can carry it.
   *
   * OPTIONAL AND NOT REQUIRED-AND-NULLABLE, which is the one exception to this
   * build's convention on this shape: `AdjacentRow` declares it optional and
   * `inlineControlsOnAdjacentCapabilities` fails any row that carries one and
   * is not classified adjacent, so it is written only where it is true.
   *
   * Absent on an `another-surface` row is not an omission: it is the statement
   * that no register row can be printed over this act without printing a
   * contribution cell about something else. Row 7 is the only one, and
   * `offRegister` carries what a reader is told instead.
   */
  readonly boundary?: DohBoundaryId
  /**
   * Set on exactly the `another-surface` rows that carry no `boundary`: the
   * owning surface, the capability in the row's own words, and why the
   * register is not being borrowed. Printed, never implied.
   */
  readonly offRegister: {
    readonly capability: string
    readonly note: string
    readonly whyNotOnTheRegister: string
  } | null
}

/**
 * A refusal that this card states in five columns and qualifies in one. The
 * source's own qualification rides on the Tenant Admin cell; the other four
 * are the bare token, and `DohControlMatrixRow.detail` may not be blank
 * (L10238), so the qualification is repeated as the CAUSE rather than a cause
 * being invented per role.
 */
const prohibitedEverywhere = (
  cause: string,
): {
  status: Readonly<Record<TenantRoleId, 'explicitly-prohibited'>>
  detail: Readonly<Record<TenantRoleId, string>>
} => ({
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: cause,
    SUPERVISOR: cause,
    QUALITY_MANAGER: cause,
    READONLY_AUDITOR: cause,
    WORKER: cause,
  },
})

const NOT_THIS_SURFACE =
  'This act is met on the Client Command Center Builder, not here. The Hub owns the data and computes it.'

export const MOD_DOH_18_MATRIX = [
  {
    id: 'query-a-standard-data-set',
    control: 'Query a standard data set',
    surface: 'screen',
    offRegister: null,
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR: 'Allowed with conditions — own scope.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR:
        'Read-only. The act is a read, so the token and the act agree: the Auditor queries the set and writes nothing.',
      WORKER:
        'Unavailable. The Worker has no standing on the reporting module in any scope and is not offered it.',
    },
    rendering:
      'The only row this surface both owns and grants. Read-only here is STATE-06 over a read, which is what the source states.',
    effect:
      'The Hub computes the requested set against the date range and the requester’s scope and returns it with its data-as-of timestamp.',
    sourceRef: 'L29921',
  },
  {
    id: 'author-and-export-report-formats',
    control: 'Author and export report formats',
    // BARE `Allowed`, AND THE ACT IS THE BUILDER'S. See the header note.
    surface: 'another-surface',
    boundary: 'custom-report-builder',
    offRegister: null,
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: `Allowed. ${NOT_THIS_SURFACE}`,
      SUPERVISOR: 'Explicitly prohibited.',
      QUALITY_MANAGER: `Allowed. ${NOT_THIS_SURFACE}`,
      READONLY_AUDITOR: 'Explicitly prohibited.',
      WORKER: 'Explicitly prohibited.',
    },
    rendering:
      'No control. The token is permissive and the classification is what decides: saved formats are a Client Command Center capability, so this card states the boundary and draws nothing.',
    effect:
      'A saved format is authored in the Builder over the five Hub-owned sets and exported as Excel or comma-separated values.',
    sourceRef: 'L29922',
  },
  {
    id: 'schedule-a-report-delivery',
    control: 'Schedule a report delivery',
    surface: 'another-surface',
    boundary: 'custom-report-builder',
    offRegister: null,
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — through the Client Command Center Builder. The stated condition is another surface, so it is not a condition this screen can satisfy.',
      SUPERVISOR: 'Explicitly prohibited.',
      QUALITY_MANAGER:
        'Allowed with conditions — through the Builder. The stated condition is another surface, so it is not a condition this screen can satisfy.',
      READONLY_AUDITOR: 'Explicitly prohibited.',
      WORKER: 'Explicitly prohibited.',
    },
    rendering:
      'No control, and the cell says why in its own words. `MOD-CC-11` holds the act outright — "Configure a schedule and recipient set" is `Allowed` for the Tenant Admin and the Quality Manager and prohibited for the other three, which is this row’s two grants and its three refusals.',
    effect:
      'A saved format is delivered on a schedule to a recipient set, for example at 06:00 daily.',
    sourceRef: 'L29923, confirmed against L38294',
  },
  {
    id: 'enable-re-send-on-material-correction',
    control: 'Enable "re-send on material correction" per format',
    // BARE `Allowed`, AND PER FORMAT — so it is a saved-format option.
    surface: 'another-surface',
    boundary: 'custom-report-builder',
    offRegister: null,
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: `Allowed. ${NOT_THIS_SURFACE}`,
      SUPERVISOR: 'Explicitly prohibited.',
      QUALITY_MANAGER: `Allowed. ${NOT_THIS_SURFACE}`,
      READONLY_AUDITOR: 'Explicitly prohibited.',
      WORKER: 'Explicitly prohibited.',
    },
    rendering:
      'No control. The option is per format and a format lives in the Builder; `MOD-CC-11` carries the same act for the same two actors.',
    effect:
      'A materially corrected figure is re-sent immediately rather than waiting for the next scheduled delivery.',
    sourceRef: 'L29924, confirmed against L38295',
  },
  {
    id: 'create-a-sixth-data-set',
    control: 'Create a sixth data set or a new data domain',
    // EXISTS NOWHERE, so it is a `screen` row whose every cell refuses.
    surface: 'screen',
    offRegister: null,
    ...prohibitedEverywhere(
      'Explicitly prohibited — out of V1. The list is five and items may be swapped within it, never added to it.',
    ),
    rendering:
      'ABSENT with the reason printed where the control would be. No role holds this on any surface, so there is nowhere to point a reader.',
    effect: 'None. The count of five is settled.',
    sourceRef: 'L29925',
  },
  {
    id: 'deliver-a-report-into-a-tenant-system',
    control: 'Deliver a report into a tenant system',
    surface: 'screen',
    offRegister: null,
    ...prohibitedEverywhere(
      'Explicitly prohibited — outbound delivery is V2. No enterprise-resource-planning, business-intelligence or quality-management-system feed exists at V1.',
    ),
    rendering: 'ABSENT with the reason printed. The capability exists on no surface at V1.',
    effect: 'None.',
    sourceRef: 'L29926',
  },
  {
    id: 'request-a-report-beyond-the-five-sets',
    control: 'Request a report beyond the five sets',
    surface: 'another-surface',
    // No `boundary`: see the header note on the contribution cell.
    offRegister: {
      capability:
        'A report beyond the five standard sets, produced by a composed reasoning agent through the Agent Builder.',
      note: 'The stated condition is another surface. Reports beyond the five sets are produced by composed reasoning agents through the Agent Builder, which is authored in the Standards and Operations Studio.',
      whyNotOnTheRegister:
        'The §19.1.2 register’s Studio row names the Agent Builder among its capabilities, but its Hub-contribution cell speaks to the Job-to-workflow reference and the adoption decision routing to the Job Owner. Printing that cell over report composition would state a fact about workflow adoption where a reader is asking about reports, so this statement carries this row’s own words and no register row is borrowed.',
    },
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — only through a composed reasoning agent built in the Standards and Operations Studio.',
      SUPERVISOR: 'Explicitly prohibited.',
      QUALITY_MANAGER:
        'Allowed with conditions — same condition: only through a composed reasoning agent built in the Standards and Operations Studio.',
      READONLY_AUDITOR: 'Explicitly prohibited.',
      WORKER: 'Explicitly prohibited.',
    },
    rendering:
      'No control, and no register row borrowed. The off-register statement carries the row’s own words and prints why the register is not cited.',
    effect:
      'A composed reasoning agent, tier-gated to Growth and Enterprise, answers a question the five sets do not.',
    sourceRef: 'L29927',
  },
  {
    id: 'present-a-data-set-as-real-time',
    control: 'Present a data set as real-time',
    surface: 'screen',
    offRegister: null,
    ...prohibitedEverywhere(
      'Explicitly prohibited — every set carries a data-as-of timestamp. Reports are never presented as real-time.',
    ),
    rendering:
      'ABSENT, and the refusal is also an obligation on every other row: the as-of stamp renders wherever a set does.',
    effect: 'None. The as-of stamp is what makes the refusal visible rather than merely stated.',
    sourceRef: 'L29928',
  },
] as const satisfies readonly Doh18Row[]

/**
 * The eight ids as literals, declared OUTSIDE the array so a row deleted from
 * both the union and the array leaves something to notice it. A length check
 * would be satisfied by any eight rows at all.
 */
export const DOH_18_CONTROL_IDS = [
  'query-a-standard-data-set',
  'author-and-export-report-formats',
  'schedule-a-report-delivery',
  'enable-re-send-on-material-correction',
  'create-a-sixth-data-set',
  'deliver-a-report-into-a-tenant-system',
  'request-a-report-beyond-the-five-sets',
  'present-a-data-set-as-real-time',
] as const satisfies readonly Doh18ControlId[]

type MissingFromControlIds = Exclude<Doh18ControlId, (typeof DOH_18_CONTROL_IDS)[number]>
const _controlIdsExhaustive: MissingFromControlIds extends never ? true : never = true
void _controlIdsExhaustive

const BY_ID = new Map<Doh18ControlId, Doh18Row>(MOD_DOH_18_MATRIX.map((row) => [row.id, row]))

export function doh18Row(id: Doh18ControlId): Doh18Row {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown MOD-DOH-18 control: ${id}`)
  return found
}

/**
 * The module identity card's own fields, for the two the component prints as
 * claims rather than as decoration. Both are verbatim.
 */
export const MOD_DOH_18_CARD = {
  id: 'MOD-DOH-18',
  name: 'Standard Report Data Sets (5)',
  owningSurface:
    'Delivery Operations Hub (`SURF-DOH`) owns the data; the Client Command Center renders it.',
  objectsAffected: 'None — the data sets are computed projections.',
  /** L29911's four, verbatim and in the source's order. */
  states: ['computed', 'computing', 'stale_pending_recompute', 'corrected'],
  sourceRefs: {
    identity: 'L29902',
    name: 'L29903',
    owningSurface: 'L29906',
    objectsAffected: 'L29910',
    states: 'L29911',
  },
} as const

/**
 * NO `SCR-DOH-*` ROW NAMES THIS MODULE, and this is the record of that rather
 * than a note in a comment: the component prints it, so the abstention is
 * visible from outside instead of looking like an oversight.
 */
export const MOD_DOH_18_HAS_NO_SCREEN = {
  statement:
    'Catalogue B holds 23 screen rows and none of them names MOD-DOH-18 in its "Modules and features shown" cell. The one row that covers this module covers it by range — SCR-DOH-02, Operations home, "The module rail across MOD-DOH-01 to MOD-DOH-19". So this is a component with no screen of its own, the same shape as MOD-DOH-15, which catalogue B mounts inside the Job editor.',
  catalogueSpan: 'L48095-L48117',
  railRow: 'L48096',
  precedent: 'L48105',
  rendersElsewhere:
    'The rendering half is not this surface\'s: the Hub owns the data and the Client Command Center renders it, which MOD-CC-11 already ships.',
  rendersElsewhereRef: 'L29906',
} as const

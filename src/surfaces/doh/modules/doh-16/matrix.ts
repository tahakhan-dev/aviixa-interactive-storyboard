import { BARE_PROHIBITION, type DohControlMatrixRow } from '@/surfaces/doh/modules'
import { DEC_AREA_001_POSITION } from '@/surfaces/doh/modules/doh-05/matrix'

/**
 * `MOD-DOH-16` — Multi-Area Job Pairing. The card is L29592-L29607 and the
 * permission matrix is L29611-L29618.
 *
 * ── THE ROW COUNT, MEASURED ───────────────────────────────────────────────
 * The matrix span is eight lines: the header at L29611, the delimiter at
 * L29612, and SIX data rows at L29613-L29618. Six is what the plan claimed
 * and six is what the source carries, counted with the header correction
 * applied rather than inherited.
 *
 * ── `routedTo` IS ABSENT FROM THIS ROW SHAPE, AND THAT IS A DECISION ───────
 * Slice 5's rule, carried into the Hub by `doh-08/matrix.ts`: `routedTo`
 * names a capability **in this matrix** that a persona holds instead, and it
 * exists so a prohibition can point somewhere real. It is NOT Studio-only —
 * `Doh08Row` carries it — so its absence here is reasoned, not inherited.
 *
 * There is exactly one candidate on this card and it is rejected. Row 6
 * prohibits automated propagation "flagging only at V1", and the alternative
 * the source names is the human decision, which IS row 5 of this same
 * matrix — so the pointer would not be off-matrix, and it would not be on
 * another surface either. It fails on a third thing: **row 5's answer is not
 * a property of a role.** Every cell on it is conditioned on the Job's owner
 * field, so the target's verdict cannot be computed without naming a Job,
 * and a matrix-level pointer has no Job to name. For the Tenant Admin the
 * target does not even resolve to one answer — it resolves to the disclosed
 * contradiction below. A pointer whose target is a two-reading disclosure is
 * a pointer that cannot be checked, and an unchecked routing pointer reads
 * to a reviewer as a verified fact. So none is minted, and `./rendering`
 * has no `disabled` member for one to produce.
 *
 * ── DEC-AREA-001 IS CONSUMED, NOT RESTATED ────────────────────────────────
 * This module is Area-keyed throughout — rows 1, 2 and 3 all scope by Area —
 * and L29588 says so itself, calling this module "the direct consequence of
 * the one-parent-node-per-Job rule". The adopted position and its
 * consequence are `DEC_AREA_001_POSITION`, written once by the MOD-DOH-05
 * task and re-exported below rather than re-worded. Its consequence is what
 * `./pairing` implements: every Area-keyed rule resolves by WALKING UP the
 * node path from the Job's parent node, never by reading a stored Area.
 */

export type Doh16RowId =
  | 'create-a-pairing-between-two-jobs'
  | 'remove-a-pairing'
  | 'view-the-paired-scheduling-view'
  | 'receive-the-review-flag'
  | 'act-on-the-review-flag'
  | 'cause-automated-propagation-across-the-link'

export interface Doh16Row extends DohControlMatrixRow<Doh16RowId> {
  /**
   * Set where a PERMISSIVE token names something this screen carries no
   * control for, with the reason. Row 4 is the only one: `FUNC-DOH-16-2.1.1`
   * (L29658) states the roles allowed as "none — automatic; the Owner acts",
   * so receipt is not an act anybody performs and no button can exist for
   * it. Null everywhere else, so the field cannot become a general override.
   */
  readonly noControlHere: string | null
  /**
   * Set where the capability the row names DOES NOT EXIST, with the line the
   * screen prints where a control would sit. Row 6 is the only one.
   */
  readonly absence: string | null
}

/** Rows 4 and 5 read the Job's owner field, which is per Job and per identity. */
export const OWNER_CONDITIONED_ROW_IDS = [
  'receive-the-review-flag',
  'act-on-the-review-flag',
] as const satisfies readonly Doh16RowId[]

const SCOPE_OVER_BOTH =
  'The two paired Jobs keep separate bindings and separate scopes; pairing merges neither (L29606). Scope resolves from each Job’s parent node by walking up to its Area, per the adopted position of DEC-AREA-001.'

/**
 * THE SIX ROWS, L29613-L29618. Every cell is the source's own token and its
 * own qualifying words; `detail` never invents a cause the source withheld.
 */
export const CONTROL_MATRIX = [
  {
    // Row 1 — L29613.
    id: 'create-a-pairing-between-two-jobs',
    control: 'Create a pairing between two Jobs',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed. The write is the optional linked-Job reference on both Jobs (L29623); neither Job’s own binding, scope or approval changes.',
      SUPERVISOR: `Allowed with conditions — must hold scope over both Jobs. ${SCOPE_OVER_BOTH}`,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    noControlHere: null,
    absence: null,
    rendering:
      'A control for the Tenant Admin, and for a Supervisor holding scope over BOTH Jobs. A Supervisor holding scope over only one renders no control and the reason names the Job that is out of scope — never a disabled control, because the refusal is about a specific Job rather than about the person.',
    effect:
      'Writes the optional linked-Job reference on each of the two Jobs. Audited on both, because it is a configuration change on both (L29677).',
    sourceRef: 'L29613; FUNC-DOH-16-1.1.1 at L29653',
  },
  {
    // Row 2 — L29614. The same cells as row 1 with the Supervisor's condition
    // written shorter; the source's own shortening is reproduced, not tidied.
    id: 'remove-a-pairing',
    control: 'Remove a pairing',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed. Unpairing removes the reference from both Jobs and is audited on both (L29629).',
      SUPERVISOR: `Allowed with conditions — scope over both Jobs. ${SCOPE_OVER_BOTH}`,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    noControlHere: null,
    absence: null,
    rendering:
      'As row 1. The two rows are the same act in two directions and are deliberately not merged: the source states them as two rows and a merged control would answer a question the matrix asks twice.',
    effect:
      'Removes the reference from both Jobs. Audited on both. No run, assignment or approval on either Job is touched.',
    sourceRef: 'L29614; L29629',
  },
  {
    // Row 3 — L29615. The only row carrying `Unavailable`, and so the only
    // row that decides reach.
    id: 'view-the-paired-scheduling-view',
    control: 'View the paired scheduling view',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed. Both lanes render in full.',
      SUPERVISOR:
        'Allowed with conditions — own scope; a paired Job outside scope renders as a scope-limited placeholder naming only its existence. The placeholder is the security boundary, not a courtesy: L29679 states that pairing grants no scope, and L29629 that pairing therefore cannot become a scope-leak path.',
      QUALITY_MANAGER: 'Allowed. Both lanes render in full.',
      READONLY_AUDITOR:
        'Read-only. The view renders and no write path exists anywhere on it, which is STATE-06 rather than a refusal the Auditor meets on a control.',
      WORKER:
        'Unavailable. The withholding token: no standing on this module in any scope. Pairing is a Hub scheduling construct with no device counterpart (L29662), so this is not a capability met elsewhere on the worker’s tablet.',
    },
    noControlHere: null,
    absence: null,
    rendering:
      'The view itself, with a per-lane scope check. An out-of-scope lane renders the placeholder text the storyboard specifies and nothing else about that Job — never its name, its state or its runs.',
    effect: 'A read. Nothing on either Job changes.',
    sourceRef: 'L29615; SB-DOH-028 at L29681',
  },
  {
    // Row 4 — L29616. HALF ONE OF THE C1 CONTRADICTION. The Tenant Admin cell
    // is the lone `Not applicable` on a row whose two neighbouring columns
    // carry the SAME conditional form row 5 gives the Tenant Admin.
    id: 'receive-the-review-flag',
    control: 'Receive the review flag',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'not-applicable',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Not applicable — the flag routes to the paired Job’s Owner. This build does not settle this cell against row 5 and renders both; see the disclosure this module consumes from the Job-Owner predicate.',
      SUPERVISOR:
        'Allowed with conditions — where the Supervisor is the paired Job’s Owner. Owner is the value of the Job’s owner field, read per Job, never a role.',
      QUALITY_MANAGER:
        'Allowed with conditions — where the Quality Manager is the paired Job’s Owner. Owner is the value of the Job’s owner field, read per Job, never a role.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    noControlHere:
      'Receipt is not an act anybody performs: FUNC-DOH-16-2.1.1 (L29658) states the roles allowed as none, the flag being raised automatically and the Owner acting afterwards. So this screen carries no receive control for any persona, and what renders instead is the flag chip the storyboard specifies plus the line naming who the flag routed to.',
    absence: null,
    rendering:
      'The flag chip from SB-DOH-028, which is a state and not a control. For the Tenant Admin the row renders as a two-reading disclosure instead of a single answer, because the source answers this column twice.',
    effect:
      'None. Receipt is the routing of NOTIF-DOH-16-1 and NOTIF-DOH-16-2 (L29674, L29675) plus the flag’s persistent presence on the Job record, which L29685 makes reachable without any notification at all.',
    sourceRef: 'L29616',
  },
  {
    // Row 5 — L29617. HALF TWO OF THE C1 CONTRADICTION.
    id: 'act-on-the-review-flag',
    control: 'Act on the review flag',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — where the Tenant Admin is the paired Job’s Owner. This cell is the one that makes row 4’s stated reason incoherent, and both are rendered rather than averaged.',
      SUPERVISOR:
        'Allowed with conditions — same condition. The Supervisor must be the value of the paired Job’s owner field.',
      QUALITY_MANAGER:
        'Allowed with conditions — same condition. The Quality Manager must be the value of the paired Job’s owner field.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    noControlHere: null,
    absence: null,
    rendering:
      'A control ONLY where the Job’s owner field names this viewer. Where it does not, no control renders and the reason names the owner field — which is the same answer the kernel gives, where `DOH_ACT_ON_PAIRED_REVIEW_FLAG` narrows its allowed roles to the EMPTY LIST rather than adding an owner role.',
    effect:
      'The Owner’s decision on the paired Job. Audited (L29677). Nothing propagates to the partner Job.',
    sourceRef: 'L29617',
  },
  {
    // Row 6 — L29618. Prohibited in all five columns, and the capability does
    // not exist anywhere.
    id: 'cause-automated-propagation-across-the-link',
    control: 'Cause automated propagation across the link',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: 'Explicitly prohibited — flagging only at V1.',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    noControlHere: null,
    absence:
      'No control exists here for anybody, enabled or disabled. TEST-DOH-16-D3 (L29705) asks that an attempt to configure automatic propagation assert that no such capability exists, and L29647 states the rule the diagram encodes: there is no arrow from the flag back into either Job’s state. A disabled toggle would tell a reader the capability exists and is merely refused.',
    rendering:
      'A stated line where the control would sit, in every persona including the Tenant Admin, whose cell is the only one carrying a cause.',
    effect: 'None. There is no command in the Hub command set that could produce one.',
    sourceRef: 'L29618; L29647; TEST-DOH-16-D3 at L29705',
  },
] as const satisfies readonly Doh16Row[]

type MissingFromMatrix = Exclude<Doh16RowId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * SIX, ASSERTED AT COMPILE TIME rather than counted by a reader. The plan
 * that commissioned this module claimed six and was right; a seventh row
 * appended here without the header correction being re-applied would pass
 * every runtime test and fail this line.
 */
type SixRows = (typeof CONTROL_MATRIX)['length'] extends 6 ? true : never
const _sixRows: SixRows = true
void _sixRows

const ROW_BY_ID = new Map<Doh16RowId, Doh16Row>(CONTROL_MATRIX.map((r) => [r.id, r]))

export function doh16Row(id: Doh16RowId): Doh16Row {
  const found = ROW_BY_ID.get(id)
  if (!found) throw new Error(`Unknown MOD-DOH-16 control: ${id}`)
  return found
}

/* ==================================================================== *
 * CATALOGUE A'S "PRIMARY ROLE", AND WHY IT IS NOT A SIXTH ROLE
 * ==================================================================== */

/**
 * Catalogue A gives the paired scheduling view a Primary role of "Supervisor
 * and Job Owner" (L26074, named by locator because that row's identifier is
 * a three-digit literal this codebase forbids).
 *
 * READ AS A ROLE LIST IT MINTS A SIXTH TENANT ROLE, and the source closes
 * that reading three times in three Parts: L27652, L7151 and L16282 all say
 * Job Owner is a field on the Job record and not a role, and L27652 adds
 * that it "confers no permissions". A sixth role given reach would carry
 * permissions over every Job at once, which is the escalation.
 *
 * NO OWNER-ROLE TOKEN IS WRITTEN ANYWHERE IN THIS MODULE, and no guard
 * forbids one either — the question is not typeable. `jobOwnerVerdict` in
 * `@/surfaces/doh/job-owner` requires a `jobId`, so "is X a Job Owner?" has
 * no signature to be asked through and only "is X the owner of THIS Job?"
 * can be written. `./rendering` reaches that predicate for rows 4 and 5 and
 * for nothing else, and the kernel side is already built: the
 * `DOH_ACT_ON_PAIRED_REVIEW_FLAG` spec in `@/surfaces/doh/objects` hands
 * `evaluateAccess` the EMPTY ROLE LIST when the owner field does not name
 * the actor, rather than an owner role that would have to be granted.
 *
 * WHAT CATALOGUE A IS ACTUALLY SAYING is that this screen has two audiences:
 * the Supervisor who schedules, and whoever the two Jobs' owner fields name.
 * The second is a per-record audience, not a role, and that is exactly why
 * it cannot be spelled as a column.
 */
export const CATALOGUE_A_PRIMARY_ROLE = {
  cell: 'Supervisor and Job Owner',
  readAsRoleList: 'Mints a sixth tenant role and opens a privilege-escalation path.',
  readAsAudiences:
    'Names the two audiences of one screen — the Supervisor who schedules, and the identity each Job’s owner field happens to name. This is the reading adopted, and it is the only one the source’s three statements permit.',
  closedBy: 'L27652; L7151; L16282',
  sourceRef: 'L26074 — catalogue A, named by locator; its identifier is a banned three-digit literal',
} as const

/* ==================================================================== *
 * WHAT THIS SCREEN DELIBERATELY DOES NOT DRAW
 * ==================================================================== */

/**
 * The wave-1 deferral ruling, applied: a deferred or non-existent capability
 * renders as NO CONTROL plus a stated line where it would sit — never a
 * disabled control, never an empty space. `Doh16Affordance` in `./rendering`
 * has no `disabled` member, so the ruling is a shape rather than a habit.
 *
 * ONE OF THESE IS NOT A DEFERRAL AND SAYING SO MATTERS. Row 6's own cell
 * reads "flagging only at V1", which sounds like a roadmap position — but
 * the out-of-V1 register is twenty rows at L25876-L25895 plus three prose
 * deferrals at L25897, and cross-link propagation is on neither list.
 * Rendering it as deferred would set a roadmap expectation the register does
 * not carry, which is the same finding MOD-DOH-07 recorded about its own
 * row 6.
 */
export interface Doh16AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'A cross-link propagation setting, enabled or disabled',
    note: 'Prohibited in all five columns (L29618) and absent from the out-of-V1 register at L25876-L25895 and from the three further deferrals at L25897, so it is a capability that exists nowhere rather than one scheduled for later. TEST-DOH-16-D3 (L29705) asks for exactly this assertion.',
  },
  {
    label: 'A receive-the-flag control',
    note: 'FUNC-DOH-16-2.1.1 (L29658) states the roles allowed as none: the flag is raised automatically and the Owner acts afterwards. Receipt has no actor, so no persona can be offered a control for it.',
  },
  {
    label: 'A device counterpart for pairing',
    note: 'L29662 states offline behaviour on the Frontline tablet as not applicable, pairing being a Hub scheduling construct with no device counterpart. The Worker’s Unavailable cell on row 3 is therefore not a capability met elsewhere.',
  },
  {
    label: 'Any content of an out-of-scope paired Job',
    note: 'AC-DOH-16-4 (L29694) permits a viewer without scope over a partner to see only a placeholder. The placeholder names existence and nothing else — not the Job’s name, its state, its runs or its owner.',
  },
] as const satisfies readonly Doh16AbsentByRule[]

/* ==================================================================== *
 * WHAT THE SOURCE DOES NOT SETTLE
 * ==================================================================== */

export const UNRESOLVED_IN_SOURCE = [
  'Rows 4 and 5 answer the Tenant Admin column twice and the two answers cannot both hold. Row 4 (L29616) says the flag is Not applicable because it routes to the paired Job’s Owner, while row 5 (L29617) says a Tenant Admin may act on that flag where the Tenant Admin IS that Owner. Row 4’s Supervisor and Quality Manager cells carry the SAME conditional form row 5 gives the Tenant Admin, so the Not applicable is a lone outlier whose stated reason only holds if the paired Job’s Owner is a different party — the sixth-role reading the source closes. This build renders both cells and settles neither.',
  'Catalogue A gives this view a Primary role of Supervisor and Job Owner (L26074) while Job Owner is a field on the Job record and not a role (L27652, L7151, L16282). Read as two audiences the two statements agree; read as a role list they cannot. The audiences reading is adopted and the cell is quoted beside it.',
  'The Hub command set holds twelve commands and none of them pairs or unpairs two Jobs, although the card names FB-DOH-WRITE-002 for the pairing act (L29607) and rows 1 and 2 are both writes. Only DOH_ACT_ON_PAIRED_REVIEW_FLAG exists for this module. This module does not mint a thirteenth command; the gap is recorded and reported upward.',
  'Catalogue B gives no row to the paired scheduling view, so this route registers an uncatalogued storyboard name and mints no screen identifier. It is not true that catalogue B ignores this module altogether: L48105 mounts MOD-DOH-16 inside the Job editor row alongside MOD-DOH-15. What catalogue B lacks is a row for the VIEW, and catalogue B gives that Job editor row to the Supervisor alone while row 1 of this matrix gives the Tenant Admin an unconditional grant.',
  'What material change means. L29586 and L29674 both trigger the flag on a Job being materially changed and neither defines the threshold. This module raises flags from seeded events and computes no materiality of its own.',
  'Whether a Job may be paired to more than one other Job. The source describes the link in the singular throughout and states no limit, so none is enforced and none is implied on screen.',
] as const satisfies readonly string[]

/**
 * `DEC-AREA-001` re-exported rather than re-worded. The MOD-DOH-05 task owns
 * the record; this module consumes it, and a second copy would be a second
 * place its classification could be downgraded from adopted working position
 * to `SoW Fact`.
 */
export { DEC_AREA_001_POSITION }

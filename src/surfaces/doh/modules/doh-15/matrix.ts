import type { RoleId } from '@/domain/roles'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { evaluateAccess } from '@/policy/evaluate'
import type { AccessContext } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import {
  BARE_PROHIBITION,
  cellStatus,
  rolesReachingByMatrix,
  type ControlStatus,
  type DohControlMatrixRow,
} from '@/surfaces/doh/modules'
import { DEFERRAL_RENDERING } from '@/surfaces/doh/modules/doh-06/matrix'
import { contextFor } from '@/surfaces/doh/modules/doh-05/access'
import { type Doh05Escape } from '@/surfaces/doh/modules/doh-05/matrix'
import { writeAllowed, writeClassNote, type TenantWriteState } from '@/surfaces/doh/tenant-state'

/**
 * `MOD-DOH-15` — Job Cloning. Card L29456-L29471, matrix L29475-L29482.
 *
 * ── SIX DATA ROWS, MEASURED ───────────────────────────────────────────────
 * L29475 is the table HEADER and L29476 the separator, so the span
 * L29475-L29482 encloses six data rows at L29477-L29482. Six is what the
 * brief said and six is what the lines hold; the header correction does not
 * move it.
 *
 * ── NO SCREEN OF ITS OWN, AND THAT IS THE WHOLE SHAPE OF THIS MODULE ──────
 * Catalogue B carries no `SCR-DOH-*` row for `MOD-DOH-15`. It is MOUNTED, by
 * L48105's "Modules and features shown" cell, inside `SCR-DOH-11` the Job
 * editor — which `@/surfaces/doh/screens` already records as that row's
 * `alsoShows`. So this module is a component plus a one-line mount and no
 * route, and `src/surfaces/doh/modules.ts` registers it in a later pass.
 * Reach is therefore derived HERE, from this module's own matrix, by the
 * shared rule — never hand-written and never read off catalogue B's cell.
 *
 * ── THE ORDER OF THE QUESTIONS IS THE RULE ────────────────────────────────
 * 1. **Classification.** Is the row this module's own screen's at all? Row 3
 *    is not: approving a clone is `MOD-DOH-05` row 4 (L27697), met on
 *    `SCR-DOH-12` (L48106). Asked FIRST, before any token is read.
 * 2. **The no-Hub-screen rule.** D11, read out of the route registry rather
 *    than restated: a persona the registry admits to no Hub route meets its
 *    cells somewhere else or not at all.
 * 3. **No control here.** Rows 4, 5 and 6 name no capability anybody could
 *    hold, and row 2's prompt does not exist on a non-recurring source.
 * 4. **Only then, the token.**
 *
 * ── NO `routedTo` ON THIS CARD ────────────────────────────────────────────
 * `routedTo[column]` names a capability **in this matrix** that the persona
 * holds instead. No cell of this card names one: row 3's alternative is off
 * this matrix entirely (it is `MOD-DOH-05` row 4 on another screen), and
 * rows 4-6 have no alternative at all — they are the negative statement of a
 * reset. So no pointer is minted, and none is needed.
 *
 * A NOTE ON THE BRIEF, which said "`routedTo` is Studio-only". It is not:
 * `Doh08Row.routedTo` is a Hub field and `doh08RoutedPointers` walks it
 * (`../doh-08/matrix.ts`, `../doh-08/rendering.ts`). The INSTRUCTION is
 * still right for this module — no row of this card carries an alternative
 * in this matrix — but the premise it was given on is wrong, and a later
 * module told "there is no Hub `routedTo`" would go looking for one and
 * find the opposite.
 *
 * ── NO CROSS-SURFACE STATEMENT EITHER ─────────────────────────────────────
 * A cross-surface component crosses a SURFACE. Row 3's alternative is a
 * screen of THIS surface, so `@/ui/doh/CrossSurfaceStatement` and the
 * eight-row §19.1.2 register are both the wrong shape. `MOD-DOH-05` row 8
 * already settled the identical question for the identical reason: its row
 * for the tag-to-qualification-set mapping (L27701) is met in the tenant
 * administration area, a screen of this same surface, and it deliberately
 * carries no `boundary` pointer because the eight-row register is
 * cross-SURFACE. See the comment on that row in `../doh-05/matrix.ts`.
 *
 * ── JOB OWNERSHIP ─────────────────────────────────────────────────────────
 * Cloning writes a Job, and a Job carries an owner field. The predicate in
 * `@/surfaces/doh/job-owner` is the only thing that reads it, and this
 * module adds no sixth role and no `JOB_OWNER` token. It also adds no
 * `CLONING_IDENTITY` token: see `MOD_DOH_15_UNSPECIFIED_IN_SOURCE` entry 2,
 * where `FUNC-DOH-15-2.1.1` names "the cloning identity" as a role and it is
 * not one.
 */

/* ==================================================================== *
 * THE SIX ROWS
 * ==================================================================== */

export type Doh15RowId =
  | 'clone-a-job'
  | 'answer-the-recurrence-prompt'
  | 'approve-the-cloned-job'
  | 'clone-a-job-into-an-active-state-directly'
  | 'carry-the-source-jobs-approval-forward'
  | 'carry-the-source-jobs-recurrence-forward-silently'

/**
 * `act` — a capability somebody could hold, which becomes a control where
 * this screen carries one.
 * `restatement` — a row that states, negatively, something another part of
 * the card already settled. It names no capability and yields no control,
 * not even a disabled one.
 */
export type Doh15RowKind = 'act' | 'restatement'

export interface Doh15Row extends DohControlMatrixRow<Doh15RowId> {
  /** 1-based, as the source's table reads top to bottom. */
  readonly ordinal: number
  readonly kind: Doh15RowKind
  /** Set on a `restatement`: the sentence of the card it restates. */
  readonly restates: string | null
  /** Set where a prohibition token carries its own permissive escape. */
  readonly escape: Doh05Escape | null
  /** Set on a row met elsewhere: where, in the source's own terms. */
  readonly metInstead: string | null
}

type Cell = readonly [ControlStatus, string]

const PROHIBITED: Cell = ['explicitly-prohibited', BARE_PROHIBITION]

function cells(
  admin: Cell,
  supervisor: Cell,
  quality: Cell,
  auditor: Cell,
  worker: Cell,
): {
  status: Readonly<Record<TenantRoleId, ControlStatus>>
  detail: Readonly<Record<TenantRoleId, string>>
} {
  return {
    status: {
      TENANT_ADMIN: admin[0],
      SUPERVISOR: supervisor[0],
      QUALITY_MANAGER: quality[0],
      READONLY_AUDITOR: auditor[0],
      WORKER: worker[0],
    },
    detail: {
      TENANT_ADMIN: admin[1],
      SUPERVISOR: supervisor[1],
      QUALITY_MANAGER: quality[1],
      READONLY_AUDITOR: auditor[1],
      WORKER: worker[1],
    },
  }
}

/**
 * ROW 3's TENANT ADMIN CELL — a prohibition token with a permissive half
 * inside it, and this build asserts neither half.
 *
 * L29479: "`Explicitly prohibited` unless holding an approver role and not
 * the cloner". It is the same rule `MOD-DOH-05` row 4 carries at L27697 in
 * different words, so it reuses that module's `Doh05Escape` SHAPE rather
 * than inventing a second one — and the shape's `representable: false` is
 * the honest answer here for the identical reason: the clause turns on one
 * identity holding two tenant roles at once, and
 * `IdentitySimulationState.role` is singular.
 */
export const MOD_DOH_15_ESCAPE: Doh05Escape = {
  role: 'TENANT_ADMIN',
  clause: 'unless holding an approver role and not the cloner',
  representable: false,
  whyNot:
    'The escape turns on one identity holding two tenant roles at once, and `IdentitySimulationState.role` is a single role, so no persona in this build can reach the permitted side of it. Asserting the prohibition alone deletes the clause; asserting the escape alone hands a Tenant Admin the approval of a clone. Neither is asserted: no control is drawn on this panel for this row at all — the row is met on the approval queue — and the clause is printed.',
  sourceRef:
    'L29479; the same rule in MOD-DOH-05 row 4 at L27697; the card`s own Security line at L29470',
}

/**
 * The six rows, L29477-L29482, in source order.
 *
 * `detail` is the source's own cell text wherever the source qualifies the
 * token, and the shared `BARE_PROHIBITION` wording wherever it states the
 * bare token and qualifies it nowhere. Nineteen of this card's thirty cells
 * are bare.
 */
export const MOD_DOH_15_MATRIX = [
  {
    id: 'clone-a-job',
    ordinal: 1,
    control: 'Clone a Job',
    surface: 'screen',
    kind: 'act',
    restates: null,
    escape: null,
    metInstead: null,
    ...cells(
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — blocked in every suspension state as new-Job creation',
      ],
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — own Area scope; blocked in suspension',
      ],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'The Clone control in the clone dialogue (`SB-DOH-027`, L29547). Both grants name suspension as their own condition, and that condition is the EXISTING write-class table — cloning IS new-Job creation, in the Tenant Admin cell`s own words, so the gate is `writeAllowed(state, "create-job")` and not a second suspension rule written here.',
    effect:
      'A new Job in `draft` carrying the six copied elements, with the name, the state and the recurrence reset.',
    sourceRef: 'L29477',
  },
  {
    id: 'answer-the-recurrence-prompt',
    ordinal: 2,
    control: 'Answer the recurrence prompt',
    surface: 'screen',
    kind: 'act',
    restates: null,
    escape: null,
    metInstead: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'The recurrence selector inline in the dialogue, drawn ONLY where the source Job was recurring. The Tenant Admin cell is unconditional `Allowed` for an act that cannot occur unless row 1 succeeded first and unless the source recurs (L29494), so the token is printed with both conditions named beside it rather than rendered as an unconditional control.',
    effect:
      'The clone`s recurrence, set at clone time. Unanswered, the reset stands and the clone is one-off.',
    sourceRef: 'L29478',
  },
  {
    id: 'approve-the-cloned-job',
    ordinal: 3,
    control: 'Approve the cloned Job',
    // MET ON ANOTHER SCREEN OF THIS SAME SURFACE, NOT HERE. The
    // classification decides what is drawn; the token does not. Classified
    // BEFORE the Quality Manager's permissive token is read — read the token
    // first and this module acquires a Quality Manager it never had.
    surface: 'another-surface',
    kind: 'act',
    restates: null,
    escape: MOD_DOH_15_ESCAPE,
    metInstead:
      '`MOD-DOH-05` row 4 (L27697), drawn on `SCR-DOH-12` the Job approval queue (L48106). A clone is a Job and follows `MOD-DOH-05` in full — the card says so on its own Interconnections line (L29469).',
    ...cells(
      [
        'explicitly-prohibited',
        '`Explicitly prohibited` unless holding an approver role and not the cloner',
      ],
      PROHIBITED,
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — never where the same identity created the clone',
      ],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A statement naming where the clone is approved, and no control of any kind — not even a disabled one. Drawing an Approve control here would give one governed act two entry points on two routes, which the Job editor already refuses to do for `MOD-DOH-05` row 4 itself. No `boundary` pointer and no cross-surface statement: the target is a screen of THIS surface.',
    effect:
      'None here. The clone`s `pending_approval` → `active` transition is `MOD-DOH-05` row 4`s, taken by a second identity through the evaluator`s existing maker-checker.',
    sourceRef: 'L29479',
  },
  {
    id: 'clone-a-job-into-an-active-state-directly',
    ordinal: 4,
    control: 'Clone a Job into an `active` state directly',
    // `screen`, and every cell refuses: the reservation in
    // `@/surfaces/doh/modules` is explicit that a capability existing
    // NOWHERE is a `screen` row whose every cell refuses, never
    // `another-surface`. Nobody, on any surface, holds this.
    surface: 'screen',
    kind: 'restatement',
    restates:
      'The reset stated at L29452 and L29488 — the clone`s state is set to `draft` — and the diagram`s own reading at L29513: "no path exists from cloning to an active Job without a second person’s approval".',
    escape: null,
    metInstead: null,
    ...cells(
      [
        'explicitly-prohibited',
        '`Explicitly prohibited` — the clone always enters `draft`',
      ],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'Nothing drawn, and the reason stated where a control would sit. `TEST-DOH-15-D3` (L29571) asks for exactly this and words it as a PATH assertion — "assert no such path exists" — rather than a permission assertion, which is what makes a disabled control the wrong answer: a disabled control asserts the path exists and is merely refused.',
    effect: 'None. There is no such act to have an effect.',
    sourceRef: 'L29480',
  },
  {
    id: 'carry-the-source-jobs-approval-forward',
    ordinal: 5,
    control: "Carry the source Job's approval forward",
    surface: 'screen',
    kind: 'restatement',
    restates:
      'The copy list at L29452, which does not name the approval, and the card`s Security line at L29470: "cloning is not a route around the approval gate".',
    escape: null,
    metInstead: null,
    ...cells(PROHIBITED, PROHIBITED, PROHIBITED, PROHIBITED, PROHIBITED),
    rendering:
      'Nothing drawn. This is not a capability withheld from five roles; it is the copy list stated negatively. The approval is not among the six copied elements, so there is no act of carrying it forward for anyone to be prohibited from.',
    effect: 'None. The clone enters the standard approval path and is approved afresh.',
    sourceRef: 'L29481',
  },
  {
    id: 'carry-the-source-jobs-recurrence-forward-silently',
    ordinal: 6,
    control: "Carry the source Job's recurrence forward silently",
    surface: 'screen',
    kind: 'restatement',
    restates:
      'The reset at L29452 and the prompt that replaces the silence, at L29489.',
    escape: null,
    metInstead: null,
    ...cells(
      [
        'explicitly-prohibited',
        '`Explicitly prohibited` — recurrence resets to one-off and the prompt fires',
      ],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'Nothing drawn. The clause after the Tenant Admin`s token states what the platform DOES INSTEAD; it is not a condition on the prohibition. Read as a condition it would make the row say "prohibited where the prompt fires", licensing a silent carry-forward on the branch where L29494 says no prompt fires — which is the one branch the whole rule exists to close.',
    effect:
      'None. The recurrence reset is automatic (`FUNC-DOH-15-1.2.1`, L29521: "Roles allowed: none — automatic").',
    sourceRef: 'L29482',
  },
] as const satisfies readonly Doh15Row[]

const ROW_BY_ID = new Map<Doh15RowId, Doh15Row>(MOD_DOH_15_MATRIX.map((r) => [r.id, r]))

export function doh15Row(id: Doh15RowId): Doh15Row {
  const found = ROW_BY_ID.get(id)
  if (!found) throw new Error(`Unknown MOD-DOH-15 row: ${id}`)
  return found
}

/* ==================================================================== *
 * WHAT A CLONE CARRIES AND WHAT IT DROPS
 * ==================================================================== */

/**
 * The SIX copied elements, and the count is the trap.
 *
 * `AC-DOH-15-1` (L29557) says "A clone copies exactly the six named elements
 * and no others". The list at L29452 reads "the workflow and
 * work-instruction pointers, the Service Type tag, the Job Type, the Area
 * binding, the planned quantity, and the qualification requirements" — six
 * items only if the FIRST is read as one compound element naming two
 * pointers. Split on the conjunction and the same sentence yields seven, and
 * an implementation that counted seven would fail its own acceptance
 * criterion for a reason no reviewer could see. It is six, and the first
 * element is plural; `pointers` records which one that is.
 *
 * "THE AREA BINDING" IS THE PARENT-NODE BINDING. `DEC-AREA-001`'s adopted
 * position is that a Job binds to exactly one parent node at the deepest
 * level its tenant configured, and `JobRecord` accordingly stores
 * `parentNodeId` and no Area field at all. The source's own alternate path
 * switches vocabulary inside one sentence and confirms the reading (L29494):
 * "Cloning a Job whose Area has since been archived is refused, because the
 * clone would bind to an archived node."
 *
 * THE TAXONOMY IS CARRIED, NEVER INVENTED. The Service Type tag and the Job
 * Type come from the source Job. `DEC-TAX-002` (L27654) ships the catalogue
 * empty at V1 — `seededJobTypes` and `seededServiceTypes` in `@/domain/state`
 * are empty and stay empty — so a clone of a tenant-created entry carries a
 * tenant-created entry, and no seeded name appears here or anywhere.
 */
export interface ClonedElement {
  readonly element: string
  /** True where the single named element covers more than one field. */
  readonly plural: boolean
  readonly note: string
}

export const COPIED_ELEMENTS = [
  {
    element: 'The workflow and work-instruction pointers',
    plural: true,
    note: 'Two pointers, one element of the six. A superseded workflow pointer copies as it stands and the clone then follows MOD-DOH-05`s adoption rules (L29494).',
  },
  {
    element: 'The Service Type tag',
    plural: false,
    note: 'Carried from the source Job. DEC-TAX-002 ships the eight-tag catalogue empty at V1; the names are owed by the client and are never invented here.',
  },
  {
    element: 'The Job Type',
    plural: false,
    note: 'Carried from the source Job, and a tenant-created entry for the same reason.',
  },
  {
    element: 'The Area binding',
    plural: false,
    note: 'The parent-node binding, per DEC-AREA-001. Cloning a Job whose bound node has since been archived is refused (L29494).',
  },
  { element: 'The planned quantity', plural: false, note: 'Carried unchanged.' },
  {
    element: 'The qualification requirements',
    plural: false,
    note: 'Carried unchanged; MOD-DOH-04 owns them (card Dependencies, L29468).',
  },
] as const satisfies readonly ClonedElement[]

/** The three reset elements, L29452 and L29488. `AC-DOH-15-2` (L29558). */
export const RESET_ELEMENTS = [
  { element: 'The name', to: 'cleared — the acting identity names the clone' },
  { element: 'The state', to: '`draft` — full re-approval required, segregation of duties intact' },
  { element: 'The recurrence', to: 'one-off — the prompt fires where the source was recurring' },
] as const

/**
 * The prompt, verbatim. L29452 and again at L29489:
 * "This was cloned from a recurring Job — set recurrence now?"
 */
export const RECURRENCE_PROMPT = 'This was cloned from a recurring Job — set recurrence now?'

/**
 * The storyboard's footer line, verbatim, L29547:
 * "The cloned Job starts in draft and requires approval by someone other than you."
 */
export const CLONE_DIALOGUE_FOOTER =
  'The cloned Job starts in draft and requires approval by someone other than you.'

/* ==================================================================== *
 * REACH, AND THE MOUNT
 * ==================================================================== */

/**
 * WHO REACHES THIS MODULE — the shared rule over this module's own matrix.
 * Never a hand-written rail, and never catalogue B's cell.
 *
 * It answers {Tenant Admin, Supervisor}, and row 3's CLASSIFICATION is what
 * makes that true: clause one of `rolesReachingByMatrix` reads only
 * `surface === 'screen'` rows, and row 3 is the single row on this card
 * whose Quality Manager cell holds anything. Reclassify it `screen` — read
 * its permissive token before asking whose act it is — and this module
 * acquires a Quality Manager whose only standing on the card is an act
 * performed on another module's screen. The unit suite drives that mutant.
 *
 * Clause two does no work here: no cell on this card carries `Unavailable`.
 * Saying so is cheaper than leaving a reader to assume both clauses bind.
 */
export const MOD_DOH_15_REACH: readonly TenantRoleId[] = rolesReachingByMatrix(
  MOD_DOH_15_MATRIX,
  cellStatus,
)

/**
 * THE MOUNT, and the narrowing it exposes.
 *
 * `DOH_CATALOGUE_B_REACH_NARROWER` in `@/surfaces/doh/screens` already
 * records `SCR-DOH-11` as narrower than its module's matrix, citing L27695
 * — `MOD-DOH-05`'s "Edit a draft Job", unconditional `Allowed` for a Tenant
 * Admin catalogue B's cell omits. **This module narrows the same screen a
 * SECOND time, independently**: L29477 gives the Tenant Admin `Allowed with
 * conditions` to clone, and L48105's "Roles that can open it" cell reads
 * "Supervisor" alone.
 *
 * `DohCatalogueNarrowing` is keyed on `screenId` with ONE `matrixRef`, so a
 * screen that mounts three modules — as L48105 does — has one slot for what
 * can be three separate narrowings. That shape gap is reported upward rather
 * than patched into another task's file, and the second narrowing is held
 * here in the module that measured it.
 *
 * IT IS DISCLOSED, NOT ENFORCED. `screens.ts` is explicit that
 * `catalogueBRoles` "is NOT who may reach the screen" and that a screen
 * drawing its rail from the catalogue "would withhold from roles the source
 * admits". So the Tenant Admin is NOT withheld from the clone control on the
 * strength of L48105 — that would be the exact drift the register exists to
 * name. The no-Hub-screen question in the fold is D11, asked at the route
 * registry, and nothing else.
 */
export const MOD_DOH_15_MOUNT = {
  moduleId: 'MOD-DOH-15',
  hasRouteOfItsOwn: false,
  mountedIn: 'SCR-DOH-11',
  mountedInName: 'Job editor',
  catalogueBRoles: 'Supervisor',
  sourceRef: 'L48105',
  narrowerThanTheMatrixBy: ['Tenant Admin'],
  narrowingRef:
    'L29477 — MOD-DOH-15 "Clone a Job", `Allowed with conditions` for the Tenant Admin, against L48105`s "Supervisor"',
  registerGap:
    'This is the SECOND narrowing of SCR-DOH-11. DOH_CATALOGUE_B_REACH_NARROWER holds one entry per screen and its SCR-DOH-11 entry cites L27695 (MOD-DOH-05 row 2). A screen mounting three modules can be narrowed by each of them; the register`s shape records one.',
} as const

/* ==================================================================== *
 * THE FOLD
 * ==================================================================== */

/**
 * ONE cell's affordance.
 *
 * **THERE IS NO `disabled` MEMBER, AND THERE IS NO PROP THROUGH WHICH A
 * MATRIX ROW COULD ACQUIRE ONE.** That is the wave-1 deferral ruling,
 * consumed from `DEFERRAL_RENDERING` in `../doh-06/matrix` rather than
 * re-derived: a deferred or non-existent capability renders as no control
 * plus a stated line where it would sit — never a disabled control, never an
 * empty region. Rows 4, 5 and 6 are the non-existent case; row 3 is the
 * met-elsewhere case; a disabled control on any of them would promise a
 * capability that exists somewhere and is merely refused here.
 *
 * **`blockedByTenantState` IS NOT THAT `disabled`, AND THE SCOPING IS THE
 * SOURCE'S OWN.** `DEFERRAL_RENDERING` scopes itself to the MATRIX axis and
 * says a control disabled because the tenant is suspended "is a different
 * mechanism and is untouched". This card names both mechanisms separately
 * and in its own words: row 1's cells make suspension their own CONDITION,
 * and L29530 — "The clone control disables under `FB-DOH-CORE-001`; no clone
 * is queued in the browser" — requires a disabled control offline in so many
 * words. A fold that refused to draw one would contradict the source it is
 * enforcing. So the transient axis rides on the arm that HAS a control, and
 * cannot appear on `absent` at all: a row nobody holds cannot become holdable
 * by the tenant coming back online.
 */
export type Doh15Affordance =
  | {
      readonly kind: 'control'
      readonly label: string
      /** The cell's own condition text. Never a bare token. */
      readonly conditions: string
      /** Transient, and a different mechanism. `null` where the control is live. */
      readonly blockedByTenantState: string | null
    }
  | { readonly kind: 'absent'; readonly reason: string }

/** The state of the world the fold reads, handed in by the panel. */
export interface Doh15Context {
  readonly tenantState: TenantWriteState
  readonly online: boolean
  /**
   * Whether the SOURCE Job recurs. Handed in because it is not on the
   * record: see `MOD_DOH_15_UNSPECIFIED_IN_SOURCE` entry 3.
   */
  readonly sourceRecurs: boolean
}

/**
 * D11 asked at the registry, not restated. The same question `HubShell` asks
 * of the same registry entry.
 */
function reachesThisSurface(role: RoleId): boolean {
  const hub = routeBySurface('SURF-DOH')
  return routesForRole(role).some((r) => r.id === hub.id)
}

const HOLDS_A_CONTROL: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions']

/**
 * The clone act is new-Job creation — the Tenant Admin cell of row 1 says so
 * in those words — so the suspension gate is the ONE write-class table, read
 * for the `create-job` action. No second suspension rule is written here.
 *
 * L29530 adds the offline half, and it is a separate sentence in the source
 * with a separate fallback identifier, so it is a separate branch here.
 */
function transientBlock(ctx: Doh15Context): string | null {
  if (!writeAllowed(ctx.tenantState, 'create-job')) {
    return `Blocked while this workspace is ${ctx.tenantState}. ${writeClassNote(ctx.tenantState)} Cloning is new-Job creation, in the source's own words, so it is refused by the same write-class row that refuses a fresh Job.`
  }
  if (!ctx.online) {
    return 'The clone control disables under FB-DOH-CORE-001 (L29530). No clone is queued in the browser, and nothing is reconciled on reconnect, because nothing was queued.'
  }
  return null
}

export function doh15Affordance(
  row: Doh15Row,
  role: TenantRoleId,
  ctx: Doh15Context,
): Doh15Affordance {
  const status = cellStatus(row, role)

  // 1. CLASSIFICATION FIRST, before the token is read. Row 3's Quality
  //    Manager cell is permissive and is still not a control here.
  if (row.surface !== 'screen') {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} ${row.metInstead ?? ''}`.trim(),
    }
  }

  // 2. The no-Hub-screen rule, before the token, so a grant in a column
  //    whose persona reaches no Hub route cannot become a control here.
  if (!reachesThisSurface(role as RoleId)) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} The route registry admits this persona to no Delivery Operations Hub route at all (D11), so this cell is met on another surface or not at all — it is not withheld here.`,
    }
  }

  // 3. No control here. Two shapes, both of them "the act does not exist",
  //    and both rendered by DEFERRAL_RENDERING's adopted rule.
  if (row.kind === 'restatement') {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} This row restates something the card already settled — ${row.restates} — so it names no capability and draws no control. ${DEFERRAL_RENDERING.adopted}`,
    }
  }
  if (row.id === 'answer-the-recurrence-prompt' && !ctx.sourceRecurs) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} The source Job does not recur, and cloning a non-recurring Job does not raise the prompt, "because there is no trap to warn about" (L29494). There is no prompt on this clone to answer.`,
    }
  }

  // 4. The token, last.
  if (HOLDS_A_CONTROL.includes(status)) {
    return {
      kind: 'control',
      label: row.control,
      conditions: row.detail[role],
      blockedByTenantState: transientBlock(ctx),
    }
  }
  return { kind: 'absent', reason: row.detail[role] }
}

/**
 * The evaluator's answer for the clone act, for the audit line and for the
 * refusal wording. The fold above decides what is DRAWN; this decides what
 * the platform would answer, and the two are asked separately on purpose —
 * "taking a button off the screen does not stop anyone."
 *
 * `contextFor` is `MOD-DOH-05`'s, imported rather than rebuilt: the clone
 * lands in the same tenant partition, against the same identities, and a
 * second context would be a second set of actors for one Job model.
 */
export function cloneDecision(
  role: TenantRoleId,
  context: AccessContext = contextFor(role),
): PermissionDecision {
  const row = doh15Row('clone-a-job')
  const allowedRoles = (['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'] as const).filter(
    (r) => HOLDS_A_CONTROL.includes(row.status[r]),
  )
  return evaluateAccess(
    {
      action: row.control,
      allowedRoles: allowedRoles as readonly RoleId[],
      sourceRefs: [`MOD-DOH-15 ${row.sourceRef}`],
    },
    context,
  )
}

/* ==================================================================== *
 * WHAT THE SOURCE DOES NOT SAY, OR SAYS TWICE
 * ==================================================================== */

export interface Doh15Silence {
  readonly topic: string
  readonly whatIsMissing: string
  readonly sourceRef: string
}

export const MOD_DOH_15_UNSPECIFIED_IN_SOURCE = [
  {
    topic: 'The nineteen bare `Explicitly prohibited` cells',
    whatIsMissing:
      'Nineteen of this card`s thirty cells carry the token with no qualifying clause. The panel renders the token and states the silence rather than inventing a cause — "a blank cell is an unanswered question that an implementer will answer privately and inconsistently" (L10238).',
    sourceRef: 'L29477-L29482',
  },
  {
    topic: '"The cloning identity" is named as a role and is not one',
    whatIsMissing:
      '`FUNC-DOH-15-2.1.1` (L29524) lists "**Roles allowed:** the cloning identity" for the recurrence prompt. That is a field of the act, not a member of the five-role model, and it is NARROWER than row 2 of the matrix (L29478), which gives the Tenant Admin `Allowed` outright and the Supervisor `Allowed with conditions` — neither of which is "the identity that cloned". Whether a Tenant Admin may answer the prompt on a clone a Supervisor created is therefore answered twice and settled nowhere. Both are shown. No `CLONING_IDENTITY` token is added to any role list, for the same reason `JOB_OWNER` is not one: read as a role it mints a sixth.',
    sourceRef: 'L29524 against L29478',
  },
  {
    topic: 'Recurrence is not a field of the Job record',
    whatIsMissing:
      '`AC-DOH-15-3` (L29559) requires that cloning from a recurring Job ALWAYS raises the prompt, and the whole module turns on whether the source recurs. `JobRecord` in `@/surfaces/doh/objects` carries no recurrence field — jobId, name, jobTypeId, parentNodeId, ownerId, state, createdBy — so this build cannot read the answer off the record. It is handed to the fold as `Doh15Context.sourceRecurs` and both branches render. Adding the field is a change to another task`s file and is reported rather than made.',
    sourceRef: 'L29559; `JobRecord`, `@/surfaces/doh/objects`',
  },
  {
    topic: 'No Hub command for the clone act',
    whatIsMissing:
      '`HUB_COMMAND_TYPES` in `@/domain/commands` mints twelve Hub commands and no clone is among them. So the clone cannot go through `hubAccessRequest` the way `DOH_APPROVE_JOB` and `DOH_DECIDE_VERSION_ADOPTION` do, and `cloneDecision` reads the row`s own cells instead. The audit line the source requires — "recording the source Job identifier, the acting identity, the copied elements and the recurrence answer" (L29543) — has no command to hang off. Reported, not minted: the command registry is another task`s file.',
    sourceRef: 'L29543; `HUB_COMMAND_TYPES`, `@/domain/commands`',
  },
  {
    topic: 'An idempotency key no part of the module specifies',
    whatIsMissing:
      '`TEST-DOH-15-R1` (L29574) asks to "assert the idempotency key prevented a duplicate". The failure section (L29551) names only "the bounded idempotent retry of the whole clone transaction" and no key, and nothing else in the card names one. The property — exactly one clone after a retry — is stated; the mechanism the test names is not.',
    sourceRef: 'L29574 against L29551',
  },
  {
    topic: 'Two fallback identifiers, one card slot',
    whatIsMissing:
      'The identity card`s Fallback identifier line (L29471) names `FB-DOH-WRITE-002` primary and nothing else, while L29530 disables the clone control under `FB-DOH-CORE-001`. Both are rendered; neither is dropped for the other.',
    sourceRef: 'L29471 against L29530',
  },
] as const satisfies readonly Doh15Silence[]

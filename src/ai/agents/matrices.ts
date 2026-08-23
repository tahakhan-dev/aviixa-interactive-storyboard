import { ROLES, roleById, type RoleId } from '@/domain/roles'
import { surfaceById } from '@/domain/surfaces'
import { cellFromSource, type ColumnCell } from '@/policy/columns'
import type { PermissionOutcome } from '@/policy/decision'
import { routeBySurface, routeOpenDecisionFor, routesForRole } from '@/routes/definitions'
import type { LinkOutOwner, OwningSurface } from '@/surfaces/cc/decisions/link-outs'
import type { AiAgentId } from './roster'

/**
 * CHAPTER 44'S THREE ROLE MATRICES, AND WHAT EACH CELL IS ALLOWED TO DRAW.
 *
 * Three of the four agent sections carry a matrix on one shared axis; the
 * fourth carries none, and that absence lives on the roster record in
 * `./roster` rather than here, because a matrix module holding an entry for a
 * matrix that does not exist is the empty matrix `SB-AI-006` forbids.
 *
 * ── THE ROWS ARE STORED WHOLE AND THE CELLS ARE DERIVED ────────────────────
 * Every record below carries the source line VERBATIM and nothing else about
 * its contents. The capability, the five cells and every token are decoded
 * from that string, header-keyed. This is not tidiness: a transcription that
 * writes the row and then writes the cells again has two copies that can
 * disagree, and the whole class of defect this build keeps meeting is a
 * derived copy drifting from the thing it was derived from. There is one copy
 * here, and `tests/unit/ai-agent-matrices.test.ts` compares it byte-for-byte
 * against the frozen source.
 *
 * ── THE AXIS IS CONSUMED, NEVER RE-DECLARED ────────────────────────────────
 * The five column names are `roleById(...).name` for the five tenant roles.
 * They are NOT written out here. Three vocabularies have already been
 * declared twice in this slice, and the five role names are one of the sets
 * with the most copies in the tree — `CC_MATRIX_COLUMNS` in
 * `@/surfaces/cc/decisions/link-outs` is one, in a DIFFERENT order. What this
 * module declares is the ORDER chapter 44's header uses, as a list of
 * `RoleId`s, and the header string is derived from it. The order is the only
 * thing that is chapter 44's own.
 *
 * ── ORDER MATTERS AND THE TWO ORDERS ARE BOTH LIVE ─────────────────────────
 * Chapter 44 runs Worker first. `MOD-CC-08`'s own matrix — which contradicts
 * `44.1` on one row, see `./contracts` — runs Tenant Admin first. Reading a
 * cell positionally across the two is how a paraphrase of the wrong role
 * survives review, so nothing here is ever indexed by position: a cell is
 * reached by `RoleId` and the index is computed from the declared order.
 *
 * ── WHAT THIS MODULE DOES NOT REUSE, AND WHY ───────────────────────────────
 * `frontlineAffordance` in `@/frontline/matrix` is the same shape of fold and
 * it was read before this one was written. It is not reused because it is
 * scoped to one surface in its TYPES — `cross-surface` is
 * `Exclude<SurfaceId, 'SURF-FL'>` and `named-place` is a `FrontlineSlug` —
 * while these matrices' acts land on the Frontline run player (the Worker
 * column), the Command Center panel, the Studio and the Hub record. It also
 * carries neither of the two shapes chapter 44 needs: a row with no
 * permissive cell anywhere, and a row whose named capability is itself a
 * negative. Widening it would be the right fix and it is a file this task may
 * not touch; that seam is recorded in `./contracts`.
 *
 * What IS reused is the mechanism the brief points at: `LinkOutOwner` from
 * `@/surfaces/cc/decisions/link-outs`, and the checked pointer — a
 * destination is looked up in the route registry and collapses to a statement
 * when the viewer's role cannot open it, rather than being asserted.
 *
 * This module is data and one fold. It renders nothing.
 */

/* ==================================================================== *
 * THE AXIS.
 * ==================================================================== */

/**
 * The five columns in the order chapter 44's header writes them, as roles.
 * The NAMES are not here; `chapter44Header()` derives them from `ROLES`.
 */
export const CHAPTER_44_COLUMN_ROLES = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly RoleId[]

export type Chapter44Column = (typeof CHAPTER_44_COLUMN_ROLES)[number]

/**
 * Compile-time totality, on the `journey.ts` pattern (`JOURNEY_SURFACES`):
 * every role in the TENANT security domain appears in the axis exactly once.
 * `TenantRoleId` is derived from `ROLES` rather than spelled out, so adding a
 * sixth tenant role fails to compile here instead of silently producing a
 * matrix with a missing column.
 */
type TenantRoleId = Extract<(typeof ROLES)[number], { domain: 'TENANT' }>['id']
type MissingFromAxis = Exclude<TenantRoleId, Chapter44Column>
const _axisIsEveryTenantRole: MissingFromAxis extends never ? true : never = true
void _axisIsEveryTenantRole
type AxisRoleNotTenant = Exclude<Chapter44Column, TenantRoleId>
const _axisHoldsNoPlatformRole: AxisRoleNotTenant extends never ? true : never = true
void _axisHoldsNoPlatformRole

/** The header row, rebuilt from the role registry. Compared to the source. */
export function chapter44Header(): string {
  return `| Capability | ${CHAPTER_44_COLUMN_ROLES.map((r) => roleById(r).name).join(' | ')} |`
}

/* ==================================================================== *
 * THE ROWS.
 * ==================================================================== */

/**
 * Which of the two named agents' matrices this is. Derived from `AiAgentId`
 * by subtraction, so the Vision agent cannot acquire a matrix by someone
 * adding a string, and so a fifth agent would have to be classified.
 */
export type MatrixedAgentId = Exclude<AiAgentId, 'vision-reasoning'>

/**
 * WHETHER THE NAMED CAPABILITY IS ITSELF A NEGATIVE.
 *
 * `Explicitly prohibited` on "Be blocked from starting a shift by a missing
 * acknowledgement" (L92308) does not mean a control is withheld — it means
 * the BLOCKING must not occur. A shift is never blocked. Drawing that row as
 * five refused controls invents an affordance the source spends the row
 * denying. Task 3 met the same shape in the twelve-prohibition table.
 */
export type RowPolarity = 'positive' | 'negative'

export interface Chapter44Row {
  readonly id: string
  /** The whole row from the frozen source, verbatim. The only transcription. */
  readonly rowText: string
  /** The row's own one-based line. */
  readonly line: number
  readonly polarity: RowPolarity
  /**
   * What a negative row means in the words a screen can render, and `null`
   * for every positive row. Required and non-null exactly where it applies:
   * `chapter44Affordance` throws rather than render a negative row without
   * saying what the denial denies.
   */
  readonly polarityStatement: string | null
}

/**
 * `satisfies` WITHOUT `as const`, AND THAT IS THE DELIBERATE FORM.
 *
 * The leading annotation form — `export const X: readonly Chapter44Row[] =` —
 * was written here first and `tests/coverage/slice-2c-gates.test.ts` caught
 * all three arrays: a declared type wins over inference, so the constraint
 * becomes inert. `satisfies` after the array checks conformance without
 * declaring the type, which is what keeps a blank cell untypeable and every
 * field required. `as const` on top of it was tried and over-narrows: the
 * three arrays become three tuples of distinct literal object types, and
 * `CHAPTER_44_MATRICES` cannot then hold all three under one `rows` field.
 * Nothing here needs literal row ids — the exhaustiveness checks in this file
 * are over `MatrixedAgentId` and the column axis, and both keep `as const`.
 */

/** `44.1` Prevention Agent — header L91761, separator L91762. */
export const PREVENTION_MATRIX_HEADER_LINE = 91_761

export const PREVENTION_MATRIX = [
  {
    id: 'prev-see-authored-work-instructions',
    rowText:
      '| See authored Work Instructions on the step | Allowed | Allowed with conditions — through the Studio or the Delivery Operations Hub record, not the run player | Allowed with conditions — through the Studio or the Delivery Operations Hub record | Read-only | Read-only |',
    line: 91_763,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-see-agent-selected-coaching-card',
    rowText:
      '| See an agent-selected coaching card | Unavailable | Not applicable — supervisors do not receive coaching cards | Not applicable — quality managers do not receive coaching cards | Not applicable — tenant admins do not receive coaching cards | Not applicable — the auditor role has no run player |',
    line: 91_764,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-see-curated-default-asset',
    rowText:
      '| See the curated default asset | Allowed | Read-only through the Studio corpus | Read-only through the Studio corpus | Read-only | Read-only |',
    line: 91_765,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-replay-guidance',
    rowText:
      '| Replay guidance | Allowed | Not applicable — replay is a run-player action | Not applicable — replay is a run-player action | Not applicable — replay is a run-player action | Not applicable — replay is a run-player action |',
    line: 91_766,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-dismiss-guidance',
    rowText:
      '| Dismiss guidance | Allowed | Not applicable — dismissal is a run-player action | Not applicable — dismissal is a run-player action | Not applicable — dismissal is a run-player action | Not applicable — dismissal is a run-player action |',
    line: 91_767,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-see-honest-degradation-state',
    rowText:
      '| See the honest degradation state | Allowed with conditions — a status-strip line only | Allowed | Allowed | Allowed | Explicitly prohibited — the Read-only Auditor has no Command Center access [SoW Fact — §3.5] |',
    line: 91_768,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-switch-the-agent-on-or-off',
    rowText:
      '| Switch the agent on or off | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — a Studio action under authoring grants [SoW Fact — §6.9.1, §5.18] | Explicitly prohibited | Explicitly prohibited |',
    line: 91_769,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-retire-a-coaching-asset',
    rowText:
      '| Retire a coaching asset | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — through the Studio approval chain [SoW Fact — §5.11.1] | Explicitly prohibited | Explicitly prohibited |',
    line: 91_770,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'prev-relax-a-proof-gate',
    rowText:
      '| Relax a proof gate because coaching is unavailable | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
    line: 91_771,
    polarity: 'positive',
    polarityStatement: null,
  },
] satisfies readonly Chapter44Row[]

/** `44.2` Deviation and Containment Agent — header L92028, separator L92029. */
export const DEVIATION_MATRIX_HEADER_LINE = 92_028

export const DEVIATION_MATRIX = [
  {
    id: 'dev-trigger-a-deviation-deterministically',
    rowText:
      '| Trigger a deviation deterministically | Allowed — by capturing a value; not a discretionary act | Not applicable — deviations are triggered by capture, not by decision | Not applicable — deviations are triggered by capture, not by decision | Not applicable — deviations are triggered by capture, not by decision | Not applicable — the auditor role performs no capture |',
    line: 92_030,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-have-the-severity-1-hold-placed-locally',
    rowText:
      '| Have the Severity 1 hold placed locally | Allowed — automatic and immediate | Not applicable — the hold is placed by the device | Not applicable — the hold is placed by the device | Not applicable — the hold is placed by the device | Not applicable — the hold is placed by the device |',
    line: 92_031,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-complete-the-containment-checklist-offline',
    rowText:
      '| Complete the containment checklist offline | Allowed | Allowed with conditions — where the Supervisor holds a device and the run | Allowed with conditions — where the Quality Manager holds a device and the run | Explicitly prohibited | Explicitly prohibited |',
    line: 92_032,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-acknowledge-the-escalation',
    rowText:
      '| Acknowledge the escalation | Explicitly prohibited | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited — no Command Center access |',
    line: 92_033,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-request-release-with-a-note',
    rowText:
      '| Request release with a note | Explicitly prohibited | Allowed | Not applicable — the Quality Manager releases directly | Explicitly prohibited | Explicitly prohibited |',
    line: 92_034,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-release-a-severity-1-hold',
    rowText:
      '| Release a Severity 1 hold | Explicitly prohibited | Explicitly prohibited | Allowed | Explicitly prohibited | Explicitly prohibited |',
    line: 92_035,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-reclassify-at-review-time',
    rowText:
      '| Reclassify at review time with a recorded reason | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — at the review-time bridge only, with a reason [SoW Fact — §3.3] | Explicitly prohibited | Explicitly prohibited |',
    line: 92_036,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-see-the-classification-divergence-flag',
    rowText:
      '| See the classification-divergence flag | Explicitly prohibited — the worker surface carries the deterministic verdict only | Read-only | Allowed with conditions — may raise a Lane B proposal from it | Read-only | Read-only via the Delivery Operations Hub record |',
    line: 92_037,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'dev-change-an-authored-limit-or-mapping',
    rowText:
      '| Change an authored limit or mapping in response | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — through the Studio approval chain or a decided Lane B proposal [SoW Fact — §5.11.1, §6.7] | Explicitly prohibited | Explicitly prohibited |',
    line: 92_038,
    polarity: 'positive',
    polarityStatement: null,
  },
] satisfies readonly Chapter44Row[]

/** `44.3` Shift Handoff Agent — header L92300, separator L92301. */
export const HANDOFF_MATRIX_HEADER_LINE = 92_300

export const HANDOFF_MATRIX = [
  {
    id: 'sha-receive-the-full-brief',
    rowText:
      '| Receive the full brief | Explicitly prohibited — workers see only their own assigned-task readiness [SoW Fact — §5.2.3] | Allowed | Allowed with conditions — optional recipient per configuration | Unavailable — not a configured recipient | Explicitly prohibited — no Command Center access |',
    line: 92_302,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'sha-see-emerging-pattern-watch-items',
    rowText:
      '| See emerging-pattern watch items | Explicitly prohibited | Allowed | Allowed | Unavailable | Explicitly prohibited |',
    line: 92_303,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'sha-acknowledge-the-brief',
    rowText:
      '| Acknowledge the brief | Explicitly prohibited | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited |',
    line: 92_304,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'sha-annotate-the-brief',
    rowText:
      '| Annotate the brief | Explicitly prohibited | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited |',
    line: 92_305,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'sha-read-the-deterministic-handoff-pack',
    rowText:
      '| Read the deterministic handoff pack | Explicitly prohibited | Allowed with conditions — subject to `DEC-HANDOFF-001` | Allowed with conditions — subject to `DEC-HANDOFF-001` | Unavailable | Read-only via the Delivery Operations Hub record |',
    line: 92_306,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'sha-write-the-manual-handoff-note',
    rowText:
      '| Write the manual handoff note | Explicitly prohibited | Allowed with conditions — subject to `DEC-HANDOFF-002` | Allowed with conditions — subject to `DEC-HANDOFF-002` | Explicitly prohibited | Explicitly prohibited |',
    line: 92_307,
    polarity: 'positive',
    polarityStatement: null,
  },
  {
    id: 'sha-be-blocked-from-starting-a-shift',
    rowText:
      '| Be blocked from starting a shift by a missing acknowledgement | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — the auditor starts no shift |',
    line: 92_308,
    polarity: 'negative',
    polarityStatement:
      'The named capability is itself a negative, so the refusal falls on the BLOCKING and not ' +
      'on a control. A shift is never blocked by a missing acknowledgement, for any role. There ' +
      'is nothing here for a control to do, and a refused control would advertise a gate the ' +
      'row exists to deny. The auditor cell differs from the other four — it reads ' +
      '`Not applicable — the auditor starts no shift` rather than `Explicitly prohibited` — and ' +
      'that difference is preserved rather than flattened: four roles are told the blocking ' +
      'never happens, and the fifth is told there is no shift of theirs to block.',
  },
  {
    id: 'sha-see-the-briefs-absence-honestly-stated',
    rowText:
      "| See the brief's absence honestly stated | Not applicable — workers do not see the panel | Allowed | Allowed | Allowed | Read-only via the record |",
    line: 92_309,
    polarity: 'positive',
    polarityStatement: null,
  },
] satisfies readonly Chapter44Row[]

export interface Chapter44Matrix {
  readonly agentId: MatrixedAgentId
  /** The source's own section number. */
  readonly section: string
  readonly headerLine: number
  readonly rows: readonly Chapter44Row[]
}

export const CHAPTER_44_MATRICES = [
  {
    agentId: 'prevention',
    section: '44.1',
    headerLine: PREVENTION_MATRIX_HEADER_LINE,
    rows: PREVENTION_MATRIX,
  },
  {
    agentId: 'deviation-and-containment',
    section: '44.2',
    headerLine: DEVIATION_MATRIX_HEADER_LINE,
    rows: DEVIATION_MATRIX,
  },
  {
    agentId: 'shift-handoff',
    section: '44.3',
    headerLine: HANDOFF_MATRIX_HEADER_LINE,
    rows: HANDOFF_MATRIX,
  },
] as const satisfies readonly Chapter44Matrix[]

type MissingMatrix = Exclude<MatrixedAgentId, (typeof CHAPTER_44_MATRICES)[number]['agentId']>
const _everyMatrixedAgentHasOne: MissingMatrix extends never ? true : never = true
void _everyMatrixedAgentHasOne

export function chapter44Matrix(agentId: MatrixedAgentId): Chapter44Matrix {
  const found = CHAPTER_44_MATRICES.find((m) => m.agentId === agentId)
  if (found === undefined) throw new Error(`No chapter-44 matrix for agent "${agentId}".`)
  return found
}

/** Every row of every matrix, so a sweep cannot silently cover one table. */
export function allChapter44Rows(): readonly Chapter44Row[] {
  return CHAPTER_44_MATRICES.flatMap((m) => m.rows)
}

/* ==================================================================== *
 * DECODING A ROW.
 * ==================================================================== */

function pipeCells(rowText: string): readonly string[] {
  return rowText
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

/** Column one, verbatim. Derived, never stored beside the row. */
export function capabilityOf(row: Chapter44Row): string {
  const first = pipeCells(row.rowText)[0]
  if (first === undefined || first === '') {
    throw new Error(`Chapter-44 row "${row.id}" has no capability cell.`)
  }
  return first
}

/** One cell's own words, reached by role and never by position. */
export function cellTextOf(row: Chapter44Row, role: Chapter44Column): string {
  const index = CHAPTER_44_COLUMN_ROLES.indexOf(role)
  const text = pipeCells(row.rowText)[index + 1]
  if (text === undefined || text === '') {
    throw new Error(
      `Chapter-44 row "${row.id}" has no cell for ${roleById(role).name}. A blank cell is a ` +
        'build-blocking defect: L10238 prohibits one, because a blank is an unanswered question ' +
        'an implementer will answer privately.',
    )
  }
  return text
}

/**
 * THE ONE SHAPE CHAPTER 44 WRITES THAT `cellFromSource` DOES NOT ADMIT, and
 * the whole of why this module keeps a parser at all.
 *
 * `src/policy/columns.ts` is this tree's source-cell parser: all nine tokens
 * of L10238 in its spelling, longest first, a SEPARATOR REQUIREMENT that is
 * the mechanism actually stopping `Allowed` from swallowing
 * `Allowed with conditions`, three backtick placements, and a hard throw on
 * text it does not understand. Every one of those is wanted here and none of
 * it is re-derived below — `chapter44Cell` delegates.
 *
 * What it cannot take is a RUN-ON QUALIFIER. Five of chapter 44's 130 cells
 * write `Read-only` and then a prepositional phrase with no separator at all:
 * `Read-only through the Studio corpus` (§44.1), `Read-only via the Delivery
 * Operations Hub record` (§44.2 and §44.3), `Read-only via the record`
 * (§44.3). L10238's separator set is `,` `—` `-` `;` `:` and a space is
 * deliberately not in it, because admitting one would let `Allowed` match
 * `Allowed with conditions` and turn 41 conditioned grants elsewhere in the
 * tree into unconditional ones. So the separator set must not widen, and this
 * shape must be named here rather than there.
 *
 * It is named as narrowly as it occurs: `Read-only`, then `through` or `via`,
 * then the phrase. Any other run-on still throws, and so does everything else
 * `cellFromSource` refuses.
 */
const READ_ONLY_RUN_ON = /^Read-only ((?:through|via) .+)$/

/**
 * One chapter-44 cell, decoded by the tree's parser.
 *
 * THERE IS NO DEFAULT AND NO FALLBACK MEMBER. An unrecognised cell throws,
 * because mapping an unknown spelling onto `notApplicable` or `unavailable`
 * would invent a permission position, which is the one thing a permission
 * decoder must never do. This module used to make that promise with six
 * `startsWith` tests and prefix matching, which kept none of L10238's other
 * rules — including the one requiring `Not applicable` to state its reason,
 * a rule `cellTextOf` cites L10238 for two functions above.
 */
export function chapter44Cell(cellText: string): ColumnCell {
  try {
    return cellFromSource(cellText)
  } catch (refusal) {
    const runOn = READ_ONLY_RUN_ON.exec(cellText.trim())
    if (runOn === null) throw refusal
    return { outcome: 'readOnly', detail: runOn[1] as string }
  }
}

/** The token alone, for callers that only need the permission position. */
export function outcomeOf(cellText: string): PermissionOutcome {
  return chapter44Cell(cellText).outcome
}

const PERMISSIVE: readonly PermissionOutcome[] = ['allowed', 'allowedWithConditions']

/** Whether this cell permits. Used to find rows with no permissive cell at all. */
export function cellPermits(row: Chapter44Row, role: Chapter44Column): boolean {
  return PERMISSIVE.includes(outcomeOf(cellTextOf(row, role)))
}

/**
 * ROWS WITH NO PERMISSIVE CELL ANYWHERE — measured, never listed.
 *
 * `SB-AI-011` (L87376) rules that the ENFORCED badge "must be rendered as an
 * absence of control rather than a disabled control, because a greyed-out
 * toggle invites the belief that a sufficiently privileged account could
 * enable it". Generalising that ruling from the badge to any row with no
 * permissive cell is a BUILD INFERENCE and is labelled one wherever it
 * renders; the source makes the ruling about the badge.
 *
 * This is computed from the decoded cells rather than declared, so a row that
 * loses its last permissive cell joins the set without anyone remembering to
 * add it, and the covering test asserts the exact line numbers it returns.
 */
export function rowsWithNoPermissiveCell(
  rows: readonly Chapter44Row[] = allChapter44Rows(),
): readonly Chapter44Row[] {
  return rows.filter((row) => !CHAPTER_44_COLUMN_ROLES.some((role) => cellPermits(row, role)))
}

/* ==================================================================== *
 * THE OPEN DECISIONS THESE MATRICES CARRY IN THEIR CELLS.
 * ==================================================================== */

export interface Chapter44DecisionReading {
  readonly text: string
  readonly locator: string
}

/**
 * A decision identifier as chapter 44 uses it — KEYED ON CHAPTER AND
 * IDENTIFIER, on the pattern `@/ai/fallbacks/registry` uses for `FB-AI-01`.
 *
 * That key is not decoration. `DEC-HANDOFF-001` asks TWO different questions
 * in this source. Chapter 30 asks where an unacknowledged handoff brief
 * escalates given there is no Plant Manager role (L61210, restated L64115),
 * and chapter 44 asks whether a deterministic handoff pack is produced when
 * the agent fails (L92360, registered L95382). The whole-document decision
 * index at L115416 attributes the identifier to chapter 30 alone. A screen
 * rendering §44.3's cell and reaching for "the" reading of `DEC-HANDOFF-001`
 * can therefore reach the wrong question, which is why both owners are held
 * here and why the cell's disclosure names the chapter.
 */
export interface Chapter44Decision {
  readonly identifier: string
  /** The chapter whose question this record holds. */
  readonly chapter: string
  /** The question, in the source's own words. */
  readonly question: string
  /** Every option the card offers, verbatim. Not two: as many as it lists. */
  readonly readings: readonly Chapter44DecisionReading[]
  /** The card's own recommendation, verbatim. Never the build's position. */
  readonly recommendation: string
  readonly owner: string
  readonly sourceRef: string
}

export const CHAPTER_44_CELL_DECISIONS = [
  {
    identifier: 'DEC-HANDOFF-001',
    chapter: '44.3',
    question: 'whether a deterministic handoff pack is produced when the agent fails',
    readings: [
      { text: '(a) produce the pack automatically on every assembly failure', locator: 'L92360' },
      { text: '(b) produce it on request from the shift handoff panel', locator: 'L92360' },
      {
        text: '(c) do not produce it — show the honest failure state only, as the Statement of Work describes',
        locator: 'L92360',
      },
    ],
    recommendation:
      '(a), because a supervisor at 05:41 will not think to request an artifact they have never seen',
    owner: "the client's product owner, with tenant Quality Manager input",
    sourceRef: 'L92360; registered L95382',
  },
  {
    identifier: 'DEC-HANDOFF-001',
    chapter: '30',
    question:
      'Where does an unacknowledged shift-handoff brief escalate, given there is no Plant Manager role?',
    readings: [
      {
        text: 'A DIFFERENT QUESTION UNDER THE SAME IDENTIFIER. Chapter 30 asks where the unacknowledged-brief flag lands under the five fixed roles; §6.13.3 flags it on a Plant Manager view that §3.5 does not create. This record exists so that a screen rendering §44.3 cannot silently answer §44.3 with chapter 30 or the reverse. Its own readings belong to chapter 30 and are not restated here.',
        locator: 'L61210',
      },
    ],
    recommendation: 'Not stated on the chapter-30 register row.',
    owner: 'Not stated on the chapter-30 register row.',
    sourceRef: 'L61210; restated L64115; indexed to chapter 30 at L115416',
  },
  {
    identifier: 'DEC-HANDOFF-002',
    chapter: '44.3',
    question: 'whether the outgoing supervisor may compose a manual handoff note',
    readings: [
      { text: '(a) free-text note', locator: 'L92362' },
      {
        text: "(b) a lightly structured note with named fields matching the brief's sections",
        locator: 'L92362',
      },
      {
        text: '(c) no manual note — rely on the authored handover step of §2.5 for genuinely cross-shift work',
        locator: 'L92362',
      },
    ],
    recommendation:
      '(b), because structure makes the note comparable to the brief without demanding much more effort from a supervisor at shift end',
    owner: "the client's product owner",
    sourceRef: 'L92362; registered L95383',
  },
] as const satisfies readonly Chapter44Decision[]

/** The `DEC-*` identifier a cell names, or `null`. Read from the cell's words. */
export function decisionIdInCell(cellText: string): string | null {
  return /`(DEC-[A-Z0-9]+-\d+)`/.exec(cellText)?.[1] ?? null
}

/**
 * Every record for one identifier — more than one where chapters collide.
 *
 * KEYED ON THE IDENTIFIER ALONE, ON PURPOSE, and this is the accessor a screen
 * showing a cell should use: it returns every chapter that asks a question
 * under this identifier, and the renderer shows them all. That is what
 * actually protects §44.3 from being answered with chapter 30's question —
 * not the key, the fact that nothing is dropped.
 */
export function chapter44Decisions(identifier: string): readonly Chapter44Decision[] {
  return CHAPTER_44_CELL_DECISIONS.filter((d) => d.identifier === identifier)
}

/**
 * The compound key `Chapter44Decision`'s own comment credits, for a caller
 * that has a chapter and wants THAT chapter's question rather than all of
 * them.
 *
 * IT REFUSES RATHER THAN RETURNING THE OTHER CHAPTER'S. `DEC-HANDOFF-001` asks
 * chapter 30 where an unacknowledged handoff brief escalates and chapter 44
 * whether a deterministic pack is produced when the agent fails. Falling back
 * to "the" record for an identifier is exactly how the wrong question reaches
 * a screen, so an identifier this chapter does not ask is an error and not an
 * empty answer.
 */
export function chapter44DecisionIn(identifier: string, chapter: string): Chapter44Decision {
  const found = CHAPTER_44_CELL_DECISIONS.find(
    (d) => d.identifier === identifier && d.chapter === chapter,
  )
  if (found === undefined) {
    const held = chapter44Decisions(identifier).map((d) => d.chapter)
    throw new Error(
      `No chapter-44 decision record for ${identifier} in §${chapter}. ` +
        (held.length === 0
          ? 'This module holds no record for that identifier at all.'
          : `It is held for §${held.join(', §')}, and that is a different question.`),
    )
  }
  return found
}

/* ==================================================================== *
 * THE ACTS HELD ON ANOTHER SURFACE.
 * ==================================================================== */

/**
 * The words a chapter-44 cell uses for a surface that is not the one the
 * reader is on. Derived from the surface registry where the source uses the
 * registered name, plus the one short form it also uses: chapter 44 writes
 * "the Studio" as often as it writes the full name, and a word list that held
 * only the registered spelling would miss four of the six §44.1 cells.
 */
const OWNING_SURFACE_WORDS: readonly string[] = [
  surfaceById('SURF-STU').name,
  surfaceById('SURF-DOH').name,
  'Studio',
]

/**
 * WHO OWNS THE ACT. Two arms are `LinkOutOwner`'s, imported rather than
 * restated; the third is chapter 44's own and the CC file names it as the
 * case no rule over its strings can catch — "a cell that places an act
 * elsewhere WITHOUT naming a surface". §44.3's auditor cell at L92309 reads
 * "Read-only via the record" and no line of that row names which record, so
 * it cannot be resolved from the cell OR from the row. It is registered as
 * unresolved rather than guessed, and it draws no link.
 */
export type Chapter44LinkOutOwner =
  | LinkOutOwner
  | {
      readonly kind: 'unnamed'
      /** The cell's own words, so a reader can see what is missing from them. */
      readonly words: string
      /** Why the row cannot settle it either. */
      readonly whyUnresolved: string
    }

export interface Chapter44LinkOut {
  readonly rowId: string
  readonly role: Chapter44Column
  readonly owner: Chapter44LinkOutOwner
}

/**
 * THE REGISTRATION, AND THE GUARD BELOW STARTS FROM THE CELL RATHER THAN
 * FROM THIS LIST.
 *
 * Ten cells across the three matrices place their act on another surface.
 * Six are in §44.1 — the brief named four ROWS and the four rows are right;
 * two of them carry the same note in two columns, which is six cells. Two are
 * in §44.2 and two in §44.3.
 */
export const CHAPTER_44_LINK_OUTS = [
  {
    rowId: 'prev-see-authored-work-instructions',
    role: 'SUPERVISOR',
    owner: {
      kind: 'ambiguous',
      candidates: ['through the Studio', 'the Delivery Operations Hub record'],
    },
  },
  {
    rowId: 'prev-see-authored-work-instructions',
    role: 'QUALITY_MANAGER',
    owner: {
      kind: 'ambiguous',
      candidates: ['through the Studio', 'the Delivery Operations Hub record'],
    },
  },
  {
    rowId: 'prev-see-curated-default-asset',
    role: 'SUPERVISOR',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'the Studio corpus' },
  },
  {
    rowId: 'prev-see-curated-default-asset',
    role: 'QUALITY_MANAGER',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'the Studio corpus' },
  },
  {
    rowId: 'prev-switch-the-agent-on-or-off',
    role: 'QUALITY_MANAGER',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'a Studio action under authoring grants' },
  },
  {
    rowId: 'prev-retire-a-coaching-asset',
    role: 'QUALITY_MANAGER',
    owner: { kind: 'named', surface: 'SURF-STU', place: 'the Studio approval chain' },
  },
  {
    rowId: 'dev-see-the-classification-divergence-flag',
    role: 'READONLY_AUDITOR',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the Delivery Operations Hub record',
    },
  },
  {
    rowId: 'dev-change-an-authored-limit-or-mapping',
    role: 'QUALITY_MANAGER',
    owner: {
      kind: 'named',
      surface: 'SURF-STU',
      place: 'the Studio approval chain, or a decided Lane B proposal',
    },
  },
  {
    rowId: 'sha-read-the-deterministic-handoff-pack',
    role: 'READONLY_AUDITOR',
    owner: {
      kind: 'named',
      surface: 'SURF-DOH',
      place: 'the Delivery Operations Hub record',
    },
  },
  {
    rowId: 'sha-see-the-briefs-absence-honestly-stated',
    role: 'READONLY_AUDITOR',
    owner: {
      kind: 'unnamed',
      words: 'Read-only via the record',
      whyUnresolved:
        'The cell names a record and no surface, and no other cell on L92309 names one either, ' +
        'so the row cannot settle it the way L36845 settles its own elliptical cell in ' +
        '`@/surfaces/cc/decisions/link-outs`. No destination is built from a guess.',
    },
  },
] as const satisfies readonly Chapter44LinkOut[]

export function linkOutFor(rowId: string, role: Chapter44Column): Chapter44LinkOut | null {
  return CHAPTER_44_LINK_OUTS.find((l) => l.rowId === rowId && l.role === role) ?? null
}

/**
 * THE GUARD, AND IT DOES NOT READ THE REGISTRATION TO DECIDE.
 *
 * `controlsOnActsHeldElsewhere` in `@/frontline/matrix` once had a loop that
 * could not fail because it started from the classification it was supposed
 * to doubt. This one sweeps every cell of every row for the surface words and
 * reports any that no `CHAPTER_44_LINK_OUTS` entry covers. So the way to make
 * it red is to ADD a row whose cell names the Studio, not to remove one — a
 * membership check proved by adding, which is the only kind that is real.
 */
export function linkOutsMissingAnOwner(
  rows: readonly Chapter44Row[] = allChapter44Rows(),
): readonly string[] {
  const offenders: string[] = []
  for (const row of rows) {
    for (const role of CHAPTER_44_COLUMN_ROLES) {
      const text = cellTextOf(row, role)
      const named = OWNING_SURFACE_WORDS.find((w) => text.includes(w))
      if (named === undefined) continue
      if (linkOutFor(row.id, role) === null) {
        offenders.push(
          `${row.id} · ${roleById(role).name} (L${row.line}): the cell places the act on the ` +
            `${named} and no link-out owner is registered for it — "${text}"`,
        )
      }
    }
  }
  return offenders
}

/**
 * The other direction: a registered owner whose cell no longer names another
 * surface. Catches a registration that outlived its row.
 */
export function linkOutsWithoutSurfaceWords(): readonly string[] {
  const byId = new Map(allChapter44Rows().map((r) => [r.id, r]))
  const offenders: string[] = []
  for (const link of CHAPTER_44_LINK_OUTS) {
    const row = byId.get(link.rowId)
    if (row === undefined) {
      offenders.push(`${link.rowId}: registered as a link-out and no such row exists.`)
      continue
    }
    const text = cellTextOf(row, link.role)
    if (link.owner.kind === 'unnamed') {
      // NOT AN EXEMPTION — THE OPPOSITE ASSERTION, and it is structural. An
      // `unnamed` owner is registered precisely BECAUSE its cell names no
      // surface, so the check above would convict it every time and convict
      // it for being what it says it is. What can go stale is the other way
      // round: the row changes, the cell starts naming a surface, and the
      // registration that says it names none outlives it. So that is what is
      // checked here, along with the words the record quotes.
      if (link.owner.words !== text) {
        offenders.push(
          `${link.rowId} · ${roleById(link.role).name}: registered unnamed quoting ` +
            `"${link.owner.words}" and the cell now reads "${text}".`,
        )
        continue
      }
      const names = OWNING_SURFACE_WORDS.find((w) => text.includes(w))
      if (names !== undefined) {
        offenders.push(
          `${link.rowId} · ${roleById(link.role).name}: registered as naming no surface, and ` +
            `the cell names the ${names} — "${text}".`,
        )
      }
      continue
    }
    if (!OWNING_SURFACE_WORDS.some((w) => text.includes(w))) {
      offenders.push(
        `${link.rowId} · ${roleById(link.role).name}: registered as a link-out and its cell ` +
          `names no other surface — "${text}"`,
      )
    }
  }
  return offenders
}

/* ==================================================================== *
 * WHAT A CELL DRAWS.
 * ==================================================================== */

export type Chapter44Affordance =
  /**
   * The named capability is a negative. No control, for any role, and a
   * statement saying the behaviour does not occur.
   */
  | { readonly kind: 'inverted-polarity'; readonly statement: string }
  /**
   * No column of this row permits, so there is nothing to draw anywhere on
   * it. An absence of control, not five refused ones.
   */
  | { readonly kind: 'absence-of-control'; readonly statement: string }
  /**
   * The permissive cell defers to an open decision. DISABLED with the
   * identifier and every reading — never enabled, and never absent.
   */
  | {
      readonly kind: 'open-decision-disabled'
      readonly identifier: string
      readonly decisions: readonly Chapter44Decision[]
      readonly note: string
    }
  /** Owned elsewhere. A checked link, or a statement where the pointer fails. */
  | {
      readonly kind: 'link-out'
      readonly linkState: 'link' | 'statement' | 'open-decision' | 'owner-undecided' | 'unresolved'
      readonly linkLabel: string | null
      readonly linkHref: string | null
      readonly note: string
    }
  | {
      readonly kind: 'control'
      readonly outcome: Extract<PermissionOutcome, 'allowed' | 'allowedWithConditions'>
      readonly note: string
    }
  | { readonly kind: 'read-only'; readonly note: string }
  | {
      readonly kind: 'refusal'
      readonly outcome: Extract<
        PermissionOutcome,
        'explicitlyProhibited' | 'unavailable' | 'notApplicable'
      >
      readonly note: string
    }

/**
 * THE ORDER OF QUESTIONS, AS ONE FOLD, AND THE TOKEN IS REACHED LAST.
 *
 * The token is never corrected, downgraded or hidden: the matrix goes on
 * saying what the source says, with its own words and its own line. What the
 * earlier branches decide is what may be DRAWN.
 *
 *  1. Is the capability itself a negative? Then nothing is drawn for anyone.
 *  2. Does any column of this row permit? If none does, the row is an absence
 *     of control rather than a row of refused ones.
 *  3. Does this cell defer to an open decision? Then it is disabled with the
 *     identifier and the readings, whatever its token says.
 *  4. Is the act held on another surface? Then a checked link or a statement.
 *  5. Only now, the token.
 */
export function chapter44Affordance(
  row: Chapter44Row,
  role: Chapter44Column,
  viewerRole: RoleId = role,
): Chapter44Affordance {
  // 1. POLARITY, BEFORE EVERYTHING.
  if (row.polarity === 'negative') {
    if (row.polarityStatement === null) {
      throw new Error(
        `Chapter-44 row "${row.id}" is classified \`negative\` and says nothing about what the ` +
          'denial denies. An inverted-polarity row must state it, or it renders as the refused ' +
          'control it exists to forbid.',
      )
    }
    return { kind: 'inverted-polarity', statement: row.polarityStatement }
  }

  const cellText = cellTextOf(row, role)
  const outcome = outcomeOf(cellText)

  // 2. NO PERMISSIVE CELL ANYWHERE ON THE ROW.
  if (!CHAPTER_44_COLUMN_ROLES.some((r) => cellPermits(row, r))) {
    return {
      kind: 'absence-of-control',
      statement:
        `${capabilityOf(row)} — no control is drawn here for any role. No column of this row ` +
        `permits it (L${row.line}), and a refused control invites the belief that a ` +
        'sufficiently privileged account could enable it. Extending `SB-AI-011` (L87376) from ' +
        'the ENFORCED badge to any row with no permissive cell is a build inference, not the ' +
        `source's ruling. This role's cell reads "${cellText}".`,
    }
  }

  // 3. AN OPEN DECISION IN THE CELL'S OWN WORDS.
  const identifier = decisionIdInCell(cellText)
  if (identifier !== null) {
    const decisions = chapter44Decisions(identifier)
    if (decisions.length === 0) {
      throw new Error(
        `Chapter-44 cell "${cellText}" defers to ${identifier} and no record is registered for ` +
          'it. A disabled control with an identifier a reader cannot look up is a dead end.',
      )
    }
    return {
      kind: 'open-decision-disabled',
      identifier,
      decisions,
      note:
        `${cellText} — the control is drawn disabled and carries ${identifier}, because the ` +
        'source has not decided it and enabling it here would settle a question this build has ' +
        `no authority over. ${decisions.length > 1 ? `${identifier} is asked as a different ` +
        'question in more than one chapter and every owner is shown, so the reader is not ' +
        'answered from the wrong one. ' : ''}`.trimEnd(),
    }
  }

  // 4. HELD ON ANOTHER SURFACE.
  const link = linkOutFor(row.id, role)
  if (link !== null) return linkOutAffordance(link, cellText, viewerRole)

  // 5. THE TOKEN.
  switch (outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return { kind: 'control', outcome, note: cellText }
    case 'readOnly':
      return { kind: 'read-only', note: cellText }
    case 'explicitlyProhibited':
    case 'unavailable':
    case 'notApplicable':
      return { kind: 'refusal', outcome, note: cellText }
    default:
      throw new Error(
        `Chapter-44 cell "${cellText}" decodes to \`${outcome}\`, which chapter 44's matrices do ` +
          'not use and which has no rendering here.',
      )
  }
}

/**
 * THE POINTER IS CHECKED, NEVER ASSERTED — the same three route-registry
 * calls `ccLinkOutModel` makes, for the same reason: a destination the
 * viewer's role cannot open is a link to a refusal, and the honest rendering
 * is a statement. The ambiguous and unnamed arms never reach a lookup at all,
 * so no destination can be built from an owner the source did not choose.
 */
function linkOutAffordance(
  link: Chapter44LinkOut,
  cellText: string,
  viewerRole: RoleId,
): Chapter44Affordance {
  if (link.owner.kind === 'unnamed') {
    return {
      kind: 'link-out',
      linkState: 'unresolved',
      linkLabel: null,
      linkHref: null,
      note:
        `${cellText} — held off this surface. ${link.owner.whyUnresolved} No link is drawn and ` +
        'no control is offered here.',
    }
  }
  if (link.owner.kind === 'ambiguous') {
    const [a, b] = link.owner.candidates
    return {
      kind: 'link-out',
      linkState: 'owner-undecided',
      linkLabel: null,
      linkHref: null,
      note:
        `${cellText} — the cell names two owners, "${a}" and "${b}", and chooses neither, so no ` +
        'link is drawn to either and no control is offered here.',
    }
  }

  const owningSurface: OwningSurface = link.owner.surface
  const surfaceName = surfaceById(owningSurface).name
  const route = routeBySurface(owningSurface)
  if (routesForRole(viewerRole).some((r) => r.id === route.id)) {
    return {
      kind: 'link-out',
      linkState: 'link',
      linkLabel: `Open the ${surfaceName}`,
      linkHref: route.pathname,
      note: `${cellText} — owned there, not here: ${link.owner.place}.`,
    }
  }
  const open = routeOpenDecisionFor(owningSurface, viewerRole)
  if (open !== null) {
    return {
      kind: 'link-out',
      linkState: 'open-decision',
      linkLabel: null,
      linkHref: null,
      note:
        `${cellText} — whether your role opens the ${surfaceName} is an open question: ` +
        `${open.decision}. No link is drawn and none is refused.`,
    }
  }
  return {
    kind: 'link-out',
    linkState: 'statement',
    linkLabel: null,
    linkHref: null,
    note:
      `${cellText} — owned by the ${surfaceName} (${link.owner.place}), which your role does not ` +
      'open, so no link is drawn to it. The act is not performed here in any case.',
  }
}

/**
 * ACTS THAT DO NOT HAPPEN ON THE WORKER'S DEVICE — measured, and the two
 * briefs disagree about the number because they count different things.
 *
 * The re-plan says §44.2 holds "six acts on other surfaces"; the dispatch
 * brief for this task says seven and names L92032-L92038. Measured: the
 * Worker cell is permissive on L92030, L92031 AND L92032 — "Complete the
 * containment checklist offline" reads a bare `Allowed` for the Worker, so it
 * IS a device act and the seven-row span includes it. Rows whose Worker cell
 * does not permit: six, L92033-L92038. Neither brief is wrong about a fact;
 * they use two different criteria and only one of them is a property of the
 * matrix. This function reports the criterion it uses.
 */
export function rowsTheWorkerCannotPerform(
  matrix: Chapter44Matrix,
): readonly Chapter44Row[] {
  return matrix.rows.filter((row) => !cellPermits(row, 'WORKER'))
}

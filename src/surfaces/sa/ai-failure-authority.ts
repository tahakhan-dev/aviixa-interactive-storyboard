import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { OPEN_DECISION_IDS, type DecisionId } from '@/disclosure/decisions'
import { ROLES } from '@/domain/roles'
import {
  cellFromSource,
  columnKey,
  type ColumnCell,
  type ColumnKey,
  type ColumnMatrixRow,
  type RoleColumn,
} from '@/policy/columns'

/**
 * THE PLATFORM CONSOLE'S FAILURE-RESPONSE AUTHORITY MATRIX — and the module
 * the source never files it under.
 *
 * Section 43.3.5's matrix. Its caption is at L91280, its header at L91282, its
 * separator at L91283, and its data runs L91284 to L91298. Every one of those
 * lines is carried below VERBATIM and every field of every row is parsed out
 * of them, so nothing in this file is a second transcription of the source
 * that could drift from the first.
 *
 * ── THE ATTRIBUTION IS A BUILD INFERENCE AND IS RENDERED AS ONE ────────────
 * Chapter 43 was swept whole — it runs from its own chapter heading at L89813
 * to L91384, the last content line before chapter 44 opens at L91386 — and the
 * only module identifiers anywhere inside it are twelve `MOD-FL-*` tokens, all of them in
 * section 43.3.4's Frontline matrix. There is no `MOD-SA-*`, no `MOD-CC-*`, no
 * `MOD-STU-*` and no `MOD-DOH-*` token in the chapter at all. **The source
 * assigns this matrix to no module.**
 *
 * The identifier a build reaches for is `MOD-SA-07`, and the reach is not
 * baseless: the feature inventory does give that module the emergency pause
 * (L47803), and the screen register gives it `SCR-SA-08` (L48737). Neither of
 * those puts THIS matrix under it, and filing it there silently would be the
 * trap `DEC-GATE-001`'s several local homes exist to warn about — an
 * identifier acquiring content by proximity. So the attribution is carried as
 * `CONSOLE_AUTHORITY_ATTRIBUTION`, stated on screen, and labelled a
 * client-delegated choice under APP-012, which is a build approval and
 * therefore carries no frozen-source line.
 *
 * ── FOUR ROWS ARE UNDECIDED, NOT THREE, AND THE FOURTH IS THE INTERESTING
 *    ONE ───────────────────────────────────────────────────────────────────
 * Three rows read `Client Decision Required` in a ROLE CELL: site-scoped pause
 * at L91289, model quarantine at L91292, safe replay at L91294. A fourth is
 * undecided in its CLASSIFICATION rather than in any cell — the runaway-loop
 * kill switch at L91290, whose Platform Engineer cell grants and defers in one
 * breath and whose classification column says outright that the
 * emergency-application path is undecided.
 *
 * Neither of those two facts is flagged by hand. `undecidedCells` reads the
 * parsed outcome; `undecidedInClassification` re-parses the classification
 * column's own backticked fragments through the SAME parser the cells use, so
 * the source's spelling of that token lives in exactly one place in this tree
 * — `cellFromSource` in `@/policy/columns` — rather than being written out a
 * second time here. A hand-assigned discriminator that nothing checks will be
 * wrong silently; this one cannot disagree with the bytes it was read from.
 *
 * A fifth row cites an open decision without being undecided at all: provider
 * or model failover at L91291 reads `Allowed` for the root and grants the
 * other three, while its classification names `DEC-AIFAILOVER-001`. The
 * authority is settled and the POLICY is not, and collapsing those two into
 * one "undecided" flag would either disable a control the source grants or
 * hide a decision the source raises. They are kept apart.
 *
 * ── WHICH DECISIONS THIS FILE MAY DISCLOSE, AND WHICH IT MUST NOT ──────────
 * `DEC-AIFAILOVER-001`, `DEC-AIQUAR-001` and `DEC-AIREPLAY-001` are already in
 * the canon, so they are cited by identifier and their readings are rendered
 * by `DecisionDisclosure` from the one record each. Nothing is restated here.
 *
 * `DEC-AIPAUSE-001` and `DEC-KILL-001` are NOT in the canon — measured, not
 * assumed, by filtering the identifiers parsed out of the rows against
 * `OPEN_DECISION_IDS`. Writing local readings for them here would create the
 * second home `DecisionDisclosure` exists to prevent, so they are carried as
 * SEAMS instead, each naming a file that exists on disk today.
 *
 * `DEC-PAUSE-001` — pause INITIATION authority, which the two granted pause
 * rows depend on — is likewise not in the canon and is already disclosed
 * locally by `app/super-admin/platform-settings/PlatformSettingsScreen.tsx`.
 * This file names that existing home rather than opening a second one.
 *
 * ── PROVENANCE ─────────────────────────────────────────────────────────────
 * Everything here is a transcribed authority rule. Every rendering path over
 * it emits exactly one class and that class is `PROV-4`. Nothing in this file
 * is produced by an agent, so section 42.4's absolute rule is satisfied by
 * construction rather than by care.
 *
 * This module is data and one parser call per cell. It decides nothing.
 */

/* ==================================================================== *
 * THE FROZEN BYTES.
 * ==================================================================== */

export const CONSOLE_AUTHORITY_CAPTION_REF = 'L91280'

/** The line the header sits on. Every other line below is derived from it. */
export const CONSOLE_AUTHORITY_HEADER_LINE = 91_282

/**
 * The header, the separator, and the data rows, exactly as the frozen source
 * writes them. Nothing states how many data rows there are: the length is what
 * it is, and `tests/unit/sa-ai-failure-authority.test.ts` walks the frozen
 * bytes to prove this array is the whole table and stops where the table does.
 */
export const CONSOLE_AUTHORITY_SOURCE_LINES = [
  '| Control | Root Super Admin | Admin | Platform Engineer | Support | Classification |',
  '|---|---|---|---|---|---|',
  '| View incident, health, and queue telemetry | Allowed | Allowed | Allowed | Read-only | `SoW Fact — §8.1.2` |',
  '| Propose an engineering-class settings change | Allowed | Allowed | Allowed — maker only, never applies directly | Explicitly prohibited | `SoW Fact — §8.8.3` |',
  '| Approve an engineering-class change | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | `SoW Fact — §8.8.3` |',
  '| Per-tenant emergency pause | Allowed | Allowed with conditions — critical class requires root approval | Allowed with conditions — proposes only | Explicitly prohibited | `SoW Fact — §8.7.5, §8.8.3` |',
  '| Platform-wide emergency pause | Allowed | Allowed with conditions — root approval | Allowed with conditions — proposes only | Explicitly prohibited | `SoW Fact — §8.7.5, §8.8.3` |',
  '| Site-scoped pause | Client Decision Required | Client Decision Required | Client Decision Required | Explicitly prohibited | `Recommendation — R&D`, `DEC-AIPAUSE-001` |',
  '| Runaway-loop kill switch | Allowed | Allowed | Allowed with conditions — proposes, or applies under a declared emergency with post-hoc approval, subject to client decision | Explicitly prohibited | `SoW Fact — §8.7.1`; the emergency-application path is `Client Decision Required` |',
  '| Provider or model failover | Allowed | Allowed with conditions | Allowed with conditions — proposes only | Explicitly prohibited | `Recommendation — R&D`, `DEC-AIFAILOVER-001` |',
  '| Model quarantine | Client Decision Required | Client Decision Required | Client Decision Required | Explicitly prohibited | `Recommendation — R&D`, `DEC-AIQUAR-001` |',
  '| Rollback of a model, atom, agent, or package version | Allowed | Allowed with conditions | Allowed with conditions — proposes only | Explicitly prohibited | `SoW Fact — §8.8.3` |',
  '| Safe replay | Client Decision Required | Client Decision Required | Client Decision Required | Explicitly prohibited | `Recommendation — R&D`, `DEC-AIREPLAY-001` |',
  '| All-tenant broadcast | Allowed | Allowed with conditions — critical class, root approves | Explicitly prohibited | Explicitly prohibited | `SoW Fact — §8.8.3` |',
  '| Read tenant operational content | Allowed with conditions — only under a named access class | Allowed with conditions — only under a named access class | Allowed with conditions — only under a named access class | Allowed with conditions — read-only, time-boxed support session | `SoW Fact — §8.1.2, §8.15, §8.16` |',
  '| Resume a paused scope | Allowed | Allowed with conditions — separate audited act | Allowed with conditions — proposes only | Explicitly prohibited | `SoW Fact — §8.7.5` |',
  '| Close an incident | Allowed | Allowed | Allowed with conditions — only when reconciliation is complete | Explicitly prohibited | `Derived Clarification` |',
] as const

/* ==================================================================== *
 * THE COLUMNS — read off the header rather than typed a second time.
 * ==================================================================== */

/**
 * One pipe-delimited row to its trimmed fields. Throws on anything that is not
 * a fenced table row, because a row that does not split is a transcription
 * error and a silent skip would drop an authority cell.
 */
function splitTableRow(line: string): readonly string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    throw new Error(`"${line}" is not a fenced table row and cannot be a row of this matrix`)
  }
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((field) => field.trim())
}

const HEADER_FIELDS = splitTableRow(CONSOLE_AUTHORITY_SOURCE_LINES[0])

/**
 * The axis, verbatim. It is `Control` — not a role and not a surface — and
 * that is why this matrix is its own row vocabulary rather than a re-keying of
 * an existing one.
 */
export const CONSOLE_AUTHORITY_AXIS_HEADING = HEADER_FIELDS[0] ?? ''

/** The last column's heading, verbatim. Provenance about the row, not a permission. */
export const CONSOLE_AUTHORITY_CLASSIFICATION_HEADING = HEADER_FIELDS.at(-1) ?? ''

/**
 * The four role columns, RESOLVED against `@/domain/roles` by the header's own
 * words rather than assigned here. A header this build cannot resolve to a
 * registered role throws: the alternative is a column silently keyed on the
 * wrong person, which is the defect the resolution exists to prevent.
 */
export const CONSOLE_AUTHORITY_COLUMNS: readonly RoleColumn[] = HEADER_FIELDS.slice(1, -1).map(
  (header): RoleColumn => {
    const role = ROLES.find((candidate) => candidate.name === header)
    if (role === undefined) {
      throw new Error(
        `"${header}" is a column of the console failure-response matrix and no registered role ` +
          'carries that name. Resolve it in @/domain/roles rather than keying the column here.',
      )
    }
    return { kind: 'role', header, role: role.id }
  },
)

/* ==================================================================== *
 * THE ROWS.
 * ==================================================================== */

/** One cell, joined to its column, for a surface that may not hold policy. */
export interface RenderedAuthorityCell {
  readonly columnKey: ColumnKey
  /** The column header, verbatim. */
  readonly header: string
  /** The cell exactly as the frozen source writes it. What a screen prints. */
  readonly verbatim: string
  /** What the parser made of it. What a machine reads. */
  readonly outcome: ColumnCell['outcome']
}

export interface ConsoleAuthorityRow extends ColumnMatrixRow {
  /** The whole row, exactly as the frozen source writes it. */
  readonly verbatim: string
  /**
   * The row's cells in column order, resolved for a renderer.
   *
   * TWO REASONS IT EXISTS, AND EACH ONE IS A GATE THIS TASK WENT RED ON.
   *
   * THE TEXT. `ColumnCell.detail` is required never to be blank (L10238), so
   * `cellFromSource` fills a bare cell with a sentence of its own —
   * `Allowed, stated bare in the source`. Correct as a data field and false as
   * a rendered permission: eleven of this matrix's cells are the bare token,
   * and printing `detail` told a console operator that their authority is
   * "stated bare in the source". `verbatim` is the source's own words and is
   * what a screen prints; `outcome` is the parser's and is what a machine
   * reads. Neither can drift, because both come off the same field.
   *
   * THE RESOLUTION. `tests/coverage/contract-gates.test.ts` refuses a value
   * import from `@/policy` anywhere under `src/ui/` — components hold no
   * policy — and the panel first reached for `cellFor` and `columnKey` to do
   * exactly this join. Resolving here leaves the panel a printer, which is
   * what it should have been.
   */
  readonly renderedCells: readonly RenderedAuthorityCell[]
  /** The classification column, verbatim, backticks included. */
  readonly classification: string
  /** Every `DEC-*` identifier the row's own text names, in order of appearance. */
  readonly citedDecisions: readonly string[]
  /** Those of them the decision canon already holds. */
  readonly canonisedDecisions: readonly DecisionId[]
  /** Those of them it does not. Each one is a seam, never a local reading. */
  readonly uncanonisedDecisions: readonly string[]
  /** Columns whose CELL reads the client-decision token. */
  readonly undecidedCells: readonly ColumnKey[]
  /** Whether the CLASSIFICATION column defers, when no cell does. */
  readonly undecidedInClassification: boolean
  /**
   * Columns that GRANT and defer in the same cell — the cell's outcome is
   * permissive and its own stated condition still refers the answer to the
   * client. The kill switch's Platform Engineer cell is the case and it is
   * found here rather than declared.
   */
  readonly permissiveCellsDeferring: readonly ColumnKey[]
  /** Any of the three above. Derived; never stored beside them. */
  readonly undecided: boolean
  /**
   * Whether this control may render as an ENABLED affordance.
   *
   * ── WHY IT IS NOT `!undecided`, AND WHY THAT MATTERS BY EXACTLY ONE ROW ───
   * `undecided` answers "is the authority unsettled". Shippability answers a
   * different question — "may a working control be drawn" — and the two part
   * company on the provider-or-model-failover row (L91291). That row reads
   * `Allowed` for the root and grants the other three, and its classification
   * names no client-decision token, so `undecided` is FALSE for it. But its
   * classification carries `Recommendation — R&D`, `DEC-AIFAILOVER-001`: the
   * AUTHORITY is settled and the POLICY is not, and the source's own §43.4 row
   * for failover — **L91335**, opened, and it is the only one of the three —
   * puts it among the capabilities beyond §8.7.1. This cited "(L91337, L91335)"
   * and L91337 is the SAFE REPLAY row, a different capability with a different
   * decision (`DEC-AIREPLAY-001`); L91336 between them is model quarantine. A
   * working failover button is a control with no written rule for when it
   * fires, whether the substitute must pass its evaluation scenarios first, or
   * whether the tenant is told.
   *
   * So the answer is derived from BOTH halves of the row: its cells and its
   * classification. It is computed HERE, at the one input, and never at a call
   * site — `tests/unit/ai-controls-authority-shippability.test.ts` sweeps
   * `src/` and `app/` for any other file reading `undecidedCells`,
   * `permissiveCellsDeferring` or `undecidedInClassification`, because a
   * shippability re-derived per screen is a shippability that disagrees with
   * itself on the fifth screen.
   *
   * NOTHING ANYWHERE STATES HOW MANY ROWS ARE UNSHIPPABLE. The population is
   * `NOT_SHIPPABLE_AUTHORITY_ROWS` and its membership is asserted as a literal
   * list of row ids outside this module. A gate keyed on a number goes stale
   * the moment a row changes, and this build has shipped that defect twice.
   */
  readonly shippable: boolean
  /**
   * WHICH of the four mechanisms refused it, in the row's own terms, or
   * `null` where none did. The reason differs per row and a single flag would
   * tell an operator four different situations were one.
   */
  readonly notShippableReason: string | null
  /**
   * The whole of what a locked control says about this row, or `null` where the
   * row ships.
   *
   * ── WHY THE LABEL IS DERIVED AND NOT PASSED IN ────────────────────────────
   * Both call sites used to apply ONE literal to every unshippable row — the
   * panel "No authority settled", the incident console "Not available to
   * anyone" — beside a `reason` read off the row. On the
   * `provider-or-model-failover` row (L91291) that reason reads "the authority
   * is settled and the governing policy is an open decision", so one card
   * printed "No authority settled" over its own statement that the authority IS
   * settled, two paragraphs apart, and the two call sites disagreed with each
   * other on top of that. A fold applied to one branch is the defect shape;
   * the fix is that the label is not a caller's to choose.
   *
   * All three fields are produced in the same breath as `notShippableReason`,
   * off the same refusal, so they cannot part company with it or with each
   * other. A caller passes `controlId` and nothing else.
   */
  readonly notShippableLock: NotShippableLock | null
}

/**
 * What a locked control says about an unshippable row, in the row's own terms.
 * Exactly the three text props `LockedControl` takes beyond its label and id.
 */
export interface NotShippableLock {
  /** The state the control is fixed AT — the honest one for THIS refusal. */
  readonly settingValue: string
  /** Why it is locked, with the row printed verbatim rather than summarised. */
  readonly reason: string
  /** What is still open, named by identifier where the row names one. */
  readonly remains: string
}

/**
 * The four ways a row can fail to be shippable, in the order they are checked.
 * A row can trip more than one — the kill switch trips two — and the first that
 * applies is the one reported, because it is the most specific statement about
 * that row.
 *
 * `settingValue` travels WITH the reason rather than beside it. These are not
 * four spellings of one state: on three of the four the authority itself is
 * unsettled, and on the fourth it is settled and only the policy is open.
 */
const SHIPPABILITY_REFUSALS = [
  {
    applies: (row: RefusalInput) => row.undecidedCells.length > 0,
    reason: 'a role cell defers to the client',
    settingValue: 'No authority settled',
  },
  {
    applies: (row: RefusalInput) => row.permissiveCellsDeferring.length > 0,
    reason: 'a cell grants and defers in the same breath, and the classification defers with it',
    settingValue: 'Authority granted; the emergency path undecided',
  },
  {
    applies: (row: RefusalInput) => row.undecidedInClassification,
    reason: 'the classification defers while every role cell grants',
    settingValue: 'Authority granted; classification undecided',
  },
  {
    applies: (row: RefusalInput) => row.citedDecisions.length > 0,
    reason: 'the authority is settled and the governing policy is an open decision',
    settingValue: 'Authority settled; governing policy undecided',
  },
] as const

interface RefusalInput {
  readonly undecidedCells: readonly ColumnKey[]
  readonly permissiveCellsDeferring: readonly ColumnKey[]
  readonly undecidedInClassification: boolean
  readonly citedDecisions: readonly string[]
}

function shippabilityRefusal(row: RefusalInput): (typeof SHIPPABILITY_REFUSALS)[number] | null {
  return SHIPPABILITY_REFUSALS.find((refusal) => refusal.applies(row)) ?? null
}

/**
 * Does this fragment parse as the client-decision token?
 *
 * The classification column is prose with backticked fragments in it, and one
 * of those fragments is the same token the cells use. Re-spelling that token
 * here would be a closed vocabulary declared twice, which is this build's most
 * persistent defect, so the fragment goes through the tree's one source-cell
 * parser instead. `cellFromSource` throws on anything that is not one of the
 * nine tokens — `SoW Fact — §8.7.1` and `Recommendation — R&D` both do — and a
 * throw here means "not that token", which is exactly the question asked.
 */
function parsesAsClientDecision(fragment: string): boolean {
  try {
    return cellFromSource(fragment).outcome === 'clientDecisionRequired'
  } catch {
    return false
  }
}

/** Every backticked fragment of a classification cell, in order. */
function backtickedFragments(classification: string): readonly string[] {
  return [...classification.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? '')
}

/**
 * The row's id, DERIVED from the control it names. A hand-assigned key on
 * fifteen rows is fifteen chances to key a row to the wrong control, and
 * nothing downstream would notice; the covering test asserts the fifteen are
 * distinct, which is the property a derived key can actually lose.
 */
function rowId(control: string): string {
  return control
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const DECISION_TOKEN = /DEC-[A-Z0-9]+-\d+/g
const CANON_IDS: ReadonlySet<string> = new Set<string>(OPEN_DECISION_IDS)

function parseRow(line: string, lineNumber: number): ConsoleAuthorityRow {
  const fields = splitTableRow(line)
  if (fields.length !== HEADER_FIELDS.length) {
    throw new Error(
      `L${lineNumber} has ${String(fields.length)} fields and the header has ` +
        `${String(HEADER_FIELDS.length)}. A row that does not line up with its header cannot be ` +
        'read, and reading it anyway keys a cell to the wrong column.',
    )
  }
  const operation = fields[0] ?? ''
  const classification = fields.at(-1) ?? ''
  const sourceRef = `L${String(lineNumber)}`

  const cells: Record<string, ColumnCell> = {}
  const renderedCells: RenderedAuthorityCell[] = []
  const undecidedCells: ColumnKey[] = []
  const permissiveCellsDeferring: ColumnKey[] = []

  CONSOLE_AUTHORITY_COLUMNS.forEach((column, index) => {
    const text = fields[index + 1] ?? ''
    const cell = cellFromSource(text)
    const key = columnKey(column)
    cells[key] = cell
    renderedCells.push({
      columnKey: key,
      header: column.header,
      verbatim: text,
      outcome: cell.outcome,
    })
    if (cell.outcome === 'clientDecisionRequired') {
      undecidedCells.push(key)
    } else if (/client decision/i.test(cell.detail)) {
      permissiveCellsDeferring.push(key)
    }
  })

  const citedDecisions = [...new Set(line.match(DECISION_TOKEN) ?? [])]
  const canonisedDecisions = citedDecisions.filter((id): id is DecisionId => CANON_IDS.has(id))
  const uncanonisedDecisions = citedDecisions.filter((id) => !CANON_IDS.has(id))
  const undecidedInClassification =
    undecidedCells.length === 0 && backtickedFragments(classification).some(parsesAsClientDecision)

  const refusal = shippabilityRefusal({
    undecidedCells,
    permissiveCellsDeferring,
    undecidedInClassification,
    citedDecisions,
  })

  return {
    id: rowId(operation),
    operation,
    cells,
    sourceRef,
    verbatim: line,
    renderedCells,
    classification,
    citedDecisions,
    canonisedDecisions,
    uncanonisedDecisions,
    undecidedCells,
    undecidedInClassification,
    permissiveCellsDeferring,
    undecided:
      undecidedCells.length > 0 ||
      undecidedInClassification ||
      permissiveCellsDeferring.length > 0,
    shippable: refusal === null,
    notShippableReason: refusal?.reason ?? null,
    notShippableLock:
      refusal === null
        ? null
        : {
            settingValue: refusal.settingValue,
            reason:
              `Cannot ship as an enabled control: ${refusal.reason}. The row, verbatim: ${line}`,
            // NO ", at L#####." SUFFIX ON THE FIRST BRANCH — a bare blueprint
            // line locator rendered as page content via `LockedControl`'s
            // `remains` prop, §8.6.2, and redundant with the `[${sourceRef}]`
            // badge `AiFailureAuthorityPanel` already renders for this row.
            remains:
              citedDecisions.length === 0
                ? 'Undecided in the classification column rather than in a role cell.'
                : `Open decisions named on this row: ${citedDecisions.join(', ')}.`,
          },
  }
}

/** The first data line. The header is two lines above it, the separator one. */
export const CONSOLE_AUTHORITY_FIRST_DATA_LINE = CONSOLE_AUTHORITY_HEADER_LINE + 2

export const CONSOLE_AUTHORITY_ROWS: readonly ConsoleAuthorityRow[] =
  CONSOLE_AUTHORITY_SOURCE_LINES.slice(2).map((line, index) =>
    parseRow(line, CONSOLE_AUTHORITY_FIRST_DATA_LINE + index),
  )

export function consoleAuthorityRow(id: string): ConsoleAuthorityRow {
  const row = CONSOLE_AUTHORITY_ROWS.find((candidate) => candidate.id === id)
  if (row === undefined) {
    throw new Error(`"${id}" is not a row of the console failure-response authority matrix`)
  }
  return row
}

/** Every row a reader must not be shown a working control for. Derived. */
export const UNDECIDED_AUTHORITY_ROWS: readonly ConsoleAuthorityRow[] =
  CONSOLE_AUTHORITY_ROWS.filter((row) => row.undecided)

/**
 * Every row that may not render as an enabled control. A superset of
 * `UNDECIDED_AUTHORITY_ROWS` by exactly the failover row — see `shippable` for
 * why the two are not one flag. Derived, and nothing states its size.
 */
export const NOT_SHIPPABLE_AUTHORITY_ROWS: readonly ConsoleAuthorityRow[] =
  CONSOLE_AUTHORITY_ROWS.filter((row) => !row.shippable)

/**
 * Every `DEC-*` the unshippable rows name, deduplicated and in row order.
 *
 * DERIVED HERE RATHER THAN AT THE SCREEN THAT PRINTS IT. The incident console
 * needs this list to say which of the governing values behind those rows are
 * themselves unset, and it used to carry a hand-typed array of three
 * identifiers with the word "Three" in the sentence beside it — inside the same
 * sentence claiming no number is written anywhere. Deriving it here also keeps
 * `citedDecisions` from being read outside this module, which is what
 * `tests/unit/ai-controls-authority-shippability.test.ts` sweeps for.
 */
export const NOT_SHIPPABLE_CITED_DECISIONS: readonly string[] = Array.from(
  new Set(
    CONSOLE_AUTHORITY_ROWS.filter((row) => !row.shippable).flatMap((row) => row.citedDecisions),
  ),
)

/** Every row that MAY render as an enabled control. The counterweight. */
export const SHIPPABLE_AUTHORITY_ROWS: readonly ConsoleAuthorityRow[] =
  CONSOLE_AUTHORITY_ROWS.filter((row) => row.shippable)

/**
 * Every `DEC-*` this matrix names that the canon does not hold, deduplicated
 * across rows. Each one is a seam below, and none of them is disclosed here.
 */
export const UNCANONISED_DECISIONS: readonly string[] = Array.from(
  new Set(CONSOLE_AUTHORITY_ROWS.flatMap((row) => row.uncanonisedDecisions)),
)

/* ==================================================================== *
 * THE ATTRIBUTION, THE CROSS-REFERENCES, AND THE SEAMS.
 * ==================================================================== */

/**
 * What the source does and does not assign this matrix to, in the words the
 * panel prints. Not a hedge — a measurement, with the sweep that produced it
 * repeated by the covering test against the frozen bytes.
 */
export const CONSOLE_AUTHORITY_ATTRIBUTION = {
  caption:
    "Authority matrix for the console's failure-response controls",
  captionRef: CONSOLE_AUTHORITY_CAPTION_REF,
  whatTheSourceAssigns:
    'Nothing. Chapter 43 was swept end to end and the only module identifiers anywhere in it are ' +
    "twelve Frontline ones, every one of them inside section 43.3.4's Frontline matrix. No " +
    'Super Admin, Command Center, Studio or Hub module identifier occurs in the chapter at all, ' +
    'and this matrix sits under a section heading that names no module.',
  theIdentifierABuildWouldReachFor: 'MOD-SA-07',
  whyThatReachIsNotTheSource:
    'The feature inventory does give `MOD-SA-07` the emergency pause (L47803) and the screen ' +
    'register does give it `SCR-SA-08` (L48737), so the reach is not baseless. Neither line puts ' +
    'this matrix under that module, and an identifier that acquires content by proximity is how ' +
    'a build inference becomes a source claim nobody can trace back.',
  howThisBuildRendersIt:
    'Filed under no module, attributed to the section that carries it, and labelled a ' +
    'client-delegated choice under APP-012 rather than presented as something the source settled.',
} as const

/**
 * The decisions that govern a row without being named in it. A cross-reference
 * is a reading of the source, so it is written out with the line it is read
 * from rather than derived — and it is a POINTER, never a second disclosure.
 */
export interface AuthorityCrossReference {
  /** The row it bears on, by derived id. */
  readonly rowId: string
  readonly decision: string
  /** The line that ties the decision to this control. */
  readonly sourceRef: string
  readonly reading: string
}

export const CONSOLE_AUTHORITY_CROSS_REFERENCES = [
  {
    rowId: 'runaway-loop-kill-switch',
    decision: 'DEC-KILL-001',
    sourceRef: 'L87864',
    reading:
      "Section 40.15's control table gives the kill switch no scope and no approval class and " +
      'refers both to this decision. The authority row grants the control while the decision ' +
      'that would say what it does is still open, which is why the row renders inoperable rather ' +
      'than as a working button.',
  },
  {
    rowId: 'per-tenant-emergency-pause',
    decision: 'DEC-PAUSE-001',
    sourceRef: 'L87862',
    reading:
      'Pause initiation authority is undecided. It is disclosed already by ' +
      '`app/super-admin/platform-settings/PlatformSettingsScreen.tsx`, and this panel points at ' +
      'that home rather than opening a second one.',
  },
  {
    rowId: 'platform-wide-emergency-pause',
    decision: 'DEC-PAUSE-001',
    sourceRef: 'L87862',
    reading:
      'The same undecided initiation authority governs the platform-wide scope. Pointed at, not ' +
      'restated.',
  },
] as const satisfies readonly AuthorityCrossReference[]

/**
 * A half this task may not build, with the file that owns it.
 *
 * `owner` is a repository-relative path and the covering test opens it. A seam
 * naming a file nobody can open is a declared abstention that cannot be
 * followed up, which is the same thing as an oversight.
 */
export interface AuthoritySeam {
  readonly id: string
  readonly whatIsMissing: string
  readonly owner: string
  readonly ownerTask: string
}

export const CONSOLE_AUTHORITY_SEAMS = [
  {
    id: 'canon-record-site-scoped-pause',
    // ANSWERED by slice 11 wave 5 registry closure, and the answer is NOT a
    // registration. This seam's plan was sound — write no local readings here,
    // so that wave 5 could register the decision in the canon without creating
    // a second home. It was defeated by a second local home landing first:
    // `src/ai/controls/decisions.ts` holds the readings and THROWS at module
    // load if the identifier becomes a canon member, so the registration and
    // the deletion of that record are one atomic change, and its other half is
    // in a wave-3 module outside wave 5's path list. Handed back as a paired
    // change rather than shipped as half of one. The verdict and its reason
    // live in `src/coverage/uninventoried.ts`.
    whatIsMissing:
      'OPEN, WITH A RECORDED VERDICT. `DEC-AIPAUSE-001` is named by the site-scoped pause row ' +
      'and the decision canon does not hold it. This panel therefore renders the row inoperable ' +
      'and prints the identifier and the row verbatim, and writes no local readings — a second ' +
      'home for one decision is the defect the canon exists to prevent. Wave 5 examined it and ' +
      'declined to register it, because the readings now live in ' +
      '`src/ai/controls/decisions.ts` and registering without deleting them there would create ' +
      'exactly that second home. See `CANON_CONSOLIDATION_VERDICTS` in ' +
      '`src/coverage/uninventoried.ts`, which gates the non-membership this row asserts.',
    owner: 'src/disclosure/decisions.ts',
    ownerTask:
      'examined by slice 11 wave 5 registry closure and handed back as a paired change with ' +
      'src/ai/controls/decisions.ts, which must drop LOCAL_OPEN_DECISIONS in the same commit',
  },
  {
    id: 'canon-record-kill-switch',
    // Same answer, same reason. See the note above.
    whatIsMissing:
      'OPEN, WITH A RECORDED VERDICT. `DEC-KILL-001` governs the kill switch through section ' +
      '40.15 rather than through this matrix, and the canon does not hold it either. Same ' +
      'treatment, same reason, and the same wave-5 verdict: handed back rather than registered, ' +
      'because its readings are held locally by a module outside that task\'s path list.',
    owner: 'src/disclosure/decisions.ts',
    ownerTask:
      'examined by slice 11 wave 5 registry closure and handed back as a paired change with ' +
      'src/ai/controls/decisions.ts, which must drop LOCAL_OPEN_DECISIONS in the same commit',
  },
  {
    id: 'console-mount',
    // CLOSED. This seam read "No route mounts this panel" and that stopped
    // being true when `app/super-admin/ai-incidents/` shipped. The row is kept
    // rather than deleted because a closed seam is the record that the
    // abstention was deliberate and was followed up — deleting it leaves a
    // reader unable to tell a mounted panel from one that was never seamed.
    whatIsMissing:
      'CLOSED. This panel is mounted by `app/super-admin/ai-incidents/AiIncidentConsoleScreen.tsx`, ' +
      'reached from the route of the same name and linked from the console index in the file named ' +
      'below. The route slug itself is a build decision — the frozen source carries no URL ' +
      'notation for this surface at all — and the screen renders that as a client-delegated choice ' +
      'under APP-012 above its first control.',
    owner: 'app/super-admin/SaConsoleShell.tsx',
    ownerTask: 'closed by slice 11 wave 3, the pause / kill / rollback console and its incident route',
  },
] as const satisfies readonly AuthoritySeam[]

/* ==================================================================== *
 * PROVENANCE.
 * ==================================================================== */

/**
 * The one class every rendering path over this module emits. A transcribed
 * authority rule is a deterministic rule; no agent produced any of it, and no
 * path here may describe it as live artificial intelligence.
 */
export const CONSOLE_AUTHORITY_PROVENANCE: ProvenanceClassId = 'PROV-4'

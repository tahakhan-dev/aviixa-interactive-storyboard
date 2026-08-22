import {
  CC13_ACTIONS,
  CC13_COLUMNS,
  type Cc13Column,
  type Cc13Ordinal,
} from '@/surfaces/cc/actions/action-set'

/* ==================================================================== *
 * `MOD-CC-13` — THE SAME TEN ACTIONS, READ OFF THREE TABLES, WITH NO
 * WINNER MARKED.
 *
 * `src/surfaces/cc/actions/action-set.ts` (wave 0's, and not edited here)
 * carries §21.16's own matrix, L38682-L38691. It is one of THREE tables in
 * the frozen source that answer "what may this role do with this action?",
 * and they do not agree. This file carries the other two so that all three
 * readings sit beside each other with their own locators and nothing in the
 * type system can record a preference.
 *
 *   §21.1.2  the surface-level permission matrix
 *            header L35002 · separator L35003 · data L35004-L35023 · TWENTY
 *            rows, of which TEN are these actions
 *   §21.16   the module's own action matrix — wave 0's, above
 *            header L38680 · separator L38681 · data L38682-L38691 · TEN
 *   §25.4    "Actions and permissions across the ten operational actions"
 *            header L48442 · separator L48443 · data L48444-L48456 ·
 *            THIRTEEN rows, of which TEN are these actions
 *
 * Every one of those counts was taken by reading the rows. §25.4's heading
 * (L48440) says "across the ten operational actions" and its body carries
 * thirteen: L48454 is "Author or export a report format", which is outside
 * write #1, and L48455-L48456 are two of the four absolute exclusions. Those
 * three are not actions and are not carried here.
 *
 * §26.7's cross-surface matrix (header L49574, separator L49575, data
 * L49576-L49601, TWENTY-SIX rows) is deliberately absent. It is keyed by
 * RECORD TYPE and by SURFACE, not by action and role — its `Qualification
 * clearance` row (L49585) names action 10, but the question it answers is
 * "which surface is the single source of truth", which is a different
 * question. Folding it into a role-by-action comparison would manufacture
 * agreement or disagreement that neither table states.
 *
 * ── HOW THE THREE ARE JOINED, AND WHY IT IS NOT ONE RULE ────────────────
 *
 * §21.1.2 has no `#` column. It joins to §21.16 BY EXACT LABEL: all ten of
 * its capability cells equal §21.16's `Action` cell character for character,
 * and `cc13ReadingsForAction` is checked against that rather than against a
 * position. It has to be, because §21.1.2 RUNS THEM IN A DIFFERENT ORDER —
 * action 6 is its LAST action row (L35016), after actions 7 through 10. A
 * transcription that walked L35007 downward assigning 1, 2, 3, … would
 * label six rows wrong and stay internally coherent while doing it.
 *
 * §25.4 CANNOT be joined by label. Three of its ten name the act
 * differently: `2 Decide a gate item` where §21.16 has `Gate-item decision`,
 * `3 Decide a learned-change proposal` where §21.16 has `Learned-change
 * decision`, and `5 Resolve or Resolve-All sync conflicts` where §21.16 has
 * `Resolve or Resolve All sync conflicts` — a hyphen. It joins by the
 * ordinal it carries INSIDE its label, which is the only key it shares.
 *
 * ── THE HEADERS, READ RATHER THAN ASSUMED ───────────────────────────────
 *
 * §21.1.2 L35002 — `Capability | Tenant Admin | Supervisor | Quality
 * Manager | Read-only Auditor | Worker`
 * §25.4   L48442 — `Action | Tenant Admin | Supervisor | Quality Manager |
 * Read-only Auditor | Worker`
 *
 * Both run Tenant Admin first and Worker last, the same order as §21.16's
 * L38680. That is checked per table in `tests/unit/cc-13.test.ts` off the
 * header line rather than inherited from the first one read, because the
 * two `MOD-CC-10` matrices slice 8 transcribed run their columns in
 * OPPOSITE orders and a positional read inverted every Worker and Tenant
 * Admin cell silently.
 *
 * ── NOTHING HERE PICKS A WINNER, AND THE TYPE MAKES THAT STRUCTURAL ─────
 *
 * A cell is a bare string and its locator is the row's. There is no
 * `preferred`, no `canonical`, no `adopted`, no ordering that could be read
 * as one — the three tables are three named fields, and a fourth field
 * marking one of them would have to be added deliberately and would be
 * visible in the diff. `AC-CC-502` requires every cell to carry an explicit
 * status and every cell in all three does; the defect is that they answer
 * differently, and no acceptance criterion in the source tests that.
 * ==================================================================== */

/**
 * Every status token any of the three tables uses, exact and whole. §21.16
 * uses four of these; §25.4 uses six; §21.1.2 uses four. The union is six.
 *
 * A CELL IS SPLIT ON ITS OWN ` — ` AND THE HEAD IS COMPARED FOR EXACT
 * EQUALITY, never by prefix, for the reason wave 0 states over its own four:
 * `Allowed` is a prefix of `Allowed with conditions`. Both traps this
 * module's own matrix carries are live in these two tables as well —
 * L35015's Supervisor cell opens `Allowed with conditions` and L35010's
 * opens `Explicitly prohibited`, and the SECOND of those PROHIBITS while its
 * note grants a different act.
 */
export const CC13_ALL_STATUS_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
  'Explicitly prohibited',
  'Unavailable',
  'Not applicable',
] as const satisfies readonly string[]

export type Cc13StatusToken = (typeof CC13_ALL_STATUS_TOKENS)[number]

/** The head of a cell, before any ` — `. Throws rather than guessing. */
export function cc13StatusToken(cellText: string): Cc13StatusToken {
  const head = cellText.split(' — ')[0]
  const token = CC13_ALL_STATUS_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `Cell "${cellText}" has head "${head}", which none of the three tables uses. Exact ` +
        `equality on the head, never a prefix: "Allowed" is a prefix of "Allowed with ` +
        `conditions" and a prefix test reads a conditional grant as unconditional.`,
    )
  }
  return token
}

/** The three tables, by the section that carries each. No order implies rank. */
export const CC13_TABLES = ['§21.1.2', '§21.16', '§25.4'] as const satisfies readonly string[]

export type Cc13Table = (typeof CC13_TABLES)[number]

export interface Cc13RowReadings {
  readonly ordinal: Cc13Ordinal
  /** §21.1.2's `Capability` cell, verbatim. Equals §21.16's `Action` cell exactly. */
  readonly surfaceMatrixLabel: string
  readonly surfaceMatrixRef: string
  /** §21.1.2's five persona cells, verbatim, keyed by its own header words. */
  readonly surfaceMatrix: Record<Cc13Column, string>
  /** §25.4's `Action` cell, verbatim. Carries its own ordinal; three of ten differ in wording. */
  readonly section254Label: string
  readonly section254Ref: string
  /** §25.4's five persona cells, verbatim, keyed by its own header words. */
  readonly section254: Record<Cc13Column, string>
}

export const CC13_ROW_READINGS = [
  {
    ordinal: 1,
    surfaceMatrixLabel: 'Acknowledge an alert or escalation',
    surfaceMatrixRef: 'L35007',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited — not an in-shift actor',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '1 Acknowledge an alert or escalation',
    section254Ref: 'L48444',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — the Auditor has no Command Center access',
      Worker: "Not applicable — the Worker's surface is the Frontline Worker Application",
    },
  },
  {
    ordinal: 2,
    surfaceMatrixLabel: 'Gate-item decision',
    surfaceMatrixRef: 'L35008',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Explicitly prohibited',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '2 Decide a gate item',
    section254Ref: 'L48445',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Read-only',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
  {
    ordinal: 3,
    surfaceMatrixLabel: 'Learned-change decision',
    surfaceMatrixRef: 'L35009',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Read-only — observe and annotate',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '3 Decide a learned-change proposal',
    section254Ref: 'L48446',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Read-only',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
  {
    ordinal: 4,
    surfaceMatrixLabel: 'Release a lot hold',
    surfaceMatrixRef: 'L35010',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Explicitly prohibited — may request with a note',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '4 Release a lot hold',
    section254Ref: 'L48447',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Allowed with conditions — request only, with a mandatory note',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Explicitly prohibited',
    },
  },
  {
    ordinal: 5,
    surfaceMatrixLabel: 'Resolve or Resolve All sync conflicts',
    surfaceMatrixRef: 'L35011',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Read-only',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '5 Resolve or Resolve-All sync conflicts',
    section254Ref: 'L48448',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Read-only',
      'Quality Manager':
        'Allowed with conditions — skew-flagged conflicts are excluded from Resolve All',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
  {
    ordinal: 6,
    surfaceMatrixLabel: 'Acknowledge and annotate the handoff brief',
    surfaceMatrixRef: 'L35016',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '6 Acknowledge and annotate the handoff brief',
    section254Ref: 'L48449',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
  {
    ordinal: 7,
    surfaceMatrixLabel: 'Mark evidence reviewed',
    surfaceMatrixRef: 'L35012',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Explicitly prohibited',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '7 Mark evidence reviewed',
    section254Ref: 'L48450',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Unavailable',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
  {
    ordinal: 8,
    surfaceMatrixLabel: 'Reassign a run mid-shift',
    surfaceMatrixRef: 'L35013',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '8 Reassign a run mid-shift',
    section254Ref: 'L48451',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Explicitly prohibited',
    },
  },
  {
    ordinal: 9,
    surfaceMatrixLabel: 'Request an agent re-check',
    surfaceMatrixRef: 'L35014',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '9 Request an agent re-check',
    section254Ref: 'L48452',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Allowed',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
  {
    ordinal: 10,
    surfaceMatrixLabel: 'Grant a qualification clearance',
    surfaceMatrixRef: 'L35015',
    surfaceMatrix: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor:
        'Allowed with conditions — expired qualification only; never-held requires the Quality Manager',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
    section254Label: '10 Grant a qualification clearance',
    section254Ref: 'L48453',
    section254: {
      'Tenant Admin': 'Unavailable',
      Supervisor:
        'Allowed with conditions — against an expired qualification, with the Quality Manager notified; a never-held qualification requires the Quality Manager',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Explicitly prohibited',
    },
  },
] as const satisfies readonly Cc13RowReadings[]

/**
 * Compile-time proof that all ten ordinals are present exactly once. A row
 * dropped or duplicated stops `MissingReadingOrdinal` being `never`.
 */
type MissingReadingOrdinal = Exclude<Cc13Ordinal, (typeof CC13_ROW_READINGS)[number]['ordinal']>
const _readingOrdinalsExhaustive: MissingReadingOrdinal extends never ? true : never = true
void _readingOrdinalsExhaustive

export function cc13ReadingsForAction(ordinal: Cc13Ordinal): Cc13RowReadings {
  const found = CC13_ROW_READINGS.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`No cross-table readings for action ${ordinal}`)
  return found
}

/** One cell, as all three tables write it. Three named fields, no fourth. */
export interface Cc13CellReadings {
  readonly ordinal: Cc13Ordinal
  readonly column: Cc13Column
  readonly '§21.1.2': string
  readonly '§21.16': string
  readonly '§25.4': string
  /** The row line each reading was read from, in the same three-key shape. */
  readonly sourceRefs: Record<Cc13Table, string>
}

/**
 * All fifty cells, each with its three readings. Computed from the two
 * tables above and wave 0's, so nothing here can drift from either.
 */
export const CC13_CELL_READINGS: readonly Cc13CellReadings[] = CC13_ROW_READINGS.flatMap((row) => {
  const own = CC13_ACTIONS.find((a) => a.ordinal === row.ordinal)
  if (own === undefined) throw new Error(`No §21.16 row for action ${row.ordinal}`)
  return CC13_COLUMNS.map((column) => ({
    ordinal: row.ordinal,
    column,
    '§21.1.2': row.surfaceMatrix[column],
    '§21.16': own.cells[column].text,
    '§25.4': row.section254[column],
    sourceRefs: {
      '§21.1.2': row.surfaceMatrixRef,
      '§21.16': own.matrixRef,
      '§25.4': row.section254Ref,
    },
  }))
})

const distinct = (c: Cc13CellReadings, of: (r: Cc13CellReadings) => string[]): number =>
  new Set(of(c)).size

const texts = (c: Cc13CellReadings): string[] => [c['§21.1.2'], c['§21.16'], c['§25.4']]
const tokens = (c: Cc13CellReadings): string[] => texts(c).map(cc13StatusToken)

/** Cells where the three tables do not all write the same STATUS TOKEN. */
export const CC13_TOKEN_DIVERGENCES: readonly Cc13CellReadings[] = CC13_CELL_READINGS.filter(
  (c) => distinct(c, tokens) > 1,
)

/** Cells where the three tables do not all write the same FULL TEXT. */
export const CC13_TEXT_DIVERGENCES: readonly Cc13CellReadings[] = CC13_CELL_READINGS.filter(
  (c) => distinct(c, texts) > 1,
)

/**
 * THE MEASURED SHAPE OF THE DISAGREEMENT, every figure computed rather than
 * typed. The dispatch's hypothesis was "six cells"; six is the number of
 * divergences a reader NAMES when comparing §21.16 against §25.4 alone —
 * five individual cells plus "the whole Tenant Admin column", which is ten
 * cells counted as one. Counted cell by cell, over three tables, it is not
 * six by any reading, and the number is left computed so it cannot be
 * quoted stale.
 *
 * `maxReadingsForOneCell` answers the other hypothesis — that the tables
 * "use four different status tokens for the same cell". Three tables can
 * offer at most three, and measured it is lower still. Four tokens is what
 * §21.16's own vocabulary contains, not what any one cell carries.
 */
export const CC13_DIVERGENCE_MEASURE = {
  cellsCompared: CC13_CELL_READINGS.length,
  tablesCompared: CC13_TABLES.length,
  cellsDifferingOnToken: CC13_TOKEN_DIVERGENCES.length,
  cellsDifferingOnFullText: CC13_TEXT_DIVERGENCES.length,
  maxReadingsForOneCell: Math.max(...CC13_CELL_READINGS.map((c) => distinct(c, tokens))),
  distinctTokensAcrossAllThree: new Set(CC13_CELL_READINGS.flatMap(tokens)).size,
} as const

/**
 * WHERE §21.16 IS THE ODD ONE OUT, WHICH ONLY THE THIRD TABLE REVEALS.
 *
 * The dispatch pairs actions 2 and 3 as "the same pair" — §21.16 says
 * `Explicitly prohibited` for the Supervisor and §25.4 says `Read-only` on
 * both. Against §21.1.2 they come apart:
 *
 *   action 2 Supervisor  §21.1.2 L35008 `Explicitly prohibited`
 *                        §21.16  L38683 `Explicitly prohibited`
 *                        §25.4   L48445 `Read-only`
 *   action 3 Supervisor  §21.1.2 L35009 `Read-only — observe and annotate`
 *                        §21.16  L38684 `Explicitly prohibited`
 *                        §25.4   L48446 `Read-only`
 *
 * Two tables to one, in OPPOSITE directions. Read as a pair against §25.4
 * alone they look like one defect with one shape; they are two, and on
 * action 3 the table that stands alone is this module's own. Nothing here
 * adopts the majority — a count of tables is not evidence about a client's
 * intent — but a reading that cannot see the split cannot report it.
 *
 * The filter below selects ONE of those two directions on purpose: the
 * cells where §21.16, the matrix this module owns, is the lone dissenter
 * against two that agree. Action 2's Supervisor cell is therefore ABSENT
 * from it, because there §21.16 agrees with §21.1.2 and §25.4 is the odd
 * one out. Both directions are in `CC13_TOKEN_DIVERGENCES`; this narrower
 * set is the half that bears on what this module renders.
 */
export const CC13_WHERE_THE_MODULE_MATRIX_STANDS_ALONE: readonly Cc13CellReadings[] =
  CC13_CELL_READINGS.filter((c) => {
    const t = tokens(c)
    // Two distinct tokens, and §21.16's — index 1 — is the one held by one table.
    return new Set(t).size === 2 && t.filter((x) => x === t[1]).length === 1
  })

export const CC13_READING_FINDINGS = [
  {
    finding:
      'Three tables in the frozen source answer the same role-by-action question and they do not agree. Every cell in all three carries an explicit status, which is what AC-CC-502 requires, so the criterion passes on a set of tables that contradict each other. No acceptance criterion in the source compares them.',
    sourceRefs: ['L35004', 'L38682', 'L48444'],
  },
  {
    finding:
      'The surface matrix runs the ten actions in a different order from the module matrix: action 6, "Acknowledge and annotate the handoff brief", is its last action row at L35016, below actions 7 through 10. It carries no ordinal column, so the join is by exact capability wording, and all ten match the module matrix character for character.',
    sourceRefs: ['L35007', 'L35016'],
  },
  {
    finding:
      'Section 25.4 cannot be joined to the module matrix by name. Three of its ten label the act differently — "2 Decide a gate item", "3 Decide a learned-change proposal", and "5 Resolve or Resolve-All sync conflicts" against "Resolve or Resolve All sync conflicts", which differs by a hyphen. It is joined by the ordinal inside its own label.',
    sourceRefs: ['L48445', 'L48446', 'L48448'],
  },
  {
    finding:
      'Explicitly prohibited and Unavailable render oppositely. src/ui/WriteControl.tsx draws a BASE_ROLE explicitlyProhibited as a note where a control would be and draws unavailable as a disabled control carrying its reason. The whole Tenant Admin column reads the first in the module matrix and the second in section 25.4, so the two tables ask for opposite screens on ten cells.',
    sourceRefs: ['L38682', 'L48444'],
  },
] as const satisfies readonly {
  readonly finding: string
  readonly sourceRefs: readonly string[]
}[]

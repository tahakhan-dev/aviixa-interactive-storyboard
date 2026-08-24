import { CC_MODULE_SPINE, type CcModuleId } from '@/surfaces/cc/modules'
import {
  FIVE_SURFACE_OBLIGATIONS,
  OVERLAY_PROVENANCE,
  overlayJourneyCode,
  type OverlayRow,
  type OverlayTable,
  type SurfaceAiOverlay,
} from '@/ai/five-surface/overlay'

/**
 * `SURF-CC` — THE CLIENT COMMAND CENTER'S AI-DEGRADATION OVERLAY.
 *
 * TRANSCRIBED, and the line that makes it so is the header at **L91080**:
 * `| Command Center module | Behaviour during an artificial-intelligence
 * failure | Classification |`, under the caption `**Behaviour matrix by
 * module.**` at L91078, in §43.3.3 (heading L91023). The rule at L91081 and
 * thirteen content rows at L91082-L91094 — COUNTED from the header.
 *
 * ── THE AXIS IS A MODULE BY NAME, AND THE IDENTIFIER IS THIS BUILD'S ──────
 * §43.3.3 was swept end to end: ZERO occurrences of `MOD-CC`. The table names
 * modules in words and never once by identifier. So the identifier beside each
 * row is SUPPLIED BY THIS BUILD, and that is said where it renders.
 *
 * The mapping is CHECKED, not hand-written. `resolveByName` looks each axis
 * cell up in `CC_MODULE_SPINE` by exact string equality and throws on a miss,
 * so a row whose name drifts from the registry fails at module load with the
 * name in the message rather than rendering beside the wrong identifier. A
 * hand-typed pairing would have been thirteen chances to put `MOD-CC-06` next
 * to `MOD-CC-07`'s behaviour, and nothing would have caught it.
 *
 * The join is sound because the registry at L35186-L35198 carries the same
 * thirteen strings verbatim and IN THE SAME ORDER, `MOD-CC-01` Live shift
 * board through `MOD-CC-13` Operational actions, the closed set of ten. The
 * covering test asserts both the string equality AND the positional agreement
 * against the frozen bytes, because either alone can hold while the other
 * fails: equality alone would pass a reordered table, and position alone would
 * pass a renamed row.
 *
 * ── TWO ROWS NAME A DECISION THE CANON DOES NOT HOLD ─────────────────────
 * L91092's classification cell carries `DEC-REPORT-001` — "identity of the
 * five sets open under" — and it is not a member of the exported `DecisionId`
 * union. Disclosed locally in `CC_UNCANONISED_DECISIONS`, which is RENDERED
 * through `sourceNotes` on the overlay below, and reported as a seam. It was
 * not rendered when this sentence was first written: the record had exactly one
 * occurrence in the tree, its own declaration, while this comment said it was
 * disclosed. The cell renders verbatim, classification included.
 *
 * ── THIS SURFACE DOES DISPLAY AN AVAILABILITY STATE, SO PARITY BINDS ─────
 * Unlike the Studio, the Command Center is IN scope for `AC-42-301` (L89400):
 * L91089's agent activity panel "renders unavailability honestly, never empty",
 * and §42.6 puts two acts here outright — the human gate at L89702 and
 * cancellation with a reason at L89706.
 *
 * ── `AC-42-303` IS A PAUSE-VERSUS-OUTAGE RULE, NOT A PAUSE-SCOPE RULE ────
 * MEASURED: `AC-42-303` occurs on EXACTLY ONE LINE, **L89402**, and its own
 * reason clause names its subject — "`AIMODE-13` and `AIMODE-14` are
 * distinguishable from `AIMODE-03` and `AIMODE-05` on every surface that shows
 * a state, because A PAUSED PLATFORM AND AN UNREACHABLE ONE call for different
 * human responses". So it separates the two PAUSE modes from the two OUTAGE
 * modes. It does NOT require the two pause SCOPES to be distinguishable from
 * each other, and any paraphrase putting one pause scope on each side of the
 * criterion has swapped its subject. `TEST-42-302` at L89409 corroborates the
 * reading in its own name: "Pause-versus-outage test".
 *
 * That is the rule this overlay obeys: a Command Center reader must never see
 * `AIMODE-13` or `-14` rendered the way `AIMODE-03` or `-05` is, because one
 * calls for waiting on a platform act and the other for chasing connectivity.
 *
 * ── AND THE SCOPE DISTINCTION COMES FROM SOMEWHERE ELSE ENTIRELY ─────────
 * Tenant pause versus platform pause cannot be settled from the §42.3 mode
 * matrix: `AI_MODE_ROWS` gives `AIMODE-13` and `AIMODE-14` the IDENTICAL
 * `workerLabel`, "Live coaching paused by the platform". What separates them is
 * the failure catalogue's own message cells:
 *
 *   `FAIL-AI-41` Emergency pause, platform-wide (L90513) — tenant web surfaces
 *     read "Agents paused by the platform. Deterministic checks are
 *     unaffected."; operational band Critical.
 *   `FAIL-AI-42` Emergency pause, per tenant (L90514) — tenant web surfaces
 *     read "Agents paused by the platform for this workspace."; band Major.
 *
 * The Command Center IS a tenant web surface, so on THIS surface the scope is
 * distinguishable and the distinguishing string is the catalogue's, not this
 * build's. Note what the same two rows say about the Frontline column: both
 * carry the byte-identical "Live coaching paused by the platform.", so on the
 * worker's device the scope is NOT distinguishable by message — which is why
 * `src/surfaces/cc/modules/cc-08` COMPUTES the distinction from these rows
 * rather than asserting it, and why this overlay cites L90513/L90514 for it
 * rather than citing `AC-42-303`.
 *
 * `PROV-4`. Every cell is a transcribed deterministic rule.
 */

/**
 * The identifier for an axis cell, by exact string equality against the
 * registry. Total: it throws rather than answering `undefined`, because an
 * unresolved name would otherwise render as a blank identifier beside a real
 * behaviour, which is worse than not rendering at all.
 */
function resolveByName(moduleName: string): CcModuleId {
  const entry = CC_MODULE_SPINE.find((candidate) => candidate.name === moduleName)
  if (entry === undefined) {
    throw new Error(
      `"${moduleName}" is not a Command Center module name in CC_MODULE_SPINE, so section `
        + '43.3.3 cannot be joined to an identifier for it.',
    )
  }
  return entry.id
}

export interface CcAiBehaviourRow extends OverlayRow {
  /** Supplied by this build, resolved by checked string equality. */
  readonly moduleId: CcModuleId
}

const ccRow = (
  moduleName: string,
  behaviour: string,
  classification: string,
  sourceRef: string,
): CcAiBehaviourRow => ({
  cells: [moduleName, behaviour, classification],
  sourceRef,
  kind: 'transcribed',
  readings: [],
  moduleId: resolveByName(moduleName),
})

export const CC_AI_BEHAVIOUR_ROWS: readonly CcAiBehaviourRow[] = [
  ccRow(
    'Live shift board',
    'Allowed — deterministic, with freshness markers',
    '`SoW Fact — §6.2, §6.3`',
    'L91082',
  ),
  ccRow('Sync state and connectivity', 'Allowed', '`SoW Fact — §6.2.3`', 'L91083'),
  ccRow('Run and exception drill-down', 'Allowed', '`SoW Fact — §6.1.6`', 'L91084'),
  ccRow('Deviation workspace and evidence review', 'Allowed', '`SoW Fact — §6.1.6`', 'L91085'),
  ccRow(
    'Governance gate queue',
    'Allowed — raised gates stay human-decidable',
    '`SoW Fact — §8.7.5`',
    'L91086',
  ),
  ccRow(
    'Learned-change approvals',
    'Allowed with conditions — existing proposals decidable; no new proposals arrive',
    '`SoW Fact — §3.8`',
    'L91087',
  ),
  ccRow('Feedback signal capture', 'Allowed', '`SoW Fact — §6.1.6`', 'L91088'),
  ccRow(
    'Agent activity panel',
    'Allowed — renders unavailability honestly, never empty',
    '`SoW Fact — §6.9.3`',
    'L91089',
  ),
  ccRow('Alert and escalation feed', 'Allowed', '`SoW Fact — §3.9, §6.10`', 'L91090'),
  ccRow('Sync-conflict review panel', 'Allowed', '`SoW Fact — §6.11, §7.10.8`', 'L91091'),
  ccRow(
    'Standard reports and Custom Report Builder',
    'Allowed with conditions — artificial-intelligence-derived fields labelled pending',
    '`SoW Fact — §6.12`; identity of the five sets open under `DEC-REPORT-001`',
    'L91092',
  ),
  ccRow(
    'Shift handoff panel',
    'Allowed with conditions — the brief is agent-produced; its absence is flagged in plain language',
    '`SoW Fact — §6.9.3`',
    'L91093',
  ),
  ccRow(
    'Operational actions, the closed set of ten',
    'Allowed',
    '`SoW Fact — §3.5, §6.14.2`',
    'L91094',
  ),
]

export const CC_AI_BEHAVIOUR_TABLE: OverlayTable = {
  caption: 'Behaviour matrix by module.',
  captionRef: 'L91078',
  headings: [
    'Command Center module',
    'Behaviour during an artificial-intelligence failure',
    'Classification',
  ],
  headerRef: 'L91080',
  kind: 'transcribed',
  whyDerived: null,
  rows: CC_AI_BEHAVIOUR_ROWS,
}

/** The row governing one module. Total, so a caller cannot render a blank. */
export function ccAiBehaviour(id: CcModuleId): CcAiBehaviourRow {
  const found = CC_AI_BEHAVIOUR_ROWS.find((candidate) => candidate.moduleId === id)
  if (found === undefined) {
    throw new Error(`Section 43.3.3 carries no artificial-intelligence failure row for ${id}.`)
  }
  return found
}

/**
 * What the source states and what this build supplies, in the words the screen
 * prints. The sweep is repeated by the covering test.
 */
export const CC_IDENTIFIER_ATTRIBUTION = {
  axisHeading: 'Command Center module',
  whatTheSourceStates:
    'The module by NAME. Section 43.3.3 was swept end to end and contains zero occurrences of '
    + '`MOD-CC`.',
  whatThisBuildSupplies:
    'The identifier. It is resolved by exact string equality against the module registry at '
    + 'L35186-L35198, whose names match this table verbatim and in the same order, so the join '
    + 'is a checked one rather than a hand-written pairing.',
  registryRef: 'L35186-L35198',
} as const

export const CC_UNCANONISED_DECISIONS: readonly {
  readonly id: string
  readonly question: string
  readonly sourceRef: string
}[] = [
  {
    id: 'DEC-REPORT-001',
    question:
      'The identity of the five standard report data sets. Named inside the classification '
      + 'cell of the Standard reports row, so the row is granted and its scope is open at once.',
    sourceRef: 'L91092',
  },
]

export const CC_AI_OVERLAY: SurfaceAiOverlay = {
  surfaceId: 'SURF-CC',
  journeyCode: overlayJourneyCode('SURF-CC'),
  tables: [CC_AI_BEHAVIOUR_TABLE],
  provenance: OVERLAY_PROVENANCE,
  obligations: FIVE_SURFACE_OBLIGATIONS,
  sourceNotes: [
    {
      heading: 'The identifier beside each row is this build\u2019s, not the source\u2019s.',
      body: [
        `The axis heading is \`${CC_IDENTIFIER_ATTRIBUTION.axisHeading}\`.`,
        `What the source states: ${CC_IDENTIFIER_ATTRIBUTION.whatTheSourceStates}`,
        `What this build supplies: ${CC_IDENTIFIER_ATTRIBUTION.whatThisBuildSupplies}`,
      ].join(' '),
      sourceRef: CC_IDENTIFIER_ATTRIBUTION.registryRef,
      readings: [],
      adopted: null,
    },
    ...CC_UNCANONISED_DECISIONS.map((decision) => ({
      heading: `${decision.id} is not a member of the exported \`DecisionId\` union, so it is disclosed here.`,
      body: `${decision.question} The canon is wave 5\u2019s; this is the slice-8 local pattern and it is reported as a seam.`,
      sourceRef: decision.sourceRef,
      readings: [],
      adopted: null,
    })),
  ],
  statedAbsences: [
    {
      what: 'A reconciliation control.',
      reason:
        'Read-only here. The queued-request matrix puts reconciliation on the Delivery '
        + 'Operations Hub — "Allowed — the record of truth holds it" — and gives this surface '
        + 'the read-only cell on that row.',
      sourceRef: 'L89708',
    },
    {
      what: 'A new learned-change proposal arriving.',
      reason:
        'Existing proposals stay decidable and no new proposals arrive while artificial '
        + 'intelligence is failed, so an empty proposal queue is a stated behaviour rather '
        + 'than a rendering fault.',
      sourceRef: 'L91087',
    },
  ],
}

/* ==================================================================== *
 * SECTION 44.3 — THE SHIFT HANDOFF AGENT DEGRADATION MATRIX BY ROLE.
 * ==================================================================== */

/**
 * TRANSCRIBED. Header at **L92300**, rule L92301, EIGHT content rows at
 * L92302-L92309, under the sub-heading "Matrix — Shift Handoff Agent
 * degradation by role" at L92296, in §44.3 (heading L92087).
 *
 * ── ITS AXIS IS A CAPABILITY BY FIVE TENANT ROLES, NOT BY SURFACE ─────────
 * `| Capability | Worker | Supervisor | Quality Manager | Tenant Admin |
 * Read-only Auditor |`. This is not a five-surface table and must not be read
 * as one: the five columns are five ROLES that all reach one surface. A gate
 * counting five columns as five surfaces would report parity coverage over an
 * axis that has nothing to do with surfaces.
 *
 * ── FOUR UNDECIDED PERMISSIVE CELLS ACROSS TWO ROWS, NOT TWO ─────────────
 * `DEC-HANDOFF-001` appears in BOTH the Supervisor and the Quality Manager
 * cells of L92306; `DEC-HANDOFF-002` in BOTH the same two cells of L92307.
 * That is FOUR undecided permissive cells over two rows. Each renders
 * inoperable with both readings — the grant AND the openness — because the
 * cell states both: `Allowed with conditions — subject to DEC-HANDOFF-00N` is
 * a grant whose condition is an unanswered question, and rendering it as a
 * working control would answer the question.
 *
 * `DEC-HANDOFF-004` is in this section too, but in PROSE at L92292 and not in
 * the table. It is recorded as a cross-reference rather than a cell.
 *
 * ── NONE OF THE THREE IS IN THE CANON ────────────────────────────────────
 * `DEC-HANDOFF-001`, `-002` and `-004` are not members of the exported
 * `DecisionId` union, and `src/disclosure/decisions.ts` is wave 5's. All three
 * are disclosed locally below and reported as a seam.
 *
 * ── THE INVERTED-POLARITY ROW, WHICH A ROUTING BRANCH WOULD GET WRONG ────
 * L92308's capability is ITSELF A NEGATIVE — "Be blocked from starting a shift
 * by a missing acknowledgement" — and it reads `Explicitly prohibited` in four
 * of five cells. A prohibition on a negative capability means THE BEHAVIOUR
 * MUST NOT OCCUR: nobody is blocked. Rendering that row as a disabled control
 * would invent an affordance the source is denying the existence of, so the row
 * renders as a STATEMENT and no control is drawn for it at all.
 */

export type ShiftHandoffRoleColumn =
  | 'Worker'
  | 'Supervisor'
  | 'Quality Manager'
  | 'Tenant Admin'
  | 'Read-only Auditor'

export const SHIFT_HANDOFF_ROLE_COLUMNS = [
  'Worker',
  'Supervisor',
  'Quality Manager',
  'Tenant Admin',
  'Read-only Auditor',
] as const satisfies readonly ShiftHandoffRoleColumn[]

type MissingRoleColumn = Exclude<
  ShiftHandoffRoleColumn,
  (typeof SHIFT_HANDOFF_ROLE_COLUMNS)[number]
>
const _roleColumnsExhaustive: MissingRoleColumn extends never ? true : never = true
void _roleColumnsExhaustive

export interface ShiftHandoffMatrixRow {
  /** The capability cell, verbatim. */
  readonly capability: string
  /** The five role cells, verbatim, in the table's column order. */
  readonly cells: readonly string[]
  readonly locator: string
  /**
   * Which role columns are permissive AND undecided on this row, so a renderer
   * draws them inoperable. Derived from the cell text rather than typed, so a
   * row cannot claim a decision its own cell does not name.
   */
  readonly undecidedColumns: readonly ShiftHandoffRoleColumn[]
  /**
   * True where the CAPABILITY is itself a negative, so a prohibition means the
   * behaviour must not occur and no control may be drawn.
   */
  readonly invertedPolarity: boolean
}

/** The decisions a cell names, read out of the cell rather than declared. */
const decisionsIn = (cell: string): readonly string[] =>
  [...cell.matchAll(/`(DEC-[A-Z]+-\d+)`/g)].map((match) => match[1] ?? '')

const handoffRow = (
  capability: string,
  cells: readonly string[],
  locator: string,
  invertedPolarity = false,
): ShiftHandoffMatrixRow => ({
  capability,
  cells,
  locator,
  undecidedColumns: SHIFT_HANDOFF_ROLE_COLUMNS.filter((column, index) => {
    const cell = cells[index] ?? ''
    return cell.startsWith('Allowed') && decisionsIn(cell).length > 0
  }),
  invertedPolarity,
})

export const SHIFT_HANDOFF_ROLE_MATRIX: readonly ShiftHandoffMatrixRow[] = [
  handoffRow(
    'Receive the full brief',
    [
      'Explicitly prohibited — workers see only their own assigned-task readiness [SoW Fact — §5.2.3]',
      'Allowed',
      'Allowed with conditions — optional recipient per configuration',
      'Unavailable — not a configured recipient',
      'Explicitly prohibited — no Command Center access',
    ],
    'L92302',
  ),
  handoffRow(
    'See emerging-pattern watch items',
    ['Explicitly prohibited', 'Allowed', 'Allowed', 'Unavailable', 'Explicitly prohibited'],
    'L92303',
  ),
  handoffRow(
    'Acknowledge the brief',
    [
      'Explicitly prohibited',
      'Allowed',
      'Allowed',
      'Explicitly prohibited',
      'Explicitly prohibited',
    ],
    'L92304',
  ),
  handoffRow(
    'Annotate the brief',
    [
      'Explicitly prohibited',
      'Allowed',
      'Allowed',
      'Explicitly prohibited',
      'Explicitly prohibited',
    ],
    'L92305',
  ),
  handoffRow(
    'Read the deterministic handoff pack',
    [
      'Explicitly prohibited',
      'Allowed with conditions — subject to `DEC-HANDOFF-001`',
      'Allowed with conditions — subject to `DEC-HANDOFF-001`',
      'Unavailable',
      'Read-only via the Delivery Operations Hub record',
    ],
    'L92306',
  ),
  handoffRow(
    'Write the manual handoff note',
    [
      'Explicitly prohibited',
      'Allowed with conditions — subject to `DEC-HANDOFF-002`',
      'Allowed with conditions — subject to `DEC-HANDOFF-002`',
      'Explicitly prohibited',
      'Explicitly prohibited',
    ],
    'L92307',
  ),
  handoffRow(
    'Be blocked from starting a shift by a missing acknowledgement',
    [
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Not applicable — the auditor starts no shift',
    ],
    'L92308',
    true,
  ),
  handoffRow(
    "See the brief's absence honestly stated",
    [
      'Not applicable — workers do not see the panel',
      'Allowed',
      'Allowed',
      'Allowed',
      'Read-only via the record',
    ],
    'L92309',
  ),
]

export const SHIFT_HANDOFF_MATRIX_HEADINGS = [
  'Capability',
  ...SHIFT_HANDOFF_ROLE_COLUMNS,
] as const

export const SHIFT_HANDOFF_MATRIX_META = {
  subHeading: 'Matrix — Shift Handoff Agent degradation by role',
  subHeadingRef: 'L92296',
  headerRef: 'L92300',
  sectionRef: 'L92087',
  axisNote:
    'The five columns are five TENANT ROLES reaching one surface, not five surfaces. This is '
    + 'not a five-surface table and no parity gate may read it as one.',
} as const

/**
 * Every undecided permissive cell in this matrix, as row-and-column pairs.
 * DERIVED from the cells, so nothing here states how many there are — and the
 * population is four across two rows, which every brief before this one gave
 * as two.
 */
export const SHIFT_HANDOFF_UNDECIDED_CELLS: readonly {
  readonly locator: string
  readonly capability: string
  readonly column: ShiftHandoffRoleColumn
  readonly cell: string
  readonly decision: string
}[] = SHIFT_HANDOFF_ROLE_MATRIX.flatMap((row) =>
  row.undecidedColumns.map((column) => {
    const index = SHIFT_HANDOFF_ROLE_COLUMNS.indexOf(column)
    const cell = row.cells[index] ?? ''
    return {
      locator: row.locator,
      capability: row.capability,
      column,
      cell,
      decision: decisionsIn(cell)[0] ?? '',
    }
  }),
)

/** `DEC-HANDOFF-*` disclosed locally: none is a member of the exported union. */
export const SHIFT_HANDOFF_UNCANONISED_DECISIONS: readonly {
  readonly id: string
  readonly question: string
  readonly sourceRef: string
  readonly whereItAppears: string
}[] = [
  {
    id: 'DEC-HANDOFF-001',
    question:
      'Whether the Supervisor and the Quality Manager may read the deterministic handoff pack, '
      + 'and under what condition. The cell grants it and names the decision in the same breath.',
    sourceRef: 'L92306',
    whereItAppears: 'In BOTH the Supervisor and the Quality Manager cells of one row.',
  },
  {
    id: 'DEC-HANDOFF-002',
    question:
      'Whether the Supervisor and the Quality Manager may write the manual handoff note, and '
      + 'under what condition.',
    sourceRef: 'L92307',
    whereItAppears: 'In BOTH the Supervisor and the Quality Manager cells of one row.',
  },
  {
    id: 'DEC-HANDOFF-004',
    question:
      'What minimum source coverage is required before the readiness section is marked '
      + 'unverifiable.',
    sourceRef: 'L92292',
    whereItAppears:
      'In this section, but in PROSE and not in the table. Recorded as a cross-reference '
      + 'rather than as a cell.',
  },
]

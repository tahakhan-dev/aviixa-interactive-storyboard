import type { ProvenanceClassId } from '@/ai/provenance/classes'

/**
 * THE BLAST RADIUS OF A PAUSE — THE ENUMERATION, AND NO COUNT.
 *
 * The diagram's fence opens at L87831, declares `flowchart TD` at L87832 and
 * closes at L87850. The nodes hang off `PAUSE` in three groups: the stopping
 * side at L87833-L87838, the continuing side at L87839-L87847, and the
 * honest-rendering obligation at L87848. L87849 is a separate pair —
 * `RESUME --> RESTART` — and hangs off nothing this control governs.
 *
 * No population figure appears in this file, including in this comment. THAT
 * SENTENCE WAS FALSE FOR A WHILE, AND AN ORDINAL IS WHY IT SURVIVED REVIEW.
 * This paragraph and the rendered `whyNoCount` string below both used to place
 * `HONEST` at an ordinal position among the continuing behaviours. An ordinal
 * IS a population figure — it asserts the larger of the two readings — and it
 * escaped the covering sweep because the sweep looks for cardinals. It also
 * contradicted `kindOf('HONEST')` below, which answers `honest-rendering`
 * rather than `continues` on purpose, and the table the incident console
 * renders beneath it, which says the same. Removed, not renumbered. The spans
 * above carry the enumeration; a stored copy of a derived count is the defect
 * whether it sits in a rendered string, in an ordinal, or in prose.
 *
 * ── WHY THERE IS NO COUNT ON THIS RECORD, AND NONE ON ANY SCREEN ───────────
 * The narrative at L87852 says "Six things stop and nine continue". It is
 * defensible: `HONEST` is a state the platform must SHOW rather than a
 * behaviour that carries on, so whether it belongs on the continuing side at
 * all is a reading. But "nine continue" and "ten continue" are both readings of
 * one diagram, and a screen that prints either has picked a side of a
 * disagreement the source does not resolve. This build's rule is that a
 * contested count is REMOVED rather than renumbered — changing a number reships
 * the identical defect with a fresh one, and the count was never the claim a
 * reader could act on. So the enumeration renders and no count does, and
 * `tests/unit/ai-controls-blast-radius.test.ts` sweeps this directory and the
 * incident route for a count sentence.
 *
 * `HONEST`'s own `kind` is what makes the ambiguity legible rather than hidden:
 * it is neither `stops` nor `continues`, so a caller asking for either list
 * cannot receive it by accident, and a caller wanting all sixteen asks for all
 * sixteen.
 *
 * ── THE TWO SUPPORTING TABLES ─────────────────────────────────────────────
 * Both sit under one shared caption, `**Supporting tables.**` at L87858. Table
 * one is Control / Scope / Approval class / Effect on the deterministic layer,
 * header L87860, rows L87862-L87866. Table two is What a pause does not do /
 * Reason, header L87868, rows L87870-L87876. Row counts are counted from each
 * header down, and both tables' boundary lines are asserted not to be table
 * rows, so neither transcription can stop early or run into the paragraph after.
 *
 * Table two's rows are the negative assertions a reader needs most: each names
 * something a pause CANNOT do and gives the reason, and a reason is what turns a
 * refusal into something a reader can check.
 *
 * ── PROVENANCE ────────────────────────────────────────────────────────────
 * `PROV-4`. Transcribed diagram and transcribed tables. No agent produced any
 * of it.
 */

/* ==================================================================== *
 * THE FENCE.
 * ==================================================================== */

export const BLAST_RADIUS_FENCE = {
  opensAt: 87_831,
  directionAt: 87_832,
  closesAt: 87_850,
} as const

/**
 * The root node. It is declared INLINE on the first edge rather than on a line
 * of its own — L87833 reads
 * `PAUSE["Emergency pause activated, per tenant or platform-wide"] --> STOP1[...]`
 * — which is why a matcher looking for sixteen bare `PAUSE -->` edges is green
 * on fifteen lines and red on the first.
 */
export const BLAST_RADIUS_ROOT = {
  key: 'PAUSE',
  label: 'Emergency pause activated, per tenant or platform-wide',
  sourceRef: 'L87833',
} as const

/* ==================================================================== *
 * THE NODES.
 * ==================================================================== */

/**
 * What a node IS. `stops` and `continues` are behaviours; `honest-rendering` is
 * an obligation to show a state, and it is its own kind because that difference
 * is the whole reason "nine" and "ten" are both arguable.
 */
export type BlastRadiusKind = 'stops' | 'continues' | 'honest-rendering'

export interface BlastRadiusNode {
  /** The diagram's own node identifier. */
  readonly key: string
  /** The node's label, verbatim, without its brackets and quotes. */
  readonly label: string
  readonly kind: BlastRadiusKind
  readonly sourceRef: string
}

/**
 * The nodes, in diagram order, each with the line it was read from. The `kind`
 * is assigned from the diagram's own key prefix below rather than typed per
 * row, so a node cannot be filed on the wrong side of the diagram by hand.
 */
const NODE_TEXT = [
  { key: 'STOP1', label: 'In-flight agent runs checkpoint at the next stage boundary and park' },
  { key: 'STOP2', label: 'No new agent activations' },
  { key: 'STOP3', label: 'No coaching delivered' },
  { key: 'STOP4', label: 'No deviation brief assembled' },
  { key: 'STOP5', label: 'No shift handoff brief produced' },
  { key: 'STOP6', label: 'No Lane B proposal generated' },
  { key: 'KEEP1', label: 'Raised gate items stay human-decidable' },
  { key: 'KEEP2', label: 'On-device specification gates continue' },
  { key: 'KEEP3', label: 'On-device severity classification continues' },
  { key: 'KEEP4', label: 'Automatic Severity 1 lot freeze continues' },
  { key: 'KEEP5', label: 'On-device containment checklist launch continues' },
  { key: 'KEEP6', label: 'Capture, queueing and synchronisation continue' },
  {
    key: 'KEEP7',
    label:
      'Command channel continues: lot release, reassignment, clearance, suspension, version change',
  },
  { key: 'KEEP8', label: 'Escalation routing and notification delivery continue' },
  { key: 'KEEP9', label: 'Audit and evidence recording continue' },
  { key: 'HONEST', label: 'Client Command Center shows agents paused by the platform' },
] as const

/** The first node's line. Each node's locator is derived from its position. */
export const BLAST_RADIUS_FIRST_NODE_LINE = 87_833

function kindOf(key: string): BlastRadiusKind {
  if (key.startsWith('STOP')) return 'stops'
  if (key.startsWith('KEEP')) return 'continues'
  if (key === 'HONEST') return 'honest-rendering'
  throw new Error(
    `"${key}" is not a node of the blast-radius diagram. Its keys are STOPn, KEEPn and HONEST, ` +
      'and a key this build cannot classify would be filed on a side of the diagram by guess.',
  )
}

export const BLAST_RADIUS_NODES: readonly BlastRadiusNode[] = NODE_TEXT.map((node, index) => ({
  ...node,
  kind: kindOf(node.key),
  sourceRef: `L${String(BLAST_RADIUS_FIRST_NODE_LINE + index)}`,
}))

/** The nodes of one kind. Never a count — the list itself is the answer. */
export function blastRadiusNodes(kind: BlastRadiusKind): readonly BlastRadiusNode[] {
  return BLAST_RADIUS_NODES.filter((node) => node.kind === kind)
}

/**
 * Why no number appears on any screen this build draws over the diagram. The
 * source's own sentence is quoted with its locator, because quoting a contested
 * sentence is disclosure and restating it as fact is the defect.
 */
export const BLAST_RADIUS_NO_COUNT = {
  /**
   * ONE LOCATOR, AND IT IS THE LINE THAT CARRIES THE SENTENCE. `L87848` used to
   * sit beside it and does not carry it: opened, that line reads
   * `PAUSE --> HONEST["Client Command Center shows agents paused by the
   * platform"]`. It is the HONEST node's own edge, it is cited on the node's own
   * record where it belongs, and it is not evidence for this quotation.
   */
  sourceRefs: ['L87852'],
  quotation: 'Six things stop and nine continue.',
  whyNoCount:
    "The narrative's reading is defensible: the honest-rendering node is a state the platform " +
    'must show rather than a behaviour that carries on, so whether it belongs among the ' +
    'continuing behaviours at all is a reading rather than a fact. Both readings of the one ' +
    'diagram are arguable, this build takes neither, and it renders the enumeration and no ' +
    'number at all. A stale or contested count is removed rather than renumbered — a fresh ' +
    'number reships the identical defect, and the number was never the claim a reader could ' +
    'act on.',
} as const

/* ==================================================================== *
 * THE TWO SUPPORTING TABLES.
 * ==================================================================== */

function splitTableRow(line: string): readonly string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    throw new Error(`"${line}" is not a fenced table row`)
  }
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((field) => field.trim())
}

/** One row of the Control / Scope / Approval class / Effect table. */
export interface PauseControlRow {
  readonly control: string
  readonly scope: string
  readonly approvalClass: string
  readonly effectOnDeterministicLayer: string
  readonly verbatim: string
  readonly sourceRef: string
}

const CONTROL_TABLE_LINES = [
  '| Emergency pause | Per tenant or platform-wide | Critical class, root approves; initiation authority `DEC-PAUSE-001` | `Not applicable — the pause governs agents, nothing else` |',
  '| Resume | Per tenant or platform-wide | Critical class, separately audited | `Not applicable — the pause governs agents, nothing else` |',
  '| Runaway-loop kill switch | Not specified | Not specified | `Not applicable — orchestration control only` — scope and class `DEC-KILL-001` |',
  '| Atom or agent disable | Per atom or agent, platform or tenant | Engineering class, Platform Engineer to Admin | `Not applicable — registry operation` |',
  '| Tenant compliance suspension | Whole tenant | Critical class | Devices lock at next contact; this is a tenant-lifecycle act, not an agent control |',
] as const

export const PAUSE_CONTROL_TABLE = {
  caption: 'Supporting tables.',
  captionRef: 'L87858',
  headerLine: 87_860,
  columns: ['Control', 'Scope', 'Approval class', 'Effect on the deterministic layer'] as const,
  rows: CONTROL_TABLE_LINES.map((line, index): PauseControlRow => {
    const fields = splitTableRow(line)
    return {
      control: fields[0] ?? '',
      scope: fields[1] ?? '',
      approvalClass: fields[2] ?? '',
      effectOnDeterministicLayer: fields[3] ?? '',
      verbatim: line,
      sourceRef: `L${String(87_862 + index)}`,
    }
  }),
} as const

/** One row of the What a pause does not do / Reason table. */
export interface PauseDoesNotRow {
  readonly whatItDoesNotDo: string
  readonly reason: string
  readonly verbatim: string
  readonly sourceRef: string
}

const DOES_NOT_TABLE_LINES = [
  '| Stop specification gates | The deterministic backbone has no off switch `[SoW Fact — §8.7.5]` |',
  '| Stop severity classification | Runs on-device at capture, including offline `[SoW Fact — §3.3]` |',
  '| Release or prevent a Severity 1 hold | The hold is automatic and release is Quality Manager only `[SoW Fact — §3.3, §3.4]` |',
  '| Stop evidence capture or audit | Evidence immutability and audit completeness are platform-fixed `[SoW Fact — §1.5]` |',
  '| Stop the command channel | Human-decided commands are not agent output `[SoW Fact — §1.3]` |',
  '| Auto-decide waiting gate items | Raised gates stay human-decidable `[SoW Fact — §8.7.5]` |',
  '| Resume itself | Resume is a separate audited act `[SoW Fact — §8.7.5]` |',
] as const

export const PAUSE_DOES_NOT_TABLE = {
  caption: 'Supporting tables.',
  captionRef: 'L87858',
  headerLine: 87_868,
  columns: ['What a pause does not do', 'Reason'] as const,
  rows: DOES_NOT_TABLE_LINES.map((line, index): PauseDoesNotRow => {
    const fields = splitTableRow(line)
    return {
      whatItDoesNotDo: fields[0] ?? '',
      reason: fields[1] ?? '',
      verbatim: line,
      sourceRef: `L${String(87_870 + index)}`,
    }
  }),
} as const

/* ==================================================================== *
 * PROVENANCE.
 * ==================================================================== */

/** The one class every rendering path over this enumeration emits. */
export const BLAST_RADIUS_PROVENANCE: ProvenanceClassId = 'PROV-4'

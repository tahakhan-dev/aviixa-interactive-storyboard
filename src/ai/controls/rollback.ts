import type { ProvenanceClassId } from '@/ai/provenance/classes'

/**
 * THE ROLLBACK TAXONOMY — EIGHT FORMS, AND WHY THERE IS NO "ROLLBACK" CONTROL.
 *
 * L87803: "Rollback appears on this platform in several distinct forms and they
 * must not be conflated." `Derived Clarification`, each traced.
 *
 * The table's header is L87805, its separator L87806, and its data runs L87807
 * to L87814. Eight rows, counted from the header down. Nothing in this file
 * states that number: the array is the array, and
 * `tests/unit/ai-rollback-taxonomy.test.ts` walks the frozen bytes to prove it
 * is the whole table and stops where the table does — the line above the header
 * and the line below the last row are both required NOT to be table rows.
 *
 * ── WHY THIS IS A REGISTER AND NOT A CONTROL ───────────────────────────────
 * A reader who can press one button labelled "rollback" has been told the eight
 * forms are one thing, which is exactly what L87803 forbids. So this module
 * exports records and no act: there is no `rollback()` here, no handler, and no
 * enum a caller could switch a single button over. Each form's reversal happens
 * on the surface that owns the object being reversed — a workflow version in
 * Studio, a model binding in platform settings — and the covering test sweeps
 * `src/` and `app/` for an operable element whose own label is a bare rollback
 * word.
 *
 * ── TWO ROWS ARE NOT REVERSALS AT ALL, AND BOTH ARE DERIVED ────────────────
 * `Evidence or audit reversal` (L87814) reverses `Nothing` and its mechanism
 * cell reads `Explicitly prohibited`. `Composed-agent rollback` (L87812) has no
 * mechanism: "**Not specified in the Statement of Work**", under
 * `DEC-AGENTLC-001`. Both facts are READ OFF the row's own bytes rather than
 * flagged by hand — a hand-set discriminator that nothing checks is wrong
 * silently, and this one cannot disagree with the bytes it came from.
 *
 * ── PROVENANCE ────────────────────────────────────────────────────────────
 * `PROV-4`. Every string here is a deterministic rule transcribed from the
 * frozen source; no agent produced any of it, and no path over it may describe
 * it as live artificial intelligence.
 *
 * This module is data and one parser call per row. It reverses nothing.
 */

/* ==================================================================== *
 * THE FROZEN BYTES.
 * ==================================================================== */

/** The header line. Every other line below is derived from it. */
export const ROLLBACK_TABLE_HEADER_LINE = 87_805

/**
 * The header, the separator and the data rows, exactly as the frozen source
 * writes them. Every field of every record is parsed out of these, so nothing
 * in this file is a second transcription that could drift from the first.
 */
export const ROLLBACK_SOURCE_LINES = [
  '| Rollback form | What it reverses | Mechanism | Source |',
  '|---|---|---|---|',
  '| Lane A reversal | A selection or ranking refinement | Reversible by design, logged | `SoW Fact — §5.16.2, §6.7.1`; authority `DEC-LANEA-001` |',
  '| Configuration change reversal | A configured value changed through Lane B or by hand | A new human decision or a new authored version; the prior value is in the change log | `SoW Fact — §6.7.4` |',
  '| Workflow version rollback | A published workflow version | Republication of a prior content state as a new version, since versions are append-only and runs pin | `Derived Clarification` from `SoW Fact — §2.4, §5.12.1` |',
  '| Atom or agent disablement | An enabled capability | Enable and disable are evaluation-gated and approval-cycled | `SoW Fact — §8.3.5, §8.2.2` |',
  '| Model binding rollback | A router-role binding | Settings change, re-evaluated before taking effect | `SoW Fact — §8.7.1, §8.7.6`; values `DEC-MODEL-001` |',
  '| Composed-agent rollback | A deployed composed agent | **Not specified in the Statement of Work** | `DEC-AGENTLC-001`, see chapter 41 |',
  '| Emergency pause | All agent activity, temporarily | Critical-class pause and separately audited resume | `SoW Fact — §8.7.5` |',
  '| Evidence or audit reversal | Nothing | `Explicitly prohibited` — evidence is immutable and audit history is never removed | `SoW Fact — Part III, §8.18` |',
] as const

/* ==================================================================== *
 * THE PARSE.
 * ==================================================================== */

/**
 * One pipe-delimited row to its trimmed fields. Throws on anything that is not
 * a fenced table row: a row that does not split is a transcription error, and
 * a silent skip would drop a rollback form.
 */
function splitTableRow(line: string): readonly string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    throw new Error(
      `"${line}" is not a fenced table row and cannot be a row of the rollback taxonomy`,
    )
  }
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((field) => field.trim())
}

const HEADER_FIELDS = splitTableRow(ROLLBACK_SOURCE_LINES[0])

/** The four column headings, verbatim, read off the header rather than typed. */
export const ROLLBACK_COLUMNS: readonly string[] = HEADER_FIELDS

/**
 * The record's key, DERIVED from the form the row names. Eight hand-assigned
 * keys is eight chances to key a record to the wrong form with nothing
 * downstream noticing; the covering test asserts the eight against a literal
 * list of its own, which is the property a derived key can actually lose.
 */
function formId(form: string): string {
  return form
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const DECISION_TOKEN = /DEC-[A-Z0-9]+-\d+/g

export interface RollbackForm {
  /** Derived from the form's own name. */
  readonly id: string
  /** Column 1, verbatim. */
  readonly form: string
  /** Column 2, verbatim. */
  readonly whatItReverses: string
  /** Column 3, verbatim, backticks and emphasis included. */
  readonly mechanism: string
  /** Column 4, verbatim — the source classification for this form alone. */
  readonly source: string
  /** The whole row, verbatim. What a screen prints where a summary would lie. */
  readonly verbatim: string
  /** The row's own line in the frozen source. */
  readonly sourceRef: string
  /**
   * Every `DEC-*` this row's own text names, in order of appearance. Read off
   * the bytes, never assigned: a governing decision assigned by hand can be
   * dropped by hand, and three of the eight rows carry one.
   */
  readonly governingDecisions: readonly string[]
  /** L87814. The `What it reverses` cell is the word `Nothing` and nothing else. */
  readonly reversesNothing: boolean
  /** L87814. The mechanism cell itself carries the prohibition token. */
  readonly prohibited: boolean
  /** L87812. The source states no mechanism, and that is the mechanism. */
  readonly notSpecified: boolean
}

function parseRow(line: string, lineNumber: number): RollbackForm {
  const fields = splitTableRow(line)
  if (fields.length !== HEADER_FIELDS.length) {
    throw new Error(
      `L${String(lineNumber)} has ${String(fields.length)} fields and the header has ` +
        `${String(HEADER_FIELDS.length)}. A row that does not line up with its header cannot be ` +
        'read, and reading it anyway keys a cell to the wrong column.',
    )
  }
  const form = fields[0] ?? ''
  const whatItReverses = fields[1] ?? ''
  const mechanism = fields[2] ?? ''
  return {
    id: formId(form),
    form,
    whatItReverses,
    mechanism,
    source: fields[3] ?? '',
    verbatim: line,
    sourceRef: `L${String(lineNumber)}`,
    governingDecisions: [...new Set(line.match(DECISION_TOKEN) ?? [])],
    reversesNothing: whatItReverses === 'Nothing',
    prohibited: mechanism.includes('`Explicitly prohibited`'),
    notSpecified: mechanism.includes('Not specified in the Statement of Work'),
  }
}

/** The first data line. The header is two lines above it, the separator one. */
export const ROLLBACK_FIRST_DATA_LINE = ROLLBACK_TABLE_HEADER_LINE + 2

export const ROLLBACK_FORMS: readonly RollbackForm[] = ROLLBACK_SOURCE_LINES.slice(2).map(
  (line, index) => parseRow(line, ROLLBACK_FIRST_DATA_LINE + index),
)

/** The population, as identifiers, in source order. */
export const ROLLBACK_FORM_IDS: readonly string[] = ROLLBACK_FORMS.map((form) => form.id)

export function rollbackForm(id: string): RollbackForm {
  const found = ROLLBACK_FORMS.find((form) => form.id === id)
  if (found === undefined) {
    throw new Error(
      `"${id}" is not a form of the rollback taxonomy. The eight forms are keyed on the name the ` +
        'source gives them, and a lookup that missed is a caller naming a ninth.',
    )
  }
  return found
}

/* ==================================================================== *
 * THE RULE THAT MAKES THIS A REGISTER, AND THE FOUR ABSOLUTES.
 * ==================================================================== */

export const ROLLBACK_NO_SINGLE_CONTROL = {
  sourceRef: 'L87803',
  quotation:
    'Rollback appears on this platform in several distinct forms and they must not be conflated.',
  whatThisBuildDoes:
    'Each form is a record naming its own reversal target, its own mechanism and its own source ' +
    'classification. No control anywhere in this build is labelled with the bare word, because a ' +
    'reader who can press one button has been told the forms are one thing. Reversal happens on ' +
    'the surface that owns the object being reversed.',
} as const

export interface RollbackAbsolute {
  readonly rule: string
  /** The clause of L87816 this is read from, verbatim. */
  readonly quotation: string
  readonly sourceRef: string
}

/**
 * L87816, clause by clause. Four, not three: the fourth — that artificial
 * intelligence may never roll back anything on its own initiative — is the same
 * rule `AC-AI-015-7` (L87892) states for the pause, the resume and the kill,
 * and it is enforced in one place, `@/ai/controls/stop`'s refusal.
 */
export const ROLLBACK_MAY_NEVER = [
  {
    rule: 'Restore a capability that has not passed its evaluation scenarios',
    quotation:
      'It may never restore a state in which a capability acts without passing its evaluation ' +
      'scenarios, because the evaluation gate binds at all times.',
    sourceRef: 'L87816',
  },
  {
    rule: 'Re-base an in-flight run',
    quotation: 'It may never re-base an in-flight run, because runs pin.',
    sourceRef: 'L87816',
  },
  {
    rule: 'Remove an audit record',
    quotation: 'It may never remove an audit record of the thing being rolled back.',
    sourceRef: 'L87816',
  },
  {
    rule: 'Be initiated by an agent',
    quotation:
      'And artificial intelligence may never roll back anything on its own initiative, because ' +
      'rollback of a configured object is a configuration change and no agent holds that authority.',
    sourceRef: 'L87816',
  },
] as const satisfies readonly RollbackAbsolute[]

/* ==================================================================== *
 * PROVENANCE.
 * ==================================================================== */

/** The one class every rendering path over this register emits. */
export const ROLLBACK_PROVENANCE: ProvenanceClassId = 'PROV-4'

import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  AGENT_ROW_CORROBORATION,
  BOUNDARY_COLUMNS,
  BOUNDARY_COLUMN_IDS,
  BOUNDARY_MATRIX_HEADER_REF,
  BOUNDARY_PROVENANCE_CLASS,
  BOUNDARY_ROWS,
  DETERMINISTIC_SAFETY_STATEMENTS,
  boundaryRow,
  deterministicStandingUnder,
  uniformlyProhibitedRows,
} from '@/ai/boundary/matrix'
import { AI_AGENT_ROSTER } from '@/ai/agents/roster'
import { matrixCellProvenance } from '@/ai/agents/contracts'
import { AI_MODE_IDS } from '@/ai/modes'
import { provenanceClass } from '@/ai/provenance/classes'
import { cellFromSource } from '@/policy/columns'

/**
 * Slice 11, wave 1, task 8 — the deterministic boundary as data.
 *
 * WHAT THIS FILE IS FOR. Not "the matrix exists". Five things that were each
 * wrong, or nearly wrong, before it did:
 *
 *   1. A CELL WHOSE OWN TEXT GRANTS WHAT THE CELL FORBIDS. The Supervisor's
 *      release cell reads `Explicitly prohibited — may request release with a
 *      note`. The prohibition is on RELEASING; the affordance is on
 *      REQUESTING, and section 44.2 carries it as its own `Allowed` row. Both
 *      halves are the source and they do not contradict. A model that stores
 *      only the leading token loses the clause; a model that stores the cell
 *      as one string lets a reader take the second half as a softening of the
 *      first. So the two acts are separated, each keeps its own locator, and
 *      both locators are re-read from the frozen bytes here.
 *   2. A COUNT INFERRED FROM A SPAN. Both the row count and the number of
 *      all-prohibited agent rows are walked out of the frozen source at run
 *      time and compared against the module. Neither number is written down
 *      on either side of the comparison.
 *   3. A PHRASE THAT IS NOT IN THE SOURCE. A controller brief once quoted
 *      "centrally evidentiary actions fail closed" as the source's rule for
 *      deterministic safety under an outage. It occurs nowhere in the frozen
 *      bytes, and this file measures that rather than repeating it. The
 *      sentences the source does carry are pinned to the lines they are on.
 *   4. A SAFETY CLAIM THAT COULD BE WEAKENED BY AN AI STATE. The deterministic
 *      standing is derived for every one of the sixteen operating modes and
 *      required to be the same object in all sixteen. Section 42.3's column is
 *      already the literal type `'Allowed'`, so a row claiming otherwise does
 *      not compile — this covers the other half, which is a CONSUMER deriving
 *      a weaker standing from a mode that is itself fine.
 *   5. A VOCABULARY RE-TYPED INSTEAD OF IMPORTED. Three of the four agent rows
 *      take their name from the roster. The fourth does not, and that is the
 *      finding rather than an omission: the matrix's fourth agent row is the
 *      TENANT-COMPOSED reasoning agent, which is not on chapter 44's roster,
 *      and the roster's fourth agent — Vision Reasoning — is not in this
 *      matrix. Both absences are measured below.
 *
 * Every count and every locator is re-derived from the frozen bytes at run
 * time. A count copied into an assertion is a count that has stopped
 * measuring.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
/** One-based, so `LINES[n]` is the line a citation spelling `Ln` names. */
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

/** A pipe table row split into its trimmed cells, outer pipes discarded. */
const cellsOf = (line: string): readonly string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

const lineNumberOf = (ref: string): number => {
  const match = /^L(\d+)$/.exec(ref)
  if (match === null) throw new Error(`Not a line citation: "${ref}".`)
  return Number(match[1])
}

/** Count of non-overlapping occurrences of a literal in the whole source. */
const occurrences = (literal: string): number => SOURCE_TEXT.split(literal).length - 1

describe('the frozen source these assertions read', () => {
  it('is the bytes every locator here was measured against', () => {
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  })
})

/* ── the matrix, walked rather than assumed ────────────────────────────── */

const HEADER_LINE = lineNumberOf(BOUNDARY_MATRIX_HEADER_REF)

/**
 * The data rows, found by walking down from the separator until the table
 * stops. This is the count. Nothing below is allowed to state one.
 */
const sourceRowLines: readonly number[] = (() => {
  const found: number[] = []
  for (let n = HEADER_LINE + 2; L(n).trim().startsWith('|'); n += 1) found.push(n)
  return found
})()

describe('the boundary matrix is section 40.1’s own table', () => {
  it('has its header where the module says, with a separator under it', () => {
    expect(cellsOf(L(HEADER_LINE))[0]).toBe('Component')
    expect(L(HEADER_LINE + 1).trim()).toMatch(/^\|(-+\|)+$/)
  })

  it('carries the columns verbatim, in the source’s order', () => {
    // The axis cell is column zero; the four permission columns follow it.
    expect(BOUNDARY_COLUMNS.map((c) => c.heading)).toEqual(cellsOf(L(HEADER_LINE)).slice(1))
    expect(BOUNDARY_COLUMNS.map((c) => c.id)).toEqual([...BOUNDARY_COLUMN_IDS])
  })

  it('holds one row per data row in the source, and no more', () => {
    expect(BOUNDARY_ROWS.length).toBe(sourceRowLines.length)
    expect(BOUNDARY_ROWS.map((r) => lineNumberOf(r.sourceRef))).toEqual([...sourceRowLines])
  })

  it('transcribes every cell of every row verbatim', () => {
    for (const row of BOUNDARY_ROWS) {
      const sourceCells = cellsOf(L(lineNumberOf(row.sourceRef)))
      expect(row.component).toBe(sourceCells[0])
      BOUNDARY_COLUMN_IDS.forEach((columnId, index) => {
        expect(row.cells[columnId].verbatim).toBe(sourceCells[index + 1])
      })
    }
  })

  it('splits each cell into a leading outcome and, where there is one, the rest', () => {
    for (const row of BOUNDARY_ROWS) {
      for (const columnId of BOUNDARY_COLUMN_IDS) {
        const cell = row.cells[columnId]
        const rebuilt = cell.qualifier === null ? cell.outcome : `${cell.outcome} — ${cell.qualifier}`
        expect(rebuilt).toBe(cell.verbatim)
        expect(cell.qualifier === null).toBe(cell.qualifierKind === null)
      }
    }
  })
})

/* ── the uniformity that is the chapter's point ────────────────────────── */

describe('the agent rows that read the same in all four columns', () => {
  /** Measured: rows whose four permission cells are all the bare token. */
  const measured = sourceRowLines.filter((n) =>
    cellsOf(L(n))
      .slice(1)
      .every((cell) => cell === 'Explicitly prohibited'),
  )

  it('is exactly the set the module computes, and they are all agents', () => {
    const computed = uniformlyProhibitedRows()
    expect(computed.map((r) => lineNumberOf(r.sourceRef))).toEqual([...measured])
    expect(computed.every((r) => r.kind === 'agent')).toBe(true)
  })

  it('is every agent row in the matrix, which is what makes it a pattern', () => {
    expect(uniformlyProhibitedRows().map((r) => r.id)).toEqual(
      BOUNDARY_ROWS.filter((r) => r.kind === 'agent').map((r) => r.id),
    )
  })

  it('is corroborated by the ability register’s own prohibitions', () => {
    // Nothing here re-types a prohibition: the register is the source of the
    // wording and this asserts the two the matrix columns restate are the
    // two carried.
    const prohibited = AGENT_ROW_CORROBORATION.map((p) => p.prohibition)
    expect(prohibited).toContain('Release a Severity 1 hold')
    expect(prohibited).toContain('Classify deviations')
    for (const entry of AGENT_ROW_CORROBORATION) {
      expect(L(lineNumberOf(entry.sourceRef))).toContain(entry.prohibition)
    }
  })
})

/* ── the cell whose own text grants what the cell forbids ──────────────── */

/**
 * WHAT A QUALIFIER IS, CHECKED AGAINST THE CELL RATHER THAN TAKEN ON TRUST.
 *
 * `qualifierKind` was a third argument nothing verified. Flipping
 * `HUMAN_NOT_RULE_ENGINE` from `reason-for-not-applicable` to `condition`
 * passed all 26 unit and 13 component tests, and the screen then rendered
 * "Only where: a human does not execute the rule engine" — an inapplicability
 * drawn as a conditional grant. It is derived now, and these are the two
 * assertions that keep the derivation honest rather than merely present.
 */
describe('every qualifier kind is the one the cell’s own text implies', () => {
  const cells = BOUNDARY_ROWS.flatMap((row) => BOUNDARY_COLUMN_IDS.map((id) => row.cells[id]))

  it('reads every cell through the tree’s parser and agrees with it', () => {
    // The consumption, asserted rather than claimed: `cellFromSource` splits
    // token from clause for all 32 cells, and if this module ever grows a
    // second parser again the two will disagree here.
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) {
      const parsed = cellFromSource(cell.verbatim)
      expect(parsed.detail, cell.verbatim).toBe(
        cell.qualifier ?? `${cell.outcome}, stated bare in the source`,
      )
    }
  })

  it('never calls an inapplicability a condition, nor a grant a reason', () => {
    // Both directions, because a rule stated one way is satisfiable by a
    // derivation that returns the same answer for everything.
    const notApplicable = cells.filter((c) => c.verbatim.startsWith('Not applicable'))
    const granting = cells.filter((c) => c.verbatim.startsWith('Allowed'))
    expect(notApplicable.length).toBeGreaterThan(0)
    expect(granting.some((c) => c.qualifier !== null)).toBe(true)
    for (const cell of notApplicable) {
      expect(cell.qualifierKind, cell.verbatim).toBe('reason-for-not-applicable')
    }
    for (const cell of granting) {
      expect(cell.qualifierKind, cell.verbatim).toBe(cell.qualifier === null ? null : 'condition')
    }
    // And a bare token qualifies nothing, so it names no kind at all.
    for (const cell of cells.filter((c) => c.qualifier === null)) {
      expect(cell.qualifierKind, cell.verbatim).toBeNull()
    }
  })
})

describe('the Supervisor’s release cell, both halves', () => {
  const supervisor = boundaryRow('supervisor-human')
  const cell = supervisor.cells.releaseSeverity1Hold

  it('keeps the prohibition as the outcome and the affordance as a separate act', () => {
    expect(cell.verbatim).toBe(cellsOf(L(lineNumberOf(supervisor.sourceRef)))[4])
    expect(cell.outcome).toBe('Explicitly prohibited')
    expect(cell.qualifierKind).toBe('separate-act')
    expect(cell.separateAct).not.toBeNull()
  })

  it('is not the only qualified cell, and the others are NOT separate acts', () => {
    // The discriminator has to discriminate: other cells in this matrix carry
    // a clause after the em dash and none of them is a different act. The
    // count that used to stand in this comment was wrong by position; it is
    // removed rather than renumbered, and the assertion below is what the
    // reader can act on.
    const others = BOUNDARY_ROWS.flatMap((row) =>
      BOUNDARY_COLUMN_IDS.map((columnId) => row.cells[columnId]).filter(
        (c) => c.qualifier !== null && c !== cell,
      ),
    )
    expect(others.length).toBeGreaterThan(0)
    expect(others.every((c) => c.qualifierKind !== 'separate-act')).toBe(true)
    expect(others.every((c) => c.separateAct === null)).toBe(true)
  })

  it('points at the section 44.2 row that grants the request, and it reads Allowed', () => {
    const act = cell.separateAct
    if (act === null) throw new Error('The separate act is missing.')

    const grantLine = lineNumberOf(act.grantedAt)
    const grantCells = cellsOf(L(grantLine))
    expect(grantCells[0]).toBe(act.act)

    // The column is resolved from that matrix's own header rather than
    // counted: a hard-coded index is how the row above gets paraphrased.
    const headerLine = (() => {
      for (let n = grantLine; n > grantLine - 20; n -= 1) {
        if (cellsOf(L(n))[0] === 'Capability') return n
      }
      throw new Error('No Capability header above the section 44.2 row.')
    })()
    const supervisorColumn = cellsOf(L(headerLine)).indexOf('Supervisor')
    expect(supervisorColumn).toBeGreaterThan(0)
    expect(grantCells[supervisorColumn]).toBe(act.outcomeElsewhere)
    expect(act.outcomeElsewhere).toBe('Allowed')
  })

  it('cites, for the act it forbids, lines that carry that prohibition', () => {
    const act = cell.separateAct
    if (act === null) throw new Error('The separate act is missing.')
    expect(act.prohibitedAct).not.toBe(act.act)
    expect(act.prohibitionRefs.length).toBeGreaterThan(0)
    for (const ref of act.prohibitionRefs) {
      const text = L(lineNumberOf(ref))
      expect(text).toContain(act.prohibitedAct)
      expect(text).toContain('Explicitly prohibited')
    }
  })

  it('reads the prohibition in this matrix’s own cell too, not only elsewhere', () => {
    // The cell's own line carries the token but never the act's name -- the
    // release column is named once, in the header. Citing the cell for the
    // act's wording would be a citation of a line that does not carry it.
    expect(L(lineNumberOf(supervisor.sourceRef))).not.toContain('Release a Severity 1 hold')
    expect(cellsOf(L(HEADER_LINE))).toContain('May release a Severity 1 hold')
    expect(cell.outcome).toBe('Explicitly prohibited')
  })
})

/* ── safety is the opposite of fail-closed ─────────────────────────────── */

describe('what the source says about deterministic safety under a failure', () => {
  it('does not contain the phrase a brief once attributed to it', () => {
    expect(occurrences('centrally evidentiary actions fail closed')).toBe(0)
  })

  it('carries each pinned statement on the line it is pinned to', () => {
    expect(DETERMINISTIC_SAFETY_STATEMENTS.length).toBeGreaterThan(0)
    for (const statement of DETERMINISTIC_SAFETY_STATEMENTS) {
      expect(L(lineNumberOf(statement.sourceRef))).toContain(statement.text)
    }
  })

  it('says it on lines that are about an outage, not about an ordinary run', () => {
    for (const statement of DETERMINISTIC_SAFETY_STATEMENTS) {
      expect(statement.text.toLowerCase()).toMatch(/unaffected|untouched/)
    }
  })
})

describe('the standing the deterministic layer holds under any AI mode', () => {
  it('reads Allowed on every one of the operating modes', () => {
    for (const mode of AI_MODE_IDS) {
      expect(deterministicStandingUnder(mode).deterministicSafety).toBe('Allowed')
    }
  })

  it('renders the same matrix under every mode, so no mode can weaken it', () => {
    const first = deterministicStandingUnder(AI_MODE_IDS[0])
    for (const mode of AI_MODE_IDS) {
      const standing = deterministicStandingUnder(mode)
      expect(standing.rows).toEqual(first.rows)
      expect(standing.statements).toEqual(first.statements)
    }
  })

  it('still names the mode, because a standing with no state is not a standing', () => {
    const seen = new Set(AI_MODE_IDS.map((m) => deterministicStandingUnder(m).modeName))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('emits the deterministic-rules provenance class and no other', () => {
    // RESOLVED ON BOTH SIDES. Asserting the literal against the literal is a
    // claim about itself: reordering the classification tree of
    // L89443-L89455 would leave both standing. Compared against
    // `matrixCellProvenance`, which runs `resolveProvenance` over the same
    // facts, a change to that order moves both and this still holds — while a
    // module that quietly went back to a pinned string does not.
    expect(BOUNDARY_PROVENANCE_CLASS).toBe(matrixCellProvenance())
    // And it is the class the source names, so the pair cannot drift together
    // into being right about each other and wrong about the document.
    expect(provenanceClass(BOUNDARY_PROVENANCE_CLASS).name).toBe('Deterministic rules')
  })
})

/* ── the roster link, and the two absences it exposes ──────────────────── */

describe('the agent rows against chapter 44’s roster', () => {
  const rosterNames = AI_AGENT_ROSTER.map((a) => a.name)

  it('takes the name from the roster wherever the roster has one', () => {
    for (const row of BOUNDARY_ROWS.filter((r) => r.rosterAgentId !== null)) {
      const agent = AI_AGENT_ROSTER.find((a) => a.id === row.rosterAgentId)
      expect(agent).toBeDefined()
      expect(row.component).toBe(agent?.name)
    }
  })

  it('states, rather than omits, the agent row the roster does not hold', () => {
    const unrostered = BOUNDARY_ROWS.filter((r) => r.kind === 'agent' && r.rosterAgentId === null)
    expect(unrostered.length).toBeGreaterThan(0)
    for (const row of unrostered) {
      expect(rosterNames).not.toContain(row.component)
      expect(row.rosterAbsence).not.toBeNull()
      // Measured, not asserted: the matrix's own line is the evidence that
      // this component is named there and the roster's line is the evidence
      // that it is not named here.
      expect(L(lineNumberOf(row.sourceRef))).toContain(row.component)
    }
    for (const row of BOUNDARY_ROWS.filter((r) => r.rosterAgentId !== null)) {
      expect(row.rosterAbsence).toBeNull()
    }
  })

  it('does not carry the roster agent that the matrix leaves out', () => {
    const inMatrix = new Set(BOUNDARY_ROWS.map((r) => r.component))
    const missing = AI_AGENT_ROSTER.filter((a) => !inMatrix.has(a.name))
    expect(missing.length).toBeGreaterThan(0)
    // and the source agrees: none of those names occurs in the matrix span.
    for (const agent of missing) {
      for (const n of sourceRowLines) expect(L(n)).not.toContain(agent.name)
    }
  })
})

describe('boundaryRow', () => {
  it('returns the row it is asked for', () => {
    expect(boundaryRow('on-device-deterministic-layer').kind).toBe('deterministic')
  })

  it('refuses an identifier the matrix does not hold, rather than returning nothing', () => {
    // @ts-expect-error — the point of the guard is the value the types exclude.
    expect(() => boundaryRow('vision-reasoning-agent')).toThrow(/vision-reasoning-agent/)
  })
})

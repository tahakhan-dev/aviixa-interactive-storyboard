import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  CHAPTER_44_CELL_DECISIONS,
  CHAPTER_44_COLUMN_ROLES,
  CHAPTER_44_LINK_OUTS,
  CHAPTER_44_MATRICES,
  DEVIATION_MATRIX,
  HANDOFF_MATRIX,
  PREVENTION_MATRIX,
  allChapter44Rows,
  capabilityOf,
  cellPermits,
  cellTextOf,
  chapter44Affordance,
  chapter44Cell,
  chapter44DecisionIn,
  chapter44Decisions,
  chapter44Header,
  chapter44Matrix,
  decisionIdInCell,
  linkOutsMissingAnOwner,
  linkOutsWithoutSurfaceWords,
  outcomeOf,
  rowsTheWorkerCannotPerform,
  rowsWithNoPermissiveCell,
  type Chapter44Row,
} from '@/ai/agents/matrices'
import { roleById } from '@/domain/roles'
import { CC_MATRIX_COLUMNS } from '@/surfaces/cc/decisions/link-outs'
import { PERMISSION_OUTCOMES } from '@/policy/decision'

/**
 * Slice 11, wave 1, task 7 — chapter 44's three role matrices.
 *
 * WHAT THIS FILE IS FOR. Not "the matrices exist". Six things that were each
 * wrong, or each capable of going wrong silently:
 *
 *   1. THE ROW SPANS ARE COUNTED HERE, NOT TRANSCRIBED. Both briefs for this
 *      task gave row spans; all three were right, and the previous wave's
 *      brief gave a roster span that was header, separator and two of four
 *      rows. Every span below is re-derived by walking the pipe-table under
 *      the header at run time.
 *   2. THE TENANT ADMIN LOCATOR IN BOTH BRIEFS IS OFF BY ONE. They cite
 *      L91767 for a Tenant Admin `Allowed` on the degradation state. L91767
 *      is "Dismiss guidance" and its Tenant Admin cell reads "Not applicable
 *      — dismissal is a run-player action". The row is L91768. Both lines are
 *      asserted below so the correction cannot be un-made quietly.
 *   3. THE ROWS WITH NO PERMISSIVE CELL ARE MEASURED. The brief names one.
 *      There are three, across two matrices.
 *   4. THE §44.2 "ACTS ELSEWHERE" COUNT DEPENDS ON THE CRITERION and the two
 *      briefs use two. Both numbers are computed here from the matrix.
 *   5. THE LINK-OUT MEMBERSHIP GATE IS PROVED BY ADDING. A gate that passes
 *      because a list is the length it was is not a gate.
 *   6. THE COLUMN ORDER IS NOT THE ONE THE REST OF THE TREE USES. Chapter 44
 *      runs Worker first; `CC_MATRIX_COLUMNS` runs Tenant Admin first. Both
 *      are live, and the difference is asserted rather than left to be
 *      rediscovered by whoever reads a cell positionally.
 *
 * Every count and every locator below is re-derived from the frozen bytes. A
 * count copied into an assertion is a count that has stopped measuring.
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

const linesCarrying = (token: string): readonly number[] =>
  LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the axis ──────────────────────────────────────────────────────────── */

describe('the shared column axis', () => {
  it('rebuilds the header from the role registry and finds it verbatim', () => {
    const header = chapter44Header()
    // DERIVED, NOT RE-TYPED. This assertion used to spell the five role names
    // out as a literal — a second private copy of exactly the axis the
    // production module went to the trouble of not writing down. Built from
    // the column order and the role registry it says what it means: the
    // header is those five names, in that order, and nothing else. What it
    // does NOT prove is that they are the SOURCE's names; the line below,
    // which reads the frozen bytes, is what proves that, and the two are only
    // worth anything together.
    expect(header).toBe(
      `| Capability | ${CHAPTER_44_COLUMN_ROLES.map((r) => roleById(r).name).join(' | ')} |`,
    )
    expect(CHAPTER_44_MATRICES.map((m) => m.headerLine)).toEqual([91_761, 92_028, 92_300])
    for (const line of CHAPTER_44_MATRICES.map((m) => m.headerLine)) expect(L(line)).toBe(header)
  })

  /**
   * THE HEADER IS NOT UNIQUE TO CHAPTER 44, and the brief says "all three
   * matrices share one axis, confirmed verbatim" without saying that a fourth
   * table shares it too. §36.6's sync-conflict review panel carries the
   * identical header at L80547 over nine data rows on the Command Center.
   * Locating chapter 44's matrices by header text alone therefore picks up a
   * matrix belonging to another surface and another slice.
   *
   * The two are also SPELLED differently — §36.6 backticks its tokens
   * (`` `Explicitly prohibited` ``) where chapter 44 writes them bare — and
   * that difference is not a safeguard. It used to be claimed as one here:
   * while this module carried its own six-token `startsWith` decoder, a
   * §36.6 cell threw, and the throw was pinned as the thing keeping the two
   * tables apart. `outcomeOf` now routes through `cellFromSource`, which
   * handles all three of the source's backtick placements on purpose, so it
   * reads a §36.6 cell perfectly well. Nothing was lost: the discriminator
   * was never the decoder, it is the HEADER LINE, asserted above — chapter 44
   * owns three of the four tables carrying this header and §36.6 owns the
   * fourth.
   */
  it('is not the only table on this axis — §36.6 shares the header', () => {
    const found = linesCarrying(chapter44Header())
    expect(found).toEqual([80_547, 91_761, 92_028, 92_300])
    expect(L(80_545)).toContain('Supporting table — panel permissions')
    expect(L(80_549)).toContain('`Explicitly prohibited`')
    expect(L(91_769)).not.toContain('`Explicitly prohibited`')
    // And it decodes, which is the point: the tables are told apart by the
    // line they are at, never by whether the cell parses.
    expect(outcomeOf('`Explicitly prohibited` — the worker never sees a conflict')).toBe(
      'explicitlyProhibited',
    )
  })

  it('runs Worker first where the Command Center matrices run Tenant Admin first', () => {
    const chapter44Names = chapter44Header()
      .replace(/^\| Capability \| /, '')
      .replace(/ \|$/, '')
      .split(' | ')
    // Same five names, different order. Reading a cell positionally across
    // the two is how a paraphrase of the wrong role survives review.
    expect([...chapter44Names].sort()).toEqual([...CC_MATRIX_COLUMNS].sort())
    expect(chapter44Names).not.toEqual([...CC_MATRIX_COLUMNS])
    expect(chapter44Names[0]).toBe('Worker')
    expect(CC_MATRIX_COLUMNS[0]).toBe('Tenant Admin')
  })
})

/* ── the rows, counted rather than inferred from a span ────────────────── */

/** The contiguous run of table rows under a header, minus the separator. */
const rowLinesUnder = (headerLine: number): readonly number[] => {
  const rows: number[] = []
  for (let n = headerLine + 1; L(n).startsWith('|'); n += 1) {
    if (/^\|[\s|:-]+\|$/.test(L(n))) continue
    rows.push(n)
  }
  return rows
}

describe('the three matrices, row by row', () => {
  it.each(CHAPTER_44_MATRICES)(
    'section $section holds exactly the data rows under its header',
    (matrix) => {
      const measured = rowLinesUnder(matrix.headerLine)
      expect(matrix.rows.map((r) => r.line)).toEqual(measured)
    },
  )

  it('measures nine, nine and eight data rows', () => {
    expect(rowLinesUnder(91_761)).toHaveLength(9)
    expect(rowLinesUnder(92_028)).toHaveLength(9)
    expect(rowLinesUnder(92_300)).toHaveLength(8)
    expect(PREVENTION_MATRIX).toHaveLength(9)
    expect(DEVIATION_MATRIX).toHaveLength(9)
    expect(HANDOFF_MATRIX).toHaveLength(8)
  })

  it('carries every row byte for byte from the frozen source', () => {
    for (const row of allChapter44Rows()) {
      expect(row.rowText, `row ${row.id} at L${row.line}`).toBe(L(row.line))
    }
  })

  it('gives every row a unique id', () => {
    const ids = allChapter44Rows().map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

/* ── the cells ─────────────────────────────────────────────────────────── */

describe('decoding a cell', () => {
  it('decodes all one hundred and thirty cells into the closed vocabulary', () => {
    const used = new Set<string>()
    let counted = 0
    for (const row of allChapter44Rows()) {
      for (const role of CHAPTER_44_COLUMN_ROLES) {
        used.add(outcomeOf(cellTextOf(row, role)))
        counted += 1
      }
    }
    expect(counted).toBe(allChapter44Rows().length * CHAPTER_44_COLUMN_ROLES.length)
    for (const outcome of used) expect(PERMISSION_OUTCOMES).toContain(outcome)
    // Six of the nine. The three absent members are named so a reader can see
    // they were checked for rather than forgotten.
    expect([...used].sort()).toEqual([
      'allowed',
      'allowedWithConditions',
      'explicitlyProhibited',
      'notApplicable',
      'readOnly',
      'unavailable',
    ])
  })

  it('refuses a cell it cannot decode rather than defaulting one', () => {
    // The refusal is `cellFromSource`'s, and it names the line the closed
    // vocabulary comes from rather than this module's opinion of it.
    expect(() => outcomeOf('Probably fine')).toThrow(/not one of the nine source tokens \(L10238\)/)
  })

  /**
   * THE HALF OF L10238 THIS MODULE USED TO QUOTE AND NOT APPLY. `cellTextOf`
   * cites L10238 in its own error message for the no-blank-cell rule; the
   * stated-reason rule sits on the same line and the local decoder did not
   * carry it, so `Not applicable` with nothing after it decoded happily.
   */
  it('refuses a Not applicable cell that states no reason, which L10238 requires', () => {
    expect(() => outcomeOf('Not applicable')).toThrow(/no stated reason \(L10238\)/)
    expect(outcomeOf('Not applicable — a human does not execute the rule engine')).toBe(
      'notApplicable',
    )
  })

  /**
   * THE ONE SHAPE THAT DOES NOT ROUTE THROUGH `cellFromSource`, asserted as
   * the narrow exception it is rather than left to be discovered. Five cells
   * write a prepositional phrase after `Read-only` with no separator, and
   * L10238's separator set has no space in it — widening it there would let
   * `Allowed` swallow `Allowed with conditions` across the whole tree.
   */
  it('reads the run-on Read-only qualifier chapter 44 writes without a separator', () => {
    expect(outcomeOf('Read-only through the Studio corpus')).toBe('readOnly')
    expect(chapter44Cell('Read-only via the Delivery Operations Hub record').detail).toBe(
      'via the Delivery Operations Hub record',
    )
    // Narrow: it admits the two prepositions the source uses and nothing else.
    expect(() => outcomeOf('Read-only whenever the corpus allows')).toThrow(/L10238/)
  })

  it('tests the conditional spelling before the unconditional one', () => {
    expect(outcomeOf('Allowed with conditions — optional recipient per configuration')).toBe(
      'allowedWithConditions',
    )
    expect(outcomeOf('Allowed — automatic and immediate')).toBe('allowed')
  })

  it('reaches a cell by role and never by position', () => {
    const row = chapter44Matrix('prevention').rows.find((r) => r.line === 91_768)!
    expect(capabilityOf(row)).toBe('See the honest degradation state')
    expect(cellTextOf(row, 'TENANT_ADMIN')).toBe('Allowed')
    expect(cellTextOf(row, 'READONLY_AUDITOR')).toBe(
      'Explicitly prohibited — the Read-only Auditor has no Command Center access [SoW Fact — §3.5]',
    )
  })
})

/* ── the off-by-one both briefs shipped ────────────────────────────────── */

it('pins L91767 and L91768 apart, because both briefs cite the first for the second', () => {
  expect(L(91_767)).toContain('| Dismiss guidance |')
  expect(L(91_767)).not.toContain('honest degradation state')
  expect(L(91_768)).toContain("| See the honest degradation state |")

  const dismiss = PREVENTION_MATRIX.find((r) => r.line === 91_767)!
  const honest = PREVENTION_MATRIX.find((r) => r.line === 91_768)!
  // The claim in both briefs is a Tenant Admin `Allowed`. It is on L91768.
  expect(cellTextOf(dismiss, 'TENANT_ADMIN')).toBe(
    'Not applicable — dismissal is a run-player action',
  )
  expect(cellTextOf(honest, 'TENANT_ADMIN')).toBe('Allowed')
})

/* ── rows with no permissive cell ──────────────────────────────────────── */

describe('a row no column permits', () => {
  it('measures three of them, not the one the brief names', () => {
    expect(rowsWithNoPermissiveCell().map((r) => r.line)).toEqual([91_764, 91_771, 92_308])
  })

  it('renders the absolute §44.1 row as an absence of control, not five refusals', () => {
    const relax = PREVENTION_MATRIX.find((r) => r.line === 91_771)!
    // All five cells are `Explicitly prohibited`, measured rather than said.
    expect(
      CHAPTER_44_COLUMN_ROLES.map((role) => outcomeOf(cellTextOf(relax, role))),
    ).toEqual(Array(5).fill('explicitlyProhibited'))
    for (const role of CHAPTER_44_COLUMN_ROLES) {
      const drawn = chapter44Affordance(relax, role)
      expect(drawn.kind).toBe('absence-of-control')
    }
  })

  it('says WHY nothing is drawn, and labels the generalisation a build inference', () => {
    const relax = PREVENTION_MATRIX.find((r) => r.line === 91_771)!
    const drawn = chapter44Affordance(relax, 'QUALITY_MANAGER')
    if (drawn.kind !== 'absence-of-control') throw new Error('expected an absence of control')
    expect(drawn.statement).toContain('L91771')
    expect(drawn.statement).toContain('SB-AI-011')
    expect(drawn.statement).toContain('L87376')
    expect(drawn.statement).toContain('build inference')
  })
})

/* ── the inverted-polarity row ─────────────────────────────────────────── */

describe('the row whose named capability is itself a negative', () => {
  it('is exactly one row, L92308, and its five cells are measured not assumed', () => {
    const negatives = allChapter44Rows().filter((r) => r.polarity === 'negative')
    expect(negatives.map((r) => r.line)).toEqual([92_308])

    const row = negatives[0]!
    expect(capabilityOf(row)).toBe('Be blocked from starting a shift by a missing acknowledgement')
    // The brief says `Explicitly prohibited` across the row. Four of five.
    expect(CHAPTER_44_COLUMN_ROLES.map((role) => outcomeOf(cellTextOf(row, role)))).toEqual([
      'explicitlyProhibited',
      'explicitlyProhibited',
      'explicitlyProhibited',
      'explicitlyProhibited',
      'notApplicable',
    ])
  })

  it('draws nothing for any role and says the blocking does not occur', () => {
    const row = HANDOFF_MATRIX.find((r) => r.line === 92_308)!
    for (const role of CHAPTER_44_COLUMN_ROLES) {
      const drawn = chapter44Affordance(row, role)
      if (drawn.kind !== 'inverted-polarity') {
        throw new Error(`L92308 drew \`${drawn.kind}\` for ${role}; a negative row draws nothing`)
      }
      expect(drawn.statement).toContain('A shift is never blocked')
    }
  })

  it('refuses a negative row that does not say what the denial denies', () => {
    const row = HANDOFF_MATRIX.find((r) => r.line === 92_308)!
    const silent: Chapter44Row = { ...row, polarityStatement: null }
    expect(() => chapter44Affordance(silent, 'SUPERVISOR')).toThrow(
      /says nothing about what the denial denies/,
    )
  })
})

/* ── §44.2's disputed count ────────────────────────────────────────────── */

it("computes §44.2's acts-elsewhere count under both briefs' criteria", () => {
  const deviation = chapter44Matrix('deviation-and-containment')
  // Criterion A — the Worker cell does not permit. Six rows, L92033-L92038.
  const notOnTheDevice = rowsTheWorkerCannotPerform(deviation)
  expect(notOnTheDevice.map((r) => r.line)).toEqual([
    92_033, 92_034, 92_035, 92_036, 92_037, 92_038,
  ])
  // Criterion B — every row but the two automatic acts. Seven, L92032-L92038.
  const notAutomatic = deviation.rows.filter((r) => r.line >= 92_032)
  expect(notAutomatic).toHaveLength(7)
  // The row the two criteria disagree about, and why: its Worker cell permits.
  const checklist = deviation.rows.find((r) => r.line === 92_032)!
  expect(cellTextOf(checklist, 'WORKER')).toBe('Allowed')
  expect(cellPermits(checklist, 'WORKER')).toBe(true)
})

/* ── the open decisions in the cells ───────────────────────────────────── */

describe('the two §44.3 cells that defer to an open decision', () => {
  it('finds four cells across two rows, and no others in any matrix', () => {
    const carrying: string[] = []
    for (const row of allChapter44Rows()) {
      for (const role of CHAPTER_44_COLUMN_ROLES) {
        const id = decisionIdInCell(cellTextOf(row, role))
        if (id !== null) carrying.push(`L${row.line} ${role} ${id}`)
      }
    }
    expect(carrying).toEqual([
      'L92306 SUPERVISOR DEC-HANDOFF-001',
      'L92306 QUALITY_MANAGER DEC-HANDOFF-001',
      'L92307 SUPERVISOR DEC-HANDOFF-002',
      'L92307 QUALITY_MANAGER DEC-HANDOFF-002',
    ])
  })

  it('renders them DISABLED with the identifier and every reading, never enabled', () => {
    const pack = HANDOFF_MATRIX.find((r) => r.line === 92_306)!
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      // The token is permissive. The rendering is not.
      expect(outcomeOf(cellTextOf(pack, role))).toBe('allowedWithConditions')
      const drawn = chapter44Affordance(pack, role)
      if (drawn.kind !== 'open-decision-disabled') {
        throw new Error(`L92306/${role} drew \`${drawn.kind}\`; an undecided cell is not enabled`)
      }
      expect(drawn.identifier).toBe('DEC-HANDOFF-001')
      expect(drawn.note).toContain('disabled')
      // Every option the card offers, not a summary of two.
      expect(drawn.decisions.flatMap((d) => d.readings).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('refuses a cell that names a decision with no registered readings', () => {
    const pack = HANDOFF_MATRIX.find((r) => r.line === 92_306)!
    const ghost: Chapter44Row = {
      ...pack,
      rowText: pack.rowText.replace(/DEC-HANDOFF-001/g, 'DEC-GHOST-999'),
    }
    expect(() => chapter44Affordance(ghost, 'SUPERVISOR')).toThrow(/DEC-GHOST-999/)
  })

  it('holds both chapters that ask a question under `DEC-HANDOFF-001`', () => {
    const both = chapter44Decisions('DEC-HANDOFF-001')
    expect(both.map((d) => d.chapter).sort()).toEqual(['30', '44.3'])
    // The two questions are different, and the source proves it at both lines.
    expect(L(92_360)).toContain('whether a deterministic handoff pack is produced when the agent fails')
    expect(L(61_210)).toContain('Where does an unacknowledged shift-handoff brief escalate')
    // And the whole-document index attributes the identifier to chapter 30.
    expect(L(115_416)).toContain('`DEC-HANDOFF-001` | Chapter 30')
  })

  /**
   * THE COMPOUND KEY THE INTERFACE COMMENT CREDITS, now that there is one.
   * `chapter44Decisions` keys on the identifier alone and the renderer showing
   * both records is what protects §44.3 — but a caller that HAS a chapter had
   * no way to say so, and the comment claimed it did.
   */
  it('answers by chapter, and refuses the other chapter’s question', () => {
    expect(chapter44DecisionIn('DEC-HANDOFF-001', '44.3').question).not.toBe(
      chapter44DecisionIn('DEC-HANDOFF-001', '30').question,
    )
    // Never a fallback: the identifier is held, the chapter is not, and that
    // is an error rather than a shrug that hands back chapter 30's question.
    expect(() => chapter44DecisionIn('DEC-HANDOFF-001', '44.1')).toThrow(
      /held for §44.3, §30, and that is a different question/,
    )
    expect(() => chapter44DecisionIn('DEC-GHOST-999', '44.3')).toThrow(/no record for that identifier/)
  })

  it('quotes every reading and every recommendation from the line it cites', () => {
    for (const decision of CHAPTER_44_CELL_DECISIONS) {
      if (decision.chapter === '30') continue
      for (const reading of decision.readings) {
        const line = Number(reading.locator.replace(/^L/, ''))
        expect(L(line), `${decision.identifier} reading at ${reading.locator}`).toContain(
          reading.text,
        )
      }
      const card = Number(decision.sourceRef.split(';')[0]!.trim().replace(/^L/, ''))
      expect(L(card)).toContain(decision.recommendation)
      expect(L(card)).toContain(decision.owner)
      expect(L(card)).toContain(decision.question)
    }
  })
})

/* ── the acts held on another surface ──────────────────────────────────── */

describe('link-outs', () => {
  it('covers every cell whose own words place the act on another surface', () => {
    expect(linkOutsMissingAnOwner()).toEqual([])
    expect(linkOutsWithoutSurfaceWords()).toEqual([])
  })

  /**
   * THE `unnamed` OWNER IS CHECKED, IT IS JUST CHECKED THE OTHER WAY ROUND.
   *
   * `linkOutsWithoutSurfaceWords` skips `kind: 'unnamed'` before its surface-
   * word test, which reads as an exemption and is not one: an unnamed owner is
   * registered BECAUSE its cell names no surface, so that test would convict
   * it for being what it says it is. What can rot is the inverse — the row
   * changes and the cell starts naming a surface while the registration still
   * says it names none — and that is now the assertion. Both halves planted
   * here, because a branch nobody enters is a branch nobody has run.
   */
  it('holds the unnamed owner to the claim it actually makes', () => {
    const unnamed = CHAPTER_44_LINK_OUTS.filter((l) => l.owner.kind === 'unnamed')
    expect(unnamed.length).toBeGreaterThan(0)
    for (const link of unnamed) {
      const row = allChapter44Rows().find((r) => r.id === link.rowId) as Chapter44Row
      const text = cellTextOf(row, link.role)
      // Its quoted words are the cell's, and the cell really names no surface.
      expect(link.owner.kind === 'unnamed' && link.owner.words).toBe(text)
      expect(text).toBe('Read-only via the record')
    }
  })

  /**
   * PROVED BY ADDING. Removing a registration would only show that the list
   * is the length it was. This adds a row whose cell names the Studio and
   * that no registration covers — the exact shape of the defect the guard
   * exists to catch — and the guard must name it.
   */
  it('goes red when a cell placing an act elsewhere is ADDED with no owner', () => {
    const planted: Chapter44Row = {
      id: 'planted-act-held-elsewhere',
      rowText:
        '| Retune the coaching threshold | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — through the Studio approval chain | Explicitly prohibited | Explicitly prohibited |',
      line: 0,
      polarity: 'positive',
      polarityStatement: null,
    }
    const offenders = linkOutsMissingAnOwner([...allChapter44Rows(), planted])
    expect(offenders).toHaveLength(1)
    expect(offenders[0]).toContain('planted-act-held-elsewhere')
    expect(offenders[0]).toContain('Quality Manager')
    // The guard names the word it actually matched. Chapter 44 writes "the
    // Studio" as often as the registered name, so the short form is what a
    // reader is sent back to the cell to look for.
    expect(offenders[0]).toContain('the act on the Studio')
    expect(offenders[0]).toContain('through the Studio approval chain')
  })

  it('registers six cells in §44.1 across the four rows the brief names', () => {
    const prevention = new Set(PREVENTION_MATRIX.map((r) => r.id))
    const inPrevention = CHAPTER_44_LINK_OUTS.filter((l) => prevention.has(l.rowId))
    expect(inPrevention).toHaveLength(6)
    const rows = [...new Set(inPrevention.map((l) => l.rowId))]
    expect(
      rows.map((id) => PREVENTION_MATRIX.find((r) => r.id === id)!.line).sort(),
    ).toEqual([91_763, 91_765, 91_769, 91_770])
  })

  it('draws no link where the cell names two owners and chooses neither', () => {
    const row = PREVENTION_MATRIX.find((r) => r.line === 91_763)!
    const drawn = chapter44Affordance(row, 'SUPERVISOR', 'SUPERVISOR')
    if (drawn.kind !== 'link-out') throw new Error('expected a link-out')
    expect(drawn.linkState).toBe('owner-undecided')
    expect(drawn.linkHref).toBeNull()
  })

  it('draws no link where the cell names a record and no surface', () => {
    const row = HANDOFF_MATRIX.find((r) => r.line === 92_309)!
    expect(cellTextOf(row, 'READONLY_AUDITOR')).toBe('Read-only via the record')
    const drawn = chapter44Affordance(row, 'READONLY_AUDITOR', 'READONLY_AUDITOR')
    if (drawn.kind !== 'link-out') throw new Error('expected a link-out')
    expect(drawn.linkState).toBe('unresolved')
    expect(drawn.linkHref).toBeNull()
  })

  it('checks the pointer instead of asserting it, and collapses when the role cannot open it', () => {
    const row = PREVENTION_MATRIX.find((r) => r.line === 91_769)!
    // The Quality Manager reaches the Studio, so the link is drawn.
    const forQm = chapter44Affordance(row, 'QUALITY_MANAGER', 'QUALITY_MANAGER')
    if (forQm.kind !== 'link-out') throw new Error('expected a link-out')
    expect(forQm.linkState).toBe('link')
    expect(forQm.linkHref).toBe('/studio')

    // The Worker does not, so the same cell collapses to a statement.
    const forWorker = chapter44Affordance(row, 'QUALITY_MANAGER', 'WORKER')
    if (forWorker.kind !== 'link-out') throw new Error('expected a link-out')
    expect(forWorker.linkState).toBe('statement')
    expect(forWorker.linkHref).toBeNull()
  })

  it('draws a link and not a switch on the row MOD-CC-08 contradicts', () => {
    const row = PREVENTION_MATRIX.find((r) => r.line === 91_769)!
    const drawn = chapter44Affordance(row, 'QUALITY_MANAGER', 'QUALITY_MANAGER')
    expect(drawn.kind).toBe('link-out')
    expect(drawn.kind).not.toBe('control')
  })
})

/* ── the plain cells ───────────────────────────────────────────────────── */

it('draws a control only where the cell permits and the act is on this surface', () => {
  const release = DEVIATION_MATRIX.find((r) => r.line === 92_035)!
  const drawn = chapter44Affordance(release, 'QUALITY_MANAGER')
  if (drawn.kind !== 'control') throw new Error(`expected a control, got ${drawn.kind}`)
  expect(drawn.outcome).toBe('allowed')
  expect(drawn.note).toBe('Allowed')
  // And the Worker's cell on the same row is a refusal, never a disabled control.
  expect(chapter44Affordance(release, 'WORKER').kind).toBe('refusal')
})

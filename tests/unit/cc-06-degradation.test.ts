import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { ownersOf } from '@/ai/fallbacks/registry'
import { cellFromSource } from '@/policy/columns'
import { CC06_MATRIX } from '@/surfaces/cc/modules/cc-06/matrix'
import {
  CC06_DEGRADATION,
  CC06_DEGRADATION_FACTS,
  CC06_LANEA_SEAM,
  CC06_REVERSAL_CELL,
  CC06_REVERSAL_CELL_TEXT,
  CC06_REVERSE_CONTROL,
  cc06DegradationProvenance,
  cc06ReversalDecision,
  cc06RowsNamingReversal,
} from '@/surfaces/cc/modules/cc-06/degradation'

/**
 * `MOD-CC-06`'S ARTIFICIAL-INTELLIGENCE OVERLAY, AGAINST THE FROZEN SOURCE.
 *
 * Two things are proved here and neither is proved by reading a literal back:
 *
 *  - THE REVERSE CONTROL IS NEITHER OMITTED NOR ENABLED, and both halves of
 *    that come off ONE source cell rather than from a flag someone set. The
 *    cell's token says the reversal exists, so omitting it would contradict
 *    the source; the cell's own condition names an open decision, so no role
 *    holds it and enabling it for the Quality Manager would invent an
 *    authority. `cc06ReversalDecision` derives the second from the first.
 *  - THE MODULE'S DEGRADATION CONTRACT IS RESOLVED, NOT CHOSEN. Its register
 *    row names a bare fallback literal that four chapters own. The row's own
 *    chapter is what disambiguates, so the contract is looked up on the
 *    compound key and the other three owners are carried beside it.
 *
 * Every assertion below resolves its value through the shipped function and
 * compares against the frozen source read at run time, never against a string
 * retyped from the same place the code got it.
 */

const BLUEPRINT = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')

/** The frozen source, split once. Eighteen megabytes per call is not free. */
let lines: readonly string[] | null = null

/** One line of the frozen source, 1-based, exactly as it is written. */
function sourceLine(n: number): string {
  lines ??= readFileSync(BLUEPRINT, 'utf8').split('\n')
  return lines[n - 1] ?? ''
}

describe('the reversal cell is the source’s own, read from the frozen file', () => {
  // FAILS IF: the transcribed cell text drifts from the source cell, in
  // either direction. The line is split on `|` and the Reversible column is
  // taken by its position under the header rather than by a substring match,
  // so a cell moving columns fails instead of passing on a coincidence.
  // PLANTED: changed `authority carried as` to `authority carried by` in
  // `CC06_REVERSAL_CELL_TEXT`.
  // RED: "AssertionError: expected '`Allowed` — reversible, authority car…'
  //   to be '`Allowed` — reversible, authority car…' // Object.is equality"
  //   — the truncation is vitest's. RESTORED.
  it('transcribes the Reversible cell of the Lane A row verbatim', () => {
    const header = sourceLine(87737).split('|').map((c) => c.trim())
    const laneA = sourceLine(87739).split('|').map((c) => c.trim())
    const column = header.indexOf('Reversible')
    expect(column, 'the header row must carry a Reversible column').toBeGreaterThan(0)
    expect(laneA[1]).toBe('Lane A')
    expect(CC06_REVERSAL_CELL_TEXT).toBe(laneA[column])
  })

  // FAILS IF: the cell stops parsing to a permissive token. The token is what
  // forbids omitting the control, so it is asserted as the parser reports it
  // rather than as a literal beside the text it came from.
  // PLANTED: replaced the token with '`Explicitly prohibited` — none,
  //   authority carried as `DEC-LANEA-001`'.
  // RED: "AssertionError: expected 'explicitlyProhibited' to be 'allowed'".
  //   The verbatim test above went red on the same plant, correctly.
  //   RESTORED.
  it('parses to a permissive token, which is what forbids omitting the control', () => {
    expect(CC06_REVERSAL_CELL).toStrictEqual(cellFromSource(CC06_REVERSAL_CELL_TEXT))
    expect(CC06_REVERSAL_CELL.outcome).toBe('allowed')
  })
})

describe('the control renders disabled because the cell names an open decision', () => {
  // FAILS IF: the decision handed to the control becomes actionable, or stops
  // naming the identifier. `outcome` is asserted first because that is the
  // field `WriteControl` branches on: anything but `allowed` reaches its
  // disabled branch, and `allowed` would draw a live button.
  // PLANTED: changed the constructed outcome in `cc06ReversalDecision` to
  //   'allowed'.
  // RED: "AssertionError: expected 'allowed' not to be 'allowed' //
  //   Object.is equality". RESTORED.
  it('derives a non-actionable decision naming the open decision', () => {
    const decision = cc06ReversalDecision(CC06_REVERSAL_CELL)
    expect(decision.outcome).not.toBe('allowed')
    expect(decision.outcome).toBe('clientDecisionRequired')
    expect(decision.reasonCode).toBe('DECISION_OPEN')
    expect(decision.explanation).toContain(CC06_REVERSE_CONTROL.openDecision)
  })

  // FAILS IF: the identifier is hand-assigned rather than read out of the
  // cell. The expected value is recovered from the frozen source line by a
  // regex over the cell text, so a constant typed into the module cannot
  // satisfy it while the source says something else.
  // PLANTED: replaced the derivation with the literal 'DEC-LANEB-001'.
  // RED: "AssertionError: expected 'DEC-LANEB-001' to be 'DEC-LANEA-001'",
  //   and the test above went red too — "expected 'Who may reverse a Lane A
  //   refinement i…' to contain 'DEC-LANEB-001'". RESTORED.
  it('takes the identifier out of the cell rather than out of a constant', () => {
    const fromSource = /DEC-[A-Z]+-\d+/.exec(CC06_REVERSAL_CELL.detail)
    expect(fromSource).not.toBeNull()
    expect(CC06_REVERSE_CONTROL.openDecision).toBe(fromSource?.[0])
    expect(sourceLine(87729)).toContain(CC06_REVERSE_CONTROL.openDecision)
  })

  // FAILS IF: the derivation stops being a derivation. A cell whose condition
  // names no open decision must not silently fall through to a disabled
  // control — the disablement is the consequence of the open decision, and a
  // function that disabled regardless would be a hand-set flag wearing a
  // function's name.
  // PLANTED: changed the guard to `if (false)`, so the function disables
  //   whatever it is handed.
  // RED: "AssertionError: expected [Function] to throw an error". RESTORED.
  it('refuses to disable a cell that names no open decision', () => {
    expect(() => cc06ReversalDecision(cellFromSource('`Allowed` — reversible'))).toThrow(
      /names no open decision/,
    )
  })
})

describe('the matrix has no row for the reversal, established by scanning it', () => {
  // FAILS IF: a row naming reversal, Lane A or an undo appears in the matrix
  // and the module keeps saying there is none. Membership is proved by ADDING
  // a row to the scanned input, never by counting.
  // PLANTED: replaced the scan's body with `return []`.
  // RED: "AssertionError: expected [] to have a length of 1 but got +0" —
  //   the ADDED case is what goes red, which is the point: the first
  //   assertion passes vacuously on a scan that finds nothing. RESTORED.
  it('finds no matrix row naming reversal, and finds one when one is added', () => {
    expect(cc06RowsNamingReversal(CC06_MATRIX)).toStrictEqual([])

    const added = [
      ...CC06_MATRIX,
      { ...CC06_MATRIX[0]!, ordinal: 9, capability: 'Reverse a Lane A refinement' },
    ]
    const found = cc06RowsNamingReversal(added)
    expect(found).toHaveLength(1)
    expect(found[0]?.capability).toBe('Reverse a Lane A refinement')
  })

  // FAILS IF: the inverted-polarity row is ever handed to the reversal
  // scanner as a match. "Turn learning off" names a NEGATIVE capability, so a
  // prohibition on it means the behaviour must not occur; treating it as a
  // capability with a control would invent the affordance.
  // PLANTED: widened the scan's pattern with `|learn`.
  // RED: "AssertionError: expected [ { ordinal: 6, …(3) } ] to strictly
  //   equal []". The ADDED test above also went red — "expected [ { ordinal:
  //   5, …(3) }, …(1) ] to strictly equal []" — because the widened pattern
  //   also swallows "See the read-only learning view". RESTORED.
  it('does not treat the inverted-polarity learning row as a reversal row', () => {
    const inverted = CC06_MATRIX.find((r) => r.capability === 'Turn learning off')
    expect(inverted, 'the inverted-polarity row must still be in the matrix').toBeDefined()
    expect(sourceLine(37299)).toContain('Turn learning off')
    expect(sourceLine(37299)).toContain('no such switch exists')
    expect(cc06RowsNamingReversal([inverted!])).toStrictEqual([])
  })
})

describe('the degradation contract is resolved on the compound key', () => {
  // FAILS IF: the module's register row stops naming this module or this
  // fallback literal. Both halves are read off the same frozen line, because
  // the row is what ties the module to the literal and citing it for one and
  // not the other would leave the tie unchecked.
  // PLANTED: changed `registerRow` to 'L47538', this module's next register
  //   row, which names the module but a different fallback literal.
  // RED: "AssertionError: expected '| MOD-CC-06 | Learned-change approval…'
  //   to contain 'FB-AI-01'". RESTORED.
  it('reads the module and the literal off the same register row', () => {
    const row = sourceLine(Number(CC06_DEGRADATION.registerRow.slice(1)))
    expect(row).toContain('MOD-CC-06')
    expect(row).toContain(CC06_DEGRADATION.identifier)
  })

  // FAILS IF: the contract is picked rather than resolved. The bare literal
  // has more than one owner, so a lookup that ignored the chapter could only
  // ever be guessing; the test asserts the multiplicity FIRST so that it
  // cannot quietly become a single-owner lookup and stay green.
  // PLANTED: resolved the owner on a foreign chapter — `ownerAt('40.1', …)`
  //   — leaving `registerChapter` at '24', so only the lookup moved.
  // RED: "AssertionError: expected '40.1' to be '24' // Object.is equality".
  //   RESTORED.
  it('resolves one owner out of several, on the row’s own chapter', () => {
    const owners = ownersOf(CC06_DEGRADATION.identifier)
    expect(owners.length).toBeGreaterThan(1)
    expect(CC06_DEGRADATION.allOwnersOfTheBareLiteral).toStrictEqual(owners)

    expect(CC06_DEGRADATION.resolved.chapter).toBe(CC06_DEGRADATION.registerChapter)
    const contractLine = sourceLine(Number(CC06_DEGRADATION.resolved.contractLocator.slice(1)))
    expect(contractLine).toContain(CC06_DEGRADATION.resolved.contract)
  })

  // FAILS IF: the cited heading is not the one the register row actually
  // sits under. "Under this heading" means no other heading intervenes, and
  // that is asserted rather than the chapter prefix — THIS TEST DID NOT FIRE
  // in its first form. It read `heading.toContain('## 24.')`, and the
  // heading one section earlier is `## 24.4`, which contains that string: a
  // plant pointing the citation at the Studio inventory instead of the
  // Command Center one stayed GREEN through all thirteen. Rewritten to walk
  // the lines between the heading and the row.
  // PLANTED: changed `sectionHeadingRef` to 'L47304', the heading of the
  // section before this one.
  // RED (first form): 13 passed — the plant walked past it.
  // RED (this form): "expected '## 24.5 Client Command Center — module,
  //   feature, and function inventory' to be ''" on the intervening-heading
  //   assertion. RESTORED.
  it('takes the chapter from the heading the register row sits under', () => {
    const headingLine = Number(CC06_DEGRADATION.sectionHeadingRef.slice(1))
    const rowLine = Number(CC06_DEGRADATION.registerRow.slice(1))
    expect(headingLine).toBeLessThan(rowLine)
    expect(sourceLine(headingLine)).toContain(`## ${CC06_DEGRADATION.registerChapter}.`)

    // Nothing between the two may be a heading, or the row sits under a
    // later one and the citation names an ancestor rather than the parent.
    const intervening: string[] = []
    for (let n = headingLine + 1; n < rowLine; n += 1) {
      const line = sourceLine(n)
      if (/^#{1,4} /.test(line)) intervening.push(line)
    }
    expect(intervening.join(' · ')).toBe('')
  })
})

describe('the provenance class is resolved, not declared', () => {
  // FAILS IF: the overlay starts claiming a class it did not resolve. The
  // expected value is computed by the shared contract from the same facts the
  // module hands it, so a literal written into the module cannot satisfy it.
  // PLANTED: replaced the body of `cc06DegradationProvenance` with
  //   `return 'PROV-1'`.
  // RED: "AssertionError: expected 'PROV-1' to be 'PROV-6' // Object.is
  //   equality", on this test and on the one below. RESTORED.
  it('emits the class the shared contract resolves from its facts', async () => {
    const { resolveProvenance } = await import('@/ai/provenance/contract')
    expect(cc06DegradationProvenance()).toBe(resolveProvenance(CC06_DEGRADATION_FACTS).classId)
  })

  // FAILS IF: the overlay ever claims a live-artificial-intelligence class
  // for a panel that reports an absence. Nothing here is produced by a model,
  // and the absolute rule is that a deterministic rendering is never labelled
  // live artificial intelligence.
  // PLANTED: set `producedByModelThisSession` to 'server side', leaving both
  //   identifiers null.
  // RED: "AssertionError: expected 'server side' to be null" — and ONLY that
  //   assertion. The class assertion beside it stayed green, because a
  //   server-side element with no run identifier and no decision record is
  //   failed closed to PROV-6 by the shared contract. That is the fail-closed
  //   rule working, and it is exactly why the facts are asserted as well as
  //   the class: the class alone cannot tell an honest absence from a
  //   downgraded claim. RESTORED.
  it('claims no model production for a panel that reports an absence', () => {
    expect(CC06_DEGRADATION_FACTS.producedByModelThisSession).toBeNull()
    expect(cc06DegradationProvenance()).toBe('PROV-6')
  })
})

describe('the seam is named with its owner', () => {
  // FAILS IF: the seam loses the file that must close it, or the acceptance
  // criterion that opens it stops saying what the module claims. A declared
  // seam nobody can pick up is a defect, so the owner is asserted as a path
  // that exists rather than as prose.
  // PLANTED: emptied `CC06_LANEA_SEAM.owners`.
  // RED: "AssertionError: expected 0 to be greater than 0". Re-planted with a
  //   path that does not exist, which gave "expected [Function] to not throw
  //   an error but 'Error: ENOENT: no such file or direct…' was thrown".
  //   RESTORED.
  it('names a real acceptance criterion and real files to close it', () => {
    expect(CC06_LANEA_SEAM.owners.length).toBeGreaterThan(0)
    for (const owner of CC06_LANEA_SEAM.owners) {
      expect(() => readFileSync(owner.path, 'utf8')).not.toThrow()
    }
    const ac = sourceLine(87762)
    expect(ac).toContain(CC06_LANEA_SEAM.criterion)
    expect(ac).toContain('Lane A reversal')
  })
})

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AGENT_DEGRADATION_CONTRACTS,
  AGENT_SECTIONS,
  CROSS_MATRIX_CONTRADICTIONS,
  OPEN_SEAMS,
  agentDegradationContract,
  agentOf,
  crossMatrixContradiction,
  degradationStateProvenance,
  fallbackContractsOf,
  matrixCellProvenance,
  matrixOf,
} from '@/ai/agents/contracts'
import { AI_AGENT_IDS } from '@/ai/agents/roster'
import { FALLBACK_CONTRACT_OWNERS } from '@/ai/fallbacks/registry'
import { provenanceClass } from '@/ai/provenance/classes'
import { routeBySurface } from '@/routes/definitions'

/**
 * Slice 11, wave 1, task 7 — the four agent degradation contracts.
 *
 * WHAT THIS FILE IS FOR.
 *
 *   1. THE FOURTH AGENT'S MISSING MATRIX IS RE-MEASURED, NOT QUOTED. A stated
 *      absence and an oversight look identical from outside, so §44.4 is
 *      swept from the frozen bytes here every run. The sweep is wider than
 *      the brief's: it checks the role header and four tokens, and it
 *      accounts for the tokens that DO occur in the span so that a reader
 *      cannot mistake "we did not look" for "there is nothing".
 *   2. THE TWELVE FALLBACK CONTRACTS ARE NOT TRANSCRIBED HERE OR IN THE
 *      MODULE. They are derived from the wave-0 registry, and this file
 *      checks the derivation lands on twelve rows whose locators carry them.
 *   3. THE PROVENANCE CLASS IS COMPUTED, NOT CLAIMED. Every task touching a
 *      rendered artificial-intelligence element owes its `PROV-*` class. Both
 *      classes here come out of `resolveProvenance` and are then compared
 *      against what the contract records, so a stale literal cannot survive.
 *   4. EVERY CONTRADICTION'S LOCATOR IS OPENED. Each reading must be found at
 *      the line it cites, and the two briefs' shared off-by-one on the Tenant
 *      Admin row is pinned from both sides.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''
const lineOf = (ref: string): number => Number(ref.replace(/^L/, ''))

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the four contracts ────────────────────────────────────────────────── */

describe('the four contracts', () => {
  it('is one per rostered agent, and no more', () => {
    expect(AGENT_DEGRADATION_CONTRACTS.map((c) => c.agentId)).toEqual([...AI_AGENT_IDS])
    expect(AGENT_DEGRADATION_CONTRACTS.map((c) => c.section)).toEqual([...AGENT_SECTIONS])
  })

  it('cites a section heading line that carries that section heading', () => {
    for (const contract of AGENT_DEGRADATION_CONTRACTS) {
      const line = L(lineOf(contract.sectionRef))
      expect(line, contract.sectionRef).toMatch(
        new RegExp(`^## ${contract.section.replace('.', '\\.')} `),
      )
      expect(line).toContain('Failure and Fallback Behavior')
    }
  })

  it('names each agent through the roster rather than transcribing it again', () => {
    for (const contract of AGENT_DEGRADATION_CONTRACTS) {
      const agent = agentOf(contract)
      expect(agent.id).toBe(contract.agentId)
      // The roster's own row is a real line and carries the agent's name.
      expect(L(lineOf(agent.sourceRef))).toContain(agent.name)
    }
  })

  it('binds the three matrices and refuses the fourth an empty one', () => {
    expect(matrixOf(agentDegradationContract('prevention'))?.section).toBe('44.1')
    expect(matrixOf(agentDegradationContract('deviation-and-containment'))?.section).toBe('44.2')
    expect(matrixOf(agentDegradationContract('shift-handoff'))?.section).toBe('44.3')
    // `null`, never `[]`. An empty matrix is what SB-AI-006 forbids.
    expect(matrixOf(agentDegradationContract('vision-reasoning'))).toBeNull()
  })

  it('carries a header locator that is the matrix header for the bound matrices', () => {
    for (const contract of AGENT_DEGRADATION_CONTRACTS) {
      if (contract.roleMatrix.kind !== 'present') continue
      const matrix = matrixOf(contract)!
      expect(lineOf(contract.roleMatrix.headerRef)).toBe(matrix.headerLine)
      expect(L(matrix.headerLine)).toContain('| Capability | Worker |')
    }
  })
})

/* ── the twelve fallback contracts, derived ────────────────────────────── */

describe('the fallback contracts', () => {
  it('derives three per section and twelve in all, from the wave-0 registry', () => {
    const perSection = AGENT_DEGRADATION_CONTRACTS.map((c) => fallbackContractsOf(c))
    expect(perSection.map((f) => f.length)).toEqual([3, 3, 3, 3])
    const all = perSection.flat()
    expect(all).toHaveLength(12)
    expect(new Set(all.map((f) => f.identifier)).size).toBe(12)
    for (const owner of all) expect(owner.identifier).toMatch(/^FB-AGT-(PREV|DEV|SHA|VIS)-0[123]$/)
  })

  it('resolves to rows the frozen source carries at the locators the registry gives', () => {
    for (const contract of AGENT_DEGRADATION_CONTRACTS) {
      for (const owner of fallbackContractsOf(contract)) {
        const line = L(lineOf(owner.locator))
        expect(line, `${owner.identifier} at ${owner.locator}`).toContain(owner.identifier)
        expect(line).toContain(owner.contract)
      }
    }
  })

  it('takes nothing from the registry that is not a chapter-44 section', () => {
    // The registry also holds the chapter 40/41 register, the thirty
    // storyboard cards and two outliers. Filtering on the section number must
    // not sweep any of them in.
    const chapter44 = FALLBACK_CONTRACT_OWNERS.filter((o) =>
      (AGENT_SECTIONS as readonly string[]).includes(o.chapter),
    )
    expect(chapter44).toHaveLength(12)
    expect(chapter44.every((o) => o.identifier.startsWith('FB-AGT-'))).toBe(true)
  })
})

/* ── §44.4's absent matrix, re-measured ────────────────────────────────── */

describe("the Vision agent's absent role matrix", () => {
  /** The section's own span: its heading to the line before the next one. */
  const VISION_SPAN = (() => {
    const start = 92_368
    expect(L(start)).toMatch(/^## 44\.4 /)
    let end = start + 1
    while (end <= 122_241 && !/^## /.test(L(end))) end += 1
    return { start, end: end - 1 }
  })()

  /**
   * The span's last line is blank — the section's last line CARRYING anything
   * is L92594, `DEC-VISION-006`. Both are named because a citation must point
   * at a line that carries what it claims, and a span boundary is not that.
   */
  it('runs from L92368 to the blank line before section 44A, last content L92594', () => {
    expect(VISION_SPAN).toEqual({ start: 92_368, end: 92_595 })
    expect(L(92_594)).toContain('`DEC-VISION-006`')
    expect(L(VISION_SPAN.end)).toBe('')
    expect(L(92_596)).toMatch(/^## 44A\./)
  })

  it('carries no role-matrix header and none of the four role tokens', () => {
    const span = LINES.slice(VISION_SPAN.start, VISION_SPAN.end + 1)
    const text = span.join('\n')
    expect(span.filter((l) => l.startsWith('| Capability |'))).toEqual([])
    for (const token of [
      'Explicitly prohibited',
      'Allowed with conditions',
      'Read-only',
      'Not applicable',
    ]) {
      expect(text.includes(token), `${token} occurs in §44.4`).toBe(false)
    }
  })

  it('accounts for the permission-shaped words that DO occur, so silence is not mistaken for a sweep', () => {
    const span = LINES.slice(VISION_SPAN.start, VISION_SPAN.end + 1)
    const allowed = span.filter((l) => l.includes('Allowed'))
    const unavailable = span.filter((l) => l.includes('Unavailable'))
    // One `Allowed`, and it is a fallback card's own field, not a role cell.
    expect(allowed).toHaveLength(1)
    expect(allowed[0]).toMatch(/^\| Allowed actions \|/)
    // Three `Unavailable`, all of them mermaid state names.
    expect(unavailable).toHaveLength(3)
    for (const line of unavailable) expect(line).toMatch(/-->/)
  })

  it('states the absence with its reason and cites SB-AI-006 at a line that carries it', () => {
    const vision = agentDegradationContract('vision-reasoning')
    if (vision.roleMatrix.kind !== 'absent') throw new Error('§44.4 must bind no matrix')
    expect(vision.roleMatrix.reason).toContain('SB-AI-006')
    expect(L(86_781)).toContain('`SB-AI-006`')
    expect(L(86_781)).toContain('no vision configuration surface')
    expect(vision.roleMatrix.measurement).toContain('L92368')
    expect(vision.roleMatrix.measurement).toContain('L92594')
  })
})

/* ── provenance, computed rather than claimed ──────────────────────────── */

describe('the provenance class every rendered element here emits', () => {
  it('resolves a degraded agent state to PROV-6, the unavailability class', () => {
    const resolved = degradationStateProvenance()
    expect(resolved).toBe('PROV-6')
    expect(provenanceClass(resolved).name).toBe('Artificial intelligence unavailable')
    for (const contract of AGENT_DEGRADATION_CONTRACTS) {
      expect(contract.degradationStateProvenance).toBe(resolved)
    }
  })

  it('resolves a matrix cell to PROV-4 and never to a live-artificial-intelligence class', () => {
    const resolved = matrixCellProvenance()
    expect(resolved).toBe('PROV-4')
    expect(provenanceClass(resolved).name).toBe('Deterministic rules')
    // The absolute rule: a deterministic rule is never labelled live AI.
    expect(resolved).not.toBe('PROV-1')
    expect(resolved).not.toBe('PROV-2')
  })

  it('emits exactly one class per element, never two', () => {
    expect(new Set([degradationStateProvenance()]).size).toBe(1)
    expect(new Set([matrixCellProvenance()]).size).toBe(1)
    expect(degradationStateProvenance()).not.toBe(matrixCellProvenance())
  })
})

/* ── the contradictions ────────────────────────────────────────────────── */

describe('the cross-matrix contradictions', () => {
  it('adopts none of them, and the adoption field is not merely empty', () => {
    for (const contradiction of CROSS_MATRIX_CONTRADICTIONS) {
      expect(contradiction.adopted).toBeNull()
      expect(contradiction.readings.length).toBeGreaterThanOrEqual(3)
      expect(contradiction.disclosure).not.toBe('')
    }
  })

  const fieldsOf = (line: string): readonly string[] =>
    line.split('|').slice(1, -1).map((c) => c.trim())

  /**
   * The header line of the pipe-table a given row belongs to: walk up while
   * the lines are still table rows, and the first one starting `| Capability`
   * is the header that orders this row's cells.
   */
  const governingHeaderOf = (row: number): number => {
    for (let n = row; n > 0 && L(n).startsWith('|'); n -= 1) {
      if (/^\| Capability/.test(L(n))) return n
    }
    throw new Error(`L${row} is not inside a table with a \`| Capability\` header.`)
  }

  /**
   * FOUND AT THE CELL, UNDER THAT MATRIX'S OWN HEADER — and two weaker
   * versions of this test each shipped a real error that a planted defect
   * then exposed. See `ContradictoryReading['cell']` for both.
   */
  it("finds every reading at the cell its own matrix's header orders", () => {
    for (const contradiction of CROSS_MATRIX_CONTRADICTIONS) {
      for (const reading of contradiction.readings) {
        const line = L(lineOf(reading.sourceRef))
        expect(line, `${contradiction.id} @ ${reading.sourceRef}`).toContain(reading.reading)
        if (reading.cell === null) continue

        // THE CITED HEADER MUST BE THE ONE THAT GOVERNS THIS ROW, and this
        // clause is here because without it the check still passed on a
        // planted column-order confusion: `MOD-CC-08`'s Tenant Admin cell
        // read under chapter 44's header lands on the Read-only Auditor
        // column, and L37669 reads `Explicitly prohibited` in both. Three
        // cells of that row are the same token, so no comparison of cell
        // CONTENTS can separate them. Walking up to the nearest header can.
        expect(
          governingHeaderOf(lineOf(reading.sourceRef)),
          `${contradiction.id} @ ${reading.sourceRef} cites a header that does not govern it`,
        ).toBe(lineOf(reading.cell.headerRef))

        const header = fieldsOf(L(lineOf(reading.cell.headerRef)))
        const index = header.indexOf(reading.cell.column)
        expect(
          index,
          `${reading.cell.headerRef} carries no column "${reading.cell.column}"`,
        ).toBeGreaterThan(0)
        expect(
          fieldsOf(line)[index],
          `${contradiction.id} @ ${reading.sourceRef} · ${reading.cell.column}`,
        ).toBe(reading.reading)
      }
    }
  })

  it('names a cell for every reading that is a matrix row, and none that is prose', () => {
    // A reading whose line is a pipe row and whose cell is null would slip
    // past the check above by claiming to be prose.
    for (const contradiction of CROSS_MATRIX_CONTRADICTIONS) {
      for (const reading of contradiction.readings) {
        expect(
          reading.cell !== null,
          `${contradiction.id} @ ${reading.sourceRef}`,
        ).toBe(L(lineOf(reading.sourceRef)).startsWith('|'))
      }
    }
  })

  /**
   * The two axes are DIFFERENT, and this is why a bare column index is not
   * enough. `MOD-CC-08` and `MOD-CC-12` run Tenant Admin first; chapter 44
   * runs Worker first. The Tenant Admin readings in this contradiction come
   * from both orders.
   */
  it('reads the two column orders as the two orders they are', () => {
    expect(fieldsOf(L(37_664))).toEqual([
      'Capability on this module',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(fieldsOf(L(91_761))).toEqual([
      'Capability',
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
    expect(fieldsOf(L(38_481))).toEqual(fieldsOf(L(37_664)))
  })

  it('pins the agent on/off row on both sides, in both column orders', () => {
    const onOff = crossMatrixContradiction('switch-an-agent-on-or-off')
    expect(onOff.readings.map((r) => r.sourceRef)).toEqual(['L91769', 'L37671', 'L37646'])

    // Chapter 44 runs Worker first, so the Quality Manager is column three of
    // five after the capability. MOD-CC-08 runs Tenant Admin first, and its
    // Quality Manager is ALSO column three — which is why reading either one
    // positionally happens to work and is still the wrong habit.
    const ch44 = L(91_769).split('|').slice(1, -1).map((c) => c.trim())
    expect(ch44[0]).toBe('Switch the agent on or off')
    expect(ch44[3]).toBe(
      'Allowed with conditions — a Studio action under authoring grants [SoW Fact — §6.9.1, §5.18]',
    )
    const ccRow = L(37_671).split('|').slice(1, -1).map((c) => c.trim())
    // MOD-CC-08 words it "Switch AN agent", chapter 44 "Switch THE agent".
    expect(ccRow[0]).toBe('Switch an agent on or off')
    expect(ccRow[3]).toBe('Explicitly prohibited')
    expect(ch44[0]).not.toBe(ccRow[0])
  })

  it('pins the Tenant Admin question on all four of its readings', () => {
    const ta = crossMatrixContradiction('tenant-admin-and-the-ai-degradation-state')
    expect(ta.readings.map((r) => r.sourceRef)).toEqual(['L37669', 'L91768', 'L89348', 'L92309'])

    // The correction both briefs need: L91767 is a different row entirely.
    expect(L(91_767)).toContain('| Dismiss guidance |')
    expect(L(91_768)).toContain('| See the honest degradation state |')

    // The fourth surface neither matrix mentions.
    // Spelled WITHOUT backticks here — the storyboard's own bold heading
    // writes `**Storyboard SB-42-301 —`, where the same identifier is
    // backticked elsewhere. A verbatim check written on the other spelling
    // fails on this line.
    expect(L(89_348)).toContain('**Storyboard SB-42-301 —')
    expect(L(89_348)).toContain('the tenant administration area with the incident reference')

    // And the §44.3 reading against MOD-CC-12's opposite one.
    expect(L(92_309)).toContain("See the brief's absence honestly stated")
    expect(L(38_483)).toContain('| Read the current brief | Explicitly prohibited |')
  })

  it('is a per-capability question, because the role does reach the surface', () => {
    // Answering it by surface access would answer a question nobody asked.
    expect(routeBySurface('SURF-CC').allowedRoles).toContain('TENANT_ADMIN')
  })

  it('refuses a contradiction id it does not hold', () => {
    expect(() => crossMatrixContradiction('no-such-contradiction')).toThrow(
      /no cross-matrix contradiction/i,
    )
  })
})

/* ── the seams ─────────────────────────────────────────────────────────── */

it('names an owner for every seam it leaves open', () => {
  // A declared seam nobody picks up is a defect, so "someone" is not an owner.
  expect(OPEN_SEAMS.length).toBeGreaterThan(0)
  for (const seam of OPEN_SEAMS) {
    expect(seam.owner).not.toBe('')
    expect(seam.owner.toLowerCase()).not.toContain('someone')
    expect(seam.what).not.toBe('')
  }
  expect(OPEN_SEAMS.map((s) => s.id)).toContain('dec-handoff-not-in-the-canon')
  expect(OPEN_SEAMS.map((s) => s.id)).toContain('nothing-renders-this-yet')
})

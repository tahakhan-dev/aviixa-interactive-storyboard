import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  AI_PROHIBITIONS,
  PROHIBITION_ABSOLUTENESS,
  PROHIBITION_DIAGRAM,
  PROHIBITION_TABLE_HEADER_REF,
  aiProhibition,
  prohibitionsWithoutRefusalEdge,
  type ProhibitionNumber,
} from '@/ai/abilities/prohibitions'

/**
 * Slice 11, wave 0, task 3 — the twelve prohibitions, built from the TABLE.
 *
 * WHAT THIS FILE IS FOR. Four failures that each look like success:
 *
 *   1. BUILDING FROM THE DIAGRAM. The mermaid flowchart below the table draws
 *      a refusal edge for some of the prohibitions and not for others, under
 *      a caption that says they "are one rule expressed eight ways". Anyone
 *      who reads the picture and not the table ships a shorter list and has
 *      the source's own caption agreeing with them. So the diagram's edges
 *      and the table's rows are BOTH counted off the frozen bytes here, the
 *      shortfall is derived rather than transcribed, and the discrepancy is
 *      asserted to be non-empty. A build that silently reconciled them would
 *      go red.
 *   2. AN ESCAPE PARAMETER. Every prohibition binds "under any configuration,
 *      role, failover condition, or emergency". A function that takes a flag,
 *      a role or an override turns a prohibition into a suggestion, and no
 *      data assertion would notice. So this file reads the module's own
 *      source text and asserts its exported functions accept nothing but a
 *      prohibition number, and that no record carries an escape-shaped field.
 *   3. A ROW QUOTED SHORT. The test column is as substantive as the
 *      prohibition column — `TEST-AI-016-6` alone enumerates five distinct
 *      attempts. Both columns are compared against the re-parsed cells.
 *   4. A VACUOUS GATE. `prohibitionsWithoutRefusalEdge` returning an empty
 *      array would pass any subset assertion. Its size is derived from two
 *      independent measurements and asserted to be the difference.
 *
 * Every count and every locator below is measured off the frozen bytes at run
 * time. A count copied into an assertion has stopped measuring.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

const MODULE_PATH = new URL('../../src/ai/abilities/prohibitions.ts', import.meta.url).pathname
const MODULE_TEXT = readFileSync(MODULE_PATH, 'utf8')

const soleLineCarrying = (token: string): number => {
  const hits = LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])
  if (hits.length !== 1) {
    throw new Error(`"${token}" is on ${hits.length} lines, not one: ${hits.join(', ')}`)
  }
  return hits[0] as number
}

const lineOf = (sourceRef: string): number => {
  const m = /^L(\d+)$/.exec(sourceRef)
  if (m === null) throw new Error(`"${sourceRef}" is not a single-line locator.`)
  return Number(m[1])
}

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

/** Enough to check a caption that spells a number out. */
const SPELLED = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
] as const

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the table, located by its header rather than by a line number ─────── */

const TABLE_HEADER_LINE = soleLineCarrying('| # | Prohibition | Test |')

/** Every body row under that header, taken until the table stops. */
const measuredRows = (): readonly { line: number; cells: readonly string[] }[] => {
  const rows: { line: number; cells: readonly string[] }[] = []
  for (let n = TABLE_HEADER_LINE + 2; L(n).startsWith('|'); n += 1) {
    rows.push({ line: n, cells: cells(L(n)) })
  }
  return rows
}

/* ── the diagram, located by its fence ─────────────────────────────────── */

const DIAGRAM_OPEN_LINE = (() => {
  for (let n = TABLE_HEADER_LINE; n < TABLE_HEADER_LINE + 40; n += 1) {
    if (L(n) === '```mermaid') return n
  }
  throw new Error('No mermaid fence follows the prohibition table.')
})()

const DIAGRAM_CLOSE_LINE = (() => {
  for (let n = DIAGRAM_OPEN_LINE + 1; n < DIAGRAM_OPEN_LINE + 200; n += 1) {
    if (L(n) === '```') return n
  }
  throw new Error('The mermaid fence never closes.')
})()

/** A refusal edge is a solid edge into the refusal node. */
const measuredRefusalEdges = (): readonly { line: number; label: string }[] => {
  const edges: { line: number; label: string }[] = []
  for (let n = DIAGRAM_OPEN_LINE + 1; n < DIAGRAM_CLOSE_LINE; n += 1) {
    const m = /^\s*\w+ -->\|"([^"]+)"\| NO\b/.exec(L(n))
    if (m !== null) edges.push({ line: n, label: m[1] as string })
  }
  return edges
}

/** A non-effect edge is a DOTTED edge, and it refuses nothing. */
const measuredNonEffectEdges = (): readonly { line: number; label: string; target: string }[] => {
  const edges: { line: number; label: string; target: string }[] = []
  for (let n = DIAGRAM_OPEN_LINE + 1; n < DIAGRAM_CLOSE_LINE; n += 1) {
    const m = /-\.->\|"([^"]+)"\| (\w+)/.exec(L(n))
    if (m !== null) edges.push({ line: n, label: m[1] as string, target: m[2] as string })
  }
  return edges
}

describe('the prohibition table — the authoritative list', () => {
  it('registers every body row under the table header, at the line it is on', () => {
    const rows = measuredRows()
    expect(rows.length).toBeGreaterThan(0)
    expect(lineOf(PROHIBITION_TABLE_HEADER_REF)).toBe(TABLE_HEADER_LINE)
    expect(AI_PROHIBITIONS.map((p) => p.sourceRef)).toEqual(rows.map((r) => `L${r.line}`))
    expect(AI_PROHIBITIONS.map((p) => p.number)).toEqual(rows.map((r) => Number(r.cells[0])))
  })

  it('quotes BOTH columns whole — the test column is as substantive as the prohibition column', () => {
    const rows = measuredRows()
    expect(AI_PROHIBITIONS.map((p) => p.prohibition)).toEqual(rows.map((r) => r.cells[1]))
    expect(AI_PROHIBITIONS.map((p) => p.test)).toEqual(rows.map((r) => r.cells[2]))
  })

  it('reads each test identifier out of its own cell rather than composing one', () => {
    for (const prohibition of AI_PROHIBITIONS) {
      const cell = cells(L(lineOf(prohibition.sourceRef)))[2] ?? ''
      expect(cell.startsWith(`\`${prohibition.testId}\``), prohibition.testId).toBe(true)
      expect(prohibition.testId).toBe(`TEST-AI-016-${prohibition.number}`)
    }
    expect(new Set(AI_PROHIBITIONS.map((p) => p.testId)).size).toBe(AI_PROHIBITIONS.length)
  })

  it('carries the absoluteness sentence verbatim, at the line that states it', () => {
    const line = soleLineCarrying('**The complete prohibition list, restated, with a test for each.**')
    expect(lineOf(PROHIBITION_ABSOLUTENESS.sourceRef)).toBe(line)
    expect(L(line)).toContain(PROHIBITION_ABSOLUTENESS.text)
    expect(PROHIBITION_ABSOLUTENESS.text).toContain(
      'may never do any of the following, under any configuration, role, failover condition, or emergency',
    )
  })
})

describe('the prohibitions are absolute — there is no parameter that turns one off', () => {
  /**
   * The structural gate, and the reason it reads text rather than data: an
   * escape hatch is a SIGNATURE, not a field value, so no assertion over the
   * records could see one. Plant `override = false` on any exported function
   * and this goes red.
   *
   * BOTH SPELLINGS OF AN EXPORTED FUNCTION, because the gate's claim is about
   * what a caller can pass and not about a keyword. A scan for
   * `export function` only was measured 17/17 green against a planted
   * `export const prohibitionWithEscape = (prohibitionNumber, override = false) => …`
   * — an arrow export turns a prohibition off just as completely, and
   * invisibly. So `export const … = (…) =>` is swept alongside, with or
   * without a type annotation, `async`, or a single unparenthesised
   * parameter. `export const` bindings that are not functions carry no `=>`
   * straight after their parameter list and are not matched.
   */
  it('accepts nothing but a prohibition number in any exported function', () => {
    const signatures = [
      ...MODULE_TEXT.matchAll(/export function (\w+)\(([^)]*)\)/g),
      ...MODULE_TEXT.matchAll(
        /export const (\w+)[^=\n]*=\s*(?:async\s+)?(?:\(([^)]*)\)|([\w$]+))\s*=>/g,
      ),
    ]
    expect(signatures.length).toBeGreaterThan(0)
    const parameterLists = signatures.map((m) => ({
      name: m[1] as string,
      identifiers: (m[2] ?? m[3] ?? '')
        .split(',')
        .map((p) => (p.split(':')[0] ?? '').split('=')[0]?.trim() ?? '')
        .filter((p) => p.length > 0),
    }))
    for (const signature of parameterLists) {
      expect(signature.identifiers, `exported ${signature.name}`).toEqual(
        signature.identifiers.filter((i) => i === 'prohibitionNumber'),
      )
      expect(signature.identifiers.length, `exported ${signature.name}`).toBeLessThan(2)
    }
    // Not vacuous: at least one exported function really does take the number,
    // so "every parameter is the prohibition number" is a claim about
    // something rather than a claim about an empty set.
    expect(parameterLists.some((s) => s.identifiers.length === 1)).toBe(true)
  })

  it('carries no escape-shaped field on any prohibition record', () => {
    const forbidden = [
      'enabled', 'disabled', 'exception', 'exceptions', 'override', 'overrides',
      'waiver', 'bypass', 'unless', 'appliesWhen', 'appliesTo', 'allowIf',
      'exemptRoles', 'featureFlag', 'flag', 'config', 'failoverBehaviour',
    ]
    for (const prohibition of AI_PROHIBITIONS) {
      for (const key of Object.keys(prohibition)) {
        expect(forbidden, `${prohibition.testId}.${key}`).not.toContain(key)
      }
    }
  })

  it('resolves a prohibition from the closed list itself, never from a caller’s list', () => {
    expect(MODULE_TEXT).not.toMatch(/export function \w+\([^)]*readonly AiProhibition\[\]/)
    expect(aiProhibition(6).prohibition).toBe(
      'Bypass a specification, evaluation, qualification, approval, or publication gate',
    )
  })

  it('refuses a number the table does not carry rather than returning an approximation', () => {
    const beyond = (measuredRows().length + 1) as ProhibitionNumber
    expect(() => aiProhibition(beyond)).toThrow(new RegExp(String(beyond)))
  })
})

describe('the diagram, and where it falls short of the table', () => {
  it('spans the fence the source draws it in, caption excluded', () => {
    expect(PROHIBITION_DIAGRAM.sourceRef).toBe(`L${DIAGRAM_OPEN_LINE}-L${DIAGRAM_CLOSE_LINE}`)
    expect(L(DIAGRAM_CLOSE_LINE + 1)).toBe('')
    expect(lineOf(PROHIBITION_DIAGRAM.captionRef)).toBe(DIAGRAM_CLOSE_LINE + 2)
  })

  it('registers every refusal edge the flowchart draws, at the line it is on', () => {
    const measured = measuredRefusalEdges()
    expect(measured.length).toBeGreaterThan(0)
    const registered = AI_PROHIBITIONS.flatMap((p) => (p.refusalEdge === null ? [] : [p.refusalEdge]))
    expect(registered.map((e) => e.label).sort()).toEqual(measured.map((e) => e.label).sort())
    expect(registered.map((e) => lineOf(e.sourceRef)).sort()).toEqual(
      measured.map((e) => e.line).sort(),
    )
  })

  it('maps each refusal edge onto exactly one prohibition, and none twice', () => {
    const mapped = AI_PROHIBITIONS.filter((p) => p.refusalEdge !== null)
    expect(mapped.length, 'the prohibitions carrying a refusal edge').toBeGreaterThan(0)
    // THE EDGE IS WHAT MUST NOT REPEAT, AND THE EDGE IS WHAT THIS NOW READS.
    // The superseded assertion was
    // `new Set(mapped.map(p => p.number)).size === mapped.length` — the
    // prohibition NUMBERS, which are already pinned one-for-one to the
    // source's own rows above. It could not fail for the reason its title
    // gives: two prohibitions claiming ONE diagram edge left it green.
    const claimed = mapped.map((p) => `${p.refusalEdge!.sourceRef} "${p.refusalEdge!.label}"`)
    expect(
      new Set(claimed).size,
      `two prohibitions claim one refusal edge: ${claimed.join(' · ')}`,
    ).toBe(claimed.length)
    // And the claimed edges are exactly the edges the flowchart draws, so the
    // mapping is a bijection rather than an injection into a larger set.
    expect([...claimed].sort()).toEqual(
      measuredRefusalEdges()
        .map((e) => `L${String(e.line)} "${e.label}"`)
        .sort(),
    )
    for (const prohibition of mapped) {
      expect(prohibition.refusalEdgeMapping, prohibition.testId).not.toBe('')
      expect(prohibition.diagramAbsence, prohibition.testId).toBeNull()
    }
  })

  it('registers the dotted non-effect edges as non-effects, not as refusals', () => {
    const measured = measuredNonEffectEdges()
    expect(measured.length).toBeGreaterThan(0)
    expect(PROHIBITION_DIAGRAM.nonEffectEdges.map((e) => lineOf(e.sourceRef))).toEqual(
      measured.map((e) => e.line),
    )
    expect(PROHIBITION_DIAGRAM.nonEffectEdges.map((e) => e.label)).toEqual(
      measured.map((e) => e.label),
    )
    expect(PROHIBITION_DIAGRAM.nonEffectEdges.map((e) => e.target)).toEqual(
      measured.map((e) => e.target),
    )
    // The target's own node label, so a surface can say WHAT is not altered.
    for (const edge of PROHIBITION_DIAGRAM.nonEffectEdges) {
      const declaration = `${edge.target}["${edge.targetWording}"]`
      const declared = LINES.some(
        (text, index) =>
          index > DIAGRAM_OPEN_LINE && index < DIAGRAM_CLOSE_LINE && text.includes(declaration),
      )
      expect(declared, declaration).toBe(true)
    }
    // A non-effect edge is not a refusal edge: they share no line.
    const refusalLines = new Set(measuredRefusalEdges().map((e) => e.line))
    for (const edge of measured) expect(refusalLines.has(edge.line)).toBe(false)
  })

  it('the caption counts the diagram’s edges correctly and the TABLE is longer', () => {
    const edges = measuredRefusalEdges().length
    const rows = measuredRows().length
    const caption = L(lineOf(PROHIBITION_DIAGRAM.captionRef))
    expect(caption).toContain(PROHIBITION_DIAGRAM.caption)
    expect(PROHIBITION_DIAGRAM.caption).toContain(`one rule expressed ${SPELLED[edges]} ways`)
    expect(edges).toBeLessThan(rows)
  })

  it('derives the shortfall rather than transcribing it, and it is not empty', () => {
    const uncovered = prohibitionsWithoutRefusalEdge()
    expect(uncovered.length).toBe(measuredRows().length - measuredRefusalEdges().length)
    expect(uncovered.length).toBeGreaterThan(0)
    expect(uncovered.map((p) => p.number)).toEqual(
      AI_PROHIBITIONS.filter((p) => p.refusalEdge === null).map((p) => p.number),
    )
    for (const prohibition of uncovered) {
      expect(prohibition.diagramAbsence, prohibition.testId).not.toBeNull()
      expect(prohibition.refusalEdgeMapping, prohibition.testId).toBeNull()
    }
  })

  it('states the discrepancy and names the table as authoritative', () => {
    expect(PROHIBITION_DIAGRAM.discrepancy).toContain('the table is authoritative')
    expect(PROHIBITION_DIAGRAM.discrepancy.length).toBeGreaterThan(0)
  })

  it('models the failover prohibition as the dotted non-effects, not as a missing row', () => {
    const failover = AI_PROHIBITIONS.filter((p) => p.prohibition.includes('failover'))
    expect(failover).toHaveLength(1)
    const row = failover[0]
    expect(row?.refusalEdge).toBeNull()
    for (const edge of PROHIBITION_DIAGRAM.nonEffectEdges) {
      expect(row?.diagramAbsence ?? '').toContain(edge.target)
    }
    expect(row?.diagramAbsence ?? '').toContain('does not alter')
  })
})

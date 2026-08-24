import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  BLAST_RADIUS_FENCE,
  BLAST_RADIUS_NODES,
  BLAST_RADIUS_NO_COUNT,
  BLAST_RADIUS_PROVENANCE,
  BLAST_RADIUS_ROOT,
  PAUSE_CONTROL_TABLE,
  PAUSE_DOES_NOT_TABLE,
  blastRadiusNodes,
} from '@/ai/controls/blast-radius'

/**
 * THE BLAST RADIUS — THE ENUMERATION, AND NO COUNT ANYWHERE.
 *
 * Sixteen nodes hang off `PAUSE`: six STOP (L87833-L87838), nine KEEP
 * (L87839-L87847), and `HONEST` (L87848), which is a rendering obligation
 * rather than a continuing behaviour. The narrative at L87852 says "Six things
 * stop and nine continue" and is defensible under exactly that reading — the
 * tenth continue-side node is a state the platform must SHOW, not a behaviour
 * that carries on.
 *
 * WHAT EACH CASE BELOW IS FOR:
 *
 *   1. A RENDERED COUNT. A screen that prints "nine continue" or "ten
 *      continue" picks a side of a disagreement the source does not resolve.
 *      This build's rule is that a contested count is REMOVED rather than
 *      renumbered, so `src/ai/controls/` and the incident route are swept for a
 *      count sentence about stopping or continuing behaviours.
 *   2. A FENCE READ SHORT OR LONG. The fence opens L87831, `flowchart TD` is
 *      L87832, and it closes L87850. Both boundaries are asserted, so the
 *      transcription cannot swallow the closing fence or miss the last node.
 *   3. `HONEST` FILED AS A CONTINUING BEHAVIOUR. It is the honest-rendering
 *      obligation and is classified as its own kind, which is the whole reason
 *      "nine" and "ten" are both arguable.
 *   4. A SUPPORTING TABLE READ FROM ITS SPAN. Both tables' rows are counted
 *      from their own headers, and both boundary lines are asserted not to be
 *      table rows.
 *   5. TABLE 2 DROPPED. Its seven rows are the negative assertions a reader
 *      needs most: each names something a pause CANNOT do and gives the reason.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

describe('the frozen source this enumeration was built from', () => {
  it('is the bytes every locator below names', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('the diagram fence', () => {
  it('opens at L87831, declares its direction at L87832 and closes at L87850', () => {
    expect(BLAST_RADIUS_FENCE).toEqual({ opensAt: 87_831, directionAt: 87_832, closesAt: 87_850 })
    expect(lineAt(87_831)).toBe('```mermaid')
    expect(lineAt(87_832)).toBe('flowchart TD')
    expect(lineAt(87_850)).toBe('```')
  })
})

describe('the nodes hanging off PAUSE', () => {
  it('transcribes every node verbatim from the line it names', () => {
    for (const node of BLAST_RADIUS_NODES) {
      const lineNumber = Number(node.sourceRef.replace(/^L/, ''))
      expect(lineAt(lineNumber), node.sourceRef).toContain(node.label)
      // `--> KEY[` rather than `PAUSE --> KEY`, and that is a MEASURED
      // correction rather than a looser matcher. L87833 does not carry a bare
      // `PAUSE -->` edge: it DECLARES the root node inline and draws the first
      // edge on the same line —
      // `PAUSE["Emergency pause activated, per tenant or platform-wide"] --> STOP1[...]`.
      // A matcher written from the paraphrase "sixteen `PAUSE -->` edges" is
      // green on fifteen lines and red on the first, and the fifteen would
      // have looked like proof.
      expect(lineAt(lineNumber)).toContain(`--> ${node.key}[`)
    }
  })

  it('declares the root node inline on the first edge, at L87833', () => {
    expect(BLAST_RADIUS_ROOT.sourceRef).toBe('L87833')
    expect(lineAt(87_833)).toContain(`PAUSE["${BLAST_RADIUS_ROOT.label}"] -->`)
    expect(BLAST_RADIUS_ROOT.label).toBe('Emergency pause activated, per tenant or platform-wide')
  })

  it('runs from the first node to the last with no gap, and stops before the fence closes', () => {
    const lines = BLAST_RADIUS_NODES.map((n) => Number(n.sourceRef.replace(/^L/, '')))
    expect(lines[0]).toBe(87_833)
    expect(lines.at(-1)).toBe(87_848)
    lines.forEach((line, index) => {
      expect(line).toBe(87_833 + index)
    })
    // The line after the last node hangs off RESUME, not off PAUSE — it is
    // the resume pair, which is not a thing this control stops or continues.
    expect(lineAt(87_849)).not.toContain('PAUSE')
    expect(lineAt(87_849)).toContain('RESUME')
  })

  it('keys every node on the diagram\'s own identifier, and each is distinct', () => {
    const keys = BLAST_RADIUS_NODES.map((n) => n.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.filter((k) => k.startsWith('STOP'))).toEqual([
      'STOP1',
      'STOP2',
      'STOP3',
      'STOP4',
      'STOP5',
      'STOP6',
    ])
    expect(keys.filter((k) => k.startsWith('KEEP'))).toEqual([
      'KEEP1',
      'KEEP2',
      'KEEP3',
      'KEEP4',
      'KEEP5',
      'KEEP6',
      'KEEP7',
      'KEEP8',
      'KEEP9',
    ])
    expect(keys.filter((k) => k === 'HONEST')).toEqual(['HONEST'])
  })

  it('files HONEST as a rendering obligation, not as a continuing behaviour', () => {
    const honest = BLAST_RADIUS_NODES.find((n) => n.key === 'HONEST')
    expect(honest?.kind).toBe('honest-rendering')
    expect(honest?.sourceRef).toBe('L87848')
    expect(blastRadiusNodes('continues').some((n) => n.key === 'HONEST')).toBe(false)
    expect(blastRadiusNodes('stops').some((n) => n.key === 'HONEST')).toBe(false)
  })

  it('puts the Severity 1 hold on the continue side, which L87852 calls the most important fact', () => {
    const hold = blastRadiusNodes('continues').find((n) => n.label.includes('Severity 1'))
    expect(hold?.sourceRef).toBe('L87842')
    expect(lineAt(87_852)).toContain('The Severity 1 hold sits firmly in the continue column')
  })
})

describe('no count of stopping or continuing behaviours is rendered anywhere', () => {
  it('states why rather than picking a number', () => {
    expect(BLAST_RADIUS_NO_COUNT.sourceRefs).toContain('L87852')
    expect(BLAST_RADIUS_NO_COUNT.whyNoCount).toMatch(/renumber|removed/i)
  })

  it('carries no count sentence in the module or in the route that renders it', () => {
    // The gate. A number adjacent to a stopping or continuing word is the
    // defect; the source's OWN sentence quoted with its locator is not, so a
    // quoted span is exempted exactly as `canon-size-literal` exempts one.
    const offenders: string[] = []
    for (const file of walk('src/ai/controls').concat(walk('app/super-admin/ai-incidents'))) {
      const text = readFileSync(file, 'utf8')
        .replaceAll(/'[^'\n]*'/g, "''")
        .replaceAll(/"[^"\n]*"/g, '""')
      for (const [sentence] of text.matchAll(/[^.\n]*[.\n]/g)) {
        if (
          /\b(six|seven|eight|nine|ten|eleven|sixteen|\d+)\b/i.test(sentence) &&
          /\b(stop|stops|stopping|continue|continues|continuing)\b/i.test(sentence)
        ) {
          offenders.push(`${file}: ${sentence.trim()}`)
        }
      }
    }
    expect(offenders, 'a rendered count of stopping or continuing behaviours').toEqual([])
  })
})

describe('the two supporting tables under one shared caption (L87858)', () => {
  it('carries the caption both tables sit under', () => {
    expect(lineAt(87_858)).toBe('**Supporting tables.**')
  })

  it('table 1 is Control / Scope / Approval class / Effect on the deterministic layer', () => {
    expect(PAUSE_CONTROL_TABLE.headerLine).toBe(87_860)
    expect(lineAt(87_860)).toBe(
      '| Control | Scope | Approval class | Effect on the deterministic layer |',
    )
    expect(lineAt(87_861)).toBe('|---|---|---|---|')
    // Rows counted from the header down, and both boundaries asserted.
    PAUSE_CONTROL_TABLE.rows.forEach((row, index) => {
      expect(row.sourceRef).toBe(`L${String(87_862 + index)}`)
      expect(lineAt(87_862 + index)).toBe(row.verbatim)
    })
    expect(lineAt(87_861).startsWith('|')).toBe(true)
    expect(lineAt(87_862 + PAUSE_CONTROL_TABLE.rows.length).trim().startsWith('|')).toBe(false)
    expect(PAUSE_CONTROL_TABLE.rows.map((r) => r.control)).toEqual([
      'Emergency pause',
      'Resume',
      'Runaway-loop kill switch',
      'Atom or agent disable',
      'Tenant compliance suspension',
    ])
  })

  it('table 2 is the seven things a pause does not do, each with its reason', () => {
    expect(PAUSE_DOES_NOT_TABLE.headerLine).toBe(87_868)
    expect(lineAt(87_868)).toBe('| What a pause does not do | Reason |')
    expect(lineAt(87_869)).toBe('|---|---|')
    PAUSE_DOES_NOT_TABLE.rows.forEach((row, index) => {
      expect(row.sourceRef).toBe(`L${String(87_870 + index)}`)
      expect(lineAt(87_870 + index)).toBe(row.verbatim)
      // Every row has a reason. A negative assertion with no reason is a
      // refusal a reader cannot check.
      expect(row.reason.trim()).not.toBe('')
    })
    expect(lineAt(87_870 + PAUSE_DOES_NOT_TABLE.rows.length).trim().startsWith('|')).toBe(false)
    expect(PAUSE_DOES_NOT_TABLE.rows.map((r) => r.whatItDoesNotDo)).toEqual([
      'Stop specification gates',
      'Stop severity classification',
      'Release or prevent a Severity 1 hold',
      'Stop evidence capture or audit',
      'Stop the command channel',
      'Auto-decide waiting gate items',
      'Resume itself',
    ])
  })

  it('holds the kill switch\'s scope and class as `Not specified` in table 1', () => {
    const kill = PAUSE_CONTROL_TABLE.rows.find((r) => r.control === 'Runaway-loop kill switch')
    expect(kill?.sourceRef).toBe('L87864')
    expect(kill?.scope).toBe('Not specified')
    expect(kill?.approvalClass).toBe('Not specified')
    expect(kill?.verbatim).toContain('DEC-KILL-001')
  })
})

describe('provenance', () => {
  it('emits exactly one class, and it is the deterministic-rule one', () => {
    expect(BLAST_RADIUS_PROVENANCE).toBe('PROV-4')
  })
})

function walk(root: string): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (/^\.zz-probe-\d+$/.test(entry)) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) visit(path)
      else out.push(path)
    }
  }
  visit(join(process.cwd(), root))
  return out
}

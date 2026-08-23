import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { provenanceClass } from '@/ai/provenance/classes'
import { contractPermits } from '@/ai/provenance/contract'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import {
  CC07_AI_ELEMENT_OBLIGATION,
  CC07_AI_FAILURE_CELL,
  CC07_AI_FAILURE_READING,
  CC07_AI_FAILURE_ROW,
  CC07_AI_FAILURE_ROW_MATCHES_MODULE_NAME,
  CC07_DEGRADATION_GAPS,
  CC07_NEVER_LIVE,
  CC07_NO_CONTROL_RULE,
  CC07_RENDERED_ELEMENT_PROVENANCE,
  CC07_SAFETY_FLAG_DECISION,
  CC07_SAFETY_FLAG_DISCLOSURE,
  CC07_SIGNAL_PROVENANCE,
  uniformlyProhibitedRows,
} from '@/surfaces/cc/modules/cc-07/degradation'
import {
  CC07_COLUMNS,
  CC07_MATRIX,
  CC07_MODULE,
  CC07_ROW_BINDS_EVERY_MODULE,
} from '@/surfaces/cc/modules/cc-07/matrix'

/**
 * `MOD-CC-07`'s artificial-intelligence overlay.
 *
 * THE MEASUREMENT THE WHOLE FILE HANGS ON. Chapters 40 to 44 never name this
 * module by identifier, so every attribution the overlay makes is a build
 * inference. This suite asserts the absence directly, asserts that the one
 * bridge between the chapter and the module — a name match — really holds
 * against the frozen bytes, and asserts the overlay says on screen that it is
 * an inference. A silent attribution and a disclosed one look identical from
 * outside, which is why the disclosure is asserted rather than assumed.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const lineAt = (n: number): string => LINES[n - 1] ?? ''

const MODULE_TEXT = readFileSync(
  join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-07', 'degradation.ts'),
  'utf8',
)

/** See the twin suite for why both guards exist. */
function anchoredPairs(locator: string): readonly (readonly [string, number])[] {
  return [...locator.matchAll(/([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s*·\s*L(\d{3,6})/g)]
    .filter((m) => !/^L\d/.test(m[1] as string))
    .map((m) => [m[1] as string, Number(m[2])] as const)
}

describe('the module chapters 40 to 44 never name', () => {
  it('does not appear by identifier anywhere in the artificial-intelligence chapters', () => {
    const span = LINES.slice(85974 - 1, 95408).join('\n')
    expect(span).not.toContain(CC07_MODULE.id)
    /*
      AND THE SPAN REALLY IS THE CHAPTERS, so the absence is not an absence
      from the wrong bytes. Both ends are evidenced: chapter 40's heading opens
      it, its closing rule ends it, and chapter 45 begins two lines on.

      THE END LINE IS ONE SHORT OF THE SPAN THE DISPATCH GAVE, and the
      correction was found mechanically rather than argued. The dispatch's end
      is the blank line between the chapter's closing rule and chapter 45's
      heading; citing it reds `locator-fidelity`'s blank-line check and this
      module's own suite's, because a blank line states nothing and a citation
      of one is always wrong. The blank line is therefore not cited here
      either — the two ends that DO carry something are, and the line between
      them is reached by arithmetic below rather than by a locator.
    */
    expect(lineAt(85974)).toContain('40. Artificial Intelligence and Agent Architecture')
    expect(lineAt(95408)).toBe('---')
    expect(lineAt(95408 + 1)).toBe('')
    expect(lineAt(95408 + 2)).toContain('45. Data and Integration Architecture')
  })

  it('is bridged to the §43.3.3 row by a name match that really holds', () => {
    expect(CC07_AI_FAILURE_ROW_MATCHES_MODULE_NAME).toBe(true)
    expect(CC07_AI_FAILURE_ROW.moduleCell).toBe(CC07_MODULE.name)
    const assembled = `| ${CC07_AI_FAILURE_ROW.moduleCell} | ${CC07_AI_FAILURE_ROW.behaviourCell} | ${CC07_AI_FAILURE_ROW.classificationCell} |`
    expect(lineAt(91088)).toBe(assembled)
  })

  it('says on screen that the attribution is an inference under APP-012', () => {
    expect(CC07_AI_FAILURE_READING.attributionCaveat).toContain('build inference')
    expect(CC07_AI_FAILURE_READING.attributionCaveat).toContain('APP-012')
  })

  it('parses the behaviour cell through the one source-cell parser', () => {
    expect(CC07_AI_FAILURE_CELL.outcome).toBe('allowed')
  })

  it('mints no screen identifier for a field the chapters leave empty', () => {
    // SCR-CC-SAFETY-01 is quoted where the source uses it and is registered
    // nowhere. Asserted over the module text so a later registration reds this.
    expect(lineAt(93782)).toContain('SCR-CC-SAFETY-01')
    expect(MODULE_TEXT).not.toMatch(/ccScreen\(\s*'SCR-CC-SAFETY-01'/)
  })

  it('records what it could not establish with a locator that resolves', () => {
    expect(CC07_DEGRADATION_GAPS.length).toBeGreaterThan(0)
    for (const gap of CC07_DEGRADATION_GAPS) {
      expect(gap.notRepaired.length, gap.what).toBeGreaterThan(0)
      for (const ref of gap.sourceRefs) {
        const single = /^L(\d{3,6})$/.exec(ref)
        if (single !== null) expect(lineAt(Number(single[1])).trim(), ref).not.toBe('')
      }
    }
  })
})

describe('the provenance classes this module emits', () => {
  it('resolves its rendered source-table content to a class the contract forbids calling live', () => {
    expect(contractPermits(CC07_RENDERED_ELEMENT_PROVENANCE, 'mayBeCalledLive')).toBe(false)
    expect(contractPermits(CC07_RENDERED_ELEMENT_PROVENANCE, 'carriesModelOrAgentIdentity')).toBe(
      false,
    )
  })

  it('keeps a person’s signal on a different class from a table cell', () => {
    expect(CC07_SIGNAL_PROVENANCE).not.toBe(CC07_RENDERED_ELEMENT_PROVENANCE)
    expect(provenanceClass(CC07_SIGNAL_PROVENANCE).meaning).toContain('named person')
    expect(contractPermits(CC07_SIGNAL_PROVENANCE, 'carriesHumanIdentity')).toBe(true)
  })

  it('quotes the absolute rule verbatim from L89439', () => {
    expect(lineAt(89439)).toContain(CC07_NEVER_LIVE.rule)
  })

  it('quotes AC-43-332 verbatim from the line that carries it', () => {
    expect(lineAt(91101)).toContain(CC07_AI_ELEMENT_OBLIGATION.criterion)
    const pairs = anchoredPairs(CC07_AI_ELEMENT_OBLIGATION.sourceRef)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })
})

describe('the inverted-polarity row, derived from the cells', () => {
  const derived = uniformlyProhibitedRows()

  it('reproduces the ordinal the matrix hand-assigns, from the data rather than from it', () => {
    expect(derived.map((r) => r.ordinal)).toContain(CC07_ROW_BINDS_EVERY_MODULE)
  })

  it('finds the row whose Tenant Admin cell states the absence for every role', () => {
    const row = derived.find((r) => r.ordinal === CC07_ROW_BINDS_EVERY_MODULE)
    expect(row).toBeDefined()
    expect(row!.cells['Tenant Admin'].text).toContain('no such gating exists for any role')
    expect(lineAt(37511)).toContain('Have feedback required before proceeding')
    expect(lineAt(37511)).toContain('no such gating exists for any role')
  })

  it('returns only rows whose every column prohibits', () => {
    for (const row of derived) {
      for (const column of CC07_COLUMNS) {
        expect(row.cells[column].token, `${row.ordinal}/${column}`).toBe('Explicitly prohibited')
      }
    }
  })

  it('drops a row the moment one column stops prohibiting — proved by ADDING a permissive cell', () => {
    const qualifying = CC07_MATRIX.find((r) => r.ordinal === CC07_ROW_BINDS_EVERY_MODULE)
    expect(qualifying).toBeDefined()
    const loosened = {
      ...qualifying!,
      cells: {
        ...qualifying!.cells,
        Supervisor: { text: 'Allowed', token: 'Allowed' as const, note: null },
      },
    }
    expect(uniformlyProhibitedRows([loosened]).map((r) => r.ordinal)).toEqual([])
    expect(uniformlyProhibitedRows([qualifying!]).map((r) => r.ordinal)).toEqual([
      qualifying!.ordinal,
    ])
  })

  it('cites FUNC-CC-0703-1-1 at a line that really carries it', () => {
    const pairs = anchoredPairs(CC07_NO_CONTROL_RULE.sourceRef)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })
})

describe('DEC-SAFETY-001 — this surface’s end of it', () => {
  it('is not in the shared canon, which is why the record is local', () => {
    expect(OPEN_DECISION_IDS.map(String)).not.toContain(CC07_SAFETY_FLAG_DECISION)
  })

  it('carries the reading that defines the item by NOT being a learning signal', () => {
    const texts = CC07_SAFETY_FLAG_DISCLOSURE.readings.map((r) => r.text).join(' ')
    expect(texts).toContain('visually separate from learning signals')
    expect(lineAt(93756)).toContain(
      'A distinct safety-flag item, visually separate from learning signals and from gate items',
    )
    expect(lineAt(93786)).toContain('the flag creates a distinct Command Center item, not a learning signal')
  })

  it('lands every identifier-anchored locator on a line that really carries it', () => {
    const pairs = CC07_SAFETY_FLAG_DISCLOSURE.readings.flatMap((r) => anchoredPairs(r.locator))
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })

  it('quotes this module’s own optionality clause from the line that carries it', () => {
    expect(lineAt(37497)).toContain(
      'Feedback on agent outputs is always optional and one tap — never required, never gating',
    )
  })

  it('adopts nothing and names the module carrying the other end', () => {
    expect(CC07_SAFETY_FLAG_DISCLOSURE.adopted).toContain('No safety-flag item is built here')
    expect(CC07_SAFETY_FLAG_DISCLOSURE.adopted).toContain('APP-012')
    expect(CC07_SAFETY_FLAG_DISCLOSURE.coDiscloser).toContain('MOD-FL-B8')
  })

  it('builds no safety-flag item and no quarantine state', () => {
    expect(MODULE_TEXT).not.toMatch(/SAFETY_FLAG_ITEM|quarantineState|createSafetyFlag/)
  })
})

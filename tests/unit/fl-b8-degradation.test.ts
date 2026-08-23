import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AI_MODE_IDS } from '@/ai/modes'
import { provenanceClass } from '@/ai/provenance/classes'
import { contractPermits } from '@/ai/provenance/contract'
import { OPEN_DECISION_IDS, decisionRecord } from '@/disclosure/decisions'
import {
  AUTHORED_FALLBACK_PROVENANCE,
  COACHING_ASSET_PROVENANCE,
  FL_B8_AI_FAILURE_CELL,
  FL_B8_AI_FAILURE_READING,
  FL_B8_AI_FAILURE_ROW,
  FL_B8_AI_FAILURE_ROW_MODULE,
  FL_B8_CANON_RECORDS_RENDERED_ON_THIS_SURFACE,
  FL_B8_DEGRADATION_FINDINGS,
  FL_B8_EXPLANATION_LINE_SEAM,
  FL_B8_NEVER_LIVE,
  FL_B8_NO_CONTROL_RULE,
  FL_B8_PAUSE_DECISION,
  FL_B8_PAUSE_DISCLOSURE,
  FL_B8_SAFETY_FLAG_DECISION,
  FL_B8_SAFETY_FLAG_DISCLOSURE,
  NO_SELECTION_PROVENANCE,
  uniformlyProhibitedRows,
} from '@/frontline/modules/fl-b8/degradation'
import { FL_B8_COLUMNS, FL_B8_MATRIX } from '@/frontline/modules/fl-b8/matrix'

/**
 * `MOD-FL-B8`'s artificial-intelligence overlay, checked against the frozen
 * source rather than against the brief that named its lines.
 *
 * WHAT THIS FILE IS FOR, AND IT IS ONE THING. The module renders on the
 * surface where a person acts, and the source tells it two contradictory
 * things about that surface — whether the card carries a way to report an
 * unsafe clip, and whether the tablet says anything at all about a pause. A
 * build that answers either quietly makes a safety claim. Every assertion here
 * is either "the source really says this at this line" or "the build answered
 * neither".
 *
 * NO COUNT OF ANYTHING IS ASSERTED. The membership checks name their members
 * and are proved by ADDING: a filter is fed a row it must drop and a row it
 * must keep, so a filter that returned its input would fail.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const lineAt = (n: number): string => LINES[n - 1] ?? ''

const MODULE_PATH = join(
  process.cwd(),
  'src',
  'frontline',
  'modules',
  'fl-b8',
  'degradation.ts',
)
const MODULE_TEXT = readFileSync(MODULE_PATH, 'utf8')

/**
 * Every `IDENTIFIER · Lnnnn` pair in a locator string.
 *
 * THE IDENTIFIER MUST CARRY A HYPHENATED SEGMENT AND MUST NOT BE A LINE
 * NUMBER. Written first without either guard, it read `L41474 · L41496` as an
 * identifier and a line — a bare co-citation graded as an anchored claim — and
 * reported a real locator as a defect. Both guards were added because that
 * false alarm happened, not in anticipation of it.
 */
function anchoredPairs(locator: string): readonly (readonly [string, number])[] {
  return [...locator.matchAll(/([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s*·\s*L(\d{3,6})/g)]
    .filter((m) => !/^L\d/.test(m[1] as string))
    .map((m) => [m[1] as string, Number(m[2])] as const)
}

describe('the §43.3.4 behaviour row this module inherits', () => {
  it('is transcribed cell for cell from the row that is really at L91188', () => {
    const assembled = `| ${FL_B8_AI_FAILURE_ROW.moduleCell} | ${FL_B8_AI_FAILURE_ROW.behaviourCell} | ${FL_B8_AI_FAILURE_ROW.classificationCell} |`
    expect(lineAt(91188)).toBe(assembled)
  })

  it('names its module by reading the identifier out of the row, not by assignment', () => {
    expect(FL_B8_AI_FAILURE_ROW_MODULE).toBe('MOD-FL-B8')
    expect(lineAt(91188)).toContain(FL_B8_AI_FAILURE_ROW_MODULE)
  })

  it('parses through the one source-cell parser and lands on cachedReadOnlyOffline', () => {
    expect(FL_B8_AI_FAILURE_CELL.outcome).toBe('cachedReadOnlyOffline')
    // The detail is the source's own words after the dash, not a paraphrase.
    expect(lineAt(91188)).toContain(FL_B8_AI_FAILURE_CELL.detail)
  })

  it('cites AC-43-344 at a line that really carries it', () => {
    const pairs = anchoredPairs(FL_B8_AI_FAILURE_READING.sourceRef)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })
})

describe('the provenance class every guidance element here carries', () => {
  it('is the class whose own definition names packaged coaching assets and the replay of a card', () => {
    const record = provenanceClass(COACHING_ASSET_PROVENANCE)
    const definition = lineAt(89431)
    expect(definition).toContain('packaged short coaching assets')
    expect(definition).toContain('the replay of a card that was previously delivered')
    expect(definition).toContain(record.name)
  })

  it('is a class the contract forbids calling live and forbids an agent identity on', () => {
    // The property, not the identifier. A class renamed or renumbered upstream
    // still has to fail this if it becomes one that may be called live.
    expect(contractPermits(COACHING_ASSET_PROVENANCE, 'mayBeCalledLive')).toBe(false)
    expect(contractPermits(COACHING_ASSET_PROVENANCE, 'carriesModelOrAgentIdentity')).toBe(false)
  })

  it('is the same class for the agent-selected card and for the authored fallback', () => {
    expect(AUTHORED_FALLBACK_PROVENANCE).toBe(COACHING_ASSET_PROVENANCE)
  })

  it('gives the absence a different class from the guidance', () => {
    expect(NO_SELECTION_PROVENANCE).not.toBe(COACHING_ASSET_PROVENANCE)
    expect(provenanceClass(NO_SELECTION_PROVENANCE).meaning).toContain('Nothing was produced')
  })

  it('quotes the absolute rule verbatim from L89439', () => {
    expect(lineAt(89439)).toContain(FL_B8_NEVER_LIVE.rule)
  })

  it('records the unclassified explanation line as a seam with an owner, not as a decision', () => {
    expect(FL_B8_EXPLANATION_LINE_SEAM.owner).not.toBe('')
    const pairs = anchoredPairs(FL_B8_EXPLANATION_LINE_SEAM.sourceRef)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })
})

describe('the rows that may draw no control, derived from the cells', () => {
  const derived = uniformlyProhibitedRows()

  it('includes the inverted-polarity dismissal row at L41471', () => {
    expect(derived.map((r) => r.id)).toContain('let-a-dismissal-block-or-delay-a-step')
    expect(lineAt(41471)).toContain('Let a dismissal block or delay a step')
  })

  it('returns only rows whose every column prohibits', () => {
    for (const row of derived) {
      for (const column of FL_B8_COLUMNS) {
        expect(row.cells[column].outcome, `${row.id}/${column}`).toBe('explicitlyProhibited')
      }
    }
  })

  it('drops a row the moment one column stops prohibiting — proved by ADDING a permissive cell', () => {
    const qualifying = derived[0]
    expect(qualifying).toBeDefined()
    const loosened = {
      ...qualifying!,
      cells: {
        ...qualifying!.cells,
        WORKER: { outcome: 'allowed' as const, note: 'planted', openDecision: null },
      },
    }
    expect(uniformlyProhibitedRows([loosened]).map((r) => r.id)).toEqual([])
    // And the same filter still keeps the untouched row, so the empty result
    // above is the permissive cell rather than a filter that returns nothing.
    expect(uniformlyProhibitedRows([qualifying!]).map((r) => r.id)).toEqual([qualifying!.id])
  })

  it('cites FUNC-B8-01-2-2 at a line that really carries it', () => {
    const pairs = anchoredPairs(FL_B8_NO_CONTROL_RULE.sourceRef)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })
})

describe('DEC-SAFETY-001 — disclosed locally, and built to expire', () => {
  it('is not in the shared canon, which is why the record is local', () => {
    expect(OPEN_DECISION_IDS.map(String)).not.toContain(FL_B8_SAFETY_FLAG_DECISION)
  })

  it('carries both sides: the ruling against the control and the storyboard of it', () => {
    const texts = FL_B8_SAFETY_FLAG_DISCLOSURE.readings.map((r) => r.text).join(' ')
    expect(texts).toContain('carries no feedback control at all')
    expect(texts).toContain('visually and functionally distinct from the dismiss control')
  })

  it('lands every identifier-anchored locator on a line that really carries it', () => {
    const locators = FL_B8_SAFETY_FLAG_DISCLOSURE.readings.map((r) => r.locator)
    const pairs = locators.flatMap(anchoredPairs)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })

  it('quotes SB-AI-003 as the source writes it, backticks apart', () => {
    const clause =
      'the worker-facing surface carries no feedback control at all'
    expect(lineAt(86398)).toContain(clause)
    // And the SoW-Fact half of the same sentence, which points the other way.
    expect(lineAt(86398)).toContain(
      'Feedback on agent outputs is always optional and one tap, never required, never gating',
    )
  })

  it('adopts neither reading and says so as a client-delegated choice', () => {
    expect(FL_B8_SAFETY_FLAG_DISCLOSURE.adopted).toContain('Neither reading is adopted')
    expect(FL_B8_SAFETY_FLAG_DISCLOSURE.adopted).toContain('APP-012')
  })

  it('states which reading the build demonstrates and gives a reason for it', () => {
    expect(FL_B8_SAFETY_FLAG_DISCLOSURE.adopted).toContain('DEMONSTRATES')
    expect(FL_B8_SAFETY_FLAG_DISCLOSURE.adopted).toContain('reason is stated')
  })

  it('builds no flag control: the module names no control, only the decision', () => {
    // The absence is asserted over what the module EXPORTS, so a control added
    // later cannot hide behind a record that still says none exists.
    expect(MODULE_TEXT).not.toMatch(/onFlag|flagControl|FLAG_CONTROL|quarantineAsset/)
  })
})

describe('DEC-AIDISCLOSE-001 — consumed from the canon, not re-derived', () => {
  it('names the record the mode machine already names, rather than a second identifier', () => {
    expect(OPEN_DECISION_IDS).toContain(FL_B8_PAUSE_DECISION)
  })

  it('holds no second copy of the canon record’s readings', () => {
    for (const reading of decisionRecord(FL_B8_PAUSE_DECISION).readings) {
      expect(MODULE_TEXT).not.toContain(reading.text)
    }
  })

  it('resolves neither side and draws no mode chip', () => {
    expect(FL_B8_PAUSE_DISCLOSURE.notResolvedHere).toContain('Neither side is adopted')
    for (const mode of AI_MODE_IDS) {
      expect(MODULE_TEXT, `${mode} must not be named here`).not.toContain(mode)
    }
    expect(MODULE_TEXT).not.toContain('Live coaching paused by the platform')
  })

  /**
   * A GUARD THAT EXISTS BECAUSE THE MOUNT BROKE ONCE, and it is a real check
   * rather than a note about a fixed thing.
   *
   * `slice-07-absence-sweep` forbids nine word families anywhere in the
   * Frontline export and reads the BUILT export, so a word inside a shared
   * decision record fails minutes later, on the route that mounts it, in the
   * release suite. Mounting this record on the run player did exactly that
   * while this task ran: its position paragraph described the two
   * contradicting rulings as being of equal rank — provenance markings of
   * equal standing, nothing to do with workers. The record's own wording
   * changed outside this task's path list before it landed, so nothing here
   * works around it; this asserts the condition that makes the mount safe, in
   * seconds, against the record itself.
   *
   * THE WORD FAMILIES ARE READ FROM THE SWEEP'S OWN FILE, never re-typed. A
   * second copy of a closed vocabulary is this build's most persistent defect,
   * and a copy of THIS one would go stale the moment the sweep gains a tenth
   * family — which is precisely when the guard would need to have grown.
   */
  it('mounts only canon records the Frontline absence sweep can carry', () => {
    const sweep = readFileSync(
      join(process.cwd(), 'tests', 'coverage', 'slice-07-absence-sweep.test.ts'),
      'utf8',
    )
    const spellings = [...sweep.matchAll(/spellings: '([^']+)'/g)].map((m) => m[1] as string)
    expect(spellings.length).toBeGreaterThan(0)
    const forbidden = new RegExp(`(?<![A-Za-z])(${spellings.join('|')})(?![A-Za-z])`, 'i')

    // The guard can fail: the pattern really does catch the word it is for.
    expect(forbidden.test('two rulings at equal rank')).toBe(true)

    expect(FL_B8_CANON_RECORDS_RENDERED_ON_THIS_SURFACE.length).toBeGreaterThan(0)
    for (const id of FL_B8_CANON_RECORDS_RENDERED_ON_THIS_SURFACE) {
      const record = decisionRecord(id)
      expect(forbidden.test(record.question), `${id} question`).toBe(false)
      expect(forbidden.test(record.adopted), `${id} adopted`).toBe(false)
      for (const reading of record.readings) {
        expect(forbidden.test(reading.text), `${id} ${reading.locator}`).toBe(false)
      }
    }
  })

  it('mounts the record this module actually renders, not a different one', () => {
    expect(FL_B8_CANON_RECORDS_RENDERED_ON_THIS_SURFACE).toContain(FL_B8_PAUSE_DECISION)
  })

  it('quotes this module’s own existing statement from the line that carries it', () => {
    expect(lineAt(41540)).toContain(
      'the application does not announce agent failures to the worker, because the worker',
    )
    const pairs = anchoredPairs(FL_B8_PAUSE_DISCLOSURE.sourceRef)
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })
})

describe('the findings this overlay records rather than closes', () => {
  it('lands every identifier-anchored locator on a line that really carries it', () => {
    const pairs = FL_B8_DEGRADATION_FINDINGS.flatMap((f) => anchoredPairs(f.sourceRef))
    expect(pairs.length).toBeGreaterThan(0)
    for (const [identifier, line] of pairs) {
      expect(lineAt(line), `${identifier} at L${line}`).toContain(identifier)
    }
  })

  it('names an owner for each, so no finding is left addressed to nobody by omission', () => {
    for (const finding of FL_B8_DEGRADATION_FINDINGS) {
      expect(finding.owner.length, finding.what).toBeGreaterThan(0)
    }
  })

  it('measures the two screen identifiers 44A.12 introduces as occurring once each', () => {
    const whole = LINES.join('\n')
    expect(whole.split('SCR-FL-COACH-07').length - 1).toBe(1)
    expect(whole.split('SCR-CC-SAFETY-01').length - 1).toBe(1)
    expect(lineAt(93780)).toContain('SCR-FL-COACH-07')
    expect(lineAt(93782)).toContain('SCR-CC-SAFETY-01')
  })
})

describe('the matrix this overlay reads is the one already shipped', () => {
  it('reads the seven-row matrix rather than declaring a second copy of it', () => {
    expect(uniformlyProhibitedRows().every((row) => FL_B8_MATRIX.some((r) => r.id === row.id))).toBe(
      true,
    )
  })
})

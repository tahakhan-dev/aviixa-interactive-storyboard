import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { aiMode } from '@/ai/modes'
import { catalogueRow } from '@/ai/failures/catalogue'
import { OPERATIONAL_SEVERITY_BANDS } from '@/ai/failures/severity'
import { crossMatrixContradiction } from '@/ai/agents/contracts'
import { CHAPTER_44_COLUMN_ROLES, cellTextOf, chapter44Matrix } from '@/ai/agents/matrices'
import { provenanceClass } from '@/ai/provenance/classes'
import { CC08_COLUMNS } from '@/surfaces/cc/modules/cc-08/matrix'
import {
  CC08_DEGRADATION_PROVENANCE,
  CC08_DEGRADATION_SEAMS,
  CC08_NO_AI_CLAIMS,
  CC08_PAUSE_BANNER_STATEMENTS,
  CC08_PAUSE_SCOPES,
  cc08HealthFlagRollUpLeak,
  cc08PauseDistinguishability,
  cc08PauseStates,
  distinctPauseBannerTexts,
  exactPauseBannerStatement,
  modesSharingAPauseLabel,
  pauseScopeOf,
  scopelessPauseBannerStatements,
  type Cc08PauseBannerStatement,
} from '@/surfaces/cc/modules/cc-08/degradation'

/**
 * Slice 11, wave 2, task 10 — `MOD-CC-08`'s degradation overlay.
 *
 * WHAT THIS FILE IS FOR, AND WHAT IT REFUSES TO DO.
 *
 *   1. EVERY LOCATOR IS OPENED AGAINST THE FROZEN BYTES. `locator-fidelity`
 *      checks identifier-anchored citations; an ordinary prose comment citing
 *      a wrong line walks past it. So every line this overlay names is read
 *      here and asserted to carry what the overlay says it carries.
 *   2. THE FOUR PAUSE-BANNER SPELLINGS ARE RE-READ, not compared to each
 *      other. A test that only checked they differ would pass on four
 *      invented strings.
 *   3. `AC-42-303` IS ANSWERED BY MEASUREMENT. The check is not "the modes
 *      differ" — they do not, and that is the finding. It is that the mode
 *      contract matrix separates them on NOTHING and the catalogue's
 *      tenant-web cell separates them, both computed off the wave-0 records.
 *   4. THE ROLL-UP LEAK IS DERIVED. Nothing here asserts a literal token for
 *      either cell that the frozen line does not also carry.
 *   5. THE TWO CROSS-CHAPTER CONTRADICTIONS ARE NOT RE-TRANSCRIBED. Wave 1
 *      owns them; this file checks that the overlay reaches them by
 *      identifier and that the column each reading names is a column its own
 *      cited header carries — the check that caught chapter 44's Worker-first
 *      order being read onto this module's Tenant-Admin-first one.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const LINES: readonly string[] = ['', ...SOURCE_BYTES.toString('utf8').replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── provenance ────────────────────────────────────────────────────────── */

describe('the provenance class this overlay emits', () => {
  it('is computed from the facts and is the unavailable class', () => {
    // Computed, never a literal in the module. It must be a real class and it
    // must be the one whose contract refuses a live-artificial-intelligence
    // label, because every element this overlay adds says an agent is absent.
    const record = provenanceClass(CC08_DEGRADATION_PROVENANCE)
    expect(record.mayBeCalledLive).not.toBe('Allowed')
    expect(record.name.toLowerCase()).toContain('unavailable')
  })

  it('emits exactly one class for the whole overlay', () => {
    // The slice rule: no rendering path may emit more than one provenance
    // class. The overlay exports one class and there is nowhere for a second.
    expect(typeof CC08_DEGRADATION_PROVENANCE).toBe('string')
  })
})

/* ── the four pause-banner spellings ───────────────────────────────────── */

describe('the pause banner as the source spells it', () => {
  it('finds every spelling on the line it names', () => {
    for (const statement of CC08_PAUSE_BANNER_STATEMENTS) {
      expect(L(statement.line), `L${statement.line}`).toContain(statement.text)
    }
  })

  it('names the section each spelling sits in, checked at the line', () => {
    // Each `where` is checked against something the line itself carries, so a
    // spelling attributed to the wrong table reds rather than reading well.
    // Keyed on `number`, not on the literal union the `as const` infers: a map
    // whose key type is the set of lines already registered can only be asked
    // about lines that are there, which would make every lookup below vacuous.
    const byLine = new Map<number, Cc08PauseBannerStatement>(
      CC08_PAUSE_BANNER_STATEMENTS.map((s) => [s.line, s]),
    )
    expect(L(byLine.get(89_348)!.line)).toContain('Storyboard SB-42-301')
    expect(L(byLine.get(89_348)!.line)).toContain('agent activity panel')
    expect(L(byLine.get(90_513)!.line)).toContain('`FAIL-AI-41`')
    expect(L(byLine.get(90_552)!.line)).toContain('Illustrative Example')
    expect(L(byLine.get(90_552)!.line)).toContain('Client Command Center')
    expect(L(byLine.get(48_474)!.line)).toContain('`STATE-11`')
  })

  it('marks one spelling per scope as the one its own table header calls exact', () => {
    // The claim is about L90507, the header of the table L90513 and L90514 sit
    // in. One row per scope, so one exact spelling per scope and no tie.
    expect(L(90_507)).toContain('Exact user-visible message, tenant web surfaces')
    expect(exactPauseBannerStatement('platform-wide').line).toBe(90_513)
    expect(exactPauseBannerStatement('per tenant').line).toBe(90_514)
    // Every spelling marked exact really does sit inside that table's body.
    for (const statement of CC08_PAUSE_BANNER_STATEMENTS) {
      if (!statement.labelledExactBySource) continue
      expect(statement.line).toBeGreaterThan(90_507)
      expect(statement.line, `L${statement.line}`).toBeLessThan(90_549)
    }
  })

  it('records the state register spelling as naming no scope, and finds it does not', () => {
    // The AC-42-303 problem inside this build's own surface register: a banner
    // a tenant cannot read a scope off. Computed, and checked at the line.
    const scopeless = scopelessPauseBannerStatements()
    expect(scopeless.map((s) => s.line)).toEqual([48_474])
    expect(L(48_474)).not.toContain('workspace')
    expect(L(48_474)).not.toContain('platform-wide')
    expect(L(48_474)).not.toContain('per tenant')

    // AND EVERY OTHER SPELLING'S SCOPE IS CHECKED AT ITS OWN LINE, BY THE
    // PHRASE THAT LINE USES. Running `pauseScopeOf` over the whole line was
    // tried first and went red on L89348: that paragraph puts all five
    // surfaces in one sentence and so names the platform AND the Tenant Admin,
    // and the resolver correctly refuses a sentence naming both. A scope read
    // off a whole paragraph is a guess; these are read off the phrase.
    expect(L(89_348)).toContain('During a platform-wide pause (`AIMODE-14`)')
    expect(L(90_513)).toContain('Emergency pause, platform-wide')
    expect(L(90_514)).toContain('Emergency pause, per tenant')
    expect(L(90_552)).toContain('applies a platform-wide emergency pause')
    for (const phrase of [
      'During a platform-wide pause (`AIMODE-14`)',
      'Emergency pause, platform-wide',
      'applies a platform-wide emergency pause',
    ]) {
      expect(pauseScopeOf(phrase), phrase).toBe('platform-wide')
    }
    expect(pauseScopeOf('Emergency pause, per tenant')).toBe('per tenant')
  })

  it('finds every spelling distinct, and two of them distinct only by a full stop', () => {
    // THIS TEST FIRST ASSERTED THERE WERE FEWER DISTINCT TEXTS THAN STATEMENTS
    // AND WENT RED. Every spelling really is different, so no statement is a
    // duplicate — but two of them differ ONLY by a trailing full stop, which
    // is why a fold that tidied punctuation before counting would report a
    // collision the source does not have, and why the two figures are kept as
    // separate computations rather than one number in a sentence.
    const distinct = distinctPauseBannerTexts()
    expect(distinct.length).toBe(CC08_PAUSE_BANNER_STATEMENTS.length)
    const depunctuated = new Set(distinct.map((t) => t.replace(/\.$/, '')))
    expect(depunctuated.size).toBeLessThan(distinct.length)
  })

  it('carries no spelling the source does not, in either direction', () => {
    // Every spelling the source writes for this banner in the spans this
    // overlay reads is registered. Swept rather than listed: any line in the
    // pause storyboard, the FAIL-AI pause rows or the surface's state register
    // carrying "Agents paused by the platform" must be registered above.
    //
    // TYPED `Set<number>` DELIBERATELY. Left to inference the set's element
    // type is the union of the lines already registered, so `has` could only
    // be asked about lines that are in it and the sweep would be vacuous —
    // defect shape 9, caught here by the compiler rather than by a reviewer.
    const registered = new Set<number>(CC08_PAUSE_BANNER_STATEMENTS.map((s) => s.line))
    const spans: readonly (readonly [number, number])[] = [
      [48_470, 48_480],
      [89_344, 89_352],
      [90_505, 90_555],
    ]
    for (const [from, to] of spans) {
      for (let n = from; n <= to; n += 1) {
        if (!L(n).includes('Agents paused by the platform')) continue
        expect(registered.has(n), `L${n} carries the banner and is not registered`).toBe(true)
      }
    }
  })
})

/* ── the two pauses, and the join ──────────────────────────────────────── */

describe('the two pause states', () => {
  it('reads a scope off each side independently, from the source words', () => {
    expect(pauseScopeOf(aiMode('AIMODE-14').name)).toBe('platform-wide')
    expect(pauseScopeOf(aiMode('AIMODE-13').name)).toBe('per tenant')
    expect(pauseScopeOf(catalogueRow('FAIL-AI-41').cells.failureMode)).toBe('platform-wide')
    expect(pauseScopeOf(catalogueRow('FAIL-AI-42').cells.failureMode)).toBe('per tenant')
  })

  it('answers null rather than guessing on a sentence naming neither or both', () => {
    // A resolver that always answers is how "per tenant" becomes
    // "platform-wide" on a screen a tenant reads.
    expect(pauseScopeOf('Emergency pause')).toBeNull()
    expect(pauseScopeOf('a platform pause for one tenant')).toBeNull()
  })

  it('builds one state per scope and no more', () => {
    const states = cc08PauseStates()
    expect(states.map((s) => s.scope).sort()).toEqual([...CC08_PAUSE_SCOPES].sort())
  })

  it('takes each message from the catalogue cell, verbatim at its own line', () => {
    for (const state of cc08PauseStates()) {
      const tableARow = state.failure.attributeLocators[0]!
      expect(L(tableARow), `L${tableARow}`).toContain(state.failure.id)
      expect(L(tableARow)).toContain(state.tenantWebMessage)
      expect(L(tableARow)).toContain(state.mode.name.includes('Platform') ? 'platform-wide' : 'per tenant')
    }
  })

  it('carries an operational band from the operational vocabulary, not the manufacturing one', () => {
    for (const state of cc08PauseStates()) {
      expect(OPERATIONAL_SEVERITY_BANDS).toContain(state.operationalSeverity)
    }
    // The two pauses are not the same band, and the bands are the source's.
    const bands = cc08PauseStates().map((s) => s.operationalSeverity)
    expect(new Set(bands).size).toBe(bands.length)
  })

  it('labels the mode-to-failure join a build inference, because the source joins no PAUSE', () => {
    // THE FIRST VERSION OF THIS TEST ASSERTED THE SOURCE NEVER JOINS THE TWO
    // VOCABULARIES AND WENT RED, WHICH IS HOW THE MODULE'S COMMENT WAS FOUND
    // WRONG. It joins them on three lines. The true and narrower claim is that
    // no line joins a PAUSE mode to a PAUSE failure, and that is what the
    // inference rests on. Both halves are measured here so that a source
    // correction on either side reds this rather than passing quietly.
    const joined = LINES.map((line, n) => ({ line, n })).filter(
      (row) => /AIMODE-\d/.test(row.line) && /FAIL-AI-\d/.test(row.line),
    )
    expect(joined.map((row) => row.n)).toEqual([89_295, 90_158, 90_173])
    const pauseModes = cc08PauseStates().map((s) => s.mode.id)
    const pauseFailures = cc08PauseStates().map((s) => s.failure.id)
    for (const row of joined) {
      for (const token of [...pauseModes, ...pauseFailures]) {
        expect(row.line, `L${row.n} names ${token}`).not.toContain(token)
      }
    }
    for (const state of cc08PauseStates()) {
      expect(state.inference).toContain('build inference')
    }
  })
})

/* ── AC-42-303, measured ───────────────────────────────────────────────── */

describe('AC-42-303 on this panel', () => {
  it('finds the mode contract matrix separates the two pauses on nothing', () => {
    // The finding, not an assumption: AIMODE-13 and AIMODE-14 agree on all
    // five contract columns, so a panel keyed on the mode matrix shows one
    // screen for two states a human must answer differently.
    expect(cc08PauseDistinguishability().modeContractColumnsThatDiffer).toEqual([])
    expect(L(89_368)).toContain('`AIMODE-13`')
    expect(L(89_369)).toContain('`AIMODE-14`')
    // Read straight off the frozen rows rather than off the wave-0 records.
    const strip = (n: number): string => L(n).split('|').slice(3).join('|')
    expect(strip(89_368)).toBe(strip(89_369))
  })

  it('finds the tenant-web message is what separates them, and renders from there', () => {
    const measured = cc08PauseDistinguishability()
    expect(measured.tenantWebMessagesDiffer).toBe(true)
    expect(measured.distinguishedBy).toBe('the failure catalogue')
  })

  it('proves the worker label resolves to both, so nothing may key on it', () => {
    const shared = modesSharingAPauseLabel()
    expect(shared).toContain('AIMODE-13')
    expect(shared).toContain('AIMODE-14')
    expect(shared.length).toBeGreaterThan(cc08PauseStates().length - 1)
  })
})

/* ── the roll-up leak ──────────────────────────────────────────────────── */

describe('the health-flag roll-up leak', () => {
  it('reaches the column by the header word and not by position', () => {
    const leak = cc08HealthFlagRollUpLeak()
    expect(CC08_COLUMNS).toContain(leak.column)
    // This matrix's header runs Tenant Admin FIRST; chapter 44's runs Worker
    // first. Both orders are asserted so neither can be read onto the other.
    expect(L(37_664).split('|').map((c) => c.trim())[2]).toBe(leak.column)
    expect(L(91_761).split('|').map((c) => c.trim())[2]).toBe('Worker')
  })

  it('derives both cells and finds the two rows one apart in the source', () => {
    const leak = cc08HealthFlagRollUpLeak()
    expect(leak.rollUp.row.ordinal).toBe(leak.flags.row.ordinal + 1)
    const flagsLine = Number(leak.flags.row.sourceRef.replace('L', ''))
    const rollUpLine = Number(leak.rollUp.row.sourceRef.replace('L', ''))
    expect(rollUpLine).toBe(flagsLine + 1)
    expect(L(flagsLine)).toContain(leak.flags.row.capability)
    expect(L(rollUpLine)).toContain(leak.rollUp.row.capability)
  })

  it('finds the refusal and the grant, read from the cells rather than declared', () => {
    const leak = cc08HealthFlagRollUpLeak()
    expect(leak.tokensDiffer).toBe(true)
    expect(leak.flags.cellText).toBe('Explicitly prohibited')
    expect(leak.rollUp.cellText).toBe(
      'Allowed with conditions — requires Tenant or Site read scope',
    )
    // And both cells are at those lines in that column, positionally, on the
    // header's own index — the check that a token coincidence cannot pass.
    const index = L(37_664).split('|').map((c) => c.trim()).indexOf(leak.column)
    const cellAt = (n: number): string => L(n).split('|').map((c) => c.trim())[index]!
    expect(cellAt(37_669)).toBe(leak.flags.cellText)
    expect(cellAt(37_670)).toBe(leak.rollUp.cellText)
  })
})

/* ── the two contradictions, consumed rather than re-transcribed ───────── */

describe('the cross-chapter contradictions this module owns', () => {
  it('reaches the Tenant Admin degradation question through wave 1, at L91768', () => {
    const record = crossMatrixContradiction('tenant-admin-and-the-ai-degradation-state')
    expect(record.adopted).toBeNull()
    const lines = record.readings.map((r) => Number(r.sourceRef.replace('L', '')))
    expect(lines).toContain(37_669)
    expect(lines).toContain(91_768)
    expect(lines).toContain(89_348)
    expect(lines).toContain(92_309)
    // L91767 is the off-by-one both briefs shipped, and it is NOT this row.
    expect(lines).not.toContain(91_767)
    expect(L(91_767)).toContain('Dismiss guidance')
    expect(L(91_768)).toContain('See the honest degradation state')
  })

  it('reaches the agent on/off disagreement, and its prose line is L37646', () => {
    const record = crossMatrixContradiction('switch-an-agent-on-or-off')
    expect(record.adopted).toBeNull()
    const lines = record.readings.map((r) => Number(r.sourceRef.replace('L', '')))
    expect(lines).toContain(91_769)
    expect(lines).toContain(37_671)
    expect(lines).toContain(37_646)
    // L37650 is the re-plan's wrong line for the prose, and it is a heading.
    expect(L(37_650)).toContain('**The activity log.**')
    expect(L(37_646)).toContain('never performed here')
  })

  it('takes the chapter-44 side by role name off that matrix own header', () => {
    // The column index is derived from chapter 44's OWN header rather than
    // carried from this module's, which run in opposite orders.
    const matrix = chapter44Matrix('prevention')
    const row = matrix.rows.find((r) => r.line === 91_769)!
    expect(CHAPTER_44_COLUMN_ROLES).toContain('QUALITY_MANAGER')
    expect(cellTextOf(row, 'QUALITY_MANAGER')).toContain('a Studio action under authoring grants')
    expect(cellTextOf(row, 'TENANT_ADMIN')).toBe('Explicitly prohibited')
  })
})

/* ── the module's own no-artificial-intelligence claims ────────────────── */

describe('what the panel claims it does with no agents', () => {
  it('quotes each claim at the line it names', () => {
    for (const claim of CC08_NO_AI_CLAIMS) {
      expect(L(claim.line), `L${claim.line}`).toContain(claim.claim)
    }
  })

  it('names no claim twice and gives each its own line', () => {
    const ids = CC08_NO_AI_CLAIMS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const lines = CC08_NO_AI_CLAIMS.map((c) => c.line)
    expect(new Set(lines).size).toBe(lines.length)
  })
})

/* ── seams ─────────────────────────────────────────────────────────────── */

describe('the seams this task leaves open', () => {
  it('names an owner for each, and never "someone"', () => {
    for (const seam of CC08_DEGRADATION_SEAMS) {
      expect(seam.owner.length).toBeGreaterThan(0)
      expect(seam.owner.toLowerCase()).not.toContain('someone')
      expect(seam.what.length).toBeGreaterThan(0)
    }
    expect(new Set(CC08_DEGRADATION_SEAMS.map((s) => s.id)).size).toBe(
      CC08_DEGRADATION_SEAMS.length,
    )
  })
})

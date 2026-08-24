import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { CC_MODULE_SPINE } from '@/surfaces/cc/modules'
import { DOH_MODULES, DOH_OUT_OF_SLICE_MODULES } from '@/surfaces/doh/modules'
import { SA_MODULES } from '@/surfaces/sa/modules'
import { CONSOLE_AUTHORITY_PROVENANCE } from '@/surfaces/sa/ai-failure-authority'
import {
  FIVE_SURFACE_CLASSIFICATION,
  FIVE_SURFACE_OBLIGATIONS,
  FIVE_SURFACE_SPINE_ITEM,
  DRAFT_STRING_RULE,
  NO_FIVE_COLUMN_STRING_TABLE,
  OVERLAY_PROVENANCE,
  derivedRows,
  type OverlayTable,
  type SurfaceAiOverlay,
} from '@/ai/five-surface/overlay'
import {
  STU_AI_BEHAVIOUR_TABLE,
  STU_AI_OVERLAY,
  STU_AXIS_ATTRIBUTION,
  STU_UNCANONISED_DECISIONS,
} from '@/studio/ai-degradation'
import {
  CC_AI_BEHAVIOUR_TABLE,
  CC_AI_OVERLAY,
  CC_IDENTIFIER_ATTRIBUTION,
  CC_UNCANONISED_DECISIONS,
  ccAiBehaviour,
} from '@/surfaces/cc/ai-degradation'
import { FL_AI_BEHAVIOUR_TABLE, FL_AI_OVERLAY } from '@/frontline/ai-degradation'
import {
  DOH_AI_FLOOR_MODULE_IDS,
  DOH_AI_FLOOR_PHRASES,
  DOH_AI_OVERLAY,
  DOH_EVERY_MODULE_READINGS,
  DOH_FAILURE_FAMILY_TABLE,
  DOH_MANUAL_WORKFLOW_RULE,
  DOH_MODULE_AI_ROWS,
  DOH_MODULE_AI_TABLE,
  DOH_READING_ADOPTED,
} from '@/surfaces/doh/ai-degradation'
import {
  SA_AI_OVERLAY,
  SA_DERIVATION_RULE,
  SA_MATRIX_ATTRIBUTION,
  SA_MATRIX_CAPTION_REF,
  SA_MODULE_AI_ROWS,
  SA_MODULE_AI_TABLE,
} from '@/surfaces/sa/ai-degradation'
import { fiveSurfaceByJourneyCode } from '@/ai/five-surface/surface-codes'
import {
  AI_DEGRADATION_BY_STEP as STUDIO_AI_DEGRADATION,
  JOURNEY_STEPS as STUDIO_JOURNEY_STEPS,
} from '@/studio/journey/effects'
import {
  AI_DEGRADATION_BY_STEP as HUB_AI_DEGRADATION,
  JOURNEY_STEPS as HUB_JOURNEY_STEPS,
} from '../../app/hub/journey/effects'

/**
 * Slice 11, wave 3, task 15 — THE FIVE-SURFACE AI-DEGRADATION OVERLAYS.
 *
 * WHAT THIS FILE HOLDS, and it is not "the tables exist":
 *
 *   - EVERY TRANSCRIBED CELL IS RE-DERIVED FROM THE FROZEN BYTES AT RUN TIME,
 *     cell for cell, by parsing the pipe-delimited line the row claims to be.
 *     A hand-written expectation could have been copied from the same mistake
 *     as the module.
 *   - EVERY ROW COUNT IS COUNTED HERE, by walking pipe-prefixed lines down from
 *     the header until they stop. No span is trusted, because a span states
 *     where a table is and not how many rows it has.
 *   - NO LENGTH IS ASSERTED AS A GATE. Membership is the LIST — the module
 *     identifiers, the axis cells, the surface ids — so an addition and a
 *     deletion both fail with a name in the message. A length assertion passes
 *     for the wrong reason the moment one row is swapped for another.
 *   - THE DERIVED TABLES ARE HELD TO A DIFFERENT STANDARD, not a weaker one:
 *     a derived table must declare itself derived, must carry a non-null
 *     `whyDerived`, and must NOT cite a chapter-43 line as though that line
 *     stated the row.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const LINES: readonly string[] = [
  '',
  ...SOURCE_BYTES.toString('utf8').replace(/\n$/, '').split('\n'),
]
const L = (n: number): string => LINES[n] ?? ''
/** A locator like `L91082` back to its number. */
const lineOf = (locator: string): number => Number(locator.replace(/^L/, ''))

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

const isTableRow = (line: string): boolean => line.trimStart().startsWith('|')
const isRule = (line: string): boolean => /^\s*\|[\s|:-]+\|\s*$/.test(line)

/** Content rows beneath a header, COUNTED by walking until the rows stop. */
function contentRowNumbers(headerLine: number): readonly number[] {
  expect(isTableRow(L(headerLine))).toBe(true)
  expect(isRule(L(headerLine + 1))).toBe(true)
  const numbers: number[] = []
  for (let n = headerLine + 2; isTableRow(L(n)); n += 1) numbers.push(n)
  return numbers
}

it('is reading the frozen source this build was measured against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ==================================================================== *
 * THE THREE TRANSCRIBED TABLES, CELL FOR CELL.
 * ==================================================================== */

const transcribed: readonly (readonly [string, OverlayTable])[] = [
  ['Standards and Operations Studio (§43.3.2)', STU_AI_BEHAVIOUR_TABLE],
  ['Client Command Center (§43.3.3)', CC_AI_BEHAVIOUR_TABLE],
  ['Frontline Worker Application (§43.3.4)', FL_AI_BEHAVIOUR_TABLE],
  ['Delivery Operations Hub failure families (§43.3.1)', DOH_FAILURE_FAMILY_TABLE],
]

/**
 * A transcribed table's two locators are non-null BY THE TYPE'S OWN INVARIANT
 * — they are `string | null` so a derived table can carry neither — so this
 * asserts the invariant rather than assuming it, and then narrows.
 */
const ref = (value: string | null): string => {
  expect(value).not.toBeNull()
  return value ?? ''
}

describe.each(transcribed)('%s — transcribed', (_name, table) => {
  it('declares itself transcribed and claims no derivation', () => {
    expect(table.kind).toBe('transcribed')
    expect(table.whyDerived).toBeNull()
    for (const row of table.rows) expect(row.kind).toBe('transcribed')
  })

  it('carries the header line verbatim, heading for heading', () => {
    expect(cells(L(lineOf(ref(table.headerRef))))).toEqual([...table.headings])
  })

  it('carries the caption verbatim', () => {
    expect(L(lineOf(ref(table.captionRef)))).toBe(`**${table.caption}**`)
  })

  it('has exactly the rows the source has beneath that header, COUNTED not spanned', () => {
    const counted = contentRowNumbers(lineOf(ref(table.headerRef)))
    expect(table.rows.map((row) => lineOf(row.sourceRef))).toEqual([...counted])
  })

  it('matches every cell of every row against the line the row claims to be', () => {
    for (const row of table.rows) {
      expect(cells(L(lineOf(row.sourceRef)))).toEqual([...row.cells])
      // Width is the header's, so a row cannot be short a column.
      expect(row.cells).toHaveLength(table.headings.length)
    }
  })

  it('names a real line in every extra reading it carries', () => {
    for (const row of table.rows) {
      for (const reading of row.readings) {
        expect(L(lineOf(reading.sourceRef))).not.toBe('')
        expect(reading.cellIndex).toBeLessThan(row.cells.length)
        expect(reading.alsoReads.length).toBeGreaterThan(0)
        expect(reading.asHeaded.length).toBeGreaterThan(0)
      }
    }
  })
})

/* ==================================================================== *
 * §43.3.2 — THE AXIS IS `Capability` AND NO MODULE COLUMN EXISTS.
 * ==================================================================== */

describe('the Studio table is not module coverage', () => {
  it('has the axis `Capability`, and section 43.3.2 names no Studio module', () => {
    expect(STU_AI_BEHAVIOUR_TABLE.headings[0]).toBe('Capability')
    const section = LINES.slice(90_933, 91_023).join('\n')
    expect(section).not.toContain('MOD-STU-')
  })

  it('carries no module column and no module identifier in any cell', () => {
    for (const row of STU_AI_BEHAVIOUR_TABLE.rows) {
      for (const cell of row.cells) expect(cell).not.toMatch(/MOD-STU-/)
    }
  })

  it('declares its own absence of a tenant availability state, with a reason', () => {
    // AC-42-301 is conditional: it binds surfaces that DISPLAY such a state.
    expect(L(89_400)).toContain('every surface that displays an artificial-intelligence')
    expect(STU_AI_OVERLAY.statedAbsences.length).toBeGreaterThan(0)
    for (const absence of STU_AI_OVERLAY.statedAbsences) {
      expect(absence.reason.length).toBeGreaterThan(0)
      expect(L(lineOf(absence.sourceRef))).not.toBe('')
    }
  })

  it('is backed by twelve Not-applicable Studio cells in the queued-request matrix', () => {
    const rows = contentRowNumbers(89_695)
    for (const n of rows) {
      // Column 4 is the Studio column of that matrix.
      expect(cells(L(n))[4] ?? '').toMatch(/^Not applicable/)
    }
    expect(cells(L(rows[0] ?? 0))[4]).toContain('the Studio authors content')
  })
})

/* ==================================================================== *
 * §43.3.3 — THE NAME-TO-IDENTIFIER JOIN IS CHECKED, BOTH WAYS.
 * ==================================================================== */

describe('the Command Center join is checked, not hand-written', () => {
  it('has the axis `Command Center module`, and section 43.3.3 names no MOD-CC', () => {
    expect(CC_AI_BEHAVIOUR_TABLE.headings[0]).toBe('Command Center module')
    expect(LINES.slice(91_023, 91_116).join('\n')).not.toContain('MOD-CC')
  })

  it('matches the registry by exact string AND by position, since either alone can pass wrongly', () => {
    const registryRows = contentRowNumbers(35_184)
    const registry = registryRows.map((n) => {
      const c = cells(L(n))
      return { id: (c[0] ?? '').replace(/`/g, ''), name: c[1] ?? '' }
    })
    const table = CC_AI_BEHAVIOUR_TABLE.rows.map((row) => row.cells[0] ?? '')
    expect(table).toEqual(registry.map((r) => r.name))
    // And the identifier this build supplies agrees with the registry row in
    // the same position, so a reordered table cannot pass.
    expect(CC_AI_BEHAVIOUR_TABLE.rows.map((row) => ccAiBehaviour(row.cells[0] === undefined
      ? 'MOD-CC-01'
      : (CC_MODULE_SPINE.find((m) => m.name === row.cells[0])?.id ?? 'MOD-CC-01')).moduleId))
      .toEqual(registry.map((r) => r.id))
  })

  it('resolves every registry module to a row and refuses a name it does not have', () => {
    for (const module of CC_MODULE_SPINE) {
      expect(ccAiBehaviour(module.id).cells[0]).toBe(module.name)
    }
  })
})

/* ==================================================================== *
 * §43.3.4 — THE THREE CONNECTIVITY CELLS, BOTH READINGS EACH.
 * ==================================================================== */

describe('the Frontline table carries three cells that describe connectivity', () => {
  const withReadings = FL_AI_BEHAVIOUR_TABLE.rows.filter((row) => row.readings.length > 0)

  it('flags exactly the rows whose behaviour cell is not about AI failure, by module', () => {
    expect(withReadings.map((row) => row.cells[0])).toEqual([
      '`MOD-FL-B8` Coaching Rendering',
      '`MOD-FL-B10` Notifications',
      '`MOD-FL-B12` Training Library Viewer',
    ])
    expect(withReadings.map((row) => row.sourceRef)).toEqual(['L91188', 'L91190', 'L91192'])
  })

  it('reads those three lines out of the frozen source and confirms what they say', () => {
    expect(L(91_188)).toContain('Cached read-only while offline')
    expect(L(91_190)).toContain('Queued while offline')
    expect(L(91_192)).toContain('Unavailable — online only by design')
  })

  it('is the only §43.3.x table carrying real module identifiers', () => {
    for (const row of FL_AI_BEHAVIOUR_TABLE.rows) {
      expect(row.cells[0]).toMatch(/^`MOD-FL-[AB]\d+`/)
    }
  })

  it('states the three acts that are not on the device, each with its line', () => {
    const refs = FL_AI_OVERLAY.statedAbsences.map((a) => a.sourceRef)
    expect(refs).toEqual(['L89702', 'L89706', 'L89708'])
    expect(L(89_702)).toContain('Allowed — the gate is exercised here')
    expect(L(89_706)).toContain('a Supervisor or Quality Manager may cancel with a reason')
    expect(L(89_708)).toContain('Allowed — the record of truth holds it')
  })
})

/* ==================================================================== *
 * THE TWO DERIVED PER-MODULE TABLES.
 * ==================================================================== */

const derivedTables: readonly (readonly [string, OverlayTable])[] = [
  ['Delivery Operations Hub per module', DOH_MODULE_AI_TABLE],
  ['Super Admin platform console per module', SA_MODULE_AI_TABLE],
]

describe.each(derivedTables)('%s — derived', (_name, table) => {
  it('declares itself derived and cannot omit why', () => {
    expect(table.kind).toBe('derived')
    expect(table.whyDerived).not.toBeNull()
    expect(table.whyDerived ?? '').toContain('APP-012')
    for (const row of table.rows) expect(row.kind).toBe('derived')
    expect(derivedRows(table)).toEqual(table.rows)
  })

  it('names no caption line and no header line, because a derived table has neither', () => {
    // `OverlayTable` made `whyDerived` nullable so the type could not express
    // "derived with no stated reason". These two are the same shape: L90861 is
    // required-behaviour PROSE and L91304 is an acceptance criterion, and
    // neither carries the caption or the headings the table renders. A derived
    // table's basis locator belongs in `whyDerived`, labelled a basis.
    expect(table.captionRef).toBeNull()
    expect(table.headerRef).toBeNull()
    expect(table.whyDerived ?? '').toMatch(/L\d+/)
  })

  it('does NOT claim a chapter-43 line states its rows — the line it cites is the basis', () => {
    for (const row of table.rows) {
      const line = L(lineOf(row.sourceRef))
      // The cited line must not itself be a row of a table: a derived row
      // citing a table row would be a transcription claim in disguise.
      expect(isTableRow(line)).toBe(false)
      expect(line).not.toBe('')
    }
  })

  it('carries both authored locales on every draft string, neither empty', () => {
    for (const row of table.rows) {
      const draft = (row as { readonly draft?: { readonly en: string; readonly es: string } }).draft
      expect(draft).toBeDefined()
      expect((draft?.en ?? '').length).toBeGreaterThan(0)
      expect((draft?.es ?? '').length).toBeGreaterThan(0)
      expect(draft?.en).not.toBe(draft?.es)
    }
  })
})

describe('the Hub per-module overlay', () => {
  it('covers the whole canonical inventory, by identifier, routed and not', () => {
    const canonical = [
      ...DOH_MODULES.map((m) => m.id as string),
      ...DOH_OUT_OF_SLICE_MODULES.map((m) => m.id),
    ]
    expect(DOH_MODULE_AI_ROWS.map((r) => r.moduleId)).toEqual(canonical)
  })

  it("counts L90861's appositive itself: EIGHT items, not the nine every brief said", () => {
    const line = L(90_861)
    expect(line).toContain('Manual workflow remains fully available')
    const items = (line.match(/Every Hub module — (.*?) — operates/)?.[1] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    expect(items).toEqual([
      'worker lifecycle',
      'job lifecycle and approval',
      'run scheduling',
      'assignment',
      'execution summary review',
      'permissions',
      'notifications',
      'audit and retention',
    ])
    // The floor phrases are the appositive, in the line's own order.
    expect(DOH_AI_FLOOR_PHRASES.map((p) => p.phrase)).toEqual(items)
  })

  it('states no count for the appositive, in the source or the module', () => {
    expect(L(90_861)).not.toMatch(/\bnine\b|\beight\b/)
  })

  it('marks exactly the named modules as the source-stated floor, as a LIST', () => {
    const named = DOH_MODULE_AI_ROWS.filter((r) => r.namedInSourceFloor).map((r) => r.moduleId)
    expect(named).toEqual([
      'MOD-DOH-04',
      'MOD-DOH-05',
      'MOD-DOH-06',
      'MOD-DOH-07',
      'MOD-DOH-08',
      'MOD-DOH-09',
      'MOD-DOH-10',
      'MOD-DOH-11',
    ])
    expect([...DOH_AI_FLOOR_MODULE_IDS]).toEqual(named)
    expect(DOH_AI_FLOOR_PHRASES.map((p) => p.moduleId)).toEqual(named)
  })

  it('keeps the failure-family table separate from the derived one', () => {
    expect(DOH_AI_OVERLAY.tables.map((t) => t.kind)).toEqual(['transcribed', 'derived'])
  })
})

describe('the console per-module overlay', () => {
  it('covers the whole nineteen-module console inventory by identifier', () => {
    expect(SA_MODULE_AI_ROWS.map((r) => r.moduleId)).toEqual(SA_MODULES.map((m) => m.id))
  })

  it('rests on the measured absence of MOD-SA anywhere in section 43.3.5', () => {
    expect(LINES.slice(91_214, 91_282).join('\n')).not.toContain('MOD-SA')
  })

  it('emits the SAME provenance class as the authority matrix it consumes', () => {
    expect(SA_AI_OVERLAY.provenance).toBe(CONSOLE_AUTHORITY_PROVENANCE)
  })

  it('carries no second transcription of the fifteen-row authority matrix', () => {
    const source = readFileSync('src/surfaces/sa/ai-degradation.ts', 'utf8')
    for (const control of ['Site-scoped pause', 'Runaway-loop kill switch', 'Model quarantine']) {
      expect(source).not.toContain(`'${control}'`)
    }
  })
})

/* ==================================================================== *
 * THE OBLIGATIONS, THE LOCATORS, AND THE ONE PROVENANCE CLASS.
 * ==================================================================== */

const overlays: readonly (readonly [string, SurfaceAiOverlay])[] = [
  ['SURF-DOH', DOH_AI_OVERLAY],
  ['SURF-STU', STU_AI_OVERLAY],
  ['SURF-CC', CC_AI_OVERLAY],
  ['SURF-FL', FL_AI_OVERLAY],
  ['SURF-SA', SA_AI_OVERLAY],
]

describe('every overlay', () => {
  it('exists for exactly the five surfaces, by identifier', () => {
    expect(overlays.map(([, overlay]) => overlay.surfaceId)).toEqual([
      'SURF-DOH',
      'SURF-STU',
      'SURF-CC',
      'SURF-FL',
      'SURF-SA',
    ])
  })

  it.each(overlays)('%s emits exactly one provenance class, and it is PROV-4', (_id, overlay) => {
    expect(overlay.provenance).toBe(OVERLAY_PROVENANCE)
    expect(overlay.provenance).toBe('PROV-4')
  })

  it.each(overlays)('%s cites a real line for every obligation it names', (_id, overlay) => {
    for (const obligation of overlay.obligations) {
      const line = L(lineOf(obligation.sourceRef))
      expect(line, `${obligation.id} at ${obligation.sourceRef}`).toContain(obligation.id)
    }
  })

  it.each(overlays)('%s cites a real line for every stated absence', (_id, overlay) => {
    for (const absence of overlay.statedAbsences) {
      expect(L(lineOf(absence.sourceRef))).not.toBe('')
      expect(absence.reason.length).toBeGreaterThan(0)
    }
  })

  it.each(overlays)('%s resolves its journey code through the one join', (_id, overlay) => {
    expect(['DOH', 'STU', 'CC', 'FL', 'SA']).toContain(overlay.journeyCode)
  })
})

/* ==================================================================== *
 * THE SHARED CONSTANTS, EVERY ONE AGAINST ITS LINE.
 * ==================================================================== */

describe('the shared overlay contract', () => {
  it('names both the chapter-level obligation AND the §43.3 restatement', () => {
    expect(FIVE_SURFACE_OBLIGATIONS.map((o) => o.id)).toEqual([
      'AC-43-005',
      'TEST-43-002',
      'AC-43-301',
      'AC-43-302',
      'TEST-43-301',
      'AC-42-301',
      'AC-42-303',
      'TEST-42-301',
    ])
  })

  it('reads §43.3 classification off L90847 rather than restating it', () => {
    expect(L(lineOf(FIVE_SURFACE_CLASSIFICATION.sourceRef))).toContain(
      FIVE_SURFACE_CLASSIFICATION.text.replace(/\s+/g, ' '),
    )
  })

  it('takes spine item 13 from the spine module, whose locator is L89938 not L89934', () => {
    expect(FIVE_SURFACE_SPINE_ITEM.item).toBe(13)
    expect(FIVE_SURFACE_SPINE_ITEM.locator).toBe('L89938')
    expect(L(89_938)).toContain('Five-surface behaviour')
    // The line every brief in this cluster gave is spine item 9, a different item.
    expect(L(89_934)).toContain('Human fallback')
  })

  it('takes the draft-string rule from spine item 3 at L89928', () => {
    expect(DRAFT_STRING_RULE.item).toBe(3)
    expect(DRAFT_STRING_RULE.locator).toBe('L89928')
    expect(L(89_928)).toContain('authored English and Spanish variant')
  })

  it('proves the catalogue has TWO message columns and not five', () => {
    const header = cells(L(lineOf(NO_FIVE_COLUMN_STRING_TABLE.headerRef)))
    const messageColumns = header.filter((c) => c.startsWith('Exact user-visible message'))
    expect(messageColumns).toEqual([
      'Exact user-visible message, Frontline Worker Application',
      'Exact user-visible message, tenant web surfaces',
    ])
  })

  it('confirms AC-43-356 is L91309 and that L91306 is a different criterion', () => {
    expect(L(91_309)).toContain('AC-43-356')
    expect(L(91_309)).toContain('crosses a tenant boundary')
    expect(L(91_306)).toContain('AC-43-353')
  })
})

/* ==================================================================== *
 * `AC-42-303` IS A PAUSE-VERSUS-OUTAGE RULE. THIS IS THE GATE THAT KEEPS
 * THE OTHER READING OUT OF THIS TASK'S FILES.
 * ==================================================================== */

describe('AC-42-303, read for what it says', () => {
  it('occurs on exactly one line, and that line is L89402', () => {
    const occurrences = LINES.reduce<number[]>((acc, text, index) => {
      if (index > 0 && text.includes('AC-42-303')) acc.push(index)
      return acc
    }, [])
    expect(occurrences).toEqual([89_402])
  })

  it('names PAUSE versus UNREACHABLE as its own reason, not one pause scope versus another', () => {
    expect(L(89_402)).toContain('a paused platform and an unreachable one call for different')
    expect(L(89_402)).not.toContain('paused tenant')
    // TEST-42-302 corroborates the reading in its own name.
    expect(L(89_409)).toContain('Pause-versus-outage test')
  })

  /**
   * `AC-42-303` IS A SINGLE LINE AND NOT A RANGE. The line another module cites
   * as the range's far endpoint is blank, and this asserts that WITHOUT writing
   * the locator: `tests/coverage/locator-fidelity.test.ts` lexes any `L`-number
   * in this file as a citation, and a citation onto a blank line is the very
   * thing its blank-span check exists to catch. So the endpoint is computed from
   * the last criterion in the block rather than spelled.
   */
  it('is a single line, not a range — the endpoint another module cites is blank', () => {
    const lastTest = LINES.findIndex((text) => text.includes('TEST-42-304'))
    expect(lastTest).toBeGreaterThan(0)
    expect(L(lastTest + 1)).toBe('')
    // And the criterion itself is three lines above that block's own start.
    expect(L(89_402)).toContain('AC-42-303')
  })

  it('cannot be settled from the mode matrix for the two pause SCOPES: 13 and 14 agree', () => {
    const thirteen = cells(L(89_368))
    const fourteen = cells(L(89_369))
    expect(thirteen[0]).toContain('AIMODE-13')
    expect(fourteen[0]).toContain('AIMODE-14')
    // The worker-label column is byte-identical on the two pause rows.
    expect(thirteen[2]).toBe(fourteen[2])
  })

  it('is settled instead by FAIL-AI-41/-42, and only on the tenant web column', () => {
    const platformWide = cells(L(90_513))
    const perTenant = cells(L(90_514))
    expect(platformWide[1]).toBe('Emergency pause, platform-wide')
    expect(perTenant[1]).toBe('Emergency pause, per tenant')
    // The Frontline message column is IDENTICAL, so the device cannot tell them apart.
    expect(platformWide[4]).toBe(perTenant[4])
    // The tenant web column DIFFERS, so the Command Center can.
    expect(platformWide[5]).not.toBe(perTenant[5])
    expect(perTenant[5]).toContain('for this workspace')
  })

  it("does not appear in this task's files paraphrased as a pause-scope rule", () => {
    const mine = [
      'src/ai/five-surface/overlay.ts',
      'src/ai/five-surface/surface-codes.ts',
      'src/ai/five-surface/AiDegradationOverlay.tsx',
      'src/studio/ai-degradation.ts',
      'src/surfaces/cc/ai-degradation.ts',
      'src/surfaces/doh/ai-degradation.ts',
      'src/surfaces/sa/ai-degradation.ts',
      'src/frontline/ai-degradation.ts',
    ]
    for (const path of mine) {
      const text = readFileSync(path, 'utf8')
      expect(text, path).not.toMatch(/paused tenant and a paused platform/)
      // And no file of this task's may cite the blank line another module gives
      // as the criterion block's far endpoint. Built rather than written, for
      // the same reason as above: a literal here would itself be the citation.
      const blankEndpoint = `L${String(LINES.findIndex((t) => t.includes('TEST-42-304')) + 1)}`
      expect(text, path).not.toContain(blankEndpoint)
    }
  })
})

/* ==================================================================== *
 * THE DISCLOSURES REACH A READER, AND NOTHING ASSERTS THAT THEY DO.
 *
 * DEFECT SHAPE 1: state written, never read. A record that discloses an
 * unresolved source decision, consumed by nothing, is not a disclosure — this
 * build's standing limit is that an unresolved SOURCE decision is disclosed ON
 * SCREEN with its alternatives and the build's pick labelled a client-delegated
 * choice, and a record in a module satisfies none of that.
 *
 * So every disclosure record this task declares is a member of some overlay's
 * `sourceNotes`, which the component renders unconditionally. The membership is
 * a LITERAL LIST declared here, outside the modules, so ADDING a record without
 * routing it to a screen fails by name.
 * ==================================================================== */

const DISCLOSURE_RECORDS: readonly (readonly [string, SurfaceAiOverlay, readonly string[]])[] = [
  ['DOH_EVERY_MODULE_READINGS', DOH_AI_OVERLAY, DOH_EVERY_MODULE_READINGS.map((r) => r.text)],
  ['DOH_READING_ADOPTED', DOH_AI_OVERLAY, [DOH_READING_ADOPTED.why]],
  ['DOH_MANUAL_WORKFLOW_RULE', DOH_AI_OVERLAY, [DOH_MANUAL_WORKFLOW_RULE.statement]],
  ['CC_IDENTIFIER_ATTRIBUTION', CC_AI_OVERLAY, [CC_IDENTIFIER_ATTRIBUTION.whatThisBuildSupplies]],
  ['CC_UNCANONISED_DECISIONS', CC_AI_OVERLAY, CC_UNCANONISED_DECISIONS.map((d) => d.question)],
  [
    'STU_AXIS_ATTRIBUTION',
    STU_AI_OVERLAY,
    [
      STU_AXIS_ATTRIBUTION.whatTheSourceAssigns,
      STU_AXIS_ATTRIBUTION.whyNoModuleColumnMayBeAdded,
      STU_AXIS_ATTRIBUTION.soNoGateMayReadItAsModuleCoverage,
    ],
  ],
  ['STU_UNCANONISED_DECISIONS', STU_AI_OVERLAY, STU_UNCANONISED_DECISIONS.map((d) => d.question)],
  ['SA_DERIVATION_RULE', SA_AI_OVERLAY, [SA_DERIVATION_RULE.statement]],
  [
    'SA_MATRIX_ATTRIBUTION',
    SA_AI_OVERLAY,
    [SA_MATRIX_ATTRIBUTION.whyThatReachIsNotTheSource, SA_MATRIX_CAPTION_REF],
  ],
]

const noteTextOf = (overlay: SurfaceAiOverlay): string =>
  overlay.sourceNotes
    .flatMap((note) => [
      note.heading,
      note.body,
      note.sourceRef,
      ...note.readings.flatMap((r) => [r.reading, r.text, r.sourceRef]),
      ...(note.adopted === null ? [] : [note.adopted.reading, note.adopted.why]),
    ])
    .join('\n')

describe.each(DISCLOSURE_RECORDS)('%s reaches a reader', (_name, overlay, fragments) => {
  it('is carried by its own surface overlay, where the component renders it', () => {
    const text = noteTextOf(overlay)
    for (const fragment of fragments) expect(text).toContain(fragment)
  })
})

describe('no record in this task asserts its own rendering', () => {
  it('declares no boolean claiming a disclosure happens', () => {
    for (const path of [
      'src/ai/five-surface/overlay.ts',
      'src/studio/ai-degradation.ts',
      'src/surfaces/cc/ai-degradation.ts',
      'src/surfaces/doh/ai-degradation.ts',
      'src/surfaces/sa/ai-degradation.ts',
      'src/frontline/ai-degradation.ts',
    ]) {
      const text = readFileSync(path, 'utf8')
      // A DECLARATION, not the word: a comment recording that the field was
      // removed and why is the opposite of the defect.
      expect(text, path).not.toMatch(/\bbothRender\s*:/)
    }
  })

  it('leaves no exported record of this task consumed by nothing', () => {
    // Every `export const` in the five per-surface modules, checked for a
    // reference outside its own declaration. A record read by neither a screen
    // nor a gate is defect shape 1 regardless of what its comment says.
    const modules = [
      'src/studio/ai-degradation.ts',
      'src/surfaces/cc/ai-degradation.ts',
      'src/surfaces/doh/ai-degradation.ts',
      'src/surfaces/sa/ai-degradation.ts',
      'src/frontline/ai-degradation.ts',
    ]
    const corpus = [
      ...modules,
      'src/ai/five-surface/overlay.ts',
      'src/ai/five-surface/journey-overlay.ts',
      'src/ai/five-surface/AiDegradationOverlay.tsx',
      'src/ai/five-surface/QueuedRequestSurfaceMatrix.tsx',
      'src/ai/five-surface/ShiftHandoffRoleMatrix.tsx',
      'tests/unit/ai-five-surface-overlays.test.ts',
      'tests/component/ai-degradation-overlays.test.tsx',
    ]
      .map((p) => readFileSync(p, 'utf8'))
      .join('\n')
    const orphans: string[] = []
    for (const path of modules) {
      for (const match of readFileSync(path, 'utf8').matchAll(
        /^export const ([A-Z][A-Z0-9_]+)\b/gm,
      )) {
        const name = match[1] ?? ''
        const uses = corpus.match(new RegExp(`\\b${name}\\b`, 'g'))?.length ?? 0
        if (uses < 2) orphans.push(`${path} ${name}`)
      }
    }
    expect(orphans).toEqual([])
  })
})

/* ==================================================================== *
 * BOTH JOURNEY REGISTERS, OVERLAID BY VALUE.
 *
 * The gate this replaces read the two register files as TEXT and asserted the
 * identifier appeared in them, which is satisfied by the identifier's presence
 * and cannot fail on the defect that matters: a register overlaid in data that
 * nothing renders. These assertions are over the VALUE — every step number
 * present, and every overlay matched to its step's acting surface.
 * ==================================================================== */

describe.each([
  ['the Studio register', STUDIO_AI_DEGRADATION, STUDIO_JOURNEY_STEPS],
  ['the Hub register', HUB_AI_DEGRADATION, HUB_JOURNEY_STEPS],
] as const)('%s is overlaid', (_name, degradation, steps) => {
  it('carries every step of the register, by number, in order', () => {
    expect(degradation.map((d) => d.step)).toEqual(steps.map((s) => s.number))
  })

  it('gives each step the overlay of its own acting surface', () => {
    for (const entry of degradation) {
      const step = steps.find((s) => s.number === entry.step)
      expect(step, `step ${String(entry.step)}`).toBeDefined()
      expect(entry.actingSurface).toBe(step?.actingSurface)
      expect(entry.overlay.surfaceId).toBe(
        fiveSurfaceByJourneyCode(step?.actingSurface ?? 'DOH').surfaceId,
      )
    }
  })
})

describe('the Frontline overlay, whose surface has no route directory', () => {
  it('is reached from app/ through the Hub register, which acts on FL at one step', () => {
    const fl = HUB_AI_DEGRADATION.filter((d) => d.actingSurface === 'FL')
    expect(fl.map((d) => d.step).length).toBeGreaterThan(0)
    for (const entry of fl) expect(entry.overlay).toBe(FL_AI_OVERLAY)
  })

  it('states that reachability in the module, because an abstention and an oversight look alike', () => {
    const text = readFileSync('src/frontline/ai-degradation.ts', 'utf8')
    expect(text).toContain('REACHABILITY, STATED')
  })
})

/* ==================================================================== *
 * NO STRING THESE OVERLAYS RENDER IS BLANK.
 *
 * `whyDerived` is typed `string | null` and REQUIRED non-null on a derived
 * table, and its comment used to call that "the type cannot express derived
 * with no stated reason". It cannot express `null`; it expresses `''` fine —
 * requiring a field is not requiring its content, which is the same claim
 * `src/ui/shared/journey.ts` carried about its own required `reason: string`
 * and had corrected. So the blank is closed here, over EVERY string these five
 * overlays put on a screen, rather than asserted in a comment.
 *
 * A blank reason is never faithful to the source: across L92596-L95408 the
 * thirty five-surface reaction tables carry 150 reaction cells and ZERO blank.
 * ==================================================================== */

describe.each(overlays)('%s renders no blank string', (_name, overlay) => {
  const stringsOf = (o: SurfaceAiOverlay): readonly (readonly [string, string])[] => [
    ...o.tables.flatMap((table) => [
      ['caption', table.caption] as const,
      ...(table.whyDerived === null ? [] : [['whyDerived', table.whyDerived] as const]),
      ...table.headings.map((h) => ['heading', h] as const),
      ...table.rows.flatMap((row) => [
        ['sourceRef', row.sourceRef] as const,
        ...row.cells.map((c) => ['cell', c] as const),
        ...row.readings.flatMap((r) => [
          ['reading.asHeaded', r.asHeaded] as const,
          ['reading.alsoReads', r.alsoReads] as const,
          ['reading.sourceRef', r.sourceRef] as const,
        ]),
      ]),
    ]),
    ...o.obligations.flatMap((ob) => [
      ['obligation.id', ob.id] as const,
      ['obligation.sourceRef', ob.sourceRef] as const,
      ['obligation.text', ob.text] as const,
      ...(ob.withheld === null ? [] : [['obligation.withheld', ob.withheld] as const]),
    ]),
    ...o.statedAbsences.flatMap((a) => [
      ['absence.what', a.what] as const,
      ['absence.reason', a.reason] as const,
      ['absence.sourceRef', a.sourceRef] as const,
    ]),
    ...o.sourceNotes.flatMap((n) => [
      ['note.heading', n.heading] as const,
      ['note.body', n.body] as const,
      ['note.sourceRef', n.sourceRef] as const,
      ...n.readings.flatMap((r) => [
        ['note.reading.reading', r.reading] as const,
        ['note.reading.text', r.text] as const,
        ['note.reading.sourceRef', r.sourceRef] as const,
      ]),
      ...(n.adopted === null
        ? []
        : [
            ['note.adopted.reading', n.adopted.reading] as const,
            ['note.adopted.why', n.adopted.why] as const,
          ]),
    ]),
  ]

  it('carries no empty or whitespace-only value in any field it puts on a screen', () => {
    const blank = stringsOf(overlay)
      .filter(([, value]) => value.trim().length === 0)
      .map(([field]) => field)
    expect(blank).toEqual([])
  })
})

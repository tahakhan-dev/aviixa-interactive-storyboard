import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { ownProbeDir, withPlanted } from '../probe-paths'

import {
  ENUMERATED_ARTEFACTS,
  ENUMERATION_LINE,
  ARTEFACT_COUNT_CONTRADICTION,
} from '@/honesty/artefacts'

import {
  FALLBACK_LADDER,
  DECLARED_LADDER_ATTRIBUTE_COUNT,
  LEVEL_2_EXTRA_ATTRIBUTE,
} from '@/fallbacks/ladder'
import {
  FALLBACK_TEMPLATE_FIELDS,
  DECLARED_TEMPLATE_FIELD_COUNT,
  RENDERED_ROW_COUNT,
  RENDERED_ROWS,
  TEMPLATE_FIELD_ROW,
  COLLAPSED_FIELD_PAIRS,
  CLASS_DIAGRAM_FIELDS,
} from '@/fallbacks/template'
import { FALLBACK_FAMILIES, FALLBACK_CONTRACTS } from '@/fallbacks/contracts'
import { FALLBACK_LOCAL_DISCLOSURES } from '@/fallbacks/disclosure'

import {
  OFFLINE_CAPABILITY_CLASSES,
  OFFLINE_CLASSIFICATION,
  ROWS_OUTSIDE_THE_SEVEN,
  OFFLINE_CLASS_CONTRADICTION,
  isOneOfTheSeven,
} from '@/offline/capability'
import {
  A7_FUNCTIONALITIES_THE_REGISTER_DOES_NOT_CLASSIFY,
  A7_UNCLASSIFIED_FUNCTIONALITY,
  A7_ROWS_UNDER_AC_OFF_702,
} from '@/frontline/modules/fl-a7/offline'

import { CONVERGENCE_COLUMNS, CONVERGENCE_OBLIGATIONS } from '@/offline/convergence'
import {
  DEC_37B_TABLE,
  DEC_37B_OPEN_COUNT_READINGS,
  DEC_37B_HOLD_STATE_IS_NOT_OURS,
} from '@/offline/decisions-37b'
import { CONFLICT_AUTHORITY, DEC_FB_008_DISCLOSURE } from '@/offline/conflict'
import {
  OFFLINE_BLOCKERS,
  FAMILY_COUNT_READINGS,
  FAMILY_CRITERION_PREFIX,
  AUTHORIZATION_RULES,
  AUTHORIZATION_RULES_CLAIM_LINE,
  OFFLINE_AUTHORIZATION_LIMITS,
  AUTHORIZATION_LIMIT_LOCATORS,
  REGISTER_SELF_CLAIMS,
  UNRECOVERABLE_DATA_BLOCKER,
  type BlockerFamily,
} from '@/offline/blockers'
import {
  PROTOCOL_STEPS,
  PROTOCOL_PHASES,
  COMMAND_MANIFEST_READ_STEP,
  CAPTURE_UPLOAD_STEP,
} from '@/offline/protocol'
import { ENVELOPE_STEP_ANACHRONISM, QUARANTINE_REGISTER } from '@/offline/quarantine'
import {
  MANIFEST_FIELD_COUNTS,
  FIELDS_ONLY_IN_CHAPTER_33,
  PROPOSED_MANIFEST_FIELDS,
} from '@/offline/package/manifest'
import { FAILURE_TABLE, FAILURE_TABLE_SHAPE } from '@/offline/package/integrity'
import { LIFECYCLE_COUNTS, STAGE_AUTHORITY_MATRIX } from '@/offline/package/lifecycle'
import {
  STORAGE_FULL_OPTION_SET_DIVERGENCE,
  DEC_STORE_001_SHIPPED_RECORDS,
} from '@/offline/package/storage'

import {
  OFFLINE_USE_CASES_A_D,
  USE_CASE_GROUPS,
  GROUP_HEADING_COUNTS,
  CATALOGUE_TOTAL,
  DIAGRAM_BLOCK_CENSUS,
  PERMISSION_STATUSES,
  permissionStatusesIn,
} from '@/offline/use-cases/group-a-d/catalogue'
import { OFFLINE_USE_CASES_E_G, GROUP_COUNTS } from '@/offline/use-cases/group-e-g/catalogue'

import { CC10_MATRIX, CC10_COLUMNS } from '@/surfaces/cc/modules/cc-10/matrix'
import {
  S366_ROWS,
  S366_COLUMNS,
  S366_MATRIX_SHAPE,
  S366_DIVERGENCES,
} from '@/surfaces/cc/modules/cc-10-s366/matrix'

/* ==================================================================== *
 * SLICE 8 GATES — offline, package, reconnect, command, conflict,
 * convergence.
 *
 * Twenty build tasks land before this file. What it holds is the set of
 * rulings the slice produced that no single module owns: the counts the
 * source states against itself, the readings it refuses to choose between,
 * and the two places where a later edit could quietly make a contradiction
 * go away.
 *
 * EVERY NUMBER HERE IS PARSED OUT OF THE FROZEN SOURCE AT RUN TIME. Not one
 * is restated from a comment, and not one is inferred from a span. Nine of
 * this slice's twenty-two controller brief errors were counts, and every one
 * came from reading a span notation — `L79579-L79591` says where a table is,
 * not how many rows it has, and the difference is the header, the separator,
 * and wherever the body actually stops. `tableBody` below refuses to guess:
 * it walks until the rows stop and asserts the line after the body is not a
 * table row.
 *
 * TWO READING DISCIPLINES THIS SLICE PAID FOR, both encoded here rather than
 * remembered:
 *
 *   - NEVER TRUNCATE A LINE TO CHECK IT. This source has lines carrying eight
 *     sentences and over a thousand characters; the absolute-exclusion claim
 *     is the eighth sentence of its line. A `cut -c1-200` check reported a
 *     real finding as unsupported and the agent was right. `line()` returns
 *     the whole line, always.
 *   - COUNT THE ROWS, NEVER INFER FROM A SPAN. See above.
 *
 * THE VACUITY CATALOGUE THIS FILE WAS WRITTEN AGAINST. Fifteen gates in slice
 * 7 could not fail when first written, and slice 8 added more:
 *
 *   - a `toEqual([...MY_CONSTANT])` tautology;
 *   - `Allowed` being a PREFIX of `Allowed with conditions`;
 *   - a table-shape check satisfied by the SEPARATOR row, which splits into
 *     the right number of non-empty cells;
 *   - a position check true of BOTH the defect and its fix;
 *   - a COUNT check true of both the defect and the fix, because two
 *     categories happened to have the same number of rows;
 *   - a locator check satisfied by a status token 36 of 45 cells carry, so
 *     moving the locator one row left it green;
 *   - a row-count gate proved by a defect that RENAMED a row instead of
 *     deleting one, leaving the length unchanged;
 *   - a classifier plant that was accidentally correct because `Object.keys`
 *     preserved insertion order;
 *   - a pointer that could point at ITSELF;
 *   - a gate whose failure message asserted more than its predicate tested,
 *     and convicted an innocent module;
 *   - TWO GUARDS THAT EACH HID THE OTHER: redundant protections against one
 *     defect cannot be verified one at a time. Gate 12 plants each and both.
 *
 * FREEZE ASSERTIONS ARE NAMED, NOT LEFT FOR A READER TO DISCOVER. A handful
 * of claims here read ONLY the frozen source — that §38's coordination table
 * calls itself nine-column and carries eleven, that "six" occurs nowhere in
 * §37.1, that §35.6 never writes "fifteen". Their subject is read-only input,
 * so the only thing that can turn them red is the source drifting, which is
 * what they are for; the sha256 asserted below is what makes them meaningful.
 * Every assertion whose subject this build can change was watched go red on a
 * real plant into a real shipping file, and the file restored byte-identically.
 * ==================================================================== */

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const SOURCE_BYTES = readFileSync(SOURCE)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
const SOURCE_LINES = SOURCE_TEXT.split('\n')

const OWN_PROBE_DIR = ownProbeDir()

/** One WHOLE line of the frozen source, 1-indexed, or a throw. Never a slice. */
function line(n: number): string {
  const text = SOURCE_LINES[n - 1]
  if (text === undefined) throw new Error(`the frozen source has no line ${n}`)
  return text
}

/**
 * Split a markdown table row into its fields, preserving empties.
 *
 * A field that is only dashes is refused. `|---|---|---|` splits into the
 * right number of non-empty fields and satisfied a slice-7 table-shape gate
 * with its first data line moved onto the separator.
 */
function cellsOf(n: number): readonly string[] {
  const raw = line(n)
  if (!raw.startsWith('|') || !raw.trimEnd().endsWith('|')) {
    throw new Error(`L${n} is not a markdown table row: ${JSON.stringify(raw.slice(0, 60))}`)
  }
  const fields = raw
    .trimEnd()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((f) => f.trim())
  if (fields.every((f) => /^:?-{2,}:?$/.test(f))) {
    throw new Error(`L${n} is a separator row, not a data row`)
  }
  return fields
}

/**
 * The data lines of the table whose header row is `headerLine`, COUNTED.
 *
 * Asserts the shape rather than trusting it: the line after the header is a
 * separator, the body is non-empty, and the line after the body is NOT a
 * table row — which is what stops a body from being reported one row short
 * or one row long because a span said where it was.
 */
function tableBody(headerLine: number): readonly number[] {
  const separator = line(headerLine + 1)
  expect(
    /^\|(\s*:?-{3,}:?\s*\|)+$/.test(separator.trimEnd()),
    `L${headerLine + 1} is not the separator under the header at L${headerLine}`,
  ).toBe(true)
  const rows: number[] = []
  let n = headerLine + 2
  while (n <= SOURCE_LINE_COUNT && line(n).startsWith('|')) {
    rows.push(n)
    n += 1
  }
  expect(rows.length, `no data rows under the header at L${headerLine}`).toBeGreaterThan(0)
  expect(
    line(rows[rows.length - 1]! + 1).startsWith('|'),
    `the body under L${headerLine} does not stop where this walk says it does`,
  ).toBe(false)
  return rows
}

/** Curly quotation marks folded to ASCII. A typographic difference, not a claim. */
const flat = (s: string): string => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

/** The status token a source cell OPENS with, backticks and qualifiers removed. */
const openingToken = (field: string): string => {
  const quoted = /^`([^`]*)`/.exec(field)
  const inner = quoted === null ? field : quoted[1]!
  return inner.split('—')[0]!.trim()
}

/** How many times a word occurs, word-anchored and case-insensitively, in a span. */
function wordCount(word: string, from: number, to: number): number {
  const pattern = new RegExp(`\\b${word}\\b`, 'gi')
  let total = 0
  for (let n = from; n <= to; n += 1) total += line(n).match(pattern)?.length ?? 0
  return total
}

const readSource = (relative: string): string => readFileSync(join(ROOT, relative), 'utf8')

/* ==================================================================== *
 * THE FROZEN SOURCE THESE GATES READ.
 * ==================================================================== */

describe('slice 8 gates: the frozen source these gates read', () => {
  it('is the sha256 and the line count this slice was built against', () => {
    expect(existsSync(SOURCE), `the frozen source is not at ${SOURCE}`).toBe(true)
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    // The file ends in a newline, so the split's last member is the empty tail
    // rather than a line.
    expect(SOURCE_LINES[SOURCE_LINES.length - 1]).toBe('')
    expect(SOURCE_LINES.length - 1).toBe(SOURCE_LINE_COUNT)
  })

  it('the row walker stops where the body stops, and refuses a separator as data', () => {
    // Both halves of the walker are exercised on this run rather than trusted:
    // the fallback template table's body, and the separator refusal that a
    // slice-7 gate was beaten by.
    expect(tableBody(82_313).length).toBe(26)
    expect(() => cellsOf(82_314)).toThrow(/separator row/)
    expect(() => tableBody(82_314)).toThrow()
  })
})

/* ==================================================================== *
 * GATE 1 — `AC-OFF-701` FAILS IN BOTH DIRECTIONS, AND THE TWO HALVES ARE
 * INDEPENDENT.
 *
 * A single gate on "the criterion does not hold" passes on either half and
 * hides the other, so the two are asserted as separate cases with separate
 * evidence: a register row classified outside the seven, and a Frontline
 * function classified by no register row at all.
 * ==================================================================== */

const CLASS_TABLE_HEADER = 78_721
const REGISTER_HEADER = 78_766

describe('slice 8 gate 1: AC-OFF-701 is unsatisfiable in two independent directions', () => {
  const classRows = tableBody(CLASS_TABLE_HEADER)
  const registerRows = tableBody(REGISTER_HEADER)

  it('the criterion says what this gate says it says', () => {
    const cells = cellsOf(78_831)
    expect(cells[0]).toBe('`AC-OFF-701`')
    expect(cells[1]).toBe(
      'Every Frontline function carries exactly one of the seven classes, and no function is unclassified.',
    )
  })

  it('the source declares seven classes and the tree transcribes those seven', () => {
    expect(classRows.length).toBe(7)
    expect(cellsOf(CLASS_TABLE_HEADER)).toEqual(['Class', 'Meaning', 'Governing consequence'])
    expect(OFFLINE_CAPABILITY_CLASSES.map((c) => c.className)).toEqual(
      classRows.map((n) => cellsOf(n)[0]),
    )
  })

  it('the register is fifty-two rows, counted, and every cell is the source’s own', () => {
    expect(registerRows.length).toBe(52)
    expect(OFFLINE_CLASSIFICATION.length).toBe(registerRows.length)
    for (const [i, n] of registerRows.entries()) {
      const source = cellsOf(n)
      const row = OFFLINE_CLASSIFICATION[i]!
      expect(flat(row.fn), `register row ${i + 1} function cell`).toBe(flat(source[0]!))
      expect(flat(row.module), `register row ${i + 1} module cell`).toBe(flat(source[1]!))
      expect(flat(row.klass), `register row ${i + 1} class cell`).toBe(flat(source[2]!))
      expect(flat(row.reason), `register row ${i + 1} reason cell`).toBe(flat(source[3]!))
    }
  })

  it('HALF ONE: one of the fifty-two rows carries a token outside the seven', () => {
    const declared = new Set(classRows.map((n) => cellsOf(n)[0]!))
    const outside = registerRows.filter((n) => !declared.has(cellsOf(n)[2]!))
    expect(outside).toEqual([78_799])
    expect(cellsOf(78_799)[2]).toBe('Explicitly prohibited on the device')
    // The tree reaches the same row from its own transcription.
    expect(ROWS_OUTSIDE_THE_SEVEN.map((r) => r.klass)).toEqual([
      'Explicitly prohibited on the device',
    ])
    expect(ROWS_OUTSIDE_THE_SEVEN.map((r) => r.fn)).toEqual([cellsOf(78_799)[0]])
    expect(isOneOfTheSeven('Explicitly prohibited on the device')).toBe(false)
  })

  it('and the eight tokens sum to fifty-two, so no row is uncounted either way', () => {
    const tally = new Map<string, number>()
    for (const n of registerRows) {
      const token = cellsOf(n)[2]!
      tally.set(token, (tally.get(token) ?? 0) + 1)
    }
    expect(tally.size, 'the register uses eight distinct class tokens').toBe(8)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(52)
    expect(tally.get('Explicitly prohibited on the device')).toBe(1)
  })

  it('HALF TWO: FUNC-A7-04-1-1 is named by no Function cell in any of the fifty-two', () => {
    // Measured over the register's own first column, which is its key.
    const functions = registerRows.map((n) => cellsOf(n)[0]!)
    for (const phrase of ['minimal', 'blast radius', 'data scope', 'FUNC-A7-04']) {
      expect(
        functions.filter((f) => f.toLowerCase().includes(phrase.toLowerCase())),
        `a register Function cell names ${phrase}`,
      ).toEqual([])
    }
    expect(A7_FUNCTIONALITIES_THE_REGISTER_DOES_NOT_CLASSIFY).toEqual(['FUNC-A7-04-1-1'])
  })

  it('and the functionality states its own offline position, which is the second reading', () => {
    expect(line(41_376)).toContain('`FUNC-A7-04-1-1`')
    expect(line(41_376)).toContain('Online and offline: identical.')
    expect(A7_UNCLASSIFIED_FUNCTIONALITY.readings.map((r) => r.locator)).toContain('L41376')
  })

  it('neither half is adopted, and the reading type has nowhere to adopt one', () => {
    expect(OFFLINE_CLASS_CONTRADICTION.adopted).toBeNull()
    expect(A7_UNCLASSIFIED_FUNCTIONALITY.adopted).toBeNull()
    for (const reading of [
      ...OFFLINE_CLASS_CONTRADICTION.readings,
      ...A7_UNCLASSIFIED_FUNCTIONALITY.readings,
    ]) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
  })
})

/* ==================================================================== *
 * GATE 2 — `AC-OFF-702` IS RECORDED AND NOT ENFORCED.
 *
 * A storyboard has no execution path to inspect, so a gate asserting the
 * criterion is ENFORCED would be asserting something this build cannot do.
 * What is gated is that the code says so.
 * ==================================================================== */

describe('slice 8 gate 2: AC-OFF-702 is recorded, and the tree says it is not enforced', () => {
  it('the criterion is the source’s, verbatim, at the row that carries it', () => {
    const cells = cellsOf(78_832)
    expect(cells[0]).toBe('`AC-OFF-702`')
    expect(cells[1]).toBe(
      'No function classified fully available offline makes any network call on its execution path.',
    )
  })

  it('it governs the Fully available offline rows, derived from the register not listed', () => {
    for (const row of A7_ROWS_UNDER_AC_OFF_702) expect(row.klass).toBe('Fully available offline')
    expect(A7_ROWS_UNDER_AC_OFF_702.length).toBeGreaterThan(0)
  })

  it('the module that carries those rows states neither criterion is asserted as met', () => {
    // The deliverable here is the disclaimer, not an enforcement check. A
    // storyboard has no execution path, so a gate asserting the criterion HOLDS
    // would be asserting something this build cannot establish — and would pass
    // for exactly as long as nobody looked.
    const text = readSource('src/frontline/modules/fl-a7/offline.ts')
    // Comment wrapping is normalised away: the claim is the sentence, and a
    // gate that read it only when it happened to fit on one line would be
    // green on a re-wrap that deleted it.
    const prose = text.replace(/\n\s*\*/g, ' ').replace(/\s+/g, ' ')
    expect(prose).toContain('`AC-OFF-702` (L78832)')
    expect(prose).toContain('Neither is asserted here as met')
  })

  it('and nothing in the tree claims AC-OFF-702 is enforced, satisfied or met', () => {
    // The sweep is over the modules that name the criterion at all, found
    // rather than listed, so a later module claiming enforcement is caught
    // wherever it is written.
    const files = [
      'src/frontline/modules/fl-a7/offline.ts',
      'src/offline/capability.ts',
      'src/offline/state-contract.ts',
    ].filter((f) => existsSync(join(ROOT, f)) && readSource(f).includes('AC-OFF-702'))
    expect(files.length, 'no shipping module names AC-OFF-702 at all').toBeGreaterThan(0)
    for (const file of files) {
      const text = readSource(file)
      for (const claim of ['is enforced', 'is satisfied', 'is met', 'holds here']) {
        expect(
          new RegExp(`AC-OFF-702[^.]{0,240}\\b${claim}\\b`).test(text),
          `${file} claims AC-OFF-702 ${claim}`,
        ).toBe(false)
      }
    }
  })
})

/* ==================================================================== *
 * GATE 3 — THE COUNTS THE SOURCE STATES AGAINST ITSELF.
 *
 * Every figure below is parsed. None is smoothed and none is chosen.
 * ==================================================================== */

describe('slice 8 gate 3: the counts that do not reconcile, each measured from the source', () => {
  it('offline artefacts: the rule enumerates twenty-one and four statements call it twenty-two', () => {
    const enumeration = line(ENUMERATION_LINE)
    const list = enumeration.slice(enumeration.indexOf('any of the following:') + 'any of the following:'.length)
    const items = list
      .split(/\.\s/)[0]!
      .split(';')
      .map((s) => s.trim().replace(/^or\s+/, ''))
      .filter((s) => s.length > 0)
    expect(items.length, 'L78386 enumerates twenty-one artefacts').toBe(21)
    expect(ENUMERATED_ARTEFACTS.length).toBe(items.length)
    // Item by item, not merely the total. Two lists of the same length can be
    // two different lists.
    expect([...ENUMERATED_ARTEFACTS]).toEqual(items)

    expect(ARTEFACT_COUNT_CONTRADICTION.counted.count).toBe(21)
    expect(ARTEFACT_COUNT_CONTRADICTION.claimed.length).toBe(4)
    for (const claim of ARTEFACT_COUNT_CONTRADICTION.claimed) {
      expect(claim.count, `${claim.blueprintLine} is a twenty-two claim`).toBe(22)
      expect(
        flat(line(claim.blueprintLine)),
        `the words this build attributes to L${claim.blueprintLine} are not there`,
      ).toContain(flat(claim.words))
    }
  })

  it('and no export settles the artefact count, so a caller has to pick in its own code', () => {
    const text = readSource('src/honesty/artefacts.ts')
    expect(/export const ARTEFACT_COUNT\b/.test(text)).toBe(false)
  })

  it('ladder attributes: seven rungs carry thirteen and Level 2 carries fourteen', () => {
    expect(line(82_067)).toContain('Each level below carries the thirteen attributes')
    expect(DECLARED_LADDER_ATTRIBUTE_COUNT).toBe(13)
    expect(FALLBACK_LADDER.length).toBe(8)

    const measured = FALLBACK_LADDER.map((rung) => {
      expect(line(rung.headingLine), `Level ${rung.level} heading`).toBe(rung.heading)
      const body = tableBody(rung.headerLine)
      expect(cellsOf(rung.headerLine)).toEqual(['Attribute', 'Specification'])
      return { level: rung.level, rows: body }
    })
    expect(measured.map((m) => m.rows.length)).toEqual([13, 13, 14, 13, 13, 13, 13, 13])

    const fourteens = measured.filter((m) => m.rows.length !== DECLARED_LADDER_ATTRIBUTE_COUNT)
    expect(fourteens.map((m) => m.level)).toEqual([2])

    // The extra is named by its own cell, not by its position: a row-count gate
    // proved by a defect that RENAMED a row rather than deleting one leaves the
    // length unchanged, which is a shape this build has already been bitten by.
    const levelTwo = fourteens[0]!.rows
    expect(cellsOf(levelTwo[levelTwo.length - 1]!)[0]).toBe(LEVEL_2_EXTRA_ATTRIBUTE)
    for (const other of measured.filter((m) => m.level !== 2)) {
      expect(
        other.rows.map((n) => cellsOf(n)[0]),
        `Level ${other.level} names the Level 2 extra`,
      ).not.toContain(LEVEL_2_EXTRA_ATTRIBUTE)
    }
  })

  it('and every one of the ladder’s transcribed rows is its own line, both cells', () => {
    let rows = 0
    for (const rung of FALLBACK_LADDER) {
      for (const attribute of rung.attributes) {
        const source = cellsOf(attribute.line)
        expect(flat(attribute.attribute), `L${attribute.line} attribute cell`).toBe(flat(source[0]!))
        expect(flat(attribute.specification), `L${attribute.line} specification cell`).toBe(
          flat(source[1]!),
        )
        rows += 1
      }
    }
    expect(rows, 'seven rungs of thirteen and one of fourteen').toBe(7 * 13 + 14)
  })

  it('fallback template fields: twenty-six declared, twenty-four rendered, twenty-seven drawn', () => {
    const templateRows = tableBody(82_313)
    expect(templateRows.length).toBe(26)
    expect(DECLARED_TEMPLATE_FIELD_COUNT).toBe(26)
    expect(FALLBACK_TEMPLATE_FIELDS.length).toBe(26)
    for (const [i, n] of templateRows.entries()) {
      const source = cellsOf(n)
      const field = FALLBACK_TEMPLATE_FIELDS[i]!
      expect(Number(source[0]), `L${n} number cell`).toBe(field.number)
      expect(flat(field.field), `L${n} field cell`).toBe(flat(source[1]!))
      expect(field.line).toBe(n)
    }

    // The source reconciles twenty-six with twenty-four ITSELF, in one sentence,
    // and names the twenty-four in order. Counted from its own semicolons.
    const reconciliation = line(82_431)
    expect(reconciliation).toContain(
      'Every contract below is rendered as a twenty-four-row table covering the twenty-six template fields',
    )
    const rendered = reconciliation
      .slice(reconciliation.indexOf('template fields:') + 'template fields:'.length)
      .replace(/\.$/, '')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    expect(rendered.length).toBe(24)
    expect(RENDERED_ROW_COUNT).toBe(24)
    expect(RENDERED_ROWS.length).toBe(24)

    // The 26-to-24 difference is two collapses and nothing else.
    const targets = new Set(Object.values(TEMPLATE_FIELD_ROW))
    expect(targets.size).toBe(24)
    expect(Object.keys(TEMPLATE_FIELD_ROW).length).toBe(26)
    expect(COLLAPSED_FIELD_PAIRS.length).toBe(2)
    for (const pair of COLLAPSED_FIELD_PAIRS) {
      for (const field of pair.fields) expect(TEMPLATE_FIELD_ROW[field]).toBe(pair.row)
    }
  })

  it('and the class diagram draws twenty-eight members, of which twenty-seven are fields', () => {
    // Counted by matching the diagram's own member lines, NOT by the span's
    // length: `identifier` is the class key and is not a template field, which
    // is the whole reason the third reading is twenty-seven and not twenty-eight.
    const members: string[] = []
    for (let n = 82_260; n <= 82_289; n += 1) {
      const trimmed = line(n).trim()
      if (trimmed.startsWith('+')) members.push(trimmed.slice(1))
    }
    expect(members.length).toBe(28)
    expect(members[0]).toBe('identifier')
    expect(members.slice(1)).toEqual([...CLASS_DIAGRAM_FIELDS])
    expect(CLASS_DIAGRAM_FIELDS.length).toBe(27)
  })

  it('convergence: the §38 table calls itself nine-column and carries eleven over fourteen rows', () => {
    // FREEZE. Nothing in this tree transcribes §38's coordination table, so
    // both ends of this comparison are the frozen source. It is here because
    // the contradiction is the slice's, and because both controller briefs put
    // the nine-column claim at a line that carries a narrative step instead.
    expect(line(85_155)).toBe(
      '**The nine-column coordination table.** Every cell carries an explicit status.',
    )
    expect(flat(line(85_119))).toContain(
      flat('The nine-column table below states each surface’s position per failure'),
    )
    expect(cellsOf(85_198)[1]).toBe(
      'Every cell of the nine-column coordination table carries an explicit status.',
    )
    const header = cellsOf(85_157)
    expect(header.length, 'the table the sentence above calls nine-column').toBe(11)
    expect(tableBody(85_157).length).toBe(14)

    // And the line both briefs cited carries a narrative step, not a count.
    expect(line(85_123)).toBe('1. The failure is detected at its own detection point.')
    expect(line(85_123)).not.toContain('nine')
  })

  it('and §36.7’s obligation table — the one this tree DOES transcribe — is four by five', () => {
    const header = cellsOf(80_668)
    expect(header.length).toBe(4)
    expect(header).toEqual([...CONVERGENCE_COLUMNS])
    const body = tableBody(80_668)
    expect(body.length).toBe(5)
    expect(CONVERGENCE_OBLIGATIONS.length).toBe(5)
    for (const [i, n] of body.entries()) {
      const source = cellsOf(n)
      const row = CONVERGENCE_OBLIGATIONS[i]!
      expect(row.line).toBe(n)
      for (const [c, column] of CONVERGENCE_COLUMNS.entries()) {
        expect(flat(row.cells[column]), `L${n} column ${column}`).toBe(flat(source[c]!))
      }
    }
  })

  it('§37B: eight rows are listed, one is exempted by name, and both readings are carried', () => {
    const body = tableBody(81_730)
    expect(body.length).toBe(8)
    expect(DEC_37B_TABLE.length).toBe(8)
    expect(DEC_37B_TABLE.map((r) => r.line)).toEqual([...body])

    expect(line(81_728)).toContain(
      'Every item below is `Client Decision Required`, with one exception: `DEC-SYNC-001` now carries an adopted working position',
    )
    expect(cellsOf(81_732)[0]).toBe('`DEC-SYNC-001`')
    expect(cellsOf(81_732)[3]).toContain('**Adopted, not open.**')
    expect(line(81_761)).toContain('eight open decisions and thirteen preserved contradictions')
    expect(line(81_763)).toContain('Every item in the table is `Client Decision Required`')

    // Seven of the eight rows are owed; the exemption is what makes it seven.
    const stillOpen = body.filter((n) => !cellsOf(n)[3]!.includes('Adopted, not open'))
    expect(stillOpen.length).toBe(7)

    expect(DEC_37B_OPEN_COUNT_READINGS.length).toBe(2)
    for (const reading of DEC_37B_OPEN_COUNT_READINGS) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
    expect(DEC_37B_OPEN_COUNT_READINGS[0]!.text).toContain('EIGHT')
    expect(DEC_37B_OPEN_COUNT_READINGS[1]!.text).toContain('SEVEN')
  })

  it('package manifest: twenty-four enumerated, twenty-one summarised, twenty-two proposed', () => {
    // Counted by matching §33.4's own bolded field headings and subtracting the
    // six group headings it also bolds — a heading scan, not a span scan.
    const headings: { line: number; text: string }[] = []
    for (let n = 77_524; n <= 77_583; n += 1) {
      const m = /^\*\*([^*]+)\*\*/.exec(line(n))
      if (m !== null) headings.push({ line: n, text: m[1]!.replace(/\.$/, '') })
    }
    const groups = headings.filter((h) => /\bfields$/.test(h.text))
    expect(groups.length, '§33.4 groups its fields under six bolded headings').toBe(6)
    const fields = headings.filter((h) => !/\bfields$/.test(h.text))
    expect(fields.length).toBe(24)

    const summary = tableBody(77_609)
    expect(summary.length).toBe(21)

    const proposed = tableBody(79_259)
    expect(proposed.length).toBe(22)
    expect(PROPOSED_MANIFEST_FIELDS.length).toBe(22)

    expect(MANIFEST_FIELD_COUNTS.map((c) => c.counted)).toEqual([24, 22, 21])

    // The two §33.4 fields §35.3 does not carry are named at the lines §33.4
    // states them, and both are enforcement fields rather than hygiene.
    expect(FIELDS_ONLY_IN_CHAPTER_33.length).toBe(2)
    const fieldLines = new Set(fields.map((f) => f.line))
    const proposedText = proposed.map((n) => flat(cellsOf(n)[0]!))
    for (const dropped of FIELDS_ONLY_IN_CHAPTER_33) {
      expect(fieldLines.has(dropped.line), `L${dropped.line} is not a §33.4 field heading`).toBe(
        true,
      )
      expect(flat(line(dropped.line))).toContain(flat(`**${dropped.heading}.**`))
      expect(proposedText, `${dropped.heading} is in §35.3 after all`).not.toContain(
        flat(dropped.heading),
      )
    }
  })

  it('integrity failure table: eleven rows and six columns, and no fifteen anywhere in §35.6', () => {
    expect(cellsOf(FAILURE_TABLE_SHAPE.headerLine).length).toBe(FAILURE_TABLE_SHAPE.columns)
    const body = tableBody(FAILURE_TABLE_SHAPE.headerLine)
    expect(body.length).toBe(11)
    expect(body[0]).toBe(FAILURE_TABLE_SHAPE.firstDataLine)
    expect(body[body.length - 1]).toBe(FAILURE_TABLE_SHAPE.lastDataLine)
    expect(FAILURE_TABLE.length).toBe(11)
    expect(FAILURE_TABLE.map((r) => r.line)).toEqual([...body])

    // FREEZE. The controller's "fifteen" had no basis in the section at all.
    expect(wordCount('fifteen', 79_512, 79_615)).toBe(0)
    expect(wordCount('eleven', 79_512, 79_615)).toBe(0)
  })

  it('§35.1 describes one machine four times, and only the first pair reconciles', () => {
    expect(line(79_047)).toContain('Naming twenty-one lifecycle stages')

    // Twenty-one, counted from the prose's own italicised stage names. The
    // twentieth and twenty-first share a sentence — `*Corruption handling* and
    // *incompatible-version handling*` — which is exactly where a scan that
    // assumed one stage per sentence would report twenty.
    const prose = line(79_049)
    const stages = [...prose.slice(prose.indexOf('**', 2) + 2).matchAll(/\*([^*]+)\*/g)].map(
      (m) => m[1]!,
    )
    expect(stages.length).toBe(21)

    const steps = Array.from({ length: 30 }, (_, i) => 79_050 + i).filter((n) =>
      /^\d+\. /.test(line(n)),
    )
    expect(steps.length).toBe(16)

    const states = Array.from({ length: 25 }, (_, i) => 79_070 + i).filter((n) =>
      /^\s+\w+ : /.test(line(n)),
    )
    expect(states.length).toBe(18)

    const authority = tableBody(79_124)
    expect(authority.length).toBe(13)
    expect(STAGE_AUTHORITY_MATRIX.length).toBe(13)
    expect(STAGE_AUTHORITY_MATRIX.map((r) => r.line)).toEqual([...authority])

    expect(LIFECYCLE_COUNTS.map((c) => c.counted)).toEqual([21, 18, 16, 13])

    // 21 to 18 reconciles in the source's own words: signing folds into the
    // Manifested state, and rollback and reconciliation are drawn nowhere.
    expect(line(79_078)).toContain('manifest created and signed')
    const drawn = states.map((n) => line(n).trim().split(' : ')[0]!)
    for (const undrawn of ['Rollback', 'Reconciliation', 'Signing']) {
      expect(drawn, `${undrawn} is drawn as its own state`).not.toContain(undrawn)
    }
    expect(21 - 1 - 2).toBe(18)

    // The other two join the stages on different seams and are NOT reconciled.
    const stageNames = new Set(stages)
    const authorityStages = authority.map((n) => cellsOf(n)[0]!)
    const joined = authorityStages.filter((s) => stageNames.has(s))
    expect(joined.length, 'the authority matrix joins the stages on its own seams').toBeLessThan(13)
    expect(authorityStages).toContain('Manifest creation and signing')
    expect(authorityStages).toContain('Activation and pinning')
  })
})

/* ==================================================================== *
 * GATE 4 — THE COUNTS THAT DO RECONCILE, ASSERTED FROM BOTH SIDES.
 *
 * These are the numbers a later gate is allowed to rest on, and each is
 * checked against two independent ends so that agreement is evidence rather
 * than a constant compared with itself.
 * ==================================================================== */

describe('slice 8 gate 4: the counts that reconcile, from both sides', () => {
  it('seventy fallback contracts across sixteen families, and the index agrees row by row', () => {
    const index = tableBody(82_412)
    expect(index.length).toBe(16)
    expect(FALLBACK_FAMILIES.length).toBe(16)
    expect(FALLBACK_CONTRACTS.length).toBe(70)

    let declared = 0
    for (const [i, n] of index.entries()) {
      const source = cellsOf(n)
      const family = FALLBACK_FAMILIES[i]!
      expect(family.line).toBe(n)
      expect(flat(family.family), `L${n} family cell`).toBe(flat(source[0]!))
      expect(source[1]).toContain(family.prefix)
      expect(Number(source[2]), `L${n} contracts cell`).toBe(family.declaredContracts)
      declared += family.declaredContracts
      // Per family, not only in total: two families with the same size cannot
      // cover for each other, which is the count-check-true-of-both shape.
      expect(
        FALLBACK_CONTRACTS.filter((c) => c.prefix === family.prefix).length,
        `${family.prefix} carries a different number of contracts than the index declares`,
      ).toBe(family.declaredContracts)
    }
    expect(declared).toBe(70)
  })

  it('seventy use cases in seven groups of ten, counted by entry heading', () => {
    const headings: { line: number; id: string }[] = []
    for (let n = 81_202; n <= 81_720; n += 1) {
      const m = /^\*\*`(UC-OFF-\d+)`/.exec(line(n))
      if (m !== null) headings.push({ line: n, id: m[1]! })
    }
    expect(headings.length).toBe(70)
    expect(CATALOGUE_TOTAL).toBe(70)
    expect(new Set(headings.map((h) => h.id)).size).toBe(70)

    // Ten per group, from the ordinal each identifier carries. A span scan of
    // group E finds eleven identifiers because a group D entry is
    // cross-referenced inside it; a heading scan finds ten, and only one of
    // those two questions is about ownership.
    const perGroup = new Map<number, number>()
    for (const h of headings) {
      const bucket = Math.floor((Number(h.id.slice('UC-OFF-'.length)) - 1) / 10)
      perGroup.set(bucket, (perGroup.get(bucket) ?? 0) + 1)
    }
    expect([...perGroup.keys()].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect([...perGroup.values()]).toEqual([10, 10, 10, 10, 10, 10, 10])

    expect(GROUP_HEADING_COUNTS.map((g) => g.headings)).toEqual([10, 10, 10, 10, 10, 10, 10])
    expect(GROUP_COUNTS.map((g) => g.entries)).toEqual([10, 10, 10])
    expect(USE_CASE_GROUPS.length).toBe(4)
    expect(OFFLINE_USE_CASES_A_D.length).toBe(40)
    expect(OFFLINE_USE_CASES_E_G.length).toBe(30)
    expect(OFFLINE_USE_CASES_A_D.length + OFFLINE_USE_CASES_E_G.length).toBe(CATALOGUE_TOTAL)
  })

  it('twelve use-case diagrams: thirteen mermaid blocks, of which the first is the map', () => {
    const fences: number[] = []
    for (let n = 81_202; n <= 81_720; n += 1) if (line(n).trim() === '```mermaid') fences.push(n)
    expect(fences.length).toBe(DIAGRAM_BLOCK_CENSUS.mermaidBlocksIn37A)
    expect(fences.length - DIAGRAM_BLOCK_CENSUS.catalogueMaps).toBe(
      DIAGRAM_BLOCK_CENSUS.useCaseDiagrams,
    )
    expect(DIAGRAM_BLOCK_CENSUS.useCaseDiagrams).toBe(12)
  })

  it('thirty-seven blockers and thirty-seven protocol steps under eight phase headings', () => {
    const index = tableBody(81_160)
    expect(index.length).toBe(37)
    expect(OFFLINE_BLOCKERS.length).toBe(37)
    expect(OFFLINE_BLOCKERS.map((b) => b.indexLine)).toEqual([...index])

    const steps: number[] = []
    const phases: number[] = []
    for (let n = 79_894; n <= 79_997; n += 1) {
      if (/^\d+\. /.test(line(n))) steps.push(n)
      if (/^\*\*Phase \d/.test(line(n))) phases.push(n)
    }
    expect(steps.length).toBe(37)
    expect(phases.length).toBe(8)
    expect(PROTOCOL_STEPS.length).toBe(37)
    expect(PROTOCOL_PHASES.length).toBe(8)
    expect(PROTOCOL_STEPS.map((s) => s.sourceLine)).toEqual([...steps])
    expect(PROTOCOL_PHASES.map((p) => p.headingLine)).toEqual([...phases])
  })

  it('thirteen preserved contradictions, counted from the list that states them', () => {
    const identifiers = [...line(81_759).matchAll(/`(DEC-[A-Z0-9]+-\d+)`/g)].map((m) => m[1]!)
    expect(new Set(identifiers).size).toBe(13)
    expect(line(81_761)).toContain('thirteen preserved contradictions')
  })
})

/* ==================================================================== *
 * GATE 5 — THE HOLD-STATE CLAIM IS CLASSIFIED THREE WAYS, AT THREE
 * LEVELS, AND NONE IS CHOSEN.
 *
 * The source states the claim as a fact, classifies the table carrying it as
 * derived, and records the question as open. A build that resolved it would
 * have decided whether a device write can lift a Severity 1 hold.
 * ==================================================================== */

describe('slice 8 gate 5: three readings of one sentence, and no field to pick one in', () => {
  const authority = tableBody(80_185)

  it('the per-object authority table is twelve rows, counted', () => {
    expect(authority.length).toBe(12)
    expect(CONFLICT_AUTHORITY.length).toBe(12)
    expect(CONFLICT_AUTHORITY.map((r) => r.sourceLine)).toEqual([...authority])
  })

  it('LEVEL ONE — the row itself opens SoW Fact, and its cell is quoted verbatim', () => {
    const cells = cellsOf(80_192)
    expect(cells[0]).toBe('Hold state, including the automatic Severity 1 hold')
    expect(cells[1]).toBe('The hold stands; no device write lifts it')
    expect(cells[2]!.startsWith('`SoW Fact — §3.3, §7.9.2`')).toBe(true)
    // Pinned by the CELL, not by the status token: `SoW Fact` opens eight of
    // these twelve rows, so a token check would stay green with the locator
    // moved to any of the other seven.
    const holdRow = CONFLICT_AUTHORITY.find((r) => r.sourceLine === 80_192)
    expect(holdRow?.whoWins).toBe('The hold stands; no device write lifts it')
  })

  it('LEVEL TWO — the section classifies the whole table as Derived Clarification', () => {
    expect(line(80_233)).toContain('`Derived Clarification` for the per-object authority table')
  })

  it('and the section-level classification is wrong about two thirds of its own table', () => {
    const opensSoWFact = authority.filter((n) => cellsOf(n)[2]!.startsWith('`SoW Fact'))
    expect(opensSoWFact.length).toBe(8)
    expect(opensSoWFact).toEqual([80_187, 80_188, 80_190, 80_191, 80_192, 80_196, 80_197, 80_198])
    expect(authority.length - opensSoWFact.length).toBe(4)
  })

  it('LEVEL THREE — chapter 38 records the question and explicitly does not choose', () => {
    expect(line(82_477)).toContain('A contradiction discovered at step 6, and not resolved here.')
    expect(line(82_477)).toContain('`DEC-FB-008`')
  })

  it('all three are carried, and the reading type has nowhere to mark a winner', () => {
    expect(DEC_FB_008_DISCLOSURE.decisionRef).toBe('DEC-FB-008')
    expect(DEC_FB_008_DISCLOSURE.readings.length).toBeGreaterThanOrEqual(2)
    for (const reading of DEC_FB_008_DISCLOSURE.readings) {
      expect(
        Object.keys(reading).sort(),
        'a DecisionReading grew a field a winner could be marked in',
      ).toEqual(['locator', 'text'])
    }
    // The three levels are held as three, in one record, and nothing there is
    // a winner either: `chosenHere` is prose saying NOTHING is chosen, and the
    // holder it points at is outside the module that carries it.
    const three = DEC_37B_HOLD_STATE_IS_NOT_OURS
    expect(three.levels.length).toBe(3)
    for (const [i, cited] of ['L80192', 'L80233', 'L82477'].entries()) {
      expect(three.levels[i], `level ${i + 1} does not cite ${cited}`).toContain(cited)
    }
    expect(three.chosenHere.startsWith('NOTHING')).toBe(true)
    expect(three.heldBy).not.toContain('src/offline/decisions-37b.ts')
    for (const holder of three.heldBy.split(' and ')) {
      expect(existsSync(join(ROOT, holder)), `${holder} does not exist`).toBe(true)
      expect(readSource(holder), `${holder} does not carry DEC-FB-008`).toContain('DEC-FB-008')
    }
  })

  it('and the fallbacks record it holds by identity, so two homes cannot drift into two readings', () => {
    const canonical = FALLBACK_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-FB-008')
    expect(canonical).toBeDefined()
    expect(DEC_FB_008_DISCLOSURE.readings).toBe(canonical!.readings)
    expect(DEC_FB_008_DISCLOSURE.question).toBe(canonical!.question)
  })
})

/* ==================================================================== *
 * GATE 6 — THE TWO `MOD-CC-10` MATRICES MUST NOT AGREE.
 *
 * A gate that finds them consistent has found a merge, not a fact. The two
 * treatments were built by two implementers who never read each other's
 * transcription, and that is what this gate protects.
 * ==================================================================== */

describe('slice 8 gate 6: the two MOD-CC-10 treatments disagree, and are not reconciled', () => {
  const chapter21Header = 38_082
  const s366Header = S366_MATRIX_SHAPE.headerLine

  it('the two are eight rows and nine rows, counted, and their column orders are opposite', () => {
    const a = tableBody(chapter21Header)
    const b = tableBody(s366Header)
    expect(a.length).toBe(8)
    expect(b.length).toBe(9)
    expect(CC10_MATRIX.length).toBe(8)
    expect(S366_ROWS.length).toBe(9)

    const headA = cellsOf(chapter21Header)
    const headB = cellsOf(s366Header)
    expect(headA.slice(1)).toEqual([
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(headB.slice(1)).toEqual([
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
    // Same five personas, opposite ends. A positional transcription inverts
    // every Worker and Tenant Admin cell, silently, because both readings are
    // internally coherent.
    expect(new Set(headA.slice(1))).toEqual(new Set(headB.slice(1)))
    expect(headA[1]).toBe(headB[4])
    expect(headA[5]).toBe(headB[1])
    expect(CC10_COLUMNS.length).toBe(5)
    expect(S366_COLUMNS.length).toBe(5)
  })

  it('one backticks its tokens and the other does not, so a raw string compare is not the test', () => {
    const a21 = tableBody(chapter21Header).flatMap((n) => cellsOf(n).slice(1))
    const s366 = tableBody(s366Header).flatMap((n) => cellsOf(n).slice(1))
    expect(a21.some((c) => c.startsWith('`'))).toBe(false)
    expect(s366.every((c) => c.startsWith('`'))).toBe(true)
  })

  it('a merge that DROPS a divergence is caught, because both counts are read off the source', () => {
    // `length >= 3` was the first form of this check and it could not fail: a
    // merge that removed one divergence still left three. Planted, watched
    // GREEN, and replaced -- the count is now derived from the frozen source on
    // BOTH ends rather than being a floor this file chose.
    //
    // Chapter 21 refuses the Tenant Admin in every one of its eight rows;
    // §36.6 gives that role a non-refusal in exactly two. Those two rows ARE
    // the two-rows-wide divergence, so the number of recorded Tenant Admin
    // divergences is not this file's opinion -- it is what the two matrices
    // measure.
    const s366TenantAdmin = tableBody(s366Header).filter(
      (n) => openingToken(cellsOf(n)[4]!) !== 'Explicitly prohibited',
    )
    const ch21TenantAdmin = tableBody(chapter21Header).filter(
      (n) => openingToken(cellsOf(n)[1]!) !== 'Explicitly prohibited',
    )
    expect(s366TenantAdmin.length, '§36.6 gives the Tenant Admin a non-refusal').toBe(2)
    expect(ch21TenantAdmin.length, 'chapter 21 refuses the Tenant Admin in all eight').toBe(0)
    expect(
      S366_DIVERGENCES.filter((d) => d.column === 'Tenant Admin').length,
      'the Tenant Admin divergence is two rows wide and both rows must be recorded',
    ).toBe(s366TenantAdmin.length)

    // The same, from the Supervisor side: the two treatments disagree on the
    // flag row, and §36.6 splits the panel-sight act the other collapses.
    const supervisorDisagreements = tableBody(s366Header).filter((n) => {
      const capability = cellsOf(n)[0]!
      const twin = tableBody(chapter21Header).find((m) => cellsOf(m)[0] === capability)
      return twin !== undefined && openingToken(cellsOf(n)[2]!) !== openingToken(cellsOf(twin)[2]!)
    })
    expect(supervisorDisagreements, 'the flag row is where the Supervisor treatments part').toEqual([
      80_554,
    ])
    expect(
      S366_DIVERGENCES.filter((d) => d.column === 'Supervisor').length,
    ).toBeGreaterThanOrEqual(supervisorDisagreements.length)
  })

  it('every recorded divergence is real at BOTH cited lines, pinned by the capability wording', () => {
    expect(S366_DIVERGENCES.length).toBe(4)
    for (const divergence of S366_DIVERGENCES) {
      const hereLines = [...divergence.here.locator.matchAll(/L(\d{5})/g)].map((m) => Number(m[1]))
      const thereLines = [...divergence.chapter21.locator.matchAll(/L(\d{5})/g)].map((m) =>
        Number(m[1]),
      )
      expect(hereLines.length, `${divergence.id} cites no §36.6 line`).toBeGreaterThan(0)
      expect(thereLines.length, `${divergence.id} cites no chapter-21 line`).toBeGreaterThan(0)

      // The CELL, not its status token. Moving a locator one row left an
      // earlier form of this check green, because a token 36 of 45 cells carry
      // pins nothing.
      expect(
        hereLines.map((n) => cellsOf(n)[0]),
        `${divergence.id}: a §36.6 locator does not name the capability it claims`,
      ).toEqual([...divergence.hereCapabilities])
      expect(
        thereLines.map((n) => cellsOf(n)[0]),
        `${divergence.id}: a chapter-21 locator does not name the capability it claims`,
      ).toEqual([...divergence.chapter21Capabilities])
    }
  })

  it('the two named divergences are opposite verdicts at their own lines', () => {
    // Supervisor may flag an automatic resolution as wrong.
    expect(cellsOf(38_089)[0]).toBe('Flag an automatic resolution as wrong')
    expect(openingToken(cellsOf(38_089)[2]!)).toBe('Allowed')
    expect(cellsOf(80_554)[0]).toBe('Flag an automatic resolution as wrong')
    expect(openingToken(cellsOf(80_554)[2]!)).toBe('Explicitly prohibited')

    // Tenant Admin may see the panel at all.
    expect(cellsOf(38_084)[0]).toBe('View the conflict panel')
    expect(openingToken(cellsOf(38_084)[1]!)).toBe('Explicitly prohibited')
    expect(cellsOf(80_549)[0]).toBe('See the panel exists')
    expect(openingToken(cellsOf(80_549)[4]!)).toBe('Allowed with conditions')
  })

  it('and nothing chooses: every divergence carries `chosen: null` and a reason', () => {
    for (const divergence of S366_DIVERGENCES) {
      expect(divergence.chosen, `${divergence.id} chose`).toBeNull()
      expect(divergence.whyNeitherIsChosen.length).toBeGreaterThan(80)
      for (const reading of [divergence.here, divergence.chapter21]) {
        expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
      }
    }
  })

  it('the divergence set is not merely the brief’s: some were found by comparing the two', () => {
    // A gate that only re-checked what the brief named would prove the brief,
    // not the transcriptions.
    expect(S366_DIVERGENCES.some((d) => !d.namedByTheBrief)).toBe(true)
    expect(S366_DIVERGENCES.some((d) => d.namedByTheBrief)).toBe(true)
  })
})

/* ==================================================================== *
 * GATE 7 — `DEC-STORE-001` HAS TWO OPTION SETS, IN TWO CHAPTERS, AND A
 * FIFTH SPELLING IS THE DEFECT.
 * ==================================================================== */

describe('slice 8 gate 7: two option sets, two owners, and no fifth record', () => {
  it('§35.5 names four candidates and FB-FL-STORE-01 names three', () => {
    const four = [...line(79_469).matchAll(/\(([a-d])\)/g)].map((m) => m[1]!)
    expect(four).toEqual(['a', 'b', 'c', 'd'])
    expect(line(79_469).startsWith('- **Options.**')).toBe(true)

    const three = [...line(40_116).matchAll(/\(([a-d])\)/g)].map((m) => m[1]!)
    expect(new Set(three)).toEqual(new Set(['a', 'b', 'c']))
    expect(line(40_116)).toContain('`FB-FL-STORE-01`')
    expect(line(40_116)).toContain('This is `DEC-STORE-001`.')
  })

  it('their recommended orders differ, and so do their named decision owners', () => {
    expect(line(79_470)).toContain('a layered combination of (c) then (d) then (a), in that order')
    expect(line(40_116)).toContain('a combination of (b) and (c) with (a) as the terminal state')

    expect(line(79_472)).toContain(
      "The client's product owner with the Quality Manager function",
    )
    expect(line(40_116)).toContain('deferred to the Frontline Functional Specification')
  })

  it('both readings are carried with their locators and nothing chooses between them', () => {
    expect(STORAGE_FULL_OPTION_SET_DIVERGENCE.about).toBe('DEC-STORE-001')
    expect(STORAGE_FULL_OPTION_SET_DIVERGENCE.readings.length).toBe(2)
    for (const reading of STORAGE_FULL_OPTION_SET_DIVERGENCE.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
    const locators = STORAGE_FULL_OPTION_SET_DIVERGENCE.readings.map((r) => r.locator).join(' | ')
    expect(locators).toContain('L40116')
    expect(locators).toContain('L79469')
    expect(Object.keys(STORAGE_FULL_OPTION_SET_DIVERGENCE)).not.toContain('adopted')
    expect(Object.keys(STORAGE_FULL_OPTION_SET_DIVERGENCE)).not.toContain('recommendation')
  })

  it('§35.5 names the decision six times, at the lines it names it', () => {
    const mentions: number[] = []
    for (let n = 79_428; n <= 79_511; n += 1) if (line(n).includes('DEC-STORE-001')) mentions.push(n)
    expect(mentions).toEqual([79_439, 79_466, 79_488, 79_490, 79_500, 79_510])
  })

  it('four files hold a record, they are those four, and no fifth has landed', () => {
    expect(DEC_STORE_001_SHIPPED_RECORDS.length).toBe(4)
    for (const path of DEC_STORE_001_SHIPPED_RECORDS) {
      const text = readSource(path)
      expect(text, `${path} no longer holds a DEC-STORE-001 record`).toContain('DEC-STORE-001')
      expect(
        /decisionRef: 'DEC-STORE-001'|id: 'DEC-STORE-001'|DEC_STORE_001_/.test(text) ||
          text.includes("'DEC-STORE-001'"),
        `${path} names DEC-STORE-001 only in prose`,
      ).toBe(true)
    }
    // And the module that consumes it re-exports rather than respelling. The
    // test is for a fifth RECORD, not for a mention: this file legitimately
    // QUOTES both option sets inside its divergence readings, so a text sweep
    // for the option wording would be red on the shipped tree for the wrong
    // reason -- a shape this build has already recorded once.
    const storage = readSource('src/offline/package/storage.ts')
    expect(storage).toContain('export const DEC_STORE_001 = A2_STORE_DISCLOSURE')
    expect(
      /decisionRef: 'DEC-STORE-001'/.test(storage),
      'src/offline/package/storage.ts declares a fifth DEC-STORE-001 disclosure record',
    ).toBe(false)
    expect(
      /\badopted:/.test(
        /export const STORAGE_FULL_OPTION_SET_DIVERGENCE[\s\S]*?\n}/.exec(storage)?.[0] ?? '',
      ),
      'the divergence record grew an adopted field',
    ).toBe(false)
  })
})

/* ==================================================================== *
 * GATE 8 — THE STEP ARITHMETIC THAT CARRIES A FINDING.
 *
 * The quarantine register attributes envelope-incompleteness detection to
 * step 21 — before the record it names arrives — and says so twice. The
 * register's own cell STAYS A LITERAL: sourcing both numbers from one
 * constant would make the two agree by construction and erase the finding.
 * ==================================================================== */

describe('slice 8 gate 8: detection precedes its own evidence by one step, and stays that way', () => {
  it('the two steps are twenty-one and twenty-two, and both are the protocol’s own', () => {
    expect(COMMAND_MANIFEST_READ_STEP).toBe(21)
    expect(CAPTURE_UPLOAD_STEP).toBe(22)
    const twentyOne = PROTOCOL_STEPS.find((s) => s.number === COMMAND_MANIFEST_READ_STEP)
    const twentyTwo = PROTOCOL_STEPS.find((s) => s.number === CAPTURE_UPLOAD_STEP)
    expect(line(twentyOne!.sourceLine)).toContain(
      'the command manifest is read and the stop class is applied',
    )
    expect(line(twentyTwo!.sourceLine)).toContain(
      'the captures upload, then the enabling classes are applied',
    )
  })

  it('the register says twenty-one at its own row, and the diagram restates it', () => {
    const register = tableBody(80_387)
    expect(register.length).toBe(10)
    expect(QUARANTINE_REGISTER.length).toBe(10)
    const row = cellsOf(80_394)
    expect(row[0]).toBe('Envelope incompleteness, for example a missing worker identity')
    expect(Number(row[1])).toBe(21)
    expect(line(80_417)).toContain('at step 16, 17, 18, 20, 21, 24, 28 or 32')
  })

  it('the record carries both numbers and refuses to correct one into the other', () => {
    expect(ENVELOPE_STEP_ANACHRONISM.registerSaysStep).toBe(21)
    expect(ENVELOPE_STEP_ANACHRONISM.subjectArrivesAtStep).toBe(CAPTURE_UPLOAD_STEP)
    expect(ENVELOPE_STEP_ANACHRONISM.registerSaysStep).not.toBe(
      ENVELOPE_STEP_ANACHRONISM.subjectArrivesAtStep,
    )
    expect(ENVELOPE_STEP_ANACHRONISM.corrected).toBe(false)
  })

  it('and the register’s cell is a LITERAL in the source text, not the protocol constant', () => {
    // This is the whole gate. `registerSaysStep: COMMAND_MANIFEST_READ_STEP`
    // would be true, would type-check, and would make the two numbers agree by
    // construction on any future edit to the protocol — which is the finding
    // disappearing rather than being fixed.
    const text = readSource('src/offline/quarantine.ts')
    expect(/registerSaysStep: 21\b/.test(text)).toBe(true)
    expect(/registerSaysStep: COMMAND_MANIFEST_READ_STEP/.test(text)).toBe(false)
    expect(/subjectArrivesAtStep: CAPTURE_UPLOAD_STEP/.test(text)).toBe(true)
    expect(/subjectArrivesAtStep: 22\b/.test(text)).toBe(false)
  })
})

/* ==================================================================== *
 * GATE 9 — `OFF-BLK-20` CONTRADICTS `AC-37-002`, AND THE SOURCE NAMES THE
 * EXCEPTION ITSELF.
 *
 * The gate carries the source's own words rather than this build's summary,
 * because a build that resolved this would be deciding what a worker is told
 * when their evidence is gone.
 * ==================================================================== */

describe('slice 8 gate 9: the register writes its own exception under the absolute above it', () => {
  it('the absolute: AC-37-002 and governing rule one, both verbatim', () => {
    expect(cellsOf(80_767)[0]).toBe('`AC-37-002`')
    expect(cellsOf(80_767)[1]).toBe(
      'No blocker deletes, truncates or renders unrecoverable any locally committed capture.',
    )
    expect(line(80_729)).toContain('A blocker never destroys local data.')
  })

  it('the exception: the entry’s message text, and the register calling it that', () => {
    expect(line(81_078)).toContain('**`OFF-BLK-20` — Lost encryption key.**')
    expect(line(81_078)).toContain('Any work not yet sent cannot be recovered from this tablet.')
    expect(flat(line(81_078))).toContain(
      flat('This is the register’s one genuinely unrecoverable entry'),
    )
    expect(cellsOf(81_181)[0]).toBe('`OFF-BLK-20`')
    expect(cellsOf(81_181)[3]).toBe('Unrecoverable unsynced data, named explicitly')
  })

  it('both readings are carried with both locators, and nothing is adopted', () => {
    expect(UNRECOVERABLE_DATA_BLOCKER).toBe('OFF-BLK-20')
    const entry = OFFLINE_BLOCKERS.find((b) => b.identifier === UNRECOVERABLE_DATA_BLOCKER)
    expect(entry?.indexLine).toBe(81_181)
    expect(entry?.detailLine).toBe(81_078)
    expect(entry?.workerOutcome).toBe('Unrecoverable unsynced data, named explicitly')

    const claim = REGISTER_SELF_CLAIMS.find((c) => c.key === 'work-is-saved')
    expect(claim).toBeDefined()
    expect(claim!.adopted).toBeNull()
    expect(claim!.readings.length).toBe(2)
    for (const reading of claim!.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
    const locators = claim!.readings.map((r) => r.locator).join(' | ')
    for (const cited of ['L80729', 'L80767', 'L81078', 'L81181']) {
      expect(locators, `the work-is-saved claim drops locator ${cited}`).toContain(cited)
    }
  })

  it('and every register self-claim is a pair of readings with no winner', () => {
    expect(REGISTER_SELF_CLAIMS.length).toBeGreaterThanOrEqual(3)
    for (const claim of REGISTER_SELF_CLAIMS) {
      expect(claim.adopted, `${claim.key} adopted a reading`).toBeNull()
      expect(claim.readings.length).toBeGreaterThanOrEqual(2)
      expect(claim.counts.entries).toBe(OFFLINE_BLOCKERS.length)
    }
  })
})

/* ==================================================================== *
 * GATE 10 — THE §37 FAMILY COUNTS REST ON A NUMBERING THE TRANSCRIPTION
 * NEVER TOUCHED.
 *
 * Three independent readings agree, and the third is the strong one:
 * nothing forces the acceptance-criterion numbering to match the register,
 * so a dropped or duplicated row disagrees with a scheme this build has no
 * hand in.
 * ==================================================================== */

describe('slice 8 gate 10: 12 / 10 / 8 / 4 / 3, from three readings that cannot cover for each other', () => {
  const EXPECTED: Readonly<Record<BlockerFamily, number>> = {
    Content: 12,
    Authority: 10,
    Device: 8,
    Intelligence: 4,
    Distributed: 3,
  }

  it('READING ONE — the index table’s own Family column', () => {
    const tally = new Map<string, number>()
    for (const n of tableBody(81_160)) {
      const family = cellsOf(n)[2]!
      tally.set(family, (tally.get(family) ?? 0) + 1)
    }
    expect(Object.fromEntries([...tally].sort())).toEqual(
      Object.fromEntries(Object.entries(EXPECTED).sort()),
    )
  })

  it('READING TWO — which §37.2-§37.6 section carries each detail entry', () => {
    const tally = new Map<string, number>()
    for (const blocker of OFFLINE_BLOCKERS) {
      tally.set(blocker.family, (tally.get(blocker.family) ?? 0) + 1)
      const bounds: Readonly<Record<string, readonly [number, number]>> = {
        '37.2': [80_889, 80_976],
        '37.3': [80_977, 81_037],
        '37.4': [81_038, 81_087],
        '37.5': [81_088, 81_119],
        '37.6': [81_120, 81_157],
      }
      const [from, to] = bounds[blocker.section]!
      expect(
        blocker.detailLine >= from && blocker.detailLine <= to,
        `${blocker.identifier} is filed in §${blocker.section} but its entry is not in that section`,
      ).toBe(true)
    }
    expect(Object.fromEntries([...tally].sort())).toEqual(
      Object.fromEntries(Object.entries(EXPECTED).sort()),
    )
  })

  it('READING THREE — the acceptance-criterion family each section numbers itself in', () => {
    // The strong one. Nothing forces `AC-37-2xx` to have as many members as the
    // Content family has rows: the numbering is a separate act of the source's
    // and this build never touches it.
    const perPrefix = new Map<string, Set<string>>()
    for (let n = 80_717; n <= 81_201; n += 1) {
      for (const m of line(n).matchAll(/AC-37-(\d)(\d\d)/g)) {
        const prefix = `AC-37-${m[1]}`
        if (!perPrefix.has(prefix)) perPrefix.set(prefix, new Set())
        perPrefix.get(prefix)!.add(`${prefix}${m[2]}`)
      }
    }
    for (const [family, expected] of Object.entries(EXPECTED) as [BlockerFamily, number][]) {
      const prefix = FAMILY_CRITERION_PREFIX[family]
      expect(
        perPrefix.get(prefix)?.size,
        `${prefix}xx has a different number of criteria than ${family} has rows`,
      ).toBe(expected)
    }
  })

  it('and the tree records all three, agreeing, with their own locators', () => {
    expect(FAMILY_COUNT_READINGS.length).toBe(3)
    for (const reading of FAMILY_COUNT_READINGS) {
      expect(reading.counts, reading.reading).toEqual(EXPECTED)
      expect(reading.locator.length).toBeGreaterThan(0)
    }
    expect(new Set(FAMILY_COUNT_READINGS.map((r) => r.locator)).size).toBe(3)
  })
})

/* ==================================================================== *
 * GATE 11 — §37.1'S "SIX" IS NOT THE SOURCE'S WORD.
 *
 * A section heading and a supporting table are not the same enumeration, and
 * taking the table's row count as the section's number is how eight of this
 * slice's brief errors happened.
 * ==================================================================== */

describe('slice 8 gate 11: three rules and a six-row values table are two lists, not one', () => {
  const SECTION_FROM = 80_775
  const SECTION_TO = 80_888

  it('FREEZE: §37.1 states three rules, and the word "six" occurs nowhere in it', () => {
    expect(line(SECTION_FROM)).toBe('## 37.1 The Offline Authorization Limits')
    expect(line(AUTHORIZATION_RULES_CLAIM_LINE)).toContain(
      'Three rules, each quoted from the source and each load-bearing for the whole register.',
    )
    expect(wordCount('six', SECTION_FROM, SECTION_TO)).toBe(0)
    expect(wordCount('three', SECTION_FROM, SECTION_TO)).toBeGreaterThan(0)
  })

  it('the supporting table is titled VALUES where the section heading says LIMITS', () => {
    expect(line(AUTHORIZATION_LIMIT_LOCATORS.tableIntroLine)).toBe(
      '**Supporting table — the offline authorization values. No cell is blank.**',
    )
    expect(line(SECTION_FROM)).toContain('Limits')
  })

  it('the two are carried as two constants, three and six, each with its own locator', () => {
    expect(AUTHORIZATION_RULES.length).toBe(3)
    for (const rule of AUTHORIZATION_RULES) {
      expect(line(rule.sourceLine).length, `L${rule.sourceLine} is blank`).toBeGreaterThan(0)
    }

    const values = tableBody(AUTHORIZATION_LIMIT_LOCATORS.headerLine)
    expect(values.length).toBe(6)
    expect(OFFLINE_AUTHORIZATION_LIMITS.length).toBe(6)
    expect(OFFLINE_AUTHORIZATION_LIMITS.map((l) => l.sourceLine)).toEqual([...values])
    for (const [i, n] of values.entries()) {
      const source = cellsOf(n)
      expect(source.length, `L${n} does not carry seven cells`).toBe(7)
      expect(
        source.filter((c) => c.length === 0),
        `L${n} has a blank cell where the source says none is blank`,
      ).toEqual([])
      expect(flat(OFFLINE_AUTHORIZATION_LIMITS[i]!.value)).toBe(flat(source[0]!))
    }
  })

  it('and they are NOT the same list: rows without a rule, and a rule without a row', () => {
    const ruleNames = AUTHORIZATION_RULES.map((r) => r.name.toLowerCase())
    const rowValues = OFFLINE_AUTHORIZATION_LIMITS.map((l) => l.value.toLowerCase())
    const rowsWithNoRule = rowValues.filter(
      (v) => !ruleNames.some((r) => v.includes(r.split(' ')[0]!) || r.includes(v.split(' ')[0]!)),
    )
    expect(rowsWithNoRule.length, 'the six rows all map onto the three rules').toBeGreaterThan(0)
    expect(AUTHORIZATION_RULES.length).not.toBe(OFFLINE_AUTHORIZATION_LIMITS.length)
  })
})

/* ==================================================================== *
 * GATE 12 — `Allowed` IS A PROHIBITION AS OFTEN AS IT IS A GRANT, AND TWO
 * GUARDS EACH HID THE OTHER.
 *
 * `permissionStatusesIn` carries two protections against one defect: a
 * longest-first vocabulary and an EXACT comparison. Removing either alone
 * stays green because the other catches the plant. Redundant protections
 * against the same defect cannot be verified one at a time, so this gate
 * exercises the removal of each AND of both, against the entry that grants
 * the conditional and the plain form on the same line.
 * ==================================================================== */

describe('slice 8 gate 12: the prefix trap, and two guards that each hid the other', () => {
  const BOTH_ON_ONE_LINE = 'UC-OFF-013'

  it('the vocabulary is longest-first, so `Allowed` is last and not first', () => {
    expect(PERMISSION_STATUSES[PERMISSION_STATUSES.length - 1]).toBe('Allowed')
    expect(PERMISSION_STATUSES.indexOf('Allowed with conditions')).toBeLessThan(
      PERMISSION_STATUSES.indexOf('Allowed'),
    )
  })

  it('the reader compares the whole cell, not its head', () => {
    const text = readSource('src/offline/use-cases/group-a-d/catalogue.ts')
    const body = /export function permissionStatusesIn[\s\S]*?\n}/.exec(text)?.[0] ?? ''
    expect(body.length, 'permissionStatusesIn was not found to read').toBeGreaterThan(0)
    expect(/head === candidate/.test(body)).toBe(true)
    expect(/startsWith/.test(body), 'the exactness guard has become a prefix test').toBe(false)
  })

  it('one entry grants the conditional and the plain form on the same line, and both are read', () => {
    const entry = OFFLINE_USE_CASES_A_D.find((e) => e.id === BOTH_ON_ONE_LINE)
    expect(entry, `${BOTH_ON_ONE_LINE} is not in the transcription`).toBeDefined()
    const statuses = permissionStatusesIn(entry!.permissions)
    expect(statuses).toContain('Allowed')
    expect(statuses).toContain('Allowed with conditions')
    // Both readings, distinctly. A prefix tally reads the conditional as the
    // plain form and the counts collapse.
    expect(statuses.filter((s) => s === 'Allowed').length).toBeGreaterThan(0)
    expect(statuses.filter((s) => s === 'Allowed with conditions').length).toBeGreaterThan(0)
  })

  it('BOTH GUARDS REMOVED is what goes wrong, and each alone is not enough to show it', () => {
    // The three plants, run here as the shipped function's shape rather than by
    // editing the module: what matters is that the failure needs BOTH removals.
    const clause = OFFLINE_USE_CASES_A_D.find((e) => e.id === BOTH_ON_ONE_LINE)!.permissions
    const read = (
      vocabulary: readonly string[],
      exact: boolean,
    ): readonly string[] => {
      const found: string[] = []
      for (const match of clause.matchAll(/`([^`]+)`/g)) {
        const head = (match[1] ?? '').split('—')[0]?.trim() ?? ''
        const status = vocabulary.find((c) => (exact ? head === c : head.startsWith(c)))
        if (status !== undefined) found.push(status)
      }
      return found
    }
    const longestFirst = [...PERMISSION_STATUSES]
    const allowedFirst = ['Allowed', ...PERMISSION_STATUSES.filter((s) => s !== 'Allowed')]
    const truth = [...permissionStatusesIn(clause)]

    expect(read(longestFirst, true), 'the shipped shape').toEqual(truth)
    expect(read(allowedFirst, true), 'ordering removed alone — exactness catches it').toEqual(truth)
    expect(read(longestFirst, false), 'exactness removed alone — ordering catches it').toEqual(truth)
    expect(
      read(allowedFirst, false),
      'BOTH guards removed and the reader still agrees — the entry no longer proves the trap',
    ).not.toEqual(truth)
  })

  it('and the module says both guards are guards, not one of them', () => {
    const text = readSource('src/offline/use-cases/group-a-d/catalogue.ts')
    expect(text).toContain('TWO GUARDS STAND HERE AND THEY ARE REDUNDANT WITH EACH OTHER')
  })
})

/* ==================================================================== *
 * THE FILE ITSELF.
 * ==================================================================== */

describe('slice 8 gates: the file itself', () => {
  // Carried from slices 3, 4 and 5, where three patch scripts rewrote a gate
  // with `write(src.slice(0, start) + replacement)` and silently truncated
  // every gate defined after it. Both times the count still looked right,
  // because the check was how many gates existed rather than WHICH.
  const SELF = join('tests', 'coverage', 'slice-08-gates.test.ts')

  it('defines gates 1..N with no gap, so a truncating edit cannot hide one', () => {
    const src = readFileSync(join(ROOT, SELF), 'utf8')
    const numbers = [...src.matchAll(/^describe\('slice 8 gate (\d+):/gm)].map((m) => Number(m[1]))
    expect(numbers.length, 'no gates found').toBeGreaterThan(0)
    expect(numbers, 'gate numbers are not a gapless 1..N sequence').toEqual(
      Array.from({ length: numbers.length }, (_, i) => i + 1),
    )
    expect(numbers.length, `slice 8 declares twelve gates; this file defines ${numbers.length}`).toBe(
      12,
    )
  })

  it('leaves no probe behind', () => {
    for (const root of [join(ROOT, 'src', 'offline'), join(ROOT, 'src', 'fallbacks')]) {
      expect(existsSync(join(root, OWN_PROBE_DIR)), `${root} still holds this run's probe`).toBe(
        false,
      )
    }
  })

  it('the plant helper this file proved its gates with is the shared one', () => {
    // Imported rather than re-declared, which `prohibited-patterns` requires of
    // every suite that plants, and exercised here so the import is not
    // decoration.
    withPlanted(join(ROOT, 'src', 'offline'), 'probe.ts', 'export const P = 1\n', () => {
      expect(existsSync(join(ROOT, 'src', 'offline', OWN_PROBE_DIR, 'probe.ts'))).toBe(true)
    })
    expect(existsSync(join(ROOT, 'src', 'offline', OWN_PROBE_DIR))).toBe(false)
  })
})

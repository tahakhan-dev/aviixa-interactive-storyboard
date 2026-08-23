import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONSOLE_AUTHORITY_ATTRIBUTION,
  CONSOLE_AUTHORITY_AXIS_HEADING,
  CONSOLE_AUTHORITY_CLASSIFICATION_HEADING,
  CONSOLE_AUTHORITY_COLUMNS,
  CONSOLE_AUTHORITY_CROSS_REFERENCES,
  CONSOLE_AUTHORITY_FIRST_DATA_LINE,
  CONSOLE_AUTHORITY_HEADER_LINE,
  CONSOLE_AUTHORITY_PROVENANCE,
  CONSOLE_AUTHORITY_ROWS,
  CONSOLE_AUTHORITY_SEAMS,
  CONSOLE_AUTHORITY_SOURCE_LINES,
  UNCANONISED_DECISIONS,
  UNDECIDED_AUTHORITY_ROWS,
  consoleAuthorityRow,
} from '@/surfaces/sa/ai-failure-authority'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { ROLES } from '@/domain/roles'
import { columnKey } from '@/policy/columns'
import { provenanceClass } from '@/ai/provenance/classes'

/**
 * Slice 11, wave 2, task 9 — the console failure-response authority matrix as
 * data, against the frozen source.
 *
 * WHAT THIS FILE IS FOR. Not "the matrix exists". Six things that were wrong,
 * or nearly wrong, before it did:
 *
 *   1. THE ROW LOCATORS THE DISPATCH BRIEF CARRIED WERE BOTH OFF BY ONE. It
 *      placed the site-scoped pause at L91288 [cited-in-error: L91288] and the
 *      kill switch at L91289 [cited-in-error: L91289]. The pause is at L91289
 *      and the kill switch at L91290; L91288 is the platform-wide pause. An
 *      off-by-one locator into a permission matrix still looks right, because
 *      the row above a permission row is another permission row. So the whole
 *      table is compared BYTE FOR BYTE against the frozen bytes and every
 *      derived row asserts its own line.
 *   2. A TABLE READ ONE ROW SHORT OR ONE ROW LONG. A span states where a table
 *      is, not how many rows it has. The line above the header and the line
 *      below the last row are both required NOT to be table rows, so the
 *      transcription cannot silently stop early or run into the paragraph
 *      after it. Nothing here states a count.
 *   3. FOUR UNDECIDED ROWS WHERE THE BRIEF NAMED THREE. Three defer in a role
 *      cell. The fourth defers in its CLASSIFICATION while granting in its
 *      cells, and a check that only read cells would have shipped the kill
 *      switch as a settled control.
 *   4. A CELL THAT GRANTS AND DEFERS AT ONCE. The kill switch's Platform
 *      Engineer cell is permissive and its own stated condition still refers
 *      the answer to the client. It is found by reading the cell rather than
 *      flagged, and the finding is asserted on the exact column.
 *   5. AN ATTRIBUTION TAKEN FROM A NEIGHBOURING IDENTIFIER. The chapter is
 *      swept here for module identifiers rather than trusted, and the sweep is
 *      what the panel's attribution paragraph rests on.
 *   6. A SEAM NAMING A FILE NOBODY CAN OPEN. Every seam's owner is opened.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'

const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** One-based, so a test reads the same number a citation writes. */
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

/** Chapter 43 runs from its first section heading to the line before chapter 44. */
const CHAPTER_43_FIRST = 89_880
const CHAPTER_43_LAST = 91_585

describe('the frozen source this task was built from', () => {
  it('is the bytes every locator below was measured against', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('the table, byte for byte', () => {
  it('is the header, the separator and the data rows at their own lines', () => {
    CONSOLE_AUTHORITY_SOURCE_LINES.forEach((carried, index) => {
      expect(lineAt(CONSOLE_AUTHORITY_HEADER_LINE + index)).toBe(carried)
    })
  })

  it('carries the caption the panel prints, on the caption line', () => {
    expect(lineAt(91_280)).toContain(CONSOLE_AUTHORITY_ATTRIBUTION.caption)
    expect(CONSOLE_AUTHORITY_ATTRIBUTION.captionRef).toBe('L91280')
  })

  it('stops where the source stops, at both ends', () => {
    // A span says where a table is. These two lines say where it is not.
    expect(lineAt(CONSOLE_AUTHORITY_HEADER_LINE - 1).trim().startsWith('|')).toBe(false)
    const afterLast = CONSOLE_AUTHORITY_HEADER_LINE + CONSOLE_AUTHORITY_SOURCE_LINES.length
    expect(lineAt(afterLast).trim().startsWith('|')).toBe(false)
  })

  it('gives every derived row the line it was read from', () => {
    CONSOLE_AUTHORITY_ROWS.forEach((row, index) => {
      const line = CONSOLE_AUTHORITY_FIRST_DATA_LINE + index
      expect(row.sourceRef).toBe(`L${String(line)}`)
      expect(lineAt(line)).toBe(row.verbatim)
    })
  })

  it('names each control at its own line, and the two the brief transposed at theirs', () => {
    expect(lineAt(91_289)).toContain('| Site-scoped pause |')
    expect(lineAt(91_290)).toContain('| Runaway-loop kill switch |')
    // The lines the brief gave for those two, and what they actually carry.
    expect(lineAt(91_288)).toContain('| Platform-wide emergency pause |')
    expect(consoleAuthorityRow('site-scoped-pause').sourceRef).toBe('L91289')
    expect(consoleAuthorityRow('runaway-loop-kill-switch').sourceRef).toBe('L91290')
  })
})

describe('the columns, resolved rather than typed twice', () => {
  it('is a Control axis and a Classification tail around four registered roles', () => {
    expect(CONSOLE_AUTHORITY_AXIS_HEADING).toBe('Control')
    expect(CONSOLE_AUTHORITY_CLASSIFICATION_HEADING).toBe('Classification')
    expect(CONSOLE_AUTHORITY_COLUMNS.map((c) => c.role)).toEqual([
      'ROOT_SUPER_ADMIN',
      'ADMIN',
      'PLATFORM_ENGINEER',
      'SUPPORT',
    ])
  })

  it('takes every column header from the role registry, not from this matrix', () => {
    CONSOLE_AUTHORITY_COLUMNS.forEach((column) => {
      const role = ROLES.find((candidate) => candidate.id === column.role)
      expect(role?.name).toBe(column.header)
      expect(role?.domain).toBe('PLATFORM')
    })
  })

  it('gives every row a cell for every column, and no blank detail', () => {
    CONSOLE_AUTHORITY_ROWS.forEach((row) => {
      CONSOLE_AUTHORITY_COLUMNS.forEach((column) => {
        const cell = row.cells[columnKey(column)]
        expect(cell, `${row.id} has no cell for ${column.header}`).toBeDefined()
        expect(cell?.detail.trim()).not.toBe('')
      })
    })
  })

  /**
   * The parsed cell and the source's own words, side by side and agreeing.
   * `detail` is never blank because L10238 forbids a blank cell, which means a
   * bare token gets a sentence the PARSER wrote — right as data and wrong on a
   * screen. Both halves are kept and each is checked against the row it came
   * from.
   */
  it('keeps each cell’s source text beside its parsed outcome, in column order', () => {
    CONSOLE_AUTHORITY_ROWS.forEach((row) => {
      const fields = row.verbatim
        .trim()
        .slice(1, -1)
        .split('|')
        .map((field) => field.trim())
      expect(row.renderedCells.map((cell) => cell.columnKey)).toEqual(
        CONSOLE_AUTHORITY_COLUMNS.map(columnKey),
      )
      row.renderedCells.forEach((cell, index) => {
        expect(cell.verbatim, `${row.id} / ${cell.header}`).toBe(fields[index + 1])
        expect(cell.header).toBe(CONSOLE_AUTHORITY_COLUMNS[index]?.header)
        expect(cell.outcome).toBe(row.cells[cell.columnKey]?.outcome)
      })
    })
    // A bare cell: source text is the token alone, parsed detail is the
    // parser's own sentence. If those two ever became one field, one of them
    // would be lost — and it is the rendered one that would go wrong.
    const bare = consoleAuthorityRow('view-incident-health-and-queue-telemetry')
    expect(bare.renderedCells[0]?.verbatim).toBe('Allowed')
    expect(bare.cells['role:ROOT_SUPER_ADMIN']?.detail).toContain('stated bare in the source')
  })

  it('derives a distinct id per row from the control it names', () => {
    const ids = CONSOLE_AUTHORITY_ROWS.map((row) => row.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^[a-z][a-z0-9-]*$/))
  })
})

describe('the undecided rows, derived from the cells and the classification', () => {
  /**
   * A MEMBERSHIP LIST, NOT A LENGTH, AND PROVED BY ADDING. `toHaveLength(3)`
   * is satisfied by any three rows at all. Adding a fourth id here reds this
   * assertion whichever rows the derivation actually finds.
   */
  const CELL_UNDECIDED = ['site-scoped-pause', 'model-quarantine', 'safe-replay']

  it('defers in a role cell on exactly these rows', () => {
    expect(
      CONSOLE_AUTHORITY_ROWS.filter((row) => row.undecidedCells.length > 0).map((row) => row.id),
    ).toEqual(CELL_UNDECIDED)
  })

  it('defers in the classification column on the kill switch alone, and there in no cell', () => {
    expect(
      CONSOLE_AUTHORITY_ROWS.filter((row) => row.undecidedInClassification).map((row) => row.id),
    ).toEqual(['runaway-loop-kill-switch'])
    expect(consoleAuthorityRow('runaway-loop-kill-switch').undecidedCells).toEqual([])
  })

  it('finds the one cell that grants and defers in the same breath', () => {
    const withDeferringGrant = CONSOLE_AUTHORITY_ROWS.filter(
      (row) => row.permissiveCellsDeferring.length > 0,
    )
    expect(withDeferringGrant.map((row) => row.id)).toEqual(['runaway-loop-kill-switch'])
    expect(withDeferringGrant[0]?.permissiveCellsDeferring).toEqual(['role:PLATFORM_ENGINEER'])
    const cell = consoleAuthorityRow('runaway-loop-kill-switch').cells['role:PLATFORM_ENGINEER']
    expect(cell?.outcome).toBe('allowedWithConditions')
    expect(cell?.detail).toContain('subject to client decision')
  })

  it('renders four rows as undecided, and they are these four', () => {
    expect(UNDECIDED_AUTHORITY_ROWS.map((row) => row.id)).toEqual([
      'site-scoped-pause',
      'runaway-loop-kill-switch',
      'model-quarantine',
      'safe-replay',
    ])
  })

  it('keeps failover permissive even though it names an open decision', () => {
    const failover = consoleAuthorityRow('provider-or-model-failover')
    expect(failover.undecided).toBe(false)
    expect(failover.citedDecisions).toEqual(['DEC-AIFAILOVER-001'])
    expect(failover.cells['role:ROOT_SUPER_ADMIN']?.outcome).toBe('allowed')
  })
})

describe('the Support column, which is the row the console never acts on', () => {
  /**
   * Every row but two refuses Support outright. Stated as the exceptions
   * rather than as a tally: an exception list goes red when a row moves into
   * or out of it, and a count goes red only when the table changes size.
   */
  const SUPPORT_IS_NOT_A_REFUSAL = [
    'view-incident-health-and-queue-telemetry',
    'read-tenant-operational-content',
  ]

  it('refuses Support on every row except these', () => {
    expect(
      CONSOLE_AUTHORITY_ROWS.filter(
        (row) => row.cells['role:SUPPORT']?.outcome !== 'explicitlyProhibited',
      ).map((row) => row.id),
    ).toEqual(SUPPORT_IS_NOT_A_REFUSAL)
  })

  it('gives Support read-only telemetry and a time-boxed session, in the source’s own words', () => {
    expect(consoleAuthorityRow('view-incident-health-and-queue-telemetry').cells['role:SUPPORT'])
      .toMatchObject({ outcome: 'readOnly' })
    expect(
      consoleAuthorityRow('read-tenant-operational-content').cells['role:SUPPORT']?.detail,
    ).toBe('read-only, time-boxed support session')
  })
})

describe('the module attribution, swept rather than assumed', () => {
  const chapter43 = sourceLines.slice(CHAPTER_43_FIRST - 1, CHAPTER_43_LAST)

  it('opens on 43.1 and closes before 44.1', () => {
    expect(lineAt(CHAPTER_43_FIRST)).toContain('## 43.1')
    expect(lineAt(CHAPTER_43_LAST).trim()).not.toBe('')
    expect(lineAt(CHAPTER_43_LAST + 2)).toContain('## 44.1')
  })

  /**
   * PROVED BY ADDING. Every module identifier in chapter 43 is listed, and the
   * list is compared whole. Adding `MOD-SA-07` to this array reds the
   * assertion, which is exactly the claim the panel makes on screen.
   */
  const MODULE_IDENTIFIERS_IN_CHAPTER_43 = [
    'MOD-FL-A1',
    'MOD-FL-A2',
    'MOD-FL-A3',
    'MOD-FL-A4',
    'MOD-FL-A5',
    'MOD-FL-A6',
    'MOD-FL-A7',
    'MOD-FL-B10',
    'MOD-FL-B11',
    'MOD-FL-B12',
    'MOD-FL-B8',
    'MOD-FL-B9',
  ]

  it('names these module identifiers and no others', () => {
    const found = [
      ...new Set(chapter43.join('\n').match(/MOD-[A-Z]+-[A-Z]?\d+/g) ?? []),
    ].sort((a, b) => a.localeCompare(b))
    expect(found).toEqual(MODULE_IDENTIFIERS_IN_CHAPTER_43)
  })

  it('names the identifier a build would reach for, at the two lines that make the reach tempting', () => {
    expect(CONSOLE_AUTHORITY_ATTRIBUTION.theIdentifierABuildWouldReachFor).toBe('MOD-SA-07')
    expect(lineAt(47_803)).toContain('MOD-SA-07')
    expect(lineAt(47_803)).toContain('The emergency pause')
    expect(lineAt(48_737)).toContain('SCR-SA-08')
    expect(lineAt(48_737)).toContain('MOD-SA-07')
  })

  it('labels the filing a client-delegated choice rather than a source fact', () => {
    expect(CONSOLE_AUTHORITY_ATTRIBUTION.howThisBuildRendersIt).toContain('APP-012')
    // APP-012 is a build approval, not a blueprint identifier. If it ever
    // appears in the frozen source, this file is citing the wrong authority.
    expect(sourceBytes.toString('utf8').includes('APP-012')).toBe(false)
  })
})

describe('the decisions, against the canon rather than beside it', () => {
  it('cites only decisions the frozen rows actually name', () => {
    CONSOLE_AUTHORITY_ROWS.forEach((row) => {
      row.citedDecisions.forEach((id) => {
        expect(lineAt(Number(row.sourceRef.slice(1)))).toContain(id)
      })
    })
  })

  it('splits them by canon membership, and the split is these two lists', () => {
    expect(
      [...new Set(CONSOLE_AUTHORITY_ROWS.flatMap((row) => row.canonisedDecisions))].sort((a, b) =>
        a.localeCompare(b),
      ),
    ).toEqual(['DEC-AIFAILOVER-001', 'DEC-AIQUAR-001', 'DEC-AIREPLAY-001'])
    expect(UNCANONISED_DECISIONS).toEqual(['DEC-AIPAUSE-001'])
  })

  it('leaves the two uncanonised identifiers out of the canon rather than adding them here', () => {
    const canon: readonly string[] = OPEN_DECISION_IDS
    expect(canon).not.toContain('DEC-AIPAUSE-001')
    expect(canon).not.toContain('DEC-KILL-001')
  })

  it('ties every cross-referenced decision to a line that carries it', () => {
    expect(CONSOLE_AUTHORITY_CROSS_REFERENCES.map((r) => r.decision)).toEqual([
      'DEC-KILL-001',
      'DEC-PAUSE-001',
      'DEC-PAUSE-001',
    ])
    CONSOLE_AUTHORITY_CROSS_REFERENCES.forEach((reference) => {
      expect(lineAt(Number(reference.sourceRef.slice(1)))).toContain(reference.decision)
      // And it must bear on a row that exists.
      expect(() => consoleAuthorityRow(reference.rowId)).not.toThrow()
    })
  })
})

describe('the seams', () => {
  it('names an owner that exists on disk, for every one', () => {
    CONSOLE_AUTHORITY_SEAMS.forEach((seam) => {
      expect(existsSync(join(process.cwd(), seam.owner)), `${seam.id} owner ${seam.owner}`).toBe(
        true,
      )
      expect(seam.ownerTask.trim()).not.toBe('')
    })
  })

  it('covers both uncanonised identifiers and the missing mount', () => {
    expect(CONSOLE_AUTHORITY_SEAMS.map((seam) => seam.id)).toEqual([
      'canon-record-site-scoped-pause',
      'canon-record-kill-switch',
      'console-mount',
    ])
  })
})

describe('provenance', () => {
  it('is one deterministic-rule class and could not be a live one', () => {
    expect(CONSOLE_AUTHORITY_PROVENANCE).toBe('PROV-4')
    const record = provenanceClass(CONSOLE_AUTHORITY_PROVENANCE)
    expect(record.name).toBe('Deterministic rules')
    expect(record.mayBeCalledLive).toBe('Explicitly prohibited')
  })
})

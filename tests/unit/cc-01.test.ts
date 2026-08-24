import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CC01_COLUMN_ORDER,
  CC01_MATRIX,
  CC01_ROLE_COLUMNS,
  CC01_ROWS_HELD_ELSEWHERE,
  CC01_TENANT_ADMIN_CONTEST,
  cc01CellOutcome,
  cc01Row,
} from '@/surfaces/cc/modules/cc-01/matrix'
import {
  CC01_BOARD_ELEMENTS,
  CC01_BOARD_MARKER,
  CC01_CELL_CONTRIBUTIONS,
  CC01_FALLBACK_IDS,
  CC01_INFORMATION_CONTRACT,
  CC01_LANDING_REF,
  CC01_LANDING_ROLE,
  CC01_MARKER_ELEMENT,
  CC01_OWN_ELEMENTS,
  CC01_PER_DEVICE_ELEMENTS,
  CC01_SCREEN,
  CC01_SESSION_OFFLINE,
  CC01_SITE_ELAPSED_MINUTES,
  CC01_SLUG,
  CC01_STORYBOARD_DEVICES,
  CC01_WRITES_RECORDS,
  cc01RenderPlan,
  type Cc01BoardCell,
} from '@/surfaces/cc/modules/cc-01/board'
import { CC_ELEMENT_CLASS_ASSIGNMENTS, ccMarkerText } from '@/surfaces/cc/live/model'
import { SCR_CC_02_STATE_INVENTORY } from '@/surfaces/cc/modules/cc-02/chrome'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreenSlug } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-01` — THE LIVE SHIFT BOARD, AND `SCR-CC-02` AS A BUILT ROUTE.
 *
 * WHAT THESE GATES ASK. Every expectation about the source is READ OFF THE
 * FROZEN SOURCE at test time and compared with what this task wrote. No count
 * below is taken from the array under test: "seven rows" is counted by
 * walking the source's own table from its separator to the first line that is
 * not a table row, never from `CC01_MATRIX.length`. Slice 8 lost six brief
 * assertions to counts inferred from a span.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — one
 * defect per gate, in the shipping file the gate claims to protect, then
 * reversed. The `FAILS IF` note names the defect that was ACTUALLY planted.
 * The harness required its anchor to occur exactly once before planting AND
 * before reversing, and captured its baseline once before the first plant,
 * because a wave-0 campaign restored to the wrong occurrence and three later
 * plants then verified against an already-corrupted baseline with the
 * checksum agreeing every time.
 *
 * FOUR BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE ARE LIVE HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and this card uses
 *    both. The classifier gate asserts the two tokens reach DIFFERENT
 *    outcomes rather than asserting each reaches something.
 *  - A TABLE-SHAPE CHECK IS SATISFIED BY THE `|---|---|` SEPARATOR, which
 *    splits into non-empty cells. Every row count below excludes the
 *    separator by POSITION rather than by content.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Column indices are
 *    resolved from the source's own header line at test time, so a column
 *    swap in the module moves the comparison too — which is why the header
 *    itself is asserted against L36262 separately and first.
 *  - `Allowed` USED AS A PROHIBITION. Every cell is compared as its WHOLE
 *    clause; nothing here is reduced to a head token, and the one row whose
 *    clause changes its meaning is asserted on the clause.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/** A markdown row split into its cells; the two pipe edges are not cells. */
function cells(row: string): string[] {
  const parts = row.split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.trim())
}

const isTableRow = (line: string): boolean => line.trimStart().startsWith('|')

/**
 * Data rows of the table whose SEPARATOR is at `separatorLine`. The separator
 * is excluded by position — it is the line handed in — so the `|---|---|`
 * shape can never be counted as a row, and the walk stops at the first line
 * that is not a table row rather than at a span this test was told.
 */
function dataRowsAfter(separatorLine: number): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = []
  for (let n = separatorLine + 1; n <= LINES.length; n += 1) {
    const text = srcLine(n)
    if (!isTableRow(text)) break
    out.push({ line: n, text })
  }
  return out
}

describe('MOD-CC-01 — the matrix, counted off the source and never off itself', () => {
  it('the header at L36262 carries six columns in the order this module transcribed', () => {
    // FAILS IF: `Supervisor` and `Quality Manager` are swapped in
    // CC01_COLUMN_ORDER. Planted; red; reversed.
    expect(cells(srcLine(36262))).toEqual([...CC01_COLUMN_ORDER])
    expect(srcLine(36263)).toContain('---')
  })

  it('the body is seven rows — walked from the separator, not read off a span', () => {
    const rows = dataRowsAfter(36263)
    // FAILS IF: an eighth row is appended to CC01_MATRIX. Planted as a
    // duplicate of the pace row under a new id; red; reversed.
    expect(rows.length).toBe(7)
    expect(rows[0]?.line).toBe(36264)
    expect(rows[6]?.line).toBe(36270)
    expect(CC01_MATRIX.length).toBe(rows.length)
    // And the line after the last row is not a table row, which is what
    // "the body stops there" means. The line itself is not cited.
    expect(isTableRow(srcLine(36271))).toBe(false)
  })

  it('every cell is the source’s own words, resolved by header rather than by position', () => {
    const header = cells(srcLine(36262))
    for (const row of CC01_MATRIX) {
      const n = Number(row.sourceRef.slice(1))
      const sourceCells = cells(srcLine(n))
      expect(sourceCells[0]).toBe(row.capability)
      for (let i = 0; i < CC01_ROLE_COLUMNS.length; i += 1) {
        const column = CC01_COLUMN_ORDER[i + 1]
        const key = CC01_ROLE_COLUMNS[i]
        if (column === undefined || key === undefined) throw new Error('column order is short')
        const idx = header.indexOf(column)
        expect(idx).toBeGreaterThan(0)
        // FAILS IF: the Tenant Admin cell of L36264 loses its "— reached only
        // via the connectivity banner context" qualifier. Planted; red;
        // reversed.
        expect(row.cells[key].verbatim).toBe(sourceCells[idx])
      }
    }
  })

  it('`Allowed` and `Allowed with conditions` reach DIFFERENT outcomes', () => {
    // Not "each maps to something": the prefix is the whole trap.
    expect(cc01CellOutcome('Allowed')).toBe('allowed')
    expect(cc01CellOutcome('Allowed with conditions — requires Tenant or Site read scope')).toBe(
      'allowedWithConditions',
    )
    expect(cc01CellOutcome('Allowed')).not.toBe(
      cc01CellOutcome('Allowed with conditions — requires Tenant or Site read scope'),
    )
    expect(() => cc01CellOutcome('Allowed-ish')).toThrow(/not one of the tokens/)
  })

  it('the two tokens are both really used, so neither branch is unreachable', () => {
    const outcomes = new Set(
      CC01_MATRIX.flatMap((r) => CC01_ROLE_COLUMNS.map((c) => r.cells[c].outcome)),
    )
    expect(outcomes).toContain('allowed')
    expect(outcomes).toContain('allowedWithConditions')
    expect(outcomes).toContain('readOnly')
    expect(outcomes).toContain('explicitlyProhibited')
  })
})

describe('MOD-CC-01 — the prohibition this surface cannot enforce', () => {
  const row = cc01Row('see-pace-state')

  it('the Worker cell is read as its whole clause, not its head token', () => {
    // FAILS IF: the Worker cell is transcribed as bare `Explicitly
    // prohibited`. Planted; red; reversed.
    expect(row.cells.WORKER.verbatim).toBe('Explicitly prohibited — never worker-facing')
    expect(row.cells.WORKER.verbatim).not.toBe('Explicitly prohibited')
    expect(cells(srcLine(36266))[5]).toBe(row.cells.WORKER.verbatim)
  })

  it('L36356 states it as a prohibition rather than a grant, in its own words', () => {
    const func = srcLine(36356)
    expect(func).toContain('`FUNC-CC-0103-2-1` Suppress pace entirely from the Frontline device.')
    expect(func).toContain('Roles allowed: not applicable — this is a prohibition, not a grant.')
  })

  it('the real obligation is AC-CC-165 and its subject is another surface’s payload', () => {
    const ac = srcLine(36402)
    expect(ac).toContain('`AC-CC-165`')
    expect(ac).toContain(
      'No pace state, flag or derived timer is present in any payload reaching the Frontline Worker Application.',
    )
    // FAILS IF: `enforcedBy` is set to null on that row — i.e. the module
    // claims the obligation as its own. Planted; red; reversed.
    expect(row.heldWhere).toBe('another-payload')
    expect(row.enforcedBy).not.toBeNull()
    expect(row.enforcedBy).toContain('AC-CC-165')
    expect(row.enforcedBy).toContain('L36402')
  })

  it('the rows held elsewhere are derived from the field, never listed twice', () => {
    expect([...CC01_ROWS_HELD_ELSEWHERE].sort()).toEqual(
      ['change-what-the-board-ranks', 'see-pace-state'].sort(),
    )
  })
})

describe('MOD-CC-01 — the Tenant Admin reads two ways and neither is chosen', () => {
  it('the surface matrix confines the role, in its own words at L35004', () => {
    const cell = cells(srcLine(35004))[1]
    expect(cells(srcLine(35004))[0]).toBe('Open any Command Center route')
    expect(cell).toBe('Allowed with conditions — report and banner routes only')
    // The landing table agrees, and its row is L35078.
    expect(cells(srcLine(35078))).toEqual([
      'Tenant Admin only',
      'Report formats and delivery',
      'The Tenant Admin is not an in-shift actor',
    ])
  })

  it('two of THIS card’s seven rows grant that role more, and they are named off the source', () => {
    // Derived from the transcription, so a row losing its grant renames the
    // set rather than leaving a hand-written count of two intact. A count of
    // two is also true of the flags moved onto the wrong pair.
    const granted = CC01_MATRIX.filter(
      (r) =>
        r.cells.TENANT_ADMIN.outcome === 'allowed' ||
        r.cells.TENANT_ADMIN.outcome === 'allowedWithConditions',
    ).map((r) => r.id)
    expect(granted).toEqual([...CC01_TENANT_ADMIN_CONTEST.rowsThisCardGrants])
    expect(granted).toEqual(['view-the-cross-area-board', 'see-the-freshness-marker-and-expand-it'])
    expect(cells(srcLine(36265))[1]).toBe(
      'Allowed with conditions — requires Tenant or Site read scope',
    )
    expect(cells(srcLine(36268))[1]).toBe('Allowed')
  })

  it('the reconciling row is the only one whose grant names the banner route', () => {
    const row = cc01Row(CC01_TENANT_ADMIN_CONTEST.reconcilingRow)
    expect(row.cells.TENANT_ADMIN.verbatim).toContain('connectivity banner context')
    expect(row.cells.TENANT_ADMIN.outcome).toBe('readOnly')
    const others = CC01_MATRIX.filter((r) => r.id !== row.id)
    expect(others.some((r) => r.cells.TENANT_ADMIN.verbatim.includes('banner'))).toBe(false)
  })

  it('there are exactly two readings and no field on either can name a winner', () => {
    expect(CC01_TENANT_ADMIN_CONTEST.readings.length).toBe(2)
    for (const reading of CC01_TENANT_ADMIN_CONTEST.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
      expect(reading.locator).toMatch(/L\d{5}/)
    }
    // The offence is a FIELD, never a word: the prose below says "neither is
    // chosen", and a scan over the serialised value would fire on that
    // sentence and pass on a `preferredReading` added to a reading. Keys
    // only, at both levels.
    const keys = [
      ...Object.keys(CC01_TENANT_ADMIN_CONTEST),
      ...CC01_TENANT_ADMIN_CONTEST.readings.flatMap((r) => Object.keys(r)),
    ]
    // FAILS IF: an `adopted`/`preferred` field is added to the contest.
    // Planted as `preferredReading: 'A'`; red; reversed.
    expect(keys.filter((k) => /adopt|prefer|chosen|winner|answer/i.test(k))).toEqual([])
  })

  it('no DEC-* identifier is minted anywhere in this module for it', () => {
    const dir = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-01')
    for (const entry of readdirSync(dir).filter((e) => !isForeignProbe(e))) {
      const text = readFileSync(join(dir, entry), 'utf8')
      // Naming an existing decision is fine; the offence is minting a key for
      // a contradiction the source raises none for.
      expect(/DEC-(BOARD|TENANTADMIN|CCROUTE|SCOPE)-\d+/.test(text)).toBe(false)
    }
    expect(CC01_TENANT_ADMIN_CONTEST.noDecisionIdentifier).toContain('AC-CC-502')
  })
})

describe('MOD-CC-01 — what each cell contributes, counted', () => {
  it('is six rows and every cell is verbatim', () => {
    expect(cells(srcLine(36241))).toEqual(['Board element', 'Source', 'Freshness class'])
    const rows = dataRowsAfter(36242)
    // FAILS IF: the `Freshness marker` row (L36248) is dropped. Planted; red;
    // reversed.
    expect(rows.length).toBe(6)
    expect(CC01_CELL_CONTRIBUTIONS.length).toBe(rows.length)
    for (const c of CC01_CELL_CONTRIBUTIONS) {
      const n = Number(c.sourceRef.slice(1))
      expect(cells(srcLine(n))).toEqual([c.element, c.source, c.classCell])
    }
  })

  it('the one qualified class cell keeps its qualifier and is not promoted', () => {
    const qualified = CC01_CELL_CONTRIBUTIONS.filter((c) => c.classCell !== 'Refreshed')
    expect(qualified.map((c) => c.sourceRef)).toEqual(['L36244'])
    expect(qualified[0]?.classCell).toBe('Refreshed, driven by pushed events')
  })
})

describe('MOD-CC-01 — the marker’s data, and the two rows that are per-device', () => {
  it('the eighteen-row assignment has exactly two per-device rows, named off the source', () => {
    const perDevice = CC_ELEMENT_CLASS_ASSIGNMENTS.filter((r) => r.perDevice)
    // Named, not counted: a count of two is also true of the flags moved onto
    // the wrong pair.
    expect(perDevice.map((r) => r.sourceRef)).toEqual(['L35897', 'L35901'])
    expect(cells(srcLine(35897))[3]).toBe('Per-device timestamps')
    expect(cells(srcLine(35901))[3]).toBe('Per-device last-seen time')
  })

  it('this screen carries the second of them, and it is the marker’s own source data', () => {
    expect(CC01_MARKER_ELEMENT.element).toBe('Device heartbeat and last sync')
    expect(CC01_MARKER_ELEMENT.sourceRef).toBe('L35901')
    expect(CC01_MARKER_ELEMENT.markerObligation).toBe('Per-device last-seen time')
    // FAILS IF: CC01_BOARD_ELEMENTS drops the marker element and renders only
    // the five MOD-CC-01 rows. Planted; red; reversed — the derived list then
    // reports no per-device obligation on a screen whose marker IS one.
    expect(CC01_PER_DEVICE_ELEMENTS).toEqual(['Device heartbeat and last sync'])
    expect(CC01_BOARD_ELEMENTS.map((e) => e.sourceRef)).toContain('L35901')
  })

  it('the five MOD-CC-01 elements are derived from the table, not listed', () => {
    expect(CC01_OWN_ELEMENTS.map((e) => e.sourceRef)).toEqual([
      'L35891',
      'L35892',
      'L35893',
      'L35894',
      'L35895',
    ])
    for (const e of CC01_OWN_ELEMENTS) {
      expect(cells(srcLine(Number(e.sourceRef.slice(1))))[0]).toBe(e.element)
      expect(e.markerObligation).toBe('As-of time')
    }
  })

  it('every device figure is the storyboard’s own, transcribed from L35967-L35969', () => {
    const rows = dataRowsAfter(35966)
    expect(rows.length).toBe(3)
    expect(CC01_STORYBOARD_DEVICES.length).toBe(rows.length)
    const asSource = CC01_STORYBOARD_DEVICES.map((d) => [
      `\`${d.deviceId}\``,
      d.cell,
      d.lastSeen,
      d.lastSync,
      d.pendingCaptures === 'unknown' ? 'Unknown while offline' : String(d.pendingCaptures),
    ])
    expect(rows.map((r) => cells(r.text))).toEqual(asSource)
  })

  it('the marker never renders zero for the unknown count', () => {
    // FAILS IF: TAB-014's pendingCaptures is changed from 'unknown' to 0.
    // Planted; red; reversed — three assertions fired, and the one that
    // matters is the third.
    expect(cells(srcLine(35967))[4]).toBe('Unknown while offline')
    expect(CC01_STORYBOARD_DEVICES[0]?.pendingCaptures).toBe('unknown')
    const text = ccMarkerText(CC01_BOARD_MARKER)
    expect(text).toBe('Synced 09:11 · 1 of 3 devices offline · pending captures unknown')
    expect(text).not.toMatch(/\b0 captures pending\b/)
    // AC-CC-122's own words, so the rule is asserted against the source and
    // not against this module's paraphrase of it.
    expect(srcLine(35981)).toContain(
      'The marker never reports a pending-capture count of zero for a device whose pending count is unknown; it reports unknown.',
    )
  })

  it('the banner is withheld rather than guessed, and the rule says so at L36587', () => {
    expect(CC01_SITE_ELAPSED_MINUTES).toBe('unknown')
    expect(srcLine(36587)).toContain('the tenant banner is withheld rather than guessed')
    expect(srcLine(36587)).toContain('a false site-wide banner would be its own credibility failure')
  })
})

describe('MOD-CC-01 — exception-first is an aggregation, not a styling choice', () => {
  const board = (cellCount: number, exceptions: number): readonly Cc01BoardCell[] =>
    Array.from({ length: cellCount }, (_, i) => ({
      cellId: `cell-${i}`,
      exception: i < exceptions ? `exception ${i}` : null,
    }))

  it('renders tiles for the exceptions only, at 8, 47 and 120 cells', () => {
    // AC-CC-162's own three sizes, L36399.
    expect(srcLine(36399)).toContain('verified at 8, 47 and 120 cells')
    for (const size of [8, 47, 120]) {
      const plan = cc01RenderPlan(board(size, 7))
      // FAILS IF: cc01RenderPlan returns every cell as a tile. Planted as
      // `const tiles = cells`; red at all three sizes; reversed.
      expect(plan.tiles.length).toBe(7)
      expect(plan.quietCount).toBe(size - 7)
    }
  })

  it('holds no field carrying the suppressed tiles', () => {
    const plan = cc01RenderPlan(board(120, 7))
    expect(Object.keys(plan).sort()).toEqual(['quietCount', 'tiles'])
    expect(JSON.stringify(plan)).not.toContain('cell-119')
  })

  it('the source states the failure this guards, in its own words', () => {
    expect(srcLine(36237)).toContain(
      'A board that renders 120 full tiles and then visually de-emphasises 113 of them has met the design intent and failed the scale requirement.',
    )
  })
})

describe('MOD-CC-01 — writes nothing, and states its session-offline behaviour', () => {
  it('the card says so three ways and the module carries the answer once', () => {
    expect(srcLine(36278)).toContain('no records. The board writes nothing')
    expect(srcLine(36280)).toContain('None. This module is read-only by construction.')
    expect(CC01_WRITES_RECORDS).toBe(false)
  })

  it('the session-offline sentence is L36307’s, and the queue answer is derived', () => {
    expect(srcLine(36307)).toContain(CC01_SESSION_OFFLINE.behaviour)
    // FAILS IF: `queuesNothing` is written as a literal `true` instead of
    // being derived through `queuesClientSide`. Planted; red — the plant was
    // then made in the registry instead, which is the direction that matters.
    expect(CC01_SESSION_OFFLINE.queuesNothing).toBe(true)
  })

  it('names the four fallbacks its own card names, and only those four', () => {
    const declared = srcLine(36329)
    expect(declared).toContain('**Fallback identifiers.**')
    for (const id of CC01_FALLBACK_IDS) expect(declared).toContain(`\`${id}\``)
    const inSource = [...declared.matchAll(/`(FB-CC-[A-Z]+)`/g)].map((m) => m[1])
    expect([...new Set(inSource)].sort()).toEqual([...CC01_FALLBACK_IDS].sort())
  })
})

describe('SCR-CC-02 — the register row, the slug and the built route', () => {
  it('the register names both modules on one row at L48387', () => {
    const row = cells(srcLine(48387))
    expect(row[0]).toBe('SCR-CC-02')
    expect(row[1]).toBe('Live shift board')
    expect(row[4]).toBe('MOD-CC-01, MOD-CC-02')
    expect(row[5]).toBe('Landing for the Supervisor')
    expect(CC01_SCREEN.registerRef).toBe('L48387')
    expect(CC01_SCREEN.modulesShown).toBe(row[4])
  })

  it('the slug comes from the spine, and a directory of that name is on disk', () => {
    expect(CC01_SLUG).toBe(ccModule('MOD-CC-01').slug)
    expect(ccScreenSlug(CC01_SCREEN)).toBe(CC01_SLUG)
    expect(existsSync(join(process.cwd(), 'app', 'command-center', CC01_SLUG, 'page.tsx'))).toBe(
      true,
    )
  })

  it('MOD-CC-02 gains no route from this task', () => {
    expect(ccModule('MOD-CC-02').slug).toBeNull()
    const dir = join(process.cwd(), 'app', 'command-center')
    const built = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
    // FAILS IF: a `sync-state-and-connectivity` directory appears. Planted as
    // an empty directory with a page.tsx; red; reversed by deleting it.
    expect(built.some((n) => /sync-state|connectivity/.test(n))).toBe(false)
    expect(built).toContain(CC01_SLUG)
  })

  it('the route file names its own module, and carries no `use client`', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC01_SLUG, 'page.tsx'),
      'utf8',
    )
    // FAILS IF: every literal `MOD-CC-01` is removed from the page, which is
    // exactly how SCR-CC-10 shipped in slice 8. Planted; red; reversed.
    expect(page).toContain('MOD-CC-01')
    expect(/^\s*['"]use client['"]/m.test(page)).toBe(false)
  })

  it('this screen is the Supervisor’s landing, and the role it renders for says so', () => {
    expect(cells(srcLine(35076))).toEqual([
      'Supervisor only',
      'Scoped live shift board',
      "The board is the Supervisor's working instrument",
    ])
    expect(CC01_LANDING_REF).toBe('L35076')
    expect(CC01_LANDING_ROLE).toBe('SUPERVISOR')
  })
})

describe('SCR-CC-02 — the action rail is NOT mounted, and the source says which screens do', () => {
  it('L38793 names seven modules and MOD-CC-01 is not one of them', () => {
    const line = srcLine(38793)
    expect(line).toContain('**Interconnections.**')
    // Anchored at BOTH ends: an unanchored `MOD-CC-\d+` invents members of
    // the family it is counting, and this line also carries action numbers.
    const named = [...line.matchAll(/(^|[^A-Za-z0-9-])`(MOD-CC-\d+)`/g)].map((m) => m[2])
    expect([...new Set(named)].sort()).toEqual([
      'MOD-CC-03',
      'MOD-CC-04',
      'MOD-CC-05',
      'MOD-CC-06',
      'MOD-CC-09',
      'MOD-CC-10',
      'MOD-CC-12',
    ])
    expect(named).not.toContain('MOD-CC-01')
  })

  it('so this route leaves the shell’s actionRail unfilled and says why', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC01_SLUG, 'page.tsx'),
      'utf8',
    )
    // FAILS IF: `actionRail={...}` is added back to this page. Planted as a
    // mount of wave 0's ActionRail; red; reversed.
    expect(/actionRail=/.test(page)).toBe(false)
    expect(page).toContain('L38793')
    // A stated absence, not an oversight: the page names the owing module.
    expect(page).toContain('operational-action-set')
  })
})

describe('SCR-CC-02 — the state inventory is consumed, never written twice', () => {
  it('is thirteen rows in the source and thirteen in MOD-CC-02’s transcription', () => {
    expect(srcLine(48460)).toContain('Full state inventory for `SCR-CC-02`, the live shift board.')
    const rows = dataRowsAfter(48463)
    expect(rows.length).toBe(13)
    expect(rows[12]?.line).toBe(48476)
    expect(cells(srcLine(48476))[0]).toBe('`STATE-13` Recovery')
    expect(SCR_CC_02_STATE_INVENTORY.length).toBe(rows.length)
  })

  it('this task wrote no second copy of it', () => {
    const dir = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-01')
    for (const entry of readdirSync(dir).filter((e) => !isForeignProbe(e))) {
      const text = readFileSync(join(dir, entry), 'utf8')
      // FAILS IF: a `STATE-01`..`STATE-13` array is added to this module.
      // Planted as a three-row copy; red; reversed.
      expect(/STATE-\d\d/.test(text)).toBe(false)
    }
  })
})

describe('MOD-CC-01 — the client boundary, and the four-part contract', () => {
  it('no file in this module declares `use client` while exporting data', () => {
    const dir = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-01')
    const files = readdirSync(dir).filter((e) => !isForeignProbe(e))
    expect(files.length).toBeGreaterThan(0)
    for (const entry of files) {
      const text = readFileSync(join(dir, entry), 'utf8')
      const declares = /^\s*['"]use client['"]/m.test(text)
      const exportsData = /^export const |^export function /m.test(text)
      expect(declares && exportsData).toBe(false)
    }
  })

  it('the contract is four parts and each names the region that discharges it', () => {
    expect(CC01_INFORMATION_CONTRACT.map((c) => c.part)).toEqual([1, 2, 3, 4])
    const line = srcLine(36231)
    for (const part of CC01_INFORMATION_CONTRACT) {
      expect(line).toContain(part.obligation)
      expect(part.renderedBy).not.toBe('')
    }
    expect(srcLine(36233)).toContain(
      'a board that shows attention and normality but not sync state is a board that lies by omission',
    )
  })
})

describe('SCR-CC-02 — reachability, measured from `app/` rather than assumed', () => {
  /** Every file under `app/`, probes excluded. */
  function appFiles(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...appFiles(full))
      else out.push(full)
    }
    return out
  }

  /**
   * A module is reachable when some file under `app/` imports it, directly or
   * through a chain this walk follows. The walk is over IMPORT SPECIFIERS, so
   * a module merely MENTIONED in a comment does not count — which is the
   * difference between a file that ships and a file that is talked about.
   */
  function reachableFromApp(): Set<string> {
    const seen = new Set<string>()
    const queue = appFiles(join(process.cwd(), 'app'))
    while (queue.length > 0) {
      const file = queue.pop()
      if (file === undefined || seen.has(file)) continue
      seen.add(file)
      const text = readFileSync(file, 'utf8')
      // BOTH SPECIFIER SHAPES, and the relative one is not optional. The
      // first writing of this walk followed `@/` only, and every module that
      // reaches its neighbour through `./matrix` read as unreachable —
      // including this task's own. A reachability gate that under-reports is
      // the same defect as one that over-reports, arrived at from the safe
      // side, and it would have gone green on a broken chain.
      for (const m of text.matchAll(/from\s+'((?:@\/|\.\.?\/)[^']+)'/g)) {
        const spec = m[1]
        if (spec === undefined) continue
        const base = spec.startsWith('@/')
          ? join(process.cwd(), 'src', spec.slice(2))
          : resolve(dirname(file), spec)
        for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
          if (existsSync(base + ext)) {
            queue.push(base + ext)
            break
          }
        }
      }
    }
    return seen
  }

  const REACHED = reachableFromApp()
  const reached = (rel: string): boolean => REACHED.has(join(process.cwd(), rel))

  it('closes the two wave-0 files this screen was named the home of', () => {
    // FAILS IF: the LiveFreshnessMarker import is dropped from the board.
    // Planted; red; reversed.
    expect(reached('src/surfaces/cc/live/LiveFreshnessMarker.tsx')).toBe(true)
    expect(reached('src/surfaces/cc/live/model.ts')).toBe(true)
    expect(reached('src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx')).toBe(true)
    expect(reached('src/surfaces/cc/modules/cc-02/chrome.ts')).toBe(true)
  })

  it('and three more this screen consumes rather than restates', () => {
    expect(reached('src/surfaces/cc/fallback/patterns.ts')).toBe(true)
    expect(reached('src/surfaces/cc/decisions/link-outs.ts')).toBe(true)
    expect(reached('src/surfaces/cc/modules/cc-02/matrix.ts')).toBe(true)
    // Reached through `./matrix` from SyncStateChrome, which is the case a
    // `@/`-only walk misses entirely.
    expect(reached('src/surfaces/cc/modules/cc-01/matrix.ts')).toBe(true)
  })

  it('states honestly what it does NOT reach, so the gap is declared not discovered', () => {
    // `CcFallbackDisclosure` is surface-wide and its declared wiring is
    // `<CcFallbackLibrary />` inside CommandCenterShell, which is not this
    // task's file. This assertion is the abstention, and it turns red the day
    // somebody wires it — which forces the note above to be corrected rather
    // than left stale.
    expect(reached('src/surfaces/cc/fallback/CcFallbackDisclosure.tsx')).toBe(false)
    // `cc-10-s366` WAS task 16's to wire, and task 16 wired it. This line
    // asserted `false` and went red on their success — which is exactly what
    // it said it would do, and the note above is now corrected rather than
    // left stale.
    //
    // Kept rather than deleted, with the assertion inverted: the second
    // treatment carries §36.6's four divergences and was rendered by nothing
    // from slice 8 until slice 9's wave 2. If it ever becomes unreachable
    // again, this is the line that says so.
    expect(reached('src/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure.tsx')).toBe(true)
  })

  it('records the CARD of `MOD-CC-13` as unmounted, which its header used to deny', () => {
    // `src/surfaces/cc/actions/ActionRail.tsx` is wave 0's module CARD, not
    // `cc-13/Cc13ActionRail.tsx`, which is `SB-16-02`'s control rail and is
    // mounted by eight route files. The card's header asserted in the present
    // tense that it "mounts inside the twelve module screens"; it mounts on
    // none, and cc-03 through cc-12 carry eleven assertions forbidding exactly
    // that import. This is the line that makes the corrected header a gate:
    // the day the surface index fills `CommandCenterShell`'s `actionRail` prop
    // with it, this reds and the header has to be rewritten rather than left
    // stale — the `DeterministicBoundary`/`ProvenanceMark` lesson applied to
    // the third instance of the shape.
    expect(reached('src/surfaces/cc/actions/ActionRail.tsx')).toBe(false)
    // Not vacuous by accident: the three data modules the card renders ARE
    // reached, through the eight screens that mount the control rail. So the
    // `false` above is about this component and not about its directory.
    expect(reached('src/surfaces/cc/actions/action-set.ts')).toBe(true)
    expect(reached('src/surfaces/cc/actions/outside-writes.ts')).toBe(true)
    expect(reached('src/surfaces/cc/actions/propagation.ts')).toBe(true)
  })
})

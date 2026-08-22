import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CC02_AS_OF_SPLIT,
  CC02_COLUMN_ORDER,
  CC02_DECISION_REFS,
  CC02_DECISIONS_HELD_ELSEWHERE,
  CC02_DISCLOSURES,
  CC02_MANUAL_CLOSE_LINK,
  CC02_MATRIX,
  CC02_ROLE_COLUMNS,
  cc02Affordance,
  cc02CellOutcome,
  cc02Row,
  type Cc02Row,
} from '@/surfaces/cc/modules/cc-02/matrix'
import {
  CC02_CONNECTIVITY_STATES,
  CC02_MARKER_STATES,
  CC02_OWNED_SCREEN_STATES,
  CC02_RUN_STATES,
  CC02_RUN_STATE_RENDERINGS,
  CC02_TENANT_BANNER_MINUTES,
  CC02_WRITES_RECORDS,
  SCR_CC_02_STATE_INVENTORY,
  assertChromeModule,
  cc02BannerShows,
  cc02PendingText,
} from '@/surfaces/cc/modules/cc-02/chrome'
import { CC_CHROME_MODULES } from '@/surfaces/cc/screens'
import { CC_CLAIMED_SLUGS, ccModule } from '@/surfaces/cc/modules'

/**
 * `MOD-CC-02` — SYNC STATE AND CONNECTIVITY, AS CHROME AND NEVER A ROUTE.
 *
 * WHAT THESE GATES ASK. Every expectation about the source is READ OFF THE
 * FROZEN SOURCE at test time and compared with what the module wrote. Nothing
 * below compares a string this task wrote against another string this task
 * wrote, and no count is taken from the array under test: "eight rows" comes
 * from counting the source's own table rows between its separator and its
 * first non-row line, never from `CC02_MATRIX.length`.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — one
 * defect per gate, in the shipping file the gate claims to protect, then
 * restored byte-identically. The `FAILS IF` note names the defect that was
 * ACTUALLY planted, never a convenient one.
 *
 * THREE OF SLICE 7'S ELEVEN BEATEN-GATE SHAPES WERE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and this card is the
 *    one where the difference is the whole ruling. The transcription gate
 *    compares cells with `toBe`, and the classifier gate asserts the two
 *    tokens map to DIFFERENT outcomes rather than merely asserting each maps
 *    to something.
 *  - A TABLE-SHAPE CHECK IS SATISFIED BY THE SEPARATOR ROW, because
 *    `|---|---|` splits into non-empty cells. The row count below is taken by
 *    walking from the separator to the first line that is not a table row,
 *    and the separator is excluded by position rather than by content.
 *  - A POSITION CHECK TRUE OF BOTH THE DEFECT AND ITS FIX. The
 *    transcription gate resolves each role's column INDEX from the header
 *    line at test time, so swapping two columns in the module moves the
 *    comparison too unless the header moved with it — which is why the
 *    header is asserted against L36450 separately and first.
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

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/**
 * The data rows of the table whose separator is at `separatorLine`, counted
 * off the source. Starts AFTER the separator and stops at the first line that
 * is not a table row, so the separator can never be counted as data and a
 * span written in a brief is never trusted for a count.
 */
function dataRows(separatorLine: number): { line: number; cells: string[] }[] {
  const out: { line: number; cells: string[] }[] = []
  for (let n = separatorLine + 1; isTableRow(srcLine(n)); n += 1) {
    out.push({ line: n, cells: cells(srcLine(n)) })
  }
  return out
}

const at = <T,>(xs: readonly T[], i: number, what: string): T => {
  const x = xs[i]
  if (x === undefined) throw new Error(`${what}: no member at ${i}`)
  return x
}

/* ==================================================================== *
 * THE MATRIX — EIGHT ROWS, SIX COLUMNS, COUNTED.
 * ==================================================================== */

describe('the MOD-CC-02 permission matrix', () => {
  // FAILS IF: the module's row count stops matching the source's. The
  // expectation is COUNTED off the source by walking from the separator to
  // the first non-row line — not read off a span, and not taken from
  // `CC02_MATRIX.length` compared with itself. The controller's counts have
  // been wrong six times in this slice for exactly the span reason.
  // PLANTED: deleted the whole `configure-the-connectivity-thresholds` row
  //   block from `src/surfaces/cc/modules/cc-02/matrix.ts`.
  // RED: expected [ { …(8) }, …(6) ] to have a length of 8 but got 7.
  // PLANTED FIRST, AND IT PROVED THE WRONG THING: renaming that row's
  //   `capability` instead of deleting it left the length at 8 and went red
  //   only on the transcription gate below. A count gate proved by a defect
  //   that changes no count is a count gate never exercised, so the plant
  //   was redone as a real deletion.
  it('carries as many rows as the source has, counted off the source', () => {
    const rows = dataRows(36451)
    expect(rows).toHaveLength(8)
    expect(at(rows, 0, 'first data row').line).toBe(36452)
    expect(at(rows, 7, 'last data row').line).toBe(36459)
    expect(CC02_MATRIX).toHaveLength(rows.length)
  })

  // FAILS IF: the header this module transcribed drifts from L36450. Asserted
  // BEFORE the cell-by-cell gate below, because that gate resolves its column
  // indices from this header — a header and a transcription drifting together
  // is the "position check true of both the defect and its fix" shape, and
  // pinning the header to the source line is what breaks the symmetry.
  // PLANTED: swapped 'Tenant Admin' and 'Worker' in `CC02_COLUMN_ORDER`.
  // RED: expected [ 'Capability on this module', 'Worker', ... ] to deeply
  //      equal [ 'Capability on this module', 'Tenant Admin', ... ].
  it('transcribes the header verbatim, Tenant Admin first', () => {
    expect([...CC02_COLUMN_ORDER]).toEqual(cells(srcLine(36450)))
    // The trap the common brief opens with: this card's order is NOT the
    // Frontline's. Asserted as a fact about the source, so it stays true of
    // the source rather than of this array.
    expect(cells(srcLine(36450))[1]).toBe('Tenant Admin')
    expect(cells(srcLine(36450))[5]).toBe('Worker')
  })

  // FAILS IF: any cell differs from the source cell in ITS OWN COLUMN. The
  // column index for each role is resolved from the header at test time and
  // the role-to-heading mapping is stated here rather than in the module, so
  // a positional transcription in the module cannot satisfy it by agreeing
  // with itself. Compared with `toBe` — never `toContain`, which `Allowed`
  // would satisfy inside `Allowed with conditions`.
  // PLANTED: changed row 3's TENANT_ADMIN cell from 'Allowed — named
  //   recipient' to 'Allowed with conditions — named recipient'.
  // RED: L36454 Tenant Admin -> expected 'Allowed with conditions — named
  //      recipient' to be 'Allowed — named recipient'.
  it('transcribes every cell header-keyed, cell by cell', () => {
    const heading: Record<(typeof CC02_ROLE_COLUMNS)[number], string> = {
      TENANT_ADMIN: 'Tenant Admin',
      SUPERVISOR: 'Supervisor',
      QUALITY_MANAGER: 'Quality Manager',
      READONLY_AUDITOR: 'Read-only Auditor',
      WORKER: 'Worker',
    }
    const header = cells(srcLine(36450))
    const rows = dataRows(36451)
    rows.forEach((srcRow, i) => {
      const mod = at(CC02_MATRIX as readonly Cc02Row[], i, 'matrix row')
      expect(`${mod.sourceRef}`).toBe(`L${srcRow.line}`)
      expect(mod.capability).toBe(at(srcRow.cells, 0, 'capability cell'))
      for (const role of CC02_ROLE_COLUMNS) {
        const col = header.indexOf(heading[role])
        expect(col).toBeGreaterThan(0)
        expect(mod.cells[role].verbatim).toBe(at(srcRow.cells, col, `${role} cell`))
      }
    })
  })

  // FAILS IF: the classifier reads `Allowed with conditions` as `Allowed`, or
  // the reverse. Asserts the two map to DIFFERENT outcomes rather than each
  // mapping to something — an assertion that each is "truthy" would pass on a
  // `startsWith` classifier, which is the exact defect this guards.
  // PLANTED: rewrote `cc02CellOutcome` to find its head with
  //   `Object.keys(OUTCOME_BY_HEAD).find((k) => verbatim.startsWith(k))`.
  // RED: expected [Function] to throw an error — and NOT on the outcome
  //      assertions, which stayed green. That is a finding about the defect
  //      rather than about the gate: `Object.keys` preserves insertion order
  //      and the shipped literal happens to enumerate 'Allowed with
  //      conditions' FIRST, so `startsWith` found the longer key and got row
  //      8 right by accident.
  // PLANTED AGAIN, WITH THE TWO KEYS SWAPPED, which is the same defect with
  //   the accident removed and is the state a later reorder would leave.
  // RED: expected 'allowed' to be 'allowedWithConditions' — row 8's
  //      Supervisor cell classified as a plain grant, which is the inversion
  //      this gate exists for. The exact-match classifier is immune to key
  //      order; a `startsWith` one is only ever accidentally correct.
  it('never reads a conditional grant as a plain one', () => {
    expect(cc02CellOutcome('Allowed')).toBe('allowed')
    expect(cc02CellOutcome('Allowed — named recipient')).toBe('allowed')
    expect(cc02CellOutcome('Allowed with conditions — same conditions')).toBe(
      'allowedWithConditions',
    )
    expect(cc02CellOutcome('Allowed')).not.toBe(cc02CellOutcome('Allowed with conditions'))
    // And the real cell, taken from the source rather than typed here.
    const supervisorCell = at(cells(srcLine(36459)), 2, 'row 8 Supervisor cell')
    expect(cc02CellOutcome(supervisorCell)).toBe('allowedWithConditions')
  })

  // FAILS IF: an untranscribed token silently becomes a grant. A classifier
  // that defaults is how a token nobody transcribed reads as `allowed`.
  // PLANTED: made `cc02CellOutcome` return 'allowed' instead of throwing.
  // RED: expected [Function] to throw an error.
  it('refuses a token this card does not use', () => {
    expect(() => cc02CellOutcome('Allowed with reservations')).toThrow()
  })
})

/* ==================================================================== *
 * CHROME, NEVER A ROUTE.
 * ==================================================================== */

describe('MOD-CC-02 owns no route', () => {
  // FAILS IF: the module acquires a slug, or leaves the chrome derivation.
  // The count is the SOURCE's criterion read at test time.
  // PLANTED: gave MOD-CC-02 `slug: 'sync-state'` in
  //   `src/surfaces/cc/modules.ts` — a file this task does not own, restored
  //   byte-identically immediately after.
  // RED: expected 'sync-state' to be null, and CC_CHROME_MODULES became [].
  it('abstains on the spine and appears as chrome instead', () => {
    expect(srcLine(35261)).toContain('AC-CC-040')
    expect(srcLine(35261)).toContain('no fourteenth module route exists')
    expect(ccModule('MOD-CC-02').slug).toBeNull()
    expect(ccModule('MOD-CC-02').noRouteReason).not.toBeNull()
    expect(CC_CHROME_MODULES).toContain('MOD-CC-02')
    expect(() => assertChromeModule('MOD-CC-02')).not.toThrow()
  })

  // FAILS IF: `assertChromeModule` passes for a module that is not chrome. A
  // gate that only ever asks the true case is a gate whose branch never fires
  // — slice 7 shipped one of those.
  // PLANTED: none needed; the false case is asserted directly. MOD-CC-01
  //   claims a route and MOD-CC-13 abstains without appearing on the
  //   register, so both are genuinely not chrome.
  it('refuses a routed module and an uncatalogued one', () => {
    expect(() => assertChromeModule('MOD-CC-01')).toThrow()
    expect(() => assertChromeModule('MOD-CC-13')).toThrow()
  })

  // FAILS IF: a route directory exists that no module on the spine claims —
  // which is what a fourteenth screen looks like on disk, and what routing
  // this module would produce. Walked off the tree, and foreign probes are
  // excluded so a concurrent sibling's scratch directory is not read as a
  // route.
  //
  // ASSERTED AGAINST THE SPINE'S CLAIMS, NOT AGAINST TODAY'S TREE. The first
  // writing compared the directory listing with the literal
  // `['sync-conflict-review-panel']`, which passes now and goes red the day
  // slice 9 builds the other eleven — a gate that must be edited to stay
  // green teaches people to edit it. `CC_CLAIMED_SLUGS` is eleven names none
  // of which is this module's, so the same defect is caught and the eleven
  // legitimate directories are not.
  // PLANTED: created `app/command-center/sync-state/` containing a
  //   `page.tsx`, then removed it.
  // RED: expected [ 'sync-conflict-review-panel', 'sync-state' ] to deeply
  //      equal [ 'sync-conflict-review-panel' ] under the literal form; under
  //      the form shipped here, expected [ 'sync-state' ] to have a length
  //      of 0 but got 1.
  it('leaves no route directory that no module on the spine claims', () => {
    const root = join(process.cwd(), 'app', 'command-center')
    const dirs = readdirSync(root)
      .filter((e) => !isForeignProbe(e))
      .filter((e) => statSync(join(root, e)).isDirectory())
      .sort()
    expect(dirs.filter((d) => !CC_CLAIMED_SLUGS.includes(d))).toHaveLength(0)
    // And no directory answers to this module under any name it might take.
    expect(dirs).not.toContain('sync-state')
    expect(dirs).not.toContain('sync-state-and-connectivity')
    // The spine claims eleven and none of them is MOD-CC-02's, because it
    // claims none. Read off the spine, not typed here.
    expect(CC_CLAIMED_SLUGS).not.toContain(ccModule('MOD-CC-02').slug)
  })

  // FAILS IF: this module starts writing. Stated three times on the card and
  // read off all three lines here, because chrome that acquired a write is
  // the same defect as chrome that acquired a route.
  // PLANTED: set `CC02_WRITES_RECORDS = true`.
  // RED: expected true to be false.
  it('writes no records, as the card says three times', () => {
    expect(srcLine(36465)).toContain('The module writes no records')
    expect(srcLine(36467)).toContain('None directly')
    expect(srcLine(36516)).toContain('The module writes no records')
    expect(CC02_WRITES_RECORDS).toBe(false)
  })
})

/* ==================================================================== *
 * THE CROSS-SURFACE ROW. THE LINK IS NOT THE ACT.
 * ==================================================================== */

describe('row 8 is a link out and never a control', () => {
  // FAILS IF: the fold consults the permission token before the surface. This
  // is the whole trap: row 8 is an `another-surface` row whose Supervisor and
  // Quality Manager cells both open `Allowed with conditions`, which is
  // exactly the shape `src/surfaces/doh/boundary.ts` records as unexercised
  // in slice 6.
  // PLANTED: reordered `cc02Affordance` to
  //   `if (row.cells.SUPERVISOR.outcome !== 'explicitlyProhibited') return 'chrome'`
  //   before the surface question.
  // RED: expected 'chrome' to be 'link-out'.
  it('classifies the manual close by surface, not by token', () => {
    const row = cc02Row('manually-close-a-stuck-run')
    expect(row.surface).toBe('another-surface')
    expect(row.cells.SUPERVISOR.outcome).toBe('allowedWithConditions')
    expect(row.cells.QUALITY_MANAGER.outcome).toBe('allowedWithConditions')
    expect(cc02Affordance(row)).toBe('link-out')
    expect(cc02Affordance(row)).not.toBe('chrome')
  })

  // FAILS IF: the fold lets a permissive token on an unreachable adjacent row
  // through as chrome. Asked on a CONSTRUCTED row rather than only on the
  // eight real ones, because no real row has that combination and a gate whose
  // only firing branch cannot fire is one of slice 7's eleven shapes.
  // PLANTED: same reordering as above.
  // RED: expected 'chrome' to be 'never-drawn'.
  it('draws nothing for an adjacent row the source offers no path to', () => {
    const constructed: Cc02Row = {
      ...cc02Row('manually-close-a-stuck-run'),
      reachableFromHere: false,
    }
    expect(cc02Affordance(constructed)).toBe('never-drawn')
    // And every real adjacent row that is not the close.
    for (const row of CC02_MATRIX) {
      if (row.surface === 'another-surface' && row.id !== 'manually-close-a-stuck-run') {
        expect(cc02Affordance(row)).toBe('never-drawn')
      }
    }
  })

  // FAILS IF: the cell's three clauses stop being three. Read off the source
  // cell rather than off the module, and each clause asserted separately so
  // dropping the link clause — the one that makes the whole cell a link-out —
  // cannot be hidden by the other two.
  // PLANTED: dropped `reached by a link from the drill` from the module's
  //   Supervisor cell verbatim.
  // RED: the header-keyed transcription gate went red first, on the whole
  //   cell; this gate then went red on `reached by a link from the drill`.
  it('reads the act to the Hub and the link to here', () => {
    const cell = at(cells(srcLine(36459)), 2, 'row 8 Supervisor cell')
    expect(cell).toContain('performed on the Delivery Operations Hub run record')
    expect(cell).toContain('with a mandatory note')
    expect(cell).toContain('reached by a link from the drill')
    expect(cc02Row('manually-close-a-stuck-run').cells.SUPERVISOR.verbatim).toBe(cell)
    // The card says the same twice more, in its own voice.
    expect(srcLine(36467)).toContain('is executed there, not here')
    expect(srcLine(36551)).toContain('Offer a link to manual close')
    expect(CC02_MANUAL_CLOSE_LINK.owningSurface).toBe('SURF-DOH')
  })

  // FAILS IF: the link record grows the act. There is no handler, no note
  // field and no submit on `Cc02LinkOut` by construction; this asserts the
  // exclusion it rests on is real and still absolute.
  // PLANTED: added `note: ''` to `CC02_MANUAL_CLOSE_LINK`.
  // RED: expected [ 'destination', ..., 'note' ] not to contain 'note'.
  it('carries a destination and a precondition and no act', () => {
    expect(srcLine(38704)).toContain('It cannot edit any record or any configuration')
    expect(srcLine(38707)).toContain('They are properties of the surface')
    expect(Object.keys(CC02_MANUAL_CLOSE_LINK)).not.toContain('note')
    expect(Object.keys(CC02_MANUAL_CLOSE_LINK)).not.toContain('onClose')
    expect(CC02_MANUAL_CLOSE_LINK.notOfferedHere.length).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * THE DECISIONS — TWO DISCLOSED, ONE DELIBERATELY NOT RESPELLED.
 * ==================================================================== */

describe('the decisions §21.5 names, and the one it does not', () => {
  // FAILS IF: the brief's claim that L36459 carries `DEC-STUCK-001` is taken
  // on trust. It does not: the two places this card names a decision for the
  // manual close both name `DEC-CCWRITE-001`. Asserted off the source.
  // PLANTED: nothing to plant — this gate asserts a fact about the frozen
  //   source that the module's comment reports. Proved instead by asserting
  //   BOTH directions, so it cannot pass vacuously.
  it('finds DEC-CCWRITE-001 on the card and DEC-STUCK-001 nowhere in it', () => {
    expect(srcLine(36551)).toContain('DEC-CCWRITE-001')
    expect(srcLine(36614)).toContain('DEC-CCWRITE-001')
    expect(srcLine(36459)).not.toContain('DEC-')
    // §21.5 runs from its heading to the rule that closes it.
    const section = LINES.slice(36427 - 1, 36616).join('\n')
    expect(section).toContain('DEC-CCWRITE-001')
    expect(section).toContain('DEC-REFRESH-001')
    expect(section).not.toContain('DEC-STUCK-001')
    expect(CC02_DECISION_REFS).toEqual(['DEC-CCWRITE-001'])
  })

  // FAILS IF: either identifier is lifted into the shared canon and this
  // stand-in stays. Reads the canon's union out of the FILE rather than
  // importing a list, exactly as MOD-FL-B11 does, so the moment a later task
  // adds one this suite goes red and forces the switch.
  // PLANTED: added `| 'DEC-CCWRITE-001'` to the `DecisionId` union in
  //   `src/disclosure/decisions.ts`, a file this task does not own, restored
  //   byte-identically immediately after.
  // RED: expected true to be false — 'DEC-CCWRITE-001' present in the canon.
  it('asserts both identifiers are still ABSENT from the shared canon', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const union = canon.slice(canon.indexOf('export type DecisionId'))
    const members = union.slice(0, union.indexOf('\n\n'))
    for (const ref of CC02_DECISION_REFS) {
      expect(members.includes(`'${ref}'`)).toBe(false)
    }
    // The disclosures say so on their own records, so a reader of the file
    // learns it too.
    for (const d of CC02_DISCLOSURES) {
      expect(d.canonNote).toContain('twenty-nine members')
    }
  })

  // FAILS IF: this module grows a spelling of a decision another module
  // already holds, or a holder stops holding it. Both halves matter: the
  // second is what makes the first safe to leave undisclosed here.
  //
  // THE SECOND ROW OF THIS REGISTER WAS FOUND LATE, AND IT IS THE FINDING.
  // `DEC-REFRESH-001` was written as a full local disclosure here first —
  // five readings, its own canonNote — before a sweep of `app/` turned up
  // `app/super-admin/tenant-configuration-registry/fixtures.ts` already
  // carrying it with the same L35839 locator and an entry rule. That is the
  // defect this build records most often, written by the task warned about
  // it. The record was deleted and replaced with the pointer below.
  // PLANTED: appended 'DEC-STUCK-001' to `CC02_DECISION_REFS` and gave
  //   `CC02_DISCLOSURES` a matching record.
  // RED: expected [ 'DEC-CCWRITE-001', …(2) ] to deeply equal [ Array(2) ].
  it('respells no decision another module already holds', () => {
    expect(CC02_DISCLOSURES.map((d) => d.decisionRef)).toEqual([...CC02_DECISION_REFS])
    const held = CC02_DECISIONS_HELD_ELSEWHERE.map((d) => d.decisionRef)
    expect(held).toEqual(['DEC-STUCK-001', 'DEC-REFRESH-001'])
    // No identifier is both disclosed here and held elsewhere.
    for (const ref of CC02_DECISION_REFS) expect(held).not.toContain(ref)
    // And every named holder still holds it — at its locator, and from
    // OUTSIDE this module. Both halves are load-bearing: without the second,
    // pointing `heldBy` at this very file passes, because this file names all
    // three identifiers. That plant went green and the gate was rewritten.
    for (const d of CC02_DECISIONS_HELD_ELSEWHERE) {
      expect(d.heldBy.length).toBeGreaterThan(0)
      for (const file of d.heldBy) {
        expect(file.startsWith('src/surfaces/cc/modules/cc-02/')).toBe(false)
        const text = readFileSync(join(process.cwd(), file), 'utf8')
        expect(text).toContain(d.decisionRef)
        expect(text).toContain(d.heldByLocator)
      }
    }
    // And the reason this module is in DEC-STUCK-001's blast radius at all is
    // the coverage map, not §21.5.
    expect(srcLine(4371)).toContain('AC-COV-093')
    expect(srcLine(4371)).toContain('DEC-STUCK-001')
    expect(srcLine(36433)).toContain('Source section: §6.2')
  })

  // FAILS IF: this module asserts a state for a manually closed run. The card
  // states Reading B as flat fact at L36485 and L27917 states Reading A;
  // AC-RUN-004 refuses both. Neither may become a rule here.
  //
  // STRUCTURAL, NOT TEXTUAL, AND THE FIRST WRITING OF THIS GATE WAS TEXTUAL
  // AND COULD NOT PASS. It swept the chrome file for `manuallyClosedGoesTo`
  // and went red on the shipped tree — because the module's own comment names
  // the field it refuses to have. A sweep of source text cannot tell a
  // declaration from a sentence about one, which is a fresh instance of
  // slice 7's "allowance that took its allowed string from the value under
  // test". The gate now reads the module's EXPORTS and the transitions it
  // publishes, neither of which a comment can satisfy.
  // PLANTED: added `export const manuallyClosedGoesTo = 'submitted'` to
  //   `chrome.ts`, and separately appended ', or by a manual close' to the
  //   `submitted` rendering's `enteredBy`.
  // RED: expected [ ... 'manuallyClosedGoesTo' ] to have a length of 0
  //      but got 1; and expected 'the worker declaring their part finished;
  //      held here while devices owe data, or by a manual close' not to
  //      contain 'manual'.
  it('renders three run states and routes a manual close into none of them', async () => {
    expect(srcLine(36485)).toContain('stands submitted with the gap recorded')
    expect(srcLine(27917)).toContain('`complete` at close time')
    expect(srcLine(7128)).toContain('neither reading is adopted here')
    expect([...CC02_RUN_STATES]).toEqual(['submitted', 'complete', 'finished'])

    const chrome = await import('@/surfaces/cc/modules/cc-02/chrome')
    expect(Object.keys(chrome).filter((k) => /close|Closed|stuck/i.test(k))).toHaveLength(0)
    for (const r of CC02_RUN_STATE_RENDERINGS) {
      expect(r.enteredBy.toLowerCase()).not.toContain('manual')
      expect(r.enteredBy.toLowerCase()).not.toContain('close')
    }
  })
})

/* ==================================================================== *
 * THE STATE INVENTORY — THIRTEEN, AND IT IS THE SCREEN'S.
 * ==================================================================== */

describe("SCR-CC-02's state inventory", () => {
  // FAILS IF: a row is dropped. THIS IS THE BRIEF CORRECTION: the dispatch
  // gave the span as L48462-L48475, which stops at STATE-12 and drops
  // STATE-13 Recovery. Counted off the source by walking to the first
  // non-row line, so the brief's span cannot be what is checked.
  // PLANTED: deleted the STATE-13 record from the chrome module — which is
  //   precisely the shape the brief's span would have produced.
  // RED: expected 12 to be 13.
  it('holds thirteen rows, counted rather than read off a span', () => {
    const rows = dataRows(48463)
    expect(rows).toHaveLength(13)
    expect(at(rows, 12, 'last state row').line).toBe(48476)
    expect(srcLine(48476)).toContain('STATE-13')
    expect(SCR_CC_02_STATE_INVENTORY).toHaveLength(rows.length)
  })

  // FAILS IF: any row's rendering drifts from the source cell. Cell by cell
  // against the row's own line, and `toBe` rather than `toContain`.
  // PLANTED: changed STATE-08's `seen` from '"Synced 13:58 · all 3 devices
  //   offline"' to '"Synced 13:58 · 3 devices offline"'.
  // RED: L48471 -> expected '"Synced 13:58 · 3 devices offline" on the
  //      tile; ...' to be '"Synced 13:58 · all 3 devices offline" on the
  //      tile; ...'.
  it('transcribes every row against its own line', () => {
    const rows = dataRows(48463)
    rows.forEach((srcRow, i) => {
      const mod = at(SCR_CC_02_STATE_INVENTORY, i, 'state row')
      expect(mod.sourceRef).toBe(`L${srcRow.line}`)
      expect(at(srcRow.cells, 0, 'state cell')).toContain(mod.id)
      expect(at(srcRow.cells, 0, 'state cell')).toContain(mod.name)
      expect(mod.seen).toBe(at(srcRow.cells, 1, 'seen cell'))
    })
  })

  // FAILS IF: the table is claimed for this module. L48460 says whose it is,
  // and only two of its thirteen rows are chrome.
  // PLANTED: set every row's `owner` to 'MOD-CC-02'.
  // RED: expected [ 'STATE-01', ... 13 ids ] to deeply equal
  //      [ 'STATE-07', 'STATE-08' ].
  it('belongs to the screen, and two of its rows to this module', () => {
    expect(srcLine(48460)).toContain('Full state inventory for `SCR-CC-02`')
    expect([...CC02_OWNED_SCREEN_STATES]).toEqual(['STATE-07', 'STATE-08'])
  })
})

/* ==================================================================== *
 * THE MARKER, THE BANNER, AND THE COUNTS.
 * ==================================================================== */

describe('the marker and the connectivity protocol', () => {
  // FAILS IF: the card's four marker states and the storyboard's four are
  // merged. They are two different sets of four sharing three members, and
  // `unknown-pending` is the one the storyboard has no slot for.
  // PLANTED: gave `unknown-pending` the storyboard wording of state two.
  // RED: expected 'Synced 09:11 · 1 of 3 devices offline · pending captures
  //      unknown' to be null.
  it('keeps the card’s four apart from the storyboard’s four', () => {
    expect(srcLine(36575)).toContain('the marker in its four states')
    expect(srcLine(36469)).toContain('Marker states: live-all-synced')
    expect(CC02_MARKER_STATES).toHaveLength(4)
    for (const s of CC02_MARKER_STATES) {
      expect(srcLine(36469)).toContain(s.cardWording)
    }
    const unknown = CC02_MARKER_STATES.find((s) => s.id === 'unknown-pending')
    expect(unknown?.storyboardWording).toBeNull()
    // The storyboard's third slot is the banner, not a marker state.
    expect(srcLine(36581)).toContain('State three, site-wide')
    expect(srcLine(36581)).toContain('full-width amber banner')
  })

  // FAILS IF: an unknown pending count renders as a zero. `AC-CC-182`
  // (L36593) is the criterion and L36483 is the rule.
  // PLANTED: made `cc02PendingText` return `${pending} pending captures` for
  //   every input, so 'unknown' rendered as 'unknown pending captures'.
  // RED: expected 'unknown pending captures' to be 'pending captures unknown'
  //      — and the zero assertion below stayed green, which is why BOTH are
  //      asserted: the second plant, returning '0 pending captures' for
  //      'unknown', is the one a single assertion would have missed.
  it('states unknown rather than zero', () => {
    expect(srcLine(36593)).toContain('never as zero')
    expect(srcLine(36483)).toContain('states unknown rather than zero')
    expect(cc02PendingText('unknown')).toBe('pending captures unknown')
    expect(cc02PendingText('unknown')).not.toContain('0')
    expect(cc02PendingText(0)).toBe('0 pending captures')
  })

  // FAILS IF: the banner is guessed when the elapsed time is unknown, or
  // rendered at a threshold that is not the tenant one. L36587 makes
  // withholding the terminal safe state.
  // PLANTED: changed `cc02BannerShows` to
  //   `elapsedMinutes === 'unknown' || elapsedMinutes >= 60`.
  // RED: expected true to be false.
  it('withholds the banner on an unknown site state rather than guessing', () => {
    expect(srcLine(36587)).toContain('withheld rather than guessed')
    expect(cc02BannerShows('unknown')).toBe(false)
    expect(cc02BannerShows(59)).toBe(false)
    expect(cc02BannerShows(60)).toBe(true)
    expect(CC02_TENANT_BANNER_MINUTES).toBe(60)
  })

  // FAILS IF: a platform-side threshold acquires a tenant audience. Two of
  // the three thresholds are explicitly not tenant channels.
  // PLANTED: changed the 30-minute state's recipient to the Tenant Admin.
  // RED: expected 'Tenant Admin' to be "The client's Super Admin platform
  //      team".
  it('gives each threshold the audience its notification row names', () => {
    const rows = dataRows(36508)
    expect(rows).toHaveLength(4)
    const withThreshold = CC02_CONNECTIVITY_STATES.filter((s) => s.thresholdMinutes !== null)
    expect(withThreshold).toHaveLength(3)
    expect(withThreshold.map((s) => s.thresholdMinutes)).toEqual([30, 60, 120])
    expect(srcLine(36509)).toContain('not a tenant channel')
    expect(srcLine(36511)).toContain('not a tenant channel')
    expect(srcLine(36510)).not.toContain('not a tenant channel')
    for (const s of withThreshold) {
      expect(s.recipient).not.toBeNull()
      expect(srcLine(Number(s.sourceRef.split('L').pop()))).toContain(String(s.recipient))
    }
  })

  // FAILS IF: row 4's two halves are collapsed into one answer for the Tenant
  // Admin. The matrix cell grants and the functionality refuses, and this
  // build records both rather than choosing.
  // PLANTED: changed the late-arrival half's `rolesProhibited` to
  //   'Read-only Auditor, Worker'.
  // RED: expected 'Read-only Auditor, Worker' to contain 'Tenant Admin'.
  it('records both answers the card gives the Tenant Admin on row 4', () => {
    expect(cc02Row('see-as-of-stamps').cells.TENANT_ADMIN.outcome).toBe('allowed')
    expect(CC02_AS_OF_SPLIT).toHaveLength(2)
    const stamp = at(CC02_AS_OF_SPLIT, 0, 'as-of half')
    const late = at(CC02_AS_OF_SPLIT, 1, 'late half')
    expect(srcLine(36542)).toContain(stamp.rolesAllowed)
    expect(srcLine(36543)).toContain(late.rolesProhibited)
    expect(late.rolesProhibited).toContain('Tenant Admin')
    expect(stamp.rolesAllowed).not.toContain('Tenant Admin')
  })
})

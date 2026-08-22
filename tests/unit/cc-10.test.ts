import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  S366_COLUMNS,
  S366_DIVERGENCES,
} from '@/surfaces/cc/modules/cc-10-s366/matrix'
import { CC_EXCLUDED_ROLES, isCcExcludedRole } from '@/surfaces/cc/access'
import { ccScreen, ccScreenSlug, CC_NAV } from '@/surfaces/cc/screens'
import {
  CC10_COLUMNS,
  CC10_COLUMN_ROLE,
  CC10_MATRIX,
  CC10_CELL_COUNT,
  CC10_RESOLUTION_ROW_ORDINALS,
  CC10_TOKENS,
  cc10Outcome,
  cc10Row,
  type Cc10Column,
} from '@/surfaces/cc/modules/cc-10/matrix'
import {
  CC10_ACTION_5_DIVERGENT_COLUMNS,
  CC10_ACTION_5_NAME_SPELLINGS,
  CC10_ACTION_5_STATEMENTS,
  CC10_ACTION_RAIL_MOUNT,
  CC10_CAP,
  CC10_CAP_DISCLOSURE,
  CC10_CLOCK_SKEW_LINK_OUT,
  CC10_DISCLOSURES,
  CC10_FRESHNESS,
  CC10_FRESHNESS_MET,
  CC10_IDENTITY,
  CC10_PATHNAME,
  CC10_RESOLVE_ALL_EXCLUSION,
  CC10_SCREEN,
  CC10_SEAM,
  CC10_SEAM_STATUS,
  CC10_SECOND_TREATMENT,
  CC10_SLUG,
  CC10_STORYBOARD,
  CC10_STORYBOARD_VERSIONS,
  cc10ColumnsProhibitedThroughout,
  cc10SupervisorHoldsNoResolutionPower,
} from '@/surfaces/cc/modules/cc-10/service'

/**
 * `MOD-CC-10`, chapter 21, AGAINST THE FROZEN SOURCE PARSED AT RUN TIME.
 *
 * Nothing here compares the transcription against a copy of itself. Every
 * count is taken by walking the source's own lines — the row count by
 * scanning forward from the first data line until the table stops, never by
 * subtracting the ends of a span, which is the single cause of all six of
 * this slice's wrong controller counts.
 *
 * Every gate below was planted against and observed red; the plants are
 * recorded in the task report with what each one turned.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const sourceLines = readFileSync(SOURCE_PATH, 'utf8').split('\n')

const L = (n: number): string => {
  const line = sourceLines[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}

/** A markdown row split into its cells, backticks stripped so BOTH dialects parse. */
const cellsOf = (n: number): string[] =>
  L(n)
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim().replace(/`/g, ''))

const HEADER = 38082
const SEPARATOR = 38083
const FIRST_DATA = 38084

/**
 * Where the table body actually stops, MEASURED. Scans forward from the first
 * data line while a line is still a table row. Subtracting the ends of the
 * span would be the arithmetic this slice has been bitten by six times; this
 * is the count.
 */
const measuredDataLines: number[] = (() => {
  const out: number[] = []
  for (let n = FIRST_DATA; ; n += 1) {
    const line = L(n)
    if (!/^\s*\|/.test(line)) break
    out.push(n)
  }
  return out
})()

describe('MOD-CC-10 chapter-21 matrix — shape, counted from the source', () => {
  it('the body runs L38084 to L38091 and stops there, because the next line is not a table row', () => {
    expect(measuredDataLines[0]).toBe(38084)
    expect(measuredDataLines[measuredDataLines.length - 1]).toBe(38091)
    expect(L(38092).trim()).toBe('')
    expect(L(38093)).toContain('**Preconditions.**')
  })

  it('is EIGHT data rows, and the transcription carries exactly those eight lines', () => {
    expect(measuredDataLines).toHaveLength(8)
    expect(CC10_MATRIX).toHaveLength(8)
    expect(CC10_MATRIX.map((r) => r.sourceRef)).toEqual(measuredDataLines.map((n) => `L${n}`))
  })

  it('is SIX columns in the header and separator, so FIVE persona columns and FORTY cells', () => {
    // The separator is asked for its OWN width rather than trusted: `|---|---|`
    // splits into non-empty cells and has satisfied a table-shape check in this
    // build before, so it is compared against the header rather than counted alone.
    expect(cellsOf(HEADER)).toHaveLength(6)
    expect(cellsOf(SEPARATOR)).toHaveLength(6)
    expect(cellsOf(SEPARATOR).every((c) => /^-{3,}$/.test(c))).toBe(true)
    expect(CC10_COLUMNS).toHaveLength(5)
    expect(CC10_CELL_COUNT).toBe(40)
    expect(CC10_CELL_COUNT).toBe(measuredDataLines.length * (cellsOf(HEADER).length - 1))
  })

  it('every data row is six cells wide in the source too', () => {
    for (const n of measuredDataLines) expect(cellsOf(n)).toHaveLength(6)
  })
})

describe('MOD-CC-10 — the column order is this matrix’s own, Tenant Admin first', () => {
  it('CC10_COLUMNS is L38082’s own five persona headers, in L38082’s order', () => {
    const [capabilityHeader, ...personas] = cellsOf(HEADER)
    expect(capabilityHeader).toBe('Capability on this module')
    expect([...CC10_COLUMNS]).toEqual(personas)
    // Stated positionally as well, because the equality above would also pass
    // on a reversed pair if both files were reversed together — these two come
    // off the source line, not off the constant.
    expect(personas[0]).toBe('Tenant Admin')
    expect(personas[personas.length - 1]).toBe('Worker')
  })

  it('is NOT the Frontline order, and that is measured against a Frontline header', () => {
    // L41295 is MOD-FL-A7's header: Worker first, and it carries a sixth column.
    const flPersonas = cellsOf(41295).slice(1)
    expect(flPersonas[0]).toBe('Worker')
    expect(flPersonas).toContain('Tenant Admin')
    expect(flPersonas.indexOf('Tenant Admin')).toBeGreaterThan(flPersonas.indexOf('Worker'))
    // The Command Center matrix inverts exactly that pair.
    const ccPersonas = cellsOf(HEADER).slice(1)
    expect(ccPersonas.indexOf('Tenant Admin')).toBeLessThan(ccPersonas.indexOf('Worker'))
  })

  it('maps each header to exactly one RoleId, and the five are distinct', () => {
    const roles = CC10_COLUMNS.map((c) => CC10_COLUMN_ROLE[c])
    expect(new Set(roles).size).toBe(5)
  })
})

describe('MOD-CC-10 — every cell, transcribed header-keyed against its own line', () => {
  it('all forty cells match the source cell for the same row AND the same column name', () => {
    for (const row of CC10_MATRIX) {
      const n = Number(row.sourceRef.slice(1))
      const cells = cellsOf(n)
      const headers = cellsOf(HEADER)
      expect(cells[0]).toBe(row.capability)
      for (const column of CC10_COLUMNS) {
        // The column is found by NAME in the header, so a positional slip in
        // either file cannot pass: the index comes from the source's header
        // line, and the value from the transcription's keyed record.
        const at = headers.indexOf(column)
        expect(at).toBeGreaterThan(0)
        expect(row.cells[column].text).toBe(cells[at])
      }
    }
  })

  it('the tokens in THIS matrix carry no backticks, unlike every Frontline matrix', () => {
    for (const n of [HEADER, ...measuredDataLines]) expect(L(n)).not.toContain('`')
    // Measured contrast rather than an assertion about nothing: the comparable
    // Frontline data row is dense with them.
    expect(L(41297).split('`').length - 1).toBeGreaterThan(8)
  })

  it('every cell head is EXACTLY one of the four tokens — never a prefix match', () => {
    const seen = new Set<string>()
    for (const row of CC10_MATRIX) {
      for (const column of CC10_COLUMNS) {
        const { text, token, note } = row.cells[column]
        const [head, ...rest] = text.split(' — ')
        expect(head).toBe(token)
        expect(CC10_TOKENS.some((t) => t === head)).toBe(true)
        expect(note).toBe(rest.length === 0 ? null : rest.join(' — '))
        seen.add(token)
      }
    }
    expect([...seen].sort()).toEqual([...CC10_TOKENS].sort())
  })

  it('the two prefix collisions are both PRESENT, so the exact-head rule is load-bearing', () => {
    // If either of these ever stopped being a prefix collision, the exactness
    // above would be guarding nothing and this test says so.
    const skew = cc10Row(5).cells['Quality Manager']
    expect(skew.text.startsWith('Allowed')).toBe(true)
    expect(skew.token).toBe('Allowed with conditions')
    expect(skew.note).toBe('individually only; never through Resolve All')
    expect(cc10Outcome(5, 'Quality Manager')).toBe('allowedWithConditions')

    const threshold = cc10Row(8).cells['Tenant Admin']
    expect(threshold.text.startsWith('Explicitly prohibited')).toBe(true)
    expect(threshold.token).toBe('Explicitly prohibited')
    expect(threshold.note).toContain('a tenant setting in the Delivery Operations Hub')
  })

  it('the token census over the forty cells', () => {
    const tally = new Map<string, number>()
    for (const row of CC10_MATRIX) {
      for (const column of CC10_COLUMNS) {
        const t = row.cells[column].token
        tally.set(t, (tally.get(t) ?? 0) + 1)
      }
    }
    expect(tally.get('Allowed')).toBe(6)
    expect(tally.get('Allowed with conditions')).toBe(1)
    expect(tally.get('Read-only')).toBe(2)
    expect(tally.get('Explicitly prohibited')).toBe(31)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(40)
  })

  it('only ONE of the thirty-one prohibitions carries a note, and it is row 8’s Tenant Admin', () => {
    const noted = CC10_MATRIX.flatMap((r) =>
      CC10_COLUMNS.filter((c) => r.cells[c].note !== null).map((c) => `${r.ordinal}:${c}`),
    )
    expect(noted.sort()).toEqual(['5:Quality Manager', '8:Tenant Admin'])
  })
})

describe('MOD-CC-10 — what the matrix decides, read off it rather than restated', () => {
  it('AC-CC-348 (L38227): Supervisors view and reach no resolution', () => {
    expect(L(38227)).toContain(
      'Supervisors can view the panel and cannot reach any resolution endpoint',
    )
    expect(cc10Outcome(1, 'Supervisor')).toBe('readOnly')
    expect(cc10Outcome(2, 'Supervisor')).toBe('readOnly')
    expect(cc10SupervisorHoldsNoResolutionPower()).toBe(true)
    // The three resolution rows are rows 3, 4 and 5 by their own capability text.
    expect(CC10_RESOLUTION_ROW_ORDINALS.map((n) => cc10Row(n).capability)).toEqual([
      'Resolve an individual ordinary conflict',
      'Resolve All ordinary conflicts',
      'Resolve a skew-flagged conflict',
    ])
  })

  it('and row 6 is NOT one of them — a Supervisor MAY flag a wrong resolution', () => {
    // The reason CC10_RESOLUTION_ROW_ORDINALS is a list and not a substring
    // rule: "resolution" appears in row 6's capability and row 6 is permissive.
    expect(cc10Row(6).capability).toContain('resolution')
    expect(CC10_RESOLUTION_ROW_ORDINALS).not.toContain(6)
    expect(cc10Outcome(6, 'Supervisor')).toBe('allowed')
    expect(L(38225)).toContain('opens the append-only correction path and does not alter the sync')
  })

  it('the surface exclusion and the matrix agree on the Worker and the Read-only Auditor', () => {
    // Two independent places in the source — L34963/L34965 for the door, the
    // eight matrix rows for the cells — and the two files are compared rather
    // than either asserting it alone.
    const prohibitedThroughout = cc10ColumnsProhibitedThroughout()
    expect(prohibitedThroughout).toContain('Worker')
    expect(prohibitedThroughout).toContain('Read-only Auditor')
    for (const column of prohibitedThroughout) {
      const role = CC10_COLUMN_ROLE[column as Cc10Column]
      if (column === 'Tenant Admin') continue
      expect(isCcExcludedRole(role)).toBe(true)
    }
    for (const role of CC_EXCLUDED_ROLES) {
      const column = CC10_COLUMNS.find((c) => CC10_COLUMN_ROLE[c] === role)
      expect(column).toBeDefined()
      expect(prohibitedThroughout).toContain(column)
    }
  })

  it('the Tenant Admin is prohibited throughout HERE and is NOT excluded from the surface', () => {
    // The interesting asymmetry, and the reason the loop above skips it: three
    // columns are prohibited on all eight rows, and only two of the three are
    // shut out at the door. A gate that mapped "prohibited throughout" onto
    // "excluded role" would be wrong by exactly this column.
    expect(cc10ColumnsProhibitedThroughout()).toHaveLength(3)
    expect(isCcExcludedRole('TENANT_ADMIN')).toBe(false)
    expect(cc10Outcome(1, 'Tenant Admin')).toBe('explicitlyProhibited')
  })

  it('the register row L48395 and the matrix agree on who may open it', () => {
    const registerCells = cellsOf(48395)
    expect(registerCells[0]).toBe('SCR-CC-10')
    expect(registerCells[3]).toBe('Supervisor for viewing, Quality Manager for resolution')
    expect(ccScreen('SCR-CC-10').rolesColumn).toBe(registerCells[3])
    // "for viewing" against Read-only, "for resolution" against Allowed.
    expect(cc10Outcome(1, 'Supervisor')).toBe('readOnly')
    expect(cc10Outcome(3, 'Quality Manager')).toBe('allowed')
  })
})

describe('MOD-CC-10 — identity, storyboard and interconnection, each at its own line', () => {
  /**
   * THE CARD SPAN IS MEASURED, AND THE OLD ONE ENDED ON A BLANK LINE.
   * `cardSpan` read `L38048-L38246` and that line carries nothing at all —
   * the fourth module card span in this build to stop on a blank, and the
   * first one found in a shipping file rather than in a dispatch. The card's
   * last line of content is the `**Source status.**` paragraph; below it are
   * a blank, a horizontal rule and another blank before the next heading.
   *
   * The old gate asserted the span against a literal it also declared, so it
   * could not tell a span from a typo. This one walks the source: forward
   * from the heading to the line before the next `## 21.` heading, then back
   * over every blank and rule. The dispatch's own span for this card,
   * `L38048-L38079`, stops before the matrix, the storyboard, the
   * functionalities and every acceptance criterion.
   *
   * FAILS IF: the span is moved to a blank line again. Planted by restoring
   * `L38048-L38246`; red with the measured end line beside it.
   */
  it('the card runs from its heading to its last line of content, measured', () => {
    expect(L(38048)).toBe('## 21.13 Module `MOD-CC-10` — The Sync-Conflict Review Panel')
    expect(L(38247)).toContain('## 21.14 Module `MOD-CC-11`')

    let end = 38247 - 1
    while (L(end).trim() === '' || L(end).trim() === '---') end -= 1
    expect(CC10_IDENTITY.cardSpan).toBe(`L38048-L${end}`)
    expect(L(end).trim()).not.toBe('')
    expect(L(end)).toContain('**Source status.**')
    // And the line the span used to name carries nothing.
    expect(L(38246).trim()).toBe('')
  })

  it('identity, purpose and user benefit each match the line the record names', () => {
    expect(L(Number(CC10_IDENTITY.identityRef.slice(1)))).toContain(
      `Name: ${CC10_IDENTITY.name}. Owning surface: Client Command Center (\`SURF-CC\`). Source section: ${CC10_IDENTITY.sourceSection}.`,
    )
    expect(L(Number(CC10_IDENTITY.purposeRef.slice(1)))).toContain(CC10_IDENTITY.purpose)
    expect(L(Number(CC10_IDENTITY.userBenefitRef.slice(1)))).toContain(CC10_IDENTITY.userBenefit)
    expect(L(Number(CC10_IDENTITY.inventoryRef.slice(1)))).toContain('`MOD-CC-10`')
  })

  it('SB-CC-21 occurs exactly once in all 122,241 lines, and its arithmetic reconciles', () => {
    // 122,241 lines, and the array is 122,242 because the file ends in a
    // newline. Stated as the measurement rather than as the round number, so
    // this cannot quietly become an off-by-one that hides a truncated read.
    expect(sourceLines[sourceLines.length - 1]).toBe('')
    expect(sourceLines.length - 1).toBe(122241)
    const hits = sourceLines.filter((l) => l.includes('SB-CC-21'))
    expect(hits).toHaveLength(1)
    expect(L(Number(CC10_STORYBOARD.titleRef.slice(1)))).toContain('SB-CC-21')

    expect(L(38146)).toContain(CC10_STORYBOARD.header)
    expect(L(38157)).toContain(CC10_STORYBOARD.panelControl)
    // 3 conflicts, 1 skew-flagged, 2 ordinary — the header and the control agree.
    expect(CC10_STORYBOARD.totalConflicts - CC10_STORYBOARD.skewFlagged).toBe(
      CC10_STORYBOARD.ordinaryConflicts,
    )
    expect(CC10_STORYBOARD.header).toContain(`${CC10_STORYBOARD.totalConflicts} conflicts`)
    expect(CC10_STORYBOARD.panelControl).toContain(
      `${CC10_STORYBOARD.ordinaryConflicts} ordinary conflicts`,
    )
  })

  it('the storyboard version table is TWO data rows, counted the same way', () => {
    const rows: number[] = []
    for (let n = 38152; /^\s*\|/.test(L(n)); n += 1) rows.push(n)
    expect(rows).toEqual([38152, 38153])
    expect(CC10_STORYBOARD_VERSIONS).toHaveLength(2)
    for (const v of CC10_STORYBOARD_VERSIONS) {
      const cells = cellsOf(Number(v.sourceRef.slice(1)))
      expect(cells).toEqual([
        v.version,
        v.value,
        v.deviceTimestamp,
        v.serverReceipt,
        v.worker,
        v.device,
      ])
    }
    expect(L(38155)).toContain(CC10_STORYBOARD.verdict)
  })

  it('the seam is action 5, and both of its lines say so', () => {
    expect(L(38175)).toContain('exercises action 5 of `MOD-CC-13`')
    expect(cellsOf(38669)[0]).toBe('5')
    expect(cellsOf(38669)[1]).toBe('Resolve or Resolve All sync conflicts')
    expect(CC10_SEAM.sourceRef).toBe('L38669')
    expect(CC10_SEAM.consumingModule).toBe('MOD-CC-10')
    expect(CC10_SEAM.owningModule).toBe('MOD-CC-13')
  })

  it('the Resolve All exclusion is stated at every line the record cites', () => {
    for (const ref of CC10_RESOLVE_ALL_EXCLUSION.sourceRefs) {
      expect(L(Number(ref.slice(1))).toLowerCase()).toContain('resolve all')
    }
    expect(L(38072)).toContain('must be enforced at the service, not only in the interface')
    expect(L(38187)).toContain('an interface-only exclusion would be bypassable')
    expect(CC10_RESOLVE_ALL_EXCLUSION.enforcedAt).toBe('service')
  })
})

describe('MOD-CC-10 — the route, derived from wave 0’s spine', () => {
  it('the slug is the spine’s and the directory of that name is on disk', () => {
    expect(CC10_SLUG).toBe(ccScreenSlug(ccScreen('SCR-CC-10')))
    expect(CC10_SLUG).toBe('sync-conflict-review-panel')
    expect(existsSync(join(process.cwd(), 'app', 'command-center', CC10_SLUG, 'page.tsx'))).toBe(
      true,
    )
  })

  it('and no OTHER directory under app/command-center claims this screen', () => {
    const dir = join(process.cwd(), 'app', 'command-center')
    const built = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
    expect(built).toContain(CC10_SLUG)
    // The dispatch's shorter name, specifically: it would leave CC_NAV pointing
    // at a route that does not exist while a second directory served the screen.
    expect(built).not.toContain('sync-conflict-review')
  })

  it('CC_NAV publishes exactly this pathname for SCR-CC-10', () => {
    const entry = CC_NAV.find((e) => e.screen === 'SCR-CC-10')
    expect(entry).toBeDefined()
    expect(entry?.pathname).toBe(CC10_PATHNAME)
    expect(CC10_PATHNAME).toBe('/command-center/sync-conflict-review-panel')
  })
})

describe('MOD-CC-10 — disclosure, and the gap it is disclosed against', () => {
  const canon = readFileSync(join(process.cwd(), 'src', 'disclosure', 'decisions.ts'), 'utf8')

  it('both identifiers are ABSENT from the shared canon, which is why they are local', () => {
    // When a later task lifts either one in, this goes red and forces the
    // switch rather than leaving two spellings of one decision on the tree.
    for (const d of CC10_DISCLOSURES) expect(canon).not.toContain(d.decisionRef)
  })

  it('the canon is real and is being read, so the absence above means something', () => {
    // A misspelled path or an empty read would satisfy the absence check for
    // free. This asserts the file loaded is the canon.
    expect(canon).toContain('export interface DecisionReading')
    expect(canon).toContain("id: 'DEC-STUXREF-001'")
  })

  it('DEC-CONFLICTCAP-001 is raised in THIS module’s own section and is new there', () => {
    expect(L(38076)).toContain('**`DEC-CONFLICTCAP-001`**')
    expect(L(38076)).toContain('Client Decision Required')
    const register = cellsOf(38955)
    expect(register[0]).toBe('DEC-CONFLICTCAP-001')
    expect(register[1]).toBe('**New, raised here**')
    expect(register[2]).toBe('21.13')
    expect(register[3]).toBe('Client product owner with quality lead')
  })

  it('DEC-PLUS-001 carries both readings and the obligation to preserve them', () => {
    expect(L(14670)).toContain('**Reading A:**')
    expect(L(14670)).toContain('**Reading B:**')
    expect(L(14670)).toContain(
      'Every fragment that consumes an authority matrix must reference `DEC-PLUS-001` and preserve both readings',
    )
    const plus = CC10_DISCLOSURES.find((d) => d.decisionRef === 'DEC-PLUS-001')
    expect(plus?.readings).toHaveLength(3)
    expect(plus?.readings[0].text).toContain('Reading A')
    expect(plus?.readings[1].text).toContain('Reading B')
  })

  it('the plus notation reaches this module through the ACTION set, not the matrix', () => {
    // The finding: chapter 21's matrix names all five roles in all forty cells
    // and uses no plus form at all, so it is determinate where the closed
    // action set it exercises is not.
    for (const n of measuredDataLines) {
      expect(L(n)).not.toContain('and above')
      expect(L(n)).not.toContain('+ ')
    }
    expect(cellsOf(38669)[2]).toContain('Quality Manager and above')
    expect(L(38209)).toContain('Quality Manager only under `DEC-PLUS-001`')
    expect(L(116624)).toContain('DEC-PLUS-001')
  })

  it('every disclosure names both readings, an adopted position and the canon gap', () => {
    for (const d of CC10_DISCLOSURES) {
      expect(d.readings.length).toBeGreaterThanOrEqual(2)
      expect(d.clientDelegated).toBe(true)
      expect(d.adopted.length).toBeGreaterThan(80)
      expect(d.canonNote).toContain('canon')
      for (const r of d.readings) expect(r.locator).toMatch(/L\d{3,6}/)
    }
  })
})

describe('MOD-CC-10 — the second treatment is declared and NOT transcribed', () => {
  it('names the span and the row count, and claims nothing about the cells', () => {
    expect(CC10_SECOND_TREATMENT.span).toBe('L80485-L80602')
    expect(CC10_SECOND_TREATMENT.matrixRows).toBe(9)
    expect(CC10_SECOND_TREATMENT.statement).toContain('L80485-L80602')
    expect(CC10_SECOND_TREATMENT.statement).toContain('transcribed elsewhere')
  })

  it('and every transcribed row cites a line inside the chapter-21 card', () => {
    // THIS GATE'S FIRST WRITING WAS WRONG AND IS RECORDED RATHER THAN QUIETLY
    // REPLACED. It banned any L-number inside L80485-L80602 from this module's
    // files, on the premise that citing into §36.6 meant a cell of the second
    // treatment had been read. It went red on `service.ts`'s record that the
    // dispatch's storyboard locator, L80541, points into that span — a TRUE
    // statement, established by locating an identifier and not by reading a
    // cell, and exactly the kind of brief correction this build wants written
    // down. Banning the line number banned the correction, not the merge.
    //
    // What actually excludes a merge is where the transcribed data is sourced:
    // every row this module carries names a line inside the chapter-21 card,
    // and the cell-by-cell comparison above pins all forty to L38084-L38091. A
    // ninth row, or a cell taken from the other matrix, has nowhere to come
    // from that satisfies both.
    const CARD_FIRST = 38048
    const CARD_LAST = 38246
    const sourced = [
      ...CC10_MATRIX.map((r) => r.sourceRef),
      ...CC10_STORYBOARD_VERSIONS.map((v) => v.sourceRef),
      CC10_STORYBOARD.titleRef,
      CC10_STORYBOARD.headerRef,
      CC10_STORYBOARD.entryRef,
      CC10_STORYBOARD.verdictRef,
      CC10_STORYBOARD.controlsRef,
      CC10_IDENTITY.identityRef,
      CC10_IDENTITY.purposeRef,
      CC10_IDENTITY.userBenefitRef,
    ].map((ref) => Number(ref.slice(1)))
    expect(sourced.length).toBeGreaterThan(14)
    for (const n of sourced) {
      expect(n).toBeGreaterThanOrEqual(CARD_FIRST)
      expect(n).toBeLessThanOrEqual(CARD_LAST)
    }
    // And the record of the second treatment carries a span and a count, never
    // a row: nothing on it is an array of cells.
    expect(Object.values(CC10_SECOND_TREATMENT).some((v) => Array.isArray(v))).toBe(false)
  })
})

describe('MOD-CC-10 — the client boundary the slice-7 panels crossed', () => {
  it('no file in this module declares `use client` while exporting data', () => {
    const dir = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-10')
    const files = readdirSync(dir).filter((e) => !isForeignProbe(e))
    expect(files.length).toBeGreaterThan(0)
    for (const entry of files) {
      const text = readFileSync(join(dir, entry), 'utf8')
      const declares = /^\s*['"]use client['"]/m.test(text)
      const exportsData = /^export const |^export function /m.test(text)
      expect(declares && exportsData).toBe(false)
    }
  })

  it('nor does the route page', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC10_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(/^\s*['"]use client['"]/m.test(page)).toBe(false)
  })
})

/* ==================================================================== *
 * SLICE 9 — WHAT WAS COMPLETED, GATED.
 * ==================================================================== */

describe('SCR-CC-10 — reachability from `app/`, measured rather than assumed', () => {
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
   * through a chain this walk follows.
   *
   * THE REGEX MATCHES `from '…'` ANYWHERE, NOT AT THE START OF A LINE, and
   * that is the whole reason it can be trusted. `tests/unit/cc-live-model.test.ts`
   * anchors its dependency scan with `^\s*(?:import|export)[^'"\n]*from`,
   * which cannot see a multi-line import — and this page's own import of the
   * disclosure component would have been invisible to it. A reachability check
   * that under-reports goes green on a broken chain, which is the same defect
   * as one that over-reports, arrived at from the safe side.
   *
   * Both specifier shapes are followed. A `@/`-only walk reads every module
   * that reaches its neighbour through `./matrix` as unreachable.
   */
  function reachableFromApp(): Set<string> {
    const seen = new Set<string>()
    const queue = appFiles(join(process.cwd(), 'app'))
    while (queue.length > 0) {
      const file = queue.pop()
      if (file === undefined || seen.has(file)) continue
      seen.add(file)
      const text = readFileSync(file, 'utf8')
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

  /**
   * THE FINDING THIS TASK OPENED ON. Slice 8's best disclosure — §36.6's
   * nine-row treatment with all four divergences — was imported by no page
   * and no component test, so a client reviewing this screen saw one
   * treatment and was told nothing about the second.
   *
   * FAILS IF: the import is dropped from the route, or the component is
   * imported for its types only. Planted by deleting the import line and the
   * element together; red on both assertions. Restored by index splice.
   */
  it('the second treatment is reachable from `app/`, and so is its matrix', () => {
    expect(reached('src/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure.tsx')).toBe(true)
    expect(reached('src/surfaces/cc/modules/cc-10-s366/matrix.ts')).toBe(true)
    // Not vacuous: the walk answers `false` for a real file nothing under
    // `app/` imports, so `true` above is a measurement rather than a default.
    expect(reached('src/surfaces/cc/fallback/CcFallbackDisclosure.tsx')).toBe(false)
  })

  /**
   * `MOD-CC-13` owns no path under `app/` and can only reach a client through
   * a screen that is not its own. L38793 names this module for action 5.
   *
   * FAILS IF: the rail import is dropped, or the wave-0 module CARD is
   * mounted in its place — the two are different components and the card
   * renders no control at all.
   */
  it('the action rail this screen mounts is `MOD-CC-13`’s control rail, not wave 0’s card', () => {
    expect(reached('src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx')).toBe(true)
    expect(reached('src/surfaces/cc/modules/cc-13/rail.ts')).toBe(true)
  })

  /**
   * IMPORTED IS NOT RENDERED, and a text check that cannot tell them apart is
   * worth nothing — the lesson `cc-spine-completion` paid for when
   * `toContain('CommandCenterShell')` stayed green against a bare `<main />`.
   * So both are asked as ELEMENTS.
   *
   * FAILS IF: either element is removed while its import stays. Planted by
   * deleting `<SecondTreatmentDisclosure />` alone, leaving the import: red
   * here and green on the reachability gate above, which is exactly why both
   * exist.
   */
  it('and both are rendered as elements, not merely imported', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC10_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page).toMatch(/<SecondTreatmentDisclosure\s*\/>/)
    expect(page).toMatch(/<Cc13ActionRail\b/)
    expect(page).toMatch(/<SyncConflictReviewPanel\s*\/>/)
    // The wave-0 rail is a different component and is NOT what mounts here.
    expect(page).not.toMatch(/<ActionRail\b/)
  })

  /**
   * A module demonstrated by its slug claim alone can ship without ever
   * saying what it is, and this page did until a registry gate went red.
   *
   * AND `page.includes('MOD-CC-10')` IS NOT THE CHECK. A file quoting a list
   * of identifiers contains every identifier in that list, so the occurrence
   * has to sit on a line naming no OTHER `MOD-CC-*`. This page names
   * `MOD-CC-02` and `MOD-CC-13` in its own prose, both legitimately.
   *
   * FAILS IF: every solo mention is removed. Planted by rewriting
   * `mountedOn="MOD-CC-10"` to a variable and stripping the three prose
   * mentions; red with an empty array.
   */
  it('names its own module on a line naming no other `MOD-CC-*`', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC10_SLUG, 'page.tsx'),
      'utf8',
    )
    const solo = page
      .split('\n')
      .filter((line) => line.includes('MOD-CC-10'))
      .filter((line) => (line.match(/MOD-CC-\d+/g) ?? []).every((id) => id === 'MOD-CC-10'))
    expect(solo.length).toBeGreaterThan(0)

    // NOT VACUOUS: the filter really rejects a shared line. The page carries
    // one, and it must not be counted.
    const shared = page
      .split('\n')
      .filter((line) => line.includes('MOD-CC-13') && line.includes('MOD-CC-10'))
    expect(shared.every((line) => !solo.includes(line))).toBe(true)
  })
})

describe('MOD-CC-10 — action 5 is stated three times and the three disagree', () => {
  /**
   * The dispatch named ONE cell of this — the Quality Manager's. Read
   * header-keyed across all five persona columns, §25.4's row differs from
   * §21.16's on four of the five.
   *
   * EVERY CELL IS COMPARED AGAINST ITS OWN LINE, KEYED ON THE COLUMN NAME
   * PARSED FROM THAT TABLE'S OWN HEADER, never positionally: §21.1.2's and
   * §21.16's headers run Tenant Admin first and §25.4's does too, but a
   * positional read is what inverted a matrix elsewhere in this slice and the
   * cost of keying by name is one lookup.
   *
   * FAILS IF: a cell is transcribed wrong or a locator is moved. Planted by
   * changing §25.4's Tenant Admin cell from `Unavailable` to `Explicitly
   * prohibited` — which is what a reconciliation would have written — and by
   * moving L48448 to L48447; red on both.
   */
  it('every cell of all three statements matches its own line, header-keyed', () => {
    const headerFor = (dataLine: number): string[] => {
      for (let n = dataLine - 1; n > dataLine - 20; n -= 1) {
        if (/^\s*\|\s*-{2,}/.test(L(n))) return cellsOf(n - 1)
      }
      throw new Error(`no separator above line ${dataLine}`)
    }

    for (const statement of CC10_ACTION_5_STATEMENTS) {
      const line = Number(statement.sourceRef.slice(1))
      const header = headerFor(line)
      const cells = cellsOf(line)
      expect(cells.length, statement.sourceRef).toBe(header.length)

      // The action's own name, verbatim, in the row's FIRST cell. §21.16 puts
      // an ordinal in column 1 and the action in column 2; the other two put
      // the action first. Read off the header rather than assumed.
      const actionColumn = header[0] === '#' ? 1 : 0
      expect(cells[actionColumn], statement.sourceRef).toContain(statement.actionText)

      for (const column of CC10_COLUMNS) {
        const at = header.indexOf(column)
        expect(at, `${statement.sourceRef} header has no ${column} column`).toBeGreaterThan(0)
        expect(cells[at], `${statement.sourceRef} · ${column}`).toBe(statement.cells[column])
      }
    }
  })

  /**
   * The divergent columns are COMPUTED from the three statements, so the
   * constant cannot disagree with its own data. This gate re-derives the same
   * answer from the SOURCE, which is the half a `for...of` over the constant
   * would not have.
   *
   * FAILS IF: a statement is quietly aligned with its neighbours, which
   * shrinks the constant and would shrink a self-referential check with it.
   */
  it('four of the five columns disagree, counted off the source', () => {
    const divergent = CC10_COLUMNS.filter((column) => {
      const values = new Set(
        CC10_ACTION_5_STATEMENTS.map((s) => {
          const line = Number(s.sourceRef.slice(1))
          const header = (() => {
            for (let n = line - 1; n > line - 20; n -= 1) {
              if (/^\s*\|\s*-{2,}/.test(L(n))) return cellsOf(n - 1)
            }
            throw new Error(`no separator above line ${line}`)
          })()
          return cellsOf(line)[header.indexOf(column)]
        }),
      )
      return values.size > 1
    })
    expect([...CC10_ACTION_5_DIVERGENT_COLUMNS].sort()).toEqual([...divergent].sort())
    expect(divergent).toHaveLength(4)
    // The Supervisor is the one column all three agree on: `Read-only`.
    expect(divergent).not.toContain('Supervisor')
  })

  /**
   * `Resolve-All` against `Resolve All` — a hyphen — is why the three rows
   * cannot be joined by the action's name.
   */
  it('the three tables spell the action two ways, so a name join would drop one', () => {
    expect([...CC10_ACTION_5_NAME_SPELLINGS].sort()).toEqual([
      'Resolve or Resolve All sync conflicts',
      'Resolve or Resolve-All sync conflicts',
    ])
  })

  /**
   * `Allowed` IS A PREFIX OF `Allowed with conditions`, and §25.4's Quality
   * Manager cell is the long form. A `startsWith` classifier reads the single
   * most safety-bearing statement in the slice as an unconditional grant.
   *
   * The comparison is anchored at BOTH ends, which is the rule an unanchored
   * identifier pattern broke elsewhere in this slice by inventing members of
   * the family it was counting.
   */
  it('the prefix trap is present, and an anchored read separates the two', () => {
    const qm = CC10_ACTION_5_STATEMENTS.map((s) => s.cells['Quality Manager'])
    expect(qm.filter((c) => c.startsWith('Allowed'))).toHaveLength(3)
    expect(qm.filter((c) => /^Allowed$/.test(c))).toHaveLength(2)
    expect(qm.filter((c) => /^Allowed with conditions — /.test(c))).toHaveLength(1)
  })
})

describe('MOD-CC-10 — the cap is rendered as the question, and never as a number', () => {
  /**
   * THE SOURCE RAISES BOTH IDENTIFIERS AND MERGING THEM ERASES ONE.
   * `DEC-CONFLICTCAP-001` is raised at L38076 in this module's own section
   * and registered at L38955; `DEC-SYNC-006` carries its own card at L80504
   * with three options, a recommendation and an owner, is the cap value's
   * source status at L80587 and its traceability classification at L80601,
   * and has a §37B register row at L81737. The source's own decision index
   * records them as first raised in different chapters.
   *
   * FAILS IF: a locator is moved off the line that carries it. Planted by
   * repointing the source-status assertion one line down, onto a blank line;
   * red.
   *
   * The planted line's number is deliberately not spelled here.
   * `locator-fidelity` refuses a citation of a blank line and does not care
   * that the sentence is describing a defect — a knowingly-false citation is
   * still a false citation, and it went red on this very comment.
   */
  it('both identifiers are raised by the frozen source, each at its own line', () => {
    expect(L(38076)).toContain('`DEC-CONFLICTCAP-001`')
    expect(L(38955)).toContain('`DEC-CONFLICTCAP-001`')
    expect(L(80504)).toContain('`DEC-SYNC-006`')
    expect(L(80587)).toContain('`DEC-SYNC-006`')
    expect(L(80601)).toContain('`DEC-SYNC-006`')
    expect(L(81737)).toContain('`DEC-SYNC-006`')
    // Different chapters, on the source's own index.
    expect(L(115407)).toContain('Chapter 21')
    expect(L(115111)).toContain('Chapter 36')
  })

  /**
   * L80504 is the CARD — question, options, recommendation, owner — and
   * L81737 is a consolidated §37B register row. A build that cited only the
   * row would be citing the index rather than the decision.
   */
  it('L80504 is the card and L81737 is the register row, and they are not each other', () => {
    expect(L(80504)).toContain('**Options:**')
    expect(L(80504)).toContain('**Recommendation:**')
    expect(L(81737)).not.toContain('**Options:**')
    expect(L(81722)).toContain('New Decisions and Open Items Raised by Chapters 36 and 37')
  })

  /**
   * THE STORYBOARD PRINTS A NUMERAL AND SAYS IT IS NOT ONE.
   *
   * FAILS IF: fifty is read as a cap value anywhere this module renders.
   * Planted by adding `capValue: 50` to `CC10_CAP`; red on the scan below.
   */
  it('the storyboard’s fifty is an illustration, and this module states no cap value', () => {
    expect(L(80541)).toContain('Showing the 50 most recent of 912 conflicts')
    expect(L(80541)).toContain('with the numeral standing for whatever `DEC-SYNC-006` settles')
    // Chapter 21's own storyboard is a case where the cap does not bite.
    expect(L(38146)).toContain('showing 3 of 3')

    for (const file of ['service.ts', 'matrix.ts', 'SyncConflictReviewPanel.tsx']) {
      const text = readFileSync(
        join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-10', file),
        'utf8',
      )
      expect(text, file).not.toMatch(/cap\w*\s*:\s*\d/i)
    }
  })

  /**
   * `DEC-SYNC-006`'S SPELLING IS NOT REPEATED, AND THAT IS A GATE ON A
   * SIBLING'S GATE. `src/offline/decisions-37b.ts` holds the record and
   * `tests/unit/offline-decisions-37b.test.ts` walks all of `src/` for the
   * literal `decisionRef: 'DEC-SYNC-006'`, going red on any file that
   * declares it without being named in that module's own array — an array
   * this task does not own. So this module points and does not declare.
   *
   * FAILS IF: a later edit mints a second record here. Planted by adding
   * `decisionRef: 'DEC-SYNC-006'` to `CC10_CAP`; red here AND red in the
   * sibling suite, which is the pair working.
   */
  it('points at DEC-SYNC-006 and declares no second record for it', () => {
    for (const dir of ['cc-10', 'cc-10-s366']) {
      for (const file of readdirSync(
        join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', dir),
      )) {
        if (isForeignProbe(file)) continue
        const text = readFileSync(
          join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', dir, file),
          'utf8',
        )
        expect(text, `${dir}/${file}`).not.toContain("decisionRef: 'DEC-SYNC-006'")
      }
    }
    expect(CC10_CAP.secondIdentifierHeldBy).toBe('src/offline/decisions-37b.ts')
    expect(
      readFileSync(join(process.cwd(), CC10_CAP.secondIdentifierHeldBy), 'utf8'),
    ).toContain("decisionRef: 'DEC-SYNC-006'")
  })

  /**
   * The rendered record is the SURFACE one, which carries both readings with
   * both locators and has no field a winner could be marked in.
   */
  it('renders the surface record, which names both identifiers and chooses neither', () => {
    expect(CC10_CAP_DISCLOSURE.decisionRef).toBe('DEC-CONFLICTCAP-001')
    expect(CC10_CAP_DISCLOSURE.position.kind).toBe('open')
    expect(CC10_CAP_DISCLOSURE.position.readings).toHaveLength(2)
    const [first, second] = CC10_CAP_DISCLOSURE.position.readings
    expect(first.locator).toContain('DEC-CONFLICTCAP-001')
    expect(second.locator).toContain('DEC-SYNC-006')
    expect(CC10_CAP.bothReadingsHeldBy).toBe('src/surfaces/cc/decisions/disclosure.ts')
  })
})

describe('MOD-CC-10 — the freshness obligation is three timestamps, not two', () => {
  /**
   * THE DISPATCH TRUNCATED THIS CELL. It said the marker obligation is "both
   * device timestamps"; L35888's own words are `Both device timestamps and
   * server receipt`. A model built to the dispatch renders two of the three
   * things the source requires and passes any check written from the same
   * sentence.
   *
   * FAILS IF: the obligation is read as a prefix. The assertion is an exact
   * equality on the whole cell, and the truncation is asserted NOT to be it.
   */
  it('L35888’s obligation is the whole cell, and the truncation is not it', () => {
    const cells = cellsOf(35888)
    expect(cells[0]).toBe('Sync-conflict event')
    expect(cells[1]).toBe('MOD-CC-10')
    expect(cells[2]).toBe('Pushed')
    expect(cells[3]).toBe('Both device timestamps and server receipt')
    expect(cells[3]).not.toBe('Both device timestamps')
    expect(CC10_FRESHNESS.markerObligation).toBe(cells[3])
    expect(CC10_FRESHNESS.classCell).toBe(cells[2])
    expect(CC10_FRESHNESS.sourceRef).toBe('L35888')
  })

  /**
   * The storyboard's own two version rows carry all three, so the obligation
   * is MET rather than merely stated.
   *
   * FAILS IF: a version row loses its server receipt. Planted by blanking
   * version A's `serverReceipt`; red.
   */
  it('and the storyboard’s two versions carry all three', () => {
    expect(CC10_FRESHNESS_MET).toBe(true)
    for (const v of CC10_STORYBOARD_VERSIONS) {
      expect(v.deviceTimestamp).not.toBe('')
      expect(v.serverReceipt).not.toBe('')
    }
  })
})

describe('MOD-CC-10 — the two treatments stay two, and their divergences stay open', () => {
  /**
   * A DIVERGENCE LOCATOR MUST PIN THE CAPABILITY WORDING, NEVER THE STATUS
   * TOKEN. Most of §36.6's forty-five cells carry the same token, so a check
   * that reads the token alone is satisfied by a locator moved one row — the
   * plant that found this originally moved a chapter-21 locator from L38084
   * to L38085 and left the gate green, because both rows give the Tenant
   * Admin the same token.
   *
   * So every line a divergence cites is opened and its FIRST cell — the
   * capability wording — is compared against the recorded wording.
   *
   * FAILS IF: any divergence locator moves a row. Planted by moving the
   * two-rows-wide Tenant Admin divergence's chapter-21 locator from L38085 to
   * L38086; red on the capability, where a token check stays green.
   */
  it('every divergence locator is pinned by its row’s capability wording', () => {
    const linesIn = (locator: string): number[] =>
      [...locator.matchAll(/L(\d{4,6})/g)].map((m) => Number(m[1]))

    for (const d of S366_DIVERGENCES) {
      const here = linesIn(d.here.locator)
      const there = linesIn(d.chapter21.locator)
      expect(here.length, d.id).toBe(d.hereCapabilities.length)
      expect(there.length, d.id).toBe(d.chapter21Capabilities.length)
      here.forEach((line, i) => {
        expect(cellsOf(line)[0], `${d.id} · here · L${line}`).toBe(d.hereCapabilities[i])
      })
      there.forEach((line, i) => {
        expect(cellsOf(line)[0], `${d.id} · chapter21 · L${line}`).toBe(
          d.chapter21Capabilities[i],
        )
      })
      // NOWHERE TO MARK A WINNER. `chosen` is typed `null`, not nullable.
      expect(d.chosen).toBeNull()
    }
  })

  /**
   * A TOKEN CHECK WOULD NOT HAVE CAUGHT IT, and this is the measurement that
   * says so rather than the claim. Counted off §36.6's own nine data lines.
   */
  it('and a token check could not have, because most cells carry one token', () => {
    const tokens: string[] = []
    for (let n = 80549; n <= 80557; n += 1) {
      for (const cell of cellsOf(n).slice(1)) {
        tokens.push(cell.split(' — ')[0] ?? '')
      }
    }
    expect(tokens).toHaveLength(45)
    const prohibited = tokens.filter((t) => t.startsWith('Explicitly prohibited')).length
    expect(prohibited).toBeGreaterThan(tokens.length / 2)
  })

  /**
   * THE TENANT ADMIN DIVERGENCE IS TWO ROWS WIDE, NOT ONE — panel visibility
   * AND reading a conflict entry. One transcription plus one reconciliation
   * produces a merged, plausible, wrong answer, and this is the row that
   * would have been lost.
   */
  it('the Tenant Admin divergence is two rows wide, and both rows are recorded', () => {
    const tenantAdmin = S366_DIVERGENCES.filter((d) => d.column === 'Tenant Admin')
    expect(tenantAdmin).toHaveLength(2)
    expect(tenantAdmin.map((d) => d.here.locator.match(/L\d+/)?.[0]).sort()).toEqual([
      'L80549',
      'L80550',
    ])
    // One was named by the dispatch and one was found by comparing the two
    // matrices row by row. Both are carried the same way.
    expect(tenantAdmin.map((d) => d.namedByTheBrief).sort()).toEqual([false, true])
  })

  /**
   * THE DECOMPOSITION STAYS OPEN. §36.6 splits "see the panel exists" from
   * "read an entry" and gives the Supervisor `Allowed` then `Read-only`;
   * chapter 21 gives `Read-only` twice. Whether that is a contradiction or a
   * finer-grained statement of the same rule IS the choice, and no task in
   * this build has made it. This gate is what keeps a later reconciliation
   * from quietly aligning the tokens and destroying the evidence for both.
   *
   * FAILS IF: the divergence is dropped, or the source settles it. The
   * "settles it" half is asserted against the line the section would have to
   * carry — L80497 says "Supervisors view the panel", which is the word both
   * tokens are trying to render and is not an answer.
   */
  it('the Supervisor decomposition is recorded, open, and unsettled by the prose', () => {
    const d = S366_DIVERGENCES.find((x) => x.id === 'supervisor-panel-visibility-token')
    expect(d, 'the decomposition divergence is still recorded').toBeDefined()
    expect(d?.chosen).toBeNull()
    expect(d?.whyNeitherIsChosen).toContain('DECOMPOSITION')

    // The source's own words, at their own line, answering neither.
    expect(L(80497)).toContain('Supervisors view the panel')
    expect(L(80549).split('|')[3]?.trim()).toBe('`Allowed`')
    expect(L(80550).split('|')[3]?.trim()).toBe('`Read-only`')
    expect(cellsOf(38084)[2]).toBe('Read-only')
    expect(cellsOf(38085)[2]).toBe('Read-only')
  })

  /**
   * THE SKEW ROWS ARE NOT A DIVERGENCE, filed as checked so the next reader
   * does not count them as a fifth. They contradict positionally and agree
   * exactly on their own capability wordings.
   */
  it('the skew rows agree on their capability wordings and are not counted', () => {
    expect(cellsOf(38088)[0]).toBe('Resolve a skew-flagged conflict')
    expect(cellsOf(80553)[0]).toBe('Include a skew-flagged entry in Resolve All')
    expect(cellsOf(38088)[3]).toBe(
      'Allowed with conditions — individually only; never through Resolve All',
    )
    expect(cellsOf(80553)[3]).toBe('Explicitly prohibited — no role may do this')
    expect(S366_DIVERGENCES.map((d) => d.id)).not.toContain('skew-flagged')
  })

  /**
   * The two matrices are DIFFERENT SHAPES and neither is merged into the
   * other: eight rows against nine, and the persona columns in opposite
   * orders. Both counts are taken by walking the source's own lines.
   */
  it('eight rows against nine, with the persona columns in opposite orders', () => {
    const walk = (first: number): number => {
      let n = first
      while (/^\s*\|/.test(L(n))) n += 1
      return n - first
    }
    expect(walk(38084)).toBe(8)
    expect(walk(80549)).toBe(9)
    expect(cellsOf(38082).slice(1)).toEqual([...CC10_COLUMNS])
    expect(cellsOf(80547).slice(1)).toEqual([...S366_COLUMNS])
    expect(cellsOf(38082).slice(1)).not.toEqual(cellsOf(80547).slice(1))
    // Same five roles, opposite orders — which is what a positional read
    // inverts silently, because both orderings are internally coherent.
    expect([...cellsOf(38082).slice(1)].sort()).toEqual([...cellsOf(80547).slice(1)].sort())
  })

  /**
   * ONE SCREEN, TWO IDENTIFIERS, AND NOT A FOURTEENTH SCREEN. §36.6's
   * storyboard names this panel `SCR-CC-CONF-01`; the §25.5 register names
   * the same screen `SCR-CC-10`. `AC-CC-040` forbids a fourteenth module
   * route, so the two names have to be settled rather than left to look like
   * two screens. The spine is keyed on the register and the storyboard
   * identifier is carried as what it is.
   */
  it('the storyboard identifier is not a second screen, and the register’s is the key', () => {
    expect(L(80541)).toContain('`SCR-CC-CONF-01`')
    expect(L(48395)).toContain('SCR-CC-10')
    expect(L(48395)).toContain('Sync-conflict review panel')
    expect(L(35261)).toContain('no fourteenth module route exists')
    expect(CC10_SCREEN.id).toBe('SCR-CC-10')
    // ANCHORED AT BOTH ENDS. An unanchored `SCR-CC-\d+` invents members of
    // the family it counts — the phantom `SCR-CC-001`..`005` were the tails
    // of `AC-SCR-CC-00N` and `TEST-SCR-CC-00N`.
    const anchored = /(^|[^A-Za-z0-9-])SCR-CC-\d+(?![A-Za-z0-9-])/g
    const registerIds = new Set(
      sourceLines
        .flatMap((line) => [...line.matchAll(anchored)])
        .map((m) => m[0].replace(/^[^S]/, '')),
    )
    expect(registerIds.size).toBe(13)
    expect(registerIds.has('SCR-CC-CONF-01')).toBe(false)
  })
})

describe('MOD-CC-10 — the action rail belongs on this screen, and the seam still reads open', () => {
  /**
   * L38793 enumerates the modules whose screens exercise one or more of the
   * ten, and names this one for action 5.
   *
   * THE SENTENCE CONTRADICTS ITS OWN ENUMERATION and it is not repaired: it
   * opens "Every other module on this surface", which is twelve, and then
   * lists seven. Both readings recorded, neither adopted.
   */
  it('L38793 names this module for action 5, and lists seven where it says twelve', () => {
    expect(L(38793)).toContain('`MOD-CC-10` for 5')
    expect(L(38793)).toContain('Every other module on this surface')
    const named = new Set((L(38793).match(/MOD-CC-\d+/g) ?? []))
    expect(named.size).toBe(7)
    expect(named.has('MOD-CC-10')).toBe(true)
    expect(named.has('MOD-CC-01')).toBe(false)
    expect(CC10_ACTION_RAIL_MOUNT.whyHereRef).toBe('L38793')
  })

  /**
   * THE ABSENCE INVERSION, RECORDED AND NOT REPAIRED. `src/ui/WriteControl.tsx`
   * draws `explicitlyProhibited` as absent and `notApplicable` as disabled;
   * L20195 asks for the exact reverse on this rail, which is why the rail
   * renders through `ProhibitionNotice` rather than through `WriteControl`.
   * Neither is edited to match the other.
   *
   * FAILS IF: the rail is switched onto `WriteControl`, which would silently
   * invert every absent and disabled control on this screen.
   */
  it('the rail renders through ProhibitionNotice, because L20195 inverts WriteControl', () => {
    expect(L(20195)).toContain('absent only where the action is `Not applicable`')
    const rail = readFileSync(
      join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-13', 'Cc13ActionRail.tsx'),
      'utf8',
    )
    expect(rail).toContain('ProhibitionNotice')
    expect(rail).not.toContain('WriteControl')
  })

  /**
   * THE SEAM REGISTRY IS STALE AND IT IS NOT THIS TASK'S TO CORRECT.
   * `ccSeamStatus` derives from `ownerSlice <= THIS_SLICE`, and
   * `src/surfaces/cc/seams.ts` still declares `THIS_SLICE = 8` while both of
   * its rows name `ownerSlice: 9`. `MOD-CC-13` has landed — its rail is the
   * component this screen mounts — so the seam reads `open` beside a closed
   * seam's component. Reported rather than edited, and stated on screen so
   * the contradiction is not rendered silently.
   *
   * THIS GATE GOES RED THE DAY THE SEAM FILE IS CORRECTED, which is the
   * point: the note on screen must be removed in the same change.
   */
  it('the operational-action-set seam still reports open, and the panel says so', () => {
    expect(CC10_SEAM.ownerSlice).toBe(9)
    expect(CC10_SEAM_STATUS).toBe('open')
    expect(
      readFileSync(join(process.cwd(), 'src', 'surfaces', 'cc', 'seams.ts'), 'utf8'),
    ).toContain('const THIS_SLICE = 8')
    expect(CC10_ACTION_RAIL_MOUNT.seamStillReadsOpen).toContain('has landed')
  })
})

describe('MOD-CC-10 — one cell needs a link rather than a control', () => {
  /**
   * Row 8's Tenant Admin cell refuses and then names a destination, and the
   * build's one rendering rule draws nothing at all for it. `AC-CC-301`
   * requires each such control to BE a link.
   *
   * The cell is wave-1's measured population-B row, looked up by id. A
   * second reading of L38091 written here would be a second spelling.
   */
  it('row 8’s Tenant Admin cell is the measured population-B row, at its own line', () => {
    expect(CC10_CLOCK_SKEW_LINK_OUT.moduleId).toBe('MOD-CC-10')
    expect(CC10_CLOCK_SKEW_LINK_OUT.line).toBe(38091)
    expect(CC10_CLOCK_SKEW_LINK_OUT.column).toBe('Tenant Admin')
    expect(CC10_CLOCK_SKEW_LINK_OUT.writeControlWouldDraw).toBe('absent')
    expect(CC10_CLOCK_SKEW_LINK_OUT.sourceRequires).toBe('link')
    expect(L(37802)).toContain('each such control is a link')

    // The cell text really is the one this matrix transcribes, and it really
    // does name a place. Both halves: a prohibited cell that names nowhere
    // needs no link, and this gate must not pass on one.
    const cell = cc10Row(8).cells['Tenant Admin']
    expect(cell.token).toBe('Explicitly prohibited')
    expect(cell.note).toBe(
      'a tenant setting in the Delivery Operations Hub tenant administration area',
    )
    expect(CC10_CLOCK_SKEW_LINK_OUT.rowText).toContain(cell.text)
  })
})

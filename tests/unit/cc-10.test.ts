import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
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
  CC10_DISCLOSURES,
  CC10_IDENTITY,
  CC10_PATHNAME,
  CC10_RESOLVE_ALL_EXCLUSION,
  CC10_SEAM,
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
  it('the card opens at L38048 and the next module’s card opens at L38247', () => {
    expect(L(38048)).toBe('## 21.13 Module `MOD-CC-10` — The Sync-Conflict Review Panel')
    expect(L(38247)).toContain('## 21.14 Module `MOD-CC-11`')
    expect(CC10_IDENTITY.cardSpan).toBe('L38048-L38246')
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

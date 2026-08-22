import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { CONNECTIVITY_MODES, type ConnectivityMode } from '@/scenario/controls'
import {
  OFF_MODES,
  OFF_MODES_DELEGATED,
  OFF_MODE_CONNECTIVITY_RULING,
  OFF_MODE_IDS,
  offMode,
  offModesFor,
} from '@/offline/modes'
import { OPEN_DECISIONS } from '@/disclosure/decisions'

/**
 * THE FROZEN SOURCE IS THE GROUND TRUTH HERE, not a registry and not the
 * constant under test. Every table check below re-reads and re-splits
 * L78643-L78670 at test time and compares the shipped rows against what it
 * found. That is the difference between a check and a `toEqual([...CONST])`
 * tautology: if someone edits a cell in `@/offline/modes`, this goes red
 * because the source still says the old thing.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** A markdown table row, header-keyed by position in the header, never guessed. */
const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const MODE_HEADER_LINE = 78641
const MODE_FIRST_ROW = 78643
const MODE_LAST_ROW = 78670

describe('the twenty-eight modes, against the frozen source', () => {
  it('the header at L78641 carries the seven columns this build transcribed, in order', () => {
    expect(cellsOf(MODE_HEADER_LINE)).toEqual([
      'Identifier',
      'Mode',
      'Detection signal',
      'Frontline behaviour',
      'Oversight-surface display obligation',
      'Terminal safe state if unresolved',
      'Source status',
    ])
  })

  it('the table body is twenty-eight rows and every one is a data row', () => {
    // Measured from the source, not asserted from the constant. The separator
    // row is EXCLUDED by construction: `|---|---|` splits into non-empty cells
    // and a naive body scan counts it, which is exactly how a table-shape gate
    // in slice 7 could not fail.
    expect(sourceLine(MODE_HEADER_LINE + 1)).toMatch(/^\|(?:---\|){7}$/)
    expect(sourceLine(MODE_FIRST_ROW - 1)).toBe(sourceLine(MODE_HEADER_LINE + 1))
    expect(sourceLine(MODE_LAST_ROW + 1).startsWith('|')).toBe(false)
    expect(MODE_LAST_ROW - MODE_FIRST_ROW + 1).toBe(28)
    expect(OFF_MODES).toHaveLength(28)
  })

  it('every one of the seven cells of every one of the twenty-eight rows is verbatim', () => {
    for (let n = MODE_FIRST_ROW; n <= MODE_LAST_ROW; n += 1) {
      const found = cellsOf(n)
      expect(found).toHaveLength(7)
      const row = OFF_MODES[n - MODE_FIRST_ROW]
      expect(row, `no shipped row for L${n}`).toBeDefined()
      if (row === undefined) continue
      // The identifier cell is backticked in the source and bare in the type.
      expect(`\`${row.identifier}\``, `L${n} Identifier`).toBe(found[0])
      expect(row.mode, `L${n} Mode`).toBe(found[1])
      expect(row.detectionSignal, `L${n} Detection signal`).toBe(found[2])
      expect(row.frontlineBehaviour, `L${n} Frontline behaviour`).toBe(found[3])
      expect(row.oversightDisplayObligation, `L${n} Oversight-surface display`).toBe(found[4])
      expect(row.terminalSafeStateIfUnresolved, `L${n} Terminal safe state`).toBe(found[5])
      expect(row.sourceStatus, `L${n} Source status`).toBe(found[6])
    }
  })

  it('the identifiers run OFF-MODE-01 to OFF-MODE-28 with no gap and no repeat', () => {
    const fromSource = Array.from({ length: 28 }, (_, i) => cellsOf(MODE_FIRST_ROW + i)[0])
    expect(fromSource).toEqual(OFF_MODE_IDS.map((id) => `\`${id}\``))
    expect(new Set(OFF_MODE_IDS).size).toBe(28)
  })

  it('offMode is total over every identifier the source declares', () => {
    for (const id of OFF_MODE_IDS) {
      expect(offMode(id).identifier).toBe(id)
    }
  })
})

describe('the mapping onto the six-member ConnectivityMode', () => {
  it('every mode maps to a member the scenario engine actually drives', () => {
    // `CONNECTIVITY_MODES` is imported from the file that owns it. A local
    // list of six strings here would be a second spelling of the union and
    // would stay green after `@/scenario/controls` changed.
    const engineMembers = new Set<string>(CONNECTIVITY_MODES)
    for (const m of OFF_MODES) {
      expect(engineMembers.has(m.connectivity), `${m.identifier} -> ${m.connectivity}`).toBe(true)
    }
  })

  it('no member of the six is abandoned — each has at least one source mode', () => {
    for (const member of CONNECTIVITY_MODES) {
      expect(offModesFor(member).length, `no source mode maps to ${member}`).toBeGreaterThan(0)
    }
  })

  it('the six partition the twenty-eight — every mode counted once, none twice', () => {
    const total = CONNECTIVITY_MODES.reduce((sum, m) => sum + offModesFor(m).length, 0)
    expect(total).toBe(28)
  })

  it('dependency-down holds exactly the eleven the source itself counts at L78637', () => {
    // NOT eleven because this build decided eleven. The source states the
    // number in its own prose about its own diagram, and that word is read
    // here rather than trusted: "putting all eleven backend variants in the
    // diagram would exceed a readable node count".
    const prose = sourceLine(78637)
    expect(prose).toContain('eleven backend variants')
    expect(offModesFor('dependency-down')).toHaveLength(11)
  })

  it('device-dark and server-unreachable never share a member, as L78650 requires', () => {
    // OFF-MODE-08's own display obligation makes this a source rule, not a
    // preference: "Surfaces must distinguish device-dark from
    // server-unreachable".
    expect(sourceLine(78650)).toContain('must distinguish device-dark from server-unreachable')
    const deviceDark = new Set(offModesFor('offline').map((m) => m.connectivity))
    const unreachable = new Set(offModesFor('dependency-down').map((m) => m.connectivity))
    for (const member of unreachable) expect(deviceDark.has(member)).toBe(false)
    expect(offMode('OFF-MODE-08').connectivity).toBe('dependency-down')
    expect(offMode('OFF-MODE-04').connectivity).toBe('offline')
  })

  it('mappingKind accounts for all twenty-eight and direct never doubles up', () => {
    const byKind = new Map<string, number>()
    for (const m of OFF_MODES) byKind.set(m.mappingKind, (byKind.get(m.mappingKind) ?? 0) + 1)
    expect([...byKind.values()].reduce((a, b) => a + b, 0)).toBe(28)
    // `direct` claims the member absorbs exactly this one mode. Checked, not
    // asserted: if a second mode is ever pointed at a direct member, the claim
    // is false and this fails.
    for (const m of OFF_MODES) {
      if (m.mappingKind !== 'direct') continue
      expect(offModesFor(m.connectivity), `${m.identifier} claims direct`).toHaveLength(1)
    }
    // `narrowed` claims the opposite, so it must not be alone.
    for (const m of OFF_MODES) {
      if (m.mappingKind !== 'narrowed') continue
      expect(
        offModesFor(m.connectivity).length,
        `${m.identifier} claims narrowed`,
      ).toBeGreaterThan(1)
    }
  })

  it('every mappingBasis is a real sentence, not a placeholder', () => {
    for (const m of OFF_MODES) {
      expect(m.mappingBasis.length, m.identifier).toBeGreaterThan(40)
      expect(m.mappingBasis.trim().endsWith('.'), m.identifier).toBe(true)
    }
  })
})

describe('where the six cannot carry the twenty-eight', () => {
  it('the four delegated modes are states of the source machine, not inventions', () => {
    // The claim in the ruling is that these four ARE in the source's own
    // machine but are not connectivity conditions. The first half is checked
    // here against the mermaid node labels at L78600-L78612, so a fifth mode
    // quietly relabelled `delegated` to dodge a mapping argument fails.
    expect(OFF_MODES_DELEGATED.length).toBe(4)
    const machine = SOURCE_LINES.slice(78600 - 1, 78612).join('\n')
    for (const m of OFF_MODES_DELEGATED) {
      expect(machine, `${m.identifier} "${m.mode}" is not a node of the source machine`).toContain(
        m.mode,
      )
    }
  })

  it('the three non-clean exits from Synchronizing are the three that land on recovering', () => {
    // L78629-L78631 are the source's own three transitions out of
    // Synchronizing. Read from the source, then used to select the rows.
    const exits = [78629, 78630, 78631].map((n) => sourceLine(n).trim())
    expect(exits).toEqual([
      'Synchronizing --> ConflictDetected',
      'Synchronizing --> QuarantineRequired',
      'Synchronizing --> RecoveryRequired',
    ])
    for (const id of ['OFF-MODE-25', 'OFF-MODE-26', 'OFF-MODE-27'] as const) {
      expect(offMode(id).connectivity, id).toBe('recovering')
      expect(offMode(id).mappingKind, id).toBe('delegated')
    }
  })

  it('safely blocked is delegated onto offline, and the source reaches it from device-offline', () => {
    expect(sourceLine(78620).trim()).toBe('DeviceOffline --> SafelyBlocked')
    expect(sourceLine(78626).trim()).toBe('SafelyBlocked --> Reconnecting')
    expect(offMode('OFF-MODE-28').connectivity).toBe('offline')
    expect(offMode('OFF-MODE-28').mappingKind).toBe('delegated')
  })

  it('the scope limit is disclosed, and OFF-MODE-25 is the case it names', () => {
    // The whole risk of the mapping is that a consumer reads `connectivity` as
    // a display instruction. L78667 is the row where that is most obviously
    // wrong, so the ruling must name it and the row must still carry its own
    // obligation.
    expect(OFF_MODE_CONNECTIVITY_RULING.scopeLimit).toContain('OFF-MODE-25')
    expect(OFF_MODE_CONNECTIVITY_RULING.scopeLimit).toContain('L78667')
    expect(sourceLine(78667)).toContain('Conflict-review panel in the Client Command Center')
    expect(offMode('OFF-MODE-25').oversightDisplayObligation).toContain('Conflict-review panel')
  })
})

describe('the ruling is disclosed, and is not passed off as the source', () => {
  it('carries more than one reading and every locator names a real, non-blank line', () => {
    expect(OFF_MODE_CONNECTIVITY_RULING.readings.length).toBeGreaterThan(1)
    for (const reading of OFF_MODE_CONNECTIVITY_RULING.readings) {
      expect(reading.text.length).toBeGreaterThan(60)
      const numbers = [...reading.locator.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
      expect(numbers.length, `no L-number in "${reading.locator}"`).toBeGreaterThan(0)
      for (const n of numbers) {
        expect(n).toBeGreaterThan(0)
        expect(n).toBeLessThanOrEqual(SOURCE_LINES.length)
        expect(sourceLine(n).trim(), `L${n} is blank`).not.toBe('')
      }
    }
  })

  it("names APP-012 and says the pick is this build's, never the source's", () => {
    expect(OFF_MODE_CONNECTIVITY_RULING.adopted).toContain('APP-012')
    expect(OFF_MODE_CONNECTIVITY_RULING.adopted).toContain('not a position the source settled')
    expect(OFF_MODE_CONNECTIVITY_RULING.keyIsThisBuilds).toBe(true)
  })

  it('the four modes the second reading puts outside the device-side machine are the four', () => {
    // The reading claims exactly four of the twenty-eight say they have no
    // device impact, and that the machine at L78637 is the device-side one.
    // Both halves read from the source rather than asserted.
    expect(sourceLine(78637)).toContain('the device-side connectivity state machine')
    const noDeviceImpact = OFF_MODES.filter((m) =>
      m.frontlineBehaviour.startsWith('`Not applicable — no device impact`'),
    )
    expect(noDeviceImpact.map((m) => m.identifier)).toEqual([
      'OFF-MODE-13',
      'OFF-MODE-14',
      'OFF-MODE-15',
      'OFF-MODE-16',
    ])
    // ... and each of the four is a `narrowed` mapping onto `offline`, which
    // is the caveat the file header records for exactly this group.
    for (const m of noDeviceImpact) {
      expect(m.connectivity, m.identifier).toBe('offline')
      expect(m.mappingKind, m.identifier).toBe('narrowed')
      expect(m.mappingBasis, m.identifier).toContain('not the device’s')
    }
  })

  it('the second reading quotes the source verbatim', () => {
    const quoting = OFF_MODE_CONNECTIVITY_RULING.readings.find((r) => r.locator.includes('L78637'))
    expect(quoting).toBeDefined()
    expect(quoting?.text).toContain('exceed a readable node count')
    expect(sourceLine(78637)).toContain('exceed a readable node count')
  })

  it('DEC-OFFMODE-001 is absent from the frozen source and from the decision canon', () => {
    // The key is this build's, so the source must never carry it. And the
    // moment a later task lifts this ruling into `@/disclosure/decisions`,
    // this goes red and forces the local disclosure to be retired rather than
    // left alive as a second spelling.
    const key = OFF_MODE_CONNECTIVITY_RULING.decisionRef
    expect(readFileSync(SOURCE_PATH, 'utf8')).not.toContain(key)
    for (const d of OPEN_DECISIONS) {
      expect(d.id).not.toBe(key)
      expect(d.decisionRef).not.toBe(key)
      expect(d.alias).not.toBe(key)
    }
  })
})

describe('the mapping does not widen ConnectivityMode', () => {
  it('the six members are unchanged and this file adds none', () => {
    // If a later task widens `@/scenario/controls` to carry the twenty-eight,
    // this fails and the ruling above has to be revisited rather than silently
    // becoming dead weight.
    expect(CONNECTIVITY_MODES).toHaveLength(6)
    const used = new Set<ConnectivityMode>(OFF_MODES.map((m) => m.connectivity))
    expect(used.size).toBe(6)
  })
})

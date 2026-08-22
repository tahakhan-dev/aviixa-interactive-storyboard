import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CC13_ABSOLUTE_EXCLUSIONS,
  CC13_ACTIONS,
  CC13_AC_407_COVERAGE,
  CC13_CELL_COUNT,
  CC13_COLUMNS,
  CC13_COLUMN_ROLE,
  CC13_EXCLUSION_MISCOUNT,
  CC13_OWNING_PLACES,
  CC13_ROWS_WITHOUT_A_NAMED_OWNER,
  CC13_TOKENS,
  CC13_TOKEN_OUTCOME,
  cc13Cell,
  cc13Outcome,
} from '@/surfaces/cc/actions/action-set'
import {
  CC_WRITES_OUTSIDE_FINDINGS,
  CC_WRITES_OUTSIDE_THE_TEN,
  DEC_CCWRITE_001,
  OUTSIDE_WRITES_FOUND_BY_THIS_BUILD,
  OUTSIDE_WRITES_NAMED_BY_THE_SOURCE,
  OUTSIDE_WRITE_COUNT,
  OUTSIDE_WRITE_COUNT_STATEMENT,
} from '@/surfaces/cc/actions/outside-writes'
import {
  CC_CLASSES_NOT_ORIGINATED_HERE,
  CC_COMMAND_BEARING_ACTIONS,
  CC_PROPAGATION_STATES,
  ccPropagationRollUp,
  isCommandBearing,
  type DeviceCommandState,
} from '@/surfaces/cc/actions/propagation'
import { COMMAND_APPLIED_LADDER, COMMAND_ALTERNATIVE_STATES } from '@/frontline/commands'
import { OPEN_DECISIONS } from '@/disclosure/decisions'

/**
 * `MOD-CC-13` — THE CLOSED ACTION SET OF TEN.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE FROZEN SOURCE AT TEST
 * TIME. Nothing below hard-codes a cell string it also checks; the source
 * line is split on its own pipes and compared field by field. That is why a
 * planted cell goes red: the expected value comes from the file, not from the
 * module under test.
 *
 * THE ONE THING THAT IS NEVER TAKEN FROM THE VALUE UNDER TEST is the allowed
 * string. `Allowed` is a prefix of `Allowed with conditions`, and a check
 * shaped `expect(cell.text.startsWith(cell.token)).toBe(true)` is true of
 * every cell and of every mis-transcription of every cell. So the token is
 * asserted by EXACT EQUALITY against the head of the SOURCE's own cell, split
 * on the source's own ` — `, and the note is asserted separately. Both halves
 * have to match the file.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES: readonly string[] = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, the way the source is cited. */
const line = (n: number): string => {
  const text = LINES[n - 1]
  if (text === undefined) throw new Error(`Frozen source has no line ${n}`)
  return text
}

/** A markdown table row split into its own cells, pipes and padding removed. */
const fields = (n: number): readonly string[] =>
  line(n)
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((f) => f.trim())

/**
 * The data rows of a table, counted rather than inferred from a span: start
 * one line after the separator and stop at the first line that is not a table
 * row. A `|---|` separator can never be counted as data because the scan
 * begins below it.
 */
const countDataRows = (separatorLine: number): number => {
  let n = separatorLine + 1
  while (line(n).trim().startsWith('|')) n += 1
  return n - separatorLine - 1
}

describe('MOD-CC-13 — the two tables, counted from the source', () => {
  it('the authority table has a header at L38663, a separator at L38664, and ten data rows', () => {
    expect(fields(38663)).toEqual(['#', 'Action', 'Authority', 'Executes via'])
    expect(line(38664).trim()).toMatch(/^\|(\s*-{3,}\s*\|)+$/)
    expect(countDataRows(38664)).toBe(10)
    expect(line(38675).trim()).toBe('')
    expect(line(38676)).toContain('[SoW Fact — §6.14.2, §3.5]')
  })

  it('the permission matrix has a header at L38680, a separator at L38681, and ten data rows', () => {
    expect(fields(38680)).toEqual([
      '#',
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(line(38681).trim()).toMatch(/^\|(\s*-{3,}\s*\|)+$/)
    expect(countDataRows(38681)).toBe(10)
    expect(line(38692).trim()).toBe('')
    expect(line(38693)).toContain('The notes to the matrix')
  })

  it('carries exactly the ten the source counts, and both tables agree on the ordinals', () => {
    expect(CC13_ACTIONS).toHaveLength(10)
    expect(CC13_ACTIONS.map((a) => a.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(CC13_CELL_COUNT).toBe(50)
  })

  it('takes its five columns from L38680 in the header line’s own order, Tenant Admin first', () => {
    // The columns as the header writes them, minus its `#` and `Action`.
    expect([...CC13_COLUMNS]).toEqual(fields(38680).slice(2))
    expect(CC13_COLUMNS[0]).toBe('Tenant Admin')
    expect(CC13_COLUMNS[CC13_COLUMNS.length - 1]).toBe('Worker')
    // Every header word names exactly one platform role, and the map is total.
    expect(Object.keys(CC13_COLUMN_ROLE).sort()).toEqual([...CC13_COLUMNS].sort())
  })
})

describe('MOD-CC-13 — the authority table, field by field against the source', () => {
  it.each(CC13_ACTIONS.map((a) => [a.ordinal, a] as const))(
    'row %i matches its own line',
    (_ordinal, action) => {
      const ref = Number(action.authorityRef.slice(1))
      const f = fields(ref)
      expect(f).toHaveLength(4)
      expect(f[0]).toBe(String(action.ordinal))
      expect(f[1]).toBe(action.authorityAction)
      expect(f[2]).toBe(action.authority)
      expect(f[3]).toBe(action.executesVia)
    },
  )

  it('the ten authority rows are L38665 to L38674, in order and without a gap', () => {
    expect(CC13_ACTIONS.map((a) => a.authorityRef)).toEqual(
      Array.from({ length: 10 }, (_, i) => `L${38665 + i}`),
    )
  })
})

describe('MOD-CC-13 — the permission matrix, cell by cell against the source', () => {
  it.each(CC13_ACTIONS.map((a) => [a.ordinal, a] as const))(
    'row %i matches its own line, header-keyed',
    (_ordinal, action) => {
      const ref = Number(action.matrixRef.slice(1))
      const f = fields(ref)
      expect(f).toHaveLength(7)
      expect(f[0]).toBe(String(action.ordinal))
      expect(f[1]).toBe(action.matrixAction)

      // Header-keyed, never positional: the column's index is looked up in
      // the header line read from the file, so a transposed transcription
      // fails here rather than agreeing with itself.
      const header = fields(38680)
      for (const column of CC13_COLUMNS) {
        const index = header.indexOf(column)
        expect(index).toBeGreaterThan(1)
        const sourceCell = f[index]
        expect(sourceCell).toBeDefined()
        const transcribed = cc13Cell(action.ordinal, column)
        expect(transcribed.text).toBe(sourceCell)

        // The token by EXACT equality against the SOURCE cell's own head,
        // never a prefix and never a string taken from the value under test.
        const [head, ...rest] = (sourceCell as string).split(' — ')
        expect(transcribed.token).toBe(head)
        expect(transcribed.note).toBe(rest.length === 0 ? null : rest.join(' — '))
      }
    },
  )

  it('every cell head is one of the four tokens the table uses, by exact equality', () => {
    for (const action of CC13_ACTIONS) {
      for (const column of CC13_COLUMNS) {
        expect(CC13_TOKENS).toContain(cc13Cell(action.ordinal, column).token)
      }
    }
  })

  it('carries both prefix traps and classifies neither by prefix', () => {
    // `Allowed` is a prefix of this, and the note is the whole rule.
    const clearance = cc13Cell(10, 'Supervisor')
    expect(clearance.token).toBe('Allowed with conditions')
    expect(clearance.note).toBe('expired qualification only, Quality Manager notified')
    expect(cc13Outcome(10, 'Supervisor')).toBe('allowedWithConditions')

    // `Explicitly prohibited` is a prefix of this. The token PROHIBITS and
    // the note grants a different act; dropping the note loses the only thing
    // a Supervisor may do on row 4.
    const release = cc13Cell(4, 'Supervisor')
    expect(release.token).toBe('Explicitly prohibited')
    expect(release.note).toBe('may request with a note')
    expect(cc13Outcome(4, 'Supervisor')).toBe('explicitlyProhibited')
  })

  it('maps its four tokens onto the platform vocabulary and adds none', () => {
    expect(Object.keys(CC13_TOKEN_OUTCOME).sort()).toEqual([...CC13_TOKENS].sort())
  })

  it('names six of the ten differently in the two tables, which is why the join is the ordinal', () => {
    const differing = CC13_ACTIONS.filter((a) => a.authorityAction !== a.matrixAction)
    expect(differing.map((a) => a.ordinal)).toEqual([2, 3, 4, 6, 8, 9])
  })
})

describe('MOD-CC-13 — the four absolute exclusions, and the statement that says three', () => {
  it('L38700 says four and four bullets follow at L38702 to L38705', () => {
    expect(line(38700)).toContain('**Four exclusions are absolute, for every role**')
    const bullets = [38702, 38703, 38704, 38705].filter((n) => line(n).trim().startsWith('- '))
    expect(bullets).toHaveLength(4)
    // The body stops there: the line below the last bullet is blank and
    // L38707 opens the closing note. The blank line is asserted, not cited —
    // a blank line carries nothing, and naming it in a comment claims it does.
    expect(line(38706).trim()).toBe('')
    expect(line(38707)).toContain('These four are not defaults')
    expect(CC13_ABSOLUTE_EXCLUSIONS).toHaveLength(4)
  })

  it('each exclusion matches its own bullet, rule and reason', () => {
    for (const e of CC13_ABSOLUTE_EXCLUSIONS) {
      // Emphasis markers stripped, characters otherwise verbatim. L38702
      // bolds a sentence INSIDE its reason; the other three do not, so a
      // comparison that did not strip would have passed on three of four.
      const bullet = line(Number(e.sourceRef.slice(1))).replaceAll('**', '')
      expect(bullet).toContain(e.rule)
      expect(bullet).toContain(e.reason)
    }
  })

  it('L48368 states three and enumerates four, and the whole line is read', () => {
    const l = line(48368)
    // Read whole. A truncated read of this line reports the clause as absent:
    // it is the fourth sentence and begins past the 250th character.
    expect(l.indexOf('Three prohibitions bind every screen absolutely')).toBeGreaterThan(250)

    const clause = l.slice(l.indexOf('Three prohibitions bind every screen absolutely'))
    const enumerated = clause
      .slice(clause.indexOf(':') + 1, clause.indexOf('[SoW Fact'))
      .split(/,\s*(?:and\s+)?/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    expect(enumerated).toHaveLength(4)
    expect(enumerated).toEqual(CC13_ABSOLUTE_EXCLUSIONS.map((e) => e.asNamedAtL48368))

    // The record carries the enumeration and the miscount, and adopts neither
    // number. `enumeratedCount` is computed from the array; `statedCount` is
    // the source's word.
    expect(CC13_EXCLUSION_MISCOUNT.statedCount).toBe('Three')
    expect(CC13_EXCLUSION_MISCOUNT.enumeratedCount).toBe(4)
    expect(CC13_EXCLUSION_MISCOUNT.statedAt).toBe('L48368')
  })

  it('AC-CC-407 is asserted against nothing in MOD-CC-13’s own matrix', () => {
    expect(line(38864)).toContain('`AC-CC-407`')
    expect(line(38864)).toContain('override a specification gate or the evaluation gate')

    // None of the four appears as a row of L38682-L38691.
    const matrixActions = CC13_ACTIONS.map((a) => a.matrixAction.toLowerCase())
    for (const needle of ['override', 'pause or stop', 'edit any record', 'create a job']) {
      expect(matrixActions.some((a) => a.includes(needle))).toBe(false)
    }
    expect(CC13_AC_407_COVERAGE.carriedInOwnMatrix).toBe(0)

    // All four ARE rows of the surface matrix, and the lines named carry them.
    expect(CC13_AC_407_COVERAGE.surfaceMatrixRefs).toHaveLength(4)
    expect(fields(35020)[0]).toBe('Pause or stop a run')
    expect(fields(35021)[0]).toBe('Edit any record or configuration')
    expect(fields(35022)[0]).toBe('Override a specification gate or the evaluation gate')
    expect(fields(35023)[0]).toBe('Create a Job or a run')

    // §25.4 carries two of them, and they are the lines named.
    expect(CC13_AC_407_COVERAGE.carriedIn254Matrix).toBe(2)
    expect(fields(48455)[0]).toBe('Override a specification or evaluation gate')
    expect(fields(48456)[0]).toBe('Pause or stop a run')
  })
})

describe('MOD-CC-13 — the surface owns no operational record', () => {
  it('reads the owning place off the Executes via column of each row', () => {
    expect(CC13_OWNING_PLACES).toHaveLength(10)
    for (const place of CC13_OWNING_PLACES) {
      const executesVia = fields(Number(place.sourceRef.slice(1)))[3]
      if (place.owningPlace === null) continue
      // The transcribed owner is a fragment of the column, not a paraphrase.
      const stem = (place.owningPlace.split(',')[0] as string).split(' — ')[0] as string
      expect(executesVia).toContain(stem)
    }
  })

  it('row 9’s Executes via names no owning record, and AC-CC-401 asserts one of all ten', () => {
    expect(CC13_ROWS_WITHOUT_A_NAMED_OWNER).toEqual([9])
    const executesVia = fields(38673)[3]
    expect(executesVia).toBe(
      'Re-runs the rule-based evaluation; an agent activates only if a trigger results',
    )
    for (const owner of ['record', 'service', 'Hub', 'pipeline', 'channel']) {
      expect(executesVia).not.toContain(owner)
    }
    expect(line(38858)).toContain('`AC-CC-401`')
    expect(line(38858)).toContain('the same owning Delivery Operations Hub service')

    // The source does supply row 9's owner, in the event table instead.
    expect(fields(35365)[0]).toBe('`EVT-CC-RECHECK-REQUESTED`')
    expect(fields(35365)[2]).toBe('Delivery Operations Hub record service')
  })

  it('the cockpit rule and the audit-link obligation are both on the record', () => {
    expect(line(38657)).toContain('the Command Center is the cockpit, never the engine')
    expect(fields(48437)).toEqual([
      'Audit or history link',
      'Every action links to its Delivery Operations Hub audit entry',
    ])
  })
})

describe('the writes outside the ten — six, with the source’s four marked', () => {
  it('is six, of which DEC-CCWRITE-001 names four and this build found two', () => {
    expect(OUTSIDE_WRITE_COUNT).toBe(6)
    expect(OUTSIDE_WRITES_NAMED_BY_THE_SOURCE).toHaveLength(4)
    expect(OUTSIDE_WRITES_FOUND_BY_THIS_BUILD).toHaveLength(2)
    expect(OUTSIDE_WRITES_NAMED_BY_THE_SOURCE.map((w) => w.act)).toEqual([
      'Report-format authoring',
      'Manual close of a stuck run',
      'Marking a prior case relevant or not relevant',
      'Optional one-tap feedback on agent outputs',
    ])
    expect(OUTSIDE_WRITES_FOUND_BY_THIS_BUILD.map((w) => w.act)).toEqual([
      'Resolve an escalation',
      'Flag an automatic resolution as wrong',
    ])
  })

  it('says six without presenting six as the source’s number', () => {
    expect(OUTSIDE_WRITE_COUNT_STATEMENT).toContain('6 writes')
    expect(OUTSIDE_WRITE_COUNT_STATEMENT).toContain('DEC-CCWRITE-001 names 4 of them')
    expect(OUTSIDE_WRITE_COUNT_STATEMENT).toContain('the four outside acts')
    expect(OUTSIDE_WRITE_COUNT_STATEMENT).toContain("neither is presented here as the source's number")
  })

  it('DEC-CCWRITE-001 is one line, and its four are all on it', () => {
    const l = line(35350)
    expect(l).toContain('`DEC-CCWRITE-001`')
    expect(l.length).toBeGreaterThan(1000)
    for (const needle of [
      'report-format authoring',
      'manual close of a stuck run',
      'marking a prior case relevant or not relevant',
      'optional one-tap feedback on agent outputs',
    ]) {
      expect(l).toContain(needle)
    }
    // Its reading A calls them "the four". A register of six that did not say
    // which four are the source's would misreport this sentence.
    expect(l).toContain('the four outside acts are defects in the enumeration')
  })

  it('the source’s own split between its four is read from the text, not imposed', () => {
    const l = line(35350)
    expect(l).toContain('places at least two writes that originate on this surface outside that set')
    expect(l).toContain('Two further writes originate here and are not enumerated anywhere')
    const explicit = CC_WRITES_OUTSIDE_THE_TEN.filter(
      (w) => w.namedByDecCcWrite001 && w.exclusionKind === 'explicitly-excluded',
    )
    const notEnumerated = CC_WRITES_OUTSIDE_THE_TEN.filter(
      (w) => w.namedByDecCcWrite001 && w.exclusionKind === 'not-enumerated',
    )
    expect(explicit).toHaveLength(2)
    expect(notEnumerated).toHaveLength(2)
  })

  it('L38713 restates the same four inside MOD-CC-13’s own card and states no number', () => {
    const l = line(38713)
    expect(l).toContain('The completeness question, recorded rather than resolved')
    expect(l).toContain('several writes originate on this surface and sit outside it')
    expect(l).toContain('`DEC-CCWRITE-001`')
    expect(l).not.toContain('four writes')
  })

  it('the two this build found are granted cells, read against their own headers', () => {
    // "Resolve an escalation" — MOD-CC-09, L37866 under the header at L37860.
    const escHeader = fields(37860)
    expect(escHeader[0]).toBe('Capability on this module')
    const esc = fields(37866)
    expect(esc[0]).toBe('Resolve an escalation')
    expect(esc[escHeader.indexOf('Supervisor')]).toBe(
      "Allowed with conditions — where the underlying act is within the Supervisor's authority",
    )
    expect(esc[escHeader.indexOf('Quality Manager')]).toBe('Allowed')
    // The Supervisor cell is NOT a plain grant. `Allowed` is a prefix of it.
    expect(esc[escHeader.indexOf('Supervisor')]).not.toBe('Allowed')

    // §26.7's escalation row names acknowledgement only.
    const x = fields(49589)
    expect(x[0]).toBe('Escalation acknowledgement state')
    expect(x[5]).toBe(
      '`Allowed with conditions` — acknowledge from feed or notification, Supervisor and above',
    )
    expect(x[5]).not.toContain('resolve')

    // "Flag an automatic resolution as wrong" — MOD-CC-10, L38089 under L38082.
    const conflictHeader = fields(38082)
    const flag = fields(38089)
    expect(flag[0]).toBe('Flag an automatic resolution as wrong')
    expect(flag[conflictHeader.indexOf('Supervisor')]).toBe('Allowed')
    expect(flag[conflictHeader.indexOf('Quality Manager')]).toBe('Allowed')

    // Neither is one of the ten.
    const ten = CC13_ACTIONS.flatMap((a) => [a.authorityAction, a.matrixAction])
    expect(ten).not.toContain('Resolve an escalation')
    expect(ten).not.toContain('Flag an automatic resolution as wrong')
  })

  it('every entry’s source references name lines that carry it', () => {
    for (const w of CC_WRITES_OUTSIDE_THE_TEN) {
      expect(w.sourceRefs.length).toBeGreaterThan(0)
      for (const ref of w.sourceRefs) {
        expect(ref).toMatch(/^L\d+$/)
        expect(line(Number(ref.slice(1))).trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('§25.4 already carries an outside write inside a table headed "the ten"', () => {
    expect(line(48440)).toContain('Actions and permissions across the ten operational actions')
    expect(countDataRows(48443)).toBe(13)
    expect(fields(48454)[0]).toBe('Author or export a report format')
    expect(CC_WRITES_OUTSIDE_FINDINGS).toHaveLength(2)
  })

  it('DEC-CCWRITE-001 is disclosed locally because the canon has no record for it', () => {
    // Widened to `string` deliberately. TypeScript already proves the absence
    // — `d.id` is a union of the canon's own 29 identifiers and the comparison
    // does not typecheck — but a compile-time proof disappears the moment the
    // canon gains the identifier, which is exactly when this gate must go RED
    // and force the switch. So the check is made at run time.
    const canonIds: readonly string[] = OPEN_DECISIONS.map((d) => d.id)
    expect(canonIds).not.toContain('DEC-CCWRITE-001')
    expect(DEC_CCWRITE_001.decisionRef).toBe('DEC-CCWRITE-001')
    expect(DEC_CCWRITE_001.readings).toHaveLength(2)
    // Two fields per reading and no third: there is nowhere to mark a winner.
    for (const r of DEC_CCWRITE_001.readings) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
      expect(r.locator).toContain('L35350')
    }
    expect(DEC_CCWRITE_001.options).toHaveLength(3)
    for (const option of DEC_CCWRITE_001.options) {
      expect(line(35350)).toContain(option.replace(/^\([abc]\) /, ''))
    }
  })
})

describe('per-device command propagation', () => {
  it('uses the source’s three-token vocabulary and mints no fourth', () => {
    expect([...CC_PROPAGATION_STATES]).toEqual(['issued', 'propagating', 'in force'])
    expect(line(1632)).toContain('issued, then propagating, then in force per device')
    expect(line(1680)).toContain(
      'a hold renders as issued, propagating, or in force per device, never as a single binary state',
    )
  })

  it('exactly three of the ten are command-bearing, and the source says which', () => {
    const l = line(35372)
    expect(l).toContain(
      'Of these the Command Center originates three: lot release (action 4), reassignment or substitution (action 8), and qualification clearance (action 10)',
    )
    expect(line(38719)).toContain('command-channel actions for actions 4, 8 and 10')
    expect(CC_COMMAND_BEARING_ACTIONS.map((a) => a.ordinal)).toEqual([4, 8, 10])
    expect(CC_COMMAND_BEARING_ACTIONS.map((a) => a.commandClass)).toEqual([
      'CMD-FL-LOTREL',
      'CMD-FL-REASSIGN',
      'CMD-FL-CLEAR',
    ])
    expect(isCommandBearing(4)).toBe(true)
    expect(isCommandBearing(7)).toBe(false)
    expect(CC_CLASSES_NOT_ORIGINATED_HERE.map((c) => c.commandClass)).toEqual([
      'CMD-FL-SUSPEND',
      'CMD-FL-VERSION',
    ])
    // Name and identifier read against the channel table's own header at
    // L39660, not by position: its `Command class` column holds the NAME and
    // its `Identifier` column the `CMD-FL-*` token, which is the opposite of
    // the order a reader expects.
    const channelHeader = fields(39660)
    expect(channelHeader).toEqual([
      'Command class',
      'Identifier',
      'Origin',
      'Authority',
      'Effect on the device',
    ])
    for (const a of CC_COMMAND_BEARING_ACTIONS) {
      const classRef = a.sourceRefs.find((r) => Number(r.slice(1)) >= 39662)
      expect(classRef).toBeDefined()
      const row = fields(Number((classRef as string).slice(1)))
      expect(row[channelHeader.indexOf('Command class')]).toBe(a.commandClassName)
      expect(row[channelHeader.indexOf('Identifier')]).toBe(`\`${a.commandClass}\``)
      expect(row[channelHeader.indexOf('Origin')]).toContain('Client Command Center')
    }
  })

  it('is in force only when every relevant device has acknowledged', () => {
    expect(line(2100)).toContain(
      'The Command Center shows the hold as in force on two devices out of two only once both have acknowledged',
    )
    expect(line(39721)).toContain(
      'No surface represents a command as effective on a device before that device has acknowledged application',
    )
    const both: readonly DeviceCommandState[] = [
      { deviceId: 'TAB-014', state: 'acknowledged' },
      { deviceId: 'TAB-015', state: 'acknowledged' },
    ]
    const rollUp = ccPropagationRollUp(both)
    expect(rollUp.state).toBe('in force')
    expect(rollUp.confirmedCount).toBe(2)
    expect(rollUp.deviceCount).toBe(2)
    expect(rollUp.unconfirmed).toEqual([])
  })

  it('does not promote a device that applied but has not acknowledged', () => {
    // `effectiveOnThisDevice` in `@/frontline/commands` answers
    // `applied || acknowledged` — correctly, for the DEVICE. The surface's
    // only evidence is the acknowledgement, and AC-FL-007-3 binds the surface.
    const rollUp = ccPropagationRollUp([
      { deviceId: 'TAB-014', state: 'acknowledged' },
      { deviceId: 'TAB-015', state: 'applied' },
    ])
    expect(rollUp.state).toBe('propagating')
    expect(rollUp.confirmed).toEqual(['TAB-014'])
    expect(rollUp.unconfirmed).toEqual(['TAB-015'])
  })

  it('never reports an empty device set as in force', () => {
    // `[].every(...)` is `true`. The empty case is answered before it runs.
    const rollUp = ccPropagationRollUp([])
    expect(rollUp.state).toBe('issued')
    expect(rollUp.state).not.toBe('in force')
    expect(rollUp.deviceCount).toBe(0)
    expect(rollUp.confirmedCount).toBe(0)
  })

  it('is issued only while every device is on the server side of the ladder', () => {
    const serverSide = COMMAND_APPLIED_LADDER.filter(
      (s) => !['downloaded', 'validated', 'applied', 'acknowledged'].includes(s),
    )
    expect(serverSide).toEqual([
      'created',
      'authorized',
      'queued',
      'available-for-delivery',
      'delivered',
    ])
    for (const state of serverSide) {
      expect(ccPropagationRollUp([{ deviceId: 'TAB-014', state }]).state).toBe('issued')
    }
    for (const state of ['downloaded', 'validated', 'applied'] as const) {
      expect(ccPropagationRollUp([{ deviceId: 'TAB-014', state }]).state).toBe('propagating')
    }
  })

  it('holds an unreturned device at propagating and never promotes it on a timer', () => {
    expect(line(1678)).toContain(
      'the Statement of Work does not state how long a command may remain pending, nor what happens if a device never returns',
    )
    expect(line(1678)).toContain('`DEC-WIPE-001`')
    expect(line(2113)).toContain('**Third failure:** the device never returns')

    const stuck = ccPropagationRollUp([
      { deviceId: 'TAB-014', state: 'acknowledged' },
      { deviceId: 'TAB-015', state: 'queued' },
    ])
    expect(stuck.state).toBe('propagating')
    expect(stuck.unconfirmed).toEqual(['TAB-015'])
    expect(stuck.why).toContain('DEC-WIPE-001')

    // There is no parameter through which a timeout could be passed.
    expect(ccPropagationRollUp).toHaveLength(1)
  })

  it('never reports in force while any device is in an alternative state', () => {
    for (const state of COMMAND_ALTERNATIVE_STATES) {
      const rollUp = ccPropagationRollUp([
        { deviceId: 'TAB-014', state: 'acknowledged' },
        { deviceId: 'TAB-015', state },
      ])
      expect(rollUp.state).toBe('propagating')
    }
  })

  it('names the confirmed and unconfirmed devices, which is the source’s own remedy', () => {
    expect(line(4319)).toContain(
      'Per-device honesty with confirmed and unconfirmed devices listed and lag metered platform-side',
    )
    expect(line(1668)).toContain('the count of devices on which it is in force')
    const rollUp = ccPropagationRollUp([
      { deviceId: 'TAB-014', state: 'acknowledged' },
      { deviceId: 'TAB-015', state: 'delivered' },
      { deviceId: 'TAB-016', state: 'downloaded' },
    ])
    expect(rollUp.confirmed).toEqual(['TAB-014'])
    expect(rollUp.unconfirmed).toEqual(['TAB-015', 'TAB-016'])
    expect(rollUp.confirmedCount + rollUp.unconfirmed.length).toBe(rollUp.deviceCount)
  })
})

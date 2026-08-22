import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PERMISSION_OUTCOMES } from '@/policy/decision'
import { OPEN_DECISIONS } from '@/disclosure/decisions'
import {
  MODULE_COLUMN_IS_NOT_A_KEY,
  OFFLINE_CAPABILITY_CLASSES,
  OFFLINE_CLASSIFICATION,
  OFFLINE_CLASS_CONTRADICTION,
  ROWS_OUTSIDE_THE_SEVEN,
  isOneOfTheSeven,
  rowsInClass,
  type OfflineCapabilityClass,
} from '@/offline/capability'

/** As in `offline-modes.test.ts`: the frozen source, never a registry. */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_TEXT = readFileSync(SOURCE_PATH, 'utf8')
const SOURCE_LINES = SOURCE_TEXT.split('\n')
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''
const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const CLASS_HEADER = 78721
const CLASS_FIRST = 78723
const CLASS_LAST = 78729

const REG_HEADER = 78766
const REG_FIRST = 78768
const REG_LAST = 78819

const EIGHTH = 'Explicitly prohibited on the device'
const EIGHTH_LINE = 78799

describe('the seven classes, against the frozen source', () => {
  it('the defining table at L78721 has three columns and seven data rows', () => {
    expect(cellsOf(CLASS_HEADER)).toEqual(['Class', 'Meaning', 'Governing consequence'])
    expect(sourceLine(CLASS_HEADER + 1)).toMatch(/^\|(?:---\|){3}$/)
    expect(sourceLine(CLASS_LAST + 1).startsWith('|')).toBe(false)
    expect(CLASS_LAST - CLASS_FIRST + 1).toBe(7)
    expect(OFFLINE_CAPABILITY_CLASSES).toHaveLength(7)
  })

  it('every cell of every class row is verbatim and in source order', () => {
    for (let n = CLASS_FIRST; n <= CLASS_LAST; n += 1) {
      const found = cellsOf(n)
      const row = OFFLINE_CAPABILITY_CLASSES[n - CLASS_FIRST]
      expect(row, `no shipped class for L${n}`).toBeDefined()
      if (row === undefined) continue
      expect(row.className, `L${n} Class`).toBe(found[0])
      expect(row.meaning, `L${n} Meaning`).toBe(found[1])
      expect(row.governingConsequence, `L${n} Governing consequence`).toBe(found[2])
    }
  })

  it('the source calls it seven in its own words at L78715', () => {
    expect(sourceLine(78715)).toContain('into one of seven buckets')
  })

  it('AC-OFF-701 requires exactly one of the seven', () => {
    // THE BRIEF PUT THIS AT [cited-in-error: L78827] AND IT IS WRONG. L78827
    // is the "Acceptance criteria and tests." heading; the criterion itself is
    // four lines further on, at L78831, and that is what this build cites. The
    // wrong line is pinned here so a later reader who trusts the brief finds
    // the correction instead of quietly re-introducing it.
    expect(sourceLine(78827)).not.toContain('AC-OFF-701')
    const criterion = sourceLine(78831)
    expect(criterion).toContain('`AC-OFF-701`')
    expect(criterion).toContain('exactly one of the seven classes, and no function is unclassified')
  })
})

describe('the 52-row classification register, against the frozen source', () => {
  it('the header at L78766 carries the ten columns this build transcribed, in order', () => {
    expect(cellsOf(REG_HEADER)).toEqual([
      'Function',
      'Module',
      'Class',
      'Reason',
      'Data required locally',
      'Expiry',
      'Role and qualification restrictions',
      'Artificial-intelligence availability',
      'Fallback',
      'Reconnect behaviour',
    ])
    expect(sourceLine(REG_HEADER + 1)).toMatch(/^\|(?:---\|){10}$/)
  })

  it('the body is fifty-two data rows, separator excluded', () => {
    expect(sourceLine(REG_FIRST - 1)).toBe(sourceLine(REG_HEADER + 1))
    expect(sourceLine(REG_LAST + 1).startsWith('|')).toBe(false)
    expect(REG_LAST - REG_FIRST + 1).toBe(52)
    expect(OFFLINE_CLASSIFICATION).toHaveLength(52)
  })

  it('all ten cells of all fifty-two rows are verbatim', () => {
    for (let n = REG_FIRST; n <= REG_LAST; n += 1) {
      const found = cellsOf(n)
      expect(found, `L${n} column count`).toHaveLength(10)
      const row = OFFLINE_CLASSIFICATION[n - REG_FIRST]
      expect(row, `no shipped row for L${n}`).toBeDefined()
      if (row === undefined) continue
      expect(
        [
          row.fn,
          row.module,
          row.klass,
          row.reason,
          row.dataRequiredLocally,
          row.expiry,
          row.roleAndQualificationRestrictions,
          row.aiAvailability,
          row.fallback,
          row.reconnectBehaviour,
        ],
        `L${n}`,
      ).toEqual(found);
    }
  })

  it('the eight token frequencies measured from the source sum to fifty-two', () => {
    // Measured from the source's Class column, then compared against the
    // shipped rows. Neither side is asserted from the other.
    const fromSource = new Map<string, number>()
    for (let n = REG_FIRST; n <= REG_LAST; n += 1) {
      const token = cellsOf(n)[2] ?? ''
      fromSource.set(token, (fromSource.get(token) ?? 0) + 1)
    }
    expect(Object.fromEntries([...fromSource].sort())).toEqual({
      'Available offline with restrictions': 4,
      'Blocked offline': 9,
      'Cached read-only while offline': 3,
      [EIGHTH]: 1,
      'Fully available offline': 24,
      'Queued for later': 5,
      'Requires online confirmation': 3,
      'Safe-stop required': 3,
    })
    expect([...fromSource.values()].reduce((a, b) => a + b, 0)).toBe(52)
    expect(fromSource.size).toBe(8)

    for (const [token, count] of fromSource) {
      if (!isOneOfTheSeven(token as OfflineCapabilityClass)) continue
      expect(rowsInClass(token as OfflineCapabilityClass), token).toHaveLength(count)
    }
  })
})

describe('the closed set that is not closed — both readings, neither chosen', () => {
  it('the union of seven was not quietly widened to eight', () => {
    // The compile-time proof lives in the module. This is the runtime half:
    // an exact-equality check, so `Explicitly prohibited` never passes for
    // `Explicitly prohibited on the device` by being a prefix of it — the
    // prefix defect that beat an outcome check in slice 7.
    const names: readonly string[] = OFFLINE_CAPABILITY_CLASSES.map((c) => c.className)
    expect(names).toHaveLength(7)
    expect(names.some((n) => n === EIGHTH)).toBe(false)
    expect(isOneOfTheSeven(EIGHTH)).toBe(false)
    // ... and the near-miss token really is a distinct string, so the check
    // above is not passing by comparing a value with itself.
    expect(EIGHTH.startsWith('Explicitly prohibited')).toBe(true)
    expect(isOneOfTheSeven('Blocked offline')).toBe(true)
  })

  it('the eighth token is on the Conflict-resolution row at L78799', () => {
    const row = cellsOf(EIGHTH_LINE)
    expect(row[0]).toBe('Conflict resolution')
    expect(row[2]).toBe(EIGHTH)
    expect(sourceLine(EIGHTH_LINE)).toContain('The worker never sees or resolves a conflict')
  })

  it('exactly one of the fifty-two rows falls outside the seven, and it is that one', () => {
    // Derived from the shipped register by the seven, not hard-coded. If a
    // second out-of-set token ever arrives, this reports it rather than
    // hiding it behind a `=== 1`.
    expect(ROWS_OUTSIDE_THE_SEVEN.map((r) => r.fn)).toEqual(['Conflict resolution'])
    expect(ROWS_OUTSIDE_THE_SEVEN[0]?.klass).toBe(EIGHTH)
  })

  it('AC-OFF-701 is therefore unsatisfiable against the source’s own register', () => {
    // This is the finding, stated as a number: 51 of the 52 rows carry one of
    // the seven. The criterion says all of them do.
    const inSeven = OFFLINE_CLASSIFICATION.filter((r) => isOneOfTheSeven(r.klass))
    expect(inSeven).toHaveLength(51)
    expect(OFFLINE_CLASSIFICATION.length - inSeven.length).toBe(1)
  })

  it('the contradiction carries both locators and adopts neither reading', () => {
    expect(OFFLINE_CLASS_CONTRADICTION.adopted).toBeNull()
    expect(OFFLINE_CLASS_CONTRADICTION.readings).toHaveLength(2)
    const [seven, eight] = OFFLINE_CLASS_CONTRADICTION.readings
    expect(seven?.locator).toContain('L78831')
    expect(seven?.text).toContain('one of seven buckets')
    expect(eight?.locator).toContain('L78799')
    expect(eight?.text).toContain(EIGHTH)
    for (const reading of OFFLINE_CLASS_CONTRADICTION.readings) {
      for (const m of reading.locator.matchAll(/L(\d{3,6})/g)) {
        const n = Number(m[1])
        expect(n).toBeLessThanOrEqual(SOURCE_LINES.length)
        expect(sourceLine(n).trim(), `L${n} is blank`).not.toBe('')
      }
    }
    // Both mechanisms named, not one. The first version of this assertion
    // checked only `RegisterOnlyClassToken`, and a plant that deleted the
    // `ROWS_OUTSIDE_THE_SEVEN` clause left it green.
    expect(OFFLINE_CLASS_CONTRADICTION.howThisBuildCarriesBoth).toContain('RegisterOnlyClassToken')
    expect(OFFLINE_CLASS_CONTRADICTION.howThisBuildCarriesBoth).toContain('ROWS_OUTSIDE_THE_SEVEN')
  })

  it('“Explicitly prohibited” in another column is not the eighth class token', () => {
    // A REAL substring hazard in this exact table, measured rather than
    // imagined: scanning whole register lines for `Explicitly prohibited`
    // matches THREE rows, because L78790 and L78791 carry it in the
    // Artificial-intelligence availability column. Only L78799 carries it in
    // the Class column, and only there is it the eighth class token. A
    // `line.includes(...)` transcription classifies two extra rows.
    const loose: number[] = []
    const strict: number[] = []
    for (let n = REG_FIRST; n <= REG_LAST; n += 1) {
      if (sourceLine(n).includes('Explicitly prohibited')) loose.push(n)
      if ((cellsOf(n)[2] ?? '').startsWith('Explicitly prohibited')) strict.push(n)
    }
    expect(loose).toEqual([78790, 78791, EIGHTH_LINE])
    expect(strict).toEqual([EIGHTH_LINE])
    // The shipped rows keep the two apart: the bare token never lands on
    // `klass`, and it does land on `aiAvailability` exactly twice.
    // Compared as `string`. Written as `r.klass === 'Explicitly prohibited'`
    // this does not compile at all — `RegisterClassToken` and the bare token
    // have no overlap — which is a stronger result than the runtime check and
    // is noted here rather than lost by deleting the check.
    const klasses: readonly string[] = OFFLINE_CLASSIFICATION.map((r) => r.klass)
    expect(klasses.filter((k) => k === 'Explicitly prohibited')).toHaveLength(0)
    expect(
      OFFLINE_CLASSIFICATION.filter((r) => r.aiAvailability.startsWith('`Explicitly prohibited`')),
    ).toHaveLength(2)
  })

  it('DEC-OFFCLASS-001 is absent from the frozen source and from the decision canon', () => {
    const key = OFFLINE_CLASS_CONTRADICTION.decisionRef
    expect(SOURCE_TEXT).not.toContain(key)
    for (const d of OPEN_DECISIONS) {
      expect(d.id).not.toBe(key)
      expect(d.decisionRef).not.toBe(key)
      expect(d.alias).not.toBe(key)
    }
  })
})

describe('consumed, not re-derived', () => {
  it('the two classes with an existing permission token use it, and the token is real', () => {
    const outcomes = new Set<string>(PERMISSION_OUTCOMES)
    const mapped = OFFLINE_CAPABILITY_CLASSES.filter((c) => c.permissionOutcome !== null)
    expect(mapped.map((c) => [c.className, c.permissionOutcome])).toEqual([
      ['Cached read-only while offline', 'cachedReadOnlyOffline'],
      ['Queued for later', 'queuedOffline'],
    ])
    for (const c of mapped) {
      // Imported from `@/policy/decision`, so a renamed token there turns this
      // red instead of leaving a dead second spelling here.
      expect(outcomes.has(c.permissionOutcome ?? ''), c.className).toBe(true)
    }
    expect(OFFLINE_CAPABILITY_CLASSES.filter((c) => c.permissionOutcome === null)).toHaveLength(5)
  })
})

describe('the Module column is not a key', () => {
  it('four of the fifty-two rows carry something that is not a single module id', () => {
    // Measured from the source. A module-keyed lookup drops these silently,
    // which is why the register is keyed on Function.
    const odd: { line: number; value: string }[] = []
    for (let n = REG_FIRST; n <= REG_LAST; n += 1) {
      const value = cellsOf(n)[2 - 1] ?? ''
      if (!/^`MOD-FL-[A-Z]\d{1,2}`$/.test(value)) odd.push({ line: n, value })
    }
    expect(odd.map((o) => o.line)).toEqual([78782, 78817, 78818, 78819])
    expect(odd[0]?.value).toBe('`MOD-FL-A3` and `MOD-FL-B9`')
    expect(odd.slice(1).map((o) => o.value)).toEqual([
      'Cross-module',
      'Cross-module',
      'Cross-module',
    ])
    expect(MODULE_COLUMN_IS_NOT_A_KEY).toContain('keyed on Function')
    // The shipped rows carry those same four values, so the transcription did
    // not normalise them away.
    const shippedOdd = OFFLINE_CLASSIFICATION.filter(
      (r) => !/^`MOD-FL-[A-Z]\d{1,2}`$/.test(r.module),
    )
    expect(shippedOdd).toHaveLength(4)
  })
})

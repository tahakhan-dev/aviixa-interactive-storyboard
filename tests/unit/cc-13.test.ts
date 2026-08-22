import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CC13_ACTIONS,
  CC13_COLUMNS,
  type Cc13Column,
  type Cc13Ordinal,
} from '@/surfaces/cc/actions/action-set'
import {
  CC13_ALL_STATUS_TOKENS,
  CC13_CELL_READINGS,
  CC13_DIVERGENCE_MEASURE,
  CC13_READING_FINDINGS,
  CC13_ROW_READINGS,
  CC13_TEXT_DIVERGENCES,
  CC13_TOKEN_DIVERGENCES,
  CC13_WHERE_THE_MODULE_MATRIX_STANDS_ALONE,
  cc13ReadingsForAction,
  cc13StatusToken,
} from '@/surfaces/cc/modules/cc-13/readings'
import {
  CC13_ABSENCE_INVERSION,
  CC13_AUDIT_POINTER,
  CC13_EXERCISED_ON,
  CC13_EXERCISING_MODULES,
  CC13_MOUNT_FINDINGS,
  CC13_ORDINALS_WITH_A_NAMED_SITE,
  CC13_RAIL_SPEC,
  CC13_RAIL_STATES,
  CC13_ROUTELESSNESS,
  CC13_SCOPE_FILTERS,
  CC13_SUPERVISOR_SUBSTITUTION,
  cc13ActionsOnModule,
  cc13Rail,
  cc13RailRendering,
  cc13SitesForAction,
} from '@/surfaces/cc/modules/cc-13/rail'
import { CC_CLAIMED_SLUGS, CC_MODULE_SPINE, ccModule } from '@/surfaces/cc/modules'
import { CC_NAV, CC_SCREENS } from '@/surfaces/cc/screens'

/**
 * A COMPILE-TIME GATE, because the runtime one cannot be written. `CC_SCREENS`
 * is `as const`, so the literal union of the `owningModule` values actually
 * written there does not contain `'MOD-CC-13'` — which makes
 * `s.owningModule === 'MOD-CC-13'` a TYPE ERROR rather than a false
 * assertion, and an assertion that cannot be written is not one that passed.
 *
 * NOTE WHAT THIS DOES AND DOES NOT PROVE. `CcScreen['owningModule']` is
 * `CcModuleId | null` and DOES admit `'MOD-CC-13'`; the interface permits a
 * register row owning this module and only the data declines to write one.
 * So this line goes red the moment a row is added, which is the whole point,
 * and it is not a claim that the type forbids it.
 */
type ScreenOwningCc13 = Extract<(typeof CC_SCREENS)[number]['owningModule'], 'MOD-CC-13'>
const _noScreenOwnsCc13: ScreenOwningCc13 extends never ? true : never = true
void _noScreenOwnsCc13

/**
 * `MOD-CC-13`'s MODULE TREATMENT — the rail, its mounting, and the two other
 * tables that answer its permission question.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE FROZEN SOURCE AT TEST
 * TIME, the discipline wave 0's `cc-actions.test.ts` states for the same
 * subject. Nothing below hard-codes a cell it also checks: the two tables in
 * `readings.ts` are compared field by field against L35007-L35016 and
 * L48444-L48453, so a planted cell goes red because the expected value comes
 * from the file rather than from the module under test.
 *
 * WHAT THIS SUITE DELIBERATELY DOES NOT RE-ASSERT. §21.16's own two tables
 * are wave 0's and are covered by `tests/unit/cc-actions.test.ts`. This suite
 * reads them only where a claim spans tables.
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
 * The data rows of a table, COUNTED rather than inferred from a span: start
 * one line below the separator and stop at the first line that is not a table
 * row. A `|---|` separator can never be counted as data because the scan
 * begins below it, and the body's real end is found rather than assumed.
 */
const dataRows = (separator: number): readonly number[] => {
  const rows: number[] = []
  for (let n = separator + 1; n <= LINES.length; n += 1) {
    if (!line(n).trim().startsWith('|')) break
    rows.push(n)
  }
  return rows
}

const ORDINALS = CC13_ACTIONS.map((a) => a.ordinal)

describe('the two other tables, read off the source', () => {
  it('the surface matrix is twenty data rows and its header runs Tenant Admin first', () => {
    expect(fields(35002)).toEqual([
      'Capability',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(line(35003).trim()).toMatch(/^\|(-+\|)+$/)
    expect(dataRows(35003)).toHaveLength(20)
  })

  it('§25.4 is thirteen data rows under a heading that says ten, and the last three are not actions', () => {
    expect(fields(48442)).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    const rows = dataRows(48443)
    expect(rows).toHaveLength(13)
    expect(line(48440)).toContain('across the ten operational actions')
    // The three that are not actions, named off their own rows.
    expect(fields(48454)[0]).toBe('Author or export a report format')
    expect(fields(48455)[0]).toBe('Override a specification or evaluation gate')
    expect(fields(48456)[0]).toBe('Pause or stop a run')
  })

  it('carries ten rows and every persona cell of both tables verbatim', () => {
    expect(CC13_ROW_READINGS).toHaveLength(10)
    for (const row of CC13_ROW_READINGS) {
      const sm = fields(Number(row.surfaceMatrixRef.slice(1)))
      const s254 = fields(Number(row.section254Ref.slice(1)))
      expect(sm).toHaveLength(6)
      expect(s254).toHaveLength(6)
      expect(row.surfaceMatrixLabel).toBe(sm[0])
      expect(row.section254Label).toBe(s254[0])
      CC13_COLUMNS.forEach((column, i) => {
        expect(row.surfaceMatrix[column]).toBe(sm[i + 1])
        expect(row.section254[column]).toBe(s254[i + 1])
      })
    }
  })

  it('joins the surface matrix by exact label, and its action rows are NOT in ordinal order', () => {
    for (const row of CC13_ROW_READINGS) {
      const own = CC13_ACTIONS.find((a) => a.ordinal === row.ordinal)
      expect(own?.matrixAction).toBe(row.surfaceMatrixLabel)
    }
    // Action 6 is the last of the ten in the surface matrix, below 7 to 10.
    const refs = CC13_ROW_READINGS.map((r) => Number(r.surfaceMatrixRef.slice(1)))
    expect(Math.max(...refs)).toBe(35016)
    expect(cc13ReadingsForAction(6).surfaceMatrixRef).toBe('L35016')
    expect(refs).not.toEqual([...refs].sort((a, b) => a - b))
  })

  it('cannot join §25.4 by label: three of ten name the act differently', () => {
    const differing = CC13_ROW_READINGS.filter((row) => {
      const own = CC13_ACTIONS.find((a) => a.ordinal === row.ordinal)
      return row.section254Label !== `${row.ordinal} ${own?.matrixAction ?? ''}`
    }).map((r) => r.ordinal)
    expect(differing).toEqual([2, 3, 5])
    // Including one that differs by a single hyphen, which a fuzzy join hides.
    expect(cc13ReadingsForAction(5).section254Label).toContain('Resolve-All')
    expect(cc13Action5MatrixName()).toContain('Resolve All')
  })

  function cc13Action5MatrixName(): string {
    return CC13_ACTIONS.find((a) => a.ordinal === 5)?.matrixAction ?? ''
  }
})

describe('the status tokens, exact and never by prefix', () => {
  it('every head in all one hundred fifty cells is one of the six', () => {
    const heads = CC13_CELL_READINGS.flatMap((c) => [c['§21.1.2'], c['§21.16'], c['§25.4']]).map(
      (t) => t.split(' — ')[0],
    )
    expect(heads).toHaveLength(150)
    for (const head of heads) expect(CC13_ALL_STATUS_TOKENS).toContain(head)
  })

  it('refuses a head it does not know rather than guessing', () => {
    expect(() => cc13StatusToken('Allowedish — invented')).toThrow(/never a prefix/)
  })

  it('THE PREFIX TRAP: the conditional grant is not read as the unconditional one', () => {
    // L35015 opens `Allowed with conditions`, of which `Allowed` is a prefix.
    const supervisor = cc13ReadingsForAction(10).surfaceMatrix.Supervisor
    expect(supervisor.startsWith('Allowed')).toBe(true)
    expect(cc13StatusToken(supervisor)).toBe('Allowed with conditions')
    expect(cc13StatusToken(supervisor)).not.toBe('Allowed')
  })

  it('THE OTHER PREFIX TRAP: row four prohibits and its note grants a different act', () => {
    const supervisor = cc13ReadingsForAction(4).surfaceMatrix.Supervisor
    expect(supervisor.startsWith('Explicitly prohibited')).toBe(true)
    expect(cc13StatusToken(supervisor)).toBe('Explicitly prohibited')
    // The clause after the token is the whole point and is not dropped.
    expect(supervisor).toBe(fields(35010)[2])
    expect(supervisor).toContain('may request with a note')
  })
})

describe('the disagreement, measured rather than quoted', () => {
  it('compares fifty cells across three tables', () => {
    expect(CC13_DIVERGENCE_MEASURE.cellsCompared).toBe(50)
    expect(CC13_DIVERGENCE_MEASURE.tablesCompared).toBe(3)
    expect(CC13_CELL_READINGS).toHaveLength(CC13_ACTIONS.length * CC13_COLUMNS.length)
  })

  it('is not six cells, and the number is derived from the source not from the brief', () => {
    // Recount from the file: for each of the ten and each of the five columns,
    // compare the three heads. Nothing here reads the module under test.
    const smRef = new Map<Cc13Ordinal, number>([
      [1, 35007],
      [2, 35008],
      [3, 35009],
      [4, 35010],
      [5, 35011],
      [6, 35016],
      [7, 35012],
      [8, 35013],
      [9, 35014],
      [10, 35015],
    ])
    let tokenDiff = 0
    let textDiff = 0
    for (const ordinal of ORDINALS) {
      const sm = fields(smRef.get(ordinal) as number)
      const s254 = fields(48443 + ordinal)
      const own = fields(38681 + ordinal)
      CC13_COLUMNS.forEach((_column, i) => {
        // The module matrix carries `#` and `Action`, so its personas start at 2.
        const three = [sm[i + 1] as string, own[i + 2] as string, s254[i + 1] as string]
        if (new Set(three).size > 1) textDiff += 1
        if (new Set(three.map((t) => t.split(' — ')[0])).size > 1) tokenDiff += 1
      })
    }
    expect(CC13_DIVERGENCE_MEASURE.cellsDifferingOnToken).toBe(tokenDiff)
    expect(CC13_DIVERGENCE_MEASURE.cellsDifferingOnFullText).toBe(textDiff)
    expect(tokenDiff).not.toBe(6)
    expect(CC13_TOKEN_DIVERGENCES).toHaveLength(tokenDiff)
    expect(CC13_TEXT_DIVERGENCES).toHaveLength(textDiff)
  })

  it('no single cell carries four readings — three tables can offer three, and it offers two', () => {
    expect(CC13_DIVERGENCE_MEASURE.maxReadingsForOneCell).toBeLessThanOrEqual(3)
    expect(CC13_DIVERGENCE_MEASURE.maxReadingsForOneCell).toBe(2)
  })

  it('actions 2 and 3 are not one defect: the lone dissenter changes sides', () => {
    const alone = (ordinal: Cc13Ordinal, column: Cc13Column): boolean =>
      CC13_WHERE_THE_MODULE_MATRIX_STANDS_ALONE.some(
        (c) => c.ordinal === ordinal && c.column === column,
      )
    // Action 3: §21.1.2 and §25.4 both say Read-only; §21.16 says prohibited.
    expect(fields(35009)[2]).toContain('Read-only')
    expect(fields(48446)[2]).toBe('Read-only')
    expect(fields(38684)[3]).toBe('Explicitly prohibited')
    expect(alone(3, 'Supervisor')).toBe(true)
    // Action 2: §21.1.2 and §21.16 agree; §25.4 is the odd one out.
    expect(fields(35008)[2]).toBe('Explicitly prohibited')
    expect(fields(38683)[3]).toBe('Explicitly prohibited')
    expect(fields(48445)[2]).toBe('Read-only')
    expect(alone(2, 'Supervisor')).toBe(false)
  })

  it('the whole Tenant Admin column reads two tokens that render oppositely', () => {
    for (const ordinal of ORDINALS) {
      expect(cc13ReadingsForAction(ordinal).section254['Tenant Admin']).toBe('Unavailable')
      const own = CC13_ACTIONS.find((a) => a.ordinal === ordinal)
      expect(own?.cells['Tenant Admin'].token).toBe('Explicitly prohibited')
    }
  })

  it('every finding names a line that carries what it says', () => {
    for (const f of CC13_READING_FINDINGS) {
      expect(f.sourceRefs.length).toBeGreaterThan(0)
      for (const ref of f.sourceRefs) expect(line(Number(ref.slice(1))).trim()).not.toBe('')
    }
    expect(CC13_READING_FINDINGS.some((f) => f.finding.includes('AC-CC-502'))).toBe(true)
  })
})

describe('the rail, as SB-16-02 draws it', () => {
  it('quotes L20195 and L20197 verbatim', () => {
    expect(line(20195)).toContain(CC13_RAIL_SPEC.ordering)
    expect(line(20195)).toContain(CC13_RAIL_SPEC.aboveTheRail)
    expect(line(20195)).toContain(CC13_RAIL_SPEC.screenName)
    expect(line(20195)).toContain(CC13_RAIL_SPEC.storyboard)
    expect(line(20197)).toContain(CC13_RAIL_SPEC.everyActionShown)
    expect(line(20197)).toContain(CC13_RAIL_SPEC.outOfScopeReason)
    expect(line(20238)).toContain(CC13_RAIL_SPEC.namedTest)
  })

  it('has three states and two scope filters, both closed and both the source-s words', () => {
    expect(CC13_RAIL_STATES).toEqual(['enabled', 'disabled', 'absent'])
    expect(CC13_SCOPE_FILTERS).toEqual(['Site', 'Area'])
    for (const scope of CC13_SCOPE_FILTERS) expect(line(20195)).toContain(scope)
  })

  it('lists all ten in canonical order for every viewer', () => {
    for (const column of CC13_COLUMNS) {
      const rail = cc13Rail({ heldColumns: [column] })
      expect(rail.map((r) => r.ordinal)).toEqual(ORDINALS)
    }
    expect(cc13Rail({ heldColumns: [] }).map((r) => r.ordinal)).toEqual(ORDINALS)
  })

  it('TEST-16-13: a Supervisor gets "Request release with a note", enabled, not a disabled release', () => {
    const r = cc13RailRendering(4, { heldColumns: ['Supervisor'] })
    expect(r.label).toBe(CC13_SUPERVISOR_SUBSTITUTION.substituteLabel)
    expect(r.substituted).toBe(true)
    expect(r.state).toBe('enabled')
    // The substitute label is the source's, not this build's paraphrase.
    expect(line(20195)).toContain(`"${CC13_SUPERVISOR_SUBSTITUTION.substituteLabel}"`)
    expect(line(20238)).toContain(CC13_SUPERVISOR_SUBSTITUTION.substituteLabel)
    expect(line(38836)).toContain(CC13_SUPERVISOR_SUBSTITUTION.substituteLabel)
    // And the cell it overrides still says what it says.
    expect(fields(38685)[3]).toBe(CC13_SUPERVISOR_SUBSTITUTION.cellText)
  })

  it('does not substitute for anyone else, and row four stays the release for a Quality Manager', () => {
    expect(cc13RailRendering(4, { heldColumns: ['Quality Manager'] }).substituted).toBe(false)
    expect(cc13RailRendering(4, { heldColumns: ['Quality Manager'] }).label).toBe(
      'Release a lot hold',
    )
    expect(cc13RailRendering(4, { heldColumns: ['Tenant Admin'] }).substituted).toBe(false)
    for (const ordinal of ORDINALS) {
      if (ordinal === 4) continue
      expect(cc13RailRendering(ordinal, { heldColumns: ['Supervisor'] }).substituted).toBe(false)
    }
  })

  it('ABSENT IS ONLY EVER THE OBJECT: a role refusal is disabled with its reason', () => {
    // Every prohibited cell, for every column, renders disabled and never absent.
    for (const ordinal of ORDINALS) {
      for (const column of CC13_COLUMNS) {
        const r = cc13RailRendering(ordinal, { heldColumns: [column] })
        if (r.state === 'absent')
          throw new Error(`role alone reached absent on ${ordinal}/${column}`)
        if (r.state === 'disabled') expect(r.reason).not.toBeNull()
      }
    }
    // The one route to absent, and it carries the stated reason.
    const na = cc13RailRendering(1, {
      heldColumns: ['Supervisor'],
      notApplicable: { 1: 'no escalation is selected' },
    })
    expect(na.state).toBe('absent')
    expect(na.reason).toBe('no escalation is selected')
  })

  // FAILS IF: the object check is moved ahead of the role check. THIS TEST
  // EXISTS BECAUSE ITS ABSENCE WAS FOUND BY A PLANT. The campaign moved the
  // `notApplicable` branch above the role branch and the whole suite stayed
  // green: every `notApplicable` fixture above uses a role that CAN act, so
  // both orders agree on all of them. The one input that separates the two is
  // a person who is refused BY ROLE and whose selected object ALSO does not
  // apply. Role first states the refusal; object first hides a standing
  // prohibition behind a condition that may not hold tomorrow.
  it('BRANCH ORDER: refused by role AND not applicable to the object states the refusal', () => {
    const r = cc13RailRendering(7, {
      heldColumns: ['Supervisor'],
      notApplicable: { 7: 'no evidence is selected' },
    })
    expect(r.state).toBe('disabled')
    expect(r.reason).toContain('Explicitly prohibited')
    expect(r.state).not.toBe('absent')
    // And the same person on the same object with a grant that DOES act goes
    // absent, so this is a statement about the order and not about the input.
    expect(
      cc13RailRendering(7, {
        heldColumns: ['Quality Manager'],
        notApplicable: { 7: 'no evidence is selected' },
      }).state,
    ).toBe('absent')
  })

  it('multi-role is additive: two grants together reach what neither reaches alone', () => {
    expect(cc13RailRendering(2, { heldColumns: ['Supervisor'] }).state).toBe('disabled')
    expect(cc13RailRendering(2, { heldColumns: ['Quality Manager'] }).state).toBe('enabled')
    expect(cc13RailRendering(2, { heldColumns: ['Supervisor', 'Quality Manager'] }).state).toBe(
      'enabled',
    )
    // And the audit's own rule, quoted where the build states it.
    expect(line(48458)).toContain('multi-role is additive')
  })

  it('an out-of-scope target disables with L20197-s own words and does not go absent', () => {
    const r = cc13RailRendering(8, { heldColumns: ['Supervisor'], outOfScope: [8] })
    expect(r.state).toBe('disabled')
    expect(r.reason).toBe('Out of scope for your grants')
    expect(line(20197)).toContain(r.reason as string)
  })

  it('surfaces the conditional grant-s condition rather than dropping it', () => {
    const r = cc13RailRendering(10, { heldColumns: ['Supervisor'] })
    expect(r.state).toBe('enabled')
    expect(r.condition).toBe('expired qualification only, Quality Manager notified')
    expect(fields(38691)[3]).toBe(`Allowed with conditions — ${r.condition ?? ''}`)
  })

  it('a person holding no column of this matrix is told so, not shown ten enabled controls', () => {
    const rail = cc13Rail({ heldColumns: [] })
    expect(rail.every((r) => r.state === 'disabled')).toBe(true)
    expect(rail.every((r) => (r.reason ?? '').length > 0)).toBe(true)
  })
})

describe('where it mounts, and the route it must not have', () => {
  it('L38793 names seven modules while its own sentence says every other module', () => {
    const l = line(38793)
    expect(l).toContain('Every other module on this surface')
    for (const m of CC13_EXERCISING_MODULES) expect(l).toContain(m)
    expect(CC13_EXERCISED_ON).toHaveLength(7)
    // Counted off the line rather than off the constant: how many MOD-CC ids
    // does the interconnection sentence actually name, left- and right-anchored?
    const named = new Set(
      [...l.matchAll(/(^|[^A-Za-z0-9-])(MOD-CC-\d{2})(?![A-Za-z0-9-])/g)].map((m) => m[2]),
    )
    expect(named.size).toBe(7)
    expect([...named].sort()).toEqual([...CC13_EXERCISING_MODULES].sort())
    // Twelve other modules exist. The sentence overstates its own list.
    expect(CC_MODULE_SPINE.filter((m) => m.id !== 'MOD-CC-13')).toHaveLength(12)
  })

  it('the enumeration is complete over the actions even though it is short of the modules', () => {
    expect([...CC13_ORDINALS_WITH_A_NAMED_SITE].sort((a, b) => a - b)).toEqual(ORDINALS)
    expect(cc13SitesForAction(5)).toEqual(['MOD-CC-10'])
    expect(cc13ActionsOnModule('MOD-CC-04')).toEqual([1, 2, 4, 7, 9])
    // A module the line does not name gets an empty list, not a throw.
    expect(cc13ActionsOnModule('MOD-CC-01')).toEqual([])
  })

  it('claims no route, asserted against the spine and never against a directory listing', () => {
    expect(ccModule('MOD-CC-13').slug).toBeNull()
    expect(CC13_ROUTELESSNESS.claimsNoSlug).toBe(true)
    // No claimed slug on this surface belongs to this module.
    const claimants = CC_MODULE_SPINE.filter(
      (m) => m.slug !== null && CC_CLAIMED_SLUGS.includes(m.slug),
    ).map((m) => m.id)
    expect(claimants).not.toContain('MOD-CC-13')
    expect(CC13_ROUTELESSNESS.claimedSlugsOnThisSurface).toBe(CC_CLAIMED_SLUGS.length)
    // And no screen or navigation entry hands it one.
    expect(CC_NAV.some((e) => e.owningModule === 'MOD-CC-13')).toBe(false)
    expect(CC_SCREENS.some((s) => s.modulesShown.includes('MOD-CC-13'))).toBe(false)
    // And it is absent from the register in the source, not merely from the
    // spine's reading of it. The register's own rows, read off the file.
    const registerRefs = CC_SCREENS.map((s) => Number(s.registerRef.slice(1)))
    for (const ref of registerRefs) expect(line(ref)).not.toContain('MOD-CC-13')
    expect(line(35261)).toContain(CC13_ROUTELESSNESS.forbiddenByText)
  })

  it('is the ONLY routeless module: MOD-CC-07 claims a slug and MOD-CC-02 is chrome', () => {
    const routeless = CC_MODULE_SPINE.filter((m) => m.slug === null).map((m) => m.id)
    expect(routeless).toContain('MOD-CC-13')
    expect(routeless).not.toContain('MOD-CC-07')
    expect(ccModule('MOD-CC-07').slug).toBe('learning-read-view')
    expect(CC_CLAIMED_SLUGS).toContain('learning-read-view')
    expect(line(48398)).toContain('MOD-CC-07')
  })
})

describe('the two findings this module owes and does not repair', () => {
  it('records the absence inversion against the write control it does not edit', () => {
    expect(CC13_ABSENCE_INVERSION.railRuleRef).toBe('L20195')
    expect(line(20195)).toContain('absent only where the action is `Not applicable`')
    const control = readFileSync(join(process.cwd(), 'src/ui/WriteControl.tsx'), 'utf8')
    // The build's mapping, read off the file rather than described from memory.
    expect(control).toContain("kind: 'absent'")
    expect(control).toContain("decision.outcome === 'explicitlyProhibited'")
    // And this module does not route its rail through it.
    const rail = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx'),
      'utf8',
    )
    expect(rail).not.toContain('WriteControl')
    expect(rail).toContain('ProhibitionNotice')
  })

  it('states the audit obligation and does not fabricate a destination for it', () => {
    expect(line(48437)).toContain(CC13_AUDIT_POINTER.obligation)
    expect(line(38657)).toContain('the Command Center is the cockpit, never the engine')
    expect(CC13_AUDIT_POINTER.destinationBuilt).toBe(false)
    // L48437 is a row of SB-25-03, and the precision is carried.
    expect(line(48421)).toContain('SB-25-03')
    expect(CC13_AUDIT_POINTER.obligationContext).toContain('SB-25-03')
  })

  it('every mount finding names a line that carries what it says', () => {
    for (const f of CC13_MOUNT_FINDINGS) {
      for (const ref of f.sourceRefs) expect(line(Number(ref.slice(1))).trim()).not.toBe('')
    }
    expect(CC13_MOUNT_FINDINGS.some((f) => f.finding.includes('imported by no page'))).toBe(true)
  })
})

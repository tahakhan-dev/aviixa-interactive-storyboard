import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  DOH_18_CONTROL_IDS,
  MOD_DOH_18_CARD,
  MOD_DOH_18_HAS_NO_SCREEN,
  MOD_DOH_18_MATRIX,
  MOD_DOH_18_MOUNT,
  doh18Row,
  type Doh18ControlId,
  type Doh18Row,
} from '@/surfaces/doh/modules/doh-18/matrix'
import {
  doh18Affordance,
  doh18CrossSurfaceRows,
  doh18RolesReaching,
} from '@/surfaces/doh/modules/doh-18/rendering'
import {
  DEC_REPORT_001_BLOCKS,
  DOH_18_BLOCKED,
  DOH_18_BUILDABLE,
  DOH_18_BUILD_POSITION,
  DOH_18_DATA_SETS,
  DOH_18_DECISION_HOME,
  DOH_18_SET_COUNT,
  blockDisagreements,
} from '@/surfaces/doh/modules/doh-18/datasets'
import {
  DOH_BOUNDARY_REGISTER,
  dohBoundaryById,
  inlineControlsOnAdjacentCapabilities,
} from '@/surfaces/doh/boundary'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { cellFromSource } from '@/policy/columns'
import type { TenantRoleId } from '../../app/hub/HubShell'

/**
 * `MOD-DOH-18` — Standard Report Data Sets.
 *
 * Every count here is measured against the frozen source or against the array,
 * never against a number in a brief. The source read uses the tree's own
 * convention (`tests/unit/doh-cloning.test.ts`), not an absolute path.
 */
const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

/** L-number to the source line, 1-based as every citation in this tree is. */
const sourceLine = (n: number): string => SOURCE[n - 1] ?? ''

/**
 * One pipe-delimited cell of a source table row, or a throw. A `?? ''` here
 * would turn a mis-measured column index into a silent empty string, and an
 * empty string satisfies nothing below only by accident.
 */
function cellAt(line: string, index: number): string {
  const cell = line.split('|')[index]
  if (cell === undefined) throw new Error(`no column ${index} on: ${line}`)
  return cell.trim()
}

const MODULE_DIR = join(process.cwd(), 'src/surfaces/doh/modules/doh-18')

const ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

const ROWS: readonly Doh18Row[] = MOD_DOH_18_MATRIX

describe('the control matrix, counted off the frozen source', () => {
  /**
   * COUNTED BY READING TO WHERE THE BODY STOPS, not by trusting a span. The
   * check is deliberately three separate assertions — a table-row test alone
   * passes on the separator row, which is on this build's list of gates that
   * could not fail.
   */
  it('has 8 data rows at L29921-L29928, with a header, a separator and a blank after', () => {
    expect(sourceLine(29919)).toContain('| Action | Tenant Admin |')
    expect(sourceLine(29920)).toBe('|---|---|---|---|---|---|')
    for (let n = 29921; n <= 29928; n++) {
      expect(sourceLine(n).startsWith('| ')).toBe(true)
      expect(sourceLine(n)).not.toBe('|---|---|---|---|---|---|')
    }
    expect(sourceLine(29929)).toBe('')
    expect(MOD_DOH_18_MATRIX).toHaveLength(8)
  })

  /** A literal list, not a length: 8 rows of anything satisfies a length. */
  it('carries exactly the eight ids, in the source’s row order', () => {
    expect(MOD_DOH_18_MATRIX.map((r) => r.id)).toEqual([...DOH_18_CONTROL_IDS])
    expect(MOD_DOH_18_MATRIX.map((r) => r.sourceRef.slice(0, 6))).toEqual([
      'L29921',
      'L29922',
      'L29923',
      'L29924',
      'L29925',
      'L29926',
      'L29927',
      'L29928',
    ])
  })

  /**
   * THE TRANSCRIPTION GATE: every one of the 40 cells is re-derived from the
   * source line and compared with the transcribed status. `cellFromSource`
   * does the token work, so the "`Allowed` is a prefix of `Allowed with
   * conditions`" hazard is answered by the separator rule rather than by a
   * second parser written here.
   */
  it('every cell’s status equals the token on its own source line', () => {
    const FROM_OUTCOME: Record<string, ControlStatus> = {
      allowed: 'allowed',
      allowedWithConditions: 'allowed-with-conditions',
      readOnly: 'read-only',
      explicitlyProhibited: 'explicitly-prohibited',
      notApplicable: 'not-applicable',
      unavailable: 'unavailable',
    }
    let checked = 0
    for (const row of ROWS) {
      const line = sourceLine(Number(row.sourceRef.slice(1, 6)))
      const cells = line.split('|').slice(2, 7)
      expect(cells).toHaveLength(5)
      ROLES.forEach((role, i) => {
        const parsed = cellFromSource(cellAt(line, i + 2))
        expect(FROM_OUTCOME[parsed.outcome]).toBe(row.status[role])
        checked += 1
      })
    }
    // Vacuous-pass control: 8 rows by 5 roles.
    expect(checked).toBe(40)
  })

  it('states a cause for every cell, per L10238', () => {
    for (const row of ROWS) {
      for (const role of ROLES) {
        expect(row.detail[role].trim()).not.toBe('')
      }
    }
  })

  it('doh18Row throws on an unknown id rather than answering undefined', () => {
    expect(() => doh18Row('not-a-control' as Doh18ControlId)).toThrow(/Unknown MOD-DOH-18/)
  })
})

describe('the four rows met on another surface, and only two of them say so', () => {
  /**
   * A LITERAL LIST. The brief named two cross-surface cells; four rows are
   * adjacent, and the two the brief did not name carry a BARE `Allowed`, which
   * is this build's recorded trap shape.
   */
  it('classifies exactly these four rows another-surface', () => {
    expect(ROWS.filter((r) => r.surface === 'another-surface').map((r) => r.id)).toEqual([
      'author-and-export-report-formats',
      'schedule-a-report-delivery',
      'enable-re-send-on-material-correction',
      'request-a-report-beyond-the-five-sets',
    ])
  })

  it('two of the four name their other surface in the cell, and two read a bare Allowed', () => {
    expect(sourceLine(29923)).toContain(
      '`Allowed with conditions` — through the Client Command Center Builder',
    )
    expect(sourceLine(29923)).toContain('`Allowed with conditions` — through the Builder')
    expect(sourceLine(29927)).toContain(
      '`Allowed with conditions` — only through a composed reasoning agent built in the Standards and Operations Studio',
    )
    // The two that do not, for exactly the same two actors.
    for (const n of [29922, 29924]) {
      expect(cellAt(sourceLine(n), 2)).toBe('`Allowed`')
      expect(cellAt(sourceLine(n), 4)).toBe('`Allowed`')
    }
  })

  /**
   * THE EVIDENCE FOR THE TWO BARE-`Allowed` ROWS, read whole. §19.20's own
   * business-rules paragraph, the §19.1.2 register row, and `MOD-CC-11`'s
   * matrix all place saved formats on the other surface.
   */
  it('the source puts saved formats and scheduling on the Client Command Center', () => {
    expect(sourceLine(29880)).toContain(
      'rendering, layout, saved formats and scheduled delivery are Client Command Center capabilities',
    )
    expect(dohBoundaryById('custom-report-builder').capability).toContain('saved formats')
    expect(dohBoundaryById('custom-report-builder').capability).toContain('scheduling')
    expect(dohBoundaryById('custom-report-builder').sourceRef).toBe('L25723')
    expect(sourceLine(25723)).toContain('saved formats')
    // MOD-CC-11 holds all three acts for exactly the Tenant Admin and the
    // Quality Manager, which is this card's two grants and its three refusals.
    for (const [n, act] of [
      [38292, 'Author a saved format'],
      [38294, 'Configure a schedule and recipient set'],
      [38295, 'Enable the re-send-on-material-correction option per format'],
    ] as const) {
      expect(cellAt(sourceLine(n), 1)).toBe(act)
      expect(cellAt(sourceLine(n), 2)).toBe('Allowed')
      expect(cellAt(sourceLine(n), 3)).toBe('Explicitly prohibited')
      expect(cellAt(sourceLine(n), 4)).toBe('Allowed')
    }
  })

  /**
   * THE OFF-REGISTER ROW, AND WHY. The register's Studio row names the Agent
   * Builder, and its Hub-contribution cell is about something else — which is
   * what `CrossSurfaceStatement` would have printed as the note.
   */
  it('row 7 carries no boundary and states why the register is not borrowed', () => {
    const row = doh18Row('request-a-report-beyond-the-five-sets')
    expect(row.boundary).toBeUndefined()
    expect(row.offRegister).not.toBeNull()
    expect(sourceLine(25725)).toContain('the Agent Builder')
    expect(dohBoundaryById('workflow-and-instruction-authoring').hubContributes).toBe(
      'Holds the Job-to-workflow reference and the adoption decision routing to the Job Owner',
    )
    expect(row.offRegister?.whyNotOnTheRegister).toContain('Job-to-workflow reference')
    // The source's own sentence that puts this act on the Studio.
    expect(sourceLine(29896)).toContain(
      'Reports beyond the five sets can be produced by **composed reasoning agents** through the Agent Builder',
    )
  })

  /**
   * NO ADJACENT ROW MAY PRODUCE A BOUNDARY CLAIM WITH NOTHING BEHIND IT. Both
   * shapes are legal and a third — neither — is not.
   */
  it('every another-surface row carries a boundary or an off-register statement, never neither', () => {
    for (const row of ROWS.filter((r) => r.surface === 'another-surface')) {
      expect(row.boundary !== undefined || row.offRegister !== null).toBe(true)
    }
    // And a screen row carries neither, which is what the shared gate checks.
    for (const row of ROWS.filter((r) => r.surface === 'screen')) {
      expect(row.boundary).toBeUndefined()
      expect(row.offRegister).toBeNull()
    }
  })

  it('the shared adjacency gate finds no inline control on this card', () => {
    expect(inlineControlsOnAdjacentCapabilities(ROWS, ROLES, cellStatus)).toEqual([])
  })

  /**
   * TWO DISTINCT BOUNDARIES, WHICH IS WHAT THE COMPONENT RENDERS ONE
   * STATEMENT PER. Rows 2, 3 and 4 are the same register row and would
   * otherwise draw three identical panels.
   */
  it('states two distinct boundaries across the four adjacent rows', () => {
    expect(doh18CrossSurfaceRows().map((r) => r.id)).toEqual([
      'author-and-export-report-formats',
      'request-a-report-beyond-the-five-sets',
    ])
    expect(DOH_BOUNDARY_REGISTER.map((r) => r.id)).toContain('custom-report-builder')
  })
})

describe('what the fold answers', () => {
  /**
   * THE `control` ARM FIRES ON EXACTLY ONE ROW, and this assertion was written
   * the other way round first — "no control anywhere" — and went red on row 1.
   * It was the assertion that was wrong: querying a standard data set is the
   * one act on this card that this surface both owns and grants, and the source
   * grants it to three roles.
   */
  it('answers control on exactly the query row, for exactly three roles', () => {
    const controls: string[] = []
    const kinds = new Set<string>()
    let cells = 0
    for (const row of ROWS) {
      for (const role of ROLES) {
        const kind = doh18Affordance(row, role).kind
        kinds.add(kind)
        if (kind === 'control') controls.push(`${row.id}/${role}`)
        cells += 1
      }
    }
    expect(cells).toBe(40)
    expect(controls).toEqual([
      'query-a-standard-data-set/TENANT_ADMIN',
      'query-a-standard-data-set/SUPERVISOR',
      'query-a-standard-data-set/QUALITY_MANAGER',
    ])
    // Positive control: the fold really did answer, rather than answering
    // nothing at all, which is how an absence assertion passes vacuously.
    expect([...kinds].sort()).toEqual(['absent', 'control', 'cross-surface', 'read-only'])
  })

  /**
   * AND NO INTERACTIVE CONTROL IS DRAWN, which is a different claim from the
   * one above and the one the reader is affected by. This module has no screen,
   * so the query is exercised where the source says it is — the Builder calls
   * the Hub (L29933) — and the component states the affordance rather than
   * offering it. No `<button>`, no field, no toggle, and no disabled control,
   * which would imply a condition that could become true.
   */
  it('the component draws no interactive control at all', () => {
    // COMMENTS STRIPPED FIRST. The prose below explains why there is no
    // disabled control, and a check over the raw file convicts the file for
    // naming what it refuses to have — a gate this build has already shipped
    // once. What is checked is what the component EMITS.
    const component = readFileSync(join(MODULE_DIR, 'StandardReportDataSets.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    for (const tag of [
      '<button',
      '<input',
      '<select',
      '<textarea',
      'onClick',
      'disabled=',
      'aria-disabled',
    ]) {
      expect(component).not.toContain(tag)
    }
    // Positive control: the stripping left the component behind.
    expect(component).toContain('export function StandardReportDataSets')
    expect(sourceLine(29933)).toContain('The Builder calls the Hub, which computes the set')
  })

  it('the classification wins over a bare permissive token', () => {
    const row = doh18Row('author-and-export-report-formats')
    expect(row.status.TENANT_ADMIN).toBe('allowed')
    expect(doh18Affordance(row, 'TENANT_ADMIN').kind).toBe('cross-surface')
  })

  it('the Read-only Auditor’s Read-only is a read on a read row', () => {
    const row = doh18Row('query-a-standard-data-set')
    expect(row.control).toBe('Query a standard data set')
    const affordance = doh18Affordance(row, 'READONLY_AUDITOR')
    expect(affordance.kind).toBe('read-only')
  })

  it('the cross-surface statement’s link is checked, never asserted', () => {
    const row = doh18Row('schedule-a-report-delivery')
    for (const role of ROLES) {
      const affordance = doh18Affordance(row, role)
      if (affordance.kind !== 'cross-surface') throw new Error('expected a cross-surface answer')
      const { linkState, linkHref, linkLabel } = affordance.statement
      if (linkState === 'link') {
        expect(linkHref).not.toBeNull()
        expect(linkLabel).not.toBeNull()
      } else {
        expect(linkHref).toBeNull()
        expect(linkLabel).toBeNull()
      }
      expect(affordance.statement.note.trim()).not.toBe('')
    }
  })
})

describe('reach, and whether the classification moves it', () => {
  it('answers four roles and withholds the Worker', () => {
    expect([...doh18RolesReaching()]).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
  })

  /**
   * MEASURED RATHER THAN ASSERTED: reclassifying all four adjacent rows back
   * to `screen` returns the same four roles, so the classification is
   * load-bearing for what RENDERS and is not smuggling a reach decision.
   */
  it('reclassifying every adjacent row to screen returns the same four roles', () => {
    const flattened = ROWS.map((row) => ({ ...row, surface: 'screen' as const }))
    expect(rolesReachingByMatrix(flattened, cellStatus)).toEqual(doh18RolesReaching())
  })
})

describe('DEC-REPORT-001 — where the ruling is, and where the disclosure lives', () => {
  /**
   * THE PLAN AND THE COMMON BRIEF BOTH CITE L113022 FOR THE RULING. They are
   * one line short. Both lines are read here so the correction is pinned
   * rather than described.
   */
  it('the ruling is L113023 and L113022 is the implementation-cost line', () => {
    expect(sourceLine(113023)).toBe(
      '- **Blocking or non-blocking:** Blocking for Delivery Operations Hub Band B module 18 sets 4 and 5; non-blocking for sets 1 to 3.',
    )
    expect(sourceLine(113022)).toBe(
      '- **Implementation impact:** Moderate for composition changes; trivial for wording.',
    )
  })

  /**
   * THE LOCATORS THIS MODULE PRINTS ARE OPENED, not merely spelled. Each
   * blocked set's `blockedBy` carries three L-numbers into a rendered string,
   * and a reader treats a printed locator as something they can open. The
   * number is parsed back out and the line read.
   */
  it('every locator this module renders carries what it says it carries', () => {
    const claims: [string, string][] = []
    for (const set of DOH_18_BLOCKED) {
      const block = set.blockedBy
      if (block === null) throw new Error('a blocked set with no block')
      claims.push(
        [block.rulingLocator, 'Blocking for Delivery Operations Hub Band B module 18 sets 4 and 5'],
        [block.registerRowLocator, 'Build sets 1 to 3; hold 4 and 5'],
        [block.whyHeldRatherThanRenamedLater, 'is not a rename; it is a new query'],
      )
    }
    claims.push([DOH_18_DECISION_HOME.registerRow, '`DEC-REPORT-001` | Pre-existing | 21.14'])
    // Vacuous-pass control: two blocked sets, three claims each, plus one.
    expect(claims).toHaveLength(7)
    for (const [locator, fragment] of claims) {
      const match = /L(\d+)/.exec(locator)
      if (match === null) throw new Error(`no L-number in: ${locator}`)
      expect(sourceLine(Number(match[1]))).toContain(fragment)
    }
  })

  it('the register row states the same as a build instruction', () => {
    expect(sourceLine(113037)).toContain('Build sets 1 to 3; hold 4 and 5')
    expect(sourceLine(113037)).toContain('`DEC-REPORT-001`')
  })

  it('the count of five and this surface’s ownership are settled, not open', () => {
    expect(sourceLine(113013)).toContain(
      'The count of five and the ownership by the Delivery Operations Hub with rendering in the Client Command Center are settled and not in question',
    )
  })

  it('the hold is not a rename-later', () => {
    expect(sourceLine(113016)).toContain(
      'is not a rename; it is a new query, new grouping, and new test coverage',
    )
  })

  /**
   * ONE HOME. The identifier is absent from the canon — `tests/unit/cc-11.
   * test.ts` asserts that too — and `MOD-CC-11` carries the local disclosure.
   * This module points at it and re-records nothing, which is checked by
   * reading this module's own files for the disclosure shape rather than by
   * trusting the intention.
   */
  it('is absent from the canon and is not re-recorded in this module', () => {
    expect((OPEN_DECISION_IDS as readonly string[]).includes('DEC-REPORT-001')).toBe(false)
    expect(DOH_18_DECISION_HOME.disclosedAt).toBe(
      'src/surfaces/cc/modules/cc-11/report-sets.ts',
    )
    // Source files only. A flat readdir under src/ cannot meet a foreign
    // scratch probe (those live under tests/), but a directory entry would
    // throw on the read below rather than being reported.
    const files = readdirSync(MODULE_DIR).filter((f) => /\.tsx?$/.test(f))
    expect(files).toEqual([
      'StandardReportDataSets.tsx',
      'datasets.ts',
      'matrix.ts',
      'rendering.ts',
    ])
    for (const file of files) {
      const text = readFileSync(join(MODULE_DIR, file), 'utf8')
      // The canon's own field names. A record here would carry them.
      expect(text).not.toMatch(/readings:\s*\[/)
      expect(text).not.toMatch(/\bOpenDecision\b/)
      expect(text).not.toMatch(/\bCcLocalDisclosure\b/)
    }
  })
})

describe('the five sets, three built and two decision-blocked', () => {
  it('is five, computed', () => {
    expect(DOH_18_SET_COUNT).toBe(5)
    expect(DOH_18_DATA_SETS.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5])
  })

  /**
   * THE BLOCK IS DERIVED FROM THE DIVERGENCE AND CHECKED AGAINST THE RULING'S
   * OWN ORDINALS. Two independent statements: a count check would be true of
   * both a defect and its fix here, because three and two are the only two
   * numbers available.
   */
  it('derives the block from the divergence the source records', () => {
    expect(DOH_18_BLOCKED.map((s) => s.ordinal)).toEqual([4, 5])
    expect(DOH_18_BUILDABLE.map((s) => s.ordinal)).toEqual([1, 2, 3])
  })

  /**
   * THE SECOND, INDEPENDENT STATEMENT. Asserted on its own so it is the
   * derivation-against-the-ruling check and not a bystander to the check above.
   */
  it('the derivation and the ruling’s own ordinals agree', () => {
    expect(blockDisagreements()).toEqual([])
    expect([...DEC_REPORT_001_BLOCKS]).toEqual([4, 5])
  })

  it('names the three uncontested sets the trade-off paragraph names', () => {
    expect(DOH_18_BUILDABLE.map((s) => s.agreedName)).toEqual([
      'Worker utilisation by Area',
      'Run completion rate by Job',
      'Workflow-version usage',
    ])
    expect(sourceLine(113016)).toContain(
      'worker utilisation by Area, run completion rate by Job, workflow-version usage',
    )
  })

  /**
   * BOTH WORDINGS, NEITHER CHOSEN — and both are read back off their own
   * source lines, so a transcription drift on either side turns this red.
   */
  it('carries both candidate wordings for each blocked set, and no chosen name', () => {
    for (const set of DOH_18_BLOCKED) {
      expect(set.agreedName).toBeNull()
      expect(set.hubWording.text).not.toBe(set.commandCenterWording.text)
      expect(set.blockedBy?.decisionRef).toBe('DEC-REPORT-001')
      const hubLine = sourceLine(Number(set.hubWording.locator.slice(1)))
      expect(hubLine).toContain(set.hubWording.text)
      const ccLine = sourceLine(Number(set.commandCenterWording.locator.slice(1)))
      expect(ccLine).toContain(set.commandCenterWording.text)
    }
    // The two pairs, named, so a set silently dropped from the loop is visible.
    expect(DOH_18_BLOCKED.map((s) => [s.hubWording.locator, s.commandCenterWording.locator])).toEqual(
      [
        ['L29887', 'L38264'],
        ['L29888', 'L38265'],
      ],
    )
  })

  it('a buildable set carries the same name from both Parts', () => {
    for (const set of DOH_18_BUILDABLE) {
      expect(set.hubWording.text).toBe(set.commandCenterWording.text)
      expect(set.agreedName).toBe(set.hubWording.text)
      expect(set.blockedBy).toBeNull()
    }
  })

  it('the rendered build position counts three built and two held', () => {
    expect(DOH_18_BUILD_POSITION).toContain('names 5 standard report data sets')
    expect(DOH_18_BUILD_POSITION).toContain('builds 3 of them')
    expect(DOH_18_BUILD_POSITION).toContain('The remaining 2 are decision-blocked')
  })
})

describe('the module has no screen of its own, and says so', () => {
  it('no catalogue B row names MOD-DOH-18 except the rail’s range', () => {
    const naming: number[] = []
    for (let n = 48095; n <= 48117; n++) {
      if (sourceLine(n).includes('MOD-DOH-18')) naming.push(n)
    }
    expect(naming).toEqual([])
    expect(sourceLine(48096)).toContain('The module rail across MOD-DOH-01 to MOD-DOH-19')
    // The span really is the catalogue: 23 rows, a header and a separator.
    expect(sourceLine(48094)).toBe('|---|---|---|---|---|---|')
    expect(sourceLine(48118)).toBe('')
  })

  it('prints the abstention rather than keeping it in a comment', () => {
    expect(MOD_DOH_18_HAS_NO_SCREEN.statement).toContain('SCR-DOH-02')
    expect(MOD_DOH_18_HAS_NO_SCREEN.catalogueSpan).toBe('L48095-L48117')
  })

  /**
   * THE MISSING MOUNT, MEASURED, AND THE CONTRAST MEASURED WITH IT.
   *
   * `MOD_DOH_18_HAS_NO_SCREEN` used to call `MOD-DOH-15` "the same shape",
   * which pointed a reader at a module whose panel IS mounted — so the record
   * described this module's condition as the opposite of what it is. Both
   * halves are asserted here rather than described, because a hand-written
   * `hostToday: null` is the same rot one level down: the day somebody mounts
   * this component the first assertion reds, and the day `MOD-DOH-15`'s panel
   * is unmounted the second one does, and either way the record is corrected
   * instead of going quietly stale.
   *
   * PLANTED (on a /tmp copy of the two files, since `app/` is not this task's
   * to write): an `import { StandardReportDataSets } from
   * '@/surfaces/doh/modules/doh-18/StandardReportDataSets'` line added to a
   * copy of `app/hub/page.tsx`, and the `doh-15/JobCloningPanel` import
   * removed from a copy of `JobLifecycleScreen.tsx`. Both reds recorded in the
   * report; both copies discarded.
   */
  it('has no host under `app/`, while the module it names as a contrast does', () => {
    const appFiles = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        isForeignProbe(e.name)
          ? []
          : e.isDirectory()
            ? appFiles(join(dir, e.name))
            : [join(dir, e.name)],
      )
    const importers = (needle: string): string[] =>
      appFiles(join(process.cwd(), 'app')).filter((f) =>
        [...readFileSync(f, 'utf8').matchAll(/from\s+'([^']+)'/g)].some((m) =>
          (m[1] ?? '').includes(needle),
        ),
      )

    expect(MOD_DOH_18_MOUNT.hostToday).toBe(null)
    expect(importers('doh-18')).toEqual([])
    // The contrast, measured on the same walk: MOD-DOH-15 has no catalogue B
    // row of its own either, and its panel is mounted inside SCR-DOH-11.
    expect(importers('doh-15/JobCloningPanel').length).toBeGreaterThan(0)
    // And the host named for this module is a real file, so the instruction
    // is followable rather than aspirational.
    expect(existsSync(join(process.cwd(), MOD_DOH_18_MOUNT.intendedHost))).toBe(true)
  })

  it('the identity card’s own claims are the source’s', () => {
    expect(sourceLine(29902)).toContain('`MOD-DOH-18`')
    expect(sourceLine(29903)).toContain(MOD_DOH_18_CARD.name)
    expect(sourceLine(29906)).toContain(
      'Delivery Operations Hub (`SURF-DOH`) owns the data; the Client Command Center renders it.',
    )
    expect(sourceLine(29910)).toContain(MOD_DOH_18_CARD.objectsAffected)
    for (const state of MOD_DOH_18_CARD.states) {
      expect(sourceLine(29911)).toContain(`\`${state}\``)
    }
  })
})

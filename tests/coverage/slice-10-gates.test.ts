import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve, relative } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { stripComments } from './strip-comments'

import {
  NOTIFICATION_STATE_DISTINCTIONS,
  NOTIFICATION_STATES,
  SCHEDULE_OCCURRENCE_STATES,
} from '@/domain/vocabularies'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import {
  CH_27_7_CATALOG,
  CH_30C_2_CATEGORIES,
  NOTIFICATION_COLLISIONS,
  NOTIFICATION_REGISTERS,
} from '@/registry/signals'
import { OPEN_DECISIONS, type DecisionId } from '@/disclosure/decisions'
import {
  columnAttribution,
  columnKey,
  evaluateColumnAccess,
  type AggregateColumn,
  type ColumnMatrixRow,
  type IdentityColumn,
  type MatrixColumn,
} from '@/policy/columns'
import { MATRIX_A, MATRIX_B } from '@/policy/schedule-operations'
import { SCHEDULE_KEY_SPACES, SCHEDULED_WORK_CENSUS } from '@/scheduling/registers'
import {
  DEC_REPORT_001_BLOCKS,
  DOH_18_BLOCKED,
  DOH_18_BUILDABLE,
  DOH_18_DATA_SETS,
} from '@/surfaces/doh/modules/doh-18/datasets'
import {
  auditReadLicence,
  readableAuditEvents,
  type AuditEventReference,
} from '@/surfaces/doh/modules/doh-11/rendering'
import {
  auditContext,
  NEIGHBOUR_TENANT_ID,
  SEEDED_AUDIT_EVENTS,
} from '@/surfaces/doh/modules/doh-11/fixtures'
import { OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT } from '@/surfaces/sa/scheduler/registry'

/* ==================================================================== *
 * SLICE 10 GATES — notifications, schedules, audit and reports.
 *
 * Thirteen build tasks land before this file, which is why it is written
 * last: A DIRECTORY ENUMERATION WRITTEN BEFORE THE DIRECTORIES EXIST PASSES
 * ON AN EMPTY SCAN. Every derived list below therefore asserts a floor and
 * its failure message names what it walked, so a scan that found nothing
 * says so instead of going green.
 *
 * WHAT THIS FILE IS FOR, AND WHAT IT DELIBERATELY DOES NOT DO. Each of the
 * thirteen tasks shipped its own suite and those suites are thorough — the
 * decision canon, the two notification registers, the six vocabularies, the
 * column type, the four scheduled-work registers and both wave-2 routes each
 * have a unit or component file that transcribes them against the frozen
 * source row by row. Re-asserting any of that here would be the fourth entry
 * this slice added to the gates-that-could-not-fail catalogue: A GATE DELETED
 * BECAUSE TWO EXISTING ASSERTIONS FIRED BEFORE IT ON EVERY INPUT. So every
 * gate here holds a claim that spans TASKS — a build-wide sweep, a population
 * asserted in both directions, or an arm no shipped call site exercises and
 * which a gate is therefore the only thing holding.
 *
 * THE CATALOGUE THIS FILE WAS WRITTEN AGAINST. `Allowed` being a prefix of
 * `Allowed with conditions` · `toEqual([...MY_CONSTANT])` · a `for...of` over
 * the constant it was meant to verify · a table check satisfied by the
 * `|---|---|` separator · a count check true of both the defect and the fix
 * because two categories had the same number of rows · a locator check
 * satisfied by a token most cells carry · a row-count gate proved by a rename
 * · a gate red on the shipped tree because a comment named the field it
 * refuses · a gate whose failure message asserted more than its predicate
 * tested. And this slice's own four: a harness that reported red without
 * running, a citation check whose segments never met, a column loop that
 * asserted against the constant it drew from, and a gate two earlier
 * assertions always beat to the punch.
 *
 * THREE OF THESE ARE FREEZE ASSERTIONS and are named rather than left for a
 * reader to find: the two notification register bodies, the two command-state
 * enumerations, and the occurrence-outcome pair. Their subject is read-only
 * input, so the only thing that can turn them red is the source drifting,
 * which is what they are for, and the sha256 below is what makes them mean
 * anything.
 * ==================================================================== */

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const SOURCE_BYTES = readFileSync(SOURCE)
const SOURCE_LINES = SOURCE_BYTES.toString('utf8').split('\n')

/** One WHOLE line of the frozen source, 1-indexed, or a throw. Never a slice. */
function line(n: number): string {
  const text = SOURCE_LINES[n - 1]
  if (text === undefined) throw new Error(`the frozen source has no line ${n}`)
  return text
}

/** Curly quotation marks folded to ASCII. A typographic difference, not a claim. */
const flat = (s: string): string => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

/**
 * Split a markdown table row into its fields. A separator row is refused: it
 * splits into the right number of fields and has satisfied a table-shape gate
 * in this build before.
 */
function cellsOf(n: number): readonly string[] {
  const raw = line(n)
  if (!raw.startsWith('|') || !raw.trimEnd().endsWith('|')) {
    throw new Error(`L${n} is not a markdown table row: ${JSON.stringify(raw.slice(0, 60))}`)
  }
  const fields = raw
    .trimEnd()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((f) => f.trim())
  if (fields.every((f) => /^:?-{2,}:?$/.test(f))) {
    throw new Error(`L${n} is a separator row, not a data row`)
  }
  return fields
}

/** The data lines of the table headed at `headerLine`, COUNTED, never inferred. */
function tableBody(headerLine: number): readonly number[] {
  const separator = line(headerLine + 1)
  expect(
    /^\|(\s*:?-{3,}:?\s*\|)+$/.test(separator.trimEnd()),
    `L${headerLine + 1} is not the separator under the header at L${headerLine}`,
  ).toBe(true)
  const rows: number[] = []
  let n = headerLine + 2
  while (n <= SOURCE_LINE_COUNT && line(n).startsWith('|')) {
    rows.push(n)
    n += 1
  }
  expect(rows.length, `no data rows under the header at L${headerLine}`).toBeGreaterThan(0)
  expect(
    line(rows[rows.length - 1]! + 1).startsWith('|'),
    `the body under L${headerLine} does not stop where this walk says it does`,
  ).toBe(false)
  return rows
}

/**
 * DERIVE A LOCATOR RATHER THAN CHECKING IT IS NON-BLANK. A locator gate that
 * only asked whether a cited line was blank stayed green when a citation was
 * moved to another non-blank line. This requires the phrase to occur EXACTLY
 * ONCE in 122,241 lines and returns the line carrying it, so the claim is
 * "this line is the one with these words" rather than "this line exists".
 */
function uniqueLineCarrying(phrase: string): number {
  const found: number[] = []
  for (let n = 1; n <= SOURCE_LINE_COUNT; n += 1) if (line(n).includes(phrase)) found.push(n)
  expect(found.length, `phrase is not unique in the frozen source: ${JSON.stringify(phrase)}`).toBe(
    1,
  )
  return found[0]!
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const CODE = /\.(?:ts|tsx)$/

/**
 * Every authored TypeScript file under the given roots, with a FLOOR and a
 * message that names what was walked. This is the one instrument the ordering
 * rule exists for: run before the build tasks landed, the same call returns a
 * short list and every sweep over it passes while measuring almost nothing.
 */
function authoredSources(roots: readonly string[], floor: number): readonly string[] {
  const files = roots
    .flatMap((rel) => walk(join(ROOT, rel)))
    .filter((f) => CODE.test(f))
    .map((f) => relative(ROOT, f))
    .sort()
  expect(
    files.length,
    `walked ${roots.join(', ')} for ${CODE.source} and found ${files.length} files, below the ` +
      `floor of ${floor}; a sweep over an empty or half-written tree passes while measuring nothing`,
  ).toBeGreaterThan(floor)
  return files
}

const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8')

/**
 * The file's CODE, comments removed, so prose naming a shape is not the shape.
 *
 * MEMOISED, and that is not a micro-optimisation: `stripComments` asks the
 * TypeScript compiler to parse the file, and the sweeps below walk the whole
 * of `src/` and `app/` a dozen times over. Un-memoised, one of them crossed
 * the five-second default and reported `Test timed out`, which names the clock
 * and not the cause — the same shape as a summary line read instead of an exit
 * code. The build's own rule applies: a gate slow because it re-parses one
 * file nineteen times is made fast rather than given more time.
 */
const CODE_CACHE = new Map<string, string>()
const code = (rel: string): string => {
  const hit = CODE_CACHE.get(rel)
  if (hit !== undefined) return hit
  const stripped = stripComments(read(rel))
  CODE_CACHE.set(rel, stripped)
  return stripped
}

/** Every authored file under `src/` and `app/`. The floor is measured, not guessed. */
const ALL_SOURCES = (): readonly string[] => authoredSources(['src', 'app'], 400)

/* ==================================================================== *
 * THE INSTRUMENTS, EXERCISED ON THIS RUN RATHER THAN TRUSTED.
 * ==================================================================== */

describe('slice 10 gates: the frozen source and the instruments that read it', () => {
  it('is the sha256 and the line count this slice was built against', () => {
    expect(existsSync(SOURCE), `the frozen source is not at ${SOURCE}`).toBe(true)
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    // The file ends in a newline, so the split's last member is the empty tail
    // rather than a line.
    expect(SOURCE_LINES[SOURCE_LINES.length - 1]).toBe('')
    expect(SOURCE_LINES.length - 1).toBe(SOURCE_LINE_COUNT)
  })

  it('the row walker stops where the body stops and refuses a separator as data', () => {
    // Chapter 27.7's notification catalog: header, separator, then the body.
    expect(tableBody(51_686).length).toBe(25)
    expect(() => cellsOf(51_687)).toThrow(/separator row/)
    expect(() => tableBody(51_687)).toThrow()
  })

  it('a locator is derived by searching for a unique phrase, not by being non-blank', () => {
    expect(uniqueLineCarrying('Audit reading never bypasses the authorisation')).toBe(74_029)
    expect(() => uniqueLineCarrying('Explicitly prohibited')).toThrow(/not unique/)
  })

  it('the derived-file walker has a floor and its message names what it walked', () => {
    const files = ALL_SOURCES()
    expect(files.some((f) => f.startsWith('src/'))).toBe(true)
    expect(files.some((f) => f.startsWith('app/'))).toBe(true)
    // THE FLOOR ITSELF, EXERCISED. A walk that finds nothing must throw rather
    // than return an empty list that every later sweep passes over.
    expect(() => authoredSources(['src/registry'], 50)).toThrow(/below the floor/)
  })
})

/* ==================================================================== *
 * GATE 1 — BOTH NOTIFICATION REGISTERS STAY KEYED.
 *
 * Two catalogues key on `NOTIF-*` and both number from `NOTIF-001`. Chapter
 * 27.7's twenty-five identifiers are ALL claimed by Chapter 30C.2's
 * eighty-seven and NOT ONE names the same notification in both, so a bare
 * literal does not identify a row.
 *
 * WHAT NO TASK SUITE CAN SEE: whether a bare literal is loose anywhere ELSE
 * in the build. `tests/unit/slice-10-signals.test.ts` proves the resolvers
 * refuse one at the type level; that is a statement about `src/registry/
 * signals.ts`, not about the tree. This gate is the tree.
 * ==================================================================== */

/**
 * A bare, unqualified register identifier in CODE. Three digits exactly:
 * `NOTIF-DOH-01-1` and `NOTIF-DEV-SEV1` are mnemonics in a different key
 * space and are not what collides.
 */
const BARE_NOTIF = /['"`](NOTIF-\d{3})['"`]/g

const filesWithBareNotifLiterals = (): readonly string[] =>
  ALL_SOURCES().filter((f) => BARE_NOTIF.test(code(f)) || ((BARE_NOTIF.lastIndex = 0), false))

describe('slice 10 gate 1: both notification registers stay keyed, build-wide', () => {
  it('counts both bodies off the source and finds the union larger than either', () => {
    const ch277 = tableBody(51_686)
    expect(ch277).toHaveLength(25)
    expect(CH_27_7_CATALOG).toHaveLength(ch277.length)

    // Chapter 30C.2 is THIRTEEN tables, not one, so its body is walked as
    // thirteen bodies and the separator count is what says thirteen. Counting
    // the pipe lines alone would be satisfied by twelve tables and one long
    // one, which is the shape a count check cannot tell from the truth.
    const band = { from: 72_948, to: 73_096 }
    let separators = 0
    let dataRows = 0
    for (let n = band.from; n <= band.to; n += 1) {
      const raw = line(n)
      if (!raw.startsWith('|')) continue
      if (/^\|(\s*:?-{3,}:?\s*\|)+$/.test(raw.trimEnd())) separators += 1
      else if (/^\| `NOTIF-\d{3}`/.test(raw)) dataRows += 1
    }
    expect(separators).toBe(13)
    expect(dataRows).toBe(87)
    expect(CH_30C_2_CATEGORIES).toHaveLength(dataRows)

    // 112 is the UNION keyed by (register, identifier) and it is larger than
    // either register, which is the whole finding: keying on the identifier
    // alone yields 87 and reads as complete.
    expect(NOTIFICATION_REGISTERS).toHaveLength(2)
    expect(ch277.length + dataRows).toBe(112)
    expect(112).toBeGreaterThan(dataRows)
  })

  it('finds zero name agreement across the twenty-five, read off both lines', () => {
    // Derived from the SOURCE on both sides rather than from the module's own
    // collision table, which would be a gate whose expected value is produced
    // by the code under test.
    const ch277Names = new Map(
      tableBody(51_686).map((n) => {
        const cells = cellsOf(n)
        return [flat(cells[0]!).replace(/`/g, ''), flat(cells[1]!)]
      }),
    )
    const ch30c2Names = new Map<string, string>()
    for (let n = 72_948; n <= 73_096; n += 1) {
      const raw = line(n)
      if (!/^\| `NOTIF-\d{3}`/.test(raw)) continue
      const cells = cellsOf(n)
      ch30c2Names.set(flat(cells[0]!).replace(/`/g, ''), flat(cells[1]!))
    }
    const overlap = [...ch277Names.keys()].filter((id) => ch30c2Names.has(id))
    expect(overlap).toHaveLength(25)
    const agreeing = overlap.filter((id) => ch277Names.get(id) === ch30c2Names.get(id))
    expect(
      agreeing,
      'an identifier now names the same notification in both registers, so the collision the ' +
        'branded key exists for has changed shape and the disclosure has to be re-read',
    ).toEqual([])
    // NON-VACUITY: the comparison is between two populated maps of real names,
    // not between two empty ones.
    expect(new Set([...ch277Names.values()]).size).toBe(25)
    expect(NOTIFICATION_COLLISIONS).toHaveLength(overlap.length)
  })

  it('holds every bare three-digit literal in the tree to three named files', () => {
    // ASSERTED IN BOTH DIRECTIONS. Red when a FOURTH file starts carrying one,
    // and red when one of these three stops — a bare literal that has moved is
    // a bare literal nobody is watching.
    //
    // Why each is here, and none of the three is a lookup:
    //  - `src/registry/signals.ts` DECLARES both registers; the identifiers are
    //    its data.
    //  - `src/surfaces/doh/modules/doh-10/matrix.ts` transcribes the source's
    //    own enumeration of non-disableable categories and the three mandatory
    //    families. They are `readonly string[]`, deliberately not the register
    //    id union, because the difference between the source's list and the
    //    group membership IS that module's finding.
    //  - `src/ui/primitives/LockedControl.tsx` carries one inside the THROW
    //    MESSAGE that refuses a bare identifier as a control id.
    expect(filesWithBareNotifLiterals()).toEqual([
      'src/registry/signals.ts',
      'src/surfaces/doh/modules/doh-10/matrix.ts',
      'src/ui/primitives/LockedControl.tsx',
    ])

    // AND THE ONE OF THE THREE THAT REACHES A SCREEN IS QUALIFIED THERE. The
    // preference screen's control ids are register-prefixed, so two callers
    // reading different registers cannot emit one document id twice.
    const rendering = code('src/surfaces/doh/modules/doh-10/rendering.ts')
    expect(rendering).toMatch(/ch30c2-\$\{[a-zA-Z.]+\}/)
    expect(rendering).not.toMatch(BARE_NOTIF)
  })
})

/* ==================================================================== *
 * GATE 2 — THE CLOSED VOCABULARIES STAY CLOSED AND STAY DISTINCT.
 *
 * The exhaustiveness of each union is a COMPILE-TIME property and each
 * vocabulary's own suite holds it. What no suite holds is that a vocabulary
 * is declared ONCE: a second declaration is a second thing to drift, and this
 * build has already paid for that class twenty-nine times over with the
 * canon count.
 * ==================================================================== */

describe('slice 10 gate 2: the vocabularies stay closed, and each is declared once', () => {
  it('reads the nineteen notification states off L51605 and finds the shipped order', () => {
    const l = line(51_605)
    expect(l).toContain('Sending is not delivery; delivery is not opening')
    // THE NINETEEN ARE NINETEEN SEPARATE BACKTICKED SPANS, and the segment
    // they sit in is bounded on both sides before they are collected: this
    // line runs past five hundred characters and its closing sentences carry
    // backticked prose of their own. Taking every backticked span on the line
    // reads whatever the paragraph happens to quote; taking the span between
    // "The states are:" and the sentence that closes it reads the enumeration.
    const from = l.indexOf('The states are:')
    expect(from, 'L51605 no longer opens its enumeration with "The states are:"').toBeGreaterThan(0)
    const segment = l.slice(from, l.indexOf('.', l.lastIndexOf('`reconciled`')))
    const named = [...segment.matchAll(/`([a-z-]+)`/g)].map((m) => m[1]!)
    expect(named).toHaveLength(19)
    expect([...NOTIFICATION_STATES]).toEqual(named)

    // THE FOUR DISTINCTIONS AS AN ORDERING, AND THE PAIRS ARE THE SHIPPED
    // CONSTANT'S rather than four pairs typed here. A `for...of` over a list
    // the gate wrote itself is in this build's catalogue: it shrinks along
    // with its subject and it cannot see a swap in the constant it was
    // supposed to check. Two independent objects are compared — the shipped
    // pairs against the vocabulary's own index order — so a swapped pair is
    // red even while the vocabulary still equals the source's list above.
    expect(NOTIFICATION_STATE_DISTINCTIONS.length).toBe(4)
    for (const { earlier, later } of NOTIFICATION_STATE_DISTINCTIONS) {
      const a = NOTIFICATION_STATES.indexOf(earlier)
      const b = NOTIFICATION_STATES.indexOf(later)
      expect(a, `${earlier} is not in the vocabulary`).toBeGreaterThanOrEqual(0)
      expect(b, `${later} does not follow ${earlier} in the vocabulary`).toBeGreaterThan(a)
    }
    // The four are a CHAIN through the vocabulary, which is the property the
    // sentence states and which four unrelated ordered pairs would not have:
    // each pair's later state is the next pair's earlier one.
    expect(NOTIFICATION_STATE_DISTINCTIONS.slice(1).map((d) => d.earlier)).toEqual(
      NOTIFICATION_STATE_DISTINCTIONS.slice(0, -1).map((d) => d.later),
    )
  })

  it('finds fifteen command states in BOTH source enumerations, the pair held apart', () => {
    // Two statements of one vocabulary, and they spell the third member
    // differently — one writes it long, the other short. That difference is
    // recorded and NOT resolved here; what is asserted is the count and the
    // one distinction `AC-27.3-02` names, which both statements honour.
    // The long statement backticks each member; the short one writes them as
    // plain prose between two em dashes. Both are bounded before collecting,
    // for the same reason as the nineteen above: both lines carry backticked
    // prose and commas well past the end of the enumeration.
    const longLine = line(50_792)
    const long = [
      ...longLine
        .slice(
          longLine.indexOf('Fifteen states are distinguished:'),
          longLine.indexOf('.', longLine.lastIndexOf('`reconciled`')),
        )
        .matchAll(/`([a-z][a-z ]*)`/g),
    ].map((m) => m[1]!)

    const shortLine = line(42_846)
    const dashes = [...shortLine.matchAll(/—/g)].map((m) => m.index!)
    expect(dashes.length, 'L42846 no longer sets its enumeration off with em dashes').toBeGreaterThan(1)
    const short = shortLine
      .slice(dashes[0]! + 1, dashes[1]!)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')

    expect(new Set(long).size).toBe(15)
    expect(new Set(short).size).toBe(15)
    for (const held of ['available for delivery', 'delivered'] as const) {
      expect(long, `the long enumeration dropped ${held}`).toContain(held)
      expect(short, `the short enumeration dropped ${held}`).toContain(held)
    }
    // The two statements differ on ONE member's spelling — the long one writes
    // the third state at length and the short one abbreviates it. That is
    // recorded and NOT resolved here; what both agree on is the count and the
    // one distinction the acceptance criterion names.
    expect(long.filter((s) => !short.includes(s))).toHaveLength(1)

    // The acceptance criterion, whole line, at the line that carries it. The
    // opening clause is NOT unique — `AC-SCHED-191` restates the fifteen in
    // almost the same words at L100937 — so the phrase searched for is the
    // half that makes this criterion the one that settles the fold.
    const ac = uniqueLineCarrying(
      'with `available for delivery` and `delivered` held distinct',
    )
    expect(ac).toBe(50_882)
    expect(line(ac)).toContain('`AC-27.3-02`')
    expect(line(ac)).toContain('All fifteen command states are individually representable')

    // THE SHIPPED VOCABULARY HOLDS THEM APART, AND HOLDS THEM APART BY INDEX
    // rather than by both merely being present.
    expect(COMMAND_STATES).toHaveLength(15)
    const i = COMMAND_STATES.indexOf('available for delivery')
    const j = COMMAND_STATES.indexOf('delivered')
    expect(i).toBeGreaterThanOrEqual(0)
    expect(j).toBe(i + 1)

    // The three counts the source states, each read at its own line. The
    // at-a-glance table says fourteen of the fifteen it enumerates elsewhere,
    // and the chapter's absolute rule walks eight of them.
    expect(cellsOf(50_583)).toEqual(['Command lifecycle states', '14'])
    expect(line(50_547)).toContain('there are six intermediate truths')
  })

  it('declares each of the six vocabularies in exactly one file, with one named copy', () => {
    // The derived list, with a floor: run before wave 0 landed, every one of
    // these names occurs nowhere and the loop below asserts nothing at all.
    const files = ALL_SOURCES()
    const declarations = (name: string): readonly string[] =>
      files.filter((f) => new RegExp(`export const ${name}\\b`).test(code(f)))

    const VOCABULARIES = [
      'NOTIFICATION_STATES',
      'COMMAND_STATES',
      'CAPTURE_STATES',
      'NOTIFICATION_LEVEL_ROWS',
      'TIMING_CLASSIFICATIONS',
      'SCHEDULE_OCCURRENCE_STATES',
    ] as const
    const found = Object.fromEntries(VOCABULARIES.map((v) => [v, declarations(v)]))
    for (const v of VOCABULARIES) {
      expect(found[v], `no file declares ${v}; the sweep walked ${files.length} files`).toHaveLength(
        1,
      )
    }

    // AND THE ONE MODULE-SCOPED COPY IS NAMED, IN BOTH DIRECTIONS. `MOD-FL-B10`
    // holds its own nineteen because the module records which four the DEVICE
    // observes, and `tests/unit/slice-10-vocabularies.test.ts` pins the two
    // equal member for member. A second copy appearing anywhere else is what
    // this asserts against.
    const copies = files.filter((f) => /export type B10NotificationState\b/.test(code(f)))
    expect(copies, 'the module-scoped copy of the nineteen is gone, or a second has appeared').toEqual([
      'src/frontline/modules/fl-b10/charter.ts',
    ])
  })
})

/* ==================================================================== *
 * GATE 3 — `LockedControl` IS INOPERABLE BY CONSTRUCTION.
 *
 * `tests/component/slice-10-locked-control.test.tsx` mounts it and asserts
 * the rendered behaviour. What a mount cannot see is the CALL SITES: a
 * primitive with nothing to call is still operable if a caller wraps it in
 * something that is, and it is only distinct from `PermissionNotice` and from
 * ABSENT while nothing hands it their inputs.
 *
 * SO THE DISTINCTION IS ASSERTED STRUCTURALLY, ON THE PROP TYPES, and that
 * is the half a rendering test cannot reach: `LockedControl` accepts no
 * `PermissionDecision`, so it can never stand in for `PermissionNotice`, and
 * `PermissionNotice` accepts nothing BUT one, so it can never carry a setting
 * and its locked value.
 * ==================================================================== */

describe('slice 10 gate 3: LockedControl is inoperable by construction, at every call site', () => {
  it('accepts no handler and no decision, and declares no disabled state', () => {
    const src = code('src/ui/primitives/LockedControl.tsx')
    // A HANDLER-SHAPED PROP, not the word `onClick`: what makes a control
    // operable is a member the caller can pass a function to.
    expect(src).not.toMatch(/readonly\s+on[A-Z]\w*\s*\??:/)
    expect(src).not.toMatch(/\(\s*\)\s*=>\s*void/)
    // AS AN ATTRIBUTE OR A PROP, NEVER AS THE WORD. The module's own throw
    // message contains "the disabled-control-with-no-explanation the
    // preference storyboard refuses", and a gate red on the shipped tree
    // because the file names the thing it refuses is already in this build's
    // catalogue of gates that convicted something innocent.
    expect(src).not.toMatch(/(?:^|[\s{])(?:aria-)?disabled(?:Reason)?\s*(?:=|:|\})/)
    // AND IT CANNOT BE HANDED A DECISION, which is what keeps it distinct from
    // `PermissionNotice` rather than merely different from it.
    expect(src).not.toMatch(/PermissionDecision/)
    const notice = code('src/ui/primitives/PermissionNotice.tsx')
    expect(notice).toMatch(/decision: PermissionDecision/)
    expect(notice).not.toMatch(/settingValue|remains/)
  })

  it('reaches a page, and no call site attaches anything to the element', () => {
    const files = ALL_SOURCES()
    const callSites = files.filter(
      (f) => f !== 'src/ui/primitives/LockedControl.tsx' && /<LockedControl\b/.test(code(f)),
    )
    expect(
      callSites.length,
      `no file under src/ or app/ renders <LockedControl>; the sweep walked ${files.length} ` +
        'files, and a primitive nothing renders is not shipped, however good its own suite is',
    ).toBeGreaterThan(0)
    expect(
      callSites.some((f) => f.startsWith('app/')),
      'LockedControl is rendered only inside src/ and reaches no page',
    ).toBe(true)

    // NOT A PROP-NAME WHITELIST, WHICH `tsc` ALREADY IS, and not a ban on the
    // spread the one shipped call site uses — a gate that forbids a mechanism
    // rather than a misuse of it will eventually forbid the fix. What is
    // forbidden is an attribute ON THE ELEMENT that the props type does not
    // declare and so could only be a DOM handler reaching the wrapper.
    for (const f of callSites) {
      for (const m of code(f).matchAll(/<LockedControl\b([^>]*)>/g)) {
        expect(m[1]!, `${f} attaches a handler to the LockedControl element`).not.toMatch(
          /\bon[A-Z]\w*\s*=/,
        )
      }
    }

    // The rendered marker is unique in the tree, so nothing else can present
    // itself as a locked control.
    const markers = files.filter((f) => /data-locked-control/.test(code(f)))
    expect(markers).toEqual(['src/ui/primitives/LockedControl.tsx'])
  })
})

/* ==================================================================== *
 * GATE 4 — THE CANON'S SLICE-10 RECORDS, AND NO SECOND HOME.
 *
 * `tests/unit/slice-10-decisions.test.ts` holds the records. What it cannot
 * hold is the rest of the tree: `DecisionDisclosure` exists so one question
 * has one home, and this slice's trap fired once already when a task's prose
 * named a decision the canon does not carry. The canon-wide populations below
 * are asserted in BOTH directions, so a second alias-bearing record and a
 * second empty-readings record are each red rather than absorbed.
 * ==================================================================== */

/**
 * The slice-10 ids, as a LITERAL LIST typed `readonly DecisionId[]` and
 * declared OUTSIDE the canon. A membership gate is a list, not a length:
 * `toHaveLength(15)` is satisfied by any fifteen records at all, and a
 * deletion from the union, the id array and the records together leaves
 * nothing inside the module to notice it. Typed this way it fails twice — red
 * at run time, and a `tsc` error naming the id.
 */
const SLICE_10_DECISION_IDS: readonly DecisionId[] = [
  'DEC-AUDITSUP-001',
  'DEC-AUDITQM-001',
  'DEC-AUDITHASH-001',
  'DEC-AUDITOFF-001',
  'DEC-NOTIFCOUNT-001',
  'DEC-NOTIFSEV-001',
  'DEC-NOTIFPRI-001',
  'DEC-NOTIFPREF-001',
  'DEC-NOTIFACK-001',
  'DEC-SCHED-002',
  'DEC-SCHED-011',
  'DEC-FINISH-002',
  'DEC-CMDEXP-001',
  'S10-IDENT-SCHED-001',
  'S10-DOH10-AUDITWRITE-001',
]

describe('slice 10 gate 4: the canon carries this slice, and nothing carries it twice', () => {
  it('holds every slice-10 id, and the whole alias population it shares a canon with', () => {
    const ids = new Set(OPEN_DECISIONS.map((d) => d.id))
    for (const id of SLICE_10_DECISION_IDS) {
      expect(ids.has(id), `the canon lost ${id}`).toBe(true)
    }

    // EVERY ALIAS IN THE CANON, asserted as the whole population rather than
    // as a count of this slice's share. An alias added anywhere is a second
    // question folded into one record, so this list grows deliberately and
    // never silently: slice 11 added `DEC-AIHELP-001` (`DEC-ASK-001`) and
    // `DEC-ONDEVICE-001` (`DEC-LOCALAI-001`), each one question asked under
    // two identifiers with no line in the frozen source carrying both.
    const aliased = OPEN_DECISIONS.filter((d) => d.alias !== null).map((d) => d.id)
    expect(aliased.sort()).toEqual(
      [
        'DEC-AIHELP-001',
        'DEC-ONDEVICE-001',
        'DEC-SCHED-002',
        'DEC-WFROLL-001',
        'S10-IDENT-SCHED-001',
      ].sort(),
    )
    const bySchedule = OPEN_DECISIONS.find((d) => d.id === 'DEC-SCHED-002')!
    expect(bySchedule.alias).toContain('DEC-SCHED-MISFIRE-001')
    expect(bySchedule.adopted).toMatch(/registered an alias rather than dropping one/)
  })

  it('holds the zero-reading exception at exactly one record, so a second goes red', () => {
    const empty = OPEN_DECISIONS.filter((d) => d.readings.length === 0).map((d) => d.id)
    expect(
      empty,
      'a second record now carries no readings. The one exception is the record whose ABSENCE is ' +
        'the disclosure; a second empty record is readings nobody wrote, and the two are ' +
        'indistinguishable on screen',
    ).toEqual(['DEC-FINISH-002'])
    // AND THE ABSENCE IS MEASURED IN THE SOURCE, not asserted: the identifier
    // is defined entirely by its own two registrations.
    const occurrences: number[] = []
    for (let n = 1; n <= SOURCE_LINE_COUNT; n += 1) {
      if (line(n).includes('DEC-FINISH-002')) occurrences.push(n)
    }
    expect(occurrences).toEqual([98_703, 115_082])
    // Every other record is at or above the two-reading floor, which is what
    // makes the single exception an exception.
    for (const d of OPEN_DECISIONS) {
      if (d.id === 'DEC-FINISH-002') continue
      expect(d.readings.length, `${d.id} is below the two-reading floor`).toBeGreaterThan(1)
    }
  })

  it('gives each slice-10 decision one home: the canon, cited and never re-recorded', () => {
    // A SECOND HOME IS A SECOND WORDING. Any file naming one of these
    // identifiers in CODE must reach it through `decisionRecord`/the canon
    // rather than declaring its own record for it — the shape asserted is a
    // local declaration, not a mention.
    const files = ALL_SOURCES().filter((f) => f !== 'src/disclosure/decisions.ts')
    const idPattern = new RegExp(
      `['"\`](?:${SLICE_10_DECISION_IDS.map((i) => i.replace(/[-.]/g, '\\$&')).join('|')})['"\`]`,
    )
    const namers = files.filter((f) => idPattern.test(code(f)))
    expect(
      namers.length,
      `no file outside the canon cites a slice-10 decision; the sweep walked ${files.length} ` +
        'files and a canon nothing cites is a canon nothing renders',
    ).toBeGreaterThan(0)
    const localRecords = namers.filter((f) => /readonly\s+readings\s*:/.test(code(f)))
    expect(
      localRecords,
      'these files name a slice-10 decision AND declare a readings field of their own, which is ' +
        'the second home DecisionDisclosure exists to prevent',
    ).toEqual([])

    // THE ONE LOCAL DISCLOSURE THAT STAYS LOCAL, both directions. Slice 8
    // discloses `DEC-SYNC-002` in its own module and a gate pins its absence
    // from the canon; consolidating it is its own task with its own gate, not
    // a side effect of this one.
    expect(read('src/offline/decisions-37b.ts')).toContain('DEC-SYNC-002')
    expect(OPEN_DECISIONS.map((d) => d.id)).not.toContain('DEC-SYNC-002')
    expect(OPEN_DECISIONS.map((d) => d.alias)).not.toContain('DEC-SYNC-002')
  })
})

/* ==================================================================== *
 * GATE 5 — THE NON-HUMAN MATRIX COLUMN TYPE.
 *
 * `tests/unit/policy-columns.test.ts` exercises the three arms directly. Two
 * things sit outside it and only a slice gate can hold them:
 *
 *   1. THE ARM COUNT AS A MEMBERSHIP LIST DECLARED OUTSIDE THE MODULE. Inside
 *      it, the union, the `columnAttribution` switch and the `columnKey`
 *      switch are locked together at compile time, so a fourth arm added to
 *      all three leaves nothing in there to notice it.
 *   2. THE AGGREGATE ARM IS EXERCISED BY NO SHIPPED MATRIX. `MOD-SA-14`'s
 *      "Any tenant role" column is disclosed in prose on the console screen
 *      and no `kind: 'aggregate'` value is constructed anywhere under src/ or
 *      app/. A gate is the only thing holding that throw.
 * ==================================================================== */

/**
 * The three arms, as a literal list outside the module. `satisfies` binds it
 * to the union, so a fourth arm makes the exhaustiveness line below stop
 * compiling and names the member.
 */
const COLUMN_KINDS = ['role', 'identity', 'aggregate'] as const satisfies readonly MatrixColumn['kind'][]
type MissingColumnKind = Exclude<MatrixColumn['kind'], (typeof COLUMN_KINDS)[number]>
const _columnKindsExhaustive: MissingColumnKind extends never ? true : never = true
void _columnKindsExhaustive

describe('slice 10 gate 5: the column type has three arms and the aggregate has no evaluator', () => {
  it('maps the three arms onto three distinct attributions, the aggregate to none', () => {
    expect([...COLUMN_KINDS]).toHaveLength(3)
    const aggregate: AggregateColumn = {
      kind: 'aggregate',
      header: 'Any tenant role',
      members: ['TENANT_ADMIN'],
      sourceRef: 'L45653',
    }
    const identity: IdentityColumn = {
      kind: 'identity',
      header: 'Scheduler Controller',
      identitySourceRefs: ['L98883'],
    }
    const role = MATRIX_B.columns.find((c) => c.kind === 'role')!
    const attributions = [role, identity, aggregate].map(columnAttribution)
    expect(new Set(attributions).size).toBe(3)
    expect(columnAttribution(aggregate)).toBe('NOT_ATTRIBUTABLE')

    // THE ARM NO SHIPPED MATRIX EXERCISES. `evaluateColumnAccess` must throw
    // rather than answer, because an access decision keyed on a set names no
    // actor. The row is built here WITH a cell for the aggregate on purpose:
    // handing it a shipped row would throw on the missing cell instead, one
    // guard earlier, and this gate would pass while never reaching the arm it
    // is about.
    const aggregateRow: ColumnMatrixRow = {
      id: 'MOD-SA-14-ROW-5',
      operation: 'Configure tenant notification preferences',
      sourceRef: 'L45659',
      cells: {
        [columnKey(aggregate)]: {
          outcome: 'allowedWithConditions' as const,
          detail: 'the Tenant Admin configures tenant notification preferences',
          narrowsTo: ['TENANT_ADMIN'] as const,
        },
      } as ColumnMatrixRow['cells'],
    }
    expect(() => evaluateColumnAccess(aggregateRow, aggregate, null, [aggregate])).toThrow(
      /aggregate and names no actor/,
    )
    // Proved to be the aggregate arm rather than the missing-cell guard one
    // step earlier: the same row without the cell throws a different message.
    expect(() =>
      evaluateColumnAccess({ ...aggregateRow, cells: {} }, aggregate, null, [aggregate]),
    ).toThrow(/no cell for/)
    // And an identity column handed a live human session fails closed rather
    // than ignoring the session it was given.
    const identityColumn = MATRIX_A.columns.find((c) => c.kind === 'identity')!
    expect(() =>
      evaluateColumnAccess(
        MATRIX_A.rows[0]!,
        identityColumn,
        {
          req: { action: 'READ_SCHEDULE_OPERATION', sourceRefs: ['L99197'] },
          ctx: auditContext('TENANT_ADMIN'),
        },
        [...MATRIX_A.columns],
      ),
    ).toThrow(/may not be answered from a human session/)
  })

  it('gives every identity column in the build a locator that names it', () => {
    const identityColumns = [...MATRIX_A.columns, ...MATRIX_B.columns].filter(
      (c): c is IdentityColumn => c.kind === 'identity',
    )
    expect(
      identityColumns.length,
      'no matrix in this build declares a non-human identity column, so the column type this ' +
        'slice added has no consumer and every assertion about it is about a literal',
    ).toBe(5)
    for (const column of identityColumns) {
      expect(column.identitySourceRefs.length, column.header).toBeGreaterThan(0)
      const carries = column.identitySourceRefs.some((ref) => {
        const n = Number(/^L(\d+)$/.exec(ref)?.[1] ?? '0')
        return n > 0 && line(n).trim() !== ''
      })
      expect(carries, `${column.header} cites no line that carries anything`).toBe(true)
    }

    // AND THE EVALUATOR IS REACHED FROM A PAGE. This is not a ban on calling
    // `evaluateAccess` — a gate that forbids a mechanism rather than a misuse
    // of it will eventually forbid the fix, and `readableScheduleAudit` calls
    // it correctly as its own stage two. What is asserted is the shape of the
    // failure this build has already shipped: a column type written, typed,
    // exhaustively checked and reached by nothing. The chain is walked rather
    // than asserted at one hop, because a single-hop reachability rule
    // reported a mounted module as not-represented for a whole slice.
    const files = ALL_SOURCES()
    // A CALL, NOT A MENTION. The first draft matched the bare identifier and a
    // plant that replaced the call with `void evaluateColumnAccess` and
    // returned a fabricated decision went GREEN — a reachability check
    // satisfied by the name of the thing it was meant to find reached.
    const callers = (name: string): readonly string[] =>
      files.filter((f) => new RegExp(`\\b${name}\\s*\\(`).test(code(f)))
    const direct = callers('evaluateColumnAccess').filter((f) => f !== 'src/policy/columns.ts')
    expect(
      direct,
      `nothing outside src/policy/columns.ts calls evaluateColumnAccess; the sweep walked ` +
        `${files.length} files and a column type nothing evaluates is written, not shipped`,
    ).toEqual(['src/policy/schedule-operations.ts'])
    const transitive = callers('scheduleDecision').filter(
      (f) => f !== 'src/policy/schedule-operations.ts',
    )
    expect(
      transitive.length,
      'the only caller of evaluateColumnAccess is itself called by nothing, so the chain stops ' +
        'one hop short of a screen',
    ).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * GATE 6 — READ SCOPE IS ASSERTED IN THE SELECTOR, NEVER THE RENDER.
 *
 * `AC-30D-105` is at L74029; L74032 is `TEST-30D-103`, its paired test. Two
 * briefs carried the second number for the first, so both are pinned here and
 * the wrong one cannot be reintroduced quietly.
 *
 * Defect shape 7 in this build's ledger is scope enforced in what a screen
 * DREW rather than in what it READ. The mechanisable form: the screen holds a
 * seeded corpus, and the only thing it may do with it is hand it to the
 * selector.
 * ==================================================================== */

const AUDIT_SCREEN = 'app/hub/audit-and-retention/AuditAndRetentionScreen.tsx'

describe('slice 10 gate 6: audit read scope lives in the selector', () => {
  it('pins AC-30D-105 and its paired test at their own lines, whole', () => {
    expect(line(74_029)).toBe(
      '- `AC-30D-105` — Audit reading never bypasses the authorisation of the objects it references.',
    )
    expect(line(74_032)).toContain('`TEST-30D-103`')
    expect(line(74_032)).not.toContain('AC-30D-105')
  })

  it('lets the seeded corpus reach the render only through the selector', () => {
    const src = code(AUDIT_SCREEN)
    // Every occurrence of the corpus is accounted for: an argument to the
    // selector, or a denominator. A `.filter`, `.map` or `.slice` on it is the
    // screen doing the scoping itself.
    let uses = 0
    for (const m of src.matchAll(/SEEDED_AUDIT_EVENTS/g)) {
      const tail = src.slice(m.index!, m.index! + 60)
      // The import naming it is not a use of it.
      if (/^SEEDED_AUDIT_EVENTS\s*\}?\s*(?:from|,\s*\n)/.test(tail)) continue
      uses += 1
      expect(
        /^SEEDED_AUDIT_EVENTS(?:\.length|,|\))/.test(tail),
        `${AUDIT_SCREEN} uses the seeded corpus as ${JSON.stringify(tail.slice(0, 40))}, which is ` +
          'the screen scoping what it DREW rather than what it READ',
      ).toBe(true)
    }
    expect(uses, `${AUDIT_SCREEN} never mentions the seeded corpus at all`).toBeGreaterThan(0)
    expect(src).toMatch(/readableAuditEvents\(SEEDED_AUDIT_EVENTS,/)
    // No role comparison and no status test on the render path: the licence
    // comes off the matrix rows, never off a list typed in the screen.
    expect(src).not.toMatch(/role\s*===\s*['"]/)

    // AND NOTHING ELSE IN THE BUILD READS THE CORPUS DIRECTLY.
    const files = ALL_SOURCES().filter((f) => /SEEDED_AUDIT_EVENTS/.test(code(f)))
    expect(files.sort()).toEqual([AUDIT_SCREEN, 'src/surfaces/doh/modules/doh-11/fixtures.ts'])
  })

  it('drops another tenant’s events in the selector, including one in scope', () => {
    // THE POSITIVE CONTROL FIRST. A subset assertion passes on an empty set,
    // and an isolation assertion passes when nothing was cross-tenant to
    // begin with, so the count dropped is asserted before what is left.
    const foreign = SEEDED_AUDIT_EVENTS.filter((e) => e.resourceTenant === NEIGHBOUR_TENANT_ID)
    expect(foreign.length, 'the fixture has no other tenant, so isolation proves nothing').toBe(2)

    const licence = auditReadLicence('TENANT_ADMIN')
    expect(licence.kind).toBe('full')
    const visible = readableAuditEvents(
      SEEDED_AUDIT_EVENTS as readonly AuditEventReference[],
      'TENANT_ADMIN',
      auditContext('TENANT_ADMIN'),
    )
    expect(visible).toHaveLength(SEEDED_AUDIT_EVENTS.length - foreign.length)
    expect(visible.map((e) => e.eventId)).not.toContain(foreign[0]!.eventId)

    // THE CLASS FILTER IS NOT WHAT EXCLUDED IT. One foreign event sits in a
    // class the scoped reader's own licence permits, so a selector that had
    // dropped stage two entirely would still look correct for the full reader
    // and correct for the scoped one on class alone.
    const scoped = auditReadLicence('QUALITY_MANAGER')
    expect(scoped.kind).toBe('scoped')
    const inScopeForeign = foreign.filter((e) => scoped.classes.includes(e.eventClass))
    expect(inScopeForeign.length).toBeGreaterThan(0)
    const scopedVisible = readableAuditEvents(
      SEEDED_AUDIT_EVENTS as readonly AuditEventReference[],
      'QUALITY_MANAGER',
      auditContext('QUALITY_MANAGER'),
    )
    expect(scopedVisible.map((e) => e.eventId)).not.toContain(inScopeForeign[0]!.eventId)
  })
})

/* ==================================================================== *
 * GATE 7 — `DEC-REPORT-001`'s SETS 4 AND 5.
 *
 * The ruling is L113023. L113022 is the implementation-cost line above it,
 * which is what the slice plan cited, and the module that found the error
 * carries the correction. Both are pinned.
 *
 * "COUNTED AS IMPLEMENTED NOWHERE" is the claim no module suite can hold: a
 * held set is only held while no other file in the build has quietly built it
 * under one of its two candidate names.
 * ==================================================================== */

describe('slice 10 gate 7: sets 4 and 5 are decision-blocked and built nowhere', () => {
  it('pins the ruling at L113023 and the cost line at L113022', () => {
    expect(line(113_023)).toContain(
      'Blocking for Delivery Operations Hub Band B module 18 sets 4 and 5; non-blocking for sets 1 to 3.',
    )
    expect(line(113_022)).toContain('Implementation impact')
    expect(line(113_022)).not.toContain('Blocking')
    // The register row states the same thing as a build instruction, so the
    // ruling has two independent statements rather than one.
    expect(cellsOf(113_037)[0]).toBe('`DEC-REPORT-001`')
    expect(cellsOf(113_037)).toContain('Build sets 1 to 3; hold 4 and 5')
  })

  it('blocks exactly the two the ruling names, each with both wordings and no chosen name', () => {
    expect([...DEC_REPORT_001_BLOCKS]).toEqual([4, 5])
    expect(DOH_18_BLOCKED.map((s) => s.ordinal)).toEqual([...DEC_REPORT_001_BLOCKS])
    expect(DOH_18_BUILDABLE.map((s) => s.ordinal)).toEqual([1, 2, 3])
    expect(DOH_18_BUILDABLE.length + DOH_18_BLOCKED.length).toBe(DOH_18_DATA_SETS.length)
    for (const set of DOH_18_BLOCKED) {
      expect(set.agreedName, `set ${set.ordinal} has adopted a name`).toBeNull()
      expect(set.hubWording.text).not.toBe(set.commandCenterWording.text)
      expect(set.hubWording.locator).not.toBe(set.commandCenterWording.locator)
      // EACH WORDING AT ITS OWN LINE. A pair of wordings sharing one locator
      // is one claim printed twice.
      for (const { text, locator } of [set.hubWording, set.commandCenterWording]) {
        const n = Number(/^L(\d+)$/.exec(locator)![1])
        expect(line(n), `set ${set.ordinal} at ${locator}`).toContain(text)
      }
    }
  })

  it('counts neither blocked wording as implemented anywhere in the build', () => {
    const files = ALL_SOURCES()
    const HOMES = [
      'src/surfaces/cc/modules/cc-11/report-sets.ts',
      'src/surfaces/doh/modules/doh-18/datasets.ts',
      'src/surfaces/doh/modules/doh-18/StandardReportDataSets.tsx',
    ]
    // THE POPULATION FLOOR, AND IT WAS ADDED BECAUSE A PLANT WENT GREEN
    // WITHOUT IT. Making the two Parts agree on set 4's name promotes it to
    // buildable, and the loop below then iterates one set instead of two and
    // passes — the sweep shrinking along with its subject, which is in this
    // build's catalogue as a `for...of` over the constant it was meant to
    // verify. The count is derived, not stored: it is the ruling's own.
    expect(DOH_18_BLOCKED).toHaveLength(DEC_REPORT_001_BLOCKS.length)
    for (const set of DOH_18_BLOCKED) {
      for (const wording of [set.hubWording.text, set.commandCenterWording.text]) {
        const carriers = files.filter((f) => code(f).includes(wording))
        expect(
          carriers.length,
          `no file carries the wording ${JSON.stringify(wording)}; the sweep walked ` +
            `${files.length} files and a blocked set nothing names is a set nothing discloses`,
        ).toBeGreaterThan(0)
        expect(
          carriers.filter((f) => !HOMES.includes(f)),
          `${JSON.stringify(wording)} is a candidate name for a decision-blocked report set and ` +
            'these files carry it outside the disclosure, which is the set counted as built',
        ).toEqual([])
      }
    }
  })
})

/* ==================================================================== *
 * GATE 8 — NO NUMBERED `SCR-SA-NN` LITERAL FOR EITHER SCHEDULER SCREEN.
 *
 * The two scheduler screens are uncatalogued: the source names them
 * `SCR-SA-SCHED-01` and `SCR-SA-SCHED-02` and mints no numbered console
 * screen identifier for either. Minting one would put a source-looking
 * identifier on a screen the source does not register — and twenty-one other
 * console screens DO carry one and render it, so "no numbered literal
 * anywhere" is not the claim and a sweep written that way is red on the
 * shipped tree. Measured: the source mints `SCR-SA-01` through `SCR-SA-26`.
 *
 * BOTH ENDS ANCHORED. `SCR-SA-SCHED-01` ends in `-01`, so an unanchored
 * `SCR-SA-\d+` sweep is satisfied by the very identifiers that are allowed.
 * ==================================================================== */

const NUMBERED_SCR_SA = /(?:^|[^A-Za-z0-9-])(SCR-SA-\d+)/g

/** The files that are the two scheduler screens, and nothing else. */
const SCHEDULER_ROOTS = [
  'src/surfaces/sa/scheduler',
  'app/super-admin/scheduler-registry',
  'app/super-admin/occurrence-detail',
]

describe('slice 10 gate 8: the scheduler screens stay uncatalogued', () => {
  it('mints no numbered identifier in either screen, and invents none anywhere', () => {
    const schedulerFiles = authoredSources(SCHEDULER_ROOTS, 4)
    const offenders = schedulerFiles.filter((f) => {
      NUMBERED_SCR_SA.lastIndex = 0
      return NUMBERED_SCR_SA.test(code(f))
    })
    expect(
      offenders,
      'a numbered SCR-SA-NN literal has been minted inside a scheduler screen; the frozen source ' +
        'registers neither screen and gives neither a numbered console screen identifier',
    ).toEqual([])
    // The two screens really do name themselves, so the empty list above is a
    // measurement over files that talk about screen identity at all.
    expect(
      schedulerFiles.filter((f) => /SCR-SA-SCHED-0[12]/.test(code(f))).length,
    ).toBeGreaterThan(0)

    // AND NOWHERE IN THE BUILD IS A TWENTY-SEVENTH INVENTED. The numbered
    // family the tree uses is exactly the family the source mints, so a
    // scheduler screen cannot be catalogued by minting a fresh number
    // elsewhere either.
    const inSource = new Set<string>()
    for (let n = 1; n <= SOURCE_LINE_COUNT; n += 1) {
      NUMBERED_SCR_SA.lastIndex = 0
      for (const m of line(n).matchAll(NUMBERED_SCR_SA)) inSource.add(m[1]!)
    }
    const inTree = new Set<string>()
    for (const f of ALL_SOURCES()) {
      NUMBERED_SCR_SA.lastIndex = 0
      for (const m of code(f).matchAll(NUMBERED_SCR_SA)) inTree.add(m[1]!)
    }
    expect(inSource.size).toBe(26)
    expect([...inTree].filter((id) => !inSource.has(id))).toEqual([])
    expect(inTree.size).toBeGreaterThan(0)

    // NON-VACUITY, BOTH WAYS. The pattern fires on the shape it discriminates,
    // and it does NOT fire on the two identifiers that are allowed — which is
    // exactly what an unanchored version would get wrong.
    NUMBERED_SCR_SA.lastIndex = 0
    expect(NUMBERED_SCR_SA.test("const id = 'SCR-SA-07'")).toBe(true)
    NUMBERED_SCR_SA.lastIndex = 0
    expect(NUMBERED_SCR_SA.test("const id = 'SCR-SA-SCHED-01'")).toBe(false)
  })

  it('finds no MOD-* identifier in either passage that would have to claim them', () => {
    // MEASURED OVER THE TWO PASSAGES THAT CARRY FOUR OF THE FIVE OCCURRENCES
    // of the screen identifiers. A counted absence, not an impression.
    const bands = [
      { from: 100_713, to: 100_779, what: '§45A.10.5' },
      { from: 99_685, to: 99_692, what: 'the §45A.9 storyboard block' },
    ]
    for (const band of bands) {
      let names = 0
      let modules = 0
      for (let n = band.from; n <= band.to; n += 1) {
        if (/SCR-SA-SCHED-0[12]/.test(line(n))) names += 1
        modules += (line(n).match(/\bMOD-[A-Z]+-\d+/g) ?? []).length
      }
      expect(names, `${band.what} names neither scheduler screen`).toBeGreaterThan(0)
      expect(modules, `${band.what} now names a module identifier`).toBe(0)
    }
  })
})

/* ==================================================================== *
 * GATE 9 — FOUR `SCHED-` KEY SPACES, AND THE 35-ROW COLLISION.
 *
 * Three census rows count thirty-five. Two are the discovery register's two
 * views over ONE key space; the third is the anchored timer register, which
 * carries no `SCHED-` identifier at all. NO COUNT CHECK TELLS THEM APART —
 * that is this slice's instance of the catalogue entry "a count check true of
 * both the defect and the fix because two categories had the same number of
 * rows". The discriminator is the key, read off the source.
 * ==================================================================== */

/** The four key spaces, as a literal list declared outside the module. */
const KEY_SPACES = [
  'ch-45a.2-discovery',
  'ch-45a.17.1-deployable',
  'ch-54.7-matrix-14',
  'ch-30a.3-carried',
] as const satisfies readonly (typeof SCHEDULE_KEY_SPACES)[number][]

describe('slice 10 gate 9: four key spaces, and the two 35-row registers told apart by key', () => {
  it('holds the four key spaces and gives each at least one census row', () => {
    expect([...SCHEDULE_KEY_SPACES].sort()).toEqual([...KEY_SPACES].sort())
    const byKeySpace = new Map<string, number>()
    for (const row of SCHEDULED_WORK_CENSUS) {
      if (row.keySpace === null) continue
      byKeySpace.set(row.keySpace, (byKeySpace.get(row.keySpace) ?? 0) + 1)
    }
    for (const space of KEY_SPACES) {
      expect(byKeySpace.get(space), `no census row belongs to ${space}`).toBeGreaterThan(0)
    }
    // The registers carrying no key space are a real population too, so the
    // `null` arm is not a hole nobody looked in.
    expect(SCHEDULED_WORK_CENSUS.filter((r) => r.keySpace === null).length).toBeGreaterThan(0)
  })

  it('tells the two thirty-five-row registers apart by key, never by counting', () => {
    const thirtyFives = SCHEDULED_WORK_CENSUS.filter((r) => r.counted === 35)
    expect(
      thirtyFives.length,
      'the collision this gate is about has gone; if no two registers share a row count any more, ' +
        'read why before deleting this',
    ).toBeGreaterThan(1)
    // A count alone cannot separate them, stated as a property so the gate
    // cannot be satisfied by counting.
    expect(new Set(thirtyFives.map((r) => r.counted)).size).toBe(1)

    // THE DISCRIMINATOR, OFF THE SOURCE. Every discovery row carries a
    // three-digit `SCHED-` identifier; not one anchored-timer row carries any
    // `SCHED-` token at all.
    const discovery = tableBody(98_339)
    expect(discovery).toHaveLength(35)
    const withIdentifier = discovery.filter((n) => /`SCHED-\d{3}`/.test(line(n)))
    expect(withIdentifier).toHaveLength(35)

    const timers = tableBody(98_582)
    expect(timers).toHaveLength(35)
    const timersWithSchedToken = timers.filter((n) => /SCHED-/.test(line(n)))
    expect(
      timersWithSchedToken,
      'the anchored timer register now carries a SCHED- token, so the key-shape discriminator ' +
        'between it and the discovery register is gone and only the row count is left',
    ).toEqual([])
    // And the two census rows those bodies belong to are the ones whose key
    // spaces disagree, which is the whole point.
    const keys = new Set(thirtyFives.map((r) => String(r.keySpace)))
    expect(keys.size).toBeGreaterThan(1)
  })

  it('keeps SCHED-01 and SCHED-010 apart, and lets nothing forge a branded key', () => {
    // Both are real identifiers of different things, read at their own lines.
    expect(line(117_892)).toMatch(/`SCHED-01`/)
    expect(line(98_350)).toMatch(/`SCHED-010`/)
    expect(line(117_892)).not.toMatch(/`SCHED-010`/)

    // `scheduleKey` is the only producer, so no call site can hand a bare
    // literal to a lookup by asserting the brand instead.
    const files = ALL_SOURCES().filter((f) => f !== 'src/scheduling/registers.ts')
    const casts = files.filter((f) => /as\s+ScheduleKey\b/.test(code(f)))
    expect(
      casts,
      'these files cast a plain string to the branded schedule key, which is the bare literal the ' +
        'brand exists to refuse, reached by another route',
    ).toEqual([])
    expect(read('src/scheduling/registers.ts')).toMatch(/as ScheduleKey/)
  })
})

/* ==================================================================== *
 * GATE 10 — THE OCCURRENCE-OUTCOME CONFLICT, AS A FIXTURE.
 *
 * TWO SOURCE VOCABULARIES FOR ONE FIELD, WITH NO CROSS-REFERENCE. Fifteen
 * states as lifecycle-diagram nodes, which is the set wave 0 shipped, against
 * twelve named inline in the state register. Four names are common.
 *
 * READ STRICTLY, `AC-SCHED-372` EXCLUDES THE SET THIS BUILD SHIPPED. Both
 * readings are the source's own and NEITHER IS PREFERRED HERE. No screen
 * renders an occurrence outcome today, so nothing needs an answer — what
 * needs holding is that a later task cannot quietly pick one. This is the
 * same treatment `tests/coverage/slice-04-gates.test.ts` gives the
 * ABSENT-versus-DISABLED conflict: both locator sets pinned, and nobody
 * settles it.
 * ==================================================================== */

interface OccurrenceVocabulary {
  readonly id: string
  /** Where the source states it. Every locator opened whole. */
  readonly locators: readonly string[]
  readonly counted: number
  /** Whether this build shipped this set as `ScheduleOccurrenceState`. */
  readonly shipped: boolean
}

const OCCURRENCE_VOCABULARIES: readonly OccurrenceVocabulary[] = [
  {
    id: 'the §45A.6 occurrence lifecycle diagram',
    locators: ['L99091-L99105 (node labels)', 'L99090 (the diagram entry edge)'],
    counted: 15,
    shipped: true,
  },
  {
    id: 'the §45A.17.2 occurrence state register',
    locators: ['L102559 (the register, named inline)', 'L102613 (AC-SCHED-372)'],
    counted: 12,
    shipped: false,
  },
]

describe('slice 10 gate 10: the occurrence outcome has two vocabularies and no winner', () => {
  it('records both, with both locator sets, and exactly one of them shipped', () => {
    expect(OCCURRENCE_VOCABULARIES).toHaveLength(2)
    for (const v of OCCURRENCE_VOCABULARIES) {
      expect(v.locators.length, `${v.id} has no locators`).toBeGreaterThan(1)
      expect(v.counted, v.id).toBeGreaterThan(0)
    }
    expect(OCCURRENCE_VOCABULARIES.filter((v) => v.shipped)).toHaveLength(1)
    expect(new Set(OCCURRENCE_VOCABULARIES.map((v) => v.counted)).size).toBe(2)
  })

  it('counts fifteen diagram nodes and twelve register names off their own lines', () => {
    const nodes: string[] = []
    for (let n = 99_091; n <= 99_105; n += 1) {
      const name = /^\s{4}(\w+) : /.exec(line(n))?.[1]
      expect(name, `L${n} is not a diagram node label`).toBeDefined()
      nodes.push(name!)
    }
    expect(nodes).toHaveLength(15)
    expect(nodes[0]).toBe('Planned')
    expect(nodes[nodes.length - 1]).toBe('Reconciled')
    // The line after the last node opens the transitions, so the walk stopped
    // where the node block stops rather than at a number somebody chose.
    expect(line(99_106)).toMatch(/-->/)
    expect(line(99_105)).not.toMatch(/-->/)

    const register = line(102_559)
    expect(register).toContain('The occurrence state register.')
    expect(register).toContain('none may be collapsed into "done"')
    const names = (/`([a-z_ ·]+)`/.exec(register)?.[1] ?? '').split(' · ').map((s) => s.trim())
    expect(names).toHaveLength(12)

    const diagram = new Set(nodes.map((n) => n.toLowerCase()))
    const common = names.filter((n) => diagram.has(n))
    expect(common).toHaveLength(4)
    expect(names.filter((n) => !diagram.has(n))).toHaveLength(8)

    // The counts in the fixture are the ones just measured, not two numbers
    // that happen to agree.
    expect(OCCURRENCE_VOCABULARIES.map((v) => v.counted)).toEqual([nodes.length, names.length])
    // AND THE SHIPPED RECORD'S OWN LISTS ARE COMPARED AGAINST THE SAME
    // MEASUREMENT, which is what stops this gate from being a fixture talking
    // to itself: a plant that dropped one name from the record's state list
    // went green until these two lines existed.
    expect([...OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT.stateRegister.states]).toEqual(names)
    expect([...OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT.common]).toEqual(common)
  })

  it('shipped the diagram set, and the criterion that excludes it is quoted whole', () => {
    expect(SCHEDULE_OCCURRENCE_STATES).toHaveLength(15)
    // Read strictly, this criterion forbids the shipped set. It is quoted so a
    // later reader meets the argument rather than the conclusion.
    expect(line(102_613)).toContain(
      '`AC-SCHED-372` no state outside the four registers appears in any code path or user interface string',
    )
    // The build's own record of the conflict settles nothing and mints nothing.
    expect(OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT.settled).toBe(false)
    expect(OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT.decisionMinted).toBeNull()
    expect(OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT.lifecycleDiagram.shippedCount).toBe(
      SCHEDULE_OCCURRENCE_STATES.length,
    )
  })

  it('renders no occurrence outcome, so nothing in the build has picked a set', () => {
    // THE HALF THAT MAKES THE FIXTURE MORE THAN A COMMENT. A later task
    // resolves this conflict by RENDERING one of the two sets; until one is
    // rendered there is nothing to settle. So the register-only names — the
    // eight that are absent from the shipped fifteen — must reach no file as
    // code, and this goes red the moment one does.
    const files = ALL_SOURCES()
    const registerOnly = [
      'pending',
      'running',
      'succeeded_late',
      'duplicate_suppressed',
      'blocked',
      'failed',
      'missed',
      'manual_completion',
    ]
    // Only the two that cannot be an ordinary English word in another context
    // are swept as bare tokens; the rest are swept in the register's own
    // snake_case spelling, which is not a spelling this build uses anywhere.
    const snake = registerOnly.filter((s) => s.includes('_'))
    expect(snake).toHaveLength(3)
    const carriers = files.filter((f) => {
      const src = code(f)
      return snake.some((s) => new RegExp(`['"\`]${s}['"\`]`).test(src))
    })
    // THE DISCLOSURE ITSELF IS THE ONE PLACE THEY MAY APPEAR, and it is
    // asserted in both directions: red when a SECOND file starts carrying
    // them, and red when the disclosure stops. A conflict nothing states is
    // not being carried; a conflict two files state is being adopted.
    expect(
      carriers,
      'a register-only occurrence state has reached the build as code outside the one record that ' +
        'discloses the conflict. That is the conflict being resolved by adoption rather than by a ' +
        'reading — the fixture above records that neither set is preferred, and this is the ' +
        'assertion that keeps it true',
    ).toEqual(['src/surfaces/sa/scheduler/registry.ts'])
    // NON-VACUITY: the shipped set IS reachable as code, so the sweep is
    // looking in a tree that contains occurrence states at all.
    expect(files.filter((f) => /'partially-executed'/.test(code(f))).length).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Every assertion above whose subject this build can change was watched go
 * red on a real defect planted into a real shipping file. Nineteen files were
 * copied and sha256'd ONCE BEFORE THE FIRST PLANT and every restore was `cp`
 * from that copy and re-compared byte for byte — never `git checkout`, which
 * is how a task earlier in this slice reverted its own work.
 *
 * WHAT THE HARNESS REFUSED TO DO, because a harness that reported red without
 * ever running is one of the four entries this slice added to the catalogue:
 *   - it required the anchor to occur exactly once, COUNTED AS A SUBSTRING.
 *     `grep -F -c` counts matching LINES, so a multi-line anchor reports the
 *     count of its first line and a plant that looks unique lands somewhere
 *     else. Two plants were misfiled this way before the count was fixed.
 *   - it refused an empty replacement, and re-checked that the file's sha256
 *     actually CHANGED before running anything.
 *   - a filter matching no test prints `32 skipped` and exits 0. That is not a
 *     red and not a green, so a run in which nothing ran was a hard harness
 *     failure rather than a result — self-tested by running a real plant
 *     against a deliberately wrong filter.
 *   - exit 0 on a planted defect was reported as `GENUINELY GREEN — the gate
 *     cannot fail`, not as a pass. It fired SIX times and each one was a real
 *     hole:
 *       · a duplicate object key in the plant, where the later `alias:` and
 *         `readings:` won and the record never changed (twice);
 *       · a `\b` boundary that did not fire on a suffixed second declaration;
 *       · a union member changed where the DATA was what the gate read;
 *       · A REACHABILITY CHECK SATISFIED BY THE NAME OF THE THING IT WANTED
 *         REACHED — `void evaluateColumnAccess` with a fabricated return.
 *         THE GATE WAS CHANGED, not the plant: it now requires a CALL;
 *       · A LOOP THAT SHRANK ALONG WITH ITS SUBJECT — making the two Parts
 *         agree on set 4's name promoted it to buildable, so the blocked-set
 *         sweep iterated one set and passed. THE GATE WAS CHANGED: it now
 *         asserts the population against the ruling's own ordinals first.
 *
 *   G1a   a bare NOTIF-042 literal planted into a fourth file
 *         RED  expected 4 files to equal the three named
 *   G1b   the ch30c2- register prefix dropped from the control id
 *         RED  expected rendering.ts to match /ch30c2-\$\{...\}/
 *   G1c   a third notification register added to the union
 *         RED  expected 3 registers to have a length of 2
 *   G1d   the collision table cut to one entry
 *         RED  expected 1 collision to have a length of 25
 *   G1e   a twenty-sixth row added to the Chapter 27.7 catalog
 *         RED  expected 1 to have a length of 25
 *   G2a   two of the four notification-state distinctions swapped
 *         RED  opened does not follow acknowledged in the vocabulary
 *   G2b   `available for delivery` folded into `delivered`
 *         RED  expected -1 to be greater than or equal to 0
 *   G2c   a second NOTIFICATION_STATES declared in another module
 *         RED  expected 2 declaring files to have a length of 1
 *   G2d   a second B10NotificationState declared outside the module
 *         RED  the module-scoped copy of the nineteen ... a second has appeared
 *   G3a   a handler prop added to LockedControlProps
 *         RED  expected the module not to match /readonly\s+on[A-Z]\w*\s*\??:/
 *   G3b   aria-disabled added to the rendered group
 *         RED  expected the module not to match the disabled-attribute pattern
 *   G3c   onClick attached to the element at the one call site
 *         RED  NotificationsScreen.tsx attaches a handler to the LockedControl element
 *   G3d   the only call site replaced by a hand-rolled div
 *         RED  no file under src/ or app/ renders <LockedControl>
 *   G3e   the data-locked-control marker forged in a second file
 *         RED  expected 2 files to equal the one primitive
 *   G4a   a fourth alias added to the canon
 *         RED  expected 4 aliased records to equal the three named
 *   G4e   a slice-10 decision id renamed
 *         RED  the canon lost DEC-NOTIFPREF-001
 *   G4f   the misfire alias re-spelled
 *         RED  expected 'DEC-SCHED-MISFIRE-002' to contain 'DEC-SCHED-MISFIRE-001'
 *   G4b   a second record's readings emptied
 *         RED  a second record now carries no readings
 *   G4c   a local readings field beside a slice-10 identifier
 *         RED  these files name a slice-10 decision AND declare a readings field
 *   G4d   DEC-SYNC-002 registered in the canon
 *         RED  expected the id list to not include 'DEC-SYNC-002'
 *   G5a   the aggregate guard in evaluateColumnAccess disabled
 *         RED  the throw no longer names the aggregate rule
 *   G5b   the aggregate's attribution changed to SESSION_IDENTITY
 *         RED  expected 2 distinct attributions to be 3
 *   G5c   the live-session guard on an identity column disabled
 *         RED  expected the call to throw an error
 *   G5d   evaluateColumnAccess's only call replaced by a fabricated decision
 *         RED  nothing outside src/policy/columns.ts CALLS evaluateColumnAccess
 *   G5e   the screen's scheduleDecision call replaced the same way
 *         RED  the chain stops one hop short of a screen
 *   G5f   an identity column's locators emptied
 *         RED  Data-pipeline identity: expected 0 to be greater than 0
 *   G6a   the screen filtering the seeded corpus itself
 *         RED  uses the seeded corpus as "SEEDED_AUDIT_EVENTS.filter(...", which is
 *              the screen scoping what it DREW rather than what it READ
 *   G6b   stage two removed from the selector, class filter left
 *         RED  expected 14 readable events to have a length of 12
 *   G6c   one cross-tenant fixture row moved into this tenant
 *         RED  the fixture has no other tenant, so isolation proves nothing
 *   G7a   a blocked set's Command Center locator moved one line past its table
 *         RED  set 4 at the moved locator: expected '' to contain 'Override
 *              frequency by role'  — the failure message names the planted line
 *              at run time and this comment does NOT spell it, because the line
 *              a plant moves a citation TO is blank and a comment citing it is
 *              itself the off-by-one defect `locator-fidelity` refuses. It
 *              caught this comment's first draft.
 *   G7b   the ruling's blocked ordinals cut to one
 *         RED  expected [ 4 ] to deeply equal [ 4, 5 ]
 *   G7c   a blocked candidate wording planted into a Hub screen
 *         RED  ... these files carry it outside the disclosure, which is the set
 *              counted as built
 *   G7d   the two Parts made to agree on set 4's name
 *         RED  expected 1 blocked set to have a length of 2  (the assertion added
 *              BECAUSE this plant was green without it)
 *   G8a   SCR-SA-02 planted inside a scheduler screen
 *         RED  a numbered SCR-SA-NN literal has been minted inside a scheduler screen
 *   G8b   SCR-SA-27 planted inside the scheduler registry
 *         RED  the same, from the scheduler-file half
 *   G8c   SCR-SA-27 planted OUTSIDE the scheduler files
 *         RED  expected [ 'SCR-SA-27' ] to deeply equal []
 *   G9a   a fifth SCHED- key space added
 *         RED  expected 5 key spaces to equal the four named
 *   G9b   the anchored timer register given the discovery key space
 *         RED  expected 1 distinct key space to be greater than 1
 *   G9c   a plain string cast to the branded ScheduleKey
 *         RED  these files cast a plain string to the branded schedule key
 *   G10a  a register-only occurrence state planted into a screen
 *         RED  a register-only occurrence state has reached the build as code
 *   G10b  the conflict record marked settled
 *         RED  expected true to be false
 *   G10c  one state removed from the shipped occurrence vocabulary
 *         RED  expected 14 states to have a length of 15
 *   G10d  one name removed from the record's own register list
 *         RED  expected 11 names to deeply equal the 12 read off L102559
 *   G10e  a DEC identifier minted for the conflict
 *         RED  expected 'DEC-OCCSTATE-001' to be null
 *
 * AND ONE PLANT OUTSIDE THIS FILE, for the stale count this task removed from
 * `tests/coverage/slice-09-gates.test.ts`. `toHaveLength(81)` became two
 * properties, and the properties were watched red: every row of
 * `registries/generated/modules.json` given one surface
 *         RED  expected 1 to be greater than 1
 * and the generated file restored byte-identically afterwards.
 *
 * SEVEN ASSERTIONS HERE READ ONLY THE FROZEN SOURCE AND ARE NAMED AS FREEZE
 * ASSERTIONS rather than left for a reader to discover as unplanted: the zero
 * name agreement across the twenty-five colliding identifiers; the two
 * fifteen-member command enumerations and the three counts the source states;
 * `AC-30D-105` at its own line against `TEST-30D-103` at its own; the
 * `DEC-REPORT-001` ruling line against the implementation-cost line above it;
 * the twenty-six numbered console screen identifiers the source mints; the
 * `SCHED-01`/`SCHED-010` prefix pair; and the fifteen diagram nodes against
 * the twelve register names. Their subject is read-only input, so the only
 * thing that can turn them red is the source drifting, which is what they are
 * for, and the sha256 asserted at the top is what makes them mean anything.
 * ==================================================================== */

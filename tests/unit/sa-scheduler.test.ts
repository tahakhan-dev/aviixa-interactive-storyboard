import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEPLOYABLE_OBLIGATIONS } from '@/scheduling'
import { SA_FRESHNESS, saAggregateText, saFreshnessFor } from '@/surfaces/sa/freshness'
import { OPEN_DECISIONS } from '@/disclosure/decisions'
import {
  ANSWERED_COLUMNS,
  BLOCK_REASON_CLASSES,
  CADENCE_CELLS_HOLDING_A_CRON_EXPRESSION,
  DEPLOYABLE_CENSUS,
  OCCURRENCE_DETAIL_EXCLUDES,
  OCCURRENCE_DETAIL_FIELDS,
  OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT,
  REGISTRY_COLUMNS,
  REGISTRY_ROWS,
  SCHEDULER_SCREENS,
  TELEMETRY_STATE,
  UNANSWERED_COLUMNS,
  UNESTABLISHED,
  healthLabel,
  healthTone,
  telemetryReading,
} from '@/surfaces/sa/scheduler/registry'
import { stripComments } from '../coverage/strip-comments'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every transcription below is compared against the
 * file rather than against a second copy of itself.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => sourceLines[n - 1] ?? ''

/** The cells of a pipe row, trimmed, without the empty edges. */
const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

/** Every 1-based line the token occurs on, whole-token. */
function linesCarrying(token: string): readonly number[] {
  const out: number[] = []
  const pattern = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`)
  sourceLines.forEach((line, i) => {
    if (pattern.test(line)) out.push(i + 1)
  })
  return out
}

describe('the frozen source is the source', () => {
  it('is the byte-identical blueprint', () => {
    expect(sourceBytes.byteLength).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE ASYMMETRY, MEASURED RATHER THAN QUOTED.
 * ==================================================================== */

describe('the two screen identifiers, counted', () => {
  it('gives SCR-SA-SCHED-01 four occurrences and SCR-SA-SCHED-02 exactly one', () => {
    const first = linesCarrying('SCR-SA-SCHED-01')
    const second = linesCarrying('SCR-SA-SCHED-02')

    expect(first).toEqual([99_687, 100_259, 100_759, 100_764])
    expect(second).toEqual([100_760])

    // And the count is a count of OCCURRENCES, not of lines: no line carries
    // either identifier twice, so the two are the same number here. Checked
    // rather than assumed, because a repeat on one line would make the line
    // count an undercount and the finding is a count.
    const totalOccurrences = (token: string): number =>
      sourceLines.join('\n').split(token).length - 1
    expect(totalOccurrences('SCR-SA-SCHED-01')).toBe(4)
    expect(totalOccurrences('SCR-SA-SCHED-02')).toBe(1)
  })

  it('declares exactly those lines in the screen records, in source order', () => {
    const [registry, detail] = SCHEDULER_SCREENS
    expect(registry.occurrences.map((o) => o.line)).toEqual([...linesCarrying('SCR-SA-SCHED-01')])
    expect(detail.occurrences.map((o) => o.line)).toEqual([...linesCarrying('SCR-SA-SCHED-02')])
  })

  it('finds no third SCR-SA-SCHED identifier to have missed', () => {
    const found = new Set(sourceLines.join('\n').match(/SCR-SA-SCHED-\d+/g) ?? [])
    expect([...found].sort()).toEqual(['SCR-SA-SCHED-01', 'SCR-SA-SCHED-02'])
  })

  it('classifies both as a product extension pending DEC-SCHED-005, in the source’s words', () => {
    for (const screen of SCHEDULER_SCREENS) {
      expect(screen.classification).toBe('User-Mandated Product Extension')
      expect(screen.pendingDecision).toBe('DEC-SCHED-005')
    }
    // The classification is the source's, on the line that classifies both by
    // name — read whole, not from the first clause.
    expect(L(100_778)).toContain(
      'The scheduler registry screens, the backlog drill, the governed tick and the staleness rendering are `User-Mandated Product Extension` under `DEC-SCHED-005`.',
    )
    // And the 45A.9 storyboard says the Statement of Work describes no screen.
    expect(L(99_685)).toContain('It does not describe a screen.')
    expect(L(99_685)).toContain('needs `DEC-SCHED-005`')
  })
})

/* ==================================================================== *
 * NO NUMBERED `SCR-SA-NN` LITERAL IS MINTED FOR EITHER SCREEN.
 * ==================================================================== */

describe('no catalogue number is invented', () => {
  const OWNED = [
    'src/surfaces/sa/scheduler/registry.ts',
    'src/surfaces/sa/scheduler/SchedulerScaffold.tsx',
    'src/surfaces/sa/scheduler/SchedulerRegistryScreen.tsx',
    'src/surfaces/sa/scheduler/OccurrenceDetailScreen.tsx',
    'app/super-admin/scheduler-registry/page.tsx',
    'app/super-admin/occurrence-detail/page.tsx',
  ]

  it('reads every owned file', () => {
    for (const rel of OWNED) {
      expect(existsSync(join(process.cwd(), rel)), rel).toBe(true)
    }
  })

  it('spells no `SCR-SA-<digits>` anywhere in code or in prose', () => {
    const offenders: string[] = []
    for (const rel of OWNED) {
      const src = readFileSync(join(process.cwd(), rel), 'utf8')
      // Comments stripped so a comment EXPLAINING the ban cannot trip it, and
      // the scan then covers strings, JSX text and identifiers alike.
      for (const hit of stripComments(src).match(/SCR-SA-\d+/g) ?? []) {
        // The two source-spelled identifiers are the source's own tokens and
        // are not catalogue numbers. Anything else is a minted number.
        if (hit !== 'SCR-SA-SCHED-01' && hit !== 'SCR-SA-SCHED-02') offenders.push(`${rel}: ${hit}`)
      }
      // Belt and braces on the exact shape the brief names: `SCR-SA-` followed
      // by two digits and nothing else.
      expect(/SCR-SA-\d\d(?![\w-])/.test(stripComments(src)), rel).toBe(false)
    }
    expect(offenders).toEqual([])
  })

  it('the Hub screen register — the only register of this shape — names no scheduler screen', () => {
    expect(cells(L(48_093))[0]).toBe('Screen identifier')
    expect(L(48_094)).toMatch(/^\|(-+\|)+$/)

    const body: string[] = []
    for (let n = 48_095; ; n += 1) {
      const line = L(n)
      if (!line.startsWith('|')) break
      body.push(line)
    }
    // Counted by reading to where the body stops, never inferred from a span.
    expect(body).toHaveLength(23)
    expect(cells(body[0] ?? '')[0]).toBe('SCR-DOH-01')
    expect(cells(body[22] ?? '')[0]).toBe('SCR-DOH-23')
    expect(body.join('\n')).not.toMatch(/SCHED/)
    expect(body.join('\n')).not.toMatch(/[Ss]cheduler/)
  })

  it('measures zero MOD- identifiers in either passage that storyboards a screen', () => {
    const passage = (from: number, to: number): string =>
      sourceLines.slice(from - 1, to).join('\n')

    // §45A.10.5, the section that storyboards both screens.
    expect(passage(100_713, 100_779).match(/MOD-[A-Z]+-[0-9A-Za-z]+/g)).toBeNull()
    // The §45A.9 screen-storyboard block.
    expect(passage(99_685, 99_692).match(/MOD-[A-Z]+-[0-9A-Za-z]+/g)).toBeNull()

    // POSITIVE CONTROL. Without it this pair of assertions passes on any
    // regex that never matches anything, which is how a null-expecting gate
    // becomes one that cannot fail.
    expect(passage(98_341, 98_341).match(/MOD-[A-Z]+-[0-9A-Za-z]+/g)).toEqual(['MOD-DOH-06'])
  })
})

/* ==================================================================== *
 * THE COLUMN LIST, PARSED OFF L99687 RATHER THAN TYPED TWICE.
 * ==================================================================== */

describe('SCR-SA-SCHED-01’s ten columns', () => {
  /**
   * The column list is the clause between "definition on the platform: " and
   * the sentence that ends it. Parsed from the line so the transcription in
   * `registry.ts` is checked against the source and not against itself.
   */
  const parsed = ((): readonly string[] => {
    const line = L(99_687)
    const after = line.slice(line.indexOf('on the platform: ') + 'on the platform: '.length)
    const clause = after.slice(0, after.indexOf('. No tenant operational content'))
    return clause
      .replace(/, and /, ', ')
      .split(', ')
      .map((c) => c.trim())
  })()

  it('reads the line whole, including the layer-1 sentence the list ends before', () => {
    expect(L(99_687)).toContain('**Screen `SCR-SA-SCHED-01`, Scheduler Registry.**')
    expect(L(99_687)).toContain(
      'No tenant operational content appears here — this is layer 1, named administration and telemetry [SoW Fact — §8.1.2].',
    )
  })

  it('transcribes all ten, in the source’s order and its own words', () => {
    expect(parsed).toHaveLength(10)
    expect(REGISTRY_COLUMNS.map((c) => c.label)).toEqual([...parsed])
    // Named individually as well, so a rewrite of the parser cannot quietly
    // agree with a rewritten transcription.
    expect(parsed).toEqual([
      'name',
      'owning surface',
      'authority class',
      'mechanism class',
      'cron expression or trigger description',
      'scope (platform-wide or per tenant)',
      'last successful occurrence',
      'next expected occurrence',
      'backlog depth',
      'health chip',
    ])
  })

  it('splits five answered and five unanswered, against the register’s own header', () => {
    expect(ANSWERED_COLUMNS).toHaveLength(5)
    expect(UNANSWERED_COLUMNS).toHaveLength(5)
    expect(ANSWERED_COLUMNS.length + UNANSWERED_COLUMNS.length).toBe(REGISTRY_COLUMNS.length)

    // The deployable register declares seven columns and none of them is
    // scope, which is why one of the five is unanswerable rather than
    // untranscribed. Parsed off the header, not asserted from memory.
    const header = cells(L(102_394))
    expect(header).toEqual([
      'Identifier',
      'Obligation',
      'Owning surface',
      'Authority class',
      'Mechanism',
      'Cadence or due rule',
      'Source',
    ])
    expect(header.some((h) => /scope/i.test(h))).toBe(false)

    expect(UNANSWERED_COLUMNS.map((c) => c.answerability)).toEqual([
      'absentFromTheRegister',
      'telemetry',
      'telemetry',
      'telemetry',
      'telemetry',
    ])
    for (const c of UNANSWERED_COLUMNS) {
      expect(c.whyNot, c.label).not.toBeNull()
      expect(c.field, c.label).toBeNull()
    }
    for (const c of ANSWERED_COLUMNS) {
      expect(c.field, c.label).not.toBeNull()
      expect(c.whyNot, c.label).toBeNull()
    }
  })

  it('builds its rows from the register and matches its counted census', () => {
    expect(REGISTRY_ROWS).toHaveLength(DEPLOYABLE_OBLIGATIONS.length)
    expect(DEPLOYABLE_CENSUS?.counted).toBe(REGISTRY_ROWS.length)
    // Every row's cells come from the register row it names, and every cell is
    // non-empty: a blank registry cell would be the never-zero rule broken in
    // the half of the table that HAS data.
    for (const row of REGISTRY_ROWS) {
      expect(row.cells, row.id).toHaveLength(ANSWERED_COLUMNS.length)
      for (const cell of row.cells) expect(cell.trim(), row.id).not.toBe('')
      expect(L(row.line), row.id).toContain(`\`${row.id}\``)
    }
  })

  it('measures zero cron expressions in the register, with a working detector', () => {
    expect(CADENCE_CELLS_HOLDING_A_CRON_EXPRESSION).toBe(0)

    // POSITIVE CONTROL for the same detector, because a count of zero is what
    // a regex that matches nothing also returns. The detector is re-declared
    // here from the same shape rather than exported: what is being proved is
    // that a cron expression IS recognisable, so a zero is a measurement.
    const detector = /^[\d*/,\-?LW#]+(\s+[\d*/,\-?LW#]+){4,5}$/
    expect(detector.test('0 6 * * *')).toBe(true)
    expect(detector.test('*/15 * * * 1-5')).toBe(true)
    expect(detector.test('Start plus 15 minutes')).toBe(false)
    // And every real cadence cell is prose, which is the finding.
    for (const o of DEPLOYABLE_OBLIGATIONS) {
      expect(detector.test(o.cadence.trim()), o.id).toBe(false)
    }
  })
})

/* ==================================================================== *
 * THE SECOND SCREEN, PARSED OFF ITS ONE LINE.
 * ==================================================================== */

describe('SCR-SA-SCHED-02’s one line', () => {
  it('reads the whole line, both halves', () => {
    expect(L(100_760)).toBe(
      '- **Screen `SCR-SA-SCHED-02`, Occurrence detail.** Shows occurrence identifier, definition, intended time, actual time, duration, outcome, attempt count, and the reason class for any block or failure. It shows **no** tenant operational content: no measurement, no worker name, no evidence.',
    )
  })

  it('is specified, and specified exactly once — which is the finding', () => {
    // The brief that dispatched this task called the second screen
    // "effectively unspecified". The line above disproves that: eight fields
    // and an exclusion. What is true is that it is corroborated NOWHERE.
    const [registry, detail] = SCHEDULER_SCREENS
    expect(detail.occurrences).toHaveLength(1)
    expect(registry.occurrences.length).toBeGreaterThan(detail.occurrences.length)
    expect(OCCURRENCE_DETAIL_FIELDS.length).toBeGreaterThan(0)
  })

  it('transcribes the eight fields in the source’s order and its own words', () => {
    const line = L(100_760)
    const clause = line
      .slice(line.indexOf('Shows ') + 'Shows '.length)
      .replace(/\. It shows[\s\S]*$/, '')
    const parsed = clause.replace(/, and /, ', ').split(', ').map((f) => f.trim())

    expect(parsed).toHaveLength(8)
    expect(OCCURRENCE_DETAIL_FIELDS.map((f) => f.label)).toEqual([...parsed])
    expect(parsed).toEqual([
      'occurrence identifier',
      'definition',
      'intended time',
      'actual time',
      'duration',
      'outcome',
      'attempt count',
      'the reason class for any block or failure',
    ])
  })

  it('carries the exclusion, parsed off the same line', () => {
    const line = L(100_760)
    const parsed = line
      .slice(line.indexOf('tenant operational content: ') + 'tenant operational content: '.length)
      .replace(/\.\s*$/, '')
      .split(', ')
      .map((x) => x.trim())
    expect(parsed).toEqual([...OCCURRENCE_DETAIL_EXCLUDES])
    expect(parsed).toEqual(['no measurement', 'no worker name', 'no evidence'])
  })

  it('claims a second source only for the two fields that have one', () => {
    const withSecondSource = OCCURRENCE_DETAIL_FIELDS.filter((f) => f.definedAt !== null)
    expect(withSecondSource.map((f) => f.label)).toEqual([
      'occurrence identifier',
      'the reason class for any block or failure',
    ])
    // And each cited line carries what the field record says it carries.
    expect(L(98_875)).toContain('**Scheduled Occurrence (`SCHEDRUN-`).**')
    expect(L(98_875)).toContain('its idempotency key')
    expect(L(100_970)).toBe('| # | Condition | How it is established | If it cannot be established |')
  })
})

/* ==================================================================== *
 * THE EIGHT BLOCK REASON CLASSES, PARSED OFF THE GATE TABLE.
 * ==================================================================== */

describe('the execution gate’s eight reason classes', () => {
  it('counts eight rows by reading to where the body stops', () => {
    expect(L(100_971)).toMatch(/^\|(-+\|)+$/)
    const body: string[] = []
    for (let n = 100_972; ; n += 1) {
      const line = L(n)
      if (!line.startsWith('|')) break
      body.push(line)
    }
    expect(body).toHaveLength(8)
    expect(BLOCK_REASON_CLASSES).toHaveLength(body.length)
  })

  it('transcribes each condition and its reason class off its own row', () => {
    for (const row of BLOCK_REASON_CLASSES) {
      const c = cells(L(row.line))
      expect(c[0], `L${row.line}`).toBe(String(row.condition))
      expect(c[1], `L${row.line}`).toBe(`**${row.name}**`)
      // The reason class is the leading backticked token of the fourth cell.
      const stated = /^`([^`]+)`/.exec(c[3] ?? '')?.[1]
      expect(stated, `L${row.line}`).toBe(row.reasonClass)
    }
  })

  it('numbers them one to eight with no gap and no repeat', () => {
    expect(BLOCK_REASON_CLASSES.map((c) => c.condition)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(new Set(BLOCK_REASON_CLASSES.map((c) => c.reasonClass)).size).toBe(8)
  })
})

/* ==================================================================== *
 * THE `outcome` FIELD'S TWO VOCABULARIES, BOTH COUNTED.
 * ==================================================================== */

describe('two occurrence-state vocabularies, neither preferred', () => {
  const conflict = OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT

  it('counts fifteen lifecycle-diagram nodes by reading them', () => {
    const nodes = sourceLines
      .slice(conflict.lifecycleDiagram.firstNodeLine - 1, conflict.lifecycleDiagram.lastNodeLine)
      .map((l) => /^\s{4}(\w+) : /.exec(l)?.[1])
    expect(nodes.every((n) => n !== undefined)).toBe(true)
    expect(nodes).toHaveLength(conflict.lifecycleDiagram.countedStates)
    expect(nodes[0]).toBe('Planned')
    expect(nodes.at(-1)).toBe('Reconciled')
    // The set this build shipped is the same size as the diagram it came from.
    expect(conflict.lifecycleDiagram.shippedCount).toBe(
      conflict.lifecycleDiagram.countedStates,
    )
  })

  it('counts twelve register states by splitting the register line', () => {
    const line = L(conflict.stateRegister.line)
    expect(line).toContain('**The occurrence state register.**')
    expect(line).toContain('none may be collapsed into "done"')
    // The twelve are ONE backticked span separated by middle dots, not twelve
    // spans. A per-token regex returns nothing here, which is how this
    // assertion found its own first wording wrong.
    const span = /`([a-z_ ·]+)`/.exec(line)?.[1] ?? ''
    const parsed = span.split(' · ').map((s) => s.trim())
    expect(parsed).toHaveLength(conflict.stateRegister.countedStates)
    expect(parsed).toEqual([...conflict.stateRegister.states])
  })

  it('shares exactly four names between the two sets', () => {
    const diagram = new Set(
      sourceLines
        .slice(conflict.lifecycleDiagram.firstNodeLine - 1, conflict.lifecycleDiagram.lastNodeLine)
        .map((l) => (/^\s{4}(\w+) : /.exec(l)?.[1] ?? '').toLowerCase()),
    )
    const shared = conflict.stateRegister.states.filter((s) => diagram.has(s))
    expect(shared).toEqual([...conflict.common])
    expect(shared).toHaveLength(4)
    // Eight of the register's twelve are absent from the diagram, which is
    // what makes them two sets rather than two spellings.
    expect(conflict.stateRegister.states.filter((s) => !diagram.has(s))).toHaveLength(8)
  })

  it('settles nothing and mints no decision identifier', () => {
    expect(conflict.settled).toBe(false)
    expect(conflict.decisionMinted).toBeNull()
    expect(L(conflict.criterionThatFavoursTheRegister)).toContain(
      '`AC-SCHED-372` no state outside the four registers appears in any code path or user interface string',
    )
  })
})

/* ==================================================================== *
 * THE THREE THINGS THAT COULD NOT BE ESTABLISHED.
 * ==================================================================== */

describe('the three unestablished items ship marked so', () => {
  it('carries all three, each with at least one locator it can be checked at', () => {
    expect(UNESTABLISHED).toHaveLength(3)
    for (const item of UNESTABLISHED) {
      expect(item.whatTheSourceSays.length, item.question).toBeGreaterThan(0)
      expect(item.notKnown.trim(), item.question).not.toBe('')
    }
  })

  it('reads the tenant-scope ledger rows whole, and finds no screen for them', () => {
    const holds = cells(L(100_424))
    expect(holds[0]).toBe('Holds the official scheduled-run ledger for tenant-scope work')
    expect(holds[1]).toBe('`Allowed`')
    expect(holds[5]).toBe('`Not applicable — platform scope only`')

    const displays = cells(L(100_427))
    expect(displays[0]).toBe('Displays occurrence state')
    expect(displays[1]).toBe('`Allowed`')
    expect(displays[5]).toBe('`Allowed` — counts and health only')
  })

  it('reads the two timing-classification rows whole, and neither claims a screen', () => {
    // THE DISPATCHING BRIEF SAID L98141 "points at `MOD-SA-07`". IT DOES NOT.
    // The per-SURFACE row names a settings category and no module identifier;
    // the per-MODULE row that classifies MOD-SA-07 is a different table
    // ninety-four lines further on. Both are read here so neither can be
    // mistaken for the other again.
    const surfaceRow = cells(L(98_141))
    expect(surfaceRow[0]).toBe('Super Admin platform console (`SURF-SA`)')
    expect(surfaceRow[1]).toBe('`TC-10` platform or infrastructure maintenance schedule')
    expect(surfaceRow[2]).toBe(
      'The named platform schedulers and the maintenance-window calendar sit in its System settings category [SoW Fact — §8.7.1].',
    )
    expect(surfaceRow[2]).not.toMatch(/MOD-/)

    const moduleRow = cells(L(98_235))
    expect(moduleRow[0]).toBe('`MOD-SA-07` Platform Settings')
    expect(moduleRow[1]).toBe('`TC-10` platform or infrastructure maintenance schedule')
    expect(moduleRow[2]).toBe(
      'The System category names the platform schedulers and maintenance windows [SoW Fact — §8.7.1].',
    )
    // Neither row mentions either screen, which is the point of reading them.
    expect(`${L(98_141)}\n${L(98_235)}`).not.toMatch(/SCR-SA-SCHED/)
  })

  it('measures no PER-SCHED operation anywhere in MOD-SA-07’s module record', () => {
    const record = sourceLines.slice(44_629 - 1, 44_662).join('\n')
    expect(record).toContain('| Identifier | `MOD-SA-07` |')
    expect(record.match(/PER-SCHED-\d\d/g)).toBeNull()
    // POSITIVE CONTROL for the same scan, so a null is a measurement: the
    // matrix that DOES enumerate those operations is found by it.
    expect(sourceLines.slice(99_235 - 1, 99_256).join('\n').match(/PER-SCHED-\d\d/g)).toHaveLength(
      22,
    )
  })

  it('cites DEC-FINISH-002 from the canon and invents no reading for it', () => {
    const record = OPEN_DECISIONS.find((d) => d.id === 'DEC-FINISH-002')
    expect(record).toBeDefined()
    // ZERO readings, because the source records none. This gate is why no
    // screen may add one: the record is the single home and it is empty.
    expect(record?.readings).toHaveLength(0)

    // Measured, both occurrences, whole lines.
    expect(linesCarrying('DEC-FINISH-002')).toEqual([98_703, 115_082])
    expect(L(98_703)).toContain(
      'the manual-close anchor contradiction recorded as `DEC-FINISH-002`',
    )
    expect(cells(L(115_082))[0]).toBe('`DEC-FINISH-002`')
    expect(cells(L(115_082))[2]).toBe('2')
  })

  it('does not re-render DEC-SCHED-011 in any file this task owns', () => {
    const OWNED = [
      'src/surfaces/sa/scheduler/registry.ts',
      'src/surfaces/sa/scheduler/SchedulerScaffold.tsx',
      'src/surfaces/sa/scheduler/SchedulerRegistryScreen.tsx',
      'src/surfaces/sa/scheduler/OccurrenceDetailScreen.tsx',
      'app/super-admin/scheduler-registry/page.tsx',
      'app/super-admin/occurrence-detail/page.tsx',
    ]
    for (const rel of OWNED) {
      const stripped = stripComments(readFileSync(join(process.cwd(), rel), 'utf8'))
      expect(stripped, rel).not.toContain('DEC-SCHED-011')
    }
    // POSITIVE CONTROL: the scan does see a decision identifier that IS here,
    // so an empty result above is a measurement rather than a broken read.
    const scaffold = stripComments(
      readFileSync(join(process.cwd(), 'src/surfaces/sa/scheduler/SchedulerScaffold.tsx'), 'utf8'),
    )
    expect(scaffold).toContain('DEC-FINISH-002')
  })
})

/* ==================================================================== *
 * THE HONESTY RULES, AS TOTAL FUNCTIONS OVER THE WHOLE VOCABULARY.
 * ==================================================================== */

describe('a figure that is not current never reads as healthy', () => {
  it('returns the ok tone for `current` and for nothing else', () => {
    // AC-SCHED-183 as a total function: every member of the vocabulary is
    // asked, so no arrangement of the data produces a green chip over a
    // figure that is not current. The expected tone is written out per member
    // rather than derived from `healthTone`, which would be the function
    // tested against itself.
    expect(SA_FRESHNESS.map((f) => [f, healthTone(f)])).toEqual([
      ['current', 'ok'],
      ['stale', 'stale'],
      ['unavailable', 'blocked'],
      ['reconciled', 'info'],
      ['loading', 'neutral'],
      ['empty', 'neutral'],
      ['recovering', 'neutral'],
    ])
    expect(SA_FRESHNESS.filter((f) => healthTone(f) === 'ok')).toEqual(['current'])
  })

  it('says "unknown" in the label of every non-current reading', () => {
    for (const freshness of SA_FRESHNESS) {
      const label = healthLabel(freshness)
      if (freshness === 'current') expect(label).toBe('Scheduler health current')
      else expect(label, freshness).toContain('unknown')
      expect(label, freshness).not.toMatch(/\bhealthy\b/)
    }
  })

  it('reads the surface’s own terminal safe state, whole', () => {
    expect(L(100_766)).toContain(
      'the console renders "scheduler health unknown since 04:12" rather than a green indicator',
    )
    expect(L(100_766)).toContain(
      'A green indicator computed from stale data is the single most dangerous rendering on this surface.',
    )
    expect(L(100_775)).toContain('A stale telemetry figure never renders as healthy.')
  })
})

describe('an unknown, stale or partial figure never renders as zero', () => {
  it('renders no zero and no blank for any freshness, and names the absence for four of the seven', () => {
    // MEASURED RATHER THAN ASSUMED, and the measurement corrected this
    // assertion's first wording: `stale` is a PASS-THROUGH arm, not a
    // replacement one, because AC-SA-01-03 renders a degraded aggregate as
    // the value WITH ITS AGE rather than as the word "stale". The never-green
    // half of the rule is kept by the chip's tone and label, which the
    // preceding block asserts over the whole vocabulary.
    const namesTheAbsence = ['unavailable', 'loading', 'empty', 'recovering']
    for (const freshness of SA_FRESHNESS) {
      const text = saAggregateText(freshness, 'A REAL VALUE')
      expect(text.trim(), freshness).not.toBe('')
      expect(text, freshness).not.toBe('0')
      expect(text, freshness).not.toMatch(/^0+$/)
      if (namesTheAbsence.includes(freshness)) {
        expect(text, freshness).not.toBe('A REAL VALUE')
        expect(text, freshness).not.toMatch(/^\d+$/)
      } else {
        expect(text, freshness).toBe('A REAL VALUE')
      }
    }
    // And a zero handed to the pass-through arms is what the chip has to
    // catch, which is why the chip is a total function over the same
    // vocabulary: only `current` can pair a number with a green tone.
    expect(SA_FRESHNESS.filter((f) => saAggregateText(f, '0') === '0')).toEqual([
      'current',
      'stale',
      'reconciled',
    ])
    expect(SA_FRESHNESS.filter((f) => saAggregateText(f, '0') === '0' && healthTone(f) === 'ok'))
      .toEqual(['current'])
  })

  it('puts this screen in the empty state and reads it as nothing recorded', () => {
    expect(saFreshnessFor(TELEMETRY_STATE)).toBe('empty')
    expect(telemetryReading()).toBe('Nothing recorded yet')
    expect(telemetryReading()).not.toBe('0')
  })
})

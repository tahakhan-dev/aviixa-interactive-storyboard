import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

import { correlationId, scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, tenantPartition, withTenant } from '@/domain/state'
import type { IdentitySimulationState } from '@/domain/state'
import { CANONICAL_EPOCH_MS, fixedClock } from '@/domain/clock'
import { ROLES, rolesInDomain, type RoleId } from '@/domain/roles'
import type { TransitionContext } from '@/domain/transition'
import { reduce } from '@/kernel/reduce'
import {
  HUB_COMMAND_TYPES,
  isHubCommand,
  type HubCommand,
  type HubCommandType,
  type ScenarioCommand,
} from '@/domain/commands'
import { FALLBACK_PATTERNS, fallbackPattern } from '@/surfaces/doh/fallbacks'
import {
  JOB_OWNER_GATED_ROWS,
  MOD_DOH_16_TENANT_ADMIN_CONTRADICTION,
  jobOwnerGate,
  jobOwnerVerdict,
} from '@/surfaces/doh/job-owner'
import {
  HUB_COMMAND_SPECS,
  MOD_DOH_08_WRITE_ROWS,
  applyHubCommand,
  objectKey,
  readJob,
  readSummary,
  type AssignmentRecord,
  type ExecutionSummaryRecord,
  type JobRecord,
} from '@/surfaces/doh/objects'
import {
  CONTROL_MATRIX as DOH_08_MATRIX,
  type Doh08Row,
} from '@/surfaces/doh/modules/doh-08/matrix'
import { MOD_DOH_05_ACTS } from '@/surfaces/doh/modules/doh-05/matrix'
import { MOD_DOH_06_MATRIX } from '@/surfaces/doh/modules/doh-06/matrix'
import { CONTROL_MATRIX as DOH_07_MATRIX } from '@/surfaces/doh/modules/doh-07/matrix'
import { MOD_DOH_15_MATRIX } from '@/surfaces/doh/modules/doh-15/matrix'
import { CONTROL_MATRIX as DOH_16_MATRIX } from '@/surfaces/doh/modules/doh-16/matrix'

/**
 * THE FROZEN SOURCE, not `registries/raw/`.
 *
 * Every expectation below that could have been copied out of the code it
 * checks is instead READ FROM THE BLUEPRINT at test time. A registry that
 * ships nine patterns and a test that asserts `toBe(9)` agree with each
 * other and with nothing else; a count parsed from §19.2's own pattern
 * headers cannot be made to agree by editing the registry.
 *
 * The same rule is applied to the two contradicting MOD-DOH-16 cells, to the
 * five-role tenant model, and to the seven pattern identifiers the slice-6
 * identity cards name. Where an expectation is genuinely internal (an
 * append-only list stays append-only), it is stated as behaviour and the
 * behaviour is exercised, never asserted against the field under test.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** The `| a | b | c |` cells of one markdown table row, trimmed. */
function tableCells(line: string): readonly string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

const RUN = scenarioRunId('RUN-DOH-06')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')

const SAM = 'PERSON-SAM'
const PRIYA = 'PERSON-PRIYA'
const ELENA = 'PERSON-ELENA'

const JOB: JobRecord = {
  jobId: 'JOB-RED-BIKES',
  name: 'Assemble red bicycles on Line A',
  jobTypeId: 'JT-ASSEMBLY',
  parentNodeId: 'CELL-A1',
  ownerId: SAM,
  state: 'active',
  createdBy: SAM,
}

const PAIRED_JOB: JobRecord = { ...JOB, jobId: 'JOB-BLUE-BIKES', ownerId: PRIYA, createdBy: PRIYA }

const SUMMARY: ExecutionSummaryRecord = {
  summaryId: 'SUM-001',
  runId: 'RUN-001',
  anomalies: [{ anomalyId: 'ANOM-1', severity: 'Critical', state: 'Open', closureNote: null }],
  annotations: [{ annotationId: 'ANN-1', text: 'Original reading transcribed from the log.' }],
}

const ASSIGNMENT: AssignmentRecord = {
  assignmentId: 'ASG-1',
  runId: 'RUN-001',
  workerId: 'WORKER-MAYA',
  packageRef: 'PKG-WF-2.1.0',
  supersededBy: null,
  substitutionReason: null,
}

function baseState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
    objects: {
      [objectKey.job(JOB.jobId)]: JOB,
      [objectKey.job(PAIRED_JOB.jobId)]: PAIRED_JOB,
      [objectKey.summary(SUMMARY.summaryId)]: SUMMARY,
      [objectKey.assignment(ASSIGNMENT.assignmentId)]: ASSIGNMENT,
      [objectKey.run('RUN-001')]: {
        runId: 'RUN-001',
        jobId: JOB.jobId,
        productionDate: '2026-08-21',
        runSource: 'manual',
        state: 'scheduled',
        cancellationReasonCode: null,
        cancellationNote: null,
      },
    },
  }))
}

function identity(role: RoleId): IdentitySimulationState {
  return {
    signedIn: true,
    role,
    tenant: BRIGHT,
    siteScope: ['SITE-RIVERSIDE'],
    areaScope: ['AREA-ASSEMBLY'],
    qualifications: [],
    deviceId: null,
    stepUpActive: false,
    accessSessionId: null,
  }
}

function context(role: RoleId, actorOfRecord: string): TransitionContext {
  return {
    clock: fixedClock(CANONICAL_EPOCH_MS),
    identity: identity(role),
    online: true,
    deviceTrusted: true,
    actorOfRecord,
    correlationId: correlationId('COR-DOH-06'),
    failureInjection: null,
  }
}

/* ==================================================================== *
 * 1. THE HUB FALLBACK-PATTERN REGISTRY
 * ==================================================================== */

/* ==================================================================== *
 * THE WRITE SURFACE, DERIVED FROM THE MATRICES
 * ==================================================================== */

/**
 * WHICH ACTS NEED A `HubCommand`, measured off the six Hub matrices rather
 * than counted by hand. `@/domain/commands` used to say the matrices name
 * "roughly twenty-five" acts and gave no way to check it. They name
 * thirty-four writes.
 *
 * THE RULE, three clauses, each doing work and each checked below:
 *
 *  1. `surface === 'screen'` — the act is met on THIS module's own screen.
 *     A Command Center act, a Studio act or a console act is not a Hub
 *     write however permissive its cell reads.
 *  2. some role's cell is `allowed` or `allowed-with-conditions` — the
 *     ACTING statuses, `MOD-DOH-06`'s own list. A row nobody may act on has
 *     no write for a command to carry.
 *  3. the Read-only Auditor does NOT hold the row. That role is defined by
 *     holding every read and no write (L1604's charter, and its cells across
 *     all six matrices), so a row it holds is a READ — which is how "View
 *     Jobs", "View the schedule", "Work the review queue" and the two
 *     Anomaly Register views come out of the set without anyone naming them.
 */
const ACTING: readonly string[] = ['allowed', 'allowed-with-conditions']
const HOLDING: readonly string[] = ['allowed', 'allowed-with-conditions', 'read-only']

interface ScannedRow {
  readonly id: string
  readonly control: string
  readonly surface: string
  readonly status: Readonly<Record<string, string | null>>
  readonly sourceRef: string
}

/** `MOD-DOH-05` contributes ACTS, not rows: row 11 states two in one cell. */
const WRITE_SOURCES: readonly { readonly moduleId: string; readonly rows: readonly ScannedRow[] }[] =
  [
    {
      moduleId: 'MOD-DOH-05',
      rows: MOD_DOH_05_ACTS.map((a) => ({ ...a, surface: 'screen' })) as readonly ScannedRow[],
    },
    { moduleId: 'MOD-DOH-06', rows: MOD_DOH_06_MATRIX as readonly ScannedRow[] },
    { moduleId: 'MOD-DOH-07', rows: DOH_07_MATRIX as readonly ScannedRow[] },
    { moduleId: 'MOD-DOH-08', rows: DOH_08_MATRIX as readonly ScannedRow[] },
    { moduleId: 'MOD-DOH-15', rows: MOD_DOH_15_MATRIX as readonly ScannedRow[] },
    { moduleId: 'MOD-DOH-16', rows: DOH_16_MATRIX as readonly ScannedRow[] },
  ]

function writeActs(): readonly string[] {
  return WRITE_SOURCES.flatMap(({ moduleId, rows }) =>
    rows
      .filter((row) => {
        const cells = Object.values(row.status)
        const acts = cells.some((c) => c !== null && ACTING.includes(c))
        const auditor = row.status.READONLY_AUDITOR
        const auditorHolds = auditor !== null && auditor !== undefined && HOLDING.includes(auditor)
        return row.surface === 'screen' && acts && !auditorHolds
      })
      .map((row) => `${moduleId}/${row.id}`),
  )
}

/**
 * The declared half: which derived write act each shipped command carries.
 * There is no derivable link between a matrix row and a command type, so
 * this is stated — and every key is checked against the derived set below,
 * so a row that is renamed or reclassified takes this map red with it.
 */
const COMMAND_FOR: Readonly<Record<string, HubCommandType>> = {
  'MOD-DOH-05/create-a-job': 'DOH_CREATE_JOB',
  'MOD-DOH-05/submit-a-job-for-approval': 'DOH_SUBMIT_JOB_FOR_APPROVAL',
  'MOD-DOH-05/approve-a-job': 'DOH_APPROVE_JOB',
  'MOD-DOH-05/reassign-the-job-owner': 'DOH_REASSIGN_JOB_OWNER',
  'MOD-DOH-05/decide-a-notified-class-version-adoption': 'DOH_DECIDE_VERSION_ADOPTION',
  'MOD-DOH-06/create-a-run': 'DOH_SCHEDULE_RUN',
  'MOD-DOH-06/cancel-a-run': 'DOH_CANCEL_RUN',
  'MOD-DOH-07/assign-worker': 'DOH_ASSIGN_WORKER',
  'MOD-DOH-07/substitute-worker': 'DOH_SUBSTITUTE_WORKER',
  'MOD-DOH-08/resolve-an-anomaly': 'DOH_RESOLVE_ANOMALY',
  'MOD-DOH-08/add-a-correction-annotation': 'DOH_ANNOTATE_SUMMARY',
  'MOD-DOH-15/clone-a-job': 'DOH_CLONE_JOB',
  'MOD-DOH-16/create-a-pairing-between-two-jobs': 'DOH_PAIR_JOBS',
  'MOD-DOH-16/remove-a-pairing': 'DOH_UNPAIR_JOBS',
  'MOD-DOH-16/act-on-the-review-flag': 'DOH_ACT_ON_PAIRED_REVIEW_FLAG',
}

describe('the Hub write surface, derived from the six matrices', () => {
  it('derives thirty-four write acts, and every clause of the rule removes something', () => {
    const acts = writeActs()
    expect(acts).toHaveLength(34)
    expect(new Set(acts).size, 'a row id appears twice within one module').toBe(acts.length)

    // Clause 3 is what removes the reads, and it removes exactly five.
    expect(acts).not.toContain('MOD-DOH-05/view-jobs')
    expect(acts).not.toContain('MOD-DOH-06/view-the-schedule')
    expect(acts).not.toContain('MOD-DOH-07/view-assignments')
    expect(acts).not.toContain('MOD-DOH-08/work-the-review-queue')
    expect(acts).not.toContain('MOD-DOH-08/view-the-anomaly-register')

    // Clause 1 is what removes the acts met elsewhere: MOD-DOH-08's two
    // Command Center rows read `Allowed` and `Allowed with conditions`.
    expect(acts).not.toContain('MOD-DOH-08/release-a-severity-1-lot-hold')
    expect(acts).not.toContain('MOD-DOH-08/reclassify-an-anomaly-severity')
    expect(acts).not.toContain('MOD-DOH-15/approve-the-cloned-job')

    // Clause 2 is what removes the rows nobody may act on at all.
    expect(acts).not.toContain('MOD-DOH-16/cause-automated-propagation-across-the-link')
    expect(acts).not.toContain('MOD-DOH-08/force-a-re-finalisation')
  })

  it('carries a command for fifteen of the thirty-four, and names the nineteen that have none', () => {
    const acts = writeActs()
    const commanded = acts.filter((a) => COMMAND_FOR[a] !== undefined)
    expect(commanded).toHaveLength(15)
    expect(acts.length - commanded.length).toBe(19)

    // Every shipped command is carried by exactly one derived act, so the
    // count above cannot be reached by mapping two acts onto one command.
    expect(new Set(commanded.map((a) => COMMAND_FOR[a])).size).toBe(HUB_COMMAND_TYPES.length)
    expect(HUB_COMMAND_TYPES).toHaveLength(15)

    // And the map cannot rot: a key naming a row the derivation does not
    // produce is a row that was renamed, reclassified or made a read.
    for (const key of Object.keys(COMMAND_FOR)) {
      expect(acts, `${key} is not a derived write act`).toContain(key)
    }
  })

  it('the three commands this slice added close the two gaps the modules recorded', () => {
    // MOD-DOH-15's whole module is one write and had no command at all;
    // MOD-DOH-16 had a command that acts on a pairing nothing could make.
    for (const key of [
      'MOD-DOH-15/clone-a-job',
      'MOD-DOH-16/create-a-pairing-between-two-jobs',
      'MOD-DOH-16/remove-a-pairing',
    ]) {
      expect(writeActs()).toContain(key)
      expect(COMMAND_FOR[key]).toBeDefined()
    }
    // Both cards name a Hub WRITE pattern, which is what separates these
    // three from the nineteen left uncommanded.
    expect(sourceLine(29471)).toContain('FB-DOH-WRITE-002')
    expect(sourceLine(29607)).toContain('FB-DOH-WRITE-002')
  })
})

describe('§19.2 Hub fallback-pattern registry', () => {
  it('registers exactly the number of patterns §19.2 itself defines', () => {
    // DERIVED, not quoted. §19.2 runs from its own heading to §19.3's.
    const start = SOURCE_LINES.findIndex((l) =>
      l.startsWith('## 19.2 The Shared Fallback Pattern Register'),
    )
    const end = SOURCE_LINES.findIndex((l, i) => i > start && l.startsWith('## 19.3 '))
    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)

    const headers = SOURCE_LINES.slice(start, end).filter((l) =>
      l.startsWith('**Pattern `FB-DOH-'),
    )
    // If §19.2 gained an eleventh pattern tomorrow, this line changes on its
    // own and the registry goes red until it catches up.
    expect(FALLBACK_PATTERNS).toHaveLength(headers.length)
  })

  it('registers exactly the identifiers the whole source uses, no more and no fewer', () => {
    // A second, independent derivation: every `FB-DOH-*` token anywhere in
    // the 122,241-line source, not only inside §19.2. A registry entry that
    // no module can ever cite would show up here as a surplus.
    const inSource = new Set(
      SOURCE_LINES.join('\n').match(/FB-DOH-[A-Z]+-\d+/g) ?? [],
    )
    const registered = new Set(FALLBACK_PATTERNS.map((p) => p.id))
    expect([...registered].sort()).toEqual([...inSource].sort())
  })

  it('resolves every pattern the four slice-6 identity cards name', () => {
    // The plan states seven of ten are named on these four cards. The seven
    // are not listed here — they are parsed out of the cards.
    const cardLines = [27688, 27903, 28294, 30064].map(sourceLine)
    const named = new Set(cardLines.flatMap((l) => l.match(/FB-DOH-[A-Z]+-\d+/g) ?? []))
    expect(named.size).toBe(7)
    for (const id of named) {
      // Throws if the registry does not carry it — which, before this slice,
      // it would have done for all seven: there were zero `FB-DOH-` strings
      // anywhere under src/, app/ or tests/.
      expect(fallbackPattern(id as never).id).toBe(id)
    }
  })

  it('carries each pattern’s terminal safe state verbatim from its own table row', () => {
    for (const pattern of FALLBACK_PATTERNS) {
      const line = Number(pattern.sourceLine.slice(1))
      // Walk from the pattern header to its `| Terminal safe state |` row.
      const row = SOURCE_LINES.slice(line, line + 32).find((l) =>
        l.startsWith('| Terminal safe state |'),
      )
      expect(row, `no terminal safe state row found under ${pattern.id}`).toBeDefined()
      const cell = tableCells(row ?? '')[1] ?? ''
      // Citations in the source carry a trailing `[SoW Fact — §x]`; the
      // registry drops those and keeps the sentence. So: containment, which
      // is what "never paraphrased" actually means here.
      expect(cell).toContain(pattern.terminalSafeState)
    }
  })

  it('refuses an identifier no module could have read from §19.2', () => {
    expect(() => fallbackPattern('FB-DOH-CORE-999' as never)).toThrow(/Unknown Hub fallback/)
  })
})

/* ==================================================================== *
 * 1b. HOW MANY WRITE ROWS MOD-DOH-08 ACTUALLY HAS.
 *
 * `MOD_DOH_08_WRITE_PATTERN` exists because MOD-DOH-08's identity card names
 * no write pattern while its matrix carries writes. The comment beside it
 * used to say "rows 6 and 10 are both writes", which is the subset of the
 * write surface that THIS FILE gives a Hub command — not the write surface.
 * There are five.
 *
 * DERIVED HERE, NOT READ BACK. Nothing below takes its expectation from
 * `MOD_DOH_08_WRITE_ROWS`; the set is rebuilt from the frozen source by a
 * stated rule and the constant is compared against it. The rule is:
 *
 *   a row is a WRITE this surface carries when
 *     (1) at least one of its five cells is permissive — the cell contains
 *         `Allowed`, which covers `Allowed` and `Allowed with conditions`
 *         and excludes `Read-only`, `Unavailable`, `Explicitly prohibited`
 *         and `Not applicable`; AND
 *     (2) its action is not a READ or an EXPORT — "View …", "Work the …",
 *         "Export …". MOD-DOH-08's own matrix says the same of the queue
 *         row: "Working the queue is reading it; the acts are rows 3 to 6";
 *         AND
 *     (3) the module does not classify it `another-surface`. A Hub write
 *         pattern over an act the Hub does not perform is a second false
 *         claim, and two rows here are exactly that.
 *
 * The classification in (3) comes from MOD-DOH-08's matrix rather than from
 * a list written here, because the classification is the thing this build
 * already proves against the source elsewhere; re-typing it would make this
 * test agree with a second copy instead of with §19.10.
 * ==================================================================== */

const DOH_08_MATRIX_HEADER = 28_298
const DOH_08_MATRIX_FIRST_ROW = 28_300
const DOH_08_MATRIX_LAST_ROW = 28_314

describe('MOD-DOH-08’s write surface, counted off §19.10', () => {
  /** Row ordinals count from L28300 as row 1. */
  const sourceRows = Array.from(
    { length: DOH_08_MATRIX_LAST_ROW - DOH_08_MATRIX_FIRST_ROW + 1 },
    (_unused, i) => {
      const line = DOH_08_MATRIX_FIRST_ROW + i
      const cells = tableCells(sourceLine(line))
      return { ordinal: i + 1, line, action: cells[0] ?? '', roleCells: cells.slice(1) }
    },
  )

  const adjacentLines = new Set(
    (DOH_08_MATRIX as readonly Doh08Row[])
      .filter((r) => r.surface === 'another-surface')
      .map((r) => Number(r.sourceRef.slice(1))),
  )

  const READ_OR_EXPORT = /^(View |Work the |Export )/

  const derived = sourceRows.filter(
    (r) =>
      r.roleCells.some((c) => c.includes('Allowed')) &&
      !READ_OR_EXPORT.test(r.action) &&
      !adjacentLines.has(r.line),
  )

  it('spans a header, a separator and fifteen data rows, counted line by line', () => {
    // The plan's spans start on the table HEADER, so n rows enclose n+2 lines.
    expect(sourceLine(DOH_08_MATRIX_HEADER)).toContain('| Action | Tenant Admin |')
    expect(sourceLine(DOH_08_MATRIX_HEADER + 1)).toMatch(/^\|-+\|/)
    expect(sourceRows).toHaveLength(15)
    expect(DOH_08_MATRIX_LAST_ROW - DOH_08_MATRIX_HEADER + 1).toBe(15 + 2)
    for (const row of sourceRows) expect(row.roleCells, `L${row.line}`).toHaveLength(5)
  })

  it('finds FIVE write rows, where the file used to claim two', () => {
    expect(derived).toHaveLength(5)
    expect(derived.map((r) => r.ordinal)).toEqual([3, 4, 6, 10, 14])
  })

  it('records the same five, at the same lines, with the same control names', () => {
    expect(
      MOD_DOH_08_WRITE_ROWS.map((r) => ({
        ordinal: r.ordinal,
        line: Number(r.sourceRef.slice(1)),
        control: r.control,
      })),
    ).toEqual(derived.map((r) => ({ ordinal: r.ordinal, line: r.line, control: r.action })))
  })

  it('names a role whose own cell on that row is permissive', () => {
    // The recorded holder is checked against the SOURCE cell, in the column
    // §19.10 puts it in, so a holder copied from the wrong row goes red.
    const COLUMN: Readonly<Record<string, number>> = {
      TENANT_ADMIN: 0,
      SUPERVISOR: 1,
      QUALITY_MANAGER: 2,
      READONLY_AUDITOR: 3,
      WORKER: 4,
    }
    for (const row of MOD_DOH_08_WRITE_ROWS) {
      const cells = tableCells(sourceLine(Number(row.sourceRef.slice(1)))).slice(1)
      const column = COLUMN[row.heldBy]
      expect(column, `${row.control}: unknown column ${row.heldBy}`).toBeDefined()
      expect(cells[column!], `${row.control} / ${row.heldBy}`).toContain('Allowed')
    }
  })

  it('drops the two adjacent rows, which are writes on the Client Command Center', () => {
    // Both carry a permissive cell and neither is this surface's, which is
    // why permissiveness alone is not the rule.
    expect([...adjacentLines].sort()).toEqual([28_304, 28_307])
    for (const line of adjacentLines) {
      const cells = tableCells(sourceLine(line)).slice(1)
      expect(cells.some((c) => c.includes('Allowed')), `L${line}`).toBe(true)
      expect(derived.some((r) => r.line === line), `L${line} counted as a Hub write`).toBe(false)
    }
  })

  it('gives a Hub command to exactly two of the five, and they are the pair the old count named', () => {
    const withCommands = MOD_DOH_08_WRITE_ROWS.filter((r) => r.command !== null)
    expect(withCommands.map((r) => r.ordinal)).toEqual([6, 10])
    for (const row of withCommands) {
      const spec = HUB_COMMAND_SPECS[row.command as keyof typeof HUB_COMMAND_SPECS]
      expect(spec, `${row.command} is not a Hub command`).toBeDefined()
      expect(spec.fallbackPatternId, row.command!).toBe('FB-DOH-WRITE-002')
    }
  })

  it('is the only one of the four cards that names no write pattern, which is the whole argument', () => {
    // Read off the four identity cards rather than restated. If a later
    // reading of L28294 finds a write pattern after all, the constant above
    // stops being justified and this goes red.
    const WRITE_PATTERN = 'FB-DOH-WRITE-002'
    for (const card of [27_688, 27_903, 28_113]) {
      expect(sourceLine(card), `L${card}`).toContain(WRITE_PATTERN)
    }
    expect(sourceLine(28_294)).not.toContain(WRITE_PATTERN)
    expect(sourceLine(28_294)).toContain('FB-DOH-COMPUTE-006')
  })
})

/* ==================================================================== *
 * 2. JOB OWNER IS A FIELD, NOT A ROLE
 * ==================================================================== */

describe('Job Owner is a field on the Job record, not a role', () => {
  it('leaves the tenant role model at the five roles the source fixes', () => {
    // Derived from L16282's own sentence rather than from ROLES.
    expect(sourceLine(16282)).toContain('There are five fixed roles at V1')
    expect(sourceLine(16282)).toContain('Job Owner is a field on the Job record, not a role')

    expect(rolesInDomain('TENANT')).toHaveLength(5)
    // The escalation, stated as the thing that must not exist: no role id,
    // anywhere in either security domain, is an ownership role.
    expect(ROLES.map((r) => r.id).filter((id) => /OWNER/.test(id))).toEqual([])
  })

  it('cannot be asked as a role question: the verdict requires a Job', () => {
    // A role check has the shape (identityId) => answer. The predicate takes
    // two arguments and the first is the Job, so there is no call that omits
    // it. `job-owner.ts` carries the compile-time half of this as an
    // `Extract<typeof jobOwnerVerdict, RoleShaped>` assertion; this is its
    // runtime shadow, which survives a `// @ts-expect-error`.
    expect(jobOwnerVerdict).toHaveLength(2)
  })

  it('answers per Job, so one identity is never “a Job Owner” in general', () => {
    // Sam owns JOB and does not own PAIRED_JOB. If the answer were role-shaped
    // these two would agree.
    expect(jobOwnerVerdict(JOB, SAM).held).toBe(true)
    expect(jobOwnerVerdict(PAIRED_JOB, SAM).held).toBe(false)
    expect(jobOwnerVerdict(PAIRED_JOB, PRIYA).held).toBe(true)
    // Every verdict names the Job it was read from, so it cannot be cached
    // against an identity alone.
    expect(jobOwnerVerdict(PAIRED_JOB, SAM).jobId).toBe(PAIRED_JOB.jobId)
  })

  it('gates exactly the three rows the source conditions on the owner field', () => {
    const rows = JOB_OWNER_GATED_ROWS.map((r) => ({ line: r.sourceLine, action: r.action }))
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      // The action column of the cited row, read from the source.
      const cells = tableCells(sourceLine(Number(row.line.slice(1))))
      expect(cells[0]).toBe(row.action)
    }
    // Two modules, three rows — the property the shared predicate exists for.
    expect(new Set(JOB_OWNER_GATED_ROWS.map((r) => r.module)).size).toBe(2)
  })
})

/* ==================================================================== *
 * 3. THE MOD-DOH-16 CONTRADICTION, DISCLOSED RATHER THAN AVERAGED
 * ==================================================================== */

describe('MOD-DOH-16 rows 4 and 5 on the Tenant Admin', () => {
  it('reproduces both cells verbatim from L29616 and L29617', () => {
    const receive = tableCells(sourceLine(29616))
    const act = tableCells(sourceLine(29617))

    expect(receive[0]).toBe('Receive the review flag')
    expect(act[0]).toBe('Act on the review flag')

    // The Tenant Admin column is cell index 1 in both rows.
    const [receiveReading, actReading] = MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.readings
    expect(receiveReading.cell).toBe(receive[1])
    expect(actReading.cell).toBe(act[1])

    // And the contradiction is real rather than asserted: row 4 answers the
    // Tenant Admin `Not applicable` while row 5 answers `Allowed with
    // conditions` on a condition that presumes the same person can hold it.
    expect(receive[1]).toContain('Not applicable')
    expect(act[1]).toContain('Allowed with conditions')
    expect(act[1]).toContain("the Tenant Admin is the paired Job's Owner")
  })

  it('is column-specific: rows 4 and 5 use the SAME conditional form for the other two roles', () => {
    // This is why row 4's Tenant Admin cell is the outlier rather than the
    // rule, and it is checked against the source, not against the code.
    const receive = tableCells(sourceLine(29616))
    expect(receive[2]).toContain("where the Supervisor is the paired Job's Owner")
    expect(receive[3]).toContain("where the Quality Manager is the paired Job's Owner")
  })

  it('discloses both readings to a Tenant Admin instead of picking one', () => {
    const result = jobOwnerGate(
      'mod-doh-16-row-4-receive-the-review-flag',
      'TENANT_ADMIN',
      PAIRED_JOB,
      PRIYA,
    )
    expect(result.kind).toBe('disclosed')
    if (result.kind !== 'disclosed') throw new Error('unreachable')
    expect(result.contradiction.readings).toHaveLength(2)
    expect(result.contradiction.readings.map((r) => r.sourceLine)).toEqual(['L29616', 'L29617'])
    // Row 5 discloses too — a contradiction shown on one of two contradicting
    // rows is half a disclosure.
    expect(
      jobOwnerGate('mod-doh-16-row-5-act-on-the-review-flag', 'TENANT_ADMIN', PAIRED_JOB, PRIYA)
        .kind,
    ).toBe('disclosed')
  })

  it('holds no field an average could be written into', () => {
    // The structural half of "disclosed rather than averaged": there is
    // nowhere to put a settlement, so a consumer that wants one answer has
    // to choose in its own file where a reviewer can see it.
    const keys = Object.keys(MOD_DOH_16_TENANT_ADMIN_CONTRADICTION)
    for (const forbidden of ['adopted', 'resolution', 'winner', 'effective', 'settled']) {
      expect(keys).not.toContain(forbidden)
    }
    // And the `disclosed` result carries no single cell to render.
    const result = jobOwnerGate(
      'mod-doh-16-row-5-act-on-the-review-flag',
      'TENANT_ADMIN',
      PAIRED_JOB,
      PRIYA,
    )
    expect(Object.keys(result)).not.toContain('cell')
  })

  it('does not leak the contradiction onto the other four columns or the other module', () => {
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'] as const) {
      expect(
        jobOwnerGate('mod-doh-16-row-4-receive-the-review-flag', role, PAIRED_JOB, PRIYA).kind,
      ).toBe('settled')
    }
    // MOD-DOH-05 row 10 conditions on the owner field too, but its five cells
    // do not contradict each other, so it is settled for every role —
    // including the Tenant Admin.
    for (const role of ROLES.filter((r) => r.domain === 'TENANT')) {
      expect(
        jobOwnerGate(
          'mod-doh-05-row-10-decide-a-notified-class-version-adoption',
          role.id,
          JOB,
          SAM,
        ).kind,
      ).toBe('settled')
    }
  })

  it('still reads the owner field on a disclosed row', () => {
    // Disclosure is about which CELL applies. It never suppresses the
    // predicate, or a Tenant Admin who genuinely owns the paired Job would
    // lose the answer along with the ambiguity.
    const owner = jobOwnerGate(
      'mod-doh-16-row-5-act-on-the-review-flag',
      'TENANT_ADMIN',
      PAIRED_JOB,
      PRIYA,
    )
    const stranger = jobOwnerGate(
      'mod-doh-16-row-5-act-on-the-review-flag',
      'TENANT_ADMIN',
      PAIRED_JOB,
      ELENA,
    )
    expect(owner.verdict.held).toBe(true)
    expect(stranger.verdict.held).toBe(false)
  })
})

/* ==================================================================== *
 * 4. THE COMMAND FAMILY
 * ==================================================================== */

describe('the Hub Job / Run / Assignment / Summary command classes', () => {
  it('narrows every member and no legacy member', () => {
    for (const type of HUB_COMMAND_TYPES) {
      expect(isHubCommand({ type } as ScenarioCommand)).toBe(true)
    }
    for (const type of [
      'CC_RELEASE_LOT_HOLD',
      'PLATFORM_SET_FEATURE_CONTROL',
      'TENANT_SET_DESIRED_FEATURE',
    ] as const) {
      expect(isHubCommand({ type } as ScenarioCommand)).toBe(false)
    }
  })

  it('carries a spec for every member and no spec for a member that does not exist', () => {
    expect(Object.keys(HUB_COMMAND_SPECS).sort()).toEqual([...HUB_COMMAND_TYPES].sort())
  })

  it('reads its fallback narrative from §19.2 rather than paraphrasing it', () => {
    for (const type of HUB_COMMAND_TYPES) {
      const spec = HUB_COMMAND_SPECS[type]
      const pattern = fallbackPattern(spec.fallbackPatternId)
      expect(spec.firstFallback).toBe(pattern.firstFallback)
      expect(spec.terminalSafeState).toBe(pattern.terminalSafeState)
      expect(spec.fallbackFailure).toBe(pattern.fallbackFailure)
    }
  })

  it('classes every Hub act as durable, so none proceeds on broken storage', () => {
    // §19.2 / MOD-DOH-17: "an action that cannot be audited does not happen."
    const safe = ['navigate', 'readFixture', 'presentation', 'failurePreview', 'sandboxDemo']
    for (const type of HUB_COMMAND_TYPES) {
      expect(safe).not.toContain(HUB_COMMAND_SPECS[type].actionClass)
    }
  })
})

/* ==================================================================== *
 * 5. THE PREDICATE THROUGH THE KERNEL
 * ==================================================================== */

const adoptionBy = (jobId: string): HubCommand => ({
  type: 'DOH_DECIDE_VERSION_ADOPTION',
  tenant: BRIGHT,
  jobId,
  versionNumber: '2.1.0',
  choice: 'adopt',
})

describe('MOD-DOH-05 row 10 through the kernel', () => {
  it('admits the identity the Job’s owner field names', async () => {
    const t = await reduce(baseState(), adoptionBy(JOB.jobId), context('SUPERVISOR', SAM))
    expect(t.status).toBe('accepted')
  })

  it('refuses the same act to the same role on a Job they do not own', async () => {
    const t = await reduce(baseState(), adoptionBy(PAIRED_JOB.jobId), context('SUPERVISOR', SAM))
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('ROLE_NOT_GRANTED')
  })

  it('cannot be satisfied by changing role, which is what a sixth role would have allowed', async () => {
    // The escalation, stated as a test: if Job Owner were a role, some role
    // would work here. None does — the owner field on PAIRED_JOB names PRIYA
    // and the actor is SAM, whatever hat SAM is wearing.
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      const t = await reduce(baseState(), adoptionBy(PAIRED_JOB.jobId), context(role, SAM))
      expect(t.status, `${role} was admitted on a Job it does not own`).toBe('denied')
    }
    // And the owner is admitted under each of the three roles the row
    // conditions, because the field routes the act and the role does not.
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      const t = await reduce(baseState(), adoptionBy(PAIRED_JOB.jobId), context(role, PRIYA))
      expect(t.status, `${role} was refused on a Job it owns`).toBe('accepted')
    }
  })

  it('refuses the two roles the row prohibits outright, owner field or not', async () => {
    for (const role of ['READONLY_AUDITOR', 'WORKER'] as const) {
      const t = await reduce(baseState(), adoptionBy(JOB.jobId), context(role, SAM))
      expect(t.status).toBe('denied')
      // EXPLICIT_DENY, not ROLE_NOT_GRANTED: the source prohibits these two
      // rather than merely omitting them, and the two audit differently.
      expect(t.decision.reasonCode).toBe('EXPLICIT_DENY')
    }
  })

  it('fails closed when the Job cannot be read at all', async () => {
    const t = await reduce(baseState(), adoptionBy('JOB-DOES-NOT-EXIST'), context('SUPERVISOR', SAM))
    expect(t.status).toBe('denied')
  })
})

/* ==================================================================== *
 * 6. THE OBJECT MODEL'S LOAD-BEARING ABSENCES
 * ==================================================================== */

describe('the Job / Run / Assignment / Summary records', () => {
  it('moves the owner field on reassignment and leaves the maker alone', () => {
    // L27652: the field is reassignable. §4.5.2: the creator can never
    // approve. If reassignment moved `createdBy` too, a creator could hand
    // the Job away and approve it back — segregation of duties laundered
    // through a field that "confers no permissions".
    const next = applyHubCommand(baseState(), {
      type: 'DOH_REASSIGN_JOB_OWNER',
      tenant: BRIGHT,
      jobId: JOB.jobId,
      newOwnerId: ELENA,
    })
    const job = readJob(next, BRIGHT, JOB.jobId)
    expect(job?.ownerId).toBe(ELENA)
    expect(job?.createdBy).toBe(SAM)
    // And the predicate follows the field, immediately.
    expect(jobOwnerVerdict(job as JobRecord, ELENA).held).toBe(true)
    expect(jobOwnerVerdict(job as JobRecord, SAM).held).toBe(false)
  })

  it('appends corrections and never rewrites one', () => {
    // §4.7.4: "the original stays immutable".
    const once = applyHubCommand(baseState(), {
      type: 'DOH_ANNOTATE_SUMMARY',
      tenant: BRIGHT,
      summaryId: SUMMARY.summaryId,
      annotationId: 'ANN-2',
      text: 'Late reading accepted inside the finish window.',
    })
    const twice = applyHubCommand(once, {
      type: 'DOH_ANNOTATE_SUMMARY',
      tenant: BRIGHT,
      summaryId: SUMMARY.summaryId,
      annotationId: 'ANN-3',
      text: 'Second correction.',
    })
    const summary = readSummary(twice, BRIGHT, SUMMARY.summaryId)
    expect(summary?.annotations.map((a) => a.annotationId)).toEqual(['ANN-1', 'ANN-2', 'ANN-3'])
    expect(summary?.annotations[0]).toEqual(SUMMARY.annotations[0])
  })

  it('keeps pre-substitution attribution and re-uses the immutable package pin', () => {
    // §4.6.7: "Pre-substitution steps remain attributed to the original
    // worker." §4.6.1: the pin is immutable for the life of the run, so a
    // substitution cannot re-pin it.
    const next = applyHubCommand(baseState(), {
      type: 'DOH_SUBSTITUTE_WORKER',
      tenant: BRIGHT,
      assignmentId: ASSIGNMENT.assignmentId,
      runId: ASSIGNMENT.runId,
      outgoingWorkerId: ASSIGNMENT.workerId,
      incomingWorkerId: 'WORKER-JOSE',
      reason: 'Called away to a Line B breakdown.',
    })
    const objects = tenantPartition(next, BRIGHT)?.objects ?? {}
    const outgoing = objects[objectKey.assignment(ASSIGNMENT.assignmentId)] as AssignmentRecord
    expect(outgoing.workerId).toBe('WORKER-MAYA')
    expect(outgoing.supersededBy).not.toBe(null)
    const incoming = objects[objectKey.assignment(outgoing.supersededBy ?? '')] as AssignmentRecord
    expect(incoming.workerId).toBe('WORKER-JOSE')
    expect(incoming.packageRef).toBe(ASSIGNMENT.packageRef)
  })

  it('resolves an anomaly with its closure note and leaves the others open', () => {
    const next = applyHubCommand(baseState(), {
      type: 'DOH_RESOLVE_ANOMALY',
      tenant: BRIGHT,
      summaryId: SUMMARY.summaryId,
      anomalyId: 'ANOM-1',
      closureNote: 'Lot quarantined and the fixture re-zeroed.',
    })
    const anomaly = readSummary(next, BRIGHT, SUMMARY.summaryId)?.anomalies[0]
    expect(anomaly?.state).toBe('Resolved')
    expect(anomaly?.closureNote).toBe('Lot quarantined and the fixture re-zeroed.')
  })

  it('refuses an anomaly resolution with no closure note', async () => {
    // §4.7.3: "Resolution requires a brief closure note ... because auditors
    // require evidence of resolution, not just of detection."
    const t = await reduce(
      baseState(),
      {
        type: 'DOH_RESOLVE_ANOMALY',
        tenant: BRIGHT,
        summaryId: SUMMARY.summaryId,
        anomalyId: 'ANOM-1',
        closureNote: '   ',
      },
      context('QUALITY_MANAGER', ELENA),
    )
    // `validationFailed`, not `denied`: an authorised Quality Manager who
    // left the note blank has a field problem, not a permission problem, and
    // this build renders the two differently. Asserting `denied` here would
    // have passed only if the refusal had been mis-categorised.
    expect(t.status).toBe('validationFailed')
  })

  it('refuses to approve a Job the same identity created', async () => {
    // The EXISTING maker-checker mechanism, consumed rather than rebuilt.
    const drafted = applyHubCommand(baseState(), {
      type: 'DOH_SUBMIT_JOB_FOR_APPROVAL',
      tenant: BRIGHT,
      jobId: JOB.jobId,
    })
    const approve: HubCommand = {
      type: 'DOH_APPROVE_JOB',
      tenant: BRIGHT,
      jobId: JOB.jobId,
      createdBy: SAM,
    }
    const bySam = await reduce(drafted, approve, context('QUALITY_MANAGER', SAM))
    expect(bySam.status).toBe('denied')
    const byElena = await reduce(drafted, approve, context('QUALITY_MANAGER', ELENA))
    expect(byElena.status).toBe('accepted')
  })

  it('refuses to approve a Job that was never submitted', async () => {
    // The Job in `baseState()` is already `active`, so the object-state stage
    // must refuse regardless of who is asking.
    const t = await reduce(
      baseState(),
      { type: 'DOH_APPROVE_JOB', tenant: BRIGHT, jobId: JOB.jobId, createdBy: SAM },
      context('QUALITY_MANAGER', ELENA),
    )
    expect(t.status).toBe('denied')
  })
})

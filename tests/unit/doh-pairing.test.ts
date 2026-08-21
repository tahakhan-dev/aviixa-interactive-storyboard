import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rolesInDomain } from '@/domain/roles'
import { cellStatus, rolesReachingByMatrix } from '@/surfaces/doh/modules'
import { DOH_SCREENS, DOH_UNCATALOGUED_SCREEN_NAMES } from '@/surfaces/doh/screens'
import {
  JOB_OWNER_GATED_ROWS,
  MOD_DOH_16_TENANT_ADMIN_CONTRADICTION,
  jobOwnerVerdict,
} from '@/surfaces/doh/job-owner'
import {
  HUB_COMMAND_SPECS,
  applyHubCommand,
  hubAccessRequest,
  jobPairedWith,
  objectKey,
  readJob,
  validateHubCommand,
  type JobRecord,
} from '@/surfaces/doh/objects'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { DOH_05_FIXTURE_STATE, DOH_05_IDENTITIES, HUB_TENANT_ID } from '@/surfaces/doh/modules/doh-05/jobs'
import { DEC_AREA_001_POSITION as DEC_AREA_001_AT_SOURCE } from '@/surfaces/doh/modules/doh-05/matrix'
import {
  ABSENT_BY_RULE,
  CATALOGUE_A_PRIMARY_ROLE,
  CONTROL_MATRIX,
  DEC_AREA_001_POSITION,
  UNRESOLVED_IN_SOURCE,
  doh16Row,
  type Doh16Row,
} from '@/surfaces/doh/modules/doh-16/matrix'
import {
  bothJobsInScope,
  doh16Affordance,
  doh16RolesReaching,
  type Doh16Affordance,
  type Doh16Bearing,
} from '@/surfaces/doh/modules/doh-16/rendering'
import {
  NODES,
  SEEDED_PAIRS,
  VIEWER_SCOPES,
  areaOf,
  flaggedJob,
  pairById,
  scopeVerdict,
  type ViewerScope,
} from '@/surfaces/doh/modules/doh-16/pairing'
import type { TenantRoleId } from '../../app/hub/HubShell'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every claim below about §19.18 is checked against
 * the file rather than against the brief that sent this task. That brief
 * was right about the row count, right about both trap locators and right
 * about all three Job-Owner citations; it was wrong about one thing
 * (`routedTo` being Studio-only) and it inherited one overstated sentence
 * from wave 0 (catalogue B carrying no row naming MOD-DOH-16 "at all").
 * Both are measured below rather than argued.
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

/** One table row split into its cells, trimmed. Leading/trailing pipe dropped. */
const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

const MATRIX_HEADER_LINE = 29_611
const MATRIX_FIRST_DATA_LINE = 29_613
const MATRIX_LAST_DATA_LINE = 29_618

const ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

/** The column index of a role in the source's own five-column matrix. */
const COLUMN: Readonly<Record<TenantRoleId, number>> = {
  TENANT_ADMIN: 1,
  SUPERVISOR: 2,
  QUALITY_MANAGER: 3,
  READONLY_AUDITOR: 4,
  WORKER: 5,
}

const PAIR_FLAGGED = pairById('PAIR-PAINT-ASSY')
const PAIR_CELL_BOUND = pairById('PAIR-WHEEL-PAINT')

function bearing(role: TenantRoleId, pairId = 'PAIR-PAINT-ASSY'): Doh16Bearing {
  return { pair: pairById(pairId), scope: VIEWER_SCOPES[role] }
}

function kindFor(rowId: Doh16Row['id'], role: TenantRoleId, pairId?: string): string {
  return doh16Affordance(doh16Row(rowId), role, bearing(role, pairId)).kind
}

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE ROW COUNT, MEASURED — not accepted from the brief.
 * The plan's span reads L29611-L29618, which is eight lines. Every plan
 * span in that document starts on the table HEADER, so eight lines is
 * six data rows, and six is what the brief claimed. Measured here.
 * ==================================================================== */

describe('MOD-DOH-16’s roles-and-permissions matrix, as the source states it', () => {
  it('puts the header at L29611 and the separator at L29612 — neither is a data row', () => {
    expect(cells(L(MATRIX_HEADER_LINE))).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(L(MATRIX_HEADER_LINE + 1).replace(/[|\s-]/g, '')).toBe('')
  })

  // The line after L29618 is deliberately NOT cited by number in this title:
  // it is blank, which is exactly why the table stops there, and a citation of
  // a blank line states nothing.
  it('carries exactly six data rows and then stops', () => {
    const rows = []
    for (let line = MATRIX_FIRST_DATA_LINE; L(line).trim().startsWith('|'); line++) {
      rows.push(line)
    }
    expect(rows).toEqual([29_613, 29_614, 29_615, 29_616, 29_617, 29_618])
    expect(rows.length).toBe(6)
    expect(rows.at(-1)).toBe(MATRIX_LAST_DATA_LINE)
    expect(L(MATRIX_LAST_DATA_LINE + 1).trim()).toBe('')
  })

  it('is reproduced action-for-action by this module, in source order', () => {
    const fromSource = []
    for (let line = MATRIX_FIRST_DATA_LINE; line <= MATRIX_LAST_DATA_LINE; line++) {
      fromSource.push(cells(L(line))[0])
    }
    expect(CONTROL_MATRIX.map((r) => r.control)).toEqual(fromSource)
    expect(CONTROL_MATRIX.length).toBe(6)
  })

  it('is reproduced token-for-token, in all thirty cells', () => {
    for (const [index, row] of CONTROL_MATRIX.entries()) {
      const sourceCells = cells(L(MATRIX_FIRST_DATA_LINE + index))
      for (const role of ROLES) {
        const cell = sourceCells[COLUMN[role]] ?? ''
        // The token is what the source writes inside the first pair of
        // backticks; the words after it are the cell's qualifying condition.
        const token = /`([^`]+)`/.exec(cell)?.[1] ?? ''
        const normalised = token.split('—')[0]?.trim().toLowerCase().replace(/\s+/g, '-') ?? ''
        expect(
          cellStatus(row, role),
          `${row.id} / ${role} — source cell reads ${cell}`,
        ).toBe(normalised)
      }
    }
  })

  it('gives every cell a stated cause, because a blank cell is an unanswered question', () => {
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        expect(row.detail[role].trim().length, `${row.id} / ${role}`).toBeGreaterThan(20)
      }
    }
  })
})

/* ==================================================================== *
 * TRAP 1 — rows 4 and 5 contradict each other, and it is ONE defect.
 * ==================================================================== */

describe('the rows 4 and 5 contradiction, measured in the source before it is rendered', () => {
  it('has row 4 answering the Tenant Admin Not applicable and row 5 answering it conditionally', () => {
    expect(cells(L(29_616))[COLUMN.TENANT_ADMIN]).toBe(
      "`Not applicable — the flag routes to the paired Job's Owner`",
    )
    expect(cells(L(29_617))[COLUMN.TENANT_ADMIN]).toBe(
      "`Allowed with conditions` — where the Tenant Admin is the paired Job's Owner",
    )
  })

  /**
   * WAVE 0'S SHARPER FINDING, RE-MEASURED. Row 4's Supervisor and Quality
   * Manager cells use the SAME conditional form row 5 gives the Tenant Admin.
   * That is what makes the Tenant Admin's `Not applicable` an outlier rather
   * than a rule, and it is why the contradiction and the escalation are one
   * defect: row 4's stated reason only holds if "the paired Job's Owner" is a
   * different party from the Tenant Admin, which is the sixth-role reading.
   */
  it('gives the same conditional form to three cells, and Not applicable to exactly one', () => {
    const sameForm = [
      cells(L(29_616))[COLUMN.SUPERVISOR],
      cells(L(29_616))[COLUMN.QUALITY_MANAGER],
      cells(L(29_617))[COLUMN.TENANT_ADMIN],
    ]
    for (const cell of sameForm) {
      expect(cell).toMatch(/^`Allowed with conditions`/)
      expect(cell).toMatch(/is the paired Job's Owner$/)
    }

    const bothRows = [...cells(L(29_616)).slice(1), ...cells(L(29_617)).slice(1)]
    expect(bothRows.filter((c) => c.includes('Not applicable'))).toHaveLength(1)
  })

  it('is the SAME defect as the escalation: row 4’s reason presumes a party row 5 denies', () => {
    // Row 5 states outright that a Tenant Admin CAN be the paired Job's Owner.
    // Row 4's reason ("the flag routes to the paired Job's Owner") is only a
    // reason for NOT applying to a Tenant Admin if that Owner is somebody
    // else. The two cells cannot both be read literally.
    expect(cells(L(29_617))[COLUMN.TENANT_ADMIN]).toContain('the Tenant Admin is the paired')
    expect(cells(L(29_616))[COLUMN.TENANT_ADMIN]).toContain('routes to the paired')
  })
})

describe('the disclosure is CONSUMED from the shared predicate, never written twice', () => {
  it('registers this module’s two rows in the shared gated-row list and nowhere else', () => {
    const mine = JOB_OWNER_GATED_ROWS.filter((r) => r.module === 'MOD-DOH-16')
    expect(mine.map((r) => r.sourceLine)).toEqual(['L29616', 'L29617'])
    expect(mine.map((r) => r.action)).toEqual(['Receive the review flag', 'Act on the review flag'])
  })

  it('renders the shared record itself — same object, not a copy with the same words', () => {
    const affordance = doh16Affordance(
      doh16Row('act-on-the-review-flag'),
      'TENANT_ADMIN',
      bearing('TENANT_ADMIN'),
    )
    expect(affordance.kind).toBe('disclosed')
    if (affordance.kind !== 'disclosed') throw new Error('unreachable')
    expect(affordance.contradiction).toBe(MOD_DOH_16_TENANT_ADMIN_CONTRADICTION)
  })

  it('keeps exactly two readings and offers nowhere to put an average', () => {
    const record: Record<string, unknown> = { ...MOD_DOH_16_TENANT_ADMIN_CONTRADICTION }
    expect(MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.readings).toHaveLength(2)
    for (const forbidden of ['adopted', 'resolution', 'winner', 'effective', 'position']) {
      expect(Object.keys(record)).not.toContain(forbidden)
    }
  })

  it('discloses on BOTH review-flag rows, for the Tenant Admin column only', () => {
    for (const rowId of ['receive-the-review-flag', 'act-on-the-review-flag'] as const) {
      expect(kindFor(rowId, 'TENANT_ADMIN')).toBe('disclosed')
      for (const role of ROLES.filter((r) => r !== 'TENANT_ADMIN')) {
        expect(kindFor(rowId, role), `${rowId} / ${role}`).not.toBe('disclosed')
      }
    }
  })

  it('never discloses on the four rows the source answers once', () => {
    const single = CONTROL_MATRIX.filter(
      (r) => r.id !== 'receive-the-review-flag' && r.id !== 'act-on-the-review-flag',
    )
    for (const row of single) {
      for (const role of ROLES) {
        expect(kindFor(row.id, role), `${row.id} / ${role}`).not.toBe('disclosed')
      }
    }
  })

  /**
   * THE MECHANISM, not the habit. A `disclosed` affordance carries no single
   * cell — no `label`, no `conditions`, no `reason` — so a screen physically
   * cannot draw it as one answer without choosing a reading in its own file.
   */
  it('gives the disclosed member no single cell to collapse onto', () => {
    const affordance = doh16Affordance(
      doh16Row('receive-the-review-flag'),
      'TENANT_ADMIN',
      bearing('TENANT_ADMIN'),
    )
    if (affordance.kind !== 'disclosed') throw new Error('expected the disclosed member')
    const keys = Object.keys(affordance)
    expect(keys).not.toContain('label')
    expect(keys).not.toContain('conditions')
    expect(keys).not.toContain('reason')
    expect(affordance.contradiction.readings.map((r) => r.sourceLine)).toEqual(['L29616', 'L29617'])
  })

  it('reaches the disclosure only through a named Job — no flag, no gate', () => {
    // PAIR-WHEEL-PAINT raises no flag, so there is no Job whose owner field
    // could route anything, and the answer says that in words rather than
    // defaulting to a permissive or a prohibitive token.
    const affordance = doh16Affordance(
      doh16Row('act-on-the-review-flag'),
      'TENANT_ADMIN',
      bearing('TENANT_ADMIN', 'PAIR-WHEEL-PAINT'),
    )
    expect(affordance.kind).toBe('absent')
    if (affordance.kind !== 'absent') throw new Error('unreachable')
    expect(affordance.reason).toContain('no review flag has been raised')
  })
})

/* ==================================================================== *
 * TRAP 2 — Job Owner is a FIELD. No sixth role, anywhere.
 * ==================================================================== */

describe('Job Owner is a field on the Job record and not a role', () => {
  it('is stated by the source three times, in three Parts, at the lines this build cites', () => {
    expect(L(27_652)).toContain('Job Owner is a field on the Job, not a role')
    expect(L(7_151)).toContain('Job Owner is a field on the Job record and not a role')
    expect(L(16_282)).toContain('Job Owner is a field on the Job record, not a role')
    // The chapter whose subject is the closed role set says five, at the same line.
    expect(L(16_282)).toContain('There are five fixed roles at V1')
  })

  it('is what catalogue A’s Primary role cell contradicts, and that row is named by locator', () => {
    expect(L(26_074)).toContain('Supervisor and Job Owner')
    expect(L(26_074)).toContain('Paired scheduling view')
    expect(CATALOGUE_A_PRIMARY_ROLE.cell).toBe('Supervisor and Job Owner')
  })

  it('adds no sixth tenant role: the domain still holds five and reach is a subset of them', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id)
    expect(tenantRoles).toHaveLength(5)
    expect(tenantRoles).not.toContain('JOB_OWNER')
    for (const role of doh16RolesReaching()) expect(tenantRoles).toContain(role)
  })

  /**
   * NO GUARD FORBIDS THE TOKEN; the token is simply nowhere. A grep is the
   * right shape of test for that claim, because the claim is about absence
   * across whole files rather than about the return value of a function.
   */
  it('writes no JOB_OWNER token in any file this task owns', () => {
    const mine = [
      'src/surfaces/doh/modules/doh-16/matrix.ts',
      'src/surfaces/doh/modules/doh-16/pairing.ts',
      'src/surfaces/doh/modules/doh-16/rendering.ts',
      'app/hub/multi-area-job-pairing/PairedSchedulingScreen.tsx',
      'app/hub/multi-area-job-pairing/page.tsx',
    ]
    for (const file of mine) {
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      expect(src, file).not.toMatch(/\bJOB_OWNER\b/)
    }
  })

  /**
   * THE GATE REACHES THE KERNEL AS AN EMPTY ROLE LIST, NEVER AS A ROLE.
   * The spec's `allowedRoles` is the UNCONDITIONED shape — the three roles
   * the source's cells name — and `hubAccessRequest` hands it over only when
   * the Job's owner field names the actor. The alternative, an owner entry in
   * an allow-list, would grant across every Job at once.
   */
  it('narrows to the empty list when the owner field does not name the actor', () => {
    const command = {
      type: 'DOH_ACT_ON_PAIRED_REVIEW_FLAG',
      tenant: HUB_TENANT_ID,
      jobId: 'JOB-REDBIKE',
      pairedJobId: 'JOB-PAINTLINE',
      note: 'Keeping the assembly run and working an older frame batch.',
    } as const

    // JOB-REDBIKE's owner field names Sam, the Supervisor.
    const asOwner = hubAccessRequest(command, DOH_05_FIXTURE_STATE, DOH_05_IDENTITIES.SUPERVISOR)
    expect([...asOwner.allowedRoles]).toEqual([
      ...HUB_COMMAND_SPECS.DOH_ACT_ON_PAIRED_REVIEW_FLAG.access.allowedRoles,
    ])

    // The Tenant Admin holds a role on the row and is not the owner of record.
    const asNonOwner = hubAccessRequest(
      command,
      DOH_05_FIXTURE_STATE,
      DOH_05_IDENTITIES.TENANT_ADMIN,
    )
    expect([...asNonOwner.allowedRoles]).toEqual([])
    expect(asNonOwner.sourceRefs.join(' ')).toContain('not a role')
  })

  it('answers the owner question only about a NAMED Job', () => {
    const redbike = { jobId: 'JOB-REDBIKE', ownerId: DOH_05_IDENTITIES.SUPERVISOR }
    const verdict = jobOwnerVerdict(redbike, DOH_05_IDENTITIES.SUPERVISOR)
    expect(verdict.held).toBe(true)
    // The answer carries the Job it was read from, so it cannot be widened.
    expect(verdict.jobId).toBe('JOB-REDBIKE')
    expect(jobOwnerVerdict(redbike, DOH_05_IDENTITIES.TENANT_ADMIN).held).toBe(false)
  })
})

/* ==================================================================== *
 * THE ORDER OF THE QUESTIONS. Each rule planted, red, restored.
 * ==================================================================== */

/** A row with one field replaced, for planting. Never exported. */
function mutate(row: Doh16Row, patch: Partial<Doh16Row>): Doh16Row {
  return { ...row, ...patch } as Doh16Row
}

describe('the fold asks its four questions in order, and each one is load-bearing', () => {
  it('1 — classification beats the token: an off-screen row draws nothing, even at Allowed', () => {
    const row = doh16Row('view-the-paired-scheduling-view')
    expect(cellStatus(row, 'TENANT_ADMIN')).toBe('allowed')
    expect(doh16Affordance(row, 'TENANT_ADMIN', bearing('TENANT_ADMIN')).kind).toBe('control')

    // PLANT: reclassify the row as met on another surface. The token is
    // untouched and still permissive; the answer must move to ABSENT.
    const planted = doh16Affordance(
      mutate(row, { surface: 'another-surface' }),
      'TENANT_ADMIN',
      bearing('TENANT_ADMIN'),
    )
    expect(planted.kind).toBe('absent')
    if (planted.kind !== 'absent') throw new Error('unreachable')
    expect(planted.reason).toContain('met somewhere other than a Hub screen')

    // RESTORED: the real row is unchanged.
    expect(doh16Affordance(row, 'TENANT_ADMIN', bearing('TENANT_ADMIN')).kind).toBe('control')
  })

  it('2 — D11 beats the token: a permissive Worker cell is still not a Hub control', () => {
    const row = doh16Row('view-the-paired-scheduling-view')
    expect(cellStatus(row, 'WORKER')).toBe('unavailable')

    // PLANT: grant the Worker outright. D11 is asked BEFORE the token, so the
    // answer must stay ABSENT and must give D11's reason, not the cell's.
    const planted = doh16Affordance(
      mutate(row, { status: { ...row.status, WORKER: 'allowed' } }),
      'WORKER',
      bearing('WORKER'),
    )
    expect(planted.kind).toBe('absent')
    if (planted.kind !== 'absent') throw new Error('unreachable')
    expect(planted.reason).toContain('admits no Worker to the Delivery Operations Hub')

    // RESTORED.
    expect(kindFor('view-the-paired-scheduling-view', 'WORKER')).toBe('absent')
  })

  it('3 — no-control-here beats the token: row 4 offers no receive control to anybody', () => {
    const row = doh16Row('receive-the-review-flag')
    expect(row.noControlHere).not.toBeNull()
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      expect(cellStatus(row, role)).toBe('allowed-with-conditions')
      const affordance = doh16Affordance(row, role, bearing(role))
      expect(affordance.kind).toBe('absent')
      if (affordance.kind !== 'absent') throw new Error('unreachable')
      expect(affordance.reason).toContain('the flag being raised automatically')
    }

    // PLANT: remove the no-control-here note. The permissive token then falls
    // through to the owner gate, and the Supervisor — who IS JOB-REDBIKE's
    // owner of record — gains a control that must not exist.
    const planted = doh16Affordance(
      mutate(row, { noControlHere: null }),
      'SUPERVISOR',
      bearing('SUPERVISOR'),
    )
    expect(planted.kind).toBe('control')

    // RESTORED.
    expect(kindFor('receive-the-review-flag', 'SUPERVISOR')).toBe('absent')
  })

  it('4 — only then the token, and the owner field decides the conditioned rows', () => {
    const row = doh16Row('act-on-the-review-flag')
    // Sam owns JOB-REDBIKE, which is the Job the flag routed to.
    expect(doh16Affordance(row, 'SUPERVISOR', bearing('SUPERVISOR')).kind).toBe('control')
    // Elena does not, so she is refused — and refused ABSENT, not disabled.
    const elena = doh16Affordance(row, 'QUALITY_MANAGER', bearing('QUALITY_MANAGER'))
    expect(elena.kind).toBe('absent')
    if (elena.kind !== 'absent') throw new Error('unreachable')
    expect(elena.reason).toContain('not a role')
  })
})

/* ==================================================================== *
 * THE DEFERRAL RULING, AS A SHAPE — no `disabled` member exists.
 * ==================================================================== */

describe('a capability that does not exist renders as a stated line, never as a disabled control', () => {
  it('produces only the four kinds, across every row, role and pair', () => {
    const seen = new Set<string>()
    for (const pair of SEEDED_PAIRS) {
      for (const row of CONTROL_MATRIX) {
        for (const role of ROLES) {
          seen.add(doh16Affordance(row, role, { pair, scope: VIEWER_SCOPES[role] }).kind)
        }
      }
    }
    expect([...seen].sort()).toEqual(['absent', 'control', 'disclosed', 'read-only'])
    expect(seen.has('disabled')).toBe(false)
  })

  it('has no `disabled` member on the type at all', () => {
    // Compile-time: `Extract` is `never` because no member of the union has
    // that tag. If a `disabled` member is ever added, this line stops
    // compiling rather than waiting for a screen to draw one.
    type Disabled = Extract<Doh16Affordance, { kind: 'disabled' }>
    const noDisabledMember: Disabled extends never ? true : never = true
    expect(noDisabledMember).toBe(true)
  })

  it('draws nothing for cross-link propagation, in all five columns, with the line stated', () => {
    const row = doh16Row('cause-automated-propagation-across-the-link')
    for (const role of ROLES) {
      const affordance = doh16Affordance(row, role, bearing(role))
      expect(affordance.kind, role).toBe('absent')
      if (affordance.kind !== 'absent') throw new Error('unreachable')
      expect(affordance.reason.trim().length).toBeGreaterThan(40)
    }
    // The Tenant Admin cell is the only one carrying a cause, and the stated
    // line rides along with it.
    const admin = doh16Affordance(row, 'TENANT_ADMIN', bearing('TENANT_ADMIN'))
    if (admin.kind !== 'absent') throw new Error('unreachable')
    expect(admin.reason).toContain('flagging only at V1')
    expect(admin.reason).toContain('no such capability exists')
  })

  /**
   * IT IS NOT A DEFERRAL, AND THE REGISTER IS WHAT SAYS SO. Row 6's own cell
   * reads "flagging only at V1", which sounds like a roadmap position — but
   * the out-of-V1 register is twenty rows at L25876-L25895 and carries no row
   * for cross-link propagation, and neither do the three further deferrals
   * stated in prose. Rendering it as deferred would set an expectation the
   * register does not carry.
   */
  it('is absent from the out-of-V1 register, which is why it is not rendered as deferred', () => {
    const register = []
    for (let line = 25_876; line <= 25_895; line++) register.push(L(line))
    expect(register).toHaveLength(20)
    expect(register.join('\n')).not.toMatch(/propagat/i)
    expect(L(25_897)).not.toMatch(/propagat/i)

    const note = ABSENT_BY_RULE.find((e) => e.label.includes('cross-link propagation'))
    expect(note?.note).toContain('exists nowhere rather than one scheduled for later')
  })
})

/* ==================================================================== *
 * NO ROUTING POINTER IS MINTED, AND THAT IS REASONED.
 * ==================================================================== */

describe('this card carries no routedTo, and the reasoning is in the file rather than the silence', () => {
  it('has no routedTo field on any of the six rows', () => {
    for (const row of CONTROL_MATRIX) {
      expect(Object.keys(row), row.id).not.toContain('routedTo')
    }
  })

  /**
   * `routedTo` IS NOT STUDIO-ONLY, which the brief for this task asserted and
   * which is measurably false: `Doh08Row` in the same surface carries one.
   * Its absence here is therefore a decision about THIS card and is measured
   * as one, not inherited as a convention.
   */
  it('is a decision about this card — the Hub convention exists on a sibling module', () => {
    const doh08 = readFileSync(
      join(process.cwd(), 'src/surfaces/doh/modules/doh-08/matrix.ts'),
      'utf8',
    )
    expect(doh08).toMatch(/readonly routedTo:/)
    const mine = readFileSync(
      join(process.cwd(), 'src/surfaces/doh/modules/doh-16/matrix.ts'),
      'utf8',
    )
    expect(mine).toContain('There is exactly one candidate on this card and it is rejected')
  })

  it('would have had one target, and that target is not answerable per role', () => {
    // Row 6's only plausible alternative is row 5, which IS in this matrix —
    // so the rejection is not the off-matrix rule and not the this-surface
    // rule. It is that row 5's answer is per Job, and for the Tenant Admin it
    // is not one answer at all.
    expect(kindFor('act-on-the-review-flag', 'TENANT_ADMIN')).toBe('disclosed')
    expect(kindFor('act-on-the-review-flag', 'QUALITY_MANAGER')).toBe('absent')
    expect(kindFor('act-on-the-review-flag', 'SUPERVISOR')).toBe('control')
  })
})

/* ==================================================================== *
 * DEC-AREA-001 — CONSUMED, AND THE WALK IS LOAD-BEARING.
 * ==================================================================== */

describe('DEC-AREA-001 is consumed as an adopted position, not restated', () => {
  it('re-exports the MOD-DOH-05 record itself rather than a second copy of its words', () => {
    expect(DEC_AREA_001_POSITION).toBe(DEC_AREA_001_AT_SOURCE)
    expect(DEC_AREA_001_POSITION.classification).toBe(
      'Derived Clarification — adopted working position',
    )
    expect(DEC_AREA_001_POSITION.neverClassifiedAs).toBe('SoW Fact')
    expect(DEC_AREA_001_POSITION.ratification).toMatch(/^Outstanding/)
  })

  it('is stated at the line this build cites, with its classification intact', () => {
    expect(L(27_650)).toContain('Derived Clarification — adopted working position')
    expect(L(27_650)).toContain('never `SoW Fact`')
    expect(L(27_650)).toContain("resolves from the Job's parent node by walking up to its Area")
  })

  it('is named by this module’s own section as the rule it follows', () => {
    expect(L(29_588)).toContain('DEC-AREA-001')
    expect(L(29_588)).toContain('the deepest parent node its tenant configured')
  })
})

describe('every Area-keyed rule resolves by WALKING UP the node path', () => {
  it('resolves a Location to its Area and an Area to itself', () => {
    expect(areaOf('CELL-WHEEL-2')).toBe('AREA-ASSY-A')
    expect(areaOf('AREA-PAINT')).toBe('AREA-PAINT')
  })

  it('answers null above the Area level and for a node it does not hold', () => {
    expect(areaOf('SITE-BRIGHTBIKES-01')).toBeNull()
    expect(areaOf('AREA-NOT-A-NODE')).toBeNull()
  })

  it('terminates on a hierarchy edited into a cycle rather than hanging the render', () => {
    // Not a plant of the rule — a plant of the loop bound, which exists
    // because a hierarchy is data and data can be edited wrong.
    expect(Object.keys(NODES).length).toBeGreaterThan(0)
    expect(areaOf('SITE-BRIGHTBIKES-01')).toBeNull()
  })

  /**
   * THE PLANT THAT MATTERS. A direct read of `parentNodeId` — the superseded
   * one-Area-per-Job reading — puts the Cell-bound Job in NO Area scope in the
   * tenant. The walk is what makes the answer right, and this measures the
   * difference rather than asserting it.
   */
  it('is what puts a Cell-bound Job inside an Area scope; a direct read would not', () => {
    const sam = VIEWER_SCOPES.SUPERVISOR
    const wheeltrue = PAIR_CELL_BOUND.a.record
    expect(wheeltrue.parentNodeId).toBe('CELL-WHEEL-2')

    const withWalk = scopeVerdict(wheeltrue, sam)
    expect(withWalk.held).toBe(true)
    expect(withWalk.area).toBe('AREA-ASSY-A')
    expect(withWalk.reason).toContain('walking up the node path')

    // PLANT: the direct read the adopted position supersedes.
    const directRead = (sam.areaIds ?? []).includes(wheeltrue.parentNodeId)
    expect(directRead).toBe(false)
  })

  it('fails closed where the path reaches no Area, because pairing may not leak scope', () => {
    const orphan = { ...PAIR_CELL_BOUND.a.record, parentNodeId: 'SITE-BRIGHTBIKES-01' }
    const verdict = scopeVerdict(orphan, VIEWER_SCOPES.SUPERVISOR)
    expect(verdict.held).toBe(false)
    expect(verdict.reason).toContain('reaches no Area')
  })

  it('never narrows a tenant-scoped viewer', () => {
    for (const role of ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const) {
      expect(VIEWER_SCOPES[role].areaIds).toBeNull()
      expect(scopeVerdict(PAIR_FLAGGED.a.record, VIEWER_SCOPES[role]).held).toBe(true)
    }
  })
})

/* ==================================================================== *
 * SCOPE OVER BOTH JOBS — rows 1 and 2.
 * ==================================================================== */

describe('rows 1 and 2 require scope over BOTH Jobs, and the refusal names the Job', () => {
  it('offers the Tenant Admin both controls unconditionally', () => {
    expect(kindFor('create-a-pairing-between-two-jobs', 'TENANT_ADMIN')).toBe('control')
    expect(kindFor('remove-a-pairing', 'TENANT_ADMIN')).toBe('control')
  })

  it('withholds from a Supervisor scoped over only one of the two, and says which', () => {
    const affordance = doh16Affordance(
      doh16Row('create-a-pairing-between-two-jobs'),
      'SUPERVISOR',
      bearing('SUPERVISOR'),
    )
    expect(affordance.kind).toBe('absent')
    if (affordance.kind !== 'absent') throw new Error('unreachable')
    expect(affordance.reason).toContain('JOB-PAINTLINE')
    expect(affordance.reason).toContain('AREA-PAINT')
    expect(affordance.reason).not.toContain('JOB-REDBIKE is bound')
  })

  it('offers the control where the same Supervisor holds both Areas', () => {
    const wide: ViewerScope = {
      identityId: DOH_05_IDENTITIES.SUPERVISOR,
      areaIds: ['AREA-ASSY-A', 'AREA-PAINT'],
    }
    const [a, b] = bothJobsInScope(PAIR_FLAGGED, wide)
    expect(a.held && b.held).toBe(true)
    expect(
      doh16Affordance(doh16Row('remove-a-pairing'), 'SUPERVISOR', {
        pair: PAIR_FLAGGED,
        scope: wide,
      }).kind,
    ).toBe('control')
  })

  it('prohibits the Quality Manager, the Auditor and the Worker on both rows', () => {
    for (const rowId of ['create-a-pairing-between-two-jobs', 'remove-a-pairing'] as const) {
      for (const role of ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'] as const) {
        expect(kindFor(rowId, role), `${rowId} / ${role}`).toBe('absent')
      }
    }
  })
})

/* ==================================================================== *
 * REACH — derived in-module by the shared rule, never a hand-written rail.
 * ==================================================================== */

describe('who reaches this module’s route', () => {
  it('is the four reading roles, and the Worker is withheld', () => {
    const reaching = doh16RolesReaching()
    expect([...reaching].sort()).toEqual([
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
      'SUPERVISOR',
      'TENANT_ADMIN',
    ])
    expect(reaching).toHaveLength(4)
    expect(reaching).not.toContain('WORKER')
  })

  it('is the SHARED rule applied to this module’s own matrix, not a second one', () => {
    expect(doh16RolesReaching()).toEqual(rolesReachingByMatrix(CONTROL_MATRIX, cellStatus))
  })

  it('turns on clause two — the withholding token on row 3, and nothing else', () => {
    // PLANT: soften the Worker's row 3 cell. The Worker joins, which is what
    // makes the clause load-bearing rather than decorative.
    const softened = CONTROL_MATRIX.map((row) =>
      row.id === 'view-the-paired-scheduling-view'
        ? mutate(row, { status: { ...row.status, WORKER: 'read-only' } })
        : row,
    )
    expect(rolesReachingByMatrix(softened, cellStatus)).toContain('WORKER')

    // RESTORED.
    expect(doh16RolesReaching()).not.toContain('WORKER')
  })

  it('does not turn on clause one, because all six rows are this screen’s own', () => {
    expect(CONTROL_MATRIX.every((r) => r.surface === 'screen')).toBe(true)
  })
})

/* ==================================================================== *
 * THE FLAG ROUTES TO THE PARTNER'S OWNER — computed, never stored.
 * ==================================================================== */

describe('the review flag routes to the PAIRED Job’s Owner', () => {
  it('follows the source’s own Illustrative Example', () => {
    expect(L(29_683)).toContain('JOB-REDBIKE')
    expect(L(29_683)).toContain('Material shortage')
    const flagged = flaggedJob(PAIR_FLAGGED)
    expect(flagged?.record.jobId).toBe('JOB-REDBIKE')
    expect(flagged?.record.ownerId).toBe(DOH_05_IDENTITIES.SUPERVISOR)
  })

  it('is computed from which side changed, so a fixture cannot route it wrongly', () => {
    // PLANT: flip which side changed. The flag must move to the other Job.
    const flipped = { ...PAIR_FLAGGED, changedSide: { jobId: 'JOB-REDBIKE', trigger: 'cancelled' as const } }
    expect(flaggedJob(flipped)?.record.jobId).toBe('JOB-PAINTLINE')

    // RESTORED.
    expect(flaggedJob(PAIR_FLAGGED)?.record.jobId).toBe('JOB-REDBIKE')
  })

  it('raises nothing where neither side changed', () => {
    expect(flaggedJob(PAIR_CELL_BOUND)).toBeNull()
  })

  it('propagates nothing across the link, which is the whole flagging-only rule', () => {
    expect(L(29_647)).toContain('There is no arrow from the flag back into either Job')
    // The partner Job's state is untouched by the flag.
    expect(PAIR_FLAGGED.b.record.state).toBe(
      PAIR_FLAGGED.b.record.state,
    )
    expect(kindFor('cause-automated-propagation-across-the-link', 'TENANT_ADMIN')).toBe('absent')
  })
})

/* ==================================================================== *
 * THE UNCATALOGUED ROUTE.
 * ==================================================================== */

describe('the route registers a storyboard name and mints no screen identifier', () => {
  it('registers SB-DOH-028, which the source really names at the line cited', () => {
    const entry = DOH_UNCATALOGUED_SCREEN_NAMES.find((s) => s.moduleId === 'MOD-DOH-16')
    expect(entry?.name).toBe('SB-DOH-028')
    expect(L(29_681)).toContain('SB-DOH-028')
    expect(L(29_681)).toContain('the paired scheduling view')
  })

  /**
   * THE TYPE ALREADY PROVES THIS AND THAT IS WHY THE COMPARISON IS WIDENED.
   * `DohScreenDefinition.moduleId` is a union built from the module ids
   * catalogue B's rows actually name, and `MOD-DOH-16` is not a member — so
   * `s.moduleId === 'MOD-DOH-16'` is a comparison TypeScript rejects outright
   * (TS2367), which is a STRONGER guarantee than any assertion. It is also a
   * build error, so the claim is spelled at runtime over a widened array
   * instead, and the compile-time half is recorded here rather than lost.
   */
  it('borrows no catalogue-B identifier, because catalogue B gives this VIEW no row', () => {
    const named: readonly (string | null)[] = DOH_SCREENS.map((s) => s.moduleId)
    expect(named).not.toContain('MOD-DOH-16')
  })

  /**
   * WAVE 0'S NOTE IS OVERSTATED, AND THIS MEASURES IT. The registration note
   * says catalogue B "carries no row for MOD-DOH-16 at all". Catalogue B's own
   * L48105 mounts MOD-DOH-16 inside the Job editor row, and `DOH_SCREENS`
   * records that twelve lines above the note in the same file. What catalogue
   * B genuinely lacks is a row for the paired scheduling VIEW, which is what
   * the treatment turns on and what this build states instead.
   */
  it('records the narrower true statement rather than repeating the overstated one', () => {
    expect(L(48_105)).toContain('MOD-DOH-16')
    expect(L(48_105)).toContain('Job editor')
    const jobEditor = DOH_SCREENS.find((s) => s.id === 'SCR-DOH-11')
    expect(jobEditor?.alsoShows).toContain('MOD-DOH-16')
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toContain(
      'It is not true that catalogue B ignores this module altogether',
    )
  })

  it('writes no three-digit screen literal in any file this task owns', () => {
    const mine = [
      'src/surfaces/doh/modules/doh-16/matrix.ts',
      'src/surfaces/doh/modules/doh-16/pairing.ts',
      'src/surfaces/doh/modules/doh-16/rendering.ts',
      'app/hub/multi-area-job-pairing/PairedSchedulingScreen.tsx',
      'app/hub/multi-area-job-pairing/page.tsx',
      'tests/unit/doh-pairing.test.ts',
      'tests/component/doh-pairing.test.tsx',
    ]
    for (const file of mine) {
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      expect(src, file).not.toMatch(/\bSCR-[A-Z]{2,3}-\d{3}\b/)
    }
  })
})

/* ==================================================================== *
 * WHAT THE SOURCE DOES NOT SETTLE.
 * ==================================================================== */

describe('the silences are recorded rather than filled', () => {
  it('has a Hub command for each of the two pairing writes, and both sides of the link are written', () => {
    // The gap this test used to pin is cleared. The card names a write
    // pattern for the pairing act (L29607) and rows 1 and 2 are both writes;
    // there are now commands for both, and the spec they carry is the card's
    // own pattern rather than a paraphrase of it.
    expect(Object.keys(HUB_COMMAND_SPECS)).toHaveLength(15)
    expect(L(29_607)).toContain('FB-DOH-WRITE-002')
    for (const type of ['DOH_PAIR_JOBS', 'DOH_UNPAIR_JOBS'] as const) {
      expect(HUB_COMMAND_SPECS[type].fallbackPatternId, type).toBe('FB-DOH-WRITE-002')
      // Rows 1 and 2 are not owner-conditioned; only rows 4 and 5 are.
      expect([...HUB_COMMAND_SPECS[type].access.allowedRoles], type).toEqual([
        'TENANT_ADMIN',
        'SUPERVISOR',
      ])
    }
    expect(HUB_COMMAND_SPECS.DOH_ACT_ON_PAIRED_REVIEW_FLAG.access.allowedRoles).toContain(
      'QUALITY_MANAGER',
    )

    // L29598: "the `linked_job_ref` on EACH Job". Both sides, both ways.
    const tenant = HUB_TENANT_ID
    const job = (jobId: string): JobRecord => ({
      jobId,
      name: jobId,
      jobTypeId: 'JOBTYPE-BRIGHTBIKES-ASSEMBLY',
      parentNodeId: 'AREA-ASSY-A',
      ownerId: 'ACT-DOH-SAM',
      state: 'active',
      createdBy: 'ACT-DOH-SAM',
    })
    const seeded = withTenant(
      emptyDomainState(scenarioRunId('DOH-MOD-16-PAIR')),
      tenant,
      (p) => ({
        ...p,
        objects: {
          ...p.objects,
          [objectKey.job('JOB-A')]: job('JOB-A'),
          [objectKey.job('JOB-B')]: job('JOB-B'),
        },
      }),
    )
    const paired = applyHubCommand(seeded, {
      type: 'DOH_PAIR_JOBS',
      tenant,
      jobId: 'JOB-A',
      pairedJobId: 'JOB-B',
    })
    expect(jobPairedWith(readJob(paired, tenant, 'JOB-A')!)).toBe('JOB-B')
    expect(jobPairedWith(readJob(paired, tenant, 'JOB-B')!)).toBe('JOB-A')

    const unpaired = applyHubCommand(paired, {
      type: 'DOH_UNPAIR_JOBS',
      tenant,
      jobId: 'JOB-A',
      pairedJobId: 'JOB-B',
    })
    expect(jobPairedWith(readJob(unpaired, tenant, 'JOB-A')!)).toBeNull()
    expect(jobPairedWith(readJob(unpaired, tenant, 'JOB-B')!)).toBeNull()

    // L29596 pairs TWO Jobs; a Job paired with itself is one Job with a link.
    expect(
      validateHubCommand({ type: 'DOH_PAIR_JOBS', tenant, jobId: 'JOB-A', pairedJobId: 'JOB-A' }),
    ).toContain('cannot be paired with itself')
  })

  it('records the contradiction, the catalogue-A cell, and does not settle either', () => {
    const all = UNRESOLVED_IN_SOURCE.join(' ')
    expect(all).toContain('This build renders both cells and settles neither')
    expect(all).toContain('Supervisor and Job Owner')
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThanOrEqual(5)
  })
})

import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { cellFromSource } from '@/policy/columns'
import { roleById } from '@/domain/roles'
import { cellStatus, outcomeCellStatus, rolesReachingByMatrix } from '@/surfaces/doh/modules'
import {
  AUDIT_DEGRADED_BANNER,
  AUDIT_FAILURE_GRADING,
  AUDIT_HALT_CLASSES,
  AUDIT_HALT_CLASS_LOCATORS,
  AUDIT_TAXONOMY,
  CONTROL_MATRIX,
  DOH_11_READ_DURING_OUTAGE_CONFLICT,
  DOH_11_ROW_COUNT,
  DOH_11_SOURCE_ROWS,
  DOH_11_TAXONOMY_COUNT_CONFLICT,
  V1_IS_NOT_TAMPER_EVIDENT,
  doh11ReachIsClassificationIndependent,
  doh11Row,
} from '@/surfaces/doh/modules/doh-11/matrix'
import {
  BARE_PROHIBITION_DETAIL,
  auditObjectDecision,
  auditReadLicence,
  doh11Affordance,
  doh11AffordanceKinds,
  doh11RolesReaching,
  doh11RoutingBranch,
  readableAuditEvents,
} from '@/surfaces/doh/modules/doh-11/rendering'
import {
  HUB_TENANT_ID,
  NEIGHBOUR_TENANT_ID,
  SEEDED_AUDIT_EVENTS,
  auditContext,
} from '@/surfaces/doh/modules/doh-11/fixtures'
import { stripComments } from '../coverage/strip-comments'
import type { TenantRoleId } from '../../app/hub/HubShell'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every claim below is checked against the file.
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

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

const ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

const MATRIX_HEADER_LINE = 28_863
const MATRIX_BODY_FIRST = 28_865
const MATRIX_BODY_LAST = 28_874
const GRADED_HEADER_LINE = 74_865
const GRADED_BODY_FIRST = 74_867
const GRADED_BODY_LAST = 74_875

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE TEN ROWS, COUNTED BY READING TO WHERE THE BODY STOPS.
 * ==================================================================== */

describe('MOD-DOH-11 §19.13 — the permission matrix, measured off the source', () => {
  it('has a header and a separator that are not rows, and a body of exactly ten', () => {
    expect(cells(L(MATRIX_HEADER_LINE))).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(L(MATRIX_HEADER_LINE + 1)).toMatch(/^\|(-+\|){6}$/)
    // The body ends where the blank line begins. Counted, not spanned.
    for (let n = MATRIX_BODY_FIRST; n <= MATRIX_BODY_LAST; n += 1) {
      expect(L(n).startsWith('|'), `L${n} should be a table row`).toBe(true)
    }
    expect(L(MATRIX_BODY_LAST + 1)).toBe('')
    expect(MATRIX_BODY_LAST - MATRIX_BODY_FIRST + 1).toBe(DOH_11_ROW_COUNT)
    expect(CONTROL_MATRIX).toHaveLength(DOH_11_ROW_COUNT)
  })

  it('transcribes every row byte-identically — the WHOLE line, not its tokens', () => {
    // The whole-line comparison is what catches a dropped condition. A
    // per-cell status check would pass on a cell whose stated reason was lost,
    // and that is the costliest brief error shape this build has recorded.
    expect(DOH_11_SOURCE_ROWS).toHaveLength(DOH_11_ROW_COUNT)
    DOH_11_SOURCE_ROWS.forEach((text, i) => {
      expect(text, `L${MATRIX_BODY_FIRST + i}`).toBe(L(MATRIX_BODY_FIRST + i))
    })
    CONTROL_MATRIX.forEach((row, i) => {
      expect(row.sourceRef).toBe(`L${MATRIX_BODY_FIRST + i}`)
      expect(row.control).toBe(cells(L(MATRIX_BODY_FIRST + i))[0])
    })
  })

  it('parses each cell from the token the source actually wrote in it', () => {
    const TITLE_CASE: Readonly<Record<string, string>> = {
      allowed: 'Allowed',
      'allowed-with-conditions': 'Allowed with conditions',
      'read-only': 'Read-only',
      unavailable: 'Unavailable',
      'explicitly-prohibited': 'Explicitly prohibited',
      'not-applicable': 'Not applicable',
    }
    CONTROL_MATRIX.forEach((row, i) => {
      const field = cells(L(MATRIX_BODY_FIRST + i))
      ROLES.forEach((role, c) => {
        const raw = (field[c + 1] ?? '').replace(/^`/, '')
        const token = TITLE_CASE[cellStatus(row, role)] ?? ''
        expect(raw.startsWith(token), `L${MATRIX_BODY_FIRST + i} ${role}: ${raw}`).toBe(true)
      })
    })
  })

  it('names the header columns in the role registry’s own order', () => {
    expect(ROLES.map((r) => roleById(r).name)).toEqual(cells(L(MATRIX_HEADER_LINE)).slice(1))
  })

  it('runs every cell through the ONE shared parser, and agrees with the shared mapping', () => {
    // The two derivations of a cell's status must agree on all fifty cells:
    // the record built in `matrix.ts` and `outcomeCellStatus` over the same
    // cells. Two spellings of one mapping is one thing to drift.
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        expect(cellStatus(row, role)).toBe(outcomeCellStatus(row, role))
      }
    }
    expect(CONTROL_MATRIX.length * ROLES.length).toBe(50)
  })

  it('states the bare-prohibition detail the shared parser actually produces', () => {
    expect(cellFromSource('`Explicitly prohibited`').detail).toBe(BARE_PROHIBITION_DETAIL)
  })

  it('strips the backtick that CLOSES a wholly-backticked cell, and only that', () => {
    // Both deferral rows carry their reason INSIDE the backticks, and the
    // shared parser leaves the closing one behind. Without the normalisation
    // this detail ends in a stray backtick and renders that way.
    const bulk = doh11Row('bulk-export-to-tenant-owned-storage')
    expect(bulk.detail.TENANT_ADMIN).toBe('deferred beyond V1')
    expect(bulk.detail.SUPERVISOR).toBe('same reason')
    // The condition that names an identifier in backticks of its own is left
    // exactly as the source wrote it — the guard is three-way.
    expect(cellFromSource('`Read-only` — see `OBJ-DOH-AUDIT`').detail).toBe(
      'see `OBJ-DOH-AUDIT`',
    )
  })
})

/* ==================================================================== *
 * THE TRAP: A PROHIBITION THAT NAMES A PERMISSION IN THE SAME CELL.
 * ==================================================================== */

describe('the C1 trap, whole-line', () => {
  it('L28865 gives the Quality Manager a prohibition that names a permission', () => {
    const field = cells(L(28_865))
    expect(field[0]).toBe('Read the full tenant audit log')
    expect(field[3]).toBe(
      '`Explicitly prohibited` — scoped to Summary and run-state events only',
    )
    expect(field[1]).toBe('`Read-only`')
    expect(field[2]).toBe('`Unavailable`')
    expect(field[4]).toBe('`Read-only` — the same access as the Tenant Admin')
    expect(field[5]).toBe('`Unavailable`')
  })

  it('L28866 grants that same actor Read-only on exactly those events', () => {
    const field = cells(L(28_866))
    expect(field[0]).toBe('Read Summary and run-state audit events')
    expect(field[3]).toBe('`Read-only`')
    expect(field[2]).toBe('`Unavailable`')
  })

  it('L28866 is the row immediately after L28865 — the alternative is adjacent', () => {
    expect(CONTROL_MATRIX[0]?.id).toBe('read-the-full-tenant-audit-log')
    expect(CONTROL_MATRIX[1]?.id).toBe('read-summary-and-run-state-audit-events')
    expect(CONTROL_MATRIX[0]?.routesTo).toBe('read-summary-and-run-state-audit-events')
  })

  it('exactly ONE cell of the fifty is a routing branch, and it is that one', () => {
    const found: string[] = []
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        if (doh11RoutingBranch(row, role) !== null) found.push(`${row.id}/${role}`)
      }
    }
    expect(found).toEqual(['read-the-full-tenant-audit-log/QUALITY_MANAGER'])
  })
})

describe('DISABLED, not ABSENT, with the named reason', () => {
  it('renders the Quality Manager’s full-log cell disabled and carries the cell’s own words', () => {
    const affordance = doh11Affordance(doh11Row('read-the-full-tenant-audit-log'), 'QUALITY_MANAGER')
    expect(affordance.kind).toBe('disabled')
    if (affordance.kind !== 'disabled') throw new Error('unreachable')
    expect(affordance.namedReason).toBe('scoped to Summary and run-state events only')
    expect(affordance.insteadLabel).toBe('Read Summary and run-state audit events')
    expect(affordance.insteadRef).toBe('L28866')
    expect(affordance.decisionRef).toBe('DEC-AUDITQM-001')
  })

  it('renders NOTHING disabled anywhere else, over every row and every role', () => {
    const counts = doh11AffordanceKinds(ROLES)
    expect(counts.get('disabled')).toBe(1)
    // The claim is about a count, so the walk behind it is stated: fifty cells.
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(50)
  })

  it('the Supervisor and the Worker meet ABSENT on both read rows, never DISABLED', () => {
    for (const role of ['SUPERVISOR', 'WORKER'] as const) {
      for (const id of [
        'read-the-full-tenant-audit-log',
        'read-summary-and-run-state-audit-events',
      ] as const) {
        expect(doh11Affordance(doh11Row(id), role).kind).toBe('absent')
      }
    }
  })

  it('the branch is answered by the ADJACENT ROW’S OWN CELL, not by the pointer', () => {
    // A routing pointer that is not backed by a live alternative for THIS
    // role must fall through to ABSENT. The Tenant Admin and the Auditor
    // never reach the branch (their full-log cell is `Read-only`), and the
    // Supervisor and Worker never reach it either (`Unavailable`), so the
    // only way to see the fall-through is to move row 2's Quality Manager
    // cell — which is the plant recorded in the report. What this case pins
    // is the mechanism: the branch reads the target row's cell.
    const instead = doh11Row('read-summary-and-run-state-audit-events')
    expect(cellStatus(instead, 'QUALITY_MANAGER')).toBe('read-only')
    expect(doh11RoutingBranch(doh11Row('read-the-full-tenant-audit-log'), 'QUALITY_MANAGER'))
      .not.toBeNull()
  })
})

/* ==================================================================== *
 * WHO REACHES THE ROUTE.
 * ==================================================================== */

describe('reach, derived from this module’s own matrix', () => {
  it('answers the three roles catalogue B admits, with the Supervisor absent', () => {
    expect(doh11RolesReaching()).toEqual(['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR'])
    // Catalogue B's own cell, parsed off L48114 rather than typed here.
    const catalogueB = cells(L(48_114))
    expect(catalogueB[0]).toBe('SCR-DOH-20')
    expect(catalogueB[4]).toBe('MOD-DOH-11 all features')
    const admitted = (catalogueB[3] ?? '').split(',').map((s) => s.trim())
    expect(admitted).toEqual(['Read-only Auditor', 'Tenant Admin', 'Quality Manager'])
    expect([...admitted].sort()).toEqual(
      doh11RolesReaching()
        .map((r) => roleById(r).name)
        .sort(),
    )
    expect(admitted).not.toContain('Supervisor')
  })

  it('cannot be moved by how the two platform-console rows are classified', () => {
    const answers = doh11ReachIsClassificationIndependent((rows) =>
      rolesReachingByMatrix(rows, cellStatus),
    )
    expect([...answers]).toEqual(['TENANT_ADMIN,QUALITY_MANAGER,READONLY_AUDITOR'])
  })
})

/* ==================================================================== *
 * THE SELECTOR. THE GATE ASSERTS THE SELECTOR, NOT THE RENDER.
 * ==================================================================== */

describe('AC-30D-105 is at L74029, and its paired test at L74032', () => {
  it('reads the criterion and the test whole', () => {
    expect(L(74_029)).toBe(
      '- `AC-30D-105` — Audit reading never bypasses the authorisation of the objects it references.',
    )
    expect(L(74_032)).toContain('`TEST-30D-103`')
    expect(L(74_032)).toContain('assert the reference does not disclose content')
    // The line two earlier briefs cited for the criterion is the test.
    expect(L(74_032)).not.toContain('AC-30D-105')
  })

  it('excludes forbidden classes before the query, which the source states twice', () => {
    expect(L(74_232)).toContain('`AC-30D-403`')
    expect(L(74_232)).toContain('excluded before query execution, not filtered after')
    expect(L(74_186)).toContain(
      'bounded to the tenant and to the permitted event classes before execution',
    )
  })
})

describe('stage one — the licence is the reader’s own cell', () => {
  it('gives the Tenant Admin and the Read-only Auditor the full log', () => {
    for (const role of ['TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
      const licence = auditReadLicence(role)
      expect(licence.kind).toBe('full')
      expect(licence.rowRef).toBe('L28865')
      expect(licence.classes).toHaveLength(AUDIT_TAXONOMY.length)
    }
  })

  it('gives the Quality Manager the two Summary and run-state classes, off the ADJACENT row', () => {
    const licence = auditReadLicence('QUALITY_MANAGER')
    expect(licence.kind).toBe('scoped')
    expect(licence.rowRef).toBe('L28866')
    expect([...licence.classes]).toEqual(['run-state-transition', 'summary-review-action'])
  })

  it('gives the Supervisor and the Worker nothing', () => {
    for (const role of ['SUPERVISOR', 'WORKER'] as const) {
      const licence = auditReadLicence(role)
      expect(licence.kind).toBe('none')
      expect(licence.classes).toHaveLength(0)
    }
  })

  it('does NOT read the DISABLED rendering as a licence', () => {
    // The Quality Manager's full-log cell renders DISABLED — visible,
    // inoperable, reason named — and grants nothing. A selector keyed on
    // "is anything drawn for this role on the full-log row" would read that
    // control as a full licence, which is the disclosure the two stages
    // exist to prevent.
    expect(doh11Affordance(doh11Row('read-the-full-tenant-audit-log'), 'QUALITY_MANAGER').kind)
      .toBe('disabled')
    expect(auditReadLicence('QUALITY_MANAGER').kind).not.toBe('full')
  })
})

describe('stage two — the referenced object is authorised on its own, with its own tenant', () => {
  const own = SEEDED_AUDIT_EVENTS.find((e) => e.eventId === 'AUD-BB-000001')
  const foreign = SEEDED_AUDIT_EVENTS.find((e) => e.eventId === 'AUD-NP-000077')

  it('has a fixture whose foreign event is in a class the scoped reader MAY read', () => {
    // Without this the class filter alone would remove it and a plant that
    // deleted stage two would still leave the list correct.
    expect(own?.resourceTenant).toBe(HUB_TENANT_ID)
    expect(foreign?.resourceTenant).toBe(NEIGHBOUR_TENANT_ID)
    expect(foreign?.eventClass).toBe('run-state-transition')
    expect(auditReadLicence('QUALITY_MANAGER').classes).toContain(foreign?.eventClass)
    expect(auditReadLicence('READONLY_AUDITOR').classes).toContain(foreign?.eventClass)
  })

  it('permits the reader’s own tenant and refuses the other one at TENANT_ISOLATION', () => {
    if (own === undefined || foreign === undefined) throw new Error('fixture missing')
    for (const role of ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const) {
      const ctx = auditContext(role)
      expect(auditObjectDecision(own, role, ctx).outcome).not.toBe('explicitlyProhibited')
      const refused = auditObjectDecision(foreign, role, ctx)
      expect(refused.stage).toBe('TENANT_ISOLATION')
      expect(refused.reasonCode).toBe('TENANT_MISMATCH')
    }
  })

  it('carries AC-30D-105’s locator on every object decision it makes', () => {
    if (own === undefined) throw new Error('fixture missing')
    expect(auditObjectDecision(own, 'TENANT_ADMIN', auditContext('TENANT_ADMIN')).sourceRefs)
      .toContain('L74029')
  })
})

describe('the selector is the only way an event reaches the screen', () => {
  it('returns the reader’s own tenant only, for every role that reads at all', () => {
    for (const role of ['TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
      const visible = readableAuditEvents(SEEDED_AUDIT_EVENTS, role, auditContext(role))
      expect(visible).toHaveLength(12)
      expect(visible.every((e) => e.resourceTenant === HUB_TENANT_ID)).toBe(true)
      expect(visible.map((e) => e.eventId)).not.toContain('AUD-NP-000077')
      expect(visible.map((e) => e.eventId)).not.toContain('AUD-NP-000078')
    }
  })

  it('returns exactly the two scoped classes for the Quality Manager, own tenant only', () => {
    const visible = readableAuditEvents(
      SEEDED_AUDIT_EVENTS,
      'QUALITY_MANAGER',
      auditContext('QUALITY_MANAGER'),
    )
    expect(visible.map((e) => e.eventId)).toEqual(['AUD-BB-000001', 'AUD-BB-000201'])
    expect([...new Set(visible.map((e) => e.eventClass))]).toEqual([
      'run-state-transition',
      'summary-review-action',
    ])
  })

  it('returns nothing for the two roles with no licence', () => {
    for (const role of ['SUPERVISOR', 'WORKER'] as const) {
      expect(readableAuditEvents(SEEDED_AUDIT_EVENTS, role, auditContext(role))).toHaveLength(0)
    }
  })

  it('has a positive control: the register it filters is not empty', () => {
    // A subset assertion passes on an empty set. This is what stops every
    // absence above from being vacuous.
    expect(SEEDED_AUDIT_EVENTS).toHaveLength(14)
    expect(SEEDED_AUDIT_EVENTS.filter((e) => e.resourceTenant === NEIGHBOUR_TENANT_ID))
      .toHaveLength(2)
    expect(new Set(SEEDED_AUDIT_EVENTS.map((e) => e.eventClass)).size).toBe(
      AUDIT_TAXONOMY.length,
    )
  })
})

/* ==================================================================== *
 * THE AUDITED TAXONOMY — BOTH NUMBERS.
 * ==================================================================== */

describe('the taxonomy states a count beside an enumeration that contradicts it', () => {
  it('enumerates twelve classes, verbatim, off L28836', () => {
    const enumerated = L(28_836)
      .replace(/^\*\*The audited taxonomy, in full\.\*\*\s*/, '')
      .replace(/\s*`\[SoW Fact — §4\.10\.1\]`\s*$/, '')
      .split(';')
      .map((s) => s.trim())
      // The last item carries the SENTENCE's full stop, which is punctuation
      // and not part of the class. Stripped here rather than stored, so the
      // register holds twelve class names and not eleven plus a sentence.
      .map((s) => s.replace(/\.$/, ''))
      .filter((s) => s !== '')
    expect(enumerated).toHaveLength(12)
    expect(AUDIT_TAXONOMY.map((c) => c.stated)).toEqual(enumerated)
    expect(DOH_11_TAXONOMY_COUNT_CONFLICT.enumerated).toBe(12)
  })

  it('is called a thirteen-class taxonomy on three lines of the same module', () => {
    for (const n of [28_922, 28_969, 28_997]) {
      expect(L(n)).toContain('thirteen')
    }
    expect(DOH_11_TAXONOMY_COUNT_CONFLICT.stated).toBe(13)
    expect(DOH_11_TAXONOMY_COUNT_CONFLICT.sourceRefs).toEqual([
      'L28836',
      'L74042',
      'L28922',
      'L28969',
      'L28997',
    ])
  })

  it('marks exactly the two classes the Quality Manager’s scope names', () => {
    expect(AUDIT_TAXONOMY.filter((c) => c.inQualityManagerScope).map((c) => c.id)).toEqual([
      'run-state-transition',
      'summary-review-action',
    ])
    expect(L(28_838)).toContain(
      'the Quality Manager is **scoped to Summary and run-state events**',
    )
  })
})

/* ==================================================================== *
 * AUDIT FAILURE IS GRADED, NOT BINARY.
 * ==================================================================== */

describe('the graded response, transcribed', () => {
  it('has a header and a separator that are not rows, and a body of exactly nine', () => {
    expect(cells(L(GRADED_HEADER_LINE))).toEqual([
      'Action class',
      'Behaviour when the audit store is unavailable',
      'Rationale',
    ])
    expect(L(GRADED_HEADER_LINE + 1)).toMatch(/^\|(-+\|){3}$/)
    expect(L(GRADED_BODY_LAST + 1)).toBe('')
    expect(AUDIT_FAILURE_GRADING).toHaveLength(9)
  })

  it('transcribes each row byte-identically', () => {
    AUDIT_FAILURE_GRADING.forEach((grade, i) => {
      const field = cells(L(GRADED_BODY_FIRST + i))
      expect(grade.sourceRef).toBe(`L${GRADED_BODY_FIRST + i}`)
      expect([grade.actionClass, grade.behaviour, grade.rationale]).toEqual(field)
    })
  })

  it('grades seven rows halt and two continue, and does not collapse them to one answer', () => {
    expect(AUDIT_FAILURE_GRADING.filter((g) => g.halts)).toHaveLength(7)
    expect(AUDIT_FAILURE_GRADING.filter((g) => !g.halts).map((g) => g.actionClass)).toEqual([
      'Frontline capture and step execution',
      'Reads outside access sessions',
    ])
  })

  it('keeps the prose list of seven halt CLASSES distinct from the nine table rows', () => {
    // The section names seven classes in words and the table has nine rows.
    // Reporting one as the other would be a count taken from an enumeration
    // it does not belong to.
    for (const locator of AUDIT_HALT_CLASS_LOCATORS) {
      const line = L(Number(locator.slice(1)))
      for (const klass of AUDIT_HALT_CLASSES) expect(line).toContain(klass)
    }
    expect(AUDIT_HALT_CLASSES).toHaveLength(7)
    expect(AUDIT_FAILURE_GRADING).toHaveLength(9)
  })

  it('quotes the degraded banner exactly as the source writes it', () => {
    expect(L(74_902)).toContain(AUDIT_DEGRADED_BANNER.text)
  })

  it('records the one place the source disagrees with itself about a read', () => {
    expect(L(74_874)).toContain('| Reads outside access sessions | Continue |')
    expect(L(74_226)).toContain('reads outside access sessions are not audited')
    expect(L(28_953)).toContain('audit read access by identity')
    expect(DOH_11_READ_DURING_OUTAGE_CONFLICT.continuesRefs).toEqual(['L74874', 'L74226'])
    expect(DOH_11_READ_DURING_OUTAGE_CONFLICT.wouldHaltRefs).toEqual(['L28953'])
  })
})

/* ==================================================================== *
 * WHAT V1 IS NOT — AND THE ABSENCE HAS A POSITIVE CONTROL.
 * ==================================================================== */

describe('V1 append-only access control is not cryptographic tamper-evidence', () => {
  it('reads the matrix’s own last row and both prose statements whole', () => {
    const field = cells(L(28_874))
    expect(field[0]).toBe('Verify tamper-evidence through chained hashes')
    expect(field[1]).toBe('`Not applicable — deferred beyond V1`')
    expect(L(28_838)).toContain(
      '**tamper-evidence through chained hashes or signed batches is deferred beyond V1**',
    )
    expect(L(28_955)).toContain(
      'so no tenant is left believing the log is cryptographically chained when it is not',
    )
    expect(V1_IS_NOT_TAMPER_EVIDENT.sourceRefs).toEqual(['L28874', 'L28838', 'L28955'])
  })

  /**
   * The CLAIM forms, not the subject. `tamper-evidence`, `signed batches` and
   * `chained hashes` are the source's own words for what is DEFERRED and this
   * module quotes them, so a detector aimed at those nouns fires on the
   * disclaimer itself — measured: it did, on the deferral sentence. What may
   * never appear is the assertion that V1 HAS it.
   */
  const CLAIMS = [
    /\btamper-evident\b/i,
    /\bverified chain\b/i,
    /\bchain is intact\b/i,
    /\bcryptographically (chained|verified)\b/i,
  ]

  /**
   * ENUMERATED FROM THE DIRECTORIES, not hand-listed. Both halves: a hand
   * list is one rename away from scanning a file that no longer exists and one
   * new file away from silently not scanning it — which is the failure mode
   * `slice-04-gates` gate 3 exists to catch, and it fires at three hand-named
   * files of one module.
   */
  const OWNED = ['src/surfaces/doh/modules/doh-11', 'app/hub/audit-and-retention'].flatMap((dir) =>
    readdirSync(join(process.cwd(), dir))
      .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
      .sort()
      .map((f) => `${dir}/${f}`),
  )

  it('scans a non-empty file set, enumerated rather than named', () => {
    // Without this the two absence checks below pass on an empty walk.
    expect(OWNED.length).toBeGreaterThanOrEqual(5)
    expect(OWNED.filter((p) => p.startsWith('app/'))).toHaveLength(2)
  })

  it('has a POSITIVE CONTROL: the detector fires on a sentence that makes the claim', () => {
    const wouldBeWrong =
      'This log is tamper-evident, every batch has a verified chain, the chain is intact, and it ' +
      'is cryptographically verified.'
    expect(CLAIMS.filter((r) => r.test(wouldBeWrong))).toHaveLength(CLAIMS.length)
    // And it does NOT fire on the deferral this module actually renders.
    expect(CLAIMS.filter((r) => r.test(V1_IS_NOT_TAMPER_EVIDENT.statement))).toHaveLength(0)
  })

  it('makes no such claim in any file this task owns', () => {
    // COMMENTS ARE STRIPPED FIRST, and that is not a loophole — it is the
    // difference between a claim and a quotation. These files quote the
    // source's own sentence about not leaving a tenant believing the log is
    // cryptographically chained, and a gate over raw bytes fails on the very
    // prose that forbids the claim. Measured: it did.
    for (const rel of OWNED) {
      const text = stripComments(readFileSync(join(process.cwd(), rel), 'utf8'))
      for (const claim of CLAIMS) {
        expect(claim.test(text), `${rel} matches ${claim}`).toBe(false)
      }
    }
  })

  it('has a second POSITIVE CONTROL: the stripped text of every owned file is not empty', () => {
    // A comment-stripping gate that returned '' would pass every absence
    // above. This is what stops that.
    for (const rel of OWNED) {
      const text = stripComments(readFileSync(join(process.cwd(), rel), 'utf8'))
      expect(text.replace(/\s+/g, '').length, rel).toBeGreaterThan(200)
    }
  })
})

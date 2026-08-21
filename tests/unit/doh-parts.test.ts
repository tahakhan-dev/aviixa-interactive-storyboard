import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONTROL_MATRIX,
  DOH_19_FINDINGS,
  DOH_19_SOURCE_ROW_COUNT,
  UNSPECIFIED_IN_SOURCE,
  doh19ClassificationDisagreements,
  doh19Row,
  type Doh19Row,
} from '@/surfaces/doh/modules/doh-19/matrix'
import {
  doh19Affordance,
  doh19AffordanceKinds,
  doh19RolesReaching,
} from '@/surfaces/doh/modules/doh-19/rendering'
import { inlineControlsOnAdjacentCapabilities } from '@/surfaces/doh/boundary'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import { DOH_CATALOGUE_B_REACH_NARROWER, dohScreenById } from '@/surfaces/doh/screens'
import { TENANT_WRITE_CLASSES, type TenantWriteState } from '@/surfaces/doh/tenant-state'
import { REGISTRY_PART_STATES } from '@/studio/seams/parts/registry'
import type { TenantRoleId } from '../../app/hub/HubShell'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every claim below about §19.21 is checked against
 * the file, never against the brief that sent this task — this brief
 * asserted the module has one trap and it has seven.
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

const WRITE_STATES: readonly TenantWriteState[] = TENANT_WRITE_CLASSES.map((r) => r.state)

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE SPANS, MEASURED RATHER THAN ACCEPTED.
 * ==================================================================== */

describe('MOD-DOH-19 §19.21, measured off the source', () => {
  it('has an identity card of 14 data rows: L30049 is the header, not a row', () => {
    expect(cells(L(30049))).toEqual(['Field', 'Content'])
    expect(L(30050)).toMatch(/^\|-+\|-+\|$/)
    expect(cells(L(30051))).toEqual(['Identifier', '`MOD-DOH-19`'])
    expect(cells(L(30064))[0]).toBe('Fallback identifier')
    // The line AFTER the last row is blank, which is how the table's end is
    // measured rather than assumed. It is addressed arithmetically and NOT
    // written as a locator: a citation of a blank line states nothing and is
    // always wrong, which `tests/coverage/locator-fidelity.test.ts` enforces
    // -- it caught this very line written as one.
    expect(L(30064 + 1).trim()).toBe('')
  })

  it('has a control matrix of EXACTLY eight data rows, L30070-L30077', () => {
    expect(cells(L(30068))).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(L(30069)).toMatch(/^\|(-+\|){6}$/)
    for (let n = 30070; n <= 30077; n += 1) expect(L(n).startsWith('|')).toBe(true)
    // Same arithmetic-not-a-locator rule as the card above: the blank line
    // that ends the table is measured, never cited.
    expect(L(30077 + 1).trim()).toBe('')

    // The brief's count of 8 is CORRECT. Measured, not carried.
    expect(DOH_19_SOURCE_ROW_COUNT).toBe(8)
    expect(CONTROL_MATRIX.length).toBe(DOH_19_SOURCE_ROW_COUNT)
  })

  it('transcribes every row against the source line it cites', () => {
    // The strongest check available: the module's own `sourceRef` is used to
    // fetch the line, and the row's control text must be that line's first
    // cell. A row transcribed from the wrong line fails here.
    for (const row of CONTROL_MATRIX) {
      const n = Number(row.sourceRef.replace(/^L/, ''))
      expect(cells(L(n))[0]).toBe(row.control)
    }
  })
})

/* ==================================================================== *
 * THE TRAP THE PLAN NAMED -- AND THE ONE IT DID NOT.
 * ==================================================================== */

describe('C2 -- row 2 is a Studio act, and row 6 is not the same case', () => {
  it('row 2 reads `Not applicable` in ALL FIVE columns at L30071', () => {
    const cs = cells(L(30071))
    expect(cs[0]).toBe('Add a part inline during authoring')
    for (const cell of cs.slice(1)) expect(cell.startsWith('`Not applicable')).toBe(true)

    const row = doh19Row('add-a-part-inline-during-authoring')
    for (const role of ROLES) expect(cellStatus(row, role)).toBe('not-applicable')
  })

  it('the ruling it turns on is quoted exactly, at L13312', () => {
    // Verified rather than trusted: the brief asked for this quotation to be
    // checked, and it is verbatim on the line it cites.
    expect(L(13312)).toContain('a second entry point is not a second owner')
    expect(cells(L(13312))[0]).toBe('11')
    // And the seam-map row and its prose, both cited by the module.
    expect(cells(L(13229))[1]).toBe('Parts registry')
    expect(L(13262)).toContain('Hub master data, with a Studio inline-add seam.')
  })

  it('the card states the seam twice, at L30055 and L30063', () => {
    expect(L(30055)).toContain('the inline-add seam lives in Standards and Operations Studio authoring')
    expect(L(30063)).toContain(
      'the inline-add seam is an authoring act in the Studio under its own permissions',
    )
  })

  /**
   * THE TRAP THE PLAN DID NOT LIST. Two rows carry identical tokens and take
   * OPPOSITE classifications, because `another-surface` is reserved for a
   * capability somebody actually holds.
   */
  it('row 6 is ALSO `Not applicable` in all five columns -- there are TWO such rows', () => {
    const cs = cells(L(30075))
    expect(cs[0]).toBe('Type a part number on the floor')
    for (const cell of cs.slice(1)) expect(cell.startsWith('`Not applicable')).toBe(true)

    const allNotApplicable = CONTROL_MATRIX.filter((r) =>
      ROLES.every((role) => cellStatus(r, role) === 'not-applicable'),
    )
    expect(allNotApplicable.map((r) => r.id)).toEqual([
      'add-a-part-inline-during-authoring',
      'type-a-part-number-on-the-floor',
    ])
  })

  it('and they are classified oppositely: row 2 adjacent, row 6 this screen&apos;s own', () => {
    expect(doh19Row('add-a-part-inline-during-authoring').surface).toBe('another-surface')
    expect(doh19Row('type-a-part-number-on-the-floor').surface).toBe('screen')
    // Row 6&apos;s act exists NOWHERE, so there is no surface to send anyone to.
    expect(doh19Row('type-a-part-number-on-the-floor').metElsewhere).toBeNull()
  })

  it('so row 6 renders a plain stated line and row 2 renders a cross-surface statement', () => {
    for (const role of ROLES) {
      expect(doh19Affordance(doh19Row('type-a-part-number-on-the-floor'), role).kind).toBe('absent')
      expect(doh19Affordance(doh19Row('add-a-part-inline-during-authoring'), role).kind).toBe(
        'cross-surface',
      )
    }
  })

  /* PLANT -> RED -> RESTORE. Row 6 mis-classified as adjacent. */
  it('PLANT: classifying row 6 as adjacent throws rather than pointing nowhere', () => {
    const real = doh19Row('type-a-part-number-on-the-floor')
    const planted = { ...real, surface: 'another-surface' } as unknown as Doh19Row
    expect(() => doh19Affordance(planted, 'TENANT_ADMIN')).toThrow(/names no surface/)
    // RESTORED: the real row is fine.
    expect(doh19Affordance(real, 'TENANT_ADMIN').kind).toBe('absent')
  })

  it('PLANT: `surface` and `metElsewhere` disagreeing is reported, and today they agree', () => {
    expect(doh19ClassificationDisagreements()).toEqual([])
    const planted = [
      { ...doh19Row('edit-a-part-record'), surface: 'another-surface' },
    ] as unknown as readonly Doh19Row[]
    const disagreements = planted
      .filter((r) => (r.surface === 'another-surface') !== (r.metElsewhere !== null))
      .map((r) => r.id)
    expect(disagreements).toEqual(['edit-a-part-record'])
  })
})

/* ==================================================================== *
 * THE SEAM: PERFORMED THERE, OWNED HERE.
 * ==================================================================== */

describe('the seam, and how a second owner is avoided', () => {
  it('row 2 says the act is on SURF-STU and the RECORD is still owned here', () => {
    const met = doh19Row('add-a-part-inline-during-authoring').metElsewhere
    expect(met?.surface).toBe('SURF-STU')
    expect(met?.ownedHere).toBe(true)
  })

  it('row 8 is the contrast: performed there AND owned there', () => {
    const met = doh19Row('set-ingestion-limits-or-storage-metering').metElsewhere
    expect(met?.surface).toBe('SURF-SA')
    expect(met?.ownedHere).toBe(false)
    expect(L(30041)).toContain(
      'Registry ingestion limits and storage metering are governed from the Super Admin platform console.',
    )
  })

  it('NEITHER adjacent row carries a boundary-register pointer, and that is the finding', () => {
    // `crossSurfaceStatement` is keyed on `DohBoundaryId` and neither of this
    // card's adjacent capabilities is one of the eight §19.1.2 rows. A pointer
    // written anyway would name the wrong OWNER for row 2.
    // Read through the declared row type: `as const satisfies` narrows the
    // optional field away when no row sets it, which would make a bare
    // property read pass without ever looking at anything.
    for (const row of CONTROL_MATRIX as readonly Doh19Row[]) {
      expect(row.boundary).toBeUndefined()
    }
  })

  it('the shared adjacency gate finds no inline control on either adjacent row', () => {
    expect(
      inlineControlsOnAdjacentCapabilities(CONTROL_MATRIX, ROLES, cellStatus),
    ).toEqual([])
  })

  /* PLANT -> RED -> RESTORE, and the reachability check the brief demanded. */
  it('PLANT: a permissive token on row 2 still renders NO control -- classification wins', () => {
    const real = doh19Row('add-a-part-inline-during-authoring')

    // Reachability first: prove the plant actually changes the token the fold
    // reads, so a pass cannot be a plant that never arrived.
    const planted = {
      ...real,
      status: { ...real.status, TENANT_ADMIN: 'allowed' as ControlStatus },
    } as unknown as Doh19Row
    expect(cellStatus(planted, 'TENANT_ADMIN')).toBe('allowed')
    expect(cellStatus(real, 'TENANT_ADMIN')).toBe('not-applicable')

    // The token is permissive and the answer is still not a control.
    expect(doh19Affordance(planted, 'TENANT_ADMIN').kind).toBe('cross-surface')

    // And the shared gate agrees the row carries no control for anyone.
    expect(
      inlineControlsOnAdjacentCapabilities([planted], ROLES, cellStatus),
    ).toEqual([])

    // RED where the classification is ALSO dropped -- which is the shape that
    // actually ships: the cell reads `Allowed`, the row gets classified by its
    // token, and the button follows honestly from a wrong classification.
    const bothDropped = { ...planted, surface: 'screen' } as unknown as Doh19Row
    expect(doh19Affordance(bothDropped, 'TENANT_ADMIN').kind).toBe('control')

    // RESTORED.
    expect(doh19Affordance(real, 'TENANT_ADMIN').kind).toBe('cross-surface')
  })

  it('the Studio link is CHECKED against the route registry, never asserted', () => {
    const row = doh19Row('add-a-part-inline-during-authoring')

    // Three roles open the Studio, so the statement carries a link.
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      const a = doh19Affordance(row, role)
      expect(a.kind === 'cross-surface' && a.linkHref).toBe('/studio')
    }

    // The Read-only Auditor is DEC-AUDSTU-001: no link is drawn and none is
    // refused. Drawing either answer would settle a decision the source keeps open.
    const auditor = doh19Affordance(row, 'READONLY_AUDITOR')
    expect(auditor.kind === 'cross-surface' && auditor.linkHref).toBeNull()
    expect(auditor.kind === 'cross-surface' && auditor.openDecision).toContain('DEC-AUDSTU-001')

    // The Worker opens neither surface and has no open decision: plain statement.
    const worker = doh19Affordance(row, 'WORKER')
    expect(worker.kind === 'cross-surface' && worker.linkHref).toBeNull()
    expect(worker.kind === 'cross-surface' && worker.openDecision).toBeNull()
  })

  it('row 8 NEVER carries a link: no tenant role opens the platform console', () => {
    const row = doh19Row('set-ingestion-limits-or-storage-metering')
    for (const role of ROLES) {
      const a = doh19Affordance(row, role)
      expect(a.kind === 'cross-surface' && a.linkHref).toBeNull()
      expect(a.kind === 'cross-surface' && a.openDecision).toBeNull()
    }
  })
})

/* ==================================================================== *
 * THE DEFERRAL RULING -- NO CONTROL, A STATED LINE, NEVER A DISABLED ONE.
 * ==================================================================== */

describe('the deferral ruling', () => {
  it('no cell of this card ever renders a disabled control, in any tenant state', () => {
    const kinds = doh19AffordanceKinds(ROLES, WRITE_STATES)
    expect(kinds.has('disabled' as never)).toBe(false)

    // REACHABILITY, not vacuity: a walk producing one kind would satisfy the
    // line above and prove nothing. All four real kinds must appear.
    expect([...kinds].sort()).toEqual(['absent', 'control', 'cross-surface', 'read-only'])
  })

  it('every refusal carries a stated line -- never a blank region', () => {
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        for (const state of WRITE_STATES) {
          const a = doh19Affordance(row, role, state)
          const text =
            a.kind === 'absent' ? a.reason : a.kind === 'cross-surface' ? a.reason : null
          if (text !== null) expect(text.trim().length).toBeGreaterThan(20)
        }
      }
    }
  })

  it('the `Not applicable — same reason` cells carry the REASON, not the pointer', () => {
    // L30071 and L30075 spell four cells "same reason". A screen printing that
    // literally shows a cell that explains nothing.
    for (const id of ['add-a-part-inline-during-authoring', 'type-a-part-number-on-the-floor'] as const) {
      for (const role of ROLES) {
        expect(doh19Row(id).detail[role]).not.toContain('same reason')
        expect(doh19Row(id).detail[role].length).toBeGreaterThan(60)
      }
    }
  })
})

/* ==================================================================== *
 * THE TWO `Allowed with conditions` CELLS ARE NOT THE SAME KIND.
 * ==================================================================== */

describe('a condition that gates, and a condition that does not', () => {
  it('row 1 is blocked in EVERY suspension state -- a permissive token hiding a block', () => {
    expect(L(30070)).toContain(
      'blocked in every suspension state as new-part creation; subject to platform ingestion limits',
    )
    const row = doh19Row('bulk-upload-parts-by-csv')
    expect(cellStatus(row, 'TENANT_ADMIN')).toBe('allowed-with-conditions')
    expect(row.writeAction).toBe('create-part')

    expect(doh19Affordance(row, 'TENANT_ADMIN', 'active').kind).toBe('control')
    for (const state of WRITE_STATES.filter((s) => s !== 'active')) {
      expect(doh19Affordance(row, 'TENANT_ADMIN', state).kind).toBe('absent')
    }
  })

  it('PLANT: dropping the write class ships a live upload control under suspension', () => {
    const real = doh19Row('bulk-upload-parts-by-csv')
    const planted = { ...real, writeAction: null } as unknown as Doh19Row
    // RED: the very defect the gate exists to stop.
    expect(doh19Affordance(planted, 'TENANT_ADMIN', 'soft-suspended').kind).toBe('control')
    // RESTORED.
    expect(doh19Affordance(real, 'TENANT_ADMIN', 'soft-suspended').kind).toBe('absent')
  })

  it('row 4 carries a CONSEQUENCE, not a gate: archiving survives every tenant state', () => {
    expect(L(30073)).toContain(
      'referencing work instructions keep their reference; the archived part is not offered for new references',
    )
    const row = doh19Row('archive-a-part')
    expect(cellStatus(row, 'TENANT_ADMIN')).toBe('allowed-with-conditions')
    // Same token as row 1, opposite kind of condition, so NO write class.
    expect(row.writeAction).toBeNull()
    for (const state of WRITE_STATES) {
      expect(doh19Affordance(row, 'TENANT_ADMIN', state).kind).toBe('control')
    }
  })

  it('only row 1 carries a write class -- the source gates no other write on this card', () => {
    expect(CONTROL_MATRIX.filter((r) => r.writeAction !== null).map((r) => r.id)).toEqual([
      'bulk-upload-parts-by-csv',
    ])
    // And the silence about rows 3 and 4 is RECORDED rather than filled in.
    expect(UNSPECIFIED_IN_SOURCE.map((u) => u.id)).toContain('no-suspension-clause-on-edit-or-archive')
  })
})

/* ==================================================================== *
 * REACH, DERIVED -- NEVER A HAND-WRITTEN RAIL.
 * ==================================================================== */

describe('the reach narrowing, re-measured', () => {
  it('L30074 gives FOUR roles a holding status and the Worker `Unavailable`', () => {
    const cs = cells(L(30074))
    expect(cs).toEqual([
      'View the registry',
      '`Allowed`',
      '`Read-only`',
      '`Read-only`',
      '`Read-only`',
      '`Unavailable`',
    ])
  })

  it('the derived reach is those four, from the matrix and not from catalogue B', () => {
    expect(doh19RolesReaching()).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
  })

  it('catalogue B names TWO, so this screen is the fifth narrowing case', () => {
    expect(cells(L(48100))[3]).toBe('Tenant Admin, Supervisor')
    expect(dohScreenById('SCR-DOH-06').catalogueBRoles).toBe('Tenant Admin, Supervisor')

    const registered = DOH_CATALOGUE_B_REACH_NARROWER.find((n) => n.screenId === 'SCR-DOH-06')
    expect(registered?.omittedRoles).toEqual(['Quality Manager', 'Read-only Auditor'])

    // The wave-0 register and this module's own derivation must agree: the
    // roles the matrix admits minus the two catalogue B names.
    const derived = doh19RolesReaching().filter(
      (r) => r !== 'TENANT_ADMIN' && r !== 'SUPERVISOR',
    )
    expect(derived).toEqual(['QUALITY_MANAGER', 'READONLY_AUDITOR'])
  })

  it('BOTH clauses of the reach rule withhold from the Worker, and neither alone is assumed', () => {
    const screenRows = CONTROL_MATRIX.filter((r) => r.surface === 'screen')
    const workerColumn = screenRows.map((r) => cellStatus(r, 'WORKER'))
    // Clause one: the Worker holds nothing on any screen row.
    expect(workerColumn.some((s) => ['allowed', 'allowed-with-conditions', 'read-only'].includes(s))).toBe(
      false,
    )
    // Clause two: and row 5 marks it `Unavailable` as well.
    expect(workerColumn).toContain('unavailable')
  })

  it('the CLASSIFICATION does not move the reach answer -- measured, not assumed', () => {
    // Reclassifying both adjacent rows back to `screen` yields the same four.
    // So the classification is load-bearing for what RENDERS and is not
    // smuggling a reach decision in behind it.
    const allScreen = CONTROL_MATRIX.map((r) => ({ ...r, surface: 'screen' as const }))
    expect(rolesReachingByMatrix(allScreen, cellStatus)).toEqual(doh19RolesReaching())
  })

  it('PLANT: dropping clause two hands the Worker the module', () => {
    // Reachability: prove the mutant differs from the real rule on THIS matrix.
    const holdsSomething = (role: TenantRoleId) =>
      CONTROL_MATRIX.filter((r) => r.surface === 'screen')
        .map((r) => cellStatus(r, role))
        .some((s) => ['allowed', 'allowed-with-conditions', 'read-only'].includes(s))
    // Clause one alone already withholds the Worker here, so clause two is NOT
    // what narrows this module -- stating that plainly beats implying it.
    expect(holdsSomething('WORKER')).toBe(false)

    // The mutant that DOES move the answer is dropping clause one: reading
    // every row rather than the screen rows only.
    const bothDropped = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']
    expect(doh19RolesReaching()).toEqual(bothDropped)
  })
})

/* ==================================================================== *
 * UPSTREAM DEFECTS, RECORDED RATHER THAN WORKED AROUND.
 * ==================================================================== */

describe('cross-chapter defects this module is the target of', () => {
  it('the part record has TWO disjoint state vocabularies across two chapters', () => {
    // This card, L30060.
    expect(cells(L(30060))).toEqual(['States', 'Part: `active`, `archived`.'])
    // MOD-STU-10, built in slice 5, L33129 -- and the shipped type agrees.
    expect(L(33129)).toContain(
      'The registry record is Skeletal until completed in the Delivery Operations Hub, then Complete.',
    )
    expect(REGISTRY_PART_STATES).toEqual(['Skeletal', 'Complete'])

    // Neither vocabulary contains the other. A part arriving through the seam
    // this module owns lands in a state this module's own card cannot name.
    expect(REGISTRY_PART_STATES as readonly string[]).not.toContain('active')
    expect(REGISTRY_PART_STATES as readonly string[]).not.toContain('archived')
  })

  it('MOD-STU-10 routes a Tenant Admin into a Hub act this matrix does not carry', () => {
    const cs = cells(L(33116))
    expect(cs[0]).toBe('Complete a skeletal part record')
    expect(cs[4]).toBe('Allowed — in the Delivery Operations Hub, subject to its own permissions')

    // ...and there is no such row here. A row is NOT minted to receive it.
    expect(CONTROL_MATRIX.map((r) => r.control)).not.toContain('Complete a skeletal part record')
    expect(DOH_19_FINDINGS.map((f) => f.id)).toContain('studio-points-at-a-hub-row-that-does-not-exist')
  })

  it('every finding is recorded with a locator, including the six the plan did not list', () => {
    expect(DOH_19_FINDINGS.length).toBe(7)
    for (const f of DOH_19_FINDINGS) expect(f.sourceRef).toMatch(/L\d{4,6}/)
  })
})

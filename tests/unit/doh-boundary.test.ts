import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DOH_BOUNDARY_REGISTER,
  adjacentAffordance,
  crossSurfaceStatement,
  dohBoundaryById,
  inlineControlsOnAdjacentCapabilities,
  seamsClaimingAPermanentBoundary,
  type AdjacentRow,
} from '@/surfaces/doh/boundary'
import { DOH_SEAMS } from '@/surfaces/doh/seams'
import { SURFACES } from '@/domain/surfaces'
import { cellStatus, titleCaseCellStatus, type ControlStatus } from '@/surfaces/doh/modules'
import { CONTROL_MATRIX as DEVICES_MATRIX } from '../../app/hub/devices/fixtures'
import { CONTROL_MATRIX as PLATFORM_ADMIN_MATRIX } from '../../app/hub/tenant-view-of-platform-administration/fixtures'
import { CONTROL_MATRIX as TENANT_LIFECYCLE_MATRIX } from '../../app/hub/tenant-lifecycle-and-tier-operations/fixtures'
import { CONTROL_MATRIX as INTEGRATION_MATRIX } from '../../app/hub/integration-surface/fixtures'
import type { TenantRoleId } from '../../app/hub/HubShell'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every claim below about §19.1.2 is checked against
 * the file, not against the brief that sent this task — one brief this
 * week quoted a sentence attributed to the blueprint that is not in it.
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

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE ROW COUNT, MEASURED RATHER THAN ACCEPTED.
 * ==================================================================== */

describe('the boundary register, §19.1.2', () => {
  it('is a table of exactly eight data rows, and the header is not one of them', () => {
    // The dispatch and the plan both write "8 rows at L25717-L25726". The
    // count is right; the span is two lines wide at the top. L25717 is the
    // column header and L25718 the separator, so the DATA is L25719-L25726.
    expect(cells(L(25717))).toEqual([
      'Adjacent capability',
      'Owning surface',
      'What the Delivery Operations Hub contributes',
      'Source status',
    ])
    expect(L(25718)).toBe('|---|---|---|---|')

    const dataRows: string[] = []
    for (let n = 25719; L(n).startsWith('|'); n += 1) dataRows.push(L(n))
    expect(dataRows).toHaveLength(8)
    expect(L(25727).trim()).toBe('')
  })

  it('agrees with the source′s own two statements of its size', () => {
    expect(L(25765)).toContain('all eight registered boundaries route through Hub services')
    expect(L(25777)).toContain('The eight-row boundary register is `SoW Fact` at §4.1.2')
  })

  it('carries every cell of every row verbatim, in source order', () => {
    expect(DOH_BOUNDARY_REGISTER).toHaveLength(8)
    DOH_BOUNDARY_REGISTER.forEach((row, i) => {
      const line = 25719 + i
      const [capability, owner, contributes, status] = cells(L(line))
      expect(row.sourceRef).toBe(`L${line}`)
      expect(row.capability).toBe(capability)
      expect(row.owningSurfaceText).toBe(owner)
      expect(row.hubContributes).toBe(contributes)
      // The source status cell is wrapped in backticks in the table.
      expect(status).toBe(`\`${row.sourceStatus}\``)
    })
  })

  it('resolves each owning-surface cell to the registered surface it names', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      const surface = SURFACES.find((s) => s.id === row.owningSurface)
      expect(surface, row.id).toBeDefined()
      // Not asserted from the field under test: the CELL TEXT has to contain
      // the registry's name for the surface the field claims.
      expect(row.owningSurfaceText.toLowerCase()).toContain(surface!.name.toLowerCase())
    }
  })

  it('spreads across four owning surfaces and reaches no fifth', () => {
    const byId = new Map<string, number>()
    for (const row of DOH_BOUNDARY_REGISTER)
      byId.set(row.owningSurface, (byId.get(row.owningSurface) ?? 0) + 1)
    expect(Object.fromEntries(byId)).toEqual({
      'SURF-SA': 3,
      'SURF-CC': 3,
      'SURF-STU': 1,
      'SURF-FL': 1,
    })
  })

  it('gives every row a unique id and refuses an unknown one', () => {
    const ids = DOH_BOUNDARY_REGISTER.map((r) => r.id)
    expect(new Set(ids).size).toBe(8)
    for (const id of ids) expect(dohBoundaryById(id).id).toBe(id)
    // @ts-expect-error — the runtime guard exists for data loaded past the type.
    expect(() => dohBoundaryById('no-such-boundary')).toThrow(/Unknown/)
  })
})

/* ==================================================================== *
 * THE QUOTATIONS THIS BUILD RENDERS TO. Each one is proved present at
 * the line it is cited from, so no later reader has to take it on trust.
 * ==================================================================== */

describe('the quotations §19.1.2 is built to', () => {
  it('states AC-DOH-012-3 at L25767, in the words the dispatch quoted', () => {
    expect(L(25767)).toContain('a cross-surface link and no inline editing affordance')
    expect(L(25767)).toContain(
      'A Hub screen that touches an adjacent capability renders a cross-surface link and no inline editing affordance for that capability.',
    )
  })

  it('states SB-DOH-003 at L25757, including the link label this build derives', () => {
    expect(L(25757)).toContain(
      'it renders a clearly labelled cross-surface link rather than an inline control',
    )
    expect(L(25757)).toContain('Open in the Standards and Operations Studio')
    expect(L(25757)).toContain('it carries no editing affordance')
    expect(L(25757)).toContain('Tier and cap changes are administered by platform support')
    expect(L(25757)).toContain('it carries no upgrade button')
  })

  it('states the permanence at L25715 and the console′s invisibility at L25707', () => {
    expect(L(25715)).toContain('the Hub does not carry its user interface or its decision rights')
    expect(L(25707)).toContain('the Super Admin platform console has no tenant-visible interface')
  })

  it('states TEST-DOH-012-3 at L25774, which is the gate below', () => {
    expect(L(25774)).toContain(
      'Inspect every Hub screen listed against the boundary register; assert no inline control exists for an adjacent-owned capability.',
    )
  })
})

/* ==================================================================== *
 * THE STATEMENT — link, plain statement, or an open question.
 * ==================================================================== */

const TENANT_ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

describe('crossSurfaceStatement', () => {
  it('derives SB-DOH-003′s own link label, character for character', () => {
    const s = crossSurfaceStatement('workflow-and-instruction-authoring', 'SUPERVISOR')
    expect(s.linkState).toBe('link')
    expect(s.linkLabel).toBe('Open in the Standards and Operations Studio')
    expect(L(25757)).toContain(s.linkLabel!)
    expect(s.linkHref).toBe('/studio')
  })

  it('draws no link at a console no tenant role can open — all three rows, all five roles', () => {
    const consoleRows = DOH_BOUNDARY_REGISTER.filter((r) => r.owningSurface === 'SURF-SA')
    expect(consoleRows).toHaveLength(3)
    for (const row of consoleRows) {
      for (const role of TENANT_ROLES) {
        const s = crossSurfaceStatement(row.id, role)
        expect(s.linkState, `${row.id}/${role}`).toBe('statement')
        expect(s.linkHref).toBeNull()
        expect(s.linkLabel).toBeNull()
      }
    }
  })

  it('says the question is open rather than answering it, where the source leaves it open', () => {
    // The Read-only Auditor and the Studio. Drawing no link here would assert
    // a refusal AC-STU-157 forbids assuming, so the third state exists.
    const s = crossSurfaceStatement('workflow-and-instruction-authoring', 'READONLY_AUDITOR')
    expect(s.linkState).toBe('open-decision')
    expect(s.note).toContain('DEC-AUDSTU-001')
    expect(s.linkHref).toBeNull()
  })

  it('answers every row for every tenant role, and never with a blank note', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      for (const role of TENANT_ROLES) {
        const s = crossSurfaceStatement(row.id, role)
        expect(s.note.trim().length, `${row.id}/${role}`).toBeGreaterThan(0)
        expect(s.owningSurfaceName).not.toMatch(/^SURF-/)
        expect(s.linkHref === null).toBe(s.linkState !== 'link')
      }
    }
  })

  it('links only where the route registry admits the role — not once for the Command Center rows', () => {
    // Consumed from slice 5's routedTo rule: a pointer is rendered only where
    // its target actually permits this persona. The Command Center admits
    // three of the five tenant roles, so the same row answers two ways.
    const linked = TENANT_ROLES.filter(
      (r) => crossSurfaceStatement('custom-report-builder', r).linkState === 'link',
    )
    expect(linked).toEqual(['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'])
  })
})

/* ==================================================================== *
 * THE GATE: no adjacent capability carries an inline control.
 * ==================================================================== */

const ADJACENT_BUT_ALLOWED: AdjacentRow = {
  // The slice-6 shape, by construction, because no shipped row has it yet:
  // MOD-DOH-08 row 7 "Release a Severity 1 lot hold" reads `Allowed` for the
  // Quality Manager at L28307 and the act is Command Center action 4.
  id: 'release-a-severity-1-lot-hold',
  surface: 'another-surface',
}

describe('the gate — the classification decides, not the token', () => {
  it('renders a cross-surface statement for a row whose token reads Allowed', () => {
    expect(adjacentAffordance(ADJACENT_BUT_ALLOWED, 'allowed')).toEqual({
      kind: 'cross-surface',
      boundary: null,
    })
  })

  it('gives the same answer for every one of the six tokens', () => {
    const tokens: readonly ControlStatus[] = [
      'allowed',
      'allowed-with-conditions',
      'read-only',
      'explicitly-prohibited',
      'not-applicable',
      'unavailable',
    ]
    for (const token of tokens) {
      expect(adjacentAffordance(ADJACENT_BUT_ALLOWED, token).kind, token).toBe('cross-surface')
    }
  })

  it('leaves a screen row alone — the gate narrows nothing it was not asked to', () => {
    expect(adjacentAffordance({ id: 'draft-a-job', surface: 'screen' }, 'allowed').kind).toBe(
      'own-row',
    )
    expect(
      adjacentAffordance({ id: 'see-the-suspension-banner', surface: 'chrome' }, 'read-only').kind,
    ).toBe('own-row')
  })

  it('attaches the register row where the pointer names one', () => {
    const a = adjacentAffordance(
      { id: 'grant-a-clearance', surface: 'another-surface', boundary: 'qualification-clearance-granting' },
      'allowed',
    )
    expect(a.kind).toBe('cross-surface')
    expect(a.kind === 'cross-surface' && a.boundary?.sourceRef).toBe('L25724')
  })

  it('reports a row that would carry a control for an adjacent capability', () => {
    // Not derived from the fold: the offender list is built from a row whose
    // classification and pointer disagree, which is the shape that ships.
    const misclassified: AdjacentRow = {
      id: 'release-a-severity-1-lot-hold',
      surface: 'screen',
      boundary: 'qualification-clearance-granting',
    }
    expect(
      inlineControlsOnAdjacentCapabilities([misclassified], TENANT_ROLES, () => 'allowed'),
    ).toEqual([
      'release-a-severity-1-lot-hold: points at boundary `qualification-clearance-granting` and is classified `screen`',
    ])
  })

  it('passes a correctly classified adjacent row carrying the same pointer', () => {
    const correct: AdjacentRow = {
      id: 'release-a-severity-1-lot-hold',
      surface: 'another-surface',
      boundary: 'qualification-clearance-granting',
    }
    expect(inlineControlsOnAdjacentCapabilities([correct], TENANT_ROLES, () => 'allowed')).toEqual(
      [],
    )
  })

  it('walks every adjacent row of every shipped Hub matrix, and the walk is not empty', () => {
    const offenders = [
      ...inlineControlsOnAdjacentCapabilities(DEVICES_MATRIX, TENANT_ROLES, cellStatus),
      ...inlineControlsOnAdjacentCapabilities(PLATFORM_ADMIN_MATRIX, TENANT_ROLES, cellStatus),
      ...inlineControlsOnAdjacentCapabilities(
        TENANT_LIFECYCLE_MATRIX,
        TENANT_ROLES,
        titleCaseCellStatus,
      ),
      ...inlineControlsOnAdjacentCapabilities(
        INTEGRATION_MATRIX,
        TENANT_ROLES,
        titleCaseCellStatus,
      ),
    ]
    expect(offenders).toEqual([])

    // A walk that scanned nothing would report the same empty list. Counted
    // rather than assumed: fourteen adjacent rows across the four matrices.
    const adjacent = [
      ...DEVICES_MATRIX,
      ...PLATFORM_ADMIN_MATRIX,
      ...TENANT_LIFECYCLE_MATRIX,
      ...INTEGRATION_MATRIX,
    ].filter((r) => r.surface === 'another-surface')
    expect(adjacent).toHaveLength(14)
  })
})

/* ==================================================================== *
 * THE SPLIT: a seam is a schedule, a boundary is a place.
 * ==================================================================== */

describe('SeamNotice and CrossSurfaceStatement stay distinct', () => {
  it('finds no registered seam claiming an act that permanently lives elsewhere', () => {
    expect(seamsClaimingAPermanentBoundary(DOH_SEAMS)).toEqual([])
    expect(DOH_SEAMS.length).toBeGreaterThan(0)
  })

  it('catches a boundary wearing a seam′s wording', () => {
    expect(
      seamsClaimingAPermanentBoundary([
        { id: 'custom-report-builder', ownerModule: 'Client Command Center' },
        { id: 'qualification-gate', ownerModule: 'MOD-DOH-06 / MOD-DOH-07' },
      ]),
    ).toEqual(['custom-report-builder'])
  })

  it('gives every seam a Hub module owner and a slice number, which is what makes it a schedule', () => {
    for (const seam of DOH_SEAMS) {
      expect(seam.ownerModule, seam.id).toMatch(/^MOD-DOH-\d{2}( \/ MOD-DOH-\d{2})*$/)
      expect(Number.isInteger(seam.ownerSlice), seam.id).toBe(true)
    }
  })

  it('names no boundary capability among the seams', () => {
    const seamIds = new Set<string>(DOH_SEAMS.map((s) => s.id))
    for (const row of DOH_BOUNDARY_REGISTER) expect(seamIds.has(row.id), row.id).toBe(false)
  })
})

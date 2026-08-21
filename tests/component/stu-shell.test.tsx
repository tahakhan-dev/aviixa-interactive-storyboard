import { describe, it, expect, afterAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { execFileSync } from 'node:child_process'
import { rmSync, mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ownProbeDir, withPlanted as plantProbe } from '../probe-paths'
import { surfaceById } from '@/domain/surfaces'
import { routeBySurface } from '@/routes/definitions'
import type { PermissionOutcome } from '@/policy/decision'
import {
  STU_MODULES,
  STU_PERSONAS,
  STUDIO_MATRIX_ROW_SURFACES,
  STUDIO_MODULE_REACH_STATES,
  reachByStudioMatrix,
  stuModuleById,
  stuModulesReachedBy,
  stuPersonaById,
  type StudioMatrixRowSurface,
  type StudioModuleDefinition,
  type StudioPersonaId,
} from '@/studio/modules'
import {
  STU_SCREENS,
  STU_CATALOGUE_A_SUBVIEWS,
  STU_UNCATALOGUED_SCREEN_NAMES,
  stuScreensForModule,
} from '@/studio/screens'
import { STU_SEAMS, STU_OWNED_SEAMS, stuSeamById, stuSeamStatus } from '@/studio/seams'
import { STUDIO_PERSONA_COLUMNS } from '@/studio/access/evaluate'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { StudioShell } from '../../app/studio/StudioShell'
import StudioHome, { StudioShell as StudioShellFromPage } from '../../app/studio/page'

const SURFACE = surfaceById('SURF-STU')

/* ==================================================================== *
 * A. THE MODULE REGISTRY — contents, never cardinality.
 *
 * The plan's standing ruling: "the census does not reconcile with itself
 * — 239 rows claimed against 229 by its own per-module tables … No gate
 * may key on those numbers. Contents, never cardinality." So nothing
 * below asserts 18, 15, 25 or 5 as a number. Every assertion names the
 * rows it expects and would go red on a substitution as readily as on a
 * deletion.
 * ==================================================================== */

/**
 * The frozen source's own derived inventory, L30913-L30930, transcribed
 * id by id. Not a count — a map. Reword one name, drop one id, or add a
 * nineteenth, and this fails.
 */
const SOURCE_INVENTORY: Readonly<Record<string, string>> = {
  'MOD-STU-01': 'Charter and Position',
  'MOD-STU-02': 'Agent Configuration',
  'MOD-STU-03': 'Workflow Library and Tenant Workspace',
  'MOD-STU-04': 'Workflow Builder',
  'MOD-STU-05': 'Screen Authoring — the Nine Configuration Sections',
  'MOD-STU-06': 'Shared Instruction Blocks',
  'MOD-STU-07': 'Content Libraries',
  'MOD-STU-08': 'Training Library',
  'MOD-STU-09': 'Work-Instruction Difficulty Levels',
  'MOD-STU-10': 'Parts-Registry Authoring Seam',
  'MOD-STU-11': 'Approval Workflow',
  'MOD-STU-12': 'Versioning and Publication',
  'MOD-STU-13': 'Qualification Requirements',
  'MOD-STU-14': 'Offline Package',
  'MOD-STU-15': 'Agent Builder',
  'MOD-STU-16': 'Memory and the Two-Lane Learning Loop',
  'MOD-STU-17': 'Localisation',
  'MOD-STU-18': 'Permissions and Roles in the Studio',
}

describe('the Studio module registry', () => {
  // RED when: any module name is reworded, any id is dropped, or a
  // nineteenth id appears that the source's inventory does not carry.
  it('carries the source inventory name at every source inventory id', () => {
    const built = Object.fromEntries(STU_MODULES.map((m) => [m.id, m.name]))
    expect(built).toEqual(SOURCE_INVENTORY)
  })

  // RED when: a module is added or edited so that it carries neither a
  // catalogue-B row nor an uncatalogued-screen note. A module with no
  // annotation at all is the silent gap this exists to prevent — and the
  // "both" half stops a module double-annotating itself out of the D1
  // ruling.
  it('gives every module exactly one screen annotation — a catalogue-B row or a declared absence', () => {
    for (const m of STU_MODULES) {
      const catalogued = stuScreensForModule(STU_SCREENS, m.id)
      const declaredAbsent = m.uncataloguedScreen !== null
      expect(catalogued.length > 0, `${m.id} has no annotation of either kind`).toBe(
        !declaredAbsent,
      )
    }
  })

  // RED when: a slug becomes a screen number (D1 — "a slug is never a
  // screen number"), or when MOD-STU-09/10 gain a route the source does
  // not give them, or when MOD-STU-02 and MOD-STU-15 stop sharing one.
  it('keeps every slug a plain name, never a screen id', () => {
    for (const m of STU_MODULES) {
      if (m.slug === null) continue
      expect(m.slug, m.id).not.toMatch(/scr[-_]?stu/i)
      expect(m.slug, m.id).not.toMatch(/\d/)
    }
    expect(stuModuleById(STU_MODULES, 'MOD-STU-09').slug).toBeNull()
    expect(stuModuleById(STU_MODULES, 'MOD-STU-10').slug).toBeNull()
    expect(stuModuleById(STU_MODULES, 'MOD-STU-02').slug).toBe('agents')
    expect(stuModuleById(STU_MODULES, 'MOD-STU-15').slug).toBe('agents')
  })

  // RED when: a module without a route is given one silently — the reason
  // a module has no route is stated, never left blank.
  it('states why each routeless module has no route', () => {
    for (const m of STU_MODULES) {
      if (m.slug !== null) continue
      expect(m.noRouteReason, m.id).toBeTruthy()
    }
  })
})

const catalogueBIds = new Set<string>(STU_SCREENS.map((s) => s.id))

describe('screen catalogue B', () => {
  /**
   * The source's own "Modules and features shown" column, L48259-L48273.
   * RED when: `SCR-STU-13` is widened to claim `MOD-STU-01` or
   * `MOD-STU-16` — neither of which the source's row names — or when any
   * screen's module column is edited.
   */
  const SOURCE_COLUMN: Readonly<Record<string, readonly string[]>> = {
    'SCR-STU-01': ['MOD-STU-18'],
    'SCR-STU-02': ['MOD-STU-03'],
    'SCR-STU-03': ['MOD-STU-04'],
    'SCR-STU-04': ['MOD-STU-05'],
    'SCR-STU-05': ['MOD-STU-06'],
    'SCR-STU-06': ['MOD-STU-07'],
    'SCR-STU-07': ['MOD-STU-07'],
    'SCR-STU-08': ['MOD-STU-07'],
    'SCR-STU-09': ['MOD-STU-08'],
    'SCR-STU-10': ['MOD-STU-13'],
    'SCR-STU-11': ['MOD-STU-11'],
    'SCR-STU-12': ['MOD-STU-12'],
    'SCR-STU-13': ['MOD-STU-02', 'MOD-STU-15'],
    'SCR-STU-14': ['MOD-STU-17'],
    'SCR-STU-15': ['MOD-STU-18'],
  }

  it("reproduces the source's own module column, screen by screen", () => {
    const built = Object.fromEntries(STU_SCREENS.map((s) => [s.id, [...s.moduleIds]]))
    expect(built).toEqual(SOURCE_COLUMN)
  })

  // RED when: a three-digit `SCR-STU-NNN` literal is minted. Slice 4's two
  // catalogues collided on exactly that shape; D1 records that catalogue A
  // and B share no token here, and this keeps it true.
  it('mints no three-digit screen literal anywhere in the catalogue', () => {
    const text =
      readFileSync('src/studio/screens.ts', 'utf8') + readFileSync('src/studio/modules.ts', 'utf8')
    // The lookbehind exempts `AC-SCR-STU-001`, the source's own acceptance
    // criterion asserting all fifteen screens exist, which must stay
    // quotable. What is forbidden is a bare three-digit SCREEN literal.
    expect(text).not.toMatch(/(?<![A-Za-z0-9-])SCR-STU-\d{3}\b/)
  })

  // RED when: one of the nineteen one-off storyboard literals is promoted
  // to a route. D1: "none becomes a route."
  it('records the one-off storyboard names and makes none of them a route', () => {
    const slugs = new Set<string>(STU_MODULES.map((m) => m.slug).filter((s) => s !== null))
    expect(STU_UNCATALOGUED_SCREEN_NAMES.map((n) => n.name)).toContain('SCR-STU-RELEASE')
    expect(STU_UNCATALOGUED_SCREEN_NAMES.map((n) => n.name)).toContain('SCR-STU-PUB-01')
    for (const one of STU_UNCATALOGUED_SCREEN_NAMES) {
      expect(one.sourceRef, one.name).toBeTruthy()
      expect(slugs.has(one.name.toLowerCase()), one.name).toBe(false)
      expect(catalogueBIds.has(one.name), one.name).toBe(false)
    }
  })

  // RED when: one of catalogue A's three orphans is minted as a new screen
  // id instead of registered as a sub-view of its catalogue-B parent (D1).
  it("registers catalogue A's three orphans as sub-views of catalogue-B parents", () => {
    const byName = Object.fromEntries(STU_CATALOGUE_A_SUBVIEWS.map((v) => [v.name, v.parentScreenId]))
    expect(byName).toEqual({
      'SCR-STU-LEARN': 'SCR-STU-13',
      'SCR-STU-PARTADD': 'SCR-STU-04',
      'SCR-STU-DRAFTAI': 'SCR-STU-11',
    })
    for (const v of STU_CATALOGUE_A_SUBVIEWS) {
      expect(catalogueBIds.has(v.name), v.name).toBe(false)
    }
  })
})

/* ==================================================================== *
 * B. THE REACH RULE — one implementation, measured rather than asserted.
 * ==================================================================== */

interface ProbeRow {
  readonly id: string
  readonly surface: StudioMatrixRowSurface
  readonly cells: Readonly<Record<StudioPersonaId, PermissionOutcome>>
}

function cells(overrides: Partial<Record<StudioPersonaId, PermissionOutcome>>) {
  const base = Object.fromEntries(
    STU_PERSONAS.map((p) => [p.id, 'explicitlyProhibited' as PermissionOutcome]),
  ) as Record<StudioPersonaId, PermissionOutcome>
  return { ...base, ...overrides }
}

const statusOf = (row: ProbeRow, persona: StudioPersonaId): PermissionOutcome => row.cells[persona]

describe('reachByStudioMatrix — the one rule', () => {
  // RED when: clause one is dropped. A chrome row is met on every route
  // regardless of what the rail offers, so holding one says nothing about
  // module standing — this is the defect the classification exists for.
  it('counts a module screen row and never a chrome row', () => {
    const chromeOnly: readonly ProbeRow[] = [
      { id: 'chrome', surface: 'chrome', cells: cells({ 'tenant-admin': 'allowed' }) },
      { id: 'screen', surface: 'screen', cells: cells({ 'quality-manager': 'allowed' }) },
    ]
    const reach = reachByStudioMatrix(chromeOnly, statusOf)
    expect(reach['tenant-admin']).toBe('withheld')
    expect(reach['quality-manager']).toBe('offered')
  })

  // RED when: a capability met on another surface is counted as module
  // standing. R22's five cross-surface statements are exactly this shape.
  it('counts no another-surface row', () => {
    const rows: readonly ProbeRow[] = [
      { id: 'cc', surface: 'another-surface', cells: cells({ 'quality-manager': 'allowed' }) },
      { id: 'own', surface: 'screen', cells: cells({ 'tenant-admin': 'readOnly' }) },
    ]
    const reach = reachByStudioMatrix(rows, statusOf)
    expect(reach['quality-manager']).toBe('withheld')
    expect(reach['tenant-admin']).toBe('offered')
  })

  // RED when: `clientDecisionRequired` is collapsed onto either side.
  // `AC-STU-157` (L34674): the Read-only Auditor's Studio access "is not
  // assumed". Reading it as a grant asserts access the source withholds;
  // reading it as a refusal pre-empts `DEC-AUDSTU-001` in the direction
  // `AC-STU-157` forbids, which is the live defect plan C16 names.
  it('resolves an open client decision to its own third state, never to a grant or a refusal', () => {
    const rows: readonly ProbeRow[] = [
      {
        id: 'open',
        surface: 'screen',
        cells: cells({ 'read-only-auditor': 'clientDecisionRequired' }),
      },
    ]
    const reach = reachByStudioMatrix(rows, statusOf)
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['worker']).toBe('withheld')
  })

  // RED when: a grant elsewhere in the column silently outranks the open
  // decision, or the reverse. A persona that holds something on the screen
  // is offered the route; the open decision only decides a column with
  // nothing else in it.
  it('prefers a real grant over an open decision in the same column', () => {
    const rows: readonly ProbeRow[] = [
      { id: 'a', surface: 'screen', cells: cells({ 'quality-manager': 'clientDecisionRequired' }) },
      { id: 'b', surface: 'screen', cells: cells({ 'quality-manager': 'readOnly' }) },
    ]
    expect(reachByStudioMatrix(rows, statusOf)['quality-manager']).toBe('offered')
  })

  // RED when: the connectivity row is allowed to withhold. `MOD-STU-18`
  // row 23 (L34563) reads `Unavailable` in seven of eight columns, and D9
  // reads that as sense A, the connectivity axis — DISABLED with the
  // condition named, not a role-level withholding. It is a chrome row, and
  // clause one is what keeps it out of the reach answer.
  it('lets a connectivity row withhold nobody', () => {
    const rows: readonly ProbeRow[] = [
      { id: 'screen', surface: 'screen', cells: cells({ 'quality-manager': 'allowed' }) },
      {
        id: 'offline',
        surface: 'chrome',
        cells: cells({ 'quality-manager': 'unavailable', worker: 'explicitlyProhibited' }),
      },
    ]
    expect(reachByStudioMatrix(rows, statusOf)['quality-manager']).toBe('offered')
  })

  // RED when: a fourth row surface is added to the union without being
  // added to the array, or a fourth reach state invented. Both are the
  // `Exclude<…> extends never` proof restated where a reader can see it.
  it('closes both vocabularies at their source members', () => {
    expect([...STUDIO_MATRIX_ROW_SURFACES]).toEqual(['screen', 'chrome', 'another-surface'])
    expect([...STUDIO_MODULE_REACH_STATES]).toEqual([
      'offered',
      'withheld',
      'client-decision-open',
    ])
  })

  // RED when: a matrix with no screen row silently produces a withheld
  // column for everybody instead of saying it cannot answer.
  it('refuses to answer from a matrix carrying no screen row', () => {
    const rows: readonly ProbeRow[] = [
      { id: 'chrome', surface: 'chrome', cells: cells({ 'tenant-admin': 'allowed' }) },
    ]
    expect(() => reachByStudioMatrix(rows, statusOf)).toThrow(/no row is classified/i)
  })
})

/* ==================================================================== *
 * C. THE SEAM REGISTRY
 * ==================================================================== */

/** Census §6.3 — the five with no owning slice anywhere. */
/**
 * FOUR, NOT FIVE. `parts-registry` was the fifth until slice 6 shipped
 * `MOD-DOH-19`; its row now carries `ownerSlices: [6]` and reads
 * `scheduled`. It is asserted separately below, because "this seam stopped
 * being unscheduled" is a different claim from "these four still are".
 */
const UNSCHEDULED = [
  'severity-action-bundle-editor',
  'tag-to-qualification-set-mapping',
  'composed-agent-platform-review-queue',
  'multimodal-embedding-service',
] as const

describe('the cross-slice seam registry', () => {
  // RED when: one of the five borrows the nearest slice number rather than
  // declaring the absence. Slice 4 hit two unregistered dependencies and
  // both declared them; this keeps that.
  it('declares the four still-unregistered dependencies with an owner and no slice', () => {
    for (const id of UNSCHEDULED) {
      const seam = stuSeamById(STU_SEAMS, id)
      expect(seam.ownerSlices, id).toEqual([])
      expect(seam.owner, id).toBeTruthy()
      expect(stuSeamStatus(seam), id).toBe('unscheduled')
    }
    // And the list is the whole of them: a sixth row quietly losing its
    // slice would otherwise be invisible here.
    expect(STU_SEAMS.filter((s) => stuSeamStatus(s) === 'unscheduled').map((s) => s.id)).toEqual([
      ...UNSCHEDULED,
    ])
  })

  it('no longer declares the parts registry unscheduled, because its owner shipped', () => {
    const seam = stuSeamById(STU_SEAMS, 'parts-registry')
    expect(seam.ownerSlices).toEqual([6])
    expect(stuSeamStatus(seam)).toBe('scheduled')
  })

  // RED when: a forward seam is marked built, or a consumption seam is
  // marked forward — the status is derived from the owning slices, so a
  // hand edit to either cannot make them disagree.
  it('derives built, scheduled and unscheduled from the owning slices', () => {
    expect(stuSeamStatus(stuSeamById(STU_SEAMS, 'grant-assignment-and-revocation'))).toBe('built')
    expect(stuSeamStatus(stuSeamById(STU_SEAMS, 'evaluation-harness'))).toBe('built')
    expect(stuSeamStatus(stuSeamById(STU_SEAMS, 'job-and-run-linkage-counts'))).toBe('scheduled')
    expect(stuSeamStatus(stuSeamById(STU_SEAMS, 'tenant-audit-log'))).toBe('scheduled')
    expect(stuSeamStatus(stuSeamById(STU_SEAMS, 'package-delivery-on-device'))).toBe('scheduled')
  })

  // RED when: a seam ships with a blank contract sentence or no consumer.
  // A seam row with nothing on it is the silent stub R10 exists for.
  it('gives every seam a consuming module and a contract sentence', () => {
    for (const seam of STU_SEAMS) {
      expect(seam.consumingModules.length, seam.id).toBeGreaterThan(0)
      expect(seam.contract, seam.id).toBeTruthy()
      expect(seam.sourceRef, seam.id).toBeTruthy()
      for (const id of seam.consumingModules) {
        expect(STU_MODULES.some((m) => m.id === id), `${seam.id} -> ${id}`).toBe(true)
      }
    }
  })

  // RED when: an outbound seam the Studio owns is dropped. §6.4 — these
  // are what later slices consume FROM here, and forgetting them is how a
  // handover goes missing.
  it('registers the seams the Studio owns for later slices', () => {
    expect(STU_OWNED_SEAMS.map((s) => s.id)).toEqual([
      'work-package-definition-and-manifest',
      'agent-operating-parameters',
      'threshold-and-deviation-rule-context',
      'escalation-routing-rules',
      'procedural-and-semantic-memory-writes',
    ])
    for (const s of STU_OWNED_SEAMS) {
      expect(s.consumingSlices.length, s.id).toBeGreaterThan(0)
      expect(s.contract, s.id).toBeTruthy()
    }
  })
})

describe('StudioSeamNotice', () => {
  // RED when: the notice invents a slice for a seam that has none. The
  // exact sentence the brief requires.
  it('says "owner stated, no slice assigned" for an unscheduled seam', () => {
    // `parts-registry` used to be the example here and is not any more:
    // slice 6 shipped MOD-DOH-19, so that row carries ownerSlices [6].
    render(<StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'multimodal-embedding-service')} />)
    const ownership = screen.getByTestId('seam-ownership').textContent ?? ''
    expect(ownership).toMatch(/owner stated, no slice assigned/i)
    expect(ownership).toMatch(/Gemini Embedding/)
    // The ownership line may quote the source saying the counterpart is
    // named in NO later slice; what it may never do is claim one owns it.
    expect(ownership).not.toMatch(/(owned by|built in) slices? \d/i)
  })

  // RED when: a scheduled seam stops naming the slice that owns it.
  it('names the owning slice for a scheduled seam', () => {
    render(<StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'lane-b-decision')} />)
    expect(screen.getByTestId('seam-ownership').textContent ?? '').toMatch(/owned by slice 9/i)
  })

  // RED when: an already-built seam is drawn as if it were missing. A
  // notice that says "not built here" over slice 4's live grant registry
  // is a false absence.
  it('draws an already-built seam as consumption, not as an absence', () => {
    render(<StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'grant-assignment-and-revocation')} />)
    expect(screen.getByTestId('seam-ownership').textContent ?? '').toMatch(/built in slice 4/i)
    expect(screen.getByRole('note').textContent).not.toMatch(/not built here/i)
  })
})

/* ==================================================================== *
 * D. THE SHELL
 * ==================================================================== */

const PERMITTED = 'quality-manager' as const

/**
 * A registry the test controls, so the index's own decisions can be driven
 * on data the live registry does not carry yet.
 *
 * WHY THIS EXISTS. Every real module has `routeBuilt === false` in this
 * wave, so "offers no link for a module whose reach is not derived" was
 * satisfied by the route not existing — inverting the reach check left the
 * suite green, which is a test that passes on the code and on its own
 * negation. These two rows separate the reasons: both have a built route,
 * one has a derived reach and one has not, so the link and its absence are
 * each caused by the thing being asserted.
 */
const BASE = stuModuleById(STU_MODULES, 'MOD-STU-03')
const ALL_OFFERED = Object.fromEntries(
  STU_PERSONAS.map((p) => [p.id, 'offered' as const]),
) as Record<StudioPersonaId, 'offered'>

const SYNTHETIC: readonly StudioModuleDefinition[] = [
  { ...BASE, routeBuilt: true, reach: ALL_OFFERED },
  { ...stuModuleById(STU_MODULES, 'MOD-STU-04'), routeBuilt: true, reach: null },
  {
    ...stuModuleById(STU_MODULES, 'MOD-STU-05'),
    routeBuilt: true,
    reach: { ...ALL_OFFERED, 'quality-manager': 'withheld' },
  },
]

describe('StudioShell — the index draws links from the derivation, not from the route', () => {
  // RED when: `linkFor` stops failing closed on an underived reach — proven
  // on a module whose ROUTE EXISTS, so the route's absence cannot be what
  // satisfies it.
  it('links a module with a derived reach and refuses one without, on the same built routes', () => {
    render(<StudioShell modules={SYNTHETIC} />)

    const offered = screen.getByTestId('module-row-MOD-STU-03')
    const link = within(offered).getByRole('link')
    expect(link.getAttribute('href')).toMatch(/^\/studio\/workflow-library\/?$/)

    const underived = screen.getByTestId('module-row-MOD-STU-04')
    expect(within(underived).queryByRole('link')).toBeNull()
    expect(underived.textContent ?? '').toMatch(/permission matrix is not built/i)

    const withheld = screen.getByTestId('module-row-MOD-STU-05')
    expect(within(withheld).queryByRole('link')).toBeNull()
    expect(withheld.textContent ?? '').toMatch(/withholds it from the Quality Manager view/i)
  })

  // RED when: a persona the source prohibits outright is offered a link on
  // a module whose matrix would otherwise grant it. Proven on the same
  // fully-offered row above, so the refusal is the persona's and not the
  // module's.
  it('offers the Worker no link even on a module every persona is offered', () => {
    render(<StudioShell modules={SYNTHETIC} persona="worker" />)
    expect(screen.queryAllByRole('link')).toEqual([])
  })

  // RED when: the Read-only Auditor is offered a route while
  // DEC-AUDSTU-001 is open — asserting an access the decision has not
  // granted, which is the mirror of the C16 defect.
  it('offers the Read-only Auditor no link while DEC-AUDSTU-001 is open', () => {
    render(<StudioShell modules={SYNTHETIC} persona="read-only-auditor" />)
    expect(screen.queryAllByRole('link')).toEqual([])
  })

  // RED when: a link is ever assembled from a screen id. Non-vacuous: the
  // floor below fails if the synthetic registry stops producing links at
  // all, which is what made the same assertion over the live registry
  // unable to fail.
  it('keys the links it does render on the slug, never on a screen id', () => {
    render(<StudioShell modules={SYNTHETIC} />)
    const hrefs = screen
      .queryAllByRole('link')
      .map((l) => l.getAttribute('href') ?? '')
      .filter((h) => h.startsWith('/studio/') && h !== '/studio/')
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).not.toMatch(/scr-stu/i)
      const slug = href.replace(/^\/studio\//, '').replace(/\/$/, '')
      expect(STU_MODULES.some((m) => m.slug === slug), href).toBe(true)
    }
  })
})

describe('StudioShell — the module index', () => {
  it('renders one h1 and a main landmark', () => {
    render(<StudioShell />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('main')).toBeDefined()
    expect(screen.getByText(SURFACE.purpose)).toBeDefined()
  })

  // The brief's step 1, and `AC-STU-014` (L30992): no document, screen or
  // interface produced by this programme presents a Studio module count as
  // a Statement-of-Work fact.
  //
  // RED when: the qualifier or `DEC-STUDIO-001` is dropped from the
  // element that prints the count.
  it('renders the module count with its derived qualifier and DEC-STUDIO-001', () => {
    render(<StudioShell />)
    const scope = screen.getByTestId('module-count-scope')
    expect(scope.textContent ?? '').toMatch(/18|eighteen/i)
    expect(scope.textContent ?? '').toMatch(/derived count, not stated in the Statement of Work/i)
    expect(scope.textContent ?? '').toMatch('DEC-STUDIO-001')
  })

  // RED when: a count appears anywhere on the index outside the scoped
  // element that carries the qualifier. This is the half that stops the
  // qualifier being satisfied once and the bare number printed twice.
  it('prints no module count outside that scope', () => {
    render(<StudioShell />)
    const main = screen.getByRole('main')
    const scope = screen.getByTestId('module-count-scope')
    const clone = main.cloneNode(true) as HTMLElement
    const scopeInClone = clone.querySelector('[data-testid="module-count-scope"]')
    scopeInClone?.remove()
    // Not `\b18\b`: every module identifier ends in a two-digit number, and
    // `MOD-STU-18` would match a word-boundary regex. The lookarounds ask
    // the real question — a count standing on its own, not the tail of an
    // identifier.
    const BARE_COUNT = /(?<![-\w])(18|eighteen)(?![-\w])/i
    // The regex is proved able to match FIRST, on the one element that is
    // supposed to carry the count. Without this the "not" below passes just
    // as happily on a regex that matches nothing at all.
    expect(scope.textContent ?? '').toMatch(BARE_COUNT)
    expect(clone.textContent ?? '').not.toMatch(BARE_COUNT)
  })

  // RED when: a module is added to the registry and the index stops
  // listing it, or a module renders with no annotation at all.
  it('lists every module with its id and an annotation', () => {
    render(<StudioShell />)
    for (const m of STU_MODULES) {
      const row = screen.getByTestId(`module-row-${m.id}`)
      expect(row.textContent ?? '', m.id).toContain(m.id)
      expect(row.textContent ?? '', m.id).toContain(m.name)
      const annotation = within(row).getByTestId(`annotation-${m.id}`)
      expect(annotation.textContent?.trim(), m.id).toBeTruthy()
    }
  })

  // RED when: the index links a module the source gives no route of its
  // own, or lets that row go quiet about why. Fail closed (S1, L34605):
  // where the layer that answers is unreachable the Studio "permits nothing
  // beyond published read", and a row that says nothing is the blank cell
  // L10238 prohibits.
  //
  // THIS CASE LOST ITS SECOND ARM, AND THE ARM WAS DELETED RATHER THAN
  // WEAKENED. It also walked the modules that HAVE a route but whose reach
  // is not derived, and pinned that set non-empty. The set is empty now:
  // all eighteen module matrices have landed and
  // `registries/generated/stu/module-reach.json` carries a derivation for
  // every one, so `slug !== null && reach === null` is unreachable over the
  // live registry. Pinning it non-empty makes the suite go red when the
  // product improves, which is the wrong direction for a guard to point.
  //
  // WHAT IT PROTECTED IS STILL PROVED, AND PROVED HARDER, by "links a
  // module with a derived reach and refuses one without, on the same built
  // routes" above: that case drives `linkFor` over the `modules` prop on a
  // row with `routeBuilt: true` and `reach: null`, so the missing link is
  // caused by the reach rule and not by the route not existing — the exact
  // vacuity `StudioShellProps.modules` was added to break. Re-pointing this
  // arm at the same prop would have shipped a second spelling of it.
  it('offers no link for a module the source gives no route, and says so', () => {
    render(<StudioShell />)
    let checked = 0
    for (const m of STU_MODULES) {
      if (m.slug !== null) continue
      const row = screen.getByTestId(`module-row-${m.id}`)
      // A module the source gives no route renders its own reason, which is
      // about the source and not about this wave.
      expect(within(row).queryByRole('link'), m.id).toBeNull()
      expect(row.textContent ?? '', m.id).toMatch(/no route of its own/i)
      checked += 1
    }
    // A loop over an empty set passes every assertion inside it.
    expect(checked).toBeGreaterThan(0)
  })

  // WAVE 1 WROTE THIS CASE AS "no module route is built yet, so the rail
  // offers nothing" — true when it was written, over a registry with zero
  // built routes. Wave 2 built three (MOD-STU-01, MOD-STU-11, MOD-STU-18),
  // which makes that premise false by design, not a defect: once routes
  // exist, a rail that still offers nothing is the broken navigation
  // surface, and offering a route that does not exist is the other broken
  // shape. The risk inverted, so this re-points to what stays true on
  // either side of that line — the same shape SURF-DOH's HubShell already
  // proved for its own rail (`dohModulesReachedBy`, cross-checked in
  // `tests/component/doh-shell.test.tsx`): the rail offers exactly the
  // module routes this persona reaches, and no others.
  //
  // DERIVED, NOT HAND-LISTED, on both sides of the comparison.
  // `stuModulesReachedBy` is `STU_MODULES`'s own published answer to "which
  // routes does this persona reach", and `routeBuilt` inside it is derived
  // from the tree by `scripts/build-stu-module-reach.mjs` — the same reason
  // `tests/e2e/exported-routes.ts` walks `out/` instead of maintaining a
  // path list by hand. Nothing here is a count or a hand-picked module id,
  // so a fourth route landing needs no edit to this test to stay covered.
  //
  // RED in EITHER direction: an extra link `linkFor` renders for a module
  // `stuModulesReachedBy` does not name fails `toEqual` on the surplus
  // element (a route offered that should not exist); a link `linkFor`
  // withholds for a module `stuModulesReachedBy` does name fails it on the
  // missing element (the wave-1 shape, offering nothing once routes exist).
  // Both proven by planting each defect directly in StudioShell.tsx and
  // reverting — see the report.
  it('offers exactly the module routes the quality manager reaches, and no others', () => {
    render(<StudioShell />)
    // next/link normalises the trailing slash outside a running Next app
    // router (same precedent as tests/component/doh-shell.test.tsx and the
    // slug-keying case above), so both sides compare with it stripped.
    const hrefs = screen
      .queryAllByRole('link')
      .map((l) => (l.getAttribute('href') ?? '').replace(/\/$/, ''))
      .filter((h) => h.startsWith('/studio/') && h !== '/studio')
    const expected = stuModulesReachedBy(STU_MODULES, PERMITTED).map((m) => `/studio/${m.slug}`)
    // Not vacuous: today at least one built route is reached, so this
    // cannot pass by both sides being empty.
    expect(expected.length).toBeGreaterThan(0)
    expect(hrefs).toEqual(expected)
  })
})

describe('StudioShell — the persona switcher', () => {
  /**
   * TWO FILES DERIVED THE SAME EIGHT COLUMNS FROM L34539 IN THE SAME WAVE,
   * and this is what stops that becoming two vocabularies.
   *
   * `src/studio/modules.ts` owns the persona columns under plan C2 (the
   * matrix-row vocabulary) and `src/studio/access/evaluate.ts` owns the
   * evaluator's input types under C19; both needed the column set, and both
   * wrote one. The eighteen module tasks key their cells on the evaluator's
   * spelling, because that is what `StudioMatrixRow` is typed against, so
   * this registry adopted those exact tokens rather than shipping a second
   * set that would make every real matrix unreadable to the reach
   * generator.
   *
   * RED when: either file adds, removes, renames or reorders a column. The
   * two should be collapsed into one declaration at merge; until then this
   * is what makes the duplication safe rather than latent.
   */
  it('uses the identical column tokens the access evaluator does, in the same order', () => {
    expect(STU_PERSONAS.map((p) => p.id)).toEqual([...STUDIO_PERSONA_COLUMNS])
  })

  // RED when: the switcher stops offering one of the eight columns the
  // source's own consolidated matrix heads (L34537), or invents a ninth.
  it('offers exactly the eight columns of the consolidated Studio permission matrix', () => {
    render(<StudioShell />)
    const select = screen.getByLabelText(/view as/i)
    const labels = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent?.trim())
    expect(labels).toEqual(STU_PERSONAS.map((p) => p.name))
  })

  // RED when: a persona's mapping onto the role registry is dropped or
  // guessed. `GRANT-STU-IMPL` carries no stated role and says so rather
  // than being pinned to one.
  it('maps every persona onto a registry role or declares that none is stated', () => {
    for (const p of STU_PERSONAS) {
      if (p.deliveredByRole === null) expect(p.deliveryNote, p.id).toBeTruthy()
      else expect(p.deliveryNote, p.id).toBeTruthy()
    }
    expect(stuPersonaById(STU_PERSONAS, 'plant-manager-persona').deliveredByRole).toBe('SUPERVISOR')
    expect(stuPersonaById(STU_PERSONAS, 'implementation-team').deliveredByRole).toBeNull()
  })

  /**
   * The one cross-check between this registry and the route registry, and
   * the one exemption named rather than hidden.
   *
   * RED when: `src/routes/definitions.ts` is widened to admit the Worker,
   * or narrowed to drop a permitted role, or when the Read-only Auditor is
   * silently added to `allowedRoles` — which plan C16 forbids expressly,
   * because the registry has no way to say `Client Decision Required` and
   * adding the Auditor there would assert an access the source withholds.
   */
  it('agrees with the route registry everywhere the route registry can answer', () => {
    const allowed = routeBySurface('SURF-STU').allowedRoles
    for (const p of STU_PERSONAS) {
      if (p.deliveredByRole === null) continue
      if (p.studioAccess === 'client-decision-open') {
        expect(allowed, p.id).not.toContain(p.deliveredByRole)
        continue
      }
      if (p.studioAccess === 'explicitly-prohibited') {
        expect(allowed, p.id).not.toContain(p.deliveredByRole)
        continue
      }
      expect(allowed, p.id).toContain(p.deliveredByRole)
    }
  })

  // `AC-STU-150` (L34667): "A Worker cannot reach any Studio route by any
  // means." RED when: any link at all renders for the Worker, or when the
  // cost of that prohibition stops being stated.
  it('renders the Worker as not a Studio user, with the cost stated and no route offered', async () => {
    const user = userEvent.setup()
    render(<StudioShell />)
    await user.selectOptions(screen.getByLabelText(/view as/i), 'worker')
    expect(screen.getByRole('main').textContent ?? '').toMatch(/cannot reach any Studio route by any means/i)
    expect(screen.getByRole('main').textContent ?? '').toMatch(/Frontline/i)
    const links = screen
      .queryAllByRole('link')
      .filter((l) => (l.getAttribute('href') ?? '').startsWith('/studio/'))
    expect(links).toEqual([])
  })

  // RED when: the Read-only Auditor is rendered like the Worker — the
  // direction `AC-STU-157` forbids — or like a permitted persona.
  it('renders the Read-only Auditor as an open decision, not as a prohibition', async () => {
    const user = userEvent.setup()
    render(<StudioShell />)
    await user.selectOptions(screen.getByLabelText(/view as/i), 'read-only-auditor')
    const main = screen.getByRole('main')
    expect(main.textContent ?? '').toMatch('DEC-AUDSTU-001')
    expect(main.textContent).not.toMatch(/cannot reach any Studio route by any means/i)
  })
})

describe('StudioShell — a module route', () => {
  const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-03')

  // RED when: the module id or its screen annotation is rendered as a
  // route segment rather than inside the annotation region. This is D1
  // made structural instead of stated.
  it('renders the module id and screen annotation inside an annotation region', () => {
    render(
      <StudioShell module={MODULE} persona={PERMITTED}>
        <p>module content</p>
      </StudioShell>,
    )
    const region = screen.getByTestId('annotation-region')
    expect(region.textContent ?? '').toMatch('MOD-STU-03')
    expect(region.textContent ?? '').toMatch('SCR-STU-02')
    expect(region.textContent ?? '').toMatch(/annotation/i)
    for (const link of screen.queryAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/scr-stu/i)
    }
  })

  it('renders the module heading, its purpose and its children', () => {
    render(
      <StudioShell module={MODULE} persona={PERMITTED}>
        <p>module content</p>
      </StudioShell>,
    )
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe(MODULE.name)
    expect(screen.getByText(MODULE.purpose)).toBeDefined()
    expect(screen.getByText('module content')).toBeDefined()
  })

  // RED when: a module route draws content for a persona the source
  // prohibits outright. Scope enforced in the read, not the render.
  it('draws no module content for the Worker', () => {
    render(
      <StudioShell module={MODULE} persona="worker">
        <p>module content</p>
      </StudioShell>,
    )
    expect(screen.queryByText('module content')).toBeNull()
  })
})

describe('app/studio/page.tsx', () => {
  it('renders the shell and re-exports it', () => {
    expect(StudioShellFromPage).toBe(StudioShell)
    render(<StudioHome />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})

/* ==================================================================== *
 * E. THE REACH GENERATOR'S DIRECTION GUARD (brief step 4)
 * ==================================================================== */

/**
 * THE PROBE'S SHAPE IS INHERITED, NOT INVENTED. This plants a scratch file
 * on the REAL `src/` tree so the generator's own scan can see it, and
 * `tests/coverage/slice-03-gates.test.ts` already paid for every property
 * below after two processes collided on one literal probe path:
 *
 * - PER-PROCESS (`process.pid`), so two runs cannot delete each other's probe.
 * - DOT-PREFIXED, so `tsc`'s `**\/*.ts` include and `next build` cannot see
 *   it mid-lifetime and fail on a path that no longer exists by the time
 *   they report it.
 * - CLEARED BEFORE THE RUN, so a probe orphaned by a killed run and a
 *   reused pid cannot poison this one.
 * - CLEARED ON EXIT as well as in `finally`, because `process.exit()` and an
 *   uncaught error unwinding past this stack both skip a pending `finally`.
 *
 * The fourth property the gates file has -- foreign-probe exclusion inside
 * the scan -- cannot be expressed here, because the scan runs in a CHILD
 * process with a different pid and no way to know whose probe is whose. The
 * generator takes the other half of that fix instead: its walk skips an
 * entry that has already been deleted rather than crashing on it, which
 * removes the same race from the other side.
 */
const PROBE_ENTRY = ownProbeDir('stu-reach')
const PROBE_DIR = join('src', 'studio', PROBE_ENTRY)
const PROBE = join(PROBE_DIR, 'probe.ts')
const clearProbe = () => rmSync(PROBE_DIR, { recursive: true, force: true })

clearProbe()
process.on('exit', clearProbe)

function withPlanted(contents: string, assert: () => void): void {
  plantProbe(join('src', 'studio'), 'probe.ts', contents, assert, PROBE_ENTRY)
}

// The generator writes its whole output tree wherever AVIIXA_REGISTRY_OUT
// points. Without that redirect this suite rewrote the COMMITTED
// registries/generated/stu/module-reach.json on every run, so the artefact
// tracked whatever half-built code happened to be in the tree at the moment a
// test ran. A test suite that edits the thing it is checking has no way to
// stay red. Found independently by two implementers on the same afternoon.
const GENERATOR_OUT = mkdtempSync(join(tmpdir(), 'aviixa-reach-'))
const GENERATED_REACH = join(GENERATOR_OUT, 'stu', 'module-reach.json')
afterAll(() => rmSync(GENERATOR_OUT, { recursive: true, force: true }))

function runGenerator(): { ok: boolean; output: string } {
  try {
    return {
      ok: true,
      output: execFileSync('node', ['scripts/build-stu-module-reach.mjs'], {
        encoding: 'utf8',
        env: { ...process.env, AVIIXA_REGISTRY_OUT: GENERATOR_OUT },
      }),
    }
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string }
    return { ok: false, output: String(e.stderr ?? '') + String(e.stdout ?? '') + String(e.message ?? '') }
  }
}

describe('scripts/build-stu-module-reach.mjs — the direction guard', () => {
  // RED when: the guard stops refusing, or stops exiting non-zero. C3 — the
  // `src`→`app` value cycle the Hub needed a getter to survive must not be
  // re-opened here, and the proof that it cannot is that the edge which
  // creates it fails the build. Both halves are asserted in one case: the
  // clean run must SUCCEED, so a guard that refused everything would fail
  // this too.
  //
  // TIMEOUT DIAGNOSIS (contention, not a hang, not a defect in the guard).
  // This case spawns a real `node` process THREE times, and each spawn
  // re-runs the generator's own `src/` walk plus a real
  // `ts.transpileModule` pass over every module directory the wave has
  // landed so far. RULED OUT: a hung child process — `execFileSync` has no
  // timeout of its own, so a genuine hang would fail the whole file after
  // Vitest's cap, not this case specifically, and every invocation made
  // here and independently elsewhere has always returned (`ok: true`/
  // `false` with the expected message), never blocked.
  //
  // WHAT IT IS: wall-clock waiting for a CPU slot on a machine other
  // processes are also loading. On a quiet host each spawn is well under a
  // second (measured directly: 0.52s-0.59s real time, three spawns). Under
  // load, measured directly against this same unmodified generator just
  // now: three solo invocations of `node scripts/build-stu-module-reach.mjs`
  // returned in 20.51s / 15.11s / 10.62s of REAL time while burning only
  // ~1.8s of USER time each — the process itself does the same ~1.8s of
  // work every time, it is just parked waiting for the scheduler the rest
  // of the interval. Three such spawns in one `it()`, back to back, is what
  // pushed the original (unmodified) case past the global 30s
  // `testTimeout` inside the full `pnpm test:component` run and failed it
  // on timing alone, with the assertions themselves never in question.
  //
  // The suite's own `vitest.config.ts` already documents this exact shape
  // for jsdom renders — real work that balloons under parallel CPU
  // contention gets headroom, a test slow because it re-did something
  // wastefully gets rewritten instead — and three cold Node starts plus
  // real compilation is the same kind of real work, not a re-render loop to
  // fix. So the fix here is the same one, scoped to this one case rather
  // than the project's global `testTimeout`: a per-test override. 90s was
  // chosen with the worst run measured above in view (this case, run alone,
  // finished in 35.51s of a 60s budget at the SAME contention that produced
  // the 10.62s-20.51s single-spawn times above), leaving headroom rather
  // than the minimum that happened to pass once. No assertion below
  // changed.
  it(
    'runs clean today and exits non-zero when a file under src/ value-imports app/',
    () => {
      expect(runGenerator().ok, 'the tree must be clean before the probe means anything').toBe(true)

      withPlanted(
        "import { StudioShell } from '../../../app/studio/StudioShell'\nexport const p = StudioShell\n",
        () => {
          const planted = runGenerator()
          expect(planted.ok).toBe(false)
          expect(planted.output).toMatch(/VALUE-imports app\//)
          expect(planted.output).toContain(PROBE_ENTRY)
        },
      )

      expect(existsSync(PROBE)).toBe(false)
      expect(runGenerator().ok, 'the guard must go quiet again once the probe is gone').toBe(true)
    },
    90_000,
  )

  // RED when: a type-only import is treated as an inversion. `import type`
  // is erased and opens no runtime edge; forbidding it would be a guard that
  // fails on correct code, which is how a guard gets switched off.
  it('permits a type-only import of app/', () => {
    withPlanted(
      "import type { StudioShellProps } from '../../../app/studio/StudioShell'\nexport type P = StudioShellProps\n",
      () => {
        expect(runGenerator().ok).toBe(true)
      },
    )
  })

  // RED when: the generator starts trusting a reach map on disk instead of
  // deriving one. Every module reads as not-derived in this wave, and the
  // file says so rather than carrying an answer nobody computed.
  it('writes a declared absence for every module whose matrix is not built', () => {
    runGenerator()
    const written = JSON.parse(readFileSync(GENERATED_REACH, 'utf8')) as {
      modules: Record<string, { matrixPath: string | null; reach: unknown }>
    }
    expect(Object.keys(written.modules).sort()).toEqual(STU_MODULES.map((m) => m.id).sort())
    for (const [id, entry] of Object.entries(written.modules)) {
      expect(entry.matrixPath === null, id).toBe(entry.reach === null)
    }
  })
})

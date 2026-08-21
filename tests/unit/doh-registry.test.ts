/**
 * SLICE 6, WAVE 0, TASK 5 — the SURF-DOH screen registry, the catalogue-B
 * extension, derived reach, and the three seams slice 6 closes.
 *
 * WHERE THE EXPECTATIONS COME FROM. Every expectation below is written from
 * the blueprint (sha256 47bd18d…, 122,241 lines) at the locator it names,
 * never from the field it is checking. `catalogueBRoles` is checked against
 * the text at L48095-L48117; the narrowing list is checked against the
 * matrix lines; the seam closures are checked against the source statements
 * that define each seam, not against `ownerSlice`. Where a check could only
 * be written by reading the field under test, it is not written at all.
 *
 * NON-VACUITY IS PINNED THROUGHOUT. A registry that answered "nothing" would
 * satisfy most "no X is Y" assertions, so each of those carries a companion
 * count or a positive case that fails on an empty registry.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DOH_SCREENS,
  DOH_CATALOGUE_AB_SWAP,
  DOH_CATALOGUE_B_REACH_NARROWER,
  DOH_UNCATALOGUED_SCREEN_NAMES,
  dohScreenById,
  dohScreenReach,
} from '@/surfaces/doh/screens'
import { DOH_MODULES, DOH_OUT_OF_SLICE_MODULES } from '@/surfaces/doh/modules'
import { DOH_SEAMS, dohSeamById, dohSeamStatus } from '@/surfaces/doh/seams'
import { rolesInDomain } from '@/domain/roles'
import { doh08Row } from '@/surfaces/doh/modules/doh-08/matrix'

const SCREENS_SRC = readFileSync('src/surfaces/doh/screens.ts', 'utf8')

const SOURCE_LINES = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/**
 * The nine catalogue-B rows slice 6 adds, transcribed from L48104-L48111 and
 * L48100 — id, name, owning module, the "Roles that can open it" cell and
 * the "Navigation entry point" cell, in the source's own words.
 */
const SLICE_6_ROWS = [
  {
    id: 'SCR-DOH-06',
    name: 'Parts registry',
    moduleId: 'MOD-DOH-19',
    roles: 'Tenant Admin, Supervisor',
    nav: 'Operations home, configuration group',
    line: 'L48100',
  },
  {
    id: 'SCR-DOH-10',
    name: 'Job list',
    moduleId: 'MOD-DOH-05',
    roles: 'Supervisor, Quality Manager, Tenant Admin, Read-only Auditor',
    nav: 'Operations home, work group',
    line: 'L48104',
  },
  {
    id: 'SCR-DOH-11',
    name: 'Job editor',
    moduleId: 'MOD-DOH-05',
    roles: 'Supervisor',
    nav: 'Job list',
    line: 'L48105',
  },
  {
    id: 'SCR-DOH-12',
    name: 'Job approval queue',
    moduleId: 'MOD-DOH-05',
    roles: 'Quality Manager',
    nav: 'Operations home, work group',
    line: 'L48106',
  },
  {
    id: 'SCR-DOH-13',
    name: 'Run schedule board',
    moduleId: 'MOD-DOH-06',
    roles: 'Supervisor, Quality Manager, Read-only Auditor',
    nav: 'Operations home, work group',
    line: 'L48107',
  },
  {
    id: 'SCR-DOH-14',
    name: 'Run detail and oversight',
    moduleId: 'MOD-DOH-06',
    roles: 'Supervisor, Quality Manager, Read-only Auditor',
    nav: 'Run schedule board',
    line: 'L48108',
  },
  {
    id: 'SCR-DOH-15',
    name: 'Assignment and substitution',
    moduleId: 'MOD-DOH-07',
    roles: 'Supervisor',
    nav: 'Run detail',
    line: 'L48109',
  },
  {
    id: 'SCR-DOH-16',
    name: 'Execution Summary review queue',
    moduleId: 'MOD-DOH-08',
    roles: 'Quality Manager, Read-only Auditor',
    nav: 'Operations home, quality group',
    line: 'L48110',
  },
  {
    id: 'SCR-DOH-17',
    name: 'Execution Summary detail and Anomaly Register',
    moduleId: 'MOD-DOH-08',
    roles: 'Quality Manager, Read-only Auditor',
    nav: 'Review queue',
    line: 'L48111',
  },
] as const

describe('DOH_SCREENS — the slice-6 catalogue-B extension', () => {
  it.each(SLICE_6_ROWS)(
    '$id registers the catalogue-B row at $line verbatim',
    ({ id, name, moduleId, roles, nav }) => {
      const screen = dohScreenById(id)
      expect(screen.name).toBe(name)
      expect(screen.moduleId).toBe(moduleId)
      expect(screen.catalogueBRoles).toBe(roles)
      expect(screen.navigationEntry).toBe(nav)
    },
  )

  it('registers 21 of catalogue B’s 23 rows, holding back only the two slice-10 screens', () => {
    // Catalogue B is L48095-L48117 — 23 data rows counted at the source.
    expect(DOH_SCREENS).toHaveLength(21)
    const ids: readonly string[] = DOH_SCREENS.map((s) => s.id)
    // SCR-DOH-19 is Notification policy (MOD-DOH-10) and SCR-DOH-20 is the
    // audit log explorer (MOD-DOH-11) — L48113, L48114, both slice 10.
    expect(ids).not.toContain('SCR-DOH-19')
    expect(ids).not.toContain('SCR-DOH-20')
    // And the ones held back are held back because their module is, not by
    // accident: both modules are on the out-of-slice register as slice 10.
    const slice10: readonly string[] = DOH_OUT_OF_SLICE_MODULES.filter(
      (m) => m.ownedBy === 'Slice 10',
    ).map((m) => m.id)
    expect(slice10).toContain('MOD-DOH-10')
    expect(slice10).toContain('MOD-DOH-11')
  })

  it('mints no three-digit SCR-DOH literal, in an id or anywhere in the file (D1)', () => {
    for (const s of DOH_SCREENS) {
      expect(s.id, s.id).not.toMatch(/^SCR-DOH-\d{3}$/)
    }
    // The file discusses catalogue A at length and must still never write
    // one of its identifiers. Non-vacuous: it does write the two-digit form.
    expect(SCREENS_SRC).not.toMatch(/SCR-DOH-\d{3}/)
    expect(SCREENS_SRC).toMatch(/SCR-DOH-\d{2}\b/)
  })

  it('gives every id a unique row and names every screen', () => {
    const ids = DOH_SCREENS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of DOH_SCREENS) expect(s.name.trim().length, s.id).toBeGreaterThan(0)
  })

  it('names a canonical module on every row that names one at all', () => {
    const canonical: readonly string[] = [
      ...DOH_MODULES.map((m) => m.id),
      ...DOH_OUT_OF_SLICE_MODULES.map((m) => m.id),
    ]
    expect(canonical).toHaveLength(19) // the surface's whole inventory, L25957-L25975
    let named = 0
    for (const s of DOH_SCREENS) {
      if (s.moduleId !== null) {
        expect(canonical, s.id).toContain(s.moduleId)
        named += 1
      }
      for (const also of s.alsoShows) expect(canonical, s.id).toContain(also)
    }
    expect(named).toBeGreaterThan(15)
  })

  it('mounts MOD-DOH-15 and MOD-DOH-16 inside the Job editor, per L48105', () => {
    const editor = dohScreenById('SCR-DOH-11')
    expect(editor.alsoShows).toEqual(['MOD-DOH-15', 'MOD-DOH-16'])
    // MOD-DOH-15 therefore has no screen of its own anywhere in the register.
    // Widened deliberately, the way `doh-devices.test.ts` widens its own id
    // scan: `DOH_SCREENS` is `as const`, so a narrow comparison would ask
    // the compiler whether the union contains the token instead of asking
    // the registry whether a row does.
    const owners: readonly (string | null)[] = DOH_SCREENS.map((s) => s.moduleId)
    expect(owners.filter((id) => id === 'MOD-DOH-15')).toHaveLength(0)
    // Non-vacuous: the sibling module the same cell names DOES own nothing
    // either, while MOD-DOH-05 — the cell's first entry — owns three rows.
    expect(owners.filter((id) => id === 'MOD-DOH-05')).toHaveLength(3)
  })
})

describe('reach — derived from the matrix, never from the catalogue cell', () => {
  const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id)

  it('answers from the module’s generated rolesReaching, not from catalogueBRoles', () => {
    // SCR-DOH-06's catalogue cell names TWO roles (L48100); MOD-DOH-19's
    // matrix at L30074 gives FOUR a holding status. Now that the module has
    // landed the answer is the matrix's four, and it is emphatically not the
    // catalogue's two — which is the whole reason `catalogueBRoles` is never
    // parsed into a role list.
    expect(dohScreenReach('SCR-DOH-06')).toEqual(
      DOH_MODULES.find((m) => m.id === 'MOD-DOH-19')?.rolesReaching,
    )
    expect(dohScreenReach('SCR-DOH-06')).toHaveLength(4)
    expect(dohScreenById('SCR-DOH-06').catalogueBRoles).toBe('Tenant Admin, Supervisor')
    expect(dohScreenReach('SCR-DOH-06')).toContain('QUALITY_MANAGER')

    // A screen whose module HAS landed answers with that module's derived
    // set. SCR-DOH-03's catalogue cell reads "Tenant Admin" alone (L48097);
    // MOD-DOH-01's derived reach is wider, and reach follows the matrix.
    const tier = dohScreenReach('SCR-DOH-03')
    expect(tier).not.toBeNull()
    expect(tier).toEqual(DOH_MODULES.find((m) => m.id === 'MOD-DOH-01')?.rolesReaching)
    expect(tier).toContain('READONLY_AUDITOR')
    expect(dohScreenById('SCR-DOH-03').catalogueBRoles).toBe('Tenant Admin')
  })

  it('answers for every slice-6 screen now that the seven modules have landed, and null only where no module owns the screen', () => {
    for (const row of SLICE_6_ROWS) {
      const reach = dohScreenReach(row.id)
      expect(reach, row.id).not.toBeNull()
      expect(reach, row.id).toEqual(
        DOH_MODULES.find((m) => m.id === row.moduleId)?.rolesReaching,
      )
    }
    // Non-vacuous in the other direction: `null` is still a live answer, and
    // it now means exactly "this screen names no module" rather than "this
    // module has not landed". The two ownerless rows are the only ones left.
    const unanswered = DOH_SCREENS.filter((s) => dohScreenReach(s.id) === null)
    expect(unanswered.map((s) => s.id)).toEqual(['SCR-DOH-02', 'SCR-DOH-23'])
    for (const s of unanswered) expect(s.moduleId, s.id).toBeNull()
  })

  it('never returns a token that is not a tenant role', () => {
    let checked = 0
    for (const s of DOH_SCREENS) {
      const reach = dohScreenReach(s.id)
      if (reach === null) continue
      for (const role of reach) expect(TENANT_ROLES, s.id).toContain(role)
      checked += 1
    }
    expect(checked).toBeGreaterThan(8)
  })

  it('exposes no role-list field on a screen row — the rail has one source', () => {
    for (const s of DOH_SCREENS) {
      for (const [key, value] of Object.entries(s)) {
        if (key === 'alsoShows') continue
        expect(Array.isArray(value), `${s.id}.${key}`).toBe(false)
      }
    }
    expect(DOH_SCREENS.length).toBeGreaterThan(20)
  })
})

describe('DOH_CATALOGUE_B_REACH_NARROWER — the C1 trap, measured', () => {
  /**
   * Written from the matrix lines, each read at the source, and NOT copied
   * from the register — the register derives its own answer and this table
   * is the independent side of the comparison.
   *
   * The plan named FOUR. `SCR-DOH-06` is the fifth case and `SCR-DOH-11` is
   * narrowed TWICE, by the two different modules L48105 mounts in the Job
   * editor, so there are SIX narrowings over five screens.
   */
  const MEASURED = [
    { screenId: 'SCR-DOH-06', moduleId: 'MOD-DOH-19', omitted: ['Quality Manager', 'Read-only Auditor'], line: 'L30074' },
    { screenId: 'SCR-DOH-11', moduleId: 'MOD-DOH-05', omitted: ['Tenant Admin'], line: 'L27695' },
    { screenId: 'SCR-DOH-11', moduleId: 'MOD-DOH-15', omitted: ['Tenant Admin'], line: 'L29477' },
    { screenId: 'SCR-DOH-13', moduleId: 'MOD-DOH-06', omitted: ['Tenant Admin'], line: 'L27910' },
    {
      screenId: 'SCR-DOH-15',
      moduleId: 'MOD-DOH-07',
      omitted: ['Tenant Admin', 'Quality Manager', 'Read-only Auditor'],
      line: 'L28125',
    },
    { screenId: 'SCR-DOH-17', moduleId: 'MOD-DOH-08', omitted: ['Tenant Admin'], line: 'L28306' },
  ] as const

  it('names exactly the six measured narrowings, each against its module and its matrix line', () => {
    expect(DOH_CATALOGUE_B_REACH_NARROWER.map((n) => `${n.screenId}/${n.moduleId}`)).toEqual(
      MEASURED.map((m) => `${m.screenId}/${m.moduleId}`),
    )
    for (const m of MEASURED) {
      const row = DOH_CATALOGUE_B_REACH_NARROWER.find(
        (n) => n.screenId === m.screenId && n.moduleId === m.moduleId,
      )
      expect(row, `${m.screenId}/${m.moduleId}`).toBeDefined()
      expect(row?.omittedRoles, m.screenId).toEqual(m.omitted)
      expect(row?.matrixRef, m.screenId).toContain(m.line)
    }
  })

  it('drops the three anchors that derive to no narrowing, so the filter is live', () => {
    // `SCR-DOH-10`, `SCR-DOH-12` and `SCR-DOH-16` are anchored in the
    // register and derive an EMPTY omitted set, which is why they are absent.
    // Without them the filter would never have been exercised and "narrower"
    // would be a list rather than a measurement.
    const ids: readonly string[] = DOH_CATALOGUE_B_REACH_NARROWER.map((n) => n.screenId)
    for (const id of ['SCR-DOH-10', 'SCR-DOH-12', 'SCR-DOH-16']) expect(ids).not.toContain(id)
  })

  it('never counts the Worker, because D11 and the catalogue agree there', () => {
    // Two anchored rows admit the Worker — L27910 and L28125 — and neither
    // catalogue cell names it. That is the route registry agreeing with the
    // catalogue while only the matrix dissents, so it is not a narrowing.
    for (const n of DOH_CATALOGUE_B_REACH_NARROWER) {
      expect(n.omittedRoles, n.screenId).not.toContain('Worker')
    }
    const schedule = DOH_CATALOGUE_B_REACH_NARROWER.find((n) => n.screenId === 'SCR-DOH-13')
    expect(schedule?.matrixRef).toContain('L27910')
    expect(dohScreenById('SCR-DOH-13').catalogueBRoles).not.toContain('Worker')
  })

  it('omits from the catalogue cell exactly the roles it claims are omitted', () => {
    // The claim is checkable without the matrix: if the narrowing says a
    // role is omitted, the quoted cell must not name it — and must name at
    // least one other, or "narrower" would be "empty".
    for (const n of DOH_CATALOGUE_B_REACH_NARROWER) {
      const cell = dohScreenById(n.screenId).catalogueBRoles
      for (const role of n.omittedRoles) {
        expect(cell, `${n.screenId} names ${role}`).not.toContain(role)
      }
      expect(cell.trim().length, n.screenId).toBeGreaterThan(0)
    }
  })

  it('leaves SCR-DOH-14 out, because MOD-DOH-06 has no run-detail view row', () => {
    // L27910 is MOD-DOH-06's only view row and it is the schedule board's,
    // which is why SCR-DOH-13 is in the list and SCR-DOH-14 is not.
    const ids: readonly string[] = DOH_CATALOGUE_B_REACH_NARROWER.map((n) => n.screenId)
    expect(ids).not.toContain('SCR-DOH-14')
    expect(ids).toContain('SCR-DOH-13')
    // Both rows quote the same catalogue cell, so the difference cannot be
    // the cell — it is the capability row, which is the criterion.
    expect(dohScreenById('SCR-DOH-14').catalogueBRoles).toBe(
      dohScreenById('SCR-DOH-13').catalogueBRoles,
    )
  })

  it('leaves the review queue out, because L28301 admits exactly its two roles', () => {
    // MOD-DOH-08 row 2 reads Unavailable for Tenant Admin, Supervisor and
    // Worker and Read-only for the Read-only Auditor — the same two the
    // catalogue names, so the queue is NOT narrowed while its sibling is.
    const ids: readonly string[] = DOH_CATALOGUE_B_REACH_NARROWER.map((n) => n.screenId)
    expect(ids).not.toContain('SCR-DOH-16')
    expect(ids).toContain('SCR-DOH-17')
  })
})

describe('the uncatalogued paired scheduling view', () => {
  it('registers a storyboard name and mints no SCR-DOH id for it', () => {
    expect(DOH_UNCATALOGUED_SCREEN_NAMES).toHaveLength(1)
    const [paired] = DOH_UNCATALOGUED_SCREEN_NAMES
    expect(paired?.name).toBe('SB-DOH-028') // L29681
    expect(paired?.moduleId).toBe('MOD-DOH-16')
    expect(paired?.name).not.toMatch(/^SCR-DOH-/)
    expect(paired?.sourceRef).toContain('L29681')
  })

  it('leaves MOD-DOH-16 with no catalogue row of its own, which is why it is here', () => {
    // Catalogue B names MOD-DOH-16 only inside SCR-DOH-11's cell (L48105);
    // no row is ABOUT it.
    // Widened for the same reason as above: the question is the registry's,
    // not the compiler's.
    const owners: readonly (string | null)[] = DOH_SCREENS.map((s) => s.moduleId)
    expect(owners.filter((id) => id === 'MOD-DOH-16')).toHaveLength(0)
    const mounts = DOH_SCREENS.filter((s) =>
      (s.alsoShows as readonly string[]).includes('MOD-DOH-16'),
    )
    expect(mounts.map((s) => s.id)).toEqual(['SCR-DOH-11'])
  })

  it('records that catalogue A’s "Job Owner" is a field, not a sixth role', () => {
    const [paired] = DOH_UNCATALOGUED_SCREEN_NAMES
    expect(paired?.note).toMatch(/Job Owner is a field on the Job record, not a role/)
    // Five roles is the closed set; nothing here adds a sixth.
    expect(rolesInDomain('TENANT')).toHaveLength(5)
  })
})

describe('DOH_CATALOGUE_AB_SWAP — grade C3, disclosed, not silently picked', () => {
  it('states both catalogues’ readings of the two trailing numbers', () => {
    expect(DOH_CATALOGUE_AB_SWAP.grade).toBe('C3')
    expect(DOH_CATALOGUE_AB_SWAP.followed).toBe('catalogue B')

    // Catalogue B, L48110-L48111: 16 is the queue, 17 is the detail.
    expect(DOH_CATALOGUE_AB_SWAP.catalogueB.map((r) => [r.screenId, r.sourceRef])).toEqual([
      ['SCR-DOH-16', 'L48110'],
      ['SCR-DOH-17', 'L48111'],
    ])
    expect(DOH_CATALOGUE_AB_SWAP.catalogueB[0]?.name).toMatch(/review queue/)
    expect(DOH_CATALOGUE_AB_SWAP.catalogueB[1]?.name).toMatch(/detail and Anomaly Register/)

    // Catalogue A, L26066-L26067: reversed — the earlier row is the Summary
    // view and the later one is the review queue.
    expect(DOH_CATALOGUE_AB_SWAP.catalogueA.map((r) => r.sourceRef)).toEqual(['L26066', 'L26067'])
    expect(DOH_CATALOGUE_AB_SWAP.catalogueA[0]?.name).toMatch(/Execution Summary view/)
    expect(DOH_CATALOGUE_AB_SWAP.catalogueA[1]?.name).toMatch(/review queue/)
  })

  it('renders the divergence rather than declaring either catalogue wrong', () => {
    expect(DOH_CATALOGUE_AB_SWAP.statement).toMatch(/Neither catalogue is declared wrong/)
    expect(DOH_CATALOGUE_AB_SWAP.statement.length).toBeGreaterThan(200)
  })

  it('keeps the registry on catalogue B’s reading of both rows', () => {
    expect(dohScreenById('SCR-DOH-16').name).toBe('Execution Summary review queue')
    expect(dohScreenById('SCR-DOH-17').name).toBe('Execution Summary detail and Anomaly Register')
    // The sub-view relation is catalogue B's too: the detail is entered
    // from the queue (L48111), not the other way round.
    expect(dohScreenById('SCR-DOH-17').navigationEntry).toBe('Review queue')
  })
})

describe('DOH_SEAMS — the three slice-4 seams slice 6 owns', () => {
  /**
   * The closure is checked against the SOURCE statement behind each seam,
   * not against `ownerSlice` — deriving the expectation from the field
   * under test would make this pass on any number.
   */
  const CLOSING = [
    {
      id: 'worker-shift-meter',
      consumer: 'MOD-DOH-01',
      owner: 'MOD-DOH-07',
      // L26876: MOD-DOH-01 depends on "the Worker-Shift meter inputs from
      // assignment and substitution" — MOD-DOH-07's remit, built in slice 6.
      why: /assignment/i,
    },
    {
      id: 'archival-cascade',
      consumer: 'MOD-DOH-02',
      owner: 'MOD-DOH-05',
      // L7161: archiving a Site or Area auto-pauses every bound Job.
      why: /Jobs/,
    },
    {
      id: 'qualification-gate',
      consumer: 'MOD-DOH-04',
      // RE-PINNED, AND THE OLD PIN WAS THE FALSE PRESENCE HELD IN PLACE.
      // This read `'MOD-DOH-06 / MOD-DOH-07'` with the comment "the first
      // two are slice 6", so the row's own overstatement was asserted rather
      // than caught. AC-PROD-032 (L1548) names three enforcement points and
      // MOD-DOH-07's Security row (L28112) says where they run: at
      // assignment server-side, and "again at run start and at
      // override-carrying screens on the device". One Hub point, one Hub
      // owner. See the source assertion below, which is what makes this
      // number a reading of the blueprint rather than a copy of the field.
      owner: 'MOD-DOH-07',
      why: /at assignment/,
    },
  ] as const

  it.each(CLOSING)('$id closes at slice 6, against $owner', ({ id, consumer, owner, why }) => {
    const seam = dohSeamById(id)
    expect(seam.consumingModule).toBe(consumer)
    expect(seam.ownerModule).toBe(owner)
    expect(seam.description).toMatch(why)
    expect(dohSeamStatus(seam)).toBe('closed')
  })

  it('leaves the four slice-10 seams open, and the slice-12 one too', () => {
    const open = DOH_SEAMS.filter((s) => dohSeamStatus(s) === 'open')
    expect(open.map((s) => s.id)).toEqual([
      'regulated-industry-mode',
      'shift-digest-delivery',
      'platform-access-history-audit',
      'tenant-contact-email-delivery',
      'certification-expiry-digest',
    ])
    expect(dohSeamById('regulated-industry-mode').ownerSlice).toBe(12)
    for (const s of open.filter((x) => x.id !== 'regulated-industry-mode')) {
      expect(s.ownerSlice, s.id).toBe(10)
    }
  })

  /**
   * THE EIGHTH SEAM, which did not exist. `MOD-DOH-08` reads MOD-DOH-17 for
   * row 14's forced-on constraint and builds none of it; with no registered
   * row, `SeamNotice` could draw nothing and the screen hand-wrote the
   * sentence — which reads, from the screen, exactly like a seam declared
   * and unowned.
   */
  it('registers the Regulated-Industry mode seam MOD-DOH-08 reads and does not build', () => {
    const seam = dohSeamById('regulated-industry-mode')
    expect(seam.consumingModule).toBe('MOD-DOH-08')
    expect(seam.ownerModule).toBe('MOD-DOH-17')
    // Not derived from the field under test: L28313 is the row that creates
    // the dependency, and MOD-DOH-17 is out of this slice's module set.
    expect(sourceLine(28_313)).toContain('Regulated-Industry mode')
    expect(DOH_OUT_OF_SLICE_MODULES.map((m) => m.id)).toContain('MOD-DOH-17')
    // The one module that carries the constraint carries no control for it.
    expect(doh08Row('set-the-review-toggle').noControlHere).toContain('MOD-DOH-17')
  })

  it('derives status from ownerSlice rather than from a stored flag', () => {
    // No row carries a status of its own, so there is nothing to disagree
    // with the derivation.
    for (const s of DOH_SEAMS) {
      expect(Object.keys(s), s.id).not.toContain('status')
      expect(Object.keys(s), s.id).not.toContain('closed')
    }
    expect(DOH_SEAMS).toHaveLength(8)
    // Non-vacuous: the partition is 3 / 5, not 8 / 0 or 0 / 8.
    expect(DOH_SEAMS.filter((s) => dohSeamStatus(s) === 'closed')).toHaveLength(3)
  })

  /**
   * THIS TEST USED TO ASSERT THE DEFECT. It required the description to say
   * "two of the three" and required `ownerModule` to contain BOTH
   * `MOD-DOH-06` and `MOD-DOH-07` — so the one row in the registry carrying
   * two owners in one string was the one row a test insisted keep them.
   *
   * The reading is taken from the blueprint here rather than from the field,
   * which is the whole reason the old pin could be wrong and green at once.
   */
  it('gives the qualification gate one Hub enforcement point and one owner', () => {
    const seam = dohSeamById('qualification-gate')

    // The source's own account of WHERE each of the three points runs.
    // MOD-DOH-07's Security row and its workflow step 7 say the same thing
    // twice: only the assignment point is server-side on this surface.
    expect(sourceLine(28_112)).toContain('server-side at assignment')
    expect(sourceLine(28_112)).toContain('at override-carrying screens on the device')
    expect(sourceLine(28_136)).toContain('run start and at override-carrying screens on the device')
    // And run start is a device act in MOD-DOH-06's own lifecycle, which is
    // why it was never that module's half to build.
    expect(SOURCE_LINES.join('\n')).toContain(
      'InProgress : worker starts on the Frontline Worker Application',
    )

    expect(seam.ownerModule).toBe('MOD-DOH-07')
    expect(seam.description).not.toMatch(/MOD-DOH-06/)
    expect(dohSeamStatus(seam)).toBe('closed')
  })

  /**
   * THE STRUCTURAL HALF OF THE SAME FIX. `ownerModule` was a bare `string`,
   * which is what let one row name two modules; it is now
   * `DohCanonicalModuleId`. A type cannot be asserted at run time, so this
   * asserts the property the type exists to guarantee — one id per row,
   * drawn from the surface's own nineteen — which also catches a widening
   * of the field back to `string` followed by a second two-owner row.
   */
  it('names exactly one canonical module as each seam’s owner', () => {
    const canonical = new Set<string>([
      ...DOH_MODULES.map((m) => m.id),
      ...DOH_OUT_OF_SLICE_MODULES.map((m) => m.id),
    ])
    expect(canonical.size).toBe(19)
    for (const seam of DOH_SEAMS) {
      expect(canonical.has(seam.ownerModule), `${seam.id}: ${seam.ownerModule}`).toBe(true)
      expect(seam.ownerModule, seam.id).not.toMatch(/[/,]| and /)
    }
  })
})

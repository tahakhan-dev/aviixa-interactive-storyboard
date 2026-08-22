import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC_CLAIMED_SLUGS, CC_MODULE_SPINE, ccModule, type CcModuleId } from '@/surfaces/cc/modules'
import {
  CC_CHROME_MODULES,
  CC_NAV,
  CC_SCREENS,
  ccPathname,
  ccScreenSlug,
} from '@/surfaces/cc/screens'
import {
  CC_EXCLUDED_ROLES,
  ccScreenOpensFor,
  evaluateCCAccess,
  isCcExcludedRole,
} from '@/surfaces/cc/access'
import { CC_SEAMS, ccSeamStatus } from '@/surfaces/cc/seams'
import type { RoleId } from '@/domain/roles'
import type { AccessContext, AccessRequest } from '@/policy/evaluate'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'

/**
 * THE `SURF-CC` SPINE — thirteen modules, thirteen screens, and the two keys
 * slice 8 needs before slice 9 exists.
 *
 * WHAT THESE GATES ASK, AND WHAT THEY REFUSE TO ASK. Every expectation about
 * the source is READ OFF THE FROZEN SOURCE at test time — the register row,
 * the inventory row, the identity line — and compared against the record this
 * task wrote. Nothing below compares a string this task wrote against another
 * string this task wrote, and no count is taken from the array under test:
 * "thirteen" comes from `AC-CC-040`'s line and `AC-SCR-CC-001`'s line, not
 * from `CC_MODULE_SPINE.length`.
 *
 * EVERY GATE HERE WAS PLANTED AND WATCHED GO RED before it was left green —
 * one defect per gate, in the shipping file the gate claims to protect, then
 * restored byte-identically. The `FAILS IF` note on each names the defect
 * that was ACTUALLY planted, never a convenient one. Two of the eleven shapes
 * slice 7 recorded were live risks here and are pinned by construction: the
 * exclusion gate below asks its question with the excluded role EXPLICITLY
 * GRANTED on the request, because a role nobody grants is refused by an
 * evaluator that does nothing; and the header-keyed transcription is compared
 * CELL BY CELL against the split source row, because a row-shape check is
 * satisfied by the separator row.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

const srcLineOf = (ref: string): string => srcLine(Number(ref.slice(1)))

/**
 * A markdown table row split into its cells. The leading and trailing pipes
 * produce two empty edges that are not cells, and dropping them is what stops
 * an off-by-one making every column read as its neighbour.
 */
function cells(row: string): string[] {
  const parts = row.split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.trim())
}

/* ==================================================================== *
 * THE MODULE INVENTORY.
 * ==================================================================== */

describe('the thirteen-module inventory', () => {
  // FAILS IF: the count stops being thirteen on either side. The expectation
  // is the SOURCE's own criterion read at test time, not a literal typed
  // here and not `CC_MODULE_SPINE.length` compared with itself.
  // PLANTED: deleted the MOD-CC-13 record from `src/surfaces/cc/modules.ts`.
  // RED: expected 12 to be 13.
  // PLANTED FIRST, AND IT PROVED SOMETHING ELSE: deleting MOD-CC-05 instead
  //   took the whole file down at IMPORT — `CC_NAV` derives every route key
  //   eagerly, so a module SCR-CC-06 says it owns going missing throws
  //   `Unknown Command Center module: MOD-CC-05` before a single test runs.
  //   That is a louder failure than this gate, and it is why the plant moved
  //   to the one module no screen owns: a gate proven only by a crash is a
  //   gate whose own assertion was never exercised.
  it('carries the count the source fixes, read off the criterion', () => {
    expect(srcLine(35261)).toContain('AC-CC-040')
    expect(srcLine(35261)).toContain('exactly thirteen modules')
    expect(CC_MODULE_SPINE).toHaveLength(13)
  })

  // FAILS IF: a module's name, source section or spec section drifts from the
  // inventory row it cites. Header-keyed and cell by cell: the header at
  // L35184 names the four columns, and each record is compared against the
  // cells of ITS OWN row rather than against a position in a list.
  // PLANTED: changed MOD-CC-05's `name` to 'Governance gate queues'.
  // RED: MOD-CC-05 name -> expected 'Governance gate queues' to be
  //      'Governance gate queue'.
  it('transcribes every inventory row header-keyed, cell by cell', () => {
    const header = cells(srcLine(35184))
    expect(header).toEqual([
      'Identifier',
      'Module name, verbatim from the source',
      'Source section',
      'Specified in this chapter',
    ])
    expect(cells(srcLine(35185))).toHaveLength(4)

    for (const m of CC_MODULE_SPINE) {
      const row = cells(srcLineOf(m.inventoryRef))
      expect(row, `${m.id} inventory row ${m.inventoryRef}`).toHaveLength(4)
      expect(row[0], `${m.id} identifier`).toBe(`\`${m.id}\``)
      expect(row[1], `${m.id} name`).toBe(m.name)
      expect(row[2], `${m.id} source section`).toBe(m.sourceSection)
      expect(row[3], `${m.id} spec section`).toBe(m.specSection)
    }
  })

  // FAILS IF: the inventory rows are not the thirteen consecutive lines this
  // spine cites, in the source's own listed order. A row cited out of order
  // would still pass the cell check above by finding its own row elsewhere.
  // PLANTED: swapped MOD-CC-11's and MOD-CC-12's `inventoryRef`.
  // RED: expected [..., 'L35197', 'L35196', 'L35198'] to deeply equal
  //      [..., 'L35196', 'L35197', 'L35198'].
  it('cites the thirteen consecutive inventory lines in the source’s order', () => {
    expect(CC_MODULE_SPINE.map((m) => m.inventoryRef)).toEqual(
      Array.from({ length: 13 }, (_, i) => `L${35186 + i}`),
    )
  })

  // FAILS IF: a `sourceRef` points anywhere but that module's own identity
  // card. This is the anti-hallucination gate: the cited line must OPEN with
  // the identity paragraph and name that module, so a line three away — the
  // off-by-one class this build has shipped — is caught rather than tolerated.
  // PLANTED: shifted MOD-CC-08's `sourceRef` one line earlier than L37640,
  //          onto the blank line above its identity paragraph.
  // RED: MOD-CC-08 identity card -> expected '' to contain
  //      '**Identity.** Identifier `MOD-CC-08`'.
  it('anchors every sourceRef on that module’s own identity line', () => {
    for (const m of CC_MODULE_SPINE) {
      expect(srcLineOf(m.sourceRef), `${m.id} identity card at ${m.sourceRef}`).toContain(
        `**Identity.** Identifier \`${m.id}\``,
      )
      expect(srcLineOf(m.sourceRef), `${m.id} owning surface`).toContain('(`SURF-CC`)')
    }
  })
})

/* ==================================================================== *
 * THE SCREEN REGISTER.
 * ==================================================================== */

const REGISTER_FIRST = 48386

describe('the thirteen-screen register', () => {
  // FAILS IF: the screen count stops being thirteen. Same discipline as the
  // module count — the number is read off `AC-SCR-CC-001`'s own line.
  // PLANTED: deleted the SCR-CC-09 record from `src/surfaces/cc/screens.ts`.
  // RED: expected 12 to be 13.
  it('carries the count the source fixes, read off the criterion', () => {
    expect(srcLine(48492)).toContain('AC-SCR-CC-001')
    expect(srcLine(48492)).toContain('All thirteen screens exist')
    expect(CC_SCREENS).toHaveLength(13)
  })

  // FAILS IF: any cell of any register row is transcribed wrong. Header-keyed
  // and cell by cell against the row this record cites. The header assertion
  // is not decoration: it is what proves the six positions below mean what
  // this file says they mean, and it is checked BEFORE the separator, so a
  // register whose columns were reordered fails here rather than inverting
  // every row silently.
  // PLANTED: changed SCR-CC-09's `purpose` to
  //          'Hold every pushed event with its routing states'.
  // RED: SCR-CC-09 purpose -> expected 'Hold every pushed event with its
  //      routing states' to be 'Hold every pushed event with its routing state'.
  it('transcribes every register row header-keyed, cell by cell', () => {
    expect(cells(srcLine(48384))).toEqual([
      'Screen identifier',
      'Screen name',
      'Purpose',
      'Roles that can open it',
      'Modules and features shown',
      'Navigation entry point',
    ])

    for (const s of CC_SCREENS) {
      const row = cells(srcLineOf(s.registerRef))
      expect(row, `${s.id} register row ${s.registerRef}`).toHaveLength(6)
      expect(row[0], `${s.id} identifier`).toBe(s.id)
      expect(row[1], `${s.id} name`).toBe(s.name)
      expect(row[2], `${s.id} purpose`).toBe(s.purpose)
      expect(row[3], `${s.id} roles column`).toBe(s.rolesColumn)
      expect(row[4], `${s.id} modules column`).toBe(s.modulesShown)
      expect(row[5], `${s.id} navigation entry`).toBe(s.navigationEntry)
    }
  })

  // FAILS IF: the register rows are not thirteen consecutive lines in the
  // source's order. The separator at L48385 is deliberately asserted to be a
  // separator: `|---|---|` splits into non-empty cells and satisfies a bare
  // row-shape check, which is one of the eleven shapes slice 7 recorded.
  // PLANTED: changed SCR-CC-04's `registerRef` from 'L48389' to 'L48385'.
  // RED: expected [..., 'L48385', ...] to deeply equal [..., 'L48389', ...].
  it('cites the thirteen consecutive register lines, and never the separator', () => {
    expect(CC_SCREENS.map((s) => s.registerRef)).toEqual(
      Array.from({ length: 13 }, (_, i) => `L${REGISTER_FIRST + i}`),
    )
    expect(cells(srcLine(48385)).every((c) => /^-+$/.test(c))).toBe(true)
  })

  // FAILS IF: a second register of numbered SCR-CC tokens exists anywhere in
  // the frozen source and this build has not seen it. That is not a
  // hypothetical: the Frontline carries exactly that, two registers sharing
  // six tokens with five naming different screens, and it needed a whole
  // ruling. The claim here is measured over ALL 122,241 lines and it is
  // counted on TABLE ROWS, not on occurrences — a numbered token appears two
  // to four times each in prose, flowchart nodes, a state inventory and a
  // storyboard, and the first writing of this file's comment asserted "each
  // occurs exactly twice", which is false.
  // PLANTED: the subject is the frozen source, which is read-only, so the
  //   plant is in the pattern. Widening `SCR-CC-` to `SCR-[A-Z]+-` picks up
  //   every other surface's register.
  // RED: expected [ 39863, 39864, 39865, 39866, …(80) ] to deeply equal
  //      [ 48386, 48387, 48388, 48389, …(9) ].
  // A WIDENING THAT STAYED GREEN WAS TRIED FIRST and is recorded because it
  //   is the more useful finding: broadening the numeric part to
  //   `SCR-CC-[A-Z0-9-]+` changed nothing, which says the chapter's ninety-odd
  //   storyboard tokens never head a table row. A plant whose result is
  //   identical to the fix proves nothing about the gate, and this file has
  //   now shipped one of those.
  it('finds no second register of numbered screen identifiers anywhere', () => {
    const rows = LINES.map((l, i) => [i + 1, l] as const).filter(([, l]) =>
      /^\| *`?SCR-CC-(0[1-9]|1[0-3])`? *\|/.test(l),
    )
    expect(rows.map(([n]) => n)).toEqual(
      Array.from({ length: 13 }, (_, i) => REGISTER_FIRST + i),
    )
  })

  // FAILS IF: a screen's `rolesThatCanOpen` stops agreeing with the words of
  // its own roles column. The check is a containment test against the column
  // TEXT, so a role added to the list without being in the column fails, and
  // the SCR-CC-10 case — "Supervisor for viewing, Quality Manager for
  // resolution" — is read as both roles opening it because both are named.
  // PLANTED: added 'TENANT_ADMIN' to SCR-CC-12's `rolesThatCanOpen`.
  // RED: SCR-CC-12 lists TENANT_ADMIN, absent from 'Supervisor, Quality
  //      Manager' -> expected false to be true.
  it('reads rolesThatCanOpen out of the register’s own roles column', () => {
    const WORDS: Record<string, string> = {
      SUPERVISOR: 'Supervisor',
      QUALITY_MANAGER: 'Quality Manager',
      TENANT_ADMIN: 'Tenant Admin',
      READONLY_AUDITOR: 'Read-only Auditor',
      WORKER: 'Worker',
    }
    for (const s of CC_SCREENS) {
      for (const r of s.rolesThatCanOpen) {
        const word = WORDS[r]
        expect(word, `${s.id} names an unmapped role ${r}`).toBeDefined()
        expect(
          s.rolesColumn.includes(word as string),
          `${s.id} lists ${r}, absent from '${s.rolesColumn}'`,
        ).toBe(true)
      }
      expect(s.rolesThatCanOpen.length, `${s.id} opens for nobody`).toBeGreaterThan(0)
    }
  })
})

/* ==================================================================== *
 * OWNERSHIP — WHICH MODULE CLAIMS WHICH ROUTE.
 * ==================================================================== */

describe('route ownership', () => {
  // FAILS IF: a module claims two routes, two modules claim one route, or the
  // claims stop matching the screens that name an owner. All three are
  // derived from the two records rather than restated as a number, so the
  // arithmetic cannot be satisfied by editing a constant.
  // PLANTED: gave MOD-CC-02 `slug: 'sync-state'` in
  //          `src/surfaces/cc/modules.ts`.
  // RED: expected [ 'MOD-CC-02' ] to deeply equal [] — a module claiming a
  //      route that no screen record says it owns.
  it('gives every claimed slug exactly one module and exactly one screen', () => {
    expect(new Set(CC_CLAIMED_SLUGS).size).toBe(CC_CLAIMED_SLUGS.length)

    const owners: CcModuleId[] = CC_SCREENS.flatMap((s) =>
      s.owningModule === null ? [] : [s.owningModule],
    )
    expect(new Set(owners).size, 'a module owns at most one screen').toBe(owners.length)

    const claimants: CcModuleId[] = CC_MODULE_SPINE.filter((m) => m.slug !== null).map((m) => m.id)
    expect(claimants.filter((id) => !owners.includes(id))).toEqual([])
    expect(owners.filter((id) => !claimants.includes(id))).toEqual([])
  })

  // FAILS IF: a screen's route stops being derived from its owner's slug, or
  // an unowned screen loses the route key this task settled for it. There is
  // no `slug` field on a screen, so this is the derivation itself under test.
  // PLANTED: changed MOD-CC-10's `slug` to 'sync-conflicts'.
  // RED: expected '/command-center/sync-conflicts' to be
  //      '/command-center/sync-conflict-review-panel'.
  it('derives a routed screen’s key from its owning module, never twice', () => {
    for (const s of CC_SCREENS) {
      const slug = ccScreenSlug(s)
      if (s.owningModule !== null) {
        expect(slug, s.id).toBe(ccModule(s.owningModule).slug)
        expect(s.unownedSlug, `${s.id} owns a route and still declares an unowned slug`).toBeNull()
      } else {
        expect(slug, `${s.id} names no owner and no route key`).not.toBeNull()
        expect((s.noOwnerReason ?? '').length, `${s.id} noOwnerReason`).toBeGreaterThan(120)
      }
    }
    expect(ccScreenSlug(CC_SCREENS[9])).toBe('sync-conflict-review-panel')
    expect(ccPathname('sync-conflict-review-panel')).toBe(
      '/command-center/sync-conflict-review-panel',
    )
  })

  // FAILS IF: a Command Center slug collides with a route directory basename
  // ANYWHERE under `app/`. The generator matches on the basename across every
  // surface and throws when two directories carry a claimed name, which is
  // why MOD-FL-A1 had to abstain from `sign-in`. The walk is asserted to have
  // found the known collision first — a walk that read nothing would pass a
  // bare "no collisions" check silently, which is the defect
  // `scripts/build-registries.mjs` calls out in its own words.
  // PLANTED: changed MOD-CC-01's `slug` to 'sign-in'.
  // RED: expected [ 'sign-in collides with app/frontline/sign-in,
  //      app/studio/sign-in' ] to deeply equal []. STAYED GREEN on the first
  //      writing of this gate — see the note on the filter below.
  it('claims no slug that any surface already uses as a route directory', () => {
    const byName = new Map<string, string[]>()
    for (const surface of readdirSync('app')) {
      if (isForeignProbe(surface)) continue
      const surfaceDir = join('app', surface)
      if (!statSync(surfaceDir).isDirectory()) continue
      for (const child of readdirSync(surfaceDir)) {
        if (isForeignProbe(child)) continue
        const dir = join(surfaceDir, child)
        if (!statSync(dir).isDirectory()) continue
        byName.set(child, [...(byName.get(child) ?? []), dir])
      }
    }
    // The walk really walked: `sign-in` is the known duplicate, and it is the
    // reason no Command Center module may ever claim SCR-CC-01.
    expect(byName.get('sign-in')?.sort()).toEqual([
      join('app', 'frontline', 'sign-in'),
      join('app', 'studio', 'sign-in'),
    ])

    // NO CLAIMED SLUG IS EXEMPT, AND THE EXEMPTION THAT USED TO SIT HERE WAS
    // THE DEFECT. This filter read `slug !== 'sign-in' && byName.has(slug)`,
    // so planting `slug: 'sign-in'` on MOD-CC-01 left it GREEN: the allowance
    // took its allowed string from the value under test, which is one of the
    // eleven shapes slice 7 recorded. A CLAIMED slug may never collide. The
    // one route key that legitimately IS `sign-in` is declared UNOWNED by
    // SCR-CC-01, and the two unowned keys are asserted by name below rather
    // than skipped by a filter.
    expect(CC_CLAIMED_SLUGS).toHaveLength(11)

    // A COLLISION IS TWO DIRECTORIES, NOT ONE. This read `byName.has(slug)`,
    // which is true the moment ANY directory of that name exists — including
    // the module's OWN built route. It therefore held only while no Command
    // Center route existed at all, and went red on the first one built.
    //
    // `scripts/build-registries.mjs` has the rule right and states it in the
    // error it throws: it refuses on `dirs.length > 1` — "Which one
    // demonstrates the module is a guess; refusing to make it" — and treats
    // exactly one directory of the claimed name as what `demonstrated` MEANS.
    // A gate that disagrees with the generator about the same question is
    // wrong wherever they differ, and here the generator is right.
    //
    // The hardening the comment above describes is untouched: a planted
    // `slug: 'sign-in'` still collides two-to-one against frontline and
    // studio, and is still caught. Both directions are asserted below.
    const collisions = CC_CLAIMED_SLUGS.filter(
      (slug) => (byName.get(slug) ?? []).length > 1,
    ).map((slug) => `${slug} collides with ${(byName.get(slug) ?? []).join(', ')}`)
    expect(collisions).toEqual([])

    // The narrowing above must not have made the check vacuous. `sign-in` is
    // the live two-directory case, so the predicate is run against it directly:
    // if a module ever claimed it, this is the value the filter would see.
    expect((byName.get('sign-in') ?? []).length > 1, 'the predicate still fires').toBe(true)

    expect(
      CC_SCREENS.filter((s) => s.unownedSlug !== null).map((s) => [s.id, s.unownedSlug]),
    ).toEqual([
      ['SCR-CC-01', 'sign-in'],
      ['SCR-CC-03', 'cell-view'],
    ])
    expect(byName.has('cell-view'), 'cell-view is unbuilt and uncontested').toBe(false)
  })

  // FAILS IF: the navigation model stops being derived, or the sign-in screen
  // reappears as a rail item. Twelve of thirteen, and the twelfth is dropped
  // by the register rather than by a name filter alone.
  // PLANTED: removed the `s.id === 'SCR-CC-01'` term from `CC_NAV` in
  //          `src/surfaces/cc/screens.ts`.
  // RED: expected 13 to be 12.
  it('offers a rail entry for every routed screen but the entry point', () => {
    expect(CC_NAV).toHaveLength(12)
    expect(CC_NAV.map((n) => n.screen)).not.toContain('SCR-CC-01')
    for (const n of CC_NAV) {
      expect(n.pathname, n.screen).toMatch(/^\/command-center\/[a-z0-9-]+$/)
      expect(n.rolesThatCanOpen.length, n.screen).toBeGreaterThan(0)
    }
  })
})

/* ==================================================================== *
 * THE TWO MODULES THAT CLAIM NOTHING.
 * ==================================================================== */

describe('MOD-CC-02 is chrome and MOD-CC-13 is uncatalogued', () => {
  // FAILS IF: either abstention loses its reason, or a reason stops citing a
  // line. `noRouteReason` is required when `slug` is null and must never be a
  // placeholder, so the length floor is the shape of that requirement.
  // PLANTED: replaced MOD-CC-13's `noRouteReason` with 'Not routed.'.
  // RED: MOD-CC-13 noRouteReason -> expected 11 to be greater than 120.
  it('states a reason carrying a locator for each abstention', () => {
    const abstaining = CC_MODULE_SPINE.filter((m) => m.slug === null)
    expect(abstaining.map((m) => m.id)).toEqual(['MOD-CC-02', 'MOD-CC-13'])
    for (const m of abstaining) {
      const reason = m.noRouteReason ?? ''
      expect(reason.length, `${m.id} noRouteReason`).toBeGreaterThan(120)
      expect(reason, `${m.id} cites no line`).toMatch(/L\d{5}/)
    }
    for (const m of CC_MODULE_SPINE.filter((m) => m.slug !== null)) {
      expect(m.noRouteReason, `${m.id} claims a route and states a no-route reason`).toBeNull()
    }
  })

  // FAILS IF: MOD-CC-02 stops being shown on a screen it does not own, or
  // MOD-CC-13 appears on one. The distinction is the whole ruling: appearing
  // in a `Modules and features shown` cell is NOT ownership, and MOD-CC-13
  // appears in no cell at all. Both halves are read off the frozen register
  // rows, not off the records, so a record edited to agree with itself does
  // not satisfy this.
  // PLANTED: changed SCR-CC-10's `modulesShown` to
  //          'MOD-CC-10 all features, MOD-CC-13'.
  // RED: SCR-CC-10 modules column -> expected 'MOD-CC-10 all features' to be
  //      'MOD-CC-10 all features, MOD-CC-13'. The cell-by-cell register gate
  //      went red on the same plant, which is the pair working as intended.
  // THIS NOTE FILED A FALSE CITATION ON ITS FIRST WRITING, and
  //      `tests/coverage/locator-fidelity.test.ts` caught it. The note quoted
  //      the planted cell verbatim and put SCR-CC-10's register line in
  //      brackets after it, which reads as an identifier-anchored citation
  //      of MOD-CC-13 at a line that carries MOD-CC-10. Rewriting it to
  //      EXPLAIN the mistake reproduced it, because the explanation quoted
  //      the offending pair. A planted defect described with a line number is
  //      still a citation, and so is a post-mortem of one.
  it('finds MOD-CC-02 on the register and MOD-CC-13 nowhere on it', () => {
    const registerRows = Array.from({ length: 13 }, (_, i) => srcLine(REGISTER_FIRST + i))
    expect(registerRows.filter((r) => r.includes('MOD-CC-02'))).toHaveLength(1)
    expect(registerRows.filter((r) => r.includes('MOD-CC-13'))).toHaveLength(0)
    expect(srcLine(48387)).toContain('| MOD-CC-01, MOD-CC-02 |')

    for (const row of registerRows) {
      expect(row.includes('MOD-CC-13'), `${row.slice(0, 40)} names MOD-CC-13`).toBe(false)
    }
    expect(CC_CHROME_MODULES).toEqual(['MOD-CC-02'])
  })

  // FAILS IF: the action MOD-CC-10 exercises stops being action 5, or the
  // interconnection line stops saying so. This is the seam that is declared
  // here rather than discovered in slice 9, and it is checked against the
  // two source lines that carry it rather than against the seam record.
  // PLANTED: changed the `operational-action-set` seam's `sourceRef` to
  //          'L38668'.
  // RED: expected '| 4 | Release a lot hold, …' to contain 'Resolve or
  //      Resolve All sync conflicts'.
  it('binds SCR-CC-10 to action 5 of the closed set', () => {
    expect(srcLine(38175)).toContain('exercises action 5 of `MOD-CC-13`')
    const seam = CC_SEAMS.find((s) => s.id === 'operational-action-set')
    expect(seam).toBeDefined()
    expect(srcLineOf((seam as { sourceRef: string }).sourceRef)).toContain(
      'Resolve or Resolve All sync conflicts',
    )
    expect(srcLine(38669).startsWith('| 5 |')).toBe(true)
  })
})

/* ==================================================================== *
 * THE SURFACE EXCLUSION.
 * ==================================================================== */

const RUN = scenarioRunId('RUN-CC-001')
const BRIGHT_BIKES = tenantId('TEN-BRIGHT-BIKES')

const activeTenantState = () =>
  withTenant(emptyDomainState(RUN), BRIGHT_BIKES, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))

const identity = (role: RoleId): IdentitySimulationState => ({
  signedIn: true,
  role,
  tenant: BRIGHT_BIKES,
  siteScope: ['SITE-RIVERSIDE'],
  areaScope: ['AREA-ASSY-A'],
  qualifications: [],
  deviceId: null,
  stepUpActive: false,
  accessSessionId: null,
})

const ctxFor = (role: RoleId, online = true): AccessContext => ({
  state: activeTenantState(),
  identity: identity(role),
  online,
  deviceTrusted: true,
  actorOfRecord: 'USR-TEST',
})

/**
 * THE TWO EXCLUDED ROLES, NAMED HERE AS LITERALS AND NOT READ OUT OF THE
 * CONSTANT UNDER TEST. Every assertion below used to loop over
 * `CC_EXCLUDED_ROLES`, and planting a shortened constant — dropping 'WORKER'
 * — left the whole block GREEN, because the loop's subject shrank along with
 * its subject. That is the `toEqual([...MY_CONSTANT])` tautology from slice 7
 * wearing a `for...of`. These two are the SOURCE's, at L34963 and L34965, and
 * the constant is checked AGAINST them rather than trusted to supply them.
 */
const EXCLUDED_BY_SOURCE = ['READONLY_AUDITOR', 'WORKER'] as const satisfies readonly RoleId[]

describe('the two roles excluded at the surface boundary', () => {
  // FAILS IF: the shipped exclusion list stops being those two — shortened,
  // or widened to a role the source admits.
  // PLANTED: removed 'WORKER' from `CC_EXCLUDED_ROLES`.
  // RED: expected [ 'READONLY_AUDITOR' ] to deeply equal
  //      [ 'READONLY_AUDITOR', 'WORKER' ].
  it('excludes exactly the two the source excludes', () => {
    expect([...CC_EXCLUDED_ROLES]).toEqual([...EXCLUDED_BY_SOURCE])
  })

  // FAILS IF: an excluded role gets past the door. THE REQUEST EXPLICITLY
  // GRANTS THE ROLE IT IS ASKING ABOUT — `allowedRoles` names the auditor and
  // the worker — because an evaluator that consults the request first would
  // then ALLOW, and an evaluator that does nothing at all would still refuse
  // a role nobody granted. That is the arity-check shape from slice 7 in a
  // different costume: a gate whose subject can be deleted without changing
  // the answer. It is also asked with `online` both true and false, because
  // the Frontline's `forcesSyncFirst` defect was a correct rule tested inside
  // one connectivity branch.
  // PLANTED: removed 'WORKER' from `CC_EXCLUDED_ROLES` in
  //          `src/surfaces/cc/access.ts`.
  // RED: WORKER online=true -> expected 'allowed' to be 'explicitlyProhibited'.
  it('refuses them even when the request grants them, online or off', () => {
    for (const role of EXCLUDED_BY_SOURCE) {
      for (const online of [true, false]) {
        const req: AccessRequest = {
          action: 'cc.open-screen',
          allowedRoles: [...EXCLUDED_BY_SOURCE],
          sourceRefs: ['L48386'],
        }
        const d = evaluateCCAccess(req, ctxFor(role, online))
        expect(d.outcome, `${role} online=${online}`).toBe('explicitlyProhibited')
        expect(d.reasonCode, `${role} online=${online}`).toBe('EXPLICIT_DENY')
        expect(d.auditExpectation, `${role} online=${online}`).toBe('RECORDED_AS_REFUSAL')
      }
    }
  })

  // FAILS IF: the exclusion widens to a role the source admits. The three
  // admitted roles must reach `evaluateAccess` and be answered by it, so a
  // blanket refusal — which would pass the gate above on its own — fails
  // here. `Allowed` is checked by equality and never by prefix: slice 7 shipped
  // an outcome check where `Allowed` is a prefix of `Allowed with conditions`.
  // PLANTED: added 'TENANT_ADMIN' to `CC_EXCLUDED_ROLES`.
  // RED: TENANT_ADMIN -> expected 'explicitlyProhibited' to be 'allowed'.
  it('lets the three admitted roles through to the platform evaluator', () => {
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'TENANT_ADMIN'] as const) {
      const req: AccessRequest = {
        action: 'cc.open-screen',
        allowedRoles: [role],
        sourceRefs: ['L48386'],
      }
      expect(evaluateCCAccess(req, ctxFor(role)).outcome, role).toBe('allowed')
      expect(isCcExcludedRole(role), role).toBe(false)
    }
  })

  // FAILS IF: a screen record lists an excluded role, or `ccScreenOpensFor`
  // starts deriving the exclusion from that list instead of applying it
  // first. The two halves are one plant: adding the auditor to a screen turns
  // the first assertion red, and the second STAYING GREEN under that same
  // plant is what proves the exclusion is not read out of the list. A check
  // that only asked `ccScreenOpensFor(s, auditor) === false` against a clean
  // register could not fail at all, because no clean register names the role.
  // PLANTED: added 'READONLY_AUDITOR' to SCR-CC-11's `rolesThatCanOpen` in
  //          `src/surfaces/cc/screens.ts`.
  // RED: SCR-CC-11 lists an excluded role -> expected [ 'SCR-CC-11' ] to
  //      deeply equal []. `ccScreenOpensFor` stayed false throughout.
  it('opens no screen for an excluded role, however the record is written', () => {
    const listing = CC_SCREENS.filter((s) =>
      s.rolesThatCanOpen.some((r) => isCcExcludedRole(r)),
    ).map((s) => s.id)
    expect(listing).toEqual([])

    for (const s of CC_SCREENS) {
      for (const role of EXCLUDED_BY_SOURCE) {
        expect(ccScreenOpensFor(s.id, role), `${s.id} / ${role}`).toBe(false)
      }
      expect(ccScreenOpensFor(s.id, s.rolesThatCanOpen[0] as RoleId), s.id).toBe(true)
    }
  })

  // FAILS IF: the exclusion stops being the source's, or its locators stop
  // carrying it. Read off the frozen source: the surface-boundary sentence,
  // the criterion, and the two landing-table rows that say the same thing a
  // third way.
  // PLANTED: shifted the first `sourceRefs` entry in `evaluateCCAccess` one
  //          line earlier than L34963, onto the blank line above it.
  // RED: expected '' to contain 'an access exclusion at the surface boundary'.
  it('cites lines that carry the exclusion, not lines beside them', () => {
    const d = evaluateCCAccess(
      { action: 'cc.open-screen', allowedRoles: ['READONLY_AUDITOR'], sourceRefs: [] },
      ctxFor('READONLY_AUDITOR'),
    )
    const cited = d.sourceRefs.filter((r) => /^L\d+$/.test(r)).map((r) => srcLineOf(r))
    expect(cited).toHaveLength(2)
    expect(cited[0]).toContain('an access exclusion at the surface boundary')
    expect(cited[1]).toContain('never uses the Command Center')
    expect(srcLine(35080)).toContain('no Command Center access exists for this role')
    expect(srcLine(35081)).toContain('the Frontline Worker Application is the worker')
  })
})

/* ==================================================================== *
 * THE SEAM REGISTRY.
 * ==================================================================== */

describe('the cross-slice seams', () => {
  // FAILS IF: a seam is declared closed while its owner is still ahead of
  // this slice, or a seam names a module that is not on the spine. `status`
  // is derived from `ownerSlice`, so closing one means moving the slice
  // number and nothing else.
  // PLANTED: changed `operational-action-set`'s `ownerSlice` to 8.
  // RED: operational-action-set -> expected 'closed' to be 'open'.
  it('holds two open seams, both owned by slice 9', () => {
    expect(CC_SEAMS).toHaveLength(2)
    for (const seam of CC_SEAMS) {
      expect(ccSeamStatus(seam), seam.id).toBe('open')
      expect(seam.ownerSlice, seam.id).toBe(9)
      expect(() => ccModule(seam.consumingModule)).not.toThrow()
      expect(() => ccModule(seam.owningModule)).not.toThrow()
      expect(ccModule(seam.owningModule).slug, `${seam.id} owner`).toBeDefined()
      expect(seam.whatIsMissing.length, seam.id).toBeGreaterThan(120)
      expect(srcLineOf(seam.sourceRef).trim().length, `${seam.id} cites a blank line`).toBeGreaterThan(0)
    }
    expect(CC_SEAMS.map((s) => s.consumingModule)).toEqual(['MOD-CC-02', 'MOD-CC-10'])
  })
})

/* ==================================================================== *
 * WHAT THIS TASK DID NOT NEED TO ADD.
 * ==================================================================== */

describe('MOD-FL-A6 is already registered and must not be registered twice', () => {
  // FAILS IF: the Frontline's own record of its uncatalogued module is lost,
  // or a seventh destination is minted to hold it. This task added NOTHING
  // for MOD-FL-A6: slice 7 already recorded it with a stated no-route reason,
  // and a second registration would be a second spelling of a ruling. The
  // gate is here so that losing the first one is loud.
  // PLANTED: changed MOD-FL-A6's `slug: null` to `slug: 'sync-engine'` in
  //          `src/frontline/modules.ts`, then restored the file
  //          byte-identically (sha256 unchanged before and after).
  // RED: expected 5 to be 6 — six route directories under app/frontline, and
  //      a sixth slug claim among twelve modules.
  it('leaves the Frontline spine holding A6 with a stated no-route reason', () => {
    const spine = readFileSync(join('src', 'frontline', 'modules.ts'), 'utf8')
    const a6 = spine.slice(spine.indexOf("id: 'MOD-FL-A6'"), spine.indexOf("id: 'MOD-FL-A7'"))
    expect(a6).toContain('slug: null')
    expect(a6).toContain('L48529-L48534')
    expect(a6).toContain('AC-FL-010-5')
    expect(a6.length, 'the A6 record states no reason').toBeGreaterThan(400)

    // Five slug declarations for six destinations — the Frontline's own
    // arithmetic, unchanged by this task.
    expect([...spine.matchAll(/\bslug: '/g)]).toHaveLength(5)
    const dirs = readdirSync(join('app', 'frontline')).filter(
      (e) => !isForeignProbe(e) && statSync(join('app', 'frontline', e)).isDirectory(),
    )
    expect(dirs).toHaveLength(6)
    expect(srcLine(48689)).toContain('Exactly six destinations exist')
  })
})

/* ==================================================================== *
 * THE CLIENT BOUNDARY.
 * ==================================================================== */

describe('the Command Center spine is server data', () => {
  // FAILS IF: any spine file becomes a client module. Four Run Player panels
  // shipped `data-testid="fl-panel-undefined"` in the built HTML while every
  // component test passed, because a plain object exported from a
  // `'use client'` file does not cross the boundary as data — Next.js
  // replaces client-module exports with client references. A component suite
  // mounts the component and never sees it; this is the check that does.
  // PLANTED: added `'use client'` as the first line of
  //          `src/surfaces/cc/screens.ts`.
  // RED: expected [ 'src/surfaces/cc/screens.ts' ] to deeply equal [].
  it('carries no use-client directive anywhere under src/surfaces/cc', () => {
    const dir = join('src', 'surfaces', 'cc')
    const files = readdirSync(dir).filter((f) => !isForeignProbe(f) && /\.tsx?$/.test(f))
    expect(files.length).toBeGreaterThan(3)
    // A DIRECTIVE, NOT A MENTION. Written as a bare substring first, and it
    // was red on this file's own prose — `screens.ts` explains the boundary
    // defect and quotes the directive inside a comment. A gate that cannot
    // tell the warning from the offence would have to be silenced, and a
    // silenced gate is the next one deleted. Anchored to the start of a line
    // and to the quote, which is the only place a directive can take effect.
    const DIRECTIVE = /^\s*(['"])use client\1/m
    const offenders = files.filter((f) => DIRECTIVE.test(readFileSync(join(dir, f), 'utf8')))
    expect(offenders).toEqual([])
  })
})

import { test, expect, type Locator, type Page } from '@playwright/test'
import {
  drivableControls,
  type ExportedCheckbox,
  type ExportedSelect,
  type RouteControls,
} from '../e2e/exported-controls'
import { runAxe, scanHere } from './axe-policy'
import { STUDIO_PERSONA_IDS } from '@/studio/modules'
import { STU_APPLICABLE_STATES } from '@/studio/state/screen-states'
import { SA_APPLICABLE_STATE_IDS } from '@/surfaces/sa/screen-states'
import { rolesInDomain } from '@/domain/roles'
import { SCREEN_STATES } from '@/ui/screen-state'

/**
 * WCAG 2.2 AA IN EVERY STATE THIS BUILD CAN BE DRIVEN INTO, not only the
 * one each page loads in.
 *
 * THE GAP THIS CLOSES, measured by task 26 rather than guessed. `axe.spec.ts`
 * scanned every exported route with zero violations and zero unexplained
 * incomplete results — and every one of those scans was `page.goto(path)`
 * followed immediately by `analyze()`. No harness in this build had ever
 * changed a persona, moved a screen-state selector or ticked a simulation
 * toggle before scanning. Counted both ways, eighteen of eighteen Studio
 * screens had a pass BY ROUTE and seven of eighteen had one by a
 * state-driving walk (the 22 composed journey steps in
 * `tests/component/stu-journey.test.tsx`), leaving ELEVEN screens with no
 * state pass of any kind.
 *
 * That gap has a worked example attached. The `aria-prohibited-attr` defect
 * found this week lived at two sites, and the second was
 * `ContentLibrariesScreen`'s storyboard-failure switch on
 * `/studio/content-libraries/` — one of the eleven, on a screen no composed
 * journey step reaches. Component coverage and route coverage cover
 * DIFFERENT SETS, and this build has a real defect demonstrating the
 * difference. This file covers the union: every exported route, every
 * derived control position.
 *
 * ===================================================================
 * THE SECOND GAP, AND WHY THIS FILE IS NO LONGER STUDIO-ONLY.
 * ===================================================================
 *
 * This file used to open with `CONTROLS.filter((c) => c.path.startsWith(
 * '/studio/'))`, and every block below drove that list. So the 164 driven
 * scans it reported — every persona, every screen state, every simulation
 * toggle — covered THE STUDIO ALONE. There were ZERO driven browser scans
 * for any Hub or Super Admin route, on a build where the Hub and the console
 * carry most of the routes between them. The coverage was described in two
 * dispatches without that scope, which overstates a claim that goes in front
 * of a client.
 *
 * THE ROUTE COUNTS THAT USED TO BE WRITTEN HERE ARE GONE RATHER THAN
 * CORRECTED. This comment said "the Hub carries eighteen routes and the
 * console twenty"; both were true when written and both went stale when slice
 * 10 added routes to each. Renumbering a stale count reships the identical
 * defect with a fresher number, and the count was never the claim a reader
 * could act on — the claim is that the driven set is the whole export, and
 * `routesOf` derives it per surface on every run. There is no number here to
 * go stale again.
 *
 * WIDENING THE FILTER ALONE WOULD HAVE ADDED NOTHING, AND THAT IS THE
 * TRAP. Every block below guards on `route.selects.find(isPersonaSelect)`
 * and `continue`s when there is none — `proveLive` needs a control it can
 * prove re-renders the page before anything else is trusted. `isPersonaSelect`
 * was exact-set-equality against `STUDIO_PERSONA_IDS`, and MEASURED: that
 * predicate matches on 18 of 18 Studio routes and on 0 of 38 Hub and Super
 * Admin routes. Deleting the prefix filter and changing nothing else would
 * have emitted zero new tests, silently, while the persona-completeness test
 * went red on all 38 routes for the wrong reason. A widening that adds no
 * scans and a red that names the wrong cause is worse than the honest narrow
 * claim it replaced.
 *
 * The surfaces DO carry the same three kinds of control; they carry them
 * with DIFFERENT VOCABULARIES. So the vocabularies are declared per surface,
 * below, and every classifier takes the surface it is asked about. Nothing
 * else in this file changed shape.
 *
 * WHAT IS DERIVED AND WHAT IS DECLARED. The routes come from the export
 * (`../e2e/exported-routes`). The controls and their positions come from
 * the export (`../e2e/exported-controls`). Nothing here is a hand list, and
 * a new option is driven the moment `pnpm build` emits it. What is NOT
 * derived from the export is the ANSWER the enumeration is checked against:
 * the role vocabularies come from `@/domain/roles` and `@/studio/modules`,
 * and the state models from `@/studio/state/screen-states`,
 * `@/surfaces/sa/screen-states` and `@/ui/screen-state` — so "is the
 * enumeration complete" is asked of sources independent of the field under
 * test.
 *
 * C17 — AN ENUMERATION THAT SILENTLY FINDS NOTHING IS RED. Every derived
 * list below carries a floor. This build has already shipped one gate that
 * scanned zero files and reported success, and a derived list is one empty
 * directory away from being the hand list wearing a walk.
 */

const CONTROLS: readonly RouteControls[] = drivableControls()

/**
 * LOCATES A DERIVED CONTROL ON THE LIVE PAGE, BY ITS DERIVED LABEL.
 *
 * IT USED TO LOCATE BY THE EXPORTED `id`, AND THAT IS A REAL BUG THIS TASK
 * MEASURED RATHER THAN GUESSED AT.
 *
 * `tests/e2e/exported-controls.ts` parses each control's `useId` value out of
 * `index.html` and its comment argues that the id "is IDENTICAL in the
 * server-rendered markup and after hydration, which is the whole contract of
 * `useId`". That is true, and it is not enough. `useId` is stable across
 * HYDRATION; it is NOT stable across an UNMOUNT AND REMOUNT, where React
 * mints a fresh value. Measured on `/hub/integration-surface/`, driving the
 * viewer role away from its default and back:
 *
 *   before  Screen state = _R_a5uav5ubtb_      (server-rendered)
 *   away    Screen state = _r_1_               (remounted on the client)
 *   back    Screen state = _r_5_               (remounted again)
 *
 * The route's Screen-state select sits inside the region that unmounts when a
 * role cannot read it, so after the hydration probe the exported id addressed
 * NOTHING. `locator.selectOption` then waited for an element that would never
 * appear, and — because Playwright actions inherit the TEST timeout when none
 * is given — the failure surfaced five minutes later as
 * `locator.selectOption: Test timeout of 300000ms exceeded`, which names the
 * clock and not the cause. Two Hub routes were lost to it.
 *
 * THE LABEL IS STILL DERIVED. It comes from the same parse of the same export
 * as the id did — `exported-controls.ts` already returns it — so this is not
 * the hand list of prose that this file rejects elsewhere. A relabelled
 * control changes the export and the locator together, in one build.
 * Measured before relying on it: across all 78 exported routes there is not
 * one duplicated control label and not one empty one, so the label is a
 * unique handle on every route it is used on.
 *
 * AND IT IS SCOPED TO THE CONTROL'S ROLE, which the first version was not.
 * A plain `getByLabel('Screen state')` matched TWO elements on three routes —
 * the `<select>` and a `<section aria-label="Screen state">` that renders the
 * state treatment beside it — and Playwright's strict mode rejected both.
 * That uniqueness measurement counted control labels, and an accessible name
 * on a landmark is not a control label. Asking for the ROLE as well as the
 * name says which of the two is wanted: a single `<select>` is a `combobox`
 * and a checkbox input is a `checkbox`, so a section can never answer.
 */
const control = (page: Page, c: ExportedSelect | ExportedCheckbox): Locator =>
  page.getByRole('options' in c ? 'combobox' : 'checkbox', { name: c.label, exact: true })

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

/**
 * THE FOUR ROLE VOCABULARIES THE BUILT PAGES OFFER, from their registries.
 *
 * `@/domain/roles` is the one register of who exists: four roles in the
 * PLATFORM security domain and five in the TENANT domain. The Studio's
 * viewer control is a different axis again — eight authoring PERSONAS, which
 * are role-plus-grant combinations rather than roles — and it has its own
 * register in `@/studio/modules`.
 */
const TENANT_ROLE_IDS: readonly string[] = rolesInDomain('TENANT').map((r) => r.id)
const PLATFORM_ROLE_IDS: readonly string[] = rolesInDomain('PLATFORM').map((r) => r.id)

/**
 * THE SUPER ADMIN CONSOLE SHIPS ITS VIEWER CONTROL IN TWO ID SCHEMES, AND
 * THIS IS A FINDING, NOT A CONVENIENCE.
 *
 * Some console routes give "View as platform role" the canonical `RoleId`
 * values from `@/domain/roles` (`ROOT_SUPER_ADMIN`, `ADMIN`,
 * `PLATFORM_ENGINEER`, `SUPPORT`) and the rest give it the blueprint
 * annotation tokens instead (`ROLE-PLAT-ROOT`, `ROLE-PLAT-ADMIN`,
 * `ROLE-PLAT-ENG`, `ROLE-PLAT-SUP`). The two map one to one —
 * `app/super-admin/platform-audit/PlatformAuditScreen.tsx:71` carries the
 * mapping explicitly — so both are four positions on the same four roles, and
 * neither is an accessibility defect.
 *
 * THE PER-SCHEME COUNTS THAT USED TO BE HERE ARE REMOVED, NOT UPDATED. This
 * comment said "nine console routes ... and nine give the blueprint annotation
 * tokens"; the split moved when slice 10 added console routes, and a renumber
 * would only reship the same defect with a fresher pair of numbers. Neither
 * number was ever load-bearing: what matters is that BOTH schemes are declared
 * here, and the completeness test below is what measures the split on every
 * run — and goes red if a THIRD scheme appears.
 *
 * There is no shared export for the token scheme: each screen that uses it
 * declares its own. That is the reason this list is written out here rather
 * than imported, it is the only hand list in this file, and it is named in
 * the task report as an inconsistency to close in `app/super-admin/**`.
 * Until it is closed, a harness that declared only one scheme would silently
 * skip half the console — which is exactly the failure this file exists to
 * end. The completeness test below goes red if a THIRD scheme appears.
 */
const PLATFORM_ROLE_TOKENS: readonly string[] = [
  'ROLE-PLAT-ROOT',
  'ROLE-PLAT-ADMIN',
  'ROLE-PLAT-ENG',
  'ROLE-PLAT-SUP',
]

/**
 * The Hub declares no applicable-state model of its own. `@/studio/state/
 * screen-states` and `@/surfaces/sa/screen-states` each publish one; there is
 * no `@/surfaces/doh/screen-states`, so the build-wide contract stands in:
 * all thirteen states less `STATE-07` Offline, which `@/ui/screen-state`
 * marks `frontlineOnly` and which therefore belongs to `/frontline/` alone.
 * The missing Hub export is named in the task report as a gap to close.
 */
const NON_FRONTLINE_STATE_IDS: readonly string[] = SCREEN_STATES.filter(
  (s) => !s.frontlineOnly,
).map((s) => s.id)

interface UnreachedState {
  readonly id: string
  readonly reason: string
}

/**
 * A DRIVEN SURFACE: the prefix its routes share, the role vocabularies its
 * viewer control may offer, the states it declares, and what it cannot reach.
 *
 * One row per surface, and every block below iterates all of them. Adding a
 * fourth surface is a row here and no other edit.
 */
interface DrivenSurface {
  readonly id: string
  readonly prefix: string
  /** More than one, because Super Admin ships two id schemes for the same
   *  control. A select classifies as the viewer control if its option set
   *  equals ANY of them exactly. */
  readonly roleVocabularies: readonly (readonly string[])[]
  readonly declaredStates: readonly string[]
  readonly unreachedStates: readonly UnreachedState[]
  /** Routes on this surface that offer NO viewer control, and so cannot be
   *  proven live before anything is driven on them. Recorded, never skipped
   *  silently. Compared for EQUALITY by the test below. */
  readonly unreachedRoutes: readonly UnreachedState[]
  /** Routes carrying MORE than one select whose options equal a role
   *  vocabulary. The first in document order is the shell's viewer control;
   *  see `viewerSelect`. Compared for EQUALITY. */
  readonly ambiguousRoutes: readonly string[]
}

/**
 * STATES THIS BUILD DECLARES AND NO BUILT PAGE ON THAT SURFACE CAN BE DRIVEN
 * INTO.
 *
 * Recorded as UNREACHED, and never as passing. Slice 4 shipped an
 * accessibility claim covering zero of the screens it named and had to
 * retract it; the distinction between "scanned and clean" and "no page
 * renders this" is the whole reason that retraction happened, so it is
 * carried structurally here rather than in prose.
 *
 * A STATE IS NOT REMOVED FROM THIS LIST BY DELETING IT FROM THE MODEL. The
 * completeness test below requires observed ∪ unreached to equal each
 * surface's declared set EXACTLY, so dropping a row from a model to make a
 * list shorter turns the test red rather than green, and adding a state here
 * that IS drivable turns it red too.
 *
 * WIDENING RETIRED THREE OF THESE ON THE BUILD AS A WHOLE, and that is the
 * clearest single argument for having widened. `STATE-09`, `STATE-10` and
 * `STATE-11` were recorded here as unreached when this file saw only the
 * Studio. The Super Admin console offers all twelve declared states as
 * positions on eighteen state selects across eighteen routes, so all three
 * are now DRIVEN AND SCANNED. They remain unreached ON THE STUDIO, and
 * `STATE-10`/`STATE-11` remain unreached on the Hub, which is why the record
 * is per surface: a build-wide "unreached" would have been wrong in one
 * direction and a build-wide "covered" wrong in the other.
 */
const SURFACES: readonly DrivenSurface[] = [
  {
    id: 'Studio',
    prefix: '/studio/',
    roleVocabularies: [STUDIO_PERSONA_IDS],
    declaredStates: STU_APPLICABLE_STATES.map((r) => r.id),
    unreachedStates: [
      {
        id: 'STATE-09',
        reason:
          'Declared applicable to SCR-STU-04 and SCR-STU-11 at publication (departure 2 of 4, L48330). ' +
          'It is NAMED on /studio/approvals/ — inside the "Screen states this surface applies here" ' +
          'list, which is a list of state ids, not a rendered state treatment — and no control on any ' +
          'built Studio page offers it as a position. Either SCR-STU-04 and SCR-STU-11 are missing the ' +
          'queued rendering the model declares for them, or the model declares a rendering the build ' +
          'does not owe. Not resolved here, and not resolved by shortening this list. It IS driven on ' +
          'Super Admin, which is why this entry is scoped to the Studio.',
      },
      {
        id: 'STATE-10',
        reason:
          'Declared applicable to SCR-STU-04 and SCR-STU-13 (drafting aid degraded, departure 3 of 4, ' +
          'L48330). `grep -rl STATE-10 out/studio/` returns ZERO pages: it is not rendered, not named ' +
          'in any applicable-states list, and offered by no control. The screens the model names are ' +
          '/studio/screen-configuration/, /studio/agents/ and /studio/learning/, and none of them ' +
          'renders a degraded drafting aid. It IS driven on Super Admin.',
      },
      {
        id: 'STATE-11',
        reason:
          'Declared applicable to SCR-STU-04 and SCR-STU-13 (drafting aid unavailable, departure 3 of ' +
          '4, L48330). Same measurement as STATE-10 and the same zero. Kept as its own entry because ' +
          'degraded and unavailable are two of the four things the state contract exists to keep ' +
          'apart (L48007), and collapsing them here would repeat the mistake one level up. It IS ' +
          'driven on Super Admin.',
      },
    ],
    unreachedRoutes: [],
    ambiguousRoutes: [],
  },
  {
    id: 'Hub',
    prefix: '/hub/',
    roleVocabularies: [TENANT_ROLE_IDS],
    declaredStates: NON_FRONTLINE_STATE_IDS,
    unreachedStates: [
      {
        id: 'STATE-10',
        reason:
          'Artificial-intelligence-degraded. Measured over the export: all nine Hub screen-state ' +
          'selects omit it, so no Hub page can be driven into it, while `grep -rl STATE-10 out/hub/` ' +
          'returns NINE pages — every one of them naming it inside an applicable-states list rather ' +
          'than rendering a treatment for it. That is the same shape as STATE-09 on /studio/approvals/: ' +
          'the surface claims the state applies and offers no way to see it. It IS driven on Super ' +
          'Admin, so the rendering exists somewhere in this build and the Hub simply does not offer it.',
      },
      {
        id: 'STATE-11',
        reason:
          'Artificial-intelligence-unavailable. Same measurement as STATE-10 on this surface and the ' +
          'same nine naming pages with zero offering controls. Kept as its own entry because degraded ' +
          'and unavailable are two of the four things the state contract exists to keep apart ' +
          '(L48007), and collapsing them here would repeat the mistake one level up. It IS driven on ' +
          'Super Admin.',
      },
    ],
    unreachedRoutes: [],
    ambiguousRoutes: [
      // `View as tenant role` (the shell's, first in document order) AND
      // `Role to assign` (the screen's, index 7) both offer exactly the five
      // tenant roles, so option-set equality alone cannot tell them apart.
      // See `viewerSelect` for why first-in-document-order is the shell's.
      '/hub/permissions-roles-and-access/',
    ],
  },
  {
    id: 'Super Admin',
    prefix: '/super-admin/',
    roleVocabularies: [PLATFORM_ROLE_IDS, PLATFORM_ROLE_TOKENS],
    declaredStates: SA_APPLICABLE_STATE_IDS,
    unreachedStates: [],
    unreachedRoutes: [
      {
        id: '/super-admin/',
        reason:
          'The console index. It carries no viewer control at all — no "View as platform role", no ' +
          '"Viewing as" — so there is no control this harness can prove re-renders the page before it ' +
          'trusts a reading taken on it, and `proveLive` has nothing to address. It is scanned at its ' +
          'default state by `axe.spec.ts` and is NOT driven here. Reported as unreached rather than ' +
          'skipped: a route that silently emits no test is the defect this file exists to end.',
      },
      {
        id: '/super-admin/trace-viewer/',
        reason:
          'Carries eight selects and no viewer control among them, so like the console index it has no ' +
          'control this harness can prove live before driving. Its own selects (Actor, Object, Event ' +
          'class, Date range, Tenant and the filters) are screen filters, not viewer switches, and ' +
          'driving one proves nothing about hydration. Scanned at its default state by `axe.spec.ts`, ' +
          'not driven here, and recorded rather than skipped.',
      },
    ],
    ambiguousRoutes: [],
  },
]

const routesOf = (surface: DrivenSurface): readonly RouteControls[] =>
  CONTROLS.filter((c) => c.path.startsWith(surface.prefix))

/**
 * A control is a STATE driver if every position it offers is drawn from the
 * surface's state vocabulary, and the VIEWER control if the set of positions
 * it offers IS one of the surface's role vocabularies. Classified by what the
 * control carries, not by its label text: a label is prose and can be
 * reworded, and a hand list of labels is the enumeration defect this file
 * exists to close, one level down. `options.length > 0` is load-bearing —
 * `[].every(...)` is `true`, so an empty select would otherwise classify as a
 * state driver and drive nothing.
 */
const isStateSelect = (surface: DrivenSurface, s: ExportedSelect): boolean =>
  s.options.length > 0 && s.options.every((o) => surface.declaredStates.includes(o))

const isRoleSelect = (surface: DrivenSurface, s: ExportedSelect): boolean =>
  surface.roleVocabularies.some((v) => sameSet(s.options, v))

/**
 * THE VIEWER CONTROL, when a route carries more than one select that offers a
 * role vocabulary.
 *
 * Measured: exactly one route in this build does — `/hub/permissions-roles-
 * and-access/`, where the shell's `View as tenant role` and the screen's own
 * `Role to assign` both offer the five tenant roles. Option-set equality
 * cannot separate them, and matching on the label would reintroduce the hand
 * list of prose this file rejects everywhere else.
 *
 * FIRST IN DOCUMENT ORDER is the shell's, and that is a structural fact
 * rather than a guess: `HubShell` and the Studio shell each render their
 * reviewer control in the chrome ABOVE the screen body, and `controlsInHtml`
 * collects `<label for>` in document order. Verified on the one ambiguous
 * route: `View as tenant role` is index 0 and `Role to assign` is index 7. The
 * ambiguity itself is pinned per surface and compared for equality, so a
 * SECOND route growing one goes red and gets read rather than absorbed.
 *
 * `SaConsoleShell` USED TO BE NAMED IN THAT LIST AND IT DOES NOT BELONG
 * THERE: it renders NO viewer control in either of its two modes, and each
 * console screen declares its own. The same claim in the other direction is
 * already written below — the `/super-admin/` entry in `unreachedRoutes` says
 * the console index "carries no viewer control at all" — and that half is the
 * correct one. Nothing on this surface is ambiguous, which is why
 * `ambiguousRoutes` is empty for it; the reasoning above is about the Hub.
 */
const viewerSelect = (surface: DrivenSurface, route: RouteControls): ExportedSelect | undefined =>
  route.selects.find((s) => isRoleSelect(surface, s))

/* ==================================================================== *
 * THE ENUMERATIONS, AND THE ASSERTION THAT THEY ARE COMPLETE.
 * ==================================================================== */

test('the derived control enumeration is not a stub', () => {
  // C17. Every one of these is a floor over a DERIVED list, and a derived
  // list read off an empty or half-written export scans nothing and passes.
  expect(CONTROLS.length, 'no route carried a parsed control set').toBeGreaterThan(70)
  expect(
    CONTROLS.reduce((n, c) => n + c.selects.length + c.checkboxes.length, 0),
    'no drivable control was parsed out of the export at all',
  ).toBeGreaterThan(200)
  for (const surface of SURFACES) {
    expect(routesOf(surface).length, `${surface.id}: no routes`).toBeGreaterThan(15)
  }
})

test('every surface offers its viewer control on every route, or records why not', () => {
  for (const surface of SURFACES) {
    expect(
      surface.roleVocabularies.every((v) => v.length > 2),
      `${surface.id}: a role vocabulary is empty or gutted`,
    ).toBe(true)

    const missing: string[] = []
    const ambiguous: string[] = []
    for (const route of routesOf(surface)) {
      const matches = route.selects.filter((s) => isRoleSelect(surface, s))
      if (matches.length === 0) missing.push(route.path)
      if (matches.length > 1) ambiguous.push(route.path)
      // The expectation is the role VOCABULARY; the field under test is what
      // separately-built pages actually shipped. A route that filtered the
      // list — dropping the prohibited Worker or the open-decision Auditor
      // because those two render awkward branches — offers a set matching no
      // declared vocabulary and lands in `missing` here.
    }

    // EQUALITY, both directions, on both records. A route that grows a viewer
    // control goes red until it leaves this list; a route that loses one goes
    // red until it is entered with a written reason.
    expect(
      missing.sort(),
      `${surface.id}: routes with no viewer control do not match the recorded UNREACHED list`,
    ).toEqual(surface.unreachedRoutes.map((u) => u.id).sort())
    expect(
      ambiguous.sort(),
      `${surface.id}: routes carrying two role-vocabulary selects do not match the recorded list`,
    ).toEqual([...surface.ambiguousRoutes].sort())

    for (const u of surface.unreachedRoutes) {
      expect(u.reason.length, `${u.id}: an unreached route must say WHY`).toBeGreaterThan(120)
    }
  }
})

test('the state enumeration is complete against each surface model, or recorded as unreached', () => {
  const totals: string[] = []
  for (const surface of SURFACES) {
    const stateSelects = routesOf(surface).flatMap((r) =>
      r.selects.filter((s) => isStateSelect(surface, s)).map((s) => ({ path: r.path, select: s })),
    )
    const drivable = [...new Set(stateSelects.flatMap((s) => s.select.options))].sort()

    // C17 floors first: an enumeration that found nothing must be RED.
    expect(surface.declaredStates.length, `${surface.id}: the state model is empty`).toBeGreaterThan(10)
    expect(
      stateSelects.length,
      `${surface.id}: no built page offers a screen-state control`,
    ).toBeGreaterThan(2)
    expect(drivable.length, `${surface.id}: no screen state can be driven anywhere`).toBeGreaterThan(7)

    // The unreached list may not absorb a state that IS drivable — that is
    // how "unreached" quietly becomes an excuse rather than a measurement.
    const unreachedIds = surface.unreachedStates.map((u) => u.id)
    expect(
      drivable.filter((id) => unreachedIds.includes(id)),
      `${surface.id}: a state recorded as unreached is in fact drivable — correct the record, do not keep it`,
    ).toEqual([])

    // EXACT, both directions. Not a subset assertion: a subset check passes
    // on the empty set and on equal sets, which is defect shape 9 in this
    // build's own list. Every declared state is either driven below or
    // carries a written reason it could not be.
    expect(
      [...drivable, ...unreachedIds].sort(),
      `${surface.id}: the declared state model and the built tree disagree, and nothing accounts for the difference`,
    ).toEqual([...surface.declaredStates].sort())

    for (const u of surface.unreachedStates) {
      expect(u.reason.length, `${u.id} on ${surface.id}: an unreached state must say WHY`).toBeGreaterThan(120)
    }
    totals.push(`${surface.id} selects=${stateSelects.length} drivable=${drivable.length}`)
  }
  console.log(`[axe-states] state enumeration — ${totals.join(' | ')}`)
})

/* ==================================================================== *
 * THE DRIVER.
 * ==================================================================== */

/**
 * Drives one control to one position and waits for the page to STOP changing,
 * WITHOUT requiring that it changed at all.
 *
 * WHY THIS EXISTS ALONGSIDE `driveAndProveChanged`, AND WHY IT IS NOT A
 * RELAXATION. `driveAndProveChanged` encodes "a control position that renders
 * nothing new is a defect". MEASURED, that is true of the Studio persona
 * select and false of the Hub and console viewer controls:
 *
 *   /studio/builder/            8 distinct renderings of 8 personas
 *   /hub/integration-surface/   5 of 5 tenant roles
 *   /hub/parts-registry/        4 of 5 — SUPERVISOR and QUALITY_MANAGER agree
 *   /hub/                       2 of 5 — only WORKER differs from the rest
 *   /super-admin/eval-harness/  3 of 4 — ROOT_SUPER_ADMIN and PLATFORM_ENGINEER agree
 *   /super-admin/platform-audit/ 3 of 4 — ROLE-PLAT-ROOT and ROLE-PLAT-ADMIN agree
 *
 * Two roles holding the same permissions SEE THE SAME SCREEN, and the Hub
 * index is the clearest case: it lists the modules a role may reach, and four
 * of the five tenant roles may reach the same ones. Demanding a distinct
 * rendering per role there demands the product be wrong — the same mistake,
 * in the same file, that demanding an immediate re-render of a DEFERRED
 * toggle would be.
 *
 * What is NOT relaxed: the page must still be proven live before anything is
 * driven on it (`proveLive`, which requires two proven re-renders), and the
 * viewer block still requires at least one position on the route to re-render,
 * so a control that is genuinely dead is still RED. The per-POSITION
 * requirement is what measurement retired, not the anti-vacuity requirement.
 *
 * AND EVERY POSITION IS STILL SCANNED. That is the point of settling rather
 * than asserting: a position that renders identically is still a position a
 * reader can put the page into, so it gets an axe scan either way.
 */
async function driveAndSettle(
  page: Page,
  main: Locator,
  before: string,
  apply: () => Promise<unknown>,
): Promise<string> {
  await apply()
  // AT MOST THREE READS OF `#main`, AND USUALLY ONE, because `innerHTML` is
  // the expensive operation in this file and not the waiting.
  //
  // MEASURED. The first version of this settled by polling until two
  // consecutive reads matched — up to fifteen serialisations of the whole
  // subtree per drive. On most routes that was invisible; on
  // `/hub/integration-surface/` and `/hub/tenant-lifecycle-and-tier-operations/`
  // it cost FIVE MINUTES per test, against nineteen seconds for a console
  // route driving MORE positions, because those two screens hold content that
  // never stops changing and so never satisfied "two reads agree". A settle
  // rule whose cost depends on whether the page ever goes quiet is a settle
  // rule that will time out on the next animated screen somebody ships.
  //
  // A position that renders something NEW is detected on the first read and
  // costs one serialisation. Only a position that renders nothing new pays for
  // the other two, and those two exist so a genuinely slow render is not
  // misread as an identical one.
  for (const wait of [250, 750, 2_000]) {
    await page.waitForTimeout(wait)
    const now = await main.innerHTML()
    if (now !== before) return now
  }
  // Identical to what preceded it — which is a fact about the product, and
  // the caller's distinctness assertion is what decides whether it is a fault.
  return before
}

/** The live value, not option zero: `selected` is decided by the `<select>`'s
 *  value, and the default position is the one already covered by the
 *  route-level scan in `axe.spec.ts`. Only the OTHERS are new coverage. */
async function nonDefaultPositions(page: Page, select: ExportedSelect): Promise<string[]> {
  const current = await control(page, select).inputValue()
  return select.options.filter((o) => o !== current)
}

/**
 * PROVES THE PAGE IS LIVE BEFORE ANYTHING IS DRIVEN ON IT, and does it with a
 * product control rather than a React internal.
 *
 * WHY IT IS NEEDED AT ALL. `page.goto` resolves on the server-rendered
 * markup; React attaches its listeners some time after. A drive that lands in
 * that window sets a DOM property, fires an event nothing is listening to,
 * and re-renders nothing — so a reading taken either side of it is a reading
 * of the SAME state under two names. `driveAndProveChanged` closes that for
 * any control whose effect IS a render. It cannot close it for a deferred
 * control, whose effect is by definition not a render, and a checkbox is
 * worse than useless as its own probe: Playwright's `setChecked` clicks the
 * input, so `isChecked()` reports the new value whether or not React ever saw
 * it.
 *
 * WHAT IS USED INSTEAD. The surface's VIEWER control — the Studio persona
 * select, the Hub's `View as tenant role`, the console's `View as platform
 * role` — derived from the export like everything else here, present on
 * every route of every surface except the two console routes recorded in
 * `unreachedRoutes` (the viewer-control test above is what goes red if that
 * stops being true), and proven to re-render by the viewer block below.
 * Driven off its default and back, with BOTH moves required to change the
 * page. Two proven re-renders is a live page; anything less times out RED
 * rather than reading a half-attached one.
 *
 * It returns to the default it started from, so what follows is measured
 * against the state the route loads in and not against another role's view.
 */
async function proveLive(page: Page, roleSelect: ExportedSelect, where: string): Promise<string> {
  const main = page.locator('#main')
  const select = control(page, roleSelect)
  const home = await select.inputValue()
  const away = roleSelect.options.filter((o) => o !== home)
  if (away.length === 0) throw new Error(`${where}: the viewer control offers only its default`)

  // A FULL ROUND TRIP PER CANDIDATE, AND THE ROUND TRIP IS THE POINT.
  //
  // THE BUG THIS REPLACES, because it is subtle and it cost two console
  // routes a red that named the wrong cause. The previous version snapshotted
  // `#main` immediately after `goto`, drove one away position, and accepted it
  // as proof of life the moment the markup differed from that snapshot. But
  // `goto` resolves on the SERVER-RENDERED markup, and React hydrating changes
  // the markup on its own — so the very first comparison is "different"
  // whether or not the role had anything to do with it. The probe then
  // believed a position that renders identically to the default, and driving
  // BACK to the default could not change anything, and the failure surfaced
  // twenty seconds later as "driving the control changed nothing on the page"
  // on `/super-admin/platform-settings/` and
  // `/super-admin/platform-overview-and-health/` — two routes measured to
  // render two of their four roles identically.
  //
  // Comparing a home rendering against an away rendering that were BOTH taken
  // after a settle removes hydration from the comparison entirely: whatever
  // hydration did, it did to both. The first candidate's round trip absorbs
  // it, and the difference that remains is the role.
  //
  // It also leaves the page ON the default, which is what the callers need:
  // everything after this is measured against the state the route loads in
  // rather than against some other role's view.
  //
  // Both legs are read the SAME way -- drive, wait one settle, read once --
  // so neither is favoured and the only asymmetry left between them is the
  // role. One `innerHTML` per leg, which matters: it is the expensive call.
  const settledRead = async (apply: () => Promise<unknown>): Promise<string> => {
    await apply()
    await page.waitForTimeout(500)
    return main.innerHTML()
  }

  for (const option of away) {
    const awayHtml = await settledRead(() => select.selectOption(option))
    const homeHtml = await settledRead(() => select.selectOption(home))
    if (homeHtml !== awayHtml) return homeHtml
  }

  throw new Error(
    `${where}: no position of the viewer control re-renders the page, so nothing measured here ` +
      'can be told apart from a reading taken before React attached its listeners. Either the ' +
      'control is dead, or every role on this route sees byte-identical markup.',
  )
}

/* ==================================================================== *
 * VIEWER ROLES — every non-default position of the viewer control, on every
 * route of every surface: eight Studio personas, five tenant roles on the Hub,
 * four platform roles on the console. The routes are derived per surface by
 * `routesOf` on every run, and the console routes with no viewer control are
 * recorded in `unreachedRoutes` and asserted BY EQUALITY above — which is what
 * makes "every route" a measurement instead of a count somebody maintains.
 *
 * THE PER-SURFACE ROUTE COUNTS ARE REMOVED RATHER THAN UPDATED. This header
 * said "eighteen Hub routes" and "eighteen of the twenty console routes";
 * slice 10 added routes to both surfaces and both figures went stale in the
 * same commit. The equality assertion above already measures the difference and
 * names the routes, so the numbers were never the claim.
 * ==================================================================== */

for (const surface of SURFACES) {
  for (const route of routesOf(surface)) {
    const roleSelect = viewerSelect(surface, route)
    // Recorded in `surface.unreachedRoutes` and compared for EQUALITY by the
    // viewer-control test above, which is what goes red if this route was
    // never meant to be here. Never a silent skip.
    if (!roleSelect) continue

    test(`${route.path} — axe in every non-default viewer role`, async ({ page }) => {
      // The config's blanket is 90s, sized for a page and one axe sweep. This
      // test now drives up to seven positions and scans at EVERY one of them,
      // after a hydration round trip -- eight axe runs, not one. Measured with
      // the machine to itself a Studio viewer test costs 8-12s; measured on a
      // machine also running the rest of the e2e suite, `/studio/permissions-
      // and-grants/` crossed 90s and reported `Test timeout exceeded`, which
      // names the clock and not the cause. The budget is raised because the
      // WORK grew, not to paper over a slow machine: a real hang still fails,
      // three minutes later, and every red this file is designed to produce is
      // an assertion with a message rather than a timeout.
      test.setTimeout(180_000)
      await page.goto(route.path)
      const main = page.locator('#main')
      const select = control(page, roleSelect)
      const positions = await nonDefaultPositions(page, roleSelect)
      // Every position but the one the page loads in. Pinned to the control's
      // own arity rather than to a constant, because the surfaces differ (8,
      // 5 and 4 positions) and a shared floor would be vacuous on the widest
      // of them and wrong on the narrowest.
      expect(positions.length, `${route.path}: nothing to drive`).toBe(roleSelect.options.length - 1)
      expect(positions.length, `${route.path}: the viewer control is a stub`).toBeGreaterThan(2)

      // The page is proven live ONCE, here, with two required re-renders, and
      // it returns to the default it started from. Everything after this is a
      // reading of a hydrated page, so a position that renders nothing new is
      // reporting a fact about permissions rather than about React.
      await proveLive(page, roleSelect, `${route.path} [default]`)

      const rendered = new Map<string, string>()
      let previous = await main.innerHTML()
      rendered.set('the default', previous)
      const undecided = new Set<string>()
      for (const role of positions) {
        previous = await driveAndSettle(page, main, previous, () => select.selectOption(role))
        rendered.set(role, previous)
        for (const id of await scanHere(page, route.path, `${route.path} [role=${role}]`))
          undecided.add(id)
      }

      // ANTI-VACUITY, AT THE ROUTE RATHER THAN THE POSITION. Two roles may
      // legitimately see the same screen; ALL of them seeing the same screen
      // means the control writes state nothing reads, which is the first
      // defect shape in this build's list and is still RED.
      const distinct = new Set(rendered.values()).size
      expect(
        distinct,
        `${route.path}: all ${rendered.size} positions of the viewer control render byte-identical ` +
          'markup. That is a control that changes nothing anyone can see — do not relax this check, ' +
          'find what should have read it.',
      ).toBeGreaterThan(1)

      console.log(
        `[axe-states] ${surface.id} ${route.path} roles=${positions.length} distinct=${distinct}/${rendered.size} undecided=${[...undecided].sort().join(',') || 'none'}`,
      )
    })
  }
}

/* ==================================================================== *
 * SCREEN STATES — every position of every derived state control.
 * ==================================================================== */

/**
 * EVERY POSITION IS DRIVEN FROM A FRESH LOAD, and that is a finding, not a
 * convenience.
 *
 * The first version of this block drove the positions in one sequence, each
 * from the last. It went red on `STATE-02` on all three routes carrying a
 * state select, under the message "driving the control changed nothing on the
 * page", and the message named the wrong cause. Measured: the state select is
 * rendered INSIDE the `ScreenStateBoundary` it drives (three sites, listed in
 * the task report), and that boundary renders `children` for `STATE-03` ONLY.
 * So the first drive off the default unmounts the control, and the second
 * drive has nothing to address. `STATE-02` was simply the second position
 * asked for; it renders perfectly well, and so does every other position.
 *
 * A fresh load per position is therefore the only sequence this build's own
 * markup permits, and it is the stronger reading anyway: each state is now
 * measured against the state the route LOADS IN rather than against whichever
 * state happened to precede it.
 *
 * AND THE DISTINCTNESS ASSERTION IS WHAT KEEPS THAT HONEST. Driving from a
 * fresh load means the change proof only says "this position differs from the
 * default". Two positions could satisfy that and still render each other —
 * which is the exact claim that had to be settled about `STATE-02`, and
 * settling it by hand once is worth nothing next slice. So the default's own
 * rendering and all eight driven renderings are required to be NINE DISTINCT
 * renderings. Loading is not Empty is not Read-only, and the state contract
 * (L48007) exists to keep those apart on the screen, not only in the table.
 */
for (const surface of SURFACES) {
  for (const route of routesOf(surface)) {
    for (const stateSelect of route.selects.filter((sel) => isStateSelect(surface, sel))) {
      const roleSelect = viewerSelect(surface, route)
      // Recorded in `surface.unreachedRoutes`; the equality test above is
      // what goes red. Never a silent skip.
      if (!roleSelect) continue

      // The label is in the title because the console carries the control
      // under two names -- nine routes label it `Screen state` and nine
      // `Screen state (fixture)` -- and a route that ever grew both would
      // otherwise emit two tests nobody could tell apart in a report.
      test(`${route.path} — axe in every non-default screen state [${stateSelect.label}]`, async ({
        page,
      }) => {
        // A fresh load and two hydration drives PER POSITION, and the console
        // offers eleven non-default positions per select. That is the single
        // most expensive block in this file; the 90s default timeout is sized
        // for a page, not for twelve of them.
        test.setTimeout(300_000)
        await page.goto(route.path)
        const main = page.locator('#main')
        const positions = await nonDefaultPositions(page, stateSelect)
        expect(positions.length, `${route.path}: nothing to drive`).toBe(
          stateSelect.options.length - 1,
        )
        expect(positions.length, `${route.path}: the state control is a stub`).toBeGreaterThan(5)

        const rendered = new Map<string, string>()
        const undecided = new Set<string>()
        rendered.set('the default', await proveLive(page, roleSelect, `${route.path} [default]`))

        for (const state of positions) {
          await page.goto(route.path)
          const from = await proveLive(page, roleSelect, `${route.path} [${state}]`)
          // Settle rather than require a change, so that a state which
          // renders as another one is still SCANNED and is reported by the
          // distinctness assertion below rather than by aborting the test at
          // the first collision — which used to cost every state after it its
          // coverage as well as its diagnosis.
          rendered.set(
            state,
            await driveAndSettle(page, main, from, () =>
              control(page, stateSelect).selectOption(state),
            ),
          )
          for (const id of await scanHere(page, route.path, `${route.path} [${state}]`))
            undecided.add(id)
        }

        // WHICH two, not just that two. A message naming the whole list makes
        // the reader diff nine renderings by hand; this names the pair.
        const byHtml = new Map<string, string[]>()
        for (const [name, html] of rendered) byHtml.set(html, [...(byHtml.get(html) ?? []), name])
        const collisions = [...byHtml.values()].filter((names) => names.length > 1)
        expect(
          collisions.map((names) => names.join(' = ')),
          `${route.path}: these render byte-identical markup — a state offered as its own ` +
            'position and rendered as another one is a state nobody can see (state contract L48007)',
        ).toEqual([])

        console.log(
          `[axe-states] ${surface.id} ${route.path} states=${positions.join(',')} distinct=${rendered.size} undecided=${[...undecided].sort().join(',') || 'none'}`,
        )
      })
    }
  }
}

/* ==================================================================== *
 * SIMULATION TOGGLES — the editor's disconnected state and the audit-sink
 * failures. Every checkbox the export carries, driven off its default.
 * ==================================================================== */

/**
 * THE GUARD IS UNCHANGED. WHERE IT LOOKS IS NOT.
 *
 * "Driving the control changed nothing" is the only check this build has for
 * the defect it has already shipped twice — a control that writes state
 * nothing later reads (task 20's `stage` field, task 14's reorder that
 * rendered and changed nothing a later step read). It is not relaxed here and
 * must not be: a guard weakened to "flip it and scan" would pass on both.
 *
 * What was wrong was WHERE it looked. Six of this surface's seven simulation
 * toggles are DEFERRED — `VersionsScreen.tsx:446` sets `auditWillFail`, read
 * by the audit sink the NEXT act calls, never by the render that draws the
 * checkbox. Flipping one correctly changes nothing at the moment it is
 * flipped. Demanding an immediate re-render of a deferred control is
 * demanding the product be wrong.
 *
 * So the effect is observed WHERE THE EFFECT IS: the same act is driven
 * twice, once with the toggle at its default and once with it flipped, from
 * two identical fresh loads, and the two outcomes are required to DIFFER. A
 * toggle whose state no later act reads produces identical outcomes for every
 * act the screen offers, and that is exactly the defect shape — now caught at
 * the act instead of at the render.
 *
 * TWO WAYS TO SATISFY IT, and the report says which one each toggle took:
 *
 *   1. IMMEDIATE — flipping it re-renders the page. (`BuilderScreen.tsx:221`
 *      discards the last structural validation on reconnection, so the
 *      validation panel changes under the reader at once.)
 *   2. DEFERRED — flipping it changes the outcome of one of the acts the
 *      screen offers.
 *
 * Neither, across every act on the screen, is RED.
 *
 * THE ACTS ARE DERIVED, NOT LISTED. Every enabled button in `#main`, and
 * every select the export carries other than the persona and screen-state
 * drivers, which have their own blocks above. A hand list of act labels here
 * would be the enumeration defect this whole file exists to close, one level
 * further down — and it would have missed the real answer twice: the effect
 * on `/studio/approvals/` shows up only on `Withdraw`, the LAST of its seven
 * buttons, and on `/studio/screen-configuration/` on no button at all, only
 * on the two selects that carry the write.
 *
 * EACH CANDIDATE ACT IS DRIVEN FROM A FRESH LOAD. Clicking through a screen
 * cumulatively changes which controls are enabled — that is how the first
 * sweep missed `Withdraw` entirely — and it makes the reading depend on
 * everything clicked before it. One act, from the state the route loads in,
 * is the only reading that attributes the difference to the toggle.
 */

const ENABLED_BUTTONS = '#main button:not([disabled])'

interface CandidateAct {
  readonly what: string
  readonly drive: (page: Page) => Promise<unknown>
}

/** The acts this screen offers, read off the page and the export rather than
 *  named here. A click that will not land (covered, detached, or gone by the
 *  time its turn comes) is skipped rather than fatal: both runs are in the
 *  same state, so a skip costs a candidate, never a false difference. */
function candidateActs(
  buttons: number,
  surface: DrivenSurface,
  route: RouteControls,
): readonly CandidateAct[] {
  const clicks = Array.from({ length: buttons }, (_, i) => ({
    what: `button #${i + 1} of ${buttons}`,
    drive: async (page: Page) => {
      await page
        .locator(ENABLED_BUTTONS)
        .nth(i)
        .click({ timeout: 5_000 })
        .catch(() => undefined)
    },
  }))
  const moves = route.selects
    .filter((s) => !isRoleSelect(surface, s) && !isStateSelect(surface, s) && s.options.length > 1)
    .map((s) => ({
      what: `select ${s.label || s.id}`,
      drive: async (page: Page) => {
        const select = control(page, s)
        const current = await select.inputValue()
        const other = s.options.find((o) => o !== current)
        if (other !== undefined) await select.selectOption(other).catch(() => undefined)
      },
    }))
  return [...clicks, ...moves]
}

/** One reading: load the route, prove it live, set the toggle where asked,
 *  drive one act where asked, and report what the page then holds. */
async function readingAfter(
  page: Page,
  route: RouteControls,
  roleSelect: ExportedSelect,
  toggle: { readonly box: ExportedCheckbox; readonly checked: boolean } | null,
  act: CandidateAct | null,
  where: string,
): Promise<string> {
  await page.goto(route.path)
  await proveLive(page, roleSelect, where)
  if (toggle !== null) await control(page, toggle.box).setChecked(toggle.checked)
  if (act !== null) await act.drive(page)
  return page.locator('#main').innerHTML()
}

for (const surface of SURFACES) {
  for (const route of routesOf(surface).filter((r) => r.checkboxes.length > 0)) {
    const roleSelect = viewerSelect(surface, route)
    // Recorded in `surface.unreachedRoutes`; the equality test above is what
    // goes red. Never a silent skip.
    if (!roleSelect) continue

    test(`${route.path} — axe with every simulation toggle flipped, and its effect observed`, async ({
      page,
    }) => {
    // A sweep that finds its answer on the first act costs one page load; a
    // toggle that is genuinely dead costs one per act before it can say so.
    // A red that arrives as a timeout names the wrong cause, which is the
    // mistake this whole block is here to correct.
    test.setTimeout(300_000)
    const undecided = new Set<string>()

    for (const box of route.checkboxes) {
      const where = `${route.path} [${box.label}]`
      const base = await readingAfter(page, route, roleSelect, null, null, where)
      const wasChecked = await control(page, box).isChecked()
      const acts = candidateActs(await page.locator(ENABLED_BUTTONS).count(), surface, route)
      expect(acts.length, `${where}: this screen offers no act to observe a deferred effect in`)
        .toBeGreaterThan(0)

      // The flipped state itself, scanned whether or not it renders anything
      // new — it is the state this test's name claims to cover.
      const flipped = await readingAfter(
        page,
        route,
        roleSelect,
        { box, checked: !wasChecked },
        null,
        where,
      )
      for (const id of await scanHere(page, route.path, where)) undecided.add(id)

      let observed = flipped === base ? null : 'the page it renders'
      if (observed === null) {
        for (const act of acts) {
          const control = await readingAfter(page, route, roleSelect, null, act, `${where} ${act.what}`)
          const driven = await readingAfter(
            page,
            route,
            roleSelect,
            { box, checked: !wasChecked },
            act,
            `${where} ${act.what}`,
          )
          if (driven === control) continue
          observed = `the outcome of ${act.what}`
          for (const id of await scanHere(page, route.path, `${where} ${act.what}`))
            undecided.add(id)
          break
        }
      }

      expect(
        observed,
        `${where}: flipping this control changed nothing on the page AND changed the outcome of ` +
          `none of the ${acts.length} acts this screen offers. That is a control writing state ` +
          'nothing later reads — the defect this build has shipped twice. Do not relax this ' +
          'check; find what should have read it.',
      ).not.toBeNull()
      console.log(`[axe-states] ${where} effect observed in ${observed}`)
      }
      console.log(
        `[axe-states] ${surface.id} ${route.path} toggles=${route.checkboxes.length} undecided=${[...undecided].sort().join(',') || 'none'}`,
      )
    })
  }
}

/* ==================================================================== *
 * THE POSITIVE CONTROL. A gate nobody has seen red is unwritten.
 * ==================================================================== */

/**
 * PROVES THE HARNESS DISCRIMINATES IN A DRIVEN STATE, not only in the
 * default one — which is the specific claim this file makes and therefore
 * the specific claim that has to be shown failing.
 *
 * `aria-label` on a bare `div` is not an arbitrary choice of defect: it is
 * the shape this build has already shipped TWICE, on
 * `/hub/qualification-calendar/` and again on `/studio/content-libraries/`.
 * Both bucket differently and both are planted here, because they exercise
 * two different assertions:
 *
 *  - an EMPTY generic element with `aria-label` is a decided VIOLATION —
 *    there is no content the name could have come from;
 *  - a generic element with `aria-label` AND text content lands in
 *    INCOMPLETE, because axe cannot decide whether the name is prohibited.
 *    That is the bucket the real defect landed in, and the bucket a suite
 *    reading only `violations` reports as clean.
 *
 * Planted into the live DOM rather than into `app/**`, so the control is
 * self-contained and needs no rebuild — and restored in the same test,
 * with a clean re-scan proving the restoration.
 */
for (const surface of SURFACES) {
  test(`${surface.id}: the driven-state harness goes RED on a planted defect, and clean again once it is removed`, async ({
    page,
  }) => {
    const route = routesOf(surface).find(
      (r) => r.selects.some((sel) => isStateSelect(surface, sel)) && viewerSelect(surface, r) !== undefined,
    )
    const stateSelect = route?.selects.find((sel) => isStateSelect(surface, sel))
    if (!route || !stateSelect) {
      throw new Error(`${surface.id}: no route offers a screen state to plant into`)
    }

    await page.goto(route.path)
    const main = page.locator('#main')
    const select = control(page, stateSelect)

    // Drive OFF the default first. Everything below is asserted about a state
    // the page does not load in.
    //
    // The LAST position is not assumed to be a distinct rendering: measured,
    // `/hub/permissions-roles-and-access/` renders STATE-05 exactly as it
    // renders STATE-03, and planting into a state that is really the default
    // under another name would make this control prove less than it claims.
    // So positions are tried until one demonstrably re-renders.
    const positions = await nonDefaultPositions(page, stateSelect)
    const home = await main.innerHTML()
    let driven: string | undefined
    for (const position of positions) {
      if ((await driveAndSettle(page, main, home, () => select.selectOption(position))) !== home) {
        driven = position
        break
      }
    }
    if (driven === undefined) {
      throw new Error(`${route.path}: no screen-state position renders anything but the default`)
    }

    // Clean in this driven state before anything is planted, or the control
    // proves nothing about what the plant caused.
    await scanHere(page, route.path, `${route.path} [${driven}] before planting`)

    const plant = (html: string) =>
      page.evaluate((h) => {
        const host = document.createElement('div')
        host.id = 'planted-defect'
        host.innerHTML = h
        document.querySelector('#main')?.append(host)
      }, html)
    const uproot = () => page.evaluate(() => document.querySelector('#planted-defect')?.remove())

    // 1. The decided WCAG bucket.
    await plant('<div aria-label="planted defect, empty generic"></div>')
    const violated = await runAxe(page)
    expect(
      violated.violationIds,
      'axe did not report a violation for an aria-label on an empty bare div',
    ).toContain('aria-prohibited-attr')
    await expect(scanHere(page, route.path, 'planted violation')).rejects.toThrow()
    await uproot()

    // 2. The undecided bucket — the one the real defect landed in, and the
    //    one an assertion that reads only `violations` would call clean.
    await plant('<span aria-label="planted defect, named generic">&mdash;</span>')
    const undecided = await runAxe(page)
    expect(
      [...undecided.violationIds, ...undecided.incompleteIds],
      'axe decided nothing at all about aria-label on a named bare span',
    ).toContain('aria-prohibited-attr')
    await expect(scanHere(page, route.path, 'planted incomplete')).rejects.toThrow()
    await uproot()

    // 3. THE BEST-PRACTICE BUCKET, which is new and therefore unproven until
    //    something has been seen failing in it. `empty-table-header` is
    //    tagged `best-practice` and NOTHING ELSE, so under the tag filter
    //    this file used to carry it could not appear in any bucket at all —
    //    it is the exact rule that let two empty table headers ship on the
    //    run-scheduling board while both route suites stayed green.
    //
    //    Two assertions, because the widening makes two distinct claims:
    //    that the rule is now REACHED (it lands in `bestPracticeIds`), and
    //    that it is not silently tolerated (`scanHere` rejects, because the
    //    pin for this route does not name it). A rule that were merely
    //    reached and then allowed would be the suppression this task exists
    //    to avoid.
    await plant(
      '<table><caption>planted</caption><thead><tr><th>named</th><th></th></tr></thead>' +
        '<tbody><tr><td>a</td><td>b</td></tr></tbody></table>',
    )
    const bestPractice = await runAxe(page)
    expect(
      bestPractice.bestPracticeIds,
      'the scan did not reach a best-practice-only rule — the rule set is still filtered, ' +
        'and every count this file reports about best practice is worth nothing until it is',
    ).toContain('empty-table-header')
    expect(
      bestPractice.violationIds,
      'a best-practice rule was sorted into the WCAG bucket — it would be reported to a client ' +
        'as a WCAG 2.2 AA failure, which it is not',
    ).not.toContain('empty-table-header')
    await expect(scanHere(page, route.path, 'planted best-practice')).rejects.toThrow()
    await uproot()

    // 4. Restored. Same driven state, same assertions, green.
    await scanHere(page, route.path, `${route.path} [${driven}] after the plant was removed`)
  })
}

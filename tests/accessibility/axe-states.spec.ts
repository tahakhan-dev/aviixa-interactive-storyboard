import { test, expect, type Locator, type Page } from '@playwright/test'
import { drivableControls, type ExportedSelect, type RouteControls } from '../e2e/exported-controls'
import { runAxe, scanHere } from './axe-policy'
import { STUDIO_PERSONA_IDS } from '@/studio/modules'
import { STU_APPLICABLE_STATES } from '@/studio/state/screen-states'

/**
 * WCAG 2.2 AA IN EVERY STATE THIS BUILD CAN BE DRIVEN INTO, not only the
 * one each page loads in.
 *
 * THE GAP THIS CLOSES, measured by task 26 rather than guessed. `axe.spec.ts`
 * scanned 71 routes with zero violations and zero unexplained incomplete
 * results — and every one of those scans was `page.goto(path)` followed
 * immediately by `analyze()`. No harness in this build had ever changed a
 * persona, moved a screen-state selector or ticked a simulation toggle
 * before scanning. Counted both ways, eighteen of eighteen Studio screens
 * had a pass BY ROUTE and seven of eighteen had one by a state-driving walk
 * (the 22 composed journey steps in `tests/component/stu-journey.test.tsx`),
 * leaving ELEVEN screens with no state pass of any kind.
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
 * WHAT IS DERIVED AND WHAT IS DECLARED. The routes come from the export
 * (`../e2e/exported-routes`). The controls and their positions come from
 * the export (`../e2e/exported-controls`). Nothing here is a hand list, and
 * a new option is driven the moment `pnpm build` emits it. What is NOT
 * derived from the export is the ANSWER the enumeration is checked against:
 * the persona vocabulary comes from `@/studio/modules` and the state model
 * from `@/studio/state/screen-states`, so "is the enumeration complete" is
 * asked of two independent sources rather than of the field under test.
 *
 * C17 — AN ENUMERATION THAT SILENTLY FINDS NOTHING IS RED. Every derived
 * list below carries a floor. This build has already shipped one gate that
 * scanned zero files and reported success, and a derived list is one empty
 * directory away from being the hand list wearing a walk.
 */

const CONTROLS: readonly RouteControls[] = drivableControls()
const STUDIO_ROUTES = CONTROLS.filter((c) => c.path.startsWith('/studio/'))

/** An attribute selector rather than `#id`, so a React `useId` value needs
 *  no CSS-identifier escaping and this file needs no browser globals. */
const byId = (id: string): string => `[id="${id}"]`

/** The twelve states the Studio state model declares applicable to this
 *  surface — the thirteen-state contract less `STATE-07`, which D22 rules
 *  renders nowhere here. Read from the model, never from the page. */
const DECLARED_STATES: readonly string[] = STU_APPLICABLE_STATES.map((r) => r.id)

/**
 * A control is a STATE driver if every position it offers is drawn from the
 * state vocabulary, and a PERSONA driver if the set of positions it offers
 * IS the persona vocabulary. Classified by what the control carries, not by
 * its label text: a label is prose and can be reworded, and a hand list of
 * labels is the enumeration defect this file exists to close, one level
 * down. `options.length > 0` is load-bearing — `[].every(...)` is `true`,
 * so an empty select would otherwise classify as a state driver and drive
 * nothing.
 */
const isStateSelect = (s: ExportedSelect): boolean =>
  s.options.length > 0 && s.options.every((o) => DECLARED_STATES.includes(o))

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

const isPersonaSelect = (s: ExportedSelect): boolean => sameSet(s.options, STUDIO_PERSONA_IDS)

/**
 * STATES THIS BUILD DECLARES AND NO BUILT PAGE CAN BE DRIVEN INTO.
 *
 * Recorded as UNREACHED, and never as passing. Slice 4 shipped an
 * accessibility claim covering zero of the screens it named and had to
 * retract it; the distinction between "scanned and clean" and "no page
 * renders this" is the whole reason that retraction happened, so it is
 * carried structurally here rather than in prose.
 *
 * A STATE IS NOT REMOVED FROM THIS LIST BY DELETING IT FROM THE MODEL. The
 * completeness test below requires observed ∪ unreached to equal the
 * model's declared set EXACTLY, so dropping a row from the model to make
 * this list shorter turns the test red rather than green, and adding a
 * state here that IS drivable turns it red too.
 */
const UNREACHED_STATES: readonly { readonly id: string; readonly reason: string }[] = [
  {
    id: 'STATE-09',
    reason:
      'Declared applicable to SCR-STU-04 and SCR-STU-11 at publication (departure 2 of 4, L48330). ' +
      'It is NAMED on /studio/approvals/ — inside the "Screen states this surface applies here" ' +
      'list, which is a list of state ids, not a rendered state treatment — and no control on any ' +
      'built page offers it as a position. Either SCR-STU-04 and SCR-STU-11 are missing the queued ' +
      'rendering the model declares for them, or the model declares a rendering the build does not ' +
      'owe. Not resolved here, and not resolved by shortening this list.',
  },
  {
    id: 'STATE-10',
    reason:
      'Declared applicable to SCR-STU-04 and SCR-STU-13 (drafting aid degraded, departure 3 of 4, ' +
      'L48330). `grep -rl STATE-10 out/studio/` returns ZERO pages: it is not rendered, not named ' +
      'in any applicable-states list, and offered by no control. The screens the model names are ' +
      '/studio/screen-configuration/, /studio/agents/ and /studio/learning/, and none of them ' +
      'renders a degraded drafting aid.',
  },
  {
    id: 'STATE-11',
    reason:
      'Declared applicable to SCR-STU-04 and SCR-STU-13 (drafting aid unavailable, departure 3 of ' +
      '4, L48330). Same measurement as STATE-10 and the same zero. Kept as its own entry because ' +
      'degraded and unavailable are two of the four things the state contract exists to keep ' +
      'apart (L48007), and collapsing them here would repeat the mistake one level up.',
  },
]

/* ==================================================================== *
 * THE ENUMERATIONS, AND THE ASSERTION THAT THEY ARE COMPLETE.
 * ==================================================================== */

test('the derived control enumeration is not a stub', () => {
  // C17. Every one of these is a floor over a DERIVED list, and a derived
  // list read off an empty or half-written export scans nothing and passes.
  expect(CONTROLS.length, 'no route carried a parsed control set').toBeGreaterThan(50)
  expect(STUDIO_ROUTES.length, 'the eighteen Studio routes').toBeGreaterThan(15)
  expect(
    CONTROLS.reduce((n, c) => n + c.selects.length + c.checkboxes.length, 0),
    'no drivable control was parsed out of the export at all',
  ).toBeGreaterThan(60)
})

test('the persona enumeration is complete: every Studio route offers every persona', () => {
  // The expectation is the persona VOCABULARY; the field under test is what
  // eighteen separately-built pages actually shipped. A route that filtered
  // the list — dropping the prohibited Worker or the open-decision Auditor
  // because those two render awkward branches — goes red here.
  expect(STUDIO_PERSONA_IDS.length, 'the persona vocabulary is empty or gutted').toBeGreaterThan(5)

  for (const route of STUDIO_ROUTES) {
    const personaSelects = route.selects.filter(isPersonaSelect)
    expect(personaSelects.length, `${route.path}: expected exactly one persona select`).toBe(1)
    const offered = personaSelects[0]?.options ?? []
    expect([...offered].sort(), `${route.path}: persona select does not offer the vocabulary`).toEqual(
      [...STUDIO_PERSONA_IDS].sort(),
    )
  }
})

test('the state enumeration is complete against the state model, or recorded as unreached', () => {
  const stateSelects = STUDIO_ROUTES.flatMap((r) =>
    r.selects.filter(isStateSelect).map((s) => ({ path: r.path, select: s })),
  )
  const drivable = [...new Set(stateSelects.flatMap((s) => s.select.options))].sort()

  // C17 floors first: an enumeration that found nothing must be RED.
  expect(DECLARED_STATES.length, 'the state model is empty').toBeGreaterThan(10)
  expect(stateSelects.length, 'no built page offers a screen-state control').toBeGreaterThan(2)
  expect(drivable.length, 'no screen state can be driven anywhere').toBeGreaterThan(7)

  // The unreached list may not absorb a state that IS drivable — that is
  // how "unreached" quietly becomes an excuse rather than a measurement.
  const unreachedIds = UNREACHED_STATES.map((u) => u.id)
  expect(
    drivable.filter((id) => unreachedIds.includes(id)),
    'a state recorded as unreached is in fact drivable — correct the record, do not keep it',
  ).toEqual([])

  // EXACT, both directions. Not a subset assertion: a subset check passes
  // on the empty set and on equal sets, which is defect shape 9 in this
  // build's own list. Every declared state is either driven below or
  // carries a written reason it could not be.
  expect(
    [...drivable, ...unreachedIds].sort(),
    'the declared state model and the built tree disagree, and nothing accounts for the difference',
  ).toEqual([...DECLARED_STATES].sort())

  for (const u of UNREACHED_STATES) {
    expect(u.reason.length, `${u.id}: an unreached state must say WHY`).toBeGreaterThan(120)
  }
})

/* ==================================================================== *
 * THE DRIVER.
 * ==================================================================== */

/**
 * Drives one control to one position AND PROVES THE PAGE CHANGED.
 *
 * WITHOUT THE CHANGE PROOF THIS WHOLE FILE IS VACUOUS. A `selectOption`
 * that lands before hydration sets the DOM value, fires an event no React
 * listener is attached to, and re-renders nothing — so the scan that
 * follows would be the DEFAULT state, scanned again, reported under a
 * different name. Eight persona "passes" per route, all of them the same
 * page. That is precisely the shape of the four tests this build has
 * already shipped that could not fail.
 *
 * So the drive is retried inside the poll until `#main` differs. Playwright
 * dispatches `input` and `change` on every `selectOption` call, so a repeat
 * re-fires once hydration has attached the listener. A position that
 * genuinely renders nothing new never settles, and the poll times out RED —
 * which is the correct answer for a control that does nothing, the first
 * defect shape in this build's list.
 */
async function driveAndProveChanged(
  main: Locator,
  before: string,
  // `Promise<unknown>`, not `Promise<void>`: Playwright's `selectOption`
  // resolves to the selected values, and a `void` parameter rejects every
  // caller that passes it directly. Widening here beats making three call
  // sites wrap a one-line action in a block that discards a value nobody
  // wanted -- what is driven matters, what the driver returns does not.
  apply: () => Promise<unknown>,
  what: string,
): Promise<string> {
  await expect
    .poll(
      async () => {
        await apply()
        return (await main.innerHTML()) !== before
      },
      { timeout: 20_000, message: `${what}: driving the control changed nothing on the page` },
    )
    .toBe(true)
  return main.innerHTML()
}

/** The live value, not option zero: `selected` is decided by the `<select>`'s
 *  value, and the default position is the one already covered by the
 *  route-level scan in `axe.spec.ts`. Only the OTHERS are new coverage. */
async function nonDefaultPositions(page: Page, select: ExportedSelect): Promise<string[]> {
  const current = await page.locator(byId(select.id)).inputValue()
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
 * WHAT IS USED INSTEAD. The persona select — derived from the export like
 * everything else here, present on every Studio route (the persona
 * completeness test above is what goes red if that stops being true), and
 * proven to re-render on all eighteen routes by the persona block below.
 * Driven off its default and back, with BOTH moves required to change the
 * page. Two proven re-renders is a live page; anything less times out RED
 * rather than reading a half-attached one.
 *
 * It returns to the default it started from, so what follows is measured
 * against the state the route loads in and not against a persona view.
 */
async function proveLive(page: Page, personaSelect: ExportedSelect, where: string): Promise<string> {
  const main = page.locator('#main')
  const select = page.locator(byId(personaSelect.id))
  const home = await select.inputValue()
  const away = personaSelect.options.find((o) => o !== home)
  if (away === undefined) throw new Error(`${where}: the persona select offers only its default`)

  const moved = await driveAndProveChanged(
    main,
    await main.innerHTML(),
    () => select.selectOption(away),
    `${where} — hydration probe, persona=${away}`,
  )
  return driveAndProveChanged(
    main,
    moved,
    () => select.selectOption(home),
    `${where} — hydration probe, back to persona=${home}`,
  )
}

/* ==================================================================== *
 * PERSONAS — all eight, on all eighteen Studio routes.
 * ==================================================================== */

for (const route of STUDIO_ROUTES) {
  const personaSelect = route.selects.find(isPersonaSelect)
  if (!personaSelect) continue // the completeness test above is what goes red

  test(`${route.path} — axe in every non-default persona view`, async ({ page }) => {
    await page.goto(route.path)
    const main = page.locator('#main')
    const select = page.locator(byId(personaSelect.id))
    const positions = await nonDefaultPositions(page, personaSelect)
    expect(positions.length, `${route.path}: nothing to drive`).toBeGreaterThan(5)

    let previous = await main.innerHTML()
    const undecided = new Set<string>()
    for (const persona of positions) {
      previous = await driveAndProveChanged(
        main,
        previous,
        () => select.selectOption(persona),
        `${route.path} [persona=${persona}]`,
      )
      for (const id of await scanHere(page, `${route.path} [persona=${persona}]`)) undecided.add(id)
    }
    console.log(
      `[axe-states] ${route.path} personas=${positions.length} undecided=${[...undecided].sort().join(',') || 'none'}`,
    )
  })
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
for (const route of STUDIO_ROUTES) {
  for (const stateSelect of route.selects.filter(isStateSelect)) {
    const personaSelect = route.selects.find(isPersonaSelect)
    if (!personaSelect) continue // the persona completeness test is what goes red

    test(`${route.path} — axe in every non-default screen state`, async ({ page }) => {
      await page.goto(route.path)
      const main = page.locator('#main')
      const positions = await nonDefaultPositions(page, stateSelect)
      expect(positions.length, `${route.path}: nothing to drive`).toBeGreaterThan(5)

      const rendered = new Map<string, string>()
      const undecided = new Set<string>()
      rendered.set('the default', await proveLive(page, personaSelect, `${route.path} [default]`))

      for (const state of positions) {
        await page.goto(route.path)
        const from = await proveLive(page, personaSelect, `${route.path} [${state}]`)
        rendered.set(
          state,
          await driveAndProveChanged(
            main,
            from,
            () => page.locator(byId(stateSelect.id)).selectOption(state),
            `${route.path} [${state}]`,
          ),
        )
        for (const id of await scanHere(page, `${route.path} [${state}]`)) undecided.add(id)
      }

      expect(
        new Set(rendered.values()).size,
        `${route.path}: two of ${[...rendered.keys()].join(', ')} render the same markup — ` +
          'a state offered as its own position and rendered as another one is a state nobody can see',
      ).toBe(rendered.size)

      console.log(
        `[axe-states] ${route.path} states=${positions.join(',')} distinct=${rendered.size} undecided=${[...undecided].sort().join(',') || 'none'}`,
      )
    })
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
function candidateActs(buttons: number, route: RouteControls): readonly CandidateAct[] {
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
    .filter((s) => !isPersonaSelect(s) && !isStateSelect(s) && s.options.length > 1)
    .map((s) => ({
      what: `select ${s.label || s.id}`,
      drive: async (page: Page) => {
        const select = page.locator(byId(s.id))
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
  personaSelect: ExportedSelect,
  toggle: { readonly id: string; readonly checked: boolean } | null,
  act: CandidateAct | null,
  where: string,
): Promise<string> {
  await page.goto(route.path)
  await proveLive(page, personaSelect, where)
  if (toggle !== null) await page.locator(byId(toggle.id)).setChecked(toggle.checked)
  if (act !== null) await act.drive(page)
  return page.locator('#main').innerHTML()
}

for (const route of STUDIO_ROUTES.filter((r) => r.checkboxes.length > 0)) {
  const personaSelect = route.selects.find(isPersonaSelect)
  if (!personaSelect) continue // the persona completeness test is what goes red

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
      const base = await readingAfter(page, route, personaSelect, null, null, where)
      const wasChecked = await page.locator(byId(box.id)).isChecked()
      const acts = candidateActs(await page.locator(ENABLED_BUTTONS).count(), route)
      expect(acts.length, `${where}: this screen offers no act to observe a deferred effect in`)
        .toBeGreaterThan(0)

      // The flipped state itself, scanned whether or not it renders anything
      // new — it is the state this test's name claims to cover.
      const flipped = await readingAfter(
        page,
        route,
        personaSelect,
        { id: box.id, checked: !wasChecked },
        null,
        where,
      )
      for (const id of await scanHere(page, where)) undecided.add(id)

      let observed = flipped === base ? null : 'the page it renders'
      if (observed === null) {
        for (const act of acts) {
          const control = await readingAfter(page, route, personaSelect, null, act, `${where} ${act.what}`)
          const driven = await readingAfter(
            page,
            route,
            personaSelect,
            { id: box.id, checked: !wasChecked },
            act,
            `${where} ${act.what}`,
          )
          if (driven === control) continue
          observed = `the outcome of ${act.what}`
          for (const id of await scanHere(page, `${where} ${act.what}`)) undecided.add(id)
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
      `[axe-states] ${route.path} toggles=${route.checkboxes.length} undecided=${[...undecided].sort().join(',') || 'none'}`,
    )
  })
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
test('the driven-state harness goes RED on a planted defect, and clean again once it is removed', async ({
  page,
}) => {
  const route = STUDIO_ROUTES.find((r) => r.selects.some(isStateSelect))
  const stateSelect = route?.selects.find(isStateSelect)
  if (!route || !stateSelect) throw new Error('no route offers a screen state to plant into')

  await page.goto(route.path)
  const main = page.locator('#main')
  const select = page.locator(byId(stateSelect.id))

  // Drive OFF the default first. Everything below is asserted about a state
  // the page does not load in.
  const positions = await nonDefaultPositions(page, stateSelect)
  const driven = positions.at(-1)
  if (driven === undefined) throw new Error(`${route.path}: the state select offers only its default`)
  await driveAndProveChanged(main, await main.innerHTML(), () => select.selectOption(driven), 'plant')

  // Clean in this driven state before anything is planted, or the control
  // proves nothing about what the plant caused.
  await scanHere(page, `${route.path} [${driven}] before planting`)

  const plant = (html: string) =>
    page.evaluate((h) => {
      const host = document.createElement('div')
      host.id = 'planted-defect'
      host.innerHTML = h
      document.querySelector('#main')?.append(host)
    }, html)
  const uproot = () => page.evaluate(() => document.querySelector('#planted-defect')?.remove())

  // 1. The decided bucket.
  await plant('<div aria-label="planted defect, empty generic"></div>')
  const violated = await runAxe(page)
  expect(
    violated.violationIds,
    'axe did not report a violation for an aria-label on an empty bare div',
  ).toContain('aria-prohibited-attr')
  await expect(scanHere(page, 'planted violation')).rejects.toThrow()
  await uproot()

  // 2. The undecided bucket — the one the real defect landed in, and the
  //    one an assertion that reads only `violations` would call clean.
  await plant('<span aria-label="planted defect, named generic">&mdash;</span>')
  const undecided = await runAxe(page)
  expect(
    [...undecided.violationIds, ...undecided.incompleteIds],
    'axe decided nothing at all about aria-label on a named bare span',
  ).toContain('aria-prohibited-attr')
  await expect(scanHere(page, 'planted incomplete')).rejects.toThrow()
  await uproot()

  // 3. Restored. Same driven state, same assertions, green.
  await scanHere(page, `${route.path} [${driven}] after the plant was removed`)
})

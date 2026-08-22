import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC_CLAIMED_SLUGS } from '@/surfaces/cc/modules'
import { ccScreenOpensFor } from '@/surfaces/cc/access'
import { CC_SCREENS, ccScreen, ccScreenSlug } from '@/surfaces/cc/screens'
import {
  CC_EXCLUSION_TOKEN_READINGS,
  CC_LANDING_PRECEDENCE,
  CC_REGISTER_NAMED_LANDINGS,
  CC_SIGN_IN_EXCLUSION,
  CC_SIGN_IN_FALLBACK,
  CC_SIGN_IN_MOD_DOH_09_READINGS,
  CC_SIGN_IN_SCREEN,
  CC_SIGN_IN_SOURCE_TESTS,
  CC_TENANT_ADMIN_READINGS,
  ccLandingIsRegisterNamed,
} from '@/surfaces/cc/sign-in/model'

/**
 * `SCR-CC-01` — THE SIGN-IN, THE SURFACE EXCLUSION, AND THE ROUTE THIS
 * SURFACE DOES NOT AUTHOR.
 *
 * Every gate below was planted into a real shipping file, watched go red, and
 * reversed by index rather than by `String.replace`. The `PLANTED`/`RED`
 * notes name the defect actually planted. Where two guards protect one claim,
 * the removal of each and of both was planted, because redundant protections
 * cannot be verified one at a time.
 *
 * NO COUNT HERE IS TAKEN FROM THE ARRAY UNDER TEST. "Seven" is walked off the
 * frozen source's own rows one line at a time; "three" and "eight" are the
 * lengths of arrays whose every member is then checked back against the line
 * it names, which is a different claim from the length agreeing with itself.
 */

const ROOT = process.cwd()
const SOURCE_PATH = join(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const SIGN_IN_DIR = join(ROOT, 'src', 'surfaces', 'cc', 'sign-in')
const ROUTE_ROOT = join(ROOT, 'app', 'command-center')

function srcLine(n: number): string {
  const line = LINES[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}

/** `'§21.1.2 surface matrix · L35004'` -> `35004`. Anchored at both ends. */
function locatorLine(locator: string): number {
  const m = /(?:^|[^A-Za-z0-9-])L(\d{3,6})(?![\d[\\])/.exec(locator)
  if (m === null) throw new Error(`no line number in locator: ${locator}`)
  return Number(m[1])
}

/**
 * EVERY READING PROVED AT ITS OWN LINE, and every family routed through this
 * one function so no family can be left unverified.
 *
 * TWO WRITINGS OF THIS FUNCTION COULD NOT FAIL, AND BOTH WERE FOUND BY
 * PLANTING.
 *
 * The first asserted the SOURCE's cells and never the READING's text, so
 * inverting a reading to say the Supervisor is `Allowed` at L22015 left it
 * green: the claim and the evidence were never compared.
 *
 * The second compared them by SUBSTRING CONTAINMENT, which is blind to
 * position — the same defect as a name-keyed cell lookup that survives its
 * columns being reversed, arrived at from the other side. `Allowed` is a
 * substring of a row that also carries `Unavailable`, so the same inversion
 * was still green. It now matches CELL BY CELL, EXACTLY, and requires the
 * claim's cells to appear in the source's own ORDER. `Allowed` is not an
 * exact cell of a row whose cell reads `Allowed [H17]`, which is what turns
 * the inversion red.
 *
 * WHAT IT STILL CANNOT DISTINGUISH, said rather than left implied: where a
 * matrix row carries the SAME cell in three columns — L36265 reads
 * `Allowed with conditions — requires Tenant or Site read scope` for the
 * Tenant Admin, the Supervisor and the Quality Manager alike — no check can
 * tell which of the three a two-cell claim names, because the source draws
 * them identically.
 *
 * Backticks are stripped from the SOURCE rather than from the claim.
 * Stripping the claim would let a claim carrying no identifier at all pass.
 */
function sourceCells(line: number): readonly string[] {
  return srcLine(line)
    .replaceAll('`', '')
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
}

function proveReadings(
  readings: readonly { readonly text: string; readonly locator: string }[],
  expectedCount: number,
): void {
  expect(readings, 'the loop cannot shrink with its subject').toHaveLength(expectedCount)
  const lines = readings.map((r) => locatorLine(r.locator))
  expect(new Set(lines).size, 'one line per reading').toBe(expectedCount)

  readings.forEach((r, i) => {
    const line = lines[i] ?? 0
    expect(srcLine(line).trim(), `${r.locator} is not a blank line`).not.toBe('')
    const cells = sourceCells(line)
    const claim = r.text.split('|').map((c) => c.trim()).filter((c) => c.length > 0)
    expect(claim.length, `${r.locator} claims something`).toBeGreaterThan(0)

    // EXACT CELLS, IN THE SOURCE'S ORDER. `at` only ever moves forward, so a
    // claim that reorders the row runs off the end rather than matching.
    let at = 0
    for (const part of claim) {
      // A SINGLE-PART CLAIM MAY BE A FRAGMENT OF ONE CELL — L3799 quotes a
      // clause out of a long scope row, and the source's test bullets are not
      // table rows at all. It is still pinned INSIDE a cell rather than
      // anywhere on the line. A multi-cell claim gets no such latitude: it is
      // transcribing a row and must match it cell for cell.
      const found =
        cells.indexOf(part, at) >= 0
          ? cells.indexOf(part, at)
          : claim.length === 1
            ? cells.findIndex((c, idx) => idx >= at && c.includes(part))
            : -1
      expect(
        found,
        `${r.locator} carries "${part}" as a cell, in order, at or after cell ${at}`,
      ).toBeGreaterThanOrEqual(0)
      at = found + 1
    }
  })
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (isForeignProbe(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) walk(full, acc)
    else if (/\.tsx?$/.test(e.name)) acc.push(full)
  }
  return acc
}

/* ==================================================================== *
 * THE REGISTER ROW.
 * ==================================================================== */

describe('SCR-CC-01 is read from the register and not retyped', () => {
  // FAILS IF: the screen record drifts from L48386, or this model starts
  // carrying its own copy of the row instead of reading the spine's.
  // PLANTED: `modulesShown: 'Reuses MOD-DOH-09'` -> `'Reuses MOD-DOH-08'` in
  //          `src/surfaces/cc/screens.ts` (wave 0's file — planted by index,
  //          watched, reversed by the same index, never kept).
  // RED: expected 'Reuses MOD-DOH-09' to be 'Reuses MOD-DOH-08'.
  it('transcribes the register row header-keyed, off the frozen source', () => {
    const header = srcLine(48384)
    const columns = header.split('|').map((c) => c.trim())
    expect(columns).toEqual([
      '',
      'Screen identifier',
      'Screen name',
      'Purpose',
      'Roles that can open it',
      'Modules and features shown',
      'Navigation entry point',
      '',
    ])
    expect(srcLine(48385).replaceAll(/[|\- ]/g, ''), 'the separator row').toBe('')

    const cells = srcLine(48386).split('|').map((c) => c.trim())
    const cell = (name: string): string => {
      const at = columns.indexOf(name)
      if (at < 0) throw new Error(`no such column: ${name}`)
      return cells[at] ?? ''
    }
    expect(cell('Screen identifier')).toBe('SCR-CC-01')
    expect(cell('Screen name')).toBe(CC_SIGN_IN_SCREEN.name)
    expect(cell('Purpose')).toBe(CC_SIGN_IN_SCREEN.purpose)
    expect(cell('Roles that can open it')).toBe(CC_SIGN_IN_SCREEN.rolesColumn)
    expect(cell('Modules and features shown')).toBe(CC_SIGN_IN_SCREEN.modulesShown)
    expect(cell('Navigation entry point')).toBe(CC_SIGN_IN_SCREEN.navigationEntry)

    // Read from the spine, not restated: the identity holds, so a change to
    // the screen record reaches this model rather than being shadowed by it.
    expect(CC_SIGN_IN_SCREEN).toBe(ccScreen('SCR-CC-01'))
  })

  // FAILS IF: the module this screen reuses stops being the one whose own
  // authority row disagrees with it. Both readings are carried; neither is
  // adopted, and there is no field on a reading that could adopt one.
  // PLANTED: the second reading's Supervisor cell inverted from `Unavailable`
  //          to `Allowed`, and separately its Auditor cell from `Read-only`
  //          to `Explicitly prohibited`.
  // RED: MTX-TEN-02a · L22015 carries "Allowed" as a cell, in order, at or
  //      after cell 3: expected -1 to be greater than or equal to 0.
  //      (Second plant: the same, on "Explicitly prohibited" after cell 5.)
  //      TWO EARLIER WRITINGS OF `proveReadings` SURVIVED BOTH — see its own
  //      comment. This gate is only real because they were planted.
  it('carries both readings of MOD-DOH-09 and adopts neither', () => {
    // THE CLAIM AGAINST ITS OWN EVIDENCE, not just the evidence against
    // itself. This is the assertion whose absence let an inverted reading
    // ship green.
    proveReadings(CC_SIGN_IN_MOD_DOH_09_READINGS, 2)

    // MTX-TEN-02a, header-keyed. A positional read of this row against the
    // register's role order inverts it, so the columns are named.
    const columns = srcLine(22005).split('|').map((c) => c.trim())
    expect(columns).toEqual([
      '',
      '#',
      'Module',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
      '',
    ])
    const cells = srcLine(22015).split('|').map((c) => c.trim())
    expect(cells[columns.indexOf('#')]).toBe('`MOD-DOH-09`')
    expect(cells[columns.indexOf('Tenant Admin')]).toBe('`Allowed` `[H17]`')
    expect(cells[columns.indexOf('Supervisor')]).toBe('`Unavailable`')
    expect(cells[columns.indexOf('Quality Manager')]).toBe('`Unavailable`')
    expect(cells[columns.indexOf('Read-only Auditor')]).toBe('`Read-only`')
    expect(cells[columns.indexOf('Worker')]).toBe('`Explicitly prohibited` `[H18]`')

    // The disagreement is real: the register admits two roles the matrix
    // calls `Unavailable`, and gives the excluded Auditor `Read-only`.
    expect(CC_SIGN_IN_SCREEN.rolesThatCanOpen).toContain('SUPERVISOR')
    expect(CC_SIGN_IN_SCREEN.rolesThatCanOpen).toContain('QUALITY_MANAGER')

    // NO WINNER IS EXPRESSIBLE. `DecisionReading` has exactly `text` and
    // `locator`; a third key on any reading is a mark this build could read
    // as an adoption.
    for (const r of CC_SIGN_IN_MOD_DOH_09_READINGS) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
  })
})

/* ==================================================================== *
 * THE SURFACE EXCLUSION — VERIFIED WHERE IT LIVES, NOT FORKED.
 * ==================================================================== */

describe('the Auditor and Worker exclusion is satisfied before this screen', () => {
  // FAILS IF: an excluded role reaches the route layer's grant, or this
  // screen grows a second exclusion mechanism whose answer could differ.
  // TWO GUARDS, SO BOTH WERE PLANTED SEPARATELY AND TOGETHER. The route
  // layer's grant and the screen gate are independent refusals.
  // PLANTED (a): added `'READONLY_AUDITOR'` to the `SURF-CC` arm of
  //          `allowedRoles` in `src/routes/definitions.ts`.
  // RED: expected false to be true — `satisfiedAtRouteLayer`.
  // PLANTED (b): `if (isCcExcludedRole(role)) return false` removed from
  //          `ccScreenOpensFor` in `src/surfaces/cc/access.ts`.
  // GREEN — AND THAT IS THE FINDING, NOT A GAP IN THIS GATE. The clause is
  //      UNREACHABLE BY CONSTRUCTION off the register's own data: no register
  //      row lists an excluded role in `Roles that can open it`, so
  //      `rolesThatCanOpen.includes(role)` already answers false for both and
  //      the clause never decides anything. This is the exact shape of
  //      `controlsOnActsHeldElsewhere`'s second loop, which was unreachable
  //      until a slice-7 module planted a misclassified row and watched it
  //      stay green. So the misclassified row is planted here too.
  // PLANTED (c): `rolesThatCanOpen: [SUP, QM, TA]` -> `[SUP, QM, TA, 'READONLY_AUDITOR']`
  //          on the SCR-CC-01 record in `src/surfaces/cc/screens.ts`, clause
  //          LEFT IN PLACE.
  // RED: expected false to be true — but on `registerAgreesWithRouteLayer`,
  //      NOT on the screen gate. That is the honest result and it is recorded
  //      rather than tidied: a misclassified row is caught here by the
  //      register disagreeing with the route layer, and `refusedByScreenGate`
  //      reads the same list with the clause and without it.
  // PLANTED (b+c) TOGETHER: the misclassified row AND the clause removed.
  // RED: expected false to be true — the same assertion, still not the
  //      clause. So this suite proves the exclusion holds and does NOT prove
  //      the clause is what holds it; `tests/unit/cc-spine.test.ts` asks the
  //      evaluator with the excluded role explicitly granted, which is where
  //      that claim belongs.
  // PLANTED (a+b) TOGETHER: red on (a)'s assertion, and (b) still silent —
  //      neither masking the other.
  it('reports the exclusion by computing it from the layers that decide it', () => {
    expect(CC_SIGN_IN_EXCLUSION.excludedAtTheDoor.length, 'not vacuous').toBeGreaterThan(0)
    expect(CC_SIGN_IN_EXCLUSION.routeLayerGrants.length, 'not vacuous').toBeGreaterThan(0)

    expect(CC_SIGN_IN_EXCLUSION.satisfiedAtRouteLayer).toBe(true)
    expect(CC_SIGN_IN_EXCLUSION.registerAgreesWithRouteLayer).toBe(true)
    expect([...CC_SIGN_IN_EXCLUSION.refusedByScreenGate].sort()).toEqual(
      [...CC_SIGN_IN_EXCLUSION.excludedAtTheDoor].sort(),
    )

    // THE SCREEN GATE'S OWN CLAUSE, ASKED WHERE IT COULD MATTER. Today no
    // register row lists an excluded role, so `rolesThatCanOpen` alone
    // refuses both and the clause decides nothing — which is why removing it
    // leaves this suite green on its own. Asked across every screen, the
    // refusal is total, and the pair-plant above is what proves the clause
    // rather than the list is holding it.
    for (const s of CC_SCREENS) {
      for (const role of CC_SIGN_IN_EXCLUSION.excludedAtTheDoor) {
        expect(ccScreenOpensFor(s.id, role), `${s.id} / ${role}`).toBe(false)
      }
      expect(
        s.rolesThatCanOpen.some((r) => CC_SIGN_IN_EXCLUSION.excludedAtTheDoor.includes(r)),
        `${s.id} lists no excluded role, which is why the clause reads as redundant`,
      ).toBe(false)
    }

    // The prose the exclusion rests on, at the lines `access.ts` cites.
    expect(srcLine(34963)).toContain('an Auditor session must not be able to render a Command Center route at all')
    expect(srcLine(34965)).toContain("the worker's surface is the Frontline Worker Application")
  })

  // FAILS IF: the three tokens are collapsed into one, which is the shape
  // that would make this surface render three different screens for one rule
  // — `WriteControl` draws `explicitlyProhibited` as nothing and
  // `unavailable` as a disabled control with its reason.
  // PLANTED: the third reading's locator changed from L3799 to L3800.
  // RED (FIRST WRITING: SURVIVED). The first form of this gate asserted three
  //      hardcoded line numbers and never read the readings' own locators, so
  //      moving a locator to a line that says nothing left it green — an
  //      allowance taking its allowed value from beside the value under test.
  //      The lines are now DERIVED from the locators, and the same plant is
  //      RED: §3.5 scope row · L3800 carries "the Read-only Auditor is
  //      Unavailable on the Client Command Center" as a cell, in order, at or
  //      after cell 0: expected -1 to be greater than or equal to 0.
  it('carries three status tokens for one exclusion and chooses none', () => {
    // EVERY LINE HERE IS THE READING'S OWN. Nothing is hardcoded beside it.
    proveReadings(CC_EXCLUSION_TOKEN_READINGS, 3)
    const lines = CC_EXCLUSION_TOKEN_READINGS.map((r) => locatorLine(r.locator))

    // Three DISTINCT tokens, counted off the source rather than off the list.
    const tokens = new Set<string>()
    for (const line of lines) {
      const text = srcLine(line)
      if (text.includes('Not applicable — no surface access')) tokens.add('notApplicable')
      else if (/\bUnavailable\b/.test(text)) tokens.add('unavailable')
      if (text.includes('Explicitly prohibited')) tokens.add('explicitlyProhibited')
    }
    expect([...tokens].sort()).toEqual([
      'explicitlyProhibited',
      'notApplicable',
      'unavailable',
    ])
  })
})

/* ==================================================================== *
 * LANDING RESOLUTION.
 * ==================================================================== */

describe('the landing precedence table, counted and transcribed', () => {
  // FAILS IF: a row is added, dropped, or inferred from a span. The walk
  // starts at the separator plus one and stops at the first line that is not
  // a table row, so the count is the source's and never a subtraction.
  // PLANTED: the `Tenant Admin plus an operational grant` row deleted from
  //          `CC_LANDING_PRECEDENCE` in `src/surfaces/cc/sign-in/model.ts`.
  // RED: expected [ { …(5) }, { …(5) }, { …(5) }, …(3) ] to have a length of
  //      7 but got 6.
  //      FIRST SPELLING OF THIS PLANT WAS NOT A PLANT. Deleting from the
  //      `grantSet` line left a dangling `{` and the suite reported "no
  //      tests" — a transform error short-circuits every gate in the file, so
  //      nothing was proven. Respelled to take the whole object literal.
  it('counts the rows one at a time and matches every cell header-keyed', () => {
    const columns = srcLine(35073).split('|').map((c) => c.trim())
    expect(columns).toEqual(['', 'Grant set held', 'Landing view', 'Reason', ''])
    expect(srcLine(35074).replaceAll(/[|\- ]/g, ''), 'the separator row').toBe('')

    let rows = 0
    while (srcLine(35075 + rows).startsWith('| ')) rows += 1
    expect(rows, 'rows counted one at a time, never a span subtracted').toBe(7)
    expect(CC_LANDING_PRECEDENCE).toHaveLength(rows)

    CC_LANDING_PRECEDENCE.forEach((row, i) => {
      const line = 35075 + i
      expect(row.sourceRef, `row ${i} names its own line`).toBe(`L${line}`)
      const cells = srcLine(line).split('|').map((c) => c.trim())
      expect(cells[columns.indexOf('Grant set held')]).toBe(row.grantSet)
      expect(cells[columns.indexOf('Landing view')]).toBe(row.landingView)
      expect(cells[columns.indexOf('Reason')]).toBe(row.reason)
    })
  })

  // FAILS IF: the register's verdict stops being derived from the register.
  // A field written beside each row would agree with itself forever; this
  // reads `Navigation entry point` and is therefore falsifiable.
  // TWO DIRECTIONS, BOTH ASSERTED: a check that "no landing is register-named"
  // would pass on a predicate matching nothing at all.
  // PLANTED: `navigationEntry: 'Main navigation'` -> `'Landing for the Tenant
  //          Admin'` on the SCR-CC-11 record in `src/surfaces/cc/screens.ts`
  //          (wave 0's file — planted by index, reversed by the same index).
  // RED: expected true to be false — the Tenant Admin landing is not one the
  //      register receives.
  it('derives from the register which landings it actually receives', () => {
    const bySourceRef = (ref: string) => {
      const row = CC_LANDING_PRECEDENCE.find((r) => r.sourceRef === ref)
      if (row === undefined) throw new Error(`no precedence row ${ref}`)
      return row
    }

    // The two the register names, and it names them on its own rows.
    expect(ccLandingIsRegisterNamed(bySourceRef('L35075')), 'Quality Manager').toBe(true)
    expect(ccLandingIsRegisterNamed(bySourceRef('L35076')), 'Supervisor').toBe(true)
    expect(srcLine(48387)).toContain('Landing for the Supervisor')
    expect(srcLine(48391)).toContain('Landing for the Quality Manager')

    // THE FINDING. The precedence table sends the Tenant Admin to a screen
    // the register enters from main navigation, so no register row receives
    // that landing.
    const tenantAdmin = bySourceRef('L35078')
    expect(tenantAdmin.grantSet).toBe('Tenant Admin only')
    expect(tenantAdmin.registerScreen).toBe('SCR-CC-11')
    expect(ccLandingIsRegisterNamed(tenantAdmin)).toBe(false)
    expect(srcLine(48396)).toContain('| Tenant Admin, Quality Manager |')
    expect(srcLine(48396)).toContain('| Main navigation |')

    // Derived, never a second list, and it agrees with the source's own rows.
    expect([...CC_REGISTER_NAMED_LANDINGS].sort()).toEqual(['SCR-CC-02', 'SCR-CC-06', 'SCR-CC-07'])
    for (const id of CC_REGISTER_NAMED_LANDINGS) {
      const screen = CC_SCREENS.find((s) => s.id === id)
      expect(screen).toBeDefined()
      expect(srcLine(Number(screen?.registerRef.slice(1)))).toContain(String(screen?.navigationEntry))
    }
  })

  // FAILS IF: this screen ever computes a landing for the Tenant Admin. The
  // source answers the question eight ways and none of the eight is adopted.
  // PLANTED: a ninth reading appended to `CC_TENANT_ADMIN_READINGS` with
  //          `locator: 'planted · L36266'` and the L35004 text.
  // RED: expected [ { …(2) }, { …(2) }, { …(2) }, …(6) ] to have a length of
  //      8 but got 9.
  it('carries eight Tenant Admin statements, each proved at its own line', () => {
    // Eight readings, eight distinct lines, every claim proved at its own.
    proveReadings(CC_TENANT_ADMIN_READINGS, 8)

    // NO WINNER IS EXPRESSIBLE on any of them.
    for (const r of CC_TENANT_ADMIN_READINGS) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
  })
})

/* ==================================================================== *
 * FB-CC-AUTH, AND THE TESTS THE SOURCE NAMES.
 * ==================================================================== */

describe('the auth fallback is read from the wave-0 registry', () => {
  // FAILS IF: this screen mints a second spelling of FB-CC-AUTH, or a
  // degraded-auth mode appears where the source denies the session.
  // PLANTED: `decisionControls: 'Unavailable'` -> `'Disabled with the reason
  //          shown'` on the FB-CC-AUTH record in
  //          `src/surfaces/cc/fallback/patterns.ts` (wave 0's file — planted
  //          by index, reversed by the same index).
  // RED: expected 'Unavailable' to be 'Disabled with the reason shown'.
  it('matches L35700 cell for cell, header-keyed', () => {
    const columns = srcLine(35692).split('|').map((c) => c.trim())
    expect(columns).toEqual([
      '',
      'Pattern',
      'Triggering condition',
      'Decision controls',
      'Client-side queueing',
      'Terminal safe state',
      '',
    ])
    const cells = srcLine(35700).split('|').map((c) => c.trim())
    expect(cells[columns.indexOf('Pattern')]).toBe('`FB-CC-AUTH`')
    expect(cells[columns.indexOf('Triggering condition')]).toBe(
      CC_SIGN_IN_FALLBACK.triggeringCondition,
    )
    expect(cells[columns.indexOf('Decision controls')]).toBe(CC_SIGN_IN_FALLBACK.decisionControls)
    expect(cells[columns.indexOf('Client-side queueing')]).toBe(
      CC_SIGN_IN_FALLBACK.clientSideQueueing,
    )
    expect(cells[columns.indexOf('Terminal safe state')]).toBe(CC_SIGN_IN_FALLBACK.terminalSafeState)

    // The distinction the wave-0 registry keeps and this screen must not
    // flatten: this row's refusal is "no session", not "a write held back".
    expect(CC_SIGN_IN_FALLBACK.clientSideQueueing).not.toBe('None, deliberately')
  })

  // FAILS IF: a named test drifts off its line. The bullets are not table
  // rows, so each claim is pinned inside the one cell `sourceCells` yields
  // for a line carrying no pipe — which is still the whole line, and is why
  // the plant moves a locator to an ADJACENT line carrying a DIFFERENT test
  // rather than to a blank one.
  // PLANTED: `TEST-CC-023`'s locator moved one line UP, onto the bullet
  //          directly above its own, which names a different test. The wrong
  //          line's number is deliberately not spelled here: it does not
  //          carry what such a citation would claim, and
  //          `tests/coverage/locator-fidelity.test.ts` lexes an L-number in a
  //          comment as a citation whether or not the sentence says it is
  //          describing a defect. It went red on exactly this comment.
  // RED: the moved locator carries "TEST-CC-023 (denial) — Open a session as
  //      Read-only Auditor; assert no landing view resolves." as a cell, in
  //      order, at or after cell 0: expected -1 to be greater than or equal
  //      to 0.
  it('names the source’s own tests rather than inventing session states', () => {
    proveReadings(CC_SIGN_IN_SOURCE_TESTS, 3)
  })
})

/* ==================================================================== *
 * NO ACTION RAIL.
 * ==================================================================== */

describe('this screen exercises none of the ten operational actions', () => {
  // FAILS IF: the action rail is mounted here. L38793 enumerates the modules
  // whose screens exercise one or more of the ten, and this screen's module
  // is not one of them.
  // A TEXT CHECK ALONE COULD NOT FAIL: a file that quotes a list of module
  // identifiers contains every identifier in that list, which is how
  // `page.includes('MOD-CC-04')` went green on the L38793 quotation. So the
  // IMPORT is what is asserted, not a mention.
  // PLANTED: `import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'`
  //          added to `src/surfaces/cc/sign-in/SignInScreen.tsx` and rendered.
  // RED: expected [ Array(1) ] to deeply equal [].
  it('imports no action rail, and L38793 names seven modules that would', () => {
    const enumerated = srcLine(38793).match(/MOD-CC-\d\d/g) ?? []
    expect([...new Set(enumerated)].sort()).toEqual([
      'MOD-CC-03',
      'MOD-CC-04',
      'MOD-CC-05',
      'MOD-CC-06',
      'MOD-CC-09',
      'MOD-CC-10',
      'MOD-CC-12',
    ])
    expect(enumerated, 'the module this screen reuses is not among them').not.toContain(
      'MOD-DOH-09',
    )

    const RAIL = /from\s+'[^']*modules\/cc-13\/[^']*'/
    const mounting = walk(SIGN_IN_DIR)
      .filter((f) => RAIL.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1))
    expect(mounting).toEqual([])

    // NOT VACUOUS: the walk really reads these files, and the same regex
    // finds the rail where a screen that does mount it lives.
    expect(walk(SIGN_IN_DIR).length).toBeGreaterThan(0)
    const mounted = join(ROOT, 'src', 'surfaces', 'cc', 'modules', 'cc-04', 'DeviationWorkspace.tsx')
    if (existsSync(mounted)) {
      expect(RAIL.test(readFileSync(mounted, 'utf8')), 'the predicate can fire').toBe(false)
    }
  })
})

/* ==================================================================== *
 * THE ABSTENTION, DECLARED — AND THE TREE HELD TO IT.
 * ==================================================================== */

describe('this surface authors no route directory for SCR-CC-01', () => {
  // FAILS IF: a route directory appears for this screen under either name.
  // Both refusals are asserted because they are independent: the first name
  // collides across surfaces, and every other name is unregistered.
  // PLANTED: `app/command-center/sign-in/page.tsx`, a real page.
  // RED: expected [ 'sign-in' ] to deeply equal [] — and separately,
  //      `tests/unit/cc-spine.test.ts` went red on the same plant, its walk
  //      finding three directories of that basename where it asserts two.
  // PLANTED AGAIN: `app/command-center/cc-sign-in/page.tsx`.
  // RED: expected [ 'cc-sign-in' ] to deeply equal [] — the other refusal,
  //      on a name that collides with nothing.
  it('holds no directory of its own under either name', () => {
    const onDisk = readdirSync(ROUTE_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
      .filter((name) => existsSync(join(ROUTE_ROOT, name, 'page.tsx')))

    // The key the spine offers this screen, and the two directories that
    // already carry it.
    expect(ccScreenSlug(CC_SIGN_IN_SCREEN)).toBe('sign-in')
    expect(existsSync(join(ROOT, 'app', 'frontline', 'sign-in'))).toBe(true)
    expect(existsSync(join(ROOT, 'app', 'studio', 'sign-in'))).toBe(true)
    expect(onDisk.filter((d) => d === 'sign-in')).toEqual([])

    // And every other name: the authored keys are the eleven claimed slugs
    // plus the one unowned key the register does key, and nothing else may
    // appear here. Derived from the spine, never a list typed twice.
    const authored = new Set([
      ...CC_CLAIMED_SLUGS,
      ...CC_SCREENS.flatMap((s) =>
        s.unownedSlug === null || s.unownedSlug === 'sign-in' ? [] : [s.unownedSlug],
      ),
    ])
    expect(onDisk.filter((d) => !authored.has(d))).toEqual([])
    expect(authored.size, 'not vacuous — the permitted set is the twelve').toBe(12)
    expect(authored.has('sign-in'), 'the excluded key really is excluded').toBe(false)
  })

  // FAILS IF: the abstention stops being declared and becomes an oversight.
  // That is the `cc-10-s366` finding — a component imported by no page and no
  // test, whose absence was declared nowhere — and the difference between it
  // and `cc-02` is a stated abstention. So the declaration is asserted in the
  // file that makes it, and the tree is asserted to agree.
  // PLANTED: the "This directory authors no route" paragraph deleted from the
  //          header of `src/surfaces/cc/sign-in/model.ts`.
  // RED: expected 'import type { DecisionReading } fr…' to contain
  //      'authors no route'.
  it('declares the abstention in its own header and names the wiring', () => {
    const model = readFileSync(join(SIGN_IN_DIR, 'model.ts'), 'utf8')
    expect(model, 'the abstention is stated').toContain(
      'THIS DIRECTORY AUTHORS NO ROUTE',
    )
    expect(model, 'and the wiring is named rather than left to inference').toContain(
      'app/command-center/page.tsx',
    )

    // The tree agrees with the declaration: nothing under `app/` imports this
    // directory today. The day one does, this goes red and forces the header
    // to stop claiming an abstention it no longer has.
    const IMPORTS = /from\s+'[^']*surfaces\/cc\/sign-in(?:\/[^']*)?'/
    const importers = walk(join(ROOT, 'app'))
      .filter((f) => IMPORTS.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1))
    expect(importers).toEqual([])

    // NOT VACUOUS. The same walk and the same shape of regex find the shell
    // where a directory that IS reached from `app/` lives, so a green here
    // cannot mean the walk read nothing.
    const SHELL = /from\s+'[^']*surfaces\/cc\/shell\/CommandCenterShell'/
    const shellImporters = walk(join(ROOT, 'app')).filter((f) =>
      SHELL.test(readFileSync(f, 'utf8')),
    )
    expect(shellImporters.length, 'the walk really reads app/').toBeGreaterThan(0)
  })

  // FAILS IF: anything under this directory acquires `'use client'`. Every
  // export below it is plain data a server component reads, and Next replaces
  // a client module's exports with client references — the defect that put
  // `data-testid="fl-panel-undefined"` into four built pages while every
  // component test passed.
  // PLANTED: `'use client'` added as the first line of
  //          `src/surfaces/cc/sign-in/model.ts`.
  // RED: expected [ 'src/surfaces/cc/sign-in/model.ts' ] to deeply equal [].
  it('crosses no client boundary', () => {
    const DIRECTIVE = /^\s*(['"])use client\1/m
    const offenders = walk(SIGN_IN_DIR)
      .filter((f) => DIRECTIVE.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1))
    expect(offenders).toEqual([])
    expect(walk(SIGN_IN_DIR).length, 'not vacuous').toBeGreaterThan(1)
  })
})

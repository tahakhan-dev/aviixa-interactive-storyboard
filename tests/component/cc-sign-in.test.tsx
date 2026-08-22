import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SignInScreen } from '@/surfaces/cc/sign-in/SignInScreen'
import {
  CC_EXCLUSION_TOKEN_READINGS,
  CC_LANDING_PRECEDENCE,
  CC_SIGN_IN_EXCLUSION,
  CC_SIGN_IN_FALLBACK,
  CC_SIGN_IN_SCREEN,
  CC_TENANT_ADMIN_READINGS,
} from '@/surfaces/cc/sign-in/model'

/**
 * `SCR-CC-01`, RENDERED.
 *
 * EVERY CELL IS READ THROUGH ITS OWN `data-testid`, never by sweeping a
 * container's `textContent`. `textContent` welds adjacent elements together —
 * first on this build's catalogue of gates that could not fail — and this
 * screen renders eight readings whose texts share long prefixes, so a swept
 * read would pass on any one of them appearing anywhere.
 *
 * THE TRANSCRIPTION GATE AND THE RENDER GATE ARE DIFFERENT GATES, and this
 * file is the second. `tests/unit/cc-sign-in.test.ts` proves the model
 * matches the frozen source header-keyed; a name-keyed lookup here would be
 * blind to column order, and reversing the body's columns leaves every
 * `data-testid` sitting on its own value with every cell under the wrong
 * heading. So the header order is asserted POSITIONALLY beside it.
 */

describe('the sign-in screen renders the register row and the exclusion', () => {
  // FAILS IF: the screen stops naming its own register row, or starts
  // carrying a transcription of it instead of reading the spine's.
  // PLANTED: `{screen.modulesShown}` removed from the annotation line in
  //          `src/surfaces/cc/sign-in/SignInScreen.tsx`.
  // RED: expected 'SCR-CC-01 · register row L48386 · roles…' to contain
  //      'Reuses MOD-DOH-09'.
  it('names the row, its roles column and the module it reuses', () => {
    render(<SignInScreen />)
    const annotation = screen.getByTestId('cc-sign-in-register')
    expect(annotation.textContent).toContain(CC_SIGN_IN_SCREEN.registerRef)
    expect(annotation.textContent).toContain(CC_SIGN_IN_SCREEN.rolesColumn)
    expect(annotation.textContent).toContain(CC_SIGN_IN_SCREEN.modulesShown)
    expect(annotation.textContent).toContain(CC_SIGN_IN_SCREEN.navigationEntry)
  })

  // FAILS IF: the screen decides the exclusion itself instead of reporting
  // the layers that decide it. Every value below is rendered from a computed
  // field, so a hand-written "true" in the component would still have to
  // agree with `routeBySurface` and `ccScreenOpensFor`.
  // PLANTED: `{String(CC_SIGN_IN_EXCLUSION.satisfiedAtRouteLayer)}` replaced
  //          with the literal `true` in `SignInScreen.tsx`.
  // RED: expected 'true' to be 'true' PASSED — so the assertion was changed
  //      to compare against the computed field with the route layer planted
  //      too (`'READONLY_AUDITOR'` added to the `SURF-CC` arm of
  //      `allowedRoles` in `src/routes/definitions.ts`), and it went RED:
  //      expected 'true' to be 'false'. The first writing of this gate could
  //      not fail; both plants are now required together.
  it('reports the exclusion from the layers that decide it', () => {
    render(<SignInScreen />)
    expect(screen.getByTestId('cc-sign-in-route-grants').textContent).toBe(
      CC_SIGN_IN_EXCLUSION.routeLayerGrants.join(', '),
    )
    expect(screen.getByTestId('cc-sign-in-excluded').textContent).toBe(
      CC_SIGN_IN_EXCLUSION.excludedAtTheDoor.join(', '),
    )
    expect(screen.getByTestId('cc-sign-in-refused').textContent).toBe(
      CC_SIGN_IN_EXCLUSION.refusedByScreenGate.join(', '),
    )
    expect(screen.getByTestId('cc-sign-in-satisfied').textContent).toBe(
      String(CC_SIGN_IN_EXCLUSION.satisfiedAtRouteLayer),
    )
    expect(screen.getByTestId('cc-sign-in-register-agrees').textContent).toBe(
      String(CC_SIGN_IN_EXCLUSION.registerAgreesWithRouteLayer),
    )
    // The rendered strings are the roles themselves, not empty joins.
    expect(screen.getByTestId('cc-sign-in-refused').textContent).toContain('READONLY_AUDITOR')
    expect(screen.getByTestId('cc-sign-in-refused').textContent).toContain('WORKER')
  })

  // FAILS IF: the three tokens are rendered as one, or a reading loses its
  // locator on screen. Each reading has its own testid keyed on its locator,
  // so two readings collapsing into one row is a missing element rather than
  // a longer string.
  // PLANTED: the third reading deleted from `CC_EXCLUSION_TOKEN_READINGS` in
  //          `src/surfaces/cc/sign-in/model.ts`.
  // RED (FIRST WRITING: SURVIVED). The loop below ran over the constant it
  //      was meant to verify, so it SHRANK ALONG WITH ITS SUBJECT and every
  //      remaining reading was found — the `for...of` on this build's
  //      catalogue of gates that could not fail. The length is now asserted
  //      first, and the same plant is RED: expected [ { …(2) }, { …(2) } ] to
  //      have a length of 3 but got 2. The three itself is derived from the
  //      frozen source in `tests/unit/cc-sign-in.test.ts`, never from here.
  it('renders all three exclusion tokens, each beside its own locator', () => {
    render(<SignInScreen />)
    expect(CC_EXCLUSION_TOKEN_READINGS, 'the loop cannot shrink with its subject').toHaveLength(3)
    for (const r of CC_EXCLUSION_TOKEN_READINGS) {
      const row = screen.getByTestId(`cc-sign-in-exclusion-tokens-${r.locator}`)
      expect(row.textContent).toContain(r.text)
      expect(row.textContent).toContain(r.locator)
    }
  })
})

describe('the landing table renders whole, and picks nothing for the Tenant Admin', () => {
  const COLUMNS = [
    'Grant set held',
    'Landing view',
    'Reason',
    'Named as a landing by the register',
    'Row',
  ]

  // FAILS IF: the header order and the body order come apart. Header-keying
  // protects the transcription and does not protect the render: reversing the
  // body's columns leaves every `data-testid` on its own value and every cell
  // under the wrong heading.
  // PLANTED: the `grantSet` and `reason` cells swapped in the row body of
  //          `src/surfaces/cc/sign-in/SignInScreen.tsx`.
  // RED: expected 'Gate items and learned-change proposal…' to be
  //      'Quality Manager, with or without Supervi…'.
  it('renders its columns in the source’s own order, positionally', () => {
    render(<SignInScreen />)
    const table = screen.getByTestId('cc-sign-in-landings').querySelector('table')
    expect(table).not.toBeNull()
    expect([...(table?.querySelectorAll('thead th') ?? [])].map((h) => h.textContent)).toEqual(
      COLUMNS,
    )

    for (const row of CC_LANDING_PRECEDENCE) {
      const cells = [
        ...screen.getByTestId(`cc-sign-in-landing-${row.sourceRef}`).querySelectorAll('td'),
      ]
      expect(cells, `${row.sourceRef} renders one cell per column`).toHaveLength(COLUMNS.length)
      expect(cells[0]?.textContent).toBe(row.grantSet)
      expect(cells[1]?.textContent).toBe(row.landingView)
      expect(cells[2]?.textContent).toBe(row.reason)
      expect(cells[4]?.textContent).toBe(row.sourceRef)
    }
  })

  // FAILS IF: a landing view is dropped, or the Tenant Admin's row acquires a
  // landing the register does not receive.
  // PLANTED: the `L35078` row's `registerScreen` changed from `'SCR-CC-11'`
  //          to `'SCR-CC-06'` in `src/surfaces/cc/sign-in/model.ts` — a
  //          screen the register DOES call a landing, so the plant flips the
  //          derived verdict rather than merely renaming the target.
  // RED: expected 'Yes — SCR-CC-06' to be
  //      'No — SCR-CC-11 is entered from main navigation'.
  it('renders seven rows and refuses a landing the register does not name', () => {
    render(<SignInScreen />)
    expect(CC_LANDING_PRECEDENCE).toHaveLength(7)
    for (const row of CC_LANDING_PRECEDENCE) {
      expect(screen.getByTestId(`cc-sign-in-landing-${row.sourceRef}`)).toBeTruthy()
    }

    expect(screen.getByTestId('cc-sign-in-landing-L35076-named').textContent).toBe(
      'Yes — SCR-CC-02',
    )
    expect(screen.getByTestId('cc-sign-in-landing-L35075-named').textContent).toBe(
      'Yes — SCR-CC-06',
    )
    expect(screen.getByTestId('cc-sign-in-landing-L35078-named').textContent).toBe(
      'No — SCR-CC-11 is entered from main navigation',
    )
    expect(screen.getByTestId('cc-sign-in-landing-L35079-named').textContent).toBe(
      'No register row resolves this landing',
    )
  })

  // FAILS IF: any of the eight Tenant Admin statements stops reaching the
  // screen, or the screen starts answering the question. The unresolved
  // paragraph is asserted to be present AND to say that nothing is adopted.
  // PLANTED: the whole `<Readings id="tenant-admin" …/>` element replaced by
  //          a JSX comment in `src/surfaces/cc/sign-in/SignInScreen.tsx`.
  // RED: Unable to find an element by:
  //      [data-testid="cc-sign-in-tenant-admin-§21.1.2 surface matrix · L35004"].
  //      FIRST SPELLING OF THIS PLANT WAS NOT A PLANT: it started one line
  //      inside the element, left `<Readings` dangling, and the suite
  //      reported "no tests" — a transform error proves nothing about a gate.
  it('renders all eight Tenant Admin statements and adopts none', () => {
    render(<SignInScreen />)
    expect(CC_TENANT_ADMIN_READINGS).toHaveLength(8)
    for (const r of CC_TENANT_ADMIN_READINGS) {
      const row = screen.getByTestId(`cc-sign-in-tenant-admin-${r.locator}`)
      expect(row.textContent).toContain(r.text)
      expect(row.textContent).toContain(r.locator)
    }
    const note = screen.getByTestId('cc-sign-in-tenant-admin-unresolved')
    expect(note.textContent).toContain('none is adopted')
  })
})

describe('the screen mounts no operational controls', () => {
  // FAILS IF: the action rail, or any control at all, appears here. L38793
  // names the seven modules whose screens exercise one or more of the ten,
  // and this screen's module is not among them.
  // PLANTED: a `<button type="button">Release lot hold</button>` added to
  //          `src/surfaces/cc/sign-in/SignInScreen.tsx`.
  // RED: expected <button type="button"></button> to have a length of +0 but
  //      got 1.
  it('renders no button, no input and no action rail', () => {
    const { container } = render(<SignInScreen />)
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(container.querySelectorAll('[data-testid^="cc13-"]')).toHaveLength(0)
    expect(screen.queryByTestId('cc-action-rail-slot')).toBeNull()

    // NOT VACUOUS: the render really produced this screen.
    expect(screen.getByTestId('cc-sign-in')).toBeTruthy()
    expect(container.querySelectorAll('td').length).toBeGreaterThan(0)
  })

  // FAILS IF: the auth fallback is paraphrased on screen or a degraded-auth
  // mode appears. All four cells are rendered from the wave-0 registry.
  // PLANTED: `{CC_SIGN_IN_FALLBACK.decisionControls}` replaced with the
  //          literal string 'Disabled with the reason shown' in
  //          `SignInScreen.tsx`.
  // RED: expected 'Disabled with the reason shown' to be 'Unavailable'.
  it('renders FB-CC-AUTH’s four cells from the registry', () => {
    render(<SignInScreen />)
    expect(screen.getByTestId('cc-sign-in-fb-trigger').textContent).toBe(
      CC_SIGN_IN_FALLBACK.triggeringCondition,
    )
    expect(screen.getByTestId('cc-sign-in-fb-controls').textContent).toBe(
      CC_SIGN_IN_FALLBACK.decisionControls,
    )
    expect(screen.getByTestId('cc-sign-in-fb-queue').textContent).toBe(
      CC_SIGN_IN_FALLBACK.clientSideQueueing,
    )
    expect(screen.getByTestId('cc-sign-in-fb-terminal').textContent).toBe(
      CC_SIGN_IN_FALLBACK.terminalSafeState,
    )
    expect(screen.getByTestId('cc-sign-in-fb-controls').textContent).toBe('Unavailable')
  })

  // FAILS IF: the abstention stops being on screen. A client reviewing this
  // surface must meet a stated absence naming its reason, not a blank — the
  // `cc-10-s366` lesson, which was an undeclared absence rather than a wrong
  // one.
  // PLANTED: the whole `cc-sign-in-no-route` paragraph replaced by a JSX
  //          comment in `SignInScreen.tsx`.
  // RED: Unable to find an element by:
  //      [data-testid="cc-sign-in-no-route"]. (First spelling left `<p`
  //      dangling and reported "no tests"; respelled to take the element.)
  it('states on screen that this surface authors no route for it', () => {
    render(<SignInScreen />)
    const note = screen.getByTestId('cc-sign-in-no-route')
    expect(note.textContent).toContain('authors no route directory')
    expect(note.textContent).toContain('thirteen screens')
    expect(note.textContent).toContain('twelve directories')
  })
})

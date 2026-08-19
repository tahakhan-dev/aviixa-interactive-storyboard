import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { IntegrationSurfaceScreen } from '../../app/hub/integration-surface/IntegrationSurfaceScreen'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  CONFIGURATION_EDIT,
  CONNECTION_LOSS_STATES,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  INAPPLICABLE_SCREEN_STATES,
  OUT_OF_SLICE_INTEGRATIONS,
  UNSPECIFIED_IN_SOURCE,
} from '../../app/hub/integration-surface/fixtures'
import { SEEDED_SSO_CONNECTION, SSO_PROTOTYPE_NOTE } from '@/surfaces/doh/sso-connection'
import { TENANT_STATES, writeAllowed } from '@/surfaces/doh/tenant-state'
import { dohModuleById } from '@/surfaces/doh/modules'
import { screenState } from '@/ui/screen-state'

/* ------------------------------------------------------------------ *
 * Helpers. Every assertion below reads the real DOM: a role, an
 * accessible name, an `aria-disabled` state, or the text of the element
 * an `aria-describedby` actually points at. Nothing here can pass
 * against an empty document.
 * ------------------------------------------------------------------ */

const METADATA = /Save single sign-on metadata/
const EMAIL_WRITE = /Save the tenant contact email/
const TEST_CONNECTION = /Test connection/

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setTenantState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Tenant state' }), {
    target: { value: state },
  })
}

function setScreenState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Screen state' }), {
    target: { value: state },
  })
}

function setConnectionState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Connection record state' }), {
    target: { value: state },
  })
}

function setProtocol(protocol: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Single sign-on protocol' }), {
    target: { value: protocol },
  })
}

function typeEmail(value: string): void {
  fireEvent.change(screen.getByLabelText(/^Tenant contact email$/), { target: { value } })
}

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function isInert(el: HTMLElement): boolean {
  return el.getAttribute('aria-disabled') === 'true'
}

/** The reason text a disabled control actually points assistive tech at. */
function statedReason(el: HTMLElement): string {
  const id = el.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

function button(name: RegExp): HTMLElement {
  return screen.getByRole('button', { name })
}

/** The always-mounted `aria-live` container the outcome message lands in. */
function outcomeLiveRegion(): HTMLElement {
  const el = region('Single sign-on').querySelector('[aria-live]')
  if (el === null) throw new Error('Single sign-on has no aria-live container at all')
  return el as HTMLElement
}

/**
 * The rail entry for THIS module, queried out of the shared chrome's real
 * `nav`. `null` is an absence, not a missing query: the Tenant Admin case
 * finds the same link, so a `null` here means the rail withheld it.
 */
function railLinkToThisModule(): HTMLElement | null {
  return within(screen.getByRole('navigation', { name: 'Hub modules' })).queryByRole('link', {
    name: dohModuleById('MOD-DOH-12').name,
  })
}

/** The connection record card's own text, so a change to it can be seen. */
function cardText(): string {
  return region('Single sign-on').textContent ?? ''
}

/** Every banner on the page whose heading is the read-only cause. */
function readOnlyBanners(): readonly HTMLElement[] {
  return screen
    .queryAllByRole('status')
    .filter((b) => b.querySelector('p')?.textContent === 'Read-only')
}

describe('MOD-DOH-12 — the shell contract and screen identity', () => {
  it('renders inside the Hub shell with exactly one h1, the module name', () => {
    render(<IntegrationSurfaceScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Integration Surface (Tenant Side)',
    )
  })

  it('carries the catalogue-B screen number as an annotation and no three-digit form', () => {
    const { container } = render(<IntegrationSurfaceScreen />)
    expect(screen.getAllByText(/SCR-DOH-21/).length).toBeGreaterThan(0)
    expect(container.textContent ?? '').not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('carries the prototype disclosure the record itself owns, verbatim', () => {
    render(<IntegrationSurfaceScreen />)
    expect(screen.getByText(SSO_PROTOTYPE_NOTE)).toBeDefined()
  })

  it('claims no connection to anything, on the face of the card', () => {
    render(<IntegrationSurfaceScreen />)
    const text = cardText()
    expect(text).toMatch(/seeded fixture/i)
    expect(text).toMatch(/no identity provider was contacted/i)
  })
})

describe('MOD-DOH-12 — who reaches the module, checked against the shipped rail', () => {
  it('offers no route to this module to either role the matrix marks Unavailable', () => {
    render(<IntegrationSurfaceScreen />)
    // Positive control first: the Tenant Admin IS offered it, so a null below
    // is a withheld link and not a query that never matched anything.
    expect(railLinkToThisModule()).not.toBeNull()

    for (const roleId of ['SUPERVISOR', 'QUALITY_MANAGER']) {
      viewAs(roleId)
      expect(railLinkToThisModule()).toBeNull()
      // The rail itself is still drawn, over the modules these roles DO
      // reach: this route is withheld, not the whole navigation.
      expect(
        within(screen.getByRole('navigation', { name: 'Hub modules' })).getAllByRole('link').length,
      ).toBeGreaterThan(0)
    }
  })

  it('gives the Supervisor and the Quality Manager STATE-05 on a deep link, not the card', () => {
    render(<IntegrationSurfaceScreen />)
    for (const roleId of ['SUPERVISOR', 'QUALITY_MANAGER']) {
      viewAs(roleId)
      expect(screen.queryByRole('region', { name: 'Single sign-on' })).toBeNull()
      const refusal = screen.getByRole('region', { name: 'Permission denied' })
      const text = refusal.textContent ?? ''
      expect(text).toMatch(/rail does not offer/i)
      expect(text).toMatch(/Unavailable/)
      expect(text).toMatch(/audited/i)
    }
  })

  it('gives the Read-only Auditor the record read-only, with both writes disabled and reasoned', () => {
    render(<IntegrationSurfaceScreen />)
    viewAs('READONLY_AUDITOR')
    // The Auditor OPENS the screen: Explicitly prohibited is not Unavailable.
    expect(region('Single sign-on')).toBeDefined()
    expect(cardText()).toContain(SEEDED_SSO_CONNECTION.tenantContactEmail)

    for (const name of [METADATA, EMAIL_WRITE]) {
      const control = button(name)
      expect(isInert(control)).toBe(true)
      expect(statedReason(control)).toMatch(/Read-only Auditor/)
      expect(statedReason(control)).toMatch(/takes no action at all/i)
    }
  })

  it('states the read-only cause exactly once, whichever screen state is selected', () => {
    render(<IntegrationSurfaceScreen />)
    // The Tenant Admin holds both writes, so no read-only banner is owed.
    expect(readOnlyBanners()).toHaveLength(0)

    viewAs('READONLY_AUDITOR')
    expect(readOnlyBanners()).toHaveLength(1)
    expect(readOnlyBanners()[0]?.textContent ?? '').toMatch(/Explicitly prohibited/)

    // STATE-06's own boundary carries the identical heading. Two banners
    // saying "read-only" is the scattered cause the state contract forbids.
    setScreenState('STATE-06')
    expect(readOnlyBanners()).toHaveLength(1)
  })

  it('renders the nine-row control matrix with an explicit status in every cell', () => {
    render(<IntegrationSurfaceScreen />)
    const matrix = region('Control matrix')
    for (const row of CONTROL_MATRIX) {
      const tableRow = within(matrix).getByRole('row', { name: new RegExp(row.control) })
      // PER CELL, not against the row's whole text. Six of these nine rows
      // carry the same token in all five role columns, so a row that rendered
      // one cell instead of five would still satisfy a `toContain` over the
      // row — the check would pass on a table that had lost four columns.
      const cells = within(tableRow).getAllByRole('cell')
      const statuses = Object.values(row.byRole).map((c) => c.status)
      expect(cells).toHaveLength(statuses.length + 2)
      statuses.forEach((status, i) => {
        // The cell's own first element, exactly — never a prefix match,
        // because 'Allowed' is a substring of 'Allowed with conditions'.
        expect(cells[i + 1]?.querySelector('span')?.textContent).toBe(status)
      })
    }
    expect(CONTROL_MATRIX).toHaveLength(9)
  })
})

describe('MOD-DOH-12 — the two writes actually change what is on screen', () => {
  it('keeps the protocol choice a draft until it is saved, then stores it', () => {
    render(<IntegrationSurfaceScreen />)
    expect(cardText()).toMatch(/Protocol: OpenID Connect/)

    setProtocol('saml')
    // Unsaved: the record at the top of the screen is untouched. A screen
    // that bound the card straight to the picker would fail here.
    expect(cardText()).toMatch(/Protocol: OpenID Connect/)
    expect(cardText()).not.toMatch(/Protocol: SAML/)

    fireEvent.click(button(METADATA))
    expect(cardText()).toMatch(/Protocol: SAML/)
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/SAML/)
  })

  it('brings a not-configured record back to configured through the same write', () => {
    render(<IntegrationSurfaceScreen />)
    setConnectionState('not_configured')
    expect(cardText()).toMatch(/Not configured/)
    expect(cardText()).not.toMatch(/Protocol:/)

    fireEvent.click(button(METADATA))
    expect(cardText()).toMatch(/Configured/)
    expect(cardText()).toMatch(/Protocol:/)
  })

  it('records the tenant contact email and shows the new address on the record', () => {
    render(<IntegrationSurfaceScreen />)
    const next = 'operations.contact@northfieldfoods.example'
    expect(cardText()).not.toContain(next)

    typeEmail(next)
    // Still the stored value until the write commits.
    expect(cardText()).toContain(SEEDED_SSO_CONNECTION.tenantContactEmail)

    fireEvent.click(button(EMAIL_WRITE))
    expect(cardText()).toContain(next)
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/no message was sent/i)
  })

  it('refuses an unreadable contact email as a validation state, and writes nothing', () => {
    render(<IntegrationSurfaceScreen />)
    typeEmail('not-an-address')
    fireEvent.click(button(EMAIL_WRITE))

    expect(screen.getAllByText(/refused rather than guessed at/i).length).toBeGreaterThan(0)
    // The stored address is untouched, and no outcome claims a write.
    expect(cardText()).toContain(SEEDED_SSO_CONNECTION.tenantContactEmail)
    expect(outcomeLiveRegion().textContent).toBe('')
  })

  it('draws only the fields the source enumerates, and invents none', () => {
    render(<IntegrationSurfaceScreen />)
    const sso = region('Single sign-on')
    // The source names two protocols and no metadata field at all, so the
    // section carries exactly one product select and exactly one typed
    // field. An entity identifier, a certificate box or a discovery-document
    // field would read back as a requirement nobody wrote.
    expect(within(sso).getAllByRole('combobox')).toHaveLength(1)
    expect(within(sso).getAllByRole('textbox')).toHaveLength(1)
    expect(sso.querySelectorAll('input')).toHaveLength(1)
  })

  it('writes nothing when the test-connection check runs', () => {
    render(<IntegrationSurfaceScreen />)
    const before = cardText()
    fireEvent.click(button(TEST_CONNECTION))
    // The record is untouched: a check that changed the thing it checks
    // would be a write wearing a read's label.
    expect(cardText()).toContain(SEEDED_SSO_CONNECTION.tenantContactEmail)
    expect(before).toMatch(/Protocol: OpenID Connect/)
    expect(cardText()).toMatch(/Protocol: OpenID Connect/)
    expect(outcomeLiveRegion().textContent).toBe('')
  })

  it('resolves the test-connection check against the record, both ways', () => {
    render(<IntegrationSurfaceScreen />)
    fireEvent.click(button(TEST_CONNECTION))
    let text = region('Single sign-on').textContent ?? ''
    expect(text).toMatch(/resolves onto the single sign-on track/i)
    expect(text).toMatch(/no directory was contacted/i)

    // The other branch, so the check is proved to read the record rather
    // than print one sentence whatever the record says.
    setConnectionState('not_configured')
    fireEvent.click(button(TEST_CONNECTION))
    text = region('Single sign-on').textContent ?? ''
    expect(text).toMatch(/platform-held credential track/i)
    expect(text).not.toMatch(/resolves onto the single sign-on track/i)
  })
})

describe('MOD-DOH-12 — the tenant state gate, applied before any write control', () => {
  it('follows writeAllowed for every one of the five operating states, on both writes', () => {
    render(<IntegrationSurfaceScreen />)
    for (const state of TENANT_STATES) {
      setTenantState(state)
      const expected = !writeAllowed(state, CONFIGURATION_EDIT)
      expect(isInert(button(METADATA)), state).toBe(expected)
      expect(isInert(button(EMAIL_WRITE)), state).toBe(expected)
    }
  })

  it('names the state and the route out when the gate closes', () => {
    render(<IntegrationSurfaceScreen />)
    setTenantState('soft-suspended')
    const reason = statedReason(button(METADATA))
    expect(reason).toMatch(/soft-suspended/)
    expect(reason).toMatch(/configuration edit/i)
    expect(reason).toMatch(/platform support/i)
    expect(reason).toMatch(/write-class table/i)
  })

  it('disables the typed inputs alongside the buttons, so nothing can be half-offered', () => {
    render(<IntegrationSurfaceScreen />)
    expect((screen.getByLabelText(/^Tenant contact email$/) as HTMLInputElement).disabled).toBe(
      false,
    )
    setTenantState('hard-suspended')
    expect((screen.getByLabelText(/^Tenant contact email$/) as HTMLInputElement).disabled).toBe(true)
    expect(
      (screen.getByRole('combobox', { name: 'Single sign-on protocol' }) as HTMLSelectElement)
        .disabled,
    ).toBe(true)
  })
})

describe('MOD-DOH-12 — connection loss splits three ways (D7)', () => {
  it('disables every write while the connection is lost, and never queues one', () => {
    render(<IntegrationSurfaceScreen />)
    for (const state of CONNECTION_LOSS_STATES) {
      setScreenState(state)
      for (const name of [METADATA, EMAIL_WRITE, TEST_CONNECTION]) {
        const control = button(name)
        expect(isInert(control), `${state} ${String(name)}`).toBe(true)
        expect(statedReason(control)).toMatch(/disable rather than queue/i)
      }
    }
  })

  it('STATE-08 keeps the loaded record with a freshness marker and an as-of time', () => {
    render(<IntegrationSurfaceScreen />)
    setScreenState('STATE-08')
    expect((region('Screen state').textContent ?? '')).toContain(
      SEEDED_SSO_CONNECTION.configuredAsOfLabel,
    )
    expect(cardText()).toContain(SEEDED_SSO_CONNECTION.tenantContactEmail)
  })

  it('STATE-12 names what failed and whether anything was written', () => {
    render(<IntegrationSurfaceScreen />)
    setScreenState('STATE-12')
    const text = region('Screen state').textContent ?? ''
    expect(text).toMatch(/connection record/i)
    expect(text).toMatch(/Nothing was written/i)
  })

  it('STATE-13 refetches the tenant state before re-enabling either write', () => {
    render(<IntegrationSurfaceScreen />)
    setScreenState('STATE-13')
    expect((region('Screen state').textContent ?? '')).toMatch(/before/i)
  })
})

describe('MOD-DOH-12 — audit is in the same transaction as the action', () => {
  it('says so where a reviewer can read it', () => {
    render(<IntegrationSurfaceScreen />)
    expect(screen.getAllByText(/same transaction/i).length).toBeGreaterThan(0)
  })

  it('says the action did not happen when the metadata write’s audit fails', () => {
    render(<IntegrationSurfaceScreen />)
    fireEvent.click(screen.getByLabelText(/audit-write failure/i))
    setProtocol('saml')
    fireEvent.click(button(METADATA))

    expect(outcomeLiveRegion().textContent ?? '').toMatch(/did not happen/i)
    // The record is exactly as it was: the transaction rolled back with it.
    expect(cardText()).toMatch(/Protocol: OpenID Connect/)
    expect(cardText()).not.toMatch(/Protocol: SAML/)
  })

  it('says the action did not happen when the contact email write’s audit fails, after a real write', () => {
    render(<IntegrationSurfaceScreen />)
    // Mutate something observable FIRST, so "nothing changed" below is a
    // claim about this write and not about a handler that never wrote at all.
    setProtocol('saml')
    fireEvent.click(button(METADATA))
    expect(cardText()).toMatch(/Protocol: SAML/)

    fireEvent.click(screen.getByLabelText(/audit-write failure/i))
    const next = 'someone.else@northfieldfoods.example'
    typeEmail(next)
    fireEvent.click(button(EMAIL_WRITE))

    expect(outcomeLiveRegion().textContent ?? '').toMatch(/did not happen/i)
    expect(cardText()).not.toContain(next)
    expect(cardText()).toContain(SEEDED_SSO_CONNECTION.tenantContactEmail)
    // And the write that DID commit is still committed — a rollback that
    // reached back through an earlier transaction would be a different bug.
    expect(cardText()).toMatch(/Protocol: SAML/)
  })

  it('mounts the announcement’s live region before there is anything to announce', () => {
    render(<IntegrationSurfaceScreen />)
    const live = outcomeLiveRegion()
    expect(live.textContent).toBe('')

    fireEvent.click(screen.getByLabelText(/audit-write failure/i))
    fireEvent.click(button(METADATA))

    // The SAME node now carries the message — so an assistive technology
    // already watching it hears the change.
    expect(outcomeLiveRegion()).toBe(live)
    expect(live.textContent ?? '').toMatch(/did not happen/i)
  })
})

describe('MOD-DOH-12 — an outcome never outlives the fixture it describes', () => {
  it('clears the outcome when the reviewer moves the tenant state under it', () => {
    render(<IntegrationSurfaceScreen />)
    fireEvent.click(button(METADATA))
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/saved in this storyboard/i)
    setTenantState('hard-suspended')
    expect(outcomeLiveRegion().textContent).toBe('')
  })

  it('clears the outcome when the reviewer switches persona', () => {
    render(<IntegrationSurfaceScreen />)
    fireEvent.click(button(METADATA))
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/saved in this storyboard/i)
    viewAs('READONLY_AUDITOR')
    expect(outcomeLiveRegion().textContent).toBe('')
  })

  it('clears the outcome when the reviewer moves the record state under it', () => {
    render(<IntegrationSurfaceScreen />)
    fireEvent.click(button(METADATA))
    setConnectionState('reserved_inert')
    expect(outcomeLiveRegion().textContent).toBe('')
  })
})

describe('MOD-DOH-12 — the empty and inert record states', () => {
  it('renders the empty shape when no connection record is in force', () => {
    render(<IntegrationSurfaceScreen />)
    expect(cardText()).toMatch(/Protocol: OpenID Connect/)
    setConnectionState('not_configured')
    const text = cardText()
    expect(text).not.toMatch(/Protocol: OpenID Connect/)
    expect(text).toMatch(/platform-held credential path/i)
  })

  it('renders STATE-01 and the not-configured record as one answer, never two', () => {
    render(<IntegrationSurfaceScreen />)
    setScreenState('STATE-01')
    // The selector says there is no record; the card must not then show one.
    expect(cardText()).not.toMatch(/Protocol: OpenID Connect/)
    expect((region('Screen state').textContent ?? '')).toMatch(/no connection record in force/i)
  })

  it('names what the reserved-inert state does and does not mean', () => {
    render(<IntegrationSurfaceScreen />)
    setConnectionState('reserved_inert')
    const text = cardText()
    expect(text).toMatch(/Reserved, inert/)
    expect(text).toMatch(/business-system connection point/i)
  })
})

describe('MOD-DOH-12 — absent by rule, the rest of the surface, and the honest panels', () => {
  it('draws no control for any row the source refuses to every role', () => {
    render(<IntegrationSurfaceScreen />)
    const absent = region('Absent by rule')
    expect(within(absent).queryAllByRole('button')).toHaveLength(0)
    for (const item of ABSENT_BY_RULE) {
      expect(within(absent).getAllByText(new RegExp(item.label)).length).toBeGreaterThan(0)
    }
  })

  it('renders deferred scoping absent, never disabled', () => {
    render(<IntegrationSurfaceScreen />)
    const absent = region('Absent by rule')
    expect((absent.textContent ?? '')).toMatch(/cell, job, worker/i)
    expect(within(absent).queryAllByRole('combobox')).toHaveLength(0)
  })

  it('names the rest of the integration surface without offering a control for any of it', () => {
    render(<IntegrationSurfaceScreen />)
    const panel = region('The rest of the integration surface')
    expect(within(panel).queryAllByRole('button')).toHaveLength(0)
    expect(within(panel).queryAllByRole('link')).toHaveLength(0)
    for (const item of OUT_OF_SLICE_INTEGRATIONS) {
      expect(within(panel).getAllByText(new RegExp(item.name)).length).toBeGreaterThan(0)
    }
  })

  it('names its one cross-slice dependency, and that the seam registry has no row for it', () => {
    render(<IntegrationSurfaceScreen />)
    const seam = region('Cross-slice dependency')
    const text = seam.textContent ?? ''
    expect(text).toMatch(/Cross-slice seam — not built here/)
    expect(text).toMatch(/slice 10/)
    expect(text).toMatch(/no row in the shared seam registry/i)
  })

  it('renders the unspecified-in-source panel, item for item', () => {
    render(<IntegrationSurfaceScreen />)
    const panel = region('Unspecified in source')
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item)).toBeDefined()
    }
  })

  it('records the catalogue conflict about who may open this screen', () => {
    render(<IntegrationSurfaceScreen />)
    const panel = region('Unresolved in source')
    const text = panel.textContent ?? ''
    expect(text).toMatch(/catalogues list the Tenant Admin alone/i)
    expect(text).toMatch(/Read-only Auditor/)
  })

  it('renders every decision reference this screen depends on', () => {
    render(<IntegrationSurfaceScreen />)
    for (const decision of DECISIONS_ON_SCREEN) {
      expect(screen.getAllByText(new RegExp(`\\b${decision.ref}\\b`)).length).toBeGreaterThan(0)
    }
  })
})

describe('MOD-DOH-12 — the applicable screen states', () => {
  it('walks every applicable state and names it', () => {
    render(<IntegrationSurfaceScreen />)
    for (const id of APPLICABLE_SCREEN_STATES) {
      setScreenState(id)
      const text = region('Screen state').textContent ?? ''
      expect(text).toContain(id)
      expect(text).toContain(screenState(id).name)
    }
  })

  it('names the states that never render here, each with its reason, and offers none of them', () => {
    render(<IntegrationSurfaceScreen />)
    const panel = region('States that never render here')
    for (const inapplicable of INAPPLICABLE_SCREEN_STATES) {
      expect(within(panel).getAllByText(new RegExp(inapplicable.id)).length).toBeGreaterThan(0)
    }
    const options = within(screen.getByRole('combobox', { name: 'Screen state' })).getAllByRole(
      'option',
    )
    expect(options).toHaveLength(APPLICABLE_SCREEN_STATES.length)
  })
})

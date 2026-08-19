import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { ScreenStateId } from '@/ui/screen-state'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { AtomRegistryScreen, CONSOLE_ROLES, ATOM_FIXTURES, UNSPECIFIED_IN_SOURCE, type SaConsoleRoleToken } from '../../app/super-admin/atom-registry/AtomRegistryScreen'

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

/**
 * All rendered copy, with a separator at every element edge.
 *
 * `document.body.textContent` is the obvious thing to read and it BLINDS a
 * word-boundary gate: it concatenates adjacent text nodes with nothing
 * between them, so a paragraph ending in "verified" followed by a heading
 * beginning "Atoms" reads as "verifiedAtoms" and `\bverified\b` never
 * matches. Proven by planting exactly that violation, which the textContent
 * version of this gate passed. Replacing every tag with a space restores the
 * boundaries; attributes never leak, because they live inside the tags this
 * strips.
 */
function renderedCopy(): string {
  return document.body.innerHTML.replace(/<[^>]*>/g, ' ')
}

function renderAs(role: SaConsoleRoleToken, state?: ScreenStateId) {
  return render(
    <AtomRegistryScreen
      initialRole={role}
      {...(state !== undefined ? { initialScreenState: state } : {})}
    />,
  )
}

/** The visible reason a disabled control names, read the way a screen reader does. */
function reasonTextOf(control: HTMLElement): string {
  const id = control.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

const ROOT: SaConsoleRoleToken = 'ROLE-PLAT-ROOT'
const ADMIN: SaConsoleRoleToken = 'ROLE-PLAT-ADMIN'
const ENG: SaConsoleRoleToken = 'ROLE-PLAT-ENG'
const SUP: SaConsoleRoleToken = 'ROLE-PLAT-SUP'

const FAILING_ATOM = ATOM_FIXTURES.find((a) => a.evalVerdict === 'failing')
const PASSING_ATOM = ATOM_FIXTURES.find((a) => a.evalVerdict === 'passing')

describe('MOD-SA-02 Atom Registry — the console shell contract', () => {
  it('renders under the console shell with the module id and band as annotations, one h1', () => {
    renderAs(ROOT)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe('Atom Registry')
    expect(screen.getAllByText(/MOD-SA-02/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Definition layer/).length).toBeGreaterThan(0)
  })

  it('carries the prototype disclosure', () => {
    renderAs(ROOT)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('keeps every SCR-SA number an annotation, never a route key (D1)', () => {
    renderAs(ROOT)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })
})

describe('MOD-SA-02 — atom creation is ABSENT for every account including the root', () => {
  it.each(CONSOLE_ROLES.map((r) => r.token))('offers no create control to %s', (token) => {
    renderAs(token)
    expect(screen.queryAllByRole('button', { name: /create|register a new atom|add atom/i })).toHaveLength(0)
    expect(screen.queryAllByRole('link', { name: /create|register a new atom|add atom/i })).toHaveLength(0)
    expect(screen.queryAllByRole('textbox', { name: /new atom/i })).toHaveLength(0)
  })

  it('draws the one-line note where the control would be', () => {
    renderAs(ROOT)
    expect(screen.getByText(/Atoms arrive by backend migration/i)).toBeDefined()
  })
})

describe('MOD-SA-02 — every affordance is driven by per-control allowed roles', () => {
  it.each(CONSOLE_ROLES.map((r) => r.token))('gives %s read of the registry', (token) => {
    renderAs(token)
    for (const atom of ATOM_FIXTURES) {
      expect(screen.getAllByText(atom.id).length).toBeGreaterThan(0)
    }
  })

  it.each([ENG, ROOT])('lets %s submit a platform enablement change', (token) => {
    renderAs(token)
    const control = screen.getByRole('button', { name: 'Submit platform enablement change' })
    expect(control.getAttribute('aria-disabled')).toBeNull()
  })

  it.each([ADMIN, SUP])('draws the platform enablement control disabled, with a named reason, for %s', (token) => {
    renderAs(token)
    const control = screen.getByRole('button', { name: 'Submit platform enablement change' })
    expect(control.getAttribute('aria-disabled')).toBe('true')
    const reasonId = control.getAttribute('aria-describedby')
    expect(reasonId).not.toBeNull()
    expect(document.getElementById(reasonId ?? '')?.textContent ?? '').not.toBe('')
  })

  it('honours the source-stated split on tenant enablement: Admin disabled, Support absent', () => {
    const admin = renderAs(ADMIN)
    const adminControl = screen.getByRole('button', { name: 'Submit tenant enablement change' })
    expect(adminControl.getAttribute('aria-disabled')).toBe('true')
    admin.unmount()

    renderAs(SUP)
    expect(screen.queryByRole('button', { name: 'Submit tenant enablement change' })).toBeNull()
    expect(screen.getByText(/not part of the Support role’s view of this registry/i)).toBeDefined()
  })

  it('offers "Run the evaluation scenarios" to the Platform Engineer alone, disabled with a reason elsewhere', () => {
    const eng = renderAs(ENG)
    expect(
      screen.getByRole('button', { name: 'Run the evaluation scenarios' }).getAttribute('aria-disabled'),
    ).toBeNull()
    eng.unmount()
    for (const token of [ROOT, ADMIN, SUP] as const) {
      const r = renderAs(token)
      expect(
        screen.getByRole('button', { name: 'Run the evaluation scenarios' }).getAttribute('aria-disabled'),
        token,
      ).toBe('true')
      r.unmount()
    }
  })

  it.each(CONSOLE_ROLES.map((r) => r.token))(
    'draws "Enable directly" and "Approve your own submission" disabled for %s, with the source’s own reasons',
    (token) => {
      renderAs(token)
      const direct = screen.getByRole('button', { name: 'Enable directly' })
      expect(direct.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(direct)).toMatch(/submitted and approved by an Admin/i)
      const selfApprove = screen.getByRole('button', { name: 'Approve your own submission' })
      expect(selfApprove.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(selfApprove)).toMatch(/never the maker/i)
    },
  )
})

describe('MOD-SA-02 — the evaluation gate', () => {
  it('offers no enablement control at all, to any role including the root, while a scenario fails', () => {
    expect(FAILING_ATOM).toBeDefined()
    for (const token of CONSOLE_ROLES.map((r) => r.token)) {
      const r = renderAs(token)
      fireEvent.click(screen.getByRole('button', { name: `Open ${FAILING_ATOM?.id ?? ''}` }))
      expect(screen.queryByRole('button', { name: 'Submit platform enablement change' }), token).toBeNull()
      expect(screen.queryByRole('button', { name: 'Submit tenant enablement change' }), token).toBeNull()
      expect(screen.getByText(/not offered at all while a scenario/i)).toBeDefined()
      r.unmount()
    }
  })

  it('renders the evaluation-gate invariant as a status chip, never as a control', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /enforced invariant/i })
    expect(within(region).queryByRole('button')).toBeNull()
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(within(region).getByText(/ENFORCED/)).toBeDefined()
  })
})

describe('MOD-SA-02 — the trace viewer', () => {
  it.each(CONSOLE_ROLES.map((r) => r.token))('draws no trace-viewer control for %s, and states why (D9)', (token) => {
    renderAs(token)
    expect(screen.queryByRole('button', { name: /trace viewer/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /trace viewer/i })).toBeNull()
    expect(screen.getByText(/No trace-viewer screen exists at V1/i)).toBeDefined()
  })
})

describe('MOD-SA-02 — the twelve applicable screen states', () => {
  it('offers exactly the twelve applicable states, and never the frontline-only STATE-07', () => {
    expect(SA_APPLICABLE_STATES).toHaveLength(12)
    expect(SA_APPLICABLE_STATES.map((s) => s.id)).not.toContain('STATE-07')
  })

  it.each(SA_APPLICABLE_STATES.map((s) => s.id))('renders %s without throwing', (id) => {
    const r = renderAs(ROOT, id)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    r.unmount()
  })

  it('STATE-11: with every artificial-intelligence model unavailable the module remains operable (AC-SA-000-09)', () => {
    renderAs(ENG, 'STATE-11')
    expect(screen.getByText(/AI assistance unavailable/i)).toBeDefined()
    // The registry still reads...
    for (const atom of ATOM_FIXTURES) {
      expect(screen.getAllByText(atom.id).length).toBeGreaterThan(0)
    }
    // ...its filters still act...
    const statusFilter = screen.getByLabelText(/Filter by status/i)
    fireEvent.change(statusFilter, { target: { value: 'disabled' } })
    // One header row and exactly the one disabled atom — the filter really filtered.
    expect(screen.getAllByRole('row')).toHaveLength(2)
    fireEvent.change(statusFilter, { target: { value: 'all' } })
    expect(screen.getAllByRole('row')).toHaveLength(ATOM_FIXTURES.length + 1)
    // ...and the enablement change can still be submitted.
    fireEvent.click(screen.getByRole('button', { name: `Open ${PASSING_ATOM?.id ?? ''}` }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit platform enablement change' }))
    expect(screen.getByText(/Submitted for Admin approval/i)).toBeDefined()
  })
})

describe('MOD-SA-02 — the registry aggregate', () => {
  it.each(SA_APPLICABLE_STATES.map((s) => s.id))(
    'renders an as-of timestamp or an explicit degradation in %s — never zero, never blank',
    (id) => {
      const r = renderAs(ROOT, id)
      const region = screen.getByRole('region', { name: /registry aggregate/i })
      const text = region.textContent ?? ''
      expect(text.trim(), id).not.toBe('')
      expect(text, id).not.toMatch(/\b0\b/)
      expect(text, id).toMatch(/as of|Unavailable|Not yet read/i)
      r.unmount()
    },
  )

  // STATE-01 says the registry holds nothing; the aggregate reads the same
  // registry. A count of the fixture rows beside the empty state asserts a
  // populated registry and an empty one on one screen. The loop above cannot
  // catch it: `7 atoms · as of …` satisfies every clause of it.
  it('STATE-01: the aggregate says the same thing the empty state says — no count, and no number nought', () => {
    renderAs(ROOT, 'STATE-01')
    const region = screen.getByRole('region', { name: /registry aggregate/i })
    const text = region.textContent ?? ''
    expect(text).toMatch(/No atoms are registered yet/i)
    expect(text).toMatch(/as of/i)
    expect(text).not.toMatch(/\b\d+ atoms\b/)
    // The per-state breakdown asserts populated rows just as loudly as a total.
    for (const atom of ATOM_FIXTURES) {
      expect(text, atom.state).not.toMatch(new RegExp(`${atom.state}: \\d`, 'i'))
    }
    // ...and the empty state itself still renders, so this is agreement, not silence.
    expect(screen.getByText(/No interface path creates one, for any account/i)).toBeDefined()
  })

  it('degrades to stale-with-age under STATE-08 and to unavailable under STATE-12', () => {
    const stale = renderAs(ROOT, 'STATE-08')
    expect(
      within(screen.getByRole('region', { name: /registry aggregate/i })).getByText(/stale/i),
    ).toBeDefined()
    stale.unmount()
    renderAs(ROOT, 'STATE-12')
    expect(
      within(screen.getByRole('region', { name: /registry aggregate/i })).getByText(/Unavailable/i),
    ).toBeDefined()
  })
})

describe('MOD-SA-02 — no ambient browsing', () => {
  // Every atom is opened, not just the one selected by default: the atom
  // that actually carries per-tenant enablement is NOT the default
  // selection, so a version of this test that only read the opening view
  // passed with a planted `/tenants/TENANT-FIXTURE-A/atoms` link sitting on
  // the detail of another atom. Proven by planting exactly that.
  it('resolves no link to record-level tenant content, on any atom’s detail', () => {
    renderAs(ROOT)
    for (const atom of ATOM_FIXTURES) {
      fireEvent.click(screen.getByRole('button', { name: `Open ${atom.id}` }))
      const links = screen.getAllByRole('link')
      expect(links.length, atom.id).toBeGreaterThan(0)
      for (const link of links) {
        const href = link.getAttribute('href') ?? ''
        expect(href, `${atom.id} → ${href}`).toMatch(/^\/super-admin\//)
        expect(href, `${atom.id} → ${href}`).not.toMatch(/tenant/i)
      }
    }
  })

  it('shows the atom that carries per-tenant enablement as tokens, never as links', () => {
    const withTenants = ATOM_FIXTURES.find((a) => a.tenantsEnabled.length > 0)
    expect(withTenants).toBeDefined()
    renderAs(ROOT)
    fireEvent.click(screen.getByRole('button', { name: `Open ${withTenants?.id ?? ''}` }))
    for (const tenant of withTenants?.tenantsEnabled ?? []) {
      const node = screen.getByText(tenant)
      expect(node.closest('a'), tenant).toBeNull()
    }
  })

  it('states that a tenant’s records are reachable only inside a named access session', () => {
    renderAs(ROOT)
    expect(screen.getByText(/named access session/i)).toBeDefined()
  })
})

describe('MOD-SA-02 — submission never reads as application', () => {
  it('shows "Submitted for Admin approval" with a request identifier, never "Applied" or "Saved"', () => {
    renderAs(ENG)
    fireEvent.click(screen.getByRole('button', { name: 'Submit platform enablement change' }))
    const message = screen.getByRole('status').textContent ?? ''
    expect(message).toMatch(/Submitted for Admin approval/i)
    expect(message).toMatch(/[A-Z]+-[A-Z]+-FIXTURE-\d+/)
    expect(message).not.toMatch(/\bapplied\b|\bsaved\b/i)
  })

  // A receipt is true of one role, one atom and one screen state. Carried
  // across a switcher it becomes a claim about a context that never produced
  // it — at worst a submission receipt sitting beside the very notice saying
  // the control is offered to nobody in this state.
  function submitAs(token: SaConsoleRoleToken) {
    renderAs(token)
    fireEvent.click(screen.getByRole('button', { name: 'Submit platform enablement change' }))
    expect(screen.getByRole('status').textContent ?? '').toMatch(/Submitted for Admin approval/i)
  }

  it('drops the receipt when the console role changes', () => {
    submitAs(ENG)
    fireEvent.change(screen.getByLabelText(/view as platform role/i), { target: { value: SUP } })
    expect(screen.queryAllByRole('status')).toHaveLength(0)
    // The role that cannot submit is not shown a receipt for a submission.
    expect(screen.queryByText(/Submitted for Admin approval/i)).toBeNull()
  })

  it('drops the receipt when another atom is opened', () => {
    submitAs(ENG)
    fireEvent.click(screen.getByRole('button', { name: `Open ${FAILING_ATOM?.id ?? ''}` }))
    // The gate's ABSENT notice and a submission receipt may never share a view.
    expect(screen.getByText(/not offered at all while a scenario/i)).toBeDefined()
    expect(screen.queryAllByRole('status')).toHaveLength(0)
    expect(screen.queryByText(/Submitted for Admin approval/i)).toBeNull()
  })

  it('drops the receipt when the screen state changes', () => {
    submitAs(ENG)
    fireEvent.change(screen.getByLabelText(/Screen state/i), { target: { value: 'STATE-06' } })
    // STATE-06 draws its own role="status" read-only banner, so the receipt is
    // read out by its copy: one banner, one cause, and no stale receipt beside it.
    for (const status of screen.queryAllByRole('status')) {
      expect(status.textContent ?? '').not.toMatch(/Submitted for Admin approval/i)
    }
    expect(screen.queryByText(/Submitted for Admin approval/i)).toBeNull()
  })
})

describe('MOD-SA-02 — what the source does not define', () => {
  it('names each missing affordance in an explicit panel', () => {
    renderAs(ROOT)
    const panel = screen.getByRole('region', { name: /unspecified in source/i })
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const entry of UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(entry.what)).toBeDefined()
    }
  })
})

describe('MOD-SA-02 — forbidden copy', () => {
  it.each(CONSOLE_ROLES.map((r) => r.token))('uses none of the four forbidden words for %s', (token) => {
    const r = renderAs(token)
    expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
    r.unmount()
  })

  it.each(SA_APPLICABLE_STATES.map((s) => s.id))('uses none of the four forbidden words in %s', (id) => {
    const r = renderAs(SUP, id)
    expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
    r.unmount()
  })

  it('renders no rate, no per-worker series and no metric below tenant-month', () => {
    renderAs(ROOT)
    const text = renderedCopy()
    expect(text).not.toMatch(/per worker|per-worker|worker[- ]shift/i)
    expect(text).not.toMatch(/\bper (hour|minute|second|day)\b/i)
  })
})

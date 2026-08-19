import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SCREEN_STATES } from '@/ui/screen-state'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import {
  MemoryArchitectureScreen,
  MEMORY_STORES,
  SA_04_ABSENT_ACTIONS,
  SA_04_ROLE_VIEWS,
  SA_04_UNSPECIFIED_AFFORDANCES,
  SA_04_INVARIANT_IDS,
} from '../../app/super-admin/memory-architecture/MemoryArchitectureScreen'

const MODULE = saModuleById('MOD-SA-04')
const ROLE_SELECT = /console role/i
const STATE_SELECT = /screen state/i

async function selectRole(role: string) {
  await userEvent.selectOptions(screen.getByRole('combobox', { name: ROLE_SELECT }), role)
}

async function selectState(state: string) {
  await userEvent.selectOptions(screen.getByRole('combobox', { name: STATE_SELECT }), state)
}

describe('MOD-SA-04 Memory Architecture — the shell contract', () => {
  it('renders under the console shell with its band and module id as an annotation', () => {
    render(<MemoryArchitectureScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(MODULE.name)
    expect(screen.getByText(new RegExp(`${MODULE.id}.*Definition layer`))).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<MemoryArchitectureScreen />)
    expect(screen.getAllByText(/Simulated behaviour only/i).length).toBeGreaterThan(0)
  })

  it('annotates the source screen numbers without keying a route on one', () => {
    const { container } = render(<MemoryArchitectureScreen />)
    for (const link of container.querySelectorAll('a')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })
})

describe('MOD-SA-04 — the five typed memory stores, read-only', () => {
  it('renders a policy card for each of the five typed stores', () => {
    render(<MemoryArchitectureScreen />)
    expect(MEMORY_STORES).toHaveLength(5)
    for (const store of MEMORY_STORES) {
      const card = screen.getByRole('region', { name: new RegExp(store.name, 'i') })
      expect(within(card).getByText(store.purpose)).toBeDefined()
      expect(card.textContent, store.id).toContain(store.writer)
    }
  })

  it('states the per-type retention default as unspecified rather than inventing a number', () => {
    render(<MemoryArchitectureScreen />)
    for (const store of MEMORY_STORES) {
      const card = screen.getByRole('region', { name: new RegExp(store.name, 'i') })
      expect(card.textContent, store.id).toMatch(/Retention default: Unspecified in source/)
    }
  })

  it('offers no control on any store card — the source defines none', () => {
    const { container } = render(<MemoryArchitectureScreen />)
    for (const store of MEMORY_STORES) {
      const card = screen.getByRole('region', { name: new RegExp(store.name, 'i') })
      expect(card.querySelector('button'), store.id).toBeNull()
      expect(card.querySelector('input'), store.id).toBeNull()
      expect(card.querySelector('select'), store.id).toBeNull()
      expect(card.querySelector('[role=switch]'), store.id).toBeNull()
    }
    // The whole screen carries exactly the two storyboard view-switchers and
    // nothing else that can be pressed.
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(container.querySelectorAll('[role=switch]')).toHaveLength(0)
    expect(container.querySelectorAll('select')).toHaveLength(2)
  })
})

describe('MOD-SA-04 — the invariants are status chips, never controls', () => {
  it('renders the encryption and anonymisation invariants without any control', () => {
    render(<MemoryArchitectureScreen />)
    const region = screen.getByRole('region', { name: /enforced platform invariants/i })
    // The named invariants this module must render (census §(a), L103982) —
    // stated here rather than read from SA_04_INVARIANT_IDS, so that dropping
    // one from the module fails this test instead of shrinking its subject.
    for (const id of [
      'encryption-at-rest',
      'encryption-in-transit',
      'cross-tenant-analytics-anonymisation',
    ] as const) {
      expect(SA_04_INVARIANT_IDS, id).toContain(id)
      const invariant = SA_INVARIANTS.find((i) => i.id === id)
      expect(invariant, id).toBeDefined()
      expect(within(region).getByText(`${invariant?.name ?? id} — ENFORCED`), id).toBeDefined()
    }
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(region.textContent).toContain('ENFORCED')
  })
})

describe('MOD-SA-04 — prohibitions rendered by rule', () => {
  it('renders every ABSENT action as a note for every console role, including the root', async () => {
    render(<MemoryArchitectureScreen />)
    for (const role of SA_04_ROLE_VIEWS) {
      await selectRole(role.id)
      const region = screen.getByRole('region', { name: /actions that exist for no account/i })
      for (const action of SA_04_ABSENT_ACTIONS) {
        expect(region.textContent, `${role.id} / ${action.id}`).toContain(action.note)
      }
      expect(region.querySelector('button'), role.id).toBeNull()
    }
  })

  it('reads tenant memory content as unavailable — counts and volume only — for every role', async () => {
    render(<MemoryArchitectureScreen />)
    for (const role of SA_04_ROLE_VIEWS) {
      await selectRole(role.id)
      expect(
        screen.getAllByText(/Unavailable — counts and volume only/).length,
        role.id,
      ).toBeGreaterThan(0)
    }
  })

  it('replaces the retention action bar with the critical-class badge for every non-root role', async () => {
    render(<MemoryArchitectureScreen />)
    for (const role of SA_04_ROLE_VIEWS.filter((r) => r.id !== 'ROLE-PLAT-ROOT')) {
      await selectRole(role.id)
      const bar = screen.getByRole('region', { name: /retention-value changes/i })
      expect(within(bar).getByText(/Critical class — root approval required/), role.id).toBeDefined()
      expect(bar.querySelector('button'), role.id).toBeNull()
    }
  })

  it('shows the root no class badge, and no retention control either — the source defines none', async () => {
    render(<MemoryArchitectureScreen />)
    await selectRole('ROLE-PLAT-ROOT')
    const bar = screen.getByRole('region', { name: /retention-value changes/i })
    expect(bar.textContent).not.toContain('Critical class — root approval required')
    expect(bar.textContent).toMatch(/no control .* is defined in the source/i)
    expect(bar.querySelector('button')).toBeNull()
  })
})

describe('MOD-SA-04 — the unspecified-in-source panel', () => {
  it('names each missing affordance instead of inventing a control', () => {
    render(<MemoryArchitectureScreen />)
    const panel = screen.getByRole('region', { name: /unspecified in source/i })
    expect(SA_04_UNSPECIFIED_AFFORDANCES).toHaveLength(4)
    for (const gap of SA_04_UNSPECIFIED_AFFORDANCES) {
      expect(panel.textContent, gap.id).toContain(gap.name)
      expect(panel.textContent, gap.id).toContain(gap.note)
    }
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
  })
})

describe('MOD-SA-04 — the cross-tenant footprint aggregate', () => {
  it('renders an as-of timestamp, and never a zero or a blank count', () => {
    render(<MemoryArchitectureScreen />)
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    expect(region.textContent).toMatch(/As of \d{4}-\d{2}-\d{2}/)
    for (const cell of region.querySelectorAll('tbody td')) {
      expect(cell.textContent?.trim()).not.toBe('')
      expect(cell.textContent?.trim()).not.toBe('0')
    }
  })

  it('degrades to stale-with-age under STATE-08, never to a zero', async () => {
    render(<MemoryArchitectureScreen />)
    await selectState('STATE-08')
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    expect(region.textContent).toMatch(/days old/i)
    for (const cell of region.querySelectorAll('tbody td')) {
      expect(cell.textContent?.trim()).not.toBe('0')
      expect(cell.textContent?.trim()).not.toBe('')
    }
  })

  it('degrades to unavailable under STATE-12, never to a zero and never to a blank', async () => {
    render(<MemoryArchitectureScreen />)
    await selectState('STATE-12')
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    for (const cell of region.querySelectorAll('tbody td')) {
      const text = cell.textContent?.trim() ?? ''
      expect(text).not.toBe('0')
      expect(text).not.toBe('')
    }
    expect(region.textContent).toMatch(/Unavailable/)
  })

  it('refuses the footprint to Support through evaluateAccess, naming the source conflict', async () => {
    render(<MemoryArchitectureScreen />)
    await selectRole('ROLE-PLAT-SUP')
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    expect(region.querySelector('table')).toBeNull()
    expect(region.textContent).toMatch(/explicit denial/i)
    expect(region.textContent).toMatch(/L97155/)
    expect(region.textContent).toMatch(/L87560/)
  })

  it('renders no tenant row, and no measure finer than the platform aggregate', () => {
    render(<MemoryArchitectureScreen />)
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    const table = region.querySelector('table')
    expect(table).not.toBeNull()

    // The table carries exactly three columns — no tenant dimension.
    const headers = [...(table?.querySelectorAll('thead th') ?? [])].map((th) =>
      th.textContent?.trim(),
    )
    expect(headers).toEqual(['Store', 'Records', 'Volume'])

    // And exactly one row per typed store, keyed on the store name — no
    // tenant-grain row, and no tenant identifier anywhere in the cells.
    const rows = [...(table?.querySelectorAll('tbody tr') ?? [])]
    expect(rows.map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(
      MEMORY_STORES.map((s) => s.name),
    )
    for (const cell of table?.querySelectorAll('td') ?? []) {
      expect(cell.textContent ?? '', 'tenant grain in a cell').not.toMatch(/TEN-|tenant/i)
    }

    expect(region.textContent).not.toMatch(/\brate\b/i)
    expect(region.textContent).not.toMatch(/per shift|per site|per hour|per day/i)
  })

  it('never renders the recovering aggregate as current under STATE-13', async () => {
    render(<MemoryArchitectureScreen />)
    await selectState('STATE-13')
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    expect(region.textContent).toMatch(/Recovering/)
    // The banner says the counts remain marked Unavailable, so they must be.
    for (const cell of region.querySelectorAll('tbody td:not(:first-child)')) {
      expect(cell.textContent?.trim()).toBe('Unavailable')
    }
    expect(region.querySelector('caption')?.textContent).not.toMatch(/As of \d{4}-\d{2}-\d{2}/)
  })
})

describe('MOD-SA-04 — the twelve applicable screen states', () => {
  const applicable = SCREEN_STATES.filter((s) => !s.frontlineOnly)

  it('offers exactly the twelve applicable states, and never the frontline-only STATE-07', () => {
    render(<MemoryArchitectureScreen />)
    const select = screen.getByRole('combobox', { name: STATE_SELECT })
    const values = [...select.querySelectorAll('option')].map((o) => o.getAttribute('value'))
    expect(values).toHaveLength(12)
    expect(values).toEqual(applicable.map((s) => s.id))
    expect(values).not.toContain('STATE-07')
  })

  it('renders every applicable state without throwing', async () => {
    render(<MemoryArchitectureScreen />)
    for (const state of applicable) {
      await selectState(state.id)
      expect(screen.getByRole('heading', { level: 1 }), state.id).toBeDefined()
    }
  })

  it('AC-SA-000-09: stays operable with every artificial-intelligence model unavailable', async () => {
    render(<MemoryArchitectureScreen />)
    await selectState('STATE-11')
    expect(screen.getByText(/AI assistance unavailable/i)).toBeDefined()
    for (const store of MEMORY_STORES) {
      expect(screen.getByRole('region', { name: new RegExp(store.name, 'i') }), store.id).toBeDefined()
    }
    const region = screen.getByRole('region', { name: /cross-tenant memory footprint/i })
    expect(region.textContent).toMatch(/As of \d{4}-\d{2}-\d{2}/)
    expect(region.querySelector('table')).not.toBeNull()
  })
})

describe('MOD-SA-04 — the no-link rule and the forbidden vocabulary', () => {
  it('resolves no link to record-level tenant content', () => {
    const { container } = render(<MemoryArchitectureScreen />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).toMatch(/^\/super-admin\/(support-access\/?)?$/)
    }
  })

  it('uses none of the four forbidden words in its own copy', () => {
    const { container } = render(<MemoryArchitectureScreen />)
    const text = container.textContent ?? ''
    for (const word of ['tamper-evident', 'chained', 'verified']) {
      expect(text.toLowerCase(), word).not.toContain(word)
    }
    expect(text).not.toMatch(/\bsigned\b/i)
  })
})

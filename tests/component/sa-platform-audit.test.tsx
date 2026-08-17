import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ScreenStateId } from '@/ui/screen-state'
import {
  PlatformAuditScreen,
  CONSOLE_ROLE_VIEWS,
  APPLICABLE_SCREEN_STATES,
  AUDIT_EVENT_CLASSES,
  AUDIT_ENTRY_STATES,
  AUDIT_EXPORT_STATES,
  AUDIT_ENTRIES,
  MODULE_CONTROLS,
  UNSPECIFIED_IN_SOURCE,
  readableClassesFor,
  type SaConsoleRoleToken,
} from '../../app/super-admin/platform-audit/PlatformAuditScreen'

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

/**
 * All rendered copy with a separator at every element edge. `textContent`
 * concatenates adjacent text nodes with nothing between them, which blinds a
 * `\b`-anchored gate at element boundaries; replacing every tag with a space
 * restores them.
 */
function renderedCopy(): string {
  return document.body.innerHTML.replace(/<[^>]*>/g, ' ')
}

function renderAs(role: SaConsoleRoleToken, state?: ScreenStateId) {
  return render(
    <PlatformAuditScreen
      initialRole={role}
      {...(state !== undefined ? { initialScreenState: state } : {})}
    />,
  )
}

/**
 * The first cut of the absence and copy gates scanned only the screen as first
 * painted, and a planted "Edit the export fixture" button survived — because
 * that control exists only after the export flow has been driven. A gate that
 * cannot see what an interaction reveals is not a gate. Every scanning test
 * below drives the export flow to its terminal state first.
 */
function driveEveryRevealedControl(): void {
  for (let i = 0; i < 4; i += 1) {
    // A raw DOM scan, not `screen.queryByRole`: this runs 48 times per
    // scanning test and the accessibility-tree query is the slow path.
    const next = [...document.querySelectorAll('button')].find(
      (b) =>
        /request .*export|advance/i.test(b.textContent ?? '') &&
        b.getAttribute('aria-disabled') !== 'true',
    )
    if (next === undefined) break
    fireEvent.click(next)
  }
}

function reasonTextOf(control: HTMLElement): string {
  const id = control.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

const ROOT: SaConsoleRoleToken = 'ROLE-PLAT-ROOT'
const ADMIN: SaConsoleRoleToken = 'ROLE-PLAT-ADMIN'
const ENG: SaConsoleRoleToken = 'ROLE-PLAT-ENG'
const SUP: SaConsoleRoleToken = 'ROLE-PLAT-SUP'
const ALL_ROLES: readonly SaConsoleRoleToken[] = [ROOT, ADMIN, ENG, SUP]

describe('MOD-SA-18 Platform Audit — the shell contract', () => {
  it('renders under the console shell with module id and band as annotations, one h1', () => {
    renderAs(ROOT)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent ?? '').toContain('Platform Audit')
    expect(renderedCopy()).toMatch(/MOD-SA-18/)
    expect(renderedCopy()).toMatch(/Operations layer/)
  })

  it('keeps every SCR-SA number an annotation, never a route key (D1)', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/SCR-SA-25/)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })

  it('carries the prototype disclosure', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/prototype/i)
  })

  it('uses none of the four forbidden words, for any role in any state (D10)', () => {
    for (const role of ALL_ROLES) {
      for (const state of APPLICABLE_SCREEN_STATES) {
        const view = renderAs(role, state.id)
        driveEveryRevealedControl()
        expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
        view.unmount()
      }
    }
  })

  it('renders each of the twelve applicable states with exactly one h1, never STATE-07', () => {
    expect(APPLICABLE_SCREEN_STATES).toHaveLength(12)
    expect(APPLICABLE_SCREEN_STATES.map((s) => s.id)).not.toContain('STATE-07')
    for (const state of APPLICABLE_SCREEN_STATES) {
      const view = renderAs(ROOT, state.id)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      view.unmount()
    }
  })
})

describe('MOD-SA-18 — the audit entry has exactly one state (D3)', () => {
  it('closes OBJ-SA-AUDITENTRY at committed alone', () => {
    expect(AUDIT_ENTRY_STATES).toEqual(['committed'])
    for (const entry of AUDIT_ENTRIES) expect(entry.state).toBe('committed')
  })

  it('renders no draft, edited, deleted, written or parked state anywhere', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const copy = renderedCopy()
      // The decision record names the rejected vocabularies, so the words may
      // appear inside it. Nothing outside the decision record may use them as
      // a state of a rendered entry.
      for (const cell of screen.getAllByTestId('audit-entry-state')) {
        expect(cell.textContent).toBe('committed')
      }
      expect(copy).toMatch(/no other state exists by construction/i)
      view.unmount()
    }
  })

  it('records D3 and why parked cannot coexist with the one-transaction guarantee', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/parked/i)
    expect(renderedCopy()).toMatch(/FB-SA-03/)
  })
})

describe('MOD-SA-18 — edit and delete are ABSENT, not even greyed (AC-SA-18-04, AC-SEC-701)', () => {
  it('offers no edit or delete control to any role, including the root, in any state', () => {
    for (const role of ALL_ROLES) {
      for (const state of APPLICABLE_SCREEN_STATES) {
        const view = renderAs(role, state.id)
        driveEveryRevealedControl()
        // A raw selector rather than four `queryAllByRole` calls: this runs 48
        // times and the accessibility-tree walk dominates the runtime. The
        // selector is also WIDER than the role queries were — it catches an
        // ARIA-role control on a plain element, which a `role: 'button'` query
        // would find but a `role: 'checkbox'` query would not have.
        const actionable = [
          ...document.querySelectorAll(
            'button, a[href], input, select, [role=button], [role=link], [role=checkbox], [role=switch], [role=menuitem]',
          ),
        ]
        for (const el of actionable) {
          const name = `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`
          expect(name).not.toMatch(/\b(edit|delete|remove|purge|amend|redact)\b/i)
        }
        view.unmount()
      }
    }
  })

  it('renders the ABSENT note where an edit or delete control would sit', () => {
    renderAs(ROOT)
    const notes = screen.getAllByRole('note').map((n) => n.textContent ?? '')
    expect(notes.some((t) => /no edit or delete/i.test(t))).toBe(true)
    expect(notes.some((t) => /AC-SEC-701/.test(t))).toBe(true)
  })
})

describe('MOD-SA-18 — the class filter is data-driven and its count appears nowhere (D4)', () => {
  it('labels the class fixture provisional and cites both conflicting figures by line', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/provisional/i)
    expect(renderedCopy()).toMatch(/L46178/)
    expect(renderedCopy()).toMatch(/L47835/)
  })

  it('never renders a count of event classes, for any role in any state', () => {
    const countShapes =
      /\b(twenty|twenty-two|twenty two|\d+)\s*(named\s+)?(event\s+)?(audit\s+)?classes\b/i
    for (const role of ALL_ROLES) {
      for (const state of APPLICABLE_SCREEN_STATES) {
        const view = renderAs(role, state.id)
        driveEveryRevealedControl()
        expect(renderedCopy()).not.toMatch(countShapes)
        view.unmount()
      }
    }
  })

  it('drives the filter from the fixture, one option per readable class', () => {
    renderAs(ROOT)
    const readable = readableClassesFor('ROOT_SUPER_ADMIN')
    expect(readable.length).toBe(AUDIT_EVENT_CLASSES.length)
    for (const cls of readable) {
      expect(screen.getAllByText(new RegExp(cls.name, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('shows Support only its own session records, never another class (L74224)', () => {
    const readable = readableClassesFor('SUPPORT')
    expect(readable.map((c) => c.id)).toEqual(['support-session'])
    renderAs(SUP)
    for (const cell of screen.getAllByTestId('audit-entry-class')) {
      expect(cell.textContent ?? '').toMatch(/support session/i)
    }
  })

  it('does not guess which classes are "engineering classes" for the Platform Engineer', () => {
    renderAs(ENG)
    expect(renderedCopy()).toMatch(/L74223/)
    expect(renderedCopy()).toMatch(/unspecified/i)
  })
})

describe('MOD-SA-18 — every affordance runs through evaluateAccess (D16)', () => {
  it('covers all four platform roles, and only the four', () => {
    expect(CONSOLE_ROLE_VIEWS.map((r) => r.token)).toEqual([...ALL_ROLES])
    expect(CONSOLE_ROLE_VIEWS.map((r) => r.roleId)).toEqual([
      'ROOT_SUPER_ADMIN',
      'ADMIN',
      'PLATFORM_ENGINEER',
      'SUPPORT',
    ])
  })

  it('gives all four roles the filter control (L46121)', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      expect(screen.getByLabelText(/event class/i)).toBeTruthy()
      expect(screen.getByLabelText(/actor/i)).toBeTruthy()
      expect(screen.getByLabelText(/tenant/i)).toBeTruthy()
      expect(screen.getByLabelText(/object/i)).toBeTruthy()
      expect(screen.getByLabelText(/date range/i)).toBeTruthy()
      view.unmount()
    }
  })

  it('filters the results by event class', () => {
    renderAs(ROOT)
    const before = screen.getAllByTestId('audit-entry-class').length
    fireEvent.change(screen.getByLabelText(/event class/i), {
      target: { value: 'locked-setting-attempt' },
    })
    const after = screen.getAllByTestId('audit-entry-class')
    expect(after.length).toBeLessThan(before)
    for (const cell of after) expect(cell.textContent ?? '').toMatch(/locked setting attempt/i)
  })

  it('offers the export to root and Admin, and DISABLES it with a named reason otherwise', () => {
    for (const role of [ROOT, ADMIN]) {
      const view = renderAs(role)
      const btn = screen.getByRole('button', { name: /request .*export/i })
      expect(btn.getAttribute('aria-disabled')).not.toBe('true')
      view.unmount()
    }
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const btn = screen.getByRole('button', { name: /request .*export/i })
      expect(btn.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(btn)).toMatch(/Root Super Admin|Admin/)
      expect(reasonTextOf(btn)).toMatch(/L46121/)
      view.unmount()
    }
  })

  it('names both source controls and no third invented one', () => {
    expect(MODULE_CONTROLS.map((c) => c.id)).toEqual(['audit-filters', 'class-filtered-export'])
  })
})

describe('MOD-SA-18 — the export object, advanced only on explicit action', () => {
  it('closes OBJ-SA-AUDITEXPORT at requested, generated, delivered', () => {
    expect(AUDIT_EXPORT_STATES).toEqual(['requested', 'generated', 'delivered'])
  })

  it('advances through every state on an explicit click, state name always visible', () => {
    renderAs(ROOT)
    fireEvent.click(screen.getByRole('button', { name: /request .*export/i }))
    expect(screen.getByTestId('export-state').textContent).toBe('requested')
    fireEvent.click(screen.getByRole('button', { name: /advance/i }))
    expect(screen.getByTestId('export-state').textContent).toBe('generated')
    fireEvent.click(screen.getByRole('button', { name: /advance/i }))
    expect(screen.getByTestId('export-state').textContent).toBe('delivered')
    expect(screen.queryByRole('button', { name: /advance/i })).toBeNull()
  })

  it('records the export as its own audit entry, in the same transaction (L46121)', () => {
    renderAs(ROOT)
    const before = screen.getAllByTestId('audit-entry-state').length
    fireEvent.click(screen.getByRole('button', { name: /request .*export/i }))
    expect(screen.getAllByTestId('audit-entry-state').length).toBe(before + 1)
    expect(renderedCopy()).toMatch(/same transaction/i)
  })

  it('offers no export delivery destination field — the source names none', () => {
    renderAs(ROOT)
    expect(screen.queryByLabelText(/destination|endpoint|email|address/i)).toBeNull()
  })
})

describe('MOD-SA-18 — aggregates never render as zero or blank (AC-SA-01-03)', () => {
  it('renders an as-of timestamp on the result aggregate', () => {
    renderAs(ROOT)
    expect(screen.getByTestId('entries-aggregate').textContent ?? '').toMatch(/as of/i)
  })

  it('degrades to stale-with-age under STATE-08, never a zero', () => {
    renderAs(ROOT, 'STATE-08')
    const copy = renderedCopy()
    expect(copy).toMatch(/as of/i)
    expect(copy).toMatch(/\bold\b|\bage\b|\bago\b|hours|minutes/i)
  })

  it('renders unavailable rather than zero when the aggregate cannot be produced', () => {
    renderAs(ROOT, 'STATE-12')
    const agg = screen.queryByTestId('entries-aggregate')
    if (agg !== null) {
      expect(agg.textContent ?? '').not.toMatch(/(^|\D)0(\D|$)/)
      expect(agg.textContent ?? '').toMatch(/unavailable/i)
    }
  })
})

describe('MOD-SA-18 — no link resolves to record-level tenant content (§7)', () => {
  it('routes every tenant reference to the session-request form', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      for (const link of screen.getAllByRole('link')) {
        const href = link.getAttribute('href') ?? ''
        expect(href).toMatch(/^(#|\/super-admin\/)/)
        expect(href).not.toMatch(/tenants?\/[A-Za-z0-9-]+|records?\/|runs?\/|jobs?\//)
      }
      expect(renderedCopy()).toMatch(/session[- ]request/i)
      view.unmount()
    }
  })

  it('offers no control that opens tenant content from an audit row', () => {
    renderAs(ROOT)
    for (const btn of screen.getAllByRole('button')) {
      expect(btn.textContent ?? '').not.toMatch(/\bopen (the )?(record|run|job|object)\b/i)
    }
  })
})

describe('MOD-SA-18 — STATE-11 artificial-intelligence-unavailable (AC-SA-000-09)', () => {
  it('leaves the module fully operable with every model unavailable', () => {
    renderAs(ROOT, 'STATE-11')
    expect(screen.getByLabelText(/event class/i)).toBeTruthy()
    const btn = screen.getByRole('button', { name: /request .*export/i })
    expect(btn.getAttribute('aria-disabled')).not.toBe('true')
    fireEvent.change(screen.getByLabelText(/event class/i), {
      target: { value: 'locked-setting-attempt' },
    })
    expect(screen.getAllByTestId('audit-entry-class').length).toBeGreaterThan(0)
  })

  it('states the unavailability without claiming a deterministic rule is live intelligence', () => {
    renderAs(ROOT, 'STATE-11')
    expect(renderedCopy()).toMatch(/unavailable/i)
  })
})

describe('MOD-SA-18 — the invariant is a status chip, never a control', () => {
  it('renders the one-transaction guarantee with no button, input, switch or tabindex', () => {
    const { container } = renderAs(ROOT)
    const chip = container.querySelector('[data-testid="invariant-chip-region"]')
    expect(chip).not.toBeNull()
    expect(chip?.querySelector('button')).toBeNull()
    expect(chip?.querySelector('input')).toBeNull()
    expect(chip?.querySelector('[role=switch]')).toBeNull()
    expect(chip?.querySelector('[tabindex]')).toBeNull()
  })

  it('cross-references that the guarantee is rendered ENFORCED on Platform Settings', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/MOD-SA-07|Platform Settings/)
    expect(renderedCopy()).toMatch(/AC-SA-18-01/)
  })

  it('states that anonymisation never rewrites an audit row (D11)', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/identity[- ]resolution layer/i)
  })
})

describe('MOD-SA-18 — the unspecified-in-source panel names each gap (D15)', () => {
  it('names the event class list, the enforcement-parity view and the missing criteria', () => {
    renderAs(ROOT)
    const joined = UNSPECIFIED_IN_SOURCE.map((u) => `${u.what} ${u.why}`).join(' ')
    expect(joined).toMatch(/event class list/i)
    expect(joined).toMatch(/SB-RBAC-04/)
    expect(joined).toMatch(/AC-SA-18-03/)
    expect(joined).toMatch(/FUNC-SA-18/)
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(screen.getAllByText(new RegExp(item.what.slice(0, 24), 'i')).length).toBeGreaterThan(0)
    }
  })

  it('invents no control to fill a gap', () => {
    renderAs(ROOT)
    const names = screen.getAllByRole('button').map((b) => b.textContent ?? '')
    for (const n of names) {
      expect(n).not.toMatch(/\b(archive|seal|close|sign|attest|certify)\b/i)
    }
  })
})

describe('MOD-SA-18 — support-not-surveillance holds at the tenant', () => {
  it('renders no rate, no per-worker series and no comparison between people', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const copy = renderedCopy()
      // `\brate\b` deliberately anchored at BOTH ends: an unanchored `rate\b`
      // matches the tail of "generate", which is a word this screen legitimately
      // needs (OBJ-SA-AUDITEXPORT's `generated` state) and which says nothing
      // about a metric. A gate that fires on "generated" is a gate that gets
      // silenced, not one that holds the line at the tenant.
      expect(copy).not.toMatch(/per[- ]worker|per hour|per minute|\/hr|\bper day\b|\brates?\b/i)
      view.unmount()
    }
  })
})

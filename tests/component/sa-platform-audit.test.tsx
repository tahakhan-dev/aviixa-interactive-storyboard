import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ScreenStateId } from '@/ui/screen-state'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { roleById, type RoleId } from '@/domain/roles'
import { cellFromSource } from '@/policy/columns'
import { PlatformAuditScreen, CONSOLE_ROLE_VIEWS, AUDIT_EVENT_CLASSES, AUDIT_ENTRY_STATES, AUDIT_EXPORT_STATES, AUDIT_ENTRIES, MODULE_CONTROLS, TENANT_ACTOR_CELLS, UNSPECIFIED_IN_SOURCE, MODULE_ACCEPTANCE_CRITERIA, acceptanceCriteriaSplit, acceptanceCriteriaSplitSentence, readableClassesFor, type SaConsoleRoleToken } from '../../app/super-admin/platform-audit/PlatformAuditScreen'

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

const NUMBER_WORD =
  'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred'

/**
 * D4: no count of event classes anywhere. The earlier alternation listed only
 * `twenty|twenty-two|twenty two|\d+`, so "eleven classes" — a count of exactly
 * the kind D4 forbids — walked straight through it. Every number word counts,
 * in digits or spelled out, with up to three words of filler ("named event",
 * "provisional") before the noun.
 *
 * The lookbehind is the one exemption: "the three named access classes" is a
 * count of the THREE named access classes, a closed fact of the spec that this
 * screen is required to state, not a count of the event-class fixture whose
 * size the source contradicts itself about.
 */
const COUNT_OF_CLASSES = new RegExp(
  String.raw`\b(?:\d+|(?:${NUMBER_WORD})(?:[- ](?:${NUMBER_WORD}))?)\s+(?:\w+\s+){0,3}(?<!access )classes\b`,
  'i',
)

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
 * Runs `check` on the screen as first painted and again after EVERY click that
 * advances the export flow — requested, generated, delivered.
 *
 * Two earlier cuts of the scanning gates were blind. The first scanned only the
 * first paint, and a planted "Edit the export fixture" button survived. The
 * second drove the flow to its terminal state and scanned once there, which
 * moved the blind spot rather than closing it: anything rendered only while the
 * export is `requested` or `generated` — one click from the root — was still
 * never looked at. Checking at every step is the only shape that holds.
 */
function atEveryExportStep(check: () => void): void {
  check()
  for (let i = 0; i < 4; i += 1) {
    // A raw DOM scan, not `screen.queryByRole`: this runs 48 times per
    // scanning test and the accessibility-tree query is the slow path.
    const next = [...document.querySelectorAll('button')].find(
      (b) =>
        /request .*export|advance/i.test(b.textContent ?? '') &&
        b.getAttribute('aria-disabled') !== 'true',
    )
    if (next === undefined) return
    fireEvent.click(next)
    check()
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
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        atEveryExportStep(() => {
          expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
        })
        view.unmount()
      }
    }
  })

  it('renders each of the twelve applicable states with exactly one h1, never STATE-07', () => {
    expect(SA_APPLICABLE_STATES).toHaveLength(12)
    expect(SA_APPLICABLE_STATES.map((s) => s.id)).not.toContain('STATE-07')
    for (const state of SA_APPLICABLE_STATES) {
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
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        atEveryExportStep(() => {
          // A raw selector rather than four `queryAllByRole` calls: this runs
          // 48 times and the accessibility-tree walk dominates the runtime. The
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
        })
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
    for (const role of ALL_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        atEveryExportStep(() => {
          expect(renderedCopy()).not.toMatch(COUNT_OF_CLASSES)
        })
        view.unmount()
      }
    }
  })

  it('has a count gate with teeth: it catches any spelled-out count, and exempts only the three named access classes', () => {
    for (const planted of [
      'Twenty-two classes are seeded.',
      'eleven classes',
      '22 classes',
      'twenty two named event classes',
      'Three provisional event classes are offered.',
    ]) {
      expect(planted).toMatch(COUNT_OF_CLASSES)
    }
    for (const legitimate of [
      'the three named access classes',
      'Results render with class filters showing only permitted classes',
      'the frozen source gives two irreconcilable figures for the number of named classes',
    ]) {
      expect(legitimate).not.toMatch(COUNT_OF_CLASSES)
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

  it('gives all four roles the filter control, defined at L46121 and granted at L46162', () => {
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
      // SLICE 10, TASK 12v: was `/L46121/`. L46121 is the screen storyboard and
      // names no role at all; the holder of this control is the permission
      // matrix row, L46165, which also gives these two roles `Read-only` — the
      // reason the refusal is DISABLED-with-a-named-reason rather than ABSENT.
      expect(reasonTextOf(btn)).toMatch(/L46165/)
      view.unmount()
    }
  })

  it('never prints a raw role token in the Actor column, including tenant-domain actors', () => {
    renderAs(ROOT)
    const cells = [...document.querySelectorAll('td')].map((c) => c.textContent ?? '')
    const actorCells = cells.filter((t) => /\(.*\)/.test(t))
    expect(actorCells.length).toBeGreaterThan(0)
    for (const t of actorCells) expect(t).not.toMatch(/[A-Z]{2,}_[A-Z_]+/)
    // AUD-BB-000008 is the tenant-domain actor: the row a platform-only role
    // lookup fell through on.
    expect(actorCells.some((t) => /Priya \(Tenant Admin\)/.test(t))).toBe(true)
  })

  it('refuses the export where the screen state refuses every submission (STATE-06, STATE-12)', () => {
    for (const state of ['STATE-06', 'STATE-12'] as const) {
      for (const role of [ROOT, ADMIN]) {
        const view = renderAs(role, state)
        const btn = screen.getByRole('button', { name: /request .*export/i })
        expect(btn.getAttribute('aria-disabled')).toBe('true')
        expect(reasonTextOf(btn)).toMatch(/read-only|cannot be audited/i)
        const before = screen.queryAllByTestId('audit-entry-state').length
        fireEvent.click(btn)
        expect(screen.queryByTestId('export-state')).toBeNull()
        expect(screen.queryAllByTestId('audit-entry-state')).toHaveLength(before)
        view.unmount()
      }
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

  it('never counts records the same screen says do not exist (STATE-01)', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role, 'STATE-01')
      const agg = screen.getByTestId('entries-aggregate').textContent ?? ''
      // The table is empty in STATE-01, so the aggregate may not assert a
      // match count — and it may not be a zero or a blank either.
      expect(screen.queryAllByTestId('audit-entry-state')).toHaveLength(0)
      expect(agg).not.toMatch(/\d+\s*matching/i)
      expect(agg).not.toMatch(/(^|\D)0(\D|$)/)
      expect(agg.trim()).not.toBe('')
      expect(agg).toMatch(/no platform audit entry has been recorded yet/i)
      expect(agg).toMatch(/as of/i)
      view.unmount()
    }
  })

  it('gives ONE cause for the empty log, in the aggregate AND the table, with a filter set (STATE-06 one-cause rule)', () => {
    // The emptiness of STATE-01 is "no record exists", never "no match for the
    // filter". Setting a filter must not make the table print a second, rival
    // cause beside the aggregate's.
    for (const role of ALL_ROLES) {
      const view = renderAs(role, 'STATE-01')
      fireEvent.change(screen.getByLabelText(/event class/i), {
        target: { value: 'support-session' },
      })
      const agg = screen.getByTestId('entries-aggregate').textContent ?? ''
      const copy = renderedCopy()

      // No rival cause is printed anywhere on the screen.
      expect(copy).not.toMatch(/no runs match the current filters/i)
      expect(copy).not.toMatch(/no entry matches the current filter/i)
      // And both renderings name the one cause that is true here.
      expect(agg).toMatch(/no platform audit entry has been recorded yet/i)
      expect(
        copy.match(/no platform audit entry has been recorded yet/gi)?.length ?? 0,
      ).toBeGreaterThanOrEqual(2)
      view.unmount()
    }
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
  it('names the gaps that are real and no longer names three that were not', () => {
    renderAs(ROOT)
    const joined = UNSPECIFIED_IN_SOURCE.map((u) => `${u.what} ${u.why}`).join(' ')
    expect(joined).toMatch(/event class list/i)
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(3)
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(screen.getAllByText(new RegExp(item.what.slice(0, 24), 'i')).length).toBeGreaterThan(0)
    }
    // R5-A01. Three rows here reported source-stated content as unknowable:
    // SB-RBAC-04 (L20953), three of the ten acceptance criteria (L46193) and
    // the nine functionalities (L46175-L46189). All three are built now, so
    // none of the three may return to a panel headed "Unspecified in source".
    expect(joined).not.toMatch(/SB-RBAC-04/)
    expect(joined).not.toMatch(/AC-SA-18-0[379]/)
    expect(joined).not.toMatch(/FUNC-SA-18/)
  })

  it('builds SB-RBAC-04 from L20953 rather than abstaining from it', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    expect(copy).toMatch(/enforcement-parity view/i)
    expect(copy).toMatch(/zero is the only passing value/i)
    expect(copy).toMatch(/by surface and by action identifier/i)
    // "No write control exists on the panel" (L20953), rendered as ABSENT.
    expect(copy).toMatch(/No write control exists on the panel/i)
    // All four console roles read it, and the read goes through the evaluator.
    const parity = screen.getByRole('table', { name: /Who reads the enforcement-parity panel/i })
    expect(within(parity).getAllByText(/^Read —/).length).toBe(CONSOLE_ROLE_VIEWS.length)
    // A non-zero count is release-blocking, not a tolerance (L20878).
    expect(copy).toMatch(/Release-blocking/i)
  })

  it('renders all ten acceptance criteria and all nine functionalities', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    for (let n = 1; n <= 10; n += 1) {
      const id = `AC-SA-18-${String(n).padStart(2, '0')}`
      expect(copy, `${id} is not rendered`).toContain(id)
    }
    for (const id of [
      'FUNC-SA-18-01-A1',
      'FUNC-SA-18-02-A1',
      'FUNC-SA-18-02-A2',
      'FUNC-SA-18-03-A1',
      'FUNC-SA-18-03-A2',
      'FUNC-SA-18-04-A1',
      'FUNC-SA-18-04-A2',
      'FUNC-SA-18-04-A3',
      'FUNC-SA-18-04-A4',
    ]) {
      expect(copy, `${id} is not rendered`).toContain(id)
    }
    // A backend obligation is SAID to be one, with its citation. That is a
    // different statement from the source being silent, and the difference is
    // the whole of R5-A01.
    expect(copy).toMatch(/Backend obligation with no screen/i)
    // Nine functionalities are not nine controls: the source defines two.
    expect(copy).toMatch(/Nine functionalities\s+are not nine controls/i)
  })

  /* ================================================================ *
   * R6-A01 / R6-A03 — THE SPLIT SENTENCE AND THE COLUMN IT COUNTS.
   *
   * The page shipped "Four are borne by this screen, one by omission on
   * purpose, and three are backend obligations" over an array holding
   * six/one/three: four plus one plus three is eight, and a reader totalling
   * the split lost two criteria. It shipped green because the only assertion
   * on the classification column was a SINGLE regex match on "Backend
   * obligation with no screen" -- one occurrence satisfies a claim of three,
   * and would have satisfied a claim of seven. Nothing asserted the sentence
   * at all.
   *
   * Three assertions now hold it, and a change to ONE row's category reds all
   * three: an equality over the whole category map against a named literal
   * list, an equality over the counts, and the rendered sentence checked both
   * for the literal words those counts produce AND for being the derived
   * string rather than a fresh literal.
   * ================================================================ */
  it('classifies every one of the ten criteria, by equality over the whole map', () => {
    expect(
      Object.fromEntries(MODULE_ACCEPTANCE_CRITERIA.map((a) => [a.id, a.category])),
    ).toEqual({
      'AC-SA-18-01': 'backend',
      'AC-SA-18-02': 'this-screen',
      'AC-SA-18-03': 'this-screen',
      'AC-SA-18-04': 'this-screen',
      'AC-SA-18-05': 'this-screen',
      'AC-SA-18-06': 'this-screen',
      'AC-SA-18-07': 'this-screen',
      'AC-SA-18-08': 'backend',
      'AC-SA-18-09': 'backend',
      'AC-SA-18-10': 'by-omission',
    })
  })

  it('counts the split over the array, and the three parts total the whole', () => {
    const split = acceptanceCriteriaSplit()
    expect(split).toEqual({ 'this-screen': 6, 'by-omission': 1, backend: 3, total: 10 })
    // The arithmetic the shipped sentence failed: four plus one plus three is
    // eight, against a table of ten.
    expect(split['this-screen'] + split['by-omission'] + split.backend).toBe(split.total)
    expect(split.total).toBe(MODULE_ACCEPTANCE_CRITERIA.length)
  })

  it('renders the split sentence BUILT from those counts, not a literal beside them', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    // The words the counts produce. A category change moves these.
    expect(copy).toContain(
      'Six are borne by this screen, one by omission on purpose, and three are backend obligations',
    )
    // ...and the page renders the derived string, so the two cannot diverge.
    expect(copy).toContain(acceptanceCriteriaSplitSentence())
    // The eight-for-ten shape, in general: no split in this paragraph may fail
    // to total the table.
    expect(copy).toContain(`All ten, from the source\u2019s own paragraph at L46193.`)
  })

  it('R6-A04: the three backend rows carry three reasons, not one shared clause', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    const backend = MODULE_ACCEPTANCE_CRITERIA.filter((a) => a.category === 'backend')
    expect(backend.map((a) => a.id)).toEqual(['AC-SA-18-01', 'AC-SA-18-08', 'AC-SA-18-09'])
    // Only -01 is an obligation over a write path. -08 is retention and -09 is
    // storage tiering, and both would still have no screen in a build that had
    // a write path -- so the intro may not offer the write-path reason for all
    // three.
    expect(acceptanceCriteriaSplitSentence()).not.toMatch(/write path/i)
    expect(copy).toMatch(/it constrains a write path this prototype does not hold/i)
    expect(copy).toMatch(/no retention control belongs to this module/i)
    expect(copy).toMatch(/a storage-tiering rule with no affordance/i)
  })

  it('R6-A05: the contested figure is disclosed as 2:1, with the criterion on the majority side', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    // The criterion's OWN line must be named, or a reader infers a tie from two
    // cited lines. L46193 and L46178 agree; L47835 is the single dissenter.
    expect(copy).toMatch(/two lines to one, with the criterion on the majority side/i)
    expect(copy).toMatch(/the criterion\u2019s own line \(L46193\)/)
    expect(copy).toMatch(/FUNC-SA-18-02-A1 \(L46178\) state the same figure/)
    expect(copy).toMatch(/only the module matrix row \(L47835\) differs/)
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

/* ==================================================================== *
 * SLICE 10, TASK 12v — THE VERIFICATION GATE OVER SLICE-3 BYTES.
 *
 * This whole screen is slice 3's. Slice 10 verified it rather than rebuilt
 * it, and this block is what keeps the two findings from silently reverting:
 * that the holders of both controls are read from the permission matrix and
 * not from the storyboard line, and that the same audit read existing on two
 * surfaces is disclosed rather than reconciled by widening a filter.
 * ==================================================================== */

const SOURCE_LINES = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

/** The frozen source's line N, 1-indexed as every citation in this tree is. */
function sourceLine(n: number): string {
  const line = SOURCE_LINES[n - 1]
  if (line === undefined) throw new Error(`L${n} is beyond the frozen source`)
  return line
}

/**
 * `MOD-SA-18`'s matrix header, L46160, in column order: the four platform
 * roles, then the Tenant Admin and the Read-only Auditor. Six actors, not five
 * and not the four this console admits — the two tenant-domain columns are the
 * whole reason this module needed verifying.
 */
const MATRIX_ACTORS: readonly RoleId[] = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
  'SUPPORT',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
]

/**
 * One matrix row of the frozen source, actor by actor, parsed with task 1's
 * `cellFromSource` so the nine source tokens are read by the one parser that
 * knows them. NOT a transcription held in this file: a transcription can drift
 * from the source and still agree with itself, which is how a count inferred
 * from a span survives review.
 */
function matrixRow(lineNumber: number): ReadonlyMap<RoleId, string> {
  const parts = sourceLine(lineNumber).split('|')
  // ['', action, ...six actor cells, ''] — a pipe table's leading and trailing
  // delimiters produce an empty first and last field.
  expect(parts).toHaveLength(MATRIX_ACTORS.length + 3)
  return new Map(MATRIX_ACTORS.map((role, i) => [role, cellFromSource(parts[i + 2] ?? '').outcome]))
}

describe('MOD-SA-18 — the two controls hold the roles the MATRIX gives them, not the storyboard', () => {
  it('reads its own matrix header at L46160 and finds six actors, two of them tenant-domain', () => {
    const header = sourceLine(46160)
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s !== '')
    expect(header).toEqual([
      'Action',
      'Root Super Admin',
      'Admin',
      'Platform Engineer',
      'Support',
      'Tenant Admin',
      'Read-only Auditor',
    ])
    expect(MATRIX_ACTORS.filter((r) => roleById(r).domain === 'TENANT')).toEqual([
      'TENANT_ADMIN',
      'READONLY_AUDITOR',
    ])
  })

  it('derives the filter control’s holders from L46162 and they are the four platform columns', () => {
    const row = matrixRow(46162)
    const allowed = MATRIX_ACTORS.filter((r) => row.get(r) === 'allowed')
    expect(allowed).toEqual(['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'])
    const control = MODULE_CONTROLS.find((c) => c.id === 'audit-filters')
    expect(control?.allowedRoles).toEqual(allowed)
    expect(control?.sourceRefs).toContain('L46162')
    // Both tenant columns refuse this read outright, which is why the console
    // holding it is not the same fact as the Hub holding the mirrored-stream read.
    expect(row.get('TENANT_ADMIN')).toBe('explicitlyProhibited')
    expect(row.get('READONLY_AUDITOR')).toBe('explicitlyProhibited')
  })

  it('derives the export control’s holders from L46165 — allowed twice, Read-only twice', () => {
    const row = matrixRow(46165)
    const allowed = MATRIX_ACTORS.filter((r) => row.get(r) === 'allowed')
    expect(allowed).toEqual(['ROOT_SUPER_ADMIN', 'ADMIN'])
    const control = MODULE_CONTROLS.find((c) => c.id === 'class-filtered-export')
    expect(control?.allowedRoles).toEqual(allowed)
    expect(control?.sourceRefs).toContain('L46165')
    expect(row.get('PLATFORM_ENGINEER')).toBe('readOnly')
    expect(row.get('SUPPORT')).toBe('readOnly')
    // The two cells no brief mentioned. `Allowed with conditions`, not `Allowed`:
    // a prefix match reads them as unconditional grants.
    expect(row.get('TENANT_ADMIN')).toBe('allowedWithConditions')
    expect(row.get('READONLY_AUDITOR')).toBe('allowedWithConditions')
  })

  it('is answered by the source rather than by this file: every declared holder is an `allowed` cell', () => {
    const byControl = new Map<string, number>([
      ['audit-filters', 46162],
      ['class-filtered-export', 46165],
    ])
    for (const control of MODULE_CONTROLS) {
      const line = byControl.get(control.id)
      expect(line).toBeDefined()
      const row = matrixRow(line ?? 0)
      for (const role of control.allowedRoles) expect(row.get(role)).toBe('allowed')
    }
  })
})

describe('MOD-SA-18 — the same read on two surfaces, disclosed and not reconciled', () => {
  it('admits four platform roles and no tenant-domain actor, in any state', () => {
    expect(CONSOLE_ROLE_VIEWS).toHaveLength(4)
    for (const view of CONSOLE_ROLE_VIEWS) expect(roleById(view.roleId).domain).toBe('PLATFORM')
    // And the switcher cannot offer one either: every option's value is a token
    // of the four, so no tenant role is selectable on this screen.
    renderAs(ROOT)
    const options = [...document.querySelectorAll('option')].map((o) => o.getAttribute('value'))
    for (const token of CONSOLE_ROLE_VIEWS.map((v) => v.token)) expect(options).toContain(token)
    expect(options).not.toContain('TENANT_ADMIN')
    expect(options).not.toContain('READONLY_AUDITOR')
  })

  it('renders all four tenant-actor cells VERBATIM from the two lines that carry them', () => {
    expect(TENANT_ACTOR_CELLS).toHaveLength(4)
    renderAs(ROOT)
    const copy = renderedCopy()
    for (const cell of TENANT_ACTOR_CELLS) {
      // The cell text is a substring of the source line it cites — the check
      // that catches a paraphrase, an em dash turned into a hyphen, or a
      // typographic apostrophe substituted for the source's own.
      const line = sourceLine(Number(cell.sourceRef.slice(1)))
      expect(line).toContain(cell.cell)
      expect(copy).toContain(cell.cell)
      expect(cell.carriedBy.trim()).not.toBe('')
    }
    // Two on each line, and one of the two on L46163 names the Hub — not both,
    // which is the correction task 1 made to the common brief.
    expect(TENANT_ACTOR_CELLS.filter((c) => c.sourceRef === 'L46163')).toHaveLength(2)
    expect(TENANT_ACTOR_CELLS.filter((c) => c.sourceRef === 'L46165')).toHaveLength(2)
    expect(
      TENANT_ACTOR_CELLS.filter((c) => c.cell.includes('Delivery Operations Hub')),
    ).toHaveLength(1)
  })

  it('states BOTH filter shapes and never that they agree', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    expect(copy).toMatch(/two stages/i)
    expect(copy).toMatch(/L74029/)
    expect(copy).toMatch(/in one:/i)
    expect(copy).toMatch(/L74224/)
    expect(copy).toMatch(/Neither filter is widened/i)
    expect(copy).toMatch(/without a\s+tenant-isolation check|reads without a tenant-isolation check/i)
    // The claim a reader could act on wrongly. If either of these ever appears,
    // this screen is asserting a parity it does not have.
    expect(copy).not.toMatch(/the same filter|filters (?:are|match)|identical (?:filter|scope)/i)
  })

  it('mints no decision identifier and cites the one that already exists', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    expect(copy).toContain('DEC-TACC-001')
    expect(copy).toContain('L23069')
    // Positive control on the pattern itself: it finds DEC-TACC-001, so a
    // second identifier could not hide from it.
    expect(copy.match(/\bDEC-[A-Z]+-\d{3}\b/g)).toEqual(['DEC-TACC-001'])
    expect(copy).not.toMatch(/\bS10-[A-Z]/)
  })
})

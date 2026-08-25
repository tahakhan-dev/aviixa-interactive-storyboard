import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { ScreenStateId } from '@/ui/screen-state'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { JbsAccessScreen, JBS_GRANT_STATES, JBS_GRANTS, RECONCILIATION_CHECKS, CONSOLE_ROLE_VIEWS, UNSPECIFIED_IN_SOURCE, SUBMIT_DERIVATION, ISSUE_IS_ROOT_ONLY, type SaConsoleRoleToken } from '../../app/super-admin/jbs-access/JbsAccessScreen'

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

/**
 * All rendered copy with a separator at every element edge. `textContent`
 * concatenates adjacent text nodes with nothing between them, which blinds
 * a `\b`-anchored gate at element boundaries; replacing every tag with a
 * space restores them. (Same defect and same fix as the MOD-SA-02 suite.)
 */
function renderedCopy(): string {
  return document.body.innerHTML.replace(/<[^>]*>/g, ' ')
}

function renderAs(role: SaConsoleRoleToken, state?: ScreenStateId) {
  return render(
    <JbsAccessScreen
      initialRole={role}
      {...(state !== undefined ? { initialScreenState: state } : {})}
    />,
  )
}

/**
 * The three cells of one rendered grant row, READ FROM THE DOM. Asserting on
 * the fixture object instead would let any placeholder — '—', 'TBD' — satisfy
 * a "shows a time box" property while the table shows none.
 */
interface GrantRowCells {
  readonly scope: string
  readonly timeBox: string
  readonly reason: string
}

function grantRow(id: string): GrantRowCells {
  const table = screen.getByLabelText('JBS access grants')
  const row = within(table)
    .getAllByRole('row')
    .find((r) => within(r).queryAllByRole('cell')[0]?.textContent === id)
  if (row === undefined) throw new Error(`No rendered row for grant ${id}`)
  const cells = within(row)
    .getAllByRole('cell')
    .map((c) => c.textContent ?? '')
  const [, , scope, timeBox, reason] = cells
  if (scope === undefined || timeBox === undefined || reason === undefined) {
    throw new Error(`Grant row ${id} rendered ${cells.length} cells, expected five`)
  }
  return { scope, timeBox, reason }
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

describe('MOD-SA-16 JBS Access — the shell contract', () => {
  it('renders under the console shell with the module id and band as annotations, one h1', () => {
    renderAs(ROOT)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent ?? '').toContain('JBS Access')
    expect(renderedCopy()).toMatch(/MOD-SA-16/)
    expect(renderedCopy()).toMatch(/Operations layer/)
  })

  it('keeps SCR-SA-23 an annotation, never a route key (D1)', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/SCR-SA-23/)
    expect(renderedCopy()).toMatch(/SB-SA-16/)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })

  it('carries the prototype disclosure', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/prototype|storyboard/i)
  })

  it('uses none of the four forbidden words, for any role in any state', () => {
    for (const role of ALL_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
        view.unmount()
      }
    }
  })
})

describe('MOD-SA-16 — the twelve applicable screen states', () => {
  it('offers exactly the twelve applicable states and never the frontline-only STATE-07', () => {
    expect(SA_APPLICABLE_STATES).toHaveLength(12)
    expect(SA_APPLICABLE_STATES.map((s) => s.id)).not.toContain('STATE-07')
  })

  it('renders every applicable state for every role without throwing', () => {
    for (const role of ALL_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
        view.unmount()
      }
    }
  })

  it('STATE-11: with every AI model unavailable the module REMAINS OPERABLE (AC-SA-000-09)', () => {
    renderAs(ROOT, 'STATE-11')
    // The one source-defined control is still exercisable, and it is a real
    // enabled button, not a disabled stand-in.
    const revoke = within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button')
    expect(revoke.getAttribute('aria-disabled')).not.toBe('true')
    expect(renderedCopy()).toMatch(/deterministic|consults no model|no model/i)
  })

  it('STATE-01 is the point of this module: no grant exists and JBS holds nothing', () => {
    renderAs(ROOT, 'STATE-01')
    expect(renderedCopy()).toMatch(/JBS holds nothing|holds no standing access/i)
  })

  it('STATE-06 disables the actions under ONE banner naming ONE cause', () => {
    renderAs(ROOT, 'STATE-06')
    expect(
      screen.queryAllByRole('status').length + screen.queryAllByRole('alert').length,
    ).toBeLessThan(3)
    const revoke = within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button')
    expect(revoke.getAttribute('aria-disabled')).toBe('true')
    expect(reasonTextOf(revoke)).toMatch(/read-only/i)
  })
})

describe('MOD-SA-16 — the reconciliation aggregate (AC-SA-01-03)', () => {
  it('renders an as-of timestamp in the success state', () => {
    renderAs(ROOT)
    const agg = screen.getByLabelText('Grant reconciliation')
    expect(agg.textContent ?? '').toMatch(/as of/i)
  })

  it('degrades to stale WITH ITS AGE, never to zero', () => {
    renderAs(ROOT, 'STATE-08')
    const agg = screen.getByLabelText('Grant reconciliation')
    expect(agg.textContent ?? '').toMatch(/stale/i)
    expect(agg.textContent ?? '').toMatch(/hours old|days old/i)
  })

  it('degrades to unavailable, never to zero and never to blank', () => {
    renderAs(ROOT, 'STATE-12')
    const agg = screen.getByLabelText('Grant reconciliation')
    const text = agg.textContent ?? ''
    expect(text).toMatch(/unavailable/i)
    expect(text.trim().length).toBeGreaterThan(40)
    // The reconciliation counts are exactly the ones a reader would expect to
    // be nought. An unreadable aggregate must NOT borrow that nought.
    expect(text).not.toMatch(/\b0\b/)
  })

  it('renders a not-yet-read placeholder while loading, never the number nought', () => {
    renderAs(ROOT, 'STATE-02')
    const text = screen.getByLabelText('Grant reconciliation').textContent ?? ''
    expect(text).toMatch(/not yet read/i)
    expect(text).not.toMatch(/\b0\b/)
  })

  it('renders a genuine nought as a READ VALUE, distinguished from a placeholder', () => {
    renderAs(ROOT)
    const text = screen.getByLabelText('Grant reconciliation').textContent ?? ''
    // FB-ROLE-027 / FB-ROLE-029: both of these must be zero, and a zero here
    // is a reading, not an absence of one.
    expect(RECONCILIATION_CHECKS.filter((c) => c.mustBeZero).length).toBeGreaterThanOrEqual(2)
    for (const check of RECONCILIATION_CHECKS) expect(text).toContain(check.label)
    expect(text).toMatch(/read value|actually read/i)
  })

  it('holds the line at the tenant: no rate, no per-worker series, no comparison of people', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const copy = renderedCopy()
      expect(copy).not.toMatch(/per worker|per-worker|worker ranking|per hour|per minute|\brate\b/i)
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — no standing access (AC-SA-16-01, AC-SEC-807)', () => {
  it('states that JBS holds no standing access and no default grant exists in any environment', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/no standing access/i)
    expect(renderedCopy()).toMatch(/no default grant exists in any environment/i)
  })

  it('draws no standing-access control for anyone, including the root — ABSENT', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const panel = screen.getByLabelText('Standing access')
      expect(within(panel).queryAllByRole('button')).toHaveLength(0)
      expect(within(panel).queryAllByRole('checkbox')).toHaveLength(0)
      expect(within(panel).queryAllByRole('switch')).toHaveLength(0)
      expect(within(panel).getByRole('note').textContent ?? '').toMatch(/including the root/i)
      view.unmount()
    }
  })

  it('draws no grant-extension control for anyone — an expired grant never extends itself', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const panel = screen.getByLabelText('Expiry and extension')
      expect(within(panel).queryAllByRole('button')).toHaveLength(0)
      expect(within(panel).getByRole('note').textContent ?? '').toMatch(/never extends itself/i)
      view.unmount()
    }
  })

  it('draws no route by which JBS holds the root account (AC-SA-16-06) — ABSENT', () => {
    const view = renderAs(ROOT)
    const panel = screen.getByLabelText('Root custody')
    expect(within(panel).queryAllByRole('button')).toHaveLength(0)
    expect(within(panel).getByRole('note').textContent ?? '').toMatch(/custody/i)
    view.unmount()
  })
})

describe('MOD-SA-16 — OBJ-SA-JBSGRANT, seven states', () => {
  it('carries the seven grant states in the source order and closes the set there', () => {
    expect(JBS_GRANT_STATES).toEqual([
      'drafted',
      'pending approval',
      'issued',
      'active',
      'expired',
      'revoked',
      'reconciled',
    ])
  })

  it('exercises every one of the seven states with a fixture row', () => {
    renderAs(ROOT)
    for (const state of JBS_GRANT_STATES) {
      expect(JBS_GRANTS.some((g) => g.state === state)).toBe(true)
    }
    const table = screen.getByLabelText('JBS access grants')
    for (const grant of JBS_GRANTS) expect(table.textContent ?? '').toContain(grant.id)
  })

  it('shows a scope, a time box and a linked reason on every grant (AC-WF-ROLE-027-01)', () => {
    renderAs(ROOT)
    for (const grant of JBS_GRANTS) {
      const { scope, timeBox, reason } = grantRow(grant.id)
      for (const s of grant.scope) expect(scope).toContain(s)
      // Scope is by named modules or tenant tokens (L45890) — never free text.
      expect(scope).toMatch(/^(MOD-SA-\d\d |TENANT-[A-Z0-9-]+)/)
      if (grant.state === 'drafted') {
        // A draft has declared neither yet: that is the gate at AC-SA-16-02,
        // and the cell must say so and name the gate. A dash or a 'TBD' reads
        // as a declared value that happens to be short, which is the lie.
        expect(timeBox).toMatch(/not yet set .*required before submission .*AC-SA-16-02/)
        expect(reason).toMatch(/not yet linked .*required before submission .*AC-SA-16-02/)
      } else {
        // A declared time box is a bounded period the source itself names:
        // five working days (L45873) or four hours (L55086). Never open-ended.
        expect(timeBox).toMatch(/^(five working days|four hours)$/)
        // A linked reason links a ticket; free text is not a linked reason.
        expect(reason).toMatch(/^TICKET-FIXTURE-\d+ — \S/)
      }
    }
  })
})

describe('MOD-SA-16 — grant drafting is gated on all three (AC-SA-16-02)', () => {
  it('refuses submission until scope, time box and reason are all present', () => {
    renderAs(ADMIN)
    const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
    expect(submit.getAttribute('aria-disabled')).toBe('true')
    const reason = reasonTextOf(submit)
    expect(reason).toMatch(/scope/i)
    expect(reason).toMatch(/time box/i)
    expect(reason).toMatch(/reason/i)
  })

  it('allows submission once all three are declared', () => {
    renderAs(ADMIN)
    fireEvent.click(screen.getByLabelText(/Scope declared/i))
    fireEvent.click(screen.getByLabelText(/Time box declared/i))
    fireEvent.click(screen.getByLabelText(/Reason linked/i))
    const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
    expect(submit.getAttribute('aria-disabled')).not.toBe('true')
    fireEvent.click(submit)
    expect(screen.getByRole('status').textContent ?? '').toMatch(/pending approval/i)
  })

  it('refuses drafting to the Platform Engineer and Support, with a named reason', () => {
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
      expect(submit.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(submit).length).toBeGreaterThan(20)
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — approve and issue is the root’s alone', () => {
  it('gives the root the approve-and-issue control', () => {
    renderAs(ROOT)
    const bar = screen.getByTestId('issue-grant-action-bar')
    expect(within(bar).getByRole('button').getAttribute('aria-disabled')).not.toBe('true')
  })

  it('refuses it to the Admin with a reason that names the open decision, not a resolution', () => {
    renderAs(ADMIN)
    const button = within(screen.getByTestId('issue-grant-action-bar')).getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    const reason = reasonTextOf(button)
    expect(reason).toMatch(/DEC-JBSAUTH-001/)
    // L45914 is the `Approve and issue a grant` permission-matrix row, which
    // reads Explicitly prohibited in the Admin's column. The reason used to
    // cite L44712 for this, which is §8.8's Admin row and says nothing about
    // JBS; the reason and this expectation were corrected together.
    expect(reason).toMatch(/may not approve and issue/i)
    expect(reason).toContain('L45914')
    expect(reason).not.toContain('L44712')
  })

  it('names no JBS action among the eleven critical-class actions, so no class badge is asserted', () => {
    expect(CRITICAL_ACTIONS).toHaveLength(11)
    expect(CRITICAL_ACTIONS.map((a) => a.id)).not.toContain('jbs-grant-issue')
    for (const role of [ADMIN, ENG, SUP]) {
      const view = renderAs(role)
      const bar = screen.getByTestId('issue-grant-action-bar')
      // The class-badge rendering REPLACES the action bar with a StatusPill.
      // A surviving disabled button is therefore proof the badge was not drawn
      // — whatever label it might have carried.
      const buttons = within(bar).getAllByRole('button')
      expect(buttons).toHaveLength(1)
      const button = buttons[0]
      if (button === undefined) throw new Error('no control in the issue action bar')
      expect(button.getAttribute('aria-disabled')).toBe('true')
      // And the badge's own copy (L23707) appears nowhere in the bar: drawing
      // it would settle DEC-JBSAUTH-001 on a screen.
      expect(within(bar).queryByText(/root approval required/i)).toBeNull()
      expect(reasonTextOf(button)).toMatch(/DEC-JBSAUTH-001/)
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — the one control the source defines: revocation (L45871)', () => {
  it('gives revocation to the Root Super Admin and the Admin, taking effect immediately', () => {
    for (const role of [ROOT, ADMIN]) {
      const view = renderAs(role)
      const bar = screen.getByTestId('revoke-grant-action-bar')
      expect(within(bar).getByRole('button').getAttribute('aria-disabled')).not.toBe('true')
      expect(bar.textContent ?? '').toMatch(/immediately/i)
      view.unmount()
    }
  })

  it('refuses revocation to the Platform Engineer and Support with a named reason', () => {
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const button = within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button')
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(button)).toMatch(/Root Super Admin and the Admin|L45871/i)
      view.unmount()
    }
  })

  it('states that revocation leaves no access by any route (WF-ROLE-030)', () => {
    renderAs(ROOT)
    fireEvent.click(within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button'))
    expect(screen.getByRole('status').textContent ?? '').toMatch(/no access by any route/i)
  })
})

describe('MOD-SA-16 — mirroring to both audit streams (L4627)', () => {
  it('names the platform audit stream and the tenant stream with Platform Access History', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    expect(copy).toMatch(/platform audit/i)
    expect(copy).toMatch(/Platform Access History/i)
  })

  it('renders the one-transaction audit guarantee as a chip, never as a control (R2)', () => {
    renderAs(ROOT)
    const section = screen.getByLabelText('The ENFORCED invariant on this screen')
    expect(section.querySelector('button')).toBeNull()
    expect(section.querySelector('input')).toBeNull()
    expect(section.querySelector('[role=switch]')).toBeNull()
    expect(section.querySelector('[tabindex]')).toBeNull()
    const invariant = SA_INVARIANTS.find((i) => i.id === 'one-transaction-audit-guarantee')
    expect(section.textContent ?? '').toContain(invariant?.name ?? 'MISSING')
    expect(section.textContent ?? '').toMatch(/ENFORCED/)
  })
})

describe('MOD-SA-16 — the no-link rule (AC-SA-000-07, AC-SEC-801)', () => {
  it('resolves no link to record-level tenant content, for any role', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      for (const link of screen.getAllByRole('link')) {
        const href = link.getAttribute('href') ?? ''
        expect(href).not.toMatch(/tenant[s]?\/[A-Za-z0-9-]/i)
        expect(href).not.toMatch(/^https?:/)
      }
      view.unmount()
    }
  })

  it('resolves the tenant scope link to this module’s own grant-request form', () => {
    renderAs(ROOT)
    const link = screen.getByTestId('tenant-session-request')
    expect(link.getAttribute('href')).toBe('#request-a-jbs-grant')
    expect(renderedCopy()).toMatch(/no ambient browsing/i)
  })

  it('names every tenant by token only', () => {
    renderAs(ROOT)
    for (const grant of JBS_GRANTS) {
      for (const s of grant.scope) {
        if (s.startsWith('TENANT')) expect(s).toMatch(/^TENANT-[A-Z0-9-]+$/)
      }
    }
  })
})

describe('MOD-SA-16 — every role is shown what it sees when it may not act', () => {
  it('never silently drops a control: each role sees the control or a named refusal', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      for (const testId of [
        'submit-grant-action-bar',
        'issue-grant-action-bar',
        'revoke-grant-action-bar',
      ]) {
        expect(within(screen.getByTestId(testId)).getAllByRole('button').length).toBe(1)
      }
      view.unmount()
    }
  })

  it('gives all four roles read of the grants list (D16)', () => {
    expect(CONSOLE_ROLE_VIEWS.map((r) => r.token)).toEqual([...ALL_ROLES])
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      expect(screen.getByLabelText('JBS access grants').textContent ?? '').toContain(
        JBS_GRANTS[0]?.id ?? 'MISSING',
      )
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — unspecified in source (D15)', () => {
  it('names each missing affordance rather than inventing one', () => {
    renderAs(ROOT)
    const panel = screen.getByLabelText('Unspecified in source')
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThanOrEqual(6)
    for (const entry of UNSPECIFIED_IN_SOURCE) {
      expect(panel.textContent ?? '').toContain(entry.what)
    }
    expect(within(panel).queryAllByRole('button')).toHaveLength(0)
  })

  it('records the three open decisions this module cannot resolve', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    for (const dec of ['DEC-JBSAUTH-001', 'DEC-EMEREND-001', 'DEC-CONSENT-001']) {
      expect(copy).toContain(dec)
    }
  })

  it('records that OBJ-SA-JBSSESSION enumerates no states, and draws none', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/OBJ-SA-JBSSESSION/)
    expect(
      UNSPECIFIED_IN_SOURCE.some((e) => /OBJ-SA-JBSSESSION/.test(e.what) || /OBJ-SA-JBSSESSION/.test(e.detail)),
    ).toBe(true)
  })
})

/* ─────────────────────────────────────────────────────────────────────────
 * MOD-SA-16 — the false-claim gate.
 *
 * This module shipped, on screen, in refusal reasons a user reads: "Workflow
 * 23.16 (L45848) names the Admin as the drafter and the Root Super Admin as
 * the approver, and WF-ROLE-027 (L56166) names the same two." Neither line
 * names either role. Both run every step in the passive. The split came from
 * `registries/raw/extract/CHK-014.json`, whose `primary_actor` field coins it
 * and attaches it to line 45848; a second string cited a "may not: Approve and
 * issue a JBS grant" list to L44712, which is the Admin row of §8.8's
 * four-role table and carries no JBS content at all.
 *
 * WHAT IS SCANNED IS THE STRUCTURE, NOT THE SENTENCE. A gate keyed on the
 * exact spelling of what it forbids passes the moment someone rephrases it.
 * The structure is: one sentence carrying (a) one of the four locators that
 * cannot support a role claim, (b) a console-role name, and (c) a grant act.
 * That is what "attributing a role split to those locators" looks like in any
 * wording. The consequence for an author is a simple rule — say what those
 * lines do NOT contain without naming a role in the same sentence, exactly as
 * the module's own retired-citation notes now do.
 *
 * THE EXPECTATION IS NOT DERIVED FROM THE FIELD UNDER TEST. The premise —
 * that those lines name no role — is asserted against the frozen source,
 * whose sha256 is pinned, not against the screen. Editing the screen cannot
 * make the premise true, and editing the source fails the pin.
 * ───────────────────────────────────────────────────────────────────────── */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const MODULE_DIR = join(process.cwd(), 'app', 'super-admin', 'jbs-access')

/**
 * The four lines the retired claims cited. L45848 is workflow 23.16's
 * chronological paragraph, L56166 the `WF-ROLE-027` heading and L56169 its
 * happy path — all three passive throughout. L44712 is §8.8's Admin row and
 * is about Band B operations, not about JBS.
 */
const MUTE_LINES = [44712, 45848, 56166, 56169] as const
/**
 * The regex is BUILT from that list rather than written beside it. Written
 * twice, the list and the pattern drift: editing one to a line the source pin
 * never checks was tried, and nothing went red.
 */
const MUTE_LOCATORS = new RegExp(`\\bL(?:${MUTE_LINES.join('|')})\\b`)

/**
 * The four console roles, as this surface's copy writes them.
 *
 * `Support` is matched CASE-SENSITIVELY and the other three are not, and that
 * is a finding rather than a convenience: L45848 ends "exactly as a support
 * session does", and a case-blind `\bsupport\b` convicted the very line whose
 * silence this gate exists to pin. The common noun and the role are different
 * words here. `admin`, `platform engineer` and `root super admin` carry no
 * such common-noun sense in this copy, so they stay case-blind and a
 * lowercase rewording of the claim is still caught.
 */
const CONSOLE_ROLE_NAME = /\b(root super admin|super admin|platform engineer|admin|the root)\b/i
const SUPPORT_ROLE = /\bSupport\b/

const namesConsoleRole = (s: string): boolean =>
  CONSOLE_ROLE_NAME.test(s) || SUPPORT_ROLE.test(s)

/** The acts a grant passes through, in any inflection an author would reach for. */
const GRANT_ACT =
  /\b(draft|drafts|drafted|drafter|drafting|submit|submits|submitted|submission|approve|approves|approved|approver|approval|issue|issues|issued|issuing|revoke|revokes|revoked)\b/i

/**
 * Sentences, from text that may be JSX, a template literal or a doc comment.
 * Whitespace is collapsed FIRST so a claim broken across three source lines is
 * still one sentence -- the retired L44712 string was written across three,
 * and splitting on newlines would have cut its locator off its claim and let
 * it through. Splitting on `[.;:!?]` + whitespace leaves "23.16" and "§8.8"
 * intact, because their dots are followed by a digit.
 */
function sentencesOf(text: string): readonly string[] {
  return text.replace(/\s+/g, ' ').split(/(?<=[.;:!?])\s+/)
}

/** Every sentence that attributes a role's grant act to a line that states none. */
function falseRoleClaims(text: string): readonly string[] {
  return sentencesOf(text).filter(
    (s) => MUTE_LOCATORS.test(s) && namesConsoleRole(s) && GRANT_ACT.test(s),
  )
}

const moduleText = readdirSync(MODULE_DIR)
  .filter((f) => /\.tsx?$/.test(f))
  .map((f) => readFileSync(join(MODULE_DIR, f), 'utf8'))
  .join('\n')

describe('MOD-SA-16 — the screen asserts no role split those lines do not state', () => {
  it('pins the premise against the frozen source, not against the screen', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
    const bytes = readFileSync(SOURCE_PATH)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(SOURCE_SHA256)
    const lines = bytes.toString('utf8').split('\n')
    const at = (n: number): string => lines[n - 1] ?? ''

    // ANTI-WEAKENING. Dropping a line from MUTE_LINES silently restores the
    // claim that cited it, and every other assertion here would stay green --
    // tried, and nothing went red. These four are the lines the retired
    // strings cited; the list may grow, never shrink.
    for (const n of [44712, 45848, 56166, 56169]) {
      expect(MUTE_LINES, `L${n} was dropped from the muted set`).toContain(n)
    }

    // Non-vacuity: these are real, non-blank lines being read.
    for (const n of MUTE_LINES) {
      expect(at(n).trim().length, `L${n} is blank`).toBeGreaterThan(20)
    }
    // The workflow lines name no console role at all. L44712 is the one
    // exception and is asserted separately just below: it DOES name roles,
    // and is muted for the other half of the rule -- it says nothing about
    // JBS or about grants, so no grant claim can rest on it either.
    for (const n of MUTE_LINES.filter((n) => n !== 44712)) {
      expect(namesConsoleRole(at(n)), `L${n} does name a console role`).toBe(false)
    }
    // L44712 does name roles -- but says nothing about JBS or about grants.
    expect(namesConsoleRole(at(44712))).toBe(true)
    expect(at(44712)).not.toMatch(/\b(jbs|grant|grants)\b/i)

    // And the lines that DO state the split, which the module now cites.
    expect(at(45913)).toMatch(/Draft a grant \| Allowed \| Allowed \| Unavailable \| Unavailable/)
    expect(at(45914)).toMatch(/Approve and issue a grant \| Allowed \| Explicitly prohibited/)
    expect(at(45925)).toContain('Allowed: root approves and issues; root and Admin revoke')
  })

  it('convicts the retired claim and two rewordings of it', () => {
    // The exact string this module shipped.
    expect(
      falseRoleClaims(
        'Workflow 23.16 (L45848) names the Admin as the drafter and the Root Super Admin as the approver, and WF-ROLE-027 (L56166) names the same two.',
      ),
    ).toHaveLength(1)
    // Reworded until no phrase of the original survives.
    expect(
      falseRoleClaims(
        'Per the JBS grant workflow at L45848, issuing belongs to the root alone once a platform administrator has prepared the request.',
      ),
    ).toHaveLength(1)
    // The second retired claim, written across three source lines as it was.
    expect(
      falseRoleClaims(
        'The roles matrix states it directly: the Admin may not\n              approve and issue a JBS grant\n              (L44712).',
      ),
    ).toHaveLength(1)
  })

  it('acquits the true statements the module now makes, so it is not a blanket ban', () => {
    // A mute locator with no role named: what an honest retirement note reads like.
    expect(
      falseRoleClaims(
        'Workflow 23.16 (L45848) and WF-ROLE-027 (L56166) run every step in the passive and name nobody, so neither is cited for who.',
      ),
    ).toHaveLength(0)
    // A role and a grant act cited to a line that really does state them.
    expect(
      falseRoleClaims(
        'MOD-SA-16’s permission matrix reads "Approve and issue a grant" as Allowed in the Root Super Admin’s column and Explicitly prohibited in every other (L45914).',
      ),
    ).toHaveLength(0)
  })

  it('finds no such claim anywhere in the module’s own files', () => {
    // Non-vacuity: the scan read the module, and the module still cites those
    // lines -- so a passing result is the absence of the claim, not the
    // absence of input.
    expect(moduleText.length).toBeGreaterThan(20_000)
    expect(moduleText).toMatch(MUTE_LOCATORS)
    expect(falseRoleClaims(moduleText)).toEqual([])
  })

  it('finds no such claim in what any of the four roles actually reads', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      const view = renderAs(role.token)
      expect(falseRoleClaims(renderedCopy()), `rendered for ${role.token}`).toEqual([])
      view.unmount()
    }
  })

  it('keeps the reading on screen and names it derived, rather than dropping it', () => {
    // The ruling was that the screen must not assert the split falsely AND
    // must not lose it, so deleting the copy has to be a failure too.
    //
    // THIS ASSERTION WAS WRITTEN WRONG FIRST, AND THE PLANT CAUGHT IT. It
    // began as `expect(copy).toContain('Derived Clarification')` plus
    // `/competing reading/i`, and it PASSED with the entire submit derivation
    // deleted from the screen — because CRITICAL_ACTION_COUNT_NOTE renders on
    // this same screen and contains both phrases. A gate satisfied by another
    // module's copy is a gate that cannot fail. It now asserts the
    // derivation's own words reach the DOM, which nothing else can supply.
    const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

    // What the copy must SAY is pinned here; that the source supports it is
    // pinned separately, above, against the frozen source.
    expect(SUBMIT_DERIVATION).toContain('Derived Clarification')
    expect(SUBMIT_DERIVATION).toContain('L45913')
    expect(SUBMIT_DERIVATION).toContain('L45924')
    expect(SUBMIT_DERIVATION).toMatch(/competing reading/i)
    expect(SUBMIT_DERIVATION.length).toBeGreaterThan(600)
    expect(ISSUE_IS_ROOT_ONLY).toContain('L45914')
    expect(ISSUE_IS_ROOT_ONLY).toContain('L45925')
    expect(ISSUE_IS_ROOT_ONLY).toContain('L45884')

    // The Admin may draft, so its submit refusal reason never renders. The
    // section paragraph is what carries the derivation for that role.
    const admin = renderAs(ADMIN)
    expect(flat(renderedCopy())).toContain(flat(SUBMIT_DERIVATION))
    expect(flat(renderedCopy())).toContain(flat(ISSUE_IS_ROOT_ONLY))
    admin.unmount()

    // And the refused roles read it in the refusal itself.
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
      expect(flat(reasonTextOf(submit)), `submit refusal for ${role}`).toContain(
        flat(SUBMIT_DERIVATION),
      )
      view.unmount()
    }
  })
})

/**
 * R4-01. This screen reported `AC-SA-16-03`, `-04` and `-05` as gaps in the
 * frozen source and abstained; L45938 states all seven criteria, `-07`
 * included, which the disclosure's own run silently dropped as well. Four
 * real criteria, and three of them were already RENDERED here under other
 * citations -- the approval lifecycle, the mirroring section and the expiry
 * section. So this is what the fix had to prove: each criterion cited where
 * the screen carries it, and the gap disclosure gone.
 */
describe('MOD-SA-16 — the four criteria this screen reported as absent', () => {
  function copyOf(regionName: RegExp): string {
    return (screen.getByRole('region', { name: regionName }).textContent ?? '').replace(/\s+/g, ' ')
  }

  it('cites AC-SA-16-03 where the approval lifecycle is rendered', () => {
    const view = renderAs('ROLE-PLAT-ROOT')
    const copy = copyOf(/Approve and issue/i)
    expect(copy).toMatch(/AC-SA-16-03, L45938/)
    expect(copy).toMatch(/approvable object under the change-approval discipline/i)
    // And it must not be read as settling the class, which DEC-JBSAUTH-001
    // leaves open two paragraphs below.
    expect(copy).toMatch(/does NOT settle is the approval CLASS/)
    view.unmount()
  })

  it('cites AC-SA-16-04 and builds AC-SA-16-05 in the mirroring section', () => {
    const view = renderAs('ROLE-PLAT-ROOT')
    const copy = copyOf(/Mirroring/i)
    expect(copy).toMatch(/AC-SA-16-04, L45938/)
    expect(copy).toMatch(/own audit event class and mirrors into affected tenants/i)
    expect(copy).toMatch(/AC-SA-16-05, L45938/)
    // BOTH HALVES, because the criterion is a pair that pulls two ways and
    // half of it rendered alone is the wrong requirement.
    expect(copy).toMatch(/INDISTINGUISHABLE IN VISIBILITY/)
    expect(copy).toMatch(/DISTINGUISHABLE IN CLASS/)
    view.unmount()
  })

  it('cites AC-SA-16-07 where expiry is rendered', () => {
    const view = renderAs('ROLE-PLAT-ROOT')
    const copy = copyOf(/Expiry/i)
    expect(copy).toMatch(/AC-SA-16-07, L45938/)
    expect(copy).toMatch(/expires AUTOMATICALLY at its time box/)
    view.unmount()
  })

  it('no longer tells a reader the source is silent on any of the four', () => {
    const view = renderAs('ROLE-PLAT-ROOT')
    const panel = screen.getByRole('region', { name: /Unspecified in source/i })
    const copy = (panel.textContent ?? '').replace(/\s+/g, ' ')
    expect(copy).not.toMatch(/not represented anywhere this build can read/)
    for (const id of ['AC-SA-16-03', 'AC-SA-16-04', 'AC-SA-16-07']) {
      expect(copy, `${id} must not be named as a gap`).not.toContain(id)
    }
    // -05 is still named here, and truthfully: it constrains a TENANT screen
    // this console does not render, which is a different statement from
    // "the source does not carry it".
    expect(copy).toMatch(/AC-SA-16-05 \(L45938\) constrains a TENANT screen/)
    expect(UNSPECIFIED_IN_SOURCE.every((e) => !/gaps in between/.test(e.detail))).toBe(true)
    view.unmount()
  })
})

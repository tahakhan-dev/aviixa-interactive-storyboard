import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LockedControl } from '@/ui/primitives/LockedControl'
import { LockedControl as LockedControlFromBarrel } from '@/ui/primitives'
import { Button } from '@/ui/primitives/Button'
import { PermissionNotice } from '@/ui/primitives/PermissionNotice'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { allow } from '@/policy/decision'

/**
 * A GATE WHOSE EXPECTED VALUE COMES FROM THE CODE UNDER TEST IS A TAUTOLOGY.
 * Both locked-group wordings are therefore read out of the frozen source at
 * test time. `SB-PREF-01`'s Always-sent explanation is the one double-quoted
 * span on its storyboard line, and the Protected group's refusal-plus-remains
 * pair is the one double-quoted span on the illustrative example's line — so
 * neither string can be moved by editing this repo.
 */
const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

function soleQuotation(line: number): string {
  const quoted = [...(SOURCE[line - 1] ?? '').matchAll(/"([^"]+)"/g)].map((m) => m[1]!)
  // Guards the extraction itself: if the line ever stops carrying exactly one
  // quoted span, this fails loudly instead of silently supplying `undefined`
  // (or the wrong span) as an expected value to every case below.
  expect(quoted, `L${line} should carry exactly one double-quoted span`).toHaveLength(1)
  return quoted[0]!
}

/** `SB-PREF-01`, L73702 — the Always-sent group's inline explanation. */
const ALWAYS_SENT_REASON = soleQuotation(73702)
/** L73704 — the Protected group's refusal and what remains, in one sentence. */
const PROTECTED_SENTENCE = soleQuotation(73704)

/**
 * `AFFORDANCES` is the same predicate `tests/component/doh-cross-surface.
 * test.tsx` uses, and for the same reason: the claim is "nothing a person
 * could act through", not "no `<button>`". A disabled `<button>` counts as a
 * violation here — it is precisely the rendering this component exists to
 * replace, so a check that allowed it would pass over the defect.
 */
const AFFORDANCES =
  'button, input, select, textarea, a[href], [role="button"], [role="switch"], [role="checkbox"], [role="menuitem"], [contenteditable="true"], [onclick]'

interface Fixture {
  readonly name: string
  readonly controlId: string
  readonly label: string
  readonly settingValue: string
  readonly reason: string
  readonly remains: string | null
}

/**
 * The two locked groups `SB-PREF-01` draws. `NOTIF-059` is the category the
 * illustrative example locks by name; `NOTIF-009` is the first member of the
 * non-disableable set the same section enumerates.
 */
const FIXTURES: readonly Fixture[] = [
  {
    name: 'Always sent — nothing remains',
    controlId: 'NOTIF-009',
    label: 'Safety-critical notification',
    settingValue: 'Always sent',
    reason: ALWAYS_SENT_REASON,
    remains: null,
  },
  {
    name: 'Protected — email frequency remains',
    controlId: 'NOTIF-059',
    label: 'Containment checklist incomplete',
    settingValue: 'Always sent, in-app and email',
    reason: PROTECTED_SENTENCE,
    remains: 'Email frequency options only.',
  },
]

function renderFixture(f: Fixture) {
  render(
    <LockedControl
      controlId={f.controlId}
      label={f.label}
      settingValue={f.settingValue}
      reason={f.reason}
      remains={f.remains}
    />,
  )
  const node = screen.getByTestId('locked-control')
  return node as HTMLElement
}

/** Resolves an `aria-describedby` / `aria-labelledby` token list to its text. */
function resolveIdRefs(node: HTMLElement, attribute: string): string {
  const raw = node.getAttribute(attribute)
  expect(raw, `${attribute} must be present`).not.toBeNull()
  const tokens = raw!.split(/\s+/).filter((t) => t !== '')
  // NOT vacuous on an empty list: an absent or blank attribute would leave
  // `tokens` empty and every "contains the reason" assertion below would pass
  // on the empty string. Both halves are asserted.
  expect(tokens.length, `${attribute} must name at least one element`).toBeGreaterThan(0)
  return tokens
    .map((id) => {
      const target = node.ownerDocument.getElementById(id)
      expect(target, `${attribute} names \`${id}\`, which no element carries`).not.toBeNull()
      return target!.textContent ?? ''
    })
    .join(' ')
}

afterEach(cleanup)

describe('LockedControl — visible, inoperable by construction, reason inline', () => {
  it('reads both locked-group wordings out of the frozen source, non-trivially', () => {
    // Proves the fixtures are the source's own words and not this file's.
    expect(ALWAYS_SENT_REASON.length).toBeGreaterThan(30)
    expect(PROTECTED_SENTENCE.length).toBeGreaterThan(30)
    expect(ALWAYS_SENT_REASON).not.toEqual(PROTECTED_SENTENCE)
    expect(SOURCE[73702 - 1]).toContain('SB-PREF-01')
  })

  it('draws no affordance of any kind, on either locked group', () => {
    for (const f of FIXTURES) {
      const node = renderFixture(f)
      expect(node.querySelectorAll(AFFORDANCES), f.name).toHaveLength(0)
      // The container itself, not only its descendants.
      expect(node.matches(AFFORDANCES), `${f.name}: the container itself`).toBe(false)
      expect(node.tagName, f.name).not.toBe('BUTTON')
      cleanup()
    }
  })

  it('carries no `aria-disabled` and no `disabled` anywhere — there is nothing to disable', () => {
    for (const f of FIXTURES) {
      const node = renderFixture(f)
      expect(node.getAttribute('aria-disabled'), f.name).toBeNull()
      expect(node.querySelectorAll('[aria-disabled]'), f.name).toHaveLength(0)
      expect(node.querySelectorAll('[disabled]'), f.name).toHaveLength(0)
      cleanup()
    }
  })

  it('shows the setting AND the value it is locked at, so the lock has a subject', () => {
    for (const f of FIXTURES) {
      const node = renderFixture(f)
      expect(node.textContent, f.name).toContain(f.label)
      expect(node.textContent, f.name).toContain(f.settingValue)
      expect(resolveIdRefs(node, 'aria-labelledby'), f.name).toContain(f.label)
      cleanup()
    }
  })

  it('puts the reason in the accessibility tree, associated with the control', () => {
    for (const f of FIXTURES) {
      const node = renderFixture(f)
      expect(resolveIdRefs(node, 'aria-describedby'), f.name).toContain(f.reason)
      cleanup()
    }
  })

  it('describes what remains only when something does, and never invents it', () => {
    const [alwaysSent, protectedCategory] = FIXTURES as readonly [Fixture, Fixture]

    const locked = renderFixture(alwaysSent)
    expect(locked.getAttribute('aria-describedby')!.trim().split(/\s+/)).toHaveLength(1)
    expect(locked.ownerDocument.getElementById(`${alwaysSent.controlId}-locked-remains`)).toBeNull()
    cleanup()

    const partial = renderFixture(protectedCategory)
    expect(partial.getAttribute('aria-describedby')!.trim().split(/\s+/)).toHaveLength(2)
    expect(resolveIdRefs(partial, 'aria-describedby')).toContain(protectedCategory.remains!)
  })

  it('is reachable by keyboard, because focus is the whole interaction', () => {
    for (const f of FIXTURES) {
      const node = renderFixture(f)
      expect(node.tabIndex, f.name).toBe(0)
      node.focus()
      expect(node.ownerDocument.activeElement, f.name).toBe(node)
      cleanup()
    }
  })

  it('refuses to render a lock with no inline reason, or over an unnamed setting', () => {
    const base = FIXTURES[1]!
    expect(() => render(<LockedControl {...base} reason="   " />)).toThrow(/inline reason/)
    cleanup()
    expect(() => render(<LockedControl {...base} reason="" />)).toThrow(/inline reason/)
    cleanup()
    expect(() => render(<LockedControl {...base} label=" " />)).toThrow(/label/)
    cleanup()
  })

  it('accepts no handler prop — the interface has nothing to call', () => {
    const base = FIXTURES[0]!
    // @ts-expect-error a locked control takes no click handler
    render(<LockedControl {...base} onClick={() => {}} />)
    cleanup()
    // @ts-expect-error a locked control takes no change handler either
    render(<LockedControl {...base} onChange={() => {}} />)
    cleanup()
    // @ts-expect-error nor `WriteControl`'s act handler
    render(<LockedControl {...base} onAct={() => {}} />)
    cleanup()
  })

  it('is exported from the primitives barrel as the same component', () => {
    expect(LockedControlFromBarrel).toBe(LockedControl)
  })
})

describe('LockedControl is none of the three renderings it sits beside', () => {
  it('is not a disabled Button — that one IS a button and IS aria-disabled', () => {
    const { unmount } = render(<Button disabledReason="Locked.">Turn off</Button>)
    const button = screen.getByRole('button')
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    unmount()

    // The same statement, rendered the other way: no role="button" exists.
    renderFixture(FIXTURES[0]!)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('is not PermissionNotice — that draws no setting, and nothing at all when allowed', () => {
    const { unmount } = render(
      <PermissionNotice decision={allow('BASE_ROLE', ['L73702'])} />,
    )
    expect(screen.queryByRole('note')).toBeNull()
    unmount()

    const node = renderFixture(FIXTURES[0]!)
    // A locked control is not a refusal: the setting is ON and says so.
    expect(node.textContent).toContain('Always sent')
  })

  it('is not ABSENT — ABSENT draws no setting value and no lock', () => {
    const { unmount } = render(
      <ProhibitionNotice rendering={{ kind: 'absent', note: 'Not offered on this surface.' }} />,
    )
    const absent = screen.getByRole('note')
    expect(absent.textContent).not.toContain('Locked')
    expect(absent.querySelectorAll(AFFORDANCES)).toHaveLength(0)
    unmount()

    const node = renderFixture(FIXTURES[0]!)
    expect(node.textContent).toContain('Locked')
    expect(node.getAttribute('data-locked-control')).toBe('NOTIF-009')
  })

  it('needs no client runtime — the module declares no `use client`', () => {
    // The boundary trap, checked on the file rather than argued in a comment:
    // a component that took a handler would need one, and this one does not.
    const src = readFileSync(join(process.cwd(), 'src/ui/primitives/LockedControl.tsx'), 'utf8')
    // The directive, not the words: `'use client'` only takes effect as the
    // module's first statement, so this looks for it at the start of a line as
    // a bare string literal. A COMMENT mentioning the directive — this file's
    // own doc comment does, explaining why there isn't one — must not trip it,
    // which is the shape that made five slice-9 gates wrong.
    expect(src).not.toMatch(/^\s*['"]use client['"]/m)
    // No hook, because a hook would force the directive. `useId` is the one
    // that would otherwise have been reached for, to mint the aria ids. Both
    // checks look for the CALL and the IMPORT rather than the identifier: the
    // module's doc comment names `useId` in order to explain its absence, and
    // a check on the bare word would convict it for saying so.
    expect(src).not.toMatch(/\buse[A-Z]\w*\s*\(/)
    expect(src).not.toMatch(/from\s+['"]react['"]/)
  })
})

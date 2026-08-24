import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CC13_SUPERVISOR_SUBSTITUTION } from '@/surfaces/cc/modules/cc-13/rail'
import { CC13_ACTIONS, CC13_COLUMNS } from '@/surfaces/cc/actions/action-set'
import { dohModuleById } from '@/surfaces/doh/modules'
import { ROLES } from '@/domain/roles'
import { isForeignProbe } from '../probe-paths'

/**
 * `MOD-CC-13`'s ACTION RAIL, RENDERED — `SB-16-02` (L20195) and its named
 * test `TEST-16-13` (L20238).
 *
 * THE REASON IS READ THROUGH `aria-describedby`, NEVER OFF `textContent`.
 * `Button` renders its `disabledReason` into a separate element wired to the
 * control; `document.body.textContent` welds that element to the audit
 * pointer printed directly beneath it, so a check written that way passes
 * when EITHER carries the words and cannot tell which. Resolving the id
 * reads exactly one of them, and `reason.hidden` is asserted because a
 * hidden reason is a reason nobody reads.
 *
 * THE THREE STATES ARE READ OFF THE DOM, NOT OFF `data-state`. A rail whose
 * `data-state` said `disabled` while drawing an enabled button would pass a
 * check on the attribute alone. Each state is therefore asserted by what is
 * actually in the tree — a `<button>` with no `aria-disabled` for enabled, a
 * `<button>` with `aria-disabled` and a resolvable reason for disabled, and
 * NO control at all plus a `role="note"` for absent.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES: readonly string[] = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const line = (n: number): string => {
  const text = LINES[n - 1]
  if (text === undefined) throw new Error(`Frozen source has no line ${n}`)
  return text
}

const SUPERVISOR = { heldColumns: ['Supervisor'] } as const
const QM = { heldColumns: ['Quality Manager'] } as const

function control(ordinal: number): HTMLElement {
  return screen.getByTestId(`cc13-rail-control-${ordinal}`)
}

/** The one text the control itself carries, unwelded from anything near it. */
function controlReason(ordinal: number): string {
  const button = within(control(ordinal)).getByRole('button')
  const id = button.getAttribute('aria-describedby')
  expect(id, 'the control carries no reason element at all').not.toBeNull()
  const reason = document.getElementById(id ?? '')
  expect(reason, `no element with id ${id ?? ''}`).not.toBeNull()
  expect(reason?.hidden, 'the reason element is hidden').toBe(false)
  return reason?.textContent ?? ''
}

describe('above the rail: the person, the scope, and no role indicator', () => {
  it('renders the name and the scope filter', () => {
    render(<Cc13ActionRail personName="Sam Okonkwo" scopeFilter="Area" {...SUPERVISOR} />)
    const header = screen.getByTestId('cc13-rail-header')
    expect(within(header).getByTestId('cc13-rail-person').textContent).toBe('Sam Okonkwo')
    expect(within(header).getByTestId('cc13-rail-scope').textContent).toContain('Area')
  })

  // FAILS IF: a role name or a role id is printed above the rail. L20195:
  // "There is no role indicator, because there is no active role." Asserted
  // over every one of the five matrix column words AND every tenant RoleId,
  // because a rail could name the role in either vocabulary.
  it('names no role, in either vocabulary, anywhere in the header', () => {
    render(
      <Cc13ActionRail
        personName="Sam Okonkwo"
        scopeFilter="Site"
        heldColumns={['Supervisor', 'Quality Manager']}
      />,
    )
    const header = screen.getByTestId('cc13-rail-header').textContent ?? ''
    for (const column of CC13_COLUMNS) expect(header).not.toContain(column)
    for (const role of ROLES) {
      expect(header).not.toContain(role.id)
      expect(header).not.toContain(role.name)
    }
    expect(line(20195)).toContain('There is no role indicator, because there is no active role.')
  })

  it('offers only the two scope filters the storyboard names', () => {
    for (const scope of ['Site', 'Area'] as const) {
      const { unmount } = render(
        <Cc13ActionRail personName="Sam" scopeFilter={scope} {...SUPERVISOR} />,
      )
      expect(screen.getByTestId('cc13-rail-scope').textContent).toContain(scope)
      unmount()
    }
  })
})

describe('the ten, in canonical order, for every viewer', () => {
  it('renders all ten whatever the person holds', () => {
    for (const columns of [[], ['Supervisor'], ['Worker'], ['Tenant Admin']] as const) {
      const { unmount } = render(
        <Cc13ActionRail personName="Sam" scopeFilter="Site" heldColumns={columns} />,
      )
      const items = within(screen.getByTestId('cc13-rail-controls')).getAllByRole('listitem')
      expect(items).toHaveLength(10)
      expect(items.map((el) => el.getAttribute('data-testid'))).toEqual(
        CC13_ACTIONS.map((a) => `cc13-rail-control-${a.ordinal}`),
      )
      unmount()
    }
    expect(line(20197)).toContain('The action rail shows all ten actions.')
  })
})

describe('TEST-16-13 — the Supervisor sees a different control, not a disabled one', () => {
  // FAILS IF: the substitution is removed, or is drawn as a disabled release.
  it('draws "Request release with a note", enabled, and never the release control', () => {
    render(<Cc13ActionRail personName="Sam" scopeFilter="Area" {...SUPERVISOR} />)
    const row4 = control(4)
    const button = within(row4).getByRole('button')
    expect(button.textContent).toBe(CC13_SUPERVISOR_SUBSTITUTION.substituteLabel)
    expect(button.getAttribute('aria-disabled')).toBeNull()
    expect(row4.getAttribute('data-substituted')).toBe('yes')
    // Not a disabled version of the Quality Manager control: the release
    // label is not in this row at all.
    expect(row4.textContent).not.toContain('Release a lot hold')
    expect(line(20238)).toContain('rather than as a disabled release control')
  })

  it('and the Quality Manager still sees the release itself', () => {
    render(<Cc13ActionRail personName="Elena" scopeFilter="Site" {...QM} />)
    const button = within(control(4)).getByRole('button')
    expect(button.textContent).toBe('Release a lot hold')
    expect(control(4).getAttribute('data-substituted')).toBe('no')
  })
})

describe('the three visual states, read off the tree', () => {
  // FAILS IF: a role refusal renders absent. L20195 reserves absent for the
  // OBJECT — the inversion of what `src/ui/WriteControl.tsx` does, which is
  // why this rail does not route through it.
  it('a role refusal is a disabled control carrying its reason, never an absence', () => {
    render(<Cc13ActionRail personName="Sam" scopeFilter="Area" {...SUPERVISOR} />)
    // Action 7, Mark evidence reviewed, is Explicitly prohibited for a
    // Supervisor at L38688 — the token that this build draws as nothing.
    const row7 = control(7)
    expect(row7.getAttribute('data-state')).toBe('disabled')
    const button = within(row7).getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(controlReason(7)).toContain('Explicitly prohibited')
  })

  it('an object that does not apply is absent WITH its stated reason and no control', () => {
    render(
      <Cc13ActionRail
        personName="Elena"
        scopeFilter="Site"
        heldColumns={['Quality Manager']}
        notApplicable={{ 5: 'no sync conflict is selected' }}
      />,
    )
    const row5 = control(5)
    expect(row5.getAttribute('data-state')).toBe('absent')
    expect(within(row5).queryByRole('button')).toBeNull()
    const note = within(row5).getByRole('note')
    expect(note.textContent).toContain('no sync conflict is selected')
    // Never an empty space — L20195 requires the reason be stated.
    expect((note.textContent ?? '').trim().length).toBeGreaterThan(0)
  })

  it('an out-of-scope target disables with the source-s own words', () => {
    render(
      <Cc13ActionRail
        personName="Sam"
        scopeFilter="Area"
        heldColumns={['Supervisor']}
        outOfScope={[8]}
      />,
    )
    expect(control(8).getAttribute('data-state')).toBe('disabled')
    expect(controlReason(8)).toContain('Out of scope for your grants')
  })

  it('surfaces a conditional grant-s condition beside the enabled control', () => {
    render(<Cc13ActionRail personName="Sam" scopeFilter="Area" {...SUPERVISOR} />)
    expect(control(10).getAttribute('data-state')).toBe('enabled')
    expect(screen.getByTestId('cc13-rail-condition-10').textContent).toContain(
      'expired qualification only, Quality Manager notified',
    )
  })
})

describe('the audit pointer, named and linked', () => {
  /**
   * THIS CASE USED TO ASSERT THE ABSENCE OF THE LINK -- `data-audit-linked`
   * is `no`, no anchor anywhere -- which pinned an abstention that had
   * stopped being true: `SCR-DOH-20` ships at `/hub/audit-and-retention` and
   * L48437 makes the link an obligation for every one of the ten.
   *
   * It now derives from the same place the rail does, so it cannot pin a
   * stale answer in either direction. FAILS IF: any of the ten loses its
   * pointer or its anchor, or the href stops matching the DOH spine's slug.
   */
  it('every one of the ten names where its record lives and links the audit explorer', () => {
    render(<Cc13ActionRail personName="Elena" scopeFilter="Site" {...QM} />)
    const href = `/hub/${dohModuleById('MOD-DOH-11').slug}`
    for (const action of CC13_ACTIONS) {
      const pointer = screen.getByTestId(`cc13-rail-audit-${action.ordinal}`)
      expect(pointer.getAttribute('data-audit-linked')).toBe('yes')
      expect(pointer.textContent).toContain('L48437')
      const anchor = within(pointer).getByRole('link')
      expect(anchor.getAttribute('href')).toBe(href)
    }
    expect(screen.queryAllByRole('link')).toHaveLength(CC13_ACTIONS.length)
    expect(line(48437)).toContain('Every action links to its Delivery Operations Hub audit entry')
    expect(line(48114)).toContain('Audit log explorer')
  })

  it('row nine says its column names no owner rather than borrowing another table-s answer', () => {
    render(<Cc13ActionRail personName="Elena" scopeFilter="Site" {...QM} />)
    expect(screen.getByTestId('cc13-rail-audit-9').textContent).toContain('names no owning record')
  })
})

describe('the mount, declared rather than assumed', () => {
  it('names the actions L38793 puts on the screen it is mounted inside', () => {
    render(<Cc13ActionRail personName="Elena" scopeFilter="Site" mountedOn="MOD-CC-10" {...QM} />)
    expect(screen.getByTestId('cc13-rail-mount').textContent).toContain('action 5')
    // And still lists all ten.
    expect(within(screen.getByTestId('cc13-rail-controls')).getAllByRole('listitem')).toHaveLength(
      10,
    )
  })

  it('says so where the interconnection line names the host module for none of the ten', () => {
    render(<Cc13ActionRail personName="Elena" scopeFilter="Site" mountedOn="MOD-CC-01" {...QM} />)
    expect(screen.getByTestId('cc13-rail-mount').textContent).toContain('none of the ten')
  })
})

describe('the client boundary, which a component suite cannot see by mounting', () => {
  // FAILS IF: any file in this module gains `'use client'`. A component suite
  // mounts the component and the boundary only exists in a build, so four
  // panels shipped an undefined module id in slice 7 with every test green.
  it('no file of this module is a client module', () => {
    const dir = join(process.cwd(), 'src/surfaces/cc/modules/cc-13')
    const files = readdirSync(dir).filter((f) => !isForeignProbe(f))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      const text = readFileSync(join(dir, f), 'utf8')
      expect(text.startsWith("'use client'"), `${f} is a client module`).toBe(false)
      expect(text.includes("\n'use client'"), `${f} declares use client`).toBe(false)
    }
  })
})

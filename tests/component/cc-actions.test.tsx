import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { ActionRail, cc13ColumnForRole } from '@/surfaces/cc/actions/ActionRail'
import { CC13_ACTIONS, CC13_COLUMNS } from '@/surfaces/cc/actions/action-set'
import { CC_WRITES_OUTSIDE_THE_TEN } from '@/surfaces/cc/actions/outside-writes'
import { CC_COMMAND_BEARING_ACTIONS } from '@/surfaces/cc/actions/propagation'
import type { RoleId } from '@/domain/roles'

/**
 * `MOD-CC-13`'s ACTION RAIL, RENDERED, against the frozen source parsed at
 * run time.
 *
 * The unit suite proves the transcription matches the source; this one proves
 * the SCREEN does. Neither passes by agreeing with the other — both read
 * L38680-L38691 off the file — so a correct data table with a wrong screen
 * has nowhere to hide.
 *
 * EVERY CELL IS READ THROUGH ITS OWN `data-testid` AND COMPARED FOR EXACT
 * EQUALITY. A `toContain('Allowed')` sweep over this rail would be green with
 * row 10's Supervisor cell deleted, inverted, or replaced by the
 * unconditional token, because `Allowed` is a prefix of `Allowed with
 * conditions` and eleven other cells in the table read `Allowed` outright.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES: readonly string[] = readFileSync(SOURCE_PATH, 'utf8').split('\n')

const line = (n: number): string => {
  const text = LINES[n - 1]
  if (text === undefined) throw new Error(`Frozen source has no line ${n}`)
  return text
}

const fields = (n: number): readonly string[] =>
  line(n)
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((f) => f.trim())

describe('the action rail renders the closed set of ten', () => {
  it('names its own module id on the element it mounts, so the screen says what it is', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const rail = screen.getByTestId('cc13-action-rail')
    expect(rail.getAttribute('data-module-id')).toBe('MOD-CC-13')
    expect(screen.getByTestId('cc13-module-id').textContent).toContain('MOD-CC-13')
  })

  it('renders ten authority rows and no eleventh', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const table = screen.getByTestId('cc13-authority-table')
    const rows = within(table).getAllByRole('row')
    // One header row plus ten data rows. The header is counted so an extra
    // row cannot hide inside "ten or more".
    expect(rows).toHaveLength(11)
    for (const action of CC13_ACTIONS) {
      const row = screen.getByTestId(`cc13-authority-row-${action.ordinal}`)
      const cells = within(row).getAllByRole('cell')
      const source = fields(Number(action.authorityRef.slice(1)))
      expect(cells.map((c) => c.textContent)).toEqual([...source])
    }
  })

  it('renders the five persona columns in the source header’s own order, Tenant Admin first', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const matrix = screen.getByTestId('cc13-permission-matrix')
    const headers = within(matrix).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual(['#', 'Action', ...fields(38680).slice(2)])
    expect(headers[2]?.textContent).toBe('Tenant Admin')
    expect(headers.at(-1)?.textContent).toBe('Worker')
  })

  it('renders every one of the fifty cells exactly as its own source line writes it', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const header = fields(38680)
    let checked = 0
    for (const action of CC13_ACTIONS) {
      const source = fields(Number(action.matrixRef.slice(1)))
      for (const column of CC13_COLUMNS) {
        const cell = screen.getByTestId(`cc13-cell-${action.ordinal}-${column}`)
        expect(cell.textContent).toBe(source[header.indexOf(column)])
        checked += 1
      }
    }
    expect(checked).toBe(50)
  })

  it('renders the conditional clause beside the token, not the token alone', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    // Row 10, Supervisor. `Allowed` is a prefix of this and the note is the rule.
    expect(screen.getByTestId('cc13-cell-10-Supervisor').textContent).toBe(
      'Allowed with conditions — expired qualification only, Quality Manager notified',
    )
    // Row 4, Supervisor. The token prohibits; the note grants a different act.
    expect(screen.getByTestId('cc13-cell-4-Supervisor').textContent).toBe(
      'Explicitly prohibited — may request with a note',
    )
  })
})

describe('the rail answers the viewer’s own role through the column that names it', () => {
  it.each([
    ['TENANT_ADMIN', 'Tenant Admin'],
    ['SUPERVISOR', 'Supervisor'],
    ['QUALITY_MANAGER', 'Quality Manager'],
    ['READONLY_AUDITOR', 'Read-only Auditor'],
    ['WORKER', 'Worker'],
  ] as const)('%s reads the %s column', (role, column) => {
    expect(cc13ColumnForRole(role)).toBe(column)
    render(<ActionRail viewerRole={role} />)
    const header = fields(38680)
    for (const action of CC13_ACTIONS) {
      const source = fields(Number(action.matrixRef.slice(1)))[header.indexOf(column)]
      expect(source).toBeDefined()
      const [head, ...rest] = (source as string).split(' — ')
      expect(screen.getByTestId(`cc13-viewer-token-${action.ordinal}`).textContent).toBe(head)
      if (rest.length === 0) {
        expect(screen.queryByTestId(`cc13-viewer-note-${action.ordinal}`)).toBeNull()
      } else {
        expect(screen.getByTestId(`cc13-viewer-note-${action.ordinal}`).textContent).toBe(
          ` — ${rest.join(' — ')}`,
        )
      }
    }
  })

  it('a platform role names no column of this matrix and is told so', () => {
    const platformRole: RoleId = 'PLATFORM_ENGINEER'
    expect(cc13ColumnForRole(platformRole)).toBeNull()
    render(<ActionRail viewerRole={platformRole} />)
    expect(screen.getByTestId('cc13-viewer-no-column')).toBeTruthy()
    expect(screen.queryByTestId('cc13-viewer-verdicts')).toBeNull()
  })
})

describe('the rail discloses what its own matrix does not carry', () => {
  it('renders four exclusions and the L48368 miscount, adopting neither number', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const list = screen.getByTestId('cc13-exclusions')
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)
    const miscount = screen.getByTestId('cc13-exclusion-miscount').textContent ?? ''
    expect(miscount).toContain('L48368')
    expect(miscount).toContain('"Three prohibitions bind every screen absolutely"')
    expect(miscount).toContain('lists four')
    expect(miscount).toContain('neither number is adopted')
  })

  it('renders the AC-CC-407 gap and adds no row to close it', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const gap = screen.getByTestId('cc13-ac407-gap').textContent ?? ''
    expect(gap).toContain('AC-CC-407')
    expect(gap).toContain('asserted against nothing')
    // The matrix still has exactly ten rows: the gap was disclosed, not repaired.
    const matrix = screen.getByTestId('cc13-permission-matrix')
    expect(within(matrix).getAllByRole('row')).toHaveLength(11)
  })

  it('renders every one of the ten with its owning place, and names row 9’s absence', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const list = screen.getByTestId('cc13-owning-places')
    // Each `<li>` carries `role="note"`, which replaces `listitem`.
    const notes = within(list).getAllByRole('note')
    expect(notes).toHaveLength(10)
    const withoutOwner = notes.filter((n) => n.getAttribute('data-has-named-owner') === 'no')
    expect(withoutOwner).toHaveLength(1)
    expect(screen.getByTestId('cc13-owning-place-9').getAttribute('data-has-named-owner')).toBe('no')
    expect(screen.getByTestId('cc13-owning-place-9').textContent).toContain(
      'names no owning record',
    )
    // No anchor is drawn here. The link-out is task 5's shared component.
    expect(within(list).queryAllByRole('link')).toHaveLength(0)
  })
})

describe('the rail renders six writes outside the ten and marks the source’s four', () => {
  it('renders six rows, four flagged as the source’s and two as this build’s', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const table = screen.getByTestId('cc13-outside-writes')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(7)
    expect(screen.getAllByTestId('cc13-outside-write-source')).toHaveLength(4)
    expect(screen.getAllByTestId('cc13-outside-write-found')).toHaveLength(2)
    for (const w of CC_WRITES_OUTSIDE_THE_TEN) {
      const row = within(table)
        .getAllByRole('row')
        .find((r) => within(r).queryAllByRole('cell')[0]?.textContent === w.act)
      expect(row).toBeDefined()
      expect((row as HTMLElement).getAttribute('data-named-by-source')).toBe(
        w.namedByDecCcWrite001 ? 'yes' : 'no',
      )
    }
  })

  it('states six without offering six as the source’s number', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const statement = screen.getByTestId('cc13-outside-write-count').textContent ?? ''
    expect(statement).toContain('6 writes')
    expect(statement).toContain('DEC-CCWRITE-001 names 4 of them')
    expect(statement).toContain('the four outside acts')
    expect(statement).toContain("neither is presented here as the source's number")
  })
})

describe('the rail renders the propagation roll-up honestly', () => {
  it('names the three command-bearing actions and the two classes not originated here', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const bearing = screen.getByTestId('cc13-command-bearing')
    expect(within(bearing).getAllByRole('listitem')).toHaveLength(3)
    for (const a of CC_COMMAND_BEARING_ACTIONS) {
      expect(screen.getByTestId(`cc13-command-bearing-${a.ordinal}`).textContent).toContain(
        a.commandClass,
      )
    }
    expect(
      within(screen.getByTestId('cc13-classes-not-here')).getAllByRole('listitem'),
    ).toHaveLength(2)
  })

  it('renders all three roll-up states, and in force only where both devices acknowledged', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const list = screen.getByTestId('cc13-rollup-illustrations')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((i) => i.getAttribute('data-rollup-state'))).toEqual([
      'issued',
      'propagating',
      'in force',
    ])
    const inForce = screen.getByTestId('cc13-rollup-in-force')
    expect(inForce.textContent).toContain('In force on 2 of 2 devices')
    expect(inForce.textContent).toContain('Unconfirmed: none')

    const propagating = screen.getByTestId('cc13-rollup-propagating')
    expect(propagating.textContent).toContain('Unconfirmed: TAB-015')
    expect(propagating.textContent).toContain('DEC-WIPE-001')
    expect(propagating.textContent).toContain('nothing here promotes it on a timer')
  })

  it('states AC-CC-408 as named rather than enforced', () => {
    render(<ActionRail viewerRole="SUPERVISOR" />)
    const note = screen.getByTestId('cc13-no-client-queue').textContent ?? ''
    expect(note).toContain('AC-CC-408')
    expect(note).toContain('Named, not enforced')
  })
})

describe('the rail is a server component and stays one', () => {
  it('carries no `use client` directive, in itself or in the modules it reads', () => {
    for (const path of [
      'src/surfaces/cc/actions/ActionRail.tsx',
      'src/surfaces/cc/actions/action-set.ts',
      'src/surfaces/cc/actions/outside-writes.ts',
      'src/surfaces/cc/actions/propagation.ts',
    ]) {
      const text = readFileSync(join(process.cwd(), path), 'utf8')
      // A DIRECTIVE, not the phrase: the rail's own header comment explains
      // why it must not become a client module, and a `toContain` on the
      // words goes red on the explanation instead of on the defect. Anchored
      // to the start of a line and to the quote, which is what a directive is.
      expect(text).not.toMatch(/^\s*['"]use client['"]/m)
    }
  })
})

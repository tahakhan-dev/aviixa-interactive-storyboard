import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  CrossSurfaceStatement,
  type OffRegisterCrossSurface,
} from '@/ui/doh/CrossSurfaceStatement'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { DOH_BOUNDARY_REGISTER, crossSurfaceStatement } from '@/surfaces/doh/boundary'
import { DOH_SEAMS } from '@/surfaces/doh/seams'
import { SURFACES } from '@/domain/surfaces'
import {
  CONTROL_MATRIX as DOH_08_MATRIX,
  type Doh08Row,
} from '@/surfaces/doh/modules/doh-08/matrix'
import type { TenantRoleId } from '../../app/hub/HubShell'

const TENANT_ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

/**
 * AC-DOH-012-3 (L25767) forbids "inline editing affordance", not a specific
 * tag. So this looks for anything a person could act through, not for
 * `<button>` alone — a disabled control counts, because a disabled control
 * implies a condition that could become true and this boundary does not move.
 */
const AFFORDANCES = 'button, input, select, textarea, [role="button"], [contenteditable="true"]'

function renderStatement(id: (typeof DOH_BOUNDARY_REGISTER)[number]['id'], role: TenantRoleId) {
  const { unmount } = render(
    <CrossSurfaceStatement statement={crossSurfaceStatement(id, role)} />,
  )
  return { node: screen.getByTestId('cross-surface-statement'), unmount }
}

describe('CrossSurfaceStatement — the eight adjacent capabilities', () => {
  it('draws no editing affordance on any row, for any tenant role', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      for (const role of TENANT_ROLES) {
        const { node, unmount } = renderStatement(row.id, role)
        expect(node.querySelectorAll(AFFORDANCES), `${row.id}/${role}`).toHaveLength(0)
        unmount()
      }
    }
  })

  it('names the owning surface, the capability and the source line on every row', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      const { node, unmount } = renderStatement(row.id, 'TENANT_ADMIN')
      const surfaceName = SURFACES.find((s) => s.id === row.owningSurface)!.name
      expect(node.textContent, row.id).toContain(surfaceName)
      expect(node.textContent, row.id).toContain(row.capability)
      expect(node.textContent, row.id).toContain(row.sourceRef)
      unmount()
    }
  })

  it('renders the cross-surface link SB-DOH-003 describes, where the role reaches it', () => {
    const { node, unmount } = renderStatement('workflow-and-instruction-authoring', 'SUPERVISOR')
    const link = within(node).getByRole('link', {
      name: 'Open in the Standards and Operations Studio',
    })
    expect(link).toHaveProperty('href')
    expect(link.getAttribute('href')).toBe('/studio')
    unmount()
  })

  it('renders no link at all to the Super Admin platform console — three rows, five roles', () => {
    for (const row of DOH_BOUNDARY_REGISTER.filter((r) => r.owningSurface === 'SURF-SA')) {
      for (const role of TENANT_ROLES) {
        const { node, unmount } = renderStatement(row.id, role)
        expect(within(node).queryAllByRole('link'), `${row.id}/${role}`).toHaveLength(0)
        expect(node.getAttribute('data-link-state')).toBe('statement')
        unmount()
      }
    }
  })

  // FIDELITY, NOT POLICY, and named so nobody reads it as the second kind.
  // Its expectation comes from the model under test, so it proves the
  // component honours what it was handed and can prove nothing about whether
  // the model is right — the two cases above carry independent expectations
  // (the console rows, and the Command Center's three-of-five role list) and
  // are what would catch a wrong model.
  it('draws a link exactly when the model it was handed says link, and never otherwise', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      for (const role of TENANT_ROLES) {
        const model = crossSurfaceStatement(row.id, role)
        const { node, unmount } = renderStatement(row.id, role)
        expect(within(node).queryAllByRole('link').length, `${row.id}/${role}`).toBe(
          model.linkState === 'link' ? 1 : 0,
        )
        unmount()
      }
    }
  })

  it('tells the Read-only Auditor the Studio question is open rather than closing it', () => {
    const { node, unmount } = renderStatement(
      'workflow-and-instruction-authoring',
      'READONLY_AUDITOR',
    )
    expect(node.getAttribute('data-link-state')).toBe('open-decision')
    expect(within(node).getByTestId('cross-surface-note').textContent).toContain('DEC-AUDSTU-001')
    unmount()
  })

  it('never claims the capability is late', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      const { node, unmount } = renderStatement(row.id, 'TENANT_ADMIN')
      expect(node.textContent, row.id).not.toMatch(/not built here|slice \d/i)
      unmount()
    }
  })

  it('marks a registered row as registered, so the two shapes stay tellable apart', () => {
    for (const row of DOH_BOUNDARY_REGISTER) {
      const { node, unmount } = renderStatement(row.id, 'TENANT_ADMIN')
      expect(node.getAttribute('data-registered'), row.id).toBe('true')
      unmount()
    }
  })
})

/* ==================================================================== *
 * ADJACENT, AND NOT ON THE REGISTER.
 *
 * The register is eight rows. `MOD-DOH-08` classifies TWO of its own rows
 * `another-surface` and neither is one of the eight, so neither could be
 * handed to this component and the module hand-rolled a bordered note of its
 * own. `MOD-DOH-07` row 4 is a third, for the same reason.
 *
 * The premise is measured off the module's matrix and the register, not
 * declared here: if a later slice DID register the lot-hold release, the
 * first test below goes red and this whole section is asking the wrong
 * question.
 * ==================================================================== */

const LOT_HOLD: OffRegisterCrossSurface = {
  boundary: null,
  rowId: 'release-a-severity-1-lot-hold',
  capability: 'Release a Severity 1 lot hold',
  owningSurface: 'SURF-CC',
  linkState: 'statement',
  linkLabel: null,
  linkHref: null,
  note: 'Owned there, not here. Releasing a Severity 1 lot hold is Client Command Center action 4.',
  offRegisterNote:
    'This act is not one of the eight rows of the §19.1.2 boundary register (L25719-L25726), so there is no registered boundary behind this statement.',
  sourceRef: 'L28307',
}

function renderOffRegister(over: Partial<OffRegisterCrossSurface> = {}) {
  const { unmount } = render(<CrossSurfaceStatement statement={{ ...LOT_HOLD, ...over }} />)
  return { node: screen.getByTestId('cross-surface-statement'), unmount }
}

describe('CrossSurfaceStatement — an adjacent capability the register does not list', () => {
  it('is a real case: MOD-DOH-08 carries two adjacent rows and the register lists neither', () => {
    const adjacent: readonly Doh08Row[] = DOH_08_MATRIX.filter(
      (r) => r.surface === 'another-surface',
    )
    expect(adjacent.map((r) => r.id)).toEqual([
      'reclassify-an-anomaly-severity',
      'release-a-severity-1-lot-hold',
    ])
    const registered = new Set<string>(DOH_BOUNDARY_REGISTER.map((r) => r.id))
    for (const row of adjacent) expect(registered.has(row.id), row.id).toBe(false)
    // And the pointer field is empty on both, which is what left them
    // unrenderable: `crossSurfaceStatement` takes a `DohBoundaryId`.
    for (const row of adjacent) expect(row.boundary, row.id).toBeUndefined()
  })

  it('renders the capability, the owning surface and the row’s own line', () => {
    const { node, unmount } = renderOffRegister()
    expect(node.textContent).toContain('Release a Severity 1 lot hold')
    expect(node.textContent).toContain('Client Command Center')
    expect(node.textContent).toContain('L28307')
    expect(node.getAttribute('data-boundary')).toBe('release-a-severity-1-lot-hold')
    unmount()
  })

  // THE HONESTY REQUIREMENT. A statement with no register row behind it must
  // SAY there is none. Without this the component would render a boundary
  // claim indistinguishable from one §4.1.2 actually registers.
  it('says outright that the register does not list it', () => {
    const { node, unmount } = renderOffRegister()
    expect(node.getAttribute('data-registered')).toBe('false')
    expect(within(node).getByTestId('cross-surface-source').textContent).toContain(
      'not one of the eight rows of the §19.1.2 boundary register',
    )
    unmount()
  })

  it('draws no editing affordance, for either link state', () => {
    for (const linkState of ['statement', 'open-decision'] as const) {
      const { node, unmount } = renderOffRegister({ linkState })
      expect(node.querySelectorAll(AFFORDANCES), linkState).toHaveLength(0)
      unmount()
    }
  })

  it('never claims the capability is late', () => {
    const { node, unmount } = renderOffRegister()
    expect(node.textContent).not.toMatch(/not built here|slice \d/i)
    unmount()
  })

  /* ---- DISCRIMINATION 1: the pointer is checked, never asserted. ---- */

  it('draws no link where it was handed none, which is MOD-DOH-07’s reading', () => {
    const { node, unmount } = renderOffRegister()
    expect(within(node).queryAllByRole('link')).toHaveLength(0)
    unmount()
  })

  it('draws one where it was handed a checked one, which is MOD-DOH-08’s', () => {
    const { node, unmount } = renderOffRegister({
      linkState: 'link',
      linkLabel: 'Open in the Client Command Center',
      linkHref: '/command-center',
    })
    const link = within(node).getByRole('link', { name: 'Open in the Client Command Center' })
    expect(link.getAttribute('href')).toBe('/command-center')
    unmount()
  })

  // Widening the MODEL must not widen the POINTER. A statement claiming
  // `link` with a half-built pointer draws nothing rather than a dead one.
  it('draws nothing for a link state carrying only half a pointer', () => {
    for (const half of [
      { linkState: 'link', linkLabel: 'Open in the Client Command Center', linkHref: null },
      { linkState: 'link', linkLabel: null, linkHref: '/command-center' },
    ] as const) {
      const { node, unmount } = renderOffRegister(half)
      expect(within(node).queryAllByRole('link'), JSON.stringify(half)).toHaveLength(0)
      unmount()
    }
  })

  /* ---- DISCRIMINATION 2: crossing a surface is not crossing a module. ---- */

  // `MOD-DOH-06` row 1's record-finish window is set on SCR-DOH-23 in the
  // tenant administration area — a different Hub SCREEN, slice 12's to build.
  // A cross-surface statement over it would claim another surface owns
  // something this one does. The type already refuses `SURF-DOH`; the cast
  // is what an untyped caller would do, and it must still fail closed.
  it('refuses a boundary whose owner is this very surface', () => {
    expect(() =>
      render(
        <CrossSurfaceStatement
          statement={
            {
              ...LOT_HOLD,
              rowId: 'set-the-record-finish-window',
              owningSurface: 'SURF-DOH',
            } as unknown as OffRegisterCrossSurface
          }
        />,
      ),
    ).toThrow(/crossing a SURFACE, not a module/)
  })

  it('accepts every other surface, so the refusal is about SURF-DOH and not about strictness', () => {
    for (const surface of SURFACES.filter((s) => s.id !== 'SURF-DOH')) {
      const { node, unmount } = renderOffRegister({
        owningSurface: surface.id as OffRegisterCrossSurface['owningSurface'],
      })
      expect(node.textContent, surface.id).toContain(surface.name)
      unmount()
    }
  })
})

describe('SeamNotice keeps the other half of the split', () => {
  it('says outright that its claim is a schedule, on every seam', () => {
    for (const seam of DOH_SEAMS) {
      const { unmount } = render(<SeamNotice seamId={seam.id} />)
      const note = screen.getByRole('note')
      expect(note.textContent, seam.id).toContain('Cross-slice seam')
      expect(note.textContent, seam.id).toContain(
        `Owned by ${seam.ownerModule}, slice ${seam.ownerSlice}.`,
      )
      expect(within(note).getByTestId('seam-is-a-schedule').textContent, seam.id).toContain(
        'This is a schedule, not a boundary',
      )
      unmount()
    }
  })

  // The exact wording, pinned on a seam whose counterpart is genuinely still
  // to come. Kept OFF the loop above deliberately: task 5 is closing three of
  // these seams in this slice, and a closed seam may well earn a different
  // heading (`StudioSeamNotice` already draws one). What may never drift is
  // the wording used while the counterpart really is outstanding.
  it('words an outstanding counterpart as "not built here"', () => {
    const open = DOH_SEAMS.find((s) => s.ownerSlice > 6)
    expect(open).toBeDefined()
    render(<SeamNotice seamId={open!.id} />)
    expect(screen.getByRole('note').textContent).toContain('Cross-slice seam — not built here')
  })

  it('names no other surface, on any of the seven seams', () => {
    const others = SURFACES.filter((s) => s.id !== 'SURF-DOH').map((s) => s.name)
    for (const seam of DOH_SEAMS) {
      const { unmount } = render(<SeamNotice seamId={seam.id} />)
      const text = screen.getByRole('note').textContent ?? ''
      for (const name of others) expect(text, `${seam.id}/${name}`).not.toContain(name)
      unmount()
    }
  })
})

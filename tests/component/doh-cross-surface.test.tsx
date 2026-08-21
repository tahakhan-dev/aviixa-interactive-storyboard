import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { CrossSurfaceStatement } from '@/ui/doh/CrossSurfaceStatement'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { DOH_BOUNDARY_REGISTER, crossSurfaceStatement } from '@/surfaces/doh/boundary'
import { DOH_SEAMS } from '@/surfaces/doh/seams'
import { SURFACES } from '@/domain/surfaces'
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

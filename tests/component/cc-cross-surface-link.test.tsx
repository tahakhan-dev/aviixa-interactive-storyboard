import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import {
  CC_LINK_OUT_CELLS,
  ccLinkOutModel,
  cellTextOf,
  type CcLinkOutCell,
} from '@/surfaces/cc/decisions/link-outs'

/**
 * THE LINK-OUT AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually sees, because the whole point
 * of this control is that a correct transcription rendered through the
 * existing rule produces the wrong screen — nothing at all where the source
 * spells out a destination.
 */

afterEach(cleanup)

const byId = (id: string): CcLinkOutCell => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === id)
  if (found === undefined) throw new Error(`no such link-out cell: ${id}`)
  return found
}

const NAMED_STU = byId('cc-08-switch-agent')
const NAMED_DOH = byId('cc-02-manual-close-supervisor')
const AMBIGUOUS = byId('cc-08-reconfigure-agent')

describe('a link where the viewer reaches the owning surface', () => {
  it('draws an anchor, labelled with the surface it opens', () => {
    render(<CrossSurfaceLink model={ccLinkOutModel(NAMED_STU, 'QUALITY_MANAGER')} />)
    const anchor = screen.getByTestId('cc-cross-surface-link-anchor')
    expect(anchor.getAttribute('href')).toBe('/studio')
    expect(anchor.textContent).toContain('Standards and Operations Studio')
    expect(screen.getByTestId('cc-cross-surface-link').getAttribute('data-link-state')).toBe('link')
  })

  it('names the act in the cell’s own words, and the line it came from', () => {
    render(<CrossSurfaceLink model={ccLinkOutModel(NAMED_DOH, 'SUPERVISOR')} />)
    const box = screen.getByTestId('cc-cross-surface-link')
    expect(box.textContent).toContain('Manually close a stuck run')
    expect(box.textContent).toContain('L36459')
    expect(box.textContent).toContain('Supervisor')
  })
})

describe('no link where the viewer does not reach it', () => {
  it('collapses to a statement rather than a dead anchor', () => {
    render(<CrossSurfaceLink model={ccLinkOutModel(NAMED_STU, 'WORKER')} />)
    expect(screen.queryByTestId('cc-cross-surface-link-anchor')).toBeNull()
    const state = screen.getByTestId('cc-cross-surface-link').getAttribute('data-link-state')
    expect(state === 'statement' || state === 'open-decision').toBe(true)
    expect(screen.getByTestId('cc-cross-surface-link-note').textContent).not.toBe('')
  })
})

describe('the source naming two owners and choosing neither', () => {
  it('draws no link to either, and says both out loud', () => {
    render(<CrossSurfaceLink model={ccLinkOutModel(AMBIGUOUS, 'QUALITY_MANAGER')} />)
    expect(screen.queryByTestId('cc-cross-surface-link-anchor')).toBeNull()
    expect(screen.getByTestId('cc-cross-surface-link').getAttribute('data-link-state')).toBe(
      'owner-undecided',
    )
    const note = screen.getByTestId('cc-cross-surface-link-note').textContent ?? ''
    if (AMBIGUOUS.owner.kind !== 'ambiguous') throw new Error('unreachable')
    for (const cand of AMBIGUOUS.owner.candidates) expect(note).toContain(cand)
    expect(note).toContain('chooses')
  })

  it('every role reaches the same answer — the ambiguity is the cell’s, not the viewer’s', () => {
    const roles = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'WORKER'] as const
    const states = roles.map((r) => ccLinkOutModel(AMBIGUOUS, r).linkState)
    expect(new Set(states)).toEqual(new Set(['owner-undecided']))
    expect(roles.every((r) => ccLinkOutModel(AMBIGUOUS, r).linkHref === null)).toBe(true)
  })
})

describe('it cannot draw a control, and that is structural', () => {
  it('renders no button, no input and no handler-bearing element, for any cell or role', () => {
    for (const cell of CC_LINK_OUT_CELLS) {
      for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const) {
        const { container, unmount } = render(
          <CrossSurfaceLink model={ccLinkOutModel(cell, role)} />,
        )
        expect(container.querySelectorAll('button, input, select, textarea')).toHaveLength(0)
        expect(container.querySelectorAll('[aria-disabled]')).toHaveLength(0)
        unmount()
      }
    }
  })

  it('has no prop that could add one — the props are a model and nothing else', () => {
    const src = readFileSync(join(process.cwd(), 'src/ui/CrossSurfaceLink.tsx'), 'utf8')
    const props = /export interface CrossSurfaceLinkProps \{([\s\S]*?)\n\}/.exec(src)
    expect(props).not.toBeNull()
    const fields = [...(props?.[1] ?? '').matchAll(/readonly (\w+)/g)].map((m) => m[1])
    expect(fields).toEqual(['model'])
  })

  it('holds no policy: it names no role and reads no route registry', () => {
    const src = readFileSync(join(process.cwd(), 'src/ui/CrossSurfaceLink.tsx'), 'utf8')
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(/routesForRole|routeBySurface|evaluateAccess|allowedRoles/.test(code)).toBe(false)
    expect(/RoleId/.test(code)).toBe(false)
  })
})

describe('what the existing rendering rule would have drawn instead', () => {
  it('draws absent or a control for every one of these cells, and never a link', () => {
    const writeControl = readFileSync(join(process.cwd(), 'src/ui/WriteControl.tsx'), 'utf8')
    expect(writeControl).toContain("outcome === 'explicitlyProhibited'")
    expect(writeControl).toContain("rendering={{ kind: 'absent', note: refusalNote }}")
    expect(writeControl).not.toContain('href')
    for (const cell of CC_LINK_OUT_CELLS) {
      expect(cell.writeControlWouldDraw, cell.id).not.toBe('link')
    }
  })

  it("the two agent-panel cells are `Explicitly prohibited` and name their destination anyway", () => {
    for (const id of ['cc-08-switch-agent', 'cc-08-reconfigure-agent']) {
      const cell = byId(id)
      expect(cellTextOf(cell).startsWith('Explicitly prohibited')).toBe(true)
      expect(cell.writeControlWouldDraw).toBe('absent')
      expect(cell.sourceRequires).toBe('link')
    }
  })
})

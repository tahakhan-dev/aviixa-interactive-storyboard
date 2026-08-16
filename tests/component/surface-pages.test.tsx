import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SURFACES, type SurfaceDefinition, type SurfaceId } from '@/domain/surfaces'

import SuperAdminHome from '../../app/super-admin/page'
import HubHome from '../../app/hub/page'
import StudioHome from '../../app/studio/page'
import CommandCenterHome from '../../app/command-center/page'
import FrontlineHome from '../../app/frontline/page'

// Each entry pairs a surface id with the page component that is supposed to
// render it. If a page is ever pointed at the wrong surface, its id here
// still names the surface it OUGHT to render, so the assertions below catch
// the mismatch instead of silently checking the wrong thing.
const PAGES = [
  { id: 'SURF-SA', Component: SuperAdminHome },
  { id: 'SURF-DOH', Component: HubHome },
  { id: 'SURF-STU', Component: StudioHome },
  { id: 'SURF-CC', Component: CommandCenterHome },
  { id: 'SURF-FL', Component: FrontlineHome },
] as const

function surfaceOf(id: SurfaceId): SurfaceDefinition {
  const found = SURFACES.find((s) => s.id === id)
  if (!found) throw new Error(`fixture bug: unknown surface id ${id}`)
  return found
}

describe('each surface page renders its own surface identity', () => {
  for (const { id, Component } of PAGES) {
    const surface = surfaceOf(id)

    it(`${surface.basePath} renders ${surface.id}'s name, purpose and ownership`, () => {
      render(<Component />)
      expect(screen.getByText(surface.name)).toBeTruthy()
      expect(screen.getByText(surface.purpose)).toBeTruthy()
      expect(screen.getByText(surface.ownership)).toBeTruthy()
    })

    it(`${surface.basePath} exposes exactly one <h1> and a <main> landmark`, () => {
      render(<Component />)
      const headings = screen.getAllByRole('heading', { level: 1 })
      expect(headings).toHaveLength(1)
      expect(headings[0]?.textContent).toBe(surface.name)
      expect(screen.getByRole('main')).toBeTruthy()
    })
  }
})

// The test above only proves each page renders ITS OWN surface's text. It
// would stay green even if a page rendered its own surface AND leaked
// another one's, or if two pages were accidentally swapped in a way that
// happened to satisfy both "own identity" checks. This is the test that
// actually earns its keep: it fails if any page's rendered output contains
// another surface's name, purpose, or ownership string, verbatim.
describe('surface pages are not interchangeable', () => {
  for (const { id, Component } of PAGES) {
    const own = surfaceOf(id)
    const others = SURFACES.filter((s) => s.id !== id)

    it(`${own.basePath} renders no other surface's name, purpose or ownership`, () => {
      render(<Component />)
      for (const other of others) {
        expect(screen.queryByText(other.name)).toBeNull()
        expect(screen.queryByText(other.purpose)).toBeNull()
        expect(screen.queryByText(other.ownership)).toBeNull()
      }
    })
  }
})

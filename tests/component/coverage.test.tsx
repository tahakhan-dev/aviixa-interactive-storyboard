import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CoveragePage from '../../app/coverage/page'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import {
  UNINVENTORIED_FAMILIES,
  UNINVENTORIED_IDENTIFIERS,
} from '@/coverage/uninventoried'

// Regression guard for `registryStatus` (app/coverage/page.tsx): wraps the
// real `loadGeneratedRegistry` so exactly one registry's rows ('modules')
// can be forced, in memory only, from their real status to an all-
// `not-represented` copy -- `registries/generated/modules.json` on disk is
// never touched. The flag lives in `vi.hoisted()` state (a plain `let`
// here would be in its temporal dead zone: `vi.mock`'s factory runs before
// any of this file's own top-level statements, including a `let`
// initializer, execute). It starts (and normally stays) `false`, so every
// OTHER test in this file, including the statically-imported `CoveragePage`
// above, sees real data unchanged. Only the "mutation proof" test below
// flips it, and only inside dynamically re-imported module instances it
// explicitly requests via `vi.resetModules()`.
const mockState = vi.hoisted(() => ({ forceModulesUnrepresented: false }))

vi.mock('@/coverage/registry-loader', async () => {
  const actual = await vi.importActual<typeof import('@/coverage/registry-loader')>(
    '@/coverage/registry-loader',
  )
  return {
    ...actual,
    loadGeneratedRegistry: (slug: string) => {
      const real = actual.loadGeneratedRegistry(slug)
      if (slug === 'modules' && mockState.forceModulesUnrepresented) {
        return { ...real, rows: real.rows.map((r) => ({ ...r, status: 'not-represented' as const })) }
      }
      return real
    },
  }
})

describe('coverage dashboard', () => {
  // Brief defect, corrected: the verbatim brief used
  // `new RegExp(d.title, 'i')`, an unanchored substring match. Two real
  // descriptor titles collide under it -- "Sub-features" contains
  // "Features" as a case-insensitive substring, so
  // `getByRole('link', { name: /Features/i })` matches BOTH the "Features"
  // link and the "Sub-features" link and throws "multiple elements found".
  // Reproduced by running this test verbatim before this fix. An exact
  // (RTL default) string match on `d.title` checks the identical property
  // -- a discoverable link whose accessible name is the registry's title --
  // without the substring collision.
  it('links to every one of the fourteen registry indexes', () => {
    render(<CoveragePage />)
    for (const d of REGISTRY_DESCRIPTORS) {
      expect(screen.getByRole('link', { name: d.title }), d.slug).toBeDefined()
    }
  })

  it('has exactly one level-1 heading', () => {
    render(<CoveragePage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('never renders a green check implying a production control exists', () => {
    const { container } = render(<CoveragePage />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('✅')
    expect(text.toLowerCase()).not.toMatch(/\bproduction[- ]ready\b/)
  })

  it('states plainly that behaviour is simulated', () => {
    const { container } = render(<CoveragePage />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/simulated/)
  })

  // Task 10 / addendum §5: the dashboard's source-defined class must read
  // 63 for modules, never 81 -- 81 is the correct total reconciled count
  // and still renders in the registry table above, but the source-class
  // breakdown is a narrower, different figure.
  it('reads 63 source-defined and 18 derived for modules, never 81 for source-defined', () => {
    const { container } = render(<CoveragePage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/source-defined: 63 of 81 modules/)
    expect(text).toMatch(/derived: 18 of 81 modules/)
    expect(text).not.toMatch(/source-defined: 81/)
  })

  // Minor (final review round 2): the Build classification section had no
  // test at all -- an "honest zero" (no row anywhere has a buildClass yet)
  // reads identically to the section having silently gone missing unless
  // something pins the heading and all three rows down. All three counts
  // are genuinely 0 of 81 today; that is the correct value, not a
  // placeholder, and this test says so rather than treating 0 as absence.
  it('pins the Build classification section: heading plus all three honest-zero rows', () => {
    const { container } = render(<CoveragePage />)
    expect(screen.getByRole('heading', { name: 'Build classification' })).toBeDefined()
    const text = container.textContent ?? ''
    for (const label of ['Demonstrated in storyboard', 'Not applicable', 'Decision blocked']) {
      expect(text, label).toMatch(new RegExp(`${label}: 0 of 81 modules`))
    }
  })

  /**
   * THE UNINVENTORIED SECTION MUST REACH THE SCREEN, NOT JUST THE MODULE.
   *
   * `src/coverage/uninventoried.ts` carries slice 11 wave 5's decision that
   * four identifier families belong in none of the fourteen inventories. The
   * decision's whole point is that a reader SEES the shortfall instead of
   * inferring it, so a decision that renders nowhere is the same defect as no
   * decision — and this file's seven other tests all predate the section and
   * pass whether it renders or not.
   *
   * Deliberately NOT asserted through `container.textContent`: it concatenates
   * across element boundaries with no separator, which has made a count gate
   * unable to fail, collided two ARIA regions and hidden ten of thirty
   * identifiers in this slice alone. Each family is looked up as its own cell,
   * so a row that silently stopped rendering cannot be covered by a neighbour's
   * text.
   */
  it('renders every uninventoried family, its count and its home, as real cells', () => {
    render(<CoveragePage />)
    expect(
      screen.getByRole('heading', { name: /in none of the fourteen/i }),
    ).toBeDefined()

    for (const family of UNINVENTORIED_FAMILIES) {
      // The prefix as its own element, so a dropped row is visible.
      const cells = screen.getAllByText(new RegExp(`^${family.prefix}$`))
      expect(cells.length, `${family.prefix} renders no cell of its own`).toBeGreaterThan(0)

      // Its home paths render, each as its own element for the same reason.
      for (const path of family.heldIn) {
        expect(
          screen.getAllByText(new RegExp(`^${path}\\s*$`)).length,
          `${family.prefix} does not render its home ${path}`,
        ).toBeGreaterThan(0)
      }
    }

    // And the derived total is on the page as a number, not as prose about a
    // number. A literal here would be the very defect the section avoids, so
    // it is compared against the module's own derivation.
    expect(
      screen.getByText(new RegExp(`${UNINVENTORIED_IDENTIFIERS.length}\\s+identifiers`)),
    ).toBeDefined()
  })

  /**
   * AND THE DECISION MUST SAY IT IS A DECISION. A section that lists the
   * families without saying the omission was chosen reads as an oversight,
   * which is exactly the ambiguity this build keeps paying for.
   */
  it('names the delegated approval the choice was made under', () => {
    const { container } = render(<CoveragePage />)
    expect(container.textContent ?? '').toContain('APP-012')
  })

  // Mutation proof, kept as a live regression test rather than a one-off
  // manual check: `registryStatus` used to hardcode `'not-represented'` for
  // every registry except `workflows`, so the Reconciliation summary's
  // "Demonstrated in storyboard" count could only ever be 0 or 1 no matter
  // what any registry's own rows said. This forces `modules` -- a registry
  // that today genuinely has demonstrated rows -- to report zero
  // demonstrated rows, confirms the summary's counts move by exactly one in
  // response, then undoes the mutation and confirms the summary recovers.
  // A `registryStatus` that regresses to a constant, or back to a
  // workflows-only special case, cannot move the summary at all: `during`
  // would equal `before` and the middle assertions below would fail.
  it('mutation proof: the reconciliation summary falls when a demonstrated registry is forced to not-represented, and recovers when restored', async () => {
    async function renderSummary() {
      vi.resetModules()
      const { default: FreshCoveragePage } = await import('../../app/coverage/page')
      const { container, unmount } = render(<FreshCoveragePage />)
      const text = container.textContent ?? ''
      unmount()
      return {
        demonstrated: Number(text.match(/Demonstrated in storyboard: (\d+) of 14/)?.[1]),
        notRepresented: Number(text.match(/Not represented: (\d+) of 14/)?.[1]),
      }
    }

    mockState.forceModulesUnrepresented = false
    const before = await renderSummary()
    // Sanity check this is not the old workflows-only special case, under
    // which no mutation to `modules` could ever change anything.
    expect(before.demonstrated).toBeGreaterThan(1)

    mockState.forceModulesUnrepresented = true
    const during = await renderSummary()
    expect(during.demonstrated).toBe(before.demonstrated - 1)
    expect(during.notRepresented).toBe(before.notRepresented + 1)

    mockState.forceModulesUnrepresented = false
    const after = await renderSummary()
    expect(after.demonstrated).toBe(before.demonstrated)
    expect(after.notRepresented).toBe(before.notRepresented)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { surfaceById } from '@/domain/surfaces'
import { rolesInDomain } from '@/domain/roles'
import { DOH_MODULES, DOH_OUT_OF_SLICE_MODULES, dohModuleById } from '@/surfaces/doh/modules'
import { DOH_SCREENS } from '@/surfaces/doh/screens'
import { TENANT_STATES, type TenantState } from '@/surfaces/doh/tenant-state'
import { HubShell, type TenantRoleId } from '../../app/hub/HubShell'
import {
  SEEDED_ANNOUNCEMENTS,
  SEEDED_PLATFORM_ACCESS_SESSIONS,
  SUSPENSION_BANNERS,
} from '../../app/hub/banner-fixtures'
import HubHome, { HubShell as HubShellFromPage } from '../../app/hub/page'

const SURFACE = surfaceById('SURF-DOH')
const TENANT_ROLES = rolesInDomain('TENANT')
const OPEN_SESSION = SEEDED_PLATFORM_ACCESS_SESSIONS.find((s) => s.open)

/** The four personas the route registry admits to this surface (D11 excludes
 *  the fifth). The "offers exactly the five tenant roles" case above proves
 *  this file's role lists stay equal to `rolesInDomain('TENANT')`. */
const NON_WORKER_ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
]

function screensFor(moduleId: string): readonly string[] {
  return DOH_SCREENS.filter((s) => s.moduleId === moduleId).map((s) => s.id)
}

describe('HubShell — the module index', () => {
  it("renders the surface identity with exactly one <h1> and a <main> landmark", () => {
    render(<HubShell />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe(SURFACE.name)
    expect(screen.getByRole('main')).toBeDefined()
    expect(screen.getByText(SURFACE.purpose)).toBeDefined()
    expect(screen.getByText(SURFACE.ownership)).toBeDefined()
  })

  it('links every one of the eight in-slice modules by slug, never by a screen number', () => {
    render(<HubShell />)
    for (const m of DOH_MODULES) {
      const links = screen.getAllByRole('link', {
        name: new RegExp(`^${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      })
      expect(links.length, m.id).toBeGreaterThan(0)
      for (const link of links) {
        const href = link.getAttribute('href') ?? ''
        // next/link normalises the trailing slash outside a running Next app
        // router; the load-bearing fact is the slug, same precedent as
        // tests/component/sa-console.test.tsx.
        expect(href, m.id).toMatch(new RegExp(`^/hub/${m.slug}/?$`))
        expect(href, m.id).not.toMatch(/SCR-DOH/i)
      }
    }
  })

  it('annotates each in-slice module with its module id, its SCR-DOH-NN screens and its purpose', () => {
    render(<HubShell />)
    for (const m of DOH_MODULES) {
      const entry = screen.getByText(m.id).closest('li')
      expect(entry, m.id).not.toBeNull()
      expect(entry?.textContent, m.id).toContain(m.purpose)
      for (const screenId of screensFor(m.id)) {
        expect(entry?.textContent, `${m.id} / ${screenId}`).toContain(screenId)
      }
    }
  })

  it('renders the other eleven modules as not in this slice, naming the slice that owns each, and links none of them', () => {
    render(<HubShell />)
    const section = screen.getByText(/not in this slice/i).closest('section')
    expect(section).not.toBeNull()
    for (const m of DOH_OUT_OF_SLICE_MODULES) {
      expect(section?.textContent, m.id).toContain(m.id)
      expect(section?.textContent, m.id).toContain(m.name)
      expect(section?.textContent, m.id).toContain(m.ownedBy)
    }
    expect(within(section as HTMLElement).queryAllByRole('link')).toHaveLength(0)
  })

  it('carries the prototype disclosure', () => {
    render(<HubShell />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
  })
})

describe('HubShell — the three-slot banner region (C1)', () => {
  it('renders no suspension banner while the tenant is active', () => {
    render(<HubShell />)
    // Anchored on a banner that MUST render, so this cannot pass vacuously
    // against a shell that renders no banner region at all.
    expect(screen.getByText(SEEDED_ANNOUNCEMENTS[0]!.message)).toBeDefined()
    for (const suspended of TENANT_STATES.filter((s) => s !== 'active')) {
      const banner = SUSPENSION_BANNERS[suspended as Exclude<TenantState, 'active'>]
      expect(screen.queryByText(banner.message), suspended).toBeNull()
      expect(screen.queryByText(banner.heading), suspended).toBeNull()
    }
  })

  it('derives the suspension banner from the tenant state it is handed', () => {
    for (const state of TENANT_STATES) {
      if (state === 'active') continue
      const suspended = state as Exclude<TenantState, 'active'>
      const { unmount } = render(<HubShell tenantState={suspended} />)
      expect(screen.getByText(SUSPENSION_BANNERS[suspended].message), state).toBeDefined()
      expect(screen.getByText(SUSPENSION_BANNERS[suspended].heading), state).toBeDefined()
      unmount()
    }
  })

  it('renders the seeded announcement banner, which carries no dismiss control', () => {
    render(<HubShell />)
    const announcement = screen.getByText(/platform announcement/i).closest('div')
    expect(announcement).not.toBeNull()
    expect(within(announcement as HTMLElement).queryAllByRole('button')).toHaveLength(0)
  })

  it('D12: any signed-in tenant web user may end the seeded support session, and pressing it changes what renders', async () => {
    render(<HubShell />)
    expect(OPEN_SESSION, 'a support session must be seeded open').toBeDefined()
    expect(screen.getByText(OPEN_SESSION!.message)).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(screen.queryByText(OPEN_SESSION!.message)).toBeNull()
    expect(screen.queryByRole('button', { name: /end session/i })).toBeNull()
    // Never claim a capability that is only simulated.
    expect(screen.getByText(/no platform session was terminated/i)).toBeDefined()
  })

  it('states what is actually true of the three access classes, not a claim this build cannot show', () => {
    render(<HubShell />)
    const claim = screen.getByText(/D13/)
    const text = claim.textContent ?? ''
    // D12, on the one class this build seeds open.
    expect(text).toMatch(/D12/)
    expect(text).toMatch(/seeded open/i)
    expect(text).toMatch(/normal support session/i)
    // D13, and WHY the other two carry no control: the type, not a setting.
    expect(text).toMatch(/compliance-emergency path/i)
    expect(text).toMatch(/JBS access grant/i)
    expect(text).toMatch(/by construction, not by configuration/i)
    // The unverifiable claim this replaced.
    expect(document.body.textContent ?? '').not.toMatch(/banners cover all three/i)
  })
})

describe('HubShell — the reviewer view switcher (AC-16-12)', () => {
  it('offers exactly the five tenant roles and no platform role', () => {
    render(<HubShell />)
    const select = screen.getByLabelText('View as tenant role')
    const options = within(select as HTMLElement).getAllByRole('option')
    expect(options.map((o) => o.getAttribute('value'))).toEqual(TENANT_ROLES.map((r) => r.id))
    expect(options).toHaveLength(5)
    expect(screen.queryByRole('option', { name: /root super admin/i })).toBeNull()
    expect(screen.queryByRole('option', { name: /platform engineer/i })).toBeNull()
  })

  it('never renders an acting-as, impersonation or session-level role control, in any of its three modes', async () => {
    const modes: readonly (() => Promise<void>)[] = [
      async () => {
        render(<HubShell />)
      },
      async () => {
        render(
          <HubShell module={dohModuleById('MOD-DOH-01')}>
            <p>module body</p>
          </HubShell>,
        )
      },
      async () => {
        render(<HubShell />)
        await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')
      },
    ]
    for (const [index, mount] of modes.entries()) {
      await mount()
      const text = document.body.textContent ?? ''
      expect(text, `mode ${index}`).not.toMatch(/act(ing)? as/i)
      expect(text, `mode ${index}`).not.toMatch(/impersonat/i)
      expect(text, `mode ${index}`).not.toMatch(/switch role|role selector/i)
      expect(screen.getByText(/AC-16-12/), `mode ${index}`).toBeDefined()
      cleanup()
    }
  })

  it('says on screen that changing the view performs no product action and alters no audit actor', () => {
    render(<HubShell />)
    expect(screen.getByText(/no product action/i)).toBeDefined()
    expect(screen.getByText(/audit actor/i)).toBeDefined()
  })
})

describe('HubShell — the Worker view (D11, DEC-WKRVIEW-001)', () => {
  it('renders the Hub as not-a-Hub-user and withholds the module body', async () => {
    render(
      <HubShell module={dohModuleById('MOD-DOH-04')}>
        <p>module body</p>
      </HubShell>,
    )
    expect(screen.getByText('module body')).toBeDefined()
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')
    expect(screen.queryByText('module body')).toBeNull()
    expect(screen.getByText(/no Hub screen/i)).toBeDefined()
  })

  it('states the cost of that on screen, and that DEC-WKRVIEW-001 is open', async () => {
    render(<HubShell />)
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')
    expect(screen.getByText(/cannot check their own certification expiry/i)).toBeDefined()
    expect(screen.getByText(/DEC-WKRVIEW-001/)).toBeDefined()
    expect(screen.getByText(/D11/)).toBeDefined()
  })

  it('is offered no banner region either, so no live End-session control reaches it', async () => {
    render(<HubShell />)
    // Present for the persona that does reach the Hub...
    expect(screen.getByRole('button', { name: /end session/i })).toBeDefined()
    expect(screen.getByText(SEEDED_ANNOUNCEMENTS[0]!.message)).toBeDefined()

    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')

    // ...and gone for the persona the shell has just declared reaches nothing.
    expect(screen.queryByRole('button', { name: /end session/i })).toBeNull()
    expect(screen.queryByText(SEEDED_ANNOUNCEMENTS[0]!.message)).toBeNull()
    expect(screen.queryByText(OPEN_SESSION!.message)).toBeNull()
  })

  it('shows no suspension banner either, on a suspended tenant', async () => {
    render(<HubShell tenantState="hard-suspended" />)
    expect(screen.getByText(SUSPENSION_BANNERS['hard-suspended'].message)).toBeDefined()
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')
    expect(screen.queryByText(SUSPENSION_BANNERS['hard-suspended'].message)).toBeNull()
  })

  it('still carries the prototype disclosure, which every screen must', async () => {
    render(<HubShell />)
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
  })

  it('withholds the module index too, and keeps the view switcher reachable', async () => {
    render(<HubShell />)
    const select = screen.getByLabelText('View as tenant role')
    await userEvent.selectOptions(select, 'WORKER')
    expect(screen.queryByText(DOH_MODULES[0]!.purpose)).toBeNull()
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'TENANT_ADMIN')
    expect(screen.getByText(DOH_MODULES[0]!.purpose)).toBeDefined()
  })
})

describe('HubShell — module mode, the contract Tasks 3-10 code against', () => {
  const module = dohModuleById('MOD-DOH-02')

  it("renders the module's own header and children instead of the index", () => {
    render(
      <HubShell module={module}>
        <p>module body</p>
      </HubShell>,
    )
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent).toBe(module.name)
    expect(screen.getByText(module.purpose)).toBeDefined()
    expect(screen.getByText('module body')).toBeDefined()
    expect(screen.queryByText(/not in this slice/i)).toBeNull()
    expect(screen.queryByText(dohModuleById('MOD-DOH-03').purpose)).toBeNull()
  })

  it('shows the module id and its SCR-DOH-NN annotation, and breadcrumbs back to /hub/', () => {
    render(<HubShell module={module}>{null}</HubShell>)
    expect(screen.getByText(new RegExp(module.id))).toBeDefined()
    for (const screenId of screensFor(module.id)) {
      expect(screen.getByText(new RegExp(screenId))).toBeDefined()
    }
    const crumbs = screen.getByRole('navigation', { name: /breadcrumb/i })
    const back = within(crumbs).getByRole('link', { name: SURFACE.name })
    expect(back.getAttribute('href')).toBe('/hub/')
  })

  it('is a controlled view switcher: a supplied role and handler drive it, the shell keeps no second copy', async () => {
    const onRoleChange = vi.fn()
    render(
      <HubShell module={module} role="SUPERVISOR" onRoleChange={onRoleChange}>
        <p>module body</p>
      </HubShell>,
    )
    const select = screen.getByLabelText('View as tenant role') as HTMLSelectElement
    expect(select.value).toBe('SUPERVISOR')
    await userEvent.selectOptions(select, 'QUALITY_MANAGER')
    expect(onRoleChange).toHaveBeenCalledWith('QUALITY_MANAGER')
    // The parent owns the state, so an unchanged prop leaves the control unchanged.
    expect((screen.getByLabelText('View as tenant role') as HTMLSelectElement).value).toBe('SUPERVISOR')
  })

  it('marks its own entry current in the shared module rail', () => {
    render(<HubShell module={module}>{null}</HubShell>)
    const current = screen.getAllByRole('link', { name: module.name }).filter((l) => l.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
  })
})

describe('HubShell — the module rail is navigation, and renders only where it navigates', () => {
  const module = dohModuleById('MOD-DOH-03')

  it('renders no rail on the index, where the module list already carries more than the rail does', () => {
    render(<HubShell />)
    expect(screen.queryByRole('navigation', { name: 'Hub modules' })).toBeNull()
    // Each module is therefore linked exactly once on the index, by the list.
    for (const m of DOH_MODULES) {
      expect(
        screen.getAllByRole('link', {
          name: new RegExp(`^${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        }),
        m.id,
      ).toHaveLength(1)
    }
  })

  it('renders the rail on a module route, listing all eight modules', () => {
    render(<HubShell module={module}>{null}</HubShell>)
    const rail = screen.getByRole('navigation', { name: 'Hub modules' })
    expect(within(rail).getAllByRole('link')).toHaveLength(DOH_MODULES.length)
  })

  it('D11: offers no Hub navigation to the Worker, and offers it to the other four', async () => {
    for (const roleId of NON_WORKER_ROLES) {
      const { unmount } = render(
        <HubShell module={module} role={roleId} onRoleChange={() => {}}>
          <p>module body</p>
        </HubShell>,
      )
      expect(screen.getByRole('navigation', { name: 'Hub modules' }), roleId).toBeDefined()
      unmount()
    }

    render(
      <HubShell module={module}>
        <p>module body</p>
      </HubShell>,
    )
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'WORKER')
    expect(screen.queryByRole('navigation', { name: 'Hub modules' })).toBeNull()
    expect(screen.queryByText('module body')).toBeNull()
    expect(screen.getByText(/cannot check their own certification expiry/i)).toBeDefined()
    expect(screen.getByText(/DEC-WKRVIEW-001/)).toBeDefined()

    // A reviewer who selects Worker must be able to get back out.
    await userEvent.selectOptions(screen.getByLabelText('View as tenant role'), 'SUPERVISOR')
    expect(screen.getByRole('navigation', { name: 'Hub modules' })).toBeDefined()
    expect(screen.getByText('module body')).toBeDefined()
  })
})

describe('app/hub/page.tsx', () => {
  it('re-exports HubShell so a component test can import it', () => {
    render(<HubShellFromPage />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(SURFACE.name)
  })

  it('renders the module index as the /hub/ route body', () => {
    render(<HubHome />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(SURFACE.name)
    expect(screen.getByText(DOH_MODULES[0]!.purpose)).toBeDefined()
  })
})

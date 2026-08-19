import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BannerRegion, type HubBanner } from '@/ui/doh/BannerRegion'
import { HubChrome } from '@/ui/doh/HubChrome'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { DOH_MODULES } from '@/surfaces/doh/modules'
import { DOH_SEAMS } from '@/surfaces/doh/seams'

describe('BannerRegion — the three-slot banner region and nothing more', () => {
  it('renders nothing when there are no active banners', () => {
    const { container } = render(<BannerRegion banners={[]} />)
    expect(container.textContent).toBe('')
  })

  it('renders a suspension banner naming the cause', () => {
    const banners: readonly HubBanner[] = [
      { kind: 'suspension', tenantState: 'soft-suspended', heading: 'Tenant suspended', message: '30 days of non-payment.' },
    ]
    render(<BannerRegion banners={banners} />)
    expect(screen.getByText('30 days of non-payment.')).toBeDefined()
  })

  it('D12/D13: renders End-session only on the normal support-session class', async () => {
    const onEndSession = vi.fn()
    const banners: readonly HubBanner[] = [
      { kind: 'support-session', accessClass: 'normal-support-session', message: 'A platform engineer is viewing your workspace.', onEndSession },
    ]
    render(<BannerRegion banners={banners} />)
    const button = screen.getByRole('button', { name: /end session/i })
    await userEvent.click(button)
    expect(onEndSession).toHaveBeenCalledOnce()
  })

  it('D13: the compliance-emergency class carries no End-session control at all', () => {
    const banners: readonly HubBanner[] = [
      { kind: 'support-session', accessClass: 'compliance-emergency-path', message: 'A dual-authorised compliance-emergency access is open.' },
    ]
    render(<BannerRegion banners={banners} />)
    expect(screen.getByText(/compliance-emergency access is open/)).toBeDefined()
    expect(screen.queryByRole('button', { name: /end session/i })).toBeNull()
  })

  it('renders an announcement banner with no mute control (AC-SA-14-02)', () => {
    const banners: readonly HubBanner[] = [{ kind: 'announcement', message: 'Scheduled maintenance Saturday.' }]
    render(<BannerRegion banners={banners} />)
    expect(screen.getByText('Scheduled maintenance Saturday.')).toBeDefined()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('HubChrome — the shared banner region and module rail', () => {
  it('lists all eight in-slice modules as navigable links, keyed by slug', () => {
    // Task 2 fix 1: the rail is navigation and renders on a module route
    // only, so this case now names one. The assertion is unchanged -- the
    // rail lists all eight whichever one is current.
    render(
      <HubChrome banners={[]} role="TENANT_ADMIN" activeModuleId="MOD-DOH-01">
        <p>content</p>
      </HubChrome>,
    )
    for (const m of DOH_MODULES) {
      const link = screen.getByRole('link', { name: m.name })
      // next/link normalises the trailing slash outside a running Next app
      // router; the load-bearing fact here is the slug, same precedent as
      // tests/component/sa-console.test.tsx.
      expect(link.getAttribute('href')).toMatch(new RegExp(`^/hub/${m.slug}/?$`))
    }
  })

  it('marks the active module with aria-current, and no other', () => {
    render(
      <HubChrome banners={[]} role="TENANT_ADMIN" activeModuleId="MOD-DOH-03">
        <p>content</p>
      </HubChrome>,
    )
    expect(screen.getByRole('link', { name: 'Shift Management' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Location Configuration' }).getAttribute('aria-current')).toBeNull()
  })

  it('renders its children beneath the chrome', () => {
    render(
      <HubChrome banners={[]} role="TENANT_ADMIN">
        <p>module body</p>
      </HubChrome>,
    )
    expect(screen.getByText('module body')).toBeDefined()
  })

  it('renders banners passed through to the banner region', () => {
    const banners: readonly HubBanner[] = [{ kind: 'announcement', message: 'Read me.' }]
    render(
      <HubChrome banners={banners} role="TENANT_ADMIN">
        <p>content</p>
      </HubChrome>,
    )
    expect(screen.getByText('Read me.')).toBeDefined()
  })
})

describe('SeamNotice — a named cross-slice interface, never a silent stub', () => {
  it('renders the owning module and slice for every one of the five named seams', () => {
    for (const seam of DOH_SEAMS) {
      const { unmount, container } = render(<SeamNotice seamId={seam.id} />)
      expect(container.textContent, seam.id).toMatch(new RegExp(`slice ${seam.ownerSlice}`, 'i'))
      unmount()
    }
  })

  it('names which slice owns the Platform Access History audit seam', () => {
    const { container } = render(<SeamNotice seamId="platform-access-history-audit" />)
    expect(container.textContent).toMatch(/MOD-DOH-11/)
    expect(container.textContent).toMatch(/slice 10/i)
  })
})

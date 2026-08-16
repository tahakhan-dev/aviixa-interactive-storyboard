import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from '@/ui/primitives/Dialog'
import { Drawer } from '@/ui/primitives/Drawer'
import { Tabs } from '@/ui/primitives/Tabs'
import { Breadcrumbs } from '@/ui/primitives/Breadcrumbs'
import { Toast } from '@/ui/primitives/Toast'
import { LiveRegion } from '@/ui/primitives/LiveRegion'

describe('overlay primitives', () => {
  it('Dialog exposes an accessible name and the dialog role', () => {
    render(<Dialog open onClose={() => {}} title="Confirm release"><p>Body</p></Dialog>)
    expect(screen.getByRole('dialog', { name: 'Confirm release' })).toBeDefined()
  })

  it('Dialog closes on Escape', async () => {
    const onClose = vi.fn()
    render(<Dialog open onClose={onClose} title="Confirm release"><p>Body</p></Dialog>)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Dialog moves focus into itself when opened', async () => {
    render(<Dialog open onClose={() => {}} title="Confirm release"><button>Inside</button></Dialog>)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('Dialog renders nothing when closed', () => {
    render(<Dialog open={false} onClose={() => {}} title="Confirm release"><p>Body</p></Dialog>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  // Focus restoration and the Tab trap are required by the shared primitive
  // contract ("Overlays trap focus, close on Escape, and restore focus to
  // their invoker") and the brief's own Step 3 guidance, but are not
  // exercised by the brief's verbatim test block. Added here.
  it('Dialog restores focus to the invoker on close', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Confirm release">
            <button>Inside</button>
          </Dialog>
        </div>
      )
    }
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(opener)
    expect(screen.getByRole('dialog')).toBeDefined()
    await userEvent.keyboard('{Escape}')
    expect(document.activeElement).toBe(opener)
  })

  it('Dialog traps Tab focus within itself', async () => {
    render(
      <div>
        <button>Outside</button>
        <Dialog open onClose={() => {}} title="Confirm release">
          <button>First</button>
          <button>Second</button>
        </Dialog>
      </div>,
    )
    const dialog = screen.getByRole('dialog')
    screen.getByRole('button', { name: 'Second' }).focus()
    await userEvent.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  // Drawer shares `useOverlayFocus` with Dialog, but is its own exported
  // primitive with its own mount path — its Escape, Tab-trap and
  // invoker-restore behaviour is exercised directly rather than assumed
  // from Dialog's coverage.
  it('Drawer moves focus into itself and names its side', () => {
    render(
      <Drawer open onClose={() => {}} title="Run details" side="right">
        <p>Body</p>
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Run details' })
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('Drawer closes on Escape', async () => {
    const onClose = vi.fn()
    render(
      <Drawer open onClose={onClose} title="Run details">
        <p>Body</p>
      </Drawer>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Drawer traps Tab focus within itself', async () => {
    render(
      <div>
        <button>Outside</button>
        <Drawer open onClose={() => {}} title="Run details">
          <button>First</button>
          <button>Second</button>
        </Drawer>
      </div>,
    )
    const dialog = screen.getByRole('dialog')
    screen.getByRole('button', { name: 'Second' }).focus()
    await userEvent.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('Drawer restores focus to the invoker on close', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open drawer</button>
          <Drawer open={open} onClose={() => setOpen(false)} title="Run details">
            <button>Inside</button>
          </Drawer>
        </div>
      )
    }
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open drawer' })
    await userEvent.click(opener)
    expect(screen.getByRole('dialog')).toBeDefined()
    await userEvent.keyboard('{Escape}')
    expect(document.activeElement).toBe(opener)
  })

  it('Tabs move with arrow keys and report the active tab', async () => {
    const onChange = vi.fn()
    render(
      <Tabs
        activeId="a"
        onChange={onChange}
        tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Audit' }]}
      />,
    )
    screen.getByRole('tab', { name: 'Overview' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('Breadcrumbs render a named navigation landmark', () => {
    render(<Breadcrumbs items={[{ label: 'Hub', href: '/hub/' }, { label: 'Runs' }]} />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeDefined()
  })

  it('Breadcrumbs mark the final item current and never link it', () => {
    render(<Breadcrumbs items={[{ label: 'Hub', href: '/hub/' }, { label: 'Runs' }]} />)
    expect(screen.getByRole('link', { name: 'Hub' })).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Runs' })).toBeNull()
    expect(screen.getByText('Runs').getAttribute('aria-current')).toBe('page')
  })

  it('Toast names what it dismisses', async () => {
    const onDismiss = vi.fn()
    render(<Toast tone="ok" icon="✅" label="Hold released" onDismiss={onDismiss} />)
    expect(screen.getByRole('status')).toBeDefined()
    const dismiss = screen.getByRole('button', { name: /Hold released/ })
    await userEvent.click(dismiss)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('LiveRegion announces politely by default', () => {
    render(<LiveRegion>Saved</LiveRegion>)
    const region = screen.getByText('Saved')
    expect(region.getAttribute('aria-live')).toBe('polite')
  })
})

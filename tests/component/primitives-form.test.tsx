import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/ui/primitives/Button'
import { Field } from '@/ui/primitives/Field'
import { Select } from '@/ui/primitives/Select'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { Table } from '@/ui/primitives/Table'

describe('form primitives', () => {
  it('Button is operable by keyboard and has an accessible name', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Release hold</Button>)
    const b = screen.getByRole('button', { name: 'Release hold' })
    b.focus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('a disabled Button states its reason and is not silently inert', () => {
    render(<Button disabledReason="Only a Quality Manager can release a hold.">Release hold</Button>)
    const b = screen.getByRole('button', { name: /Release hold/ })
    expect(b.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText('Only a Quality Manager can release a hold.')).toBeDefined()
  })

  it('a disabled Button does not fire its handler', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabledReason="Not your role.">Go</Button>)
    await userEvent.click(screen.getByRole('button', { name: /Go/ }))
    expect(onClick).not.toHaveBeenCalled()
  })

  // Button's `loading` prop is part of the declared interface but not exercised
  // by the brief's verbatim test block. Added to satisfy the shared contract's
  // "every declared state is rendered and asserted" rule.
  it('a loading Button is marked busy and does not fire its handler', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} loading>Go</Button>)
    const b = screen.getByRole('button', { name: /Go/ })
    expect(b.getAttribute('aria-busy')).toBe('true')
    await userEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('Field associates its error with the input for assistive technology', () => {
    render(
      <Field label="Torque" error="Must be between 8 and 12 newton metres.">
        <input id="torque" />
      </Field>,
    )
    const input = screen.getByLabelText('Torque')
    const describedBy = input.getAttribute('aria-describedby') ?? ''
    expect(describedBy.length).toBeGreaterThan(0)
    expect(screen.getByText(/between 8 and 12/)).toBeDefined()
  })

  // Select and Checkbox are in Task 4's file list but not exercised by the
  // brief's verbatim test block. Added minimally for accessible-name and
  // keyboard-operability coverage per the shared primitive contract.
  it('Select has an accessible name and reports the chosen value', async () => {
    const onChange = vi.fn()
    render(
      <Select
        label="Shift"
        options={[{ value: 'day', label: 'Day' }, { value: 'night', label: 'Night' }]}
        value="day"
        onChange={onChange}
      />,
    )
    const select = screen.getByLabelText('Shift')
    await userEvent.selectOptions(select, 'night')
    expect(onChange).toHaveBeenCalledWith('night')
  })

  it('Checkbox has an accessible name and is operable by keyboard', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Confirm hold released" checked={false} onChange={onChange} />)
    const box = screen.getByRole('checkbox', { name: 'Confirm hold released' })
    box.focus()
    await userEvent.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('Table renders its empty state rather than an empty grid', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[]}
        emptyState={{ title: 'No runs are scheduled.', whatCreatesIt: 'Runs are created in Run Scheduling.' }}
      />,
    )
    expect(screen.getByText('No runs are scheduled.')).toBeDefined()
    expect(screen.queryByRole('row')).toBeNull()
  })

  it('Table distinguishes empty from no-match-after-filter', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[]}
        filtered
        emptyState={{ title: 'No runs are scheduled.', whatCreatesIt: 'Runs are created in Run Scheduling.' }}
      />,
    )
    expect(screen.getByText(/no runs match/i)).toBeDefined()
  })

  it('Table has an accessible caption', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[{ id: 'RUN-1' }]}
        emptyState={{ title: 'x', whatCreatesIt: 'y' }}
      />,
    )
    expect(screen.getByRole('table', { name: 'Scheduled runs' })).toBeDefined()
  })

  // Table's `loading` and `error` props are part of the declared interface but
  // not exercised by the brief's verbatim test block. Added per the shared
  // contract and the brief's own Step 3 guidance ("Loading renders
  // SkeletonBlock, never a zero-row grid").
  it('Table renders a skeleton while loading, never a zero-row grid', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[]}
        loading
        emptyState={{ title: 'x', whatCreatesIt: 'y' }}
      />,
    )
    expect(screen.getByText(/Loading Scheduled runs/)).toBeDefined()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('Table renders its error rather than an empty grid', () => {
    render(
      <Table
        caption="Scheduled runs"
        columns={[{ key: 'id', header: 'Run' }]}
        rows={[]}
        error="Could not load scheduled runs."
        emptyState={{ title: 'x', whatCreatesIt: 'y' }}
      />,
    )
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('Could not load scheduled runs.')).toBeDefined()
  })
})

// Slice 3, re-verification of the MOD-SA-01 fix round. A module wrote the
// STATE-06 copy "every input is disabled while the module is read-only" and it
// could never be true: Select accepted no `disabled` prop and spread no rest
// props, so its own doc comment -- "States: default, focus, disabled -- all
// native" -- asserted a capability the component did not have. That is the
// seventeenth comment this build has found claiming something the code does
// not do, and the first in a shared primitive, where it silently blocked
// STATE-06 on every surface rather than one screen.
describe('Select — disabled is a real state, not a claim in a comment', () => {
  it('forwards disabled to the native element so a read-only state can hold', () => {
    render(
      <Select
        label="Screen state"
        options={[{ value: 'a', label: 'A' }]}
        value="a"
        onChange={() => {}}
        disabled
      />,
    )
    expect((screen.getByLabelText('Screen state') as HTMLSelectElement).disabled).toBe(true)
  })

  it('is enabled by default, so the prop is opt-in', () => {
    render(
      <Select label="Tenant filter" options={[{ value: 'a', label: 'A' }]} value="a" onChange={() => {}} />,
    )
    expect((screen.getByLabelText('Tenant filter') as HTMLSelectElement).disabled).toBe(false)
  })
})

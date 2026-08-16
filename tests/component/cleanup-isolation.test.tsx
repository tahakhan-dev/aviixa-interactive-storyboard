import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Regression guard for the global `setupFiles` cleanup wired into the
// component project in vitest.config.ts via tests/setup.ts. Two `it()`s in
// ONE file, not two files: Vitest gives every test FILE its own fresh jsdom
// document by default (`test.isolate`), so cross-file DOM bleed cannot
// happen regardless of cleanup — only WITHIN a file, across `it()`s sharing
// one document, can a leaked node from a prior test corrupt a later query.
// That within-file case is the real defect this project hit (see the
// task-3-5 fix-round-1 report) and the only case that can prove the fix.
describe('component-project DOM cleanup between tests', () => {
  it('renders one shared-name control', () => {
    render(<button>Shared control</button>)
    expect(screen.getByRole('button', { name: 'Shared control' })).toBeDefined()
  })

  it('sees exactly one shared-name control, not a stale one left by the previous test', () => {
    render(<button>Shared control</button>)
    expect(screen.getAllByRole('button', { name: 'Shared control' })).toHaveLength(1)
  })
})

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Single global mechanism for the component project: every rendered tree is
// unmounted after each test. Without this, DOM nodes from one test persist
// into the next (same jsdom document across tests in a file), so a later
// `getByRole`/`queryByRole` can silently see a PRIOR test's elements. See
// tests/component/cleanup-isolation.test.tsx for a regression check that
// fails if this file stops being wired up.
afterEach(cleanup)

import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { OverviewScreen } from './OverviewScreen'

export const metadata: Metadata = { title: `${saModuleById('MOD-SA-01').name} — Super Admin Platform Console` }

// Re-exported so tests/component/sa-overview.test.tsx can import the screen
// itself, matching the pattern `app/workflows/page.tsx` set: the screen needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { OverviewScreen }

export default function PlatformOverviewAndHealthPage() {
  return <OverviewScreen />
}

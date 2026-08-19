import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { PlatformAdministrationScreen } from './PlatformAdministrationScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-13').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-platform-admin.test.tsx can import the
// screen itself: it needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { PlatformAdministrationScreen }

export default function PlatformAdministrationPage() {
  return <PlatformAdministrationScreen />
}

import type { Metadata } from 'next'
import { dohModuleById } from '@/surfaces/doh/modules'
import { PermissionsScreen } from './PermissionsScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-09').name} — Delivery Operations Hub`,
}

// Re-exported so tests/component/doh-permissions.test.tsx can import the
// screen itself: the screen needs `useState`, so it lives in its own
// `'use client'` file, and a file carrying `'use client'` cannot also export
// `metadata`. The route is keyed on the MOD-DOH-09 module slug, never on a
// screen number (D1).
export { PermissionsScreen }

export default function PermissionsPage() {
  return <PermissionsScreen />
}

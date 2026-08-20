import type { Metadata } from 'next'
import { dohModuleById } from '@/surfaces/doh/modules'
import { LocationConfigurationScreen } from './LocationConfigurationScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-02').name} — Delivery Operations Hub`,
}

// Re-exported so tests/component/doh-locations.test.tsx can import the screen
// itself: the screen needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { LocationConfigurationScreen }

export default function LocationConfigurationPage() {
  return <LocationConfigurationScreen />
}

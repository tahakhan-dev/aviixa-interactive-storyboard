import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { QualificationCalendarScreen } from './QualificationCalendarScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-14').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-calendar.test.tsx can import the screen
// itself: it needs `useState`, so it lives in its own `'use client'` file, and
// a file carrying `'use client'` cannot also export `metadata`.
export { QualificationCalendarScreen }

export default function QualificationCalendarPage() {
  return <QualificationCalendarScreen />
}

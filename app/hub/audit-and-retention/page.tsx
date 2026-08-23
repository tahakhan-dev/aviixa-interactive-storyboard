import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { AuditAndRetentionScreen, SCREEN_TITLE } from './AuditAndRetentionScreen'

// No module id in the title: an id is an annotation and never a name (D1),
// and `HubShell` is the one place that prints it. The title carries catalogue
// B's own screen name for `SCR-DOH-20` (L48114), which is what a browser tab
// is naming.
export const metadata: Metadata = {
  title: `${SCREEN_TITLE} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported for `tests/component/doh-11.test.tsx`: the screen needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { AuditAndRetentionScreen }

export default function AuditAndRetentionPage() {
  return <AuditAndRetentionScreen />
}

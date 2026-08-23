import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { NotificationsScreen } from './NotificationsScreen'
import { SCREEN_TITLE } from './fixtures'

// No module id in the title: an id is an annotation and never a name (D1),
// and `HubShell` is the one place that prints it. `SCREEN_TITLE` names the
// screen across both of its halves, for the reason `./fixtures` records.
export const metadata: Metadata = {
  title: `${SCREEN_TITLE} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported for `tests/component/doh-10.test.tsx`: the screen needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { NotificationsScreen }

export default function NotificationsPage() {
  return <NotificationsScreen />
}

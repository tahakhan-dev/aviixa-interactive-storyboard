import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { DevicesScreen } from './DevicesScreen'

// No module id in this title, deliberately: this screen group claims no
// module (D5) and its identifier appears in neither screen catalogue (D4) —
// reconfirmed against the current registry in `DevicesScreen.tsx`'s own
// header comment, Task 5 (unit-02).
export const metadata: Metadata = {
  title: `Devices — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so the screen itself stays importable directly — a file
// carrying `'use client'` (required for hooks) cannot also export
// `metadata`, the same split every screen in this surface uses.
export { DevicesScreen }

export default function DevicesPage() {
  return <DevicesScreen />
}

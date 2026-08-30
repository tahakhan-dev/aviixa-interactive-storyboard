import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { SupportSessionScreen } from './SupportSessionScreen'

// No module id in this title, deliberately — matching `app/hub/devices/page.tsx`'s
// own precedent: this screen group claims no module and appears in no
// screen catalogue. It exists only while a support session
// (`repository.ts#openSupportSession`) is open.
export const metadata: Metadata = {
  title: `Support session — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so the screen itself stays importable directly, matching
// every other route in this surface.
export { SupportSessionScreen }

export default function SupportSessionPage() {
  return <SupportSessionScreen />
}

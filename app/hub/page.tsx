import type { Metadata } from 'next'
import { routeBySurface } from '@/routes/definitions'
import { HubShell } from './HubShell'

// M2: sourced from the route registry, not a second hand-typed string.
export const metadata: Metadata = { title: routeBySurface('SURF-DOH').title }

// Re-exported so tests/component/doh-shell.test.tsx (and any other caller)
// can `import { HubShell } from '../../app/hub/page'`, exactly as
// `app/super-admin/page.tsx` re-exports `SaConsoleShell`.
export { HubShell }

export default function HubHome() {
  return <HubShell />
}

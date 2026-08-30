import type { Metadata } from 'next'
import { routeBySurface } from '@/routes/definitions'
import { SaConsoleShell } from './SaConsoleShell'

// M2: sourced from the route registry, not a second hand-typed string.
export const metadata: Metadata = { title: routeBySurface('SURF-SA').title }

// Re-exported so tests/component/sa-console.test.tsx (and any other caller)
// can `import { SaConsoleShell } from '../../app/super-admin/page'`,
// matching the precedent `app/workflows/page.tsx` set for `WorkflowIndex`.
export { SaConsoleShell }

export default function SuperAdminHome() {
  return <SaConsoleShell />
}

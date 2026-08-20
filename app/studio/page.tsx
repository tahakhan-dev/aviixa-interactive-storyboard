import type { Metadata } from 'next'
import { routeBySurface } from '@/routes/definitions'
import { StudioShell } from './StudioShell'

// M2: sourced from the route registry, not a second hand-typed string.
export const metadata: Metadata = { title: routeBySurface('SURF-STU').title }

// Re-exported so tests/component/stu-shell.test.tsx (and any other caller)
// can `import { StudioShell } from '../../app/studio/page'`, exactly as
// `app/hub/page.tsx` re-exports `HubShell`.
export { StudioShell }

/**
 * The Studio module index. Plan C1 — this route already existed as a
 * surface stub that listed nothing; the eighteen module tasks that follow
 * need an index that names every module, its annotation and whether its
 * route is built, so the stub is replaced by the shell in its index mode.
 */
export default function StudioHome() {
  return <StudioShell />
}

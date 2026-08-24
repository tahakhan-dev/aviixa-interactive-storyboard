import type { Metadata } from 'next'
import { AiAndItsAbsenceScreen } from './AiAndItsAbsenceScreen'
import { AI_AND_ITS_ABSENCE_ROUTE } from './scope'

// A NON-MODULE ROUTE, AND A DERIVED ONE. Section 44A is source-defined and
// exactly bounded, but the frozen source names no screen that holds its thirty
// storyboards together and carries no URL notation for one, so the page itself
// is a client-delegated choice under APP-012 and says so above the fold. The
// module inventory is unchanged by this route: this chapter mints no module
// identifier and no `MOD-*` literal is written anywhere in this directory, which
// `tests/unit/ai-and-its-absence-route.test.ts` holds it to for the same reason
// the incident route has the same gate -- `scripts/build-registries.mjs` reads a
// mention as ownership evidence.
//
// The title carries its area the way the surface consoles carry theirs, so a
// reviewer with several tabs open can tell which page a tab belongs to.
export const metadata: Metadata = {
  title: `${AI_AND_ITS_ABSENCE_ROUTE.title} — Workflow Index`,
}

// Re-exported for tests, matching the pattern `app/workflows/page.tsx` already
// established for `WorkflowIndex`.
export { AiAndItsAbsenceScreen }

export default function AiAndItsAbsencePage() {
  return <AiAndItsAbsenceScreen />
}

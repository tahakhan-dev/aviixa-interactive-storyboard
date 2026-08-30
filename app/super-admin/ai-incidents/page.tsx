import type { Metadata } from 'next'
import { AiIncidentConsoleScreen } from './AiIncidentConsoleScreen'
import { INCIDENT_ROUTE } from './fixtures'

// A NON-MODULE ROUTE, DELIBERATELY. `SB-43-351` (L91276) storyboards one screen
// and no module identifier claims it anywhere in the frozen source, so nothing
// here mints one and the module inventory is unchanged by this route. The next
// Super Admin number is recorded as deliberately absent in
// `src/surfaces/sa/modules.ts`, which is where that refusal belongs.
//
// NO MODULE IDENTIFIER IS WRITTEN IN THIS DIRECTORY, AND THAT IS ENFORCED
// ELSEWHERE. `scripts/build-registries.mjs` reads `MOD-*` mentions in a route's
// own files as OWNERSHIP evidence, so naming one here — even in a sentence
// refusing to mint it — hands this route to a module that does not own it.
// `tests/unit/ai-controls-route-ownership.test.ts` holds the directory to that.
//
// The slug itself is this build's, not the source's — the frozen source carries
// no URL notation for this surface at all — and the screen says so above the
// fold. See `INCIDENT_ROUTE.sourceStatus`.
//
// The console name is the literal every route on this surface writes, and
// `tests/coverage/slice-03-gates.test.ts` reads the page source for it: one
// tab-title shape across the surface, so a reviewer with several tabs open can
// tell which console a tab belongs to.
export const metadata: Metadata = {
  title: `${INCIDENT_ROUTE.title} — Super Admin Platform Console`,
}

// NO ROLE IS PINNED HERE, AND THAT IS THE FIX TO A REAL DEFECT. This line read
// `<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />`, which decided for every
// reader of this route that they saw the root column of the failure-response
// matrix and offered no way off it. Every other Super Admin route ships a
// `View as platform role` control; this one shipped none, and
// `tests/accessibility/axe-states.spec.ts` compares the set of routes with no
// viewer control against a recorded list by equality in both directions, so it
// went red and was right to. The screen now owns the control and opens on its
// own stated default — the least-privileged role — so the route hands a reader
// a switch rather than a decision already made for them.
export default function AiIncidentsPage() {
  return <AiIncidentConsoleScreen />
}

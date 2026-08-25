import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { AuditAndRetentionScreen } from './AuditAndRetentionScreen'

// R4-C01. THIS LITERAL IS NOT A DUPLICATE OF ANYTHING, AND IT USED TO BE AN
// IMPORT FROM THE `'use client'` SCREEN MODULE. Next replaces a client export
// read on the server with a throwing client-reference proxy, and the template
// literal below stringified that proxy straight into the browser tab: this
// page shipped `function(){throw Error("Attempted to call SCREEN_TITLE() from
// the server but SCREEN_TITLE is on the client. ...")} — Delivery Operations
// Hub` as its `<title>`. The screen component never read the constant, so
// there is nothing to share and no second copy to drift — `app/hub/devices`
// keeps its title out of the client module the same way, in `fixtures.ts`.
// `tests/unit/routes.test.ts` now rejects any page whose metadata reads a
// binding from a client module, over all 87 pages rather than five.
const SCREEN_TITLE = 'Audit log explorer'

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

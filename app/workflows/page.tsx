import type { Metadata } from 'next'
import { WorkflowIndex } from './WorkflowIndex'

export const metadata: Metadata = { title: 'Workflow Index' }

// Re-exported so tests/component/ai-and-its-absence-route.test.tsx (and any
// other caller) can `import { WorkflowIndex } from '../../app/workflows/page'`,
// matching the same pattern Task 9 established for `RegistryIndex` in
// `app/coverage/[registry]/page.tsx`. `WorkflowIndex` itself lives in its
// own `'use client'` file (./WorkflowIndex.tsx) because it holds `DataTable`
// filter state -- and a file with `'use client'` cannot also export
// `metadata`, which this page still needs to. A Server Component page
// re-exporting and rendering a Client Component is the standard Next.js
// App Router boundary; this file stays a Server Component throughout.
export { WorkflowIndex }

export default function WorkflowIndexPage() {
  return <WorkflowIndex />
}

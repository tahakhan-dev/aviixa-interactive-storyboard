import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allWorkflowIndexIds, getWorkflowIndexRow } from '@/registry/workflow-index'
import { WorkflowCard } from './WorkflowCard'

interface WorkflowParams {
  workflowId: string
}

/**
 * Task 17 — one route per row in `registries/generated/workflows.json`
 * (724 today), so the set stays finite and build-time known under
 * `output: 'export'` (§4.2: static export has no fallback render). Same
 * shape as `app/coverage/[registry]/page.tsx`'s `generateStaticParams`.
 */
export function generateStaticParams(): WorkflowParams[] {
  return allWorkflowIndexIds().map((workflowId) => ({ workflowId }))
}

// Never fall back to on-demand rendering for an id outside the generated
// set — there is no server at runtime to render one anyway.
export const dynamicParams = false

/**
 * `params.workflowId` ARRIVES PERCENT-ENCODED AT RENDER TIME, even though
 * `generateStaticParams` above returns (and the static export correctly
 * writes output files under) the literal decoded id. Verified live: a
 * bare-bones probe page rendered `params.workflowId` as the string
 * `"SB-001%40L61090"`, not `"SB-001@L61090"`, which made every lookup
 * against `getWorkflowIndexRow` miss and every one of the 724 pages 404 at
 * build time (`pnpm build` still exited 0 — Next writes a
 * `__next_error__` fallback shell per failed page rather than failing the
 * whole export) — this is exactly the "diverges from training data"
 * warning `AGENTS.md` names for this Next version. `decodeURIComponent`
 * once here is the fix; `getWorkflowIndexRow` itself stays keyed on the
 * plain decoded id, matching what `generateStaticParams` and every other
 * caller already use.
 */
export async function generateMetadata({ params }: { params: Promise<WorkflowParams> }): Promise<Metadata> {
  const { workflowId } = await params
  const row = getWorkflowIndexRow(decodeURIComponent(workflowId))
  return { title: row?.name ?? 'Workflow not found' }
}

export default async function WorkflowDetailPage({ params }: { params: Promise<WorkflowParams> }) {
  const { workflowId } = await params
  const row = getWorkflowIndexRow(decodeURIComponent(workflowId))
  if (!row) notFound()
  return <WorkflowCard row={row} />
}

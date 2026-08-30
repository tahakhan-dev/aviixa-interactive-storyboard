import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { TraceViewerAbsence } from './TraceViewerAbsence'

// Named, never numbered (D1): the route key is the module slug, and
// `SCR-SA-07` appears only as an annotation in the page's own copy.
export const metadata: Metadata = { title: `${saModuleById('MOD-SA-06').name} — Super Admin Platform Console` }

export { TraceViewerAbsence }

export default function TraceViewerRoute() {
  return <TraceViewerAbsence />
}

import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { QUEUE_HEADER } from '@/surfaces/doh/modules/doh-05/routes'
import { JobApprovalQueueScreen } from './JobApprovalQueueScreen'

export const metadata: Metadata = {
  title: `${QUEUE_HEADER.title} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported for the component suite, for the same reason as the sibling
// route: the screen owns `useState` and cannot also export `metadata`.
export { JobApprovalQueueScreen }

export default function JobApprovalQueuePage() {
  return <JobApprovalQueueScreen />
}

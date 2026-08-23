import type { Metadata } from 'next'
import { SCHEDULER_SCREENS } from '@/surfaces/sa/scheduler/registry'
import { OccurrenceDetailScreen } from '@/surfaces/sa/scheduler/OccurrenceDetailScreen'

// "Occurrence detail" is the source's own name for this screen, taken from the
// one line that names it. The slug is that name and nothing else — not an
// invented one, and not a number, because no screen register carries a row for
// this screen either.
const [, SCREEN] = SCHEDULER_SCREENS

// The console name is the literal every one of the nineteen module routes on
// this surface writes, and `tests/coverage/slice-03-gates.test.ts` reads the
// page source for it: one tab-title shape across the surface, so a reviewer
// with several tabs open can tell which console a tab belongs to. The screen
// name still comes from the registry rather than a second hand-typed string.
export const metadata: Metadata = {
  title: `${SCREEN.name} — Super Admin Platform Console`,
}

export default function OccurrenceDetailPage() {
  return <OccurrenceDetailScreen />
}

import type { Metadata } from 'next'
import { SCHEDULER_SCREENS } from '@/surfaces/sa/scheduler/registry'
import { SchedulerRegistryScreen } from '@/surfaces/sa/scheduler/SchedulerRegistryScreen'

// The slug is the screen's own name, lowercased and hyphenated. It is NOT a
// `SCR-SA-NN` number, and not because of a convention: no screen register
// carries a row for this screen, so there is no number to key it on and
// minting one would manufacture a source fact.
//
// The title takes the screen name from the one registry that does hold it —
// the source's own storyboard, transcribed in `registry.ts` — rather than a
// second hand-typed string.
const [SCREEN] = SCHEDULER_SCREENS

// The console name is the literal every one of the nineteen module routes on
// this surface writes, and `tests/coverage/slice-03-gates.test.ts` reads the
// page source for it: one tab-title shape across the surface, so a reviewer
// with several tabs open can tell which console a tab belongs to. The screen
// name still comes from the registry rather than a second hand-typed string.
export const metadata: Metadata = {
  title: `${SCREEN.name} — Super Admin Platform Console`,
}

export default function SchedulerRegistryPage() {
  return <SchedulerRegistryScreen />
}

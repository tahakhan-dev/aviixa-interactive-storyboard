import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { MyRunsView } from '@/frontline/modules/fl-a2/MyRunsView'

const DESTINATION = flDestinationBySlug('my-runs')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

/**
 * `SCR-FL-02`, `MOD-FL-A2` (L48530). The view carries its own defaults for
 * persona, connectivity and moment; §22.7 assigns SCR-FL-02 to a different
 * screen entirely, which is the namespace collision wave 0 ruled on and
 * `src/frontline/screens.ts` records.
 */
export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <MyRunsView />
    </FrontlineShell>
  )
}

import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { RunPlayerRoute } from './RunPlayerRoute'
import { runPlayerPanelA3 } from '@/frontline/modules/fl-a3/RunPlayerPanel'
import { FLA4_RUN_PLAYER_PANEL } from '@/frontline/modules/fl-a4/DataCaptureAndEvidencePanel'
import { FL_A5_ROUTE_PANEL } from '@/frontline/modules/fl-a5/panel'
import { FL_B8_ROUTE_PANEL } from '@/frontline/modules/fl-b8/panel'
import { FL_B9_ROUTE_PANEL } from '@/frontline/modules/fl-b9/panel'
import { FL_B11_ROUTE_PANEL } from '@/frontline/modules/fl-b11/panel'

const DESTINATION = flDestinationBySlug('run-player')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

/**
 * The Run Player destination, and the six modules §25.5 gives it — L48531,
 * whose Modules column reads `MOD-FL-A3 to A5, B8, B9, B11`.
 *
 * THE SCREEN IDENTIFIER IS NOT SPELLED HERE, AND `tests/unit/fl-screens.test.ts`
 * is why: routes are keyed on names, never on screen identifiers. This file
 * named one in its first draft and that gate caught it. The `SCR-FL-*`
 * namespace is assigned twice in the source to different screens, which is
 * exactly why an identifier must not become a route key.
 *
 * THE ORDER IS THE SOURCE'S, NOT A PREFERENCE. A3 is the execution spine and
 * goes first; A4 is the capture the spine reaches; A5 is what a capture
 * triggers deterministically; B8 is advisory and downstream of A5; B9 is the
 * gate a finished step meets; B11 is the lifecycle around all of it. That is
 * the sequence chapter 22's own workflow steps take (L39045-L39047).
 *
 * SIX MODULES, ONE DIRECTORY, AND THAT IS WHY THIS FILE WAS BUILT BY A SPINE
 * TASK. Six agents each creating `app/frontline/run-player/` is the path
 * collision this build has recorded three times; the modules own only their
 * own directories under `src/`, export a panel, and the controller mounts it
 * here after they report.
 */
export { RunPlayerRoute }

export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <RunPlayerRoute
        panels={[
          runPlayerPanelA3(),
          FLA4_RUN_PLAYER_PANEL,
          FL_A5_ROUTE_PANEL,
          FL_B8_ROUTE_PANEL,
          FL_B9_ROUTE_PANEL,
          FL_B11_ROUTE_PANEL,
        ]}
      />
    </FrontlineShell>
  )
}

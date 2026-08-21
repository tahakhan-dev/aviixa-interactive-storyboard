import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { NotificationsInboxView } from '@/frontline/modules/fl-b10/NotificationsInboxView'
import { SyncDetailSheetView } from '@/frontline/modules/fl-a6/SyncDetailSheet'

const DESTINATION = flDestinationBySlug('notifications-and-sync-inbox')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

/**
 * `SCR-FL-04`. `MOD-FL-B10` owns the destination (L48532); `MOD-FL-A6`'s
 * sync detail sheet surfaces here too (L40035, L39868) WITHOUT owning a
 * route of its own — A6 appears in none of the six rows of §25.5's register,
 * and giving it one would make a seventh destination and fail AC-FL-010-1
 * (L40045). Two modules, one destination, and the inbox is named first
 * because it is the one the register names.
 */
export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <NotificationsInboxView />
      <SyncDetailSheetView />
    </FrontlineShell>
  )
}

import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { TrainingLibraryView } from '@/frontline/modules/fl-b12/TrainingLibraryView'

const DESTINATION = flDestinationBySlug('training-library-viewer')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

/**
 * `SCR-FL-05`, `MOD-FL-B12` (L48533). A DISTINCT ROUTE from the shipped
 * `app/studio/training-library` (L42105): two surfaces own material of the
 * same name, and this half creates no production record (L42118) and cannot
 * download to the device (L42116). The slug carries `-viewer` for exactly
 * that reason.
 */
export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <TrainingLibraryView />
    </FrontlineShell>
  )
}

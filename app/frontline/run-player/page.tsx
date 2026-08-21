import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { RunPlayerRoute } from './RunPlayerRoute'

const DESTINATION = flDestinationBySlug('run-player')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

// Re-exported so tests/component/fl-shell.test.tsx can mount the route body
// on its own, the same pattern the Hub's module screens use.
export { RunPlayerRoute }

export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <RunPlayerRoute />
    </FrontlineShell>
  )
}

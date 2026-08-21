import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'

const DESTINATION = flDestinationBySlug('notifications-and-sync-inbox')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

export default function Page() {
  return <FrontlineShell destination={DESTINATION} />
}

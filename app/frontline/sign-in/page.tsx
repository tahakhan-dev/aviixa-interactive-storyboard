import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { LoginView } from '@/frontline/modules/fl-a1/LoginView'

const DESTINATION = flDestinationBySlug('sign-in')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

/**
 * `SCR-FL-01`, and `MOD-FL-A1` owns it alone (L48529). The persona is fixed
 * at Worker because this is the sign-in screen: the four other columns of
 * A1's matrix hold no execution session to establish, which is what their
 * cells say rather than something this route decides.
 */
export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <LoginView column="Worker" />
    </FrontlineShell>
  )
}

import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { flDestinationBySlug } from '@/frontline/screens'
import { FrontlineShell } from '../FrontlineShell'
import { ProfileLiteView } from '@/frontline/modules/fl-a1/ProfileLiteView'
import { A7ProfileLiteView } from '@/frontline/modules/fl-a7/ProfileLiteView'

const DESTINATION = flDestinationBySlug('profile-lite')

export const metadata: Metadata = {
  title: `${DESTINATION.name} — ${surfaceById('SURF-FL').name}`,
}

/**
 * `SCR-FL-06` (L48534), and the only destination two modules own outright.
 * `MOD-FL-A1` holds the language preference and logout; `MOD-FL-A7` holds
 * the security and data-protection statements.
 *
 * BOTH TAKE THE HEADER'S OWN WORD, NOT A `RoleId`. `MOD-FL-A7`'s matrix is the
 * only Frontline one with six persona columns, and its sixth — "Platform
 * roles" — is plural and is not a role, so its column keys had to be the
 * header line's own words. `MOD-FL-A1` keys the same way. The first wiring of
 * this route passed `RoleId`s and the compiler refused both, which is the
 * column types doing their job.
 */
export default function Page() {
  return (
    <FrontlineShell destination={DESTINATION}>
      <ProfileLiteView column="Worker" />
      <A7ProfileLiteView column="Worker" />
    </FrontlineShell>
  )
}

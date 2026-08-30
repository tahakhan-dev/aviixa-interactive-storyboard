'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { AtomicCapabilitiesView } from '@/studio/modules/stu-01/AtomicCapabilitiesView'
import { StudioShell } from '../StudioShell'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-01')

/**
 * `MOD-STU-01`'s route. It wraps the Studio shell like every module route on
 * this surface, and the shell — not this file, and not any component under
 * `src/ui/` — decides whether the persona may open the Studio at all.
 *
 * The persona lives here rather than in the view because ONE control owns it:
 * the shell's reviewer switcher and this screen's content must never disagree
 * about who is being viewed as, and two independent pieces of state is how
 * they would.
 *
 * The screen id is an ANNOTATION, never a route key. Catalogue B carries no
 * row for `MOD-STU-01` at all — its Atomic Capabilities view is catalogue A's
 * `SCR-STU-CAPS` (L31084) — so the shell renders the module's own declared
 * absence rather than borrowing the nearest catalogue-B identifier, and no
 * `screenId` is passed here.
 */
export function CapabilitiesScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')

  return (
    <StudioShell module={MODULE} persona={persona} onPersonaChange={setPersona}>
      <AtomicCapabilitiesView persona={persona} />
    </StudioShell>
  )
}

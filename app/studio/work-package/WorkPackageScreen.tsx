'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { PackageManifestView } from '@/studio/modules/stu-14/PackageManifestView'
import { RUN_2026_08_14_A_PACKAGE } from '@/studio/modules/stu-14/package'
import { stu14Scenario } from '@/studio/modules/stu-14/rendering'
import { StudioShell } from '../StudioShell'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-14')

/**
 * `MOD-STU-14`'s route — `/studio/work-package/`, keyed on the module slug.
 *
 * **THIS ROUTE IS UNCATALOGUED, AND IT SAYS SO RATHER THAN BORROWING AN ID.**
 * Screen catalogue B (L48259-L48273) carries no row for `MOD-STU-14` at all.
 * Its view is the storyboard `SB-STU-17` (L33905), the read-only package
 * contents view, which the Studio and the Delivery Operations Hub both
 * present. No `SCR-STU-NN` identifier is minted or borrowed for it: the
 * module registry's `uncataloguedScreen` note is the annotation, and the
 * shell renders it. Inventing a catalogue entry here would put a
 * sixteenth row into a catalogue `AC-SCR-STU-001` (L48346) asserts has
 * fifteen.
 *
 * **NO CONTROL LIVES HERE.** The screen renders a read-only manifest and
 * nothing else. `initialPersona` is the reviewer's view switcher, owned by
 * the shell above; this screen holds the one copy of that state so the
 * switcher and the content can never disagree about who is being viewed as.
 */
export interface WorkPackageScreenProps {
  /** Which seeded persona the view opens as. Reviewer chrome, not a session. */
  readonly initialPersona?: StudioPersonaId
}

export function WorkPackageScreen({ initialPersona = 'quality-manager' }: WorkPackageScreenProps) {
  const [persona, setPersona] = useState<StudioPersonaId>(initialPersona)

  return (
    <StudioShell module={MODULE} persona={persona} onPersonaChange={setPersona}>
      <PackageManifestView
        pkg={RUN_2026_08_14_A_PACKAGE}
        scenario={stu14Scenario({ persona })}
      />
    </StudioShell>
  )
}

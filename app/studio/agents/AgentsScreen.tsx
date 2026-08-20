'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { AgentConfigurationView } from '@/studio/modules/stu-02/AgentConfigurationView'
import { stu02Scenario } from '@/studio/modules/stu-02/rendering'
import { AgentBuilderView } from '@/studio/modules/stu-15/AgentBuilderView'
import { stu15Scenario } from '@/studio/modules/stu-15/rendering'
import { StudioShell } from '../StudioShell'

/**
 * `SCR-STU-13` — "Agent configuration and Agent Builder" (L48271). ONE
 * screen, ONE route, TWO modules: catalogue B merges what catalogue A splits
 * into `SCR-STU-CAPS` and `SCR-STU-AGENT`, and its own module column names
 * `MOD-STU-02` and `MOD-STU-15` and no others.
 *
 * THE SHELL IS ANNOTATED WITH `MOD-STU-02` because a shell takes one module
 * and this route is registered under the `agents` slug both modules carry.
 * The Agent Builder half declares itself in its own heading, and
 * `stuScreensForModule` resolves `SCR-STU-13` for both, so neither module is
 * hidden by the choice.
 *
 * THE PERSONA LIVES HERE rather than in either view, because one control
 * owns it: the shell's reviewer switcher and both halves of the screen must
 * never disagree about who is being viewed as, and two pieces of state is how
 * they would.
 */
const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-02')

export function AgentsScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')

  return (
    <StudioShell
      module={MODULE}
      screenId="SCR-STU-13"
      persona={persona}
      onPersonaChange={setPersona}
    >
      <div className="space-y-8">
        <AgentConfigurationView scenario={stu02Scenario({ persona })} />
        <AgentBuilderView scenario={stu15Scenario({ persona })} />
      </div>
    </StudioShell>
  )
}

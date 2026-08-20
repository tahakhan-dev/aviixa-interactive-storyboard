import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { AgentsScreen } from './AgentsScreen'

const CONFIGURATION = stuModuleById(STU_MODULES, 'MOD-STU-02')
const BUILDER = stuModuleById(STU_MODULES, 'MOD-STU-15')

// Both module names come from the registry, never a second hand-typed string,
// and the route is keyed on the slug both modules carry — never on a screen
// id (D1). SCR-STU-13 is the annotation the shell prints, not this URL.
export const metadata: Metadata = {
  title: `${CONFIGURATION.name} and ${BUILDER.name} — Standards and Operations Studio`,
}

export default function AgentsPage() {
  return <AgentsScreen />
}

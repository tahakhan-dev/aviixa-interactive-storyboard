import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { EvalHarnessScreen } from './EvalHarnessScreen'

const MODULE = saModuleById('MOD-SA-05')

// The title is built from the module registry, never a second hand-typed
// string, and never from a `SCR-SA-NN` number (D1).
export const metadata: Metadata = { title: `${MODULE.name} — Super Admin Platform Console` }

export default function EvalHarnessPage() {
  return <EvalHarnessScreen />
}

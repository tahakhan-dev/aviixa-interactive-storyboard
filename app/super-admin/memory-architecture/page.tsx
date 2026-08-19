import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { MemoryArchitectureScreen } from './MemoryArchitectureScreen'

export const metadata: Metadata = { title: `${saModuleById('MOD-SA-04').name} — Super Admin Platform Console` }

export default function MemoryArchitecturePage() {
  return <MemoryArchitectureScreen />
}

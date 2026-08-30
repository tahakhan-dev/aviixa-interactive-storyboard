import type { Metadata } from 'next'
import { stuScreenById, STU_SCREENS } from '@/studio/screens'
import { SignInScreen } from './SignInScreen'

export const metadata: Metadata = {
  title: `${stuScreenById(STU_SCREENS, 'SCR-STU-01').name} — Standards and Operations Studio`,
}

// The module's second catalogue-B screen. MOD-STU-18 has one slug and two
// screens (SCR-STU-15 and SCR-STU-01), so the sign-in screen is registered on
// the screen rather than on the module. `sign-in` is a plain name, not a
// screen number: no route on this surface is keyed on SCR-STU-NN (D1).
export { SignInScreen }

export default function SignInPage() {
  return <SignInScreen />
}

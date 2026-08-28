import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { SignInScreen } from './SignInScreen'

// M2: sourced from the surface registry, not a second hand-typed name.
export const metadata: Metadata = { title: `Sign in — ${surfaceById('SURF-SA').name}` }

export default function SuperAdminSignInPage() {
  return <SignInScreen />
}

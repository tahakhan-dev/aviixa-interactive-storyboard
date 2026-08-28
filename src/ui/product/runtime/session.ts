/**
 * Task 1 (`src/ui/product/runtime/session.ts`) — the simulated sign-in state
 * machine's outcome type and its pure resolution function. No route, page or
 * form lives here (Task 2 builds the sign-in screen); this file only answers
 * "given an email and a password, and the `users`/`tenants` collections,
 * what happened."
 *
 * RULING R2 (controller, binding — see task-1-brief.md): the brief's
 * illustrative `resolveSignIn` snippet reads `user.status === 'locked'` and
 * `user.lockedUntil`. Neither field exists on `@/data/schemas/platform#User`
 * and neither may be added — Task 6 fix round 2 removed `'locked'` from
 * `User.status` for the reasoning recorded in that schema file itself: §15.1
 * "The user and account lifecycle" (frozen source L18914-L19140) names
 * `Suspended` as the actual login-blocking state. The real enum, seeded
 * exactly as `users.json` carries it (1 invited / 73 active / 5 suspended /
 * 2 removed), is `invited | active | suspended | removed`, and every branch
 * below is reachable from that seed data, not only from a type.
 */
import type { AccessContext, Repository, RowOf } from '@/data/repository'
import { tenantId, type TenantId } from '@/domain/ids'
import type { ProductSession } from '@/ui/product/AppShell'

export type SignInOutcome =
  | { kind: 'signed-in'; session: ProductSession }
  | { kind: 'invalid-credentials' }
  | { kind: 'invitation-pending'; email: string; tenantId: TenantId | null }
  | { kind: 'account-suspended'; reason: string }
  | { kind: 'tenant-suspended'; tenantId: TenantId; lifecycle: string }
  | { kind: 'step-up-required'; challenge: string }

export interface ProductSessionState {
  /** `null` means not signed in. */
  readonly session: ProductSession | null
  readonly sessionId: string | null
  readonly lastOutcome: SignInOutcome | null
}

export interface ProductSessionApi extends ProductSessionState {
  signIn(email: string, password: string): SignInOutcome
  signOut(): void
}

/** The one signed-out value — reused, never rebuilt inline, so every reset (boot-not-ready, sign-out, initial state) is the SAME object. */
export const SIGNED_OUT: ProductSessionState = { session: null, sessionId: null, lastOutcome: null }

function sessionFor(user: RowOf<'users'>): ProductSession {
  return {
    identity: user.displayName,
    role: user.role,
    tenant: user.tenantId ? tenantId(user.tenantId) : null,
    device: 'desktop',
  }
}

/**
 * Resolved from the `users`/`tenants` collections through `repository`, not
 * invented. `ctx` is the caller's responsibility to supply — a signed-OUT
 * `AccessContext` sees nothing (`withinScope` fails closed on
 * `!identity.signedIn`), so a real caller passes a platform-domain,
 * cross-tenant read context built the same way the reviewer's own Inspector
 * reads across tenants (`@/ui/product/runtime/useRepository#reviewerAccessContext`)
 * — this function performs no write, so which actor a read-only lookup is
 * attributed to is irrelevant.
 */
export function resolveSignIn(
  repository: Repository,
  ctx: AccessContext,
  email: string,
  password: string,
): SignInOutcome {
  const user = repository.list('users', ctx).where((u) => u.email === email).first()
  // `status === 'removed'` folds into the SAME generic outcome as "no such
  // user"/"no password typed" — R2: telling a caller an account once
  // existed discloses account existence, which a sign-in screen must not do.
  if (!user || password.length === 0 || user.status === 'removed') {
    return { kind: 'invalid-credentials' }
  }
  if (user.status === 'invited') {
    // The invitation has not been accepted; there is no password to check yet.
    return { kind: 'invitation-pending', email, tenantId: user.tenantId ? tenantId(user.tenantId) : null }
  }
  if (user.status === 'suspended') {
    return { kind: 'account-suspended', reason: 'Account suspended by a platform administrator.' }
  }
  const tenant = user.tenantId ? repository.get('tenants', user.tenantId, ctx) : undefined
  if (tenant && tenant.lifecycle !== 'active' && tenant.lifecycle !== 'pilot') {
    return { kind: 'tenant-suspended', tenantId: tenantId(tenant.id), lifecycle: tenant.lifecycle }
  }
  if (user.role === 'ROOT_SUPER_ADMIN') {
    // master prompt §7.5; blueprint `WF-ROLE-004` "First root sign-in and
    // the enforced-invariant acknowledgement" (frozen source L55644-L55654):
    // happy path step 1 "The root signs in", step 2 "Platform Settings
    // renders the six enforced invariants as locked", step 3 "The root
    // confirms the platform floor register" — root sign-in is never
    // `signed-in` on its own; the acknowledgement gate comes first.
    return { kind: 'step-up-required', challenge: 'authenticator' }
  }
  return { kind: 'signed-in', session: sessionFor(user) }
}

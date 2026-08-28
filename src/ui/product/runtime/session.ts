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
import { scenarioStateFor } from '@/data/repository'
import type { Store } from '@/data/store'
import { tenantId, type TenantId } from '@/domain/ids'
import type { ProductSession } from '@/ui/product/AppShell'

export type SignInOutcome =
  | { kind: 'signed-in'; session: ProductSession }
  | { kind: 'invalid-credentials' }
  | { kind: 'invitation-pending'; email: string; tenantId: TenantId | null }
  | { kind: 'account-suspended'; reason: string }
  | { kind: 'tenant-suspended'; tenantId: TenantId; lifecycle: string }
  /**
   * `email` added (Task 2 fix round 1, review IMPORTANT 1): the ONLY way
   * `resolveStepUpCompletion` below can re-locate which user is mid
   * step-up once the caller holds nothing but this outcome object — the
   * root landing later must resolve through the SAME collection lookup
   * that produced this outcome, not a value carried in local component
   * state that could go stale.
   */
  | { kind: 'step-up-required'; challenge: string; email: string }

export interface ProductSessionState {
  /** `null` means not signed in. */
  readonly session: ProductSession | null
  readonly sessionId: string | null
  readonly lastOutcome: SignInOutcome | null
}

/**
 * The three shapes a step-up completion attempt can end in — deliberately
 * NOT `SignInOutcome` reused wholesale: a completion is never
 * `invalid-credentials`/`invitation-pending`/`tenant-suspended` (those are
 * questions the ORIGINAL sign-in already answered), and it can fail in a
 * way plain sign-in never does — the write itself being refused or
 * undurable — which is exactly `@/data/repository#WriteResult`'s own
 * `denied`/`persistence-unavailable` split, reused here rather than
 * flattened into one generic failure string.
 */
export type StepUpCompletionResult =
  | { kind: 'signed-in'; session: ProductSession }
  | { kind: 'denied'; explain: string }
  | { kind: 'persistence-unavailable'; explain: string }

export interface ProductSessionApi extends ProductSessionState {
  signIn(email: string, password: string): SignInOutcome
  signOut(): void
  /**
   * Only meaningful while `lastOutcome.kind === 'step-up-required'` — the
   * caller (`ProductRuntime.tsx`) enforces that and returns a `'denied'`
   * no-op from any other state without touching the repository at all, so
   * this can never fabricate a session out of nothing.
   */
  completeStepUp(): Promise<StepUpCompletionResult>
}

/** The one signed-out value — reused, never rebuilt inline, so every reset (boot-not-ready, sign-out, initial state) is the SAME object. */
export const SIGNED_OUT: ProductSessionState = { session: null, sessionId: null, lastOutcome: null }

/**
 * `stepUpActive` (Task 2 fix round 1): defaults `false` for the ordinary
 * `resolveSignIn` path below (which never calls this for
 * `ROOT_SUPER_ADMIN` — that role always exits through `step-up-required`
 * first); `resolveStepUpCompletion` passes `true` for the session it
 * lands, which is the one and only path a `true` value can reach this
 * function through.
 */
function sessionFor(user: RowOf<'users'>, stepUpActive = false): ProductSession {
  return {
    identity: user.displayName,
    role: user.role,
    tenant: user.tenantId ? tenantId(user.tenantId) : null,
    device: 'desktop',
    stepUpActive,
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
  // user" — R2: telling a caller an account once existed discloses account
  // existence, which a sign-in screen must not do.
  if (!user || user.status === 'removed') {
    return { kind: 'invalid-credentials' }
  }
  // Checked BEFORE the password-empty guard below (fix round 1): an invited
  // account has never set a password, so there is nothing to check yet — an
  // empty password on an invited account is `invitation-pending`, not the
  // generic `invalid-credentials` a real "wrong/missing password" is.
  if (user.status === 'invited') {
    return { kind: 'invitation-pending', email, tenantId: user.tenantId ? tenantId(user.tenantId) : null }
  }
  if (password.length === 0) {
    return { kind: 'invalid-credentials' }
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
    return { kind: 'step-up-required', challenge: 'authenticator', email }
  }
  return { kind: 'signed-in', session: sessionFor(user) }
}

/**
 * The real acting identity for the root's OWN step-up-completion write —
 * deliberately NOT `reviewerAccessContext` (`@/ui/product/runtime/useRepository`):
 * that context exists for the reviewer's own cross-tenant Inspector tool
 * and is attributed to `'demo-inspector'`, which would misrepresent a real
 * product write as reviewer tooling. This one is attributed to the actual
 * signing-in address and carries `stepUpActive: true` — the step-up IS
 * what this write is completing.
 */
function rootActingContext(store: Store, email: string): AccessContext {
  return {
    state: scenarioStateFor(store),
    identity: {
      signedIn: true,
      role: 'ROOT_SUPER_ADMIN',
      tenant: null,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: true,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: email,
  }
}

/**
 * WF-ROLE-004 step 4, "The session is audited" (frozen source
 * L55644-L55654, cited above) — completes the pending step-up
 * acknowledgement by writing the root's own `lastSignInAt`
 * (`@/data/schemas/platform#User`, a real field every seeded user
 * carries), which is genuine product behaviour rather than a fabricated
 * claim: a sign-in updating when the account last signed in is exactly
 * what `repository.ts#update` is for, and it appends the audit row
 * atomically, stamped from `store.clock.now()` (the simulated clock,
 * never the wall clock), on the SAME `WriteResult`. Review fix round 1,
 * IMPORTANT 1: the prior build rendered "this sign-in attempt has been
 * recorded" from local `useState` alone — a claimed capability the build
 * never performed. This function is what makes that sentence true.
 *
 * Re-locates the user by `email` (never trusts a row the caller might
 * have cached) and re-checks role/status itself — a stale outcome object
 * pointing at a row that no longer qualifies is refused here, not landed.
 */
export async function resolveStepUpCompletion(
  repository: Repository,
  store: Store,
  email: string,
): Promise<StepUpCompletionResult> {
  const ctx = rootActingContext(store, email)
  const user = repository.list('users', ctx).where((u) => u.email === email).first()
  if (!user || user.role !== 'ROOT_SUPER_ADMIN' || user.status !== 'active') {
    return {
      kind: 'denied',
      explain: 'This acknowledgement no longer matches a signable root account.',
    }
  }
  const result = await repository.update(
    'users',
    user.id,
    { lastSignInAt: new Date(store.clock.now()).toISOString() },
    ctx,
  )
  if (!result.ok) {
    return { kind: result.kind, explain: result.explain }
  }
  return { kind: 'signed-in', session: sessionFor(result.row, true) }
}

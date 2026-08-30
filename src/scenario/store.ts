import type { ScenarioCommand } from '@/domain/commands'
import type { TenantId } from '@/domain/ids'
import { roleById } from '@/domain/roles'
import {
  tenantPartition,
  type IdentitySimulationState,
  type PresentationState,
  type ScenarioDomainState,
} from '@/domain/state'
import type { TransitionContext } from '@/domain/transition'
import { dispatch, type GatewayDeps, type GatewayResult } from './gateway'

const DEFAULT_IDENTITY: IdentitySimulationState = {
  signedIn: false,
  role: null,
  tenant: null,
  siteScope: [],
  areaScope: [],
  qualifications: [],
  deviceId: null,
  stepUpActive: false,
  accessSessionId: null,
}

const DEFAULT_PRESENTATION: PresentationState = {
  surface: null,
  locale: 'en',
  density: 'comfortable',
  filters: {},
  selection: [],
  storyStepId: null,
}

export interface ScenarioStore {
  getState(): ScenarioDomainState
  subscribe(fn: () => void): () => void
  dispatchCommand(
    command: ScenarioCommand,
    ctx: TransitionContext,
    deps: GatewayDeps,
  ): Promise<GatewayResult>
  getIdentity(): IdentitySimulationState
  setIdentity(identity: IdentitySimulationState): void
  getPresentation(): PresentationState
  setPresentation(presentation: PresentationState): void
}

/**
 * A small subscription store holding the three domains -- product truth
 * (`ScenarioDomainState`), the simulated signed-in identity, and view-only
 * `PresentationState` -- separately, each mutated only through its own
 * setter so a caller can never confuse one for another.
 *
 * `dispatchCommand` is the store's only path to changing `ScenarioDomainState`:
 * it delegates entirely to `@/scenario/gateway`'s `dispatch` (the app's one
 * mutation entry point) and applies the committed next state only when the
 * gateway reports success -- a refusal at any of the gateway's three stages
 * leaves the store's domain state exactly as it was (same reference).
 */
export function createScenarioStore(initial: ScenarioDomainState): ScenarioStore {
  let domainState = initial
  let identity = DEFAULT_IDENTITY
  let presentation = DEFAULT_PRESENTATION
  const listeners = new Set<() => void>()

  const notify = (): void => {
    for (const fn of listeners) fn()
  }

  return {
    getState: () => domainState,

    subscribe(fn) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },

    async dispatchCommand(command, ctx, deps) {
      const result = await dispatch(domainState, command, ctx, deps)
      if (result.ok) {
        domainState = result.committed.committedState
        notify()
      }
      return result
    },

    getIdentity: () => identity,

    setIdentity(next) {
      identity = next
      // An identity change clears PresentationState (filters, selection,
      // expanded panels) so one persona's view state cannot leak into
      // another's. `domainState` is deliberately never assigned here, so it
      // stays the exact same object reference -- domain truth is untouched
      // by a change of who is looking at it.
      presentation = DEFAULT_PRESENTATION
      notify()
    },

    getPresentation: () => presentation,

    setPresentation(next) {
      presentation = next
      notify()
    },
  }
}

/**
 * Tenant isolation enforced at the SELECTOR layer, not only trusted from the
 * policy evaluator. A signed-out identity, or one with no role, sees no
 * tenant at all -- the same fail-closed default `evaluateAccess`'s SESSION
 * stage applies.
 *
 * A TENANT-domain role (Quality Manager, Supervisor, ...) sees only its own
 * live tenant. A PLATFORM-domain role (Admin, Support, ...) never ambiently
 * holds a tenant -- it would reach tenant data only through a named access
 * session, but `IdentitySimulationState` does not yet carry which tenant a
 * session grants, so this always returns `[]` for a platform role. A later
 * slice that adds that field should resolve it here instead of leaving this
 * empty unconditionally.
 */
export function selectVisibleTenants(
  state: ScenarioDomainState,
  identity: IdentitySimulationState,
): readonly TenantId[] {
  if (!identity.signedIn || identity.role === null) return []
  const domain = roleById(identity.role).domain
  if (domain !== 'TENANT') return []
  return identity.tenant !== null && tenantPartition(state, identity.tenant) !== undefined
    ? [identity.tenant]
    : []
}

/**
 * `null` rather than another tenant's objects -- never trust a caller-
 * supplied `tenant` argument on its own. Only a tenant `selectVisibleTenants`
 * already names as visible to this identity is ever returned.
 */
export function selectTenantObjects(
  state: ScenarioDomainState,
  identity: IdentitySimulationState,
  tenant: TenantId,
): Readonly<Record<string, unknown>> | null {
  if (!selectVisibleTenants(state, identity).includes(tenant)) return null
  return tenantPartition(state, tenant)?.objects ?? null
}

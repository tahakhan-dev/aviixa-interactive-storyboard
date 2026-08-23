import { tenantId, scenarioRunId, type TenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import type { AccessContext } from '@/policy/evaluate'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import type { AuditEventReference } from './rendering'

/**
 * Seeded storyboard data for the audit browser. Deterministic: no clock, no
 * counter, no randomness.
 *
 * ── TWO TENANTS, AND THE SECOND ONE IS THE WHOLE POINT ────────────────────
 * A single-tenant fixture cannot show that a read-permissive cell was
 * tenant-isolated, because every row would pass either way. The neighbouring
 * tenant's two events are the ones stage two of the selector removes, and one
 * of them is deliberately in a class the Quality Manager's scope PERMITS — so
 * the class filter cannot be what excludes it. Without that row, dropping the
 * object stage entirely would still leave the Quality Manager's list correct
 * and the plant would prove nothing.
 *
 * ── THE IDENTIFIERS ──────────────────────────────────────────────────────
 * `AUD-BB-000001` is the source's own chain start for this tenant and
 * `AUD-BB-000412` is the event the source walks field by field in its own
 * example. Every other identifier here is this build's seeded storyboard
 * data in the same family, and nothing reads it as a source enumeration.
 */

export const HUB_TENANT_ID: TenantId = tenantId('TEN-BRIGHTBIKES')

/** A second live tenant. Named so no reader mistakes it for this workspace. */
export const NEIGHBOUR_TENANT_ID: TenantId = tenantId('TEN-NORTHPOINT-TOOLING')

/* `as const satisfies`, not an annotation: the annotation form widens every
   literal here — `eventClass` back to `string` above all — and it is what
   `tests/coverage/slice-2c-gates.test.ts` gate 2 refuses. */
export const SEEDED_AUDIT_EVENTS = [
  {
    eventId: 'AUD-BB-000001',
    eventClass: 'run-state-transition',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'RUN-2026-08-14-A moved from scheduled to in progress.',
    sourceRef: 'L28961',
  },
  {
    eventId: 'AUD-BB-000108',
    eventClass: 'step-execution',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'Step 4 of WF-FRAME-WELD v2.1.0 was executed on RUN-2026-08-14-A.',
    sourceRef: 'L28836',
  },
  {
    eventId: 'AUD-BB-000109',
    eventClass: 'data-capture',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'A torque reading of 41.0 Newton metres was captured against step 4.',
    sourceRef: 'L28961',
  },
  {
    eventId: 'AUD-BB-000121',
    eventClass: 'assignment-and-substitution',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'Ahmed was substituted for Maya on RUN-2026-08-14-A, with the reason captured.',
    sourceRef: 'L28961',
  },
  {
    eventId: 'AUD-BB-000144',
    eventClass: 'permission-change',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'A Supervisor role assignment was added for the Assembly area.',
    sourceRef: 'L28836',
  },
  {
    eventId: 'AUD-BB-000155',
    eventClass: 'configuration-change',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'A tenant setting was changed in the tenant administration area.',
    sourceRef: 'L28836',
  },
  {
    eventId: 'AUD-BB-000201',
    eventClass: 'summary-review-action',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'Elena closed an anomaly on the Execution Summary for RUN-2026-08-14-A.',
    sourceRef: 'L28961',
  },
  {
    eventId: 'AUD-BB-000212',
    eventClass: 'clearance',
    resourceTenant: HUB_TENANT_ID,
    /* THE TWO HALVES KEPT APART. "A clearance was granted, used once, and
       lapsed" said a tablet had the clearance on the strength of the grant
       alone, which is the offline honesty rule's own example: the compliant
       replacement column at L78401 answers "Clearance granted to Maya" with
       the server's record and the device named separately. So this sentence
       records centrally, then names the device that acknowledged, and only
       then says where it was used. No timestamps — this fixture has no
       clock, and the device's own report is what the rule asks for. */
    sentence:
      'A clearance was recorded, acknowledged by TAB-014, used once on that device, and lapsed.',
    sourceRef: 'L28961',
  },
  {
    eventId: 'AUD-BB-000260',
    eventClass: 'lane-b-auto-publish',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'A Lane B proposal was approved, published automatically and distributed.',
    sourceRef: 'L28836',
  },
  {
    eventId: 'AUD-BB-000301',
    eventClass: 'platform-side-access-event',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'A platform support session opened against this workspace and closed 18 minutes later.',
    sourceRef: 'L28836',
  },
  {
    eventId: 'AUD-BB-000355',
    eventClass: 'tenant-state-transition',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'This workspace moved from provisioning to active.',
    sourceRef: 'L28836',
  },
  {
    eventId: 'AUD-BB-000412',
    eventClass: 'studio-publication',
    resourceTenant: HUB_TENANT_ID,
    sentence: 'WF-FRAME-WELD v2.1.0 was published in the Standards and Operations Studio.',
    sourceRef: 'L28961',
  },
  /* The two the object stage removes. The first is in the Quality Manager's
     own permitted class, so the class filter cannot be what excludes it. */
  {
    eventId: 'AUD-NP-000077',
    eventClass: 'run-state-transition',
    resourceTenant: NEIGHBOUR_TENANT_ID,
    sentence: 'A run belonging to another tenant changed state.',
    sourceRef: 'L74029',
  },
  {
    eventId: 'AUD-NP-000078',
    eventClass: 'permission-change',
    resourceTenant: NEIGHBOUR_TENANT_ID,
    sentence: 'A role assignment belonging to another tenant was changed.',
    sourceRef: 'L74029',
  },
] as const satisfies readonly AuditEventReference[]

function seededState(): ScenarioDomainState {
  const withHub = withTenant(
    emptyDomainState(scenarioRunId('DOH-AUDIT-RETENTION-STORYBOARD')),
    HUB_TENANT_ID,
    () => ({
      displayName: 'Bright Bikes',
      lifecycleState: 'ACTIVE' as const,
      desiredFeatureValues: {},
      tier: 'growth',
      objects: {},
    }),
  )
  // The neighbouring tenant is LIVE, not missing. A missing tenant would be
  // refused for the wrong reason and the fixture would prove the wrong thing:
  // what stage two must catch is a real record in a real other tenant.
  return withTenant(withHub, NEIGHBOUR_TENANT_ID, () => ({
    displayName: 'Northpoint Tooling',
    lifecycleState: 'ACTIVE' as const,
    desiredFeatureValues: {},
    tier: 'growth',
    objects: {},
  }))
}

/** The reader's live evaluation context. One tenant, always this one. */
export function auditContext(role: TenantRoleId): AccessContext {
  return {
    state: seededState(),
    identity: {
      signedIn: true,
      role,
      tenant: HUB_TENANT_ID,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'storyboard-viewer',
  }
}

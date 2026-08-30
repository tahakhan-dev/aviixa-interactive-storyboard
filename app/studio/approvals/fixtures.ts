import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import type { StudioIdentity } from '@/studio/access/evaluate'
import type { StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import type { StudioPersonaId } from '@/studio/modules'
import {
  advance,
  returnWithComments,
  seededDiffEngine,
  submit,
  type ApprovalChain,
  type ApprovalContext,
  type ApprovalOutcome,
  type AuditWrite,
  type ChainStaffing,
} from '@/studio/modules/stu-11/chain'

/**
 * The seeded scenario `SCR-STU-11` renders. Bright Bikes, the illustrative
 * example the source itself uses at L33359 — Sam authors, a second
 * authoring-grant holder at Riverside Plant reviews, Elena releases.
 *
 * EVERY CHAIN IS DRIVEN, NEVER CONSTRUCTED. There is no raw constructor for an
 * `ApprovalChain` anywhere, so a fixture cannot be placed in a state the real
 * transitions could not reach — the same discipline task 5's journey fold
 * applies to the twenty-two steps. A transition that refused leaves a `null`
 * that `SEEDED_CHAINS` drops, and `tests/unit/stu-approvals.test.ts` asserts
 * the seeded list and its states exactly, so a silent drop goes red.
 */

export const FIXTURE_TENANT = tenantId('TEN-BRIGHT-BIKES')
export const OTHER_TENANT = tenantId('TEN-OTHER')

/** Determinism: SEQ-011's illustrative window ends 2026-06-21 (L68030). */
export const FIXTURE_AS_OF = '2026-06-21T09:00:00.000Z'
const SUBMITTED_AT = '2026-06-18T07:30:00.000Z'

export const FIXTURE_DOMAIN: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-11-APPROVALS')),
  FIXTURE_TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

export interface SeededViewer {
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  /** Who this is, in the storyboard's own terms. */
  readonly note: string
}

const SAM: StudioIdentity = {
  identityId: 'IDN-SAM',
  roles: ['SUPERVISOR'],
  signedIn: true,
  tenant: FIXTURE_TENANT,
}
const RIVERSIDE: StudioIdentity = {
  identityId: 'IDN-RIVERSIDE',
  roles: ['SUPERVISOR'],
  signedIn: true,
  tenant: FIXTURE_TENANT,
}
const ELENA: StudioIdentity = {
  identityId: 'IDN-ELENA',
  roles: ['QUALITY_MANAGER'],
  signedIn: true,
  tenant: FIXTURE_TENANT,
}

const AUTHORING: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> = {
  'GRANT-STU-AUTHOR': 'Active',
}

/**
 * One seeded identity per persona column, so the switcher changes WHO is
 * looking rather than what is drawn. Separation of duties is a fact about the
 * identity, so a persona switcher that did not change the identity could never
 * show the rule biting.
 */
export const SEEDED_VIEWERS: Readonly<Record<StudioPersonaId, SeededViewer>> = {
  'quality-manager': {
    identity: ELENA,
    grants: {},
    note: 'Elena, Quality Manager and tenant-default Release Authority. She authored SUB-BB-0001 in this scenario, which is why the chain will not let her review it.',
  },
  'supervisor-with-authoring-grant': {
    identity: SAM,
    grants: AUTHORING,
    note: 'Sam, a Supervisor holding GRANT-STU-AUTHOR. Authoring is a capability, not a sixth role (L34584).',
  },
  'supervisor-without-grant': {
    identity: {
      identityId: 'IDN-DEV',
      roles: ['SUPERVISOR'],
      signedIn: true,
      tenant: FIXTURE_TENANT,
    },
    grants: {},
    note: 'A Supervisor with no authoring grant. Reads the approval log and holds no stage.',
  },
  'plant-manager-persona': {
    identity: {
      identityId: 'IDN-PLANT',
      roles: ['SUPERVISOR'],
      signedIn: true,
      tenant: FIXTURE_TENANT,
    },
    grants: {},
    note: 'DEC-ROLE-001 (L34522): the Plant Manager persona’s Studio access is delivered by a Supervisor role without the authoring grant. This module’s own table (L33268) heads no column for it.',
  },
  'tenant-admin': {
    identity: {
      identityId: 'IDN-ADMIN',
      roles: ['TENANT_ADMIN'],
      signedIn: true,
      tenant: FIXTURE_TENANT,
    },
    grants: {},
    note: 'Administers grants and holds no stage of the chain, for separation of duties (L34559).',
  },
  'read-only-auditor': {
    identity: {
      identityId: 'IDN-AUDIT',
      roles: ['READONLY_AUDITOR'],
      signedIn: true,
      tenant: FIXTURE_TENANT,
    },
    grants: {},
    note: 'DEC-AUDSTU-001 is open on this persona’s read of the approval log; the Delivery Operations Hub audit log is the route the source specifies.',
  },
  worker: {
    identity: {
      identityId: 'IDN-WORKER',
      roles: ['WORKER'],
      signedIn: true,
      tenant: FIXTURE_TENANT,
    },
    grants: {},
    note: 'Explicitly prohibited on every row of this module’s table.',
  },
  'implementation-team': {
    identity: {
      identityId: 'IDN-IMPL',
      roles: ['SUPERVISOR'],
      signedIn: true,
      tenant: FIXTURE_TENANT,
    },
    grants: { 'GRANT-STU-IMPL': 'Active' },
    note: 'The implementation team’s temporary onboarding capacity: author and submit only, fully audited, revoked at onboarding’s end (L33251).',
  },
}

/**
 * A tenant staffed to `DEC-RELAUTH-001`'s option (a): TWO holders of a
 * Release-Authority-capable role, so that whichever of them authors a
 * submission there is still a distinct person who can release it. With only
 * one, Elena could not submit anything at all — which is the deadlock the
 * check exists to name, and it is seeded separately below rather than being
 * the default the storyboard opens on.
 */
export const FIXTURE_STAFFING: ChainStaffing = {
  authoringGrantHolders: ['IDN-SAM', 'IDN-RIVERSIDE', 'IDN-ELENA', 'IDN-PRIYA'],
  reviewerEligible: ['IDN-RIVERSIDE', 'IDN-ELENA', 'IDN-PRIYA'],
  releaseAuthorityEligible: ['IDN-ELENA', 'IDN-PRIYA'],
}

/**
 * The `DEC-RELAUTH-001` staffing the source's own worked example describes:
 * "a tenant with exactly one Quality Manager and one authoring-grant holder".
 */
export const ONE_PERSON_QUALITY_TEAM: ChainStaffing = {
  authoringGrantHolders: ['IDN-SAM', 'IDN-ELENA'],
  reviewerEligible: ['IDN-ELENA'],
  releaseAuthorityEligible: ['IDN-ELENA'],
}

const SILENT_AUDIT: AuditWrite = () => ({ ok: true })

function seedContext(
  identity: StudioIdentity,
  grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>,
  at: string,
): ApprovalContext {
  return {
    actor: identity,
    grants,
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    domain: FIXTURE_DOMAIN,
    online: true,
    at,
    audit: SILENT_AUDIT,
    staffing: FIXTURE_STAFFING,
    diff: seededDiffEngine,
  }
}

const chainOf = (outcome: ApprovalOutcome): ApprovalChain | null =>
  outcome.ok ? outcome.chain : null

const then = (
  chain: ApprovalChain | null,
  step: (c: ApprovalChain) => ApprovalOutcome,
): ApprovalChain | null => (chain === null ? null : chainOf(step(chain)))

/**
 * SUB-BB-0001 is authored by ELENA on purpose: she is the default persona, so
 * the storyboard opens on the one case `SB-STU-14` states outright — "The
 * Advance control is disabled with a stated reason if the reviewer is the
 * Author."
 */
const SUB_1 = chainOf(
  submit(seedContext(ELENA, {}, SUBMITTED_AT), {
    submissionId: 'SUB-BB-0001',
    consumer: 'workflow',
    subject: 'Wheel Bolt Torque Verification — engineering change order',
    tenant: FIXTURE_TENANT,
  }),
)

const SUB_2 = chainOf(
  submit(seedContext(SAM, AUTHORING, SUBMITTED_AT), {
    submissionId: 'SUB-BB-0002',
    consumer: 'workflow',
    subject: 'Chain Tension Check — coaching content refresh',
    tenant: FIXTURE_TENANT,
  }),
)

const SUB_3 = then(
  chainOf(
    submit(seedContext(SAM, AUTHORING, SUBMITTED_AT), {
      submissionId: 'SUB-BB-0003',
      consumer: 'workflow',
      subject: 'Brake Pad Seating — severity bands re-based',
      tenant: FIXTURE_TENANT,
    }),
  ),
  (c) => advance(c, seedContext(RIVERSIDE, AUTHORING, '2026-06-19T11:00:00.000Z')),
)

const SUB_4_BASE = then(
  chainOf(
    submit(seedContext(SAM, AUTHORING, SUBMITTED_AT), {
      submissionId: 'SUB-BB-0004',
      consumer: 'content-library-edit',
      subject: 'Containment checklist — Severity 2 wording',
      tenant: FIXTURE_TENANT,
    }),
  ),
  (c) =>
    returnWithComments(c, {
      ...seedContext(RIVERSIDE, AUTHORING, '2026-06-19T14:20:00.000Z'),
      comments: 'Screen 7’s coaching default still references the outdated calibration procedure.',
    }),
)

/**
 * `AC-WF-AUT-006-03` (L53543) made visible: this returned item carries an
 * UNDELIVERED notification and is in the Author's queue anyway.
 */
const SUB_4 = SUB_4_BASE === null ? null : { ...SUB_4_BASE, notificationDelivered: false }

/** Another tenant's submission. It must never reach the render at all. */
const SUB_OTHER = chainOf(
  submit(
    { ...seedContext(SAM, AUTHORING, SUBMITTED_AT), staffing: FIXTURE_STAFFING },
    {
      submissionId: 'SUB-OTHER-0001',
      consumer: 'workflow',
      subject: 'Another tenant’s submission',
      tenant: OTHER_TENANT,
    },
  ),
)

/**
 * No leading `readonly ApprovalChain[]` annotation, because
 * `tests/coverage/slice-2c-gates.test.ts` gate 2 correctly reads that form as
 * the const-widening one. The narrowing predicate on `filter` already gives
 * this the right element type, so the annotation bought nothing and cost the
 * gate.
 */
export const SEEDED_CHAINS = [SUB_1, SUB_2, SUB_3, SUB_4, SUB_OTHER].filter(
  (c): c is ApprovalChain => c !== null,
)

export const SUBMITTED_TIMES: Readonly<Record<string, string>> = {
  'SUB-BB-0001': SUBMITTED_AT,
  'SUB-BB-0002': SUBMITTED_AT,
  'SUB-BB-0003': SUBMITTED_AT,
  'SUB-BB-0004': SUBMITTED_AT,
  'SUB-OTHER-0001': SUBMITTED_AT,
}

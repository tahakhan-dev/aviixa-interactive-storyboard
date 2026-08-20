import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import type { StudioIdentity } from '@/studio/access/evaluate'
import type { StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import type { StudioPersonaId } from '@/studio/modules'
import { chainStaffablePublishCheck, type ApprovalPublishSubject } from '@/studio/modules/stu-11/chain'
import { PUBLISH_CHECKS, publishCheckById, type PublishCheckId } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  registerPublishChecks,
  type PublishCheckImplementation,
  type PublishCheckRegister,
  type PublishCheckVerdict,
} from '@/studio/publish/register'
import { seededVersionDiffEngine } from '@/studio/modules/stu-12/diff'
import type {
  LinkageReading,
  PublishSubmission,
  VersionContext,
  VersionRegister,
} from '@/studio/modules/stu-12/versions'
import type { AdoptionInput } from '@/studio/state/adoption'

/**
 * The seeded scenario `SCR-STU-12` renders — Bright Bikes, the illustrative
 * example the source itself uses at L33548: Sam classifies the republish as
 * MINOR, the Reviewer validates it against the diff, Elena publishes.
 *
 * DETERMINISM. Every timestamp here is a literal. Nothing in this file reads a
 * clock or a random source, and the module under test reads neither either.
 */

export const FIXTURE_TENANT = tenantId('TEN-BRIGHT-BIKES')
export const OTHER_TENANT = tenantId('TEN-OTHER')

/** SEQ-011's illustrative window ends 2026-06-21 (L68030). */
export const FIXTURE_AS_OF = '2026-06-21T09:00:00.000Z'

export const FIXTURE_DOMAIN: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-12-VERSIONS')),
  FIXTURE_TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

export interface SeededViewer {
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  readonly note: string
}

const AUTHORING: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> = {
  'GRANT-STU-AUTHOR': 'Active',
}

function person(identityId: string, roles: StudioIdentity['roles']): StudioIdentity {
  return { identityId, roles, signedIn: true, tenant: FIXTURE_TENANT }
}

/**
 * One seeded identity per persona column, so the switcher changes WHO is
 * looking rather than what is drawn. The adoption decision keys on a FIELD, so
 * a persona switcher that did not change the identity could never show row 5
 * of the matrix behaving differently for the same role.
 */
export const SEEDED_VIEWERS: Readonly<Record<StudioPersonaId, SeededViewer>> = {
  'quality-manager': {
    identity: person('IDN-ELENA', ['QUALITY_MANAGER']),
    grants: {},
    note: 'Elena, Quality Manager and the tenant-default Release Authority. She is the only persona this module’s table permits to publish, and only as Release Authority.',
  },
  'supervisor-with-authoring-grant': {
    identity: person('IDN-SAM', ['SUPERVISOR']),
    grants: AUTHORING,
    note: 'Sam, a Supervisor holding GRANT-STU-AUTHOR. He classifies the republish and writes the description; he cannot publish it.',
  },
  'supervisor-without-grant': {
    identity: person('IDN-DEV', ['SUPERVISOR']),
    grants: {},
    note: 'A Supervisor with no authoring grant. Read-only on the history, the diff and the linkage — and the Read-only token on the export row carries its own instruction: this persona may generate the read-only export.',
  },
  'plant-manager-persona': {
    identity: person('IDN-PLANT', ['SUPERVISOR']),
    grants: {},
    note: 'DEC-ROLE-001 (L34522): this persona’s Studio access is delivered by a Supervisor role without the authoring grant. This module’s own table (L33456) heads no column for it.',
  },
  'tenant-admin': {
    identity: person('IDN-ADMIN', ['TENANT_ADMIN']),
    grants: {},
    note: 'Administers grants and holds no stage of the chain. Read-only here, and may generate the read-only export.',
  },
  'read-only-auditor': {
    identity: person('IDN-AUDIT', ['READONLY_AUDITOR']),
    grants: {},
    note: 'DEC-AUDSTU-001 is open on this persona’s read of the version history, the diff, the linkage and the export. Nothing is assumed in either direction.',
  },
  worker: {
    identity: person('IDN-WORKER', ['WORKER']),
    grants: {},
    note: 'Explicitly prohibited on every row of this module’s table. Workers meet version changes as a first-screen notice inside the pinned package, on the device.',
  },
  'implementation-team': {
    identity: person('IDN-IMPL', ['SUPERVISOR']),
    grants: { 'GRANT-STU-IMPL': 'Active' },
    note: 'The implementation team’s temporary onboarding capacity. It authors and reads; it neither reviews, publishes, archives nor decides adoption.',
  },
}

/** The Job Owner named on the Job record — a field, and not one of the eight. */
export const JOB_OWNER_IDENTITY = 'IDN-MAYA-SUPERVISOR'

/* ==================================================================== *
 * THE REGISTER.
 * ==================================================================== */

const APPROVAL_LOG = [
  'Author IDN-SAM submitted SUB-BB-0001 on 2026-06-18',
  'Reviewer IDN-RIVERSIDE advanced it on 2026-06-19',
  'Release Authority IDN-ELENA released it on 2026-06-20',
] as const

/**
 * Newest first, as `SB-STU-15`'s left column lists them. The history is
 * deliberately not tidy: `v2.0.1` is Archived, which is what makes the
 * un-archival path and the never-re-used rule exercisable, and `v9.9.0`
 * belongs to ANOTHER TENANT.
 *
 * The foreign row is in the register on purpose. Slice 4's seventh defect
 * shape was scope enforced in what a screen DREW rather than in what it READ,
 * and the only way to prove the read is doing the work is to hand the reader
 * a row it must drop.
 */
export const FIXTURE_REGISTER: VersionRegister = {
  workflowId: 'WF-BB-WHEEL-BOLT',
  tenant: FIXTURE_TENANT,
  versions: [
    {
      number: 'v2.1.0',
      tenant: FIXTURE_TENANT,
      bump: 'MINOR',
      description: 'Torque specification updated per engineering change order; severity bands re-based',
      state: 'Published',
      publishedAt: '2026-06-14T08:00:00.000Z',
      releaseAuthority: 'IDN-ELENA',
      distributable: true,
      autoAdopts: false,
      approvalLog: APPROVAL_LOG,
      basedOn: 'v2.0.1',
    },
    {
      number: 'v2.0.1',
      tenant: FIXTURE_TENANT,
      bump: 'PATCH',
      description: 'Typographical correction on the preparation screen',
      state: 'Archived',
      publishedAt: '2026-05-30T08:00:00.000Z',
      releaseAuthority: 'IDN-ELENA',
      distributable: true,
      autoAdopts: true,
      approvalLog: APPROVAL_LOG,
      basedOn: 'v2.0.0',
    },
    {
      number: 'v2.0.0',
      tenant: FIXTURE_TENANT,
      bump: 'MAJOR',
      description: 'Wheel-bolt procedure restructured into eight per-bolt screens',
      state: 'Superseded',
      publishedAt: '2026-05-02T08:00:00.000Z',
      releaseAuthority: 'IDN-ELENA',
      distributable: true,
      autoAdopts: false,
      approvalLog: APPROVAL_LOG,
      basedOn: null,
    },
    {
      number: 'v9.9.0',
      tenant: OTHER_TENANT,
      bump: 'MINOR',
      description: 'Another workspace’s version. It must never reach this render.',
      state: 'Published',
      publishedAt: '2026-06-01T08:00:00.000Z',
      releaseAuthority: 'IDN-SOMEONE-ELSE',
      distributable: true,
      autoAdopts: false,
      approvalLog: [],
      basedOn: null,
    },
  ],
  adoption: [],
  jobs: [
    { jobId: 'JOB-REDBIKE', ownerId: JOB_OWNER_IDENTITY, onVersion: 'v2.1.0', windowHours: 8 },
  ],
  runs: [
    // Maya's run, L33548. It continues and finishes on v2.1.0 whatever is
    // published centrally.
    { runId: 'RUN-2026-08-14-A', jobId: 'JOB-REDBIKE', pinnedVersion: 'v2.1.0', inFlight: true },
    { runId: 'RUN-2026-08-12-C', jobId: 'JOB-REDBIKE', pinnedVersion: 'v2.0.1', inFlight: false },
  ],
  exports: [],
  pendingSubmission: { submissionId: 'SUB-BB-0002', state: 'Released' },
}

/** The released submission awaiting publication. `Released` and no further. */
export const RELEASED_SUBMISSION: PublishSubmission = {
  submissionId: 'SUB-BB-0002',
  tenant: FIXTURE_TENANT,
  state: 'Released',
  author: 'IDN-SAM',
  reviewer: 'IDN-RIVERSIDE',
  releaseAuthority: 'IDN-ELENA',
  bump: 'MINOR',
  description: 'Torque specification updated per engineering change order; severity bands re-based',
  basedOn: 'v2.1.0',
  approvalLog: APPROVAL_LOG,
  staffing: {
    authoringGrantHolders: ['IDN-SAM', 'IDN-RIVERSIDE', 'IDN-ELENA'],
    reviewerEligible: ['IDN-RIVERSIDE', 'IDN-ELENA'],
    releaseAuthorityEligible: ['IDN-ELENA', 'IDN-QM2'],
  },
  diff: seededVersionDiffEngine('MINOR'),
}

/* ==================================================================== *
 * THE PUBLISH-CHECK REGISTER — four seeded scenarios.
 * ==================================================================== */

export type CheckScenarioId = 'all-pass' | 'one-fails' | 'one-cannot-run' | 'ten-unregistered'

export const CHECK_SCENARIO_IDS = [
  'all-pass',
  'one-fails',
  'one-cannot-run',
  'ten-unregistered',
] as const satisfies readonly CheckScenarioId[]

type MissingFromScenarios = Exclude<CheckScenarioId, (typeof CHECK_SCENARIO_IDS)[number]>
const _scenariosExhaustive: MissingFromScenarios extends never ? true : never = true
void _scenariosExhaustive

/**
 * A stand-in for a check whose owning module this wave has not built.
 *
 * **C4 stays enforced.** `implementedBy` is read off the check's OWN
 * `ownerModules`, so `registerPublishChecks` accepts these for exactly the
 * reason it would accept the real implementation — and refuses one attributed
 * to `MOD-STU-12`, which is asserted in the covering test. `MOD-STU-12` owns
 * none of the eleven and implements none of them: publication CONSUMES the
 * register, and the register is an input it can never waive.
 */
function standIn(
  checkId: PublishCheckId,
  verdict: PublishCheckVerdict,
): PublishCheckImplementation<ApprovalPublishSubject> {
  return { checkId, implementedBy: publishCheckById(checkId).ownerModules[0]!, run: () => verdict }
}

function build(
  ...implementations: readonly PublishCheckImplementation<ApprovalPublishSubject>[]
): PublishCheckRegister<ApprovalPublishSubject> {
  const result = registerPublishChecks(
    createPublishCheckRegister<ApprovalPublishSubject>(),
    ...implementations,
  )
  if (!result.ok) {
    // A fixture that cannot register is a defect in the fixture, not an
    // expected path — and it must not degrade into a partly-filled register,
    // because a partly-filled register would then block for the wrong reason.
    throw new Error(`Seeded publish-check register: ${result.failure} on ${result.checkId}`)
  }
  return result.register
}

/** Every check except the one MOD-STU-11 really implements. */
const SIBLINGS = PUBLISH_CHECKS.filter((c) => c.id !== 'chain-staffable')

export const SIBLING_CHECK_SCENARIOS: Readonly<
  Record<CheckScenarioId, PublishCheckRegister<ApprovalPublishSubject>>
> = {
  'all-pass': build(
    ...SIBLINGS.map((c) => standIn(c.id, { outcome: 'passed' })),
    chainStaffablePublishCheck,
  ),
  'one-fails': build(
    ...SIBLINGS.map((c) =>
      standIn(
        c.id,
        c.id === 'locale-completeness'
          ? {
              outcome: 'blocked',
              blockingElement:
                'the deviation-capture prompt on screen 7 is absent in Spanish, a declared locale',
            }
          : { outcome: 'passed' },
      ),
    ),
    chainStaffablePublishCheck,
  ),
  'one-cannot-run': build(
    ...SIBLINGS.map((c) =>
      standIn(
        c.id,
        c.id === 'severity-mapping'
          ? { outcome: 'cannot-run', reason: 'the global severity catalog could not be read' }
          : { outcome: 'passed' },
      ),
    ),
    chainStaffablePublishCheck,
  ),
  // The LIVE register of this wave: only MOD-STU-11 has shipped an owner, so
  // ten checks have no implementation at all and publication is refused with
  // all ten named. That is not a degraded scenario — it is what the tree says.
  'ten-unregistered': build(chainStaffablePublishCheck),
}

export function registerFor(
  scenario: CheckScenarioId,
): PublishCheckRegister<ApprovalPublishSubject> {
  return SIBLING_CHECK_SCENARIOS[scenario]
}

/* ==================================================================== *
 * THE CONTEXT.
 * ==================================================================== */

/**
 * The context one persona acts through. `audit` defaults to a sink that
 * accepts, because a fixture with no sink could not exercise the success leg —
 * and the module itself has no default, which is what makes the sink required
 * where it matters.
 */
export function contextFor(
  persona: StudioPersonaId,
  extra: Partial<VersionContext> = {},
): VersionContext {
  const viewer = SEEDED_VIEWERS[persona]
  return {
    actor: viewer.identity,
    grants: viewer.grants,
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    domain: FIXTURE_DOMAIN,
    online: true,
    at: FIXTURE_AS_OF,
    audit: () => ({ ok: true }),
    ...extra,
  }
}

/**
 * A context whose actor IS the Job Owner named on the Job record. It is built
 * from the field rather than from a role, which is the whole point of row 5.
 */
export function jobOwnerContext(extra: Partial<VersionContext> = {}): VersionContext {
  return {
    ...contextFor('supervisor-without-grant'),
    actor: person(JOB_OWNER_IDENTITY, ['SUPERVISOR']),
    ...extra,
  }
}

/* ==================================================================== *
 * THE TWO SEAM READINGS.
 * ==================================================================== */

/** What the Hub answers when it answers. */
export const LINKAGE_AVAILABLE: LinkageReading = {
  available: true,
  jobs: FIXTURE_REGISTER.jobs,
}

/**
 * And what renders when it does not. Never zero: zero is a business answer and
 * this is the absence of one (`AC-STU-053` L32018).
 */
export const LINKAGE_UNAVAILABLE: LinkageReading = {
  available: false,
  lastRetrievedAt: '2026-06-21T08:41:00.000Z',
  reason: 'the Delivery Operations Hub linkage service did not answer',
}

/**
 * Per-device adoption tracking, read across the command-channel seam. The
 * third device is the case L33579 legislates: its command state cannot be
 * determined, so it renders as unknown with the last known state and its
 * timestamp — never as adopted.
 */
export const SEEDED_DEVICES: readonly AdoptionInput[] = [
  { deviceId: 'TAB-BB-01', commandState: 'delivered', lastKnown: null },
  { deviceId: 'TAB-BB-02', commandState: 'queued', lastKnown: null },
  {
    deviceId: 'TAB-BB-03',
    commandState: null,
    lastKnown: { state: 'downloaded', at: '2026-06-20T22:10:00.000Z' },
  },
]

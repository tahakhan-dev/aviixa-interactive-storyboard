import { scenarioRunId, tenantId, type TenantId } from '@/domain/ids'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { permitsAction, permitsRead, type PermissionOutcome } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioIdentity,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import { WHEEL_BOLT_DRAFT_CONTENT } from '@/studio/journey/fixture'
import type { WorkflowStatus } from '@/studio/vocab'
import { routedProhibitionApplies } from '@/studio/modules/stu-18/rendering'
import { stu03Row, type Stu03RowId, type StudioLibraryMatrixRow } from './matrix'

/**
 * `MOD-STU-03` — the Workflow Library and Tenant Workspace, §5.3, card
 * L31871–L32030. Purpose (L31886): "Hold, classify, filter, and expose the
 * tenant's complete Workflow inventory with authoring status, version, and
 * linkage."
 *
 * FOUR RULES THIS FILE EXISTS TO HOLD, each one a defect this build has
 * already paid for once somewhere else.
 *
 * 1. **DRAFT VISIBILITY IS A READ, NOT A RENDER (R14, `AC-STU-048` L32013).**
 *    `workflowsVisibleTo` is the only way a screen gets rows, and it applies
 *    two selectors over two matrix rows: row 1 decides whether the Library
 *    opens at all, row 2 decides whether Draft and In Review rows enter the
 *    result. A caller that may not read drafts is never handed one, so no
 *    draft can be recovered from the markup, from a hidden element, or from
 *    a filter applied one branch later. Scope is enforced in what the screen
 *    READS, never in what it DRAWS.
 *
 * 2. **AN UNAVAILABLE LINKAGE COUNT IS NEVER ZERO (`AC-STU-053` L32018).**
 *    `LinkageReading`'s unavailable arm carries NO count fields at all, so
 *    rendering a zero from an absence is not a branch anybody could take
 *    wrongly — it fails to compile. L31956 states the reason: "showing zero
 *    linked Jobs would invite an author to change a Workflow they believe is
 *    unused." A LIVE zero is a different thing and still renders as zero,
 *    because zero linked Jobs is a business answer.
 *
 * 3. **EVERY WRITE GOES THROUGH THE AUDIT PATH, IN ONE ORDER.** Domain
 *    refusals first (a refused action is not an action, so the sink is never
 *    reached), then the audit append, then the mutation. L32002: "Workflow
 *    creation, classification assignment, custom-type creation, and every
 *    implementation-team action are recorded in the tenant audit log in the
 *    same transaction." `FB-STU-10` is the floor: an action that cannot be
 *    audited does not happen.
 *
 * 4. **TENANT ISOLATION RETURNS A REFUSAL, NOT AN EMPTY RESULT (L32004).**
 *    `openWorkflowById` looks the identifier up across the WHOLE register on
 *    purpose: it is the only way to tell "belongs to another tenant" from
 *    "does not exist", and the source requires the first to be refused and
 *    audited rather than silently answered as the second.
 *
 * DETERMINISM. No clock and no random source. Every date is a constant taken
 * from the source's own illustrative example, every identifier is fixed, and
 * every register is a parameter or a frozen seed. Nothing is mutated in
 * place: every result carries a new array, and a refusal carries the
 * original one.
 */

/* ==================================================================== *
 * 1. THE STATUS VOCABULARY — L31924, and the partition that gates the read.
 * ==================================================================== */

/**
 * `WorkflowStatus` and `WORKFLOW_STATUSES` are NOT declared here and are NOT
 * re-exported from here. They are lifecycle vocabulary shared with
 * `MOD-STU-12`, so they live once in `@/studio/vocab/lifecycle` beside the
 * other closed sets, and a module reaches them through the one import site.
 * A re-export would make the name importable from two places, which is the
 * condition the hoist exists to end.
 *
 * What stays below is this module's OWN policy over those four names: the
 * draft/released partition that gates the read (matrix row 2, L31905) and the
 * filter the Library opens on (`AC-STU-047`, L32012). Neither is a
 * vocabulary; both are `MOD-STU-03` rules that happen to be expressed in it.
 */

/**
 * The two statuses row 2 gates — "See Draft and In Review Workflows"
 * (L31905), in the row's own words and in its own order.
 */
export const UNRELEASED_STATUSES = ['Draft', 'In Review'] as const satisfies readonly WorkflowStatus[]

/**
 * The statuses every reader who may open the Library reads.
 *
 * `Published` is row 1's own word. `Archived` is NOT stated by any matrix
 * row, and putting it here is a derivation this module discloses rather than
 * assumes — see `UNSPECIFIED_IN_SOURCE`. The reading: the state machine
 * annotates Archived "retained and permanently readable, not linkable"
 * (L31964) and `OBJ-036` states that "prior versions are retained in full and
 * remain permanently readable" (L8603), so an archived Workflow is published
 * content that has been retired, not unreleased content.
 */
export const RELEASED_STATUSES = ['Published', 'Archived'] as const satisfies readonly WorkflowStatus[]

/**
 * THE PARTITION IS TOTAL, AND THIS IS THE PROOF. A fifth status added to
 * `WorkflowStatus` without a decision about which side of the draft-
 * visibility boundary it falls on stops this `Exclude` resolving to `never`
 * and fails to compile. A status that belonged to neither list would
 * otherwise default to visible, which is the wrong direction to fail in.
 */
type StatusesUnclassified = Exclude<
  WorkflowStatus,
  (typeof UNRELEASED_STATUSES)[number] | (typeof RELEASED_STATUSES)[number]
>
const _statusPartitionTotal: StatusesUnclassified extends never ? true : never = true
void _statusPartitionTotal

export function isUnreleasedStatus(status: WorkflowStatus): boolean {
  return (UNRELEASED_STATUSES as readonly WorkflowStatus[]).includes(status)
}

/**
 * `AC-STU-017` (L31097) and `AC-STU-047` (L32012): the Library is the landing
 * view and opens with the Published filter applied. It is the DEFAULT, not
 * the only value — `FUNC-STU-03-01-A-2` (L31931) calls it "the default
 * Published filter on open".
 */
export const DEFAULT_STATUS_FILTER: WorkflowStatus = 'Published'

/* ==================================================================== *
 * 2. LINKAGE — the reading that can never be a zero.
 * ==================================================================== */

/**
 * A linkage answer from the Delivery Operations Hub, or the absence of one.
 *
 * THE UNAVAILABLE ARM HAS NO COUNTS, AND THAT IS THE ENFORCEMENT. Every
 * other way of writing this — a nullable count, a count plus an
 * `available` boolean, a count defaulting to zero — leaves a shape in which
 * an absence can be rendered as a number, and this build has shipped that
 * defect once already on a different axis (slice 4's loading-never-renders-
 * a-zero rule). Here it is not a rule to remember; it is a field that does
 * not exist.
 */
export type LinkageReading =
  | {
      readonly status: 'live'
      /** Jobs currently linked to this version. Zero is a real answer. */
      readonly linkedJobs: number
      readonly linkedRuns: number
      /** L31984: reconnection "replaces any last-retrieved marker with live
       *  data, stating the refresh time". */
      readonly refreshedAt: string
    }
  | {
      readonly status: 'unavailable'
      readonly lastRetrievedAt: string
    }

/** The exact phrase `FUNC-STU-03-01-A-1` (L31930) requires, quoted. */
export const LINKAGE_UNAVAILABLE_PREFIX = 'Linkage unavailable, last retrieved at'

/**
 * ONE fold from a reading to the sentence a reader sees. Both the table cell
 * and the seam notice read it, so a change moves both — a second fold is how
 * one card ends up saying "0 Jobs" while another two paragraphs away says
 * the count could not be read.
 */
export function linkageStatement(reading: LinkageReading): string {
  if (reading.status === 'unavailable') {
    return `${LINKAGE_UNAVAILABLE_PREFIX} ${reading.lastRetrievedAt}`
  }
  return (
    `${reading.linkedJobs} linked ${reading.linkedJobs === 1 ? 'Job' : 'Jobs'} · ` +
    `${reading.linkedRuns} linked ${reading.linkedRuns === 1 ? 'Run' : 'Runs'}, ` +
    `refreshed at ${reading.refreshedAt}`
  )
}

/* ==================================================================== *
 * 3. THE TAXONOMY — D20 / `DEC-TAX-002`, adopted.
 * ==================================================================== */

export type TaxonomyKind = 'Job Type' | 'Service Type tag'

export const TAXONOMY_KINDS = [
  'Job Type',
  'Service Type tag',
] as const satisfies readonly TaxonomyKind[]

type MissingFromTaxonomyKinds = Exclude<TaxonomyKind, (typeof TAXONOMY_KINDS)[number]>
const _taxonomyKindsExhaustive: MissingFromTaxonomyKinds extends never ? true : never = true
void _taxonomyKindsExhaustive

export type TaxonomyOrigin = 'platform-seeded' | 'tenant-created'

export const TAXONOMY_ORIGINS = [
  'platform-seeded',
  'tenant-created',
] as const satisfies readonly TaxonomyOrigin[]

type MissingFromOrigins = Exclude<TaxonomyOrigin, (typeof TAXONOMY_ORIGINS)[number]>
const _originsExhaustive: MissingFromOrigins extends never ? true : never = true
void _originsExhaustive

export interface TaxonomyEntry {
  readonly name: string
  readonly kind: TaxonomyKind
  readonly origin: TaxonomyOrigin
  /** `null` on a platform-seeded entry: it is inherited by every workspace. */
  readonly tenant: TenantId | null
  readonly sourceRef: string
}

export const SEEDED_TENANT: TenantId = tenantId('TEN-BRIGHT-BIKES')

/**
 * **EMPTY, AND EMPTY IS THE ANSWER.** `DEC-TAX-002`'s adopted working
 * position of 2026-08-14 (L31892): "The platform-seeded catalogue of Job
 * Types and Service Type tags ships empty: zero seeded entries at version 1.
 * Every tenant creates its own Job Types and Service Type tags immediately,
 * on every tier, with no platform approval step, so no tenant is blocked."
 *
 * L31894 is why nothing may be invented to fill it: "The canonical names and
 * codes of the eight starter Job Types and the eight starter Service Type
 * tags are not stated anywhere in the Statement of Work … no screen, table,
 * or example in this chapter names a starter Job Type or Service Type tag as
 * though it were canonical." **No fixture in this module names one.**
 */
export const SEEDED_JOB_TYPES = [] as const satisfies readonly TaxonomyEntry[]
export const SEEDED_SERVICE_TYPE_TAGS = [] as const satisfies readonly TaxonomyEntry[]

/**
 * The counts stay source-confirmed even though the names are owed, and both
 * halves of the internal tension render rather than one being smoothed away.
 *
 * `contradictsSection532` is the decision card's OWN description of its
 * option (c) (L31896): "the platform ships with an empty seeded set and every
 * tenant creates its own, **which contradicts §5.3.2's statement that the
 * platform seeds eight and eight**".
 *
 * `reconciliation` is the same card's answer, in the same line: "Because the
 * mechanism and the counts are preserved and only the load is deferred,
 * §5.3.2's eight-and-eight statement is satisfied on delivery of the names
 * rather than contradicted."
 */
export const SEEDED_TAXONOMY_COUNTS = {
  jobTypes: 8,
  serviceTypeTags: 8,
  countsRef: 'L31890 (§5.3.2), L31892',
  contradictsSection532:
    'The decision card lists option (c) — ship an empty seeded set and let every tenant create ' +
    'its own — as the option "which contradicts §5.3.2’s statement that the platform seeds eight ' +
    'and eight". That objection is recorded here rather than smoothed away.',
  reconciliation:
    'Because the mechanism and the counts are preserved and only the load is deferred, §5.3.2’s ' +
    'eight-and-eight statement is satisfied on delivery of the names rather than contradicted.',
  reconciliationRef: 'L31896',
} as const

/**
 * The tenant's OWN entries — the only working vocabulary at version 1.
 *
 * `Assembly` is the source's own illustrative Job Type and the fixed
 * illustrative cast pins it to `JOB-REDBIKE` (L31896, L31978). The journey
 * fixture already records why it is safe to use: "it is not a
 * starter-taxonomy name and none is named anywhere in this blueprint"
 * (L7908). It is read from that fixture rather than retyped, so a change
 * there moves this.
 */
export const TENANT_JOB_TYPES = [
  {
    name: WHEEL_BOLT_DRAFT_CONTENT.jobType,
    kind: 'Job Type',
    origin: 'tenant-created',
    tenant: SEEDED_TENANT,
    sourceRef:
      'Illustrative Example — L31978, L7908. Tenant-created, never a starter-taxonomy name: the ' +
      'platform-seeded catalogue is empty under DEC-TAX-002.',
  },
] as const satisfies readonly TaxonomyEntry[]

/**
 * NO SEEDED SERVICE TYPE TAG AND NO TENANT ONE EITHER, deliberately. The
 * journey fixture records `serviceTypeTag: null` for the illustrative
 * Workflow, and inventing a tag name here would put a taxonomy name on
 * screen that the source does not carry. The tag is OPTIONAL (L31890), so
 * an empty tag vocabulary is a working state rather than a blocked one —
 * which is precisely the asymmetry `AC-STU-050` and `AC-STU-051` draw.
 */
export const TENANT_SERVICE_TYPE_TAGS = [] as const satisfies readonly TaxonomyEntry[]

/* ==================================================================== *
 * 4. THE WORKFLOW RECORD AND THE SEEDED REGISTER.
 * ==================================================================== */

/**
 * `OBJ-STU-WORKFLOW` (L31922) = `OBJ-036` (L8589). **D11: the numeric
 * register is canonical and the mnemonic is a label**, so the record carries
 * both identifiers and neither is presented as a second object.
 */
export const WORKFLOW_OBJECT = {
  numericId: 'OBJ-036',
  mnemonic: 'OBJ-STU-WORKFLOW',
  numericRef: 'L8589',
  mnemonicRef: 'L31922',
  note:
    'One object under two identifiers. D11: the numeric register is canonical and the mnemonic ' +
    'is a label, so nothing here treats them as two objects with two lifecycles.',
} as const

export interface WorkflowRecord {
  readonly id: string
  readonly name: string
  readonly tenant: TenantId
  readonly status: WorkflowStatus
  /** Exactly one, always (`AC-STU-050` L32015, `FUNC-STU-03-02-C-1` L31941). */
  readonly jobType: string
  /** Optional, and nothing structural hangs on it (`AC-STU-051` L32016). */
  readonly serviceTypeTag: string | null
  /** `null` until a version is published (`MOD-STU-12` owns the numbering). */
  readonly currentVersion: string | null
  readonly lastPublishedAt: string | null
  readonly linkage: LinkageReading
  /** Why this row is in the seeded register, in the source's own terms. */
  readonly note: string
}

/**
 * The illustrative example's own date. L31978 names `RUN-2026-08-14-A`, and
 * `DEC-TAX-002`'s adopted working position is dated 2026-08-14. No clock is
 * read anywhere in this module.
 */
export const LIBRARY_AS_OF = '2026-08-14'

/**
 * The seeded register.
 *
 * FOUR PROPERTIES IT IS BUILT TO HAVE, each one there so a check over it can
 * actually fail:
 *
 * - **all four statuses are present in the acting tenant**, so the
 *   draft-visibility boundary separates a NON-EMPTY set from a NON-EMPTY set
 *   and a subset assertion over the two cannot pass vacuously;
 * - **one row belongs to another tenant**, so the scope filter has something
 *   real to exclude — a filter with nothing outside it is a filter no test
 *   can fail;
 * - **one row's linkage is unavailable and another's is a live zero**, so
 *   "an absence never renders as zero" is distinguishable from "zero never
 *   renders";
 * - **no row names a starter Job Type or Service Type tag** (L31894).
 */
export const SEEDED_WORKFLOWS = [
  {
    id: 'WF-BB-WHEEL-BOLT-TORQUE',
    name: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
    tenant: SEEDED_TENANT,
    status: 'Published',
    jobType: WHEEL_BOLT_DRAFT_CONTENT.jobType,
    serviceTypeTag: WHEEL_BOLT_DRAFT_CONTENT.serviceTypeTag,
    currentVersion: 'v2.1.0',
    lastPublishedAt: LIBRARY_AS_OF,
    linkage: { status: 'live', linkedJobs: 1, linkedRuns: 1, refreshedAt: LIBRARY_AS_OF },
    note:
      'The Illustrative Example at L31978: Assembly — Wheel Bolt Torque Verification at v2.1.0, ' +
      'Published, linked to one active Job (JOB-REDBIKE) and one active Run (RUN-2026-08-14-A).',
  },
  {
    id: 'WF-BB-HUB-BEARING-PRESS',
    name: 'Assembly — Hub Bearing Press Fit',
    tenant: SEEDED_TENANT,
    status: 'Draft',
    jobType: WHEEL_BOLT_DRAFT_CONTENT.jobType,
    serviceTypeTag: null,
    currentVersion: null,
    lastPublishedAt: null,
    // A LIVE ZERO. An unpublished Workflow genuinely has no linked Jobs, and
    // that is a business answer rather than an absence of one — which is what
    // makes the unavailable row below distinguishable from this one.
    linkage: { status: 'live', linkedJobs: 0, linkedRuns: 0, refreshedAt: LIBRARY_AS_OF },
    note:
      'Draft, so visible only to grant-holders and the chain (L31905, L31961). Its zero linkage ' +
      'is LIVE and true: nothing links to a Workflow that has never been published.',
  },
  {
    id: 'WF-BB-BRAKE-CABLE-ROUTING',
    name: 'Assembly — Brake Cable Routing Check',
    tenant: SEEDED_TENANT,
    status: 'In Review',
    jobType: WHEEL_BOLT_DRAFT_CONTENT.jobType,
    serviceTypeTag: null,
    currentVersion: null,
    lastPublishedAt: null,
    // THE UNAVAILABLE ROW. AC-STU-053 (L32018) and TEST-STU-058 (L32026).
    linkage: { status: 'unavailable', lastRetrievedAt: LIBRARY_AS_OF },
    note:
      'In Review, so gated by the same row-2 read as a Draft. Its linkage could not be read from ' +
      'the Delivery Operations Hub, which renders as unavailable with its retrieval timestamp and ' +
      'never as zero (L31930, L31956).',
  },
  {
    id: 'WF-BB-RIM-TRUE-LEGACY',
    name: 'Assembly — Rim Trueing, retired method',
    tenant: SEEDED_TENANT,
    status: 'Archived',
    jobType: WHEEL_BOLT_DRAFT_CONTENT.jobType,
    serviceTypeTag: null,
    currentVersion: 'v1.4.0',
    lastPublishedAt: '2026-03-02',
    linkage: { status: 'live', linkedJobs: 0, linkedRuns: 0, refreshedAt: LIBRARY_AS_OF },
    note:
      'Archived: retained and permanently readable, and NOT linkable (L31964). Without an ' +
      'archived row the Library cannot express not-linkable at all, which is D6’s reason for ' +
      'keeping the state.',
  },
  {
    id: 'WF-OTHER-FRAME-WELD',
    name: 'Fabrication — Frame Weld Inspection',
    tenant: tenantId('TEN-OTHER-TENANT'),
    status: 'Published',
    jobType: 'Fabrication',
    serviceTypeTag: null,
    currentVersion: 'v3.0.0',
    lastPublishedAt: '2026-05-19',
    linkage: { status: 'live', linkedJobs: 4, linkedRuns: 9, refreshedAt: LIBRARY_AS_OF },
    note:
      'A Workflow in a DIFFERENT tenant. L31879: a user in one tenant’s workspace can never see ' +
      'another tenant’s Workflow content. It is here so the scope filter has something real to ' +
      'exclude and so the cross-tenant refusal has a real identifier to refuse.',
  },
] as const satisfies readonly WorkflowRecord[]

export interface LibraryState {
  readonly workflows: readonly WorkflowRecord[]
  readonly jobTypes: readonly TaxonomyEntry[]
  readonly serviceTypeTags: readonly TaxonomyEntry[]
}

export const SEEDED_LIBRARY: LibraryState = {
  workflows: SEEDED_WORKFLOWS,
  jobTypes: [...SEEDED_JOB_TYPES, ...TENANT_JOB_TYPES],
  serviceTypeTags: [...SEEDED_SERVICE_TYPE_TAGS, ...TENANT_SERVICE_TYPE_TAGS],
}

/* ==================================================================== *
 * 5. PERSONA → IDENTITY, AND THE ONE ACCESS CALL.
 * ==================================================================== */

export interface SeededLibraryIdentity {
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
}

function seeded(
  identityId: string,
  roles: readonly RoleId[],
  grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> = {},
): SeededLibraryIdentity {
  return { identity: { identityId, roles, signedIn: true, tenant: SEEDED_TENANT }, grants }
}

/**
 * The source's own illustrative cast (L34633), one identity per column.
 *
 * `tests/unit/stu-library.test.ts` pins this map against `MOD-STU-18`'s so
 * the two cannot drift into two different Sams; the map is not imported from
 * there, because a module owning its own seeded scenario is the pattern
 * `MOD-STU-01` and `MOD-STU-18` both already follow.
 */
const PERSONA_IDENTITIES: Readonly<Record<StudioPersonaColumn, SeededLibraryIdentity>> = {
  'quality-manager': seeded('IDN-BB-ELENA', ['QUALITY_MANAGER']),
  'supervisor-with-authoring-grant': seeded('IDN-BB-SAM', ['SUPERVISOR'], {
    'GRANT-STU-AUTHOR': 'Active',
  }),
  'supervisor-without-grant': seeded('IDN-BB-TOMAS', ['SUPERVISOR']),
  // DEC-ROLE-001 (L34522): delivered by a Supervisor role without the grant.
  'plant-manager-persona': seeded('IDN-BB-PLANT', ['SUPERVISOR']),
  'tenant-admin': seeded('IDN-BB-PRIYA', ['TENANT_ADMIN']),
  'read-only-auditor': seeded('IDN-BB-OMAR', ['READONLY_AUDITOR']),
  worker: seeded('IDN-BB-MAYA', ['WORKER']),
  // L34520: a provisioned, temporary authoring capacity during onboarding,
  // attached to whatever tenant role the person holds — never a sixth role.
  'implementation-team': seeded('IDN-BB-IMPL', ['SUPERVISOR'], { 'GRANT-STU-IMPL': 'Active' }),
}

export function libraryIdentity(persona: StudioPersonaColumn): SeededLibraryIdentity {
  return PERSONA_IDENTITIES[persona]
}

export const SEEDED_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('STU-03-WORKFLOW-LIBRARY')),
  SEEDED_TENANT,
  (partition) => ({
    ...partition,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE',
    tier: 'Enterprise',
  }),
)

/**
 * Everything a reviewer can vary. Each field is a real input of this module
 * as its Inputs, Dependencies and Preconditions lines put them: the persona
 * column, the identity layer, connectivity, the commercial tier, and the two
 * grants that open a column here.
 *
 * `implGrant` is not decoration. Row 1 and row 2 both read "Allowed with
 * conditions — during onboarding only" for the implementation team, and the
 * condition is enforced by the grant STATE rather than by a second flag:
 * `Active` is onboarding open, `Expired` is L31944's "revoked at the
 * conclusion of onboarding". Task 1's evaluator already refuses a lapsed
 * grant by name rather than degrading the session silently, so modelling the
 * condition this way needs no code here at all.
 */
export interface LibraryScenario {
  readonly persona: StudioPersonaColumn
  readonly online: boolean
  readonly identityLayer: IdentityLayerState
  readonly commercialTier: StudioCommercialTier
  readonly authoringGrant: StudioGrantState | null
  readonly implGrant: StudioGrantState | null
  /** Where a linkage read has failed, the whole Library reads it as absent. */
  readonly linkageAvailable: boolean
}

export const SEEDED_SCENARIO: LibraryScenario = {
  persona: 'quality-manager',
  online: true,
  identityLayer: 'reachable',
  commercialTier: 'Enterprise',
  authoringGrant: 'Active',
  implGrant: 'Active',
  linkageAvailable: true,
}

/**
 * Which grants the identity layer reports for this scenario.
 *
 * The seeded map already carries the grant that OPENS each column; the
 * scenario overrides its STATE so a reviewer can watch a lapsed grant be
 * named. A grant is never recorded against a persona no column opens with
 * it, because that would make the evaluator report a revocation for
 * something that was never the obstacle.
 */
export function libraryGrants(
  s: LibraryScenario,
): Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> {
  const base = { ...libraryIdentity(s.persona).grants }
  if (base['GRANT-STU-AUTHOR'] !== undefined) {
    if (s.authoringGrant === null) delete base['GRANT-STU-AUTHOR']
    else base['GRANT-STU-AUTHOR'] = s.authoringGrant
  }
  if (base['GRANT-STU-IMPL'] !== undefined) {
    if (s.implGrant === null) delete base['GRANT-STU-IMPL']
    else base['GRANT-STU-IMPL'] = s.implGrant
  }
  return base
}

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every affordance and every read
 * routes through here, per control, over the matrix ROW — never over a
 * module-level role list, which could not express the two Supervisor
 * columns, the Plant Manager persona or `GRANT-STU-IMPL` in any case.
 */
export function libraryDecision(
  rowId: Stu03RowId,
  s: LibraryScenario,
  resourceTenant: TenantId = SEEDED_TENANT,
): StudioAccessDecision {
  return evaluateStudioAccess({
    row: stu03Row(rowId),
    identity: libraryIdentity(s.persona).identity,
    grants: libraryGrants(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant,
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
}

/* ==================================================================== *
 * 6. THE READ. Two selectors, two rows, and scope applied here.
 * ==================================================================== */

/**
 * THE ONLY WAY A SCREEN GETS ROWS.
 *
 * Three reads, in this order, and each one is a READ rather than a render
 * rule:
 *
 * 1. **Row 1** — may this persona open the Library at all? A refusal returns
 *    nothing, because a Worker who cannot open the Library has no inventory
 *    to be filtered.
 * 2. **Tenant scope** — L31879, absolute. A row outside the acting identity's
 *    tenant never enters the result, so it cannot be uncovered from the
 *    markup.
 * 3. **Row 2** — may this persona read Draft and In Review? A refusal removes
 *    those rows from the RESULT. The component is never handed one, which is
 *    the whole of `AC-STU-048` and the whole of R14. The gate asserts this
 *    selector, not the render.
 *
 * `linkageAvailable` is folded in HERE rather than at the table cell, so
 * every consumer of a row — the table, the seam notice, an export — sees the
 * same absence. A fold applied to one render branch of several is a defect
 * shape this build has already shipped.
 */
export function workflowsVisibleTo(
  state: LibraryState,
  s: LibraryScenario,
): readonly WorkflowRecord[] {
  if (!permitsRead(libraryDecision('open-the-library-filtered-to-published', s).decision)) return []

  const tenant = libraryIdentity(s.persona).identity.tenant
  const inTenant = state.workflows.filter((w) => w.tenant === tenant)

  const mayReadUnreleased = permitsAction(
    libraryDecision('see-draft-and-in-review-workflows', s).decision,
  )
  const readable = mayReadUnreleased ? inTenant : inTenant.filter((w) => !isUnreleasedStatus(w.status))

  return s.linkageAvailable
    ? readable
    : readable.map((w) => ({
        ...w,
        linkage: { status: 'unavailable', lastRetrievedAt: LIBRARY_AS_OF } as const,
      }))
}

/**
 * `SB-STU-06`'s filter bar (L31976): "status (default Published), Job Type,
 * Service Type tag, and free-text name search". Four controls, no fifth, and
 * nothing invented.
 *
 * IT IS A DETERMINISTIC FILTER AND NOT A SEMANTIC ONE. L31986: "Search here
 * is a deterministic filter, not a semantic one; the only semantic search on
 * this surface is over the Coaching Corpus in `MOD-STU-07`." Case-folding is
 * the only normalisation applied.
 *
 * IT IS APPLIED AFTER `workflowsVisibleTo`, NEVER INSTEAD OF IT. A filter is
 * a convenience for a reader; the read above is the permission boundary.
 */
export interface LibraryFilters {
  readonly status: WorkflowStatus | 'All'
  readonly jobType: string | 'All'
  readonly serviceTypeTag: string | 'All'
  readonly nameSearch: string
}

export const DEFAULT_FILTERS: LibraryFilters = {
  status: DEFAULT_STATUS_FILTER,
  jobType: 'All',
  serviceTypeTag: 'All',
  nameSearch: '',
}

export function applyLibraryFilters(
  rows: readonly WorkflowRecord[],
  filters: LibraryFilters,
): readonly WorkflowRecord[] {
  const needle = filters.nameSearch.trim().toLowerCase()
  return rows.filter(
    (w) =>
      (filters.status === 'All' || w.status === filters.status) &&
      (filters.jobType === 'All' || w.jobType === filters.jobType) &&
      (filters.serviceTypeTag === 'All' || w.serviceTypeTag === filters.serviceTypeTag) &&
      (needle === '' || w.name.toLowerCase().includes(needle)),
  )
}

/* ==================================================================== *
 * 7. THE AUDIT SINK.
 * ==================================================================== */

/**
 * L32002 names four audited things, and L32004 adds the fifth: "a Workflow
 * identifier from another tenant returns a refusal, not an empty result, and
 * the attempt is audited."
 */
export type LibraryAuditAction =
  | 'create-workflow'
  | 'assign-classification'
  | 'create-custom-type'
  | 'refused-cross-tenant-read'
  | 'refused-unreleased-read'

export const LIBRARY_AUDIT_ACTIONS = [
  'create-workflow',
  'assign-classification',
  'create-custom-type',
  'refused-cross-tenant-read',
  'refused-unreleased-read',
] as const satisfies readonly LibraryAuditAction[]

type MissingFromAuditActions = Exclude<LibraryAuditAction, (typeof LIBRARY_AUDIT_ACTIONS)[number]>
const _auditActionsExhaustive: MissingFromAuditActions extends never ? true : never = true
void _auditActionsExhaustive

export interface LibraryAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly action: LibraryAuditAction
  /** The Workflow or taxonomy entry acted on, or attempted. */
  readonly subject: string
  /** The acting identity's own tenant — never the subject's. */
  readonly tenant: TenantId
  /**
   * L31898/L32002: "every implementation-team action" is audited. Carried as
   * a derived flag on the entry rather than as a sixth action name, because
   * it qualifies WHO acted and not WHAT was done.
   */
  readonly implementationTeamAction: boolean
  readonly sourceRefs: readonly string[]
}

export type LibraryAuditResult = { readonly ok: true } | { readonly ok: false; readonly reason: string }
export type LibraryAuditWrite = (entry: LibraryAuditEntry) => LibraryAuditResult

const AUDIT_REFS = ['L32002', 'L32004', 'FB-STU-10 L31454'] as const

function isImplementationTeam(s: LibraryScenario): boolean {
  return s.persona === 'implementation-team'
}

/* ==================================================================== *
 * 8. OPENING ONE WORKFLOW BY IDENTIFIER — refusal, never an empty result.
 * ==================================================================== */

export type WorkflowLookup =
  | { readonly ok: true; readonly workflow: WorkflowRecord }
  | {
      readonly ok: false
      readonly kind: 'refused-not-a-library-reader' | 'refused-cross-tenant' | 'refused-unreleased'
      readonly message: string
      /** Whether the attempt reached the tenant audit log. */
      readonly audited: boolean
    }
  | { readonly ok: false; readonly kind: 'not-found'; readonly message: string; readonly audited: false }

/**
 * `TEST-STU-055` (L32023) and `TEST-STU-060` (L32028), both of which end
 * "confirm refusal and audit entry".
 *
 * WHY THE LOOKUP RUNS OVER THE WHOLE REGISTER AND NOT OVER
 * `workflowsVisibleTo`. Scoping the lookup would turn a cross-tenant
 * identifier into "no such Workflow" — an EMPTY RESULT, which is exactly
 * what L32004 forbids: "a Workflow identifier from another tenant returns a
 * refusal, not an empty result, and the attempt is audited." The read filter
 * keeps the row off the screen; this keeps the answer honest for anyone who
 * types the identifier anyway, because taking a row off the screen does not
 * stop anyone.
 *
 * WHY AN AUDIT FAILURE DOES NOT TURN A REFUSAL INTO A PERMISSION. `FB-STU-10`
 * refuses an action that cannot be audited; a refusal was never an action, so
 * it still stands — but the reader is told the attempt went unrecorded rather
 * than being allowed to assume it was captured.
 */
export function openWorkflowById(input: {
  readonly state: LibraryState
  readonly scenario: LibraryScenario
  readonly workflowId: string
  readonly writeAudit: LibraryAuditWrite
}): WorkflowLookup {
  const { state, scenario, workflowId, writeAudit } = input
  const actor = libraryIdentity(scenario.persona).identity
  const actorTenant = actor.tenant ?? SEEDED_TENANT

  const audit = (action: LibraryAuditAction): boolean =>
    writeAudit({
      actorIdentityId: actor.identityId,
      action,
      subject: workflowId,
      tenant: actorTenant,
      implementationTeamAction: isImplementationTeam(scenario),
      sourceRefs: AUDIT_REFS,
    }).ok

  const unrecorded = (audited: boolean): string =>
    audited
      ? ''
      : ' The attempt could not be written to the tenant audit log, so it is unrecorded; the ' +
        'refusal stands either way, because failing closed is the safe direction (FB-STU-10).'

  const openDecision = libraryDecision('open-the-library-filtered-to-published', scenario)
  if (!permitsRead(openDecision.decision)) {
    const audited = audit('refused-cross-tenant-read')
    return {
      ok: false,
      kind: 'refused-not-a-library-reader',
      message: `Refused: ${openDecision.reason}${unrecorded(audited)}`,
      audited,
    }
  }

  // Deliberately unscoped. See the note above.
  const found = state.workflows.find((w) => w.id === workflowId)

  if (found === undefined) {
    return {
      ok: false,
      kind: 'not-found',
      message:
        `No Workflow is registered under “${workflowId}” in this platform. This is a plain ` +
        'not-found and not a refusal: nothing was withheld, so nothing was attempted against a ' +
        'tenant and no audit entry was appended.',
      audited: false,
    }
  }

  if (found.tenant !== actorTenant) {
    const audited = audit('refused-cross-tenant-read')
    const cell = stu03Row('see-another-tenants-workflows').cells[scenario.persona]
    return {
      ok: false,
      kind: 'refused-cross-tenant',
      message:
        `Refused: “${workflowId}” belongs to another tenant. Tenant isolation is absolute at the ` +
        'Library query layer, and a Workflow identifier from another tenant returns a refusal ' +
        `rather than an empty result (L32004). The matrix says the same thing in one word: ` +
        `${cell.note} (L31912).${unrecorded(audited)}`,
      audited,
    }
  }

  if (
    isUnreleasedStatus(found.status) &&
    !permitsAction(libraryDecision('see-draft-and-in-review-workflows', scenario).decision)
  ) {
    const audited = audit('refused-unreleased-read')
    return {
      ok: false,
      kind: 'refused-unreleased',
      message:
        `Refused: “${found.name}” is ${found.status}, and Draft and In Review visibility is ` +
        'restricted to grant-holders and the chain — which "prevents an unreleased specification ' +
        'limit from being read as though it were policy" (L32004). Opening it by direct address ' +
        `is refused for the same reason the row is not in the list.${unrecorded(audited)}`,
      audited,
    }
  }

  return { ok: true, workflow: found }
}

/* ==================================================================== *
 * 9. CREATING A WORKFLOW — refusals, then audit, then mutation.
 * ==================================================================== */

export interface CreateWorkflowDraft {
  readonly name: string
  readonly jobType: string
  readonly serviceTypeTag: string | null
}

export interface LibraryWriteResult {
  readonly ok: boolean
  /** The NEW state on success; the ORIGINAL, untouched, on every refusal. */
  readonly state: LibraryState
  readonly message: string
}

/** Deterministic, and derived from the name rather than from a counter. */
export function workflowIdFor(name: string): string {
  return `WF-${name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`
}

/**
 * `FUNC-STU-03-01-B-1` (L31934): "Create a new Workflow, capturing name, Job
 * Type, and optional Service Type tag, then enter the Builder canvas." The
 * happy path's step 5 (L31954) says what state it lands in: "The Studio
 * creates the Workflow in Draft and opens the Builder canvas."
 *
 * THE ORDER IS THE CONTRACT.
 *
 *   1. THIS FUNCTION'S OWN DOMAIN REFUSALS. A refused action is not an
 *      action, so it appends no audit entry — the sink is not called at all,
 *      and the covering test proves that with a sink that throws.
 *   2. THE AUDIT APPEND (L32002).
 *   3. THE MUTATION, and only if the append succeeded.
 *
 * AND IT IS DEMONSTRATED ON A CONTROL THAT MUTATES SOMETHING. This build has
 * shipped an audit path wired to the one write handler whose success path
 * changed nothing, so the contract was proved where it cost nothing. Creating
 * a Workflow adds a row to a register that did not hold it, and the covering
 * test runs the same call twice — once with the sink accepting, asserting the
 * register grew, and once with it failing, asserting it did not.
 */
export function createWorkflow(input: {
  readonly state: LibraryState
  readonly scenario: LibraryScenario
  readonly draft: CreateWorkflowDraft
  readonly writeAudit: LibraryAuditWrite
}): LibraryWriteResult {
  const { state, scenario, draft, writeAudit } = input
  const refuse = (message: string): LibraryWriteResult => ({ ok: false, state, message })
  const actor = libraryIdentity(scenario.persona).identity
  const actorTenant = actor.tenant ?? SEEDED_TENANT

  /* ---- 1. DOMAIN REFUSALS. The audit sink is not reached by any of these. */

  const decision = libraryDecision('create-a-new-workflow', scenario)
  if (!permitsAction(decision.decision)) {
    return refuse(
      `Refused before anything was written: ${decision.reason} No Workflow was created, and no ` +
        'audit entry was appended, because a refused action is not an action.',
    )
  }

  const name = draft.name.trim()
  if (name === '') {
    return refuse(
      'Refused: a Workflow needs a name following the platform convention (L31918, L31953). ' +
        'Nothing was written.',
    )
  }

  const id = workflowIdFor(name)
  if (state.workflows.some((w) => w.id === id && w.tenant === actorTenant)) {
    return refuse(
      `Refused: this tenant already holds a Workflow at “${id}”. Creating a second one under the ` +
        'same identifier would make version lineage ambiguous. Nothing was written. To change an ' +
        'existing Workflow, create a draft from a published version instead (L31956).',
    )
  }

  // AC-STU-050 (L32015) and FUNC-STU-03-02-C-1 (L31941): exactly one Job
  // Type, validated at save and again at publication. Job Type is STRUCTURAL
  // (L31890) — the Delivery Operations Hub filters Workflow selection by it —
  // so a Workflow without one cannot be selected on the floor at all.
  if (draft.jobType.trim() === '') {
    return refuse(
      'Refused: every Workflow carries exactly one Job Type (AC-STU-050). Job Type is the ' +
        'structural classification the Delivery Operations Hub filters Workflow selection by, so ' +
        'a Workflow without one could never be selected on the floor. Nothing was written.',
    )
  }

  const known = state.jobTypes.some(
    (t) => t.name === draft.jobType && (t.tenant === null || t.tenant === actorTenant),
  )
  if (!known) {
    return refuse(
      `Refused: “${draft.jobType}” is not a Job Type in this workspace, and the Workflow is not ` +
        'silently reclassified to something that does resolve (L32008). Under DEC-TAX-002 the ' +
        'platform-seeded catalogue ships empty, so the entry has to be created in this workspace ' +
        'first. Nothing was written.',
    )
  }

  if (
    draft.serviceTypeTag !== null &&
    !state.serviceTypeTags.some(
      (t) => t.name === draft.serviceTypeTag && (t.tenant === null || t.tenant === actorTenant),
    )
  ) {
    return refuse(
      `Refused: “${draft.serviceTypeTag}” is not a Service Type tag in this workspace. The tag is ` +
        'optional, but an unresolvable one is still a classification pointing at nothing ' +
        '(L32008). Nothing was written.',
    )
  }

  /* ---- 2. THE AUDIT APPEND, before the mutation and after the refusals. */

  const audit = writeAudit({
    actorIdentityId: actor.identityId,
    action: 'create-workflow',
    subject: id,
    tenant: actorTenant,
    implementationTeamAction: isImplementationTeam(scenario),
    sourceRefs: AUDIT_REFS,
  })
  if (!audit.ok) {
    return refuse(
      `The audit write failed, so the action did not happen: ${audit.reason}. No Workflow named ` +
        `“${name}” exists, nothing is left half-created, and nothing was queued for later — the ` +
        'audit entry commits in the same transaction as the action, so a failed audit fails the ' +
        'action with it (FB-STU-10).',
    )
  }

  /* ---- 3. THE MUTATION. */

  const created: WorkflowRecord = {
    id,
    name,
    tenant: actorTenant,
    status: 'Draft',
    jobType: draft.jobType,
    serviceTypeTag: draft.serviceTypeTag,
    currentVersion: null,
    lastPublishedAt: null,
    linkage: { status: 'live', linkedJobs: 0, linkedRuns: 0, refreshedAt: LIBRARY_AS_OF },
    note: 'Created in this session. Draft, and not yet submitted into the approval chain.',
  }

  return {
    ok: true,
    state: { ...state, workflows: [...state.workflows, created] },
    message:
      `Created “${name}” in Draft, classified ${draft.jobType}` +
      (draft.serviceTypeTag === null ? '' : ` and tagged ${draft.serviceTypeTag}`) +
      ', with its audit entry in the same transaction, recorded against identity and action ' +
      'rather than “acting as role” (L34657). The next step is the Builder canvas, which is ' +
      'MOD-STU-04’s screen and not this one.',
  }
}

/* ==================================================================== *
 * 10. CREATING A CUSTOM TAXONOMY ENTRY — the DEC-TAXROLE-001 path.
 * ==================================================================== */

/**
 * `FUNC-STU-03-02-B-1` (L31939). At version 1 this is the ORDINARY path
 * rather than an extension, "because the platform-seeded catalogue ships
 * empty until the client supplies the sixteen names and codes".
 *
 * The same three-step order as `createWorkflow`, and the same audit line
 * covers it: L32002 names "custom-type creation" explicitly.
 */
export function createCustomType(input: {
  readonly state: LibraryState
  readonly scenario: LibraryScenario
  readonly kind: TaxonomyKind
  readonly name: string
  readonly writeAudit: LibraryAuditWrite
}): LibraryWriteResult {
  const { state, scenario, kind, name: rawName, writeAudit } = input
  const refuse = (message: string): LibraryWriteResult => ({ ok: false, state, message })
  const actor = libraryIdentity(scenario.persona).identity
  const actorTenant = actor.tenant ?? SEEDED_TENANT
  const name = rawName.trim()

  const decision = libraryDecision('create-a-custom-job-type-or-service-type-tag', scenario)
  if (!permitsAction(decision.decision)) {
    return refuse(
      `Refused before anything was written: ${decision.reason} No taxonomy entry was created, and ` +
        'no audit entry was appended.',
    )
  }

  if (name === '') {
    return refuse(`Refused: a custom ${kind} needs a name. Nothing was written.`)
  }

  const existing = kind === 'Job Type' ? state.jobTypes : state.serviceTypeTags
  if (existing.some((t) => t.name === name)) {
    return refuse(
      `Refused: this workspace already holds a ${kind} named “${name}”. Nothing was written, and ` +
        'no audit entry was appended for an action that would change nothing.',
    )
  }

  const audit = writeAudit({
    actorIdentityId: actor.identityId,
    action: 'create-custom-type',
    subject: `${kind}: ${name}`,
    tenant: actorTenant,
    implementationTeamAction: isImplementationTeam(scenario),
    sourceRefs: AUDIT_REFS,
  })
  if (!audit.ok) {
    return refuse(
      `The audit write failed, so the action did not happen: ${audit.reason}. No ${kind} named ` +
        `“${name}” exists, and nothing was queued for later (FB-STU-10).`,
    )
  }

  const entry: TaxonomyEntry = {
    name,
    kind,
    origin: 'tenant-created',
    tenant: actorTenant,
    sourceRef: 'Created in this workspace under FUNC-STU-03-02-B-1 (L31939).',
  }

  return {
    ok: true,
    state:
      kind === 'Job Type'
        ? { ...state, jobTypes: [...state.jobTypes, entry] }
        : { ...state, serviceTypeTags: [...state.serviceTypeTags, entry] },
    message:
      `Created the tenant ${kind} “${name}”, with its audit entry in the same transaction ` +
      '(L32002). It is a tenant-created entry: the platform-seeded catalogue is untouched, and a ' +
      'later load of the client’s sixteen names will not overwrite it (L31892).',
  }
}

/* ==================================================================== *
 * 11. THE AFFORDANCE RULE — one fold, read by every control.
 * ==================================================================== */

export type LibraryControlRendering =
  /** No control, and the reason a control is not there. */
  | { readonly kind: 'absent'; readonly note: string }
  | { readonly kind: 'enabled'; readonly label: string; readonly note: string }
  | { readonly kind: 'disabled'; readonly label: string; readonly reason: string }
  | {
      readonly kind: 'decision-open'
      readonly label: string
      readonly openDecision: string
      readonly note: string
    }

function withCondition(decision: StudioAccessDecision): string {
  const condition = decision.decision.conditionToEnable
  return condition === null ? decision.reason : `${decision.reason} ${condition}`
}

/** The two outcomes under which a persona may take the action, not just read. */
const PERMITS_ACTION: ReadonlySet<PermissionOutcome> = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
])

/** Whether this persona may open the Library at all — row 1, read once. */
export function opensTheLibrary(s: LibraryScenario): boolean {
  return permitsRead(libraryDecision('open-the-library-filtered-to-published', s).decision)
}

/**
 * THE ONE FOLD. Every control on this screen comes through here, so a branch
 * cannot be fixed on one control and left wrong on another.
 *
 * | outcome                | rendering |
 * |------------------------|-----------|
 * | allowed                | enabled |
 * | allowedWithConditions  | enabled, with the condition named |
 * | readOnly               | disabled, carrying the CELL'S OWN WORDS |
 * | unavailable            | disabled, with the condition named |
 * | clientDecisionRequired | no control; the decision identifier and both readings |
 * | explicitlyProhibited   | ABSENT — unless the row declares a storyboard rendering |
 *
 * **THE ONE EXCEPTION, AND WHY IT IS NOT A BREAK IN THE RULE.**
 * `Explicitly prohibited` carries no rendering anywhere in the frozen source,
 * so it is ABSENT by default here as everywhere. `SB-STU-06` (L31976) states
 * the opposite for exactly one control and gives its reason: the New Workflow
 * button is "disabled with a stated reason for read-only roles rather than
 * hidden, so a Supervisor understands they need the grant rather than
 * assuming the feature is missing".
 *
 * That is the ABSENT/DISABLED distinction applied rather than broken: a
 * Supervisor holds Workflow creation generally — the same role holds it in
 * the with-grant column — and is refused NOW for a named, fixable condition.
 * The exception is declared as data on the row it applies to
 * (`storyboardProhibition`), so it cannot leak onto the other eight rows.
 *
 * AND IT IS GATED ON ROW 1. A persona who may not open the Library is not
 * told they need a grant: a Worker "cannot reach any Studio route by any
 * means" and a Read-only Auditor's presence here is itself what
 * `DEC-AUDSTU-001` has not settled. Telling either of them to ask for the
 * authoring grant would name the wrong missing condition, which is exactly
 * what `AC-STU-155` forbids.
 */
export function libraryAffordance(
  rowId: Stu03RowId,
  s: LibraryScenario,
  label: string,
): LibraryControlRendering {
  const row: StudioLibraryMatrixRow = stu03Row(rowId)
  const decision = libraryDecision(rowId, s)
  const outcome: PermissionOutcome = decision.outcome

  // THE ROUTED PROHIBITION, ASKED BEFORE THE SWITCH. `routedTo` is `null` on
  // all seventy-two cells of this card, and every one of those nulls is an
  // answer:
  //
  // - Row 2 (`See Draft and In Review Workflows`) refuses three columns that
  //   hold row 1 — but `AC-STU-048` (L32013) uses the source's own word for
  //   the rendering: Draft and In Review Workflows are "**invisible** to roles
  //   without the authoring grant and outside the approval chain". Invisible
  //   is ABSENT, stated by the source rather than adjudicated here.
  // - Row 7 (`Edit or delete a platform-seeded starter type`) refuses every
  //   column, and `FUNC-STU-03-02-A-1` (L31937) is why it can never become
  //   true: the foundation is carried "without **ever** letting a tenant edit
  //   it", `AC-STU-049` adds "by any tenant role". Row 6 creates a CUSTOM
  //   type, which is a different capability, not this one relocated.
  // - Row 9 is tenant isolation, refused everywhere by construction.
  //
  // `storyboardProhibition` below is a SEPARATE mechanism with its own source
  // line and is deliberately not folded into this one — see the note on the
  // `explicitlyProhibited` branch.
  const routedTo = row.routedTo[s.persona]
  const routedDecision = routedTo === null ? null : libraryDecision(routedTo, s)
  if (routedProhibitionApplies(decision, routedTo, routedDecision)) {
    return {
      kind: 'disabled',
      label,
      reason:
        `${decision.reason} ${stu03Row(routedTo).capability} is the route open to you and is ` +
        'offered beside this one.',
    }
  }

  switch (outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return { kind: 'enabled', label, note: decision.reason }

    // NOT a bare disabled control: the reason carries the cell's own words,
    // so a token that grants something inside itself keeps saying so.
    case 'readOnly':
    case 'unavailable':
      return { kind: 'disabled', label, reason: withCondition(decision) }

    case 'clientDecisionRequired':
      return {
        kind: 'decision-open',
        label,
        openDecision:
          row.cells[s.persona].openDecision ??
          'an open client decision the source records without an identifier',
        note: decision.reason,
      }

    case 'explicitlyProhibited': {
      const storyboard = row.storyboardProhibition
      if (storyboard !== null && opensTheLibrary(s)) {
        // THE GRANT IS NAMED ONLY WHERE THE GRANT IS THE OBSTACLE — the same
        // rule `MOD-STU-18`'s `capabilityStatement` reached, and for the same
        // reason. The Supervisor's two columns are one role split by a grant
        // (L34584), so on a row where the with-grant column permits the
        // action, the grant is what separates them. Everywhere else the
        // evaluator's own stated reason is the specific missing condition,
        // and offering the grant would name a capacity the source withholds.
        const grantIsTheDifference =
          s.persona === 'supervisor-without-grant' &&
          PERMITS_ACTION.has(row.cells['supervisor-with-authoring-grant'].outcome)
        const specific = grantIsTheDifference ? storyboard.grantCondition : decision.reason
        return {
          kind: 'disabled',
          label,
          reason: `${specific} ${storyboard.generalCondition} [${storyboard.sourceRef}]`,
        }
      }
      return { kind: 'absent', note: decision.reason }
    }

    // Task 1 passes `notApplicable` through intact rather than inventing a
    // refusal reason for it. No control, and the reason it gave.
    case 'notApplicable':
      return { kind: 'absent', note: decision.reason }

    case 'queuedOffline':
    case 'cachedReadOnlyOffline':
      throw new Error(
        `MOD-STU-03: the outcome "${outcome}" reached the rendering rule. The Studio has no ` +
          'offline mode — STATE-07 renders nowhere on this surface and nothing on it ever queues ' +
          'a write — so an offline outcome here is a defect in the matrix or the evaluator.',
      )

    default: {
      const exhaustive: never = outcome
      throw new Error(`MOD-STU-03: unhandled outcome ${JSON.stringify(exhaustive)}`)
    }
  }
}

/* ==================================================================== *
 * 12. THE STATE MACHINE — L31959-L31972, including the one it cannot support.
 * ==================================================================== */

export interface WorkflowTransition {
  readonly from: WorkflowStatus
  /** `null` is the terminal arrow, `Archived --> [*]`. */
  readonly to: WorkflowStatus | null
  /** The diagram's own label, verbatim. */
  readonly label: string
  /**
   * `true` on the ONE transition the source draws and cannot support. It
   * renders as a statement; **no control is offered for it**, because
   * inventing one would answer `DEC-ARCH-001` by building it.
   */
  readonly unspecifiedInSource: boolean
}

/**
 * The seven transitions the diagram draws between named states, plus the
 * terminal arrow, in the diagram's own order (L31965–L31971). The entry arrow
 * `[*] --> Draft` is the creation path and is `createWorkflow` above.
 */
export const WORKFLOW_TRANSITIONS = [
  { from: 'Draft', to: 'In Review', label: 'Author submits', unspecifiedInSource: false },
  {
    from: 'In Review',
    to: 'Draft',
    label: 'Reviewer returns with comments',
    unspecifiedInSource: false,
  },
  {
    from: 'In Review',
    to: 'Published',
    label: 'Release Authority publishes a version',
    unspecifiedInSource: false,
  },
  {
    from: 'Published',
    to: 'Draft',
    label: 'a new draft is created from a published version',
    unspecifiedInSource: false,
  },
  {
    from: 'Published',
    to: 'Archived',
    label: 'deliberate manual archival against a clear no active Jobs indicator',
    unspecifiedInSource: false,
  },
  {
    from: 'Archived',
    to: 'Published',
    label: 'republication is not defined in the source, see the note below',
    unspecifiedInSource: true,
  },
  { from: 'Archived', to: null, label: 'the workflow’s history ends here', unspecifiedInSource: false },
] as const satisfies readonly WorkflowTransition[]

/**
 * What the diagram shows (L31974), quoted, because two of its three
 * sentences are constraints this module enforces and the third is the open
 * decision it refuses to answer.
 */
export const STATE_MACHINE_NOTES = {
  onlyRouteIn: 'The only route into Published runs through In Review and the Release Authority.',
  archivalIsManual:
    'Archival is deliberate and manual, never automatic — a version is never auto-archived when ' +
    'its Jobs are archived.',
  unArchivalIsOpen:
    'The dashed question in this state machine is the transition out of Archived: the Statement ' +
    'of Work states that prior versions are retained in full and remain permanently readable and ' +
    'that archival is a deliberate action, but it does not state whether an archived version can ' +
    'be un-archived. Not specified in the Statement of Work. Recorded as part of DEC-ARCH-001.',
  sourceRef: 'L31974',
} as const

/* ==================================================================== *
 * 13. NOT SPECIFIED IN THE STATEMENT OF WORK.
 * ==================================================================== */

export interface UnspecifiedRecord {
  readonly id: string
  readonly question: string
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
  readonly adopted: string
  readonly cost: string
  readonly locator: string
}

/**
 * Two questions this module met that the source does not settle and gave no
 * `DEC-*` identifier. Each states every reading, the position this build took,
 * and what that position costs — a client-delegated choice under `APP-012`,
 * never a claim that the source settled it.
 *
 * `DEC-ARCH-001` is deliberately NOT here. It is a source decision card owned
 * by `MOD-STU-12`, it now carries a canonical record as `D28`, and this screen
 * renders it through `DecisionDisclosure` rather than restating it. What is
 * screen-scoped — that the Library draws no un-archive control and why — stays
 * on the state machine note above (`STATE_MACHINE_NOTES.unArchivalIsOpen`).
 */
export const UNSPECIFIED_IN_SOURCE = [
  {
    id: 'DEC-TAXROLE-001',
    question: 'Which tenant role may create a custom Job Type or Service Type tag?',
    readings: [
      {
        text:
          '§5.3.2 grants the capability to “tenants” without naming a role, so three of the seven ' +
          'columns on row 6 read Client Decision Required and one — the Quality Manager — reads ' +
          'Allowed outright.',
        locator: 'L31909 · L31914',
      },
      {
        text:
          'The proposal’s own recommendation: “Tenant Admin in the tenant administration area, ' +
          'because Job Type shapes Delivery Operations Hub behaviour rather than Workflow ' +
          'content, with the Quality Manager consulted.”',
        locator: 'L31914',
      },
    ],
    adopted:
      'The control renders Client Decision Required for the three deferred columns and is offered ' +
      'to the Quality Manager, whose cell the source states outright. The recommended reading — ' +
      'Tenant Admin — is shown as the recommendation and is not implemented as though it were ' +
      'settled, because implementing it would grant a Tenant Admin a capability row 6 records as ' +
      'undecided.',
    cost:
      'The stated cost of getting this wrong is the source’s own: “an uncontrolled custom Job ' +
      'Type list degrades Workflow selection on the floor.” Until it is answered, a tenant whose ' +
      'Quality Manager is unavailable has no other stated route to a Job Type — and under ' +
      'DEC-TAX-002 there are no seeded ones to fall back on.',
    locator: 'L31909 · L31914',
  },
  {
    id: 'archived-visibility',
    question: 'Who may see an Archived Workflow in the Library?',
    readings: [
      {
        text:
          'The permission matrix has no archived row at all. Row 1 covers “Open the Library ' +
          'filtered to Published” and row 2 covers “See Draft and In Review Workflows”; Archived ' +
          'is named by neither.',
        locator: 'L31904 · L31905',
      },
      {
        text:
          'The state machine annotates it “Archived, retained and permanently readable, not ' +
          'linkable”, and OBJ-036 states that “prior versions are retained in full and remain ' +
          'permanently readable”.',
        locator: 'L31964 · L8603',
      },
    ],
    adopted:
      'Archived reads with Published rather than with Draft. An archived Workflow is published ' +
      'content that has been retired, not unreleased content, and “permanently readable” is a ' +
      'stated property of it — so withholding it from a reader who may read Published would ' +
      'contradict the source in the other direction.',
    cost:
      'If the client rules that Archived is grant-holder-only, one entry moves from ' +
      'RELEASED_STATUSES to UNRELEASED_STATUSES and the read follows; nothing else changes, ' +
      'because the partition is the only place the question is answered.',
    locator: 'L31964 · L8603 · L31924',
  },
] as const satisfies readonly UnspecifiedRecord[]

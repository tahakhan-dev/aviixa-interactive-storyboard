/**
 * Task 7 (`src/data/repository.ts`) — the only door to business truth.
 * Master prompt §12.6: replacing the JSON database with a real API later
 * changes this one file, not the 154 screens that read through it.
 *
 * Write order, exactly as the brief states it, extended by Fix round 1 for
 * §12.4: truth-store authority (`@/data/truth-stores`) → `evaluateAccess`
 * (`@/policy/evaluate`, never a second permission check) → the
 * `PersistenceCapability` action-class gate (`@/persistence/capability`,
 * blocking every durable action class outright unless storage is
 * `ready-durable`) → state-machine legality (`stateMachineLegality` below,
 * delegating to the real tables in `@/frontline/capture` and
 * `@/domain/vocabularies` rather than inventing one) → commit the next
 * collection snapshot plus the new audit/event rows in ONE IndexedDB
 * transaction (`commitToPersistence`, reusing `openDatabase`/`STORES`/
 * `errorMessage` from `@/persistence/schema` — the same low-level bridge
 * `boot.ts` already opens through `bootstrapStorage`, not a second
 * persistence path) → only once that transaction's `oncomplete` fires does
 * the in-memory store mutate and `notify()` fire. A denial or a persistence
 * failure at any stage returns `{ ok: false }` and mutates nothing.
 *
 * `create`/`update`/`transition` are therefore `Promise`-returning — that is
 * the one interface change Fix round 1 makes, because "commit, then
 * publish" cannot be expressed synchronously and the brief's original
 * synchronous signature made §12.4's commit contract unimplementable. Reads
 * (`list`/`get`) stay synchronous: they serve rendering and must not force
 * every screen to await.
 *
 * READS run a lighter, deliberately different check (`withinScope`, below)
 * rather than `evaluateAccess` itself, and this is unchanged from the
 * original cut — Fix round 1 confirms it rather than revising it.
 * `evaluateAccess`'s suspension stage denies EVERY action for a tenant
 * whose lifecycle is suspended, and its own reason text says why: "so
 * actions that create or change work are refused" — reads are not an
 * action in that sense. This matches what the build already established
 * two tasks ago for the Hub surface: hard suspension gates WRITES and lets
 * the floor keep READING (`@/surfaces/doh/tenant-state.ts` and the access
 * evaluator's own `TENANT_SUSPENDED` reason text agree on exactly this
 * split). `TEN-NORTHFORGE` (soft-suspended in the seed) still needing to
 * see its own tenant's rows is exactly the case that split describes.
 * `withinScope` reuses the SAME two questions `evaluateAccess`'s own
 * TENANT_ISOLATION and SCOPE stages ask — does this row's tenant match the
 * actor's, does this row's site/area sit inside the actor's declared scope
 * — without also asking the action-shaped questions (suspension,
 * entitlement, safety, segregation of duties) that a plain list/get was
 * never going to need answered.
 */
import { z } from 'zod'
import { COLLECTIONS, RELATIONS, type CollectionName } from './schemas'
import type { Event as EventRow, Audit as AuditRow } from './schemas/crosscutting'
import type { CollectionData, Store } from './store'
import { truthStoreFor, writableThroughRepository, type TruthStoreAuthority } from './truth-stores'
import { checkAreaReference, checkLocationReference, checkSiteReference, scopeReferenceMessage, type ScopeReferenceProblem } from './scope-reference'
import { roleById, type RoleId } from '@/domain/roles'
import type { SurfaceId } from '@/domain/surfaces'
import {
  emptyDomainState,
  type ScenarioDomainState,
  type TenantPartition,
} from '@/domain/state'
import { scenarioRunId, tenantId as brandTenantId } from '@/domain/ids'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import { deny, permitsAction, type PermissionDecision } from '@/policy/decision'
import { captureTransition, type CaptureState } from '@/frontline/capture'
import {
  SCHEDULE_DEFINITION_TRANSITIONS,
  SCHEDULE_OCCURRENCE_TRANSITIONS,
  type ScheduleDefinitionState,
  type ScheduleOccurrenceState,
} from '@/domain/vocabularies'
import { errorMessage, openDatabase, STORES } from '@/persistence/schema'
import { permittedUnder, type ActionClass } from '@/persistence/capability'
import type { StorageBootstrapState } from '@/persistence/bootstrap'

export type { AccessContext } from '@/policy/evaluate'

/** The row shape for one collection, derived from its own zod schema — never redeclared. */
export type RowOf<N extends CollectionName> = z.infer<(typeof COLLECTIONS)[N]['schema']>

/**
 * Reused, not redrawn: OBJ-024/OBJ-083's own folded schema
 * (`@/data/schemas/crosscutting#Event`) IS the domain-event row shape, and
 * OBJ-084's own schema (`#Audit`) IS the audit-event row shape. A
 * `WriteResult`'s `events`/`audit` arrays are literal rows of these two
 * types — the exact rows this call also appended to the `events`/`audit`
 * collections — so they can never disagree with what a later `list('audit',
 * ctx)` shows, which is the trap Task 5 paid for (facts drawn beside each
 * other instead of derived once).
 */
export type DomainEvent = EventRow
export type AuditEvent = AuditRow

export interface Query<T> {
  where(pred: (row: T) => boolean): Query<T>
  sort(key: keyof T & string, dir?: 'asc' | 'desc'): Query<T>
  page(index: number, size: number): Query<T>
  all(): readonly T[]
  first(): T | undefined
  count(): number
  /** Count before paging — the pagination control needs both this and `count()`. */
  total(): number
}

/** §12.4: `ready-durable` versus everything else, exposed so a screen can render it rather than guess. */
export interface PersistenceCapability {
  readonly state: StorageBootstrapState
  readonly durable: boolean
}

export interface Repository {
  list<N extends CollectionName>(name: N, ctx: AccessContext): Query<RowOf<N>>
  get<N extends CollectionName>(name: N, id: string, ctx: AccessContext): RowOf<N> | undefined
  create<N extends CollectionName>(name: N, row: RowOf<N>, ctx: AccessContext): Promise<WriteResult<RowOf<N>>>
  update<N extends CollectionName>(
    name: N,
    id: string,
    patch: Partial<RowOf<N>>,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<N>>>
  transition<N extends CollectionName>(
    name: N,
    id: string,
    to: string,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<N>>>
  /**
   * Fix round 1 (unit-01, Task 5 review) — the one door for onboarding a
   * tenant: its own row plus its first Tenant Admin's `users` row, under a
   * SINGLE, explicitly-declared authorisation rather than two calls through
   * the generic `create()` door (which is what the reverted `authorizeWrite`
   * carve-outs existed to route around). See this method's own
   * implementation comment for the full reasoning, including why an
   * up-front authorisation — not two per-write ones — is what actually
   * closes the staleness deadlock the review measured, and why the method
   * is safe to call again with the SAME two rows after a partial failure.
   */
  provisionTenant(
    tenant: RowOf<'tenants'>,
    admin: RowOf<'users'>,
    ctx: AccessContext,
  ): Promise<ProvisionTenantResult>
  /**
   * Fix round 1 (unit-01, Task 7 review, IMPORTANT 6) — the one door for
   * inviting a console user: the `users` row plus its `role-grants` row,
   * under a SINGLE up-front authorisation, in the same shape
   * `provisionTenant` above already established (one door, one
   * authorisation, both writes, a `partial` arm for a genuine storage
   * failure between them) — not two independent `repository.create` calls
   * from a screen, each authorised through the generic floor's wider
   * `PLATFORM_WRITERS` set. See this method's own implementation comment
   * for the guards and why the grantor is resolved here, never taken as a
   * caller-supplied id.
   */
  inviteConsoleUser(user: RowOf<'users'>, ctx: AccessContext): Promise<InviteConsoleUserResult>
  /**
   * Task 3 (unit-02) — the tenant-authority sibling of `inviteConsoleUser`
   * above: a Tenant Admin (see `TENANT_ROLE_GRANT_MATRIX`'s own comment for
   * why it is Tenant Admin alone) creating a new tenant user account, under
   * a SINGLE up-front authorisation covering the `users` row AND its first
   * `role-grants` row — the same compound-write shape `inviteConsoleUser`
   * established (one door, one authorisation, both writes, a `partial` arm
   * for a genuine storage failure between them).
   *
   * `users`/`role-grants` are `'platform'`-authority tables
   * (`@/data/truth-stores`, floor `PLATFORM_WRITERS`:
   * `ROOT_SUPER_ADMIN`/`ADMIN`/`PLATFORM_ENGINEER`) — the same tables
   * Unit 1 used for platform console accounts, and the ONLY `users`/
   * `role-grants` tables that exist. A Tenant Admin cannot create a tenant
   * user through the generic write door AT ALL today. This door is the fix
   * for that gap: a NEW, deliberately NARROWER door standing next to the
   * existing platform-authority door, never a widening of it. It can mint
   * only a tenant-domain account, restricted to the closed four-role set
   * `TENANT_USER_ROLES` below (never `READONLY_AUDITOR` — out of this
   * door's own closed set per this task's brief, left to a future task
   * rather than inventing a rule for it here; and never
   * `ROOT_SUPER_ADMIN`/`ADMIN`/`PLATFORM_ENGINEER`/`SUPPORT` — a tenant
   * door can never mint a platform account), always inside the ACTING
   * session's own tenant (never a caller-supplied `tenantId` — the same
   * class of guard `resolveTenantId`'s own fix protects, applied here to a
   * row that does not exist yet), and only when the acting identity's own
   * role may GRANT the requested one at all. See this method's own
   * implementation comment and `TENANT_ROLE_GRANT_MATRIX`'s comment for the
   * segregation-of-duties citations — a caller who could not grant a role
   * through `assignTenantRole` below must not be able to mint the same
   * role by inventing a brand-new account with it instead, which is
   * exactly the bypass this shared check closes.
   */
  createTenantUser(user: RowOf<'users'>, ctx: AccessContext): Promise<CreateTenantUserResult>
  /**
   * Task 3 (unit-02) — granting an ADDITIONAL tenant role to an EXISTING
   * tenant user (`SB-HO-005`, the tenant role-assignment storyboard: "the
   * person may already hold others," roles additive, `§4.8`). Creates one
   * new `role-grants` row; never touches the target's own `users.role`
   * field, which this build reads as the account's role AT CREATION, not a
   * redundant second copy of "every role this person holds" — the
   * `role-grants` collection already is that list.
   *
   * Returns the `segregation-of-duties` arm of `AssignTenantRoleResult`
   * (Task 4 depends on this exact name and shape) when the ACTING
   * identity's own role may not grant the REQUESTED role — computed HERE,
   * per call, from the live `ctx.identity.role`, never baked into a static
   * `AccessRequest` constant (the analogous risk Task 1's own fix-round-2
   * finding names for `requiredSites`/`requiredAreas`: a row/actor-dependent
   * scope fact silently dropped by a static refactor). See this method's
   * own implementation comment and `TENANT_ROLE_GRANT_MATRIX`'s comment for
   * the research and its citations.
   */
  assignTenantRole(userId: string, role: RoleId, ctx: AccessContext): Promise<AssignTenantRoleResult>
  /**
   * Fix round 3 (unit-01, Task 7 re-review, IMPORTANT 2) — the one door
   * for deciding a pending `approval-requests` row: segregation of duties,
   * the critical-class root-only rule, and approver availability were
   * enforced only by a `disabled` attribute the screen computed at RENDER
   * time — the write itself went through the generic `update()`, whose
   * floor is `PLATFORM_WRITERS` (`ROOT_SUPER_ADMIN`/`ADMIN`/
   * `PLATFORM_ENGINEER`), wider than any of those three rules. Measured,
   * before this door existed: an Admin or a Platform Engineer could
   * approve a CRITICAL row, and a proposer could approve their OWN row, by
   * calling `repository.update('approval-requests', ...)` directly — see
   * this method's own implementation comment for the reasoning and the
   * probe results.
   */
  decideApprovalRequest(
    id: string,
    decision: 'approve' | 'return',
    reason: string | null,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<'approval-requests'>>>
  /**
   * Task 8 (unit-01) — the fourth door: a tenant's first `TENANT_ADMIN`
   * accepting the invitation `provisionTenant` issued, on the Hub surface,
   * before any `ProductSession` exists for them. No `ctx: AccessContext`
   * parameter — deliberately, matching the precedent already set by
   * `subscribe`/`reset`/`exportJson`/`importJson`/`persistenceCapability`
   * below, which also carry no `ctx` — because there is no signed-in
   * identity for a caller to supply yet: that is the entire reason this
   * door exists rather than the caller going through `update()`. The
   * authority question this door answers is never "is the CALLER entitled"
   * (nobody is signed in to ask that about) but "does THIS ROW, found fresh
   * from the tenant id alone, still describe a live, acceptable
   * invitation" — see this method's own implementation comment for the
   * guards, the probe against the other three doors' own failure modes,
   * and why `evaluateAccess`'s role stage is not called here at all.
   */
  acceptInvitation(tenantId: string): Promise<AcceptInvitationResult>
  /**
   * CORRECTIVE TASK (unit-02, task-corrective-01) — Site creation's own
   * named door, matching `createAreaUnderSite`'s shape one tier up: a
   * declared `AccessRequest` (`CREATE_SITE_REQUEST`, this file's own
   * const), `evaluateAccess` run before any row is read, then delegation
   * to the same internal `createRow` the generic door uses. Before this
   * fix, a Site was created through the bare generic `create('sites', ...)`
   * door, which has no dedicated `AccessRequest` for `sites` and fell back
   * to `defaultWriteRoles('hub')` (`TENANT_OPERATIONAL_WRITERS`) — the
   * source (`L27118`) restricts creating a Site, Area or Location to the
   * Tenant Admin alone, and `LocationConfigurationScreen.tsx` now calls
   * this door instead.
   */
  createSite(site: RowOf<'sites'>, ctx: AccessContext): Promise<WriteResult<RowOf<'sites'>>>
  /**
   * Task 1 (unit-02) — a new Area's `siteId` must name a real, active,
   * same-tenant Site, a rule the generic `create()` door does not run (it
   * validates the row's own shape against `schemas/org.ts#Area`, never
   * what the row's `siteId` points at). Fix round 1 (task-1 review,
   * Important 3) — this door now declares its own, single, explicitly-
   * declared `AccessRequest` (`CREATE_AREA_UNDER_SITE_REQUEST`, this
   * file's own const), matching `PROVISION_TENANT_REQUEST`/
   * `INVITE_CONSOLE_USER_REQUEST`'s shape, rather than calling
   * `authorizeWrite` directly — the ORIGINAL pass called `authorizeWrite`
   * on the theory that its floor was identical to the generic door's, but
   * `authorizeWrite`'s own `resourceTenant` computation (via
   * `resolveTenantId`) is exactly the fact `checkSiteReference` below
   * already re-derives, through the SAME `siteId`, one line later — two
   * code paths computing the identical tenant fact is the duplication the
   * brief's own "do not duplicate `authorizeWrite`'s logic" line warned
   * against, not a reason to keep both. Once authorised, this delegates
   * to the same internal `createRow` the generic door uses — see
   * `inviteConsoleUser`'s own comment for that same delegation shape.
   */
  createAreaUnderSite(area: RowOf<'areas'>, ctx: AccessContext): Promise<WriteResult<RowOf<'areas'>>>
  /** Task 1 (unit-02) — `createAreaUnderSite`'s own sibling for Location under Area. */
  createLocationUnderArea(location: RowOf<'locations'>, ctx: AccessContext): Promise<WriteResult<RowOf<'locations'>>>
  /**
   * Task 2 (unit-02) — a new Shift's `siteId` must name a real, active,
   * same-tenant Site, the same `checkSiteReference` rule
   * `createAreaUnderSite` runs on its own `siteId`, so this door follows
   * its exact shape (own static `AccessRequest`, `requiredSites` added at
   * the call site — see `CREATE_SHIFT_REQUEST`'s own comment). The ONE rule
   * this door adds beyond that, which no sibling door needs: two Shifts at
   * the same Site may not hold overlapping `[startTime, endTime)` windows
   * (`shiftOverlapConflict` below) — checked AFTER `checkSiteReference`
   * passes (an invalid `siteId` makes "which other Shifts share this Site"
   * unanswerable), and reported as its own, third result arm naming the
   * specific conflicting row, never folded into the generic `denied` shape
   * a `PermissionDecision` carries.
   */
  createShift(shift: RowOf<'shifts'>, ctx: AccessContext): Promise<CreateShiftResult>
  /**
   * Task 2 (unit-02) — `createShift`'s own sibling for an edit. Runs the
   * SAME two checks against the row as it would read AFTER the patch is
   * applied (`{ ...before, ...patch }`) — a `siteId` this Shift is being
   * MOVED to must resolve exactly as one it is being CREATED with, and its
   * new `[startTime, endTime)` must not overlap any other Shift at the
   * (possibly new) Site, itself excluded. Delegates the actual write to the
   * generic `update()` once both checks pass — same shape
   * `archiveLocationTierEntity` already established: a named door adds
   * exactly the rule(s) the generic door doesn't run, then hands the
   * mechanical write back to it.
   */
  updateShift(id: string, patch: Partial<RowOf<'shifts'>>, ctx: AccessContext): Promise<UpdateShiftResult>
  /**
   * FINAL WHOLE-UNIT REVIEW (unit-02, Important 1) — Shift ARCHIVE's own
   * named door, the third of the three Shift writes and the one the
   * corrective task that gave `createShift`/`updateShift` their
   * Tenant-Admin-only floors did not reach. `ShiftManagementScreen.tsx`
   * called the bare generic `update('shifts', id, { status: 'archived' })`
   * for it, whose only floor is `defaultWriteRoles('hub')`
   * (`TENANT_OPERATIONAL_WRITERS`) — so a Supervisor or Quality Manager,
   * both `Explicitly prohibited` on `L27293` ("Archive a Shift"), could
   * archive a Shift through any caller that reached the repository
   * directly. The screen's own `WRITE_REQUEST` already cited `L27293` and
   * already knew the answer; it enforced it only as a display gate.
   *
   * Shape is `archiveLocationTierEntity`'s exactly, minus the cascade:
   * `evaluateAccess` is the LITERAL FIRST action after the writability
   * gate, before any row is read, and the target row's OWN tenant is
   * resolved and compared to `ctx.identity.tenant` explicitly before the
   * write is delegated back to the generic `update()`. NO cascade sweep —
   * nothing nests beneath a Shift in this hierarchy, and the source's own
   * archive condition ("refused while runs are scheduled against it",
   * `L27293`) has no Run/Job collection at this authority to read, the
   * same disclosed gap `reassignDevice` carries for `AC-WF-DVC-002-01`.
   */
  archiveShift(id: string, ctx: AccessContext): Promise<WriteResult<RowOf<'shifts'>>>
  /**
   * Task 1 (unit-02) — `WF-DOH-02-CASCADE` (design spec §3, "the archival
   * cascade"): archiving a Site or Area must not silently orphan an active
   * Area or Location beneath it. This build has no source authority to
   * invent an automatic reassignment cascade (no Job/Run integration
   * exists at this collection's authority yet), so the alternate path this
   * door demonstrates is the honest one: refuse the archive and name every
   * active child, rather than cascading. Delegates the actual write to the
   * generic `update()` once the check passes — see this method's own
   * implementation comment.
   */
  archiveLocationTierEntity(
    collection: 'sites' | 'areas' | 'locations',
    id: string,
    ctx: AccessContext,
  ): Promise<
    | WriteResult<RowOf<'sites'> | RowOf<'areas'> | RowOf<'locations'>>
    | { readonly ok: false; readonly kind: 'has-active-children'; readonly children: readonly { readonly collection: string; readonly id: string; readonly name: string }[] }
  >
  /**
   * Task 4 (unit-02) — `MOD-DOH-04`'s own worker-record door. The
   * referenced User must already exist, hold role `'WORKER'`, and belong to
   * the acting session's own tenant — checked HERE, via `repository.get`
   * itself (so a cross-tenant or otherwise out-of-scope User reads as
   * honestly absent, never distinguished from "does not exist" for a
   * caller probing for one). `workerFields` never carries its own
   * `userId`/`tenantId` — this door sets both, the same "never trust a
   * caller-supplied tenant/identity override" discipline `createTenantUser`
   * applies to `user.tenantId`. If no matching User exists yet, the
   * screen's own "Add worker" flow calls Task 3's `createTenantUser` first
   * (role `'WORKER'`), then this door — two doors in sequence, one guided
   * flow, never a single door pretending to write both collections
   * atomically under one authorisation the way `createTenantUser` itself
   * does for `users`/`role-grants` (those two ARE one compound act; a User
   * and its later Worker record are not — a Worker record's own precondition
   * is that the User already exists).
   *
   * `allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR']` — deliberately NOT
   * `TENANT_OPERATIONAL_WRITERS` (the generic `'hub'`-authority floor, which
   * also admits Quality Manager). See `CREATE_WORKER_REQUEST`'s own comment
   * for the citation and for why this is the fourth time this exact class
   * of mistake had to be corrected in this unit.
   */
  createWorker(
    userId: string,
    workerFields: Omit<RowOf<'workers'>, 'userId' | 'tenantId'>,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<'workers'>>>
  /**
   * Task 4 (unit-02) — `recordQualification`'s own door, `createWorker`'s
   * sibling. `qualification.workerId` must reference a real, same-tenant
   * Worker (inlined as a two-line check — see this method's own
   * implementation comment for why no new `checkWorkerReference` export was
   * added to `scope-reference.ts` for a single caller). `qualification
   * .areaIds` are each checked with Task 1's own `checkAreaReference` — a
   * Qualification may legitimately span Areas across more than one Site of
   * the same tenant (`schemas/org.ts#Qualification`'s own comment), so no
   * single `expectedSiteId` is passed. On success, the new Qualification row
   * AND the Worker's own `qualificationIds` list commit together (the same
   * compound-write shape `createTenantUser`/`inviteConsoleUser` use, a
   * `partial` arm for a genuine second-write storage failure) — leaving
   * `qualificationIds` unmaintained would be exactly the "two
   * independently-writable copies of one fact" this file's own header warns
   * against, since a Worker's held-qualification list and its Qualification
   * rows would silently disagree.
   */
  recordQualification(qualification: RowOf<'qualifications'>, ctx: AccessContext): Promise<RecordQualificationResult>
  /**
   * Task 5 (unit-02) — `WF-DVC-001`'s own door. `device.locationId` is
   * nullable (`schemas/org.ts#Device`, unlike `Shift`/`Qualification`'s
   * `siteId`/`areaIds`, which are required) — an enrolled-but-unplaced
   * device is a real, schema-valid state (the workflow's own Failure path:
   * "The device shows as enrolled with no packages, never as ready" is a
   * DIFFERENT gap than never being bound at all, but the schema draws no
   * line forcing a binding at enrollment either), so `checkLocationReference`
   * runs only when a non-null `locationId` is actually supplied — the same
   * "check only what was given" shape `recordQualification`'s own
   * `areaIds` loop uses. `device` never carries its own `tenantId` — this
   * door sets it, the same "never trust a caller-supplied tenant" discipline
   * `createWorker`/`createTenantUser` already apply.
   *
   * `allowedRoles: ['TENANT_ADMIN']` — see `ENROLL_DEVICE_REQUEST`'s own
   * comment for the citation and for why this is deliberately narrower than
   * `TENANT_OPERATIONAL_WRITERS`.
   */
  enrollDevice(device: Omit<RowOf<'devices'>, 'tenantId'>, ctx: AccessContext): Promise<EnrollDeviceResult>
  /**
   * Task 5 (unit-02) — `WF-DVC-002`'s own door. Takes the target
   * `locationId` directly (not a partial `Device` patch) — the one field
   * this workflow actually moves — and runs the SAME nullable-aware
   * `checkLocationReference` `enrollDevice` runs, because the schema allows
   * reassigning a device back to unplaced exactly as it allows enrolling one
   * that way. Delegates the mechanical write to the generic `update()` once
   * the role floor and the reference both clear — the same "named door adds
   * exactly the rule the generic door doesn't run, then hands back the
   * write" shape `updateShift`/`archiveLocationTierEntity` already
   * establish.
   *
   * `AC-WF-DVC-002-01` ("reassignment refused while a run is in flight on
   * the device") and `AC-WF-DVC-002-02`/`03` (package re-staging and
   * eviction on confirmed receipt) are NOT enforced here — the real `Device`
   * schema carries no in-flight-run or package-inventory field this
   * collection's authority can read (no Job/Run/package integration exists
   * at the `devices` collection yet), so this build has no source-backed
   * fact to gate on. A disclosed, real gap, not a silently invented one —
   * see `DevicesScreen.tsx`'s own header for where this is named on screen.
   *
   * `allowedRoles: ['TENANT_ADMIN']` — see `REASSIGN_DEVICE_REQUEST`'s own
   * comment for the citation (`WF-DVC-002`'s own Denied path names this
   * explicitly, not a derived default).
   */
  reassignDevice(id: string, locationId: string | null, ctx: AccessContext): Promise<ReassignDeviceResult>
  /**
   * Task 7 (closure sweep) — see `OPEN_SUPPORT_SESSION_REQUEST`'s own
   * comment for the role authority research. Opens a READ-ONLY
   * `access-sessions` row against `tenantId`: `readOnly: true` always, no
   * argument lets a caller override it — this door creates the record that
   * MARKS a session read-only, it does not itself grant any capability to
   * write into the target tenant's own collections. A PLATFORM-domain actor
   * (Support, Admin, Root) can never satisfy a TENANT-domain door's own role
   * floor no matter what this method does (`evaluateAccess`'s own PLATFORM
   * branch keeps `identity.tenant` null for every platform role, always —
   * see that file's own M4 comment), so there is no path from this door
   * into a tenant write.
   *
   * `resourceTenant: tenantId` on the gate below is what makes
   * `evaluateAccess`'s existing FEATURE_AND_SUSPENSION stage refuse opening
   * into a compliance-suspended tenant for free (`WF-ROLE-022`'s own Denied
   * path: "Compliance-suspended tenant refused") — no extra logic needed
   * here for that rule.
   */
  openSupportSession(
    tenantId: string,
    purpose: string,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<'access-sessions'>>>
  /**
   * Task 7 (closure sweep) — the operator's own close (`SupportAccessScreen
   * .tsx`'s "Close this session" control). See `CLOSE_SUPPORT_SESSION_REQUEST`'s
   * own comment for the role authority and the Support-only "own sessions"
   * guard enforced in this method's body. Deliberately does not declare
   * `resourceTenant` on its own gate — ending a session should never be
   * blocked by the target tenant's OWN suspension state; closing a session
   * only ever reduces platform-side exposure into a tenant, never increases
   * it, so nothing about a tenant's own lifecycle should be able to trap a
   * session open.
   */
  closeSupportSession(id: string, ctx: AccessContext): Promise<WriteResult<RowOf<'access-sessions'>>>
  subscribe(listener: () => void): () => void
  reset(): void
  /**
   * Task 1 (closure sweep) — the demo/scenario clock control's own door.
   * Advances the SAME `store.clock` every committed write is stamped with
   * (`commitWrite` below), then `notify()`s exactly like a committed write
   * does — no `AccessRequest`/`evaluateAccess`, because this moves fictional
   * scenario time, not business state, and carries no authorization
   * semantics of its own. Exists only so `store.notify()` still has exactly
   * one caller family: this file (`store.ts`'s own header comment).
   */
  advanceClock(ms: number): void
  exportJson(): Record<CollectionName, unknown[]>
  importJson(data: unknown): { ok: true } | { ok: false; problems: string[] }
  /** The current §12.4 durability state. Enforced HERE (the capability gate below), never left to a screen to check. */
  persistenceCapability(): PersistenceCapability
}

/**
 * Fix round 1: a THIRD, distinguishable failure shape. "You may not do
 * this" (`kind: 'denied'`, a real `PermissionDecision`) and "this could not
 * be made durable" (`kind: 'persistence-unavailable'`) lead to different
 * screens and different user recourse, and the original two-armed union
 * could not tell them apart — a caller had no way to know whether a denial
 * was about identity/scope or about storage.
 */
export type WriteResult<T> =
  | { ok: true; row: T; events: DomainEvent[]; audit: AuditEvent[]; affectedSurfaces: SurfaceId[] }
  | { ok: false; kind: 'denied'; decision: PermissionDecision; reason: string; explain: string }
  | {
      ok: false
      kind: 'persistence-unavailable'
      reason: string
      explain: string
      capability: PersistenceCapability
    }

/**
 * Task 2 (unit-02) — `createShift`/`updateShift`'s own result, extending
 * `WriteResult<RowOf<'shifts'>>` with the two arms the generic write door
 * never produces: a `siteId` that doesn't resolve to a real, active,
 * same-tenant Site (`checkSiteReference`, same shape `LocationConfiguration
 * Screen.tsx`'s own reference-refusal gate already reads), and an
 * overlapping `[startTime, endTime)` window naming the specific conflicting
 * row rather than a generic "overlap" sentence — the one rule a static
 * `AccessRequest`/`PermissionDecision` cannot express (it is a fact about
 * two ROWS, not about the actor). Neither new arm carries a `PermissionDecision`
 * — a caller must not mistake "this Shift's own times conflict with another
 * Shift's" for "you may not do this."
 */
export type CreateShiftResult =
  | WriteResult<RowOf<'shifts'>>
  | { ok: false; kind: 'overlap'; conflictingShift: RowOf<'shifts'> }
  | { ok: false; kind: 'invalid-reference'; problem: ScopeReferenceProblem }

/** `CreateShiftResult`'s own sibling for `updateShift`. Same two extra arms, same reasoning. */
export type UpdateShiftResult =
  | WriteResult<RowOf<'shifts'>>
  | { ok: false; kind: 'overlap'; conflictingShift: RowOf<'shifts'> }
  | { ok: false; kind: 'invalid-reference'; problem: ScopeReferenceProblem }

/**
 * Task 4 (unit-02) — `recordQualification`'s own result. `'invalid-reference'`
 * matches `CreateShiftResult`'s own arm exactly (a bad `areaIds` entry is a
 * fact about a ROW reference, not a `PermissionDecision`, so it must not be
 * read as "you may not do this"). `'partial'` matches `InviteConsoleUserResult`
 * /`CreateTenantUserResult`'s own shape: the Qualification row can commit
 * while the Worker's own `qualificationIds` update does not, and that third
 * failure shape is named directly rather than forced through `denied`/
 * `persistence-unavailable`.
 */
export type RecordQualificationResult =
  | { ok: true; qualification: RowOf<'qualifications'>; worker: RowOf<'workers'> }
  | WriteDenied
  | WritePersistenceUnavailable
  | { ok: false; kind: 'invalid-reference'; problem: ScopeReferenceProblem }
  | {
      ok: false
      kind: 'partial'
      qualification: RowOf<'qualifications'>
      /** Exactly `createRow`'s own failure shape, or `update()`'s — see this file's own `WriteResult`. */
      workerUpdateFailure: WriteDenied | WritePersistenceUnavailable
    }

/**
 * Task 5 (unit-02) — `enrollDevice`/`reassignDevice`'s own result. Same
 * `'invalid-reference'` shape `CreateShiftResult`/`RecordQualificationResult`
 * already use for a bad row reference — a non-existent, foreign-tenant or
 * archived `locationId` is a fact about a ROW reference, not a
 * `PermissionDecision`, so it must not be read as "you may not do this."
 */
export type EnrollDeviceResult =
  | WriteResult<RowOf<'devices'>>
  | { ok: false; kind: 'invalid-reference'; problem: ScopeReferenceProblem }

/** `EnrollDeviceResult`'s own sibling for `reassignDevice`. Same shape. */
export type ReassignDeviceResult =
  | WriteResult<RowOf<'devices'>>
  | { ok: false; kind: 'invalid-reference'; problem: ScopeReferenceProblem }

/**
 * Fix round 1 (unit-01, Task 5 review, minor): the two failure arms above
 * never actually depend on `WriteResult<T>`'s own `T` — only the `ok: true`
 * arm does. `refusal`/`persistenceRefusal`/`truthStoreRefusal`/
 * `notFoundRefusal`/`invalidResultRefusal` below all only ever construct a
 * failure arm, so they no longer carry a phantom `<T>` that was never used
 * in their bodies. Derived from `WriteResult` itself (`Extract`), never a
 * second, hand-typed copy of the same two shapes — and this is exactly
 * what `provisionTenant`'s own result type reuses below, rather than
 * redeclaring "denied"/"persistence-unavailable" a third time.
 */
type WriteDenied = Extract<WriteResult<unknown>, { kind: 'denied' }>
type WritePersistenceUnavailable = Extract<WriteResult<unknown>, { kind: 'persistence-unavailable' }>

/**
 * `provisionTenant`'s own result — deliberately NOT `WriteResult<T>` for
 * some folded `{tenant, admin}` tuple, because the two-write policy this
 * type exists to carry (brief: "decide how you handle a second write
 * failing after the first succeeded ... implement it") has a real THIRD
 * failure shape `WriteResult` has no room for: the tenant committed but its
 * administrator did not. `partial` names that shape directly rather than
 * forcing it through `denied`/`persistence-unavailable`, which would have
 * to lie about which one it was. The other three arms are exactly
 * `WriteResult`'s own shapes (`Extract`, not redeclared) so a caller
 * routing `denied`/`persistence-unavailable` the same way it already
 * routes a plain `WriteResult`'s failure arms needs no special case for
 * this door specifically.
 */
export type ProvisionTenantResult =
  | { ok: true; tenant: RowOf<'tenants'>; admin: RowOf<'users'> }
  | WriteDenied
  | WritePersistenceUnavailable
  | {
      ok: false
      kind: 'partial'
      tenant: RowOf<'tenants'>
      /** Exactly `createRow`'s own failure shape — see that function. */
      adminFailure: WriteDenied | WritePersistenceUnavailable
    }

/**
 * `inviteConsoleUser`'s own result — same shape as `ProvisionTenantResult`
 * for the same reason: a `users` row can commit while its `role-grants`
 * row does not, and `partial` names that third shape directly rather than
 * forcing it through `denied`/`persistence-unavailable`.
 */
export type InviteConsoleUserResult =
  | { ok: true; user: RowOf<'users'>; grant: RowOf<'role-grants'> }
  | WriteDenied
  | WritePersistenceUnavailable
  | {
      ok: false
      kind: 'partial'
      user: RowOf<'users'>
      /** Exactly `createRow`'s own failure shape — see that function. */
      grantFailure: WriteDenied | WritePersistenceUnavailable
    }

/**
 * `createTenantUser`'s own result — same shape as `InviteConsoleUserResult`
 * for the same reason: a `users` row can commit while its `role-grants` row
 * does not, and `partial` names that third shape directly.
 */
export type CreateTenantUserResult =
  | { ok: true; user: RowOf<'users'>; grant: RowOf<'role-grants'> }
  | WriteDenied
  | WritePersistenceUnavailable
  | {
      ok: false
      kind: 'partial'
      user: RowOf<'users'>
      /** Exactly `createRow`'s own failure shape — see that function. */
      grantFailure: WriteDenied | WritePersistenceUnavailable
    }

/**
 * `assignTenantRole`'s own result — the exact name and shape Task 4
 * (dispatched after this task) depends on. `segregation-of-duties` is a
 * THIRD failure shape distinct from `denied`: "you hold no grant for this
 * action at all" (a `PermissionDecision`, from the generic role floor) and
 * "you hold a grant for this DOOR but not for granting THIS role" are
 * different facts, and folding the second into a bare `denied` would lose
 * the specific `grantorRole`/`requestedRole` pair a caller needs to render
 * a business-specific refusal rather than a generic one. No
 * `PermissionDecision` is carried on this arm — the same reasoning
 * `CreateShiftResult`'s own `'overlap'` arm gives for the same shape:
 * `AccessRequest`/`PermissionDecision` describe a question about the
 * ACTOR's authority in general, and this refusal is a business fact about
 * one row-independent role pairing, computed per call (see
 * `TENANT_ROLE_GRANT_MATRIX`'s own comment), not a stale scope baked into a
 * static request constant.
 */
export type AssignTenantRoleResult =
  | WriteResult<RowOf<'role-grants'>>
  | { ok: false; kind: 'segregation-of-duties'; grantorRole: RoleId; requestedRole: RoleId }

/**
 * Task 8 (unit-01) — no expiry field exists on `User` or `Tenant` for a
 * console/tenant-admin invitation (`@/data/schemas/platform` carries none),
 * and the frozen source states no number of its own for THIS invitation:
 * §30.3.1 (the tenant-admin onboarding narrative) never gives one, and the
 * one figure the source does state — §15.1 Table A, `TRN-ACC-01`, L18973 —
 * is explicit that it is not settled: "Invitation validity is not specified
 * in the Statement of Work. Recommendation: 7 days — `Recommendation — R&D`."
 * That is the only number the source offers anywhere for an invited
 * account, so this build reuses it for the tenant admin's own invitation
 * rather than inventing an unrelated figure — a client-delegated choice
 * under APP-012, disclosed on screen (`AcceptInvitationScreen.tsx`) with
 * the alternative (no fixed window at all) named, not only recorded here.
 * A real, consumed `const`, never a magic number retyped beside the
 * arithmetic that uses it or the screen text that states it.
 */
export const INVITATION_VALIDITY_DAYS = 7
const INVITATION_VALIDITY_MS = INVITATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000

/**
 * The tenant lifecycles under which no invitation may be accepted — the
 * three-state suspension machine (§8.9) plus `archived`; deliberately NOT
 * `pending-downgrade` (`TENANT_LIFECYCLE_MAP` below maps it to `ACTIVE` —
 * "still operating while its tier changes, not a suspension") and
 * deliberately not `invited`/`pilot` (the ordinary, expected state of a
 * tenant whose first administrator has not yet accepted at all).
 */
const INVITATION_BLOCKED_TENANT_LIFECYCLES: ReadonlySet<RowOf<'tenants'>['lifecycle']> = new Set([
  'soft-suspended',
  'hard-suspended',
  'compliance-suspended',
  'archived',
])

/**
 * Fix round 1 (unit-01, Task 8 review, IMPORTANT 1) — `expired` and
 * `tenant-blocked` refuse an action exactly as `provisionTenant`'s own five
 * COMMAND_VALIDATION guards do, and now carry the same real
 * `PermissionDecision` those guards build via `deny(...)`, not a bare typed
 * `kind` with no decision object at all. `PER-DOH-INVITE-ACCEPT` (frozen
 * source L61323: "Allowed with conditions — valid, unexpired invitation
 * only") is the source's own permission id for exactly the check `expired`
 * enforces; `§15.1`'s `TRN-ACC-01` (L18973) is the one place the source
 * states any validity figure at all for an invited account (see
 * `INVITATION_VALIDITY_DAYS`'s own comment). Both now live in a real,
 * consumed `sourceRefs` array `deny(...)` actually builds, not only in a
 * header comment `scripts/build-registries.mjs` strips before scanning.
 */
function expiredDecision(tenant: RowOf<'tenants'>, invitedAt: string, expiresAt: string): PermissionDecision {
  return deny(
    'explicitlyProhibited',
    'OBJECT_STATE_INVALID',
    `The invitation to ${tenant.name}, issued ${invitedAt}, expired ${expiresAt} — past the ${INVITATION_VALIDITY_DAYS}-day window.`,
    { stage: 'COMMAND_VALIDATION', sourceRefs: ['PER-DOH-INVITE-ACCEPT', 'L61323', '§15.1', 'TRN-ACC-01', 'L18973'] },
  )
}

/**
 * `archived` reads `TENANT_NOT_ACTIVE` (the reason code `evaluate.ts` itself
 * uses for that exact state, `REASON_CODES.TENANT_NOT_ACTIVE`: "still being
 * set up or has been archived"); the three suspended states read
 * `TENANT_SUSPENDED` — the same split `evaluateAccess`'s own
 * feature-and-suspension stage draws, reused rather than re-invented.
 * `MOD-SA-09`/`§8.9` is the tenant-lifecycle module this suspension machine
 * belongs to, the same identifier `TenantDetailScreen.tsx`'s own
 * `activateGate` already cites for this module.
 */
function tenantBlockedDecision(tenant: RowOf<'tenants'>): PermissionDecision {
  const reasonCode = tenant.lifecycle === 'archived' ? 'TENANT_NOT_ACTIVE' : 'TENANT_SUSPENDED'
  return deny(
    'explicitlyProhibited',
    reasonCode,
    `${tenant.name}'s account is currently ${tenant.lifecycle.replace(/-/g, ' ')}; no invitation into it can be accepted while that holds.`,
    { stage: 'COMMAND_VALIDATION', sourceRefs: ['§8.9', 'MOD-SA-09'] },
  )
}

/**
 * The four reader-facing outcomes a visitor's OWN invitation link can be
 * in, `ok` aside. Shared, verbatim, between the write door below (the
 * write-time authority) and the Hub screen that renders the SAME facts
 * before a visitor ever clicks Accept (a render-time preview, exactly the
 * split `TenantDetailScreen.tsx`'s own `activateGate`/`canActivate` keep
 * from the generic write door they precede) — so the two can never
 * disagree about which state a given tenant id is in. `expired` and
 * `tenant-blocked` each carry a real `decision: PermissionDecision` (fix
 * round 1, IMPORTANT 1) built by `expiredDecision`/`tenantBlockedDecision`
 * above — the `kind` stays distinct from the generic `denied` shape so the
 * screen can still choose its own plain-language copy per branch, but the
 * decision object, and the `sourceRefs` inside it, are real.
 */
export type TenantAdminInvitationStatus =
  | { readonly kind: 'ok'; readonly tenant: RowOf<'tenants'>; readonly admin: RowOf<'users'> }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'already-accepted'; readonly tenant: RowOf<'tenants'>; readonly admin: RowOf<'users'> }
  | {
      readonly kind: 'expired'
      readonly tenant: RowOf<'tenants'>
      readonly admin: RowOf<'users'>
      readonly invitedAt: string
      readonly expiresAt: string
      readonly decision: PermissionDecision
    }
  | {
      readonly kind: 'tenant-blocked'
      readonly tenant: RowOf<'tenants'>
      readonly admin: RowOf<'users'>
      readonly decision: PermissionDecision
    }

/**
 * Pure and read-only: takes the live `tenants`/`users` rows and a clock
 * reading, never the store or a cached selector, so both call sites
 * (`acceptInvitation` below, reading fresh from `store.get`; the screen,
 * reading through `repository.list` with its own signed-out read context)
 * can call it with whatever snapshot they already hold. The admin in
 * question is always THIS tenant's EARLIEST-CREATED `TENANT_ADMIN` —
 * `TenantDetailScreen.tsx#firstTenantAdmin`'s own derivation, repeated
 * here rather than imported (`src/data` may not import from `app/**`,
 * boundary rule) — so the two screens can never name a different "first"
 * administrator for the same tenant. Never takes a caller-supplied user
 * row: the only input identifying WHICH invitation is `tenantId`, a bare
 * string, so there is no argument for a later branch to discard the way
 * `provisionTenant`'s pre-fix idempotent retry once did (fix round 3, that
 * method's own comment) — every fact this function returns is read fresh
 * from the collections passed in, never from a value the caller already
 * believed.
 *
 * Fix round 1 (unit-01, Task 8 review, IMPORTANT 1, minor ordering note) —
 * `tenant-blocked` is now checked BEFORE `expired`: an expired invitation
 * into a suspended tenant used to tell the visitor to ask for a re-issue
 * that would not help (the tenant itself, not the invitation, is what
 * blocks them), so the more fundamental refusal — the workspace is not
 * reachable at all — is surfaced first.
 */
export function classifyTenantAdminInvitation(
  tenants: readonly RowOf<'tenants'>[],
  users: readonly RowOf<'users'>[],
  tenantId: string,
  nowMs: number,
): TenantAdminInvitationStatus {
  const tenant = tenants.find((t) => t.id === tenantId)
  if (!tenant) return { kind: 'not-found' }

  const admin = users
    .filter((u) => u.tenantId === tenant.id && u.role === 'TENANT_ADMIN')
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0]
  if (!admin) return { kind: 'not-found' }

  if (admin.status === 'active') return { kind: 'already-accepted', tenant, admin }
  // `suspended`/`removed`: reachable by no path this unit builds (the seed
  // carries none, and nothing here suspends or removes an INVITED admin
  // before acceptance), but handled honestly rather than assumed away —
  // from this visitor's own point of view there is no live invitation to
  // accept, the same fact `not-found` already states, so it is not given
  // a fourth, invented reader-facing name for a case that cannot happen.
  if (admin.status !== 'invited') return { kind: 'not-found' }

  if (INVITATION_BLOCKED_TENANT_LIFECYCLES.has(tenant.lifecycle)) {
    return { kind: 'tenant-blocked', tenant, admin, decision: tenantBlockedDecision(tenant) }
  }

  const expiresAtMs = Date.parse(admin.createdAt) + INVITATION_VALIDITY_MS
  if (nowMs >= expiresAtMs) {
    const invitedAt = admin.createdAt
    const expiresAt = new Date(expiresAtMs).toISOString()
    return { kind: 'expired', tenant, admin, invitedAt, expiresAt, decision: expiredDecision(tenant, invitedAt, expiresAt) }
  }

  return { kind: 'ok', tenant, admin }
}

/**
 * `acceptInvitation`'s own result. Deliberately NOT a `partial`-shaped
 * union like `ProvisionTenantResult`/`InviteConsoleUserResult`: this door
 * makes exactly ONE write (the admin's own `users` row; see this file's
 * header and this method's own comment for why the tenant's OWN lifecycle
 * is deliberately NOT touched here), so there is no second write whose
 * independent failure a `partial` arm would need to name — the smaller
 * shape `decideApprovalRequest` above already established for the same
 * reason. Four of the non-`ok` arms are exactly `TenantAdminInvitationStatus`'s
 * own non-`ok` arms, `ok: false` added, never a second, hand-typed copy of
 * the same four facts; `WriteDenied`/`WritePersistenceUnavailable` are the
 * two purely mechanical failures (`truthStoreRefusal`, the §12.4
 * persistence-capability gate) every other door in this file also carries,
 * reused via `Extract`, never redeclared.
 */
export type AcceptInvitationResult =
  | { ok: true; user: RowOf<'users'> }
  | { ok: false; kind: 'not-found' }
  | { ok: false; kind: 'already-accepted'; tenant: RowOf<'tenants'>; admin: RowOf<'users'> }
  | {
      ok: false
      kind: 'expired'
      tenant: RowOf<'tenants'>
      admin: RowOf<'users'>
      invitedAt: string
      expiresAt: string
      decision: PermissionDecision
    }
  | {
      ok: false
      kind: 'tenant-blocked'
      tenant: RowOf<'tenants'>
      admin: RowOf<'users'>
      decision: PermissionDecision
    }
  | WriteDenied
  | WritePersistenceUnavailable

/* ────────────────────────────────────────────────────────────────────── *
 * Query
 * ────────────────────────────────────────────────────────────────────── */

/**
 * `filtered` is the row set after every `where()`/`sort()` so far, BEFORE
 * paging. `paged` is null until `page()` is called; once set, `all()`/
 * `count()` read the page while `total()` still reads `filtered.length` —
 * this is the whole answer to "`total()` before paging, `count()` for the
 * current page." Trap #1 from the brief: an unfiltered `list()`'s `total()`
 * compared against a filtered call's `total()` is how a caller tells "no
 * rows exist" apart from "rows exist but none match the filter" — both
 * render `all()` as `[]`, but only one of them also reports the wider
 * `total()` as zero.
 */
class QueryImpl<T> implements Query<T> {
  private constructor(
    private readonly filtered: readonly T[],
    private readonly paged: readonly T[] | null,
  ) {}

  static from<T>(rows: readonly T[]): QueryImpl<T> {
    return new QueryImpl(rows, null)
  }

  where(pred: (row: T) => boolean): Query<T> {
    return new QueryImpl(this.filtered.filter(pred), null)
  }

  sort(key: keyof T & string, dir: 'asc' | 'desc' = 'asc'): Query<T> {
    const factor = dir === 'asc' ? 1 : -1
    const sorted = [...this.filtered].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av) < String(bv) ? -1 * factor : 1 * factor
    })
    return new QueryImpl(sorted, null)
  }

  page(index: number, size: number): Query<T> {
    const start = index * size
    return new QueryImpl(this.filtered, this.filtered.slice(start, start + size))
  }

  all(): readonly T[] {
    return this.paged ?? this.filtered
  }

  first(): T | undefined {
    return this.all()[0]
  }

  count(): number {
    return this.all().length
  }

  total(): number {
    return this.filtered.length
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * Read-visibility scoping
 * ────────────────────────────────────────────────────────────────────── */

function asRecord(row: unknown): Record<string, unknown> {
  return row as Record<string, unknown>
}

/**
 * Fix round 2 — tenant resolution, walked from the existing `RELATIONS`
 * graph (`@/data/schemas`) rather than hand-listed per collection.
 *
 * THE HOLE THIS CLOSES. `captures` and `evidence` carry no `tenantId`
 * field of their own (§7.4 puts tenant isolation second in the evaluation
 * order, above roles and scopes; §26.3 names it an adversarial release
 * gate) — the OLD `rowTenantOf` read `row.tenantId` directly and returned
 * `null` for both, which made the write-time isolation check a no-op on
 * exactly the two collections holding worker evidence. Denormalising a
 * `tenantId` onto those schemas was rejected: it would be a second,
 * independently-writable copy of a fact `RELATIONS` already expresses
 * through `runId`/`jobId`/`siteId`/`workerId`/`deviceId`, and a second copy
 * of one fact is what this whole layer exists to prevent.
 *
 * `TENANT_REACHABLE` is the fixed point of "which collections have a path
 * to `tenants`", computed once by walking `RELATIONS` — a scalar
 * (non-array), non-self-referential relation whose `to` is already
 * reachable makes `from` reachable too. This is what keeps a merely
 * INCIDENTAL relation (e.g. `users.role → roles`, which exists for
 * referential-integrity checking, not tenant scoping) from being read as a
 * tenant path: `roles` has no outgoing relation at all, so it is never
 * reachable, so `role` is never offered as a candidate.
 */
const TENANT_REACHABLE: ReadonlySet<CollectionName> = (() => {
  const reachable = new Set<CollectionName>(['tenants'])
  let changed = true
  while (changed) {
    changed = false
    for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
      if (reachable.has(name)) continue
      const canReach = RELATIONS.some((r) => r.from === name && !r.array && r.to !== name && reachable.has(r.to))
      if (canReach) {
        reachable.add(name)
        changed = true
      }
    }
  }
  return reachable
})()

/** Every scalar, non-self-referential relation from `name` whose target can itself reach a tenant. */
function tenantCandidateRelations(name: CollectionName) {
  return RELATIONS.filter((r) => r.from === name && !r.array && r.to !== name && TENANT_REACHABLE.has(r.to))
}

/**
 * `'direct'`: the row's own schema carries `tenantId` (or the row IS
 * `tenants`, whose `id` is the tenant). `'transitive'`: no field of its
 * own, but `RELATIONS` gives at least one path to a tenant-bearing
 * collection — `captures` and `evidence` land here. `'none'`: no path
 * exists in the graph at all, a static schema fact, not a per-row failure
 * — `roles`, `feature-controls`, `entitlements`, `schedules` (its one
 * relation is the self-referential `definitionId`, filtered out above) and
 * `evaluations` (same, `scenarioId`) are genuinely platform-scoped, not
 * holes: there is no tenant to isolate a platform-wide register against.
 */
export function tenantResolutionKind(name: CollectionName): 'direct' | 'transitive' | 'none' {
  if (name === 'tenants') return 'direct'
  if (!TENANT_REACHABLE.has(name)) return 'none'
  const direct = RELATIONS.some((r) => r.from === name && r.field === 'tenantId' && r.to === 'tenants')
  return direct ? 'direct' : 'transitive'
}

export type TenantResolution =
  | { readonly kind: 'resolved'; readonly tenant: string }
  /**
   * No tenant concept applies. Two distinct ways to reach this, both real:
   * the COLLECTION has no path to a tenant at all (`tenantResolutionKind(name)
   * === 'none'`), or — fix round 1, unit-01 Task 7 review — a `'transitive'`
   * collection's row has candidate references that are each either absent
   * or themselves resolve to `'none'` (a `role-grants` row whose `userId`
   * points at a platform-scoped `users` row, `tenantId: null`, is exactly
   * this: `role-grants` itself is `'transitive'`, not `'none'`, but THIS
   * row still carries no tenant). Not a failure either way.
   */
  | { readonly kind: 'none' }
  /** Two or more of this row's OWN references resolve to different tenants. Refuse; never guess. */
  | { readonly kind: 'conflict'; readonly candidates: readonly string[] }
  /** A candidate reference was present but could not be walked to any tenant (a dangling id, most likely). Refuse. */
  | { readonly kind: 'unresolved' }

/**
 * Walks `tenantCandidateRelations` for `row`, recursing into each
 * referenced row's own tenant. `chain` is the set of collections already
 * being resolved in this call stack — a guard against a cycle (there is
 * none reachable after the self-loop filter above, but the guard costs
 * nothing and turns a future graph change that DID introduce one into a
 * `'none'` contribution rather than a stack overflow).
 *
 * Every resolved candidate is collected into a `Set`: one member is the
 * answer, more than one is a genuine conflict (refused, never picked
 * between), and zero when at least one candidate FIELD was present but
 * did not resolve (a dangling reference) is `'unresolved'` (refused) —
 * distinct from zero because every candidate field was itself null/absent,
 * which is `'none'` exactly like a collection with no path at all.
 */
function resolveTenantId(
  name: CollectionName,
  row: Record<string, unknown>,
  store: Store,
  chain: ReadonlySet<CollectionName> = new Set(),
): TenantResolution {
  if (name === 'tenants') {
    return typeof row.id === 'string' ? { kind: 'resolved', tenant: row.id } : { kind: 'unresolved' }
  }
  const relations = tenantCandidateRelations(name)
  if (relations.length === 0) return { kind: 'none' }
  if (chain.has(name)) return { kind: 'none' }
  const nextChain = new Set(chain)
  nextChain.add(name)

  const candidates = new Set<string>()
  let anyCandidateFieldPresent = false

  /**
   * Task 7 (unit-01) fix — `role-grants.userId` walking to a PLATFORM user
   * (`tenantId: null`) surfaced a real bug this loop had carried since the
   * fix-round-2 rewrite: `anyCandidateFieldPresent` was set the instant a
   * candidate FIELD held a non-null string, before this function ever
   * asked what that reference resolved TO. A reference to a row that
   * genuinely has no tenant concept (`sub.kind === 'none'` — the exact
   * reading `resolveTenantId('users', platformUserRow, …)` already gives,
   * two paragraphs above this loop) was therefore indistinguishable from a
   * DANGLING reference (a row that does not exist at all): both forced
   * `anyCandidateFieldPresent = true`, and with zero candidates added by
   * either, both produced `'unresolved'` — refusing a `role-grants` write
   * for any of the four platform console roles, every one of whose grants
   * carries a `userId` pointing at a `tenantId: null` row.
   *
   * `anyCandidateFieldPresent` now marks only the cases the comment above
   * `TenantResolution` already says it should: a reference that was
   * ATTEMPTED and did not yield a tenant — dangling (target missing),
   * `'unresolved'`, or `'conflict'` beneath it. A reference that resolved
   * cleanly to `'none'` contributes nothing, exactly like the field being
   * null in the first place — which is what a platform-scoped `userId`
   * inside a `role-grants` row actually is: not a data-integrity problem,
   * just a chain that legitimately ends without a tenant. Every OTHER
   * outcome (`'resolved'`, dangling, `'unresolved'`, `'conflict'`, the
   * direct `rel.to === 'tenants'` case) is unchanged — this narrows one
   * incorrect case in a function every collection's tenant walk shares,
   * not a per-collection carve-out.
   *
   * READ-PATH CONSEQUENCE (fix round 1, unit-01 Task 7 review, minor): this
   * also changes what `withinScope` (below) shows a TENANT-domain reader.
   * That function treats a `'none'` resolution as "a platform-scoped row,
   * visible to every signed-in identity" — before this fix, the 21 affected
   * rows (three collections' worth of platform-scoped `role-grants`-shaped
   * data, measured by the harness the review ran) resolved `'unresolved'`
   * and were hidden from a TENANT-domain reader by the same branch; they now
   * resolve `'none'` and are visible. Not exploitable today — every reader
   * of those three collections is a `/super-admin/**` screen, none of which
   * runs under a TENANT-domain identity — but it is a real behaviour change
   * this comment did not originally mention. Whether `withinScope` should
   * distinguish a per-row `'none'` from a collection that is STATICALLY
   * platform-scoped is a separate, larger question, deliberately deferred
   * rather than folded into this fix.
   */
  for (const rel of relations) {
    const value = row[rel.field]
    if (value === null || value === undefined || typeof value !== 'string') continue

    if (rel.to === 'tenants') {
      candidates.add(value)
      anyCandidateFieldPresent = true
      continue
    }
    const targetRows = store.get(rel.to) as readonly Record<string, unknown>[]
    const target = targetRows.find((r) => r.id === value)
    if (target === undefined) {
      anyCandidateFieldPresent = true // dangling reference: no candidate, but a real integrity problem
      continue
    }
    const sub = resolveTenantId(rel.to, target, store, nextChain)
    if (sub.kind === 'resolved') {
      candidates.add(sub.tenant)
      anyCandidateFieldPresent = true
    } else if (sub.kind === 'conflict' || sub.kind === 'unresolved') {
      anyCandidateFieldPresent = true
    }
    // sub.kind === 'none': the referenced row genuinely carries no tenant.
    // Contributes nothing, and does NOT force this row to 'unresolved'.
  }

  if (candidates.size === 1) return { kind: 'resolved', tenant: [...candidates][0]! }
  if (candidates.size > 1) return { kind: 'conflict', candidates: [...candidates] }
  return anyCandidateFieldPresent ? { kind: 'unresolved' } : { kind: 'none' }
}

/**
 * The read-time reading of `evaluateAccess`'s TENANT_ISOLATION and SCOPE
 * stages (see this file's header for why the full evaluator is not called
 * for a plain read). An identity with an EMPTY `siteScope`/`areaScope`
 * reads as carrying no restriction on that dimension at all — exactly what
 * a Read-only Auditor's or Tenant Admin's role-grant carries (no
 * `siteIds`/`areaIds`), the same reading `evaluateAccess`'s own SCOPE stage
 * gives an undeclared `requiredSites`/`requiredAreas`: an absent
 * constraint is never a narrower one than a declared, matching one.
 *
 * Fix round 2: a `'conflict'` or `'unresolved'` tenant resolution is
 * treated as NOT the caller's tenant (hidden from a TENANT-domain reader)
 * rather than shown by default — the same fail-closed rule the write path
 * applies, read for visibility instead of authorisation.
 */
function withinScope(name: CollectionName, row: Record<string, unknown>, ctx: AccessContext, store: Store): boolean {
  const { identity } = ctx
  if (!identity.signedIn || identity.role === null) return false
  const domain = roleById(identity.role).domain

  if (domain === 'TENANT') {
    if (identity.tenant === null) return false
    const resolution = resolveTenantId(name, row, store)
    // 'none' -> a platform-scoped row (e.g. `roles`), visible to every
    // signed-in identity. 'resolved' -> must match the actor's own tenant.
    // 'conflict'/'unresolved' -> fail closed, never shown as the caller's own.
    if (resolution.kind === 'resolved' && resolution.tenant !== identity.tenant) return false
    if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') return false
  }
  // PLATFORM-domain identities are not narrowed by tenant here: they read
  // across tenants through a named access session, matching
  // `evaluateAccess`'s own PLATFORM branch.

  const siteVal = row.siteId
  if (typeof siteVal === 'string' && identity.siteScope.length > 0 && !identity.siteScope.includes(siteVal)) {
    return false
  }
  const areaVal = row.areaId
  if (typeof areaVal === 'string' && identity.areaScope.length > 0 && !identity.areaScope.includes(areaVal)) {
    return false
  }
  return true
}

function rowId(row: Record<string, unknown>): string {
  const id = row.id
  return typeof id === 'string' ? id : ''
}

/* ────────────────────────────────────────────────────────────────────── *
 * Write authorisation
 * ────────────────────────────────────────────────────────────────────── */

const TENANT_OPERATIONAL_WRITERS: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']
const FRONTLINE_WRITERS: readonly RoleId[] = ['WORKER', 'SUPERVISOR', 'QUALITY_MANAGER']
const PLATFORM_WRITERS: readonly RoleId[] = ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER']
const COMMAND_ISSUERS: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']

/**
 * `provisionTenant`'s own, single, explicitly-declared authorisation —
 * fix round 1 (unit-01, Task 5 review), replacing the two per-write
 * `authorizeWrite` exemptions the first pass bolted onto the generic
 * floor. `L75180`/`L52400`/`SB-31-01` are the SAME identifiers
 * `TenantsScreen.tsx`'s own `createDecision` already cites for "who may
 * create a tenant" — the same business decision, now also enforced at the
 * point of the actual write, not only at the point of showing the button.
 * Deliberately role-only, no `resourceTenant`: provisioning a tenant names
 * no existing resource to isolate against (the row does not exist until
 * this authorisation has already passed), so there is nothing here for a
 * stale or fresh `ctx.state` to disagree about either way.
 */
const PROVISION_TENANT_REQUEST: AccessRequest = {
  action: 'provision-tenant',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['L75180', 'L52400', 'SB-31-01'],
}

/**
 * `inviteConsoleUser`'s own, single, explicitly-declared authorisation —
 * fix round 1 (unit-01, Task 7 review, IMPORTANT 6), replacing the
 * screen-level two-call sequence that authorised each write independently
 * through the generic floor's `PLATFORM_WRITERS` set (Admin and Platform
 * Engineer included) even though §8.8.1/§8.8.2 name user creation and role
 * assignment as root-only. `AC-SA-08-02` is deliberately NOT cited here
 * (fix round 1, unit-01 Task 7 review, IMPORTANT 7): that acceptance
 * criterion states the control must be ABSENT for every role but the root,
 * and this authorisation is exactly the one that renders it DISABLED
 * instead — `SB-31-10` is the storyboard that actually supports this
 * reading; citing `AC-SA-08-02` beside it would be a citation for the
 * decision this build did not take.
 */
const INVITE_CONSOLE_USER_REQUEST: AccessRequest = {
  action: 'invite-console-user',
  allowedRoles: ['ROOT_SUPER_ADMIN'],
  sourceRefs: ['§8.8.1', '§8.8.2', 'SB-31-10'],
}

/**
 * Task 3 (unit-02) — the closed tenant-role set `createTenantUser`/
 * `assignTenantRole` may ever mint or grant. Four of the five tenant roles
 * (`@/domain/roles`, `MOD-DOH-09 / §3.5`): `READONLY_AUDITOR` is
 * deliberately excluded from THIS pair of doors' own closed set, per this
 * task's own brief (Step 2/3, which names "the closed tenant-role enum
 * values" as exactly these four) — not because the source forbids granting
 * it, but because this build's brief scopes these two doors to the four it
 * names, leaving Read-only Auditor provisioning to a future task rather
 * than inventing an unsourced rule for it here.
 */
const TENANT_USER_ROLES: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'WORKER']

/**
 * Task 3 (unit-02) — Step 2's research finding: which tenant role may grant
 * which other tenant role.
 *
 * This task's own brief offered a DISCLOSED DEFAULT to fall back on only if
 * the frozen source were silent on the question ("Tenant Admin may grant
 * any of the four tenant roles; Supervisor and Quality Manager may grant
 * only Worker"). The source is not silent. Two independent, converging
 * `SoW Fact` citations settle it, both read directly from
 * `AVIIXA_Production_Product_Blueprint.md`:
 *
 * - `MTX-TEN-02a`, the tenant role-to-module matrix (frozen source
 *   L21990-L22026: "tenant role to module, the nineteen Delivery Operations
 *   Hub modules"), its own `MOD-DOH-09` "Permissions, Roles and Access" row
 *   (L22015): `Tenant Admin: Allowed [H17]` · `Supervisor: Unavailable` ·
 *   `Quality Manager: Unavailable` · `Read-only Auditor: Read-only` ·
 *   `Worker: Explicitly prohibited [H18]`. This screen's own header
 *   (elsewhere in this build) already states that `Unavailable` and
 *   `Explicitly prohibited` are never merged with `Allowed with
 *   conditions` — `Unavailable` means the module does not exist for that
 *   role AT ALL, not "exists, narrowed to one role." Supervisor and
 *   Quality Manager cannot reach this module even to grant the one role
 *   (Worker) this task's own brief-proposed default would have let them
 *   grant.
 * - `TRN-ACC-04` (L18976), the account-lifecycle authority table's own
 *   "Activated to Active | Roles and scopes assigned" row: Requester
 *   `Tenant Admin`, Authorizer `Tenant Admin` — singular, unlike
 *   `TRN-ACC-01` two rows above it (L18973), which names "Supervisor or
 *   Tenant Admin" as Requester for the earlier account-REQUEST step alone.
 *   The same transition's own effect table (L18991) confirms there is only
 *   ever one assigning identity the source ever names: notification goes
 *   "to the account holder and the assigning Tenant Admin."
 *
 * So: only `TENANT_ADMIN` may grant any of the four tenant roles under this
 * build; every other tenant role's own row is the empty set — narrower
 * than this task's own brief-proposed default, and cited to the real lines
 * rather than delegated. `AssignTenantRoleResult`'s own
 * `segregation-of-duties` arm exists to carry this refusal with the acting
 * and requested roles named, for a Supervisor or Quality Manager
 * attempting to grant ANY role, Worker included — not only "a Supervisor
 * may not grant Quality Manager," which was this task's brief's own
 * illustrative phrasing of the (here, unused) default rule.
 */
const TENANT_ROLE_GRANT_MATRIX: Readonly<Partial<Record<RoleId, readonly RoleId[]>>> = {
  TENANT_ADMIN: TENANT_USER_ROLES,
}

/** The roles `grantorRole` may grant, per `TENANT_ROLE_GRANT_MATRIX` above — `[]` for any role the matrix leaves unlisted, never `undefined`. */
function rolesGrantableBy(grantorRole: RoleId): readonly RoleId[] {
  return TENANT_ROLE_GRANT_MATRIX[grantorRole] ?? []
}

/**
 * Task 3 (unit-02) — `createTenantUser`'s own floor: the same
 * `TENANT_OPERATIONAL_WRITERS` set the generic Hub door already gives this
 * collection's SIBLING collections (`sites`/`areas`/`shifts`, per
 * `defaultWriteRoles('hub')`), NOT `PLATFORM_WRITERS` — the fix for the
 * `'platform'`-authority gap this task's plan names in its own Architecture
 * section. A Supervisor or Quality Manager MAY call this door (and reach
 * the richer, business-specific segregation-of-duties refusal this file's
 * own comment above describes) even though `TENANT_ROLE_GRANT_MATRIX`
 * means neither can ever complete it — the same split
 * `CREATE_SHIFT_REQUEST`'s floor and `shiftOverlapConflict`'s own
 * row-dependent check keep apart: who may ATTEMPT this action, and what
 * additional per-call fact refuses it.
 */
const CREATE_TENANT_USER_REQUEST: AccessRequest = {
  action: 'create-tenant-user',
  allowedRoles: TENANT_OPERATIONAL_WRITERS,
  sourceRefs: ['L18973', 'TRN-ACC-01', 'L22015', 'MTX-TEN-02a', 'repository.ts'],
}

/** `CREATE_TENANT_USER_REQUEST`'s own sibling for `assignTenantRole`. Same floor, same reasoning. */
const ASSIGN_TENANT_ROLE_REQUEST: AccessRequest = {
  action: 'assign-tenant-role',
  allowedRoles: TENANT_OPERATIONAL_WRITERS,
  sourceRefs: ['L18976', 'TRN-ACC-04', 'L22015', 'MTX-TEN-02a', 'repository.ts'],
}

/**
 * Task 1 (unit-02), fix round 1 (task-1 review, Important 3) — the SAME
 * floor `defaultWriteRoles('hub')` already gives the generic door for
 * this collection (`TENANT_OPERATIONAL_WRITERS`), declared as this door's
 * own, single, explicitly-declared `AccessRequest` rather than a call
 * into `authorizeWrite` — the mandated shape `PROVISION_TENANT_REQUEST`/
 * `INVITE_CONSOLE_USER_REQUEST` above already establish. No
 * `resourceTenant` here, deliberately: `createAreaUnderSite`'s own
 * `checkSiteReference` call, immediately after this decision, already
 * re-derives the identical tenant fact `authorizeWrite`'s `resourceTenant`
 * would have — through the SAME `siteId` — so this door asks it once, not
 * twice through two different mechanisms.
 *
 * NO `requiredSites` HERE EITHER, AND THAT IS DELIBERATE — fix round 2
 * (task-1 review, new finding): this constant is static, declared once at
 * module load, with no row to read yet. `authorizeWrite`'s own
 * `AccessRequest` was built dynamically, per call, and included
 * `requiredSites: [siteId]` whenever `ctx.identity.siteScope` was
 * non-empty — the SCOPE stage (`src/policy/evaluate.ts`) that lets a
 * site-scoped Supervisor (e.g. seeded grant `RG-0003`, `siteIds:
 * ["SITE-BB-RIVERSIDE"]`) create an Area under THEIR OWN Site but refuses
 * one under a Site outside their scope. Swapping `authorizeWrite` for this
 * bare constant silently dropped that check — measured, live, through this
 * screen's own Areas-tier Create control (a scoped Supervisor could open
 * ANY Site in the tenant, since a `sites` row carries no `siteId` field of
 * its own for `withinScope` to filter reads by, and create an Area under
 * it). The fix is NOT here, in the constant — it is on the call, in
 * `createAreaUnderSite` itself, which knows the actual `area.siteId` this
 * constant cannot.
 */
/**
 * CORRECTIVE TASK (unit-02, task-corrective-01) — `allowedRoles` narrowed
 * to `['TENANT_ADMIN']`, correcting the paragraph above. This constant's
 * own `sourceRefs` already named `L27118` — the frozen source's Location
 * Configuration roles-and-permissions table, "Create a Site, Area or
 * Location": `Allowed with conditions` for Tenant Admin only, `Explicitly
 * prohibited` for Supervisor, Quality Manager, Read-only Auditor and
 * Worker alike. The `['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']`
 * this constant shipped with (see the paragraph above) contradicted the
 * very line it cited — measured live: a Supervisor or Quality Manager
 * could create an Area this table explicitly prohibits them from
 * creating. The same table's "blocked in soft, hard and compliance
 * suspension" condition on the Tenant Admin's OWN write is not a gap this
 * fix adds logic for: `evaluateAccess`'s shared FEATURE_AND_SUSPENSION
 * stage already denies every TENANT-domain request (this door included)
 * whenever `ctx.identity.tenant` names a suspended tenant, with no
 * per-door opt-in required, so nothing further is needed here.
 */
const CREATE_AREA_UNDER_SITE_REQUEST: AccessRequest = {
  action: 'create-area-under-site',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27118', 'L26919', 'repository.ts'],
}

/**
 * `CREATE_AREA_UNDER_SITE_REQUEST`'s own sibling for `createLocationUnderArea`.
 * Same reasoning, `checkAreaReference`/`requiredAreas`/`areaScope` in place
 * of `checkSiteReference`/`requiredSites`/`siteScope`.
 *
 * CORRECTIVE TASK (unit-02, task-corrective-01) — same correction, same
 * reasoning as `CREATE_AREA_UNDER_SITE_REQUEST` above: `L27118` prohibits
 * every role but Tenant Admin from creating a Location, and this
 * constant's prior `allowedRoles` contradicted that.
 */
const CREATE_LOCATION_UNDER_AREA_REQUEST: AccessRequest = {
  action: 'create-location-under-area',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27118', 'L26919', 'repository.ts'],
}

/**
 * CORRECTIVE TASK (unit-02, task-corrective-01) — Site creation's own
 * named door. Before this fix, a new Site was created through the bare
 * generic `create('sites', ...)` door, which has no dedicated
 * `AccessRequest` for `sites` and falls back to `defaultWriteRoles('hub')`
 * (`TENANT_OPERATIONAL_WRITERS`) — the same too-wide floor
 * `CREATE_AREA_UNDER_SITE_REQUEST` shipped with, for the same reason:
 * nobody had given Site creation its own narrower door. `L27118` (this
 * constant's own citation, the Location Configuration roles-and-
 * permissions table's "Create a Site, Area or Location" row) draws no
 * distinction between the three tiers — Tenant Admin only, for all three
 * — so this door's floor matches `CREATE_AREA_UNDER_SITE_REQUEST`'s
 * exactly. Same shape as that door: a static `AccessRequest`, `resourceTenant`
 * added dynamically at the call site (see `createSite` below) since a Site
 * has no PARENT reference for `checkSiteReference` to validate the way an
 * Area or Location has — the Site row IS the resource, so its own
 * `tenantId` is what the tenant-isolation stage must check.
 */
const CREATE_SITE_REQUEST: AccessRequest = {
  action: 'create-site',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27118', 'repository.ts'],
}

/**
 * Task 2 (unit-02) — the overlap refusal `createShift`/`updateShift` run.
 * `startTime`/`endTime` are local time-of-day strings (`schemas/org.ts`'s
 * own comment: "a shift boundary has no date of its own") — compared here
 * as minutes-since-midnight numbers, never as a constructed `Date` (Global
 * Constraints: simulated clock only, and a bare time-of-day has no date to
 * attach one to anyway).
 *
 * A block whose `endTime` is not later than its `startTime` (the seeded
 * `SHIFT-BB-NIGHT`, `"18:00"`–`"02:00"`) crosses midnight and is read as TWO
 * half-open segments, `[start, 1440)` and `[0, end)`, rather than one — the
 * same half-open, wraparound-aware shape `overlapConflict`/`timeSegments`
 * used in the outgoing fixture-driven screen this task replaces
 * (`./collections/shifts.json`'s own `SHIFT-BB-DAY` "06:00"–"14:00" and
 * `SHIFT-BB-NIGHT` "18:00"–"02:00" coexist at the same Site today
 * precisely because neither reading treats the night Shift as spanning the
 * WHOLE day).
 */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

const MINUTES_PER_DAY = 1440

function shiftTimeSegments(startTime: string, endTime: string): readonly (readonly [number, number])[] {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (end > start) return [[start, end]]
  return [
    [start, MINUTES_PER_DAY],
    [0, end],
  ]
}

function segmentsOverlap(
  a: readonly (readonly [number, number])[],
  b: readonly (readonly [number, number])[],
): boolean {
  return a.some(([aStart, aEnd]) => b.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd))
}

/**
 * The first other, ACTIVE Shift at the same Site whose `[startTime,
 * endTime)` window overlaps the candidate's, or `null`. Archived Shifts are
 * excluded — an archived Shift no longer occupies its working-time block,
 * so refusing a new one because a retired Shift once covered those hours
 * would make a Site's schedule permanently unusable; the same reading the
 * outgoing fixture-driven screen this task replaces already documented for
 * the same rule one level down (Shift-to-Area, not Shift-to-Site, but the
 * same "archived no longer occupies" judgement). `excludeId` is the row's
 * own id on an update, so a Shift is never reported as conflicting with
 * itself.
 */
function shiftOverlapConflict(
  store: Store,
  siteId: string,
  startTime: string,
  endTime: string,
  excludeId: string | null,
): RowOf<'shifts'> | null {
  const shifts = store.get('shifts') as readonly RowOf<'shifts'>[]
  const candidate = shiftTimeSegments(startTime, endTime)
  for (const s of shifts) {
    if (s.siteId !== siteId) continue
    if (s.status === 'archived') continue
    if (excludeId !== null && s.id === excludeId) continue
    if (segmentsOverlap(candidate, shiftTimeSegments(s.startTime, s.endTime))) return s
  }
  return null
}

/**
 * Task 2 (unit-02) — same floor, same static/dynamic split as
 * `CREATE_AREA_UNDER_SITE_REQUEST` above: the SAME floor `defaultWriteRoles
 * ('hub')` already gives the generic door for `shifts`
 * (`TENANT_OPERATIONAL_WRITERS`), declared once as this door's own
 * `AccessRequest`, with NO `requiredSites` baked in — this constant is
 * static, declared once at module load, with no row to read yet.
 * `createShift`/`updateShift` add `requiredSites: [siteId]` at the CALL
 * SITE instead, only when the acting identity actually carries a site
 * scope, exactly the condition `createAreaUnderSite` uses (see that
 * constant's own comment for the fix-round-2 finding this shape exists to
 * avoid repeating).
 */
/**
 * CORRECTIVE TASK (unit-02, task-corrective-01) — `allowedRoles` narrowed
 * to `['TENANT_ADMIN']`, correcting the paragraph above. This constant's
 * own `sourceRefs` already named `L27291` — the frozen source's Shift
 * Management roles-and-permissions table, "Create a Shift":
 * `Allowed with conditions` for Tenant Admin only, `Explicitly prohibited`
 * for Supervisor, Quality Manager, Read-only Auditor and Worker alike (the
 * same table's own "Security" field states it plainly: "Tenant Admin only
 * for writes; all other roles read within scope"). The
 * `['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']` this constant
 * shipped with contradicted the very line it cited. The same table's
 * "blocked in every suspension state" condition on the Tenant Admin's OWN
 * write needs no new logic here — `evaluateAccess`'s shared
 * FEATURE_AND_SUSPENSION stage already denies every TENANT-domain request
 * (this door included) against a suspended tenant, generically.
 */
const CREATE_SHIFT_REQUEST: AccessRequest = {
  action: 'create-shift',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27291', 'repository.ts'],
}

/**
 * `CREATE_SHIFT_REQUEST`'s own sibling for `updateShift`. Same shape.
 *
 * CORRECTIVE TASK (unit-02, task-corrective-01) — same correction, same
 * reasoning as `CREATE_SHIFT_REQUEST` above: `L27292` ("Edit a Shift")
 * prohibits every role but Tenant Admin, and this constant's prior
 * `allowedRoles` contradicted that.
 */
const UPDATE_SHIFT_REQUEST: AccessRequest = {
  action: 'update-shift',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27292', 'repository.ts'],
}

/**
 * FINAL WHOLE-UNIT REVIEW (unit-02, Important 1) — `archiveShift`'s own
 * floor, the third sibling of the two above. `L27293` ("Archive a Shift"):
 * `Allowed with conditions` for the Tenant Admin, `Explicitly prohibited`
 * for the Supervisor, the Quality Manager, the Read-only Auditor and the
 * Worker alike — the same Shift Management roles-and-permissions table
 * whose own "Security" field reads "Tenant Admin only for writes; all
 * other roles read within scope". Static, no `requiredSites` baked in:
 * `archiveShift` adds the row-dependent scope check at the call site, the
 * shape `CREATE_SHIFT_REQUEST`'s own comment settles.
 *
 * Before this door existed the archive path ran through the bare generic
 * `update()`, whose fallback floor for `shifts` is `defaultWriteRoles
 * ('hub')` (`TENANT_OPERATIONAL_WRITERS`) — three roles wide where the
 * source names one. That is the same too-wide-generic-floor defect the
 * corrective task corrected on six other constants in this file; the
 * archive path was simply not among them.
 */
const ARCHIVE_SHIFT_REQUEST: AccessRequest = {
  action: 'archive-shift',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27293', 'repository.ts'],
}

/**
 * Task 1 (unit-02), fix round 1 (task-1 review, Important 3) — same
 * floor and same reasoning as `CREATE_AREA_UNDER_SITE_REQUEST` above:
 * `archiveLocationTierEntity` delegates its actual write to the generic
 * `update()` (which re-authorises through `authorizeWrite` on that path),
 * but the READ path — finding the target row and computing its active
 * children — must itself be authorised before ANY row data is touched
 * (fix round 1, Critical 1: the pre-fix version read and returned
 * another tenant's real Area/Location names to an unauthorised caller
 * before `update()`'s internal check ever ran, on the refusal path,
 * which never reaches `update()` at all). This is that up-front check,
 * declared once rather than duplicating `authorizeWrite`'s own role
 * floor.
 *
 * CORRECTIVE TASK (unit-02, task-corrective-01) — `allowedRoles` narrowed
 * to `['TENANT_ADMIN']`. This constant's own `sourceRefs` already named
 * `L27122` — the frozen source's Location Configuration roles-and-
 * permissions table, "Archive a Site or Area": `Allowed with conditions`
 * for Tenant Admin only, `Explicitly prohibited` for Supervisor, Quality
 * Manager, Read-only Auditor and Worker alike. The
 * `['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']` this constant
 * shipped with contradicted the very line it cited — measured live: a
 * Supervisor or Quality Manager could archive a Site or Area this table
 * explicitly prohibits them from archiving. No new suspension logic is
 * added here for the same reason `CREATE_AREA_UNDER_SITE_REQUEST`'s own
 * corrective note gives: `evaluateAccess`'s shared FEATURE_AND_SUSPENSION
 * stage already covers it generically.
 */
const ARCHIVE_LOCATION_TIER_ENTITY_REQUEST: AccessRequest = {
  action: 'archive-location-tier-entity',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27122', 'L112908', 'WF-DOH-02-CASCADE', 'repository.ts'],
}

/**
 * Task 4 (unit-02) — `createWorker`'s own floor. Controller-verified against
 * the frozen source's `MOD-DOH-04` roles-and-permissions table (L27470,
 * "Create or edit a worker record"; the same rows' own functional
 * breakdown, `FUNC-DOH-04-1.1.1`, "Roles allowed: Tenant Admin, Supervisor
 * within scope. Roles prohibited: Quality Manager, Read-only Auditor,
 * Worker"): Tenant Admin `Allowed`, Supervisor `Allowed with conditions —
 * own scope`, Quality Manager `Explicitly prohibited`.
 *
 * DELIBERATELY NOT `TENANT_OPERATIONAL_WRITERS` (the generic `'hub'`-
 * authority floor, `defaultWriteRoles('hub')`, which also admits Quality
 * Manager) — widening a write door to that generic floor without checking
 * the module's OWN action-level table is the exact mistake three of this
 * unit's four prior review cycles caught (see `CREATE_AREA_UNDER_SITE_
 * REQUEST`/`CREATE_LOCATION_UNDER_AREA_REQUEST`/`CREATE_SITE_REQUEST`/
 * `CREATE_SHIFT_REQUEST`/`UPDATE_SHIFT_REQUEST`/`ARCHIVE_LOCATION_TIER_
 * ENTITY_REQUEST`'s own corrective-task comments above, all landed in one
 * fix round). Quality Manager's real standing in THIS module is exclusively
 * clearance-granting for an expired or never-held qualification (the same
 * table's `Grant a clearance...` rows) — a Client Command Center action
 * (`WF-DOH-04-CLEARANCE`) the design spec defers out of this task, not a
 * worker-record write.
 */
const CREATE_WORKER_REQUEST: AccessRequest = {
  action: 'create-worker',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR'],
  sourceRefs: ['L27470', 'FUNC-DOH-04-1.1.1', 'MOD-DOH-04', 'repository.ts'],
}

/**
 * Task 4 (unit-02) — `recordQualification`'s own floor. Same table, "Enter
 * a qualification" row (L27472; `FUNC-DOH-04-2.1.1`, "Roles allowed: Tenant
 * Admin, Supervisor. Roles prohibited: Quality Manager, Read-only Auditor,
 * and absolutely the Worker, because self-attestation is not permitted"):
 * Tenant Admin `Allowed`, Supervisor `Allowed — with full audit`, Quality
 * Manager `Explicitly prohibited`. Same reasoning as `CREATE_WORKER_REQUEST`
 * above for why this is not the generic `'hub'` floor.
 */
const RECORD_QUALIFICATION_REQUEST: AccessRequest = {
  action: 'record-qualification',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR'],
  sourceRefs: ['L27472', 'FUNC-DOH-04-2.1.1', 'MOD-DOH-04', 'repository.ts'],
}

/**
 * Task 5 (unit-02) — `enrollDevice`'s own floor. `WF-DVC-001` ("Enrolling a
 * device into the tenant's fleet", §8.13.4/§8.13.1) names Tenant Admin as
 * "Primary" and Supervisor as "Secondary" in its own Actors line, but its
 * own Denied path (L53091) states plainly: "A Supervisor, Quality Manager,
 * Read-only Auditor, or Worker attempting enrollment is refused. A Support
 * account cannot enroll a device." This is the same class of internal
 * contradiction this unit already discloses elsewhere (the Actors/Security
 * mismatch `CREATE_SHIFT_REQUEST`'s own comment names, and the
 * DEC-WKRVIEW-001 contradiction `WorkerLifecycleScreen.tsx`'s own header
 * names) — the explicit, enumerated Denied-path sentence is read as
 * authoritative over the looser Actors line, the same choice this unit's
 * corrective task already made for `CREATE_SHIFT_REQUEST`/
 * `ARCHIVE_LOCATION_TIER_ENTITY_REQUEST`. Independently corroborated by a
 * SECOND, distinct source location: the Super Admin platform console's own
 * `MOD-SA-13` permission matrix, "Enroll a device" row (L45543): Tenant
 * Admin `Allowed — enrollment is tenant-self-service within platform
 * policy`, `Other tenant roles` `Explicitly prohibited`.
 *
 * DELIBERATELY NOT `TENANT_OPERATIONAL_WRITERS` (the generic `'hub'`-
 * authority floor, which also admits Supervisor and Quality Manager) — the
 * same class of mistake three-then-four prior write doors in this unit
 * shipped with before correction (see `CREATE_WORKER_REQUEST`'s own
 * comment for the full list). Two independent source locations agree here,
 * so this floor ships narrow from the start rather than needing its own
 * later fix round.
 */
const ENROLL_DEVICE_REQUEST: AccessRequest = {
  action: 'enroll-device',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['WF-DVC-001', 'L53091', 'L45543', 'MOD-SA-13', 'repository.ts'],
}

/**
 * Task 5 (unit-02) — `reassignDevice`'s own floor. `WF-DVC-002`
 * ("Reassigning a device to another Area or worker group") is EXPLICIT in
 * its own Denied path (L53124): "Reassignment by a Supervisor is refused;
 * device policy sits with the Tenant Admin. A Support account cannot
 * reassign." No Actors-line ambiguity here at all — the same section's own
 * Actors line lists "Secondary Supervisors of both Areas" for VISIBILITY
 * only (they see the change on their own Areas' devices), and the Denied
 * path is the one sentence that answers the WRITE question directly, in
 * the affirmative-negative it needs no derivation to read. No `MOD-SA-13`
 * permission-matrix row exists for reassignment specifically (that table
 * carries "Enroll a device"/"Set device mode at enrollment" only) — this
 * door's citation rests on `WF-DVC-002`'s own Denied path alone, and that
 * sentence is sufficiently explicit to need no second corroborating source.
 *
 * DELIBERATELY NOT `TENANT_OPERATIONAL_WRITERS` — same reasoning as
 * `ENROLL_DEVICE_REQUEST` above.
 */
const REASSIGN_DEVICE_REQUEST: AccessRequest = {
  action: 'reassign-device',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['WF-DVC-002', 'L53124', 'repository.ts'],
}

/**
 * Task 7 (closure sweep) — LV-0010's own door: `SupportAccessScreen.tsx`
 * (`MOD-SA-15`) had zero `repository.*` calls before this task, so "Open a
 * support session" could never do anything real, and there was no door to
 * wire the Hub↔Super Admin navigation onto. This is that door.
 *
 * `allowedRoles`: `WF-ROLE-022` ("Opening a read-only support session into a
 * tenant", `registries/generated/workflows.json`, frozen source L56054)
 * names Support as the primary actor. The four-role permission matrix at
 * L55560 ("Open a normal support session") gives Root and Admin bare
 * `Allowed` and Support bare `Allowed`; the supporting matrix at L45794
 * agrees for all three. The Platform Engineer is the one seat the frozen
 * source disagrees with itself about across four different matrices —
 * `Explicitly prohibited` (L21166), `Unavailable` (L48810), `Allowed with
 * conditions` (L65407), bare `Allowed` (L45794) — and this build already
 * adjudicated that conflict once, on screen: `SupportAccessScreen.tsx`'s own
 * D17 draws no session-open form for the Platform Engineer at all, holding
 * the narrower reading as the safer prototype. This door matches that
 * existing, disclosed decision rather than silently re-opening it.
 *
 * NOT `defaultWriteRoles('platform')` (`PLATFORM_WRITERS`, which admits the
 * Platform Engineer and excludes Support — exactly backwards from the row
 * above): the generic `create()`/`update()` doors are never called by
 * `openSupportSession`/`closeSupportSession` for exactly that reason — see
 * those methods' own implementation comments.
 */
const OPEN_SUPPORT_SESSION_REQUEST: AccessRequest = {
  action: 'open-support-session',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
  sourceRefs: ['L56054', 'L55560', 'L45794', 'repository.ts'],
}

/**
 * `closeSupportSession`'s own floor — matches `SupportAccessScreen.tsx`'s
 * existing (until this task, purely local-state) "Close this session"
 * control (`closeDecision`, `allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN',
 * 'SUPPORT']`, L16111). L45794's "End an in-progress session" row gives Root
 * and Admin bare `Allowed` but Support only `Allowed with conditions — own
 * sessions` — enforced as an ownership check in the method body
 * (`before.platformUserId === ctx.actorOfRecord`) for Support alone, never
 * for Root/Admin, rather than folded into this static role list, matching
 * this file's own "row-dependent fact, never baked into the constant"
 * discipline.
 *
 * This is NOT `WF-ROLE-023`'s own control (the Tenant Admin ending the
 * session from the tenant's own banner, L56077) — that is a different actor
 * on a different surface and is not built by this task; see
 * `SupportAccessScreen.tsx`'s own `endSessionReason` for why no console role
 * holds it.
 */
const CLOSE_SUPPORT_SESSION_REQUEST: AccessRequest = {
  action: 'close-support-session',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
  // Fix round 1 (coordinator review, Minor 10) — `L16111` dropped: it is the
  // Support role card's "Linked workflows" row, which names which workflow
  // ids relate to closing a session but carries no role-authority statement
  // of its own. `L45794` ("End an in-progress session") is the real
  // citation for this door's role floor.
  sourceRefs: ['L45794', 'repository.ts'],
}

/**
 * Fix round 3 (unit-01, Task 7 re-review, IMPORTANT 2) — who may decide a
 * pending `approval-requests` row, by class. Duplicated from
 * `ConsoleUsersScreen.tsx`'s own (identically-named-in-spirit) render-time
 * helper rather than imported: `src/data` may not import from `app/`
 * (boundary rule), and no shared module between the two exists yet for
 * this one small fact. Both copies must agree; a future task giving this
 * unit a `src/policy`-level home for per-class approver sets should
 * collapse them into one.
 */
function decisionApproverRoles(changeClass: RowOf<'approval-requests'>['changeClass']): readonly RoleId[] {
  return changeClass === 'critical' ? ['ROOT_SUPER_ADMIN'] : ['ROOT_SUPER_ADMIN', 'ADMIN']
}

/**
 * The generic write door's own default role policy, keyed by truth-store
 * authority. This is deliberately the BROAD authority boundary this task
 * owns ("no collection write bypasses truth-store + role + scope"), not a
 * per-collection, per-action permission matrix — the narrower per-command
 * rules `@/kernel/reduce.ts`'s `SPECS` already carry for the twelve Hub
 * commands sit on top of, and never below, this floor.
 */
function defaultWriteRoles(authority: TruthStoreAuthority): readonly RoleId[] {
  switch (authority) {
    case 'hub':
    case 'studio':
      return TENANT_OPERATIONAL_WRITERS
    case 'device-local':
      return FRONTLINE_WRITERS
    case 'platform':
      return PLATFORM_WRITERS
    case 'command-queue':
      return COMMAND_ISSUERS
    case 'audit':
    case 'telemetry':
    case 'cc-projection':
    case 'review':
      return []
  }
}

function affectedSurfacesFor(authority: TruthStoreAuthority): readonly SurfaceId[] {
  switch (authority) {
    case 'hub':
      return ['SURF-DOH', 'SURF-CC']
    case 'studio':
      return ['SURF-STU', 'SURF-DOH', 'SURF-CC']
    case 'device-local':
      return ['SURF-FL', 'SURF-DOH']
    case 'command-queue':
      return ['SURF-CC', 'SURF-DOH', 'SURF-FL']
    case 'platform':
      return ['SURF-SA']
    case 'audit':
    case 'telemetry':
    case 'cc-projection':
    case 'review':
      return []
  }
}

/**
 * Fix round 1, §12.4: which `ActionClass` (`@/persistence/capability`) a
 * write against this collection represents, for the `ready-durable` vs.
 * `ephemeral-preview` gate. Every class below is in that module's own
 * `DURABLE_ACTIONS` set, so every write this repository can perform is
 * blocked outright unless storage is fully durable — exactly what §12.4
 * requires ("block every action representing durable evidence, a required
 * audit, capture acceptance, queue or command acceptance, approval,
 * publication, release, hold, synchronisation, or an authoritative
 * lifecycle change").
 */
function actionClassFor(name: CollectionName, authority: TruthStoreAuthority): ActionClass {
  if (name === 'holds') return 'hold'
  switch (authority) {
    case 'device-local':
      return 'captureAcceptance'
    case 'command-queue':
      return 'queueAcceptance'
    case 'studio':
      return 'publication'
    case 'platform':
      return 'lifecycleChange'
    case 'hub':
    case 'audit':
    case 'telemetry':
    case 'cc-projection':
    case 'review':
      return 'requiredAudit'
  }
}

/**
 * Fix round 2: `TENANT_MISMATCH` for a conflicting or unresolvable tenant
 * is returned BEFORE `evaluateAccess` ever runs — resolving the row's
 * owning tenant is a precondition for asking whether the actor's own
 * tenant may touch it, not one more thing `evaluateAccess` itself checks.
 * §7.4 puts tenant isolation above role/scope in the evaluation order; this
 * keeps that ordering rather than letting a role check run first against a
 * tenant the write cannot even prove.
 */
function tenantIsolationDenial(
  name: CollectionName,
  resolution: Extract<TenantResolution, { kind: 'conflict' | 'unresolved' }>,
): PermissionDecision {
  const detail =
    resolution.kind === 'conflict'
      ? `its own references resolve to more than one tenant (${resolution.candidates.join(', ')})`
      : `its owning tenant could not be determined from its own references`
  return deny(
    'explicitlyProhibited',
    'TENANT_MISMATCH',
    `This "${name}" row's tenant must be verifiable before it can be written: ${detail}. The write is refused ` +
      'rather than assumed to belong to the caller\'s tenant.',
    { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'], auditExpectation: 'RECORDED_AS_REFUSAL' },
  )
}

function authorizeWrite(
  name: CollectionName,
  authority: TruthStoreAuthority,
  action: 'create' | 'update' | 'transition',
  row: Record<string, unknown>,
  ctx: AccessContext,
  store: Store,
): PermissionDecision {
  const resolution = resolveTenantId(name, row, store)
  if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') {
    return tenantIsolationDenial(name, resolution)
  }
  const rowTenant = resolution.kind === 'resolved' ? resolution.tenant : null
  const siteId = typeof row.siteId === 'string' ? row.siteId : undefined
  const areaId = typeof row.areaId === 'string' ? row.areaId : undefined

  /**
   * Task 6 (unit-01) finding, corrected in fix round 1 (review IMPORTANT 1)
   * — `resourceTenant` is NEVER declared for a write to the `tenants`
   * collection itself, even though `resolveTenantId` above resolves one
   * (`name === 'tenants'` returns `{ kind: 'resolved', tenant: row.id }` —
   * the row's OWN id, by construction). That self-resolution is CORRECT and
   * load-bearing for READ visibility (`withinScope` above, ~L374: it is how
   * a TENANT-domain reader's own tenant row is matched at all) — the
   * narrower, write-path-only problem is that feeding it back into
   * `authorizeWrite`'s `resourceTenant` duplicates the role floor
   * (`defaultWriteRoles`) that already gates who may write `tenants` at
   * all, and on this one collection it can only ever produce a FALSE
   * refusal, never a true isolation catch (there is no second tenant to be
   * isolated from — the actor and the resource are the same platform-wide
   * record).
   *
   * It is also a LOAD-BEARING dead end this task's own live drive found:
   * the feature-and-suspension stage (`evaluateAccess`,
   * `NOT_YET_OR_NO_LONGER_ACTIVE_STATES`) refuses any write whose
   * `resourceTenant` resolves to a `PROVISIONING` (`invited`/`pilot`) or
   * `ARCHIVED` tenant — correct for an OPERATIONAL write reaching INTO a
   * not-yet-live or closed tenant, but with the pre-fix code this ALSO
   * refused the platform's own `Activate`/(future unit 10)
   * suspend-release/reactivate/restore writes ON that tenant's own row,
   * because the very state those actions exist to change is what the floor
   * was reading back as a refusal.
   *
   * `create` REMAINS EXEMPT TOO, but for a reason unrelated to the
   * `Activate` case above, and unrelated to staleness (fix round 1, unit-01
   * Task 5 review): a brand-new tenant's id is not yet in
   * `state.platform.tenants` no matter how fresh that state is — the row
   * being authorised does not exist until AFTER this very check passes —
   * so `evaluate.ts`'s platform-domain M4 check (`tenantPartition(state,
   * req.resourceTenant) === undefined` denies `TENANT_MISMATCH`) would
   * refuse it regardless. This exemption still matters for the GENERIC
   * `repository.create('tenants', …)` door — a future direct caller that
   * does not go through `provisionTenant` below would hit it again — but
   * Task 5's create wizard no longer depends on it: `provisionTenant` never
   * calls `authorizeWrite` for either of its two internal writes at all
   * (see that method's own comment for why one up-front authorisation
   * replaces the generic door's per-write check for this one compound
   * action).
   *
   * SCOPE OF WHAT THIS REMOVES, PRECISELY (fix round 1, unit-01 Task 5
   * review, accuracy correction): omitting `resourceTenant` here removes
   * its input to THREE checks in `evaluate.ts`, not one — the TENANT-domain
   * and PLATFORM-domain halves of the tenant-isolation stage's
   * resource-matching check (`req.resourceTenant !== undefined && …`, ~L205
   * and ~L229) AND the feature-and-suspension stage's `suspensionTenant`
   * lookup (~L315, `domain === 'TENANT' ? identity.tenant :
   * (req.resourceTenant ?? null)`), which is what `SUSPENDED_STATES` and
   * `NOT_YET_OR_NO_LONGER_ACTIVE_STATES` actually key off. It does NOT
   * remove the tenant-isolation stage's ACTOR-side checks, which do not
   * depend on `resourceTenant` at all (a TENANT-domain role still needs a
   * live ambient tenant, ~L192; a PLATFORM-domain role still may not carry
   * one, ~L212) — those keep applying to a `tenants` write exactly as they
   * do to any other. The floor for a `tenants` write is therefore
   * ROLE-ONLY as far as the RESOURCE is concerned
   * (`defaultWriteRoles('platform')`: `ROOT_SUPER_ADMIN`/`ADMIN`/
   * `PLATFORM_ENGINEER`) — wider than this screen's own `Activate` gate,
   * which excludes `PLATFORM_ENGINEER`. Every caller of
   * `repository.update`/`.transition('tenants', …)` MUST carry its own
   * role/object-state gate (as `TenantDetailScreen.tsx` does) — this floor
   * will not catch a caller that forgets one.
   *
   * FIX ROUND 1 (unit-01, Task 5 review) — THE `users` CARVE-OUT THIS
   * COMMENT BLOCK USED TO SIT BESIDE IS REVERTED, NOT REPAIRED. A narrower
   * exemption here (declare `resourceTenant` for `users` UNLESS the target
   * tenant's own current lifecycle was `invited`) shipped in this task's
   * first pass. Measured, under review: it was calibrated to the WRONG
   * condition. The write it existed for was never refused by the
   * feature-and-suspension stage it was written against — it was refused
   * `TENANT_MISMATCH` at the EARLIER tenant-isolation stage, because the
   * `ctx` the wizard's own two sequential writes shared was captured once,
   * before either write ran (`useAccessContext`'s own staleness, fixed
   * above in `src/ui/product/runtime/useRepository.ts` — but a value
   * already closed over by an in-flight multi-write handler does not
   * become fresher mid-execution just because the hook that produced it
   * now is). And once the actual condition was measured rather than
   * assumed, the exemption did not carry the narrowness its own name
   * claimed: `onboardingFirstUser` gated on nothing but "does this tenant's
   * CURRENT lifecycle happen to be invited" — not on the row being created
   * actually being a first Tenant Admin, not on its role, not on its
   * status, not on the tenant having no administrator yet. Any of the
   * three platform writers (including `PLATFORM_ENGINEER`, whom the
   * wizard's OWN gate excludes) could have created any number of `users`
   * rows, of any role and status, into any of the four seeded `invited`
   * tenants, including ones that already had one. Onboarding now has its
   * own door instead (`provisionTenant` below) — one explicit, single
   * authorisation for the whole compound action, never a second exemption
   * bolted onto the generic floor every OTHER `users` write still needs.
   */
  const req: AccessRequest = {
    action: `${action.toUpperCase()} ${name}`,
    allowedRoles: defaultWriteRoles(authority),
    sourceRefs: ['§12.5', '§12.6', 'repository.ts'],
    ...(rowTenant !== null && name !== 'tenants' ? { resourceTenant: brandTenantId(rowTenant) } : {}),
    ...(siteId !== undefined && ctx.identity.siteScope.length > 0 ? { requiredSites: [siteId] } : {}),
    ...(areaId !== undefined && ctx.identity.areaScope.length > 0 ? { requiredAreas: [areaId] } : {}),
  }
  return evaluateAccess(req, ctx)
}

/* ────────────────────────────────────────────────────────────────────── *
 * State-machine legality
 * ────────────────────────────────────────────────────────────────────── */

type TransitionRuling =
  | { readonly allowed: true; readonly field: string }
  | { readonly allowed: false; readonly reason: string }

/**
 * Delegates to the REAL, already-wired state machines: `captureTransition`
 * (`@/frontline/capture`, the fifteen edges the frozen source's own
 * diagram draws) for `captures`, and the definition/occurrence transition
 * tables (`@/domain/vocabularies`) for `schedules`. No other collection in
 * this build has a legality graph the source actually states, and this
 * function refuses rather than invent one — a fabricated graph would pass
 * every type check while deciding a question nobody sourced (the brief's
 * own trap #3: a `transition()` that returns `{ ok: true }` without really
 * consulting a state machine).
 *
 * This gap is recorded debt, not a TODO for this file: each §24.2
 * workflow unit registers the machine for the collections it actually
 * drives, against the source, once it has the screens that need it.
 */
function stateMachineLegality(name: CollectionName, row: Record<string, unknown>, to: string): TransitionRuling {
  if (name === 'captures') {
    const from = row.status as CaptureState
    const ruling = captureTransition(from, to as CaptureState)
    return ruling.allowed ? { allowed: true, field: 'status' } : { allowed: false, reason: ruling.reason }
  }
  if (name === 'schedules') {
    if (row.kind === 'definition') {
      const from = row.status as ScheduleDefinitionState
      const edge = SCHEDULE_DEFINITION_TRANSITIONS.find(
        (t) => (t.from as readonly string[]).includes(from) && t.to === to,
      )
      return edge
        ? { allowed: true, field: 'status' }
        : {
            allowed: false,
            reason: `"${from}" to "${to}" is not an edge the schedule-definition state ladder draws (@/domain/vocabularies).`,
          }
    }
    if (row.kind === 'occurrence') {
      const from = row.status as ScheduleOccurrenceState
      const edge = SCHEDULE_OCCURRENCE_TRANSITIONS.find(
        (t) => (t.from as readonly string[]).includes(from) && t.to === to,
      )
      return edge
        ? { allowed: true, field: 'status' }
        : {
            allowed: false,
            reason: `"${from}" to "${to}" is not an edge the schedule-occurrence state ladder draws (@/domain/vocabularies).`,
          }
    }
  }
  return {
    allowed: false,
    reason: `No state machine is registered for "${name}" in this build — transition() refuses rather than guess a legality graph the source does not state.`,
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * Scenario state, for the tenant-isolation/suspension stages evaluateAccess needs
 * ────────────────────────────────────────────────────────────────────── */

const TENANT_LIFECYCLE_MAP: Readonly<Record<string, TenantPartition['lifecycleState']>> = {
  invited: 'PROVISIONING',
  pilot: 'PROVISIONING',
  active: 'ACTIVE',
  'soft-suspended': 'SOFT_SUSPENDED',
  'hard-suspended': 'HARD_SUSPENDED',
  'compliance-suspended': 'COMPLIANCE_SUSPENDED',
  // Still operating while its tier changes -- not a suspension.
  'pending-downgrade': 'ACTIVE',
  archived: 'ARCHIVED',
}

/**
 * Projects the `tenants`/`feature-controls` collections into the
 * `ScenarioDomainState` shape `evaluateAccess` reads for tenant-isolation
 * and feature/suspension checks — derived from the collections' own truth
 * every time it is called, never a second copy of it. Exported so a caller
 * building an `AccessContext` (the scratch route, and any future screen)
 * does not have to re-derive this mapping itself.
 */
export function scenarioStateFor(store: Store): ScenarioDomainState {
  const base = emptyDomainState(scenarioRunId('RUN-data-repository'))
  const tenantRows = store.get('tenants') as readonly { id: string; lifecycle: string; tier: string }[]
  const featureRows = store.get('feature-controls') as readonly {
    featureKey: string
    platformDefault: boolean
    globallyDisabled: boolean
    tenantDesired: Record<string, boolean>
  }[]

  const featureControls: Record<string, boolean> = {}
  for (const f of featureRows) featureControls[f.featureKey] = f.globallyDisabled ? false : f.platformDefault

  const tenants: Record<string, TenantPartition> = Object.create(null) as Record<string, TenantPartition>
  for (const t of tenantRows) {
    const desiredFeatureValues: Record<string, boolean> = {}
    for (const f of featureRows) {
      const desired = f.tenantDesired[t.id]
      if (desired !== undefined) desiredFeatureValues[f.featureKey] = desired
    }
    tenants[t.id] = {
      displayName: t.id,
      lifecycleState: TENANT_LIFECYCLE_MAP[t.lifecycle] ?? 'ACTIVE',
      desiredFeatureValues,
      tier: t.tier,
      objects: {},
    }
  }

  return { ...base, platform: { ...base.platform, featureControls }, tenants }
}

/* ────────────────────────────────────────────────────────────────────── *
 * §12.4 persistence — one IndexedDB transaction per committed write
 * ────────────────────────────────────────────────────────────────────── */

// `satisfies (typeof STORES)[number]` the same way `@/persistence/coordinator`
// ties its own store-name constants to the schema — a typo here is a
// compile error, not a silently-missed store.
const SNAPSHOT_STORE = 'snapshots' satisfies (typeof STORES)[number]
const AUDIT_STORE = 'audit' satisfies (typeof STORES)[number]
const EVENTS_STORE = 'events' satisfies (typeof STORES)[number]

/**
 * The out-of-line key the repository's live snapshot is stored under.
 * Deliberately a STRING key, not a bare sequence integer: `@/persistence/
 * coordinator#commitTransition` already keys the SAME `snapshots` store by
 * `ScenarioDomainState.sequence` (a small integer) for the OTHER kernel
 * subsystem (`src/kernel`, `src/scenario`) — sharing that integer key space
 * would risk two unrelated systems' sequence counters colliding on the same
 * key. `commitTransition` itself is not reused here for the same reason
 * Task 7's original report gave: its `ProposedTransition`/`ScenarioDomainState`
 * types are that OTHER subsystem's shape and are not a plain collection
 * row set — reusing its TYPE would mean an unchecked cast, and reusing its
 * KEY SPACE would mean a collision. What IS reused, deliberately, is
 * everything genuinely shared: `openDatabase`, `STORES`, `errorMessage`
 * from `@/persistence/schema` (the same bridge `boot.ts` already opens
 * through `bootstrapStorage`), the SAME `audit`/`events` object stores
 * (keyed by `id`, so two independently-generated id schemes cannot
 * collide), and the exact abort/complete discipline `commitTransition`
 * already established (never call `preventDefault()` on a request's
 * `error` event; resolve only on the transaction's own `oncomplete`).
 */
const SNAPSHOT_KEY = 'repository-snapshot'

/**
 * Task 5 (closure sweep) — the out-of-line key `Store.nextSequence()`'s
 * current value is committed under, in the SAME transaction and SAME
 * `SNAPSHOT_STORE` as `SNAPSHOT_KEY` above. Without this, a rehydrated
 * session would restart the counter at 0 and risk minting a generated id
 * (`RG-INVITE-1` etc.) that collides with one already present in the
 * restored data. A second key on the same store, not a second store: one
 * commit transaction already writes `SNAPSHOT_STORE`, and the sequence
 * number is exactly as much "the live snapshot's own state" as the
 * collection rows are.
 */
const SEQUENCE_KEY = 'repository-sequence'

type CommitOutcome = { readonly ok: true } | { readonly ok: false; readonly reason: string }

/**
 * Commits the repository's full collection snapshot plus the ONE new
 * audit row and ONE new event row this write produced, in a single
 * `readwrite` IndexedDB transaction — §12.4's "next snapshot plus every
 * required record in one transaction." Resolves `{ ok: true }` only once
 * the transaction's `oncomplete` fires, matching `commitTransition`'s own
 * rule that a resolved `put()` request is not durability. Never throws:
 * every failure — no factory, a refused `open()`, a synchronous `put()`
 * throw, or an asynchronous request-error event — resolves a typed
 * failure instead, and the transaction is left to its OWN default abort
 * (no `preventDefault()`) rather than forced, so a partial write is never
 * silently accepted.
 */
async function commitToPersistence(
  factory: IDBFactory | null,
  snapshot: CollectionData,
  audit: AuditEvent,
  event: DomainEvent,
  sequence: number,
): Promise<CommitOutcome> {
  if (!factory) return { ok: false, reason: 'No IndexedDB implementation is available in this environment.' }

  let db: IDBDatabase
  try {
    db = await openDatabase(factory)
  } catch (err) {
    return { ok: false, reason: `Could not open the database: ${errorMessage(err)}` }
  }

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: CommitOutcome) => {
      if (settled) return
      settled = true
      db.close()
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([SNAPSHOT_STORE, AUDIT_STORE, EVENTS_STORE], 'readwrite')
    } catch (err) {
      settle({ ok: false, reason: `Could not open the commit transaction: ${errorMessage(err)}` })
      return
    }

    let abortReason: string | null = null
    tx.onabort = () => settle({ ok: false, reason: abortReason ?? `Transaction aborted: ${errorMessage(tx.error)}` })
    tx.onerror = (ev) => {
      // The request's default action is to abort the transaction. Do NOT
      // call preventDefault() — see `commitTransition`'s own comment on
      // why that would silently accept a partial write.
      const target = ev.target as IDBRequest | null
      abortReason ??= `A record could not be written: ${errorMessage(target?.error ?? tx.error)}`
    }
    tx.oncomplete = () => settle({ ok: true })

    try {
      tx.objectStore(SNAPSHOT_STORE).put(snapshot, SNAPSHOT_KEY)
      tx.objectStore(SNAPSHOT_STORE).put(sequence, SEQUENCE_KEY)
      tx.objectStore(AUDIT_STORE).put(audit)
      tx.objectStore(EVENTS_STORE).put(event)
    } catch (err) {
      abortReason = `A record could not be written: ${errorMessage(err)}`
      try {
        tx.abort()
      } catch {
        // Already finishing/aborted; onabort/onerror above still resolves.
      }
    }
  })
}

/**
 * Task 5 (closure sweep) — the read half of `commitToPersistence` above:
 * `boot()` calls this to rehydrate from whatever the last successful write
 * durably committed, instead of always rebuilding the store from the §3.1
 * seed. Kept in THIS file, not `@/persistence/schema` or `boot.ts`,
 * specifically so it can read `SNAPSHOT_STORE`/`SNAPSHOT_KEY`/`SEQUENCE_KEY`
 * directly rather than a second, independently-declared copy of those
 * constants — the exact drift risk task-5-brief.md calls out ("the read
 * path must use the IDENTICAL store name and key the write path already
 * uses, or rehydration silently reads nothing").
 *
 * Returns `null` for every "there is nothing to rehydrate" case alike — no
 * factory, a refused `open()`, an unreadable transaction, or (structurally)
 * no snapshot ever written (`snapshotReq.result` is `undefined`, passed
 * through as-is; `boot.ts`'s validation step treats that the same as any
 * other invalid snapshot) — and never throws, matching `commitToPersistence`
 * and `bootstrapStorage`'s own discipline. This function does NOT validate
 * the snapshot's row CONTENT — only `boot.ts` (which owns
 * `loadAndValidateSeed` and the zod schemas) decides whether a read
 * snapshot is trustworthy enough to use.
 */
export async function readLatestSnapshot(
  factory: IDBFactory | null,
): Promise<{ readonly snapshot: unknown; readonly sequence: unknown } | null> {
  if (!factory) return null

  let db: IDBDatabase
  try {
    db = await openDatabase(factory)
  } catch {
    return null
  }

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: { readonly snapshot: unknown; readonly sequence: unknown } | null) => {
      if (settled) return
      settled = true
      db.close()
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([SNAPSHOT_STORE], 'readonly')
    } catch {
      settle(null)
      return
    }

    const snapshotReq = tx.objectStore(SNAPSHOT_STORE).get(SNAPSHOT_KEY)
    const sequenceReq = tx.objectStore(SNAPSHOT_STORE).get(SEQUENCE_KEY)
    // Same discipline as `commitToPersistence`: resolve on the
    // TRANSACTION's own `oncomplete`/`onerror`/`onabort`, never on an
    // individual request's `onsuccess`, and never `preventDefault()` a
    // request error.
    tx.oncomplete = () => settle({ snapshot: snapshotReq.result, sequence: sequenceReq.result })
    tx.onerror = () => settle(null)
    tx.onabort = () => settle(null)
  })
}

/**
 * Task 5 review follow-up (closure sweep) — `reset()` below only ever
 * mutated the in-memory store (`store.resetToSeed()`). Before rehydration
 * existed that was harmless: reset() and a fresh boot() both landed on the
 * seed either way. Now that `boot()` rehydrates from `SNAPSHOT_STORE`, an
 * un-cleared persisted snapshot would survive a reset() and silently
 * reappear on the very next reload, undoing the reset. This deletes both
 * `SNAPSHOT_KEY` and `SEQUENCE_KEY` from the same store `commitToPersistence`
 * writes, so a rehydration attempt after a reset() finds nothing and falls
 * back to the seed exactly like a never-written environment.
 *
 * Deliberately NOT awaited by its one caller, and never throws: `reset()`'s
 * own in-memory effect (`store.resetToSeed()` + `notify()`) is synchronous
 * and must take effect immediately regardless of whether the IndexedDB
 * clear succeeds — the same "a failure here must not block the caller's
 * own effect" discipline this file already applies elsewhere.
 */
async function clearPersistedSnapshot(factory: IDBFactory | null): Promise<void> {
  if (!factory) return

  let db: IDBDatabase
  try {
    db = await openDatabase(factory)
  } catch {
    return
  }

  return new Promise((resolve) => {
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      db.close()
      resolve()
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([SNAPSHOT_STORE], 'readwrite')
    } catch {
      settle()
      return
    }

    tx.oncomplete = settle
    tx.onerror = settle
    tx.onabort = settle

    try {
      tx.objectStore(SNAPSHOT_STORE).delete(SNAPSHOT_KEY)
      tx.objectStore(SNAPSHOT_STORE).delete(SEQUENCE_KEY)
    } catch {
      try {
        tx.abort()
      } catch {
        // Already finishing/aborted; onabort/onerror above still resolves.
      }
    }
  })
}

/* ────────────────────────────────────────────────────────────────────── *
 * Write plumbing shared by create/update/transition
 * ────────────────────────────────────────────────────────────────────── */

const PLATFORM_TENANT_MARKER = 'PLATFORM'

function resolveEventTenant(name: CollectionName, row: Record<string, unknown>, store: Store): string {
  const resolution = resolveTenantId(name, row, store)
  return resolution.kind === 'resolved' ? resolution.tenant : PLATFORM_TENANT_MARKER
}

/**
 * `Audit.before`/`after` are `Record<string, string | number | boolean |
 * null>` (OBJ-084's own schema) — a business row commonly carries arrays
 * and nested objects a plain record cannot hold. Every primitive field is
 * copied as-is; every non-primitive field is copied as its JSON text, so
 * nothing is silently dropped from the audit trail and the record always
 * satisfies its own schema (criterion 5: an exported session must
 * re-validate).
 */
function toAuditPrimitives(row: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value
    } else {
      out[key] = JSON.stringify(value)
    }
  }
  return out
}

function refusal(decision: PermissionDecision): WriteDenied {
  return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
}

function persistenceRefusal(actionClass: ActionClass, capability: PersistenceCapability, detail: string): WritePersistenceUnavailable {
  return {
    ok: false,
    kind: 'persistence-unavailable',
    reason: 'PERSISTENCE_NOT_DURABLE',
    explain:
      `This action ("${actionClass}") represents durable evidence, a required audit record, or an ` +
      `authoritative change, and storage is "${capability.state}" rather than fully durable (§12.4). ${detail} ` +
      'Navigation and read-only inspection remain available; nothing was changed.',
    capability,
  }
}

function truthStoreRefusal(name: CollectionName, authority: TruthStoreAuthority): WriteDenied {
  const decision = deny(
    'explicitlyProhibited',
    'HARD_GATE',
    `"${name}" is ${authority}-owned truth (§12.5). This generic write door never targets a ${authority} ` +
      `collection directly — ${
        authority === 'audit' || authority === 'telemetry'
          ? 'a row of this kind is only ever appended as a by-product of a real write elsewhere, atomically with it'
          : 'no surface holds an owned write through this door for it'
      }.`,
    { stage: 'COMMAND_VALIDATION', sourceRefs: ['§12.5'] },
  )
  return refusal(decision)
}

function notFoundRefusal(name: CollectionName, id: string, action: string): WriteDenied {
  return refusal(
    deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', `No "${name}" row with id "${id}" exists to ${action}.`, {
      stage: 'COMMAND_VALIDATION',
      sourceRefs: ['repository.ts'],
    }),
  )
}

function invalidResultRefusal(name: CollectionName, verb: string, issues: readonly string[]): WriteDenied {
  return refusal(
    deny(
      'explicitlyProhibited',
      'OBJECT_STATE_INVALID',
      `The ${verb} would produce an invalid "${name}" row: ${issues.join('; ')}`,
      { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
    ),
  )
}

/** What `boot.ts` hands `createRepository` — the same IndexedDB factory it already resolved for `bootstrapStorage`, plus the durability that call established. */
export interface PersistenceHandle {
  readonly factory: IDBFactory | null
  readonly capability: PersistenceCapability
}

/* ────────────────────────────────────────────────────────────────────── *
 * The repository
 * ────────────────────────────────────────────────────────────────────── */

export function createRepository(store: Store, persistence: PersistenceHandle): Repository {
  // Mutable only here, in this closure: downgraded on a real commit
  // failure (see `commitWrite` below) so every subsequent durable write
  // is honestly blocked too, not just the one that failed.
  let capability: PersistenceCapability = persistence.capability

  async function commitWrite<N extends CollectionName>(
    name: N,
    action: 'create' | 'update' | 'transition',
    nextRows: readonly RowOf<N>[],
    row: RowOf<N>,
    before: RowOf<N> | null,
    ctx: AccessContext,
    authority: TruthStoreAuthority,
  ): Promise<WriteResult<RowOf<N>>> {
    const seq = store.nextSequence()
    const occurredAt = new Date(store.clock.now()).toISOString()
    const rec = asRecord(row)
    const id = rowId(rec)
    const tenant = resolveEventTenant(name, rec, store)
    // Safe: every path into `commitWrite` runs an `evaluateAccess` call
    // first — `authorizeWrite` for `create`/`update`/`transition`,
    // `PROVISION_TENANT_REQUEST` for `provisionTenant`'s two writes (fix
    // round 2, unit-01, Task 5 re-review: `provisionTenant` → `createRow`
    // → here does NOT call `authorizeWrite`, correcting fix round 1's
    // claim that it does; the invariant this cast relies on — a signed-in
    // identity with a non-null role — still holds, because it comes from
    // `evaluateAccess`'s own SESSION stage, which every one of those
    // requests goes through). Task 8 (unit-01) adds the ONE exception:
    // `acceptInvitation` calls neither `authorizeWrite` nor
    // `evaluateAccess` (there is no externally-supplied caller identity for
    // either to check — see that method's own comment) and instead
    // constructs `ctx.identity` itself, directly, with `signedIn: true` and
    // a real `RoleId`; the invariant this cast relies on holds there for a
    // different, but equally real, reason — the field is set by this
    // repository's own code, not merely assumed.
    const role = ctx.identity.role as RoleId

    const event: DomainEvent = {
      id: `EVT-${seq}-${name}-${id}`,
      kind: 'operational',
      tenantId: tenant,
      actorId: ctx.actorOfRecord ?? 'unattributed',
      siteId: typeof rec.siteId === 'string' ? rec.siteId : null,
      areaId: typeof rec.areaId === 'string' ? rec.areaId : null,
      occurredAt,
      signalType: `${name}.${action}`,
      runId: typeof rec.runId === 'string' ? rec.runId : name === 'runs' ? id : null,
      stepExecutionId: null,
      status: 'recorded',
    }

    const audit: AuditEvent = {
      id: `AUD-${seq}-${name}-${id}`,
      tenantId: tenant === PLATFORM_TENANT_MARKER ? null : tenant,
      actorId: ctx.actorOfRecord ?? 'unattributed',
      effectiveRole: role,
      scope: { siteIds: [...ctx.identity.siteScope], areaIds: [...ctx.identity.areaScope] },
      action: `${action.toUpperCase()} ${name}`,
      result: 'success',
      denialReason: null,
      subjectRef: `${name}:${id}`,
      occurredAt,
      before: before ? toAuditPrimitives(asRecord(before)) : null,
      after: toAuditPrimitives(rec),
      auditClass: name,
      correlationId: event.id,
      causationId: null,
    }

    // The prospective NEXT store state, computed but NOT yet applied —
    // §12.4: nothing becomes visible in-memory until the durable commit
    // resolves. `store.snapshot()` is the CURRENT state; only these three
    // keys change.
    const prospective: CollectionData = {
      ...store.snapshot(),
      [name]: nextRows,
      events: [...store.get('events'), event],
      audit: [...store.get('audit'), audit],
    }

    const committed = await commitToPersistence(persistence.factory, prospective, audit, event, seq)
    if (!committed.ok) {
      // Downgrade honestly: a commit that just failed means storage is no
      // longer trustworthy for THIS session, not only for this one write.
      capability = { state: 'persistence-denied', durable: false }
      return {
        ok: false,
        kind: 'persistence-unavailable',
        reason: 'PERSISTENCE_COMMIT_FAILED',
        explain: `The write could not be committed durably (${committed.reason}). Nothing was changed.`,
        capability,
      }
    }

    // Only now — after the ONE IndexedDB transaction's `oncomplete` — does
    // the in-memory store mutate and `notify()` fire. "Commit, then
    // publish": no subscriber ever sees a write that is not durable.
    store.replace(name, nextRows)
    store.replace('events', prospective.events)
    store.replace('audit', prospective.audit)
    store.notify()

    return { ok: true, row, events: [event], audit: [audit], affectedSurfaces: [...affectedSurfacesFor(authority)] }
  }

  /**
   * Fix round 1 (unit-01, Task 5 review) — the mechanical half of `create`
   * (persistence-capability gate, duplicate-id check, schema validation,
   * commit), factored out from AUTHORISATION so `provisionTenant` below can
   * reuse it for both of its writes without re-running `authorizeWrite`/
   * `evaluateAccess` a second time. The public `create()` method still
   * calls `authorizeWrite` itself, once, before calling this — this
   * function trusts its caller to have already decided the actor MAY
   * create this row; it is not itself reachable from outside this closure.
   */
  async function createRow<N extends CollectionName>(
    name: N,
    row: RowOf<N>,
    ctx: AccessContext,
    authority: TruthStoreAuthority,
  ): Promise<WriteResult<RowOf<N>>> {
    const actionClass = actionClassFor(name, authority)
    if (!permittedUnder(capability.state, actionClass)) {
      return persistenceRefusal(actionClass, capability, `Creating a "${name}" row is not permitted right now.`)
    }

    const rows = store.get(name) as readonly RowOf<N>[]
    const id = rowId(asRecord(row))
    if (rows.some((r) => rowId(asRecord(r)) === id)) {
      return refusal(
        deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', `A "${name}" row with id "${id}" already exists.`, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
      )
    }
    const parsed = COLLECTIONS[name].schema.safeParse(row)
    if (!parsed.success) {
      return invalidResultRefusal(name, 'create', parsed.error.issues.map((i) => i.message))
    }

    const nextRows = [...rows, parsed.data as RowOf<N>]
    return commitWrite(name, 'create', nextRows, parsed.data as RowOf<N>, null, ctx, authority)
  }

  const repository: Repository = {
    list(name, ctx) {
      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const visible = rows.filter((row) => withinScope(name, asRecord(row), ctx, store))
      return QueryImpl.from(visible)
    },

    get(name, id, ctx) {
      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const row = rows.find((r) => rowId(asRecord(r)) === id)
      if (row === undefined) return undefined
      return withinScope(name, asRecord(row), ctx, store) ? row : undefined
    },

    async create(name, row, ctx) {
      const authority = truthStoreFor(name)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(name, authority)

      const decision = authorizeWrite(name, authority, 'create', asRecord(row), ctx, store)
      if (!permitsAction(decision)) return refusal(decision)

      return createRow(name, row, ctx, authority)
    },

    /**
     * Fix round 1 (unit-01, Task 5 review) — see the `Repository` interface
     * and `createRow`'s own comments for the full reasoning. One
     * authorisation for the whole compound action, then two mechanical
     * writes that never re-ask `evaluateAccess` — this is what makes the
     * SECOND write immune to `useAccessContext`'s staleness (fixed
     * separately, `src/ui/product/runtime/useRepository.ts`): there is no
     * second `evaluateAccess` call for a stale `ctx.state` to mislead.
     *
     * FIX ROUND 2 (unit-01, Task 5 re-review, IMPORTANT 1) — the paragraph
     * above is only half the story. `createRow` skips `authorizeWrite`
     * entirely, so with no further check this method was authorised
     * narrower than the two carve-outs it replaced on the ACTOR axis
     * (correctly: `PLATFORM_ENGINEER`/`SUPPORT` are refused
     * `ROLE_NOT_GRANTED` by `PROVISION_TENANT_REQUEST.allowedRoles`, where
     * `PLATFORM_WRITERS` admitted them) but measurably WIDER on the
     * resource and payload axes: it would place a user into a tenant of
     * any lifecycle (archived, hard-suspended, compliance-suspended
     * included), accept `admin.tenantId !== tenant.id`, mint any
     * role/status combination, and re-run against a tenant that already
     * has administrators. The five checks below are the actual shape of
     * "onboard a tenant's first administrator" — the thing this method's
     * name and the paragraph above already claim it does — enforced once,
     * here, so the two mechanical writes are safe BECAUSE this shape
     * already held when they ran, not because `createRow` re-checks
     * anything.
     *
     * IDEMPOTENT ON `tenant.id` — deliberately, and only because this
     * method's own two callers (this repository's public surface has
     * exactly one: `CreateTenantWizard.tsx`) always pass the SAME two rows
     * on a retry. If a tenant with this id already exists, this method
     * does NOT attempt to recreate it (the generic door would correctly —
     * and unhelpfully, for a retry — refuse a duplicate id); it resumes at
     * the administrator write using the row already on file. Fix round 1's
     * claim that "there is no way to reach this idempotent branch except by
     * retrying the exact compound action that put the tenant there" was
     * measured false on re-review: nothing here checked that, so ANY
     * caller naming an existing tenant id reached it, seeded rows
     * included.
     *
     * Fix round 3 (unit-01, Task 5 re-review, IMPORTANT) corrects what fix
     * round 2 got wrong about what the lifecycle guard actually tests: it
     * had read `tenant.lifecycle` — the CALLER's argument — while THIS
     * branch discards that argument and uses `existing` instead. On the
     * idempotent path the guard was therefore checking a value nothing
     * downstream ever reads, leaving `tenantHasUsers` as the only real
     * defence — a property of today's seed, not of the door: measured
     * reachable via `create('tenants', {lifecycle: 'archived'})` (open to
     * any `PLATFORM_WRITERS` role, `ADMIN` included) followed by
     * `provisionTenant` on that same id with a spoofed
     * `lifecycle: 'invited'` argument — the manufactured tenant has zero
     * users, so `tenantHasUsers` passed it through, and the row actually
     * used and written into was `archived` (or `active`, or
     * `hard-suspended` — the caller's claim is irrelevant once `existing`
     * is non-null). The guard now tests `subject.lifecycle`, where
     * `subject` is `existing ?? tenant` — the SAME row the write below
     * actually uses — so this now enforces "the row that will be used is
     * invited and has no users yet" for real, not "the caller SAYS invited
     * and has no users yet". Any edit the caller made to the TENANT half
     * of its two arguments since the first attempt is silently ignored
     * here, on purpose — the committed row is authoritative, never a
     * second, divergent copy of a fact this repository already owns.
     * `CreateTenantWizard.tsx` freezes its own Identity/Commercial fields
     * once this is true, rather than leaving them editable and silently
     * inert.
     */
    async provisionTenant(tenant, admin, ctx) {
      const decision = evaluateAccess(PROVISION_TENANT_REQUEST, ctx)
      if (!permitsAction(decision)) {
        return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
      }

      // Fix round 3 (unit-01, Task 5 re-review, IMPORTANT) — `existing`
      // hoisted above every guard and re-checked against `subject`
      // (the committed row when one exists, the caller's argument
      // otherwise) rather than against `tenant` directly. The bug this
      // closes: `tenant.lifecycle` is the CALLER's claim, but the branch
      // below (`tenantRow = existing`) throws that argument away and uses
      // the row already on file — so checking `tenant.lifecycle` here
      // checked a value nothing downstream ever reads. Measured
      // reachable: `repository.create('tenants', {lifecycle: 'archived'})`
      // (open to any `PLATFORM_WRITERS` role, `ADMIN` included) manufactures
      // a real, zero-user, non-invited tenant on demand; calling
      // `provisionTenant` on that same id with a spoofed
      // `lifecycle: 'invited'` argument passed this guard while the row
      // actually on file — and actually used — was `archived` (or
      // `active`, or `hard-suspended`; the caller's claimed value is
      // irrelevant once `existing` is non-null). Guard 2 below
      // (`tenantHasUsers`) happened to still refuse most of that on
      // TODAY'S seed only because every seeded non-invited tenant already
      // has users; a tenant manufactured fresh via `create()` has none,
      // so guard 2 waved it through. Testing `subject.lifecycle` closes
      // this for any tenant, seeded or manufactured, not just the ones
      // that happen to carry users already. The other four guards were
      // checked for the same shape (argument-vs-committed-row) and do NOT
      // have it: guard 2 keys on `tenant.id`, which is the idempotency key
      // itself and is invariant across a legitimate retry by construction;
      // guards 3-5 read `admin.tenantId`/`admin.role`/`admin.status`, and
      // the `users` write always uses the `admin` ARGUMENT — there is no
      // "existing admin row" reuse path the way there is for the tenant,
      // so the argument IS what gets written every time.
      const existing = (store.get('tenants') as readonly RowOf<'tenants'>[]).find((t) => t.id === tenant.id)
      const subject = existing ?? tenant
      if (subject.lifecycle !== 'invited') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A tenant can only be provisioned while "invited"; "${subject.id}" is "${subject.lifecycle}".`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      const tenantHasUsers = (store.get('users') as readonly RowOf<'users'>[]).some(
        (u) => u.tenantId === tenant.id,
      )
      if (tenantHasUsers) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `Tenant "${tenant.id}" already has at least one user; provisioning only applies to a tenant's first administrator.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (admin.tenantId !== tenant.id) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `The administrator's tenantId ("${admin.tenantId}") must match the tenant being provisioned ("${tenant.id}").`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (admin.role !== 'TENANT_ADMIN') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A tenant's first administrator must be provisioned with role "TENANT_ADMIN", not "${admin.role}".`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (admin.status !== 'invited') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A tenant's first administrator must be provisioned with status "invited", not "${admin.status}".`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // Fix round 2 minor: derive each authority with `truthStoreFor`
      // rather than hardcoding `'platform'` — both collections happen to
      // carry that authority today, but a hardcoded literal would drift
      // silently if either ever moved. `writableThroughRepository` is
      // `create()`'s own pre-`createRow` gate; repeated here because this
      // method reaches `createRow` without going through `create()`.
      const tenantAuthority = truthStoreFor('tenants')
      if (!writableThroughRepository(tenantAuthority)) return truthStoreRefusal('tenants', tenantAuthority)
      const adminAuthority = truthStoreFor('users')
      if (!writableThroughRepository(adminAuthority)) return truthStoreRefusal('users', adminAuthority)

      let tenantRow: RowOf<'tenants'>
      if (existing) {
        tenantRow = existing
      } else {
        const tenantResult = await createRow('tenants', tenant, ctx, tenantAuthority)
        if (!tenantResult.ok) return tenantResult
        tenantRow = tenantResult.row
      }

      const adminResult = await createRow('users', admin, ctx, adminAuthority)
      if (!adminResult.ok) {
        return { ok: false, kind: 'partial', tenant: tenantRow, adminFailure: adminResult }
      }
      return { ok: true, tenant: tenantRow, admin: adminResult.row }
    },

    /**
     * Fix round 1 (unit-01, Task 7 review, IMPORTANT 6) — see the
     * `Repository` interface's own comment. Every guard checkable from the
     * ARGUMENTS ALONE runs BEFORE the first write, so none of them can ever
     * leave an orphan `users` row behind: role must not be
     * `ROOT_SUPER_ADMIN` (`WF-ROLE-037`, the second-root refusal, reachable
     * here exactly as it is from the screen's own form), the row must be
     * platform-scoped (`tenantId: null` — this door never creates a
     * tenant-scoped account), and it must be freshly `invited`. Only a
     * genuine persistence-capability failure on the SECOND write can reach
     * the `partial` arm — `FB-SA-03` ("an audit-write failure ... refuses
     * the action entirely") is about exactly that failure class, not an
     * input-validation failure, so scoping `partial` to it alone (never to
     * a guard failure) is what "refuses the action entirely" means here.
     *
     * The grantor is resolved from the live `store`, keyed on
     * `ctx.actorOfRecord` (fix round 1, unit-01 Task 7 review, IMPORTANT
     * 4) — never taken as a caller-supplied id and never defaulted to a
     * hardcoded account or an unattributed placeholder. A caller whose
     * identity cannot be matched to a live, platform-scoped account is
     * refused outright: an audited security record naming an invented
     * grantor is worse than one that never committed.
     */
    async inviteConsoleUser(user, ctx) {
      const decision = evaluateAccess(INVITE_CONSOLE_USER_REQUEST, ctx)
      if (!permitsAction(decision)) {
        return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
      }

      if (user.tenantId !== null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'A console user must be platform-scoped (tenantId: null); this door never creates a tenant-scoped account.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      /**
       * Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 2) — `tenantId
       * === null` alone does not make a role a CONSOLE role: a `WORKER` or
       * `READONLY_AUDITOR` (both tenant-domain roles) with `tenantId: null`
       * clears every guard above and would still be a tenant-role account
       * with no tenant, not a console user — reachable only by calling this
       * door directly with an argument today's radio group never offers,
       * which is exactly why the guard belongs at the door rather than on
       * the form. Measured before this fix: `TENANT_ADMIN`, `WORKER`, and
       * `READONLY_AUDITOR`, each with `tenantId: null`, cleared every other
       * guard and reached the write. This module's own header comment
       * calls `inviteConsoleUser` "the one door for inviting a console
       * user" and says the implementation "never creates a tenant-scoped
       * account" — narrower than what the guards actually enforced until
       * this line existed.
       */
      if (roleById(user.role).domain !== 'PLATFORM') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A console user must hold one of the four platform-domain roles; "${roleById(user.role).name}" is a tenant-domain role.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (user.role === 'ROOT_SUPER_ADMIN') {
        const refusalDecision = evaluateAccess(
          {
            action: 'create-second-root-account',
            allowedRoles: [],
            safetyControl:
              'Exactly one Root Super Admin account exists on this platform. It is created only by the backend at platform commissioning, and no console path — including this invitation — can create a second.',
            sourceRefs: ['§8.8.1', 'AC-SA-08-01', 'WF-ROLE-037'],
          },
          ctx,
        )
        return {
          ok: false,
          kind: 'denied',
          decision: refusalDecision,
          reason: refusalDecision.reasonCode,
          explain: refusalDecision.explanation,
        }
      }
      if (user.status !== 'invited') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A console user must be invited with status "invited", not "${user.status}".`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 4) — matched on
      // `u.id`, not `u.displayName`: `ctx.actorOfRecord` is now the
      // signed-in account's real `users` id (`ProductSession.identityId`,
      // threaded through `useAccessContext`), not its display name.
      const grantor = (store.get('users') as readonly RowOf<'users'>[]).find(
        (u) => u.tenantId === null && u.id === ctx.actorOfRecord,
      )
      if (!grantor) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'The inviting identity could not be matched to a live console account, so the role grant cannot be honestly attributed. Nothing was created.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const usersAuthority = truthStoreFor('users')
      if (!writableThroughRepository(usersAuthority)) return truthStoreRefusal('users', usersAuthority)
      const grantsAuthority = truthStoreFor('role-grants')
      if (!writableThroughRepository(grantsAuthority)) return truthStoreRefusal('role-grants', grantsAuthority)

      const userResult = await createRow('users', user, ctx, usersAuthority)
      if (!userResult.ok) return userResult

      const nowIso = new Date(store.clock.now()).toISOString()
      const grantRow: RowOf<'role-grants'> = {
        id: `RG-INVITE-${store.nextSequence()}`,
        userId: userResult.row.id,
        role: userResult.row.role,
        siteIds: [],
        areaIds: [],
        shiftIds: [],
        grantedBy: grantor.id,
        grantedAt: nowIso,
        expiresAt: null,
        revokedAt: null,
        purpose: null,
      }
      const grantResult = await createRow('role-grants', grantRow, ctx, grantsAuthority)
      if (!grantResult.ok) {
        return { ok: false, kind: 'partial', user: userResult.row, grantFailure: grantResult }
      }
      return { ok: true, user: userResult.row, grant: grantResult.row }
    },

    /**
     * Task 3 (unit-02) — see the `Repository` interface's own comment.
     * `evaluateAccess` runs FIRST, before any row is read (Task 1's own
     * round-1 review finding: a door that reads or returns data before
     * checking authorisation is a security bug even on a refusal path).
     * Every guard checkable from the arguments and `ctx` alone follows, in
     * the same "argument, never a later-discarded one" discipline
     * `inviteConsoleUser`'s own comment states; only the grantor lookup
     * touches the live store, and only after every other guard has already
     * passed.
     */
    async createTenantUser(user, ctx) {
      const decision = evaluateAccess(CREATE_TENANT_USER_REQUEST, ctx)
      if (!permitsAction(decision)) {
        return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
      }

      const actorTenant = ctx.identity.tenant
      const actorRole = ctx.identity.role
      if (actorTenant === null || actorRole === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A tenant user can only be created by an actor with a live tenant and role.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // The single most important guard on this door: `user.tenantId` is
      // never trusted as a caller-supplied override target, it is VERIFIED
      // against the acting session's own tenant and refused on any
      // mismatch — the same class of guard `resolveTenantId`'s own fix
      // protects, applied here to a row that does not exist yet. A caller
      // cannot create a user into a tenant other than the one they are
      // actually signed into, no matter what `user.tenantId` claims.
      if (user.tenantId !== actorTenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            `A tenant user must be created inside the acting session's own tenant ("${actorTenant}"); ` +
              `"${user.tenantId ?? 'null'}" was supplied instead. The acting session's tenant is used, never a caller-supplied one.`,
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // The other half of "never mint a platform account": tenant-domain
      // only, and closed to the four roles `TENANT_USER_ROLES` names —
      // never `ROOT_SUPER_ADMIN`/`ADMIN`/`PLATFORM_ENGINEER`/`SUPPORT`, and
      // never `READONLY_AUDITOR` either (out of this door's own closed set,
      // see that constant's own comment).
      if (roleById(user.role).domain !== 'TENANT') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A tenant user must hold a tenant-domain role; "${roleById(user.role).name}" is a platform-domain role. This door never mints a platform account.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (!TENANT_USER_ROLES.includes(user.role)) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `This door creates a tenant user holding one of ${TENANT_USER_ROLES.map((r) => roleById(r).name).join(', ')}; "${roleById(user.role).name}" is outside that closed set.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (user.status !== 'invited') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A tenant user must be created with status "invited", not "${user.status}".`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // Segregation of duties: creating a brand-new account already
      // carrying a role IS a grant of that role, so the same rule
      // `assignTenantRole` below enforces applies here too — a role this
      // actor could not GRANT through that door must not be mintable by
      // inventing a new account with it instead. See
      // `TENANT_ROLE_GRANT_MATRIX`'s own comment for the citations.
      // Reported as a plain `denied` refusal, not the `segregation-of-duties`
      // typed arm — that arm belongs to `AssignTenantRoleResult` alone
      // (Task 4 depends on its exact shape); `CreateTenantUserResult`
      // carries no such arm, per this task's brief.
      if (!rolesGrantableBy(actorRole).includes(user.role)) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'SEGREGATION_OF_DUTIES',
            `${roleById(actorRole).name} may not create a tenant user holding the ${roleById(user.role).name} role. Only a Tenant Admin may (per the tenant role-to-module matrix and the account-lifecycle authority table).`,
            { stage: 'SEGREGATION_OF_DUTIES', sourceRefs: ['L22015', 'MTX-TEN-02a', 'L18976', 'TRN-ACC-04'] },
          ),
        )
      }

      const grantor = (store.get('users') as readonly RowOf<'users'>[]).find(
        (u) => u.tenantId === actorTenant && u.id === ctx.actorOfRecord,
      )
      if (!grantor) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'The creating identity could not be matched to a live account in this tenant, so the account cannot be honestly attributed. Nothing was created.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const usersAuthority = truthStoreFor('users')
      if (!writableThroughRepository(usersAuthority)) return truthStoreRefusal('users', usersAuthority)
      const grantsAuthority = truthStoreFor('role-grants')
      if (!writableThroughRepository(grantsAuthority)) return truthStoreRefusal('role-grants', grantsAuthority)

      const userResult = await createRow('users', user, ctx, usersAuthority)
      if (!userResult.ok) return userResult

      const nowIso = new Date(store.clock.now()).toISOString()
      const grantRow: RowOf<'role-grants'> = {
        id: `RG-CREATE-${store.nextSequence()}`,
        userId: userResult.row.id,
        role: userResult.row.role,
        siteIds: [],
        areaIds: [],
        shiftIds: [],
        grantedBy: grantor.id,
        grantedAt: nowIso,
        expiresAt: null,
        revokedAt: null,
        purpose: null,
      }
      const grantResult = await createRow('role-grants', grantRow, ctx, grantsAuthority)
      if (!grantResult.ok) {
        return { ok: false, kind: 'partial', user: userResult.row, grantFailure: grantResult }
      }
      return { ok: true, user: userResult.row, grant: grantResult.row }
    },

    /**
     * Task 3 (unit-02) — see the `Repository` interface's own comment and
     * `TENANT_ROLE_GRANT_MATRIX`'s own comment for Step 2's research and its
     * citations.
     *
     * ORDER, and why: `evaluateAccess` is the LITERAL FIRST statement, same
     * as `createTenantUser` above and every other door in this file (fix:
     * an earlier draft ran the authority/writability gate before it — no
     * row was ever read there, so it was not the same class of bug Task 1's
     * round-1 review caught, but it was still inconsistent with the shape
     * this task is held to; the gate is now deferred to immediately before
     * the write it actually gates, matching where `createTenantUser` runs
     * its own `usersAuthority`/`grantsAuthority` checks). THEN the
     * segregation-of-duties check — computed HERE, per call, from
     * `ctx.identity.role` (the ACTING identity's own role, read fresh from
     * the context this call was made with, never baked into the static
     * `ASSIGN_TENANT_ROLE_REQUEST` constant above, which only decides who
     * may ATTEMPT this door at all). Expressing "which role THIS caller may
     * grant" as a static `allowedRoles` list would mean either refusing
     * every non-Tenant-Admin caller at the generic role floor (losing the
     * richer, business-specific `segregation-of-duties` result arm this
     * method's own return type carries) or leaving the check to run only
     * inside a UI `SelectField`'s own options list — exactly the bypass
     * this task's brief warns against: calling this method directly, naming
     * a role the `SelectField` never offered, must still be refused HERE,
     * by the door, not by the form. The target row is read only AFTER both
     * checks pass, and its own tenant is compared before any write — the
     * same "read nothing before authorising" discipline
     * `archiveLocationTierEntity`'s own fix-round-1 finding established.
     */
    async assignTenantRole(userId, role, ctx) {
      const decision = evaluateAccess(ASSIGN_TENANT_ROLE_REQUEST, ctx)
      if (!permitsAction(decision)) {
        return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
      }

      const actorRole = ctx.identity.role
      if (actorRole === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'ROLE_NOT_GRANTED',
            'No role is attached to the acting identity, so a role grant cannot be attributed. Nothing was written.',
            { stage: 'BASE_ROLE', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (!rolesGrantableBy(actorRole).includes(role)) {
        return { ok: false, kind: 'segregation-of-duties', grantorRole: actorRole, requestedRole: role }
      }

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A tenant role can only be granted by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const targetUser = (store.get('users') as readonly RowOf<'users'>[]).find((u) => u.id === userId)
      if (targetUser === undefined) return notFoundRefusal('users', userId, 'assign a role to')

      // The cross-tenant refusal (this task's own live-verify risk-3
      // evidence, alongside the segregation-of-duties denial above): a
      // role-grant targeting a user id from a DIFFERENT tenant is refused
      // without naming that user's real tenant, matching
      // `archiveLocationTierEntity`'s own cross-tenant message shape.
      if (targetUser.tenantId !== actorTenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'This user does not belong to your tenant; a role cannot be assigned to them from here.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'] },
          ),
        )
      }

      const activeGrants = (store.get('role-grants') as readonly RowOf<'role-grants'>[]).filter(
        (g) => g.userId === targetUser.id && g.revokedAt === null,
      )
      if (activeGrants.some((g) => g.role === role)) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `${targetUser.displayName} already holds the ${roleById(role).name} role; nothing was written.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const grantor = (store.get('users') as readonly RowOf<'users'>[]).find(
        (u) => u.tenantId === actorTenant && u.id === ctx.actorOfRecord,
      )
      if (!grantor) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'The granting identity could not be matched to a live account in this tenant, so the grant cannot be honestly attributed. Nothing was written.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const authority = truthStoreFor('role-grants')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('role-grants', authority)

      const nowIso = new Date(store.clock.now()).toISOString()
      const grantRow: RowOf<'role-grants'> = {
        id: `RG-ASSIGN-${store.nextSequence()}`,
        userId: targetUser.id,
        role,
        siteIds: [],
        areaIds: [],
        shiftIds: [],
        grantedBy: grantor.id,
        grantedAt: nowIso,
        expiresAt: null,
        revokedAt: null,
        purpose: null,
      }
      return createRow('role-grants', grantRow, ctx, authority)
    },

    /**
     * Fix round 3 (unit-01, Task 7 re-review, IMPORTANT 2) — read
     * `provisionTenant`'s and `inviteConsoleUser`'s own comments in full
     * before writing this; both record the three ways a door in this
     * build has gone wrong (wider than what it replaced; a guard reading a
     * caller argument a later branch discards; a comment claiming a
     * narrowness the code does not enforce). Measured against all three:
     * every guard below reads `before` (the row already on file) or the
     * live `users`/`store` state, never a caller-supplied claim about
     * either — there is no argument for a later branch to discard, because
     * there is no branch that reuses an existing row the way
     * `provisionTenant`'s idempotent retry does. `allowedRoles` here is
     * `decisionApproverRoles(before.changeClass)` — `['ROOT_SUPER_ADMIN']`
     * for critical, `['ROOT_SUPER_ADMIN','ADMIN']` for engineering — which
     * is a SUBSET of `PLATFORM_WRITERS`, so this is narrower than the
     * generic floor it replaces, not wider, matching what this comment
     * claims and no more.
     *
     * Deliberately the SMALLER of the two doors this unit has: no compound
     * write. This runs the exact `evaluateAccess` request the screen's own
     * `decisionGate` used to build at render time — role, object state,
     * segregation of duties, approver availability — derived here from the
     * LIVE `store`, then delegates the actual mutation to the existing
     * `update()` below rather than a second, parallel commit path.
     * `update()` re-authorises through the generic `PLATFORM_WRITERS`
     * floor on every call; that floor is always a superset of this gate's
     * own `allowedRoles` for both classes, so the second check can only
     * ever re-confirm what this gate already decided, never add a second
     * obstacle or a second bypass.
     *
     * The approver id is resolved from the live `store`, keyed on
     * `ctx.actorOfRecord` — never taken as a caller-supplied id — matching
     * `inviteConsoleUser`'s own grantor resolution: a caller whose identity
     * cannot be matched to a live, platform-scoped account is refused
     * outright, never defaulted.
     */
    async decideApprovalRequest(id, decision, reason, ctx) {
      const authority = truthStoreFor('approval-requests')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('approval-requests', authority)

      const rows = store.get('approval-requests') as readonly RowOf<'approval-requests'>[]
      const before = rows.find((r) => r.id === id)
      if (before === undefined) return notFoundRefusal('approval-requests', id, 'update')

      const users = store.get('users') as readonly RowOf<'users'>[]
      const approverAvailable = users.some(
        (u) => decisionApproverRoles(before.changeClass).includes(u.role) && u.status === 'active',
      )

      const gateDecision = evaluateAccess(
        {
          action: 'decide-approval-request',
          allowedRoles: decisionApproverRoles(before.changeClass),
          objectState: before.state,
          allowedObjectStates: ['pending'],
          requiresApproverAvailable: true,
          approverAvailable,
          // §8.8.3 / L55989: root approving its own critical-class proposal
          // is a documented permitted case (the root is the sole
          // critical-class approver; the source assigns no second
          // approver) — segregation of duties is checked for the
          // engineering class only, matching `ConsoleUsersScreen.tsx`'s own
          // (now render-only) `decisionGate`.
          ...(before.changeClass === 'engineering' ? { makerCheckerOf: before.proposerId } : {}),
          sourceRefs:
            before.changeClass === 'engineering'
              ? ['§8.8.3', 'AC-SA-08-04', 'AC-SA-08-05', 'AC-SA-08-06', 'UC-HO-02', 'WF-ROLE-015', 'WF-ROLE-016']
              : ['§8.8.3', 'AC-SA-08-04', 'AC-SA-08-06', 'WF-ROLE-019', 'WF-ROLE-020'],
        },
        ctx,
      )
      if (!permitsAction(gateDecision)) return refusal(gateDecision)

      if (decision === 'return' && (reason === null || reason.trim() === '')) {
        return refusal(
          deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', 'Returning a request requires a reason.', {
            stage: 'COMMAND_VALIDATION',
            sourceRefs: ['repository.ts'],
          }),
        )
      }

      const approver = users.find((u) => u.tenantId === null && u.id === ctx.actorOfRecord)
      if (!approver) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'This decision could not be attributed to a known console account, so nothing was written.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const nowIso = new Date(store.clock.now()).toISOString()
      const patch =
        decision === 'approve'
          ? { state: 'applied' as const, approverId: approver.id, decidedAt: nowIso }
          : { state: 'returned' as const, approverId: approver.id, decidedAt: nowIso, returnReason: reason!.trim() }

      return repository.update('approval-requests', id, patch, ctx)
    },

    /**
     * Task 7 (closure sweep) — see the `Repository` interface's own comment
     * and `OPEN_SUPPORT_SESSION_REQUEST`'s own comment. `evaluateAccess` runs
     * FIRST, before any row is read or written, matching every other door in
     * this file. Deliberately calls `createRow` directly rather than
     * `repository.create('access-sessions', …)` — the generic door's own
     * floor (`defaultWriteRoles('platform')` = `PLATFORM_WRITERS` = Root,
     * Admin, Platform Engineer) is exactly backwards from this door's own
     * role list (Support belongs, Platform Engineer does not), so routing
     * through it would refuse Support and admit the one role this door's own
     * research excludes.
     */
    async openSupportSession(tenantId, purpose, ctx) {
      const authority = truthStoreFor('access-sessions')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('access-sessions', authority)

      const decision = evaluateAccess(
        { ...OPEN_SUPPORT_SESSION_REQUEST, resourceTenant: brandTenantId(tenantId) },
        ctx,
      )
      if (!permitsAction(decision)) return refusal(decision)

      // AC-SA-15-02, L45832: a session cannot open without a ticket-linked
      // reason — `purpose` is this door's own free-text stand-in for that
      // reason class plus ticket reference, exactly as `SupportAccessScreen
      // .tsx`'s own form already requires both non-empty before its "Open a
      // support session" control activates.
      if (purpose.trim() === '') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'A support session cannot open without a ticket-linked reason (AC-SA-15-02, L45832).',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      if (ctx.actorOfRecord === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'This session could not be attributed to a known console account, so nothing was opened.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // Fix round 2 (coordinator review, Important 4 still open) — the
      // ONE-SESSION-PER-IDENTITY guard belongs HERE, at the door every
      // caller actually routes through, not only in `session.ts
      // #resolveOpenSupportSession`'s client-side pre-check. That check
      // reads `ProductSession.accessSessionId`, which is React state:
      // `sessionFor` (`session.ts`) never repopulates it from this
      // collection on a fresh sign-in, and `signOut` never closes the row
      // either — so open, sign out, sign back in left `accessSessionId`
      // `null` while the old row was still `closedAt: null` underneath,
      // and a second session opened freely, orphaning the first exactly as
      // before the first fix round. Read directly against the collection
      // instead, keyed on the real, durable fact (`platformUserId` +
      // `closedAt`), so the guard holds no matter what the client
      // remembers. Not `expiresAt`-aware, deliberately: nothing in this
      // build ever sets `closedAt` on expiry alone (no automatic
      // close-on-expiry job exists), and the console's own "Close this
      // session" control already closes a session regardless of expiry —
      // that remains the one real way out of an expired-but-unclosed row,
      // exactly as it does today.
      const actorId = ctx.actorOfRecord
      const alreadyOpen = repository
        .list('access-sessions', ctx)
        .where((r) => r.platformUserId === actorId && r.closedAt === null)
        .first()
      if (alreadyOpen) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `This account already holds an open support session ("${alreadyOpen.id}"). Close it — the console's ` +
              'own "Close this session" control — before opening another; a session is never handed over or ' +
              'silently replaced inside its own lifetime (L16099).',
            { stage: 'OBJECT_STATE', sourceRefs: ['L16099', 'repository.ts'] },
          ),
        )
      }

      // Two-hour default time box (`SUPPORT_TIME_BOX`, `SupportAccessScreen
      // .tsx#fixtures.ts`; frozen source L16099: "each support session is
      // time-boxed, default two hours, configurable in platform settings").
      // `DEC-SUPEXT-001` (L16125 area) leaves extension undecided and this
      // build takes no position on it here either — the box is fixed at
      // open time and this door offers no extension path.
      const nowMs = store.clock.now()
      const row: RowOf<'access-sessions'> = {
        id: `AS-SUPPORT-${store.nextSequence()}`,
        kind: 'support',
        platformUserId: ctx.actorOfRecord,
        tenantId,
        purpose: purpose.trim(),
        approvedBy: null,
        openedAt: new Date(nowMs).toISOString(),
        expiresAt: new Date(nowMs + 2 * 60 * 60 * 1000).toISOString(),
        closedAt: null,
        readOnly: true,
      }
      return createRow('access-sessions', row, ctx, authority)
    },

    /**
     * Task 7 (closure sweep) — see the `Repository` interface's own comment
     * and `CLOSE_SUPPORT_SESSION_REQUEST`'s own comment. Replicates
     * `update()`'s own merge/parse/commit shape rather than delegating to it,
     * for the same role-floor-mismatch reason `openSupportSession` does not
     * call `repository.create(...)` — see that method's own comment.
     */
    async closeSupportSession(id, ctx) {
      const authority = truthStoreFor('access-sessions')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('access-sessions', authority)

      // Fix round 1 (coordinator review, Critical 1) — `evaluateAccess` runs
      // BEFORE any row is read, matching every sibling door in this file
      // (`archiveLocationTierEntity`, `updateShift`, `archiveShift`,
      // `reassignDevice`). The row lookup used to come first, so an
      // unauthorized caller's `notFoundRefusal` disclosed whether a given
      // `access-sessions` id existed at all — an authorization-order bug,
      // not merely a style one: the row's existence is exactly the kind of
      // fact a refused caller must not learn.
      const decision = evaluateAccess(CLOSE_SUPPORT_SESSION_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const rows = store.get('access-sessions') as readonly RowOf<'access-sessions'>[]
      const before = rows.find((r) => r.id === id)
      if (before === undefined) return notFoundRefusal('access-sessions', id, 'close')

      // L45794: Root and Admin may end any in-progress session; Support may
      // end only its own ("Allowed with conditions — own sessions").
      if (ctx.identity.role === 'SUPPORT' && before.platformUserId !== ctx.actorOfRecord) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'Support may close only the sessions it opened itself (L45794, "Allowed with conditions — own sessions"). This session belongs to a different operator.',
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['L45794', 'repository.ts'] },
          ),
        )
      }

      if (before.closedAt !== null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            'This session is already closed.',
            { stage: 'OBJECT_STATE', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const actionClass = actionClassFor('access-sessions', authority)
      if (!permittedUnder(capability.state, actionClass)) {
        return persistenceRefusal(actionClass, capability, `Closing "access-sessions:${id}" is not permitted right now.`)
      }

      const merged = { ...before, closedAt: new Date(store.clock.now()).toISOString() }
      const parsed = COLLECTIONS['access-sessions'].schema.safeParse(merged)
      if (!parsed.success) {
        return invalidResultRefusal('access-sessions', 'close', parsed.error.issues.map((i) => i.message))
      }

      const idx = rows.findIndex((r) => r.id === id)
      const next = [...rows]
      next[idx] = parsed.data as RowOf<'access-sessions'>
      return commitWrite('access-sessions', 'update', next, parsed.data as RowOf<'access-sessions'>, before, ctx, authority)
    },

    /**
     * Task 8 (unit-01) — see the `Repository` interface's own comment for
     * why this door takes no `ctx`. Every guard below reads `tenantId` (a
     * bare string, the ONLY input) against the live `store`, via the exact
     * same `classifyTenantAdminInvitation` the screen itself previews with
     * — never a caller-supplied row, so there is no argument for a later
     * branch to silently discard the way `provisionTenant`'s pre-fix
     * idempotent retry once did.
     *
     * PROBED AGAINST THE OTHER THREE DOORS' OWN FAILURE MODES (this file's
     * header, `provisionTenant`'s and `inviteConsoleUser`'s comments):
     * (1) wider than what it replaces on some axis — there IS no generic
     * door this could widen: `truthStoreFor('users')` is `'platform'`,
     * whose floor (`PLATFORM_WRITERS`) does not include `TENANT_ADMIN` at
     * all, so an honestly-attributed self-service acceptance could never
     * reach `update('users', …)` no matter what `ctx` a caller built —
     * this door does not loosen an existing capability, it is the only
     * path this exact write could ever take. (2) a guard reading a caller
     * argument a later branch discards — impossible by construction: the
     * only argument is `tenantId`, and both the tenant and the admin row
     * are re-resolved from it fresh, every guard, via
     * `classifyTenantAdminInvitation`; there is no "existing" branch that
     * reuses a different row than the one just checked. (3) a comment
     * claiming a narrowness the code does not enforce — this comment
     * claims exactly three things and no more: the row accepted is always
     * THIS tenant's earliest-created `TENANT_ADMIN` (`classifyTenantAdminInvitation`'s
     * own `.sort`), the only field this write ever changes is that one
     * row's `status`/`lastSignInAt` (the `merged` object below spreads
     * `status.admin` and touches nothing else), and the tenant's OWN
     * `lifecycle` is never written here — `Activate` (`TenantDetailScreen.tsx`)
     * remains the only path from `invited` to `pilot`/`active`, matching
     * that screen's own precondition (`administratorAccepted`) rather than
     * a second, competing mechanism.
     */
    async acceptInvitation(tenantId) {
      const authority = truthStoreFor('users')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('users', authority)

      const tenants = store.get('tenants') as readonly RowOf<'tenants'>[]
      const users = store.get('users') as readonly RowOf<'users'>[]
      const status = classifyTenantAdminInvitation(tenants, users, tenantId, store.clock.now())
      if (status.kind !== 'ok') {
        if (status.kind === 'not-found') return { ok: false, kind: 'not-found' }
        return { ok: false, ...status }
      }

      const actionClass = actionClassFor('users', authority)
      if (!permittedUnder(capability.state, actionClass)) {
        return persistenceRefusal(actionClass, capability, 'Accepting this invitation is not permitted right now.')
      }

      const nowMs = store.clock.now()
      const nowIso = new Date(nowMs).toISOString()
      // §15.1 `TRN-ACC-03`, "Activated on first successful authentication":
      // the ONE real, schema-carried field this simulated acceptance can
      // honestly stamp is `lastSignInAt` — there is no password/credential
      // field on `User` for a storyboard to pretend to store (see the
      // screen's own header for why no credential form is rendered here).
      const merged = { ...status.admin, status: 'active' as const, lastSignInAt: nowIso }
      const parsed = COLLECTIONS.users.schema.safeParse(merged)
      if (!parsed.success) {
        return invalidResultRefusal('users', 'update', parsed.error.issues.map((i) => i.message))
      }

      const idx = users.findIndex((u) => u.id === status.admin.id)
      const next = [...users]
      next[idx] = parsed.data as RowOf<'users'>

      // The invitee's own, honestly-attributed acting identity — built
      // HERE, from the row this door just resolved and validated, never
      // taken as a caller-supplied claim (matching `inviteConsoleUser`'s
      // grantor resolution and `decideApprovalRequest`'s approver
      // resolution: an actor is only ever attributed from a live, matched
      // account). `rootActingContext` (`session.ts`) is the same shape for
      // the same reason, one layer up, for the root's own step-up
      // completion — this is that pattern's tenant-domain sibling.
      const writeCtx: AccessContext = {
        state: scenarioStateFor(store),
        identity: {
          signedIn: true,
          role: 'TENANT_ADMIN',
          tenant: brandTenantId(status.tenant.id),
          siteScope: [],
          areaScope: [],
          qualifications: [],
          deviceId: null,
          stepUpActive: false,
          accessSessionId: null,
        },
        online: true,
        deviceTrusted: true,
        actorOfRecord: status.admin.id,
      }

      const result = await commitWrite(
        'users',
        'update',
        next,
        parsed.data as RowOf<'users'>,
        status.admin,
        writeCtx,
        authority,
      )
      if (!result.ok) return result
      return { ok: true, user: result.row }
    },

    /**
     * CORRECTIVE TASK (unit-02, task-corrective-01) — see the `Repository`
     * interface's own comment and `CREATE_SITE_REQUEST`'s own comment.
     * Unlike `createAreaUnderSite`/`createLocationUnderArea`, a Site has no
     * PARENT reference to re-derive a tenant fact from (`checkSiteReference`
     * has nothing to check a Site's own `siteId` against — a Site IS the
     * top of the hierarchy) — so `resourceTenant` is added to the
     * `AccessRequest` directly, from the row's own `tenantId`, the one
     * fact this door actually has to check. This is exactly what
     * `authorizeWrite`'s own dynamic `AccessRequest` construction would
     * have supplied (`repository.ts`, `authorizeWrite`, `resourceTenant:
     * brandTenantId(rowTenant)`) had this gone through the generic door;
     * declaring it here, once, keeps the tenant-isolation stage real for
     * this door too, without re-deriving it through `resolveTenantId`
     * (which `checkSiteReference`-style helpers exist to avoid
     * duplicating — see `CREATE_AREA_UNDER_SITE_REQUEST`'s own comment).
     */
    async createSite(site, ctx) {
      const authority = truthStoreFor('sites')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('sites', authority)

      const decision = evaluateAccess({ ...CREATE_SITE_REQUEST, resourceTenant: brandTenantId(site.tenantId) }, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      return createRow('sites', site, ctx, authority)
    },

    /**
     * Task 1 (unit-02) — see the `Repository` interface's own comment.
     * `authorizeWrite` runs exactly as it does for `create('areas', ...)`
     * (same floor, same tenant-isolation stage); the ONE thing this door
     * adds is `checkSiteReference`, which the generic door never runs at
     * all — a `siteId` naming an archived or foreign-tenant Site would
     * otherwise pass straight through to `createRow` and commit.
     */
    async createAreaUnderSite(area, ctx) {
      const authority = truthStoreFor('areas')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('areas', authority)

      // Fix round 2 (task-1 review, new finding) — `requiredSites` restored.
      // `CREATE_AREA_UNDER_SITE_REQUEST` itself is static (it has no row to
      // read at declaration time), so the ONE thing `authorizeWrite`'s own
      // dynamic `AccessRequest` construction did that a static constant
      // cannot is added back HERE, on the call, exactly the condition
      // `authorizeWrite` used: only when the acting identity actually
      // carries a site scope, and scoped to the specific Site this new
      // Area would sit under. An identity with no site scope at all (every
      // seeded Tenant Admin today) is unaffected — `evaluateAccess`'s SCOPE
      // stage (`src/policy/evaluate.ts`) only runs this check when
      // `requiredSites` is both present AND non-empty.
      const decision = evaluateAccess(
        { ...CREATE_AREA_UNDER_SITE_REQUEST, ...(ctx.identity.siteScope.length > 0 ? { requiredSites: [area.siteId] } : {}) },
        ctx,
      )
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'An Area can only be created by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      const problem = checkSiteReference(store, actorTenant, area.siteId)
      if (problem !== null) {
        return refusal(
          deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', scopeReferenceMessage(problem), {
            stage: 'COMMAND_VALIDATION',
            sourceRefs: ['repository.ts', 'WF-DOH-02-CASCADE'],
          }),
        )
      }

      return createRow('areas', area, ctx, authority)
    },

    /** Task 1 (unit-02) — `createAreaUnderSite`'s own sibling for Location under Area. Same shape. */
    async createLocationUnderArea(location, ctx) {
      const authority = truthStoreFor('locations')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('locations', authority)

      // Fix round 2 (task-1 review, new finding) — `requiredAreas`
      // restored, same reasoning as `createAreaUnderSite` above:
      // `authorizeWrite`'s own dynamic `AccessRequest` construction
      // included `requiredAreas: [areaId]` whenever `ctx.identity.areaScope`
      // was non-empty, and the static `CREATE_LOCATION_UNDER_AREA_REQUEST`
      // constant cannot carry that (it has no row to read at declaration
      // time) — added back here, on the call, scoped to the specific Area
      // this new Location would sit under.
      const decision = evaluateAccess(
        {
          ...CREATE_LOCATION_UNDER_AREA_REQUEST,
          ...(ctx.identity.areaScope.length > 0 ? { requiredAreas: [location.areaId] } : {}),
        },
        ctx,
      )
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A Location can only be created by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      const problem = checkAreaReference(store, actorTenant, location.areaId)
      if (problem !== null) {
        return refusal(
          deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', scopeReferenceMessage(problem), {
            stage: 'COMMAND_VALIDATION',
            sourceRefs: ['repository.ts', 'WF-DOH-02-CASCADE'],
          }),
        )
      }

      return createRow('locations', location, ctx, authority)
    },

    /**
     * Task 1 (unit-02) — `WF-DOH-02-CASCADE`. See the `Repository`
     * interface's own comment for why this refuses-and-names rather than
     * cascading. The active-children sweep for a Site looks TWO tiers
     * down, not one: an archived Area can still hold an active Location
     * beneath it (a pre-existing inconsistency this door did not create),
     * and archiving the Site above it must not silently widen that hole —
     * "must not silently orphan active Areas/Locations beneath it" (design
     * spec, Step 3) names both nouns for exactly this reason. Archiving an
     * Area itself looks one tier down, at its own Locations. Archiving a
     * Location looks nowhere — nothing sits beneath it in this hierarchy —
     * so that branch always proceeds straight to the write once the row
     * itself is found.
     *
     * The write itself, once the check passes, is `repository.update(...)`
     * — the same generic door, same `authorizeWrite` floor — never a
     * second, parallel commit path. `decideApprovalRequest` above already
     * establishes this shape: a named door adds exactly the ONE rule the
     * generic door doesn't run, then delegates the mechanical write back
     * to it.
     *
     * Fix round 1 (task-1 review, Critical 1) — the pre-fix version read
     * the target row AND both of its child collections, and returned real
     * Area/Location NAMES on the `has-active-children` refusal path,
     * before any authorisation check ran at all: that refusal path never
     * reaches `update()`, so `update()`'s own internal `authorizeWrite`
     * call — the only check the pre-fix version had — never fired for it.
     * Measured: any signed-in actor, any tenant, any role, could call
     * `archiveLocationTierEntity('sites', '<another tenant's real site
     * id>', ctx)` and receive that tenant's real child names back.
     * `ARCHIVE_LOCATION_TIER_ENTITY_REQUEST` (role floor) now runs FIRST,
     * before any `store.get` call, and the row's OWN tenant is resolved
     * and compared to `ctx.identity.tenant` EXPLICITLY, right after
     * finding it and before either child collection is ever read — not
     * left to be caught only incidentally by `update()`'s own check on
     * the success path, which is exactly the gap that let this through.
     */
    async archiveLocationTierEntity(collection, id, ctx) {
      const authority = truthStoreFor(collection)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(collection, authority)

      const decision = evaluateAccess(ARCHIVE_LOCATION_TIER_ENTITY_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const rows = store.get(collection) as readonly Record<string, unknown>[]
      const row = rows.find((r) => rowId(r) === id)
      if (row === undefined) return notFoundRefusal(collection, id, 'archive')

      const resolution = resolveTenantId(collection, row, store)
      if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') {
        return refusal(tenantIsolationDenial(collection, resolution))
      }
      const rowTenant = resolution.kind === 'resolved' ? resolution.tenant : null
      if (rowTenant === null || rowTenant !== ctx.identity.tenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            `This "${collection}" row does not belong to your tenant; it cannot be archived from here.`,
            { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'] },
          ),
        )
      }

      const children: { readonly collection: string; readonly id: string; readonly name: string }[] = []
      if (collection === 'sites') {
        const areas = store.get('areas') as readonly RowOf<'areas'>[]
        const areasUnderSite = areas.filter((a) => a.siteId === id)
        for (const a of areasUnderSite) {
          if (a.status === 'active') children.push({ collection: 'areas', id: a.id, name: a.name })
        }
        const areaIdsUnderSite = new Set(areasUnderSite.map((a) => a.id))
        const locations = store.get('locations') as readonly RowOf<'locations'>[]
        for (const l of locations) {
          if (areaIdsUnderSite.has(l.areaId) && l.status === 'active') {
            children.push({ collection: 'locations', id: l.id, name: l.name })
          }
        }
      } else if (collection === 'areas') {
        const locations = store.get('locations') as readonly RowOf<'locations'>[]
        for (const l of locations) {
          if (l.areaId === id && l.status === 'active') children.push({ collection: 'locations', id: l.id, name: l.name })
        }
      }

      if (children.length > 0) {
        return { ok: false, kind: 'has-active-children', children }
      }

      return repository.update(collection, id, { status: 'archived' } as Partial<RowOf<typeof collection>>, ctx)
    },

    /**
     * Task 2 (unit-02) — see the `Repository` interface's own comment and
     * `CREATE_SHIFT_REQUEST`'s own comment for the authorisation shape.
     * Order: role/scope floor first (before any row is read), THEN
     * `checkSiteReference` (an invalid `siteId` makes the overlap question
     * unanswerable), THEN the overlap check, THEN the mechanical write —
     * the same "authorise before touching any row" discipline
     * `archiveLocationTierEntity`'s own fix-round-1 finding established.
     */
    async createShift(shift, ctx) {
      const authority = truthStoreFor('shifts')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('shifts', authority)

      const decision = evaluateAccess(
        { ...CREATE_SHIFT_REQUEST, ...(ctx.identity.siteScope.length > 0 ? { requiredSites: [shift.siteId] } : {}) },
        ctx,
      )
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A Shift can only be created by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      const problem = checkSiteReference(store, actorTenant, shift.siteId)
      if (problem !== null) return { ok: false, kind: 'invalid-reference', problem }

      const conflict = shiftOverlapConflict(store, shift.siteId, shift.startTime, shift.endTime, null)
      if (conflict !== null) return { ok: false, kind: 'overlap', conflictingShift: conflict }

      return createRow('shifts', shift, ctx, authority)
    },

    /**
     * Task 2 (unit-02) — `createShift`'s own sibling for an edit. Both
     * checks read the row as it would exist AFTER the patch merges onto
     * `before` (`merged` below) — a `siteId`/`startTime`/`endTime` field a
     * caller leaves out of `patch` is read from the EXISTING row, exactly
     * like the generic `update()`'s own `{ ...before, ...patch }` merge —
     * so an edit that only moves the times still gets checked against its
     * (unchanged) Site, and an edit that only moves the Site still gets
     * checked against its (unchanged) times.
     *
     * FINAL WHOLE-UNIT REVIEW (unit-02, Important 2) — THE ORDER OF THE
     * FIRST TWO STATEMENTS, and why it changed. This door used to read the
     * target row and return `notFoundRefusal(...)` BEFORE `evaluateAccess`
     * ran at all, which made it the one door in this unit that did not
     * authorise first — and handed any caller, a role-less one included, a
     * store-wide "does this shift id exist" oracle ahead of every check.
     * The leak was bounded (the refusal only echoes the caller's own id
     * back, and a present-but-foreign row was still caught below by the
     * role floor and `checkSiteReference`), but it broke the invariant
     * `archiveLocationTierEntity` was restructured to hold after a real
     * cross-tenant leak was measured on that door.
     *
     * The gate is therefore SPLIT, because the scope half genuinely needs
     * a row read and the role half does not:
     *
     *   1. the ROLE-ONLY floor, with NO `requiredSites`, as the literal
     *      first action after the writability gate — the same shape
     *      `createTenantUser`/`assignTenantRole` use for a gate that must
     *      run before any row exists to read;
     *   2. then the row is found and merged, and
     *   3. the SCOPE half re-asks the SAME request with `requiredSites:
     *      [merged.siteId]`, only when the identity actually carries a site
     *      scope — the row-dependent scope check `CREATE_SHIFT_REQUEST`'s
     *      own comment settles must live at the call site and never be
     *      baked into the static constant.
     *
     * `createShift` needs no split: a create door reads its `siteId` off
     * the INPUT, so its one call can carry `requiredSites` already.
     */
    async updateShift(id, patch, ctx) {
      const authority = truthStoreFor('shifts')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('shifts', authority)

      const roleDecision = evaluateAccess(UPDATE_SHIFT_REQUEST, ctx)
      if (!permitsAction(roleDecision)) return refusal(roleDecision)

      const rows = store.get('shifts') as readonly RowOf<'shifts'>[]
      const before = rows.find((r) => r.id === id)
      if (before === undefined) return notFoundRefusal('shifts', id, 'update')

      /**
       * Task 4 (closure sweep) — residual finding 11. Before this, the row's
       * OWN tenant was never checked explicitly here; a foreign row was only
       * caught incidentally, below, by `checkSiteReference` — which works,
       * but echoes the foreign site's id back to a caller who already
       * cleared the role floor. Same `resolveTenantId`/`TENANT_MISMATCH`
       * shape `archiveShift` uses below, same relative position: right
       * after the row is found, before any further scope/reference check or
       * the write. Checked against `before` (the row as stored), not
       * `merged` — this is about whose row it already is, not what the
       * patch proposes.
       */
      const resolution = resolveTenantId('shifts', before, store)
      if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') {
        return refusal(tenantIsolationDenial('shifts', resolution))
      }
      const rowTenant = resolution.kind === 'resolved' ? resolution.tenant : null
      if (rowTenant === null || rowTenant !== ctx.identity.tenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'This Shift does not belong to your tenant; it cannot be updated from here.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'] },
          ),
        )
      }

      const merged = { ...before, ...patch }

      if (ctx.identity.siteScope.length > 0) {
        const scopeDecision = evaluateAccess({ ...UPDATE_SHIFT_REQUEST, requiredSites: [merged.siteId] }, ctx)
        if (!permitsAction(scopeDecision)) return refusal(scopeDecision)
      }

      const problem = checkSiteReference(store, rowTenant, merged.siteId)
      if (problem !== null) return { ok: false, kind: 'invalid-reference', problem }

      const conflict = shiftOverlapConflict(store, merged.siteId, merged.startTime, merged.endTime, id)
      if (conflict !== null) return { ok: false, kind: 'overlap', conflictingShift: conflict }

      return repository.update('shifts', id, patch, ctx)
    },

    /**
     * FINAL WHOLE-UNIT REVIEW (unit-02, Important 1) — see the `Repository`
     * interface's own comment for why this door exists and
     * `ARCHIVE_SHIFT_REQUEST`'s own comment for the `L27293` citation.
     *
     * ORDER IS `archiveLocationTierEntity`'S, VERBATIM: `evaluateAccess` is
     * the literal first action after the writability gate, before any
     * `store.get`; the row's OWN tenant is then resolved and compared to
     * `ctx.identity.tenant` EXPLICITLY, rather than left to be caught
     * incidentally by the generic `update()`'s check on the success path —
     * which is precisely the gap that let a cross-tenant read through on
     * that door before its own fix round. The site-scope half re-asks the
     * SAME request with `requiredSites: [row.siteId]`, at the call site and
     * only for an identity that carries a scope, the split `updateShift`
     * directly above settles for a door whose scope value needs a row read.
     *
     * No cascade sweep, unlike `archiveLocationTierEntity`: nothing nests
     * beneath a Shift. The source's own archive condition — refused while
     * runs are scheduled against it (`L27293`, `NOTIF-DOH-03-3`) — is NOT
     * enforced here, and deliberately: no Run or Job collection exists at
     * this authority to read a scheduled run off. A disclosed gap, the same
     * shape and for the same reason as `reassignDevice`'s own
     * `AC-WF-DVC-002-01`, never a silently invented check.
     */
    async archiveShift(id, ctx) {
      const authority = truthStoreFor('shifts')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('shifts', authority)

      const decision = evaluateAccess(ARCHIVE_SHIFT_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const rows = store.get('shifts') as readonly RowOf<'shifts'>[]
      const row = rows.find((r) => r.id === id)
      if (row === undefined) return notFoundRefusal('shifts', id, 'archive')

      const resolution = resolveTenantId('shifts', row, store)
      if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') {
        return refusal(tenantIsolationDenial('shifts', resolution))
      }
      const rowTenant = resolution.kind === 'resolved' ? resolution.tenant : null
      if (rowTenant === null || rowTenant !== ctx.identity.tenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'This Shift does not belong to your tenant; it cannot be archived from here.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'] },
          ),
        )
      }

      if (ctx.identity.siteScope.length > 0) {
        const scopeDecision = evaluateAccess({ ...ARCHIVE_SHIFT_REQUEST, requiredSites: [row.siteId] }, ctx)
        if (!permitsAction(scopeDecision)) return refusal(scopeDecision)
      }

      return repository.update('shifts', id, { status: 'archived' }, ctx)
    },

    /**
     * Task 4 (unit-02) — see the `Repository` interface's own comment and
     * `CREATE_WORKER_REQUEST`'s own comment for the role-floor citation.
     * `evaluateAccess` runs FIRST, before any row is read — the same
     * discipline `createTenantUser`/`assignTenantRole` establish, and the
     * authority/writability gate is deferred to immediately before the
     * actual write (the shape those two doors settled on after their own
     * fix rounds), never ahead of `evaluateAccess`.
     */
    async createWorker(userId, workerFields, ctx) {
      const decision = evaluateAccess(CREATE_WORKER_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A worker record can only be created by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      // `repository.get` itself applies `withinScope` — a cross-tenant or
      // otherwise out-of-scope User reads as `undefined` here, exactly like
      // a User that does not exist at all. This is deliberate (see this
      // door's own interface comment): a caller probing for a foreign
      // tenant's User id learns nothing beyond "not found."
      const user = repository.get('users', userId, ctx)
      if (user === undefined) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `No visible "users" row with id "${userId}" exists to attach a worker record to.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (user.tenantId !== actorTenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'This user does not belong to your tenant; a worker record cannot be attached to them from here.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'] },
          ),
        )
      }
      if (user.role !== 'WORKER') {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `A worker record can only reference a User holding the Worker role; "${roleById(user.role).name}" does not.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const existingForUser = (store.get('workers') as readonly RowOf<'workers'>[]).find((w) => w.userId === userId)
      if (existingForUser !== undefined) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `User "${userId}" already has a worker record ("${existingForUser.id}"); a second one cannot be created for the same User.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const authority = truthStoreFor('workers')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('workers', authority)

      const workerRow: RowOf<'workers'> = { ...workerFields, userId, tenantId: actorTenant }
      return createRow('workers', workerRow, ctx, authority)
    },

    /**
     * Task 4 (unit-02) — `createWorker`'s own sibling. See the `Repository`
     * interface's own comment for the compound-write shape and
     * `RECORD_QUALIFICATION_REQUEST`'s own comment for the role-floor
     * citation.
     *
     * NO `checkWorkerReference` EXPORT — `qualification.workerId` is
     * validated by a plain two-line lookup here rather than a new function
     * added to `scope-reference.ts`. That module's own header states its
     * job as Site/Area/Location reference checks specifically (existence,
     * tenant match, archived status, wrong-parent); a Worker reference needs
     * only the first two of those (Workers do not nest under a parent the
     * way an Area nests under a Site, and an archived Worker is not refused
     * here — nothing in the source prohibits recording a qualification
     * against a departed worker's historical record). A second, near-empty
     * export for this single caller would be the "unrequested abstraction"
     * this build's own discipline elsewhere warns against, not a reuse.
     */
    async recordQualification(qualification, ctx) {
      const decision = evaluateAccess(RECORD_QUALIFICATION_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A qualification can only be recorded by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      const worker = (store.get('workers') as readonly RowOf<'workers'>[]).find((w) => w.id === qualification.workerId)
      if (worker === undefined) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'OBJECT_STATE_INVALID',
            `No "workers" row with id "${qualification.workerId}" exists to record a qualification against.`,
            { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }
      if (worker.tenantId !== actorTenant) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'This worker does not belong to your tenant; a qualification cannot be recorded against them from here.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'] },
          ),
        )
      }

      for (const areaId of qualification.areaIds) {
        const problem = checkAreaReference(store, actorTenant, areaId)
        if (problem !== null) return { ok: false, kind: 'invalid-reference', problem }
      }

      const qualAuthority = truthStoreFor('qualifications')
      if (!writableThroughRepository(qualAuthority)) return truthStoreRefusal('qualifications', qualAuthority)

      const qualResult = await createRow('qualifications', qualification, ctx, qualAuthority)
      if (!qualResult.ok) return qualResult

      const workersAuthority = truthStoreFor('workers')
      if (!writableThroughRepository(workersAuthority)) {
        return { ok: false, kind: 'partial', qualification: qualResult.row, workerUpdateFailure: truthStoreRefusal('workers', workersAuthority) }
      }
      const workerResult = await repository.update(
        'workers',
        worker.id,
        { qualificationIds: [...worker.qualificationIds, qualResult.row.id] },
        ctx,
      )
      if (!workerResult.ok) {
        return { ok: false, kind: 'partial', qualification: qualResult.row, workerUpdateFailure: workerResult }
      }
      return { ok: true, qualification: qualResult.row, worker: workerResult.row }
    },

    /**
     * Task 5 (unit-02) — see the `Repository` interface's own comment and
     * `ENROLL_DEVICE_REQUEST`'s own comment for the role-floor citation.
     * `evaluateAccess` runs FIRST, before any row is read — the same
     * discipline `createWorker`/`createShift` establish.
     */
    async enrollDevice(device, ctx) {
      const decision = evaluateAccess(ENROLL_DEVICE_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A device can only be enrolled by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      if (device.locationId !== null) {
        const problem = checkLocationReference(store, actorTenant, device.locationId)
        if (problem !== null) return { ok: false, kind: 'invalid-reference', problem }
      }

      const authority = truthStoreFor('devices')
      if (!writableThroughRepository(authority)) return truthStoreRefusal('devices', authority)

      const deviceRow: RowOf<'devices'> = { ...device, tenantId: actorTenant }
      return createRow('devices', deviceRow, ctx, authority)
    },

    /**
     * Task 5 (unit-02) — see the `Repository` interface's own comment and
     * `REASSIGN_DEVICE_REQUEST`'s own comment for the role-floor citation.
     * Takes the target `locationId` directly, checks it (when non-null) with
     * the same `checkLocationReference` `enrollDevice` runs, then delegates
     * the mechanical write to the generic `update()` — which re-derives the
     * device's own tenant from its `tenantId` field (`resolveTenantId`) and
     * refuses a cross-tenant `id` there, the same division of labour
     * `updateShift` already establishes (this door's own role/reference
     * checks; the generic door's own tenant-isolation check).
     */
    async reassignDevice(id, locationId, ctx) {
      const decision = evaluateAccess(REASSIGN_DEVICE_REQUEST, ctx)
      if (!permitsAction(decision)) return refusal(decision)

      const actorTenant = ctx.identity.tenant
      if (actorTenant === null) {
        return refusal(
          deny(
            'explicitlyProhibited',
            'TENANT_MISMATCH',
            'A device can only be reassigned by an actor with a live tenant.',
            { stage: 'TENANT_ISOLATION', sourceRefs: ['repository.ts'] },
          ),
        )
      }

      if (locationId !== null) {
        const problem = checkLocationReference(store, actorTenant, locationId)
        if (problem !== null) return { ok: false, kind: 'invalid-reference', problem }
      }

      return repository.update('devices', id, { locationId }, ctx)
    },

    async update(name, id, patch, ctx) {
      const authority = truthStoreFor(name)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(name, authority)

      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const idx = rows.findIndex((r) => rowId(asRecord(r)) === id)
      if (idx === -1) return notFoundRefusal(name, id, 'update')
      const before = rows[idx]!

      const decision = authorizeWrite(name, authority, 'update', asRecord(before), ctx, store)
      if (!permitsAction(decision)) return refusal(decision) // nothing mutated

      const actionClass = actionClassFor(name, authority)
      if (!permittedUnder(capability.state, actionClass)) {
        return persistenceRefusal(actionClass, capability, `Updating "${name}:${id}" is not permitted right now.`)
      }

      const merged = { ...before, ...patch }
      const parsed = COLLECTIONS[name].schema.safeParse(merged)
      if (!parsed.success) {
        return invalidResultRefusal(name, 'update', parsed.error.issues.map((i) => i.message))
      }

      const next = [...rows]
      next[idx] = parsed.data as RowOf<typeof name>
      return commitWrite(name, 'update', next, parsed.data as RowOf<typeof name>, before, ctx, authority)
    },

    async transition(name, id, to, ctx) {
      const authority = truthStoreFor(name)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(name, authority)

      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const idx = rows.findIndex((r) => rowId(asRecord(r)) === id)
      if (idx === -1) return notFoundRefusal(name, id, 'transition')
      const before = rows[idx]!

      const decision = authorizeWrite(name, authority, 'transition', asRecord(before), ctx, store)
      if (!permitsAction(decision)) return refusal(decision) // nothing mutated

      const actionClass = actionClassFor(name, authority)
      if (!permittedUnder(capability.state, actionClass)) {
        return persistenceRefusal(actionClass, capability, `Transitioning "${name}:${id}" is not permitted right now.`)
      }

      const legality = stateMachineLegality(name, asRecord(before), to)
      if (!legality.allowed) {
        return refusal(
          deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', legality.reason, {
            stage: 'OBJECT_STATE',
            sourceRefs: ['repository.ts'],
          }),
        )
      }

      const merged = { ...before, [legality.field]: to }
      const parsed = COLLECTIONS[name].schema.safeParse(merged)
      if (!parsed.success) {
        return invalidResultRefusal(name, 'transition', parsed.error.issues.map((i) => i.message))
      }

      const next = [...rows]
      next[idx] = parsed.data as RowOf<typeof name>
      return commitWrite(name, 'transition', next, parsed.data as RowOf<typeof name>, before, ctx, authority)
    },

    subscribe(listener) {
      return store.subscribe(listener)
    },

    reset() {
      store.resetToSeed()
      store.notify()
      // Fire-and-forget (see clearPersistedSnapshot's own comment): a
      // reload after reset() must not rehydrate the pre-reset snapshot.
      void clearPersistedSnapshot(persistence.factory)
    },

    advanceClock(ms) {
      store.clock.advance(ms)
      store.notify()
    },

    exportJson() {
      const snap = store.snapshot()
      const out = {} as Record<CollectionName, unknown[]>
      for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
        out[name] = [...snap[name]]
      }
      return out
    },

    importJson(data) {
      if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        return { ok: false, problems: ['Top level must be an object keyed by collection name.'] }
      }
      const record = data as Record<string, unknown>
      const problems: string[] = []
      const next = {} as Record<CollectionName, readonly unknown[]>

      for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
        const rows = record[name]
        if (!Array.isArray(rows)) {
          problems.push(`${name}: missing or not an array`)
          continue
        }
        const seen = new Set<string>()
        const parsedRows: unknown[] = []
        rows.forEach((row: unknown, i: number) => {
          const result = COLLECTIONS[name].schema.safeParse(row)
          if (!result.success) {
            for (const issue of result.error.issues) {
              problems.push(`${name}[${i}] ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            }
            return
          }
          const parsedId = (result.data as { id?: string }).id
          if (typeof parsedId === 'string') {
            if (seen.has(parsedId)) problems.push(`${name}[${i}]: duplicate id ${parsedId}`)
            seen.add(parsedId)
          }
          parsedRows.push(result.data)
        })
        next[name] = parsedRows
      }

      if (problems.length > 0) return { ok: false, problems }
      store.restore(next as CollectionData)
      store.notify()
      return { ok: true }
    },

    persistenceCapability() {
      return capability
    },
  }

  return repository
}

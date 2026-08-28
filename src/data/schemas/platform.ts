import { z } from 'zod'
import { ROLES, type RoleId } from '@/domain/roles'

/** A simulated clock stamp. ISO 8601 with an explicit offset, never `Date.now()`. */
export const Stamp = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
  'must be an ISO-8601 stamp with an explicit offset',
)

// The object catalogue's own line for OBJ-001 · Tenant (L7642) states only six:
// "active, pilot, soft-suspended, hard-suspended, compliance-suspended, archived".
// The state DIAGRAM at L45004 gives the fuller walk: "invited -> pilot or active
// -> soft / hard / compliance -> active -> pending downgrade -> archived" -- two
// more states than the catalogue line names. `pending-downgrade` is also a named
// status in the tier-change narrative (L26985, L27041 "pending downgrade");
// `invited` is the pre-activation identity state (L52832, L61322). The
// eight-state union below is the source's fuller statement, not a six-state
// collapse.
export const TenantLifecycle = z.enum([
  'invited', 'pilot', 'active', 'soft-suspended', 'hard-suspended',
  'compliance-suspended', 'pending-downgrade', 'archived',
])
export const Tier = z.enum(['starter', 'growth', 'enterprise'])

export const Tenant = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lifecycle: TenantLifecycle,
  tier: Tier,
  isPilot: z.boolean(),
  regulatedMode: z.boolean(),
  workerShiftsThisMonth: z.number().int().nonnegative(),
  onboardedAt: Stamp,
  archivedAt: Stamp.nullable(),
  legalHold: z.boolean(),
  primaryLocale: z.enum(['en', 'es']),
  /**
   * Task 5 (unit-01) addition. L44931 (`SoW Fact — §8.9.4`): "Default
   * duration 60 days, 90 at the client's discretion. ... The module tracks
   * pilot expiry, conversion, and extension as first-class actions."
   * `SCHED-14`/`SCHED-023`/`SCHED-PILOT-EXPIRY` (L98237, L98363, L102411,
   * L117905) all name this as a real, tracked per-tenant deadline — the
   * source states the FACT (a pilot has an expiry) and the field's own
   * semantics (an ISO stamp, nullable for a non-pilot), never a literal
   * JSON key spelling, so `pilotExpiresAt` is this build's naming, chosen to
   * match every other `Stamp`-typed instant already on this row
   * (`onboardedAt`, `archivedAt`). `null` for every tenant that is not a
   * pilot (`isPilot === false`); a real date for one that is. Task 6's own
   * detail screen previously rendered "Pilot expiry is not tracked" because
   * this field did not exist yet — that absence note is corrected in the
   * same task that adds the field, not left standing beside it.
   */
  pilotExpiresAt: Stamp.nullable(),
}).strict()
export type Tenant = z.infer<typeof Tenant>

/**
 * Controller ruling R2: the platform's nine fixed roles already have a
 * closed vocabulary at `@/domain/roles` (`RoleId`, `ROLES`) — four platform
 * console roles plus five tenant roles. The brief's sample `PlatformRole` /
 * `TenantRole` / `AnyRole` union is NOT re-declared here: doing so would
 * duplicate that vocabulary and, worse, drift from it — the brief's sample
 * spells the fifth tenant role `READ_ONLY_AUDITOR`, but the vocabulary
 * already in the repository spells it `READONLY_AUDITOR`. `Role` below is
 * derived from `ROLES` itself, so the two can never disagree.
 */
const ROLE_IDS = ROLES.map((r) => r.id) as [RoleId, ...RoleId[]]
export const Role = z.enum(ROLE_IDS)

export const User = z.object({
  id: z.string().min(1),
  tenantId: z.string().nullable(),      // null for the four platform roles
  displayName: z.string().min(1),
  email: z.string().email(),
  role: Role,
  /**
   * Fix round 2 (Task 6, §15.1 vs Task 2's `locked` guess): `'locked'` is
   * REMOVED from this enum. Task 2's own report already flagged it as a
   * derived-clarification schema-fit guess, never a source-cited literal
   * ("`locked` is the closest fit in the schema's `User.status` enum to
   * 'blocked from login' ... a derived clarification of *how* to
   * represent that gate in this schema, not a source-cited field value" --
   * `.superpowers/sdd/2026-08-26-runway/task-2-report.md`). §15.1 "The
   * user and account lifecycle" (frozen source L18914-L19140) supplies
   * the actual named state for exactly this case: its own
   * `stateDiagram-v2` names `Suspended` ("Active --> Suspended... login
   * refused, records retained") triggered explicitly by "personnel
   * decision, OR TENANT COMPLIANCE SUSPENSION" (L18977), and `AC-15-01`
   * (L19031) requires "no account can occupy an undeclared state" among
   * its nine. `locked` is not one of the nine and had no other citation;
   * this is §15.1 governing over an unsourced guess, not a genuine
   * two-source conflict -- Task 2 never claimed `locked` was source-cited
   * in the first place. The four `TEN-MERIDIAN` rows that carried it are
   * migrated to `'suspended'` in `users.json`.
   *
   * Fix round 2 follow-on: `'expired'` is REMOVED from this enum for the
   * identical reason and by the identical test. It sits in neither
   * OBJ-027's three states nor §15.1's nine (Requested, Invited,
   * IdentityVerified, Activated, Active, Suspended, Reactivated, Revoked,
   * Offboarded) -- no row could ever legitimately carry it, which is what
   * made it a permanent allowlist entry rather than a seedable gap.
   * `AC-15-01`'s "no undeclared state" reaches it exactly as it reached
   * `locked`; leaving one unsourced literal allowlisted forever while
   * removing the other for the same reason was the inconsistency this
   * follow-on closes. No row ever carried `'expired'`, so no data
   * migration was needed.
   */
  status: z.enum(['invited', 'active', 'suspended', 'removed']),
  locale: z.enum(['en', 'es']),
  createdAt: Stamp,
  lastSignInAt: Stamp.nullable(),
}).strict()
export type User = z.infer<typeof User>

export const RoleGrant = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  role: Role,
  siteIds: z.array(z.string()),
  areaIds: z.array(z.string()),
  shiftIds: z.array(z.string()),
  grantedBy: z.string().min(1),
  grantedAt: Stamp,
  expiresAt: Stamp.nullable(),
  revokedAt: Stamp.nullable(),
  purpose: z.string().nullable(),       // required for scoped support / break-glass
}).strict()
export type RoleGrant = z.infer<typeof RoleGrant>

export const FeatureControl = z.object({
  id: z.string().min(1),
  featureKey: z.string().min(1),
  platformDefault: z.boolean(),
  globallyDisabled: z.boolean(),
  tenantDesired: z.record(z.string(), z.boolean()),
  effectiveAt: Stamp,
  expiresAt: Stamp.nullable(),
  changedBy: z.string().min(1),
  approvedBy: z.string().nullable(),
}).strict()
export type FeatureControl = z.infer<typeof FeatureControl>

export const Entitlement = z.object({
  id: z.string().min(1),
  tier: Tier,
  featureKey: z.string().min(1),
  included: z.boolean(),
  cap: z.number().int().nonnegative().nullable(),
}).strict()
export type Entitlement = z.infer<typeof Entitlement>

export const AccessSession = z.object({
  id: z.string().min(1),
  kind: z.enum(['support', 'jbs', 'compliance-emergency', 'break-glass']),
  platformUserId: z.string().min(1),
  tenantId: z.string().min(1),
  purpose: z.string().min(1),
  approvedBy: z.string().nullable(),
  openedAt: Stamp,
  expiresAt: Stamp,
  closedAt: Stamp.nullable(),
  readOnly: z.boolean(),
}).strict()
export type AccessSession = z.infer<typeof AccessSession>

/**
 * Task 7 (unit-01) — `OBJ-APPROVAL-REQUEST`, §8.8's maker-checker queue as a
 * first-class record, not an audit row. Frozen source L44735 (`§8.8.4`,
 * `SoW Fact`): "Approval requests are first-class records carrying
 * proposer, change class, object reference, diff, rationale, state —
 * pending, approved, returned, or applied — approver, timestamps, and an
 * audit reference, committed under the one-transaction guarantee." That is
 * nine named fields; every one has a home below (`diff` is `before`/`after`,
 * matching `Audit`'s own primitive-map shape in `./crosscutting.ts` rather
 * than a hand-invented second shape; "an audit reference" is the audit row
 * `repository.ts#commitWrite` already appends atomically with this row's
 * own state change — `subjectRef: "approval-requests:<id>"` on that row IS
 * the reference, so no separate pointer field is added here to duplicate
 * it). `platformWide`/`affectedTenantIds` together are SB-HO-004's "the
 * affected tenants or the word 'platform-wide'" (L23707) — a plain boolean
 * plus array reads far simpler than a discriminated union for the one
 * caller (`ConsoleUsersScreen.tsx`) this collection has, and needs no
 * `RELATIONS` entry beyond the array itself.
 *
 * `changeClass` is the two-value split §8.8.3 actually enforces (engineering
 * class checked by an Admin, critical class checked by the root only);
 * `actionType` carries which SPECIFIC action this is — one of the eleven ids
 * in `@/surfaces/sa/critical-actions` for a critical-class row (that
 * module's own `D12` comment records why the source's stated "ten" and its
 * own enumeration disagree, and this schema does not re-litigate it), or a
 * free-text engineering-class action name, since no closed vocabulary for
 * engineering-class action types exists in the source the way the eleven
 * critical ones do.
 *
 * `evaluationSuiteId` is nullable and is NOT a `RELATIONS` target — like
 * `evaluations.suiteId` itself (`./index.ts#UNCHECKABLE_ID_FIELDS`), a
 * suite is a grouping label carried by zero or more `evaluations` rows, not
 * a collection of its own, so this field carries the identical allowlist
 * reason rather than a fabricated relation.
 *
 * `state` deliberately keeps all four source-named values even though this
 * build's own Approve control (§8.8.3: "the change and its audit event
 * commit in the same transaction") never rests a row it writes at
 * `'approved'` — it commits straight to `'applied'`, matching the source's
 * own one-transaction wording. One seed row is left at `'approved'`
 * (`AR-0008`, a tier publication whose actual platform-wide publication is
 * a separate downstream act this build does not execute) so the state is
 * genuinely represented, not merely declared in the enum.
 */
export const ApprovalRequestClass = z.enum(['engineering', 'critical'])
export type ApprovalRequestClass = z.infer<typeof ApprovalRequestClass>

export const ApprovalRequestState = z.enum(['pending', 'approved', 'returned', 'applied'])
export type ApprovalRequestState = z.infer<typeof ApprovalRequestState>

const ApprovalDiffMap = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))

export const ApprovalRequest = z.object({
  id: z.string().min(1),
  changeClass: ApprovalRequestClass,
  actionType: z.string().min(1),
  objectRef: z.string().min(1),
  proposerId: z.string().min(1),
  rationale: z.string().min(1),
  before: ApprovalDiffMap,
  after: ApprovalDiffMap,
  platformWide: z.boolean(),
  affectedTenantIds: z.array(z.string()),
  evaluationSuiteId: z.string().nullable(),
  state: ApprovalRequestState,
  approverId: z.string().nullable(),
  createdAt: Stamp,
  decidedAt: Stamp.nullable(),
  returnReason: z.string().nullable(),
}).strict()
export type ApprovalRequest = z.infer<typeof ApprovalRequest>

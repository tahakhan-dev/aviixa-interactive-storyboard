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
  status: z.enum(['invited', 'active', 'locked', 'suspended', 'expired', 'removed']),
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

/**
 * Task 7 (`src/data/truth-stores.ts`) — the §12.5 truth-store boundaries.
 *
 * §12.5 (design doc §3.2, quoting the master prompt): "Studio definition
 * truth, Hub official operational truth, device-local replica and durable
 * queue, server command queue, Command Center freshness-aware projections,
 * Super Admin platform configuration, product audit, telemetry, review
 * metadata." That is nine authorities, and every one of the forty §3.1
 * collections carries EXACTLY one of them.
 *
 * `repository.ts` consults this before it consults `evaluateAccess` on
 * every `create`/`update`/`transition`: a collection whose authority is not
 * writable through this generic door (see `WRITE_DOOR_CLOSED` below) is
 * refused here, before any role or scope question is even asked. This is
 * the mechanism the brief names directly: "a write arriving from [the
 * Client Command Center] against a Hub-owned collection must be refused by
 * the repository rather than by the screen that happens not to offer a
 * button." `@/domain/surfaces`' own `SURFACES` table states Command
 * Center's ownership as the literal string `'Nothing.'` — no collection
 * below carries `'cc-projection'`, which is what that sentence means in
 * this table's terms.
 */
import type { CollectionName } from './schemas'

export type TruthStoreAuthority =
  | 'studio'
  | 'hub'
  | 'device-local'
  | 'command-queue'
  | 'cc-projection'
  | 'platform'
  | 'audit'
  | 'telemetry'
  | 'review'

export const TRUTH_STORE_AUTHORITIES = [
  'studio',
  'hub',
  'device-local',
  'command-queue',
  'cc-projection',
  'platform',
  'audit',
  'telemetry',
  'review',
] as const satisfies readonly TruthStoreAuthority[]

type MissingFromAuthorities = Exclude<TruthStoreAuthority, (typeof TRUTH_STORE_AUTHORITIES)[number]>
const _authoritiesExhaustive: MissingFromAuthorities extends never ? true : never = true
void _authoritiesExhaustive

/**
 * One row per collection in `@/data/schemas#COLLECTIONS`. `Record<CollectionName,
 * ...>` makes this exhaustive by construction — a forty-first collection
 * that is not given an authority here is a compile error, not a silent
 * gap, the same discipline `@/domain/surfaces#SURFACES` and
 * `@/domain/roles#ROLES` already hold themselves to.
 *
 * Reasoning, grouped rather than repeated per row:
 *
 * - `platform`: the platform console's own configuration and lifecycle
 *   registers — `tenants`, `users`, `roles`, `role-grants`,
 *   `feature-controls`, `entitlements`, `access-sessions` (a platform-domain
 *   role's own named session, per `evaluateAccess`'s M4 comment). `evaluations`
 *   joins them: its own schema comment names it "the platform's AI-capability
 *   test harness (Super Admin, Eval Harness)", not tenant definition truth.
 *   `schedules` joins them too: every causer in
 *   `@/domain/vocabularies#SCHEDULE_DEFINITION_TRANSITIONS` is a platform
 *   console role (Platform Engineer, Admin, Root Super Admin, or a named
 *   non-human platform identity) — no tenant role appears in that table at all.
 * - `studio`: authored, versioned, published content — the surface's own
 *   ownership line is "Definition, version and work-package truth."
 *   `tours` joins them: a tour is authored, versioned (`status: draft |
 *   ready | published`) and replayable content, the same shape as a
 *   Workflow Definition, not an operational record.
 * - `hub`: the tenant's own authoritative operational records — the
 *   surface's ownership line, verbatim ("Authoritative tenant operational
 *   records and the tenant audit trail" — `audit` itself is carved out
 *   below as its own authority, per the nine-item list).
 * - `device-local`: `captures` and `evidence` alone, because both carry the
 *   FL surface's ownership line in their OWN status ladders — a
 *   `committed-locally → queued → uploading → … → officially-recorded`
 *   shape that exists nowhere else in the schema set, and exists precisely
 *   because these two rows originate on a device and are "contributed to
 *   the official record at synchronisation" (`@/domain/surfaces`).
 * - `command-queue`: `commands` alone — OBJ-082's own name for the object.
 * - `telemetry`: `events`, which folds an operational signal with a sync
 *   attempt (see `@/data/schemas/crosscutting#Event`'s own comment) — what
 *   happened, not a record anyone owns as truth.
 * - `audit`: `audit` alone.
 * - `cc-projection` / `review`: no collection at V1. Command Center owns no
 *   record of its own (`ownership: 'Nothing.'`), and client-review metadata
 *   is its own separate lifecycle in `src/review/store.ts`, never one of
 *   these forty rows. Both authorities are still real members of the type
 *   (§12.5 names nine, not seven) — they are simply unreachable through
 *   this table today, exactly as `PermissionOutcome`'s
 *   `clientDecisionRequired` and `notApplicable` sit unused by many a
 *   single evaluator without being removed from the closed set.
 */
export const TRUTH_STORES: Readonly<Record<CollectionName, TruthStoreAuthority>> = {
  tenants: 'platform',
  users: 'platform',
  roles: 'platform',
  'role-grants': 'platform',
  sites: 'hub',
  areas: 'hub',
  locations: 'hub',
  shifts: 'hub',
  workers: 'hub',
  qualifications: 'hub',
  'qualification-grants': 'hub',
  devices: 'hub',
  'workflow-definitions': 'studio',
  'work-instructions': 'studio',
  'content-blocks': 'studio',
  training: 'studio',
  specifications: 'studio',
  evaluations: 'platform',
  packages: 'studio',
  jobs: 'hub',
  runs: 'hub',
  'unit-executions': 'hub',
  'step-executions': 'hub',
  captures: 'device-local',
  evidence: 'device-local',
  deviations: 'hub',
  holds: 'hub',
  summaries: 'hub',
  reports: 'hub',
  parts: 'hub',
  notifications: 'hub',
  commands: 'command-queue',
  events: 'telemetry',
  audit: 'audit',
  schedules: 'platform',
  'feature-controls': 'platform',
  entitlements: 'platform',
  'ai-requests': 'hub',
  'access-sessions': 'platform',
  tours: 'studio',
  // Task 7 (unit-01): the approval queue is the platform console's own
  // change-governance register (§8.8.4) — the same authority as `tenants`/
  // `users`/`role-grants` above, not a tenant-owned or audit-owned record.
  'approval-requests': 'platform',
} as const satisfies Record<CollectionName, TruthStoreAuthority>

/**
 * `audit` and `telemetry` are never targets of the generic `create`/
 * `update`/`transition` door: an audit or event row is a BY-PRODUCT of a
 * real write elsewhere (`repository.ts` appends both itself, atomically
 * with the mutation that produced them — see `WriteResult`), never a thing
 * a caller forges directly by naming the collection. `cc-projection` and
 * `review` carry no collection at V1 (see the table's own comment above)
 * so they are unreachable in practice, but are refused here too rather
 * than left to fall through to a generic "allowed" default.
 */
const WRITE_DOOR_CLOSED: ReadonlySet<TruthStoreAuthority> = new Set([
  'audit',
  'telemetry',
  'cc-projection',
  'review',
])

export function truthStoreFor(name: CollectionName): TruthStoreAuthority {
  return TRUTH_STORES[name]
}

/** Whether a write against a collection of this authority may ever succeed through the generic door. */
export function writableThroughRepository(authority: TruthStoreAuthority): boolean {
  return !WRITE_DOOR_CLOSED.has(authority)
}

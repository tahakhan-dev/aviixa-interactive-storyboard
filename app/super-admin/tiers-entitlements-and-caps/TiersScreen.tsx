'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saModuleById } from '@/surfaces/sa/modules'
import {
  SA_INVARIANTS,
  type SaInvariantId,
  type SaInvariantDefinition,
} from '@/surfaces/sa/invariants'
import {
  CRITICAL_ACTIONS,
  CRITICAL_ACTION_COUNT_NOTE,
  type SaCriticalActionId,
  type SaCriticalActionDefinition,
} from '@/surfaces/sa/critical-actions'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { type ScreenStateId } from '@/ui/screen-state'
import { Button, Checkbox, Select, Table, type TableRow } from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, type PermissionDecision } from '@/policy/decision'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { rolesInDomain, type RoleId } from '@/domain/roles'
import { RootUnavailableFreeze } from '@/ui/sa/RootUnavailableFreeze'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-11 — Tiers, Entitlements and Caps (Band B, the operations layer).
 *
 * Screen annotations only (D1 — names are canonical, `SCR-SA-NN` numbers are
 * annotations and no route is keyed on one): SCR-SA-17 "Tier records and
 * publication" (L42809), whose storyboard is SB-SA-11 (L45273). The build's
 * extraction labels that same screen "Tier records list and record view" and
 * points the label at L45273; that is the extraction's own name, not a
 * second name the source gives the screen, and it is not cited as one.
 * Also SCR-SA-14 "Tiers, entitlements and caps" (L48743 — the
 * second, incompatible numbering scheme D1 exists to neutralise), plus the
 * unnumbered per-tenant feature panel on the tenant detail Overview tab
 * (L54606).
 *
 * What this module actually is: a **priceless, versioned, approvable record**
 * and the two things done to it — declaring how existing tenants are treated
 * when a new version publishes, and publishing it, which is critical class.
 * The frozen source defines exactly ONE control here (L45273, the mandatory
 * grandfathering declaration). Everything else on this screen is either a
 * readout of a state the source fixes, an acceptance criterion the source
 * makes a hard gate, or an entry in the unspecified-in-source panel. No
 * plausible-looking control has been invented to fill a gap (D15).
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` tokens are the spec's and
 * census's vocabulary; `RoleId` is this build's. Neither is wrong and
 * they must never be conflated, so the mapping is written once and every
 * access decision below goes through `evaluateAccess` with the `RoleId`.
 * ------------------------------------------------------------------ */
export type SaConsoleRoleToken =
  | 'ROLE-PLAT-ROOT'
  | 'ROLE-PLAT-ADMIN'
  | 'ROLE-PLAT-ENG'
  | 'ROLE-PLAT-SUP'

export interface SaConsoleRoleView {
  readonly token: SaConsoleRoleToken
  readonly roleId: RoleId
  readonly label: string
}

const PLATFORM_ROLES = rolesInDomain('PLATFORM')

function platformRoleName(id: RoleId): string {
  return PLATFORM_ROLES.find((r) => r.id === id)?.name ?? id
}

export const CONSOLE_ROLE_VIEWS = [
  { token: 'ROLE-PLAT-ROOT', roleId: 'ROOT_SUPER_ADMIN', label: platformRoleName('ROOT_SUPER_ADMIN') },
  { token: 'ROLE-PLAT-ADMIN', roleId: 'ADMIN', label: platformRoleName('ADMIN') },
  { token: 'ROLE-PLAT-ENG', roleId: 'PLATFORM_ENGINEER', label: platformRoleName('PLATFORM_ENGINEER') },
  { token: 'ROLE-PLAT-SUP', roleId: 'SUPPORT', label: platformRoleName('SUPPORT') },
] as const satisfies readonly SaConsoleRoleView[]

type MissingFromConsoleRoles = Exclude<
  SaConsoleRoleToken,
  (typeof CONSOLE_ROLE_VIEWS)[number]['token']
>
const _consoleRolesExhaustive: MissingFromConsoleRoles extends never ? true : never = true
void _consoleRolesExhaustive

function consoleRoleView(token: SaConsoleRoleToken): SaConsoleRoleView {
  const found = CONSOLE_ROLE_VIEWS.find((r) => r.token === token)
  if (!found) throw new Error(`Unknown console role: ${token}`)
  return found
}

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */

/* ------------------------------------------------------------------ *
 * Closed vocabularies the source fixes for this module.
 * ------------------------------------------------------------------ */

/** OBJ-SA-TIER states (L45292, L45293). */
export type TierVersionState = 'draft' | 'pending root approval' | 'published' | 'superseded'

export const TIER_VERSION_STATES = [
  'draft',
  'pending root approval',
  'published',
  'superseded',
] as const satisfies readonly TierVersionState[]

type MissingFromTierStates = Exclude<TierVersionState, (typeof TIER_VERSION_STATES)[number]>
const _tierStatesExhaustive: MissingFromTierStates extends never ? true : never = true
void _tierStatesExhaustive

/** Tenant treatment on tier publication (L45293). Exactly two, and no third. */
export type GrandfatheringTreatment = 'grandfathered' | 'migrated'

export const GRANDFATHERING_TREATMENTS = [
  'grandfathered',
  'migrated',
] as const satisfies readonly GrandfatheringTreatment[]

type MissingFromTreatments = Exclude<
  GrandfatheringTreatment,
  (typeof GRANDFATHERING_TREATMENTS)[number]
>
const _treatmentsExhaustive: MissingFromTreatments extends never ? true : never = true
void _treatmentsExhaustive

/**
 * The six field groups (numeric fact "Tier record field groups: 6", L45273;
 * enumerated at L2195 / L56912). AC-SA-11-01 makes the count a hard gate and
 * makes price metadata a prohibition — so there are six, and the seventh a
 * reader expects is drawn as an absence, not omitted.
 */
export interface TierFieldGroup {
  readonly name: string
  readonly note: string
}

export const TIER_FIELD_GROUPS = [
  {
    name: 'Entitlement flags',
    note: 'Agent Author is gated to Growth and Enterprise; Job Type and Service Type are ungated (AC-SA-11-06, L45342).',
  },
  {
    name: 'Limits and caps',
    note: 'The allocation ceilings a tier carries. Their vocabulary is not enumerated in the source — see the unspecified-in-source panel.',
  },
  {
    name: 'Threshold defaults',
    note: 'Defaults for the usage-ladder thresholds a tenant is provisioned with. The ladder itself is rendered in MOD-SA-12, not here.',
  },
  {
    name: 'Effective dates',
    note: 'When a published version begins to apply. What happens between publication and the effective date is not stated in the source.',
  },
  {
    name: 'Grandfathering rule',
    note: 'How tenants already on a tier are treated when this version publishes — grandfathered, or migrated (L45293). Mandatory before submission (AC-SA-11-03).',
  },
  {
    name: 'Approval reference',
    note: 'The root approval this version was published under. Tier publication is critical class (AC-SA-11-02).',
  },
] as const satisfies readonly TierFieldGroup[]

/**
 * `AC-SA-11-05` (L45342): "the Worker-Shift definition appears in every tier
 * record". It is a criterion this build reported as ABSENT from the frozen
 * source for three rounds; the source states it, and L2193 states why — the
 * metric is "written into the tier record itself so the meter is
 * contractually visible per tenant".
 *
 * It is NOT a seventh field group. L2195 closes the record at six, and the
 * definition rides in every record beside them rather than as one of them, so
 * it is rendered as its own block and `TIER_FIELD_GROUPS` is left at six.
 *
 * The words below are the source's own, from L2193. `tests/component/sa-tiers.test.tsx`
 * asserts the block renders for EVERY member of `TIER_RECORDS` — "every tier
 * record" is the criterion, and a block rendered for the default selection
 * only would satisfy a test that opened one record and nothing else.
 */
export const WORKER_SHIFT_DEFINITION =
  'One worker attached to work — a run, or a run-less job — within one calendar shift counts ' +
  'once, regardless of how many runs they touch; where a substitution occurs, each worker who ' +
  'actually performed work counts one. The allocation period is monthly.'

/* ------------------------------------------------------------------ *
 * Fixtures. There is no clock on this surface and no ambient `Date.now()`
 * anywhere in the build, so every time value below is a seeded string and
 * is labelled a fixture value on screen.
 * ------------------------------------------------------------------ */
const AS_OF_CURRENT = '2026-08-16 09:15 UTC'
const AS_OF_STALE = '2026-08-15 07:45 UTC'
const STALE_AGE = '26 hours old'

/**
 * The three bands, by Worker-Shifts per month (L2195, L26856,
 * L118919). The number is a BILLING UNIT — a count on a commercial ledger
 * for one tenant in one calendar month. It is never a rate, never a series,
 * never split below the tenant, and never compared between people.
 */
export interface TierBand {
  readonly name: string
  readonly boundary: string
  /** AC-SA-11-06: Agent Author gates Growth and Enterprise. */
  readonly agentAuthor: boolean
}

export const TIER_BANDS = [
  { name: 'Starter', boundary: 'below 100 Worker-Shifts per month', agentAuthor: false },
  { name: 'Growth', boundary: '100 to 199 Worker-Shifts per month', agentAuthor: true },
  { name: 'Enterprise', boundary: '200 and above Worker-Shifts per month', agentAuthor: true },
] as const satisfies readonly TierBand[]

export interface TierRecordFixture {
  readonly id: string
  readonly state: TierVersionState
  readonly treatment: GrandfatheringTreatment | null
  readonly effectiveFrom: string
  readonly approvalReference: string | null
}

/** One row per OBJ-SA-TIER state, so the closed vocabulary is fully exercised. */
export const TIER_RECORDS = [
  {
    id: 'TIER-VERSION-FIXTURE-2026.4',
    state: 'draft',
    treatment: null,
    effectiveFrom: 'not yet set',
    approvalReference: null,
  },
  {
    id: 'TIER-VERSION-FIXTURE-2026.3',
    state: 'pending root approval',
    treatment: 'grandfathered',
    effectiveFrom: '2026-09-01',
    approvalReference: null,
  },
  {
    id: 'TIER-VERSION-FIXTURE-2026.2',
    state: 'published',
    treatment: 'migrated',
    effectiveFrom: '2026-06-01',
    approvalReference: 'PLT-APPROVAL-FIXTURE-0231',
  },
  {
    id: 'TIER-VERSION-FIXTURE-2026.1',
    state: 'superseded',
    treatment: 'grandfathered',
    effectiveFrom: '2026-01-01',
    approvalReference: 'PLT-APPROVAL-FIXTURE-0118',
  },
] as const satisfies readonly TierRecordFixture[]

/**
 * Tenant tier assignments. Tenant TOKENS only — never a name, never a link
 * to record-level content (AC-SA-000-07 L42885, AC-SEC-801 L104316).
 *
 * `workerShiftsInMonth` is the tenant-month ledger count that decides the
 * band, and it is the lowest granularity this console renders anywhere. It
 * is not a rate, it carries no trend, and there is no per-site, per-shift or
 * per-worker breakdown behind it — the line holds at the tenant.
 */
export interface TenantTierAssignment {
  readonly tenantToken: string
  readonly band: string
  readonly tenantMonth: string
  readonly workerShiftsInMonth: number
  readonly pendingDowngradeTo: string | null
}

export const TENANT_TIER_ASSIGNMENTS = [
  {
    tenantToken: 'TENANT-FIXTURE-A',
    band: 'Enterprise',
    tenantMonth: '2026-07',
    workerShiftsInMonth: 244,
    pendingDowngradeTo: 'Growth',
  },
  {
    tenantToken: 'TENANT-FIXTURE-B',
    band: 'Growth',
    tenantMonth: '2026-07',
    workerShiftsInMonth: 141,
    pendingDowngradeTo: null,
  },
  {
    tenantToken: 'TENANT-FIXTURE-C',
    band: 'Starter',
    tenantMonth: '2026-07',
    workerShiftsInMonth: 62,
    pendingDowngradeTo: null,
  },
] as const satisfies readonly TenantTierAssignment[]

/**
 * WF-FEAT-002 (L54658) — enabling or disabling a feature for one tenant.
 * The override is a flag on the TENANT record; the tier is never edited
 * (AC-SA-11-04 L45342, AC-WF-FEAT-002-01 L54672). Where the two disagree,
 * the more restrictive state is in force until DEC-FEAT-004 is decided
 * (AC-WF-FEAT-002-03).
 */
export interface FeatureOverrideFixture {
  readonly tenantToken: string
  readonly feature: string
  readonly tierState: 'enabled' | 'disabled'
  readonly overrideState: 'enabled' | 'disabled'
}

export const FEATURE_OVERRIDES = [
  {
    tenantToken: 'TENANT-FIXTURE-A',
    feature: 'Agent Author',
    tierState: 'enabled',
    overrideState: 'disabled',
  },
  {
    tenantToken: 'TENANT-FIXTURE-B',
    feature: 'Agent Author',
    tierState: 'enabled',
    overrideState: 'enabled',
  },
  {
    tenantToken: 'TENANT-FIXTURE-C',
    feature: 'Agent Author',
    tierState: 'disabled',
    overrideState: 'enabled',
  },
] as const satisfies readonly FeatureOverrideFixture[]

/** AC-WF-FEAT-002-03: the more restrictive of the two, and nothing cleverer. */
function effectiveFeatureState(o: FeatureOverrideFixture): 'enabled' | 'disabled' {
  return o.tierState === 'disabled' || o.overrideState === 'disabled' ? 'disabled' : 'enabled'
}

/* ------------------------------------------------------------------ *
 * Access. Every affordance is decided by `evaluateAccess` against
 * per-control allowed roles (D16) — never by a module-level role list
 * (which for this module is inconsistent across six extraction chunks:
 * Admin alone, root+Admin, root+Admin+Support, and all four), and never
 * by a hand-rolled role comparison.
 * ------------------------------------------------------------------ */
const DOMAIN_STATE = emptyDomainState(scenarioRunId('MOD-SA-11-fixture'))

const ACTOR_OF_RECORD = 'person-fixture-tier-drafter'

function accessContext(roleId: RoleId) {
  return {
    state: DOMAIN_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A platform-domain role holds no ambient tenant. Tenant content is
      // reachable only inside a named access class, never from this console.
      tenant: null,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: ACTOR_OF_RECORD,
  } as const
}

interface ControlDefinition {
  readonly id: string
  readonly label: string
  /** What the control does, in the source's own terms. */
  readonly effect: string
  readonly allowedRoles: readonly RoleId[]
  readonly sourceRefs: readonly string[]
  readonly refusalReasons?: Readonly<Partial<Record<RoleId, string>>>
  readonly defaultRefusalReason: string
}

/**
 * THE one control the frozen source defines for MOD-SA-11 (L45273):
 * "mandatory grandfathering declaration", allowed roles Root Super Admin and
 * Admin, effect "must be completed before submission is possible".
 */
const GRANDFATHERING_DECLARATION: ControlDefinition = {
  id: 'grandfathering-declaration',
  label: 'Complete the grandfathering declaration',
  effect:
    'Must be completed before tier submission is possible. Every tenant already on a tier is declared either grandfathered or migrated (L45273, AC-SA-11-03 L45342).',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['L45273', 'AC-SA-11-03 L45342'],
  refusalReasons: {
    PLATFORM_ENGINEER:
      'The Platform Engineer is explicitly prohibited on tier publication (L11684). The source names only the Root Super Admin and the Admin on this declaration (L45273).',
    SUPPORT:
      'The source names only the Root Super Admin and the Admin on this declaration (L45273). The Support role reads this module and holds no control on it.',
  },
  defaultRefusalReason:
    'The source names only the Root Super Admin and the Admin on the grandfathering declaration (L45273).',
}

/**
 * The draft-to-pending transition. Workflow 23.11 (L45248): "An Admin drafts
 * a new tier-record version" and the Root Super Admin approves. The maker is
 * the Admin; the root is named on the same object as the approver, and is
 * shown the maker control too because it holds every Admin authority.
 */
const SUBMIT_FOR_ROOT_APPROVAL: ControlDefinition = {
  id: 'submit-tier-version-for-root-approval',
  label: 'Submit tier version for root approval',
  effect:
    'Moves the draft to pending root approval. It does not publish: publication is a separate, critical-class act (workflow 23.11, L45248).',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['L45248', 'AC-SA-11-02 L45342'],
  refusalReasons: {
    PLATFORM_ENGINEER:
      'The Platform Engineer is explicitly prohibited on tier publication and on the objects that carry it (L11684). Band A engineering work does not draft a commercial tier version.',
    SUPPORT:
      'Workflow 23.11 names the Admin as the drafter and the Root Super Admin as the approver (L45248). The Support role reads this module and drafts nothing on it.',
  },
  defaultRefusalReason:
    'Workflow 23.11 names the Admin as the drafter and the Root Super Admin as the approver (L45248).',
}

/**
 * Publication. Critical class, root only, and for every other role the whole
 * action bar becomes the class badge (spec §3, L23707) so no control here can
 * be mistaken for an approval path.
 */
const PUBLISH_TIER_VERSION: ControlDefinition = {
  id: 'publish-tier-version',
  label: 'Publish tier version',
  effect:
    'Publishes the version with its declared grandfathering treatment, and commits the change and its audit event in one transaction (workflow 23.11, L45248).',
  allowedRoles: ['ROOT_SUPER_ADMIN'],
  sourceRefs: ['AC-SA-11-02 L45342', 'L55942', 'L65359'],
  defaultRefusalReason:
    'Tier publication is critical-class and cannot be performed by an Admin alone (AC-SA-11-02, L45342). The class cannot be downgraded by any operator (AC-WF-ROLE-018-01, L55969).',
}

/** WF-FEAT-002 (L54658): primary actor is the platform Admin; root holds it too. */
const SET_FEATURE_OVERRIDE: ControlDefinition = {
  id: 'set-per-tenant-feature-override',
  label: 'Set the per-tenant feature override',
  effect:
    'Sets a flag on the TENANT record. It never edits the tier (AC-SA-11-04 L45342, AC-WF-FEAT-002-01 L54672).',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['WF-FEAT-002 L54658', 'AC-SA-11-04 L45342'],
  refusalReasons: {
    PLATFORM_ENGINEER:
      'WF-FEAT-002 names the platform Admin as its primary actor (L54658). The Platform Engineer is a maker in Band A only, and this is a Band B commercial entitlement control (D14).',
    SUPPORT:
      'WF-FEAT-002 names the platform Admin as its primary actor (L54658). The Support role reads this panel and sets nothing on it.',
  },
  defaultRefusalReason:
    'WF-FEAT-002 names the platform Admin as its primary actor (L54658).',
}

function decisionFor(control: ControlDefinition, roleId: RoleId): PermissionDecision {
  return evaluateAccess(
    { action: control.id, allowedRoles: control.allowedRoles, sourceRefs: control.sourceRefs },
    accessContext(roleId),
  )
}

function mayAct(control: ControlDefinition, roleId: RoleId): boolean {
  return permitsAction(decisionFor(control, roleId))
}

function refusalReason(control: ControlDefinition, roleId: RoleId): string {
  return control.refusalReasons?.[roleId] ?? control.defaultRefusalReason
}

/**
 * One control rendered by RULE (spec §3), never by taste:
 * - DISABLED WITH A NAMED REASON when the action exists on this platform but
 *   not for this role, or not in this state.
 * - The two other renderings — ABSENT and CLASS BADGE — are applied at their
 *   own call sites below, because each is a statement about the action's
 *   whole existence, not about one role's decision.
 */
function ActionControl({
  control,
  roleId,
  blockedReason,
  onAct,
}: {
  readonly control: ControlDefinition
  readonly roleId: RoleId
  /** A state-level block (read-only, an unmet precondition) — outranks nothing;
   *  the role refusal is checked first so a reader is told the deeper cause. */
  readonly blockedReason?: string
  readonly onAct?: () => void
}) {
  if (!mayAct(control, roleId)) {
    return (
      <ProhibitionNotice
        rendering={{
          kind: 'disabled-with-reason',
          label: control.label,
          reason: refusalReason(control, roleId),
        }}
      />
    )
  }

  if (blockedReason !== undefined) {
    return (
      <ProhibitionNotice
        rendering={{ kind: 'disabled-with-reason', label: control.label, reason: blockedReason }}
      />
    )
  }

  return (
    <div>
      <Button {...(onAct !== undefined ? { onClick: onAct } : {})}>{control.label}</Button>
      <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">{control.effect}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The aggregate. Renders an as-of timestamp and degrades to stale-with-age
 * or unavailable. Never zero. Never blank. (AC-SA-01-03, L43070.)
 * ------------------------------------------------------------------ */
type AggregateVariant = 'current' | 'stale' | 'not-yet-read' | 'unavailable'

function aggregateVariant(state: ScreenStateId): AggregateVariant {
  switch (state) {
    case 'STATE-02':
      return 'not-yet-read'
    case 'STATE-08':
      return 'stale'
    case 'STATE-12':
    case 'STATE-13':
      return 'unavailable'
    default:
      return 'current'
  }
}

function AssignmentAggregate({ variant }: { readonly variant: AggregateVariant }) {
  const byBand = TIER_BANDS.map((b) => ({
    band: b.name,
    tenants: TENANT_TIER_ASSIGNMENTS.filter((t) => t.band === b.name).length,
  }))

  return (
    <section
      aria-label="Tier assignment aggregate"
      className="mt-6 rounded border border-[var(--color-border)] p-4"
    >
      <h2 className="text-lg font-semibold">Tenants by tier band</h2>

      {variant === 'not-yet-read' ? (
        <p className="mt-2 text-sm">
          Not yet read — this aggregate has not arrived. A count that has not arrived is a
          placeholder, never the number nought.
        </p>
      ) : variant === 'unavailable' ? (
        <p className="mt-2 text-sm">
          Unavailable — this aggregate could not be read. It is not being shown as an empty band, and
          it is not being shown as a nought. Last read as of {AS_OF_CURRENT} (fixture value).
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            {variant === 'stale'
              ? `Stale — as of ${AS_OF_STALE}, ${STALE_AGE} (fixture value).`
              : `As of ${AS_OF_CURRENT} (fixture value).`}
          </p>
          <ul className="mt-2 flex flex-wrap gap-4 text-sm">
            {byBand.map((row) => (
              <li key={row.band}>
                {row.band}: {row.tenants} tenants
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid max-w-2xl grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {TENANT_TIER_ASSIGNMENTS.map((t) => (
              <div key={t.tenantToken} className="contents">
                <dt className="font-medium">{t.tenantToken}</dt>
                <dd>
                  {t.band} · {t.workerShiftsInMonth} Worker-Shifts in the tenant-month{' '}
                  {t.tenantMonth}
                  {t.pendingDowngradeTo !== null ? ' · pending downgrade' : ''}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        A Worker-Shift is a billing unit: one worker attached to work in one calendar shift meters
        exactly one Worker-Shift, whatever the run count (AC-GOAL-060, L2241). It appears here only
        as a count on a commercial ledger for one tenant in one calendar month, because that count is
        what decides the band.
      </p>
      <div className="mt-2">
        <ProhibitionNotice
          rendering={{
            kind: 'absent',
            note: 'Worker-Shifts by tenant over time: not drawn, for any account including the root. This console holds the line at one tenant in one calendar month — there is no series beneath it, no site split, no shift split and no person in it.',
          }}
        />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * What the source does not define. Named, not invented (D15).
 * ------------------------------------------------------------------ */
export interface UnspecifiedEntry {
  readonly what: string
  readonly detail: string
}

export const UNSPECIFIED_IN_SOURCE = [
  {
    what: 'Who may assign a published tier to a tenant',
    detail:
      'FEAT-SA-TIER-ASSIGN is named as a key function (L21088), and the source does class it Band B — "tier assignment within published tiers" (L21015) is one of the Band B routine actions that "are Admin actions that auto-apply, audited" (L21015), and condition [M15] adds that "Tier assignment within already-published tiers auto-applies; publishing a tier does not" (L21098). But no control row anywhere carries an assign action with allowed roles. Module-level `roles_allowed` is authoritative nowhere (D16) and it disagrees with itself across six chunks — Admin alone (L2442, L98239), root and Admin (L11668, L60866), root, Admin and Support (L21088), all four (L42745, L45277), and empty (L116399). No assignment control is drawn on this screen rather than picking one of those lists.',
  },
  {
    what: 'The vocabulary of limits and caps, and of threshold defaults',
    detail:
      'Two of the six field groups the tier record carries (L2195, L45273). The source names the groups and never enumerates what sits inside either one, so the record view names the groups and shows no invented rows beneath them.',
  },
  {
    what: 'The entitlement flags beyond Agent Author, Job Type and Service Type',
    detail:
      'AC-SA-11-06 (L45342) names exactly those three and their gating. Whether the entitlement-flag set is closed at three, and what the others would be, is not stated anywhere in the source.',
  },
  {
    what: 'What happens between publication and the effective date',
    detail:
      'Effective dates are a field group on the record (L2195). Workflow 23.11 (L45248) runs to NINE steps and does not stop at publication: step 5 commits the version and its audit event together, step 6 grandfathers or migrates existing tenants per the declared treatment, step 7 propagates entitlement changes to tenant surfaces, step 8 propagates caps to the usage ladder and the tenant-configuration registry, and step 9 runs a per-tenant entitlement conformance check. What none of the nine steps names is a notice period, a scheduled-activation state or a pre-effective state, so none of those three is drawn. Read against the whole workflow rather than a summary of its middle: an earlier draft of this entry quoted a compression of steps 5 and 6 as the workflow\'s ending and rested this abstention on a workflow that stopped three steps early.',
  },
  {
    what: 'What supersedes a published version, and when',
    detail:
      'Superseded is one of the four OBJ-SA-TIER states (L45292) and nothing in the source says whether publication of a later version supersedes the earlier one automatically or by a separate act. The list shows a superseded fixture row; no control claims to supersede anything.',
  },
  {
    what: 'The eight FUNC-SA-11 function identifiers',
    detail:
      'L45277 names FUNC-SA-11-01-A1, -01-A2, -01-A3, -02-A1, -03-A1, -03-B1, -03-B2 and -04-A1 as this module’s key functions and describes none of them. Eight named-but-undescribed functions are not eight controls, and nothing on this screen stands in for them.',
  },
  {
    what: 'Which of the tier and the override wins when they disagree',
    detail:
      'DEC-FEAT-004 is open. AC-WF-FEAT-002-03 (L54672) fixes the interim behaviour — the more restrictive of the two applies and the ambiguity is named — and that is exactly what the per-tenant panel renders. It is an interim rule, not a resolution, and the panel says so.',
  },
  {
    what: 'What happens to a deployed composed agent on a tier downgrade',
    detail:
      'DEC-AGENTLC-001 (L11971) is open and explicitly not stated in the source, including for in-flight runs. The downgrade queue on this screen therefore shows the queue and the cycle rule, and makes no claim about what a downgrade does to anything already running.',
  },
  {
    what: 'A filter, a sort or a search on the tier record list',
    detail:
      'The source names no facet for this list anywhere. The list is short and complete; no filter has been invented to make it look like a real console.',
  },
] as const satisfies readonly UnspecifiedEntry[]

/* ------------------------------------------------------------------ *
 * The screen.
 * ------------------------------------------------------------------ */
const MODULE = saModuleById('MOD-SA-11')

/**
 * The one-transaction audit guarantee is the invariant this module rides on.
 *
 * Looked up TOTALLY, not with a bare `.find()` whose `undefined` a renderer
 * would silently swallow. This was not a hypothetical: the first draft of
 * this file passed `'one-transaction-audit'`, the real id is
 * `'one-transaction-audit-guarantee'`, the chip rendered as nothing at all,
 * and the R2 gate below — which asserts no invariant renders as a control —
 * passed a planted `<button>` because there was no chip for it to guard.
 * A missing member of a closed set this build owns is a programmer error,
 * not an expected path, so it throws, the same as `screenState()` in
 * `@/ui/screen-state` does for the same kind of caller mistake.
 */
function saInvariant(id: SaInvariantId): SaInvariantDefinition {
  const found = SA_INVARIANTS.find((i) => i.id === id)
  if (!found) throw new Error(`Unknown SURF-SA invariant: ${id}`)
  return found
}

const AUDIT_INVARIANT = saInvariant('one-transaction-audit-guarantee')

/**
 * The module's own critical-class action, looked up TOTALLY for the same
 * reason `saInvariant` above is: a bare `.find()` returns `undefined` for a
 * wrong id, a renderer swallows it in a `? :`, and the sentence naming this
 * module's critical action simply disappears with every gate still green.
 * A missing member of a closed set this build owns is a programmer error.
 */
function saCriticalAction(id: SaCriticalActionId): SaCriticalActionDefinition {
  const found = CRITICAL_ACTIONS.find((a) => a.id === id)
  if (!found) throw new Error(`Unknown SURF-SA critical action: ${id}`)
  return found
}

const TIER_PUBLICATION = saCriticalAction('tier-publication')

/** Screen states that accompany the content rather than replace it. */
const STATES_THAT_KEEP_CONTENT: readonly ScreenStateId[] = [
  'STATE-03',
  'STATE-06',
  'STATE-08',
  'STATE-09',
  'STATE-10',
  // AC-SA-000-09: with every artificial-intelligence model unavailable the
  // module REMAINS OPERABLE. Nothing in a tier record consults a model, so
  // STATE-11 banners the unavailability and keeps every affordance.
  'STATE-11',
  'STATE-13',
]

const READ_ONLY_CAUSE =
  'Read-only: this console session carries no write authority in this state (STATE-06). One banner, one cause.'

export interface TiersScreenProps {
  readonly initialRole?: SaConsoleRoleToken
  readonly initialScreenState?: ScreenStateId
}

export function TiersScreen({
  initialRole = 'ROLE-PLAT-ROOT',
  initialScreenState = 'STATE-03',
}: TiersScreenProps) {
  const [roleToken, setRoleToken] = useState<SaConsoleRoleToken>(initialRole)
  const [screenStateId, setScreenStateId] = useState<ScreenStateId>(initialScreenState)
  const [selectedRecordId, setSelectedRecordId] = useState<string>(TIER_RECORDS[0].id)
  const [declarationComplete, setDeclarationComplete] = useState(false)
  const [treatment, setTreatment] = useState<GrandfatheringTreatment>('grandfathered')
  const [receipt, setReceipt] = useState<string | null>(null)

  const role = consoleRoleView(roleToken)
  const readOnly = screenStateId === 'STATE-06'
  const showsContent = STATES_THAT_KEEP_CONTENT.includes(screenStateId)

  const selected = TIER_RECORDS.find((r) => r.id === selectedRecordId) ?? TIER_RECORDS[0]

  const mayDeclare = mayAct(GRANDFATHERING_DECLARATION, role.roleId)

  // AC-SA-11-03 is a hard gate, and it binds the ROLE THAT HOLDS THE
  // DECLARATION as much as any other: submission is impossible until the
  // declaration is complete. For a role that cannot declare at all, the role
  // refusal is the deeper and more useful reason, and `ActionControl` reports
  // that one first.
  const submitBlockedReason = readOnly
    ? READ_ONLY_CAUSE
    : !declarationComplete
      ? 'The mandatory grandfathering declaration is not complete. Tier submission is not possible until every tenant already on a tier is declared grandfathered or migrated (L45273, AC-SA-11-03).'
      : undefined

  const tableRows: readonly TableRow[] = TIER_RECORDS.map((r) => ({
    id: r.id,
    state: r.state,
    treatment: r.treatment ?? 'not yet declared',
    effective: r.effectiveFrom,
    approval: r.approvalReference ?? 'none — not published',
    open: (
      <Button variant="secondary" onClick={() => setSelectedRecordId(r.id)}>
        {`Open ${r.id}`}
      </Button>
    ),
  }))

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations: SCR-SA-17 · SB-SA-11 · SCR-SA-14 · the unnumbered per-tenant feature
        panel. Names are canonical; these numbers are annotations and no route is keyed on one. This
        module is named under two incompatible numbering schemes — SCR-SA-17 and SCR-SA-14 — which is
        the reason numbers are annotations here (D1).
      </p>

      <section aria-label="View switchers" className="mt-4 flex flex-wrap gap-6">
        <Select
          label="View as platform role"
          value={roleToken}
          options={CONSOLE_ROLE_VIEWS.map((r) => ({
            value: r.token,
            label: `${r.label} — ${r.token}`,
          }))}
          onChange={(v) => {
            const next = CONSOLE_ROLE_VIEWS.find((r) => r.token === v)
            if (next) setRoleToken(next.token)
          }}
        />
        <Select
          label="Screen state"
          value={screenStateId}
          options={SA_APPLICABLE_STATES.map((s) => ({
            value: s.id,
            label: `${s.id} — ${s.name}`,
          }))}
          onChange={(v) => {
            const next = SA_APPLICABLE_STATES.find((s) => s.id === v)
            if (next) setScreenStateId(next.id)
          }}
        />
      </section>

      <AssignmentAggregate variant={aggregateVariant(screenStateId)} />

      <div className="mt-6">
        <ScreenStateBoundary
          state={screenStateId}
          surface="SURF-SA"
          detail={{
            objectLabel: 'tier record versions',
            whatCreatesIt:
              'An Admin drafts a new tier-record version; the Root Super Admin publishes it as a critical-class act (workflow 23.11, L45248).',
            fieldLabel: 'Grandfathering treatment',
            rule: 'Every tenant already on a tier must be declared grandfathered or migrated before the version can be submitted (AC-SA-11-03).',
            permittedFormat: 'One of exactly two values: grandfathered, or migrated (L45293).',
            decision: {
              ...decisionFor(PUBLISH_TIER_VERSION, 'ADMIN'),
              explanation:
                'Tier publication is critical-class and cannot be performed by an Admin alone (AC-SA-11-02, L45342). The Root Super Admin approves it, and the class cannot be downgraded by any operator (AC-WF-ROLE-018-01, L55969).',
            },
            readOnlyCause: READ_ONLY_CAUSE,
            asOfLabel: `as of ${AS_OF_STALE} (${STALE_AGE}, fixture value)`,
            originLabel: 'seeded tier-record fixture',
            commandState: 'queued',
            degradedMissing:
              'Model-assisted summaries of what a tier version changes are missing.',
            degradedRemaining:
              'The tier records, the grandfathering declaration, the submission and the publication cycle all continue unchanged — none of them consults a model.',
            unavailableCause:
              'Every artificial-intelligence model is unavailable in this state. Tier records, entitlements and caps are deterministic: this module reads, declares, submits and publishes exactly as before (AC-SA-000-09, L42887).',
            failureWhat: 'The tier assignment aggregate could not be read.',
            wasWritten: false,
            nextStep: 'Re-open the module. No tier version was submitted and none was published.',
            recoveryProgress:
              'Recomputing the tier assignment aggregate. The records below are the last read.',
          }}
        />
      </div>

      {showsContent ? (
        <>
          {receipt !== null ? (
            <p role="status" className="mt-6 rounded border border-[var(--color-border)] p-3 text-sm">
              {receipt}
            </p>
          ) : null}

          <section aria-label="The ENFORCED invariant on this screen" className="mt-8">
            <h2 className="text-lg font-semibold">The one-transaction audit guarantee</h2>
            <div className="mt-2">
              <InvariantChip invariant={AUDIT_INVARIANT} />
            </div>
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              A tier publication and its audit event commit together or neither happens. There is no
              control here to switch that off and no approval path to ask for one, for any account
              including the root (AC-SA-INV-003, L47849). It is a status readout, not a switch. This
              is a prototype: no audit guarantee is actually enforced by anything behind this screen.
            </p>
          </section>

          <section aria-label="Tier bands" className="mt-8">
            <h2 className="text-lg font-semibold">The three tier bands</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {TIER_BANDS.map((b) => (
                <li key={b.name}>
                  <span className="font-medium">{b.name}</span> — {b.boundary}. Agent Author:{' '}
                  {b.agentAuthor ? 'gated on, in this band' : 'not carried in this band'}. Job Type
                  and Service Type: ungated in every band.
                </li>
              ))}
            </ul>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Agent Author gates Growth and Enterprise; Job Type and Service Type are ungated
              (AC-SA-11-06, L45342). The Studio reads this gating from the tier record; nothing on
              this screen reaches into a tenant&rsquo;s Studio.
            </p>
          </section>

          <section aria-label="Tier record list" className="mt-8">
            <h2 className="text-lg font-semibold">Tier record versions</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              One fixture row per OBJ-SA-TIER state (L45292), so the closed vocabulary is exercised
              end to end. These are placeholder versions, not a committed set of tiers.
            </p>
            <div className="mt-3">
              <Table
                caption="Tier record versions, by state"
                columns={[
                  { key: 'id', header: 'Version' },
                  { key: 'state', header: 'State' },
                  { key: 'treatment', header: 'Declared treatment' },
                  { key: 'effective', header: 'Effective from' },
                  { key: 'approval', header: 'Approval reference' },
                  { key: 'open', header: 'Record view' },
                ]}
                rows={tableRows}
                emptyState={{
                  title: 'There are no tier record versions yet.',
                  whatCreatesIt: 'An Admin drafts the first version; the root publishes it.',
                }}
              />
            </div>
          </section>

          <section aria-label="Tier record view" className="mt-8">
            <h2 className="text-lg font-semibold">Record view — {selected.id}</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              State: <span className="font-medium text-[var(--color-ink)]">{selected.state}</span>
            </p>

            <h3 className="mt-4 text-base font-semibold">The six field groups</h3>
            <dl className="mt-2 space-y-2">
              {TIER_FIELD_GROUPS.map((g) => (
                <div key={g.name}>
                  <dt className="text-sm font-medium">{g.name}</dt>
                  <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">{g.note}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Price, discount, or any other commercial amount: no such field exists on a tier record, for any account including the root. Tier records carry no price metadata, and pricing, invoicing and payment sit entirely outside the platform (AC-SA-11-01 L45342, L4622). Nothing is greyed out here, because nothing was ever drawn.',
                }}
              />
            </div>

            <h3 className="mt-6 text-base font-semibold">The Worker-Shift definition</h3>
            <p
              data-testid="tier-worker-shift-definition"
              className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]"
            >
              {WORKER_SHIFT_DEFINITION} It is carried on this record, and on every other tier
              record, because the meter has to be contractually visible per tenant (L2193) — the
              definition appears in every tier record (AC-SA-11-05, L45342). It is a definition,
              not a reading: no consumption figure for any tenant is shown here, and the meter
              itself is rendered in MOD-SA-12.
            </p>

            <h3 className="mt-6 text-base font-semibold">
              The mandatory grandfathering declaration
            </h3>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The one control the frozen source defines for this module (L45273). It must be
              completed before tier submission is possible, and it declares how tenants already on a
              tier are treated when this version publishes.
            </p>
            <div className="mt-3 space-y-3">
              {mayDeclare && !readOnly ? (
                <>
                  <Checkbox
                    label={`Grandfathering declaration completed for every tenant already on a tier — treatment: ${treatment}`}
                    checked={declarationComplete}
                    onChange={setDeclarationComplete}
                  />
                  <Select
                    label="Grandfathering treatment"
                    value={treatment}
                    options={GRANDFATHERING_TREATMENTS.map((t) => ({ value: t, label: t }))}
                    onChange={(v) => {
                      const next = GRANDFATHERING_TREATMENTS.find((t) => t === v)
                      if (next) setTreatment(next)
                    }}
                  />
                </>
              ) : (
                <ProhibitionNotice
                  rendering={{
                    kind: 'disabled-with-reason',
                    label: GRANDFATHERING_DECLARATION.label,
                    reason: readOnly
                      ? READ_ONLY_CAUSE
                      : refusalReason(GRANDFATHERING_DECLARATION, role.roleId),
                  }}
                />
              )}
            </div>

            <h3 className="mt-6 text-base font-semibold">Draft and submission</h3>
            <div className="mt-2">
              <ActionControl
                control={SUBMIT_FOR_ROOT_APPROVAL}
                roleId={role.roleId}
                {...(submitBlockedReason !== undefined
                  ? { blockedReason: submitBlockedReason }
                  : {})}
                onAct={() =>
                  setReceipt(
                    `${selected.id}: submitted, and now pending root approval with the treatment declared as ${treatment}. It sits in the single approval queue in MOD-SA-08 under its own class — there is no parallel decision queue (AC-SA-08-09, L44883). Nothing has published.`,
                  )
                }
              />
            </div>

            <h3 className="mt-6 text-base font-semibold">Publication</h3>
            <div data-testid="tier-publication-action-bar" className="mt-2">
              {mayAct(PUBLISH_TIER_VERSION, role.roleId) ? (
                <ActionControl
                  control={PUBLISH_TIER_VERSION}
                  roleId={role.roleId}
                  {...(readOnly ? { blockedReason: READ_ONLY_CAUSE } : {})}
                  onAct={() =>
                    setReceipt(
                      `${selected.id}: published with treatment ${treatment}. The change and its audit event commit in one transaction, or neither happens. In this prototype that is a rendered label on fixture data, not an enforced guarantee.`,
                    )
                  }
                />
              ) : (
                <>
                  <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
                  <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                    {refusalReason(PUBLISH_TIER_VERSION, role.roleId)} The whole action bar is
                    replaced, so no control here can be mistaken for an approval path (L23707).
                  </p>
                </>
              )}
            </div>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              {`${TIER_PUBLICATION.name} is the first of the eleven critical-class actions (${TIER_PUBLICATION.sourceRef}). `}
              {CRITICAL_ACTION_COUNT_NOTE}
            </p>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Where the Root Super Admin is unavailable, a critical-class request waits: it never
              auto-approves, never expires into approval and is never downgraded to a lesser class
              (FB-RBAC-04 L21175, FB-HUMAN-005 L84665, DEC-FB-007 open).
            </p>
          </section>

          <section aria-label="Downgrade queue" className="mt-8">
            <h2 className="text-lg font-semibold">Pending downgrades</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              A downgrade cannot take effect mid-cycle. Where the target ceiling sits below current
              consumption it does not fail and does not truncate: it queues, is labelled pending
              downgrade, and takes effect at the start of the first cycle in which consumption fits
              (AC-GOAL-066 L2241, AC-SA-09-12 L45103, L72062).
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {TENANT_TIER_ASSIGNMENTS.filter((t) => t.pendingDowngradeTo !== null).map((t) => (
                <li key={t.tenantToken}>
                  {t.tenantToken}: {t.band} → {t.pendingDowngradeTo}, pending downgrade. Consumption
                  for the tenant-month {t.tenantMonth} was {t.workerShiftsInMonth} Worker-Shifts,
                  which does not fit the target band.
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-2">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Apply a downgrade now, or force one mid-cycle: no account holds that, including the root. A downgrade taking effect mid-cycle is exactly what AC-GOAL-066 forbids, so there is no control to draw and no state in which one appears.',
                }}
              />
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Request a downgrade: that control belongs to the Tenant Admin on SURF-DOH and records a request only (L26891). It is not a console control and it is not drawn here.',
                }}
              />
            </div>
          </section>

          <section aria-label="Per-tenant feature override" className="mt-8">
            <h2 className="text-lg font-semibold">Per-tenant feature override</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              WF-FEAT-002 (L54658) had no owning module in the source; decision D7 places it here,
              because the override is a flag on the tenant record and never an edit to the tier
              (AC-SA-11-04, L45342). Global feature control stays in MOD-SA-07. This panel is the
              per-tenant feature panel the source puts on the tenant detail page&rsquo;s Overview
              tab, beside the enabled agents and capabilities (L54606).
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Per-tenant feature overrides and their effective state
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="pr-4 font-medium">Tenant</th>
                    <th scope="col" className="pr-4 font-medium">Feature</th>
                    <th scope="col" className="pr-4 font-medium">Tier says</th>
                    <th scope="col" className="pr-4 font-medium">Override flag says</th>
                    <th scope="col" className="pr-4 font-medium">In force</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_OVERRIDES.map((o) => (
                    <tr key={`${o.tenantToken}-${o.feature}`}>
                      <td className="pr-4">{o.tenantToken}</td>
                      <td className="pr-4">{o.feature}</td>
                      <td className="pr-4">{o.tierState}</td>
                      <td className="pr-4">{o.overrideState}</td>
                      <td className="pr-4">
                        {effectiveFeatureState(o)}
                        {o.tierState !== o.overrideState
                          ? ' — the more restrictive of the two, and the disagreement is named'
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The override is a flag on the tenant record and never an edit to the tier
              (AC-WF-FEAT-002-01, L54672). Where the tier and the override disagree, the more
              restrictive state is in force and the ambiguity is named, until DEC-FEAT-004 is decided
              (AC-WF-FEAT-002-03). That is an interim rule, not a resolution.
            </p>

            <div data-testid="feature-override-action-bar" className="mt-3">
              <ActionControl
                control={SET_FEATURE_OVERRIDE}
                roleId={role.roleId}
                {...(readOnly ? { blockedReason: READ_ONLY_CAUSE } : {})}
                onAct={() =>
                  setReceipt(
                    'Per-tenant feature override recorded as a flag on the tenant record. The tier record was not touched. Where it disagrees with the tier, the more restrictive state is in force (AC-WF-FEAT-002-03).',
                  )
                }
              />
            </div>

            <div className="mt-3">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Edit the tier for one tenant: no such action exists, for any account including the root. Per-tenant differences are flags on the tenant record; a tier version is a platform object and is changed only by drafting a new version and publishing it (AC-SA-11-04, L45342).',
                }}
              />
            </div>

            <p className="mt-3 text-sm">
              <Link
                data-testid="tenant-session-request"
                href="/super-admin/support-access/"
                className="text-[var(--color-primary)] underline"
              >
                Request a named access session to see how this override lands inside a tenant
              </Link>
            </p>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Tenants appear here as tokens, and no link on this console reaches record-level tenant
              content. There is no ambient browsing here: the only route into a tenant is one of the
              three named access classes (AC-SA-000-07 L42885, AC-SEC-801 L104316).
            </p>
          </section>

          <section aria-label="Unspecified in source" className="mt-8">
            <h2 className="text-lg font-semibold">Unspecified in source</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The frozen source defines exactly one control for this module. Each entry below is an
              affordance or a value this module would need and the source does not define. Nothing
              has been invented to fill a gap — a plausible invented control reads back as a
              requirement.
            </p>
            <dl className="mt-3 space-y-3">
              {UNSPECIFIED_IN_SOURCE.map((entry) => (
                <div key={entry.what}>
                  <dt className="text-sm font-medium">{entry.what}</dt>
                  <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                    {entry.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : null}
      <RootUnavailableFreeze actions={['tier-publication']} />
    </SaConsoleShell>
  )
}

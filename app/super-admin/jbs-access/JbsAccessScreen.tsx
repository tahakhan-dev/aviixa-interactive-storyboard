'use client'

import { useState } from 'react'
import { saModuleById } from '@/surfaces/sa/modules'
import {
  SA_INVARIANTS,
  type SaInvariantId,
  type SaInvariantDefinition,
} from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES, type SaAccessClassId } from '@/surfaces/sa/access-classes'
import { CRITICAL_ACTION_COUNT_NOTE } from '@/surfaces/sa/critical-actions'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { Button, Checkbox, Select, Table, type TableRow } from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, type PermissionDecision } from '@/policy/decision'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { rolesInDomain, type RoleId } from '@/domain/roles'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-16 — JBS Access (Band B, the operations layer).
 *
 * Screen annotations only (D1 — names are canonical, `SCR-SA-NN` numbers are
 * annotations and no route is keyed on one): SCR-SA-23 "JBS access grants"
 * (L42815) / "JBS access grants list" (L45871), SB-SA-16 (L45871), plus the
 * unnumbered §8.16 console section (L54979).
 *
 * What this module actually is: the third named access class. JBS holds NO
 * standing access to any tenant workspace and none to this console by
 * default (AC-SA-16-01, AC-SEC-807, AC-WF-PLT-003-01). Every touch is
 * scoped, time-boxed, reason-linked, audited, and mirrored into both audit
 * streams. The empty state of this screen is the point of the module.
 *
 * The frozen source defines exactly ONE control here: the revocation
 * control, Root Super Admin and Admin, "revokes a grant at any point, taking
 * effect immediately" (L45871). Two further affordances are forced by hard
 * acceptance criteria rather than invented — grant drafting and submission
 * (AC-SA-16-02, a hard gate on scope + time box + reason) and the approve-
 * and-issue step the roles matrix explicitly withholds from the Admin
 * (L44712, "may not: Approve and issue a JBS grant"). Everything else the
 * module would need is named in the unspecified-in-source panel and drawn
 * nowhere (D15).
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. `ROLE-PLAT-*` is the spec's vocabulary and
 * `RoleId` is this build's; the mapping is written once and every access
 * decision goes through `evaluateAccess` with the `RoleId`.
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
export const APPLICABLE_SCREEN_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/* ------------------------------------------------------------------ *
 * The closed vocabulary the source fixes for this module.
 * ------------------------------------------------------------------ */

/** OBJ-SA-JBSGRANT states, in the source's order (L45890, L45891). */
export type JbsGrantState =
  | 'drafted'
  | 'pending approval'
  | 'issued'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'reconciled'

export const JBS_GRANT_STATES = [
  'drafted',
  'pending approval',
  'issued',
  'active',
  'expired',
  'revoked',
  'reconciled',
] as const satisfies readonly JbsGrantState[]

type MissingFromGrantStates = Exclude<JbsGrantState, (typeof JBS_GRANT_STATES)[number]>
const _grantStatesExhaustive: MissingFromGrantStates extends never ? true : never = true
void _grantStatesExhaustive

/* ------------------------------------------------------------------ *
 * Fixtures. There is no clock on this surface and no ambient `Date.now()`
 * anywhere in the build, so every time value below is a seeded string and
 * is labelled a fixture value on screen.
 *
 * Tenants appear as TOKENS only. No name, no link, no record.
 * ------------------------------------------------------------------ */
const AS_OF_CURRENT = '2026-08-16 09:15 UTC'
const AS_OF_STALE = '2026-08-15 07:45 UTC'
const STALE_AGE = '26 hours old'

export interface JbsGrantFixture {
  readonly id: string
  readonly state: JbsGrantState
  /** Scope by named modules or tenants (L45890). Never a record. */
  readonly scope: readonly string[]
  readonly timeBox: string
  readonly reason: string
}

/**
 * One fixture row per OBJ-SA-JBSGRANT state, so the closed vocabulary is
 * exercised end to end. The two time boxes are the source's own illustrative
 * values: five working days (L45873) and four hours (L55086).
 */
export const JBS_GRANTS = [
  {
    id: 'JBS-GRANT-FIXTURE-0007',
    state: 'drafted',
    scope: ['MOD-SA-02 Atom Registry'],
    timeBox: 'not yet set — required before submission (AC-SA-16-02)',
    reason: 'not yet linked — required before submission (AC-SA-16-02)',
  },
  {
    id: 'JBS-GRANT-FIXTURE-0006',
    state: 'pending approval',
    scope: ['MOD-SA-13 Devices and Fleet'],
    timeBox: 'five working days',
    reason: 'TICKET-FIXTURE-4412 — device command backlog investigation',
  },
  {
    id: 'JBS-GRANT-FIXTURE-0005',
    state: 'issued',
    scope: ['MOD-SA-02 Atom Registry', 'TENANT-FIXTURE-A'],
    timeBox: 'four hours',
    reason: 'TICKET-FIXTURE-4380 — defect investigation',
  },
  {
    id: 'JBS-GRANT-FIXTURE-0004',
    state: 'active',
    scope: ['TENANT-FIXTURE-B'],
    timeBox: 'four hours',
    reason: 'TICKET-FIXTURE-4377 — inbound run mapping defect',
  },
  {
    id: 'JBS-GRANT-FIXTURE-0003',
    state: 'expired',
    scope: ['MOD-SA-05 Eval Harness'],
    timeBox: 'five working days',
    reason: 'TICKET-FIXTURE-4301 — evaluation scenario drift',
  },
  {
    id: 'JBS-GRANT-FIXTURE-0002',
    state: 'revoked',
    scope: ['TENANT-FIXTURE-C'],
    timeBox: 'four hours',
    reason: 'TICKET-FIXTURE-4288 — withdrawn by the client before exercise',
  },
  {
    id: 'JBS-GRANT-FIXTURE-0001',
    state: 'reconciled',
    scope: ['MOD-SA-02 Atom Registry'],
    timeBox: 'five working days',
    reason: 'TICKET-FIXTURE-4180 — registry migration support',
  },
] as const satisfies readonly JbsGrantFixture[]

/**
 * Reconciliation compares granted scope against exercised scope (FB-PLT-003,
 * L55080). Four of these five readings are ones the source says MUST be zero
 * (FB-ROLE-027 L56171, FB-ROLE-029 L56216, AC-SA-16-01 L45938). That makes
 * this the sharpest possible case for AC-SA-01-03: a nought that was read is
 * the whole point, and a nought that was NOT read would be a lie. The two are
 * rendered differently and never interchangeably.
 */
export interface ReconciliationCheck {
  readonly label: string
  readonly count: number
  readonly mustBeZero: boolean
  readonly sourceRef: string
}

export const RECONCILIATION_CHECKS = [
  {
    label: 'Issued or active grants carrying no time box',
    count: 0,
    mustBeZero: true,
    sourceRef: 'FB-ROLE-027 L56171, AC-WF-ROLE-027-01 L56174',
  },
  {
    label: 'Grants exercised past their expiry',
    count: 0,
    mustBeZero: true,
    sourceRef: 'FB-ROLE-029 L56216',
  },
  {
    label: 'Standing grants of any kind, in any environment',
    count: 0,
    mustBeZero: true,
    sourceRef: 'AC-SA-16-01 L45938, AC-SEC-807 L104322',
  },
  {
    label: 'Grants whose exercised scope exceeded the declared scope',
    count: 0,
    mustBeZero: true,
    sourceRef: 'FB-PLT-003 L55080',
  },
  {
    label: 'Grants currently active',
    count: 1,
    mustBeZero: false,
    sourceRef: 'OBJ-SA-JBSGRANT L45890',
  },
] as const satisfies readonly ReconciliationCheck[]

/* ------------------------------------------------------------------ *
 * Access. Every affordance is decided by `evaluateAccess` against
 * per-control allowed roles (D16) — never by a module-level role list,
 * which for this module disagrees with itself across two chunks (L55070
 * names root and Admin; L45875 names all four plus "JBS personnel under a
 * grant") — and never by a hand-rolled role comparison.
 * ------------------------------------------------------------------ */
const DOMAIN_STATE = emptyDomainState(scenarioRunId('MOD-SA-16-fixture'))

const ACTOR_OF_RECORD = 'person-fixture-grant-drafter'

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
 * THE one control the frozen source defines for MOD-SA-16 (L45871):
 * "revocation control (JBS grant)", allowed roles Root Super Admin and
 * Admin, effect "Revokes a grant at any point, taking effect immediately".
 * WF-ROLE-030 (L56233) gives its terminal state: no access by any route.
 */
const REVOKE_GRANT: ControlDefinition = {
  id: 'revoke-jbs-grant',
  label: 'Revoke this grant',
  effect:
    'Revokes a grant at any point, taking effect immediately (L45871). Revocation is initiated with a reason and its terminal state is no access by any route (WF-ROLE-030, L56233).',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['L45871', 'WF-ROLE-030 L56233', 'L44712'],
  refusalReasons: {
    PLATFORM_ENGINEER:
      'The source names only the Root Super Admin and the Admin on the revocation control (L45871). The Platform Engineer is a Band A maker and holds nothing on this grant.',
    SUPPORT:
      'The source names only the Root Super Admin and the Admin on the revocation control (L45871). The Support role reads this module and holds no control on it.',
  },
  defaultRefusalReason:
    'The source names only the Root Super Admin and the Admin on the revocation control (L45871).',
}

/**
 * Forced by AC-SA-16-02 (L45938), a hard gate: "Every grant enumerates its
 * scope, carries a time box, and links a reason before it can be submitted."
 * A hard gate on submission presumes a submission; workflow 23.16 (L45848)
 * names the Admin as the drafter and the root as the approver, and WF-ROLE-027
 * (L56166) names root or Admin as the actor. This is not an invented control —
 * it is the minimum the acceptance criterion forces (D15).
 */
const SUBMIT_GRANT: ControlDefinition = {
  id: 'submit-jbs-grant',
  label: 'Submit this grant for approval',
  effect:
    'Moves a drafted grant to pending approval. Its scope, its time box and its linked reason are all present, or it cannot be submitted (AC-SA-16-02, L45938).',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['AC-SA-16-02 L45938', 'WF-ROLE-027 L56166', 'workflow 23.16 L45848'],
  refusalReasons: {
    PLATFORM_ENGINEER:
      'Workflow 23.16 (L45848) names the Admin as the drafter and the Root Super Admin as the approver, and WF-ROLE-027 (L56166) names the same two. The Platform Engineer appears on neither, so this control exists on the platform and not for this role.',
    SUPPORT:
      'Workflow 23.16 (L45848) names the Admin as the drafter and the Root Super Admin as the approver, and WF-ROLE-027 (L56166) names the same two. The Support role appears on neither, so this control exists on the platform and not for this role.',
  },
  defaultRefusalReason:
    'Workflow 23.16 (L45848) names only the Admin and the Root Super Admin on a grant draft.',
}

/**
 * The roles matrix at L44712 is explicit and unusually direct: the Admin
 * "may not: Approve and issue a JBS grant", in the same may-not list as
 * publishing a tier version and approving a wipe. Workflow 23.16 (L45848)
 * agrees — "Admin (drafts), Root Super Admin (approves and issues)".
 *
 * The CLASS of that act is a different question and it is OPEN.
 * DEC-JBSAUTH-001 (L23081) asks "Is granting JBS access an Admin routine
 * action or a critical-class action?" and its working position is a
 * recommendation, not a decision. So this control renders DISABLED WITH A
 * NAMED REASON naming both the roles matrix and the open decision — the
 * precedent the spec itself sets for an open decision (D8's "proposal only —
 * pending DEC-PAUSE-001"). It deliberately does NOT render the class badge:
 * the badge asserts critical class, and asserting it here would resolve an
 * open client decision on a screen.
 */
const ISSUE_GRANT: ControlDefinition = {
  id: 'approve-and-issue-jbs-grant',
  label: 'Approve and issue this grant',
  effect:
    'Approves a grant pending approval and issues it against its declared scope, time box and reason (workflow 23.16, L45848).',
  allowedRoles: ['ROOT_SUPER_ADMIN'],
  sourceRefs: ['L44712', 'workflow 23.16 L45848', 'WF-SA-JBS-GRANT L15418'],
  refusalReasons: {
    ADMIN:
      'The Admin may not approve and issue a JBS grant (roles matrix, L44712); the Admin drafts and the Root Super Admin approves and issues (workflow 23.16, L45848). Whether that act is an Admin routine action or a critical-class action is undecided — DEC-JBSAUTH-001 is open, and its stated position is a recommendation, not a resolution. No critical-class badge is drawn here, because drawing one would settle that decision on a screen.',
    PLATFORM_ENGINEER:
      'Only the Root Super Admin approves and issues a JBS grant (L44712, workflow 23.16 L45848). The class of that act is undecided — DEC-JBSAUTH-001 is open.',
    SUPPORT:
      'Only the Root Super Admin approves and issues a JBS grant (L44712, workflow 23.16 L45848). The class of that act is undecided — DEC-JBSAUTH-001 is open.',
  },
  defaultRefusalReason:
    'Only the Root Super Admin approves and issues a JBS grant (L44712). The class of that act is undecided — DEC-JBSAUTH-001 is open.',
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
 * DISABLED WITH A NAMED REASON, by rule (spec §3): the action exists on this
 * platform but not for this role, or not in this state. The role refusal is
 * checked first, so a reader is always told the deeper cause. The other two
 * renderings are statements about an action's whole existence and are applied
 * at their own call sites below.
 */
function ActionControl({
  control,
  roleId,
  blockedReason,
  onAct,
}: {
  readonly control: ControlDefinition
  readonly roleId: RoleId
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
 * The reconciliation aggregate. As-of timestamp, degrading to
 * stale-with-age or unavailable. Never zero. Never blank. (AC-SA-01-03.)
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

function ReconciliationAggregate({ variant }: { readonly variant: AggregateVariant }) {
  return (
    <section
      aria-label="Grant reconciliation"
      className="mt-6 rounded border border-[var(--color-border)] p-4"
    >
      <h2 className="text-lg font-semibold">Reconciliation</h2>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Reconciliation compares the granted scope against the exercised scope (FB-PLT-003, L55080).
        Four of the five readings below are ones the source says must be nought.
      </p>

      {variant === 'not-yet-read' ? (
        <p className="mt-2 text-sm">
          Not yet read — this reconciliation has not arrived. A reading that has not arrived is a
          placeholder, never the number nought, and on this screen that difference is the whole
          point: a nought here is a claim that JBS holds nothing.
        </p>
      ) : variant === 'unavailable' ? (
        <p className="mt-2 text-sm">
          Unavailable — this reconciliation could not be read. Its readings are not being shown as
          nought and not being shown as blank. An unread reconciliation must never be mistaken for a
          clean one, because a clean one is precisely a set of noughts. Last read as of{' '}
          {AS_OF_CURRENT} (fixture value).
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            {variant === 'stale'
              ? `Stale — as of ${AS_OF_STALE}, ${STALE_AGE} (fixture value).`
              : `As of ${AS_OF_CURRENT} (fixture value).`}{' '}
            Every number below is a read value, actually read at that moment, not a default.
          </p>
          <dl className="mt-2 grid max-w-3xl grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {RECONCILIATION_CHECKS.map((check) => (
              <div key={check.label} className="contents">
                <dt className="font-medium">{check.count}</dt>
                <dd>
                  {check.label}
                  {check.mustBeZero ? ' — the source requires this reading to be nought' : ''} (
                  {check.sourceRef})
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        These are counts of grants. There is no measurement of an individual person anywhere on this
        screen, no series beneath one tenant, and nothing here compares one person with another.
      </p>
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
    what: 'Whether a JBS grant carries write, or is read-only',
    detail:
      'The source contradicts itself directly (L14877): §8.16 places JBS access under "exactly the same discipline" as the other two classes, §8.15.2 says the compliance-emergency path is "the only one with write capability", and §8.8.5 nevertheless contemplates JBS authoring work inside a tenant, which writes. DEC-JBSWRITE-001 and DEC-HO-JBSWRITE-001 (L23833) are both open. No write control is drawn on this screen, and no claim is made that a grant is read-only either.',
  },
  {
    what: 'The class of the approve-and-issue act',
    detail:
      'DEC-JBSAUTH-001 (L23081) is open: "Is granting JBS access an Admin routine action or a critical-class action?" Its working position — Admin action for a new grant, critical class for an extension — is a recommendation. The eleven critical-class actions the source enumerates (L55942) name no JBS act. The control is therefore rendered disabled with a named reason for every non-root role, and no critical-class badge is drawn, because the badge would assert the answer.',
  },
  {
    what: 'Whether the tenant sees a banner and may end a JBS session itself',
    detail:
      'DEC-EMEREND-001 (L14878, L17364) is open. §8.15.1 attaches the tenant banner and the End-session control explicitly to the normal support session and says nothing about the JBS grant. The recommendation is banner on all three classes and End-session on the JBS grant, but it is not a decision, so neither a banner nor an End-session affordance is depicted here as though it exists.',
  },
  {
    what: 'Whether the Tenant Admin must consent before a JBS grant opens',
    detail:
      'DEC-CONSENT-001 (L15506, L17366) is open, with a recommendation of consent for JBS grants only. No consent step is drawn in the grant lifecycle on this screen, because drawing one would assert a decision the client has not made.',
  },
  {
    what: 'The states of OBJ-SA-JBSSESSION',
    detail:
      'The object exists (L45890) with its own named platform audit event class and its mirroring relationships, and its state list in the source is empty. The grant has seven states and they are rendered; the session has none stated, so no session state vocabulary is drawn and no session lifecycle is depicted.',
  },
  {
    what: 'How a JBS grantee is named on a grant',
    detail:
      'Every grant relates to a scope, a time box, a linked reason and a session (L45890). No field, control or workflow anywhere names how the individual JBS person who will exercise the grant is identified or attached to it. No grantee field is drawn.',
  },
  {
    what: 'Who performs reconciliation, and when',
    detail:
      'Reconciliation is a terminal state of workflow 23.16 (L45848) and the recovery step of FB-PLT-003 (L55080) and FB-ROLE-029 (L56216). No actor, no trigger and no control is named for it anywhere, so the readings are rendered and no control claims to run a reconciliation.',
  },
  {
    what: 'Acceptance criteria AC-SA-16-03, AC-SA-16-04 and AC-SA-16-05',
    detail:
      'The extraction carries AC-SA-16-01, -02 and -06 at L45938. The three gaps in between are not represented anywhere this build can read, and no affordance on this screen stands in for them.',
  },
  {
    what: 'The seven FUNC-SA-16 function identifiers',
    detail:
      'L45875 names FUNC-SA-16-01-A1, -01-A2, -01-A3, -02-A1, -02-A2, -03-A1 and -03-A2 as this module’s key functions and describes none of them. Seven named-but-undescribed functions are not seven controls, and nothing on this screen stands in for them.',
  },
  {
    what: 'A filter, a sort or a search on the grants list',
    detail:
      'The source names no facet for this list anywhere. The list is short and complete; no filter has been invented to make the screen look like a real console.',
  },
] as const satisfies readonly UnspecifiedEntry[]

/* ------------------------------------------------------------------ *
 * The screen.
 * ------------------------------------------------------------------ */
const MODULE = saModuleById('MOD-SA-16')

/**
 * Looked up TOTALLY, not with a bare `.find()` whose `undefined` a renderer
 * would silently swallow: a missing member of a closed set this build owns is
 * a programmer error, not an expected path. (MOD-SA-11 shipped a draft where
 * a mistyped invariant id rendered no chip at all and blinded the R2 gate.)
 */
function saInvariant(id: SaInvariantId): SaInvariantDefinition {
  const found = SA_INVARIANTS.find((i) => i.id === id)
  if (!found) throw new Error(`Unknown SURF-SA invariant: ${id}`)
  return found
}

function accessClass(id: SaAccessClassId) {
  const found = ACCESS_CLASSES.find((c) => c.id === id)
  if (!found) throw new Error(`Unknown SURF-SA access class: ${id}`)
  return found
}

const AUDIT_INVARIANT = saInvariant('one-transaction-audit-guarantee')
const JBS_CLASS = accessClass('jbs-access-grant')

/** Screen states that accompany the content rather than replace it. */
const STATES_THAT_KEEP_CONTENT: readonly ScreenStateId[] = [
  'STATE-03',
  'STATE-06',
  'STATE-08',
  'STATE-09',
  'STATE-10',
  // AC-SA-000-09: with every artificial-intelligence model unavailable the
  // module REMAINS OPERABLE. Nothing in a grant consults a model, so STATE-11
  // banners the unavailability and keeps every affordance.
  'STATE-11',
  'STATE-13',
]

const READ_ONLY_CAUSE =
  'Read-only: this console session carries no write authority in this state (STATE-06). One banner, one cause.'

export interface JbsAccessScreenProps {
  readonly initialRole?: SaConsoleRoleToken
  readonly initialScreenState?: ScreenStateId
}

export function JbsAccessScreen({
  initialRole = 'ROLE-PLAT-ROOT',
  initialScreenState = 'STATE-03',
}: JbsAccessScreenProps) {
  const [roleToken, setRoleToken] = useState<SaConsoleRoleToken>(initialRole)
  const [screenStateId, setScreenStateId] = useState<ScreenStateId>(initialScreenState)
  const [scopeDeclared, setScopeDeclared] = useState(false)
  const [timeBoxDeclared, setTimeBoxDeclared] = useState(false)
  const [reasonLinked, setReasonLinked] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)

  const role = consoleRoleView(roleToken)
  const readOnly = screenStateId === 'STATE-06'
  const showsContent = STATES_THAT_KEEP_CONTENT.includes(screenStateId)

  const mayDraft = mayAct(SUBMIT_GRANT, role.roleId)

  // AC-SA-16-02 is a hard gate and it binds the roles that HOLD the draft as
  // much as any other: all three or no submission. For a role that cannot
  // draft at all, the role refusal is the deeper cause and `ActionControl`
  // reports that one first.
  const missing = [
    scopeDeclared ? null : 'its scope',
    timeBoxDeclared ? null : 'its time box',
    reasonLinked ? null : 'its linked reason',
  ].filter((m): m is string => m !== null)

  const submitBlockedReason = readOnly
    ? READ_ONLY_CAUSE
    : missing.length > 0
      ? `This draft is missing ${missing.join(', ')}. Every grant enumerates its scope, carries a time box and links a reason before it can be submitted (AC-SA-16-02, L45938). A grant committing with no time box would create standing access, which is refused at validation (FB-ROLE-027, L56171).`
      : undefined

  const grantRows: readonly TableRow[] = JBS_GRANTS.map((g) => ({
    id: g.id,
    state: g.state,
    scope: g.scope.join(' · '),
    timeBox: g.timeBox,
    reason: g.reason,
  }))

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations: SCR-SA-23 · SB-SA-16 · the unnumbered §8.16 console section (L54979).
        Names are canonical; these numbers are annotations and no route is keyed on one (D1).
      </p>

      <section aria-label="View switchers" className="mt-4 flex flex-wrap gap-6">
        <Select
          label="Console role (a view switcher, not a sign-in)"
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
          options={APPLICABLE_SCREEN_STATES.map((s) => ({
            value: s.id,
            label: `${s.id} — ${s.name}`,
          }))}
          onChange={(v) => {
            const next = APPLICABLE_SCREEN_STATES.find((s) => s.id === v)
            if (next) setScreenStateId(next.id)
          }}
        />
      </section>

      <ReconciliationAggregate variant={aggregateVariant(screenStateId)} />

      <div className="mt-6">
        <ScreenStateBoundary
          state={screenStateId}
          surface="SURF-SA"
          detail={{
            objectLabel: 'JBS access grants',
            whatCreatesIt:
              'Nothing has created one, and that is the resting state of this module: JBS holds nothing. An Admin drafts a grant with a scope, a time box and a linked reason; the Root Super Admin approves and issues it (workflow 23.16, L45848). Until then there is no standing access and no default grant in any environment (AC-SA-16-01).',
            fieldLabel: 'Time box',
            rule: 'Every grant enumerates its scope, carries a time box and links a reason before it can be submitted (AC-SA-16-02, L45938).',
            permittedFormat:
              'A bounded period, such as the source’s own examples of four hours (L55086) or five working days (L45873). An unbounded value is refused at validation, because it would create standing access (FB-ROLE-027).',
            decision: {
              ...decisionFor(ISSUE_GRANT, 'ADMIN'),
              explanation:
                'The Admin may not approve and issue a JBS grant (roles matrix, L44712). The Admin drafts; the Root Super Admin approves and issues (workflow 23.16, L45848).',
            },
            readOnlyCause: READ_ONLY_CAUSE,
            asOfLabel: `as of ${AS_OF_STALE} (${STALE_AGE}, fixture value)`,
            originLabel: 'seeded JBS grant fixture',
            commandState: 'queued',
            degradedMissing:
              'Model-assisted summaries of what a grant’s exercised scope contained are missing.',
            degradedRemaining:
              'The grants list, the draft gate, the approve-and-issue step, revocation and reconciliation all continue unchanged — none of them consults a model.',
            unavailableCause:
              'Every artificial-intelligence model is unavailable in this state. Grant machinery is deterministic and consults no model: this module reads, drafts, submits, issues, revokes and reconciles exactly as before (AC-SA-000-09, L42887).',
            failureWhat: 'The grant reconciliation could not be read.',
            wasWritten: false,
            nextStep: 'Re-open the module. No grant was submitted, issued or revoked.',
            recoveryProgress:
              'Recomputing the grant reconciliation. The grants below are the last read.',
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

          <section aria-label="Standing access" className="mt-8">
            <h2 className="text-lg font-semibold">No standing access</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              {JBS_CLASS.name} is the third of the three named access classes. JBS holds no standing
              access to any tenant workspace and none to this console by default, and no default
              grant exists in any environment (AC-SA-16-01 L45938, AC-SEC-807 L104322,
              AC-WF-PLT-003-01 L55084). Every JBS touch is scoped, time-boxed, reason-linked, audited
              and mirrored into both audit streams (L4627).
            </p>
            <div className="mt-3">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Grant JBS standing access, or turn on a default grant: no such control exists, for any account including the root. AC-SA-16-01 is a hard gate at the grant machinery itself, so there is nothing to grey out here — nothing was ever drawn.',
                }}
              />
            </div>
          </section>

          <section aria-label="JBS access grants" className="mt-8">
            <h2 className="text-lg font-semibold">JBS access grants</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              One fixture row per OBJ-SA-JBSGRANT state (L45890), so the closed vocabulary of seven
              is exercised end to end: {JBS_GRANT_STATES.join(' → ')}. All four console roles read
              this list; what each may do to a row is decided per control, never by a module-level
              role list (D16).
            </p>
            <div className="mt-3">
              <Table
                caption="JBS access grants, by state"
                columns={[
                  { key: 'id', header: 'Grant' },
                  { key: 'state', header: 'State' },
                  { key: 'scope', header: 'Declared scope' },
                  { key: 'timeBox', header: 'Time box' },
                  { key: 'reason', header: 'Linked reason' },
                ]}
                rows={grantRows}
                emptyState={{
                  title: 'There are no JBS access grants.',
                  whatCreatesIt:
                    'An Admin drafts one; the Root Super Admin approves and issues it. Until then JBS holds nothing.',
                }}
              />
            </div>
            <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Scope is by named modules or tenants (L45890). Tenants appear as tokens and nothing on
              this console reaches record-level tenant content: there is no ambient browsing here,
              and the only route into a tenant is one of the three named access classes
              (AC-SA-000-07 L42885, AC-SEC-801 L104316).{' '}
              <a
                data-testid="tenant-session-request"
                href="#request-a-jbs-grant"
                className="text-[var(--color-primary)] underline"
              >
                Request a scoped, time-boxed grant instead
              </a>
              .
            </p>
          </section>

          <section aria-label="Grant draft" className="mt-8">
            <h2 id="request-a-jbs-grant" className="text-lg font-semibold">
              Request a JBS grant
            </h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Three declarations, all required before submission, and the requirement is a hard gate
              at draft validation (AC-SA-16-02, L45938; AC-WF-ROLE-027-01, L56174). This is the
              session-request form for this access class — it produces a request, never a session and
              never a view of tenant content.
            </p>
            <div className="mt-3 space-y-2">
              {mayDraft && !readOnly ? (
                <>
                  <Checkbox
                    label="Scope declared — named modules or tenants"
                    checked={scopeDeclared}
                    onChange={setScopeDeclared}
                  />
                  <Checkbox
                    label="Time box declared — a bounded period, never open-ended"
                    checked={timeBoxDeclared}
                    onChange={setTimeBoxDeclared}
                  />
                  <Checkbox
                    label="Reason linked — a ticket-linked reason"
                    checked={reasonLinked}
                    onChange={setReasonLinked}
                  />
                </>
              ) : (
                <ProhibitionNotice
                  rendering={{
                    kind: 'disabled-with-reason',
                    label: 'Declare scope, time box and reason',
                    reason: readOnly ? READ_ONLY_CAUSE : refusalReason(SUBMIT_GRANT, role.roleId),
                  }}
                />
              )}
            </div>
            <div data-testid="submit-grant-action-bar" className="mt-4">
              <ActionControl
                control={SUBMIT_GRANT}
                roleId={role.roleId}
                {...(submitBlockedReason !== undefined
                  ? { blockedReason: submitBlockedReason }
                  : {})}
                onAct={() =>
                  setReceipt(
                    'Grant submitted and now pending approval, with its scope, time box and linked reason all declared. Nothing has been issued and JBS still holds nothing. It waits in the single approval queue in MOD-SA-08.',
                  )
                }
              />
            </div>
          </section>

          <section aria-label="Approve and issue" className="mt-8">
            <h2 className="text-lg font-semibold">Approve and issue</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The Admin drafts; the Root Super Admin approves and issues (workflow 23.16, L45848).
              The roles matrix states it directly: the Admin may not approve and issue a JBS grant
              (L44712).
            </p>
            <div data-testid="issue-grant-action-bar" className="mt-3">
              <ActionControl
                control={ISSUE_GRANT}
                roleId={role.roleId}
                {...(readOnly ? { blockedReason: READ_ONLY_CAUSE } : {})}
                onAct={() =>
                  setReceipt(
                    'Grant approved and issued against its declared scope and time box. Its exercise will be reconciled against that scope, and the grant will expire at its time box whether or not the work is finished.',
                  )
                }
              />
            </div>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Whether this act is an Admin routine action or a critical-class action is undecided:
              DEC-JBSAUTH-001 (L23081) is open and its stated position is a recommendation. No
              critical-class badge is drawn on this action bar, because the badge asserts the class
              and the class is exactly what has not been decided. For reference, the enumerated
              critical-class list names no JBS act. {CRITICAL_ACTION_COUNT_NOTE}
            </p>
          </section>

          <section aria-label="Revocation" className="mt-8">
            <h2 className="text-lg font-semibold">Revocation</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The one control the frozen source defines for this module (L45871): revokes a grant at
              any point, taking effect immediately. Root Super Admin and Admin.
            </p>
            <div data-testid="revoke-grant-action-bar" className="mt-3">
              <ActionControl
                control={REVOKE_GRANT}
                roleId={role.roleId}
                {...(readOnly ? { blockedReason: READ_ONLY_CAUSE } : {})}
                onAct={() =>
                  setReceipt(
                    'Grant revoked with its reason recorded, taking effect immediately. The terminal state is no access by any route (WF-ROLE-030, L56233). In this prototype that is a rendered label on fixture data, not an enforced revocation.',
                  )
                }
              />
            </div>
          </section>

          <section aria-label="Expiry and extension" className="mt-8">
            <h2 className="text-lg font-semibold">Expiry</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              A grant expires at its time box, and the expiry job is the actor — no console role is
              (WF-ROLE-029, L56211). Where a grant expires mid-task the first fallback is a fresh
              scoped grant; where that fails, the client’s own platform team performs the work, and
              the terminal safe state is no access, work paused, and the request visible in the
              approval queue (FB-PLT-003, L55080). Where the expiry job does not run, expiry happens
              on the next pass or the grant is revoked explicitly, with any overrun recorded for
              investigation (FB-ROLE-029, L56216).
            </p>
            <div className="mt-3">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Extend a grant, or push out its time box: no such control exists, for any account including the root. An expired grant never extends itself (WF-PLT-003, L55070) and the source’s own fallback is a fresh scoped grant with its own reason, not more time on an old one. Nothing is greyed out here, because nothing was ever drawn.',
                }}
              />
            </div>
          </section>

          <section aria-label="Root custody" className="mt-8">
            <h2 className="text-lg font-semibold">Custody of the root account</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Custody of the root account rests with the client, and JBS cannot hold it (AC-SA-16-06,
              L45938; AC-WF-PLT-003-01, L55084). A grant is scoped, time-boxed and reason-linked; it
              is never a route to the one root account.
            </p>
            <div className="mt-3">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Transfer, delegate or share custody of the root account with JBS: no such control exists, for any account including the root itself. AC-SA-16-06 is a hard gate on the access model, not a permission this console can hold.',
                }}
              />
            </div>
          </section>

          <section aria-label="Mirroring" className="mt-8">
            <h2 className="text-lg font-semibold">Mirroring into both streams</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              A JBS session carries its own named platform audit event class and is mirrored into
              every affected tenant’s own audit stream and its Platform Access History screen
              (OBJ-SA-JBSSESSION, L45890; L4627; L6983). Both streams, every time — a class cannot be
              omitted from a filter or an export. The platform audit stream is rendered in MOD-SA-18;
              the tenant’s own stream and its Platform Access History belong to the tenant.
            </p>
          </section>

          <section aria-label="The ENFORCED invariant on this screen" className="mt-8">
            <h2 className="text-lg font-semibold">The one-transaction audit guarantee</h2>
            <div className="mt-2">
              <InvariantChip invariant={AUDIT_INVARIANT} />
            </div>
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              A grant transition and its audit record commit together or neither happens. There is no
              control here to switch that off and no approval path to ask for one, for any account
              including the root (AC-SA-INV-003, L47849). It is a status readout, not a switch. This
              is a prototype: no audit guarantee is enforced by anything behind this screen.
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
    </SaConsoleShell>
  )
}

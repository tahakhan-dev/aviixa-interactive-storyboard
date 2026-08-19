'use client'

import { useState } from 'react'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { type ScreenStateId } from '@/ui/screen-state'
import { Button, Select, Table, type TableRow } from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, type PermissionDecision } from '@/policy/decision'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import type { RoleId } from '@/domain/roles'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-02 — the Atom Registry (Band A, the definition layer).
 *
 * Screen annotations only (D1: names are canonical, `SCR-SA-NN` numbers are
 * annotations and no route is keyed on one): SCR-SA-02 "registry list and
 * atom detail" (L42794), SB-SA-02 (L43158), SCR-SA-ATOMS / SCR-SA-ATOMDETAIL
 * (L86893), SCR-SA-ATOM-ENABLE (L65479).
 *
 * The whole module is browsable and read-only in the sense that matters:
 * nothing here applies a change. Every mutating affordance the source names
 * opens a change request into the maker-checker cycle instead, and the one
 * affordance a reader most expects — creating an atom — exists for nobody,
 * including the root (`AC-SA-02-01`, L43253; `AC-AI-007-1`, L86948).
 */

/* ------------------------------------------------------------------ *
 * The four platform roles, and the one place the source's role tokens
 * meet this build's `RoleId`s. The spec and census name the console roles
 * `ROLE-PLAT-ROOT` / `-ADMIN` / `-ENG` / `-SUP`; `@/domain/roles` names
 * the same four `ROOT_SUPER_ADMIN` / `ADMIN` / `PLATFORM_ENGINEER` /
 * `SUPPORT`. Neither vocabulary is wrong; they must simply never be
 * conflated, so the mapping is written once, here, and every access
 * decision below goes through `evaluateAccess` with the `RoleId`.
 * ------------------------------------------------------------------ */
export type SaConsoleRoleToken =
  | 'ROLE-PLAT-ROOT'
  | 'ROLE-PLAT-ADMIN'
  | 'ROLE-PLAT-ENG'
  | 'ROLE-PLAT-SUP'

export interface SaConsoleRole {
  readonly token: SaConsoleRoleToken
  readonly roleId: RoleId
  readonly label: string
}

export const CONSOLE_ROLES = [
  { token: 'ROLE-PLAT-ROOT', roleId: 'ROOT_SUPER_ADMIN', label: 'Root Super Admin' },
  { token: 'ROLE-PLAT-ADMIN', roleId: 'ADMIN', label: 'Admin' },
  { token: 'ROLE-PLAT-ENG', roleId: 'PLATFORM_ENGINEER', label: 'Platform Engineer' },
  { token: 'ROLE-PLAT-SUP', roleId: 'SUPPORT', label: 'Support' },
] as const satisfies readonly SaConsoleRole[]

type MissingFromConsoleRoles = Exclude<SaConsoleRoleToken, (typeof CONSOLE_ROLES)[number]['token']>
const _consoleRolesExhaustive: MissingFromConsoleRoles extends never ? true : never = true
void _consoleRolesExhaustive

function consoleRole(token: SaConsoleRoleToken): SaConsoleRole {
  const found = CONSOLE_ROLES.find((r) => r.token === token)
  if (!found) throw new Error(`Unknown console role: ${token}`)
  return found
}

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */

/* ------------------------------------------------------------------ *
 * OBJ-SA-ATOM's seven states (L43178) and OBJ-SA-SCENARIO's three
 * verdicts (L43725) — both closed vocabularies in the source, so both get
 * a real exhaustiveness check rather than a widening annotation.
 * ------------------------------------------------------------------ */
export type AtomState =
  | 'registered'
  | 'evals passing'
  | 'pending approval'
  | 'enabled platform-wide'
  | 'enabled per tenant'
  | 'flagged'
  | 'disabled'

export const ATOM_STATES = [
  'registered',
  'evals passing',
  'pending approval',
  'enabled platform-wide',
  'enabled per tenant',
  'flagged',
  'disabled',
] as const satisfies readonly AtomState[]

type MissingFromAtomStates = Exclude<AtomState, (typeof ATOM_STATES)[number]>
const _atomStatesExhaustive: MissingFromAtomStates extends never ? true : never = true
void _atomStatesExhaustive

export type EvalVerdict = 'pending' | 'passing' | 'failing'

export const EVAL_VERDICTS = ['pending', 'passing', 'failing'] as const satisfies readonly EvalVerdict[]

type MissingFromEvalVerdicts = Exclude<EvalVerdict, (typeof EVAL_VERDICTS)[number]>
const _evalVerdictsExhaustive: MissingFromEvalVerdicts extends never ? true : never = true
void _evalVerdictsExhaustive

export interface AtomFixture {
  readonly id: string
  readonly state: AtomState
  readonly evalVerdict: EvalVerdict
  /** `AC-AI-007-1` (L86948): every atom traces to a migration reference. */
  readonly migrationRef: string
  /** Tenant tokens only. Never a link, never record-level content. */
  readonly tenantsEnabled: readonly string[]
}

/**
 * Placeholder rows, and labelled as such on screen. The frozen source's own
 * catalogue of fourteen atoms is "explicitly not a committed set" (L43116,
 * L86897) and its names are not carried in the extraction this build reads,
 * so naming fourteen plausible capabilities here would ship a fiction that
 * reads back as a requirement. What these rows DO carry is the part the
 * source does fix: one row per OBJ-SA-ATOM state, so the registry exercises
 * the whole closed vocabulary and the status filter can never be vacuous.
 */
export const ATOM_FIXTURES = [
  {
    id: 'ATOM-FIXTURE-01',
    state: 'enabled platform-wide',
    evalVerdict: 'passing',
    migrationRef: 'MIG-2026-02-11-004',
    tenantsEnabled: [],
  },
  {
    id: 'ATOM-FIXTURE-02',
    state: 'enabled per tenant',
    evalVerdict: 'passing',
    migrationRef: 'MIG-2026-03-02-001',
    tenantsEnabled: ['TENANT-FIXTURE-A', 'TENANT-FIXTURE-B'],
  },
  {
    id: 'ATOM-FIXTURE-03',
    state: 'pending approval',
    evalVerdict: 'passing',
    migrationRef: 'MIG-2026-05-19-002',
    tenantsEnabled: [],
  },
  {
    id: 'ATOM-FIXTURE-04',
    state: 'registered',
    evalVerdict: 'failing',
    migrationRef: 'MIG-2026-06-04-003',
    tenantsEnabled: [],
  },
  {
    id: 'ATOM-FIXTURE-05',
    state: 'flagged',
    evalVerdict: 'pending',
    migrationRef: 'MIG-2026-06-22-001',
    tenantsEnabled: [],
  },
  {
    id: 'ATOM-FIXTURE-06',
    state: 'evals passing',
    evalVerdict: 'passing',
    migrationRef: 'MIG-2026-07-08-005',
    tenantsEnabled: [],
  },
  {
    id: 'ATOM-FIXTURE-07',
    state: 'disabled',
    evalVerdict: 'passing',
    migrationRef: 'MIG-2026-07-30-002',
    tenantsEnabled: [],
  },
] as const satisfies readonly AtomFixture[]

/* ------------------------------------------------------------------ *
 * Access. Every affordance below is decided by `evaluateAccess` against
 * per-control allowed roles (D16) — never by a module-level role list,
 * and never by a hand-rolled `role === 'ADMIN'` check.
 * ------------------------------------------------------------------ */
const DOMAIN_STATE = emptyDomainState(scenarioRunId('MOD-SA-02-fixture'))

/** The one simulated person this view-switcher stands in for. */
const ACTOR_OF_RECORD = 'person-fixture-maker'

function accessContext(roleId: RoleId) {
  return {
    state: DOMAIN_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A platform-domain role holds no ambient tenant. That is the whole
      // point of §7: tenant content is reachable only inside a named access
      // class, never ambiently from this console.
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
  /** Verbatim from the source's own control rows. */
  readonly effect: string
  readonly allowedRoles: readonly RoleId[]
  readonly sourceRefs: readonly string[]
  /**
   * Set only where the source itself states that this role does not both
   * make and approve — the segregation-of-duties denial is then a real
   * `evaluateAccess` stage-9 outcome, not a string in a component.
   */
  readonly makerCheckerOf?: string
  /**
   * A role-scoped ABSENT, used ONLY where the frozen source states one.
   * L43158 states exactly this split for tenant enablement: "Admin sees it
   * disabled, Support sees it absent."
   */
  readonly absentFor?: readonly RoleId[]
  readonly absentForNote?: string
  /** Why a role that may not act may not act. Per role, then the fallback. */
  readonly refusalReasons?: Readonly<Partial<Record<RoleId, string>>>
  readonly defaultRefusalReason: string
}

const SUBMIT_PLATFORM_ENABLEMENT: ControlDefinition = {
  id: 'submit-platform-enablement',
  label: 'Submit platform enablement change',
  effect:
    'Opens a change request rather than performing a change. Enable and disable both travel this cycle; it shows pending and never applies silently (L43158, L86893).',
  allowedRoles: ['PLATFORM_ENGINEER', 'ROOT_SUPER_ADMIN'],
  sourceRefs: ['L43158', 'L86893', 'AC-SA-02-03 L43255'],
  refusalReasons: {
    ADMIN:
      'The Admin is the approver in this cycle, never the maker — a Platform Engineer submits the change and an Admin approves it (L65490, L86893).',
    SUPPORT: 'The Support role carries no enablement action in the atom registry (L43158).',
  },
  defaultRefusalReason: 'This console role does not carry the enablement action (L43158).',
}

const SUBMIT_TENANT_ENABLEMENT: ControlDefinition = {
  id: 'submit-tenant-enablement',
  label: 'Submit tenant enablement change',
  effect:
    'Opens a change request scoped to one tenant. Per-tenant enablement bounds what an agent that declares this atom may do (L43158, L21284).',
  allowedRoles: ['PLATFORM_ENGINEER', 'ROOT_SUPER_ADMIN'],
  sourceRefs: ['L43158'],
  absentFor: ['SUPPORT'],
  absentForNote:
    'Submitting a tenant enablement change is not part of the Support role’s view of this registry (L43158). Nothing is drawn here, and nothing is greyed.',
  refusalReasons: {
    ADMIN:
      'The Admin is the approver in this cycle, never the maker (L43158 states this control disabled for the Admin).',
  },
  defaultRefusalReason: 'This console role does not carry the enablement action (L43158).',
}

const RUN_EVALUATION_SCENARIOS: ControlDefinition = {
  id: 'run-evaluation-scenarios',
  label: 'Run the evaluation scenarios',
  effect: 'Runs the scenario set and attaches the evidence (L65489).',
  allowedRoles: ['PLATFORM_ENGINEER'],
  sourceRefs: ['L65489'],
  defaultRefusalReason:
    'The source names the Platform Engineer alone on this control (L65489). Running a scenario set is Band A engineering work.',
}

const ENABLE_DIRECTLY: ControlDefinition = {
  id: 'enable-directly',
  label: 'Enable directly',
  effect: 'Would apply an enablement without the approval cycle.',
  // The source's own `allowed_roles` for this control is EMPTY (L65490):
  // it is drawn so a reader can see that the direct path was considered
  // and refused, and it is inert for every account including the root.
  allowedRoles: [],
  sourceRefs: ['L65490'],
  defaultRefusalReason:
    'Platform Engineer changes are submitted and approved by an Admin (L65490). No account holds a direct-apply path here, including the root.',
}

const APPROVE_OWN_SUBMISSION: ControlDefinition = {
  id: 'approve-own-submission',
  label: 'Approve your own submission',
  effect: 'Would close the maker-checker cycle with one person.',
  allowedRoles: ['ADMIN', 'ROOT_SUPER_ADMIN'],
  // The refusal is produced by stage 9 of `evaluateAccess`, not asserted
  // here: the maker of the pending change IS this simulated actor, so the
  // same person cannot also approve it.
  makerCheckerOf: ACTOR_OF_RECORD,
  sourceRefs: ['L65490'],
  defaultRefusalReason:
    'The approver must be an Admin, and never the maker (L65490). The same person cannot both make and approve this change.',
}

function decisionFor(control: ControlDefinition, roleId: RoleId): PermissionDecision {
  return evaluateAccess(
    {
      action: control.id,
      allowedRoles: control.allowedRoles,
      ...(control.makerCheckerOf !== undefined ? { makerCheckerOf: control.makerCheckerOf } : {}),
      sourceRefs: control.sourceRefs,
    },
    accessContext(roleId),
  )
}

function refusalReason(control: ControlDefinition, roleId: RoleId): string {
  return control.refusalReasons?.[roleId] ?? control.defaultRefusalReason
}

/**
 * One control, rendered by rule (spec §3):
 *
 * - ABSENT — nothing drawn, one line where the control would be. Used here
 *   only where the source states the absence.
 * - DISABLED WITH A NAMED REASON — drawn, inert, reason in text. This is the
 *   default for "exists on this platform, but not for this role or not in
 *   this state", which covers every refusal in this module.
 * - CLASS BADGE — not used in this module: no control here is one of the
 *   eleven critical-class actions. See the note on the action bar.
 */
function ActionControl({
  control,
  roleId,
  readOnlyCause,
  onAct,
}: {
  readonly control: ControlDefinition
  readonly roleId: RoleId
  readonly readOnlyCause?: string
  readonly onAct?: () => void
}) {
  if (control.absentFor?.includes(roleId)) {
    return (
      <ProhibitionNotice
        rendering={{ kind: 'absent', note: control.absentForNote ?? control.defaultRefusalReason }}
      />
    )
  }

  const decision = decisionFor(control, roleId)
  if (!permitsAction(decision)) {
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

  if (readOnlyCause !== undefined) {
    return (
      <ProhibitionNotice
        rendering={{ kind: 'disabled-with-reason', label: control.label, reason: readOnlyCause }}
      />
    )
  }

  return (
    <div>
      <Button {...(onAct !== undefined ? { onClick: onAct } : {})}>{control.label}</Button>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{control.effect}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The aggregate. Fixture values, labelled as fixture values: there is no
 * clock on this surface and no ambient `Date.now()` anywhere in the build.
 * ------------------------------------------------------------------ */
const AS_OF_CURRENT = '2026-08-16 09:15 UTC'
const AS_OF_STALE = '2026-08-15 07:45 UTC'
const STALE_AGE = '26 hours old'

type AggregateVariant = 'current' | 'stale' | 'not-yet-read' | 'unavailable' | 'empty'

function aggregateVariant(state: ScreenStateId): AggregateVariant {
  switch (state) {
    // STATE-01 says the registry holds nothing. The aggregate reads the same
    // registry the table reads, so it must say the same thing: a count of the
    // fixture rows here would assert a populated registry and an empty one on
    // one screen. Stated in words, never as the number nought.
    case 'STATE-01':
      return 'empty'
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

function RegistryAggregate({ variant }: { readonly variant: AggregateVariant }) {
  const total = ATOM_FIXTURES.length
  const byState = ATOM_STATES.map((s) => ({
    state: s,
    count: ATOM_FIXTURES.filter((a) => a.state === s).length,
  })).filter((row) => row.count > 0)

  return (
    <section aria-label="Registry aggregate" className="mt-6 rounded border border-[var(--color-border)] p-4">
      <h2 className="text-lg font-semibold">Atoms in the registry</h2>
      {variant === 'not-yet-read' ? (
        <p className="mt-2 text-sm">
          Not yet read — the count has not arrived. A count that has not arrived is a placeholder, never
          the number nought.
        </p>
      ) : variant === 'empty' ? (
        <p className="mt-2 text-sm">
          No atoms are registered yet — as of {AS_OF_CURRENT} (fixture value). A backend migration
          registers an atom.
        </p>
      ) : variant === 'unavailable' ? (
        <p className="mt-2 text-sm">
          Unavailable — this aggregate could not be read. Last known as of {AS_OF_CURRENT} (fixture value).
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            <strong>{total}</strong> atoms ·{' '}
            {variant === 'stale'
              ? `stale — as of ${AS_OF_STALE}, ${STALE_AGE} (fixture value)`
              : `as of ${AS_OF_CURRENT} (fixture value)`}
          </p>
          <ul className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-ink-muted)]">
            {byState.map((row) => (
              <li key={row.state}>
                {row.state}: {row.count}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        A registry count, and nothing beneath it. This console renders no measure below tenant-month
        anywhere, and no measure of a person.
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * What the source does not define. Named, not invented.
 * ------------------------------------------------------------------ */
export interface UnspecifiedEntry {
  readonly what: string
  readonly detail: string
}

export const UNSPECIFIED_IN_SOURCE = [
  {
    what: 'The fourteen fields of the atom record',
    detail:
      'Enumerated in the frozen source at L86844, but not carried in the extraction this build reads. The registry shows only the fields the extraction does name — state, evaluation verdict, migration reference and per-tenant enablement — rather than fourteen invented column headings.',
  },
  {
    what: 'The domain-grouping vocabulary',
    detail:
      'The source names a domain-grouping filter (L43158) and never enumerates its values. The facet is drawn inert with that reason rather than filled with invented groups.',
  },
  {
    what: 'The detection-class vocabulary',
    detail:
      'Named as a filter facet at L43158, with no enumeration anywhere. Same treatment as domain grouping.',
  },
  {
    what: 'The effect-atom classification',
    detail:
      'Three of the source’s fourteen illustrative atoms are effect atoms (L86916); what distinguishes an effect atom, and what the other kinds are called, is not stated. No column claims it.',
  },
  {
    what: 'The atom catalogue itself',
    detail:
      'The source’s catalogue is "explicitly not a committed set" (L43116, L86897). The rows on this screen are placeholders that exercise the seven OBJ-SA-ATOM states, not the source’s catalogue.',
  },
  {
    what: 'Any onward action from a per-tenant enablement row',
    detail:
      'The source defines none in this module. The two onward actions it does name — open the tenant’s own audit log view, and request a support session — are attributed to MOD-SA-10 (L107350), not here, so neither is drawn on this screen.',
  },
  {
    what: 'What the Admin and Support roles see on the PLATFORM enablement control',
    detail:
      'L43158 states the disabled-for-Admin / absent-for-Support split for the TENANT enablement control only. This screen honours that split exactly where it is stated, and falls back to the default disabled-with-a-named-reason rendering for the platform control.',
  },
  {
    what: 'Acceptance criteria AC-SA-02-02, AC-SA-02-04 and AC-SA-02-05',
    detail:
      'The extraction carries AC-SA-02-01, -03, -06 and -07. The gaps in the numbering are not represented anywhere this build can read, and nothing on this screen stands in for them.',
  },
  {
    what: 'Where atom-registration validation is seen (AC-SA-02-06)',
    detail:
      'Registration validation rejects an atom whose declared side-effects would place a model in the deviation-triggering path. Registration happens in a backend migration, so no console affordance shows that rejection; it is stated here rather than mocked up.',
  },
] as const satisfies readonly UnspecifiedEntry[]

/* ------------------------------------------------------------------ *
 * The screen.
 * ------------------------------------------------------------------ */
const MODULE = saModuleById('MOD-SA-02')

const EVALUATION_GATE = SA_INVARIANTS.find((i) => i.id === 'evaluation-gate')

/** Screen states that accompany the registry rather than replace it. */
const STATES_THAT_KEEP_CONTENT: readonly ScreenStateId[] = [
  'STATE-03',
  'STATE-06',
  'STATE-08',
  'STATE-09',
  'STATE-10',
  // AC-SA-000-09: with every artificial-intelligence model unavailable, the
  // module REMAINS OPERABLE. The registry is deterministic; nothing on it
  // depends on a model. STATE-11 therefore banners and keeps everything.
  'STATE-11',
  'STATE-13',
]

const READ_ONLY_CAUSE =
  'Read-only: this console session carries no write authority in this state (STATE-06). One banner, one cause.'

export interface AtomRegistryScreenProps {
  readonly initialRole?: SaConsoleRoleToken
  readonly initialScreenState?: ScreenStateId
}

export function AtomRegistryScreen({
  initialRole = 'ROLE-PLAT-ROOT',
  initialScreenState = 'STATE-03',
}: AtomRegistryScreenProps) {
  const [roleToken, setRoleToken] = useState<SaConsoleRoleToken>(initialRole)
  const [screenStateId, setScreenStateId] = useState<ScreenStateId>(initialScreenState)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verdictFilter, setVerdictFilter] = useState<string>('all')
  const [selectedAtomId, setSelectedAtomId] = useState<string>(ATOM_FIXTURES[0].id)
  const [receipt, setReceipt] = useState<string | null>(null)

  const role = consoleRole(roleToken)
  const readOnly = screenStateId === 'STATE-06'
  const showsContent = STATES_THAT_KEEP_CONTENT.includes(screenStateId)

  const rows = ATOM_FIXTURES.filter(
    (a) =>
      (statusFilter === 'all' || a.state === statusFilter) &&
      (verdictFilter === 'all' || a.evalVerdict === verdictFilter),
  )
  const selected = ATOM_FIXTURES.find((a) => a.id === selectedAtomId) ?? ATOM_FIXTURES[0]

  // L65361 / the evaluation gate: the enablement control is NOT OFFERED AT
  // ALL while a scenario is pending or failing. That is the ABSENT idiom,
  // and it binds every account including the root.
  const enablementOffered = selected.evalVerdict === 'passing'

  // A receipt is true of exactly one role, one atom and one screen state. Any
  // of the three switchers moves the reader into a context the receipt does not
  // describe — including one where the source states the action does not exist
  // at all — so the receipt is dropped rather than carried across.
  function selectAtom(id: string) {
    setSelectedAtomId(id)
    setReceipt(null)
  }

  function submit(label: string) {
    setReceipt(
      `${label}: Submitted for Admin approval — request PLT-CHG-FIXTURE-0417. Nothing has taken effect; the request sits in the approval queue (MOD-SA-08).`,
    )
  }

  const tableRows: readonly TableRow[] = rows.map((a) => ({
    id: a.id,
    state: a.state,
    verdict: a.evalVerdict,
    migration: a.migrationRef,
    open: (
      <Button variant="secondary" onClick={() => selectAtom(a.id)}>
        {`Open ${a.id}`}
      </Button>
    ),
  }))

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations: SCR-SA-02 · SB-SA-02 · SCR-SA-ATOMS · SCR-SA-ATOMDETAIL ·
        SCR-SA-ATOM-ENABLE. Names are canonical; these numbers are annotations and no route is keyed
        on one.
      </p>

      <section aria-label="View switchers" className="mt-4 flex flex-wrap gap-6">
        <Select
          label="View as platform role"
          value={roleToken}
          options={CONSOLE_ROLES.map((r) => ({ value: r.token, label: `${r.label} — ${r.token}` }))}
          onChange={(v) => {
            const next = CONSOLE_ROLES.find((r) => r.token === v)
            if (next) {
              setRoleToken(next.token)
              setReceipt(null)
            }
          }}
        />
        <Select
          label="Screen state"
          value={screenStateId}
          options={SA_APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
          onChange={(v) => {
            const next = SA_APPLICABLE_STATES.find((s) => s.id === v)
            if (next) {
              setScreenStateId(next.id)
              setReceipt(null)
            }
          }}
        />
      </section>

      <RegistryAggregate variant={aggregateVariant(screenStateId)} />

      <div className="mt-6">
        <ScreenStateBoundary
          state={screenStateId}
          surface="SURF-SA"
          detail={{
            objectLabel: 'atoms',
            whatCreatesIt:
              'A backend migration registers an atom. No interface path creates one, for any account.',
            fieldLabel: 'Enablement scope',
            rule: 'An enablement change must name the scope it applies to.',
            permittedFormat: 'Platform-wide, or one named tenant.',
            decision: {
              // The verdict comes from `evaluateAccess`; only the wording is
              // this screen's, because STATE-05 must name the role that DOES
              // carry the action and the shared reason code cannot know it.
              // Nothing about the outcome, stage or refs is rewritten.
              ...decisionFor(SUBMIT_PLATFORM_ENABLEMENT, 'SUPPORT'),
              explanation:
                'This console role does not carry the enablement action. The Platform Engineer submits an enablement change and the Admin approves it (L43158, L65490).',
            },
            readOnlyCause: READ_ONLY_CAUSE,
            asOfLabel: `as of ${AS_OF_STALE} (${STALE_AGE}, fixture value)`,
            originLabel: 'seeded registry fixture',
            commandState: 'queued',
            degradedMissing: 'Model-assisted summaries of a scenario run are missing.',
            degradedRemaining:
              'The registry, its filters and the whole approval cycle continue unchanged — none of them consults a model.',
            unavailableCause:
              'Every artificial-intelligence model is unavailable in this state. The atom registry is deterministic: it reads, filters and submits enablement changes exactly as before (AC-SA-000-09).',
            failureWhat: 'The registry aggregate could not be read.',
            wasWritten: false,
            nextStep: 'Re-open the registry. No enablement change was submitted.',
            recoveryProgress: 'Recomputing the registry aggregate. The list below is the last read.',
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
            <h2 className="text-lg font-semibold">The evaluation gate</h2>
            {EVALUATION_GATE ? <div className="mt-2"><InvariantChip invariant={EVALUATION_GATE} /></div> : null}
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              There is no control here to switch this gate off, and no approval path to ask for one, for
              any account including the root. It is a status readout, not a switch (AC-SA-INV-003,
              L47849; L65490).
            </p>
          </section>

          <section aria-label="Registry filters" className="mt-8">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="mt-2 flex flex-wrap items-end gap-6">
              <Select
                label="Filter by status"
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All states' },
                  ...ATOM_STATES.map((s) => ({ value: s, label: s })),
                ]}
                onChange={setStatusFilter}
              />
              <Select
                label="Filter by evaluation verdict"
                value={verdictFilter}
                options={[
                  { value: 'all', label: 'All verdicts' },
                  ...EVAL_VERDICTS.map((v) => ({ value: v, label: v })),
                ]}
                onChange={setVerdictFilter}
              />
              <div>
                <ProhibitionNotice
                  rendering={{
                    kind: 'disabled-with-reason',
                    label: 'Filter by domain grouping',
                    reason:
                      'The source names this facet (L43158) and never enumerates its values, so there is nothing to list without inventing it.',
                  }}
                />
              </div>
              <div>
                <ProhibitionNotice
                  rendering={{
                    kind: 'disabled-with-reason',
                    label: 'Filter by detection class',
                    reason:
                      'The source names this facet (L43158) and never enumerates its values, so there is nothing to list without inventing it.',
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              All four console roles read the registry and hold its filters (L43158).
            </p>
          </section>

          <section aria-label="The atom registry list" className="mt-8">
            <h2 className="text-lg font-semibold">Registry</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Placeholder rows, one per OBJ-SA-ATOM state (L43178). The source’s own catalogue of atoms
              is explicitly not a committed set (L43116, L86897), so these are not it.
            </p>
            <div className="mt-3">
              <Table
                caption="Atoms, by state and evaluation verdict"
                columns={[
                  { key: 'id', header: 'Atom' },
                  { key: 'state', header: 'State' },
                  { key: 'verdict', header: 'Evaluation verdict' },
                  { key: 'migration', header: 'Migration reference' },
                  { key: 'open', header: 'Detail' },
                ]}
                rows={tableRows}
                filtered={statusFilter !== 'all' || verdictFilter !== 'all'}
                emptyState={{
                  title: 'There are no atoms in this registry yet.',
                  whatCreatesIt: 'A backend migration registers an atom. Atoms arrive by backend migration.',
                }}
              />
            </div>
            <div className="mt-3">
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note:
                    'Create an atom: no interface path exists, for any account including the root. Atoms arrive by backend migration, and every atom traces to a migration reference (AC-SA-02-01, L43253; AC-AI-007-1, L86948).',
                }}
              />
            </div>
          </section>

          <section aria-label="Atom detail" className="mt-8">
            <h2 className="text-lg font-semibold">Atom detail — {selected.id}</h2>
            <dl className="mt-2 grid max-w-xl grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="font-medium">State</dt>
              <dd>{selected.state}</dd>
              <dt className="font-medium">Evaluation verdict</dt>
              <dd>{selected.evalVerdict}</dd>
              <dt className="font-medium">Migration reference</dt>
              <dd>{selected.migrationRef}</dd>
            </dl>

            <h3 className="mt-6 text-base font-semibold">Actions</h3>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              No control in this module is one of the eleven critical-class actions, so the
              root-approval class badge does not replace this action bar. Those eleven are routed and
              shown in MOD-SA-08.
            </p>
            <div className="mt-3 space-y-4">
              {enablementOffered ? (
                <>
                  <ActionControl
                    control={SUBMIT_PLATFORM_ENABLEMENT}
                    roleId={role.roleId}
                    {...(readOnly ? { readOnlyCause: READ_ONLY_CAUSE } : {})}
                    onAct={() => submit(SUBMIT_PLATFORM_ENABLEMENT.label)}
                  />
                  <ActionControl
                    control={SUBMIT_TENANT_ENABLEMENT}
                    roleId={role.roleId}
                    {...(readOnly ? { readOnlyCause: READ_ONLY_CAUSE } : {})}
                    onAct={() => submit(SUBMIT_TENANT_ENABLEMENT.label)}
                  />
                </>
              ) : (
                <ProhibitionNotice
                  rendering={{
                    kind: 'absent',
                    note: `The enablement control is not offered at all while a scenario is ${selected.evalVerdict} — for any account, including the root (L65361, AC-SA-02-03 L43255). It is the evaluation gate's visible face, and it is an absence of control, not a disabled control.`,
                  }}
                />
              )}

              <ActionControl
                control={RUN_EVALUATION_SCENARIOS}
                roleId={role.roleId}
                {...(readOnly ? { readOnlyCause: READ_ONLY_CAUSE } : {})}
              />
              <ActionControl control={ENABLE_DIRECTLY} roleId={role.roleId} />
              <ActionControl control={APPROVE_OWN_SUBMISSION} roleId={role.roleId} />

              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note:
                    'Open the trace viewer for a scenario run: No trace-viewer screen exists at V1 (decision D9). DEC-SEC-020 (L104506) warns that an unqualified viewer becomes the ambient-browsing path the source forbids, so the control the source names at L65489 is drawn for nobody.',
                }}
              />
            </div>

            <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Disabling a detection-class atom has no effect on on-device severity classification, or on
              the Severity 1 automatic hold — the deterministic layer is untouched by anything on this
              screen (AC-SA-02-07, L43259).
            </p>

            <h3 className="mt-6 text-base font-semibold">Per-tenant enablement</h3>
            {selected.tenantsEnabled.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm">
                {selected.tenantsEnabled.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                This atom carries no per-tenant enablement.
              </p>
            )}
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Tenant tokens only, and no link. A tenant’s records are reachable only inside a named
              access session, never ambiently from this console (AC-SA-000-07, L42885; AC-SEC-801,
              L104316).
            </p>
          </section>

          <section aria-label="Unspecified in source" className="mt-8">
            <h2 className="text-lg font-semibold">Unspecified in source</h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Each entry is an affordance or a value this module would need and the frozen source does
              not define. Nothing below has been invented to fill the gap.
            </p>
            <dl className="mt-3 space-y-3">
              {UNSPECIFIED_IN_SOURCE.map((entry) => (
                <div key={entry.what}>
                  <dt className="text-sm font-medium">{entry.what}</dt>
                  <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">{entry.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : null}
    </SaConsoleShell>
  )
}

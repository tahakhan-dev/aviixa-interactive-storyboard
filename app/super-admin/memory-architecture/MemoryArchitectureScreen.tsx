'use client'

import { useState } from 'react'
import Link from 'next/link'
import { scenarioRunId } from '@/domain/ids'
import { emptyDomainState } from '@/domain/state'
import type { RoleId } from '@/domain/roles'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS, type SaInvariantId } from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { type ScreenStateId } from '@/ui/screen-state'
import { FreshnessLabel, PermissionNotice, Select, Table } from '@/ui/primitives'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import type { SaFreshness } from '@/surfaces/sa/freshness'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-04 Memory Architecture (Band A, the definition layer).
 * Annotated screens: SCR-SA-05 / SB-SA-04 / SCR-SA-MEMORY / SCR-SA-FOOTPRINT
 * (numbers are annotations only — D1 — never route keys).
 *
 * THE MODULE HAS ZERO CONTROLS. Checked against both the raw and the
 * deduplicated control inventories in `registries/raw/extract`: no entry of
 * kind `controls` anywhere carries `module_id: "MOD-SA-04"`, and no workflow
 * or object entry does either. The census records the same finding three ways
 * (C15, R7). Per spec §4 D15 the screen is therefore built read-only, and
 * every affordance the source leaves undefined is NAMED in the
 * unspecified-in-source panel rather than invented — a plausible invented
 * control reads back as a requirement.
 *
 * Two deliberate deviations, both reported:
 *
 * 1. The census §1 recommends ONE Admin control here — "Trigger a
 *    coaching-corpus re-index" (L42713) — while the same census's conflict
 *    C15 lists "trigger re-index" among the four affordances that must be
 *    rendered as gaps. The two paragraphs contradict each other. The build
 *    follows C15 and the module brief: no control is drawn, and the re-index
 *    is named as a gap. L42713 is a role-rules line about what an Admin may
 *    do, not a control definition with a screen, a state or an approval
 *    route; drawing a button from it would be inventing the missing three.
 *
 * 2. No DISABLED-WITH-A-NAMED-REASON rendering appears on this screen. That
 *    rendering is for an action that "exists on this platform but not for
 *    this role or not in this state" (spec §3) — it requires a control that
 *    exists. This module has none, so the rule never fires. Rendering one
 *    anyway would draw an inert control the source does not define, which is
 *    the exact failure R7 warns about. The screen says so in words.
 */
const MODULE = saModuleById('MOD-SA-04')

/* ── The five typed memory stores (L2139, L43469) ─────────────────────── */

export type MemoryStoreId = 'working' | 'episodic' | 'semantic' | 'procedural' | 'profile'

export interface MemoryStorePolicy {
  readonly id: MemoryStoreId
  readonly name: string
  readonly objectRef: string
  readonly purpose: string
  readonly writer: string
  readonly recordStates: readonly string[]
  /** null where the source states no default — rendered as unspecified. */
  readonly retentionDefault: null
  /** null where the source states no policy for this store. */
  readonly redactionPolicy: string | null
  readonly hardGate: string
  readonly sourceRef: string
}

export const MEMORY_STORES = [
  {
    id: 'working',
    name: 'Working store',
    objectRef: 'OBJ-072',
    purpose: 'Live run context, scoped to a single agent run and discarded when that run ends.',
    writer: 'Written by the agent run that owns it, within its own grants.',
    recordStates: ['created', 'live', 'discarded at run scope'],
    retentionDefault: null,
    redactionPolicy: null,
    hardGate:
      'Run-scoped by construction: nothing in this store outlives the run that created it.',
    sourceRef: 'L2139, L9505, L43469',
  },
  {
    id: 'episodic',
    name: 'Episodic store',
    objectRef: 'OBJ-073',
    purpose: 'What happened — the record of runs and capture events worth keeping.',
    writer: 'Written by agent runs and capture events within the tenant.',
    recordStates: ['written', 'retained', 'tiered'],
    retentionDefault: null,
    redactionPolicy: null,
    hardGate:
      'Retention and tiering are governed per tenant; nothing here is purged (the Data Lifecycle and Archival module).',
    sourceRef: 'L2139, L9524, L43469',
  },
  {
    id: 'semantic',
    name: 'Semantic store',
    objectRef: 'OBJ-074',
    purpose: 'Domain facts — the parts registry and authored content an agent reasons over.',
    writer:
      'Written by curated ingestion and by agents; curated updates take precedence over agent-written facts.',
    recordStates: ['ingested', 'curated', 'retained'],
    retentionDefault: null,
    redactionPolicy: null,
    hardGate:
      'Precedence is a recorded contradiction: the source states both writers without stating precedence, and curation-wins is the only reading consistent with "the platform never invents content" (L9555).',
    sourceRef: 'L2139, L9543, L43469',
  },
  {
    id: 'procedural',
    name: 'Procedural store',
    objectRef: 'OBJ-075',
    purpose: 'How work is done, bound to a published workflow version.',
    writer:
      'Written only by Studio publication. No agent holds a write grant to this store (AC-AI-003, AC-AI-008-2).',
    recordStates: ['written on publication', 'version-bound', 'superseded on republication'],
    retentionDefault: null,
    redactionPolicy: null,
    hardGate:
      'Procedural content changes only through Studio publication — never through the learning pipeline.',
    sourceRef: 'L2139, L9562, L10649, L43469',
  },
  {
    id: 'profile',
    name: 'Profile store',
    objectRef: 'OBJ-076',
    purpose:
      'Aggregate operator and asset patterns, held as purpose-bound aggregates for coaching selection and readiness.',
    writer: 'Written from execution outcomes and coaching effectiveness, as aggregates only.',
    recordStates: ['written', 'retained', 'redacted per policy'],
    retentionDefault: null,
    redactionPolicy:
      'Personal-data redaction applies. Personal data anonymises at 24 months for standard commercial tenants, and not at all in Regulated-Industry mode (L43558, L96873).',
    hardGate:
      'AC-SA-04-05: profile memory holds aggregates only, and an individual-level profile record cannot be created. A write carrying identifiable individual content is refused (AC-AI-008-3).',
    sourceRef: 'L2139, L9581, L43627, L87061',
  },
] as const satisfies readonly MemoryStorePolicy[]

type MissingFromMemoryStores = Exclude<MemoryStoreId, (typeof MEMORY_STORES)[number]['id']>
const _memoryStoresExhaustive: MissingFromMemoryStores extends never ? true : never = true
void _memoryStoresExhaustive

/* ── The four console roles, as this console's own identifiers ─────────── */

export type SaConsoleRoleId =
  | 'ROLE-PLAT-ROOT'
  | 'ROLE-PLAT-ADMIN'
  | 'ROLE-PLAT-ENG'
  | 'ROLE-PLAT-SUP'

export interface SaConsoleRoleView {
  readonly id: SaConsoleRoleId
  readonly name: string
  readonly roleId: RoleId
}

export const SA_04_ROLE_VIEWS = [
  { id: 'ROLE-PLAT-ROOT', name: 'Root Super Admin', roleId: 'ROOT_SUPER_ADMIN' },
  { id: 'ROLE-PLAT-ADMIN', name: 'Admin', roleId: 'ADMIN' },
  { id: 'ROLE-PLAT-ENG', name: 'Platform Engineer', roleId: 'PLATFORM_ENGINEER' },
  { id: 'ROLE-PLAT-SUP', name: 'Support', roleId: 'SUPPORT' },
] as const satisfies readonly SaConsoleRoleView[]

type MissingFromRoleViews = Exclude<SaConsoleRoleId, (typeof SA_04_ROLE_VIEWS)[number]['id']>
const _roleViewsExhaustive: MissingFromRoleViews extends never ? true : never = true
void _roleViewsExhaustive

const ALL_CONSOLE_ROLES: readonly RoleId[] = SA_04_ROLE_VIEWS.map((r) => r.roleId)

/* ── The ABSENT prohibitions (spec §3, first rendering) ────────────────── */

export type Sa04AbsentActionId =
  | 'export-memory'
  | 'create-individual-profile-record'
  | 'read-tenant-memory-content'
  | 'delete-or-purge-memory'
  | 'override-memory-isolation'

export interface Sa04AbsentAction {
  readonly id: Sa04AbsentActionId
  readonly note: string
}

export const SA_04_ABSENT_ACTIONS = [
  {
    id: 'export-memory',
    note: 'Export memory — no control, for any account including the root: memory has no export path on any surface at the first version, and the source proposes none (L96871).',
  },
  {
    id: 'create-individual-profile-record',
    note: 'Create an individual-level profile record — no control, for any account including the root: profile memory holds aggregates only (AC-SA-04-05, L43627).',
  },
  {
    id: 'read-tenant-memory-content',
    note: 'Open a tenant’s memory content — no control, for any account including the root: Unavailable — counts and volume only (L97152–L97156). No tenant-facing memory content surface exists (L97147), and no named access class opens one.',
  },
  {
    id: 'delete-or-purge-memory',
    note: 'Delete or purge a memory record — no control, for any account including the root: nothing is purged on any storage surface (L46074, the Data Lifecycle and Archival module).',
  },
  {
    id: 'override-memory-isolation',
    note: 'Override tenant memory isolation — no control, for any account including the root: there is no degraded mode for isolation, and a manual override does not exist and must not be built (FB-DATA-ISO-001, L97160–L97162).',
  },
] as const satisfies readonly Sa04AbsentAction[]

type MissingFromAbsentActions = Exclude<
  Sa04AbsentActionId,
  (typeof SA_04_ABSENT_ACTIONS)[number]['id']
>
const _absentActionsExhaustive: MissingFromAbsentActions extends never ? true : never = true
void _absentActionsExhaustive

/* ── The four affordances the source does not define (C15) ─────────────── */

export type Sa04UnspecifiedId =
  | 'set-retention-default'
  | 'edit-redaction-policy'
  | 'trigger-re-index'
  | 'footprint-dimensions'

export interface Sa04UnspecifiedAffordance {
  readonly id: Sa04UnspecifiedId
  readonly name: string
  readonly note: string
}

export const SA_04_UNSPECIFIED_AFFORDANCES = [
  {
    id: 'set-retention-default',
    name: 'Set a per-type retention default',
    note: 'The module is described as administering per-type retention defaults and bounds, but no control, screen, state or approval route is defined for setting one. The default values themselves are unstated. A retention-value change is critical class, so any such control would route to the root.',
  },
  {
    id: 'edit-redaction-policy',
    name: 'Edit the redaction policy',
    note: 'OBJ-SA-REDACT is named as an object with no states and no control (L43547). The one policy value the source does state — anonymisation at 24 months for standard commercial tenants — is rendered on the profile store card as a fact, not as an editable field.',
  },
  {
    id: 'trigger-re-index',
    name: 'Trigger a coaching-corpus re-index',
    note: 'Named only as something an Admin may do (L42713), with no control, no screen, no submitted state and no approval route. The census recommends building it and its own conflict record C15 lists it as a gap; the gap reading is the one built, because three quarters of the affordance would have to be invented.',
  },
  {
    id: 'footprint-dimensions',
    name: 'The dimensions of the cross-tenant footprint',
    note: 'The footprint is stated to carry counts and volume, and no dimension list is given for it. The four metered storage dimensions the source does name (L96973) belong to usage-ledger storage telemetry, not to the memory footprint; mapping one onto the other would be an inference the source does not make.',
  },
] as const satisfies readonly Sa04UnspecifiedAffordance[]

type MissingFromUnspecified = Exclude<
  Sa04UnspecifiedId,
  (typeof SA_04_UNSPECIFIED_AFFORDANCES)[number]['id']
>
const _unspecifiedExhaustive: MissingFromUnspecified extends never ? true : never = true
void _unspecifiedExhaustive

/* ── The invariants this module renders (census §(a), L103982) ─────────── */

// A deliberate subset of the six, not a closed vocabulary of its own: these
// are the invariants the source renders on THIS module (encryption and
// anonymisation locked rows, L103982). `as const satisfies` rather than a
// leading `: readonly SaInvariantId[]` annotation, which would widen the
// const and make every id here unchecked against the union.
export const SA_04_INVARIANT_IDS = [
  'encryption-at-rest',
  'encryption-in-transit',
  'cross-tenant-analytics-anonymisation',
] as const satisfies readonly SaInvariantId[]

const SA_04_INVARIANTS = SA_INVARIANTS.filter((i) =>
  SA_04_INVARIANT_IDS.some((id) => id === i.id),
)

const RETENTION_CRITICAL_ACTION = CRITICAL_ACTIONS.find((a) => a.id === 'retention-value-changes')

/* ── Access requests: every affordance driven by per-control roles ─────── */

const FOOTPRINT_READ: AccessRequest = {
  action: 'SA04_READ_CROSS_TENANT_MEMORY_FOOTPRINT',
  allowedRoles: ALL_CONSOLE_ROLES,
  // Support is refused the cross-tenant aggregate at L97155. The source also
  // says the opposite at L87560 ("read counts and volume on the footprint
  // view"). The narrower grant is the safer prototype and L97155 is the
  // surface-wide permission matrix, so the prohibition holds — the same way
  // spec §4 D17 resolves the Platform Engineer support-session conflict. The
  // screen names both lines so a reviewer sees the conflict, not just the
  // resolution.
  deniedRoles: ['SUPPORT'],
  sourceRefs: ['L97152', 'L97153', 'L97154', 'L97155', 'L87560'],
}

const STORE_POLICY_READ: AccessRequest = {
  action: 'SA04_READ_MEMORY_STORE_POLICY',
  allowedRoles: ALL_CONSOLE_ROLES,
  sourceRefs: ['D16, L42742', 'L43469'],
}

// De-anonymisation is refused to every console role including the root
// (L97152, L97560). Explicit deny beats allow in the evaluator, which is why
// every role appears on both lists: the refusal is a prohibition, not a
// missing grant.
const DE_ANONYMISE: AccessRequest = {
  action: 'SA04_DE_ANONYMISE_CROSS_TENANT_FOOTPRINT',
  allowedRoles: ALL_CONSOLE_ROLES,
  deniedRoles: ALL_CONSOLE_ROLES,
  sourceRefs: ['L97152', 'L97560'],
}

const BASE_STATE = emptyDomainState(scenarioRunId('RUN-SA-04-STORYBOARD'))

function contextFor(roleId: RoleId): AccessContext {
  return {
    state: BASE_STATE,
    // A platform-domain role never ambiently holds a tenant; it acts only
    // through a named access class.
    identity: {
      signedIn: true,
      role: roleId,
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
    actorOfRecord: null,
  }
}

/* ── The footprint aggregate fixture ───────────────────────────────────── */

type AggregateMode = Extract<SaFreshness, 'current' | 'stale' | 'unavailable'>

interface FootprintRow {
  readonly storeId: MemoryStoreId
  readonly records: string
  readonly volume: string
}

const FOOTPRINT_ROWS: readonly FootprintRow[] = [
  { storeId: 'working', records: '48,210', volume: '1.2 TB' },
  { storeId: 'episodic', records: '1,204,556', volume: '31.4 TB' },
  { storeId: 'semantic', records: '96,140', volume: '4.7 TB' },
  { storeId: 'procedural', records: '3,884', volume: '0.9 TB' },
  { storeId: 'profile', records: '11,207', volume: '1.1 TB' },
]

const AS_OF_CURRENT = 'As of 2026-08-16 09:00 UTC'
const AS_OF_STALE = 'As of 2026-08-09 09:00 UTC'

// AC-SA-01-03: a degraded aggregate renders stale with its age, a wholly
// unavailable one renders unavailable, and neither ever renders as zero or
// blank. STATE-08 is the degraded case and STATE-12 the unavailable one.
// STATE-13 is the recomputation after the failure: the boundary says the
// counts "remain marked Unavailable until then", so they must in fact read
// Unavailable — rendering the full fixture under the freshest caption would
// show a recovering system as fully recovered (STATE-13's own neverDo).
function aggregateMode(state: ScreenStateId): AggregateMode {
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12' || state === 'STATE-13') return 'unavailable'
  return 'current'
}

// STATE-01, STATE-02 and STATE-04 are the three states where the boundary's
// own rendering stands alone: nothing exists yet, the measure is in flight,
// or an input was refused. Everywhere else — STATE-11 included — the module
// stays operable and the aggregate renders (AC-SA-000-09).
const AGGREGATE_SUPPRESSING_STATES: readonly ScreenStateId[] = ['STATE-01', 'STATE-02', 'STATE-04']


/* ── The screen ────────────────────────────────────────────────────────── */

function StoreCard({ store }: { readonly store: MemoryStorePolicy }) {
  const headingId = `store-${store.id}`
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
    >
      <h3 id={headingId} className="font-semibold text-[var(--color-ink)]">
        {store.name}{' '}
        <span className="font-normal text-xs text-[var(--color-ink-subtle)]">
          {store.objectRef}
        </span>
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{store.purpose}</p>
      <dl className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">Writer: </dt>
          <dd className="inline">{store.writer}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">Record states: </dt>
          <dd className="inline">{store.recordStates.join(' · ')}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">Retention default: </dt>
          <dd className="inline">
            Unspecified in source — no default value and no control are stated for this store.
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">Redaction policy: </dt>
          <dd className="inline">
            {store.redactionPolicy ?? 'Unspecified in source for this store.'}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">Hard gate: </dt>
          <dd className="inline">{store.hardGate}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">{store.sourceRef}</p>
    </section>
  )
}

export function MemoryArchitectureScreen() {
  const [roleId, setRoleId] = useState<SaConsoleRoleId>('ROLE-PLAT-ROOT')
  const [stateId, setStateId] = useState<ScreenStateId>('STATE-03')

  const roleView = SA_04_ROLE_VIEWS.find((r) => r.id === roleId) ?? SA_04_ROLE_VIEWS[0]
  const ctx = contextFor(roleView.roleId)
  const footprintDecision = evaluateAccess(FOOTPRINT_READ, ctx)
  const policyDecision = evaluateAccess(STORE_POLICY_READ, ctx)
  const deAnonymiseDecision = evaluateAccess(DE_ANONYMISE, ctx)
  const mode = aggregateMode(stateId)
  const isRoot = roleView.id === 'ROLE-PLAT-ROOT'

  return (
    <SaConsoleShell module={MODULE}>
      <section
        aria-labelledby="view-switchers"
        className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <h2 id="view-switchers" className="text-sm font-semibold">
          Storyboard view switchers
        </h2>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          These two selectors switch what this storyboard shows. Neither is a module control, and
          neither is a sign-in: this module defines no control at all.
        </p>
        <div className="mt-3 flex flex-wrap gap-6">
          <Select
            label="Console role"
            value={roleId}
            options={SA_04_ROLE_VIEWS.map((r) => ({ value: r.id, label: `${r.name} (${r.id})` }))}
            onChange={(v) => setRoleId(v as SaConsoleRoleId)}
          />
          <Select
            label="Screen state"
            value={stateId}
            options={SA_APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} ${s.name}` }))}
            onChange={(v) => setStateId(v as ScreenStateId)}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">
          Screen numbers, annotation only: SCR-SA-05 · SB-SA-04 · SCR-SA-MEMORY · SCR-SA-FOOTPRINT.
          Names are canonical; this route is keyed on its slug.
        </p>
      </section>

      <section aria-labelledby="read-access" className="mt-8">
        <h2 id="read-access" className="text-lg font-semibold">
          What {roleView.name} sees here
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          All four console roles read the store policy on this screen; module-level role lists are
          authoritative nowhere (D16), and the source gives this module four different ones. What
          differs by role is the cross-tenant footprint, and nothing else — because nothing else
          here is an action.
        </p>
        <PermissionNotice decision={policyDecision} />
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Tenant memory content: Unavailable — counts and volume only. That reading is the same for
          every console role including the root (L97152–L97156).
        </p>
      </section>

      <section aria-labelledby="stores" className="mt-8">
        <h2 id="stores" className="text-lg font-semibold">
          The typed memory stores
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Read-only policy cards. The source defines no control for any of them.
        </p>
        <div className="mt-4 space-y-4">
          {MEMORY_STORES.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>

      <section aria-labelledby="invariants" className="mt-8">
        <h2 id="invariants" className="text-lg font-semibold">
          Enforced platform invariants on this surface
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Status chips, never controls. There is no off position, no approval path and no
          configuration key for any of them, on any screen, for any account including the root
          (AC-SA-INV-003, L47849).
        </p>
        <div className="mt-4 space-y-3">
          {SA_04_INVARIANTS.map((invariant) => (
            <InvariantChip key={invariant.id} invariant={invariant} />
          ))}
        </div>
      </section>

      <section aria-labelledby="footprint" className="mt-8">
        <h2 id="footprint" className="text-lg font-semibold">
          Cross-tenant memory footprint
        </h2>
        {footprintDecision.outcome === 'allowed' ? (
          <>
            <div className="mt-3">
              <ScreenStateBoundary
                state={stateId}
                surface="SURF-SA"
                detail={{
                  objectLabel: 'memory footprint measures',
                  whatCreatesIt:
                    'The platform aggregation job writes this measure; no console action creates one.',
                  fieldLabel: 'Footprint window',
                  rule: 'The footprint is reported for whole calendar months at tenant grain or coarser.',
                  permittedFormat: 'A whole calendar month, at platform or tenant grain.',
                  decision: deAnonymiseDecision,
                  readOnlyCause:
                    'This module defines no control, so every screen here is read-only for every role.',
                  asOfLabel: AS_OF_STALE,
                  originLabel: 'seven days old, from the platform footprint aggregation',
                  commandState: 'created',
                  degradedMissing:
                    'Agent-assisted summarisation of the footprint is degraded and is not shown.',
                  degradedRemaining:
                    'The counts and volumes below are computed without any model and are unchanged.',
                  unavailableCause:
                    'Every artificial-intelligence model is unavailable. This module needs none: the measures below and every policy card above are deterministic, and remain readable (AC-SA-000-09).',
                  failureWhat: 'The footprint aggregation did not complete.',
                  wasWritten: false,
                  nextStep:
                    'The measure reads Unavailable until the aggregation completes; it is never reported as zero (FB-SA-01, AC-SA-01-03).',
                  recoveryProgress:
                    'The aggregation is being recomputed. Counts return when it completes, and remain marked Unavailable until then.',
                }}
              >
                <FreshnessLabel
                  asOfLabel={AS_OF_CURRENT}
                  originLabel="from the platform footprint aggregation"
                />
              </ScreenStateBoundary>
            </div>

            {AGGREGATE_SUPPRESSING_STATES.includes(stateId) ? null : (
              <div className="mt-3">
                <Table
                  caption={`Counts and volume across all tenants — ${
                    mode === 'unavailable'
                      ? 'measure unavailable'
                      : mode === 'stale'
                        ? `${AS_OF_STALE}, seven days old`
                        : AS_OF_CURRENT
                  }`}
                  columns={[
                    { key: 'store', header: 'Store' },
                    { key: 'records', header: 'Records' },
                    { key: 'volume', header: 'Volume' },
                  ]}
                  rows={FOOTPRINT_ROWS.map((row) => {
                    const store = MEMORY_STORES.find((s) => s.id === row.storeId)
                    return {
                      store: store?.name ?? row.storeId,
                      records: mode === 'unavailable' ? 'Unavailable' : row.records,
                      volume: mode === 'unavailable' ? 'Unavailable' : row.volume,
                    }
                  })}
                  emptyState={{
                    title: 'No footprint measure has been computed yet.',
                    whatCreatesIt: 'The platform aggregation job writes it.',
                  }}
                />
                <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                  Counts and volume only, aggregated across all tenants and anonymised before
                  aggregation. The tenant is the finest grain this console renders, and no measure
                  here is broken down more finely than that.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mt-3">
            <PermissionNotice decision={footprintDecision} />
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The source contradicts itself here: L97155 puts cross-tenant aggregates out of reach
              for Support, and L87560 says Support may read counts and volume on this view. The
              narrower grant is the one built, and the conflict is stated rather than resolved
              quietly.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="retention-bar" className="mt-8">
        <h2 id="retention-bar" className="text-lg font-semibold">
          Retention-value changes
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {RETENTION_CRITICAL_ACTION?.name ?? 'Retention-value changes'} is one of the enumerated
          critical-class actions ({RETENTION_CRITICAL_ACTION?.sourceRef ?? 'L55942'}). Every
          critical-class action is blocked until the root approves, and a blocked attempt is itself
          an audit event (AC-SA-000-04).
        </p>
        <div className="mt-3">
          {isRoot ? (
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: 'The root approves this class — but no control for raising a retention-value change is defined in the source for this module, so none is drawn here. See the unspecified-in-source panel.',
              }}
            />
          ) : (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          )}
        </div>
      </section>

      <section aria-labelledby="absent" className="mt-8">
        <h2 id="absent" className="text-lg font-semibold">
          Actions that exist for no account, including the root
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn for these. A one-line note sits where a control would be, because a
          disabled control would imply an enabled state exists somewhere.
        </p>
        <div className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {SA_04_ABSENT_ACTIONS.map((action) => (
            <ProhibitionNotice key={action.id} rendering={{ kind: 'absent', note: action.note }} />
          ))}
        </div>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The third prohibition rendering — a control drawn inert with a named reason — does not
          appear on this screen. That rendering is for an action that exists on the platform but not
          for this role or this state, and this module defines no control at all, so the rule never
          fires. Drawing one would invent the control it pretends to refuse.
        </p>
      </section>

      <section aria-labelledby="tenant-route" className="mt-8">
        <h2 id="tenant-route" className="text-lg font-semibold">
          Reaching tenant content from here
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          No link on this screen resolves to record-level tenant content, and no ambient browsing
          exists anywhere on this console (AC-SA-000-07, AC-SEC-801). The only routes to tenant
          content are the named access classes — {ACCESS_CLASSES.map((c) => c.name).join(', ')} —
          and a request for one starts on the Support Access module. Memory content is not among
          what any of them opens.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Request a named access session
          </Link>
        </p>
      </section>

      <section aria-labelledby="unspecified" className="mt-8">
        <h2 id="unspecified" className="text-lg font-semibold">
          Unspecified in source
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This module carries no control anywhere in the frozen source — checked against both the
          raw and the deduplicated control inventories, and against the workflow and object
          inventories too. The four affordances below are named, not built. An invented control
          reads back as a requirement.
        </p>
        <dl className="mt-4 space-y-3 text-sm text-[var(--color-ink-muted)]">
          {SA_04_UNSPECIFIED_AFFORDANCES.map((gap) => (
            <div key={gap.id}>
              <dt className="font-medium text-[var(--color-ink)]">{gap.name}</dt>
              <dd className="mt-1 max-w-prose">{gap.note}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SaConsoleShell>
  )
}

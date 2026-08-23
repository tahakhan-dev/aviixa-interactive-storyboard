'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import {
  LockedControl,
  Select,
  StatusPill,
  Table,
  type TableRow,
} from '@/ui/primitives'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import {
  NOTIFICATION_STATES,
  NOTIFICATION_STATE_HONESTY_RULE,
} from '@/domain/vocabularies'
import {
  NOTIFICATION_COLLISIONS,
  NOTIFICATION_COUNT_LABEL,
  notificationsIn,
} from '@/registry/signals'
import { type TenantState } from '@/surfaces/doh/tenant-state'
import { TENANT_STATE_OPTIONS } from '@/ui/doh/tenant-state-vocabulary'
import {
  CONTROL_MATRIX,
  DOH_10_CATALOGUE_SPLIT,
  DOH_10_FINDINGS,
  DOH_10_SOURCE_ROW_COUNT,
  PREFERENCE_COLUMNS,
  PREFERENCE_MATRIX,
  PREFERENCE_MATRIX_SHAPE,
  PREFERENCE_SEVERITY_LABEL,
  UNSPECIFIED_IN_SOURCE,
  categoriesInGroup,
  doh10CriticalConfigurableCategories,
  doh10DoubleClaimedCategories,
  doh10GroupPartition,
  preferenceProhibitionCounts,
  type Doh10ControlId,
  type PreferenceCategory,
  type PreferenceGroupId,
} from '@/surfaces/doh/modules/doh-10/matrix'
import {
  doh10Affordance,
  doh10RolesReaching,
  preferenceAffordance,
  togglableKeysFor,
} from '@/surfaces/doh/modules/doh-10/rendering'
import { dohModuleById } from '@/surfaces/doh/modules'

/**
 * `SCR-DOH-19` — the notification policy and preferences screen, at
 * `/hub/notifications`. Catalogue B row L48113; catalogue A's row for the
 * same module, which names the preferences half, is L26070 and is referred to
 * by locator and name because its identifier is the banned three-digit form.
 *
 * ── THIS SCREEN DRAWS WHAT THE TWO FOLDS RETURN ───────────────────────────
 * There is no `status ===` in this file and one `role ===` only, inside the
 * reviewer's own persona switcher. Every control and every refusal comes from
 * `doh10Affordance(row, role, tenantState)` or from
 * `preferenceAffordance(category, role)`, both in
 * `@/surfaces/doh/modules/doh-10/rendering`. A screen that re-asked any part
 * of either rule would be a second place the answer could be spelled
 * differently.
 *
 * ── THE ONE CONTROL THAT WRITES, AND WHAT PROVES IT WORKS ─────────────────
 * The Configurable group's email toggle is the only operable control here. It
 * is not proved by being present: `emailOff` is written by the toggle AND READ
 * BACK in three places a test can bind to — the per-category `data-email`
 * attribute, the "Email suppressed on N of M" readout, and the audit-evidence
 * list, which is L73685's "The change commits with its audit event" rendered
 * rather than claimed. A control whose state is written and never read has
 * shipped here before.
 *
 * `toggleEmail` is guarded on `togglableKeysFor(role)` rather than on a group
 * name, so a caller holding a locked category's key and a good intention
 * cannot reach the setter. It throws rather than returning quietly, because a
 * silent no-op is a control that renders and does nothing.
 *
 * ── THE SHELL IS GIVEN `module`, AND IT WAS GIVEN `screen` FOR ONE WAVE ───
 * `MOD-DOH-10` is a member of `DohModuleId` and a row of `DOH_MODULES`, so the
 * shell gets the module and draws the module header, the breadcrumb and the
 * rail entry. This file used to carry an abstention saying the opposite —
 * "the rail offers no entry for this route" — because the registry was shared
 * and outside the route task's file list; slice 10 task 12 registered it, and
 * `HubShellUncataloguedScreen` is documented for a route that owns NO module,
 * so keeping it here after the module was registered would have been a second
 * false claim rather than a leftover.
 */

const GROUP_HEADING: Readonly<Record<PreferenceGroupId, string>> = {
  'always-sent': 'Always sent',
  protected: 'Protected',
  configurable: 'Configurable',
}

const AFFORDANCE_TONE = {
  control: 'ok',
  absent: 'blocked',
  'cross-surface': 'info',
  'no-screen-named': 'attention',
} as const

const AFFORDANCE_LABEL = {
  control: 'Control',
  absent: 'No control — reason stated',
  'cross-surface': 'Met on another surface',
  'no-screen-named': 'Granted, no screen named',
} as const

export function NotificationsScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  /** The one piece of product state on this screen. Written and read back. */
  const [emailOff, setEmailOff] = useState<readonly string[]>([])
  /** L73685 — "The change commits with its audit event." Rendered, not claimed. */
  const [auditTrail, setAuditTrail] = useState<readonly string[]>([])

  const allowedKeys = togglableKeysFor(role)

  function toggleEmail(category: PreferenceCategory): void {
    const key = category.key as string
    if (!allowedKeys.includes(key)) {
      throw new Error(
        `MOD-DOH-10: "${category.id}" is not an email-togglable category for this viewer. ` +
          'The locked groups carry no handler and this setter refuses a key from one rather than ' +
          'silently doing nothing.',
      )
    }
    const suppressing = !emailOff.includes(key)
    setEmailOff(suppressing ? [...emailOff, key] : emailOff.filter((k) => k !== key))
    setAuditTrail([
      ...auditTrail,
      `${suppressing ? 'Email suppressed' : 'Email restored'} on ${category.id} (${category.name}) by the ${role} view`,
    ])
  }

  const partition = doh10GroupPartition()
  const prohibitions = preferenceProhibitionCounts()
  const configurable = categoriesInGroup('configurable')
  const suppressedHere = configurable.filter((c) => emailOff.includes(c.key as string))

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => {
    const a = doh10Affordance(row, role, tenantState)
    return {
      key: row.id,
      act: (
        <span>
          {row.control}
          <span className="ml-2 text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
        </span>
      ),
      cell: <code className="text-xs">{row.status[role]}</code>,
      rendering: (
        <div data-testid={`affordance-${row.id}`} data-kind={a.kind}>
          <StatusPill tone={AFFORDANCE_TONE[a.kind]} icon="●" label={AFFORDANCE_LABEL[a.kind]} />
          {a.kind === 'control' ? (
            <>
              <p className="mt-1 text-sm">
                <button
                  type="button"
                  className="rounded border border-[var(--color-border-strong)] px-2 py-1 text-sm"
                >
                  {a.label}
                </button>
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.conditions}</p>
            </>
          ) : null}
          {a.kind === 'absent' ? (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.reason}</p>
          ) : null}
          {a.kind === 'cross-surface' ? (
            <>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.reason}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                Performed on {a.performedOn}, in {a.screen}. {a.note}
              </p>
              {a.linkHref !== null && a.linkLabel !== null ? (
                <Link className="mt-1 inline-block text-sm underline" href={a.linkHref}>
                  {a.linkLabel}
                </Link>
              ) : null}
            </>
          ) : null}
          {a.kind === 'no-screen-named' ? (
            <>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.reason}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.note}</p>
            </>
          ) : null}
        </div>
      ),
    }
  })

  return (
    <HubShell
      module={dohModuleById('MOD-DOH-10')}
      role={role}
      onRoleChange={setRole}
      tenantState={tenantState}
    >
      <section className="mt-8" aria-label="Reviewer tenant-state switcher">
        <Select
          label="Tenant state"
          value={tenantState}
          options={TENANT_STATE_OPTIONS}
          onChange={(v) => setTenantState(v as TenantState)}
        />
      </section>

      {/* ── The C2 trap, rendered rather than resolved ─────────────────── */}
      <section className="mt-8" aria-label="Which catalogue admits whom">
        <h2 className="text-xl font-semibold">Who opens this screen — the two catalogues differ</h2>
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          {DOH_10_CATALOGUE_SPLIT.statement}
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3">
            <dt className="text-sm font-medium">
              Catalogue B, canonical — {DOH_10_CATALOGUE_SPLIT.catalogueB.screenId},{' '}
              {DOH_10_CATALOGUE_SPLIT.catalogueB.name}
            </dt>
            <dd className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Roles that can open it: {DOH_10_CATALOGUE_SPLIT.catalogueB.roles}.{' '}
              {DOH_10_CATALOGUE_SPLIT.catalogueB.sourceRef}. This is the{' '}
              {DOH_10_CATALOGUE_SPLIT.policyRows.length}-row policy half.
            </dd>
          </div>
          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3">
            <dt className="text-sm font-medium">
              Catalogue A, named by locator — {DOH_10_CATALOGUE_SPLIT.catalogueA.name}
            </dt>
            <dd className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Primary role: {DOH_10_CATALOGUE_SPLIT.catalogueA.roles}.{' '}
              {DOH_10_CATALOGUE_SPLIT.catalogueA.sourceRef}. This is the{' '}
              {DOH_10_CATALOGUE_SPLIT.preferenceRows.length}-row preference half plus the{' '}
              {DOH_10_CATALOGUE_SPLIT.acknowledgementRows.length} acknowledgement row.
            </dd>
          </div>
        </dl>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The reach this module&rsquo;s own matrix derives is{' '}
          {doh10RolesReaching().join(', ')} — all five tenant roles, because rows 2 and 5 are{' '}
          <code>Allowed</code> in every column and no cell on the card carries{' '}
          <code>Unavailable</code>. The route registry admits no Worker to this surface (D11), so
          the one role the matrix rule adds is the one the shell withholds. Both answers are
          correct: the matrix asks whether this screen offers the role anything and the registry
          asks whether the role opens the surface at all.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This module is a row of the Hub module registry, so the rail offers this route to every
          persona whose own matrix column holds something here and the header above is the
          module&rsquo;s registered name. For one wave it was not, and this paragraph said so: the
          route shipped before the shared registry could be edited, and the module index said
          &ldquo;None is reachable from this build&rdquo; over a module a reader could already open.
        </p>
      </section>

      {/* ── The twelve-row control matrix ──────────────────────────────── */}
      <section className="mt-10" aria-label="Control matrix">
        <h2 className="text-xl font-semibold">
          Roles and permissions — {DOH_10_SOURCE_ROW_COUNT} rows, L28689 to L28700
        </h2>
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          Every one of the twelve acts is a write. There is no read row on this card, which is why
          the single <code>Read-only</code> cell (L28699) renders as no control with a permanent
          cause rather than as a read-only view: a read-only view names a state that could change.
        </p>
        <div className="mt-4">
          <Table
            caption={`MOD-DOH-10 control matrix as the ${role} view sees it, tenant state ${tenantState}`}
            columns={[
              { key: 'act', header: 'Act' },
              { key: 'cell', header: 'Source cell' },
              { key: 'rendering', header: 'What this screen draws' },
            ]}
            rows={matrixRows}
            emptyState={{
              title: 'No matrix row is transcribed',
              whatCreatesIt: 'Transcribing L28689 to L28700 populates this table.',
            }}
          />
        </div>
      </section>

      {/* ── The preference storyboard, SB-PREF-01 ──────────────────────── */}
      <section className="mt-10" aria-label="Notification preferences">
        <h2 className="text-xl font-semibold">Notification preferences — three groups</h2>
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          SB-PREF-01 (L73702) renders three groups: Always sent, locked; Protected, locked for
          disabling with email frequency options only; and Configurable, with an email toggle per
          category. Every locked control states its reason inline rather than showing a disabled
          control with no explanation. The numbered workflow says the same about what the screen
          contains — L73681, &ldquo;plus the non-disableable set rendered as locked&rdquo;.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Partition, counted over the catalogue rather than stated: {partition.alwaysSent} always
          sent, {partition.protectedGroup} protected, {partition.configurable} configurable,{' '}
          {partition.total} in total. That total of {partition.total} and the thirteen-family
          organisation it comes from are a{' '}
          <strong>{NOTIFICATION_COUNT_LABEL.classification}</strong> under{' '}
          {NOTIFICATION_COUNT_LABEL.decision}, not a Statement of Work fact. No per-class figure is
          shown at all: the prose distribution in the same section does not reconcile with its own
          catalogue, and only the total and the families do. The extended
          non-disableable set enumerates {doh10DoubleClaimedCategories().length + partition.protectedGroup}{' '}
          identifiers at L73676, of which {doh10DoubleClaimedCategories().length} —{' '}
          {doh10DoubleClaimedCategories().join(', ')} — are members of a mandatory family its own
          opening clause excludes, so the mandatory gate (L73690) draws them and the protected gate
          (L73692) does not.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every category below is keyed to Chapter 30C.2&rsquo;s register, not Chapter
          27.7&rsquo;s. Both number from <code>NOTIF-001</code> — {notificationsIn('ch-27.7-catalog').length}{' '}
          rows against {notificationsIn('ch-30c.2-categories').length} — and they agree on the name
          of none of the {NOTIFICATION_COLLISIONS.length} overlapping identifiers. The section&rsquo;s
          own illustrative example settles which register it reads: L73704 calls{' '}
          <code>NOTIF-059</code> the containment-checklist-incomplete alert, which is what Chapter
          30C.2 names it and Chapter 27.7 does not contain.
        </p>

        {(['always-sent', 'protected', 'configurable'] as const).map((group) => {
          const categories = categoriesInGroup(group)
          return (
            <div key={group} className="mt-6" data-testid={`preference-group-${group}`}>
              <h3 className="text-lg font-medium">
                {GROUP_HEADING[group]}{' '}
                <span className="text-sm font-normal text-[var(--color-ink-subtle)]">
                  {categories.length} categories
                </span>
              </h3>
              <ul className="mt-3 grid gap-2">
                {categories.map((category) => {
                  const a = preferenceAffordance(category, role)
                  const key = category.key as string
                  return (
                    <li
                      key={key}
                      data-testid={`preference-${category.id}`}
                      data-kind={a.kind}
                      data-group={group}
                      data-email={
                        a.kind === 'email-toggle'
                          ? emailOff.includes(key)
                            ? 'suppressed'
                            : 'on'
                          : 'not-a-setting-here'
                      }
                    >
                      {a.kind === 'locked' ? (
                        <LockedControl {...a.locked} />
                      ) : (
                        <div className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3">
                          <p className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium">{a.label}</span>
                            <StatusPill
                              tone={emailOff.includes(key) ? 'stale' : 'ok'}
                              icon="✉"
                              label={emailOff.includes(key) ? 'Email suppressed' : 'Email on'}
                            />
                          </p>
                          <button
                            type="button"
                            className="mt-2 rounded border border-[var(--color-border-strong)] px-2 py-1 text-sm"
                            onClick={() => toggleEmail(category)}
                          >
                            {emailOff.includes(key)
                              ? `Restore email for ${category.id}`
                              : `Suppress email for ${category.id}`}
                          </button>
                          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.condition}</p>
                          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.inAppNote}</p>
                          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                            Recommended severity {category.recommendedSeverity} —{' '}
                            {PREFERENCE_SEVERITY_LABEL.classification} under{' '}
                            {PREFERENCE_SEVERITY_LABEL.decision}. L{category.sourceLine}.
                          </p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        {/* The read-back. Without it the toggle is a control whose state is
            written and never read, which this build has shipped before. */}
        <p className="mt-6 text-sm" data-testid="email-suppression-readout">
          Email suppressed on {suppressedHere.length} of {configurable.length} configurable
          categories for the {role} view.
          {suppressedHere.length === 0
            ? ' Nothing is suppressed.'
            : ` Suppressed: ${suppressedHere.map((c) => c.id).join(', ')}.`}
        </p>
        <div className="mt-2" data-testid="preference-audit-trail">
          <h3 className="text-sm font-medium">
            Audit events — L73685, &ldquo;The change commits with its audit event&rdquo;
          </h3>
          {auditTrail.length === 0 ? (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              No preference has been changed in this view, so no audit event exists to show.
            </p>
          ) : (
            <ol className="mt-1 list-decimal pl-5 text-sm text-[var(--color-ink-muted)]">
              {auditTrail.map((entry, i) => (
                <li key={`${entry}-${i}`}>{entry}</li>
              ))}
            </ol>
          )}
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The discard path is not drawn here. L73686 says a preference the tenant policy later
          turns into a disabled protected category &ldquo;is discarded and the user is notified of
          the discard&rdquo;, and AC-30C-1004 (L73720) requires the notification to carry the
          reason. This storyboard has no policy-change-over-time fixture, and simulating one would
          mean inventing the sequence, so the obligation is stated rather than implied away.
        </p>
      </section>

      {/* ── The 30C.10 matrix, counted ─────────────────────────────────── */}
      <section className="mt-10" aria-label="Preference permission matrix">
        <h2 className="text-xl font-semibold">
          What each level may change — {PREFERENCE_MATRIX_SHAPE.dataRows} rows, L73708 to L73711
        </h2>
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          Counted rather than inferred from a span: {PREFERENCE_MATRIX_SHAPE.dataRows} data rows and{' '}
          {PREFERENCE_MATRIX_SHAPE.columns} permission columns, {PREFERENCE_MATRIX_SHAPE.cells}{' '}
          cells. {prohibitions.bare} of them read a bare <code>Explicitly prohibited</code> and{' '}
          {prohibitions.qualified} more prohibit with a scope attached.{' '}
          {prohibitions.columnsBareThroughout.length} column is bare in every cell (
          {prohibitions.columnsBareThroughout.join(', ')}) and{' '}
          {prohibitions.columnsProhibitedThroughout.length} are a prohibition in every cell once
          the qualified variant counts ({prohibitions.columnsProhibitedThroughout.join('; ')}).
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The Level column is not a column of actors. Three of its four rows name a party and the
          fourth names a delivery — the digest sections — so only two of the four are levels a
          person occupies: the Tenant Admin has its own row and every other role is an individual
          user.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The condition on the email cell — &ldquo;not for Critical categories&rdquo; — currently
          withholds a toggle from {doh10CriticalConfigurableCategories().length} configurable
          categories, because every Critical category in the catalogue is in the Protected group and
          locked already. It still renders: {PREFERENCE_SEVERITY_LABEL.note}
        </p>
        <div className="mt-4">
          <Table
            caption="30C.10 preference permissions by level, transcribed cell for cell"
            columns={[
              { key: 'level', header: 'Level' },
              ...PREFERENCE_COLUMNS.map((c) => ({ key: c, header: c })),
              { key: 'ref', header: 'Line' },
            ]}
            rows={PREFERENCE_MATRIX.map((row) => ({
              key: row.level,
              level: (
                <span>
                  {row.level}
                  {row.isAParty ? null : (
                    <span className="ml-2 text-xs text-[var(--color-ink-subtle)]">
                      a delivery, not a party
                    </span>
                  )}
                </span>
              ),
              ...Object.fromEntries(PREFERENCE_COLUMNS.map((c) => [c, row.cells[c]])),
              ref: row.sourceRef,
            }))}
            emptyState={{
              title: 'No preference row is transcribed',
              whatCreatesIt: 'Transcribing L73708 to L73711 populates this table.',
            }}
          />
        </div>
      </section>

      {/* ── The nineteen states ────────────────────────────────────────── */}
      <section className="mt-10" aria-label="Notification states">
        <h2 className="text-xl font-semibold">
          The {NOTIFICATION_STATES.length} notification states
        </h2>
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          {NOTIFICATION_STATE_HONESTY_RULE.text} ({NOTIFICATION_STATE_HONESTY_RULE.sourceRef}) This
          card&rsquo;s States field says the same in one line: the full set applies and{' '}
          &ldquo;no state named &lsquo;sent&rsquo; is treated as delivery&rdquo; (L28679). No label
          on this screen folds any of them together.
        </p>
        <ol className="mt-3 flex flex-wrap gap-2" data-testid="notification-states">
          {NOTIFICATION_STATES.map((state) => (
            <li key={state}>
              <code className="rounded bg-[var(--color-surface-sunken)] px-2 py-0.5 text-xs">
                {state}
              </code>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The findings ───────────────────────────────────────────────── */}
      <section className="mt-10" aria-label="Findings on this module">
        <h2 className="text-xl font-semibold">
          What the source says twice, and differently — {DOH_10_FINDINGS.length} findings
        </h2>
        <ul className="mt-3 grid gap-3">
          {DOH_10_FINDINGS.map((f) => (
            <li
              key={f.id}
              data-testid={`finding-${f.id}`}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
            >
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <StatusPill tone="attention" icon="⚠" label={f.grade} />
                {f.title}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{f.what}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{f.why}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{f.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── What the source does not say ───────────────────────────────── */}
      <section className="mt-10" aria-label="Unspecified in the source">
        <h2 className="text-xl font-semibold">
          Unstated in the frozen source — {UNSPECIFIED_IN_SOURCE.length} silences
        </h2>
        <ul className="mt-3 grid gap-3">
          {UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.id} className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3">
              <p className="text-sm font-medium">{u.question}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{u.what}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{u.treatment}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{u.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── The open decisions, cited and never re-worded ──────────────── */}
      <section className="mt-10" aria-label="Open decisions on this screen">
        <h2 className="text-xl font-semibold">Open decisions this screen depends on</h2>
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          Each is rendered by the one component that renders an open decision on any surface, from
          the one record in the canon. This screen writes no disclosure prose of its own: a second
          wording is how two screens end up disclosing the same decision differently.
        </p>
        <div className="mt-4 grid gap-4">
          <DecisionDisclosure id="DEC-NOTIFPREF-001" />
          <DecisionDisclosure id="DEC-NOTIFCOUNT-001" />
          <DecisionDisclosure id="DEC-NOTIFSEV-001" />
          <DecisionDisclosure id="DEC-NOTIFACK-001" />
        </div>
        <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]">
          <strong>DEC-NOTIFPRI-001 is deliberately not rendered here.</strong> It asks whether a
          notification priority axis exists at all, and this screen draws no priority — no cell, no
          column, no label. Attaching its disclosure to a screen that presents nothing it governs
          would put the record in a second place for no reader&rsquo;s benefit. The abstention is
          stated because a stated abstention and an oversight look identical from outside.
        </p>
      </section>
    </HubShell>
  )
}

/** Re-exported for the suites, which address rows by id. */
export type { Doh10ControlId }

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import { Button, Table, StatusPill, type TableRow } from '@/ui/primitives'
import type { TenantState } from '@/surfaces/doh/tenant-state'
import { DOH_CATALOGUE_B_REACH_NARROWER, dohScreenById } from '@/surfaces/doh/screens'
import {
  CONTROL_MATRIX,
  DOH_19_FINDINGS,
  DOH_19_REGISTER_GAP,
  UNSPECIFIED_IN_SOURCE,
  doh19Row,
} from '@/surfaces/doh/modules/doh-19/matrix'
import {
  doh19Affordance,
  doh19RolesReaching,
  type Doh19Affordance,
} from '@/surfaces/doh/modules/doh-19/rendering'
import { SCREEN_TITLE } from './title'

/**
 * `SCR-DOH-06` — the parts registry, at `/hub/parts-registry`. Catalogue B
 * row L48100.
 *
 * ── THIS SCREEN DRAWS WHAT THE FOLD RETURNS AND DECIDES NOTHING ───────────
 * Every control comes from `doh19Affordance(row, role, tenantState)`. There
 * is no `role ===` and no `status ===` anywhere in this file: the
 * classification-first rule lives in
 * `@/surfaces/doh/modules/doh-19/rendering`, and a screen that re-asked any
 * part of it would be a second place the answer could be spelled differently.
 *
 * ── WHY THE SHELL IS GIVEN `screen` AND NOT `module` ──────────────────────
 * NOT because of a registration gap any more. `MOD-DOH-19` is in
 * `DOH_MODULES`, `registries/generated/doh/module-reach.json` carries its
 * derived reach, and every OTHER Hub module route's rail now links here — so
 * "the rail does not offer this route", which stood here, is false.
 *
 * What is still true is narrower and is the whole reason: the shell's
 * `module` header prints `{id} · {SCR-DOH-NN}` and the module's purpose, and
 * this route's annotation carries more than that — the module id, the
 * catalogue B screen id and the route path together. Passing `module` would
 * drop the disclosure to gain a breadcrumb. The cost is disclosed rather than
 * hidden: because the shell draws its rail only in `module` mode, THIS route
 * draws none, so a reader arrives here and cannot navigate onward from the
 * rail. That is `HubShell`'s shape and not this module's to change.
 *
 * Reach is DERIVED either way — `doh19RolesReaching()` runs the shared rule
 * over this module's own matrix and is printed below.
 */


/** Seeded master data. Deterministic: no clock, no counter, no randomness. */
interface SeededPart {
  readonly partId: string
  readonly name: string
  readonly state: 'active' | 'archived'
  readonly origin: 'Bulk upload' | 'Studio inline-add'
}

const SEEDED_PARTS: readonly SeededPart[] = [
  { partId: 'PRT-BRIGHT-BIKES-WHEEL-BOLT-M12', name: 'Wheel bolt M12', state: 'active', origin: 'Bulk upload' },
  { partId: 'PRT-BRIGHT-BIKES-BRACKET-B-114', name: 'Bracket B-114', state: 'active', origin: 'Bulk upload' },
  { partId: 'PRT-BRIGHT-BIKES-CHAIN-GUARD-C-2', name: 'Chain guard C-2', state: 'active', origin: 'Studio inline-add' },
  { partId: 'PRT-BRIGHT-BIKES-SPACER-S-08', name: 'Spacer S-08', state: 'archived', origin: 'Bulk upload' },
]

/**
 * ONE affordance, drawn. FOUR kinds, and no branch of this switch can draw a
 * disabled control — `Doh19Affordance` has no such arm. That is the deferral
 * ruling enforced by the type rather than by this file's good behaviour.
 */
function Affordance({ id, affordance }: { id: string; affordance: Doh19Affordance }) {
  switch (affordance.kind) {
    case 'control':
      return (
        <div data-testid={`affordance-${id}`} data-kind="control">
          <Button variant="secondary">{affordance.label}</Button>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.conditions}</p>
        </div>
      )
    case 'read-only':
      return (
        <div data-testid={`affordance-${id}`} data-kind="read-only">
          <p className="font-medium text-[var(--color-ink)]">{affordance.label}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.reason}</p>
        </div>
      )
    case 'cross-surface':
      return (
        <div
          role="note"
          data-testid={`affordance-${id}`}
          data-kind="cross-surface"
          data-owned-here={String(affordance.ownedHere)}
          className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            {affordance.ownedHere
              ? `Done in the ${affordance.performedOn}. Owned here.`
              : `Owned by the ${affordance.performedOn}.`}
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{affordance.reason}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{affordance.note}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            No control for this act exists here, enabled or disabled.
          </p>
          {affordance.openDecision !== null ? (
            <p data-testid={`open-decision-${id}`} className="mt-2 text-xs text-[var(--color-ink-muted)]">
              {affordance.openDecision}
            </p>
          ) : null}
          {affordance.linkHref !== null && affordance.linkLabel !== null ? (
            <p className="mt-2">
              <Link href={affordance.linkHref} className="underline text-[var(--color-ink)]">
                {affordance.linkLabel}
              </Link>
            </p>
          ) : null}
        </div>
      )
    case 'absent':
      return (
        <div data-testid={`affordance-${id}`} data-kind="absent">
          <p className="text-xs text-[var(--color-ink-muted)]">{affordance.reason}</p>
        </div>
      )
  }
}

/**
 * The registry list. Governed by row 5 alone: `Unavailable` withholds the
 * route itself, `Read-only` renders the table with no write path, `Allowed`
 * renders it beside the write rows.
 */
function RegistryTable({ role, tenantState }: { role: TenantRoleId; tenantState: TenantState }) {
  const affordance = doh19Affordance(doh19Row('view-the-registry'), role, tenantState)

  if (affordance.kind === 'absent') {
    return (
      <div role="note" data-testid="registry-absent" className="text-sm">
        <p className="text-[var(--color-ink-muted)]">{affordance.reason}</p>
      </div>
    )
  }

  const rows: TableRow[] = SEEDED_PARTS.map((part) => ({
    name: part.name,
    identifier: <code className="text-xs">{part.partId}</code>,
    state: (
      <StatusPill
        tone={part.state === 'active' ? 'ok' : 'neutral'}
        icon={part.state === 'active' ? '●' : '○'}
        label={part.state === 'active' ? 'Active' : 'Archived'}
      />
    ),
    origin: part.origin,
  }))

  return (
    <>
      <Table
        caption="Parts registry — tenant master data"
        columns={[
          { key: 'name', header: 'Part' },
          { key: 'identifier', header: 'Platform-minted identifier' },
          { key: 'state', header: 'State' },
          { key: 'origin', header: 'How it got here' },
        ]}
        rows={rows}
        emptyState={{
          title: 'No part is registered',
          whatCreatesIt:
            'Parts arrive by bulk comma-separated-values upload, or one at a time through the Studio inline-add seam during work-instruction authoring.',
        }}
      />
      <p data-testid="identifier-is-minted" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        The platform mints every internal identifier. No author and no upload column influences it,
        on this surface or in the Studio.
      </p>
    </>
  )
}

export function PartsRegistryScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')

  const reach = doh19RolesReaching()
  const narrowing = DOH_CATALOGUE_B_REACH_NARROWER.find((n) => n.screenId === 'SCR-DOH-06')
  const catalogueB = dohScreenById('SCR-DOH-06')

  return (
    <HubShell
      screen={{
        title: SCREEN_TITLE,
        annotation: 'MOD-DOH-19 · SCR-DOH-06 · /hub/parts-registry',
        purpose:
          'Hold the tenant’s part master data so work instructions can reference parts and genealogy can record what was consumed.',
      }}
      role={role}
      onRoleChange={setRole}
      tenantState={tenantState}
    >
      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">The registry</h2>
        <div className="flex items-center gap-3 text-sm">
          <label htmlFor="tenant-state-select" className="text-[var(--color-ink-muted)]">
            Tenant state
          </label>
          <select
            id="tenant-state-select"
            data-testid="tenant-state-select"
            value={tenantState}
            onChange={(e) => setTenantState(e.target.value as TenantState)}
            className="rounded border border-[var(--color-border-strong)] px-2 py-1"
          >
            <option value="active">active</option>
            <option value="soft-suspended">soft-suspended</option>
            <option value="hard-suspended">hard-suspended</option>
            <option value="compliance-suspended">compliance-suspended</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <RegistryTable role={role} tenantState={tenantState} />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">What this role may do</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Eight rows, transcribed from the control matrix at L30070–L30077. Two of them are
          performed on another surface and one of those two writes a record this surface still
          owns — a second entry point is not a second owner.
        </p>
        <ul className="space-y-4">
          {CONTROL_MATRIX.map((row) => (
            <li key={row.id} data-testid={`row-${row.id}`} className="border-t border-[var(--color-border)] pt-3">
              <p className="text-sm font-medium text-[var(--color-ink)]">{row.control}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</p>
              <div className="mt-2">
                <Affordance id={row.id} affordance={doh19Affordance(row, role, tenantState)} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">Who reaches this screen</h2>
        <p data-testid="derived-reach" className="text-sm text-[var(--color-ink-muted)]">
          Derived from this module’s own matrix: {reach.join(', ')}.
        </p>
        <p data-testid="catalogue-b-narrower" className="text-sm text-[var(--color-ink-muted)]">
          Catalogue B’s cell for this screen names {catalogueB.catalogueBRoles}. It is narrower than
          the matrix, and the roles it omits are {narrowing?.omittedRoles.join(' and ')} —{' '}
          {narrowing?.matrixRef}. The rail is derived from the matrix, never transcribed from the
          catalogue.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Findings on this card</h2>
        <ul className="space-y-3">
          {DOH_19_FINDINGS.map((f) => (
            <li key={f.id} data-testid={`finding-${f.id}`} className="text-sm">
              <p className="font-medium text-[var(--color-ink)]">{f.title}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{f.what}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{f.why}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{f.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">The boundary register does not hold either adjacent row</h2>
        <p data-testid="register-gap" className="text-sm text-[var(--color-ink-muted)]">
          {DOH_19_REGISTER_GAP.gap}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {DOH_19_REGISTER_GAP.andRow2WouldStillNotFit}
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Unspecified in the source</h2>
        <ul className="space-y-3">
          {UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.id} data-testid={`unspecified-${u.id}`} className="text-sm">
              <p className="font-medium text-[var(--color-ink)]">{u.question}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{u.what}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{u.treatment}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{u.sourceRef}</p>
            </li>
          ))}
        </ul>
      </section>
    </HubShell>
  )
}

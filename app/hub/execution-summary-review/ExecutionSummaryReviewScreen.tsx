'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import { Button, StatusPill, Table, type StatusTone, type TableRow } from '@/ui/primitives'
import { DOH_CATALOGUE_AB_SWAP } from '@/surfaces/doh/screens'
import { fallbackPattern } from '@/surfaces/doh/fallbacks'
import {
  CONTROL_MATRIX,
  DOH_08_CONTRADICTIONS,
  UNSPECIFIED_IN_SOURCE,
} from '@/surfaces/doh/modules/doh-08/matrix'
import { doh08Affordance, doh08RolesReaching } from '@/surfaces/doh/modules/doh-08/rendering'
import type { Doh08Affordance } from '@/surfaces/doh/modules/doh-08/rendering'
import {
  AGING_BAND_LABEL,
  DETAIL_SCREEN_ID,
  QUEUE_SCREEN_ID,
  REVIEW_QUEUE,
  SCREEN_TITLE,
  bandFor,
  type QueueItem,
} from './fixtures'

/**
 * `SCR-DOH-16` — the Execution Summary review queue, at `/hub/execution-summary-review`
 * — with `SCR-DOH-17`, the Summary detail and Anomaly Register, as its
 * sub-view. Catalogue B, L48110 and L48111; the swap against catalogue A is
 * disclosed on screen and never silently picked.
 *
 * ── THIS SCREEN DRAWS WHAT THE FOLD RETURNS, AND DECIDES NOTHING ──────────
 * Every control below comes from `doh08Affordance(row, role)`. There is no
 * `role === 'QUALITY_MANAGER'` anywhere in this file and no `status ===`
 * either: the classification-first rule lives in
 * `@/surfaces/doh/modules/doh-08/rendering`, and a screen that re-asked any
 * part of it would be a second place the answer could be spelled differently.
 *
 * ── WHY THE SHELL IS GIVEN `screen` AND NOT `module` ──────────────────────
 * `HubShell`'s `module` prop takes a `DohModuleDefinition`, and `MOD-DOH-08`
 * is not in `DOH_MODULES` — it is still in `DOH_OUT_OF_SLICE_MODULES`, and
 * moving it is an edit to a file this task may not make. So the shell gets the
 * uncatalogued-screen shape with the real identifiers in its annotation, the
 * rail does not offer this route, and the gap is reported rather than papered
 * over with a hand-written rail entry.
 */

/** The card's own three review states, L28290, spelled for a reader. */
const REVIEW_STATE_LABEL = {
  unreviewed: 'Unreviewed',
  in_review: 'In review',
  reviewed: 'Reviewed',
} as const

const BAND_ICON: Readonly<Record<string, string>> = {
  'under-24h': '\u25CB',
  'aged-24h': '\u25D4',
  'aged-48h': '\u25D1',
  'aged-72h': '\u25CF',
}

const BAND_TONE: Readonly<Record<string, StatusTone>> = {
  'under-24h': 'neutral',
  'aged-24h': 'info',
  'aged-48h': 'attention',
  'aged-72h': 'blocked',
}

/** The rows this screen offers as controls, in matrix order. */
const ACTION_ROWS = [
  'mark-a-summary-reviewed',
  'flag-an-anomaly',
  'reclassify-an-anomaly-severity',
  'resolve-an-anomaly',
  'release-a-severity-1-lot-hold',
  'edit-a-capture-or-evidence',
  'add-a-correction-annotation',
  'force-a-re-finalisation',
  'export-the-pdf-summary',
] as const

function row(id: string) {
  const found = CONTROL_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`Unknown MOD-DOH-08 control: ${id}`)
  return found
}

/**
 * ONE affordance, drawn. The five kinds draw five different things and a
 * `disabled` button is reachable from exactly one of them — the routed
 * prohibition whose target this persona actually holds.
 */
function Affordance({ id, affordance }: { id: string; affordance: Doh08Affordance }) {
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
    case 'disabled':
      return (
        <div data-testid={`affordance-${id}`} data-kind="disabled">
          <Button variant="secondary" disabledReason={affordance.reason}>
            {affordance.label}
          </Button>
        </div>
      )
    case 'cross-surface':
      return (
        <div
          role="note"
          data-testid={`affordance-${id}`}
          data-kind="cross-surface"
          className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            Cross-surface boundary — owned by the Client Command Center
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{affordance.reason}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            Not a schedule and not a refusal: this act lives on another surface permanently, and
            no control for it exists here, enabled or disabled.
          </p>
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

function QueueTable({ items, role }: { items: readonly QueueItem[]; role: TenantRoleId }) {
  const queueRow = row('work-the-review-queue')
  const affordance = doh08Affordance(queueRow, role)

  if (affordance.kind === 'absent') {
    return (
      <div role="note" data-testid="queue-absent" className="text-sm">
        <p className="text-[var(--color-ink-muted)]">{affordance.reason}</p>
      </div>
    )
  }

  const rows: TableRow[] = items.map((item) => {
    const band = bandFor(item)
    return {
      run: item.runLabel,
      area: item.areaId,
      aging: (
        <StatusPill
          tone={BAND_TONE[band] ?? 'neutral'}
          icon={BAND_ICON[band] ?? '\u2014'}
          label={AGING_BAND_LABEL[band]}
        />
      ),
      state: REVIEW_STATE_LABEL[item.reviewState],
      anomalies: String(item.summary.anomalies.length),
    }
  })

  return (
    <>
      <Table
        caption="Review queue — Area-scoped, oldest first"
        columns={[
          { key: 'run', header: 'Run' },
          { key: 'area', header: 'Area' },
          { key: 'aging', header: 'Aging' },
          { key: 'state', header: 'Review state' },
          { key: 'anomalies', header: 'Anomalies' },
        ]}
        rows={rows}
        emptyState={{
          title: 'No Summary is waiting for review',
          whatCreatesIt:
            'A Summary enters this queue when its run reaches complete and the tenant review toggle is on.',
        }}
      />
      <p data-testid="aging-is-not-a-lock" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        The highlights at 24, 48 and 72 hours are the pressure, not a lock. No review
        service-level agreement is enforced: an item past 72 hours is highlighted and appears in
        the per-shift digest, and the platform does not lock the run, does not block the finish
        and does not escalate. L28269, L28338.
      </p>
    </>
  )
}

export function ExecutionSummaryReviewScreen() {
  const [role, setRole] = useState<TenantRoleId>('QUALITY_MANAGER')
  const [selectedId, setSelectedId] = useState<string>(REVIEW_QUEUE[0]?.summary.summaryId ?? '')
  const selected = REVIEW_QUEUE.find((i) => i.summary.summaryId === selectedId) ?? REVIEW_QUEUE[0]
  const reaching = doh08RolesReaching()

  return (
    <HubShell
      screen={{
        title: SCREEN_TITLE,
        annotation: `MOD-DOH-08 · ${QUEUE_SCREEN_ID} with ${DETAIL_SCREEN_ID} as its sub-view`,
        purpose:
          'Compute the honest record of what a run produced, put anything abnormal in front of a Quality Manager, and keep the record correctable without ever rewriting it.',
      }}
      role={role}
      onRoleChange={setRole}
    >
      <section aria-label="Review queue" className="mt-6">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          {QUEUE_SCREEN_ID} — Execution Summary review queue
        </h2>
        <div className="mt-3">
          <QueueTable items={REVIEW_QUEUE} role={role} />
        </div>
      </section>

      <section aria-label="Summary detail and Anomaly Register" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          {DETAIL_SCREEN_ID} — Summary detail and Anomaly Register
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          A sub-view of the review queue, not a route of its own: catalogue B enters it from
          &ldquo;Review queue&rdquo; (L48111).
        </p>

        {selected === undefined ? null : (
          <>
            <p className="mt-3 text-sm text-[var(--color-ink)]">
              {selected.runLabel} — {selected.summary.summaryId}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              A computed view, not a stored document. {' '}
              {selected.recomputing
                ? 'Inside the finish window: this Summary recomputes as late data lands, and every recompute is logged.'
                : 'The finish window has elapsed and the Summary is closed with its run.'}
              {selected.lateData
                ? ' Late data: an accepted correction forced an audited recompute, the prior computed output is preserved, and the reviewing Quality Manager was notified.'
                : ''}
            </p>

            <ul className="mt-3 space-y-2" aria-label="Anomaly Register">
              {selected.summary.anomalies.length === 0 ? (
                <li className="text-sm text-[var(--color-ink-muted)]">
                  No anomaly is flagged on this Summary.
                </li>
              ) : (
                selected.summary.anomalies.map((a) => (
                  <li key={a.anomalyId} className="text-sm text-[var(--color-ink)]">
                    {a.anomalyId} — {a.severity} — {a.state}
                    {a.closureNote === null ? (
                      <span className="text-[var(--color-ink-subtle)]">
                        {' '}
                        — open, and resolution requires a closure note
                      </span>
                    ) : (
                      <span className="text-[var(--color-ink-muted)]"> — {a.closureNote}</span>
                    )}
                  </li>
                ))
              )}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {REVIEW_QUEUE.map((item) => (
                <button
                  key={item.summary.summaryId}
                  type="button"
                  onClick={() => setSelectedId(item.summary.summaryId)}
                  className="rounded border border-[var(--color-border-strong)] px-2 py-1 text-xs text-[var(--color-ink)]"
                >
                  {item.summary.summaryId}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section aria-label="What this screen offers" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          What this screen offers you
        </h2>
        <ul className="mt-3 space-y-4">
          {ACTION_ROWS.map((id) => (
            <li key={id}>
              <Affordance id={id} affordance={doh08Affordance(row(id), role)} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="The review toggle" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">The review toggle</h2>
        <div className="mt-2">
          <Affordance
            id="set-the-review-toggle"
            affordance={doh08Affordance(row('set-the-review-toggle'), role)}
          />
        </div>
        <p data-testid="review-toggle-constraint" className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Review is a tenant-wide toggle, default off, and it is forced on and not disableable in
          Regulated-Industry mode. The constraint renders; the control does not. MOD-DOH-17
          Regulated-Industry Mode is read for this constraint and is not built in this slice.
        </p>
      </section>

      <section aria-label="Deferred beyond V1" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Deferred beyond V1</h2>
        <ul className="mt-2 space-y-3">
          {(['bulk-or-automated-pdf-distribution', 'set-a-per-area-review-toggle'] as const).map(
            (id) => (
              <li key={id}>
                <Affordance id={id} affordance={doh08Affordance(row(id), role)} />
              </li>
            ),
          )}
        </ul>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          Three sources disagree on how a deferred capability renders — AC-DOH-014-2 at L25935
          permits a disabled control with an explanatory line, SB-DOH-005 at L25924 asks for a line
          rather than a disabled control or an empty region, and the inherited slice-4 rule maps
          Not applicable to absent with the reason in help text. This build follows the inherited
          rule and names none of the three as the source&rsquo;s answer.
        </p>
      </section>

      <section aria-label="Contradictions disclosed" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Contradictions in the source, disclosed
        </h2>
        {DOH_08_CONTRADICTIONS.map((c) => (
          <div
            key={c.id}
            role="note"
            data-testid={`contradiction-${c.id}`}
            className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              {c.id} — grade {c.grade}
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">{c.question}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              All readings stand. None is named as the source&rsquo;s answer.
            </p>
            <ul className="mt-1 space-y-2">
              {c.readings.map((r) => (
                <li key={r.locator}>
                  <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
                  <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{r.locator}]
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              True under every reading
            </p>
            <p className="mt-1 text-[var(--color-ink)]">{c.commonToBoth}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              What this build renders
            </p>
            <p className="mt-1 text-[var(--color-ink)]">{c.position}</p>
          </div>
        ))}
      </section>

      <section aria-label="Screen catalogue divergence" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          The two screen catalogues disagree about this module
        </h2>
        <p
          data-testid="catalogue-swap"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {DOH_CATALOGUE_AB_SWAP.statement}
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          Grade {DOH_CATALOGUE_AB_SWAP.grade}. This build follows {DOH_CATALOGUE_AB_SWAP.followed}:{' '}
          {DOH_CATALOGUE_AB_SWAP.catalogueB.map((s) => `${s.screenId} ${s.name} (${s.sourceRef})`).join('; ')}. Catalogue
          A reverses them:{' '}
          {DOH_CATALOGUE_AB_SWAP.catalogueA.map((s) => `${s.name} (${s.sourceRef})`).join('; ')}.
          Catalogue A also gives this module a third screen, an Anomaly Register of its own at
          L26068, which catalogue B holds inside {DETAIL_SCREEN_ID}.
        </p>
      </section>

      <section aria-label="Who reaches this module" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Who reaches this module</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Derived from this module&rsquo;s own control matrix and never hand-written:{' '}
          {reaching.join(', ')}. Row 2 at L28301 marks the Tenant Admin, the Supervisor and the
          Worker Unavailable on the review queue, and that token withholds the whole module — even
          though rows 1, 7 and 12 give the Tenant Admin grants on viewing a Summary, viewing the
          register and exporting. Those grants are real and are met on no screen in this slice.
        </p>
      </section>

      <section aria-label="What the source leaves unspecified" className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          What the source leaves unspecified
        </h2>
        <ul className="mt-2 space-y-2 text-sm">
          {UNSPECIFIED_IN_SOURCE.map((s) => (
            <li key={s.subject}>
              <span className="font-medium text-[var(--color-ink)]">{s.subject}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{s.statement}</span>{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{s.locator}]</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">
          Write failures on this screen follow {fallbackPattern('FB-DOH-WRITE-002').id}:{' '}
          {fallbackPattern('FB-DOH-WRITE-002').terminalSafeState}
        </p>
      </section>
    </HubShell>
  )
}

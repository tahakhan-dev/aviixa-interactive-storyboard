'use client'

import { bg, borderColor, radiusClass, statusBg, statusText, textColor, type StatusToken } from './tokens'

/**
 * Task 12, pass criterion 5 — groups rows by correlation id (OBJ-084 ·
 * Audit's own field, master prompt §19.3: "correlation/causation/
 * idempotency/sequence"), and every row states actor, action and result
 * explicitly rather than leaving any of the three to be inferred from a
 * free-text line. This is what makes an audit reconstruction readable: a
 * reader can see, per causal chain, who did what and what happened —
 * instead of a flat log they must cross-reference by eye.
 *
 * `kind` covers all four row families this renders across the five
 * surfaces: event, command, notification, audit — the same "domain event /
 * audit event / command / notification" objects `src/data/repository.ts`
 * and `src/data/schemas/crosscutting.ts` already carry, never a fifth kind
 * invented here.
 *
 * Grouping preserves first-seen order (`Map` insertion order): the caller
 * is expected to pass entries already sorted chronologically, and this
 * component groups without re-sorting — re-sorting here would risk
 * disagreeing with whatever order the caller's own query produced.
 */
export type TimelineEntryKind = 'event' | 'command' | 'notification' | 'audit'
export type TimelineResult = 'success' | 'denied' | 'failed' | 'pending'

export interface TimelineEntry {
  readonly id: string
  readonly correlationId: string
  readonly kind: TimelineEntryKind
  readonly actor: string
  readonly action: string
  readonly result: TimelineResult
  readonly occurredAtLabel: string
}

export interface TimelineProps {
  readonly controlId: string
  readonly entries: readonly TimelineEntry[]
}

const RESULT_TONE: Readonly<Record<TimelineResult, StatusToken>> = {
  success: 'ok',
  denied: 'blocked',
  failed: 'danger',
  pending: 'pending',
}

const KIND_ICON: Readonly<Record<TimelineEntryKind, string>> = {
  event: '◈',
  command: '➤',
  notification: '🔔',
  audit: '📜',
}

function groupByCorrelation(entries: readonly TimelineEntry[]): Map<string, TimelineEntry[]> {
  const groups = new Map<string, TimelineEntry[]>()
  for (const entry of entries) {
    const existing = groups.get(entry.correlationId)
    if (existing) existing.push(entry)
    else groups.set(entry.correlationId, [entry])
  }
  return groups
}

function EntryRow({ entry }: { readonly entry: TimelineEntry }) {
  return (
    <>
      <span aria-hidden="true">{KIND_ICON[entry.kind]}</span>
      <span className={`font-medium ${textColor('ink')}`}>{entry.actor}</span>
      <span className={textColor('ink-muted')}>{entry.action}</span>
      <span
        className={`inline-flex items-center gap-1 ${radiusClass('pill')} px-1.5 py-0.5 text-xs font-medium ${statusBg(RESULT_TONE[entry.result])} ${statusText(RESULT_TONE[entry.result])}`}
      >
        {entry.result}
      </span>
      <span className={`text-xs ${textColor('ink-subtle')}`}>{entry.occurredAtLabel}</span>
    </>
  )
}

export function Timeline({ controlId, entries }: TimelineProps) {
  const groups = groupByCorrelation(entries)

  return (
    <div data-control-id={controlId} className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([correlationId, group]) => {
        const rowClassName = `flex flex-wrap items-baseline gap-2 border-l-2 ${borderColor('border')} pl-3 text-sm`
        // Fix round 1 (Task 6, review MINOR) — a real audit collection is
        // mostly singleton correlations (one row, one cause, nothing else
        // in the chain): grouping affordance (the box + "Correlation ..."
        // heading) is only meaningful where it actually groups more than
        // one row. A singleton renders as a plain row, matching every
        // other entry visually, with no opaque correlation id printed for
        // a chain of one.
        if (group.length === 1) {
          const entry = group[0]!
          return (
            <div key={correlationId} data-control-id={`${controlId}-row-${entry.id}`} className={rowClassName}>
              <EntryRow entry={entry} />
            </div>
          )
        }
        return (
          <section
            key={correlationId}
            data-control-id={`${controlId}-group-${correlationId}`}
            className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-3`}
          >
            <h4 className={`text-xs font-semibold uppercase tracking-wide ${textColor('ink-muted')}`}>
              {`Correlation ${correlationId}`}
            </h4>
            <ol className="mt-2 flex flex-col gap-2">
              {group.map((entry) => (
                <li key={entry.id} className={rowClassName}>
                  <EntryRow entry={entry} />
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

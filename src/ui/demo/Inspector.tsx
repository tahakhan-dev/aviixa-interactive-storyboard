'use client'

import { useEffect, useState } from 'react'
import { useDemoData } from './DemoChrome'
import { PropagationDrawer } from './PropagationDrawer'
import { EvidencePanel } from './EvidencePanel'

/**
 * Task 14 — "one inspector, holding the live cross-surface propagation
 * drawer …, the event/command/notification/schedule/audit timeline, and the
 * source, decision, acceptance, test and review evidence for the current
 * screen" (design doc §5). Three tabs, one per clause: Propagation
 * (`PropagationDrawer`), Timeline (`AuditTimeline` below), Evidence
 * (`EvidencePanel`).
 */
type TabId = 'propagation' | 'timeline' | 'evidence'

const TABS: readonly { readonly id: TabId; readonly label: string }[] = [
  { id: 'propagation', label: 'Propagation' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'evidence', label: 'Evidence' },
]

/** OBJ-024/083 events, OBJ-082 commands, OBJ-060 notifications, schedules, OBJ-084 audit — the design doc's own list, in order. */
const TIMELINE_COLLECTIONS = ['events', 'commands', 'notifications', 'schedules', 'audit'] as const

/**
 * Also the readout task-14's own pass criterion 2 is checked against live:
 * the `audit` row (last one, in this list) shows its count and its last
 * row's id, screenshotted before and after a `RoleSimulator` persona
 * switch — identical counts and ids there is the proof a persona switch
 * touches no product audit row.
 */
function AuditTimeline() {
  const { repository, reviewerAccess } = useDemoData()
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!repository) return
    return repository.subscribe(() => setVersion((v) => v + 1))
  }, [repository])

  if (!repository || !reviewerAccess) {
    return <p data-demo="timeline-empty">Repository still booting…</p>
  }

  return (
    <div data-demo="timeline" className="flex flex-col gap-2">
      <span data-demo="timeline-version" className="text-[#c9b3ff]">
        live reads: {version}
      </span>
      {TIMELINE_COLLECTIONS.map((name) => {
        const rows = repository.list(name, reviewerAccess).all()
        const last = rows[rows.length - 1] as Record<string, unknown> | undefined
        const lastId = last && typeof last.id === 'string' ? last.id : '(none)'
        return (
          <div
            key={name}
            data-demo="timeline-row"
            data-collection={name}
            className="rounded border border-[#4a3070] bg-[#241542] p-2"
          >
            <div className="font-semibold">{name}</div>
            <div data-demo="timeline-count">{rows.length} rows</div>
            <div data-demo="timeline-last-id">last: {lastId}</div>
          </div>
        )
      })}
    </div>
  )
}

export function Inspector() {
  const [active, setActive] = useState<TabId>('propagation')

  return (
    <div data-demo="inspector" className="flex flex-col gap-3">
      <div role="tablist" className="flex gap-2 border-b border-[#4a3070] pb-1">
        {TABS.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-control-id={`demo-inspector-tab-${tab.id}`}
              data-demo="control"
              onClick={() => setActive(tab.id)}
              className={`rounded-t px-2 py-1 ${
                selected ? 'bg-[#33204f] font-semibold text-[#f5d90a]' : 'text-[#c9b3ff] hover:bg-[#2a1a4a]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" data-demo="inspector-panel">
        {active === 'propagation' ? <PropagationDrawer /> : null}
        {active === 'timeline' ? <AuditTimeline /> : null}
        {active === 'evidence' ? <EvidencePanel /> : null}
      </div>
    </div>
  )
}

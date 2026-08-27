'use client'

import type { ReactNode } from 'react'
import { bg, borderColor, controlMinClass, radiusClass, textColor } from '../tokens'
import { ConnectivityBadge, type ConnectivityStatus } from './ConnectivityBadge'
import { SyncQueueBadge, type SyncQueueCounts } from './SyncQueueBadge'

/**
 * Task 13 — the full-screen shell a worker executes a Run inside. Five
 * facts stay on screen at all times: who is working (`workerLabel`), on
 * which device (`deviceLabel`), which Run (`runLabel`), and which pinned
 * package AND VERSION (`packageName`/`packageVersion` — two required
 * fields rather than one caller-formatted string, so the version cannot be
 * silently left out the way a single optional string would let it be: "a
 * worker must never have to navigate away to find out which version they
 * are executing" only holds if the type cannot drop the version). Simulated
 * connectivity and the sync queue ride along beside them, always visible,
 * never behind a second screen.
 *
 * SHALLOW BY CONSTRUCTION, NOT BY CONVENTION: this header has exactly one
 * navigation control — `onExit` — and no tabs, no secondary menu, no
 * breadcrumb trail. `AppShell`'s own `tabbar` chrome (Task 9) already
 * covers cross-destination navigation for the other five Frontline
 * destinations; the Run Player, once entered, is a single screen with
 * `StepCanvas`-driven forward/back and one way out.
 *
 * `min-h-full`, NOT `min-h-dvh`: this shell may be mounted directly in the
 * real viewport OR inside `DeviceFrame`'s framed screen area, and filling
 * "its container" rather than "the physical viewport" is what keeps it
 * identical in both — the same discipline `DeviceFrame`'s own doc comment
 * describes from the other side.
 */
export interface RunPlayerShellProps {
  readonly workerLabel: string
  readonly deviceLabel: string
  readonly runLabel: string
  readonly packageName: string
  readonly packageVersion: string
  readonly connectivity: ConnectivityStatus
  readonly queueCounts: SyncQueueCounts
  readonly onExit: () => void
  readonly exitLabel?: string | undefined
  readonly children: ReactNode
}

function Fact({ term, value }: { readonly term: string; readonly value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <dt className={textColor('ink-subtle')}>{term}</dt>
      <dd className={`font-medium ${textColor('ink')}`}>{value}</dd>
    </div>
  )
}

export function RunPlayerShell({
  workerLabel,
  deviceLabel,
  runLabel,
  packageName,
  packageVersion,
  connectivity,
  queueCounts,
  onExit,
  exitLabel = 'Exit run',
  children,
}: RunPlayerShellProps) {
  return (
    <div className={`flex min-h-full flex-col ${bg('sunken')}`}>
      <header
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b ${borderColor('border')} ${bg('raised')} px-4 py-3`}
      >
        <button
          type="button"
          data-control-id="fl-run-player-exit"
          onClick={onExit}
          className={`${controlMinClass('spacious')} ${radiusClass('md')} border ${borderColor('border-strong')} px-4 text-sm font-semibold ${textColor('ink')}`}
        >
          {exitLabel}
        </button>

        <dl className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
          <Fact term="Worker" value={workerLabel} />
          <Fact term="Device" value={deviceLabel} />
          <Fact term="Run" value={runLabel} />
          <Fact term="Package" value={`${packageName} · v${packageVersion}`} />
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <ConnectivityBadge status={connectivity} />
          <SyncQueueBadge counts={queueCounts} controlId="fl-run-player-sync-queue" />
        </div>
      </header>

      {/* `textColor('ink')` here for the same reason `AppShell`'s own `<main>`
          sets it (Task 9 fix round 1): `color` inherits, so this is what
          keeps a caller's unstyled content legible against the dark
          `--sunken` background instead of falling back to the browser's
          default black text. */}
      <main className={`flex-1 px-4 py-4 ${textColor('ink')}`}>{children}</main>
    </div>
  )
}

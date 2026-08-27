'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { CONNECTIVITY_MODES, type ConnectivityMode } from '@/scenario/controls'
import {
  DEMO_CHECKPOINTS,
  FAILURE_INJECTION_MODES,
  useDemoController,
  useDemoData,
  type FailureInjectionMode,
} from './DemoChrome'

/**
 * Task 14 — connectivity, simulated clock, failure injection, checkpoints,
 * reset, snapshot export/import (design doc §5's exact list for the
 * "scenario controls" chrome piece). Everything here is either local
 * `DemoControllerContext` state (connectivity/clock/failure/checkpoint/
 * reset — never a product write, same guarantee `RoleSimulator` carries) or
 * a call straight through `Repository#exportJson`/`#importJson`
 * (`@/data/repository`), the generic snapshot door that interface already
 * exposes — this file adds no second one.
 */
export function ScenarioControls() {
  const controller = useDemoController()
  const { repository } = useDemoData()
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onConnectivityChange(e: ChangeEvent<HTMLSelectElement>) {
    controller.setConnectivity(e.target.value as ConnectivityMode)
  }

  function onFailureChange(e: ChangeEvent<HTMLSelectElement>) {
    controller.setFailureInjection(e.target.value as FailureInjectionMode)
  }

  function stepCheckpoint(delta: number) {
    const next = controller.checkpointIndex + delta
    if (next < 0 || next >= DEMO_CHECKPOINTS.length) return
    controller.setCheckpoint(next)
  }

  function exportSnapshot() {
    if (!repository) return
    const data = repository.exportJson()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aviixa-scenario-snapshot.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !repository) return
    file
      .text()
      .then((text) => {
        const parsed: unknown = JSON.parse(text)
        const result = repository.importJson(parsed)
        setImportStatus(result.ok ? 'Snapshot imported.' : `Import refused: ${result.problems.join('; ')}`)
      })
      .catch((err: unknown) => {
        setImportStatus(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
      })
      .finally(() => {
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  const clockLabel = new Date(controller.clockMs).toISOString().replace('T', ' ').replace('Z', ' UTC')

  return (
    <div data-demo="scenario-controls" className="flex flex-col gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5">
          <span className="uppercase tracking-wide text-[#c9b3ff]">Connectivity</span>
          <select
            data-control-id="demo-connectivity"
            data-demo="control"
            value={controller.connectivity}
            onChange={onConnectivityChange}
            className="rounded border border-[#f5d90a] bg-[#1b1030] px-1.5 py-1 text-[#f0e6ff]"
          >
            {CONNECTIVITY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="uppercase tracking-wide text-[#c9b3ff]">Failure injection</span>
          <select
            data-control-id="demo-failure-injection"
            data-demo="control"
            value={controller.failureInjection}
            onChange={onFailureChange}
            className="rounded border border-[#f5d90a] bg-[#1b1030] px-1.5 py-1 text-[#f0e6ff]"
          >
            {FAILURE_INJECTION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span data-demo="clock-readout" className="tabular-nums">
          Simulated clock: {clockLabel}
        </span>
        <button
          type="button"
          data-control-id="demo-clock-advance-1h"
          data-demo="control"
          onClick={() => controller.advanceClock(60 * 60 * 1000)}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
        >
          +1h
        </button>
        <button
          type="button"
          data-control-id="demo-clock-advance-1d"
          data-demo="control"
          onClick={() => controller.advanceClock(24 * 60 * 60 * 1000)}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
        >
          +1d
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-control-id="demo-checkpoint-prev"
          data-demo="control"
          disabled={controller.checkpointIndex === 0}
          onClick={() => stepCheckpoint(-1)}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a] disabled:opacity-40"
        >
          ◀ Checkpoint
        </button>
        <span data-demo="checkpoint-label">{DEMO_CHECKPOINTS[controller.checkpointIndex]}</span>
        <button
          type="button"
          data-control-id="demo-checkpoint-next"
          data-demo="control"
          disabled={controller.checkpointIndex === DEMO_CHECKPOINTS.length - 1}
          onClick={() => stepCheckpoint(1)}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a] disabled:opacity-40"
        >
          Checkpoint ▶
        </button>
        <button
          type="button"
          data-control-id="demo-scenario-reset"
          data-demo="control"
          onClick={controller.reset}
          className="ml-2 rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
        >
          Reset controls
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#4a3070] pt-2">
        <button
          type="button"
          data-control-id="demo-snapshot-export"
          data-demo="control"
          disabled={!repository}
          onClick={exportSnapshot}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a] disabled:opacity-40"
        >
          Export snapshot
        </button>
        <label className="flex items-center gap-1.5">
          <span
            className={`rounded border border-[#f5d90a] px-2 py-1 ${repository ? 'cursor-pointer hover:bg-[#2a1a4a]' : 'opacity-40'}`}
          >
            Import snapshot
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            disabled={!repository}
            onChange={onImportFile}
            data-control-id="demo-snapshot-import"
            data-demo="control"
            className="sr-only"
          />
        </label>
        {importStatus ? <span data-demo="import-status">{importStatus}</span> : null}
      </div>
    </div>
  )
}

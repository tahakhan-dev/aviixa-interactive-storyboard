'use client'

import type { ChangeEvent } from 'react'
import type { RoleId } from '@/domain/roles'
import { DEMO_PERSONAS, useDemoController } from './DemoChrome'

/**
 * Task 14 — the reviewer's persona picker. This is the ENTIRE write surface
 * of a persona switch: `onChange` calls `controller.setPersona(id)`, which
 * (see `DemoChrome.tsx`) sets one piece of local React state and rebuilds
 * `ProductSessionContext`'s value from it. There is no other statement in
 * this file. Nothing here imports `@/data/repository`, so there is no way
 * for this control to execute a product command, approve anything, change
 * business state, or touch an existing audit row's actor — the absence of
 * an import is the proof, not a claim about behaviour this file could still
 * add later without anyone noticing.
 */
export function RoleSimulator() {
  const { persona, setPersona } = useDemoController()

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    setPersona(e.target.value as RoleId)
  }

  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-[#c9b3ff]">Persona</span>
      <select
        data-control-id="demo-role-simulator"
        data-demo="control"
        value={persona.id}
        onChange={onChange}
        className="rounded border border-[#f5d90a] bg-[#1b1030] px-1.5 py-1 text-xs text-[#f0e6ff]"
      >
        {DEMO_PERSONAS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
            {p.tenant ? ` — ${p.tenant}` : ' — platform'}
          </option>
        ))}
      </select>
    </label>
  )
}

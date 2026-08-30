'use client'

import { useEffect, useState } from 'react'
import { scenarioStateFor, type AccessContext } from '@/data/repository'
import type { CollectionName } from '@/data/schemas'
import type { Store } from '@/data/store'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import { DEMO_TENANT, useDemoData } from './DemoChrome'

/**
 * Task 14 pass criterion 3: "PropagationDrawer renders each affected
 * surface's real current state read through the repository, not a
 * description of it." Every number and row id below comes from
 * `repository.list(collection, reviewerAccess).all()` at render time —
 * there is no narrated "what would happen" text anywhere in this file.
 *
 * One representative collection per surface, read off the SAME truth-store
 * reasoning `@/data/repository`'s own (unexported) `affectedSurfacesFor`
 * uses (`@/data/truth-stores`'s authority table, quoted in its header
 * comment): platform -> SA, hub -> DOH, studio -> STU, command-queue -> CC
 * (first-listed there), device-local -> FL.
 */
const SURFACE_COLLECTION: Readonly<Record<SurfaceId, CollectionName>> = {
  'SURF-SA': 'tenants',
  'SURF-DOH': 'jobs',
  'SURF-STU': 'workflow-definitions',
  'SURF-CC': 'commands',
  'SURF-FL': 'captures',
}

/**
 * PONYTAIL: no product screen yet issues a real write (workflow units land
 * later in the runway), so this is the drawer's own minimal, honest way to
 * demonstrate propagation today — one generic `Repository#update` against
 * `notifications` (hub authority, `affectedSurfacesFor` -> SURF-DOH,
 * SURF-CC), opening the first seeded notification that has not been opened
 * yet. Upgrade path: delete this button once a real product write exists
 * on any mounted screen, and drive the drawer from that instead.
 */
const DEMO_WRITE_ACTOR = 'USR-BB-SUP-01'

function demoWriteAccessContext(store: Store): AccessContext {
  return {
    state: scenarioStateFor(store),
    identity: {
      signedIn: true,
      role: 'SUPERVISOR',
      tenant: DEMO_TENANT,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: DEMO_WRITE_ACTOR,
  }
}

function summarizeRow(row: unknown): string {
  const rec = row as Record<string, unknown>
  const id = typeof rec.id === 'string' ? rec.id : '(no id)'
  const marker = ['status', 'lifecycle', 'result'].map((k) => rec[k]).find((v) => typeof v === 'string')
  return marker ? `${id} — ${String(marker)}` : id
}

export function PropagationDrawer() {
  const { repository, store, reviewerAccess } = useDemoData()
  // Forces a re-render on every committed write so the cards below re-read
  // the repository — the repository instance itself never changes identity
  // (see `DemoChrome`'s `dataState`), so this effect subscribes exactly
  // once per boot, not once per render.
  const [version, setVersion] = useState(0)
  const [writeMessage, setWriteMessage] = useState<string | null>(null)
  const [lastAffected, setLastAffected] = useState<readonly SurfaceId[]>([])

  useEffect(() => {
    if (!repository) return
    return repository.subscribe(() => setVersion((v) => v + 1))
  }, [repository])

  function runSampleWrite() {
    if (!repository || !store || !reviewerAccess) return
    const target = repository
      .list('notifications', reviewerAccess)
      .where((n) => n.openedAt === null)
      .first()
    if (!target) {
      setWriteMessage(
        'No unopened notification left to demonstrate with — every seeded notification already carries an openedAt.',
      )
      return
    }
    const occurredAt = new Date(store.clock.now()).toISOString()
    repository
      .update('notifications', target.id, { openedAt: occurredAt }, demoWriteAccessContext(store))
      .then((result) => {
        if (result.ok) {
          setLastAffected(result.affectedSurfaces)
          setWriteMessage(`Wrote notifications:${target.id} — affected ${result.affectedSurfaces.join(', ')}.`)
        } else {
          setWriteMessage(`Write refused: ${result.reason}`)
        }
      })
  }

  return (
    <div data-demo="propagation-drawer" className="flex flex-col gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* TEMPORARY (see file header): delete this button once a real product
            write exists on a mounted screen, and drive this drawer from that
            write instead of one this button originates itself. */}
        <button
          type="button"
          data-control-id="demo-propagation-sample-write"
          data-demo="control"
          disabled={!repository}
          onClick={runSampleWrite}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a] disabled:opacity-40"
        >
          Run sample write (open a notification) — temporary
        </button>
        <span data-demo="propagation-version" className="text-[#c9b3ff]">
          live reads: {version}
        </span>
        {writeMessage ? <span data-demo="propagation-write-message">{writeMessage}</span> : null}
      </div>
      <div data-demo="propagation-cards" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {SURFACES.map((surface) => {
          const collection = SURFACE_COLLECTION[surface.id]
          const affected = lastAffected.includes(surface.id)
          const rows = repository && reviewerAccess ? repository.list(collection, reviewerAccess).all() : []
          const recent = [...rows].slice(-3).reverse()
          return (
            <div
              key={surface.id}
              data-demo="propagation-card"
              data-surface={surface.id}
              className={`rounded border p-2 ${affected ? 'border-[#f5d90a] bg-[#33204f]' : 'border-[#4a3070] bg-[#241542]'}`}
            >
              <div className="font-semibold">{surface.id}</div>
              <div className="text-[#c9b3ff]">{surface.name}</div>
              <div className="mt-1">
                {collection}: {rows.length} rows
              </div>
              <ul className="mt-1 space-y-0.5">
                {recent.length === 0 ? <li className="text-[#c9b3ff]">no rows visible</li> : null}
                {recent.map((row) => (
                  <li key={summarizeRow(row)}>{summarizeRow(row)}</li>
                ))}
              </ul>
              {affected ? <div className="mt-1 text-[#f5d90a]">affected by last write</div> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The panel this module mounts into the Run Player, BUILT IN A SERVER MODULE.
 *
 * WHY THIS FILE EXISTS, AND IT IS NOT STYLE. `./WorkerLifecyclePanel` carries
 * `'use client'`. A plain object exported from a client module and imported
 * by a server component does not cross the boundary as data — Next.js
 * replaces client-module exports with client references, so the object's
 * string fields are simply not there when the page prerenders.
 *
 * The route reads `panel.module` to key and label each mounted section. With
 * the panel declared in the client module, that read produced
 * `data-testid="fl-panel-undefined"` in the built HTML for four of the six
 * modules — a page that looked right in a component test and shipped four
 * anonymous panels. `MOD-FL-A3` and `MOD-FL-A4` were unaffected because they
 * already build their panels in server modules, which is what this file
 * copies.
 *
 * So the DATA lives here, on the server, and only the COMPONENT is imported
 * across the boundary — which is exactly what a client boundary is for.
 */
import type { RunPlayerPanel } from 'app/frontline/run-player/RunPlayerRoute'

import { WorkerLifecycleView } from './WorkerLifecyclePanel'
import { B11_VIEW_NAMES } from './service'

export function flb11RunPlayerPanel(): RunPlayerPanel {
  return {
    module: 'MOD-FL-B11',
    heading: 'Worker Lifecycle on Device',
    rendersViews: B11_VIEW_NAMES,
    body: <WorkerLifecycleView />,
  }
}

export const FL_B11_ROUTE_PANEL: RunPlayerPanel = flb11RunPlayerPanel()

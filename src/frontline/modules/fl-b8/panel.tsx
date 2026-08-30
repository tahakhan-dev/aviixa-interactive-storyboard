/**
 * The panel this module mounts into the Run Player, BUILT IN A SERVER MODULE.
 *
 * WHY THIS FILE EXISTS, AND IT IS NOT STYLE. `./CoachingPanel` carries
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
import { FL_PLAYER_VIEWS } from '@/frontline/screens'
import { CoachingView } from './CoachingPanel'

export function flb8RunPlayerPanel(): RunPlayerPanel {
  return {
    module: 'MOD-FL-B8',
    heading: 'Coaching Rendering',
    rendersViews: FL_PLAYER_VIEWS.filter((v) => v.id === 'SCR-FL-13').map((v) => v.name),
    body: <CoachingView />,
  }
}

export const FL_B8_ROUTE_PANEL: RunPlayerPanel = flb8RunPlayerPanel()

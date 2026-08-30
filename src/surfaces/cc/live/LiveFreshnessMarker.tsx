'use client'

import { useState } from 'react'
import {
  CC_MARKER_DEVICE_COLUMNS,
  ccElementAssignment,
  ccInventoryNote,
  ccMarkerForm,
  ccMarkerText,
  ccPendingCapturesText,
  type CcMarkerState,
} from './model'

/* ==================================================================== *
 * THE MARKER, RENDERED. §21.3.2, L35925.
 *
 * WHY THIS EXISTS RATHER THAN A WIDENED `FreshnessLabel`.
 * `src/ui/primitives/FreshnessLabel.tsx` takes `asOfLabel` and `originLabel`,
 * two free-text strings, and renders them joined by a comma. It cannot carry
 * a freshness class, cannot carry the per-element marker obligation the
 * eighteen-row table assigns, has no expansion, and has no way to render
 * "unknown" as anything other than a string a caller remembered to pass —
 * which is exactly the zero `AC-CC-122` (L35981) forbids, one indirection
 * away. It is a shared primitive owned by another task and is read here, not
 * edited.
 *
 * `'use client'` AND NOTHING ELSE CROSSES. This file exports a component and
 * a props interface. Every table it renders is imported from `./model`, which
 * carries no `'use client'`, because Next.js replaces a client module's
 * exports with client references and four Run Player panels shipped
 * `data-testid="fl-panel-undefined"` in slice 7 exactly that way — invisible
 * to every component test, because a component suite mounts the component and
 * the client boundary only exists in a build.
 *
 * THE MARKER RENDERS IN EVERY STATE INCLUDING THE HEALTHY ONE. `AC-CC-120`
 * (L35979), and L35943 says why: "Showing it when everything is fine is what
 * makes it trustworthy when something is not." There is no branch here that
 * returns null.
 *
 * WHY THE NAME CARRIES `Live` AND WHY THAT IS NOT DECORATION.
 * `src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx` ALREADY EXPORTS a
 * component called `FreshnessMarker` and an interface called
 * `FreshnessMarkerProps`. It is a different component: it renders §21.5's
 * card states from `CC02_MARKER_STATES` and has no class assignment and no
 * device expansion. Two same-named marker components in one build is the
 * exact confusion this task exists to prevent one section earlier, so this
 * one is named for its section rather than for its subject. The unit suite
 * asserts the two names stay distinct.
 * ==================================================================== */

export interface LiveFreshnessMarkerProps {
  /**
   * The element this marker sits beside, keyed to the `Element` column of the
   * eighteen-row assignment table. `ccElementAssignment` THROWS on an element
   * the table does not assign rather than rendering an unclassed marker,
   * which is `AC-CC-110` (L35907) enforced at the only place it can be.
   */
  readonly element: string
  readonly marker: CcMarkerState
  /** Rendered beneath the expansion. L35971. */
  readonly lastInventoryRead: string
}

export function LiveFreshnessMarker({ element, marker, lastInventoryRead }: LiveFreshnessMarkerProps) {
  const [expanded, setExpanded] = useState(false)
  const assignment = ccElementAssignment(element)
  const form = ccMarkerForm(marker)

  return (
    <div data-testid="cc-freshness-marker" data-marker-form={form}>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        data-testid="cc-freshness-marker-summary"
      >
        {ccMarkerText(marker)}
      </button>

      {/*
        THE CLASS AND THE OBLIGATION, BESIDE THE VALUE RATHER THAN INSTEAD OF
        IT. `AC-CC-111` (L35908) — no element renders a value without the
        marker obligation its class requires — so the obligation is rendered
        text and not a comment. The `Class` cell is rendered as written,
        which for `Report figures` (L35900) is a class AND a qualifier.
      */}
      <p data-testid="cc-freshness-class">
        {assignment.element} · {assignment.classCell} · {assignment.markerObligation}
      </p>

      {expanded &&
        (form === 'inventory-unavailable' ? (
          /*
            L35975's terminal safe state: the sync time is still known from
            the sync log even when the inventory is not, so the summary above
            still carries it, and the expansion states that the device list
            cannot be shown. `AC-CC-123` (L35982) — never a fabricated device
            count — so no count is rendered here at all.
          */
          <p data-testid="cc-freshness-expansion-unavailable">
            The device list cannot be shown: the fleet inventory is unavailable for this session.
          </p>
        ) : (
          <div data-testid="cc-freshness-expansion">
            <table>
              <thead>
                <tr>
                  {CC_MARKER_DEVICE_COLUMNS.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marker.devices.map((d) => (
                  <tr key={d.deviceId} data-testid={`cc-freshness-device-${d.deviceId}`}>
                    <td>{d.deviceId}</td>
                    {/*
                      L35942 gives the cell "where one applies", so a device
                      with none renders an explicit em dash rather than an
                      empty cell a reader would take for a missing value.
                    */}
                    <td>{d.cell ?? '—'}</td>
                    <td>{d.lastSeen}</td>
                    <td>{d.lastSync}</td>
                    {/*
                      NEVER A ZERO FOR AN UNKNOWN COUNT. L35945, `AC-CC-122`
                      (L35981). The text comes from `ccPendingCapturesText`
                      rather than from a template here, so there is one place
                      that decides it.
                    */}
                    <td>{ccPendingCapturesText(d.pendingCaptures)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p data-testid="cc-freshness-inventory-note">{ccInventoryNote(lastInventoryRead)}</p>
          </div>
        ))}
    </div>
  )
}

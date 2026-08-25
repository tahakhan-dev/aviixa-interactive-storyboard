import type { RoleId } from '@/domain/roles'
import { deny } from '@/policy/decision'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { WriteControl } from '@/ui/WriteControl'
import { ccPropagationRollUp, type DeviceCommandState } from '@/surfaces/cc/actions/propagation'
import { CC_LOCAL_DISCLOSURES } from '@/surfaces/cc/decisions/disclosure'
import {
  CC_LINK_OUT_CELLS,
  ccLinkOutModel,
  type CcLinkOutCell,
} from '@/surfaces/cc/decisions/link-outs'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC04_COLUMNS,
  CC04_MATRIX,
  CC04_MODULE,
  CC04_ROW_HELD_ELSEWHERE,
  CC04_SCREEN,
  cc04Row,
  type Cc04Column,
} from './matrix'
import {
  CC04_DIVERGENCES,
  CC04_SEVERITY_BOUNDARY,
  CC04_UNCOMPUTED_COUNT,
} from './readings'

/**
 * `MOD-CC-04` — THE DEVIATION WORKSPACE AND EVIDENCE REVIEW, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./readings.ts` and five wave-0 modules,
 * every one of which exports plain data objects. A `'use client'` directive
 * on this file or on any of those would replace those exports with client
 * references and the strings would be gone by the time a route prerenders —
 * the defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green, because a component suite mounts
 * the component and the client boundary only exists in a build.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `CrossSurfaceLink` and `ccLinkOutModel` for row 12, whose two cells are
 *    already registered as `cc-04-reclassify-severity-tenant-admin` and
 *    `cc-04-reclassify-severity-quality-manager`. No link is spelled here.
 *  - `WriteControl` for the two renderings of row 9's Supervisor cell. The
 *    difference between an absent control and a disabled one is the finding,
 *    so it is rendered by the shared component rather than described.
 *  - `ccPropagationRollUp` for the hold. `in force` is not computed here and
 *    no timeout exists anywhere in the path.
 *  - `ccElementAssignment` for the per-device marker obligation. §21.3's
 *    eighteen-row table assigns `Hold per-device confirmation state` to this
 *    module with a PER-DEVICE obligation; that assignment is read, never
 *    restated, so a change to the table changes this panel.
 *  - NOTHING for the ten operational actions. `MOD-CC-13`'s own action rail
 *    is mounted on this route by `app/command-center/deviation-workspace/`
 *    and draws all ten with their owning places; this panel names the five
 *    L36943 and L38793 both give this module and draws no control for them.
 *    The control belongs on the surface and the record does not: L38657 —
 *    "the Command Center is the cockpit, never the engine".
 *  - `CC_LOCAL_DISCLOSURES` for `DEC-CONTLAUNCH-001`, whose adopted position
 *    and two consequences are task 5's record.
 *
 * ── THE TWO LINK POPULATIONS ARE NOT THE SAME AND ARE NOT DRAWN THE SAME ─
 *
 * Row 12's cells get a link INSTEAD of a control: the act is not performed on
 * this surface by anyone, so `CrossSurfaceLink` renders here. The five
 * `MOD-CC-13` actions get a control AND a named owning place: the act IS
 * performed from here, against a record held elsewhere, and that is the
 * mounted rail's job rather than this panel's. Using one component for both
 * would assert the wrong thing about one of them.
 *
 * ── ILLUSTRATIVE VALUES ARE LABELLED AS SUCH, WITH THEIR LINE ────────────
 *
 * The device set below is the source's own storyboard `SB-CC-15`, panel five
 * (L36917). It is rendered because `AC-CC-223` (L37002) cannot be shown
 * without one, and it is labelled an illustration rather than a value.
 */

/* ==================================================================== *
 * THE STORYBOARD'S OWN DEVICE SET, AT THE MOMENT PANEL FIVE DESCRIBES.
 *
 * L36917 verbatim: "Issued 10:22:14 · propagating · confirmed: `TAB-015`
 * 10:23:02, `TAB-016` 10:23:11 · unconfirmed: `TAB-021` last seen 09:58 · in
 * force when all confirm." Two acknowledged, one not. `TAB-014` is the
 * originating device and panel five does not list it among the targets, so it
 * is not invented into this set.
 * ==================================================================== */
const STORYBOARD_HOLD_DEVICES: readonly DeviceCommandState[] = [
  { deviceId: 'TAB-015', state: 'acknowledged' },
  { deviceId: 'TAB-016', state: 'acknowledged' },
  { deviceId: 'TAB-021', state: 'delivered' },
]

const linkOutCell = (id: string): CcLinkOutCell => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === id)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-04 expects link-out cell "${id}" in src/surfaces/cc/decisions/link-outs.ts. ` +
        'Row 12 renders a link INSTEAD of a control and there is no local spelling of one here.',
    )
  }
  return found
}

const contLaunch = CC_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-CONTLAUNCH-001')

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export interface DeviationWorkspaceProps {
  /** Whose column the matrix is read down. The matrix itself renders whole. */
  readonly viewerRole: RoleId
}

export function DeviationWorkspace({ viewerRole }: DeviationWorkspaceProps) {
  const heldElsewhere = cc04Row(CC04_ROW_HELD_ELSEWHERE)
  const hold = ccPropagationRollUp(STORYBOARD_HOLD_DEVICES)
  const holdElement = ccElementAssignment('Hold per-device confirmation state')
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const markEvidence = cc04Row(9)

  return (
    <section data-testid="cc-04-workspace" data-module={CC04_MODULE.id}>
      <p data-testid="cc-04-identity" className={REF}>
        {CC04_MODULE.id} · {CC04_MODULE.name} · identity {CC04_MODULE.sourceRef} ·{' '}
        {CC04_MODULE.specSection} · rendered on {CC04_SCREEN.id}, register row{' '}
        {CC04_SCREEN.registerRef}
      </p>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Twelve rows, five persona columns, sixty cells — the widest matrix on this surface.
        Transcribed header-keyed from L36832; the column order is Tenant Admin first and Worker
        last, the inversion of every Frontline matrix. Row {CC04_ROW_HELD_ELSEWHERE} is the only
        row whose act is performed on another surface, and it renders as a link rather than as a
        control.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-04-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC04_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC04_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-04-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC04_COLUMNS.map((c: Cc04Column) => (
                  <td key={c} data-testid={`cc-04-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────────── ROW 12 — A LINK INSTEAD OF A CONTROL ────────────── */}
      <h2 className={H2}>Reclassify severity — held on the Delivery Operations Hub</h2>
      <p className={NOTE}>
        Both link-bearing cells of {heldElsewhere.sourceRef} are rendered. A faithful
        transcription of the Tenant Admin cell through the build&rsquo;s one rendering rule draws
        nothing at all, and of the Quality Manager cell draws a live control offering to perform,
        here, an act performed on another surface&rsquo;s record. Neither is what the row asks
        for.
      </p>
      <div className="mt-4 space-y-4">
        <CrossSurfaceLink
          model={ccLinkOutModel(linkOutCell('cc-04-reclassify-severity-tenant-admin'), viewerRole)}
        />
        <CrossSurfaceLink
          model={ccLinkOutModel(
            linkOutCell('cc-04-reclassify-severity-quality-manager'),
            viewerRole,
          )}
        />
      </div>

      {/* ────────── THE SEVERITY BOUNDARY, NOT A CONTRADICTION ─────────── */}
      <div
        role="note"
        data-testid="cc-04-severity-boundary"
        data-is-contradiction={String(CC04_SEVERITY_BOUNDARY.isContradiction)}
        className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC04_SEVERITY_BOUNDARY.criterion} and row {CC04_ROW_HELD_ELSEWHERE} are a boundary, not
          a contradiction
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            {CC04_SEVERITY_BOUNDARY.criterion} (L{CC04_SEVERITY_BOUNDARY.criterionLine}) governs:{' '}
          </span>
          {CC04_SEVERITY_BOUNDARY.criterionGoverns}
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            L{CC04_SEVERITY_BOUNDARY.rowLine} governs:{' '}
          </span>
          {CC04_SEVERITY_BOUNDARY.rowGoverns}
        </p>
        <p className={NOTE}>{CC04_SEVERITY_BOUNDARY.whyNot}</p>
        <p className={REF}>
          Also stated in prose among the alternate paths at L{CC04_SEVERITY_BOUNDARY.alsoStatedAt}.
        </p>
      </div>

      {/* ── ROW 9 — THE ABSENT-VERSUS-DISABLED CONFLICT, BOTH RENDERED ── */}
      <h2 className={H2}>
        {markEvidence.capability} — the Supervisor&rsquo;s cell, drawn both ways
      </h2>
      <p className={NOTE}>
        This module&rsquo;s own matrix ({markEvidence.sourceRef}) and{' '}
        <code>MOD-CC-13</code>&rsquo;s (L38688) both read{' '}
        <code>{markEvidence.cells.Supervisor.text}</code>; §25.4 (L48450) reads{' '}
        <code>Unavailable</code>. Two readings, three statements. They render oppositely, and both
        renderings are below so the difference is visible rather than described. Neither is chosen.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-testid="cc-04-mark-evidence-prohibited">
          <p className={REF}>Reading A — Explicitly prohibited (L36842, L38688)</p>
          <WriteControl
            label={markEvidence.capability}
            decision={deny(
              'explicitlyProhibited',
              'EXPLICIT_DENY',
              'The Supervisor is explicitly prohibited from marking evidence reviewed.',
              { stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-04 L36842', 'MOD-CC-13 L38688'] },
            )}
            roleName="Supervisor"
            gateReason={null}
            objectReason={null}
            refusalNote="Marking evidence reviewed is the Quality Manager's, under DEC-PLUS-001 (FUNC-CC-0403-2-2, L36986). Nothing is drawn here."
            neverQueuedNote="FB-CC-WRITE queues nothing on this surface in any state"
            onAct={NO_ACT}
          />
        </div>
        <div data-testid="cc-04-mark-evidence-unavailable">
          <p className={REF}>Reading B — Unavailable (L48450)</p>
          <WriteControl
            label={markEvidence.capability}
            decision={deny(
              'unavailable',
              'ROLE_NOT_GRANTED',
              'Marking evidence reviewed does not confer on the Supervisor here.',
              {
                stage: 'BASE_ROLE',
                sourceRefs: ['§25.4 L48450'],
                conditionToEnable:
                  'A Quality Manager grant carries it; the mark is carried onto the Delivery Operations Hub review queue (AC-CC-227, L37006).',
              },
            )}
            roleName="Supervisor"
            gateReason={null}
            objectReason={null}
            refusalNote="Unused on this reading: an `unavailable` outcome never reaches the absent branch."
            neverQueuedNote="FB-CC-WRITE queues nothing on this surface in any state"
            onAct={NO_ACT}
          />
        </div>
      </div>

      {/* ───────────── THE DIVERGENCES, BOTH READINGS, NO WINNER ───────── */}
      <h2 className={H2}>Where another table answers one of these rows differently</h2>
      <p className={NOTE}>
        No decision identifier covers any of these. <code>AC-CC-502</code> requires every cell to
        carry an explicit status and every cell does; that four tables give different statuses to
        the same act is tested by no acceptance criterion at all.
      </p>
      <ul className="mt-4 space-y-6">
        {CC04_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-04-divergence-${d.id}`}>
            <p className="font-medium">
              Row {d.ownRow} · {d.column} · {d.capability}
            </p>
            <p className={NOTE}>{d.question}</p>
            {d.readings.map((r) => (
              <p key={r.locator} className={NOTE}>
                {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
              </p>
            ))}
            <p className={NOTE}>{d.renderedConsequence}</p>
            <p className={REF}>
              Stated at{' '}
              {d.statements
                .map((s) => `L${s.line} "${s.text}"${'of' in s ? ` — ${s.of}` : ''}`)
                .join(' · ')}
            </p>
          </li>
        ))}
      </ul>

      {/* ─────────── A COUNT THIS MODULE DELIBERATELY DOES NOT RENDER ──── */}
      <div
        role="note"
        data-testid="cc-04-uncomputed-count"
        data-computed={String(CC04_UNCOMPUTED_COUNT.computed)}
        className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          &ldquo;{CC04_UNCOMPUTED_COUNT.name}&rdquo; is not computed here
        </p>
        <p className={NOTE}>{CC04_UNCOMPUTED_COUNT.why}</p>
        <p className={NOTE}>{CC04_UNCOMPUTED_COUNT.whatIsRenderedInstead}</p>
      </div>

      {/* ─────────────────── THE HOLD, PER DEVICE ───────────────────────── */}
      <h2 className={H2}>Hold lifecycle, per device</h2>
      <p className={NOTE}>
        <span className="font-medium">{holdElement.element}: </span>
        {holdElement.classCell} · {holdElement.markerObligation} ·{' '}
        {holdElement.perDevice ? 'per device' : 'per scope'} · {holdElement.sourceRef}. The class
        and its marker obligation are read from §21.3&rsquo;s eighteen-row assignment table, not
        restated here.
      </p>
      <p data-testid="cc-04-hold-state" className={NOTE}>
        <span className="font-medium">{hold.state}: </span>
        {hold.why}
      </p>
      <p data-testid="cc-04-hold-devices" className={NOTE}>
        Confirmed ({hold.confirmedCount} of {hold.deviceCount}):{' '}
        {hold.confirmed.length === 0 ? 'none' : hold.confirmed.join(', ')}. Unconfirmed:{' '}
        {hold.unconfirmed.length === 0 ? 'none' : hold.unconfirmed.join(', ')}.
      </p>
      <p className={REF}>
        Illustrative device set, from storyboard SB-CC-15 panel five (L36917). AC-CC-223 (L37002)
        — a hold renders in force only when every relevant device has confirmed, with per-device
        timestamps visible.
      </p>

      {/* ───────────────── CONTAINMENT, AND ITS DECISION ────────────────── */}
      <h2 className={H2}>Containment</h2>
      {contLaunch === undefined ? null : (
        <div data-testid="cc-04-contlaunch">
          <p className={NOTE}>{contLaunch.question}</p>
          {contLaunch.position.kind === 'adopted-in-source' ? (
            <p className={NOTE}>
              <span className="font-medium">Adopted in the source: </span>
              {contLaunch.position.adoptedText}{' '}
              <span className="text-[var(--color-ink-subtle)]">
                [L{contLaunch.position.adoptedLine}]
              </span>
            </p>
          ) : null}
          <p className={NOTE}>{contLaunch.canonNote}</p>
        </div>
      )}
      <p data-testid="cc-04-contlaunch-consequences" className={NOTE}>
        Two consequences bind this module directly and both are stated at L36937: no gate item
        accompanies a Severity 1 event merely because containment fired — one appears only where
        the agent proposes beyond pre-authorised policy — and the containment panel renders a
        server-side mirror of a checklist the device already launched, never a launch. The
        checklist is policy, selected by configuration and never invented by the agent, and
        FUNC-CC-0402-1-2 (L36977) prohibits every role from selecting or altering it here.
      </p>

      {/* ────── THE OPERATIONAL ACTIONS, WHICH THIS PANEL DOES NOT LIST ── */}
      <h2 className={H2}>Operational actions exercised here</h2>
      <p data-testid="cc-04-exercised-actions" className={NOTE}>
        Two independent lines of the source name the same five: L36943 — this module
        &ldquo;exercises actions 1, 2, 4, 7 and 9 of <code>MOD-CC-13</code>&rdquo; — and L38793,
        which names the seven modules whose screens exercise one or more of the ten and gives this
        one &ldquo;1, 2, 4, 7 and 9&rdquo;, the widest of the seven.{' '}
        <span className="font-medium">
          The controls themselves are not drawn twice on this screen.
        </span>{' '}
        <code>MOD-CC-13</code>&rsquo;s action rail is mounted on this route and draws all ten with
        each one&rsquo;s owning place and audit obligation; a second list here would be a second
        spelling of it, and the ten are a closed set with one owner.
      </p>

      {/* ───────────────── SESSION OFFLINE ─────────────────────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-04-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls} (&ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;). Client-side queueing:{' '}
        {sess.clientSideQueueing}. Terminal safe state: {sess.terminalSafeState}. A Quality Manager
        who must release a hold during a session outage does so from the Delivery Operations
        Hub&rsquo;s own screens, which use the same service (L36931).
      </p>
      <p className={REF}>
        This module&rsquo;s five fallback identifiers, L36961: FB-CC-AGENT, FB-CC-CMD,
        FB-CC-WRITE, FB-CC-SESS, FB-CC-STALE. Terminal safe state on a failed release: the hold
        remains in force (L36995).
      </p>
    </section>
  )
}

/**
 * `WriteControl` requires `onAct`. Both controls above are refusals and
 * neither branch reaches it, so nothing is wired to a handler — a no-op is
 * the honest value and a real one would be a second claim that the act is
 * performable here.
 */
function NO_ACT(): void {
  /* Both renderings above are refusals; this is never reached. */
}

import Link from 'next/link'
import type { RoleId } from '@/domain/roles'
import { surfaceById } from '@/domain/surfaces'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import { ccPathname, type CcScreen } from '@/surfaces/cc/screens'
import {
  CC03_CHAIN,
  CC03_COLUMNS,
  CC03_FEATURES,
  CC03_FUNCTIONALITIES,
  CC03_LINK_BEARING_COLUMNS,
  CC03_MATRIX,
  CC03_MODULE,
  CC03_ROW_HELD_ELSEWHERE,
  cc03Row,
  cc03ScreenFeatures,
  type Cc03Column,
} from './matrix'
import {
  CC03_AC_090_GAP,
  CC03_ACTION_8,
  CC03_DIVERGENCES,
  CC03_HISTORY_LINK,
  CC03_SURFACE_WIDE_CRITERION,
  CC03_TACC_DISCLOSURE,
} from './readings'

/**
 * `MOD-CC-03` — RUN AND EXCEPTION DRILL-DOWN, RENDERED. ONE COMPONENT, TWO
 * SCREENS.
 *
 * ONE COMPONENT IS THE HONEST SHAPE HERE, NOT A SHORTCUT. The register puts
 * this module on two rows and they differ in exactly one column: `SCR-CC-03`
 * shows `MOD-CC-03 FEAT-CC-0301` (L48388) and `SCR-CC-04` shows `MOD-CC-03
 * all features` (L48389). Everything else about the two — the matrix, the
 * divergences, the disclosures, the drill chain — is the module's and is the
 * same on both. So the difference is driven by the REGISTER'S OWN CELL,
 * through `cc03ScreenFeatures`, rather than by two components that would
 * each carry their own copy of the eight rows and drift apart the first time
 * one was corrected.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./readings.ts` and four wave-0 modules,
 * every one of which exports plain data objects. A `'use client'` directive
 * on this file or on any of those would replace those exports with client
 * references and the strings would be gone by the time a route prerenders —
 * the defect that put an undefined module id into four built pages in slice
 * 7 while every component test stayed green.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `ccElementAssignment` for the two elements §21.3's table assigns to this
 *    module: `Run progress and pace` (L35893, Refreshed) and `Step-level
 *    capture detail` (L35898, On-sync). Read, never restated.
 *  - `ccFallbackPatternById` and `CC_FROZEN_CONTROL_REASON` for the frozen
 *    session, which on this module disables navigation to a deeper level
 *    because a deeper level would need a read the session cannot make.
 *  - `routeBySurface` and `routesForRole` for row 7's pointer, checked and
 *    never asserted.
 *  - NOTHING for the ten operational actions. `MOD-CC-13`'s rail is mounted
 *    on both of this module's routes and draws all ten; this panel states
 *    the gap and draws no control.
 *
 * ── ROW 7 DRAWS ITS OWN ANCHOR, AND THAT IS A REPORTED DEFECT, NOT A
 *    PREFERENCE ────────────────────────────────────────────────────────────
 *
 * ponytail: `CrossSurfaceLink` is the right component and cannot take this
 * cell — `CcLinkOutToken` is a closed two-member vocabulary and row 7's
 * token is `Read-only`. Widening it would edit another task's file. The
 * ceiling: this is one hand-drawn anchor with the same route-registry guard
 * `ccLinkOutModel` applies, and the upgrade path is to add `Read-only` to
 * `CcLinkOutToken`, register the two cells, and delete every line below the
 * `HistoryLink` heading. `CC03_HISTORY_LINK` carries the finding.
 */

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export interface DrillDownProps {
  /** Which of the module's two register rows this render is. */
  readonly screen: CcScreen
  /**
   * Whose reach row 7's pointer is checked against. The matrix itself
   * renders whole, for every role: `evaluateCCAccess` answers the access
   * question at the door and this storyboard holds no session.
   */
  readonly viewerRole: RoleId
  /** Which of `CC_NAV`'s route keys have a directory, so no link 404s. */
  readonly builtSlugs: readonly string[]
}

export function DrillDown({ screen, viewerRole, builtSlugs }: DrillDownProps) {
  const shown = cc03ScreenFeatures(screen.id)
  const heldElsewhere = cc03Row(CC03_ROW_HELD_ELSEWHERE)
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const stale = ccFallbackPatternById('FB-CC-STALE')
  const runProgress = ccElementAssignment('Run progress and pace')
  const captureDetail = ccElementAssignment('Step-level capture detail')

  const hub = routeBySurface('SURF-DOH')
  const hubName = surfaceById('SURF-DOH').name
  const viewerOpensHub = routesForRole(viewerRole).some((r) => r.id === hub.id)

  return (
    <section data-testid="cc-03-drill" data-module={CC03_MODULE.id} data-screen={screen.id}>
      <p data-testid="cc-03-identity" className={REF}>
        {CC03_MODULE.id} · {CC03_MODULE.name} · identity {CC03_MODULE.sourceRef} ·{' '}
        {CC03_MODULE.specSection} · rendered on {screen.id}, register row {screen.registerRef} ·
        features shown: {shown.modulesShownCell}
      </p>

      {/* ───────── THE CHAIN, WHICH IS THE NAVIGATION COLUMN'S OWN ──────── */}
      <h2 className={H2}>Board &rarr; cell &rarr; run</h2>
      <p className={NOTE}>
        The register&rsquo;s navigation column is an entry path, not a URL: {shown.screen} is
        reached from &ldquo;{shown.navigationEntry}&rdquo; ({shown.registerRef}). The three
        levels below are that chain, and <code>AC-CC-200</code> (L36771) counts exactly three of
        them with one gesture per level.
      </p>
      <ol data-testid="cc-03-chain" className="mt-3 space-y-1 text-sm">
        {CC03_CHAIN.map((s) => {
          const path = ccPathname(s.slug)
          const built = builtSlugs.includes(s.slug)
          return (
            <li
              key={s.screen}
              data-testid={`cc-03-chain-${s.step}`}
              data-current={s.screen === screen.id ? 'yes' : 'no'}
              data-built={built ? 'yes' : 'no'}
            >
              {s.step}. {built && s.screen !== screen.id ? (
                <Link href={path} className="text-[var(--color-primary)] underline">
                  {s.label}
                </Link>
              ) : (
                <span>{s.label}</span>
              )}{' '}
              <span className="text-[var(--color-ink-subtle)]">
                {s.screen} · {path}
                {built ? '' : ' · not built yet, so no link is offered'}
                {s.screen === screen.id ? ' · you are here' : ''}
              </span>
            </li>
          )
        })}
      </ol>

      {/* ─────────────────── THE FEATURES THIS SCREEN SHOWS ─────────────── */}
      <h2 className={H2}>Features shown on this screen</h2>
      <ul data-testid="cc-03-features" className="mt-3 space-y-1 text-sm">
        {CC03_FEATURES.map((f) => {
          const on = (shown.features as readonly string[]).includes(f.id)
          return (
            <li key={f.id} data-testid={`cc-03-feature-${f.id}`} data-shown={on ? 'yes' : 'no'}>
              <code>{f.id}</code> {f.name} · {f.sourceRef} ·{' '}
              {on ? 'shown here' : `not on this screen — the register row shows ${shown.modulesShownCell}`}
            </li>
          )
        })}
      </ul>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Eight rows, five persona columns, forty cells, transcribed header-keyed from L36652. The
        column order is Tenant Admin first and Worker last, the inversion of every Frontline
        matrix. Five status tokens, two of which appear on row {CC03_ROW_HELD_ELSEWHERE} alone —
        the row whose act leaves this surface. The matrix renders whole, for every role, on both
        of this module&rsquo;s screens.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-03-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC03_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC03_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-03-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC03_COLUMNS.map((c: Cc03Column) => (
                  <td key={c} data-testid={`cc-03-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────── ROW 7 — THE HISTORY BOUNDARY, DRAWN AS A LINK ────────── */}
      {(shown.features as readonly string[]).includes('FEAT-CC-0303') ? (
        <>
          <h2 className={H2}>{heldElsewhere.capability}</h2>
          <p className={NOTE}>
            {heldElsewhere.sourceRef} gives the Supervisor and the Quality Manager{' '}
            <code>{heldElsewhere.cells.Supervisor.text}</code>. The token is neither prohibitive
            nor an authority to act, and the note names the link itself as the mechanism.{' '}
            <code>{CC03_HISTORY_LINK.criterion}</code> ({CC03_HISTORY_LINK.criterionRef}) requires
            the link where the history is refused.
          </p>
          <div
            role="note"
            data-testid="cc-03-history-link"
            data-link-state={viewerOpensHub ? 'link' : 'statement'}
            className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium">Held on another surface</p>
            <p className={NOTE}>
              Run history and Execution Summaries are the {hubName}&rsquo;s. This surface offers
              the link and does not render the history; the alternate path at L36688 and the
              terminal safe state at L36767 both say so, and{' '}
              <code>FUNC-CC-0303-1-1</code> (L36740) makes the rendered link the online
              behaviour.
            </p>
            {viewerOpensHub ? (
              <p className="mt-2">
                <Link
                  href={hub.pathname}
                  data-testid="cc-03-history-anchor"
                  className="underline text-[var(--color-ink)]"
                >
                  Open the {hubName}
                </Link>
              </p>
            ) : (
              <p className={NOTE}>
                Your role does not open the {hubName}, so no link is drawn to it. The history is
                not rendered here in any case.
              </p>
            )}
            <p className={REF}>
              {CC03_MODULE.id} · {CC03_LINK_BEARING_COLUMNS.join(' and ')} ·{' '}
              {heldElsewhere.sourceRef}. The Auditor&rsquo;s cell on the same row names the{' '}
              {hubName} too and owes nothing: its own words are that the Auditor works from it
              directly and needs no Command Center route.
            </p>
          </div>
          <p data-testid="cc-03-link-register-gap" className={NOTE}>
            <span className="font-medium">Not in the shared link-out register, and it cannot be:{' '}</span>
            {CC03_HISTORY_LINK.whyNot} {CC03_HISTORY_LINK.measuredPopulationMisses}
          </p>
        </>
      ) : (
        <p data-testid="cc-03-history-not-here" className={NOTE}>
          The history boundary is <code>FEAT-CC-0303</code>, which this register row does not show
          — {shown.registerRef} shows {shown.modulesShownCell}. Its link into the {hubName} is
          rendered on {CC03_CHAIN[2].screen}, not here. Row {CC03_ROW_HELD_ELSEWHERE} of the
          matrix above still renders, because the matrix is the module&rsquo;s and not the
          screen&rsquo;s.
        </p>
      )}

      {/* ───────── ACTION 8 — PLACED HERE, AND ABSENT FROM THIS MATRIX ─── */}
      <h2 className={H2}>Action {CC03_ACTION_8.ordinal} &mdash; {CC03_ACTION_8.action}</h2>
      <p data-testid="cc-03-action-8" className={NOTE}>
        <span className="font-medium">
          This module&rsquo;s eight capability rows carry no row for reassigning a run.
        </span>{' '}
        Three lines of the source place that action on this module&rsquo;s run view anyway:{' '}
        {CC03_ACTION_8.placedHereBy.map((p) => p.ref).join(', ')}. Its own authority is{' '}
        {CC03_ACTION_8.matrixRef}, a row of <code>MOD-CC-13</code>&rsquo;s matrix, and its control
        is drawn by that module&rsquo;s action rail, which is mounted on both of this
        module&rsquo;s routes. <code>{CC03_ACTION_8.criterion}</code> (
        {CC03_ACTION_8.criterionRef}) requires exactly ten actions reachable from this surface and
        no eleventh endpoint; without the mounted rail, this one is reachable from nowhere.
      </p>
      <p data-testid="cc-03-no-ninth-row" className={NOTE}>
        <span className="font-medium">No ninth row is added. </span>
        {CC03_ACTION_8.whyNoNinthRow}
      </p>
      <ul className="mt-2 space-y-1">
        {CC03_ACTION_8.placedHereBy.map((p) => (
          <li key={p.ref} data-testid={`cc-03-action-8-${p.ref}`} className={REF}>
            {p.ref} — {p.what}
          </li>
        ))}
      </ul>

      {/* ───────────── THE DIVERGENCES, BOTH READINGS, NO WINNER ───────── */}
      <h2 className={H2}>Where another table answers this module differently</h2>
      <p className={NOTE}>
        A fifth table answers the same permission question and it is the only one keyed on the
        MODULE: <code>MTX-TEN-02c</code>, chapter 17, this module&rsquo;s row at L22060. It
        disagrees with all eight rows of the matrix above in the Tenant Admin column and with
        four of them in the Supervisor column.
      </p>
      <ul className="mt-4 space-y-6">
        {CC03_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-03-divergence-${d.id}`}>
            <p className="font-medium">
              Rows {d.ownRows.join(', ')} · {d.column} · {d.capability}
            </p>
            <p className={NOTE}>{d.question}</p>
            {d.readings.map((r) => (
              <p key={r.locator} className={NOTE}>
                {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
              </p>
            ))}
            <p className={NOTE}>{d.renderedConsequence}</p>
            <p className={REF}>
              Stated at {d.statements
                .map((s) => `L${s.line} "${s.text}"${'of' in s ? ` — ${s.of}` : ''}`)
                .join(' · ')} ·{' '}
              {d.decisionRef === null
                ? 'no decision identifier governs this one'
                : `governed by ${d.decisionRef}`}
            </p>
          </li>
        ))}
      </ul>

      {/* ──────────────── DEC-TACC-001, DISCLOSED LOCALLY ──────────────── */}
      <div
        role="note"
        data-testid="cc-03-tacc"
        data-adopted={String(CC03_TACC_DISCLOSURE.adopted)}
        className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC03_TACC_DISCLOSURE.decisionRef} — open, and held by no register in this build
        </p>
        <p className={NOTE}>{CC03_TACC_DISCLOSURE.question}</p>
        {CC03_TACC_DISCLOSURE.readings.map((r) => (
          <p key={r.locator} className={NOTE}>
            {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
          </p>
        ))}
        <p className={NOTE}>
          <span className="font-medium">Options, in the card&rsquo;s own order: </span>
          {CC03_TACC_DISCLOSURE.options.join(' · ')}.
        </p>
        <p className={NOTE}>
          <span className="font-medium">The card recommends </span>
          {CC03_TACC_DISCLOSURE.recommendation}. A recommendation is not an adoption and nothing
          here promotes it to one.
        </p>
        <p className={REF}>
          Card L{CC03_TACC_DISCLOSURE.cardLine} · chapter-17 register row L
          {CC03_TACC_DISCLOSURE.registerRowLine}. {CC03_TACC_DISCLOSURE.canonNote}
        </p>
      </div>

      {/* ────────── TWO CRITERIA THIS MODULE CANNOT CLAIM TO MEET ──────── */}
      <h2 className={H2}>Two acceptance criteria this module does not satisfy</h2>
      <div
        role="note"
        data-testid="cc-03-ac-090"
        data-satisfied={String(CC03_AC_090_GAP.satisfied)}
        className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC03_AC_090_GAP.criterion} ({CC03_AC_090_GAP.criterionRef}) —{' '}
          {CC03_AC_090_GAP.criterionText}
        </p>
        <p className={NOTE}>
          {CC03_AC_090_GAP.functionalitiesNamingNoPattern.length} of{' '}
          {CC03_FUNCTIONALITIES.length} functionalities on this card reference none:{' '}
          {CC03_AC_090_GAP.functionalitiesNamingNoPattern.join(', ')}. {CC03_AC_090_GAP.whyNotRepaired}
        </p>
        <p className={NOTE}>
          <span className="font-medium">And the mirror image: </span>
          the card&rsquo;s own fallback-identifier line ({CC03_AC_090_GAP.declaredAtModuleLevelRef})
          declares {CC03_AC_090_GAP.declaredAtModuleLevel.join(', ')}, and{' '}
          {CC03_AC_090_GAP.namedByNoFunctionality.join(', ')} is named by no functionality on the
          card at all.
        </p>
      </div>
      <div
        role="note"
        data-testid="cc-03-ac-203"
        data-enforced={String(CC03_SURFACE_WIDE_CRITERION.enforcedHere)}
        className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC03_SURFACE_WIDE_CRITERION.criterion} ({CC03_SURFACE_WIDE_CRITERION.criterionRef}) —
          scope: {CC03_SURFACE_WIDE_CRITERION.scope}
        </p>
        <p className={NOTE}>{CC03_SURFACE_WIDE_CRITERION.whatThisModuleCanSay}</p>
        <p className={REF}>
          Also stated at L{CC03_SURFACE_WIDE_CRITERION.alsoStatedAt}, filed as{' '}
          {CC03_SURFACE_WIDE_CRITERION.classifiedAs}. This module owns{' '}
          {CC03_SURFACE_WIDE_CRITERION.thisModuleOwns} of the surface&rsquo;s routes, so it
          cannot enforce a surface-wide criterion and does not claim to.
        </p>
      </div>

      {/* ───────────────── FRESHNESS, READ FROM §21.3's TABLE ───────────── */}
      <h2 className={H2}>Freshness classes on this module&rsquo;s own elements</h2>
      <ul data-testid="cc-03-freshness" className="mt-3 space-y-1 text-sm">
        {[runProgress, captureDetail].map((a) => (
          <li key={a.element} data-testid={`cc-03-freshness-${a.freshnessClass}`}>
            <span className="font-medium">{a.element}: </span>
            {a.classCell} · {a.markerObligation} · {a.perDevice ? 'per device' : 'per scope'} ·{' '}
            {a.sourceRef}
          </li>
        ))}
      </ul>
      <p className={REF}>
        Read from §21.3&rsquo;s assignment table through the live model, not restated here. Two
        of the module&rsquo;s three levels sit in different classes: run progress refreshes on the
        interval and step-level capture detail arrives on sync with a late-arrival flag, so one
        screen carries two ages and says which is which.
      </p>

      {/* ─────────── THE TWO CLAIMS THIS MODULE REFUSES TO CONFLATE ────── */}
      <h2 className={H2}>Not-yet-received is not not-done</h2>
      <p data-testid="cc-03-not-received" className={NOTE}>
        A step the worker has in fact completed offline shows as not-yet-received, never as
        not-done, because those are different claims (L36694). <code>AC-CC-206</code> (L36777)
        requires the two to render distinctly, and no capture is invented for a step the platform
        has not received.
      </p>
      <p data-testid="cc-03-pinned-version" className={NOTE}>
        A run whose pinned version cannot be resolved renders an explicit &ldquo;pinned workflow
        version unresolved&rdquo; statement and suppresses limit-dependent presentation rather
        than showing limits from a different version (L36689). <code>AC-CC-207</code> (L36778)
        is that rule; <code>AC-CC-201</code> (L36772) is the version pinning it protects.
      </p>

      {/* ───────────────── SESSION OFFLINE ─────────────────────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-03-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls} (&ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;). Client-side queueing:{' '}
        {sess.clientSideQueueing}. Terminal safe state: {sess.terminalSafeState}. On this module
        the frozen state has one extra consequence the source states in its own words at L36696:
        navigation to a deeper level is disabled, because a deeper level would require a read the
        session cannot make.
      </p>
      <p className={REF}>
        This module&rsquo;s three fallback identifiers, {CC03_AC_090_GAP.declaredAtModuleLevelRef}
        : {CC03_AC_090_GAP.declaredAtModuleLevel.join(', ')}. Level staleness is{' '}
        <code>{stale.id}</code> — {stale.terminalSafeState} — with the module-specific difference
        that an unresolvable pinned version suppresses limit-dependent presentation rather than
        substituting another version (L36728).
      </p>
    </section>
  )
}

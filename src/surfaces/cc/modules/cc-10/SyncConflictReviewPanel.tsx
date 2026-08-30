import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { ccLinkOutModel } from '@/surfaces/cc/decisions/link-outs'
import { CC10_COLUMNS, CC10_MATRIX, type Cc10Column } from './matrix'
import {
  CC10_ACTION_5_DIVERGENT_COLUMNS,
  CC10_ACTION_5_NAME_SPELLINGS,
  CC10_ACTION_5_STATEMENTS,
  CC10_ACTION_RAIL_MOUNT,
  CC10_CAP,
  CC10_CAP_DISCLOSURE,
  CC10_CLOCK_SKEW_LINK_OUT,
  CC10_DISCLOSURES,
  CC10_FRESHNESS,
  CC10_IDENTITY,
  CC10_LINK_OUT_VIEWER_ROLE,
  CC10_RESOLVE_ALL_EXCLUSION,
  CC10_SEAM,
  CC10_SEAM_STATUS,
  CC10_SECOND_TREATMENT,
  CC10_SECOND_TREATMENT_WIRED,
  CC10_STORYBOARD,
  CC10_STORYBOARD_VERSIONS,
} from './service'

/**
 * `SCR-CC-10` — the Sync-Conflict Review Panel, chapter 21.
 *
 * A SERVER COMPONENT, AND NOTHING HERE MAY ACQUIRE `'use client'` WHILE IT
 * IMPORTS DATA. The whole of what this renders is built in `service.ts` and
 * `matrix.ts`, both server modules; a `'use client'` directive on any of the
 * three would replace their exports with client references and the string
 * fields would be gone by the time the route prerenders — the defect that put
 * `data-testid="fl-panel-undefined"` into four built Run Player pages in
 * slice 7 while every component test passed. There is no interactivity here
 * to want one for: the panel is a review instrument (L38064) and the one
 * control it would carry is the one the source forbids simulating.
 *
 * NO CONTROL IS DRAWN, AND THAT IS THE RULING RATHER THAN AN OMISSION.
 * L38187 records that "an interface-only exclusion would be bypassable and
 * would defeat the guard", and L38072 that the exclusion "must be enforced at
 * the service, not only in the interface". A greyed-out Resolve All is
 * precisely the interface-only exclusion those two lines reject, and it would
 * also tell a client that this storyboard enforces a rule it cannot enforce.
 * So the storyboard's control text is rendered as the source's own words,
 * quoted, beside a statement of where the rule has to live.
 */
export function SyncConflictReviewPanel() {
  return (
    <section data-testid="cc10-panel" className="mt-10">
      <h2 className="text-2xl font-semibold" data-testid="cc10-name">
        {CC10_IDENTITY.name}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-subtle)]" data-testid="cc10-module-id">
        {CC10_IDENTITY.moduleId} · {CC10_IDENTITY.sourceSection} · card {CC10_IDENTITY.cardSpan}
      </p>
      <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]" data-testid="cc10-purpose">
        {CC10_IDENTITY.purpose}
      </p>

      {/* ── The storyboard, SB-CC-21 ─────────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">
        Screen storyboard {CC10_STORYBOARD.id} — {CC10_STORYBOARD.title}
      </h3>
      <p
        role="status"
        data-testid="cc10-storyboard-header"
        className="mt-2 inline-block rounded border border-[var(--color-rule)] px-3 py-1 text-sm"
      >
        {CC10_STORYBOARD.header}
      </p>
      <p className="mt-3 text-sm" data-testid="cc10-storyboard-entry">
        {CC10_STORYBOARD.entry}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="cc10-versions">
          <caption className="sr-only">
            Both versions of the conflicting write, with both timestamps and both workers
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-rule)]">
              <th scope="col" className="py-2 pr-4 font-medium">
                Version
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Value
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Device timestamp
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Server receipt
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Worker
              </th>
              <th scope="col" className="py-2 font-medium">
                Device
              </th>
            </tr>
          </thead>
          <tbody>
            {CC10_STORYBOARD_VERSIONS.map((v) => (
              <tr
                key={v.version}
                className="border-b border-[var(--color-rule)]"
                data-testid={`cc10-version-${v.version}`}
              >
                <th scope="row" className="py-2 pr-4 font-medium">
                  {v.version}
                </th>
                <td className="py-2 pr-4">{v.value}</td>
                <td className="py-2 pr-4">{v.deviceTimestamp}</td>
                <td className="py-2 pr-4">{v.serverReceipt}</td>
                <td className="py-2 pr-4">{v.worker}</td>
                <td className="py-2">{v.device}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 max-w-prose text-sm" data-testid="cc10-verdict">
        {CC10_STORYBOARD.verdict}
      </p>

      {/* ── The freshness class, consumed rather than restated ──────── */}
      <p className="mt-3 max-w-prose text-sm" data-testid="cc10-freshness">
        <span className="font-medium">
          Freshness class: {CC10_FRESHNESS.classCell}. Marker obligation:{' '}
          {CC10_FRESHNESS.markerObligation}.
        </span>{' '}
        The obligation is three timestamps, not two — both device timestamps{' '}
        <em>and</em> the server receipt — and the table above carries all three for both versions.
        No freshness marker is drawn: a marker states a device count, an offline count and an age,
        this panel holds none of the three, and inventing them would put an illustrative number on
        a client screen as a value.{' '}
        <span className="text-[var(--color-ink-subtle)]">({CC10_FRESHNESS.sourceRef})</span>
      </p>

      {/* ── The controls, quoted, never drawn ───────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">Controls</h3>
      <ul className="mt-2 space-y-1 text-sm" data-testid="cc10-controls">
        {CC10_STORYBOARD.entryControls.map((c) => (
          <li key={c}>“{c}”</li>
        ))}
        <li>“{CC10_STORYBOARD.panelControl}”</li>
      </ul>
      <p
        className="mt-3 max-w-prose rounded border border-[var(--color-rule)] p-3 text-sm"
        data-testid="cc10-resolve-all-exclusion"
      >
        <span className="font-medium">{CC10_RESOLVE_ALL_EXCLUSION.rule}</span>{' '}
        {CC10_RESOLVE_ALL_EXCLUSION.whyNotHere}
      </p>

      {/* ── The cap, rendered — as the question, never as a number ──── */}
      <h3 className="mt-8 text-lg font-semibold">The list is capped, and the cap has no value here</h3>
      <p className="mt-2 max-w-prose text-sm" data-testid="cc10-cap">
        {CC10_CAP.whatIsRendered}{' '}
        <span className="text-[var(--color-ink-subtle)]">({CC10_CAP.whatIsRenderedRef})</span>{' '}
        {CC10_CAP.whyNoValue}{' '}
        <span className="text-[var(--color-ink-subtle)]">({CC10_CAP.whyNoValueRef})</span>
      </p>
      <p className="mt-2 max-w-prose text-sm" data-testid="cc10-cap-asked-twice">
        {CC10_CAP.askedTwice}
      </p>
      <div
        className="mt-3 max-w-prose rounded border border-[var(--color-rule)] p-3 text-sm"
        data-testid={`cc10-cap-${CC10_CAP_DISCLOSURE.decisionRef}`}
      >
        <p className="font-medium">
          {CC10_CAP_DISCLOSURE.decisionRef} — {CC10_CAP_DISCLOSURE.question}
        </p>
        <ul className="mt-2 space-y-2">
          {CC10_CAP_DISCLOSURE.position.readings.map((r) => (
            <li key={r.locator}>
              <span className="text-[var(--color-ink-muted)]">{r.text}</span>{' '}
              <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[var(--color-ink-subtle)]">{CC10_CAP_DISCLOSURE.canonNote}</p>
        <p className="mt-2 text-[var(--color-ink-subtle)]">
          Both readings are held in {CC10_CAP.bothReadingsHeldBy}; the second identifier&rsquo;s own
          record is {CC10_CAP.secondIdentifierHeldBy}. Neither is respelled here.
        </p>
      </div>

      {/* ── Action 5, stated three times ────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">
        This module&rsquo;s own act is stated three times, and the three disagree
      </h3>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Resolving a sync conflict is action 5 of the closed set of ten. Three tables in the source
        answer who holds it. They disagree on{' '}
        {CC10_ACTION_5_DIVERGENT_COLUMNS.length === 1
          ? 'one column'
          : `${CC10_ACTION_5_DIVERGENT_COLUMNS.length} columns`}{' '}
        — {CC10_ACTION_5_DIVERGENT_COLUMNS.join(', ')} — and cannot be joined by the action&rsquo;s
        own name, which they spell {CC10_ACTION_5_NAME_SPELLINGS.length} ways. All three readings
        are carried; none is chosen.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="cc10-action5">
          <caption className="sr-only">
            Action 5 as three tables of the frozen source state it
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-rule)]">
              <th scope="col" className="py-2 pr-4 font-medium">
                Where it is stated
              </th>
              {CC10_COLUMNS.map((c) => (
                <th
                  scope="col"
                  key={c}
                  className="py-2 pr-4 font-medium"
                  data-testid={`cc10-action5-col-${c}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CC10_ACTION_5_STATEMENTS.map((s) => (
              <tr
                key={s.sourceRef}
                className="border-b border-[var(--color-rule)] align-top"
                data-testid={`cc10-action5-row-${s.sourceRef}`}
              >
                <th scope="row" className="py-2 pr-4 font-normal">
                  {s.table} · {s.sourceRef} · &ldquo;{s.actionText}&rdquo;
                </th>
                {CC10_COLUMNS.map((c: Cc10Column) => (
                  <td
                    key={c}
                    className="py-2 pr-4"
                    data-testid={`cc10-action5-cell-${s.sourceRef}-${c}`}
                  >
                    {s.cells[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The Tenant Admin pair is not only a different word. This build renders an explicitly
        prohibited cell as nothing at all and an unavailable one as a disabled control carrying its
        reason, so those two tables render the same cell oppositely — absent against disabled.
        Nothing here reconciles them.
      </p>

      {/* ── The permission matrix, header-keyed ─────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">Roles that see and use it, and their permissions</h3>
      <p className="mt-1 text-sm text-[var(--color-ink-subtle)]" data-testid="cc10-matrix-provenance">
        Header L38082, separator L38083, data L38084–L38091 — eight rows, five persona columns,
        forty cells.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="cc10-matrix">
          <caption className="sr-only">
            {CC10_IDENTITY.moduleId} permission matrix, chapter 21
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-rule)]">
              <th scope="col" className="py-2 pr-4 font-medium">
                Capability on this module
              </th>
              {CC10_COLUMNS.map((c) => (
                <th
                  scope="col"
                  key={c}
                  className="py-2 pr-4 font-medium"
                  data-testid={`cc10-col-${c}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CC10_MATRIX.map((row) => (
              <tr
                key={row.ordinal}
                className="border-b border-[var(--color-rule)] align-top"
                data-testid={`cc10-row-${row.ordinal}`}
              >
                <th scope="row" className="py-2 pr-4 font-normal">
                  {row.capability}
                </th>
                {CC10_COLUMNS.map((c: Cc10Column) => (
                  <td
                    key={c}
                    className="py-2 pr-4"
                    data-testid={`cc10-cell-${row.ordinal}-${c}`}
                  >
                    {row.cells[c].text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── One cell needs a link, not a control ─────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">One cell needs a link, not a control</h3>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Row 8&rsquo;s Tenant Admin cell refuses the act and then names where it lives. The write
        control renders an explicitly prohibited cell as nothing at all, so a faithful
        transcription would produce an empty cell where the source names a destination.
      </p>
      <div className="mt-3">
        <CrossSurfaceLink
          model={ccLinkOutModel(CC10_CLOCK_SKEW_LINK_OUT, CC10_LINK_OUT_VIEWER_ROLE)}
        />
      </div>

      {/* ── The seam ────────────────────────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">What this panel does not own</h3>
      <p className="mt-2 max-w-prose text-sm" data-testid="cc10-seam">
        <span className="font-medium">
          {CC10_SEAM.consumingModule} → {CC10_SEAM.owningModule}, slice {CC10_SEAM.ownerSlice},{' '}
          {CC10_SEAM_STATUS}.{' '}
        </span>
        {CC10_SEAM.whatIsMissing}
      </p>
      <p className="mt-2 max-w-prose text-sm" data-testid="cc10-action-rail-mount">
        <span className="font-medium">{CC10_ACTION_RAIL_MOUNT.whyHere}</span>{' '}
        <span className="text-[var(--color-ink-subtle)]">
          ({CC10_ACTION_RAIL_MOUNT.whyHereRef})
        </span>{' '}
        {CC10_ACTION_RAIL_MOUNT.whyNotTheOtherRail} {CC10_ACTION_RAIL_MOUNT.seamStillReadsOpen}
      </p>

      {/* ── Open decisions ──────────────────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">Open decisions, disclosed</h3>
      <ul className="mt-2 space-y-4">
        {CC10_DISCLOSURES.map((d) => (
          <li
            key={d.decisionRef}
            className="max-w-prose rounded border border-[var(--color-rule)] p-3 text-sm"
            data-testid={`cc10-decision-${d.decisionRef}`}
          >
            <p className="font-medium">
              {d.decisionRef} — {d.question}
            </p>
            <ul className="mt-2 space-y-2">
              {d.readings.map((r) => (
                <li key={r.locator}>
                  <span className="text-[var(--color-ink-muted)]">{r.text}</span>{' '}
                  <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
                </li>
              ))}
            </ul>
            <p className="mt-2">
              <span className="font-medium">This build’s position, a client-delegated choice: </span>
              {d.adopted}
            </p>
            <p className="mt-2 text-[var(--color-ink-subtle)]">{d.canonNote}</p>
          </li>
        ))}
      </ul>

      {/* ── The second treatment ────────────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">A second treatment of this module exists</h3>
      <p className="mt-2 max-w-prose text-sm" data-testid="cc10-second-treatment">
        {CC10_SECOND_TREATMENT.statement}
      </p>
      <p className="mt-2 max-w-prose text-sm" data-testid="cc10-second-treatment-wired">
        {CC10_SECOND_TREATMENT_WIRED.statement} It is rendered on this screen by{' '}
        {CC10_SECOND_TREATMENT_WIRED.component}, below.
      </p>
    </section>
  )
}

import { allow } from '@/policy/decision'
import { WriteControl } from '@/ui/WriteControl'
import {
  CC_WRITES_OUTSIDE_THE_TEN,
  OUTSIDE_WRITE_COUNT_STATEMENT,
} from '@/surfaces/cc/actions/outside-writes'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import {
  CC_FROZEN_CONTROL_REASON,
  CC_FROZEN_SESSION_QUEUES_NOTHING,
} from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC11_COLUMNS,
  CC11_MATRIX,
  CC11_MODULE,
  CC11_SCREEN,
  CC11_SURFACE_MATRIX_SELF_DIVERGENCE,
  CC11_TENANT_ADMIN_DIVERGENCES,
  CC11_TENANT_ADMIN_RESTRICTION,
  cc11Row,
  type Cc11Column,
} from './matrix'
import {
  CC11_DATA_SETS,
  CC11_DEC_REPORT_CARDS,
  CC11_IDENTITY_GAP_STATEMENT,
  CC11_OPEN_IDENTITY,
  CC11_REGISTER_ROW,
  DEC_REPORT_001,
  DEC_RPTBLD_001,
} from './report-sets'

/**
 * `MOD-CC-11` — STANDARD REPORTS AND THE CUSTOM REPORT BUILDER, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./report-sets.ts` and four wave-0
 * modules, every one of which exports plain data objects. A `'use client'`
 * directive here or on any of those would replace those exports with client
 * references and the strings would be gone by the time the route prerenders —
 * the defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `ccElementAssignment('Report figures')` for the freshness class. L35900
 *    is the ONE row of §21.3's element table with a class AND a qualifier in
 *    the same cell, and wave 0's model already keeps `classCell` verbatim
 *    beside the class it names. Both are rendered, separately and labelled,
 *    so the qualifier is neither collapsed into the class nor promoted into a
 *    fourth one.
 *  - `CC_WRITES_OUTSIDE_THE_TEN` for report-format authoring, which is the
 *    FIRST of `DEC-CCWRITE-001`'s four named outside-writes. Wave 0's
 *    register is the one register; no second one is minted here, and the
 *    count sentence is wave 0's own computed one.
 *  - `ccFallbackPatternById` and `CC_FROZEN_CONTROL_REASON` for `FB-CC-SESS`.
 *    A frozen session reaches `WriteControl` through `gateReason`, which is
 *    the branch that already means "a condition outside the person and
 *    outside the record closes this control" — not a sixth branch.
 *  - `CC_DECISION_REGISTER`'s own row for `DEC-REPORT-001`, resolved in
 *    `./report-sets.ts` rather than restated.
 *  - NOTHING for the ten operational actions, and the omission is the
 *    finding. See below.
 *
 * ── NO ACTION RAIL, AND NO `CrossSurfaceLink` EITHER ─────────────────────
 *
 * L38793 names the seven modules whose screens exercise one or more of the
 * ten, and this module is not among them. The route leaves `actionRail`
 * unfilled and lets `CommandCenterShell` render its declared
 * `operational-action-set` seam. Ten operational controls on a screen that
 * exercises none of them is the drift the closed set exists to prevent.
 *
 * And no cell of this matrix is a population-B link-out: rows 8 and 9 are
 * prohibited-with-a-note whose notes name no destination.
 * `src/surfaces/cc/decisions/link-outs.ts` registers thirteen such cells and
 * none is this module's, so nothing here draws a link.
 */

const H2 = 'mt-10 text-xl font-semibold'
const H3 = 'mt-6 font-medium'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

function NO_ACT(): void {
  /* A storyboard. Nothing is written, and nothing is queued. */
}

const reportFormatAuthoring = (() => {
  const first = CC_WRITES_OUTSIDE_THE_TEN[0]
  if (first.act !== 'Report-format authoring') {
    throw new Error(
      'MOD-CC-11 reads report-format authoring as the FIRST of DEC-CCWRITE-001’s four named ' +
        'outside-writes, in L35350’s own order. src/surfaces/cc/actions/outside-writes.ts no ' +
        'longer opens with it.',
    )
  }
  return first
})()

export function ReportsAndBuilder() {
  const figures = ccElementAssignment('Report figures')
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const report = ccFallbackPatternById('FB-CC-REPORT')
  const authoring = cc11Row(4)

  return (
    <section data-testid="cc-11-reports" data-module={CC11_MODULE.id}>
      <p data-testid="cc-11-identity" className={REF}>
        {CC11_MODULE.id} · {CC11_MODULE.name} · identity {CC11_MODULE.sourceRef} ·{' '}
        {CC11_MODULE.specSection} · rendered on {CC11_SCREEN.id}, register row{' '}
        {CC11_SCREEN.registerRef}
      </p>

      {/* ───────── THE FIVE SETS, AND THE IDENTITY THAT IS NOT RECORDED ───────── */}
      <h2 className={H2}>The five standard data sets</h2>
      <p data-testid="cc-11-identity-gap" className={NOTE}>
        {CC11_IDENTITY_GAP_STATEMENT}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-11-data-sets" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name in §6.12.1, this Part</th>
              <th scope="col">Name in §4.10.5, the Delivery Operations Hub Part</th>
              <th scope="col">Hub source</th>
              <th scope="col">Identity</th>
            </tr>
          </thead>
          <tbody>
            {CC11_DATA_SETS.map((set) => (
              <tr key={set.ordinal} data-testid={`cc-11-set-${set.ordinal}`}>
                <th scope="row" className="font-normal">
                  {set.ordinal}
                </th>
                <td data-testid={`cc-11-set-${set.ordinal}-cc`}>
                  {set.commandCenterName}{' '}
                  <span className="text-[var(--color-ink-subtle)]">L{set.commandCenterLine}</span>
                </td>
                <td data-testid={`cc-11-set-${set.ordinal}-doh`}>
                  {set.hubName}{' '}
                  <span className="text-[var(--color-ink-subtle)]">L{set.hubLine}</span>
                </td>
                <td className="text-[var(--color-ink-subtle)]">{set.hubSource}</td>
                <td data-testid={`cc-11-set-${set.ordinal}-identity`}>
                  {set.identityConfirmed ? 'Confirmed' : 'Pending — proposed, not confirmed'}
                  {set.namesDifferAt.length === 0
                    ? null
                    : ` · the two Parts name it differently, and the source pairs the two names at ${set.namesDifferAt
                        .map((n) => `L${n}`)
                        .join(', ')}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p data-testid="cc-11-swap-not-grow" className={NOTE}>
        <span className="font-medium">What is settled: </span>
        {CC11_OPEN_IDENTITY.settled}. <span className="font-medium">What is open: </span>
        {CC11_OPEN_IDENTITY.open}. The source&rsquo;s rule for changing the list is that{' '}
        {CC11_OPEN_IDENTITY.swapNotGrow} (L{CC11_OPEN_IDENTITY.openItemLine}), and its own
        examples of a permitted swap are {CC11_OPEN_IDENTITY.swapExamples.join(', ')}. Those are
        the source&rsquo;s illustrations of what a swap could look like. They are not a sixth set,
        they are not offered as replacements for any set above, and no set is invented here to
        fill a gap the source leaves open.
      </p>
      <p data-testid="cc-11-third-spelling" className={REF}>
        A third spelling of set 4 exists at L{CC11_OPEN_IDENTITY.thirdSpellingLine} —
        &ldquo;{CC11_OPEN_IDENTITY.thirdSpellingOfSetFour}&rdquo; — which is neither preserved
        reading. Recorded as an observation; the source preserves two readings, and a third
        spelling is not a third reading.
      </p>

      {/* ───────────────── DEC-REPORT-001, BOTH READINGS ────────────────── */}
      <h3 className={H3}>
        {DEC_REPORT_001.decisionRef} — {DEC_REPORT_001.question}
      </h3>
      <p className={REF}>
        Chapter 21&rsquo;s register, row L{CC11_REGISTER_ROW.line}: {CC11_REGISTER_ROW.status} ·
        appears in {CC11_REGISTER_ROW.whereItAppears} · decision owner {CC11_REGISTER_ROW.owner}.
      </p>
      <ul className="mt-4 space-y-4">
        {DEC_REPORT_001.position.readings.map((reading) => (
          <li key={reading.locator} data-testid={`cc-11-reading-${reading.locator}`}>
            <p className="text-sm">{reading.text}</p>
            <p className={REF}>{reading.locator}</p>
          </li>
        ))}
      </ul>
      <p data-testid="cc-11-three-cards" className={NOTE}>
        <span className="font-medium">Three cards state this decision and no two offer the same
          options, </span>
        so their three recommendations are not comparable and none of them stands for the others.
        All three are below; none is adopted.
      </p>
      <ul className="mt-4 space-y-4">
        {CC11_DEC_REPORT_CARDS.map((card) => (
          <li key={card.line} data-testid={`cc-11-card-${card.line}`}>
            <p className="font-medium">
              {card.section} · L{card.line}
            </p>
            <p className="text-sm">Options: {card.options.join('; ')}.</p>
            <p className={REF}>Recommendation, recorded and not adopted: {card.recommendation}</p>
          </li>
        ))}
      </ul>
      <p data-testid="cc-11-canon-note" className={NOTE}>
        {DEC_REPORT_001.canonNote}
      </p>
      <p className={REF}>
        Also disclosed on the tree at {DEC_REPORT_001.heldBy?.path}, against L
        {DEC_REPORT_001.heldBy?.locatorLine}.
      </p>

      {/* ───────── A SECOND DECISION CHAPTER 21 NEVER NAMES ───────── */}
      <h3 className={H3}>
        {DEC_RPTBLD_001.decisionRef} — {DEC_RPTBLD_001.question}
      </h3>
      <p data-testid="cc-11-rptbld" className={NOTE}>
        Raised at L{DEC_RPTBLD_001.raisedAt}, in chapter 4&rsquo;s boundary register, and absent
        from chapter 21 entirely — the same shape as <code>DEC-CLEAR-001</code>: raised in another
        chapter, carried by no row of this chapter&rsquo;s register, and binding on an act this
        module performs. {DEC_RPTBLD_001.whyItBindsHere}
      </p>
      <p className={REF}>
        {DEC_RPTBLD_001.compoundsWith} It is not a second spelling of {DEC_REPORT_001.decisionRef}:
        one asks which five, the other asks whether the Builder may compose beyond them at all.
      </p>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Nine rows, five persona columns, forty-five cells, transcribed header-keyed from L38287.
        The column order is Tenant Admin first and Worker last, the inversion of every Frontline
        matrix — and on this module a positional read does not misplace one cell, it inverts the
        module&rsquo;s meaning: seven rows give the Tenant Admin a grant and the Worker a
        prohibition. Chapter 21 writes its tokens without backticks.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-11-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC11_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC11_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-11-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC11_COLUMNS.map((c: Cc11Column) => (
                  <td key={c} data-testid={`cc-11-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ────────── THE TENANT ADMIN RESTRICTION, KEPT HERE ────────── */}
      <h2 className={H2}>
        The Tenant Admin restriction is consistent here, and this module is the baseline
      </h2>
      <p data-testid="cc-11-ta-baseline" className={NOTE}>
        The surface matrix grants the Tenant Admin{' '}
        <code>{CC11_TENANT_ADMIN_RESTRICTION.cell}</code> on{' '}
        <code>{CC11_TENANT_ADMIN_RESTRICTION.capability}</code> (L
        {CC11_TENANT_ADMIN_RESTRICTION.line}). {CC11_TENANT_ADMIN_RESTRICTION.whyConsistentHere}{' '}
        This is a report route, so the route grant and the module grants agree without
        qualification. Three modules diverge from that baseline, and they are listed rather than
        summarised.
      </p>
      <ul className="mt-4 space-y-4">
        {CC11_TENANT_ADMIN_DIVERGENCES.map((d) => (
          <li key={`${d.module}-${d.line}`} data-testid={`cc-11-ta-divergence-${d.line}`}>
            <p className="font-medium">
              {d.module} · {d.capability} · L{d.line}
            </p>
            <p className="text-sm">
              Tenant Admin cell: <code>{d.cell}</code>
            </p>
            <p className={NOTE}>{d.whyOutside}</p>
          </li>
        ))}
      </ul>
      <p data-testid="cc-11-ta-banner-module" className={NOTE}>
        <code>MOD-CC-02</code> is deliberately not on that list. It is the banner module itself
        (§21.5, sync state and connectivity), so its five Tenant Admin grants sit inside the
        allowance rather than outside it; counting it would inflate the finding by treating the
        allowance&rsquo;s own subject as a breach of it.
      </p>
      <p data-testid="cc-11-ta-self-divergence" className={NOTE}>
        <span className="font-medium">And the surface matrix disagrees with itself one row below
          the restriction: </span>
        L{CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherLine},{' '}
        <code>{CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherCapability}</code>, gives the Tenant Admin{' '}
        <code>{CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherCell}</code>.{' '}
        {CC11_SURFACE_MATRIX_SELF_DIVERGENCE.note}
      </p>

      {/* ────────── THE ONE CELL WITH A CLASS AND A QUALIFIER ────────── */}
      <h2 className={H2}>Report figures — the freshness class, and its qualifier</h2>
      <p data-testid="cc-11-freshness" className={NOTE}>
        §21.3&rsquo;s element table assigns <code>{figures.element}</code> to this module at{' '}
        {figures.sourceRef}. Its Class cell is the only one in that table carrying a class AND a
        qualifier together, and both halves are rendered here rather than one standing for the
        other.
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[12rem_1fr]">
        <dt className="font-medium">Class cell, verbatim</dt>
        <dd data-testid="cc-11-class-cell">{figures.classCell}</dd>
        <dt className="font-medium">The class it names</dt>
        <dd data-testid="cc-11-class">{figures.freshnessClass}</dd>
        <dt className="font-medium">Marker obligation</dt>
        <dd data-testid="cc-11-marker-obligation">{figures.markerObligation}</dd>
      </dl>
      <p className={REF}>
        The qualifier is not a fourth class and the class is not the whole cell. Collapsing either
        way loses the thing this module exists to promise: L38281 — every report carries its
        data-as-of timestamp, and a delivered file is never silently wrong.
      </p>

      {/* ────────── AUTHORING IS NOT ONE OF THE TEN ────────── */}
      <h2 className={H2}>Report-format authoring sits outside the closed set of ten</h2>
      <p data-testid="cc-11-outside-write" className={NOTE}>
        L38299 states it in this module&rsquo;s own section: report-format authoring is explicitly
        not one of the ten operational actions; it is authoring, and it sits outside that list. It
        is the first of <code>DEC-CCWRITE-001</code>&rsquo;s four named outside-writes (L35350),
        and <code>AC-CC-410</code> (L38867) is the criterion — report-format authoring and manual
        close are not exposed as operational actions.
      </p>
      <p data-testid="cc-11-outside-write-count" className={NOTE}>
        {OUTSIDE_WRITE_COUNT_STATEMENT}
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[12rem_1fr]">
        <dt className="font-medium">The act</dt>
        <dd data-testid="cc-11-outside-write-act">{reportFormatAuthoring.act}</dd>
        <dt className="font-medium">How the source excludes it</dt>
        <dd>{reportFormatAuthoring.exclusionKind}</dd>
        <dt className="font-medium">Who holds it</dt>
        <dd>{reportFormatAuthoring.granted}</dd>
        <dt className="font-medium">Lines read</dt>
        <dd className="text-[var(--color-ink-subtle)]">
          {reportFormatAuthoring.sourceRefs.join(' · ')}
        </dd>
      </dl>
      <p data-testid="cc-11-no-action-rail" className={NOTE}>
        <span className="font-medium">No action rail is mounted on this screen. </span>
        L38793 enumerates the modules whose screens exercise one or more of the ten and this one is
        not among them, so the route leaves the rail&rsquo;s mount point unfilled and the shell
        renders its declared open seam naming the owing module. Ten operational controls on a
        screen that exercises none of them is the drift the closed set exists to prevent.
      </p>

      {/* ────────── FB-CC-SESS: THE CONTROL, BOTH WAYS ────────── */}
      <h2 className={H2}>This session offline — {sess.id}</h2>
      <p data-testid="cc-11-session" className={NOTE}>
        L38365: format authoring and export controls are disabled and nothing is queued; scheduled
        deliveries are server-side and continue unaffected, which is the correct division — a
        supervisor&rsquo;s browser has nothing to do with a 06:00 email. The pattern&rsquo;s own
        row says the same in the registry: decision controls {sess.decisionControls.toLowerCase()},
        client-side queueing <code>{sess.clientSideQueueing}</code>, terminal safe state{' '}
        {sess.terminalSafeState.toLowerCase()} ({sess.sourceRef}).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-testid="cc-11-authoring-live">
          <p className={REF}>Live session — {authoring.sourceRef}, Tenant Admin cell</p>
          <WriteControl
            label={authoring.capability}
            decision={allow('BASE_ROLE', [`MOD-CC-11 ${authoring.sourceRef}`, 'L35017'])}
            roleName="Tenant Admin"
            gateReason={null}
            objectReason={null}
            refusalNote="Unused on this cell: the Tenant Admin is Allowed to author a saved format."
            neverQueuedNote="FB-CC-SESS queues nothing on this surface in any state"
            onAct={NO_ACT}
          />
        </div>
        <div data-testid="cc-11-authoring-frozen">
          <p className={REF}>Frozen session — the same cell, the same grant</p>
          <WriteControl
            label={authoring.capability}
            decision={allow('BASE_ROLE', [`MOD-CC-11 ${authoring.sourceRef}`, 'L38365'])}
            roleName="Tenant Admin"
            gateReason={CC_FROZEN_CONTROL_REASON}
            objectReason={null}
            refusalNote="Unused on this cell: the Tenant Admin is Allowed to author a saved format."
            neverQueuedNote="FB-CC-SESS queues nothing on this surface in any state"
            onAct={NO_ACT}
          />
        </div>
      </div>
      <p data-testid="cc-11-queues-nothing" className={NOTE}>
        A frozen session closes the control through the gate branch rather than through a branch of
        its own: it is a condition outside the person and outside the record, which is what that
        branch already means. The grant is unchanged and the person is unchanged — what changed is
        the screen&rsquo;s currency.{' '}
        {CC_FROZEN_SESSION_QUEUES_NOTHING
          ? 'Nothing is queued, in any state, and that is derived from the pattern registry rather than asserted here.'
          : 'FB-CC-SESS now records a client-side queue, which contradicts this module’s own session-offline paragraph.'}
      </p>
      <p data-testid="cc-11-report-fallback" className={REF}>
        Generation and delivery failures are {report.id}: {report.triggeringCondition} · decision
        controls {report.decisionControls.toLowerCase()} · client-side queueing{' '}
        <code>{report.clientSideQueueing}</code> · terminal safe state{' '}
        {report.terminalSafeState.toLowerCase()} ({report.sourceRef}). L38421 states the terminal
        safe state in prose and says why: silence would be the worst outcome, because a recipient
        who receives nothing assumes nothing happened on the floor.
      </p>
    </section>
  )
}

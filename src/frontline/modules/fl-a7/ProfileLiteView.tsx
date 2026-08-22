import { frontlineConnectivityTreatment } from '@/frontline/access'
import { CrossSurfaceAct, NamedPlace, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { flDestinationBySlug } from '@/frontline/screens'
import { Button } from '@/ui/primitives'
import {
  A7_CHARTER_STATEMENTS,
  a7CharterStatement,
  type A7CharterStatementId,
} from './charter'
import {
  A7_COLUMN_POINTER_ROLE,
  A7_COLUMN_ROLES,
  A7_MATRIX_SHAPE,
  A7_ROW_3_ALSO_TRANSCRIBED_BY,
  A7_TENANT_ADMIN_WIPE_AUTHORITY,
  a7RowsFor,
  type A7Column,
} from './matrix'
import {
  A7_COMPLETION_VERB_CLASSIFICATION,
  A7_CROSS_MODULE_REACH,
  A7_MODULE_FILTER_MEASUREMENT,
  A7_PIN_RESET_ROLE_DIVERGENCE,
  A7_REGISTER_CLASS_TALLY,
  A7_REGISTER_ROWS,
  A7_ROWS_OUTSIDE_THE_SEVEN,
  A7_ROWS_UNDER_AC_OFF_702,
  A7_STANDING_NOT_STATED,
  A7_STATE_IDS,
  A7_STORAGE_ROW_NOT_RESTATED,
  A7_UNCLASSIFIED_FUNCTIONALITY,
  A7_VERBS_WITHOUT_ONE_CLASS,
  a7OfflineStanding,
  a7VerbClasses,
  registerLineOf,
  type A7TrustWindow,
} from './offline'
import {
  A7_COMMAND_CLASS_GAP,
  A7_COMPLIANCE_LOCK,
  A7_DISCLOSURES,
  A7_FUNCTIONALITIES,
  A7_FUNCTIONALITIES_NAMING_NO_PATTERN,
  A7_LOCKOUT_THRESHOLD,
  A7_MESSAGE_RENDERINGS,
  A7_OFFLINE_HONESTY,
  A7_PATTERNS_FROM_MAP,
  A7_PATTERN_DIVERGENCE,
  A7_SUSPENSION_STATES,
} from './service'

/**
 * `SCR-FL-06` — Profile-lite, this module's only destination. A PLAIN VIEW
 * COMPONENT: the destination is not the Run Player, so nothing here exports
 * a `RunPlayerPanel`, and nothing under `app/` is touched — the controller
 * wires this in.
 *
 * §25.5 gives `SCR-FL-06` the modules-and-features column "MOD-FL-A1,
 * MOD-FL-A7" (L48534). TWO MODULES MOUNT HERE AND THAT SHAPES WHAT THIS
 * VIEW DRAWS:
 *
 *  - It does NOT draw the destination card. `MOD-FL-A1`'s `A1DestinationCard`
 *    already carries `SCR-FL-06` on this destination with BOTH readings of
 *    the contested token beside it. A second copy is how one of them quietly
 *    stops mentioning the alternative.
 *  - It does NOT draw a second cross-surface statement for row 3. That row
 *    is also `MOD-FL-A1`'s row 7 (L40194) and that module already states the
 *    act here. What this view draws for it is the one reading `MOD-FL-A1`
 *    cannot hold — the Platform-roles cell of the sixth column — and a
 *    pointer to the neighbouring transcription, with the wording divergence
 *    between the two lines named rather than smoothed.
 *
 * NOT ONE ROW OF THIS MATRIX DRAWS A CONTROL ON THIS DESTINATION, and that
 * is a fact about the matrix rather than a decision taken here. Four rows
 * are prohibited in all six columns, four are met on another surface, and
 * the ninth — the Worker's in-flight Run under hard suspension — is met on
 * the Run Player. `frontlineAffordance` decides every one of them and the
 * covering suite asserts the count of drawn controls is zero, so a
 * mis-classification that started drawing one would go red rather than ship.
 *
 * WHAT IS DELIBERATELY ABSENT. No dismiss affordance for the compliance
 * lock, for any persona — `TEST-A7-4` (L41438) tests for one and
 * `SB-FL-016` (L41412) says "no dismiss". Neither wording of the fixed
 * message is printed as the message. No pace figure, no timer, no countdown
 * and no comparison to another worker, in any state — `AC-FL-000-5`
 * (L39100), `AC-SCR-FL-002` (L48690), `AC-SCOPE-045` (L2683). No lockout
 * attempt count and no lockout duration, because L41371 states neither.
 */

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4'
const DASHED =
  'rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4'

/* ==================================================================== *
 * ONE MATRIX CELL. Every one goes through `frontlineAffordance` and
 * nothing goes around it: there is no branch below that reads
 * `cell.outcome` to decide what to draw. A row met on another surface
 * returns a statement even where its token reads `Allowed`, and the token
 * is not corrected, downgraded or hidden — it renders beside the statement
 * in the source's own words with the source's own line, because what is
 * refused is the CONTROL and never the record of what the source said.
 * ==================================================================== */

function ControlOrLine({
  affordance,
  column,
  control,
  sourceRef,
}: {
  readonly affordance: FrontlineAffordance
  readonly column: A7Column
  readonly control: string
  readonly sourceRef: string
}) {
  switch (affordance.kind) {
    case 'control':
      return (
        <div data-testid="fl-a7-control">
          <Button variant="secondary">{control}</Button>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.note}</p>
        </div>
      )

    case 'read-only':
      return (
        <p data-testid="fl-a7-read-only" className="text-sm text-[var(--color-ink-muted)]">
          Visible and unchangeable. {affordance.note}
        </p>
      )

    case 'cross-surface':
      return (
        <CrossSurfaceAct
          model={frontlineCrossSurfaceModel(
            {
              capability: control,
              owningSurface: affordance.surface,
              whatHappensThere: affordance.note,
              sourceRef,
            },
            A7_COLUMN_POINTER_ROLE[column],
          )}
        />
      )

    case 'named-place':
      return (
        <NamedPlace
          capability={control}
          destination={affordance.destination}
          note={affordance.note}
          sourceRef={sourceRef}
        />
      )

    case 'routed':
      return (
        <p
          data-testid="fl-a7-routed"
          data-to-row={affordance.toRowId}
          className={`${DASHED} text-sm text-[var(--color-ink-muted)]`}
        >
          {affordance.note} No control is drawn here.
        </p>
      )

    case 'stated-line':
      return (
        <p
          data-testid="fl-a7-stated-line"
          data-existence={affordance.existence}
          className={`${DASHED} text-sm text-[var(--color-ink-muted)]`}
        >
          {affordance.line}
        </p>
      )

    case 'refusal':
      return (
        <div data-testid="fl-a7-refusal" data-outcome={affordance.outcome} className={DASHED}>
          <p className="text-sm text-[var(--color-ink)]">
            {control} — no control is drawn here. {affordance.note}
          </p>
          {affordance.outcome === 'notApplicable' ? (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              This is not a refusal. The act does not arise for this role on this surface, and the
              cell states why.
            </p>
          ) : null}
        </div>
      )
  }
}

/**
 * THE ONE `Client Decision Required` CELL IN THIS MATRIX, AND THE ONLY ONE
 * IN THE SLICE THAT ARGUES. L41300's Tenant Admin cell states its own
 * reasoning rather than recording an absence, and that reasoning is what
 * makes it a DIFFERENT question from the one the other ten defer to.
 * Rendered with both questions named, so a reader cannot take one for the
 * other; the device-session question is recorded once in
 * `src/routes/definitions.ts` and is not restated here.
 *
 * IT IS RENDERED FROM THE CELL AND NOT FROM THE AFFORDANCE, AND THE FIRST
 * VERSION OF THIS VIEW GOT THAT WRONG. It hung the disclosure off the
 * `refusal` branch, which was silently dead: row 4 is classified
 * `another-surface`, so `frontlineAffordance` reaches question 1 and returns
 * a cross-surface statement — the refusal branch is never taken for the one
 * row that carries an open decision, and the disclosure never rendered.
 *
 * The fold decides what CONTROL is drawn. Whether a cell defers to an
 * unanswered question is a property of the CELL, and it is disclosed
 * wherever that cell is printed. The covering suite renders the Tenant Admin
 * column and asserts the block is there.
 */
function TenantAdminWipeAuthority() {
  return (
    <div
      data-testid="fl-a7-open-decision"
      data-decision={A7_TENANT_ADMIN_WIPE_AUTHORITY.id}
      className="mt-2 border-t border-dashed border-[var(--color-border-strong)] pt-2"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        An open question, disclosed and not answered
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">
        {A7_TENANT_ADMIN_WIPE_AUTHORITY.question}
      </p>
      <p data-testid="fl-a7-not-the-session-question" className="mt-1 text-sm text-[var(--color-ink-muted)]">
        Not to be read as the other one. {A7_TENANT_ADMIN_WIPE_AUTHORITY.distinctFrom}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {A7_TENANT_ADMIN_WIPE_AUTHORITY.sourceRef}
      </p>
    </div>
  )
}

/**
 * Row 3, drawn once for the whole destination rather than twice. The
 * affordance is still computed — the covering suite asserts it is a
 * cross-surface statement — and what changes is only that the statement
 * itself is `MOD-FL-A1`'s, on the same screen, and is not repeated.
 */
function DeferredToNeighbour({ column }: { readonly column: A7Column }) {
  const d = A7_ROW_3_ALSO_TRANSCRIBED_BY
  return (
    <div data-testid="fl-a7-deferred-statement" data-defers-to={d.module} className={DASHED}>
      <p className="text-sm font-medium text-[var(--color-ink)]">
        Stated once on this screen, by {d.module}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{d.renderingNote}</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What only this matrix holds
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">{d.whatOnlyThisMatrixHolds}</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The two transcriptions are not the same text
      </p>
      <p data-testid="fl-a7-row3-divergence" className="mt-1 text-sm text-[var(--color-ink)]">
        {d.divergence}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {d.module} {d.theirRow} {d.theirSourceRef} · this matrix {d.ourSourceRef} · you are reading
        the {column} column
      </p>
    </div>
  )
}

function MatrixSection({ column }: { readonly column: A7Column }) {
  const rows = a7RowsFor('profile-lite')
  return (
    <div
      data-testid="fl-a7-matrix"
      data-column={column}
      data-viewing="profile-lite"
      className="space-y-4"
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        What Profile-lite draws for the {column} column
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        Nine rows and {A7_MATRIX_SHAPE.columns} persona columns, transcribed from the frozen source
        at L{A7_MATRIX_SHAPE.firstDataLine} to L{A7_MATRIX_SHAPE.lastDataLine}. This is the only
        Frontline matrix with a sixth column — “Platform roles”, at L{A7_MATRIX_SHAPE.headerLine} —
        and the eleven others carry five. Every cell below shows the source’s own token and words,
        and what this screen draws for the {column} column beside it.
      </p>
      <p data-testid="fl-a7-column-roles" className="text-sm text-[var(--color-ink-muted)]">
        The {column} column covers {A7_COLUMN_ROLES[column].join(', ')}.{' '}
        {A7_COLUMN_ROLES[column].length > 1
          ? 'It is a set of roles rather than one role, which is why this matrix keys its columns on the header’s own words and not on a single platform role identifier.'
          : ''}
      </p>

      <ul className="space-y-4">
        {rows.map((row) => {
          const affordance = frontlineAffordance(row, column)
          const cell = row.cells[column]
          return (
            <li
              key={row.id}
              data-testid="fl-a7-matrix-row"
              data-row={row.id}
              data-affordance={affordance.kind}
              data-row-surface={row.surface}
              data-outcome={cell.outcome}
              className={`${CARD}`}
            >
              <h3 className="text-sm font-medium text-[var(--color-ink)]">{row.control}</h3>
              <p data-testid="fl-a7-cell-note" className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {column}: {cell.note}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</p>
              <div className="mt-3">
                {row.id === A7_ROW_3_ALSO_TRANSCRIBED_BY.rowId ? (
                  <DeferredToNeighbour column={column} />
                ) : (
                  <ControlOrLine
                    affordance={affordance}
                    column={column}
                    control={row.control}
                    sourceRef={row.sourceRef}
                  />
                )}
              </div>
              {cell.openDecision === A7_TENANT_ADMIN_WIPE_AUTHORITY.id ? (
                <TenantAdminWipeAuthority />
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CharterCard({
  ids,
  heading,
}: {
  readonly ids?: readonly A7CharterStatementId[]
  readonly heading: string
}) {
  const statements =
    ids === undefined ? A7_CHARTER_STATEMENTS : ids.map((id) => a7CharterStatement(id))
  return (
    <div data-testid="fl-a7-charter" className={`${CARD} space-y-3`}>
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{heading}</h2>
      <dl className="space-y-3">
        {statements.map((s) => (
          <div key={s.id} data-testid="fl-a7-charter-statement" data-statement={s.id}>
            <dt className="text-sm font-medium text-[var(--color-ink)]">{s.heading}</dt>
            <dd data-testid="fl-a7-charter-text" className="text-sm text-[var(--color-ink-muted)]">
              {s.text}
            </dd>
            <dd className="text-xs text-[var(--color-ink-subtle)]">
              {s.sourceRef} · {s.sourceClass}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Three states, three rows, never a severity number. L41410: "the three
 * suspension states are genuinely different on the device: soft changes
 * nothing the worker can see, hard limits starting work, and compliance
 * stops everything."
 */
function SuspensionStates() {
  return (
    <div
      data-testid="fl-a7-suspension-states"
      className={`${CARD} space-y-3`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        The three suspension states are genuinely different on the device
      </h2>
      <dl className="space-y-3">
        {A7_SUSPENSION_STATES.map((s) => (
          <div key={s.stateId} data-testid="fl-a7-suspension-state" data-state={s.stateId}>
            <dt className="text-sm font-medium text-[var(--color-ink)]">
              {s.name} — {s.stateId}
            </dt>
            <dd className="text-sm text-[var(--color-ink-muted)]">{s.onTheDevice}</dd>
            <dd className="text-sm text-[var(--color-ink-muted)]">How it ends: {s.exit}</dd>
            <dd className="text-xs text-[var(--color-ink-subtle)]">{s.sourceRef}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * The lock, DESCRIBED and not rendered, and no dismiss affordance of any
 * kind for any persona. Neither wording of the fixed message is printed as
 * the message — where each wording is quoted in the source is recorded, and
 * the two wordings themselves stand in the `DEC-MSG-001` disclosure below.
 */
function ComplianceLock() {
  return (
    <div
      data-testid="fl-a7-compliance-lock"
      className={`${DASHED} space-y-3`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        {A7_COMPLIANCE_LOCK.screenId} — the compliance lock, and why it is not on this screen
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)]">{A7_COMPLIANCE_LOCK.description}</p>
      <p className="text-sm text-[var(--color-ink-muted)]">
        {A7_COMPLIANCE_LOCK.whyNotRenderedHere}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">
          [{A7_COMPLIANCE_LOCK.sourceRef}]
        </span>
      </p>
      <p data-testid="fl-a7-no-dismiss" className="text-sm text-[var(--color-ink)]">
        There is no control anywhere in this module that lifts the lock, for any persona including
        the platform. Row 7 of the matrix is prohibited in all six columns and the Platform-roles
        cell carries the reason in its own words: it lifts only when the suspension lifts.
        TEST-A7-4 (L41438) attempts the dismissal and asserts no such control exists.
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Where the fixed message is quoted, and which wording each place uses
      </p>
      <ul className="space-y-1">
        {A7_MESSAGE_RENDERINGS.map((r) => (
          <li
            key={r.locator}
            data-testid="fl-a7-message-rendering"
            className="text-xs text-[var(--color-ink-muted)]"
          >
            {r.where} — quotes {r.quotes} [{r.locator}]
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * What this destination does with no connection, read from wave 0 rather
 * than restated, plus the one thing this module adds and L41323 states in
 * terms: no security command can arrive, and no surface may imply otherwise.
 */
function OfflineStanding() {
  const destination = flDestinationBySlug('profile-lite')
  const safetyLayer = frontlineConnectivityTreatment({ kind: 'safety-layer' })
  return (
    <div
      data-testid="fl-a7-offline"
      className={`${CARD} space-y-2`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">With no connection</h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        {destination.name}: {destination.offlineNote}.{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">[{destination.sourceRef}]</span>
      </p>
      <p data-testid="fl-a7-offline-claim" className="text-sm text-[var(--color-ink)]">
        {A7_OFFLINE_HONESTY.claim}
      </p>
      <p className="text-sm text-[var(--color-ink-muted)]">{A7_OFFLINE_HONESTY.whatStillWorks}</p>
      <p className="text-sm text-[var(--color-ink-muted)]">{safetyLayer.reason}</p>
      <p className="text-xs text-[var(--color-ink-subtle)]">{A7_OFFLINE_HONESTY.sourceRef}</p>
    </div>
  )
}

/** A source cell's own words with the source's code ticks dropped. */
const plain = (cell: string): string => cell.replace(/`/g, '')

/**
 * §34.7's CLASSIFICATION OF THIS MODULE'S FUNCTIONS, AND THE TWO ROWS A
 * MODULE-LABELLED FILTER DOES NOT RETURN.
 *
 * Every row here is wave 0's transcription in `@/offline/capability`, read
 * and never re-transcribed, and every locator is derived from the row's
 * position in that array. What this section adds is the reconciliation: five
 * rows labelled, two reached, seven functions against eleven functionalities,
 * and the one functionality no Function cell in the register names.
 */
function OfflineClassification() {
  return (
    <div data-testid="fl-a7-offline-classification" className={`${CARD} space-y-4`}>
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        What §34.7 classifies this module&rsquo;s functions as, with no connection
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        The classification register is keyed on Function, not on module id. Module is an ordinary
        column, and four of its fifty-two rows do not hold a single module id. So these rows are{' '}
        <em>filtered</em> on the Module cell&rsquo;s own text and never looked up by it —{' '}
        {A7_MODULE_FILTER_MEASUREMENT.byContainment} rows name this module by containment and{' '}
        {A7_MODULE_FILTER_MEASUREMENT.byEquality} by equality, and the two filters part company on
        {`L${A7_MODULE_FILTER_MEASUREMENT.whereTheyDiffer.join(', L')}`}, which writes two module ids
        into one cell. <span className="text-xs text-[var(--color-ink-subtle)]">[L78766]</span>
      </p>

      <ul className="space-y-3">
        {A7_REGISTER_ROWS.map((row) => (
          <li
            key={row.fn}
            data-testid="fl-a7-register-row"
            data-class={row.klass}
            data-line={registerLineOf(row)}
            className="text-sm"
          >
            <span className="font-medium text-[var(--color-ink)]">{row.fn}</span> —{' '}
            <span className="text-[var(--color-ink)]">{row.klass}</span>
            <br />
            <span className="text-[var(--color-ink-muted)]">
              {plain(row.reason)}. Held locally: {plain(row.dataRequiredLocally)}. Expiry:{' '}
              {plain(row.expiry)}. Roles: {plain(row.roleAndQualificationRestrictions)}. Fallback:{' '}
              {plain(row.fallback)}. On reconnection: {plain(row.reconnectBehaviour)}.
            </span>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">{`[L${registerLineOf(row)}]`}</span>
          </li>
        ))}
      </ul>

      <p data-testid="fl-a7-register-tally" className="text-sm text-[var(--color-ink-muted)]">
        Counted off the rows rather than asserted beside them:{' '}
        {Object.entries(A7_REGISTER_CLASS_TALLY)
          .map(([klass, n]) => `${klass} ${n}`)
          .join(', ')}
        .{' '}
        {`${A7_ROWS_OUTSIDE_THE_SEVEN.length} of them carries a class outside the seven AC-OFF-701 (L78831) names, and the rows AC-OFF-702 (L78832) governs are ${
          A7_ROWS_UNDER_AC_OFF_702.length === 0
            ? 'none'
            : A7_ROWS_UNDER_AC_OFF_702.map((r) => `L${registerLineOf(r)}`).join(' and ')
        }`}{' '}
        — nothing classified fully available offline may make a network call on its execution path.
      </p>

      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Two more rows are this module&rsquo;s and a module-labelled filter returns neither
      </p>
      <ul className="space-y-2">
        {A7_CROSS_MODULE_REACH.map((r) => (
          <li
            key={r.line}
            data-testid="fl-a7-cross-module-reach"
            data-line={r.line}
            className="text-sm"
          >
            <span className="font-medium text-[var(--color-ink)]">{r.fn}</span>, filed
            Cross-module. <span className="text-[var(--color-ink-muted)]">{r.evidence}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{r.bearsOn}</span>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">{`[L${r.line}]`}</span>
          </li>
        ))}
        <li data-testid="fl-a7-storage-row-not-restated" className="text-sm">
          <span className="font-medium text-[var(--color-ink)]">
            {A7_STORAGE_ROW_NOT_RESTATED.fn}
          </span>
          , also Cross-module, is named and not restated.{' '}
          <span className="text-[var(--color-ink-muted)]">
            {A7_STORAGE_ROW_NOT_RESTATED.whyNotRestated}
          </span>{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">
            {`[L${A7_STORAGE_ROW_NOT_RESTATED.line}]`}
          </span>
        </li>
      </ul>

      <div
        role="note"
        data-testid="fl-a7-unclassified-functionality"
        data-functionality={A7_UNCLASSIFIED_FUNCTIONALITY.functionality}
        className={DASHED}
      >
        <p className="font-medium text-[var(--color-ink)]">
          One functionality of the eleven is classified by no row of the register
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {A7_UNCLASSIFIED_FUNCTIONALITY.question}
        </p>
        <ul className="mt-2 space-y-1">
          {A7_UNCLASSIFIED_FUNCTIONALITY.readings.map((r) => (
            <li key={r.locator} className="text-sm">
              <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{r.locator}]
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-[var(--color-ink)]">
          {A7_UNCLASSIFIED_FUNCTIONALITY.note}
        </p>
      </div>

      <p data-testid="fl-a7-pin-reset-divergence" className="text-sm text-[var(--color-ink-muted)]">
        {A7_PIN_RESET_ROLE_DIVERGENCE.divergence}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">
          {`[L${A7_PIN_RESET_ROLE_DIVERGENCE.registerLine}, L${A7_PIN_RESET_ROLE_DIVERGENCE.matrixLine}]`}
        </span>
      </p>
    </div>
  )
}

/**
 * ROW 9 AS A BEHAVIOUR RATHER THAN A TRANSCRIPTION.
 *
 * The five verbs of `AC-A7-6` (L41427) do not share one capability class in
 * the register, and the seven states of L41315 do not share one answer.
 * Both are computed and neither is asserted beside the data.
 */
function DeviceStanding({ trustWindow }: { readonly trustWindow: A7TrustWindow }) {
  return (
    <div data-testid="fl-a7-device-standing" data-trust-window={trustWindow} className={`${CARD} space-y-4`}>
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        What the device does under each state, on its last known state alone
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        There is no connectivity control here and that is the reading, not an omission: L41381 makes
        the predicate whether the command <em>arrived</em>, and a command that has not arrived is
        not part of the last known state. An offline device continues under that state, which no
        surface may misrepresent.
      </p>

      <ul className="space-y-3">
        {A7_STATE_IDS.map((id) => {
          const standing = a7OfflineStanding(id, trustWindow)
          return (
            <li
              key={id}
              data-testid="fl-a7-standing"
              data-state={id}
              data-new-runs={standing.newRunsStart}
              data-in-flight={standing.inFlightRunsContinue}
              data-safe-stop={String(standing.safeStop)}
              className="text-sm"
            >
              <span className="font-medium text-[var(--color-ink)]">{id}</span> — new Runs start:{' '}
              {standing.newRunsStart}; in-flight Runs continue: {standing.inFlightRunsContinue}
              <br />
              <span className="text-[var(--color-ink-muted)]">{standing.what}</span>
              <br />
              <span className="text-[var(--color-ink-muted)]">{standing.expiryNote}</span>{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">
                [{standing.sourceRef}]
              </span>
            </li>
          )
        })}
      </ul>

      <p data-testid="fl-a7-standing-not-stated" className="text-sm text-[var(--color-ink-muted)]">
        {A7_STANDING_NOT_STATED.length} of the fourteen answers are not stated by the source and are
        marked so rather than filled in: {A7_STANDING_NOT_STATED.join('; ')}.
      </p>

      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Under hard suspension the five verbs do not share one class
      </p>
      <ul className="space-y-2">
        {A7_COMPLETION_VERB_CLASSIFICATION.map((v) => (
          <li
            key={v.verb}
            data-testid="fl-a7-verb"
            data-verb={v.verb}
            data-classes={a7VerbClasses(v.verb).join(' | ')}
            className="text-sm"
          >
            <span className="font-medium text-[var(--color-ink)]">{v.verb}</span> —{' '}
            {a7VerbClasses(v.verb).length === 0
              ? 'classified by no row of the register'
              : a7VerbClasses(v.verb).join(' and ')}
            .{' '}
            <span className="text-[var(--color-ink-muted)]">{v.basis}</span>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">
              {v.registerLines.length === 0
                ? '[measured over all fifty-two rows, L78768-L78819]'
                : `[L${v.registerLines.join(', L')}]`}
            </span>
          </li>
        ))}
      </ul>
      <p data-testid="fl-a7-verbs-without-one-class" className="text-sm text-[var(--color-ink)]">
        {A7_VERBS_WITHOUT_ONE_CLASS.length} of the five carry no single class:{' '}
        {A7_VERBS_WITHOUT_ONE_CLASS.join(', ')}. The mapping from verb to register row is this
        build&rsquo;s reading — the source draws no line between L41305&rsquo;s verbs and §34.7&rsquo;s
        Function cells — and the divergence is not, because the register classifies these acts
        separately and gives them different answers whichever reasonable mapping is made.
      </p>
    </div>
  )
}

function FallbackContract() {
  return (
    <div
      data-testid="fl-a7-fallbacks"
      className={`${CARD} space-y-3`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        Fallback patterns, and the criterion that every functionality names one
      </h2>
      <ul className="space-y-2">
        {A7_PATTERNS_FROM_MAP.map((p) => (
          <li key={p.id} data-testid="fl-a7-pattern" data-pattern={p.id} className="text-sm">
            <span className="font-medium text-[var(--color-ink)]">
              {p.id} — {p.title}
            </span>
            <br />
            <span className="text-[var(--color-ink-muted)]">
              Criticality: {p.criticality}. Terminal safe state: {p.terminalSafeState}.
            </span>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">[{p.sourceRef}]</span>
          </li>
        ))}
      </ul>

      <p data-testid="fl-a7-pattern-divergence" className="text-sm text-[var(--color-ink-muted)]">
        {A7_PATTERN_DIVERGENCE.note}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">
          [{A7_PATTERN_DIVERGENCE.sourceRef}]
        </span>
      </p>

      <p data-testid="fl-a7-ac-fl-011-1" className="text-sm text-[var(--color-ink)]">
        {A7_FUNCTIONALITIES_NAMING_NO_PATTERN.length === 0
          ? `All ${A7_FUNCTIONALITIES.length} functionalities of this module name at least one FB-FL-* pattern, which is what AC-FL-011-1 (L40151) requires. Twelve functionalities elsewhere in this chapter name none; none of them is this module’s.`
          : `AC-FL-011-1 (L40151) requires every functionality to name at least one FB-FL-* pattern. ${A7_FUNCTIONALITIES_NAMING_NO_PATTERN.join(', ')} names none, and nothing is assigned here to close the gap — an assigned pattern would make the criterion pass against an invented fact.`}
      </p>

      <p data-testid="fl-a7-lockout-threshold" className="text-sm text-[var(--color-ink-muted)]">
        {A7_LOCKOUT_THRESHOLD.note}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">
          [{A7_LOCKOUT_THRESHOLD.sourceRef}]
        </span>
      </p>
    </div>
  )
}

function OpenDecisions() {
  return (
    <div
      data-testid="fl-a7-decisions"
      className="space-y-4"
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        Open decisions this screen discloses and does not settle
      </h2>
      {A7_DISCLOSURES.map((d) => (
        <div
          key={d.decisionRef}
          role="note"
          data-testid="fl-a7-decision"
          data-decision={d.decisionRef}
          className={DASHED}
        >
          <p className="font-medium text-[var(--color-ink)]">Open decision {d.decisionRef}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{d.question}</p>

          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {d.readings.map((r) => (
              <li key={r.locator + r.text.slice(0, 24)} className="text-sm">
                <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
                <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                  [{r.locator}]
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            This build&apos;s working position
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">{d.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            A client-delegated choice. The client delegated the decision, not the pretence that the
            source settled it.
          </p>

          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            Why it bears on this module: {d.whyHere}
          </p>
          <p data-testid="fl-a7-canon-note" className="mt-2 text-xs text-[var(--color-ink-muted)]">
            {d.canonNote}
          </p>
        </div>
      ))}

      <div
        role="note"
        data-testid="fl-a7-command-class-finding"
        data-decision={A7_COMMAND_CLASS_GAP.theSourcesIdentifier}
        className={DASHED}
      >
        <p className="font-medium text-[var(--color-ink)]">
          A finding about a neighbouring file, recorded and not edited
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{A7_COMMAND_CLASS_GAP.note}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          {A7_COMMAND_CLASS_GAP.sourceRef}
        </p>
      </div>
    </div>
  )
}

export interface A7ProfileLiteViewProps {
  /** The persona column the reader is standing in. One of the header's six. */
  readonly column: A7Column
  /**
   * Whether the cached authority the device is standing on is still inside
   * the offline trust window. Defaults to `valid`, because that is the state
   * a device is in until L78817's window is reached; `expired` is the
   * register's own safe stop and is a scenario, never a default.
   */
  readonly trustWindow?: A7TrustWindow
}

export function A7ProfileLiteView({ column, trustWindow = 'valid' }: A7ProfileLiteViewProps) {
  return (
    <div data-testid="fl-a7-profile-lite" className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Profile-lite — MOD-FL-A7, Security and Data Protection
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          The security positions this scope holds, on the destination §25.5 gives this module
          alongside MOD-FL-A1. The happy path for this module is invisibility, so nothing here is a
          control: it is the record of what is held, what is refused, and where the acts that are
          not this device&rsquo;s are met.{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">[L48534, L41317]</span>
        </p>
      </header>

      <CharterCard
        heading="What this module says about itself"
        ids={[
          'identifier',
          'purpose',
          'owning-surface',
          'roles',
          'states',
          'alternate-paths',
          'fallback',
        ]}
      />

      <MatrixSection column={column} />
      <SuspensionStates />
      <ComplianceLock />
      <OfflineStanding />
      <OfflineClassification />
      <DeviceStanding trustWindow={trustWindow} />
      <FallbackContract />
      <OpenDecisions />
    </div>
  )
}


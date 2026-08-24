'use client'

import { useState } from 'react'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { CrossSurfaceAct, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import { Button, StatusPill } from '@/ui/primitives'
import {
  B8_CARD,
  B8_CARD_ELISIONS,
  B8_CLAIMS_NEVER_MADE,
  B8_EXCLUDED_DISPLAYS,
  B8_STATES,
  B8_WHERE_IT_SURFACES,
  SB_FL_017,
} from './charter'
import {
  AUTHORED_FALLBACK_PROVENANCE,
  COACHING_ASSET_PROVENANCE,
  FL_B8_AI_FAILURE_CELL,
  FL_B8_AI_FAILURE_READING,
  FL_B8_AI_FAILURE_ROW,
  FL_B8_AI_FAILURE_ROW_MODULE,
  FL_B8_DEGRADATION_FINDINGS,
  FL_B8_EXPLANATION_LINE_SEAM,
  FL_B8_NEVER_LIVE,
  FL_B8_NO_CONTROL_RULE,
  FL_B8_PAUSE_DISCLOSURE,
  FL_B8_SAFETY_FLAG_DISCLOSURE,
  NO_SELECTION_PROVENANCE,
  uniformlyProhibitedRows,
} from './degradation'
import {
  B8_PLACES_NAMED,
  B8_ROWS,
  FL_B8_COLUMNS,
  FL_B8_COLUMN_HEADINGS,
  FL_B8_MATRIX,
  FL_B8_SHAPE,
  ROW_5_NAMES_TWO_SURFACES,
  b8Row,
  type FlB8Column,
  type FlB8MatrixRow,
  type FlB8RowId,
} from './matrix'
import {
  B8_ABSENT_REACHES,
  B8_ACCEPTANCE_CRITERIA,
  B8_CANON_DECISIONS,
  B8_FUNCTIONALITIES,
  B8_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B8_HAPPY_PATH,
  B8_LOCAL_DISCLOSURES,
  B8_MAPPED_PATTERNS,
  B8_NO_FAILURE_ANNOUNCEMENT,
  B8_NOTIFICATIONS,
  B8_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B8_PATTERN_DIVERGENCE,
  B8_SAFETY_LAYER_UNTOUCHED,
  B8_SOCIAL_CONTRACT,
  B8_SOURCE_FINDINGS,
  B8_SOURCE_TESTS,
  authoredVariant,
  coachingGuidance,
  dismissalOutcome,
  type B8AgentReach,
  type B8Guidance,
} from './service'

/**
 * `MOD-FL-B8` — Coaching Rendering. The Run Player panel.
 *
 * THE CARD IS A REGION OF THE STEP SCREEN AND NEVER A DIALOG, AND THAT IS THE
 * WHOLE OF THIS FILE'S RISK. L41471: "coaching is advisory and never gates".
 * A coaching card built as a modal that must be dismissed converts an advisory
 * into a gate, and it ships as ordinary competent interface work — a `<Dialog>`
 * would look like a considered choice in review. So there is no dialog here,
 * no overlay, no focus trap and no backdrop: the card is a `<div>` beside
 * the step, `SB-FL-017` frame 2 says "nothing that blocks the measurement
 * field", and the covering component suite asserts that the panel contains no
 * `role="dialog"`, no `aria-modal` and no `<dialog>` element in ANY card state.
 *
 * THE STEP GOES ON WHATEVER THE CARD IS DOING. `fl-b8-step-unaffected` renders
 * in every one of the four card states and is never hidden, disabled or moved
 * behind the dismissal. A gate that only checked the dismissed state would pass
 * against a card that blocked while it was open, which is the defect.
 *
 * EVERY CONTROL ON THIS PANEL IS DECIDED BY `frontlineAffordance` AND NONE IS
 * DECIDED AROUND IT. The matrix draws exactly three controls across its
 * thirty-five cells — view, replay and dismiss, all the Worker's — and this
 * panel draws exactly those three. `FrontlineAffordance` has no `disabled`
 * member, so a refused act renders as no control plus a stated line.
 *
 * WHERE THE PANEL ADDS TO THE FOLD RATHER THAN ROUTING AROUND IT. Row 5's cells
 * name two different owning surfaces and wave 0's row type holds one. The fold
 * still decides that no control is drawn; the PLACE comes from this module's
 * own `metElsewhereByColumn`, and where a column names none the panel names
 * none. `matrix.ts` carries the finding and this file renders it.
 *
 * NOTHING HERE COUNTS ANYTHING. No total, no comparison, no history, no
 * measure of the worker's own speed. `RISK-FL-B8-1` (L39250) names the risk in
 * the source's own words and this is the module it names.
 */

const ROW_BY_ID: Readonly<Record<FlB8RowId, FlB8MatrixRow>> = Object.fromEntries(
  FL_B8_MATRIX.map((r) => [r.id, r]),
) as Readonly<Record<FlB8RowId, FlB8MatrixRow>>

/** One-word summaries of what the fold returned, for the cell's own pill. */
const KIND_LABEL: Readonly<Record<FrontlineAffordance['kind'], string>> = {
  control: 'Control drawn here',
  'read-only': 'Visible, unchangeable',
  'cross-surface': 'Held on another surface',
  'named-place': 'Met on another screen of this application',
  routed: 'Routed to another row of this matrix',
  'stated-line': 'No control, and a stated line',
  refusal: 'No control',
}

/**
 * The fold's words for a cell — with ONE substitution, declared here rather
 * than hidden in the table.
 *
 * For a cross-surface cell the fold returns the ROW's note, which is right for
 * every row of every Frontline matrix measured so far except row 5 of this one.
 * Where this module's `metElsewhereByColumn` names a destination for the
 * column, the column's own words are used; where it names none — the Worker and
 * Tenant Admin cells of row 5, whose prohibition is absolute rather than a
 * misplacement — the cell's own words stand and no place is named at all.
 */
function affordanceWords(
  a: FrontlineAffordance,
  row: FlB8MatrixRow,
  column: FlB8Column,
): string {
  switch (a.kind) {
    case 'cross-surface': {
      const met = row.metElsewhereByColumn[column]
      return met === undefined ? row.cells[column].note : met.note
    }
    case 'control':
    case 'read-only':
    case 'named-place':
    case 'refusal':
      return a.note
    case 'routed':
      return `${a.note} That act is row "${ROW_BY_ID[a.toRowId as FlB8RowId].control}" of this matrix.`
    case 'stated-line':
      return a.line
  }
}

function Ref({ text }: { readonly text: string }) {
  return <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">[{text}]</span>
}

function Heading({ children }: { readonly children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
      {children}
    </h4>
  )
}

/* ── the card at the step ──────────────────────────────────────────── */

const REACH_LABEL: Readonly<Record<B8AgentReach, string>> = {
  available: 'Connected, agent layer answering',
  offline: 'This tablet has no connection',
  'agent-outage': 'A server-side agent outage',
  'emergency-pause': 'A platform-wide or per-tenant emergency pause',
}

type CardState = 'offered' | 'viewed' | 'replayed' | 'dismissed'

const CARD_STATE_ID: Readonly<Record<CardState, string>> = {
  offered: 'STATE-B8-OFFERED',
  viewed: 'STATE-B8-VIEWED',
  replayed: 'STATE-B8-REPLAYED',
  dismissed: 'STATE-B8-DISMISSED',
}

function TheCard({ viewerRole }: { readonly viewerRole: FlB8Column }) {
  const [reach, setReach] = useState<B8AgentReach>('available')
  const [cardState, setCardState] = useState<CardState>('offered')
  const [dismissedNote, setDismissedNote] = useState<string | null>(null)

  const guidance: B8Guidance = coachingGuidance(reach)
  const isCard = guidance.kind === 'agent-selected-card'
  const variant = authoredVariant('Spanish', isCard ? ['English', 'Spanish'] : ['English'])

  /**
   * THE THREE INTERACTION ROWS SHARE ONE CELL SET, so viewing, replaying and
   * dismissing are controls for exactly the same columns — L41468, L41469 and
   * L41470 differ only in their Action column. All three affordances are asked
   * and all three must agree before a card is drawn, so the panel cannot draw a
   * replay control for a column the matrix does not give the view to. Rendering
   * a separate stated line per control would be three unreachable branches, and
   * a branch nothing can reach is a claim no gate can check: the stated line
   * for a column with no card is drawn ONCE below, from the view row.
   */
  const view = frontlineAffordance(b8Row('view-a-coaching-card'), viewerRole)
  const replay = frontlineAffordance(b8Row('replay-a-coaching-card'), viewerRole)
  const dismiss = frontlineAffordance(b8Row('dismiss-a-coaching-card'), viewerRole)
  const interactive =
    view.kind === 'control' && replay.kind === 'control' && dismiss.kind === 'control'

  const showCard = isCard && cardState !== 'dismissed' && interactive
  const noCardForThisRole = !interactive

  /**
   * WHETHER THIS REGION IS CARRYING GUIDANCE RIGHT NOW, derived from the same
   * three values the branches below are, so the provenance declaration cannot
   * drift from what is drawn. Two of the four reachable states render no
   * guidance at all — the card waved away, and the column with no card — and
   * marking the region a guidance element in those states would claim a class
   * for an empty region, which is the fifth of this build's defect shapes.
   */
  const guidanceShown = interactive && (showCard || !isCard)

  return (
    <div role="group" aria-label="The card at the step" className="space-y-3">
      <Heading>The card at the step</Heading>

      <div className="flex flex-wrap gap-2">
        {(['available', ...B8_ABSENT_REACHES] as readonly B8AgentReach[]).map((r) => (
          <Button
            key={r}
            variant={r === reach ? 'primary' : 'secondary'}
            onClick={() => {
              setReach(r)
              setCardState('offered')
              setDismissedNote(null)
            }}
          >
            {REACH_LABEL[r]}
          </Button>
        ))}
      </div>

      {/*
        THE CARD REGION. A section, never a dialog. The covering suite reads
        this region's own text for the agent-unavailable sweep rather than the
        page's, because the page states the rule elsewhere and legitimately —
        L41504 puts agent unavailability on the oversight surfaces.
      */}
      <div
        aria-label="Coaching card region"
        role="group"
        data-testid="fl-b8-card-region"
        data-guidance={guidance.kind}
        {...(guidanceShown ? { 'data-guidance-element': 'MOD-FL-B8 coaching guidance' } : {})}
        data-card-state={cardState}
        className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        {showCard ? (
          <>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-[var(--color-ink)]">
                {guidance.heading}
              </p>
              <StatusPill tone="info" icon="○" label={CARD_STATE_ID[cardState]} />
            </div>
            <p data-testid="fl-b8-card-body" className="mt-1 text-sm text-[var(--color-ink)]">
              {guidance.body}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{variant.line}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setCardState('replayed')
                }}
              >
                {guidance.controls[0]}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setCardState('dismissed')
                  setDismissedNote(
                    dismissalOutcome(reach === 'offline' ? 'offline' : 'connected').line,
                  )
                }}
              >
                {guidance.controls[1]}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setCardState('viewed')
                }}
              >
                Leave it open and carry on
              </Button>
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              <Ref text={guidance.sourceRef} />
            </p>
          </>
        ) : noCardForThisRole ? (
          <>
            <p className="text-base font-semibold text-[var(--color-ink)]">
              No card is drawn here
            </p>
            <p
              data-testid="fl-b8-no-card-for-role"
              className="mt-1 text-sm text-[var(--color-ink)]"
            >
              {affordanceWords(view, b8Row('view-a-coaching-card'), viewerRole)}
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              <Ref text={b8Row('view-a-coaching-card').sourceRef} />
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-[var(--color-ink)]">
              {isCard ? 'Nothing is showing here now' : guidance.heading}
            </p>
            <p
              data-testid="fl-b8-fallback-body"
              className="mt-1 text-sm text-[var(--color-ink)]"
            >
              {isCard
                ? 'The card was waved away and the step is exactly where it was.'
                : guidance.body}
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              <Ref text={guidance.sourceRef} />
            </p>
          </>
        )}

        {/*
          THE ONE PROVENANCE CLASS THIS REGION EMITS, AND WHY IT IS THE SAME
          ONE IN BOTH GUIDANCE STATES. `PROV-3`'s own definition names "packaged
          short coaching assets, and the replay of a card that was previously
          delivered" alongside the authored Work Instructions, so the clip the
          agent SELECTS and the instruction it falls back to are one class. The
          agent selects; it does not produce. Labelling the clip as live is what
          the absolute rule forbids, and this is the mark that makes the panel
          say so rather than merely not say the opposite.
        */}
        {guidanceShown ? (
          <div className="mt-3">
            <ProvenanceMark
              classId={isCard ? COACHING_ASSET_PROVENANCE : AUTHORED_FALLBACK_PROVENANCE}
              statement={FL_B8_NEVER_LIVE.hereItMeans}
            />
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              <Ref text={FL_B8_NEVER_LIVE.sourceRef} />
            </p>
          </div>
        ) : null}
      </div>

      {/*
        THE STEP, WHICH IS NEVER WAITING ON THE CARD. Present in every card
        state and never hidden — the gate drives all four states and asserts it
        each time, because a check on the dismissed state alone would pass
        against a card that blocked while it was open.
      */}
      <p
        data-testid="fl-b8-step-unaffected"
        className="max-w-prose text-sm text-[var(--color-ink)]"
      >
        The step is unaffected. Coaching is advisory and never gates: the card does not cover
        the measurement field, nothing waits for it to be read, and a worker who ignores it
        entirely loses nothing. Letting a dismissal block or delay a step is explicitly
        prohibited in every column of this matrix, including the worker&rsquo;s own.{' '}
        <Ref text="L41471, AC-B8-3 · L41578, SB-FL-017 · L41566" />
      </p>

      {dismissedNote === null ? null : (
        <p data-testid="fl-b8-dismissal-note" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          {dismissedNote} <Ref text="AC-B8-4 · L41579, L41514" />
        </p>
      )}

      {reach === 'available' ? null : (
        <p
          data-testid="fl-b8-why-no-card"
          className="max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {B8_NO_FAILURE_ANNOUNCEMENT.rule} {B8_NO_FAILURE_ANNOUNCEMENT.where}{' '}
          <Ref text={B8_NO_FAILURE_ANNOUNCEMENT.sourceRef} />
        </p>
      )}

      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        {B8_SAFETY_LAYER_UNTOUCHED.reason} <Ref text={B8_SAFETY_LAYER_UNTOUCHED.sourceRef} />
      </p>
    </div>
  )
}

/* ── the transcriptions ────────────────────────────────────────────── */

function Card() {
  return (
    <div role="group" aria-label="Identity card">
      <Heading>The module, in the source&rsquo;s own words</Heading>
      <dl className="mt-2 space-y-2">
        {B8_CARD.map((s) => (
          <div key={s.sourceRef} data-testid="fl-b8-card-field" className="text-sm">
            <dt className="font-medium text-[var(--color-ink)]">{s.field}</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {s.text}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">
                {s.sourceClass === null
                  ? 'The card carries no classification marker for this field, and none is supplied.'
                  : `[${s.sourceClass}]`}
              </span>{' '}
              <Ref text={s.sourceRef} />
            </dd>
          </div>
        ))}
      </dl>
      {B8_CARD_ELISIONS.map((s) => (
        <p
          key={s.sourceRef}
          data-testid="fl-b8-elision"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          Not carried whole — {s.field}: {s.elision} <Ref text={s.sourceRef} />
        </p>
      ))}
    </div>
  )
}

function States() {
  return (
    <div role="group" aria-label="States">
      <Heading>The five states this module names</Heading>
      <ul className="mt-2 space-y-1">
        {B8_STATES.map((s) => (
          <li key={s.id} data-testid="fl-b8-state" className="text-sm">
            <span className="text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {s.gloss ?? 'The source names this state and glosses it nowhere, so nothing is supplied here.'}
            </span>{' '}
            <Ref text={s.sourceRef} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Storyboard() {
  return (
    <div role="group" aria-label="Storyboard">
      <Heading>
        {SB_FL_017.id} — {SB_FL_017.title}
      </Heading>
      <ol className="mt-2 space-y-1">
        {SB_FL_017.frames.map((f) => (
          <li key={f.n} data-testid="fl-b8-frame" className="text-sm">
            <span className="text-[var(--color-ink)]">Frame {f.n}.</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.text}</span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function MatrixTable({ viewerRole }: { readonly viewerRole: FlB8Column }) {
  return (
    <div role="group" aria-label="Permission matrix">
      <Heading>Who may do what, all {FL_B8_SHAPE.cells} cells</Heading>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {FL_B8_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {FL_B8_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {B8_ROWS.map((row) => (
              <tr key={row.id} data-testid="fl-b8-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  <span
                    data-testid="fl-b8-row-why"
                    className="mt-1 block text-xs text-[var(--color-ink-muted)]"
                  >
                    {row.why} <Ref text={row.whyRef} />
                  </span>
                  <span className="mt-1 block">
                    <Ref text={row.sourceRef} />
                  </span>
                </th>
                {FL_B8_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  const met = row.metElsewhereByColumn[column]
                  return (
                    <td
                      key={column}
                      data-testid="fl-b8-cell"
                      data-row={row.id}
                      data-column={column}
                      data-kind={drawn.kind}
                      data-place={
                        met === undefined || met.where !== 'another-surface'
                          ? 'none'
                          : met.surface
                      }
                      className="border-b p-2 align-top"
                    >
                      <span className="block text-xs font-medium text-[var(--color-ink-subtle)]">
                        {KIND_LABEL[drawn.kind]}
                      </span>
                      <span
                        data-testid="fl-b8-cell-own-words"
                        className="block text-[var(--color-ink)]"
                      >
                        {row.cells[column].note}
                      </span>
                      <span className="block text-[var(--color-ink-muted)]">
                        {affordanceWords(drawn, row, column)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {B8_PLACES_NAMED.map(({ rowId, column, met }) => {
        // A place on ANOTHER DESTINATION of this surface is not a surface
        // crossing and `CrossSurfaceAct` would claim a sixth surface for it.
        // No cell of this matrix names one; the branch is live so that a later
        // cell which did would be silent here rather than mis-rendered, and
        // the unit suite asserts all three places are surface crossings.
        if (met.where !== 'another-surface') return null
        return (
          <div key={`${rowId}-${column}`} className="mt-3">
            <CrossSurfaceAct
              model={frontlineCrossSurfaceModel(
                {
                  capability: `${ROW_BY_ID[rowId].control} — ${FL_B8_COLUMN_HEADINGS[column]}`,
                  owningSurface: met.surface,
                  whatHappensThere: met.note,
                  sourceRef: ROW_BY_ID[rowId].sourceRef,
                },
                viewerRole,
              )}
            />
          </div>
        )
      })}

      <p
        data-testid="fl-b8-row-5-finding"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {ROW_5_NAMES_TWO_SURFACES.what} {ROW_5_NAMES_TWO_SURFACES.evidence}{' '}
        {ROW_5_NAMES_TWO_SURFACES.whatThisModuleDoes}{' '}
        <Ref text={ROW_5_NAMES_TWO_SURFACES.sourceRef} />
      </p>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          The denial and failure tests these refusals answer to
        </p>
        <ul className="mt-1 space-y-1">
          {B8_SOURCE_TESTS.map((t) => (
            <li key={t.id} data-testid="fl-b8-source-test" className="text-sm">
              <span className="text-[var(--color-ink)]">
                {t.id} ({t.type}).
              </span>{' '}
              <span className="text-[var(--color-ink-muted)]">{t.text}</span>{' '}
              <Ref text={t.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Functionalities() {
  return (
    <div role="group" aria-label="Functionalities">
      <Heading>
        The {B8_FUNCTIONALITIES.length} functionalities, and the fallback each one names
      </Heading>
      <ul className="mt-2 space-y-2">
        {B8_FUNCTIONALITIES.map((f) => (
          <li key={f.id} data-testid="fl-b8-functionality" className="text-sm">
            <span className="text-[var(--color-ink)]">
              {f.id}. {f.statement}
            </span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {f.rolesAllowed} {f.rolesProhibited} {f.connectivity} {f.fallbackClause}
            </span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ul>

      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Three readings of this module&rsquo;s fallback set, and none reconciled. From the
        shared pattern map: {B8_MAPPED_PATTERNS.map((p) => p.id).join(', ')}. From the
        card&rsquo;s own Fallback line:{' '}
        {B8_PATTERN_DIVERGENCE.fromTheCardsFallbackLine.join(', ')}. From the functionalities
        above: {B8_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}.{' '}
        {B8_PATTERN_DIVERGENCE.note} <Ref text={B8_PATTERN_DIVERGENCE.sourceRef} />
      </p>

      <p
        data-testid="fl-b8-ac-011-gap"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        AC-FL-011-1 asks every functionality in this chapter to name at least one FB-FL-*
        pattern. {B8_FUNCTIONALITIES_NAMING_NO_PATTERN.length} of these{' '}
        {B8_FUNCTIONALITIES.length} names none:{' '}
        {B8_FUNCTIONALITIES_NAMING_NO_PATTERN.join(', ')}, whose Fallback clause reads
        &ldquo;Not applicable — replay reads content already on screen.&rdquo; Nothing is
        assigned to close it, because an assigned pattern is indistinguishable from a real one
        forever afterwards. <Ref text="AC-FL-011-1 · L40151; FUNC-B8-01-2-1 · L41534" />
      </p>
    </div>
  )
}

function Notifications() {
  return (
    <div role="group" aria-label="Notifications">
      <Heading>Who is told, and who is not</Heading>
      <ul className="mt-2 space-y-2">
        {B8_NOTIFICATIONS.map((n) => (
          <li key={n.sourceRef} data-testid="fl-b8-notification" className="text-sm">
            <span className="text-[var(--color-ink)]">{n.trigger}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              Recipient: {n.recipient}. Channel: {n.channel}. States exercised:{' '}
              {n.statesExercised}.
            </span>{' '}
            <Ref text={n.sourceRef} />
          </li>
        ))}
      </ul>
      <p
        data-testid="fl-b8-social-contract"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {B8_SOCIAL_CONTRACT.text} <Ref text={B8_SOCIAL_CONTRACT.sourceRef} />
      </p>
    </div>
  )
}

/* ── the artificial-intelligence degradation overlay ───────────────── */

/**
 * THE SECTION WHERE THIS MODULE FACES CHAPTERS 40 TO 44.
 *
 * Three things, and the third is the reason the section exists. What §43.3.4
 * says this module does when the agent layer is gone; which provenance class
 * each element it draws carries; and the two questions the source asks about
 * this exact card and answers twice, differently. Neither question is settled
 * here, and the panel says which reading it is demonstrating and why, because
 * this is the surface where a person acts and a silent choice here is a safety
 * claim on a tablet.
 */
function AiDegradation() {
  const uniform = uniformlyProhibitedRows()

  return (
    <div role="group" aria-label="Artificial-intelligence degradation" className="space-y-6">
      <Heading>When the agent layer is gone</Heading>

      <p data-testid="fl-b8-ai-behaviour" className="max-w-prose text-sm text-[var(--color-ink)]">
        {FL_B8_AI_FAILURE_ROW_MODULE} — <em>{FL_B8_AI_FAILURE_ROW.behaviourCell}</em>{' '}
        {FL_B8_AI_FAILURE_ROW.classificationCell}. Read as an outcome:{' '}
        <code data-testid="fl-b8-ai-outcome">{FL_B8_AI_FAILURE_CELL.outcome}</code>, stated as{' '}
        &ldquo;{FL_B8_AI_FAILURE_CELL.detail}&rdquo;. {FL_B8_AI_FAILURE_READING.statement}{' '}
        {FL_B8_AI_FAILURE_READING.alsoBinds} <Ref text={FL_B8_AI_FAILURE_READING.sourceRef} />
      </p>

      <div>
        <Heading>What each thing on this panel is, and what it is not</Heading>
        <p
          data-testid="fl-b8-never-live"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
        >
          {FL_B8_NEVER_LIVE.rule} {FL_B8_NEVER_LIVE.hereItMeans}{' '}
          <Ref text={FL_B8_NEVER_LIVE.sourceRef} />
        </p>
        <p
          data-testid="fl-b8-absence-class"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          Where nothing is selected, the class the contract gives the absence is{' '}
          <code>{NO_SELECTION_PROVENANCE}</code>. Its rendering treatment is a muted panel naming
          the current operating mode, and this panel does not draw one, because whether the
          worker&rsquo;s surface names that mode at all is the open decision below. The class is
          named here; its treatment is not applied to the card.
        </p>
        <p
          data-testid="fl-b8-version-seam"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          A seam, named rather than filled: the approved-guidance treatment asks for the content
          version and the approval date beside the panel. This module holds neither. Both travel
          in the released package the run is pinned to, which <code>MOD-FL-A6</code> owns and this
          module reads, so the mark above carries no version rather than one invented here.{' '}
          <Ref text="L41498" />
        </p>
        <p
          data-testid="fl-b8-explanation-seam"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {FL_B8_EXPLANATION_LINE_SEAM.element} {FL_B8_EXPLANATION_LINE_SEAM.unestablished}{' '}
          {FL_B8_EXPLANATION_LINE_SEAM.notResolvedHere} Owner: {FL_B8_EXPLANATION_LINE_SEAM.owner}{' '}
          <Ref text={FL_B8_EXPLANATION_LINE_SEAM.sourceRef} />
        </p>
      </div>

      <div>
        <Heading>Rows that draw no control for anybody</Heading>
        <p
          data-testid="fl-b8-no-control-rule"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
        >
          {FL_B8_NO_CONTROL_RULE.rule} {FL_B8_NO_CONTROL_RULE.why}{' '}
          <Ref text={FL_B8_NO_CONTROL_RULE.sourceRef} />
        </p>
        <ul className="mt-2 space-y-1">
          {uniform.map((row) => (
            <li key={row.id} data-testid="fl-b8-no-control-row" className="text-sm">
              <span className="text-[var(--color-ink)]">{row.control}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                — prohibited in every column, so no control is drawn for any of them.
              </span>{' '}
              <Ref text={row.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Heading>The control this card is told both to omit and to offer</Heading>
        <div
          role="note"
          data-testid="fl-b8-safety-flag-disclosure"
          className="mt-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            Open decision {FL_B8_SAFETY_FLAG_DISCLOSURE.decisionRef}
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            {FL_B8_SAFETY_FLAG_DISCLOSURE.question}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {FL_B8_SAFETY_FLAG_DISCLOSURE.readings.map((r) => (
              <li key={r.locator} data-testid="fl-b8-safety-flag-reading">
                <span className="text-[var(--color-ink)]">{r.text}</span> <Ref text={r.locator} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            What this build demonstrates, and why
          </p>
          <p data-testid="fl-b8-safety-flag-adopted" className="mt-1 text-[var(--color-ink)]">
            {FL_B8_SAFETY_FLAG_DISCLOSURE.adopted}
          </p>
          <p
            data-testid="fl-b8-safety-flag-consequence"
            className="mt-2 text-[var(--color-ink-muted)]"
          >
            If it is ruled the other way:{' '}
            {FL_B8_SAFETY_FLAG_DISCLOSURE.consequenceIfRuledOtherwise}
          </p>
          <p className="mt-2 text-[var(--color-ink-muted)]">
            {FL_B8_SAFETY_FLAG_DISCLOSURE.whyHere}
          </p>
          <p
            data-testid="fl-b8-safety-flag-canon-note"
            className="mt-2 text-xs text-[var(--color-ink-subtle)]"
          >
            {FL_B8_SAFETY_FLAG_DISCLOSURE.canonNote}
          </p>
        </div>
      </div>

      <div>
        <Heading>Whether this surface says anything at all about a pause</Heading>
        <div data-testid="fl-b8-pause-disclosure">
          <DecisionDisclosure id={FL_B8_PAUSE_DISCLOSURE.id} />
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {FL_B8_PAUSE_DISCLOSURE.whyHere}
          </p>
          <p
            data-testid="fl-b8-pause-existing-statement"
            className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
          >
            {FL_B8_PAUSE_DISCLOSURE.thisModuleAlreadySaysSomething}{' '}
            {FL_B8_PAUSE_DISCLOSURE.andTheGapInIt}{' '}
            <Ref text={FL_B8_PAUSE_DISCLOSURE.sourceRef} />
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {FL_B8_PAUSE_DISCLOSURE.notResolvedHere}
          </p>
        </div>
      </div>

      <div>
        <Heading>What was measured here and left open</Heading>
        <ul className="mt-2 space-y-2">
          {FL_B8_DEGRADATION_FINDINGS.map((f) => (
            <li key={f.sourceRef} data-testid="fl-b8-degradation-finding" className="text-sm">
              <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">Owner: {f.owner}</span>{' '}
              <Ref text={f.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Disclosures() {
  return (
    <div role="group" aria-label="Open decisions">
      <Heading>Open decisions, disclosed rather than settled</Heading>
      <div className="mt-2 space-y-3">
        {B8_LOCAL_DISCLOSURES.map((d) => (
          <div
            key={d.decisionRef}
            role="note"
            data-testid="fl-b8-disclosure"
            className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              Open decision {d.decisionRef}
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">{d.question}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              All readings stand. None is this build&rsquo;s to settle.
            </p>
            <ul className="mt-1 space-y-2">
              {d.readings.map((r) => (
                <li key={r.locator + r.text.slice(0, 24)}>
                  <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
                  <Ref text={r.locator} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              This build&apos;s working position
            </p>
            <p className="mt-1 text-[var(--color-ink)]">{d.adopted}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              A client-delegated choice under APP-012, not a position the source settled.
            </p>
            <p data-testid="fl-b8-consequence" className="mt-2 text-[var(--color-ink-muted)]">
              If it is ruled the other way: {d.consequenceIfRuledOtherwise}{' '}
              <Ref text="DEC-GATE-001 · L113201, L112214" />
            </p>
            <p className="mt-2 text-[var(--color-ink-muted)]">{d.whyHere}</p>
            <p data-testid="fl-b8-canon-note" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              {d.canonNote}
            </p>
          </div>
        ))}

        {B8_CANON_DECISIONS.map((d) => (
          <div key={d.id} data-testid="fl-b8-canon-decision">
            <DecisionDisclosure id={d.id} />
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              {d.whyHere} <Ref text={d.sourceRef} />
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── the view ──────────────────────────────────────────────────────── */

export function CoachingView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: FlB8Column
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {FL_B8_COLUMN_HEADINGS[viewerRole]} column. Three of this
        matrix&rsquo;s thirty-five cells draw a control and all three are the
        worker&rsquo;s: view a card, replay it, wave it away. Nothing on this panel is a
        step the work waits for.
      </p>

      <TheCard viewerRole={viewerRole} />

      <div role="group" aria-label="Happy path">
        <Heading>The path the source describes</Heading>
        <ol className="mt-2 space-y-1">
          {B8_HAPPY_PATH.map((s) => (
            <li key={s.n} data-testid="fl-b8-happy-step" className="text-sm">
              <span className="text-[var(--color-ink)]">{s.n}.</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{s.text}</span>{' '}
              <Ref text={s.sourceRef} />
            </li>
          ))}
        </ol>
      </div>

      <Card />
      <States />
      <Storyboard />
      <MatrixTable viewerRole={viewerRole} />
      <Functionalities />
      <Notifications />

      <div role="group" aria-label="What this module never claims">
        <Heading>What this module never claims</Heading>
        <ul className="mt-2 space-y-2">
          {B8_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-b8-never-claimed" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.claim}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.instead}</span>{' '}
              <Ref text={c.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div role="group" aria-label="What this surface never displays">
        <Heading>What no screen of this application displays, in any state</Heading>
        <ul className="mt-2 space-y-2">
          {B8_EXCLUDED_DISPLAYS.map((e) => (
            <li key={e.sourceRef} data-testid="fl-b8-excluded-display" className="text-sm">
              <span className="text-[var(--color-ink-muted)]">{e.position}</span>{' '}
              <Ref text={e.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div role="group" aria-label="Acceptance criteria">
        <Heading>What this module has to be true</Heading>
        <ul className="mt-2 space-y-1">
          {B8_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-b8-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.id}.</span>{' '}
              <span
                className={
                  a.criterion === null
                    ? 'text-[var(--color-ink-muted)] italic'
                    : 'text-[var(--color-ink-muted)]'
                }
              >
                {a.criterion ?? a.whyNotTranscribed}
              </span>{' '}
              <Ref text={a.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <AiDegradation />
      <Disclosures />

      <div role="group" aria-label="Where this module surfaces">
        <Heading>Where this module surfaces, and where it does not</Heading>
        <ul className="mt-2 space-y-1">
          {B8_WHERE_IT_SURFACES.map((w) => (
            <li key={w.sourceRef} data-testid="fl-b8-surfaces" className="text-sm">
              <span className="text-[var(--color-ink)]">{w.place}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{w.what}</span>{' '}
              <Ref text={w.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div role="group" aria-label="Findings recorded rather than closed">
        <Heading>Findings, recorded rather than closed</Heading>
        <ul className="mt-2 space-y-2">
          {B8_SOURCE_FINDINGS.map((f) => (
            <li key={f.sourceRef} data-testid="fl-b8-finding" className="text-sm">
              <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.notClosedBecause}</span>{' '}
              <Ref text={f.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * NO PANEL OBJECT IS EXPORTED FROM THIS FILE, AND THAT IS THE FIX RATHER THAN
 * A TIDY-UP. It carries `'use client'`, so an object exported here becomes a
 * client reference in a build and a server component reading its string fields
 * gets nothing -- the slice-7 defect that shipped `data-testid=
 * "fl-panel-undefined"` for four of six Run Player modules. The panel the route
 * mounts is built in the server module `./panel.tsx`, which is what
 * `app/frontline/run-player/page.tsx` imports and what the component suite
 * asserts on. A duplicate here, imported by nothing but that suite, is how the
 * assertion that looked like it guarded the mounted id stopped being able to
 * fail; `tests/coverage/slice-09-gates.test.ts` gate 11 now convicts the shape
 * across `src` and `app` rather than on the Command Center alone.
 */

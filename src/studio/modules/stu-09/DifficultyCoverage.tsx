import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import type { StudioPersonaColumn } from '@/studio/access/evaluate'
import { STU_SEAMS, stuSeamById, type StudioSeamDefinition } from '@/studio/seams'
import { screenRendersState } from '@/studio/state/screen-states'
import { DIFFICULTY_LEVELS, type DifficultyLevel, type Locale } from '@/studio/vocab'
import { Banner, Button, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { STU_09_CROSS_SURFACE } from './matrix'
import {
  difficultyAffordance,
  gapNote,
  isReviewed,
  renderingForWorker,
  STU09_DEFAULT_CONTEXT,
  type DifficultyCell,
  type DifficultyContext,
  type DifficultyControlRendering,
} from './levels'

/**
 * `SB-STU-12`, the difficulty-level editor, as it sits inside **Section 1 of
 * `SCR-STU-04`** (L33038). This module owns no route: L32953's own no-route
 * reason is that "a separate route would invent a second authoring path for
 * one body of content", so this is a COMPONENT with a frozen prop contract
 * and `SCR-STU-04` mounts it in one line.
 *
 * THE PROP CONTRACT IS FROZEN AGAINST TASK 15. The first four props are the
 * brief's own, verbatim and in its own order. `persona` is a FIFTH REQUIRED
 * prop and is a declared departure, not an adaptation made quietly: every
 * control on this surface takes its affordance from `evaluateStudioAccess`
 * over a matrix row and a persona column (C19), and there is no honest
 * default for a persona — a defaulted one would be a policy default living
 * inside a component. Everything after it is optional with a stated default.
 *
 * THIS COMPONENT DECIDES NOTHING. Every affordance comes from
 * `difficultyAffordance` in `./levels`, which asks the evaluator; every gap
 * sentence comes from `gapNote`; the worker default comes from
 * `renderingForWorker`. No role list is read here and no policy is computed
 * here.
 *
 * ROW 7 IS A STATEMENT, NEVER A CONTROL (R22). "Set the difficulty level on
 * a worker profile" is a Delivery Operations Hub act — `FUNC-STU-09-03-A-1`
 * (L32998) prohibits "the Studio from writing it, since it is another
 * surface's master data". It renders as the cross-surface statement beside
 * the seam notice for `worker-profile-difficulty-field`, and no `<button>`
 * is drawn for it for anybody.
 */

/** The three tab labels `SB-STU-12` names, in the source's own order. */
const LEVEL_LABEL: Readonly<Record<DifficultyLevel, string>> = {
  simple: 'Simple',
  standard: 'Standard',
  expanded: 'Expanded',
}

/**
 * The permanent line `SB-STU-12` requires, verbatim (L33038). A constant so
 * that a reworded copy in a second place cannot exist.
 */
export const EQUIVALENCE_LINE =
  'Difficulty levels change explanation depth only. Captures, gates, limits, and severity ' +
  'mappings are identical across all levels.'

/** How the drafting aid is behaving. STATE-10 and STATE-11 are two states, not one. */
export type DraftingAidState = 'available' | 'degraded' | 'unavailable'

export interface DifficultyCoverageProps {
  readonly screenId: string
  readonly declaredLocales: readonly Locale[]
  /** Three levels by the declared locales — six for the two declared ones. */
  readonly cells: readonly DifficultyCell[]
  readonly onOpen: (level: DifficultyLevel, locale: Locale) => void
  /** The matrix column this reader resolves to. See the contract note above. */
  readonly persona: StudioPersonaColumn
  readonly draftingAid?: DraftingAidState
  /**
   * The worker-profile difficulty field, read from `MOD-DOH-04`. `null` is
   * the UNSET case and renders the defined default; `undefined` means this
   * panel is not previewing a worker at all.
   */
  readonly workerProfileLevel?: DifficultyLevel | null
  readonly ctx?: DifficultyContext
  /** The seam register, passed in. Never a module-load snapshot. */
  readonly seams?: readonly StudioSeamDefinition[]
}

/** One rendering rule for every control on this panel. */
function Control({ rendering }: { readonly rendering: DifficultyControlRendering }) {
  if (rendering.kind === 'absent') {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: rendering.note }} />
  }
  if (rendering.kind === 'disabled') {
    return (
      <Button variant="secondary" disabledReason={rendering.reason}>
        {rendering.label}
      </Button>
    )
  }
  return null
}

export function DifficultyCoverage({
  screenId,
  declaredLocales,
  cells,
  onOpen,
  persona,
  draftingAid = 'available',
  workerProfileLevel,
  ctx = STU09_DEFAULT_CONTEXT,
  seams = STU_SEAMS,
}: DifficultyCoverageProps) {
  // A strip that renders fewer cells than the declared locale set demands is
  // the under-validation this panel exists to prevent, and an EMPTY strip
  // would satisfy any assertion written over it. Neither is a state to
  // render, so both throw — the same precedent `ScreenStateBoundary` sets
  // for a caller that omits `detail.decision`.
  const expected = DIFFICULTY_LEVELS.length * declaredLocales.length
  if (declaredLocales.length === 0) {
    throw new Error(
      'DifficultyCoverage: the declared locale set is empty. A Workflow declares its locales ' +
        'before any instruction content is authored, so an empty set is a caller bug rather ' +
        'than a coverage state, and a strip drawn from it would satisfy every assertion made ' +
        'about it while showing nothing.',
    )
  }
  if (cells.length !== expected) {
    throw new Error(
      `DifficultyCoverage: ${cells.length} cells were supplied for ${DIFFICULTY_LEVELS.length} ` +
        `levels by ${declaredLocales.length} declared locales, which needs ${expected}. The ` +
        'coverage strip is the thing that proves no rendering is missing; a short strip would ' +
        'report full coverage over renderings nobody looked at.',
    )
  }

  const gaps = cells.flatMap((cell) => {
    const note = gapNote(cell)
    return note === null ? [] : [note]
  })

  // Section 1 of SCR-STU-04. The two drafting-aid states apply HERE by
  // L48330's third departure, and the applicability table is the authority
  // on that — not a literal written into this component.
  const aidState = draftingAid === 'degraded' ? 'STATE-10' : 'STATE-11'
  const aidApplies = draftingAid !== 'available' && screenRendersState('SCR-STU-04', aidState)

  const profileSeam = stuSeamById(seams, 'worker-profile-difficulty-field')
  const [profileRow, frontlineRow] = STU_09_CROSS_SURFACE
  const worker = workerProfileLevel === undefined ? null : renderingForWorker(workerProfileLevel)

  return (
    <section aria-label={`Difficulty levels for ${screenId}`} className="space-y-4">
      <h3 className="text-base font-semibold text-[var(--color-ink)]">
        Difficulty levels — {screenId}
      </h3>

      {/* The permanent line. Not conditional on anything. */}
      <p data-testid="equivalence-line" className="text-sm text-[var(--color-ink-muted)]">
        {EQUIVALENCE_LINE}
      </p>

      {aidApplies ? (
        <ScreenStateBoundary
          state={aidState}
          surface="SURF-STU"
          detail={
            draftingAid === 'degraded'
              ? {
                  degradedMissing:
                    'The drafting aid is degraded, so it is not drafting the other two levels.',
                  degradedRemaining:
                    'The author writes all three difficulty levels manually. Coverage checking, ' +
                    'equivalence validation and rendering selection are unaffected, because none ' +
                    'of them uses a model, and publication is not blocked by the drafting outage — ' +
                    'only by the absence of reviewed content.',
                }
              : {
                  unavailableCause:
                    'The drafting aid is unavailable, so the author writes all three difficulty ' +
                    'levels manually. The platform’s artificial intelligence accelerates authoring ' +
                    'and never publishes, so nothing here is blocked by its absence except the ' +
                    'drafting itself.',
                }
          }
        />
      ) : null}

      {/* THE COVERAGE STRIP — SB-STU-12, L33038. */}
      <div
        role="grid"
        aria-label={`Difficulty coverage for ${screenId}: ${DIFFICULTY_LEVELS.length} levels by ${declaredLocales.length} declared locales`}
        className="space-y-2"
      >
        {DIFFICULTY_LEVELS.map((level) => (
          <div role="row" key={level} className="flex flex-wrap items-start gap-3">
            <span className="w-24 shrink-0 text-sm font-medium text-[var(--color-ink)]">
              {LEVEL_LABEL[level]}
            </span>
            {declaredLocales.map((locale) => {
              const cell = cells.find((c) => c.level === level && c.locale === locale)
              if (cell === undefined) {
                throw new Error(
                  `DifficultyCoverage: no cell was supplied for ${locale} ${level} on ${screenId}. ` +
                    'A missing cell and a green cell must never read the same.',
                )
              }
              const green = isReviewed(cell.state)
              const note = gapNote(cell)
              const rendering = difficultyAffordance(
                'edit-a-drafted-level-before-submission',
                persona,
                ctx,
                `Open ${LEVEL_LABEL[level]} · ${locale}`,
              )
              return (
                <div
                  role="gridcell"
                  key={`${level}-${locale}`}
                  data-testid={`coverage-cell-${level}-${locale}`}
                  className="min-w-56 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-2"
                >
                  <StatusPill
                    tone={green ? 'ok' : 'blocked'}
                    icon={green ? '✅' : '⛔'}
                    label={`${locale} ${level} — ${cell.state ?? 'not authored'}`}
                  />
                  {note !== null ? (
                    <p className="mt-1 text-xs text-[var(--color-status-blocked)]">{note}</p>
                  ) : null}
                  {rendering.kind === 'enabled' ? (
                    <Button variant="secondary" onClick={() => onOpen(level, locale)}>
                      {rendering.label}
                    </Button>
                  ) : (
                    <Control rendering={rendering} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* A drafted-but-unreviewed rendering BLOCKS publication (L32981). */}
      {gaps.length > 0 ? (
        <Banner
          tone="blocked"
          heading="Publication is blocked until every rendering has been reviewed"
          body={`${screenId} — ${gaps.join(' ')} No generated rendering reaches a worker unreviewed (L32945).`}
        />
      ) : null}

      {/* The worker-profile default. Never an empty state (L33011). */}
      {worker !== null ? (
        <p data-testid="worker-rendering" className="text-sm text-[var(--color-ink-muted)]">
          {worker.note}
        </p>
      ) : null}

      {/* ROW 7 — a cross-surface statement, never a control. */}
      <div data-testid="profile-field-cross-surface" className="space-y-2">
        <p className="text-sm text-[var(--color-ink)]">{profileRow.statement}</p>
        <StudioSeamNotice seam={profileSeam} />
      </div>

      {/* ROW 8's Worker cell — also a consequence, also not a control. */}
      <p data-testid="frontline-cross-surface" className="text-sm text-[var(--color-ink-muted)]">
        {frontlineRow.statement}
      </p>

      {/* D16 / DEC-WIDIFF-001, through the one disclosure component. */}
      <DecisionDisclosure id="D16" />
    </section>
  )
}

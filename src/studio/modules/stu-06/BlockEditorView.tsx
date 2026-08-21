import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { publishCheckById } from '@/studio/publish/checks'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { DIFFICULTY_LEVELS } from '@/studio/vocab'
import { Button, EmptyState, StatusPill } from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'

import {
  BLOCK_STATES,
  PROPAGATION_NOTICE,
  SCOPE_NOTICE,
  applyingScreens,
  blockState,
  blockText,
  composeSection1,
  coverageState,
  deleteRefusal,
  scopeOf,
  submissionReport,
  type BlockRegister,
  type InstructionBlock,
  type WorkflowBlockScope,
} from './blocks'
import type { Stu06CapabilityId } from './matrix'
import {
  blockControls,
  deleteControlDecision,
  readableBlocks,
  type Stu06Scenario,
} from './rendering'

/**
 * `SB-STU-09` (L32523) — the block editor. *"A panel listing every block in
 * this Workflow with its title, the count of applying screens, and its
 * locale and difficulty coverage state. Opening a block shows a per-locale,
 * per-difficulty-level editor and a list of applying screens, each
 * clickable. A prominent line states: 'Blocks belong to this Workflow only.
 * They are not Content Library items and cannot be used in another
 * Workflow.' A delete control is disabled while applying screens exist, with
 * those screens named."*
 *
 * THE POLICY IS NOT HERE. Every affordance comes from `blockControls`, which
 * asks task 1's evaluator once per control over that control's own matrix
 * row. This component is handed finished answers and draws them.
 *
 * THE DELETE CONTROL READS `deleteRefusal`, THE SAME FUNCTION THE WRITE
 * READS. A disabled control and a refused write cannot disagree about which
 * screens apply a block, because there is one rule and two callers.
 *
 * ### WHAT THIS VIEW MAY NEVER SAY
 *
 * `AC-STU-070` (L32562): *"no view suggests live propagation to a pinned
 * package."* The propagation notice below is the module's whole answer to
 * that, and `suggestsLivePropagation` is asserted false over this
 * component's rendered markup for all eight personas — not over a constant,
 * over the markup, because the prohibition is about what a reader sees.
 */

export interface BlockEditorViewProps {
  readonly scenario: Stu06Scenario
  readonly register: BlockRegister
  /** WHICH WORKFLOW. There is no view of "all blocks" and cannot be (R11). */
  readonly workflowId: string
  readonly selectedBlockId?: string | undefined
  readonly onSelect?: ((blockId: string) => void) | undefined
  readonly onAct?: ((control: Stu06CapabilityId, blockId: string) => void) | undefined
  readonly lastMessage?: string | null | undefined
}

const STATE_TONE = {
  Draft: 'neutral',
  'Applied to one or more screens': 'info',
  'Published within a version': 'ok',
} as const satisfies Readonly<Record<(typeof BLOCK_STATES)[number], 'neutral' | 'info' | 'ok'>>

export function BlockEditorView({
  scenario,
  register,
  workflowId,
  selectedBlockId,
  onSelect,
  onAct,
  lastMessage = null,
}: BlockEditorViewProps) {
  const scope = scopeOf(register, workflowId)

  return (
    <div className="space-y-10">
      <ScopePanel workflowName={scope?.workflowName ?? workflowId} />

      {scope === undefined ? (
        <section aria-labelledby="no-workflow-heading">
          <h2 id="no-workflow-heading" className="text-xl font-semibold">
            No Workflow “{workflowId}” is open
          </h2>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Blocks are reached through their Workflow and through nothing else, so with no Workflow
            open there is no block to show. This is a declared absence, not an empty list: the
            register holds no scope keyed “{workflowId}”.
          </p>
        </section>
      ) : (
        <BlockPanel
          scenario={scenario}
          scope={scope}
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
          onAct={onAct}
          lastMessage={lastMessage}
        />
      )}

      <PropagationPanel />
      <ScreenStatePanel />
    </div>
  )
}

/* ==================================================================== *
 * The prominent line, and why the module exists at all.
 * ==================================================================== */

function ScopePanel({ workflowName }: { readonly workflowName: string }) {
  const check = publishCheckById('library-pointer')
  return (
    <section aria-labelledby="scope-heading">
      <h2 id="scope-heading" className="text-xl font-semibold">
        Shared Instruction Blocks — {workflowName}
      </h2>
      <p
        data-testid="scope-notice"
        className="mt-2 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm font-medium text-[var(--color-ink)]"
      >
        {SCOPE_NOTICE}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        A block is not a Content Library item. It has no cross-Workflow reuse, no independent
        version number and no separate governance: it lives inside its Workflow and is published,
        diffed and archived with it (L32441, L32443). An attempt to reference one from another
        Workflow is refused at the service layer, not hidden in a picker (L32550).
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        SCR-STU-05 · SCR-STU-BLOCK — screen identifiers are an annotation here, never a route key.
        Publish check {check.ordinal}, “{check.name}”, refuses publication carrying a block
        reference that will not resolve, naming {check.namesElement} ({check.sourceRef}).
      </p>
    </section>
  )
}

/* ==================================================================== *
 * The panel — every block in THIS Workflow.
 * ==================================================================== */

interface PanelProps {
  readonly scenario: Stu06Scenario
  readonly scope: WorkflowBlockScope
  readonly selectedBlockId: string | undefined
  readonly onSelect: ((blockId: string) => void) | undefined
  readonly onAct: ((control: Stu06CapabilityId, blockId: string) => void) | undefined
  readonly lastMessage: string | null
}

function BlockPanel({ scenario, scope, selectedBlockId, onSelect, onAct, lastMessage }: PanelProps) {
  // Scope is applied to the READ, before anything is ordered or drawn.
  const readable = readableBlocks(scenario, scope)
  const blocks = readable.blocks
  const selected =
    selectedBlockId === undefined
      ? blocks[0]
      : blocks.find((block) => block.id === selectedBlockId)
  const controls = blockControls(scenario)
  // OVER WHAT THIS VIEW READS, not over the whole scope. Found by planting
  // nothing at all: the covering test asserted a withheld draft's title
  // appears nowhere in the markup, and it appeared here — the panel's list
  // was scoped and this report was not, which is scope enforced in what a
  // screen DRAWS on one branch and in what it READS on another.
  const report = submissionReport({ ...scope, blocks: blocks })

  return (
    <section aria-labelledby="panel-heading" className="space-y-6">
      <h2 id="panel-heading" className="text-lg font-semibold">
        Every block in this Workflow
      </h2>

      {readable.withheldReason === null ? null : (
        <p data-testid="read-scope" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">
            {readable.withheldCount} block{readable.withheldCount === 1 ? '' : 's'} in this Workflow{' '}
            {readable.withheldCount === 1 ? 'is' : 'are'} not read from this view:{' '}
          </span>
          {readable.withheldReason}
        </p>
      )}

      {blocks.length === 0 ? (
        <EmptyState
          title="This Workflow holds no shared instruction block that is readable from this view"
          whatCreatesIt="An author creates a block at Workflow level and applies it to screens within that same Workflow. Nothing else in the platform creates one, and no block can arrive here from another Workflow."
        />
      ) : (
        <ul className="space-y-4">
          {blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              scope={scope}
              selected={selected?.id === block.id}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      {selected === undefined ? null : (
        <BlockEditorPane
          scenario={scenario}
          scope={scope}
          block={selected}
          controls={controls}
          onAct={onAct}
        />
      )}

      <div data-testid="unused-block-report">
        <h3 className="text-base font-semibold">Unused blocks at submission</h3>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {readable.withheldCount === 0
            ? report.message
            : `This report covers the ${blocks.length} block${blocks.length === 1 ? '' : 's'} this view reads; ${readable.withheldCount} more ${readable.withheldCount === 1 ? 'is' : 'are'} not read here, so it is not a complete count for this Workflow. ${report.message}`}{' '}
          A block with no applying screens is Draft and orphaned; it is reported at submission and
          it does not block submission (L32473, L32502).
        </p>
      </div>

      {lastMessage === null ? null : (
        <p
          data-testid="last-message"
          role="status"
          className="max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3 text-sm text-[var(--color-ink)]"
        >
          {lastMessage}
        </p>
      )}
    </section>
  )
}

/**
 * One panel row — *"title, the count of applying screens, and its locale and
 * difficulty coverage state"*, which is the storyboard's list exactly.
 */
function BlockRow({
  block,
  scope,
  selected,
  onSelect,
}: {
  readonly block: InstructionBlock
  readonly scope: WorkflowBlockScope
  readonly selected: boolean
  readonly onSelect: ((blockId: string) => void) | undefined
}) {
  const applying = applyingScreens(scope, block.id)
  const coverage = coverageState(block, scope.declaredLocales)
  const state = blockState(block)

  return (
    <li
      data-testid={`block-row-${block.id}`}
      className={`rounded-[var(--radius-surface)] border p-4 ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-surface-sunken)]'
          : 'border-[var(--color-border)]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-[var(--color-ink)]">{block.title}</span>
        <StatusPill tone={STATE_TONE[state]} icon="◆" label={state} />
        <span className="text-sm text-[var(--color-ink-subtle)]">
          {applying.length === 0
            ? 'no applying screens'
            : `${applying.length} applying screen${applying.length === 1 ? '' : 's'}`}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        {coverage.complete
          ? `Locale and difficulty coverage complete across ${scope.declaredLocales.join(' and ')} and all ${DIFFICULTY_LEVELS.length} difficulty levels.`
          : `Coverage incomplete — nothing authored for ${coverage.missing.join(', ')}. Publication in a declared locale is refused until every one is authored (FUNC-STU-06-03-A-1, L32493).`}
      </p>
      {onSelect === undefined ? null : (
        <div className="mt-2">
          <Button variant="secondary" onClick={() => onSelect(block.id)}>
            Open {block.title}
          </Button>
        </div>
      )}
    </li>
  )
}

/**
 * *"Opening a block shows a per-locale, per-difficulty-level editor and a
 * list of applying screens, each clickable."*
 */
function BlockEditorPane({
  scenario,
  scope,
  block,
  controls,
  onAct,
}: {
  readonly scenario: Stu06Scenario
  readonly scope: WorkflowBlockScope
  readonly block: InstructionBlock
  readonly controls: readonly ReturnType<typeof blockControls>[number][]
  readonly onAct: ((control: Stu06CapabilityId, blockId: string) => void) | undefined
}) {
  const applying = applyingScreens(scope, block.id)
  const refusal = deleteRefusal(scope, block.id)
  const deleteDecision = deleteControlDecision(scenario)
  const deletePermitted = deleteDecision.outcome === 'allowed' || deleteDecision.outcome === 'allowedWithConditions'

  return (
    <div data-testid="block-editor" className="space-y-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4">
      <h3 className="text-base font-semibold">{block.title}</h3>

      <div>
        <h4 className="text-sm font-semibold">Content, per locale and per difficulty level</h4>
        <table className="mt-2 w-full table-fixed text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="w-24 pb-1 font-medium text-[var(--color-ink-subtle)]">
                Locale
              </th>
              {DIFFICULTY_LEVELS.map((level) => (
                <th key={level} scope="col" className="pb-1 font-medium text-[var(--color-ink-subtle)]">
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scope.declaredLocales.map((locale) => (
              <tr key={locale} className="align-top">
                <th scope="row" className="py-1 font-medium text-[var(--color-ink)]">
                  {locale}
                </th>
                {DIFFICULTY_LEVELS.map((level) => {
                  const text = blockText(block, locale, level)
                  return (
                    <td key={level} className="py-1 pr-3 text-[var(--color-ink-muted)]">
                      {text ?? `Not authored — ${locale} · ${level}`}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-sm font-semibold">Applying screens</h4>
        {applying.length === 0 ? (
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            This block applies to no screen, so it is Draft and orphaned.
          </p>
        ) : (
          <ul className="mt-1 space-y-2">
            {applying.map((screen) => (
              <li key={screen.id} className="text-sm">
                <span className="font-medium text-[var(--color-ink)]">{screen.name}</span>{' '}
                <span className="text-[var(--color-ink-muted)]">
                  — Section 1 renders{' '}
                  {composeSection1(scope, screen.id, scope.declaredLocales[0] ?? 'English', 'standard')
                    .map((part, index) => (index === 0 ? 'the block content first' : `then “${part}”`))
                    .join(', ')}
                  .
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {controls.map((control) =>
          control.affordance.kind === 'absent' ? (
            <p
              key={control.id}
              data-testid={`absent-${control.id}`}
              className="max-w-prose text-sm text-[var(--color-ink-muted)]"
            >
              {control.label}: {control.affordance.note}
            </p>
          ) : control.affordance.kind === 'decision-open' ? (
            <p
              key={control.id}
              data-testid={`decision-open-${control.id}`}
              className="max-w-prose text-sm text-[var(--color-ink-muted)]"
            >
              {control.label}: {control.affordance.note} ({control.affordance.openDecision})
            </p>
          ) : control.affordance.kind === 'disabled' ? (
            <Button key={control.id} disabledReason={control.affordance.reason}>
              {control.label}
            </Button>
          ) : (
            <Button
              key={control.id}
              variant="secondary"
              {...(onAct === undefined ? {} : { onClick: () => onAct(control.id, block.id) })}
            >
              {control.label}
            </Button>
          ),
        )}

        {/* AC-STU-069 — disabled while applying screens exist, WITH THOSE
            SCREENS NAMED. The names come from `deleteRefusal`, the same
            function `deleteBlock` reads. */}
        {!deletePermitted ? (
          <p data-testid="delete-absent" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Delete block: {deleteDecision.reason}
          </p>
        ) : refusal !== null ? (
          <Button disabledReason={refusal}>Delete block</Button>
        ) : (
          <Button
            variant="danger"
            {...(onAct === undefined
              ? {}
              : { onClick: () => onAct('create-a-block-within-a-workflow', block.id) })}
          >
            Delete block
          </Button>
        )}
      </div>
    </div>
  )
}

/* ==================================================================== *
 * The propagation honesty panel — AC-STU-070.
 * ==================================================================== */

function PropagationPanel() {
  return (
    <section aria-labelledby="propagation-heading">
      <h2 id="propagation-heading" className="text-lg font-semibold">
        What an edit reaches, and when
      </h2>
      <p data-testid="propagation-notice" className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
        {PROPAGATION_NOTICE}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Within the draft, editing a block updates every screen that applies it, which is the whole
        point of the module (AC-STU-067, L32559). What the reviewer then sees is one changed screen
        per applying screen — eight changed screens rather than one changed block (L32548) — because
        what ships is the resolved composition per screen and never the block as an object.
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The three states a block occupies are {BLOCK_STATES.join(', ')} (L32473). A block carries no
        version number of its own; the version named on a published block is the Workflow version it
        travelled inside.
      </p>
      <div className="mt-3">
        <DecisionDisclosure id="DEC-AUDSTU-001" />
      </div>
    </section>
  )
}

/* ==================================================================== *
 * The screen-state contract for SCR-STU-05.
 * ==================================================================== */

function ScreenStatePanel() {
  return (
    <section aria-labelledby="states-heading">
      <h2 id="states-heading" className="text-lg font-semibold">
        The screen states this screen renders
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
        {STU_APPLICABLE_STATES.filter((row) => screenRendersState('SCR-STU-05', row.id)).map((row) => (
          <li key={row.id}>
            <span className="font-medium text-[var(--color-ink)]">
              {row.id} {screenState(row.id).name}
            </span>
            {row.departure === null ? '' : ` — ${row.departure}`}
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-STU"
          detail={{
            asOfLabel: 'as at the last successful read of this Workflow draft',
            originLabel: 'the tenant workspace, read through the Studio',
          }}
        />
      </div>
    </section>
  )
}

import { permitsAction } from '@/policy/decision'
import type { StudioAccessDecision } from '@/studio/access/evaluate'
import type { DifficultyLevel, Locale } from '@/studio/vocab'
import {
  PROPAGATION_NOTICE,
  applyingScreens,
  blockIn,
  blocksVisibleIn,
  composeSection1,
  deleteRefusal,
  screenIn,
  scopeOf,
  type BlockRegister,
  type BlockScreen,
  type InstructionBlock,
  type WorkflowBlockScope,
} from './blocks'

/**
 * EVERY WRITE `MOD-STU-06` PERFORMS, AND THE ONE AUDIT PATH THEY ALL ROUTE
 * THROUGH.
 *
 * THREE THINGS IN ONE FIXED ORDER, on every write in this file:
 *
 *   1. DOMAIN REFUSALS — the evaluator's answer for this control, then the
 *      scoping rule, then the rules belonging to the act itself. The audit
 *      sink is not reached by any of them: a refused action is not an
 *      action, and appending an entry for one would put a write in the log
 *      that never happened.
 *   2. THE AUDIT APPEND — after the refusals, BEFORE the mutation.
 *   3. THE MUTATION.
 *
 * THE REGISTER IS RETURNED, NEVER MUTATED. On every refusal the returned
 * register is the SAME OBJECT that came in, so a caller comparing by
 * identity can see that nothing happened. This build has shipped an audit
 * path wired to one of four write handlers — and that one the only handler
 * that mutated nothing — so the covering test proves each write mutates
 * something OBSERVABLE (a screen's rendered Section 1) on the accepting sink
 * before proving it mutates nothing on the failing one.
 *
 * ### THE SCOPE CHECK IS HERE, WHICH IS THE SERVICE LAYER
 *
 * L32550: *"Cross-Workflow reference is refused at the service layer."*
 * `FUNC-STU-06-02-B-1` (L32486) states what is refused: *"any attempt to
 * reference a block from a different Workflow or to expose a block in the
 * Content Libraries. Roles allowed: none. Roles prohibited: every role."*
 *
 * A refusal enforced only in a picker is not a refusal — it is a hidden
 * option. So `scopeRefusal` runs before anything else on every write, over
 * the register's own key, and the covering gate attempts the reference in
 * BOTH directions and then re-reads the other Workflow to confirm nothing
 * arrived there.
 *
 * DETERMINISM: no clock, no counter, no random source.
 */

export interface BlockActor {
  readonly identityId: string
  readonly displayName: string
}

export type BlockWriteAction = 'create' | 'apply' | 'edit' | 'remove' | 'delete'

export const BLOCK_WRITE_ACTIONS = [
  'create',
  'apply',
  'edit',
  'remove',
  'delete',
] as const satisfies readonly BlockWriteAction[]

type MissingFromActions = Exclude<BlockWriteAction, (typeof BLOCK_WRITE_ACTIONS)[number]>
const _actionsExhaustive: MissingFromActions extends never ? true : never = true
void _actionsExhaustive

export interface BlockAuditEntry {
  /** Identity and action, never "acting as role" (L33389, L34657). */
  readonly actorIdentityId: string
  readonly action: BlockWriteAction
  readonly workflowId: string
  readonly blockId: string
  /** Every screen this act changed. Empty only where it changed none. */
  readonly screenIds: readonly string[]
  readonly sourceRefs: readonly string[]
}

export type BlockAuditWrite = (
  entry: BlockAuditEntry,
) => { readonly ok: true } | { readonly ok: false; readonly reason: string }

/**
 * ONE DIFF ENTRY PER AFFECTED SCREEN — the shape L32548 requires: *"Block
 * creation, edits, applications, and removals are captured in the draft
 * revision history and surface in the screen-level diff for every affected
 * screen, so that a reviewer sees EIGHT CHANGED SCREENS rather than one
 * changed block."*
 *
 * `before` and `after` are that screen's OWN rendered Section 1, not the
 * block's text. One changed block copied eight times would give eight
 * identical entries; eight changed screens give eight different ones,
 * because each carries its own screen-specific note.
 */
export interface BlockDiffEntry {
  readonly screenId: string
  readonly screenName: string
  readonly field: string
  readonly before: string
  readonly after: string
}

export interface BlockWriteResult {
  readonly ok: boolean
  /** The NEW register on success; the ORIGINAL, untouched, on every refusal. */
  readonly register: BlockRegister
  readonly message: string
  /** The block the act produced, where it produced one. */
  readonly block: InstructionBlock | null
  /** Named screens this result is about. `AC-STU-069` renders this one. */
  readonly namedScreens: readonly string[]
  readonly diffEntries: readonly BlockDiffEntry[]
}

const AUDIT_REFS = ['L32548', 'L32550'] as const

/** The locale and level the draft revision history renders a diff in. */
const DIFF_LOCALE: Locale = 'English'
const DIFF_LEVEL: DifficultyLevel = 'standard'

function refuse(
  register: BlockRegister,
  message: string,
  namedScreens: readonly string[] = [],
): BlockWriteResult {
  return { ok: false, register, message, block: null, namedScreens, diffEntries: [] }
}

/* ==================================================================== *
 * THE SCOPING RULE — REFUSED AT THE SERVICE LAYER, ON EVERY WRITE.
 * ==================================================================== */

const CROSS_WORKFLOW =
  'Blocks are scoped to a single Workflow. A block is not a library item: it has no cross-Workflow ' +
  'reuse, no independent version number and no separate governance, and it does not appear in the ' +
  'Content Libraries (L32441, L32443). The reference is refused at the service layer, not hidden ' +
  'in a picker (L32486, L32550). Nothing was written.'

/**
 * Resolve the scope, the block and — where the act names one — the screen,
 * all THROUGH THE WORKFLOW'S OWN KEY.
 *
 * FIX ONCE, WHERE ALL CALLERS ROUTE. Five write functions call this; none of
 * them carries a second copy of the rule, so there is one place a
 * cross-Workflow reference can be refused and one place it could be broken.
 */
interface Resolved {
  readonly scope: WorkflowBlockScope
  readonly block: InstructionBlock
  readonly screen: BlockScreen | null
}

function resolve(
  register: BlockRegister,
  workflowId: string,
  blockId: string,
  screenId: string | null,
): Resolved | string {
  const scope = scopeOf(register, workflowId)
  if (scope === undefined) {
    return `No Workflow “${workflowId}” holds any block in this register. ${CROSS_WORKFLOW}`
  }
  const block = blockIn(register, workflowId, blockId)
  if (block === undefined) {
    return (
      `“${blockId}” is not a block of ${scope.workflowName}. ${CROSS_WORKFLOW} ` +
      `${scope.workflowName} holds ${blocksVisibleIn(register, workflowId).length} block(s), and a ` +
      'block belonging to another Workflow is not one of them and cannot become one.'
    )
  }
  if (screenId === null) return { scope, block, screen: null }
  const screen = screenIn(scope, screenId)
  if (screen === undefined) {
    return (
      `Screen “${screenId}” is not a screen of ${scope.workflowName}. ${CROSS_WORKFLOW} ` +
      'A block applies only to screens within its own Workflow (L32441).'
    )
  }
  return { scope, block, screen }
}

/** The evaluator's answer for one control, never a role list, never re-derived. */
function authorisationRefusal(decision: StudioAccessDecision | undefined): string | null {
  if (decision === undefined) return null
  if (permitsAction(decision.decision)) return null
  return (
    `Refused before anything was written: ${decision.reason} Nothing was written, and no audit ` +
    'entry was appended, because a refused action is not an action.'
  )
}

/* ==================================================================== *
 * THE ONE AUDIT PATH.
 * ==================================================================== */

interface CommitInput {
  readonly register: BlockRegister
  readonly scope: WorkflowBlockScope
  readonly actor: BlockActor
  readonly writeAudit: BlockAuditWrite
  readonly action: BlockWriteAction
  readonly blockId: string
  readonly sourceRefs: readonly string[]
  /** Which screens this act changes. The diff is derived from exactly these. */
  readonly affectedScreenIds: readonly string[]
  readonly successMessage: string
}

/**
 * Audit first, mutate second, and an audit failure fails the action with it:
 * nothing is left half-applied and nothing is queued for later, because this
 * surface never queues a write (D4).
 *
 * The diff is computed HERE, from the compositions before and after `apply`
 * runs, so every write's diff is one entry per affected screen by
 * construction rather than by each caller remembering to build one.
 */
function commit(
  input: CommitInput,
  apply: (scope: WorkflowBlockScope) => WorkflowBlockScope,
): BlockWriteResult {
  const names = input.affectedScreenIds.map(
    (id) => screenIn(input.scope, id)?.name ?? id,
  )
  const audit = input.writeAudit({
    actorIdentityId: input.actor.identityId,
    action: input.action,
    workflowId: input.scope.workflowId,
    blockId: input.blockId,
    screenIds: input.affectedScreenIds,
    sourceRefs: [...input.sourceRefs, ...AUDIT_REFS],
  })
  if (!audit.ok) {
    return refuse(
      input.register,
      `The audit write failed, so the action did not happen: ${audit.reason}. Every applying ` +
        'screen is unchanged, nothing is left half-applied, and nothing was queued for later — ' +
        'the audit entry commits in the same transaction as the action, so a failed audit fails ' +
        'the action with it.',
      names,
    )
  }

  const next = apply(input.scope)
  const diffEntries: readonly BlockDiffEntry[] = input.affectedScreenIds.map((screenId) => ({
    screenId,
    screenName: screenIn(next, screenId)?.name ?? screenIn(input.scope, screenId)?.name ?? screenId,
    field: `Section 1 — shared instruction block composition`,
    before: composeSection1(input.scope, screenId, DIFF_LOCALE, DIFF_LEVEL).join(' | '),
    after: composeSection1(next, screenId, DIFF_LOCALE, DIFF_LEVEL).join(' | '),
  }))

  return {
    ok: true,
    register: { ...input.register, [input.scope.workflowId]: next },
    message: input.successMessage,
    block: next.blocks.find((b) => b.id === input.blockId) ?? null,
    namedScreens: names,
    diffEntries,
  }
}

function replaceBlock(
  scope: WorkflowBlockScope,
  blockId: string,
  next: (block: InstructionBlock) => InstructionBlock,
): WorkflowBlockScope {
  return {
    ...scope,
    blocks: scope.blocks.map((block) => (block.id === blockId ? next(block) : block)),
  }
}

/** Deterministic, derived from the record it belongs to. No counter. */
export function blockIdFor(workflowId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `BLK-${workflowId}-${slug}`
}

/* ==================================================================== *
 * THE FIVE WRITES.
 * ==================================================================== */

export interface CreateBlockInput {
  readonly register: BlockRegister
  readonly workflowId: string
  readonly title: string
  readonly actor: BlockActor
  readonly writeAudit: BlockAuditWrite
  readonly decision?: StudioAccessDecision
}

/** `FUNC-STU-06-01-A-1`, L32478. */
export function createBlock(input: CreateBlockInput): BlockWriteResult {
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(input.register, denied)

  const scope = scopeOf(input.register, input.workflowId)
  if (scope === undefined) {
    return refuse(
      input.register,
      `No Workflow “${input.workflowId}” exists in this register, so there is nowhere for a block ` +
        `to live. ${CROSS_WORKFLOW}`,
    )
  }
  const title = input.title.trim()
  if (title === '') {
    return refuse(input.register, 'A block needs a title before it can be created. Nothing was written.')
  }
  const id = blockIdFor(input.workflowId, title)
  if (scope.blocks.some((block) => block.id === id)) {
    return refuse(
      input.register,
      `${scope.workflowName} already holds a block titled “${title}”. Nothing was written.`,
    )
  }

  // Zero affected screens, and that is the honest answer: a new block applies
  // to nothing yet, so it is Draft and orphaned until it is applied (L32473).
  return commit(
    {
      register: input.register,
      scope,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'create',
      blockId: id,
      sourceRefs: ['L32478'],
      affectedScreenIds: [],
      successMessage:
        `“${title}” was created in ${scope.workflowName}. It applies to no screen yet, so it is ` +
        'Draft and orphaned — which is reported at submission and does not block it (L32473).',
    },
    (s) => ({
      ...s,
      blocks: [
        ...s.blocks,
        {
          id,
          workflowId: s.workflowId,
          title,
          content: [],
          appliesToScreenIds: [],
          publishedInVersion: null,
        },
      ],
    }),
  )
}

export interface ApplyBlockInput {
  readonly register: BlockRegister
  readonly workflowId: string
  readonly blockId: string
  readonly screenId: string
  readonly actor: BlockActor
  readonly writeAudit: BlockAuditWrite
  readonly decision?: StudioAccessDecision
}

/** `FUNC-STU-06-02-A-1`, L32483. */
export function applyBlockToScreen(input: ApplyBlockInput): BlockWriteResult {
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(input.register, denied)

  const resolved = resolve(input.register, input.workflowId, input.blockId, input.screenId)
  if (typeof resolved === 'string') return refuse(input.register, resolved)
  const { scope, block, screen } = resolved
  if (screen === null) return refuse(input.register, CROSS_WORKFLOW)

  if (block.appliesToScreenIds.includes(screen.id)) {
    return refuse(
      input.register,
      `“${block.title}” already applies to ${screen.name}. Nothing was written.`,
      [screen.name],
    )
  }

  return commit(
    {
      register: input.register,
      scope,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'apply',
      blockId: block.id,
      sourceRefs: ['L32483'],
      affectedScreenIds: [screen.id],
      successMessage:
        `“${block.title}” now applies to ${screen.name}. Section 1 on that screen renders the ` +
        `block content first and “${screen.note}” second (AC-STU-068, L32560).`,
    },
    (s) =>
      replaceBlock(s, block.id, (b) => ({
        ...b,
        appliesToScreenIds: [...b.appliesToScreenIds, screen.id],
      })),
  )
}

export interface EditBlockInput {
  readonly register: BlockRegister
  readonly workflowId: string
  readonly blockId: string
  readonly locale: Locale
  readonly level: DifficultyLevel
  readonly text: string
  readonly actor: BlockActor
  readonly writeAudit: BlockAuditWrite
  readonly decision?: StudioAccessDecision
}

/**
 * `FUNC-STU-06-01-A-2`, L32480 — *"Edit a block so the change propagates to
 * every applying screen."*
 *
 * WITHIN THE DRAFT, and the result says so. `publishedInVersion` is cleared
 * because the edit lands in a NEW DRAFT (L32500); the version that is on the
 * floor is the one that was published, and it is untouched by this. There is
 * no argument to this function, and no field on `BlockRegister`, that could
 * reach a pinned package.
 */
export function editBlock(input: EditBlockInput): BlockWriteResult {
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(input.register, denied)

  const resolved = resolve(input.register, input.workflowId, input.blockId, null)
  if (typeof resolved === 'string') return refuse(input.register, resolved)
  const { scope, block } = resolved

  const affected = block.appliesToScreenIds
  const names = applyingScreens(scope, block.id).map((screen) => screen.name)

  return commit(
    {
      register: input.register,
      scope,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'edit',
      blockId: block.id,
      sourceRefs: ['L32480', 'L32500', 'AC-STU-067 L32559'],
      affectedScreenIds: affected,
      successMessage:
        `“${block.title}” was edited. ${affected.length} screen${affected.length === 1 ? '' : 's'} ` +
        `carry the change within this draft${names.length === 0 ? '' : ` — ${names.join(', ')}`}, ` +
        `and the reviewer sees ${affected.length} changed screen${affected.length === 1 ? '' : 's'} ` +
        `rather than one changed block (L32548). ${PROPAGATION_NOTICE}`,
    },
    (s) =>
      replaceBlock(s, block.id, (b) => ({
        ...b,
        publishedInVersion: null,
        content: [
          ...b.content.filter((c) => !(c.locale === input.locale && c.level === input.level)),
          { locale: input.locale, level: input.level, text: input.text },
        ],
      })),
  )
}

export interface RemoveBlockInput {
  readonly register: BlockRegister
  readonly workflowId: string
  readonly blockId: string
  readonly screenId: string
  readonly actor: BlockActor
  readonly writeAudit: BlockAuditWrite
  readonly decision?: StudioAccessDecision
}

/**
 * `FUNC-STU-06-02-A-2`, L32484 — *"Remove a block from a screen, leaving the
 * screen-specific note intact."* The note lives on the SCREEN and is never
 * touched by this, which is why it survives rather than being restored.
 */
export function removeBlockFromScreen(input: RemoveBlockInput): BlockWriteResult {
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(input.register, denied)

  const resolved = resolve(input.register, input.workflowId, input.blockId, input.screenId)
  if (typeof resolved === 'string') return refuse(input.register, resolved)
  const { scope, block, screen } = resolved
  if (screen === null) return refuse(input.register, CROSS_WORKFLOW)

  if (!block.appliesToScreenIds.includes(screen.id)) {
    return refuse(
      input.register,
      `“${block.title}” does not apply to ${screen.name}, so there is nothing to remove.`,
      [screen.name],
    )
  }

  return commit(
    {
      register: input.register,
      scope,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'remove',
      blockId: block.id,
      sourceRefs: ['L32489'],
      affectedScreenIds: [screen.id],
      successMessage:
        `“${block.title}” was removed from ${screen.name}. That screen’s own note, ` +
        `“${screen.note}”, is intact (L32489).`,
    },
    (s) =>
      replaceBlock(s, block.id, (b) => ({
        ...b,
        appliesToScreenIds: b.appliesToScreenIds.filter((id) => id !== screen.id),
      })),
  )
}

export interface DeleteBlockInput {
  readonly register: BlockRegister
  readonly workflowId: string
  readonly blockId: string
  readonly actor: BlockActor
  readonly writeAudit: BlockAuditWrite
  readonly decision?: StudioAccessDecision
}

/**
 * `AC-STU-069`, L32561 — the refusal, and the SAME `deleteRefusal` the view's
 * delete control reads. One rule, two callers, so a disabled control and a
 * refused write can never disagree about which screens apply a block.
 */
export function deleteBlock(input: DeleteBlockInput): BlockWriteResult {
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(input.register, denied)

  const resolved = resolve(input.register, input.workflowId, input.blockId, null)
  if (typeof resolved === 'string') return refuse(input.register, resolved)
  const { scope, block } = resolved

  const reason = deleteRefusal(scope, block.id)
  if (reason !== null) {
    return refuse(
      input.register,
      `${reason} Nothing was written.`,
      applyingScreens(scope, block.id).map((screen) => screen.name),
    )
  }

  return commit(
    {
      register: input.register,
      scope,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'delete',
      blockId: block.id,
      sourceRefs: ['L32561', 'L8651'],
      affectedScreenIds: [],
      successMessage: `“${block.title}” applied to no screen and was deleted from this draft.`,
    },
    (s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== block.id) }),
  )
}

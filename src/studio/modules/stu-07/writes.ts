import type { TenantId } from '@/domain/ids'
import { permitsAction } from '@/policy/decision'
import type { StudioAccessDecision } from '@/studio/access/evaluate'
import {
  ESCALATION_RECIPIENT_ROLES,
  NOTIFICATION_CHANNELS,
  SLOT_LIBRARY,
  isEscalationRecipientRole,
  isInForce,
  isNotificationChannel,
  itemById,
  reuseImpact,
  screenById,
  stepRefusalReason,
  type ChecklistStep,
  type CoachingAssetItem,
  type LibraryId,
  type LibraryItem,
  type LibraryRegister,
  type LibraryWriteAction,
  type PointerSlot,
  type ReuseImpact,
  type RoutingRule,
} from './libraries'

/**
 * EVERY WRITE `MOD-STU-07` PERFORMS, AND THE ONE AUDIT PATH THEY ALL ROUTE
 * THROUGH.
 *
 * THREE THINGS IN ONE FIXED ORDER, on every write in this file:
 *
 *   1. DOMAIN REFUSALS. The evaluator's answer for THIS control, then the
 *      rules that belong to the act itself. The audit sink is not reached by
 *      any of them — a refused action is not an action, and appending an
 *      entry for one would put a write in the log that never happened. The
 *      one exception is stated by the source, not chosen here: `TEST-STU-080`
 *      requires that an attempt to name an individual be refused AND
 *      audited, so that refusal alone appends `refused-named-individual`.
 *   2. THE AUDIT APPEND — after the refusals and BEFORE the mutation.
 *   3. THE MUTATION.
 *
 * WHY THE ORDER MATTERS, AND WHAT IT COSTS TO GET WRONG. This build has
 * shipped an audit path wired to one of four write handlers — and that one
 * the only handler that mutated nothing, so the contract was demonstrated
 * where it cost nothing. Here there is exactly ONE `commit`, every write
 * calls it, and the covering test proves each write mutates something
 * OBSERVABLE on the accepting sink before proving it mutates nothing on the
 * failing one. An audit failure fails the action with it: nothing is left
 * half-applied and nothing is queued for later, because this surface never
 * queues a write (D4).
 *
 * THE REGISTER IS RETURNED, NEVER MUTATED. On every refusal the returned
 * register is the SAME OBJECT that came in, so a caller comparing by
 * identity can see that nothing happened.
 *
 * DETERMINISM. Every generated identifier is derived from the record it
 * belongs to. No clock, no counter, no random source.
 */

export interface LibraryActor {
  readonly identityId: string
  readonly displayName: string
  readonly tenant: TenantId
}

export interface LibraryAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly action: LibraryWriteAction
  readonly library: LibraryId
  readonly itemId: string
  readonly tenant: TenantId
  readonly sourceRefs: readonly string[]
}

export type LibraryAuditWrite = (
  entry: LibraryAuditEntry,
) => { ok: true } | { ok: false; reason: string }

export interface LibraryWriteResult {
  readonly ok: boolean
  /** The NEW register on success; the ORIGINAL, untouched, on every refusal. */
  readonly register: LibraryRegister
  readonly message: string
  /**
   * The referencing screens this result named, by name. Empty where the act
   * named none. A refusal that names nothing is the defect `AC-STU-077`
   * exists to prevent, so this is the field a screen renders.
   */
  readonly namedScreens: readonly string[]
}

const AUDIT_REFS = ['L32753', 'L34657'] as const

function refuse(
  register: LibraryRegister,
  message: string,
  namedScreens: readonly string[] = [],
): LibraryWriteResult {
  return { ok: false, register, message, namedScreens }
}

/* ==================================================================== *
 * THE ONE AUDIT PATH.
 * ==================================================================== */

interface CommitInput {
  readonly register: LibraryRegister
  readonly actor: LibraryActor
  readonly writeAudit: LibraryAuditWrite
  readonly action: LibraryWriteAction
  readonly library: LibraryId
  readonly itemId: string
  readonly sourceRefs: readonly string[]
  readonly namedScreens?: readonly string[]
}

function commit(
  input: CommitInput,
  apply: (register: LibraryRegister) => LibraryRegister,
  successMessage: string,
): LibraryWriteResult {
  const named = input.namedScreens ?? []
  const audit = input.writeAudit({
    actorIdentityId: input.actor.identityId,
    action: input.action,
    library: input.library,
    itemId: input.itemId,
    tenant: input.actor.tenant,
    sourceRefs: [...input.sourceRefs, ...AUDIT_REFS],
  })
  if (!audit.ok) {
    return refuse(
      input.register,
      `The audit write failed, so the action did not happen: ${audit.reason}. ` +
        `${input.itemId} is unchanged, nothing is left half-applied, and nothing was queued for ` +
        'later — the audit entry commits in the same transaction as the action, so a failed audit ' +
        'fails the action with it.',
      named,
    )
  }
  return { ok: true, register: apply(input.register), message: successMessage, namedScreens: named }
}

function replaceItem(
  register: LibraryRegister,
  itemId: string,
  next: (item: LibraryItem) => LibraryItem,
): LibraryRegister {
  return {
    ...register,
    items: register.items.map((item) => (item.id === itemId ? next(item) : item)),
  }
}

/** The evaluator's answer for one control, never a role list, never re-derived. */
function authorisationRefusal(decision: StudioAccessDecision): string | null {
  if (permitsAction(decision.decision)) return null
  return `Refused before anything was written: ${decision.reason} Nothing was written, and no audit entry was appended, because a refused action is not an action.`
}

/* ==================================================================== *
 * REUSE IMPACT, SHOWN BEFORE THE EDIT IS MADE.
 * ==================================================================== */

/**
 * THE HAZARD THIS GUARD EXISTS FOR. "Updating the block updates every screen
 * that uses it" is the point of the feature. It is also how an author
 * changes eleven screens while looking at one. So an edit carries the impact
 * the author WAS SHOWN, and is refused where that no longer matches the
 * register — which makes "shown before it is made" a domain rule rather than
 * a habit of one component.
 *
 * Compared as SETS of screen ids, in both directions. A one-directional
 * check passes when the live impact has grown, which is the direction that
 * matters: a screen added since the author opened the item is exactly the
 * screen they have not seen.
 */
function impactRefusal(register: LibraryRegister, itemId: string, shown: ReuseImpact): string | null {
  const live = reuseImpact(register, itemId)
  const unseen = live.screenIds.filter((id) => !shown.screenIds.includes(id))
  const stale = shown.screenIds.filter((id) => !live.screenIds.includes(id))
  if (unseen.length === 0 && stale.length === 0) return null
  const name = (id: string): string => screenById(register, id)?.name ?? id
  const parts: string[] = []
  if (unseen.length > 0) {
    parts.push(
      `it would also reach ${unseen.map(name).join(', ')}, which was not on the impact you were shown`,
    )
  }
  if (stale.length > 0) {
    parts.push(`${stale.map(name).join(', ')} no longer references this item`)
  }
  return (
    `Refused: the reference list has moved since this edit was prepared — ${parts.join('; ')}. ` +
    'A library edit propagates to every screen that references the item (AC-STU-071, L32763), so ' +
    'the change is not made against an impact that is out of date. Re-open the item to see the ' +
    'current reference list. Nothing was written.'
  )
}

/* ==================================================================== *
 * IMMUTABILITY OF PUBLISHED CONTENT.
 * ==================================================================== */

/**
 * A correction to content that is IN FORCE is a LINKED NEW RECORD, never an
 * edit of the original.
 *
 * The source grants no in-place edit of published content. `FUNC-STU-07-04-B-1`
 * (L32656) states the consequence directly: a library edit waiting on review
 * *"does not block any Workflow, because the prior published item remains in
 * force"* — which is only true if the published record still exists,
 * unchanged, and every pointer still resolves to it. `DEC-LIBREV-001` leaves
 * the SCOPE of that review open and this build treats library edits as
 * passing the full chain; what it does not leave open is whether the
 * published bytes move, and they do not.
 *
 * The successor's identifier is derived from the record it supersedes, so it
 * is deterministic and so the chain is readable from the id alone.
 */
function successorId(item: LibraryItem): string {
  return `${item.id}-V${item.version + 1}`
}

function successorOf(item: LibraryItem, change: LibraryChange): LibraryItem {
  const base = {
    id: successorId(item),
    name: change.name ?? item.name,
    version: item.version + 1,
    supersedes: item.id,
    supersededBy: null,
  }
  if (item.library === 'coaching-corpus') {
    // A revised asset re-enters curation: only approved content enters the
    // corpus, so the successor is not carried in on the original's approval.
    return { ...item, ...base, assetState: 'Uploaded', approved: false, indexed: false }
  }
  if (item.library === 'containment-checklists') {
    return { ...item, ...base, state: 'Draft', steps: change.steps ?? item.steps }
  }
  return { ...item, ...base, state: 'Draft', rules: change.rules ?? item.rules }
}

function editedInPlace(item: LibraryItem, change: LibraryChange): LibraryItem {
  const base = { name: change.name ?? item.name }
  if (item.library === 'coaching-corpus') return { ...item, ...base }
  if (item.library === 'containment-checklists') {
    return { ...item, ...base, steps: change.steps ?? item.steps }
  }
  return { ...item, ...base, rules: change.rules ?? item.rules }
}

export interface LibraryChange {
  readonly name?: string
  readonly steps?: readonly ChecklistStep[]
  readonly rules?: readonly RoutingRule[]
}

/* ==================================================================== *
 * CREATE — row 1, L32628.
 * ==================================================================== */

export type LibraryDraft =
  | {
      readonly library: 'containment-checklists'
      readonly name: string
      readonly severityBands: readonly string[]
      readonly serviceTypeTag: string | null
      readonly steps: readonly ChecklistStep[]
    }
  | {
      readonly library: 'coaching-corpus'
      readonly name: string
      readonly locale: CoachingAssetItem['locale']
      readonly mediaKind: CoachingAssetItem['mediaKind']
      readonly screenTag: string
      readonly classificationTag: string
      readonly curatedDefault: boolean
      readonly containsIdentifiableWorkers: boolean
    }
  | {
      readonly library: 'escalation-routing'
      readonly name: string
      readonly rules: readonly RoutingRule[]
    }

const ID_PREFIX = {
  'containment-checklists': 'CHK',
  'coaching-corpus': 'AST',
  'escalation-routing': 'ROU',
} as const satisfies Readonly<Record<LibraryId, string>>

function draftId(draft: LibraryDraft): string {
  const slug = draft.name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${ID_PREFIX[draft.library]}-${slug}`
}

export interface CreateLibraryItemInput {
  readonly register: LibraryRegister
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
  readonly draft: LibraryDraft
}

export function createLibraryItem(input: CreateLibraryItemInput): LibraryWriteResult {
  const { register, draft } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const id = draftId(draft)
  if (itemById(register, id) !== undefined) {
    return refuse(
      register,
      `An item already exists at ${id} in this library. Nothing was written, because two items ` +
        'sharing an identifier would make every pointer at it ambiguous.',
    )
  }

  if (draft.library === 'containment-checklists') {
    const stepRefusal = draft.steps.map(stepRefusalReason).find((r) => r !== null)
    if (stepRefusal !== undefined && stepRefusal !== null) return refuse(register, stepRefusal)
  }

  const created = newItem(id, draft)
  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'create',
      library: draft.library,
      itemId: id,
      sourceRefs: ['L32628'],
    },
    (r) => ({ ...r, items: [...r.items, created] }),
    `Created ${draft.name} (${id}) as a Draft, with its audit entry in the same transaction. No ` +
      'screen references it yet, and nothing reaches the floor until it is published.',
  )
}

function newItem(id: string, draft: LibraryDraft): LibraryItem {
  const base = { id, name: draft.name, version: 1, supersedes: null, supersededBy: null }
  if (draft.library === 'containment-checklists') {
    return {
      ...base,
      library: 'containment-checklists',
      state: 'Draft',
      severityBands: draft.severityBands,
      serviceTypeTag: draft.serviceTypeTag,
      steps: draft.steps,
    }
  }
  if (draft.library === 'coaching-corpus') {
    // Uploaded, never Approved: "only approved content enters the corpus"
    // (L32599) and approval is a separate, audited act (row 6, L32633).
    return {
      ...base,
      library: 'coaching-corpus',
      assetState: 'Uploaded',
      approved: false,
      indexed: false,
      locale: draft.locale,
      mediaKind: draft.mediaKind,
      screenTag: draft.screenTag,
      classificationTag: draft.classificationTag,
      curatedDefault: draft.curatedDefault,
      containsIdentifiableWorkers: draft.containsIdentifiableWorkers,
      resolutionRate: null,
    }
  }
  return { ...base, library: 'escalation-routing', state: 'Draft', rules: draft.rules }
}

/* ==================================================================== *
 * EDIT — row 2, L32629.
 * ==================================================================== */

export interface EditLibraryItemInput {
  readonly register: LibraryRegister
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
  /** The impact the author was shown. See `impactRefusal`. */
  readonly shownImpact: ReuseImpact
  readonly change: LibraryChange
}

export function editLibraryItem(input: EditLibraryItemInput): LibraryWriteResult {
  const { register, itemId } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const item = itemById(register, itemId)
  if (item === undefined) {
    return refuse(register, `No item is registered at ${itemId}, so nothing was written.`)
  }

  if (input.change.steps !== undefined) {
    const stepRefusal = input.change.steps.map(stepRefusalReason).find((r) => r !== null)
    if (stepRefusal !== undefined && stepRefusal !== null) return refuse(register, stepRefusal)
  }

  const impact = reuseImpact(register, itemId)
  const mismatched = impactRefusal(register, itemId, input.shownImpact)
  if (mismatched !== null) return refuse(register, mismatched, impact.screenNames)

  const inForce = isInForce(item)
  const successor = inForce ? successorOf(item, input.change) : null

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'edit',
      library: item.library,
      itemId,
      sourceRefs: ['L32629', 'DEC-LIBREV-001 L32622'],
      namedScreens: impact.screenNames,
    },
    (r) =>
      successor === null
        ? replaceItem(r, itemId, (current) => editedInPlace(current, input.change))
        : { ...r, items: [...r.items, successor] },
    successor === null
      ? `Edited ${item.name} in place. It is not in force on the floor, so no review stands ` +
          `between the edit and its effect. ${impact.screenCount} screen(s) and ` +
          `${impact.workflowCount} Workflow(s) reference it and now show the updated version in ` +
          `the Studio: ${impact.screenNames.join(', ') || 'none yet'}.`
      : `${item.name} is in force on the floor, so the correction was written as a LINKED NEW ` +
          `RECORD (${successor.id}), not as an edit of the original. The published item is ` +
          'unchanged and remains in force on every screen that references it until the edit ' +
          'passes review — DEC-LIBREV-001 leaves the scope of that review open and this build ' +
          'treats library edits as passing the full chain, recording the divergence. The edit ' +
          `will reach ${impact.screenCount} screen(s) across ${impact.workflowCount} Workflow(s): ` +
          `${impact.screenNames.join(', ') || 'none yet'}.`,
  )
}

/* ==================================================================== *
 * ARCHIVE — row 3, L32630, and `AC-STU-077` L32769.
 * ==================================================================== */

export interface ArchiveLibraryItemInput {
  readonly register: LibraryRegister
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
}

export function archiveLibraryItem(input: ArchiveLibraryItemInput): LibraryWriteResult {
  const { register, itemId } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const item = itemById(register, itemId)
  if (item === undefined) {
    return refuse(register, `No item is registered at ${itemId}, so nothing was written.`)
  }
  if (item.library === 'coaching-corpus') {
    return refuse(
      register,
      `${item.name} is a coaching asset. A coaching asset is RETIRED, not archived — the corpus ` +
        'carries its own five states (L32647) and retirement is row 7 of this module’s matrix. ' +
        'Nothing was written.',
    )
  }
  if (item.state === 'Archived') {
    return refuse(
      register,
      `${item.name} is already Archived. Nothing was written, and no audit entry was appended for ` +
        'an action that would change nothing.',
    )
  }

  // THE REFUSAL THAT NAMES. Read off the live register, never a stored list:
  // a message assembled from anything else stops being true the moment a
  // pointer moves, and this message is the only thing standing between the
  // author and a screen with no containment or no routing.
  const impact = reuseImpact(register, itemId)
  if (impact.screenCount > 0) {
    return refuse(
      register,
      `Refused: ${item.name} cannot be archived while ${impact.screenCount} screen(s) still ` +
        `reference it — ${impact.screenNames.join(', ')} (in ${impact.workflowNames.join(', ')}). ` +
        'A dangling pointer would leave a screen with no containment or no routing, so the ' +
        'archival is refused and the referencing screens are named (AC-STU-077, L32769). Repoint ' +
        'each screen first. Nothing was written.',
      impact.screenNames,
    )
  }

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'archive',
      library: item.library,
      itemId,
      sourceRefs: ['L32630', 'AC-STU-077 L32769'],
    },
    (r) =>
      replaceItem(r, itemId, (current) =>
        current.library === 'coaching-corpus' ? current : { ...current, state: 'Archived' },
      ),
    `Archived ${item.name}. No screen referenced it, so no pointer was left dangling.`,
  )
}

/* ==================================================================== *
 * APPROVE and RETIRE — rows 6 and 7, L32633 and L32634.
 * ==================================================================== */

interface AssetWriteInput {
  readonly register: LibraryRegister
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
}

function coachingAsset(
  register: LibraryRegister,
  itemId: string,
): CoachingAssetItem | { readonly missing: string } {
  const item = itemById(register, itemId)
  if (item === undefined) return { missing: `No item is registered at ${itemId}.` }
  if (item.library !== 'coaching-corpus') {
    return { missing: `${item.name} is not a coaching asset, so this act does not apply to it.` }
  }
  return item
}

export function approveCoachingAsset(input: AssetWriteInput): LibraryWriteResult {
  const { register, itemId } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const asset = coachingAsset(register, itemId)
  if ('missing' in asset) return refuse(register, `${asset.missing} Nothing was written.`)
  if (asset.assetState !== 'Uploaded') {
    return refuse(
      register,
      `${asset.name} is ${asset.assetState}, not Uploaded, so there is nothing to approve. ` +
        'Nothing was written.',
    )
  }

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'approve',
      library: 'coaching-corpus',
      itemId,
      sourceRefs: ['L32633', 'AC-STU-072 L32764'],
    },
    (r) =>
      replaceItem(r, itemId, (current) =>
        current.library === 'coaching-corpus'
          ? { ...current, assetState: 'Approved', approved: true }
          : current,
      ),
    `Approved ${asset.name} into the corpus. It is Approved and not yet Indexed, so it is ` +
      'retrievable by metadata filter only and the screen’s curated default carries coaching ' +
      'until indexing completes (L32647).',
  )
}

export function retireCoachingAsset(input: AssetWriteInput): LibraryWriteResult {
  const { register, itemId } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const asset = coachingAsset(register, itemId)
  if ('missing' in asset) return refuse(register, `${asset.missing} Nothing was written.`)
  if (asset.assetState !== 'Flagged for review') {
    return refuse(
      register,
      `${asset.name} is ${asset.assetState}. Row 7 of this module’s matrix is “Retire a FLAGGED ` +
        'coaching asset” (L32634): an asset is flagged automatically when it consistently fails ' +
        'to resolve difficulties, and the Quality Manager then reviews or retires it. Nothing was ' +
        'written.',
    )
  }

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'retire',
      library: 'coaching-corpus',
      itemId,
      sourceRefs: ['L32634'],
    },
    (r) =>
      replaceItem(r, itemId, (current) =>
        current.library === 'coaching-corpus'
          ? { ...current, assetState: 'Retired', approved: false, indexed: false }
          : current,
      ),
    `Retired ${asset.name}. No agent may retire an asset — this was the Quality Manager’s ` +
      'decision and it is recorded against that identity.',
  )
}

/* ==================================================================== *
 * PROPOSE — row 4, L32631. The grant-holder's own alternative.
 * ==================================================================== */

export interface ProposeLibraryChangeInput {
  readonly register: LibraryRegister
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
  readonly proposal: string
}

export function proposeLibraryChange(input: ProposeLibraryChangeInput): LibraryWriteResult {
  const { register, itemId } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const item = itemById(register, itemId)
  if (item === undefined) {
    return refuse(register, `No item is registered at ${itemId}, so nothing was written.`)
  }

  const id = `PROP-${itemId}-${register.proposals.filter((p) => p.itemId === itemId).length + 1}`
  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'propose',
      library: item.library,
      itemId,
      sourceRefs: ['L32631'],
    },
    (r) => ({
      ...r,
      proposals: [
        ...r.proposals,
        {
          id,
          itemId,
          proposedByIdentityId: input.actor.identityId,
          summary: input.proposal,
        },
      ],
    }),
    `Proposed a change to ${item.name} through the approval chain (${id}). The item itself is ` +
      'unchanged: a proposal is a request for the Quality Manager to act, not an act. The Quality ' +
      'Manager is notified in-app and by email (L32747).',
  )
}

/* ==================================================================== *
 * THE ROUTING RULE — rows 8 and 9 enforced at the write, because taking a
 * control off the screen does not stop anyone.
 * ==================================================================== */

/**
 * The rule as it ARRIVES, before validation. Roles and channels are plain
 * strings here on purpose: `AC-STU-075` (L32767) states that *"no user
 * interface or application programming interface path permits naming an
 * individual"*, and a refusal that exists only in the type system is not a
 * path refusing anything — it is a compiler declining to describe one.
 */
export interface SubmittedRoutingRule {
  readonly severityBand: string
  readonly recipientRoles: readonly string[]
  readonly channels: readonly string[]
  readonly acknowledgementRequired: boolean
  readonly timeoutMinutes: number
  readonly fallbackRecipientRoles: readonly string[]
  readonly dedupeWindowMinutes: number
}

export interface SetRoutingRuleInput {
  readonly register: LibraryRegister
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
  readonly shownImpact: ReuseImpact
  readonly rule: SubmittedRoutingRule
}

export function setRoutingRule(input: SetRoutingRuleInput): LibraryWriteResult {
  const { register, itemId, rule } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  const item = itemById(register, itemId)
  if (item === undefined || item.library !== 'escalation-routing') {
    return refuse(
      register,
      `No escalation routing template is registered at ${itemId}, so nothing was written.`,
    )
  }

  // ROW 8. The one refusal the source asks to be RECORDED as well as
  // refused: TEST-STU-080 wants both.
  const named = [...rule.recipientRoles, ...rule.fallbackRecipientRoles].find(
    (value) => !isEscalationRecipientRole(value),
  )
  if (named !== undefined) {
    input.writeAudit({
      actorIdentityId: input.actor.identityId,
      action: 'refused-named-individual',
      library: 'escalation-routing',
      itemId,
      tenant: input.actor.tenant,
      sourceRefs: ['L32635', 'AC-STU-075 L32767', 'TEST-STU-080 L32777', ...AUDIT_REFS],
    })
    return refuse(
      register,
      `Refused: “${named}” is not a recipient role. An escalation routing template names roles ` +
        'and never named individuals, so that routing survives staff changes and carries no ' +
        'personal data into a work package (L32612). The roles a rule may name are ' +
        `${ESCALATION_RECIPIENT_ROLES.join(', ')}. The refusal is recorded in the tenant audit ` +
        'log (TEST-STU-080). Nothing was written.',
    )
  }

  // ROW 9. Refused, and not recorded — the source asks for an entry on the
  // individual refusal and asks for none here, and inventing one would put a
  // claim in the audit log the source does not make.
  const extraChannel = rule.channels.find((value) => !isNotificationChannel(value))
  if (extraChannel !== undefined) {
    return refuse(
      register,
      `Refused: “${extraChannel}” is not a notification channel. The platform has exactly two at ` +
        `V1 — ${NOTIFICATION_CHANNELS.join(' and ')} — and other channels are outside launch ` +
        'scope (L32613, AC-STU-076 L32768). Nothing was written.',
    )
  }
  if (rule.channels.length === 0) {
    return refuse(
      register,
      'Refused: a rule that names no channel delivers nothing. Nothing was written.',
    )
  }

  const impact = reuseImpact(register, itemId)
  const mismatched = impactRefusal(register, itemId, input.shownImpact)
  if (mismatched !== null) return refuse(register, mismatched, impact.screenNames)

  const validated: RoutingRule = {
    severityBand: rule.severityBand,
    recipientRoles: rule.recipientRoles.filter(isEscalationRecipientRole),
    channels: rule.channels.filter(isNotificationChannel),
    acknowledgementRequired: rule.acknowledgementRequired,
    timeoutMinutes: rule.timeoutMinutes,
    fallbackRecipientRoles: rule.fallbackRecipientRoles.filter(isEscalationRecipientRole),
    dedupeWindowMinutes: rule.dedupeWindowMinutes,
  }
  const nextRules = [
    ...item.rules.filter((r) => r.severityBand !== rule.severityBand),
    validated,
  ]
  const inForce = isInForce(item)
  const successor = inForce ? successorOf(item, { rules: nextRules }) : null

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'set-routing-rule',
      library: 'escalation-routing',
      itemId,
      sourceRefs: ['L32612', 'L32613', 'L32614'],
      namedScreens: impact.screenNames,
    },
    (r) =>
      successor === null
        ? replaceItem(r, itemId, (current) =>
            current.library === 'escalation-routing' ? { ...current, rules: nextRules } : current,
          )
        : { ...r, items: [...r.items, successor] },
    successor === null
      ? `Set the ${rule.severityBand} rule on ${item.name}. At run time the Deviation and ` +
          'Containment Agent loads this template and executes it; it never chooses recipients, ' +
          'and roles resolve to the people on shift through the Delivery Operations Hub (L32616).'
      : `${item.name} is in force, so the rule change was written as a linked new record ` +
          `(${successor.id}). The published template is unchanged and still in force.`,
  )
}

/* ==================================================================== *
 * THE PICKER — row 5, L32632, and `AC-STU-018` L31098.
 * ==================================================================== */

export interface PickerOption {
  readonly itemId: string
  readonly name: string
}

export interface OpenLibraryPickerInput {
  readonly register: LibraryRegister
  readonly screenId: string
  readonly slot: PointerSlot
  readonly load: 'succeeds' | 'fails'
}

export interface PickerResult {
  readonly loaded: boolean
  readonly options: readonly PickerOption[]
  /** ALWAYS the register that came in. A picker writes nothing. */
  readonly register: LibraryRegister
  readonly message: string
}

/**
 * OPENING THE PICKER IS A READ. It never writes, so there is no path on
 * which a failure to load can clear anything — `AC-STU-018` (L31098) is
 * satisfied structurally rather than by a branch that remembers to preserve
 * the pointer. The existing pointer is read back into the result so the
 * screen can keep showing what it still points at while the picker is
 * unavailable.
 *
 * Only items IN FORCE are offered. A screen that could point at an archived
 * checklist is the dangling pointer `AC-STU-077` refuses one step earlier.
 */
export function openLibraryPicker(input: OpenLibraryPickerInput): PickerResult {
  const { register, screenId, slot } = input
  const current = register.pointers.find((p) => p.screenId === screenId && p.slot === slot)
  if (input.load === 'fails') {
    return {
      loaded: false,
      options: [],
      register,
      message:
        'The picker could not load its options. The existing pointer is untouched — a ' +
        'configuration section whose picker fails to load never clears an existing pointer ' +
        `(AC-STU-018, L31098) — so this screen still points at ${current?.itemId ?? 'nothing'}. ` +
        'Nothing was written and nothing was cleared.',
    }
  }
  const library = SLOT_LIBRARY[slot]
  const options = register.items
    .filter((item) => item.library === library && isInForce(item))
    .map((item) => ({ itemId: item.id, name: item.name }))
  return {
    loaded: true,
    options,
    register,
    message:
      `${options.length} item(s) in force are offered. The screen holds a POINTER, never a copy, ` +
      'so updating the item updates every screen that references it (AC-STU-071, L32763).',
  }
}

export interface SetScreenPointerInput {
  readonly register: LibraryRegister
  readonly screenId: string
  readonly slot: PointerSlot
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
}

export function setScreenPointer(input: SetScreenPointerInput): LibraryWriteResult {
  const { register, screenId, slot, itemId } = input
  const denied = authorisationRefusal(input.decision)
  if (denied !== null) return refuse(register, denied)

  if (screenById(register, screenId) === undefined) {
    return refuse(register, `No screen is registered at ${screenId}, so nothing was written.`)
  }
  const item = itemById(register, itemId)
  if (item === undefined) {
    return refuse(register, `No item is registered at ${itemId}, so nothing was written.`)
  }
  if (item.library !== SLOT_LIBRARY[slot]) {
    return refuse(
      register,
      `${item.name} belongs to the ${item.library} library and cannot fill the ${slot} slot, ` +
        `which is filled from ${SLOT_LIBRARY[slot]}. Nothing was written.`,
    )
  }
  if (!isInForce(item)) {
    return refuse(
      register,
      `${item.name} is not in force, so a screen may not point at it. Nothing was written.`,
    )
  }

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'reference',
      library: item.library,
      itemId,
      sourceRefs: ['L32632', 'AC-STU-071 L32763'],
    },
    (r) => ({
      ...r,
      pointers: [
        ...r.pointers.filter((p) => !(p.screenId === screenId && p.slot === slot)),
        { screenId, slot, itemId },
      ],
    }),
    `${screenById(register, screenId)?.name ?? screenId} now points at ${item.name}. The screen ` +
      'holds a pointer, never a copy.',
  )
}

/* ==================================================================== *
 * INDEXING — `AC-STU-072` L32764, and the seam that is not here.
 * ==================================================================== */

export interface IndexCoachingAssetInput {
  readonly register: LibraryRegister
  readonly itemId: string
  /** The seeded state of the external service. The storyboard has no network. */
  readonly indexing: 'available' | 'unavailable'
  readonly actor: LibraryActor
  readonly writeAudit: LibraryAuditWrite
}

/**
 * INDEXING NEVER CHANGES APPROVAL STATE — `AC-STU-072`, L32764, and the one
 * thing that makes this simulation honest.
 *
 * `approved` is the approval FACT and is written by exactly two functions,
 * `approveCoachingAsset` and `retireCoachingAsset`, both of which are a
 * Quality Manager's audited decision. This function does not write it on any
 * path, success or failure — *"Embeddings change how an asset is found,
 * never whether it was approved"* (L32599).
 *
 * NO DECISION IS EVALUATED HERE, and that is deliberate rather than an
 * omission: `FUNC-STU-07-02-B-1` (L32662) states the roles as *"system
 * function"*, and *"no role may add unapproved content to the index"*. There
 * is no control for it on any screen, so there is no per-control affordance
 * to ask for. The gate that matters is the approval check below, which is
 * the one this function actually enforces.
 */
export function indexCoachingAsset(input: IndexCoachingAssetInput): LibraryWriteResult {
  const { register, itemId } = input
  const asset = coachingAsset(register, itemId)
  if ('missing' in asset) return refuse(register, `${asset.missing} Nothing was written.`)

  if (!asset.approved) {
    return refuse(
      register,
      `${asset.name} is ${asset.assetState} and has not been approved, so it does not enter the ` +
        'index. Only approved content is present in the corpus and in the index (AC-STU-072, ' +
        'L32764). Nothing was written.',
    )
  }
  if (input.indexing === 'unavailable') {
    return refuse(
      register,
      `The embedding and indexing service is unavailable, so ${asset.name} stays Approved and ` +
        'not Indexed: retrievable by metadata filter only, with the screen’s curated default per ' +
        'locale carrying coaching until indexing completes (FB-STU-05, L32647). Its approval is ' +
        'untouched — indexing never changes approval state (AC-STU-072, L32764) — and it is ' +
        'counted in the indexing backlog rather than left silently unindexed.',
    )
  }

  return commit(
    {
      register,
      actor: input.actor,
      writeAudit: input.writeAudit,
      action: 'index',
      library: 'coaching-corpus',
      itemId,
      sourceRefs: ['AC-STU-072 L32764', 'L32597'],
    },
    (r) =>
      replaceItem(r, itemId, (current) =>
        current.library === 'coaching-corpus'
          ? // `approved` is NOT in this object. That absence is the acceptance
            // criterion, and it is why the covering test round-trips the
            // approval fact through both the success and the failure path.
            { ...current, assetState: 'Indexed', indexed: true }
          : current,
      ),
    `${asset.name} is now in the multimodal index and reachable by semantic ranking as well as ` +
      'by metadata filter. Its approval is unchanged: embeddings change how an asset is found, ' +
      'never whether it was approved.',
  )
}

import { permitsAction } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioAccessInput,
} from '@/studio/access/evaluate'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  affordanceFor,
  studioGrantsFor,
  studioIdentityFor,
  type CapabilityAffordance,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import {
  LIBRARY_NAMES,
  isInForce,
  itemsInLibrary,
  type LibraryId,
  type LibraryItem,
  type LibraryRegister,
} from './libraries'
import { stu07Row, type Stu07CapabilityId, type Stu07MatrixRow } from './matrix'

/**
 * `MOD-STU-07`'s rendering rule — decided ONCE and read by all three tabs.
 *
 * ### WHY THIS FILE IMPORTS `stu-18/rendering` RATHER THAN COPYING IT
 *
 * The six-token affordance rule (`allowed` and `allowedWithConditions` →
 * enabled; `readOnly` and `unavailable` → disabled carrying the CELL'S OWN
 * WORDS; `clientDecisionRequired` → both readings, not a disabled control;
 * `explicitlyProhibited` → absent) is a SURFACE rule, not a module one. A
 * second copy here is the shape this build has paid for repeatedly: a fix
 * that reaches one caller of two. So `affordanceFor`, `studioIdentityFor`
 * and `studioGrantsFor` are consumed, not forked.
 *
 * That said, `Stu18Scenario` and `affordanceFor` are named for the module
 * that first needed them and belong in a shared `src/studio/rendering.ts`.
 * Lifting them would edit a file this task does not own, so it is reported
 * rather than done.
 *
 * ### THE ONE THING THIS MODULE ADDS — THE ROUTED PROHIBITION
 *
 * `affordanceFor` maps `explicitlyProhibited` to ABSENT, which is the
 * token's rendering wherever it is categorical. `MOD-STU-07` carries the
 * surface's one case where it is not: rows 1, 2, 3, 6 and 7 prohibit the
 * Supervisor-with-grant while row 4 — Propose — allows that same Supervisor,
 * on this same screen. The prohibition is a ROUTING rule, and a control that
 * vanishes teaches nothing about where to go instead.
 *
 * `libraryAffordance` is that one extra branch, and it is CONDITIONAL ON THE
 * POINTER RESOLVING. The disabled control is rendered only where the routed
 * capability's own decision actually permits this persona. Prohibit row 4
 * and every routed cell collapses back to ABSENT — which is correct, because
 * a prohibition with nowhere to send anyone IS categorical. Nothing here
 * special-cases a persona or a row; both inputs come from the matrix.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the component it feeds only draws.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

export { SEEDED_TENANT }
export type { CapabilityAffordance }

/**
 * The reviewer-varied scenario. Consumed from `MOD-STU-18` rather than
 * re-declared — two shapes for "who is being viewed as, with which grants,
 * on which tier" is how the two screens would come to disagree.
 */
export type Stu07Scenario = Stu18Scenario

export function scenario(over: Partial<Stu07Scenario> = {}): Stu07Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every control on all three tabs
 * routes through here, PER CONTROL, over that control's own matrix row —
 * never over a module-level role list.
 */
export function decisionForRow(row: Stu07MatrixRow, s: Stu07Scenario): StudioAccessDecision {
  const input: StudioAccessInput = {
    row,
    identity: studioIdentityFor(s.persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  }
  return evaluateStudioAccess(input)
}

/**
 * The rendering for ONE control. Handed decisions; computes no permission of
 * its own.
 *
 * `routedDecision` is the decision for the capability `routedTo` names, for
 * the SAME persona. Passing it in rather than evaluating it here keeps this
 * function a pure rendering rule and keeps every access call in
 * `decisionForRow`.
 */
export function libraryAffordance(
  label: string,
  decision: StudioAccessDecision,
  routedTo: Stu07CapabilityId | null,
  routedDecision: StudioAccessDecision | null,
): CapabilityAffordance {
  if (
    decision.outcome === 'explicitlyProhibited' &&
    routedTo !== null &&
    routedDecision !== null &&
    permitsAction(routedDecision.decision)
  ) {
    return {
      kind: 'disabled',
      label,
      reason:
        `${decision.reason} ${CONTROL_LABELS[routedTo]} is enabled beside this one and is the ` +
        'route open to you: a proposal goes through the approval chain to the Quality Manager, ' +
        'who owns the Content Libraries (L32628, L32631).',
    }
  }
  return affordanceFor(label, decision)
}

/* ==================================================================== *
 * THE CONTROLS EACH TAB OFFERS.
 * ==================================================================== */

/**
 * DO NOT INVENT A CONTROL. Every entry below is one of the ten rows of the
 * source's own table, and the two rows that are refused in all eight columns
 * — naming an individual (row 8) and adding a channel (row 9) — appear on NO
 * tab. They are categorical refusals with no alternative, so the screen
 * states the rule in prose and offers nothing to click. A disabled control
 * for either would imply a condition that could one day become true.
 *
 * `read-published-library-content` (row 10) is not a control either: it is
 * what the tab IS, and scope is enforced in what the screen READS rather
 * than in what it draws.
 */
const TAB_CAPABILITIES = {
  'containment-checklists': [
    'create-a-library-item',
    'edit-a-library-item',
    'archive-a-library-item',
    'propose-a-change',
  ],
  'coaching-corpus': [
    'create-a-library-item',
    'edit-a-library-item',
    'approve-a-coaching-asset',
    'retire-a-flagged-coaching-asset',
    'archive-a-library-item',
    'propose-a-change',
  ],
  'escalation-routing': [
    'create-a-library-item',
    'edit-a-library-item',
    'archive-a-library-item',
    'propose-a-change',
  ],
} as const satisfies Readonly<Record<LibraryId, readonly Stu07CapabilityId[]>>

const CONTROL_LABELS = {
  'create-a-library-item': 'Create',
  'edit-a-library-item': 'Edit',
  'archive-a-library-item': 'Archive',
  'propose-a-change': 'Propose a change',
  'reference-a-library-item-from-a-screen-picker': 'Reference from a screen picker',
  'approve-a-coaching-asset': 'Approve into the corpus',
  'retire-a-flagged-coaching-asset': 'Retire flagged asset',
  'name-an-individual-as-an-escalation-recipient': 'Name an individual',
  'add-a-notification-channel': 'Add a channel',
  'read-published-library-content': 'Read published content',
} as const satisfies Readonly<Record<Stu07CapabilityId, string>>

/** Per tab, so "Create" says what it creates rather than making the reader guess. */
const CREATE_LABELS = {
  'containment-checklists': 'Create checklist',
  'coaching-corpus': 'Upload coaching asset',
  'escalation-routing': 'Create routing template',
} as const satisfies Readonly<Record<LibraryId, string>>

export interface LibraryControl {
  readonly id: Stu07CapabilityId
  readonly label: string
  readonly affordance: CapabilityAffordance
  readonly sourceRefs: readonly string[]
}

/**
 * The controls one tab offers this persona, each with its own decision.
 *
 * The list is the SAME for every persona — what varies is each control's
 * affordance. That is the difference between enforcing scope in what a
 * screen reads and enforcing it in what a screen draws: a persona with
 * nothing enabled still gets a row per capability saying why, rather than a
 * shorter screen that quietly omits the question.
 */
export function libraryControls(s: Stu07Scenario, library: LibraryId): readonly LibraryControl[] {
  return TAB_CAPABILITIES[library].map((id) => {
    const row = stu07Row(id)
    const decision = decisionForRow(row, s)
    const routedTo = row.routedTo[s.persona]
    const routedDecision = routedTo === null ? null : decisionForRow(stu07Row(routedTo), s)
    const label = id === 'create-a-library-item' ? CREATE_LABELS[library] : CONTROL_LABELS[id]
    return {
      id,
      label,
      affordance: libraryAffordance(label, decision, routedTo, routedDecision),
      sourceRefs: row.sourceRefs,
    }
  })
}

/* ==================================================================== *
 * SCOPE IS ENFORCED IN WHAT THE SCREEN READS.
 * ==================================================================== */

export interface ReadableItems {
  readonly items: readonly LibraryItem[]
  /** How many the register holds that this view may not read. */
  readonly withheldCount: number
  /** Never blank — AC-STU-155 (L34672) requires the missing condition named. */
  readonly withheldReason: string | null
}

/**
 * WHICH ITEMS THIS VIEW MAY READ — the filter applied to the DATA, not to the
 * markup.
 *
 * Slice 4's seventh defect shape is scope enforced in what a screen DREW
 * rather than in what it READ, and the difference is not cosmetic: a list
 * that loads every draft and then hides some of them has already put them in
 * the response. Row 10 of this module's matrix is `Read PUBLISHED library
 * content`, and the consolidated matrix at L34543 gives the without-grant
 * Supervisor, the Plant Manager persona and the Tenant Admin
 * `Explicitly prohibited` on "Read drafts and in-review versions". So a
 * `readOnly` cell here reads exactly what is in force, and nothing else ever
 * reaches the component.
 *
 * The two columns the shell handles are not re-handled here: the Worker
 * (`explicitlyProhibited`) and the Read-only Auditor (`clientDecisionRequired`
 * under `DEC-AUDSTU-001`) never reach a module route at all. They are still
 * answered — the same rule, fail-closed, rather than an assumption that the
 * shell got there first.
 */
export function readableItems(
  s: Stu07Scenario,
  register: LibraryRegister,
  library: LibraryId,
): ReadableItems {
  const all = itemsInLibrary(register, library)
  const decision = decisionForRow(stu07Row('read-published-library-content'), s)
  switch (decision.outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return { items: all, withheldCount: 0, withheldReason: null }
    case 'readOnly': {
      const items = all.filter(isInForce)
      return {
        items,
        withheldCount: all.length - items.length,
        withheldReason:
          `${decision.reason} — this view reads published library content only. Drafts and ` +
          'in-review versions are Explicitly prohibited to it (L34543), so they are not read ' +
          'here rather than read and then hidden.',
      }
    }
    default:
      return {
        items: [],
        withheldCount: all.length,
        withheldReason: `${decision.reason} Nothing in this library is read from this view.`,
      }
  }
}

export { LIBRARY_NAMES }

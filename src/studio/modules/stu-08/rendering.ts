import { evaluateStudioAccess, type StudioAccessDecision } from '@/studio/access/evaluate'
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
import { stu08Row, type Stu08RowId } from './matrix'
import {
  remainingStorageMb,
  trainingService,
  type TrainingItem,
  type TrainingRegister,
} from './training'

/**
 * `MOD-STU-08`'s rendering rule, decided ONCE and read by the screen.
 *
 * WHY THIS IMPORTS `stu-18/rendering` RATHER THAN COPYING IT. The six-token
 * affordance rule (`allowed`/`allowedWithConditions` → enabled;
 * `readOnly`/`unavailable` → disabled carrying the CELL'S OWN WORDS;
 * `clientDecisionRequired` → the open decision; `explicitlyProhibited` →
 * ABSENT) is a SURFACE rule, not a module one, and `MOD-STU-05`,
 * `MOD-STU-07`, `MOD-STU-09` and `MOD-STU-17` already read it from there. A
 * second copy is the shape this build has paid for repeatedly.
 *
 * EVERY REFUSAL ON THIS SCREEN IS AN ABSENCE, AND THAT IS CHECKABLE. A cell
 * renders disabled only where its `routedTo` names a capability this persona
 * actually holds; no cell of this card names one (see `./matrix.ts`), so
 * `Explicitly prohibited` renders as a note where a control would be and
 * never as a disabled button implying a condition that could become true.
 *
 * THE CAPABILITY L32800 CUTS FROM SCOPE IS NOT HERE, IN ANY FORM. L32802
 * binds this build: the excluded behaviour is not "designed, proposed, or
 * implied anywhere in this chapter". So there is no control for it, no
 * DISABLED control carrying a reason, and no sentence naming it — a disabled
 * control is a promise that a capability exists and is refused here, which
 * would be a claim about the product the source does not make. Its name is
 * deliberately not written down anywhere in the tree, comments included,
 * because a comment is the easiest way for a phrase to creep back toward a
 * rendering; `tests/unit/stu-training.test.ts` holds the pattern and scans
 * for it.
 *
 * SCOPE IS ENFORCED AT THE READ, AT THE ONE JUNCTION EVERY PATH CROSSES.
 * `itemsReadableBy` is asked once and the screen draws what it returns; a
 * list is never loaded and then hidden. Every branch of the read — the full
 * read, the published-only read and the refused read — leaves through the
 * same function, so a branch added later inherits the rule by construction.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the screen it feeds only draws.
 */

export type Stu08Scenario = Stu18Scenario

export function stu08Scenario(over: Partial<Stu08Scenario> = {}): Stu08Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/**
 * THE ONE ACCESS CALL THE SCREEN MAKES, per control, over the matrix ROW.
 *
 * Stage occupancy is `null` on all three fields here and that is correct
 * rather than forgotten: this asks whether the persona holds the capability
 * AT ALL. Whether they may take it on ONE submission is separation of duties,
 * which bites inside `MOD-STU-11`'s chain where the submission's own stage
 * history is known — the screen must not answer it from a seeded guess.
 */
export function stu08Decision(id: Stu08RowId, s: Stu08Scenario): StudioAccessDecision {
  return evaluateStudioAccess({
    row: stu08Row(id),
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
  })
}

/* ==================================================================== *
 * THE CONTROLS THIS SCREEN OFFERS.
 * ==================================================================== */

export interface TrainingControl {
  readonly id: Stu08RowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  /**
   * The `trainingService` function this control invokes, or `null` where the
   * control is not drawn at all, or where the capability is one nobody holds.
   * Never a bound no-op.
   */
  readonly serviceKey: keyof typeof trainingService | null
  readonly sourceRefs: readonly string[]
}

/**
 * DO NOT INVENT A CONTROL. Every entry is one of the source's own rows.
 *
 * Row 6 ("Read published training content in the Studio") is NOT here: it is
 * what the screen IS, and `itemsReadableBy` answers it once for the whole
 * screen rather than as a button beside the list it governs — the same move
 * `MOD-STU-05`, `MOD-STU-07` and `MOD-STU-17` make.
 *
 * Row 9 IS here, and renders as an ABSENCE with the rule stated. `AC-STU-155`
 * requires an unavailable capability to be shown with its reason rather than
 * hidden, `Explicitly prohibited` carries no control anywhere, and the list is
 * the same length for every persona so a reader cannot infer a capability
 * from a shorter list.
 *
 * ROWS 7 AND 8 ARE NOT HERE AND HAVE NO CONTROL ANYWHERE. Both describe what
 * a Worker meets on the Frontline surface, not what a Studio actor may do
 * (L31515), so the screen renders each as one STATEMENT. A control for either
 * — enabled or disabled — would invent a Studio screen the source does not
 * describe. See `./matrix.ts`.
 */
const CONTROL_ROWS = [
  'author-and-upload-training-content',
  'submit-content-into-the-approval-chain',
  'review-a-submission',
  'release-and-publish',
  'archive-content',
  'have-viewing-count-as-execution-or-as-a-qualification',
] as const satisfies readonly Stu08RowId[]

const CONTROL_LABELS = {
  'author-and-upload-training-content': 'Upload training content',
  'submit-content-into-the-approval-chain': 'Submit for review',
  'review-a-submission': 'Review and advance to release',
  'release-and-publish': 'Release and publish',
  'archive-content': 'Archive',
  'read-published-training-content-in-the-studio': 'Read published training content',
  'have-viewing-count-as-execution-or-as-a-qualification':
    'Have viewing count as execution or as a qualification',
} as const satisfies Readonly<Record<Stu08RowId, string>>

/**
 * Which service function each control invokes. `null` on row 9 — the honest
 * answer rather than an omission, because there is no function for an act the
 * platform refuses to everyone, including the Quality Manager who owns the
 * module.
 */
const CONTROL_SERVICE = {
  'author-and-upload-training-content': 'upload',
  'submit-content-into-the-approval-chain': 'submit',
  'review-a-submission': 'advance',
  'release-and-publish': 'release',
  'archive-content': 'archive',
  'have-viewing-count-as-execution-or-as-a-qualification': null,
} as const satisfies Readonly<
  Record<(typeof CONTROL_ROWS)[number], keyof typeof trainingService | null>
>

export function trainingControls(s: Stu08Scenario): readonly TrainingControl[] {
  return CONTROL_ROWS.map((id) => {
    const row = stu08Row(id)
    const affordance = affordanceFor(CONTROL_LABELS[id], stu08Decision(id, s))
    return {
      id,
      label: CONTROL_LABELS[id],
      affordance,
      serviceKey: affordance.kind === 'enabled' ? CONTROL_SERVICE[id] : null,
      sourceRefs: row.sourceRefs,
    }
  })
}

/* ==================================================================== *
 * ROW 6 — SCOPE IS ENFORCED IN WHAT THE SCREEN READS.
 * ==================================================================== */

export interface ReadableTrainingItems {
  readonly items: readonly TrainingItem[]
  /** How many the register holds that this view may not read. */
  readonly withheldCount: number
  /** Never blank where something is withheld — `AC-STU-155` (L34672). */
  readonly withheldReason: string | null
}

/**
 * WHICH ITEMS THIS VIEW MAY READ — the filter applied to the DATA, not to the
 * markup, and applied at the one junction all three branches leave through.
 *
 * Slice 5's task-17 leak was read scope applied in the read on one path and
 * in the DRAW on another, so one path applied it and one did not. Here every
 * caller gets its items from this function and from nowhere else.
 *
 * Row 6 is `Read PUBLISHED training content in the Studio`, and the
 * consolidated matrix at L34543 gives the without-grant Supervisor, the Plant
 * Manager persona and the Tenant Admin `Explicitly prohibited` on "Read
 * drafts and in-review versions". So a `readOnly` cell reads exactly what is
 * in force plus the archived history L32865 keeps permanently readable, and
 * nothing else ever reaches the component.
 *
 * The Worker's refusal names the Frontline Training Library Viewer, because
 * that is the cell's own wording (L32822) and it is the one thing a Worker
 * needs to know here.
 */
const IN_FORCE_OR_HISTORICAL = ['Published', 'Archived'] as const

export function itemsReadableBy(
  s: Stu08Scenario,
  register: TrainingRegister,
): ReadableTrainingItems {
  const decision = stu08Decision('read-published-training-content-in-the-studio', s)
  const all = register.items
  switch (decision.outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return { items: all, withheldCount: 0, withheldReason: null }
    case 'readOnly': {
      const items = all.filter((item) =>
        (IN_FORCE_OR_HISTORICAL as readonly string[]).includes(item.status),
      )
      return {
        items,
        withheldCount: all.length - items.length,
        withheldReason:
          `${decision.reason} — this view reads published training content only. Drafts and ` +
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

/* ==================================================================== *
 * SB-STU-11's upload control — "states the entitlement and remaining storage".
 * ==================================================================== */

/**
 * `SB-STU-11` (L32887): "An upload control accepts long-form content and
 * states the entitlement and remaining storage."
 *
 * It STATES them. The control that raises, lowers or administers the
 * entitlement sits platform-side (L32798), so this screen renders a figure
 * and never an administration affordance — see `STORAGE_ENTITLEMENT_GAP`.
 */
export function uploadStatement(register: TrainingRegister): string {
  const remaining = remainingStorageMb(register.entitlement)
  return (
    `Training-content storage entitlement: ${register.entitlement.ceilingMb} MB for this tenant, ` +
    `${remaining} MB remaining. An upload larger than what remains is refused with the ` +
    'entitlement named.'
  )
}

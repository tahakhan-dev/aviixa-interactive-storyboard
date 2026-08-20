import type { SurfaceId } from '@/domain/surfaces'
import {
  JOURNEY_AS_OF,
  MET,
  notMet,
  versionByNumber,
  WHEEL_BOLT_DRAFT_CONTENT,
  type JourneyStepTransition,
} from './fixture'

/**
 * The twenty-two journey steps and their five-surface effects.
 *
 * The master prompt's demand is that an action's effect is visible on every
 * surface it touches, and **honestly absent on the ones it does not**. So
 * there is no blank cell here and no empty string: a surface with no effect
 * carries `kind: 'noDirectEffect'` **and a reason**, exactly as a blank
 * matrix cell is a build-blocking defect elsewhere in this build.
 *
 * Provenance, from the census's own reconciliation rule: **A** — the
 * `WF-AUT-0NN` catalogue at L53338–L53730 — is the only rendering that
 * states five-surface effects explicitly and so wins on effects; **B** — the
 * canonical sequences at L67873–L68478 — wins on state names and ordering.
 * Where the journey's ordering splits an A row across two steps (approval
 * and publication are one row in A and two steps here), B decides, and the
 * step carries a `note` saying so rather than repeating a clause that would
 * claim a device had been reached before it had.
 */

export type JourneySurfaceCode = 'DOH' | 'STU' | 'CC' | 'FL' | 'SA'

export interface JourneySurfaceRef {
  readonly code: JourneySurfaceCode
  readonly surfaceId: SurfaceId
  readonly name: string
}

export const JOURNEY_SURFACES = [
  { code: 'DOH', surfaceId: 'SURF-DOH', name: 'Delivery Operations Hub' },
  { code: 'STU', surfaceId: 'SURF-STU', name: 'Standards and Operations Studio' },
  { code: 'CC', surfaceId: 'SURF-CC', name: 'Client Command Center' },
  { code: 'FL', surfaceId: 'SURF-FL', name: 'Frontline Worker Application' },
  { code: 'SA', surfaceId: 'SURF-SA', name: 'Super Admin platform console' },
] as const satisfies readonly JourneySurfaceRef[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: every surface code appears exactly once, and every
// platform surface is represented.
type MissingFromJourneySurfaces = Exclude<
  JourneySurfaceCode,
  (typeof JOURNEY_SURFACES)[number]['code']
>
const _journeySurfacesExhaustive: MissingFromJourneySurfaces extends never ? true : never = true
void _journeySurfacesExhaustive
type MissingSurfaceId = Exclude<SurfaceId, (typeof JOURNEY_SURFACES)[number]['surfaceId']>
const _everySurfaceRepresented: MissingSurfaceId extends never ? true : never = true
void _everySurfaceRepresented

/**
 * An effect either happened on this surface or it did not. The second case
 * carries a REASON: "no direct effect" is a rendering, not an omission.
 */
export type SurfaceEffect =
  | { readonly kind: 'affected'; readonly statement: string; readonly sourceRef: string }
  | { readonly kind: 'noDirectEffect'; readonly reason: string; readonly sourceRef: string }

export type FiveSurfaceEffectRecord = { readonly [K in JourneySurfaceCode]: SurfaceEffect }

const affected = (statement: string, sourceRef: string): SurfaceEffect => ({
  kind: 'affected',
  statement,
  sourceRef,
})
const noEffect = (reason: string, sourceRef: string): SurfaceEffect => ({
  kind: 'noDirectEffect',
  reason,
  sourceRef,
})

/**
 * The one sentence a surface row renders. Never empty for either case,
 * which is what makes an empty string structurally impossible rather than
 * merely discouraged.
 */
export function effectStatement(effect: SurfaceEffect): string {
  return effect.kind === 'affected' ? effect.statement : `No direct effect — ${effect.reason}`
}

export interface JourneyStep extends JourneyStepTransition {
  readonly number: number
  readonly title: string
  /** The member workflow this step belongs to, or null where the source names none. */
  readonly wfAut: string | null
  readonly sourceRef: string
  readonly ownerModule: string
  /** The surface the ACT happens on. Step 19's act is the Hub's, not the Studio's. */
  readonly actingSurface: JourneySurfaceCode
  readonly effects: FiveSurfaceEffectRecord
  /** Where this step departs from a five-surface row, and why. */
  readonly note: string | null
}

// ---------------------------------------------------------------------------
// Reasons that recur, quoted once. Each is a per-phase surface behaviour
// paragraph from the canonical sequences.
// ---------------------------------------------------------------------------

const DOH_DRAFT_PHASE = noEffect(
  'the Hub shows no new workflow, because a draft is not a published version and the Hub links Jobs to published versions only',
  'L68070',
)
const CC_DRAFT_PHASE = noEffect(
  'it authors nothing and owns no record, and a draft is neither live state nor a decision awaiting a person',
  'L68074',
)
const FL_DRAFT_PHASE = noEffect(
  'no draft is ever delivered to a device — a reader must not be allowed to assume that authored content is available content',
  'L68076',
)
const SA_DRAFT_PHASE = noEffect(
  'the console holds the global severity catalog the author maps into and distributes it only when a version is published; a draft reaches none of that',
  'L68078',
)
const CC_CHAIN_PHASE = noEffect(
  'a workflow approval is not an in-shift decision and never appears in the Command Center gate queue',
  'L68226',
)
const FL_CHAIN_PHASE = noEffect(
  'no device receives a preview, a comment or an approval',
  'L68228',
)
const SA_CHAIN_PHASE = noEffect(
  'the console observes nothing of the content; approval-chain depth is a platform setting it holds and this act does not change it',
  'L68230',
)

const AUTHOR = 'IDN-BB-QE-01 — the quality engineer under an authoring grant'
const REVIEWER = 'IDN-BB-REV-02 — a second authoring-grant holder'
const RELEASE_AUTHORITY = 'IDN-BB-QM-ELENA — Quality Manager, tenant-default Release Authority'

const ALL_SCREENS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

export const JOURNEY_STEPS = [
  {
    number: 1,
    title: 'Open or create',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L53386, L68090',
    ownerModule: 'MOD-STU-03',
    actingSurface: 'STU',
    note: null,
    effects: {
      DOH: affected(
        'Linkage counts on every Workflow row, read live from the Hub; where they cannot be read they render "Linkage unavailable, last retrieved at" with the timestamp, never as zero.',
        'L31930',
      ),
      STU: affected('The Workflow Library — the landing view every journey starts from.', 'L31930'),
      CC: CC_DRAFT_PHASE,
      FL: FL_DRAFT_PHASE,
      SA: affected(
        'The platform taxonomy the tenant workspace inherits read-only; under DEC-TAX-002 the seeded catalogue ships empty.',
        'L5739',
      ),
    },
    requires: (s) =>
      s.draft === null ? MET : notMet('a draft already exists in this workspace'),
    produces: (s) => ({
      ...s,
      draft: {
        id: 'DRAFT-BB-0001',
        name: null,
        jobType: null,
        locales: [],
        inheritableDefaults: [],
        screenOrder: [],
        branchesDrawn: false,
        gateFailureBranchTarget: null,
        sectionsConfigured: false,
        difficultyLevels: [],
        localesComplete: [],
        validation: 'not-run',
        savedAt: null,
        previewWalkedScreens: [],
        lastDiff: null,
        basedOn: null,
      },
    }),
  },
  {
    number: 2,
    title: 'Choose taxonomy',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L53386, L5739',
    ownerModule: 'MOD-STU-03',
    actingSurface: 'STU',
    note: 'Job Type "Assembly" is tenant-created. Under DEC-TAX-002 the seeded catalogue ships empty and no starter name is named anywhere in the source (L7908), so no fixture may present one as canonical.',
    effects: {
      DOH: affected(
        'Job Type filters which Workflows can be linked to which Jobs, so the published Workflow becomes linkable to Jobs of that type.',
        'L5739, L53397',
      ),
      STU: affected('The settings panel, where the tenant-created Job Type is chosen.', 'L53397'),
      CC: CC_DRAFT_PHASE,
      FL: FL_DRAFT_PHASE,
      SA: affected(
        'The seeded Job Type catalogue, empty at version 1 under DEC-TAX-002; every entry in it is tenant-created.',
        'L5739, L2954',
      ),
    },
    requires: (s) =>
      s.draft === null
        ? notMet('no draft has been opened')
        : s.draft.jobType === null
          ? MET
          : notMet('the taxonomy is already chosen'),
    produces: (s) => ({
      ...s,
      draft: { ...s.draft!, jobType: WHEEL_BOLT_DRAFT_CONTENT.jobType },
    }),
  },
  {
    number: 3,
    title: 'Name, scope, version — four settings, exactly two inheritable defaults',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L32040, L8595',
    ownerModule: 'MOD-STU-04',
    actingSurface: 'STU',
    note: 'There is no third inheritable default. The two are the escalation routing template and the coaching trigger percentage (L32040).',
    effects: {
      DOH: affected('Job Type drives Workflow-selection filtering on Jobs.', 'L5739'),
      STU: affected(
        'The left settings panel: the four settings, and exactly two inheritable defaults, each labelled with whether it is inherited by screens.',
        'L32040',
      ),
      CC: CC_DRAFT_PHASE,
      FL: affected(
        'The inherited coaching trigger travels inside the work package, so it is the device that executes it.',
        'L5931',
      ),
      SA: affected(
        'The declared locale set; locale completeness checks block publication in an incomplete locale.',
        'L53365',
      ),
    },
    requires: (s) =>
      s.draft?.jobType == null ? notMet('the taxonomy has not been chosen') : MET,
    produces: (s) => ({
      ...s,
      draft: {
        ...s.draft!,
        name: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
        locales: WHEEL_BOLT_DRAFT_CONTENT.locales,
        inheritableDefaults: WHEEL_BOLT_DRAFT_CONTENT.inheritableDefaults,
      },
    }),
  },
  {
    number: 4,
    title: 'Add, reorder, remove screens',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L61842, L32098',
    ownerModule: 'MOD-STU-04',
    actingSurface: 'STU',
    note: null,
    effects: {
      DOH: DOH_DRAFT_PHASE,
      STU: affected(
        'The canvas in execution order, with the live structural-validation panel beside it.',
        'L61842, L32101',
      ),
      CC: CC_DRAFT_PHASE,
      FL: affected(
        'The drawn order is published as the sequence-detection reference and is evaluated on the device from the packaged sequence.',
        'L32098',
      ),
      SA: SA_DRAFT_PHASE,
    },
    requires: (s) => (s.draft?.name == null ? notMet('the Workflow has no name yet') : MET),
    produces: (s) => ({ ...s, draft: { ...s.draft!, screenOrder: [...ALL_SCREENS] } }),
  },
  {
    number: 5,
    title: 'Draw branches; accept or override the gate-failure default',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L32103',
    ownerModule: 'MOD-STU-04',
    actingSurface: 'STU',
    note: 'No role may remove the gate-failure default without supplying a replacement target (L32103).',
    effects: {
      DOH: DOH_DRAFT_PHASE,
      STU: affected(
        'The canvas branching, and the gate-failure branch target defaulting to the platform-standard deviation-capture screen.',
        'L32103',
      ),
      CC: CC_DRAFT_PHASE,
      FL: affected(
        'The platform deviation-capture form is carried in the package and opens locally, with no signal.',
        'L32103, L33848',
      ),
      SA: SA_DRAFT_PHASE,
    },
    requires: (s) =>
      (s.draft?.screenOrder.length ?? 0) === 0 ? notMet('no screens have been laid out') : MET,
    produces: (s) => ({
      ...s,
      draft: {
        ...s.draft!,
        branchesDrawn: true,
        gateFailureBranchTarget:
          'the platform-standard deviation-capture screen — the default, accepted rather than replaced',
      },
    }),
  },
  {
    number: 6,
    title: 'Configure the nine sections',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L53397, L32216',
    ownerModule: 'MOD-STU-05',
    actingSurface: 'STU',
    note: null,
    effects: {
      DOH: affected(
        'The tenant action bundles and the maintained certification list that the deviation-rules and qualification-override sections read.',
        'L53397 · derived from the census decomposition of WF-AUT-002',
      ),
      STU: affected(
        'The Builder itself: the nine configuration sections, appearing per enabled capability.',
        'L53397',
      ),
      CC: affected(
        'The deviation workspace renders the configured severity level and its action bundle.',
        'L53397',
      ),
      FL: affected('The screens, limits, and gates execute here.', 'L53397'),
      SA: affected(
        'The atom registry and capability entitlements bound what the Builder can offer.',
        'L53397',
      ),
    },
    requires: (s) => (s.draft?.branchesDrawn === true ? MET : notMet('no branches have been drawn')),
    produces: (s) => ({ ...s, draft: { ...s.draft!, sectionsConfigured: true } }),
  },
  {
    number: 7,
    title: 'Author one difficulty level; draft the other two',
    wfAut: 'WF-AUT-001',
    sourceRef: 'L53365, L68095',
    ownerModule: 'MOD-STU-09',
    actingSurface: 'STU',
    note: 'Nothing the drafting aid produces bypasses human review; all three levels enter the chain together (L68095).',
    effects: {
      DOH: affected('The worker profile field holding the level.', 'L53365'),
      STU: affected('Authoring and review of all levels.', 'L53365'),
      CC: affected(
        'No authoring; the learning read view shows coaching effectiveness.',
        'L53365',
      ),
      FL: affected(
        'Renders the selected level and falls back to authored Work Instructions when the agent-selected coaching card is unavailable offline.',
        'L53365',
      ),
      SA: affected(
        'Locale completeness checks block publication in an incomplete locale.',
        'L53365',
      ),
    },
    requires: (s) =>
      s.draft?.sectionsConfigured === true ? MET : notMet('the nine sections are not configured'),
    produces: (s) => ({
      ...s,
      draft: {
        ...s.draft!,
        difficultyLevels: WHEEL_BOLT_DRAFT_CONTENT.difficultyLevels,
        localesComplete: WHEEL_BOLT_DRAFT_CONTENT.locales,
      },
    }),
  },
  {
    number: 8,
    title: 'Validate',
    wfAut: 'WF-AUT-002',
    sourceRef: 'L53396, L32101',
    ownerModule: 'MOD-STU-04 with the S3 publish-check registry',
    actingSurface: 'STU',
    note: 'The panel READS the eleven checks; it implements only structural validity. A module implementing a sibling’s check is a defect (C4).',
    effects: {
      DOH: DOH_DRAFT_PHASE,
      STU: affected(
        'The live validation panel, reading the eleven publish checks and naming each blocking element; the terminal safe state is "draft, unsubmittable, no package generated".',
        'L53396, L48330',
      ),
      CC: CC_DRAFT_PHASE,
      FL: noEffect(
        'no draft is ever delivered to a device; the checks run at authoring time precisely because "a missing limit or mapping is a hole in the offline safety layer"',
        'L68076, L53395',
      ),
      SA: SA_DRAFT_PHASE,
    },
    requires: (s) =>
      (s.draft?.difficultyLevels.length ?? 0) === 3
        ? MET
        : notMet('all three difficulty levels must be present before validation can pass'),
    produces: (s) => ({ ...s, draft: { ...s.draft!, validation: 'passed' } }),
  },
  {
    number: 9,
    title: 'Save draft',
    wfAut: null,
    sourceRef: 'FB-STU-01 L31443–L31453, L31481',
    ownerModule: 'MOD-STU-04 under FB-STU-01',
    actingSurface: 'STU',
    note: 'Nothing on this surface queues a write. Where the connection is lost the editor holds the local buffer and states plainly that no save has been recorded (AC-STU-009).',
    effects: {
      DOH: affected(
        'The tenant audit log, which is the Hub’s — the Studio keeps no log of its own, and a reconciliation record commits "in the same transaction as the accepted revision".',
        'L31481, L30867',
      ),
      STU: affected('The saved draft and its local buffer.', 'L31443'),
      CC: CC_DRAFT_PHASE,
      FL: FL_DRAFT_PHASE,
      SA: SA_DRAFT_PHASE,
    },
    requires: (s) =>
      s.draft?.validation === 'not-run' ? notMet('validation has not run') : MET,
    produces: (s) => ({ ...s, draft: { ...s.draft!, savedAt: JOURNEY_AS_OF } }),
  },
  {
    number: 10,
    title: 'Compare versions (diff)',
    wfAut: 'WF-AUT-003',
    sourceRef: 'L53435',
    ownerModule: 'MOD-STU-12',
    actingSurface: 'STU',
    note: 'This workflow has no prior version, so the diff renders as a first publication with every screen new rather than as an empty comparison.',
    effects: {
      DOH: noEffect('Job version history is unchanged until publication', 'L53435'),
      STU: affected('Draft and diff.', 'L53435'),
      CC: noEffect('unaffected until publication', 'L53435'),
      FL: noEffect('unaffected; version pinning holds', 'L53435'),
      SA: affected('Package versioning policy applies platform-wide.', 'L53435'),
    },
    requires: (s) => (s.draft?.savedAt == null ? notMet('the draft has not been saved') : MET),
    produces: (s) => ({
      ...s,
      draft: {
        ...s.draft!,
        lastDiff: { against: s.draft!.basedOn, changedScreens: s.draft!.screenOrder.length },
      },
    }),
  },
  {
    number: 11,
    title: 'Preview',
    wfAut: 'WF-AUT-004',
    sourceRef: 'L53468',
    ownerModule: 'MOD-STU-11',
    actingSurface: 'STU',
    note: null,
    effects: {
      DOH: noEffect('nothing until publication', 'L53468'),
      STU: affected('The queue and preview.', 'L53468'),
      CC: noEffect(
        'a preview is a local read, and a workflow approval is not an in-shift decision',
        'L53468, L68226',
      ),
      FL: noEffect('no device receives a preview', 'L53468, L68228'),
      SA: affected(
        'Composed agents follow this same chain plus the evaluation gate and platform review.',
        'L53468',
      ),
    },
    requires: (s) => (s.draft?.lastDiff == null ? notMet('no difference has been computed') : MET),
    produces: (s) => ({ ...s, draft: { ...s.draft!, previewWalkedScreens: [...ALL_SCREENS] } }),
  },
  {
    number: 12,
    title: 'Submit',
    wfAut: 'WF-AUT-002 into WF-AUT-004',
    sourceRef: 'L68096, L68222',
    ownerModule: 'MOD-STU-11',
    actingSurface: 'STU',
    note: 'Submission enters the chain and confers no publication (L68084).',
    effects: {
      DOH: affected(
        'Receives every chain transition into the tenant audit log; it still shows no workflow version available for Job linkage, because approval to publish is not publication.',
        'L68222',
      ),
      STU: affected(
        'The Approval Queue, screen-by-screen preview, comment threads and the approval log.',
        'L68224',
      ),
      CC: CC_CHAIN_PHASE,
      FL: FL_CHAIN_PHASE,
      SA: SA_CHAIN_PHASE,
    },
    requires: (s) => {
      const d = s.draft
      if (!d) return notMet('no draft exists')
      if (d.previewWalkedScreens.length !== d.screenOrder.length)
        return notMet('the draft has not been walked screen by screen in preview')
      if (d.localesComplete.length !== d.locales.length)
        return notMet('both locale variants must be complete before submission')
      return MET
    },
    produces: (s) => ({
      ...s,
      sequenceState: 'STATE-WF-DRAFT-SUBMITTED',
      submission: {
        id: 'SUB-BB-0001',
        status: 'Submitted',
        authorOfRecord: AUTHOR,
        reviewerOfRecord: null,
        releaseAuthorityOfRecord: null,
        comments: [],
        stalled: false,
      },
    }),
  },
  {
    number: 13,
    title: 'Return with comments',
    wfAut: 'WF-AUT-006',
    sourceRef: 'L53540, L68243',
    ownerModule: 'MOD-STU-11',
    actingSurface: 'STU',
    note: 'Rejection without comments is refused, "because the comment is the instruction to the Author" (L53535).',
    effects: {
      DOH: noEffect(
        'no effect: the Hub still shows no version available for Job linkage, because approval to publish is not publication',
        'L53540, L68222',
      ),
      STU: affected('The queue and the version history.', 'L53540'),
      CC: CC_CHAIN_PHASE,
      FL: noEffect('no effect; the prior version remains in force', 'L53540'),
      SA: SA_CHAIN_PHASE,
    },
    requires: (s) => {
      const sub = s.submission
      if (!sub) return notMet('nothing has been submitted')
      if (sub.status !== 'Submitted') return notMet(`a submission in ${sub.status} cannot be returned`)
      return MET
    },
    produces: (s) => ({
      ...s,
      submission: {
        ...s.submission!,
        status: 'Returned with comments',
        reviewerOfRecord: REVIEWER,
        comments: [
          ...s.submission!.comments,
          'Screen 7’s coaching default still references the outdated calibration procedure.',
        ],
      },
    }),
  },
  {
    number: 14,
    title: 'Revise and resubmit',
    wfAut: 'WF-AUT-007',
    sourceRef: 'L53572, L68244',
    ownerModule: 'MOD-STU-11',
    actingSurface: 'STU',
    note: 'A revision cannot skip the Reviewer stage even where the change is trivial, and no auto-acceptance of a resubmission exists (L53567, L53575).',
    effects: {
      DOH: noEffect(
        'as for WF-AUT-006 until publication occurs: the Hub still shows no version available for Job linkage',
        'L53572, L68222',
      ),
      STU: affected(
        'The queue and the version history; the resubmission supersedes the prior submission and both are retained in the approval log.',
        'L53572, L68262',
      ),
      CC: CC_CHAIN_PHASE,
      FL: noEffect(
        'as for WF-AUT-006 until publication occurs; the prior version remains in force',
        'L53572',
      ),
      SA: SA_CHAIN_PHASE,
    },
    requires: (s) => {
      const sub = s.submission
      if (!sub) return notMet('nothing has been submitted')
      if (sub.status !== 'Returned with comments')
        return notMet('only a returned submission can be revised')
      if (sub.comments.length === 0)
        return notMet('a return carries the comment that instructs the Author')
      return MET
    },
    produces: (s) => ({ ...s, submission: { ...s.submission!, status: 'Submitted' } }),
  },
  {
    number: 15,
    title: 'Evaluate — composed agents only, not Workflows',
    wfAut: null,
    sourceRef: 'L34148, L53468',
    ownerModule: 'MOD-STU-15',
    actingSurface: 'STU',
    note: 'This step exists in the journey to show what does NOT happen to a Workflow. No evaluation gate runs against this submission.',
    effects: {
      DOH: noEffect(
        'no Workflow is evaluated; the evaluation gate belongs to composed reasoning agents',
        'L53468, L34148',
      ),
      STU: affected(
        'The Governance tab’s progress track: composed agents follow this same chain plus the evaluation gate and platform review.',
        'L53468',
      ),
      CC: noEffect(
        'approving a newly composed agent for live use belongs to the Studio chain plus platform review and never appears in the Command Center gate queue',
        'L68226',
      ),
      FL: noEffect(
        'no composed reasoning agent appears in any work package or executes on a device',
        'L34148',
      ),
      SA: affected('The evaluation harness and the platform review queue.', 'L53468'),
    },
    requires: (s) => (s.submission === null ? notMet('nothing has been submitted') : MET),
    produces: (s) => ({
      ...s,
      agentEvaluationNote:
        'No evaluation gate ran against this Workflow: the gate applies to composed reasoning agents only, and no composed agent appears in any work package or executes on a device.',
    }),
  },
  {
    number: 16,
    title: 'Maker-checker approve',
    wfAut: 'WF-AUT-004 and WF-AUT-005',
    sourceRef: 'L68246, L68192',
    ownerModule: 'MOD-STU-11',
    actingSurface: 'STU',
    note: 'DEPARTURE FROM A. WF-AUT-005’s five-surface row (L53505) folds approval and publication into one act and so gives the Hub adoption routing and the Frontline a change notice. This journey separates them, and SEQ-012 is explicit that at approval "the publication act and the package build have not yet run" (L68192) and "no device receives a preview, a comment or an approval" (L68228). B wins on ordering; those two effects land at steps 17 and 19.',
    effects: {
      DOH: affected(
        'Receives every chain transition into the tenant audit log; it still shows no workflow version available for Job linkage, because approval to publish is not publication.',
        'L68222',
      ),
      STU: affected('Version history, approval log, diff and linkage view.', 'L53505, L68224'),
      CC: noEffect('no role in publication; a workflow approval is not an in-shift decision', 'L53505, L68226'),
      FL: FL_CHAIN_PHASE,
      SA: SA_CHAIN_PHASE,
    },
    requires: (s) => {
      const sub = s.submission
      if (!sub) return notMet('nothing has been submitted')
      if (sub.status !== 'Submitted') return notMet('only a submitted revision can be advanced and released')
      if (sub.reviewerOfRecord === null) return notMet('no Reviewer has stepped through the submission')
      if (sub.reviewerOfRecord === sub.authorOfRecord)
        return notMet('the Reviewer must be a different person from the Author')
      if (RELEASE_AUTHORITY === sub.authorOfRecord || RELEASE_AUTHORITY === sub.reviewerOfRecord)
        return notMet('no role performs two stages on one submission')
      return MET
    },
    produces: (s) => ({
      ...s,
      sequenceState: 'STATE-WF-RELEASE-APPROVED',
      submission: {
        ...s.submission!,
        status: 'Released',
        releaseAuthorityOfRecord: RELEASE_AUTHORITY,
      },
    }),
  },
  {
    number: 17,
    title: 'Publish',
    wfAut: 'WF-AUT-008',
    sourceRef: 'L53607, L68390',
    ownerModule: 'MOD-STU-12',
    actingSurface: 'STU',
    note: 'The version exists and is not yet safe to run: "Versioned and Distributable are different states, so a version can exist in history without ever having been safe to run" (L68465). Distribution is earned at step 18. WF-AUT-008’s Frontline clause — the change notice on the first screen of the next execution — lands at the next execution boundary, which is slice 7’s surface.',
    effects: {
      DOH: affected(
        'Job version history, adoption tracking and the audit: the version becomes linkable to Jobs and Runs and the publication event is written to the tenant audit log.',
        'L53607, L68374',
      ),
      STU: affected(
        'The linkage view showing which Jobs and Runs are on each version.',
        'L53607',
      ),
      CC: noEffect(
        'it carries no publication capability, and version usage appears later as one of the five standard report data sets rather than as a live event',
        'L53607, L68378',
      ),
      FL: noEffect(
        'the package definition exists on the platform; no device holds it, because delivery follows assignment — any statement that the tablet is "updated" at this point would be false',
        'L68380',
      ),
      SA: affected(
        'The per-device package inventory with per-run pinned versions and the adoption-timing lag metric.',
        'L53607',
      ),
    },
    requires: (s) => {
      const sub = s.submission
      if (sub?.status !== 'Released') return notMet('only a release-approved submission may be published')
      if (s.sequenceState !== 'STATE-WF-RELEASE-APPROVED')
        return notMet('the three-stage chain is not complete')
      return MET
    },
    produces: (s) => ({
      ...s,
      versions: [
        ...s.versions,
        {
          number: 'v2.1.0',
          status: 'Published',
          supersededBy: null,
          distributable: false,
          bumpClass: null,
          republishDescription:
            'First publication of the wheel bolt torque verification workflow.',
        },
      ],
    }),
  },
  {
    number: 18,
    title: 'Generate the package',
    wfAut: 'WF-AUT-009',
    sourceRef: 'L53644, L68396',
    ownerModule: 'MOD-STU-14',
    actingSurface: 'STU',
    note: 'The completeness check is a separate act from the build: limits, severity mappings, gate rules and deviation-capture forms must all be present "or it cannot be built, because a package missing any of them would produce a device that cannot enforce alone" (L68396). Passing it is what makes the version distributable.',
    effects: {
      DOH: affected(
        'The tenant audit log receives the package build; no Job is affected yet, because no Job exists.',
        'L68374, L53644',
      ),
      STU: affected('Package definition and contents.', 'L53644'),
      CC: noEffect(
        'the deviation workspace reads the severity level and bundle the device applied, and no device has applied anything',
        'L53644, L68378',
      ),
      FL: noEffect(
        'the package definition exists on the platform; no device holds it, because delivery follows assignment',
        'L68380',
      ),
      SA: affected(
        'The severity catalog distributes into packages, and a catalog change is a package-affecting, critical-class change.',
        'L53644',
      ),
    },
    requires: (s) =>
      versionByNumber(s, 'v2.1.0')?.status === 'Published'
        ? MET
        : notMet('no published version exists to build a package from'),
    produces: (s) => ({
      ...s,
      sequenceState: 'STATE-WF-PUBLISHED-V210',
      versions: s.versions.map((v) => (v.number === 'v2.1.0' ? { ...v, distributable: true } : v)),
      workPackages: [...s.workPackages, { version: 'v2.1.0', status: 'Built', quarantined: false }],
    }),
  },
  {
    number: 19,
    title: 'Pin — a Delivery Operations Hub act',
    wfAut: 'WF-AUT-010',
    sourceRef: 'L53679, L53677',
    ownerModule: 'MOD-DOH-06, slice 6 — a seam, not a Studio control',
    actingSurface: 'DOH',
    note: 'The Studio states this act and never offers it. The pin is written before the download, so a pin is not a delivery and a delivery is not an execution: until the download completes "the run must show as assigned-not-ready" (L53677).',
    effects: {
      DOH: affected('The run record with its immutable pin.', 'L53679'),
      STU: affected('The linkage view showing runs per version.', 'L53679'),
      CC: affected('The run’s version is shown alongside its deviations.', 'L53679'),
      FL: affected(
        'The pinned package is what executes — and until the download completes the run shows as assigned-not-ready, never as ready.',
        'L53679, L53677',
      ),
      SA: affected('Per-run pinned versions in the device package inventory.', 'L53679'),
    },
    requires: (s) => {
      const pkg = s.workPackages.find((p) => p.version === 'v2.1.0')
      if (pkg?.status !== 'Built') return notMet('no built package exists to pin')
      if (versionByNumber(s, 'v2.1.0')?.distributable !== true)
        return notMet('a version that is not distributable is not safe to run')
      return MET
    },
    produces: (s) => ({
      ...s,
      workPackages: s.workPackages.map((p) =>
        p.version === 'v2.1.0' ? { ...p, status: 'Pinned' } : p,
      ),
      hubPin: {
        runId: 'RUN-2026-08-14-A',
        version: 'v2.1.0',
        deviceReadiness: 'assigned-not-ready',
        ownedBy: 'MOD-DOH-06, slice 6',
      },
    }),
  },
  {
    number: 20,
    title: 'Supersede',
    wfAut: 'WF-AUT-008, implicitly',
    sourceRef: 'L53332, L53689, L33479',
    ownerModule: 'MOD-STU-12',
    actingSurface: 'STU',
    note: 'D5 — `Superseded` is the VERSION state; `Outdated` is the per-Job ADOPTION state. Collapsing them loses the difference between "a newer version exists" and "this Job’s update window lapsed", which are separately notified (L33569).',
    effects: {
      DOH: affected(
        'Job linkage moves to the newer version and each Job Owner decides adoption; the Job-level state is Outdated, which is not the version state Superseded.',
        'L33479, L53505',
      ),
      STU: affected(
        'Version history: a superseded version is not deleted — prior versions are retained in full and remain permanently readable.',
        'L53332',
      ),
      CC: noEffect(
        'it shows deviations against the version each run actually executed, so a supersession changes nothing it displays',
        'L53607',
      ),
      FL: noEffect(
        'the in-flight run keeps its pin: RUN-2026-08-14-A pinned v2.1.0 at 06:05 and finishes on v2.1.0 while v2.2.0 publishes at 10:00',
        'L53689',
      ),
      SA: affected(
        'The per-device package inventory and the semantic-versioning policy.',
        'L68382',
      ),
    },
    requires: (s) =>
      versionByNumber(s, 'v2.1.0')?.status === 'Published'
        ? MET
        : notMet('there is no published version for a newer one to supersede'),
    produces: (s) => ({
      ...s,
      versions: [
        ...s.versions.map((v) =>
          v.number === 'v2.1.0'
            ? { ...v, status: 'Superseded' as const, supersededBy: 'v2.2.0' }
            : v,
        ),
        {
          number: 'v2.2.0',
          status: 'Published',
          supersededBy: null,
          distributable: true,
          bumpClass: 'MINOR',
          republishDescription:
            'Torque specification updated per engineering change order; severity bands re-based',
        },
      ],
    }),
  },
  {
    number: 21,
    title: 'Roll back',
    wfAut: 'WF-AUT-011',
    sourceRef: 'L53711, L53720',
    ownerModule: 'MOD-STU-12',
    actingSurface: 'STU',
    note: 'Rollback is a FORWARD act: the platform does not un-publish, "because the floor may already have run it". The previous content passes the full three-stage chain again and comes out as a new, higher version number; v2.2.0 remains readable forever (L53703, L53706, L53720).',
    effects: {
      DOH: affected('Job linkage and adoption.', 'L53711'),
      STU: affected(
        'Version history showing both the withdrawn and the corrected version.',
        'L53711',
      ),
      CC: affected(
        'Deviations continue to be attributed to whichever version each run executed.',
        'L53711',
      ),
      FL: affected('The change notice at the next execution boundary.', 'L53711'),
      SA: affected(
        'Package inventory shows the fleet’s mixed state during the transition.',
        'L53711',
      ),
    },
    requires: (s) => {
      const bad = versionByNumber(s, 'v2.2.0')
      if (bad?.status !== 'Published') return notMet('there is no published version to roll back from')
      if (versionByNumber(s, 'v2.1.0') === null)
        return notMet('there is no last known-good version to draft from')
      return MET
    },
    produces: (s) => ({
      ...s,
      versions: [
        ...s.versions.map((v) =>
          v.number === 'v2.2.0'
            ? { ...v, status: 'Superseded' as const, supersededBy: 'v2.3.0' }
            : v,
        ),
        {
          number: 'v2.3.0',
          status: 'Published',
          supersededBy: null,
          distributable: true,
          bumpClass: 'MINOR',
          republishDescription:
            'Reverts severity banding to the v2.1.0 basis pending engineering review',
        },
      ],
    }),
  },
  {
    number: 22,
    title: 'Archive',
    wfAut: 'WF-AUT-011, implicitly',
    sourceRef: 'L33505, L53332',
    ownerModule: 'MOD-STU-12',
    actingSurface: 'STU',
    note: 'Archival is deliberate and manual, never automatic when a version’s Jobs are archived; where the no-active-Jobs indicator cannot be computed, archival is blocked rather than performed on an assumption (L33505). v2.1.0 cannot be archived here, because a run is still pinned to it.',
    effects: {
      DOH: affected(
        'The no-active-Jobs indicator the archival act is checked against.',
        'L33505',
      ),
      STU: affected(
        'Manual archival and version export; an archived version is retired from new linkage and stays permanently readable.',
        'L33505, L68376, L53332',
      ),
      CC: noEffect(
        'it carries no publication capability, and it shows deviations against the version each run executed — an archived version stays readable',
        'L68378, L53332',
      ),
      FL: noEffect(
        'no device is reached: the run that pinned v2.1.0 keeps its package, and archival retires a version from new linkage rather than withdrawing it from a device',
        'L53679, L53332',
      ),
      SA: noEffect(
        'the console holds the semantic-versioning policy and the package inventory; retiring one tenant version changes neither',
        'L68382',
      ),
    },
    requires: (s) => {
      const target = versionByNumber(s, 'v2.2.0')
      if (target?.status !== 'Superseded')
        return notMet('only a superseded version is a candidate for archival')
      if (s.hubPin?.version === 'v2.2.0')
        return notMet('a version with an active pinned run cannot be archived')
      return MET
    },
    produces: (s) => ({
      ...s,
      versions: s.versions.map((v) =>
        v.number === 'v2.2.0' ? { ...v, status: 'Archived' as const } : v,
      ),
    }),
  },
] satisfies readonly JourneyStep[]

export function journeyStep(number: number): JourneyStep | null {
  return JOURNEY_STEPS.find((s) => s.number === number) ?? null
}

export function effectFor(step: JourneyStep, surface: JourneySurfaceCode): SurfaceEffect {
  return step.effects[surface]
}

/**
 * The four steps whose REFUSALS are the point (census §4.1). Each is quoted
 * from the frozen source so that a walkthrough can name its reason rather
 * than inventing one.
 */
export const JOURNEY_REFUSALS = [
  {
    atStep: 21,
    refusal: 'Rollback is a forward act',
    reason:
      'Deleting or hiding a published version is refused; prior versions are retained in full. Rolling back by editing a published version in place is refused. Skipping the chain for a rollback is refused — nothing reaches the frontline without sign-off at each stage.',
    sourceRef: 'L53706',
  },
  {
    atStep: 14,
    refusal: 'A revision cannot skip the Reviewer',
    reason:
      'A revision cannot skip the Reviewer stage even where the change is trivial, and no auto-acceptance of a resubmission exists.',
    sourceRef: 'L53567, L53575',
  },
  {
    atStep: 13,
    refusal: 'Rejection requires comments',
    reason:
      'Rejection without comments is refused, because the comment is the instruction to the Author; returned items are visible in the Author’s queue independently of notification delivery.',
    sourceRef: 'L53535, L53543',
  },
  {
    atStep: 17,
    refusal: 'Publication cannot re-base an in-flight run',
    reason:
      'A publication cannot re-base an in-flight run. A Supervisor cannot force adoption on a Job they do not own; the adoption decision keys to the Job Owner field. A Client Command Center user cannot publish anything.',
    sourceRef: 'L53602',
  },
] as const

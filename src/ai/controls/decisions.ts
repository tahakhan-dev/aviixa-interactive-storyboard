import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import type { DecisionReading } from '@/disclosure/decisions'

/**
 * THE FOUR DECISIONS THIS TASK MUST DISCLOSE AND MAY NOT REGISTER.
 *
 * `DEC-PAUSE-001`, `DEC-KILL-001`, `DEC-AIPAUSE-001` and `DEC-AIRTO-001` are
 * each named by the frozen source and none is a member of the canon's exported
 * identifier union, so none can be handed to `DecisionDisclosure` without a
 * type error. **They are not added.** `src/surfaces/sa/ai-failure-authority.ts`
 * assigns `src/disclosure/decisions.ts` to wave 5's registry closure in both of
 * its seams, and this build has already recorded why: registering a
 * locally-disclosed decision mid-wave creates the second home
 * `DecisionDisclosure` exists to prevent, and that trap has fired once already.
 *
 * So they are disclosed HERE, in the pattern `src/offline/decisions-37b.ts`
 * established — every reading, every locator, and the build's own position
 * labelled a client-delegated choice under `APP-012`, which is a build approval
 * and therefore carries no frozen-source line. `MEMBERSHIP_IS_MEASURED` below
 * checks the non-membership against `OPEN_DECISION_IDS` at load rather than
 * asserting it in prose, so a wave-5 registration turns this file's own claim
 * false loudly instead of leaving a stale sentence behind.
 *
 * ── THE FOURTH ONE IS A FINDING, NOT A LISTED TASK ────────────────────────
 * The dispatching brief named three. `DEC-AIRTO-001` is a fourth: it is raised
 * at L87880 in words that leave no room — "**No value is proposed here.
 * Inventing one would be a defect.**" — is registered in §41.9 at L88907, and is
 * likewise absent from the exported union. Any expected-recovery figure on an
 * incident screen is an invented contractual value, so it renders as unset with
 * the identifier and no number anywhere near it.
 *
 * ── DEC-PAUSE-001 HAS A FOURTH READING AND IT IS NOT AN INITIATION GRANT ──
 * §40.15 says the Statement of Work does not state who may initiate a pause
 * (L87795, L87801). The Platform Engineer's role card lists "emergency pause
 * proposal (`FEAT-SA-0702`)" among its available features (L15945) while its own
 * Approval authority row reads "None. The role approves nothing; it submits."
 * (L15939). That is a PROPOSAL right, not an initiation right, and it sits
 * beside option (a) without resolving it. It is carried as a reading with both
 * locators and it must not become a grant in any rendering.
 *
 * That same line is also an identifier collision: `FEAT-SA-0702` names "Global
 * severity catalog and floor register" in the feature inventory (L47802) and
 * "emergency pause proposal" in the role card (L15945) — one identifier, two
 * features, no cross-reference anywhere. Both owners are carried on the
 * slice-10 alias pattern by `FEAT_SA_0702_COLLISION`, and no gate in this task
 * asserts a single meaning for it.
 *
 * This module is data. It decides nothing and it settles nothing.
 */

/** How this build renders a decision it may not register. */
export const APP_012_LABEL =
  'A client-delegated choice under APP-012 — a build approval, which is why it carries no ' +
  'frozen-source line of its own. Every reading above is the source\'s; the position is this ' +
  'build\'s, and it is reversible by the client without a code change to the readings.'

export interface LocalOpenDecision {
  /** The source's own identifier. */
  readonly id: string
  readonly question: string
  /** Every reading, with the line each is read from. None is obeyed. */
  readonly readings: readonly DecisionReading[]
  /** Every line in the frozen source that bears on it. */
  readonly locators: readonly string[]
  /** What this build renders while the question is open. */
  readonly buildPosition: string
  /** Why this record is local rather than in the canon. */
  readonly whyLocal: string
}

const WHY_LOCAL =
  'Not a member of the decision canon\'s exported identifier union, so it cannot be handed to ' +
  '`DecisionDisclosure` without a type error, and it is not added: registering a ' +
  'locally-disclosed decision mid-wave creates the second home that component exists to prevent. ' +
  '`src/disclosure/decisions.ts` is wave 5\'s registry closure and this task reports the seam ' +
  'rather than closing it.'

export const LOCAL_OPEN_DECISIONS = [
  {
    id: 'DEC-PAUSE-001',
    question: 'Who may initiate an emergency pause, and what happens when the root is unavailable?',
    readings: [
      {
        text:
          'The source states the gap outright: emergency pause and resume are each critical-class ' +
          'actions that the root approves, and "The Statement of Work does not state who may ' +
          'initiate a pause, nor what happens when the root is unavailable."',
        locator: 'L87799',
      },
      {
        text:
          'Option (a) — a Platform Engineer or Admin may initiate a pause that takes effect ' +
          'immediately, with root approval required within a stated window to sustain it, and ' +
          'automatic resume if approval does not arrive. The card itself calls this "unsafe in the ' +
          'other direction".',
        locator: 'L87801',
      },
      {
        text:
          'Option (b) — immediate initiation by an Admin with root approval required to RESUME, so ' +
          'the safe direction is fast and the unsafe direction is governed. The card recommends ' +
          'this one, and notes it lets an Admin halt agent activity platform-wide, mitigated by ' +
          'the act being audited, tenant-visible and reversible only through root approval.',
        locator: 'L87801',
      },
      {
        text:
          'Option (c) — strict root-only initiation with a documented escalation path. The card ' +
          "notes the platform's own fallback rules prohibit a control depending indefinitely on " +
          'one person, and there is exactly one root account.',
        locator: 'L87801',
      },
      {
        text:
          'A FOURTH READING, from a different chapter and with no cross-reference to the card: the ' +
          'Platform Engineer role card lists "emergency pause proposal (`FEAT-SA-0702`)" among the ' +
          'features available to that role. It is a PROPOSAL right and not an initiation right — ' +
          "the same card's Approval authority row reads \"None. The role approves nothing; it " +
          'submits." (L15939) — and it sits beside option (a) without resolving it.',
        locator: 'L15945',
      },
      {
        text:
          'The register row that carries it: "Pause initiation authority and root unavailability", ' +
          'marked **New**, section 40.15.',
        locator: 'L88906',
      },
    ],
    locators: ['L87799', 'L87801', 'L15939', 'L15945', 'L88906', 'L87862'],
    buildPosition:
      'The pause proposal is drawn and the approval is the root\'s, which is option (b) read ' +
      'narrowly: stopping is the safe direction and must be fast, restarting is the risky ' +
      'direction and must be governed. The Platform Engineer\'s control is drawn and inert with ' +
      'this identifier rather than removed, because the role card names the feature and removing ' +
      'it would tell that role the capability does not exist. No reading is presented as settled ' +
      'and the fourth reading grants nothing.',
    whyLocal: WHY_LOCAL,
  },
  {
    id: 'DEC-KILL-001',
    question:
      "The runaway-loop kill switch's scope, threshold, initiating authority, approval class, and " +
      'its relationship to the emergency pause.',
    readings: [
      {
        text:
          'The gap, stated: a runaway-loop kill switch is named as an Orchestration setting while ' +
          'the emergency pause is a Governance and Safety setting and is critical-class. "The ' +
          "Statement of Work does not state the kill switch's scope, threshold, initiating " +
          'authority, or approval class, nor how it relates to the emergency pause."',
        locator: 'L87795',
      },
      {
        text:
          'Option (a) — strictly per-run and automatic, tripping on the configured loop bound, ' +
          'with no human initiation and no approval: a safety valve rather than an administrative ' +
          'act. Option (b) — per-agent and human-pullable at engineering class, with the emergency ' +
          'pause reserved for tenant-wide and platform-wide scope at critical class. Option (c) — ' +
          'collapse the two into one control at critical class. The card recommends (a) and (b) ' +
          'together and says (c) "means a single runaway run requires root approval to stop, which ' +
          'is operationally indefensible".',
        locator: 'L87797',
      },
      {
        text:
          "§40.15's own control table gives the kill switch `Not specified` for both scope and " +
          'approval class, and refers both to this decision.',
        locator: 'L87864',
      },
      {
        text:
          'The console authority matrix grants the control to the Root Super Admin and the Admin ' +
          'outright and to the Platform Engineer conditionally — "proposes, or applies under a ' +
          'declared emergency with post-hoc approval, subject to client decision" — while its own ' +
          'classification column says the emergency-application path is `Client Decision ' +
          'Required`. That cell is simultaneously permissive and undecided.',
        locator: 'L91290',
      },
      {
        text:
          '§43.3.5 requires both mechanisms to exist and not be conflated on the screen: "the ' +
          'pause parks agent activity gracefully at stage boundaries, while the kill switch ' +
          'terminates a runaway loop."',
        locator: 'L91231',
      },
      {
        text:
          'The register row that carries it: "Runaway-loop kill switch scope, threshold, authority ' +
          'and class", marked **New**, section 40.15.',
        locator: 'L88905',
      },
    ],
    locators: ['L87795', 'L87797', 'L87864', 'L88905', 'L91231', 'L91290'],
    buildPosition:
      'Drawn, named as its own mechanism in its own settings category, and inoperable. It is not ' +
      'omitted — an absent control tells an operator the source describes nothing, and §43.3.5 ' +
      'requires it to exist — and it is not working, because a control whose scope, threshold, ' +
      'authority and class are all unstated has no behaviour to build. It is never rendered ' +
      'beside the pause as one control.',
    whyLocal: WHY_LOCAL,
  },
  {
    id: 'DEC-AIPAUSE-001',
    question: 'Whether a site-scoped pause exists at all, and under whose authority.',
    readings: [
      {
        text:
          'The source scopes the emergency pause platform-wide or per tenant only, so a ' +
          'site-scoped pause is `Recommendation — R&D`. Benefit: a multi-site tenant with a ' +
          'problem confined to one plant need not lose agent support everywhere. Cost: a third ' +
          'scope in a critical-class control, more complex blast-radius reasoning, and an ' +
          'additional audit class.',
        locator: 'L91229',
      },
      {
        text:
          "The console's authority matrix reads `Client Decision Required` for the Root Super " +
          'Admin, the Admin and the Platform Engineer, and `Explicitly prohibited` for Support. ' +
          'Three of the four cells defer and the fourth refuses, so the row grants the control to ' +
          'nobody and settles nothing about whether it should exist.',
        locator: 'L91289',
      },
      {
        text:
          'The §43.3.5 source-classification paragraph files the site-scoped pause among the items ' +
          'that are `Recommendation — R&D` rather than `SoW Fact`.',
        locator: 'L91319',
      },
      {
        text:
          '§43.4 classifies it against what §8.7.1 establishes: the source establishes ' +
          '"Platform-wide and per-tenant pause" and does not establish "Any narrower scope".',
        locator: 'L91341',
      },
      {
        text:
          'MEASURED ABSENCE: the identifier occurs on exactly five lines in the frozen source and ' +
          'not one of them is a row of the §41.9 open-decision register (rows L88882-L88909). It ' +
          'is raised in chapter 43 and registered nowhere in chapter 41, so a citation of a ' +
          'chapter-41 register row for it would name a line that does not contain it.',
        locator: 'L115250',
      },
    ],
    locators: ['L91229', 'L91289', 'L91319', 'L91341', 'L115250'],
    buildPosition:
      'Drawn and inoperable, with the identifier and every reading, and no third scope offered ' +
      'anywhere as a working control. The alternatives are drawing nothing, which tells an ' +
      'operator the scope does not exist, and drawing a working control, which invents a ' +
      'capability at critical class.',
    whyLocal: WHY_LOCAL,
  },
  {
    id: 'DEC-AIRTO-001',
    question:
      'The Recovery Time Objective and Recovery Point Objective for the agentic layer — how long a ' +
      'service may take to come back, and how much recent data a failure may cost.',
    readings: [
      {
        text:
          'The source refuses to propose one, in its own words: "No value is proposed here. ' +
          'Inventing one would be a defect." Options offered are (a) one objective pair for the ' +
          'whole agentic layer; (b) per-agent pairs, tightest for the Deviation and Containment ' +
          'Agent, loosest for the Shift Handoff Agent; (c) per-artifact Recovery Point Objectives ' +
          'with a single Recovery Time Objective for availability. The card recommends (b) with ' +
          '(c), because availability and data loss are different promises.',
        locator: 'L87880',
      },
      {
        text:
          "The pause's own fallback contract reaches the same gap and folds it in: \"Recovery Time " +
          'Objective and Recovery Point Objective: `TBD — Client Decision Required ' +
          '(DEC-AIRTO-001)`."',
        locator: 'L87878',
      },
      {
        text:
          'The register row that carries it: "Recovery Time Objective and Recovery Point Objective ' +
          'for the agentic layer", marked **New**, section 40.15.',
        locator: 'L88907',
      },
    ],
    locators: ['L87878', 'L87880', 'L88907'],
    buildPosition:
      'Rendered as unset with the identifier and no figure of any kind. An expected-recovery time ' +
      'on an incident screen is an invented contractual value and the source says so in its own ' +
      'words, so the refusal is what ships. It is the most-referenced open decision in the two ' +
      'artificial-intelligence chapters, which is why it is disclosed rather than left implicit.',
    whyLocal: WHY_LOCAL,
  },
] as const satisfies readonly LocalOpenDecision[]

const BY_ID = new Map<string, LocalOpenDecision>(
  LOCAL_OPEN_DECISIONS.map((decision) => [decision.id, decision]),
)

export function localDecision(id: string): LocalOpenDecision {
  const found = BY_ID.get(id)
  if (found === undefined) {
    throw new Error(
      `"${id}" is not disclosed locally by this module. The four it holds are the ones the ` +
        'frozen source names and the decision canon does not, and a lookup that missed is a ' +
        'caller reaching for a fifth.',
    )
  }
  return found
}

/**
 * The non-membership, MEASURED at load rather than asserted in prose.
 *
 * A sentence saying "these are not in the canon" goes stale the moment wave 5
 * registers one, silently, and this build has shipped that exact defect. This
 * throws instead: the day a registration lands, the file that claims to be a
 * local home stops loading and whoever registered it is told to remove the
 * local record rather than leave two.
 */
const CANON: ReadonlySet<string> = new Set<string>(OPEN_DECISION_IDS)

export const MEMBERSHIP_IS_MEASURED: readonly string[] = LOCAL_OPEN_DECISIONS.map((decision) => {
  if (CANON.has(decision.id)) {
    throw new Error(
      `${decision.id} is now a member of the decision canon's exported union and is ALSO ` +
        'disclosed locally by `src/ai/controls/decisions.ts`. Two homes for one decision is the ' +
        'defect `DecisionDisclosure` exists to prevent: delete the local record and render the ' +
        'canon\'s, rather than keeping both.',
    )
  }
  return decision.id
})

/**
 * `FEAT-SA-0702` names two different features and the source cross-references
 * neither. Both owners are carried on the slice-10 alias pattern, and no gate
 * in this task asserts a single meaning for the literal.
 */
export const FEAT_SA_0702_COLLISION = {
  identifier: 'FEAT-SA-0702',
  owners: [
    {
      name: 'Global severity catalog and floor register',
      where: "the MOD-SA-07 feature inventory row, actor Root Super Admin, fallback `FB-CONF-01`",
      locator: 'L47802',
    },
    {
      name: 'emergency pause proposal',
      where: "the Platform Engineer role card's Available features row",
      locator: 'L15945',
    },
  ],
  finding:
    'One identifier, two features, no cross-reference anywhere in the frozen source. Rendered as ' +
    'an alias pair with both owners and both locators; nothing here picks one, and a gate keyed ' +
    'on a single meaning for it would be asserting a resolution the source does not carry.',
} as const

/**
 * The pause FEATURE, by contrast, IS source-attributed, and the distinction
 * matters enough to carry it beside the collision.
 *
 * L47803 files `FEAT-SA-0703` "The emergency pause" under `MOD-SA-07` with
 * `SUB-SA-0703` "Checkpoint at stage boundary, resume separately", `FUNC-SA-0703`
 * "Render agent unavailability honestly and never suppress the on-device
 * deterministic layer", actor `Root Super Admin`, fallback `FB-AI-01`,
 * classified `SoW Fact — §8.7.5`. That is coverage claimable from the source.
 *
 * It does NOT license the other claim. `MOD-SA-07` appears nowhere in chapter
 * 43, so attributing §43.3.5's authority matrix to it stays a build inference
 * labelled as one by `CONSOLE_AUTHORITY_ATTRIBUTION`. The pause feature and the
 * matrix are different objects and neither claim licenses the other.
 */
export const PAUSE_FEATURE_ATTRIBUTION = {
  module: 'MOD-SA-07',
  feature: { id: 'FEAT-SA-0703', name: 'The emergency pause' },
  subFeature: {
    id: 'SUB-SA-0703',
    name: 'Checkpoint at stage boundary, resume separately',
  },
  function: {
    id: 'FUNC-SA-0703',
    name:
      'Render agent unavailability honestly and never suppress the on-device deterministic layer',
  },
  actor: 'Root Super Admin',
  offlineBehaviour: 'Online-only — server-side machinery',
  fallback: 'FB-AI-01',
  classification: 'SoW Fact — §8.7.5',
  sourceRef: 'L47803',
  siblings: [
    { id: 'FEAT-SA-0701', name: 'The ten setting categories and locale packs', locator: 'L47801' },
    { id: 'FEAT-SA-0702', name: 'Global severity catalog and floor register', locator: 'L47802' },
  ],
  whatItDoesNotLicense:
    "`MOD-SA-07` appears nowhere in chapter 43, so §43.3.5's fifteen-row authority matrix is not " +
    'attributed to this module by this record. The pause feature is source-attributed; the ' +
    'matrix attribution remains a build inference labelled as one.',
} as const

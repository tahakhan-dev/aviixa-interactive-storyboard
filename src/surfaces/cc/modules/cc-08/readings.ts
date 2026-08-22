import type { CcFallbackPatternId } from '@/surfaces/cc/fallback/patterns'
import type { TwoReadings } from '@/surfaces/cc/decisions/disclosure'

/**
 * WHERE ANOTHER TABLE — OR ANOTHER LINE OF THE SAME CHAPTER — ANSWERS ONE OF
 * `MOD-CC-08`'S NINE ROWS DIFFERENTLY.
 *
 * This file carries readings, never a verdict. `TwoReadings` is task 5's own
 * type, imported rather than re-declared: it is a fixed-length pair of
 * `DecisionReading`, which has exactly two fields, so there is nowhere on a
 * reading to mark it the winner and a third reading is a type error rather
 * than a review comment.
 *
 * `src/surfaces/cc/decisions/disclosure.ts` is the surface's own local
 * disclosure register and is NOT edited or extended here. Its records are
 * keyed on a `CcDecisionId`, and none of these three divergences has a `DEC-*`
 * identifier to key on — that absence is the finding, and forcing one of them
 * into a register of identified decisions would erase it. `AC-CC-502`
 * requires every cell to carry an explicit status and every cell does; that
 * three tables give three different statuses to the same act is tested by no
 * acceptance criterion at all.
 */

export interface Cc08Divergence {
  readonly id: string
  /** The act, in this module's own matrix wording. */
  readonly capability: string
  /** This module's own matrix row, and the column the disagreement is on. */
  readonly ownRow: number
  readonly column: string
  /** The question the sources answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /**
   * Every statement of the question found in the source, with its line.
   * Separate from `readings` on purpose: four statements can make two
   * readings, and collapsing statements into readings is how "four different
   * statuses" gets written down for a cell that carries two.
   */
  readonly statements: readonly { readonly text: string; readonly line: number }[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
}

export const CC08_DIVERGENCES = [
  {
    id: 'agent-recheck-tenant-admin',
    capability: 'Request an agent re-check on a record',
    ownRow: 9,
    column: 'Tenant Admin',
    question:
      'Is the Tenant Admin categorically excluded from requesting an agent re-check, or does ' +
      'the capability simply not confer on them here?',
    readings: [
      {
        text:
          'Explicitly prohibited. The Tenant Admin never holds this capability in any ' +
          'circumstance, so nothing is drawn where the control would be — a disabled control ' +
          'would invite the belief the right exists somewhere. Three of the four statements ' +
          'read this way, in three different sections.',
        locator:
          'MOD-CC-08 §21.11 row 9 · L37674; the surface matrix §21.1.2 · L35014; ' +
          "MOD-CC-13's action matrix §21.16 row 9 · L38690",
      },
      {
        text:
          'Unavailable. The capability exists on this screen and does not confer on the Tenant ' +
          'Admin, so the control is present and disabled and carries its own reason. §25.4 ' +
          'reads `Unavailable` down its whole Tenant Admin column for the ten actions.',
        locator: '§25.4 row 9 · L48452',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited', line: 37674 },
      { text: 'Explicitly prohibited', line: 35014 },
      { text: 'Explicitly prohibited', line: 38690 },
      { text: 'Unavailable', line: 48452 },
    ],
    renderedConsequence:
      "`src/ui/WriteControl.tsx` draws `explicitlyProhibited` at `BASE_ROLE` as an absent " +
      'notice with no control at all, and `unavailable` as a disabled control carrying its ' +
      'reason. The two readings therefore render OPPOSITELY — an absent cell against a present ' +
      'one that explains itself. Both are drawn on this screen so the difference is visible ' +
      'rather than described, and neither is chosen. Note that the disagreement is ' +
      'three-to-one and that counting statements would report FOUR statuses for a cell that ' +
      'carries two.',
  },
  {
    id: 'agent-recheck-row-name-join',
    capability: 'Request an agent re-check on a record',
    ownRow: 9,
    column: 'Capability on this module',
    question:
      'Do this module\'s row 9 and the three action-keyed tables name the same act, so that a ' +
      'join by capability wording resolves?',
    readings: [
      {
        text:
          'They are the same act under two spellings. This module writes `Request an agent ' +
          're-check on a record`; the surface matrix, §21.16 and §25.4 all write `Request an ' +
          'agent re-check`, three words shorter. A join keyed on exact capability wording ' +
          'therefore finds nothing, and a join keyed on a prefix finds it.',
        locator: 'MOD-CC-08 §21.11 row 9 · L37674 against L35014, L38690 and L48452',
      },
      {
        text:
          'The three extra words are the scope of the act, not decoration. §21.16 row 9 is an ' +
          'action of the closed set of ten and this row is a capability on one module; the ' +
          'module row states the object the request names, which the action row does not. ' +
          'Reading them as one string loses that the module row is the narrower statement.',
        locator: "MOD-CC-13's action matrix §21.16 row 9 · L38690",
      },
    ],
    statements: [
      { text: 'Request an agent re-check on a record', line: 37674 },
      { text: 'Request an agent re-check', line: 35014 },
      { text: 'Request an agent re-check', line: 38690 },
      { text: '9 Request an agent re-check', line: 48452 },
    ],
    renderedConsequence:
      'Nothing on this screen joins the two tables by name. The row is rendered under its own ' +
      'wording and the three foreign statements are rendered under theirs, each with its own ' +
      'line, so a reader sees four spellings rather than one normalised string. The build ' +
      'writes no normaliser for this pair: normalising is where a join silently starts ' +
      'choosing.',
  },
  {
    id: 'cross-area-roll-up-tenant-admin',
    capability: 'See the cross-Area agent health roll-up',
    ownRow: 5,
    column: 'Tenant Admin',
    question:
      'The one cell in this matrix that grants the Tenant Admin anything sits on a screen the ' +
      'surface matrix may not let them open. Which governs?',
    readings: [
      {
        text:
          'The grant is reachable. The screen register admits the Tenant Admin to this screen ' +
          'by name, and this module\'s own functionality states the exception in the positive: ' +
          '"Roles prohibited: Tenant Admin except the cross-Area roll-up". On this reading the ' +
          'Tenant Admin opens the panel and sees the roll-up and nothing else on it.',
        locator: 'the screen register §25.4 · L48393; `FUNC-CC-0801-1-1` · L37780',
      },
      {
        text:
          'The grant is unreachable. The surface matrix gives the Tenant Admin `Allowed with ' +
          'conditions — report and banner routes only` for opening any Command Center route, ' +
          'and the agent activity panel is neither a report route nor a banner route. On this ' +
          'reading the module cell grants a capability on a screen its holder cannot open.',
        locator: 'the surface-level permission matrix §21.1.2 · L35004',
      },
    ],
    statements: [
      {
        text: 'Allowed with conditions — requires Tenant or Site read scope',
        line: 37670,
      },
      { text: 'Allowed with conditions — report and banner routes only', line: 35004 },
      {
        text: 'Allowed with conditions — requires a Tenant or Site read scope grant',
        line: 35006,
      },
      { text: 'Supervisor, Quality Manager, Tenant Admin', line: 48393 },
    ],
    renderedConsequence:
      'The matrix renders whole for every viewer in either case, so nothing on this screen ' +
      'turns on the answer. What turns on it is the door, and the door is `evaluateCCAccess` ' +
      "in `src/surfaces/cc/access.ts` — slice 8's file and not this task's to edit. The " +
      'conflict is disclosed here and left open. Note also that L35006 states the same scope ' +
      'grant for the aggregate BOARD one word longer — `a Tenant or Site read scope grant` ' +
      'against this row\'s `Tenant or Site read scope` — so the two cells are near-identical ' +
      'and not identical, and a gate keyed on equality between them would be asserting a ' +
      'sentence the source does not carry.',
  },
] as const satisfies readonly Cc08Divergence[]

/* ==================================================================== *
 * THE SOURCE DISAGREES WITH ITSELF ABOUT WHETHER THIS SCREEN EXERCISES
 * ONE OF THE TEN, AND THE RAIL IS NOT MOUNTED HERE EITHER WAY.
 * ==================================================================== */

/**
 * L37757, this module's own `**Interconnections.**` paragraph, ends: "exercises
 * action 9 of `MOD-CC-13`". L38793, `MOD-CC-13`'s own `**Interconnections.**`
 * paragraph, enumerates the modules whose screens exercise one or more of the
 * ten and gives action 9 to `MOD-CC-04` — it does not name this module at all.
 *
 * Both are the source's own words about the same closed set, and they are
 * recorded rather than reconciled. What the build does is decided by the
 * narrower fact rather than by a preference: L38793 is the ENUMERATION over
 * the ten, and this module is not in it, so `actionRail` is left unfilled and
 * `CommandCenterShell` renders its declared `operational-action-set` seam.
 *
 * The cost of being wrong is asymmetric and that is the whole ruling. Mounting
 * a rail of ten operational controls on a read-and-request panel that L38793
 * does not name is the exact drift the closed set exists to prevent, and it
 * would ship ten controls on a Supervisor's landing view. Leaving it unfilled
 * renders a stated seam naming its owner, which is recoverable by one prop in
 * whichever later task settles it.
 *
 * L38793 also contradicts itself inside its own sentence — it opens "Every
 * other module on this surface", which is twelve, and then enumerates seven.
 * That is recorded here because it is the reason the enumeration cannot simply
 * be read as exhaustive, and it is not repaired.
 */
export const CC08_ACTION_NINE_DISAGREEMENT = {
  action: 9,
  actionName: 'Request an agent re-check',
  ownClaimLine: 37757,
  ownClaimText: 'exercises action 9 of `MOD-CC-13`',
  enumerationLine: 38793,
  enumerationOmitsThisModule: true,
  enumerationGivesActionNineTo: 'MOD-CC-04',
  railMounted: false,
  whyNotMounted:
    'L38793 is the enumeration over the ten operational actions and it does not name this ' +
    'module. Ten operational controls on a screen the enumeration does not name is the drift ' +
    'the closed set exists to prevent, and on this screen it would ship on the landing view of ' +
    'the two roles the panel is written for. The seam is rendered instead, naming MOD-CC-13 as ' +
    'its owner, so the absence is stated rather than discovered.',
  adopted: null,
} as const

/* ==================================================================== *
 * `AC-CC-090` FAILS ON THIS MODULE, AND IT FAILS ON TWO NAMED ROWS.
 * ==================================================================== */

/**
 * `AC-CC-090` (L35710) reads: "Every functionality in this chapter references
 * at least one `FB-CC-*` pattern." This module declares NINE functionalities
 * across four features. Counted off the source by reading each one's own
 * `Fallback:` clause — never by subtracting a span — **seven name a pattern
 * and two do not**:
 *
 *  - `FUNC-CC-0803-1-2` (L37791) — "Fallback: platform escalation fallback
 *    governs." Names a mechanism, not an `FB-CC-*` identifier.
 *  - `FUNC-CC-0804-1-1` (L37795) — "Fallback: not applicable."
 *
 * Both are honest sentences and neither satisfies the criterion as written.
 * The panel renders the failure rather than repairing it: inventing a pattern
 * for either would put this build's answer where the source declines to give
 * one, and `FB-CC-AGENT` is not the fallback for an escalation the platform
 * routes server-side.
 *
 * A SECOND ASYMMETRY, IN THE OTHER DIRECTION. The module's declared fallback
 * identifiers at L37772 are four — `FB-CC-AGENT`, `FB-CC-STALE`, `FB-CC-SESS`
 * and `FB-CC-WRITE` — and `FB-CC-WRITE` is named by NO functionality in the
 * list. L37772 attaches it to "a failed re-check request", which is row 9's
 * act. So the declared set and the referenced set differ in both directions,
 * and the count of each was taken separately.
 *
 * The nine below carry the source's own `Fallback:` clause verbatim, so the
 * classification can be checked against the words rather than against this
 * comment. `patterns` is derived from that clause by reading it, and the
 * covering suite re-reads the clause off the frozen source.
 */
export interface Cc08Functionality {
  readonly id: string
  readonly line: number
  /** The functionality's own `Fallback:` clause, verbatim, backticks kept. */
  readonly fallbackClause: string
  /** The `FB-CC-*` identifiers that clause names. Empty is the finding. */
  readonly patterns: readonly CcFallbackPatternId[]
}

export const CC08_FUNCTIONALITIES = [
  {
    id: 'FUNC-CC-0801-1-1',
    line: 37780,
    fallbackClause: 'Fallback: `FB-CC-STALE`.',
    patterns: ['FB-CC-STALE'],
  },
  {
    id: 'FUNC-CC-0801-1-2',
    line: 37781,
    fallbackClause: 'Fallback: `FB-CC-SESS`.',
    patterns: ['FB-CC-SESS'],
  },
  {
    id: 'FUNC-CC-0802-1-1',
    line: 37784,
    fallbackClause: 'Fallback: `FB-CC-AGENT`.',
    patterns: ['FB-CC-AGENT'],
  },
  {
    id: 'FUNC-CC-0802-1-2',
    line: 37785,
    fallbackClause: 'Fallback: `FB-CC-STALE`.',
    patterns: ['FB-CC-STALE'],
  },
  {
    id: 'FUNC-CC-0802-2-1',
    line: 37787,
    fallbackClause: 'Fallback: `FB-CC-STALE`.',
    patterns: ['FB-CC-STALE'],
  },
  {
    id: 'FUNC-CC-0803-1-1',
    line: 37790,
    fallbackClause: 'Fallback: `FB-CC-AGENT`.',
    patterns: ['FB-CC-AGENT'],
  },
  {
    id: 'FUNC-CC-0803-1-2',
    line: 37791,
    fallbackClause: 'Fallback: platform escalation fallback governs.',
    patterns: [],
  },
  {
    id: 'FUNC-CC-0803-1-3',
    line: 37792,
    fallbackClause: 'Fallback: `FB-CC-AGENT`.',
    patterns: ['FB-CC-AGENT'],
  },
  {
    id: 'FUNC-CC-0804-1-1',
    line: 37795,
    fallbackClause: 'Fallback: not applicable.',
    patterns: [],
  },
] as const satisfies readonly Cc08Functionality[]

/**
 * The four identifiers L37772 declares for this module, in its own order.
 * Separate from the seven the functionalities reference, because the two sets
 * are not the same set and collapsing them would hide `FB-CC-WRITE`.
 */
export const CC08_DECLARED_FALLBACKS = [
  'FB-CC-AGENT',
  'FB-CC-STALE',
  'FB-CC-SESS',
  'FB-CC-WRITE',
] as const satisfies readonly CcFallbackPatternId[]

/* ==================================================================== *
 * A THING THE STORYBOARD CANNOT SHOW, NAMED RATHER THAN SIMULATED.
 * ==================================================================== */

/**
 * `AC-CC-300` (L37801) requires the panel to list "the three standard agents
 * plus every deployed composed reasoning agent, each with all five status
 * fields", and `TEST-CC-300` (L37812) asks for "three standard agents and one
 * composed agent". The storyboard `SB-CC-19` supplies a status block of
 * exactly THREE rows (L37727-L37729) and no composed agent at all.
 *
 * So the composed-agent half of the criterion has no instance in the source,
 * and this panel does not invent one. A fourth row here would be a value this
 * build made up rendered as though the storyboard stated it — the defect the
 * whole slice guards against — and it would make the acceptance criterion look
 * demonstrated when what is demonstrated is three-fifths of it.
 */
export const CC08_COMPOSED_AGENT_GAP = {
  criterion: 'AC-CC-300',
  criterionLine: 37801,
  namedTest: 'TEST-CC-300',
  namedTestLine: 37812,
  storyboardAgentRows: 3,
  storyboardComposedAgents: 0,
  simulated: false,
  why:
    'The criterion and its named test both require a deployed composed reasoning agent, and ' +
    "SB-CC-19's status block carries three standard agents and none. A fourth row would be " +
    'this build inventing the instance the source withholds, so the gap is stated beside the ' +
    'three rows the storyboard does carry.',
} as const

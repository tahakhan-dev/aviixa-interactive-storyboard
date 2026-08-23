import {
  ownerAt,
  ownersOf,
  type FallbackContractOwner,
} from '@/ai/fallbacks/registry'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { resolveProvenance, type GuidanceElementFacts } from '@/ai/provenance/contract'
import { cellFromSource, type ColumnCell } from '@/policy/columns'
import { deny, type PermissionDecision } from '@/policy/decision'

/**
 * `MOD-CC-06`'S ARTIFICIAL-INTELLIGENCE OVERLAY — THE LANE A REVERSE CONTROL
 * THE SOURCE REQUIRES AND THE MODULE'S OWN MATRIX HAS NO ROW FOR, AND THE
 * DEGRADATION CONTRACT ITS REGISTER ROW NAMES BY A LITERAL FOUR CHAPTERS OWN.
 *
 * The module identity this overlays is L37257. Nothing here re-transcribes
 * the matrix, re-spells a role, re-declares a permission token or restates a
 * fallback contract: `./matrix.ts` holds the matrix, `@/policy/columns` holds
 * the cell parser, and `@/ai/fallbacks/registry` holds the contracts.
 *
 * ══ THE REVERSE CONTROL: NEITHER OMITTED NOR ENABLED, AND BOTH FROM ONE CELL
 *
 * `SB-AI-014` (L87729) requires that "the Lane A log must render each
 * refinement with a reverse control, because reversibility is a stated
 * property and a property with no control is a claim rather than a feature",
 * and in the same sentence records that **the source does not state who may
 * reverse a Lane A refinement** — `DEC-LANEA-001`, whose card is L87731 and
 * whose register row is L88904.
 *
 * THE EIGHT MATRIX ROWS NAME NO REVERSAL. L37294 to L37301 were read one at a
 * time and none of them names reversal, Lane A or an undo; that is not taken
 * on trust here either — `cc06RowsNamingReversal` scans the shipped matrix and
 * the unit suite proves the scan can find a row by ADDING one.
 *
 * SO THE AUTHORITY COMES FROM NOWHERE AND THE CAPABILITY COMES FROM A CELL.
 * L87739 is the Lane A row of the two-lane contract table, and its
 * `Reversible` column reads `` `Allowed` — reversible, authority carried as
 * `DEC-LANEA-001` ``. That one cell settles both halves and neither is a flag
 * anyone set:
 *
 *   - Its TOKEN is permissive. The reversal exists as a capability, so
 *     omitting the control would contradict the source. The control is drawn.
 *   - Its CONDITION names an open decision. No role holds the authority, so
 *     enabling it for the Quality Manager by analogy with the Lane B rows
 *     would invent one. The control is disabled and carries the identifier.
 *
 * `cc06ReversalDecision` derives the second from the first by reading the
 * identifier out of the cell's own condition, and THROWS on a cell that names
 * no open decision rather than disabling anyway — a function that disabled
 * regardless would be a hand-set flag wearing a function's name, which is the
 * defect shape this wave was told to expect.
 *
 * ── THE SOURCE CONTRADICTS ITSELF ABOUT THE AUTHORITY, AND BOTH SIDES RENDER
 *
 * L87729 says the source does not state who may reverse. L34196 states it: in
 * the matrix belonging to the module whose identity row is L34183, the row
 * `Reverse a Lane-A refinement` reads `Allowed — Lane A is reversible` for the
 * Quality Manager and `Allowed with conditions — where they hold the learning
 * read view` for a Supervisor with a grant. Those are real cells and this file
 * does not pretend otherwise.
 *
 * NEITHER SIDE IS OBEYED. That matrix belongs to a Standards and Operations
 * Studio module and this is the Client Command Center; adopting its cells here
 * would settle `DEC-LANEA-001` on a surface the row does not describe, and
 * `DEC-LANEA-001` is still an open register entry at L88904 — a matrix that
 * answered the question would not leave the register row standing. Both
 * readings render beside the disabled control.
 *
 * ══ THE DEGRADATION CONTRACT IS RESOLVED, NOT CHOSEN ═════════════════════
 *
 * This module's register row is L47537 and it names the fallback contract
 * `FB-AI-01`. That literal is owned by four different chapters, so a bare
 * lookup could only guess. The row sits under the section heading at L47453,
 * which is chapter 24's Client Command Center inventory, and chapter 24's own
 * owner of the literal is L46951 —
 * "Artificial-intelligence degraded or unavailable, including the platform
 * emergency pause. Fallback is authored content and deterministic behaviour,
 * never silence."
 *
 * That is the compound key doing its work, and it agrees with what §21.9
 * already says this module does when the agents are gone: L37383 has existing
 * proposals stay decidable and the queue state that proposal generation is
 * unavailable "so that an empty queue is not misread as a settled
 * configuration". An empty queue IS the silence the contract forbids.
 *
 * The other three owners render beside the resolved one. A reader holding the
 * bare literal cannot tell which contract they have, and a panel that showed
 * only the resolved owner would hide that from them.
 *
 * ══ WHAT PROVENANCE CLASS THIS OVERLAY EMITS ═════════════════════════════
 *
 * `PROV-6`, and it is RESOLVED by the shared contract from the facts below
 * rather than declared. Nothing in this panel is produced by a model, none of
 * it is earlier-approved content, no packaged value is compared and no named
 * person decided: the panel reports an absence and an open decision. The
 * absolute rule binds here in the direction that matters — a deterministic
 * rendering of an absence is never labelled live artificial intelligence.
 *
 * `PROV-6`'s treatment asks for a sentence naming the current operating mode.
 * **§21.9 names none of the sixteen modes anywhere in its span** — swept for
 * `AIMODE`, zero hits — so this module cannot supply one without inventing it,
 * and the statement it does supply is the module's own L37383 wording. That
 * gap is recorded in `CC06_LANEA_SEAM` with the surface that must close it.
 */

/* ==================================================================== *
 * THE REVERSE CONTROL.
 * ==================================================================== */

/**
 * The `Reversible` cell of the Lane A row at L87739, verbatim. The unit suite
 * splits that line on its own header and compares this against the cell it
 * finds in the `Reversible` column, so a drift in either direction fails.
 */
export const CC06_REVERSAL_CELL_TEXT =
  '`Allowed` — reversible, authority carried as `DEC-LANEA-001`'

/**
 * The cell, through the build's one source-cell parser. Nine tokens are
 * declared in `@/policy/columns` and none is re-declared here — the parser is
 * the closed vocabulary and a second copy of it is this build's most
 * persistent defect.
 */
export const CC06_REVERSAL_CELL: ColumnCell = cellFromSource(CC06_REVERSAL_CELL_TEXT)

/** The open-decision identifier a cell's stated condition names, or `null`. */
function openDecisionIn(cell: ColumnCell): string | null {
  return /DEC-[A-Z]+-\d+/.exec(cell.detail)?.[0] ?? null
}

/**
 * The decision `WriteControl` branches on, DERIVED from the cell.
 *
 * `WriteControl` draws nothing at all only for a `BASE_ROLE`
 * `explicitlyProhibited`; every other non-`allowed` outcome reaches its
 * disabled branch with the explanation attached. `clientDecisionRequired` is
 * therefore drawn, disabled, and carrying the identifier — which is the
 * rendering the open decision requires and the one an omission would lose.
 *
 * The stage is `BASE_ROLE` because the undecided question is precisely which
 * role holds the authority, and naming a later stage would report the cause
 * as something the source does not say it is.
 */
export function cc06ReversalDecision(cell: ColumnCell): PermissionDecision {
  const openDecision = openDecisionIn(cell)
  if (openDecision === null) {
    throw new Error(
      `The Lane A reversal cell "${cell.detail}" names no open decision. Its authority would ` +
        'then be stated somewhere, and this module must render that authority rather than a ' +
        'disabled control — re-read L87739 and decide the rendering again instead of ' +
        'defaulting to disabled.',
    )
  }
  return deny(
    'clientDecisionRequired',
    'DECISION_OPEN',
    `Who may reverse a Lane A refinement is not stated: ${openDecision}. The reversal itself is ` +
      `a stated property of Lane A — the cell's own token is "${cell.outcome}" — so this control ` +
      'is drawn rather than omitted, and it is disabled rather than granted to the Quality ' +
      'Manager by analogy with the Lane B rows, which would settle the decision by building it.',
    {
      stage: 'BASE_ROLE',
      sourceRefs: ['MOD-CC-06 L37257', 'L87739', 'SB-AI-014 L87729'],
      conditionToEnable: `Enabled when ${openDecision} names an authority.`,
    },
  )
}

/**
 * Every row of a matrix whose capability names reversal, Lane A or an undo.
 *
 * Generic over the row so the unit suite can prove the scan works by ADDING a
 * row rather than by counting the eight that are there. The pattern does NOT
 * match `Turn learning off`: that row names a NEGATIVE capability, so its
 * prohibition means the behaviour must not occur, and pulling it in here
 * would put a control where the source demands an absence.
 */
export function cc06RowsNamingReversal<T extends { readonly capability: string }>(
  rows: readonly T[],
): readonly T[] {
  return rows.filter((r) => /\brevers|\bundo\b|lane[ -]a\b/i.test(r.capability))
}

export interface Cc06Reading {
  readonly text: string
  readonly locator: string
}

export const CC06_REVERSE_CONTROL = {
  /** The control's label. The source's own name for the act, from L87807. */
  label: 'Reverse a Lane A refinement',
  cell: CC06_REVERSAL_CELL,
  /** Read out of the cell, never typed twice. */
  openDecision: openDecisionIn(CC06_REVERSAL_CELL) ?? '',
  requirement:
    'The Lane A log must render each refinement with a reverse control, because reversibility ' +
    'is a stated property and a property with no control is a claim rather than a feature.',
  requirementRef: 'SB-AI-014 · L87729',
  whyNotOmitted:
    'The Lane A row of the two-lane contract table states the reversal permissively and calls ' +
    'it reversible by design. A capability the source states and the screen does not draw is a ' +
    'claim with no control, which is the thing the storyboard names as the defect.',
  whyNotEnabled:
    'The same cell carries the authority as an open decision, and no role anywhere is named as ' +
    'holding it on this surface. Granting it to the Quality Manager because the Lane B rows ' +
    'grant her those would be inventing an authority out of an analogy.',
  readings: [
    {
      text:
        'The storyboard states plainly that the source does not say who may reverse a Lane A ' +
        'refinement, and raises the question as an open decision with the client’s product ' +
        'owner and the tenant’s quality lead as its owners.',
      locator: 'SB-AI-014 · L87729 · card L87731 · register row L88904',
    },
    {
      text:
        'A Standards and Operations Studio module’s own matrix answers it: its row "Reverse a ' +
        'Lane-A refinement" reads "Allowed — Lane A is reversible" for the Quality Manager and ' +
        '"Allowed with conditions — where they hold the learning read view" for a Supervisor ' +
        'with a grant. That matrix describes the Studio surface, and this is the Client ' +
        'Command Center.',
      locator: 'L34196, in the matrix whose identity row is MOD-STU-16 L34183',
    },
  ],
  whyNeitherIsObeyed:
    'Adopting the Studio matrix here would settle an open decision on a surface its row does ' +
    'not describe, and the decision’s register row still stands — a matrix that had answered ' +
    'the question would not leave it open. Both readings render; the control stays disabled.',
  alsoStatedAt: [
    {
      text:
        'The rollback-forms table calls the Lane A reversal reversible by design and logged, ' +
        'and carries the authority as the same open decision.',
      locator: 'L87807',
    },
  ],
} as const satisfies {
  readonly label: string
  readonly cell: ColumnCell
  readonly openDecision: string
  readonly requirement: string
  readonly requirementRef: string
  readonly whyNotOmitted: string
  readonly whyNotEnabled: string
  readonly readings: readonly Cc06Reading[]
  readonly whyNeitherIsObeyed: string
  readonly alsoStatedAt: readonly Cc06Reading[]
}

/* ==================================================================== *
 * THE DEGRADATION CONTRACT.
 * ==================================================================== */

const REGISTER_CHAPTER = '24'
const DEGRADATION_IDENTIFIER = 'FB-AI-01'

function resolvedOwner(): FallbackContractOwner {
  const owner = ownerAt(REGISTER_CHAPTER, DEGRADATION_IDENTIFIER)
  if (owner === null) {
    throw new Error(
      `The fallback registry holds no owner at (${REGISTER_CHAPTER}, ${DEGRADATION_IDENTIFIER}). ` +
        'MOD-CC-06’s register row L47537 names that literal bare and the row sits under chapter ' +
        '24, so the compound key is the only thing that resolves it — a bare lookup would return ' +
        'whichever of the four owners happens to be registered first.',
    )
  }
  return owner
}

export const CC06_DEGRADATION = {
  identifier: DEGRADATION_IDENTIFIER,
  /** The row naming this module and this literal on one line. */
  registerRow: 'L47537',
  /** The heading that row sits under, and the chapter the key is built on. */
  sectionHeadingRef: 'L47453',
  registerChapter: REGISTER_CHAPTER,
  resolved: resolvedOwner(),
  allOwnersOfTheBareLiteral: ownersOf(DEGRADATION_IDENTIFIER),
  whyTheCompoundKey:
    'The register row names the literal and not a chapter, and four chapters own that literal ' +
    'with four different contracts. The row’s own section heading is what disambiguates, so the ' +
    'contract is looked up on the pair and every other owner is shown rather than hidden.',
  agreesWithTheModule:
    'With agents unavailable no new proposals arise, existing proposals remain decidable because ' +
    'the decision is human and the application is pipeline machinery, and the queue states that ' +
    'proposal generation is unavailable so that an empty queue is not misread as a settled ' +
    'configuration. An empty queue is exactly the silence the contract forbids.',
  agreesWithTheModuleRef: 'L37383',
  aiBehaviourRef: 'L37381',
} as const

/* ==================================================================== *
 * PROVENANCE.
 * ==================================================================== */

/**
 * What this panel is, as the classification tree asks it. Every answer is a
 * no: it reports an absence and an open decision, and it is assembled by this
 * module from the frozen source at build time.
 */
export const CC06_DEGRADATION_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: false,
  packagedValueProducingAnOutcomeByComparison: false,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

/** Resolved by the shared contract. Never declared, so it cannot drift. */
export function cc06DegradationProvenance(): ProvenanceClassId {
  return resolveProvenance(CC06_DEGRADATION_FACTS).classId
}

/**
 * The sentence the class's treatment asks the surface for. It names what the
 * module itself says rather than one of the sixteen operating modes, because
 * §21.9 names none of them.
 */
export const CC06_DEGRADATION_STATEMENT =
  'Proposal generation is unavailable. Existing proposals remain decidable — the decision is ' +
  'human and the application is pipeline machinery — and this queue says so rather than showing ' +
  'an empty list, because an empty queue would read as a settled configuration.'

/* ==================================================================== *
 * THE SEAM.
 * ==================================================================== */

export interface Cc06SeamOwner {
  readonly path: string
  readonly whatItMustDo: string
}

/**
 * WHAT THIS MODULE COULD NOT CLOSE, AND WHO CAN.
 *
 * Three things, and none of them is closeable from this file's path list.
 */
export const CC06_LANEA_SEAM = {
  criterion: 'AC-AI-014-8',
  criterionRef: 'L87762',
  criterionText:
    'The learning view changes nothing and offers no write control other than the Lane A ' +
    'reversal, subject to DEC-LANEA-001.',
  theTension:
    'That criterion puts the reversal on the learning view, and FUNC-CC-0605-1-1 (L37434) ' +
    'prohibits every role from acting from that view — which is why the view as shipped draws no ' +
    'control of any kind. The two cannot both be built literally. The control is drawn here, on ' +
    'the Lane B approvals screen, where nothing prohibits acting; the view is untouched.',
  owners: [
    {
      path: 'src/surfaces/cc/modules/cc-06/LearningReadView.tsx',
      whatItMustDo:
        'Decide whether the Lane A reversal control belongs on the learning read view as well. ' +
        'Its own prohibition and this criterion disagree, and the wave that owns the shared ' +
        'read view owns that reconciliation. Nothing here presumes the answer.',
    },
    {
      path: 'src/disclosure/decisions.ts',
      whatItMustDo:
        'Carry DEC-LANEA-001 in the shared canon. It is in none of it today, so this module ' +
        'discloses it locally beside the control, which is the pattern already used here for ' +
        'the other uncanonised decision this module carries. A canon entry would let every ' +
        'consumer render one record instead of each writing its own.',
    },
  ],
  unestablished:
    'Which of the sixteen operating modes this module is in while proposal generation is ' +
    'unavailable. §21.9 names none of them anywhere in its span, so the panel states the ' +
    'module’s own wording and names no mode. The surface-level mode chip is where a mode would ' +
    'come from, and it is not this module’s to assign.',
} as const satisfies {
  readonly criterion: string
  readonly criterionRef: string
  readonly criterionText: string
  readonly theTension: string
  readonly owners: readonly Cc06SeamOwner[]
  readonly unestablished: string
}

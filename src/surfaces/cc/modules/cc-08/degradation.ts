import { AI_MODE_ROWS, aiMode, type AiModeId, type AiModeRow } from '@/ai/modes'
import { catalogueRow, type CatalogueRow } from '@/ai/failures/catalogue'
import { degradationStateProvenance } from '@/ai/agents/contracts'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { CC08_COLUMNS, CC08_MATRIX, type Cc08Column, type Cc08Row } from './matrix'

/**
 * `MOD-CC-08`'S ARTIFICIAL-INTELLIGENCE DEGRADATION OVERLAY.
 *
 * SLICE 9 SHIPPED THE MODULE. This file adds the depth the five wave-0
 * mechanisms make possible and nothing else: `./matrix.ts` still owns the
 * nine-row transcription, `./readings.ts` still owns the three divergences,
 * and neither is restated here. What is new is what the panel says while the
 * agents it exists to describe are not running.
 *
 * ── WHY THIS PANEL AND NOT ANOTHER ───────────────────────────────────────
 *
 * The source names this screen, by name, in the one storyboard that puts a
 * single artificial-intelligence state on all five surfaces at once. SB-42-301
 * (L89348): "Sam's Client Command Center agent activity panel carries the
 * banner". No other Command Center module is named in that sentence, and the
 * module's own `No-artificial-intelligence behaviour` paragraph (L37753) says
 * the panel "is therefore fully functional during an outage, which is exactly
 * when a tenant most needs it". Those two lines are why the overlay is depth
 * rather than a banner bolted on.
 *
 * ── THE FINDING, AND IT IS MECHANICAL ────────────────────────────────────
 *
 * `AC-42-303` requires a paused platform to be distinguishable from an
 * unreachable one on every surface that shows a state. Wave 0 measured that
 * `AIMODE-13` and `AIMODE-14` are byte-identical across all five columns of
 * the mode contract matrix — same worker label, same invocation, same
 * deterministic safety, same escalation delivery, same classification. **A
 * panel rendering off the mode matrix alone therefore CANNOT satisfy
 * `AC-42-303` for that pair**, and would show a tenant suspension and a
 * platform suspension as the same screen.
 *
 * The failure catalogue does distinguish them, and it distinguishes them in
 * the column this surface is: `FAIL-AI-41` and `FAIL-AI-42` carry different
 * text under the header at L90507, "Exact user-visible message, tenant web
 * surfaces". So the message comes from the catalogue and the state comes from
 * the mode machine, and `CC08_PAUSE_DISTINGUISHABILITY` below COMPUTES both
 * halves rather than asserting either — a stale literal saying the modes
 * differ would be exactly the hand-assigned discriminator this slice keeps
 * finding wrong.
 *
 * ── THE JOIN IS A BUILD INFERENCE AND IS LABELLED ONE ────────────────────
 *
 * Measured, and the first measurement taken here was WRONG and its own test
 * caught it. Three lines of the frozen source do name an `AIMODE-` identifier
 * and a `FAIL-AI-` identifier together — L89295, L90158 and L90173 — so "the
 * source never joins the two vocabularies" is false and is not claimed. What
 * is true is narrower and is the claim this file makes: **not one of those
 * three lines concerns a pause.** None names `FAIL-AI-41`, `FAIL-AI-42`,
 * `AIMODE-13` or `AIMODE-14`. The pause join in particular is unwritten.
 *
 * Pairing `AIMODE-14` with `FAIL-AI-41` is therefore this build's reading, not
 * the source's statement, and it is
 * carried as `inference` on every record. What makes the reading checkable
 * rather than asserted is that BOTH SIDES name their own scope in their own
 * words — the mode row's name ("Platform suspension", "Tenant suspension") and
 * the catalogue row's failure-mode cell ("Emergency pause, platform-wide",
 * "Emergency pause, per tenant") — so `pauseScopeOf` reads the scope off each
 * side independently and `cc08PauseStates()` refuses to build a pair whose two
 * sides disagree. A mis-pairing is a thrown error, not a wrong screen.
 *
 * ── WHAT IT DOES NOT DO ──────────────────────────────────────────────────
 *
 * No control is added. `AC-CC-301` (L37802) allows no control on this panel
 * that switches, configures or fixes an agent, and a pause is a Super Admin
 * console act (L90552: "Resume at 12:04 is a separate audited act by Aisha").
 * The overlay is text and state, and the two cross-chapter contradictions this
 * module owns are CONSUMED from `@/ai/agents/contracts` by identifier rather
 * than transcribed a second time — wave 1 registered both, with the locators
 * this task's own brief got wrong in one place and right in the other.
 *
 * ── OPERATIONAL SEVERITY IS NOT MANUFACTURING SEVERITY ───────────────────
 *
 * `FAIL-AI-41` is `Critical` and `FAIL-AI-42` is `Major` in the OPERATIONAL
 * vocabulary of the response spine's item 2. `AC-43-103` requires the two
 * severity worlds to share no rendering component, so the band is carried here
 * as the catalogue's own string and drawn by this module's own plain markup.
 * Nothing from slice 6 or slice 9 is imported to draw it.
 *
 * This module is data and four small folds. It renders nothing.
 */

/* ==================================================================== *
 * THE PROVENANCE CLASS THIS OVERLAY EMITS — ONE, AND COMPUTED.
 * ==================================================================== */

/**
 * Every element this overlay adds is a statement that an agent is not running.
 * That is produced by no model in this session, is not approved content, is
 * not a packaged value compared against anything, and records no person's
 * instruction — so `resolveProvenance` returns the class named "Artificial
 * intelligence unavailable".
 *
 * COMPUTED THROUGH `degradationStateProvenance()`, never written down. The
 * absolute rule at L89439 binds hardest exactly here: cached approved guidance
 * and deterministic rules are "never, on any surface, in any locale, under any
 * failure condition, labelled or described as live artificial intelligence",
 * and a pause banner is the surface most tempted to imply a model produced it.
 */
export const CC08_DEGRADATION_PROVENANCE: ProvenanceClassId = degradationStateProvenance()

/* ==================================================================== *
 * THE PAUSE BANNER — SPELLED MORE THAN ONCE, AND NOT IDENTICALLY.
 * ==================================================================== */

/**
 * WHAT A CLIENT SEES ON THIS PANEL WHEN THE AGENTS ARE PAUSED, AS THE
 * SOURCE SPELLS IT — SEVERAL TIMES, DIFFERENTLY, AND ACROSS TWO SCOPES.
 *
 * Every one of these was opened by hand, and the list is SWEPT rather than
 * collected: the covering suite walks the three spans these lines sit in and
 * fails on any line carrying the banner that is not registered here. That
 * sweep is what found the per-tenant spelling this list first omitted.
 *
 * They are kept as STATEMENTS rather than as readings because two of them
 * carry the same words modulo a full stop, and collapsing statements into
 * readings before counting is how a spelling count gets written down for a
 * message that has fewer distinct texts. `distinctPauseBannerTexts()` does the
 * collapsing, so the two figures cannot be confused for each other and neither
 * is written into a sentence.
 *
 * ONE OF THEM IS LABELLED EXACT BY ITS OWN TABLE and the others are not. That
 * is a fact about the source's own header (L90507, "Exact user-visible
 * message, tenant web surfaces"), not an adjudication by this build, which is
 * why `labelledExactBySource` is a property of the statement rather than a
 * winner recorded somewhere. All of them render. None is corrected.
 *
 * AND THE SCOPE FIELD IS THE `AC-42-303` PROBLEM SHOWING UP IN THIS BUILD'S
 * OWN REGISTER. Most spellings name the platform-wide pause and one names the
 * per-tenant pause — but the surface's own state register (L48474) spells the
 * banner with NO SCOPE AT ALL, under a state named simply
 * `Artificial-intelligence-unavailable`. A tenant reading that line cannot
 * tell whether their workspace was paused or the platform was, which is the
 * distinction `AC-42-303` exists to protect. Recorded as `null`, not guessed.
 */
export interface Cc08PauseBannerStatement {
  /** The banner text as that line writes it, without its enclosing quotes. */
  readonly text: string
  readonly line: number
  /** Where in the source this spelling sits, in the source's own naming. */
  readonly where: string
  /**
   * The scope this spelling itself names, or `null` where it names none.
   * `null` is a finding and is rendered as one; it is never a default.
   */
  readonly scope: Cc08PauseScope | null
  /**
   * True only where the table this statement sits in calls its own column an
   * exact user-visible message. A property of the source's header, never a
   * preference of this build's.
   */
  readonly labelledExactBySource: boolean
}

export const CC08_PAUSE_BANNER_STATEMENTS = [
  {
    text: 'Agents paused by the platform — deterministic safety checks are unaffected',
    line: 89_348,
    where: 'SB-42-301, the five-surface pause storyboard, which names this panel by name',
    scope: 'platform-wide',
    labelledExactBySource: false,
  },
  {
    text: 'Agents paused by the platform. Deterministic checks are unaffected.',
    line: 90_513,
    where:
      "FAIL-AI-41's row of Table A, under the header at L90507 — \"Exact user-visible message, " +
      'tenant web surfaces"',
    scope: 'platform-wide',
    labelledExactBySource: true,
  },
  {
    text: 'Agents paused by the platform for this workspace.',
    line: 90_514,
    where:
      "FAIL-AI-42's row of the same table — the per-tenant pause, and the only spelling that " +
      'says which of the two scopes it is',
    scope: 'per tenant',
    labelledExactBySource: true,
  },
  {
    text: 'Agents paused by the platform',
    line: 90_552,
    where: "the Illustrative Example for FAIL-AI-41, which says the Command Center \"shows\" it",
    scope: 'platform-wide',
    labelledExactBySource: false,
  },
  {
    text: 'Agents paused by the platform.',
    line: 48_474,
    where:
      "the surface's own state register (headed for `SCR-CC-02` at L48460, a different screen " +
      'from this one), row STATE-11 Artificial-intelligence-unavailable — and it names no scope',
    scope: null,
    labelledExactBySource: false,
  },
] as const satisfies readonly Cc08PauseBannerStatement[]

/**
 * The distinct texts, computed. Never a number written into a comment: the
 * statements are one population and the texts they carry are a smaller one,
 * and whichever figure a reader wants they get by asking rather than by
 * trusting a sentence that will go stale.
 */
export function distinctPauseBannerTexts(): readonly string[] {
  return [...new Set(CC08_PAUSE_BANNER_STATEMENTS.map((s) => s.text))]
}

/**
 * The spellings that name no scope. Non-empty is the finding, and it is
 * computed so that a source correction would empty it rather than leave a
 * paragraph here saying something that stopped being true.
 */
export function scopelessPauseBannerStatements(): readonly Cc08PauseBannerStatement[] {
  return CC08_PAUSE_BANNER_STATEMENTS.filter((s) => s.scope === null)
}

/**
 * The statement whose own table calls itself exact, FOR ONE SCOPE.
 *
 * Scoped rather than global, and the first version of this function was not —
 * it asked for exactly one exact spelling in the whole list and threw once the
 * per-tenant row joined it. Two exact spellings for two different scopes is
 * the source being precise, not the source contradicting itself; two for ONE
 * scope would be two tables claiming exactness for different words, and that
 * is a finding this build has no authority to settle, so it throws.
 */
export function exactPauseBannerStatement(scope: Cc08PauseScope): Cc08PauseBannerStatement {
  const exact = CC08_PAUSE_BANNER_STATEMENTS.filter(
    (s) => s.labelledExactBySource && s.scope === scope,
  )
  if (exact.length !== 1) {
    throw new Error(
      `MOD-CC-08's "${scope}" pause banner has ${exact.length} spellings labelled exact by ` +
        'their own table. The table at L90507 calls its column an exact user-visible message ' +
        'and gives one row per scope; anything else is two source tables claiming exactness ' +
        'for different words, and this build may not pick between them.',
    )
  }
  return exact[0]!
}

/* ==================================================================== *
 * THE TWO PAUSES, PAIRED BY A SCOPE EACH SIDE STATES FOR ITSELF.
 * ==================================================================== */

/** The two scopes a pause can have here, in the source's own two words. */
export type Cc08PauseScope = 'platform-wide' | 'per tenant'

export const CC08_PAUSE_SCOPES = [
  'platform-wide',
  'per tenant',
] as const satisfies readonly Cc08PauseScope[]

type MissingFromScopes = Exclude<Cc08PauseScope, (typeof CC08_PAUSE_SCOPES)[number]>
const _scopesExhaustive: MissingFromScopes extends never ? true : never = true
void _scopesExhaustive

/**
 * The scope a sentence states about itself, or `null` where it states none.
 *
 * DELIBERATELY NOT A CLASSIFIER OVER THE WHOLE SENTENCE. It looks for the
 * source's own scope words and nothing else, and it returns `null` rather than
 * guessing, because a scope resolver that always answers is how "per tenant"
 * becomes "platform-wide" on a screen a tenant reads. A sentence naming both
 * is `null` too — that is ambiguity, not a tie.
 */
export function pauseScopeOf(sentence: string): Cc08PauseScope | null {
  const lowered = sentence.toLowerCase()
  const named = CC08_PAUSE_SCOPES.filter((scope) => {
    if (scope === 'platform-wide') return lowered.includes('platform')
    return lowered.includes('tenant')
  })
  return named.length === 1 ? named[0]! : null
}

/**
 * One pause, as the mode machine names it and as the failure catalogue
 * messages it. The two halves are joined on a scope each states for itself.
 */
export interface Cc08PauseState {
  readonly scope: Cc08PauseScope
  readonly mode: AiModeRow
  readonly failure: CatalogueRow
  /**
   * What this panel puts on screen, taken from the catalogue's own tenant-web
   * cell. NEVER spelled in this file — a second spelling of an "exact
   * user-visible message" is the defect the label exists to prevent.
   */
  readonly tenantWebMessage: string
  /**
   * The operational band, as the catalogue's own cell writes it. A string and
   * not a component: `AC-43-103` forbids sharing a rendering with the
   * manufacturing severity catalogue.
   */
  readonly operationalSeverity: string
  /** Why this mode and this failure are one row here, said plainly. */
  readonly inference: string
}

/**
 * The candidate pairs, as identifiers only. No scope, no message and no band
 * is written here — all three are read off the two records this names, so a
 * row cannot claim a scope its own halves do not carry.
 */
const PAUSE_PAIRS = [
  { modeId: 'AIMODE-14', failureId: 'FAIL-AI-41' },
  { modeId: 'AIMODE-13', failureId: 'FAIL-AI-42' },
] as const satisfies readonly { readonly modeId: AiModeId; readonly failureId: string }[]

const INFERENCE =
  'The frozen source joins the two vocabularies on three lines and not one of them concerns a ' +
  'pause: no line names a pause mode and a pause failure together. So this pairing is a build ' +
  'inference under `APP-012` and not the source\'s own ' +
  'statement. It is joined on the scope each side names for itself — the mode row\'s name ' +
  'against the catalogue row\'s failure-mode cell — and a pair whose halves disagree is a thrown ' +
  'error rather than a rendered guess.'

/**
 * The two pause states, built and checked. Both halves must agree about scope
 * and the two rows must not land on the same scope; either way it throws.
 */
export function cc08PauseStates(): readonly Cc08PauseState[] {
  const states = PAUSE_PAIRS.map((pair): Cc08PauseState => {
    const mode = aiMode(pair.modeId)
    const failure = catalogueRow(pair.failureId)
    const fromMode = pauseScopeOf(mode.name)
    const fromFailure = pauseScopeOf(failure.cells.failureMode)
    if (fromMode === null || fromFailure === null || fromMode !== fromFailure) {
      throw new Error(
        `MOD-CC-08 pairs ${pair.modeId} ("${mode.name}") with ${pair.failureId} ` +
          `("${failure.cells.failureMode}") on scope. The mode side reads ${String(fromMode)} ` +
          `and the failure side reads ${String(fromFailure)}. A pause whose two halves disagree ` +
          'about whether it is one tenant or the whole platform is the exact distinction ' +
          '`AC-42-303` exists for, and it is refused rather than rendered.',
      )
    }
    return {
      scope: fromMode,
      mode,
      failure,
      tenantWebMessage: failure.cells.tenantWebMessage,
      operationalSeverity: failure.cells.operationalSeverity,
      inference: INFERENCE,
    }
  })
  const scopes = new Set(states.map((s) => s.scope))
  if (scopes.size !== states.length) {
    throw new Error(
      'MOD-CC-08 resolved two pause states onto one scope. Two rows carrying one scope means ' +
        'the panel shows one screen for both, which is what `AC-42-303` forbids.',
    )
  }
  return states
}

/* ==================================================================== *
 * `AC-42-303`, ANSWERED BY MEASUREMENT RATHER THAN BY CLAIM.
 * ==================================================================== */

/**
 * The five columns of the mode contract matrix, as `AiModeRow` fields. Not the
 * whole record: `matrixLocator` differs between any two rows by construction
 * and `workerLabelProse`/`proseLocator` are §42.3 prose rather than the
 * contract, so including any of them would make every pair of modes look
 * distinguishable and the check would pass on nothing.
 */
const MODE_CONTRACT_COLUMNS = [
  'workerLabel',
  'agentInvocation',
  'deterministicSafety',
  'escalationDelivery',
  'classification',
] as const satisfies readonly (keyof AiModeRow)[]

export interface Cc08PauseDistinguishability {
  /** Which columns of the mode contract matrix separate the two pause modes. */
  readonly modeContractColumnsThatDiffer: readonly string[]
  /** Whether the tenant-web message separates them. */
  readonly tenantWebMessagesDiffer: boolean
  /** What this panel therefore renders the distinction FROM. */
  readonly distinguishedBy: 'the mode contract matrix' | 'the failure catalogue' | 'nothing'
}

/**
 * WHETHER THIS PANEL CAN TELL A PAUSED TENANT FROM A PAUSED PLATFORM, AND
 * ON WHAT.
 *
 * Both halves are computed off the wave-0 records every time this is called.
 * The point is that the mode side comes out EMPTY: `AIMODE-13` and `AIMODE-14`
 * agree on all five contract columns, so a panel keyed on the mode matrix
 * shows one screen for two states a human must respond to differently. The
 * catalogue's tenant-web cell is what separates them, and that is why the
 * banner is read from there.
 *
 * Written as a measurement rather than a constant so that a later edit closing
 * the mode-matrix gap changes this answer instead of leaving a comment that
 * used to be true.
 */
export function cc08PauseDistinguishability(): Cc08PauseDistinguishability {
  const [first, second] = cc08PauseStates()
  if (first === undefined || second === undefined) {
    throw new Error('MOD-CC-08 needs both pause states to answer AC-42-303.')
  }
  const modeContractColumnsThatDiffer = MODE_CONTRACT_COLUMNS.filter(
    (column) => first.mode[column] !== second.mode[column],
  )
  const tenantWebMessagesDiffer = first.tenantWebMessage !== second.tenantWebMessage
  const distinguishedBy =
    modeContractColumnsThatDiffer.length > 0
      ? ('the mode contract matrix' as const)
      : tenantWebMessagesDiffer
        ? ('the failure catalogue' as const)
        : ('nothing' as const)
  return { modeContractColumnsThatDiffer, tenantWebMessagesDiffer, distinguishedBy }
}

/**
 * The modes that carry a pause state's worker label, for every pause state.
 * `modesCarryingWorkerLabel` returns an ARRAY because three labels have two
 * owners each, and this is the pair that proves why: the label alone resolves
 * to both suspensions, so nothing on this panel may key on it.
 */
export function modesSharingAPauseLabel(): readonly AiModeId[] {
  const labels = new Set(cc08PauseStates().map((s) => s.mode.workerLabel))
  return AI_MODE_ROWS.filter((row) => labels.has(row.workerLabel)).map((row) => row.id)
}

/* ==================================================================== *
 * THE ROLL-UP LEAK — DERIVED FROM THE CELLS, NEVER RESTATED.
 * ==================================================================== */

/**
 * THE TENANT ADMIN IS BARRED FROM THE FLAGS AND GRANTED THEIR AGGREGATE,
 * ONE ROW APART IN ONE MATRIX.
 *
 * This is the contradiction the module owns, and under degradation it stops
 * being a curiosity: the agent health flags ARE the degradation state. L37669
 * refuses the Tenant Admin the flags; L37670 grants them, with conditions, the
 * cross-Area roll-up of the very flags they may not see. `./readings.ts`
 * already records a DIFFERENT question about L37670 — whether the grant is
 * reachable through the door at all — and that record is not duplicated here.
 * What is new is the internal one: the same role, the same matrix, two
 * adjacent rows, opposite answers about one class of fact.
 *
 * BOTH OUTCOMES ARE READ OFF THE CELLS. Nothing below writes down that one row
 * is prohibited and the other is granted; `cc08HealthFlagRollUpLeak()` reads
 * both cells through the header-keyed map `./matrix.ts` builds off L37664 and
 * reports what it finds. If a transcription ever changed either cell the
 * finding would change with it rather than persisting as a stale sentence —
 * and if the two rows ever agreed, there would be no leak to report and the
 * fold says so.
 */
export interface Cc08RollUpLeak {
  readonly column: Cc08Column
  /** "See agent health flags", with the cell the Tenant Admin gets. */
  readonly flags: { readonly row: Cc08Row; readonly cellText: string }
  /** "See the cross-Area agent health roll-up", same column. */
  readonly rollUp: { readonly row: Cc08Row; readonly cellText: string }
  /**
   * True where the two cells carry different tokens — computed, so a matrix in
   * which they agreed would report no leak instead of reporting this sentence.
   */
  readonly tokensDiffer: boolean
  readonly disclosure: string
}

const findRow = (test: RegExp): Cc08Row => {
  const found = CC08_MATRIX.filter((row) => test.test(row.capability))
  if (found.length !== 1) {
    throw new Error(
      `MOD-CC-08's matrix has ${found.length} rows matching ${String(test)}. The roll-up leak ` +
        'is a statement about two named rows and it cannot be made about none or about several.',
    )
  }
  return found[0]!
}

/** The column the leak is on. Checked against the header's own five words. */
const LEAK_COLUMN: Cc08Column = 'Tenant Admin'

export function cc08HealthFlagRollUpLeak(): Cc08RollUpLeak {
  if (!CC08_COLUMNS.includes(LEAK_COLUMN)) {
    throw new Error(
      `"${LEAK_COLUMN}" is not one of the columns L37664 names. The column is reached by the ` +
        "header's own word and never by position: this matrix runs Tenant Admin first and " +
        'chapter 44 runs Worker first, and an index carried across the two inverts both roles.',
    )
  }
  const flagsRow = findRow(/^See agent health flags$/)
  const rollUpRow = findRow(/agent health roll-up$/)
  const flagsCell = flagsRow.cells[LEAK_COLUMN]
  const rollUpCell = rollUpRow.cells[LEAK_COLUMN]
  return {
    column: LEAK_COLUMN,
    flags: { row: flagsRow, cellText: flagsCell.text },
    rollUp: { row: rollUpRow, cellText: rollUpCell.text },
    tokensDiffer: flagsCell.token !== rollUpCell.token,
    disclosure:
      'The roll-up is an aggregate of the flags, so a role refused the flags and granted the ' +
      'aggregate can read the same fact by arithmetic. The source states both and reconciles ' +
      'neither, and this build settles nothing: both cells render with their own lines, and ' +
      'nothing on this panel derives the roll-up from flags the viewer may not see. Under a ' +
      'pause the two rows are about one thing — the agent health flag IS the degradation ' +
      'state that L37654 requires to be shown honestly.',
  }
}

/* ==================================================================== *
 * WHAT THE PANEL DOES WITH NO AGENTS AT ALL.
 * ==================================================================== */

/**
 * The module's own `No-artificial-intelligence behaviour` paragraph, and the
 * three neighbouring rules that make it checkable rather than a promise. Each
 * is the source's own claim at its own line; none is this build's summary.
 *
 * These are quoted rather than paraphrased because the panel renders them and
 * `AC-CC-304` (L37805) is about the words: "an immediate plain-language flag
 * naming what was not produced".
 */
export interface Cc08NoAiClaim {
  readonly id: string
  readonly claim: string
  readonly line: number
}

export const CC08_NO_AI_CLAIMS = [
  {
    id: 'fully-functional-during-an-outage',
    claim:
      'With agents unavailable the panel is at its most important: it states each agent\'s ' +
      'unavailable state in plain terms, names what was not produced, and confirms that ' +
      'platform operations has been notified. The activity log continues to render its ' +
      'historical entries. The panel is therefore fully functional during an outage, which is ' +
      'exactly when a tenant most needs it.',
    line: 37_753,
  },
  {
    id: 'renders-no-interpretation-of-its-own',
    claim:
      'The panel is the surface\'s window onto agent behaviour, and it renders only ' +
      'agent-produced records — activations, outputs, health. It performs no interpretation of ' +
      'its own.',
    line: 37_751,
  },
  {
    id: 'the-per-tenant-flag-continues-through-a-platform-incident',
    claim:
      'Degradation visible across more than one tenant is a platform incident, owned and ' +
      'handled by the client\'s platform operations team in the Super Admin platform console — ' +
      'the tenant-facing panel keeps showing the honest per-tenant flag throughout',
    line: 37_654,
  },
  {
    id: 'nothing-is-back-filled-as-though-produced-on-time',
    claim:
      'Outputs missed during an outage are not back-filled as though they had been produced on ' +
      'time; the gap remains visible in the log.',
    line: 37_774,
  },
] as const satisfies readonly Cc08NoAiClaim[]

/* ==================================================================== *
 * SEAMS THIS TASK LEAVES OPEN, EACH WITH ITS OWNER.
 * ==================================================================== */

/** A declared seam nobody picks up is a defect, so each one names its owner. */
export interface Cc08DegradationSeam {
  readonly id: string
  readonly what: string
  readonly owner: string
}

export const CC08_DEGRADATION_SEAMS = [
  {
    id: 'state-11-is-registered-against-another-screen',
    what:
      'The surface\'s state register carries `STATE-11 Artificial-intelligence-unavailable` ' +
      'with a spelling of this panel\'s pause banner in its seen-text, and that register is ' +
      "headed \"Full state inventory for `SCR-CC-02`, the live shift board\" (L48460) — a " +
      'different screen from this one. SB-42-301 (L89348) names THIS panel as the Command ' +
      'Center surface that carries the banner. So one message is registered against one screen ' +
      'and storyboarded on another, and this file discloses the spelling rather than claiming ' +
      'the state.\n\n' +
      'AND THE ROW ITSELF NAMES NO MODULE. The state row has two columns, State and What the ' +
      'user actually sees; the module attribution in this build\'s own register is a join from ' +
      'the screen to its owning module, not something the row says. A first draft of this seam ' +
      'cited that module identifier at the state row\'s line and `locator-fidelity` caught it — ' +
      'the line was opened and the citation corrected rather than the file allow-listed.',
    owner:
      '`src/surfaces/cc/modules/cc-02/chrome.ts` holds the register rows and the screen-to-' +
      'module join; the live shift board owns the state. Neither is on this task\'s path list.',
  },
  {
    id: 'no-mode-to-failure-join-in-the-source',
    what:
      'The mode machine and the failure catalogue never reference each other. Two of the ' +
      'sixteen modes are pauses and two of the sixty failures are pauses, and nothing in the ' +
      'frozen source says which is which. This module joins them on scope for its own two ' +
      'rows; every other surface that renders a mode beside a failure will need the same join, ' +
      'and four private copies of it is the duplicate-vocabulary shape this build keeps ' +
      'shipping.',
    owner:
      'A shared join belongs in `src/ai/`, which this task may import and may not edit. Wave 3 ' +
      "task 14 builds the pause/kill/rollback console and is the first caller with a second " +
      'need for it.',
  },
  {
    id: 'deterministic-boundary-had-no-route',
    what:
      'CLOSED, AND KEPT RATHER THAN DELETED, BECAUSE THE INTERVAL IS THE PART WORTH HAVING. ' +
      "As reported: `src/ui/shared/DeterministicBoundary.tsx` RECORDED that nothing under " +
      '`app/` rendered it and asked whoever mounted the first one to close that paragraph. This ' +
      "panel mounted it, under the pause banner, because SB-42-301's own sentence is that " +
      'deterministic safety checks are unaffected — so the paragraph in that file WAS stale, and ' +
      'this task could not edit it.\n\n' +
      'AS IT STANDS NOW: that paragraph reads "IT IS REACHABLE FROM A ROUTE, AND THAT PARAGRAPH ' +
      'IS NOW CLOSED", names `src/surfaces/cc/modules/cc-08/AgentActivityPanel.tsx` as its ' +
      'importer and `app/command-center/agent-activity-panel/page.tsx` as its route, and cites ' +
      'this seam as what predicted the staleness. The prediction was the value: the seam named a ' +
      'file it could not edit, said what would go wrong in it, and assigned the close — and the ' +
      'close was performed and recorded there rather than discovered later by a reader.\n\n' +
      'WHAT KEPT THIS ROW FROM ROTTING THE WAY THE PARAGRAPH DID, WHILE IT LASTED. Past tense is ' +
      'prose and prose is not a gate, so the closure was asserted rather than stated: ' +
      '`tests/unit/cc-08.test.ts` walked import specifiers from every file under `app/` and ' +
      'required `src/ui/shared/DeterministicBoundary.tsx` to be reachable, unmounting it would ' +
      'have turned the row red. APP-020 (master prompt §2.3) deleted that suite along with the ' +
      'rest of `tests/`, and no surviving script re-walks this import graph, so nothing today ' +
      'would catch an unmount. Past tense is prose and prose is not a gate.',
    owner:
      'CLOSED — no owner outstanding. Was `src/ui/shared/DeterministicBoundary.tsx`, import-only ' +
      'for this task, assigned to wave 5 task 20 or task 21; one of them performed it.',
  },
] as const satisfies readonly Cc08DegradationSeam[]

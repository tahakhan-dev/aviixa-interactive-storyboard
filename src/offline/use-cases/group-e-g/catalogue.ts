/**
 * THE MANDATORY OFFLINE USE-CASE CATALOGUE — GROUPS E, F AND G.
 *
 * `## 37A. Mandatory Offline Use-Case Catalog` opens at L81202. Seventy
 * entries in seven groups. This module owns three of them:
 *
 *   E — Commands That Arrive Late                        heading L81496
 *   F — Conflicts and Reconciliation                     heading L81590
 *   G — Device, Infrastructure and Long-Horizon Recovery heading L81657
 *
 * Groups A through D are another task's and are not transcribed here.
 *
 * ── OWNERSHIP IS DERIVED FROM THE ENTRY, NEVER FROM THE SPAN ───────────────
 *
 * The dispatch's arithmetic — A 10, B 10, C 10, D 10, E 11, F 10, G 10, sum
 * 71 against a catalogue of 70 — is CONFIRMED, and so is its diagnosis.
 * Counted here rather than inferred:
 *
 *   Group E's span holds ELEVEN distinct `UC-OFF-*` identifiers and TEN
 *   entries. The eleventh is `UC-OFF-036`, which belongs to group D, and it
 *   appears at L81532 inside `UC-OFF-042`'s Numbered steps — "as
 *   `UC-OFF-036` steps 7 through 9". A count that scans E's span reports
 *   eleven and is wrong about ownership by exactly that row.
 *
 * The dispatch also asked whether the same shape occurs unnoticed in F or G.
 * MEASURED: it does not. F's span holds exactly `UC-OFF-051`..`060` and G's
 * exactly `UC-OFF-061`..`070`. What F and G do carry is the same DEFERRAL
 * IDIOM pointing INWARDS — `UC-OFF-053` defers its Permissions and its
 * artificial-intelligence behaviour to `UC-OFF-051`, `UC-OFF-058` names
 * `UC-OFF-059` as its fallback-of-fallback, and in E `UC-OFF-047` defers its
 * Roles to `UC-OFF-046`. Five deferrals across the thirty entries; exactly
 * one crosses a group boundary. `DEFERRALS` carries all five so the next
 * reader does not have to re-derive which is which.
 *
 * Two more cross-references sit OUTSIDE every group span and so belong to no
 * group: §37B's dependency diagram names `UC-OFF-048` at L81745 and
 * `UC-OFF-061` at L81754. A sweep bounded by "after group G's heading"
 * rather than by group G's last entry picks both up.
 *
 * ── TWELVE DIAGRAMS, FIFTY-EIGHT REUSERS; SEVEN AND TWENTY-THREE HERE ──────
 *
 * L81212 states the rule and names the twelve representatives. MEASURED over
 * L81202-L81721: thirteen ```mermaid fences, of which the first (L81226) is
 * the catalogue map, leaving twelve use-case diagrams — the claim reconciles.
 * L81277's `AC-37A-004` states the complement as fifty-eight.
 *
 * Seven of the twelve are in these groups: `UC-OFF-041`, `UC-OFF-048` and
 * `UC-OFF-049` in E; `UC-OFF-051` and `UC-OFF-055` in F; `UC-OFF-062` and
 * `UC-OFF-070` in G. The other twenty-three entries name the one they reuse.
 * `diagramSourceFor` resolves a reuser to its representative's fence, which
 * is what "render the reuse as a pointer" means here — no diagram is copied,
 * and no entry is left without one.
 *
 * The group-level reuse statements (L81528, L81617, L81681) and the thirty
 * per-entry declarations agree on every one of the thirty. That is a
 * reconciled count a gate can rest on, and the gate reads the entries rather
 * than the sentences.
 *
 * ── FOUR CARRIERS SPLIT THEIR ENTRY ACROSS TWO LINES ───────────────────────
 *
 * `UC-OFF-041`, `UC-OFF-051` and `UC-OFF-062` place their diagram ABOVE and
 * keep the whole entry on one line. `UC-OFF-048`, `UC-OFF-049`, `UC-OFF-055`
 * and `UC-OFF-070` place it BELOW: their title and identifier metadata sit on
 * one line and the remaining fields on another, after the fence. Every entry
 * therefore has both a `headingLine` and a `bodyLine`, equal for twenty-six
 * of the thirty. A transcription that assumed one line per entry loses four
 * entries' bodies entirely.
 *
 * Field counts, counted rather than assumed: twenty-eight entries carry the
 * seventeen-field shape, and two carry an eighteenth — and the eighteenths
 * are DIFFERENT fields. `UC-OFF-046` adds `Preserved contradiction` (L81540)
 * and `UC-OFF-050` adds `Note on an unspecified value` (L81588). Both are
 * carried verbatim in `extraField` because both are the source disclosing
 * something it refuses to settle.
 *
 * ── THE PERMISSION STATUS VOCABULARY, AND THE TOKEN THAT LIES ──────────────
 *
 * L81278's `AC-37A-005`: "Every entry's permission line uses only the closed
 * status set, with no blank cell and no unexplained 'not applicable'."
 * MEASURED across all thirty entries: eighty status tokens, drawn from six of
 * the nine members of `PermissionOutcome`, zero blanks, and all three
 * `Not applicable` occurrences carry a stated reason. The criterion holds
 * here — measured, not assumed.
 *
 * With ONE entry satisfying it by pointing elsewhere. `UC-OFF-053`'s whole
 * permission line is "as `UC-OFF-051`." — no status of its own, so twenty-nine
 * of the thirty state statuses and one defers. A status-vocabulary audit that
 * only asks "are all tokens in the closed set?" passes that line on an empty
 * set. The entry it points at does carry a full line, so this is a deferral
 * rather than a blank, and it is recorded as one rather than filled in.
 *
 * AND THE TRAP: nineteen of the fifty-three `Allowed` tokens sit inside a
 * PROHIBITION — "nobody `Allowed` to evict unsynced evidence to make room"
 * (L81683), "every role `Explicitly prohibited` … nobody `Allowed` to
 * bulk-accept". A renderer that turns backticked status tokens into grants
 * publishes nineteen permissions the source refuses. `negatedAllowedClauses`
 * counts them per entry so the number is visible rather than latent, and the
 * verbatim `permissions` line is kept because the source states these as
 * prose, not as a matrix — turning prose into cells is where cells get
 * invented.
 *
 * ── SIX COMMAND-CLASS DECLARATIONS ONTO FIVE CLASSES ───────────────────────
 *
 * L81502 closes the command channel at five classes. Six of E's ten entries
 * declare one, and `reassignment` (`UC-OFF-043`) and `substitution`
 * (`UC-OFF-044`) both land on `CMD-FL-REASSIGN`, whose own name in the source
 * is "Reassignment or substitution". Six declarations, five distinct classes,
 * no sixth class minted.
 *
 * The four that declare none are `UC-OFF-047` (hard suspension),
 * `UC-OFF-048` (compliance suspension), `UC-OFF-049` (remote wipe) and
 * `UC-OFF-050` (two conflicting commands). `UC-OFF-049` is the one that
 * matters: a remote wipe is a command the channel carries and the five-class
 * closure does not name. `src/frontline/commands.ts` already records that gap
 * and refuses to close it, so this module points at it and does not spell it
 * a second time.
 *
 * ── THREE STORYBOARD SCREENS OUTSIDE THE CATALOGUE'S OWN SHARED SET ────────
 *
 * L81266 says "Every entry draws on the same small set" and names eleven
 * screens. Three screens named by these thirty entries are not among them:
 * `SCR-CC-CLEAR-01` (`UC-OFF-042`, L81532), `SCR-DOH-BANNER-01`
 * (`UC-OFF-046`, L81540) and `SCR-SA-LIFECYCLE-01` (`UC-OFF-070`, L81720).
 * All three are real identifiers elsewhere in the source; the first two are
 * defined in earlier chapters, and `SCR-SA-LIFECYCLE-01` occurs EXACTLY ONCE
 * in all 122,241 lines — at L81720, in the entry that invokes it. Recorded as
 * a gap in the catalogue's own claim, not repaired.
 *
 * ── DECISIONS THESE ENTRIES LEAVE OPEN ─────────────────────────────────────
 *
 * Seven entries name a `DEC-*`; six distinct identifiers. Five of the six are
 * already held elsewhere in this tree and are NOT re-spelled here — only
 * named, with the line the entry names them on. The sixth, `DEC-SYNC-002`,
 * is named by no hand-written file in this tree at all: it is raised at
 * L81588 as `UC-OFF-050`'s unspecified value and tabled at L81733 in §37B,
 * and this module is the first to record it. `UNDISCLOSED_DECISION` states
 * that, and the suite asserts the identifier is ABSENT from the shared canon
 * so the day it is lifted this module goes red and is forced to switch.
 *
 * ── WHAT IS DELIBERATELY NOT TRANSCRIBED ───────────────────────────────────
 *
 * Five surfaces, Roles, Numbered steps, Audit and Real-life example are
 * narrative restatements of rulings this build already holds structurally,
 * and copying thirty of each buys no check. The four-rung fallback ladder,
 * the terminal safe state, recovery, reconciliation, the permission line and
 * the artificial-intelligence line ARE carried verbatim, because those are
 * where the rulings live.
 *
 * ── WHAT THIS MODULE CANNOT DO, STATED RATHER THAN IMPLIED ─────────────────
 *
 * `registries/generated/offline-scenarios.json` reads 0 of 70 demonstrated.
 * Its status rule is a route screen under `app/` — a directory holding a
 * `page.tsx` — naming the identifier as a whole token. Nothing under
 * `src/offline/use-cases/` or `tests/` is such a screen, so this module
 * records the catalogue and does not move that number; a Command Center or
 * Frontline route must name the identifiers before it moves.
 *
 * A second registry caveat, and it is why no locator here comes from it: that
 * file's `sourceLine` is `firstLine(...)` — the FIRST mention anywhere, not
 * the entry's own line. Eighteen of these thirty rows point at the group
 * table, the diagram-reuse rule or a neighbouring entry rather than at the
 * use case. `UC-OFF-070`'s reads 81212, which is the diagram-reuse paragraph.
 * Every locator in this module was opened.
 */
import type { FrontlineCommandClass } from '@/frontline/commands'
import type { PermissionOutcome } from '@/policy/decision'

/* ── locators, all opened ──────────────────────────────────────────────── */

export const CATALOGUE_LOCATORS = {
  /** `## 37A. Mandatory Offline Use-Case Catalog`. */
  sectionHeading: 81202,
  /** The diagram-reuse rule and the twelve representatives, in one paragraph. */
  diagramReuseRule: 81212,
  /** Header of the seven-group table; group rows E, F and G follow it. */
  groupTableHeader: 81216,
  /** The catalogue map — the one mermaid fence in 37A that is not a use case. */
  catalogueMapFence: 81226,
  /** The eleven shared storyboard screens the catalogue says every entry draws on. */
  sharedStoryboardScreens: 81266,
  /** `AC-37A-004` — every non-diagrammed entry names the diagram it reuses. */
  reuseCriterion: 81277,
  /** `AC-37A-005` — the closed permission status set, no blank, no bare "not applicable". */
  statusVocabularyCriterion: 81278,
  /** §37B's table row raising `DEC-SYNC-002`. */
  syncTwoInThirtySevenB: 81733,
} as const

/* ── the three groups ──────────────────────────────────────────────────── */

export type OfflineUseCaseGroupId = 'E' | 'F' | 'G'

export interface OfflineUseCaseGroup {
  readonly id: OfflineUseCaseGroupId
  /** `37A.5`, `37A.6`, `37A.7`. */
  readonly section: string
  /** The heading text after the group letter, verbatim. */
  readonly theme: string
  readonly headingLine: number
  /**
   * First and last line of the group's own span: its heading, through the
   * line before the next heading. `UC-OFF-036` sits inside E's span and is
   * NOT E's; ownership comes from `OFFLINE_USE_CASES_E_G`, never from here.
   */
  readonly spanStart: number
  readonly spanEnd: number
  /** The row of the seven-group table at L81216 that names this group. */
  readonly groupTableRow: number
  /** The "What the diagram shows, and its reuse" paragraph for this group. */
  readonly reuseStatementLine: number
  /** Representatives as the group table names them. */
  readonly representatives: readonly string[]
}

/**
 * Spans end at the line before the next heading. G's ends at L81720, its last
 * entry's body — the line after it is blank and carries nothing, and a span
 * quoted one line further would be a citation of nothing.
 */
export const OFFLINE_USE_CASE_GROUPS = [
  {
    id: 'E',
    section: '37A.5',
    theme: 'Commands That Arrive Late',
    headingLine: 81496,
    spanStart: 81496,
    spanEnd: 81589,
    groupTableRow: 81222,
    reuseStatementLine: 81528,
    representatives: ['UC-OFF-041', 'UC-OFF-048', 'UC-OFF-049'],
  },
  {
    id: 'F',
    section: '37A.6',
    theme: 'Conflicts and Reconciliation',
    headingLine: 81590,
    spanStart: 81590,
    spanEnd: 81656,
    groupTableRow: 81223,
    reuseStatementLine: 81617,
    representatives: ['UC-OFF-051', 'UC-OFF-055'],
  },
  {
    id: 'G',
    section: '37A.7',
    theme: 'Device, Infrastructure and Long-Horizon Recovery',
    headingLine: 81657,
    spanStart: 81657,
    spanEnd: 81720,
    groupTableRow: 81224,
    reuseStatementLine: 81681,
    representatives: ['UC-OFF-062', 'UC-OFF-070'],
  },
] as const satisfies readonly OfflineUseCaseGroup[]

/* ── one entry ─────────────────────────────────────────────────────────── */

/**
 * The six members of the closed permission status set these thirty entries
 * actually use. The set is nine; three of the nine —
 * `cachedReadOnlyOffline`, `queuedOffline` and `clientDecisionRequired` — are
 * used by no permission line in E, F or G, which is a measurement about these
 * groups and not a narrowing of the vocabulary.
 */
export type UseCaseStatusToken =
  | 'Allowed'
  | 'Allowed with conditions'
  | 'Read-only'
  | 'Explicitly prohibited'
  | 'Unavailable'
  | 'Not applicable'

/** The join onto the shared union, so nobody invents a tenth outcome here. */
export const STATUS_TOKEN_OUTCOME: Readonly<Record<UseCaseStatusToken, PermissionOutcome>> = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
  Unavailable: 'unavailable',
  'Not applicable': 'notApplicable',
}

export type UseCaseDiagram =
  | {
      readonly carries: true
      /** Where the fence sits relative to the entry's heading line. */
      readonly placement: 'above' | 'below'
      readonly fenceOpen: number
      readonly fenceClose: number
    }
  | { readonly carries: false; readonly reuses: string }

/** One entry deferring a field to another entry rather than restating it. */
export interface UseCaseDeferral {
  /** The field name as the source bolds it. */
  readonly field: string
  readonly to: string
}

export interface OfflineUseCase {
  readonly id: string
  /** 41 through 70. */
  readonly ordinal: number
  readonly group: OfflineUseCaseGroupId
  /** The descriptive title, verbatim, without its trailing full stop. */
  readonly title: string
  /** The line carrying the title and the identifier metadata. */
  readonly headingLine: number
  /** The line carrying the remaining fields; equal to `headingLine` for 26 of 30. */
  readonly bodyLine: number
  readonly declaredModule: string | null
  readonly declaredBlockers: readonly string[]
  /** Every `DEC-*` the entry names, in any field. */
  readonly declaredDecisions: readonly string[]
  /** The command class as the metadata line words it, or null where it declares none. */
  readonly declaredCommandClassText: string | null
  /** That wording joined onto the five settled classes. */
  readonly commandClass: FrontlineCommandClass | null
  readonly diagram: UseCaseDiagram
  readonly workflow: string
  readonly storyboards: readonly string[]
  /** The permission line verbatim — prose in the source, so prose here. */
  readonly permissions: string
  readonly statusTokens: readonly UseCaseStatusToken[]
  /** Total status tokens on the permission line, distinct or not. */
  readonly statusTokenCount: number
  /** How many `Allowed` tokens on that line sit inside a prohibition clause. */
  readonly negatedAllowedClauses: number
  readonly aiBehaviour: string
  readonly firstFallback: string
  readonly fallbackOfFallback: string
  readonly terminalSafeState: string
  readonly recovery: string
  readonly reconciliation: string
  readonly acceptanceCriteria: readonly string[]
  readonly tests: readonly string[]
  /** The eighteenth field, where the entry carries one. */
  readonly extraField: { readonly name: string; readonly value: string } | null
  readonly deferrals: readonly UseCaseDeferral[]
}

/** Thirty entries, in source order: E's ten, F's ten, G's ten. */
export const OFFLINE_USE_CASES_E_G = [
  {
    id: 'UC-OFF-041',
    ordinal: 41,
    group: 'E',
    title: 'A lot release granted while the device was offline',
    headingLine: 81530,
    bodyLine: 81530,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: 'lot release',
    commandClass: 'CMD-FL-LOTREL',
    diagram: { carries: true, placement: 'above', fenceOpen: 81504, fenceClose: 81526 },
    workflow: 'WF-CMD-LOTRELEASE',
    storyboards: ['SCR-CC-DEV-01', 'SCR-FL-SYNC-03'],
    permissions: 'Quality Manager `Allowed`, uniformly and with no exceptions by work type, risk class or tag; Supervisor `Allowed with conditions` — request with a note only; Worker `Explicitly prohibited`; artificial intelligence `Explicitly prohibited` from releasing a Severity 1 hold.',
    statusTokens: ['Allowed', 'Allowed with conditions', 'Explicitly prohibited'],
    statusTokenCount: 4,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited` from the release decision; `Allowed with conditions` to assemble context and retrieve prior cases for the Quality Manager\'s review, online.',
    firstFallback: 'delivery at the next sync.',
    fallbackOfFallback: 'where the device never returns, the hold stays in force locally, which is the safe direction.',
    terminalSafeState: 'a held lot is never released by timeout, by inference, or by any path except a Quality Manager\'s command reaching the device.',
    recovery: 'device reconnection.',
    reconciliation: 'acknowledgement returns; the Command Center updates from propagating to in force per device.',
    acceptanceCriteria: ['AC-37A-501'],
    tests: ['TEST-37A-501'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-042',
    ordinal: 42,
    group: 'E',
    title: 'A qualification clearance granted while the device was offline',
    headingLine: 81532,
    bodyLine: 81532,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: 'qualification clearance',
    commandClass: 'CMD-FL-CLEAR',
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-CLEARANCE',
    storyboards: ['SCR-CC-CLEAR-01', 'SCR-FL-PARK-01'],
    permissions: 'Supervisor `Allowed`; Worker `Explicitly prohibited`; artificial intelligence `Explicitly prohibited`.',
    statusTokens: ['Allowed', 'Explicitly prohibited'],
    statusTokenCount: 3,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited`.',
    firstFallback: 'delivery at the next sync.',
    fallbackOfFallback: 'the run stays parked; the worker keeps working elsewhere.',
    terminalSafeState: 'parked run, no ungated work.',
    recovery: 'reconnection.',
    reconciliation: 'the run resumes at its exact step.',
    acceptanceCriteria: ['AC-37A-502'],
    tests: ['TEST-37A-502'],
    extraField: null,
    deferrals: [
      { field: 'Numbered steps', to: 'UC-OFF-036' },
    ],
  },
  {
    id: 'UC-OFF-043',
    ordinal: 43,
    group: 'E',
    title: 'A run reassignment issued while the device was offline',
    headingLine: 81534,
    bodyLine: 81534,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: 'reassignment',
    commandClass: 'CMD-FL-REASSIGN',
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-REASSIGN',
    storyboards: ['SCR-CC-BOARD-01'],
    permissions: 'Supervisor `Allowed`; Worker `Explicitly prohibited` from reassigning or picking up work.',
    statusTokens: ['Allowed', 'Explicitly prohibited'],
    statusTokenCount: 2,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited` from reassigning work.',
    firstFallback: 'delivery at the next sync.',
    fallbackOfFallback: 'where the original device never returns, the Supervisor closes the run as stuck with a mandatory note.',
    terminalSafeState: 'no work is orphaned and no work is double-attributed.',
    recovery: 'reconnection.',
    reconciliation: 'interim captures land attributed to the original worker; the Worker-Shift meter counts each worker who actually performed work.',
    acceptanceCriteria: ['AC-37A-503'],
    tests: ['TEST-37A-503'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-044',
    ordinal: 44,
    group: 'E',
    title: 'A worker substitution issued while the device was offline',
    headingLine: 81536,
    bodyLine: 81536,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: 'substitution',
    commandClass: 'CMD-FL-REASSIGN',
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-SUBSTITUTE',
    storyboards: ['SCR-FL-PLAYER-01'],
    permissions: 'Supervisor `Allowed`; substitute `Allowed` to work forward; substitute `Explicitly prohibited` from altering pre-substitution captures.',
    statusTokens: ['Allowed', 'Explicitly prohibited'],
    statusTokenCount: 3,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited` from initiating a substitution.',
    firstFallback: 'delivery at the next sync.',
    fallbackOfFallback: 'the run continues with the original worker until the command lands, which is safe.',
    terminalSafeState: 'clean attribution either side of the substitution point.',
    recovery: 'reconnection.',
    reconciliation: 'each worker who actually performed work counts one Worker-Shift.',
    acceptanceCriteria: ['AC-37A-504'],
    tests: ['TEST-37A-504'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-045',
    ordinal: 45,
    group: 'E',
    title: 'A workflow version change published while the device was offline',
    headingLine: 81538,
    bodyLine: 81538,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-37'],
    declaredDecisions: [],
    declaredCommandClassText: 'version change',
    commandClass: 'CMD-FL-VERSION',
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-VERSION',
    storyboards: ['SCR-FL-PLAYER-01'],
    permissions: 'Job Owner `Allowed` to decide adoption for notified classes; patch-level changes `Allowed with conditions` — they apply at the next execution without ceremony and are fully tracked; Worker `Not applicable — the worker makes no version decision`.',
    statusTokens: ['Allowed', 'Allowed with conditions', 'Not applicable'],
    statusTokenCount: 3,
    negatedAllowedClauses: 0,
    aiBehaviour: 'Lane B auto-published patches arrive the same way once a human approved the change in the Command Center; artificial intelligence `Explicitly prohibited` from publishing without that human decision.',
    firstFallback: 'delivery at the next sync.',
    fallbackOfFallback: '`OFF-BLK-37` where the package has not staged; work continues on the pinned versions.',
    terminalSafeState: 'in-flight runs finish on the version they started on, always.',
    recovery: 'staging and the next run boundary.',
    reconciliation: 'adoption follows the tenant\'s adoption timing.',
    acceptanceCriteria: ['AC-37A-505'],
    tests: ['TEST-37A-505'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-046',
    ordinal: 46,
    group: 'E',
    title: 'A soft tenant suspension applied while the device was offline',
    headingLine: 81540,
    bodyLine: 81540,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-12'],
    declaredDecisions: ['DEC-SUSP-001'],
    declaredCommandClassText: 'suspension',
    commandClass: 'CMD-FL-SUSPEND',
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-SUSPEND-SOFT',
    storyboards: ['SCR-DOH-BANNER-01'],
    permissions: 'Worker `Allowed` on all assigned work; Tenant Admin `Unavailable` for master-data writes; Supervisor `Allowed` on operational actions.',
    statusTokens: ['Allowed', 'Unavailable'],
    statusTokenCount: 3,
    negatedAllowedClauses: 0,
    aiBehaviour: 'unchanged.',
    firstFallback: 'none required; the floor is unaffected.',
    fallbackOfFallback: 'escalation to hard suspension on the commercial timeline.',
    terminalSafeState: 'operations intact.',
    recovery: 'the client\'s platform team clearing the commercial hold by explicit operator signal in the Super Admin platform console.',
    reconciliation: 'normal protocol.',
    acceptanceCriteria: ['AC-37A-506'],
    tests: ['TEST-37A-506'],
    extraField: { name: 'Preserved contradiction', value: 'whether soft suspension lifts on the operator\'s signal or automatically on payment is `DEC-SUSP-001`; §4.2.4 states the operator\'s signal and no payment integration exists, while §8.9.2 and Part IX state automatic on payment. Both readings are preserved in the card, and the operator\'s signal is the adopted working position `[Derived Clarification — adopted working position — DEC-SUSP-001, adopted 2026-08-14]`.' },
    deferrals: [],
  },
  {
    id: 'UC-OFF-047',
    ordinal: 47,
    group: 'E',
    title: 'A hard tenant suspension applied while the device was offline',
    headingLine: 81542,
    bodyLine: 81542,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-12'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-SUSPEND-HARD',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'Worker `Allowed` to finish in-flight work, `Unavailable` for new runs; Supervisor `Read-only` on most surfaces.',
    statusTokens: ['Allowed', 'Read-only', 'Unavailable'],
    statusTokenCount: 3,
    negatedAllowedClauses: 0,
    aiBehaviour: 'unchanged for in-flight work.',
    firstFallback: 'the completion pipeline.',
    fallbackOfFallback: 'where a run cannot complete, the Supervisor closes it as stuck with a note.',
    terminalSafeState: 'every in-flight run closed properly, nothing abandoned.',
    recovery: 'commercial resolution.',
    reconciliation: 'normal protocol.',
    acceptanceCriteria: ['AC-37A-507'],
    tests: ['TEST-37A-507'],
    extraField: null,
    deferrals: [
      { field: 'Roles', to: 'UC-OFF-046' },
    ],
  },
  {
    id: 'UC-OFF-048',
    ordinal: 48,
    group: 'E',
    title: 'A compliance suspension applied while the device was offline',
    headingLine: 81544,
    bodyLine: 81564,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-12'],
    declaredDecisions: ['DEC-SYNC-001'],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: true, placement: 'below', fenceOpen: 81546, fenceClose: 81562 },
    workflow: 'WF-CMD-SUSPEND-COMPLIANCE',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'every tenant role `Unavailable` in every surface; the client\'s platform team `Allowed with conditions` — only through the compliance-emergency path, which is the only path with write capability into tenant data and the only entry into a compliance-suspended tenant.',
    statusTokens: ['Allowed with conditions', 'Unavailable'],
    statusTokenCount: 2,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Unavailable` for the tenant entirely.',
    firstFallback: 'none. This is a deliberate terminal case.',
    fallbackOfFallback: 'not applicable — there is no fallback to fail.',
    terminalSafeState: 'everything stopped, everything preserved, the fixed message shown.',
    recovery: 'the dual-authorised compliance-emergency path, time-boxed, with its scope declared before it opens and an automatic post-session report to the tenant.',
    reconciliation: 'unsynced captures are recovered through that path, because under the adopted `DEC-SYNC-001` ordering a compliance stop is a stop-class command and applies before the upload; the source reading under which the captures would have uploaded first is preserved in the card.',
    acceptanceCriteria: ['AC-37A-508'],
    tests: ['TEST-37A-508'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-049',
    ordinal: 49,
    group: 'E',
    title: 'A remote wipe issued to a device that never returns',
    headingLine: 81566,
    bodyLine: 81586,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-32'],
    declaredDecisions: ['DEC-WIPE-001'],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: true, placement: 'below', fenceOpen: 81568, fenceClose: 81584 },
    workflow: 'WF-CMD-WIPE',
    storyboards: ['SCR-SA-FLEET-01'],
    permissions: 'Root Super Admin `Allowed` to approve; platform Admin `Allowed with conditions` — critical class requires root approval; Tenant Admin `Read-only` on the mirrored audit; Worker `Not applicable — the worker is not a party to a wipe`.',
    statusTokens: ['Allowed', 'Allowed with conditions', 'Not applicable', 'Read-only'],
    statusTokenCount: 4,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited` from issuing, approving or accelerating a wipe.',
    firstFallback: 'wait for the device, in an honest pending state.',
    fallbackOfFallback: '`DEC-WIPE-001`, open.',
    terminalSafeState: 'command pending, not applied, honestly rendered; the affected runs closable as stuck runs with mandatory notes so the record still finishes.',
    recovery: 'the device returning, or a client decision.',
    reconciliation: 'on return, the final sync attempt runs and its outcome is recorded before erasure.',
    acceptanceCriteria: ['AC-37A-509'],
    tests: ['TEST-37A-509'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-050',
    ordinal: 50,
    group: 'E',
    title: 'Two conflicting commands queued for the same run',
    headingLine: 81588,
    bodyLine: 81588,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: ['DEC-SYNC-002'],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-041' },
    workflow: 'WF-CMD-ORDER',
    storyboards: ['SCR-CC-BOARD-01'],
    permissions: 'Supervisor `Allowed` to reassign repeatedly; nobody `Allowed` to apply a superseded command.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited` from executing stale queued actions.',
    firstFallback: 'ordered application with supersession.',
    fallbackOfFallback: 'where ordering cannot be established, both commands are held and routed to the Supervisor rather than applied speculatively.',
    terminalSafeState: 'exactly one effective outcome, with the full command history preserved.',
    recovery: 'reconnection.',
    reconciliation: 'command states recorded as applied, superseded and cancelled as appropriate.',
    acceptanceCriteria: ['AC-37A-510'],
    tests: ['TEST-37A-510'],
    extraField: { name: 'Note on an unspecified value', value: 'command expiry horizons per class are `TBD — Client Decision Required` under `DEC-SYNC-002`.' },
    deferrals: [],
  },
  {
    id: 'UC-OFF-051',
    ordinal: 51,
    group: 'F',
    title: 'Two workers complete the same shared checklist item offline',
    headingLine: 81619,
    bodyLine: 81619,
    declaredModule: 'MOD-CC-10',
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: true, placement: 'above', fenceOpen: 81598, fenceClose: 81615 },
    workflow: 'WF-CONF-SHARED',
    storyboards: ['SCR-CC-CONF-01'],
    permissions: 'Quality Manager `Allowed` to resolve and Resolve All; Supervisor `Read-only`; Worker `Explicitly prohibited` from any involvement; Read-only Auditor `Explicitly prohibited` in the Command Center and `Read-only` in the Hub audit log.',
    statusTokens: ['Allowed', 'Explicitly prohibited', 'Read-only'],
    statusTokenCount: 5,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited` from resolving conflicts.',
    firstFallback: 'automatic object-specific resolution.',
    fallbackOfFallback: 'individual human review.',
    terminalSafeState: 'both versions retained; work never blocked.',
    recovery: 'resolution or an appended correction.',
    reconciliation: 'summaries recompute.',
    acceptanceCriteria: ['AC-37A-601'],
    tests: ['TEST-37A-601'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-052',
    ordinal: 52,
    group: 'F',
    title: 'A server-side correction made while the device holding the original was offline',
    headingLine: 81621,
    bodyLine: 81621,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-CONF-CORRECTION',
    storyboards: ['SCR-DOH-RUN-01'],
    permissions: 'Quality Manager `Allowed` to append; nobody `Allowed` to edit either record.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited` from initiating or approving a correction.',
    firstFallback: 'the governance-act rule of §36.3.',
    fallbackOfFallback: 'where the device\'s later capture is a genuinely new physical reading rather than a stale copy, the conflict routes to the Quality Manager.',
    terminalSafeState: 'the full chain preserved in order.',
    recovery: 'not required.',
    reconciliation: 'audited recompute where a headline figure changes materially.',
    acceptanceCriteria: ['AC-37A-602'],
    tests: ['TEST-37A-602'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-053',
    ordinal: 53,
    group: 'F',
    title: 'A run-level state conflict between two devices',
    headingLine: 81623,
    bodyLine: 81623,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-CONF-RUNSTATE',
    storyboards: ['SCR-CC-CONF-01'],
    permissions: 'as `UC-OFF-051`.',
    statusTokens: [],
    statusTokenCount: 0,
    negatedAllowedClauses: 0,
    aiBehaviour: 'as `UC-OFF-051`.',
    firstFallback: 'automatic resolution.',
    fallbackOfFallback: 'human resolution on an invalid transition.',
    terminalSafeState: 'one coherent run state with the alternative preserved.',
    recovery: 'resolution.',
    reconciliation: 'the run lifecycle proceeds normally.',
    acceptanceCriteria: ['AC-37A-603'],
    tests: ['TEST-37A-603'],
    extraField: null,
    deferrals: [
      { field: 'Permissions', to: 'UC-OFF-051' },
      { field: 'Artificial-intelligence behaviour', to: 'UC-OFF-051' },
    ],
  },
  {
    id: 'UC-OFF-054',
    ordinal: 54,
    group: 'F',
    title: 'A clock-skew-flagged write loses a conflict pending individual review',
    headingLine: 81625,
    bodyLine: 81625,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-21'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-CONF-SKEW',
    storyboards: ['SCR-CC-CONF-01'],
    permissions: 'nobody `Allowed` to bulk-accept a skew-flagged entry, including the Quality Manager; Quality Manager `Allowed` to resolve it individually.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited`.',
    firstFallback: 'ordering by server receipt.',
    fallbackOfFallback: 'where the server time source is itself in doubt, every conflict in the window routes to human review.',
    terminalSafeState: 'all captures accepted; conflicts open and individually reviewable.',
    recovery: 'device time correction; the flag persists on historical writes.',
    reconciliation: 'individual resolution.',
    acceptanceCriteria: ['AC-37A-604'],
    tests: ['TEST-37A-604'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-055',
    ordinal: 55,
    group: 'F',
    title: 'A conflict whose two values disagree beyond the specification limits',
    headingLine: 81627,
    bodyLine: 81645,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: true, placement: 'below', fenceOpen: 81629, fenceClose: 81643 },
    workflow: 'WF-CONF-QUALITY',
    storyboards: ['SCR-CC-DEV-01'],
    permissions: 'Quality Manager `Allowed` to review and, where Severity 1, to release; nobody else `Allowed` to release; artificial intelligence `Explicitly prohibited` from classifying.',
    statusTokens: ['Allowed', 'Explicitly prohibited'],
    statusTokenCount: 3,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Allowed with conditions` after the deterministic trigger, to assemble context and retrieve prior cases; `Explicitly prohibited` from the classification itself.',
    firstFallback: 'the deviation mechanism.',
    fallbackOfFallback: 'where the deviation mechanism is unreachable, both values are preserved and the case is escalated to the Quality Manager as an open item rather than closed as an ordinary conflict.',
    terminalSafeState: 'a quality event treated as a quality event.',
    recovery: 'Quality Manager disposition.',
    reconciliation: 'the deviation lands in the execution summary and the Anomaly Register.',
    acceptanceCriteria: ['AC-37A-605'],
    tests: ['TEST-37A-605'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-056',
    ordinal: 56,
    group: 'F',
    title: 'Resolve All invoked with skew-flagged conflicts present',
    headingLine: 81647,
    bodyLine: 81647,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-CONF-BULK',
    storyboards: ['SCR-CC-CONF-01'],
    permissions: 'Quality Manager `Allowed` on ordinary conflicts; every role `Explicitly prohibited` from bulk-accepting a skew-flagged entry, because bulk acceptance is not review.',
    statusTokens: ['Allowed', 'Explicitly prohibited'],
    statusTokenCount: 2,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Explicitly prohibited`.',
    firstFallback: 'individual resolution for the excluded entries.',
    fallbackOfFallback: 'where Resolve All partially fails, each acceptance is individually transactional, so the successful subset stands and the remainder stays open.',
    terminalSafeState: 'never an indeterminate bulk outcome.',
    recovery: 're-invocation.',
    reconciliation: 'summaries recompute.',
    acceptanceCriteria: ['AC-37A-606'],
    tests: ['TEST-37A-606'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-057',
    ordinal: 57,
    group: 'F',
    title: 'A Quality Manager flags an automatic resolution as wrong',
    headingLine: 81649,
    bodyLine: 81649,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-CONF-FLAG',
    storyboards: ['SCR-CC-CONF-01', 'SCR-DOH-RUN-01'],
    permissions: 'Quality Manager `Allowed` to flag; nobody `Allowed` to edit the sync result.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited`.',
    firstFallback: 'the correction path.',
    fallbackOfFallback: 'where the correction path is unreachable, the flag is still recorded and the correction is raised when it returns.',
    terminalSafeState: 'the sync result intact and a correction appended above it.',
    recovery: 'correction-path availability.',
    reconciliation: 'audited recompute where material.',
    acceptanceCriteria: ['AC-37A-607'],
    tests: ['TEST-37A-607'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-058',
    ordinal: 58,
    group: 'F',
    title: 'Late captures arriving inside the record-finish window',
    headingLine: 81651,
    bodyLine: 81651,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-RECON-LATE',
    storyboards: ['SCR-CC-BOARD-01'],
    permissions: 'Quality Manager `Allowed` to review; nobody `Allowed` to unflag a late arrival.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: 'analysis reruns at protocol step 30 only where the output can still change a human decision not yet taken.',
    firstFallback: 'normal folding-in.',
    fallbackOfFallback: 'arrival after finish, which is `UC-OFF-059`.',
    terminalSafeState: 'a complete record with its lateness visible.',
    recovery: 'not required.',
    reconciliation: 'recomputation with as-of stamps.',
    acceptanceCriteria: ['AC-37A-608'],
    tests: ['TEST-37A-608'],
    extraField: null,
    deferrals: [
      { field: 'Fallback-of-fallback', to: 'UC-OFF-059' },
    ],
  },
  {
    id: 'UC-OFF-059',
    ordinal: 59,
    group: 'F',
    title: 'Captures arriving after the record has finished',
    headingLine: 81653,
    bodyLine: 81653,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-RECON-AFTERFINISH',
    storyboards: ['SCR-DOH-RUN-01'],
    permissions: 'Quality Manager `Allowed` to review the recompute; nobody `Allowed` to rewrite a finished figure without the audited recompute.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited` from triggering or approving a recompute.',
    firstFallback: 'audited recompute.',
    fallbackOfFallback: 'quarantine at protocol step 32 where the record cannot be safely folded in, with the Quality Manager deciding.',
    terminalSafeState: 'a finished record whose every subsequent change is explicit and audited.',
    recovery: 'not required.',
    reconciliation: 'recompute plus report flagging.',
    acceptanceCriteria: ['AC-37A-609'],
    tests: ['TEST-37A-609'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-060',
    ordinal: 60,
    group: 'F',
    title: 'Duplicate upload after an interrupted sync',
    headingLine: 81655,
    bodyLine: 81655,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-051' },
    workflow: 'WF-RECON-IDEMPOTENT',
    storyboards: ['SCR-FL-SYNC-03'],
    permissions: '`Not applicable — this is a machine-level guarantee with no human actor`.',
    statusTokens: ['Not applicable'],
    statusTokenCount: 1,
    negatedAllowedClauses: 0,
    aiBehaviour: '`Not applicable`.',
    firstFallback: 'idempotent retry.',
    fallbackOfFallback: 'deduplication with linkage, retaining both records and marking one as the duplicate; nothing is deleted.',
    terminalSafeState: 'exactly one officially recorded capture per physical act.',
    recovery: 'not required.',
    reconciliation: 'exact conservation between the device\'s store and the server\'s accepted set.',
    acceptanceCriteria: ['AC-37A-610'],
    tests: ['TEST-37A-610'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-061',
    ordinal: 61,
    group: 'G',
    title: 'Storage pressure during a long offline shift',
    headingLine: 81683,
    bodyLine: 81683,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-05'],
    declaredDecisions: ['DEC-STORE-001'],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-STORAGE',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'Worker `Allowed` to continue non-media capture; nobody `Allowed` to evict unsynced evidence to make room.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Not applicable`.',
    firstFallback: 'sync and evict confirmed media.',
    fallbackOfFallback: '`TBD — Client Decision Required` under `DEC-STORE-001`; no behaviour is invented here.',
    terminalSafeState: 'the one certainty — unsynced evidence is never discarded.',
    recovery: 'sync, or device replacement.',
    reconciliation: 'normal protocol.',
    acceptanceCriteria: ['AC-37A-701'],
    tests: ['TEST-37A-701'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-062',
    ordinal: 62,
    group: 'G',
    title: 'A corrupt local database discovered at reconnection',
    headingLine: 81685,
    bodyLine: 81685,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-04'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: true, placement: 'above', fenceOpen: 81665, fenceClose: 81679 },
    workflow: 'WF-DEV-SALVAGE',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'Worker `Unavailable` for new capture during salvage; the client\'s platform team `Allowed` to direct the salvage; nobody `Allowed` to rebuild before salvage.',
    statusTokens: ['Allowed', 'Unavailable'],
    statusTokenCount: 3,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited` from reconstructing, inferring or completing a damaged record.',
    firstFallback: 'salvage.',
    fallbackOfFallback: 'dead-letter with named loss.',
    terminalSafeState: 'every recoverable record recovered and every unrecoverable one named.',
    recovery: 'rebuild and re-enrollment.',
    reconciliation: 'salvaged records fold in flagged late; the Supervisor closes what cannot be completed.',
    acceptanceCriteria: ['AC-37A-702'],
    tests: ['TEST-37A-702'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-063',
    ordinal: 63,
    group: 'G',
    title: 'A corrupted upload queue discovered at reconnection',
    headingLine: 81687,
    bodyLine: 81687,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-22'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-QUEUE',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'Worker `Allowed` to keep capturing; nobody `Allowed` to upload from a damaged queue.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Not applicable`.',
    firstFallback: 'rebuild from the store.',
    fallbackOfFallback: 'offer every store record in dependency order and let the server\'s idempotency guard prevent duplication.',
    terminalSafeState: 'nothing duplicated, nothing lost.',
    recovery: 'rebuild.',
    reconciliation: 'exact conservation against the store.',
    acceptanceCriteria: ['AC-37A-703'],
    tests: ['TEST-37A-703'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-064',
    ordinal: 64,
    group: 'G',
    title: 'Device battery death mid-run with unsynced captures',
    headingLine: 81689,
    bodyLine: 81689,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-POWER',
    storyboards: ['SCR-FL-PLAYER-01'],
    permissions: 'Worker `Allowed` to resume; nobody `Allowed` to reconstruct the uncommitted value.',
    statusTokens: ['Allowed'],
    statusTokenCount: 2,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited` from reconstructing an uncommitted capture.',
    firstFallback: 'resume from the last commit.',
    fallbackOfFallback: 'where the store is damaged by the abrupt loss, `OFF-BLK-04` applies.',
    terminalSafeState: 'every committed capture preserved; the uncommitted one honestly absent.',
    recovery: 'charging.',
    reconciliation: 'normal protocol.',
    acceptanceCriteria: ['AC-37A-704'],
    tests: ['TEST-37A-704'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-065',
    ordinal: 65,
    group: 'G',
    title: 'A device lost or stolen while holding unsynced captures',
    headingLine: 81691,
    bodyLine: 81691,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-13', 'OFF-BLK-32'],
    declaredDecisions: ['DEC-WIPE-001'],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-LOST',
    storyboards: ['SCR-SA-FLEET-01'],
    permissions: 'Root Super Admin `Allowed` to approve the critical-class action; Supervisor `Allowed` to close stuck runs; nobody `Allowed` to claim the wipe completed.',
    statusTokens: ['Allowed'],
    statusTokenCount: 3,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited`.',
    firstFallback: 'the pending wipe with its honest state.',
    fallbackOfFallback: '`DEC-WIPE-001`, open.',
    terminalSafeState: 'the record finishes with a named gap; the device\'s data is protected by the encrypted store regardless.',
    recovery: 'the device returning.',
    reconciliation: 'stuck-run closure and the finish window.',
    acceptanceCriteria: ['AC-37A-705'],
    tests: ['TEST-37A-705'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-066',
    ordinal: 66,
    group: 'G',
    title: 'A device retired while holding unsynced captures',
    headingLine: 81693,
    bodyLine: 81693,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-RETIRE',
    storyboards: ['SCR-SA-FLEET-01'],
    permissions: 'Tenant Admin `Allowed` to enroll and to request retirement; the client\'s platform team `Allowed` on wipe authority; nobody `Allowed` to skip the final sync.',
    statusTokens: ['Allowed'],
    statusTokenCount: 3,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Not applicable`.',
    firstFallback: 'the final sync.',
    fallbackOfFallback: 'where the final sync fails, retirement is held and the device is treated as `OFF-BLK-32`.',
    terminalSafeState: 'no unsynced work destroyed by an administrative act.',
    recovery: 'a successful final sync.',
    reconciliation: 'all captures land before retirement completes.',
    acceptanceCriteria: ['AC-37A-706'],
    tests: ['TEST-37A-706'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-067',
    ordinal: 67,
    group: 'G',
    title: 'An application version below the floor discovered at reconnection',
    headingLine: 81695,
    bodyLine: 81695,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-06'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-VERSION',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'Worker `Allowed` to keep executing staged runs; nobody `Allowed` to sync below the floor; nobody `Allowed` to discard local data on a version rejection.',
    statusTokens: ['Allowed'],
    statusTokenCount: 3,
    negatedAllowedClauses: 2,
    aiBehaviour: '`Unavailable` while unsynced.',
    firstFallback: 'update.',
    fallbackOfFallback: 'move the worker to a conformant device; the login is the credential.',
    terminalSafeState: 'data preserved, work continuing, sync deferred.',
    recovery: 'update.',
    reconciliation: 'captures fold in flagged late where inside the window.',
    acceptanceCriteria: ['AC-37A-707'],
    tests: ['TEST-37A-707'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-068',
    ordinal: 68,
    group: 'G',
    title: 'An encryption key lost after an operating-system reinstall',
    headingLine: 81697,
    bodyLine: 81697,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-20'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-DEV-KEYLOSS',
    storyboards: ['SCR-FL-BLOCK-01'],
    permissions: 'nobody `Allowed` to recover the unsynced set; Supervisor `Allowed` to close stuck runs; the client\'s platform team `Allowed` to re-enroll.',
    statusTokens: ['Allowed'],
    statusTokenCount: 3,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Explicitly prohibited` from reconstructing lost evidence.',
    firstFallback: 'none for the unsynced data; this is the register\'s one genuinely unrecoverable case and it is stated plainly.',
    fallbackOfFallback: 'not applicable — there is no fallback to fail.',
    terminalSafeState: 'a named, bounded, audited loss and a productive worker.',
    recovery: 're-enrollment; the lost captures are not recovered.',
    reconciliation: 'stuck-run closure; the finish window still guarantees the runs finish.',
    acceptanceCriteria: ['AC-37A-708'],
    tests: ['TEST-37A-708'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-069',
    ordinal: 69,
    group: 'G',
    title: 'A multi-day outage exceeding the record-finish window',
    headingLine: 81699,
    bodyLine: 81699,
    declaredModule: null,
    declaredBlockers: ['OFF-BLK-24'],
    declaredDecisions: [],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: false, reuses: 'UC-OFF-062' },
    workflow: 'WF-RECON-LONGOUTAGE',
    storyboards: ['SCR-CC-BOARD-01', 'SCR-DOH-RUN-01'],
    permissions: 'Supervisor `Allowed` to close stuck runs; Quality Manager `Allowed` to review recomputes; nobody `Allowed` to silently rewrite a finished figure.',
    statusTokens: ['Allowed'],
    statusTokenCount: 3,
    negatedAllowedClauses: 1,
    aiBehaviour: '`Unavailable` throughout the outage; reruns at protocol step 30 only where still eligible.',
    firstFallback: 'offline execution.',
    fallbackOfFallback: 'trust-window stop, then stuck-run closure.',
    terminalSafeState: 'every run reaching a finished state; every late arrival explicit.',
    recovery: 'connectivity.',
    reconciliation: 'audited recompute and report flagging.',
    acceptanceCriteria: ['AC-37A-709'],
    tests: ['TEST-37A-709'],
    extraField: null,
    deferrals: [],
  },
  {
    id: 'UC-OFF-070',
    ordinal: 70,
    group: 'G',
    title: 'Recovering and correcting a record after the original personnel have left the company',
    headingLine: 81701,
    bodyLine: 81720,
    declaredModule: null,
    declaredBlockers: [],
    declaredDecisions: ['DEC-RETRIEVE-001'],
    declaredCommandClassText: null,
    commandClass: null,
    diagram: { carries: true, placement: 'below', fenceOpen: 81703, fenceClose: 81718 },
    workflow: 'WF-RECON-LEGACY',
    storyboards: ['SCR-DOH-RUN-01', 'SCR-DOH-AUD-01', 'SCR-SA-LIFECYCLE-01'],
    permissions: 'Quality Manager `Allowed` to append a correction to a historical record; Tenant Admin `Allowed` to reactivate an archived worker record where the person is re-employed, with history intact after re-validation; Read-only Auditor `Read-only` on the full chain; nobody `Allowed` to alter the original; nobody `Allowed` to reverse anonymisation, which is irreversible; the client\'s platform team `Allowed with conditions` on retrieval, whose expectation — minutes, hours or next business day — is the open drafting item `DEC-RETRIEVE-001`.',
    statusTokens: ['Allowed', 'Allowed with conditions', 'Read-only'],
    statusTokenCount: 6,
    negatedAllowedClauses: 2,
    aiBehaviour: '`Explicitly prohibited` from authoring, approving or attributing a historical correction; `Allowed with conditions` to retrieve prior cases as context for the reviewing Quality Manager, subject to the memory-isolation rule that nothing is shared across tenants and nothing becomes external training data.',
    firstFallback: 'the append-only correction path under a currently employed authority.',
    fallbackOfFallback: 'where the record has tiered to lower-cost storage, retrieval precedes correction; retrieval expectation is `DEC-RETRIEVE-001` and this blueprint does not fix it.',
    terminalSafeState: 'the historical record intact and understandable, the correction appended and attributed to a living authority, and the chain readable by an auditor.',
    recovery: 'retrieval plus correction.',
    reconciliation: 'audited recompute where material; scheduled reports flag material corrections in their next delivery.',
    acceptanceCriteria: ['AC-37A-710', 'AC-37A-711', 'AC-37A-712'],
    tests: ['TEST-37A-710', 'TEST-37A-711', 'TEST-37A-712'],
    extraField: null,
    deferrals: [],
  },
] as const satisfies readonly OfflineUseCase[]

/* ── the cross-reference finding, derived rather than asserted ─────────── */

/**
 * Every deferral in these thirty entries, in source order. Five of them, and
 * `crossesGroup` is computed from the ordinal rather than declared, so a
 * transcription that moved an entry between groups cannot leave this stale.
 */
export const DEFERRALS: readonly {
  readonly from: string
  readonly field: string
  readonly to: string
  readonly crossesGroup: boolean
}[] = OFFLINE_USE_CASES_E_G.flatMap((uc) =>
  uc.deferrals.map((d) => ({
    from: uc.id,
    field: d.field,
    to: d.to,
    crossesGroup: groupOfOrdinal(Number(d.to.slice(-3))) !== uc.group,
  })),
)

/**
 * Which group an ordinal belongs to across the whole catalogue, from the
 * ranges the seven-group table states. Returns null outside 1..70 rather than
 * guessing, because a use case outside the catalogue is a defect, not a
 * seventy-first group.
 */
export function groupOfOrdinal(n: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null {
  if (!Number.isInteger(n) || n < 1 || n > 70) return null
  return (['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const)[Math.floor((n - 1) / 10)] ?? null
}

/**
 * The identifiers E's span holds that E does not own. Derived by asking each
 * deferral whether it leaves the group, never by subtracting eleven from ten.
 */
export const FOREIGN_IDENTIFIERS_IN_SPAN: readonly string[] = DEFERRALS.filter(
  (d) => d.crossesGroup,
).map((d) => d.to)

/* ── the diagram pointer ───────────────────────────────────────────────── */

export interface DiagramSource {
  /** The entry whose fence is drawn. */
  readonly owner: string
  readonly fenceOpen: number
  readonly fenceClose: number
  /** True where the caller's own entry carries it. */
  readonly own: boolean
}

export function useCaseById(id: string): OfflineUseCase | null {
  return OFFLINE_USE_CASES_E_G.find((u) => u.id === id) ?? null
}

export function useCasesInGroup(group: OfflineUseCaseGroupId): readonly OfflineUseCase[] {
  return OFFLINE_USE_CASES_E_G.filter((u) => u.group === group)
}

/**
 * Resolve an entry to the fence it renders — its own where it carries one,
 * otherwise the representative it names. One hop only: a representative
 * always carries, so a chain is a defect and comes back as null rather than
 * looping. Null is also what an identifier outside these three groups gets,
 * because pointing at a diagram this module never read would be a guess.
 */
export function diagramSourceFor(id: string): DiagramSource | null {
  const uc = useCaseById(id)
  if (uc === null) return null
  if (uc.diagram.carries) {
    return {
      owner: uc.id,
      fenceOpen: uc.diagram.fenceOpen,
      fenceClose: uc.diagram.fenceClose,
      own: true,
    }
  }
  const rep = useCaseById(uc.diagram.reuses)
  if (rep === null || !rep.diagram.carries) return null
  return {
    owner: rep.id,
    fenceOpen: rep.diagram.fenceOpen,
    fenceClose: rep.diagram.fenceClose,
    own: false,
  }
}

/** The seven entries in E, F and G that carry their own Mermaid fence. */
export const DIAGRAM_CARRIERS: readonly string[] = OFFLINE_USE_CASES_E_G.filter(
  (u) => u.diagram.carries,
).map((u) => u.id)

/* ── counts, measured, exported so a caller reads them rather than a span ─ */

export interface GroupCount {
  readonly group: OfflineUseCaseGroupId
  /** Entries owned, by their own heading. */
  readonly entries: number
  /** Distinct `UC-OFF-*` identifiers appearing anywhere in the group's span. */
  readonly identifiersInSpan: number
  readonly diagramCarriers: number
  readonly acceptanceCriteria: number
  readonly tests: number
}

/**
 * `identifiersInSpan` is the number the dispatch warned about: for E it is
 * eleven against ten entries, and for F and G it is ten against ten. It is
 * stated here as a transcribed measurement and re-measured from the frozen
 * source by the suite, so the two can disagree and be caught.
 *
 * Acceptance criteria and tests pair EXACTLY in all three groups — 10:10,
 * 10:10, 12:12 — unlike §35.4's five-with-four and §21.5's nine-with-ten.
 * G's twelve is not a twelfth entry: `UC-OFF-070` alone carries three
 * criteria and three tests, and the other nine carry one each.
 */
export const GROUP_COUNTS = [
  {
    group: 'E',
    entries: 10,
    identifiersInSpan: 11,
    diagramCarriers: 3,
    acceptanceCriteria: 10,
    tests: 10,
  },
  {
    group: 'F',
    entries: 10,
    identifiersInSpan: 10,
    diagramCarriers: 2,
    acceptanceCriteria: 10,
    tests: 10,
  },
  {
    group: 'G',
    entries: 10,
    identifiersInSpan: 10,
    diagramCarriers: 2,
    acceptanceCriteria: 12,
    tests: 12,
  },
] as const satisfies readonly GroupCount[]

/* ── gaps, carried rather than repaired ────────────────────────────────── */

export interface CatalogueGap {
  readonly what: string
  /** Line the gap is visible on. */
  readonly line: number
  /** Why it is recorded rather than closed. */
  readonly why: string
}

/**
 * The eleven screens L81266 names as the catalogue's shared set, transcribed
 * so `SCREENS_OUTSIDE_SHARED_SET` is derived rather than asserted.
 */
export const CATALOGUE_SHARED_SCREENS = [
  'SCR-FL-RUNS-01',
  'SCR-FL-PLAYER-01',
  'SCR-FL-BLOCK-01',
  'SCR-FL-PARK-01',
  'SCR-FL-SYNC-03',
  'SCR-CC-BOARD-01',
  'SCR-CC-CONF-01',
  'SCR-CC-DEV-01',
  'SCR-DOH-RUN-01',
  'SCR-DOH-AUD-01',
  'SCR-SA-FLEET-01',
] as const satisfies readonly string[]

/**
 * Screens these entries name that the catalogue's own shared set does not.
 *
 * Derived in a function rather than a leading-annotated array literal: the
 * annotation form is what `tests/coverage/slice-2c-gates.test.ts` gate 2
 * rejects, and it rejected this one on first run. The return type carries the
 * `readonly` without the const declaring it.
 */
function screensOutsideSharedSet(): readonly string[] {
  const shared = new Set<string>(CATALOGUE_SHARED_SCREENS)
  return [...new Set(OFFLINE_USE_CASES_E_G.flatMap((u) => u.storyboards))].filter(
    (s) => !shared.has(s),
  )
}

export const SCREENS_OUTSIDE_SHARED_SET = screensOutsideSharedSet()

export const CATALOGUE_GAPS = [
  {
    what:
      "Group E's span holds eleven UC-OFF identifiers and ten entries; the eleventh is UC-OFF-036, a group D entry named inside UC-OFF-042's numbered steps.",
    line: 81532,
    why: 'Ownership is a property of the entry, not of the span it is mentioned in. Recorded so a span-scan cannot be mistaken for a census.',
  },
  {
    what:
      'Three storyboard screens are named by these entries and are absent from the eleven the catalogue says every entry draws on.',
    line: 81266,
    why: 'All three are real identifiers elsewhere in the source, so the gap is in the catalogue’s claim about itself, not in the entries. Not repaired here.',
  },
  {
    what:
      'UC-OFF-049 issues a remote wipe, which the five-class command channel does not name as a class.',
    line: 81566,
    why: 'src/frontline/commands.ts already records the wipe and de-authorisation gap and refuses to mint a sixth class. Pointed at, not re-spelled.',
  },
  {
    what:
      'Nineteen of the fifty-three `Allowed` tokens across these thirty permission lines sit inside a prohibition clause.',
    line: 81683,
    why: 'A renderer keyed on the status token alone would publish them as grants. Counted per entry in negatedAllowedClauses so it is visible.',
  },
  {
    what:
      "UC-OFF-053's permission line states no status of its own; it reads only \"as `UC-OFF-051`.\", so AC-37A-005 is satisfied there on an empty set.",
    line: 81623,
    why: 'A deferral, not a blank — the entry it points at carries a full line. Recorded rather than filled in, because filling it in would state permissions the source does not.',
  },
] as const satisfies readonly CatalogueGap[]

/**
 * `DEC-SYNC-002` — command expiry horizons per command class. Raised at
 * L81588 as `UC-OFF-050`'s unspecified value and tabled at L81733, and named
 * by no hand-written file in this tree before this one. Recorded here, not
 * resolved: the source marks it `TBD — Client Decision Required`, and
 * choosing a horizon would answer a question the source asks twice and
 * settles never.
 *
 * `heldBy` is deliberately null. The moment the shared canon lifts this
 * identifier, the suite's absence check goes red and this record is replaced
 * by a pointer rather than left as a second spelling.
 */
export const UNDISCLOSED_DECISION = {
  id: 'DEC-SYNC-002',
  question: 'Command expiry horizons per command class',
  raisedAt: 81588,
  tabledAt: 81733,
  heldBy: null,
} as const

/**
 * The other five decisions these entries name. Each is already recorded
 * elsewhere in this tree, so only the identifier and the line the entry names
 * it on are carried — the option sets and their readings stay with their
 * existing holder.
 */
export const DECISIONS_NAMED_ELSEWHERE = [
  { id: 'DEC-SUSP-001', namedBy: 'UC-OFF-046', line: 81540 },
  { id: 'DEC-SYNC-001', namedBy: 'UC-OFF-048', line: 81564 },
  { id: 'DEC-WIPE-001', namedBy: 'UC-OFF-049', line: 81566 },
  { id: 'DEC-STORE-001', namedBy: 'UC-OFF-061', line: 81683 },
  { id: 'DEC-RETRIEVE-001', namedBy: 'UC-OFF-070', line: 81720 },
] as const satisfies readonly { readonly id: string; readonly namedBy: string; readonly line: number }[]

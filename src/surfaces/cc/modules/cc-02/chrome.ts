import type { CommandState } from '@/surfaces/sa/command-state'
import type { ElementFact, ElementIntent, ElementUnderTest } from '@/honesty/HonestElement'
import type { ScreenStateId } from '@/ui/screen-state'
import { CC_CHROME_MODULES } from '@/surfaces/cc/screens'
import { ccSeam, ccSeamStatus, type CcSeamStatus } from '@/surfaces/cc/seams'
import type { CcModuleId } from '@/surfaces/cc/modules'

/* ==================================================================== *
 * `MOD-CC-02` AS CHROME. WHAT IT RENDERS, AND WHERE IT HAS TO RENDER IT.
 *
 * THIS MODULE OWNS NO ROUTE AND THIS FILE CREATES NONE. Wave 0 settled it:
 * `src/surfaces/cc/modules.ts` declares `slug: null` for `MOD-CC-02` with the
 * reason on the record, and `AC-CC-040` at L35261 is the warrant — "The
 * surface exposes exactly thirteen modules; no fourteenth module route
 * exists." The register puts this module on `SCR-CC-02` beside `MOD-CC-01`
 * (L48387), and `MOD-CC-01`'s own module name IS that screen's name. Nothing
 * in this task re-registers the module, re-states the reason or adds a
 * directory; `CC_CHROME_MODULES` is CONSUMED, and `assertChromeModule` below
 * reads it rather than trusting it.
 *
 * THE PURPOSE LINE IS WHY THIS IS CHROME AND NOT A SCREEN. L36435 — the
 * module renders §21.3's live model "as concrete interface elements available
 * everywhere on the surface". L36503 — "Supplies markers to every other
 * module". A thing that renders on every element of every screen has no
 * screen of its own, and giving it one would be the fourteenth.
 *
 * IT IS A SERVER MODULE, AND THAT IS NOT STYLE. Four Run Player panels
 * shipped `data-testid="fl-panel-undefined"` in the built HTML while every
 * component test passed, because their data was a module-scope const in a
 * `'use client'` file and Next.js replaces a client module's exports with
 * client references. `src/surfaces/cc/screens.ts` records the same rule for
 * the shell's model. Nothing in this file carries `'use client'` and nothing
 * here may acquire one; only the COMPONENT in `./SyncStateChrome` crosses.
 * ==================================================================== */

/**
 * `MOD-CC-02` is chrome, read off the spine's derivation rather than typed
 * here. Throws rather than returning `false`: a chrome module that is no
 * longer chrome has either acquired a route or left the register, and both
 * are louder than a boolean.
 */
export function assertChromeModule(id: CcModuleId): void {
  if (!CC_CHROME_MODULES.includes(id)) {
    throw new Error(
      `${id} is not in CC_CHROME_MODULES. It either claims a route on the spine or appears in no ` +
        'row of the thirteen-screen register (L48386-L48398), and chrome is neither.',
    )
  }
}

/**
 * The host this chrome has nowhere to be without. Slice 9 builds
 * `MOD-CC-01`, so the seam is OPEN and saying so is the honest statement —
 * the chrome has no host yet, which is not the same as the chrome being
 * absent. Read from the registry wave 0 declared; not restated.
 */
export const CC02_HOST_SEAM_STATUS: CcSeamStatus = ccSeamStatus(ccSeam('sync-state-chrome-host'))

/* ==================================================================== *
 * THE MARKER'S STATES — AND THE CARD AND THE STORYBOARD DISAGREE ABOUT WHICH
 * FOUR THEY ARE.
 *
 * Both enumerations say four and they share three members.
 *
 * The card's `**States.**` line at L36469 opens "Marker states:
 * live-all-synced; partially-synced with counts and age; unknown-pending;
 * inventory-unavailable."
 *
 * The storyboard heading at L36575 reads "the marker in its four states", and
 * its slots are state one healthy (L36577), state two partial (L36579), state
 * three site-wide (L36581) and state four inventory unavailable (L36583).
 *
 * `unknown-pending` is a marker state on the card and is NOT one of the
 * storyboard's four — the storyboard folds it into state two's own words,
 * "pending captures unknown". In its place the storyboard's third slot is the
 * site-wide banner, which L36581 describes as "the full-width amber banner
 * described in storyboard `SB-CC-09`, with every tile still carrying its own
 * marker beneath it" — that is the banner ALONGSIDE the markers, not a state
 * a marker takes.
 *
 * BOTH ARE CARRIED AND NEITHER IS CHOSEN. The four below are the CARD's,
 * because the card's `**States.**` line is the module's own statement of its
 * states and the storyboard is an illustration of them; each carries the
 * storyboard's rendering where the storyboard gives one, and
 * `unknown-pending` records that it has none. The banner is not a marker
 * state here and lives in `CC02_CONNECTIVITY_STATES` instead.
 *
 * THE ORIGIN IS THE DEVICE FOR ALL FOUR, INCLUDING THE UNAVAILABLE ONE.
 * L36583 is explicit that the degraded form still carries a real time — "The
 * sync time above is from the sync log and is accurate" — so it states an age
 * of device knowledge like the other three, and L36587 calls it "a degraded
 * but truthful marker". A marker that reported no origin would fail the
 * origin clause at L78392 rather than degrade.
 * ==================================================================== */

export type Cc02MarkerStateId =
  | 'live-all-synced'
  | 'partially-synced'
  | 'unknown-pending'
  | 'inventory-unavailable'

export interface Cc02MarkerState {
  readonly id: Cc02MarkerStateId
  /** Verbatim from the card's `**States.**` line. */
  readonly cardWording: string
  /**
   * The storyboard's rendering of this state, verbatim, or `null` where
   * `SB-CC-13` has none for it. `null` is the finding, not a placeholder.
   */
  readonly storyboardWording: string | null
  readonly storyboardRef: string | null
  /** Clause 1 and clause 2 of the three-clause element test. */
  readonly fact: ElementFact
  readonly sourceRef: string
}

const AS_OF = 'as at the last successful sync in this scope'

export const CC02_MARKER_STATES = [
  {
    id: 'live-all-synced',
    cardWording: 'live-all-synced',
    storyboardWording: 'Live · all devices synced',
    storyboardRef: 'SB-CC-13 state one · L36577',
    fact: { from: 'device', asOfLabel: AS_OF },
    sourceRef: 'L36469',
  },
  {
    id: 'partially-synced',
    cardWording: 'partially-synced with counts and age',
    storyboardWording: 'Synced 09:11 · 1 of 3 devices offline · pending captures unknown',
    storyboardRef: 'SB-CC-13 state two · L36579',
    fact: { from: 'device', asOfLabel: AS_OF },
    sourceRef: 'L36469',
  },
  {
    /*
     * THE CARD'S FOURTH THAT THE STORYBOARD HAS NO SLOT FOR. Its rule is
     * `FUNC-CC-0201-1-3` at L36530 — "State pending captures as unknown where
     * the platform cannot know. Purpose: never let a zero be read as 'nothing
     * waiting'." L36483 says the same in one line: "The marker states unknown
     * rather than zero." That is the state's whole content, and rendering it
     * as a zero is the defect it exists to prevent.
     */
    id: 'unknown-pending',
    cardWording: 'unknown-pending',
    storyboardWording: null,
    storyboardRef: null,
    fact: { from: 'device', asOfLabel: AS_OF },
    sourceRef: 'L36469',
  },
  {
    id: 'inventory-unavailable',
    cardWording: 'inventory-unavailable',
    storyboardWording:
      'Device sync state unavailable · last successful sync in this scope 09:11:47',
    storyboardRef: 'SB-CC-13 state four · L36583',
    fact: { from: 'device', asOfLabel: AS_OF },
    sourceRef: 'L36469',
  },
] as const satisfies readonly Cc02MarkerState[]

/**
 * NEVER A ZERO. `FUNC-CC-0201-1-3` (L36530) and the alternate path at L36483
 * both say the marker states unknown rather than zero, so the pending count
 * is `number | 'unknown'` and there is no third spelling — no `-1`, no
 * `null`, no optional field a renderer would print as blank.
 */
export type Cc02PendingCaptures = number | 'unknown'

/**
 * WORD ORDER TAKEN FROM THE SOURCE, WHICH WROTE IT ONCE.
 *
 * This read `${pending} pending captures` and the source's only numeric
 * example of it reads **`14 captures pending`** — the marker's own worked
 * example in §21.3.2. `src/surfaces/cc/live/model.ts` transcribed the source's
 * order; this file inverted it, and two spellings of one marker's numeric
 * branch is exactly the drift a shared model exists to prevent.
 *
 * Found by the module that mounts both: its board renders the numeric text
 * through the live model and the chrome's text beside it, so the disagreement
 * was visible in one screen and invisible in either file alone.
 *
 * The unknown branch was never in doubt — both files agree on
 * `pending captures unknown`, so the never-zero rule was unaffected and only
 * the numeric branch moved.
 */
export const cc02PendingText = (pending: Cc02PendingCaptures): string =>
  pending === 'unknown' ? 'pending captures unknown' : `${pending} captures pending`

/* ==================================================================== *
 * THE CONNECTIVITY STATES AND THEIR THRESHOLDS.
 *
 * Five states on the card's `**States.**` line (L36469) and FOUR notification
 * rows (header L36507, separator L36508, data L36509-L36512), which is not a
 * contradiction: `normal` and `degrading` share the pre-threshold ground and
 * only three of the five have a notification, the fourth row being the
 * restoration.
 *
 * ROW 7 OF THE MATRIX PROHIBITS CONFIGURING THESE IN EVERY COLUMN, so the
 * numbers are transcribed as the configured thresholds the source names and
 * never as values this surface offers to change.
 * ==================================================================== */

export interface Cc02ConnectivityState {
  /** Verbatim from L36469's `Connectivity states:` list. */
  readonly wording: string
  /** Minutes elapsed, or `null` for the two states no threshold names. */
  readonly thresholdMinutes: number | null
  /** Verbatim `Recipient` cell, or `null` where no notification row exists. */
  readonly recipient: string | null
  readonly sourceRef: string
}

export const CC02_CONNECTIVITY_STATES = [
  { wording: 'normal', thresholdMinutes: null, recipient: null, sourceRef: 'L36469' },
  { wording: 'degrading', thresholdMinutes: null, recipient: null, sourceRef: 'L36469' },
  {
    wording: 'platform-alerted at 30 minutes',
    thresholdMinutes: 30,
    recipient: "The client's Super Admin platform team",
    sourceRef: 'L36469 · L36509',
  },
  {
    wording: 'tenant-bannered at 60 minutes',
    thresholdMinutes: 60,
    recipient:
      'Tenant Admin, named; rendered to all in-scope Command Center users under the strengthened rule of section 21.3.3',
    sourceRef: 'L36469 · L36510',
  },
  {
    wording: 'on-call-escalated at 120 minutes',
    thresholdMinutes: 120,
    recipient: "The platform's on-call rota",
    sourceRef: 'L36469 · L36511',
  },
] as const satisfies readonly Cc02ConnectivityState[]

/**
 * THE ONLY TENANT-FACING ONE IS THE SIXTY-MINUTE BANNER, and the two either
 * side of it are explicitly not tenant channels — L36509 "Platform-side
 * alerting, not a tenant channel", L36511 "Platform-side escalation, not a
 * tenant channel". `FUNC-CC-0202-1-1` (L36535) and `FUNC-CC-0202-1-3`
 * (L36537) both prohibit tenant roles from the platform-side ones outright.
 * So chrome renders exactly one of the three thresholds.
 */
export const CC02_TENANT_BANNER_MINUTES = 60

/**
 * The banner's origin is the SERVER'S OWN RECORD, not a device. L36535 —
 * "detection is server-side"; L36478 — the module "tracks elapsed time" over
 * a site-level state. Getting this wrong would put an age on an element that
 * has no device knowledge to be old.
 */
export const CC02_BANNER_FACT: ElementFact = { from: 'server-record' }

/**
 * A false banner is its own credibility failure, so unknown is NOT lost.
 * L36587 states the rule and its terminal safe state: "treat unknown as
 * not-lost and continue to render per-device markers, because a false
 * site-wide banner would be its own credibility failure ... the tenant banner
 * is withheld rather than guessed."
 */
export const cc02BannerShows = (elapsedMinutes: number | 'unknown'): boolean =>
  elapsedMinutes !== 'unknown' && elapsedMinutes >= CC02_TENANT_BANNER_MINUTES

/* ==================================================================== *
 * THE THREE RUN STATES, AND THE ONE THIS MODULE REFUSES TO PICK.
 *
 * L36446, business rule 6 — "Run completion is rendered in three distinct
 * states, never collapsed into 'done'". L36469 names them: submitted;
 * complete; finished. `AC-CC-186` at L36597 is the criterion.
 *
 * THE RULE AND THE HONESTY LEXICON AGREE, WHICH IS WORTH SAYING BECAUSE IT IS
 * CHECKABLE. `PHRASING_RULES`' ninth rule, `tick-next-to-done`, is drawn from
 * L78384 — "must never draw a tick next to" — and is `bare-claim` scoped.
 * Rule 6 forbids collapsing three states into that same word. Two chapters,
 * one prohibition, and `honestyDefects` already enforces it, so nothing here
 * re-implements it.
 *
 * AND THIS MODULE ASSERTS NO STATE FOR A MANUALLY CLOSED RUN.
 * `DEC-STUCK-001` is open on exactly that question and this card states one
 * of its readings as flat fact: L36485's alternate path reads "the run then
 * stands submitted with the gap recorded", which is Reading B (L5256) word
 * for word, while L27917's matrix cell states Reading A — "the run is
 * `complete` at close time". `AC-RUN-004` at L7128 refuses both. The decision
 * is already disclosed by `MOD-FL-B11` and `MOD-DOH-06`, so it is not
 * respelled here; what this module does is decline to route a manual close
 * into either state. `manuallyClosedGoesTo` is the field that would hold the
 * answer and it deliberately does not exist.
 * ==================================================================== */

export const CC02_RUN_STATES = ['submitted', 'complete', 'finished'] as const

export type Cc02RunState = (typeof CC02_RUN_STATES)[number]

export interface Cc02RunStateRendering {
  readonly state: Cc02RunState
  /** What the state means, from its own functionality. */
  readonly meaning: string
  /** What moves a run into it. Never a manual close — see the header. */
  readonly enteredBy: string
  readonly sourceRef: string
}

export const CC02_RUN_STATE_RENDERINGS = [
  {
    state: 'submitted',
    meaning: 'the acted-on state, with pending-sync detail',
    enteredBy: 'the worker declaring their part finished; held here while devices owe data',
    sourceRef: 'FUNC-CC-0204-1-1 · L36547',
  },
  {
    state: 'complete',
    meaning: 'rendered only when every assigned device has synced',
    enteredBy: 'the last sync landing; never while a device owes data',
    sourceRef: 'FUNC-CC-0204-1-2 · L36548',
  },
  {
    state: 'finished',
    meaning: 'its figures marked final',
    enteredBy: 'the record-finish window elapsing, automatically and server-side',
    sourceRef: 'FUNC-CC-0204-1-3 · L36549',
  },
] as const satisfies readonly Cc02RunStateRendering[]

/**
 * A run state is the HUB RECORD's, not the device's. The card's
 * `**Preconditions.**` line at L36461 requires "the run record's lifecycle
 * state readable"; L36467 says the write it carries is executed on the Hub;
 * L36501 lists it among this module's dependencies. So the origin clause
 * answers "the server's own record" and there is no age on the state itself.
 * The DEVICE age that belongs beside it is the marker's, rendered as its own
 * element, which is exactly what L36475 describes: the marker renders before
 * the element's value renders.
 */
export const CC02_RUN_STATE_FACT: ElementFact = { from: 'server-record' }

/* ==================================================================== *
 * THE EFFECT CLAUSE, WHICH IS THE CLAUSE THE ABSOLUTE RULE TURNS ON.
 *
 * L78394 — an element describing an intent aimed at a device names the
 * command's true state and uses no word implying completion until
 * acknowledgement. `src/honesty/HonestElement.tsx` binds that to a
 * `CommandState` and this module is where the binding earns its keep:
 * L36520 names `FB-CC-CMD` "for the per-device command confirmation state the
 * marker supports", so the marker is the surface's carrier of exactly that
 * state, and L48472's `STATE-09` rendering — "issued, then propagating with a
 * per-device list, then in force. Never shown as done on issue" — is the
 * shape it takes on the board.
 *
 * `cc02Element` builds the element the three-clause test consumes. It takes
 * the intent rather than defaulting it: a defaulted parameter does not count
 * toward `Function.length`, and slice 7 recorded an arity gate beaten by
 * exactly that. Here the cost of a default would be worse than a beaten gate
 * — every element would silently declare itself not-about-a-device, which is
 * the honest-looking half of the dishonest rendering.
 * ==================================================================== */

export const cc02NoDeviceIntent: ElementIntent = { aimedAtDevice: false }

export const cc02DeviceIntent = (commandState: CommandState): ElementIntent => ({
  aimedAtDevice: true,
  commandState,
})

export function cc02Element(
  statement: string,
  fact: ElementFact,
  intent: ElementIntent,
): ElementUnderTest {
  return { statement, fact, intent }
}

/* ==================================================================== *
 * `SCR-CC-02`'S STATE INVENTORY — THIRTEEN ROWS, AND IT IS THE SCREEN'S.
 *
 * COUNTED, NOT INFERRED FROM A SPAN. Header L48462, separator L48463, data
 * L48464 to L48476 — THIRTEEN rows, `STATE-01` through `STATE-13`. The body
 * stops there: the next line carrying anything at all is the accessibility
 * paragraph at L48478. (The blank between them is deliberately not cited —
 * `tests/coverage/locator-fidelity.test.ts` lexes any L-number in a comment
 * as a citation, so naming a blank line files a knowingly-false one.) The
 * dispatch brief gave
 * the span as L48462-L48475, which stops at `STATE-12` Failure and drops
 * `STATE-13` Recovery — the row that carries the audited recompute this
 * module's own `**Recovery and reconciliation.**` paragraph (L36522)
 * describes. Reported.
 *
 * AND THE TABLE BELONGS TO THE SCREEN, NOT TO THIS MODULE. L48460 introduces
 * it as "Full state inventory for `SCR-CC-02`, the live shift board" — the
 * screen `MOD-CC-01` owns and this module renders on. It is transcribed here
 * because two of its rows ARE this module's chrome and no other slice-8 task
 * owns the screen; `owner` records which module each row belongs to so a
 * slice-9 task building `MOD-CC-01` finds the eleven that are its own rather
 * than a table already claimed.
 *
 * `ScreenStateId` IS IMPORTED, NEVER REDECLARED. §25's shared contract
 * already closes the vocabulary at thirteen (`src/ui/screen-state.ts`), and
 * the source's own framing at L48000 is that a screen "only has to record
 * where it differs". These rows are the departures, not a second vocabulary.
 * ==================================================================== */

export interface Cc02ScreenState {
  readonly id: ScreenStateId
  /** Verbatim from the `State` column, minus the identifier. */
  readonly name: string
  /** Verbatim from the `What the user actually sees` column. */
  readonly seen: string
  /** Which module draws this row. `MOD-CC-02` for the two that are chrome. */
  readonly owner: CcModuleId
  readonly sourceRef: string
}

export const SCR_CC_02_STATE_INVENTORY = [
  {
    id: 'STATE-01',
    name: 'Empty',
    seen: '"No runs are scheduled in your scope for Day Shift." with the scope named and a link to the run schedule in the Delivery Operations Hub. Never confused with a connectivity problem.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48464',
  },
  {
    id: 'STATE-02',
    name: 'Loading',
    seen: 'Tile skeletons with "Loading board for Assembly Line A". No cell shows a status until its status is known.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48465',
  },
  {
    id: 'STATE-03',
    name: 'Success',
    seen: 'Quiet summary band for normal cells, exception tiles ranked by severity, freshness marker on every tile, refresh interval shown.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48466',
  },
  {
    id: 'STATE-04',
    name: 'Validation',
    seen: 'On a release request: "A release request requires a note." The request is not created until the note is present.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48467',
  },
  {
    id: 'STATE-05',
    name: 'Permission-denied',
    seen: 'For a Supervisor opening a gate item: "Gate decisions are Quality Manager actions." The item remains readable. The attempt is audited.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48468',
  },
  {
    id: 'STATE-06',
    name: 'Read-only',
    seen: 'Under a support session or hard suspension: a banner naming the cause, with all ten actions disabled and the board still rendering.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48469',
  },
  {
    /*
     * THE ROW THAT AGREES WITH THE SHARED CONTRACT BY REFUSING THE STATE.
     * `SCREEN_STATES`' `STATE-07` carries `frontlineOnly: true`, and L48470
     * says why for this surface: "Not applicable to this surface — the
     * Command Center is web only." It is owned by this module rather than
     * the board because its second sentence hands the case to `STATE-08`,
     * which is this module's marker.
     */
    id: 'STATE-07',
    name: 'Offline',
    seen: "Not applicable to this surface — the Command Center is web only. The floor's offline state is rendered as `STATE-08` on the affected tiles.",
    owner: 'MOD-CC-02',
    sourceRef: 'L48470',
  },
  {
    /*
     * THE MARKER, ON THE BOARD. This is `MOD-CC-02`'s `partially-synced`
     * state rendered as the screen sees it, and the sentence after it is the
     * never-blank rule of L36444 in the screen's own words.
     */
    id: 'STATE-08',
    name: 'Stale-data',
    seen: '"Synced 13:58 · all 3 devices offline" on the tile; selecting it lists the devices and their last-seen times. The board never blanks because the floor went dark.',
    owner: 'MOD-CC-02',
    sourceRef: 'L48471',
  },
  {
    id: 'STATE-09',
    name: 'Queued',
    seen: 'A granted clearance or released hold renders as issued, then propagating with a per-device list, then in force. Never shown as done on issue.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48472',
  },
  {
    id: 'STATE-10',
    name: 'Artificial-intelligence-degraded',
    seen: '"Prevention Agent: degraded — coaching selection unavailable, authored instructions in use on the floor." Deterministic detection continues and the panel says so.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48473',
  },
  {
    id: 'STATE-11',
    name: 'Artificial-intelligence-unavailable',
    seen: '"Agents paused by the platform." Gate items already raised stay human-decidable; nothing pretends the agents are quiet.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48474',
  },
  {
    id: 'STATE-12',
    name: 'Failure',
    seen: '"The board could not refresh. Showing data as of 13:58." plus a retry. No figure is presented as current.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48475',
  },
  {
    id: 'STATE-13',
    name: 'Recovery',
    seen: '"Recomputing after 41 late captures" with changed-since markers where a severity count moved and an audited recompute event behind it.',
    owner: 'MOD-CC-01',
    sourceRef: 'L48476',
  },
] as const satisfies readonly Cc02ScreenState[]

/**
 * The two rows of the screen's inventory this module draws. Derived, so a row
 * changing owner cannot leave a second list stale.
 */
export const CC02_OWNED_SCREEN_STATES: readonly ScreenStateId[] =
  SCR_CC_02_STATE_INVENTORY.filter((s) => s.owner === 'MOD-CC-02').map((s) => s.id)

/**
 * This module writes no records, and that is stated three times on the card —
 * L36465 "The module writes no records", L36467 "Objects affected. None
 * directly", L36516 "Audit. The module writes no records". Exported so a gate
 * can hold it: chrome that acquired a write would be the same defect as
 * chrome that acquired a route.
 */
export const CC02_WRITES_RECORDS = false

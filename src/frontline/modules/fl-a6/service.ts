import type { DecisionReading } from '@/disclosure/decisions'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import { CAPTURE_STATES, captureStateLine, type CaptureState } from '@/frontline/capture'
import { DEC_SYNC_001_ORDER, STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS } from '@/frontline/commands'
import {
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'

/**
 * `MOD-FL-A6`'s own logic and vocabulary. Frozen source §22.15.
 *
 * ── THE ONE STRUCTURAL RULING IN THIS FILE ─────────────────────────────
 *
 * THIS MODULE WRITES NO STATE LABEL OF ITS OWN. Every line the sync sheet
 * prints for a capture comes from `captureStateLine` in `@/frontline/capture`,
 * which reads a TOTAL record over the closed thirteen-member ladder. There is
 * no branch here that could produce "Synced", because there is no place here
 * that produces a label at all — L39622 says there is no single state called
 * synced and no bare success, and `AC-FL-006-3` (L39636) forbids any interface
 * in the platform rendering a capture as synced without naming its actual
 * state.
 *
 * That matters more on this module than on any other. `AC-FL-010-5` (L40049)
 * puts the sync indicator on every screen of every destination, so this is the
 * one module able to ship a false sync claim on all six at once. The defence
 * is that the vocabulary is not this file's to extend.
 *
 * CONNECTIVITY IS THIS MODULE'S SUBJECT, WHICH IS WHY THE RULING IS NOT A5's.
 * `MOD-FL-A5` holds its position by giving `containmentDecision` no
 * connectivity parameter at all. Here a connectivity parameter is correct and
 * required: `FUNC-A6-02-2-3` (L41171) gives the manual control two different
 * honest answers, "Online: attempts immediately. Offline: reports no
 * connection honestly." So exactly ONE function in this file takes it —
 * `manualSync` — and what is held structurally instead is that its result has
 * no field, and its union no member, in which an obligation could be recorded.
 * `AC-A6-11` (L41255): the worker is never presented with a conflict, a queue
 * editor, or a sync obligation.
 *
 * ── WHAT IS NOT RE-DERIVED HERE ────────────────────────────────────────
 *
 * The capture ladder, its labels and the platform-holds-the-record boundary
 * come from `@/frontline/capture`. The reconnection ordering comes from
 * `DEC_SYNC_001_ORDER` in `@/frontline/commands`, which settled `DEC-SYNC-001`
 * Option C for slice 7 and slice 8 both; this module discloses it and does not
 * re-decide it. The de-authorisation and remote-wipe gap in that ordering is
 * wave 0's recorded finding and is read from
 * `STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS` rather than restated. The offline
 * treatment comes from `frontlineConnectivityTreatment`. The fallback patterns
 * come from `patternsForModule`. None of the five is spelled a second time
 * here.
 */

/* ==================================================================== *
 * THE TWENTY-EIGHT FUNCTIONALITIES — THE LARGEST OF THE TWELVE MODULES.
 *
 * Counted off the source between the Features heading (L41158) and the Mermaid
 * block (L41209), not off a brief. Eight features, ten sub-features.
 * ==================================================================== */

export interface A6Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /**
   * The `Roles prohibited:` clause, verbatim. `null` where the source states
   * none — which is ONE of the twenty-eight, `FUNC-A6-07-1-4` (L41201), whose
   * whole body is `Client Decision Required` under `DEC-STORE-001`. Its
   * `Roles allowed:` clause reads `Client Decision Required` and there is no
   * prohibited clause at all; carrying the allowed clause under this field
   * would read as faithful and would not be.
   */
  readonly rolesProhibited: string | null
  /** The online-and-offline clause, verbatim. */
  readonly connectivity: string
  readonly patterns: readonly FrontlineFallbackId[]
  /** Why `patterns` is empty, in the source's own words. `null` otherwise. */
  readonly patternsNote: string | null
  /**
   * Whether this slice's screen exercises the functionality, or only states
   * it. Slice 8 builds the offline simulation, package staging, the reconnect
   * ladder and convergence; a module that rendered twenty-eight rows without
   * saying which of them it drives would be claiming a slice it has not built.
   */
  readonly exercisedInThisSlice: boolean
  readonly sourceRef: string
}

export const A6_FUNCTIONALITIES = [
  {
    id: 'FUNC-A6-01-1-1',
    statement:
      'Deliver the Workflow package at Run assignment, carrying the screens, specification limits, ' +
      "severity bands and their tenant action bundles, gate rules, deviation-capture forms, the step's " +
      'Work Instructions in their authored difficulty levels, and the short coaching assets.',
    rolesProhibited: 'Roles prohibited: no worker may modify a package.',
    connectivity: 'Online: delivered. Offline: cannot be delivered; the Run stays not-yet-ready.',
    patterns: ['FB-FL-PKG-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-01-1-1 · L41162',
  },
  {
    id: 'FUNC-A6-01-1-2',
    statement: 'Execute a full Run offline and sync on reconnection.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online and offline: identical execution.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-01-1-2 · L41163',
  },
  {
    id: 'FUNC-A6-01-1-3',
    statement: 'Pin each Run to its package version.',
    rolesProhibited: 'Roles prohibited: nobody may re-base an in-flight Run.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-PKG-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-01-1-3 · L41164',
  },
  {
    id: 'FUNC-A6-02-1-1',
    statement:
      'Sync continuously when connected, resume automatically on reconnection, and never make sync ' +
      'a worker action.',
    rolesProhibited: 'Roles prohibited: no worker may be required to sync.',
    connectivity: 'Online: continuous. Offline: degrades gracefully to queues.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    exercisedInThisSlice: true,
    sourceRef: 'FUNC-A6-02-1-1 · L41167',
  },
  {
    id: 'FUNC-A6-02-2-1',
    statement:
      'Keep the upload queue durable so it survives application restart, device restart, and power ' +
      'loss.',
    rolesProhibited: 'Roles prohibited: nobody may clear it.',
    connectivity: 'Online and offline: identical durability.',
    patterns: ['FB-FL-UP-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-02-2-1 · L41169',
  },
  {
    id: 'FUNC-A6-02-2-2',
    statement: 'Resume a mid-sync connection drop where it left off rather than restarting.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online: resumes. Offline: waits.',
    patterns: ['FB-FL-UP-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-02-2-2 · L41170',
  },
  {
    id: 'FUNC-A6-02-2-3',
    statement: 'Offer a manual sync control as a convenience only, never as a dependency.',
    rolesProhibited: 'Roles prohibited: no behaviour may require it.',
    connectivity: 'Online: attempts immediately. Offline: reports no connection honestly.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    exercisedInThisSlice: true,
    sourceRef: 'FUNC-A6-02-2-3 · L41171',
  },
  {
    id: 'FUNC-A6-03-1-1',
    statement:
      'Pull pending control actions on each sync and apply them in order across the five classes — ' +
      'lot release, reassignment or substitution, qualification clearance, suspension, version ' +
      'change — in two passes against the upload queue under the adopted DEC-SYNC-001 ordering: the ' +
      'stop class (suspension in all three states, device de-authorisation and remote wipe, any ' +
      'tenant compliance stop) applies before the queue drains, and the enabling class (lot release, ' +
      'reassignment or substitution, qualification clearance, version change) after it.',
    rolesProhibited: 'Roles prohibited: no worker interaction exists.',
    connectivity: 'Online: pulls. Offline: nothing arrives, and no surface may imply otherwise.',
    patterns: ['FB-FL-CMD-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-03-1-1 · L41174',
  },
  {
    id: 'FUNC-A6-03-1-2',
    statement: 'Validate before applying and acknowledge the outcome, including rejections.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity:
      'Online and offline: validation is local; acknowledgement requires connectivity.',
    patterns: ['FB-FL-CMD-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-03-1-2 · L41175',
  },
  {
    id: 'FUNC-A6-04-1-1',
    statement: 'Stamp every capture with both device time and server-receipt time.',
    rolesProhibited: 'Roles prohibited: nobody may alter either after capture.',
    connectivity: 'Online: both present. Offline: server-receipt time absent until receipt.',
    patterns: ['FB-FL-TIME-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-04-1-1 · L41178',
  },
  {
    id: 'FUNC-A6-04-1-2',
    statement: 'Treat server-receipt time as authoritative for ordering at sync.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online: applied. Offline: Not applicable — ordering at sync occurs at sync.',
    patterns: ['FB-FL-TIME-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-04-1-2 · L41179',
  },
  {
    id: 'FUNC-A6-04-2-1',
    statement:
      'Flag clock skew beyond the tenant-set threshold, default about 5 minutes with a platform ' +
      'ceiling of 60 minutes, as an operational event.',
    rolesProhibited: 'Roles prohibited: no worker may clear the flag.',
    connectivity: 'Online and offline: detection is local.',
    patterns: ['FB-FL-TIME-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-04-2-1 · L41181',
  },
  {
    id: 'FUNC-A6-04-2-2',
    statement:
      "Stop trusting a skew-flagged device's timestamps to decide anything on their own: ordering " +
      'follows server receipt, and a conflict that would otherwise resolve by device timestamp ' +
      "routes to the Client Command Center's conflict-and-skew review instead of resolving silently " +
      'on an untrusted clock.',
    rolesProhibited: 'Roles prohibited: the worker never sees it.',
    connectivity:
      'Online: routing occurs. Offline: the flag is recorded and the routing happens at sync.',
    patterns: ['FB-FL-TIME-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-04-2-2 · L41182',
  },
  {
    id: 'FUNC-A6-05-1-1',
    statement:
      'Trust cached credentials and qualifications offline within a bounded window: tenant-set, ' +
      'default about 24 hours, platform ceiling 72 hours, shortenable but never exceedable.',
    rolesProhibited:
      'Roles prohibited: no tenant may exceed the ceiling; the platform rejects a looser value.',
    connectivity: 'Online: refreshed. Offline: counts down.',
    patterns: ['FB-FL-AUTH-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-05-1-1 · L41185',
  },
  {
    id: 'FUNC-A6-05-2-1',
    statement:
      'Force a sync before designated high-risk actions, sign-offs foremost among them, so the ' +
      'identities and authority those actions record are fresh, not stale cache.',
    rolesProhibited: 'Roles prohibited: nobody may proceed without the sync.',
    connectivity: 'Online: proceeds. Offline: the action does not proceed and the step waits.',
    patterns: ['FB-FL-AUTH-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-05-2-1 · L41187',
  },
  {
    id: 'FUNC-A6-05-3-1',
    statement:
      "Enforce a clearance's tenant-defined duration at the next gate evaluation, so the block " +
      're-applies when the worker next meets a step the gate governs; the platform does not yank a ' +
      'worker out of the step under way.',
    rolesProhibited: 'Roles prohibited: no worker override.',
    connectivity: 'Online and offline: identical, because the evaluation is local.',
    patterns: ['FB-FL-GATE-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-05-3-1 · L41189',
  },
  {
    id: 'FUNC-A6-05-3-2',
    statement:
      'Park the Run on re-block and let the worker continue with their other assigned Runs.',
    rolesProhibited: 'Roles prohibited: nobody may unpark without a clearance.',
    connectivity: 'Online: a new clearance can arrive. Offline: it cannot.',
    patterns: ['FB-FL-GATE-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-05-3-2 · L41190',
  },
  {
    id: 'FUNC-A6-06-1-1',
    statement:
      'Finish a Run on the Workflow version it started on, never re-basing an in-flight Run under ' +
      "the worker's feet.",
    rolesProhibited: 'Roles prohibited: nobody, on any surface.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-PKG-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-06-1-1 · L41193',
  },
  {
    id: 'FUNC-A6-06-1-2',
    statement:
      'Deliver version-change notices at the boundary of the next execution, never inside a Run.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity:
      'Online: the notice is prepared from the delivered command. Offline: the notice waits with ' +
      'the command.',
    patterns: ['FB-FL-CMD-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-06-1-2 · L41194',
  },
  {
    id: 'FUNC-A6-06-1-3',
    statement:
      'Accept approved Lane B learning changes to package-borne values as auto-published patch ' +
      "versions, adopted per the tenant's chosen adoption timing, while server-only values apply " +
      'immediately server-side and never touch the package.',
    rolesProhibited: 'Roles prohibited: nothing auto-approves.',
    connectivity: 'Online: arrives as a command. Offline: waits.',
    patterns: ['FB-FL-CMD-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-06-1-3 · L41195',
  },
  {
    id: 'FUNC-A6-07-1-1',
    statement:
      'Evict media only after confirmed server receipt plus an integrity check, never on the ' +
      'strength of an attempted upload.',
    rolesProhibited: 'Roles prohibited: nobody may force eviction.',
    connectivity: 'Online: eviction proceeds after confirmation. Offline: no eviction.',
    patterns: ['FB-FL-STORE-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-07-1-1 · L41198',
  },
  {
    id: 'FUNC-A6-07-1-2',
    statement:
      "Stage today's Runs fully and near-horizon Runs lazily, with eviction following " +
      'complete-and-synced, validated against the published minimum device specification.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online: staging proceeds. Offline: no new staging.',
    patterns: ['FB-FL-PKG-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-07-1-2 · L41199',
  },
  {
    id: 'FUNC-A6-07-1-3',
    statement:
      "Hold only what the assigned Runs require, never the wider tenant's data, and hold it only " +
      'briefly, with the long-horizon record owned upstream.',
    rolesProhibited: "Roles prohibited: nobody may broaden the device's scope.",
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-SEC-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-07-1-3 · L41200',
  },
  {
    id: 'FUNC-A6-07-1-4',
    statement: 'Behave per platform when storage is full.',
    rolesProhibited: null,
    connectivity: 'Online and offline: Client Decision Required.',
    patterns: ['FB-FL-STORE-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-07-1-4 · L41201',
  },
  {
    id: 'FUNC-A6-08-1-1',
    statement:
      'Resolve a rare true conflict by last-write-wins on device timestamp — the rule that the most ' +
      'recently written value replaces the earlier one, which matters because it is simple and fast ' +
      'but discards the loser, and which belongs in the glossary.',
    rolesProhibited: 'Roles prohibited: the worker never sees it.',
    connectivity:
      'Online: applied at sync. Offline: Not applicable — conflicts are detected at sync.',
    patterns: ['FB-FL-TIME-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-08-1-1 · L41204',
  },
  {
    id: 'FUNC-A6-08-1-2',
    statement:
      'Rely on the confirmed clean multi-worker model: work on a shared Run proceeds sequentially ' +
      'with proper hand-over, or is split so each worker owns different steps or different parts, ' +
      'so no two people edit the same record at the same instant.',
    rolesProhibited: 'Roles prohibited: concurrent same-record editing is out of scope.',
    connectivity: 'Online and offline: identical.',
    patterns: [],
    patternsNote: 'Not applicable — an excluded capability has no failure mode.',
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-08-1-2 · L41205',
  },
  {
    id: 'FUNC-A6-08-1-3',
    statement:
      'Attribute every step to whoever performed it, so many hands contributing over time is fully ' +
      'supported.',
    rolesProhibited: 'Roles prohibited: nobody may re-attribute.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-CAP-01'],
    patternsNote: null,
    exercisedInThisSlice: false,
    sourceRef: 'FUNC-A6-08-1-3 · L41206',
  },
  {
    id: 'FUNC-A6-08-1-4',
    statement:
      'Keep conflict review on the Client Command Center, where the worker never sees it.',
    rolesProhibited: 'Roles prohibited: Worker.',
    connectivity:
      'Online and offline: Not applicable — this functionality is enforced on the Client Command ' +
      'Center, not on the device.',
    patterns: [],
    patternsNote: 'Not applicable — same reason.',
    exercisedInThisSlice: true,
    sourceRef: 'FUNC-A6-08-1-4 · L41207',
  },
] as const satisfies readonly A6Functionality[]

/** The §22.9 map's answer for this module, read rather than transcribed. Eight. */
export const A6_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-A6')

/**
 * Every pattern this module's own functionalities name, derived from the list
 * above. A second reading of the same obligation, so the two can be compared
 * instead of one being trusted. Ten.
 */
export const A6_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(A6_FUNCTIONALITIES.flatMap((f) => f.patterns as readonly FrontlineFallbackId[])),
] as const satisfies readonly FrontlineFallbackId[]

/**
 * The card's own Fallback identifier field (L41154), read as a LIST rather
 * than as prose, so the third reading can be compared with the other two.
 * Seven.
 */
export const A6_CARD_PATTERNS = [
  'FB-FL-CORE-01',
  'FB-FL-UP-01',
  'FB-FL-CMD-01',
  'FB-FL-PKG-01',
  'FB-FL-TIME-01',
  'FB-FL-STORE-01',
  'FB-FL-AUTH-01',
] as const satisfies readonly FrontlineFallbackId[]

/* ==================================================================== *
 * THE SYNC DETAIL SHEET — STORYBOARD `SB-FL-015`, L41235.
 *
 * The storyboard's own sheet: five counted lines, a last-synced line, and one
 * control. Its closing sentence is the denial this module is judged on —
 * "There is no conflict list, no resolve button, and no queue-editing control
 * anywhere on the sheet."
 *
 * THE COUNTS ARE THE STORYBOARD'S AND THE LABELS ARE NOT. `storyboardLabel`
 * is what the sheet writes; `state` is the rung of `@/frontline/capture`'s
 * thirteen it names, and the sentence the panel prints comes from
 * `captureStateLine` over that rung. Holding the two apart is what stops the
 * storyboard's five short words becoming a sixth state vocabulary — and it is
 * what makes the "platform does not hold this record yet" clause travel with
 * the four device-held rungs without this file deciding which four they are.
 * ==================================================================== */

export interface SyncSheetRow {
  /** The rung of the thirteen-member capture ladder this line reports. */
  readonly state: CaptureState
  /** The storyboard's own words for it, verbatim from L41235. */
  readonly storyboardLabel: string
  readonly count: number
}

export const SB_FL_015_SHEET = [
  { state: 'committed-locally', storyboardLabel: 'Committed locally', count: 2 },
  { state: 'queued', storyboardLabel: 'Queued', count: 5 },
  { state: 'uploading', storyboardLabel: 'Uploading', count: 1 },
  { state: 'upload-interrupted', storyboardLabel: 'Upload interrupted', count: 1 },
  { state: 'server-received', storyboardLabel: 'Server received', count: 11 },
] as const satisfies readonly SyncSheetRow[]

/** The storyboard's own last-synced line, verbatim. */
export const SB_FL_015_LAST_SYNCED = 'Last synced 08:29.'

/** The storyboard's own denial sentence, verbatim. What the sheet must not grow. */
export const SB_FL_015_DENIAL =
  'There is no conflict list, no resolve button, and no queue-editing control anywhere on the sheet.'

/**
 * What the sheet prints for one line. The count and the storyboard's word are
 * this module's; the SENTENCE is `captureStateLine`'s, unaltered.
 */
export function syncSheetLine(row: SyncSheetRow): string {
  return `${row.storyboardLabel}: ${row.count}. ${captureStateLine(row.state)}`
}

/** Twenty captures on the sheet. Derived from the rows, never quoted beside them. */
export const SB_FL_015_TOTAL = SB_FL_015_SHEET.reduce((n, r) => n + r.count, 0)

/**
 * The eight rungs of the thirteen the storyboard's sheet does not report.
 * DERIVED, so a sheet row added or dropped moves this without anyone
 * remembering to. It is rendered, because a sheet that shows five of thirteen
 * and does not say so implies the ladder has five rungs.
 */
export const RUNGS_NOT_ON_THE_SHEET: readonly CaptureState[] = CAPTURE_STATES.filter(
  (s) => !SB_FL_015_SHEET.some((r) => r.state === s),
)

/* ==================================================================== *
 * THE WORD ITSELF, AND WHY A BLANKET BAN WOULD HAVE BEEN THE WRONG GATE.
 *
 * L39622 is unambiguous: "there is no single state called 'synced'." The
 * obvious defence is to forbid the word everywhere in this module, and that
 * defence is wrong — the source writes it TWICE inside this module's own
 * section, both times about something that is not a capture. `SB-FL-015`, the
 * storyboard of the very sheet the rule is about, ends its list with "Last
 * synced 08:29."; `FUNC-A6-07-1-2` makes eviction follow "complete-and-synced".
 * A word ban would have forced this build to paraphrase the source in order to
 * pass its own gate, which is the failure mode where a check starts editing
 * the evidence.
 *
 * So the rule is enforced where it actually applies — no LABEL this module
 * prints for a capture is or contains the word — and the three places the word
 * does appear are enumerated here with what each one is about, so a fourth
 * occurrence cannot arrive unnoticed. `AC-FL-006-3` (L39636) is the criterion,
 * and its subject is a capture.
 * ==================================================================== */

export const A6_SYNCED_WORD_RECORD = [
  {
    text: 'Last synced 08:29.',
    aboutWhat:
      'The last time this device reached the server. It is not a capture and it names no capture; ' +
      'every line above it names its own rung of the ladder.',
    verbatimAtSource: true,
    sourceRef: 'SB-FL-015 · L41235',
  },
  {
    text: 'with eviction following complete-and-synced',
    aboutWhat:
      'A staging and eviction condition on a Run, and the media eviction it governs additionally ' +
      'requires confirmed server receipt plus an integrity check. It is not a label any capture ' +
      'wears.',
    verbatimAtSource: true,
    sourceRef: 'FUNC-A6-07-1-2 · L41199',
  },
  {
    text: 'That anything is synced.',
    aboutWhat:
      "This module's own first claim-never-made, which quotes the word in order to deny it. It is " +
      'the only one of the three this build wrote.',
    verbatimAtSource: false,
    sourceRef: 'AC-FL-006-3 · L39636',
  },
] as const satisfies readonly {
  readonly text: string
  readonly aboutWhat: string
  /**
   * Whether `text` is the source's own words at `sourceRef`, or this build's.
   * Two of the three are the source's; the third is this module's own denial,
   * and its locator names the criterion it obeys rather than a line the
   * sentence sits on. A gate that checked all three the same way would either
   * pass a fabricated quotation or fail a correct denial.
   */
  readonly verbatimAtSource: boolean
  readonly sourceRef: string
}[]

/* ==================================================================== *
 * THE ONE THING CONNECTIVITY DECIDES ON THIS SCREEN.
 *
 * `FUNC-A6-02-2-3` (L41171): "Offer a manual sync control as a convenience
 * only, never as a dependency. Purpose: reassurance without responsibility."
 * Its `Roles prohibited:` clause is the whole ruling in five words — no
 * behaviour may require it.
 *
 * SO THE RESULT TYPE HAS NOWHERE TO PUT AN OBLIGATION. There is no `required`,
 * no `blocking`, no `mustSyncBefore`, and no member of the union that carries
 * one. A caller cannot read a sync obligation out of this function because
 * there is no field to read it from, which is the same device wave 0 used when
 * it left `requiresOnline` off `FrontlineAccessRequest`.
 * ==================================================================== */

export interface ManualSyncOutcome {
  /** Whether the attempt went out. Never whether the worker owed one. */
  readonly attempted: boolean
  /** `FUNC-A6-02-2-3`'s own words for this half. */
  readonly clause: string
  /** What the worker is told. It never asks for anything. */
  readonly line: string
  readonly sourceRef: string
}

export function manualSync(online: boolean): ManualSyncOutcome {
  return online
    ? {
        attempted: true,
        clause: 'Online: attempts immediately.',
        line:
          'The tablet is contacting the server now. It does this by itself whenever it can, and ' +
          'nothing on this screen was waiting for you.',
        sourceRef: 'FUNC-A6-02-2-3 · L41171',
      }
    : {
        attempted: false,
        clause: 'Offline: reports no connection honestly.',
        line:
          'There is no connection right now, so nothing went out. The tablet keeps trying by ' +
          'itself, everything below is safe on the device, and your work carries on either way.',
        sourceRef: 'FUNC-A6-02-2-3 · L41171',
      }
}

/**
 * The offline statement the sheet leads with, READ from wave 0's register
 * rather than written again. Its `presentedAsCurrent` is typed as the literal
 * `false` and its `freshness` as `'required'`, so this module could not
 * present back-filled content as current even if it tried to.
 */
export const CACHED_READ_OFFLINE = frontlineConnectivityTreatment({ kind: 'cached-read' })

/**
 * The reconnect ordering, READ from `@/frontline/commands`. `DEC-SYNC-001` was
 * settled there once for slice 7 and slice 8 both, and its three phases are an
 * ARRAY rather than a comparator so there is no order to get backwards. This
 * module is the module the ordering belongs to and it still does not re-decide
 * it; slice 8 builds the ladder that walks it.
 */
export const A6_RECONNECT_ORDER = DEC_SYNC_001_ORDER

/**
 * Wave 0's recorded finding, read rather than restated: two of the four things
 * `DEC-SYNC-001`'s stop class names — device de-authorisation and remote wipe
 * — map onto none of the five command classes, and `AC-FL-007-1` closes the
 * device at exactly five. This module is where that shows, because L41131
 * keeps the wipe's required final sync attempt inside this ordering — it
 * names the attempt twice, once as part of pass two's drain and once as
 * surviving inside pass one — and `DEC-WIPE-001` is disclosed below for the
 * same reason.
 */
export const A6_STOP_CLASS_GAP = STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS

/* ==================================================================== *
 * THE TWELVE ACCEPTANCE CRITERIA, TRANSCRIBED.
 * Table header L41243, separator L41244, data L41245-L41256.
 * ==================================================================== */

export const A6_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-A6-1',
    text: 'A full Run executes and completes offline from the pinned package with no functional loss to the safety layer.',
    sourceRef: 'AC-A6-1 · L41245',
  },
  {
    id: 'AC-A6-2',
    text: 'The upload queue survives application restart, device restart, and power loss with zero committed-capture loss.',
    sourceRef: 'AC-A6-2 · L41246',
  },
  {
    id: 'AC-A6-3',
    text: 'An interrupted upload resumes from its interruption point without restarting and without duplicating.',
    sourceRef: 'AC-A6-3 · L41247',
  },
  {
    id: 'AC-A6-4',
    text: 'Commands are pulled, validated, applied in order at safe boundaries, and acknowledged, including rejections.',
    sourceRef: 'AC-A6-4 · L41248',
  },
  {
    id: 'AC-A6-5',
    text: 'Every capture carries both timestamps, and server-receipt time is authoritative for ordering at sync.',
    sourceRef: 'AC-A6-5 · L41249',
  },
  {
    id: 'AC-A6-6',
    text: "A skew-flagged device's conflicts route to the Client Command Center conflict-and-skew review rather than resolving on device timestamp.",
    sourceRef: 'AC-A6-6 · L41250',
  },
  {
    id: 'AC-A6-7',
    text: 'The offline trust window is tenant-settable, defaults to about 24 hours, and cannot be set above 72 hours.',
    sourceRef: 'AC-A6-7 · L41251',
  },
  {
    id: 'AC-A6-8',
    text: 'A designated high-risk action does not proceed when its forced sync cannot complete.',
    sourceRef: 'AC-A6-8 · L41252',
  },
  {
    id: 'AC-A6-9',
    text: 'An in-flight Run is never re-based, and version-change notices appear only at the boundary of the next execution.',
    sourceRef: 'AC-A6-9 · L41253',
  },
  {
    id: 'AC-A6-10',
    text: 'Media is never evicted before confirmed server receipt plus an integrity check.',
    sourceRef: 'AC-A6-10 · L41254',
  },
  {
    id: 'AC-A6-11',
    text: 'The worker is never presented with a conflict, a queue editor, or a sync obligation.',
    sourceRef: 'AC-A6-11 · L41255',
  },
  {
    id: 'AC-A6-12',
    text: 'Reconnection ordering follows the adopted DEC-SYNC-001 position: the stop class applies before any capture leaves the device, the full capture queue then drains, and the enabling class applies only afterwards.',
    sourceRef: 'AC-A6-12 · L41256',
  },
] as const satisfies readonly {
  readonly id: string
  readonly text: string
  readonly sourceRef: string
}[]

/**
 * THE THREE DENIAL TESTS, transcribed because they are what this module's
 * refusals answer to. Each one asserts an ABSENCE — "no such interface
 * exists", "no such surface exists" — rather than that pressing something is
 * refused, which is why rows 4, 5 and 6 of the matrix draw no control at all
 * and not a disabled one.
 */
export const A6_DENIAL_TESTS = [
  {
    id: 'TEST-A6-3',
    text: 'Attempt to delete or reorder a queue item and assert no such interface exists.',
    answeredBy: 'delete-or-reorder-queue',
    sourceRef: 'TEST-A6-3 · L41264',
  },
  {
    id: 'TEST-A6-4',
    text: 'Attempt to set the offline trust window to 96 hours and assert platform rejection rather than a logged acceptance.',
    answeredBy: 'set-offline-trust-window',
    sourceRef: 'TEST-A6-4 · L41265',
  },
  {
    id: 'TEST-A6-5',
    text: 'Attempt to view or resolve a conflict from the device and assert no such surface exists.',
    answeredBy: 'resolve-sync-conflict',
    sourceRef: 'TEST-A6-5 · L41266',
  },
] as const satisfies readonly {
  readonly id: string
  readonly text: string
  readonly answeredBy: string
  readonly sourceRef: string
}[]

/* ==================================================================== *
 * FINDINGS AGAINST THE FROZEN SOURCE AND AGAINST THIS BUILD, RECORDED
 * RATHER THAN CLOSED. Filling any of them would be this build writing an
 * answer the source withheld.
 * ==================================================================== */

export interface A6SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const A6_SOURCE_FINDINGS = [
  {
    what: 'Two of this module’s twenty-eight functionalities name no FB-FL-* pattern at all.',
    evidence:
      'AC-FL-011-1 (L40151) requires every functionality in chapter 22 to name at least one FB-FL-* ' +
      'pattern. FUNC-A6-08-1-2 (L41205) gives its Fallback field as "Not applicable — an excluded ' +
      'capability has no failure mode." and FUNC-A6-08-1-4 (L41207) gives "Not applicable — same ' +
      'reason." Both are stated non-applicability rather than a pattern, so the criterion is not met ' +
      'by either functionality in the frozen source.',
    notClosedBecause:
      'Assigning a pattern to either because its neighbours carry one would manufacture the evidence ' +
      'the criterion asks for, and an assigned pattern is indistinguishable from a real one forever ' +
      'afterwards. Both are carried with an empty pattern list and their own sentence, and ' +
      'functionalitiesNamingNoPattern in @/frontline/fallbacks returns both.',
    sourceRef: 'AC-FL-011-1 · L40151',
  },
  {
    what: 'Three parts of the source give this module three different fallback-pattern sets.',
    evidence:
      'The §22.9 module map lists MOD-FL-A6 against eight patterns — FB-FL-CORE-01 (L40130), ' +
      'FB-FL-AUTH-01 (L40131), FB-FL-PKG-01 (L40132), FB-FL-UP-01 (L40134), FB-FL-CMD-01 (L40135), ' +
      'FB-FL-GATE-01 (L40137), FB-FL-STORE-01 (L40139) and FB-FL-TIME-01 (L40140). The module ' +
      'card’s own Fallback identifier field (L41154) names seven, omitting FB-FL-GATE-01. This ' +
      'module’s twenty-eight functionalities between them name ten, adding FB-FL-SEC-01 and ' +
      'FB-FL-CAP-01 — and neither of those two map rows lists this module: FB-FL-CAP-01 (L40133) ' +
      'lists A4 and A5, and FB-FL-SEC-01 (L40141) lists A7, A1 and B11.',
    notClosedBecause:
      'The map is the table patternsForModule reads and it is not this task’s file to edit; the card ' +
      'and the functionalities are the source’s own words and are not this task’s to correct. All ' +
      'three readings are carried and the divergence renders on the sheet. Measured on four modules ' +
      'now, and no DEC identifier is attached to it anywhere.',
    sourceRef: 'FB-FL-GATE-01 · L40137',
  },
  {
    what: 'Row 7 of the permission matrix names a bound and no surface.',
    evidence:
      'L41100’s Tenant Admin cell reads Allowed with conditions — tenant-set, default about 5 ' +
      'minutes, platform ceiling 60 minutes, and stops there. Its neighbour at L41099 names the ' +
      'Delivery Operations Hub for the offline trust window; L41100 names nowhere. Three ' +
      'independent parts of the source do: MOD-CC-10’s permission matrix at L38091 calls changing ' +
      'the threshold "a tenant setting in the Delivery Operations Hub tenant administration area", ' +
      'the configuration-ownership table at L61256 gives the offline trust window and the ' +
      'clock-skew threshold the same owning surface and owning role, and L30340 carries the ' +
      'threshold’s registry row with EVT-DOH-CFG-SKEW as the event it raises.',
    notClosedBecause:
      'Nothing is corrected. The cell is transcribed as it stands, with its silence intact, and the ' +
      'surface is carried at row level with its own locator from another chapter rather than read ' +
      'off the neighbouring row — which is the inference this record exists to avoid.',
    sourceRef: 'L38091',
  },
  {
    what: 'This module appears in no row of the six-destination register, and surfaces on all six.',
    evidence:
      'The §25.5 register’s Modules column (L48529-L48534) names A1, A2, the A3-to-A5 group with ' +
      'B8, B9 and B11, B10, B12, and A1 with A7. MOD-FL-A6 is in none of them. AC-FL-010-5 (L40049) ' +
      'nonetheless puts the sync indicator on every screen of every destination, the destination ' +
      'property table lists MOD-FL-B10 and MOD-FL-A6 together on the Notifications row (L40035), ' +
      'and §22.7 gives SCR-FL-06 to the sync detail sheet across My Runs and Notifications ' +
      '(L39868) while §25.5 gives the same token to Profile-lite (L48534).',
    notClosedBecause:
      'No route is created for this module, because §25.5 fixes the destination set at six and a ' +
      'seventh would fail AC-FL-010-1 (L40045). The SCR-FL-06 collision is RULING-FL-1 seen from ' +
      'this module’s end and is settled in @/frontline/screens, not re-settled here.',
    sourceRef: 'AC-FL-010-5 · L40049',
  },
  {
    what: 'The storyboard sheet and the screen-state test list five capture labels each, and they differ by one.',
    evidence:
      'SB-FL-015 (L41235) lists Committed locally, Queued, Uploading, Upload interrupted and Server ' +
      'received. TEST-SCR-FL-003 (L48700) asserts the label is one of committed locally, queued, ' +
      'uploading, uploaded, or server received. One list carries upload interrupted where the other ' +
      'carries uploaded. Both are subsets of the thirteen-rung ladder at L39598-L39619 and neither ' +
      'is the ladder.',
    notClosedBecause:
      'Neither list is treated as the vocabulary. The sheet renders the storyboard’s five because ' +
      'the storyboard is what it draws, and every sentence it prints comes from captureStateLine ' +
      'over the closed thirteen, so a sixth label cannot be introduced by either list being wrong. ' +
      'The eight rungs the sheet does not report are named on the sheet rather than left implied.',
    sourceRef: 'SB-FL-015 · L41235',
  },
  {
    what: 'DEC-CLOCKWIN-001 now has two local stand-ins in this build.',
    evidence:
      'MOD-FL-A5 discloses it locally because its classification is the act of record and both ' +
      'timestamps sit under a Severity 1 hold. This module discloses it because the threshold ' +
      'itself is row 7 of its matrix. The shared canon at @/disclosure/decisions holds neither: its ' +
      'DecisionId union has twenty-nine members and this is not one of them.',
    notClosedBecause:
      'The canon file is one later task’s single edit and is not this task’s path; thirteen modules ' +
      'each adding a record to it is the path collision this build has recorded three times. Both ' +
      'stand-ins are built to expire — each module’s suite asserts the identifier is still absent ' +
      'from the canon — and this module’s suite additionally asserts its readings are character-for-' +
      'character the ones MOD-FL-A5 already carries, so the two cannot drift into two spellings ' +
      'while they both stand.',
    sourceRef: 'DEC-CLOCKWIN-001 · L42598',
  },
] as const satisfies readonly A6SourceFinding[]

/* ==================================================================== *
 * THE FOUR DECISIONS THIS MODULE DISCLOSES.
 *
 * WHY THEY ARE DISCLOSED HERE AND NOT THROUGH `DecisionDisclosure`, AND WHY
 * THAT IS A FINDING RATHER THAN A PREFERENCE. `@/disclosure/DecisionDisclosure`
 * is the only place an open decision is rendered on any surface, and it takes
 * a `DecisionId`. That union has twenty-nine members and none of them is
 * `DEC-SYNC-001`, `DEC-CLOCKWIN-001`, `DEC-STORE-001` or `DEC-WIPE-001`; the
 * canon file is not this task's to edit. `Stu14LocalDisclosure` in
 * `@/studio/modules/stu-14/rendering` met exactly this and set the idiom
 * followed here: disclose locally IN THE CANON'S OWN SHAPE, declare the gap on
 * `canonNote`, and never file the decision under a neighbouring identifier —
 * because a client searching the canon for one of these would then find
 * someone else's decision instead.
 *
 * `readings` is the canon's own `DecisionReading` type, imported rather than
 * redeclared, so it carries exactly two fields and there is no field in which
 * a reading could be marked the answer.
 *
 * `DEC-SYNC-001` IS THE ONE OF THE FOUR THAT IS NOT OPEN, and it is disclosed
 * all the same. The source adopted Option C on 2026-08-14 with both readings
 * retained in its card, and L42644 records that it "no longer counts against
 * the figure" for exactly that reason. An adopted working position is still a
 * position this build took rather than one the source settled, so it carries
 * its two readings like the other three.
 * ==================================================================== */

export interface FlA6LocalDisclosure {
  readonly decisionRef: 'DEC-SYNC-001' | 'DEC-CLOCKWIN-001' | 'DEC-STORE-001' | 'DEC-WIPE-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
  /** Why this module is the one that discloses it. */
  readonly whyHere: string
  /** Why it is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'its DecisionId union has twenty-nine members and this is not one of them — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own shape so it can be absorbed without a ' +
  'rewrite, and declared as a gap rather than filed under a neighbouring identifier.'

export const A6_DISCLOSURES = [
  {
    decisionRef: 'DEC-SYNC-001',
    question:
      'On reconnection, does a device upload its pending captures before or after it pulls pending commands?',
    readings: [
      {
        text:
          'safety argues commands first, because a suspension, a wipe, or a hold must land before ' +
          'more work is performed',
        locator: 'DEC-SYNC-001 · L39672',
      },
      {
        text:
          'data integrity argues captures first, because unsynced evidence must never be put at ' +
          'risk by an operation that could wipe or reset local state',
        locator: 'DEC-SYNC-001 · L39672',
      },
    ],
    adopted:
      'Both readings stay on the record. The build follows the order the source specifies — ' +
      'stop-class commands first, then the full capture upload, then the enabling classes — adopted ' +
      'at Option C on 2026-08-14 as the safer reading, with payload and ordering semantics deferred ' +
      'to the Functional Specification under engineering design item E3. Ratification rests with ' +
      'the client. The three phases are settled once in @/frontline/commands and this module reads ' +
      'them rather than re-deciding them.',
    whyHere:
      'It is this module’s own card field. L41131 states the three passes as this module’s reconnect ' +
      'behaviour, AC-A6-12 (L41256) makes the ordering an acceptance criterion of this module, and ' +
      'FUNC-A6-03-1-1 (L41174) is the functionality that applies it. Slice 8 builds the ladder that ' +
      'walks the order; this slice discloses which order it walks and why the question existed.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-CLOCKWIN-001',
    question:
      'Which ordering settles an ordinary conflict — the device timestamp that last-write-wins uses, or the server-receipt time the time-discipline rule makes authoritative?',
    readings: [
      {
        text:
          'The conflict rule is last-write-wins by device timestamp, while the time-discipline rule ' +
          'makes server-receipt time authoritative for ordering at sync.',
        locator: 'DEC-CLOCKWIN-001 · L42598',
      },
      {
        text:
          '§7.10.4 reconciles the two only for the skew-flagged case, routing those conflicts to ' +
          'review. It does not address the ordinary case: a device whose clock is fast but within ' +
          "the tenant's skew threshold — up to five minutes by default — can win a last-write-wins " +
          'conflict against a capture that actually happened later in real time.',
        locator: 'DEC-CLOCKWIN-001 · L42598',
      },
    ],
    adopted:
      'Nothing is resolved here. The source records three candidate resolutions and recommends the ' +
      'second — keep device time but route any conflict where the two orderings disagree to the ' +
      'Client Command Center conflict-and-skew review — and names the decision owner as the client, ' +
      'through the Frontline Functional Specification.',
    whyHere:
      'The threshold is row 7 of this module’s matrix and the gap sits directly underneath it: a ' +
      'device inside the threshold is trusted to settle conflicts, and this is the module that ' +
      'decides what inside means. It is disclosed on the same screen as the threshold rather than ' +
      'somewhere a reader of the threshold would not look.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-STORE-001',
    question:
      'What does a device do when its storage is full — refuse new captures, refuse only media, refuse only new Runs, or something per platform?',
    readings: [
      {
        text:
          'Storage-full behaviour is explicitly deferred to the Frontline Functional Specification, ' +
          'per platform for iOS and Android, and no behaviour may be invented here.',
        locator: 'DEC-STORE-001 · L40116',
      },
      {
        text:
          'refusing new captures protects existing evidence but stops the line, while evicting ' +
          'unconfirmed data would keep the line moving and destroy evidence, which the platform’s ' +
          'evidence-immutability invariant forbids',
        locator: 'DEC-STORE-001 · L40116',
      },
    ],
    adopted:
      'Nothing is resolved here and no behaviour is invented. What is fixed is the terminal safe ' +
      'state, which the source does state: capture blocked with all existing data preserved; never ' +
      'eviction of unconfirmed evidence. The source recommends a combination of blocking media ' +
      'capture only and refusing to start additional Runs, with outright blocking as the terminal ' +
      'state. Decision owner: the client, through the Frontline Functional Specification.',
    whyHere:
      'FUNC-A6-07-1-4 (L41201) is this module’s own functionality and it is the only one of the ' +
      'twenty-eight whose Roles allowed and connectivity fields both read Client Decision Required. ' +
      'AC-FL-011-5 (L40155) requires the decision to remain visibly open and forbids any ' +
      'implementation closing it silently.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-WIPE-001',
    question:
      'How long may a remote wipe stay pending on a device that cannot perform its required final sync, and what happens if that device never returns?',
    readings: [
      {
        text:
          '§7.11 and §8.13.3 require a final sync attempt before erasure, which an offline device ' +
          'cannot perform. The Statement of Work does not state how long a wipe command may remain ' +
          'pending, nor what happens if the device never returns.',
        locator: 'DEC-WIPE-001 · L41355',
      },
      {
        text:
          'a wipe that expires quickly leaves a lost device holding tenant data indefinitely, while ' +
          'a wipe that never expires leaves an open destructive command that could fire months ' +
          'later against a device that has since been legitimately re-enrolled',
        locator: 'DEC-WIPE-001 · L41355',
      },
    ],
    adopted:
      'Nothing is resolved here. The source records four options and recommends the fourth — a ' +
      'two-stage command in which the device locks immediately on contact and erases only after a ' +
      'successful final sync — with a tenant-visible pending-age indicator. Decision owner: the ' +
      'client, jointly across the Frontline and Super Admin workstreams. AC-FL-011-5 (L40155) ' +
      'requires it to stay visibly open.',
    whyHere:
      'The wipe is not this module’s act — MOD-FL-A7 holds it and the platform console approves it ' +
      '— but its unstated half lives inside this module’s ordering. L41131 puts pass two’s queue ' +
      'drain after the stop class "with remote wipe still performing its final sync attempt before ' +
      'erasure", so the final sync the source requires is a step of this engine, on a device that ' +
      'by construction may have no connection. Wave 0 records the matching gap from the command ' +
      'side: de-authorisation and remote wipe are named in the stop class and are none of the five ' +
      'command classes.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly FlA6LocalDisclosure[]

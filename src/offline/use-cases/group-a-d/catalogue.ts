/**
 * §37A Mandatory Offline Use-Case Catalogue — groups A, B, C and D.
 *
 * The catalogue opens at L81202. It holds seventy entries in seven groups;
 * this file transcribes the forty that belong to groups A (L81282), B (L81328),
 * C (L81376) and D (L81426). Groups E, F and G are a concurrent task's and are
 * deliberately absent — the two halves were split so that neither implementer
 * reconciles anything across the seam.
 *
 * ── OWNERSHIP COMES FROM THE IDENTIFIER, NEVER FROM THE SPAN ───────────────
 * MEASURED, not inferred from the section ranges: forty entry headings sit in
 * L81282-L81495, ten in each of the four groups, `UC-OFF-001` through
 * `UC-OFF-040` with no gap and no repeat. Swept the same way over all 122,241
 * lines, every one of the seven groups holds exactly ten headings and the
 * catalogue holds seventy — see `GROUP_HEADING_COUNTS`.
 *
 * That matters because a count taken by scanning a group's SPAN for
 * `UC-OFF-\d{3}` tokens does not agree with it. Group E's span (L81496-L81589)
 * mentions eleven distinct identifiers, because `UC-OFF-042` at L81532 names a
 * group D entry inside its own body. Eleven mentions, ten entries. Ownership is
 * read off each entry's own heading and nothing else.
 *
 * ── THE DIAGRAM-REUSE RULE, AND WHERE THE SOURCE UNDER-COUNTS ITSELF ───────
 * L81212 states the rule and names twelve representatives. Thirteen mermaid
 * blocks sit in §37A and the first, at L81226, is the catalogue map, so twelve
 * are use-case diagrams — the claim and the count agree. Five representatives
 * fall in groups A-D and the other thirty-five entries name the diagram they
 * reuse rather than carrying one, which is what `AC-37A-004` (L81277) requires
 * of them. Reuse is rendered here as a pointer, never as a copy.
 *
 * Two measured divergences are carried rather than tidied:
 *
 *   1. `UC-OFF-001`'s own metadata clause (L81308) declares NEITHER a reuse nor
 *      a representative marker. The other four representatives each write
 *      "representative diagram" into their own clause — L81360, L81406, L81458
 *      and L81466. The first entry's representative status is stated only
 *      outside its entry, at L81306 and in the group table at L81218. The
 *      record keeps `declaredInOwnMetadata` so the asymmetry stays visible
 *      instead of being smoothed into one uniform flag.
 *   2. Group D's reuse paragraph at L81454 enumerates five reusers of the
 *      `UC-OFF-032` diagram. SIX entries declare that reuse: `UC-OFF-040`
 *      (L81494) declares it and is absent from the sentence. The same paragraph
 *      accounts for neither `UC-OFF-038` (L81490) nor `UC-OFF-039` (L81492),
 *      which declare reuse of the group's second representative. Groups A, B
 *      and C's paragraphs — L81306, L81354 and L81404 — each enumerate all nine
 *      of their own reusers exactly. Only D's is short. See
 *      `GROUP_D_REUSE_UNDERCOUNT`.
 *
 * ── THE STATUS VOCABULARY IS CLOSED AND `AC-37A-005` IS SATISFIED HERE ─────
 * `AC-37A-005` (L81278) requires that every entry's permission line use only
 * the closed status set, with no blank cell and no unexplained "not
 * applicable". Measured across all forty permission lines: ninety-five status
 * tokens drawn from six, and no seventh token anywhere. Both of the two "not
 * applicable" cells, at L81322 and L81326, carry a reason.
 * `PERMISSION_STATUS_CENSUS` carries the per-token counts.
 *
 * THREE PERMISSION LINES CARRY NO STATUS TOKEN AT ALL. L81408, L81410 and
 * L81422 each read only "as" and a neighbouring entry's identifier. Two
 * readings, and this build takes neither: a cross-reference INHERITS the
 * referenced line's statuses and satisfies the criterion, or a line with no
 * status IS the blank cell the criterion forbids. Two further lines — L81414
 * and L81488 — open with the same cross-reference and then add a status of
 * their own, which is the shape that makes the first reading plausible and the
 * reason neither is chosen here. See `PERMISSION_LINES_BY_CROSS_REFERENCE`.
 *
 * The criterion does not reach the artificial-intelligence line, and six of
 * those carry a bare "not applicable" with no reason: L81366, L81368, L81418,
 * L81458, L81460 and L81494. That is recorded rather than repaired — widening
 * `AC-37A-005` to cover a line it does not name would be this build choosing
 * the criterion's scope. See `BARE_NOT_APPLICABLE_OUTSIDE_AC_37A_005`.
 *
 * ── AND ONE MORE COUNTED GAP, IN THE SHARED STORYBOARD SET ─────────────────
 * L81266 names eleven screens as the set "every entry draws on". These forty
 * entries name twelve, three of which are outside it, and use nine of the
 * eleven. See `STORYBOARD_SCREENS_OUTSIDE_THE_SHARED_SET`.
 *
 * ── CONSUMED, NOT RE-DERIVED ───────────────────────────────────────────────
 * Every identifier an entry names is carried as the source wrote it and joins
 * to what waves 0-2 already built: `MOD-FL-*` to the Frontline modules,
 * `OFF-BLK-*` to the reconnection protocol, `FB-SYNC-01` to the fallback
 * contracts. Nothing here re-states a ruling those files already hold. In
 * particular `DEC-STORE-001`, named by `UC-OFF-014` at L81362, already has four
 * spellings in this tree and does not get a fifth: the entry's pointer is the
 * whole of this file's involvement with it. `DEC-OFF-001` and `DEC-OFF-002`,
 * which the group D entries raise, are disclosed locally and PAIRED with the
 * §37B register in `@/offline/decisions-37b`, which names this path as the
 * use-case side — see `USE_CASE_LOCAL_DISCLOSURES`.
 *
 * ── WHAT THIS FILE CANNOT DO, STATED BECAUSE THE BRIEF SAID OTHERWISE ──────
 * `registries/generated/offline-scenarios.json` holds all seventy rows at
 * `not-represented`, and the task brief said this transcription is what moves
 * that number. It is not, and cannot be. The status is computed by
 * `scripts/build-registries.mjs`: `statusForId` answers purely off
 * `ROUTE_EVIDENCE.citedTokens`, and the only thing that ever adds to that set is
 * `walkRouteTree`, which is rooted at `app/` and reads only `.ts`/`.tsx` files
 * sitting directly inside a directory that holds a `page.tsx`.
 *
 * The generator does read `src/`, and the first draft of this note said it did
 * not — corrected by the gate that checks the note rather than by review.
 * `declaredSlugs` walks `src/` for files named `modules.ts` and reads route
 * SLUG claims out of them. That path awards a module its route; it contributes
 * nothing to `citedTokens`, and this module ships no `modules.ts` and declares
 * no slug in any case. So the conclusion stands and the reason is narrower than
 * it was written: a transcription living here cannot move that count however
 * complete it is, and only a shipped route screen naming the identifiers can.
 * Recorded in `REGISTRY_DEMONSTRATION_NOTE` so the next reader does not go
 * looking for a join that was never there.
 */
import type { DecisionReading } from '@/disclosure/decisions'

/** The four group keys this file owns. E, F and G belong to the sibling task. */
export type UseCaseGroupKey = 'A' | 'B' | 'C' | 'D'

/** `UC-OFF-001` … `UC-OFF-040`. Groups E-G's identifiers are not modelled here. */
export type UseCaseId = (typeof OFFLINE_USE_CASES_A_D)[number]['id']

/**
 * The closed status set `AC-37A-005` (L81278) names. Six tokens, measured over
 * the ninety status cells in these forty permission lines — no seventh appears.
 *
 * `Not applicable` is the one that carries a trailing reason in the source, and
 * the criterion's "no unexplained 'not applicable'" is precisely the rule that
 * the reason must be there. The token is the status; the reason travels with it
 * in the verbatim clause.
 */
export type PermissionStatus =
  | 'Allowed'
  | 'Allowed with conditions'
  | 'Explicitly prohibited'
  | 'Read-only'
  | 'Unavailable'
  | 'Not applicable'

/**
 * `Allowed` is a prefix of `Allowed with conditions`, and slice 7 lost a gate to
 * exactly that. TWO GUARDS STAND HERE AND THEY ARE REDUNDANT WITH EACH OTHER,
 * which is measured rather than asserted: this list is longest-first, and
 * `permissionStatusesIn` compares the whole cell rather than its head.
 *
 * Planted three ways. Reordering `Allowed` to the front, alone, is green —
 * exact equality catches it. Relaxing the comparison to `startsWith`, alone, is
 * green — the ordering catches it. Removing BOTH is red, on the pinned status
 * sequence of `UC-OFF-013`, which is the one entry granting the conditional and
 * the plain form on the same line. The first version of this comment named
 * ordering as the guard and the second named exactness; both were half right,
 * and only planting told them apart.
 */
export const PERMISSION_STATUSES = [
  'Allowed with conditions',
  'Explicitly prohibited',
  'Not applicable',
  'Read-only',
  'Unavailable',
  'Allowed',
] as const satisfies readonly PermissionStatus[]

type MissingStatus = Exclude<PermissionStatus, (typeof PERMISSION_STATUSES)[number]>
const _everyStatusListed: MissingStatus extends never ? true : never = true
void _everyStatusListed

type ExtraStatus = Exclude<(typeof PERMISSION_STATUSES)[number], PermissionStatus>
const _listInventsNoStatus: ExtraStatus extends never ? true : never = true
void _listInventsNoStatus

/**
 * Which diagram an entry uses. `own` is a representative case carrying its own
 * Mermaid block; `reuses` names the representative it points at, which is what
 * `AC-37A-004` (L81277) requires of every non-diagrammed entry.
 *
 * `declaredInOwnMetadata` exists because one of the five representatives here
 * does not say so in its own metadata clause. Collapsing that to a bare `own`
 * would erase a real difference between the source's five statements.
 */
export type UseCaseDiagram =
  | { readonly kind: 'own'; readonly declaredInOwnMetadata: boolean }
  | { readonly kind: 'reuses'; readonly representative: string }

/**
 * One catalogue entry, header-keyed from the fixed field order L81210 states:
 * title, identifier metadata, five surfaces, roles, numbered steps, workflow,
 * storyboard, permissions, artificial-intelligence behaviour, first fallback,
 * fallback-of-fallback, terminal safe state, recovery, reconciliation, audit,
 * acceptance criteria, tests, example. All seventeen mandatory fields are
 * present on all forty entries — verified, not assumed.
 *
 * The fields transcribed here are the ones the catalogue's own acceptance
 * criteria turn on. `permissions` and `aiBehaviour` are VERBATIM because
 * `AC-37A-002` (L81275) and `AC-37A-005` (L81278) are claims about their exact
 * words; paraphrasing either would make both criteria uncheckable. The
 * narrative fields — five surfaces, roles, numbered steps, the example — are
 * not carried: nothing in this build reads them, and a copy of the document is
 * not a transcription of it.
 */
export interface OfflineUseCase {
  readonly id: string
  readonly group: UseCaseGroupKey
  /** The entry's own heading line in the frozen source. */
  readonly sourceLine: number
  /** Verbatim, with the identifier prefix and the terminal full stop removed. */
  readonly title: string
  /** The `MOD-*` id the metadata clause names, or `null` where it names none. */
  readonly module: string | null
  /** The `FB-*` id the metadata clause names. Exactly one entry here names one. */
  readonly fallback: string | null
  /** Every `OFF-BLK-*` the metadata clause names, in the order it names them. */
  readonly blockers: readonly string[]
  readonly diagram: UseCaseDiagram
  readonly workflow: string
  /** Verbatim Storyboard clause, screen identifiers and connectors intact. */
  readonly storyboard: string
  /** Verbatim Permissions clause. See `AC-37A-005`. */
  readonly permissions: string
  /** Verbatim artificial-intelligence behaviour clause. */
  readonly aiBehaviour: string
  readonly acceptanceCriteria: readonly string[]
  readonly tests: readonly string[]
  /** The entry's own `**Preserved contradiction:**` clause, verbatim, or null. */
  readonly preservedContradiction: string | null
  /** The entry's own `**Note on an unspecified value:**` clause, or null. */
  readonly unspecifiedValueNote: string | null
}

export const OFFLINE_USE_CASES_A_D = [
  {
    id: 'UC-OFF-001',
    group: 'A',
    sourceLine: 81308,
    title:
      'One tablet loses connectivity mid-run and the worker completes the run offline',
    module: 'MOD-FL-A6',
    fallback: 'FB-SYNC-01',
    blockers: [],
    diagram: { kind: 'own', declaredInOwnMetadata: false },
    workflow: 'WF-OFF-BASIC',
    storyboard:
      '`SCR-FL-RUNS-01` → `SCR-FL-PLAYER-01` → `SCR-FL-SYNC-03`; `SCR-CC-BOARD-01` shows the ' +
      'offline tile throughout',
    permissions:
      'Worker `Allowed` to execute and capture; Worker `Explicitly prohibited` from resolving ' +
      'sync state; Supervisor `Read-only` on the live view while offline; Quality Manager ' +
      '`Read-only` until data lands; Read-only Auditor `Read-only` in the Delivery Operations ' +
      'Hub only.',
    aiBehaviour:
      'agent-selected coaching cards `Unavailable` offline; the step\'s authored work ' +
      'instructions render as the fallback and the guidance itself never disappears.',
    acceptanceCriteria: ['AC-37A-101', 'AC-37A-102'],
    tests: ['TEST-37A-101', 'TEST-37A-102'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-002',
    group: 'A',
    sourceLine: 81310,
    title:
      'A whole cell starts a shift offline with packages pre-synced at shift start',
    module: 'MOD-FL-A2',
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-BASIC',
    storyboard:
      '`SCR-FL-RUNS-01`, `SCR-CC-BOARD-01`',
    permissions:
      'Workers `Allowed` to execute their own assigned runs; every worker `Explicitly ' +
      'prohibited` from seeing any other worker\'s data, since the application is scoped to the ' +
      'logged-in identity\'s own work; Supervisor `Read-only` live.',
    aiBehaviour:
      '`Unavailable` for all three devices; authored instructions render.',
    acceptanceCriteria: ['AC-37A-103'],
    tests: ['TEST-37A-103'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-003',
    group: 'A',
    sourceLine: 81312,
    title:
      'Site-wide connectivity loss runs the full graded protocol while the floor keeps working',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-24'],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-SITE',
    storyboard:
      '`SCR-CC-BOARD-01` with the banner; `SCR-SA-FLEET-01`',
    permissions:
      'Tenant Admin `Read-only` on the banner, `Allowed` to act on the network; the client\'s ' +
      'platform team `Allowed` on the alert; Workers `Allowed` to continue every assigned run.',
    aiBehaviour:
      '`Unavailable` site-wide; authored instructions everywhere.',
    acceptanceCriteria: ['AC-37A-104', 'AC-37A-105'],
    tests: ['TEST-37A-104', 'TEST-37A-105'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-004',
    group: 'A',
    sourceLine: 81314,
    title:
      'Intermittent connectivity flapping during a run',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-BASIC',
    storyboard:
      '`SCR-FL-RUNS-01` indicator; `SCR-CC-BOARD-01`',
    permissions:
      'Worker `Allowed` to execute throughout; manual sync `Allowed with conditions` as a ' +
      'convenience only, never as a dependency.',
    aiBehaviour:
      'coaching `Allowed with conditions` — available during connected intervals, absent ' +
      'otherwise, and never half-rendered.',
    acceptanceCriteria: ['AC-37A-106'],
    tests: ['TEST-37A-106'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-005',
    group: 'A',
    sourceLine: 81316,
    title:
      'A run assigned mid-shift whose package has not arrived',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-01'],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-LAZYPULL',
    storyboard:
      '`SCR-FL-RUNS-01` not-ready state',
    permissions:
      'Worker `Unavailable` for the unstaged run, `Allowed` for staged runs; Supervisor ' +
      '`Allowed` to assign and reassign.',
    aiBehaviour:
      '`Not applicable — no run is executing for the agent layer to support`.',
    acceptanceCriteria: ['AC-37A-107'],
    tests: ['TEST-37A-107'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-006',
    group: 'A',
    sourceLine: 81318,
    title:
      'Offline execution of serialized work, one Unit Execution per piece',
    module: 'MOD-FL-A3',
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-SERIAL',
    storyboard:
      '`SCR-FL-PLAYER-01` unit states',
    permissions:
      'Worker `Allowed` to identify and capture; Worker `Explicitly prohibited` from rebinding ' +
      'a committed capture to a different serial.',
    aiBehaviour:
      '`Unavailable` offline for coaching; classification is deterministic and local.',
    acceptanceCriteria: ['AC-37A-108'],
    tests: ['TEST-37A-108'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-007',
    group: 'A',
    sourceLine: 81320,
    title:
      'Offline execution of lot-tracked work',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-LOT',
    storyboard:
      '`SCR-FL-PLAYER-01`',
    permissions:
      'Worker `Allowed` to capture against the lot; Worker `Explicitly prohibited` from ' +
      'defining or altering a lot, which is tenant configuration.',
    aiBehaviour:
      '`Unavailable` offline.',
    acceptanceCriteria: ['AC-37A-109'],
    tests: ['TEST-37A-109'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-008',
    group: 'A',
    sourceLine: 81322,
    title:
      'Offline execution where unit mode is none',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-NOUNIT',
    storyboard:
      '`SCR-FL-PLAYER-01`',
    permissions:
      'Worker `Allowed` to execute; `Not applicable — no unit identification exists to permit ' +
      'or prohibit`.',
    aiBehaviour:
      '`Unavailable` offline.',
    acceptanceCriteria: ['AC-37A-110'],
    tests: ['TEST-37A-110'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-009',
    group: 'A',
    sourceLine: 81324,
    title:
      'A process spanning two shifts, modelled as linked runs, with the handover made offline',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-CROSSSHIFT',
    storyboard:
      '`SCR-FL-PLAYER-01` handover state',
    permissions:
      'outgoing Worker `Allowed` to record state; incoming Worker `Allowed` to acknowledge; ' +
      'neither `Allowed` to alter the other\'s captures.',
    aiBehaviour:
      'the Shift Handoff Agent is a reasoning agent and is `Unavailable` offline; the authored ' +
      'handover step carries the required content regardless.',
    acceptanceCriteria: ['AC-37A-111'],
    tests: ['TEST-37A-111'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-010',
    group: 'A',
    sourceLine: 81326,
    title:
      'An offline run crossing midnight, taking its production date from the shift\'s nominal ' +
      'date',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-001' },
    workflow: 'WF-OFF-MIDNIGHT',
    storyboard:
      '`SCR-DOH-RUN-01`',
    permissions:
      'Worker `Not applicable — the worker makes no date decision`; Supervisor `Read-only` on ' +
      'the resolved date.',
    aiBehaviour:
      '`Not applicable — date resolution is deterministic platform logic`.',
    acceptanceCriteria: ['AC-37A-112'],
    tests: ['TEST-37A-112'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-011',
    group: 'B',
    sourceLine: 81356,
    title:
      'Offline measurement capture inside specification',
    module: 'MOD-FL-A4',
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-MEASURE',
    storyboard:
      '`SCR-FL-PLAYER-01` measurement state',
    permissions:
      'Worker `Allowed` to enter and commit; Worker `Explicitly prohibited` from editing after ' +
      'commit; Quality Manager `Read-only` on evidence, since oversight surfaces display and ' +
      'never edit.',
    aiBehaviour:
      '`Not applicable — no artificial-intelligence model sits in the deviation-triggering ' +
      'path, and this capture triggers nothing`.',
    acceptanceCriteria: ['AC-37A-201'],
    tests: ['TEST-37A-201'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-012',
    group: 'B',
    sourceLine: 81358,
    title:
      'Offline measurement capture outside specification at Severity 2',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-DEV2',
    storyboard:
      '`SCR-FL-PLAYER-01` deviation state',
    permissions:
      'Worker `Allowed` to record the deviation detail the authored form requires; Worker ' +
      '`Explicitly prohibited` from reclassifying the severity, which is deterministic.',
    aiBehaviour:
      'the Deviation and Containment Agent is `Unavailable` offline; the pre-authorised ' +
      'containment for Severity 2 launches locally regardless.',
    acceptanceCriteria: ['AC-37A-202'],
    tests: ['TEST-37A-202'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-013',
    group: 'B',
    sourceLine: 81360,
    title:
      'Offline measurement capture at Severity 1 with an immediate local hold',
    module: 'MOD-FL-A5',
    fallback: null,
    blockers: [],
    diagram: { kind: 'own', declaredInOwnMetadata: true },
    workflow: 'WF-OFF-SEV1',
    storyboard:
      '`SCR-FL-PLAYER-01` hold and containment states; `SCR-CC-DEV-01` after sync',
    permissions:
      'Worker `Allowed` to execute containment; Worker `Explicitly prohibited` from releasing ' +
      'a hold; Supervisor `Allowed with conditions` — request release with a note only; ' +
      'Quality Manager `Allowed` to release, uniformly and with no exceptions by work type, ' +
      'risk class or tag.',
    aiBehaviour:
      '`Explicitly prohibited` from classifying, from releasing a hold, and from any role in ' +
      'the triggering path; the agent layer interprets only after the deterministic trigger ' +
      'and only when reachable.',
    acceptanceCriteria: ['AC-37A-203', 'AC-37A-204'],
    tests: ['TEST-37A-203', 'TEST-37A-204'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-014',
    group: 'B',
    sourceLine: 81362,
    title:
      'Offline photograph capture into the application\'s encrypted store',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-EVIDENCE',
    storyboard:
      '`SCR-FL-PLAYER-01` capture state',
    permissions:
      'Worker `Allowed` to capture; Worker `Explicitly prohibited` from exporting, sharing or ' +
      'deleting evidence; Quality Manager `Read-only` on evidence.',
    aiBehaviour:
      '`Unavailable` — the Vision Reasoning Agent ships in a later release with the vision ' +
      'atoms and has no role here.',
    acceptanceCriteria: ['AC-37A-205'],
    tests: ['TEST-37A-205'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-015',
    group: 'B',
    sourceLine: 81364,
    title:
      'Offline barcode scan using the device\'s hardware scanner',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-SCAN',
    storyboard:
      '`SCR-FL-PLAYER-01` scan state',
    permissions:
      'Worker `Allowed` to scan; Worker `Explicitly prohibited` from overriding a failed ' +
      'expected-value validation.',
    aiBehaviour:
      '`Not applicable — scan validation is deterministic`.',
    acceptanceCriteria: ['AC-37A-206'],
    tests: ['TEST-37A-206'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-016',
    group: 'B',
    sourceLine: 81366,
    title:
      'Offline scan falling back to the camera when the hardware scanner fails',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-19'],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-SCAN',
    storyboard:
      '`SCR-FL-BLOCK-01` then `SCR-FL-PLAYER-01`',
    permissions:
      'Worker `Allowed` to use the camera fallback; Worker `Explicitly prohibited` from ' +
      'fabricating an identifier.',
    aiBehaviour:
      '`Not applicable`.',
    acceptanceCriteria: ['AC-37A-207'],
    tests: ['TEST-37A-207'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-017',
    group: 'B',
    sourceLine: 81368,
    title:
      'Offline checkbox confirmations, single-item and multi-item',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-CHECKLIST',
    storyboard:
      '`SCR-FL-PLAYER-01`',
    permissions:
      'Worker `Allowed` to confirm; Worker `Explicitly prohibited` from un-confirming after ' +
      'commit, which requires an appended correction.',
    aiBehaviour:
      '`Not applicable`.',
    acceptanceCriteria: ['AC-37A-208'],
    tests: ['TEST-37A-208'],
    preservedContradiction:
      'whether "checklist" and "boolean" or "checkbox confirmation" is the contract name is ' +
      '`DEC-CAP-001`; both readings stay recorded in the card, and the adopted name is ' +
      'checkbox confirmation with a multiplicity setting — one confirmation where §1.7 and ' +
      '§7.8.3 say boolean, many where they say checklist.',
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-018',
    group: 'B',
    sourceLine: 81370,
    title:
      'Offline electronic signature capture',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-SIGN',
    storyboard:
      '`SCR-FL-PLAYER-01` signature state',
    permissions:
      'Worker `Allowed` to sign for their own acknowledgement; Worker `Explicitly prohibited` ' +
      'from signing a supervisor authorisation.',
    aiBehaviour:
      '`Explicitly prohibited` — artificial intelligence may never impersonate a role or ' +
      'self-approve.',
    acceptanceCriteria: ['AC-37A-209'],
    tests: ['TEST-37A-209'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-019',
    group: 'B',
    sourceLine: 81372,
    title:
      'Offline free-text deviation note',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-DEVNOTE',
    storyboard:
      '`SCR-FL-PLAYER-01` deviation state',
    permissions:
      'Worker `Allowed` to write; Worker `Explicitly prohibited` from editing after commit.',
    aiBehaviour:
      '`Unavailable` offline; the platform never invents content, rules or thresholds in any ' +
      'case.',
    acceptanceCriteria: ['AC-37A-210'],
    tests: ['TEST-37A-210'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-020',
    group: 'B',
    sourceLine: 81374,
    title:
      'Offline append-only correction to a committed capture',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-013' },
    workflow: 'WF-OFF-CORRECT',
    storyboard:
      '`SCR-FL-PLAYER-01` read-only review state',
    permissions:
      'Worker `Allowed` to append a correction; Worker `Explicitly prohibited` from altering ' +
      'the original; Quality Manager `Read-only` on both, since oversight surfaces display ' +
      'evidence and never edit it.',
    aiBehaviour:
      '`Explicitly prohibited` from initiating, suggesting the content of, or approving a ' +
      'correction to a committed record.',
    acceptanceCriteria: ['AC-37A-211'],
    tests: ['TEST-37A-211'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-021',
    group: 'C',
    sourceLine: 81406,
    title:
      'Offline Severity 1 lot freeze with the pre-authorised containment checklist',
    module: 'MOD-FL-A5',
    fallback: null,
    blockers: [],
    diagram: { kind: 'own', declaredInOwnMetadata: true },
    workflow: 'WF-OFF-SEV1',
    storyboard:
      '`SCR-FL-PLAYER-01` containment state',
    permissions:
      'Worker `Allowed` to execute containment; Quality Manager `Allowed` to release; every ' +
      'other role `Explicitly prohibited` from release.',
    aiBehaviour:
      '`Explicitly prohibited` from classifying or releasing; `Unavailable` offline for ' +
      'interpretation.',
    acceptanceCriteria: ['AC-37A-301'],
    tests: ['TEST-37A-301'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-022',
    group: 'C',
    sourceLine: 81408,
    title:
      'Offline Severity 1 on serialized work with no lot, freezing the Unit',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-SEV1',
    storyboard:
      '`SCR-FL-PLAYER-01`',
    permissions:
      'as `UC-OFF-021`.',
    aiBehaviour:
      'as `UC-OFF-021`.',
    acceptanceCriteria: ['AC-37A-302'],
    tests: ['TEST-37A-302'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-023',
    group: 'C',
    sourceLine: 81410,
    title:
      'Offline Severity 1 where the work carries no unit at all, freezing the Run',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-31'],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-SEV1',
    storyboard:
      '`SCR-FL-BLOCK-01`',
    permissions:
      'as `UC-OFF-021`.',
    aiBehaviour:
      'as `UC-OFF-021`.',
    acceptanceCriteria: ['AC-37A-303'],
    tests: ['TEST-37A-303'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-024',
    group: 'C',
    sourceLine: 81412,
    title:
      'Offline rework loop from deviation through containment, rework and re-run',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-REWORK',
    storyboard:
      '`SCR-FL-PLAYER-01` rework states',
    permissions:
      'Worker `Allowed` to rework where the authored path permits; Worker `Explicitly ' +
      'prohibited` from deleting the original failure.',
    aiBehaviour:
      '`Unavailable` offline.',
    acceptanceCriteria: ['AC-37A-304'],
    tests: ['TEST-37A-304'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-025',
    group: 'C',
    sourceLine: 81414,
    title:
      'Offline repeated rework cycles on the same unit',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-REWORK',
    storyboard:
      '`SCR-FL-PLAYER-01`',
    permissions:
      'as `UC-OFF-024`; Quality Manager `Allowed` to stop the cycle by disposition.',
    aiBehaviour:
      '`Unavailable` offline; after sync, prior-case retrieval may help the Quality Manager ' +
      'interpret a repeating failure.',
    acceptanceCriteria: ['AC-37A-305'],
    tests: ['TEST-37A-305'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-026',
    group: 'C',
    sourceLine: 81416,
    title:
      'A sibling device continues working the same lot while a hold exists elsewhere',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-PROPAGATE',
    storyboard:
      '`SCR-CC-DEV-01` propagation view',
    permissions:
      'Worker B `Allowed` to continue until the hold reaches their device; Command Center ' +
      '`Explicitly prohibited` from showing the hold as in force on device B before it is.',
    aiBehaviour:
      '`Not applicable — propagation is deterministic command delivery`.',
    acceptanceCriteria: ['AC-37A-306'],
    tests: ['TEST-37A-306'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-027',
    group: 'C',
    sourceLine: 81418,
    title:
      'Hold propagation lag rendered honestly on reconnection',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-PROPAGATE',
    storyboard:
      '`SCR-CC-DEV-01`',
    permissions:
      'Supervisor `Read-only` on propagation; Quality Manager `Allowed` to release; the ' +
      'client\'s platform team `Read-only` on lag telemetry.',
    aiBehaviour:
      '`Not applicable`.',
    acceptanceCriteria: ['AC-37A-307'],
    tests: ['TEST-37A-307'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-028',
    group: 'C',
    sourceLine: 81420,
    title:
      'An offline specification gate blocks advance without valid proof',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-GATE',
    storyboard:
      '`SCR-FL-BLOCK-01`',
    permissions:
      'Worker `Explicitly prohibited` from overriding; Supervisor `Explicitly prohibited` from ' +
      'overriding a specification gate on a worker\'s behalf, which is deliberately impossible ' +
      'from the Command Center; Quality Manager `Explicitly prohibited` likewise.',
    aiBehaviour:
      '`Explicitly prohibited` from bypassing a specification gate.',
    acceptanceCriteria: ['AC-37A-308'],
    tests: ['TEST-37A-308'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-029',
    group: 'C',
    sourceLine: 81422,
    title:
      'An offline evidence gate blocks advance where required proof is missing',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-GATE',
    storyboard:
      '`SCR-FL-BLOCK-01`',
    permissions:
      'as `UC-OFF-028`.',
    aiBehaviour:
      'as `UC-OFF-028`.',
    acceptanceCriteria: ['AC-37A-309'],
    tests: ['TEST-37A-309'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-030',
    group: 'C',
    sourceLine: 81424,
    title:
      'Offline detection of a sequence or timing deviation',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-021' },
    workflow: 'WF-OFF-SEQUENCE',
    storyboard:
      '`SCR-FL-PLAYER-01` deviation state',
    permissions:
      'Worker `Allowed` to record the deviation detail; Worker `Explicitly prohibited` from ' +
      'seeing any pace figure, timer against expectation, or comparison to others, in any ' +
      'module, any state and any release.',
    aiBehaviour:
      'timing thresholds may drive coaching, but what the worker sees is the support content ' +
      'and never the stopwatch; offline, coaching is `Unavailable` and the authored ' +
      'instructions render.',
    acceptanceCriteria: ['AC-37A-310'],
    tests: ['TEST-37A-310'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-031',
    group: 'D',
    sourceLine: 81456,
    title:
      'Offline login inside the credential trust window',
    module: 'MOD-FL-A1',
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-032' },
    workflow: 'WF-OFF-LOGIN',
    storyboard:
      '`SCR-FL-LOGIN-01` adapting to the device mode',
    permissions:
      'Worker `Allowed` to sign in within the window; Worker `Explicitly prohibited` from ' +
      'extending the window locally.',
    aiBehaviour:
      '`Not applicable — authentication is deterministic`.',
    acceptanceCriteria: ['AC-37A-401'],
    tests: ['TEST-37A-401'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-032',
    group: 'D',
    sourceLine: 81458,
    title:
      'Offline login attempt after the credential trust window has expired',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-08'],
    diagram: { kind: 'own', declaredInOwnMetadata: true },
    workflow: 'WF-OFF-LOGIN',
    storyboard:
      '`SCR-FL-BLOCK-01`',
    permissions:
      'Worker `Unavailable` for new work; Worker `Allowed` to view the sync indicator; ' +
      'Supervisor `Allowed` to close a stuck run in the Hub with a mandatory note.',
    aiBehaviour:
      '`Not applicable`.',
    acceptanceCriteria: ['AC-37A-402'],
    tests: ['TEST-37A-402'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-033',
    group: 'D',
    sourceLine: 81460,
    title:
      'Offline personal identification number lockout after repeated failures',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-032' },
    workflow: 'WF-OFF-LOGIN',
    storyboard:
      '`SCR-FL-BLOCK-01`',
    permissions:
      'Worker `Unavailable` after lockout; Tenant Admin `Allowed` to reset through the Hub ' +
      'when connectivity exists.',
    aiBehaviour:
      '`Not applicable`.',
    acceptanceCriteria: ['AC-37A-403'],
    tests: ['TEST-37A-403'],
    preservedContradiction: null,
    unspecifiedValueNote:
      'the number of failures before lockout is **Not specified in the Statement of Work** and ' +
      'is `TBD — Client Decision Required`; it is proposed as `DEC-OFF-002` in the closing ' +
      'register of this chapter.',
  },
  {
    id: 'UC-OFF-034',
    group: 'D',
    sourceLine: 81462,
    title:
      'Offline fast worker switch on a Shared device',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-032' },
    workflow: 'WF-OFF-SHAREDSWITCH',
    storyboard:
      '`SCR-FL-LOGIN-01` Shared-mode posture',
    permissions:
      'each Worker `Allowed` on their own work; each Worker `Explicitly prohibited` from ' +
      'seeing any other worker\'s data, since the application is scoped to the logged-in ' +
      'identity.',
    aiBehaviour:
      '`Unavailable` offline; the worker\'s profile language and difficulty level still drive ' +
      'rendering from the package.',
    acceptanceCriteria: ['AC-37A-404'],
    tests: ['TEST-37A-404'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-035',
    group: 'D',
    sourceLine: 81464,
    title:
      'Offline long session on a Personal or assigned device',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-032' },
    workflow: 'WF-OFF-PERSONAL',
    storyboard:
      '`SCR-FL-LOGIN-01` Personal-mode posture',
    permissions:
      'Worker `Allowed` a long session; Tenant Admin `Allowed` to set the mode at enrollment; ' +
      'nobody `Allowed` to let the session outlive the trust window\'s authority.',
    aiBehaviour:
      '`Unavailable` offline.',
    acceptanceCriteria: ['AC-37A-405'],
    tests: ['TEST-37A-405'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-036',
    group: 'D',
    sourceLine: 81466,
    title:
      'An offline qualification gate blocks and the run parks',
    module: 'MOD-FL-B9',
    fallback: null,
    blockers: ['OFF-BLK-10'],
    diagram: { kind: 'own', declaredInOwnMetadata: true },
    workflow: 'WF-OFF-QUALGATE',
    storyboard:
      '`SCR-FL-PARK-01`, `SCR-CC-CLEAR-01`',
    permissions:
      'Worker `Explicitly prohibited` from overriding; Supervisor `Allowed` to grant, from ' +
      'their own device, wherever they are; Quality Manager `Allowed` on the second-override ' +
      'escalation; Tenant Admin `Allowed` to set the posture, `Explicitly prohibited` from ' +
      'setting anything looser than the platform floor.',
    aiBehaviour:
      '`Explicitly prohibited` from granting, extending or bypassing a clearance.',
    acceptanceCriteria: ['AC-37A-406'],
    tests: ['TEST-37A-406'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-037',
    group: 'D',
    sourceLine: 81488,
    title:
      'An offline clearance expires and re-blocks at the next gate evaluation',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-032' },
    workflow: 'WF-OFF-QUALGATE',
    storyboard:
      '`SCR-FL-PARK-01`',
    permissions:
      'as `UC-OFF-036`; a second override in the same area in the same shift `Allowed with ' +
      'conditions` — it escalates to the Quality Manager.',
    aiBehaviour:
      'as `UC-OFF-036`.',
    acceptanceCriteria: ['AC-37A-407'],
    tests: ['TEST-37A-407'],
    preservedContradiction: null,
    unspecifiedValueNote:
      'the platform default, floor and ceiling for the clearance duration are `TBD — Client ' +
      'Decision Required` under `DEC-OFF-001`.',
  },
  {
    id: 'UC-OFF-038',
    group: 'D',
    sourceLine: 81490,
    title:
      'Offline supervisor sign-off through the second-identity step-up',
    module: null,
    fallback: null,
    blockers: [],
    diagram: { kind: 'reuses', representative: 'UC-OFF-036' },
    workflow: 'WF-OFF-SIGNOFF',
    storyboard:
      '`SCR-FL-PLAYER-01` step-up state',
    permissions:
      'Supervisor `Allowed` to step up; Worker `Explicitly prohibited` from signing for the ' +
      'supervisor; the second identity `Allowed with conditions` — bound to that authorisation ' +
      'only and released afterwards.',
    aiBehaviour:
      '`Explicitly prohibited` from impersonating a role or self-approving.',
    acceptanceCriteria: ['AC-37A-408'],
    tests: ['TEST-37A-408'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-039',
    group: 'D',
    sourceLine: 81492,
    title:
      'Offline substitute sign-off where no supervisor is available',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-25', 'OFF-BLK-36'],
    diagram: { kind: 'reuses', representative: 'UC-OFF-036' },
    workflow: 'WF-OFF-SIGNOFF',
    storyboard:
      '`SCR-FL-PLAYER-01` step-up state, `SCR-CC-ALERT-01` notification',
    permissions:
      'substitute `Allowed with conditions` — only where cached eligibility confirms it; ' +
      'Worker `Explicitly prohibited` from any part of it.',
    aiBehaviour:
      '`Explicitly prohibited`.',
    acceptanceCriteria: ['AC-37A-409'],
    tests: ['TEST-37A-409'],
    preservedContradiction:
      'the ordering implied by the `Supervisor+` and `QM+` forms across five additive, ' +
      'non-hierarchical roles is `DEC-PLUS-001`; both readings preserved.',
    unspecifiedValueNote: null,
  },
  {
    id: 'UC-OFF-040',
    group: 'D',
    sourceLine: 81494,
    title:
      'A forced-sync high-risk action attempted offline',
    module: null,
    fallback: null,
    blockers: ['OFF-BLK-33'],
    diagram: { kind: 'reuses', representative: 'UC-OFF-032' },
    workflow: 'WF-OFF-FORCEDSYNC',
    storyboard:
      '`SCR-FL-BLOCK-01`',
    permissions:
      'Worker `Unavailable` for the high-risk action; Worker `Allowed` on every other step; ' +
      'nobody `Allowed` to record an authorisation against cached identity.',
    aiBehaviour:
      '`Not applicable`.',
    acceptanceCriteria: ['AC-37A-410'],
    tests: ['TEST-37A-410'],
    preservedContradiction: null,
    unspecifiedValueNote: null,
  },
] as const satisfies readonly OfflineUseCase[]

/* ── the four groups, and the counts measured over their headings ────────── */

export interface UseCaseGroup {
  readonly key: UseCaseGroupKey
  readonly section: string
  /** The `### 37A.n Group X — …` heading, verbatim after the section number. */
  readonly title: string
  readonly opensAt: number
  /** The range the catalogue's own group table states at L81218-L81221. */
  readonly statedRange: string
  /** Representatives this group's row of that table names. */
  readonly representatives: readonly string[]
}

export const USE_CASE_GROUPS = [
  {
    key: 'A',
    section: '37A.1',
    title: 'Group A — Basic Offline Execution and the Shapes of an Outage',
    opensAt: 81282,
    statedRange: '`UC-OFF-001` to `UC-OFF-010`',
    representatives: ['UC-OFF-001'],
  },
  {
    key: 'B',
    section: '37A.2',
    title: 'Group B — Capture and Evidence Offline',
    opensAt: 81328,
    statedRange: '`UC-OFF-011` to `UC-OFF-020`',
    representatives: ['UC-OFF-013'],
  },
  {
    key: 'C',
    section: '37A.3',
    title: 'Group C — Safety, Containment and the Gates Offline',
    opensAt: 81376,
    statedRange: '`UC-OFF-021` to `UC-OFF-030`',
    representatives: ['UC-OFF-021'],
  },
  {
    key: 'D',
    section: '37A.4',
    title: 'Group D — Identity, Qualification and Authority Offline',
    opensAt: 81426,
    statedRange: '`UC-OFF-031` to `UC-OFF-040`',
    representatives: ['UC-OFF-032', 'UC-OFF-036'],
  },
] as const satisfies readonly UseCaseGroup[]

/**
 * COUNTED, NOT INFERRED FROM A SPAN. Every one of the seven groups holds ten
 * entry headings and the catalogue holds seventy, measured by matching the
 * entry-heading form over all 122,241 lines and bucketing each identifier into
 * the group whose section it falls under.
 *
 * Groups E, F and G are here as MEASUREMENTS, not as transcriptions: this task
 * owns no entry outside A-D and holds none. Their counts are recorded because
 * the arithmetic the task brief carried — ten, ten, ten, ten, ELEVEN, ten, ten,
 * summing to seventy-one against a catalogue of seventy — is wrong about which
 * group is not ten, and the honest answer is that none of them is not ten.
 * A span scan of group E's body finds eleven distinct identifiers because a
 * group D entry is cross-referenced inside it at L81532; a heading scan finds
 * ten. The brief was right about the mechanism and wrong about the outcome.
 */
export const GROUP_HEADING_COUNTS = [
  { group: 'A', headings: 10, owned: true },
  { group: 'B', headings: 10, owned: true },
  { group: 'C', headings: 10, owned: true },
  { group: 'D', headings: 10, owned: true },
  { group: 'E', headings: 10, owned: false },
  { group: 'F', headings: 10, owned: false },
  { group: 'G', headings: 10, owned: false },
] as const satisfies readonly { group: string; headings: number; owned: boolean }[]

/** Seventy, which is the figure L81208 and the group table both state. */
export const CATALOGUE_TOTAL = 70

/**
 * The diagram arithmetic, counted by matching fences rather than read off a
 * span. Thirteen mermaid blocks sit in §37A; the first is the catalogue map, so
 * twelve are use-case diagrams, which is what L81212 claims. Five of the twelve
 * fall inside groups A-D and thirty-five of these forty entries therefore point
 * at one instead of carrying one.
 */
export const DIAGRAM_BLOCK_CENSUS = {
  mermaidBlocksIn37A: 13,
  catalogueMaps: 1,
  useCaseDiagrams: 12,
  useCaseDiagramsInGroupsAD: 5,
  reusersInGroupsAD: 35,
} as const

/**
 * `AC-37A-005` verbatim, because this module's central claim is about its exact
 * words: "only the closed status set", "no blank cell", "no unexplained". A
 * paraphrase would let the criterion be satisfied by a reading it does not
 * license, which is how three permission lines carrying no status at all became
 * a question rather than a defect.
 */
export const AC_37A_005_CRITERION =
  'Every entry\'s permission line uses only the closed status set, with no blank cell and no ' +
  'unexplained "not applicable".'

/* ── reading the closed status vocabulary out of a verbatim clause ───────── */

/**
 * A typed predicate beside the constant rather than a widened constant — the
 * `as const satisfies` form above makes `.includes()` stop type-checking on a
 * narrowed array, and widening the array back is exactly what the declaration
 * gate rejects.
 */
export function isPermissionStatus(value: string): value is PermissionStatus {
  return (PERMISSION_STATUSES as readonly string[]).includes(value)
}

/**
 * Every status token a verbatim clause names, in the order it names them,
 * with repeats kept — a permission line that says `Allowed` three times is
 * making three grants and the census counts three.
 *
 * The source writes each status inside backticks and appends its reason after
 * an em dash INSIDE the same backticks for `Not applicable` and sometimes for
 * `Allowed with conditions`. So the token is the text up to the first em dash,
 * and the longest-first ordering of `PERMISSION_STATUSES` is what stops
 * `Allowed with conditions` being read as `Allowed`.
 */
export function permissionStatusesIn(clause: string): readonly PermissionStatus[] {
  const found: PermissionStatus[] = []
  for (const match of clause.matchAll(/`([^`]+)`/g)) {
    const head = (match[1] ?? '').split('—')[0]?.trim() ?? ''
    const status = PERMISSION_STATUSES.find((candidate) => head === candidate)
    if (status !== undefined) found.push(status)
  }
  return found
}

/**
 * The census `AC-37A-005` holds by, over the forty permission lines. Stated as
 * literals rather than computed, so that a transcription that loses or gains a
 * status cell is a test failure rather than a silently updated total.
 */
export const PERMISSION_STATUS_CENSUS = [
  { status: 'Allowed', cells: 46 },
  { status: 'Explicitly prohibited', cells: 27 },
  { status: 'Read-only', cells: 11 },
  { status: 'Allowed with conditions', cells: 5 },
  { status: 'Unavailable', cells: 4 },
  { status: 'Not applicable', cells: 2 },
] as const satisfies readonly { status: PermissionStatus; cells: number }[]

/** Ninety-five, which is what the six rows above add to. */
export const PERMISSION_STATUS_CELLS = 95

/* ── lookups ─────────────────────────────────────────────────────────────── */

export function useCase(id: UseCaseId): OfflineUseCase {
  const found = OFFLINE_USE_CASES_A_D.find((entry) => entry.id === id)
  if (found === undefined) throw new Error(`No group A-D use case ${id}`)
  return found
}

export function useCasesInGroup(group: UseCaseGroupKey): readonly OfflineUseCase[] {
  return OFFLINE_USE_CASES_A_D.filter((entry) => entry.group === group)
}

/**
 * The representative whose diagram this entry renders — itself where it carries
 * one, the entry it points at otherwise. This is the pointer the diagram-reuse
 * rule asks for: thirty-five of these forty resolve to one of five, and none of
 * them duplicates a diagram to do it.
 */
export function diagramFor(entry: OfflineUseCase): string {
  return entry.diagram.kind === 'own' ? entry.id : entry.diagram.representative
}

/* ── measured divergences, all carried, none resolved ────────────────────── */

export interface CatalogueFinding {
  readonly what: string
  readonly claimed: string
  readonly counted: string
  readonly locators: readonly string[]
}

/**
 * Group D's reuse paragraph names five of the six entries that declare a reuse
 * of its first representative, and says nothing about the two that declare a
 * reuse of its second. Groups A, B and C's paragraphs are each exact.
 *
 * Not repaired. The entry-level declarations and the group-level sentence are
 * both the source speaking, and `AC-37A-004` binds the entries rather than the
 * paragraph — so the entries are what this build reads, and the shortfall in
 * the paragraph is reported rather than silently corrected in either direction.
 */
export const GROUP_D_REUSE_UNDERCOUNT: CatalogueFinding = {
  what: 'reusers of group D\'s first representative diagram',
  claimed: 'five, enumerated in the group\'s reuse paragraph',
  counted:
    'six, each declaring the reuse in its own metadata clause; the sixth is absent from the ' +
    'paragraph. The paragraph also accounts for neither of the two entries that declare a ' +
    'reuse of the group\'s second representative.',
  locators: [
    'group D reuse paragraph L81454',
    '`UC-OFF-040` L81494 — the declared reuser the paragraph omits',
    '`UC-OFF-038` L81490 and `UC-OFF-039` L81492 — the two it does not mention',
    'the exact paragraphs for comparison: L81306, L81354, L81404',
  ],
}

/**
 * `AC-37A-005` governs the permission line. Six artificial-intelligence lines
 * carry a bare "not applicable" with no reason attached, which would breach the
 * criterion's second clause if the criterion reached them. It does not, and
 * this build does not widen it — deciding the criterion covers a line it never
 * names is a ruling, and the ruling is the client's.
 */
export const BARE_NOT_APPLICABLE_OUTSIDE_AC_37A_005: CatalogueFinding = {
  what: 'unexplained "not applicable" cells in groups A-D',
  claimed:
    '`AC-37A-005` forbids them, in the permission line, and over the forty permission lines ' +
    'here it holds: both such cells carry a reason.',
  counted:
    'six bare cells, all of them in the artificial-intelligence line, which the criterion does ' +
    'not name. Six of the twelve "not applicable" cells on that line carry a reason and six do ' +
    'not.',
  locators: [
    'criterion L81278',
    'the two explained permission cells: L81322, L81326',
    'the six bare artificial-intelligence cells: L81366, L81368, L81418, L81458, L81460, L81494',
  ],
}

/**
 * Five permission lines defer to a neighbour instead of restating its grants,
 * and three of those five add nothing of their own. Whether that satisfies
 * `AC-37A-005`'s "no blank cell" is the question, and it is not this build's to
 * settle: `inheritsFrom` names the entry the line points at, so a consumer that
 * wants the referenced statuses can follow the pointer, and one that wants the
 * literal line gets an empty status list. Neither reading is baked in.
 */
export interface PermissionCrossReference {
  readonly id: string
  readonly sourceLine: number
  /** The entry whose permission line this one defers to. */
  readonly inheritsFrom: string
  /** True where the line adds no status of its own beyond the reference. */
  readonly addsNothing: boolean
}

export const PERMISSION_LINES_BY_CROSS_REFERENCE = [
  { id: 'UC-OFF-022', sourceLine: 81408, inheritsFrom: 'UC-OFF-021', addsNothing: true },
  { id: 'UC-OFF-023', sourceLine: 81410, inheritsFrom: 'UC-OFF-021', addsNothing: true },
  { id: 'UC-OFF-025', sourceLine: 81414, inheritsFrom: 'UC-OFF-024', addsNothing: false },
  { id: 'UC-OFF-029', sourceLine: 81422, inheritsFrom: 'UC-OFF-028', addsNothing: true },
  { id: 'UC-OFF-037', sourceLine: 81488, inheritsFrom: 'UC-OFF-036', addsNothing: false },
] as const satisfies readonly PermissionCrossReference[]

/**
 * The catalogue's shared-storyboard paragraph says every entry draws on one
 * small set and then names eleven screens. Groups A-D name twelve, three of
 * which are outside that set, and reach nine of the eleven.
 *
 * Carried rather than reconciled: the three extra screens are named by entries
 * that need them — a login posture, a clearance grant, a substitution alert —
 * and none of them is a screen the eleven could stand in for.
 */
export const STORYBOARD_SCREENS_OUTSIDE_THE_SHARED_SET: CatalogueFinding = {
  what: 'storyboard screens named by groups A-D',
  claimed: 'eleven, described as the set every entry draws on',
  counted:
    'twelve named across these forty entries, of which three are outside the eleven and nine ' +
    'of the eleven are used. The three outside it are the login screen, the clearance screen ' +
    'and the alert screen.',
  locators: [
    'shared set L81266',
    'login screen named at L81456, L81462 and L81464',
    'clearance screen named at L81486',
    'alert screen named at L81492',
  ],
}

/**
 * Stated as a fact about the generator rather than a complaint about the brief,
 * because the next reader will meet the same gap. `walkRouteTree` in
 * `scripts/build-registries.mjs` collects identifier tokens ONLY from files
 * directly inside an `app/` directory that holds a `page.tsx`, and
 * `statusForId` answers from that set alone. The generator's separate walk over
 * `src/` reads only files named `modules.ts`, for their slug claims.
 */
export const REGISTRY_DEMONSTRATION_NOTE =
  'This module cannot move `registries/generated/offline-scenarios.json` off zero demonstrated ' +
  'rows. That registry\'s status is `statusForId`, which answers off `citedTokens`, which only ' +
  '`walkRouteTree` fills, and that walk is rooted at `app/`. The generator\'s other walk over ' +
  '`src/` collects files named `modules.ts` for their route slug claims and feeds the module ' +
  'inventory, not this one. Seventy rows stay `not-represented` until a shipped route screen ' +
  'names the identifiers. This file names all forty of groups A-D, which is the whole of what a ' +
  'module under `src/` can contribute to that join.'

/* ── two decisions this tree holds nowhere else ──────────────────────────── */

/**
 * Both are raised by entries in group D and neither is in the shared decision
 * canon. They are disclosed here on the shipped `Stu14LocalDisclosure` idiom:
 * the canon's own `DecisionReading` shape imported rather than redeclared, both
 * readings carried, nothing adopted, and a gate asserting the identifiers are
 * ABSENT from the canon so that the day they are lifted this suite goes red and
 * forces the switch.
 *
 * THESE ARE PAIRED RECORDS, NOT A SECOND SPELLING, and the pairing is declared
 * on both sides. `@/offline/decisions-37b` landed while this file was being
 * written and holds the §37B side — the closing register that collects the two
 * items, the §37.1 rule behind the first, and its options card. It names this
 * path in `DEC_37B_ALSO_DISCLOSED_IN` and requires it. This side holds what the
 * group D entries themselves state and cites only their lines; no sentence and
 * no locator is shared between the two. The covering suite checks the pairing
 * from this end — that the holder exists, sits outside this directory, and
 * cites lines this record does not.
 */
export interface UseCaseLocalDisclosure {
  readonly decisionRef: 'DEC-OFF-001' | 'DEC-OFF-002'
  /** The group D entry that raises it. */
  readonly raisedBy: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does with it, which is never to pick a value. */
  readonly adopted: string
  readonly canonNote: string
}

export const USE_CASE_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-OFF-001',
    raisedBy: 'UC-OFF-037',
    question:
      'What are the platform default, floor and ceiling for a qualification clearance duration?',
    readings: [
      {
        text:
          'The group D entry states the duration as tenant-defined and its bounds as an open ' +
          'client decision, in the entry\'s own note on an unspecified value.',
        locator: 'DEC-OFF-001 · L81488',
      },
      {
        text:
          'The chapter\'s closing register states the same item with a recommendation attached ' +
          '— tenant-set with a ceiling aligned to the offline trust window\'s ceiling — and ' +
          'names the client quality lead with the floor-register owner as its owner.',
        locator: 'DEC-OFF-001 · L81738',
      },
    ],
    adopted:
      'No value is adopted. The clearance duration renders as tenant-defined with its bounds ' +
      'shown as an open client decision named `DEC-OFF-001`, which is what the entry itself ' +
      'does. Choosing a default here would answer a question the source asks twice and settles ' +
      'neither time.',
    canonNote:
      'The shared decision canon carries no record for this identifier. `@/offline/decisions-37b` ' +
      'holds the §37B side — the closing register that COLLECTS the item, its §37.1 rule and its ' +
      'options card — and names this file as the paired holder of the use-case side, which is ' +
      'the entry that RAISES it. Two records, no shared sentence and no shared locator. The ' +
      'absence from the canon is gated so that lifting it there breaks this suite instead of ' +
      'leaving a third spelling behind.',
  },
  {
    decisionRef: 'DEC-OFF-002',
    raisedBy: 'UC-OFF-033',
    question:
      'How many failed personal-identification-number attempts precede a lockout, and how long ' +
      'does the lockout last?',
    readings: [
      {
        text:
          'The group D entry names ONE value — the number of failures before lockout — as not ' +
          'specified in the Statement of Work and a client decision, and says the item is ' +
          'proposed in the closing register of the chapter.',
        locator: 'DEC-OFF-002 · L81460',
      },
      {
        text:
          'That closing register names TWO values under the one identifier: the number of ' +
          'failed attempts before lockout, AND the lockout duration. The entry that raises the ' +
          'decision therefore describes a narrower question than the register that holds it.',
        locator: 'DEC-OFF-002 · L81739',
      },
    ],
    adopted:
      'Neither value is adopted and neither reading of the question\'s scope is chosen. The ' +
      'lockout renders with its threshold and its duration both shown as open under ' +
      '`DEC-OFF-002`, which satisfies both readings without deciding between them.',
    canonNote:
      'As for `DEC-OFF-001`: absent from the shared canon, paired with the §37B record in ' +
      '`@/offline/decisions-37b`, and gated on both counts.',
  },
] as const satisfies readonly UseCaseLocalDisclosure[]

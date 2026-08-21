/**
 * §19.2 — The Shared Fallback Pattern Register, as data.
 *
 * Before this file there were **zero `FB-DOH-` strings anywhere under
 * `src/`, `app/` or `tests/`** (measured, not quoted: `grep -rn "FB-DOH-"
 * src/ app/ tests/ | wc -l` returned 0), while nineteen Hub module identity
 * cards each name the patterns that govern them by identifier. Every one of
 * those citations pointed at nothing.
 *
 * COUNT, DERIVED RATHER THAN QUOTED. `grep -o 'FB-DOH-[A-Z]*-[0-9]*'` over
 * the frozen source yields **276 occurrences of exactly 10 distinct
 * identifiers**, and §19.2 carries exactly 10 `**Pattern \`FB-DOH-...\`**`
 * headers (L26506, L26538, L26570, L26602, L26634, L26666, L26698, L26730,
 * L26762, L26794). Both counts were taken from the source, independently of
 * each other and independently of the brief that named ten. The test asserts
 * `FALLBACK_PATTERNS.length` against the second derivation, and asserts the
 * set equality against the first — a registry with nine entries and a
 * hand-written `expect(9)` would pass a test derived from itself.
 *
 * WHY IT IS DATA AND NOT PROSE. §19.2's own numbered workflow states the
 * contract this shape enforces: "(1) The module names the pattern that
 * governs each of its functionalities, by `FB-*` identifier. (2) The module
 * states only the differences. (3) **Nothing in a module may loosen a
 * pattern; a module may only tighten it.**" A module that copies a pattern's
 * prose into its own file can loosen it silently. A module that holds an
 * identifier cannot.
 *
 * Every string below is verbatim from the pattern's own table row. Nothing
 * here is summarised, because a summarised terminal safe state is a
 * different terminal safe state.
 */

/** The ten identifiers §19.2 defines. Closed at ten; an eleventh is a scope decision. */
export type FallbackPatternId =
  | 'FB-DOH-CORE-001'
  | 'FB-DOH-WRITE-002'
  | 'FB-DOH-CMD-003'
  | 'FB-DOH-NOTIF-004'
  | 'FB-DOH-AUDIT-005'
  | 'FB-DOH-COMPUTE-006'
  | 'FB-DOH-IMPORT-007'
  | 'FB-DOH-STATE-008'
  | 'FB-DOH-EXPORT-009'
  | 'FB-DOH-SCHED-010'

export interface FallbackPattern {
  readonly id: FallbackPatternId
  /** The pattern header's own words, after the em dash. */
  readonly title: string
  /** `| First fallback |`, verbatim. */
  readonly firstFallback: string
  /** `| Fallback of fallback |`, verbatim. */
  readonly fallbackFailure: string
  /** `| Terminal safe state |`, verbatim. §19.2 step 4: always a hold or safe stop. */
  readonly terminalSafeState: string
  /** `| User communication |`, verbatim. SB-DOH-012's fixed vocabulary lives here. */
  readonly userCommunication: string
  /** The `**Pattern ...**` header line in the frozen source. */
  readonly sourceLine: string
}

export const FALLBACK_PATTERNS = [
  {
    id: 'FB-DOH-CORE-001',
    title: 'Delivery Operations Hub read path degraded.',
    firstFallback:
      'Serve from the read replica with an explicit freshness marker and a data-as-of timestamp.',
    fallbackFailure:
      'Navigate to the Hub home outage notice, which offers no state-changing control.',
    terminalSafeState:
      'Full-screen service-unavailable page naming the tenant, the last successful contact time and the support route.',
    userCommunication: 'Reading recent data — writes are paused',
    sourceLine: 'L26506',
  },
  {
    id: 'FB-DOH-WRITE-002',
    title: 'a master-data or configuration write fails.',
    firstFallback:
      'One bounded, idempotent retry of the whole transaction. Idempotency here means the retry cannot create a second record; the request carries a client-generated idempotency key.',
    fallbackFailure:
      'Where the tenant-state service is the failing dependency, treat the tenant as being in its most recently known suspension state or stricter; never assume good standing.',
    terminalSafeState:
      'The record is unchanged, the user is told plainly, and no audit entry claims a change occurred.',
    userCommunication: 'Saving is unavailable — nothing has been lost',
    sourceLine: 'L26538',
  },
  {
    id: 'FB-DOH-CMD-003',
    title: 'a command cannot be delivered to a device.',
    firstFallback:
      'Continue queuing with ordered delivery preserved, and render the honest state — issued, propagating, in force per device.',
    fallbackFailure:
      'Controlled hold: the Hub blocks new assignment to the affected worker or device so an undelivered enforcement command cannot be outrun by new work.',
    terminalSafeState:
      'The device continues under its last validly applied state until its offline credential-trust window expires — tenant-set, default approximately 24 hours, platform ceiling 72 hours — after which cached authority lapses.',
    userCommunication: 'Delivery to devices is delayed — the instruction is recorded',
    sourceLine: 'L26570',
  },
  {
    id: 'FB-DOH-NOTIF-004',
    title: 'a notification cannot be delivered.',
    firstFallback:
      'In-app delivery alone, which cannot be muted and therefore always has a landing place.',
    fallbackFailure:
      'Inclusion in the next per-shift digest section, which is delivered per Shift at its configured time.',
    terminalSafeState:
      'The notification remains in the in-app tray as unread and unacknowledged, visible and ageing, rather than being dropped.',
    userCommunication:
      'The tray shows the notification with its delivery state; a failed email shows “Email delivery failed — this notice is in your in-app tray”.',
    sourceLine: 'L26602',
  },
  {
    id: 'FB-DOH-AUDIT-005',
    title: 'the audit write cannot commit.',
    firstFallback: 'One bounded idempotent retry of the combined transaction.',
    fallbackFailure:
      'Place the affected write class into a controlled hold so users are not left retrying blindly.',
    terminalSafeState:
      'Writes refused; reads continue; the floor is unaffected because on-device execution and the deterministic layer have no dependency on the tenant audit store.',
    userCommunication:
      'Saving is unavailable — nothing has been lost, plus an explicit line that the audit record could not be written.',
    sourceLine: 'L26634',
  },
  {
    id: 'FB-DOH-COMPUTE-006',
    title: 'a computed artefact cannot compute.',
    firstFallback: 'Bounded retry of the computation.',
    fallbackFailure:
      'Present the raw capture list with a statement that the Summary could not compute, so a Quality Manager can still see the underlying evidence.',
    terminalSafeState:
      'The Summary is marked uncomputed; Quality Manager review for that run cannot be completed and the run is held visibly in the review queue rather than passing through unreviewed.',
    userCommunication:
      'This summary could not be computed. The underlying captures are shown. Review cannot be completed until computation succeeds.',
    sourceLine: 'L26666',
  },
  {
    id: 'FB-DOH-IMPORT-007',
    title: 'a bulk import or file upload fails.',
    firstFallback:
      'Reject the file with a per-row, per-column error report the user can download, and write nothing.',
    fallbackFailure:
      "Onboarding assistance from the client's onboarding operation, which is where per-tenant column mapping is handled outside the platform.",
    terminalSafeState:
      "No records created; the tenant's existing data is untouched; the failed attempt is recorded.",
    userCommunication:
      'The file was not imported. 14 of 212 rows failed validation. Download the error report.',
    sourceLine: 'L26698',
  },
  {
    id: 'FB-DOH-STATE-008',
    title: 'tenant state cannot be read or is stale.',
    firstFallback:
      'Serve from the last known state with its age, provided the age is inside tolerance.',
    fallbackFailure:
      'Read-only for the tenant, which is the hard-suspension class, with the completion pipeline preserved so in-flight runs can still complete, capture, sync, compute Summaries and close.',
    terminalSafeState:
      'Read-only with the completion pipeline open. The floor completes what it started and starts nothing new.',
    userCommunication:
      'The Tenant Admin banner names the applied class and states that it is a precaution pending state confirmation, so a tenant in good standing is not told it is suspended.',
    sourceLine: 'L26730',
  },
  {
    id: 'FB-DOH-EXPORT-009',
    title: 'an export fails.',
    firstFallback:
      'Retry with a narrower date or entity filter, suggested to the user with the specific narrower range.',
    fallbackFailure: 'Render the data on screen with pagination so the evidence is at least viewable.',
    terminalSafeState:
      'No file produced, and the user is told plainly that no file was produced. A partial file is never offered.',
    userCommunication:
      'The export did not complete. No file has been produced. Try a narrower date range, or request a background export.',
    sourceLine: 'L26762',
  },
  {
    id: 'FB-DOH-SCHED-010',
    title: 'a scheduled platform job misfires.',
    firstFallback:
      'Immediate backfill of the missed occurrence with its original due time preserved on the record.',
    fallbackFailure:
      'For the run auto-close scheduler specifically, the run remains in `complete` and stays open to late data rather than finishing; extending a window is safe, shortening it is not.',
    terminalSafeState:
      'Records remain in their current state, visibly overdue, rather than being advanced on incomplete information.',
    userCommunication:
      "This summary's finish window has been extended because the automatic close was delayed. Late data is still being accepted.",
    sourceLine: 'L26794',
  },
] as const satisfies readonly FallbackPattern[]

// Same compile-time exhaustiveness shape as `ROLES` and `PERMISSION_OUTCOMES`:
// fails to compile if `FallbackPatternId` gains a member the array does not
// list. `as const satisfies` keeps every `id` narrowed to the literal, so
// this check is real rather than a widened `string` comparison.
type MissingFromPatterns = Exclude<FallbackPatternId, (typeof FALLBACK_PATTERNS)[number]['id']>
const _patternsExhaustive: MissingFromPatterns extends never ? true : never = true
void _patternsExhaustive

const BY_ID = new Map<FallbackPatternId, FallbackPattern>(
  FALLBACK_PATTERNS.map((p) => [p.id, p]),
)

/**
 * The one lookup. Throws on an unknown identifier rather than returning
 * `undefined`, because §19.2's contract is that a module NAMES a pattern —
 * a module naming a pattern that does not exist is a defect in that module,
 * not a degraded mode of this register.
 */
export function fallbackPattern(id: FallbackPatternId): FallbackPattern {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown Hub fallback pattern: ${id}`)
  return found
}

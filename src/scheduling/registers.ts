/**
 * THE SCHEDULED-WORK REGISTERS — six of them, and FOUR key spaces sharing the
 * `SCHED-` prefix where the source says there are two.
 *
 * ── COUNTED BY READING TO WHERE EACH BODY STOPS ────────────────────────────
 * Chapter 45A owns scheduled work and holds FOUR of the six registers, across
 * five tables — its coverage-and-gap register is one register in two tables.
 * The other two share the prefix from outside the chapter:
 *
 *   1. §45A.2 the Scheduled-Work Coverage and Gap Register, in two tables over
 *      ONE key space. Table A, identity and mechanism: header L98339, separator
 *      L98340, body L98341-L98375, THIRTY-FIVE rows `SCHED-001`..`SCHED-035`,
 *      fifteen columns. Table B, consequence and control: header L98379, body
 *      L98381-L98415, THE SAME THIRTY-FIVE IDENTIFIERS AGAIN in nineteen
 *      columns. A second view, not a second register, so they are declared once.
 *   2. §45A.3 the do-not-use-cron register. Header L98483, body
 *      L98485-L98506. TWENTY-TWO rows, `DNC-01`..`DNC-22`.
 *   3. §45A.4.1 the anchored timer register. Header L98582, body
 *      L98584-L98618. THIRTY-FIVE rows, and they are keyed by TIMER NAME —
 *      no `SCHED-*` identifier appears in it at all. It holds the same number
 *      of rows as §45A.2 and is a different register; a count alone cannot tell
 *      them apart, which is why the key shape is asserted instead.
 *   4. §45A.17.1 the deployable register. Header L102394, body
 *      L102396-L102419. TWENTY-FOUR rows, keyed by mnemonic.
 *   5. §54.7 Matrix 14, three blocks over one key space. Block A header
 *      L117890, body L117892-L117915; block B body L117923-L117946; block C
 *      body L117954-L117977. TWENTY-FOUR rows, `SCHED-01`..`SCHED-24`.
 *   6. §30A.3 the seven carried schedules. Header L66408, body L66410-L66416.
 *      SEVEN rows, `SCHED-QUAL-EXPIRY-001` and six more.
 *
 * Two enumerations that are not tables are carried too, because the cards cite
 * them by number: §45A.4.2's THIRTEEN candidate groups (L98699-L98723, odd
 * lines) and §45A.4.3's EIGHT standing prohibitions (L98798-L98812, even
 * lines). The eight is the source's own count and it agrees with the
 * enumeration — L98835 and L98845 both say "each of the eight prohibitions".
 *
 * ── THE ONE THING IN THIS FILE THE SOURCE DOES NOT SAY ─────────────────────
 * L102392 states, in its own words, that "two numbering schemes exist" and
 * reconciles them: §45A.2's numbered findings and §45A.17.1's mnemonic
 * commitments. That statement is correct about the two it names and it is not
 * the whole census. FOUR distinct key spaces carry the `SCHED-` prefix:
 *
 *   - `SCHED-001`..`SCHED-035`   §45A.2, discovery findings
 *   - `SCHED-RUN-AUTOCLOSE`, …   §45A.17.1, deployable commitments
 *   - `SCHED-01`..`SCHED-24`     §54.7 Matrix 14, Schedule Definitions
 *   - `SCHED-QUAL-EXPIRY-001`, … §30A.3, the seven carried schedules
 *
 * The fourth is governed: L102537 says "Chapters 27 and 30A use short mnemonic
 * forms of the same obligations for narrative readability" and that the
 * deployable register is authoritative where they differ. §30A.3 is in chapter
 * 30A, so that rule reaches it and it is narrative shorthand by the source's
 * own ruling.
 *
 * THE THIRD IS NOT GOVERNED BY ANYTHING. Chapter 45A never names Matrix 14 or
 * §54.7 anywhere in L97959-L103156, and §54.7 never names chapter 45A. Matrix
 * 14 is not narrative shorthand either: it mints its own `SCHED-` definition at
 * L117845, assigns each row a `REQ-*` requirement, a non-human identity, a
 * workflow, a fallback contract and a decision, and L117841 states its own
 * provenance as "at least twenty-four distinct time triggers" from the
 * Statement of Work. It is a register that does not know the other registers
 * exist — the same shape as `DEC-SCHED-002` against `DEC-SCHED-MISFIRE-001`,
 * measured the same way. `src/scheduling/crosswalk.ts` carries what it
 * contradicts and settles none of it.
 *
 * ── WHY A BARE `SCHED-*` LITERAL CANNOT BE USED HERE ───────────────────────
 * Because `SCHED-01` is a PREFIX of `SCHED-010` through `SCHED-019`, and both
 * are real identifiers of different things: `SCHED-01` is the per-shift digest
 * (L117892) and `SCHED-010` is the schedule visibility horizon (L98350). A
 * substring match, a `startsWith`, or a regex without a boundary silently
 * conflates them, and this build's catalogue of gates that could not fail
 * already holds `Allowed` being a prefix of `Allowed with conditions`.
 *
 * So `ScheduleKey` is a branded string and `scheduleKey` is its only producer.
 * It takes the KEY SPACE FIRST and narrows the permitted identifier to that
 * space's own range, exactly as `notificationKey` does in
 * `src/registry/signals.ts` for the `NOTIF-*` collision. There is deliberately
 * no function in this file that accepts a bare `SCHED-*` string.
 *
 * This module is data. It computes nothing and decides nothing.
 */

/**
 * The four key spaces, named for the section that mints each. Lowercase on
 * purpose: an uppercase token would read as a frozen-source identifier to
 * every citation gate in this tree, and none of these four is one.
 */
export const SCHEDULE_KEY_SPACES = [
  'ch-45a.2-discovery',
  'ch-45a.17.1-deployable',
  'ch-54.7-matrix-14',
  'ch-30a.3-carried',
] as const

export type ScheduleKeySpace = (typeof SCHEDULE_KEY_SPACES)[number]

/** §45A.2's thirty-five findings. Body L98341-L98375. */
export type DiscoveryFindingId =
  | 'SCHED-001'
  | 'SCHED-002'
  | 'SCHED-003'
  | 'SCHED-004'
  | 'SCHED-005'
  | 'SCHED-006'
  | 'SCHED-007'
  | 'SCHED-008'
  | 'SCHED-009'
  | 'SCHED-010'
  | 'SCHED-011'
  | 'SCHED-012'
  | 'SCHED-013'
  | 'SCHED-014'
  | 'SCHED-015'
  | 'SCHED-016'
  | 'SCHED-017'
  | 'SCHED-018'
  | 'SCHED-019'
  | 'SCHED-020'
  | 'SCHED-021'
  | 'SCHED-022'
  | 'SCHED-023'
  | 'SCHED-024'
  | 'SCHED-025'
  | 'SCHED-026'
  | 'SCHED-027'
  | 'SCHED-028'
  | 'SCHED-029'
  | 'SCHED-030'
  | 'SCHED-031'
  | 'SCHED-032'
  | 'SCHED-033'
  | 'SCHED-034'
  | 'SCHED-035'

/** §45A.17.1's twenty-four commitments. Body L102396-L102419. */
export type DeployableObligationId =
  | 'SCHED-RUN-AUTOCLOSE'
  | 'SCHED-QUAL-WARN'
  | 'SCHED-QUAL-ACK'
  | 'SCHED-DIGEST'
  | 'SCHED-NOSHOW-ALERT'
  | 'SCHED-NOSHOW-CANCEL'
  | 'SCHED-HANDOFF'
  | 'SCHED-HANDOFF-GRACE'
  | 'SCHED-GATE-TIMEOUT'
  | 'SCHED-CRIT-RENOTIFY'
  | 'SCHED-PROPOSAL-STALE'
  | 'SCHED-CONNECTIVITY'
  | 'SCHED-USAGE-LADDER'
  | 'SCHED-SUSPEND-SOFT'
  | 'SCHED-SUSPEND-HARD'
  | 'SCHED-PILOT-EXPIRY'
  | 'SCHED-TIERING'
  | 'SCHED-ANONYMISE'
  | 'SCHED-DRIFT-CANARY'
  | 'SCHED-REPORT-DELIVERY'
  | 'SCHED-COMMAND-AGE'
  | 'SCHED-TRACE-RETENTION'
  | 'SCHED-BACKUP'
  | 'SCHED-DB-MAINT'

/** §54.7 Matrix 14's twenty-four Schedule Definitions. Block A L117892-L117915. */
export type Matrix14ScheduleId =
  | 'SCHED-01'
  | 'SCHED-02'
  | 'SCHED-03'
  | 'SCHED-04'
  | 'SCHED-05'
  | 'SCHED-06'
  | 'SCHED-07'
  | 'SCHED-08'
  | 'SCHED-09'
  | 'SCHED-10'
  | 'SCHED-11'
  | 'SCHED-12'
  | 'SCHED-13'
  | 'SCHED-14'
  | 'SCHED-15'
  | 'SCHED-16'
  | 'SCHED-17'
  | 'SCHED-18'
  | 'SCHED-19'
  | 'SCHED-20'
  | 'SCHED-21'
  | 'SCHED-22'
  | 'SCHED-23'
  | 'SCHED-24'

/** §30A.3's seven carried schedules. Body L66410-L66416. */
export type CarriedScheduleId =
  | 'SCHED-QUAL-EXPIRY-001'
  | 'SCHED-FINISH-001'
  | 'SCHED-PLATMAINT-001'
  | 'SCHED-ESCTIMER-001'
  | 'SCHED-OFFTRUST-001'
  | 'SCHED-REPORT-001'
  | 'SCHED-HANDOFF-001'

/** Which identifiers a key space admits. `SCHED-01` exists in exactly one. */
export type ScheduleIdOf<S extends ScheduleKeySpace> = S extends 'ch-45a.2-discovery'
  ? DiscoveryFindingId
  : S extends 'ch-45a.17.1-deployable'
    ? DeployableObligationId
    : S extends 'ch-54.7-matrix-14'
      ? Matrix14ScheduleId
      : CarriedScheduleId

declare const SCHEDULE_KEY: unique symbol

/**
 * A key-space-qualified schedule reference. A `string` at run time — printable,
 * serialisable, usable as a map key — and NOT a string at compile time, because
 * the brand cannot be written by hand. `scheduleKey` is the only producer, so
 * no call site can pass a bare `SCHED-*` literal and no key space can be
 * silently defaulted.
 */
export type ScheduleKey = string & { readonly [SCHEDULE_KEY]: 'schedule' }

/** The only way to obtain a `ScheduleKey`. Key space first, deliberately. */
export function scheduleKey<S extends ScheduleKeySpace>(
  space: S,
  id: ScheduleIdOf<S>,
): ScheduleKey {
  return `${space}#${id}` as ScheduleKey
}

/** Splits a key back into its parts. The inverse of `scheduleKey`, and total. */
export function readScheduleKey(key: ScheduleKey): { space: ScheduleKeySpace; id: string } {
  const at = key.indexOf('#')
  return { space: key.slice(0, at) as ScheduleKeySpace, id: key.slice(at + 1) }
}

/* ── register 1 and 2: §45A.2, the discovery sweep ─────────────────────────── */

export interface DiscoveryFinding {
  readonly id: DiscoveryFindingId
  readonly surfaces: string
  readonly modules: string
  /** The "Feature and sub-feature" cell — what the sweep found. */
  readonly subject: string
  /** The "Timing dependency" cell — what the behaviour is anchored to. */
  readonly timingDependency: string
  /** The "Source classification" cell, verbatim, hedges included. */
  readonly sourceClassification: string
  /** The row's own line in the frozen source. */
  readonly line: number
}

/**
 * Thirty-five findings. Table A gives every field below; Table B gives the same
 * thirty-five identifiers nineteen more columns of consequence and control, and
 * is not transcribed here because nothing in this slice reads it.
 */
export const DISCOVERY_FINDINGS = [
  {
    id: 'SCHED-001',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-06',
    subject: 'Run closing lifecycle, finish window',
    timingDependency: 'Window starts at `complete`, default 48 hours, floor 24, ceiling 7 days',
    sourceClassification: '`SoW Fact`',
    line: 98341,
  },
  {
    id: 'SCHED-002',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-06',
    subject: 'Run no-show, supervisor alert',
    timingDependency: "Fifteen minutes after the run's scheduled start",
    sourceClassification: '`SoW Fact`',
    line: 98342,
  },
  {
    id: 'SCHED-003',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-06',
    subject: 'Run no-show, auto-cancel',
    timingDependency: "Thirty minutes after the run's scheduled start",
    sourceClassification: '`SoW Fact`',
    line: 98343,
  },
  {
    id: 'SCHED-004',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-04',
    subject: 'Qualification expiry, warning ladder',
    timingDependency: "Four fixed offsets before each certification's expiry instant",
    sourceClassification: '`SoW Fact`',
    line: 98344,
  },
  {
    id: 'SCHED-005',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-10',
    subject: 'Qualification expiry, escalation',
    timingDependency: 'Default 2 minutes after the supervisor notification, configurable',
    sourceClassification: '`SoW Fact`',
    line: 98345,
  },
  {
    id: 'SCHED-006',
    surfaces: 'Delivery Operations Hub and Frontline',
    modules: 'MOD-DOH-04, MOD-FL-B9',
    subject: 'Clearance duration, lapse',
    timingDependency:
      'Tenant-set duration from grant; block re-applies at the next gate evaluation',
    sourceClassification: '`SoW Fact`',
    line: 98346,
  },
  {
    id: 'SCHED-007',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-03, MOD-DOH-10',
    subject: 'Per-shift digest',
    timingDependency: "Once per Shift, at the Shift's own delivery time, default 06:00",
    sourceClassification: '`SoW Fact`',
    line: 98347,
  },
  {
    id: 'SCHED-008',
    surfaces: 'Client Command Center',
    modules: 'MOD-CC-05, Hub review queue',
    subject: 'Review-queue aging highlights',
    timingDependency: 'Age of the oldest unreviewed Summary',
    sourceClassification: '`SoW Fact`',
    line: 98348,
  },
  {
    id: 'SCHED-009',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-14',
    subject: 'Qualification Calendar, 60-day horizon',
    timingDependency: 'Rolling 60-day forward window',
    sourceClassification: '`SoW Fact`',
    line: 98349,
  },
  {
    id: 'SCHED-010',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-06',
    subject: 'Schedule visibility horizon',
    timingDependency: 'A rolling seven-day view boundary',
    sourceClassification: '`SoW Fact`',
    line: 98350,
  },
  {
    id: 'SCHED-011',
    surfaces: 'Client Command Center and Studio',
    modules: 'MOD-CC-12, MOD-STU-02',
    subject: 'Shift Handoff Agent timer',
    timingDependency: "Offset before each Shift's end time",
    sourceClassification: '`SoW Fact`',
    line: 98351,
  },
  {
    id: 'SCHED-012',
    surfaces: 'Client Command Center',
    modules: 'MOD-CC-12',
    subject: 'Unacknowledged brief grace period',
    timingDependency: 'Thirty minutes after delivery, configurable',
    sourceClassification: '`SoW Fact`',
    line: 98352,
  },
  {
    id: 'SCHED-013',
    surfaces: 'Client Command Center',
    modules: 'MOD-CC-05',
    subject: 'Gate-item timeout and re-route',
    timingDependency: 'Time since the gate item entered the queue',
    sourceClassification: '`SoW Fact`',
    line: 98353,
  },
  {
    id: 'SCHED-014',
    surfaces: 'Client Command Center',
    modules: 'MOD-CC-06',
    subject: 'Lane-B proposal aging',
    timingDependency: 'Thirty days since the proposal was raised',
    sourceClassification: '`SoW Fact`',
    line: 98354,
  },
  {
    id: 'SCHED-015',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-10',
    subject: 'Critical re-notification',
    timingDependency: 'Time since the Critical notification was sent',
    sourceClassification: '`SoW Fact`',
    line: 98355,
  },
  {
    id: 'SCHED-016',
    surfaces: 'Super Admin and Client Command Center',
    modules: 'MOD-SA-01, MOD-CC-02',
    subject: 'Connectivity-loss protocol',
    timingDependency: 'Duration of site-wide connectivity loss',
    sourceClassification: '`SoW Fact`',
    line: 98356,
  },
  {
    id: 'SCHED-017',
    surfaces: 'Client Command Center',
    modules: 'MOD-CC-01',
    subject: 'Board refresh',
    timingDependency: 'A fixed interval per open session',
    sourceClassification: '`SoW Fact`',
    line: 98357,
  },
  {
    id: 'SCHED-018',
    surfaces: 'Frontline',
    modules: 'MOD-FL-A1, MOD-FL-A7',
    subject: 'Offline credential-trust window',
    timingDependency: 'Default about 24 hours from last successful sync, ceiling 72',
    sourceClassification: '`SoW Fact`',
    line: 98358,
  },
  {
    id: 'SCHED-019',
    surfaces: 'Frontline',
    modules: 'MOD-FL-A6',
    subject: 'Clock-skew evaluation',
    timingDependency: 'Default about 5 minutes, ceiling 60',
    sourceClassification: '`SoW Fact`',
    line: 98359,
  },
  {
    id: 'SCHED-020',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-15',
    subject: 'Support-session expiry',
    timingDependency: 'Default two hours from session open, configurable in Settings',
    sourceClassification: '`SoW Fact`',
    line: 98360,
  },
  {
    id: 'SCHED-021',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-15',
    subject: 'Compliance-emergency session expiry',
    timingDependency: 'The session is time-boxed and scope-declared before it opens',
    sourceClassification: '`SoW Fact` for the existence of a time box; the value is absent',
    line: 98361,
  },
  {
    id: 'SCHED-022',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-09',
    subject: 'Non-payment suspension evaluation',
    timingDependency: 'Day counts from the commercial trigger',
    sourceClassification: '`SoW Fact`',
    line: 98362,
  },
  {
    id: 'SCHED-023',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-09',
    subject: 'Pilot term expiry',
    timingDependency: 'Days since pilot start',
    sourceClassification: '`SoW Fact`',
    line: 98363,
  },
  {
    id: 'SCHED-024',
    surfaces: 'Client Command Center',
    modules: 'MOD-CC-11',
    subject: 'Scheduled report delivery',
    timingDependency: 'Per format, to a named recipient set',
    sourceClassification: '`SoW Fact`',
    line: 98364,
  },
  {
    id: 'SCHED-025',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-12',
    subject: 'Usage ladder and allocation period',
    timingDependency: 'Monthly allocation period with three thresholds and a burst-entry event',
    sourceClassification: '`SoW Fact`',
    line: 98365,
  },
  {
    id: 'SCHED-026',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-17',
    subject: 'Storage tiering scheduler',
    timingDependency: "Data age against the tenant's horizon, default 15 years",
    sourceClassification: '`SoW Fact`',
    line: 98366,
  },
  {
    id: 'SCHED-027',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-17',
    subject: 'Anonymisation scheduler',
    timingDependency: 'Twenty-four months, never in Regulated-Industry mode',
    sourceClassification: '`SoW Fact`',
    line: 98367,
  },
  {
    id: 'SCHED-028',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-06',
    subject: 'Trace retention',
    timingDependency: 'Trace age',
    sourceClassification: '`SoW Fact`',
    line: 98368,
  },
  {
    id: 'SCHED-029',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-05',
    subject: 'Drift canary',
    timingDependency: 'Evaluation-suite staleness against the last successful run',
    sourceClassification: '`SoW Fact` for the canary; the cadence is absent',
    line: 98369,
  },
  {
    id: 'SCHED-030',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-07, MOD-SA-14',
    subject: 'Maintenance windows and notices',
    timingDependency: 'Calendar window boundary',
    sourceClassification: '`SoW Fact` for the calendar; cadence and duration absent',
    line: 98370,
  },
  {
    id: 'SCHED-031',
    surfaces: 'Delivery Operations Hub and Studio',
    modules: 'MOD-STU-12, MOD-DOH-05',
    subject: 'Notified-class adoption window',
    timingDependency: 'One shift from publication, configurable',
    sourceClassification: '`SoW Fact`',
    line: 98371,
  },
  {
    id: 'SCHED-032',
    surfaces: 'Super Admin',
    modules: 'MOD-SA-17',
    subject: 'Archival reactivation windows',
    timingDependency: 'Months since archival',
    sourceClassification: '`SoW Fact`',
    line: 98372,
  },
  {
    id: 'SCHED-033',
    surfaces: 'Delivery Operations Hub',
    modules: 'MOD-DOH-06, MOD-DOH-08',
    subject: 'Late-capture acceptance boundary',
    timingDependency: 'The same window as `SCHED-001`',
    sourceClassification: '`SoW Fact`',
    line: 98373,
  },
  {
    id: 'SCHED-034',
    surfaces: 'Super Admin and Frontline',
    modules: 'MOD-SA-13, MOD-FL-A1',
    subject: 'Application-version floor',
    timingDependency:
      'Device contact time measured against the current application-version floor',
    sourceClassification: '`SoW Fact` for the floor; enforcement timing absent',
    line: 98374,
  },
  {
    id: 'SCHED-035',
    surfaces: 'Super Admin and Frontline',
    modules: 'MOD-SA-13',
    subject: 'Sync-then-wipe pending command',
    timingDependency: 'Pending-command age since the wipe was authorised',
    sourceClassification: '`SoW Fact` for sync-then-wipe; the pending lifetime is absent',
    line: 98375,
  },
] as const satisfies readonly DiscoveryFinding[]

/* ── register 3: §45A.3, the do-not-use-cron register ─────────────────────── */

export interface DoNotUseCronRow {
  readonly id: string
  readonly functionality: string
  readonly whereItLives: string
  /** The "The correct mechanism" cell. */
  readonly correctMechanism: string
  /**
   * The "What a sweeper may still legitimately do" cell. This column is what
   * makes the register usable rather than absolute: a sweeper is prohibited
   * from BEING the control and is often permitted to observe or tidy after it.
   */
  readonly sweeperMayStill: string
  readonly line: number
}

/** Twenty-two prohibitions. Body L98485-L98506. */
export const DO_NOT_USE_CRON = [
  {
    id: 'DNC-01',
    functionality: 'Role and permission enforcement on every interactive business action',
    whereItLives: 'All five surfaces',
    correctMechanism:
      'Action-time deterministic validation of role, scope and session on every request',
    sweeperMayStill: 'Detect and report accounts whose grants look anomalous',
    line: 98485,
  },
  {
    id: 'DNC-02',
    functionality: 'Qualification gate at assignment, run start and gated screens',
    whereItLives: 'Hub, Frontline',
    correctMechanism: 'Action-time validation, enforced at step level on the device',
    sweeperMayStill: 'Warn at 14, 7, 1 and 0 days and escalate an unacknowledged warning',
    line: 98486,
  },
  {
    id: 'DNC-03',
    functionality: 'Clearance validity and its expiry',
    whereItLives: 'Frontline',
    correctMechanism:
      'Device-local signed timer; the block re-applies at the next gate evaluation',
    sweeperMayStill: 'Record lapse centrally and surface the pattern in Super Admin',
    line: 98487,
  },
  {
    id: 'DNC-04',
    functionality: 'Specification gates and severity classification',
    whereItLives: 'Frontline',
    correctMechanism: 'On-device deterministic evaluation from the version-pinned package',
    sweeperMayStill: 'Mirror and confirm server-side, never trigger',
    line: 98488,
  },
  {
    id: 'DNC-05',
    functionality: 'The Severity 1 automatic lot freeze',
    whereItLives: 'Frontline, then propagation',
    correctMechanism:
      'Local placement at classification, then honest propagation states to sibling devices at their next sync',
    sweeperMayStill: 'Measure and report propagation lag as telemetry',
    line: 98489,
  },
  {
    id: 'DNC-06',
    functionality: 'Lot release',
    whereItLives: 'Command Center',
    correctMechanism: 'A governed manual operation, action ten of the closed set',
    sweeperMayStill: 'Remind that a hold is outstanding; never release',
    line: 98490,
  },
  {
    id: 'DNC-07',
    functionality: 'The evaluation gate',
    whereItLives: 'Super Admin, Studio',
    correctMechanism: 'An enforced invariant checked at enablement and publication',
    sweeperMayStill: 'Re-run the suite on cadence as the drift canary',
    line: 98491,
  },
  {
    id: 'DNC-08',
    functionality: 'Studio approval chain of Author, Reviewer and Release Authority',
    whereItLives: 'Studio',
    correctMechanism: 'Governed manual operations with segregation of duties',
    sweeperMayStill: 'Age a submission visibly and remind the reviewer',
    line: 98492,
  },
  {
    id: 'DNC-09',
    functionality: 'Work-package generation caused by publication',
    whereItLives: 'Studio to Frontline',
    correctMechanism: 'Event-driven generation at publication, delivered at run assignment',
    sweeperMayStill: 'Verify that every published version has a corresponding package',
    line: 98493,
  },
  {
    id: 'DNC-10',
    functionality: 'Tenant isolation',
    whereItLives: 'Every service',
    correctMechanism:
      'Enforcement in every query path, plus the enforced anonymisation invariant on cross-tenant analytics',
    sweeperMayStill: 'Scan for isolation anomalies and alert',
    line: 98494,
  },
  {
    id: 'DNC-11',
    functionality: 'Evidence immutability and append-only corrections',
    whereItLives: 'Hub, Frontline',
    correctMechanism:
      'Write-path enforcement; corrections are append-only annotation records',
    sweeperMayStill: 'Verify hashes and report any anomaly',
    line: 98495,
  },
  {
    id: 'DNC-12',
    functionality: 'Audit completeness under the one-transaction guarantee',
    whereItLives: 'Every service',
    correctMechanism: 'Same-transaction commit of action and audit event',
    sweeperMayStill: 'Reconcile counts and alert on any divergence',
    line: 98496,
  },
  {
    id: 'DNC-13',
    functionality: 'Suspension enforcement on a device',
    whereItLives: 'Frontline',
    correctMechanism:
      'The cache-validity rule evaluated locally, plus the command channel at next sync',
    sweeperMayStill: 'Report devices whose last sync is older than the trust window',
    line: 98497,
  },
  {
    id: 'DNC-14',
    functionality: 'Retention deletion of any kind',
    whereItLives: 'Super Admin',
    correctMechanism:
      'A lifecycle pass that tiers, with legal hold, evidence integrity, privacy, isolation, audit immutability and approved policy checked before any deletion, archival, redaction or pseudonymisation',
    sweeperMayStill: 'Surface upcoming lifecycle events before they run',
    line: 98498,
  },
  {
    id: 'DNC-15',
    functionality: 'Deletion of unsynchronised Frontline evidence or local audit records',
    whereItLives: 'Frontline',
    correctMechanism: 'Eviction only after confirmed server receipt plus an integrity check',
    sweeperMayStill: 'Report storage pressure and pending queue depth',
    line: 98499,
  },
  {
    id: 'DNC-16',
    functionality: 'Artificial-intelligence execution of any queued action',
    whereItLives: 'Agents',
    correctMechanism:
      'Human gate at runtime, or pre-authorised Studio policy approved at publication',
    sweeperMayStill: 'Expire nothing silently; age the item visibly',
    line: 98500,
  },
  {
    id: 'DNC-17',
    functionality: 'Emergency pause and resume',
    whereItLives: 'Super Admin',
    correctMechanism: 'Two distinct governed manual operations',
    sweeperMayStill: 'Report how long a pause has been in force',
    line: 98501,
  },
  {
    id: 'DNC-18',
    functionality: 'Compliance suspension entry and exit',
    whereItLives: 'Super Admin',
    correctMechanism:
      'Governed manual operations with dual authorisation on the emergency path',
    sweeperMayStill: 'List tenants in compliance suspension and their duration',
    line: 98502,
  },
  {
    id: 'DNC-19',
    functionality: 'Support-session authorisation',
    whereItLives: 'Super Admin',
    correctMechanism:
      'Action-time validation on every request inside the session, with the time box as a secondary bound',
    sweeperMayStill: 'Close orphaned session records and report them',
    line: 98503,
  },
  {
    id: 'DNC-20',
    functionality: 'Sync-conflict resolution on an untrusted clock',
    whereItLives: 'Command Center',
    correctMechanism: 'Routing to human review whenever skew exceeds the threshold',
    sweeperMayStill: 'Report skew events and their frequency per device',
    line: 98504,
  },
  {
    id: 'DNC-21',
    functionality: 'Job approval and the creator-cannot-approve rule',
    whereItLives: 'Hub',
    correctMechanism: 'Action-time validation that the approver is not the creator',
    sweeperMayStill: 'Report Jobs waiting in `pending_approval`',
    line: 98505,
  },
  {
    id: 'DNC-22',
    functionality: 'Tenant-Configuration Registry bound enforcement',
    whereItLives: 'Super Admin, Hub',
    correctMechanism: 'Validation at every write path, rejecting outright with the bound stated',
    sweeperMayStill: 'Report configuration drift across tenants',
    line: 98506,
  },
] as const satisfies readonly DoNotUseCronRow[]

/* ── register 4: §45A.4.1, the anchored timer register ─────────────────────── */

export interface AnchoredTimer {
  /** The register is keyed by NAME. No `SCHED-*` identifier appears in it. */
  readonly timer: string
  /** "Value as the source states it", verbatim, hedges and defaults included. */
  readonly value: string
  /** The "Status" cell — the source classification, which is sometimes split. */
  readonly status: string
  /** The "Locator" cell: the Statement of Work sections, not blueprint lines. */
  readonly sowLocator: string
  /** The "Bound stated" cell. `Absent` where the source gives no bound. */
  readonly boundStated: string
  readonly line: number
}

/** Thirty-five timers. Body L98584-L98618. Six columns, uniform throughout. */
export const ANCHORED_TIMERS = [
  {
    timer: 'Qualification-expiry warning ladder',
    value: '14, 7, 1 and 0 days before and at expiry',
    status: '`SoW Fact`',
    sowLocator: '§1.7, §3.6, §4.4.3',
    boundStated: 'Tenants may warn earlier, never later or fewer',
    line: 98584,
  },
  {
    timer: 'Unacknowledged-expiry escalation',
    value: 'Configurable, default 2 minutes, to the Quality Manager',
    status: '`SoW Fact`',
    sowLocator: '§4.4.5',
    boundStated: 'No ceiling stated',
    line: 98585,
  },
  {
    timer: 'Record-finish window',
    value: 'Tenant-configurable, default 48 hours',
    status: '`SoW Fact`',
    sowLocator: '§2.4, §4.6.8',
    boundStated:
      'Floor 24 hours, ceiling 7 days, with the bounds themselves contested under `DEC-FINISH-001`',
    line: 98586,
  },
  {
    timer: 'Run auto-close scheduler',
    value: 'Named as a platform scheduler',
    status: '`SoW Fact`',
    sowLocator: '§4.6.8, §6.2.6, §8.7.1',
    boundStated: 'No cadence stated',
    line: 98587,
  },
  {
    timer: 'Run no-show supervisor alert',
    value: '+15 minutes after scheduled start',
    status: '`SoW Fact`',
    sowLocator: '§2.4, §4.6.4',
    boundStated: 'No configurability stated',
    line: 98588,
  },
  {
    timer: 'Run no-show auto-cancel',
    value: '+30 minutes after scheduled start',
    status: '`SoW Fact`',
    sowLocator: '§2.4, §4.6.4',
    boundStated: 'No configurability stated',
    line: 98589,
  },
  {
    timer: 'Schedule visibility horizon',
    value: 'Today plus 7 days',
    status: '`SoW Fact`',
    sowLocator: '§4.6.2',
    boundStated: 'Not stated as configurable',
    line: 98590,
  },
  {
    timer: 'Per-shift digest delivery',
    value: 'Per Shift, at its own delivery time, default 06:00',
    status: '`SoW Fact`',
    sowLocator: '§4.9.4, Part IX',
    boundStated: 'Composition and times are tenant settings',
    line: 98591,
  },
  {
    timer: 'Review-queue aging highlights',
    value: '24, 48 and 72 hours',
    status: '`SoW Fact`',
    sowLocator: '§4.7.2',
    boundStated: 'No service-level agreement is enforced, deliberately',
    line: 98592,
  },
  {
    timer: 'Qualification Calendar horizon',
    value: 'Next 60 days, tenant-wide',
    status: '`SoW Fact`',
    sowLocator: '§4.4.10',
    boundStated: 'Not stated as configurable',
    line: 98593,
  },
  {
    timer: 'Shift Handoff Agent run time',
    value: 'A configurable period before shift end, defaulting to about 30 minutes',
    status: '`SoW Fact`',
    sowLocator: '§5.2.3, §6.13.1',
    boundStated: 'No bound stated',
    line: 98594,
  },
  {
    timer: 'Unacknowledged-brief grace period',
    value: 'Configurable, default 30 minutes',
    status: '`SoW Fact`',
    sowLocator: '§6.13.3',
    boundStated: 'No ceiling stated',
    line: 98595,
  },
  {
    timer: 'Gate-item timeouts',
    value: '10 minutes at Severity 1, 30 minutes otherwise',
    status: '`SoW Fact`',
    sowLocator: '§6.6.5, §8.7.1',
    boundStated: 'Configurable per severity level',
    line: 98596,
  },
  {
    timer: 'Lane-B stale flag',
    value: '30 days undecided',
    status: '`SoW Fact`',
    sowLocator: '§3.8, §6.7.3',
    boundStated: 'Never expires, by rule',
    line: 98597,
  },
  {
    timer: 'Critical re-notification',
    value: '4 hours, tightened to 1 hour in Regulated-Industry mode',
    status: '`SoW Fact`',
    sowLocator: '§4.9.3, §10.3',
    boundStated: 'Mode-dependent, no repeat count stated',
    line: 98598,
  },
  {
    timer: 'Connectivity-loss protocol',
    value: '30, 60 and 120 minutes',
    status: '`SoW Fact`',
    sowLocator: '§4.13.1, §6.2.4, §8.7.1',
    boundStated: 'Described as configurable defaults',
    line: 98599,
  },
  {
    timer: 'Command Center board refresh',
    value: 'Default 60 seconds, per-tenant floor 30 seconds',
    status: '`SoW Fact`',
    sowLocator: '§6.2.2, §8.7.1',
    boundStated: 'Faster than default only after validation against scale',
    line: 98600,
  },
  {
    timer: 'Offline credential-trust window',
    value: 'Tenant-set, default approximately 24 hours, platform ceiling 72 hours',
    status: '`SoW Fact`',
    sowLocator: '§7.10.5, §8.13.1',
    boundStated: 'Ceiling 72 hours',
    line: 98601,
  },
  {
    timer: 'Clock-skew threshold',
    value: 'Tenant-set, default approximately 5 minutes, platform ceiling 60 minutes',
    status: '`SoW Fact`',
    sowLocator: '§7.10.4, §8.13.1',
    boundStated: 'Ceiling 60 minutes',
    line: 98602,
  },
  {
    timer: 'Support-session time box',
    value: 'Default two hours, configurable in Settings',
    status: '`SoW Fact`',
    sowLocator: '§8.15.1',
    boundStated: 'No bound on the configurable value stated',
    line: 98603,
  },
  {
    timer: 'Non-payment suspension defaults',
    value: 'Soft at 30 days, hard at 60 days',
    status: '`SoW Fact`',
    sowLocator: '§4.2.3, §8.9.2, Part IX',
    boundStated: "Described as configurable by the client's platform team",
    line: 98604,
  },
  {
    timer: 'Pilot term',
    value: "60 days, extendable to 90 at the client's discretion",
    status: '`SoW Fact`',
    sowLocator: '§4.2.5, §8.9.4',
    boundStated: '90 days is discretionary, not a hard ceiling statement',
    line: 98605,
  },
  {
    timer: 'Scheduled report delivery',
    value: 'Default 06:00 daily, per format, to a named recipient set',
    status: '`SoW Fact`',
    sowLocator: '§4.10.5, §6.12.3',
    boundStated: 'No bound stated',
    line: 98606,
  },
  {
    timer: 'Retention horizon',
    value: 'Default 15 years, per tenant',
    status: '`SoW Fact`',
    sowLocator: '§8.17.1, §10.1',
    boundStated: 'Platform bounds exist and are set in the console; values not stated',
    line: 98607,
  },
  {
    timer: 'Anonymisation horizon',
    value: '24 months for standard commercial tenants; never in Regulated-Industry mode',
    status: '`SoW Fact`',
    sowLocator: '§8.17.4, §10.2',
    boundStated: 'Mode-dependent, carried as `DEC-ANON-001` under no-purge',
    line: 98608,
  },
  {
    timer: 'Trace retention',
    value: "Full traces 24 months; derived decision record for the record's full term",
    status: '`SoW Fact`',
    sowLocator: '§10.4',
    boundStated: 'No configurability stated',
    line: 98609,
  },
  {
    timer: 'Storage-tiering scheduler',
    value: 'Named; moves data past its horizon to archive',
    status: '`SoW Fact` for the scheduler; cadence absent',
    sowLocator: '§8.7.1, §8.17.2',
    boundStated: 'No cadence stated',
    line: 98610,
  },
  {
    timer: 'Drift canary',
    value: 'Re-runs the evaluation suite on cadence, with a named owner from sprint zero',
    status: '`SoW Fact` for the canary; cadence absent',
    sowLocator: '§8.5.3',
    boundStated: 'No cadence stated',
    line: 98611,
  },
  {
    timer: 'Maintenance windows',
    value: 'A calendar that drives maintenance notices',
    status: '`SoW Fact` for the calendar; length, frequency and lead time absent',
    sowLocator: '§8.7.1, §8.14',
    boundStated: 'No values stated',
    line: 98612,
  },
  {
    timer: 'Notified-class adoption window',
    value: 'Default one shift, configurable',
    status: '`SoW Fact`',
    sowLocator: '§5.12.2',
    boundStated: 'No bound stated',
    line: 98613,
  },
  {
    timer: 'Clearance duration',
    value: 'A tenant setting, uniform at tenant level, deliberately not per-user',
    status: '`SoW Fact` for the setting; no default or bound given',
    sowLocator: '§3.6, §4.4.6, §7.13.1',
    boundStated: 'Absent',
    line: 98614,
  },
  {
    timer: 'Run-extension cap',
    value: 'Shift end plus a tenant-set maximum',
    status: '`SoW Fact` for the cap; no default or bound given',
    sowLocator: '§2.4, §4.6.6, Part IX',
    boundStated: 'Absent',
    line: 98615,
  },
  {
    timer: 'Learning-adoption timing',
    value: 'Next sync, or next run boundary as the default',
    status: '`SoW Fact`',
    sowLocator: '§3.8, §5.16.3',
    boundStated: 'Two options, default stated',
    line: 98616,
  },
  {
    timer: 'Usage allocation period',
    value: 'Monthly',
    status: '`SoW Fact`',
    sowLocator: '§4.2.1',
    boundStated: 'Thresholds 80, 100 and 125 percent, per-tenant defaults',
    line: 98617,
  },
  {
    timer: 'Archival reactivation bands',
    value: '0 to 6 months, 6 to 12 months, beyond 12 months',
    status: '`SoW Fact`',
    sowLocator: '§4.2.4, §8.17.5',
    boundStated: 'Three bands, fixed as stated',
    line: 98618,
  },
] as const satisfies readonly AnchoredTimer[]

/* ── register 5: §45A.17.1, the deployable register ────────────────────────── */

export interface DeployableObligation {
  readonly id: DeployableObligationId
  readonly obligation: string
  readonly owningSurface: string
  /** The "Authority class" cell — `A`, `B`, `C`, or `C with hold check`. */
  readonly authorityClass: string
  /** The "Mechanism" cell, as `M5`, `M6` and so on. */
  readonly mechanism: string
  readonly cadence: string
  /** The "Source" cell verbatim, including any decision identifier it names. */
  readonly source: string
  readonly line: number
}

/** Twenty-four commitments. Body L102396-L102419. */
export const DEPLOYABLE_OBLIGATIONS = [
  {
    id: 'SCHED-RUN-AUTOCLOSE',
    obligation: "Finish a `complete` run after the tenant's window",
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'A',
    mechanism: 'M5 woken by M7',
    cadence: 'Completion plus 48 h default, floor 24 h, ceiling 7 days',
    source: '`SoW Fact` §4.6.8, `DEC-FINISH-001`',
    line: 102396,
  },
  {
    id: 'SCHED-QUAL-WARN',
    obligation: 'Qualification expiry warnings',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'A',
    mechanism: 'M5',
    cadence: 'Daily, evaluating 14 / 7 / 1 / 0 days',
    source: '`SoW Fact` §1.7, §3.6',
    line: 102397,
  },
  {
    id: 'SCHED-QUAL-ACK',
    obligation: 'Escalate an unacknowledged expiry notice',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'A',
    mechanism: 'M5',
    cadence: '2 minutes after delivery',
    source: '`SoW Fact` §4.4.5',
    line: 102398,
  },
  {
    id: 'SCHED-DIGEST',
    obligation: 'Per-shift digest',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: "Each Shift's own delivery time, default 06:00",
    source: '`SoW Fact` §4.9.4',
    line: 102399,
  },
  {
    id: 'SCHED-NOSHOW-ALERT',
    obligation: 'Supervisor alert for an unstarted run',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: 'Start plus 15 minutes',
    source: '`SoW Fact` §1.7, §2.4',
    line: 102400,
  },
  {
    id: 'SCHED-NOSHOW-CANCEL',
    obligation: 'Auto-cancel an unstarted run',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'A',
    mechanism: 'M5',
    cadence: 'Start plus 30 minutes',
    source: '`SoW Fact` §1.7, §2.4',
    line: 102401,
  },
  {
    id: 'SCHED-HANDOFF',
    obligation: 'Shift Handoff Agent run',
    owningSurface: 'Delivery Operations Hub with agent execution',
    authorityClass: 'B',
    mechanism: 'M5 or M6',
    cadence: '30 minutes before shift end',
    source: '`SoW Fact` §5.2.3, §6.13.1 (summarised in the numbers canon at §1.7)',
    line: 102402,
  },
  {
    id: 'SCHED-HANDOFF-GRACE',
    obligation: 'Escalate an unacknowledged brief',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'B',
    mechanism: 'M6',
    cadence: '30 minutes after delivery',
    source: '`SoW Fact` §1.7',
    line: 102403,
  },
  {
    id: 'SCHED-GATE-TIMEOUT',
    obligation: 'Escalate an undecided gate item',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'A',
    mechanism: 'M6',
    cadence: '10 min Severity 1, 30 min otherwise',
    source: '`SoW Fact` §1.7, §8.7.1',
    line: 102404,
  },
  {
    id: 'SCHED-CRIT-RENOTIFY',
    obligation: 'Re-notify an unacknowledged Critical',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'A',
    mechanism: 'M6',
    cadence: '4 h, 1 h in Regulated-Industry mode',
    source: '`SoW Fact` §4.9.3',
    line: 102405,
  },
  {
    id: 'SCHED-PROPOSAL-STALE',
    obligation: 'Stale-flag an undecided Lane-B proposal',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: '30 days',
    source: '`SoW Fact` §1.7, §3.8',
    line: 102406,
  },
  {
    id: 'SCHED-CONNECTIVITY',
    obligation: 'Connectivity-loss protocol thresholds',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: '30 / 60 / 120 minutes',
    source: '`SoW Fact` §1.7, §8.1.3',
    line: 102407,
  },
  {
    id: 'SCHED-USAGE-LADDER',
    obligation: 'Usage-ladder threshold evaluation',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'B',
    mechanism: 'M5 or M9',
    cadence: 'Continuous evaluation against the ledger',
    source: '`SoW Fact` §8.12.2',
    line: 102408,
  },
  {
    id: 'SCHED-SUSPEND-SOFT',
    obligation: 'Soft suspension at the non-payment threshold',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'A',
    mechanism: 'M5',
    cadence: 'Default 30 days',
    source: '`SoW Fact` §8.9.2, `DEC-SUSP-001`',
    line: 102409,
  },
  {
    id: 'SCHED-SUSPEND-HARD',
    obligation: 'Hard suspension at the non-payment threshold',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'A',
    mechanism: 'M5',
    cadence: 'Default 60 days',
    source: '`SoW Fact` §8.9.2',
    line: 102410,
  },
  {
    id: 'SCHED-PILOT-EXPIRY',
    obligation: 'Pilot expiry action',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: '60 days, 90 discretionary',
    source: '`SoW Fact` §8.9.4',
    line: 102411,
  },
  {
    id: 'SCHED-TIERING',
    obligation: 'Storage tiering at the horizon',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'C with hold check',
    mechanism: 'M5 issuing M11 transitions',
    cadence: 'Continuous against the 15-year default horizon',
    source: '`SoW Fact` §8.17.1, §8.17.2',
    line: 102412,
  },
  {
    id: 'SCHED-ANONYMISE',
    obligation: 'Worker personal-data anonymisation',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'A',
    mechanism: 'M5, bounded batch',
    cadence: '24 months, never in Regulated-Industry mode',
    source: '`SoW Fact` §8.17.4, `DEC-ANON-001`',
    line: 102413,
  },
  {
    id: 'SCHED-DRIFT-CANARY',
    obligation: 'Re-run the evaluation suite',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'B',
    mechanism: 'M9 or M5',
    cadence: 'Cadence `TBD — Client Decision Required`',
    source: '`SoW Fact` §8.5.3',
    line: 102414,
  },
  {
    id: 'SCHED-REPORT-DELIVERY',
    obligation: 'Scheduled report delivery',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: 'Tenant time, default 06:00',
    source:
      '`SoW Fact` §4.9.4 (summarised in the numbers canon at §1.7), `DEC-REPORT-001`',
    line: 102415,
  },
  {
    id: 'SCHED-COMMAND-AGE',
    obligation: 'Detect undelivered device commands',
    owningSurface: 'Delivery Operations Hub',
    authorityClass: 'B',
    mechanism: 'M5',
    cadence: 'Continuous',
    source: '`Derived Clarification`, `DEC-WIPE-001`',
    line: 102416,
  },
  {
    id: 'SCHED-TRACE-RETENTION',
    obligation: 'Reduce full traces to decision records',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'C',
    mechanism: 'M5',
    cadence: '24 months',
    source: '`SoW Fact` §8.6.3',
    line: 102417,
  },
  {
    id: 'SCHED-BACKUP',
    obligation: 'Scheduled backup and restore rehearsal',
    owningSurface: 'Super Admin platform console',
    authorityClass: 'C',
    mechanism: 'M7',
    cadence: '`TBD — Client Decision Required`, `DEC-SCHED-006`',
    source: '`SoW Fact` §8.7.1 backup status only',
    line: 102418,
  },
  {
    id: 'SCHED-DB-MAINT',
    obligation: 'Database maintenance',
    owningSurface: 'Platform infrastructure',
    authorityClass: 'C',
    mechanism: 'M8 or M10',
    cadence: 'Nightly',
    source: '`Recommendation — R&D`',
    line: 102419,
  },
] as const satisfies readonly DeployableObligation[]

/* ── register 6: §54.7 Matrix 14, the register nothing cross-references ────── */

export interface Matrix14Schedule {
  readonly id: Matrix14ScheduleId
  /** Block A's "Name and trigger" cell. */
  readonly nameAndTrigger: string
  readonly timezoneAnchor: string
  /** Block A's "Requirement" cell — a `REQ-*` identifier per row. */
  readonly requirement: string
  /** Block A's "Role or non-human identity" cell. A FOURTH set of spellings. */
  readonly identity: string
  readonly surfaceAndModule: string
  /** Block A's own line. Blocks B and C repeat the identifier at +31 and +62. */
  readonly line: number
}

/**
 * Twenty-four Schedule Definitions. Block A body L117892-L117915. L117841
 * states the provenance: the Statement of Work "names at least twenty-four
 * distinct time triggers across its numbers canon and its behavioural
 * sections". Nothing in chapter 45A refers to this register and nothing here
 * refers to chapter 45A.
 */
export const MATRIX_14_SCHEDULES = [
  {
    id: 'SCHED-01',
    nameAndTrigger: "Per-shift digest delivery, at the shift's configured time, default 06:00",
    timezoneAnchor: "The Site's timezone, inherited by the Shift",
    requirement: 'REQ-DOH-130',
    identity: 'IDENT-DIGEST-SERVICE, the single digest service',
    surfaceAndModule: 'Delivery Operations Hub, MOD-DOH-10 Notifications',
    line: 117892,
  },
  {
    id: 'SCHED-02',
    nameAndTrigger: 'Qualification-expiry warning evaluation at 14, 7, 1 and 0 days',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-PLAT-271',
    identity: 'IDENT-QUAL-EVALUATOR',
    surfaceAndModule:
      'Delivery Operations Hub, MOD-DOH-04 Worker Lifecycle and Qualifications',
    line: 117893,
  },
  {
    id: 'SCHED-03',
    nameAndTrigger:
      'Qualification-expiry notification acknowledgement timer, 2 minutes to Quality Manager escalation',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-DOH-058',
    identity: 'IDENT-ESCALATION-TIMER',
    surfaceAndModule: 'Delivery Operations Hub, MOD-DOH-10 Notifications',
    line: 117894,
  },
  {
    id: 'SCHED-04',
    nameAndTrigger: 'Run record automatic finish after the tenant window, default 48 hours',
    timezoneAnchor: "The Site's timezone via the shift's nominal date",
    requirement: 'REQ-PLAT-131',
    identity: 'IDENT-RUN-CLOSER',
    surfaceAndModule:
      'Delivery Operations Hub, MOD-DOH-06 Run Scheduling and Execution Oversight',
    line: 117895,
  },
  {
    id: 'SCHED-05',
    nameAndTrigger:
      'Run no-show: supervisor alert at plus 15 minutes, auto-cancel at plus 30 minutes for unstarted runs',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-DOH-090',
    identity: 'IDENT-NOSHOW-WATCHER',
    surfaceAndModule:
      'Delivery Operations Hub, MOD-DOH-06 Run Scheduling and Execution Oversight',
    line: 117896,
  },
  {
    id: 'SCHED-06',
    nameAndTrigger: 'Shift Handoff Agent run, 30 minutes before shift end',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-CC-130',
    identity: 'IDENT-AGENT-HANDOFF, a reasoning agent',
    surfaceAndModule: 'Client Command Center, MOD-CC-12 Shift handoff panel',
    line: 117897,
  },
  {
    id: 'SCHED-07',
    nameAndTrigger: 'Unacknowledged shift-handoff brief grace period, 30 minutes',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-CC-130',
    identity: 'IDENT-ESCALATION-TIMER',
    surfaceAndModule: 'Client Command Center, MOD-CC-12 Shift handoff panel',
    line: 117898,
  },
  {
    id: 'SCHED-08',
    nameAndTrigger:
      'Gate-item timeout, 10 minutes for Severity 1 and 30 minutes for others, configurable per severity level',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-CC-060',
    identity: 'IDENT-GATE-TIMER',
    surfaceAndModule: 'Client Command Center, MOD-CC-05 Governance gate queue',
    line: 117899,
  },
  {
    id: 'SCHED-09',
    nameAndTrigger:
      'Critical re-notification if unacknowledged after 4 hours, 1 hour in Regulated-Industry mode',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-PLAT-311',
    identity: 'IDENT-ESCALATION-TIMER',
    surfaceAndModule: 'Delivery Operations Hub, MOD-DOH-10 Notifications',
    line: 117900,
  },
  {
    id: 'SCHED-10',
    nameAndTrigger: 'Undecided learning proposal stale flag at 30 days',
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-PLAT-301',
    identity: 'IDENT-LEARN-AGEING',
    surfaceAndModule: 'Client Command Center, MOD-CC-06 Learned-change approvals',
    line: 117901,
  },
  {
    id: 'SCHED-11',
    nameAndTrigger: 'Connectivity-loss protocol at 30, 60 and 120 minutes',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-CC-020',
    identity: 'IDENT-CONNECTIVITY-WATCHER',
    surfaceAndModule: 'Client Command Center, MOD-CC-02 Sync state and connectivity',
    line: 117902,
  },
  {
    id: 'SCHED-12',
    nameAndTrigger:
      'Usage-ladder threshold evaluation at 80, 100 and 125 per cent, plus burst entry',
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-SA-120',
    identity: 'IDENT-METER',
    surfaceAndModule: 'Super Admin platform console, MOD-SA-12 Usage and Metering',
    line: 117903,
  },
  {
    id: 'SCHED-13',
    nameAndTrigger: 'Non-payment suspension triggers, soft at 30 days and hard at 60 days',
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-SA-090',
    identity: 'IDENT-LIFECYCLE-WATCHER',
    surfaceAndModule: 'Super Admin platform console, MOD-SA-09 Tenants, Lifecycle and Pilots',
    line: 117904,
  },
  {
    id: 'SCHED-14',
    nameAndTrigger: 'Pilot tenancy expiry at 60 days, 90 discretionary',
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-SA-090',
    identity: 'IDENT-LIFECYCLE-WATCHER',
    surfaceAndModule: 'Super Admin platform console, MOD-SA-09 Tenants, Lifecycle and Pilots',
    line: 117905,
  },
  {
    id: 'SCHED-15',
    nameAndTrigger: 'Support-session time-box expiry, default 2 hours',
    timezoneAnchor: 'Session start timezone',
    requirement: 'REQ-SA-150',
    identity: 'IDENT-SESSION-TIMER',
    surfaceAndModule: 'Super Admin platform console, MOD-SA-15 Support Access',
    line: 117906,
  },
  {
    id: 'SCHED-16',
    nameAndTrigger:
      'Offline credential and clearance trust-window expiry, default approximately 24 hours, ceiling 72 hours',
    timezoneAnchor: 'Device local clock with skew guard',
    requirement: 'REQ-PLAT-203',
    identity: 'IDENT-DEVICE-TRUST-TIMER, running on the device',
    surfaceAndModule: 'Frontline Worker Application, MOD-FL-A6 Offline and Sync Engine',
    line: 117907,
  },
  {
    id: 'SCHED-17',
    nameAndTrigger: "Retention horizon tiering at the tenant's horizon, default 15 years",
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-DLC-010',
    identity: 'IDENT-TIERING-SERVICE',
    surfaceAndModule:
      'Super Admin platform console, MOD-SA-17 Data Lifecycle and Archival',
    line: 117908,
  },
  {
    id: 'SCHED-18',
    nameAndTrigger: 'Worker personal-data anonymisation at 24 months for standard tenants',
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-DLC-020',
    identity: 'IDENT-ANONYMISER',
    surfaceAndModule:
      'Super Admin platform console, MOD-SA-17 Data Lifecycle and Archival',
    line: 117909,
  },
  {
    id: 'SCHED-19',
    nameAndTrigger: 'Orchestrator trace retention expiry at 24 months, platform-internal',
    timezoneAnchor: 'Platform timezone',
    requirement: 'REQ-SA-060',
    identity: 'IDENT-TRACE-REAPER',
    surfaceAndModule: 'Super Admin platform console, MOD-SA-06 Trace Viewer',
    line: 117910,
  },
  {
    id: 'SCHED-20',
    nameAndTrigger: 'Command Center board refresh, default 60 seconds, per-tenant floor 30 seconds',
    timezoneAnchor: 'Viewer session',
    requirement: 'REQ-CC-030',
    identity: 'IDENT-BOARD-REFRESH',
    surfaceAndModule: 'Client Command Center, MOD-CC-01 Live shift board',
    line: 117911,
  },
  {
    id: 'SCHED-21',
    nameAndTrigger: 'Scheduled report delivery at the configured time, default 06:00',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-CC-120',
    identity: 'IDENT-REPORT-SCHEDULER',
    surfaceAndModule:
      'Client Command Center, MOD-CC-11 Standard reports and Custom Report Builder',
    line: 117912,
  },
  {
    id: 'SCHED-22',
    nameAndTrigger: 'Qualification Calendar horizon recompute across 60 days',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-DOH-060',
    identity: 'IDENT-QUAL-EVALUATOR',
    surfaceAndModule: 'Delivery Operations Hub, MOD-DOH-14 Qualification Calendar',
    line: 117913,
  },
  {
    id: 'SCHED-23',
    nameAndTrigger: 'Run schedule visibility horizon of today plus 7 days',
    timezoneAnchor: "The Site's timezone",
    requirement: 'REQ-DOH-090',
    identity: 'IDENT-SCHEDULE-PROJECTOR',
    surfaceAndModule:
      'Delivery Operations Hub, MOD-DOH-06 Run Scheduling and Execution Oversight',
    line: 117914,
  },
  {
    id: 'SCHED-24',
    nameAndTrigger:
      'Archival reactivation window evaluation at 0 to 6, 6 to 12 and beyond 12 months',
    timezoneAnchor: 'Tenant timezone',
    requirement: 'REQ-SA-170',
    identity: 'IDENT-LIFECYCLE-WATCHER',
    surfaceAndModule:
      'Super Admin platform console, MOD-SA-17 Data Lifecycle and Archival',
    line: 117915,
  },
] as const satisfies readonly Matrix14Schedule[]

/* ── the fourth key space: §30A.3, and the source's own ruling on it ───────── */

export interface CarriedSchedule {
  readonly id: CarriedScheduleId
  readonly whatItSchedules: string
  readonly line: number
}

/**
 * Seven rows, header L66408, body L66410-L66416, under the heading "The Seven
 * Carried Schedules and Why Each Uses a Different Mechanism" at L66398. These
 * are the ONE collision the source resolves itself: L102537 rules that
 * "Chapters 27 and 30A use short mnemonic forms of the same obligations for
 * narrative readability" and that where a short form appears there, the
 * deployable register is authoritative. §30A.3 is in chapter 30A, so the rule
 * reaches it. Carried here so a reader searching on one of these identifiers
 * finds the ruling rather than nothing.
 */
export const CARRIED_SCHEDULES = [
  {
    id: 'SCHED-QUAL-EXPIRY-001',
    whatItSchedules:
      "Qualification-expiry warnings at 14, 7, 1 and 0 days before a certification's expiry date",
    line: 66410,
  },
  {
    id: 'SCHED-FINISH-001',
    whatItSchedules:
      "The automatic finish of a run record after the tenant's record-finish window",
    line: 66411,
  },
  {
    id: 'SCHED-PLATMAINT-001',
    whatItSchedules:
      'Platform maintenance windows and the maintenance notices that announce them',
    line: 66412,
  },
  {
    id: 'SCHED-ESCTIMER-001',
    whatItSchedules:
      'The acknowledgement timer that escalates an unacknowledged qualification-expiry notification to the Quality Manager',
    line: 66413,
  },
  {
    id: 'SCHED-OFFTRUST-001',
    whatItSchedules:
      'The offline credential and clearance trust window on a device, default approximately 24 hours with a platform ceiling of 72 hours',
    line: 66414,
  },
  {
    id: 'SCHED-REPORT-001',
    whatItSchedules:
      'Scheduled delivery of a saved report format over the five standard report data sets, default 06:00 daily',
    line: 66415,
  },
  {
    id: 'SCHED-HANDOFF-001',
    whatItSchedules: "The Shift Handoff Agent's brief, by default 30 minutes before shift end",
    line: 66416,
  },
] as const satisfies readonly CarriedSchedule[]

/* ── the two enumerations the cards cite by number ─────────────────────────── */

export interface CandidateGroup {
  readonly group: number
  readonly title: string
  readonly line: number
}

/**
 * Thirteen groups, L98699-L98723 on odd lines. §45A.4.2's own heading at L98691
 * states thirteen and the enumeration is thirteen — the count and the
 * enumeration agree.
 */
export const CANDIDATE_GROUPS = [
  { group: 1, title: 'Identity, authorization, access and security', line: 98699 },
  { group: 2, title: 'Qualifications and workforce readiness', line: 98701 },
  { group: 3, title: 'Delivery Operations Hub operational timing', line: 98703 },
  { group: 4, title: 'Standards and Operations Studio timing', line: 98705 },
  { group: 5, title: 'Client Command Center timing', line: 98707 },
  { group: 6, title: 'Frontline local timing', line: 98709 },
  { group: 7, title: 'Notifications, reminders, tasks and escalations', line: 98711 },
  { group: 8, title: 'Super Admin and platform controls', line: 98713 },
  { group: 9, title: 'Artificial intelligence and agent timing', line: 98715 },
  { group: 10, title: 'Data pipeline, analytics, activity and productivity', line: 98717 },
  { group: 11, title: 'Audit, compliance, retention, backup and recovery', line: 98719 },
  { group: 12, title: 'Platform and infrastructure operations', line: 98721 },
  { group: 13, title: 'Integrations', line: 98723 },
] as const satisfies readonly CandidateGroup[]

export interface StandingProhibition {
  readonly number: number
  readonly rule: string
  readonly line: number
}

/**
 * Eight prohibitions, L98798-L98812 on even lines, under §45A.4.3 at L98790.
 * THESE ARE NOT THE TWENTY-TWO `DNC-*` CONTROLS. The two enumerations answer
 * different questions — a `DNC-` row says a named functionality must not be
 * driven by a sweeper, a prohibition says what no timer may ever do — and the
 * `SCHED-*` cards in §45A.8 cite these by bare number ("Prohibitions: 1, 2,
 * 4"), so reading those numbers against the twenty-two would name the wrong
 * rule every time. L98835 and L98845 both call them "the eight prohibitions".
 */
export const STANDING_PROHIBITIONS = [
  { number: 1, rule: 'a schedule never replaces an action-time check', line: 98798 },
  { number: 2, rule: 'a schedule never grants', line: 98800 },
  { number: 3, rule: 'publication is event-driven and gated', line: 98802 },
  {
    number: 4,
    rule: 'the Frontline application runs no central server scheduled work while offline',
    line: 98804,
  },
  { number: 5, rule: 'a notification is never the business action', line: 98806 },
  {
    number: 6,
    rule: 'scheduled artificial-intelligence output stays advisory or derived',
    line: 98808,
  },
  { number: 7, rule: 'retention is never an unconditional deletion timer', line: 98810 },
  {
    number: 8,
    rule: 'unsynchronised Frontline evidence and local audit records are never deleted on age alone',
    line: 98812,
  },
] as const satisfies readonly StandingProhibition[]

/* ── the denominator, per register, and the one count that disagrees ───────── */

export interface RegisterCensus {
  /** The key space this register belongs to, or `null` where it has none. */
  readonly keySpace: ScheduleKeySpace | null
  readonly register: string
  readonly section: string
  /** Rows counted by reading to where the body stops. */
  readonly counted: number
  /**
   * What the source states beside the enumeration, where it states anything.
   * `null` means the source gives no count for this register and the counted
   * figure is the only one there is.
   */
  readonly stated: number | null
  /** Where the stated figure is written, or where the body ends. */
  readonly line: number
}

/**
 * THE TRUE DENOMINATOR for the scheduled-work inventory. Every figure below was
 * counted by reading to where the body stops, and every register says which key
 * space it belongs to — the anchored timer register belongs to none, because it
 * is keyed by timer name and carries no `SCHED-*` identifier at all.
 *
 * WHERE THE SOURCE STATES A COUNT IT AGREES WITH THE ENUMERATION, except in one
 * place inside §45A.17.2, and there the source disagrees with ITSELF: L102467
 * says "Fourteen of the thirty-five findings resolve to 'not a scheduled
 * obligation'" and L102486 repeats fourteen, while L102535 says "35 numbered
 * findings resolve to 22 mapped obligations and 13 classified as not scheduled
 * obligations". The enumeration is thirteen. `NOT_AN_OBLIGATION_COUNT` in
 * `crosswalk.ts` carries both figures and the resolution rows are the evidence.
 */
export const SCHEDULED_WORK_CENSUS = [
  {
    keySpace: 'ch-45a.2-discovery',
    register: 'Scheduled-Work Coverage and Gap Register, Table A — identity and mechanism',
    section: '45A.2',
    counted: 35,
    stated: null,
    line: 98375,
  },
  {
    keySpace: 'ch-45a.2-discovery',
    register: 'the same register, Table B — consequence and control',
    section: '45A.2',
    counted: 35,
    stated: null,
    line: 98415,
  },
  {
    keySpace: null,
    register: 'Do-Not-Use-Cron Register',
    section: '45A.3',
    counted: 22,
    stated: null,
    line: 98506,
  },
  {
    keySpace: null,
    register: 'The Anchored Timer Register — keyed by timer name, not by identifier',
    section: '45A.4.1',
    counted: 35,
    stated: null,
    line: 98618,
  },
  {
    keySpace: null,
    register: 'The Thirteen Candidate Groups, Swept',
    section: '45A.4.2',
    counted: 13,
    stated: 13,
    line: 98691,
  },
  {
    keySpace: null,
    register: 'The Standing Prohibitions',
    section: '45A.4.3',
    counted: 8,
    stated: 8,
    line: 98845,
  },
  {
    keySpace: 'ch-45a.17.1-deployable',
    register: 'the deployable register — one row per commitment',
    section: '45A.17.1',
    counted: 24,
    stated: 24,
    line: 102535,
  },
  {
    keySpace: 'ch-54.7-matrix-14',
    register: 'Matrix 14 blocks A, B and C — Schedule Definitions, one key space',
    section: '54.7',
    counted: 24,
    stated: null,
    line: 117915,
  },
  {
    keySpace: 'ch-30a.3-carried',
    register: 'The Seven Carried Schedules — narrative short forms, ruled non-authoritative',
    section: '30A.3',
    counted: 7,
    stated: 7,
    line: 66398,
  },
] as const satisfies readonly RegisterCensus[]

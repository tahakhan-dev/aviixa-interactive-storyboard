/**
 * The scheduled-work spine's public surface.
 *
 * EVERY RE-EXPORT IS NAMED. No `export *` anywhere, for a measured reason: star
 * re-exports through a barrel do not resolve in this build's knowledge graph, so
 * "who uses X" is already incomplete for everything exported via
 * `src/ui/primitives/index.ts`. A named list costs a line per symbol and keeps
 * the graph able to answer.
 *
 * Task 7 owns `src/scheduling/permissions.ts` if it needs a home here. When it
 * lands, its exports are added below by whoever owns this file.
 */

export {
  ANCHORED_TIMERS,
  CANDIDATE_GROUPS,
  CARRIED_SCHEDULES,
  DEPLOYABLE_OBLIGATIONS,
  DISCOVERY_FINDINGS,
  DO_NOT_USE_CRON,
  MATRIX_14_SCHEDULES,
  SCHEDULED_WORK_CENSUS,
  SCHEDULE_KEY_SPACES,
  STANDING_PROHIBITIONS,
  readScheduleKey,
  scheduleKey,
} from './registers'

export type {
  AnchoredTimer,
  CandidateGroup,
  CarriedSchedule,
  CarriedScheduleId,
  DeployableObligation,
  DeployableObligationId,
  DiscoveryFinding,
  DiscoveryFindingId,
  DoNotUseCronRow,
  Matrix14Schedule,
  Matrix14ScheduleId,
  RegisterCensus,
  ScheduleIdOf,
  ScheduleKey,
  ScheduleKeySpace,
  StandingProhibition,
} from './registers'

export {
  CARD_VERSUS_CROSSWALK,
  CROSSWALK,
  DEC_SCHED_011_INDEPENDENCE,
  DNC_COVERAGE_OF_THE_SIX,
  INDEPENDENT_PROVENANCE,
  MATRIX_14_UNRECONCILED,
  NOT_AN_OBLIGATION,
  NOT_AN_OBLIGATION_COUNT,
  OBLIGATIONS_ABSENT_FROM_MATRIX_14,
  RECONCILIATION,
  findingsFor,
  resolveFinding,
} from './crosswalk'

export type {
  CardAgainstCrosswalk,
  CrosswalkRow,
  Matrix14Conflict,
  Resolution,
} from './crosswalk'

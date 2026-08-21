import { fixedClock } from '@/domain/clock'
import type { Clock } from '@/domain/clock'
import { reviewAgingBand, type AgingBand } from '@/surfaces/doh/transitions'
import type { AnomalyRecord, ExecutionSummaryRecord } from '@/surfaces/doh/objects'

/**
 * MOD-DOH-08's seed, and the route's contract with the reach generator.
 *
 * ── WHY `CONTROL_MATRIX` IS RE-EXPORTED FROM HERE ─────────────────────────
 * `scripts/build-doh-module-reach.mjs` finds each module's matrix at
 * `app/hub/<slug>/fixtures.ts` off that module's own `slug` and refuses to
 * write a reach map it cannot find one for. The matrix itself is source-
 * derived surface data and lives in `@/surfaces/doh/modules/doh-08/matrix`;
 * this line is the generator's entry point to it, so the day `MOD-DOH-08`
 * lands in `DOH_MODULES` the generator works with no further edit.
 *
 * IT DOES NOT WORK TODAY, AND THAT IS NOT THIS FILE'S DOING. `MOD-DOH-08` is
 * still in `DOH_OUT_OF_SLICE_MODULES`, so the generator never asks for this
 * module and `registries/generated/doh/module-reach.json` carries no entry for
 * it. Moving it is an edit to `src/surfaces/doh/modules.ts`, which this task
 * may not make. Reported, not worked around: nothing here hand-writes a rail
 * or a reach set to paper over it.
 */
export { CONTROL_MATRIX } from '@/surfaces/doh/modules/doh-08/matrix'

export const SCREEN_TITLE = 'Execution Summary review'

/**
 * THE ROUTE SEGMENT, AND THE CONVENTION IT BREAKS.
 *
 * Every other Hub route's slug is the kebab-cased module name. This module is
 * "Execution Summary Review and Distribution", so that convention would give
 * `/hub/execution-summary-review-and-distribution`, and the route is
 * `/hub/execution-summary-review`. Four reasons, in the order they decided it:
 *
 * 1. The route IS `SCR-DOH-16`, the Execution Summary review queue (L48110),
 *    whose navigation entry is "Operations home, quality group" — a route of
 *    its own. `SCR-DOH-17` is entered from "Review queue" (L48111) and is a
 *    sub-view, not a second route. A segment naming the screen the route
 *    mounts is the same thing every other slug happens to be, because on every
 *    other module the module name and the screen subject are the same words.
 * 2. "and Distribution" names the export, rows 12 and 13 — and the export is
 *    not a screen. Catalogue B puts it inside `SCR-DOH-17` ("Review one
 *    Summary, disposition anomalies, export"), and bulk distribution is
 *    deferred beyond V1 (L28312). A URL segment naming a capability the route
 *    does not separately expose is worse than one naming what the route is.
 * 3. The convention is already "the module name, minus what does not belong in
 *    a URL", not a transliteration: `MOD-DOH-12` is "Integration Surface
 *    (Tenant Side)" and its slug is `integration-surface`.
 * 4. `DohModuleDefinition.slug` states its own rule — "URL segment under
 *    `/hub/`, unique, never a bare number" — and this satisfies it. The
 *    module-name convention is observed, not stated, and this is the one
 *    module where observing it and naming the screen disagree.
 *
 * Disclosed rather than assumed: the break is real, this is where it is
 * recorded, and the slug the eventual `DOH_MODULES` row must carry is this one.
 */
export const ROUTE_SLUG = 'execution-summary-review'
export const ROUTE_PATH = `/hub/${ROUTE_SLUG}`

/** Catalogue B's two rows for this module, by id and locator. */
export const QUEUE_SCREEN_ID = 'SCR-DOH-16'
export const DETAIL_SCREEN_ID = 'SCR-DOH-17'

/**
 * Determinism: one fixed clock, and every queued-at below is an offset from
 * it. Nothing in this module reads the wall clock.
 */
export const AS_OF_MS = Date.UTC(2026, 7, 14, 12, 0, 0)
export const REVIEW_CLOCK: Clock = fixedClock(AS_OF_MS)

const HOUR = 60 * 60 * 1000

export interface QueueItem {
  readonly summary: ExecutionSummaryRecord
  readonly runLabel: string
  readonly areaId: string
  /** When the Summary entered the queue. The band is DERIVED from it. */
  readonly queuedAtMs: number
  readonly reviewState: 'unreviewed' | 'in_review' | 'reviewed'
  /** True inside the run's finish window, when the Summary still recomputes. */
  readonly recomputing: boolean
  /** §4.7.4 — set once an accepted correction has forced an audited recompute. */
  readonly lateData: boolean
}

function anomaly(
  anomalyId: string,
  severity: AnomalyRecord['severity'],
  state: AnomalyRecord['state'],
  closureNote: string | null,
): AnomalyRecord {
  return { anomalyId, severity, state, closureNote }
}

/**
 * Four items, one per aging band, oldest first — L28269: the queue is "a
 * single Area-scoped queue, oldest first" with highlights at 24, 48 and 72
 * hours. The order below is the source's, and the screen does not re-sort.
 *
 * The Critical anomaly on the oldest item is the severity bridge doing its job
 * rather than a seeded decoration: L28271 — "any Severity 1 runtime event on
 * the run automatically creates a Critical anomaly in the register", so a run
 * that froze a lot on the floor cannot arrive at review unlabelled.
 */
export const REVIEW_QUEUE = [
  {
    summary: {
      summaryId: 'SUM-2026-08-11-A',
      runId: 'RUN-2026-08-11-A',
      anomalies: [
        anomaly('ANOM-0001', 'Critical', 'Open', null),
        anomaly('ANOM-0002', 'Concern', 'Resolved', 'Torque gauge re-zeroed and the unit re-checked. Elena Diaz.'),
      ],
      annotations: [],
    },
    runLabel: 'RUN-2026-08-11-A — Frame assembly, Day Shift',
    areaId: 'AREA-ASSY-A',
    queuedAtMs: AS_OF_MS - 80 * HOUR,
    reviewState: 'unreviewed',
    recomputing: false,
    lateData: false,
  },
  {
    summary: {
      summaryId: 'SUM-2026-08-12-A',
      runId: 'RUN-2026-08-12-A',
      anomalies: [anomaly('ANOM-0003', 'Concern', 'Open', null)],
      annotations: [
        {
          annotationId: 'ANN-0001',
          text: 'Late torque reading accepted from tablet FL-014 after reconnect; figures recomputed.',
        },
      ],
    },
    runLabel: 'RUN-2026-08-12-A — Wheel build, Day Shift',
    areaId: 'AREA-ASSY-A',
    queuedAtMs: AS_OF_MS - 50 * HOUR,
    reviewState: 'in_review',
    recomputing: false,
    lateData: true,
  },
  {
    summary: {
      summaryId: 'SUM-2026-08-13-A',
      runId: 'RUN-2026-08-13-A',
      anomalies: [anomaly('ANOM-0004', 'Info', 'Open', null)],
      annotations: [],
    },
    runLabel: 'RUN-2026-08-13-A — Frame assembly, Night Shift',
    areaId: 'AREA-ASSY-B',
    queuedAtMs: AS_OF_MS - 26 * HOUR,
    reviewState: 'unreviewed',
    recomputing: false,
    lateData: false,
  },
  {
    summary: {
      summaryId: 'SUM-2026-08-14-A',
      runId: 'RUN-2026-08-14-A',
      anomalies: [],
      annotations: [],
    },
    runLabel: 'RUN-2026-08-14-A — Wheel build, Day Shift',
    areaId: 'AREA-ASSY-A',
    queuedAtMs: AS_OF_MS - 3 * HOUR,
    reviewState: 'unreviewed',
    recomputing: true,
    lateData: false,
  },
] as const satisfies readonly QueueItem[]

/**
 * The band, read from the shared evaluator rather than computed a second time.
 *
 * IT RETURNS A BAND AND NOTHING ELSE, AND NOTHING HERE ADDS A LOCK. The
 * sentence that names the hours also says what they are not, L28269 — "The
 * platform enforces no review service-level agreement — the aging highlights
 * and the digest are the pressure, not a lock." So no item is blocked, no run
 * stalls, and there is no escalation on a service-level agreement, because
 * none is enforced (L28338).
 */
export function bandFor(item: QueueItem, clock: Clock = REVIEW_CLOCK): AgingBand {
  return reviewAgingBand(item.queuedAtMs, clock)
}

export const AGING_BAND_LABEL: Readonly<Record<AgingBand, string>> = {
  'under-24h': 'Under 24 hours',
  'aged-24h': 'Aged past 24 hours',
  'aged-48h': 'Aged past 48 hours',
  'aged-72h': 'Aged past 72 hours',
}

/**
 * Catalogue B's "Roles that can open it" cell for `SCR-DOH-17`, verbatim, and
 * the roles the matrix admits that it omits — DERIVED from the matrix here
 * rather than hand-written, which is the rule the C1 trap exists to enforce.
 *
 * TWO ROLES, NOT ONE. L28300 gives the Supervisor `Allowed with conditions —
 * own Area scope` on viewing a Summary, which is a holding status, and L28306
 * gives the Tenant Admin `Allowed` on the Anomaly Register. `SCR-DOH-17` is
 * "Execution Summary detail and Anomaly Register", so both rows are its own
 * capability rows and catalogue B's cell names neither role.
 *
 * The MODULE-level answer is a different question and it agrees with catalogue
 * B exactly: `doh08RolesReaching()` returns {Quality Manager, Read-only
 * Auditor}, because row 2 marks the Tenant Admin and the Supervisor
 * `Unavailable` on the review queue and that withholds the whole module. Both
 * facts are true at once and neither is the other's refutation — which is why
 * the narrowing is recorded per screen and the rail is derived per module.
 */
export const CATALOGUE_B_SCR_DOH_17_ROLES = 'Quality Manager, Read-only Auditor'

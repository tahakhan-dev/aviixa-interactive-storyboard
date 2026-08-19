import type { ScreenStateId } from '@/ui/screen-state'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import { DOH_AREAS, visibleAreaIds, type LocationArea } from '../location-configuration/fixtures'
import {
  DOH_CLEARANCES,
  DOH_QUALIFICATIONS,
  DOH_WORKERS,
  REGISTER_AS_OF,
  SEEDED_CERTIFICATION_TYPES,
  areaNameFor,
  certificationLabelFor,
  chipFor,
  workerById,
  type Clearance,
  type Qualification,
  type QualificationChip,
  type Worker,
} from '../worker-lifecycle-and-qualifications/fixtures'
import type { TenantRoleId } from '../HubShell'

/**
 * MOD-DOH-14 — the Qualification Calendar. A 60-day, read-only PROJECTION,
 * and this file holds the projection and nothing else.
 *
 * IT OWNS NO RECORD. Every worker, qualification and clearance below is read
 * from the worker lifecycle module's seed through its own exported readers —
 * `workerById(id, register)`, `chipFor(qual, clearances)` — and nothing here
 * re-seeds, re-derives or copies one. The module identity card is explicit:
 * "Objects affected: None — the Calendar is a read-only projection of
 * `OBJ-DOH-QUAL` and `OBJ-DOH-WORKER`."
 *
 * TWO THINGS THIS FILE DELIBERATELY DOES NOT DO.
 *
 * 1. IT ADDS NO SECOND DATE ARITHMETIC. A record is PLACED by its
 *    `expiryDate`, compared as a `YYYY-MM-DD` string against the nine literal
 *    week boundaries below (such strings sort chronologically as text). Its
 *    chip reads the record's own `daysToExpiry`, which the producing module
 *    ties by test to that same `expiryDate` and to `REGISTER_AS_OF`. So the
 *    two halves of every row are held together by an invariant that already
 *    has a test, and no clock, `Date` or day-difference computation exists
 *    anywhere in this module.
 * 2. IT NEVER CUTS BY WORKER. The grid's cell key is `(week, Area)`. A cell
 *    counts CERTIFICATIONS in scope of an Area in a week; there is no
 *    per-worker count, rate, ranking or comparison anywhere, and the worker
 *    filter the source's own matrix names is rendered ABSENT with its reason
 *    (see `ABSENT_BY_RULE`). A calendar of expiry dates is a fact about
 *    certificates; a per-worker cut of it is a measure of people.
 *
 * Determinism: every value below is a literal. Nothing reads a clock.
 */

/** Registry order, so every derived role list comes out in one order. */
const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/* ------------------------------------------------------------------ *
 * The horizon. Fixed at 60 days, inclusive, everywhere the source
 * restates it, and `TEST-DOH-14-N1` fixes the boundary: records at 5,
 * 30, 59 and 60 days appear; one at 61 does not.
 * ------------------------------------------------------------------ */

/** Read from the producing register, never re-typed. */
export const CALENDAR_AS_OF: string = REGISTER_AS_OF

/** The date half of the as-of stamp, sliced from it rather than restated. */
export const AS_OF_DATE: string = CALENDAR_AS_OF.slice(0, 10)

export const HORIZON_DAYS = 60

/**
 * The last day inside the horizon: `AS_OF_DATE` plus `HORIZON_DAYS`, written
 * as a literal because nothing in this module computes a date. The unit
 * suite proves the literal by doing the arithmetic there — a test may read a
 * calendar, a screen may not.
 */
export const HORIZON_END_DATE = '2026-10-18'

/** SB-DOH-026: "a grid of nine weeks across the top". */
export const CALENDAR_WEEK_COUNT = 9

export interface CalendarWeek {
  /** 1-based, as the grid reads left to right. */
  readonly index: number
  /** Days from the as-of stamp. `firstDay` 0 is the as-of day itself. */
  readonly firstDay: number
  readonly lastDay: number
  readonly firstDate: string
  readonly lastDate: string
  readonly label: string
}

/**
 * Nine seven-day buckets from the as-of day, with the ninth TRUNCATED at the
 * horizon: nine weeks is 63 days and the horizon is 61 (day 0 through day
 * 60), so the last bucket is five days long. It is truncated rather than
 * overrun because the horizon is the rule and the grid is the drawing of it —
 * a ninth column running to day 62 would show two days the module says are
 * not in view.
 */
export const CALENDAR_WEEKS = [
  {
    index: 1,
    firstDay: 0,
    lastDay: 6,
    firstDate: '2026-08-19',
    lastDate: '2026-08-25',
    label: 'Week 1 · 19-25 Aug',
  },
  {
    index: 2,
    firstDay: 7,
    lastDay: 13,
    firstDate: '2026-08-26',
    lastDate: '2026-09-01',
    label: 'Week 2 · 26 Aug-1 Sep',
  },
  {
    index: 3,
    firstDay: 14,
    lastDay: 20,
    firstDate: '2026-09-02',
    lastDate: '2026-09-08',
    label: 'Week 3 · 2-8 Sep',
  },
  {
    index: 4,
    firstDay: 21,
    lastDay: 27,
    firstDate: '2026-09-09',
    lastDate: '2026-09-15',
    label: 'Week 4 · 9-15 Sep',
  },
  {
    index: 5,
    firstDay: 28,
    lastDay: 34,
    firstDate: '2026-09-16',
    lastDate: '2026-09-22',
    label: 'Week 5 · 16-22 Sep',
  },
  {
    index: 6,
    firstDay: 35,
    lastDay: 41,
    firstDate: '2026-09-23',
    lastDate: '2026-09-29',
    label: 'Week 6 · 23-29 Sep',
  },
  {
    index: 7,
    firstDay: 42,
    lastDay: 48,
    firstDate: '2026-09-30',
    lastDate: '2026-10-06',
    label: 'Week 7 · 30 Sep-6 Oct',
  },
  {
    index: 8,
    firstDay: 49,
    lastDay: 55,
    firstDate: '2026-10-07',
    lastDate: '2026-10-13',
    label: 'Week 8 · 7-13 Oct',
  },
  {
    index: 9,
    firstDay: 56,
    lastDay: 60,
    firstDate: '2026-10-14',
    lastDate: '2026-10-18',
    label: 'Week 9 · 14-18 Oct (short — the horizon ends here)',
  },
] as const satisfies readonly CalendarWeek[]

/**
 * Is this certificate inside the forward horizon?
 *
 * BY DATE, not by the recorded day count — the record is placed by its
 * `expiryDate` and nothing else, so a calendar cell and the row inside it can
 * never be answering two different questions. Inclusive at both ends: day 0
 * is today's expiry and day 60 is the last day in view.
 */
export function withinHorizon(expiryDate: string): boolean {
  return expiryDate >= AS_OF_DATE && expiryDate <= HORIZON_END_DATE
}

/** The week a date falls in, or `null` when it falls outside the horizon. */
export function weekFor(expiryDate: string): CalendarWeek | null {
  return (
    CALENDAR_WEEKS.find((w) => expiryDate >= w.firstDate && expiryDate <= w.lastDate) ?? null
  )
}

/* ------------------------------------------------------------------ *
 * Scope. The Quality Manager reads the Calendar TENANT-WIDE BY ROLE,
 * "rather than by scope exception", and narrower roles read a
 * scope-filtered view. That is this module's own security note, and it
 * is why the Calendar does not simply reuse the seeded role scopes.
 * ------------------------------------------------------------------ */

export type CalendarScope = 'tenant-wide-by-role' | 'seeded-role-scope'

export const CALENDAR_SCOPES = [
  'tenant-wide-by-role',
  'seeded-role-scope',
] as const satisfies readonly CalendarScope[]

type MissingFromCalendarScopes = Exclude<CalendarScope, (typeof CALENDAR_SCOPES)[number]>
const _calendarScopesExhaustive: MissingFromCalendarScopes extends never ? true : never = true
void _calendarScopesExhaustive

/** The Quality Manager owns this screen, so the Calendar widens them past
 *  the Site scope every other screen holds them to. Nobody else is widened. */
export function calendarScopeFor(roleId: TenantRoleId): CalendarScope {
  return roleId === 'QUALITY_MANAGER' ? 'tenant-wide-by-role' : 'seeded-role-scope'
}

const ALL_AREA_IDS: readonly string[] = DOH_AREAS.map((a) => a.id)

/**
 * The Areas this reader's Calendar covers — the grid's rows, the filter's
 * options AND the bound on the read, all from this one answer. Scope
 * enforced in what the screen READS, never in what it draws.
 */
export function calendarAreaIdsFor(roleId: TenantRoleId): readonly string[] {
  return calendarScopeFor(roleId) === 'tenant-wide-by-role'
    ? ALL_AREA_IDS
    : visibleAreaIds(roleId)
}

export function calendarAreasFor(roleId: TenantRoleId): readonly LocationArea[] {
  const ids = calendarAreaIdsFor(roleId)
  return DOH_AREAS.filter((a) => ids.includes(a.id))
}

export const CALENDAR_SCOPE_NOTE: Readonly<Record<CalendarScope, string>> = {
  'tenant-wide-by-role':
    'Tenant-wide, granted by role rather than by a scope exception. The Quality Manager owns this screen because certification planning cannot be done Area by Area, and this is the one screen where that role reads past the Site scope it holds everywhere else.',
  'seeded-role-scope':
    'Filtered to this reader’s own scope. The filter bounds the READ, not the drawing: an Area outside scope contributes no row, no cell and no count, and it is not an option in the Area filter either.',
}

/* ------------------------------------------------------------------ *
 * The projection itself.
 * ------------------------------------------------------------------ */

/**
 * One placed row: a certificate, in one Area, in one week.
 *
 * A qualification scoped across two Areas produces TWO entries, because it is
 * genuine exposure in both — the certificate lapsing takes cover off both
 * lines. It is a fact about the certificate's scope and never a second count
 * of a person: no key below is a measure, and the sweep in the unit suite
 * proves it with the shared matcher rather than a sixth regular expression.
 */
export interface CalendarEntry {
  readonly qualificationId: string
  readonly workerId: string
  readonly workerName: string
  readonly certificationId: string
  readonly certificationName: string
  readonly areaId: string
  readonly areaName: string
  readonly weekIndex: number
  readonly expiryDate: string
  /** Read from the record. Never recomputed here. */
  readonly daysToExpiry: number
  readonly chip: QualificationChip
}

/**
 * THE STRUCTURAL HALF OF THE SURVEILLANCE PROHIBITION, checked by `tsc`
 * rather than by a test somebody has to remember to run.
 *
 * The runtime sweep in the unit suite reads `Object.keys` of a real row, so it
 * only ever sees a field that is actually WRITTEN — a measure declared on the
 * interface and left unpopulated walks straight past it, which was proved by
 * mutation rather than assumed. This closes that half: a calendar row that
 * gains any of these names fails to compile, and a field that exists is a
 * field something eventually reads. Union and denial on ONE line deliberately,
 * so a line-based surveillance scan reads the denial with the tokens.
 */
type ForbiddenMeasureField = 'workerRunCount' | 'expiryFrequency' | 'expiriesPerWorker' | 'recertificationRate' | 'productivityScore' // never on a calendar row.
type MeasureFieldOnCalendarEntry = Extract<keyof CalendarEntry, ForbiddenMeasureField>
const _entryHasNoMeasureField: MeasureFieldOnCalendarEntry extends never ? true : never = true
void _entryHasNoMeasureField

/**
 * The whole projection for one reader, from the registers it is handed.
 *
 * REGISTERS ARE PARAMETERS, not module-load snapshots. Every filter and every
 * count on the screen reads the value this returns, so a control that changes
 * the inputs changes the output — the defect this slice has recorded three
 * times is a filter closing over a seed.
 */
export function calendarEntriesFor(
  roleId: TenantRoleId,
  qualifications: readonly Qualification[],
  workers: readonly Worker[],
  clearances: readonly Clearance[],
): readonly CalendarEntry[] {
  const areaIds = calendarAreaIdsFor(roleId)
  const entries: CalendarEntry[] = []
  for (const qual of qualifications) {
    if (!withinHorizon(qual.expiryDate)) continue
    const week = weekFor(qual.expiryDate)
    if (week === null) continue
    const worker = workerById(qual.workerId, workers)
    if (worker === undefined) continue
    for (const areaId of qual.areaIds) {
      if (!areaIds.includes(areaId)) continue
      entries.push({
        qualificationId: qual.id,
        workerId: qual.workerId,
        workerName: worker.name,
        certificationId: qual.certificationId,
        certificationName: certificationLabelFor(qual.certificationId),
        areaId,
        areaName: areaNameFor(areaId),
        weekIndex: week.index,
        expiryDate: qual.expiryDate,
        daysToExpiry: qual.daysToExpiry,
        chip: chipFor(qual, clearances),
      })
    }
  }
  return entries
}

/**
 * Certificates ALREADY LAPSED at the as-of stamp, in this reader's scope.
 *
 * They are outside a FORWARD horizon by definition and so are absent from the
 * grid — and a planning screen that simply dropped them would be the worst
 * kind of quiet omission, because a lapsed certificate is the one the planner
 * most needs to know about. They are listed beside the grid instead, with the
 * reason for their absence from it stated, which is the same treatment the
 * source demands for the no-expiry case.
 */
export function alreadyLapsedFor(
  roleId: TenantRoleId,
  qualifications: readonly Qualification[],
  workers: readonly Worker[],
  clearances: readonly Clearance[],
): readonly CalendarEntry[] {
  const areaIds = calendarAreaIdsFor(roleId)
  const entries: CalendarEntry[] = []
  for (const qual of qualifications) {
    if (qual.expiryDate >= AS_OF_DATE) continue
    const worker = workerById(qual.workerId, workers)
    if (worker === undefined) continue
    for (const areaId of qual.areaIds) {
      if (!areaIds.includes(areaId)) continue
      entries.push({
        qualificationId: qual.id,
        workerId: qual.workerId,
        workerName: worker.name,
        certificationId: qual.certificationId,
        certificationName: certificationLabelFor(qual.certificationId),
        areaId,
        areaName: areaNameFor(areaId),
        weekIndex: 0,
        expiryDate: qual.expiryDate,
        daysToExpiry: qual.daysToExpiry,
        chip: chipFor(qual, clearances),
      })
    }
  }
  return entries
}

/**
 * The count in one grid cell: certificates expiring in this Area in this
 * week. KEYED ON `(week, Area)` AND NOTHING ELSE — there is no overload of
 * this function taking a worker, and nowhere in the signature to put one.
 */
export function cellCount(
  entries: readonly CalendarEntry[],
  weekIndex: number,
  areaId: string,
): number {
  return entries.filter((e) => e.weekIndex === weekIndex && e.areaId === areaId).length
}

/* ------------------------------------------------------------------ *
 * The three filters this build ships, and the fourth it does not.
 * ------------------------------------------------------------------ */

export type CalendarFilterDimension = 'week' | 'area' | 'certification-type'

export const CALENDAR_FILTER_DIMENSIONS = [
  'week',
  'area',
  'certification-type',
] as const satisfies readonly CalendarFilterDimension[]

type MissingFromFilters = Exclude<
  CalendarFilterDimension,
  (typeof CALENDAR_FILTER_DIMENSIONS)[number]
>
const _filtersExhaustive: MissingFromFilters extends never ? true : never = true
void _filtersExhaustive

export interface CalendarFilterState {
  /** `null` means every week in the horizon. */
  readonly weekIndex: number | null
  readonly areaId: string | null
  readonly certificationId: string | null
}

export const NO_FILTERS: CalendarFilterState = {
  weekIndex: null,
  areaId: null,
  certificationId: null,
}

/**
 * Applied to the entries the READ already produced, so a filter can only ever
 * narrow a set the scope has already bounded. There is no path by which a
 * filter widens a reader past their own Areas.
 */
export function applyFilters(
  entries: readonly CalendarEntry[],
  filters: CalendarFilterState,
): readonly CalendarEntry[] {
  return entries.filter(
    (e) =>
      (filters.weekIndex === null || e.weekIndex === filters.weekIndex) &&
      (filters.areaId === null || e.areaId === filters.areaId) &&
      (filters.certificationId === null || e.certificationId === filters.certificationId),
  )
}

export function filtersAreActive(filters: CalendarFilterState): boolean {
  return filters.weekIndex !== null || filters.areaId !== null || filters.certificationId !== null
}

/* ------------------------------------------------------------------ *
 * The six-row control matrix, verified at source: header L29343, rows
 * L29345-L29350. Every cell carries an explicit status, because a blank
 * cell is an unanswered question an implementer answers privately.
 * ------------------------------------------------------------------ */

export type ControlStatus =
  | 'allowed'
  | 'allowed-with-conditions'
  | 'read-only'
  | 'explicitly-prohibited'
  | 'not-applicable'
  | 'unavailable'

export const CONTROL_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
  'explicitly-prohibited',
  'not-applicable',
  'unavailable',
] as const satisfies readonly ControlStatus[]

type MissingFromControlStatuses = Exclude<ControlStatus, (typeof CONTROL_STATUSES)[number]>
const _controlStatusesExhaustive: MissingFromControlStatuses extends never ? true : never = true
void _controlStatusesExhaustive

export type CalendarControlId =
  | 'open-the-calendar'
  | 'filter-the-calendar'
  | 'link-through-to-a-worker-record'
  | 'record-a-recertification-from-the-calendar'
  | 'change-the-horizon'
  | 'export-the-calendar'

export interface ControlMatrixRow {
  readonly id: CalendarControlId
  readonly control: string
  readonly status: Readonly<Record<TenantRoleId, ControlStatus>>
  /** The source's own qualifying words, per role, never blank. */
  readonly detail: Readonly<Record<TenantRoleId, string>>
  readonly rendering: string
  readonly effect: string
  readonly sourceRef: string
}

const PROHIBITED_FOR_ALL_FIVE: Readonly<Record<TenantRoleId, ControlStatus>> = {
  TENANT_ADMIN: 'explicitly-prohibited',
  SUPERVISOR: 'explicitly-prohibited',
  QUALITY_MANAGER: 'explicitly-prohibited',
  READONLY_AUDITOR: 'explicitly-prohibited',
  WORKER: 'explicitly-prohibited',
}

const NOT_APPLICABLE_FOR_ALL_FIVE: Readonly<Record<TenantRoleId, ControlStatus>> = {
  TENANT_ADMIN: 'not-applicable',
  SUPERVISOR: 'not-applicable',
  QUALITY_MANAGER: 'not-applicable',
  READONLY_AUDITOR: 'not-applicable',
  WORKER: 'not-applicable',
}

function sameDetailForAllFive(detail: string): Readonly<Record<TenantRoleId, string>> {
  return {
    TENANT_ADMIN: detail,
    SUPERVISOR: detail,
    QUALITY_MANAGER: detail,
    READONLY_AUDITOR: detail,
    WORKER: detail,
  }
}

export const CONTROL_MATRIX = [
  {
    id: 'open-the-calendar',
    control: 'Open the Qualification Calendar',
    status: {
      TENANT_ADMIN: 'read-only',
      SUPERVISOR: 'read-only',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Read-only.',
      SUPERVISOR: 'Read-only — filtered to own Area scope.',
      QUALITY_MANAGER: 'Allowed — tenant-wide.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER: 'Unavailable — and the Worker holds no Hub screen at all.',
    },
    rendering:
      'The grid renders for four roles under STATE-06, whose cause is the module itself rather than any suspension: the Calendar has no write path of any kind. ABSENT for the Worker — the rail does not offer the route, and a deep link meets STATE-05.',
    effect:
      'A read. Nothing here changes a record, and the pleasing inversion of this matrix is that the Quality Manager owns the screen and cannot act on it.',
    sourceRef: 'L29345',
  },
  {
    id: 'filter-the-calendar',
    control: 'Filter by week, Area, certification type or worker',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'allowed-with-conditions',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed with conditions — within scope.',
      SUPERVISOR: 'Allowed with conditions — within Area scope.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: 'Allowed with conditions — read-only filters.',
      WORKER: 'Unavailable.',
    },
    rendering:
      'Three of the four named dimensions render: week, Area and certification type. The worker dimension renders ABSENT with its reason — worker is one of the three deferred scopes, and a per-worker cut of an expiry calendar is the measure the support-not-surveillance rule refuses. The condition on the other three is enforced at the READ, so an out-of-scope Area is not an option and contributes nothing to filter.',
    effect: 'Narrows a set the scope has already bounded. A filter never widens a reader.',
    sourceRef: 'L29346',
  },
  {
    id: 'link-through-to-a-worker-record',
    control: 'Link through to a worker record',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR: 'Allowed with conditions — own scope.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER: 'Unavailable.',
    },
    rendering:
      'Every row links, for all four reading roles. The link is the whole of this screen’s route to action: what each role may then DO on the record is that module’s own matrix, decided there and not here.',
    effect:
      'Navigation. The Calendar hands a reader to the record; the record is where a write is gated and audited.',
    sourceRef: 'L29347',
  },
  {
    id: 'record-a-recertification-from-the-calendar',
    control: 'Record a recertification from the Calendar',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: 'Allowed with conditions — through the linked worker record.',
      SUPERVISOR: 'Allowed with conditions — through the linked worker record, own scope.',
      QUALITY_MANAGER:
        'Explicitly prohibited — qualification entry is a Supervisor and Tenant Admin act.',
      READONLY_AUDITOR: 'Explicitly prohibited.',
      WORKER: 'Explicitly prohibited.',
    },
    rendering:
      'ABSENT for every one of the five, and that is not a judgement about the two conditioned roles — their condition IS "through the linked worker record", so the Calendar itself draws no recertification control for anybody. AC-DOH-14-4 says the Calendar has no write capability of any kind, and the denial test asks for no such control to exist rather than for a disabled one.',
    effect:
      'Nothing here. The write happens on the worker record and is audited there, which is what stops the Calendar becoming a route around the supervisor-enters-qualifications rule.',
    sourceRef: 'L29348',
  },
  {
    id: 'change-the-horizon',
    control: 'Change the 60-day horizon',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: sameDetailForAllFive(
      'Explicitly prohibited — the horizon is fixed at 60 days, restated some twenty times across the source.',
    ),
    rendering:
      'ABSENT. A categorical rule, not a routing one: no role holds it in any scope and no other surface offers it, so nothing is drawn where a horizon picker would sit. A disabled picker would imply a configurable horizon somebody might one day be given.',
    effect: 'Nothing. The horizon is the module.',
    sourceRef: 'L29349',
  },
  {
    id: 'export-the-calendar',
    control: 'Export the Calendar',
    status: NOT_APPLICABLE_FOR_ALL_FIVE,
    detail: sameDetailForAllFive(
      'Not applicable — the Statement of Work does not specify a Calendar export; the underlying data is reachable through the audit and report paths.',
    ),
    rendering:
      'ABSENT, with the reason in help text. Nothing exists to enable, and the source classifies the absence as not-specified rather than as a decision — so this build records it rather than inventing an export.',
    effect: 'Nothing. The audit and report paths carry the same facts.',
    sourceRef: 'L29350',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<CalendarControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * The `allowedRoles` list every `evaluateAccess` call on this screen passes,
 * derived from the matrix above rather than typed a second time beside the
 * control. Change a status and the affordance moves with it.
 */
export function rolesWithStatus(
  controlId: CalendarControlId,
  statuses: readonly ControlStatus[],
): readonly TenantRoleId[] {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) return []
  return TENANT_ROLE_ORDER.filter((roleId) => statuses.includes(row.status[roleId]))
}

export function statusFor(controlId: CalendarControlId, roleId: TenantRoleId): ControlStatus {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) throw new Error(`Unknown MOD-DOH-14 control: ${controlId}`)
  return row.status[roleId]
}

/** `satisfies`, never an annotation: an annotation would widen these to the
 *  whole six-token union and let a prohibition token pass as a reading one. */
export const READING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

export const ACTING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
] as const satisfies readonly ControlStatus[]

/* ------------------------------------------------------------------ *
 * Screen states. No STATE-04: nothing is written here, so nothing can
 * be invalid.
 * ------------------------------------------------------------------ */

export const APPLICABLE_SCREEN_STATES = [
  'STATE-01',
  'STATE-02',
  'STATE-03',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

export type ApplicableScreenStateId = (typeof APPLICABLE_SCREEN_STATES)[number]

export interface InapplicableScreenState {
  readonly id: ScreenStateId
  readonly why: string
}

export const INAPPLICABLE_SCREEN_STATES = [
  {
    id: 'STATE-04',
    why: 'Never. The Calendar accepts no input that becomes a record, so there is no value here that can be invalid. The filters narrow a read and validate nothing.',
  },
  {
    id: 'STATE-07',
    why: 'Never. Only the Frontline Worker Application has a true offline state; this is a Hub web screen with no device counterpart, and connection loss splits three ways instead.',
  },
  {
    id: 'STATE-09',
    why: 'Never. No command travels from this screen, because no action does. Nothing is ever queued here.',
  },
  {
    id: 'STATE-10',
    why: 'Never in this slice. No agent populates, ranks or annotates the Calendar, and the module is fully functional with every agent paused.',
  },
  {
    id: 'STATE-11',
    why: 'Never in this slice, for the same reason: nothing on this screen depends on a model.',
  },
] as const satisfies readonly InapplicableScreenState[]

/* ------------------------------------------------------------------ *
 * Absent by rule. Nothing is drawn where any of these would sit.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'Filter or group by worker',
    note: `The source names four filter dimensions and this build ships three. Worker is one of the three deferred scopes (${DEFERRED_DOH_SCOPES.join(', ')}), and no rule may depend on it — so it renders ABSENT rather than disabled, because a disabled worker picker would imply a roadmap promise the source has not made. The second reason is the stronger one: a calendar cut by worker is a per-worker view of certification exposure, and the moment it carries a count or a rate it is a measure of a person rather than a fact about a certificate. The divergence from the source's own matrix row is recorded rather than quietly taken.`,
  },
  {
    label: 'Record a recertification here',
    note: 'No recertification control is drawn on the Calendar for any of the five roles, including the two the matrix conditions rather than prohibits — their condition is "through the linked worker record", and the acceptance criterion is that the Calendar has no write capability of any kind. Every row links to the record instead.',
  },
  {
    label: 'Change the 60-day horizon',
    note: 'Explicitly prohibited for all five roles by a categorical rule: the horizon is fixed at 60 days. No picker, no stepper and no preset is drawn, and no disabled one either.',
  },
  {
    label: 'Export the Calendar',
    note: 'Not applicable for all five roles — the Statement of Work does not specify a Calendar export, and the underlying data is reachable through the audit and report paths. Nothing exists to enable, so nothing is drawn.',
  },
  {
    label: 'Any control that writes anything',
    note: 'The module owns no object and has no write path, so the tenant state gate has nothing to gate on this screen. That is stated rather than performed: calling the write-class table here to refuse a write that does not exist would be theatre. What the component suite asserts instead is the real property — every control on this screen is one of exactly two kinds, a filter or a grid-cell expander, and both change only what is displayed. Both kinds are marked in the markup, and any third control appearing here fails that assertion for every persona that can open the screen.',
  },
] as const satisfies readonly AbsentByRule[]

/* ------------------------------------------------------------------ *
 * The decisions this screen renders, on screen where a reviewer sees
 * them rather than only in a comment.
 * ------------------------------------------------------------------ */

export interface RenderedDecision {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D1',
    statement:
      'Screen catalogue B is canonical, and the SCR-DOH-NN number in the header is an annotation on this module rather than a route key — this route is keyed on the module slug. The three-digit form of the same-looking identifier names a different screen in the other catalogue and appears nowhere in this codebase.',
  },
  {
    ref: 'D7',
    statement:
      'Connection loss splits three ways. Loaded content degrades to the last computed projection with a freshness marker and an as-of time, and stays scope-filtered while it does. A read that fails outright names what failed and states that nothing was written — which on this screen is trivially true, because nothing here ever writes. Reconnection recomputes the projection rather than reusing the cached one.',
  },
  {
    ref: 'D8',
    statement:
      'Nine permission tokens, not six. Every refusal on this screen is one of the nine, produced by the shared evaluator from this module’s own matrix, and none of them is a blank cell.',
  },
  {
    ref: 'D11',
    statement:
      'The Worker holds no Hub screen, so the Worker never opens this one. The cost lands squarely here and is stated rather than hidden: this is the screen that shows when a certification runs out, and a worker without a device in hand cannot check their own.',
  },
  {
    ref: 'D24',
    statement:
      'The roles above come from this module’s own matrix, over seven conflicting restatements elsewhere in the source — including ones that omit the Quality Manager entirely from the screen the module exists to give them. Quality Manager tenant-wide; Tenant Admin and Read-only Auditor read-only; Supervisor read-only and filtered to their own Areas; Worker unavailable.',
  },
] as const satisfies readonly RenderedDecision[]

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it answers twice.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'No refresh control is defined for the projection, and no recompute interval is stated. The as-of stamp is the only freshness a reader is given.',
  'No sort order is defined for the rows inside an expanded cell. This build orders them by expiry date and then by the register’s own order, and says so rather than implying the order carries meaning.',
  'No behaviour is defined for a certification that has ALREADY lapsed at the as-of stamp. A forward horizon excludes it by definition; this build lists those certificates beside the grid, with their absence from it explained, rather than dropping them from a planning screen without a word.',
  'No week-start convention is defined. The nine weeks here run from the as-of day rather than from a calendar Monday, and the ninth is short because the horizon ends inside it.',
  'No definition is given for how a qualification scoped across two Areas should be counted in a per-Area grid. This build counts it in both, because the exposure is real in both, and states it beside the grid.',
  'No empty-Area convention is stated. An Area with nothing expiring still renders its row, because "nothing expires here in the next 60 days" is an answer a planner needs and a missing row is not.',
  'No control is defined for subscribing to, or opting out of, the certification-expiry section of the per-shift digest from this screen.',
  'The seam registry carries NO entry for this module’s own cross-slice dependency. The Calendar’s one notification row, and its fallback-of-fallback when the projection cannot compute, are both the per-shift digest’s certification-expiry section, whose delivery a later slice owns. The nearest registered seam describes another module’s digest-time field, which is a different dependency with a different consumer, so no seam notice is drawn here at all — naming the wrong owner for the wrong thing is worse than naming nothing. Raised so the registry gains the entry rather than this screen borrowing one.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'The rendering rule for a refusal is UNSETTLED in the frozen source, and this build does not settle it. Chapter 30 and the role chapters state opposite rules, both carrying acceptance criteria, and two named tests assert opposite renderings of the same control for the same role. This screen follows its brief — categorical prohibitions and not-applicable rows render ABSENT — states here that the reading is unsettled, and expects a slice-wide gate to decide it.',
  '"Explicitly prohibited" carries no rendering anywhere in the frozen source. It is a statement about authority, so no cell of the matrix above told this build how to draw anything; the mapping from token to rendering is a build decision, recorded as one.',
  '"Unavailable" is overloaded in the source and the two senses are kept apart here. Role-level withholding of a whole module — the Worker column above — renders nothing at all and decides the rail. Transient unavailability of an action a role does hold would render disabled with its reason, and no cell of this matrix is that second kind.',
  'The source names four filter dimensions and one of them is worker. This build ships three and renders the fourth ABSENT on the surveillance rule. That is a deliberate divergence from a source row rather than an omission, and it is recorded here so a reviewer meets it rather than discovering it.',
  'The Quality Manager’s tenant-wide read is granted BY ROLE on this screen while the same role is Site-scoped everywhere else in this workspace. Both statements are the source’s own. The widening is observable here — the Quality Manager’s grid carries an Area their Site scope excludes — and it is stated on screen rather than smoothed away.',
  'A conflicting restatement of the Calendar’s roles exists elsewhere in the source, including readings that omit the Quality Manager from their own planning screen. The module card governs, per the decision recorded above, and the restatements are recorded as drafting drift rather than reconciled in silence.',
] as const

/* ------------------------------------------------------------------ *
 * Copy the source fixes, quoted rather than paraphrased.
 * ------------------------------------------------------------------ */

/** SB-DOH-026: the line beneath the grid, fixed. */
export const GRID_FOOTER_COPY =
  'This view covers the next 60 days tenant-wide. Recertification is recorded on the worker record.'

/** The route the row link points at. A slug, never a screen number. */
export const WORKER_RECORD_ROUTE = '/hub/worker-lifecycle-and-qualifications/'

/** Re-exported so the screen has one import for the vocabulary it renders. */
export { SEEDED_CERTIFICATION_TYPES, DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES }

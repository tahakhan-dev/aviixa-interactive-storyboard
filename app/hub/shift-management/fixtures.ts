import type { TenantRoleId } from '../HubShell'
import { BARE_PROHIBITION } from '@/surfaces/doh/modules'
import type { ControlStatus, DohControlMatrixRow } from '@/surfaces/doh/modules'
import {
  DOH_AREAS,
  SEEDED_ROLE_SCOPES,
  areasForSite,
  siteById,
  type LocationArea,
} from '../location-configuration/fixtures'

/**
 * MOD-DOH-03 seeded fixture data — the tenant's working-time blocks.
 *
 * THE ONE PROPERTY THIS FILE EXISTS TO HOLD STRUCTURALLY: a Shift has no
 * timezone. `Shift` below carries no `timezone` field, and a compile-time
 * check just under it fails the build if one is ever added. The timezone is
 * resolved through the parent Site by `shiftTimezone`, and there is no other
 * way to obtain one — so "a Shift inherits its Site's timezone" is a fact
 * about the type, not a sentence in a comment that a later edit could quietly
 * contradict. The producing module holds the other half of the same rule:
 * an Area carries no timezone field either, so there is no Area-level value
 * for a Shift to read by accident.
 *
 * Sites and Areas are READ from the location module and never re-seeded here:
 *
 *     import { DOH_SITES, DOH_AREAS, areasForSite, siteById }
 *       from '../location-configuration/fixtures'
 *
 * WHAT THE NEXT MODULE IMPORTS FROM HERE. On-shift roster resolution consumes
 * these Shifts; the stable path is
 *
 *     import { DOH_SHIFTS, shiftById, shiftsForArea, shiftTimezone }
 *       from '../shift-management/fixtures'
 *
 * Determinism (spec §8): every value below is a literal. No clock is read, no
 * randomness is drawn, nothing is fetched — the as-of stamp is a fixed string.
 *
 * Support-not-surveillance (S10): nothing here keys a measure on a person.
 * On-shift escalation resolves against `(Area, Shift)`, never `(Worker)`, and
 * no record below carries a worker identifier, a roster, or a per-shift
 * figure of any kind. `tests/unit/doh-shifts.test.ts` proves that with the
 * shared key matcher rather than a fourth hand-rolled expression.
 */

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-SHIFT` — TWO states (L27281), the same pair the location
 * nodes carry. Three conflicting vocabularies exist elsewhere in the
 * source (`created|updated|archived` at L22388, `none|active` at
 * L61467); the module identity card governs, per D21.
 * ------------------------------------------------------------------ */

export type ShiftState = 'active' | 'archived'

export const SHIFT_STATES = ['active', 'archived'] as const satisfies readonly ShiftState[]

type MissingFromShiftStates = Exclude<ShiftState, (typeof SHIFT_STATES)[number]>
const _shiftStatesExhaustive: MissingFromShiftStates extends never ? true : never = true
void _shiftStatesExhaustive

/**
 * NOTIF-DOH-03-3 (L27371) — the notification raised to the requesting Tenant
 * Admin when a Shift archival is refused because runs are still scheduled
 * against it. Three states, and the screen renders the true one rather than
 * reporting the notification as delivered the instant it is raised.
 */
export type ArchivalRefusalNoticeState = 'created' | 'delivered' | 'read'

export const ARCHIVAL_REFUSAL_NOTICE_STATES = [
  'created',
  'delivered',
  'read',
] as const satisfies readonly ArchivalRefusalNoticeState[]

type MissingFromNoticeStates = Exclude<
  ArchivalRefusalNoticeState,
  (typeof ARCHIVAL_REFUSAL_NOTICE_STATES)[number]
>
const _noticeStatesExhaustive: MissingFromNoticeStates extends never ? true : never = true
void _noticeStatesExhaustive

/**
 * The state a refusal notification is in at the moment this screen raises it.
 * `created` and nothing further: the storyboard reaches no delivery channel,
 * and rendering it as delivered would be an accepted action shown as done.
 */
export const ARCHIVAL_REFUSAL_NOTICE_INITIAL_STATE: ArchivalRefusalNoticeState = 'created'

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-SHIFT` itself.
 * ------------------------------------------------------------------ */

export interface Shift {
  readonly id: string
  /**
   * The parent Site, and the ONLY route to this Shift's timezone. A Shift
   * may not span Sites (L72144), so every bound Area below belongs to this
   * Site — enforced by construction in `selectableAreasFor` rather than
   * checked after the fact.
   */
  readonly siteId: string
  readonly name: string
  /** Wall-clock `HH:MM` in the parent Site's timezone. Nominal, not actual. */
  readonly nominalStart: string
  readonly nominalEnd: string
  /**
   * Many-to-many with Areas, with no overlap permitted on the same Area
   * (D6, AC-51-13 at L113055). Cardinality is otherwise DEFERRED —
   * DEC-SHIFT-001 is open, so no minimum and no maximum is enforced.
   */
  readonly areaIds: readonly string[]
  /** `HH:MM`, pre-filled 06:00, read in the parent Site's timezone. */
  readonly digestTime: string
  readonly state: ShiftState
  /**
   * Runs scheduled against this Shift, BY REFERENCE ONLY (L27280). Slice 4
   * exposes the reference and implements no run state, no run record and no
   * run screen — MOD-DOH-06 owns those, in slice 6. A non-empty list refuses
   * archival and raises NOTIF-DOH-03-3.
   */
  readonly scheduledRunIds: readonly string[]
  readonly note: string
}

/**
 * THE STRUCTURAL HALF OF TIMEZONE INHERITANCE, checked by the compiler.
 *
 * `Shift` must never gain a timezone of its own: a per-Shift override is
 * `Explicitly prohibited` for all five tenant roles and deferred beyond V1
 * (L27296), and a field that exists is a field something will eventually
 * read. This fails to compile the moment anyone adds one, which is a
 * different and stronger guarantee than a test that has to be run.
 */
type ShiftCarriesNoTimezone = 'timezone' extends keyof Shift ? never : true
const _shiftHasNoTimezoneField: ShiftCarriesNoTimezone = true
void _shiftHasNoTimezoneField

/**
 * The seeded register. Six Shifts across two operating Sites, and the counts
 * agree with the in-use badges the location module already publishes on those
 * Sites ("4 Shifts" on Ardenfield Works, "2 Shifts" on Kelvin Road) — asserted
 * in the unit suite, so the two fixtures cannot drift into disagreeing about
 * the same tenant.
 */
export const DOH_SHIFTS = [
  {
    id: 'SHIFT-ARD-EARLY',
    siteId: 'SITE-ARD-01',
    name: 'Ardenfield Early',
    nominalStart: '06:00',
    nominalEnd: '14:00',
    areaIds: ['AREA-ARD-ASSY'],
    digestTime: '06:00',
    state: 'active',
    scheduledRunIds: [],
    note: 'One Area, and its digest time is the platform default, untouched. The Assembly Hall carries no Shift between 22:00 and 06:00, so this is the Shift a reviewer can most easily create a lawful neighbour for.',
  },
  {
    id: 'SHIFT-ARD-LATE',
    siteId: 'SITE-ARD-01',
    name: 'Ardenfield Late',
    nominalStart: '14:00',
    nominalEnd: '22:00',
    areaIds: ['AREA-ARD-ASSY', 'AREA-ARD-PAINT'],
    digestTime: '06:00',
    state: 'active',
    scheduledRunIds: ['RUN-4471', 'RUN-4472'],
    note: 'Two Areas on one Shift — the many-Areas half of D6. Two runs are scheduled against it, so archival is refused and the refusal raises NOTIF-DOH-03-3. The runs are references only; this slice implements no run state.',
  },
  {
    id: 'SHIFT-ARD-NIGHT',
    siteId: 'SITE-ARD-01',
    name: 'Ardenfield Night',
    nominalStart: '22:00',
    nominalEnd: '06:00',
    areaIds: ['AREA-ARD-PAINT'],
    digestTime: '05:30',
    state: 'active',
    scheduledRunIds: [],
    note: 'Crosses midnight, so it is the Shift whose nominal date decides the production date of a run that spans two calendar days. On the Paint Line it touches Late at 22:00 without overlapping it — a Shift ends at the instant the next begins.',
  },
  {
    id: 'SHIFT-ARD-TWILIGHT',
    siteId: 'SITE-ARD-01',
    name: 'Ardenfield Twilight',
    nominalStart: '10:00',
    nominalEnd: '18:00',
    areaIds: ['AREA-ARD-PAINT'],
    digestTime: '06:00',
    state: 'archived',
    scheduledRunIds: [],
    note: 'Archived, and it would overlap both Early and Late on the Paint Line if it were not. An archived Shift no longer occupies its Areas, so it takes no part in the overlap refusal — the register still lists it, because the runs it already stamped still resolve through it.',
  },
  {
    id: 'SHIFT-KEL-DAY',
    siteId: 'SITE-ARD-02',
    name: 'Kelvin Day',
    nominalStart: '07:00',
    nominalEnd: '15:00',
    areaIds: ['AREA-ARD-POLISH', 'AREA-ARD-QC'],
    digestTime: '06:00',
    state: 'active',
    scheduledRunIds: [],
    note: 'On the second Site, so it inherits Europe/Warsaw. Its 06:00 digest is a different moment from the 06:00 digest of every Ardenfield Shift, which is the whole point of anchoring the time to the Site.',
  },
  {
    id: 'SHIFT-KEL-BACK',
    siteId: 'SITE-ARD-02',
    name: 'Kelvin Back',
    nominalStart: '15:00',
    nominalEnd: '23:00',
    areaIds: ['AREA-ARD-POLISH'],
    digestTime: '07:15',
    state: 'active',
    scheduledRunIds: [],
    note: 'The one Shift carrying a digest time that is neither the platform default nor a rounded hour, so the register proves the field is read from the record rather than painted from the default.',
  },
] as const satisfies readonly Shift[]

const SHIFT_BY_ID = new Map<string, Shift>(DOH_SHIFTS.map((s) => [s.id, s]))

export function shiftById(id: string): Shift | undefined {
  return SHIFT_BY_ID.get(id)
}

/**
 * The Shifts bound to one Area, over whichever register the caller holds.
 * Takes the register as an argument rather than closing over the seed: a
 * Shift created or re-bound in a session must be visible to every answer
 * this module gives, or the control that created it changed nothing anybody
 * can see.
 */
export function shiftsForArea(areaId: string, shifts: readonly Shift[]): readonly Shift[] {
  return shifts.filter((s) => s.areaIds.includes(areaId))
}

/* ------------------------------------------------------------------ *
 * TIMEZONE INHERITANCE — the resolver, and the only one.
 * ------------------------------------------------------------------ */

/**
 * The timezone that governs a Shift, resolved through its Site. There is no
 * second source and no override: a per-Shift timezone is `Explicitly
 * prohibited` for all five roles and deferred beyond V1, so this function is
 * the whole of the rule.
 *
 * Returns `null` — a typed failure, never a thrown exception — when the
 * Shift names a Site this workspace does not hold. Falling back to a default
 * timezone would be the dangerous answer: a Shift silently resolving to
 * Europe/London would date its runs, fire its digest and window its meter in
 * the wrong place while looking entirely healthy.
 *
 * The frozen Site map is the right source here, unlike on the location
 * screen: this module writes no Site, so no Site it must resolve can have
 * been created after load.
 */
export function shiftTimezone(siteId: string): string | null {
  return siteById(siteId)?.timezone ?? null
}

/**
 * The Areas a Shift on this Site may bind. A Shift may not span Sites
 * (L72144), and this is where that rule lives: the multi-select is built from
 * this list, so an Area under another Site is never offered rather than
 * offered and then refused.
 */
export function selectableAreasFor(siteId: string): readonly LocationArea[] {
  return areasForSite(siteId).filter((a) => a.state === 'active')
}

/* ------------------------------------------------------------------ *
 * THE OVERLAP REFUSAL — AC-51-13 (L113055), verified by TEST-51-13:
 * "The platform refuses to create two Shifts with overlapping times
 * bound to the same Area, stating the rule."
 * ------------------------------------------------------------------ */

export const MINUTES_IN_DAY = 1440

/**
 * `HH:MM` as minutes from midnight, or `null` when the string is not a time.
 * A typed failure rather than a `NaN` that would propagate into a comparison
 * and read as "no overlap" — the silent direction of the failure is the one
 * that ships.
 */
export function minutesFromMidnight(hhmm: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (match === null) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * A working-time block as one or two half-open `[start, end)` segments on a
 * 24-hour clock. A block whose end is earlier than its start wraps midnight
 * and becomes two segments.
 *
 * `end === start` returns the WHOLE DAY, which is the fail-closed reading:
 * such a block is refused at validation before it can be recorded, and if one
 * ever reached here, refusing every overlap is the stricter answer (L26547)
 * and never the answer that lets two blocks quietly coexist on one Area.
 *
 * Half-open is the load-bearing choice. A Shift ending at 14:00 and one
 * starting at 14:00 do not overlap; making the interval closed at both ends
 * would refuse every adjacent pair of Shifts on the same Area, which is the
 * ordinary shape of a working day.
 */
export function timeSegments(
  startMinutes: number,
  endMinutes: number,
): readonly (readonly [number, number])[] {
  if (endMinutes > startMinutes) return [[startMinutes, endMinutes]]
  return [
    [startMinutes, MINUTES_IN_DAY],
    [0, endMinutes],
  ]
}

export interface TimeBlock {
  readonly nominalStart: string
  readonly nominalEnd: string
}

/**
 * Does this block run past midnight into the next calendar day? The question
 * the production-date rule turns on, answered here rather than with a pair of
 * non-null assertions at a render site. An unparseable block is not crossing
 * anything, so it answers false and the validator refuses it separately.
 */
export function crossesMidnight(block: TimeBlock): boolean {
  const start = minutesFromMidnight(block.nominalStart)
  const end = minutesFromMidnight(block.nominalEnd)
  if (start === null || end === null) return false
  return end <= start
}

/** Do two nominal blocks share any instant of the 24-hour clock? */
export function blocksOverlap(a: TimeBlock, b: TimeBlock): boolean {
  const aStart = minutesFromMidnight(a.nominalStart)
  const aEnd = minutesFromMidnight(a.nominalEnd)
  const bStart = minutesFromMidnight(b.nominalStart)
  const bEnd = minutesFromMidnight(b.nominalEnd)
  // An unparseable block is refused upstream; here it can only fail closed.
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return true
  return timeSegments(aStart, aEnd).some(([as, ae]) =>
    timeSegments(bStart, bEnd).some(([bs, be]) => as < be && bs < ae),
  )
}

export interface OverlapConflict {
  readonly shift: Shift
  readonly areaId: string
}

export interface OverlapCandidate extends TimeBlock {
  /** Absent when the candidate is not yet a record — a create, not an edit. */
  readonly id?: string
  readonly areaIds: readonly string[]
}

/**
 * The first conflict a candidate block meets on an Area it wants to hold, or
 * `null`. ARCHIVED Shifts are excluded: an archived Shift no longer occupies
 * its Areas, so refusing a new Shift because a retired one once covered those
 * hours would make the Area permanently unusable — a judgement, recorded on
 * screen and not only here.
 */
export function overlapConflict(
  candidate: OverlapCandidate,
  register: readonly Shift[],
): OverlapConflict | null {
  for (const areaId of candidate.areaIds) {
    for (const other of register) {
      if (other.id === candidate.id) continue
      if (other.state !== 'active') continue
      if (!other.areaIds.includes(areaId)) continue
      if (blocksOverlap(candidate, other)) return { shift: other, areaId }
    }
  }
  return null
}

/* ------------------------------------------------------------------ *
 * AC-WF-ORG-002-04 (L52600): "An Area with no bound Shift cannot
 * receive a Job." The Job refusal belongs to slice 6; the QUERYABLE
 * state belongs here, and the location module already publishes the
 * matching `unbound` flag on the same Areas.
 * ------------------------------------------------------------------ */

export function areasWithNoBoundShift(shifts: readonly Shift[]): readonly LocationArea[] {
  return DOH_AREAS.filter(
    (area) =>
      area.state === 'active' &&
      !shifts.some((s) => s.state === 'active' && s.areaIds.includes(area.id)),
  )
}

/* ------------------------------------------------------------------ *
 * Scope. Read from the location module's ONE scope definition rather
 * than seeded again — an Area-scoped Supervisor who cannot see a node
 * on the location tree must not meet a Shift bound to it here either.
 * ------------------------------------------------------------------ */

export function shiftsVisibleTo(
  roleId: TenantRoleId,
  shifts: readonly Shift[],
): readonly Shift[] {
  const scope = SEEDED_ROLE_SCOPES[roleId]
  switch (scope.scope) {
    case 'tenant':
      return shifts
    case 'site':
      return shifts.filter((s) => scope.siteIds.includes(s.siteId))
    case 'area':
      return shifts.filter((s) => s.areaIds.some((a) => scope.areaIds.includes(a)))
    default: {
      const exhaustive: never = scope.scope
      throw new Error(`Unhandled scope on MOD-DOH-03: ${String(exhaustive)}`)
    }
  }
}

export function scopeLabelFor(roleId: TenantRoleId): string {
  return SEEDED_ROLE_SCOPES[roleId].label
}

/* ------------------------------------------------------------------ *
 * The seven-row control matrix (L27291-L27297). Every cell carries an
 * explicit status: L10238 prohibits a blank, "because a blank cell is
 * an unanswered question that an implementer will answer privately".
 * ------------------------------------------------------------------ */

/**
 * The cell-status union and the row's surface come from their ONE owner,
 * `@/surfaces/doh/modules`. Six Hub matrices shipped six identical copies of
 * this union, each with its own exhaustiveness proof; six proofs of six
 * unions prove nothing about the seventh spelling.
 *
 * THE ARRAY STAYS LOCAL, AND DELIBERATELY. The spine imports these matrices
 * to derive `rolesReaching`, so a VALUE imported back from the spine closes
 * a runtime cycle — and it closes it in the worst way: with a fixture module
 * as the entry point, the spine re-enters a sibling fixture that is still
 * mid-evaluation and reads `undefined` off it (reproduced as
 * `TypeError: Cannot read properties of undefined (reading 'map')` in
 * `permissions-roles-and-access`). A `import type` is erased and opens no
 * edge at all. The `Exclude` proof below is over the ONE union, so this
 * array is provably the whole of it and the six copies cannot drift apart.
 */
export type { ControlStatus, MatrixRowSurface } from '@/surfaces/doh/modules'

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

export type ShiftControlId =
  | 'create-shift'
  | 'edit-shift'
  | 'archive-shift'
  | 'bind-areas'
  | 'set-digest-time'
  | 'override-timezone'
  | 'view-shifts'

/** The shared Hub row shape, declared once in the spine and read by six
 *  matrices that used to declare three shapes between them. */
export type ControlMatrixRow = DohControlMatrixRow<ShiftControlId>

/**
 * WHERE THE SOURCE STATES A TOKEN AND NOTHING ELSE. The frozen table at
 * L27291-L27297 qualifies the Tenant Admin column on five of its seven rows
 * and every cell of `View Shifts`; the four other columns carry the bare
 * word on all six write rows. A cell may not be blank (L10238), and a cause
 * this build invented would read as the source's — so the cell says what the
 * source said and points at the panel that records the silence.
 */

export const CONTROL_MATRIX = [
  {
    id: 'create-shift',
    control: 'Create a Shift',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — blocked in every suspension state (L27291).',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin in the active state and disabled with the write class named in every suspension state — creation of a new Shift is blocked in all four. ABSENT for the other four roles: the prohibition is categorical and none of them can hold it in any scope.',
    effect:
      'Creates the working-time block with its nominal times and parent Site, immediately and online only. Never queued: a queued create would be a configuration write with no audit entry.',
    sourceRef: 'L27291, FUNC-DOH-03-1.1.1 L27341, L26919',
  },
  {
    id: 'edit-shift',
    control: 'Edit a Shift',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — never retroactively re-stamps completed runs (L27292).',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin while the write class is open, disabled with its reason otherwise, and refused with the rule stated when the new times would overlap another Shift on a shared Area. ABSENT for the other four.',
    effect:
      'Forward-effective only. A completed run keeps its production date, its denormalised shift reference and its metering attribution exactly as recorded. Audited at the same weight as a permission change, with before-and-after values.',
    sourceRef: 'L27292, FUNC-DOH-03-1.1.2 L27342, audit L27375, AC-30B-501 L72183',
  },
  {
    id: 'archive-shift',
    control: 'Archive a Shift',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — refused while runs are scheduled against it (L27293).',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin, and the request is refused server-side while runs are still scheduled against the Shift — the refusal raises NOTIF-DOH-03-3 to the requester rather than greying the control, because the condition is on the object and is checked on every attempt. ABSENT for the other four.',
    effect:
      'Archives the Shift once no run is scheduled against it. A Supervisor must cancel or reschedule those runs first, on a screen this slice does not build.',
    sourceRef: 'L27293, FUNC-DOH-03-1.1.3 L27343, NOTIF-DOH-03-3 L27371',
  },
  {
    id: 'bind-areas',
    control: 'Bind a Shift to Areas',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27294), stated with no qualifying words.',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'A multi-select over the parent Site’s active Areas only, so a Shift can never be made to span Sites. Refused with the rule stated when a chosen Area already holds an overlapping Shift. ABSENT for the other four.',
    effect:
      'Binds the Shift to one or more Areas. Cardinality beyond the overlap refusal is DEFERRED: DEC-SHIFT-001 is open, so no minimum and no maximum count is enforced here.',
    sourceRef: 'L27294, FUNC-DOH-03-1.2.1 L27349, AC-51-13 L113055, DEC-SHIFT-001',
  },
  {
    id: 'set-digest-time',
    control: 'Set the per-Shift digest delivery time',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed — default 06:00 (L27295).',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'One time field, pre-filled 06:00, with the platform default and the timezone it is bound to rendered beside it. ABSENT for the other four. No send control, no delivery status and no recipient list is drawn for anybody, including the Tenant Admin — delivery is another slice’s.',
    effect:
      'Registers one delivery preference on this Shift. Suppressing the digest SERVICE is explicitly prohibited for every role: a reader mutes a section, never a service.',
    sourceRef: 'L27295, FUNC-DOH-03-2.1.1 L27351, L9336, SCR-TEN-SHIFT-01 L118001',
  },
  {
    id: 'override-timezone',
    control: 'Override the inherited timezone',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Explicitly prohibited — per-Shift timezone override is deferred beyond V1 (L27296).',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'ABSENT for all five, the Tenant Admin included, and absent structurally rather than by a rule this screen applies: a Shift carries no timezone field for a control to write to. A disabled control would imply an enabled state exists for somebody, and for this one it exists for nobody.',
    effect:
      'No override path exists. The timezone is applied on read from the parent Site, and the effective timezone travels in the device’s pinned work package.',
    sourceRef: 'L27296, FUNC-DOH-03-1.2.2 L27350, AC-WF-ORG-003-01 L52637, AC-SCOPE-034 L2612',
  },
  {
    id: 'view-shifts',
    control: 'View Shifts',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'allowed-with-conditions',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27297), tenant-wide.',
      SUPERVISOR:
        'Allowed with conditions — own Site and Area scopes (L27297).',
      QUALITY_MANAGER:
        'Allowed with conditions — own scopes (L27297).',
      READONLY_AUDITOR:
        'Read-only (L27297).',
      WORKER:
        'Allowed with conditions — own assigned shift only (L27297). Met on the device: the Worker holds no Hub route (D11).',
    },
    rendering:
      'The register renders for four roles and is scope-filtered for two of them. The Auditor reads it under STATE-06 with the cause named. The Worker column is the one cell in this whole matrix granting a Worker anything, and D11 withholds every Hub route from the Worker regardless — so the grant renders on no screen. That collision is stated on this screen rather than resolved silently.',
    effect: 'A read. Reads degrade to the last loaded register when the connection drops.',
    sourceRef: 'L27297, D11 / DEC-WKRVIEW-001 L23067',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<ShiftControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/**
 * The roles a control's own matrix row gives one of the named statuses to,
 * in registry order. Every `allowedRoles` list this module hands the policy
 * evaluator is derived here, so an affordance can never be driven by a
 * hand-written role list that has quietly diverged from the matrix beside it.
 */
export function rolesWithStatus(
  controlId: ShiftControlId,
  statuses: readonly ControlStatus[],
): readonly TenantRoleId[] {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) return []
  return TENANT_ROLE_ORDER.filter((roleId) => statuses.includes(row.status[roleId]))
}

/** The two statuses that let a role ACT. Never widened to include a token
 *  that names a prohibition — see the note in `tests/unit/doh-shifts.test.ts`.
 *  `satisfies` rather than a type annotation, for the reason the sibling
 *  module records: an annotation would widen these to the whole six-token
 *  union and let a prohibition token typecheck as an acting status. */
export const ACTING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
] as const satisfies readonly ControlStatus[]

/** The three statuses that let a role READ. Same shape, same reason. */
export const READING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

/* ------------------------------------------------------------------ *
 * SB-DOH-015 (L27377) — the explainer panel beneath the editor form.
 * ------------------------------------------------------------------ */

export interface ShiftAnchor {
  readonly id: string
  readonly what: string
  readonly why: string
  readonly sourceRef: string
}

export const SHIFT_ANCHORS = [
  {
    id: 'metering',
    what: 'Usage metering',
    why: 'The Shift is the window a Worker-Shift is counted in: one unit per person per calendar shift, however many runs they touched, and one to each person who actually worked where a substitution happened. The count is a commercial figure on a billing ledger and never a measure of anybody — it is never broken down per person, never compared between people, and never shown as a pace.',
    sourceRef: 'AC-GOAL-060 L2241, AC-B11-7 L42074',
  },
  {
    id: 'production-date',
    what: 'The production date of a run that crosses midnight',
    why: 'A run that starts before midnight and finishes after it takes its production date from the Shift’s nominal date, not from the wall clock at either end and not from a server’s day. This module supplies the nominal date; run scheduling applies it, in a later slice.',
    sourceRef: 'AC-30B-502 L72184, FUNC-DOH-03-2.3.1 L27353',
  },
  {
    id: 'escalation',
    what: 'Escalation resolution',
    why: 'An escalation resolves against the pairing of Area and Shift — never against a named person. Routing targets a ROLE, and where no holder of that role is on shift the delivery falls back to the Quality Manager role and is visibly marked as a fallback rather than delivered as though it had reached its target.',
    sourceRef: 'L23316, L4267, AC-51-15 L113057',
  },
  {
    id: 'forward-only',
    what: 'Editing changes future behaviour only',
    why: 'An edit applies from the next instance of the Shift onward. A completed run keeps the production date it was stamped with, the Shift it was recorded against, and the metering attribution it earned. Nothing here reaches backwards.',
    sourceRef: 'L27310, AC-WF-ORG-003-02 L52637, AC-30B-501 L72183',
  },
] as const satisfies readonly ShiftAnchor[]

/**
 * The escalation key, as data rather than as a sentence. Slice gate 3: the
 * escalation keys on `(Area, Shift)`, never on `(Worker)`.
 */
export const ESCALATION_KEY = ['Area', 'Shift'] as const

/* ------------------------------------------------------------------ *
 * SCR-TEN-SHIFT-01 (L118001) — the digest-time field renders the
 * platform default and the bound beside it.
 * ------------------------------------------------------------------ */

export const PLATFORM_DEFAULT_DIGEST_TIME = '06:00'

/**
 * "The bound", read as the TIMEZONE ANCHOR the delivery time is bound to.
 * A schedule definition object carries an owner, a timezone anchor and a
 * misfire policy (AC-51-41, L114527); a calendar trigger is evaluated in the
 * Site's timezone, never in a server's and never in coordinated universal
 * time alone (L109563). So 06:00 without the anchor beside it is not a
 * moment at all, and the anchor is the bound the field needs.
 *
 * The competing reading — that "the bound" means a permitted window for the
 * value, an earliest and a latest — is recorded in `UNRESOLVED_IN_SOURCE`
 * and NOT implemented: the source states no such window anywhere, and a
 * numeric range invented here would read back as a requirement.
 */
export function digestTimeBoundFor(siteId: string): string | null {
  return shiftTimezone(siteId)
}

/* ------------------------------------------------------------------ *
 * DEC-SHIFT-001 — open, and the source calls it blocking for this
 * module. Rendered as the open decision it is (D6).
 * ------------------------------------------------------------------ */

export interface OpenDecisionOption {
  readonly id: 'A' | 'B' | 'C'
  readonly statement: string
  readonly adopted: boolean
}

export const SHIFT_CARDINALITY_OPTIONS = [
  {
    id: 'A',
    statement:
      'A Shift binds many Areas, an Area holds many Shifts, and no two Shifts bound to the same Area may overlap in time. The recommendation on the record, and the option this build ships as the stated mitigation.',
    adopted: true,
  },
  {
    id: 'B',
    statement:
      'A Shift binds many Areas, but an Area holds exactly one Shift at a time.',
    adopted: false,
  },
  {
    id: 'C',
    statement: 'A Shift binds exactly one Area.',
    adopted: false,
  },
] as const satisfies readonly OpenDecisionOption[]

export const SHIFT_CARDINALITY_MITIGATION =
  'Ship the Shift entity with its Site binding and its timezone inheritance, and DEFER Area cardinality (L116590). What is built here is the overlap refusal AC-51-13 already asserts as a criterion with a verifying test, and nothing more: no minimum count, no maximum count, and no rule anywhere in this module that depends on either.'

/* ------------------------------------------------------------------ *
 * Panels the per-module contract requires by name.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'A per-Shift timezone override',
    note: 'Nothing is drawn here for any role, the Tenant Admin included. The prohibition is categorical and deferred beyond this version, and it is held in the shape of the record rather than in a rule this screen applies: a Shift carries no timezone field at all, so there is nothing for a control to write to. A disabled control would imply an enabled state exists for somebody, and for this one it exists for nobody.',
  },
  {
    label: 'A per-Area timezone',
    note: 'Absent for the same reason and in the same way, one level down: an Area carries no timezone field either. A Shift therefore cannot read a timezone from its Areas even by accident — there is no such value in this workspace to read.',
  },
  {
    label: 'Suppressing the per-Shift digest service',
    note: 'Explicitly prohibited for all five tenant roles: there is exactly one digest service per Shift, and a reader mutes a section, never a service. No mute-the-service control is drawn for anybody, and the three section-level controls belong to the notifications module in a later slice.',
  },
  {
    label: 'Cell, Job and worker scoping of a Shift',
    note: 'Deferred beyond this version and no rule may depend on it, so nothing is drawn where it would sit — not even disabled, because a disabled control implies a roadmap promise the source has not made. A Shift binds Sites and Areas, and those are the only two dimensions this module knows.',
  },
  {
    label: 'Run state, a run list, or a run screen',
    note: 'A run is listed as affected BY REFERENCE only. This module exposes the reference a run denormalises and implements no run state whatever; the scheduled-run references shown against a Shift are ids and nothing more. Run scheduling and its screens belong to a later slice.',
  },
  {
    label: 'A control that changes a signed-in person’s role or session role context',
    note: 'Absent on every surface by a categorical rule, and the view switcher above is not one: it re-renders seeded fixtures from a persona’s point of view, performs no product action, changes no business state and alters no audit actor.',
  },
] as const satisfies readonly AbsentByRule[]

export const UNSPECIFIED_IN_SOURCE = [
  'A permitted format for a Shift name. The source fixes no length, no character set and no uniqueness rule, so this screen refuses only a blank name and says so where the rule is stated, rather than inventing a limit that would read back as a requirement.',
  'A minimum or maximum number of Areas on one Shift. Deliberately unbuilt rather than merely unmentioned: DEC-SHIFT-001 is open, and any count enforced here would be one of its three options chosen by an implementer instead of by the client.',
  'A shift pattern, rotation, template or per-weekday variation. Every Shift the source describes is a single nominal block that repeats identically; nothing states what a Tuesday-only Shift or a four-on-four-off rotation would even be recorded as.',
  'Any control that restores an archived Shift. Archival is described in one direction only, and no unarchive, reinstate or duplicate-from-archive affordance is named for any role.',
  'A misfire policy for the per-Shift digest — what happens to a delivery whose moment passes while the platform cannot send. Every scheduled behaviour is required to declare one, and this one terminates at an open decision, so none is asserted here.',
  'Whether an archived Shift still occupies its Areas for the overlap refusal. This screen reads it as no longer occupying them, so a retired Shift cannot make an Area permanently unusable; the source states the refusal without saying which Shifts it ranges over.',
  'Whether a Shift may name an archived Site as its parent. This screen offers only active Sites in the editor while keeping archived ones in the register filter, because the Shifts recorded under a closed facility stay readable and a new block on one would be unworkable; the source states no rule in either direction.',
  'No CAUSE is stated for six of this matrix’s seven rows in four of its five columns. The frozen table at L27291-L27297 qualifies the Tenant Admin column on five rows and every cell of View Shifts, and gives the Supervisor, the Quality Manager, the Read-only Auditor and the Worker the bare word `Explicitly prohibited` on every write row. Those cells carry the token and this note rather than a reason this build wrote for the source; the screen prose beside them is a reading, and it is labelled as one.',
  'What a Shift bound to zero Areas means operationally. It is reachable here because cardinality is deferred, and the only consequence the source states is one an Area feels rather than the Shift: an Area with no bound Shift cannot receive a Job.',
] as const satisfies readonly string[]

export const UNRESOLVED_IN_SOURCE = [
  'The overlap refusal is simultaneously an asserted acceptance criterion with a verifying test (AC-51-13, L113055, TEST-51-13) and one option of an open decision (DEC-SHIFT-001, Option A). It appears nowhere in this module’s own chapter — not in the matrix, not in the feature list, not in the nine acceptance criteria, not in the ten tests. This build ships it as the criterion it is stated to be, and renders the decision as open.',
  'DEC-SHIFT-001 is absent from the source-reconciliation artefact entirely, including from its residual-contradictions list, which does carry five sibling decisions. The one blocking decision for this module is the one the reconciliation under-reports, so an implementer reading the module chapter and the reconciliation — the two most authoritative-looking places — would never learn the question is open.',
  '"The platform default and the bound" beside the digest-time field. This build reads "the bound" as the timezone anchor the delivery time is bound to, because a scheduled behaviour is required to carry a timezone anchor and a calendar trigger must be evaluated in the Site’s timezone. The competing reading is a permitted window for the value; the source states no earliest and no latest anywhere, so none is enforced rather than one being invented.',
  'The Worker holds a scoped read on this module’s View Shifts row — the only cell in the whole matrix granting a Worker anything — while the surface decision withholds every Hub route from the Worker. The two cannot both be honoured. This build honours the surface decision and states the cost: a worker cannot see their own shift times on the web, and meets them on the device instead.',
  'A shift may not span Sites is carried in workflow prose only and is not recorded as a hard gate in the extraction, though it reads exactly like one. It is enforced here structurally — the Area multi-select is built from the parent Site’s Areas — and reported as a probable gate the extraction missed rather than treated as advisory.',
  'The archival refusal is classified Derived Clarification rather than SoW Fact, so the control itself, its refusal condition and the notification it raises are all a reading of the workflow rather than a stated requirement. It is built because the workflow states the outcome plainly, and flagged here because a client may not recognise it as their own.',
  'Whether a write this module prohibits for the Supervisor, the Quality Manager, the Auditor and the Worker should render ABSENT or DISABLED WITH ITS REASON. This build renders it ABSENT, matching the neighbouring Hub modules. The competing reading is that the control exists on this same screen for the Tenant Admin, so a refused role should open the screen and be told the rule at the moment it binds — the treatment the decision’s own worked example gives a Supervisor on a right they can never hold. The frozen source decides the same shape both ways in different places, so this is settled slice-wide rather than five times in five modules, and the rendering here may change when it is.',
  'The digest section list is stated twice and differently: a three-item list and a four-item list, in different parts of the source. Neither renders here — the sections belong to the notifications module — but whichever module builds them will have to settle which list is real.',
] as const satisfies readonly string[]

export interface DecisionOnScreen {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D6',
    statement:
      'Shift-to-Area is many-to-many with no overlap permitted on the same Area, and cardinality is otherwise deferred. DEC-SHIFT-001 is open and the source calls it blocking for this module; what ships is the mitigation the source itself wrote.',
  },
  {
    ref: 'D7',
    statement:
      'A lost connection splits three ways: content already loaded degrades with a freshness marker and an as-of time, a read that fails outright names what failed and whether anything was written, and every write control disables with a named reason. Nothing on this surface ever queues a write.',
  },
  {
    ref: 'D11',
    statement:
      'The Worker holds no Hub screen, so the scoped read this module’s matrix grants a Worker renders nowhere. The cost is stated rather than hidden: a worker without a device in hand cannot check their own shift times.',
  },
  {
    ref: 'D19',
    statement:
      'Five operating tenant states gate the writes here, and a pilot workspace is a flag across them rather than a sixth state.',
  },
  {
    ref: 'D21',
    statement:
      'A Shift is active or archived — two states, from the module identity card, over three conflicting vocabularies elsewhere in the source. An Area’s unbound flag is a flag on active and not a third state, and this module is what sets and clears it.',
  },
  {
    ref: 'D25',
    statement:
      'Site is mandatory and a default Site exists before any Tenant Admin signs in, which is why a Shift always has a Site to inherit a timezone from. There is no Shift with no Site, and no path here that could create one.',
  },
] as const satisfies readonly DecisionOnScreen[]

/**
 * The moment the seeded register was last true. A literal: no clock is read
 * anywhere in this module, and a fixture's honesty comes from saying when it
 * was true rather than from looking current.
 */
export const REGISTER_AS_OF = '2026-08-18 05:12 Europe/London'

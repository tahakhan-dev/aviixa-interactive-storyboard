/**
 * The SURF-STU state model. Spec §2 S4, D22 — the applicable subset of the
 * platform's thirteen-state contract, with the four departures L48330
 * states for this surface.
 *
 * Shaped after `@/surfaces/doh/tenant-state`: ONE data table, not scattered
 * conditionals. `screensWithState` below does nothing but read a row. That
 * property is why a reviewer can verify the whole ruling in one read, and
 * it is why eighteen module screens cannot each re-derive it differently.
 *
 * The thirteen states themselves are NOT redefined here — `ScreenStateId`
 * and the default rendering of each already live in `@/ui/screen-state`
 * (frozen source L48000-L48014). This module records only where this
 * surface differs, which is exactly what the contract asks a surface to do.
 */
import type { ScreenStateId } from '@/ui/screen-state'

/**
 * Catalogue B, the fifteen Studio screens, in the source's own order
 * (L48259-L48273). Ids ONLY: the names, purposes, roles and navigation
 * entry points are the screen catalogue's, and that catalogue is
 * `src/studio/screens.ts`. Duplicating them here would create a second
 * copy that drifts; the state model needs nothing but the keys.
 *
 * L48330 opens "All fifteen screens render the contract defaults", so the
 * count is load-bearing rather than incidental.
 */
export type StudioScreenId =
  | 'SCR-STU-01' | 'SCR-STU-02' | 'SCR-STU-03' | 'SCR-STU-04' | 'SCR-STU-05'
  | 'SCR-STU-06' | 'SCR-STU-07' | 'SCR-STU-08' | 'SCR-STU-09' | 'SCR-STU-10'
  | 'SCR-STU-11' | 'SCR-STU-12' | 'SCR-STU-13' | 'SCR-STU-14' | 'SCR-STU-15'

export const STU_SCREEN_IDS = [
  'SCR-STU-01', 'SCR-STU-02', 'SCR-STU-03', 'SCR-STU-04', 'SCR-STU-05',
  'SCR-STU-06', 'SCR-STU-07', 'SCR-STU-08', 'SCR-STU-09', 'SCR-STU-10',
  'SCR-STU-11', 'SCR-STU-12', 'SCR-STU-13', 'SCR-STU-14', 'SCR-STU-15',
] as const satisfies readonly StudioScreenId[]

type MissingFromScreenIds = Exclude<StudioScreenId, (typeof STU_SCREEN_IDS)[number]>
const _screenIdsExhaustive: MissingFromScreenIds extends never ? true : never = true
void _screenIdsExhaustive

export interface StudioStateApplicability {
  readonly id: ScreenStateId
  /**
   * `'all'` for a contract default — every one of the fifteen. Otherwise the
   * exact screens the source names, and no others. Encoding the NARROW set
   * rather than an exclusion list matches how L48330 states the departures
   * ("applies only on `SCR-STU-04` and `SCR-STU-11`") and keeps a widening
   * from being one forgotten exclusion away.
   */
  readonly screens: 'all' | readonly StudioScreenId[]
  /** The source's departure wording, or `null` where the default stands. */
  readonly departure: string | null
  readonly sourceRef: string
}

// Declared as explicitly-typed constants rather than bare literals inside
// the table, for the same reason `SOFT_SUSPENSION_OPEN` is in
// `@/surfaces/doh/tenant-state`: `as const satisfies` on the table would
// otherwise freeze each list into its own narrow tuple type, and a union of
// differently-shaped tuples makes `.includes()` uncallable with a plain
// `StudioScreenId`.
const PUBLICATION_SCREENS: readonly StudioScreenId[] = ['SCR-STU-04', 'SCR-STU-11']
const DRAFTING_AID_SCREENS: readonly StudioScreenId[] = ['SCR-STU-04', 'SCR-STU-13']

/**
 * THE APPLICABILITY TABLE. Twelve rows — the thirteen contract states less
 * `STATE-07`, which renders NOWHERE on this surface (D22) and is recorded
 * in `STU_EXCLUDED_STATES` below rather than carried here with an empty
 * screen list. A row with no screens and a row that must not exist read the
 * same at a glance, and only one of them is true.
 */
export const STU_APPLICABLE_STATES = [
  { id: 'STATE-01', screens: 'all', departure: null, sourceRef: 'L48007-L48014, L48330' },
  { id: 'STATE-02', screens: 'all', departure: null, sourceRef: 'L48007-L48014, L48330' },
  { id: 'STATE-03', screens: 'all', departure: null, sourceRef: 'L48007-L48014, L48330' },
  {
    id: 'STATE-04',
    screens: 'all',
    // Departure 4 of 4. The weight is the point: a warning can be clicked
    // past, a blocker cannot, and publishing an incomplete locale is how a
    // worker meets a screen in a language they do not read.
    departure:
      'Validation on this surface carries a special weight: the locale completeness check and ' +
      'the missing-severity-mapping check are publication blockers, not warnings.',
    sourceRef: 'L48330',
  },
  { id: 'STATE-05', screens: 'all', departure: null, sourceRef: 'L48007-L48014, L48330' },
  { id: 'STATE-06', screens: 'all', departure: null, sourceRef: 'L48007-L48014, L48330' },
  {
    id: 'STATE-08',
    screens: 'all',
    // Not itself a departure L48330 enumerates; it is what D4 puts in
    // STATE-07's place for content that had already loaded.
    departure: null,
    sourceRef: 'L48007-L48014, D4',
  },
  {
    id: 'STATE-09',
    screens: PUBLICATION_SCREENS,
    // Departure 2 of 4.
    departure:
      'Queued applies only on SCR-STU-04 and SCR-STU-11 at publication, where the new version’s ' +
      'distribution to devices renders in command state rather than as complete.',
    sourceRef: 'L48330',
  },
  {
    id: 'STATE-10',
    screens: DRAFTING_AID_SCREENS,
    // Departure 3 of 4, first half. Slice 4's Hub renders neither of these
    // anywhere; copying that table onto this surface is the available
    // mistake, and it would hide a degraded drafting aid from the author.
    departure:
      'Applies on SCR-STU-04 and SCR-STU-13: when the drafting aid is degraded the author writes ' +
      'all three difficulty levels manually and the panel says so, because the platform’s ' +
      'artificial intelligence accelerates authoring and never publishes.',
    sourceRef: 'L48330',
  },
  {
    id: 'STATE-11',
    screens: DRAFTING_AID_SCREENS,
    // Departure 3 of 4, second half. Kept as its own row rather than folded
    // into STATE-10: degraded and unavailable are two of the four things the
    // contract exists to keep apart (L48007).
    departure:
      'Applies on SCR-STU-04 and SCR-STU-13: when the drafting aid is unavailable the author ' +
      'writes all three difficulty levels manually and the panel says so, because the platform’s ' +
      'artificial intelligence accelerates authoring and never publishes.',
    sourceRef: 'L48330',
  },
  {
    id: 'STATE-12',
    screens: 'all',
    departure: null,
    sourceRef: 'L48007-L48014, L48330, D4',
  },
  { id: 'STATE-13', screens: 'all', departure: null, sourceRef: 'L48007-L48014, D4' },
] as const satisfies readonly StudioStateApplicability[]

export interface StudioExcludedState {
  readonly id: ScreenStateId
  /** The state that renders in its place. Never `null` — a state removed
   *  without a replacement is a hole in the contract, not a departure. */
  readonly replacedBy: ScreenStateId
  readonly reason: string
  readonly sourceRef: string
}

/**
 * D22. `STATE-07` renders nowhere on `SURF-STU`, and this is where a screen
 * reads WHY and WHAT INSTEAD. `@/ui/screen-state` already marks STATE-07
 * `frontlineOnly`; L48330 adds the surface-specific replacement, which the
 * global flag does not carry.
 */
export const STU_EXCLUDED_STATES = [
  {
    id: 'STATE-07',
    replacedBy: 'STATE-12',
    reason:
      'Offline is not applicable anywhere on this surface, because authoring requires a ' +
      'connection; a lost connection renders STATE-12 with unsaved-work protection.',
    sourceRef: 'L48330 (and L30835: the Studio requires connectivity)',
  },
] as const satisfies readonly StudioExcludedState[]

export interface StudioStateDeparture {
  /** Every state this one departure covers. STATE-10 and STATE-11 share one
   *  sentence in the source and are one departure, not two. */
  readonly states: readonly ScreenStateId[]
  readonly summary: string
  readonly sourceRef: string
}

/**
 * The four, as the source counts them: "All fifteen screens render the
 * contract defaults with four stated departures" (L48330). Kept as its own
 * list because the count is a claim a screen makes — a fifth entry here is
 * a fifth departure invented.
 */
export const STU_STATE_DEPARTURES = [
  {
    states: ['STATE-07'],
    summary: 'STATE-07 offline is not applicable anywhere; a lost connection renders STATE-12.',
    sourceRef: 'L48330',
  },
  {
    states: ['STATE-09'],
    summary: 'STATE-09 queued applies only on SCR-STU-04 and SCR-STU-11, at publication.',
    sourceRef: 'L48330',
  },
  {
    states: ['STATE-10', 'STATE-11'],
    summary: 'STATE-10 and STATE-11 apply on SCR-STU-04 and SCR-STU-13, the drafting-aid touchpoints.',
    sourceRef: 'L48330',
  },
  {
    states: ['STATE-04'],
    summary:
      'STATE-04 validation carries a special weight: the locale completeness and ' +
      'missing-severity-mapping checks are publication blockers, not warnings.',
    sourceRef: 'L48330',
  },
] as const satisfies readonly StudioStateDeparture[]

/**
 * The one reader every Studio screen calls. It takes its register AS A
 * PARAMETER, defaulting to the table above but never closing over a
 * module-load snapshot of it — the defect that shipped three times in
 * slice 4 was exactly a reader bound to a snapshot taken at import.
 *
 * A state the register does not carry has NO screens. Absent means absent:
 * treating an unknown state as a contract default would put STATE-07 back
 * on all fifteen screens the moment its row went missing.
 */
export function screensWithState(
  state: ScreenStateId,
  register: readonly StudioStateApplicability[] = STU_APPLICABLE_STATES,
): readonly StudioScreenId[] {
  const row = register.find((r) => r.id === state)
  if (!row) return []
  return row.screens === 'all' ? STU_SCREEN_IDS : row.screens
}

/**
 * Whether one screen renders one state. The same row `screensWithState`
 * reads — no screen may re-derive this with its own `.includes()`.
 */
export function screenRendersState(
  screen: StudioScreenId,
  state: ScreenStateId,
  register: readonly StudioStateApplicability[] = STU_APPLICABLE_STATES,
): boolean {
  return screensWithState(state, register).includes(screen)
}

/**
 * The Studio connectivity ruling. Spec §2 S5, D4.
 *
 * THE PROBLEM THIS FILE SETTLES. Three parts of the frozen source describe
 * what the Studio does when it loses its connection, and they do not agree:
 *
 *   L48014  the three web surfaces "render a connection-lost banner and
 *           enter STATE-08 or STATE-13, because they have no offline mode";
 *   L48330  "a lost connection renders STATE-12 with unsaved-work protection";
 *   L30839  chapter 20's own state machine names four postures that are none
 *   -L30851 of the thirteen — Connected, Degraded, ReadOnlyCache, Suspended —
 *           and FB-STU-01 (L30863) adds "an explicit disconnected state" with
 *           a local draft buffer, submit disabled, and "no save has been
 *           recorded".
 *
 * No `DEC-*` identifier exists for this, so under APP-012 the pick is a
 * client-delegated choice and all three readings ship on screen with their
 * locators (`STU_CONNECTIVITY_READINGS`).
 *
 * THE RULING. The three readings are not alternatives about ONE situation;
 * they answer three different questions, and the distinction that reconciles
 * them is WHAT A SCREEN MAY STILL CLAIM when it can no longer confirm:
 *
 *   content that had already loaded  -> STATE-08, freshness stated, never
 *                                       presented as current (L48014);
 *   a read that failed outright      -> STATE-12, naming what failed and
 *                                       whether anything was written (L48330);
 *   every write control              -> DISABLED with a named reason, and
 *                                       NEVER QUEUED (L30835, D9 sense A);
 *   the editor                       -> the explicit disconnected state with
 *                                       the local buffer and the plain
 *                                       statement that no save has been
 *                                       recorded (L30863, AC-STU-009);
 *   reconnection                     -> STATE-13, structural validation
 *                                       re-running IN FULL before submission
 *                                       re-enables (L48014, L32152).
 *
 * Nothing on this surface ever queues a write. The Studio is not in the path
 * of the factory floor, so there is no continuity to preserve — only honesty.
 */
import type { ScreenStateId } from '@/ui/screen-state'

export type StudioConnectivityKind =
  | 'loaded-content'
  | 'failed-read'
  | 'write-control'
  | 'editor'
  | 'reconnect'

/**
 * Every treatment carries `kind`, `queued` and `sourceRef`. `queued` is on
 * the SHARED part deliberately: "never queued" is a property of the ruling,
 * not of one branch of it, so a sixth treatment cannot be added without
 * answering the question.
 */
interface StudioTreatmentBase {
  readonly kind: StudioConnectivityKind
  /** Always `false`. Typed as `false`, not `boolean`, so a `true` will not
   *  compile — the constraint is enforced by the checker, not by a test. */
  readonly queued: false
  readonly reason: string
  readonly sourceRef: string
}

export interface StudioLoadedContentTreatment extends StudioTreatmentBase {
  readonly kind: 'loaded-content'
  readonly state: Extract<ScreenStateId, 'STATE-08'>
  /** The screen MUST render an as-of marker. The marker text is the screen's
   *  own, built from the as-of stamp its data carries — this module derives
   *  nothing from time and reads no clock. */
  readonly freshness: 'required'
  readonly presentedAsCurrent: false
}

export interface StudioFailedReadTreatment extends StudioTreatmentBase {
  readonly kind: 'failed-read'
  readonly state: Extract<ScreenStateId, 'STATE-12'>
  readonly namesWhatFailed: true
  readonly namesWhetherAnythingWasWritten: true
}

export interface StudioWriteControlTreatment extends StudioTreatmentBase {
  readonly kind: 'write-control'
  /** D9 sense A. DISABLED with the condition named — never absent, because
   *  an absent control and a refused one say different things, and never
   *  enabled-then-queued, because the Studio has no queue. */
  readonly render: 'disabled'
}

export interface StudioEditorTreatment extends StudioTreatmentBase {
  readonly kind: 'editor'
  readonly state: Extract<ScreenStateId, 'STATE-12'>
  readonly localBuffer: true
  readonly submitDisabled: true
  readonly publishDisabled: true
  /** The exact sentence FB-STU-01 requires. Never a save confirmation:
   *  AC-STU-009 — "The Studio never displays a save confirmation for a write
   *  that did not durably commit." */
  readonly message: string
}

export interface StudioReconnectTreatment extends StudioTreatmentBase {
  readonly kind: 'reconnect'
  readonly state: Extract<ScreenStateId, 'STATE-13'>
  /** L32152: in FULL, not incrementally. A validation result computed before
   *  a dependency changed is stale data, and acting on it silently produces
   *  a wrong result. */
  readonly revalidate: 'full'
  /** Submission stays disabled until the full re-validation completes. */
  readonly submissionReenabled: false
}

export type StudioConnectivityTreatment =
  | StudioLoadedContentTreatment
  | StudioFailedReadTreatment
  | StudioWriteControlTreatment
  | StudioEditorTreatment
  | StudioReconnectTreatment

/**
 * THE TREATMENT TABLE. One data structure; `studioConnectivityTreatment`
 * below does nothing but read a row.
 */
export const STU_CONNECTIVITY_TREATMENTS = [
  {
    kind: 'loaded-content',
    state: 'STATE-08',
    freshness: 'required',
    presentedAsCurrent: false,
    queued: false,
    reason:
      'The connection is lost, so this content cannot be confirmed as current. It is shown with ' +
      'its age and its origin, and it is not being refreshed.',
    sourceRef: 'L48014 (STATE-08), L48007 (stale content is never presented as current), D4',
  },
  {
    kind: 'failed-read',
    state: 'STATE-12',
    namesWhatFailed: true,
    namesWhetherAnythingWasWritten: true,
    queued: false,
    reason:
      'The read failed outright, so there is nothing to degrade. The screen names what failed, ' +
      'whether anything was written, and the next step.',
    sourceRef: 'L48013 (STATE-12), L48330, D4',
  },
  {
    kind: 'write-control',
    render: 'disabled',
    queued: false,
    reason:
      'Unavailable — the Studio requires an active connection. The action is not queued: nothing ' +
      'on this surface holds a write to replay later.',
    sourceRef: 'L30835 (SoW §5.1.3), MOD-STU-18 row 23, D9 sense A, D4',
  },
  {
    kind: 'editor',
    state: 'STATE-12',
    localBuffer: true,
    submitDisabled: true,
    publishDisabled: true,
    queued: false,
    message:
      'Connection lost. Your unsaved edits are held in a local draft buffer in this browser ' +
      'session, and no save has been recorded. Submit and publish are disabled until the ' +
      'connection returns.',
    reason:
      'FB-STU-01’s first fallback: an explicit disconnected state with the author’s unsaved edits ' +
      'in a local draft buffer. The buffer is not a queue — nothing is submitted from it, and the ' +
      'last durably persisted draft remains the terminal safe state.',
    sourceRef: 'L30863 (FB-STU-01), L30871 (AC-STU-009), L48330',
  },
  {
    kind: 'reconnect',
    state: 'STATE-13',
    revalidate: 'full',
    submissionReenabled: false,
    queued: false,
    reason:
      'Structural validation re-runs in full before submission is re-enabled, because a validation ' +
      'result computed before a dependency changed is stale data — a branch target that validated ' +
      'before another author deleted the target screen is the example the source gives.',
    sourceRef: 'L32152, L48014 (STATE-13), D4',
  },
] as const satisfies readonly StudioConnectivityTreatment[]

type MissingFromTreatments = Exclude<
  StudioConnectivityKind,
  (typeof STU_CONNECTIVITY_TREATMENTS)[number]['kind']
>
const _treatmentsExhaustive: MissingFromTreatments extends never ? true : never = true
void _treatmentsExhaustive

/** Maps each kind to its row's exact literal type, so a caller that passes
 *  `{ kind: 'editor' }` gets `StudioEditorTreatment` back rather than the
 *  union — no narrowing dance at eighteen call sites. */
type TreatmentFor<K extends StudioConnectivityKind> = Extract<
  (typeof STU_CONNECTIVITY_TREATMENTS)[number],
  { kind: K }
>

/**
 * The one function every Studio screen calls when the connection is gone.
 * Reads ONE row of the table above; no branch anywhere else may re-derive
 * this decision. Takes its register AS A PARAMETER, never a module-load
 * snapshot — five rows, so a linear scan, and no index to fall out of step.
 */
export function studioConnectivityTreatment<K extends StudioConnectivityKind>(
  input: { readonly kind: K },
  register: readonly StudioConnectivityTreatment[] = STU_CONNECTIVITY_TREATMENTS,
): TreatmentFor<K> {
  // `_treatmentsExhaustive` above proves every kind has a row of the default
  // register, so this cast is discharged by the compiler rather than by hope.
  return register.find((t) => t.kind === input.kind) as TreatmentFor<K>
}

/* ------------------------------------------------------------------ *
 * The three readings, disclosed rather than reconciled away.
 * ------------------------------------------------------------------ */

export interface StudioConnectivityReading {
  readonly label: string
  readonly reading: string
  readonly sourceRef: string
  readonly chosen: boolean
  /** Non-empty only on the chosen reading: what a screen prints to say the
   *  pick was made under delegated authority, not found in the source. */
  readonly disclosure: string
}

export const STU_CONNECTIVITY_READINGS = [
  {
    label: 'Stale or recovering',
    reading:
      'The three web surfaces render a connection-lost banner and enter STATE-08 or STATE-13, ' +
      'because they have no offline mode.',
    sourceRef: 'L48014',
    chosen: false,
    disclosure: '',
  },
  {
    label: 'Failure with unsaved-work protection',
    reading:
      'STATE-07 offline is not applicable anywhere on this surface, because authoring requires a ' +
      'connection; a lost connection renders STATE-12 with unsaved-work protection.',
    sourceRef: 'L48330',
    chosen: false,
    disclosure: '',
  },
  {
    label: 'A four-posture connectivity machine',
    reading:
      'Connected, Degraded, ReadOnlyCache and Suspended — four postures that are none of the ' +
      'thirteen contract states, with FB-STU-01’s explicit disconnected state and local draft ' +
      'buffer attached to Degraded.',
    sourceRef: 'L30839-L30851, L30863',
    chosen: false,
    disclosure: '',
  },
  {
    label: 'D4 — the split by what the screen may still claim',
    reading:
      'All three hold at once, over different situations: loaded content degrades to STATE-08 ' +
      'with its freshness stated, a failed read is STATE-12 naming what failed and whether ' +
      'anything was written, every write control is disabled with a named reason and never ' +
      'queued, the editor holds the explicit disconnected state with the local buffer and no ' +
      'save recorded, and reconnection is STATE-13 with structural validation re-run in full.',
    sourceRef: 'L48014 + L48330 + L30842 read together',
    chosen: true,
    disclosure:
      'No DEC-* identifier exists for this conflict. This is a client-delegated choice made under ' +
      'APP-012; the three source readings above are shown with their locators so the choice can be ' +
      'reviewed rather than assumed settled.',
  },
] as const satisfies readonly StudioConnectivityReading[]

/* ------------------------------------------------------------------ *
 * Chapter 20's four-posture machine (L30839-L30851), kept as data.
 * ------------------------------------------------------------------ */

/**
 * These four are NOT screen states and are never rendered as one — that is
 * precisely why D4 was needed. They are kept because the source draws the
 * machine, a screen may need to explain the posture it is in, and a
 * transition the diagram does not draw must be REFUSED rather than left
 * undefined.
 */
export type StudioPosture = 'Connected' | 'Degraded' | 'ReadOnlyCache' | 'Suspended'

export const STU_CONNECTIVITY_POSTURES = [
  'Connected',
  'Degraded',
  'ReadOnlyCache',
  'Suspended',
] as const satisfies readonly StudioPosture[]

type MissingFromPostures = Exclude<StudioPosture, (typeof STU_CONNECTIVITY_POSTURES)[number]>
const _posturesExhaustive: MissingFromPostures extends never ? true : never = true
void _posturesExhaustive

export interface StudioPostureRow {
  readonly posture: StudioPosture
  readonly meaning: string
  /** Only `Connected` permits a write. Degraded holds a LOCAL buffer, which
   *  is not a write and is never replayed as one. */
  readonly permitsWrite: boolean
}

export const STU_POSTURE_ROWS = [
  {
    posture: 'Connected',
    meaning: 'Studio fully operational, authoring and publication available',
    permitsWrite: true,
  },
  {
    posture: 'Degraded',
    meaning: 'Connection lost, local draft buffer active, no save confirmed',
    permitsWrite: false,
  },
  {
    posture: 'ReadOnlyCache',
    meaning: 'Published content readable from the last retrieved state',
    permitsWrite: false,
  },
  {
    posture: 'Suspended',
    meaning: 'Authoring suspended, published content unchanged, runs continue',
    permitsWrite: false,
  },
] as const satisfies readonly StudioPostureRow[]

type MissingFromPostureRows = Exclude<StudioPosture, (typeof STU_POSTURE_ROWS)[number]['posture']>
const _postureRowsExhaustive: MissingFromPostureRows extends never ? true : never = true
void _postureRowsExhaustive

export function posturePermitsWrite(
  posture: StudioPosture,
  register: readonly StudioPostureRow[] = STU_POSTURE_ROWS,
): boolean {
  // An unrecognised posture permits nothing. Same stricter-interpretation
  // default as the Hub's tenant gate: refusing is the safe direction.
  return register.find((r) => r.posture === posture)?.permitsWrite ?? false
}

export interface StudioPostureTransition {
  readonly from: StudioPosture
  readonly to: StudioPosture
  /** The source's own trigger wording, which is what a screen renders. */
  readonly trigger: string
}

/**
 * THE SIX ARROWS THE SOURCE DRAWS, and only those. The other ten of the
 * sixteen ordered pairs — including all four self-transitions — are refused
 * by `studioPostureTransition` below. A transition absent from the diagram
 * is not "unspecified, therefore allowed".
 */
export const STU_POSTURE_TRANSITIONS = [
  { from: 'Connected', to: 'Degraded', trigger: 'connection lost during an authoring session' },
  { from: 'Degraded', to: 'Connected', trigger: 'connection restored and draft revision reconciled' },
  { from: 'Degraded', to: 'ReadOnlyCache', trigger: 'session times out before restoration' },
  { from: 'ReadOnlyCache', to: 'Connected', trigger: 'connection restored and content re-fetched' },
  { from: 'ReadOnlyCache', to: 'Suspended', trigger: 'content service unreachable' },
  { from: 'Suspended', to: 'Connected', trigger: 'service restored and dependencies re-validated' },
] as const satisfies readonly StudioPostureTransition[]

/** A typed failure, never an exception: an unrecognised or undrawn
 *  transition is an expected path here, not a programmer error. */
export type StudioPostureRuling =
  | { readonly allowed: true; readonly trigger: string }
  | { readonly allowed: false; readonly reason: string }

export function studioPostureTransition(
  from: StudioPosture,
  to: StudioPosture,
  register: readonly StudioPostureTransition[] = STU_POSTURE_TRANSITIONS,
): StudioPostureRuling {
  const arrow = register.find((t) => t.from === from && t.to === to)
  if (arrow) return { allowed: true, trigger: arrow.trigger }
  return {
    allowed: false,
    reason:
      `${from} to ${to} is not a transition the Studio connectivity machine draws ` +
      '(frozen source L30843-L30850).',
  }
}

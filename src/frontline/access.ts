import {
  decide,
  isRefusal,
  type PermissionDecision,
  type PermissionOutcome,
} from '@/policy/decision'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'

/**
 * `evaluateFrontlineAccess` — the Frontline's ONLY access entry point.
 * LAYERED on slice 3's `evaluateAccess` (`@/policy/evaluate`), never a fork
 * of it, exactly as `evaluateStudioAccess` is.
 *
 * THE ONE THING THIS LAYER ADDS, AND IT IS THE WHOLE REASON IT EXISTS.
 * `evaluateAccess` answers "may this actor do this?" and refuses with
 * `unavailable` when the connection is missing (`OFFLINE_NOT_AUTHORISED`).
 * That is right for the three web surfaces and WRONG HERE. The Frontline is
 * offline-first by construction (L39020, L39905), `AC-FL-000-4` (L39099)
 * requires identical outcomes with the network disabled, and the durable
 * upload queue (L39585) exists precisely so a write taken with no network is
 * ACCEPTED rather than refused.
 *
 * So this layer converts a PERMITTED act performed offline into the outcome
 * that describes what actually happened to it — `queuedOffline` for a write,
 * `cachedReadOnlyOffline` for a read served from the local store — and it
 * converts a REFUSAL into nothing at all. A refusal stays a refusal; going
 * offline never widens what anyone may do.
 *
 * FIRST SURFACE WHERE THOSE TWO OF THE NINE ARE LOAD-BEARING. The Studio
 * excludes both BY CONSTRUCTION and says so in its own words at
 * `src/studio/access/evaluate.ts:150`: "Every write control → DISABLED with a
 * named reason, never queued. Nothing on this surface ever queues a write."
 * That is the Studio's ruling for the Studio's surface and it is correct
 * there. REUSE THE SHAPE, NEVER THE RULING — the Studio is not in the path of
 * the factory floor, and this surface is.
 *
 * TWO INPUTS THE STUDIO'S EVALUATOR HAS NO EQUIVALENT FOR:
 *
 *  - `intent` — whether the act is a READ or a WRITE. The two produce
 *    different outcomes for the same permission on the same offline device,
 *    and nothing in `AccessRequest` distinguishes them. It is REQUIRED, not
 *    optional: a caller that has not decided which it is cannot be given a
 *    default, because the default would be wrong half the time.
 *  - `servedFromLocalStore` — whether the read this request covers is being
 *    answered from the on-device store. `L48014`'s STATE-08 rule and
 *    `AC-FL-010-5`'s persistent sync indicator both turn on it.
 */

/**
 * Every outcome this surface can produce. All nine, unlike the Studio's six
 * — and derived with `Extract` from the platform union so a rename over
 * there fails to compile here rather than splitting the vocabulary.
 */
export type FrontlineEffectiveOutcome = Extract<PermissionOutcome, PermissionOutcome>

/**
 * The SEVEN tokens the twelve Frontline permission matrices actually use.
 * Counted off the source: 332 `Explicitly prohibited`, 92 `Not applicable`,
 * 55 `Allowed`, 27 `Allowed with conditions`, 15 `Unavailable`, 11 `Client
 * Decision Required`, 7 `Read-only` — 539 tokens over 539 cells.
 *
 * `queuedOffline` and `cachedReadOnlyOffline` are absent from THIS union and
 * present in the one above, and the difference is exact: no matrix CELL
 * carries either token, and both are outcomes the evaluator PRODUCES when a
 * permitted act meets a device with no connection.
 */
export type FrontlineMatrixOutcome = Extract<
  PermissionOutcome,
  | 'allowed'
  | 'allowedWithConditions'
  | 'readOnly'
  | 'unavailable'
  | 'explicitlyProhibited'
  | 'clientDecisionRequired'
  | 'notApplicable'
>

export const FRONTLINE_MATRIX_OUTCOMES = [
  'allowed',
  'allowedWithConditions',
  'readOnly',
  'unavailable',
  'explicitlyProhibited',
  'clientDecisionRequired',
  'notApplicable',
] as const satisfies readonly FrontlineMatrixOutcome[]

type MissingFromMatrixOutcomes = Exclude<
  FrontlineMatrixOutcome,
  (typeof FRONTLINE_MATRIX_OUTCOMES)[number]
>
const _matrixOutcomesExhaustive: MissingFromMatrixOutcomes extends never ? true : never = true
void _matrixOutcomesExhaustive

/** A read and a write are different acts offline. Required, never defaulted. */
export type FrontlineIntent = 'read' | 'write'

export interface FrontlineAccessContext extends AccessContext {
  readonly intent: FrontlineIntent
  /**
   * Whether the READ this request covers is answered from the on-device
   * store. Meaningless for a write and typed as required anyway, because a
   * caller that has not thought about it is exactly the caller that would
   * present stale content as current.
   */
  readonly servedFromLocalStore: boolean
}

/**
 * A Frontline request. `requiresOnline` is DELIBERATELY ABSENT from the
 * type: declaring it on this surface is how the deterministic safety layer
 * gets gated behind a connectivity check, which L40948 exists to forbid —
 * "A Severity 1 hold fires immediately, even offline; the lot is protected
 * from the moment of the breach, not from the moment of sync."
 *
 * A Frontline act that genuinely cannot happen offline says so through
 * `forcesSyncFirst` instead, which is the source's own mechanism (L48668:
 * "Beyond the tenant's window, a synchronisation is forced before designated
 * high-risk actions such as sign-off") and which is NOT a refusal — it names
 * a step, not a denial.
 */
export type FrontlineAccessRequest = Omit<AccessRequest, 'requiresOnline'> & {
  readonly requiresOnline?: never
  /**
   * The designated high-risk acts of L48668. A forced sync is a precondition
   * the worker can satisfy, so it produces `allowedWithConditions` with the
   * condition stated, never `unavailable`.
   */
  readonly forcesSyncFirst?: boolean
}

export function evaluateFrontlineAccess(
  req: FrontlineAccessRequest,
  ctx: FrontlineAccessContext,
): PermissionDecision {
  // The platform evaluator answers the permission question and nothing here
  // may re-answer it. `requiresOnline` is not passed because the type has
  // no room for it; a Frontline act is never refused for being offline.
  const base = evaluateAccess(req as AccessRequest, ctx)

  // A REFUSAL IS NEVER WIDENED. Going offline does not grant anything, and
  // this early return is what makes that true rather than a claim: every
  // branch below is unreachable for a refused request.
  if (isRefusal(base)) return base

  // `notApplicable` carries a required stated reason and is not a refusal in
  // the platform's own reading (`isRefusal` returns true for it, so this is
  // already handled above) — noted so the next reader does not add a branch.

  /**
   * THE FORCED SYNC IS ASKED BEFORE CONNECTIVITY, NOT INSIDE IT.
   *
   * This check sat inside the `ctx.online` branch below, so a permitted write
   * taken offline fell through to the queue and came back `queuedOffline` —
   * whatever the act was. For a designated high-risk act that is the wrong
   * answer in the source's own words:
   *
   * The rule is stated at L40224: "Step-up for a forced-sync action does not
   * proceed offline, because the whole point of forcing the sync is that the
   * identities and authority those actions record are fresh, not stale
   * cache."
   *
   * It is told as a story at L40307: "the sign-off does not proceed on stale
   * cache; the step waits."
   *
   * `FUNC-B9-03-1-2` states it as a functionality at L41706, and `TEST-B9-7`
   * at L41765 asks for a test asserting that NO PARTIAL SIGN-OFF RECORD IS
   * CREATED — and a queued sign-off is exactly such a record.
   *
   * `MOD-FL-A1` and `MOD-FL-B9` found this independently, from different
   * sections, while wave 0 was already committed.
   *
   * The outcome stays `allowedWithConditions` in both connectivity states,
   * and that is the point rather than an oversight: a forced sync names a
   * STEP, not a denial. What changes is which step, and whether the worker
   * can take it now. Refusing offline instead would make connectivity a
   * gate on authority, which is the shape L40948 exists to forbid.
   */
  if (req.forcesSyncFirst === true) {
    return ctx.online
      ? decide(
          'allowedWithConditions',
          'CONDITIONS_APPLY',
          'This action needs current qualification information, so the device synchronises before it runs.',
          {
            stage: 'DEVICE_AND_CONNECTIVITY',
            sourceRefs: [...req.sourceRefs, 'L48668'],
            auditExpectation: 'RECORDED',
            conditionToEnable: 'A synchronisation completes first.',
          },
        )
      : decide(
          'allowedWithConditions',
          'CONDITIONS_APPLY',
          'This action records who authorised it, so it needs a fresh check with the server first. The device has no connection, so the step waits rather than being recorded now.',
          {
            stage: 'DEVICE_AND_CONNECTIVITY',
            sourceRefs: [...req.sourceRefs, 'L48668', 'L40224', 'L40307'],
            auditExpectation: 'RECORDED',
            conditionToEnable: 'The device reaches the server and the forced synchronisation completes.',
          },
        )
  }

  if (ctx.online) return base

  // OFFLINE, AND PERMITTED. This is the whole of the layer.
  if (ctx.intent === 'write') {
    return decide(
      'queuedOffline',
      'QUEUED_WHILE_OFFLINE',
      undefined,
      {
        stage: 'DEVICE_AND_CONNECTIVITY',
        sourceRefs: [...req.sourceRefs, 'L39585', 'L48669'],
        auditExpectation: 'RECORDED',
        conditionToEnable: 'The device reaches the server on its next synchronisation.',
      },
    )
  }

  if (ctx.servedFromLocalStore) {
    return decide(
      'cachedReadOnlyOffline',
      'CACHED_WHILE_OFFLINE',
      undefined,
      {
        stage: 'DEVICE_AND_CONNECTIVITY',
        sourceRefs: [...req.sourceRefs, 'L40035', 'L48667'],
        auditExpectation: 'NOT_AUDITED',
        conditionToEnable: 'The device reaches the server on its next synchronisation.',
      },
    )
  }

  // A read with no local copy. `unavailable`, and the Training Library is
  // the source's own example: L40036, "`Unavailable` — online-only by
  // design, excluded from the offline bundle".
  return decide('unavailable', 'OFFLINE_NOT_AUTHORISED', undefined, {
    stage: 'DEVICE_AND_CONNECTIVITY',
    sourceRefs: [...req.sourceRefs, 'L40036'],
    conditionToEnable: 'Reconnect to read this.',
  })
}

/* ==================================================================== *
 * THE FRONTLINE CONNECTIVITY AND POSTURE MODEL.
 *
 * SHAPE BORROWED FROM `@/studio/state/connectivity`, RULING INVERTED, AND
 * THE INVERSION IS THE POINT. That file's treatment base carries
 * `queued: false` typed as the literal `false`, so a Studio write that
 * queued would not compile. This one carries `queued: true` on its write
 * treatment for the same structural reason in the opposite direction: a
 * Frontline write control that refused instead of queueing would not
 * compile. Neither surface can drift into the other's ruling by accident.
 *
 * WHY THERE IS NO `disabled` ANYWHERE IN THIS FILE. The Studio's
 * `StudioWriteControlTreatment` renders `disabled` and is right to. Here,
 * L48667's STATE-07 says the run continues in full offline, so a disabled
 * write control would be a false claim about a device that is working.
 * ==================================================================== */

export type FrontlineConnectivityKind =
  /** A write the worker takes while the device is offline. */
  | 'write'
  /** Content read from the on-device store while offline. */
  | 'cached-read'
  /** A read with no local copy — the Training Library is the source's case. */
  | 'online-only-read'
  /** The deterministic safety layer, which does not change offline at all. */
  | 'safety-layer'
  /** Reconnection. */
  | 'reconnect'

interface FrontlineTreatmentBase {
  readonly kind: FrontlineConnectivityKind
  readonly reason: string
  readonly sourceRef: string
}

export interface FrontlineWriteTreatment extends FrontlineTreatmentBase {
  readonly kind: 'write'
  /**
   * Always `true`. Typed as `true`, not `boolean`, so a `false` will not
   * compile — the mirror of the Studio's `queued: false`.
   */
  readonly queued: true
  readonly outcome: Extract<PermissionOutcome, 'queuedOffline'>
  /** The state the capture enters, named. Never "synced", never a bare tick. */
  readonly rendersState: 'STATE-09'
}

export interface FrontlineCachedReadTreatment extends FrontlineTreatmentBase {
  readonly kind: 'cached-read'
  readonly outcome: Extract<PermissionOutcome, 'cachedReadOnlyOffline'>
  readonly rendersState: 'STATE-08'
  /** The age and origin must be shown. */
  readonly freshness: 'required'
  readonly presentedAsCurrent: false
}

export interface FrontlineOnlineOnlyReadTreatment extends FrontlineTreatmentBase {
  readonly kind: 'online-only-read'
  readonly outcome: Extract<PermissionOutcome, 'unavailable'>
  readonly rendersState: 'STATE-07'
}

export interface FrontlineSafetyLayerTreatment extends FrontlineTreatmentBase {
  readonly kind: 'safety-layer'
  /**
   * Always `false`. The single most consequential position in this scope:
   * the safety layer's defining property is that it is IDENTICAL offline.
   * Typed as the literal so a task cannot gate it behind connectivity while
   * slice 8 has not arrived.
   */
  readonly degradedOffline: false
  readonly rendersState: 'STATE-07'
}

export interface FrontlineReconnectTreatment extends FrontlineTreatmentBase {
  readonly kind: 'reconnect'
  readonly rendersState: 'STATE-13'
  /** Stop class, then the full capture upload, then the enabling classes. */
  readonly order: 'DEC-SYNC-001 Option C'
}

export type FrontlineConnectivityTreatment =
  | FrontlineWriteTreatment
  | FrontlineCachedReadTreatment
  | FrontlineOnlineOnlyReadTreatment
  | FrontlineSafetyLayerTreatment
  | FrontlineReconnectTreatment

export const FL_CONNECTIVITY_TREATMENTS = [
  {
    kind: 'write',
    queued: true,
    outcome: 'queuedOffline',
    rendersState: 'STATE-09',
    reason:
      'The action was accepted on this device and is held in the durable upload queue — a queue whose ' +
      'contents survive application restart, device restart, and power loss. It shows its true state on ' +
      'the capture ladder and is never shown as recorded by the platform while it sits here.',
    sourceRef: 'L39585 (the durable queue), L48669 (STATE-09), AC-FL-006-3 L39636',
  },
  {
    kind: 'cached-read',
    outcome: 'cachedReadOnlyOffline',
    rendersState: 'STATE-08',
    freshness: 'required',
    presentedAsCurrent: false,
    reason:
      'This is back-filled content from the last synchronisation, shown with when it was last confirmed. ' +
      'It is not being refreshed and nothing here implies the platform knows anything about this device now.',
    sourceRef: 'L40035 (the destination table), L48668 (STATE-08)',
  },
  {
    kind: 'online-only-read',
    outcome: 'unavailable',
    rendersState: 'STATE-07',
    reason:
      'This content is online-only by design and is excluded from the offline bundle, so there is no local ' +
      'copy to show. It returns when the connection does; nothing in a Run depends on it.',
    sourceRef: 'L40036 (the destination table), L42114 and L42119 (MOD-FL-B12)',
  },
  {
    kind: 'safety-layer',
    degradedOffline: false,
    rendersState: 'STATE-07',
    reason:
      'Gates, specification checks, severity classification, containment and the Severity 1 hold all operate ' +
      'exactly as they do connected. The lot is protected from the moment of the breach, not from the moment ' +
      'of synchronisation, and the escalation is delivered when the connection returns.',
    sourceRef: 'L40948, L48667 (STATE-07), AC-FL-000-4 L39099, AC-SCR-FL-004 L48692',
  },
  {
    kind: 'reconnect',
    rendersState: 'STATE-13',
    order: 'DEC-SYNC-001 Option C',
    reason:
      'Stop-class commands apply before the drain, every pending capture then uploads with nothing discarded, ' +
      'and the enabling-class commands apply after it. Anything that arrives is announced in plain words.',
    sourceRef: 'L39672, L48673 (STATE-13), L48683',
  },
] as const satisfies readonly FrontlineConnectivityTreatment[]

type MissingFromTreatments = Exclude<
  FrontlineConnectivityKind,
  (typeof FL_CONNECTIVITY_TREATMENTS)[number]['kind']
>
const _treatmentsExhaustive: MissingFromTreatments extends never ? true : never = true
void _treatmentsExhaustive

type TreatmentFor<K extends FrontlineConnectivityKind> = Extract<
  (typeof FL_CONNECTIVITY_TREATMENTS)[number],
  { kind: K }
>

/**
 * The one function every Frontline screen calls when the connection is gone.
 * Reads ONE row of the table above; no branch anywhere else may re-derive
 * this decision. Takes its register AS A PARAMETER, never a module-load
 * snapshot — five rows, so a linear scan and no index to fall out of step.
 */
export function frontlineConnectivityTreatment<K extends FrontlineConnectivityKind>(
  input: { readonly kind: K },
  register: readonly FrontlineConnectivityTreatment[] = FL_CONNECTIVITY_TREATMENTS,
): TreatmentFor<K> {
  // `_treatmentsExhaustive` proves every kind has a row of the default
  // register, so this cast is discharged by the compiler rather than by hope.
  return register.find((t) => t.kind === input.kind) as TreatmentFor<K>
}

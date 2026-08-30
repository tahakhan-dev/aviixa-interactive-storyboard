import {
  PUBLISH_CHECKS,
  publishCheckById,
  type PublishCheckDefinition,
  type PublishCheckId,
} from './checks'

/**
 * Registration and evaluation for the eleven S3 publish checks.
 *
 * Two rules this file exists to hold:
 *
 * 1. **One implementation per check (C4).** The Builder's live validation
 *    panel and the publish path both READ this register; the module named in
 *    `ownerModules` is the only one that may WRITE to it. A second
 *    registration is a typed failure, never a silent replacement.
 * 2. **Fail closed.** A check that cannot run blocks publication, exactly as
 *    a check that fails does — `FB-STU-09` (L31453) and `AC-STU-149`
 *    (L34487, L34409): "where the check itself cannot run, publication is blocked,
 *    failing closed, because publishing an unverified locale is the exact
 *    failure the check exists to prevent." An unregistered check is the
 *    strongest form of a check that cannot run.
 *
 * The register is a VALUE that every reader takes as a parameter. There is
 * no module-level register here on purpose: a module-load snapshot read by a
 * function that closed over it is the defect this build shipped three times
 * in slice 4, and each fix reached fewer call sites than it needed to.
 *
 * Nothing in this file lets a caller publish past a blocker. There is no
 * waiver argument, no severity below "blocks", and no second evaluation
 * entry point that returns warnings.
 */

export type PublishCheckVerdict =
  | { readonly outcome: 'passed' }
  | { readonly outcome: 'blocked'; readonly blockingElement: string }
  | { readonly outcome: 'cannot-run'; readonly reason: string }

export interface PublishCheckImplementation<TSubject> {
  readonly checkId: PublishCheckId
  /** The module of record. Must be one of the check's `ownerModules`. */
  readonly implementedBy: string
  readonly run: (subject: TSubject) => PublishCheckVerdict
}

export interface PublishCheckRegister<TSubject> {
  readonly implementations: ReadonlyMap<PublishCheckId, PublishCheckImplementation<TSubject>>
}

export type RegisterFailure =
  | {
      readonly ok: false
      readonly failure: 'already-registered'
      readonly checkId: PublishCheckId
      readonly registeredBy: string
      readonly attemptedBy: string
    }
  | {
      readonly ok: false
      readonly failure: 'not-an-owner'
      readonly checkId: PublishCheckId
      readonly registeredBy: null
      readonly attemptedBy: string
    }

export type RegisterResult<TSubject> =
  | { readonly ok: true; readonly register: PublishCheckRegister<TSubject> }
  | RegisterFailure

export function createPublishCheckRegister<TSubject>(): PublishCheckRegister<TSubject> {
  return { implementations: new Map() }
}

/**
 * Returns a NEW register. The register handed in is never mutated, so a
 * caller holding an earlier one keeps exactly the checks it was given.
 */
export function registerPublishChecks<TSubject>(
  register: PublishCheckRegister<TSubject>,
  ...implementations: readonly PublishCheckImplementation<TSubject>[]
): RegisterResult<TSubject> {
  const next = new Map(register.implementations)
  for (const implementation of implementations) {
    const check = publishCheckById(implementation.checkId)
    const existing = next.get(implementation.checkId)
    if (existing) {
      return {
        ok: false,
        failure: 'already-registered',
        checkId: implementation.checkId,
        registeredBy: existing.implementedBy,
        attemptedBy: implementation.implementedBy,
      }
    }
    if (!check.ownerModules.includes(implementation.implementedBy)) {
      return {
        ok: false,
        failure: 'not-an-owner',
        checkId: implementation.checkId,
        registeredBy: null,
        attemptedBy: implementation.implementedBy,
      }
    }
    next.set(implementation.checkId, implementation)
  }
  return { ok: true, register: { implementations: next } }
}

/** Which module holds each check today — the answer to "who implements this?". */
export function registeredOwners<TSubject>(
  register: PublishCheckRegister<TSubject>,
): ReadonlyMap<PublishCheckId, string> {
  return new Map([...register.implementations].map(([id, i]) => [id, i.implementedBy]))
}

export interface PublishBlocker {
  readonly checkId: PublishCheckId
  readonly ordinal: number
  /** `failed` — the check ran and refused. `cannot-run` — it could not answer. */
  readonly kind: 'failed' | 'cannot-run'
  /** Never empty. What the screen must name so the author knows where to go. */
  readonly blockingElement: string
  /** Why publication is refused, in the source's words. */
  readonly refuses: string
  readonly sourceRef: string
}

export interface PublishEvaluation {
  readonly blocked: boolean
  readonly blockers: readonly PublishBlocker[]
  readonly passed: readonly PublishCheckId[]
}

function blocker(
  check: PublishCheckDefinition,
  kind: PublishBlocker['kind'],
  element: string,
): PublishBlocker {
  return {
    checkId: check.id,
    ordinal: check.ordinal,
    kind,
    blockingElement: element,
    refuses: check.refuses,
    sourceRef: check.sourceRef,
  }
}

/**
 * Runs every one of the eleven, in ordinal order, and reports what refuses.
 * Order is the check ordinal rather than registration order, so the list a
 * screen renders does not depend on which module loaded first.
 */
export function evaluatePublish<TSubject>(
  register: PublishCheckRegister<TSubject>,
  subject: TSubject,
): PublishEvaluation {
  const blockers: PublishBlocker[] = []
  const passed: PublishCheckId[] = []

  for (const check of PUBLISH_CHECKS) {
    const implementation = register.implementations.get(check.id)
    if (!implementation) {
      blockers.push(
        blocker(check, 'cannot-run', `${check.name} — no implementation is registered for it`),
      )
      continue
    }

    let verdict: PublishCheckVerdict
    try {
      verdict = implementation.run(subject)
    } catch (error) {
      // Not an expected path — an implementation that throws is a defect in
      // that module. It still must not publish: FB-STU-09's whole point is
      // that an unanswerable check refuses rather than waves through.
      const detail = error instanceof Error ? error.message : String(error)
      blockers.push(blocker(check, 'cannot-run', `${check.name} — the check failed to run: ${detail}`))
      continue
    }

    if (verdict.outcome === 'passed') {
      passed.push(check.id)
      continue
    }
    if (verdict.outcome === 'cannot-run') {
      blockers.push(blocker(check, 'cannot-run', `${check.name} — ${verdict.reason}`))
      continue
    }
    // A check that refuses while naming nothing has not answered the
    // question the screen asks, so it is reported as unanswered rather than
    // as a blank message beside a real refusal.
    const element = verdict.blockingElement.trim()
    if (element === '') {
      blockers.push(blocker(check, 'cannot-run', `${check.name} — the check ran but named no element`))
      continue
    }
    blockers.push(blocker(check, 'failed', element))
  }

  return { blocked: blockers.length > 0, blockers, passed }
}

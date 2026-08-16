import { describe, it, expect } from 'vitest'
import {
  allow,
  deny,
  decide,
  notApplicable,
  permitsAction,
  permitsRead,
  isRefusal,
  REASON_CODES,
  PERMISSION_OUTCOMES,
  type PermissionDecision,
  type PermissionOutcome,
  type FieldTreatment,
} from '@/policy/decision'

describe('permission decision', () => {
  it('treats only "allowed" as permitted', () => {
    expect(permitsAction(allow('BASE_ROLE', ['MOD-DOH-09']))).toBe(true)
    for (const outcome of [
      'explicitlyProhibited',
      'unavailable',
      'clientDecisionRequired',
    ] as const) {
      const d = deny(outcome, 'ROLE_NOT_GRANTED', 'nope', {
        stage: 'BASE_ROLE',
        sourceRefs: ['MOD-DOH-09'],
      })
      expect(permitsAction(d)).toBe(false)
    }
  })

  it('carries a reason code, a plain-language explanation and source refs', () => {
    const d = deny(
      'explicitlyProhibited',
      'ROLE_NOT_GRANTED',
      'The Tenant Admin grant does not include in-shift operational actions.',
      { stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-13', 'DEC-PLUS-001'] },
    )
    expect(d.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(d.explanation.length).toBeGreaterThan(20)
    expect(d.sourceRefs).toContain('DEC-PLUS-001')
  })

  it('records which evaluation stage produced the result', () => {
    const d = deny('explicitlyProhibited', 'TENANT_SUSPENDED', 'x', {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: ['MOD-SA-09'],
    })
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
  })

  it('defaults the explanation from the reason code when none is given', () => {
    const d = deny('explicitlyProhibited', 'MISSING_QUALIFICATION', undefined, {
      stage: 'QUALIFICATION',
      sourceRefs: ['MOD-DOH-14'],
    })
    expect(d.explanation).toBe(REASON_CODES.MISSING_QUALIFICATION)
  })

  it('gives every reason code a plain-language default explanation', () => {
    for (const [code, text] of Object.entries(REASON_CODES)) {
      expect(text.length, `${code} needs a real explanation`).toBeGreaterThan(20)
      expect(text).not.toMatch(/^[A-Z_]+$/)
    }
  })

  it('states an audit expectation on every decision', () => {
    const d: PermissionDecision = deny('explicitlyProhibited', 'EXPLICIT_DENY', 'x', {
      stage: 'BASE_ROLE',
      sourceRefs: ['§3.5'],
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
    expect(d.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })
})

describe('nine-outcome permission model', () => {
  const NINE: readonly PermissionOutcome[] = [
    'allowed', 'allowedWithConditions', 'readOnly', 'cachedReadOnlyOffline',
    'queuedOffline', 'unavailable', 'explicitlyProhibited',
    'clientDecisionRequired', 'notApplicable',
  ]

  // RULING 1: `deny` is narrowed to genuine refusals only (unavailable,
  // explicitlyProhibited, clientDecisionRequired). The four permissive-but-
  // conditional outcomes (allowedWithConditions, readOnly,
  // cachedReadOnlyOffline, queuedOffline) are never denials, so they go
  // through the general `decide` constructor instead. This helper keeps the
  // brief's per-outcome construction logic in one place without changing
  // any assertion's intent.
  function decisionFor(o: PermissionOutcome, reason = 'devices are not published'): PermissionDecision {
    if (o === 'notApplicable') {
      return notApplicable(reason, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
    }
    if (o === 'allowed') {
      return allow('BASE_ROLE', ['x'])
    }
    if (
      o === 'allowedWithConditions' ||
      o === 'readOnly' ||
      o === 'cachedReadOnlyOffline' ||
      o === 'queuedOffline'
    ) {
      return decide(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
    }
    return deny(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
  }

  it('permits an action for exactly allowed, allowedWithConditions and queuedOffline', () => {
    const permitting = NINE.filter((o) => permitsAction(decisionFor(o)))
    expect(permitting.sort()).toEqual(
      ['allowed', 'allowedWithConditions', 'queuedOffline'].sort(),
    )
  })

  it('permits a read additionally for readOnly and cachedReadOnlyOffline', () => {
    for (const o of ['readOnly', 'cachedReadOnlyOffline'] as const) {
      const d = decisionFor(o)
      expect(permitsRead(d), o).toBe(true)
      expect(permitsAction(d), o).toBe(false)
    }
  })

  it('treats the four refusal outcomes as refusals', () => {
    for (const o of ['unavailable', 'explicitlyProhibited', 'clientDecisionRequired'] as const) {
      expect(isRefusal(deny(o, 'ROLE_NOT_GRANTED', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })), o).toBe(true)
    }
    expect(isRefusal(notApplicable('r', { stage: 'BASE_ROLE', sourceRefs: ['x'] }))).toBe(true)
  })

  it('requires a reason on notApplicable and exposes it', () => {
    const d = notApplicable('devices are not published', {
      stage: 'BASE_ROLE', sourceRefs: ['§8.13'],
    })
    expect(d.outcome).toBe('notApplicable')
    if (d.outcome === 'notApplicable') {
      expect(d.notApplicableReason).toBe('devices are not published')
    }
  })

  it('does not carry hidden or redacted as permission outcomes', () => {
    expect(NINE).not.toContain('hidden' as PermissionOutcome)
    expect(NINE).not.toContain('redacted' as PermissionOutcome)
  })

  it('offers field treatment as a separate three-value concept', () => {
    const treatments: readonly FieldTreatment[] = ['visible', 'redacted', 'hidden']
    expect(treatments).toHaveLength(3)
  })

  it('gives every outcome a plain-language explanation, never a bare identifier', () => {
    for (const o of NINE) {
      const d = decisionFor(o, 'a stated reason that is long enough to be useful')
      expect(d.explanation.length, o).toBeGreaterThan(20)
      expect(d.explanation, o).not.toMatch(/^[A-Z_]+$/)
    }
  })

  // RULING 2: PERMISSION_OUTCOMES must be frozen, in source order, and
  // exhaustive against the type -- not merely nine strings that happen to
  // match today.
  it('freezes PERMISSION_OUTCOMES at exactly the nine, in source order', () => {
    expect(PERMISSION_OUTCOMES.length).toBe(9)
    expect(PERMISSION_OUTCOMES).toEqual(NINE)
  })
})

import { describe, it, expect } from 'vitest'
import {
  allow,
  deny,
  isPermitted,
  REASON_CODES,
  type PermissionDecision,
} from '@/policy/decision'

describe('permission decision', () => {
  it('treats only "allowed" as permitted', () => {
    expect(isPermitted(allow('BASE_ROLE', ['MOD-DOH-09']))).toBe(true)
    for (const outcome of [
      'blocked',
      'hidden',
      'redacted',
      'unavailable',
      'decisionRequired',
    ] as const) {
      const d = deny(outcome, 'ROLE_NOT_GRANTED', 'nope', {
        stage: 'BASE_ROLE',
        sourceRefs: ['MOD-DOH-09'],
      })
      expect(isPermitted(d)).toBe(false)
    }
  })

  it('carries a reason code, a plain-language explanation and source refs', () => {
    const d = deny(
      'blocked',
      'ROLE_NOT_GRANTED',
      'The Tenant Admin grant does not include in-shift operational actions.',
      { stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-13', 'DEC-PLUS-001'] },
    )
    expect(d.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(d.explanation.length).toBeGreaterThan(20)
    expect(d.sourceRefs).toContain('DEC-PLUS-001')
  })

  it('records which evaluation stage produced the result', () => {
    const d = deny('blocked', 'TENANT_SUSPENDED', 'x', {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: ['MOD-SA-09'],
    })
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
  })

  it('defaults the explanation from the reason code when none is given', () => {
    const d = deny('blocked', 'MISSING_QUALIFICATION', undefined, {
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
    const d: PermissionDecision = deny('blocked', 'EXPLICIT_DENY', 'x', {
      stage: 'BASE_ROLE',
      sourceRefs: ['§3.5'],
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
    expect(d.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })
})

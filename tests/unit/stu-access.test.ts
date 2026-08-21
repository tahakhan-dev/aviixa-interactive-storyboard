import { describe, it, expect } from 'vitest'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  STUDIO_GRANTS,
  STUDIO_GRANT_STATES,
  STUDIO_GRANT_DEFINITIONS,
  STUDIO_COMMERCIAL_TIERS,
  grantConfersCapability,
  grantStateNote,
  studioGrantById,
} from '@/studio/access/grants'
import {
  TIER_TWO_REQUEST_CLASSES,
  TIER_TWO_CLASSIFICATION,
  classifyTierTwoRefusal,
  isDefineClassRequest,
  enforceTierTwoBoundary,
  type TierTwoAuditWrite,
} from '@/studio/access/refusal'
import {
  STUDIO_PERSONA_COLUMNS,
  STUDIO_APPROVAL_STAGES,
  STUDIO_CELL_OUTCOMES,
  PERSONA_COLUMN_ROLES,
  evaluateStudioAccess,
  type StudioAccessInput,
  type StudioCellOutcome,
  type StudioMatrixCell,
  type StudioMatrixRow,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'

// ---------------------------------------------------------------------------
// Fixtures.
//
// DEFECT SHAPE 11 ("a guard whose baseline was chosen so the failure could not
// appear"): every fixture below is deliberately built on the PERMITTING side of
// every boundary it is not testing — signed in, tenant ACTIVE, online, grant
// Active, tier Enterprise, no stage occupied. A separation-of-duties test built
// on an offline or suspended baseline would go green on the wrong refusal, and
// would still be green if the separation-of-duties check were deleted outright.
// Each refusal test is therefore PAIRED with the same input one field away from
// it, asserted to be allowed. If the pair ever both refuse, the test asserts
// nothing.
// ---------------------------------------------------------------------------

const TENANT = tenantId('TEN-BRIGHT-BIKES')
const OTHER_TENANT = tenantId('TEN-OTHER')

const STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-ACCESS')),
  TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

const SUSPENDED_STATE: ScenarioDomainState = withTenant(STATE, TENANT, (p) => ({
  ...p,
  lifecycleState: 'HARD_SUSPENDED',
}))

function cell(
  outcome: StudioCellOutcome,
  note: string,
  extra: Partial<Omit<StudioMatrixCell, 'outcome' | 'note'>> = {},
): StudioMatrixCell {
  return {
    outcome,
    note,
    openDecision: extra.openDecision ?? null,
    requiredTiers: extra.requiredTiers ?? null,
    requiredGrant: extra.requiredGrant ?? null,
  }
}

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')

/** Every column prohibited unless the caller names it — which is how the
 *  consolidated matrix at L34539 actually reads. */
function cellsOf(
  overrides: Partial<Record<StudioPersonaColumn, StudioMatrixCell>>,
): Record<StudioPersonaColumn, StudioMatrixCell> {
  const out = {} as Record<StudioPersonaColumn, StudioMatrixCell>
  for (const c of STUDIO_PERSONA_COLUMNS) out[c] = overrides[c] ?? PROHIBITED
  return out
}

/** L34542 — "Read published Workflow content". The one row that survives a
 *  degraded identity layer (L34605, AC-STU-156). */
const PUBLISHED_READ_ROW: StudioMatrixRow = {
  capability: 'Read published Workflow content',
  cells: cellsOf({
    'quality-manager': cell('allowed', 'Allowed'),
    'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
    'supervisor-without-grant': cell('readOnly', 'Read-only'),
    'tenant-admin': cell('readOnly', 'Read-only'),
    'read-only-auditor': cell(
      'clientDecisionRequired',
      'Client Decision Required — `DEC-AUDSTU-001`',
      { openDecision: 'DEC-AUDSTU-001' },
    ),
    'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
  }),
  isPublishedRead: true,
  stage: null,
  sourceRefs: ['L34542'],
}

/** L34545 — "Author all nine configuration sections". Opened by the authoring
 *  grant: the with-grant column allows, the without-grant column prohibits. */
const AUTHOR_ROW: StudioMatrixRow = {
  capability: 'Author all nine configuration sections',
  cells: cellsOf({
    'quality-manager': cell('allowed', 'Allowed'),
    'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
    'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
  }),
  isPublishedRead: false,
  stage: 'author',
  sourceRefs: ['L34545'],
}

/** L34551 — "Act as Reviewer". */
const REVIEW_ROW: StudioMatrixRow = {
  capability: 'Act as Reviewer',
  cells: cellsOf({
    'quality-manager': cell('allowedWithConditions', 'Allowed with conditions — not own submission'),
    'supervisor-with-authoring-grant': cell(
      'allowedWithConditions',
      'Allowed with conditions — only on submissions they did not author',
    ),
  }),
  isPublishedRead: false,
  stage: 'reviewer',
  sourceRefs: ['L34551'],
}

/** L34552 — "Approve or release". */
const RELEASE_ROW: StudioMatrixRow = {
  capability: 'Approve or release',
  cells: cellsOf({
    'quality-manager': cell(
      'allowedWithConditions',
      'Allowed with conditions — Release Authority by tenant default, never on own submission or one they reviewed',
    ),
  }),
  isPublishedRead: false,
  stage: 'release-authority',
  sourceRefs: ['L34552'],
}

/** L34554 — "Compose a reasoning agent". */
const COMPOSE_AGENT_ROW: StudioMatrixRow = {
  capability: 'Compose a reasoning agent',
  cells: cellsOf({
    // L34554, transcribed cell by cell. THREE COLUMNS, THREE DIFFERENT
    // CONDITIONS — which is why the conditions hang off the cell and not the
    // row. The Quality Manager holds the Agent Author capability by role
    // (L34553) and needs only the tier; the Supervisor needs the grant AND the
    // tier; the Tenant Admin needs only the delegated grant.
    'quality-manager': cell(
      'allowedWithConditions',
      'Allowed with conditions — Growth or Enterprise tier',
      { requiredTiers: ['Growth', 'Enterprise'] },
    ),
    'supervisor-with-authoring-grant': cell(
      'allowedWithConditions',
      'Allowed with conditions — only with `GRANT-STU-AGENT` and Growth or Enterprise',
      { requiredTiers: ['Growth', 'Enterprise'], requiredGrant: 'GRANT-STU-AGENT' },
    ),
    'tenant-admin': cell(
      'allowedWithConditions',
      'Allowed with conditions — only if delegated `GRANT-STU-AGENT`',
      { requiredGrant: 'GRANT-STU-AGENT' },
    ),
  }),
  isPublishedRead: false,
  stage: null,
  sourceRefs: ['L34554'],
}

const QUALITY_MANAGER = { identityId: 'IDN-ELENA', roles: ['QUALITY_MANAGER'] as const, signedIn: true, tenant: TENANT }
const DUAL_ROLE_PERSON = {
  identityId: 'IDN-DUAL-01',
  roles: ['SUPERVISOR', 'QUALITY_MANAGER'] as const,
  signedIn: true,
  tenant: TENANT,
}

/** The permitting baseline. Every refusal test starts here and moves ONE field. */
function inputFor(row: StudioMatrixRow, over: Partial<StudioAccessInput> = {}): StudioAccessInput {
  return {
    row,
    identity: QUALITY_MANAGER,
    grants: { 'GRANT-STU-AUTHOR': 'Active', 'GRANT-STU-AGENT': 'Active' },
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    state: STATE,
    online: true,
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
    ...over,
  }
}

// ---------------------------------------------------------------------------
// grants.ts — the grant model
// ---------------------------------------------------------------------------

describe('the Studio grant model (L34571, L34573)', () => {
  // Fails if a member is dropped from STUDIO_GRANTS: the length assertion goes
  // red and the `as const satisfies` exhaustiveness check stops compiling.
  it('is closed at the three grants the source names', () => {
    expect([...STUDIO_GRANTS]).toEqual(['GRANT-STU-AUTHOR', 'GRANT-STU-AGENT', 'GRANT-STU-IMPL'])
  })

  // Fails if 'Assigned' is dropped from STUDIO_GRANT_STATES — the source states
  // four, and a three-state model would silently treat Assigned as Active.
  it('is closed at the four grant states, in source order', () => {
    expect([...STUDIO_GRANT_STATES]).toEqual(['Assigned', 'Active', 'Revoked', 'Expired'])
  })

  // Fails if grantConfersCapability returns true for anything but 'Active' —
  // e.g. changing it to `state !== 'Revoked'`, which is the fail-OPEN reading
  // L34584 forbids ("denies the authoring capability rather than assuming it").
  it('confers a capability only while Active, and fails closed on an absent grant', () => {
    expect(grantConfersCapability('Active')).toBe(true)
    expect(grantConfersCapability('Assigned')).toBe(false)
    expect(grantConfersCapability('Revoked')).toBe(false)
    expect(grantConfersCapability('Expired')).toBe(false)
    expect(grantConfersCapability(undefined)).toBe(false)
  })

  // Fails if any state's note is blank — AC-STU-155 requires the SPECIFIC
  // missing condition to be named, never a bare status token.
  it('names a specific missing condition for every non-conferring state', () => {
    for (const s of STUDIO_GRANT_STATES) {
      expect(grantStateNote(s).trim().length, s).toBeGreaterThan(0)
    }
    expect(grantStateNote('Revoked')).toMatch(/revok/i)
    expect(grantStateNote('Expired')).toMatch(/expir/i)
  })

  // Fails if GRANT-STU-AUTHOR's expiry is marked 'stated' — DEC-TENGRANT-001 puts Expired on
  // GRANT-STU-IMPL only (§5.11.4 revocation at onboarding's end) and leaves the
  // other two to DEC-TENGRANT-001.
  it('applies Expired to GRANT-STU-IMPL only, per DEC-TENGRANT-001', () => {
    expect(studioGrantById('GRANT-STU-IMPL').expiryStatus).toBe('stated')
    expect(studioGrantById('GRANT-STU-AUTHOR').expiryStatus).toBe('clientDecisionRequired')
    expect(studioGrantById('GRANT-STU-AGENT').expiryStatus).toBe('clientDecisionRequired')
    expect(studioGrantById('GRANT-STU-AUTHOR').expiryDecision).toBe('DEC-TENGRANT-001')
  })

  // Fails if GRANT-STU-AGENT's requiredTiers gains 'Starter' or goes null —
  // L34586 tier-gates the Agent Author capability to Growth and Enterprise.
  it('tier-gates the Agent Author capability and nothing else', () => {
    expect(studioGrantById('GRANT-STU-AGENT').requiredTiers).toEqual(['Growth', 'Enterprise'])
    expect(studioGrantById('GRANT-STU-AUTHOR').requiredTiers).toBeNull()
    expect(studioGrantById('GRANT-STU-IMPL').requiredTiers).toBeNull()
  })

  // Fails if a grant is added to the union without a definition row.
  it('carries one definition per grant id', () => {
    expect(STUDIO_GRANT_DEFINITIONS.map((g) => g.id)).toEqual([...STUDIO_GRANTS])
  })

  // Fails if 'indeterminate' is dropped: the tier gate would then have no
  // fail-closed value for a tier that cannot be read.
  it('carries the three commercial tiers plus an indeterminate fail-closed member', () => {
    expect([...STUDIO_COMMERCIAL_TIERS]).toEqual([
      'Starter',
      'Growth',
      'Enterprise',
      'indeterminate',
    ])
  })
})

// ---------------------------------------------------------------------------
// refusal.ts — S7, the Tier-2 refusal classification
// ---------------------------------------------------------------------------

describe('the Tier-2 refusal classification (S7, L12033-L12042, FUNC-STU-01-01-C-1)', () => {
  // Fails if a verb is dropped from TIER_TWO_REQUEST_CLASSES — the eight rows
  // of the source's own verb table, no more and no fewer.
  it('is closed at the eight request classes of the source verb table', () => {
    expect([...TIER_TWO_REQUEST_CLASSES]).toEqual([
      'enable',
      'configure',
      'compose-reasoning-agent',
      'define-atom',
      'alter-core-agent-definition',
      'alter-memory-architecture',
      'alter-evaluation-harness',
      'compose-action-agent',
    ])
    expect(TIER_TWO_CLASSIFICATION.map((r) => r.requestClass)).toEqual([
      ...TIER_TWO_REQUEST_CLASSES,
    ])
  })

  // Fails if any one of the four define-class outcomes flips away from
  // explicitlyProhibited — e.g. making 'alter-evaluation-harness' unavailable,
  // which would render it as a transient condition rather than a hard gate.
  it('classifies each verb exactly as the source table does', () => {
    const byClass = Object.fromEntries(
      TIER_TWO_CLASSIFICATION.map((r) => [r.requestClass, r.outcome]),
    )
    expect(byClass).toEqual({
      enable: 'allowedWithConditions',
      configure: 'allowed',
      'compose-reasoning-agent': 'allowedWithConditions',
      'define-atom': 'explicitlyProhibited',
      'alter-core-agent-definition': 'explicitlyProhibited',
      'alter-memory-architecture': 'explicitlyProhibited',
      'alter-evaluation-harness': 'explicitlyProhibited',
      'compose-action-agent': 'clientDecisionRequired',
    })
  })

  // Fails if isDefineClassRequest is written as `!== 'configure'` or otherwise
  // widened past the four prohibited rows: 'compose-action-agent' is deferred,
  // NOT a define-class request, and 'configure' is the Studio's whole job.
  it('treats exactly the four prohibited verbs as define-class', () => {
    const defineClass = TIER_TWO_REQUEST_CLASSES.filter(isDefineClassRequest)
    expect([...defineClass]).toEqual([
      'define-atom',
      'alter-core-agent-definition',
      'alter-memory-architecture',
      'alter-evaluation-harness',
    ])
  })

  // Fails if the define-class decision's auditExpectation is left NOT_AUDITED,
  // or its stage stops being a refusal stage — L31666 audits every refusal of a
  // define-class request.
  it('refuses a define-class request as an audited hard gate', () => {
    const c = classifyTierTwoRefusal('define-atom')
    expect(c.outcome).toBe('explicitlyProhibited')
    expect(c.decision.reasonCode).toBe('HARD_GATE')
    expect(c.decision.auditExpectation).toBe('RECORDED_AS_REFUSAL')
    expect(c.reason).toMatch(/service layer/i)
    expect(c.decision.outcome).toBe(c.outcome)
  })

  // Fails if the classification's reason drops the "not merely hidden in the
  // user interface" half of L31599 — a refusal classified as a hidden button is
  // the exact defect S7 exists to prevent.
  it('states that the refusal is at the service layer, not a hidden button', () => {
    for (const rc of TIER_TWO_REQUEST_CLASSES.filter(isDefineClassRequest)) {
      expect(classifyTierTwoRefusal(rc).reason, rc).toMatch(
        /not merely hidden in the user interface/i,
      )
    }
  })

  // Fails if the deferred composition is resolved to allowed or prohibited —
  // §3.7 defers tenant-composed action agents; the storyboard does not guess.
  it('leaves a tenant-composed action agent as a client decision, not a guess', () => {
    const c = classifyTierTwoRefusal('compose-action-agent')
    expect(c.outcome).toBe('clientDecisionRequired')
    expect(c.decision.reasonCode).toBe('DECISION_OPEN')
  })

  // --- the asymmetry against FB-STU-10 --------------------------------------

  const REQUEST = {
    requestClass: 'define-atom',
    actorIdentityId: 'IDN-ELENA',
    detail: 'create a torque-validation atom',
  } as const

  const OK: TierTwoAuditWrite = () => ({ ok: true })
  const FAILS: TierTwoAuditWrite = () => ({ ok: false, failure: 'audit store unreachable' })
  const THROWS: TierTwoAuditWrite = () => {
    throw new Error('audit store exploded')
  }

  // Fails if enforceTierTwoBoundary does not attempt the audit at all — the
  // happy path must still write, or the asymmetry below proves nothing.
  it('audits the refusal when the audit write succeeds', () => {
    const r = enforceTierTwoBoundary(REQUEST, OK)
    expect(r.refused).toBe(true)
    expect(r.audit).toBe('written')
    expect(r.auditFailure).toBeNull()
  })

  // THE S7 TEST. Fails if enforceTierTwoBoundary returns refused:false, or
  // rethrows, when the audit write reports failure — "the refusal is still
  // enforced because refusing is the safe direction" (L31599). Note the
  // asymmetry against FB-STU-10: an audit failure kills a WRITE and does not
  // revive a REFUSAL.
  it('still refuses when the audit write fails', () => {
    const r = enforceTierTwoBoundary(REQUEST, FAILS)
    expect(r.refused).toBe(true)
    expect(r.outcome).toBe('explicitlyProhibited')
    expect(r.audit).toBe('failed')
    expect(r.auditFailure).toBe('audit store unreachable')
  })

  // Fails if the try/catch around the audit sink is removed: a throwing sink
  // would propagate out of the refusal path and the caller would see an
  // exception rather than a refusal, which is the fail-open direction.
  it('still refuses when the audit sink throws rather than returning a failure', () => {
    const r = enforceTierTwoBoundary(REQUEST, THROWS)
    expect(r.refused).toBe(true)
    expect(r.outcome).toBe('explicitlyProhibited')
    expect(r.audit).toBe('failed')
    expect(r.auditFailure).toMatch(/exploded/)
  })

  // Fails if `audit` is hardcoded to 'written' — a refusal that claims an audit
  // it did not write is defect shape 3 wearing a different hat.
  it('never claims an audit it did not write', () => {
    expect(enforceTierTwoBoundary(REQUEST, FAILS).audit).not.toBe('written')
    expect(enforceTierTwoBoundary(REQUEST, THROWS).audit).not.toBe('written')
  })

  // Fails if a permitted verb is refused, or if it burns a refusal audit entry
  // it has no business writing.
  it('does not refuse, and does not audit a refusal, for a permitted verb', () => {
    let calls = 0
    const counting: TierTwoAuditWrite = () => {
      calls += 1
      return { ok: true }
    }
    const r = enforceTierTwoBoundary({ ...REQUEST, requestClass: 'configure' }, counting)
    expect(r.refused).toBe(false)
    expect(r.audit).toBe('not-required')
    expect(calls).toBe(0)
  })

  // Fails if the audit entry stops carrying the acting IDENTITY — L34657:
  // audited "with identity and action, never with 'acting as role'".
  it('audits with identity and action, never with a role', () => {
    let seen: unknown = null
    const capture: TierTwoAuditWrite = (entry) => {
      seen = entry
      return { ok: true }
    }
    enforceTierTwoBoundary(REQUEST, capture)
    expect(seen).toMatchObject({
      identityId: 'IDN-ELENA',
      action: 'define-atom',
      outcome: 'explicitlyProhibited',
    })
    expect(JSON.stringify(seen)).not.toMatch(/acting as role/i)
  })
})

// ---------------------------------------------------------------------------
// evaluate.ts — S1
// ---------------------------------------------------------------------------

describe('the persona columns (L34539)', () => {
  // Fails if a column is dropped or reordered away from the matrix header.
  it('carries the eight columns of the consolidated matrix, in header order', () => {
    expect([...STUDIO_PERSONA_COLUMNS]).toEqual([
      'quality-manager',
      'supervisor-with-authoring-grant',
      'supervisor-without-grant',
      'plant-manager-persona',
      'tenant-admin',
      'read-only-auditor',
      'worker',
      'implementation-team',
    ])
  })

  // Fails if a RoleId is mapped onto the Plant Manager column — DEC-ROLE-001 is
  // open, `tests/unit/roles.test.ts` asserts the build has no such role, and
  // minting one here would resolve an open client decision in code.
  it('resolves no role onto the Plant Manager persona column while DEC-ROLE-001 is open', () => {
    expect(PERSONA_COLUMN_ROLES['plant-manager-persona']).toBeNull()
  })

  // Fails if the cell vocabulary widens to admit queuedOffline — S5/D4: nothing
  // on this surface ever queues a write.
  it('admits no cell outcome that would queue or cache a Studio write', () => {
    expect([...STUDIO_CELL_OUTCOMES]).toEqual([
      'allowed',
      'allowedWithConditions',
      'readOnly',
      'unavailable',
      'clientDecisionRequired',
      'explicitlyProhibited',
    ])
    expect(STUDIO_CELL_OUTCOMES).not.toContain('queuedOffline')
    expect(STUDIO_CELL_OUTCOMES).not.toContain('cachedReadOnlyOffline')
  })

  // Fails if a stage is dropped — three stages, three distinct identities.
  it('carries the three approval stages', () => {
    expect([...STUDIO_APPROVAL_STAGES]).toEqual(['author', 'reviewer', 'release-authority'])
  })
})

describe('separation of duties is evaluated by identity, never by role (L33389, AC-STU-100)', () => {
  // THE R8 TEST. Fails if the distinctness check compares ROLE sets instead of
  // identityId — a role-based check sees SUPERVISOR authored and
  // QUALITY_MANAGER reviewing, counts two roles, and allows it.
  it('refuses the second stage to one person holding both roles', () => {
    const authored = evaluateStudioAccess(
      inputFor(REVIEW_ROW, { identity: DUAL_ROLE_PERSON, authorOfRecord: 'IDN-DUAL-01' }),
    )
    expect(authored.outcome).toBe('explicitlyProhibited')
    expect(authored.reason).toMatch(/one person/i)
    expect(authored.decision.stage).toBe('SEGREGATION_OF_DUTIES')
    expect(authored.decision.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })

  // THE PAIR. Without this the test above would still pass if the reviewer
  // capability were refused to everyone for any reason at all.
  it('allows the same person the same stage when someone else authored', () => {
    const other = evaluateStudioAccess(
      inputFor(REVIEW_ROW, { identity: DUAL_ROLE_PERSON, authorOfRecord: 'IDN-SAM' }),
    )
    expect(other.outcome).toBe('allowedWithConditions')
  })

  // Fails if the second role is allowed to rescue the same identity at the
  // release stage — the same defect as above, one stage further on.
  //
  // THE `.not.toBe('allowed')` LINE ASSERTS NOTHING ON ITS OWN, and is kept
  // only because the task brief wrote it. The release cell is
  // `allowedWithConditions` (L34554), so a role-based distinctness check —
  // the exact defect this test names — resolves this call to
  // `allowedWithConditions` and satisfies `.not.toBe('allowed')` while the
  // person occupies two stages. Proven by planting that defect: with the
  // brief's assertion alone the test stayed green. The two lines below it are
  // the ones that can actually fail. This is defect shape 9, a vacuous
  // assertion, and it was in the brief.
  it('does not let a second role rescue the same identity', () => {
    const same = evaluateStudioAccess(
      inputFor(RELEASE_ROW, { identity: DUAL_ROLE_PERSON, reviewerOfRecord: 'IDN-DUAL-01' }),
    )
    expect(same.outcome).not.toBe('allowed')
    expect(same.outcome).toBe('explicitlyProhibited')
    expect(same.decision.stage).toBe('SEGREGATION_OF_DUTIES')
    expect(same.reason).toMatch(/one person/i)
    expect(
      evaluateStudioAccess(
        inputFor(RELEASE_ROW, { identity: DUAL_ROLE_PERSON, reviewerOfRecord: 'IDN-SAM' }),
      ).outcome,
    ).toBe('allowedWithConditions')
  })

  // THE BOUNDARY FROM THE OTHER SIDE. Fails if the distinctness filter forgets
  // to exclude the stage being requested — an Author re-opening their own draft
  // would then be refused for occupying the very stage they are asking for.
  it('does not treat occupying the SAME stage twice as two stages', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, { identity: DUAL_ROLE_PERSON, authorOfRecord: 'IDN-DUAL-01' }),
    )
    expect(r.outcome).toBe('allowed')
  })

  // Fails if the check is keyed off something other than the acting identity —
  // an unrelated third party occupying a stage must not refuse this actor.
  it('ignores stages occupied by other identities', () => {
    const r = evaluateStudioAccess(
      inputFor(RELEASE_ROW, { authorOfRecord: 'IDN-SAM', reviewerOfRecord: 'IDN-OMAR' }),
    )
    expect(r.outcome).toBe('allowedWithConditions')
  })
})

describe('fail closed (L34605, AC-STU-156, FUNC-STU-18-02-A-1)', () => {
  // Fails if the identity-layer branch is removed: an unreachable identity
  // layer would then fall through to the cell and ALLOW authoring.
  it('permits nothing beyond published read when the identity layer is unreachable', () => {
    const r = evaluateStudioAccess(inputFor(AUTHOR_ROW, { identityLayer: 'unreachable' }))
    expect(r.outcome).toBe('unavailable')
    expect(r.reason).toMatch(/identity layer/i)
    expect(r.reason).toMatch(/published read/i)
    expect(
      evaluateStudioAccess(inputFor(PUBLISHED_READ_ROW, { identityLayer: 'unreachable' })).outcome,
    ).toBe('readOnly')
  })

  // THE PAIR. Fails if authoring were refused for some reason unrelated to the
  // identity layer, which would make the assertion above vacuous.
  it('allows the same authoring row when the identity layer is reachable', () => {
    expect(evaluateStudioAccess(inputFor(AUTHOR_ROW)).outcome).toBe('allowed')
  })

  // Fails if a revoked grant silently degrades the persona to the without-grant
  // column: the outcome would still be a refusal, but the reason would never
  // name the revocation, which is exactly "the session is silently degraded".
  it('names the revocation rather than degrading the session', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT },
        grants: { 'GRANT-STU-AUTHOR': 'Revoked' },
      }),
    )
    expect(r.reason).toMatch(/GRANT-STU-AUTHOR/)
    expect(r.reason).toMatch(/revok/i)
    expect(r.outcome).toBe('unavailable')
    expect(r.decision.conditionToEnable).toMatch(/GRANT-STU-AUTHOR/)
  })

  // THE PAIR. Fails if the Supervisor's authoring is refused for a reason other
  // than the grant state.
  it('allows the same Supervisor to author while the grant is Active', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT },
        grants: { 'GRANT-STU-AUTHOR': 'Active' },
      }),
    )
    expect(r.outcome).toBe('allowed')
  })

  // Fails if 'Assigned' is treated as conferring — the fail-open reading of a
  // four-state lifecycle L34584 explicitly forbids.
  it('does not confer an authoring capability on a grant that is assigned but not active', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT },
        grants: { 'GRANT-STU-AUTHOR': 'Assigned' },
      }),
    )
    expect(r.outcome).not.toBe('allowed')
    expect(r.reason).toMatch(/GRANT-STU-AUTHOR/)
  })

  // Fails if an absent grant is read as held — the ordinary fail-closed case.
  it('refuses the authoring capability outright when no grant is held at all', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT },
        grants: {},
      }),
    )
    expect(r.outcome).toBe('explicitlyProhibited')
  })
})

describe('the tier gate (L34586, L11872)', () => {
  // Fails if row.requiredTiers is ignored: composing an agent on Starter would
  // be allowed, which is the commercial tier read as an authority tier.
  it('refuses agent composition below Growth, naming the tier', () => {
    const r = evaluateStudioAccess(inputFor(COMPOSE_AGENT_ROW, { commercialTier: 'Starter' }))
    expect(r.outcome).toBe('unavailable')
    expect(r.reason).toMatch(/Growth/)
    expect(r.reason).toMatch(/Enterprise/)
  })

  // Fails if the fail-closed member is treated as satisfying the gate.
  it('refuses agent composition when the tier cannot be read', () => {
    expect(
      evaluateStudioAccess(inputFor(COMPOSE_AGENT_ROW, { commercialTier: 'indeterminate' })).outcome,
    ).toBe('unavailable')
  })

  // THE PAIR — and it also proves the gate is not simply refusing everything.
  it('allows agent composition on Growth and on Enterprise', () => {
    expect(evaluateStudioAccess(inputFor(COMPOSE_AGENT_ROW, { commercialTier: 'Growth' })).outcome)
      .toBe('allowedWithConditions')
    expect(evaluateStudioAccess(inputFor(COMPOSE_AGENT_ROW)).outcome).toBe('allowedWithConditions')
  })

  // Fails if cell.requiredGrant is ignored — GRANT-STU-AGENT is a capability
  // grant that no persona column header encodes, so it can only be read off
  // the cell.
  it('refuses agent composition to a Tenant Admin without the delegated grant', () => {
    const admin = {
      identityId: 'IDN-PRIYA',
      roles: ['TENANT_ADMIN'] as const,
      signedIn: true,
      tenant: TENANT,
    }
    const r = evaluateStudioAccess(
      inputFor(COMPOSE_AGENT_ROW, { identity: admin, grants: {} }),
    )
    expect(r.outcome).toBe('unavailable')
    expect(r.reason).toMatch(/GRANT-STU-AGENT/)
    // THE PAIR: the same Tenant Admin with the grant delegated is allowed.
    expect(
      evaluateStudioAccess(
        inputFor(COMPOSE_AGENT_ROW, {
          identity: admin,
          grants: { 'GRANT-STU-AGENT': 'Active' },
        }),
      ).outcome,
    ).toBe('allowedWithConditions')
  })

  // THE TEST THAT PINS THE PER-CELL FIX. Fails the moment requiredGrant moves
  // back onto the row: the Quality Manager holds the Agent Author capability by
  // role (L34553, "Hold or delegate the Agent Author capability | Allowed") and
  // their cell at L34554 names only the tier. A row-level grant requirement
  // would demand a grant of the one persona who never needs one.
  it('does not demand the Agent Author grant of a Quality Manager, whose cell names only the tier', () => {
    const r = evaluateStudioAccess(inputFor(COMPOSE_AGENT_ROW, { grants: {} }))
    expect(r.outcome).toBe('allowedWithConditions')
  })

  // Fails if a lapsed cell grant stops naming its state.
  it('names a revoked Agent Author grant on the Supervisor cell that requires it', () => {
    const r = evaluateStudioAccess(
      inputFor(COMPOSE_AGENT_ROW, {
        identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT },
        grants: { 'GRANT-STU-AUTHOR': 'Active', 'GRANT-STU-AGENT': 'Revoked' },
      }),
    )
    expect(r.outcome).toBe('unavailable')
    expect(r.reason).toMatch(/GRANT-STU-AGENT/)
    expect(r.reason).toMatch(/revok/i)
  })

  // Fails if the tier gate fires on a cell that does not declare one, which
  // would refuse ordinary authoring on a Starter tenant.
  it('does not apply a tier gate to a cell that declares none', () => {
    expect(evaluateStudioAccess(inputFor(AUTHOR_ROW, { commercialTier: 'Starter' })).outcome)
      .toBe('allowed')
  })
})

describe('the evaluator reads a matrix row, never a role list (C19)', () => {
  // Fails if the evaluator carries any hardcoded role list of its own: flipping
  // one cell in the row must flip the outcome, with no code change anywhere.
  it('follows the row when a cell is flipped, with no role list of its own', () => {
    const flipped: StudioMatrixRow = {
      ...AUTHOR_ROW,
      cells: { ...AUTHOR_ROW.cells, 'quality-manager': PROHIBITED },
    }
    expect(evaluateStudioAccess(inputFor(AUTHOR_ROW)).outcome).toBe('allowed')
    expect(evaluateStudioAccess(inputFor(flipped)).outcome).toBe('explicitlyProhibited')
  })

  // Fails if the multi-role resolution takes the first or the narrowest column:
  // multi-role is additive (L33389), so the Quality Manager cell must win over
  // the Supervisor-without-grant cell for a person holding both.
  it('resolves multi-role additively, taking the most permissive held column', () => {
    const noGrant = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, { identity: DUAL_ROLE_PERSON, grants: {} }),
    )
    expect(noGrant.outcome).toBe('allowed')
    expect(noGrant.personaColumns).toContain('quality-manager')
    expect(noGrant.personaColumns).toContain('supervisor-without-grant')
  })

  // Fails if an explicitlyProhibited cell stops producing an EXPLICIT_DENY at
  // the base-role stage, or stops being audited as a refusal.
  it('renders a prohibited cell as an audited explicit deny', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-MAYA', roles: ['WORKER'], signedIn: true, tenant: TENANT },
      }),
    )
    expect(r.outcome).toBe('explicitlyProhibited')
    expect(r.decision.reasonCode).toBe('EXPLICIT_DENY')
    expect(r.decision.stage).toBe('BASE_ROLE')
    expect(r.decision.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })

  // Fails if a Client Decision Required cell is resolved to a permission — DEC-AUDSTU-001
  // and AC-STU-157: the Read-only Auditor's cells are never guessed.
  it('carries a Client Decision Required cell through unresolved, naming its decision', () => {
    const r = evaluateStudioAccess(
      inputFor(PUBLISHED_READ_ROW, {
        identity: {
          identityId: 'IDN-OMAR',
          roles: ['READONLY_AUDITOR'],
          signedIn: true,
          tenant: TENANT,
        },
      }),
    )
    expect(r.outcome).toBe('clientDecisionRequired')
    expect(r.reason).toMatch(/DEC-AUDSTU-001/)
  })

  // Fails if a signed-in role that maps to no Studio column is reported as an
  // absent SESSION rather than an ungranted role — a wrong, misleading reason.
  it('refuses a signed-in role that resolves to no Studio column, at the role stage', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-DAN', roles: ['PLATFORM_ENGINEER'], signedIn: true, tenant: null },
      }),
    )
    expect(r.outcome).toBe('explicitlyProhibited')
    expect(r.decision.stage).toBe('BASE_ROLE')
    expect(r.personaColumns).toEqual([])
  })
})

describe('the nine slice-3 stages still run underneath (S1: layered, not forked)', () => {
  // Fails if evaluateStudioAccess stops composing evaluateAccess — a signed-out
  // identity would then be answered from the matrix cell alone.
  it('refuses a signed-out identity at the session stage', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, { identity: { ...QUALITY_MANAGER, signedIn: false } }),
    )
    expect(r.decision.stage).toBe('SESSION')
    expect(r.decision.reasonCode).toBe('NO_ACTIVE_SESSION')
  })

  // Fails if resourceTenant is not passed through — L34659: "Tenant isolation
  // applies to every authorisation decision."
  it('refuses a request naming another tenant’s record', () => {
    const r = evaluateStudioAccess(inputFor(AUTHOR_ROW, { resourceTenant: OTHER_TENANT }))
    expect(r.decision.stage).toBe('TENANT_ISOLATION')
    expect(r.decision.reasonCode).toBe('TENANT_MISMATCH')
  })

  // Fails if the suspension stage is skipped by evaluating the cell directly.
  it('refuses while the tenant is suspended', () => {
    const r = evaluateStudioAccess(inputFor(AUTHOR_ROW, { state: SUSPENDED_STATE }))
    expect(r.outcome).toBe('unavailable')
    expect(r.decision.reasonCode).toBe('TENANT_SUSPENDED')
  })

  // Fails if requiresOnline is dropped: row 23 of the matrix reads "Unavailable
  // — the Studio requires an active connection" for every permitted column.
  it('renders an offline Studio capability as unavailable, never queued', () => {
    const r = evaluateStudioAccess(inputFor(AUTHOR_ROW, { online: false }))
    expect(r.outcome).toBe('unavailable')
    expect(r.decision.reasonCode).toBe('OFFLINE_NOT_AUTHORISED')
    expect(r.outcome).not.toBe('queuedOffline')
  })

  // Fails if the prohibited-cell deny stops running BEFORE the connectivity
  // stage: row 23's Worker column reads "Explicitly prohibited — no access at
  // all", not "Unavailable", and the ordering is what produces that.
  it('keeps a prohibited role prohibited offline, rather than merely unavailable', () => {
    const r = evaluateStudioAccess(
      inputFor(AUTHOR_ROW, {
        identity: { identityId: 'IDN-MAYA', roles: ['WORKER'], signedIn: true, tenant: TENANT },
        online: false,
      }),
    )
    expect(r.outcome).toBe('explicitlyProhibited')
  })

  // Fails if allowedObjectStates/objectState are not passed through — object
  // state is one of S1's five stated inputs.
  it('refuses on object state, and fails closed when the state is not supplied', () => {
    expect(
      evaluateStudioAccess(
        inputFor(AUTHOR_ROW, { allowedObjectStates: ['Draft'], objectState: 'Released' }),
      ).decision.reasonCode,
    ).toBe('OBJECT_STATE_INVALID')
    expect(
      evaluateStudioAccess(inputFor(AUTHOR_ROW, { allowedObjectStates: ['Draft'] })).decision
        .reasonCode,
    ).toBe('OBJECT_STATE_INVALID')
    expect(
      evaluateStudioAccess(
        inputFor(AUTHOR_ROW, { allowedObjectStates: ['Draft'], objectState: 'Draft' }),
      ).outcome,
    ).toBe('allowed')
  })
})

describe('the decision handed to the eighteen consumer tasks', () => {
  const EVERY_BRANCH: readonly StudioAccessInput[] = [
    inputFor(AUTHOR_ROW),
    inputFor(AUTHOR_ROW, { identityLayer: 'unreachable' }),
    inputFor(PUBLISHED_READ_ROW, { identityLayer: 'unreachable' }),
    inputFor(AUTHOR_ROW, { grants: {}, identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT } }),
    inputFor(AUTHOR_ROW, { grants: { 'GRANT-STU-AUTHOR': 'Revoked' }, identity: { identityId: 'IDN-SAM', roles: ['SUPERVISOR'], signedIn: true, tenant: TENANT } }),
    inputFor(COMPOSE_AGENT_ROW, { commercialTier: 'Starter' }),
    inputFor(REVIEW_ROW, { identity: DUAL_ROLE_PERSON, authorOfRecord: 'IDN-DUAL-01' }),
    inputFor(AUTHOR_ROW, { online: false }),
    inputFor(AUTHOR_ROW, { identity: { ...QUALITY_MANAGER, signedIn: false } }),
    inputFor(PUBLISHED_READ_ROW, { identity: { identityId: 'IDN-OMAR', roles: ['READONLY_AUDITOR'], signedIn: true, tenant: TENANT } }),
    inputFor(AUTHOR_ROW, { state: SUSPENDED_STATE }),
  ]

  // Fails if ANY branch forgets to rebuild the composed decision to carry the
  // outcome it actually returned — a consumer reading `.decision.outcome` would
  // then get 'allowed' from the underlying evaluator while `.outcome` said
  // 'clientDecisionRequired'. Eighteen tasks read this shape.
  it('keeps outcome and decision.outcome identical on every branch', () => {
    for (const input of EVERY_BRANCH) {
      const r = evaluateStudioAccess(input)
      expect(r.decision.outcome, `${input.row.capability}/${r.reason}`).toBe(r.outcome)
    }
  })

  // Fails if any branch returns a bare status token as its reason — AC-STU-155
  // requires the specific missing condition to be named.
  it('names a specific missing condition on every branch, never a bare token', () => {
    for (const input of EVERY_BRANCH) {
      const r = evaluateStudioAccess(input)
      expect(r.reason.trim().length, r.outcome).toBeGreaterThan(20)
      expect(r.reason, r.outcome).toBe(r.decision.explanation)
    }
  })

  // Fails if a refusal branch is left NOT_AUDITED — L34657 audits every
  // authorisation refusal.
  it('marks every refusal as one to record', () => {
    const READS: readonly string[] = ['allowed', 'allowedWithConditions', 'readOnly']
    for (const input of EVERY_BRANCH) {
      const r = evaluateStudioAccess(input)
      if (READS.includes(r.outcome)) continue
      expect(r.decision.auditExpectation, `${r.outcome}: ${r.reason}`).toBe('RECORDED_AS_REFUSAL')
    }
  })

  // Fails if a source locator is dropped from a branch — every decision must be
  // traceable back to the row that produced it.
  it('carries at least one source locator on every branch', () => {
    for (const input of EVERY_BRANCH) {
      expect(evaluateStudioAccess(input).decision.sourceRefs.length).toBeGreaterThan(0)
    }
  })

  // Fails if the evaluator ever closes over a module-load snapshot instead of
  // reading the register it was handed: the SAME input object evaluated against
  // two different domain states must give two different answers.
  it('reads the register it is handed, never a module-load snapshot', () => {
    const base = inputFor(AUTHOR_ROW)
    expect(evaluateStudioAccess(base).outcome).toBe('allowed')
    expect(evaluateStudioAccess({ ...base, state: SUSPENDED_STATE }).outcome).toBe('unavailable')
  })
})

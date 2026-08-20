import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { STU_MODULES, reachByStudioMatrix, stuModuleById } from '@/studio/modules'
import { evaluateStudioAccess } from '@/studio/access/evaluate'
import { STUDIO_DECISIONS, studioDecision } from '@/studio/disclosure/decisions'
import * as stu11Chain from '@/studio/modules/stu-11/chain'
import { SUBMISSION_STATES } from '@/studio/vocab'
import { publishCheckById } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  registerPublishChecks,
  evaluatePublish,
} from '@/studio/publish/register'
import { JOURNEY_STEPS } from '@/studio/journey/effects'
import {
  FB_SEQ_012,
  fbSeq012TerminalState,
  journeyStates,
  journeyStateAfterStep,
  linkableVersions,
} from '@/studio/journey/fixture'
import {
  STU_11_MATRIX,
  STU_11_CAPABILITY_IDS,
  approvalRow,
  type StudioApprovalCapabilityId,
} from '@/studio/modules/stu-11/matrix'
import {
  APPROVAL_CONSUMERS,
  APPROVAL_CONSUMER_CONTRACTS,
  APPROVAL_TRANSITION_IDS,
  APPROVAL_TRANSITIONS,
  APPROVAL_REFUSAL_CODES,
  DIAGRAM_ONLY_NODES,
  applyTransition,
  submit,
  review,
  withdraw,
  returnWithComments,
  advance,
  resubmit,
  release,
  decline,
  visibleQueue,
  ageingBand,
  chainStalled,
  checkChainStaffable,
  chainStaffablePublishCheck,
  diffUnavailable,
  seededDiffEngine,
  approvalNotificationRows,
  type ApprovalChain,
  type ApprovalConsumer,
  type ApprovalContext,
  type ApprovalAuditEntry,
  type ChainStaffing,
} from '@/studio/modules/stu-11/chain'
import {
  LANE_B_VALUE_CLASSES,
  LANE_B_PROTECTED_CLASSES,
  SEEDED_LANE_B_FIELD_MAP,
  seededLaneBClassifier,
  laneBEntersTheChain,
} from '@/studio/modules/stu-11/laneb'
import { ApprovalWorkflowScreen } from '../../app/studio/approvals/ApprovalWorkflowScreen'
import { SEEDED_CHAINS } from '../../app/studio/approvals/fixtures'

// ---------------------------------------------------------------------------
// Fixtures.
//
// DEFECT SHAPE 11 — a guard whose baseline was chosen so the failure could not
// appear. Every fixture below sits on the PERMITTING side of every boundary a
// given test is not exercising: signed in, tenant ACTIVE, online, grants
// Active, tier Enterprise, chain staffed three deep, a working diff engine and
// an audit sink that commits. Each refusal test moves ONE field and is paired
// with the permitted baseline asserted to succeed, so a refusal arriving for
// the wrong reason cannot certify the guard.
// ---------------------------------------------------------------------------

const TENANT = tenantId('TEN-BRIGHT-BIKES')
const OTHER_TENANT = tenantId('TEN-OTHER')

const DOMAIN: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-APPROVALS')),
  TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

const AUTHOR = { identityId: 'IDN-SAM', roles: ['SUPERVISOR'] as const, signedIn: true, tenant: TENANT }
const REVIEWER = { identityId: 'IDN-RIVERSIDE', roles: ['SUPERVISOR'] as const, signedIn: true, tenant: TENANT }
const RELEASER = { identityId: 'IDN-ELENA', roles: ['QUALITY_MANAGER'] as const, signedIn: true, tenant: TENANT }
const TENANT_ADMIN = { identityId: 'IDN-ADMIN', roles: ['TENANT_ADMIN'] as const, signedIn: true, tenant: TENANT }
const WORKER = { identityId: 'IDN-WORKER', roles: ['WORKER'] as const, signedIn: true, tenant: TENANT }
const AUDITOR = { identityId: 'IDN-AUDIT', roles: ['READONLY_AUDITOR'] as const, signedIn: true, tenant: TENANT }
const IMPL = { identityId: 'IDN-IMPL', roles: ['SUPERVISOR'] as const, signedIn: true, tenant: TENANT }
/** `TEST-STU-152` (L34681) — one person, both roles, still one person (L33389). */
const DUAL = {
  identityId: 'IDN-DUAL-01',
  roles: ['SUPERVISOR', 'QUALITY_MANAGER'] as const,
  signedIn: true,
  tenant: TENANT,
}

const STAFFED: ChainStaffing = {
  authoringGrantHolders: ['IDN-SAM', 'IDN-RIVERSIDE', 'IDN-ELENA', 'IDN-DUAL-01'],
  reviewerEligible: ['IDN-RIVERSIDE', 'IDN-ELENA', 'IDN-DUAL-01'],
  releaseAuthorityEligible: ['IDN-ELENA', 'IDN-DUAL-01'],
}

/** `FB-SEQ-012` / `DEC-RELAUTH-001` — one Quality Manager, one grant holder. */
const ONE_PERSON_QUALITY_TEAM: ChainStaffing = {
  authoringGrantHolders: ['IDN-SAM', 'IDN-ELENA'],
  reviewerEligible: ['IDN-ELENA'],
  releaseAuthorityEligible: ['IDN-ELENA'],
}

interface Sink {
  readonly entries: ApprovalAuditEntry[]
  readonly write: (entry: ApprovalAuditEntry) => { ok: true } | { ok: false; reason: string }
}

function recordingSink(): Sink {
  const entries: ApprovalAuditEntry[] = []
  return {
    entries,
    write: (entry) => {
      entries.push(entry)
      return { ok: true }
    },
  }
}

function failingSink(reason = 'the audit store did not commit'): Sink {
  const entries: ApprovalAuditEntry[] = []
  return { entries, write: () => ({ ok: false, reason }) }
}

function ctx(
  actor: { identityId: string; roles: readonly string[]; signedIn: boolean; tenant: typeof TENANT },
  over: Partial<ApprovalContext> = {},
): ApprovalContext {
  return {
    actor: actor as ApprovalContext['actor'],
    grants: { 'GRANT-STU-AUTHOR': 'Active' },
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    domain: DOMAIN,
    online: true,
    at: '2026-06-21T09:00:00.000Z',
    audit: recordingSink().write,
    diff: seededDiffEngine,
    staffing: STAFFED,
    ...over,
  }
}

const NEW_SUBMISSION = {
  submissionId: 'SUB-BB-0001',
  consumer: 'workflow' as ApprovalConsumer,
  subject: 'Wheel Bolt Torque Verification',
  tenant: TENANT,
}

/** The happy path of L33324-L33329, driven rather than constructed. */
function submitted(over: Partial<ApprovalContext> = {}): ApprovalChain {
  const out = submit(ctx(AUTHOR, over), NEW_SUBMISSION)
  if (!out.ok) throw new Error(`fixture could not submit: ${out.refusal.reason}`)
  return out.chain
}

function advanced(): ApprovalChain {
  const out = advance(submitted(), ctx(REVIEWER))
  if (!out.ok) throw new Error(`fixture could not advance: ${out.refusal.reason}`)
  return out.chain
}

function returned(): ApprovalChain {
  const out = returnWithComments(submitted(), ctx(REVIEWER, { comments: 'Screen 7 coaching default is stale.' }))
  if (!out.ok) throw new Error(`fixture could not return: ${out.refusal.reason}`)
  return out.chain
}

function released(): ApprovalChain {
  const out = release(advanced(), ctx(RELEASER))
  if (!out.ok) throw new Error(`fixture could not release: ${out.refusal.reason}`)
  return out.chain
}

function withdrawn(): ApprovalChain {
  const out = withdraw(submitted(), ctx(AUTHOR))
  if (!out.ok) throw new Error(`fixture could not withdraw: ${out.refusal.reason}`)
  return out.chain
}

const SOURCE_FILES = [
  'src/studio/modules/stu-11/matrix.ts',
  'src/studio/modules/stu-11/chain.ts',
  'src/studio/modules/stu-11/laneb.ts',
  'app/studio/approvals/ApprovalWorkflowScreen.tsx',
  'app/studio/approvals/fixtures.ts',
] as const

const sourceOf = (path: string) => readFileSync(path, 'utf8')
/** Comments name the constructs they forbid, so they are stripped before scanning. */
const codeOf = (path: string) =>
  sourceOf(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')

// ===========================================================================
// STEP 1 — the matrix, transcribed from L33268-L33279.
// ===========================================================================

describe('the MOD-STU-11 permission matrix (L33268-L33279)', () => {
  // FAILS IF: a row is dropped from or added to STU_11_MATRIX. The source's
  // table has ten data rows between the header at L33268 and L33279.
  it('carries the source table’s ten data rows, in source order', () => {
    expect(STU_11_MATRIX).toHaveLength(10)
    expect(STU_11_MATRIX.map((r) => r.id)).toEqual([...STU_11_CAPABILITY_IDS])
    expect(STU_11_CAPABILITY_IDS).toHaveLength(10)
  })

  // FAILS IF: a cell for one of the eight persona columns is dropped. Seven
  // columns head the module card; the vocabulary the reach generator and the
  // evaluator share has eight, and a missing key would read as "withheld"
  // without anybody writing that down.
  it('answers all eight persona columns on every row, none omitted', () => {
    for (const row of STU_11_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual(
        [
          'implementation-team',
          'plant-manager-persona',
          'quality-manager',
          'read-only-auditor',
          'supervisor-with-authoring-grant',
          'supervisor-without-grant',
          'tenant-admin',
          'worker',
        ].sort(),
      )
    }
  })

  // FAILS IF: row 9's Quality Manager cell stops reading `explicitlyProhibited`
  // — the one row the source prohibits in every single column (L33278).
  it('prohibits bypassing the Release Authority in all eight columns', () => {
    const bypass = approvalRow('bypass-the-release-authority')
    const outcomes = Object.values(bypass.cells).map((c) => c.outcome)
    expect(outcomes).toHaveLength(8)
    expect(new Set(outcomes)).toEqual(new Set(['explicitlyProhibited']))
  })

  // FAILS IF: the implementation-team column gains a permission on any row
  // other than the two the source grants it (author-and-submit, read-the-log).
  // L33251: "Approval authority rests with the tenant from day one."
  it('gives the implementation team nothing but authoring, submission and the read', () => {
    const permitted = STU_11_MATRIX.filter(
      (r) => r.cells['implementation-team'].outcome !== 'explicitlyProhibited',
    ).map((r) => r.id)
    expect(permitted).toEqual(['author-and-submit', 'read-the-approval-log'])
  })

  // FAILS IF: a constraint is moved from a cell onto the row. Row 2's two
  // permitting cells carry DIFFERENT conditions in the source's own words, and
  // row 6's two named cells disagree outright — Quality Manager
  // `Allowed with conditions`, Supervisor-with-grant `Explicitly prohibited`.
  it('keeps a row’s conditions on the cell, because a row is not uniform across its columns', () => {
    const review = approvalRow('review-a-submission')
    expect(review.cells['quality-manager'].note).toContain('not if they will release it')
    expect(review.cells['supervisor-with-authoring-grant'].note).toContain('they did not author')
    expect(review.cells['quality-manager'].note).not.toEqual(
      review.cells['supervisor-with-authoring-grant'].note,
    )
    const rel = approvalRow('release-and-publish')
    expect(rel.cells['quality-manager'].outcome).toBe('allowedWithConditions')
    expect(rel.cells['supervisor-with-authoring-grant'].outcome).toBe('explicitlyProhibited')
  })

  // FAILS IF: the two client-decision cells the source names are collapsed onto
  // a refusal or a grant. L33276 (DEC-RELAUTH-001) and L33279 (DEC-AUDSTU-001).
  it('preserves the two Client Decision Required cells with their decision identifiers', () => {
    const open = STU_11_MATRIX.flatMap((r) =>
      Object.entries(r.cells)
        .filter(([, c]) => c.outcome === 'clientDecisionRequired')
        .map(([column, c]) => `${r.id}/${column}/${c.openDecision}`),
    )
    expect(open).toEqual([
      'hold-release-authority-override/supervisor-with-authoring-grant/DEC-RELAUTH-001',
      'read-the-approval-log/read-only-auditor/DEC-AUDSTU-001',
    ])
  })

  // FAILS IF: the reach rule stops reading this matrix, or a row is classified
  // `chrome`/`another-surface` so clause one skips it. The Worker is the only
  // persona this module withholds outright (L33270-L33279 prohibit the Worker
  // in every column) and the Auditor's only non-prohibited cell defers.
  it('derives a reach map in which only the Worker is withheld and only the Auditor is open', () => {
    const reach = reachByStudioMatrix(STU_11_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach.worker).toBe('withheld')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-without-grant']).toBe('offered')
    expect(reach['tenant-admin']).toBe('offered')
    expect(reach['implementation-team']).toBe('offered')
  })
})

// ===========================================================================
// STEP 2 — identity distinctness across all reuse consumers.
// ===========================================================================

describe('separation of duties by identity, in every reuse consumer (L33389, TEST-STU-152)', () => {
  // FAILS IF: distinctness is compared on ROLE SETS instead of on identityId.
  // The persona holds both Supervisor and Quality Manager; a role-based check
  // finds a second role and lets one person take a second stage.
  it('refuses a second stage to the same identity in every consumer', () => {
    expect(APPROVAL_CONSUMERS.length).toBeGreaterThan(4)
    let refused = 0
    for (const consumer of APPROVAL_CONSUMERS) {
      const s = submit(ctx(DUAL), { ...NEW_SUBMISSION, consumer, submissionId: `SUB-${consumer}` })
      expect(s.ok).toBe(true)
      if (!s.ok) continue
      const r = review(s.chain, ctx(DUAL))
      expect(r.ok).toBe(false)
      if (!r.ok) {
        expect(r.decision.decision.stage).toBe('SEGREGATION_OF_DUTIES')
        expect(r.reason).toMatch(/one person/i)
        refused += 1
      }
      // The pairing that keeps the assertion honest: a DIFFERENT identity
      // holding one role reviews the same submission.
      expect(review(s.chain, ctx(REVIEWER)).ok).toBe(true)
    }
    expect(refused).toBe(APPROVAL_CONSUMERS.length)
  })

  // FAILS IF: `release` stops reading `reviewerOfRecord`. L33275 —
  // "never on a submission they authored or reviewed"; TEST-STU-105.
  it('refuses release on a submission the actor authored or reviewed', () => {
    const authored = submit(ctx(DUAL), { ...NEW_SUBMISSION, submissionId: 'SUB-A' })
    expect(authored.ok).toBe(true)
    if (!authored.ok) return
    const onward = advance(authored.chain, ctx(REVIEWER))
    expect(onward.ok).toBe(true)
    if (!onward.ok) return
    const byAuthor = release(onward.chain, ctx(DUAL))
    expect(byAuthor.ok).toBe(false)
    if (!byAuthor.ok) expect(byAuthor.refusal.decision?.stage).toBe('SEGREGATION_OF_DUTIES')

    const reviewed = advance(submitted(), ctx(DUAL))
    expect(reviewed.ok).toBe(true)
    if (!reviewed.ok) return
    const byReviewer = release(reviewed.chain, ctx(DUAL))
    expect(byReviewer.ok).toBe(false)
    if (!byReviewer.ok) expect(byReviewer.refusal.decision?.stage).toBe('SEGREGATION_OF_DUTIES')

    // The pairing: a third identity, neither Author nor Reviewer, releases.
    expect(release(reviewed.chain, ctx(RELEASER)).ok).toBe(true)
  })

  // FAILS IF: `AC-STU-097`'s three-distinct-identities floor stops being read
  // off the log. Three recorded transitions, three identities, one version.
  it('completes a chain only with three distinct identities and one new version (TEST-STU-103)', () => {
    const sink = recordingSink()
    const s = submit(ctx(AUTHOR, { audit: sink.write }), NEW_SUBMISSION)
    expect(s.ok).toBe(true)
    if (!s.ok) return
    const a = advance(s.chain, ctx(REVIEWER, { audit: sink.write }))
    expect(a.ok).toBe(true)
    if (!a.ok) return
    const r = release(a.chain, ctx(RELEASER, { audit: sink.write }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const transitions = sink.entries.filter((e) => e.kind === 'transition')
    expect(transitions).toHaveLength(3)
    expect(new Set(transitions.map((e) => e.actor)).size).toBe(3)
    expect(r.chain.versionMinted).not.toBeNull()
    expect(r.chain.state).toBe('Released')
    // Every transition records role, timestamp, version and comments
    // (`AC-STU-102`, L33402).
    for (const e of transitions) {
      expect(e.role).not.toBeNull()
      expect(e.at).not.toBe('')
      expect(Array.isArray(e.comments)).toBe(true)
    }
  })
})

// ===========================================================================
// STEP 3 — the chain cannot be bypassed; refusals name why.
// ===========================================================================

describe('the transitions that must be refused', () => {
  // FAILS IF: any edge is added to or removed from APPROVAL_TRANSITIONS. The
  // state diagram at L33343-L33350 draws exactly these, and this walks all
  // 6 origins x 7 transitions and counts both sides. `DRAWN` is written out
  // from the source's diagram rather than derived from the table, so the two
  // have to agree.
  it('permits exactly the seven drawn edges and refuses the other thirty-five', () => {
    const origins: readonly (readonly [string, ApprovalChain | null])[] = [
      ['no-submission', null],
      ['Submitted', submitted()],
      ['Returned with comments', returned()],
      ['Advanced', advanced()],
      ['Released', released()],
      ['Withdrawn', withdrawn()],
    ]
    const DRAWN = new Set([
      'no-submission::submit',
      'Submitted::withdraw',
      'Submitted::return-with-comments',
      'Submitted::advance',
      'Returned with comments::resubmit',
      'Advanced::decline',
      'Advanced::release',
    ])
    // The actor who legitimately holds the stage each transition occupies, so
    // a drawn edge cannot be refused for an actor reason and be counted as a
    // state refusal.
    const ACTOR_FOR = {
      submit: AUTHOR,
      withdraw: AUTHOR,
      resubmit: AUTHOR,
      'return-with-comments': REVIEWER,
      advance: REVIEWER,
      release: RELEASER,
      decline: RELEASER,
    } as const

    expect(origins).toHaveLength(6)
    expect(APPROVAL_TRANSITION_IDS).toHaveLength(7)
    expect(DRAWN.size).toBe(7)

    let permitted = 0
    let refused = 0
    for (const [name, chain] of origins) {
      for (const transition of APPROVAL_TRANSITION_IDS) {
        const key = `${name}::${transition}`
        const out = applyTransition(
          chain,
          transition,
          ctx(ACTOR_FOR[transition], { comments: 'a stated reason, so no text refusal can stand in' }),
          NEW_SUBMISSION,
        )
        if (DRAWN.has(key)) {
          expect({ key, ok: out.ok }).toEqual({ key, ok: true })
          permitted += 1
        } else {
          expect({ key, code: out.ok ? 'PERMITTED' : out.refusal.code }).toEqual({
            key,
            code: 'wrong-stage',
          })
          refused += 1
        }
      }
    }
    expect(permitted).toBe(7)
    expect(refused).toBe(35)
  })

  // FAILS IF: separation of duties reads only the CURRENT cycle's holder
  // rather than everyone who has ever held the stage on this submission. A
  // submission is one submission across every cycle (L33289), so a person who
  // reviewed cycle one still cannot release cycle two.
  it('refuses release to a Reviewer from an earlier cycle', () => {
    const first = returnWithComments(submitted(), ctx(RELEASER, { comments: 'Fix screen 7.' }))
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const again = resubmit(first.chain, ctx(AUTHOR))
    expect(again.ok).toBe(true)
    if (!again.ok) return
    expect(again.chain.reviewerOfRecord).toBeNull()
    const second = advance(again.chain, ctx(REVIEWER))
    expect(second.ok).toBe(true)
    if (!second.ok) return
    // IDN-ELENA reviewed cycle one and may not release cycle two.
    const out = release(second.chain, ctx(RELEASER))
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.refusal.decision?.stage).toBe('SEGREGATION_OF_DUTIES')
  })

  // FAILS IF: `Released` becomes reachable from anything but `Advanced`, or
  // from any transition but `release`. L33355 — "there is exactly one
  // transition into Released and it originates from the Release Authority".
  it('leaves exactly one edge into Released, from Advanced', () => {
    const into = APPROVAL_TRANSITIONS.filter((t) => t.to === 'Released')
    expect(into).toHaveLength(1)
    expect(into[0]!.id).toBe('release')
    expect([...into[0]!.from]).toEqual(['Advanced'])
    expect(into[0]!.stage).toBe('release-authority')
  })

  // FAILS IF: the empty-comment guard is dropped. L53535 — "Rejection without
  // comments is refused, because the comment is the instruction to the Author."
  it('refuses a return with no comments', () => {
    const empty = returnWithComments(submitted(), ctx(REVIEWER, { comments: '' }))
    expect(empty.ok).toBe(false)
    if (!empty.ok) expect(empty.refusal.code).toBe('comments-required')
    const blank = returnWithComments(submitted(), ctx(REVIEWER, { comments: '   ' }))
    expect(blank.ok).toBe(false)
    // The pairing: one character of real instruction and it is accepted.
    expect(returnWithComments(submitted(), ctx(REVIEWER, { comments: 'Fix screen 7.' })).ok).toBe(true)
  })

  // FAILS IF: the Decline reason stops being mandatory. SB-STU-14 (L33357) —
  // "Release and Decline controls and a mandatory reason field on Decline".
  it('refuses a decline with no reason, and names the reason rather than comments', () => {
    const out = decline(advanced(), ctx(RELEASER, { comments: '' }))
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.refusal.code).toBe('decline-reason-required')
      expect(out.refusal.reason).toMatch(/reason/i)
    }
    expect(decline(advanced(), ctx(RELEASER, { comments: 'Bands not re-based.' })).ok).toBe(true)
  })

  // FAILS IF: `resubmit` produces anything but `Submitted`. `AC-WF-AUT-007-04`
  // (L53575) — "No auto-acceptance of a resubmission exists"; L53567 — a
  // revision cannot skip the Reviewer stage.
  it('refuses auto-acceptance of a resubmission', () => {
    const out = resubmit(returned(), ctx(AUTHOR))
    expect(out.ok).toBe(true)
    expect(out.state).toBe('Submitted')
    if (!out.ok) return
    expect(out.chain.reviewerOfRecord).toBeNull()
    expect(out.chain.versionMinted).toBeNull()
    expect(out.chain.cycles).toBe(2)
    // And the Reviewer stage is still there to be taken.
    expect(review(out.chain, ctx(REVIEWER)).ok).toBe(true)
  })

  // FAILS IF: the diff engine stops being consulted, or the hold degrades to an
  // advance. `FUNC-STU-12-01-A-2` (L33486) — "the submission is held rather
  // than advanced, because advancing an unvalidated classification could
  // auto-adopt a behaviour change."
  it('holds rather than advances when the diff engine is unavailable', () => {
    const held = advance(submitted(), ctx(REVIEWER, { diff: diffUnavailable }))
    expect(held.state).toBe('Submitted')
    expect(held.ok).toBe(false)
    if (!held.ok) expect(held.refusal.code).toBe('diff-unavailable')
    // The pairing: the same call with a working engine advances.
    expect(advance(submitted(), ctx(REVIEWER, { diff: seededDiffEngine })).state).toBe('Advanced')
  })

  // FAILS IF: `diff` gains a permissive default. C6 — the engine is injected,
  // and an omitted engine must fail closed rather than wave the stage through.
  it('defaults the injected diff engine to unavailable, so an unwired engine cannot advance', () => {
    const withoutDiff: ApprovalContext = {
      actor: REVIEWER,
      grants: { 'GRANT-STU-AUTHOR': 'Active' },
      commercialTier: 'Enterprise',
      identityLayer: 'reachable',
      domain: DOMAIN,
      online: true,
      at: '2026-06-21T09:00:00.000Z',
      audit: recordingSink().write,
      staffing: STAFFED,
    }
    const held = advance(submitted(), withoutDiff)
    expect(held.ok).toBe(false)
    if (!held.ok) expect(held.refusal.code).toBe('diff-unavailable')
    expect(diffUnavailable.diff(submitted()).available).toBe(false)
    // Release signs off "against the diff and the change summary" (L33243), so
    // it holds on the same absence.
    expect(release(advanced(), { ...ctx(RELEASER), diff: diffUnavailable }).ok).toBe(false)
  })

  // FAILS IF: the Reviewer's edit prohibition softens for any persona.
  // L33272 / `AC-STU-098` (L33398) — the Reviewer cannot edit in any path;
  // `FUNC-STU-11-01-B-3` allows the capability to NO role, "including the
  // Quality Manager".
  it('refuses a content edit while reviewing to every persona, including the Quality Manager', () => {
    const edit = approvalRow('edit-content-while-reviewing')
    const outcomes = Object.values(edit.cells).map((c) => c.outcome)
    expect(outcomes).toHaveLength(8)
    expect(new Set(outcomes)).toEqual(new Set(['explicitlyProhibited']))
    expect(edit.cells['quality-manager'].note).toContain('corrections go back to the Author')
    // No transition in the chain produces a content change either. Widened to
    // the union so the assertion is a runtime check rather than a tautology the
    // compiler discharges: it goes red if a transition ever names this row.
    expect(
      APPROVAL_TRANSITIONS.map((t): StudioApprovalCapabilityId => t.capability),
    ).not.toContain('edit-content-while-reviewing')
  })

  // FAILS IF: the Tenant Admin gains any stage. L33270-L33279 prohibit every
  // stage row; L34559 — "holds no stage, for separation of duties";
  // TEST-STU-106.
  it('refuses every stage to a Tenant Admin and audits each refusal (TEST-STU-106)', () => {
    const sink = recordingSink()
    const attempts = [
      () => submit(ctx(TENANT_ADMIN, { audit: sink.write }), { ...NEW_SUBMISSION, submissionId: 'SUB-TA' }),
      () => advance(submitted(), ctx(TENANT_ADMIN, { audit: sink.write })),
      () => release(advanced(), ctx(TENANT_ADMIN, { audit: sink.write })),
      () => returnWithComments(submitted(), ctx(TENANT_ADMIN, { audit: sink.write, comments: 'no' })),
    ]
    for (const attempt of attempts) expect(attempt().ok).toBe(false)
    const refusals = sink.entries.filter((e) => e.kind === 'refusal')
    expect(refusals).toHaveLength(4)
    expect(sink.entries.filter((e) => e.kind === 'transition')).toHaveLength(0)
  })

  // FAILS IF: the Worker gains anything at all, or the Auditor's open decision
  // is read as a grant. L33279 / `AC-STU-150`.
  it('refuses the whole chain to the Worker and to the Read-only Auditor', () => {
    for (const persona of [WORKER, AUDITOR]) {
      expect(submit(ctx(persona), { ...NEW_SUBMISSION, submissionId: 'SUB-X' }).ok).toBe(false)
      expect(advance(submitted(), ctx(persona)).ok).toBe(false)
      expect(release(advanced(), ctx(persona)).ok).toBe(false)
    }
  })

  // FAILS IF: a revoked GRANT-STU-IMPL keeps authoring. `AC-STU-101` (L33401)
  // — the grant can never approve or release, and revocation is enforced at
  // the identity layer.
  it('lets the implementation team author and submit, and never approve or release', () => {
    const staffing: ChainStaffing = {
      ...STAFFED,
      authoringGrantHolders: [...STAFFED.authoringGrantHolders, 'IDN-IMPL'],
    }
    const held = ctx(IMPL, { grants: { 'GRANT-STU-IMPL': 'Active' }, staffing })
    const s = submit(held, { ...NEW_SUBMISSION, submissionId: 'SUB-IMPL' })
    expect(s.ok).toBe(true)
    if (!s.ok) return
    expect(advance(s.chain, ctx(REVIEWER, { grants: { 'GRANT-STU-AUTHOR': 'Active' } })).ok).toBe(true)
    expect(release(advanced(), held).ok).toBe(false)
    // Revoked at onboarding's end: the same person can no longer submit.
    const revoked = ctx(IMPL, { grants: { 'GRANT-STU-IMPL': 'Revoked' }, staffing })
    expect(submit(revoked, { ...NEW_SUBMISSION, submissionId: 'SUB-IMPL-2' }).ok).toBe(false)
  })

  // FAILS IF: `withdraw` stops checking who the Author of record is.
  // `FUNC-STU-11-01-A-2` — "Roles allowed: the Author only."
  it('refuses a withdrawal by anyone but the Author of record', () => {
    const out = withdraw(submitted(), ctx(RELEASER))
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.refusal.code).toBe('not-the-author')
    expect(withdraw(submitted(), ctx(AUTHOR)).state).toBe('Withdrawn')
  })

  // FAILS IF: the refusal vocabulary gains an escape hatch, or a code is
  // dropped so a refusal has to borrow another one's name.
  it('closes the refusal vocabulary at the eight the chain can produce', () => {
    expect([...APPROVAL_REFUSAL_CODES]).toEqual([
      'not-authorised',
      'wrong-stage',
      'not-the-author',
      'comments-required',
      'decline-reason-required',
      'diff-unavailable',
      'chain-not-staffable',
      'transition-not-recorded',
    ])
  })
})

// ===========================================================================
// Bypass prevented structurally.
// ===========================================================================

describe('no override, no self-approval, no timeout-equals-approval', () => {
  // FAILS IF: a waiver argument is introduced on any path. The scan is proven
  // able to bite by the plant recorded in the report; `releaseAuthorityOverride`
  // — the source's own row 7 capability — is deliberately NOT matched, because
  // that override changes WHO holds the stage and never that the stage is held.
  it('models no way past a stage', () => {
    const hits: string[] = []
    for (const path of SOURCE_FILES) {
      for (const match of codeOf(path).matchAll(
        /\b(force|bypass|waive|waiver|skipStage|selfApprove|autoApprove|autoAccept|overrideChain|allowSelf)\s*[:(=?]/g,
      )) {
        hits.push(`${path}: ${match[1]}`)
      }
    }
    expect(hits).toEqual([])
  })

  // FAILS IF: any transition becomes reachable without an audit sink, or the
  // audit sink is given a default. A required parameter is the structure; a
  // default would be the hole.
  it('requires an audit sink on the one entry point, with no default', () => {
    for (const path of ['src/studio/modules/stu-11/chain.ts']) {
      expect(codeOf(path)).not.toMatch(/audit\s*[?]?\s*[:=]\s*\(\s*\)\s*=>/)
    }
    // Every wrapper routes through `applyTransition`; nothing else mutates.
    const code = codeOf('src/studio/modules/stu-11/chain.ts')
    const mutators = code.match(/^export function (submit|withdraw|returnWithComments|advance|resubmit|release|decline)\b/gm)
    expect(mutators).toHaveLength(7)
    expect(code.match(/applyTransition\(/g)?.length).toBeGreaterThanOrEqual(8)
  })

  // FAILS IF: ageing is allowed to decide anything. L33382's ageing
  // notification escalates to the Quality Manager; it moves no stage.
  it('never lets time advance a submission — ageing is an indicator, not a decision', () => {
    const s = submitted()
    // Ninety-six hours later, past every ageing band, the state is unmoved and
    // nothing but a notification has happened.
    expect(ageingBand('2026-06-21T09:00:00.000Z', '2026-06-25T09:00:00.000Z')).toBe('beyond 72 hours')
    expect(ageingBand('2026-06-21T09:00:00.000Z', '2026-06-21T10:00:00.000Z')).toBe('under 24 hours')
    // An unreadable stamp is NAMED, never understated as young.
    expect(ageingBand('not a timestamp', '2026-06-25T09:00:00.000Z')).toBe('age not readable')
    expect(s.state).toBe('Submitted')
    expect(s.versionMinted).toBeNull()
    const rows = approvalNotificationRows()
    expect(rows).toHaveLength(5)
    for (const row of rows) expect(row.provesApproval).toBe(false)
    // Notification is not completion: none of the eleven progression states is
    // a submission state.
    for (const row of rows)
      for (const st of row.progression) expect(SUBMISSION_STATES).not.toContain(st)
  })

  // FAILS IF: the Author's queue starts filtering on notification delivery.
  // `AC-WF-AUT-006-03` (L53543) — "Returned items are visible in the Author's
  // queue independently of notification delivery."
  it('shows a returned item in the Author’s queue with no notification delivered', () => {
    const chain = { ...returned(), notificationDelivered: false }
    const seen = visibleQueue([chain], ctx(AUTHOR))
    expect(seen.map((c) => c.submissionId)).toEqual([chain.submissionId])
  })
})

// ===========================================================================
// STEP 4 — the staffability check, registered as publish check 11.
// ===========================================================================

describe('DEC-RELAUTH-001 — the pre-submission staffing check', () => {
  // FAILS IF: `chain-staffable` is removed from the registry or re-owned. This
  // is the pointer test: it fails when its target is removed.
  it('is publish check eleven, owned by MOD-STU-11', () => {
    const check = publishCheckById('chain-staffable')
    expect(check.ordinal).toBe(11)
    expect([...check.ownerModules]).toContain('MOD-STU-11')
    expect(chainStaffablePublishCheck.checkId).toBe('chain-staffable')
    expect(chainStaffablePublishCheck.implementedBy).toBe('MOD-STU-11')
    expect(FB_SEQ_012.publishCheckId).toBe('chain-staffable')
  })

  // FAILS IF: the shortfall stops being named, or the wrong stage is named.
  // L33255 — a tenant with one Quality Manager and one grant holder "can
  // author and review but cannot release".
  it('names WHICH stage has no eligible distinct holder', () => {
    const verdict = checkChainStaffable(ONE_PERSON_QUALITY_TEAM, 'IDN-SAM')
    expect(verdict.staffable).toBe(false)
    if (verdict.staffable) return
    expect(verdict.shortfall).toBe('release-authority')
    expect(verdict.reason).toMatch(/Release Authority/i)
    // FB-SEQ-012's own shape: the only other grant holder authored it.
    const noReviewer = checkChainStaffable(
      { authoringGrantHolders: ['IDN-SAM'], reviewerEligible: ['IDN-SAM'], releaseAuthorityEligible: ['IDN-ELENA'] },
      'IDN-SAM',
    )
    expect(noReviewer.staffable).toBe(false)
    if (!noReviewer.staffable) expect(noReviewer.shortfall).toBe('reviewer')
    // The pairing: three distinct eligible people and it is staffable.
    expect(checkChainStaffable(STAFFED, 'IDN-SAM').staffable).toBe(true)
  })

  // FAILS IF: submission is allowed to start on an unstaffable chain.
  // `AC-STU-103` (L33403) / TEST-STU-108.
  it('blocks submission before it starts, naming the shortfall (TEST-STU-108)', () => {
    const out = submit(ctx(AUTHOR, { staffing: ONE_PERSON_QUALITY_TEAM }), NEW_SUBMISSION)
    expect(out.ok).toBe(false)
    expect(out.chain).toBeNull()
    if (!out.ok) {
      expect(out.refusal.code).toBe('chain-not-staffable')
      expect(out.refusal.reason).toMatch(/Release Authority/i)
    }
  })

  // FAILS IF: the check passes an unstaffable chain, or the register stops
  // failing closed on the ten checks nobody registered here.
  it('blocks publication through Task 5’s register, and the other ten still fail closed', () => {
    const empty = createPublishCheckRegister<{ staffing: ChainStaffing; author: string }>()
    const registered = registerPublishChecks(empty, chainStaffablePublishCheck)
    expect(registered.ok).toBe(true)
    if (!registered.ok) return

    const bad = evaluatePublish(registered.register, {
      staffing: ONE_PERSON_QUALITY_TEAM,
      author: 'IDN-SAM',
    })
    expect(bad.blocked).toBe(true)
    expect(bad.blockers).toHaveLength(11)
    const mine = bad.blockers.filter((b) => b.checkId === 'chain-staffable')
    expect(mine).toHaveLength(1)
    expect(mine[0]!.kind).toBe('failed')
    expect(mine[0]!.blockingElement).toMatch(/Release Authority/i)
    expect(bad.blockers.filter((b) => b.kind === 'cannot-run')).toHaveLength(10)

    const good = evaluatePublish(registered.register, { staffing: STAFFED, author: 'IDN-SAM' })
    expect([...good.passed]).toEqual(['chain-staffable'])
    // Still blocked — by the ten nobody registered, not by mine.
    expect(good.blocked).toBe(true)
  })

  // FAILS IF: `FB-SEQ-012`'s terminal state stops being derived from the
  // journey, or the four downstream absences stop being asserted together.
  it('leaves the one-person quality team with no version, no package and no Job linkage', () => {
    const fold = journeyStates(JOURNEY_STEPS)
    expect(fold.ok).toBe(true)
    if (!fold.ok) return
    const afterSubmit = journeyStateAfterStep(fold.states, FB_SEQ_012.branchesFromStep)
    expect(afterSubmit.ok).toBe(true)
    if (!afterSubmit.ok) return
    const terminal = fbSeq012TerminalState(afterSubmit.state)
    expect(terminal.submission?.status).toBe('Submitted')
    expect(terminal.submission?.stalled).toBe(true)
    expect(terminal.versions).toEqual([])
    expect(terminal.workPackages).toEqual([])
    expect(terminal.hubPin).toBeNull()
    expect(linkableVersions(terminal)).toEqual([])
  })

  // FAILS IF: `Stalled` is promoted into the enumerated states, or the flag is
  // dropped so the deadlock stops being visible. D21.
  it('carries Stalled as a flag and never as a sixth submission state', () => {
    expect([...SUBMISSION_STATES]).toEqual([
      'Submitted',
      'Returned with comments',
      'Advanced',
      'Released',
      'Withdrawn',
    ])
    expect(SUBMISSION_STATES).not.toContain('Stalled')
    expect(studioDecision('D21').pins).toContain('Stalled')
    // The flag is DERIVED from the staffing that holds now, so it cannot go
    // stale: a submission whose remaining staff can no longer finish it reads
    // as stalled, and it is still `Submitted`.
    const chain = submitted()
    expect(chainStalled(chain, STAFFED)).toEqual({ stalled: false, reason: null })
    const stranded = chainStalled(chain, {
      authoringGrantHolders: ['IDN-SAM'],
      reviewerEligible: ['IDN-SAM'],
      releaseAuthorityEligible: ['IDN-SAM'],
    })
    expect(stranded.stalled).toBe(true)
    expect(stranded.reason).toMatch(/Reviewer/i)
    expect(chain.state).toBe('Submitted')
    // A released submission is never stalled, whatever the staffing says.
    expect(chainStalled(released(), ONE_PERSON_QUALITY_TEAM).stalled).toBe(false)
  })
})

// ===========================================================================
// STEP 5 — DEC-LANEB-001 disclosed, never implemented silently.
// ===========================================================================

describe('DEC-LANEB-001 and the Lane-B value classifier', () => {
  // FAILS IF: either locator string moves or a reading is dropped from D14.
  // The disclosure is the whole instruction `AC-STU-104` and `AC-STU-143` give.
  it('renders both readings with both locator sets', () => {
    const html = renderToStaticMarkup(createElement(ApprovalWorkflowScreen))
    expect(html).toContain('AC-STU-097 · L33397 · card DEC-LANEB-001 L33253')
    expect(html).toContain('AC-STU-138 · L34332 · card DEC-LANEB-001 L33253')
    expect(html).toContain('AC-STU-104')
    expect(html).toContain('AC-STU-143')
    expect(html).toContain('A client-delegated choice under APP-012')
    const d14 = studioDecision('D14')
    expect(d14.decisionRef).toBe('DEC-LANEB-001')
    expect(d14.readings).toHaveLength(2)
    // Neither reading can be marked as the source's answer: the record has no
    // field in which one could be.
    for (const reading of d14.readings)
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
  })

  // FAILS IF: a protected class stops routing through the chain, or the
  // unclassified default stops failing closed.
  it('routes the three protected value classes through the full chain, and fails closed on the rest', () => {
    expect([...LANE_B_PROTECTED_CLASSES]).toEqual([
      'specification-limit',
      'severity-mapping',
      'gate-rule',
    ])
    expect(LANE_B_VALUE_CLASSES).toHaveLength(5)
    const through = LANE_B_VALUE_CLASSES.filter((c) => laneBEntersTheChain(c).routesThroughChain)
    const straight = LANE_B_VALUE_CLASSES.filter((c) => !laneBEntersTheChain(c).routesThroughChain)
    expect([...through]).toEqual([
      'specification-limit',
      'severity-mapping',
      'gate-rule',
      'unclassified',
    ])
    expect([...straight]).toEqual(['outside-the-three-protected-classes'])
    expect(through.length).toBeGreaterThan(0)
    expect(straight.length).toBeGreaterThan(0)
  })

  // FAILS IF: the seeded map stops covering the nine configuration sections, or
  // an unseeded field resolves to anything but `unclassified`.
  it('classifies over a seeded field map whose provenance renders', () => {
    expect(Object.keys(SEEDED_LANE_B_FIELD_MAP)).toHaveLength(9)
    expect(seededLaneBClassifier.classify('Specification limits')).toBe('specification-limit')
    expect(seededLaneBClassifier.classify('Deviation rules and severity mapping')).toBe('severity-mapping')
    expect(seededLaneBClassifier.classify('Gate and proof')).toBe('gate-rule')
    expect(seededLaneBClassifier.classify('Screen content')).toBe('outside-the-three-protected-classes')
    expect(seededLaneBClassifier.classify('a field nothing seeded')).toBe('unclassified')
    expect(seededLaneBClassifier.openDecision).toBe('DEC-PKGFIELD-001')
    expect(renderToStaticMarkup(createElement(ApprovalWorkflowScreen))).toContain(
      seededLaneBClassifier.provenance,
    )
  })

  // FAILS IF: DEC-RELAUTH-001 leaves the shared decision canon, or this module
  // mints a local copy of it again — two renderings of one decision. The
  // landing already happened: this test used to assert the canon had NO record
  // and that the local `DEC_RELAUTH_001` const carried it; it now asserts the
  // opposite half and keeps the no-local-copy half.
  it('discloses DEC-RELAUTH-001 from the shared canon and keeps no local copy', () => {
    expect(STUDIO_DECISIONS.map((d): string | null => d.decisionRef)).toContain('DEC-RELAUTH-001')
    const record = studioDecision('D26')
    expect(record.decisionRef).toBe('DEC-RELAUTH-001')
    // All three of the source's options stand as readings, each with its own
    // locator, and the build's pick is in `adopted` and nowhere else.
    expect(record.readings).toHaveLength(3)
    for (const r of record.readings) expect(r.locator).toContain('L33255')
    expect(record.adopted).toMatch(/option \(a\)/i)
    // THE NO-LOCAL-COPY HALF. `MOD-STU-11` exports nothing named for this
    // decision, so a second record added here goes red on arrival.
    expect(Object.keys(stu11Chain).filter((k) => /RELAUTH/i.test(k))).toEqual([])
    // And the screen renders the canonical record, read off the record itself
    // so a rewording follows instead of going stale.
    const html = renderToStaticMarkup(createElement(ApprovalWorkflowScreen))
    expect(html).toContain('DEC-RELAUTH-001')
    for (const r of record.readings) expect(html).toContain(r.text)
    expect(html).toContain(record.adopted)
  })
})

// ===========================================================================
// STEP 6 — the audit path.
// ===========================================================================

describe('the audit path — after domain refusals, before mutation', () => {
  // FAILS IF: the mutation is applied before the audit write, or a failed audit
  // write is allowed to proceed. L33387 — the audit "commits in the same
  // transaction as the state change".
  it('advances nothing and mints no version when the audit write fails', () => {
    const before = submitted()
    const held = advance(before, ctx(REVIEWER, { audit: failingSink().write }))
    expect(held.ok).toBe(false)
    expect(held.state).toBe('Submitted')
    expect(held.chain).toBe(before)
    if (!held.ok) expect(held.refusal.code).toBe('transition-not-recorded')

    const advancedChain = advanced()
    const notReleased = release(advancedChain, ctx(RELEASER, { audit: failingSink().write }))
    expect(notReleased.ok).toBe(false)
    expect(notReleased.state).toBe('Advanced')
    expect(notReleased.chain?.versionMinted ?? null).toBeNull()
    expect(notReleased.chain).toBe(advancedChain)

    // The pairing: the same two calls with a committing sink DO move.
    expect(advance(before, ctx(REVIEWER)).state).toBe('Advanced')
    expect(release(advancedChain, ctx(RELEASER)).chain?.versionMinted).not.toBeNull()
  })

  // FAILS IF: the audit entry is written before the domain refusal is decided.
  // A refusal is audited AS A REFUSAL and never as a transition.
  it('writes no transition record for a refused transition', () => {
    const sink = recordingSink()
    const out = advance(released(), ctx(RELEASER, { audit: sink.write }))
    expect(out.ok).toBe(false)
    expect(sink.entries.filter((e) => e.kind === 'transition')).toHaveLength(0)
    expect(sink.entries.filter((e) => e.kind === 'refusal')).toHaveLength(1)
    expect(sink.entries[0]!.refusalCode).toBe('wrong-stage')
    expect(sink.entries[0]!.toState).toBeNull()
  })

  // FAILS IF: a failed audit write is allowed to REVIVE a refusal. The refusal
  // still stands; the audit failure is reported alongside it, never instead.
  it('still refuses when the refusal’s own audit write fails', () => {
    const out = release(submitted(), ctx(RELEASER, { audit: failingSink('sink down').write }))
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.refusal.code).toBe('wrong-stage')
      expect(out.auditFailure).toBe('sink down')
    }
  })

  // FAILS IF: a transition is recorded on a connection that dropped. L33365 —
  // "No transition is ever inferred from a partial request."
  it('records no transition and moves no stage when the actor is offline', () => {
    const before = submitted()
    const out = advance(before, ctx(REVIEWER, { online: false }))
    expect(out.ok).toBe(false)
    expect(out.state).toBe('Submitted')
    expect(out.chain).toBe(before)
    if (!out.ok) {
      expect(out.refusal.code).toBe('not-authorised')
      expect(out.refusal.decision?.stage).toBe('DEVICE_AND_CONNECTIVITY')
    }
    // On reconnection the actor sees the TRUE stage and repeats the transition.
    expect(advance(out.chain ?? before, ctx(REVIEWER)).state).toBe('Advanced')
  })

  // FAILS IF: the permanent record stops carrying one of the four fields the
  // source names. L33387 / `AC-STU-102`.
  it('records role, timestamp, version and comments on every transition', () => {
    const sink = recordingSink()
    const r = returnWithComments(submitted(), ctx(REVIEWER, { audit: sink.write, comments: 'Screen 7.' }))
    expect(r.ok).toBe(true)
    const entry = sink.entries.find((e) => e.kind === 'transition')
    expect(entry).toBeDefined()
    expect(entry!.role).toBe('SUPERVISOR')
    expect(entry!.at).toBe('2026-06-21T09:00:00.000Z')
    expect(entry!.comments).toEqual(['Screen 7.'])
    expect(entry!.fromState).toBe('Submitted')
    expect(entry!.toState).toBe('Returned with comments')
    // The log on the chain is the same record, kept permanently.
    if (r.ok) expect(r.chain.log.filter((e) => e.kind === 'transition')).toHaveLength(2)
  })
})

// ===========================================================================
// The reuse contract, scope, screen states, and the standing constraints.
// ===========================================================================

describe('the chain as a service (S2, FUNC-STU-11-06-A-1 L33320)', () => {
  // FAILS IF: a consumer is dropped, or its owning module id is renamed. These
  // are pointers into STU_MODULES and fail when their target is removed.
  it('names an owning module for every reuse consumer, and each one resolves', () => {
    expect(APPROVAL_CONSUMER_CONTRACTS).toHaveLength(APPROVAL_CONSUMERS.length)
    for (const contract of APPROVAL_CONSUMER_CONTRACTS) {
      expect(stuModuleById(STU_MODULES, contract.ownerModule).id).toBe(contract.ownerModule)
    }
    expect(APPROVAL_CONSUMER_CONTRACTS.map((c) => c.ownerModule)).toEqual([
      'MOD-STU-04',
      'MOD-STU-08',
      'MOD-STU-07',
      'MOD-STU-09',
      'MOD-STU-15',
    ])
  })

  // FAILS IF: `DEC-LIBREV-001`'s interim treatment is weakened to a two-stage
  // chain for library edits. D17 / L32622 — option (a), the full chain with a
  // preview scoped to the changed item.
  it('gives the library edit the full chain with a scoped preview, never a shorter chain', () => {
    const lib = APPROVAL_CONSUMER_CONTRACTS.find((c) => c.id === 'content-library-edit')!
    expect(lib.previewScope).toBe('the changed item only')
    expect(lib.decisionRef).toBe('DEC-LIBREV-001')
    expect(studioDecision('D17').adopted).toMatch(/option \(a\)/i)
    // Every consumer passes the same three stages. The composed agent adds two
    // gates and removes none.
    for (const contract of APPROVAL_CONSUMER_CONTRACTS)
      expect([...contract.stages]).toEqual(['author', 'reviewer', 'release-authority'])
    const agent = APPROVAL_CONSUMER_CONTRACTS.find((c) => c.id === 'composed-agent')!
    expect(agent.additionalGates).toEqual(['an evaluation gate', 'a platform review'])
  })

  // FAILS IF: scope is enforced in the DRAW rather than in the READ. The
  // out-of-tenant submission must be absent from what the screen READS.
  it('enforces scope in what the queue reads, not in what the screen draws', () => {
    const mine = submitted()
    const theirs = { ...submitted(), submissionId: 'SUB-OTHER-0001', tenant: OTHER_TENANT }
    const seen = visibleQueue([mine, theirs], ctx(RELEASER))
    expect(seen.map((c) => c.submissionId)).toEqual([mine.submissionId])
    // And the Worker reads nothing at all, rather than reading and hiding.
    expect(visibleQueue([mine, theirs], ctx(WORKER))).toEqual([])
    const html = renderToStaticMarkup(createElement(ApprovalWorkflowScreen))
    expect(html).not.toContain('SUB-OTHER-0001')
  })

  // FAILS IF: a diagram node is promoted into the enumerated states, or the
  // divergence stops being recorded. L33334-L33352 draws seven nodes; L33289
  // enumerates five.
  it('records the diagram-only nodes rather than minting them as states', () => {
    expect(DIAGRAM_ONLY_NODES.map((n) => n.node)).toEqual(['Drafting', 'UnderReview'])
    for (const node of DIAGRAM_ONLY_NODES) {
      expect(SUBMISSION_STATES).not.toContain(node.node)
      expect(node.note).not.toBe('')
    }
  })

  // FAILS IF: the screen stops rendering its module annotation, its screen
  // states, or SB-STU-14's four review obligations.
  it('renders SB-STU-14’s queue, its four review obligations and its stated controls', () => {
    const html = renderToStaticMarkup(createElement(ApprovalWorkflowScreen))
    expect(html).toContain('MOD-STU-11')
    expect(html).toContain('SCR-STU-11')
    expect(html).toContain('annotation, never a route key')
    for (const obligation of ['instruction text', 'specification limits', 'coaching content', 'deviation rules'])
      expect(html).toContain(obligation)
    expect(html).toContain('Return with comments')
    expect(html).toContain('Advance')
  })

  // FAILS IF: the Advance control stops being disabled with a stated reason for
  // the Author, OR is disabled for everyone. SB-STU-14 (L33357) states this
  // control rule outright, which is why this ONE control is
  // disabled-with-reason and not absent. Both branches are asserted: the
  // default view opens on the submission the default persona authored.
  it('disables Advance with a stated reason when the reviewer is the Author, and not otherwise', () => {
    const own = renderToStaticMarkup(createElement(ApprovalWorkflowScreen))
    expect(own).toContain('data-testid="advance-control" data-enabled="false"')
    const reasons = own.match(/Advance is disabled on ([A-Z0-9-]+) because/g) ?? []
    expect(reasons).toEqual(['Advance is disabled on SUB-BB-0001 because'])
    expect(own).toMatch(/one person/i)

    const other = renderToStaticMarkup(
      createElement(ApprovalWorkflowScreen, { selectedSubmissionId: 'SUB-BB-0002' }),
    )
    expect(other).toContain('data-testid="advance-control" data-enabled="true"')
    expect(other.match(/Advance is disabled on/g)).toBeNull()
  })

  // FAILS IF: the ABSENT rendering is keyed on the evaluator's OUTCOME rather
  // than on the matrix cell's own token. Both refusals come back
  // `explicitlyProhibited`, and only one of them carries no rendering: a cell
  // that says `Explicitly prohibited` draws nothing, while a separation-of-
  // duties refusal on a cell that says `Allowed` draws the control disabled
  // with its stated reason, which is what SB-STU-14 requires by name. Keying
  // on the outcome made the Advance control VANISH on the one case the
  // storyboard exists to show.
  it('draws nothing for a prohibited CELL and a disabled control for a duties refusal', () => {
    const own = renderToStaticMarkup(createElement(ApprovalWorkflowScreen))
    // The default persona authored SUB-BB-0001, whose Advance cell reads
    // `Allowed` for a Quality Manager: disabled, never absent.
    expect(approvalRow('advance-to-release').cells['quality-manager'].outcome).toBe('allowed')
    expect(own).toContain('data-testid="advance-control" data-enabled="false"')
    expect(own).not.toContain('data-testid="advance-control" data-enabled="absent"')
    // And the same evaluator reports the same OUTCOME token for both.
    const duties = evaluateStudioAccess({
      row: approvalRow('advance-to-release'),
      identity: RELEASER,
      grants: {},
      commercialTier: 'Enterprise',
      identityLayer: 'reachable',
      state: DOMAIN,
      online: true,
      authorOfRecord: RELEASER.identityId,
      reviewerOfRecord: null,
      releaseAuthorityOfRecord: null,
    })
    const byCell = evaluateStudioAccess({
      row: approvalRow('advance-to-release'),
      identity: TENANT_ADMIN,
      grants: {},
      commercialTier: 'Enterprise',
      identityLayer: 'reachable',
      state: DOMAIN,
      online: true,
      authorOfRecord: null,
      reviewerOfRecord: null,
      releaseAuthorityOfRecord: null,
    })
    expect(duties.outcome).toBe('explicitlyProhibited')
    expect(byCell.outcome).toBe('explicitlyProhibited')
    expect(duties.decision.stage).toBe('SEGREGATION_OF_DUTIES')
    expect(byCell.decision.stage).toBe('BASE_ROLE')
  })

  // FAILS IF: a seeded chain is silently dropped because a fixture transition
  // refused. Every fixture is DRIVEN through the real transitions, so a state
  // the chain could not reach cannot be seeded — and this pins what was built.
  it('seeds only chains the real transitions can reach', () => {
    expect(SEEDED_CHAINS.map((c) => [c.submissionId, c.state])).toEqual([
      ['SUB-BB-0001', 'Submitted'],
      ['SUB-BB-0002', 'Submitted'],
      ['SUB-BB-0003', 'Advanced'],
      ['SUB-BB-0004', 'Returned with comments'],
      ['SUB-OTHER-0001', 'Submitted'],
    ])
  })

  // FAILS IF: the standing constraints are broken in any of this task's files.
  it('reads no clock and throws on no path', () => {
    for (const path of SOURCE_FILES) {
      const code = codeOf(path)
      expect({ path, hit: /Date\.now|new Date\(|Math\.random/.test(code) }).toEqual({ path, hit: false })
      expect({ path, hit: /\bthrow\b/.test(code) }).toEqual({ path, hit: false })
    }
    // No POLICY under src/ui: this task writes nothing there, and the three
    // files that hold the rules take nothing from it at all.
    for (const path of SOURCE_FILES.filter((p) => p.startsWith('src/'))) {
      expect({ path, hit: /from '@\/ui\//.test(codeOf(path)) }).toEqual({ path, hit: false })
    }
    // The screen draws; it decides nothing. No role identifier appears on it.
    expect(
      /\b(QUALITY_MANAGER|SUPERVISOR|TENANT_ADMIN|READONLY_AUDITOR|WORKER)\b/.test(
        codeOf('app/studio/approvals/ApprovalWorkflowScreen.tsx'),
      ),
    ).toBe(false)
    // Determinism: the same inputs fold to the same chain twice.
    expect(released()).toEqual(released())
  })
})

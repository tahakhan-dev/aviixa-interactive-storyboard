import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ROUTES, routesForRole, routeOpenDecisionFor } from '@/routes/definitions'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { STU_PERSONAS, reachByStudioMatrix, type StudioPersonaId } from '@/studio/modules'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { studioDecision } from '@/studio/disclosure/decisions'

import {
  STU18_MATRIX,
  STU18_ROW_IDS,
  stu18Row,
  type Stu18RowId,
} from '@/studio/modules/stu-18/matrix'
import {
  AUTHORING_GRANT_CONDITION,
  affordanceFor,
  capabilityPanelRows,
  capabilityStatement,
  decisionForRow,
  studioGrantsFor,
  studioIdentityFor,
  SEEDED_TIER,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import {
  SEEDED_GRANT_REGISTER,
  administerGrant,
  grantRowsVisibleTo,
  holderById,
  type GrantAuditWrite,
} from '@/studio/modules/stu-18/grant-admin'
import {
  SECTION_253_DISPUTED,
  FIVE_ROLE_TABLE,
  CHAPTER20_TENANT_ROLES,
  PLATFORM_ROLE_ACCESS,
  COARSER_RESTATEMENTS,
  UNSPECIFIED_IN_SOURCE,
} from '@/studio/modules/stu-18/restatements'
import { STUDIO_GRANT_DEFINITIONS } from '@/studio/access/grants'

import { PermissionsScreen } from '../../app/studio/permissions-and-grants/PermissionsScreen'
import { SignInScreen } from '../../app/studio/sign-in/SignInScreen'

/* ==================================================================== *
 * Fixtures.
 *
 * DEFECT SHAPE 11 — a baseline chosen so the failure cannot appear. Every
 * scenario below sits on the PERMITTING side of every boundary it is not
 * exercising: signed in, identity layer reachable, online, tier Enterprise,
 * no approval stage occupied, audit sink accepting. A refusal test is
 * therefore paired with the same scenario one field away, asserted to
 * permit, so a refusal arriving for the wrong reason cannot certify a guard.
 * ==================================================================== */

function scenario(over: Partial<Stu18Scenario> = {}): Stu18Scenario {
  return {
    persona: 'quality-manager',
    online: true,
    identityLayer: 'reachable',
    commercialTier: SEEDED_TIER,
    authoringGrant: 'Active',
    agentGrant: null,
    implGrant: 'Active',
    ...over,
  }
}

function markup(element: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(element)
}

/** The rendered TEXT, so an assertion about a sentence is not defeated by the
 *  tags inside it. Used where the claim is about what a reader sees. */
function plain(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')
}

function permissionsMarkup(
  over: Partial<Stu18Scenario> & { readonly screenState?: 'STATE-03' | 'STATE-06' } = {},
): string {
  const { screenState, ...rest } = over
  return markup(
    createElement(PermissionsScreen, {
      ...scenario(rest),
      ...(screenState === undefined ? {} : { screenState }),
    }),
  )
}

function signInMarkup(over: Partial<Stu18Scenario> = {}): string {
  return markup(createElement(SignInScreen, scenario(over)))
}

/** Every cell of the consolidated matrix, as one flat list. */
function everyCell(): { row: Stu18RowId; column: StudioPersonaColumn }[] {
  return STU18_MATRIX.flatMap((row) =>
    STUDIO_PERSONA_COLUMNS.map((column) => ({ row: row.id, column })),
  )
}

const ACCEPTING_AUDIT: GrantAuditWrite = () => ({ ok: true })
const FAILING_AUDIT: GrantAuditWrite = () => ({
  ok: false,
  reason: 'the tenant audit log refused the append',
})

/* ==================================================================== *
 * 1. The matrix, against the frozen source.
 * ==================================================================== */

describe('MOD-STU-18 — the consolidated Studio permission matrix (L34539-L34563)', () => {
  // FAILS IF: a row is added to or dropped from STU18_MATRIX, or the ids move
  // out of source order. Asserted as an exact list, not a length, so a
  // reworded id goes red too.
  it('holds twenty-three rows in the source order of L34541 to L34563', () => {
    expect(STU18_MATRIX.length).toBe(23)
    expect(STU18_MATRIX.map((r) => r.id)).toEqual([...STU18_ROW_IDS])
    expect(STU18_MATRIX.map((r) => r.sourceRefs[0])).toEqual(
      Array.from({ length: 23 }, (_, i) => `L${34541 + i}`),
    )
  })

  // FAILS IF: a cell is dropped for any persona column. `Every cell carries an
  // explicit status` (L34537), and a Partial map would let a missing key read
  // as a refusal nobody wrote down.
  it('carries an explicit status in all one hundred and eighty-four cells', () => {
    const cells = everyCell()
    expect(cells.length).toBe(23 * 8)
    const blank = cells.filter(({ row, column }) => {
      const cell = stu18Row(row).cells[column]
      return cell === undefined || cell.note.trim() === ''
    })
    expect(blank).toEqual([])
  })

  // FAILS IF: the Worker column gains any outcome other than
  // explicitlyProhibited on any row. AC-STU-150, L34667.
  it('prohibits the Worker on every one of the twenty-three rows', () => {
    const worker = STU18_MATRIX.map((r) => r.cells.worker.outcome)
    expect(worker.length).toBe(23)
    expect(new Set(worker)).toEqual(new Set(['explicitlyProhibited']))
  })

  // FAILS IF: any Read-only Auditor cell is resolved to a permission status.
  // The brief's own assertion, kept, plus the two it needs to be non-vacuous:
  // the length check (so it cannot pass on an empty matrix) and the exact
  // count of decision-bearing cells (so widening one into a prohibition, which
  // the filter below tolerates, still goes red).
  it('leaves every Read-only Auditor cell as clientDecisionRequired or explicitlyProhibited', () => {
    const auditorCells = STU18_MATRIX.map((r) => r.cells['read-only-auditor'])
    expect(auditorCells.length).toBe(23)
    // THE BRIEF'S FILTER IS WRONG BY ONE ROW, and the source is the authority:
    // L34563 gives the Auditor `Unavailable — same reason`. That row is the
    // CONNECTIVITY axis, not a permission grant — it says the capability is
    // withheld offline for the same reason it is for everyone, and asserts
    // nothing about whether this role holds it. So it is exempted BY ROW ID
    // rather than by widening the filter to admit `unavailable` anywhere.
    const resolved = STU18_MATRIX.filter(
      (r) =>
        r.id !== 'use-any-capability-while-offline' &&
        r.cells['read-only-auditor'].outcome !== 'clientDecisionRequired' &&
        r.cells['read-only-auditor'].outcome !== 'explicitlyProhibited',
    )
    expect(resolved).toEqual([])
    expect(stu18Row('use-any-capability-while-offline').cells['read-only-auditor'].outcome).toBe(
      'unavailable',
    )
    // L34541, L34542, L34543, L34556 (learning view) and L34561 (export) are
    // the five the source states as Client Decision Required. Pinning the
    // COUNT is what stops a silent flip of one of them to prohibited — which
    // is DEC-AUDSTU-001 answered in option (a)'s direction, the exact thing
    // AC-STU-157 forbids.
    expect(auditorCells.filter((c) => c.outcome === 'clientDecisionRequired').length).toBe(5)
  })

  // FAILS IF: a clientDecisionRequired Auditor cell stops naming its decision.
  it('names DEC-AUDSTU-001 in every clientDecisionRequired Auditor cell', () => {
    const open = STU18_MATRIX.map((r) => r.cells['read-only-auditor']).filter(
      (c) => c.outcome === 'clientDecisionRequired',
    )
    expect(open.length).toBe(5)
    for (const c of open) {
      expect(c.openDecision).toBe('DEC-AUDSTU-001')
      expect(c.note).toContain('DEC-AUDSTU-001')
    }
  })

  // FAILS IF: row 14's conditions are hoisted off the CELL onto the ROW.
  // L34554 carries three different conditions in three columns, and a
  // row-level grant would demand GRANT-STU-AGENT of the Quality Manager, who
  // holds the capability by role (L34553).
  it('keeps row 14 three different conditions across three columns', () => {
    const row = stu18Row('compose-a-reasoning-agent')
    expect(row.cells['quality-manager'].requiredGrant).toBeNull()
    expect(row.cells['quality-manager'].requiredTiers).toEqual(['Growth', 'Enterprise'])
    expect(row.cells['supervisor-with-authoring-grant'].requiredGrant).toBe('GRANT-STU-AGENT')
    expect(row.cells['supervisor-with-authoring-grant'].requiredTiers).toEqual([
      'Growth',
      'Enterprise',
    ])
    expect(row.cells['tenant-admin'].requiredGrant).toBe('GRANT-STU-AGENT')
    expect(row.cells['tenant-admin'].requiredTiers).toBeNull()
  })

  // FAILS IF: row 22's meta-row is softened for the Tenant Admin, who
  // administers everything else on this module.
  it('prohibits widening the floor in all eight columns, the Tenant Admin included', () => {
    const row = stu18Row('widen-beyond-the-floor')
    const outcomes = STUDIO_PERSONA_COLUMNS.map((c) => row.cells[c].outcome)
    expect(outcomes.length).toBe(8)
    expect(new Set(outcomes)).toEqual(new Set(['explicitlyProhibited']))
  })

  // FAILS IF: row 23's two senses are collapsed onto one token. Seven columns
  // carry sense A (the capability exists, withheld by a condition) and one
  // carries a prohibition that was never a connectivity statement at all.
  it('splits row 23 into seven Unavailable columns and one prohibition', () => {
    const row = stu18Row('use-any-capability-while-offline')
    const unavailable = STUDIO_PERSONA_COLUMNS.filter(
      (c) => row.cells[c].outcome === 'unavailable',
    )
    expect(unavailable.length).toBe(7)
    expect(row.cells.worker.outcome).toBe('explicitlyProhibited')
    expect(row.cells.worker.note).toContain('no access at all')
    expect(row.cells['quality-manager'].note).toContain('requires an active connection')
  })

  // FAILS IF: an "Open the Studio" or connectivity row is classified `screen`.
  // Clause one of reachByStudioMatrix reads that classification; counting row
  // 23 as a screen row would withhold this module from every persona, because
  // seven of its eight cells refuse.
  it('classifies the surface-access and connectivity rows as chrome', () => {
    expect(stu18Row('open-the-studio').surface).toBe('chrome')
    expect(stu18Row('use-any-capability-while-offline').surface).toBe('chrome')
    expect(stu18Row('decide-a-lane-b-proposal').surface).toBe('another-surface')
    expect(STU18_MATRIX.filter((r) => r.surface === 'screen').length).toBe(20)
  })

  // FAILS IF: the module's derived reach stops answering all eight personas,
  // or the Auditor's open decision is collapsed onto offered or withheld.
  it('derives a reach that offers six personas, withholds the Worker and defers the Auditor', () => {
    const reach = reachByStudioMatrix(STU18_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(Object.keys(reach).sort()).toEqual(STU_PERSONAS.map((p) => p.id).sort())
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach.worker).toBe('withheld')
    const offered = (Object.keys(reach) as StudioPersonaId[]).filter(
      (p) => reach[p] === 'offered',
    )
    expect(offered.length).toBe(6)
  })

  // FAILS IF: the module directory grows a second export the reach generator
  // would read as a matrix, or matrix.ts grows a second one. `matrixIn` in
  // scripts/build-stu-module-reach.mjs takes a file only when it yields
  // EXACTLY ONE candidate, and silently skips the file otherwise -- so a
  // second array of rows carrying `surface` makes the whole module read as
  // "exports no readable matrix" and stops the build, or worse, is skipped.
  it('exports exactly one generator-readable matrix from the module directory', async () => {
    const files = [
      await import('@/studio/modules/stu-18/matrix'),
      await import('@/studio/modules/stu-18/rendering'),
      await import('@/studio/modules/stu-18/grant-admin'),
      await import('@/studio/modules/stu-18/restatements'),
    ]
    const perFile = files.map(
      (mod) =>
        Object.values(mod).filter(
          (value) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((row) => row !== null && typeof row === 'object' && 'surface' in row),
        ).length,
    )
    expect(perFile).toEqual([1, 0, 0, 0])
  })
})

/* ==================================================================== *
 * 2. The rendering rule — one token, one rendering, decided once.
 * ==================================================================== */

describe('the rendering rule', () => {
  // FAILS IF: `explicitlyProhibited` is given any affordance at all -- an
  // enabled control OR a disabled one. The token carries no rendering
  // anywhere in the source; it is a statement about authority.
  it('gives an explicitly prohibited outcome no affordance, on every persona it appears for', () => {
    const prohibited = everyCell().filter(
      ({ row, column }) => stu18Row(row).cells[column].outcome === 'explicitlyProhibited',
    )
    // 114 of the 184 cells. Asserted so the sweep cannot pass by never running.
    expect(prohibited.length).toBe(114)
    for (const { row, column } of prohibited) {
      const decision = decisionForRow(stu18Row(row), scenario({ persona: column }))
      // The evaluated answer for that persona may be refused earlier than the
      // cell (a lapsed grant, say), so only the cells that really do resolve
      // to the prohibition are asserted -- and the count below proves the
      // sweep reaches most of them rather than skipping the lot.
      if (decision.outcome !== 'explicitlyProhibited') continue
      expect(affordanceFor('Assign', decision).kind, `${row}/${column}`).toBe('absent')
    }
    const reached = prohibited.filter(
      ({ row, column }) =>
        decisionForRow(stu18Row(row), scenario({ persona: column })).outcome ===
        'explicitlyProhibited',
    )
    expect(reached.length).toBeGreaterThan(90)
  })

  // FAILS IF: `readOnly` is mapped mechanically to a disabled control in the
  // capability statement. Row 21's token carries its own rendering
  // instruction -- "Read-only -- may generate the read-only export" -- and a
  // mechanical map removes an export the source grants.
  it('never renders a Read-only cell as an unavailable capability', () => {
    const readOnly = everyCell().filter(
      ({ row, column }) => stu18Row(row).cells[column].outcome === 'readOnly',
    )
    expect(readOnly.length).toBe(6)
    for (const { row, column } of readOnly) {
      const statement = capabilityStatement(stu18Row(row), column)
      expect(statement.availability, `${row}/${column}`).toBe('available')
    }
    const exportRow = stu18Row('generate-a-portable-document-format-export')
    for (const column of [
      'supervisor-without-grant',
      'plant-manager-persona',
      'tenant-admin',
    ] as const) {
      expect(capabilityStatement(exportRow, column).text).toContain(
        'may generate the read-only export',
      )
    }
    // And on a CONTROL, the token's own words survive into the reason rather
    // than being replaced by a generic disabled message.
    const exportDecision = decisionForRow(exportRow, scenario({ persona: 'tenant-admin' }))
    expect(exportDecision.outcome).toBe('readOnly')
    const rendered = affordanceFor('Generate the export', exportDecision)
    expect(rendered.kind).toBe('disabled')
    if (rendered.kind === 'disabled') {
      expect(rendered.reason).toContain('may generate the read-only export')
    }
  })

  // FAILS IF: a clientDecisionRequired cell is rendered as either answer.
  it('renders a client-decision cell as an open decision, never as a grant or a refusal', () => {
    const open = everyCell().filter(
      ({ row, column }) => stu18Row(row).cells[column].outcome === 'clientDecisionRequired',
    )
    expect(open.length).toBe(9)
    for (const { row, column } of open) {
      const statement = capabilityStatement(stu18Row(row), column)
      expect(statement.availability, `${row}/${column}`).toBe('decision-open')
      expect(statement.decision, `${row}/${column}`).not.toBeNull()
    }
  })

  // FAILS IF: the affordance rule keys on `decision.reasonCode` rather than
  // on `decision.outcome`. It is the available mistake: `src/ui/WriteControl`
  // keys on ROLE_NOT_GRANTED, and evaluateStudioAccess returns that reason
  // code for BOTH a revoked grant (which must render DISABLED with the
  // revocation named, L34605) and a categorical prohibition (which must
  // render ABSENT). One reason code, two renderings.
  it('renders a revoked grant as disabled-with-reason and a prohibition as absent', () => {
    // THE COLLISION, produced rather than described. `src/ui/WriteControl`
    // renders ABSENT whenever the reason code is ROLE_NOT_GRANTED. On this
    // surface a grant revoked mid-session carries exactly that reason code
    // and MUST render DISABLED with the revocation named (L34605 — "the
    // session is not silently degraded"), while a categorical prohibition
    // carries no control at all. Same rule, two renderings, and keying on the
    // reason code collapses them onto the wrong one.
    const authoring = stu18Row('create-a-workflow')
    const lapsed = decisionForRow(
      authoring,
      scenario({ persona: 'supervisor-with-authoring-grant', authoringGrant: 'Revoked' }),
    )
    const prohibited = decisionForRow(
      authoring,
      scenario({ persona: 'supervisor-without-grant' }),
    )
    expect(lapsed.decision.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(lapsed.outcome).toBe('unavailable')
    expect(prohibited.outcome).toBe('explicitlyProhibited')

    const lapsedRendering = affordanceFor('Create a Workflow', lapsed)
    expect(lapsedRendering.kind).toBe('disabled')
    if (lapsedRendering.kind === 'disabled') {
      expect(lapsedRendering.reason).toMatch(/revoked/i)
    }
    expect(affordanceFor('Create a Workflow', prohibited).kind).toBe('absent')

    // And the connectivity split on the control this screen actually offers.
    const row = stu18Row('assign-or-revoke-the-two-grants')
    const offline = decisionForRow(row, scenario({ persona: 'tenant-admin', online: false }))
    const online = decisionForRow(row, scenario({ persona: 'tenant-admin' }))
    expect(online.outcome).toBe('allowed')
    expect(affordanceFor('Assign', online).kind).toBe('enabled')
    expect(offline.outcome).toBe('unavailable')
    const rendered = affordanceFor('Assign', offline)
    expect(rendered.kind).toBe('disabled')
    if (rendered.kind === 'disabled') {
      expect(rendered.reason).toContain('active connection')
    }
  })

  // FAILS IF: an offline outcome is silently accepted by the rendering rule.
  // The Studio has no offline mode: STATE-07 renders nowhere (D22) and
  // nothing on this surface queues a write (D4).
  it('refuses an offline outcome rather than rendering one', () => {
    const base = decisionForRow(stu18Row('open-the-studio'), scenario())
    for (const outcome of ['queuedOffline', 'cachedReadOnlyOffline'] as const) {
      expect(() => affordanceFor('Assign', { ...base, outcome })).toThrow(/no offline mode/i)
    }
  })
})

/* ==================================================================== *
 * 3. The identity layer, the grant, and the floor.
 * ==================================================================== */

describe('the fail-closed floor', () => {
  // FAILS IF: an unreachable identity layer leaves anything beyond published
  // read reachable. L34605, AC-STU-156.
  it('permits nothing beyond published read when the identity layer is unreachable', () => {
    const down = scenario({ identityLayer: 'unreachable' })
    const published = decisionForRow(stu18Row('read-published-workflow-content'), down)
    expect(published.outcome).toBe('readOnly')

    const beyond = STU18_MATRIX.filter((r) => !r.isPublishedRead)
    expect(beyond.length).toBe(22)
    for (const row of beyond) {
      const decision = decisionForRow(row, down)
      expect(decision.outcome, row.id).not.toBe('allowed')
      expect(decision.outcome, row.id).not.toBe('allowedWithConditions')
    }

    // The pair: the same scenario one field away permits, so the refusals
    // above cannot be arriving for some other reason.
    const up = scenario()
    expect(decisionForRow(stu18Row('create-a-workflow'), up).outcome).toBe('allowed')
  })

  // FAILS IF: a grant revoked mid-session silently degrades to the
  // without-grant column instead of naming the revocation. L34605,
  // TEST-STU-150.
  it('names the revocation when a grant lapses mid-session, rather than degrading', () => {
    const row = stu18Row('create-a-workflow')
    const held = decisionForRow(
      row,
      scenario({ persona: 'supervisor-with-authoring-grant', authoringGrant: 'Active' }),
    )
    expect(held.outcome).toBe('allowed')

    const lapsed = decisionForRow(
      row,
      scenario({ persona: 'supervisor-with-authoring-grant', authoringGrant: 'Revoked' }),
    )
    expect(lapsed.outcome).toBe('unavailable')
    expect(lapsed.reason).toMatch(/revoked/i)
    expect(lapsed.reason).toContain('GRANT-STU-AUTHOR')
    // Not the without-grant column's own prohibition wording.
    expect(lapsed.reason).not.toContain('Explicitly prohibited')
  })

  // FAILS IF: separation of duties is evaluated by role rather than by
  // identity. The fixture holds BOTH roles, which is the whole point:
  // a role-based check counts two roles and permits two stages.
  it('refuses a second stage to one identity holding two roles', () => {
    const identity = studioIdentityFor('quality-manager')
    const releaseRow = stu18Row('approve-or-release')
    const dual = {
      ...identity,
      roles: ['QUALITY_MANAGER', 'SUPERVISOR'] as const,
      identityId: 'IDN-DUAL-01',
    }
    const clean = decisionForRow(releaseRow, scenario(), { identity: dual })
    expect(clean.outcome).toBe('allowedWithConditions')

    const occupied = decisionForRow(releaseRow, scenario(), {
      identity: dual,
      reviewerOfRecord: 'IDN-DUAL-01',
    })
    // The brief's assertion, kept -- and it is inert on its own, because the
    // cell is `Allowed with conditions` and a role-based check satisfies
    // `.not.toBe('allowed')` while one person occupies two stages.
    expect(occupied.outcome).not.toBe('allowed')
    // These three are what actually fail when the check goes role-based.
    expect(occupied.outcome).toBe('explicitlyProhibited')
    expect(occupied.decision.stage).toBe('SEGREGATION_OF_DUTIES')
    expect(occupied.reason).toMatch(/one person/i)
  })

  // FAILS IF: the Tenant Admin is given any stage of the approval chain.
  // AC-STU-152, TEST-STU-151.
  it('gives the Tenant Admin no stage of the approval chain', () => {
    const stages = STU18_MATRIX.filter((r) => r.stage !== null)
    expect(stages.length).toBe(3)
    for (const row of stages) {
      expect(decisionForRow(row, scenario({ persona: 'tenant-admin' })).outcome, row.id).toBe(
        'explicitlyProhibited',
      )
    }
    expect(stu18Row('hold-any-stage-of-the-approval-chain').cells['tenant-admin'].note).toContain(
      'separation of duties',
    )
  })
})

/* ==================================================================== *
 * 4. Grant administration — the write path.
 * ==================================================================== */

describe('grant administration (L34558, SCR-STU-15)', () => {
  const admin = holderById(SEEDED_GRANT_REGISTER, 'IDN-BB-PRIYA')
  const target = holderById(SEEDED_GRANT_REGISTER, 'IDN-BB-SAM')

  // FAILS IF: the read stops filtering by tenant. Scope is enforced in what
  // the screen READS, never in what it draws -- so the out-of-tenant holder
  // must be absent from the derived rows, not merely hidden in the markup.
  it('reads only the acting identity’s own tenant', () => {
    const otherTenant = SEEDED_GRANT_REGISTER.filter((h) => h.tenant !== admin.tenant)
    expect(otherTenant.length).toBeGreaterThan(0)
    const visible = grantRowsVisibleTo(SEEDED_GRANT_REGISTER, admin)
    expect(visible.length).toBe(SEEDED_GRANT_REGISTER.length - otherTenant.length)
    expect(visible.map((h) => h.identityId)).not.toContain(otherTenant[0]!.identityId)
    // And the markup cannot be carrying it either.
    expect(permissionsMarkup({ persona: 'tenant-admin' })).not.toContain(
      otherTenant[0]!.displayName,
    )
  })

  // FAILS IF: the audit append moves after the mutation, or stops gating it.
  // The scenario is one that DOES change something observable: Sam holds no
  // Agent Author grant, so assigning it is a real mutation of the register.
  it('refuses the write when the audit append fails, leaving the grant unchanged', () => {
    const before = holderById(SEEDED_GRANT_REGISTER, 'IDN-BB-SAM').grants['GRANT-STU-AGENT']
    expect(before).toBeUndefined()

    const committed = administerGrant({
      register: SEEDED_GRANT_REGISTER,
      actor: admin,
      decision: decisionForRow(
        stu18Row('assign-or-revoke-the-two-grants'),
        scenario({ persona: 'tenant-admin' }),
      ),
      targetId: target.identityId,
      grant: 'GRANT-STU-AGENT',
      action: 'assign',
      writeAudit: ACCEPTING_AUDIT,
    })
    // The paired half: without it, the failure test below would pass just as
    // happily on a handler that mutates nothing at all.
    expect(committed.ok).toBe(true)
    expect(holderById(committed.register, 'IDN-BB-SAM').grants['GRANT-STU-AGENT']).toBe('Active')

    const refused = administerGrant({
      register: SEEDED_GRANT_REGISTER,
      actor: admin,
      decision: decisionForRow(
        stu18Row('assign-or-revoke-the-two-grants'),
        scenario({ persona: 'tenant-admin' }),
      ),
      targetId: target.identityId,
      grant: 'GRANT-STU-AGENT',
      action: 'assign',
      writeAudit: FAILING_AUDIT,
    })
    expect(refused.ok).toBe(false)
    expect(refused.register).toEqual(SEEDED_GRANT_REGISTER)
    expect(holderById(refused.register, 'IDN-BB-SAM').grants['GRANT-STU-AGENT']).toBeUndefined()
    expect(refused.message).toMatch(/audit/i)
    expect(refused.message).toMatch(/did not happen|was not/i)
  })

  // FAILS IF: a domain refusal starts appending an audit entry. A refused
  // action is not an action, so there is no entry to fail -- and the audit
  // sink is proven never to be called by making it throw.
  it('takes its own domain refusals before the audit path, not after', () => {
    const exploding: GrantAuditWrite = () => {
      throw new Error('the audit sink was reached by a refused action')
    }
    const selfAssignment = administerGrant({
      register: SEEDED_GRANT_REGISTER,
      actor: admin,
      decision: decisionForRow(
        stu18Row('assign-or-revoke-the-two-grants'),
        scenario({ persona: 'tenant-admin' }),
      ),
      targetId: admin.identityId,
      grant: 'GRANT-STU-AUTHOR',
      action: 'assign',
      writeAudit: exploding,
    })
    expect(selfAssignment.ok).toBe(false)
    expect(selfAssignment.message).toMatch(/self-assignment/i)
    expect(selfAssignment.register).toEqual(SEEDED_GRANT_REGISTER)
  })

  // FAILS IF: the write stops asking the evaluator, or asks a role list
  // instead. Every affordance is driven per-control through the evaluator.
  it('refuses a write the evaluator did not permit, whatever the register says', () => {
    const qmDecision = decisionForRow(
      stu18Row('assign-or-revoke-the-two-grants'),
      scenario({ persona: 'quality-manager' }),
    )
    expect(qmDecision.outcome).toBe('explicitlyProhibited')
    const result = administerGrant({
      register: SEEDED_GRANT_REGISTER,
      actor: holderById(SEEDED_GRANT_REGISTER, 'IDN-BB-ELENA'),
      decision: qmDecision,
      targetId: target.identityId,
      grant: 'GRANT-STU-AUTHOR',
      action: 'revoke',
      writeAudit: ACCEPTING_AUDIT,
    })
    expect(result.ok).toBe(false)
    expect(result.register).toEqual(SEEDED_GRANT_REGISTER)
  })

  // FAILS IF: GRANT-STU-IMPL becomes assignable from this control. L34558
  // names two grants, and the implementation team's capacity is provisioned
  // and revoked elsewhere (§5.11.4, L34588).
  it('administers the two grants L34558 names and refuses the third', () => {
    const result = administerGrant({
      register: SEEDED_GRANT_REGISTER,
      actor: admin,
      decision: decisionForRow(
        stu18Row('assign-or-revoke-the-two-grants'),
        scenario({ persona: 'tenant-admin' }),
      ),
      targetId: target.identityId,
      grant: 'GRANT-STU-IMPL',
      action: 'assign',
      writeAudit: ACCEPTING_AUDIT,
    })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('GRANT-STU-IMPL')
  })

  // FAILS IF: a grant is revoked from a holder in another tenant. Tenant
  // isolation applies to every authorisation decision (L34659), and the read
  // filter alone is not the enforcement.
  it('refuses a write against a holder outside the acting tenant', () => {
    const outsider = SEEDED_GRANT_REGISTER.find((h) => h.tenant !== admin.tenant)
    expect(outsider).toBeDefined()
    const result = administerGrant({
      register: SEEDED_GRANT_REGISTER,
      actor: admin,
      decision: decisionForRow(
        stu18Row('assign-or-revoke-the-two-grants'),
        scenario({ persona: 'tenant-admin' }),
      ),
      targetId: outsider!.identityId,
      grant: 'GRANT-STU-AUTHOR',
      action: 'assign',
      writeAudit: ACCEPTING_AUDIT,
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/tenant/i)
  })
})

/* ==================================================================== *
 * 5. The disputed restatements — rendered, and inert.
 * ==================================================================== */

describe('the disputed restatements', () => {
  // FAILS IF: a §25.3 row is dropped, or the table stops being attributed.
  it('carries §25.3’s eight rows with their L48319 locator', () => {
    expect(SECTION_253_DISPUTED.rows.length).toBe(8)
    expect(SECTION_253_DISPUTED.rows.map((r) => r.action)).toEqual([
      'Open published Workflow content',
      'Create or edit a Workflow draft',
      'Act as Reviewer on a submission',
      'Publish a version as Release Authority',
      'Maintain Content Libraries',
      'Compose a reasoning agent',
      'Assign or revoke the authoring grant',
      'Define a severity level',
    ])
    expect(SECTION_253_DISPUTED.locator).toContain('L48319')
    expect(SECTION_253_DISPUTED.standing).toBe('attributed-but-disputed')
  })

  // FAILS IF: a §25.3 status is typed as a permission token rather than as
  // verbatim text. This is the structural half of "not one of its Auditor
  // statuses reaches an affordance": there is no token in the record to
  // reach an affordance WITH.
  it('holds §25.3’s Auditor statuses as text that no evaluator can consume', () => {
    const auditor = SECTION_253_DISPUTED.rows.map((r) => r.readOnlyAuditor)
    expect(auditor.length).toBe(8)
    for (const status of auditor) {
      expect(typeof status).toBe('string')
      // The nine permission tokens, in their code spelling. A record carrying
      // one of these could be fed to the evaluator; a sentence cannot.
      expect(status).not.toMatch(
        /^(allowed|allowedWithConditions|readOnly|unavailable|clientDecisionRequired|explicitlyProhibited|notApplicable|queuedOffline|cachedReadOnlyOffline)$/,
      )
    }
    expect(new Set(auditor)).toEqual(
      new Set([
        'Not applicable — the Auditor works from the Delivery Operations Hub record, which carries every publication event',
        'Unavailable',
        'Read-only',
        'Explicitly prohibited',
      ]),
    )
  })

  // FAILS IF: §25.3's two further disagreements are dropped. The census flags
  // this table as the most likely source of a slice-5 brief defect precisely
  // because it looks authoritative.
  it('records §25.3’s three named disagreements against the governing matrices', () => {
    expect(SECTION_253_DISPUTED.disagreements.length).toBe(3)
    const locators = SECTION_253_DISPUTED.disagreements.map((d) => d.governedBy)
    expect(locators).toContain('AC-STU-157 · L34674')
    expect(locators).toContain('MOD-STU-07 · L32637')
    expect(locators).toContain('MOD-STU-18 · L34558')
  })

  // FAILS IF: the platform table renders only one of its two columns. Both
  // are true and they answer different questions; a build reading only the
  // surface matrix renders the Engineer as never able to see a Studio screen,
  // which is wrong inside a support session.
  it('renders standing access and named-class access as two labelled answers', () => {
    expect(PLATFORM_ROLE_ACCESS.rows.length).toBe(4)
    for (const row of PLATFORM_ROLE_ACCESS.rows) {
      expect(row.standing).toBe('Explicitly prohibited')
      expect(row.throughNamedClass).toMatch(/^Allowed with conditions/)
    }
    const engineer = PLATFORM_ROLE_ACCESS.rows.find((r) => r.roleId === 'ROLE-PLAT-ENG')
    expect(engineer).toBeDefined()
    expect(PLATFORM_ROLE_ACCESS.surfaceMatrixReading).toContain('Explicitly prohibited')
    expect(PLATFORM_ROLE_ACCESS.surfaceMatrixLocator).toContain('L21068')
    expect(PLATFORM_ROLE_ACCESS.chapterReading).toContain('support session read-only')
  })

  // FAILS IF: a coarser restatement is dropped or stops naming its locator.
  it('carries the three coarser restatements with their own locators', () => {
    expect(COARSER_RESTATEMENTS.map((r) => r.id)).toEqual([
      'MTX-TEN-02b',
      'MTX-TEN-01',
      'MTX-PLAT-01',
    ])
    for (const r of COARSER_RESTATEMENTS) {
      expect(r.locator, r.id).toMatch(/^L\d+$/)
      expect(r.governedBy, r.id).toContain('D2')
    }
  })

  // FAILS IF: the source's own five-row table is truncated, or the eight-row
  // chapter-20 expansion is.
  it('carries §5.18’s five rows and chapter 20’s eight', () => {
    expect(FIVE_ROLE_TABLE.length).toBe(5)
    expect(FIVE_ROLE_TABLE.map((r) => r.role)).toEqual([
      'Quality Manager',
      'Supervisor',
      'Plant Manager',
      'Tenant Admin',
      'Frontline Worker',
    ])
    expect(FIVE_ROLE_TABLE.map((r) => r.role)).not.toContain('Read-only Auditor')
    expect(CHAPTER20_TENANT_ROLES.length).toBe(8)
    expect(CHAPTER20_TENANT_ROLES.filter((r) => r.classification !== 'SoW Fact').length).toBe(2)
  })

  // FAILS IF: an unspecified-in-source entry loses its alternatives or its
  // cost statement. An unresolved source decision is disclosed on screen with
  // its alternatives -- the client delegated the decision, not the pretence
  // that the source settled it.
  it('states every unspecified-in-source item with both readings and its cost', () => {
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(1)
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(item.readings.length, item.id).toBeGreaterThan(1)
      expect(item.cost.length, item.id).toBeGreaterThan(30)
      expect(item.locator, item.id).toMatch(/L\d+/)
    }
  })

  // FAILS IF: DEC-ROLE-001 leaves the shared decision canon, or this module
  // mints a local copy of it again -- two wordings of one decision. It used to
  // be an UNSPECIFIED_IN_SOURCE entry here because the canon had no record;
  // the canon now carries D25, so this half is flipped and the no-local-copy
  // half is what this test exists to keep failing on a re-mint.
  it('discloses DEC-ROLE-001 from the shared canon and keeps no local copy', () => {
    const record = studioDecision('D25')
    expect(record.decisionRef).toBe('DEC-ROLE-001')
    // All three readings section 13.3 states, each with its own locator.
    expect(record.readings).toHaveLength(3)
    for (const r of record.readings) expect(r.locator).toMatch(/L\d{4,6}/)
    // THE NO-LOCAL-COPY HALF.
    expect(UNSPECIFIED_IN_SOURCE.map((i) => i.id)).not.toContain('DEC-ROLE-001')
    // And the screen renders the canonical record, read off the record itself
    // so a rewording follows instead of going stale.
    const html = permissionsMarkup({ persona: 'tenant-admin' })
    expect(html).toContain('DEC-ROLE-001')
    for (const r of record.readings) expect(html).toContain(r.text)
    expect(html).toContain(record.adopted)
  })

  // FAILS IF: `Expired` is claimed for a grant the source does not attach it
  // to. L34573 attaches it to one grant only. This module holds NO SECOND COPY
  // of the grant lifecycle -- task 1's grant definitions are the one table,
  // and this pins them so a drift over there goes red here.
  it('attaches Expired to GRANT-STU-IMPL and defers the other two to DEC-TENGRANT-001', () => {
    expect(STUDIO_GRANT_DEFINITIONS.length).toBe(3)
    const impl = STUDIO_GRANT_DEFINITIONS.find((g) => g.id === 'GRANT-STU-IMPL')!
    expect(impl.expiryStatus).toBe('stated')
    expect(impl.expiryDecision).toBeNull()
    for (const other of STUDIO_GRANT_DEFINITIONS.filter((g) => g.id !== 'GRANT-STU-IMPL')) {
      expect(other.expiryStatus, other.id).toBe('clientDecisionRequired')
      expect(other.expiryDecision, other.id).toBe('DEC-TENGRANT-001')
    }
    // And the panel renders the split rather than only holding it.
    const html = signInMarkup({ persona: 'tenant-admin' })
    expect(html).toContain('Expired applies to this grant and only to this grant')
    expect(html).toContain('DEC-TENGRANT-001')
  })
})

/* ==================================================================== *
 * 6. The route registry (C16).
 * ==================================================================== */

describe('the route registry and DEC-AUDSTU-001 (C16)', () => {
  // FAILS IF: `allowedRoles` is widened to admit the Auditor. That answers
  // DEC-AUDSTU-001 in option (b)'s direction silently, which is the mirror of
  // the defect being fixed.
  it('does not widen allowedRoles to admit the Read-only Auditor', () => {
    const studio = ROUTES.find((r) => r.surface === 'SURF-STU')!
    expect(studio.allowedRoles).not.toContain('READONLY_AUDITOR')
    expect(routesForRole('READONLY_AUDITOR').map((r) => r.surface)).not.toContain('SURF-STU')
  })

  // FAILS IF: the registry stops recording that the Auditor's Studio access
  // is an OPEN QUESTION rather than a refusal. Before this change the absence
  // from `allowedRoles` was the whole record, and an absence reads as "no" --
  // which pre-empts DEC-AUDSTU-001 in the direction AC-STU-157 forbids.
  it('records the Auditor’s Studio access as an open decision, not as a refusal', () => {
    const open = routeOpenDecisionFor('SURF-STU', 'READONLY_AUDITOR')
    expect(open).not.toBeNull()
    expect(open!.decision).toBe('DEC-AUDSTU-001')
    expect(open!.why).toMatch(/AC-STU-157/)
  })

  // FAILS IF: the open-decision field leaks into another surface or another
  // role, which would turn a targeted disclosure into a general escape hatch.
  it('records an open decision on exactly one surface and one role', () => {
    const all = ROUTES.flatMap((r) => r.openDecisionRoles.map((o) => `${r.surface}/${o.role}`))
    expect(all).toEqual(['SURF-STU/READONLY_AUDITOR'])
    expect(routeOpenDecisionFor('SURF-DOH', 'READONLY_AUDITOR')).toBeNull()
    expect(routeOpenDecisionFor('SURF-STU', 'WORKER')).toBeNull()
  })
})

/* ==================================================================== *
 * 7. The two screens.
 * ==================================================================== */

describe('SCR-STU-15 — Studio permissions and grants', () => {
  // FAILS IF: the module id or a screen id is turned into a route key, or the
  // annotation region stops carrying them.
  it('annotates the module and screen ids without keying the route on them', () => {
    const html = permissionsMarkup({ persona: 'tenant-admin' })
    expect(html).toContain('MOD-STU-18')
    expect(html).toContain('SCR-STU-15')
    expect(html).toContain('annotation, never a route key')
    expect(html).not.toContain('/studio/SCR-STU-15')
    expect(html).not.toContain('/studio/MOD-STU-18')
  })

  // FAILS IF: row 23's two senses are rendered the same way. This is the
  // brief's step 3, with `toBeDisabled()` replaced: the shared `Button`
  // primitive renders `aria-disabled`, deliberately, so the control stays
  // focusable -- and jest-dom's `toBeDisabled()` does NOT match
  // `aria-disabled`, so the brief's own assertion fails on correct code.
  it('renders row 23 Unavailable as disabled-with-condition and the Worker cell as absent', () => {
    const offline = permissionsMarkup({ persona: 'tenant-admin', online: false })
    expect(offline).toContain('aria-disabled="true"')
    expect(offline).toContain('the Studio requires an active connection')

    const online = permissionsMarkup({ persona: 'tenant-admin' })
    expect(online).toContain('Assign the authoring grant')
    // The pair: the control really is live when online, so the disabled
    // assertion above is not passing on a control that never works.
    expect(online).not.toContain('aria-disabled="true"')

    const worker = permissionsMarkup({ persona: 'worker' })
    expect(worker).not.toContain('Assign the authoring grant')
    expect(worker).not.toContain('aria-disabled="true"')
    expect(worker).toContain('cannot reach any Studio route by any means')

    // The same row, the same axis, the two renderings side by side — asserted
    // on the rule rather than on a screen that draws nothing for the Worker,
    // so the split is proved and not merely implied by an absence.
    const row23 = stu18Row('use-any-capability-while-offline')
    const admin = decisionForRow(row23, scenario({ persona: 'tenant-admin', online: false }))
    const worker23 = decisionForRow(row23, scenario({ persona: 'worker', online: false }))
    expect(affordanceFor('Use a Studio capability', admin).kind).toBe('disabled')
    expect(affordanceFor('Use a Studio capability', worker23).kind).toBe('absent')
    expect(row23.cells.worker.note).toContain('no access at all')
  })

  // FAILS IF: §25.3's disclosure stops rendering, or one of its statuses
  // reaches a control.
  it('renders §25.3 as attributed-but-disputed and grants nothing from it', () => {
    const html = permissionsMarkup({ persona: 'read-only-auditor' })
    expect(html).toContain('L48319')
    expect(html).toMatch(/attributed[^<]*disputed/i)
    expect(html).toContain('Maintain Content Libraries')
    // The row renders as a quotation; it must not have become a control.
    expect(html).not.toMatch(/<button[^>]*>[^<]*Maintain Content Libraries/i)
    expect(html).toContain('DEC-AUDSTU-001')
  })

  // FAILS IF: the Auditor is shown either answer to DEC-AUDSTU-001, or the
  // cost the source itself states is dropped.
  it('states both readings and the source’s own cost for the Auditor', () => {
    const html = permissionsMarkup({ persona: 'read-only-auditor' })
    expect(html).toContain('weakens the audit')
    expect(html).toContain('Client Decision Required')
    expect(html).not.toContain('Assign the authoring grant')
  })

  // FAILS IF: the screen stops rendering an applicable state, or starts
  // rendering the one this surface excludes. STATE-07 is not applicable
  // anywhere on this surface; a lost connection renders STATE-12.
  it('renders an applicable screen state and never the excluded one', () => {
    // ASSERTED AS "NOT RENDERED AS A SCREEN STATE", never as "the token is
    // absent from the built tree": the honest disclosure of the exclusion has
    // to name STATE-07, and a gate that forbids naming it would fail the very
    // disclosure it exists to enforce.
    expect(screenRendersState('SCR-STU-15', 'STATE-07')).toBe(false)
    expect(screenRendersState('SCR-STU-15', 'STATE-06')).toBe(true)
    const offered = permissionsMarkup({ persona: 'tenant-admin' })
    expect(offered).toContain('STATE-07 is not offered')
    expect(offered).toContain('renders STATE-12 with unsaved-work protection')
    expect(offered).not.toContain('value="STATE-07"')

    // The switcher's own list is DERIVED from task 2's model, not hand-picked
    // here — so the three departure-narrowed states drop out too, and this
    // screen cannot offer a state the surface register does not give it.
    const offeredStates = [...offered.matchAll(/value="(STATE-\d\d)"/g)].map((m) => m[1])
    expect(offeredStates.length).toBe(9)
    expect(offeredStates).toEqual(
      STU_APPLICABLE_STATES.map((r) => r.id).filter((id) =>
        screenRendersState('SCR-STU-15', id),
      ),
    )
    for (const narrowed of ['STATE-09', 'STATE-10', 'STATE-11'] as const) {
      expect(offeredStates, narrowed).not.toContain(narrowed)
    }

    const readOnly = permissionsMarkup({
      persona: 'supervisor-without-grant',
      screenState: 'STATE-06',
    })
    expect(readOnly).toContain('Read-only')
  })

  // FAILS IF: a sentence points at content that is not there. Every pointer
  // below names something this build renders, and each assertion fails when
  // its target is removed.
  it('pins every pointer it makes at content this build actually renders', () => {
    const html = permissionsMarkup({ persona: 'tenant-admin' })
    for (const decisionId of ['D2', 'D3', 'D9', 'D13', 'D24'] as const) {
      const record = studioDecision(decisionId)
      expect(html, decisionId).toContain(record.question)
    }
    // The capability panel names the storyboard's own worked example. The
    // words "for example" appear nowhere else in this screen, so removing the
    // example from the panel takes them with it -- asserting only the sentence
    // would be satisfied by the matrix table, which renders it for a different
    // reason entirely.
    expect(html).toContain('for example')
    expect(html).toContain(AUTHORING_GRANT_CONDITION)
    // And the note SB-STU-21 requires on the Tenant Admin's view, pinned with
    // its acceptance-criterion identifier so a paraphrase elsewhere on the
    // page cannot stand in for it.
    expect(html).toContain('separation of duties (AC-STU-152, L34669)')
  })
})

describe('SCR-STU-01 — Sign-in', () => {
  // FAILS IF: SB-STU-21's four identity facts stop rendering.
  it('shows the signed-in identity, its roles, its grants and the tenant tier', () => {
    const html = signInMarkup({ persona: 'supervisor-with-authoring-grant' })
    expect(html).toContain('SCR-STU-01')
    expect(html).toContain('SUPERVISOR')
    expect(html).toContain('GRANT-STU-AUTHOR')
    expect(html).toContain(SEEDED_TIER)
  })

  // FAILS IF: a capability is marked unavailable without its specific missing
  // condition named. AC-STU-155, L34672.
  it('names the specific missing condition on every unavailable capability', () => {
    const html = signInMarkup({ persona: 'supervisor-without-grant' })
    expect(html).toContain('Requires the authoring grant. Ask your Tenant Admin.')

    // The structural half, asserted on the DERIVED rows rather than on the
    // markup: a regex over rendered HTML passes just as happily on a broken
    // regex as on correct output. Every row carries a condition, and an
    // unavailable one carries a sentence rather than a token.
    const rows = capabilityPanelRows(
      scenario({ persona: 'supervisor-without-grant' }),
      STU18_MATRIX,
    )
    expect(rows.length).toBe(23)
    const unavailable = rows.filter((r) => r.availability === 'unavailable')
    expect(unavailable.length).toBeGreaterThan(10)
    for (const entry of unavailable) {
      expect(entry.condition.length, entry.row.id).toBeGreaterThan(40)
      expect(entry.condition, entry.row.id).not.toBe('Unavailable')
      expect(entry.condition, entry.row.id).not.toBe('Explicitly prohibited')
    }
    // The pair: available rows exist too, so the sweep is not passing because
    // every row happens to be unavailable.
    expect(rows.filter((r) => r.availability === 'available').length).toBeGreaterThan(0)
  })

  // FAILS IF: a degraded identity layer leaves anything beyond published read
  // on the screen. TEST-STU-154.
  it('falls closed to published read when the identity layer is unreachable', () => {
    const html = signInMarkup({ identityLayer: 'unreachable' })
    expect(html).toContain('identity layer is unreachable')
    expect(html).toContain('published read')
    expect(html).not.toContain('Assign the authoring grant')
  })

  // FAILS IF: the same rule is implemented twice. Both screens read one
  // rendering rule, so a change to it moves both.
  it('renders the same capability list as SCR-STU-15 for the same scenario', () => {
    const statement = capabilityStatement(
      stu18Row('create-a-workflow'),
      'supervisor-without-grant',
    )
    expect(signInMarkup({ persona: 'supervisor-without-grant' })).toContain(statement.text)
    expect(permissionsMarkup({ persona: 'supervisor-without-grant' })).toContain(statement.text)
  })

  // FAILS IF: the panel reports a grant the identity does not hold. Found by
  // reading the rendered output rather than by an assertion: the panel drew
  // the SCENARIO's raw fields while the evaluator read `studioGrantsFor`, so a
  // Read-only Auditor who holds no grant at all was shown GRANT-STU-AUTHOR as
  // Active. One question, two derivations, one of them false.
  it('reports only the grants the identity layer records for this identity', () => {
    for (const persona of ['read-only-auditor', 'supervisor-without-grant', 'worker'] as const) {
      const held = studioGrantsFor(scenario({ persona }))
      expect(Object.keys(held), persona).toEqual([])
    }
    expect(studioGrantsFor(scenario({ persona: 'supervisor-with-authoring-grant' }))).toEqual({
      'GRANT-STU-AUTHOR': 'Active',
    })
    expect(studioGrantsFor(scenario({ persona: 'implementation-team' }))).toEqual({
      'GRANT-STU-IMPL': 'Active',
    })

    const auditor = plain(signInMarkup({ persona: 'read-only-auditor' }))
    expect(auditor).toContain('GRANT-STU-AUTHOR — not recorded for this identity')
    expect(auditor).not.toContain('GRANT-STU-AUTHOR — Active')
    // The pair: an identity that DOES hold it says so, so the assertion above
    // is not passing because the panel never reports a held grant at all.
    expect(plain(signInMarkup({ persona: 'supervisor-with-authoring-grant' }))).toContain(
      'GRANT-STU-AUTHOR — Active',
    )
  })

  // FAILS IF: the panel stops saying which vocabulary its markers come from,
  // or stops saying that a prohibited capability is offered no control. The
  // marker is SB-STU-21's instruction for a LIST; the token itself carries no
  // rendering, and the two are easy to confuse on the same row.
  it('states that its markers are SB-STU-21’s and that a prohibition gets no control', () => {
    const html = plain(signInMarkup({ persona: 'supervisor-without-grant' }))
    expect(html).toContain('SB-STU-21\u2019s own two words')
    expect(html).toContain('no control anywhere')
    expect(html).toContain('carries no rendering in the source')
  })

  // FAILS IF: the one missing condition that can be READ OFF THE MATRIX stops
  // being read off it. On a row where the with-grant column permits and the
  // without-grant column does not, the authoring grant is what separates the
  // two — they are one role (L34584) — and SB-STU-21 gives that exact sentence
  // as its worked example.
  it('derives the authoring-grant condition for the Supervisor and for nobody else', () => {
    const row = stu18Row('create-a-workflow')
    expect(capabilityStatement(row, 'supervisor-without-grant').text).toContain(
      AUTHORING_GRANT_CONDITION,
    )
    // NOT applied to the Plant Manager persona, even though DEC-ROLE-001
    // delivers it through the same role: §5.18 states that persona as
    // read-only and unable to edit, so offering it the grant would offer a
    // capacity the source withholds.
    expect(capabilityStatement(row, 'plant-manager-persona').text).not.toContain(
      AUTHORING_GRANT_CONDITION,
    )
    // And not on a row where the grant is not the difference.
    expect(
      capabilityStatement(stu18Row('approve-or-release'), 'supervisor-without-grant').text,
    ).not.toContain(AUTHORING_GRANT_CONDITION)

    // AND NOT ON A READ-ONLY CELL, which is the defect this test was extended
    // for: row 2 and row 21 give the Supervisor `Read-only`, which PERMITS the
    // read. Attaching the condition there told a Supervisor they could not
    // read published content without a grant they do not need for it — on a
    // capability the same row marked Available.
    for (const id of [
      'read-published-workflow-content',
      'generate-a-portable-document-format-export',
    ] as const) {
      const statement = capabilityStatement(stu18Row(id), 'supervisor-without-grant')
      expect(statement.availability, id).toBe('available')
      expect(statement.text, id).not.toContain(AUTHORING_GRANT_CONDITION)
    }
  })
})

/* ==================================================================== *
 * 8. Standing constraints.
 * ==================================================================== */

describe('standing constraints', () => {
  // FAILS IF: a closed vocabulary here is declared in the inert annotation
  // form, or an exhaustiveness check is dropped. Proven by the type checker;
  // this asserts the runtime half -- the arrays and the unions agree.
  it('keeps every closed vocabulary exhaustive at runtime as well', () => {
    expect(new Set(STU18_ROW_IDS).size).toBe(STU18_ROW_IDS.length)
    expect(STU18_MATRIX.map((r) => r.id).sort()).toEqual([...STU18_ROW_IDS].sort())
    expect([...STUDIO_GRANT_DEFINITIONS].map((g) => g.id).sort()).toEqual([
      'GRANT-STU-AGENT',
      'GRANT-STU-AUTHOR',
      'GRANT-STU-IMPL',
    ])
  })

  // FAILS IF: a clock or a random source is introduced. The whole module is
  // scanned, comments stripped, because these files name the constructs in
  // prose in order to deny them.
  it('reads no ambient clock and no random source', async () => {
    const { readFileSync, readdirSync } = await import('node:fs')
    const { join } = await import('node:path')
    const dirs = [
      'src/studio/modules/stu-18',
      'app/studio/permissions-and-grants',
      'app/studio/sign-in',
    ]
    const files = dirs.flatMap((d) =>
      readdirSync(d).filter((f) => /\.tsx?$/.test(f)).map((f) => join(d, f)),
    )
    expect(files.length).toBeGreaterThan(5)
    for (const file of files) {
      const stripped = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
      expect(stripped, file).not.toMatch(/\bDate\.now\b/)
      expect(stripped, file).not.toMatch(/\bnew Date\b/)
      expect(stripped, file).not.toMatch(/\bMath\.random\b/)
    }
  })
})

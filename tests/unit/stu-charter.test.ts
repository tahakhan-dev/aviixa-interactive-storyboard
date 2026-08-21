import { existsSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { PERMISSION_OUTCOMES } from '@/policy/decision'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { CONFIGURATION_SECTIONS } from '@/studio/vocab'
import { STU_MODULES, stuModuleById, reachByStudioMatrix } from '@/studio/modules'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
} from '@/studio/publish/register'
import { publishChecksOwnedBy } from '@/studio/publish/checks'
import { WHEEL_BOLT_DRAFT_CONTENT } from '@/studio/journey/fixture'

import {
  AUTHORITY_TIERS,
  CHARTER_ACTIONS,
  CHARTER_PLATFORM_ENGINEER_CELLS,
  ENABLEMENT_AUTHORITY_READINGS,
  MOD_STU_01_MATRIX,
  TIER_ACTIONS,
  TIER_AUTHORITY_MATRIX,
  charterRow,
  enablementRow,
  tierAuthority,
  type CharterAction,
} from '@/studio/modules/stu-01/matrix'
import {
  ATOMIC_CAPABILITY_IDS,
  CAPABILITY_REGISTER,
  NOT_ENTITLED_REASON,
  STU01_SEED_STATE,
  STU01_TENANT,
  capabilitiesForTenant,
  capabilityById,
  capabilityDependencyCheck,
  capabilityForSection,
  consequenceLine,
  notAvailableReason,
  sectionRendering,
  type AtomicCapabilityId,
  type CapabilityRegister,
} from '@/studio/modules/stu-01/capabilities'
import {
  CHARTER_STATEMENTS,
  CHARTER_STATEMENT_IDS,
  charterStatement,
} from '@/studio/modules/stu-01/charter'
import {
  charterDecision,
  enablementAffordance,
  personaIdentity,
  requestDefine,
  setCapabilityEnablement,
  studioService,
  type CharterAuditEntry,
} from '@/studio/modules/stu-01/service'
import { AtomicCapabilitiesView } from '@/studio/modules/stu-01/AtomicCapabilitiesView'
import { NotAvailableLine } from '@/studio/modules/stu-01/NotAvailableLine'

/* ==================================================================== *
 * Fixtures. The baseline PERMITS everything this module could gate --
 * signed in, tenant ACTIVE, Enterprise, identity layer reachable, online
 * -- so a refusal that arrives for the wrong reason cannot certify a
 * guard (defect shape 11, and the pairing task 1 established).
 * ==================================================================== */

const CTX = { state: STU01_SEED_STATE, identityLayer: 'reachable' as const, online: true }

const OTHER_TENANT = tenantId('TEN-OTHER')
const OTHER_TENANT_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-CHARTER-OTHER')),
  OTHER_TENANT,
  (p) => ({ ...p, displayName: 'Other', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

const OTHER_REGISTER: CapabilityRegister = {
  ...CAPABILITY_REGISTER,
  tenant: OTHER_TENANT,
}

/** A sink that records what it was handed. */
function recordingAudit() {
  const written: CharterAuditEntry[] = []
  return {
    written,
    write: (entry: CharterAuditEntry) => {
      written.push(entry)
      return { ok: true as const }
    },
  }
}

const FAILING_AUDIT = () => ({ ok: false as const, failure: 'audit sink unreachable' })
const THROWING_AUDIT = (): never => {
  throw new Error('audit sink threw')
}

/* -------------------------------------------------------------------- *
 * Markup helpers. Deliberately UNSCOPED -- they read every control in
 * the markup they are handed, because a helper narrowed to the controls
 * a test expects is defect shape 10 (a helper scoped to exclude the
 * defect it names).
 * -------------------------------------------------------------------- */

interface Control {
  readonly tag: string
  readonly attrs: string
  readonly label: string
}

function controlsIn(html: string): readonly Control[] {
  const out: Control[] = []
  for (const match of html.matchAll(/<(button|a|input|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    out.push({
      tag: match[1] ?? '',
      attrs: match[2] ?? '',
      label: (match[3] ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    })
  }
  // Void elements never carry a closing tag; an <input> would otherwise be invisible here.
  for (const match of html.matchAll(/<input\b([^>]*)\/?>/g)) {
    out.push({ tag: 'input', attrs: match[1] ?? '', label: '' })
  }
  return out
}

function renderView(persona: StudioPersonaColumn, over: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(
    createElement(AtomicCapabilitiesView, { persona, ...CTX, ...over }),
  )
}

/** Every markup this module puts on a Studio route, for every persona. */
function readAllBuiltStudioRoutes(): readonly string[] {
  return STUDIO_PERSONA_COLUMNS.map((persona) => renderView(persona))
}

/* ==================================================================== *
 * 1. THE TWO MATRICES, TRANSCRIBED
 * ==================================================================== */

describe('the MOD-STU-01 permission matrix (L31571-L31579)', () => {
  // FAILS IF: a row is added to or removed from MOD_STU_01_MATRIX, or an
  // action is renamed. The source's table has exactly four action columns.
  it('carries the source table’s four actions, transposed to action-per-row', () => {
    expect(CHARTER_ACTIONS).toHaveLength(4)
    expect([...CHARTER_ACTIONS]).toEqual([
      'see-charter-statements',
      'change-the-boundary',
      'author-an-atom',
      'enable-a-capability',
    ])
    expect(MOD_STU_01_MATRIX).toHaveLength(4)
    expect(MOD_STU_01_MATRIX.map((r) => r.action)).toEqual([...CHARTER_ACTIONS])
  })

  // FAILS IF: any row omits a persona column. A `Partial` map here would let
  // a missing cell read as a refusal without anybody writing that down.
  it('answers all eight persona columns on every row, and never a role list', () => {
    expect(STUDIO_PERSONA_COLUMNS).toHaveLength(8)
    expect(MOD_STU_01_MATRIX.length).toBeGreaterThan(0)
    for (const row of MOD_STU_01_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
      expect(Object.keys(row.derivation).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
    }
  })

  // FAILS IF: a transcribed cell is reworded. These are the source's own
  // words at L31573-L31578, cell by cell, not paraphrases of them.
  it('transcribes the six columns the source states, verbatim', () => {
    const see = charterRow('see-charter-statements')
    expect(see.cells['quality-manager'].note).toBe('Read-only')
    expect(see.cells['supervisor-with-authoring-grant'].note).toBe('Read-only')
    expect(see.cells['supervisor-without-grant'].note).toBe('Read-only')
    expect(see.cells['tenant-admin'].note).toBe('Read-only')
    expect(see.cells['read-only-auditor'].note).toBe(
      'Client Decision Required — `DEC-AUDSTU-001`',
    )
    expect(see.cells['worker'].note).toBe('Explicitly prohibited')

    const enable = charterRow('enable-a-capability')
    expect(enable.cells['quality-manager'].note).toBe(
      'Allowed with conditions — within entitlement, audited',
    )
    expect(enable.cells['supervisor-with-authoring-grant'].note).toBe(
      'Client Decision Required — the Statement of Work names an authorised user without naming the role; see `DEC-CAPAUTH-001` in section 20.2.15',
    )
    expect(enable.cells['tenant-admin'].note).toBe(
      'Client Decision Required — `DEC-CAPAUTH-001`',
    )
  })

  // FAILS IF: a derived column stops saying it is derived. The source's
  // seven actors do not include the Plant Manager persona or the
  // implementation team; both columns exist because the eight-column
  // vocabulary demands an answer, and an unmarked answer would read as a
  // transcription of a cell the source never wrote.
  it('marks the two columns the source’s table does not state as derived, and only those', () => {
    const derivedColumns: StudioPersonaColumn[] = ['plant-manager-persona', 'implementation-team']
    const transcribed = STUDIO_PERSONA_COLUMNS.filter((c) => !derivedColumns.includes(c))
    expect(transcribed).toHaveLength(6)
    expect(MOD_STU_01_MATRIX.length).toBeGreaterThan(0)
    for (const row of MOD_STU_01_MATRIX) {
      for (const column of derivedColumns) {
        expect(row.derivation[column]).not.toBeNull()
        expect(row.derivation[column]).toMatch(/L\d{4,6}/)
      }
      for (const column of transcribed) {
        expect(row.derivation[column]).toBeNull()
      }
    }
  })

  // FAILS IF: a constraint is hung off the row rather than the cell. The
  // "enable" row is the proof: three of its eight cells disagree, and a
  // row-level outcome would have to pick one of the three.
  it('is not uniform across its columns — the enable row holds three different outcomes', () => {
    const enable = charterRow('enable-a-capability')
    const outcomes = new Set(STUDIO_PERSONA_COLUMNS.map((c) => enable.cells[c].outcome))
    expect(outcomes.size).toBe(3)
    expect([...outcomes].sort()).toEqual([
      'allowedWithConditions',
      'clientDecisionRequired',
      'explicitlyProhibited',
    ])
  })

  // FAILS IF: `Change the boundary` or `Author an atom` gains a tenant cell
  // that is not `Explicitly prohibited`. Both rows are categorical, which is
  // what makes their control ABSENT rather than disabled.
  it('holds the two define-class rows categorically prohibited across all eight columns', () => {
    for (const action of ['change-the-boundary', 'author-an-atom'] as const) {
      const row = charterRow(action)
      expect(STUDIO_PERSONA_COLUMNS.length).toBe(8)
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].outcome).toBe('explicitlyProhibited')
      }
    }
  })

  // FAILS IF: the Platform Engineer row is dropped, or folded into one of
  // the eight tenant columns. `ROLE-PLAT-ENG` is the source's seventh actor
  // and is not a Studio persona column; carrying it separately is what keeps
  // the source's row on the record without asserting a tenant-side control.
  it('carries the Platform Engineer row separately, in the source’s own words', () => {
    expect(CHARTER_PLATFORM_ENGINEER_CELLS).toHaveLength(4)
    expect(CHARTER_PLATFORM_ENGINEER_CELLS.map((c) => c.action)).toEqual([...CHARTER_ACTIONS])
    const see = CHARTER_PLATFORM_ENGINEER_CELLS[0]
    expect(see?.note).toBe(
      'Not applicable — the charter is a tenant-surface boundary, expressed platform-side as registry and entitlement controls',
    )
    expect(CHARTER_PLATFORM_ENGINEER_CELLS[2]?.note).toBe(
      'Allowed with conditions — handler engineered, evaluation scenarios written, evaluation gate passed',
    )
    for (const cell of CHARTER_PLATFORM_ENGINEER_CELLS) {
      expect(cell.sourceRef).toBe('L31579')
    }
  })

  // FAILS IF: a row's `surface` classification moves. The two define-class
  // rows are met on the platform console, not on a Studio screen, and
  // counting them as screen rows would let a module route be offered on a
  // capability no Studio screen carries.
  it('classifies every row, and reaches the eight personas the classification implies', () => {
    expect(MOD_STU_01_MATRIX.filter((r) => r.surface === 'screen')).toHaveLength(2)
    expect(MOD_STU_01_MATRIX.filter((r) => r.surface === 'another-surface')).toHaveLength(2)

    const reach = reachByStudioMatrix(MOD_STU_01_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(Object.keys(reach)).toHaveLength(8)
    expect(reach['worker']).toBe('withheld')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['plant-manager-persona']).toBe('offered')
    expect(reach['implementation-team']).toBe('offered')
  })
})

describe('the tier authority matrix (L30757-L30765), quoted once and exported', () => {
  // FAILS IF: a row or a tier column is dropped. Seven data rows, four tiers.
  it('holds seven actions across four tiers', () => {
    expect(TIER_ACTIONS).toHaveLength(7)
    expect(AUTHORITY_TIERS).toHaveLength(4)
    expect(TIER_AUTHORITY_MATRIX).toHaveLength(7)
    expect(TIER_AUTHORITY_MATRIX.map((r) => r.action)).toEqual([...TIER_ACTIONS])
    for (const row of TIER_AUTHORITY_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...AUTHORITY_TIERS].sort())
      expect(row.sourceRef).toMatch(/^L307[56]\d$/)
    }
  })

  // FAILS IF: a cell's stated condition is reworded or its outcome moved.
  it('reads Tier 2 exactly as the source states it, cell by cell', () => {
    expect(tierAuthority('author-an-atomic-capability', 'tier-2-studio').outcome).toBe(
      'explicitlyProhibited',
    )
    expect(tierAuthority('enable-a-capability-within-entitlement', 'tier-2-studio')).toMatchObject({
      outcome: 'allowedWithConditions',
      note: 'Allowed with conditions — authorised Studio user, within entitlement',
    })
    expect(tierAuthority('configure-a-capability-per-screen', 'tier-2-studio').note).toBe(
      'Allowed with conditions — authoring grant required',
    )
    expect(tierAuthority('compose-a-reasoning-agent-from-capabilities', 'tier-1-console')).toMatchObject(
      {
        outcome: 'notApplicable',
        note: 'Not applicable — composition is a tenant act performed in the Studio',
      },
    )
    expect(tierAuthority('execute-a-configured-capability-at-run-time', 'floor-frontline').note).toBe(
      'Allowed with conditions — within the pinned work package',
    )
  })

  // FAILS IF: a tier cell carries an outcome outside the four the table uses,
  // or the vocabulary stops being drawn from slice 3's nine.
  it('draws its outcomes from the platform vocabulary, never a fifth token', () => {
    const used = new Set(
      TIER_AUTHORITY_MATRIX.flatMap((r) => AUTHORITY_TIERS.map((t) => r.cells[t].outcome)),
    )
    expect(used.size).toBe(4)
    for (const outcome of used) expect(PERMISSION_OUTCOMES).toContain(outcome)
  })
})

/* ==================================================================== *
 * 2. AC-STU-005 — NO CONTROL CREATES A CAPABILITY
 * ==================================================================== */

describe('AC-STU-005 (L30780) — nothing in the Studio creates an atom', () => {
  // FAILS IF: any control-creating label reaches the markup.
  //
  // The brief's regex is kept exactly, and it is run over the CONTROL SURFACE
  // rather than over all prose, because that is where AC-STU-005 binds ("No
  // user interface CONTROL anywhere in the Studio creates..."). Run over all
  // prose it goes red on two VERBATIM source sentences this module is
  // required to render: L31646, "an offline device cannot acquire a new
  // capability", and L31566, a tenant can never "create a safety-critical
  // capability". Weakening the regex to dodge them would weaken the guard;
  // scoping it to where the criterion binds does not.
  it('offers no create-a-capability control on any Studio route', () => {
    const html = readAllBuiltStudioRoutes()
    expect(html.length).toBe(8)
    expect(html.length).toBeGreaterThan(0)

    const controls = html.flatMap((markup) => controlsIn(markup))
    expect(controls.length).toBeGreaterThan(0)
    const surface = controls.flatMap((c) => [c.label, c.attrs]).join(' ')
    expect(surface).not.toMatch(/new capability|create capability|define an atom/i)

    // The regex is proved able to match BEFORE it is trusted to refuse. A
    // typo here would pass on the code and on its own negation alike.
    expect('Create capability').toMatch(/new capability|create capability|define an atom/i)
  })

  // FAILS IF: a control whose label offers creation appears anywhere. This is
  // the property the regex above only approximates: the sweep reads EVERY
  // button, link, input and select in the markup, not a chosen subset.
  it('renders no control anywhere whose label offers to create, add or define one', () => {
    const controls = readAllBuiltStudioRoutes().flatMap((html) => controlsIn(html))
    expect(controls.length).toBeGreaterThan(0)
    const offenders = controls.filter((c) => /\b(create|new|add|define|author)\b/i.test(c.label))
    expect(offenders).toEqual([])
  })

  // FAILS IF: any control in this view is live. Every control here is inert --
  // there is nothing on this surface anybody currently holds.
  it('renders every control inert, and gives the prohibited persona none at all', () => {
    let total = 0
    expect(STUDIO_PERSONA_COLUMNS).toHaveLength(8)
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const buttons = controlsIn(renderView(persona)).filter((c) => c.tag === 'button')
      total += buttons.length
      for (const button of buttons) {
        expect(button.attrs).toMatch(/aria-disabled="true"/)
      }
    }
    // Non-vacuous at BOTH ends: the most permitted persona really does render
    // controls, so "every control is inert" is not a statement about nothing;
    // and the persona the source prohibits outright renders none, so the
    // prohibition is ABSENCE rather than a disabled button.
    expect(total).toBeGreaterThan(0)
    expect(controlsIn(renderView('quality-manager')).filter((c) => c.tag === 'button')).toHaveLength(
      7,
    )
    expect(controlsIn(renderView('worker')).filter((c) => c.tag === 'button')).toHaveLength(0)
  })
})

/* ==================================================================== *
 * 3. THE REFUSAL, AND THE AUDIT ASYMMETRY
 * ==================================================================== */

describe('FUNC-STU-01-01-C-1 (L31599) — refusing is the safe direction', () => {
  // FAILS IF: the refusal is made conditional on the audit write succeeding.
  it('still refuses a define-class request when the audit write fails', () => {
    expect(
      requestDefine(
        { actorIdentityId: 'IDN-ELENA', detail: 'create an equipment-signal atom' },
        FAILING_AUDIT,
      ),
    ).toMatchObject({ refused: true, audited: false })
  })

  // FAILS IF: a throwing sink is allowed to propagate. An exception escaping
  // here is the fail-OPEN direction: the caller cannot tell refusal from crash.
  it('still refuses when the audit sink throws rather than returning a failure', () => {
    expect(
      requestDefine({ actorIdentityId: 'IDN-ELENA', detail: 'alter the harness' }, THROWING_AUDIT),
    ).toMatchObject({ refused: true, audited: false })
  })

  // FAILS IF: the audit write is skipped on the happy path, or the entry stops
  // recording the identity. L34657 audits identity and action, never a role.
  it('audits the refusal by identity and action when the sink works', () => {
    const sink = recordingAudit()
    const result = requestDefine(
      { actorIdentityId: 'IDN-ELENA', detail: 'create an equipment-signal atom' },
      sink.write,
    )
    expect(result).toMatchObject({ refused: true, audited: true })
    expect(sink.written).toHaveLength(1)
    expect(sink.written[0]).toMatchObject({ identityId: 'IDN-ELENA', action: 'define-atom' })
    expect(JSON.stringify(sink.written[0])).not.toMatch(/acting as role/i)
  })

  // FAILS IF: the refusal is moved into the interface. AC-STU-041 (L31674)
  // requires the service layer to refuse a define-class request whatever it
  // arrives through, so this call bypasses every screen in the build.
  it('refuses at the service layer, not only in the interface', () => {
    expect(
      studioService.defineCapability(
        { actor: 'QUALITY_MANAGER', identityId: 'IDN-ELENA', detail: 'define an atom' },
        () => ({ ok: true as const }),
      ).ok,
    ).toBe(false)
  })

  // FAILS IF: any tenant role is admitted. "Roles allowed: none — this is a
  // universal refusal" (L31599). Walked over every role the build mints.
  it('refuses every actor, with none excepted', () => {
    const actors = [
      'QUALITY_MANAGER',
      'SUPERVISOR',
      'TENANT_ADMIN',
      'READONLY_AUDITOR',
      'WORKER',
    ] as const
    expect(actors).toHaveLength(5)
    for (const actor of actors) {
      const result = studioService.defineCapability(
        { actor, identityId: `IDN-${actor}`, detail: 'define an atom' },
        () => ({ ok: true as const }),
      )
      expect(result.ok).toBe(false)
      expect(result.outcome).toBe('explicitlyProhibited')
    }
  })
})

/* ==================================================================== *
 * 4. THE ENABLEMENT CONTROL — DISABLED, NOT ABSENT, AND NAMED
 * ==================================================================== */

describe('DEC-CAPAUTH-001 — the enablement control names DEC-CAPAUTH-001 and acts for nobody', () => {
  const TOLERANCE = capabilityById(CAPABILITY_REGISTER.rows, 'CAP-TOLERANCE')!
  const EQUIPMENT_SIGNAL = capabilityById(CAPABILITY_REGISTER.rows, 'CAP-EQUIPMENT-SIGNAL')!

  // The brief names the three roles; the surface's vocabulary is the eight
  // matrix columns, and these are the three whose consolidated cells (L34555)
  // read `Client Decision Required`.
  const OPEN_DECISION_COLUMNS: readonly StudioPersonaColumn[] = [
    'quality-manager',
    'supervisor-with-authoring-grant',
    'tenant-admin',
  ]

  // FAILS IF: the control is rendered live for any of the three, or stops
  // naming the decision. Both halves matter: a disabled control with no
  // decision identifier is the blank refusal AC-STU-155 forbids.
  it('disables enablement for the three open-decision columns and names DEC-CAPAUTH-001', () => {
    expect(OPEN_DECISION_COLUMNS).toHaveLength(3)
    for (const persona of OPEN_DECISION_COLUMNS) {
      const affordance = enablementAffordance(TOLERANCE, persona, CTX)
      expect(affordance.kind).toBe('disabled')
      if (affordance.kind !== 'disabled') throw new Error('unreachable')
      expect(affordance.label).toMatch(/enable or disable tolerance validation/i)
      expect(affordance.openDecision).toBe('DEC-CAPAUTH-001')
      expect(affordance.reason).toMatch(/DEC-CAPAUTH-001/)

      const html = renderView(persona)
      const button = controlsIn(html).find((c) =>
        /enable or disable tolerance validation/i.test(c.label),
      )
      expect(button).toBeDefined()
      expect(button?.attrs).toMatch(/aria-disabled="true"/)
      expect(html).toMatch(/DEC-CAPAUTH-001/)
    }
  })

  // FAILS IF: a persona the source prohibits is shown a disabled control
  // instead of none. `Explicitly prohibited` carries no rendering in the
  // source; this build's ruling is ABSENT, with the explanatory line the
  // happy path's step 4 (L31611) requires in place of blank space.
  it('renders no enablement control at all for the prohibited columns, with the reason stated', () => {
    const prohibited: readonly StudioPersonaColumn[] = [
      'supervisor-without-grant',
      'plant-manager-persona',
      'read-only-auditor',
      'worker',
      'implementation-team',
    ]
    expect(prohibited).toHaveLength(5)
    for (const persona of prohibited) {
      const affordance = enablementAffordance(TOLERANCE, persona, CTX)
      expect(affordance.kind).toBe('absent')
      if (affordance.kind !== 'absent') throw new Error('unreachable')
      expect(affordance.note.length).toBeGreaterThan(30)
    }
  })

  // FAILS IF: any persona gets a live control. Walks all eight, so a ninth
  // column added without a ruling cannot slip through as "allowed".
  it('gives no persona a live enablement control', () => {
    expect(STUDIO_PERSONA_COLUMNS).toHaveLength(8)
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      expect(enablementAffordance(TOLERANCE, persona, CTX).kind).not.toBe('live')
      const affordance = enablementAffordance(TOLERANCE, persona, CTX)
      expect(['absent', 'disabled']).toContain(affordance.kind)
    }
  })

  // FAILS IF: the affordance stops routing through the evaluator and starts
  // reading a role list. The evaluator is the only thing that knows the
  // identity layer is unreachable, so a hardcoded affordance stays "disabled"
  // here while the real one becomes an identity-layer refusal.
  it('is computed by the evaluator, not by a module-level role list', () => {
    const decision = charterDecision('enable-a-capability', 'quality-manager', CTX)
    expect(decision.personaColumns).toContain('quality-manager')

    const failClosed = charterDecision('enable-a-capability', 'quality-manager', {
      ...CTX,
      identityLayer: 'unreachable',
    })
    expect(failClosed.outcome).toBe('unavailable')
    expect(failClosed.reason).toMatch(/identity layer is unreachable/i)
  })

  // FAILS IF: the source conflict is resolved silently. MOD-STU-01's own
  // matrix gives the Quality Manager `Allowed with conditions`; MOD-STU-15
  // row 1, the consolidated row 15 and this card's own Source status line all
  // read the authority as undecided. All three readings render.
  it('discloses the Quality Manager conflict rather than settling it', () => {
    expect(ENABLEMENT_AUTHORITY_READINGS.length).toBeGreaterThanOrEqual(3)
    const locators = ENABLEMENT_AUTHORITY_READINGS.map((r) => r.locator).join(' ')
    expect(locators).toMatch(/L31573/)
    expect(locators).toMatch(/L34555/)
    expect(locators).toMatch(/L31678/)
    const html = renderView('quality-manager')
    for (const reading of ENABLEMENT_AUTHORITY_READINGS) {
      expect(html).toContain(reading.locator)
    }
  })

  // FAILS IF: the two clauses swap order, or the entitlement clause is lost.
  //
  // FOUND IN SELF-REVIEW BY READING THE OUTPUT. The first draft took only a
  // capability NAME, so the equipment-signal row — which this tenant is not
  // entitled to at all — rendered a control whose reason named
  // DEC-CAPAUTH-001 and never mentioned the entitlement. AC-STU-155 wants the
  // SPECIFIC missing condition, and that was the wrong one.
  it('names the entitlement before the open decision, and only where authority allows', () => {
    expect(EQUIPMENT_SIGNAL.entitlement).toBe('not-included')
    const forAdmin = enablementAffordance(EQUIPMENT_SIGNAL, 'tenant-admin', CTX)
    expect(forAdmin.kind).toBe('disabled')
    if (forAdmin.kind !== 'disabled') throw new Error('unreachable')
    expect(forAdmin.reason.indexOf(NOT_ENTITLED_REASON)).toBeGreaterThanOrEqual(0)
    expect(forAdmin.reason.indexOf(NOT_ENTITLED_REASON)).toBeLessThan(
      forAdmin.reason.indexOf('DEC-CAPAUTH-001'),
    )
    // An entitled row says nothing about entitlement.
    const entitled = enablementAffordance(TOLERANCE, 'tenant-admin', CTX)
    if (entitled.kind !== 'disabled') throw new Error('unreachable')
    expect(entitled.reason).not.toContain(NOT_ENTITLED_REASON)

    // AUTHORITY FIRST: a persona the matrix refuses outright is told about
    // their own authority and NOT about what the tenant is entitled to.
    // STATE-05: never disclose what the actor may not see.
    for (const persona of ['worker', 'supervisor-without-grant'] as const) {
      const refused = enablementAffordance(EQUIPMENT_SIGNAL, persona, CTX)
      expect(refused.kind).toBe('absent')
      if (refused.kind !== 'absent') throw new Error('unreachable')
      expect(refused.note).not.toContain(NOT_ENTITLED_REASON)
    }
  })

  // FAILS IF: the screen and the service order the two clauses differently.
  it('refuses in the same order at the service layer as on the screen', () => {
    const sink = recordingAudit()
    const refused = setCapabilityEnablement(
      {
        register: CAPABILITY_REGISTER,
        capability: 'CAP-EQUIPMENT-SIGNAL',
        to: 'enabled',
        ...personaIdentity('worker'),
        commercialTier: 'Enterprise',
        identityLayer: 'reachable',
        state: STU01_SEED_STATE,
        online: true,
      },
      sink.write,
    )
    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('unreachable')
    expect(refused.refusedBy).toBe('access')
    expect(refused.reason).not.toContain(NOT_ENTITLED_REASON)
  })

  // FAILS IF: the unspecified-in-source panel stops using task 3's component,
  // or DEC-CAPAUTH-001's disclosure is dropped from the view.
  it('discloses the open decision through the shared disclosure component', () => {
    const html = renderView('tenant-admin')
    expect(html).toMatch(/A client-delegated choice under APP-012, not a position the source settled/)
    expect(html).toMatch(/Open decision DEC-CAPAUTH-001/)
  })
})

/* ==================================================================== *
 * 5. SB-STU-02 — THE FOUR COLUMNS, THE ENTITLEMENT ROW, THE CONSEQUENCE
 * ==================================================================== */

describe('SB-STU-02 (L30751) — the Atomic Capability area', () => {
  // FAILS IF: the seeded register loses a row, or an id is renamed.
  it('holds the six rows the source’s own table states (L33977-L33982)', () => {
    expect(ATOMIC_CAPABILITY_IDS).toHaveLength(6)
    expect(CAPABILITY_REGISTER.rows).toHaveLength(6)
    expect(CAPABILITY_REGISTER.rows.map((r) => r.id)).toEqual([...ATOMIC_CAPABILITY_IDS])
  })

  // FAILS IF: a row's name, its source wording or its locator is reworded.
  //
  // WRITTEN BECAUSE PLANTING FOUND THE GAP. Renaming CAP-TOOLING left the
  // whole suite GREEN: the ids and the length were asserted, and the
  // consequence-line check reads the row's OWN name, so it agreed with
  // whatever the row said. That is a check comparing data to itself — defect
  // shapes 5 and 9 in one line. These are literals, transcribed from
  // L33977-L33982.
  it('transcribes each of the six rows, name and source wording alike', () => {
    const expected = [
      ['CAP-COACHING', 'Real-time coaching', 'Real-time coaching, the Prevention Agent', 'L33977'],
      ['CAP-TOLERANCE', 'Tolerance validation', 'Tolerance validation, part of deviation handling', 'L33978'],
      ['CAP-CONTAINMENT', 'Containment response', 'Containment response, Deviation and Containment', 'L33979'],
      ['CAP-QUALIFICATION', 'Elevated qualification enforcement', 'Elevated qualification enforcement', 'L33980'],
      ['CAP-TOOLING', 'Tool and equipment control', 'Tool and equipment control', 'L33981'],
      ['CAP-EQUIPMENT-SIGNAL', 'Equipment-signal monitoring', 'A future capability, for example equipment-signal monitoring', 'L33982'],
    ] as const
    expect(expected).toHaveLength(6)
    expect(CAPABILITY_REGISTER.rows).toHaveLength(expected.length)
    expect(
      CAPABILITY_REGISTER.rows.map((r) => [r.id, r.name, r.sourceWording, r.sourceRef]),
    ).toEqual(expected.map((e) => [...e]))

    // And every name renders, so a row cannot be present in data and absent
    // from the screen.
    const html = renderView('quality-manager')
    for (const [, name] of expected) expect(html).toContain(name)
  })

  // FAILS IF: the right-hand column of the source's table is reworded. SB-STU-02
  // renders "the configuration surfaces it switches on" from these words.
  it('transcribes the surface each capability switches on, verbatim', () => {
    expect(CAPABILITY_REGISTER.rows).toHaveLength(6)
    expect(CAPABILITY_REGISTER.rows.map((r) => r.surfaceWording)).toEqual([
      'Timing thresholds and the coaching-content section',
      'Specification Limits: lower limit, upper limit, unit, drawing reference',
      'Severity mapping, containment-checklist picker, escalation routing',
      'Screen-level qualification override',
      'Tool barcode and calibration-confirmation requirements',
      'A new configuration surface for that capability, appearing only where relevant',
    ])
  })

  // FAILS IF: a capability outside entitlement is hidden rather than greyed,
  // or its reason drifts from the source's exact sentence (AC-STU-008, L30783).
  it('shows a capability outside entitlement with the source’s exact reason, never hidden', () => {
    expect(NOT_ENTITLED_REASON).toBe('Not included in this tenant’s entitlement')
    const outside = CAPABILITY_REGISTER.rows.filter((r) => r.entitlement === 'not-included')
    expect(outside).toHaveLength(1)
    expect(outside[0]?.id).toBe('CAP-EQUIPMENT-SIGNAL')
    expect(outside[0]?.notIncludedReason).toBe(NOT_ENTITLED_REASON)

    const html = renderView('quality-manager')
    expect(html).toContain('Equipment-signal monitoring')
    expect(html).toContain(NOT_ENTITLED_REASON)
  })

  // FAILS IF: the consequence line is reworded, or generated from anything
  // but the row's own data. The source prints this exact sentence at L30751,
  // and it is produced BY the function rather than pasted beside it.
  it('produces the source’s own consequence sentence from the row’s own data', () => {
    const tolerance = capabilityById(CAPABILITY_REGISTER.rows, 'CAP-TOLERANCE')
    expect(tolerance).not.toBeNull()
    expect(consequenceLine(tolerance!)).toBe(
      'Disabling tolerance validation removes the Specification Limits section from all measurement screens and blocks publication of any Workflow that depends on it.',
    )
  })

  // FAILS IF: any row's consequence line goes blank. A row that goes quiet is
  // the blank cell this build refuses one level up.
  it('gives every row a non-blank consequence line, and renders all six', () => {
    expect(CAPABILITY_REGISTER.rows.length).toBe(6)
    const html = renderView('quality-manager')
    for (const row of CAPABILITY_REGISTER.rows) {
      const line = consequenceLine(row)
      expect(line.length).toBeGreaterThan(40)
      expect(html).toContain(line)
    }
  })

  // FAILS IF: the four columns SB-STU-02 names stop rendering.
  it('renders the four columns the storyboard names', () => {
    const html = renderView('quality-manager')
    for (const header of [
      'Capability',
      'Enablement state',
      'Configuration surfaces it switches on',
      'Workflows currently relying on it',
    ]) {
      expect(html).toContain(header)
    }
    // Non-vacuous: the workflow column really carries the journey's workflow.
    expect(html).toContain(WHEEL_BOLT_DRAFT_CONTENT.workflowName)
  })

  // FAILS IF: the nine sections stop being reachable from the seeded state.
  // DEC-CAPAUTH-001 seeds enablement so all nine render; a loop over an empty section
  // list would pass every negative assertion inside it, so the length is
  // asserted first and each section is named.
  it('seeds enablement so all nine configuration sections exist', () => {
    expect(CONFIGURATION_SECTIONS).toHaveLength(9)
    const present = CONFIGURATION_SECTIONS.filter(
      (s) => sectionRendering(s, CAPABILITY_REGISTER.rows, null).kind === 'present',
    )
    expect(present).toHaveLength(9)
    expect([...present]).toEqual([...CONFIGURATION_SECTIONS])
  })

  // FAILS IF: a section's gating capability is lost, or two sections collapse
  // onto one capability. Five of the nine are gated; four are ungated.
  it('maps six of the nine sections to a gating capability and three to none', () => {
    const gated = CONFIGURATION_SECTIONS.map((s) => capabilityForSection(CAPABILITY_REGISTER.rows, s))
    expect(gated).toHaveLength(9)
    expect(gated.filter((c) => c !== null)).toHaveLength(6)
    expect(new Set(gated.filter((c) => c !== null).map((c) => c!.id)).size).toBe(5)
    expect(capabilityForSection(CAPABILITY_REGISTER.rows, 'Specification limits')?.id).toBe(
      'CAP-TOLERANCE',
    )
    expect(
      capabilityForSection(CAPABILITY_REGISTER.rows, 'Deviation rules and severity mapping')?.id,
    ).toBe('CAP-CONTAINMENT')
    expect(capabilityForSection(CAPABILITY_REGISTER.rows, 'Screen content')).toBeNull()
  })
})

/* ==================================================================== *
 * 6. SB-STU-04 — THE NOT-AVAILABLE LINE
 * ==================================================================== */

describe('SB-STU-04 (L31640) — the line where the section would be', () => {
  // FAILS IF: the reason string is removed or reworded. Asserted on the exact
  // sentence, not on an array being non-empty.
  it('names the section, the words “Not available”, and the specific reason', () => {
    const containment = capabilityById(CAPABILITY_REGISTER.rows, 'CAP-CONTAINMENT')
    expect(containment).not.toBeNull()
    const reason = notAvailableReason(containment!)
    expect(reason).toBe(
      'Requires the containment response capability, which is not enabled for this tenant.',
    )

    const html = renderToStaticMarkup(
      createElement(NotAvailableLine, {
        section: 'Deviation rules and severity mapping',
        reason,
        viewHref: '/studio/capabilities/',
        whoToAsk: 'Ask your Tenant Admin.',
      }),
    )
    expect(html).toContain('Deviation rules and severity mapping')
    expect(html).toContain('Not available')
    expect(html).toContain(reason)
  })

  // FAILS IF: the reason is dropped from the rendering while the section name
  // survives. This is the assertion the brief asks for by name: it goes red on
  // the reason string, not on an empty array.
  it('goes red when the reason is removed from the rendering', () => {
    const html = renderToStaticMarkup(
      createElement(NotAvailableLine, {
        section: 'Specification limits',
        reason: 'Requires the tolerance validation capability, which is not enabled for this tenant.',
        viewHref: null,
        whoToAsk: 'Ask your Tenant Admin.',
      }),
    )
    expect(html).toContain(
      'Requires the tolerance validation capability, which is not enabled for this tenant.',
    )
  })

  // FAILS IF: the link branch and the who-to-ask branch collapse into one.
  // The storyboard states both, and both are live: the link is offered to a
  // persona that may read the view, and the who-to-ask sentence always
  // renders because DEC-CAPAUTH-001 leaves enablement authority undecided.
  it('offers the link where the view is readable and always states who to ask', () => {
    const withLink = renderToStaticMarkup(
      createElement(NotAvailableLine, {
        section: 'Timing',
        reason: 'Requires the real-time coaching capability, which is not enabled for this tenant.',
        viewHref: '/studio/capabilities/',
        whoToAsk: 'Ask your Tenant Admin, who administers Studio capacities.',
      }),
    )
    const withoutLink = renderToStaticMarkup(
      createElement(NotAvailableLine, {
        section: 'Timing',
        reason: 'Requires the real-time coaching capability, which is not enabled for this tenant.',
        viewHref: null,
        whoToAsk: 'Ask your Tenant Admin, who administers Studio capacities.',
      }),
    )
    expect(withLink).toContain('href="/studio/capabilities/"')
    expect(withoutLink).not.toContain('href=')
    expect(withLink).toContain('Ask your Tenant Admin, who administers Studio capacities.')
    expect(withoutLink).toContain('Ask your Tenant Admin, who administers Studio capacities.')
  })

  // FAILS IF: the route the line points at stops existing. A screen sentence
  // pointing at content elsewhere is a claim, and this is the test that goes
  // red when its target is removed.
  it('points at a route that exists in this build', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-01')
    expect(module.slug).toBe('capabilities')
    expect(existsSync(`app/studio/${module.slug}/page.tsx`)).toBe(true)
    const html = renderToStaticMarkup(
      createElement(NotAvailableLine, {
        section: 'Timing',
        reason: 'Requires the real-time coaching capability, which is not enabled for this tenant.',
        viewHref: `/studio/${module.slug}/`,
        whoToAsk: 'Ask your Tenant Admin.',
      }),
    )
    expect(html).toContain(`href="/studio/${module.slug}/"`)
  })
})

/* ==================================================================== *
 * 7. FB-STU-07 — FREEZE READ-ONLY, DISCARDING NOTHING
 * ==================================================================== */

describe('FUNC-STU-01-01-B-1 (L31597) — surfaces freeze rather than disappear', () => {
  // FAILS IF: an unresolvable capability state renders the section as
  // not-available (which discards the value) instead of frozen read-only.
  it('freezes an unresolvable section read-only and discards no configured value', () => {
    const configured = { lowerLimit: 44, upperLimit: 47, unit: 'Newton metres', drawing: 'DWG-A441' }
    const unresolvable = {
      ...CAPABILITY_REGISTER,
      rows: CAPABILITY_REGISTER.rows.map((r) =>
        r.id === 'CAP-TOLERANCE' ? { ...r, enablement: 'unresolvable' as const } : r,
      ),
    }
    const rendering = sectionRendering('Specification limits', unresolvable.rows, configured)
    expect(rendering.kind).toBe('frozen-read-only')
    if (rendering.kind !== 'frozen-read-only') throw new Error('unreachable')
    // The round trip: what went in comes back out, value for value.
    expect(rendering.value).toEqual(configured)
    expect(rendering.reason).toMatch(/frozen/i)
  })

  // FAILS IF: a genuinely disabled capability starts freezing instead of
  // disappearing. Disabled and unresolvable are two different answers and
  // render oppositely; collapsing them is how a section that was removed on
  // purpose comes back as a frozen one.
  it('keeps disabled and unresolvable apart', () => {
    const disabled = CAPABILITY_REGISTER.rows.map((r) =>
      r.id === 'CAP-TOLERANCE' ? { ...r, enablement: 'disabled' as const } : r,
    )
    const rendering = sectionRendering('Specification limits', disabled, { lowerLimit: 44 })
    expect(rendering.kind).toBe('not-available')
    if (rendering.kind !== 'not-available') throw new Error('unreachable')
    expect(rendering.reason).toBe(
      'Requires the tolerance validation capability, which is not enabled for this tenant.',
    )
  })
})

/* ==================================================================== *
 * 7b. FB-STU-07 — THE FIRST FALLBACK AND THE TERMINAL SAFE STATE
 * ==================================================================== */

describe('FB-STU-07 (L30767-L30774) — an unreadable registry', () => {
  // FAILS IF: an unreadable registry still draws the capability table.
  // TEST-STU-009 (L30790): the area "never presents stale enablement as
  // current". The terminal safe state (L30774) is the whole screen, not a
  // banner over content that is being shown anyway.
  it('draws no capability state at all when the registry cannot be read', () => {
    const html = renderView('quality-manager', { registryRead: 'unreadable' })
    expect(html.length).toBeGreaterThan(0)
    for (const row of CAPABILITY_REGISTER.rows) {
      expect(html).not.toContain(consequenceLine(row))
    }
    expect(html).not.toContain('Enablement state')
    // STATE-12's contract: what failed, whether anything was written, next step.
    expect(html).toMatch(/could not be read/i)
    expect(html).toMatch(/frozen read-only/i)
    expect(html).toMatch(/publication is blocked/i)
  })

  // FAILS IF: the first fallback presents last-retrieved state as current.
  // Both halves are asserted: the rows DO render (so this is not a test about
  // an empty screen) and they are labelled last retrieved.
  it('shows the last-retrieved state labelled as last retrieved, never as current', () => {
    const html = renderView('quality-manager', { registryRead: 'last-retrieved' })
    expect(html).toContain('Last retrieved, not current')
    expect(html).toContain(`Last retrieved ${CAPABILITY_REGISTER.retrievedAt}`)
    expect(CAPABILITY_REGISTER.rows).toHaveLength(6)
    for (const row of CAPABILITY_REGISTER.rows) {
      expect(html).toContain(row.name)
    }
  })

  // FAILS IF: a register that read successfully and holds nothing renders a
  // blank list. STATE-01 names what would appear and what creates it — and
  // what creates it is a platform act, never a Studio one.
  it('names what would appear when the register reads empty', () => {
    const empty = { ...CAPABILITY_REGISTER, rows: [] }
    const html = renderView('quality-manager', { registers: [empty] })
    expect(html).toMatch(/no atomic capabilities in this tenant’s entitlement set yet/i)
    expect(html).toMatch(/Platform Engineer/)
    expect(html).toMatch(/Nothing in the Studio creates one/)
    expect(html).not.toContain('Enablement state')
  })

  // FAILS IF: a tenant with no register of its own is served another's, or is
  // shown a silent blank. Reading nothing is a FAILED read, not an empty one.
  it('treats a tenant with no register as a failed read, not an empty one', () => {
    const html = renderView('quality-manager', { tenant: tenantId('TEN-NOBODY') })
    expect(html).toMatch(/could not be read/i)
    expect(html).not.toContain('Equipment-signal monitoring')
  })
})

/* ==================================================================== *
 * 8. PUBLISH CHECK #9
 * ==================================================================== */

describe('AC-STU-007 (L30782) — publication blocked on a capability dependency', () => {
  // FAILS IF: the check is registered by a module that does not own it, or
  // the ownership moves.
  it('registers check 9 from MOD-STU-01, the module the registry names', () => {
    expect(publishChecksOwnedBy('MOD-STU-01').map((c) => c.id)).toEqual(['capability-dependency'])
    expect(capabilityDependencyCheck.checkId).toBe('capability-dependency')
    expect(capabilityDependencyCheck.implementedBy).toBe('MOD-STU-01')

    const result = registerPublishChecks(createPublishCheckRegister(), capabilityDependencyCheck)
    expect(result.ok).toBe(true)
  })

  // FAILS IF: the blocker stops naming the dependent screens, or names none.
  it('blocks a Workflow whose screens depend on a disabled capability, naming the screens', () => {
    const disabled = {
      ...CAPABILITY_REGISTER,
      rows: CAPABILITY_REGISTER.rows.map((r) =>
        r.id === 'CAP-TOLERANCE' ? { ...r, enablement: 'disabled' as const } : r,
      ),
    }
    const registered = registerPublishChecks(createPublishCheckRegister(), capabilityDependencyCheck)
    expect(registered.ok).toBe(true)
    if (!registered.ok) throw new Error('unreachable')

    const evaluation = evaluatePublish(registered.register, {
      workflowName: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
      register: disabled,
      screens: WHEEL_BOLT_DRAFT_CONTENT.measurementScreens.map((n) => ({
        screenId: `Screen ${n}`,
        requires: 'CAP-TOLERANCE' as AtomicCapabilityId,
      })),
    })

    const blocker = evaluation.blockers.find((b) => b.checkId === 'capability-dependency')
    expect(blocker).toBeDefined()
    expect(blocker?.kind).toBe('failed')
    // Every dependent screen is named -- eight of them, not a count.
    expect(WHEEL_BOLT_DRAFT_CONTENT.measurementScreens).toHaveLength(8)
    for (const n of WHEEL_BOLT_DRAFT_CONTENT.measurementScreens) {
      expect(blocker?.blockingElement).toContain(`Screen ${n}`)
    }
  })

  // FAILS IF: a Workflow with every dependency satisfied is blocked anyway. A
  // gate that blocks everything is as broken as one that blocks nothing.
  it('passes a Workflow whose dependencies are all enabled', () => {
    const registered = registerPublishChecks(createPublishCheckRegister(), capabilityDependencyCheck)
    if (!registered.ok) throw new Error('unreachable')
    const evaluation = evaluatePublish(registered.register, {
      workflowName: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
      register: CAPABILITY_REGISTER,
      screens: [{ screenId: 'Screen 4', requires: 'CAP-TOLERANCE' as AtomicCapabilityId }],
    })
    expect(evaluation.passed).toContain('capability-dependency')
    expect(evaluation.blockers.map((b) => b.checkId)).not.toContain('capability-dependency')
  })

  // FAILS IF: an unreadable registry is treated as a pass. FB-STU-07's
  // terminal safe state blocks publication, because publishing content whose
  // dependencies cannot be verified puts unverifiable content on the floor.
  it('blocks when the capability state cannot be resolved at all', () => {
    const registered = registerPublishChecks(createPublishCheckRegister(), capabilityDependencyCheck)
    if (!registered.ok) throw new Error('unreachable')
    const unresolvable = {
      ...CAPABILITY_REGISTER,
      rows: CAPABILITY_REGISTER.rows.map((r) =>
        r.id === 'CAP-TOLERANCE' ? { ...r, enablement: 'unresolvable' as const } : r,
      ),
    }
    const evaluation = evaluatePublish(registered.register, {
      workflowName: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
      register: unresolvable,
      screens: [{ screenId: 'Screen 4', requires: 'CAP-TOLERANCE' as AtomicCapabilityId }],
    })
    const blocker = evaluation.blockers.find((b) => b.checkId === 'capability-dependency')
    expect(blocker?.kind).toBe('cannot-run')
  })
})

/* ==================================================================== *
 * 9. THE WRITE PATH — AUDIT AFTER REFUSALS, BEFORE MUTATION
 * ==================================================================== */

describe('L31666 — every enablement change writes to the audit log with the decision', () => {
  /**
   * A row whose Quality Manager cell PERMITS the act. It does not exist in
   * the source today -- `DEC-CAPAUTH-001` is why -- and that is exactly why
   * the test supplies it: the audit-before-mutation ordering must be proved
   * on a path that actually mutates, or the contract is demonstrated where
   * it costs nothing (defect shape 3). The real matrix's own refusal is
   * asserted separately, two tests below.
   */
  const PERMITTING_ROW = {
    ...charterRow('enable-a-capability'),
    cells: {
      ...charterRow('enable-a-capability').cells,
      'quality-manager': {
        ...charterRow('enable-a-capability').cells['quality-manager'],
        outcome: 'allowed' as const,
        note: 'Fixture: the cell DEC-CAPAUTH-001 would produce under option (a)',
      },
    },
  }

  function write(over: Record<string, unknown> = {}) {
    return {
      register: CAPABILITY_REGISTER,
      capability: 'CAP-TOLERANCE' as AtomicCapabilityId,
      to: 'disabled' as const,
      row: PERMITTING_ROW,
      ...personaIdentity('quality-manager'),
      commercialTier: 'Enterprise' as const,
      identityLayer: 'reachable' as const,
      state: STU01_SEED_STATE,
      online: true,
      ...over,
    }
  }

  // FAILS IF: the mutation stops happening on the permitted path. Without
  // this the test below cannot prove anything: an audit gate in front of a
  // handler that never mutates costs nothing to satisfy.
  it('mutates the register when the audit write succeeds', () => {
    const sink = recordingAudit()
    const result = setCapabilityEnablement(write(), sink.write)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(capabilityById(result.register.rows, 'CAP-TOLERANCE')?.enablement).toBe('disabled')
    // Observable, and observably different from where it started.
    expect(capabilityById(CAPABILITY_REGISTER.rows, 'CAP-TOLERANCE')?.enablement).toBe('enabled')
    expect(sink.written).toHaveLength(1)
    expect(sink.written[0]).toMatchObject({ action: 'enable', identityId: 'IDN-STU-QM' })
  })

  // FAILS IF: the audit write moves after the mutation, or its failure is
  // ignored. FB-STU-10 (L31454): "Action does not happen; state unchanged."
  it('mutates nothing when the audit write fails', () => {
    const result = setCapabilityEnablement(write(), FAILING_AUDIT)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.audit).toBe('failed')
    expect(capabilityById(result.register.rows, 'CAP-TOLERANCE')?.enablement).toBe('enabled')
    expect(result.reason).toMatch(/was not performed/i)
  })

  // FAILS IF: a throwing sink is allowed to escape the write path.
  it('mutates nothing when the audit sink throws', () => {
    const result = setCapabilityEnablement(write(), THROWING_AUDIT)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(capabilityById(result.register.rows, 'CAP-TOLERANCE')?.enablement).toBe('enabled')
  })

  // FAILS IF: the domain refusal moves after the audit write. A refused
  // request must not produce an "enablement changed" audit entry.
  it('refuses on the real matrix before it ever reaches the audit sink', () => {
    const sink = recordingAudit()
    const { row: _fixtureRow, ...production } = write()
    void _fixtureRow
    const result = setCapabilityEnablement(production, sink.write)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.refusedBy).toBe('access')
    // The refusal IS audited (L34657), and it is audited AS a refusal.
    expect(sink.written).toHaveLength(1)
    expect(sink.written[0]?.outcome).toBe('clientDecisionRequired')
    expect(capabilityById(result.register.rows, 'CAP-TOLERANCE')?.enablement).toBe('enabled')
  })

  // FAILS IF: the service and the screen stop reading the same resolved row.
  // The transcription keeps the source's cell; the resolution is applied in
  // one place, and BOTH the affordance and the write path read it. If the
  // service kept the permitting transcription, a crafted request would
  // succeed exactly where the screen refuses.
  it('resolves the enablement-authority conflict once, for the screen and the service alike', () => {
    expect(charterRow('enable-a-capability').cells['quality-manager'].outcome).toBe(
      'allowedWithConditions',
    )
    expect(enablementRow().cells['quality-manager'].outcome).toBe('clientDecisionRequired')
    expect(enablementRow().cells['quality-manager'].openDecision).toBe('DEC-CAPAUTH-001')
    // The transcribed wording travels forward rather than being overwritten.
    expect(enablementRow().cells['quality-manager'].note).toContain(
      'Allowed with conditions — within entitlement, audited',
    )
    // Prohibited cells are untouched by the resolution.
    expect(enablementRow().cells['worker'].outcome).toBe('explicitlyProhibited')
  })

  // FAILS IF: a capability outside entitlement can be switched on.
  // TEST-STU-007 (L30788) — refused, and the refusal audited.
  it('refuses a capability outside the tenant’s entitlement, and audits the refusal', () => {
    const sink = recordingAudit()
    const result = setCapabilityEnablement(
      write({ capability: 'CAP-EQUIPMENT-SIGNAL', to: 'enabled' }),
      sink.write,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.refusedBy).toBe('entitlement')
    expect(result.reason).toContain(NOT_ENTITLED_REASON)
    expect(sink.written).toHaveLength(1)
    expect(sink.written[0]?.outcome).toBe('unavailable')
  })

  // FAILS IF: the register handed in is mutated in place. Every reader takes
  // its register as a parameter and gets a new one back.
  it('never mutates the register it was handed', () => {
    setCapabilityEnablement(write(), recordingAudit().write)
    expect(capabilityById(CAPABILITY_REGISTER.rows, 'CAP-TOLERANCE')?.enablement).toBe('enabled')
  })
})

/* ==================================================================== *
 * 10. SCOPE IS ENFORCED IN THE READ
 * ==================================================================== */

describe('L31668 — tenant isolation, enforced in what the screen READS', () => {
  // FAILS IF: the reader stops filtering by tenant. A screen that draws only
  // its own tenant's rows but READS another tenant's register has already
  // crossed the boundary -- defect shape 7.
  it('reads no capability row belonging to another tenant', () => {
    const registers = [CAPABILITY_REGISTER, OTHER_REGISTER]
    const mine = capabilitiesForTenant(registers, STU01_TENANT)
    expect(mine).toHaveLength(6)
    const theirs = capabilitiesForTenant(registers, OTHER_TENANT)
    expect(theirs).toHaveLength(6)
    expect(capabilitiesForTenant(registers, tenantId('TEN-NOBODY'))).toHaveLength(0)
  })

  // FAILS IF: a request naming another tenant's register is served. L31668:
  // "a request naming another tenant's capability enablement is refused and
  // audited."
  it('refuses a write whose register belongs to a tenant the actor is not in', () => {
    const sink = recordingAudit()
    const result = setCapabilityEnablement(
      {
        register: OTHER_REGISTER,
        capability: 'CAP-TOLERANCE',
        to: 'disabled',
        row: charterRow('enable-a-capability'),
        ...personaIdentity('quality-manager'),
        commercialTier: 'Enterprise',
        identityLayer: 'reachable',
        state: OTHER_TENANT_STATE,
        online: true,
      },
      sink.write,
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.refusedBy).toBe('tenant-isolation')
  })
})

/* ==================================================================== *
 * 11. THE CHARTER'S OWN CLAIMS
 * ==================================================================== */

describe('the charter statements, and where each one is sourced', () => {
  // FAILS IF: a statement loses its locator, or a claim is added without one.
  it('carries a frozen-source locator on every claim it renders', () => {
    expect(CHARTER_STATEMENTS.length).toBeGreaterThanOrEqual(10)
    for (const statement of CHARTER_STATEMENTS) {
      expect(statement.sourceRef).toMatch(/L\d{4,6}/)
      expect(statement.text.length).toBeGreaterThan(20)
    }
  })

  // FAILS IF: the purpose or the user benefit is reworded.
  it('states the purpose and the user benefit in the source’s own words', () => {
    expect(charterStatement('purpose')).toMatchObject({
      text: 'Establish and enforce the Studio’s authority boundary: enable, configure, compose; never define',
      sourceRef: 'L31565',
    })
    expect(charterStatement('user-benefit').text).toBe(
      'A tenant can never accidentally create a safety-critical capability that has no evaluation scenarios behind it, and can always see why a control does not exist',
    )
  })

  // FAILS IF: a statement stops rendering. A claim held in data and never
  // drawn is a code comment, and a code comment is not a disclosure.
  it('renders every statement it holds, on the route that claims them', () => {
    const html = renderView('quality-manager')
    expect(CHARTER_STATEMENTS.length).toBeGreaterThan(0)
    for (const statement of CHARTER_STATEMENTS) {
      expect(html).toContain(statement.text)
      expect(html).toContain(statement.sourceRef)
    }
  })

  // FAILS IF: the states claim gains a lifecycle. L31589 is explicit that the
  // charter has none, and a state machine drawn here would contradict it.
  it('claims no lifecycle, because the charter has none', () => {
    expect(charterStatement('states').text).toBe(
      'Not applicable — the charter is a standing constraint and has no lifecycle.',
    )
    expect(charterStatement('objects').text).toMatch(/No persisted business object/)
  })

  // FAILS IF: the third notification row gains a recipient or a channel. The
  // source states three triggers and deliberately makes the third NOT a
  // notification (L31664): "a refusal is audited, not notified; notifying
  // every refusal would train users to ignore notifications." The two real
  // rows are asserted too, so this cannot pass by rendering no table at all.
  it('renders the two notification rows and leaves the third deliberately un-notified', () => {
    const html = renderView('quality-manager')
    expect(html).toContain('A capability a published Workflow depends on is disabled')
    expect(html).toContain('In-app and email')
    expect(html).toContain('A newly registered capability becomes available within entitlement')

    expect(html).toContain('A request to define a foundation object is refused')

    // Read the refusal ROW, not the whole page: a distance-bounded regex over
    // the page went GREEN when the defect was planted, because the recipient
    // cell is longer than the bound. Found by planting it.
    const refusalRow =
      html.match(/A request to define a foundation object is refused[\s\S]*?<\/tr>/)?.[0] ?? ''
    expect(refusalRow.length).toBeGreaterThan(0)
    expect(refusalRow).not.toMatch(/in-app|email/i)
    // Both the recipient cell and the channel cell say the same thing: this
    // trigger is audited, not notified.
    expect((refusalRow.match(/Not applicable/g) ?? []).length).toBe(2)
    expect(refusalRow).toContain(
      'Not applicable — a refusal is audited, not notified; notifying every refusal would train users to ignore notifications',
    )
  })

  // FAILS IF: this route starts printing a Studio module count. AC-STU-014
  // (L30992) binds this build's own screens: the count renders in exactly one
  // scoped element on the module index, with its qualifier, and nowhere else.
  it('prints no Studio module count on this route (AC-STU-014)', () => {
    const html = readAllBuiltStudioRoutes().join('')
    expect(html.length).toBeGreaterThan(0)
    expect(html).not.toMatch(/\beighteen\b/i)
    expect(html).not.toMatch(/(?<![\w-])\d{1,3}\s+modules?\b/i)
    expect(html).not.toContain('data-count-scope')
  })
})

/* ==================================================================== *
 * 12. STANDING CONSTRAINTS
 * ==================================================================== */

describe('the standing constraints this module must not break', () => {
  const FILES = [
    'src/studio/modules/stu-01/matrix.ts',
    'src/studio/modules/stu-01/capabilities.ts',
    'src/studio/modules/stu-01/charter.ts',
    'src/studio/modules/stu-01/service.ts',
    'src/studio/modules/stu-01/AtomicCapabilitiesView.tsx',
    'src/studio/modules/stu-01/NotAvailableLine.tsx',
    'app/studio/capabilities/page.tsx',
    'app/studio/capabilities/CapabilitiesScreen.tsx',
  ]

  function stripComments(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
  }

  // FAILS IF: a file is added to the module and not listed here, so the
  // sweeps below cannot silently stop covering it.
  it('covers every file this task ships', () => {
    expect(FILES.length).toBe(8)
    for (const file of FILES) expect(existsSync(file)).toBe(true)
  })

  // FAILS IF: a clock or a random source is introduced. Determinism.
  it('reads no clock and no random source', () => {
    for (const file of FILES) {
      const body = stripComments(readFileSync(file, 'utf8'))
      expect(body).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  // FAILS IF: policy is moved under `src/ui/`. Nothing here lives there, and
  // nothing here takes a VALUE from there that decides anything.
  it('puts no policy under src/ui/ and imports only presentation from it', () => {
    for (const file of FILES) {
      const body = stripComments(readFileSync(file, 'utf8'))
      expect(body).not.toMatch(/from '@\/ui\/(?!primitives|sa\/|screen-state|ScreenStateBoundary)/)
    }
  })

  // FAILS IF: the module route stops wrapping the Studio shell, or starts
  // keying itself on a screen id rather than the module slug (D1).
  it('wraps the Studio shell and is keyed on the module slug', () => {
    const page = readFileSync('app/studio/capabilities/page.tsx', 'utf8')
    const screen = readFileSync('app/studio/capabilities/CapabilitiesScreen.tsx', 'utf8')
    expect(screen).toMatch(/<StudioShell module=\{MODULE\}/)
    expect(page).toMatch(/stuModuleById\(STU_MODULES, 'MOD-STU-01'\)/)
    expect(screen).toMatch(/stuModuleById\(STU_MODULES, 'MOD-STU-01'\)/)
    // The screen id is an annotation, never a route key (D1): none is passed.
    expect(screen).not.toMatch(/screenId=/)
  })

  // FAILS IF: an exported vocabulary loses its exhaustiveness check. The
  // annotation form widens the const and makes the check vacuous.
  it('closes every vocabulary with a real exhaustiveness check', () => {
    const matrix = readFileSync('src/studio/modules/stu-01/matrix.ts', 'utf8')
    const capabilities = readFileSync('src/studio/modules/stu-01/capabilities.ts', 'utf8')
    const checks = [...matrix.matchAll(/extends never \? true : never/g)].length
    const capChecks = [...capabilities.matchAll(/extends never \? true : never/g)].length
    expect(checks).toBeGreaterThanOrEqual(3)
    expect(capChecks).toBeGreaterThanOrEqual(2)
    expect(matrix).not.toMatch(/export const (CHARTER_ACTIONS|AUTHORITY_TIERS|TIER_ACTIONS): readonly/)
  })

  // FAILS IF: the render becomes non-deterministic. Two renders of the same
  // inputs are byte-identical, ignoring React's per-render useId counter.
  it('renders deterministically', () => {
    const strip = (h: string) => h.replace(/(«|_)r[0-9a-z]+(»|_)/g, 'ID')
    expect(strip(renderView('quality-manager'))).toBe(strip(renderView('quality-manager')))
  })

  // FAILS IF: a persona identity is invented rather than derived from the
  // eight columns. All eight resolve, and each names the grant that opens it.
  it('derives an identity for each of the eight persona columns', () => {
    expect(STUDIO_PERSONA_COLUMNS).toHaveLength(8)
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const seeded = personaIdentity(persona)
      expect(seeded.identity.signedIn).toBe(true)
      expect(seeded.identity.roles.length).toBeGreaterThan(0)
    }
    expect(personaIdentity('supervisor-with-authoring-grant').grants['GRANT-STU-AUTHOR']).toBe(
      'Active',
    )
    expect(personaIdentity('supervisor-without-grant').grants['GRANT-STU-AUTHOR']).toBeUndefined()
    expect(personaIdentity('implementation-team').grants['GRANT-STU-IMPL']).toBe('Active')
  })

  // FAILS IF: a statement id is minted without a record, or a record without
  // an id. Asserted against the DECLARED id list, not against the records'
  // own ids — comparing the records to themselves would pass on a record
  // that was deleted.
  it('resolves every charter statement id it declares', () => {
    expect(CHARTER_STATEMENT_IDS.length).toBeGreaterThan(0)
    expect(CHARTER_STATEMENTS.map((s) => s.id)).toEqual([...CHARTER_STATEMENT_IDS])
    expect(new Set(CHARTER_STATEMENT_IDS).size).toBe(CHARTER_STATEMENT_IDS.length)
    for (const id of CHARTER_STATEMENT_IDS) expect(charterStatement(id).id).toBe(id)
  })

  // FAILS IF: an action loses its row. `charterRow` is total over the four.
  it('resolves every charter action to a row', () => {
    expect(CHARTER_ACTIONS.length).toBe(4)
    for (const action of CHARTER_ACTIONS) {
      expect(charterRow(action as CharterAction).action).toBe(action)
    }
  })
})

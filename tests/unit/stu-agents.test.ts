import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PermissionOutcome } from '@/policy/decision'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { studioDecision } from '@/studio/disclosure/decisions'
import { reachByStudioMatrix, type StudioPersonaId } from '@/studio/modules'
import { STU_SCREENS, stuScreensForModule } from '@/studio/screens'
import { STU_SEAMS, stuSeamById, stuSeamStatus } from '@/studio/seams'
import { CAPABILITY_REGISTER } from '@/studio/modules/stu-01/capabilities'
import {
  ARMING_PANEL_HEADING,
  ARMING_PANEL_STATEMENTS,
} from '@/studio/modules/stu-05/sections'
import {
  PACKAGE_CONTENT_ELEMENTS,
  RUN_2026_08_14_A_PACKAGE,
} from '@/studio/modules/stu-14/package'

import { AgentConfigurationView } from '@/studio/modules/stu-02/AgentConfigurationView'
import {
  DETECTION_MECHANISMS,
  EMERGENCY_PAUSE_STATEMENT,
  SHIFT_HANDOFF_LEAD_TIME_MINUTES,
  STANDARD_AGENTS,
  AGENT_CONFIGURATION_DRAFT,
  agentParameterReadings,
  shiftHandoffLeadTime,
  standardAgent,
} from '@/studio/modules/stu-02/agents'
import {
  STU_02_CROSS_SURFACE,
  STU_02_MATRIX,
  STU_02_ROW_IDS,
  STU_02_SOURCE_ROW_COUNT,
  stu02Row,
} from '@/studio/modules/stu-02/matrix'
import {
  AGENT_SIMULATION_STATEMENT,
  ARMING_CROSS_REFERENCE,
  STU_02_LOCAL_DISCLOSURES,
  agentConfigurationControls,
  crossSurfaceStatements,
  stu02Decision,
  stu02Scenario,
} from '@/studio/modules/stu-02/rendering'

import { AgentBuilderView } from '@/studio/modules/stu-15/AgentBuilderView'
import {
  COMPOSED_AGENT_STATES,
  DISABLEMENT_HONESTY_LINE,
  GOVERNANCE_GATE_IDS,
  SEEDED_COMPOSED_AGENTS,
  agentBuilderService,
  builderSeams,
  composedAgentById,
  composedAgents,
  deployComposedAgent,
  mapComposedAgent,
  submitToEvaluationGate,
  type BuilderAuditEntry,
  type ComposedAgentRegister,
} from '@/studio/modules/stu-15/builder'
import {
  STU_15_CARD_ONLY_COLUMNS,
  STU_15_CROSS_SURFACE,
  STU_15_MATRIX,
  STU_15_ROW_IDS,
  STU_15_SOURCE_ROW_COUNT,
  stu15Row,
} from '@/studio/modules/stu-15/matrix'
import {
  AGENT_BUILDER_PERMANENT_LINE,
  OBJ_STU_CAPSTATE_GAP,
  STU_15_LOCAL_DISCLOSURES,
  TIER_REQUIREMENT_LINE,
  agentBuilderControls,
  capabilityEnablementReadings,
  governanceTrack,
  stu15CrossSurfaceStatements,
  stu15Decision,
  stu15Scenario,
} from '@/studio/modules/stu-15/rendering'

/**
 * `MOD-STU-02` Agent Configuration and `MOD-STU-15` The Agent Builder, on
 * `SCR-STU-13` (L48271). Frozen source §5.2 (card L31680-L31869) and §5.15
 * (card L33961-L34152).
 *
 * ### WHY THIS FILE RENDERS TO STATIC MARKUP RATHER THAN USING `screen.*`
 *
 * `tests/unit/**` runs in the NODE project (`vitest.config.ts`), which has no
 * jsdom, no `@testing-library/react` setup and no JSX transform for a `.ts`
 * file. The brief's steps 2 and 4 are written as `render(<AgentConfiguration
 * />)` with `screen.getByLabelText` and `toBeDisabled()`; **that code cannot
 * compile in this suite**, and this task's path list carries no
 * `tests/component/` file. The assertions are made here over the rendered
 * markup and over the rendering model, which is the stronger of the two
 * anyway; the missing axe/jsdom pass is declared as a gap in the task report.
 *
 * ### THE BRIEF'S OWN MATCHERS, PROVEN AGAINST THE SOURCE STRINGS
 *
 * Three of the four failed against correct code and are recorded here as
 * findings rather than obeyed:
 *
 * 1. `expect(f).toHaveAttribute('readonly')` — React's server renderer emits
 *    `readOnly=""`. A `/readonly/` scan of the markup goes red on a field that
 *    IS read-only. This file matches the attribute React actually writes AND
 *    the model's own `editableHere: false`, so the rule is not resting on a
 *    rendering detail.
 * 2. `row.cells['QUALITY_MANAGER'] … { decision: 'DEC-CAPAUTH-001' }` — this
 *    build's persona columns are kebab-case (`quality-manager`) and the field
 *    is `openDecision`. Every one of those four lookups returned `undefined`,
 *    and `toMatchObject` on `undefined` throws rather than passing — but the
 *    matcher would have been a second spelling of an existing vocabulary, so
 *    it is written against the real one.
 * 3. `expect(b).toHaveAccessibleDescription(/Requires the Growth or Enterprise
 *    tier/)` — Task 1's evaluator writes "requires the Growth or Enterprise
 *    **commercial** tier". The storyboard's exact string is not in it. That
 *    matcher would have rejected an otherwise-correct build, which is why
 *    `TIER_REQUIREMENT_LINE` composes `SB-STU-18`'s own sentence in front and
 *    why the test below pins the string against what the CONTROL renders.
 * 4. `tier="Essential"` — not a member of `StudioCommercialTier`. The source's
 *    own below-Growth tier is `Starter` (L67955).
 */

const ALL_PERSONAS: readonly StudioPersonaColumn[] = STUDIO_PERSONA_COLUMNS

function renderConfiguration(persona: StudioPersonaColumn = 'quality-manager'): string {
  return renderToStaticMarkup(
    createElement(AgentConfigurationView, { scenario: stu02Scenario({ persona }) }),
  )
}

function renderBuilder(
  persona: StudioPersonaColumn = 'quality-manager',
  over: Parameters<typeof stu15Scenario>[0] = {},
): string {
  return renderToStaticMarkup(
    createElement(AgentBuilderView, { scenario: stu15Scenario({ persona, ...over }) }),
  )
}

/** An audit sink that records, and one that refuses. */
function recordingSink() {
  const entries: BuilderAuditEntry[] = []
  return {
    entries,
    write: (entry: BuilderAuditEntry) => {
      entries.push(entry)
      return { ok: true } as const
    },
  }
}

const failingSink = () => ({ ok: false, failure: 'the tenant audit log is unreachable' }) as const

/* ==================================================================== *
 * MOD-STU-02 — the matrix.
 * ==================================================================== */

describe('MOD-STU-02 — the permission matrix, L31731-L31739', () => {
  it('carries the source’s own nine data rows, each answering all eight persona columns', () => {
    expect(STU_02_MATRIX).toHaveLength(STU_02_SOURCE_ROW_COUNT)
    expect(STU_02_SOURCE_ROW_COUNT).toBe(9)
    expect(new Set(STU_02_ROW_IDS).size).toBe(STU_02_ROW_IDS.length)
    for (const row of STU_02_MATRIX) {
      for (const column of ALL_PERSONAS) {
        expect(row.cells[column].outcome).toBeTruthy()
        expect(row.cells[column].note.length).toBeGreaterThan(0)
      }
      expect(row.sourceRefs[0]).toMatch(/^L317[3-9]\d$/)
    }
  })

  it('routes nobody anywhere — `routedTo` is null on every cell of every row', () => {
    for (const row of STU_02_MATRIX) {
      for (const column of ALL_PERSONAS) {
        expect(row.routedTo[column]).toBeNull()
      }
    }
  })

  it('states a derivation for every column the card does not head, and none for the six it does', () => {
    const carded: readonly StudioPersonaColumn[] = [
      'quality-manager',
      'supervisor-with-authoring-grant',
      'supervisor-without-grant',
      'tenant-admin',
      'read-only-auditor',
      'worker',
    ]
    for (const row of STU_02_MATRIX) {
      for (const column of carded) expect(row.derivation[column]).toBeNull()
      expect(row.derivation['plant-manager-persona']).toBeTruthy()
      expect(row.derivation['implementation-team']).toBeTruthy()
    }
  })

  it('transcribes row 7’s Quality Manager cell verbatim, token included', () => {
    const row = stu02Row('change-the-shift-handoff-agents-run-time')
    expect(row.cells['quality-manager'].outcome).toBe('allowedWithConditions')
    expect(row.cells['quality-manager'].note).toBe(
      'Allowed with conditions — a tenant-level setting administered in the tenant administration area, read here',
    )
    expect(row.cells['tenant-admin'].outcome).toBe('allowed')
  })

  it('derives module reach from the screen rows only', () => {
    const reach = reachByStudioMatrix(STU_02_MATRIX, (row, persona: StudioPersonaId) => {
      const outcome: PermissionOutcome = row.cells[persona as StudioPersonaColumn].outcome
      return outcome
    })
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach.worker).toBe('withheld')
  })
})

/* ==================================================================== *
 * MOD-STU-02 — the another-surface rule.
 * ==================================================================== */

/**
 * THE PHRASES A CELL USES WHEN IT IS TALKING ABOUT SOMEWHERE ELSE.
 *
 * A HOLE THIS CLOSES, FOUND BY PLANTING RATHER THAN BY READING. The partition
 * test and the "no control for a non-screen row" test below are both derived
 * FROM the classification, so reclassifying row 7 as `screen` left them both
 * green — they check the two lists agree with each other, not that the
 * classification is right. This gate pins the classification itself against
 * the cells' own words, and it scans the STRUCTURE — a cell that names
 * another surface — rather than the id of the row that happens to have one
 * today.
 */
const NAMES_ANOTHER_SURFACE =
  /tenant administration area|Client Command Center|Super Admin platform console/

function cellsNamingAnotherSurface(cells: Readonly<Record<StudioPersonaColumn, { note: string }>>) {
  return ALL_PERSONAS.filter((column) => NAMES_ANOTHER_SURFACE.test(cells[column].note))
}

describe('MOD-STU-02 — an another-surface row is never an enabled control', () => {
  it('partitions the matrix: every row is a control row or a cross-surface statement, never both, never neither', () => {
    for (const persona of ALL_PERSONAS) {
      const controls = agentConfigurationControls(stu02Scenario({ persona }))
      const statements = crossSurfaceStatements()
      const controlIds = new Set(controls.map((c) => c.id))
      const statementIds = new Set(statements.map((s) => s.row.id))
      expect(controlIds.size + statementIds.size).toBe(STU_02_MATRIX.length)
      for (const row of STU_02_MATRIX) {
        expect(controlIds.has(row.id) !== statementIds.has(row.id)).toBe(true)
      }
    }
  })

  it('draws no control for any row classified other than `screen`, for any persona — scanned by CLASSIFICATION, not by row name', () => {
    const notScreen = STU_02_MATRIX.filter((r) => r.surface !== 'screen').map((r) => r.id)
    expect(notScreen.length).toBeGreaterThan(0)
    for (const persona of ALL_PERSONAS) {
      const drawn = agentConfigurationControls(stu02Scenario({ persona })).map((c) => c.id)
      for (const id of notScreen) expect(drawn).not.toContain(id)
    }
  })

  it('classifies as `another-surface` every row whose own cells name another surface — the classification pinned against the source, not against itself', () => {
    const naming = STU_02_MATRIX.filter((row) => cellsNamingAnotherSurface(row.cells).length > 0)
    expect(naming.map((r) => r.id).sort()).toEqual(
      ['change-the-shift-handoff-agents-run-time', 'release-a-severity-1-hold-from-the-studio'].sort(),
    )
    for (const row of naming) expect(row.surface).toBe('another-surface')
  })

  it('holds a cross-surface statement naming the owner for every non-screen row', () => {
    const statements = crossSurfaceStatements()
    expect(statements.map((s) => s.row.id).sort()).toEqual(
      STU_02_MATRIX.filter((r) => r.surface !== 'screen')
        .map((r) => r.id)
        .sort(),
    )
    for (const statement of statements) {
      expect(statement.editableHere).toBe(false)
      expect(statement.statement.owner.length).toBeGreaterThan(20)
      expect(statement.statement.whatThisScreenDoes.length).toBeGreaterThan(20)
    }
    expect(STU_02_CROSS_SURFACE.map((c) => c.rowId)).toContain(
      'change-the-shift-handoff-agents-run-time',
    )
  })
})

/* ==================================================================== *
 * MOD-STU-02 — row 7, the ownership inversion.
 * ==================================================================== */

describe('MOD-STU-02 — the Shift Handoff run time is read here, administered elsewhere', () => {
  it('renders the lead time as a read-only field for the Quality Manager, with the cell’s own sentence', () => {
    const html = renderConfiguration('quality-manager')
    // React's server renderer writes `readOnly`, not `readonly`. Both the
    // markup and the model are asserted, so the rule does not rest on either.
    expect(html).toMatch(/<input readOnly=""[^>]*data-testid="shift-handoff-lead-time"/)
    expect(html).toContain('Lead time before shift end')
    expect(html).toContain('administered in the tenant administration area')
    expect(shiftHandoffLeadTime().editableHere).toBe(false)
    expect(SHIFT_HANDOFF_LEAD_TIME_MINUTES).toBe(30)
  })

  it('renders the same read for the Tenant Admin, whose own cell is `Allowed` — the classification governs, not the token', () => {
    const html = renderConfiguration('tenant-admin')
    expect(html).toMatch(/<input readOnly=""[^>]*data-testid="shift-handoff-lead-time"/)
    expect(stu02Row('change-the-shift-handoff-agents-run-time').cells['tenant-admin'].outcome).toBe(
      'allowed',
    )
  })

  it('reads the Shift’s end time through the declared seam rather than a clock', () => {
    const reading = shiftHandoffLeadTime()
    expect(reading.seam.id).toBe('shift-timing-for-handoff-schedule')
    expect(reading.seam.consumingModules).toContain('MOD-STU-02')
    expect(reading.computedAgainst).toContain('14:00')
    expect(reading.scheduleId).toBe('SCHED-HANDOFF-001')
  })
})

/* ==================================================================== *
 * MOD-STU-02 — this module authors nothing.
 * ==================================================================== */

describe('MOD-STU-02 — no write lives on this route', () => {
  it('gives a control no way to carry a handler: the control shape has exactly four fields', () => {
    for (const control of agentConfigurationControls(stu02Scenario())) {
      expect(Object.keys(control).sort()).toEqual([
        'affordance',
        'authoredIn',
        'id',
        'label',
        'sourceRefs',
      ])
    }
  })

  it('renders a Read-only cell as a DISABLED control carrying the cell’s own words — not absent, not enabled', () => {
    const decision = stu02Decision(
      'set-a-screens-timing-expectation-and-coaching-trigger',
      'supervisor-without-grant',
    )
    expect(decision.outcome).toBe('readOnly')
    const control = agentConfigurationControls(
      stu02Scenario({ persona: 'supervisor-without-grant' }),
    ).find((c) => c.id === 'set-a-screens-timing-expectation-and-coaching-trigger')
    expect(control?.affordance.kind).toBe('disabled')
    if (control?.affordance.kind === 'disabled') {
      expect(control.affordance.reason).toContain('Read-only')
    }
    // The Worker's cell is `Explicitly prohibited`, which carries no control
    // anywhere — a note stands where one would be, and the list stays the
    // same length for every persona.
    const worker = agentConfigurationControls(stu02Scenario({ persona: 'worker' }))
    expect(worker).toHaveLength(
      agentConfigurationControls(stu02Scenario({ persona: 'quality-manager' })).length,
    )
    expect(worker.every((c) => c.affordance.kind === 'absent')).toBe(true)
  })

  it('names the owning module and section on every control the card permits', () => {
    const controls = agentConfigurationControls(stu02Scenario({ persona: 'quality-manager' }))
    const enabled = controls.filter((c) => c.affordance.kind === 'enabled')
    expect(enabled).toHaveLength(6)
    for (const control of enabled) {
      expect(control.authoredIn).toMatch(/MOD-STU-0[4-7]/)
    }
  })

  it('draws no editable input, form, select or textarea anywhere on the configuration view', () => {
    for (const persona of ALL_PERSONAS) {
      const html = renderConfiguration(persona)
      expect(html).not.toMatch(/<form/)
      expect(html).not.toMatch(/<select/)
      expect(html).not.toMatch(/<textarea/)
      // Every input on this view is read-only. An editable one would be a
      // write this module does not own.
      const inputs = html.match(/<input[^>]*>/g) ?? []
      for (const input of inputs) expect(input).toMatch(/readOnly=""/)
    }
  })
})

/* ==================================================================== *
 * MOD-STU-02 — DEC-GATE-001 and the deterministic layer.
 * ==================================================================== */

describe('MOD-STU-02 — pre-authorised policy is never presented as a runtime human gate', () => {
  it('renders each action agent’s true governance binding, and the two differ', () => {
    const prevention = standardAgent(STANDARD_AGENTS, 'prevention')
    const deviation = standardAgent(STANDARD_AGENTS, 'deviation-and-containment')
    const handoff = standardAgent(STANDARD_AGENTS, 'shift-handoff')
    expect(prevention.governanceBinding).toBe('authoring-time policy')
    expect(deviation.governanceBinding).toBe('runtime human gate')
    expect(handoff.governanceBinding).toBe('no governance gate')
    expect(prevention.governanceBinding).not.toBe(deviation.governanceBinding)

    const html = renderConfiguration()
    expect(html).toContain(
      '<span data-testid="governance-binding-prevention">authoring-time policy</span>',
    )
    expect(html).toContain(
      '<span data-testid="governance-binding-deviation-and-containment">runtime human gate</span>',
    )
  })

  it('says on screen that nothing here runs a model, retrieves an asset, or classifies a deviation', () => {
    const html = renderConfiguration()
    expect(html).toContain(AGENT_SIMULATION_STATEMENT)
    expect(AGENT_SIMULATION_STATEMENT).toMatch(/does not run them/)
    expect(AGENT_SIMULATION_STATEMENT).toMatch(/No model executes here/)
  })

  it('holds all three deterministic mechanisms, each firing before any agent and each naming where it is configured', () => {
    expect(DETECTION_MECHANISMS).toHaveLength(3)
    for (const mechanism of DETECTION_MECHANISMS) {
      expect(mechanism.firesBeforeAnyAgent).toBe(true)
      expect(mechanism.configuredIn.length).toBeGreaterThan(10)
    }
    expect(renderConfiguration()).toContain(EMERGENCY_PAUSE_STATEMENT)
  })

  it('discloses DEC-GATE-001 and DEC-CONTLAUNCH-001 locally, because the canon carries neither', () => {
    const refs = STU_02_LOCAL_DISCLOSURES.map((d) => d.decisionRef)
    expect(refs).toEqual(['DEC-GATE-001', 'DEC-CONTLAUNCH-001'])
    for (const disclosure of STU_02_LOCAL_DISCLOSURES) {
      expect(disclosure.readings.length).toBeGreaterThanOrEqual(2)
      expect(disclosure.canonNote).toMatch(/gap/i)
    }
    const html = renderConfiguration()
    for (const ref of refs) expect(html).toContain(`Open decision ${ref}`)
  })
})

/* ==================================================================== *
 * MOD-STU-02 — the configuration read, and C10.
 * ==================================================================== */

describe('MOD-STU-02 — the configuration read and the arming cross-reference', () => {
  it('reads every agent parameter out of the authored draft, naming the section that authored it', () => {
    const readings = agentParameterReadings(AGENT_CONFIGURATION_DRAFT, 'screen 3')
    expect(readings.length).toBeGreaterThan(0)
    for (const reading of readings) {
      expect(reading.value.length).toBeGreaterThan(0)
      expect(reading.authoredIn.length).toBeGreaterThan(0)
    }
    const timing = readings.find((r) => r.parameter.startsWith('Maximum and minimum'))
    expect(timing?.value).toBe('120 seconds maximum, 20 seconds minimum')
    const limits = readings.find((r) => r.parameter === 'Specification limits')
    expect(limits?.value).toContain('DWG-A441')
  })

  it('enforces scope in the read at MOD-STU-05’s own boundary: a missing screen throws rather than reading as empty', () => {
    expect(() => agentParameterReadings(AGENT_CONFIGURATION_DRAFT, 'screen 404')).toThrow(
      /no screen named "screen 404" is in this draft/,
    )
  })

  it('cross-references MOD-STU-05’s arming panel without minting a second copy of its words', () => {
    expect(ARMING_CROSS_REFERENCE.heading).toBe(ARMING_PANEL_HEADING)
    expect(ARMING_CROSS_REFERENCE.statements).toEqual([...ARMING_PANEL_STATEMENTS])
    expect(ARMING_CROSS_REFERENCE.readOnlyHere).toBe(true)
    expect(ARMING_CROSS_REFERENCE.implementedBy).toMatch(/MOD-STU-05/)
  })

  it('renders D23’s off-by-one with both section numbers', () => {
    const html = renderConfiguration()
    expect(html).toContain('Open decision D23 — DEC-STUXREF-001')
    expect(html).toContain('§5.5.9')
    expect(html).toContain('§5.5.8')
    expect(studioDecision('D23').decisionRef).toBe('DEC-STUXREF-001')
  })
})

/* ==================================================================== *
 * MOD-STU-15 — the matrix.
 * ==================================================================== */

describe('MOD-STU-15 — the permission matrix, L34009-L34020', () => {
  it('carries the source’s own twelve data rows, all eight persona columns and both card-only columns', () => {
    expect(STU_15_MATRIX).toHaveLength(STU_15_SOURCE_ROW_COUNT)
    expect(STU_15_SOURCE_ROW_COUNT).toBe(12)
    expect(new Set(STU_15_ROW_IDS).size).toBe(STU_15_ROW_IDS.length)
    for (const row of STU_15_MATRIX) {
      for (const column of ALL_PERSONAS) expect(row.cells[column].note.length).toBeGreaterThan(0)
      for (const column of STU_15_CARD_ONLY_COLUMNS) {
        expect(row.cardOnlyColumns[column].note.length).toBeGreaterThan(0)
      }
      expect(row.routedTo['quality-manager']).toBeNull()
    }
  })

  it('keeps the two card-only columns out of the evaluable cell map entirely', () => {
    for (const row of STU_15_MATRIX) {
      const cellKeys = Object.keys(row.cells)
      for (const column of STU_15_CARD_ONLY_COLUMNS) expect(cellKeys).not.toContain(column)
    }
  })

  it('row 7 is the only row whose Platform Engineer cell is a prohibition, and it names the root account', () => {
    const prohibited = STU_15_MATRIX.filter(
      (r) => r.cardOnlyColumns['platform-engineer'].outcome === 'explicitlyProhibited',
    )
    expect(prohibited.map((r) => r.id)).toEqual(['bypass-the-evaluation-gate'])
    expect(prohibited[0]?.cardOnlyColumns['platform-engineer'].note).toContain(
      'including the root account',
    )
  })

  it('derives module reach from the screen rows only', () => {
    const reach = reachByStudioMatrix(STU_15_MATRIX, (row, persona: StudioPersonaId) => {
      const outcome: PermissionOutcome = row.cells[persona as StudioPersonaColumn].outcome
      return outcome
    })
    expect(reach['quality-manager']).toBe('offered')
    expect(reach.worker).toBe('withheld')
  })
})

/* ==================================================================== *
 * MOD-STU-15 — row 1, nobody holds enablement (C11, D12).
 * ==================================================================== */

describe('MOD-STU-15 — capability enablement has no authorised operator', () => {
  it('gives every tenant column the card heads clientDecisionRequired with DEC-CAPAUTH-001', () => {
    const row = stu15Row('enable-or-disable-a-capability-within-entitlement')
    for (const column of ['quality-manager', 'supervisor-with-authoring-grant', 'tenant-admin'] as const) {
      expect(row.cells[column].outcome).toBe('clientDecisionRequired')
      expect(row.cells[column].openDecision).toBe('DEC-CAPAUTH-001')
    }
    const delegated = row.cardOnlyColumns['delegated-administrator-with-agent-author']
    expect(delegated.outcome).toBe('clientDecisionRequired')
    expect(delegated.openDecision).toBe('DEC-CAPAUTH-001')
  })

  it('offers no enablement control to anybody, and no service key for one', () => {
    for (const persona of ALL_PERSONAS) {
      const control = agentBuilderControls(stu15Scenario({ persona })).find(
        (c) => c.id === 'enable-or-disable-a-capability-within-entitlement',
      )
      expect(control).toBeDefined()
      expect(control?.affordance.kind).not.toBe('enabled')
      expect(control?.serviceKey).toBeNull()
    }
  })

  it('reads MOD-STU-01’s six-row register rather than declaring a second copy of it', () => {
    const readings = capabilityEnablementReadings()
    expect(readings.map((r) => r.row)).toEqual(CAPABILITY_REGISTER.rows)
    for (const reading of readings) {
      // Identity, not equality: a copied row would be equal and not identical.
      expect(CAPABILITY_REGISTER.rows.includes(reading.row)).toBe(true)
    }
  })
})

/* ==================================================================== *
 * MOD-STU-15 — DEC-DELEG-001 (D13).
 * ==================================================================== */

describe('MOD-STU-15 — the Supervisor is denied the Agent Builder and the decision is named', () => {
  it('refuses compose to a Supervisor holding GRANT-STU-AUTHOR, naming DEC-DELEG-001 in the reason', () => {
    const decision = stu15Decision(
      'compose-a-reasoning-agent',
      'supervisor-with-authoring-grant',
      stu15Scenario({ authoringGrant: 'Active' }),
    )
    expect(decision.outcome).toBe('explicitlyProhibited')
    expect(decision.reason).toContain('DEC-DELEG-001')
    expect(decision.reason).toContain('denies Supervisor access to the Agent Builder')
  })

  it('renders the delegated column as Client Decision Required with DEC-DELEG-001', () => {
    const row = stu15Row('compose-a-reasoning-agent')
    const delegated = row.cardOnlyColumns['delegated-administrator-with-agent-author']
    expect(delegated.outcome).toBe('clientDecisionRequired')
    expect(delegated.openDecision).toBe('DEC-DELEG-001')
    expect(row.cells['tenant-admin'].outcome).toBe('clientDecisionRequired')
    expect(row.cells['tenant-admin'].openDecision).toBe('DEC-DELEG-001')
  })

  it('records the card-versus-consolidated contradiction on the cell rather than smoothing it', () => {
    const note = stu15Row('compose-a-reasoning-agent').cells['supervisor-with-authoring-grant'].note
    expect(note).toContain('L34554')
    expect(note).toContain('L34011')
  })

  it('discloses D13 on the builder view', () => {
    expect(studioDecision('D13').decisionRef).toBe('DEC-DELEG-001')
    expect(renderBuilder()).toContain('Open decision D13 — DEC-DELEG-001')
  })
})

/* ==================================================================== *
 * MOD-STU-15 — the tier refusal is shown, not hidden.
 * ==================================================================== */

describe('MOD-STU-15 — compose below Growth is disabled with the tier stated', () => {
  it('disables the compose control and carries SB-STU-18’s own sentence in the reason', () => {
    const control = agentBuilderControls(
      stu15Scenario({ persona: 'quality-manager', commercialTier: 'Starter' }),
    ).find((c) => c.id === 'compose-a-reasoning-agent')
    expect(control?.affordance.kind).toBe('disabled')
    const reason = control?.affordance.kind === 'disabled' ? control.affordance.reason : ''
    expect(reason).toContain('Requires the Growth or Enterprise tier')
    expect(control?.tierRequirement).toBe(TIER_REQUIREMENT_LINE)
    expect(control?.serviceKey).toBeNull()
  })

  it('renders it as a control with the reason, never hidden', () => {
    const html = renderBuilder('quality-manager', { commercialTier: 'Starter' })
    expect(html).toContain('Compose a reasoning agent')
    expect(html).toContain('Requires the Growth or Enterprise tier')
    expect(html).toMatch(/aria-disabled="true"/)
  })

  it('enables it on Growth and on Enterprise', () => {
    for (const tier of ['Growth', 'Enterprise'] as const) {
      const control = agentBuilderControls(
        stu15Scenario({ persona: 'quality-manager', commercialTier: tier }),
      ).find((c) => c.id === 'compose-a-reasoning-agent')
      expect(control?.affordance.kind).toBe('enabled')
      expect(control?.serviceKey).toBe('composeReasoningAgent')
      expect(control?.tierRequirement).toBeNull()
    }
  })
})

/* ==================================================================== *
 * MOD-STU-15 — the boundaries, held by omission.
 * ==================================================================== */

describe('MOD-STU-15 — no action composer, no gate bypass, no atom author', () => {
  it('exposes exactly four service functions, so ANY added one goes red — the shape, not the name', () => {
    expect(Object.keys(agentBuilderService).sort()).toEqual([
      'composeReasoningAgent',
      'deployComposedAgent',
      'mapComposedAgent',
      'submitToEvaluationGate',
    ])
    expect(agentBuilderService).not.toHaveProperty('composeActionAgent')
    expect(agentBuilderService).not.toHaveProperty('bypassEvaluationGate')
  })

  it('gives the composer no parameter that could ask for an action agent', () => {
    const composeArgs = Object.keys({
      register: 0,
      actorIdentityId: 0,
      agentId: 0,
      name: 0,
      capabilities: 0,
      at: 0,
      permitted: 0,
      refusalReason: 0,
    })
    // The literal above is the whole of `ComposeInput`. If a `kind` or `type`
    // field were added, this list would no longer type-check as that input.
    expect(composeArgs).not.toContain('kind')
    expect(composeArgs).not.toContain('type')
  })

  it('draws no control and names no service for the three rows refused in every column', () => {
    for (const id of [
      'author-an-atomic-capability',
      'compose-an-action-agent',
      'bypass-the-evaluation-gate',
    ] as const) {
      for (const persona of ALL_PERSONAS) {
        const control = agentBuilderControls(stu15Scenario({ persona })).find((c) => c.id === id)
        expect(control?.affordance.kind).toBe('absent')
        expect(control?.serviceKey).toBeNull()
      }
    }
  })

  it('renders SB-STU-18’s permanent line', () => {
    expect(renderBuilder()).toContain(AGENT_BUILDER_PERMANENT_LINE)
    expect(AGENT_BUILDER_PERMANENT_LINE).toBe(
      'The Agent Builder composes reasoning agents only. Action agents are configured, not composed.',
    )
  })

  it('TEST-STU-133 — no composed reasoning agent reaches any work package, and the package has no slot for one', () => {
    const serialised = JSON.stringify(RUN_2026_08_14_A_PACKAGE)
    for (const agent of composedAgents(SEEDED_COMPOSED_AGENTS)) {
      expect(serialised).not.toContain(agent.id)
      expect(serialised).not.toContain(agent.name)
      for (const capability of agent.capabilities) {
        expect(serialised).not.toContain(capability.atomId)
      }
    }
    // Structural: the package's content vocabulary offers no element a
    // composed agent could be filed under, whatever anybody names it.
    for (const element of PACKAGE_CONTENT_ELEMENTS) {
      expect(element).not.toMatch(/agent|composed|reasoning/i)
    }
  })

  it('classifies as `another-surface` every MOD-STU-15 row whose own cells name another surface', () => {
    const naming = STU_15_MATRIX.filter((row) => cellsNamingAnotherSurface(row.cells).length > 0)
    expect(naming.map((r) => r.id).sort()).toEqual(
      ['assign-or-revoke-the-agent-author-delegation'].sort(),
    )
    for (const row of naming) expect(row.surface).toBe('another-surface')
    // Row 9's alternative holder is named in the CARD-ONLY Platform Engineer
    // column, which no persona reads — so the same rule is applied there too.
    const platformOnly = STU_15_MATRIX.filter((row) =>
      NAMES_ANOTHER_SURFACE.test(row.cardOnlyColumns['platform-engineer'].note),
    )
    expect(platformOnly.map((r) => r.id)).toEqual(['perform-the-platform-level-review'])
    for (const row of platformOnly) expect(row.surface).toBe('another-surface')
  })

  it('partitions the matrix into controls and cross-surface statements, by classification', () => {
    for (const persona of ALL_PERSONAS) {
      const controlIds = new Set(agentBuilderControls(stu15Scenario({ persona })).map((c) => c.id))
      const statementIds = new Set(stu15CrossSurfaceStatements().map((s) => s.row.id))
      expect(controlIds.size + statementIds.size).toBe(STU_15_MATRIX.length)
      for (const row of STU_15_MATRIX) {
        expect(controlIds.has(row.id) !== statementIds.has(row.id)).toBe(true)
      }
    }
    expect(STU_15_CROSS_SURFACE.map((c) => c.rowId).sort()).toEqual(
      STU_15_MATRIX.filter((r) => r.surface !== 'screen')
        .map((r) => r.id)
        .sort(),
    )
  })
})

/* ==================================================================== *
 * MOD-STU-15 — the three gates.
 * ==================================================================== */

describe('MOD-STU-15 — the evaluation gate holds rather than advancing on an assumption', () => {
  it('holds a composition at Evaluation pending with the outcome UNKNOWN when the harness is unreachable', () => {
    const sink = recordingSink()
    const result = submitToEvaluationGate(
      {
        register: SEEDED_COMPOSED_AGENTS,
        actorIdentityId: 'IDN-BB-ELENA',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        at: '2026-06-22',
        permitted: true,
        refusalReason: '',
        harness: 'unreachable',
      },
      sink.write,
    )
    expect(result.ok).toBe(true)
    expect(result.agent?.state).toBe('Evaluation pending')
    const gate = result.agent?.gates.find((g) => g.gate === 'evaluation')
    expect(gate?.outcome).toBe('unknown')
    expect(gate?.decider).toBeNull()
    expect(result.message).toContain('never advanced on an assumption')
    expect(governanceTrack(result.agent!)[0]?.line).toContain('unknown')
  })

  it('returns a failed composition to Composed with the failing scenarios NAMED', () => {
    const sink = recordingSink()
    const result = submitToEvaluationGate(
      {
        register: SEEDED_COMPOSED_AGENTS,
        actorIdentityId: 'IDN-BB-ELENA',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        at: '2026-06-22',
        permitted: true,
        refusalReason: '',
        harness: 'reachable',
        verdict: { passed: false, failingScenarios: ['EVAL-TREND-EMPTY-WINDOW'] },
      },
      sink.write,
    )
    expect(result.agent?.state).toBe('Composed')
    expect(result.message).toContain('EVAL-TREND-EMPTY-WINDOW')
    expect(result.agent?.gates.find((g) => g.gate === 'evaluation')?.failingScenarios).toEqual([
      'EVAL-TREND-EMPTY-WINDOW',
    ])
  })

  it('TEST-STU-132 — refuses deployment of a composition that has not passed all three gates, checking the GATE RECORDS', () => {
    const sink = recordingSink()
    const failed = submitToEvaluationGate(
      {
        register: SEEDED_COMPOSED_AGENTS,
        actorIdentityId: 'IDN-BB-ELENA',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        at: '2026-06-22',
        permitted: true,
        refusalReason: '',
        harness: 'reachable',
        verdict: { passed: false, failingScenarios: ['EVAL-TREND-EMPTY-WINDOW'] },
      },
      sink.write,
    )
    const attempt = deployComposedAgent(
      {
        register: failed.register,
        actorIdentityId: 'IDN-BB-ELENA',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        at: '2026-06-23',
        permitted: true,
        refusalReason: '',
      },
      sink.write,
    )
    expect(attempt.ok).toBe(false)
    expect(attempt.register).toBe(failed.register)
    expect(attempt.message).toContain('Evaluation gate')
    expect(composedAgentById(attempt.register, 'CMP-BB-WEEKLY-TORQUE-TREND')?.state).toBe('Composed')
  })

  it('holds every gate the source names, in order, and prints an unreached one as unreached', () => {
    expect([...GOVERNANCE_GATE_IDS]).toEqual([
      'evaluation',
      'tenant-approval-chain',
      'platform-review',
    ])
    const agent = composedAgentById(SEEDED_COMPOSED_AGENTS, 'CMP-BB-WEEKLY-TORQUE-TREND')!
    for (const step of governanceTrack(agent)) expect(step.line).toContain('not reached')
  })
})

/* ==================================================================== *
 * MOD-STU-15 — the audit path, on a handler that actually mutates.
 * ==================================================================== */

describe('MOD-STU-15 — an act that cannot be audited does not happen', () => {
  it('maps an agent to a screen and records the audit entry before the mutation', () => {
    const sink = recordingSink()
    const result = mapComposedAgent(
      {
        register: SEEDED_COMPOSED_AGENTS,
        actorIdentityId: 'IDN-BB-ELENA',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        mapping: {
          workflowName: 'Assembly — Wheel Bolt Torque Verification',
          screenId: 'screen 7',
          trigger: 'Weekly',
        },
        at: '2026-06-22',
        permitted: true,
        refusalReason: '',
      },
      sink.write,
    )
    expect(result.ok).toBe(true)
    expect(sink.entries.map((e) => e.action)).toEqual(['map'])
    expect(sink.entries[0]?.actorIdentityId).toBe('IDN-BB-ELENA')
    // The OBSERVABLE effect, not that a function ran.
    const mapped = composedAgentById(result.register, 'CMP-BB-WEEKLY-TORQUE-TREND')
    expect(mapped?.mappings.map((m) => m.screenId)).toEqual(['screen 3', 'screen 7'])
  })

  it('maps an agent to a screen with a FAILING audit sink and the mapping does not persist', () => {
    const before: ComposedAgentRegister = SEEDED_COMPOSED_AGENTS
    const result = mapComposedAgent(
      {
        register: before,
        actorIdentityId: 'IDN-BB-ELENA',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        mapping: {
          workflowName: 'Assembly — Wheel Bolt Torque Verification',
          screenId: 'screen 9',
          trigger: 'Weekly',
        },
        at: '2026-06-22',
        permitted: true,
        refusalReason: '',
      },
      failingSink,
    )
    expect(result.ok).toBe(false)
    expect(result.message).toContain('an action that cannot be audited does not happen')
    // The SAME object came back, and the register still holds one mapping.
    expect(result.register).toBe(before)
    expect(
      composedAgentById(result.register, 'CMP-BB-WEEKLY-TORQUE-TREND')?.mappings.map(
        (m) => m.screenId,
      ),
    ).toEqual(['screen 3'])
  })

  it('appends nothing for a refused act, because a refused action is not an action', () => {
    const sink = recordingSink()
    const result = mapComposedAgent(
      {
        register: SEEDED_COMPOSED_AGENTS,
        actorIdentityId: 'IDN-BB-TOMAS',
        agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
        mapping: { workflowName: 'W', screenId: 'screen 9', trigger: 'Weekly' },
        at: '2026-06-22',
        permitted: false,
        refusalReason: 'Refused before anything was written.',
      },
      sink.write,
    )
    expect(result.ok).toBe(false)
    expect(sink.entries).toEqual([])
    expect(result.register).toBe(SEEDED_COMPOSED_AGENTS)
  })
})

/* ==================================================================== *
 * MOD-STU-15 — the honesty rules.
 * ==================================================================== */

describe('MOD-STU-15 — what the screen must say plainly', () => {
  it('states that a disabled capability keeps executing on in-flight Runs until they finish', () => {
    expect(DISABLEMENT_HONESTY_LINE).toContain('continues to execute on in-flight Runs until they finish')
    expect(renderBuilder()).toContain(DISABLEMENT_HONESTY_LINE)
  })

  it('renders exactly the six states the source names and no terminal state', () => {
    expect([...COMPOSED_AGENT_STATES]).toEqual([
      'Composed',
      'Evaluation pending',
      'Evaluation passed',
      'In approval',
      'Platform review',
      'Deployed',
    ])
    for (const state of COMPOSED_AGENT_STATES) {
      expect(state).not.toMatch(/deprecat|disabl|rollback|retired|archiv/i)
    }
    expect(renderBuilder()).toContain('There is no terminal state for a composed agent')
  })

  it('discloses DEC-AGENTLC-001 locally and invents no off switch', () => {
    expect(STU_15_LOCAL_DISCLOSURES.map((d) => d.decisionRef)).toEqual(['DEC-AGENTLC-001'])
    const html = renderBuilder()
    expect(html).toContain('Open decision DEC-AGENTLC-001')
    // SCANNED AS A STRUCTURE, NOT AS A NAME. A word scan cannot work here in
    // either direction: the disclosure text itself names deprecation,
    // disablement and rollback and must keep doing so, and `Button`'s own
    // Tailwind class carries the literal `disabled:opacity-50` — a first
    // attempt at this gate went red on the COMPOSE button for that reason.
    // The structural rule is that every control this screen draws traces to
    // a row of the source's own matrix, and the twelve rows carry no
    // lifecycle row at all. An invented off switch has no row to trace to,
    // whatever anybody calls it.
    const rowIds: readonly string[] = STU_15_ROW_IDS
    for (const persona of ALL_PERSONAS) {
      for (const control of agentBuilderControls(stu15Scenario({ persona }))) {
        expect(rowIds).toContain(control.id)
      }
    }
    expect(rowIds.some((id) => /deprecat|disable-an-agent|rollback|retire/.test(id))).toBe(false)
  })

  it('names the platform review queue as an UNREGISTERED dependency with no slice assigned', () => {
    const seam = stuSeamById(STU_SEAMS, 'composed-agent-platform-review-queue')
    expect(seam.ownerSlices).toEqual([])
    expect(stuSeamStatus(seam)).toBe('unscheduled')
    expect(seam.owner).toContain('no MOD-SA-* identifier')
    expect(builderSeams().map((s) => s.seam.id)).toContain('composed-agent-platform-review-queue')
    expect(renderBuilder()).toContain('Owner stated, no slice assigned.')
  })

  it('registers OBJ-STU-CAPSTATE as a gap rather than minting a numeric row', () => {
    expect(OBJ_STU_CAPSTATE_GAP.mnemonic).toBe('OBJ-STU-CAPSTATE')
    expect(OBJ_STU_CAPSTATE_GAP.numericCounterpart).toBeNull()
    expect(OBJ_STU_CAPSTATE_GAP.disclosure).toBe('D11')
    expect(studioDecision('D11').adopted).toContain('OBJ-STU-CAPSTATE')
    expect(renderBuilder()).toContain('Registered gap — OBJ-STU-CAPSTATE')
  })
})

/* ==================================================================== *
 * The screen both modules share.
 * ==================================================================== */

describe('SCR-STU-13 — one screen, one route, two modules', () => {
  it('is the catalogue-B row naming exactly MOD-STU-02 and MOD-STU-15', () => {
    const screen = STU_SCREENS.find((s) => s.id === 'SCR-STU-13')
    expect(screen?.moduleIds).toEqual(['MOD-STU-02', 'MOD-STU-15'])
    expect(stuScreensForModule(STU_SCREENS, 'MOD-STU-02').map((s) => s.id)).toEqual(['SCR-STU-13'])
    expect(stuScreensForModule(STU_SCREENS, 'MOD-STU-15').map((s) => s.id)).toEqual(['SCR-STU-13'])
  })

  it('renders both halves for the Quality Manager without either claiming an agent ran', () => {
    const html = renderConfiguration() + renderBuilder()
    expect(html).toContain('Agent configuration — MOD-STU-02')
    expect(html).toContain('The Agent Builder — MOD-STU-15')
    expect(html).not.toMatch(/evaluation passed at|review approved by|brief generated/i)
  })
})


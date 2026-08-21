import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { reachByStudioMatrix, stuModuleById, STU_MODULES } from '@/studio/modules'
import { publishCheckById, publishChecksOwnedBy } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
  type PublishCheckImplementation,
} from '@/studio/publish/register'
import { screenRendersState } from '@/studio/state/screen-states'
import { STU_SEAMS, stuSeamById, stuSeamStatus } from '@/studio/seams'
import { CAPABILITY_REGISTER, capabilitiesForTenant } from '@/studio/modules/stu-01/capabilities'
import { WHEEL_BOLT_DRAFT_CONTENT } from '@/studio/journey/fixture'
import { WHEEL_BOLT_SCREENS } from '@/studio/modules/stu-09/levels'
import { SEEDED_DRAFT } from '@/studio/modules/stu-10/seam'
import { confirmedPartsRegistry } from '@/studio/seams/parts/registry'
import { CAPTURE_TYPES, CONFIGURATION_SECTIONS, LOCALES } from '@/studio/vocab'
import {
  STU_05_MATRIX,
  STU_05_ROW_IDS,
  STU_05_SOURCE_ROW_COUNT,
  stu05Row,
  type Stu05RowId,
} from '@/studio/modules/stu-05/matrix'
import {
  ARMING_PANEL_HEADING,
  ARMING_PANEL_STATEMENTS,
  MEASUREMENT_SCREEN_IDS,
  SCREEN_CONFIGURATION_STATES,
  SECTION_DEFINITIONS,
  SECTION_SOURCE_ROW_COUNT,
  WHEEL_BOLT_CONFIGURATION,
  attachPointer,
  blockingElements,
  configuredScreen,
  evaluateMeasurement,
  limits,
  mapBand,
  screenConfigurationState,
  screenService,
  sectionStates,
  setGate,
  setInputType,
  setLimits,
  severityMapping,
  stu05PublishChecks,
  type ConfigurationDraft,
  type ScreenAuditEntry,
  type ScreenAuditWrite,
  type ScreenPublishSubject,
} from '@/studio/modules/stu-05/sections'
import {
  SCREEN_LIBRARY_REGISTER,
  SCREEN_PARTS_DRAFT,
  actionBundlePreview,
  screenControls,
  sectionPickerOptions,
  stu05Scenario,
} from '@/studio/modules/stu-05/rendering'
import {
  ConfigurationPanel,
  SECTION_FIVE_ANNOUNCEMENT,
  type ConfigurationPanelProps,
} from '@/studio/modules/stu-05/ConfigurationPanel'

/**
 * `MOD-STU-05` — Screen Authoring and the Nine Configuration Sections.
 *
 * THREE RULES APPLIED TO EVERY CASE BELOW, because the shapes they guard
 * against are the ones this build has shipped:
 *
 * 1. NO ASSERTION MAY PASS ON AN EMPTY SET. Nine sections is nine loops, and
 *    a loop over an empty section list passes every claim made inside it.
 *    Every walk pins the collection's own size FIRST, on its own line.
 * 2. THE FIXTURE IS EIGHT MEASUREMENT SCREENS, NOT ONE. L32525's screens 3
 *    through 10 are all measurement screens; a module that validates the
 *    first under-validates by seven. Every publish-check case below plants
 *    its defect on `screen 10`, the LAST of the eight.
 * 3. EVERY CONTROL IS EITHER ENABLED WITH A HANDLER OR DISABLED WITH A NAMED
 *    REASON. `Explicitly prohibited` carries no rendering at all.
 */

const ALL_PERSONAS: readonly StudioPersonaColumn[] = STUDIO_PERSONA_COLUMNS
const GRANT_HOLDER: StudioPersonaColumn = 'supervisor-with-authoring-grant'
const CAPABILITY_ROWS = capabilitiesForTenant([CAPABILITY_REGISTER], CAPABILITY_REGISTER.tenant)

/** An audit sink that accepts, and the entries it saw. */
function acceptingSink(): { write: ScreenAuditWrite; entries: ScreenAuditEntry[] } {
  const entries: ScreenAuditEntry[] = []
  return {
    write: (entry) => {
      entries.push(entry)
      return { ok: true }
    },
    entries,
  }
}

const refusingSink: ScreenAuditWrite = () => ({
  ok: false,
  reason: 'the tenant audit log did not accept the entry',
})

const throwingSink: ScreenAuditWrite = () => {
  throw new Error('the audit sink was reached on a path that must never reach it')
}

const draft: ConfigurationDraft = WHEEL_BOLT_CONFIGURATION

function panelMarkup(over: Partial<ConfigurationPanelProps> = {}): string {
  const screen = configuredScreen(draft, 'screen 3')
  const props: ConfigurationPanelProps = {
    screen,
    sections: sectionStates(screen, CAPABILITY_ROWS),
    persona: GRANT_HOLDER,
    capabilityRows: CAPABILITY_ROWS,
    partsDraft: SCREEN_PARTS_DRAFT,
    partsRegistry: confirmedPartsRegistry,
    onOpenLevel: () => undefined,
    onAddPart: () => undefined,
    onCancelPart: () => undefined,
    ...over,
  }
  return renderToStaticMarkup(createElement(ConfigurationPanel, props))
}

/* ==================================================================== *
 * 1. THE TWO SOURCE TABLES — STEP 1.
 * ==================================================================== */

describe('the two tables this module transcribes', () => {
  // RED IF: a section row is dropped, added, reworded or reordered.
  it('carries the nine section rows of L32218-L32226, in the source’s order', () => {
    expect(SECTION_SOURCE_ROW_COUNT).toBe(9)
    expect(SECTION_DEFINITIONS).toHaveLength(9)
    expect(SECTION_DEFINITIONS.map((s) => s.section)).toEqual([...CONFIGURATION_SECTIONS])
    expect(SECTION_DEFINITIONS.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(SECTION_DEFINITIONS[4]?.configures).toContain('Measurement screens only')
    expect(SECTION_DEFINITIONS[6]?.capabilityServed).toBe('Deviation and Containment')
  })

  // RED IF: section 5 stops being measurement-only, or 8/9 stop being optional.
  it('marks section 5 measurement-only and sections 8 and 9 optional, and nothing else', () => {
    const measurementOnly = SECTION_DEFINITIONS.filter((s) => s.measurementOnly)
    const optional = SECTION_DEFINITIONS.filter((s) => s.optional)
    expect(measurementOnly.map((s) => s.ordinal)).toEqual([5])
    expect(optional.map((s) => s.ordinal)).toEqual([8, 9])
  })

  // RED IF: a matrix row is dropped or added.
  it('carries the nine permission rows of L32259-L32267 and answers all eight columns', () => {
    expect(STU_05_SOURCE_ROW_COUNT).toBe(9)
    expect(STU_05_MATRIX).toHaveLength(9)
    expect(STU_05_ROW_IDS).toHaveLength(9)
    expect(ALL_PERSONAS).toHaveLength(8)
    for (const row of STU_05_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...ALL_PERSONAS].sort())
      for (const column of ALL_PERSONAS) {
        expect(row.cells[column].note.length).toBeGreaterThan(0)
      }
    }
  })

  // RED IF: row 5 or row 6 admits any column.
  it('refuses rows 5 and 6 in every one of the eight columns', () => {
    for (const id of ['soften-the-platform-specification-gate', 'define-a-new-severity-level'] as const) {
      const row = stu05Row(id)
      const outcomes = ALL_PERSONAS.map((c) => row.cells[c].outcome)
      expect(outcomes).toHaveLength(8)
      expect(new Set(outcomes)).toEqual(new Set(['explicitlyProhibited']))
    }
  })

  // RED IF: row 8 is reclassified `screen`, which would derive Tenant Admin
  // standing on THIS module's route from an act performed elsewhere.
  it('classifies row 8 as another surface and names the owner in the Quality Manager cell', () => {
    const row = stu05Row('edit-a-tenant-action-bundle')
    expect(row.surface).toBe('another-surface')
    expect(row.cells['quality-manager'].outcome).toBe('explicitlyProhibited')
    expect(row.cells['quality-manager'].note).toContain('tenant administration area')
    expect(row.cells['tenant-admin'].outcome).toBe('allowed')
    // The brief's own reading, checked at the source: the Auditor cell here is
    // NOT the open decision, because the act is outside the Studio entirely.
    expect(row.cells['read-only-auditor'].outcome).toBe('explicitlyProhibited')
    expect(row.cells['read-only-auditor'].openDecision).toBeNull()
  })

  // RED IF: the reach rule reads row 8, or the Worker gains a screen cell.
  it('derives reach from the screen rows only', () => {
    const reach = reachByStudioMatrix(STU_05_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach.worker).toBe('withheld')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['quality-manager']).toBe('offered')
    // Tenant Admin reaches this route on its READ-ONLY cells, never on row 8.
    expect(reach['tenant-admin']).toBe('offered')
  })
})

/* ==================================================================== *
 * 2. SECTION VISIBILITY — STEP 7, AND THE SIXTH DEFECT SHAPE.
 * ==================================================================== */

describe('section visibility, derived once', () => {
  // RED IF: `sectionStates` answers fewer than nine sections.
  it('answers all nine sections on every screen, never a subset', () => {
    expect(MEASUREMENT_SCREEN_IDS).toHaveLength(8)
    for (const screenId of MEASUREMENT_SCREEN_IDS) {
      const states = sectionStates(configuredScreen(draft, screenId), CAPABILITY_ROWS)
      expect(states).toHaveLength(9)
      expect(states.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
  })

  // RED IF: section 5 renders on a non-measurement screen.
  it('renders section 5 only where measurement entry is selected', () => {
    const measurement = configuredScreen(draft, 'screen 3')
    expect(measurement.inputType).toBe('measurement entry')
    const shown = sectionStates(measurement, CAPABILITY_ROWS)[4]
    expect(shown?.section).toBe('Specification limits')
    expect(shown?.visibility).toBe('rendered')

    const photo = configuredScreen(draft, 'screen 11')
    expect(photo.inputType).not.toBe('measurement entry')
    const hidden = sectionStates(photo, CAPABILITY_ROWS)[4]
    expect(hidden?.section).toBe('Specification limits')
    expect(hidden?.visibility).toBe('absent-for-input-type')
  })

  // RED IF: the appearance is silent.
  it('announces section 5’s appearance in a live region rather than silently', () => {
    const html = panelMarkup()
    expect(html).toContain('aria-live')
    expect(html).toContain(SECTION_FIVE_ANNOUNCEMENT)
    // …and says nothing about it where it is not there.
    const photo = configuredScreen(draft, 'screen 11')
    const other = panelMarkup({
      screen: photo,
      sections: sectionStates(photo, CAPABILITY_ROWS),
    })
    expect(other).not.toContain(SECTION_FIVE_ANNOUNCEMENT)
  })

  // RED IF: 8 and 9 stop being collapsed, or stop being labelled.
  it('collapses sections 8 and 9 by default and labels them optional', () => {
    const states = sectionStates(configuredScreen(draft, 'screen 3'), CAPABILITY_ROWS)
    const collapsed = states.filter((s) => s.collapsedByDefault)
    expect(collapsed.map((s) => s.ordinal)).toEqual([8, 9])
    const html = panelMarkup()
    expect(html).toContain('Tool and equipment')
    expect(html.match(/Optional/g)?.length).toBeGreaterThanOrEqual(2)
  })

  // RED IF: one branch folds the state and another reads the raw value.
  // The panel is HANDED the derived states; the footer and the section list
  // must agree because they read the same array.
  it('feeds every render branch from one derivation, so no two branches disagree', () => {
    const photo = configuredScreen(draft, 'screen 11')
    const states = sectionStates(photo, CAPABILITY_ROWS)
    const html = panelMarkup({ screen: photo, sections: states })
    const five = states[4]
    expect(five?.visibility).toBe('absent-for-input-type')
    // Absent means absent: no section-5 region, and no section-5 blocking element.
    expect(html).not.toContain('data-section-ordinal="5"')
    expect(blockingElements(states).join(' ')).not.toContain('Specification limits')
  })

  // RED IF: a disabled capability hides a section without saying so.
  it('renders SB-STU-04’s not-available line where a capability is not enabled', () => {
    const rows = CAPABILITY_ROWS.map((r) =>
      r.id === 'CAP-TOOLING' ? { ...r, enablement: 'disabled' as const } : r,
    )
    expect(rows).toHaveLength(CAPABILITY_ROWS.length)
    const screen = configuredScreen(draft, 'screen 3')
    const states = sectionStates(screen, rows)
    const tool = states[7]
    expect(tool?.section).toBe('Tool and equipment')
    expect(tool?.visibility).toBe('not-available')
    expect(tool?.reason).toContain('not enabled for this tenant')
    const html = panelMarkup({ screen, sections: states, capabilityRows: rows })
    expect(html).toContain('Not available')
  })

  // RED IF: an unresolvable capability hides the section and drops the value.
  it('freezes a section read-only when the capability state cannot be read, value intact', () => {
    const rows = CAPABILITY_ROWS.map((r) =>
      r.id === 'CAP-TOLERANCE' ? { ...r, enablement: 'unresolvable' as const } : r,
    )
    const screen = configuredScreen(draft, 'screen 3')
    const five = sectionStates(screen, rows)[4]
    expect(five?.visibility).toBe('frozen-read-only')
    expect(five?.reason).toContain('frozen')
    // The value travelled through the branch rather than being discarded.
    expect(limits(draft, 'screen 3')).toMatchObject({ lower: 44, upper: 47 })
  })
})

/* ==================================================================== *
 * 3. THE ARMING CONFIRMATION — STEP 2, C10/D23, R7.
 * ==================================================================== */

describe('the Severity 1 arming confirmation is a recorded act', () => {
  // RED IF: the mapping is saved when the confirmation cannot be recorded.
  it('does not save the mapping when the arming confirmation cannot be recorded', () => {
    const before = severityMapping(draft, 'screen 3')
    expect(before.length).toBeGreaterThan(0)
    const sink = acceptingSink()
    const r = mapBand({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      band: 'beyond 10 per cent outside the limits',
      level: 'Severity 1',
      recordConfirmation: 'fails',
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(false)
    expect(severityMapping(r.draft, 'screen 3')).toEqual(before)
    expect(r.draft).toBe(draft)
    expect(sink.entries).toHaveLength(0)
  })

  // RED IF: the confirmation is recorded anywhere but on the band.
  it('records the confirmation WITH the authored band', () => {
    const sink = acceptingSink()
    const r = mapBand({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      band: 'beyond 12 per cent outside the limits',
      level: 'Severity 1',
      recordConfirmation: 'succeeds',
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.band.armingConfirmation).toMatchObject({ confirmed: true })
    expect(r.band.armingConfirmation?.statements).toEqual([...ARMING_PANEL_STATEMENTS])
    const saved = severityMapping(r.draft, 'screen 3').find((b) => b.band === r.band.band)
    expect(saved?.armingConfirmation).toMatchObject({ confirmed: true })
    expect(sink.entries).toHaveLength(1)
  })

  // RED IF: a non-Severity-1 band is made to require a confirmation.
  it('requires no confirmation for a band below Severity 1', () => {
    const sink = acceptingSink()
    const r = mapBand({
      draft,
      screenId: 'screen 4',
      persona: GRANT_HOLDER,
      band: '0 to 10 per cent outside the limits',
      level: 'Severity 2',
      recordConfirmation: 'fails',
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.band.armingConfirmation).toBeNull()
  })

  // RED IF: a statement SB-STU-05 requires is dropped from the panel.
  it('states all four of SB-STU-05’s consequences in the panel', () => {
    expect(ARMING_PANEL_STATEMENTS).toHaveLength(4)
    const joined = ARMING_PANEL_STATEMENTS.join(' ')
    expect(ARMING_PANEL_HEADING).toBe('This band arms an automatic lot hold.')
    expect(joined).toContain('Lot')
    expect(joined).toContain('Quality Manager only')
    expect(joined).toContain('offline')
    expect(joined).toContain('sync')
    const html = panelMarkup()
    expect(html).toContain(ARMING_PANEL_HEADING)
  })
})

/* ==================================================================== *
 * 4. THE INPUT-TYPE CHANGE — STEP 3, AC-STU-064.
 * ==================================================================== */

describe('an input-type change retains values and marks them inactive', () => {
  // RED IF: a now-irrelevant value is deleted rather than deactivated.
  it('retains and marks inactive rather than deleting on an input-type change', () => {
    const sink = acceptingSink()
    const first = setLimits({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      limits: { lower: 44, upper: 47, unit: 'Nm', drawingReference: 'DWG-A441' },
      writeAudit: sink.write,
    })
    expect(first.ok).toBe(true)

    const changed = setInputType({
      draft: first.draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      inputType: 'photo capture',
      writeAudit: sink.write,
    })
    expect(changed.ok).toBe(true)
    expect(limits(changed.draft, 'screen 3')).toMatchObject({ active: false, lower: 44, upper: 47 })

    const reverted = setInputType({
      draft: changed.draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      inputType: 'measurement entry',
      writeAudit: sink.write,
    })
    expect(reverted.ok).toBe(true)
    expect(limits(reverted.draft, 'screen 3')).toMatchObject({ active: true, lower: 44, upper: 47 })
  })

  // RED IF: the retention rule reaches the first screen only.
  it('applies the retention rule on the LAST of the eight measurement screens', () => {
    const sink = acceptingSink()
    const changed = setInputType({
      draft,
      screenId: 'screen 10',
      persona: GRANT_HOLDER,
      inputType: 'free text',
      writeAudit: sink.write,
    })
    expect(changed.ok).toBe(true)
    expect(limits(changed.draft, 'screen 10')).toMatchObject({ active: false, lower: 44 })
    // …and no other screen moved.
    expect(limits(changed.draft, 'screen 3')).toMatchObject({ active: true })
  })

  // RED IF: the picker offers a type outside the adopted seven.
  it('offers exactly the adopted DEC-CAP-001 seven, plus none', () => {
    expect(CAPTURE_TYPES).toHaveLength(8)
    expect(CAPTURE_TYPES).toContain('none')
    const sink = acceptingSink()
    const r = setInputType({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      // @ts-expect-error — a type outside the closed set does not compile.
      inputType: 'thermal scan',
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(false)
  })
})

/* ==================================================================== *
 * 5. THE SPECIFICATION GATE — STEP 4, AC-STU-061, TEST-STU-067/068.
 * ==================================================================== */

describe('a soft proof gate never softens the specification gate', () => {
  // RED IF: the gate type reaches the specification evaluation.
  it('classifies an out-of-tolerance reading as a deviation under a soft proof gate', () => {
    const sink = acceptingSink()
    const soft = setGate({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      gate: 'soft',
      writeAudit: sink.write,
    })
    expect(soft.ok).toBe(true)
    expect(configuredScreen(soft.draft, 'screen 3').gate).toBe('soft')
    const evaluated = evaluateMeasurement(soft.draft, 'screen 3', 50)
    expect(evaluated.deviation).toBe(true)
    expect(evaluated.severity).toBeTruthy()
  })

  // RED IF: the band walk stops at the first screen, or a band is misread.
  it('classifies into the authored band on all eight measurement screens', () => {
    expect(MEASUREMENT_SCREEN_IDS).toHaveLength(8)
    for (const screenId of MEASUREMENT_SCREEN_IDS) {
      // 50 against 44-47 is 6.4 per cent above the upper limit — the first band.
      const near = evaluateMeasurement(draft, screenId, 50)
      expect(near.deviation).toBe(true)
      expect(near.severity).toBe('Severity 2')
      // 60 is 27.7 per cent above — beyond 10 per cent, the armed band.
      const far = evaluateMeasurement(draft, screenId, 60)
      expect(far.deviation).toBe(true)
      expect(far.severity).toBe('Severity 1')
      const inSpec = evaluateMeasurement(draft, screenId, 45)
      expect(inSpec.deviation).toBe(false)
      expect(inSpec.severity).toBeNull()
    }
  })

  // RED IF: any control that softens the specification gate is added.
  it('offers no control that softens the specification gate', () => {
    expect(screenService).not.toHaveProperty('setSpecificationGate')
    expect(Object.keys(screenService).length).toBeGreaterThan(0)
    for (const key of Object.keys(screenService)) {
      expect(key.toLowerCase()).not.toContain('specificationgate')
      expect(key.toLowerCase()).not.toContain('severitylevel')
    }
  })

  // RED IF: a prohibited row is drawn as a disabled control.
  it('draws no control at all for a categorically prohibited row', () => {
    const controls = screenControls(stu05Scenario({ persona: 'quality-manager' }))
    expect(controls.length).toBeGreaterThan(0)
    const soften = controls.find((c) => c.id === 'soften-the-platform-specification-gate')
    const define = controls.find((c) => c.id === 'define-a-new-severity-level')
    expect(soften?.affordance.kind).toBe('absent')
    expect(define?.affordance.kind).toBe('absent')
    // A NOTE stands where a control would be — never a button, which would
    // imply a condition that could one day become true. Asserted on the
    // markup rather than on the token, because `aria-disabled` on a button
    // satisfied a presence-only assertion once already.
    const html = panelMarkup()
    expect(html).toMatch(/<p role="note">[^<]*Define a new severity level/)
    expect(html).not.toMatch(/<button[^>]*>[^<]*Define a new severity level/)
    expect(html).not.toMatch(/<button[^>]*>[^<]*Soften the specification gate/)
  })

  // RED IF: an enabled control names no service function, or a disabled one
  // no reason. The service key is looked UP rather than trusted, so a control
  // that renders enabled and does nothing cannot pass.
  it('gives every rendered control either a real write or a named reason', () => {
    expect(ALL_PERSONAS).toHaveLength(8)
    let enabledSeen = 0
    for (const persona of ALL_PERSONAS) {
      const controls = screenControls(stu05Scenario({ persona }))
      expect(controls).toHaveLength(7)
      for (const control of controls) {
        if (control.affordance.kind === 'enabled') {
          expect(control.serviceKey).not.toBeNull()
          expect(typeof screenService[control.serviceKey!]).toBe('function')
          enabledSeen += 1
        } else if (control.affordance.kind === 'disabled') {
          expect(control.affordance.reason.length).toBeGreaterThan(10)
          expect(control.serviceKey).toBeNull()
        } else {
          expect(control.serviceKey).toBeNull()
        }
      }
    }
    // …and the walk actually met some enabled controls, so the branch above
    // is not a claim nothing exercised.
    expect(enabledSeen).toBeGreaterThan(0)
  })

  // RED IF: the picker starts writing, or stops being MOD-STU-07's.
  it('opens Section 6 and 7 pickers as a pure read that writes nothing', () => {
    const before = SCREEN_LIBRARY_REGISTER
    const result = sectionPickerOptions(before, 'screen 3', 'containment-checklist')
    expect(result.loaded).toBe(true)
    expect(result.options.length).toBeGreaterThan(0)
    expect(result.register).toBe(before)
    const failed = sectionPickerOptions(before, 'screen 3', 'coaching-default', 'fails')
    expect(failed.loaded).toBe(false)
    expect(failed.register).toBe(before)
  })
})

/* ==================================================================== *
 * 6. THE FIVE PUBLISH CHECKS — STEP 5, AND ALL EIGHT MEASUREMENT SCREENS.
 * ==================================================================== */

const CHECK_IDS = [
  'severity-mapping',
  'capture-type',
  'specification-limits',
  'coaching-default-per-locale',
  'severity-one-arming',
] as const

function subject(over: Partial<ScreenPublishSubject> = {}): ScreenPublishSubject {
  return {
    workflowName: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
    draft,
    declaredLocales: LOCALES,
    maintainedCertifications: [WHEEL_BOLT_DRAFT_CONTENT.qualificationBaseline],
    ...over,
  }
}

function runCheck(id: (typeof CHECK_IDS)[number], s: ScreenPublishSubject) {
  const implementation = stu05PublishChecks.find((c) => c.checkId === id)
  expect(implementation).toBeDefined()
  return implementation!.run(s)
}

describe('the five publication-blocking validations', () => {
  // RED IF: a check this module does not own is registered, or one is dropped.
  it('registers exactly the five checks the registry says this module owns', () => {
    expect(stu05PublishChecks).toHaveLength(5)
    expect(stu05PublishChecks.map((c) => c.checkId).sort()).toEqual([...CHECK_IDS].sort())
    expect(publishChecksOwnedBy('MOD-STU-05').map((c) => c.id).sort()).toEqual([...CHECK_IDS].sort())
    const result = registerPublishChecks(createPublishCheckRegister<ScreenPublishSubject>(), ...stu05PublishChecks)
    expect(result.ok).toBe(true)
    for (const check of stu05PublishChecks) {
      expect(check.implementedBy).toBe('MOD-STU-05')
    }
  })

  // RED IF: this module reaches for a sibling's check.
  it('is refused when it registers a check it does not own', () => {
    const stolen: PublishCheckImplementation<ScreenPublishSubject> = {
      checkId: 'locale-completeness',
      implementedBy: 'MOD-STU-05',
      run: () => ({ outcome: 'passed' }),
    }
    const result = registerPublishChecks(createPublishCheckRegister<ScreenPublishSubject>(), stolen)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.failure).toBe('not-an-owner')
  })

  // RED IF: the walk stops at the first screen. The gap is on screen 10.
  it('blocks on a measurement screen with no limits and names THAT screen', () => {
    const withoutLimits = {
      ...draft,
      screens: draft.screens.map((s) => (s.screenId === 'screen 10' ? { ...s, limits: null } : s)),
    }
    expect(withoutLimits.screens).toHaveLength(draft.screens.length)
    const verdict = runCheck('specification-limits', subject({ draft: withoutLimits }))
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    expect(verdict.blockingElement).toContain('screen 10')
    expect(verdict.blockingElement).toContain('lower')
  })

  // RED IF: the message stops naming the screen.
  it('names every failing measurement screen, not just the first', () => {
    const noneHaveLimits = { ...draft, screens: draft.screens.map((s) => ({ ...s, limits: null })) }
    const verdict = runCheck('specification-limits', subject({ draft: noneHaveLimits }))
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    for (const screenId of MEASUREMENT_SCREEN_IDS) {
      expect(verdict.blockingElement).toContain(screenId)
    }
    expect(MEASUREMENT_SCREEN_IDS).toHaveLength(8)
  })

  // RED IF: the severity walk stops at the first screen.
  it('blocks where a measurement screen carries no severity mapping, naming the screen', () => {
    const unmapped = {
      ...draft,
      screens: draft.screens.map((s) =>
        s.screenId === 'screen 10' ? { ...s, severityBands: [] } : s,
      ),
    }
    const verdict = runCheck('severity-mapping', subject({ draft: unmapped }))
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    expect(verdict.blockingElement).toContain('screen 10')
  })

  // RED IF: the offending type or the screen is dropped from the message.
  it('blocks a capture type outside the adopted seven, naming the type and the screen', () => {
    const strayed = {
      ...draft,
      screens: draft.screens.map((s) =>
        s.screenId === 'screen 10' ? { ...s, inputType: 'thermal scan' as never } : s,
      ),
    }
    const verdict = runCheck('capture-type', subject({ draft: strayed }))
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    expect(verdict.blockingElement).toContain('thermal scan')
    expect(verdict.blockingElement).toContain('screen 10')
  })

  // RED IF: the locale is dropped from the message.
  it('blocks a missing coaching default in a declared locale, naming the locale and the screen', () => {
    const missing = {
      ...draft,
      screens: draft.screens.map((s) =>
        s.screenId === 'screen 10'
          ? { ...s, coachingDefaults: s.coachingDefaults.filter((d) => d.locale !== 'Spanish') }
          : s,
      ),
    }
    const verdict = runCheck('coaching-default-per-locale', subject({ draft: missing }))
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    expect(verdict.blockingElement).toContain('Spanish')
    expect(verdict.blockingElement).toContain('screen 10')
  })

  // RED IF: an unconfirmed Severity 1 mapping is allowed to reach the floor.
  it('blocks a Severity 1 band with no recorded confirmation, naming the band and the screen', () => {
    const unarmed = {
      ...draft,
      screens: draft.screens.map((s) =>
        s.screenId === 'screen 10'
          ? {
              ...s,
              severityBands: s.severityBands.map((b) =>
                b.level === 'Severity 1' ? { ...b, armingConfirmation: null } : b,
              ),
            }
          : s,
      ),
    }
    const verdict = runCheck('severity-one-arming', subject({ draft: unarmed }))
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    expect(verdict.blockingElement).toContain('screen 10')
    expect(verdict.blockingElement).toContain('Severity 1')
  })

  // RED IF: any of the five passes on a healthy draft — a check that always
  // blocks is as useless as one that never does.
  it('passes all five on the seeded draft, so a block means something', () => {
    for (const id of CHECK_IDS) {
      expect(runCheck(id, subject()).outcome).toBe('passed')
    }
    expect(CHECK_IDS).toHaveLength(5)
  })

  // RED IF: a registered check is silently skipped by the evaluator.
  it('refuses publication rather than warning, and never publishes past a blocker', () => {
    const registered = registerPublishChecks(
      createPublishCheckRegister<ScreenPublishSubject>(),
      ...stu05PublishChecks,
    )
    expect(registered.ok).toBe(true)
    if (!registered.ok) return
    const noneHaveLimits = { ...draft, screens: draft.screens.map((s) => ({ ...s, limits: null })) }
    const evaluation = evaluatePublish(registered.register, subject({ draft: noneHaveLimits }))
    expect(evaluation.blocked).toBe(true)
    const mine = evaluation.blockers.filter((b) => b.checkId === 'specification-limits')
    expect(mine).toHaveLength(1)
    expect(mine[0]?.kind).toBe('failed')
    // Every unregistered check blocks too — fail closed, never a warning.
    expect(evaluation.blockers.length).toBeGreaterThan(1)
  })

  // RED IF: a check walks an empty screen list and calls that a pass. This is
  // the ninth defect shape at its purest: five loops, none of them entered.
  it('refuses to run on an empty draft rather than passing vacuously', () => {
    const empty = subject({ draft: { ...draft, screens: [] } })
    expect(empty.draft.screens).toHaveLength(0)
    for (const id of CHECK_IDS) {
      const verdict = runCheck(id, empty)
      expect(verdict.outcome).toBe('cannot-run')
      expect(verdict.outcome === 'cannot-run' ? verdict.reason : '').toContain('no screens')
    }
    // …and a declared-locale set that emptied out cannot pass check 5 either.
    const noLocales = runCheck('coaching-default-per-locale', subject({ declaredLocales: [] }))
    expect(noLocales.outcome).toBe('cannot-run')
  })

  // RED IF: a check's ordinal or refusal wording drifts from the registry.
  it('reads the refusal wording from Task 5’s registry rather than restating it', () => {
    for (const id of CHECK_IDS) {
      const definition = publishCheckById(id)
      expect(definition.ownerModules).toContain('MOD-STU-05')
      expect(definition.refuses.length).toBeGreaterThan(0)
    }
  })
})

/* ==================================================================== *
 * 7. THE AUDIT PATH — STEP 10.
 * ==================================================================== */

describe('every section write routes through one audit path', () => {
  // RED IF: the mutation happens before the audit append.
  it('writes a specification limit and does NOT persist it when the audit fails', () => {
    const before = limits(draft, 'screen 3')
    expect(before).toMatchObject({ lower: 44, upper: 47 })
    const r = setLimits({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      limits: { lower: 40, upper: 50, unit: 'Newton metres', drawingReference: 'DWG-B002' },
      writeAudit: refusingSink,
    })
    expect(r.ok).toBe(false)
    expect(r.draft).toBe(draft)
    expect(limits(r.draft, 'screen 3')).toEqual(before)
  })

  // RED IF: the accepted path mutates nothing observable — the shape that
  // demonstrated the audit contract where it cost nothing.
  it('mutates something observable when the audit is accepted', () => {
    const sink = acceptingSink()
    const r = setLimits({
      draft,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      limits: { lower: 40, upper: 50, unit: 'Newton metres', drawingReference: 'DWG-B002' },
      writeAudit: sink.write,
    })
    expect(r.ok).toBe(true)
    expect(limits(r.draft, 'screen 3')).toMatchObject({ lower: 40, upper: 50, active: true })
    expect(sink.entries).toHaveLength(1)
    expect(sink.entries[0]?.section).toBe('Specification limits')
    expect(sink.entries[0]?.screenId).toBe('screen 3')
  })

  // RED IF: a refusal reaches the audit sink.
  it('never reaches the audit sink on an authorisation refusal', () => {
    const r = setLimits({
      draft,
      screenId: 'screen 3',
      persona: 'worker',
      limits: { lower: 1, upper: 2, unit: 'mm', drawingReference: 'DWG-X' },
      writeAudit: throwingSink,
    })
    expect(r.ok).toBe(false)
    expect(r.draft).toBe(draft)
  })

  // RED IF: one write skips the shared path. Every write is exercised.
  it('routes every one of this module’s writes through the same path', () => {
    const names = Object.keys(screenService)
    expect(names.length).toBeGreaterThanOrEqual(6)
    for (const name of names) {
      const fn = screenService[name as keyof typeof screenService]
      expect(typeof fn).toBe('function')
    }
  })

  // RED IF: the pointer write stops going through Task 11's audited write.
  it('attaches a library pointer through MOD-STU-07’s own write, and refuses on a failed audit', () => {
    const sink = acceptingSink()
    const ok = attachPointer({
      draft,
      register: SCREEN_LIBRARY_REGISTER,
      screenId: 'screen 3',
      slot: 'containment-checklist',
      itemId: 'CHK-TORQUE-RESPONSE',
      persona: GRANT_HOLDER,
      writeAudit: sink.write,
    })
    expect(ok.ok).toBe(true)
    expect(ok.register.pointers.some((p) => p.screenId === 'screen 3')).toBe(true)

    const failed = attachPointer({
      draft,
      register: SCREEN_LIBRARY_REGISTER,
      screenId: 'screen 3',
      slot: 'containment-checklist',
      itemId: 'CHK-TORQUE-RESPONSE',
      persona: GRANT_HOLDER,
      writeAudit: () => ({ ok: false, reason: 'the tenant audit log refused' }),
    })
    expect(failed.ok).toBe(false)
    expect(failed.register).toBe(SCREEN_LIBRARY_REGISTER)
  })
})

/* ==================================================================== *
 * 8. THE TWO MOUNTS — STEP 9.
 * ==================================================================== */

describe('the two frozen components this screen mounts', () => {
  // RED IF: the strip is re-implemented here rather than mounted.
  it('mounts MOD-STU-09’s difficulty coverage strip in Section 1', () => {
    const html = panelMarkup()
    expect(html).toContain('Difficulty levels change explanation depth only')
    // Six cells: three levels by two declared locales.
    expect(LOCALES).toHaveLength(2)
    expect(html.match(/role="gridcell"/g)?.length).toBe(6)
  })

  // RED IF: the seam is re-implemented here rather than mounted.
  it('mounts MOD-STU-10’s part mini-form in Section 1’s step editor', () => {
    const html = panelMarkup()
    expect(html).toContain('Part name')
    expect(html).toContain('The platform assigns the identifier')
  })

  // RED IF: either component's screen pointer rots. Both are pinned to the
  // fixture they were built against: remove screen 3 and this goes red.
  it('points at content that is there — the eight seeded screens', () => {
    expect(WHEEL_BOLT_SCREENS).toHaveLength(8)
    expect(WHEEL_BOLT_SCREENS.map((s) => s.screenId)).toEqual([...MEASUREMENT_SCREEN_IDS])
    expect(SEEDED_DRAFT.steps.length).toBeGreaterThan(0)
    expect(WHEEL_BOLT_DRAFT_CONTENT.measurementScreens).toHaveLength(8)
    expect(WHEEL_BOLT_DRAFT_CONTENT.specification.lowerLimit).toBe(44)
  })

  // RED IF: a designated coaching default is removed from MOD-STU-07's
  // corpus. The screen holds a POINTER, and the panel resolves it to a NAME —
  // so a rotted pointer renders as "unresolvable" instead of looking fine.
  it('resolves Section 6 and 7 pointers into MOD-STU-07’s library by name', () => {
    const screen = configuredScreen(draft, 'screen 3')
    expect(screen.coachingDefaults).toHaveLength(2)
    const html = panelMarkup({ register: SCREEN_LIBRARY_REGISTER })
    for (const designation of screen.coachingDefaults) {
      const item = SCREEN_LIBRARY_REGISTER.items.find((i) => i.id === designation.itemId)
      expect(item, designation.itemId).toBeDefined()
      expect(html).toContain(item!.name)
    }
    expect(html).not.toContain('unresolvable in the approved corpus')
  })
})

/* ==================================================================== *
 * 9. ROW 8 — STEP 6, A CROSS-SURFACE STATEMENT.
 * ==================================================================== */

describe('row 8 is a statement about another surface, never a control', () => {
  // RED IF: any Studio route grows an action-bundle editor.
  it('offers no action-bundle editor on any Studio route', () => {
    // `app/studio` is a LIVE plant root -- `tests/coverage/slice-05-gates.test.ts`
    // creates `app/studio/<probe>/` there and deletes it as soon as its own
    // assertion finishes. This listing keeps DIRECTORY entries, so it admitted
    // that probe and then read inside it: ENOENT on a correct build, on a race
    // rather than on a finding. It is not recursive, which is why a rule about
    // recursive walks alone would not have found it.
    // `tests/probe-paths.ts` carries the full account.
    const routes = readdirSync(join(process.cwd(), 'app', 'studio'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
    expect(routes.length).toBeGreaterThan(5)
    const offenders: string[] = []
    for (const route of routes) {
      const dir = join(process.cwd(), 'app', 'studio', route.name)
      for (const file of readdirSync(dir)) {
        if (!/\.tsx?$/.test(file)) continue
        const text = readFileSync(join(dir, file), 'utf8')
        if (/(edit|save|update)[A-Za-z]*ActionBundle/i.test(text)) {
          offenders.push(`${route.name}/${file}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  // RED IF: the preview stops reading through the declared seam.
  it('reads the tenant action bundle through the declared, unscheduled seam', () => {
    const seam = stuSeamById(STU_SEAMS, 'severity-action-bundle-editor')
    expect(seam.consumingModules).toContain('MOD-STU-05')
    expect(seam.ownerSlices).toEqual([])
    expect(stuSeamStatus(seam)).toBe('unscheduled')
    const preview = actionBundlePreview('Severity 1')
    expect(preview.level).toBe('Severity 1')
    expect(preview.platformFloor).toContain('lot freeze')
    expect(preview.platformFloor).toContain('Quality-Manager-only release')
    expect(preview.seamId).toBe('severity-action-bundle-editor')
    const html = panelMarkup()
    expect(html).toContain('Owner stated, no slice assigned')
  })
})

/* ==================================================================== *
 * 10. SCREEN STATES — STEP 8.
 * ==================================================================== */

describe('the screen states this panel renders', () => {
  // RED IF: STATE-10 or STATE-11 stops applying to SCR-STU-04.
  it('renders STATE-10 and STATE-11 and says the author writes all three levels by hand', () => {
    expect(screenRendersState('SCR-STU-04', 'STATE-10')).toBe(true)
    expect(screenRendersState('SCR-STU-04', 'STATE-11')).toBe(true)
    const html = panelMarkup({ draftingAid: 'degraded' })
    expect(html).toContain('writes all three difficulty levels manually')
  })

  // RED IF: STATE-07 is drawn on this surface.
  it('renders STATE-07 nowhere', () => {
    expect(screenRendersState('SCR-STU-04', 'STATE-07')).toBe(false)
    expect(panelMarkup()).not.toContain('STATE-07')
  })

  // RED IF: the state ladder is collapsed to two.
  it('carries the three screen states L32277 names, in order', () => {
    expect(SCREEN_CONFIGURATION_STATES).toEqual([
      'Incomplete',
      'Configured',
      'Published within a version',
    ])
    const complete = sectionStates(configuredScreen(draft, 'screen 3'), CAPABILITY_ROWS)
    expect(screenConfigurationState(complete)).toBe('Configured')
    const screen = configuredScreen(draft, 'screen 3')
    const broken = sectionStates({ ...screen, limits: null }, CAPABILITY_ROWS)
    expect(screenConfigurationState(broken)).toBe('Incomplete')
    expect(blockingElements(broken).length).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * 11. THE PANEL'S STRUCTURE — STEP 11.
 *
 * `pnpm build` and the Playwright axe run are the surface-wide check and are
 * not on this task's path list; what IS checkable here is the structure axe
 * would walk, so it is asserted directly rather than assumed.
 * ==================================================================== */

describe('the accordion’s structure', () => {
  // RED IF: a section stops being a named region, or the regions reorder.
  it('renders nine named landmark regions in section order on a measurement screen', () => {
    const html = panelMarkup()
    const labels = [...html.matchAll(/aria-label="Section (\d) — ([^"]+)"/g)].map(
      (m) => `${m[1]}|${m[2]}`,
    )
    expect(labels).toHaveLength(9)
    expect(labels).toEqual(
      SECTION_DEFINITIONS.map((s) => `${s.ordinal}|${s.section}`),
    )
    // Keyboard traversal follows DOM order, and DOM order is section order:
    // the ordinals appear ascending in the markup with no reordering.
    const ordinals = [...html.matchAll(/data-section-ordinal="(\d)"/g)].map((m) => Number(m[1]))
    expect(ordinals).toEqual([...ordinals].sort((a, b) => a - b))
    expect(ordinals).toHaveLength(9)
  })

  // RED IF: a blocking element is rendered outside the section it belongs to,
  // which is what breaks the association between a validation message and the
  // thing it is about.
  it('renders each missing element inside its own section’s region', () => {
    const screen = configuredScreen(draft, 'screen 3')
    const broken = { ...screen, limits: null }
    const states = sectionStates(broken, CAPABILITY_ROWS)
    const html = panelMarkup({ screen: broken, sections: states })
    const fifth = html.indexOf('aria-label="Section 5 — Specification limits"')
    const sixth = html.indexOf('aria-label="Section 6 — Coaching content"')
    const message = html.indexOf('Missing: lower specification limit')
    expect(fifth).toBeGreaterThan(-1)
    expect(sixth).toBeGreaterThan(fifth)
    expect(message).toBeGreaterThan(fifth)
    expect(message).toBeLessThan(sixth)
    // …and the footer repeats it, from the same derivation.
    expect(blockingElements(states)).toContain('Specification limits — lower specification limit')
  })
})

/* ==================================================================== *
 * 12. THE MODULE'S OWN REGISTRY ENTRY AND DETERMINISM.
 * ==================================================================== */

describe('the module registry entry and determinism', () => {
  // RED IF: the route key stops being the module slug.
  it('is keyed on the module slug, never on a screen id', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-05')
    expect(module.slug).toBe('screen-configuration')
    expect(module.uncataloguedScreen).toBeNull()
  })

  // RED IF: a clock, a counter or a random source enters a derivation.
  it('derives the same answer twice', () => {
    const screen = configuredScreen(draft, 'screen 3')
    expect(sectionStates(screen, CAPABILITY_ROWS)).toEqual(sectionStates(screen, CAPABILITY_ROWS))
    expect(panelMarkup()).toBe(panelMarkup())
  })

  // RED IF: an unknown screen returns an empty answer instead of throwing —
  // every `toEqual([])` above would then pass on a typo.
  it('throws on an unknown screen rather than answering with an empty set', () => {
    expect(() => configuredScreen(draft, 'screen 99')).toThrow(/screen 99/)
    const ids: readonly Stu05RowId[] = STU_05_ROW_IDS
    expect(ids).toHaveLength(9)
  })
})

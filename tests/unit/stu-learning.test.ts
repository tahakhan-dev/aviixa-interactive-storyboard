import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LearningView } from '../../app/studio/learning/LearningView'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { studioDecision } from '@/studio/disclosure/decisions'
import { reachByStudioMatrix, STU_PERSONAS, stuPersonaById } from '@/studio/modules'
import {
  SEEDED_LIBRARY_REGISTER,
  itemById,
  type CoachingAssetItem,
  type LibraryRegister,
} from '@/studio/modules/stu-07/libraries'
import type { LibraryActor, LibraryAuditWrite } from '@/studio/modules/stu-07/writes'
import type { PinnedRun } from '@/studio/modules/stu-12/versions'
import { STU_14_LOCAL_DISCLOSURES } from '@/studio/modules/stu-14/rendering'
import { SEEDED_TENANT } from '@/studio/modules/stu-18/rendering'
import {
  LANE_A_SIGNAL_KEYS,
  PERSON_TERMS,
  SEEDED_LANE_A_LEDGER,
  applyLaneASignal,
  coachingEffectiveness,
  laneASignal,
  laneASignalKey,
  namesPersonBehaviouralMeasure,
  reverseLaneARefinement,
  type SelectionWeights,
} from '@/studio/modules/stu-16/lane-a'
import {
  LANE_B_PROPOSAL_STATES,
  SEEDED_OPEN_PROPOSALS,
  STALE_FLAG_DAYS,
  advanceProposalAge,
  applyPackageTest,
  staleBadge,
  type LaneBDecisionReceipt,
  type OpenProposal,
} from '@/studio/modules/stu-16/lane-b'
import {
  LEARNING_FOOTER,
  altersAConfiguredOperatingValue,
  applyLaneABacklog,
  applyLearningAct,
  laneOf,
  routeRefinement,
  type LearningAuditEntry,
  type LearningAuditWrite,
} from '@/studio/modules/stu-16/learning'
import {
  STU_16_MATRIX,
  STU_16_OTHER_SURFACE_ROW_IDS,
  STU_16_ROW_IDS,
  STU_16_SOURCE_ROW_COUNT,
  stu16Row,
  type Stu16RowId,
} from '@/studio/modules/stu-16/matrix'
import {
  MEMORY_STORES,
  STUDIO_WRITTEN_STORES,
  anonymisationPolicy,
  memoryArchitectureRefusal,
  writeOnPublication,
} from '@/studio/modules/stu-16/memory'
import {
  LEARNING_READ_ROW_ID,
  STU_16_ACT_ROW_IDS,
  STU_16_STATEMENT_ROW_IDS,
  learningControls,
  learningService,
  learningViewIsOpen,
  otherSurfaceStatements,
  stu16Decision,
  stu16Scenario,
} from '@/studio/modules/stu-16/rendering'

/**
 * `MOD-STU-16` — Memory and the Two-Lane Learning Loop. Frozen source §5.16,
 * card L34154-L34349.
 *
 * ## THE SEVEN RULES THIS FILE EXISTS TO HOLD
 *
 * Each has its planted defect recorded in the task report, and each plant was
 * watched go red before it was restored.
 *
 * 1. **THE LANE BOUNDARY IS AN ABSENT EDGE, NOT A GUARD.** `lane-a.ts` and
 *    `lane-b.ts` reference each other nowhere, in either direction, and the
 *    scan below proves it over the STRIPPED source so a mention in a comment
 *    is not mistaken for one in code.
 * 2. **THE STUDIO CANNOT MINT A DECISION.** Nothing under this task's path
 *    list writes a `deciderIdentityId`. The gate scans for the STRUCTURE — an
 *    object literal writing that field — not for the words "approve" or
 *    "reject", because a future `confirmChange()` would pass a name-based
 *    check while doing the forbidden thing.
 * 3. **NOTHING ON THE PATCH PATH CAN REACH AN IN-FLIGHT RUN.** Same shape:
 *    no run type is imported and no run field is written anywhere in the
 *    module, so `applyPackageTest` has nothing to re-base.
 * 4. **NO WORKER IS A GROUPING KEY.** The coaching-effectiveness panel is
 *    grouped by asset and the Lane-A signal has four keys — asset, language,
 *    failure pattern, screen (L34166).
 * 5. **ROW 4 INVENTS NO CONTROL.** Its cell states an architectural absence,
 *    and the screen renders that sentence with no toggle of any kind.
 * 6. **ROWS 1 AND 2 ANSWER THE AUDITOR TWO DIFFERENT WAYS**, and the
 *    difference is the reason text about a different surface.
 * 7. **THE AUDIT REFUSES THE ACT.** On the memory writes through this
 *    module's own path, and on retirement through `MOD-STU-07`'s.
 *
 * ## WHY THIS RENDERS WITH `renderToStaticMarkup` AND NOT `render()`
 *
 * `tests/unit/**` is the `unit` project, which runs in the **node**
 * environment with no jsdom and no `tests/setup.ts` (see `vitest.config.ts`).
 * A `.ts` file there cannot carry JSX and `@testing-library`'s `render` and
 * `screen` have no document to work against. This file therefore renders the
 * real screen to static markup and asserts over the markup, which is the
 * pattern `tests/unit/stu-localisation.test.ts` already uses. The brief's
 * step 3, step 4 and step 6 snippets are written in the `render(<X />)` form
 * and are transcribed here into the form that compiles; the divergence is
 * recorded in the task report.
 */

const STU_16_DIR = join(process.cwd(), 'src', 'studio', 'modules', 'stu-16')
const LEARNING_ROUTE_DIR = join(process.cwd(), 'app', 'studio', 'learning')

const ELENA = 'IDN-BB-ELENA'

function filesUnder(dir: string, match: RegExp, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) filesUnder(full, match, acc)
    else if (match.test(entry.name)) acc.push(full)
  }
  return acc
}

/** Every source file this task owns. */
function taskFiles(): readonly string[] {
  return [
    ...filesUnder(STU_16_DIR, /\.tsx?$/),
    ...filesUnder(LEARNING_ROUTE_DIR, /\.tsx?$/),
  ]
}

/**
 * Comments removed, so a rule expressed in prose is never mistaken for the
 * thing the prose is about. Every structural gate below reads this, never the
 * raw file.
 */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
}

function taskCorpus(): string {
  return taskFiles()
    .map((f) => code(f))
    .join('\n')
}

/* ==================================================================== *
 * RENDERING HELPERS — the node-environment equivalents of `screen`.
 * ==================================================================== */

function html(persona: StudioPersonaColumn = 'quality-manager'): string {
  return renderToStaticMarkup(createElement(LearningView, { persona }))
}

/**
 * The personas whose route renders this screen's content at all.
 *
 * `StudioShell` draws no children for a persona whose Studio access is
 * `explicitly-prohibited` — the Worker, `AC-STU-150` (L34667): *"A Worker
 * cannot reach any Studio route by any means."* That is the shell's rule and
 * this module inherits it, so a loop asserting what the screen renders
 * excludes that persona **by reading the persona record**, never by naming
 * the Worker in a literal: a second persona classified that way tomorrow
 * would be excluded by the same read, and a hard-coded list would silently
 * start asserting against a blank page.
 *
 * `read-only-auditor` is NOT excluded. `client-decision-open` renders the
 * children plus the `DEC-AUDSTU-001` notice, which is the whole point of the
 * three-valued token.
 */
const PERSONAS_THE_SHELL_RENDERS: readonly StudioPersonaColumn[] = STUDIO_PERSONA_COLUMNS.filter(
  (persona) => stuPersonaById(STU_PERSONAS, persona).studioAccess !== 'explicitly-prohibited',
)

function stripTags(fragment: string): string {
  return fragment
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;|&#39;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function visibleText(markup: string): string {
  return stripTags(markup)
}

/** Every `<button>`'s accessible-ish name: its text plus any `aria-label`. */
function buttonNames(markup: string): readonly string[] {
  return [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => {
    const label = /aria-label="([^"]*)"/.exec(m[1] ?? '')
    return `${label?.[1] ?? ''} ${stripTags(m[2] ?? '')}`.trim()
  })
}

/** Every `<a href>`'s href and text. */
function links(markup: string): readonly { readonly href: string; readonly text: string }[] {
  return [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: /href="([^"]*)"/.exec(m[1] ?? '')?.[1] ?? '',
    text: stripTags(m[2] ?? ''),
  }))
}

/* ==================================================================== *
 * STEP 1 — the source's own table, L34194-L34202. NINE data rows.
 * ==================================================================== */

describe('the permission matrix is the source table at L34194-L34202', () => {
  it('carries all nine source rows', () => {
    expect(STU_16_SOURCE_ROW_COUNT).toBe(9)
    expect(STU_16_MATRIX.length).toBe(STU_16_SOURCE_ROW_COUNT)
    expect(STU_16_MATRIX.map((r) => r.id)).toEqual([...STU_16_ROW_IDS])
  })

  it('transcribes the nine capabilities in the source’s own order and wording', () => {
    expect(STU_16_MATRIX.map((row) => row.capability)).toEqual([
      'Read the learning view',
      'Decide a Lane-B proposal',
      'Reverse a Lane-A refinement',
      'Turn learning off',
      'Set retention within allowed bounds on memory',
      'Set the personal-information policy on profile memory',
      'Change the memory architecture',
      'Export learned content outside the tenant',
      'Flag or retire a low-performing coaching asset',
    ])
  })

  it('answers all eight persona columns on every row — no blank cells (L10238)', () => {
    for (const row of STU_16_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].note.trim()).not.toBe('')
      }
    }
  })

  it('states a derivation for both columns the card does not head, and for neither of the six it does', () => {
    for (const row of STU_16_MATRIX) {
      expect(row.derivation['plant-manager-persona']).not.toBeNull()
      expect(row.derivation['implementation-team']).not.toBeNull()
      for (const column of [
        'quality-manager',
        'supervisor-with-authoring-grant',
        'supervisor-without-grant',
        'tenant-admin',
        'read-only-auditor',
        'worker',
      ] satisfies readonly StudioPersonaColumn[]) {
        expect(row.derivation[column]).toBeNull()
      }
    }
  })

  it('routes nobody anywhere — every refusal on this card is an absence, never a disabled control', () => {
    for (const row of STU_16_MATRIX) {
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.routedTo[column]).toBeNull()
      }
    }
  })

  it('mirrors the without-grant cell onto the Plant Manager persona (DEC-ROLE-001, L34522)', () => {
    for (const row of STU_16_MATRIX) {
      expect(row.cells['plant-manager-persona']).toEqual(row.cells['supervisor-without-grant'])
    }
  })
})

/* ==================================================================== *
 * STEP 5 — rows 1 and 2's Auditor cells, four columns apart.
 * ==================================================================== */

describe('the Read-only Auditor is answered two different ways, and the difference is the point', () => {
  it('leaves the Studio read open under DEC-AUDSTU-001 on row 1 (L34194)', () => {
    const cell = stu16Row('read-the-learning-view').cells['read-only-auditor']
    expect(cell.outcome).toBe('clientDecisionRequired')
    expect(cell.openDecision).toBe('DEC-AUDSTU-001')
    expect(cell.note).toBe('Client Decision Required — DEC-AUDSTU-001')
  })

  it('settles the Lane-B decision on row 2 with a DIFFERENT SURFACE’s rule (L34195)', () => {
    const cell = stu16Row('decide-a-lane-b-proposal').cells['read-only-auditor']
    expect(cell.outcome).toBe('explicitlyProhibited')
    // The reason text is what makes this a settled fact rather than the same
    // open question row 1 carries: it states another surface's rule
    // positively. Asserting only the token would pass with the reason lost.
    expect(cell.note).toBe('Explicitly prohibited — no Client Command Center access at all')
    expect(cell.openDecision).toBeNull()
  })

  it('the two cells are not the same way round', () => {
    const row1 = stu16Row('read-the-learning-view').cells['read-only-auditor']
    const row2 = stu16Row('decide-a-lane-b-proposal').cells['read-only-auditor']
    expect(row1.outcome).not.toBe(row2.outcome)
  })

  it('reaches the Auditor’s Studio route as an OPEN DECISION, never as a refusal (AC-STU-157)', () => {
    const reach = reachByStudioMatrix(STU_16_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-with-authoring-grant']).toBe('offered')
    expect(reach['supervisor-without-grant']).toBe('withheld')
    expect(reach.worker).toBe('withheld')
    // The Tenant Admin's two `Allowed with conditions` cells are on
    // `another-surface` rows, so they do not open this route. That agrees
    // with the consolidated matrix at L34556, which prohibits the Tenant
    // Admin from the learning view outright.
    expect(reach['tenant-admin']).toBe('withheld')
    expect(reach['implementation-team']).toBe('withheld')
    // Every persona the vocabulary heads is answered, none omitted.
    expect(Object.keys(reach).sort()).toEqual(STU_PERSONAS.map((p) => p.id).sort())
  })
})

/* ==================================================================== *
 * THE THREE ROWS THAT DESCRIBE ANOTHER SURFACE.
 * ==================================================================== */

describe('an `another-surface` row is never an enabled Studio control, whatever its token reads', () => {
  it('classifies exactly rows 2, 5 and 6 as another surface', () => {
    expect([...STU_16_OTHER_SURFACE_ROW_IDS]).toEqual([
      'decide-a-lane-b-proposal',
      'set-retention-within-allowed-bounds-on-memory',
      'set-the-personal-information-policy-on-profile-memory',
    ])
  })

  it('is exactly the three rows whose permissive cell names WHERE', () => {
    expect(stu16Row('decide-a-lane-b-proposal').cells['quality-manager'].note).toBe(
      'Allowed — in the Client Command Center',
    )
    expect(stu16Row('set-retention-within-allowed-bounds-on-memory').cells['tenant-admin'].note).toBe(
      'Allowed with conditions — in the tenant administration area, within platform bounds',
    )
    expect(
      stu16Row('set-the-personal-information-policy-on-profile-memory').cells['tenant-admin'].note,
    ).toBe('Allowed with conditions — in the tenant administration area')
  })

  it('offers a control for no one of them, for any persona, even where the cell says Allowed', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const controlled = learningControls(stu16Scenario({ persona })).map((c) => c.id)
      for (const id of STU_16_OTHER_SURFACE_ROW_IDS) expect(controlled).not.toContain(id)
    }
    // And the permissive tokens really are permissive — otherwise the
    // assertion above would be satisfied by a refusal rather than by the
    // classification, which is the vacuous version of this test.
    expect(stu16Decision('decide-a-lane-b-proposal', stu16Scenario()).outcome).toBe('allowed')
    expect(
      stu16Decision(
        'set-retention-within-allowed-bounds-on-memory',
        stu16Scenario({ persona: 'tenant-admin' }),
      ).outcome,
    ).toBe('allowedWithConditions')
  })

  it('states each of them instead, for the persona that holds it elsewhere', () => {
    const statements = otherSurfaceStatements(stu16Scenario({ persona: 'tenant-admin' }))
    expect(statements.map((s) => s.id)).toEqual([...STU_16_OTHER_SURFACE_ROW_IDS])
    for (const statement of statements) expect(statement.onAnotherSurface).toBe(true)
    const retention = statements.find(
      (s) => s.id === 'set-retention-within-allowed-bounds-on-memory',
    )
    expect(retention?.affordance.kind).toBe('enabled')
  })

  it('partitions the card totally: read gate, acts, statements, other surfaces', () => {
    const screenRows = STU_16_MATRIX.filter((r) => r.surface === 'screen').map((r) => r.id)
    const partitioned = [
      LEARNING_READ_ROW_ID,
      ...STU_16_ACT_ROW_IDS,
      ...STU_16_STATEMENT_ROW_IDS,
    ] as readonly Stu16RowId[]
    expect([...partitioned].sort()).toEqual([...screenRows].sort())
    expect(new Set(partitioned).size).toBe(partitioned.length)
    // Every act row is a screen row. Reclassifying one turns this red.
    for (const id of STU_16_ACT_ROW_IDS) expect(stu16Row(id).surface).toBe('screen')
  })
})

/* ==================================================================== *
 * STEP 2 — no worker is a grouping key. S11, indirect but real.
 * ==================================================================== */

describe('support, not surveillance: the panel groups by asset and the signal has four keys', () => {
  it('groups coaching effectiveness by asset, never by worker', () => {
    const rows = coachingEffectiveness(SEEDED_LIBRARY_REGISTER, SEEDED_LANE_A_LEDGER)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(namesPersonBehaviouralMeasure(Object.keys(r))).toBe(false)
    expect(Object.keys(rows[0]!)).toContain('assetId')
  })

  it('keys the Lane-A signal on asset, language, pattern and screen only (L34166)', () => {
    expect(Object.keys(laneASignal())).toEqual(['assetId', 'locale', 'failurePattern', 'screenId'])
    expect([...LANE_A_SIGNAL_KEYS]).toEqual(['assetId', 'locale', 'failurePattern', 'screenId'])
  })

  it('keeps the predicate’s own vocabulary honest — weakening the list turns this red', () => {
    // Without this, a defect that emptied PERSON_TERMS would leave the two
    // assertions above green while the check they rely on had stopped
    // checking. That is a test helper scoped to exclude the defect it names,
    // and this build has shipped one.
    for (const term of ['worker', 'operator', 'employee', 'person', 'identity', 'badge', 'user']) {
      expect(PERSON_TERMS).toContain(term)
    }
    expect(namesPersonBehaviouralMeasure(['workerResolutionRate'])).toBe(true)
    expect(namesPersonBehaviouralMeasure(['operatorId'])).toBe(true)
    // An ASSET's measure is not a person's, and the predicate must not
    // refuse it — a check that flagged `resolutionRate` would force the
    // panel to drop the figure the source asks for by name (L34293).
    expect(namesPersonBehaviouralMeasure(['resolutionRate', 'sampleSize', 'assetName'])).toBe(false)
  })

  it('carries no worker identity anywhere in the panel’s values, not only in its keys', () => {
    const rows = coachingEffectiveness(SEEDED_LIBRARY_REGISTER, SEEDED_LANE_A_LEDGER)
    // The seeded personas are `IDN-BB-*`. A key-only check would pass with a
    // worker identifier sitting in a value.
    expect(JSON.stringify(rows)).not.toMatch(/IDN-/)
    expect(JSON.stringify(SEEDED_LANE_A_LEDGER)).not.toMatch(/IDN-/)
  })

  it('reads the LIVE register, so retiring an asset changes what the panel says', () => {
    const before = coachingEffectiveness(SEEDED_LIBRARY_REGISTER, SEEDED_LANE_A_LEDGER)
    expect(before.find((r) => r.assetId === 'AST-STALE-CLIP-EN')?.assetState).toBe(
      'Flagged for review',
    )
    const retired = learningService.retireAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: 'AST-STALE-CLIP-EN',
      actor: { identityId: ELENA, displayName: 'quality-manager', tenant: SEEDED_TENANT },
      decision: stu16Decision(
        'flag-or-retire-a-low-performing-coaching-asset',
        stu16Scenario({ persona: 'quality-manager' }),
      ),
      writeAudit: () => ({ ok: true }),
    })
    const after = coachingEffectiveness(retired.register, SEEDED_LANE_A_LEDGER)
    expect(after.find((r) => r.assetId === 'AST-STALE-CLIP-EN')?.assetState).toBe('Retired')
  })

  it('reads that live register FROM STATE on the screen, never from the module-load seed', () => {
    /**
     * A `renderToStaticMarkup` render draws once, so a panel reading the
     * module-load constant instead of the state variable is invisible to
     * every assertion over the markup — the planted defect proved it, staying
     * green while the panel had stopped following the register. This is the
     * structural half, and it is the shape rather than the name: the seeded
     * register may be REFERENCED exactly once on the screen, as the state's
     * initial value. A second reference is a read that bypasses state, which
     * is this build's defect shape 1 — state written and never read.
     */
    const view = code(join(LEARNING_ROUTE_DIR, 'LearningView.tsx'))
    const references = [...view.matchAll(/\bSEEDED_LIBRARY_REGISTER\b/g)].length
    expect(references).toBe(2) // the import specifier, and the useState seed
    expect(view).toMatch(/useState<LibraryRegister>\(SEEDED_LIBRARY_REGISTER\)/)
    expect(view).toMatch(/coachingEffectiveness\(register,/)
  })

  it('lists the source’s own four fields per asset (L34293)', () => {
    const rows = coachingEffectiveness(SEEDED_LIBRARY_REGISTER, SEEDED_LANE_A_LEDGER)
    const stale = rows.find((r) => r.assetId === 'AST-STALE-CLIP-EN')
    expect(stale).toBeDefined()
    expect(stale?.resolutionRate).toBeCloseTo(0.12, 5)
    expect(stale?.sampleSize).toBe(75)
    expect(stale?.screensWhereUsed).toEqual([
      'SCREEN-06-TORQUE-PHOTOGRAPH',
      'SCREEN-09-FINAL-INSPECTION',
    ])
    expect(stale?.flagged).toBe(true)

    // Cold start is a real state: an asset nothing has used has not failed.
    const unused = rows.find((r) => r.assetId === 'AST-PAINT-DEPTH-EN')
    expect(unused?.resolutionRate).toBeNull()
    expect(unused?.flagged).toBe(false)

    // A high rate on four selections is not evidence, and is not a flag
    // either way.
    const thin = rows.find((r) => r.assetId === 'AST-TORQUE-ANGLE-ES')
    expect(thin?.sampleSize).toBe(4)
    expect(thin?.flagged).toBe(false)
    expect(thin?.flagNote).toMatch(/below the 20/i)
  })
})

/* ==================================================================== *
 * THE LANE BOUNDARY — an absent edge, in both directions.
 * ==================================================================== */

function exportedNames(source: string): readonly string[] {
  return [
    ...source.matchAll(/export\s+(?:const|function|interface|type|class)\s+([A-Za-z0-9_]+)/g),
  ].map((m) => m[1] ?? '')
}

describe('the two lanes reference each other nowhere, in either direction', () => {
  const laneA = code(join(STU_16_DIR, 'lane-a.ts'))
  const laneB = code(join(STU_16_DIR, 'lane-b.ts'))

  it('draws no import edge either way', () => {
    expect(laneA).not.toMatch(/from\s+['"]\.\/lane-b['"]/)
    expect(laneB).not.toMatch(/from\s+['"]\.\/lane-a['"]/)
  })

  it('names none of the other lane’s exported symbols in code', () => {
    const aNames = exportedNames(laneA)
    const bNames = exportedNames(laneB)
    expect(aNames.length).toBeGreaterThan(5)
    expect(bNames.length).toBeGreaterThan(5)
    for (const name of bNames) {
      expect(laneA, `lane-a.ts names lane-b’s ${name}`).not.toMatch(
        new RegExp(`\\b${name}\\b`),
      )
    }
    for (const name of aNames) {
      expect(laneB, `lane-b.ts names lane-a’s ${name}`).not.toMatch(
        new RegExp(`\\b${name}\\b`),
      )
    }
  })

  it('applies the single test in exactly one place, and routes both lanes from it', () => {
    const corpus = taskCorpus()

    /**
     * CALL sites only — the definition is excluded by the lookbehind.
     * Counting `X(` outright counts `export function X(` as a call, which
     * makes "one call site" read as two and the gate unsatisfiable. It read
     * two on the first run for exactly that reason.
     */
    const callSites = (name: string): number =>
      [...corpus.matchAll(new RegExp(`(?<!function\\s)\\b${name}\\s*\\(`, 'g'))].length

    // ONE definition of the question.
    expect([...corpus.matchAll(/function altersAConfiguredOperatingValue\b/g)].length).toBe(1)
    // ONE caller of each Lane-A mutator, and it is the audited path. A second
    // call site would be a write that skipped the audit — the shape this
    // build shipped when an audit contract reached one handler of four.
    expect(callSites('applyLaneASignal')).toBe(1)
    expect(callSites('reverseLaneARefinement')).toBe(1)
    // And the audited path is reached from the router, not from the screen.
    expect(callSites('applyLearningAct')).toBe(2)
  })

  it('routes a configured-value candidate to Lane B and applies NOTHING', () => {
    const weights: SelectionWeights = { existing: 3 }
    const written: LearningAuditEntry[] = []
    const sink: LearningAuditWrite = (entry) => {
      written.push(entry)
      return { ok: true }
    }
    const proposal = SEEDED_OPEN_PROPOSALS[0]!

    const routed = routeRefinement(weights, { kind: 'configured-value', proposal }, ELENA, sink)
    expect(routed.lane).toBe('B')
    if (routed.lane !== 'B') throw new Error('unreachable')
    expect(routed.proposal.currentValue).toBe('80 per cent of expected time')
    expect(routed.proposal.proposedValue).toBe('75 per cent of expected time')
    // Nothing was applied, nothing was audited, and the arm has no field a
    // change could have travelled in.
    expect(Object.keys(routed)).toEqual(['lane', 'proposal', 'note'])
    expect(written).toEqual([])
    expect(weights).toEqual({ existing: 3 })
    expect(laneOf({ kind: 'configured-value', proposal })).toBe('B')
    expect(altersAConfiguredOperatingValue({ kind: 'configured-value', proposal })).toBe(true)
  })

  it('routes a selection candidate to Lane A, applies it, and audits it', () => {
    const written: LearningAuditEntry[] = []
    const observation = SEEDED_LANE_A_LEDGER[0]!
    const routed = routeRefinement({}, { kind: 'selection', observation }, ELENA, (entry) => {
      written.push(entry)
      return { ok: true }
    })
    expect(routed.lane).toBe('A')
    if (routed.lane !== 'A') throw new Error('unreachable')
    expect(routed.result.outcome).toBe('applied')
    expect(written.map((e) => e.act)).toEqual(['apply-lane-a-refinement'])
    expect(written[0]!.actorIdentityId).toBe(ELENA)
    expect(altersAConfiguredOperatingValue({ kind: 'selection', observation })).toBe(false)
  })
})

/* ==================================================================== *
 * THE STUDIO CANNOT MINT A DECISION — a structural gate.
 * ==================================================================== */

describe('nothing in this module can produce a Lane-B decision', () => {
  it('writes a `deciderIdentityId` nowhere under this task’s path list', () => {
    // THE STRUCTURE, NOT THE NAME. A future `confirmChange()` minting a
    // receipt would pass any check written against the words "approve" or
    // "reject"; it cannot pass this one, because a decision that names no
    // decider is not a decision the audit trail can carry (L34320).
    //
    // `readonly deciderIdentityId: string` is the TYPE declaration and is
    // excluded by the lookahead; anything else after the colon is a value
    // being written.
    //
    // THE LOOKAHEAD SITS INSIDE THE WHITESPACE, NOT AFTER IT, AND THAT IS
    // NOT A STYLE CHOICE. Written `\s*(?!string\b)` the `\s*` backtracks to
    // zero width, the lookahead then reads " string", finds it does not
    // begin with "string", and SUCCEEDS — so the gate matched its own type
    // declaration and could never have gone green. It was red on first run
    // for exactly that reason and the task report records it.
    const offenders = taskFiles().filter((f) =>
      /deciderIdentityId\s*:(?!\s*string\b)/.test(code(f)),
    )
    expect(offenders).toEqual([])
    // Non-vacuous: the field really is declared somewhere, so an empty
    // result is a statement about writes and not about the field's absence.
    expect(taskCorpus()).toMatch(/readonly deciderIdentityId: string/)
  })

  it('offers no Lane-B decide control on any Studio route, for any persona', () => {
    for (const persona of PERSONAS_THE_SHELL_RENDERS) {
      const markup = html(persona)
      const named = buttonNames(markup).filter((name) => /approve|reject|decide/i.test(name))
      expect(named, `persona ${persona} was offered ${named.join(', ')}`).toEqual([])
    }
    // Non-vacuous: the screen does draw buttons, so an empty result above is
    // a statement about WHICH buttons rather than about there being none.
    expect(buttonNames(html('quality-manager')).length).toBeGreaterThan(0)
  })

  it('names the Client Command Center as where the decision is made, and links at no route that does not exist', () => {
    const markup = html('quality-manager')
    for (const proposal of SEEDED_OPEN_PROPOSALS) {
      expect(markup).toContain(`decided-at-${proposal.id}`)
    }
    expect(visibleText(markup)).toMatch(
      /Decided in the Client Command Center, where a Quality Manager accepts or rejects it exactly once/,
    )
    // SB-STU-19 describes each proposal as "linking to the Client Command
    // Center". That surface is slice 9's and no route to it exists here, so
    // the screen names it instead of pointing at a page that is not there.
    // An anchor to a non-existent route is the same false claim inverted.
    for (const link of links(markup)) {
      expect(link.href).not.toMatch(/command-cent/i)
    }
    expect(visibleText(markup)).toContain('The Studio displays, it does not decide.')
  })

  it('renders the cross-slice seam that owns the decision', () => {
    const markup = html('quality-manager')
    const text = visibleText(markup)
    expect(text).toContain('Cross-slice seam — not built here: Lane-B decision')
    expect(text).toContain('MOD-CC-06 / MOD-CC-13 action 3')
  })
})

/* ==================================================================== *
 * STEP 3 — row 4 invents no control.
 * ==================================================================== */

describe('the absence of an off switch is a statement, not a disabled toggle', () => {
  it('renders the sentence and no switch of any kind, for every persona the shell renders', () => {
    for (const persona of PERSONAS_THE_SHELL_RENDERS) {
      const markup = html(persona)
      expect(markup, `persona ${persona}`).not.toMatch(/role="switch"/)
      expect(markup, `persona ${persona}`).not.toMatch(/type="checkbox"/)
      expect(visibleText(markup)).toContain('there is no separate on/off switch')
      // Not a disabled control either: `Explicitly prohibited` carries no
      // rendering anywhere, and a disabled toggle would imply a condition
      // that could become true.
      const named = buttonNames(markup).filter((n) => /learning/i.test(n) && /on|off/i.test(n))
      expect(named).toEqual([])
    }
  })

  it('carries the source’s own reason on the cell (L34197, L34177)', () => {
    expect(stu16Row('turn-learning-off').cells['quality-manager'].note).toBe(
      'Explicitly prohibited — there is no separate on/off switch',
    )
    for (const column of STUDIO_PERSONA_COLUMNS) {
      expect(stu16Row('turn-learning-off').cells[column].outcome).toBe('explicitlyProhibited')
    }
  })
})

/* ==================================================================== *
 * STEP 4 — ageing, staleness, and never expiring.
 * ==================================================================== */

describe('an undecided proposal ages visibly and never expires silently', () => {
  const proposal = SEEDED_OPEN_PROPOSALS[0]!

  it('never auto-approves a proposal and flags it stale at 30 days without expiring it', () => {
    const p = advanceProposalAge(proposal, 31)
    expect(p.state).toBe('Stale-flagged')
    expect(p.expired).toBe(false)
  })

  it('flags at exactly 30 days and not at 29', () => {
    expect(STALE_FLAG_DAYS).toBe(30)
    expect(advanceProposalAge(proposal, 29).state).toBe('Proposed')
    expect(advanceProposalAge(proposal, 30).state).toBe('Stale-flagged')
    // Non-vacuous in the other direction too: the seed starts Proposed, so
    // "Stale-flagged" is a change rather than the fixture's own value.
    expect(proposal.state).toBe('Proposed')
  })

  it('is still open at 400 days — ageing is a flag, never an expiry', () => {
    const old = advanceProposalAge(proposal, 400)
    expect(old.expired).toBe(false)
    expect(old.state).toBe('Stale-flagged')
    expect(staleBadge(old)).toMatch(/still open/)
    expect(staleBadge(advanceProposalAge(proposal, 1))).toBeNull()
  })

  it('names the six states of L34212 and holds only the two open ones', () => {
    expect([...LANE_B_PROPOSAL_STATES]).toEqual([
      'Proposed',
      'Stale-flagged',
      'Approved',
      'Rejected',
      'Published as a patch',
      'Applied immediately',
    ])
    for (const seeded of SEEDED_OPEN_PROPOSALS) {
      expect(['Proposed', 'Stale-flagged']).toContain(seeded.state)
      expect(seeded.expired).toBe(false)
    }
  })
})

/* ==================================================================== *
 * STEP 7 — Lane A reverses; Lane B publishes a patch; runs stay pinned.
 * ==================================================================== */

describe('Lane A is reversible, and reversing restores the prior selection', () => {
  it('restores the exact weight the refinement replaced, and logs both acts', () => {
    const observation = SEEDED_LANE_A_LEDGER[2]!
    const key = laneASignalKey(observation.signal)
    const before: SelectionWeights = { [key]: 1.7 }

    const applied = applyLaneASignal(before, observation)
    expect(applied.weights[key]).toBeCloseTo(0.24, 5)
    expect(applied.refinement.priorWeight).toBe(1.7)

    const reversed = reverseLaneARefinement(applied.weights, applied.refinement)
    expect(reversed.weights[key]).toBe(1.7)
    // A reset to the default would be a second automatic change dressed as
    // an undo. The prior weight here is deliberately NOT the default.
    expect(reversed.weights[key]).not.toBe(1)
  })

  it('logs the reversal through the one audited path, and refuses it where the audit fails', () => {
    const observation = SEEDED_LANE_A_LEDGER[2]!
    const applied = applyLaneASignal({}, observation)
    const written: LearningAuditEntry[] = []

    const ok = learningService.reverseRefinement(
      applied.weights,
      applied.refinement,
      ELENA,
      (entry) => {
        written.push(entry)
        return { ok: true }
      },
    )
    expect(ok.outcome).toBe('applied')
    expect(written.map((e) => e.act)).toEqual(['reverse-lane-a-refinement'])

    const refused = learningService.reverseRefinement(
      applied.weights,
      applied.refinement,
      ELENA,
      () => ({ ok: false, reason: 'the sink is down' }),
    )
    expect(refused.outcome).toBe('refused')
    if (refused.outcome !== 'refused') throw new Error('unreachable')
    expect(refused.reason).toMatch(/an action that cannot be audited does not happen/i)
  })

  it('applies the whole backlog through the single test and audits every one of them', () => {
    const written: LearningAuditEntry[] = []
    const backlog = applyLaneABacklog({}, SEEDED_LANE_A_LEDGER, ELENA, (entry) => {
      written.push(entry)
      return { ok: true }
    })
    expect(backlog.refinements.length).toBe(SEEDED_LANE_A_LEDGER.length)
    expect(written.length).toBe(SEEDED_LANE_A_LEDGER.length)
    expect(backlog.refusals).toEqual([])
    // And nothing is applied at all when the audit sink refuses.
    const blocked = applyLaneABacklog({}, SEEDED_LANE_A_LEDGER, ELENA, () => ({
      ok: false,
      reason: 'the sink is down',
    }))
    expect(blocked.refinements).toEqual([])
    expect(blocked.weights).toEqual({})
    expect(blocked.refusals.length).toBe(SEEDED_LANE_A_LEDGER.length)
  })
})

describe('the package test follows the decision, and cannot reach an in-flight run', () => {
  const packageBorne = SEEDED_OPEN_PROPOSALS[0]!
  const serverOnly = SEEDED_OPEN_PROPOSALS[1]!
  const accepted = (id: string): LaneBDecisionReceipt => ({
    proposalId: id,
    outcome: 'accepted',
    deciderIdentityId: ELENA,
    decidedAt: '2026-08-14T10:00:00Z',
  })

  it('auto-publishes a package-borne value as a PATCH', () => {
    const outcome = applyPackageTest(packageBorne, accepted(packageBorne.id), 'v2.1.0')
    expect(outcome.route).toBe('package-borne')
    if (outcome.route !== 'package-borne') throw new Error('unreachable')
    expect(outcome.state).toBe('Published as a patch')
    expect(outcome.bump).toBe('PATCH')
    expect(outcome.versionNumber).toBe('v2.1.1')
    expect(outcome.note).toMatch(/no second approval, no ceremony/i)
  })

  it('applies a server-only value immediately, minting no version', () => {
    const outcome = applyPackageTest(serverOnly, accepted(serverOnly.id), 'v2.1.0')
    expect(outcome.route).toBe('server-only')
    if (outcome.route !== 'server-only') throw new Error('unreachable')
    expect(outcome.state).toBe('Applied immediately')
    expect(Object.keys(outcome)).not.toContain('versionNumber')
  })

  it('refuses to route a value whose package assignment DEC-PKGFIELD-001 leaves open', () => {
    const unassigned: OpenProposal = { ...packageBorne, packageBorne: null }
    const outcome = applyPackageTest(unassigned, accepted(unassigned.id), 'v2.1.0')
    expect(outcome.route).toBe('undetermined')
    if (outcome.route !== 'undetermined') throw new Error('unreachable')
    expect(outcome.openDecision).toBe('DEC-PKGFIELD-001')
    expect(outcome.note).toMatch(/Nothing was published and nothing was applied/)
  })

  it('records a rejection and changes the configured value not at all', () => {
    const outcome = applyPackageTest(
      packageBorne,
      { ...accepted(packageBorne.id), outcome: 'rejected' },
      'v2.1.0',
    )
    expect(outcome.route).toBe('rejected')
    if (outcome.route !== 'rejected') throw new Error('unreachable')
    expect(outcome.state).toBe('Rejected')
    expect(outcome.note).toMatch(/The configured value is unchanged/)
  })

  it('refuses a receipt that belongs to another proposal — "exactly once" must stay true', () => {
    expect(() => applyPackageTest(packageBorne, accepted(serverOnly.id), 'v2.1.0')).toThrow(
      /exactly once/,
    )
  })

  it('leaves in-flight runs pinned, because nothing here can reach one', () => {
    // The observable half. The run is the source's own (L34324).
    const runs: readonly PinnedRun[] = [
      { runId: 'RUN-2026-08-14-A', jobId: 'JOB-BB-01', pinnedVersion: 'v2.1.0', inFlight: true },
    ]
    const before = JSON.stringify(runs)
    const outcome = applyPackageTest(packageBorne, accepted(packageBorne.id), 'v2.1.0')
    expect(outcome.route).toBe('package-borne')
    expect(JSON.stringify(runs)).toBe(before)
    expect(runs[0]!.pinnedVersion).toBe('v2.1.0')

    // The structural half, which is the one that survives a refactor. This
    // module names no run type and writes no run field anywhere, so there is
    // nothing to delete that would re-open the hole.
    const offenders = taskFiles().filter((f) => /\bPinnedRun\b|\bpinnedVersion\b/.test(code(f)))
    expect(offenders).toEqual([])
    expect(applyPackageTest.length).toBe(3)
  })
})

/* ==================================================================== *
 * STEP 8 — the audit refuses the act, on both paths.
 * ==================================================================== */

function coachingAssetIn(register: LibraryRegister, id: string): CoachingAssetItem {
  const item = itemById(register, id)
  if (item === undefined || item.library !== 'coaching-corpus') {
    throw new Error(`no coaching asset ${id}`)
  }
  return item
}

describe('an act that cannot be audited does not happen', () => {
  const FLAGGED = 'AST-STALE-CLIP-EN'
  const actor: LibraryActor = {
    identityId: ELENA,
    displayName: 'quality-manager',
    tenant: SEEDED_TENANT,
  }
  const decision = stu16Decision(
    'flag-or-retire-a-low-performing-coaching-asset',
    stu16Scenario({ persona: 'quality-manager' }),
  )
  const committing: LibraryAuditWrite = () => ({ ok: true })
  const failing: LibraryAuditWrite = () => ({ ok: false, reason: 'the sink is down' })

  it('starts from a flagged asset that IS approved, so neither assertion below is vacuous', () => {
    const asset = coachingAssetIn(SEEDED_LIBRARY_REGISTER, FLAGGED)
    expect(asset.assetState).toBe('Flagged for review')
    expect(asset.approved).toBe(true)
  })

  it('retires the asset when the audit commits — the act is capable of the change', () => {
    const result = learningService.retireAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: FLAGGED,
      actor,
      decision,
      writeAudit: committing,
    })
    expect(result.ok).toBe(true)
    const asset = coachingAssetIn(result.register, FLAGGED)
    expect(asset.assetState).toBe('Retired')
    expect(asset.approved).toBe(false)
  })

  it('leaves the asset Approved when the audit write fails', () => {
    const result = learningService.retireAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: FLAGGED,
      actor,
      decision,
      writeAudit: failing,
    })
    expect(result.ok).toBe(false)
    const asset = coachingAssetIn(result.register, FLAGGED)
    expect(asset.approved).toBe(true)
    expect(asset.assetState).toBe('Flagged for review')
  })

  it('retires nothing for a persona the card refuses, and audits nothing either', () => {
    let calls = 0
    const result = learningService.retireAsset({
      register: SEEDED_LIBRARY_REGISTER,
      itemId: FLAGGED,
      actor,
      decision: stu16Decision(
        'flag-or-retire-a-low-performing-coaching-asset',
        stu16Scenario({ persona: 'supervisor-with-authoring-grant' }),
      ),
      writeAudit: () => {
        calls += 1
        return { ok: true }
      },
    })
    expect(result.ok).toBe(false)
    expect(calls).toBe(0)
    expect(coachingAssetIn(result.register, FLAGGED).approved).toBe(true)
    // The card's own words for that cell (L34202).
    expect(
      stu16Row('flag-or-retire-a-low-performing-coaching-asset').cells[
        'supervisor-with-authoring-grant'
      ].note,
    ).toBe('Explicitly prohibited — may propose')
  })

  it('writes no memory layer when the audit write fails, and both layers when it commits', () => {
    const committed = applyLearningAct(
      {},
      {
        act: 'write-memory-on-publication',
        versionNumber: 'v2.1.0',
        qualificationRequirements: ['Torque tool certification, current'],
      },
      ELENA,
      () => ({ ok: true }),
    )
    expect(committed.outcome).toBe('applied')
    if (committed.outcome !== 'applied') throw new Error('unreachable')
    expect(committed.writes.map((w) => w.store)).toEqual(['procedural', 'semantic'])

    const refused = applyLearningAct(
      {},
      { act: 'write-memory-on-publication', versionNumber: 'v2.1.0', qualificationRequirements: [] },
      ELENA,
      () => ({ ok: false, reason: 'the sink is down' }),
    )
    expect(refused.outcome).toBe('refused')
  })
})

/* ==================================================================== *
 * THE FIVE TYPED STORES AND THE BOUNDARY AROUND THEM.
 * ==================================================================== */

describe('the memory architecture is platform-owned and the Studio writes two of five', () => {
  it('names the five stores of L34162 with the source’s own parentheses', () => {
    expect(MEMORY_STORES.map((s) => s.id)).toEqual([
      'working',
      'episodic',
      'semantic',
      'procedural',
      'profile',
    ])
    expect(MEMORY_STORES.find((s) => s.id === 'working')?.holds).toBe(
      'the live context of a Run',
    )
    expect(MEMORY_STORES.find((s) => s.id === 'profile')?.holds).toBe(
      'worker and operator profiles',
    )
  })

  it('writes procedural and semantic and no other, and cannot address the other three', () => {
    expect([...STUDIO_WRITTEN_STORES]).toEqual(['procedural', 'semantic'])
    expect(MEMORY_STORES.filter((s) => s.writtenByStudio).map((s) => s.id).sort()).toEqual([
      'procedural',
      'semantic',
    ])
    expect(writeOnPublication('v2.1.0', []).map((w) => w.store)).toEqual([
      'procedural',
      'semantic',
    ])
  })

  it('refuses an architecture change through MOD-STU-01’s own Tier-2 table, not a second copy', () => {
    const refusal = memoryArchitectureRefusal()
    expect(refusal.outcome).toBe('explicitlyProhibited')
    expect(refusal.defineClass).toBe(true)
    expect(refusal.example).toBe('Adding a sixth typed memory store')
    expect(refusal.reason).toMatch(/not merely hidden in the user interface/)
    // One spelling: the classification is read from MOD-STU-01, and this
    // module declares no refusal table of its own.
    expect(taskCorpus()).not.toMatch(/TIER_TWO_CLASSIFICATION\s*=/)
  })

  it('states anonymisation as the one irreversible act, and never in Regulated-Industry mode', () => {
    expect(anonymisationPolicy('standard-commercial').anonymisesAfterMonths).toBe(24)
    expect(anonymisationPolicy('regulated-industry').anonymisesAfterMonths).toBeNull()
    for (const mode of ['standard-commercial', 'regulated-industry'] as const) {
      expect(anonymisationPolicy(mode).irreversible).toBe(true)
      expect(anonymisationPolicy(mode).statement).toMatch(/one irreversible act/)
    }
  })
})

/* ==================================================================== *
 * STEP 6 — the DEC-LANEB-001 disclosure is TASK 7'S, not a second one.
 * ==================================================================== */

describe('the open decisions render through the one disclosure component', () => {
  it('renders DEC-LANEB-001 with both of task 7’s locator sets', () => {
    const markup = html('quality-manager')
    const text = visibleText(markup)
    const d14 = studioDecision('D14')
    expect(d14.decisionRef).toBe('DEC-LANEB-001')
    for (const reading of d14.readings) expect(text).toContain(`[${reading.locator}]`)
    expect(text).toContain('AC-STU-097 · L33397 · card DEC-LANEB-001 L33253')
    expect(text).toContain('AC-STU-138 · L34332 · card DEC-LANEB-001 L33253')
    expect(text).toContain('A client-delegated choice under APP-012')
  })

  it('renders DEC-LANEBAUTH-001 and settles the Supervisor-with-grant cell as OPEN', () => {
    const text = visibleText(html('quality-manager'))
    const d18 = studioDecision('D18')
    expect(d18.decisionRef).toBe('DEC-LANEBAUTH-001')
    for (const reading of d18.readings) expect(text).toContain(`[${reading.locator}]`)
    const cell = stu16Row('decide-a-lane-b-proposal').cells['supervisor-with-authoring-grant']
    expect(cell.outcome).toBe('clientDecisionRequired')
    expect(cell.openDecision).toBe('DEC-LANEBAUTH-001')
  })

  it('writes no second disclosure of its own — the prose lives in the canon', () => {
    const corpus = taskCorpus()
    // The structure a second disclosure has: readings with locators, and an
    // adopted position. Scanned as a shape, not as a component name.
    expect(corpus).not.toMatch(/readings\s*:\s*\[/)
    expect(corpus).not.toMatch(/locator\s*:\s*['"]/)
    // And the canon's own copy of the text is not duplicated here.
    for (const reading of studioDecision('D14').readings) {
      expect(corpus).not.toContain(reading.text.slice(0, 60))
    }
  })

  it('discloses DEC-PKGFIELD-001 through MOD-STU-14’s existing record, and says the canon has none', () => {
    const record = STU_14_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-PKGFIELD-001')
    expect(record).toBeDefined()
    const text = visibleText(html('quality-manager'))
    expect(text).toContain('Open decision — DEC-PKGFIELD-001')
    expect(text).toContain(record!.canonNote.slice(0, 60))
  })
})

/* ==================================================================== *
 * WHAT THE SCREEN CLAIMS, AND WHAT IT MUST NOT.
 * ==================================================================== */

describe('the screen claims no capability it only simulates', () => {
  it('says plainly that the ledger is seeded and that nothing was learned here', () => {
    const text = visibleText(html('quality-manager'))
    expect(text).toContain('Nothing on this screen learned anything.')
    expect(text).toMatch(/No model is trained here, no weight persists between page loads/)
    expect(text).toContain('These proposals are seeded fixtures.')
    expect(text).toMatch(/no proposal was assembled by a model/)
  })

  it('renders SB-STU-19’s footer verbatim, unconditionally, for every persona the shell renders', () => {
    for (const persona of PERSONAS_THE_SHELL_RENDERS) {
      expect(visibleText(html(persona)), `persona ${persona}`).toContain(LEARNING_FOOTER)
    }
    expect(LEARNING_FOOTER).toBe(
      'Nothing here changes a configured value without a person approving it. Lane A changes no ' +
        'configured value at all.',
    )
  })

  it('states the tenant-isolation boundary at any privilege level (AC-STU-142)', () => {
    const text = visibleText(html('quality-manager'))
    expect(text).toMatch(/nothing is shared across tenants, and nothing is exported as external training data/)
    expect(text).toMatch(/one irreversible act/)
  })

  it('builds no panel at all where the read is refused — scope is in the read', () => {
    // Every persona the card refuses row 1 to, including the Worker, whose
    // route the shell refuses one level above this module.
    for (const persona of ['worker', 'supervisor-without-grant', 'tenant-admin'] as const) {
      expect(learningViewIsOpen(stu16Scenario({ persona }))).toBe(false)
      const text = visibleText(html(persona))
      // Not built, not built-and-hidden: no asset, no proposal, no case.
      expect(text).not.toContain('AST-STALE-CLIP-EN')
      expect(text).not.toContain('PROP-2026-07-014')
      expect(text).not.toContain('CASE-2025-11-0184')
    }
    // For the two the SHELL admits, the architecture, the isolation boundary
    // and the footer still render, because those are the module's contract
    // rather than this tenant's learned content. The Worker is excluded from
    // this half by the shell's own rule, not by this module's.
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      expect(PERSONAS_THE_SHELL_RENDERS).toContain(persona)
      expect(visibleText(html(persona))).toContain(LEARNING_FOOTER)
    }
    // AC-STU-150 (L34667): the Worker reaches no Studio route by any means,
    // so this screen draws nothing at all for that persona — not even its
    // own contract.
    expect(PERSONAS_THE_SHELL_RENDERS).not.toContain('worker')
    expect(visibleText(html('worker'))).toContain('Not a Studio user')
    expect(visibleText(html('worker'))).not.toContain(LEARNING_FOOTER)
    // Non-vacuous: the same strings DO render for a persona that holds the
    // read, so their absence above is the scope and not a typo.
    const open = visibleText(html('quality-manager'))
    expect(open).toContain('AST-STALE-CLIP-EN')
    expect(open).toContain('PROP-2026-07-014')
    expect(open).toContain('CASE-2025-11-0184')
  })

  it('offers the Quality Manager the two act controls and refuses the read-only personas', () => {
    const qm = learningControls(stu16Scenario({ persona: 'quality-manager' }))
    expect(qm.map((c) => c.id)).toEqual([...STU_16_ACT_ROW_IDS])
    for (const control of qm) expect(control.affordance.kind).toBe('enabled')
    // Every control names a real service function — no bound no-op.
    for (const control of qm) expect(typeof learningService[control.serviceKey]).toBe('function')

    const worker = learningControls(stu16Scenario({ persona: 'worker' }))
    for (const control of worker) expect(control.affordance.kind).toBe('absent')
  })
})

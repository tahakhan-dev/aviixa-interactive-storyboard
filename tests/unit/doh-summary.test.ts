import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  CONTROL_MATRIX,
  DOH_08_CARD_ROW_COUNT,
  DOH_08_CONTRADICTIONS,
  DOH_08_MATRIX_FIRST_LINE,
  DOH_08_MATRIX_LAST_LINE,
  DOH_08_MATRIX_ROW_COUNT,
  UNSPECIFIED_IN_SOURCE,
  doh08Row,
  type Doh08ControlId,
  type Doh08Row,
} from '@/surfaces/doh/modules/doh-08/matrix'
import {
  doh08Affordance,
  doh08RolesReaching,
  doh08RoutedPointers,
} from '@/surfaces/doh/modules/doh-08/rendering'
import {
  adjacentAffordance,
  inlineControlsOnAdjacentCapabilities,
  DOH_BOUNDARY_REGISTER,
} from '@/surfaces/doh/boundary'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import { DOH_CATALOGUE_AB_SWAP, dohScreenById } from '@/surfaces/doh/screens'
import { AGING_BANDS, reviewAgingBand } from '@/surfaces/doh/transitions'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { fixedClock } from '@/domain/clock'
import { AS_OF_MS, REVIEW_QUEUE, ROUTE_PATH, ROUTE_SLUG, bandFor } from '../../app/hub/execution-summary-review/fixtures'

/**
 * MOD-DOH-08 — Execution Summary Review and Distribution.
 *
 * Every count here is MEASURED against the array or against the frozen source,
 * never against a number in a brief. Two of this task's inputs were checked
 * this way and both held: the plan's §1a row-ordinal correction (row 8 is the
 * lot hold, row 14 the review toggle) and the 15-row matrix count.
 */

type TenantRole = keyof (typeof CONTROL_MATRIX)[number]['status']

const ROLES: readonly TenantRole[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

const BLUEPRINT =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'

/** The frozen source, read once. Lines are 1-based, as every locator is. */
const SOURCE_LINES: readonly string[] = readFileSync(BLUEPRINT, 'utf8').split('\n')

function sourceLine(n: number): string {
  const line = SOURCE_LINES[n - 1]
  if (line === undefined) throw new Error(`L${n} is past the end of the frozen source`)
  return line
}

/** A mutable copy of one row, for the plants. The real array is `as const`. */
function mutate(id: Doh08ControlId, patch: Partial<Doh08Row>): Doh08Row {
  return { ...doh08Row(id), ...patch } as Doh08Row
}

describe('MOD-DOH-08 — the matrix, measured rather than quoted', () => {
  it('is 15 data rows, and the span L28300-L28314 encloses exactly them', () => {
    expect(DOH_08_MATRIX_ROW_COUNT).toBe(15)
    expect(CONTROL_MATRIX).toHaveLength(15)
    expect(DOH_08_MATRIX_LAST_LINE - DOH_08_MATRIX_FIRST_LINE + 1).toBe(15)
  })

  it('numbers every row against its own line, so a row ordinal cannot drift', () => {
    CONTROL_MATRIX.forEach((row, index) => {
      expect(row.sourceRef).toBe(`L${DOH_08_MATRIX_FIRST_LINE + index}`)
    })
  })

  it("reads each row's own capability off the frozen source at that line", () => {
    for (const row of CONTROL_MATRIX) {
      const line = sourceLine(Number(row.sourceRef.slice(1)))
      expect(line.startsWith(`| ${row.control} |`)).toBe(true)
    }
  })

  it('confirms the plan §1a ordinals: the lot hold is row 8 and the review toggle is row 14', () => {
    expect(CONTROL_MATRIX[7]?.id).toBe('release-a-severity-1-lot-hold')
    expect(CONTROL_MATRIX[7]?.sourceRef).toBe('L28307')
    expect(CONTROL_MATRIX[13]?.id).toBe('set-the-review-toggle')
    expect(CONTROL_MATRIX[13]?.sourceRef).toBe('L28313')
    // The plan's trap table calls these "row 7" and "row 13". They are not.
    expect(CONTROL_MATRIX[6]?.id).toBe('view-the-anomaly-register')
    expect(CONTROL_MATRIX[12]?.id).toBe('bulk-or-automated-pdf-distribution')
  })

  it('reads the identity card as header, separator and 14 data rows to L28294', () => {
    expect(DOH_08_CARD_ROW_COUNT).toBe(14)
    expect(sourceLine(28279).startsWith('| Field | Content |')).toBe(true)
    expect(sourceLine(28280)).toBe('|---|---|')
    expect(sourceLine(28281)).toContain('`MOD-DOH-08`')
    expect(sourceLine(28294)).toContain('Fallback identifier')
    expect(28294 - 28281 + 1).toBe(DOH_08_CARD_ROW_COUNT)
  })

  it('states a cause in every cell of every row, for every role (L10238)', () => {
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        expect(row.detail[role].trim()).not.toBe('')
      }
    }
  })
})

/* ==================================================================== *
 * THE SIX C1 TRAPS.
 * ==================================================================== */

describe('trap 1 and 2 — row 8, the Severity 1 lot hold', () => {
  const row = doh08Row('release-a-severity-1-lot-hold')

  it("keeps the source's own permissive token and still draws no control", () => {
    // The token is NOT corrected, downgraded or hidden. The source says
    // `Allowed` for the Quality Manager and the matrix goes on saying it.
    expect(cellStatus(row, 'QUALITY_MANAGER')).toBe('allowed')
    expect(row.surface).toBe('another-surface')
    for (const role of ROLES) {
      expect(doh08Affordance(row, role).kind).toBe('cross-surface')
    }
  })

  it('is not answerable from the boundary register, which does not list it', () => {
    // The eight rows at L25719-L25726 carry no lot-hold release. So the row can
    // carry no `boundary` pointer and `CrossSurfaceStatement` cannot render it.
    expect(row.boundary).toBeUndefined()
    const capabilities = DOH_BOUNDARY_REGISTER.map((b) => b.capability.toLowerCase())
    // Word-bounded, not a substring test: "pilot management" in row 1 contains
    // "lot" and would have made this pass for the wrong reason.
    expect(capabilities.some((c) => /\blot\b/.test(c))).toBe(false)
    expect(capabilities.some((c) => /\brelease\b/.test(c))).toBe(false)
    // Reclassification is not in the register either, so neither adjacent row
    // of this card can be handed to `CrossSurfaceStatement`.
    expect(capabilities.some((c) => /\breclassif/.test(c))).toBe(false)
    // `adjacentAffordance` answers it anyway, with a null boundary.
    expect(adjacentAffordance(row, 'allowed')).toEqual({ kind: 'cross-surface', boundary: null })
  })

  it("keeps the Supervisor's request path and its mandatory note, both inside the prohibition token", () => {
    expect(cellStatus(row, 'SUPERVISOR')).toBe('explicitly-prohibited')
    const rendered = doh08Affordance(row, 'SUPERVISOR')
    expect(rendered.kind).toBe('cross-surface')
    if (rendered.kind !== 'cross-surface') throw new Error('unreachable')
    expect(rendered.reason).toContain('may request release with a note')
    expect(rendered.reason).toContain('mandatory')
  })

  it('is restated by the source at every locator the request path is named at', () => {
    expect(sourceLine(28307)).toContain('may request release with a note')
    expect(sourceLine(13401)).toContain('Request release with a note')
    expect(sourceLine(13423)).toContain('Supervisors request with a note')
    expect(sourceLine(49579)).toContain('Supervisors request with a note')
    expect(sourceLine(54228)).toContain('Surface: Client Command Center')
    expect(sourceLine(54242)).toContain('A Supervisor request creates an item, never a release')
    expect(sourceLine(26165)).toContain('Client Command Center action number 4')
  })

  it('ships no second release path: the only release command stays the Command Center one', () => {
    expect(HUB_COMMAND_TYPES.some((t) => /RELEASE/.test(t))).toBe(false)
  })
})

describe('trap 3 — row 10, the Worker correction annotation', () => {
  const row = doh08Row('add-a-correction-annotation')

  it('keeps the grant and renders it ABSENT, because the Worker reaches no Hub route (D11)', () => {
    expect(cellStatus(row, 'WORKER')).toBe('allowed-with-conditions')
    const rendered = doh08Affordance(row, 'WORKER')
    expect(rendered.kind).toBe('absent')
    if (rendered.kind !== 'absent') throw new Error('unreachable')
    expect(rendered.reason).toContain('append-only correction record')
    expect(rendered.reason).toContain('D11')
  })

  it('is a control for the Quality Manager on the same row, so the ABSENCE is not the row refusing', () => {
    expect(doh08Affordance(row, 'QUALITY_MANAGER').kind).toBe('control')
  })

  it('withholds the Worker on EVERY row, not only this one — D11 is asked before the token', () => {
    for (const r of CONTROL_MATRIX) {
      expect(doh08Affordance(r, 'WORKER').kind).not.toBe('control')
      expect(doh08Affordance(r, 'WORKER').kind).not.toBe('disabled')
    }
  })
})

describe('trap 4 — row 5, anomaly-severity reclassification', () => {
  const row = doh08Row('reclassify-an-anomaly-severity')

  it('is classified as another surface and draws no trigger here', () => {
    expect(cellStatus(row, 'QUALITY_MANAGER')).toBe('allowed-with-conditions')
    expect(row.surface).toBe('another-surface')
    expect(doh08Affordance(row, 'QUALITY_MANAGER').kind).toBe('cross-surface')
  })

  it('reads L49578 as the source-of-truth row it is', () => {
    const line = sourceLine(49578)
    expect(line).toContain('Deviation classification')
    expect(line).toContain('mirrors and records; never the trigger')
    expect(line).toContain('Quality Manager reclassification with a recorded reason at review time')
  })

  it('keeps the recorded reason, which both readings share', () => {
    expect(row.detail.QUALITY_MANAGER).toContain('recorded reason')
  })
})

describe('trap 5 — `Unavailable` on the role axis means ABSENT', () => {
  it('renders rows 2 and 7 absent for every column the source withholds', () => {
    const queue = doh08Row('work-the-review-queue')
    const register = doh08Row('view-the-anomaly-register')
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'WORKER'] as const) {
      expect(cellStatus(queue, role)).toBe('unavailable')
      expect(doh08Affordance(queue, role).kind).toBe('absent')
    }
    expect(cellStatus(register, 'SUPERVISOR')).toBe('unavailable')
    expect(doh08Affordance(register, 'SUPERVISOR').kind).toBe('absent')
  })

  it('never turns the withholding token into a read-only or a disabled control', () => {
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        if (cellStatus(row, role) !== 'unavailable') continue
        expect(doh08Affordance(row, role).kind).toBe('absent')
      }
    }
  })

  it('names a THIRD unavailable row the brief does not: row 1, the Worker column', () => {
    // The brief names rows 2 and 7. L28300 carries the token too.
    expect(cellStatus(doh08Row('view-an-execution-summary'), 'WORKER')).toBe('unavailable')
    expect(sourceLine(28300)).toContain('`Unavailable`')
  })

  it('keeps the Supervisor viewing Summaries while the queue and the register withhold', () => {
    // The two standings are different questions and the matrix answers them
    // differently on the same column.
    expect(cellStatus(doh08Row('view-an-execution-summary'), 'SUPERVISOR')).toBe(
      'allowed-with-conditions',
    )
    expect(cellStatus(doh08Row('work-the-review-queue'), 'SUPERVISOR')).toBe('unavailable')
  })
})

describe('trap 6 — row 14, the review toggle', () => {
  const row = doh08Row('set-the-review-toggle')

  it('renders the constraint and not the control, for every role', () => {
    expect(cellStatus(row, 'TENANT_ADMIN')).toBe('allowed-with-conditions')
    expect(row.noControlHere).not.toBeNull()
    for (const role of ROLES) {
      expect(doh08Affordance(row, role).kind).not.toBe('control')
      expect(doh08Affordance(row, role).kind).not.toBe('disabled')
    }
    const rendered = doh08Affordance(row, 'TENANT_ADMIN')
    if (rendered.kind !== 'absent') throw new Error('unreachable')
    expect(rendered.reason).toContain('forced on and not disableable in Regulated-Industry mode')
    expect(rendered.reason).toContain('MOD-DOH-17')
  })

  it('reads L28313 as the row it is', () => {
    expect(sourceLine(28313)).toContain('Set the review toggle')
    expect(sourceLine(28313)).toContain('forced on and not disableable in Regulated-Industry mode')
  })

  it('is the ONLY row that may carry `noControlHere`, so it cannot become a general override', () => {
    const carriers = CONTROL_MATRIX.filter((r) => r.noControlHere !== null).map((r) => r.id)
    expect(carriers).toEqual(['set-the-review-toggle'])
  })
})

/* ==================================================================== *
 * THE STANDING RULE, AND THE PLANTS THAT PROVE IT BITES.
 * ==================================================================== */

describe('the classification decides, never the token', () => {
  it('finds no adjacent capability carrying an inline control today', () => {
    expect(inlineControlsOnAdjacentCapabilities(CONTROL_MATRIX, ROLES, cellStatus)).toEqual([])
  })

  it('PLANT — misclassify row 8 as `screen` and the gate names it, because it points nowhere else', () => {
    // Shape 2 of the gate, the one that actually ships: the cell reads
    // `Allowed`, the row gets classified by its token, and a release button
    // follows honestly from a wrong classification.
    const planted = CONTROL_MATRIX.map((r) =>
      r.id === 'release-a-severity-1-lot-hold' ? mutate(r.id, { surface: 'screen' }) : r,
    )
    // The gate itself does not fire: the row carries no `boundary` pointer,
    // because the register does not list this capability. That is the exact
    // hole this module found in the wave-0 representation.
    expect(inlineControlsOnAdjacentCapabilities(planted, ROLES, cellStatus)).toEqual([])
    // What DOES change, and what this module's own fold catches: the Quality
    // Manager gains a release control on a Hub screen.
    const row = planted.find((r) => r.id === 'release-a-severity-1-lot-hold')
    if (row === undefined) throw new Error('unreachable')
    expect(doh08Affordance(row, 'QUALITY_MANAGER').kind).toBe('control')
    // And the real row does not.
    expect(doh08Affordance(doh08Row('release-a-severity-1-lot-hold'), 'QUALITY_MANAGER').kind).toBe(
      'cross-surface',
    )
  })

  it('PLANT — a row pointing at a register boundary while classified `screen` IS named', () => {
    const planted = [
      {
        id: 'planted-misclassification',
        surface: 'screen' as const,
        boundary: 'qualification-clearance-granting' as const,
      },
    ]
    expect(inlineControlsOnAdjacentCapabilities(planted, ROLES, () => 'allowed')).toEqual([
      'planted-misclassification: points at boundary `qualification-clearance-granting` and is classified `screen`',
    ])
  })

  it('PLANT — flip the fold to read the token first and row 5 grows a trigger', () => {
    // The mutant is written out rather than shared with the real rule: a mutant
    // that shares code with the rule it tests proves nothing.
    const tokenFirst = (row: Doh08Row, role: TenantRole): string => {
      const status: ControlStatus = cellStatus(row, role)
      return status === 'allowed' || status === 'allowed-with-conditions' ? 'control' : 'other'
    }
    expect(tokenFirst(doh08Row('reclassify-an-anomaly-severity'), 'QUALITY_MANAGER')).toBe('control')
    expect(doh08Affordance(doh08Row('reclassify-an-anomaly-severity'), 'QUALITY_MANAGER').kind).toBe(
      'cross-surface',
    )
    expect(tokenFirst(doh08Row('release-a-severity-1-lot-hold'), 'QUALITY_MANAGER')).toBe('control')
    expect(tokenFirst(doh08Row('add-a-correction-annotation'), 'WORKER')).toBe('control')
    expect(doh08Affordance(doh08Row('add-a-correction-annotation'), 'WORKER').kind).toBe('absent')
  })
})

/* ==================================================================== *
 * `routedTo` — indexed, checked, and answered.
 * ==================================================================== */

describe('the routed prohibition', () => {
  it('carries exactly one pointer on the whole card, and the fold indexes it', () => {
    const pointers = doh08RoutedPointers(ROLES)
    expect(pointers).toEqual([
      {
        from: 'edit-a-capture-or-evidence',
        role: 'WORKER',
        to: 'add-a-correction-annotation',
        resolvesTo: 'absent',
      },
    ])
  })

  it('points at a row of THIS matrix, never at a capability it does not hold', () => {
    const ids = CONTROL_MATRIX.map((r) => r.id)
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        const to = row.routedTo[role]
        if (to === null) continue
        expect(ids).toContain(to)
      }
    }
  })

  it("does NOT route row 8's Supervisor cell, because the alternative is on another surface", () => {
    // Pointing `routedTo` at a capability this matrix does not hold is how a
    // disabled control appears for a persona who can never reach the thing it
    // names. The request path renders in the cell's own words instead.
    expect(doh08Row('release-a-severity-1-lot-hold').routedTo.SUPERVISOR).toBeNull()
  })

  it('CHECKS the pointer rather than asserting it: the Worker target does not permit here', () => {
    // The pointer is real — row 10's Worker cell grants the annotation — and it
    // still collapses to ABSENT, because D11 withholds the Hub from the Worker.
    expect(cellStatus(doh08Row('add-a-correction-annotation'), 'WORKER')).toBe(
      'allowed-with-conditions',
    )
    expect(doh08Affordance(doh08Row('edit-a-capture-or-evidence'), 'WORKER').kind).toBe('absent')
    expect(doh08Affordance(doh08Row('add-a-correction-annotation'), 'WORKER').kind).toBe('absent')
  })

  it('COLLAPSES a pointer whose target this persona does not hold — proved on a constructed row', () => {
    // The check inside the `explicitly-prohibited` branch is UNREACHABLE on
    // today's data: the only real pointer is the Worker's, and D11 answers
    // that persona two questions earlier. So a plant that deletes the check
    // stays green against the real matrix, which is the "helper scoped to
    // exclude the defect it names" shape. The check is proved here instead,
    // on a row of exactly the shape a later task would write: a prohibition
    // pointed at a capability nobody holds.
    const planted = mutate('edit-a-capture-or-evidence', {
      routedTo: {
        TENANT_ADMIN: null,
        SUPERVISOR: null,
        QUALITY_MANAGER: 'force-a-re-finalisation',
        READONLY_AUDITOR: null,
        WORKER: null,
      },
    })
    // The target refuses every column, so the pointer sends nobody anywhere.
    expect(doh08Affordance(doh08Row('force-a-re-finalisation'), 'QUALITY_MANAGER').kind).toBe(
      'absent',
    )
    expect(doh08Affordance(planted, 'QUALITY_MANAGER').kind).toBe('absent')
  })

  it('PLANT — give the Quality Manager the same pointer and it becomes a disabled control', () => {
    // Which is the correct rendering for that persona, and is exactly why the
    // pointer may not be written where the source does not name an alternative.
    const planted = mutate('edit-a-capture-or-evidence', {
      routedTo: {
        TENANT_ADMIN: null,
        SUPERVISOR: null,
        QUALITY_MANAGER: 'add-a-correction-annotation',
        READONLY_AUDITOR: null,
        WORKER: 'add-a-correction-annotation',
      },
    })
    expect(doh08Affordance(planted, 'QUALITY_MANAGER').kind).toBe('disabled')
    expect(doh08Affordance(doh08Row('edit-a-capture-or-evidence'), 'QUALITY_MANAGER').kind).toBe(
      'absent',
    )
  })
})

/* ==================================================================== *
 * REACH — derived, never hand-written.
 * ==================================================================== */

describe('who reaches MOD-DOH-08', () => {
  it('derives {Quality Manager, Read-only Auditor} from the matrix', () => {
    expect(doh08RolesReaching()).toEqual(['QUALITY_MANAGER', 'READONLY_AUDITOR'])
  })

  it('agrees exactly with catalogue B at MODULE level, on both of this module’s screens', () => {
    expect(dohScreenById('SCR-DOH-16').catalogueBRoles).toBe('Quality Manager, Read-only Auditor')
    expect(dohScreenById('SCR-DOH-17').catalogueBRoles).toBe('Quality Manager, Read-only Auditor')
  })

  it('does not let the classification smuggle a reach decision', () => {
    // Rows 5 and 8 are the two `another-surface` rows. Neither carries
    // `unavailable` in any column, so reclassifying both back to `screen`
    // must not move the answer. If it did, "the classification decides what
    // renders" would be quietly deciding who gets a route as well.
    const asScreenRows = CONTROL_MATRIX.map((r) =>
      r.surface === 'another-surface' ? mutate(r.id, { surface: 'screen' }) : r,
    )
    expect(rolesReachingByMatrix(asScreenRows, cellStatus)).toEqual(doh08RolesReaching())
  })

  it('is narrowed by TWO withholding rows, not one — measured, and the brief implies one', () => {
    // Drop row 2 (L28301) and only the TENANT ADMIN comes back. The Supervisor
    // is still withheld, by row 7 (L28306) on the Anomaly Register — a second
    // withholding cell in the same column. Measured rather than assumed: the
    // first version of this assertion expected the Supervisor back and was
    // wrong, which is what the measurement was for.
    const withoutQueueRow = CONTROL_MATRIX.filter((r) => r.id !== 'work-the-review-queue')
    expect(rolesReachingByMatrix(withoutQueueRow, cellStatus)).toEqual([
      'TENANT_ADMIN',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
    // Drop both withholding rows and the Supervisor returns; the Worker does
    // not, because row 1 (L28300) withholds it a third time.
    const withoutBoth = withoutQueueRow.filter((r) => r.id !== 'view-the-anomaly-register')
    expect(rolesReachingByMatrix(withoutBoth, cellStatus)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
  })

  it('records that catalogue B narrows SCR-DOH-17 by TWO roles at row level, not one', () => {
    // The screen's own capability rows are L28300 (View a Summary) and L28306
    // (View the Anomaly Register). Derived here rather than transcribed.
    const detailRows = ['view-an-execution-summary', 'view-the-anomaly-register'] as const
    const holding: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions', 'read-only']
    const admitted = ROLES.filter((role) =>
      detailRows.some((id) => holding.includes(cellStatus(doh08Row(id), role))),
    )
    expect(admitted).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
    // Catalogue B's cell names two of the four. The Tenant Admin AND the
    // Supervisor are both omitted; the wave-0 narrowing register names only
    // the Tenant Admin, which is reported rather than pinned as correct here.
    expect(dohScreenById('SCR-DOH-17').catalogueBRoles).not.toContain('Supervisor')
    expect(dohScreenById('SCR-DOH-17').catalogueBRoles).not.toContain('Tenant Admin')
  })
})

/* ==================================================================== *
 * THE ROUTE, THE CATALOGUES, AND THE THINGS THAT ARE NOT LOCKS.
 * ==================================================================== */

describe('the route slug', () => {
  it('is the screen the route mounts, and is disclosed as a break from the module-name convention', () => {
    expect(ROUTE_SLUG).toBe('execution-summary-review')
    expect(ROUTE_PATH).toBe('/hub/execution-summary-review')
    // The module name would have given a longer slug; the break is deliberate.
    expect(ROUTE_SLUG).not.toBe('execution-summary-review-and-distribution')
    expect(sourceLine(48110)).toContain('Execution Summary review queue')
  })
})

describe('the catalogue A/B swap', () => {
  it('is disclosed, not picked, and both catalogues read as the source has them', () => {
    expect(DOH_CATALOGUE_AB_SWAP.grade).toBe('C3')
    expect(DOH_CATALOGUE_AB_SWAP.followed).toBe('catalogue B')
    expect(sourceLine(48110)).toContain('SCR-DOH-16')
    expect(sourceLine(48110)).toContain('Execution Summary review queue')
    expect(sourceLine(48111)).toContain('SCR-DOH-17')
    expect(sourceLine(48111)).toContain('Execution Summary detail and Anomaly Register')
    // Catalogue A reverses them, and its identifiers are the banned three-digit
    // form — so they are checked by CONTENT rather than written down.
    expect(sourceLine(26066)).toContain('Execution Summary view')
    expect(sourceLine(26067)).toContain('Quality Manager review queue')
  })

  it('finds a THIRD catalogue-A screen for this module that the brief does not name', () => {
    // Catalogue A gives MOD-DOH-08 an Anomaly Register of its own at L26068;
    // catalogue B holds the register inside SCR-DOH-17. The swap is not a
    // two-screen disagreement.
    expect(sourceLine(26068)).toContain('Anomaly Register')
    expect(sourceLine(26068)).toContain('MOD-DOH-08')
  })
})

describe('the aging bands are the pressure, not a lock', () => {
  it('bands the seeded queue across all four bands, from the shared evaluator', () => {
    expect(REVIEW_QUEUE.map((i) => bandFor(i))).toEqual([
      'aged-72h',
      'aged-48h',
      'aged-24h',
      'under-24h',
    ])
  })

  it('reads the band from `reviewAgingBand` rather than computing a second one', () => {
    for (const item of REVIEW_QUEUE) {
      expect(bandFor(item)).toBe(reviewAgingBand(item.queuedAtMs, fixedClock(AS_OF_MS)))
    }
  })

  it('returns a band and nothing else — there is nowhere for a transition to live', () => {
    for (const item of REVIEW_QUEUE) {
      expect(AGING_BANDS).toContain(bandFor(item))
      expect(typeof bandFor(item)).toBe('string')
    }
    expect(sourceLine(28269)).toContain('the pressure, not a lock')
    expect(sourceLine(28338)).toContain('does not lock the run')
  })
})

/* ==================================================================== *
 * THE TWO CONTRADICTIONS, AND THE SOURCE'S OWN SILENCES.
 * ==================================================================== */

describe('the two contradictions this module discloses', () => {
  it('discloses both, with every reading and no reading named as the answer', () => {
    expect(DOH_08_CONTRADICTIONS.map((c) => c.id)).toEqual([
      'CONTRADICTION-LOT-RELEASE-SURFACE',
      'CONTRADICTION-RECLASSIFICATION-SURFACE',
    ])
    for (const c of DOH_08_CONTRADICTIONS) {
      expect(c.readings.length).toBeGreaterThanOrEqual(2)
      expect(c.commonToBoth.trim()).not.toBe('')
      expect(c.position.trim()).not.toBe('')
      // The row each one is about is one of the two adjacent rows.
      expect(doh08Row(c.row).surface).toBe('another-surface')
    }
  })

  it('cites only lines that exist and are not blank', () => {
    for (const c of DOH_08_CONTRADICTIONS) {
      for (const reading of c.readings) {
        for (const token of reading.locator.split(/[^0-9L]+/).filter((t) => t.startsWith('L'))) {
          const n = Number(token.slice(1))
          expect(n).toBeGreaterThan(0)
          expect(n).toBeLessThanOrEqual(SOURCE_LINES.length)
          expect(sourceLine(n).trim()).not.toBe('')
        }
      }
    }
  })
})

describe("what the source leaves unspecified, recorded rather than filled in", () => {
  it('records the card naming no write pattern, and counts the write rows', () => {
    const finding = UNSPECIFIED_IN_SOURCE.find((s) => s.subject.includes('fallback identifiers'))
    expect(finding).toBeDefined()
    // The card names three patterns and none is a write pattern.
    const card = sourceLine(28294)
    expect(card).toContain('FB-DOH-COMPUTE-006')
    expect(card).toContain('FB-DOH-EXPORT-009')
    expect(card).toContain('FB-DOH-NOTIF-004')
    expect(card).not.toContain('FB-DOH-WRITE-002')
    // FIVE rows of this matrix are Hub writes, not two. Derived from the
    // classification and the tokens rather than transcribed from a brief.
    const writeRows = (
      [
        'mark-a-summary-reviewed',
        'flag-an-anomaly',
        'resolve-an-anomaly',
        'add-a-correction-annotation',
        'set-the-review-toggle',
      ] as const
    ).filter((id) => {
      const row = doh08Row(id)
      return (
        row.surface === 'screen' &&
        ROLES.some((role) =>
          ['allowed', 'allowed-with-conditions'].includes(cellStatus(row, role)),
        )
      )
    })
    expect(writeRows).toHaveLength(5)
  })

  it('invents no anomaly category, the way DEC-TAX-002 invents no Job Type', () => {
    const finding = UNSPECIFIED_IN_SOURCE.find((s) => s.subject.includes('category list'))
    expect(finding).toBeDefined()
    expect(doh08Row('flag-an-anomaly').detail.QUALITY_MANAGER).toContain('fixed category list')
  })
})

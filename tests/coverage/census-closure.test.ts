import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES } from '../../src/coverage/descriptors'
import { masterPromptObligation } from './master-prompt'
import { renderedText } from './rendered-text'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * R4-B03, R4-B04, R4-B05 — THE §13.1 CENSUS, IN BOTH DIRECTIONS.
 *
 * Master prompt §13.1: "The census must close both ways: zero rendered
 * controls outside the census, and zero census rows without either a rendered
 * control or an explicit decision-blocked/not-applicable record."
 *
 * NEITHER DIRECTION WAS MEASURED BY ANYTHING. Direction 1 was not measured at
 * all. Direction 2 could not be satisfied even in principle: neither
 * escape-hatch string occurred anywhere in `scripts/build-registries.mjs`, so
 * 4,704 rows sat in `not-represented`, which is neither of the two terminal
 * states §13.1 permits, and the hatch the section names was unreachable by
 * construction.
 *
 * WHAT THIS GATE DOES AND DOES NOT ASSERT, said plainly because the
 * difference is the whole point. It does NOT assert that direction 1 is at
 * zero and direction 2 is at zero. Neither is, and forcing either to zero
 * would mean inventing census rows the frozen source does not carry, or
 * relabelling four and a half thousand rows into a terminal state nothing
 * supports. What it asserts is that BOTH DISTANCES ARE MEASURED, PUBLISHED
 * AND HELD: the figures a client reads are recomputed here from the same
 * inputs the page reads, and a drift in either direction turns this red.
 * A gate that could only pass at zero would have been deleted or gamed.
 *
 * SUBJECT AND ORDERING: `out/coverage/**` (written by `build`) compared
 * against the authored trees `src/` and `app/`, the generated registries and
 * `registries/authored/census-status-overrides.json`. Every expectation is
 * recomputed from an input to the page, never read back out of the page, so
 * `build` cannot satisfy this gate by rewriting what it compares against.
 * ═══════════════════════════════════════════════════════════════════════
 */
const OUT = join(process.cwd(), 'out')

/**
 * The generator's own `control:` regex, transcribed here rather than
 * imported, BECAUSE it is transcribed: if the generator's scan narrows, this
 * one does not, and the two figures diverge and go red. A gate that imported
 * the scanner would move with it silently — which is exactly how the app/-only
 * scan survived for as long as it did.
 */
const CONTROL_LABEL = /\bcontrol:\s*(?:\r?\n\s*)?'((?:[^'\\]|\\.)*)'/g

function collectLabels(dir: string, into: Set<string>): Set<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectLabels(full, into)
      continue
    }
    if (!/\.tsx?$/.test(entry.name)) continue
    for (const m of readFileSync(full, 'utf8').matchAll(CONTROL_LABEL)) {
      into.add((m[1] ?? '').replace(/\\(.)/g, '$1'))
    }
  }
  return into
}

const APP_LABELS = collectLabels(join(process.cwd(), 'app'), new Set<string>())
const ALL_LABELS = collectLabels(join(process.cwd(), 'src'), new Set(APP_LABELS))
const SRC_ONLY = [...ALL_LABELS].filter((l) => !APP_LABELS.has(l))

interface Row {
  id: string
  status: string
  register?: string
  surface?: string
  moduleId?: string
  moduleDescriptor?: string
  statusReason?: string
}
interface Registry {
  slug: string
  rows: Row[]
  dedupRule: string | null
  countedThing: string
}

const REGISTRIES: Registry[] = REGISTRY_DESCRIPTORS.map(
  (d) => JSON.parse(readFileSync(`registries/generated/${d.slug}.json`, 'utf8')) as Registry,
)
const CONTROLS = REGISTRIES.find((r) => r.slug === 'actionable-controls')!
const CONTROL_ROWS = CONTROLS.rows.filter((r) => r.register?.startsWith('actionable controls'))
const CONTROLS_PAGE = renderedText(
  readFileSync(join(OUT, 'coverage', 'actionable-controls', 'index.html'), 'utf8'),
)

describe('R4-B03: the control-label scan reads both trees', () => {
  it('the populations are non-empty and both trees contribute', () => {
    expect(APP_LABELS.size, 'control: labels declared under app/').toBeGreaterThan(50)
    expect(SRC_ONLY.length, 'labels declared only under src/').toBeGreaterThan(100)
    expect(ALL_LABELS.size).toBe(APP_LABELS.size + SRC_ONLY.length)
  })

  it('the published declared-label figure is the union of both trees, not app/ alone', () => {
    // The defect: `walkRouteTree` ended at `walkDirs(join(ROOT, 'app'))` and
    // the scan lived inside it, so the page published the app/ figure. That
    // number reproduces exactly here, which is what makes this assertion an
    // equality rather than a floor.
    expect(CONTROLS.dedupRule).toContain(`declare ${ALL_LABELS.size} control-matrix labels`)
    expect(CONTROLS.dedupRule).toContain(`(${APP_LABELS.size} in a route file under app/`)
    expect(CONTROLS.dedupRule).toContain(`${SRC_ONLY.length} `)
    expect(CONTROLS_PAGE).toContain(`declare ${ALL_LABELS.size} control-matrix labels`)
  })

  it('the word-for-word figure counts declared labels against the census, by equality', () => {
    const censusLabels = new Set(CONTROL_ROWS.map((r) => r.id))
    const wordForWord = [...ALL_LABELS].filter((l) => censusLabels.has(l))
    expect(censusLabels.size, 'the 608-label census population').toBe(608)
    expect(wordForWord.length, 'declared labels that are word-for-word a census row').toBeGreaterThan(0)
    expect(CONTROLS.dedupRule).toContain(`which ${wordForWord.length} `)
    // And every one of them reads demonstrated, so the figure and the
    // statuses cannot disagree.
    const demonstrated = CONTROL_ROWS.filter((r) => r.status === 'demonstrated-in-storyboard')
    expect(demonstrated.map((r) => r.id).sort()).toEqual([...wordForWord].sort())
  })
})

describe('R4-B04: the census has the dimensions §13.1 asks it to count by', () => {
  it('the obligation is verbatim in the committed prompt artefact', () => {
    const sentence = masterPromptObligation('censusDimensions')
    expect(sentence).toContain('per-surface, per-module')
    expect(sentence).toContain('control type')
  })

  it('surface is normalised to the canonical five plus an explicit cross-surface value', () => {
    const surfaces = new Set(CONTROL_ROWS.map((r) => r.surface).filter((s): s is string => s !== undefined))
    expect(surfaces.size, 'distinct surface values').toBeGreaterThan(0)
    for (const s of surfaces) {
      expect(s, 'every surface is canonical or the explicit cross-surface value').toMatch(
        /^(SURF-(DOH|CC|FL|SA|STU)|cross-surface)$/,
      )
    }
    // Population floor: the fix is worthless if it normalised three rows.
    const withSurface = CONTROL_ROWS.filter((r) => r.surface !== undefined)
    expect(withSurface.length).toBeGreaterThan(550)
  })

  it('module is carried through, canonical where the extraction wrote one and verbatim where it did not', () => {
    const canonical = CONTROL_ROWS.filter((r) => r.moduleId !== undefined)
    const descriptive = CONTROL_ROWS.filter((r) => r.moduleDescriptor !== undefined)
    // It was 0 before this fix, on all 630 rows.
    expect(canonical.length, 'rows carrying a canonical MOD-* id').toBeGreaterThan(200)
    expect(descriptive.length, 'rows carrying the extraction prose instead').toBeGreaterThan(100)
    for (const r of canonical) {
      expect(r.moduleId).toMatch(/^MOD-(DOH|CC|FL|SA|STU)-(\d{2}|[AB]\d+)$/)
    }
    // No row may carry both: a canonical id AND a descriptor is two answers
    // to one question and the index would render them both.
    expect(CONTROL_ROWS.filter((r) => r.moduleId !== undefined && r.moduleDescriptor !== undefined)).toEqual([])
  })

  it('the index publishes the per-surface and per-module counts and says control type is absent', () => {
    expect(CONTROLS_PAGE).toContain('Census by surface and by module')
    for (const surface of ['SURF-CC', 'SURF-DOH', 'SURF-SA', 'SURF-FL', 'SURF-STU']) {
      expect(CONTROLS_PAGE, `${surface} group`).toContain(surface)
    }
    expect(CONTROLS_PAGE).toContain('Control type is counted nowhere and that is not an omission')
  })

  it('no control-type field was invented anywhere in the census', () => {
    // The forbidden fix for B04: a keyword-guessed taxonomy printed as source
    // truth. Asserted over every generated row, not only the controls.
    const anyTypeField = REGISTRIES.flatMap((r) => r.rows).filter((row) =>
      Object.keys(row).some((k) => /^controlType$/i.test(k)),
    )
    expect(anyTypeField, 'no row carries a fabricated control type').toEqual([])
  })
})

describe('R4-B05 direction 1: rendered controls measured against the census', () => {
  it('the obligation is verbatim in the committed prompt artefact', () => {
    const sentence = masterPromptObligation('censusTwoWayClosure')
    expect(sentence).toContain('zero rendered controls outside the census')
    expect(sentence).toContain('decision-blocked/not-applicable record')
  })

  it('the distance from zero is measured, non-zero, and published', () => {
    const censusLabels = new Set(CONTROL_ROWS.map((r) => r.id))
    const outside = [...ALL_LABELS].filter((l) => !censusLabels.has(l))
    // BOTH populations asserted, not only the offenders: a fix that emptied
    // `ALL_LABELS` would leave `outside` at zero and read as closure.
    expect(ALL_LABELS.size, 'declared labels').toBeGreaterThan(200)
    expect(outside.length, 'declared labels with no census row').toBeGreaterThan(0)
    // The two sets partition the declared labels exactly -- no label is
    // both inside and outside the census, and none is neither.
    const inside = [...ALL_LABELS].filter((l) => censusLabels.has(l))
    expect(inside.length + outside.length).toBe(ALL_LABELS.size)
    expect(inside.filter((l) => outside.includes(l))).toEqual([])
    // The page states the same distance, in the same words the artefact does.
    expect(CONTROLS_PAGE).toContain('the rest are the same control re-worded for a reader')
  })
})

describe('R4-B05 direction 2: every census row has a terminal state or a measured absence', () => {
  const ALL_ROWS = REGISTRIES.flatMap((r) => r.rows)
  const OVERRIDES = JSON.parse(
    readFileSync('registries/authored/census-status-overrides.json', 'utf8'),
  ) as {
    overrides: {
      registry: string
      ids: string[]
      status: string
      reason: string
      owner: string
      evidenceLine: number
      evidenceQuote: string
    }[]
    decisionBlockedOccupancy: { count: number; whyZeroRatherThanUnwritten: string }
  }

  it('the population is every row of all fourteen registries', () => {
    expect(REGISTRIES.length).toBe(14)
    expect(ALL_ROWS.length, 'census rows').toBeGreaterThanOrEqual(5000)
    const tallied = COVERAGE_STATUSES.map((s) => ALL_ROWS.filter((r) => r.status === s).length)
    expect(tallied.reduce((a, b) => a + b, 0), 'every row is in exactly one status').toBe(
      ALL_ROWS.length,
    )
  })

  it('both terminal states are now emittable — the generator could emit neither', () => {
    const generator = readFileSync('scripts/build-registries.mjs', 'utf8')
    for (const status of ['decision-blocked', 'not-applicable']) {
      expect(generator, `the generator can emit ${status}`).toContain(status)
    }
    expect(generator).toContain('census-status-overrides.json')
  })

  it('every authored override carries the reason, owner and evidence master prompt §9.2 requires', () => {
    const sentence = masterPromptObligation('notApplicableEvidence')
    expect(sentence).toContain('reason, owner, and source/decision evidence')

    expect(OVERRIDES.overrides.length, 'authored override records').toBeGreaterThan(0)
    const blueprint = readFileSync('../AVIIXA_Production_Product_Blueprint.md', 'utf8').split('\n')
    for (const record of OVERRIDES.overrides) {
      expect(['decision-blocked', 'not-applicable']).toContain(record.status)
      expect(record.reason.length, `${record.status} reason`).toBeGreaterThan(80)
      expect(record.owner.length, `${record.status} owner`).toBeGreaterThan(20)
      expect(record.ids.length).toBeGreaterThan(0)
      // The evidence is a real line of the frozen source carrying the quoted
      // words. An override citing a line that does not say what it claims is
      // the defect this build has now found eleven times.
      const line = blueprint[record.evidenceLine - 1]
      expect(line, `frozen source line ${record.evidenceLine}`).toBeDefined()
      expect(line, `line ${record.evidenceLine} carries the quoted words`).toContain(
        record.evidenceQuote,
      )
    }
  })

  it('every overridden row exists, holds the authored status, and carries its reason', () => {
    for (const record of OVERRIDES.overrides) {
      const registry = REGISTRIES.find((r) => r.slug === record.registry)
      expect(registry, `registry ${record.registry}`).toBeDefined()
      for (const id of record.ids) {
        const row = registry!.rows.find((r) => r.id === id)
        expect(row, `${record.registry}/${id}`).toBeDefined()
        expect(row!.status, `${record.registry}/${id}`).toBe(record.status)
        expect(row!.statusReason, `${record.registry}/${id} reason`).toContain(
          String(record.evidenceLine),
        )
      }
    }
  })

  it('no row holds a terminal state that no authored record names', () => {
    // The other direction of the same check, and the one that stops the
    // generator from minting a terminal state on its own.
    const authored = new Set(
      OVERRIDES.overrides.flatMap((o) => o.ids.map((id) => `${o.registry} ${id}`)),
    )
    const terminal = REGISTRIES.flatMap((r) =>
      r.rows
        .filter((row) => row.status === 'decision-blocked' || row.status === 'not-applicable')
        .map((row) => `${r.slug} ${row.id}`),
    )
    expect(terminal.length, 'rows in a terminal state').toBeGreaterThan(0)
    expect(terminal.filter((k) => !authored.has(k))).toEqual([])
    expect(terminal.length, 'and every authored id landed on a row').toBe(authored.size)
  })

  it('the remaining distance is published rather than relabelled away', () => {
    /**
     * THE ASSERTION THIS WHOLE FILE EXISTS FOR. B05 can be made to pass by
     * moving 4,670 rows into a terminal state, which would satisfy §13.1's
     * words and destroy the number. So the gate holds the opposite: the
     * not-represented count is still the large majority of the census, and
     * it is on the dashboard where a client reads it.
     */
    const notRepresented = ALL_ROWS.filter((r) => r.status === 'not-represented').length
    const terminal = ALL_ROWS.filter(
      (r) => r.status === 'decision-blocked' || r.status === 'not-applicable',
    ).length
    expect(notRepresented, 'the honest remaining distance').toBeGreaterThan(4000)
    expect(terminal, 'authored terminal records, deliberately few').toBeLessThan(200)
    const dashboard = renderedText(readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8'))
    expect(dashboard).toContain(`${notRepresented} are not represented`)
  })

  it('decision-blocked occupancy is stated rather than left as an unexplained zero', () => {
    const actual = ALL_ROWS.filter((r) => r.status === 'decision-blocked').length
    expect(actual, 'the authored file and the artefacts agree on occupancy').toBe(
      OVERRIDES.decisionBlockedOccupancy.count,
    )
    expect(
      OVERRIDES.decisionBlockedOccupancy.whyZeroRatherThanUnwritten.length,
    ).toBeGreaterThan(200)
  })
})

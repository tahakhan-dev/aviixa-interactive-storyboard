import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { isForeignProbe } from '../probe-paths'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES } from '../../src/coverage/descriptors'
import { masterPromptObligation } from './master-prompt'
import { renderedText } from './rendered-text'
import { stripComments } from './strip-comments'

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
 * THE FLIGHT PAYLOAD IS NOT RENDERED TEXT (R5-B03's measurement warning).
 *
 * The local `readerText` that used to sit here — stripping <script> and
 * <style> before calling `renderedText` — is gone: R5-Q01 moved the strip
 * into the shared helper, where every caller gets it. `renderedText` IS
 * reader text now. See tests/coverage/rendered-text.ts.
 */


/**
 * The generator's own loose `control:` regex, transcribed here rather than
 * imported, BECAUSE it is transcribed: if the generator's scan narrows, this
 * one does not, and the two figures diverge and go red. A gate that imported
 * the scanner would move with it silently — which is exactly how the app/-only
 * scan survived for as long as it did.
 *
 * R5-A07: THIS REGEX IS NO LONGER THE POPULATION, IT IS THE CONTROL GROUP.
 * The generator used to scan with exactly this pattern and the gate
 * reproduced its four false positives by construction — `control: 'ok'` and
 * three siblings are `Record<Kind, string>` entries where `control` is a
 * union-member KEY and the value is a caption or a tone token, and the gate
 * could never convict them because it made the same mistake in the same way.
 * The generator now asks the TypeScript parser for a string-literal `control`
 * property of an object literal that also carries a control-matrix sibling
 * key; this file keeps the loose scan and requires the DIFFERENCE between the
 * two to be exactly the named list below. A silent re-widening and a silent
 * narrowing are both red, and neither can hide behind a bigger number.
 */
const CONTROL_LABEL = /\bcontrol:\s*(?:\r?\n\s*)?'((?:[^'\\]|\\.)*)'/g

/**
 * The strict rule, TRANSCRIBED rather than imported for the same reason the
 * loose one is. Every real declaration in this tree carries at least one of
 * these siblings; no `Record<Kind, string>` does, because a kind map's
 * siblings are the other members of its union.
 */
const CONTROL_MATRIX_SIBLINGS = ['id', 'sourceRef', 'matrixRef']

function declaredIn(text: string): string[] {
  const found: string[] = []
  const source = ts.createSourceFile('gate.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      const props = new Map<string, ts.Expression>()
      for (const p of node.properties) {
        if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
          props.set(p.name.text, p.initializer)
        }
      }
      const control = props.get('control')
      if (
        control !== undefined &&
        ts.isStringLiteralLike(control) &&
        CONTROL_MATRIX_SIBLINGS.some((k) => props.has(k))
      ) {
        found.push(control.text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

function collectLabels(dir: string, loose: Set<string>, strict: Set<string>): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectLabels(full, loose, strict)
      continue
    }
    if (!/\.tsx?$/.test(entry.name)) continue
    const text = readFileSync(full, 'utf8')
    for (const m of text.matchAll(CONTROL_LABEL)) {
      loose.add((m[1] ?? '').replace(/\\(.)/g, '$1'))
    }
    if (!text.includes('control:')) continue
    for (const label of declaredIn(text)) strict.add(label)
  }
}

const APP_LOOSE = new Set<string>()
const APP_LABELS = new Set<string>()
collectLabels(join(process.cwd(), 'app'), APP_LOOSE, APP_LABELS)
const ALL_LOOSE = new Set(APP_LOOSE)
const ALL_LABELS = new Set(APP_LABELS)
collectLabels(join(process.cwd(), 'src'), ALL_LOOSE, ALL_LABELS)
const SRC_ONLY = [...ALL_LABELS].filter((l) => !APP_LABELS.has(l))

/**
 * The exact strings the loose scan counted as declared controls and that are
 * not controls at all, named one by one rather than summarised as a count.
 * `ok` is a `StatusTone`; `Control`, `a live control` and `Control drawn here`
 * are pill captions on affordance-kind maps; `border-[…]` is a Tailwind class;
 * `send` is the first member of a union in a TYPE literal, which is not a
 * value at all.
 */
const NOT_CONTROLS = [
  'Control',
  'Control drawn here',
  'a live control',
  'border-[var(--color-border-strong)]',
  'ok',
  'send',
]

/**
 * And the other direction: real declared labels the single-quote regex could
 * never see, because they contain an apostrophe and are therefore written in
 * double quotes. Nine of them, and every one is a control-matrix row.
 */
const APOSTROPHE_LABELS = [
  "Carry the source Job's approval forward",
  "Carry the source Job's recurrence forward silently",
  "Read the application's encrypted store outside the application",
  "Reclassify an anomaly's severity",
  "See another worker's coaching history",
  "View another identity's inbox",
  "View another identity's session or work",
  "View another tenant's material",
  "View another worker's assigned work",
]

/* ────────────────────────────────────────────────────────────────────────
 * R5-A03 — READING A TABLE BODY, BECAUSE `toContain(surface)` READ THE PAGE.
 *
 * The per-surface census was asserted with `expect(CONTROLS_PAGE).toContain
 * (surface)` for the five surface tokens. Those tokens occur 330, 308, 322,
 * 168 and 100 times on that page — all of them in the 627-row table below,
 * never in the census block. Deleting five of the six census rows left every
 * assertion passing and the caption still reading "6 surface groups". The
 * 181-row census-by-module table beside it, and both captions, were asserted
 * by nothing at all.
 *
 * These three helpers are transcribed rather than shared, the same doctrine
 * the two label scans above follow: a gate that imports its subject's own
 * reader moves with it silently.
 * ──────────────────────────────────────────────────────────────────────── */
function tableWithCaption(html: string, needle: string): string {
  const found = [...html.matchAll(/<table\b[^>]*>.*?<\/table>/gs)]
    .map((m) => m[0])
    .filter((t) => {
      const caption = /<caption\b[^>]*>(.*?)<\/caption>/s.exec(t)
      return caption !== null && renderedText(caption[1] ?? '').includes(needle)
    })
  if (found.length !== 1) {
    throw new Error(
      `Expected exactly one table whose caption contains "${needle}"; found ${found.length}. ` +
        'A gate that cannot find its own table asserts nothing.',
    )
  }
  return found[0] as string
}

function bodyRows(table: string): string[] {
  const body = /<tbody\b[^>]*>(.*?)<\/tbody>/s.exec(table)
  if (body === null) throw new Error('That table has no <tbody> at all.')
  return [...(body[1] ?? '').matchAll(/<tr\b[^>]*>(.*?)<\/tr>/gs)].map((m) => m[1] ?? '')
}

function firstCell(row: string): string {
  const cell = /<t[dh]\b[^>]*>(.*?)<\/t[dh]>/s.exec(row)
  return renderedText(cell?.[1] ?? '').trim()
}

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

  it('R5-A07: the difference between the loose scan and the strict one is exactly the named list', () => {
    // Both populations first, so a scan that went empty cannot read as
    // agreement. This is the round-3 shape and it is asserted before the
    // difference, not after it.
    expect(ALL_LOOSE.size, 'the loose `control:` regex population').toBeGreaterThan(200)
    expect(ALL_LABELS.size, 'the parsed control-matrix population').toBeGreaterThan(200)

    // What the regex counts and the parser refuses: not a count, the strings.
    const looseOnly = [...ALL_LOOSE].filter((l) => !ALL_LABELS.has(l)).sort()
    expect(looseOnly, 'strings the loose scan calls a control and that are not one').toEqual(
      [...NOT_CONTROLS].sort(),
    )

    // And what the parser finds that the regex cannot see: nine real labels
    // written in double quotes because they contain an apostrophe.
    const strictOnly = [...ALL_LABELS].filter((l) => !ALL_LOOSE.has(l)).sort()
    expect(strictOnly, 'declared labels the single-quote regex misses').toEqual(
      [...APOSTROPHE_LABELS].sort(),
    )

    // The arithmetic, stated so a reader can check the published figure by
    // hand: loose - 6 + 9 = strict.
    expect(ALL_LABELS.size).toBe(ALL_LOOSE.size - NOT_CONTROLS.length + APOSTROPHE_LABELS.length)
  })

  it('R5-A07: no `Record<Kind, string>` caption is published as a declared control', () => {
    // The assertion the old gate could not make, because it reproduced the
    // generator's regex and therefore its false positives. Held against the
    // ARTEFACT, so it convicts the published figure rather than a scan.
    for (const notAControl of NOT_CONTROLS) {
      expect(ALL_LABELS.has(notAControl), `"${notAControl}" is not a declared control`).toBe(false)
    }
    // A tone token is the sharpest of them: `ok` is a StatusTone, and the
    // page used to describe it as "the same control re-worded for a reader".
    // The unqualified claim, gone. The page still says SOME of them are a
    // re-wording, which is true and is not a claim about all of them.
    expect(CONTROLS_PAGE).not.toContain('and the rest are the same control re-worded for a reader')
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
    expect(censusLabels.size, 'the 605-label census population').toBe(605)
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
    // It was 0 before this fix, on all rows.
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
    expect(CONTROLS_PAGE).toContain('Control type is counted nowhere and that is not an omission')
  })

  it('R5-A03: the census-by-surface table body holds every group, by EQUALITY', () => {
    const html = readFileSync(join(OUT, 'coverage', 'actionable-controls', 'index.html'), 'utf8')
    const expected = [
      ...new Set(
        CONTROLS.rows.map((r) => r.surface).filter((s): s is string => s !== undefined),
      ),
    ].sort()
    // Population before comparison: an empty expectation is satisfied by an
    // empty table, which is the plant this assertion exists to catch.
    expect(expected.length, 'distinct surface groups in the census').toBeGreaterThan(1)
    const rendered = bodyRows(tableWithCaption(html, 'surface groups, with rows, demonstrated'))
    expect(rendered.map(firstCell).sort()).toEqual(expected)
    // The caption states its own row count, so a truncated body is caught by
    // the number as well as by the names.
    expect(CONTROLS_PAGE).toContain(`${expected.length} surface groups, with rows`)
  })

  it('R5-A03: the census-by-module table body holds every group, by EQUALITY', () => {
    const html = readFileSync(join(OUT, 'coverage', 'actionable-controls', 'index.html'), 'utf8')
    const expected = [
      ...new Set(
        CONTROLS.rows
          .map((r) => r.moduleId ?? r.moduleDescriptor)
          .filter((s): s is string => s !== undefined),
      ),
    ].sort()
    expect(expected.length, 'distinct module groups in the census').toBeGreaterThan(50)
    const rendered = bodyRows(tableWithCaption(html, 'module groups, with rows, demonstrated'))
    expect(rendered.map(firstCell).sort()).toEqual(expected)
    expect(CONTROLS_PAGE).toContain(`${expected.length} module groups, with rows`)
  })

  it('R5-B04: the control-type disclosure renders on the controls index and nowhere else', () => {
    // It reached seven index pages and six list no controls at all. On the
    // modules index it claimed §13.1 requires THAT inventory counted by
    // control type, then said "81 record no module" of an inventory whose
    // rows are modules.
    const claim = 'Control type is counted nowhere and that is not an omission'
    const elsewhere = REGISTRY_DESCRIPTORS.filter((d) => d.slug !== 'actionable-controls').filter(
      (d) =>
        renderedText(
          readFileSync(join(OUT, 'coverage', d.slug, 'index.html'), 'utf8'),
        ).includes(claim),
    )
    expect(elsewhere.map((d) => d.slug), 'indexes wrongly carrying the control-type paragraph').toEqual([])
    // And it is still on the one page it belongs to — an "assert the
    // population" guard, so deleting the paragraph outright cannot pass.
    expect(CONTROLS_PAGE).toContain(claim)
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
    /*
      R5-B03: THE NUMBER, ON THE PAGE, not a sentence that characterises it.
      The page used to say "the rest are the same control re-worded for a
      reader" — a claim, unmeasured, and false of the four Record<Kind,
      string> captions the scan was miscounting. It now prints the distance,
      and this asserts the exact figure a reader sees.
    */
    expect(CONTROLS_PAGE).toContain(
      `${outside.length} of the declared labels above match no census row word for word`,
    )
  })
})

describe('R5-B03: the two-way closure is measured in both directions, and rendered', () => {
  /**
   * `reconciliation_rows[17]` declared this closure MET. Neither direction is
   * at zero, and neither figure reached a reader: a `grep -c` for both numbers
   * over the built page returns 1 each and both hits are React row keys inside
   * the flight payload. Everything here reads `renderedText`, which strips the
   * payload, so a number that exists only as a row key cannot satisfy it.
   */
  const censusLabels = new Set(CONTROL_ROWS.map((r) => r.id))
  const directionOne = [...ALL_LABELS].filter((l) => !censusLabels.has(l)).length
  const directionTwo = CONTROL_ROWS.filter((r) => r.status === 'not-represented').length

  it('both distances are non-zero, so neither may be reported as closed', () => {
    expect(CONTROL_ROWS.length, 'the 605-row control census').toBe(605)
    expect(directionOne, 'declared controls outside the census').toBeGreaterThan(0)
    expect(directionTwo, 'census rows with neither a rendered control nor a terminal record').toBeGreaterThan(0)
  })

  it('the index renders both figures as rendered text, not as a flight-payload row key', () => {
    expect(CONTROLS_PAGE).toContain('THE §13.1 CENSUS DOES NOT CLOSE IN EITHER DIRECTION')
    expect(CONTROLS_PAGE).toContain(
      `${directionOne} of the declared labels above match no census row word for word`,
    )
    expect(CONTROLS_PAGE).toContain(
      `census rows with neither a rendered control nor a terminal record: ${directionTwo} of the 605`,
    )
  })

  it('the reconciliation row no longer declares the closure met', () => {
    const reconciliation = JSON.parse(
      readFileSync('registries/generated/source-reconciliation.json', 'utf8'),
    ) as { reconciliation: { reconciliation_rows: { registry_slug: string | null; resolution: string }[] } }
    const row = reconciliation.reconciliation.reconciliation_rows.find(
      (r) => r.registry_slug === 'actionable-controls',
    )
    expect(row, 'the actionable-controls reconciliation row').toBeDefined()
    // The row now QUOTES its own retracted sentence, so the check is on the
    // claim it used to make rather than on the words it used to make it in.
    expect(row!.resolution).not.toContain('and both directions are published rather than claimed')
    expect(row!.resolution).toContain('DOES NOT CLOSE IN EITHER DIRECTION')
    // And the row is on the dashboard, so the correction reaches a reader.
    const dashboard = renderedText(readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8'))
    expect(dashboard).toContain('DOES NOT CLOSE IN EITHER DIRECTION')
  })
})

/* ═════════════════════════════════════════════════════════════════════ *
 * R6-C02 — THE TWO MEASURED FACTS THE OWNERSHIP-SCAN COMMENT RESTS ON.
 *
 * `scripts/build-registries.mjs` explains why the `MOD-*` ownership count
 * still reads raw text after R5-A02 stripped comments from the CITATION
 * scan. The explanation said "measured both ways" and named a consequence
 * the measurement does not produce -- one module moving to
 * `not-represented`, "a built screen reported as absent". Replayed, the
 * module moves to `mounted-in-another-screen` and nothing reaches
 * not-represented, and the comment did not record the second obstacle at
 * all: stripping puts two Studio modules into an argmax tie the ambiguity
 * check throws on.
 *
 * The corrected comment now rests on two checkable facts, and these are
 * them. Neither is a re-run of the generator -- this reads the same files
 * with the same stripper and asserts the two conditions that make the
 * conclusion true. If a header comment is rewritten into code, or a file
 * gains a mention, this reds and the comment gets re-derived rather than
 * quietly rotting.
 * ═════════════════════════════════════════════════════════════════════ */
describe('R6-C02: the ownership scan reads raw text, for the reasons it now states', () => {
  const MOD_ID = /MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g

  /** The generator's own population: files directly in a route directory. */
  function routeFileText(dir: string): { raw: string; code: string } {
    let raw = ''
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (isForeignProbe(e.name)) continue
      if (e.isDirectory() || !/\.tsx?$/.test(e.name)) continue
      raw += readFileSync(join(dir, e.name), 'utf8') + '\n'
    }
    return { raw, code: stripComments(raw) }
  }

  function counts(text: string): Map<string, number> {
    const m = new Map<string, number>()
    for (const id of text.match(MOD_ID) ?? []) m.set(id, (m.get(id) ?? 0) + 1)
    return m
  }

  it('MOD-FL-A1 owns its route on a COMMENT mention alone, and claims no slug', () => {
    const { raw, code } = routeFileText(join(process.cwd(), 'app', 'frontline', 'sign-in'))
    expect(counts(raw).get('MOD-FL-A1'), 'raw mentions').toBeGreaterThan(0)
    expect(counts(code).get('MOD-FL-A1'), 'mentions surviving stripComments').toBeUndefined()
    // ...and the route is still mounted, which is why stripping downgrades it
    // to mounted-in-another-screen rather than to not-represented.
    expect(code).toMatch(/modules\/fl-a1\//)
    // No slug claim to fall back on: the basename collides across surfaces.
    expect(readFileSync('src/frontline/modules.ts', 'utf8')).toContain(
      'the argmax rule awards it without one',
    )
  })

  it('stripping would tie app/studio/journey, a directory D1 gives to no module', () => {
    const { raw, code } = routeFileText(join(process.cwd(), 'app', 'studio', 'journey'))
    const rank = (t: string): [string, number][] =>
      [...counts(t).entries()].sort((a, b) => b[1] - a[1])
    const rawTop = rank(raw)
    expect(rawTop[0]![1], 'raw has a strict winner').toBeGreaterThan(rawTop[1]![1])
    expect(rawTop[0]![0]).toBe('MOD-STU-12')
    const codeTop = rank(code)
    expect([codeTop[0]![0], codeTop[1]![0]].sort()).toEqual(['MOD-STU-04', 'MOD-STU-12'])
    expect(codeTop[0]![1], 'stripped ties the top two').toBe(codeTop[1]![1])
    // The tie is unresolvable by award: the route is not a module route.
    expect(readFileSync('app/studio/journey/page.tsx', 'utf8')).toContain(
      'THIS ROUTE IS NOT A MODULE ROUTE AND MINTS NO SCREEN ID (D1)',
    )
  })

  it('the generator states the measured consequence, not the refuted one', () => {
    const generator = readFileSync('scripts/build-registries.mjs', 'utf8')
    expect(generator, 'the refuted sentence is gone').not.toContain(
      'Stripping there would report a built screen as absent',
    )
    expect(generator).toContain('demonstrated-in-storyboard -> mounted-in-another-screen')
    expect(generator).toContain('Ambiguous module ownership for route app/studio/journey')
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
      evidenceLineVerbatim: string
      whatElseThisLineSays: string
      renderedIdentifierClaim: {
        claim: string
        everyPageNamingAnIdIsUnder: string
        indexNamingEveryId: string
        howToCheck: string
      }
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
      /* ────────────────────────────────────────────────────────────────────
       * R5-A06 — THE WHOLE LINE, NOT THE SENTENCE THAT SUITS THE RECORD.
       *
       * This gate asserted only that the quotation is somewhere on the cited
       * line. The one override in this file quotes line 98508's THIRD
       * sentence; that line's FIRST sentence describes a Super Admin screen
       * where all 22 rows render as locked entries — the classification's own
       * evidence line refuting the classification, and nothing could see it.
       *
       * The record now transcribes the entire line, compared byte-for-byte,
       * and answers whatever else is on it. An author may still make the
       * wrong call. They can no longer make it with the contradicting
       * sentence out of the record and out of the diff.
       * ──────────────────────────────────────────────────────────────────── */
      expect(
        record.evidenceLineVerbatim,
        `line ${record.evidenceLine} is transcribed whole, byte for byte`,
      ).toBe(line)
      expect(
        record.evidenceLineVerbatim.includes(record.evidenceQuote),
        'the quotation is an excerpt of the transcribed line',
      ).toBe(true)
      // The population guard for this check: a record whose quotation IS the
      // whole line needs no remainder answered, and one whose quotation is a
      // fragment does. Only the fragment case can hide a contradiction, and
      // this is the case in front of us.
      if (record.evidenceLineVerbatim.trim() !== record.evidenceQuote.trim()) {
        expect(
          record.whatElseThisLineSays.length,
          `${record.registry} record answers the rest of line ${record.evidenceLine}`,
        ).toBeGreaterThan(80)
      }
    }
  })

  it('R5-A06: the remainder of the cited line reaches the row and the screen', () => {
    // The disclosure is worth nothing in a file nobody opens. It travels on
    // the row's own statusReason and, since R5-B06, renders beside the id.
    const controls = REGISTRIES.find((r) => r.slug === 'actionable-controls')!
    for (const record of OVERRIDES.overrides) {
      if (record.registry !== 'actionable-controls') continue
      for (const id of record.ids) {
        const row = controls.rows.find((r) => r.id === id)!
        expect(row.statusReason, `${id} carries the remainder`).toContain('What else that line says')
      }
    }
    const page = renderedText(
      readFileSync(join(OUT, 'coverage', 'actionable-controls', 'index.html'), 'utf8'),
    )
    expect(page, 'the owed §45A.2 screen is disclosed on the index').toContain(
      'Super Admin extension screen',
    )
  })

  /* ══════════════════════════════════════════════════════════════════ *
   * R6-C01 — THE RECORD'S OWN FACTUAL CLAIMS, CHECKED AGAINST `out/`.
   *
   * R5-A06 made this gate read the whole evidence LINE. It still could not
   * see the other half of the same shape: the record's own assertions about
   * this build. `whatElseThisLineSays` claimed "No page in out/ names a DNC-
   * identifier", and the page rendering that sentence names all 22 of them.
   * Self-refuted in one viewport, and nothing in `tests/` was looking.
   *
   * A claim of the form "no page renders X" is checkable, so the record now
   * carries the checkable residue in `renderedIdentifierClaim` and this
   * asserts it against the export, both ways:
   *
   *   - the population is non-empty, so the check cannot pass vacuously;
   *   - EVERY page naming an overridden identifier sits under the declared
   *     prefix, which is what "no shipped route renders the §45A.2 register
   *     screen" reduces to once the false absolute claim is gone;
   *   - the index the record names does name every one of the ids.
   *
   * Reader text, not markup: the flight payload carries every row id as a
   * React key, so a raw grep over the HTML measures the payload. That is
   * RESUME §8's controller defect 9 and R5-Q01 both.
   * ══════════════════════════════════════════════════════════════════ */
  const EXPORTED_PAGES = ((): readonly string[] => {
    const found: string[] = []
    const walk = (dir: string, prefix: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(entry.name)) continue
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`
        if (entry.isDirectory()) walk(join(dir, entry.name), rel)
        else if (entry.name.endsWith('.html')) found.push(rel)
      }
    }
    walk(OUT, '')
    return found
  })()

  it('the record\u2019s own claim about `out/` holds, and holds non-vacuously', () => {
    expect(EXPORTED_PAGES.length, 'exported html pages').toBeGreaterThan(50)
    for (const record of OVERRIDES.overrides) {
      const claim = record.renderedIdentifierClaim
      expect(claim, `${record.registry} carries a checkable rendered-identifier claim`).toBeDefined()
      expect(claim.claim.length).toBeGreaterThan(80)
      expect(claim.howToCheck).toMatch(/script/i)

      const ids = new RegExp(
        `\\b(?:${record.ids.map((i) => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
      )
      const naming = EXPORTED_PAGES.filter((rel) =>
        ids.test(renderedText(readFileSync(join(OUT, rel), 'utf8'))),
      )
      // Non-vacuous: the retracted claim was that this set is empty, and a
      // gate that passed on an empty set would be the same abstention twice.
      expect(naming.length, `pages naming a ${record.registry} overridden id`).toBeGreaterThan(0)
      expect(
        naming.filter((rel) => !rel.startsWith(claim.everyPageNamingAnIdIsUnder)),
        `pages outside ${claim.everyPageNamingAnIdIsUnder} naming an overridden id`,
      ).toEqual([])
      expect(naming, 'the index the record names is among them').toContain(claim.indexNamingEveryId)

      const index = renderedText(readFileSync(join(OUT, claim.indexNamingEveryId), 'utf8'))
      expect(
        record.ids.filter((id) => !new RegExp(`\\b${id}\\b`).test(index)),
        `ids the record says ${claim.indexNamingEveryId} names, and it does not`,
      ).toEqual([])
    }
  })

  it('R6-C01: the record leaves ABSENT-versus-DISABLED open rather than settling it', () => {
    /**
     * The record used to argue "a locked entry that refuses a schedule is the
     * ABSENCE of a control", which settles at a stroke what RESUME §7 records
     * as unsettled at named-test strength -- and settles it in the direction
     * that keeps these rows in the escape hatch they are the only occupants
     * of. The status now rests on §45A.3 being scheduling policy, a ground
     * that holds under EITHER reading, and the question is cross-referenced
     * to the fixture that pins it rather than answered here.
     */
    for (const record of OVERRIDES.overrides) {
      const prose = `${record.reason} ${record.whatElseThisLineSays}`
      expect(prose, 'the settling sentence is gone').not.toMatch(
        /is the ABSENCE of a control/i,
      )
      expect(prose, 'the question is named as open').toMatch(/ABSENT or DISABLED|ABSENT-versus-DISABLED/i)
      expect(prose, 'and cross-referenced to the fixture that pins it').toContain(
        'tests/coverage/slice-04-gates.test.ts',
      )
    }
    // ...and that fixture is where it says it is, still pinning both readings.
    const fixture = readFileSync('tests/coverage/slice-04-gates.test.ts', 'utf8')
    expect(fixture).toContain('ABSENT versus DISABLED-with-a-named-reason')
    expect(fixture).toContain('readingA')
    expect(fixture).toContain('readingB')
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

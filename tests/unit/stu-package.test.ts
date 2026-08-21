import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WorkPackageScreen } from '../../app/studio/work-package/WorkPackageScreen'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { decisionRecord } from '@/disclosure/decisions'
import { reachByStudioMatrix } from '@/studio/modules'
import { STU_SCREENS, stuScreensForModule } from '@/studio/screens'
import { STU_OWNED_SEAMS, STU_SEAMS, stuSeamById } from '@/studio/seams'
import { D21_MODELLED_FLAGS, DIFFICULTY_LEVELS, PACKAGE_STATES } from '@/studio/vocab'
import {
  STU_14_CROSS_SURFACE,
  STU_14_MATRIX,
  STU_14_ROW_IDS,
  STU_14_SOURCE_ROW_COUNT,
  stu14Row,
} from '@/studio/modules/stu-14/matrix'
import {
  COMPLETENESS_REQUIRED_ELEMENTS,
  INTEGRITY_REQUIRED_ELEMENTS,
  OFFLINE_SEVERITY_STATEMENT,
  PACKAGE_CONTENT_ELEMENTS,
  PACKAGE_CONTENT_GROUPINGS,
  PACKAGE_EXCLUSIONS,
  PINNING_LINE,
  QUARANTINE_MEANING,
  RUN_2026_08_14_A_PACKAGE,
  contentGrouping,
  coachingOmissionLines,
  manifestContains,
  packageManifestLines,
  verifyCompleteness,
  verifyIntegrity,
  withElementsRemoved,
  withTrainingItem,
  type PackageContentElement,
} from '@/studio/modules/stu-14/package'
import {
  STU_14_LOCAL_DISCLOSURES,
  packageManifestAffordance,
  packageRefusals,
  pinnedVersionAffordance,
  stu14Scenario,
} from '@/studio/modules/stu-14/rendering'

/**
 * `MOD-STU-14` — The Offline Package. Frozen source §5.14, card
 * L33783-L33959. Storyboard `SB-STU-17` (L33905), on an UNCATALOGUED route.
 *
 * The rules this file exists to hold, each with its planted defect recorded
 * in the task report:
 *
 * 1. **R22, rows 2 and 3.** "Trigger a package build" is `Not applicable —
 *    the build fires at run assignment in the Delivery Operations Hub`
 *    (L33823) while BOTH Supervisor columns read `Allowed with conditions`.
 *    Those are cross-surface statements. Slice 5 builds the definition, the
 *    manifest and the pinning contract and NEVER FIRES A BUILD, so this
 *    route offers no build, no re-pull and no swap control at all.
 * 2. **D8 / R17 — the gate asserts CONTENTS, NOT CARDINALITY.** `AC-STU-120`
 *    (L33941) says five classes; `AC-WF-AUT-009-01` (L53647) and
 *    `TEST-WF-AUT-009-01` (L53648) say six. Both groupings are recorded over
 *    ONE element set and neither count is asserted as the count.
 * 3. **R10 — the superseded description is a defect if it reappears**
 *    (L33803, `AC-STU-030`, `AC-STU-126`).
 * 4. **Quarantine sets aside; it never destroys and never delivers**
 *    (L33839, L32918, L31322).
 * 5. **Pinning is protected by OMISSION.** Nothing in this module can rebase
 *    a pinned package, because nothing in it references a version register at
 *    all. A guard can be deleted by a later refactor; an absent reference
 *    cannot.
 */

const STU_14_DIR = join(process.cwd(), 'src', 'studio', 'modules', 'stu-14')
const ROUTE_DIR = join(process.cwd(), 'app', 'studio', 'work-package')

/**
 * A CONCURRENT process's scratch probe is skipped. No plant site aims at
 * either of these two directories TODAY — but "this one cannot meet a probe"
 * is the reasoning that left four recursive walks unguarded, three of them
 * missed by a written list, so every recursive walk under `tests/` now asks
 * the question rather than each author deciding whether it needs to.
 * `tests/probe-paths.ts` carries the full account. The rule is enforced by
 * `tests/coverage/prohibited-patterns.test.ts`.
 *
 * No `own` argument: this file plants nothing, so it should see no probe.
 */
function filesUnder(dir: string, match: RegExp, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) filesUnder(full, match, acc)
    else if (match.test(entry.name)) acc.push(full)
  }
  return acc
}

function sourceOfThisModule(): string {
  return [...filesUnder(STU_14_DIR, /\.tsx?$/), ...filesUnder(ROUTE_DIR, /\.tsx?$/)]
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
}

/**
 * The same source with its comments removed.
 *
 * WRITTEN BECAUSE THE NAIVE VERSION WAS A FALSE POSITIVE, and it was found by
 * running it: the "reaches no version register" gate matched the sentence
 * *explaining* the rule — "It cannot rebase a pin, because it reaches nothing
 * that could." A gate about what the CODE reaches must read the code. This is
 * the same shape as the brief's own `/re-?pull/` matcher, which fails on the
 * verbatim transcription R22 requires.
 *
 * Deliberately NOT used for the R10 supersession scan: that rule is about
 * every delivered artefact, prose included, so it reads the whole file.
 */
function codeOfThisModule(): string {
  return sourceOfThisModule()
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/**
 * The route's own rendered markup, for every persona the shell admits.
 * Rendered rather than read off `out/`: the built-artefact scan over every
 * Studio route is task 24's gate 10, and a unit test that pretended to be it
 * would be asserting over a directory this project only produces after
 * `pnpm build`.
 */
function renderFor(persona: StudioPersonaColumn): string {
  return renderToStaticMarkup(createElement(WorkPackageScreen, { initialPersona: persona }))
}

function renderedForEveryPersona(): string {
  return STUDIO_PERSONA_COLUMNS.map(renderFor).join('\n')
}

/* ==================================================================== *
 * STEP 1 — the source's own table, L33822-L33829. EIGHT data rows,
 * and L33793-L33797's FIVE numbered classes.
 * ==================================================================== */

describe('the permission matrix is the source table at L33822-L33829', () => {
  it('carries all eight source rows across the matrix and the cross-surface register', () => {
    expect(STU_14_SOURCE_ROW_COUNT).toBe(8)
    expect(STU_14_MATRIX.length + STU_14_CROSS_SURFACE.length).toBe(STU_14_SOURCE_ROW_COUNT)
  })

  it('transcribes the five screen rows in the source’s own order and wording', () => {
    expect(STU_14_MATRIX.map((row) => row.capability)).toEqual([
      'Define package contents',
      'Swap the package of an in-flight Run',
      'Include Training Library content in a package',
      'Exclude a severity mapping from a package',
      'View which package version a Run is pinned to',
    ])
  })

  it('registers rows 2, 3 and 8 as cross-surface statements, never as Studio rows', () => {
    // FAILS IF: a row whose Allowed cells belong to another surface is
    // classified `screen` — which would derive Supervisor reach for a
    // capability this surface does not hold, and would put a control on the
    // screen for it. R22's named trap.
    expect(STU_14_CROSS_SURFACE.map((row) => row.capability)).toEqual([
      'Trigger a package build',
      'Perform an on-demand re-pull to a device',
      'Execute a package',
    ])
    expect(STU_14_CROSS_SURFACE.map((row) => row.heldOn)).toEqual([
      'SURF-DOH',
      'SURF-DOH',
      'SURF-FL',
    ])
  })

  it('answers all eight persona columns on every row — no blank cells (L10238)', () => {
    for (const row of STU_14_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].note.trim()).not.toBe('')
      }
    }
  })

  it('carries the source’s own cell wording where the cell states a reason', () => {
    expect(stu14Row('define-package-contents').cells['quality-manager'].note).toBe(
      'Explicitly prohibited — the package definition is platform-fixed from the published version',
    )
    expect(stu14Row('view-which-package-version-a-run-is-pinned-to').cells['read-only-auditor'].note).toBe(
      'Client Decision Required — DEC-AUDSTU-001',
    )
    expect(
      stu14Row('view-which-package-version-a-run-is-pinned-to').cells['supervisor-without-grant']
        .outcome,
    ).toBe('readOnly')
  })

  it('declares no `routedTo` at all — the absence IS the answer, MOD-STU-06 style', () => {
    // The surface renders a refusal DISABLED only where a cell's own words
    // point the reader at another row OF THIS MATRIX that the evaluator says
    // this same persona may act on. No cell of this card does, so the field is
    // not written: a map of eight nulls per row that no fold reads is a
    // declaration nothing consults, and that is the shape of defect this slice
    // has now shipped twice. Slice 5 gate 17 holds the cross-module version.
    //
    // FAILS IF: the field is declared again on this card without a fold that
    // reads it.
    for (const row of STU_14_MATRIX) {
      expect(Object.hasOwn(row, 'routedTo'), row.id).toBe(false)
    }
    void STUDIO_PERSONA_COLUMNS
  })

  it('derives reach from its own screen rows', () => {
    const reach = reachByStudioMatrix(STU_14_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-with-authoring-grant']).toBe('offered')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach.worker).toBe('withheld')
  })

  it('names every row id exactly once', () => {
    expect([...STU_14_ROW_IDS].sort()).toEqual([...new Set(STU_14_ROW_IDS)].sort())
    expect(STU_14_MATRIX.map((r) => r.id).sort()).toEqual([...STU_14_ROW_IDS].sort())
  })
})

/* ==================================================================== *
 * ROW 1 — the Quality Manager's categorical prohibition with NO
 * alternative holder anywhere. ABSENT, never disabled.
 * ==================================================================== */

describe('row 1 is an absence, not a disabled control', () => {
  it('renders no control for “Define package contents” for ANY persona', () => {
    // FAILS IF: `Explicitly prohibited` is mapped to a disabled button. The
    // package definition is platform-fixed and NO column, on any surface,
    // holds it — a disabled control would imply a condition that could
    // become true.
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const affordance = packageManifestAffordance(
        'define-package-contents',
        stu14Scenario({ persona }),
      )
      expect(affordance.kind).toBe('absent')
    }
  })

  it('states the platform-fixed reason where the control would have been', () => {
    const refusals = packageRefusals(stu14Scenario({ persona: 'quality-manager' }))
    const define = refusals.find((r) => r.id === 'define-package-contents')
    expect(define).toBeDefined()
    expect(define!.note).toMatch(/platform-fixed/i)
    // Every refused row is listed for every persona, so a shorter list can
    // never be read as a capability someone else holds.
    expect(refusals.map((r) => r.id)).toEqual([
      'define-package-contents',
      'swap-the-package-of-an-in-flight-run',
      'include-training-library-content-in-a-package',
      'exclude-a-severity-mapping-from-a-package',
    ])
  })
})

/* ==================================================================== *
 * STEP 2 — D8 / R17. CONTENTS, NEVER CARDINALITY.
 * ==================================================================== */

describe('the manifest asserts contents, never a count (D8, R17)', () => {
  it('carries every content element both criteria name, asserting no count', () => {
    // FAILS IF: any element either criterion names is dropped from the
    // package. Deliberately NO assertion on the number of classes — see D8.
    const pkg = RUN_2026_08_14_A_PACKAGE
    const named: readonly PackageContentElement[] = [
      'screen-content',
      'specification-limits',
      'gate-rules',
      'severity-mappings',
      'catalog-definitions',
      'tenant-action-bundles',
      'deviation-capture-forms',
      'coaching-defaults',
    ]
    for (const element of named) expect(manifestContains(pkg, element)).toBe(true)
  })

  it('records BOTH groupings over ONE element set, and neither as the count', () => {
    const five = contentGrouping('five-numbered-classes')
    const six = contentGrouping('six-mandatory-content-classes')

    // Every group of both groupings draws from the same closed element set.
    for (const grouping of PACKAGE_CONTENT_GROUPINGS)
      for (const group of grouping.groups)
        for (const element of group.elements)
          expect(PACKAGE_CONTENT_ELEMENTS).toContain(element)

    // The five-way grouping covers the whole set; the six-way one splits
    // class 3 into three and class 2 into two and DROPS screen content and
    // coaching. Both facts asserted, neither count privileged.
    const fiveCovers = new Set(five.groups.flatMap((g) => g.elements))
    const sixCovers = new Set(six.groups.flatMap((g) => g.elements))
    expect([...fiveCovers].sort()).toEqual([...PACKAGE_CONTENT_ELEMENTS].sort())
    expect(sixCovers.has('screen-content')).toBe(false)
    expect(sixCovers.has('coaching-defaults')).toBe(false)
    for (const element of sixCovers) expect(fiveCovers.has(element)).toBe(true)
  })

  it('renders both groupings with their locators and neither as THE count', () => {
    const html = renderedForEveryPersona()
    expect(html).toMatch(/L33793/)
    expect(html).toMatch(/AC-STU-120/)
    expect(html).toMatch(/AC-WF-AUT-009-01/)
    expect(html).toMatch(/TEST-WF-AUT-009-01/)
    // D8 is disclosed through the canon, not restated locally.
    expect(html).toMatch(/Open decision D8/)
  })

  it('exports no canonical class count anywhere in the module', () => {
    // FAILS IF: a `CLASS_COUNT`/`classes.length` assertion creeps back in.
    // R17: one manifest, two groupings, no count is THE count.
    expect(codeOfThisModule()).not.toMatch(/CLASS_COUNT|CONTENT_CLASS_COUNT|classCount/)
  })

  it('excludes Training Library content and escalation delivery (L33799)', () => {
    expect(PACKAGE_EXCLUSIONS.map((e) => e.id)).toEqual([
      'training-library-content',
      'escalation-delivery',
    ])
    for (const exclusion of PACKAGE_EXCLUSIONS) expect(exclusion.sourceRef).toMatch(/L33799/)
  })
})

/* ==================================================================== *
 * STEP 3 — R22. NO BUILD, NO RE-PULL, NO SWAP CONTROL ON THIS SURFACE.
 * ==================================================================== */

describe('no package build, re-pull or swap control exists on this Studio route', () => {
  it('offers no interactive control at all — SB-STU-17 is a read-only manifest', () => {
    // FAILS IF: any button, form, input or click handler lands on this
    // route. This is R22's named trap made structural: an implementer
    // reading only the Allowed cells of rows 2 and 3 puts a Build button
    // here, and a button is exactly what cannot exist on a read-only view.
    //
    // NOT the brief's regex. `/build package|trigger (a )?build|re-?pull|
    // swap package/i` is wrong in both directions, proved against the source
    // strings: it does NOT match "Trigger a package build" or "Swap the
    // package of an in-flight Run" (so the very defect it names passes it),
    // and it DOES match "Perform an on-demand re-pull to a device", the row
    // R22 requires to be transcribed verbatim (so correct code fails it).
    const source = [...filesUnder(ROUTE_DIR, /\.tsx$/), ...filesUnder(STU_14_DIR, /\.tsx$/)]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    expect(source).not.toMatch(/<button|<form|<input|onClick=|onSubmit=/)

    // And in the markup, per persona. The shell's own persona switcher is
    // reviewer chrome and lives ABOVE this screen; everything after this
    // screen's own region marker is this screen's, and it draws no control.
    let regionsSeen = 0
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const parts = renderFor(persona).split('data-testid="stu14-manifest-region"')
      if (parts.length === 1) {
        // The one persona the shell admits no content for at all.
        expect(persona).toBe('worker')
        continue
      }
      const region = parts[1] ?? ''
      expect(region.length).toBeGreaterThan(0)
      expect(region).not.toMatch(/<button|<input|<select|<textarea/)
      regionsSeen += 1
    }
    expect(regionsSeen).toBe(STUDIO_PERSONA_COLUMNS.length - 1)
  })

  it('states rows 2, 3 and 8 as another surface’s act, with the owner named', () => {
    const html = renderedForEveryPersona()
    for (const row of STU_14_CROSS_SURFACE) {
      expect(html).toContain(row.capability)
      expect(html).toContain(row.statement)
    }
    // The build seam is registered, so the sentence points at a row rather
    // than at nothing.
    const seam = stuSeamById(STU_SEAMS, 'package-build-trigger-and-pin')
    expect(seam.ownerSlices).toContain(6)
    expect(seam.contract).toMatch(/never fires a build/i)
  })

  it('preserves the source’s own cross-surface cells verbatim, all six columns', () => {
    const build = STU_14_CROSS_SURFACE.find((r) => r.id === 'trigger-a-package-build')
    expect(build).toBeDefined()
    expect(build!.cells.map((c) => c.text)).toEqual([
      'Not applicable — the build fires at run assignment in the Delivery Operations Hub',
      'Allowed with conditions — through run assignment in the Delivery Operations Hub',
      'Allowed with conditions — same',
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Explicitly prohibited',
    ])
  })
})

/* ==================================================================== *
 * STEP 4 — integrity, quarantine, and the separate completeness act.
 * ==================================================================== */

describe('a package failing integrity verification is quarantined, never delivered', () => {
  it('quarantines rather than delivers a package containing a training item', () => {
    // FAILS IF: a training item is packaged, or a failing package is
    // delivered, or quarantine destroys rather than sets aside.
    // AC-STU-080 (L32922), L32918, L31322.
    const verdict = verifyIntegrity(withTrainingItem(RUN_2026_08_14_A_PACKAGE, 'TRN-1'))
    expect(verdict.quarantined).toBe(true)
    expect(verdict.delivered).toBe(false)
    expect(verdict.destroyed).toBe(false)
    expect(verdict.failingElements).toContain('TRN-1')
    expect(verdict.state).not.toBe('Delivered')
  })

  it('names the failing element when a severity mapping is corrupted (TEST-STU-126)', () => {
    const verdict = verifyIntegrity(
      withElementsRemoved(RUN_2026_08_14_A_PACKAGE, ['severity-mappings']),
    )
    expect(verdict.quarantined).toBe(true)
    expect(verdict.failingElements).toEqual(['severity-mappings'])
    expect(verdict.statement).toMatch(/severity-mappings/)
  })

  it('delivers and pins a package that verifies', () => {
    const verdict = verifyIntegrity(RUN_2026_08_14_A_PACKAGE)
    expect(verdict.quarantined).toBe(false)
    expect(verdict.delivered).toBe(true)
    expect(verdict.failingElements).toEqual([])
  })

  it('does not quarantine for a storage-driven coaching omission', () => {
    // FAILS IF: coaching is treated as run-critical. "Coaching is assistance
    // rather than enforcement" — the omission is reported and the Run
    // proceeds (FUNC-STU-14-01-B-1).
    expect(INTEGRITY_REQUIRED_ELEMENTS).not.toContain('coaching-defaults')
    const verdict = verifyIntegrity(
      withElementsRemoved(RUN_2026_08_14_A_PACKAGE, ['coaching-defaults']),
    )
    expect(verdict.quarantined).toBe(false)
    expect(verdict.delivered).toBe(true)
  })

  it('keeps Quarantined a D21 FLAG, never a sixth member of the state enumeration', () => {
    // FAILS IF: 'Quarantined' is added to PACKAGE_STATES. L33839 enumerates
    // five states and puts Quarantined in the prose beside them; D21's
    // ruling is that the identity cards govern the enumerations and the
    // three prose states are modelled as flags.
    expect(PACKAGE_STATES).not.toContain('Quarantined')
    const flag = D21_MODELLED_FLAGS.find((f) => f.flag === 'Quarantined')
    expect(flag).toBeDefined()
    expect(flag!.attachesTo).toBe('package')
    expect(QUARANTINE_MEANING).toMatch(/set aside/i)
    expect(QUARANTINE_MEANING).toMatch(/not destroyed/i)
  })

  it('checks completeness as a SEPARATE act, before the version is distributable', () => {
    // SEQ-013 step 3 (L68396) and L68465: "`Versioned` and `Distributable`
    // are different states, so a version can exist in history without ever
    // having been safe to run."
    expect([...COMPLETENESS_REQUIRED_ELEMENTS].sort()).toEqual([
      'deviation-capture-forms',
      'gate-rules',
      'severity-mappings',
      'specification-limits',
    ])
    expect(verifyCompleteness(RUN_2026_08_14_A_PACKAGE).distributable).toBe(true)
    const short = verifyCompleteness(withElementsRemoved(RUN_2026_08_14_A_PACKAGE, ['gate-rules']))
    expect(short.distributable).toBe(false)
    expect(short.missing).toEqual(['gate-rules'])
    expect(short.statement).toMatch(/could not be built/i)
  })
})

/* ==================================================================== *
 * STEP 5 — R10. The superseded description appears nowhere.
 * ==================================================================== */

describe('the superseded offline-severity description appears in no artefact', () => {
  it('never repeats it in this module’s source or in its rendered markup', () => {
    // FAILS IF: the discovery-stage sentence — "processed at sync, with
    // severity-band evaluation running on the captured value at that point"
    // — reappears anywhere. L33803: "Any delivered artefact repeating the
    // superseded description is a defect." AC-STU-030, AC-STU-126.
    const subjects = [sourceOfThisModule(), renderedForEveryPersona()]
    for (const subject of subjects) {
      expect(subject).not.toMatch(/processed at sync/i)
      expect(subject).not.toMatch(
        /severity[-\s]band evaluation running on the captured value at that point/i,
      )
    }
  })

  it('states the superseding description instead, with the hold placed on the device', () => {
    expect(OFFLINE_SEVERITY_STATEMENT).toMatch(/at the moment of capture/i)
    expect(OFFLINE_SEVERITY_STATEMENT).toMatch(/without waiting for connectivity/i)
    expect(OFFLINE_SEVERITY_STATEMENT).toMatch(/What waits for reconnection is delivery/i)
    expect(renderedForEveryPersona()).toContain(OFFLINE_SEVERITY_STATEMENT)
  })
})

/* ==================================================================== *
 * STEP 6 — storage-driven omissions, by asset NAME (AC-STU-127).
 * ==================================================================== */

describe('coaching omitted for storage is listed explicitly by asset name', () => {
  it('names every omitted asset, and goes red when a name is dropped', () => {
    // FAILS IF: an omission is summarised as a count or a category. The
    // acceptance criterion is by NAME: "Coaching omissions for storage are
    // reported by asset name and never silently dropped" (AC-STU-127).
    const pkg = RUN_2026_08_14_A_PACKAGE
    expect(pkg.coachingOmittedForStorage.length).toBeGreaterThan(0)
    const lines = coachingOmissionLines(pkg)
    for (const name of pkg.coachingOmittedForStorage) {
      expect(lines.some((line) => line.includes(name))).toBe(true)
    }
    const html = renderedForEveryPersona()
    for (const name of pkg.coachingOmittedForStorage) expect(html).toContain(name)
  })

  it('reports no omission where nothing was omitted, rather than an empty list', () => {
    const complete = { ...RUN_2026_08_14_A_PACKAGE, coachingOmittedForStorage: [] }
    expect(coachingOmissionLines(complete)).toEqual([
      'No coaching asset was omitted for storage on this device.',
    ])
  })

  it('renders DEC-STORE-001 as deferred, inventing no storage-full behaviour', () => {
    const store = STU_14_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-STORE-001')
    expect(store).toBeDefined()
    expect(store!.adopted).toMatch(/no behaviour is invented here/i)
    expect(renderedForEveryPersona()).toMatch(/DEC-STORE-001/)
    // The canon carries no record for it, and that absence is declared
    // rather than papered over with a borrowed identifier.
    expect(store!.canonNote).toMatch(/carries no record/i)
  })

  it('renders DEC-PKGFIELD-001 as an open field-by-field assignment (L33807)', () => {
    const field = STU_14_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-PKGFIELD-001')
    expect(field).toBeDefined()
    expect(field!.readings.some((r) => /Part VII does not enumerate it/i.test(r.text))).toBe(true)
    expect(renderedForEveryPersona()).toMatch(/DEC-PKGFIELD-001/)
  })
})

/* ==================================================================== *
 * STEP 7 — the pin renders, and nothing suggests a newer version
 * changes it. DEC-LIB-001, DEC-WIDIFF-001, and protection by OMISSION.
 * ==================================================================== */

describe('the package is pinned per Run and the pin is rendered, never fired', () => {
  it('renders the source’s own pinning line verbatim (SB-STU-17, L33905)', () => {
    expect(PINNING_LINE).toBe(
      'This Run executes this package. A newer published version does not change it.',
    )
    expect(renderedForEveryPersona()).toContain(PINNING_LINE)
  })

  it('reports the pinned version even while a newer version is published', () => {
    // FAILS IF: any view resolves the pinned version through a published-
    // version lookup. `AC-STU-125`: a package is pinned per Run and is never
    // swapped mid-Run by any actor or publication.
    const lines = packageManifestLines({
      ...RUN_2026_08_14_A_PACKAGE,
      newerPublishedVersion: 'v2.2.0',
    })
    const version = lines.find((l) => l.label === 'Pinned Workflow version')
    expect(version).toBeDefined()
    expect(version!.value).toContain('v2.1.0')
    expect(version!.value).not.toContain('v2.2.0')
  })

  it('protects the pin by OMISSION: this module reaches no version register at all', () => {
    // FAILS IF: this module imports the publication or version machinery. A
    // guard can be deleted by a later refactor along with its tests; an
    // absent reference cannot. Task 12's publish never references the run
    // register, and this module returns the compliment.
    const code = codeOfThisModule()
    expect(code).not.toMatch(/from '@\/studio\/publish/)
    expect(code).not.toMatch(/stu-12/)
    expect(code).not.toMatch(/rebase|repin|swapPackage|latestPublished/i)
  })

  it('renders DEC-LIB-001’s counter-argument rather than only its adopted reading', () => {
    const d15 = decisionRecord('DEC-LIB-001')
    expect(d15.decisionRef).toBe('DEC-LIB-001')
    expect(d15.adopted).toMatch(/delays a safety-motivated checklist improvement by up to one Run/)
    expect(renderedForEveryPersona()).toMatch(/Open decision DEC-LIB-001/)
  })

  it('ships all three difficulty levels and states the storage trade-off (DEC-WIDIFF-001)', () => {
    expect([...RUN_2026_08_14_A_PACKAGE.difficultyLevels].sort()).toEqual(
      [...DIFFICULTY_LEVELS].sort(),
    )
    const d16 = decisionRecord('DEC-WIDIFF-001')
    expect(d16.decisionRef).toBe('DEC-WIDIFF-001')
    expect(d16.adopted).toMatch(/multiplies the instruction payload by three/)
    expect(renderedForEveryPersona()).toMatch(/Open decision DEC-WIDIFF-001/)
  })

  it('withholds the manifest from the personas whose cell withholds the read', () => {
    // SCOPE IS ENFORCED IN THE READ, not in what is drawn. Asked once, for
    // the whole view.
    expect(pinnedVersionAffordance(stu14Scenario({ persona: 'quality-manager' })).kind).toBe(
      'enabled',
    )
    expect(pinnedVersionAffordance(stu14Scenario({ persona: 'supervisor-without-grant' })).kind).toBe(
      'disabled',
    )
    expect(pinnedVersionAffordance(stu14Scenario({ persona: 'read-only-auditor' })).kind).toBe(
      'decision-open',
    )
    expect(pinnedVersionAffordance(stu14Scenario({ persona: 'worker' })).kind).toBe('absent')
  })
})

/* ==================================================================== *
 * SB-STU-17 — the manifest fields the source names, all of them.
 * ==================================================================== */

describe('SB-STU-17 renders every field the source names (L33905)', () => {
  it('lists the pinned version, locale, levels, screen count and every content presence', () => {
    const labels = packageManifestLines(RUN_2026_08_14_A_PACKAGE).map((l) => l.label)
    expect(labels).toEqual([
      'Pinned Workflow version',
      'Run locale',
      'Difficulty levels carried',
      'Screens',
      'Specification limits and gate rules',
      'Severity mappings, catalog levels and tenant action bundles',
      'Deviation-capture forms',
      'Coaching assets included',
      'Coaching omitted for storage',
    ])
  })

  it('is annotated as uncatalogued rather than borrowing a catalogue-B id', () => {
    // TWO HALVES, AND ONLY ONE OF THEM IS THIS MODULE'S TO HOLD. The first
    // draft of this test asserted only `not.toMatch(/SCR-STU-\d\d/)` on the
    // markup, and planting the defect — passing `screenId="SCR-STU-04"` from
    // the route — left it GREEN. `stuScreensForModule` returns nothing for
    // MOD-STU-14, so the shell cannot render a catalogue id here whatever it
    // is handed, and the assertion could not fail. Recorded rather than
    // quietly deleted: a gate never seen red is not a gate.
    //
    // (a) This module's half, and it IS plantable: the route passes no
    //     `screenId`, because catalogue B carries no row for MOD-STU-14 to
    //     annotate. Passing one is how a borrowed id gets in.
    expect(codeOfThisModule()).not.toMatch(/screenId=/)
    // (b) The shell's half, asserted as the shell's rather than claimed as
    //     this module's protection.
    expect(stuScreensForModule(STU_SCREENS, 'MOD-STU-14')).toEqual([])

    const html = renderedForEveryPersona()
    expect(html).toMatch(/SB-STU-17/)
    expect(html).toMatch(/Catalogue B carries no row for MOD-STU-14/)
    expect(html).not.toMatch(/SCR-STU-\d\d/)
  })

  it('declares the two forward seams rather than simulating a device', () => {
    const delivery = stuSeamById(STU_SEAMS, 'package-delivery-on-device')
    expect(delivery.ownerSlices).toEqual([7, 8])
    expect(renderedForEveryPersona()).toContain(delivery.contract)
    // The manifest this slice OWNS, pinned so a rename over there goes red.
    const owned = STU_OWNED_SEAMS.find((s) => s.id === 'work-package-definition-and-manifest')
    expect(owned).toBeDefined()
    expect(owned!.sourceRef).toMatch(/L33793-L33797/)
  })
})

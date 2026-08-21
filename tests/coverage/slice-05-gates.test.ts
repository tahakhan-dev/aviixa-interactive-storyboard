import { describe, it, expect } from 'vitest'
import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  existsSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'
import { namesPersonBehaviouralMeasure } from './person-measure-keys'
import { isForeignProbe as isForeign, ownProbeDir, withPlanted } from '../probe-paths'

import { STU_MODULES, STU_PERSONAS, type StudioModuleId } from '@/studio/modules'
import {
  STUDIO_PERSONA_COLUMNS,
  evaluateStudioAccess,
  type StudioAccessInput,
  type StudioCellOutcome,
  type StudioMatrixRow,
} from '@/studio/access/evaluate'
import {
  CAPTURE_TYPES,
  CONFIGURATION_SECTIONS,
  INHERITABLE_DEFAULTS,
  WORKFLOW_SETTINGS,
  type CaptureType,
  type ConfigurationSection,
  type InheritableDefault,
  type WorkflowSetting,
} from '@/studio/vocab/authoring'
import { PUBLISH_CHECKS, type PublishCheckId } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
  type PublishCheckImplementation,
  type PublishCheckRegister,
} from '@/studio/publish/register'
import { STU_SEAMS, stuSeamById, stuSeamStatus, type StudioSeamDefinition } from '@/studio/seams'
import {
  PART_SEAM_WRITABLE_FIELDS,
  confirmedPartsRegistry,
  unconfirmedPartsRegistry,
  unreachablePartsRegistry,
} from '@/studio/seams/parts/registry'
import { STU_CONNECTIVITY_TREATMENTS } from '@/studio/state/connectivity'
import {
  COMMAND_STATE_PHRASES,
  FORBIDDEN_ADOPTION_WORDS,
  claimsAdoption,
  renderAdoption,
} from '@/studio/state/adoption'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { permitsAction } from '@/policy/decision'
import type { ScenarioDomainState } from '@/domain/state'
import { tenantId } from '@/domain/ids'

/* ---- the module surfaces the gates drive ---- */
import {
  CAPABILITY_REGISTER,
  capabilityById,
  STU01_SEED_STATE,
  type AtomicCapabilityId,
} from '@/studio/modules/stu-01/capabilities'
import { charterActionRow, personaIdentity, setCapabilityEnablement } from '@/studio/modules/stu-01/service'
import {
  SEEDED_LIBRARY,
  SEEDED_SCENARIO as STU03_SEEDED_SCENARIO,
  createWorkflow,
  isUnreleasedStatus,
  openWorkflowById,
  workflowIdFor,
  workflowsVisibleTo,
  type LibraryScenario,
} from '@/studio/modules/stu-03/library'
import {
  SEEDED_BUILDER_WORKFLOW,
  WORKFLOW_KEYS,
  drawnOrder,
  sequenceDetectionReference,
} from '@/studio/modules/stu-04/workflow'
import { reorderScreenNodes } from '@/studio/modules/stu-04/writes'
import {
  decisionForRow as stu04DecisionForRow,
  draftCanvasFor,
  publishedCanvasFor,
  readableWorkflows,
  scenario as stu04Scenario,
} from '@/studio/modules/stu-04/rendering'
import { stu04Row } from '@/studio/modules/stu-04/matrix'
import { SCREEN_LIBRARY_REGISTER } from '@/studio/modules/stu-05/rendering'
import { WHEEL_BOLT_CONFIGURATION, attachPointer } from '@/studio/modules/stu-05/sections'
import { WHEEL_BOLT_SCREENS, screenById } from '@/studio/modules/stu-09/levels'
import { SEEDED_BLOCK_REGISTER, scopeOf } from '@/studio/modules/stu-06/blocks'
import { applyBlockToScreen, createBlock } from '@/studio/modules/stu-06/writes'
import { SEEDED_LIBRARY_REGISTER, itemsInLibrary } from '@/studio/modules/stu-07/libraries'
import { approveCoachingAsset } from '@/studio/modules/stu-07/writes'
import {
  decisionForRow as stu07DecisionForRow,
  scenario as stu07Scenario,
} from '@/studio/modules/stu-07/rendering'
import { stu07Row } from '@/studio/modules/stu-07/matrix'
import { SEEDED_TRAINING_REGISTER, trainingService } from '@/studio/modules/stu-08/training'
import { editDifficultyLevel } from '@/studio/modules/stu-09/levels'
import { SEEDED_DRAFT, inlineAddPart, stepReferences } from '@/studio/modules/stu-10/seam'
import { CLEARANCE_EFFECTIVE_STATES, clearanceEffective } from '@/studio/modules/stu-13/qualifications'
import { mapComposedAgent, SEEDED_COMPOSED_AGENTS, composedAgentById } from '@/studio/modules/stu-15/builder'
import { learningService, stu16Decision, stu16Scenario } from '@/studio/modules/stu-16/rendering'
import { WHEEL_BOLT_LOCALISATION } from '@/studio/modules/stu-17/locales'
import { localisationService } from '@/studio/modules/stu-17/rendering'
import {
  SEEDED_GRANT_REGISTER,
  administerGrant,
  holderById,
} from '@/studio/modules/stu-18/grant-admin'
import {
  SEEDED_SCENARIO as STU18_SEEDED_SCENARIO,
  SEEDED_STATE as STU18_SEEDED_STATE,
  SEEDED_TENANT,
  decisionForRow as stu18DecisionForRow,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import { stu18Row } from '@/studio/modules/stu-18/matrix'

import {
  FIXTURE_REGISTER,
  RELEASED_SUBMISSION,
  SEEDED_DEVICES,
  contextFor,
  registerFor,
} from '../../app/studio/versions/fixtures'
import { mintedNumbers, publish, ROLLBACK_DISCLOSURE } from '@/studio/modules/stu-12/versions'
import {
  FIXTURE_DOMAIN,
  FIXTURE_STAFFING,
  FIXTURE_TENANT,
  SEEDED_VIEWERS,
} from '../../app/studio/approvals/fixtures'
import {
  advance,
  seededDiffEngine,
  submit,
  type ApprovalChain,
  type ApprovalContext,
} from '@/studio/modules/stu-11/chain'

/* ==================================================================== *
 * SLICE 5 GATES — SURF-STU, the Standards and Operations Studio.
 *
 * THE STANDARD, and it is the whole reason this file exists in the shape
 * it does: **a gate that cannot fail is worse than no gate**, because it
 * reads as coverage. Slice 4 shipped four of them plus one whose baseline
 * was chosen so the failure could not appear. Slice 5's own briefs then
 * produced ten more — a regex spelling `locale pack` where the source
 * writes `locale-pack`, a `not.toContain` subset check that passes on the
 * wrong element, four tests putting JSX in a node-environment suite so
 * they never compiled, a `blocked` check the register satisfied anyway by
 * failing closed, one that read a pre-edit fixture AND asserted against a
 * set that already contained the value it authored, and one that printed
 * "expected 54, computed 54" while failing.
 *
 * So every gate below:
 *
 *   - reads the BUILT ARTEFACT wherever the claim is about what renders,
 *     and asserts the file set is NON-EMPTY before any negative match — a
 *     scan of zero files passes every `not.toMatch` anyone can write;
 *   - enumerates its files FROM THE DIRECTORY where it is per-module, and
 *     asserts that enumeration against `src/studio/modules.ts`'s eighteen
 *     rows, so an enumeration that finds nothing is RED, not green;
 *   - pins its expectation against a source INDEPENDENT of the field under
 *     test, because task 21 shipped two tests that derived their
 *     expectation from the classification they were checking and task 23's
 *     compose gate rendered the composed screen on both sides of its own
 *     assertion;
 *   - quotes numbers, in any failure message, from the same constant the
 *     assertion uses.
 * ==================================================================== */

const STUDIO_APP_ROOT = join('app', 'studio')
const STUDIO_SRC_ROOT = join('src', 'studio')
const STUDIO_MODULE_ROOT = join('src', 'studio', 'modules')
const OUT_STUDIO = join('out', 'studio')

/**
 * This process's own scratch-probe directory name, and the exclusion that
 * makes each process blind to every probe but its own. Carried in shape
 * from `slice-04-gates.test.ts`, where the race it removes was reproduced
 * directly: two concurrent runs collided on one literal probe path and one
 * process's `finally` deleted the probe out from under the other's scan.
 *
 * Dot-prefixed: `tsc`'s `include` glob does not descend into a path segment
 * starting with `.`, and Next's app router does not treat one as a route
 * segment, so a concurrent `pnpm typecheck` or `next build` can never see a
 * probe mid-lifetime.
 */
const OWN_PROBE_DIR = ownProbeDir()
const isForeignProbe = (entry: string): boolean => isForeign(entry, OWN_PROBE_DIR)

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

const entriesOf = (dir: string): string[] => readdirSync(dir).filter((e) => !isForeignProbe(e))

const PROBE_ROOTS = [STUDIO_SRC_ROOT, STUDIO_APP_ROOT, OUT_STUDIO, STUDIO_MODULE_ROOT]

// Defend against pid reuse: a PAST crashed run that left OWN_PROBE_DIR
// behind, plus this run drawing the same pid, would admit that STALE probe
// into every scan as this run's own. Clear them before anything else runs.
for (const root of PROBE_ROOTS) rmSync(join(root, OWN_PROBE_DIR), { recursive: true, force: true })

process.on('exit', () => {
  for (const root of PROBE_ROOTS) {
    try {
      rmSync(join(root, OWN_PROBE_DIR), { recursive: true, force: true })
    } catch {
      // Best-effort: nothing else can run once the process is exiting.
    }
  }
})

/* -------------------------------------------------------------------- *
 * THE BUILT ARTEFACT.
 *
 * Every claim about what RENDERS is read from `out/studio/**`, never from
 * the source that hopes to produce it — slice 3 shipped two screens whose
 * disclosure was stranded after the component's closing brace: dead
 * top-level JSX that typechecked, linted and rendered nothing, and a
 * source-reading gate called it present.
 * -------------------------------------------------------------------- */

interface BuiltRoute {
  /** `/studio` or `/studio/<slug>`. */
  readonly route: string
  readonly file: string
  readonly html: string
  readonly doc: Document
}

/**
 * THE ROUTE POPULATION, DERIVED — NOT A HAND-WRITTEN FLOOR.
 *
 * This was `BUILT_STUDIO_ROUTE_FLOOR = 17` against an actual 18, asserted
 * with `toBeGreaterThanOrEqual`. Losing exactly one Studio route was
 * therefore green, forever, on a build that had silently stopped exporting
 * one — and the number was standing in for a fact the tree already knows.
 *
 * DERIVED FROM THE AUTHORED TREE, ASSERTED AGAINST THE BUILT ONE. The
 * expectation comes from `app/studio/**\/page.tsx`; the subject is
 * `out/studio/**\/index.html`. Two different artefacts from two different
 * inputs — an expectation read out of `out/` would prove only that the
 * export equals itself, which is a mistake this build has now made four
 * times. Only step 5 (`build`) of `pnpm verify` rewrites `out/`, and nothing
 * in `verify` rewrites `app/`, so neither side is authored by the other.
 *
 * IT IS A SET, NOT A COUNT, and the set is the cheaper of the two to get
 * right: a route that stops building and a route that appears in the export
 * with no author in `app/` are both named in the failure rather than
 * cancelling out in a total.
 *
 * ONE LEVEL DEEP, deliberately and visibly: `readAllBuiltStudioRoutes` below
 * reads `out/studio/<entry>/index.html` and no deeper, so a nested authored
 * route (`app/studio/a/b/page.tsx`) appears on the authored side, never on
 * the built side, and turns this red rather than being silently uncovered by
 * every gate in this file.
 */
function authoredStudioRoutes(): readonly string[] {
  const pages = walk(STUDIO_APP_ROOT).filter((f) => basename(f) === 'page.tsx')
  return pages
    .map((f) => relative(STUDIO_APP_ROOT, dirname(f)))
    .map((rel) => (rel === '' ? '/studio' : `/studio/${rel.split(sep).join('/')}`))
    .sort()
}

/**
 * Parsed built routes, cached on the exact bytes they were parsed from.
 *
 * Three gate-1 cases were taking four to five seconds each and timing out
 * about one run in nine. The cause was not contention and not the file
 * reads: every call re-ran JSDOM over every built page, and seven call
 * sites do that. The project's own rule says a test slow because it
 * repeats itself is MADE FASTER rather than given more time, so this is
 * memoised instead of being handed a longer budget.
 *
 * The cache key is the concatenated HTML, not a file list or an mtime.
 * Several gates PLANT a violation into out/ and delete it again, and a
 * cache those plants could not invalidate would quietly serve the
 * pre-plant document -- turning every planted proof green and defeating
 * the one thing this file exists to demonstrate. Reading the bytes is
 * cheap; parsing them is not, so the read happens every call and only the
 * parse is reused.
 */
let parsedRoutes: { key: string; routes: readonly BuiltRoute[] } | null = null

function readAllBuiltStudioRoutes(): readonly BuiltRoute[] {
  const raw: { route: string; file: string; html: string }[] = []
  const push = (route: string, file: string): void => {
    if (!existsSync(file)) return
    raw.push({ route, file, html: readFileSync(file, 'utf8') })
  }
  push('/studio', join(OUT_STUDIO, 'index.html'))
  for (const entry of entriesOf(OUT_STUDIO)) {
    const dir = join(OUT_STUDIO, entry)
    if (!statSync(dir).isDirectory()) continue
    push(`/studio/${entry}`, join(dir, 'index.html'))
  }
  // Hashed rather than concatenated: the pages total several megabytes, and
  // building one string of them on every call cost more than it saved. A
  // native digest over the same bytes is the same guarantee for a fraction
  // of the work -- and it must stay content-based, not mtime-based, because
  // the plants below rewrite pages in place.
  const digest = createHash('sha1')
  for (const r of raw) digest.update(r.file).update('\u0000').update(r.html).update('\u0001')
  const key = digest.digest('hex')
  if (parsedRoutes?.key === key) return parsedRoutes.routes
  const routes = raw.map((r) => ({ ...r, doc: new JSDOM(r.html).window.document }))
  parsedRoutes = { key, routes }
  return routes
}

/**
 * THE NON-EMPTY GUARD, and it is called by every gate that goes on to make
 * a negative assertion over the built tree. A scan of zero files passes
 * every `not.toMatch` that can be written, which is how a gate reports
 * success over nothing.
 */
function builtStudioRoutes(): readonly BuiltRoute[] {
  const routes = readAllBuiltStudioRoutes()
  // This process's OWN probe is excluded from the population and from
  // nothing else. Six gates in this file plant
  // `out/studio/<own probe>/index.html` and require the content scans below
  // to see it; it is still not a route, and counting it would make every
  // planted case fail this guard instead of the gate it is aimed at.
  const population = routes
    .map((r) => r.route)
    .filter((r) => r !== `/studio/${OWN_PROBE_DIR}`)
    .sort()
  expect(
    population,
    'the built Studio export no longer matches the routes authored under app/studio. Run ' +
      '`pnpm build`. A route present on one side only is either a page that stopped ' +
      'exporting or an export with no author — and a scan of an empty export passes every ' +
      'negative assertion in this file.',
  ).toEqual(authoredStudioRoutes())
  return routes
}

/** Whitespace-normalised visible text of a built page. */
const textOf = (route: BuiltRoute): string =>
  (route.doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()

/**
 * Anything a person can operate or land on with a keyboard. `[disabled]`
 * and `[aria-disabled]` are in here deliberately: gate 14's claim is that a
 * cross-surface statement is NOT A CONTROL, and a disabled control is still
 * a control. Slice 4 shipped a test satisfied by an `aria-disabled` button
 * because it asserted only presence.
 */
const CONTROL_SEMANTICS = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[tabindex]',
  '[disabled]',
  '[aria-disabled]',
].join(',')

interface BuiltControl {
  readonly route: string
  readonly name: string
}

function builtStudioControls(routes: readonly BuiltRoute[]): readonly BuiltControl[] {
  const controls: BuiltControl[] = []
  for (const route of routes) {
    for (const el of route.doc.querySelectorAll(CONTROL_SEMANTICS)) {
      const name = [
        el.getAttribute('aria-label') ?? '',
        el.getAttribute('value') ?? '',
        el.textContent ?? '',
      ]
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      controls.push({ route: route.route, name })
    }
  }
  return controls
}

/** `MOD-STU-03`'s scenario, overridden one field at a time. */
const stu03Scenario = (over: Partial<LibraryScenario> = {}): LibraryScenario => ({
  ...STU03_SEEDED_SCENARIO,
  ...over,
})

/** `MOD-STU-18`'s scenario, overridden one field at a time. */
const stu18Scenario = (over: Partial<Stu18Scenario> = {}): Stu18Scenario => ({
  ...STU18_SEEDED_SCENARIO,
  ...over,
})

/* -------------------------------------------------------------------- *
 * THE PER-MODULE ENUMERATION — C17.
 *
 * Enumerated FROM THE DIRECTORY, never from a hardcoded list, and asserted
 * complete against `src/studio/modules.ts`'s eighteen rows. An enumeration
 * that finds nothing is RED here, not green.
 * -------------------------------------------------------------------- */

/** `MOD-STU-07` → `stu-07`, the directory convention the reach generator uses. */
const dirNameFor = (id: StudioModuleId): string => `stu-${id.slice(-2)}`

function studioModuleDirs(): readonly { id: StudioModuleId; dir: string }[] {
  const onDisk = new Set(
    entriesOf(STUDIO_MODULE_ROOT).filter((e) => statSync(join(STUDIO_MODULE_ROOT, e)).isDirectory()),
  )
  const expected = STU_MODULES.map((m) => dirNameFor(m.id))
  // BOTH DIRECTIONS. A directory the registry has no row for is as much a
  // failure as a row with no directory: the first is a module nothing
  // enumerates, the second is an enumeration over a module that is gone.
  expect([...onDisk].sort(), 'src/studio/modules/ does not match the eighteen registry rows').toEqual(
    [...expected].sort(),
  )
  expect(expected.length, 'the Studio module registry is not eighteen rows').toBe(18)
  return STU_MODULES.map((m) => ({ id: m.id, dir: join(STUDIO_MODULE_ROOT, dirNameFor(m.id)) }))
}

/** Every `.ts`/`.tsx` file in a module directory, enumerated from the directory. */
const moduleFiles = (dir: string): readonly string[] =>
  entriesOf(dir)
    .filter((e) => /\.tsx?$/.test(e))
    .map((e) => join(dir, e))

type RawCell = { readonly outcome?: unknown } | string
type RawMatrixRow = Record<string, unknown> & {
  readonly surface: unknown
  readonly cells?: Record<string, RawCell>
  readonly status?: Record<string, RawCell>
}

interface FoundMatrix {
  readonly moduleId: StudioModuleId
  readonly file: string
  readonly exportName: string
  readonly rows: readonly RawMatrixRow[]
}

/** A matrix is an array of rows each carrying a `surface` classification. */
function matricesIn(exports: Record<string, unknown>): [string, readonly RawMatrixRow[]][] {
  return Object.entries(exports).filter(
    (entry): entry is [string, readonly RawMatrixRow[]] =>
      Array.isArray(entry[1]) &&
      entry[1].length > 0 &&
      entry[1].every((row) => row !== null && typeof row === 'object' && 'surface' in row),
  )
}

let matrixCache: readonly FoundMatrix[] | null = null

async function studioMatrices(): Promise<readonly FoundMatrix[]> {
  if (matrixCache !== null) return matrixCache
  const found: FoundMatrix[] = []
  for (const { id, dir } of studioModuleDirs()) {
    for (const file of moduleFiles(dir)) {
      const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>
      for (const [exportName, rows] of matricesIn(mod)) {
        found.push({ moduleId: id, file, exportName, rows })
      }
    }
  }
  matrixCache = found
  return found
}

const rowCells = (row: RawMatrixRow): Record<string, RawCell> => {
  const cells = row.cells ?? row.status
  if (cells === undefined) throw new Error(`matrix row carries neither cells nor status: ${String(row.id)}`)
  return cells
}

const outcomeOf = (cell: RawCell): string => (typeof cell === 'string' ? cell : String(cell.outcome))

const rowLabel = (row: RawMatrixRow): string =>
  String(row.id ?? row.capability ?? row.action ?? row.control ?? '(unnamed row)')

/* ==================================================================== *
 * GATE 1 — the derived module count never renders bare.
 * ==================================================================== */

describe('slice 5 gate 1: no bare Studio module count in the built tree', () => {
  /* S12, `AC-STU-014` (L30992): "No document, screen, or interface produced
   * by this programme presents a Studio module count as a
   * Statement-of-Work fact." L30897 is the fact being qualified — the
   * Statement of Work provides NO canonical module count for this surface
   * — and L30899 is the rule the eighteen were derived by, recorded as
   * `DEC-STUDIO-001`.
   *
   * THE MATCH IS OVER RENDERED TEXT, NOT OVER MARKUP, and that is not a
   * detail. React emits `{count} modules` as `18<!-- --> modules`, so a
   * `grep "18 modules"` over the HTML matches NOTHING and the gate would
   * report success while the qualifier was gone. Proved against the real
   * artefact before this gate was trusted. */

  /** The two things the qualifier must carry, in the source's own words. */
  const QUALIFIER = 'derived count, not stated in the Statement of Work'
  const DECISION_REF = 'DEC-STUDIO-001'

  /**
   * A COUNT OF MODULES: a numeral or the spelled form, then `modules` or
   * `module cards`. `eighteen` is included because the count spelled out is
   * the same claim — `AC-STU-014` binds the CLAIM, not a numeral.
   *
   * TWO NARROWINGS, BOTH FOUND BY RUNNING THE PATTERN AGAINST THE REAL
   * EXPORT rather than by reasoning about it:
   *
   *  - the negative lookbehind. `\d+\s+modules?` matched *"chapter-20 module
   *    matrices"* on the permissions screen — `20` from an identifier and
   *    `module` from a different noun phrase. That is the fifth time this
   *    build has matched a token inside a larger term it does not mean
   *    (`signed` in "signed-in", `18` in `MOD-SA-18`, `Worker` in
   *    "Worker-Shift", `count` in "accountState").
   *  - `modules?` became `modules|module cards`, so the singular in "module
   *    matrices" and "module template" is not a count at all.
   */
  const MODULE_COUNT = /(?<![-\w])(?:\d+|eighteen|Eighteen)\s+module(?:s|\s+cards)\b/

  /**
   * WHICH counts `AC-STU-014` binds: counts of STUDIO modules. The build's
   * whole-registry figures ("63 of 81 modules", across five surfaces) are a
   * different claim and the criterion does not reach them.
   *
   * The element is the unit rather than the sentence, because a count and
   * its qualifier are two clauses of one paragraph and splitting on `.`
   * would cut "Statement of Work." in half.
   */
  const NAMES_THE_STUDIO = /\bStudio\b|MOD-STU-|SURF-STU/

  /**
   * The INNERMOST element whose text carries the whole phrase. Innermost
   * because every ancestor also contains it, and reporting the `<body>` as
   * a site would make the gate name the page rather than the sentence.
   */
  function countSites(doc: Document): readonly Element[] {
    const sites: Element[] = []
    // Whole-document check first. Below, every element is asked for its own
    // textContent, and JSDOM computes that by re-walking all descendants --
    // so on a page with thousands of nodes the loop is quadratic in the
    // page's text. Most built pages do not mention a module count at all,
    // and for those this returns immediately instead of walking the tree.
    //
    // Measured, because the last two attempts at this were guesses: gate 1's
    // three cases ran 4.0s, 5.1s and 5.1s against a 5s budget and timed out
    // about one run in nine. Memoising the JSDOM parse across call sites did
    // NOT help -- the cost was here, inside a single case, not in repeated
    // parsing. Same rule as the unit project's: a test slow because it
    // repeats itself is made faster, not given a longer budget.
    //
    // `body` rather than `documentElement` so `<head>` is out, and the same
    // whitespace collapse as below so a count broken across a newline is
    // still seen by this pre-check. It must never be NARROWER than the loop.
    if (!MODULE_COUNT.test((doc.body?.textContent ?? '').replace(/\s+/g, ' '))) return sites
    for (const el of doc.querySelectorAll('*')) {
      // `<script>` and `<style>` contents are part of `textContent`, and
      // Next's flight payload carries the whole page's prose inside one
      // `<script>`. Scanning it reports every string twice, once as markup.
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue
      if (el.closest('script,style') !== null) continue
      const text = (el.textContent ?? '').replace(/\s+/g, ' ')
      if (!MODULE_COUNT.test(text)) continue
      const childCarries = [...el.children].some((c) =>
        MODULE_COUNT.test((c.textContent ?? '').replace(/\s+/g, ' ')),
      )
      if (!childCarries) sites.push(el)
    }
    return sites
  }

  /** The block this count sits in — the `data-count-scope` element where the
   *  page declares one, and otherwise the innermost site itself. */
  const scopeTextOf = (site: Element): string =>
    ((site.closest('[data-count-scope="studio-modules"]') ?? site).textContent ?? '').replace(
      /\s+/g,
      ' ',
    )

  /** Is this a count of STUDIO modules? The scope must say so. */
  const isStudioCount = (site: Element): boolean =>
    site.closest('[data-count-scope="studio-modules"]') !== null ||
    NAMES_THE_STUDIO.test(scopeTextOf(site))

  /** The qualifier, in either of the two forms the build renders it in. */
  const carriesQualifier = (text: string): boolean =>
    (text.includes(QUALIFIER) || text.includes('Derived Clarification')) &&
    text.includes(DECISION_REF)

  function moduleCountOffenders(pages: readonly BuiltRoute[]): readonly string[] {
    const offenders: string[] = []
    for (const page of pages) {
      for (const site of countSites(page.doc)) {
        if (!isStudioCount(site)) continue
        if (carriesQualifier(scopeTextOf(site))) continue
        offenders.push(
          `${page.file}: ${(site.textContent ?? '').replace(/\s+/g, ' ').slice(0, 140)}`,
        )
      }
    }
    return offenders
  }

  /**
   * Every built page in the export, not only the Studio's. `AC-STU-014` binds
   * every screen this programme produces, and the coverage pages are screens
   * this programme produces.
   *
   * MEMOISED ON THE BYTES, exactly as `readAllBuiltStudioRoutes` above is and
   * for the same reason. Three cases call this, and each call was re-running
   * JSDOM over all seventy built pages -- the project's own rule is that a
   * test slow because it REPEATS ITSELF is made faster rather than handed a
   * longer budget, and two of those three passes were pure repetition.
   * Measured with four whole-suite processes on the box: the first call takes
   * ~7.8s, so the two it saves were the difference between this gate fitting
   * inside its budget and timing out.
   *
   * The key is the content, never a file list or an mtime: the planted case
   * below rewrites a page in place, and a cache that plant could not
   * invalidate would serve the pre-plant document and turn the one proof this
   * gate exists to make green.
   */
  let parsedAllPages: { key: string; pages: readonly BuiltRoute[] } | null = null

  function allBuiltPages(): readonly BuiltRoute[] {
    const raw: { file: string; html: string }[] = []
    for (const file of walk('out')) {
      if (!file.endsWith('.html')) continue
      raw.push({ file, html: readFileSync(file, 'utf8') })
    }
    const digest = createHash('sha1')
    for (const r of raw) digest.update(r.file).update('\u0000').update(r.html).update('\u0001')
    const key = digest.digest('hex')
    if (parsedAllPages?.key === key) return parsedAllPages.pages
    const pages = raw.map((r) => ({
      route: r.file,
      file: r.file,
      html: r.html,
      doc: new JSDOM(r.html).window.document,
    }))
    parsedAllPages = { key, pages }
    return pages
  }

  // Timeout, per-test rather than per-project, on the same measurement and the
  // same rule as the planted case below: this reads and parses every built
  // page once, and under four concurrent whole-suite processes that real work
  // runs ~7.8s of REAL time for well under a second of USER time -- the
  // wait-for-scheduler signature, with the work itself unchanged. The repeated
  // half is fixed above by memoising; what is left is work, so it gets
  // headroom. Every OTHER release gate stays on the tight default.
  it('the page scan is non-empty and reaches the Studio index', () => {
    const pages = allBuiltPages()
    expect(pages.length, 'out/ holds no built HTML — run `pnpm build`').toBeGreaterThan(50)
    expect(
      pages.map((p) => p.file),
      'the walk missed the Studio index',
    ).toContain(join('out', 'studio', 'index.html'))
    // The matcher is live on this run, proved in BOTH directions on strings
    // the tree does not supply, through the same expression the scan uses.
    expect(MODULE_COUNT.test('18 modules')).toBe(true)
    expect(MODULE_COUNT.test('eighteen modules')).toBe(true)
    expect(MODULE_COUNT.test('eighteen module cards')).toBe(true)
    expect(MODULE_COUNT.test('modules')).toBe(false)
    // The two narrowings, each proved against the string that forced it.
    expect(MODULE_COUNT.test('the chapter-20 module matrices')).toBe(false)
    expect(MODULE_COUNT.test('the module template is identical for all eighteen')).toBe(false)
    expect(NAMES_THE_STUDIO.test('63 of 81 modules')).toBe(false)
    expect(NAMES_THE_STUDIO.test('the 18 Studio modules')).toBe(true)
  }, 30_000)

  it('every rendered Studio module count carries its qualifier and DEC-STUDIO-001', () => {
    expect(
      moduleCountOffenders(allBuiltPages()),
      'a Studio module count renders without its qualifier',
    ).toEqual([])
  }, 30_000)

  it('the count that DOES render is the registry length, so the gate is not passing on nothing', () => {
    const index = builtStudioRoutes().find((r) => r.route === '/studio')
    expect(index, 'no /studio index in the export').toBeDefined()
    const scope = index!.doc.querySelector('[data-count-scope="studio-modules"]')
    expect(scope, 'the Studio index renders no module-count scope at all').not.toBeNull()
    const text = (scope!.textContent ?? '').replace(/\s+/g, ' ')
    expect(text, `the rendered count is not ${STU_MODULES.length}`).toContain(
      `${STU_MODULES.length} modules`,
    )
    expect(text).toContain(QUALIFIER)
    expect(text).toContain(DECISION_REF)
  })

  // Timeout, per-test rather than per-project. Measured, not guessed: this
  // case passes 5/5 in isolation and fails about 1 run in 9 inside the full
  // release project, which is the wait-for-scheduler signature -- real time
  // far above user time, with the work itself unchanged. The unit project's
  // rule applies: a test slow because it is doing the work gets the headroom,
  // a test slow because it repeats itself gets made faster. This one reads the
  // 18MB source or the built tree once and is already memoised.
  //
  // Given per-test so every OTHER release gate stays on the tight default,
  // where a sudden slowdown is still a signal rather than absorbed noise.
  it('PLANTED VIOLATION: a bare count on a built page trips it', () => {
    withPlanted(
      OUT_STUDIO,
      'index.html',
      '<html><body><p>The Studio has 18 modules.</p></body></html>',
      () => {
        expect(
          moduleCountOffenders(allBuiltPages()).join(' '),
          'the planted bare count was not caught',
        ).toContain(OWN_PROBE_DIR)
      },
    )
  }, 30_000)
})

/* ==================================================================== *
 * GATE 2 — the closed vocabularies are exhaustive.
 * ==================================================================== */

describe('slice 5 gate 2: the closed authoring vocabularies are exhaustive', () => {
  /* DEC-CAP-001, R3, R5. Four sets, each closed by the source's own sentence, and
   * each carrying BOTH halves of the proof: the exact membership (so an
   * eighth member is red at run time) and a type-level companion (so an
   * eighth member is red at `tsc` time, before a test ever runs).
   *
   * THE EXPECTATIONS ARE WRITTEN OUT, NOT DERIVED FROM THE ARRAY UNDER
   * TEST. `expect(CAPTURE_TYPES).toEqual([...CAPTURE_TYPES])` is the shape
   * this build shipped in task 21 — an expectation derived from the field
   * it checks agrees with the field however wrong the field is. */

  it('capture types are the adopted seven plus none, in AC-STU-065’s own words (L32421)', () => {
    expect([...CAPTURE_TYPES]).toEqual([
      'measurement entry',
      'photo capture',
      'barcode or Quick Response code scan',
      'checkbox confirmation',
      'digital signature',
      'free text',
      'dropdown selection',
      'none',
    ])
    // Seven, PLUS none — stated as two numbers so an eighth capture type
    // cannot hide inside "eight members".
    expect(CAPTURE_TYPES.filter((t) => t !== 'none')).toHaveLength(7)
    expect(CAPTURE_TYPES).toContain('none')
  })

  it('Workflow settings are exactly the four of L32040', () => {
    expect([...WORKFLOW_SETTINGS]).toEqual([
      'name',
      'Job Type',
      'optional Service Type tag',
      'locale coverage',
    ])
  })

  it('inheritable defaults are exactly two, and severity is not one of them (L32040)', () => {
    expect([...INHERITABLE_DEFAULTS]).toEqual([
      'default-escalation-routing-template',
      'default-coaching-trigger-percentage',
    ])
    // "Deviation severity is never a workflow default" — the source names
    // the obvious third by name, so the gate refuses it by name.
    expect(INHERITABLE_DEFAULTS.some((d) => /severity/i.test(d))).toBe(false)
  })

  it('screen-configuration sections are exactly the nine of L32216-L32226, in section order', () => {
    expect([...CONFIGURATION_SECTIONS]).toEqual([
      'Screen content',
      'Input type',
      'Timing',
      'Gate and proof',
      'Specification limits',
      'Coaching content',
      'Deviation rules and severity mapping',
      'Tool and equipment',
      'Qualification override',
    ])
  })

  /**
   * THE TYPE-LEVEL COMPANION. These four aliases are `never` while each
   * union and its array agree. Widening the array without widening the
   * union fails `satisfies` in the vocabulary module; widening the union
   * without widening the array fails HERE, at `tsc`, with no test run.
   *
   * `void` on each keeps the linter from calling them unused while keeping
   * them as compile-time assertions rather than runtime ones.
   */
  it('the type-level companions still hold (the assertion is the compilation)', () => {
    const captureExhaustive: Exclude<CaptureType, (typeof CAPTURE_TYPES)[number]> extends never
      ? true
      : never = true
    const settingsExhaustive: Exclude<WorkflowSetting, (typeof WORKFLOW_SETTINGS)[number]> extends never
      ? true
      : never = true
    const defaultsExhaustive: Exclude<
      InheritableDefault,
      (typeof INHERITABLE_DEFAULTS)[number]
    > extends never
      ? true
      : never = true
    const sectionsExhaustive: Exclude<
      ConfigurationSection,
      (typeof CONFIGURATION_SECTIONS)[number]
    > extends never
      ? true
      : never = true
    expect([captureExhaustive, settingsExhaustive, defaultsExhaustive, sectionsExhaustive]).toEqual([
      true,
      true,
      true,
      true,
    ])
  })
})

/* ==================================================================== *
 * GATE 3 — the Read-only Auditor holds no Studio permission.
 * ==================================================================== */

describe('slice 5 gate 3: no Read-only Auditor screen cell resolves to a permission status', () => {
  /* DEC-AUDSTU-001 / `AC-STU-157` (L34674) / L34524: "Until decided, every Read-only
   * Auditor cell in this chapter reads `Client Decision Required` rather
   * than being guessed."
   *
   * THE LINE IS DRAWN BY THE CODE THAT ENFORCES IT, NOT BY THIS GATE.
   * `reachByStudioMatrix` computes reach over a module's `screen` rows
   * only; an `another-surface` row states what happens on a DIFFERENT
   * surface and can never offer a Studio capability. So the claim asserted
   * here is over `screen` rows — the rows that are Studio acts — and every
   * `another-surface` exception is PINNED by name below, in both
   * directions, rather than filtered out of the population. A helper scoped
   * to exclude the defect it names is this build's tenth defect shape.
   *
   * A "permission status" is a cell that lets the persona read or act:
   * `allowed`, `allowedWithConditions`, `readOnly`. */

  const GRANTING: ReadonlySet<string> = new Set<StudioCellOutcome>([
    'allowed',
    'allowedWithConditions',
    'readOnly',
  ])

  /**
   * The four `another-surface` rows whose Auditor cell IS a definite
   * status, each with the reason and the module. Both directions are
   * asserted: an unpinned granting cell fails, and a pin that has stopped
   * being real fails too.
   */
  const OFF_SURFACE_PINS: Readonly<Record<string, string>> = {
    'set-hard-block-versus-notify-posture':
      'MOD-STU-13. A Delivery Operations Hub act — the Studio reads the posture and never sets it — so the Auditor’s settled read authority governs rather than DEC-AUDSTU-001.',
    'set-clearance-duration':
      'MOD-STU-13. The same Hub act, and the row R22 names as the clearance cross-surface statement.',
    'set-retention-within-allowed-bounds-on-memory':
      'MOD-STU-16. Memory retention is a platform-owned setting; the Studio writes two of five stores and sets no bound.',
    'set-the-personal-information-policy-on-profile-memory':
      'MOD-STU-16. The personal-information policy is platform-owned for the same reason.',
  }

  it('the matrix enumeration is complete and reaches every Auditor cell', async () => {
    const matrices = await studioMatrices()
    // Vacuity guards, three of them: every module contributes a matrix, the
    // matrices carry rows, and the rows carry an Auditor cell.
    expect(new Set(matrices.map((m) => m.moduleId)).size, 'a module contributes no matrix').toBe(18)
    const cells = matrices.flatMap((m) => m.rows.map((r) => rowCells(r)['read-only-auditor']))
    expect(cells.length, 'the enumeration found no Auditor cells at all').toBeGreaterThan(150)
    expect(cells.every((c) => c !== undefined), 'a matrix row has no read-only-auditor cell').toBe(true)
    expect(STUDIO_PERSONA_COLUMNS).toContain('read-only-auditor')
  })

  it('no screen-row Auditor cell grants a read or an act', async () => {
    const offenders: string[] = []
    for (const m of await studioMatrices()) {
      for (const row of m.rows) {
        if (row.surface !== 'screen') continue
        const outcome = outcomeOf(rowCells(row)['read-only-auditor']!)
        if (GRANTING.has(outcome)) offenders.push(`${m.moduleId} ${rowLabel(row)} → ${outcome}`)
      }
    }
    expect(offenders, 'a Read-only Auditor screen cell resolves to a permission status').toEqual([])
  })

  it('every off-surface exception is pinned, and every pin is still real', async () => {
    const granting = new Map<string, string>()
    for (const m of await studioMatrices()) {
      for (const row of m.rows) {
        const outcome = outcomeOf(rowCells(row)['read-only-auditor']!)
        if (row.surface !== 'screen' && GRANTING.has(outcome)) {
          granting.set(rowLabel(row), `${m.moduleId} ${outcome}`)
        }
      }
    }
    // Forward: every granting off-surface cell is pinned with a reason.
    for (const [id, where] of granting) {
      expect(OFF_SURFACE_PINS[id], `${id} (${where}) grants the Auditor and is not pinned`).toBeDefined()
      expect(OFF_SURFACE_PINS[id]!.trim(), `${id} has no recorded reason`).not.toBe('')
    }
    // Backward: a pin that has stopped being real is a standing licence for
    // a cell nothing checks any more.
    expect([...granting.keys()].sort(), 'the pinned set and the real set have diverged').toEqual(
      Object.keys(OFF_SURFACE_PINS).sort(),
    )
  })

  it('the surface-level answer is still unassumed (AC-STU-157)', () => {
    const auditor = STU_PERSONAS.find((p) => p.id === 'read-only-auditor')
    expect(auditor, 'no read-only-auditor persona').toBeDefined()
    expect(auditor!.studioAccess, 'the Auditor’s Studio access has been settled').toBe(
      'client-decision-open',
    )
    // And no module's derived reach OFFERS the Auditor a route.
    const offered = STU_MODULES.filter((m) => m.reach !== null && m.reach['read-only-auditor'] === 'offered')
    expect(offered.map((m) => m.id), 'a module offers the Auditor a route').toEqual([])
  })
})

/* ==================================================================== *
 * GATE 4 — STATE-07 renders nowhere; nothing is ever queued.
 * ==================================================================== */

describe('slice 5 gate 4: STATE-07 renders nowhere and no write control is queued', () => {
  /* D22 and D4. `STATE-07` offline "is not applicable anywhere on this
   * surface, because authoring requires a connection; a lost connection
   * renders `STATE-12` with unsaved-work protection" (L48330).
   *
   * THE SCAN IS OVER RENDERED STATE, NOT OVER THE TOKEN. Six Studio
   * screens NAME `STATE-07` in prose, to say it is not offered — a DENIAL,
   * which is the correct rendering and not the violation. Slice 3 recorded
   * the same distinction: "a line carries prose and can be a denial". So
   * this reads the state switcher's own options, which is where a state
   * that IS offered appears, and the `data-screen-state` marker. */

  it('the built pages offer screen states at all, so the negative scan has a population', () => {
    const routes = builtStudioRoutes()
    const offered = routes.flatMap((r) =>
      [...r.doc.querySelectorAll('option')].map((o) => o.getAttribute('value') ?? ''),
    )
    const states = offered.filter((v) => /^STATE-\d+$/.test(v))
    expect(states.length, 'no built Studio page offers a screen state — the scan below is vacuous').toBeGreaterThan(
      8,
    )
    expect(new Set(states), 'STATE-03 Success is not offered anywhere').toContain('STATE-03')
  })

  it('no built Studio route offers or renders STATE-07', () => {
    const offenders: string[] = []
    for (const route of builtStudioRoutes()) {
      for (const el of route.doc.querySelectorAll('option[value="STATE-07"], [data-screen-state="STATE-07"]')) {
        offenders.push(`${route.route}: <${el.tagName.toLowerCase()}>`)
      }
    }
    expect(offenders, 'STATE-07 renders on SURF-STU').toEqual([])
  })

  it('PLANTED VIOLATION: a STATE-07 option on a built page trips it', () => {
    withPlanted(
      OUT_STUDIO,
      'index.html',
      '<html><body><select><option value="STATE-07">STATE-07</option></select></body></html>',
      () => {
        const offenders: string[] = []
        for (const route of readAllBuiltStudioRoutes()) {
          for (const el of route.doc.querySelectorAll('option[value="STATE-07"]')) {
            offenders.push(`${route.route}: ${el.tagName}`)
          }
        }
        expect(offenders.join(' '), 'the planted STATE-07 rendering was not caught').toContain(
          OWN_PROBE_DIR,
        )
      },
    )
  })

  it('every connectivity treatment refuses to queue, and there are five of them', () => {
    // The count is asserted so a sixth treatment cannot arrive unanswered —
    // `queued` sits on the SHARED base of the union for exactly that reason.
    expect(STU_CONNECTIVITY_TREATMENTS).toHaveLength(5)
    expect(STU_CONNECTIVITY_TREATMENTS.map((t) => t.kind)).toEqual([
      'loaded-content',
      'failed-read',
      'write-control',
      'editor',
      'reconnect',
    ])
    for (const treatment of STU_CONNECTIVITY_TREATMENTS) {
      expect(treatment.queued, `${treatment.kind} queues`).toBe(false)
    }
    const writeControl = STU_CONNECTIVITY_TREATMENTS.find((t) => t.kind === 'write-control')!
    // D9 sense A: DISABLED with the condition named. Never absent, never
    // enabled-then-queued.
    expect(writeControl.render).toBe('disabled')
    expect(writeControl.reason).toMatch(/not queued/i)
  })

  it('no Studio matrix cell can express an offline outcome', async () => {
    const OFFLINE_TOKENS = new Set(['cachedReadOnlyOffline', 'queuedOffline'])
    const offenders: string[] = []
    let scanned = 0
    for (const m of await studioMatrices()) {
      for (const row of m.rows) {
        for (const [persona, cell] of Object.entries(rowCells(row))) {
          scanned += 1
          if (OFFLINE_TOKENS.has(outcomeOf(cell))) {
            offenders.push(`${m.moduleId} ${rowLabel(row)} ${persona}`)
          }
        }
      }
    }
    expect(scanned, 'the cell scan found nothing').toBeGreaterThan(1000)
    expect(offenders, 'a Studio matrix cell carries an offline outcome').toEqual([])
  })
})

/* ==================================================================== *
 * GATE 5 — one structure, no second authoring path.
 * ==================================================================== */

describe('slice 5 gate 5: the sequence-detection reference IS the drawn order', () => {
  /* `AC-STU-056` (L32181): the reference is "identical to the drawn screen
   * order and branch targets, with no separate authoring path". L32098:
   * "no role may author a sequence reference that differs from the drawn
   * order, because two references would make skip detection
   * unfalsifiable." */

  it('the draft carries six fields and none of them is a reference', () => {
    // The INSTANCE, not the type: a second field added to the seed shows up
    // here even if the interface was widened to accept it.
    expect(Object.keys(SEEDED_BUILDER_WORKFLOW).sort()).toEqual([...WORKFLOW_KEYS].sort())
    expect(WORKFLOW_KEYS).toHaveLength(6)
    // And an INDEPENDENT semantic assertion, so widening the type AND the
    // key list together does not slip past: no field on this object may
    // name a stored sequence, order or reference.
    const suspicious = [...WORKFLOW_KEYS].filter((k) => /sequen|referenc|detect|order/i.test(k))
    expect(suspicious, 'WorkflowDraft carries a second sequence reference').toEqual([])
  })

  it('the reference is derived from the drawing, and moves with it', () => {
    const before = drawnOrder(SEEDED_BUILDER_WORKFLOW)
    expect(before.length, 'the seeded workflow draws no screens').toBeGreaterThan(2)
    expect(sequenceDetectionReference(SEEDED_BUILDER_WORKFLOW).order).toEqual(before)

    // The expectation is the CALLER'S OWN ARRAY, not `drawnOrder` of the
    // result — task 23's compose gate derived both sides of its assertion
    // from the same call and stayed green when a step's route was swapped.
    const swapped = [before[1]!, before[0]!, ...before.slice(2)]
    const result = reorderScreenNodes({
      workflow: SEEDED_BUILDER_WORKFLOW,
      actor: {
        identityId: 'IDN-BB-SAM',
        displayName: 'supervisor-with-authoring-grant',
        tenant: tenantId('TEN-BRIGHT-BIKES'),
      },
      decision: stu04DecisionForRow(
        stu04Row('add-remove-and-reorder-screen-nodes'),
        stu04Scenario({ persona: 'quality-manager' }),
      ),
      writeAudit: () => ({ ok: true }),
      order: swapped,
    })
    expect(result.ok, 'the fixture reorder was refused').toBe(true)
    expect(swapped, 'the fixture swap changed nothing').not.toEqual(before)
    expect(drawnOrder(result.workflow)).toEqual(swapped)
    expect(sequenceDetectionReference(result.workflow).order).toEqual(swapped)
    // The original object is untouched, so the two orders above are two
    // different structures rather than one read twice.
    expect(drawnOrder(SEEDED_BUILDER_WORKFLOW)).toEqual(before)
  })

  it('PLANTED VIOLATION: a second reference field on the draft trips it', () => {
    const planted = { ...SEEDED_BUILDER_WORKFLOW, sequenceReference: ['S2', 'S1'] }
    expect(Object.keys(planted).sort()).not.toEqual([...WORKFLOW_KEYS].sort())
  })
})

/* ==================================================================== *
 * GATE 6 — publication is blocked by each of the eleven, individually.
 * ==================================================================== */

describe('slice 5 gate 6: each of the eleven S3 checks blocks publication on its own', () => {
  /* S3, R6, R13. L48330 — publish-time validation is a FAIL-CLOSED GATE
   * SET, not a warning set.
   *
   * THE BASELINE IS ALL-PASS, AND THAT IS THE WHOLE DESIGN. A slice-5
   * brief shipped a gate asserting `blocked` on a register that failed
   * closed anyway, because nothing was registered — so the assertion was
   * satisfied by the absence of the thing it meant to test. Here the
   * baseline registers all eleven and proves `blocked === false`; each of
   * the eleven plants is then measured against that green baseline, and a
   * check the evaluator skipped shows up as a plant that changed nothing. */

  interface Subject {
    readonly failing: PublishCheckId | null
    readonly element: string
  }

  const implementationFor = (
    id: PublishCheckId,
  ): PublishCheckImplementation<Subject> => {
    const check = PUBLISH_CHECKS.find((c) => c.id === id)!
    return {
      checkId: id,
      implementedBy: check.ownerModules[0]!,
      run: (subject) =>
        subject.failing === id
          ? { outcome: 'blocked', blockingElement: subject.element }
          : { outcome: 'passed' },
    }
  }

  function allEleven(): PublishCheckRegister<Subject> {
    const result = registerPublishChecks(
      createPublishCheckRegister<Subject>(),
      ...PUBLISH_CHECKS.map((c) => implementationFor(c.id)),
    )
    if (!result.ok) throw new Error(`fixture could not register: ${result.failure} ${result.checkId}`)
    return result.register
  }

  it('the check registry is the eleven of S3, in ordinal order', () => {
    expect(PUBLISH_CHECKS).toHaveLength(11)
    expect(PUBLISH_CHECKS.map((c) => c.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    for (const check of PUBLISH_CHECKS) {
      expect(check.namesElement.trim(), `${check.id} names no blocking element`).not.toBe('')
      expect(check.ownerModules.length, `${check.id} has no owner`).toBeGreaterThan(0)
    }
  })

  it('THE BASELINE: all eleven registered and passing means publication is NOT blocked', () => {
    const evaluation = evaluatePublish(allEleven(), { failing: null, element: '' })
    expect(evaluation.blocked, 'the all-pass baseline blocks — every plant below would be vacuous').toBe(
      false,
    )
    expect(evaluation.blockers).toEqual([])
    expect(evaluation.passed).toHaveLength(PUBLISH_CHECKS.length)
  })

  it('ELEVEN PLANTED VIOLATIONS: each check blocks alone, naming its own element', () => {
    for (const check of PUBLISH_CHECKS) {
      const element = `the planted ${check.id} violation — ${check.namesElement}`
      const evaluation = evaluatePublish(allEleven(), { failing: check.id, element })
      expect(evaluation.blocked, `${check.id} did not block publication`).toBe(true)
      expect(
        evaluation.blockers.map((b) => b.checkId),
        `${check.id}: exactly one blocker, and it is this check`,
      ).toEqual([check.id])
      const blocker = evaluation.blockers[0]!
      expect(blocker.kind).toBe('failed')
      expect(blocker.ordinal, `${check.id} reported the wrong ordinal`).toBe(check.ordinal)
      expect(blocker.blockingElement, `${check.id} named nothing`).toBe(element)
      expect(blocker.refuses.trim()).not.toBe('')
      expect(blocker.sourceRef.trim()).not.toBe('')
      expect(evaluation.passed).toHaveLength(PUBLISH_CHECKS.length - 1)
    }
  })

  it('a check that refuses while naming nothing is reported as unanswered, not as a blank', () => {
    const evaluation = evaluatePublish(allEleven(), { failing: 'locale-completeness', element: '   ' })
    expect(evaluation.blocked).toBe(true)
    expect(evaluation.blockers).toHaveLength(1)
    expect(evaluation.blockers[0]!.kind).toBe('cannot-run')
    expect(evaluation.blockers[0]!.blockingElement).toContain('named no element')
  })

  it('an unregistered check blocks too — FB-STU-09 fails closed', () => {
    const partial = registerPublishChecks(
      createPublishCheckRegister<Subject>(),
      ...PUBLISH_CHECKS.filter((c) => c.id !== 'chain-staffable').map((c) => implementationFor(c.id)),
    )
    expect(partial.ok).toBe(true)
    if (!partial.ok) return
    const evaluation = evaluatePublish(partial.register, { failing: null, element: '' })
    expect(evaluation.blocked).toBe(true)
    expect(evaluation.blockers.map((b) => b.checkId)).toEqual(['chain-staffable'])
    expect(evaluation.blockers[0]!.kind).toBe('cannot-run')
  })

  it('no second module may register a check it does not own (C4)', () => {
    const once = registerPublishChecks(createPublishCheckRegister<Subject>(), implementationFor('structural-validity'))
    expect(once.ok).toBe(true)
    if (!once.ok) return
    const twice = registerPublishChecks(once.register, implementationFor('structural-validity'))
    expect(twice.ok).toBe(false)
    if (twice.ok) return
    expect(twice.failure).toBe('already-registered')

    const notOwner = registerPublishChecks(createPublishCheckRegister<Subject>(), {
      checkId: 'structural-validity',
      implementedBy: 'MOD-STU-17',
      run: () => ({ outcome: 'passed' }),
    })
    expect(notOwner.ok).toBe(false)
    if (notOwner.ok) return
    expect(notOwner.failure).toBe('not-an-owner')
  })
})

/* ==================================================================== *
 * GATE 7 — separation of duties, by identity.
 * ==================================================================== */

describe('slice 5 gate 7: separation of duties is evaluated by identity, never by role', () => {
  /* `AC-STU-100`, `TEST-STU-152` (L34681), L33389: "Person distinctness is
   * checked against identity, not against role, because multi-role is
   * additive… A user holding both the Supervisor and Quality Manager roles
   * is still one person and still cannot occupy two stages."
   *
   * THE FIXTURE HOLDS BOTH ROLES, which is the entire point: a role-based
   * check passes every test written with a single-role persona. */

  const TENANT = SEEDED_TENANT
  /** `MOD-STU-18`'s own seeded domain — the register the evaluator reads. */
  const DOMAIN: ScenarioDomainState = STU18_SEEDED_STATE

  /** One person, both roles (`TEST-STU-152`). */
  const DUAL = {
    identityId: 'IDN-DUAL-01',
    displayName: 'one person, two roles',
    roles: ['SUPERVISOR', 'QUALITY_MANAGER'] as const,
    signedIn: true,
    tenant: TENANT,
  }
  /** A DIFFERENT person holding exactly the same two roles. */
  const OTHER = { ...DUAL, identityId: 'IDN-OTHER-02', displayName: 'a second person, same two roles' }

  /** The reviewer-stage row of the consolidated matrix. */
  const reviewerRow = (): StudioMatrixRow => {
    const row = stu18Row('act-as-reviewer')
    expect(row.stage, 'the reviewer row occupies no stage, so this gate would be vacuous').toBe(
      'reviewer',
    )
    return row
  }

  const ask = (
    identity: typeof DUAL,
    authorOfRecord: string | null,
  ): ReturnType<typeof evaluateStudioAccess> => {
    const input: StudioAccessInput = {
      row: reviewerRow(),
      identity,
      grants: { 'GRANT-STU-AUTHOR': 'Active' },
      commercialTier: 'Enterprise',
      identityLayer: 'reachable',
      state: DOMAIN,
      online: true,
      authorOfRecord,
      reviewerOfRecord: null,
      releaseAuthorityOfRecord: null,
    }
    return evaluateStudioAccess(input)
  }

  it('the same person cannot take the reviewer stage on a submission they authored', () => {
    const refused = ask(DUAL, DUAL.identityId)
    expect(
      permitsAction(refused.decision),
      'a dual-role author was allowed to review their own submission',
    ).toBe(false)
    expect(refused.decision.stage).toBe('SEGREGATION_OF_DUTIES')
    expect(refused.reason).toContain(DUAL.identityId)
    expect(refused.reason).toMatch(/identity, not against role/i)
  })

  it('a DIFFERENT person holding the same two roles is not refused — so the check is on identity', () => {
    // THE PAIRING. Without it, the refusal above passes just as happily on
    // an evaluator that refuses everyone, and on one that compares roles.
    const permitted = ask(OTHER, DUAL.identityId)
    // `permitsAction`, not a literal token: the reviewer row is
    // `Allowed with conditions` for these roles, and pinning the string
    // `allowed` would have made this gate red on correct code.
    expect(
      permitsAction(permitted.decision),
      `a distinct identity with the same roles was refused (${permitted.outcome}) — the check is role-based`,
    ).toBe(true)
    expect(permitted.decision.stage).not.toBe('SEGREGATION_OF_DUTIES')
  })

  it('the roles are identical on both sides, so nothing but identity distinguishes them', () => {
    // The independent half: if the two fixtures differed by role, the pair
    // above would prove nothing about identity at all.
    expect([...OTHER.roles]).toEqual([...DUAL.roles])
    expect(OTHER.identityId).not.toBe(DUAL.identityId)
    expect(DUAL.roles).toContain('SUPERVISOR')
    expect(DUAL.roles).toContain('QUALITY_MANAGER')
  })

  it('and the stage this refusal turns on is read by the evaluator, not merely documented', () => {
    // Task 20 found a `stage` field no code consulted. This asserts the
    // field is load-bearing: a row with NO stage cannot trip separation of
    // duties however the record reads.
    const stageless: StudioMatrixRow = { ...reviewerRow(), stage: null }
    const decision = evaluateStudioAccess({
      row: stageless,
      identity: DUAL,
      grants: { 'GRANT-STU-AUTHOR': 'Active' },
      commercialTier: 'Enterprise',
      identityLayer: 'reachable',
      state: DOMAIN,
      online: true,
      authorOfRecord: DUAL.identityId,
      reviewerOfRecord: null,
      releaseAuthorityOfRecord: null,
    })
    expect(decision.decision.stage).not.toBe('SEGREGATION_OF_DUTIES')
  })
})

/* ==================================================================== *
 * GATE 8 — every write goes through the audit path.
 * ==================================================================== */

describe('slice 5 gate 8: every write audits after its refusals and before its mutation', () => {
  /* S6, R7. `FB-STU-10` is "the strictest contract in this chapter"
   * (L31220): "an action that cannot be audited does not happen… There is
   * no first fallback that permits the action to proceed unaudited."
   *
   * THREE LEGS PER MODULE, AND THE FIRST IS WHAT MAKES THE OTHER TWO REAL.
   * Slice 4's third defect shape was an audit path wired to one of four
   * write handlers — and that one the only handler that mutated nothing,
   * so the contract was demonstrated where it cost nothing. So every
   * driver below proves the write MUTATES SOMETHING OBSERVABLE with a
   * committing sink FIRST, and only then proves it leaves that same thing
   * untouched when the sink refuses.
   *
   * THE TABLE IS ASSERTED COMPLETE AGAINST THE DIRECTORY. Modules that
   * take an audit-write parameter are discovered by scanning the module
   * directories; a nineteenth module, or an existing module growing its
   * first write, turns this red rather than being silently unmeasured. */

  interface AuditProbe<T> {
    /** What changed, in a form two runs can be compared on. */
    readonly observed: T
    readonly ok: boolean
    readonly auditCalls: number
  }

  interface AuditDriver {
    readonly moduleId: StudioModuleId
    /** The observable projection before any write. */
    readonly baseline: () => unknown
    /** The write, with a sink that commits. */
    readonly commit: () => AuditProbe<unknown>
    /** The SAME write, with a sink that refuses. */
    readonly auditFails: () => AuditProbe<unknown>
    /** A call this module's own domain rules refuse. The sink THROWS, so any
     *  call at all turns the leg red rather than being counted and ignored. */
    readonly domainRefusal: () => AuditProbe<unknown>
  }

  /** A sink that counts its calls and answers the shape the module expects. */
  function counter(): { calls: () => number; bump: () => void } {
    let calls = 0
    return { calls: () => calls, bump: () => void (calls += 1) }
  }

  const explode = (): never => {
    throw new Error('the audit sink was reached by a refused action')
  }

  const TENANT = tenantId('TEN-BRIGHT-BIKES')

  /* ---- MOD-STU-01 — capability enablement ---- */
  const stu01Row = () => {
    const base = charterActionRow('enable-a-capability')
    return {
      ...base,
      cells: {
        ...base.cells,
        'quality-manager': { ...base.cells['quality-manager'], outcome: 'allowed' as const },
      },
    }
  }
  const stu01Write = (over: Record<string, unknown> = {}) => ({
    register: CAPABILITY_REGISTER,
    capability: 'CAP-TOLERANCE' as AtomicCapabilityId,
    to: 'disabled' as const,
    row: stu01Row(),
    ...personaIdentity('quality-manager'),
    commercialTier: 'Enterprise' as const,
    identityLayer: 'reachable' as const,
    state: STU01_SEED_STATE,
    online: true,
    ...over,
  })
  const stu01Observe = (register: typeof CAPABILITY_REGISTER): unknown =>
    capabilityById(register.rows, 'CAP-TOLERANCE')?.enablement

  /* ---- MOD-STU-03 — create a Workflow ---- */
  const stu03Draft = {
    name: 'Assembly — Gate 8 Torque Probe',
    jobType: SEEDED_LIBRARY.jobTypes[0]!.name,
    serviceTypeTag: null,
  }
  const stu03Observe = (state: typeof SEEDED_LIBRARY): unknown =>
    state.workflows.some((w) => w.id === workflowIdFor(stu03Draft.name))

  /* ---- MOD-STU-04 — reorder the drawn nodes ---- */
  const stu04Actor = {
    identityId: 'IDN-BB-SAM',
    displayName: 'supervisor-with-authoring-grant',
    tenant: TENANT,
  }
  const stu04Swapped = (() => {
    const order = drawnOrder(SEEDED_BUILDER_WORKFLOW)
    return [order[1]!, order[0]!, ...order.slice(2)]
  })()

  /* ---- MOD-STU-05 — attach a library pointer ---- */
  const stu05Pointer = (writeAudit: Parameters<typeof attachPointer>[0]['writeAudit']) =>
    attachPointer({
      draft: WHEEL_BOLT_CONFIGURATION,
      register: SCREEN_LIBRARY_REGISTER,
      screenId: 'screen 3',
      slot: 'containment-checklist',
      itemId: 'CHK-TORQUE-RESPONSE',
      persona: 'quality-manager',
      writeAudit,
    })

  /* ---- MOD-STU-06 — apply a block to a screen ---- */
  const stu06Scope = () => scopeOf(SEEDED_BLOCK_REGISTER, 'WF-BB-TORQUE')!
  const stu06Block = () => stu06Scope().blocks[0]!
  const stu06Target = () =>
    stu06Scope().screens.find((s) => !stu06Block().appliesToScreenIds.includes(s.id))!
  const stu06Observe = (register: typeof SEEDED_BLOCK_REGISTER): unknown =>
    scopeOf(register, 'WF-BB-TORQUE')!.blocks.find((b) => b.id === stu06Block().id)!.appliesToScreenIds
      .length

  /* ---- MOD-STU-07 — approve a coaching asset ---- */
  const stu07Uploaded = () =>
    itemsInLibrary(SEEDED_LIBRARY_REGISTER, 'coaching-corpus').find(
      (i) => 'assetState' in i && i.assetState === 'Uploaded',
    )!
  const stu07Actor = { identityId: 'IDN-ELENA', displayName: 'quality-manager', tenant: SEEDED_TENANT }
  const stu07Observe = (register: typeof SEEDED_LIBRARY_REGISTER): unknown => {
    const item = register.items.find((i) => i.id === stu07Uploaded().id)!
    return 'assetState' in item ? item.assetState : null
  }

  /* ---- MOD-STU-08 — archive a Training Library item ---- */
  const stu08Item = 'TRN-001'
  const stu08Observe = (register: typeof SEEDED_TRAINING_REGISTER): unknown =>
    register.items.find((i) => i.id === stu08Item)?.status

  /* ---- MOD-STU-09 — edit a difficulty level ---- */
  // `expanded`/`Spanish` on screen 3 is the one cell the seed leaves in a
  // drafted, editable state; a level that is not drafted is refused for a
  // reason that has nothing to do with the audit path.
  const stu09Screen = 'screen 3'
  const stu09Level = 'expanded' as const
  const stu09Locale = 'Spanish' as const
  const stu09Text = 'Gate 8 — apriete el perno A y registre la lectura.'
  const stu09Observe = (screens: typeof WHEEL_BOLT_SCREENS): unknown =>
    screenById(screens, stu09Screen).levels[stu09Level][stu09Locale]?.instructionText ?? null

  /* ---- MOD-STU-10 — the one narrow parts write ---- */
  const stu10Observe = (draft: typeof SEEDED_DRAFT): unknown => stepReferences(draft, 'STEP-1').length

  /* ---- MOD-STU-11 — advance a submission through the chain ---- */
  const stu11Context = (
    persona: keyof typeof SEEDED_VIEWERS,
    over: Partial<ApprovalContext> = {},
  ): ApprovalContext => ({
    actor: SEEDED_VIEWERS[persona].identity,
    grants: SEEDED_VIEWERS[persona].grants,
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    domain: FIXTURE_DOMAIN,
    online: true,
    at: '2026-06-21T09:00:00.000Z',
    audit: () => ({ ok: true }),
    staffing: FIXTURE_STAFFING,
    diff: seededDiffEngine,
    ...over,
  })
  const stu11Submitted = (): ApprovalChain => {
    const out = submit(stu11Context('supervisor-with-authoring-grant'), {
      submissionId: 'SUB-GATE-08',
      consumer: 'workflow',
      subject: 'Gate 8 — the audit path, exercised end to end',
      tenant: FIXTURE_TENANT,
    })
    if (!out.ok) throw new Error(`fixture could not submit: ${out.refusal.reason}`)
    return out.chain
  }

  /* ---- MOD-STU-16 — retire a low-performing coaching asset ---- */
  const stu16Flagged = 'AST-STALE-CLIP-EN'
  const stu16Observe = (register: typeof SEEDED_LIBRARY_REGISTER): unknown => {
    const item = register.items.find((i) => i.id === stu16Flagged)!
    return 'assetState' in item ? item.assetState : null
  }

  /* ---- MOD-STU-17 — declare locale coverage ---- */
  const stu17Observe = (workflow: typeof WHEEL_BOLT_LOCALISATION): unknown =>
    [...workflow.declaredLocales].join(',')

  /* ---- MOD-STU-18 — administer a grant ---- */
  const stu18Admin = () => holderById(SEEDED_GRANT_REGISTER, 'IDN-BB-PRIYA')
  const stu18Target = () => holderById(SEEDED_GRANT_REGISTER, 'IDN-BB-SAM')
  const stu18Observe = (register: typeof SEEDED_GRANT_REGISTER): unknown =>
    holderById(register, 'IDN-BB-SAM').grants['GRANT-STU-AGENT'] ?? null

  const DRIVERS: readonly AuditDriver[] = [
    {
      moduleId: 'MOD-STU-01',
      baseline: () => stu01Observe(CAPABILITY_REGISTER),
      commit: () => {
        const c = counter()
        const r = setCapabilityEnablement(stu01Write(), () => (c.bump(), { ok: true as const }))
        return { ok: r.ok, observed: stu01Observe(r.register), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = setCapabilityEnablement(stu01Write(), () => (c.bump(), { ok: false as const, failure: 'sink down' }))
        return { ok: r.ok, observed: stu01Observe(r.register), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        // Not entitled: the tier gate refuses before anything is audited.
        const r = setCapabilityEnablement(stu01Write({ commercialTier: 'Essentials' }), explode)
        return { ok: r.ok, observed: stu01Observe(r.register), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-03',
      baseline: () => stu03Observe(SEEDED_LIBRARY),
      commit: () => {
        const c = counter()
        const r = createWorkflow({
          state: SEEDED_LIBRARY,
          scenario: stu03Scenario(),
          draft: stu03Draft,
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu03Observe(r.state), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = createWorkflow({
          state: SEEDED_LIBRARY,
          scenario: stu03Scenario(),
          draft: stu03Draft,
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu03Observe(r.state), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = createWorkflow({
          state: SEEDED_LIBRARY,
          scenario: stu03Scenario({ persona: 'supervisor-without-grant' }),
          draft: stu03Draft,
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu03Observe(r.state), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-04',
      baseline: () => drawnOrder(SEEDED_BUILDER_WORKFLOW).join(','),
      commit: () => {
        const c = counter()
        const r = reorderScreenNodes({
          workflow: SEEDED_BUILDER_WORKFLOW,
          actor: stu04Actor,
          decision: stu04DecisionForRow(
            stu04Row('add-remove-and-reorder-screen-nodes'),
            stu04Scenario({ persona: 'quality-manager' }),
          ),
          writeAudit: () => (c.bump(), { ok: true as const }),
          order: stu04Swapped,
        })
        return { ok: r.ok, observed: drawnOrder(r.workflow).join(','), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = reorderScreenNodes({
          workflow: SEEDED_BUILDER_WORKFLOW,
          actor: stu04Actor,
          decision: stu04DecisionForRow(
            stu04Row('add-remove-and-reorder-screen-nodes'),
            stu04Scenario({ persona: 'quality-manager' }),
          ),
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
          order: stu04Swapped,
        })
        return { ok: r.ok, observed: drawnOrder(r.workflow).join(','), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = reorderScreenNodes({
          workflow: SEEDED_BUILDER_WORKFLOW,
          actor: stu04Actor,
          decision: stu04DecisionForRow(
            stu04Row('add-remove-and-reorder-screen-nodes'),
            stu04Scenario({ persona: 'tenant-admin' }),
          ),
          writeAudit: explode,
          order: stu04Swapped,
        })
        return { ok: r.ok, observed: drawnOrder(r.workflow).join(','), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-05',
      baseline: () => SCREEN_LIBRARY_REGISTER.pointers.some((p) => p.screenId === 'screen 3'),
      commit: () => {
        const c = counter()
        const r = stu05Pointer(() => (c.bump(), { ok: true as const }))
        return {
          ok: r.ok,
          observed: r.register.pointers.some((p) => p.screenId === 'screen 3'),
          auditCalls: c.calls(),
        }
      },
      auditFails: () => {
        const c = counter()
        const r = stu05Pointer(() => (c.bump(), { ok: false as const, reason: 'sink down' }))
        return {
          ok: r.ok,
          observed: r.register.pointers.some((p) => p.screenId === 'screen 3'),
          auditCalls: c.calls(),
        }
      },
      domainRefusal: () => {
        const r = attachPointer({
          draft: WHEEL_BOLT_CONFIGURATION,
          register: SCREEN_LIBRARY_REGISTER,
          screenId: 'screen 3',
          slot: 'containment-checklist',
          itemId: 'CHK-NO-SUCH-ITEM',
          persona: 'quality-manager',
          writeAudit: explode,
        })
        return {
          ok: r.ok,
          observed: r.register.pointers.some((p) => p.screenId === 'screen 3'),
          auditCalls: 0,
        }
      },
    },
    {
      moduleId: 'MOD-STU-06',
      baseline: () => stu06Observe(SEEDED_BLOCK_REGISTER),
      commit: () => {
        const c = counter()
        const r = applyBlockToScreen({
          register: SEEDED_BLOCK_REGISTER,
          workflowId: 'WF-BB-TORQUE',
          blockId: stu06Block().id,
          screenId: stu06Target().id,
          actor: { identityId: 'IDN-BB-SAM', displayName: 'Sam Okonkwo' },
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu06Observe(r.register), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = applyBlockToScreen({
          register: SEEDED_BLOCK_REGISTER,
          workflowId: 'WF-BB-TORQUE',
          blockId: stu06Block().id,
          screenId: stu06Target().id,
          actor: { identityId: 'IDN-BB-SAM', displayName: 'Sam Okonkwo' },
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu06Observe(r.register), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = createBlock({
          register: SEEDED_BLOCK_REGISTER,
          workflowId: 'WF-NO-SUCH-WORKFLOW',
          title: 'A block with nowhere to live',
          actor: { identityId: 'IDN-BB-SAM', displayName: 'Sam Okonkwo' },
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu06Observe(r.register), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-07',
      baseline: () => stu07Observe(SEEDED_LIBRARY_REGISTER),
      commit: () => {
        const c = counter()
        const r = approveCoachingAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: stu07Uploaded().id,
          actor: stu07Actor,
          decision: stu07DecisionForRow(
            stu07Row('approve-a-coaching-asset'),
            stu07Scenario({ persona: 'quality-manager' }),
          ),
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu07Observe(r.register), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = approveCoachingAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: stu07Uploaded().id,
          actor: stu07Actor,
          decision: stu07DecisionForRow(
            stu07Row('approve-a-coaching-asset'),
            stu07Scenario({ persona: 'quality-manager' }),
          ),
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu07Observe(r.register), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = approveCoachingAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: stu07Uploaded().id,
          actor: stu07Actor,
          decision: stu07DecisionForRow(
            stu07Row('approve-a-coaching-asset'),
            stu07Scenario({ persona: 'worker' }),
          ),
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu07Observe(r.register), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-08',
      baseline: () => stu08Observe(SEEDED_TRAINING_REGISTER),
      commit: () => {
        const c = counter()
        const r = trainingService.archive(SEEDED_TRAINING_REGISTER, stu08Item, 'IDN-BB-ELENA', () => {
          c.bump()
          return 'committed'
        })
        return { ok: r.outcome === 'applied', observed: stu08Observe(r.register), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = trainingService.archive(SEEDED_TRAINING_REGISTER, stu08Item, 'IDN-BB-ELENA', () => {
          c.bump()
          return 'failed'
        })
        return { ok: r.outcome === 'applied', observed: stu08Observe(r.register), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = trainingService.archive(SEEDED_TRAINING_REGISTER, 'TRN-NO-SUCH-ITEM', 'IDN-BB-ELENA', explode)
        return { ok: r.outcome === 'applied', observed: stu08Observe(r.register), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-09',
      baseline: () => stu09Observe(WHEEL_BOLT_SCREENS),
      commit: () => {
        const c = counter()
        const r = editDifficultyLevel({
          screens: WHEEL_BOLT_SCREENS,
          screenId: stu09Screen,
          persona: 'quality-manager',
          level: stu09Level,
          locale: stu09Locale,
          instructionText: stu09Text,
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu09Observe(r.screens), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = editDifficultyLevel({
          screens: WHEEL_BOLT_SCREENS,
          screenId: stu09Screen,
          persona: 'quality-manager',
          level: stu09Level,
          locale: stu09Locale,
          instructionText: stu09Text,
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu09Observe(r.screens), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = editDifficultyLevel({
          screens: WHEEL_BOLT_SCREENS,
          screenId: stu09Screen,
          persona: 'worker',
          level: stu09Level,
          locale: stu09Locale,
          instructionText: stu09Text,
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu09Observe(r.screens), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-10',
      baseline: () => stu10Observe(SEEDED_DRAFT),
      commit: () => {
        const c = counter()
        const r = inlineAddPart({
          draft: SEEDED_DRAFT,
          stepId: 'STEP-1',
          persona: 'supervisor-with-authoring-grant',
          name: 'Wheel bolt retaining clip',
          registry: confirmedPartsRegistry,
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu10Observe(r.draft), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = inlineAddPart({
          draft: SEEDED_DRAFT,
          stepId: 'STEP-1',
          persona: 'supervisor-with-authoring-grant',
          name: 'Wheel bolt retaining clip',
          registry: confirmedPartsRegistry,
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu10Observe(r.draft), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        // The hand-off is not confirmed, so no reference may be created and
        // there is nothing to audit. R21's own path.
        const r = inlineAddPart({
          draft: SEEDED_DRAFT,
          stepId: 'STEP-1',
          persona: 'supervisor-with-authoring-grant',
          name: 'Wheel bolt retaining clip',
          registry: unconfirmedPartsRegistry,
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu10Observe(r.draft), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-11',
      baseline: () => stu11Submitted().state,
      commit: () => {
        const c = counter()
        const r = advance(
          stu11Submitted(),
          stu11Context('quality-manager', { audit: () => (c.bump(), { ok: true as const }) }),
        )
        return { ok: r.ok, observed: r.state, auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = advance(
          stu11Submitted(),
          stu11Context('quality-manager', {
            audit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
          }),
        )
        return { ok: r.ok, observed: r.state, auditCalls: c.calls() }
      },
      domainRefusal: () => {
        // A REFUSED transition IS audited — as a refusal, never as a
        // transition — so this leg cannot use a throwing sink. It asserts
        // instead that the stage did not move and that the refusal stands.
        // Declared rather than skipped.
        const r = advance(stu11Submitted(), stu11Context('worker'))
        return { ok: r.ok, observed: r.state, auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-12',
      baseline: () => mintedNumbers(FIXTURE_REGISTER).join(','),
      commit: () => {
        const c = counter()
        const r = publish(
          FIXTURE_REGISTER,
          RELEASED_SUBMISSION,
          { ...contextFor('quality-manager'), audit: () => (c.bump(), { ok: true as const }) },
          registerFor('all-pass'),
        )
        return {
          ok: r.ok,
          observed: mintedNumbers(r.ok ? r.register : FIXTURE_REGISTER).join(','),
          auditCalls: c.calls(),
        }
      },
      auditFails: () => {
        const c = counter()
        const r = publish(
          FIXTURE_REGISTER,
          RELEASED_SUBMISSION,
          {
            ...contextFor('quality-manager'),
            audit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
          },
          registerFor('all-pass'),
        )
        return {
          ok: r.ok,
          observed: mintedNumbers(r.ok ? r.register : FIXTURE_REGISTER).join(','),
          auditCalls: c.calls(),
        }
      },
      domainRefusal: () => {
        // A publish check refuses, so no number is minted and nothing is
        // audited as a publication.
        const r = publish(
          FIXTURE_REGISTER,
          RELEASED_SUBMISSION,
          { ...contextFor('worker'), audit: () => ({ ok: true as const }) },
          registerFor('all-pass'),
        )
        return {
          ok: r.ok,
          observed: mintedNumbers(r.ok ? r.register : FIXTURE_REGISTER).join(','),
          auditCalls: 0,
        }
      },
    },
    {
      moduleId: 'MOD-STU-15',
      baseline: () =>
        composedAgentById(SEEDED_COMPOSED_AGENTS, 'CMP-BB-WEEKLY-TORQUE-TREND')?.mappings.length ?? 0,
      commit: () => {
        const c = counter()
        const r = mapComposedAgent(
          {
            register: SEEDED_COMPOSED_AGENTS,
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
          () => (c.bump(), { ok: true as const }),
        )
        return {
          ok: r.ok,
          observed: composedAgentById(r.register, 'CMP-BB-WEEKLY-TORQUE-TREND')?.mappings.length ?? 0,
          auditCalls: c.calls(),
        }
      },
      auditFails: () => {
        const c = counter()
        const r = mapComposedAgent(
          {
            register: SEEDED_COMPOSED_AGENTS,
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
          () => (c.bump(), { ok: false as const, failure: 'sink down' }),
        )
        return {
          ok: r.ok,
          observed: composedAgentById(r.register, 'CMP-BB-WEEKLY-TORQUE-TREND')?.mappings.length ?? 0,
          auditCalls: c.calls(),
        }
      },
      domainRefusal: () => {
        const r = mapComposedAgent(
          {
            register: SEEDED_COMPOSED_AGENTS,
            actorIdentityId: 'IDN-BB-ELENA',
            agentId: 'CMP-BB-WEEKLY-TORQUE-TREND',
            mapping: {
              workflowName: 'Assembly — Wheel Bolt Torque Verification',
              screenId: 'screen 9',
              trigger: 'Weekly',
            },
            at: '2026-06-22',
            permitted: false,
            refusalReason: 'the persona holds no agent-author capability',
          },
          explode,
        )
        return {
          ok: r.ok,
          observed: composedAgentById(r.register, 'CMP-BB-WEEKLY-TORQUE-TREND')?.mappings.length ?? 0,
          auditCalls: 0,
        }
      },
    },
    {
      moduleId: 'MOD-STU-16',
      baseline: () => stu16Observe(SEEDED_LIBRARY_REGISTER),
      commit: () => {
        const c = counter()
        const r = learningService.retireAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: stu16Flagged,
          actor: stu07Actor,
          decision: stu16Decision(
            'flag-or-retire-a-low-performing-coaching-asset',
            stu16Scenario({ persona: 'quality-manager' }),
          ),
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu16Observe(r.register), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = learningService.retireAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: stu16Flagged,
          actor: stu07Actor,
          decision: stu16Decision(
            'flag-or-retire-a-low-performing-coaching-asset',
            stu16Scenario({ persona: 'quality-manager' }),
          ),
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu16Observe(r.register), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = learningService.retireAsset({
          register: SEEDED_LIBRARY_REGISTER,
          itemId: stu16Flagged,
          actor: stu07Actor,
          decision: stu16Decision(
            'flag-or-retire-a-low-performing-coaching-asset',
            stu16Scenario({ persona: 'supervisor-with-authoring-grant' }),
          ),
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu16Observe(r.register), auditCalls: 0 }
      },
    },
    {
      moduleId: 'MOD-STU-17',
      baseline: () => stu17Observe(WHEEL_BOLT_LOCALISATION),
      commit: () => {
        const c = counter()
        const r = localisationService.declareLocaleCoverage(
          WHEEL_BOLT_LOCALISATION,
          ['English'],
          'IDN-BB-SAM',
          () => {
            c.bump()
            return 'committed'
          },
        )
        return {
          ok: r.outcome === 'applied',
          observed: stu17Observe(r.outcome === 'applied' ? r.workflow : WHEEL_BOLT_LOCALISATION),
          auditCalls: c.calls(),
        }
      },
      auditFails: () => {
        const c = counter()
        const r = localisationService.declareLocaleCoverage(
          WHEEL_BOLT_LOCALISATION,
          ['English'],
          'IDN-BB-SAM',
          () => {
            c.bump()
            return 'failed'
          },
        )
        return {
          ok: r.outcome === 'applied',
          observed: stu17Observe(r.outcome === 'applied' ? r.workflow : WHEEL_BOLT_LOCALISATION),
          auditCalls: c.calls(),
        }
      },
      domainRefusal: () => {
        // A third locale is refused at run time as well as at compile time
        // (L34381), before anything is audited.
        const r = localisationService.declareLocaleCoverage(
          WHEEL_BOLT_LOCALISATION,
          ['English', 'French' as never],
          'IDN-BB-SAM',
          explode,
        )
        return {
          ok: r.outcome === 'applied',
          observed: stu17Observe(r.outcome === 'applied' ? r.workflow : WHEEL_BOLT_LOCALISATION),
          auditCalls: 0,
        }
      },
    },
    {
      moduleId: 'MOD-STU-18',
      baseline: () => stu18Observe(SEEDED_GRANT_REGISTER),
      commit: () => {
        const c = counter()
        const r = administerGrant({
          register: SEEDED_GRANT_REGISTER,
          actor: stu18Admin(),
          decision: stu18DecisionForRow(
            stu18Row('assign-or-revoke-the-two-grants'),
            stu18Scenario({ persona: 'tenant-admin' }),
          ),
          targetId: stu18Target().identityId,
          grant: 'GRANT-STU-AGENT',
          action: 'assign',
          writeAudit: () => (c.bump(), { ok: true as const }),
        })
        return { ok: r.ok, observed: stu18Observe(r.register), auditCalls: c.calls() }
      },
      auditFails: () => {
        const c = counter()
        const r = administerGrant({
          register: SEEDED_GRANT_REGISTER,
          actor: stu18Admin(),
          decision: stu18DecisionForRow(
            stu18Row('assign-or-revoke-the-two-grants'),
            stu18Scenario({ persona: 'tenant-admin' }),
          ),
          targetId: stu18Target().identityId,
          grant: 'GRANT-STU-AGENT',
          action: 'assign',
          writeAudit: () => (c.bump(), { ok: false as const, reason: 'sink down' }),
        })
        return { ok: r.ok, observed: stu18Observe(r.register), auditCalls: c.calls() }
      },
      domainRefusal: () => {
        const r = administerGrant({
          register: SEEDED_GRANT_REGISTER,
          actor: stu18Admin(),
          decision: stu18DecisionForRow(
            stu18Row('assign-or-revoke-the-two-grants'),
            stu18Scenario({ persona: 'tenant-admin' }),
          ),
          targetId: stu18Admin().identityId,
          grant: 'GRANT-STU-AUTHOR',
          action: 'assign',
          writeAudit: explode,
        })
        return { ok: r.ok, observed: stu18Observe(r.register), auditCalls: 0 }
      },
    },
  ]

  /**
   * The parameter names an audit-write sink goes by on this surface. Two
   * spellings ship — `writeAudit` on thirteen modules and `audit` on the
   * approval chain and versioning — and the discovery below matches BOTH,
   * because a discovery that knew only one spelling would report the two
   * that use the other as modules with no writes at all.
   */
  const AUDIT_PARAMETER = /readonly\s+(?:writeAudit|audit)\s*:|(?:writeAudit|audit)\s*:\s*\w*AuditWrite/

  function modulesWithAuditedWrites(): readonly StudioModuleId[] {
    const found: StudioModuleId[] = []
    for (const { id, dir } of studioModuleDirs()) {
      const carries = moduleFiles(dir).some((f) => AUDIT_PARAMETER.test(readFileSync(f, 'utf8')))
      if (carries) found.push(id)
    }
    return found
  }

  it('the driver table covers every module that takes an audit write, discovered from the directory', () => {
    const discovered = [...modulesWithAuditedWrites()].sort()
    expect(discovered.length, 'no module was found to take an audit write at all').toBeGreaterThan(10)
    expect(
      [...DRIVERS.map((d) => d.moduleId)].sort(),
      'a module takes an audit write and this gate does not drive it',
    ).toEqual(discovered)
  })

  it('every write mutates something observable when the audit commits', () => {
    for (const driver of DRIVERS) {
      const before = driver.baseline()
      const after = driver.commit()
      expect(after.ok, `${driver.moduleId}: the baseline write was refused`).toBe(true)
      expect(after.auditCalls, `${driver.moduleId}: exactly one audit entry`).toBe(1)
      expect(
        after.observed,
        `${driver.moduleId}: nothing observable changed, so the audit-failure leg would be vacuous`,
      ).not.toEqual(before)
    }
  })

  it('and the SAME write leaves it untouched when the audit fails', () => {
    for (const driver of DRIVERS) {
      const before = driver.baseline()
      const result = driver.auditFails()
      expect(result.ok, `${driver.moduleId}: an audit failure did not refuse the action`).toBe(false)
      expect(
        result.auditCalls,
        `${driver.moduleId}: the audit sink was never reached, so this leg proves nothing`,
      ).toBeGreaterThan(0)
      expect(
        result.observed,
        `${driver.moduleId}: the mutation was applied before the audit write`,
      ).toEqual(before)
    }
  })

  it('and a domain refusal never reaches the audit sink — a refused action is not an action', () => {
    for (const driver of DRIVERS) {
      const before = driver.baseline()
      // The sink throws in every driver but MOD-STU-11's, so reaching it at
      // all propagates out of this loop rather than being counted.
      const result = driver.domainRefusal()
      expect(result.ok, `${driver.moduleId}: a domain-refused call reported success`).toBe(false)
      expect(result.observed, `${driver.moduleId}: a refused call mutated state`).toEqual(before)
    }
  })
})

/* ==================================================================== *
 * GATE 9 — no Studio view claims a device state.
 * ==================================================================== */

describe('slice 5 gate 9: no Studio view claims a device state, a delivery, or a clearance', () => {
  /* S10, R1, R9. `AC-STU-023` (L31226), `AC-STU-112` (L33590),
   * `AC-STU-028` (L31328), `AC-STU-118` (L33769). L33579: a device whose
   * command state cannot be determined is "shown as unknown with the last
   * known state and its timestamp, never as adopted". */

  it('the shared predicate is live on this run, in both directions', () => {
    // Proved on strings the tree does not supply, through the same function
    // every renderer routes to. A gate whose matcher is asleep is a gate.
    expect(claimsAdoption('this version is live on the floor')).toBe(true)
    expect(claimsAdoption('the package has been sent')).toBe(true)
    expect(claimsAdoption('in force on every device')).toBe(true)
    // And the words the source itself prints must NOT trip it: "delivered"
    // contains the letters of "live", and a substring check would ban the
    // one phrase L31304 quotes verbatim.
    expect(claimsAdoption('delivered, not yet applied')).toBe(false)
    expect(claimsAdoption('applied and acknowledged')).toBe(false)
    expect([...FORBIDDEN_ADOPTION_WORDS]).toContain('live')
    expect([...FORBIDDEN_ADOPTION_WORDS]).not.toContain('effective')
  })

  it('every one of the fifteen command states renders without an adoption claim', () => {
    expect(COMMAND_STATES).toHaveLength(15)
    for (const state of COMMAND_STATES) {
      const rendering = renderAdoption({
        deviceId: 'DEV-GATE-09',
        commandState: state,
        lastKnown: { state, at: '2026-06-21T09:00:00.000Z' },
      })
      expect(rendering.claimsAdoption, `${state} claims adoption`).toBe(false)
      expect(claimsAdoption(rendering.label), `${state}: the label claims adoption`).toBe(false)
      expect(rendering.phrase, `${state} has no plain-words phrase`).toBe(COMMAND_STATE_PHRASES[state])
    }
  })

  it('an indeterminate device is never rendered as adopted (L33579)', () => {
    const rendering = renderAdoption({
      deviceId: 'DEV-GATE-09',
      commandState: null,
      lastKnown: { state: 'delivered', at: '2026-06-21T09:00:00.000Z' },
    })
    expect(rendering.determinate).toBe(false)
    expect(rendering.claimsAdoption).toBe(false)
    expect(rendering.label).toContain('2026-06-21T09:00:00.000Z')
  })

  it('a clearance is effective at applied and acknowledged, and at nothing earlier (AC-STU-118)', () => {
    // The expectation is the criterion's own two words, written out — not
    // `CLEARANCE_EFFECTIVE_STATES`, which is the field under test.
    const effective = COMMAND_STATES.filter(
      (state) =>
        clearanceEffective({
          deviceId: 'DEV-GATE-09',
          commandState: state,
          lastKnown: { state, at: '2026-06-21T09:00:00.000Z' },
        }).effective,
    )
    expect(effective).toEqual(['applied', 'acknowledged'])
    // And the module's own list says the same, so a divergence between the
    // behaviour and the documented list is red rather than silent.
    expect([...CLEARANCE_EFFECTIVE_STATES]).toEqual(['applied', 'acknowledged'])
    // Indeterminate is never effective, whatever the last known state was.
    expect(
      clearanceEffective({
        deviceId: 'DEV-GATE-09',
        commandState: null,
        lastKnown: { state: 'applied', at: '2026-06-21T09:00:00.000Z' },
      }).effective,
    ).toBe(false)
  })

  /**
   * WHAT AN ADOPTION ROW MAY SAY, DERIVED INDEPENDENTLY OF THE PAGE: the
   * renderer's own label, plus the honesty marker the screen appends when
   * the state could not be determined.
   *
   * EXACT EQUALITY RATHER THAN A WORD SCAN, and the reason is a real
   * finding: the indeterminate row reads *"… — never as adopted"*, and a
   * `claimsAdoption` scan over the row text fires on the word `adopted`
   * inside its own DENIAL. Excluding that phrase would be a helper scoped
   * to exclude the case it names — this build's tenth defect shape. So the
   * gate compares the whole row against a text derived from the renderer
   * and from the seeded device, and a row that says anything else at all —
   * "live on the floor" included — matches nothing and fails.
   */
  const expectedAdoptionRows = (): readonly string[] =>
    SEEDED_DEVICES.map((device) => {
      const rendering = renderAdoption(device)
      return `${rendering.label}${rendering.determinate ? '' : ' — never as adopted'}`.replace(
        /\s+/g,
        ' ',
      )
    })

  const builtAdoptionRows = (
    routes: readonly BuiltRoute[],
  ): readonly { route: string; text: string }[] =>
    routes.flatMap((route) =>
      [...route.doc.querySelectorAll('[data-testid^="device-"]')].map((el) => ({
        route: route.route,
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      })),
    )

  it('no adoption row in the BUILT tree claims a device state', () => {
    const rows = builtAdoptionRows(builtStudioRoutes())
    // The non-empty guard: a page with no adoption rows passes every
    // negative assertion below.
    expect(rows.length, 'no built Studio page renders a per-device adoption row').toBeGreaterThan(0)
    const permitted = new Set(expectedAdoptionRows())
    expect(permitted.size, 'the expected-row derivation produced nothing').toBe(SEEDED_DEVICES.length)
    // Every permitted label is itself claim-free, checked through the one
    // shared predicate — so this is not merely "the page matches itself".
    for (const rendering of SEEDED_DEVICES.map((d) => renderAdoption(d))) {
      expect(claimsAdoption(rendering.label), `${rendering.deviceId}: the label claims adoption`).toBe(
        false,
      )
    }
    const offenders = rows.filter((r) => !permitted.has(r.text))
    expect(offenders, 'a built adoption row says something the renderer did not produce').toEqual([])
  })

  it('PLANTED VIOLATION: a "live on the floor" adoption row trips it', () => {
    withPlanted(
      OUT_STUDIO,
      'index.html',
      '<html><body><li data-testid="device-DEV-PROBE">DEV-PROBE — live on the floor</li></body></html>',
      () => {
        const permitted = new Set(expectedAdoptionRows())
        const offenders = builtAdoptionRows(readAllBuiltStudioRoutes()).filter(
          (r) => !permitted.has(r.text),
        )
        expect(
          offenders.map((o) => `${o.route}: ${o.text}`).join(' '),
          'the planted adoption claim was not caught',
        ).toContain('live on the floor')
        expect(claimsAdoption('DEV-PROBE — live on the floor')).toBe(true)
      },
    )
  })

  it('the escalation seam states a delivery it does not own, and claims none', () => {
    const seam = STU_SEAMS.find((s) => s.id === 'escalation-delivery-and-role-resolution')
    expect(seam, 'the escalation delivery seam is not registered').toBeDefined()
    expect(claimsAdoption(seam!.contract), 'the escalation seam claims a delivery').toBe(false)
    expect(stuSeamStatus(seam!), 'the escalation seam is not still an absence').not.toBe('built')
  })
})

/* ==================================================================== *
 * GATE 10 — the superseded offline-severity description.
 * ==================================================================== */

describe('slice 5 gate 10: the superseded offline-severity description appears nowhere', () => {
  /* `AC-STU-030`, `AC-STU-126`, L33803: "The discovery-stage description of
   * offline deviations being 'processed at sync, with severity-band
   * evaluation running on the captured value at that point' is explicitly
   * superseded by Part V… Any delivered artefact repeating the superseded
   * description is a defect."
   *
   * IT IS A PLAUSIBLE SENTENCE AN IMPLEMENTER WOULD WRITE FROM FIRST
   * PRINCIPLES, which is exactly why a string gate over the built artefact
   * is the right shape. The correct description — evaluation at capture,
   * only DELIVERY at sync — is asserted present, so this cannot pass by the
   * page having lost the subject altogether. */

  const SUPERSEDED = /processed at sync/i
  const ALSO_SUPERSEDED = /severity[- ]band evaluation running on the captured value at that point/i

  it('the matcher is live, and the built pages carry the subject at all', () => {
    expect(SUPERSEDED.test('deviations are processed at sync')).toBe(true)
    expect(SUPERSEDED.test('escalation delivery happens at sync')).toBe(false)
    const routes = builtStudioRoutes()
    const withSubject = routes.filter((r) => /at sync/i.test(textOf(r)))
    expect(
      withSubject.length,
      'no built Studio page discusses what happens at sync — the negative scan below has no subject',
    ).toBeGreaterThan(0)
  })

  it('no built page repeats the superseded description', () => {
    const offenders: string[] = []
    for (const route of builtStudioRoutes()) {
      const text = textOf(route)
      if (SUPERSEDED.test(text) || ALSO_SUPERSEDED.test(text)) offenders.push(route.route)
    }
    expect(offenders, 'a built Studio page repeats the superseded offline-severity description').toEqual(
      [],
    )
  })

  it('and the correct description is on the page — evaluation at capture, delivery at sync', () => {
    const carrying = builtStudioRoutes().filter((r) =>
      /evaluation happens at capture/i.test(textOf(r)),
    )
    expect(
      carrying.length,
      'no built page states the superseding description, so the absence above proves nothing',
    ).toBeGreaterThan(0)
  })

  it('PLANTED VIOLATION: the superseded sentence on a built page trips it', () => {
    withPlanted(
      OUT_STUDIO,
      'index.html',
      '<html><body><p>Offline deviations are processed at sync.</p></body></html>',
      () => {
        const offenders = readAllBuiltStudioRoutes()
          .filter((r) => SUPERSEDED.test(textOf(r)))
          .map((r) => r.route)
        expect(offenders.join(' '), 'the planted superseded sentence was not caught').toContain(
          OWN_PROBE_DIR,
        )
      },
    )
  })
})

/* ==================================================================== *
 * GATE 11 — draft visibility is enforced in the read.
 * ==================================================================== */

describe('slice 5 gate 11: draft visibility is enforced in the read, not the render', () => {
  /* `AC-STU-048` (L32013), `AC-STU-151` (L34668), R14, R15. Scope on this
   * surface is DRAFT VISIBILITY, and slice 4's seventh defect shape was
   * scope enforced in what the screen DREW rather than in what it READ.
   *
   * R15 is the specific instance and the highest-probability place for it:
   * `MOD-STU-04`'s row 1 is `Explicitly prohibited` on the DRAFT canvas for
   * the Supervisor-without-grant and the Tenant Admin, and row 2 is
   * `Read-only` on the PUBLISHED canvas for the same two. One canvas
   * component with a read-only prop gets row 2 right and row 1 wrong. */

  it('the boundary separates a NON-EMPTY set from a NON-EMPTY set', () => {
    // Without this, the filter assertion below would pass on a register
    // holding no unreleased Workflows at all.
    const unreleased = SEEDED_LIBRARY.workflows.filter((w) => isUnreleasedStatus(w.status))
    const released = SEEDED_LIBRARY.workflows.filter((w) => !isUnreleasedStatus(w.status))
    expect(unreleased.length, 'the seed holds no Draft or In Review Workflow').toBeGreaterThan(0)
    expect(released.length, 'the seed holds no Published Workflow').toBeGreaterThan(0)
  })

  it('THE SELECTOR removes unreleased rows for a persona the matrix refuses', () => {
    const grantHolder = workflowsVisibleTo(
      SEEDED_LIBRARY,
      stu03Scenario({ persona: 'supervisor-with-authoring-grant' }),
    )
    const without = workflowsVisibleTo(
      SEEDED_LIBRARY,
      stu03Scenario({ persona: 'supervisor-without-grant' }),
    )
    // The grant-holder DOES see them — the pairing that stops this passing
    // on a selector that returns nothing to anybody.
    expect(grantHolder.some((w) => isUnreleasedStatus(w.status))).toBe(true)
    expect(without.length, 'the refused persona sees no Workflows at all').toBeGreaterThan(0)
    expect(
      without.filter((w) => isUnreleasedStatus(w.status)).map((w) => w.id),
      'an unreleased Workflow reached the component',
    ).toEqual([])
  })

  it('and direct address is refused too, so nothing can be recovered from the markup', () => {
    const draft = SEEDED_LIBRARY.workflows.find((w) => isUnreleasedStatus(w.status))!
    const refused = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: stu03Scenario({ persona: 'supervisor-without-grant' }),
      workflowId: draft.id,
      writeAudit: () => ({ ok: true }),
    })
    expect(refused.ok).toBe(false)
    const permitted = openWorkflowById({
      state: SEEDED_LIBRARY,
      scenario: stu03Scenario({ persona: 'supervisor-with-authoring-grant' }),
      workflowId: draft.id,
      writeAudit: () => ({ ok: true }),
    })
    expect(permitted.ok, 'the grant-holder is refused too, so the refusal above is not about drafts').toBe(
      true,
    )
  })

  it('R15: the draft canvas and the published canvas are two separate reads', () => {
    const PUBLISHED_ID = 'WF-PUBLISHED-GATE-11'
    const register = {
      drafts: [SEEDED_BUILDER_WORKFLOW],
      published: [{ ...SEEDED_BUILDER_WORKFLOW, id: PUBLISHED_ID }],
    }
    for (const persona of ['supervisor-without-grant', 'tenant-admin'] as const) {
      const s = stu04Scenario({ persona })
      // Row 1 and row 2 disagree for exactly these two personas, and a
      // single canvas component with a read-only prop would make them
      // agree — R15, the highest-probability defect on this surface.
      const draft = draftCanvasFor(s, register, SEEDED_BUILDER_WORKFLOW.id)
      expect(draft.ok, `${persona}: the DRAFT canvas opened`).toBe(false)
      const published = publishedCanvasFor(s, register, PUBLISHED_ID)
      expect(published.ok, `${persona}: the PUBLISHED canvas did not open`).toBe(true)
      expect(
        published.ok && published.editable,
        `${persona}: the published canvas opened editable`,
      ).toBe(false)
    }
    // THE PAIRING: a persona who holds both gets both, so the two refusals
    // above are about the row and not about the register.
    const holder = stu04Scenario({ persona: 'quality-manager' })
    const holderDraft = draftCanvasFor(holder, register, SEEDED_BUILDER_WORKFLOW.id)
    expect(holderDraft.ok, 'the grant-holder is refused the draft canvas too').toBe(true)
    expect(holderDraft.ok && holderDraft.editable).toBe(true)
    expect(publishedCanvasFor(holder, register, PUBLISHED_ID).ok).toBe(true)
  })

  it('the canvas LIST is filtered in the read, and says how many it withheld', () => {
    const register = {
      drafts: [SEEDED_BUILDER_WORKFLOW],
      published: [{ ...SEEDED_BUILDER_WORKFLOW, id: 'WF-PUBLISHED-GATE-11' }],
    }
    const refused = readableWorkflows(stu04Scenario({ persona: 'tenant-admin' }), register)
    expect(refused.workflows.map((w) => w.id)).toEqual(['WF-PUBLISHED-GATE-11'])
    expect(refused.withheldCount, 'nothing was withheld, so the filter did nothing').toBe(1)
    expect(refused.withheldReason?.trim(), 'AC-STU-155: the withholding is unexplained').not.toBe('')

    const permitted = readableWorkflows(stu04Scenario({ persona: 'quality-manager' }), register)
    expect(permitted.workflows).toHaveLength(2)
    expect(permitted.withheldCount).toBe(0)
  })
})

/* ==================================================================== *
 * GATE 12 — a block belongs to one Workflow.
 * ==================================================================== */

describe('slice 5 gate 12: a block cannot be referenced from another Workflow', () => {
  /* `AC-STU-066` (L32523), R11. "Blocks belong to this Workflow only. They
   * are not Content Library items and cannot be used in another Workflow."
   * THE REFUSAL IS AT THE SERVICE LAYER, not in what a picker draws —
   * "taking a button off the screen does not stop anyone". */

  const workflowIds = (): readonly string[] => Object.keys(SEEDED_BLOCK_REGISTER)
  const ACTOR = { identityId: 'IDN-BB-SAM', displayName: 'Sam Okonkwo' }

  /** The Workflow the seeded blocks belong to, and a DIFFERENT one with a screen. */
  const OWNING = 'WF-BB-TORQUE'
  const OTHER = 'WF-BB-INSPECTION'

  it('the register holds two Workflows — one with the blocks, one with a screen to target', () => {
    // Without two, "another Workflow" has no referent and the refusal below
    // could not be exercised at all.
    expect(workflowIds().length, 'the block register holds fewer than two Workflows').toBeGreaterThan(
      1,
    )
    expect(workflowIds()).toContain(OWNING)
    expect(workflowIds()).toContain(OTHER)
    expect(scopeOf(SEEDED_BLOCK_REGISTER, OWNING)!.blocks.length).toBeGreaterThan(0)
    expect(scopeOf(SEEDED_BLOCK_REGISTER, OTHER)!.screens.length).toBeGreaterThan(0)
    // And the other Workflow holds NO blocks of its own, which is what makes
    // the borrowed block unambiguously another Workflow's.
    expect(scopeOf(SEEDED_BLOCK_REGISTER, OTHER)!.blocks).toEqual([])
  })

  it('applying a block from ANOTHER Workflow is refused, and nothing is written', () => {
    const block = scopeOf(SEEDED_BLOCK_REGISTER, OWNING)!.blocks[0]!
    const foreignScreen = scopeOf(SEEDED_BLOCK_REGISTER, OTHER)!.screens[0]!

    const refused = applyBlockToScreen({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: OTHER,
      blockId: block.id,
      screenId: foreignScreen.id,
      actor: ACTOR,
      // A THROWING sink: a cross-Workflow reference must be refused before
      // anything is audited, so reaching the sink at all fails this test.
      writeAudit: () => {
        throw new Error('the audit sink was reached by a cross-Workflow reference')
      },
    })
    expect(refused.ok, 'a block from another Workflow was applied').toBe(false)
    expect(refused.message).toMatch(/another Workflow|no block|belong/i)
    expect(refused.register, 'the register was replaced on a refusal').toBe(SEEDED_BLOCK_REGISTER)

    // THE PAIRING: the SAME block applied inside its OWN Workflow succeeds,
    // so the refusal above is about the Workflow and not about the block,
    // the actor or the sink.
    const ownScreen = scopeOf(SEEDED_BLOCK_REGISTER, OWNING)!.screens.find(
      (sc) => !block.appliesToScreenIds.includes(sc.id),
    )!
    const permitted = applyBlockToScreen({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: OWNING,
      blockId: block.id,
      screenId: ownScreen.id,
      actor: ACTOR,
      writeAudit: () => ({ ok: true }),
    })
    expect(permitted.ok, 'the same block could not be applied inside its own Workflow').toBe(true)
  })

  it('the scope lookup has no expression that can return another Workflow’s block', () => {
    const owned = scopeOf(SEEDED_BLOCK_REGISTER, OWNING)!.blocks.map((b) => b.id)
    expect(owned.length, 'the owning Workflow holds no blocks').toBeGreaterThan(0)
    for (const id of workflowIds()) {
      if (id === OWNING) continue
      const reachable = scopeOf(SEEDED_BLOCK_REGISTER, id)!.blocks.map((b) => b.id)
      for (const blockId of owned) {
        expect(reachable, `${blockId} is reachable from ${id}`).not.toContain(blockId)
      }
    }
  })

  it('and the scoping rule is stated on the screen in SB-STU-09’s own words', () => {
    // The refusal is at the service layer, and the SENTENCE is what an
    // author reads. Both, or the rule is enforced where nobody is told.
    const carrying = builtStudioRoutes().filter((r) =>
      /cannot be used in another Workflow/i.test(textOf(r)),
    )
    expect(carrying.map((r) => r.route), 'no built route states the block scoping rule').not.toEqual([])
  })
})

/* ==================================================================== *
 * GATE 13 — one audit store, and it is the Hub's.
 * ==================================================================== */

describe('slice 5 gate 13: the Studio holds one audit store, and it is the Hub’s', () => {
  /* L31481, R12. "The Studio keeps no audit log of its own." A second store
   * would be invisible until slice 10 tried to reconcile the two. */

  it('exactly one seam is the audit store, and its owner is the Hub', () => {
    const auditSeams = STU_SEAMS.filter((s: StudioSeamDefinition) => /audit/i.test(s.name))
    expect(auditSeams.map((s) => s.id), 'the Studio registers more than one audit store').toEqual([
      'tenant-audit-log',
    ])
    const seam = auditSeams[0]!
    expect(seam.contract).toContain('The Studio keeps no audit log of its own')
    expect(seam.sourceRef).toContain('L31481')
    expect(seam.owner, 'the audit store’s owner is not stated').not.toBe('')
    expect(seam.consumingModules.length, 'nothing consumes the audit seam').toBeGreaterThan(0)
  })

  /**
   * A module-scope MUTABLE store: `const … = []`, `= new Map(`, `= new
   * Set(` or a `push` onto a name that reads as a log. Matched as whole
   * words on the DECLARED NAME, never as a substring — `signed` inside
   * "signed-in" and `18` inside `MOD-SA-18` are two of the four times this
   * build matched a token inside a larger term it did not mean.
   */
  const LOCAL_STORE =
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*(?:\[\s*\]|new\s+(?:Map|Set)\s*\(\s*\))/g

  function localAuditStores(): readonly string[] {
    const offenders: string[] = []
    const files = [...walk(STUDIO_SRC_ROOT), ...walk(STUDIO_APP_ROOT)].filter((f) => /\.tsx?$/.test(f))
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const match of src.matchAll(LOCAL_STORE)) {
        const name = match[1] ?? ''
        // `audit`, `auditLog`, `AUDIT_LOG`, `auditEntries` — the word, not
        // the letters. `audited` is a verb and is not a store.
        const words = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().split(/\s+/)
        if (words.includes('audit') || words.includes('audits')) offenders.push(`${file}: ${name}`)
      }
    }
    return offenders
  }

  it('the source scan reaches real files, so the absence below is not an empty walk', () => {
    const files = [...walk(STUDIO_SRC_ROOT), ...walk(STUDIO_APP_ROOT)].filter((f) => /\.tsx?$/.test(f))
    expect(files.length, 'the Studio source walk found nothing').toBeGreaterThan(80)
    expect(files, 'the walk missed the shell').toContain(join(STUDIO_APP_ROOT, 'StudioShell.tsx'))
    // The matcher is live: proved against a string the tree does not carry.
    expect(LOCAL_STORE.test('const STUDIO_AUDIT_LOG: string[] = []')).toBe(true)
    LOCAL_STORE.lastIndex = 0
  })

  it('no Studio module declares an audit store of its own', () => {
    expect(localAuditStores(), 'the Studio holds a second audit store').toEqual([])
  })

  it('PLANTED VIOLATION: a Studio-local audit log trips it', () => {
    withPlanted(
      STUDIO_SRC_ROOT,
      'probe.ts',
      'export const STUDIO_AUDIT_LOG: string[] = []\n',
      () => {
        expect(localAuditStores().join(' '), 'the planted Studio-local log was not caught').toContain(
          OWN_PROBE_DIR,
        )
      },
    )
  })
})

/* ==================================================================== *
 * GATE 14 — a cross-surface statement is not a control.
 * ==================================================================== */

describe('slice 5 gate 14: every cross-surface statement is a statement, never a control', () => {
  /* R22. "A cell whose token is `Not applicable` for the Quality Manager
   * and `Allowed` for a Supervisor is a CROSS-SURFACE STATEMENT, never a
   * control." Five instances, and "an implementer reading only the Allowed
   * cells will put a Build button on a Studio screen." */

  /**
   * THE FIVE ACTS, and what each must never become on a Studio route.
   *
   * A REAL FINDING, DECLARED RATHER THAN PAPERED OVER. R22 names five
   * matrix rows. Only TWO of them are rows on this build's matrices at all:
   * `set-clearance-duration` (`MOD-STU-13`) and `edit-a-tenant-action-bundle`
   * (`MOD-STU-05`), and both are correctly classified `another-surface`.
   * The other three acts — triggering a package build, setting a worker's
   * profile difficulty field, and re-basing an in-flight Run — have NO row
   * on any of the eighteen matrices. `matrixRowId: null` records that, and
   * the assertion below is written in BOTH directions: a row landing later
   * under one of those names must be classified `another-surface` or this
   * turns red, rather than quietly becoming a screen row that offers the
   * module's route on a capability no Studio screen carries.
   */
  const FIVE = [
    {
      what: 'the package build',
      moduleId: 'MOD-STU-14' as StudioModuleId,
      matrixRowId: null,
      candidateRowIds: ['trigger-a-package-build', 'build-a-package', 'fire-a-package-build'],
      control: /\b(?:trigger|fire|start|run)\s+(?:a\s+|the\s+)?package\s+build\b|\bbuild\s+(?:the\s+|a\s+)?package\b/i,
    },
    {
      what: 'the clearance grant',
      moduleId: 'MOD-STU-13' as StudioModuleId,
      matrixRowId: 'set-clearance-duration',
      candidateRowIds: ['set-clearance-duration'],
      control: /\b(?:grant|issue|set)\s+(?:a\s+|the\s+)?clearance\b|\bclearance\s+duration\b/i,
    },
    {
      what: 'the worker profile field',
      moduleId: 'MOD-STU-09' as StudioModuleId,
      matrixRowId: null,
      candidateRowIds: [
        'set-a-workers-profile-difficulty-level',
        'set-the-worker-profile-difficulty-field',
      ],
      control: /\bset\s+(?:a\s+|the\s+)?worker(?:’s|'s)?\s+(?:profile|difficulty)\b/i,
    },
    {
      what: 'the rebase',
      moduleId: 'MOD-STU-12' as StudioModuleId,
      matrixRowId: null,
      candidateRowIds: ['rebase-an-in-flight-run', 're-base-an-in-flight-run'],
      control: /\bre-?base\b/i,
    },
    {
      what: 'the action bundle',
      moduleId: 'MOD-STU-05' as StudioModuleId,
      matrixRowId: 'edit-a-tenant-action-bundle',
      candidateRowIds: ['edit-a-tenant-action-bundle', 'edit-the-severity-action-bundle'],
      control: /\b(?:edit|author|change)\s+(?:the\s+|a\s+)?(?:tenant\s+|severity\s+)?action\s+bundle\b/i,
    },
  ] as const

  it('every R22 row that exists is classified as another surface, and the rest have no row', async () => {
    const rows = new Map<string, { module: StudioModuleId; surface: unknown }>()
    for (const m of await studioMatrices()) {
      for (const row of m.rows) rows.set(rowLabel(row), { module: m.moduleId, surface: row.surface })
    }
    expect(rows.size, 'the matrix enumeration produced no rows').toBeGreaterThan(150)
    for (const entry of FIVE) {
      if (entry.matrixRowId !== null) {
        const found = rows.get(entry.matrixRowId)
        expect(found, `${entry.matrixRowId} (${entry.what}) is not a row on any Studio matrix`).toBeDefined()
        expect(found!.module, `${entry.matrixRowId} moved module`).toBe(entry.moduleId)
        expect(
          found!.surface,
          `${entry.matrixRowId} is classified '${String(found!.surface)}' — a screen row IS a Studio capability`,
        ).toBe('another-surface')
        continue
      }
      // THE DECLARED GAP, asserted so it cannot close silently. If a row
      // under any of these names lands, it must be `another-surface`.
      for (const candidate of entry.candidateRowIds) {
        const found = rows.get(candidate)
        if (found === undefined) continue
        expect(
          found.surface,
          `${candidate} (${entry.what}) has landed as a '${String(found.surface)}' row; R22 requires 'another-surface'`,
        ).toBe('another-surface')
      }
    }
  })

  it('the two R22 rows that do exist are the only ones this gate claims a row for', async () => {
    // The other direction on the declared gap: if the three missing acts
    // are ever added, the pin above starts checking them and this count
    // moves — so the gap is a fact under test, not a comment.
    const rows = new Set((await studioMatrices()).flatMap((m) => m.rows.map((r) => rowLabel(r))))
    const withRows = FIVE.filter((e) => e.matrixRowId !== null).map((e) => e.matrixRowId)
    expect(withRows).toEqual(['set-clearance-duration', 'edit-a-tenant-action-bundle'])
    for (const id of withRows) expect(rows.has(id!), `${id} vanished`).toBe(true)
    for (const entry of FIVE.filter((e) => e.matrixRowId === null)) {
      for (const candidate of entry.candidateRowIds) {
        expect(
          rows.has(candidate),
          `${candidate} now exists — give it a matrixRowId in FIVE rather than leaving it declared missing`,
        ).toBe(false)
      }
    }
  })

  it('the built tree offers controls at all, so the negative scan has a population', () => {
    const controls = builtStudioControls(builtStudioRoutes())
    expect(controls.length, 'the built Studio pages offer no controls at all').toBeGreaterThan(50)
    expect(
      controls.some((c) => /persona|role|view as/i.test(c.name)),
      'no persona switcher was found, so the control reader is not reading names',
    ).toBe(true)
  })

  it('no Studio route offers any of the five as a control', () => {
    const controls = builtStudioControls(builtStudioRoutes())
    // ONE assertion over all five, deliberately: a per-act loop stops at the
    // first offender, so a run that planted five would report one and the
    // other four would look untested.
    const offenders = FIVE.flatMap((entry) =>
      controls
        .filter((c) => entry.control.test(c.name))
        .map((c) => `${entry.what} — ${c.route}: ${c.name}`),
    )
    expect(offenders, 'a Studio route offers a cross-surface statement as a control').toEqual([])
  })

  it('FIVE PLANTED VIOLATIONS: one control per act trips its own pattern', () => {
    const plants = [
      'Trigger a package build',
      'Grant the clearance',
      'Set the worker’s profile difficulty level',
      'Rebase the in-flight runs',
      'Edit the severity action bundle',
    ]
    expect(plants).toHaveLength(FIVE.length)
    for (const [index, entry] of FIVE.entries()) {
      const planted = plants[index]!
      // The pattern matches ITS OWN act…
      expect(entry.control.test(planted), `${entry.what}: the pattern does not match its own plant`).toBe(
        true,
      )
      // …and the whole planted set is caught by exactly one pattern each,
      // so a pattern that matched everything would fail here rather than
      // reading as five gates.
      const matching = FIVE.filter((e) => e.control.test(planted))
      expect(matching.map((m) => m.what), `"${planted}" matched more than one pattern`).toEqual([
        entry.what,
      ])
    }
  })

  it('PLANTED VIOLATION: a Build button on a built page trips the scan', () => {
    withPlanted(
      OUT_STUDIO,
      'index.html',
      '<html><body><button>Trigger a package build</button></body></html>',
      () => {
        const controls = builtStudioControls(readAllBuiltStudioRoutes())
        const offenders = controls.filter((c) => FIVE[0]!.control.test(c.name))
        expect(offenders.map((o) => o.route).join(' '), 'the planted Build button was not caught').toContain(
          OWN_PROBE_DIR,
        )
      },
    )
  })
})

/* ==================================================================== *
 * GATE 15 — every seam is a named interface with a fixture.
 * ==================================================================== */

describe('slice 5 gate 15: every cross-slice seam is a named interface with a fixture', () => {
  /* R21. "A stub that returns a minted identifier without a confirmed
   * hand-off is invisible until a package carries an unresolvable part
   * reference" — which is exactly what `FUNC-STU-10-02-B-1` (L33143)
   * refuses: "if the hand-off cannot be confirmed, the reference is not
   * created, because a reference to a part that does not exist in the
   * registry would break genealogy." */

  it('the seam registry is non-empty and every row is named, owned and contracted', () => {
    expect(STU_SEAMS.length, 'the seam registry is empty').toBeGreaterThan(20)
    for (const seam of STU_SEAMS) {
      expect(seam.name.trim(), `${seam.id} has no name`).not.toBe('')
      expect(seam.owner.trim(), `${seam.id} states no owner`).not.toBe('')
      expect(seam.contract.trim(), `${seam.id} states no contract`).not.toBe('')
      expect(seam.sourceRef.trim(), `${seam.id} cites no source`).not.toBe('')
      expect(seam.consumingModules.length, `${seam.id} has no consuming module`).toBeGreaterThan(0)
    }
  })

  it('an unscheduled seam declares the absence rather than guessing a slice', () => {
    const unscheduled = STU_SEAMS.filter((s) => stuSeamStatus(s) === 'unscheduled')
    // Census §6.3 named FIVE. Four remain: slice 6 shipped `MOD-DOH-19`, so
    // `parts-registry` carries `ownerSlices: [6]` and reads `scheduled`. The
    // list is still asserted whole so a sixth row arrives declared rather
    // than inheriting another row's slice — and so a row LOSING its slice is
    // just as visible as one gaining a wrong one.
    expect(unscheduled.map((s) => s.id).sort()).toEqual(
      [
        'composed-agent-platform-review-queue',
        'multimodal-embedding-service',
        'severity-action-bundle-editor',
        'tag-to-qualification-set-mapping',
      ].sort(),
    )
    for (const seam of unscheduled) expect(seam.ownerSlices).toEqual([])
    // The row that moved, checked against the module that moved it rather
    // than against its own field.
    const parts = stuSeamById(STU_SEAMS, 'parts-registry')
    expect(stuSeamStatus(parts)).toBe('scheduled')
    expect(parts.ownerSlices).toEqual([6])
  })

  it('MOD-STU-10’s seam has three fixtures, and the UNCONFIRMED one creates nothing', () => {
    const tenant = tenantId('TEN-BRIGHT-BIKES')
    // THE PAIRING FIRST: the confirmed fixture DOES create, so the
    // unconfirmed assertion is not demonstrating the contract where it
    // costs nothing.
    const confirmed = confirmedPartsRegistry.createSkeletal(tenant, 'Wheel bolt retaining clip')
    expect(confirmed.confirmed, 'the confirmed fixture does not confirm').toBe(true)
    if (confirmed.confirmed) {
      expect(confirmed.part.state).toBe('Skeletal')
      expect(confirmed.part.partId).not.toBe('')
    }

    const unconfirmed = unconfirmedPartsRegistry.createSkeletal(tenant, 'Wheel bolt retaining clip')
    expect(unconfirmed.confirmed, 'a silently-succeeding parts stub').toBe(false)
    if (!unconfirmed.confirmed) {
      expect(unconfirmed.reason).toMatch(/could not be confirmed/i)
      expect(unconfirmed.reason).toMatch(/genealogy/i)
    }
    // The registry is REACHABLE on the unconfirmed path — otherwise the
    // fixture would be exercising FB-STU-07's unreachable case instead.
    expect(unconfirmedPartsRegistry.reachable).toBe(true)
    expect(unreachablePartsRegistry.reachable).toBe(false)
    expect(unreachablePartsRegistry.createSkeletal(tenant, 'x').confirmed).toBe(false)
  })

  it('and the seam is one narrow write — name only, no edit, no delete, no identifier', () => {
    expect([...PART_SEAM_WRITABLE_FIELDS]).toEqual(['name'])
    const members = Object.keys(confirmedPartsRegistry).sort()
    expect(members, 'the parts seam grew a member').toEqual(
      ['createSkeletal', 'disposition', 'id', 'reachable', 'resolve', 'search'].sort(),
    )
  })

  it('the unconfirmed hand-off is the path MOD-STU-10 actually exercises', () => {
    const before = stepReferences(SEEDED_DRAFT, 'STEP-1').length
    const refused = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: 'supervisor-with-authoring-grant',
      name: 'Wheel bolt retaining clip',
      registry: unconfirmedPartsRegistry,
      writeAudit: () => {
        throw new Error('the audit sink was reached by an unconfirmed hand-off')
      },
    })
    expect(refused.ok, 'an unconfirmed hand-off created a reference').toBe(false)
    expect(stepReferences(refused.draft, 'STEP-1')).toHaveLength(before)

    const accepted = inlineAddPart({
      draft: SEEDED_DRAFT,
      stepId: 'STEP-1',
      persona: 'supervisor-with-authoring-grant',
      name: 'Wheel bolt retaining clip',
      registry: confirmedPartsRegistry,
      writeAudit: () => ({ ok: true }),
    })
    expect(accepted.ok, 'the confirmed path creates nothing either — the gate is vacuous').toBe(true)
    expect(stepReferences(accepted.draft, 'STEP-1').length).toBe(before + 1)
  })
})

/* ==================================================================== *
 * GATE 16 — support, not surveillance.
 * ==================================================================== */

describe('slice 5 gate 16: no worker identifier groups a behavioural measure', () => {
  /* S11, carried forward from slice 4 UNCHANGED. "No persisted table has a
   * worker identifier as a grouping key for a behavioural measure." The
   * Studio holds no worker record, but `MOD-STU-16` writes profile memory
   * and renders the learning view, so the hazard is indirect and real. */

  const dataModules = (): readonly string[] =>
    [...walk(STUDIO_SRC_ROOT), ...walk(STUDIO_APP_ROOT)].filter((f) => f.endsWith('.ts'))

  /**
   * Keys the matcher refuses that are NOT measures of a person, each with
   * the reason. Both directions are asserted: an unpinned offender fails,
   * and a pin that has stopped being real fails too.
   */
  const MEASURE_KEY_PINS: Readonly<Record<string, string>> = {
    screenCount: 'A count of SCREENS in a Workflow draft. Nothing about a person.',
    maximumSeconds:
      'The Timing section’s upper bound on a screen (L32216-L32226). A configured limit on the WORK, not a measure of who did it.',
    minimumSeconds: 'The same Timing section’s lower bound, and the same reason.',
    countsRef:
      'A source LOCATOR field on the seeded Job Type / Service Type taxonomy — the line the counts were read from. `words()` cuts it to `counts ref`.',
    resolutionRate:
      'An ASSET’s effectiveness, the figure L34293 asks for by name. `MOD-STU-16` groups coaching effectiveness by asset precisely so this is not a person’s rate; refusing it would force the panel to drop the figure the source requires.',
    timeoutMinutes:
      'An escalation routing rule’s acknowledgement timeout. A property of the RULE; escalation keys on (Area, Shift), never on (Worker).',
    dedupeWindowMinutes: 'The same routing rule’s de-duplication window, and the same reason.',
    clearanceDurationDays:
      'How long a qualification clearance stands, set in the Delivery Operations Hub. A property of the clearance, not a measure of the worker holding it.',
    windowHours: 'A version adoption window on a Job record. A property of the adoption, not of a person.',
  }

  /** Every object key in every exported value of `files`, with where it sits. */
  async function fixtureKeys(
    files: readonly string[],
  ): Promise<readonly { key: string; where: string; siblings: readonly string[] }[]> {
    const found: { key: string; where: string; siblings: readonly string[] }[] = []
    const seen = new Set<unknown>()
    const scan = (value: unknown, path: string, depth: number): void => {
      if (depth > 8 || value === null || typeof value !== 'object' || seen.has(value)) return
      seen.add(value)
      if (Array.isArray(value)) {
        value.forEach((v, i) => scan(v, `${path}[${i}]`, depth + 1))
        return
      }
      const record = value as Record<string, unknown>
      const siblings = Object.keys(record)
      for (const [key, v] of Object.entries(record)) {
        found.push({ key, where: `${path}.${key}`, siblings })
        scan(v, `${path}.${key}`, depth + 1)
      }
    }
    for (const file of files) {
      const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>
      for (const [name, value] of Object.entries(mod)) {
        if (typeof value === 'function') continue
        scan(value, `${file}#${name}`, 0)
      }
    }
    return found
  }

  /**
   * A key that IS A PERSON IDENTIFIER — `workerId`, `operatorBadge`,
   * `employeeNumber`. S11 forbids a worker identifier as a GROUPING KEY, so
   * the question is whether the key identifies a person, not whether it
   * mentions one.
   *
   * THE LAST WORD HAS TO BE THE IDENTIFIER WORD, and that narrowing is a
   * correction the real data forced: `containsIdentifiableWorkers` is a
   * redaction FLAG on a coaching asset and mentions workers precisely to say
   * it holds none. Requiring the key to END in an identifier word keeps
   * `workerId` and refuses the flag, without an exception list — an
   * exception list here would be a helper scoped to exclude a case it names.
   */
  const PERSON_WORDS = new Set([
    'worker',
    'workers',
    'operator',
    'operators',
    'employee',
    'employees',
    'person',
    'people',
  ])
  const IDENTIFIER_WORDS = new Set(['id', 'ids', 'identity', 'identityid', 'identifier', 'badge', 'number', 'key'])
  const wordsOf = (key: string): readonly string[] =>
    key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
  const namesAPerson = (key: string): boolean => {
    const words = wordsOf(key)
    const last = words[words.length - 1] ?? ''
    return words.some((w) => PERSON_WORDS.has(w)) && IDENTIFIER_WORDS.has(last)
  }

  it('walks every Studio data module, and reaches real keys', async () => {
    const files = dataModules()
    // Vacuity guards, both of them. An empty file list scans nothing; a
    // file list that imports to nothing scans nothing either.
    expect(files.length, 'no data modules found under the Studio').toBeGreaterThan(60)
    expect(files, 'the walk missed the module spine').toContain(join(STUDIO_SRC_ROOT, 'modules.ts'))
    const keys = await fixtureKeys(files)
    expect(keys.length, 'the key walk found nothing').toBeGreaterThan(1000)
    // The matcher is live on this run, proved on keys the slice does not
    // contain, through the same function the scan calls.
    expect(namesPersonBehaviouralMeasure('runsPerWorker')).toBe(true)
    expect(namesPersonBehaviouralMeasure('productivityScore')).toBe(true)
    expect(namesPersonBehaviouralMeasure('roleName')).toBe(false)
    expect(namesAPerson('workerId')).toBe(true)
    expect(namesAPerson('operatorBadge')).toBe(true)
    expect(namesAPerson('workflowId')).toBe(false)
    // The narrowing, proved against the key that forced it: a redaction
    // flag mentions workers to say it holds none of them.
    expect(namesAPerson('containsIdentifiableWorkers')).toBe(false)
  })

  it('no unpinned key in any Studio data module names a behavioural measure', async () => {
    const offenders = (await fixtureKeys(dataModules()))
      .filter(({ key }) => namesPersonBehaviouralMeasure(key) && MEASURE_KEY_PINS[key] === undefined)
      .map(({ where }) => where)
    expect(offenders, 'an unpinned behavioural-measure key').toEqual([])
  })

  it('every pinned key is still present, and still refused by the matcher', async () => {
    const pinned = Object.keys(MEASURE_KEY_PINS)
    expect(pinned.length).toBeGreaterThan(0)
    const found = new Set((await fixtureKeys(dataModules())).map(({ key }) => key))
    expect(found.size, 'the key walk found nothing to check the pins against').toBeGreaterThan(100)
    for (const key of pinned) {
      expect(MEASURE_KEY_PINS[key]!.trim(), `${key} has no recorded reason`).not.toBe('')
      expect(found.has(key), `${key} is pinned but no longer appears in any fixture`).toBe(true)
      expect(namesPersonBehaviouralMeasure(key), `${key} is pinned but the matcher now passes it`).toBe(
        true,
      )
    }
  })

  it('and no record groups a measure BESIDE a worker identifier', async () => {
    // The sharper half, and the one S11 states literally: a worker
    // identifier as the GROUPING KEY for a behavioural measure. It is the
    // co-occurrence that is forbidden, not either key alone.
    const offenders = (await fixtureKeys(dataModules()))
      .filter(
        ({ key, siblings }) =>
          namesAPerson(key) && siblings.some((s) => namesPersonBehaviouralMeasure(s)),
      )
      .map(({ where }) => where)
    expect(offenders, 'a worker identifier groups a behavioural measure').toEqual([])
  })

  it('PLANTED VIOLATION: a measure keyed on a worker trips both checks', async () => {
    let wide: readonly string[] = []
    let paired: readonly string[] = []
    const dir = join(STUDIO_SRC_ROOT, OWN_PROBE_DIR)
    try {
      mkdirSync(dir, { recursive: true })
      writeFileSync(
        join(dir, 'MeasureProbe.ts'),
        "export const ROSTER = [{ workerId: 'W-1', runsPerHour: 4 }]\n",
      )
      const keys = await fixtureKeys(dataModules())
      wide = keys
        .filter(({ key }) => namesPersonBehaviouralMeasure(key) && MEASURE_KEY_PINS[key] === undefined)
        .map(({ where }) => where)
      paired = keys
        .filter(
          ({ key, siblings }) =>
            namesAPerson(key) && siblings.some((s) => namesPersonBehaviouralMeasure(s)),
        )
        .map(({ where }) => where)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    expect(wide.join(' '), 'the planted measure key was not caught').toContain('runsPerHour')
    expect(paired.join(' '), 'the planted worker grouping key was not caught').toContain('workerId')
  })

  it('and a lifecycle key that merely CONTAINS a measure word does NOT trip it', async () => {
    let caught: readonly string[] = []
    const dir = join(STUDIO_SRC_ROOT, OWN_PROBE_DIR)
    try {
      mkdirSync(dir, { recursive: true })
      writeFileSync(
        join(dir, 'AccountProbe.ts'),
        "export const R = [{ accountState: 'active', roleName: 'Supervisor' }]\n",
      )
      caught = (await fixtureKeys(dataModules()))
        .filter(({ key }) => namesPersonBehaviouralMeasure(key) && MEASURE_KEY_PINS[key] === undefined)
        .map(({ where }) => where)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    expect(caught).toEqual([])
  })
})

/* ==================================================================== *
 * THE TWO FIXTURES — they PIN, they do not settle.
 *
 * This build discloses the source's contradictions and obeys neither
 * side. A fixture that quietly preferred one reading would have resolved
 * a question the client was never asked. So each holds BOTH locators of
 * its contradiction and asserts BOTH render, with the decision named; and
 * removing either locator turns the fixture red.
 *
 * They are NOT numbered gates: the sequence guard below reads
 * `describe('slice 5 gate N:` and these two must not take a number that
 * would then look like a missing gate if they ever moved.
 * ==================================================================== */

/* ==================================================================== *
 * GATE 17 — every `routedTo` declared is READ, and one predicate decides it.
 * ==================================================================== */

/**
 * What a card's sources look like to the classifier: its matrix, and every
 * other TypeScript file in the same module directory.
 */
interface RoutedCardSources {
  readonly matrix: string
  readonly folds: readonly string[]
}

interface RoutedCard {
  readonly module: string
  /** The row type declares the field. */
  readonly declares: boolean
  /** Some file OTHER than the matrix indexes it — `row.routedTo[...]`. */
  readonly consumes: boolean
}

/**
 * PURE, so the planted violation can be fed a doctored map rather than being
 * written to disk and hoped away again.
 */
function classifyRoutedCards(
  sources: Readonly<Record<string, RoutedCardSources>>,
): readonly RoutedCard[] {
  return Object.entries(sources)
    .map(([module, src]) => ({
      module,
      declares: /^\s*readonly routedTo:/m.test(src.matrix),
      consumes: src.folds.some((text) => text.includes('routedTo[')),
    }))
    .sort((a, b) => a.module.localeCompare(b.module))
}

function readRoutedCardSources(): Readonly<Record<string, RoutedCardSources>> {
  const root = join('src', 'studio', 'modules')
  const out: Record<string, RoutedCardSources> = {}
  for (const module of readdirSync(root)) {
    const dir = join(root, module)
    if (!statSync(dir).isDirectory()) continue
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
    if (!files.includes('matrix.ts')) continue
    out[module] = {
      matrix: readFileSync(join(dir, 'matrix.ts'), 'utf8'),
      folds: files
        .filter((f) => f !== 'matrix.ts')
        .map((f) => readFileSync(join(dir, f), 'utf8')),
    }
  }
  return out
}

/**
 * The ten cards that declare `routedTo`. Written out, so a card that starts
 * or stops declaring cannot slip past on a count.
 */
const ROUTED_DECLARERS = [
  'stu-01',
  'stu-03',
  'stu-04',
  'stu-07',
  'stu-09',
  'stu-10',
  'stu-11',
  'stu-12',
  'stu-13',
  'stu-18',
] as const

describe('slice 5 gate 17: every routedTo declared is read, by the one predicate', () => {
  // WHY THIS GATE EXISTS. `routedTo` is the mechanism that made ABSENT versus
  // DISABLED checkable, and it shipped decorative on most of the cards that
  // carried it: seven declared a total map of eight nulls per row that no code
  // path consulted, and an eighth (`MOD-STU-04`) declared three NON-NULL
  // pointers on a row its only fold never visits. Prose in three of those
  // files stated the rule as though something enforced it. That is the same
  // shape as the `stage` field task 20 shipped, and planting was the only
  // thing that found either.
  //
  // The structural half of the fix is that seven cards no longer declare the
  // field at all — a card that cannot express a route cannot express a
  // decorative one. This gate is the other half: it holds the line for the ten
  // that DO declare it, and for the eleventh card somebody adds in slice 6.

  const CARDS = classifyRoutedCards(readRoutedCardSources())

  // A scan that found nothing would pass every assertion below.
  //
  // FAILS IF: the module directory moves, or the classifier stops separating
  // two non-empty sets.
  it('scans a non-empty population and separates declarers from the rest', () => {
    expect(CARDS.length, 'no Studio module matrices found').toBeGreaterThanOrEqual(18)
    expect(CARDS.filter((c) => c.declares).length).toBeGreaterThan(0)
    expect(CARDS.filter((c) => !c.declares).length).toBeGreaterThan(0)
  })

  // THE GATE. A declaration nothing reads is prose wearing a mechanism's
  // clothes: it looks like a constraint, a reviewer reads it as a rule, and
  // nothing enforces it.
  //
  // FAILS IF: any card declares `routedTo` without a file beside its matrix
  // that indexes it.
  it('lets no card declare routedTo without a fold that indexes it', () => {
    const decorative = CARDS.filter((c) => c.declares && !c.consumes).map((c) => c.module)
    expect(decorative, `these cards declare routedTo and no fold reads it: ${decorative.join(', ')}`)
      .toEqual([])
  })

  // WHICH cards, not how many. Slice 4 lost a gate to a count that still
  // looked right.
  //
  // FAILS IF: a card starts or stops declaring the field without this list
  // moving with it.
  it('names the ten cards that declare it', () => {
    expect(CARDS.filter((c) => c.declares).map((c) => c.module)).toEqual([...ROUTED_DECLARERS])
  })

  // ONE PREDICATE, ONE NAME. Three cards each carried their own copy of the
  // four-clause condition and one of the three asked a DIFFERENT question —
  // whether ANYBODY held the target rather than whether this persona did. A
  // rule with two readings is not one rule.
  //
  // FAILS IF: a second implementation of the routed prohibition is defined
  // anywhere under `src/studio/`.
  it('defines the predicate exactly once across the whole surface', () => {
    const defs: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (entry.endsWith('.ts') && /export function routedProhibitionApplies\b/.test(readFileSync(full, 'utf8'))) {
          defs.push(full)
        }
      }
    }
    walk(join('src', 'studio'))
    expect(defs).toEqual([join('src', 'studio', 'modules', 'stu-18', 'rendering.ts')])
  })

  // PLANTED VIOLATION 1 — the defect this gate is for: a card declares the
  // field and no fold reads it.
  it('PLANTED VIOLATION: a card that declares routedTo with no fold reading it trips it', () => {
    const planted = classifyRoutedCards({
      'stu-02': {
        matrix: '  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu02RowId | null>>\n',
        folds: ['export function agentControls() { return affordanceFor(label, decision) }'],
      },
    })
    expect(planted.filter((c) => c.declares && !c.consumes).map((c) => c.module)).toEqual(['stu-02'])
  })

  // PLANTED VIOLATION 2 — the same defect arriving from the other side: a
  // declaring card whose fold stops indexing the field.
  it('PLANTED VIOLATION: a declaring card whose fold stops indexing it trips it', () => {
    const real = readRoutedCardSources()
    const planted = classifyRoutedCards({
      'stu-07': {
        matrix: real['stu-07']!.matrix,
        folds: real['stu-07']!.folds.map((text) => text.split('routedTo[').join('routedToNOPE[')),
      },
    })
    expect(planted).toEqual([{ module: 'stu-07', declares: true, consumes: false }])
  })
})

describe('slice 5 fixture: LANEB_CONTRADICTION_FIXTURE pins DEC-LANEB-001 without settling it', () => {
  /* DEC-LANEB-001. `AC-STU-097` (L33397) — "No content reaches a published version
   * without three recorded transitions by three distinct identities" —
   * and `AC-STU-138` (L34332) — "an approved package-borne value publishes
   * as a patch and adopts per the tenant's adoption timing; a server-only
   * value applies immediately" — CANNOT BOTH HOLD for one package-borne
   * Lane-B value. Neither is asserted here as the source's answer. */

  const LANEB_CONTRADICTION_FIXTURE = {
    decision: 'DEC-LANEB-001',
    readings: [
      { criterion: 'AC-STU-097', locator: 'L33397' },
      { criterion: 'AC-STU-138', locator: 'L34332' },
    ],
  } as const

  const carryingPages = (): readonly BuiltRoute[] =>
    builtStudioRoutes().filter((r) => textOf(r).includes(LANEB_CONTRADICTION_FIXTURE.decision))

  it('the decision itself renders on at least one built route', () => {
    const pages = carryingPages()
    expect(
      pages.map((p) => p.route),
      'DEC-LANEB-001 renders nowhere in the built tree',
    ).not.toEqual([])
  })

  it('BOTH readings render, each with its own criterion and its own line locator', () => {
    const pages = carryingPages()
    const carrying = LANEB_CONTRADICTION_FIXTURE.readings.map((reading) => ({
      reading,
      routes: pages
        .filter((p) => {
          const text = textOf(p)
          return text.includes(reading.criterion) && text.includes(reading.locator)
        })
        .map((p) => p.route),
    }))
    for (const { reading, routes } of carrying) {
      expect(
        routes,
        `${reading.criterion} · ${reading.locator} does not render beside DEC-LANEB-001`,
      ).not.toEqual([])
    }
    // BOTH on the SAME page: two readings disclosed on two different
    // screens is not a disclosed contradiction, it is two claims.
    const together = pages.filter((p) => {
      const text = textOf(p)
      return LANEB_CONTRADICTION_FIXTURE.readings.every(
        (r) => text.includes(r.criterion) && text.includes(r.locator),
      )
    })
    expect(
      together.map((p) => p.route),
      'no built route renders both readings together',
    ).not.toEqual([])
  })

  it('NEITHER reading is presented as the source’s answer', () => {
    // The disclosure record carries exactly two fields per reading — text
    // and locator. A `preferred`, `canonical` or `settled` flag is how a
    // disclosure quietly becomes an assertion.
    for (const page of carryingPages()) {
      const text = textOf(page)
      const settling =
        /DEC-LANEB-001[^.]{0,200}\b(?:is settled|the source (?:settles|answers)|the correct reading)\b/i
      expect(settling.test(text), `${page.route} settles DEC-LANEB-001`).toBe(false)
    }
  })

  it('REMOVING EITHER LOCATOR TURNS THIS RED — proved by removing each in turn', () => {
    const pages = carryingPages().map((p) => textOf(p))
    expect(pages.length).toBeGreaterThan(0)
    for (const reading of LANEB_CONTRADICTION_FIXTURE.readings) {
      const redacted = pages.map((text) => text.split(reading.locator).join('[REDACTED]'))
      const stillCarrying = redacted.filter(
        (text) => text.includes(reading.criterion) && text.includes(reading.locator),
      )
      expect(
        stillCarrying,
        `removing ${reading.locator} left the fixture green — it is not asserting that locator`,
      ).toEqual([])
    }
  })
})

describe('slice 5 fixture: ROLLBACK_ALIAS_FIXTURE pins both rollback identifiers', () => {
  /* DEC-WFROLL-001. The same open question carries TWO source identifiers with no
   * cross-reference between them: `DEC-WFROLL-001` (chapter 28, L53350 —
   * the card with options, a recommendation, a trade-off and an owner) and
   * `DEC-VERROLL-001` (chapter 7, L8623 — the same question in one line).
   * Both render, so a client searching on either finds the same card. */

  const ROLLBACK_ALIAS_FIXTURE = {
    canonical: { decision: 'DEC-WFROLL-001', locator: 'L53350' },
    alias: { decision: 'DEC-VERROLL-001', locator: 'L8623' },
  } as const

  const carryingPages = (): readonly BuiltRoute[] =>
    builtStudioRoutes().filter((r) => textOf(r).includes(ROLLBACK_ALIAS_FIXTURE.canonical.decision))

  it('both identifiers and both locators render, on the same built route', () => {
    const together = carryingPages().filter((p) => {
      const text = textOf(p)
      return [ROLLBACK_ALIAS_FIXTURE.canonical, ROLLBACK_ALIAS_FIXTURE.alias].every(
        (side) => text.includes(side.decision) && text.includes(side.locator),
      )
    })
    expect(
      together.map((p) => p.route),
      'no built route renders both rollback identifiers with both locators',
    ).not.toEqual([])
  })

  it('REMOVING EITHER LOCATOR TURNS THIS RED — proved by removing each in turn', () => {
    const pages = carryingPages().map((p) => textOf(p))
    expect(pages.length).toBeGreaterThan(0)
    for (const side of [ROLLBACK_ALIAS_FIXTURE.canonical, ROLLBACK_ALIAS_FIXTURE.alias]) {
      const redacted = pages.map((text) => text.split(side.locator).join('[REDACTED]'))
      const stillCarrying = redacted.filter(
        (text) => text.includes(side.decision) && text.includes(side.locator),
      )
      expect(
        stillCarrying,
        `removing ${side.locator} left the fixture green — it is not asserting that locator`,
      ).toEqual([])
    }
  })

  it('the question stays open, and the SETTLED behaviour is stated apart from it', () => {
    expect(ROLLBACK_DISCLOSURE.canonicalDecision).toBe(ROLLBACK_ALIAS_FIXTURE.canonical.decision)
    expect(ROLLBACK_DISCLOSURE.aliasDecision).toBe(ROLLBACK_ALIAS_FIXTURE.alias.decision)
    expect(ROLLBACK_DISCLOSURE.openQuestion).toMatch(/withdrawn/i)
    expect(ROLLBACK_DISCLOSURE.settledBehaviour.length).toBeGreaterThanOrEqual(5)
  })

  it('EVERY settled statement reaches the page — a duplicate list key drops one silently', () => {
    // Three of the five share the locator `L53706`. Using the locator as
    // the React list key gave three siblings one key, which React
    // reconciles by dropping or mis-updating rows. The statements are
    // distinct, so asserting all five reach the built page is what catches
    // it — and it catches the same defect in any list keyed on a repeated
    // field, not only this one.
    const pages = carryingPages().map((p) => textOf(p))
    expect(pages.length).toBeGreaterThan(0)
    for (const settled of ROLLBACK_DISCLOSURE.settledBehaviour) {
      const carrying = pages.filter((text) => text.includes(settled.statement))
      expect(carrying, `the settled statement "${settled.statement}" renders nowhere`).not.toEqual([])
    }
  })
})

/* ==================================================================== *
 * THE FILE ITSELF.
 * ==================================================================== */

describe('slice 5 gates: the file itself', () => {
  // Carried from slice 3 and slice 4, where THREE separate patch scripts
  // rewrote a gate with `write(src.slice(0, start) + replacement)` and
  // silently truncated every gate defined after it. Gate 9 vanished that
  // way and nothing asserted the root-unavailable freeze for several
  // commits; gate 14 went the same way minutes later. Both times the count
  // still looked right, because the check was how many gates existed rather
  // than WHICH.
  it('defines gates 1..N with no gap, so a truncating edit cannot hide one', () => {
    const src = readFileSync(join('tests', 'coverage', 'slice-05-gates.test.ts'), 'utf8')
    const numbers = [...src.matchAll(/^describe\('slice 5 gate (\d+):/gm)].map((m) => Number(m[1]))
    expect(numbers.length, 'no gates found').toBeGreaterThan(0)
    expect(numbers, 'gate numbers are not a gapless 1..N sequence').toEqual(
      Array.from({ length: numbers.length }, (_, i) => i + 1),
    )
    // The brief's own count, asserted from the same array the sequence
    // check reads — so a message can never quote a number the assertion
    // did not compute.
    expect(
      numbers.length,
      `slice 5 declares seventeen gates; this file defines ${numbers.length}`,
    ).toBe(17)
  })

  it('both contradiction fixtures are present and neither is numbered as a gate', () => {
    const src = readFileSync(join('tests', 'coverage', 'slice-05-gates.test.ts'), 'utf8')
    expect(src).toContain('LANEB_CONTRADICTION_FIXTURE')
    expect(src).toContain('ROLLBACK_ALIAS_FIXTURE')
    const fixtureBlocks = [...src.matchAll(/^describe\('slice 5 fixture: /gm)]
    expect(fixtureBlocks, 'the two pinning fixtures are not both declared').toHaveLength(2)
  })

  it('leaves no probe behind', () => {
    for (const root of PROBE_ROOTS) {
      expect(existsSync(join(root, OWN_PROBE_DIR)), `${root} still holds this run's probe`).toBe(false)
    }
  })
})

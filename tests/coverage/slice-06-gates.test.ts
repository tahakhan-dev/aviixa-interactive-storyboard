import { describe, it, expect } from 'vitest'
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { readerDocument } from './rendered-text'
import { isForeignProbe as isForeign, ownProbeDir, withPlanted } from '../probe-paths'
import { stripComments } from './strip-comments'

import { rolesInDomain, ROLES } from '@/domain/roles'
// The five tenant roles as a TYPE, from the same place `@/surfaces/doh/modules`
// takes it. Retyping the union here would be a sixth spelling of the closed
// five-role set inside the file that gates against a sixth role.
import type { TenantRoleId } from '../../app/hub/HubShell'
import {
  DOH_MODULES,
  MATRIX_ROW_SURFACE_DIVERGENCES,
  cellStatus,
  outcomeCellStatus,
  rolesReachingByMatrix,
  titleCaseCellStatus,
  type ControlStatus,
  type DohControlMatrixRow,
  type MatrixRowSurface,
} from '@/surfaces/doh/modules'
import {
  DOH_CATALOGUE_AB_SWAP,
  DOH_CATALOGUE_B_REACH_NARROWER,
  DOH_SCREENS,
} from '@/surfaces/doh/screens'

import { MOD_DOH_05_MATRIX } from '@/surfaces/doh/modules/doh-05/matrix'
import {
  CLOSING_STATE_TABLE,
  MOD_DOH_06_MATRIX,
  RUN_DECISIONS,
  stateIsGovernedByDecStuck,
} from '@/surfaces/doh/modules/doh-06/matrix'
import { SEEDED_RUNS } from '@/surfaces/doh/modules/doh-06/fixtures'
import {
  CONTROL_MATRIX as MOD_DOH_07_MATRIX,
  DEFERRAL_RENDERING,
  assignmentCellRendering,
} from '@/surfaces/doh/modules/doh-07/matrix'
import {
  CONTROL_MATRIX as MOD_DOH_08_MATRIX,
  DOH_08_CONTRADICTIONS,
} from '@/surfaces/doh/modules/doh-08/matrix'
import {
  MOD_DOH_15_MATRIX,
  doh15Affordance,
  doh15Row,
} from '@/surfaces/doh/modules/doh-15/matrix'
import {
  CATALOGUE_A_PRIMARY_ROLE,
  CONTROL_MATRIX as MOD_DOH_16_MATRIX,
} from '@/surfaces/doh/modules/doh-16/matrix'
import { CONTROL_MATRIX as MOD_DOH_19_MATRIX } from '@/surfaces/doh/modules/doh-19/matrix'

/* THE OTHER TEN MODULES' LIVE MATRICES, imported for gate 5 alone -- see the
 * population note there. `MOD-DOH-10` and `MOD-DOH-11` keep theirs under
 * `src/`; the slice-4 eight keep theirs in `app/hub/<slug>/fixtures.ts`, which
 * is where `scripts/build-doh-module-reach.mjs` reads them from, so the gate
 * re-asks the question of the same rows the generator answered it from. */
import { CONTROL_MATRIX as MOD_DOH_10_MATRIX } from '@/surfaces/doh/modules/doh-10/matrix'
import { CONTROL_MATRIX as MOD_DOH_11_MATRIX } from '@/surfaces/doh/modules/doh-11/matrix'
import { CONTROL_MATRIX as MOD_DOH_01_MATRIX } from '../../app/hub/tenant-lifecycle-and-tier-operations/fixtures'
import { CONTROL_MATRIX as MOD_DOH_02_MATRIX } from '../../app/hub/location-configuration/fixtures'
import { CONTROL_MATRIX as MOD_DOH_03_MATRIX } from '../../app/hub/shift-management/fixtures'
import { CONTROL_MATRIX as MOD_DOH_04_MATRIX } from '../../app/hub/worker-lifecycle-and-qualifications/fixtures'
import { PERMISSION_MATRIX as MOD_DOH_09_MATRIX } from '../../app/hub/permissions-roles-and-access/fixtures'
import { CONTROL_MATRIX as MOD_DOH_12_MATRIX } from '../../app/hub/integration-surface/fixtures'
import { CONTROL_MATRIX as MOD_DOH_13_MATRIX } from '../../app/hub/tenant-view-of-platform-administration/fixtures'
import { CONTROL_MATRIX as MOD_DOH_14_MATRIX } from '../../app/hub/qualification-calendar/fixtures'

/* ==================================================================== *
 * SLICE 6 GATES — Delivery Operations Hub: Job, Run, Assignment,
 * Execution Summary, and the system-of-record disclosure.
 *
 * THE STANDARD THIS FILE IS HELD TO. Every gate below plants a violation
 * on the axis it exists for, watches it go red, and restores it. A gate
 * that cannot fail is worse than no gate, because it reads as coverage —
 * this slice found FIVE checks blind, every one by planting and not one by
 * review. The planted-violation cases sit beside the gate they arm and are
 * named `PLANT`.
 *
 * TWO STRUCTURAL RULES, applied without exception:
 *
 * 1. WHERE THE CLAIM IS ABOUT WHAT RENDERS, THE GATE READS `out/hub/**`,
 *    never the source that hopes to produce it. A screen this slice
 *    shipped mounts `DEC-STUCK-001` in a branch the shipped artefact does
 *    not reach; the source reads as if it renders and the built tree says
 *    otherwise. Gate 2 is the one that can see the difference.
 *
 * 2. EVERY NEGATIVE MATCH IS PRECEDED BY A NON-EMPTY ASSERTION ON WHAT IT
 *    SCANNED, and — where the scan looks for a KIND of element — by proof
 *    that the detector fires on the live tree at all. A scan of zero files
 *    passes every `not.toMatch` ever written, and a selector that matches
 *    nothing anywhere passes just as quietly. Gate 4 carries the sharpest
 *    case: a first draft of it matched `disabled` as a SUBSTRING and read
 *    Tailwind's `disabled:opacity-50` CLASS as sixty disabled controls.
 *    Parsing the DOM rather than the text is what makes its zero real.
 *
 * PER-MODULE ENUMERATION IS SLICE SIX'S OWN SEVEN, AND IT USED TO BE THE
 * DIRECTORY LISTING. `SLICE_SIX` below was built by listing
 * `src/surfaces/doh/modules/`, which coupled a slice-6 gate to every slice
 * that would ever add a module directory. It cost exactly what that shape
 * costs: slice 10 landed `doh-10` and `doh-11`, neither of which this file
 * binds a matrix to, and the enumeration THREW AT COLLECTION — so the whole
 * file produced ZERO TESTS. A suite that cannot run cannot fail, which is
 * worse than a failing assertion, and a third task was landing `doh-18` the
 * same afternoon.
 *
 * So the enumeration is `SLICE_SIX_IDS`, declared, and gate 6 holds it
 * against three independent things rather than one: `MATRIX_BY_ID`'s keys,
 * `DOH_MODULES`, and the directories on disk. A slice-6 module dropped from
 * the binding map is red; a slice-6 module whose directory is deleted is
 * red; a slice-6 module missing from `DOH_MODULES` is red. A SIBLING SLICE
 * ADDING A DIRECTORY IS INVISIBLE, which is the whole point — it is not this
 * gate's subject, and coupling to "every directory that exists" made it one.
 * ==================================================================== */

const ROOT = process.cwd()
const OUT_HUB = join(ROOT, 'out', 'hub')
const APP_HUB = join(ROOT, 'app', 'hub')
const SRC = join(ROOT, 'src')
const MODULE_DIR = join(SRC, 'surfaces', 'doh', 'modules')

const OWN_PROBE_DIR = ownProbeDir()
/** Own probe VISIBLE, every other process's hidden — this file plants and then scans. */
const hidden = (entry: string): boolean => isForeign(entry, OWN_PROBE_DIR)

const PROBE_ROOTS = [SRC, OUT_HUB, APP_HUB]
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

const entriesOf = (dir: string): string[] => readdirSync(dir).filter((e) => !hidden(e))

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of entriesOf(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

/**
 * A budget for the cases that parse 1.2 MB of built HTML or walk every
 * authored source file. Vitest's release default is 5 s and a cold first
 * case crosses it on parse alone, which turns a green gate red on timing
 * and teaches people to re-run rather than to read.
 */
const SLOW = 30_000

/**
 * Gate 7 forks `node scripts/build-registries.mjs`, which walks 62 route
 * directories and writes fourteen registries. About a second on an idle
 * box; the release project runs beside whatever else is building, and a
 * budget sized on an idle measurement is the wait-for-scheduler failure
 * `registry-freshness.test.ts` records for the same reason.
 */
const GENERATOR_BUDGET = 120_000

/**
 * RUN THE GATE'S OWN ASSERTION UNDER A PLANT AND RETURN WHAT IT SAID.
 *
 * Every PLANT case below goes through this rather than re-asserting the
 * predicate by hand, and the difference is not cosmetic: a plant that
 * checks `offenders.length === 1` proves the PREDICATE saw something, while
 * this proves THE GATE — the same `expect(...).toEqual([])` that runs on a
 * clean tree — actually fails. Those are the same thing right up until
 * somebody changes the gate and not the plant.
 */
function redOutput(gate: () => void): string {
  try {
    gate()
  } catch (err) {
    // The message ALONE is not the red output. Vitest abbreviates a failing
    // array to `[ Array(1) ]`, so a plant asserting on the message would be
    // asserting on the word "expected" and nothing else. The reported ACTUAL
    // value is where the offender's name lives, and it is what a reader sees
    // in the diff below the message.
    const e = err as Error & { actual?: unknown }
    return `${e.message}\n${JSON.stringify(e.actual ?? null)}`
  }
  throw new Error('THE GATE DID NOT GO RED UNDER ITS PLANT — a gate that cannot fail reads as coverage')
}

const sha = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex')

/**
 * Restore a file this suite MUTATES in place, byte for byte.
 *
 * `git checkout` is not used and the reason is recorded rather than assumed:
 * the controller restored a planted file that way this wave and it wiped
 * uncommitted edits alongside the plant. A restore that takes everything
 * back is not a restore, it is a revert. `out/` is not in git at all, so
 * there is nothing for git to restore there either.
 */
function withMutatedFile(path: string, mutate: (before: string) => string, assertCaught: () => void): void {
  const before = readFileSync(path, 'utf8')
  const beforeHash = sha(path)
  try {
    const after = mutate(before)
    expect(after, `the mutation of ${path} changed nothing — the plant is inert`).not.toBe(before)
    writeFileSync(path, after)
    assertCaught()
  } finally {
    writeFileSync(path, before)
  }
  expect(sha(path), `${path} was not restored byte for byte`).toBe(beforeHash)
}

/* -------------------------------------------------------------------- *
 * THE BUILT ARTEFACT.
 * -------------------------------------------------------------------- */

interface BuiltPage {
  readonly slug: string
  readonly file: string
  readonly doc: Document
  /** Rendered text, whitespace-normalised. Never the raw HTML: `&#x27;` and
   *  `&quot;` make an apostrophe or a quotation mark in a disclosure
   *  invisible to a raw-string search, which is how a first draft of gate 2
   *  reported all five readings of DEC-RUNSTATE-001 as missing. */
  readonly text: string
}

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()

/**
 * THE PARSE CACHE, KEYED ON CONTENT AND NOT ON EXISTENCE.
 *
 * `out/hub/**` is 1.2 MB across seventeen pages and JSDOM takes about a
 * second to parse it; this file asks for the tree two dozen times, once per
 * assertion and once per plant. Caching by PATH would be the version of
 * this that cannot fail: every plant here either adds a page or rewrites
 * one, and a path-keyed cache would hand the plant the pre-plant document
 * and report a clean tree. The key is the file's sha256, so a rewritten
 * page is re-parsed and an untouched one is not.
 */
const PAGE_CACHE = new Map<string, { hash: string; page: BuiltPage }>()

function builtHubPages(): BuiltPage[] {
  return entriesOf(OUT_HUB)
    .filter((e) => statSync(join(OUT_HUB, e)).isDirectory())
    .map((slug) => ({ slug, file: join(OUT_HUB, slug, 'index.html') }))
    .filter(({ file }) => existsSync(file))
    .map(({ slug, file }) => {
      const html = readFileSync(file, 'utf8')
      const hash = createHash('sha256').update(html).digest('hex')
      const hit = PAGE_CACHE.get(file)
      if (hit !== undefined && hit.hash === hash) return hit.page
      const doc = readerDocument(html)
      const page: BuiltPage = { slug, file, doc, text: norm(doc.body.textContent ?? '') }
      PAGE_CACHE.set(file, { hash, page })
      return page
    })
}

/** Reads the tree through the content-keyed cache above. */
const cleanPages = (): BuiltPage[] => builtHubPages()

/** Anything a person can operate or land on with a keyboard. */
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
].join(',')

/** `[disabled]` and `[aria-disabled]` are the SUBJECT of gate 4, not part of
 *  the control set above: gate 1 refuses a control for a cross-surface act
 *  whether it is live or disabled, and gate 4 refuses the disabled one on
 *  its own axis. */
const DISABLED_SEMANTICS = '[disabled],[aria-disabled="true"]'

interface BuiltControl {
  readonly slug: string
  readonly label: string
  readonly disabled: boolean
}

/** Per-document, because the document objects are themselves cached by
 *  content — a rewritten page yields a new object and a fresh walk. */
const CONTROLS_OF_PAGE = new WeakMap<BuiltPage, BuiltControl[]>()

function controlsOf(page: BuiltPage): BuiltControl[] {
  const hit = CONTROLS_OF_PAGE.get(page)
  if (hit !== undefined) return hit
  const out: BuiltControl[] = []
  for (const el of page.doc.querySelectorAll(CONTROL_SEMANTICS)) {
    const label = norm(el.textContent ?? '')
    if (label.length === 0) continue
    out.push({ slug: page.slug, label, disabled: el.matches(DISABLED_SEMANTICS) })
  }
  CONTROLS_OF_PAGE.set(page, out)
  return out
}

const builtControls = (pages: readonly BuiltPage[]): BuiltControl[] => pages.flatMap(controlsOf)

/* -------------------------------------------------------------------- *
 * THE SEVEN MODULES, ENUMERATED FROM THE DIRECTORY.
 * -------------------------------------------------------------------- */

type Slice6Row = DohControlMatrixRow<string>

/**
 * SLICE SIX'S SEVEN MODULES, DECLARED — the subject of every gate in this
 * file. It is a literal list and not a directory listing, for the reason the
 * header gives; it is not derived from `MATRIX_BY_ID` either, because a
 * subject derived from the binding map cannot notice a module dropped from
 * the binding map. Gate 6 holds the two against each other and against disk.
 */
const SLICE_SIX_IDS = [
  'MOD-DOH-05',
  'MOD-DOH-06',
  'MOD-DOH-07',
  'MOD-DOH-08',
  'MOD-DOH-15',
  'MOD-DOH-16',
  'MOD-DOH-19',
] as const

/** The one place a module id is bound to its matrix. Gate 6 proves this map
 *  is complete against `SLICE_SIX_IDS`, `DOH_MODULES` and the directories on
 *  disk, so a slice-6 module cannot lose its entry here with no gate
 *  noticing. */
const MATRIX_BY_ID: Readonly<Record<string, readonly Slice6Row[]>> = {
  'MOD-DOH-05': MOD_DOH_05_MATRIX as readonly Slice6Row[],
  'MOD-DOH-06': MOD_DOH_06_MATRIX as readonly Slice6Row[],
  'MOD-DOH-07': MOD_DOH_07_MATRIX as readonly Slice6Row[],
  'MOD-DOH-08': MOD_DOH_08_MATRIX as readonly Slice6Row[],
  'MOD-DOH-15': MOD_DOH_15_MATRIX as readonly Slice6Row[],
  'MOD-DOH-16': MOD_DOH_16_MATRIX as readonly Slice6Row[],
  'MOD-DOH-19': MOD_DOH_19_MATRIX as readonly Slice6Row[],
}

/** `doh-08` -> `MOD-DOH-08`. The directory name IS the module id, lowered. */
const idOfDir = (dir: string): string => dir.replace(/^doh-/, 'MOD-DOH-').toUpperCase()
/** And back: `MOD-DOH-08` -> `doh-08`. */
const dirOfId = (id: string): string => id.replace(/^MOD-DOH-/, 'doh-').toLowerCase()

/** THE ENUMERATION — slice six's own ids, in directory-name form. */
function enumeratedModuleDirs(): string[] {
  return SLICE_SIX_IDS.map(dirOfId).sort()
}

/** Every module directory that exists, whichever slice owns it. Read only to
 *  prove slice six's own seven are all there. */
function moduleDirsOnDisk(): string[] {
  return entriesOf(MODULE_DIR)
    .filter((e) => statSync(join(MODULE_DIR, e)).isDirectory())
    .sort()
}

interface Slice6Module {
  readonly id: string
  readonly dir: string
  readonly rows: readonly Slice6Row[]
}

function slice6Modules(): Slice6Module[] {
  const onDisk = new Set(moduleDirsOnDisk())
  return enumeratedModuleDirs().map((dir) => {
    const id = idOfDir(dir)
    if (!onDisk.has(dir)) {
      throw new Error(
        `SLICE_SIX_IDS names ${id} and src/surfaces/doh/modules/${dir} is not on disk. A gate ` +
          `whose subject has no matrix directory is testing nothing; move the id out of this ` +
          `file's subject deliberately rather than leaving it pointing at nothing.`,
      )
    }
    const rows = MATRIX_BY_ID[id]
    if (rows === undefined) {
      throw new Error(
        `${id} is one of slice six's own modules and this gate file binds no matrix to it. ` +
          `Add it to MATRIX_BY_ID — an enumeration that silently skips a module is the blind spot ` +
          `these gates exist to prevent.`,
      )
    }
    return { id, dir, rows }
  })
}

const SLICE_SIX = slice6Modules()
const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]
const ACTING_STATUSES: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions']

/* ==================================================================== *
 * GATE 1 — NO HUB SCREEN RENDERS A CONTROL FOR AN ACT THE SOURCE PLACES
 * ON ANOTHER SURFACE. CLASSIFICATION DECIDES, NEVER THE TOKEN.
 *
 * The trap that nearly caught four module tasks: `MOD-DOH-08` row 8
 * "Release a Severity 1 lot hold" reads `Allowed` for the Quality Manager
 * at L28307 and the act is Client Command Center action 4 (WF-QLT-006,
 * L13423, L49579). `CC_RELEASE_LOT_HOLD` already exists, so a Hub release
 * button would be a second release path for one record.
 *
 * TWO AXES, AND THE SECOND IS THE ONE WAVE 0's GATE IS BLIND TO.
 * `inlineControlsOnAdjacentCapabilities` reads a row's OWN classification
 * and its OWN register pointer, so it cannot see a row that carries
 * neither and is met elsewhere anyway — task 8's plant 4 left it green.
 * So this gate derives its subject two ways and unions them:
 *
 *   A. `surface === 'another-surface'` — the declared token.
 *   B. `MATRIX_ROW_SURFACE_DIVERGENCES` — the register of rows whose
 *      classification the modules themselves record as wrong for reach.
 *      Rows are resolved out of it BY LOCATOR, from the leading "(the
 *      rows)" clause of each entry's `sourceRef`, so nothing here is a
 *      hand-written row list and a fourth divergence is picked up the day
 *      it is recorded.
 *
 * plus every row no role may ACT on under any token, which is the shape
 * "the capability exists for nobody" — a disabled control there promises a
 * condition that could become true, and none can.
 * ==================================================================== */

interface OffScreenAct {
  readonly moduleId: string
  readonly rowId: string
  readonly control: string
  readonly axis: 'token' | 'divergence' | 'held-by-nobody'
}

function divergenceRowLocators(sourceRef: string): string[] {
  // The leading clause names the ROWS; everything after the first `;` is
  // corroboration and would drag unrelated rows in by their own locators.
  const head = sourceRef.split(';')[0] ?? sourceRef
  return [...head.matchAll(/L(\d+)/g)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))
}

function offScreenActs(modules: readonly Slice6Module[]): OffScreenAct[] {
  const byKey = new Map<string, OffScreenAct>()
  const add = (a: OffScreenAct) => {
    if (!byKey.has(`${a.moduleId}|${a.rowId}`)) byKey.set(`${a.moduleId}|${a.rowId}`, a)
  }
  for (const m of modules) {
    for (const row of m.rows) {
      if (row.surface === 'another-surface') {
        add({ moduleId: m.id, rowId: row.id, control: row.control, axis: 'token' })
        continue
      }
      const acts = TENANT_ROLES.some((role) => ACTING_STATUSES.includes(cellStatus(row, role)))
      if (!acts) add({ moduleId: m.id, rowId: row.id, control: row.control, axis: 'held-by-nobody' })
    }
  }
  for (const d of MATRIX_ROW_SURFACE_DIVERGENCES) {
    const locators = divergenceRowLocators(d.sourceRef)
    for (const m of modules) {
      for (const row of m.rows) {
        if (!locators.some((l) => row.sourceRef.includes(`L${l}`))) continue
        add({ moduleId: m.id, rowId: row.id, control: row.control, axis: 'divergence' })
      }
    }
  }
  return [...byKey.values()]
}

/** Every built control whose label names an act met off this module's screen. */
function controlsForOffScreenActs(
  controls: readonly BuiltControl[],
  acts: readonly OffScreenAct[],
): string[] {
  const offenders: string[] = []
  for (const act of acts) {
    for (const c of controls) {
      if (c.label !== act.control && !c.label.includes(act.control)) continue
      offenders.push(
        `out/hub/${c.slug}: control "${c.label}" for ${act.moduleId} row \`${act.rowId}\` ` +
          `(${act.axis} axis) — the act is not met on this module's own screen`,
      )
    }
  }
  return offenders
}

describe('slice 6 gate 1: no Hub control for an act the source places elsewhere', () => {
  it('scans a non-empty built tree and a non-empty set of off-screen acts', () => {
    const pages = cleanPages()
    expect(pages.length, 'out/hub/** is empty — run `pnpm build` before `pnpm test:release`').toBeGreaterThan(0)
    const controls = builtControls(pages)
    expect(controls.length, 'no control rendered on any built Hub page — the selector is wrong').toBeGreaterThan(0)

    const acts = offScreenActs(SLICE_SIX)
    expect(acts.length).toBeGreaterThan(0)
    // BOTH AXES MUST BE POPULATED. If either goes empty the gate is half
    // asleep, and the half that goes quiet first is the one wave 0 could
    // not see at all.
    expect(acts.filter((a) => a.axis === 'token').length).toBeGreaterThan(0)
    expect(acts.filter((a) => a.axis === 'divergence').length).toBeGreaterThan(0)
    // Every recorded divergence ABOUT A SLICE-6 MODULE resolves to at least
    // one real row. A divergence that resolves to nothing is a register entry
    // this gate is not reading, which is exactly how a pointer becomes
    // decoration.
    //
    // SCOPED TO SLICE SIX, because the register is not. It is the surface's
    // register of row-token findings and slice 10 recorded one against
    // `MOD-DOH-10`, whose rows this gate does not hold and should not: the
    // subject is `SLICE_SIX`. Requiring every entry to resolve here would make
    // a sibling's honest finding a slice-6 failure — the same coupling the
    // enumeration above was just narrowed to remove. Which entries are slice
    // six's is read off the entry's own `where`, so nothing here is a list.
    expect(MATRIX_ROW_SURFACE_DIVERGENCES.length).toBeGreaterThan(0)
    const namesSliceSix = (d: { readonly where: string }): boolean =>
      SLICE_SIX.some((m) => d.where.includes(m.id) || d.where.includes(m.dir))
    const ours = MATRIX_ROW_SURFACE_DIVERGENCES.filter(namesSliceSix)
    expect(ours.length, 'no recorded divergence names a slice-6 module').toBeGreaterThan(0)
    for (const d of ours) {
      const locators = divergenceRowLocators(d.sourceRef)
      const hits = SLICE_SIX.flatMap((m) =>
        m.rows.filter((r) => locators.some((l) => r.sourceRef.includes(`L${l}`))),
      )
      expect(hits.length, `divergence "${d.where}" resolves to no matrix row`).toBeGreaterThan(0)
    }
  }, SLOW)

  it('no built Hub page renders a control for an off-screen act', () => {
    const controls = builtControls(cleanPages())
    expect(controlsForOffScreenActs(controls, offScreenActs(SLICE_SIX))).toEqual([])
  }, SLOW)

  it('PLANT — a Hub release control for the Severity 1 lot hold goes red (token axis)', () => {
    const acts = offScreenActs(SLICE_SIX)
    const lotHold = acts.find((a) => a.rowId === 'release-a-severity-1-lot-hold')
    expect(lotHold?.axis, 'the lot-hold row is no longer classified `another-surface`').toBe('token')
    withPlanted(
      OUT_HUB,
      'index.html',
      `<html><body><button type="button">${lotHold?.control}</button></body></html>`,
      () => {
        const red = redOutput(() =>
          expect(controlsForOffScreenActs(builtControls(builtHubPages()), acts)).toEqual([]),
        )
        expect(red).toContain(OWN_PROBE_DIR)
        expect(red).toContain('release-a-severity-1-lot-hold')
        expect(red).toContain('token axis')
      },
    )
  }, SLOW)

  it('PLANT — a control for a row the TOKEN calls `screen` goes red (the wave-0 blind spot)', () => {
    const acts = offScreenActs(SLICE_SIX)
    /* THE AXIS WAVE 0 CANNOT SEE. `MOD-DOH-06`'s record-finish-window row is
     * classified `screen`, carries NO register pointer, and reads `Allowed
     * with conditions` for the Tenant Admin — so `adjacentAffordance` returns
     * `own-row` and `inlineControlsOnAdjacentCapabilities` has nothing to
     * report. It is still met in the tenant administration area, which is
     * `SCR-DOH-23` and not this module's screen. Task 8's plant 4 went green
     * against a row of exactly this shape. */
    const pointerRow = acts.find((a) => a.rowId === 'set-the-record-finish-window')
    expect(pointerRow, 'the record-finish-window row is no longer resolved from the divergence register').toBeDefined()
    expect(pointerRow?.axis).toBe('divergence')
    const row = MOD_DOH_06_MATRIX.find((r) => r.id === 'set-the-record-finish-window')
    expect(row?.surface, 'this plant is only the blind-spot axis while the token still reads `screen`').toBe('screen')
    expect(
      TENANT_ROLES.some((role) => ACTING_STATUSES.includes(cellStatus(row as Slice6Row, role))),
      'this plant is only the blind-spot axis while some role still reads a permissive token',
    ).toBe(true)
    withPlanted(
      OUT_HUB,
      'index.html',
      `<html><body><button type="button">${pointerRow?.control}</button></body></html>`,
      () => {
        const red = redOutput(() =>
          expect(controlsForOffScreenActs(builtControls(builtHubPages()), acts)).toEqual([]),
        )
        expect(red).toContain('set-the-record-finish-window')
        expect(red).toContain('divergence axis')
      },
    )
  }, SLOW)
})

/* ==================================================================== *
 * GATE 2 — THE THREE OPEN DECISIONS STAY OPEN.
 *
 * DEC-RUNSTATE-001, DEC-STUCK-001 and DEC-FINISH-001. No built page names
 * either contested run-state word as settled, and every reading renders.
 *
 * "EVERY READING RENDERS" IS ASKED OF THE BUILT TREE, and the built tree
 * gave a different answer from the source. `RunSchedulingScreen` mounts all
 * three; the shipped artefact carries two. `DEC-STUCK-001` sits behind
 * `stateIsGovernedByDecStuck`, which is false for the run the board opens
 * on — so the disclosure is authored, mounted, and invisible in `out/`.
 * The gate does not paper over that: a decision the built tree does not
 * carry must be proved REACHABLE over the shipped fixture, which is the
 * difference between "behind a branch a reader can get to" and "dead".
 * ==================================================================== */

const CONTESTED_WORDS = CLOSING_STATE_TABLE.filter((r) => r.disputed).map((r) => r.state)

interface DecisionCoverage {
  readonly id: string
  readonly rendered: boolean
  readonly missing: readonly string[]
}

function decisionCoverage(pages: readonly BuiltPage[]): DecisionCoverage[] {
  return RUN_DECISIONS.map((d) => {
    const carries = (needle: string) => pages.some((p) => p.text.includes(norm(needle)))
    const rendered = carries(d.question)
    const parts = [
      ...d.readings.map((r, i) => [`reading ${i + 1}`, r.text] as const),
      ['onScreen', d.onScreen] as const,
      ['buildPosition', d.buildPosition] as const,
    ]
    return {
      id: d.id,
      rendered,
      missing: rendered ? parts.filter(([, text]) => !carries(text)).map(([what]) => what) : [],
    }
  })
}

/** A built page that renders a contested run-state word as a code token and
 *  does NOT carry the decision that disputes it. */
function contestedWordsWithoutTheirDecision(pages: readonly BuiltPage[]): string[] {
  const offenders: string[] = []
  for (const page of pages) {
    const codes = [...page.doc.querySelectorAll('code')].map((c) => norm(c.textContent ?? ''))
    const hits = codes.filter((c) => (CONTESTED_WORDS as readonly string[]).includes(c))
    if (hits.length === 0) continue
    if (page.text.includes('DEC-RUNSTATE-001')) continue
    offenders.push(`out/hub/${page.slug}: renders <code>${hits.join('/')}</code> and no DEC-RUNSTATE-001`)
  }
  return offenders
}

/** In the closing-state table as it BUILDS, a disputed row's standing cell
 *  must be non-empty and must differ from the undisputed row's. Keyed on
 *  `disputed` in the data and on the DOM, never on the pill's wording — a
 *  gate pinned to "One reading of three" would go red the day somebody
 *  rewords the pill and green the day somebody deletes the distinction. */
function closingTableStandings(pages: readonly BuiltPage[]): Map<string, string> {
  const standings = new Map<string, string>()
  for (const page of pages) {
    for (const tr of page.doc.querySelectorAll('tr')) {
      const state = norm(tr.querySelector('code')?.textContent ?? '')
      if (!CLOSING_STATE_TABLE.some((r) => r.state === state)) continue
      const cells = [...tr.querySelectorAll('td,th')]
      const last = cells[cells.length - 1]
      if (cells.length < 3 || last === undefined) continue
      standings.set(state, norm(last.textContent ?? ''))
    }
  }
  return standings
}

describe('slice 6 gate 2: the three open decisions stay open', () => {
  it('scans a non-empty built tree, and the contested words come from the data', () => {
    expect(cleanPages().length).toBeGreaterThan(0)
    expect(RUN_DECISIONS.length).toBe(3)
    expect(CONTESTED_WORDS).toEqual(['submitted', 'complete'])
    expect(CLOSING_STATE_TABLE.filter((r) => !r.disputed).map((r) => r.state)).toEqual(['finished'])
  }, SLOW)

  it('every decision the built tree carries renders EVERY one of its readings', () => {
    const coverage = decisionCoverage(cleanPages())
    const rendered = coverage.filter((c) => c.rendered)
    // ALL THREE now. This read two, and named DEC-STUCK-001 as the one the
    // built tree did not carry -- authored, mounted behind a branch the
    // shipped fixture never reached, and therefore disclosed to nobody. It
    // was given a page-level mount, so the equality moved up by one and the
    // companion case below inverted. Both were red until they did.
    //
    // Non-vacuity is unchanged in kind: this list is compared for equality,
    // so a decision quietly ceasing to render fails here rather than
    // shrinking a loop nobody watches.
    expect(rendered.map((c) => c.id).sort()).toEqual([
      'DEC-FINISH-001',
      'DEC-RUNSTATE-001',
      'DEC-STUCK-001',
    ])
    for (const c of rendered) expect(c.missing, `${c.id} drops a reading`).toEqual([])
  }, SLOW)

  it('no decision is authored and left unreachable, and the bite site still exists', () => {
    const absent = decisionCoverage(cleanPages()).filter((c) => !c.rendered)
    // EMPTY NOW. This asserted `['DEC-STUCK-001']` -- a decision recorded as
    // disclosed and reachable by nobody. That is the false-comfort defect,
    // and the honest pin was to record it rather than describe it in prose.
    // It is fixed, so the pin inverts to the claim that ought to hold: no
    // decision is authored and left unreachable.
    expect(absent.map((c) => c.id)).toEqual([])
    /* THE BITE SITE IS STILL CHECKED, AND THAT IS THE HALF WORTH KEEPING.
     * `DEC-STUCK-001` also renders where it bites —
     * on a run closed by hand — and the board opens on a run that was not.
     * Two things must hold or the disclosure is dead: the screen mounts it,
     * and the shipped fixture contains a run that reaches the mount. If a
     * later change removes the manually-closed run, this goes red rather
     * than the decision quietly ceasing to be disclosed anywhere. */
    const screen = readFileSync(
      join(APP_HUB, 'run-scheduling-and-execution-oversight', 'RunSchedulingScreen.tsx'),
      'utf8',
    )
    expect(stripComments(screen)).toContain('DEC_STUCK_001')
    expect(SEEDED_RUNS.length).toBeGreaterThan(0)
    expect(
      SEEDED_RUNS.filter(stateIsGovernedByDecStuck).length,
      'no seeded run is closed by hand, so the DEC-STUCK-001 disclosure renders nowhere at all',
    ).toBeGreaterThan(0)
  }, SLOW)

  it('no built page names a contested run-state word without the decision that disputes it', () => {
    const pages = cleanPages()
    const carrying = pages.filter((p) =>
      [...p.doc.querySelectorAll('code')].some((c) =>
        (CONTESTED_WORDS as readonly string[]).includes(norm(c.textContent ?? '')),
      ),
    )
    // Detector-fires proof before the negative assertion.
    expect(carrying.length, 'no built page renders a contested word at all — the detector is dead').toBeGreaterThan(0)
    expect(contestedWordsWithoutTheirDecision(pages)).toEqual([])
  }, SLOW)

  it('the closing-state table marks its disputed rows differently from its settled one', () => {
    const standings = closingTableStandings(cleanPages())
    expect([...standings.keys()].sort()).toEqual(['complete', 'finished', 'submitted'])
    const settled = standings.get('finished')
    expect(settled).toBeTruthy()
    for (const word of CONTESTED_WORDS) {
      const standing = standings.get(word)
      expect(standing, `${word} has an empty standing cell`).toBeTruthy()
      expect(standing, `${word} is marked as settled as \`finished\` is`).not.toBe(settled)
    }
  }, SLOW)

  it('PLANT — deleting ONE reading of DEC-RUNSTATE-001 from the built page goes red', () => {
    const runstate = RUN_DECISIONS.find((d) => d.id === 'DEC-RUNSTATE-001')
    const readingC = runstate?.readings[2]?.text as string
    const page = cleanPages().find((p) => p.text.includes(norm(readingC)))
    expect(page, 'reading C is not on the built page this plant means to edit').toBeDefined()
    withMutatedFile(
      page?.file as string,
      // Reading C is escaped in the HTML, so the plant edits the ONE token
      // that is stable through escaping — the reading's own §-locator — and
      // the sentence that only reading C carries.
      (before) => before.replace('every assignment on the run is finished as known to the server', 'ELIDED'),
      () => {
        const coverage = decisionCoverage(builtHubPages())
        const runstateCoverage = coverage.find((c) => c.id === 'DEC-RUNSTATE-001')
        expect(runstateCoverage?.rendered, 'the plant removed the whole disclosure, not one reading').toBe(true)
        const red = redOutput(() => expect(runstateCoverage?.missing).toEqual([]))
        expect(red).toContain('reading 3')
        // And nothing else moved: the plant proves what it claims to prove.
        expect(coverage.find((c) => c.id === 'DEC-FINISH-001')?.missing).toEqual([])
        expect(runstateCoverage?.missing).toEqual(['reading 3'])
      },
    )
  }, SLOW)

  it('PLANT — a built page naming a contested word with no decision goes red', () => {
    withPlanted(
      OUT_HUB,
      'index.html',
      `<html><body><p>The run is <code>${CONTESTED_WORDS[0]}</code>.</p></body></html>`,
      () => {
        const red = redOutput(() => expect(contestedWordsWithoutTheirDecision(builtHubPages())).toEqual([]))
        expect(red).toContain(OWN_PROBE_DIR)
        expect(red).toContain(CONTESTED_WORDS[0])
      },
    )
  }, SLOW)
})

/* ==================================================================== *
 * GATE 3 — `Job Owner` IS NEVER A ROLE.
 *
 * Catalogue A gives the paired scheduling view a "Primary role" of
 * "Supervisor and Job Owner" at L26074. Job Owner is a FIELD on the Job
 * record — L27652, L7151, L16282 — and reading it as a role mints a sixth
 * tenant role with permissions over every Job at once, which is the
 * escalation "it confers no permissions" closes.
 *
 * THE SCAN IS FOR THE TOKEN AS A TOKEN, not for the phrase. `JOB_OWNER`
 * appears in this codebase as a substring of `DOH_REASSIGN_JOB_OWNER`,
 * `JOB_OWNER_COLUMN_CELLS` and `JOB_OWNER_GATED_ROWS`, all of them correct,
 * and the words "no JOB_OWNER in any role list" render on two built pages
 * INSIDE A DISCLOSURE SAYING SO. A gate matching the bare string would
 * fail on correct code and on the sentence explaining why the code is
 * correct — the same trap `stripComments` exists for. What is forbidden is
 * a QUOTED `'JOB_OWNER'`, which is the only shape a role token takes.
 * ==================================================================== */

/**
 * A ROLE TOKEN IS A QUOTED STRING LITERAL, and the quotes are straight ones.
 * A first draft accepted BACKTICKS too and went red on two correct files:
 * `doh-05/matrix.ts` and `doh-15/matrix.ts` both carry the sentence "there is
 * no `JOB_OWNER` in any role list" INSIDE a rendered string, where the
 * backticks are markdown emphasis in prose rather than a JavaScript quote.
 * That is the same trap `stripComments` exists for, one layer down: prose
 * that names a forbidden token in order to deny it.
 */
const QUOTED_JOB_OWNER = /'JOB_OWNER'|"JOB_OWNER"/
const ROLE_NAMES = new Set(rolesInDomain('TENANT').map((r) => r.name))

function sourceFilesUnder(roots: readonly string[]): string[] {
  return roots.flatMap((root) => walk(root)).filter((f) => /\.tsx?$/.test(f))
}

function quotedJobOwnerTokens(files: readonly string[]): string[] {
  const offenders: string[] = []
  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    // Cheap prefilter: `stripComments` parses with the TypeScript compiler
    // and there are hundreds of files. Only a file that could offend is
    // parsed, and a file that cannot offend cannot be hidden by the filter.
    if (!QUOTED_JOB_OWNER.test(raw)) continue
    if (QUOTED_JOB_OWNER.test(stripComments(raw))) offenders.push(file)
  }
  return offenders
}

/** A table that carries all five tenant role names in its header, and a
 *  sixth header cell reading like a role. */
function sixthRoleColumns(pages: readonly BuiltPage[]): string[] {
  const offenders: string[] = []
  for (const page of pages) {
    for (const table of page.doc.querySelectorAll('table')) {
      const headers = [...table.querySelectorAll('th')].map((th) => norm(th.textContent ?? ''))
      const isRoleMatrix = [...ROLE_NAMES].every((name) => headers.includes(name))
      if (!isRoleMatrix) continue
      for (const h of headers) {
        if (ROLE_NAMES.has(h)) continue
        if (!/job\s*owner/i.test(h)) continue
        offenders.push(`out/hub/${page.slug}: a five-role matrix carries a "${h}" column`)
      }
    }
  }
  return offenders
}

describe('slice 6 gate 3: Job Owner is a field, never a role', () => {
  it('the role registry holds five tenant roles and no Job Owner', () => {
    expect(rolesInDomain('TENANT')).toHaveLength(5)
    expect(ROLES.filter((r) => /job.?owner/i.test(r.id) || /job\s*owner/i.test(r.name))).toEqual([])
  }, SLOW)

  it('every slice-6 matrix cell is keyed on exactly the five registry roles', () => {
    expect(SLICE_SIX.length).toBeGreaterThan(0)
    for (const m of SLICE_SIX) {
      expect(m.rows.length, `${m.id} has no rows`).toBeGreaterThan(0)
      for (const row of m.rows) {
        expect(Object.keys(row.status).sort(), `${m.id} ${row.id} status`).toEqual([...TENANT_ROLES].sort())
        expect(Object.keys(row.detail).sort(), `${m.id} ${row.id} detail`).toEqual([...TENANT_ROLES].sort())
      }
    }
  }, SLOW)

  it('no quoted JOB_OWNER token in any authored source', () => {
    const files = sourceFilesUnder([SRC, join(ROOT, 'app')])
    expect(files.length, 'the source walk found nothing').toBeGreaterThan(100)
    expect(quotedJobOwnerTokens(files)).toEqual([])
  }, SLOW)

  it('no built five-role matrix carries a sixth Job Owner column', () => {
    const pages = cleanPages()
    const roleMatrices = pages.flatMap((p) =>
      [...p.doc.querySelectorAll('table')].filter((t) => {
        const headers = [...t.querySelectorAll('th')].map((th) => norm(th.textContent ?? ''))
        return [...ROLE_NAMES].every((n) => headers.includes(n))
      }),
    )
    // Detector-fires proof: five-role matrices exist on the built pages.
    expect(roleMatrices.length, 'no five-role matrix renders anywhere — the detector is dead').toBeGreaterThan(0)
    expect(sixthRoleColumns(pages)).toEqual([])
  }, SLOW)

  it("catalogue A's two-audience reading renders rather than its role reading", () => {
    const pages = cleanPages()
    const carrying = pages.filter((p) => p.text.includes(norm(CATALOGUE_A_PRIMARY_ROLE.cell)))
    expect(carrying.length, 'the contested catalogue-A cell is disclosed nowhere').toBeGreaterThan(0)
    for (const p of carrying) {
      expect(p.text, `${p.slug} names the cell without the reading that keeps it a field`).toContain(
        norm(CATALOGUE_A_PRIMARY_ROLE.readAsAudiences),
      )
    }
  }, SLOW)

  it('PLANT — a quoted JOB_OWNER role token in src/ goes red', () => {
    withPlanted(SRC, 'probe.ts', "export const ROLE = 'JOB_OWNER'\n", (probe) => {
      const red = redOutput(() =>
        expect(quotedJobOwnerTokens(sourceFilesUnder([SRC, join(ROOT, 'app')]))).toEqual([]),
      )
      expect(red).toContain(probe)
    })
  }, SLOW)

  it('PLANT — a JOB_OWNER token inside a COMMENT stays green (the gate is not the phrase)', () => {
    withPlanted(SRC, 'probe.ts', "// a role list must never carry 'JOB_OWNER'\nexport const X = 1\n", () => {
      expect(quotedJobOwnerTokens(sourceFilesUnder([SRC, join(ROOT, 'app')]))).toEqual([])
    })
  }, SLOW)

  it('PLANT — a sixth Job Owner column on a five-role matrix goes red', () => {
    const headerRow = [...ROLE_NAMES, 'Job Owner'].map((n) => `<th>${n}</th>`).join('')
    withPlanted(
      OUT_HUB,
      'index.html',
      `<html><body><table><thead><tr><th>Control</th>${headerRow}</tr></thead></table></body></html>`,
      () => {
        const red = redOutput(() => expect(sixthRoleColumns(builtHubPages())).toEqual([]))
        expect(red).toContain('Job Owner')
        expect(red).toContain(OWN_PROBE_DIR)
      },
    )
  }, SLOW)
})

/* ==================================================================== *
 * GATE 4 — THE DEFERRAL RULING: NO MATRIX-AXIS CAPABILITY RENDERS AS A
 * DISABLED CONTROL.
 *
 * A deferred or non-existent capability renders as NO CONTROL plus a
 * stated line where it would sit (AC-DOH-07-5, L28230; SB-DOH-005,
 * L25924). AC-DOH-014-2 at L25935 CONSTRAINS disabled controls rather than
 * licensing them.
 *
 * THE GENUINE EXCEPTION, AND THE GATE IS SCOPED AS THE RULING IS. L29530
 * requires a disabled clone control offline in so many words: "The clone
 * control disables under `FB-DOH-CORE-001`; no clone is queued in the
 * browser." That is the TENANT-STATE axis, which `DEFERRAL_RENDERING`
 * leaves untouched by name. A gate that had swallowed the whole surface
 * would contradict the source here, so this one refuses a disabled control
 * only where the reason is a MATRIX cell.
 *
 * THE SUBSTRING TRAP, RECORDED BECAUSE IT ALMOST SHIPPED. A first draft
 * matched `disabled` in the raw HTML and read Tailwind's
 * `disabled:opacity-50` CLASS as a disabled control on sixty elements. The
 * gate parses the DOM and asks `matches('[disabled],[aria-disabled=true]')`
 * instead, and the count below is what makes the difference visible.
 * ==================================================================== */

const MATRIX_CONTROL_LABELS = new Map<string, string>(
  SLICE_SIX.flatMap((m) => m.rows.map((r) => [r.control, `${m.id} \`${r.id}\``] as const)),
)

function disabledMatrixControls(pages: readonly BuiltPage[]): string[] {
  const offenders: string[] = []
  for (const c of builtControls(pages)) {
    if (!c.disabled) continue
    const owner = MATRIX_CONTROL_LABELS.get(c.label)
    if (owner === undefined) continue
    offenders.push(`out/hub/${c.slug}: "${c.label}" (${owner}) renders as a DISABLED control`)
  }
  return offenders
}

describe('slice 6 gate 4: no matrix-axis capability renders as a disabled control', () => {
  it('the disabled detector fires on the live tree, and the label set is non-empty', () => {
    const pages = cleanPages()
    expect(pages.length).toBeGreaterThan(0)
    const controls = builtControls(pages)
    expect(controls.length).toBeGreaterThan(0)
    // THE ANTI-VACUITY ASSERTION. Disabled controls DO exist on this build
    // (slice-4 modules draw them on the tenant-state axis), so a zero from
    // the negative assertion below is a real zero rather than a selector
    // that matches nothing.
    expect(controls.filter((c) => c.disabled).length).toBeGreaterThan(0)
    expect(MATRIX_CONTROL_LABELS.size).toBeGreaterThan(0)
  }, SLOW)

  it('no built Hub page renders a slice-6 matrix capability as a disabled control', () => {
    expect(disabledMatrixControls(cleanPages())).toEqual([])
  }, SLOW)

  it('the fold has no disabled arm to reach for', () => {
    // MOD-DOH-07's `CellRendering` has three members and none of them is a
    // disabled control. Asked of every row and every role rather than of the
    // type, because a type is not what ships.
    expect(MOD_DOH_07_MATRIX.length).toBeGreaterThan(0)
    let seen = 0
    for (const row of MOD_DOH_07_MATRIX) {
      for (const role of TENANT_ROLES) {
        const cell = assignmentCellRendering(row, role)
        expect(['control', 'absent-with-line', 'cross-surface']).toContain(cell.kind)
        expect(Object.keys(cell)).not.toContain('disabled')
        seen += 1
      }
    }
    expect(seen).toBe(MOD_DOH_07_MATRIX.length * TENANT_ROLES.length)
    expect(DEFERRAL_RENDERING.scope).toContain('The matrix axis only')
  }, SLOW)

  it('the genuine exception holds: the clone control disables OFFLINE, on the tenant-state axis', () => {
    const cloneRow = doh15Row('clone-a-job')
    const online = doh15Affordance(cloneRow, 'TENANT_ADMIN', {
      tenantState: 'active',
      online: true,
      sourceRecurs: true,
    })
    const offline = doh15Affordance(cloneRow, 'TENANT_ADMIN', {
      tenantState: 'active',
      online: false,
      sourceRecurs: true,
    })
    expect(online.kind).toBe('control')
    expect(offline.kind).toBe('control')
    expect(online.kind === 'control' ? online.blockedByTenantState : 'x').toBeNull()
    expect(offline.kind === 'control' ? offline.blockedByTenantState : null).toContain('FB-DOH-CORE-001')

    // AND THE SCOPING: the transient block rides only on the arm that HAS a
    // control, so a matrix-axis absence can never acquire one. Asked over
    // every row and role, offline, which is the state that would expose it.
    for (const row of MOD_DOH_15_MATRIX) {
      for (const role of TENANT_ROLES) {
        const cell = doh15Affordance(row, role, {
          tenantState: 'active',
          online: false,
          sourceRecurs: true,
        })
        if (cell.kind === 'absent') expect(Object.keys(cell)).not.toContain('blockedByTenantState')
      }
    }
  }, SLOW)

  it('PLANT — a matrix capability drawn as a disabled control goes red', () => {
    const label = [...MATRIX_CONTROL_LABELS.keys()].find((l) => l === 'Mark a Summary reviewed')
    expect(label, 'the plant no longer names a real matrix row').toBeDefined()
    withPlanted(
      OUT_HUB,
      'index.html',
      `<html><body><button type="button" disabled>${label}</button></body></html>`,
      () => {
        const red = redOutput(() => expect(disabledMatrixControls(builtHubPages())).toEqual([]))
        expect(red).toContain('Mark a Summary reviewed')
        expect(red).toContain('MOD-DOH-08')
        expect(red).toContain('DISABLED control')
      },
    )
  }, SLOW)

  it('PLANT — the same control ENABLED stays green (the axis is disabled-ness, not the label)', () => {
    withPlanted(
      OUT_HUB,
      'index.html',
      '<html><body><button type="button">Mark a Summary reviewed</button></body></html>',
      () => {
        expect(disabledMatrixControls(builtHubPages())).toEqual([])
      },
    )
  }, SLOW)
})

/* ==================================================================== *
 * GATE 5 — REACH IS DERIVED, NEVER HAND-WRITTEN.
 *
 * `rolesReaching` on every module is generated by
 * `scripts/build-doh-module-reach.mjs` applying `rolesReachingByMatrix` to
 * that module's own matrix. This gate re-asks the question of the LIVE
 * matrices and compares, and it pins both clauses of the rule as
 * load-bearing on slice-6 data by MUTATING THE DATA and re-running the one
 * implementation — never by writing a second copy of the rule here.
 *
 * And catalogue B's "Roles that can open it" is NARROWER than the module
 * matrices on FIVE screens, not the four the plan states: `SCR-DOH-06` is
 * the fifth, where L48100 names two roles against the four L30074 admits.
 * The count below is DERIVED from the register, so it is the corrected
 * number that has to hold rather than the plan's.
 *
 * ── THE POPULATION IS EVERY DOH MODULE, AND IT USED TO BE SEVEN ─────────
 *
 * This is the ONLY general gate on the derivation — audit round 2, R2-P04
 * measured that and it is why the population moved. The spine's own comment
 * claimed "the eight module suites in `tests/unit` compare this field against
 * their own live matrices and go red on the edited entry — each
 * non-vacuously". Measured: eleven DOH suites in `tests/unit` mention
 * `rolesReaching` at all and exactly TWO compare it against a live matrix
 * (`doh-cloning.test.ts` for `MOD-DOH-15`, `doh-sso.test.ts` for
 * `MOD-DOH-12`). The rest compare matrix against matrix with the generated
 * file on neither side, so a hand edit to
 * `registries/generated/doh/module-reach.json` cannot red them.
 *
 * With this gate over slice six's seven and those two suites over two more,
 * `MOD-DOH-10` and `MOD-DOH-11` sat outside every gate population: swapping
 * one valid tenant role for another in either entry survived the whole suite.
 * So the subject here is `DOH_MODULES` — all of them — and `UNBOUND_REACH`
 * below is what makes that real rather than aspirational: a module in the
 * spine with no live matrix bound here is REPORTED BY AN ASSERTION, not by an
 * exception at collection time. Throwing at module scope is how this file once
 * produced zero tests (see the header), and a gate that cannot run cannot
 * fail.
 * ==================================================================== */

const roleNameOf = (id: string): string =>
  rolesInDomain('TENANT').find((r) => r.id === id)?.name ?? id

/** Every DOH module's live matrix — slice six's seven plus the other ten. */
const LIVE_MATRIX_BY_ID: Readonly<Record<string, readonly { readonly surface: MatrixRowSurface }[]>> =
  {
    ...MATRIX_BY_ID,
    'MOD-DOH-01': MOD_DOH_01_MATRIX,
    'MOD-DOH-02': MOD_DOH_02_MATRIX,
    'MOD-DOH-03': MOD_DOH_03_MATRIX,
    'MOD-DOH-04': MOD_DOH_04_MATRIX,
    'MOD-DOH-09': MOD_DOH_09_MATRIX,
    'MOD-DOH-10': MOD_DOH_10_MATRIX,
    'MOD-DOH-11': MOD_DOH_11_MATRIX,
    'MOD-DOH-12': MOD_DOH_12_MATRIX,
    'MOD-DOH-13': MOD_DOH_13_MATRIX,
    'MOD-DOH-14': MOD_DOH_14_MATRIX,
  }

/** A module in the spine that this gate binds no live matrix to. Asserted
 *  empty rather than thrown, so a new module widens the gate instead of
 *  silencing the file. */
const UNBOUND_REACH: readonly string[] = DOH_MODULES.filter(
  (m) => LIVE_MATRIX_BY_ID[m.id] === undefined,
).map((m) => m.id)

type AnyMatrixRow = { readonly surface: MatrixRowSurface }
type ByRoleRow = AnyMatrixRow & Parameters<typeof titleCaseCellStatus>[0]
type CellsRow = AnyMatrixRow & Parameters<typeof outcomeCellStatus>[0]

/**
 * THE ONE RULE, APPLIED TO WHICHEVER CELL SPELLING THE MATRIX USES. The
 * spelling is chosen by the SHAPE of the row rather than by a table mapping
 * module to spelling — the same discrimination
 * `scripts/build-doh-module-reach.mjs` makes — so a fourth spelling returns
 * `null` and reds this gate instead of being skipped. `rolesReachingByMatrix`
 * itself is never reimplemented here.
 */
function liveReach(rows: readonly AnyMatrixRow[]): readonly TenantRoleId[] | null {
  const first = rows[0]
  if (first === undefined) return null
  if ('status' in first) {
    return rolesReachingByMatrix(rows as readonly DohControlMatrixRow[], cellStatus)
  }
  if ('byRole' in first) return rolesReachingByMatrix(rows as readonly ByRoleRow[], titleCaseCellStatus)
  if ('cells' in first) return rolesReachingByMatrix(rows as readonly CellsRow[], outcomeCellStatus)
  return null
}

describe('slice 6 gate 5: reach is derived from the matrix, never hand-written', () => {
  /**
   * FAILS IF: any module's `rolesReaching` stops equalling what its own live
   * matrix admits — including `MOD-DOH-10` and `MOD-DOH-11`, which no gate
   * covered before R2-P04. Verified by planting: swapping SUPERVISOR for
   * WORKER in `MOD-DOH-10`'s entry of the generated file used to survive the
   * whole suite and now reds here.
   */
  it('every module in the spine reaches exactly whom its own live matrix admits', () => {
    expect(UNBOUND_REACH, 'DOH modules this gate binds no live matrix to').toEqual([])
    expect(DOH_MODULES.length).toBeGreaterThan(SLICE_SIX.length)
    for (const registered of DOH_MODULES) {
      const rows = LIVE_MATRIX_BY_ID[registered.id]
      // Non-vacuity, per this file's rule 2: a zero-row matrix would satisfy
      // every comparison below.
      expect(rows?.length ?? 0, `${registered.id} live matrix is empty`).toBeGreaterThan(0)
      const derived = liveReach(rows ?? [])
      expect(derived, `${registered.id} matrix carries no known cell spelling`).not.toBeNull()
      expect([...registered.rolesReaching], `${registered.id} reach`).toEqual([...(derived ?? [])])
      expect(derived?.length ?? 0, `${registered.id} reaches nobody`).toBeGreaterThan(0)
    }
  }, SLOW)

  it('slice six\'s own seven are all in that population and all registered', () => {
    expect(SLICE_SIX.length).toBeGreaterThan(0)
    for (const m of SLICE_SIX) {
      const registered = DOH_MODULES.find((d) => d.id === m.id)
      expect(registered, `${m.id} is enumerated on disk and absent from DOH_MODULES`).toBeDefined()
      expect(LIVE_MATRIX_BY_ID[m.id], `${m.id} live matrix`).toBe(m.rows)
    }
  }, SLOW)

  it('both clauses of the rule move a live slice-6 answer', () => {
    /* CLAUSE TWO — the `Unavailable` withholding token. Removed by mapping
     * it onto a token that neither grants nor withholds, and re-running the
     * ONE implementation over the mutated rows. `MOD-DOH-08` moves: row 2's
     * `Unavailable` on the review queue (L28301) is what keeps the Tenant
     * Admin, the Supervisor and the Worker off the module. */
    const doh08 = SLICE_SIX.find((m) => m.id === 'MOD-DOH-08') as Slice6Module
    const withoutClauseTwo = rolesReachingByMatrix(doh08.rows, (row, role) => {
      const s = cellStatus(row, role)
      return s === 'unavailable' ? 'not-applicable' : s
    })
    expect(rolesReachingByMatrix(doh08.rows, cellStatus)).toEqual(['QUALITY_MANAGER', 'READONLY_AUDITOR'])
    expect([...withoutClauseTwo].sort()).toEqual(
      ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'SUPERVISOR', 'TENANT_ADMIN', 'WORKER'].sort(),
    )

    /* CLAUSE ONE — `surface === 'screen'`. Removed by reclassifying every
     * row onto this screen. `MOD-DOH-15` is the module where the two clauses
     * first disagree: no cell on its card carries `Unavailable`, so clause
     * two can withhold nothing, and its row 3 — approving a clone, which is
     * `MOD-DOH-05` row 4 met on ANOTHER screen — is the only row whose
     * Quality Manager cell holds anything. */
    const doh15 = SLICE_SIX.find((m) => m.id === 'MOD-DOH-15') as Slice6Module
    const withoutClauseOne = rolesReachingByMatrix(
      doh15.rows.map((r) => ({ ...r, surface: 'screen' as const })),
      cellStatus,
    )
    expect(rolesReachingByMatrix(doh15.rows, cellStatus)).toEqual(['TENANT_ADMIN', 'SUPERVISOR'])
    expect([...withoutClauseOne].sort()).toEqual(['QUALITY_MANAGER', 'SUPERVISOR', 'TENANT_ADMIN'])
  }, SLOW)

  it("catalogue B's narrowing is DERIVED, and it is five screens rather than four", () => {
    const narrowings = DOH_CATALOGUE_B_REACH_NARROWER
    expect(narrowings.length).toBeGreaterThan(0)
    const screens = new Set(narrowings.map((n) => n.screenId))
    expect(screens.size, 'the narrowing register no longer covers five screens').toBe(5)
    expect([...screens]).toContain('SCR-DOH-06')
    // Every narrowing resolves to a real screen row, a registered module and
    // real registry role names. A narrowing naming a role the registry does
    // not know is a hand-written rail wearing a derivation's clothes.
    for (const n of narrowings) {
      expect(DOH_SCREENS.some((s) => s.id === n.screenId), n.screenId).toBe(true)
      expect(n.omittedRoles.length, `${n.screenId}/${n.moduleId} omits nobody`).toBeGreaterThan(0)
      for (const name of n.omittedRoles) expect(ROLE_NAMES.has(name), name).toBe(true)
    }
  }, SLOW)

  it('every narrowing is a role the MATRIX admits on that screen row', () => {
    for (const n of DOH_CATALOGUE_B_REACH_NARROWER) {
      const label = /"([^"]+)"$/.exec(n.matrixRef)?.[1]
      expect(label, `no control label in ${n.matrixRef}`).toBeDefined()
      const module = SLICE_SIX.find((m) => m.id === n.moduleId)
      const row = module?.rows.find((r) => r.control === label)
      expect(row, `${n.moduleId} has no row "${label}"`).toBeDefined()
      // The single-row question, through the ONE implementation of the
      // holding rule. If the omitted role were not admitted by the matrix,
      // the "narrowing" would be agreement misreported as a divergence.
      const admitted = rolesReachingByMatrix([row as Slice6Row], cellStatus).map(roleNameOf)
      for (const omitted of n.omittedRoles) expect(admitted, n.matrixRef).toContain(omitted)
    }
  }, SLOW)

  it('PLANT — a matrix cell flipped under the module makes the registry disagree', () => {
    const doh08 = SLICE_SIX.find((m) => m.id === 'MOD-DOH-08') as Slice6Module
    const registered = DOH_MODULES.find((d) => d.id === 'MOD-DOH-08')?.rolesReaching ?? []
    // The plant is in the DATA the rule reads, fed through the real
    // function: the Tenant Admin's `Unavailable` on the review queue becomes
    // a grant, which is exactly the edit that would make a hand-maintained
    // rail and the matrix diverge.
    const planted = rolesReachingByMatrix(doh08.rows, (row, role) =>
      row.id === 'work-the-review-queue' && role === 'TENANT_ADMIN' ? 'allowed' : cellStatus(row, role),
    )
    const red = redOutput(() => expect([...planted]).toEqual([...registered]))
    expect(red).toContain('TENANT_ADMIN')
    expect(planted).toContain('TENANT_ADMIN')
    // …and nothing else moved: the plant proves what it claims to prove.
    expect(planted.filter((r) => r !== 'TENANT_ADMIN')).toEqual([...registered])
  }, SLOW)
})

/* ==================================================================== *
 * GATE 6 — EVERY REGISTERED MODULE'S ENUMERATION IS COMPLETE, AND THE
 * REGISTRY AGREES WITH THE BUILT ROUTE TREE.
 *
 * The enumeration is from the DIRECTORY in both directions: a module
 * directory this file binds no matrix to throws at `slice6Modules()`, and
 * a `DOH_MODULES` entry with a matrix directory that this file does not
 * enumerate fails below. An enumeration finding nothing is red.
 *
 * The route half takes its expectation from a DIFFERENT source than its
 * subject: `app/hub/<slug>/page.tsx` is the claim and
 * `out/hub/<slug>/index.html` is the artefact. A route authored and never
 * exported fails, and so does an exported route nobody authored.
 * ==================================================================== */

const authoredHubRoutes = (): string[] =>
  entriesOf(APP_HUB)
    .filter((e) => statSync(join(APP_HUB, e)).isDirectory())
    .filter((e) => existsSync(join(APP_HUB, e, 'page.tsx')))
    .sort()

const builtHubRoutes = (): string[] => builtHubPages().map((p) => p.slug).sort()

const registeredSlugs = (): string[] => [...new Set(DOH_MODULES.map((m) => m.slug))].sort()

describe('slice 6 gate 6: the enumeration is complete and the registry matches the built tree', () => {
  it('the module enumeration is non-empty and complete against the binding map, the registry and disk', () => {
    const dirs = enumeratedModuleDirs()
    expect(dirs.length, 'SLICE_SIX_IDS enumerated nothing').toBeGreaterThan(0)
    expect(SLICE_SIX.map((m) => m.id)).toEqual(dirs.map(idOfDir))
    // Every slice-6 module is registered…
    for (const m of SLICE_SIX) {
      expect(DOH_MODULES.some((d) => d.id === m.id), `${m.id} is not in DOH_MODULES`).toBe(true)
    }
    // …every one has a matrix directory on disk…
    for (const m of SLICE_SIX) {
      expect(existsSync(join(MODULE_DIR, m.dir)), `${m.id} -> ${m.dir}`).toBe(true)
    }
    // …and the id/matrix binding this file holds covers exactly them, in both
    // directions, so neither a dropped binding nor a binding for a module this
    // file no longer claims can pass.
    expect(Object.keys(MATRIX_BY_ID).sort()).toEqual(dirs.map(idOfDir).sort())
    // WHAT IS DELIBERATELY NOT ASSERTED. There is no count of `DOH_MODULES`
    // here any more, and no claim that every registered module with a matrix
    // directory is one of these seven. Both were true of a fifteen-module
    // registry and neither was this gate's subject: the first went stale the
    // moment slice 10 registered two more modules, and the second is what
    // coupled the enumeration to a sibling slice's directory. The directories
    // on disk may outnumber these seven, and that is not a defect here.
    expect(moduleDirsOnDisk().length).toBeGreaterThanOrEqual(dirs.length)
  }, SLOW)

  it('every enumerated matrix has rows, and no two rows of one matrix share an id', () => {
    let total = 0
    for (const m of SLICE_SIX) {
      expect(m.rows.length, `${m.id} enumerated no rows`).toBeGreaterThan(0)
      // A duplicate id shadows silently in every `dohNNRow(id)` lookup and in
      // this file's own `byKey` de-duplication, so a shadowed row would be
      // dropped from gate 1's subject rather than reported.
      expect(new Set(m.rows.map((r) => r.id)).size, `${m.id} has a duplicate row id`).toBe(m.rows.length)
      total += m.rows.length
    }
    expect(total).toBeGreaterThan(0)
  }, SLOW)

  it('the authored route tree and the built route tree are the same set', () => {
    const authored = authoredHubRoutes()
    const built = builtHubRoutes()
    expect(authored.length, 'app/hub/ has no authored route').toBeGreaterThan(0)
    expect(built.length, 'out/hub/ has no built route').toBeGreaterThan(0)
    expect(built).toEqual(authored)
  }, SLOW)

  it('every registered module slug is authored and built', () => {
    const slugs = registeredSlugs()
    expect(slugs.length).toBeGreaterThan(0)
    const authored = new Set(authoredHubRoutes())
    const built = new Set(builtHubRoutes())
    for (const slug of slugs) {
      expect(authored.has(slug), `app/hub/${slug}/page.tsx is missing`).toBe(true)
      expect(built.has(slug), `out/hub/${slug}/index.html is missing`).toBe(true)
    }
  }, SLOW)

  it('PLANT — a built route nobody authored goes red', () => {
    withPlanted(OUT_HUB, 'index.html', '<html><body><p>probe</p></body></html>', () => {
      expect(builtHubRoutes()).toContain(OWN_PROBE_DIR)
      const red = redOutput(() => expect(builtHubRoutes()).toEqual(authoredHubRoutes()))
      expect(red).toContain('expected')
    })
    // …and the tree is the same set again once the plant is gone.
    expect(builtHubRoutes()).toEqual(authoredHubRoutes())
  }, SLOW)

  it('PLANT — a registered slug whose built page is missing goes red', () => {
    const slug = registeredSlugs()[0] as string
    const file = join(OUT_HUB, slug, 'index.html')
    const before = readFileSync(file)
    const beforeHash = sha(file)
    try {
      rmSync(file)
      const red = redOutput(() =>
        expect(new Set(builtHubRoutes()).has(slug), `out/hub/${slug}/index.html is missing`).toBe(true),
      )
      expect(red).toContain(`out/hub/${slug}/index.html is missing`)
    } finally {
      writeFileSync(file, before)
    }
    expect(sha(file)).toBe(beforeHash)
    expect(builtHubRoutes()).toContain(slug)
  }, SLOW)
})

/* ==================================================================== *
 * GATE 7 — THE TIE RULE, BOTH HALVES.
 *
 * `scripts/build-registries.mjs` infers route ownership by counting
 * `MOD-*` mentions inside a route directory. Mounting a component from one
 * module inside another module's screen — which the source REQUIRES, since
 * it places `MOD-DOH-15` inside `SCR-DOH-11` with no route of its own —
 * moves that count by one, and it threw on task 10's mount. The rule that
 * settled it has two halves and both are gated here, because a rule with
 * one half tested is a rule that can be loosened without anyone noticing:
 *
 *   A. a mention tie on a route NO module claims by slug still REFUSES;
 *   B. a mention tie on a route a module claims by slug does NOT.
 *
 * THE GATE DRIVES THE REAL GENERATOR, in a subprocess, over the real tree.
 * A re-implementation of the tie arithmetic here would pass whatever this
 * file believed rather than whatever the build does. The plant is a single
 * dot-prefixed `.tsx` file inside an EXISTING route directory — never a new
 * route directory, which `next build` and `tsc` would both pick up — and
 * `registries/generated` is hashed before and after so a plant that
 * left the tree changed is a failure of this gate rather than a surprise
 * three commits later.
 * ==================================================================== */

const GENERATED = join(ROOT, 'registries', 'generated')
const MOD_TOKEN = /MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g

function generatedTreeHash(): string {
  const h = createHash('sha256')
  for (const file of walk(GENERATED).sort()) h.update(file).update(readFileSync(file))
  return h.digest('hex')
}

/** Mention counts in ONE route directory, by the generator's own token shape.
 *  Used to SIZE a plant, never to decide anything the generator decides. */
function mentionCounts(dir: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const entry of entriesOf(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory() || !/\.tsx?$/.test(entry)) continue
    for (const id of readFileSync(p, 'utf8').match(MOD_TOKEN) ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * THE GENERATOR, WITH ITS OUTPUT REDIRECTED — never into
 * `registries/generated`.
 *
 * A first version of this gate ran the generator plainly and restored the
 * committed artefacts by re-running it clean afterwards. That reds
 * `registry-freshness.test.ts`'s standing rule "every generator invocation
 * in a test redirects its output", and the rule is right: a test that
 * rewrites the artefacts another gate checks makes the two agree by
 * construction, and a restore that runs AFTER a crash is a restore that
 * does not run. `AVIIXA_REGISTRY_OUT` is the generators' own escape hatch;
 * with it the committed tree is never written at all, which is why the last
 * case below can assert it byte for byte rather than hope.
 */
function runGenerator(): { code: number; stderr: string } {
  const scratch = mkdtempSync(join(tmpdir(), 'aviixa-slice06-tie-'))
  try {
    execFileSync('node', ['scripts/build-registries.mjs'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, AVIIXA_REGISTRY_OUT: scratch },
    })
    return { code: 0, stderr: '' }
  } catch (err) {
    const e = err as { status?: number; stderr?: string }
    return { code: e.status ?? 1, stderr: String(e.stderr ?? '') }
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

/** A tie plant: two module ids this directory does not mention, each one
 *  mention above its current leader, so the top of the ranking is a tie. */
function withTiePlantedIn(routeDir: string, assertCaught: (probe: string) => void): void {
  const dir = join(APP_HUB, routeDir)
  const counts = mentionCounts(dir)
  const top = Math.max(0, ...counts.values())
  const spare = DOH_MODULES.map((m) => m.id).filter((id) => !counts.has(id))
  expect(spare.length, `no unmentioned module id to build a tie in ${routeDir}`).toBeGreaterThan(1)
  const body = spare
    .slice(0, 2)
    .map((id, i) => `export const ZZ_TIE_${i} = '${Array(top + 1).fill(id).join(' ')}'\n`)
    .join('')
  const probe = join(dir, `${OWN_PROBE_DIR}.tsx`)
  try {
    writeFileSync(probe, body)
    assertCaught(probe)
  } finally {
    rmSync(probe, { force: true })
  }
}

const REGISTRIES_BEFORE = generatedTreeHash()

describe('slice 6 gate 7: the tie rule refuses on an unclaimed route and not on a claimed one', () => {
  it('there is an unclaimed route and a claimed route to drive the rule on', () => {
    const authored = authoredHubRoutes()
    const slugs = new Set(registeredSlugs())
    expect(authored.filter((r) => !slugs.has(r)).length, 'every Hub route is slug-claimed').toBeGreaterThan(0)
    expect(authored.filter((r) => slugs.has(r)).length, 'no Hub route is slug-claimed').toBeGreaterThan(0)
    expect(REGISTRIES_BEFORE).toHaveLength(64)
    // The generator agrees with the tree it is about to be driven over.
    expect(runGenerator().code).toBe(0)
  }, GENERATOR_BUDGET)

  it('PLANT — a mention tie on an UNCLAIMED route refuses the build', () => {
    const slugs = new Set(registeredSlugs())
    const unclaimed = authoredHubRoutes().find((r) => !slugs.has(r)) as string
    withTiePlantedIn(unclaimed, () => {
      const result = runGenerator()
      expect(result.code, `the generator accepted a tie on the unclaimed route ${unclaimed}`).not.toBe(0)
      expect(result.stderr).toContain('Ambiguous module ownership')
      expect(result.stderr).toContain(unclaimed)
    })
  }, GENERATOR_BUDGET)

  it('PLANT — the same tie on a SLUG-CLAIMED route does not refuse', () => {
    const claimed = registeredSlugs().find((s) => authoredHubRoutes().includes(s)) as string
    withTiePlantedIn(claimed, () => {
      /* NON-VACUITY, AND THIS HALF NEEDS IT MORE THAN THE OTHER. "Exit 0"
       * is what a plant that produced NO TIE AT ALL would also report, so
       * the tie is measured in the directory before the exit code is read.
       * The same construction refuses one test above, on a route no module
       * claims — which is the two halves being the same plant against two
       * different route kinds rather than two different plants. */
      const ranked = [...mentionCounts(join(APP_HUB, claimed)).entries()].sort((a, b) => b[1] - a[1])
      expect(ranked.length).toBeGreaterThan(1)
      expect(ranked[0]?.[1], `no tie was planted in ${claimed}`).toBe(ranked[1]?.[1])
      const result = runGenerator()
      expect(result.code, `the generator refused a tie on the slug-claimed route ${claimed}: ${result.stderr}`).toBe(0)
    })
  }, GENERATOR_BUDGET)

  it('registries/generated was never written — the plants ran with the output redirected', () => {
    expect(generatedTreeHash()).toBe(REGISTRIES_BEFORE)
  }, SLOW)
})

/* ==================================================================== *
 * GATE 8 — WHAT THE SLICE DISCLOSED ACTUALLY RENDERS.
 *
 * ADDED BEYOND THE BRIEF'S LIST, and the reason is a defect this slice
 * recorded twice: a disclosure that exists in the data and renders nowhere
 * is the FALSE-COMFORT case — the record says it was disclosed and the
 * client never saw it. `DEC_FINISH_001.onScreen` sat unmounted for a whole
 * wave; `DEC-STUCK-001` is behind a branch the built tree does not reach
 * (gate 2). Nothing in the tree asks the question of the contradiction
 * records at all.
 *
 * The subject is DERIVED from the records themselves — every reading of
 * every recorded contradiction, and the deferral ruling with the two
 * readings it did NOT adopt — so a third contradiction is under gate the
 * day it is written rather than the day somebody remembers to add it.
 * ==================================================================== */

interface Disclosure {
  readonly id: string
  readonly part: string
  readonly text: string
}

function requiredDisclosures(): Disclosure[] {
  const out: Disclosure[] = []
  for (const c of DOH_08_CONTRADICTIONS) {
    out.push({ id: c.id, part: 'question', text: c.question })
    out.push({ id: c.id, part: 'commonToBoth', text: c.commonToBoth })
    out.push({ id: c.id, part: 'position', text: c.position })
    c.readings.forEach((r, i) => out.push({ id: c.id, part: `reading ${i + 1}`, text: r.text }))
  }
  out.push({ id: DOH_CATALOGUE_AB_SWAP.id, part: 'statement', text: DOH_CATALOGUE_AB_SWAP.statement })
  out.push({ id: DEFERRAL_RENDERING.id, part: 'ruling', text: DEFERRAL_RENDERING.ruling })
  out.push({
    id: DEFERRAL_RENDERING.id,
    part: 'adopted reading',
    text: DEFERRAL_RENDERING.adoptedReading.text,
  })
  DEFERRAL_RENDERING.notAdopted.forEach((r, i) =>
    out.push({ id: DEFERRAL_RENDERING.id, part: `not adopted ${i + 1}`, text: r.text }),
  )
  return out
}

function disclosuresRenderingNowhere(pages: readonly BuiltPage[]): string[] {
  return requiredDisclosures()
    .filter((d) => !pages.some((p) => p.text.includes(norm(d.text))))
    .map((d) => `${d.id} — ${d.part} renders on no built Hub page`)
}

describe('slice 6 gate 8: every recorded contradiction and ruling renders somewhere', () => {
  it('the disclosure set and the page set are both non-empty', () => {
    expect(cleanPages().length).toBeGreaterThan(0)
    const required = requiredDisclosures()
    expect(required.length).toBeGreaterThan(10)
    for (const d of required) expect(d.text.trim().length, `${d.id} ${d.part} is blank`).toBeGreaterThan(20)
  }, SLOW)

  it('no recorded contradiction or ruling renders nowhere', () => {
    expect(disclosuresRenderingNowhere(cleanPages())).toEqual([])
  }, SLOW)

  it('PLANT — eliding ONE reading from the built page goes red, and only that one', () => {
    const target = requiredDisclosures().find(
      (d) => d.id === 'CONTRADICTION-LOT-RELEASE-SURFACE' && d.part === 'commonToBoth',
    ) as Disclosure
    const page = cleanPages().find((p) => p.text.includes(norm(target.text)))
    expect(page, 'the lot-hold disclosure is not on the page this plant means to edit').toBeDefined()
    withMutatedFile(
      page?.file as string,
      (before) => before.replace('The authority is identical under every reading', 'ELIDED'),
      () => {
        const red = redOutput(() => expect(disclosuresRenderingNowhere(builtHubPages())).toEqual([]))
        expect(red).toContain('CONTRADICTION-LOT-RELEASE-SURFACE — commonToBoth')
        // ONLY that one moved.
        expect(disclosuresRenderingNowhere(builtHubPages())).toEqual([
          'CONTRADICTION-LOT-RELEASE-SURFACE — commonToBoth renders on no built Hub page',
        ])
      },
    )
  }, SLOW)
})

/* ==================================================================== *
 * GATE 9 — THE TWO BANS THIS SLICE'S SOURCE MAKES, ASKED OF THE WHOLE
 * SURFACE.
 *
 * ADDED BEYOND THE BRIEF'S LIST, for two reasons the slice recorded:
 *
 * 1. THE THREE-DIGIT `SCR-DOH-NNN` LITERAL. Catalogue A and catalogue B
 *    give DIFFERENT screens the same trailing digits — B's `SCR-DOH-23` is
 *    the tenant administration area and A's `SCR-DOH-023` is Platform
 *    Access History — and this slice ships both catalogues plus a
 *    documented SWAP on 16/17. A slice-4 gate bans the literal under
 *    `app/hub/` only; the slice-6 modules live under `src/`, and the built
 *    pages are where a reader would meet one.
 *
 * 2. THE BLANK CELL. L10238: "a blank cell is an unanswered question that
 *    an implementer will answer privately and inconsistently", and
 *    `DohControlMatrixRow` makes `detail` required per cell and per role.
 *    The check is written as a LENGTH assertion rather than as
 *    `expect(detail).toContain('')`, which is the vacuity this slice
 *    shipped once already — `toContain('')` is true of every string ever
 *    written, and it was written by an agent who had been warned about it.
 *    The case below proves the distinction rather than describing it.
 * ==================================================================== */

const THREE_DIGIT_SCR = /SCR-DOH-\d{3}/

function threeDigitScrLiterals(files: readonly string[]): string[] {
  const offenders: string[] = []
  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    if (!THREE_DIGIT_SCR.test(raw)) continue
    if (THREE_DIGIT_SCR.test(stripComments(raw))) offenders.push(file)
  }
  return offenders
}

function blankMatrixCells(modules: readonly Slice6Module[]): string[] {
  const offenders: string[] = []
  for (const m of modules) {
    for (const row of m.rows) {
      for (const role of TENANT_ROLES) {
        const detail = row.detail[role]
        if (typeof detail === 'string' && detail.trim().length > 0) continue
        offenders.push(`${m.id} \`${row.id}\` ${role}: blank cell`)
      }
    }
  }
  return offenders
}

describe('slice 6 gate 9: no three-digit screen literal, and no blank matrix cell', () => {
  it('no three-digit SCR-DOH literal in authored source outside a comment', () => {
    const files = sourceFilesUnder([SRC, join(ROOT, 'app')])
    expect(files.length).toBeGreaterThan(100)
    expect(threeDigitScrLiterals(files)).toEqual([])
  }, SLOW)

  it('no three-digit SCR-DOH literal renders on any built Hub page', () => {
    const pages = cleanPages()
    expect(pages.length).toBeGreaterThan(0)
    // Detector-fires proof: the TWO-digit form does render, so a zero on the
    // three-digit form is a real zero and not a regex that matches nothing.
    expect(pages.filter((p) => /SCR-DOH-\d{2}/.test(p.text)).length).toBeGreaterThan(0)
    expect(pages.filter((p) => THREE_DIGIT_SCR.test(p.text)).map((p) => p.slug)).toEqual([])
  }, SLOW)

  it('every slice-6 matrix cell carries a reason, and the check is not the vacuous one', () => {
    const cells = SLICE_SIX.flatMap((m) => m.rows.flatMap((r) => TENANT_ROLES.map((role) => r.detail[role])))
    expect(cells.length).toBe(SLICE_SIX.reduce((n, m) => n + m.rows.length * 5, 0))
    expect(cells.length).toBeGreaterThan(0)
    expect(blankMatrixCells(SLICE_SIX)).toEqual([])
    // THE VACUITY, DEMONSTRATED. `toContain('')` passes on the empty string,
    // which is exactly the cell this gate exists to refuse.
    expect(''.includes('')).toBe(true)
    const sample = SLICE_SIX[0]?.rows[0] as Slice6Row
    const blanked: Slice6Row = { ...sample, detail: { ...sample.detail, WORKER: '  ' } }
    expect(blankMatrixCells([{ id: 'PROBE', dir: 'probe', rows: [blanked] }])).toEqual([
      `PROBE \`${sample.id}\` WORKER: blank cell`,
    ])
  }, SLOW)

  it('PLANT — a three-digit SCR-DOH literal in src/ goes red, and in a comment stays green', () => {
    withPlanted(SRC, 'probe.ts', "export const S = 'SCR-DOH-024'\n", (probe) => {
      const red = redOutput(() =>
        expect(threeDigitScrLiterals(sourceFilesUnder([SRC, join(ROOT, 'app')]))).toEqual([]),
      )
      expect(red).toContain(probe)
    })
    withPlanted(SRC, 'probe.ts', '// catalogue A calls it SCR-DOH-024\nexport const X = 1\n', () => {
      expect(threeDigitScrLiterals(sourceFilesUnder([SRC, join(ROOT, 'app')]))).toEqual([])
    })
  }, SLOW)

  it('PLANT — a three-digit SCR-DOH literal on a built page goes red', () => {
    withPlanted(OUT_HUB, 'index.html', '<html><body><p>SCR-DOH-024</p></body></html>', () => {
      const red = redOutput(() =>
        expect(builtHubPages().filter((p) => THREE_DIGIT_SCR.test(p.text)).map((p) => p.slug)).toEqual([]),
      )
      expect(red).toContain(OWN_PROBE_DIR)
    })
  }, SLOW)
})

/* ==================================================================== *
 * ONE TENANT, SEVERAL VOCABULARIES — recorded here because nothing else
 * can see it.
 * ==================================================================== */

/**
 * THE DRIFT IS INVISIBLE INSIDE ANY ONE MODULE AND ONLY APPEARS WHEN A
 * JOURNEY COMPOSES FIVE OF THEM. Every module's own fixtures are internally
 * consistent, so every module's own suite is green, and `/hub/journey/`
 * renders five of those fixtures whole — which is where one reader meets
 * three different names for the same kind of thing.
 *
 * THIS GATE FIXES NOTHING AND IS NOT MEANT TO. Unifying the Area vocabulary
 * means editing the seeded fixtures of six modules and re-pinning every suite
 * that reads them, most of which live outside any one task's files; the
 * hand-off report that first recorded this said "no task owns making them
 * line up", and that is still true. What was missing was not a fix but a
 * DETECTOR: the divergence was carried in prose in one module's debt note
 * (`LOCATION_SCOPE_DEBT` in `doh-06/fixtures`) and nowhere a run could fail.
 * Recorded drift that no check can see is drift that grows.
 *
 * COMPARED FOR EQUALITY IN BOTH DIRECTIONS, like the other pins in this file:
 * red when a NEW lead appears, and red when one is unified away and its row
 * is not deleted. An exception that cannot outlive its defect cannot rot.
 */

/** Every `AREA-…` id this surface seeds, from `app/hub/` and `src/surfaces/doh/`. */
function seededAreaIds(): string[] {
  const files = sourceFilesUnder([join(ROOT, 'app', 'hub'), join(SRC, 'surfaces', 'doh')])
  const found = new Set<string>()
  for (const file of files) {
    // Comments are stripped first: several of these ids appear in prose
    // EXPLAINING the divergence, and a detector that counted its own
    // documentation would be reporting itself.
    for (const m of stripComments(readFileSync(file, 'utf8')).matchAll(/AREA-[A-Z0-9]+(?:-[A-Z0-9]+)*/g)) {
      found.add(m[0])
    }
  }
  return [...found].sort()
}

/** The segment an Area id LEADS with — a place, an ordinal, or a function. */
const areaLead = (id: string): string => id.slice('AREA-'.length).split('-')[0] ?? ''

describe('one canonical tenant, several Area-id vocabularies', () => {
  /**
   * THE COUNT IN THE HAND-OFF REPORT WAS THREE AND IT IS NOT THREE. That
   * report named `AREA-ARD-ASSY`, `AREA-ASSY-A` and `AREA-RIVERSIDE-ASSY`
   * across five modules. Measured over both trees there are more, and they
   * differ by CATEGORY rather than by spelling: some ids lead with a PLACE
   * (a site code, or a site's full name), one leads with an ORDINAL, and the
   * rest lead with the FUNCTION performed there — except one, which leads
   * with neither and is minted at run time (see the `NEW` note below). That
   * is the incompatibility: not that the names differ, but that they are not
   * the same KIND of name, so no rule sorts, groups or matches them together.
   */
  const PLACE_LEADS = ['ARD', 'NORTHGATE', 'RIVERSIDE'] as const
  const ORDINAL_LEAD = /^\d+$/

  it('leads Area ids with a place, an ordinal or a function, and does all three', () => {
    const ids = seededAreaIds()
    // Non-vacuity first: a regex that matched nothing would make every
    // partition below trivially equal to an empty list.
    expect(ids.length).toBeGreaterThan(8)

    const leads = [...new Set(ids.map(areaLead))].sort()
    const places = leads.filter((l) => (PLACE_LEADS as readonly string[]).includes(l))
    const ordinals = leads.filter((l) => ORDINAL_LEAD.test(l))
    const functions = leads.filter(
      (l) => !(PLACE_LEADS as readonly string[]).includes(l) && !ORDINAL_LEAD.test(l),
    )

    // EQUALITY, so a fourth kind of lead — or the retirement of one of these
    // three — is red rather than silent.
    expect(places).toEqual(['ARD', 'NORTHGATE', 'RIVERSIDE'])
    expect(ordinals).toEqual(['001'])
    // `NEW` is not a function and not a place — it is the lead the Area
    // CREATION control mints at
    // `app/hub/location-configuration/LocationConfigurationScreen.tsx:1019`,
    // ``AREA-NEW-${current.length + 1}``. This gate found it; neither
    // hand-off report names it. It is the worst member of the set, because
    // every other lead here is a seeded fixture a reviewer only reads,
    // while this one is minted by a control a reviewer can press — so the
    // build does not merely SHIP several vocabularies, it GROWS one more at
    // run time, in a scheme no module reads.
    expect(functions).toEqual(['ASSY', 'BAY', 'NEW', 'PAINT'])

    // And the finding itself, stated as the assertion: all three kinds are
    // present at once. The day this build settles on one, this line is what
    // goes red and sends a reader to delete this whole block.
    expect(
      [places.length > 0, ordinals.length > 0, functions.length > 0].filter(Boolean).length,
      'the Area vocabulary has been unified — delete this block rather than relax it',
    ).toBe(3)
  }, SLOW)

  /**
   * THE SAME SHAPE, ON THE CLOCK, and the hand-off count was off here too. It
   * read "four different fixture clocks", counting FILES. There are three
   * distinct TIME BASES: one derived from the build's own
   * `CANONICAL_EPOCH_MS`, one declared independently in August 2026 by two
   * separate files that happen to land in the same week, and one module that
   * carries no instant at all. Two files agreeing by coincidence is not one
   * clock — nothing makes them move together — which is exactly why the
   * distinction is worth a check.
   */
  it('sits one module fixture on the canonical epoch and lets the rest declare their own', () => {
    const files = sourceFilesUnder([join(ROOT, 'app', 'hub'), join(SRC, 'surfaces', 'doh')])
    const rel = (f: string) => f.slice(ROOT.length + 1)

    const canonical = files.filter((f) => /CANONICAL_EPOCH_MS/.test(stripComments(readFileSync(f, 'utf8'))))
    const ownInstant = files.filter((f) => {
      const code = stripComments(readFileSync(f, 'utf8'))
      return /Date\.UTC\(/.test(code) && !/CANONICAL_EPOCH_MS/.test(code)
    })

    expect(canonical.map(rel)).toEqual(['src/surfaces/doh/modules/doh-06/fixtures.ts'])
    expect(ownInstant.map(rel).sort()).toEqual([
      'app/hub/execution-summary-review/fixtures.ts',
      'app/hub/journey/fixture.ts',
    ])
    // `@/domain/clock` really does publish the shared epoch, so "only one
    // fixture uses it" is a choice this build made rather than a facility it
    // lacks. Without this line the assertion above could pass on a build with
    // no canonical clock at all.
    expect(readFileSync(join(SRC, 'domain', 'clock.ts'), 'utf8')).toContain(
      'export const CANONICAL_EPOCH_MS',
    )
  }, SLOW)
})

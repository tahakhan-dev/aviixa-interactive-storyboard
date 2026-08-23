import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'
import { stripComments } from './strip-comments'
import { isForeignProbe as isForeign, ownProbeDir, withPlanted } from '../probe-paths'
import { namesPersonBehaviouralMeasure } from './person-measure-keys'
import {
  DOH_MODULES,
  DOH_OUT_OF_SLICE_MODULES,
  type DohModuleId,
  type MatrixRowSurface,
} from '@/surfaces/doh/modules'
import { WriteControl } from '@/ui/WriteControl'
import { decide, deny, isRefusal, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import { tenantId } from '@/domain/ids'
import {
  ACCESS_CONDITIONS,
  EVALUATION_ORDER,
  type AccessCondition,
} from '@/surfaces/doh/access-conditions'

import { CONTROL_MATRIX as DEVICES_MATRIX } from '../../app/hub/devices/fixtures'
import { CONTROL_MATRIX as SSO_MATRIX } from '../../app/hub/integration-surface/fixtures'
import {
  CONTROL_MATRIX as LOCATIONS_MATRIX,
  visibleSiteIds,
  visibleAreaIds,
} from '../../app/hub/location-configuration/fixtures'
import {
  PERMISSION_MATRIX,
  fixtureContext,
  refusalScenario,
} from '../../app/hub/permissions-roles-and-access/fixtures'
import {
  CONTROL_MATRIX as CALENDAR_MATRIX,
  calendarAreaIdsFor,
  calendarAreasFor,
  calendarEntriesFor,
} from '../../app/hub/qualification-calendar/fixtures'
import {
  CONTROL_MATRIX as SHIFTS_MATRIX,
  shiftsVisibleTo,
  DOH_SHIFTS,
} from '../../app/hub/shift-management/fixtures'
import { CONTROL_MATRIX as TENANT_MATRIX } from '../../app/hub/tenant-lifecycle-and-tier-operations/fixtures'
import { CONTROL_MATRIX as PLATFORM_MATRIX } from '../../app/hub/tenant-view-of-platform-administration/fixtures'
import {
  CONTROL_MATRIX as WORKERS_MATRIX,
  workersVisibleTo,
  clearancesVisibleTo,
  selectableAreas,
  DOH_WORKERS,
  DOH_QUALIFICATIONS,
  DOH_CLEARANCES,
} from '../../app/hub/worker-lifecycle-and-qualifications/fixtures'

/* ==================================================================== *
 * Slice 4 gates — SURF-DOH, the Delivery Operations Hub.
 *
 * Ten tasks of independent review produced six gate candidates, and every
 * one of them exists because THIS slice shipped the defect it catches.
 * Each gate below carries the defect in its own comment.
 *
 * THE STANDARD, inherited from slice 3 and from this slice's own record:
 * a gate that cannot fail is worse than no gate. This slice shipped four
 * of those — an honesty guard whose regex scanned a whole document so a
 * planted violation passed; a subset assertion that would pass on an empty
 * set; a pointer test that iterated an array and so could not notice a
 * MISSING element; and a helper scoped to exclude the defect it named. So
 * every gate here is proved able to fail, and where the claim is about
 * what RENDERS it reads the built artefact rather than the source.
 * ==================================================================== */

const HUB_ROOT = join('app', 'hub')
const OUT_HUB = join('out', 'hub')
const APP_HUB = join(process.cwd(), 'app', 'hub')

/**
 * This process's own scratch-probe directory name, and the exclusion that
 * makes each process blind to every probe but its own.
 *
 * Carried verbatim in shape from `slice-03-gates.test.ts`, where the race
 * was reproduced directly: two `pnpm test:release` processes collided on one
 * literal probe path, and one process's `finally` deleted the probe out from
 * under the other's scan (observed as ENOENT, as an empty-string assertion
 * failure, and as 5s timeouts). A pid makes the paths distinct; the
 * exclusion below makes one process's WALK unable to see the other's probe
 * at all, which removes the race rather than narrowing its window.
 *
 * Dot-prefixed, not merely pid-suffixed: `tsc`'s `include` glob does not
 * descend into a path segment starting with `.`, and Next's app router does
 * not treat one as a route segment — so a concurrent `pnpm typecheck` or
 * `next build` can never observe a probe mid-lifetime and fail on a path
 * that no longer exists by the time it reports.
 *
 * Exact match, not a prefix: matching anything merely STARTING WITH
 * `zz-probe` also matches a FILE so named at any depth, which would be a
 * safety gate walkable past by choosing a filename.
 *
 * THE OPTIONAL MIDDLE GROUP IS A CORRECTION, not decoration. `/^\.zz-probe-
 * \d+$/` recognised only the `<pid>` shape, and gate 6 walks all of `src/`
 * as well as `app/` — so it did NOT recognise
 * `tests/component/stu-shell.test.tsx`'s `.zz-probe-stu-reach-<pid>` and lost
 * exactly the race this exclusion exists to remove: reproduced with two
 * concurrent runs as `ENOENT: ... open
 * 'src/studio/.zz-probe-stu-reach-48498/probe.ts'` in "the End-session
 * control has exactly ONE construction site". A fix that reached one probe
 * shape and not the other. The dot and the trailing pid are still both
 * required, so `zz-probe.tsx` and `zz-probeHelpers.tsx` still match nothing.
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

/** Directory entries of `dir`, with every OTHER process's probe hidden. */
const entriesOf = (dir: string): string[] => readdirSync(dir).filter((e) => !isForeignProbe(e))

/**
 * Every authored SURF-DOH Hub source file, ENUMERATED FROM THE DIRECTORY.
 *
 * The enumeration is the point — see gate 3. Nothing here is a hand-written
 * file list, so a module that grows a tenth file grows no blind spot.
 */
function hubSources(): { file: string; src: string }[] {
  return walk(HUB_ROOT)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => ({ file: f, src: stripComments(readFileSync(f, 'utf8')) }))
}

const PROBE_ROOTS = [HUB_ROOT, OUT_HUB, ...DOH_MODULES.map((m) => join(HUB_ROOT, m.slug))]

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
 * The nine Hub routes, and their nine permission matrices normalised.
 *
 * THREE SHAPES, not one. `{status: Record<Role, kebab>, detail: Record<Role,
 * string>}`, `{byRole: Record<Role, {status: TitleCase, detail}>}` and
 * `{cells: Record<Role, {outcome: camelCase, cause}>}` all ship in this
 * slice. Normalising once here is what lets gates 1 and 4 ask one question
 * of all nine rather than nine questions — and a tenth shape lands as an
 * UNMAPPED status, which gate 1 fails on rather than silently skipping.
 *
 * REVIEW CORRECTION. This comment used to claim "four of the nine carry no
 * per-cell reason at all", and gate 1 repeated it as a recorded finding.
 * The finding does not exist. All four of the matrices it meant — devices,
 * location-configuration, shift-management, worker-lifecycle — are
 * `DohControlMatrixRow`s, and that interface makes `detail` REQUIRED per
 * cell and per role (`src/surfaces/doh/modules.ts`: "Per cell, per role,
 * never blank"). `normaliseRow` reads it, so all nine carry a per-cell
 * reason and the gate is strictly stronger than the sentence describing it.
 * The `?? null` fallback below is kept for a shape that has none, not for
 * one of today's nine.
 * -------------------------------------------------------------------- */

const TENANT_ROLE_IDS = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const
type TenantRoleId = (typeof TENANT_ROLE_IDS)[number]

/** The closed set every cell status normalises onto. */
const CELL_STATUSES = [
  'Allowed',
  'AllowedWithConditions',
  'ReadOnly',
  'Unavailable',
  'ExplicitlyProhibited',
  'NotApplicable',
  'ClientDecisionRequired',
] as const
type CellStatus = (typeof CELL_STATUSES)[number]

const STATUS_ALIASES: Readonly<Record<string, CellStatus>> = {
  // kebab-case — six modules
  allowed: 'Allowed',
  'allowed-with-conditions': 'AllowedWithConditions',
  'read-only': 'ReadOnly',
  unavailable: 'Unavailable',
  'explicitly-prohibited': 'ExplicitlyProhibited',
  'not-applicable': 'NotApplicable',
  // Title Case — MOD-DOH-01 and MOD-DOH-12
  Allowed: 'Allowed',
  'Allowed with conditions': 'AllowedWithConditions',
  'Read-only': 'ReadOnly',
  Unavailable: 'Unavailable',
  'Explicitly prohibited': 'ExplicitlyProhibited',
  'Not applicable': 'NotApplicable',
  // `PermissionOutcome` — MOD-DOH-09 keys its cells on the policy union
  allowedWithConditions: 'AllowedWithConditions',
  readOnly: 'ReadOnly',
  cachedReadOnlyOffline: 'ReadOnly',
  queuedOffline: 'Allowed',
  explicitlyProhibited: 'ExplicitlyProhibited',
  notApplicable: 'NotApplicable',
  clientDecisionRequired: 'ClientDecisionRequired',
}

/**
 * A role HOLDS a capability when the cell permits it to read or to act.
 * Everything else is a refusal or a non-existence, whichever way the
 * contested rendering question eventually settles — this partition is on
 * the ground BOTH readings share, which is why gates 1 and 4 can use it.
 */
const HOLDS: ReadonlySet<CellStatus> = new Set<CellStatus>(['Allowed', 'AllowedWithConditions', 'ReadOnly'])
/** Not `Allowed` and not `Allowed with conditions` — the adjudication's own line. */
const REFUSING: ReadonlySet<CellStatus> = new Set<CellStatus>([
  'ReadOnly',
  'Unavailable',
  'ExplicitlyProhibited',
  'NotApplicable',
  'ClientDecisionRequired',
])

interface NormalisedCell {
  readonly role: TenantRoleId
  readonly status: CellStatus
  /** The per-cell reason, or `null` where the fixture carries only a row-level one. */
  readonly reason: string | null
  readonly rawStatus: string
}

interface NormalisedRow {
  readonly id: string
  readonly label: string
  /**
   * WHERE THIS ROW'S CAPABILITY IS MET — `screen`, `chrome` or
   * `another-surface`, carried straight off the fixture.
   *
   * REVIEW CORRECTION, and it is why gate 4 shrank. `normaliseRow` used to
   * DROP this field. Gate 4's premise is that `rolesReaching` is derived
   * from the literal `Unavailable` token and so cannot ask a meaning
   * question — but the production derivation, `rolesReachingByMatrix`,
   * filters `row.surface === 'screen'` FIRST and only then reads the token.
   * The gate, computing over chrome and another-surface rows too, was
   * asking a DIFFERENT and wider question than the code it audits, then
   * whitelisting the difference it had manufactured. Two of its three
   * pinned exceptions were its own artefacts: every row they named is
   * `surface: 'chrome'`, as the exceptions' own `why` strings said.
   */
  readonly surface: MatrixRowSurface
  /** Row-level prose describing how the row renders. Never blank (L10238). */
  readonly rowReason: string
  readonly cells: readonly NormalisedCell[]
}

interface HubModuleUnderGate {
  readonly slug: string
  /** `null` for the device screen, which is uncatalogued and claims no module (D4, D5). */
  readonly moduleId: DohModuleId | null
  readonly rows: readonly NormalisedRow[]
}

type RawRow = Record<string, unknown>

function normaliseRow(raw: RawRow): NormalisedRow {
  const byRole = raw.byRole as Record<string, { status: string; detail: string }> | undefined
  const cellsField = raw.cells as Record<string, { outcome: string; cause: string }> | undefined
  const statusField = raw.status as Record<string, string> | undefined
  const detailField = raw.detail as Record<string, string> | undefined

  const cells = TENANT_ROLE_IDS.map((role): NormalisedCell => {
    const rawStatus =
      byRole !== undefined
        ? byRole[role]!.status
        : cellsField !== undefined
          ? cellsField[role]!.outcome
          : statusField![role]!
    const reason =
      byRole !== undefined
        ? byRole[role]!.detail
        : cellsField !== undefined
          ? cellsField[role]!.cause
          : (detailField?.[role] ?? null)
    // An unmapped status is a NEW shape, and it fails loudly here rather
    // than normalising to `undefined` and quietly satisfying every gate.
    const status = STATUS_ALIASES[rawStatus]
    if (status === undefined) throw new Error(`Unmapped matrix status: ${JSON.stringify(rawStatus)}`)
    return { role, status, reason, rawStatus }
  })

  // Not defaulted. A row shape that carries no `surface` is a shape this
  // normaliser has not been taught, and gate 4 filters on this field --
  // quietly calling an unknown row a screen row is how the gate ended up
  // asking a wider question than the code it audits in the first place.
  const surface = raw.surface as MatrixRowSurface | undefined
  if (surface === undefined) throw new Error(`Matrix row ${String(raw.id)} carries no surface`)

  return {
    id: String(raw.id),
    label: String(raw.control ?? raw.label),
    surface,
    rowReason: String(raw.rendering ?? raw.note ?? ''),
    cells,
  }
}

const HUB_MODULES_UNDER_GATE: readonly HubModuleUnderGate[] = [
  { slug: 'devices', moduleId: null, rows: (DEVICES_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'integration-surface', moduleId: 'MOD-DOH-12', rows: (SSO_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'location-configuration', moduleId: 'MOD-DOH-02', rows: (LOCATIONS_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'permissions-roles-and-access', moduleId: 'MOD-DOH-09', rows: (PERMISSION_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'qualification-calendar', moduleId: 'MOD-DOH-14', rows: (CALENDAR_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'shift-management', moduleId: 'MOD-DOH-03', rows: (SHIFTS_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'tenant-lifecycle-and-tier-operations', moduleId: 'MOD-DOH-01', rows: (TENANT_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'tenant-view-of-platform-administration', moduleId: 'MOD-DOH-13', rows: (PLATFORM_MATRIX as readonly RawRow[]).map(normaliseRow) },
  { slug: 'worker-lifecycle-and-qualifications', moduleId: 'MOD-DOH-04', rows: (WORKERS_MATRIX as readonly RawRow[]).map(normaliseRow) },
]

/** Rows no role holds in any way — the unanimous ground of gate 1. */
function heldByNobody(): { slug: string; label: string; rowId: string }[] {
  return HUB_MODULES_UNDER_GATE.flatMap((m) =>
    m.rows
      .filter((r) => !r.cells.some((c) => HOLDS.has(c.status)))
      .map((r) => ({ slug: m.slug, label: r.label, rowId: r.id })),
  )
}

/* -------------------------------------------------------------------- *
 * The built artefact. Every claim about what RENDERS is read from
 * `out/hub/**`, never from the source that hopes to produce it — two
 * screens in slice 3 shipped a disclosure stranded after the component's
 * closing brace: dead top-level JSX that typechecked, linted and rendered
 * nothing, and a source-reading gate called it present.
 * -------------------------------------------------------------------- */

/**
 * How many Hub routes there SHOULD be, counted from the AUTHORED tree.
 *
 * Deliberately a different source from `builtHubPages()`, which reads `out/`.
 * An expectation taken from the subject proves only that the subject equals
 * itself, and this build has shipped that mistake four times -- most sharply as
 * a pointer and its corroborating literal moved together, which every check
 * reading either one agreed with.
 *
 * `app/hub/<slug>/page.tsx` is the claim; `out/hub/<slug>/index.html` is the
 * artefact; the gate is that they agree. A route authored and never exported
 * fails here, and so does an exported route nobody authored.
 */
function authoredHubRouteCount(): number {
  return entriesOf(APP_HUB).filter((e) => existsSync(join(APP_HUB, e, 'page.tsx'))).length
}

function builtHubPages(): { slug: string; doc: Document }[] {
  return entriesOf(OUT_HUB)
    .filter((e) => statSync(join(OUT_HUB, e)).isDirectory())
    .map((slug) => ({ slug, page: join(OUT_HUB, slug, 'index.html') }))
    .filter(({ page }) => existsSync(page))
    .map(({ slug, page }) => ({
      slug,
      doc: new JSDOM(readFileSync(page, 'utf8')).window.document,
    }))
}

/**
 * Anything a person can operate or land on with a keyboard. `[disabled]`
 * and `[aria-disabled]` are in here deliberately: gate 1's first assertion
 * is that an exclusion carries NO control semantics, and a DISABLED control
 * is exactly the semantics it must not carry.
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

describe('slice 4 gate 1: absent for nonexistence, and no unreasoned refusal', () => {
  /* THE ADJUDICATION. A dedicated reading of the frozen source returned
   * INCONSISTENT AT NAMED-TEST STRENGTH on when a refused control renders
   * ABSENT versus DISABLED-with-a-named-reason. Chapter 30 states and
   * implements Reading A (the control exists on this surface for someone,
   * so everyone refused sees it disabled with a reason); chapters 5, 12, 17
   * and 18 state and implement Reading B (a person who never holds the
   * right sees it absent). Both are backed by acceptance criteria, and the
   * collision is test against test: `TEST-TA-003` (L11846) and
   * `TEST-FLOOR-003` (L12947) assert no control exists where
   * `TEST-30-3-2-002` (L61534) and `AC-30-3-2-003` (L61530) assert the same
   * control for the same role on the same screen renders "locked rather
   * than absent".
   *
   * SO THIS GATE DOES NOT PICK A SIDE. It asserts only what is true on both
   * readings, and pins the contested cases as contested. */

  it('the normalised matrices are non-empty and cover all nine slice-4 Hub routes', () => {
    // A vacuity guard on everything below: every assertion in this gate
    // iterates these rows, and an empty iteration passes silently.
    expect(HUB_MODULES_UNDER_GATE).toHaveLength(9)
    for (const m of HUB_MODULES_UNDER_GATE) {
      expect(m.rows.length, `${m.slug} has no matrix rows`).toBeGreaterThan(0)
      for (const row of m.rows) expect(row.cells).toHaveLength(5)
    }
    /**
     * EVERY SLICE-4 MODULE IS UNDER GATE, and "slice-4" is DERIVED rather
     * than hand-listed here: a slice-4 module keeps its matrix in
     * `app/hub/<slug>/fixtures.ts` and has no
     * `src/surfaces/doh/modules/doh-NN/matrix.ts`, which is the slice-6
     * shape. So a ninth slice-4 module added to `DOH_MODULES` still fails
     * this line, which is what the check was for.
     *
     * THE SCOPE NARROWED WHEN THE SLICE-6 SEVEN WERE REGISTERED, and it is
     * narrowed openly rather than by dropping the assertion. This is a
     * SLICE-4 gate: its own body reads `out/hub/<slug>/index.html` and
     * asserts what those nine screens render. Pulling a later slice's screens
     * under it would be that slice's gate wearing this one's name. The ones
     * outside are NAMED below so they cannot hide in the gap, and their own
     * slice's gates task owns them.
     *
     * THE PREDICATE IS "MATRIX UNDER `src/`", NOT "SLICE 6", and the local
     * name said the latter until slice 10 registered `MOD-DOH-10` and
     * `MOD-DOH-11`, whose matrices live there too. The derivation was right
     * and the label was the thing that aged: what it separates is where a
     * module keeps its matrix, which is exactly the line between this gate's
     * subject and everyone else's.
     */
    const matrixInSrc = (id: string) =>
      existsSync(`src/surfaces/doh/modules/${id.replace('MOD-DOH-', 'doh-').toLowerCase()}/matrix.ts`)
    const sliceFour = DOH_MODULES.filter((m) => !matrixInSrc(m.id))
    const matrixUnderSrc = DOH_MODULES.filter((m) => matrixInSrc(m.id))
    expect(sliceFour).toHaveLength(8)
    expect(matrixUnderSrc.map((m) => m.id)).toEqual([
      'MOD-DOH-05', 'MOD-DOH-06', 'MOD-DOH-07', 'MOD-DOH-08',
      'MOD-DOH-10', 'MOD-DOH-11',
      'MOD-DOH-15', 'MOD-DOH-16', 'MOD-DOH-19',
    ])
    const gated = new Set(HUB_MODULES_UNDER_GATE.map((m) => m.moduleId))
    for (const m of sliceFour) expect(gated.has(m.id), `${m.id} is not under gate`).toBe(true)
  })

  /* ---------------- 1a — absent for nonexistence ---------------- */

  /**
   * For every action that exists for NO role, no element for it renders
   * with control semantics on the built page: no button role, not
   * focusable, no disabled attribute.
   *
   * Pure over its inputs, so the planted-violation proof below feeds it a
   * real file through the same reader and the same predicate.
   */
  function controlSemanticsOffenders(rows: readonly { slug: string; label: string; rowId: string }[]): string[] {
    const out: string[] = []
    // Grouped by page, and each page parsed ONCE. Parsing a 65KB document
    // per matrix row was 30 parses for 9 pages -- a gate slow enough to go
    // red on timing teaches people to re-run it rather than read it.
    const bySlug = new Map<string, typeof rows>()
    for (const row of rows) bySlug.set(row.slug, [...(bySlug.get(row.slug) ?? []), row])

    for (const [slug, slugRows] of bySlug) {
      const page = join(OUT_HUB, slug, 'index.html')
      if (!existsSync(page)) {
        out.push(`${slug}: no built page`)
        continue
      }
      const doc = new JSDOM(readFileSync(page, 'utf8')).window.document
      const controls = [...doc.querySelectorAll(CONTROL_SEMANTICS)].map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent ?? '',
      }))
      for (const { label, rowId } of slugRows) {
        for (const el of controls) {
          if (el.text.includes(label)) out.push(`${slug}/${rowId}: <${el.tag}> carries "${label}"`)
        }
      }
    }
    return out
  }

  it('names at least one held-by-nobody action on almost every route', () => {
    // The second vacuity guard, and the sharper one: `controlSemanticsOffenders`
    // over an empty row list returns [] and would pass forever.
    const rows = heldByNobody()
    expect(rows.length, 'no held-by-nobody rows found at all').toBeGreaterThan(20)
    expect(new Set(rows.map((r) => r.slug)).size, 'held-by-nobody rows on too few routes').toBeGreaterThanOrEqual(8)
  })

  it('renders no control for any action that exists for no role', () => {
    expect(controlSemanticsOffenders(heldByNobody())).toEqual([])
  })

  it('names the exclusion as static text — every label IS on the page', () => {
    // The complement, and the half that stops "renders no control" from
    // passing because the page says nothing at all. A screen that silently
    // drops its excluded rows tells a reviewer nothing; the matrix is the
    // disclosure and it has to be readable.
    const silent: string[] = []
    const textBySlug = new Map<string, string>()
    for (const { slug, label, rowId } of heldByNobody()) {
      if (!textBySlug.has(slug)) {
        const doc = new JSDOM(readFileSync(join(OUT_HUB, slug, 'index.html'), 'utf8')).window.document
        textBySlug.set(slug, doc.body.textContent ?? '')
      }
      if (!textBySlug.get(slug)!.includes(label)) silent.push(`${slug}/${rowId}`)
    }
    expect(silent, 'excluded actions the screen never names').toEqual([])
  })

  it.each([
    ['a live button', '<html><body><button>Execute a wipe</button></body></html>'],
    ['a disabled button', '<html><body><button aria-disabled="true">Execute a wipe</button></body></html>'],
    ['a focusable span', '<html><body><span tabindex="0">Execute a wipe</span></body></html>'],
    ['a link', '<html><body><a href="/x/">Execute a wipe</a></body></html>'],
  ])('PLANTED VIOLATION: %s for a held-by-nobody action trips the gate', (_what, html) => {
    withPlanted(OUT_HUB, 'index.html', html, () => {
      const offenders = controlSemanticsOffenders([
        { slug: OWN_PROBE_DIR, label: 'Execute a wipe', rowId: 'probe' },
      ])
      expect(offenders.join(' ')).toContain(OWN_PROBE_DIR)
    })
    expect(controlSemanticsOffenders(heldByNobody())).toEqual([])
  })

  it('and the same label as plain static text does NOT trip it', () => {
    withPlanted(OUT_HUB, 'index.html', '<html><body><td>Execute a wipe</td></body></html>', () => {
      expect(
        controlSemanticsOffenders([{ slug: OWN_PROBE_DIR, label: 'Execute a wipe', rowId: 'probe' }]),
      ).toEqual([])
    })
  })

  /* ---------------- 1b — no unreasoned refusal ---------------- */

  /**
   * Whatever the rendering, a refusal states its cause. Two halves, and the
   * NEGATIVE of each is asserted too — a gate that only checks the reasons
   * it finds cannot notice the one that is missing.
   *
   * In the DOM the carrier is structural and machine-readable: `Button`
   * renders an inert control as `aria-disabled="true"` wired by
   * `aria-describedby` to a visible reason element. A non-actionable
   * element with no such wiring is an unreasoned refusal.
   */
  /**
   * REVIEW CORRECTION. This used to pass the WHOLE `aria-describedby` value
   * to `getElementById`. `aria-describedby` is an ID REFERENCE LIST -- a
   * space-separated set of ids, concatenated by the accessibility tree into
   * one description -- so `aria-describedby="reason-a reason-b"` was looked
   * up as a single id named `"reason-a reason-b"`, found nothing, and the
   * control was reported as unreasoned. It failed SAFE (a false positive,
   * never a false negative) and no multi-token inert control exists in the
   * build today, so it has never fired. Fixed anyway: the first one written
   * would have turned a correctly-described control red, and a gate that
   * cries wolf on correct code gets its rule weakened rather than its bug
   * fixed.
   *
   * Every token must resolve, and the concatenation must say something. A
   * token pointing at nothing contributes nothing to the description and is
   * the same defect as the whole attribute pointing at nothing.
   */
  function unreasonedInertControls(pages: readonly { slug: string; doc: Document }[]): string[] {
    const out: string[] = []
    for (const { slug, doc } of pages) {
      for (const el of doc.querySelectorAll('[aria-disabled="true"],[disabled]')) {
        const described = el.getAttribute('aria-describedby')
        const tokens = (described ?? '').split(/\s+/).filter((t) => t !== '')
        const targets = tokens.map((id) => doc.getElementById(id))
        const description = targets.map((t) => t?.textContent ?? '').join(' ')
        if (tokens.length === 0 || targets.includes(null) || description.trim() === '') {
          out.push(`${slug}: <${el.tagName.toLowerCase()}> "${(el.textContent ?? '').slice(0, 40)}"`)
        }
      }
    }
    return out
  }

  it('every non-actionable element on every built route carries a resolving reason', () => {
    const pages = builtHubPages()
    // DERIVED, not a constant. This read `toBe(9)` and went red the moment
    // slice 6 added Hub routes -- a floor edited by hand whenever the thing it
    // counts grows is a floor that gets edited to whatever makes it pass.
    expect(pages.length, 'built Hub routes must match the authored ones').toBe(authoredHubRouteCount())
    const inert = pages.reduce(
      (n, { doc }) => n + doc.querySelectorAll('[aria-disabled="true"],[disabled]').length,
      0,
    )
    // The subset-on-an-empty-set failure, in its other form: with no inert
    // control anywhere, "every inert control is reasoned" is true and empty.
    expect(inert, 'no inert control anywhere on the surface').toBeGreaterThan(0)
    expect(unreasonedInertControls(pages)).toEqual([])
  })

  it.each([
    ['no reason at all', '<html><body><button aria-disabled="true">Do it</button></body></html>'],
    [
      'a reason pointing nowhere',
      '<html><body><button aria-disabled="true" aria-describedby="gone">Do it</button></body></html>',
    ],
    [
      'a reason that is blank',
      '<html><body><button aria-disabled="true" aria-describedby="r">Do it</button><span id="r"> </span></body></html>',
    ],
    [
      'a TOKEN LIST with one token pointing nowhere',
      '<html><body><button aria-disabled="true" aria-describedby="r gone">Do it</button><span id="r">Because.</span></body></html>',
    ],
    [
      'a token list where every token is blank',
      '<html><body><button aria-disabled="true" aria-describedby="r s">Do it</button><span id="r"> </span><span id="s"></span></body></html>',
    ],
  ])('PLANTED VIOLATION: an inert control with %s trips the gate', (_what, html) => {
    withPlanted(OUT_HUB, 'index.html', html, () => {
      const { document: doc } = new JSDOM(
        readFileSync(join(OUT_HUB, OWN_PROBE_DIR, 'index.html'), 'utf8'),
      ).window
      expect(unreasonedInertControls([{ slug: OWN_PROBE_DIR, doc }])).not.toEqual([])
    })
    expect(unreasonedInertControls(builtHubPages())).toEqual([])
  })

  it('and a MULTI-TOKEN aria-describedby whose tokens all resolve does NOT trip it', () => {
    // The other direction, and the one the old whole-attribute lookup got
    // wrong: two ids, both resolving, is a correctly described control.
    withPlanted(
      OUT_HUB,
      'index.html',
      '<html><body><button aria-disabled="true" aria-describedby="why-role why-state">Do it</button>' +
        '<span id="why-role">Your role does not hold this.</span>' +
        '<span id="why-state">The workspace is suspended.</span></body></html>',
      () => {
        const { document: doc } = new JSDOM(
          readFileSync(join(OUT_HUB, OWN_PROBE_DIR, 'index.html'), 'utf8'),
        ).window
        expect(unreasonedInertControls([{ slug: OWN_PROBE_DIR, doc }])).toEqual([])
      },
    )
  })

  it('no matrix cell carries a status outside the closed set', () => {
    // The other negative the adjudication asks for: no reason outside the
    // set. At the fixture layer the closed set is the STATUS vocabulary —
    // `normaliseRow` throws on an unmapped one, and this asserts the
    // normalised value really is a member rather than trusting the throw.
    const known: ReadonlySet<string> = new Set<string>(CELL_STATUSES)
    for (const m of HUB_MODULES_UNDER_GATE) {
      for (const row of m.rows) {
        for (const cell of row.cells) {
          expect(known.has(cell.status), `${m.slug}/${row.id}/${cell.role}: ${cell.rawStatus}`).toBe(true)
        }
      }
    }
  })

  it('every refusing cell states a cause, per cell or on its row', () => {
    // L10238: "a blank cell is an unanswered question that an implementer
    // will answer privately and inconsistently."
    //
    // PER CELL WHERE THE FIXTURE HAS ONE, ROW-LEVEL OTHERWISE. Four of the
    // nine matrices (devices, location-configuration, shift-management,
    // worker-lifecycle) carry no per-cell reason field at all — reported as
    // a finding, not silently excused: this asserts the strongest statement
    // each shape can support, so a module that HAS per-cell reasons cannot
    // quietly blank one and fall back to the row.
    const unreasoned: string[] = []
    for (const m of HUB_MODULES_UNDER_GATE) {
      for (const row of m.rows) {
        for (const cell of row.cells) {
          if (!REFUSING.has(cell.status)) continue
          const stated = cell.reason !== null ? cell.reason.trim() !== '' : row.rowReason.trim() !== ''
          if (!stated) unreasoned.push(`${m.slug}/${row.id}/${cell.role}`)
        }
      }
    }
    expect(unreasoned, 'refusals with no stated cause').toEqual([])
  })

  it('PLANTED VIOLATION: a blanked reason on a refusing cell trips the gate', () => {
    // Planted through the same predicate, over a synthesised row: the
    // fixtures are frozen source under `app/**`, and this gate measures the
    // build rather than editing it.
    const blanked: NormalisedRow = {
      id: 'probe-row',
      label: 'Probe',
      surface: 'screen',
      rowReason: '',
      cells: TENANT_ROLE_IDS.map((role) => ({
        role,
        status: 'ExplicitlyProhibited' as CellStatus,
        reason: '',
        rawStatus: 'explicitly-prohibited',
      })),
    }
    const unreasoned = blanked.cells.filter(
      (c) => REFUSING.has(c.status) && (c.reason !== null ? c.reason.trim() === '' : blanked.rowReason.trim() === ''),
    )
    expect(unreasoned).toHaveLength(5)
  })

  /* ---------------- 1c — the contested-control fixture ---------------- */

  /**
   * Each control where the frozen source contradicts itself, pinned to the
   * build's CURRENT rendering with BOTH locator sets, so a later change
   * flips a test rather than silently switching readings.
   *
   * `pin: null` marks the one conflict that is ESCALATED rather than
   * decided — parking it in a fixture as though the build had chosen would
   * be the dishonesty this whole fixture exists to prevent.
   */
  interface ContestedControl {
    readonly id: string
    readonly control: string
    /** Locators for Reading A — refused ⇒ DISABLED with a named reason. */
    readonly readingA: readonly string[]
    /** Locators for Reading B — never held ⇒ ABSENT. */
    readonly readingB: readonly string[]
    /** What this build renders today, or `null` where it is escalated. */
    readonly pin: 'absent' | 'disabled-with-reason' | null
    readonly where: string
  }

  const CONTESTED_CONTROLS: readonly ContestedControl[] = [
    {
      id: 'role-refused-write-control',
      control: 'Any write control refused to a role that never holds it',
      readingA: ['Chapter 30, the screen-panel catalogue', 'AC-30-3-2-003 L61530', 'TEST-30-3-2-002 L61534', 'L20338', 'L64699 (extend the time box)'],
      readingB: ['L1727', 'L16607', 'L14578', 'L44774', 'L20195'],
      pin: 'absent',
      where: 'src/ui/WriteControl.tsx — the ONE shared renderer, 30 call sites across MOD-DOH-02, MOD-DOH-03 and MOD-DOH-04',
    },
    {
      id: 'mod-doh-12-auditor-writes',
      control: 'MOD-DOH-12’s two write controls, for the Read-only Auditor',
      readingA: ['Chapter 30', 'FB-QUAL-005 L64415'],
      readingB: ['L1727', 'L16607'],
      pin: 'disabled-with-reason',
      where: 'app/hub/integration-surface/IntegrationSurfaceScreen.tsx — hand-rolled, and the one module that renders the opposite branch',
    },
    {
      id: 'mod-doh-01-auditor-requests',
      control: 'MOD-DOH-01’s two tier-request controls, for the Read-only Auditor',
      readingA: ['Chapter 30', 'FB-QUAL-005 L64415'],
      readingB: ['L26890-L26891', 'SB-DOH-013 L27029'],
      pin: 'absent',
      where: 'app/hub/tenant-lifecycle-and-tier-operations/TenantLifecycleScreen.tsx',
    },
    {
      id: 'severity-1-bundle-and-platform-fixed-settings',
      control: 'The Severity-1 bundle and platform-fixed settings, on a tenant-facing screen',
      readingA: ['TEST-30-3-2-002 L61534', 'AC-30-3-2-003 L61530'],
      readingB: ['TEST-TA-003 L11846', 'TEST-FLOOR-003 L12947'],
      pin: null,
      where: 'ESCALATED to the client as a decision with both test ids. Named test against named test; the source itself forbids resolving it.',
    },
  ]

  it('records all four conflicts, each carrying BOTH locator sets', () => {
    expect(CONTESTED_CONTROLS).toHaveLength(4)
    for (const c of CONTESTED_CONTROLS) {
      expect(c.readingA.length, `${c.id} has no Reading A locators`).toBeGreaterThan(0)
      expect(c.readingB.length, `${c.id} has no Reading B locators`).toBeGreaterThan(0)
      expect(c.where.trim(), c.id).not.toBe('')
    }
  })

  it('records the fourth as escalated, never as a choice the build made', () => {
    const escalated = CONTESTED_CONTROLS.filter((c) => c.pin === null)
    expect(escalated.map((c) => c.id)).toEqual(['severity-1-bundle-and-platform-fixed-settings'])
    expect(escalated[0]!.where).toMatch(/ESCALATED/)
  })

  it('the shared renderer still pins the ABSENT branch, and pins it by BEHAVIOUR', () => {
    // Not a source string: `WriteControl` is called and its returned element
    // inspected. When the rendering question settles, THIS branch flips —
    // one place, nine modules — and this test goes red rather than the
    // reading changing in silence.
    const props = {
      label: 'Do it',
      roleName: 'Read-only Auditor',
      gateReason: null,
      objectReason: null,
      refusalNote: 'The note that sits where a control would be.',
      neverQueuedNote: 'nothing here is queued',
      onAct: () => {},
    }
    const roleRefused: PermissionDecision = deny('explicitlyProhibited', 'ROLE_NOT_GRANTED', undefined, {
      stage: 'BASE_ROLE',
      sourceRefs: ['L27470'],
    })
    const refusedForAnotherCause: PermissionDecision = decide('unavailable', 'TENANT_SUSPENDED', undefined, {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: ['L26919'],
    })

    const absent = WriteControl({ ...props, decision: roleRefused }) as unknown as {
      props: { rendering?: { kind: string } }
    }
    expect(absent.props.rendering?.kind, 'the ROLE_NOT_GRANTED branch no longer renders ABSENT').toBe('absent')

    const disabled = WriteControl({ ...props, decision: refusedForAnotherCause }) as unknown as {
      props: { disabledReason?: string; onClick?: unknown }
    }
    expect(typeof disabled.props.disabledReason, 'a refusal that is not role-level lost its reason').toBe('string')
    expect(disabled.props.onClick, 'a refused control is still wired').toBeUndefined()

    const allowed = WriteControl({
      ...props,
      decision: decide('allowed', 'ALLOWED', undefined, { stage: 'ALL_STAGES_PASSED', sourceRefs: ['L1'] }),
    }) as unknown as { props: { onClick?: unknown; disabledReason?: string } }
    expect(typeof allowed.props.onClick, 'an allowed control is not wired').toBe('function')
    expect(allowed.props.disabledReason).toBeUndefined()
  })

  it('the module rendering the OPPOSITE branch is still exactly one, and named', () => {
    // The divergence is disclosed, not hidden — but it must stay ONE
    // module. A second module drifting to the other reading, or the first
    // quietly adopting the shared renderer, both flip this.
    const usesSharedRenderer = hubSources()
      .filter(({ src }) => /<(Shared)?WriteControl\b/.test(src))
      .map(({ file }) => file)
      .sort()
    expect(usesSharedRenderer, 'the set of screens on the ABSENT branch changed').toEqual([
      join(HUB_ROOT, 'location-configuration', 'LocationConfigurationScreen.tsx'),
      join(HUB_ROOT, 'shift-management', 'ShiftManagementScreen.tsx'),
      join(HUB_ROOT, 'worker-lifecycle-and-qualifications', 'WorkerLifecycleScreen.tsx'),
    ])
    const opposite = CONTESTED_CONTROLS.find((c) => c.id === 'mod-doh-12-auditor-writes')!
    expect(opposite.pin).toBe('disabled-with-reason')
    expect(usesSharedRenderer).not.toContain(
      join(HUB_ROOT, 'integration-surface', 'IntegrationSurfaceScreen.tsx'),
    )
  })
})

describe('slice 4 gate 2: scope enforced in what the screen READ, not what it DREW', () => {
  /* THE DEFECT. `MOD-DOH-04` filtered its worker register by persona scope
   * and left its clearance corpus — free text somebody wrote about a named
   * person — UNFILTERED, while its own matrix row printed on the same
   * screen said it was filtered. A value legitimately scoped for DISPLAY
   * was trusted as if it also BOUNDED what got read.
   *
   * THE COMPANION IS THE PART THAT IS MECHANISABLE HERE, and it is written
   * in the strict-subset shape ON PURPOSE: this slice already shipped a
   * subset assertion that would pass on an empty set, and "narrow ⊆ broad"
   * is also true when the two are EQUAL — which is exactly the state the
   * unfiltered corpus was in. Both directions, or it proves nothing.
   *
   * The write half — set a scope-bearing selection under a broad persona,
   * switch personas without re-touching it, fire every enabled write, and
   * assert the recorded action names no out-of-scope Area — is NOT
   * mechanisable in this project. See the report: `tests/coverage/**` runs
   * in the node-environment, `.ts`-only `release` project with no DOM and
   * no role switcher, and `commit()` is a per-screen closure under three
   * different names rather than the shared exported wrapper. */

  /** Every seeded register that exposes a scope-filtered reader. */
  const SCOPED_READERS: readonly { name: string; read: (role: TenantRoleId) => readonly unknown[] }[] = [
    { name: 'location-configuration/visibleSiteIds', read: (r) => visibleSiteIds(r) },
    { name: 'location-configuration/visibleAreaIds', read: (r) => visibleAreaIds(r) },
    { name: 'shift-management/shiftsVisibleTo', read: (r) => shiftsVisibleTo(r, DOH_SHIFTS) },
    {
      name: 'worker-lifecycle/workersVisibleTo',
      read: (r) => workersVisibleTo(r, DOH_WORKERS, DOH_QUALIFICATIONS),
    },
    { name: 'worker-lifecycle/clearancesVisibleTo', read: (r) => clearancesVisibleTo(r, DOH_CLEARANCES) },
    { name: 'worker-lifecycle/selectableAreas', read: (r) => selectableAreas(r) },
    { name: 'qualification-calendar/calendarAreaIdsFor', read: (r) => calendarAreaIdsFor(r) },
    { name: 'qualification-calendar/calendarAreasFor', read: (r) => calendarAreasFor(r) },
    {
      name: 'qualification-calendar/calendarEntriesFor',
      read: (r) => calendarEntriesFor(r, DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES),
    },
  ]

  /** Compared by VALUE, not by id: a narrow read returning a modified copy
   *  of a broad row is not a subset of it, and an id-only compare says it
   *  is. One helper, every register, no per-register accessor. */
  const asValues = (xs: readonly unknown[]): string[] => xs.map((x) => JSON.stringify(x))

  const BROAD: TenantRoleId = 'TENANT_ADMIN'
  const NARROW: TenantRoleId = 'SUPERVISOR'

  function strictSubsetFailures(
    readers: readonly { name: string; read: (role: TenantRoleId) => readonly unknown[] }[],
  ): string[] {
    const out: string[] = []
    for (const { name, read } of readers) {
      const broad = asValues(read(BROAD))
      const narrow = asValues(read(NARROW))
      if (broad.length === 0) {
        out.push(`${name}: the broad persona reads nothing — a subset check on an empty set proves nothing`)
        continue
      }
      const outside = narrow.filter((v) => !broad.includes(v))
      if (outside.length > 0) out.push(`${name}: narrow reads ${outside.length} row(s) the broad persona cannot`)
      if (narrow.length >= broad.length) {
        out.push(`${name}: narrow reads ${narrow.length} of ${broad.length} — not strictly narrower`)
      }
    }
    return out
  }

  it('covers every seeded register that has a scope-filtered reader', () => {
    expect(SCOPED_READERS.length).toBe(9)
  })

  it('a narrow persona reads a STRICT subset of what a broad one reads', () => {
    expect(strictSubsetFailures(SCOPED_READERS)).toEqual([])
  })

  it.each([
    [
      'an unfiltered corpus (equal sets)',
      { name: 'probe', read: () => [{ id: 'A' }, { id: 'B' }] },
      /not strictly narrower/,
    ],
    [
      'a leak (a row the broad persona cannot read)',
      {
        name: 'probe',
        read: (r: TenantRoleId) => (r === 'TENANT_ADMIN' ? [{ id: 'A' }] : [{ id: 'Z' }]),
      },
      /row\(s\) the broad persona cannot/,
    ],
    [
      'an empty broad read (the vacuous pass)',
      { name: 'probe', read: () => [] },
      /subset check on an empty set/,
    ],
  ])('PLANTED VIOLATION: %s trips the gate', (_what, reader, pattern) => {
    const failures = strictSubsetFailures([reader])
    expect(failures.length).toBeGreaterThan(0)
    expect(failures.join(' ')).toMatch(pattern as RegExp)
  })

  it('and a genuinely narrower reader does NOT trip it', () => {
    expect(
      strictSubsetFailures([
        {
          name: 'probe',
          read: (r: TenantRoleId) => (r === 'TENANT_ADMIN' ? [{ id: 'A' }, { id: 'B' }] : [{ id: 'A' }]),
        },
      ]),
    ).toEqual([])
  })

  it('the Worker reads nothing anywhere, on every register', () => {
    // D11: the Worker holds no Hub screen at all. Asserted over the readers
    // rather than over the rail alone, because the rail is what a screen
    // DRAWS and these are what it READS.
    for (const { name, read } of SCOPED_READERS) {
      expect(read('WORKER'), `${name} returns rows for the Worker`).toEqual([])
    }
  })
})

describe('slice 4 gate 3: per-module constraints are enumerated from the DIRECTORY', () => {
  /* THE DEFECT, and it blocked a refactor correctly. A screen-extraction
   * task refused to extract a fourth file from
   * `app/hub/worker-lifecycle-and-qualifications/` because
   * `tests/unit/doh-workers.test.ts` scans a HARDCODED three-path
   * `MY_FILES`, and that module's determinism gate, its three-digit `SCR`
   * gate and its per-worker behavioural-measure gate exist ONLY there. A
   * fourth file would have escaped all three while the suite stayed green.
   *
   * It is the same shape as this slice's four "the fix reached one call
   * site of several" defects, one level up: an enumeration maintained by
   * hand, with no way to notice when it falls behind what it covers.
   *
   * So this gate re-applies the constraint FROM THE DIRECTORY. The proof
   * below is the whole point — a probe file planted inside a real module
   * directory, which that module's own hardcoded list does not name and
   * therefore cannot see, and which this gate catches.
   *
   * REVIEW CORRECTION — THE GATE NAMED THREE CONSTRAINTS AND RE-APPLIED
   * ONE. The paragraph above names the `SCR` gate, the determinism gate and
   * the per-worker behavioural-measure gate, and the first version of this
   * gate re-applied only the `SCR` one. The other two stayed enforced per
   * module, four of the nine module suites still hand-named the files they
   * scanned, and this gate's own hand-named-path assertion only checks that
   * a hand-named path still EXISTS — it cannot see that the LIST exists. So
   * a new file in Location Configuration, Shift Management, Integration
   * Surface or Qualification Calendar escaped both remaining constraints
   * with the suite green: the slice's signature defect, a fix reaching some
   * call sites and not all, inside the gate written to catch it.
   *
   * All three are re-applied from the directory now, and the four
   * hand-naming suites were converted to directory walks in the same pass
   * (`doh-locations`, `doh-shifts`, `doh-sso` had `MY_FILES`;
   * `doh-calendar` had two `readFileSync` path constants, which its sibling
   * module's comment correctly calls one level worse). */

  // D1/R6. Catalogue A (`SCR-DOH-001`…`026`) and catalogue B
  // (`SCR-DOH-01`…`23`) use the SAME identifiers for DIFFERENT screens —
  // `SCR-DOH-23` is the tenant administration area while `SCR-DOH-023` is
  // Platform Access History — so a three-digit literal is forbidden.
  const THREE_DIGIT_SCR = /\bSCR-DOH-\d{3}\b/

  function threeDigitOffenders(): string[] {
    return hubSources()
      .filter(({ src }) => THREE_DIGIT_SCR.test(src))
      .map(({ file }) => file)
  }

  /** Every `app/hub/...` path each suite names by hand, keyed by suite file. */
  function handNamedHubPaths(): Map<string, string[]> {
    const byFile = new Map<string, string[]>()
    for (const dir of ['tests/unit', 'tests/component']) {
      for (const f of entriesOf(dir)) {
        const full = join(dir, f)
        if (statSync(full).isDirectory()) continue
        const paths = [
          ...new Set(
            [...readFileSync(full, 'utf8').matchAll(/app\/hub\/[A-Za-z0-9./-]+\.tsx?/g)].map((m) => m[0]!),
          ),
        ]
        if (paths.length > 0) byFile.set(full, paths)
      }
    }
    return byFile
  }

  /**
   * A suite that names THREE OR MORE files from one module directory is
   * ENUMERATING that module rather than pointing at one file by role.
   *
   * REVIEW FINDING, and the half gate 3 could not see. The stale-path check
   * below asks whether each hand-named path still EXISTS; it cannot ask
   * whether the LIST exists, so four suites kept hand lists under it and
   * stayed green — `doh-locations`, `doh-shifts` and `doh-sso` through a
   * three-path `MY_FILES`, `doh-calendar` through two `readFileSync` path
   * constants. Three is the exact size all three `MY_FILES` had, and it is
   * the line between an enumeration and a pointer: naming a module's
   * fixtures and its screen because a claim is about ONE of the two
   * specifically is legitimate and stays (`doh-workers`, `doh-calendar`).
   */
  const ENUMERATION_THRESHOLD = 3

  function moduleEnumerations(byFile: ReadonlyMap<string, readonly string[]>): string[] {
    const out: string[] = []
    for (const [file, paths] of byFile) {
      const byModule = new Map<string, number>()
      for (const p of paths) {
        const dir = p.slice(0, p.lastIndexOf('/'))
        byModule.set(dir, (byModule.get(dir) ?? 0) + 1)
      }
      for (const [dir, n] of byModule) {
        if (n >= ENUMERATION_THRESHOLD) out.push(`${file} hand-enumerates ${n} files of ${dir}`)
      }
    }
    return out
  }

  it('walks every Hub source file, and the walk is wider than any hand list', () => {
    const walked = hubSources().map((s) => s.file)
    expect(walked.length, 'the directory walk found nothing').toBeGreaterThan(25)

    // Every path a per-module suite names by hand must still exist. A
    // renamed file leaves a stale entry in a hardcoded list and the list
    // has no way to notice; this does.
    const byFile = handNamedHubPaths()
    const handNamed = new Set([...byFile.values()].flat())
    expect(handNamed.size, 'no hand-named Hub paths found — the check below is vacuous').toBeGreaterThan(10)
    const stale = [...handNamed].filter((p) => !existsSync(p))
    expect(stale, 'per-module suites naming Hub files that no longer exist').toEqual([])
  })

  it('no suite hand-enumerates a module’s files — the list itself, not just its paths', () => {
    expect(moduleEnumerations(handNamedHubPaths())).toEqual([])
  })

  it('PLANTED VIOLATION: a suite that hand-lists three files of one module trips it', () => {
    // The predicate, over a synthesised suite. Planting a real file under
    // `tests/unit/` would be planting inside another Vitest project's
    // include glob, so this feeds the same function the same shape instead.
    const planted = new Map<string, string[]>([
      [
        'tests/unit/doh-probe.test.ts',
        [
          'app/hub/shift-management/fixtures.ts',
          'app/hub/shift-management/ShiftManagementScreen.tsx',
          'app/hub/shift-management/page.tsx',
        ],
      ],
    ])
    expect(moduleEnumerations(planted).join(' ')).toContain('hand-enumerates 3 files')
  })

  it('and a suite naming ONE file of each of three modules does NOT trip it', () => {
    // The complement. Pointing at a specific file because a claim is about
    // that file is not an enumeration, however many modules are pointed at.
    const pointers = new Map<string, string[]>([
      [
        'tests/unit/doh-probe.test.ts',
        [
          'app/hub/shift-management/fixtures.ts',
          'app/hub/location-configuration/fixtures.ts',
          'app/hub/qualification-calendar/fixtures.ts',
        ],
      ],
    ])
    expect(moduleEnumerations(pointers)).toEqual([])
  })

  it('no three-digit SCR-DOH-NNN literal anywhere under app/hub/', () => {
    expect(threeDigitOffenders()).toEqual([])
  })

  it('PLANTED VIOLATION: a file no per-module suite names trips this gate', () => {
    // Planted INSIDE `worker-lifecycle-and-qualifications/`, the module
    // whose hardcoded `MY_FILES` started this audit. All nine suites walk
    // their directories now, so "the module's own list cannot see it" is
    // history rather than the live hazard — what this still proves is that
    // the slice-wide walk reaches INSIDE a module directory, which is the
    // property the whole gate rests on.
    const moduleDir = join(HUB_ROOT, 'worker-lifecycle-and-qualifications')
    withPlanted(moduleDir, 'Probe.tsx', 'export const P = () => <p>SCR-DOH-008</p>\n', (probe) => {
      expect(threeDigitOffenders()).toContain(probe)
    })
    expect(threeDigitOffenders()).toEqual([])
  })

  it('and the two-digit catalogue-B form does NOT trip it', () => {
    withPlanted(HUB_ROOT, 'Probe.tsx', 'export const P = () => <p>SCR-DOH-08</p>\n', () => {
      expect(threeDigitOffenders()).toEqual([])
    })
  })

  /* ---------------- constraint 2 of 3 — determinism ---------------- */

  /**
   * ONE REGEX OVER THE SOURCES THIS GATE ALREADY WALKS AND ALREADY
   * COMMENT-STRIPS. The nine module suites each carry their own copy of
   * this, five over a directory walk and four over a hand list; this is the
   * copy that cannot fall behind the directory. Comment-stripping is why it
   * can be this blunt — `doh-tenant-lifecycle.test.ts` documents a source
   * file that NAMES `Date.now()` in order to deny it, and a raw scan would
   * fail on correct code.
   */
  const NONDETERMINISM = /Date\.now|new Date\(|Math\.random/

  function nondeterministicSources(): string[] {
    return hubSources()
      .filter(({ src }) => NONDETERMINISM.test(src))
      .map(({ file }) => file)
  }

  it('no clock read and no randomness anywhere under app/hub/', () => {
    expect(nondeterministicSources()).toEqual([])
  })

  it('PLANTED VIOLATION: a clock read in a file the module’s hand list cannot see trips it', () => {
    // Planted inside `location-configuration/`, one of the four modules
    // whose suite hand-named its files when this was written. That list
    // could not see this file; the directory can.
    const moduleDir = join(HUB_ROOT, 'location-configuration')
    withPlanted(moduleDir, 'ClockProbe.ts', 'export const t = Date.now()\n', (probe) => {
      expect(nondeterministicSources()).toContain(probe)
    })
    expect(nondeterministicSources()).toEqual([])
  })

  it('and a comment NAMING Date.now in order to deny it does NOT trip it', () => {
    withPlanted(HUB_ROOT, 'DenialProbe.ts', '// Nothing here reads Date.now() or Math.random().\nexport const t = 1\n', () => {
      expect(nondeterministicSources()).toEqual([])
    })
  })

  /* ------- constraint 3 of 3 — no behavioural measure on a person ------- */

  /**
   * KEY-SHAPED, NOT TEXT-SHAPED, so this one cannot be a regex over the
   * sources: the question is asked of an OBJECT KEY, and the answer lives
   * in `tests/coverage/person-measure-keys.ts`. It needs the modules'
   * exported values, so the walk imports them — every `.ts` data module
   * under `app/hub/`, discovered from the directory, none of them named
   * here. A tenth module, or a second data file inside an existing one, is
   * scanned the moment it exists.
   *
   * TWO CEILINGS, NAMED RATHER THAN LEFT IMPLICIT.
   *
   * 1. THE PERSON HALF IS NOT MECHANISABLE SLICE-WIDE. The matcher answers
   *    "does this key name a behavioural measure?"; whether the RECORD is
   *    about a person is the half a human supplies, and each module suite
   *    supplies it by choosing which registers to scan. So this gate asks
   *    the WIDER question — no key anywhere in the slice's data names a
   *    behavioural measure at all — which strictly subsumes the per-module
   *    one and needs no judgement. The cost is stated in `MEASURE_KEY_PINS`
   *    below: a legitimate NON-person measure would be refused here too and
   *    would have to be pinned with a reason. The per-module suites remain
   *    the authority on the person half and are not replaced by this.
   *
   * 2. `.ts` DATA MODULES ONLY. A record literal declared inside a screen
   *    `.tsx` is out of reach — importing nine React component modules into
   *    a node-environment gate buys nothing this does not already get from
   *    `fixtures.ts`, which is where every screen reads its records from.
   *    The `.tsx` files are still covered by constraints 1 and 2 above,
   *    which are text-shaped and walk every extension.
   */
  const dataModules = (): string[] => walk(HUB_ROOT).filter((f) => f.endsWith('.ts'))

  /**
   * Keys the matcher refuses that are NOT measures, each with the reason.
   * Both directions are asserted: an unpinned offender fails, and a pin
   * that has stopped being real fails too.
   */
  const MEASURE_KEY_PINS: Readonly<Record<string, string>> = {
    whatItMeansHere:
      'A MATCHER FALSE POSITIVE, not a measure. `words()` cuts this to `what it means here`, and `means` stems from the MAGNITUDE root `mean` plus the closed suffix `s`. The matcher\'s own doc comment records the same hole one word over — `ing` is excluded from the suffix list precisely so `meaning` does not stem from `mean` — and `s` cannot be excluded without losing `counts`, `totals` and `scores`. The five keys carrying this name are prose on `SUSPENSION_STATUS`, describing what a suspension state means on this screen. Nothing is counted.',
  }

  /** Every object key in every exported value of `files`, with where it sits. */
  async function fixtureKeys(files: readonly string[]): Promise<{ key: string; where: string }[]> {
    const found: { key: string; where: string }[] = []
    const seen = new Set<unknown>()
    const scan = (value: unknown, path: string, depth: number): void => {
      // Depth-capped and cycle-guarded: fixtures are plain data, but a gate
      // that can hang on one is a gate people stop running.
      if (depth > 8 || value === null || typeof value !== 'object' || seen.has(value)) return
      seen.add(value)
      if (Array.isArray(value)) {
        value.forEach((v, i) => scan(v, `${path}[${i}]`, depth + 1))
        return
      }
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        found.push({ key, where: `${path}.${key}` })
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

  async function measureKeyOffenders(files: readonly string[]): Promise<string[]> {
    return (await fixtureKeys(files))
      .filter(({ key }) => namesPersonBehaviouralMeasure(key) && MEASURE_KEY_PINS[key] === undefined)
      .map(({ where }) => where)
  }

  it('walks every data module in the slice, and reaches real keys', async () => {
    const files = dataModules()
    // Vacuity guards, both of them. An empty file list scans nothing; a
    // file list that imports to nothing scans nothing either, and both pass.
    expect(files.length, 'no data modules found under app/hub/').toBeGreaterThan(8)
    expect(files, 'the walk missed a module fixtures file').toContain(
      join(HUB_ROOT, 'shift-management', 'fixtures.ts'),
    )
    // The matcher is live on this run, not asleep: proved on keys the slice
    // does not contain, through the same function the scan calls.
    expect(namesPersonBehaviouralMeasure('runsPerWorker')).toBe(true)
    expect(namesPersonBehaviouralMeasure('productivityScore')).toBe(true)
    expect(namesPersonBehaviouralMeasure('roleName')).toBe(false)
  })

  it('no exported key in any Hub data module names a behavioural measure', async () => {
    expect(await measureKeyOffenders(dataModules())).toEqual([])
  })

  it('every pinned key is still present, and still not a measure', async () => {
    // The other direction. A pin that has stopped being real is a standing
    // licence for a key nothing checks any more.
    const pinned = Object.keys(MEASURE_KEY_PINS)
    expect(pinned.length).toBeGreaterThan(0)
    const found = new Set((await fixtureKeys(dataModules())).map(({ key }) => key))
    expect(found.size, 'the key walk found nothing to check the pins against').toBeGreaterThan(100)
    for (const key of pinned) {
      expect(MEASURE_KEY_PINS[key]!.trim(), `${key} has no recorded reason`).not.toBe('')
      expect(found.has(key), `${key} is pinned but no longer appears in any fixture`).toBe(true)
      expect(namesPersonBehaviouralMeasure(key), `${key} is pinned but the matcher now passes it`).toBe(true)
    }
  })

  it('PLANTED VIOLATION: a measure key in a data file no module suite names trips it', async () => {
    // Planted inside `shift-management/`, another of the four modules that
    // hand-named its files. Its own suite scanned three constants and could
    // not have seen this; the directory walk imports it.
    const moduleDir = join(HUB_ROOT, 'shift-management')
    const contents = "export const ROSTER = [{ workerId: 'W-1', runsPerHour: 4 }]\n"
    let caught: string[] = []
    const dir = join(moduleDir, OWN_PROBE_DIR)
    const probe = join(dir, 'MeasureProbe.ts')
    try {
      mkdirSync(dir, { recursive: true })
      writeFileSync(probe, contents)
      caught = await measureKeyOffenders(dataModules())
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    expect(caught.join(' '), 'the planted measure key was not caught').toContain('runsPerHour')
    expect(await measureKeyOffenders(dataModules())).toEqual([])
  })

  it('and a lifecycle key that merely CONTAINS a measure word does NOT trip it', async () => {
    // `accountState` contains `count`; the matcher splits words first, so it
    // walks past. Planted through the same reader as the case above.
    const dir = join(HUB_ROOT, OWN_PROBE_DIR)
    const probe = join(dir, 'AccountProbe.ts')
    let caught: string[] = []
    try {
      mkdirSync(dir, { recursive: true })
      writeFileSync(probe, "export const R = [{ accountState: 'active', roleName: 'Supervisor' }]\n")
      caught = await measureKeyOffenders(dataModules())
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    expect(caught).toEqual([])
  })
})

describe('slice 4 gate 4: Unavailable keyed on meaning, never on the literal string', () => {
  /* THE DEFECT. The source OVERLOADS `Unavailable` across two senses that
   * render oppositely: (a) role-level withholding of a whole module —
   * nothing renders, "not reachable by navigation or direct address"
   * (`AC-PROD-043`/`TEST-PROD-043`, L3799, L26052, L26885-L26887); and (b)
   * transient unavailability of an action the role DOES hold (L14084,
   * L15085, L20184, L65024), which renders DISABLED WITH A REASON. A gate
   * matching the token will misfire.
   *
   * REVIEW CORRECTION — THIS GATE RECORDED A FALSE FINDING AGAINST
   * PRODUCTION CODE, AND IT IS WITHDRAWN. The premise used to be that
   * `DOH_MODULES.rolesReaching` "is derived from the TOKEN" and so cannot
   * ask a meaning question. It is not. `rolesReachingByMatrix` opens with
   * `rows.filter((row) => row.surface === 'screen')` and only then reads
   * the token — the production code asks a meaning question FIRST, and the
   * `MatrixRowSurface` classification exists for exactly this reason.
   *
   * What was left was a gate that DROPPED `surface` in `normaliseRow`,
   * computed a role's holdings over chrome and another-surface rows the
   * production derivation never reads, and then pinned the disagreement it
   * had manufactured as three findings. Two of the three were pure
   * artefacts and are gone: every row they named is `surface: 'chrome'`,
   * which their own `why` strings stated.
   *
   * WHAT THE GATE STILL ASKS, over the same rows the code reads: does the
   * module withhold every capability OF THIS MODULE'S OWN SCREEN from that
   * role? On one of eight modules the answers still differ, and that
   * difference is pinned below with the rows that cause it. It is harmless
   * — D11 withholds the surface first — and it is a genuine token
   * over-reach. Reported, not fixed: this gate measures the build. */

  /**
   * THE ROWS THE PRODUCTION DERIVATION ACTUALLY READS. `rolesReachingByMatrix`
   * opens with `rows.filter((row) => row.surface === 'screen')`, so this
   * does too. An audit that computes over a wider row set than the code it
   * audits is not measuring that code.
   */
  const screenRows = (m: HubModuleUnderGate): readonly NormalisedRow[] =>
    m.rows.filter((r) => r.surface === 'screen')

  const HOLDERS = (m: HubModuleUnderGate): TenantRoleId[] =>
    TENANT_ROLE_IDS.filter((role) =>
      screenRows(m).some((r) => r.cells.some((c) => c.role === role && HOLDS.has(c.status))),
    )

  /**
   * The three (module, role) pairs where the token rule and the meaning
   * rule disagree, each naming the rows that create the disagreement and
   * why the outcome is right anyway. Pinned so a FOURTH disagreement fails,
   * and so an exception that stops being real fails too.
   */
  interface DerivationException {
    readonly moduleId: DohModuleId
    readonly roles: readonly TenantRoleId[]
    /** The rows that give these roles a capability the rail does not offer. */
    readonly rows: readonly string[]
    readonly why: string
  }

  const DERIVATION_EXCEPTIONS: readonly DerivationException[] = [
    /* WAS THREE, IS ONE. The `MOD-DOH-01` and `MOD-DOH-13` entries were
     * ARTEFACTS OF THIS GATE, not findings against the build, and both
     * evaporated the moment `HOLDERS` started filtering to `screen` rows
     * the way `rolesReachingByMatrix` always has. Their own `why` strings
     * said as much: `see-compliance-message` is `surface: 'chrome'`, and so
     * are all three of `see-the-support-session-banner`,
     * `end-a-support-session-from-the-banner` and
     * `see-a-platform-announcement`. The gate dropped `surface`, computed a
     * disagreement over rows the production code never reads, then
     * whitelisted the disagreement it had manufactured -- a recorded
     * finding against production code that was not true of it. The one
     * below is the genuine case. */
    {
      moduleId: 'MOD-DOH-04',
      roles: ['WORKER'],
      rows: ['view-worker', 'view-own-certification-alerts'],
      why: 'THE ONE REAL INSTANCE, and it survives the `screen` filter: all fifteen `MOD-DOH-04` rows are `surface: \'screen\'`, so no row classification rescues it. One `Unavailable` cell — reading the clearance corpus — withholds the WHOLE module from the Worker, while the Worker holds two capabilities on this module\'s own screen. Both are met on the device, not in the Hub, and D11 withholds the surface first, so the outcome is right by a different rule than the one that produced it.',
    },
  ]

  it('records at least one real disagreement, and every exception is well formed', () => {
    // Non-vacuity. `DERIVATION_EXCEPTIONS` went from three entries to one
    // when the `screen` filter landed; an empty list would make the
    // "still real" assertion below iterate nothing and pass forever, which
    // is the shape this file exists to refuse.
    expect(DERIVATION_EXCEPTIONS.length).toBeGreaterThan(0)
    for (const e of DERIVATION_EXCEPTIONS) {
      expect(e.roles.length, `${e.moduleId} excepts no role`).toBeGreaterThan(0)
      expect(e.rows.length, `${e.moduleId} names no row`).toBeGreaterThan(0)
    }
  })

  it('the pinned exception survives the screen filter — none of its rows is chrome', () => {
    // The withdrawal, asserted rather than asserted-about. Two exceptions
    // were dropped because every row they named was `surface: 'chrome'`;
    // this is what stops a THIRD artefact being pinned the same way.
    for (const e of DERIVATION_EXCEPTIONS) {
      const m = HUB_MODULES_UNDER_GATE.find((x) => x.moduleId === e.moduleId)!
      for (const rowId of e.rows) {
        const row = m.rows.find((r) => r.id === rowId)!
        expect(row.surface, `${e.moduleId}/${rowId} is a ${row.surface} row, not this screen’s own`).toBe('screen')
      }
    }
  })

  it('the two withdrawn exceptions really were chrome, on the live fixtures', () => {
    // Named rows, checked at source, so "they were artefacts" is a fact in
    // the suite rather than a claim in a comment. If a fixture reclassifies
    // one of these to `screen`, the disagreement becomes real again and the
    // first assertion in this gate goes red — which is the correct outcome.
    const withdrawn: readonly { moduleId: DohModuleId; rows: readonly string[] }[] = [
      { moduleId: 'MOD-DOH-01', rows: ['see-compliance-message'] },
      {
        moduleId: 'MOD-DOH-13',
        rows: [
          'see-the-support-session-banner',
          'end-a-support-session-from-the-banner',
          'see-a-platform-announcement',
        ],
      },
    ]
    for (const w of withdrawn) {
      const m = HUB_MODULES_UNDER_GATE.find((x) => x.moduleId === w.moduleId)!
      for (const rowId of w.rows) {
        const row = m.rows.find((r) => r.id === rowId)
        expect(row, `${w.moduleId}/${rowId} no longer exists`).toBeDefined()
        expect(row!.surface, `${w.moduleId}/${rowId}`).toBe('chrome')
      }
    }
  })

  it('every module’s rail offer matches the MEANING of Unavailable, or is a pinned exception', () => {
    const unexplained: string[] = []
    for (const m of HUB_MODULES_UNDER_GATE) {
      if (m.moduleId === null) continue
      const definition = DOH_MODULES.find((d) => d.id === m.moduleId)!
      const reaching: readonly string[] = definition.rolesReaching
      const exception = DERIVATION_EXCEPTIONS.find((e) => e.moduleId === m.moduleId)
      const excepted: readonly TenantRoleId[] = exception?.roles ?? []
      for (const role of TENANT_ROLE_IDS) {
        const holdsSomething = HOLDERS(m).includes(role)
        const offered = reaching.includes(role)
        if (holdsSomething === offered) continue
        if (excepted.includes(role)) continue
        unexplained.push(`${m.moduleId}/${role}: holds=${holdsSomething} offered=${offered}`)
      }
    }
    expect(unexplained, 'a role withheld from a module it holds capability on, unexplained').toEqual([])
  })

  it('every pinned exception is still real, and still caused by the rows it names', () => {
    // The other direction: an exception that has stopped being true is a
    // silent licence. If a module's matrix changes so the disagreement is
    // gone, or so a DIFFERENT row causes it, this goes red.
    for (const e of DERIVATION_EXCEPTIONS) {
      const m = HUB_MODULES_UNDER_GATE.find((x) => x.moduleId === e.moduleId)!
      const definition = DOH_MODULES.find((d) => d.id === e.moduleId)!
      const reaching: readonly string[] = definition.rolesReaching
      for (const role of e.roles) {
        expect(reaching.includes(role), `${e.moduleId}: ${role} is now offered the route`).toBe(false)
        const holdingRows = screenRows(m)
          .filter((r) => r.cells.some((c) => c.role === role && HOLDS.has(c.status)))
          .map((r) => r.id)
        expect(holdingRows.length, `${e.moduleId}/${role} no longer holds anything`).toBeGreaterThan(0)
        for (const rowId of holdingRows) {
          expect(e.rows, `${e.moduleId}/${role} now holds ${rowId}, which the exception does not name`).toContain(rowId)
        }
      }
      expect(e.why.trim(), `${e.moduleId} has no recorded reason`).not.toBe('')
    }
  })

  it('PLANTED: a chrome-only holding does NOT read as reach, and the same row as `screen` does', () => {
    // The correction, proved able to fail in both directions rather than
    // stated. `HOLDERS` is run over a synthesised module: one row a role
    // holds, one row it does not, and the only thing that changes between
    // the two halves is `surface`. Before the filter landed, both halves
    // returned the same answer -- which is exactly how two chrome rows
    // became two pinned findings against production code.
    const row = (id: string, surface: MatrixRowSurface, holder: TenantRoleId): NormalisedRow => ({
      id,
      label: id,
      surface,
      rowReason: 'probe',
      cells: TENANT_ROLE_IDS.map((role) => ({
        role,
        status: (role === holder ? 'Allowed' : 'Unavailable') as CellStatus,
        reason: 'probe',
        rawStatus: 'probe',
      })),
    })
    const probe = (surface: MatrixRowSurface): HubModuleUnderGate => ({
      slug: 'probe',
      moduleId: null,
      rows: [row('own-screen-row', 'screen', 'TENANT_ADMIN'), row('banner-row', surface, 'WORKER')],
    })

    expect(HOLDERS(probe('chrome')), 'a chrome row was counted as module reach').toEqual(['TENANT_ADMIN'])
    expect(HOLDERS(probe('another-surface'))).toEqual(['TENANT_ADMIN'])
    // And the filter is not simply dropping everything: reclassify the very
    // same row to `screen` and the Worker holds the module.
    expect(HOLDERS(probe('screen'))).toEqual(['TENANT_ADMIN', 'WORKER'])
  })

  it('PLANTED VIOLATION: a token-derived withholding with no pinned reason trips the gate', () => {
    // The predicate, run over a synthesised module: a role holding a
    // capability while the rail withholds the route, with no exception.
    const holds = ['TENANT_ADMIN', 'SUPERVISOR'] as const
    const offered = ['TENANT_ADMIN'] as const
    const excepted: readonly TenantRoleId[] = []
    const unexplained = TENANT_ROLE_IDS.filter(
      (role) =>
        holds.includes(role as (typeof holds)[number]) !== offered.includes(role as (typeof offered)[number]) &&
        !excepted.includes(role),
    )
    expect(unexplained).toEqual(['SUPERVISOR'])
  })

  it('no module withholds a route from a role that holds EVERY capability on it', () => {
    // The extreme case the token rule could produce and nothing else
    // catches: one `Unavailable` cell withholding a module from its
    // heaviest user. Non-vacuous — there are eight modules to check.
    const absurd: string[] = []
    for (const m of HUB_MODULES_UNDER_GATE) {
      if (m.moduleId === null) continue
      const reaching: readonly string[] = DOH_MODULES.find((d) => d.id === m.moduleId)!.rolesReaching
      for (const role of TENANT_ROLE_IDS) {
        if (reaching.includes(role)) continue
        const rows = screenRows(m)
        const held = rows.filter((r) => r.cells.some((c) => c.role === role && HOLDS.has(c.status))).length
        if (held === rows.length) absurd.push(`${m.moduleId}/${role}`)
      }
    }
    expect(absurd).toEqual([])
  })
})

describe('slice 4 gate 5: every screen pointer resolves to content that exists', () => {
  /* THE DEFECT. Four screen sentences pointing at content elsewhere were
   * found across four modules — one of them CREATED BY THE FIX FOR ANOTHER
   * — and the tests covering them iterated an array asserting each element
   * renders, which is structurally incapable of noticing a MISSING element.
   *
   * WHAT THIS GATE CAN AND CANNOT DO. A generic gate cannot tell which
   * prose sentence points at which panel entry; that claim is in prose, and
   * a gate that tried would either be vacuous or would pin prose. The
   * per-module suites pin those. What IS mechanisable is the three pointer
   * classes that are machine-readable on the built page, and all three read
   * `out/hub/**` rather than the source. */

  function danglingHrefs(pages: readonly { slug: string; doc: Document }[]): string[] {
    const out: string[] = []
    for (const { slug, doc } of pages) {
      for (const a of doc.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href')!
        if (!href.startsWith('/') || href.startsWith('//')) continue
        const target = join('out', ...href.split('/').filter((p) => p !== ''), 'index.html')
        if (!existsSync(target)) out.push(`${slug} → ${href}`)
      }
    }
    return out
  }

  function unknownModuleIds(pages: readonly { slug: string; doc: Document }[]): string[] {
    const known = new Set<string>([
      ...DOH_MODULES.map((m) => m.id),
      ...DOH_OUT_OF_SLICE_MODULES.map((m) => m.id),
    ])
    const out: string[] = []
    for (const { slug, doc } of pages) {
      for (const m of (doc.body.textContent ?? '').matchAll(/\bMOD-DOH-\d+\b/g)) {
        if (!known.has(m[0])) out.push(`${slug} names ${m[0]}`)
      }
    }
    return out
  }

  /**
   * The panels a screen sentence points at BY NAME. Where the page's own
   * text points at one, the page must carry that panel with at least one
   * entry — the "missing element" half the iterate-the-array tests could
   * not see.
   */
  const NAMED_PANELS: readonly { label: RegExp; pointer: RegExp }[] = [
    { label: /^Unspecified in source$/i, pointer: /unspecified panel|unspecified in source/i },
    { label: /^Unresolved in source$/i, pointer: /unresolved panel|unresolved in source/i },
    { label: /^Conflicts in the source$/i, pointer: /conflicts in the source/i },
  ]

  function unresolvedPanelPointers(pages: readonly { slug: string; doc: Document }[]): string[] {
    const out: string[] = []
    for (const { slug, doc } of pages) {
      const text = doc.body.textContent ?? ''
      for (const { label, pointer } of NAMED_PANELS) {
        if (!pointer.test(text)) continue
        const region = [...doc.querySelectorAll('section[aria-label]')].find((s) =>
          label.test(s.getAttribute('aria-label') ?? ''),
        )
        if (region === undefined) {
          out.push(`${slug}: points at ${label.source} and renders no such panel`)
          continue
        }
        const entries = region.querySelectorAll('li').length + region.querySelectorAll('dt').length
        if (entries === 0) out.push(`${slug}: points at ${label.source} and the panel is empty`)
      }
    }
    return out
  }

  it('reads every built Hub page and finds real pointers on them', () => {
    const pages = builtHubPages()
    expect(pages).toHaveLength(authoredHubRouteCount())
    // Vacuity guards, one per class.
    const hrefs = pages.reduce((n, { doc }) => n + doc.querySelectorAll('a[href^="/"]').length, 0)
    expect(hrefs, 'no internal links to resolve').toBeGreaterThan(20)
    const ids = pages.reduce((n, { doc }) => n + [...(doc.body.textContent ?? '').matchAll(/\bMOD-DOH-\d+\b/g)].length, 0)
    expect(ids, 'no module ids named on any page').toBeGreaterThan(8)
    const pointing = pages.filter(({ doc }) =>
      NAMED_PANELS.some((p) => p.pointer.test(doc.body.textContent ?? '')),
    )
    // This read `toBe(9)` -- one page per slice-4 Hub route -- which made it a
    // headcount of the routes that existed the day it was written rather than a
    // claim about pointers. Slice 6 added five routes and it went red without a
    // single pointer having changed.
    //
    // The claim worth keeping: no named panel is unreachable. A panel this build
    // declares and no page points at is a panel nobody can get to.
    for (const panel of NAMED_PANELS) {
      const reached = pages.filter(({ doc }) => panel.pointer.test(doc.body.textContent ?? ''))
      expect(reached.length, `no page points at ${String(panel.label)}`).toBeGreaterThan(0)
    }
    expect(pointing.length, 'no page points at any named panel').toBeGreaterThan(0)
  })

  it('every internal link resolves to an exported page', () => {
    expect(danglingHrefs(builtHubPages())).toEqual([])
  })

  it('every module id a screen names resolves to a known module', () => {
    expect(unknownModuleIds(builtHubPages())).toEqual([])
  })

  it('every page pointing at a named panel renders it, non-empty', () => {
    expect(unresolvedPanelPointers(builtHubPages())).toEqual([])
  })

  it.each([
    [
      'a dangling link',
      '<html><body><a href="/hub/no-such-module/">Open it</a></body></html>',
      (p: { slug: string; doc: Document }[]) => danglingHrefs(p),
    ],
    [
      'a module id that resolves to nothing',
      '<html><body><p>See MOD-DOH-99 for the rest.</p></body></html>',
      (p: { slug: string; doc: Document }[]) => unknownModuleIds(p),
    ],
    [
      'a pointer at a panel that is not there',
      '<html><body><p>Recorded in the unresolved panel below.</p></body></html>',
      (p: { slug: string; doc: Document }[]) => unresolvedPanelPointers(p),
    ],
    [
      'a pointer at a panel that is EMPTY — the missing-element case',
      '<html><body><p>See the unspecified panel below.</p><section aria-label="Unspecified in source"><ul></ul></section></body></html>',
      (p: { slug: string; doc: Document }[]) => unresolvedPanelPointers(p),
    ],
  ])('PLANTED VIOLATION: %s trips the gate', (_what, html, check) => {
    withPlanted(OUT_HUB, 'index.html', html, () => {
      const probe = builtHubPages().filter((p) => p.slug === OWN_PROBE_DIR)
      expect(probe, 'the probe page was not picked up by the scan').toHaveLength(1)
      expect(check(probe)).not.toEqual([])
    })
    const pages = builtHubPages()
    expect([...danglingHrefs(pages), ...unknownModuleIds(pages), ...unresolvedPanelPointers(pages)]).toEqual([])
  })

  it('and a pointer at a panel that IS there, with entries, does not trip it', () => {
    withPlanted(
      OUT_HUB,
      'index.html',
      '<html><body><p>See the unspecified panel below.</p><section aria-label="Unspecified in source"><ul><li>An open question.</li></ul></section></body></html>',
      () => {
        const probe = builtHubPages().filter((p) => p.slug === OWN_PROBE_DIR)
        expect(unresolvedPanelPointers(probe)).toEqual([])
      },
    )
  })
})

describe('slice 4 gate 6: no live ungated write control on any route', () => {
  /* THE DEFECT — this slice's only Critical. `BannerRegion`'s End-session
   * button rendered LIVE AND UNGATED on eight of nine Hub routes while the
   * owning route refused it with a named reason: a tenant could end, from
   * another module's screen, the very session the owning route was
   * refusing. It was fixed by computing the refusal ONCE, in `HubShell`.
   *
   * The fix's own author asked for this gate as the durable answer, because
   * `endSessionDisabledReason` is OPTIONAL BY NECESSITY — `src/ui/**` holds
   * no policy, so the component cannot compute it and a string is not a
   * decision — and a future caller that forgets it gets a live control
   * back. So the gate is on the CALLERS, not on the component.
   *
   * THREE CEILINGS, stated rather than hidden. Two of them were found by
   * review and were not written down; none is exploited by the build today,
   * and the first assertion below pins an EXACT two-file set, so a third
   * renderer evading any of them would have to also leave that set
   * undisturbed.
   *
   * 1. PER FILE, NOT PER CALL SITE. A file that gates one banner render and
   *    not a second would pass. Narrowed by the second assertion below,
   *    which pins the End-session control to ONE construction site.
   *
   * 2. `BANNER_RENDER` MATCHES `[^>]*` BETWEEN THE TAG NAME AND `banners=`,
   *    so it cannot see a render whose earlier props contain a `>` --
   *    an inline arrow function is the ordinary way that happens:
   *    `<BannerRegion onX={() => f()} banners={...} />`. Such a render is
   *    invisible to this gate, which means it is neither required to
   *    compute the refusal NOR able to disturb the pinned file set. A
   *    balanced-JSX matcher is the fix if one is ever written; today every
   *    call site puts `banners` first and takes no function prop.
   *
   * 3. THE SCAN ROOT IS `app/hub` ONLY. `hubSources()` walks the route
   *    tree, so `src/ui/doh/HubChrome.tsx` -- which renders its own
   *    `<BannerRegion>` -- is outside it and is not checked. That is
   *    deliberate rather than an oversight to leave unsaid: `src/ui/**`
   *    holds no policy and cannot compute a decision, so requiring
   *    `endSessionRefusalFor` there would be requiring the wrong thing.
   *    The consequence is that a component under `src/ui/**` growing a
   *    second, ungated banner render is this gate's blind spot; what stands
   *    in its place is that `HubChrome` takes the refusal as a PROP from
   *    its caller, and every caller is inside the walked tree. */

  const BANNER_RENDER = /<(BannerRegion|HubChrome)\b[^>]*\bbanners=/s

  // A CALL, not a mention. The first draft of this gate asked whether the
  // source `.includes('endSessionRefusalFor')`, and proving it could fail
  // showed it could not: renaming the export to `endSessionRefusalForXX`
  // and replacing the call with `null` left the substring in place and the
  // gate green. That is the FIFTH time in this build a check has matched a
  // token inside a larger term it does not mean -- after `signed` in
  // "signed-in", `18` in `MOD-SA-18`, `Worker` in "Worker-Shift" and
  // `count` in "accountState" -- and the standing rule is the same: match
  // the semantic unit. Here the semantic unit is the invocation, which is
  // also the thing actually required: an import that is never called gates
  // nothing.
  const GATE_COMPUTED = /\bendSessionRefusalFor\s*\(/

  function ungatedBannerRenderers(sources: readonly { file: string; src: string }[]): string[] {
    return sources
      .filter(({ src }) => BANNER_RENDER.test(src))
      .filter(({ src }) => !GATE_COMPUTED.test(src))
      .map(({ file }) => file)
  }

  // TIMEOUT DIAGNOSIS (contention, not a hang, not extra work). The five
  // cases below are the ones in this file whose cost is a real file-tree
  // walk: each calls `hubSources()` (reads and comment-strips every file
  // under `app/hub`) at least once, and "exactly ONE construction site"
  // walks `app` AND `src` in full. RULED OUT: a hang or a defect in the
  // gate — every invocation here and in isolation has always returned with
  // the expected result, never blocked, and the `release` project's own
  // `fileParallelism: false` means nothing else in this run is racing these
  // reads. WHAT IT IS: wall-clock waiting for a CPU slot. Measured directly,
  // isolating just this `describe` block (`vitest -t "slice 4 gate 6"`)
  // against three concurrent solo copies of this same file (the four-way
  // load this build's release suite sees when several agents' suites run
  // together): 8.48s of USER time total across all five cases, against
  // 104.55s of REAL time (11% CPU) — the same flat amount of work, just
  // parked waiting for the scheduler. Individual cases in that run: 6.29s,
  // 14.79s (the app+src walk), 9.62s and 9.66s (each `withPlanted` case
  // calls `hubSources()` twice) against the unmodified 5000ms default —
  // four of five failed on timing alone, none on the assertion. So the fix
  // is the same one this build already uses for this exact shape
  // (`tests/component/stu-shell.test.tsx`'s node-spawn case): a per-test
  // override, not the project's global `testTimeout`, so the other fifty
  // cases in this file — none of which showed any sign of the edge across
  // three solo runs at 14%-40% CPU — keep the 5s default that catches a
  // genuine hang. 30_000 matches the value already established for this
  // purpose elsewhere in the suite (`vitest.config.ts`'s `component`
  // project; `tests/component/sa-tenant-metrics.test.tsx`) and clears the
  // worst measured case (14.79s) with better than 2x headroom.
  it(
    'every file that renders the banner region computes the End-session refusal',
    () => {
      const sources = hubSources()
      const renderers = sources.filter(({ src }) => BANNER_RENDER.test(src)).map(({ file }) => file)
      // Vacuity guard: with no renderer found, "all renderers are gated" is
      // true and empty — which is precisely how the Critical survived nine
      // routes in the first place.
      expect(renderers.sort(), 'the set of banner-rendering files changed').toEqual([
        join(HUB_ROOT, 'HubShell.tsx'),
        join(HUB_ROOT, 'tenant-view-of-platform-administration', 'PlatformAdministrationScreen.tsx'),
      ])
      expect(ungatedBannerRenderers(sources)).toEqual([])
    },
    30_000,
  )

  it(
    'the End-session control has exactly ONE construction site',
    () => {
      // `SupportSessionBanner` is a discriminated union whose
      // `normal-support-session` arm is the only one carrying `onEndSession`.
      // One construction site is what makes a single gate sufficient; a
      // second would be a second control to forget.
      const builders = walk('app')
        .concat(walk('src'))
        .filter((f) => /\.tsx?$/.test(f))
        .filter((f) => {
          const src = stripComments(readFileSync(f, 'utf8'))
          return /kind:\s*'support-session'/.test(src) && /onEndSession\s*,/.test(src)
        })
        .sort()
      expect(builders, 'the End-session control is built in more than one place').toEqual([
        join('app', 'hub', 'banner-fixtures.ts'),
      ])
    },
    30_000,
  )

  it(
    'PLANTED VIOLATION: a route rendering the banner region without the gate trips it',
    () => {
      withPlanted(
        HUB_ROOT,
        'Probe.tsx',
        "import { BannerRegion } from '@/ui/doh/BannerRegion'\n" +
          'export const P = () => <BannerRegion banners={[]} />\n',
        (probe) => {
          expect(ungatedBannerRenderers(hubSources())).toContain(probe)
        },
      )
      expect(ungatedBannerRenderers(hubSources())).toEqual([])
    },
    30_000,
  )

  it(
    'PLANTED VIOLATION: importing the gate without CALLING it trips it too',
    () => {
      // The weakness this gate was found to have, kept as a case: a route
      // that names the refusal and never computes one has a live control.
      withPlanted(
        HUB_ROOT,
        'Probe.tsx',
        "import { BannerRegion } from '@/ui/doh/BannerRegion'\n" +
          "import { endSessionRefusalFor } from './HubShell'\n" +
          'export type Unused = typeof endSessionRefusalFor\n' +
          'export const P = () => <BannerRegion banners={[]} />\n',
        (probe) => {
          expect(ungatedBannerRenderers(hubSources())).toContain(probe)
        },
      )
      expect(ungatedBannerRenderers(hubSources())).toEqual([])
    },
    30_000,
  )

  it(
    'and the same route WITH the gate computed does not trip it',
    () => {
      withPlanted(
        HUB_ROOT,
        'Probe.tsx',
        "import { BannerRegion } from '@/ui/doh/BannerRegion'\n" +
          "import { endSessionRefusalFor } from './HubShell'\n" +
          "export const P = () => { void endSessionRefusalFor('active'); return <BannerRegion banners={[]} /> }\n",
        () => {
          expect(ungatedBannerRenderers(hubSources())).toEqual([])
        },
      )
    },
    30_000,
  )
})

/* ==================================================================== *
 * GATE 7 — a safety breach is refused AS A SAFETY REFUSAL.
 *
 * WHY THIS GATE EXISTS AT ALL, given the answer is a refusal either way.
 *
 * The slice-4 spine ruled that safety controls win by PRECEDENCE and not by
 * position, because the source's definition list puts them ninth. Half of
 * that ruling was right and half was not: the source also carries a numbered
 * workflow, and its step 2 is a statement about the REFUSAL REASON, not only
 * about whether the request is refused --
 *
 *   L14532  "Safety controls are evaluated first. A request that would
 *            override a specification gate or the evaluation gate, or that
 *            would breach a platform invariant, is refused immediately and
 *            recorded as a safety refusal."
 *
 * Under the old encoding a safety control was declared as `deniedRoles:
 * <every role>`, so MOD-DOH-09's "Removing the last Tenant Admin" refusal
 * came back EXPLICIT_DENY at BASE_ROLE and `SCR-DOH-ROLE-04` rendered "An
 * explicit denial applies to this role, and an explicit denial always wins"
 * under a heading that said Safety controls. Two separate precedence rules
 * exist in the source (L14526, L14527) and the reader was shown the wrong
 * one. The same request naming another tenant's record came back
 * TENANT_MISMATCH, because the old encoding sat behind tenant isolation.
 *
 * THE EXPECTATION IS NOT DERIVED FROM THE FIELD UNDER TEST. The order this
 * gate enforces is parsed out of the frozen source's own numbered steps at
 * run time; `EVALUATION_ORDER` is then compared against it. Moving the
 * constant and a written-down copy of the constant together does not survive
 * that, because there is no written-down copy.
 * ==================================================================== */

describe('slice 4 gate 7: a safety breach is refused as a safety refusal', () => {
  const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
  const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
  const WORKFLOW_HEADING = 'Numbered workflow — one access decision, end to end.'

  /** The opening words each workflow step uses for the condition it runs. */
  const STEP_OPENERS: readonly (readonly [string, AccessCondition])[] = [
    ['Safety controls', 'safety-controls'],
    ['Role permission', 'role-permission'],
    ['Assigned scope', 'assigned-scope'],
    ['Tenant entitlement', 'tenant-entitlement'],
    ['Object state', 'object-state'],
    ['Qualification', 'qualification'],
    ['Active grants', 'active-grant'],
    ['Device and connectivity', 'device-and-connectivity'],
    ['Segregation of duties', 'segregation-of-duties'],
  ]

  const sourceLines = (): readonly string[] =>
    readFileSync(SOURCE_PATH, 'utf8').split('\n')

  /** The numbered steps of the workflow, in the order the source writes them. */
  function workflowSteps(lines: readonly string[]): readonly string[] {
    const at = lines.findIndex((l) => l.includes(WORKFLOW_HEADING))
    expect(at, `the frozen source no longer carries "${WORKFLOW_HEADING}"`).toBeGreaterThan(-1)
    const steps: string[] = []
    for (let i = at + 1; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (/^\d+\.\s/.test(line)) steps.push(line)
      else if (steps.length > 0 && line.trim() !== '') break
    }
    return steps
  }

  it('reads the frozen bytes, so a drifted copy cannot soften this gate', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
    expect(createHash('sha256').update(readFileSync(SOURCE_PATH)).digest('hex')).toBe(
      SOURCE_SHA256,
    )
  })

  it('finds the numbered workflow, and its safety step says what is recorded', () => {
    const steps = workflowSteps(sourceLines())
    expect(steps).toHaveLength(11)
    const safety = steps[1] ?? ''
    expect(safety).toContain('Safety controls are evaluated first.')
    // The clause the whole gate rests on. Without it the source would be
    // stating an order and nothing about the reason, and this gate would be
    // decoration over a distinction with no observable consequence.
    expect(safety).toContain('recorded as a safety refusal')
  })

  it('EVALUATION_ORDER is the source workflow order, parsed rather than restated', () => {
    const steps = workflowSteps(sourceLines())
    const matched: AccessCondition[] = []
    let unmatched = 0
    for (const step of steps) {
      const body = step.replace(/^\d+\.\s*/, '')
      const hit = STEP_OPENERS.find(([opener]) => body.startsWith(opener))
      if (hit) matched.push(hit[1])
      else unmatched += 1
    }
    // Step 1 (the request arriving) and step 11 (the audit write) name no
    // condition. Pinning the count stops a step that quietly stopped matching
    // from shrinking the order without anything going red.
    expect(unmatched, 'exactly two workflow steps name no access condition').toBe(2)
    expect(matched).toEqual([...EVALUATION_ORDER])
    expect([...matched].sort()).toEqual([...ACCESS_CONDITIONS].sort())
  })

  /* ---- the behaviour ------------------------------------------------- */

  /** Null when the decision IS a safety refusal; the offending label if not. */
  const nonSafetyReason = (d: PermissionDecision): string | null =>
    d.stage === 'SAFETY_CONTROLS' && d.reasonCode === 'SAFETY_CONTROL'
      ? null
      : `${d.stage}/${d.reasonCode}`

  const decide09 = (req: AccessRequest): PermissionDecision =>
    evaluateAccess(req, fixtureContext('TENANT_ADMIN'))

  const SAFETY_SCENARIO = refusalScenario('safety-controls')

  /**
   * The shipped request with its safety declaration removed — the base for
   * every plant below, so a plant differs from the real thing in exactly the
   * one field this gate is about.
   */
  const WITHOUT_SAFETY: AccessRequest = (() => {
    const { safetyControl, ...rest } = SAFETY_SCENARIO.request
    void safetyControl
    return rest
  })()

  /** The same request, also failing every other condition the source lists. */
  const alsoFailingEverythingElse = (req: AccessRequest): AccessRequest => ({
    ...req,
    requiredSites: ['SITE-NOWHERE'],
    requiredAreas: ['AREA-NOWHERE'],
    requiredTemporaryGrant: 'GRANT-NOBODY-HOLDS',
    requiredEntitlement: 'entitlement-no-tier-carries',
    allowedObjectStates: ['active'],
    objectState: 'archived',
    requiredQualifications: ['QUAL-NOBODY-HOLDS'],
    requiresTrustedDevice: true,
    makerCheckerOf: 'ACT-DOH-VIEWER',
    resourceTenant: tenantId('TEN-SOMEBODY-ELSE'),
  })

  it('the shipped MOD-DOH-09 safety refusal comes back as a safety refusal', () => {
    const d = decide09(SAFETY_SCENARIO.request)
    expect(isRefusal(d)).toBe(true)
    expect(nonSafetyReason(d)).toBeNull()
    expect(d.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })

  it('and still does when the same request fails every other condition too', () => {
    const d = decide09(alsoFailingEverythingElse(SAFETY_SCENARIO.request))
    expect(nonSafetyReason(d)).toBeNull()
  })

  it(
    'PLANTED VIOLATION: the pre-correction encoding (deniedRoles) trips the gate',
    () => {
      const d = decide09({
        ...WITHOUT_SAFETY,
        deniedRoles: [...WITHOUT_SAFETY.allowedRoles],
      })
      // Still refused -- the allow/deny answer never differed. The REASON did,
      // and it is exactly the one a reader was shown before this correction.
      expect(isRefusal(d)).toBe(true)
      expect(nonSafetyReason(d)).toBe('BASE_ROLE/EXPLICIT_DENY')
    },
  )

  it(
    'PLANTED VIOLATION: cross-tenant, the old encoding lost even the deny reason',
    () => {
      const planted: AccessRequest = {
        ...WITHOUT_SAFETY,
        deniedRoles: [...WITHOUT_SAFETY.allowedRoles],
        resourceTenant: tenantId('TEN-SOMEBODY-ELSE'),
      }
      expect(nonSafetyReason(decide09(planted))).toBe('TENANT_ISOLATION/TENANT_MISMATCH')
      // The corrected encoding, same request: safety decides first.
      expect(
        nonSafetyReason(
          decide09({ ...SAFETY_SCENARIO.request, resourceTenant: tenantId('TEN-SOMEBODY-ELSE') }),
        ),
      ).toBeNull()
    },
  )

  it('PLANTED VIOLATION: dropping the declaration stops the refusal entirely', () => {
    // Proof that `safetyControl` is the only thing refusing this request, so
    // the assertions above are about that field and not about a role rule
    // quietly doing the work behind it.
    expect(isRefusal(decide09(WITHOUT_SAFETY))).toBe(false)
  })

  it('the refusal a reader sees never names the other precedence rule', () => {
    const d = decide09(SAFETY_SCENARIO.request)
    expect(d.explanation).not.toMatch(/explicit deni?al/i)
    expect(d.explanation).toMatch(/safety control/i)
  })
})

describe('slice 4 gates: the file itself', () => {
  // Carried from slice 3, where THREE separate patch scripts rewrote a gate
  // with `write(src.slice(0, start) + replacement)` and silently truncated
  // every gate defined after it. Gate 9 vanished that way and nothing
  // asserted the root-unavailable freeze for several commits; gate 14 went
  // the same way minutes later. Both times the count still looked right,
  // because the check was how many gates existed rather than WHICH.
  it('defines gates 1..N with no gap, so a truncating edit cannot hide one', () => {
    const src = readFileSync(join('tests', 'coverage', 'slice-04-gates.test.ts'), 'utf8')
    const numbers = [...src.matchAll(/^describe\('slice 4 gate (\d+):/gm)].map((m) => Number(m[1]))
    expect(numbers.length, 'no gates found').toBeGreaterThan(0)
    expect(numbers, 'gate numbers are not a gapless 1..N sequence').toEqual(
      Array.from({ length: numbers.length }, (_, i) => i + 1),
    )
  })

  it('leaves no probe behind', () => {
    for (const root of PROBE_ROOTS) {
      expect(existsSync(join(root, OWN_PROBE_DIR)), `${root} still holds this run's probe`).toBe(false)
    }
  })
})

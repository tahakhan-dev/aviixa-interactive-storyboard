import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { stripComments } from './strip-comments'
import { DOH_MODULES, DOH_OUT_OF_SLICE_MODULES, type DohModuleId } from '@/surfaces/doh/modules'
import { WriteControl } from '@/ui/WriteControl'
import { decide, deny, type PermissionDecision } from '@/policy/decision'

import { CONTROL_MATRIX as DEVICES_MATRIX } from '../../app/hub/devices/fixtures'
import { CONTROL_MATRIX as SSO_MATRIX } from '../../app/hub/integration-surface/fixtures'
import {
  CONTROL_MATRIX as LOCATIONS_MATRIX,
  visibleSiteIds,
  visibleAreaIds,
} from '../../app/hub/location-configuration/fixtures'
import { PERMISSION_MATRIX } from '../../app/hub/permissions-roles-and-access/fixtures'
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
 */
const OWN_PROBE_DIR = `.zz-probe-${process.pid}`
const isForeignProbe = (entry: string): boolean =>
  /^\.zz-probe-\d+$/.test(entry) && entry !== OWN_PROBE_DIR

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

/**
 * Plant a violation on the real filesystem, prove the gate catches it, then
 * remove it and prove the gate goes quiet again.
 *
 * Creation and the write are inside the `try`, so a failure partway through
 * still cleans up. The module-level `process.on('exit', ...)` below is a
 * second, independent path for a crash that skips a pending `finally`; a
 * hard kill bypasses both, and a probe orphaned that way is handled by the
 * two properties above instead of by cleanup — invisible to `tsc` and to
 * `next build`, and foreign to every later run's walk.
 */
function withPlanted(root: string, name: string, contents: string, assertCaught: (probe: string) => void): void {
  const dir = join(root, OWN_PROBE_DIR)
  const probe = join(dir, name)
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(probe, contents)
    assertCaught(probe)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
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
 * THREE SHAPES, not one. `slug`, `{status: Record<Role, kebab>}`,
 * `{byRole: Record<Role, {status: TitleCase, detail}>}` and
 * `{cells: Record<Role, {outcome: camelCase, cause}>}` all ship in this
 * slice, and four of the nine carry no per-cell reason at all. Normalising
 * once here is what lets gates 1 and 4 ask one question of all nine rather
 * than nine questions — and a tenth shape lands as an UNMAPPED status,
 * which gate 1 fails on rather than silently skipping.
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

  return {
    id: String(raw.id),
    label: String(raw.control ?? raw.label),
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

  it('the normalised matrices are non-empty and cover all nine Hub routes', () => {
    // A vacuity guard on everything below: every assertion in this gate
    // iterates these rows, and an empty iteration passes silently.
    expect(HUB_MODULES_UNDER_GATE).toHaveLength(9)
    for (const m of HUB_MODULES_UNDER_GATE) {
      expect(m.rows.length, `${m.slug} has no matrix rows`).toBeGreaterThan(0)
      for (const row of m.rows) expect(row.cells).toHaveLength(5)
    }
    // Every in-slice module is under gate, read out of the compile-time
    // exhaustive `DOH_MODULES` rather than from a hand list here.
    const gated = new Set(HUB_MODULES_UNDER_GATE.map((m) => m.moduleId))
    for (const m of DOH_MODULES) expect(gated.has(m.id), `${m.id} is not under gate`).toBe(true)
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
  function unreasonedInertControls(pages: readonly { slug: string; doc: Document }[]): string[] {
    const out: string[] = []
    for (const { slug, doc } of pages) {
      for (const el of doc.querySelectorAll('[aria-disabled="true"],[disabled]')) {
        const described = el.getAttribute('aria-describedby')
        const target = described === null ? null : doc.getElementById(described)
        if (target === null || (target.textContent ?? '').trim() === '') {
          out.push(`${slug}: <${el.tagName.toLowerCase()}> "${(el.textContent ?? '').slice(0, 40)}"`)
        }
      }
    }
    return out
  }

  it('every non-actionable element on every built route carries a resolving reason', () => {
    const pages = builtHubPages()
    expect(pages.length, 'no built Hub pages').toBe(9)
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
  ])('PLANTED VIOLATION: an inert control with %s trips the gate', (_what, html) => {
    withPlanted(OUT_HUB, 'index.html', html, () => {
      const { document: doc } = new JSDOM(
        readFileSync(join(OUT_HUB, OWN_PROBE_DIR, 'index.html'), 'utf8'),
      ).window
      expect(unreasonedInertControls([{ slug: OWN_PROBE_DIR, doc }])).not.toEqual([])
    })
    expect(unreasonedInertControls(builtHubPages())).toEqual([])
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
   * therefore cannot see, and which this gate catches. */

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

  it('walks every Hub source file, and the walk is wider than any hand list', () => {
    const walked = hubSources().map((s) => s.file)
    expect(walked.length, 'the directory walk found nothing').toBeGreaterThan(25)

    // Every path a per-module suite names by hand must still exist. A
    // renamed file leaves a stale entry in a hardcoded list and the list
    // has no way to notice; this does.
    const handNamed = new Set<string>()
    for (const dir of ['tests/unit', 'tests/component']) {
      for (const f of readdirSync(dir)) {
        for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/app\/hub\/[A-Za-z0-9./-]+\.tsx?/g)) {
          handNamed.add(m[0]!)
        }
      }
    }
    expect(handNamed.size, 'no hand-named Hub paths found — the check below is vacuous').toBeGreaterThan(10)
    const stale = [...handNamed].filter((p) => !existsSync(p))
    expect(stale, 'per-module suites naming Hub files that no longer exist').toEqual([])
  })

  it('no three-digit SCR-DOH-NNN literal anywhere under app/hub/', () => {
    expect(threeDigitOffenders()).toEqual([])
  })

  it('PLANTED VIOLATION: a file the module’s own hardcoded list cannot see trips this gate', () => {
    // Planted INSIDE `worker-lifecycle-and-qualifications/`, the exact
    // module whose `MY_FILES` names three paths. That list does not name
    // this file; the directory walk does.
    const moduleDir = join(HUB_ROOT, 'worker-lifecycle-and-qualifications')
    const myFiles = readFileSync(join('tests', 'unit', 'doh-workers.test.ts'), 'utf8')
    withPlanted(moduleDir, 'Probe.tsx', 'export const P = () => <p>SCR-DOH-008</p>\n', (probe) => {
      expect(myFiles, 'the module’s hardcoded list now names the probe').not.toContain('Probe.tsx')
      expect(threeDigitOffenders()).toContain(probe)
    })
    expect(threeDigitOffenders()).toEqual([])
  })

  it('and the two-digit catalogue-B form does NOT trip it', () => {
    withPlanted(HUB_ROOT, 'Probe.tsx', 'export const P = () => <p>SCR-DOH-08</p>\n', () => {
      expect(threeDigitOffenders()).toEqual([])
    })
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
   * `DOH_MODULES.rolesReaching` is derived from the TOKEN — its own doc
   * comment says so: "a role is withheld exactly when that module's own
   * permission matrix marks any cell in its column `Unavailable`". This
   * gate asks the MEANING question instead: does the module withhold every
   * capability of the module from that role?
   *
   * On three of eight modules the two answers differ, and each difference
   * is pinned below with the rows that cause it. Every one is currently
   * harmless — D11 or chrome ownership rescues the outcome — and every one
   * is a token-derivation defect. Reported, not fixed: this gate measures
   * the build. */

  const HOLDERS = (m: HubModuleUnderGate): TenantRoleId[] =>
    TENANT_ROLE_IDS.filter((role) => m.rows.some((r) => r.cells.some((c) => c.role === role && HOLDS.has(c.status))))

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
    {
      moduleId: 'MOD-DOH-01',
      roles: ['SUPERVISOR', 'QUALITY_MANAGER', 'WORKER'],
      rows: ['see-compliance-message'],
      why: 'The compliance-suspension message is `Allowed` for all five roles because sign-in is blocked for everyone and everyone must be told why (L26886-L26888). It is the Hub CHROME’s suspension slot, reached through the banner region regardless of the rail — not this module’s screen.',
    },
    {
      moduleId: 'MOD-DOH-13',
      roles: ['SUPERVISOR', 'QUALITY_MANAGER'],
      rows: ['see-the-support-session-banner', 'end-a-support-session-from-the-banner', 'see-a-platform-announcement'],
      why: 'The rows where the Supervisor and Quality Manager are `Allowed` are the Hub CHROME’s banner slot (L29194, L29196), not this module’s screen — stated in `DOH_MODULES`’ own comment on this module.',
    },
    {
      moduleId: 'MOD-DOH-04',
      roles: ['WORKER'],
      rows: ['view-worker', 'view-own-certification-alerts'],
      why: 'THE CLEANEST INSTANCE OF THE MISFIRE. One `Unavailable` cell — reading the clearance corpus — withholds the WHOLE module from the Worker, while the Worker holds two capabilities in this matrix. Both are met on the device, not in the Hub, and D11 withholds the surface first, so the outcome is right by a different rule than the one that produced it.',
    },
  ]

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
        const holdingRows = m.rows
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
        const held = m.rows.filter((r) => r.cells.some((c) => c.role === role && HOLDS.has(c.status))).length
        if (held === m.rows.length) absurd.push(`${m.moduleId}/${role}`)
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

  it('reads nine built Hub pages carrying real pointers', () => {
    const pages = builtHubPages()
    expect(pages).toHaveLength(9)
    // Vacuity guards, one per class.
    const hrefs = pages.reduce((n, { doc }) => n + doc.querySelectorAll('a[href^="/"]').length, 0)
    expect(hrefs, 'no internal links to resolve').toBeGreaterThan(20)
    const ids = pages.reduce((n, { doc }) => n + [...(doc.body.textContent ?? '').matchAll(/\bMOD-DOH-\d+\b/g)].length, 0)
    expect(ids, 'no module ids named on any page').toBeGreaterThan(8)
    const pointing = pages.filter(({ doc }) =>
      NAMED_PANELS.some((p) => p.pointer.test(doc.body.textContent ?? '')),
    )
    expect(pointing.length, 'no page points at a named panel').toBe(9)
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
   * Ceiling, stated rather than hidden: this is per FILE, not per call
   * site. A file that gates one banner render and not a second would pass.
   * The second assertion below narrows that by pinning the End-session
   * control to ONE construction site. */

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

  it('every file that renders the banner region computes the End-session refusal', () => {
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
  })

  it('the End-session control has exactly ONE construction site', () => {
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
  })

  it('PLANTED VIOLATION: a route rendering the banner region without the gate trips it', () => {
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
  })

  it('PLANTED VIOLATION: importing the gate without CALLING it trips it too', () => {
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
  })

  it('and the same route WITH the gate computed does not trip it', () => {
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

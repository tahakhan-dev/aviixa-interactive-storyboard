import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { exportedRoutes } from '../e2e/exported-routes'
import { isForeignProbe, presentOrNull } from '../probe-paths'
import { renderedText } from './rendered-text'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES } from '../../src/coverage/descriptors'
import { loadGeneratedRegistry } from '../../src/coverage/registry-loader'
import { SUPPORT_ABSENT_CONTROLS } from '../../app/super-admin/support-access/fixtures'

/**
 * EVERY FIGURE THE CLIENT DOCUMENTS PUBLISH, HELD AGAINST THE ARTEFACT IT
 * DESCRIBES.
 *
 * WHY THIS FILE EXISTS — R7-B13, and it is the root cause of nine other
 * findings. Round 7 audited `docs/client-review-guide.md`,
 * `docs/walkthroughs.md`, `docs/deployment.md` and
 * `docs/screenshots/README.md` for the first time and found nine stale or
 * false claims sitting under a fully green chain, two of them Critical:
 *
 *   - the guide told the reviewer NOT to review eleven shipped screens, on
 *     the ground that `/command-center/` was "a placeholder" with one screen
 *     built. Twelve Command Center routes exist and the word "placeholder"
 *     appears on that page zero times;
 *   - the guide's headline honesty paragraph — sold as "computed rather than
 *     asserted" — read 4,970 rows / 237 demonstrated / seven mounted against
 *     a build of 5,015 / 299 / 10. All three were hand-typed;
 *   - the by-surface table summed to seventeen unbuilt modules where the
 *     build has two;
 *   - three documents published an 85-page export against 102 pages;
 *   - a walkthrough step counted three prohibitions on a page rendering six.
 *
 * WHAT WAS GREEN THE WHOLE TIME. `walkthrough-routes.test.ts` is a sound
 * gate and every route it checks exists — but its subject is ROUTE STRINGS,
 * and it says so itself. `screenshot-manifest.test.ts` compares the
 * manifest's route SET against the export. `client-review-guide.md` and
 * `docs/screenshots/README.md` had no gate of any kind. Round 6's shape at
 * document scale: the gate is scoped to exclude the defect the artefact
 * actually has.
 *
 * THE RULE THIS FILE ENFORCES. **A figure a document states must be
 * checkable against the artefact it describes, or it must not be stated.**
 * Every claim below is EXTRACTED from the document by a pattern that must
 * match exactly once — so deleting the sentence reds, and duplicating it reds
 * — and the extracted value is compared by EQUALITY against a value derived
 * at run time from `exportedRoutes()`, `registries/generated/**`,
 * `docs/screenshots/manifest.json`, or the built page. Never a floor, never a
 * substring, never "greater than".
 *
 * THE ONE BOUNDARY, STATED RATHER THAN LEFT AS A HOLE. Figures written in the
 * PAST TENSE about a corrected defect — "it said 85 pages", "was one build
 * behind on 18 of its 102 rows" — are not checkable against any artefact,
 * because the artefact they describe no longer exists. They are excluded, and
 * every one of them sits inside a sentence naming the correction. Where such
 * a sentence also states a current figure, the current half IS extracted and
 * gated: `against a 102-page export` below is one of those.
 *
 * ORDERING. Its subjects are `out/` and `registries/generated/**` (both
 * rewritten by `build`), the committed screenshot manifest (written only by
 * `pnpm screenshots`, which `verify` does not run), and four hand-written
 * documents under `docs/` (written by nobody in `verify`). It runs in the
 * release project, after `build`, which is the only order in which the
 * comparison means anything — and the asymmetry `walkthrough-routes` relies
 * on holds here for the same reason: a build can make a document wrong and
 * cannot make it right.
 */

const GUIDE = join('docs', 'client-review-guide.md')
const WALKTHROUGHS = join('docs', 'walkthroughs.md')
const DEPLOYMENT = join('docs', 'deployment.md')
const SHOTS_README = join('docs', 'screenshots', 'README.md')
const MANIFEST = join('docs', 'screenshots', 'manifest.json')

/** The four documents this gate covers, by name, so none can be dropped. */
const DOCUMENTS = [GUIDE, WALKTHROUGHS, DEPLOYMENT, SHOTS_README] as const

/**
 * Read once, with every whitespace run collapsed. A markdown document wraps
 * its prose, so a sentence a reader sees as one line is two in the file and a
 * pattern written against the reader's line silently never matches — which is
 * the failure mode where a claim gate quietly stops checking anything. The
 * table rows survive collapsing because their cells are `|`-delimited.
 */
function flat(path: string): string {
  return readFileSync(path, 'utf8').replace(/\s+/g, ' ')
}

/**
 * The value a document publishes for one claim. Exactly-once matching is the
 * non-vacuity guard for every case below: zero matches means the sentence was
 * reworded or deleted and the gate would otherwise pass by checking nothing,
 * and two matches mean a second copy exists that this gate is not comparing.
 */
function stated(path: string, pattern: RegExp): string[] {
  return statedIn(flat(path), path, pattern)
}

/**
 * `stated` over TEXT rather than over a path, so the plant case at the foot of
 * this file can prove permeability without writing to a document a client
 * reads. This build has twice discarded an uncommitted fix by restoring a
 * planted file, and there is nothing here a filesystem plant would prove that
 * a string plant does not: every case above is `extract from text, compare by
 * equality`, and both halves of that are exercised below on the real document
 * bytes with one figure changed.
 */
function statedIn(text: string, path: string, pattern: RegExp): string[] {
  const all = [...text.matchAll(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`))]
  expect(all.length, `${path} — pattern ${pattern.source} matched ${all.length} times, wanted 1`).toBe(1)
  return (all[0] ?? []).slice(1).map((g) => String(g).replace(/,/g, ''))
}

/* ── the derived side ─────────────────────────────────────────────────── */

type ManifestRow = {
  id: string
  route: string
  file: string
  screen: string | null
  moduleIds: string[]
  screenIds: string[]
  featureIds: string[]
  functionIds: string[]
  acceptanceIds: string[]
  identifiersOnPage: string[]
  viewport: { width: number; height: number } | null
  locale: string | null
  theme: string
  bytes: number
}
type Manifest = {
  capturedRoutes: number
  viewport: { width: number; height: number } | null
  buildId: string | null
  fieldsNotCarried: Record<string, string>
  rows: ManifestRow[]
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest
const routes = exportedRoutes('out')

/**
 * Recursive file count and byte total of the export, as `du` would see it —
 * probe-aware and ENOENT-tolerant, by the standing rule `exportedRoutes()`
 * and `slice-2c-gates` already follow. Sibling gates plant scratch probes
 * under `out/` to prove they can fail, and this walk is a COUNT: a foreign
 * probe left in it inflates the file total and reds `docs/deployment.md` for
 * a file that is not part of the export, which is the worst kind of red — one
 * that names the wrong cause. An entry that vanishes between being listed and
 * being stat'd is not a finding either.
 */
function treeSize(dir: string): { files: number; bytes: number } {
  let files = 0
  let bytes = 0
  const entries = presentOrNull(() => readdirSync(dir, { withFileTypes: true }))
  if (entries === null) return { files, bytes }
  for (const entry of entries) {
    if (isForeignProbe(entry.name)) continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = treeSize(p)
      files += sub.files
      bytes += sub.bytes
    } else {
      const stat = presentOrNull(() => statSync(p))
      if (stat === null) continue
      files += 1
      bytes += stat.size
    }
  }
  return { files, bytes }
}

/**
 * Sizes are published to the nearest 5 MiB and gated at that precision, which
 * the documents state beside the figure. Exact bytes would red the chain on
 * every copy edit that changes a page's weight — a gate that reds on work
 * rather than on staleness gets disabled, and a disabled gate is this build's
 * defect shape 1. Five MiB is coarse enough to survive ordinary editing and
 * fine enough that the real failure this exists to catch — 24MB published
 * against 44, 173MB against 300 — cannot hide inside it.
 */
const MIB = 1024 * 1024
const toMiB5 = (bytes: number): number => Math.round(bytes / MIB / 5) * 5

const out = treeSize('out')
const pngBytes = manifest.rows.reduce((a, r) => a + r.bytes, 0)

const allRegistryRows = REGISTRY_DESCRIPTORS.flatMap((d) => loadGeneratedRegistry(d.slug).rows)
const itemsByStatus = Object.fromEntries(
  COVERAGE_STATUSES.map((s) => [s, allRegistryRows.filter((r) => r.status === s).length]),
) as Record<(typeof COVERAGE_STATUSES)[number], number>

const modules = loadGeneratedRegistry('modules').rows
const surfaces = [...new Set(modules.map((m) => m.surface))].sort()
const bySurface = Object.fromEntries(
  surfaces.map((s) => {
    const rows = modules.filter((m) => m.surface === s)
    return [
      s,
      {
        owns: rows.filter((r) => r.status === 'demonstrated-in-storyboard').length,
        mounted: rows.filter((r) => r.status === 'mounted-in-another-screen').length,
        total: rows.length,
        unbuilt: rows.filter((r) => r.status === 'not-represented').map((r) => r.id).sort(),
      },
    ]
  }),
)
const unbuiltModules = modules
  .filter((m) => m.status === 'not-represented')
  .map((m) => m.id)
  .sort()

const subRoutes = (surface: string): number =>
  routes.filter((r) => r.startsWith(`/${surface}/`) && r !== `/${surface}/`).length

/** Distinct `DEC-*` identifiers a reader can see anywhere in the export. */
function renderedDecisionIds(): number {
  const seen = new Set<string>()
  for (const route of routes) {
    const file = join('out', route.replace(/^\//, ''), 'index.html')
    if (!existsSync(file)) continue
    for (const m of renderedText(readFileSync(file, 'utf8')).match(/\bDEC-[A-Z0-9]+-[0-9]+/g) ?? []) {
      seen.add(m)
    }
  }
  return seen.size
}

const emptyIdentifierRoutes = manifest.rows
  .filter((r) => r.identifiersOnPage.length === 0)
  .map((r) => r.route)
  .sort()

/* ── the cases ────────────────────────────────────────────────────────── */

describe('the four client documents describe the build that exists', () => {
  // FAILS IF: a document is missing or has been emptied, in which case every
  // `stated()` below would fail on zero matches with a confusing message
  // rather than here with the real one.
  it('reads four non-empty documents, a real export and a real manifest', () => {
    expect(DOCUMENTS.filter((d) => !existsSync(d)), 'client documents missing').toEqual([])
    expect(DOCUMENTS.filter((d) => readFileSync(d, 'utf8').length < 500), 'suspiciously empty').toEqual([])
    expect(routes.length).toBeGreaterThan(50)
    expect(manifest.rows.length).toBeGreaterThan(50)
    expect(allRegistryRows.length).toBeGreaterThan(1_000)
  })

  it('publishes the page, file and byte counts the export actually has', () => {
    expect(stated(GUIDE, /the same (\d+) static pages/)).toEqual([String(routes.length)])
    expect(stated(GUIDE, /against a (\d+)-page export/)).toEqual([String(routes.length)])
    expect(stated(GUIDE, /zero of the (\d+) exported pages render/)).toEqual([String(routes.length)])
    expect(stated(DEPLOYMENT, /\*\*(\d+) pages, (\d+) files, roughly (\d+) MiB\*\*/)).toEqual([
      String(routes.length),
      String(out.files),
      String(toMiB5(out.bytes)),
    ])
    expect(stated(DEPLOYMENT, /the export held (\d+) pages and (\d+) files/)).toEqual([
      String(routes.length),
      String(out.files),
    ])
  })

  it('publishes the screenshot count and weight the manifest accounts for', () => {
    expect(stated(DEPLOYMENT, /\*\*(\d+) rows, roughly (\d+) MiB of PNG\*\*/)).toEqual([
      String(manifest.rows.length),
      String(toMiB5(pngBytes)),
    ])
    expect(stated(SHOTS_README, /roughly (\d+) MiB across (\d+) files\*\*/)).toEqual([
      String(toMiB5(pngBytes)),
      String(manifest.rows.length),
    ])
    expect(stated(SHOTS_README, /repeated (\d+) times/)).toEqual([String(manifest.rows.length)])
  })

  it('publishes the registry totals /coverage/ computes from the same fourteen files', () => {
    expect(
      stated(GUIDE, /The blueprint's (\d+) inventories hold \*\*([\d,]+) rows\*\*/),
    ).toEqual([String(REGISTRY_DESCRIPTORS.length), String(allRegistryRows.length)])

    expect(
      stated(
        GUIDE,
        /\*\*([\d,]+) of them are demonstrated by a shipped screen today\*\*, ([\d,]+) more are mounted inside another module's screen, ([\d,]+) carry an authored not-applicable record, and ([\d,]+) are not represented/,
      ),
    ).toEqual([
      String(itemsByStatus['demonstrated-in-storyboard']),
      String(itemsByStatus['mounted-in-another-screen']),
      String(itemsByStatus['not-applicable']),
      String(itemsByStatus['not-represented']),
    ])

    expect(stated(GUIDE, /over the (\d+) modules in/)).toEqual([String(modules.length)])
    expect(stated(GUIDE, /\| `\/coverage\/` \| (\d+) inventories/)).toEqual([
      String(REGISTRY_DESCRIPTORS.length),
    ])
    expect(stated(WALKTHROUGHS, /(\d+) inventories counted from the built route tree/)).toEqual([
      String(REGISTRY_DESCRIPTORS.length),
    ])
  })

  /*
   * THE POPULATION IS THE CLAIM HERE, so it is asserted by EQUALITY over the
   * surface keys the registry itself holds — not "every row in the table is
   * right", which a table missing a surface satisfies. Round 2's shape: a
   * subset control where the claim is every member.
   */
  it('gives every surface a table row, and every row the registry’s own numbers', () => {
    const rows = [
      ...flat(GUIDE).matchAll(/\| [^|]+ \| `(SURF-[A-Z]+)` \| (\d+) \| (\d+) \| (\d+) \| ([^|]+) \|/g),
    ].map((m) => ({
      key: String(m[1]),
      owns: Number(m[2]),
      mounted: Number(m[3]),
      total: Number(m[4]),
      state: String(m[5]).trim(),
    }))

    expect(rows.map((r) => r.key).sort(), 'surfaces the by-surface table names').toEqual(surfaces)

    for (const row of rows) {
      const d = bySurface[row.key]
      expect({ owns: row.owns, mounted: row.mounted, total: row.total }, `${row.key} counts`).toEqual({
        owns: d?.owns,
        mounted: d?.mounted,
        total: d?.total,
      })
      const expectedState =
        (d?.unbuilt.length ?? 0) === 0 ? 'complete' : `${d?.unbuilt.length} modules not represented`
      expect(row.state, `${row.key} state cell`).toBe(expectedState)
    }
  })

  /*
   * The two Critical findings both turned on this set. The guide named twelve
   * unbuilt Command Center modules and one built screen; the truth is two
   * unbuilt modules on a different surface entirely. Equality over the ids,
   * so a third unbuilt module or a newly built one reds rather than being
   * absorbed into a count.
   */
  it('names exactly the modules that are unbuilt, by id', () => {
    const named = [...new Set(flat(GUIDE).match(/\bMOD-[A-Z]+-\d+/g) ?? [])].sort()
    expect(named, 'MOD- ids the guide names').toEqual(unbuiltModules)
    const inWalkthroughs = [...new Set(flat(WALKTHROUGHS).match(/\bMOD-[A-Z]+-\d+/g) ?? [])].sort()
    expect(inWalkthroughs, 'MOD- ids docs/walkthroughs.md names').toEqual(unbuiltModules)
  })

  it('publishes the per-surface screen counts the export has', () => {
    expect(stated(GUIDE, /\| `\/hub\/` \| (\d+) screens; (\d+) of (\d+) modules own one \|/)).toEqual([
      String(subRoutes('hub')),
      String(bySurface['SURF-DOH']?.owns),
      String(bySurface['SURF-DOH']?.total),
    ])
    expect(
      stated(
        GUIDE,
        /\| `\/studio\/` \| (\d+) screens; (\d+) of (\d+) modules own one, the other (\d+) mount inside them \|/,
      ),
    ).toEqual([
      String(subRoutes('studio')),
      String(bySurface['SURF-STU']?.owns),
      String(bySurface['SURF-STU']?.total),
      String(bySurface['SURF-STU']?.mounted),
    ])
    expect(
      stated(GUIDE, /\| `\/super-admin\/` \| complete: (\d+) of (\d+) modules own a screen \|/),
    ).toEqual([String(bySurface['SURF-SA']?.owns), String(bySurface['SURF-SA']?.total)])
    expect(stated(WALKTHROUGHS, /All (\d+) of this surface's modules own a screen/)).toEqual([
      String(bySurface['SURF-SA']?.owns),
    ])
    expect(stated(WALKTHROUGHS, /the Hub reads (\d+) of (\d+)/)).toEqual([
      String(bySurface['SURF-DOH']?.owns),
      String(bySurface['SURF-DOH']?.total),
    ])
  })

  it('publishes the Command Center rail against the routes and the register', () => {
    const built = subRoutes('command-center')
    const register = bySurface['SURF-CC']?.total
    expect(stated(GUIDE, /renders a rail of (\d+) screens/)).toEqual([String(built)])
    expect(stated(GUIDE, /The register carries (\d+) screens/)).toEqual([String(register)])
    expect(stated(GUIDE, /a rail of (\d+) over a register of (\d+)/)).toEqual([
      String(built),
      String(register),
    ])
    expect(stated(WALKTHROUGHS, /renders a rail of (\d+) screens and all (\d+) are built/)).toEqual([
      String(built),
      String(built),
    ])
    expect(stated(WALKTHROUGHS, /the rail of (\d+), and why a register of (\d+) screens/)).toEqual([
      String(built),
      String(register),
    ])
  })

  it('counts the support-access absences the screen actually renders', () => {
    expect(stated(WALKTHROUGHS, /\*\*(\d+) controls that do not exist here\*\*/)).toEqual([
      String(SUPPORT_ABSENT_CONTROLS.length),
    ])
    expect(stated(WALKTHROUGHS, /The (\d+) are: granting the engineer/)).toEqual([
      String(SUPPORT_ABSENT_CONTROLS.length),
    ])
    /*
     * The SIX, by name, because "6" is equally satisfied by the wrong six —
     * and the wrong six is exactly what the old "three prohibitions" was. The
     * map's key set is asserted equal to the fixture's label set, so a
     * seventh absence added to the screen reds here rather than silently
     * going unlisted, and a paraphrase this map does not know about reds too.
     */
    const AS_WRITTEN: Record<string, string> = {
      'Grant the engineer write access': 'granting the engineer write access',
      'Extend the time box of an open session': 'extending the time box of an open session',
      'Export anything from inside a session': 'exporting anything from inside a session',
      'Hide or suppress the tenant banner': 'hiding the tenant banner',
      'Suppress the tenant post-session report': 'suppressing the tenant post-session report',
      'End a compliance-emergency session from the tenant banner':
        'ending a compliance-emergency session from the tenant banner',
    }
    expect(Object.keys(AS_WRITTEN).sort(), 'absences the walkthrough knows about').toEqual(
      SUPPORT_ABSENT_CONTROLS.map((c) => c.label).sort(),
    )
    const doc = flat(WALKTHROUGHS)
    expect(
      Object.values(AS_WRITTEN).filter((phrase) => !doc.includes(phrase)),
      'support-access absences the walkthrough does not name',
    ).toEqual([])
  })

  it('counts the open-decision identifiers a reader can actually see', () => {
    const derived = String(renderedDecisionIds())
    expect(stated(GUIDE, /(\d+) `DEC-\*` identifiers are named across the export/)).toEqual([derived])
    expect(stated(WALKTHROUGHS, /(\d+) `DEC-\*` identifiers are named across the export/)).toEqual([
      derived,
    ])
  })

  /*
   * R7-B08. The guide quoted `Unknown while offline` — the BLUEPRINT's token
   * at L35967 — as a string the screens show, and zero exported pages render
   * it. A quotation is checked as a quotation: the exact string must appear
   * in the rendered text of the page the guide names, with the React flight
   * payload stripped, because a raw grep over `out/` finds row keys.
   */
  it('quotes only UI strings the page it names actually renders', () => {
    const QUOTED: readonly [route: string, text: string][] = [
      ['/command-center/live-shift-board/', 'pending captures unknown'],
      ['/command-center/live-shift-board/', 'unknown as at the last successful sync'],
    ]
    const guide = flat(GUIDE)
    for (const [route, text] of QUOTED) {
      expect(routes, `${route} must exist to be quoted`).toContain(route)
      const page = renderedText(readFileSync(join('out', route.replace(/^\//, ''), 'index.html'), 'utf8'))
      expect(page.includes(text), `${route} does not render "${text}"`).toBe(true)
      expect(guide.includes(`\`${text}\``), `the guide stopped quoting "${text}"`).toBe(true)
    }
    // And the string that started this: still absent from every page, so the
    // guide may not quote it back.
    const anywhere = routes.some((r) => {
      const f = join('out', r.replace(/^\//, ''), 'index.html')
      return existsSync(f) && renderedText(readFileSync(f, 'utf8')).includes('Unknown while offline')
    })
    expect(anywhere, 'a page now renders "Unknown while offline"; the guide’s note needs rewriting').toBe(
      false,
    )
  })

  /*
   * R7-B06. Asserted as a SET of routes, not as a count: "eleven pages name
   * no identifier" is satisfied by the wrong eleven, and the README's old
   * accounting was wrong in all three of its terms while its total was only
   * off by two.
   */
  it('accounts for exactly the pages that name no identifier', () => {
    const coverageEmpty = emptyIdentifierRoutes.filter((r) => r.startsWith('/coverage/'))
    const otherEmpty = emptyIdentifierRoutes.filter((r) => !r.startsWith('/coverage/'))
    /*
     * Fix round 1 (Task 17): `/workflows/*` split out of `otherEmpty` and
     * checked as a COUNT, not an enumeration. `namedInReadme` below asserts
     * an EXACT SET of individually-named routes, which was right at eleven
     * — a human names eleven things. Task 17 put 724 of them (the index
     * plus 723 detail cards) in this population, most keyed on ids the
     * regex two lines below cannot even represent (`SB-004@L61093`,
     * `unstated (measurement lifecycle)`, an em dash) since it accepts only
     * `[a-z0-9_/-]`. Naming 724 near-identical routes one at a time would
     * not make the document more checkable, only longer than any reader
     * would read — the gate's own enumeration design does not reach a
     * uniform class this size, and the fix is a real count assertion over
     * that class, not a padded bullet list built to satisfy a set equality.
     */
    const workflowsEmpty = otherEmpty.filter((r) => r.startsWith('/workflows/'))
    const smallEmpty = otherEmpty.filter((r) => !r.startsWith('/workflows/'))

    expect(stated(SHOTS_README, /\*\*(\d+) pages name no identifier\*\*/)).toEqual([
      String(emptyIdentifierRoutes.length),
    ])
    expect(stated(SHOTS_README, /- (\d+) `\/coverage\/\*` pages are inventory dashboards/)).toEqual([
      String(coverageEmpty.length),
    ])
    /*
     * Scoped to the accounting's own bullet list, not to the whole file: the
     * README names `/command-center/` two paragraphs later for the opposite
     * reason, and a whole-file scan would fold that into the population and
     * make the equality below unsatisfiable by any correct document.
     */
    const bullets = readFileSync(SHOTS_README, 'utf8')
      .split('\n')
      .filter((l) => l.startsWith('- '))
      .join(' ')
    const namedInReadme = [...new Set(bullets.match(/`(\/[a-z0-9_/-]*)`/g) ?? [])]
      .map((m) => m.replace(/`/g, ''))
      .filter((r) => r.endsWith('/') && !r.startsWith('/coverage/') && !r.startsWith('/workflows/'))
      .sort()
    expect(namedInReadme, 'non-/coverage/, non-/workflows/ routes the README accounts for').toEqual(
      smallEmpty,
    )
    // The /workflows/* count, checked by equality against the measured
    // population — never a floor, so a 725th empty card still reds this.
    expect(
      stated(
        SHOTS_README,
        /(\d+) of its 724 `\/workflows\/<id>\/` detail cards/,
      ),
    ).toEqual([String(workflowsEmpty.length - 1)])

    const cc = manifest.rows.find((r) => r.route === '/command-center/')
    expect(stated(SHOTS_README, /`\/command-center\/` names (\d+) identifiers/)).toEqual([
      String(cc?.identifiersOnPage.length),
    ])
  })

  /*
   * R7-B10. The manifest's own disclosure block is a claim about the manifest
   * and gets the same treatment as a claim in prose: the fields it says it
   * does not carry must be exactly the §27.2 fields absent from it, and the
   * README's "9 of 16" must be the count that falls out of the mapping.
   */
  it('carries the §27.2 fields it claims and discloses exactly the ones it does not', () => {
    const row = manifest.rows[0]
    expect(row, 'no manifest rows to check field coverage against').toBeDefined()
    /** Master prompt §27.2's sixteen named fields, mapped to what holds each. */
    const FIELD_27_2: Record<string, boolean> = {
      'screenshot ID': row?.id !== undefined,
      screen: row !== undefined && 'screen' in row,
      route: row?.route !== undefined,
      persona: false,
      scope: false,
      'story step': false,
      state: false,
      viewport: row?.viewport !== undefined,
      locale: row !== undefined && 'locale' in row,
      theme: row?.theme !== undefined,
      'source IDs': row?.moduleIds !== undefined && row?.screenIds !== undefined,
      'acceptance IDs': row?.acceptanceIds !== undefined,
      test: false,
      'source hash': false,
      'build hash': manifest.buildId !== undefined,
      'baseline hash': false,
    }
    const carried = Object.entries(FIELD_27_2).filter(([, v]) => v).map(([k]) => k)
    expect(Object.keys(FIELD_27_2).length, 'the §27.2 field list must stay at sixteen').toBe(16)

    expect(stated(SHOTS_README, /\*\*It carries (\d+) of those (\d+)\*\*/)).toEqual([
      String(carried.length),
      String(Object.keys(FIELD_27_2).length),
    ])
    expect(stated(SHOTS_README, /the manifest names the other (\d+) in its own/)).toEqual([
      String(Object.keys(FIELD_27_2).length - carried.length),
    ])
    // Equality, not a count: the block must name the seven that are absent
    // and no others, so a field quietly dropped from the rows cannot hide in
    // a prose sentence that still says nine.
    expect(Object.keys(manifest.fieldsNotCarried).sort(), 'fieldsNotCarried keys').toEqual(
      ['baselineHash', 'persona', 'scope', 'sourceHash', 'state', 'storyStep', 'test'],
    )
    // Every one of them names the slice that owns it or the reason it will
    // never exist — a disclosure with no owner is a note, not a disclosure.
    expect(
      Object.entries(manifest.fieldsNotCarried)
        .filter(([, why]) => !/slice 13|README|locator-fidelity/i.test(why))
        .map(([k]) => k),
      'fieldsNotCarried entries with no owner or reason',
    ).toEqual([])
  })

  /*
   * R7-B11, the half of it that can be closed without a runner: the 102
   * committed captures were reachable from no walkthrough step
   * (`grep -c 'screenshots/' docs/walkthroughs.md` returned 0). Each step now
   * names its capture, and each name is held equal to that route's row in the
   * manifest — a renamed route moves the filename and reds here.
   */
  it('links every walkthrough step to the capture the manifest holds for its route', () => {
    const fileByRoute = new Map(manifest.rows.map((r) => [r.route, r.file]))
    const lines = readFileSync(WALKTHROUGHS, 'utf8').split('\n')
    const stepRows = lines.filter((l) => /^\| \d+ \| `\//.test(l))
    expect(stepRows.length, 'walkthrough step rows found').toBeGreaterThan(20)

    const wrong: string[] = []
    for (const line of stepRows) {
      const m = /^\| \d+ \| `(\/[^`]+)` \|.*\| `([^`]+\.png)` \|$/.exec(line)
      if (!m) {
        wrong.push(`step row with no capture cell: ${line.slice(0, 60)}…`)
        continue
      }
      const [, route, file] = m
      const expected = fileByRoute.get(String(route))
      if (expected !== file) wrong.push(`${route} -> ${file}, manifest has ${expected ?? 'no row'}`)
    }
    expect(wrong, 'walkthrough steps whose capture does not match the manifest').toEqual([])
  })

  it('publishes the walkthrough count the document contains', () => {
    const headings = (readFileSync(WALKTHROUGHS, 'utf8').match(/^## \d+ — /gm) ?? []).length
    expect(stated(WALKTHROUGHS, /(\d+) click-paths through the storyboard/)).toEqual([
      String(headings),
    ])
    expect(stated(GUIDE, /gives you (\d+) click-paths/)).toEqual([String(headings)])
    expect(stated(GUIDE, /\*\*What exists:\*\* (\d+) walkthroughs/)).toEqual([String(headings)])
  })
  /*
   * P1/P2 — THIS GATE, PROVED PERMEABLE. Every gate in this repository plants
   * its own defect, watches it red and restores it; this file shipped without
   * one, and a claim gate with no plant is exactly the shape it was built to
   * catch — `walkthrough-routes` was green while nine of these figures were
   * false. Both failure modes are exercised: the WRONG figure, which is what
   * `R7-B05` shipped, and the DELETED sentence, which is how a claim gate
   * stops checking anything without saying so.
   *
   * Planted into the real document's bytes IN MEMORY. Nothing is written and
   * nothing needs restoring, which is the point — this build has twice lost an
   * uncommitted fix to a restore, and a string plant exercises the same two
   * halves every case above is made of: extract, then compare by equality.
   */
  it('P1/P2 — a wrong figure and a deleted sentence both red', () => {
    const pattern = /the same (\d+) static pages/
    const real = flat(GUIDE)
    expect(statedIn(real, GUIDE, pattern), 'the unplanted claim must pass first')
      .toEqual([String(routes.length)])

    // P1. A figure that no longer describes the export — `R7-B05` was 85
    // published against 102. Derived as `routes.length + 1` rather than
    // written as 85, so the plant cannot coincide with the truth on a future
    // export of a different size and quietly stop being a plant.
    const wrongFigure = routes.length + 1
    const wrong = real.replace(/the same \d+ static pages/, `the same ${wrongFigure} static pages`)
    expect(wrong, 'the plant changed nothing').not.toBe(real)
    expect(statedIn(wrong, GUIDE, pattern)).toEqual([String(wrongFigure)])
    expect(statedIn(wrong, GUIDE, pattern), 'a wrong figure did not red')
      .not.toEqual([String(routes.length)])

    // P2. The sentence reworded away, leaving no figure to check. Zero
    // matches must THROW rather than return an empty list a comparison would
    // silently pass.
    const gone = real.replace(/the same \d+ static pages/, 'the same static pages')
    expect(gone, 'the deletion plant changed nothing').not.toBe(real)
    expect(() => statedIn(gone, GUIDE, pattern), 'a deleted claim did not red')
      .toThrow(/matched 0 times/)
  })
})

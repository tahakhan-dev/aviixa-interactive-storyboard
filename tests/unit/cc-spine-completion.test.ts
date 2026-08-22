import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC_CLAIMED_SLUGS } from '@/surfaces/cc/modules'
import { CC_NAV, CC_SCREENS, ccPathname, ccScreenSlug } from '@/surfaces/cc/screens'

/**
 * SPINE COMPLETION — the three populations `SURF-CC` keeps being counted as
 * one, and the two files that now hold them apart.
 *
 * WHAT THIS SUITE IS FOR, given that `tests/unit/cc-spine.test.ts` already
 * transcribes the register cell by cell. Not that. This asks the questions
 * slice 8 had no route tree to ask:
 *
 *  - the register carries THIRTEEN screens, this surface authors TWELVE route
 *    keys, and the tree holds however many have been built. A check that
 *    counts route directories and asserts thirteen is green and wrong.
 *  - `SCR-CC-\d+` is not a screen-identifier regex. Left-anchored it collects
 *    the register exactly; unanchored it collects five more, and all five are
 *    tails of `AC-SCR-CC-00N` and `TEST-SCR-CC-00N` identifiers rather than
 *    screens.
 *  - the surface index is an unclaimed route, so naming a module identifier in
 *    its text hands that module a route by argmax — or throws the build on a
 *    tie.
 *
 * EVERY GATE BELOW WAS PLANTED AND WATCHED GO RED in the shipping file it
 * claims to protect, then restored byte-identically and checksummed. The
 * `PLANTED`/`RED` notes name the defect actually planted, never a convenient
 * one. Where a claim is protected by two guards, the removal of each and of
 * both was planted: redundant protections cannot be verified one at a time.
 *
 * NOTHING HERE TAKES A COUNT FROM THE ARRAY UNDER TEST. "Thirteen" is read
 * off the frozen source's own rows; "twelve" is derived from those rows and
 * the spine's claims, never from `CC_NAV.length` alone.
 */

const ROOT = process.cwd()
const SOURCE_PATH = join(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE = readFileSync(SOURCE_PATH, 'utf8')
const LINES = SOURCE.split('\n')
const ROUTE_ROOT = join(ROOT, 'app', 'command-center')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/**
 * The reach script, run once against the real tree. It writes nothing — see
 * its own header — so there is no output to redirect and no committed
 * artefact for it to overwrite.
 */
interface ReachReport {
  readonly register: {
    readonly headerLine: string
    readonly separatorLine: string
    readonly rows: number
    readonly firstRow: string
    readonly lastRow: string
  }
  readonly tokens: {
    readonly occurrences: number
    readonly distinctToMnemonic: number
    readonly distinctFullShape: number
    readonly numberedAnchored: readonly string[]
    readonly numberedUnanchored: readonly string[]
    readonly prefixArtefacts: readonly string[]
  }
  readonly routeKeys: {
    readonly expected: number
    readonly built: number
    readonly unbuilt: readonly string[]
  }
  readonly routeDirectories: {
    readonly onDisk: number
    readonly names: readonly string[]
    readonly namedByNoRegisterRow: readonly string[]
  }
  readonly mapping: readonly {
    readonly screen: string
    readonly owningModule: string | null
    readonly slug: string | null
    readonly authoredHere: boolean
  }[]
}

const REACH: ReachReport = JSON.parse(
  execFileSync('node', [join(ROOT, 'scripts', 'cc-reach.mjs'), '--json'], { encoding: 'utf8' }),
)

/** Route directories in the tree right now, by the same rule the shell uses. */
function routeDirsOnDisk(): readonly string[] {
  return readdirSync(ROUTE_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
    .map((e) => e.name)
    .filter((name) => existsSync(join(ROUTE_ROOT, name, 'page.tsx')))
    .sort()
}

/* ==================================================================== *
 * THE THREE POPULATIONS.
 * ==================================================================== */

describe('thirteen screens, twelve route keys, and whatever is built', () => {
  // FAILS IF: the reach script stops reading the Command Center's register.
  // Every surface's §25 register carries the SAME six column names, so a
  // header-only search lands on whichever comes first in the file — the first
  // writing of the script did exactly that and reported zero rows, a parse
  // failure that reads as an empty table.
  // PLANTED: `lineNo(headerIdx)` -> `lineNo(headerIdx + 1)` on the returned
  //          `headerLine` in `scripts/cc-reach.mjs`, so the report names the
  //          separator as its header while the row count stays right.
  // RED: expected '|---|---|---|---|---|---|' to contain
  //      '| Screen identifier | Screen name |'.
  // ALSO PLANTED: dropped the `ROW_ID.test(first[0])` term from the header
  //          predicate. The script REFUSED before any test ran — "The screen
  //          register holds 0 rows, not thirteen" — which is the louder red
  //          and the reason the locator plant above exists: an outer guard
  //          that short-circuits leaves the inner one unproven.
  it('counts the register row by row, from its own header and separator', () => {
    // Read off the source here rather than taken from the script, so the two
    // derivations have to agree.
    const header = Number(REACH.register.headerLine.slice(1))
    expect(srcLine(header)).toContain('| Screen identifier | Screen name |')
    expect(srcLine(header + 1).replaceAll(/[|\- ]/g, '')).toBe('')

    let rows = 0
    while (/^\| SCR-CC-\d\d \|/.test(srcLine(header + 2 + rows))) rows += 1
    expect(rows, 'rows counted one at a time, never a span subtracted').toBe(13)
    expect(REACH.register.rows).toBe(rows)
    expect(REACH.register.firstRow).toBe(`L${header + 2}`)
    expect(REACH.register.lastRow).toBe(`L${header + 1 + rows}`)
  })

  // FAILS IF: the register count and the route-key count are ever collapsed
  // into one number. They differ by the sign-in, which reuses MOD-DOH-09
  // (L48386) and whose key `sign-in` already names two directories on other
  // surfaces — so this surface authors twelve directories for thirteen rows,
  // and thirteen route directories would be the fourteenth screen AC-CC-040
  // (L35261) forbids: "no fourteenth module route exists."
  // PLANTED: removed the `s.id === 'SCR-CC-01'` term from `CC_NAV` in
  //          `src/surfaces/cc/screens.ts` (wave 0's file — planted, watched,
  //          restored byte-identically, never kept).
  // RED: expected [ …(13) ] to deeply equal [ …(12) ].
  it('holds the two counts apart and states the mapping between them', () => {
    expect(REACH.register.rows).toBe(13)
    expect(REACH.routeKeys.expected).toBe(12)
    expect(
      REACH.routeKeys.expected,
      'the register and the route keys are two populations, not one',
    ).not.toBe(REACH.register.rows)

    // The one row that accounts for the difference, named rather than counted.
    const signIn = REACH.mapping.find((m) => m.screen === 'SCR-CC-01')
    expect(signIn).toEqual({
      screen: 'SCR-CC-01',
      owningModule: null,
      slug: 'sign-in',
      authoredHere: false,
    })
    expect(srcLine(48386)).toContain('Reuses MOD-DOH-09')

    // And the same twelve, derived independently through the spine's own
    // `ccScreenSlug` rather than through the script's text parse.
    const viaSpine = CC_SCREENS.map((s) => ccScreenSlug(s)).filter(
      (slug): slug is string => slug !== null && slug !== 'sign-in',
    )
    expect(viaSpine.length).toBe(REACH.routeKeys.expected)
    expect(CC_NAV.map((n) => n.pathname).sort()).toEqual(viaSpine.map(ccPathname).sort())
  })

  // FAILS IF: a route directory appears that no register row keys — the
  // fourteenth route by another name — or a claimed slug loses its directory
  // while the rail still links it.
  // TWO GUARDS COVER THIS, SO BOTH WERE PLANTED SEPARATELY. The reach script
  // refuses on the same condition, and it refuses FIRST — so a green run here
  // could mean this assertion works or only that the script never let it run.
  // PLANTED: added `app/command-center/cc-14-scratch/page.tsx`, a real page.
  // RED: the script refused at module load — 'app/command-center/ holds 1
  //      route directory/directories no register row names: cc-14-scratch' —
  //      and the suite reported "no tests", so this gate did not fire.
  // PLANTED AGAIN: the same directory, with the script's own
  //      `if (unnamed.length > 0) problems.push(...)` disabled so it exits 0.
  // RED: expected [ 'cc-14-scratch' ] to deeply equal []. The inner guard
  //      fires on its own.
  it('holds no route directory the register does not key', () => {
    const onDisk = routeDirsOnDisk()
    expect(REACH.routeDirectories.names).toEqual(onDisk)
    expect(REACH.routeDirectories.namedByNoRegisterRow).toEqual([])

    const keys = new Set([...CC_CLAIMED_SLUGS, ...CC_SCREENS.map((s) => s.unownedSlug ?? '')])
    expect(onDisk.filter((d) => !keys.has(d))).toEqual([])

    // The predicate is not vacuous: `sign-in` is a key this surface never
    // authors, so if it ever appeared as a directory here it is exactly the
    // value the filter would have to catch.
    expect(keys.has('sign-in'), 'the key set really holds the unowned keys').toBe(true)
    expect(onDisk).not.toContain('sign-in')
  })

  // FAILS IF: the rail's built/unbuilt split stops tracking the tree. This is
  // the number the shell renders, so a shell claiming twelve built routes over
  // a tree holding one would be caught here rather than on screen.
  // PLANTED: `expectedKeys.filter((k) => routeDirs.includes(k))` ->
  //          `expectedKeys.filter(() => true)` in `scripts/cc-reach.mjs`.
  // RED: expected 12 to be 1.
  // ALSO RED under the scratch-directory plant above: expected 1 to be 2.
  it('reports built and unbuilt against the tree, not against the spine', () => {
    const onDisk = routeDirsOnDisk()
    expect(REACH.routeKeys.built).toBe(onDisk.filter((d) => d !== 'sign-in').length)
    expect(REACH.routeKeys.built + REACH.routeKeys.unbuilt.length).toBe(REACH.routeKeys.expected)
    for (const slug of REACH.routeKeys.unbuilt) {
      expect(existsSync(join(ROUTE_ROOT, slug, 'page.tsx')), slug).toBe(false)
    }
  })
})

/* ==================================================================== *
 * THE TOKEN POPULATIONS.
 * ==================================================================== */

describe('SCR-CC tokens, and the regex that decides how many there are', () => {
  // FAILS IF: a numbered SCR-CC token appears outside the register — a
  // fourteenth screen by another name — or the anchoring is dropped, which
  // silently readmits the five prefix tails.
  // PLANTED: `numberedUnanchored` re-pointed at `numberedAnchored` in
  //          `scripts/cc-reach.mjs`, collapsing the two populations into one.
  // RED: expected [ 'SCR-CC-01', 'SCR-CC-02', …(11) ] to deeply equal
  //      [ 'SCR-CC-001', 'SCR-CC-002', …(16) ].
  // NOT USED: removing the left anchor itself. The script refuses on it —
  //      'Numbered SCR-CC tokens outside the register: SCR-CC-01 …' — before
  //      any test runs, which proves the script and leaves this gate unproven.
  it('left-anchors the numbered token and gets the register exactly', () => {
    const registerIds = CC_SCREENS.map((s) => s.id as string).sort()
    expect([...REACH.tokens.numberedAnchored].sort()).toEqual(registerIds)
    expect([...REACH.tokens.numberedUnanchored].sort()).toEqual(
      [...registerIds, 'SCR-CC-001', 'SCR-CC-002', 'SCR-CC-003', 'SCR-CC-004', 'SCR-CC-005'].sort(),
    )
  })

  // FAILS IF: the five three-digit tokens are ever treated as screens. They
  // are not a look-alike family and not a register at all: every occurrence of
  // each is the tail of an `AC-SCR-CC-00N` or `TEST-SCR-CC-00N` identifier, so
  // the difference between eighteen and thirteen is a missing left boundary
  // and nothing else. `AC-SCR-CC-001` at L48492 is the criterion
  // `src/surfaces/cc/access.ts` already cites.
  // PLANTED: `prefixArtefacts` replaced with `[]` in `scripts/cc-reach.mjs`.
  // RED: expected [] to deeply equal [ 'SCR-CC-001', 'SCR-CC-002', …(3) ].
  // The gate above and this one are two guards over one claim, so each was
  // planted alone: the `numberedUnanchored` plant turns BOTH red, this one
  // turns only this one red, and neither is riding on the other.
  it('finds no standalone three-digit SCR-CC token anywhere in the source', () => {
    for (const n of ['001', '002', '003', '004', '005']) {
      const standalone = SOURCE.match(new RegExp(`(?:^|[^A-Za-z0-9-])SCR-CC-${n}`, 'gm')) ?? []
      expect(standalone.length, `SCR-CC-${n} standing on its own`).toBe(0)
      const tails = SOURCE.match(new RegExp(`(?:AC|TEST)-SCR-CC-${n}`, 'g')) ?? []
      expect(tails.length, `SCR-CC-${n} as an AC/TEST tail`).toBeGreaterThan(0)
    }
    expect([...REACH.tokens.prefixArtefacts].sort()).toEqual([
      'SCR-CC-001',
      'SCR-CC-002',
      'SCR-CC-003',
      'SCR-CC-004',
      'SCR-CC-005',
    ])
    expect(srcLine(48492)).toContain('`AC-SCR-CC-001`')
  })

  // FAILS IF: a "distinct tokens" number is reported without its regex. Over
  // ONE population of occurrences there are two honest distinct counts, and
  // which one you get is a fact about the pattern rather than about the
  // source: a token that stops at the mnemonic, and one that keeps its
  // trailing sequence number.
  // PLANTED: changed `distinctFullShape`'s regex in `scripts/cc-reach.mjs` to
  //          drop the `(?:-[A-Za-z0-9]+)*` tail, making it a second spelling
  //          of `distinctToMnemonic`.
  // RED: expected 56 to be 96 // Object.is equality.
  it('reports both distinct counts over one occurrence count', () => {
    const occurrences = (SOURCE.match(/SCR-CC-[A-Za-z0-9]/g) ?? []).length
    expect(REACH.tokens.occurrences).toBe(occurrences)
    expect(REACH.tokens.distinctToMnemonic).toBe(
      new Set(SOURCE.match(/SCR-CC-[A-Za-z0-9]+/g) ?? []).size,
    )
    expect(REACH.tokens.distinctFullShape).toBe(
      new Set(SOURCE.match(/SCR-CC-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g) ?? []).size,
    )
    expect(
      REACH.tokens.distinctFullShape,
      'two distinct counts over one occurrence count, and both are real',
    ).toBeGreaterThan(REACH.tokens.distinctToMnemonic)
    // Only thirteen of any of them are rows of the register.
    expect(REACH.tokens.numberedAnchored).toHaveLength(CC_SCREENS.length)
  })
})

/* ==================================================================== *
 * THE SURFACE INDEX IS AN UNCLAIMED ROUTE.
 * ==================================================================== */

describe('the surface index cannot award a route by argmax', () => {
  const MODULE_ID = /MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g

  // FAILS IF: `app/command-center/page.tsx` names a module identifier in its
  // own text. `scripts/build-registries.mjs` treats any directory holding a
  // `page.tsx` as a route, no module declares `command-center` as a slug, so
  // this route falls to argmax over the identifiers its files name — and a TIE
  // between two of them throws the build outright.
  // PLANTED: added "The rail lists MOD-CC-01 through MOD-CC-13." to the doc
  //          comment in `app/command-center/page.tsx`.
  // RED: expected [ 'MOD-CC-01', 'MOD-CC-13' ] to deeply equal [].
  // AND WITH THE GATE BELOW PLANTED TOO: both red, neither masking the other.
  it('names no module identifier in the index route’s own text', () => {
    const index = readFileSync(join(ROUTE_ROOT, 'page.tsx'), 'utf8')
    expect(index.match(MODULE_ID) ?? []).toEqual([])

    // NOT VACUOUS, and this is the half that matters: the same regex on the
    // sibling route finds the identifier that route is required to name. A
    // check that "no file names a module" would pass on a regex that matches
    // nothing at all.
    const owned = readFileSync(
      join(ROUTE_ROOT, 'sync-conflict-review-panel', 'page.tsx'),
      'utf8',
    )
    expect(owned.match(MODULE_ID) ?? [], 'the predicate fires on a route that does name one')
      .toContain('MOD-CC-10')
  })

  // FAILS IF: the index stops rendering the rail at all, which is the other
  // way to satisfy the check above — a page naming no module identifier
  // because it renders nothing passes it perfectly. The identifiers a reviewer
  // needs come from `CC_NAV`, which is imported data and invisible to a scan
  // over file text, so the two gates are a pair and neither is complete alone.
  //
  // THIS GATE SURVIVED ITS FIRST PLANT AND THAT IS WHY IT READS AS IT DOES.
  // It asserted `index.toContain('CommandCenterShell')`, which the IMPORT
  // STATEMENT alone satisfies: replacing the rendered element with a bare
  // `<main />` left it green while the surface index rendered nothing at all.
  // "Imported by nothing" is the failure slice 8's verification found nineteen
  // times; "imported and never rendered" is the same failure one step later,
  // and a text check that cannot tell them apart is worth nothing. Both are
  // now asked: the shell is reached from `app/`, and it is reached as an
  // ELEMENT.
  // PLANTED: replaced `<CommandCenterShell builtSlugs={builtSlugs()} />` in
  //          `app/command-center/page.tsx` with `<main />`, and separately
  //          together with the module-identifier plant above.
  // RED: imported AND rendered: expected 'import { existsSync, readdirSync }
  //      fr…' to contain '<CommandCenterShell'.
  //      (First writing: SURVIVED — green under this plant alone AND combined
  //      with the one above, because `import { CommandCenterShell }` satisfied
  //      a bare `toContain('CommandCenterShell')`.)
  it('is reached from app/ as a rendered element, not merely imported', () => {
    const SHELL_IMPORT = /from\s+'[^']*surfaces\/cc\/shell\/CommandCenterShell'/

    function appFiles(dir: string, acc: string[] = []): string[] {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name)) continue
        const full = join(dir, e.name)
        if (e.isDirectory()) appFiles(full, acc)
        else if (/\.tsx?$/.test(e.name)) acc.push(full)
      }
      return acc
    }

    const importers = appFiles(join(ROOT, 'app'))
      .filter((f) => SHELL_IMPORT.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1))
    expect(importers, 'the shell reaches a route').toContain(join('app', 'command-center', 'page.tsx'))

    const index = readFileSync(join(ROUTE_ROOT, 'page.tsx'), 'utf8')
    expect(index, 'imported AND rendered').toContain('<CommandCenterShell')
    expect(index).toContain('builtSlugs={builtSlugs()}')
    expect(CC_NAV.map((n) => n.owningModule).filter((m) => m !== null).length).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * THE SHELL IS SERVER DATA, RECURSIVELY.
 * ==================================================================== */

describe('the shell does not cross the client boundary', () => {
  const DIRECTIVE = /^\s*(['"])use client\1/m

  function walk(dir: string, acc: string[] = []): string[] {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (isForeignProbe(e.name)) continue
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full, acc)
      else if (/\.tsx?$/.test(e.name)) acc.push(full)
    }
    return acc
  }

  // FAILS IF: anything under `src/surfaces/cc/shell` acquires `'use client'`.
  // The shell reads `CC_NAV`, which `src/surfaces/cc/screens.ts` publishes as
  // server data on purpose: Next replaces a client module's exports with
  // client references, so the rail would empty in the build and in nothing
  // else. Four Run Player panels shipped an undefined module id exactly that
  // way, invisible to every component test, because a component suite mounts
  // the component and the boundary only exists in a build.
  //
  // SCOPED TO THIS DIRECTORY RATHER THAN TO THE SURFACE, and that is a
  // correction rather than a convenience: the first writing walked all of
  // `src/surfaces/cc` and went red on two files a concurrent task had just
  // landed — `fallback/CcFallbackDisclosure.tsx` and `live/FreshnessMarker.tsx`
  // — neither of which is a defect. An interactive component MAY be a client
  // component; what it may not do is export a plain data object a server
  // component reads. Policing a sibling's directory from here would be a gate
  // that is red on correct work.
  // PLANTED: added `'use client'` as the first line of
  //          `src/surfaces/cc/shell/CommandCenterShell.tsx`.
  // RED: expected [ Array(1) ] to deeply equal [] — the one array member
  //      being 'src/surfaces/cc/shell/CommandCenterShell.tsx'.
  it('carries no use-client directive at any depth under shell/', () => {
    const files = walk(join(ROOT, 'src', 'surfaces', 'cc', 'shell'))
    expect(files.some((f) => f.endsWith('CommandCenterShell.tsx')), 'the walk found it').toBe(true)
    const offenders = files
      .filter((f) => DIRECTIVE.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(ROOT.length + 1))
    expect(offenders).toEqual([])

    // NOT VACUOUS. A directive regex that matched nothing would pass this
    // whether or not the shell carried one, so it is run against a file that
    // has opened with `'use client'` since slice 4.
    expect(
      DIRECTIVE.test(readFileSync(join(ROOT, 'app', 'studio', 'StudioShell.tsx'), 'utf8')),
      'the directive predicate fires on a real client component',
    ).toBe(true)
  })
})

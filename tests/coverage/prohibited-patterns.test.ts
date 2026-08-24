import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { FOREIGN_PROBE_ENTRY, isForeignProbe, ownProbeDir } from '../probe-paths'
import ts from 'typescript'
import { stripComments } from './strip-comments'

/**
 * The one probe convention, hoisted into `tests/probe-paths.ts` — a scratch
 * probe belonging to a CONCURRENT process is skipped, so this scan is blind
 * to every probe but the ones it plants itself. That file carries the full
 * account, including why the match is EXACT and never a prefix.
 */
function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const SOURCE_FILES = [...walk('src'), ...walk('app')].filter((f) =>
  /\.(ts|tsx|css)$/.test(f),
)

describe('no runtime backend', () => {
  it('declares no Server Action', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /['"]use server['"]/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('ships no API route or middleware', () => {
    expect(existsSync(join('app', 'api'))).toBe(false)
    expect(existsSync('middleware.ts')).toBe(false)
  })

  it('calls no network API from application source', () => {
    const banned = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/
    const offenders = SOURCE_FILES.filter((f) => banned.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('references no external origin', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /https?:\/\/(?!localhost)/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('uses no dangerouslySetInnerHTML', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /dangerouslySetInnerHTML/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})

describe('source confidentiality', () => {
  const shipped = walk('out')

  // IMPORTANT 2: a missing or empty out/ must be a HARD FAILURE, never a
  // vacuous pass. walk() silently returns [] when out/ does not exist, which
  // let the two scans below "pass" while scanning zero files -- exactly the
  // scenario where a stale or absent build ships a leak undetected.
  it('scans a non-empty release artifact', () => {
    expect(shipped.length).toBeGreaterThan(0)
  })

  it('leaks no blueprint filename into the release artifact', () => {
    const offenders = shipped.filter((f) =>
      readFileSync(f, 'utf8').includes('AVIIXA_Production_Product_Blueprint'),
    )
    expect(offenders).toEqual([])
  })

  it('leaks no absolute author path into the release artifact', () => {
    const offenders = shipped.filter((f) => /\/Users\/[a-z]+\//i.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})

/* -------------------------------------------------------------------- *
 * THE ELEVENTH COPY.
 *
 * The probe convention was copy-pasted into thirteen test files, and the
 * copies drifted: one missed the optional middle group and so did not
 * recognise `stu-shell.test.tsx`'s probe at all, and one carried a second,
 * private predicate for the `.json` shape that `registry-freshness.test.ts`
 * actually meets. Both drifts cost real red runs on a coherent tree.
 * `tests/probe-paths.ts` is now the one copy. This gate is what stops a
 * twelfth from being written.
 *
 * KEYED ON SHAPE, NEVER ON THE IDENTIFIER. A gate keyed on the name
 * `isForeignProbe` passes the moment someone types `isAlienProbe`, and a
 * rename is the likeliest way the copy comes back — this build already has a
 * gate defeated by exactly that. The two keys below are properties a
 * re-implementation cannot drop and still work:
 *
 *   1. THE PATH TOKEN. Any predicate that recognises THIS repo's probes must
 *      contain the entry-name convention. A copy under any identifier still
 *      carries it. (A predicate using a DIFFERENT convention is not a copy of
 *      this one: it would collide with nobody's probes and race nobody.)
 *   2. `process.pid`. Any local re-implementation of the per-process probe
 *      NAME must reach for it, which catches a copy that renamed the
 *      convention as well as the identifier.
 *
 * The token is assembled from two halves at run time so this file does not
 * match itself — the one place spelling it out would be a blind spot.
 *
 * COMMENTS ARE STRIPPED FIRST. Ten of the thirteen files keep prose ABOUT the
 * convention, naming it in order to explain it; a gate written against raw
 * source would fail on correct code today. That is the same reason
 * `stripComments` exists for the other gates in this repo.
 * -------------------------------------------------------------------- */

const PROBE_MODULE = join('tests', 'probe-paths.ts')
const PROBE_TOKEN = ['zz', 'probe'].join('-')
const PID_TOKEN = ['process', 'pid'].join('.')

/**
 * ONE NAMED EXEMPTION, FIXED AT EXACTLY ONE, and asserted as an EQUALITY so
 * it retires itself. `tests/coverage/locator-fidelity.test.ts` carries a
 * thirteenth copy and belongs to a concurrent work item, so it was out of
 * scope for the hoist. When it is hoisted, this list stops matching and the
 * gate says so — an exemption that must be deleted rather than one that rots.
 * A SECOND file appearing here turns the gate red and forces the decision,
 * rather than quietly widening the exception.
 */
const PROBE_COPY_EXEMPT = [join('tests', 'coverage', 'locator-fidelity.test.ts')]

const testSources = (): string[] => walk('tests').filter((f) => /\.tsx?$/.test(f))

const declaresProbeConvention = (file: string): boolean => {
  const src = stripComments(readFileSync(file, 'utf8'))
  return src.includes(PROBE_TOKEN) || src.includes(PID_TOKEN)
}

describe('the probe convention is declared in exactly one place', () => {
  // RED when: the corpus stops covering the tests tree, or the detector stops
  // detecting. Both are how this gate would report safety over nothing --
  // `walk` returns [] for a missing root, and a `.includes` that never
  // matches passes every negative assertion that can be written.
  it('scans every test source, and the detector fires on the one file that does declare it', () => {
    const files = testSources()
    expect(files.length, 'the scan must reach the tests tree').toBeGreaterThan(50)
    expect(files).toContain(PROBE_MODULE)
    expect(declaresProbeConvention(PROBE_MODULE), 'the detector must fire on probe-paths.ts').toBe(
      true,
    )
  })

  it('no other test file re-declares it', () => {
    const offenders = testSources()
      .filter((f) => f !== PROBE_MODULE)
      .filter(declaresProbeConvention)
      .sort()
    expect(
      offenders,
      'import { isForeignProbe, ownProbeDir, presentOrNull, withPlanted } from the shared ' +
        'tests/probe-paths module instead of re-declaring the probe convention locally',
    ).toEqual(PROBE_COPY_EXEMPT)
  })
})

/* -------------------------------------------------------------------- *
 * THE WALK WITHOUT THE SKIP.
 *
 * The gate above catches a re-declared PREDICATE. It does not catch the
 * thing the predicate exists for, and that is the defect that keeps
 * recurring: a recursive directory walk that never asks the question at all.
 * Four such walks have now been found, and the plan's list named three of
 * them — `registry-freshness`'s `walk`, `stu-training`'s and
 * `stu-localisation`'s `filesUnder`. The fourth,
 * `tests/e2e/exported-routes.ts`, was found only when a sibling's
 * `out/studio/<probe>/` entered the DERIVED Playwright route population and
 * cascaded roughly seventy-six worker errors.
 *
 * A LIST WAS THE WRONG INSTRUMENT, so this is not a list. It is the
 * property: a recursive directory walker under `tests/` must reference the
 * shared probe module. Nothing here is keyed on an identifier spelling —
 * the accepted names are read out of each file's OWN import statement, so
 * `import { isForeignProbe as isForeign }` and any other alias are accepted
 * because the file says so, not because this gate guessed the name.
 *
 * WHAT IT DOES NOT CLAIM. It covers RECURSIVE walkers, which is the shape
 * all four holes had: a walk that descends is a walk that reaches a plant
 * root eventually, whatever directory it starts from. A single
 * non-recursive `readdirSync` of one leaf directory is not covered, because
 * whether that leaf can ever hold a probe is not decidable from the call
 * site. Every such call site in `tests/` was enumerated by hand and each is
 * recorded with a verdict in the task report; the ones that list a plant
 * root — `saEntries`, `entriesOf`, `generatedRegistryFiles` — are already
 * probe-aware and are covered by the predicate gate above.
 * -------------------------------------------------------------------- */

const DIRECTORY_READ = /\b(?:readdirSync|opendirSync)\s*\(/

/** Every name this file bound from the shared probe module, read from its own import. */
function probeModuleBindings(sf: ts.SourceFile): Set<string> {
  const bound = new Set<string>()
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (!statement.moduleSpecifier.text.endsWith('probe-paths')) continue
    const bindings = statement.importClause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) bound.add(element.name.text)
    }
  }
  return bound
}

interface NamedBody {
  readonly name: string
  readonly body: string
}

/**
 * Every named function or const in the file, with its body text, COMMENTS
 * STRIPPED.
 *
 * A GATE LIMIT CLOSED HERE, AND THE PLANT THAT FOUND IT IS NOT THIS FILE'S.
 * The awareness scan below asks whether a walker's body MENTIONS a
 * probe-aware name. `node.body.getText()` returns the source text of the
 * range, comments included, so an explanatory note naming `isForeignProbe`
 * inside a function made that function "aware" with the actual probe skip
 * stripped out — proved by planting exactly that, and the gate stayed green.
 * A comment is prose about the walk, not the walk.
 *
 * The `mentions` walk over `aware` is a positive test, so stripping can only
 * make this gate stricter, never blinder. Measured before it landed:
 * stripping convicts exactly ONE walker tree-wide, and that one is
 * deliberate — see `PROBE_AWARENESS_EXEMPT`. Nothing else in `tests/` relies
 * on a comment to be probe-aware.
 */
function namedBodies(sf: ts.SourceFile): NamedBody[] {
  const out: NamedBody[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      out.push({ name: node.name.text, body: stripComments(node.body.getText(sf)) })
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined
    ) {
      out.push({ name: node.name.text, body: stripComments(node.initializer.getText(sf)) })
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sf, visit)
  return out
}

const mentions = (text: string, name: string): boolean =>
  new RegExp(`\\b${name}\\b`).test(text)

/**
 * The bindings above, GROWN to a fixpoint. `slice-2c-gates`'s
 * `isForeignProbeJson` and `slice-03-gates`'s `isForeignProbe` are local
 * wrappers around an imported name; a walker referencing one of those is
 * probe-aware, and a gate that did not follow one indirection would demand a
 * pointless second reference.
 */
function probeAwareNames(sf: ts.SourceFile): Set<string> {
  const aware = probeModuleBindings(sf)
  const declarations = namedBodies(sf)
  // A LOCAL copy of the predicate also makes a walker probe-aware, and saying
  // so keeps the two gates orthogonal: this one asks whether the walk asks the
  // question, and the copy gate above asks where the question is written. A
  // file carrying a local copy is caught by the copy gate exactly once,
  // instead of by both and twice over.
  for (const declaration of declarations) {
    if (declaration.body.includes(PROBE_TOKEN)) aware.add(declaration.name)
  }
  for (let pass = 0; pass < 5; pass += 1) {
    let grew = false
    for (const declaration of declarations) {
      if (aware.has(declaration.name)) continue
      if ([...aware].some((name) => mentions(declaration.body, name))) {
        aware.add(declaration.name)
        grew = true
      }
    }
    if (!grew) break
  }
  return aware
}

interface WalkerVerdict {
  readonly where: string
  readonly aware: boolean
}

/**
 * The two shapes that can admit a probe, and neither is an identifier.
 *
 *   RECURSIVE — a walk that descends reaches a plant root from anywhere above
 *   it, whatever directory it starts from. All four holes this item closed had
 *   this shape.
 *
 *   DIRECTORY-ENUMERATING — a listing that keeps DIRECTORY entries admits a
 *   probe directly, without descending anywhere, because a probe IS a
 *   directory. `tests/unit/stu-screen-config.test.ts` listed `app/studio` —
 *   a live plant root — filtered it to directories, and then read inside each
 *   one. That is a fifth hole, and it is not recursive, so the recursion rule
 *   alone would have missed it.
 *
 * A listing that is NEITHER is admitted without a skip only because the probe
 * convention makes it safe: every entry it can create ends in a digit or in
 * `.json`, so a listing filtered to `.ts`/`.tsx` sources can never see one.
 * That is not an observation about today's call sites — it is a property of
 * the predicate, asserted directly below.
 */
const KEEPS_DIRECTORIES = /\bisDirectory\s*\(|\bwithFileTypes\b/

function recursiveWalkers(file: string): WalkerVerdict[] {
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const aware = probeAwareNames(sf)
  return namedBodies(sf)
    .filter((d) => DIRECTORY_READ.test(d.body))
    .filter(
      (d) =>
        new RegExp(`\\b${d.name}\\s*\\(`).test(d.body) || KEEPS_DIRECTORIES.test(d.body),
    )
    .map((d) => ({
      where: `${file} -> ${d.name}()`,
      aware: [...aware].some((name) => mentions(d.body, name)),
    }))
}

/**
 * THE ONE WALKER THAT MUST NOT SKIP A PROBE, NAMED ONE AT A TIME.
 *
 * `static-export.test.ts`'s scan of `out/` exists to FIND the probes every
 * other scan hides — an orphan left in the export ships. Skipping foreign
 * probes there would be the gate refusing to look at its own subject, so it
 * asks `isOrphanProbe` instead: a live sibling's plant passes, a probe nobody
 * owns does not.
 *
 * It surfaced the moment comments stopped counting as awareness (see
 * `namedBodies`) — its skip-nothing decision is written in prose beside the
 * loop. Exempting the FILE by name rather than exempting "walks over out/"
 * follows this build's rule: exempt the named false alarms, never the class of
 * syntax. Asserted as an EQUALITY, so a second unaware walker turns this red
 * rather than joining a widened exception, and so the exemption retires itself
 * the day that walk becomes probe-aware.
 */
const PROBE_AWARENESS_EXEMPT_FILE = join('tests', 'coverage', 'static-export.test.ts')
const PROBE_AWARENESS_EXEMPT = [`${PROBE_AWARENESS_EXEMPT_FILE} -> allExportEntries()`]

describe('every directory walk under tests/ that can admit a probe skips a foreign one', () => {
  const walkers = testSources().flatMap(recursiveWalkers)

  // RED when: the AST scan stops finding walkers at all -- a `.filter` that
  // matches nothing passes every assertion below over an empty set, which is
  // exactly how this build has shipped five gates that could not fail.
  // The property every UNPOLICED listing rests on, asserted rather than
  // observed: an entry this convention can create never ends in a source
  // extension, so a listing filtered to `.ts`/`.tsx` files cannot admit one.
  // If the convention ever grew such a tail, every extension-filtered listing
  // in `tests/` would silently become exposed, and this is what says so.
  it('no probe entry can ever pass a .ts/.tsx source filter', () => {
    for (const entry of [
      ownProbeDir(),
      ownProbeDir('stu-reach'),
      `${ownProbeDir()}.json`,
      `.${PROBE_TOKEN}-1`,
    ]) {
      expect(FOREIGN_PROBE_ENTRY.test(entry), entry).toBe(true)
      expect(/\.tsx?$/.test(entry), entry).toBe(false)
    }
    // And the converse, so this is not passing on a vacuous set: a real
    // source file named for the convention is NOT hidden.
    for (const real of [
      `${PROBE_TOKEN}.tsx`,
      `${PROBE_TOKEN}Helpers.tsx`,
      `.${PROBE_TOKEN}.tsx`,
    ]) {
      expect(FOREIGN_PROBE_ENTRY.test(real), real).toBe(false)
    }
  })

  it('finds the walkers it is meant to police', () => {
    expect(walkers.length, 'the walker scan found nothing to police').toBeGreaterThan(8)
    // The four holes this item closed, named, so a refactor that moves any of
    // them out of the scan is a failure rather than a silent reduction in
    // coverage.
    for (const named of [
      `${join('tests', 'coverage', 'registry-freshness.test.ts')} -> walk()`,
      `${join('tests', 'unit', 'stu-training.test.ts')} -> filesUnder()`,
      `${join('tests', 'unit', 'stu-localisation.test.ts')} -> filesUnder()`,
      `${join('tests', 'e2e', 'exported-routes.ts')} -> walk()`,
    ]) {
      expect(walkers.map((w) => w.where)).toContain(named)
    }
  })

  it('every one of them is probe-aware', () => {
    expect(
      walkers.filter((w) => !w.aware).map((w) => w.where),
      'a recursive directory walk that never asks whether an entry is another ' +
        "process's scratch probe. It will list one and then ENOENT on it the moment that " +
        'process deletes it, or worse, treat it as a finding. Route the walk through ' +
        'isForeignProbe from tests/probe-paths.',
    ).toEqual(PROBE_AWARENESS_EXEMPT)
  })

  /**
   * THE EXEMPTION IS A STATEMENT, NOT A SILENCE. A named file could stop
   * being the deliberate case and keep its exemption, which is the shape this
   * build has shipped before. So the reason is asserted rather than trusted:
   * the one walker that skips nothing must reach for the ORPHAN predicate,
   * which is the different question it exists to ask.
   */
  it('the one exempt walker asks the orphan question instead', () => {
    const text = readFileSync(PROBE_AWARENESS_EXEMPT_FILE, 'utf8')
    expect(text).toMatch(/\bisOrphanProbe\b/)
    expect(walkers.map((w) => w.where)).toContain(PROBE_AWARENESS_EXEMPT[0])
  })
})

/* -------------------------------------------------------------------- *
 * THE AUTHOR-MACHINE PATH SCAN COVERED `out/` ONLY, AND THE CANDIDATE IS
 * LARGER THAN `out/`.
 *
 * `leaks no absolute author path into the release artifact` above walks the
 * static export, which is the right scan for §4.3's confidentiality rule and
 * is not the rule master prompt §30 states: the scan is over "this execution
 * and every delivered artifact". Tests, fixtures and committed registries are
 * the Product Candidate (§23.2 item 1) and never reach `out/`, so they were
 * outside every author-path check in the tree — measured at the moment this
 * gate was written: 20 unit tests and 19 committed extract records carried
 * `/<home>/<user>/Desktop/...` as a string literal, 39 occurrences. Every one
 * of the 20 tests reads the frozen source, and five of them already used the
 * portable form two lines from a sibling that did not, so this was drift
 * rather than a decision.
 *
 * WHAT IS EXEMPT, AND WHY IT IS NAMED RATHER THAN PATTERNED. `docs/` is the
 * Evidence Envelope, not the Product Candidate: a source-reading ledger, a
 * verification record and a controller brief each record WHERE the frozen
 * source was read on the machine that read it, and that is provenance. 22
 * occurrences live there deliberately. The exemption is a directory list
 * asserted as a set equality below, so a 23rd location — a fixture, a script,
 * a generated registry — reds instead of joining a widened pattern.
 *
 * THE NEEDLE IS ASSEMBLED SO THIS FILE DOES NOT CONVICT ITSELF. Spelling the
 * literal here would make the one file that polices the class its own only
 * offender, which is the blind spot the probe-token gate below already
 * documents. Proved by planting: writing the literal into a real shipping
 * test turns the first case red naming that file.
 * -------------------------------------------------------------------- */

const HOME_PREFIXES = ['Users', 'home'] as const
const AUTHOR_PATH = new RegExp(`/(?:${HOME_PREFIXES.join('|')})/[A-Za-z0-9._-]+/`)

/** Where a home-directory path is legitimate provenance rather than a leak. */
const EVIDENCE_DIRS = ['docs'] as const

describe('no author-machine path in the product candidate', () => {
  const candidate = [
    ...walk('src'),
    ...walk('app'),
    ...walk('tests'),
    ...walk('scripts'),
    ...walk('registries'),
  ]

  it('scans a non-empty candidate', () => {
    expect(candidate.length).toBeGreaterThan(100)
  })

  it('carries no absolute home-directory path', () => {
    const offenders = candidate.filter((f) => AUTHOR_PATH.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  // The exemption stated as an EQUALITY, so it retires itself: if `docs/`
  // stops carrying one, this reds and the exemption is deleted rather than
  // left to rot; and a SECOND evidence directory cannot be added silently.
  it('the exempt directories are exactly the ones that need the exemption', () => {
    const carrying = EVIDENCE_DIRS.filter((d) =>
      walk(d).some((f) => AUTHOR_PATH.test(readFileSync(f, 'utf8'))),
    )
    expect(carrying).toEqual([...EVIDENCE_DIRS])
  })
})

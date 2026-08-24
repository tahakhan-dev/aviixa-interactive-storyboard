/**
 * Two release gates over the generated registries, both of which exist because
 * the unit suite used to assert freshness by OVERWRITING the artefacts it was
 * checking and then comparing them to themselves. That assertion could not stay
 * red: a failing run repaired its own subject, so running the suite twice made
 * it green whatever had changed. It also meant every test run rewrote committed
 * files to match whatever half-built code was in the tree at that moment.
 *
 * Two implementers found the second writer independently on the same afternoon,
 * from opposite directions: one was told not to run the generator and noticed
 * that `pnpm test:component` ran it anyway; the other pinned the artefact's
 * sha256 either side of its own run, found it byte-identical, and reported the
 * instruction conflict regardless. Two independent discoveries of one conflict
 * means the instruction was wrong rather than the agents -- so the rule is now
 * a property of the code instead of something three people have to remember.
 *
 * Gate 1 is FRESHNESS, and it lives in the release project rather than in unit
 * because it is only meaningful when the working tree is coherent. During a
 * wave of parallel module work it is legitimately false, and a gate that is
 * expected to be red is a gate people learn to ignore.
 *
 * Gate 2 is the durable one: no test may invoke a generator without redirecting
 * its output. Gate 1 can only catch a drift that has already happened; gate 2
 * catches the mechanism that causes it.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { isForeignProbe } from '../probe-paths'

const GENERATORS = [
  'scripts/build-registries.mjs',
  'scripts/build-doh-module-reach.mjs',
  'scripts/build-stu-module-reach.mjs',
] as const

const COMMITTED = 'registries/generated'

/**
 * One file under registries/generated is NOT generated: the census
 * reconciliation is 80KB of hand-authored analysis that happens to live beside
 * the derived artefacts, and it is cited by tests, by two of the generated
 * registries, and by four census documents.
 *
 * This gate found it, by asking for the first time whether the directory's name
 * is true. It is not, and that is worth stating rather than papering over: a
 * hand-maintained file in a directory called "generated" invites a reader to
 * assume it is reproducible and a future clean-and-regenerate step to drop it.
 *
 * Moving it would break every citation, so instead the exception is named and
 * FIXED AT EXACTLY ONE. A second hand-authored file appearing here turns this
 * list red and forces the decision rather than quietly widening the exception.
 */
const HAND_AUTHORED = ['source-reconciliation.json'] as const

/**
 * Every generated file, path-relative to the output root, recursively.
 *
 * THE FOREIGN-PROBE EXCLUSION IS LOAD-BEARING HERE IN A WAY IT IS NOWHERE
 * ELSE, because this is the one walker that compares FILE SETS rather than
 * scanning file contents. `slice-2c-gates.test.ts` plants a scratch registry
 * `.zz-probe-<pid>.json` directly inside `registries/generated` — it must, to
 * trip a gate that lists that directory one level deep and keys on the
 * extension. A concurrent `pnpm test:release` therefore leaves a file in
 * `committed` that is absent from the fresh `scratch` generation, and the set
 * equality below goes red on a perfectly coherent tree.
 *
 * Note which tail is met here: the probe in THIS directory is the `.json`
 * one, not a `.zz-probe-<pid>` DIRECTORY. A predicate covering only the
 * directory shape would have left this hole exactly as it was — see
 * `tests/probe-paths.ts`, which is why there is now one predicate and not
 * two.
 *
 * No `own` argument: this file plants nothing, so it should see no probe at
 * all, and the `scratch` side is a private temp directory no other process
 * can reach.
 */
function walk(root: string, prefix = ''): readonly string[] {
  return readdirSync(join(root, prefix), { withFileTypes: true })
    .filter((e) => !isForeignProbe(e.name))
    .flatMap((e) => (e.isDirectory() ? walk(root, join(prefix, e.name)) : [join(prefix, e.name)]))
}

describe('the registries on disk are what the current tree generates', () => {
  // RED when: source changes land without the artefacts being regenerated, or
  // a generator's output changes without the files on disk following.
  //
  // Scope, stated plainly: this reads the working tree, not git. In a clean
  // checkout those are the same thing, so in CI it means "committed". Run
  // locally mid-edit it means "coherent right now", which is the weaker claim
  // and the one to trust.
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
  it('every generated file matches a fresh generation, byte for byte', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'aviixa-fresh-'))
    try {
      for (const script of GENERATORS) {
        execFileSync('node', [script], {
          cwd: process.cwd(),
          env: { ...process.env, AVIIXA_REGISTRY_OUT: scratch },
        })
      }
      const generated = [...walk(scratch)].sort()
      const committed = [...walk(COMMITTED)].sort()
      // A file that exists on one side only is the failure this catches most
      // often -- a new registry nobody committed, or a stale one nobody deleted.
      // The hand-authored exception is added to the expected set rather than
      // filtered out of the actual one, so losing it is a failure too.
      expect(committed, 'the set of files under registries/generated').toEqual(
        [...generated, ...HAND_AUTHORED].sort(),
      )
      for (const rel of generated) {
        expect(
          readFileSync(join(COMMITTED, rel), 'utf8'),
          `${rel} is stale -- run the generators and commit the result`,
        ).toBe(readFileSync(join(scratch, rel), 'utf8'))
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 30_000)
})

describe('no test writes the artefacts it checks', () => {
  /**
   * R2-04. This was five roots under `tests/`, each in a `try/catch` that
   * SWALLOWED a missing one, filtered to `/\.(test|spec)\.tsx?$/`. Both halves
   * could take the population to zero with nothing red:
   *
   *   - the catch meant a `tests/` restructure — one directory renamed — moved
   *     files out of the walk and reported nothing, and
   *   - the filter excluded `tests/helpers/*.ts`, `tests/setup.ts` and the six
   *     other non-`.test` modules under `tests/`, which is exactly where a call
   *     hoisted out of a test file would land. A generator invocation moved into
   *     a helper left the gate green.
   *
   * ONE ROOT, EVERY `.ts`/`.tsx` UNDER IT, AND NO CATCH. `readdirSync` throws
   * on a missing `tests/`, which is the correct report for "the subject is
   * gone" — the same choice `builtPageFiles()` in offline-phrasing.test.ts
   * makes about a missing `out/`. Widening from 320 files to 330 changed no
   * verdict: the three call sites and zero offenders are the same either way,
   * measured below.
   */
  const TEST_ROOT = 'tests'

  function testFiles(): readonly string[] {
    const out: string[] = []
    // Same rule as every other recursive walk in `tests/`: ask the question
    // rather than reason about whether this particular root can meet a probe.
    // No plant site aims at `tests/` today; four walks were left unguarded on
    // exactly that kind of reasoning.
    const visit = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name)) continue
        const p = join(dir, e.name)
        if (e.isDirectory()) visit(p)
        else if (/\.tsx?$/.test(e.name)) out.push(p)
      }
    }
    if (!statSync(TEST_ROOT).isDirectory()) throw new Error(`${TEST_ROOT} is not a directory`)
    visit(TEST_ROOT)
    return out.sort()
  }

  // The scan walks CALL SITES, not mentions. A first pass keyed on "the file
  // names this script somewhere" flagged three false positives -- a doc comment
  // explaining the generator, and this gate's own list of the scripts it
  // polices. Reading forward from each exec call instead means prose about a
  // generator is not mistaken for running one, and it also means this file
  // holds itself to the rule: the calls in gate 1 carry the redirect and pass.
  //
  // `exec` is the trap in this list, and it fired. `\bexec\s*\(` matches
  // `RegExp.prototype.exec` — the `\b` is satisfied by the `.` in front of
  // it — so `SLUG_RE.exec(body)` read as a child-process call, and any
  // generator path named in the next 400 characters convicted the file. A
  // registry test that parses `modules.ts` with a regex and explains which
  // generator it is checking does both within one comment, and did.
  //
  // A member call is excluded by requiring no `.` or word character before
  // the bare `exec`; the `child_process` names are distinctive enough to
  // stay as they were.
  const CALL = /\b(?:execFileSync|execSync|spawnSync|spawn)\s*\(|(?<![.\w])exec\s*\(/g

  // Far enough to clear the arguments and the options object of any realistic
  // call, short enough not to swallow the next statement.
  //
  // KNOWN LIMIT, measured rather than assumed: the window asks whether a
  // redirect appears in the next 400 characters, not whether THIS call carries
  // one. A bare call placed immediately above a redirected one is therefore
  // masked by its neighbour — planting one there stayed green, and the same
  // plant at the end of the file went red naming the file and the script.
  // Narrowing it to the call's own argument list means parsing balanced parens;
  // the exposure is one unredirected call written directly above a redirected
  // one, which gate 1 catches anyway by comparing the committed artefacts with
  // a fresh generation.
  const CALL_WINDOW = 400

  /**
   * The two counts that were unasserted, and either of which at zero passes the
   * `toEqual([])` below over nothing.
   *
   * MEASURED on this tree: 330 files, 3 generator call sites. The file floor is
   * pinned under the measurement with room for a slice's worth of churn; the
   * call-site floor is pinned AT the measurement, because the three sites are
   * named and enumerable and losing one is a fact worth a red rather than a
   * silence. If a call site is legitimately removed, this number comes down in
   * the same commit — that is the decision being forced, not a failure.
   */
  const MEASURED = { files: 330, callSites: 3 } as const
  const FILE_FLOOR = 300

  /**
   * Every generator call site in the test tree, each with whether its own
   * window carries the redirect. One walk, both claims: the floor below counts
   * these and the gate after it convicts the ones that are not redirected, so
   * the population the floor guarantees is the same population the gate reads.
   */
  function generatorCallSites(): readonly { readonly site: string; readonly redirected: boolean }[] {
    const sites: { site: string; redirected: boolean }[] = []
    for (const file of testFiles()) {
      const src = readFileSync(file, 'utf8')
      for (const match of src.matchAll(CALL)) {
        const at = match.index ?? 0
        const window = src.slice(at, at + CALL_WINDOW)
        const script = GENERATORS.find((g) => window.includes(g))
        if (script !== undefined) {
          sites.push({
            site: `${relative(process.cwd(), file)} -> ${script}`,
            redirected: window.includes('AVIIXA_REGISTRY_OUT'),
          })
        }
      }
    }
    return sites
  }

  it('reads the tests it polices, and finds generator calls to police', () => {
    expect(
      testFiles().length,
      `fewer than ${FILE_FLOOR} test-tree files scanned (measured ${MEASURED.files}): the walk ` +
        'has lost a subtree, and a scan of nothing reports no offender',
    ).toBeGreaterThanOrEqual(FILE_FLOOR)
    expect(
      generatorCallSites().length,
      'no generator call site found at all. The scan below then convicts nobody by construction; ' +
        'a call moved, renamed or hoisted out of the population is the failure this floor names',
    ).toBeGreaterThanOrEqual(MEASURED.callSites)
  })

  // RED when: any test shells out to a generator without AVIIXA_REGISTRY_OUT.
  it('every generator invocation in a test redirects its output', () => {
    const offenders = generatorCallSites()
      .filter((c) => !c.redirected)
      .map((c) => c.site)
    expect(
      offenders,
      'a test that runs a generator into registries/generated rewrites the committed artefacts',
    ).toEqual([])
  })
})

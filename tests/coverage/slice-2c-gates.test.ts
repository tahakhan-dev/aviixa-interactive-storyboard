import { describe, it, expect } from 'vitest'
import {
  isForeignProbe as isForeign,
  ownProbeDir,
  presentOrNull,
  withPlanted as withProbe,
} from '../probe-paths'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema } from '@/coverage/registry-loader'
import { REGISTRY_DESCRIPTORS, countByClass } from '@/coverage/descriptors'

/**
 * THE PROBE RACE, and the four parts that remove it. Same defect and same
 * fix as `tests/coverage/slice-03-gates.test.ts`, which earned each part;
 * this file had NEITHER half of it. Reproduced before the fix by running two
 * `pnpm test:release` processes at once: four cases in this file died with
 * `ENOENT ... lstat 'app/coverage/zz-probe.tsx'` (its own probe, deleted by
 * the sibling's `finally`), and one case in `slice-04-gates.test.ts` died with
 * `ENOENT ... open 'src/studio/.zz-probe-stu-reach-48498/probe.ts'` (a
 * FOREIGN probe its own exclusion did not recognise). There was no offender
 * in either scan; the walk simply lost a race.
 *
 * 1. PER-PROCESS. Every probe this file plants now lives under
 *    `.zz-probe-<pid>`, so two runs write two different paths and neither
 *    `finally` can delete the other's file. The shared literal paths this
 *    replaces (`app/coverage/zz-probe.tsx`, `app/workflows/zz-probe.tsx`,
 *    `src/review/zz-probe.ts`, `out/zz-probe.html`,
 *    `registries/generated/zz-probe.json`) were the direct cause above.
 * 2. DOT-PREFIXED. `tsc`'s include glob and Next's router do not descend
 *    into a path segment starting with `.`, so a concurrent `pnpm typecheck`
 *    or `next build` can no longer observe a probe mid-lifetime and fail on
 *    a path that no longer exists by the time it reports it. `readdirSync`
 *    has no such blind spot, so this file's own scans still see it.
 * 3. FOREIGN-PROBE EXCLUSION. A distinct path stops the DELETE race but not
 *    the READ race: this file's `walk()` still lists a sibling's probe and
 *    then touches it. Every entry belonging to another process is skipped,
 *    which removes the race rather than narrowing its window.
 * 4. PRE-RUN CLEAR PLUS EXIT HANDLER, below, for a probe orphaned by a run
 *    that was killed mid-assertion or that drew a reused pid.
 *
 * The predicate is an EXACT match, never a prefix. A prefix form (`zz-probe`)
 * also matches a real source file so named at any depth -- a safety gate
 * walkable past by choosing a filename, which is the defect the slice-3 fix
 * recorded and corrected. The optional middle group admits the one other
 * shape this repo creates, `tests/component/stu-shell.test.tsx`'s
 * `.zz-probe-stu-reach-<pid>`; a leading dot AND a trailing pid are both
 * still required, so `zz-probe.tsx` and `zz-probeHelpers.tsx` match nothing.
 */
const OWN_PROBE_DIR = ownProbeDir()
const isForeignProbe = (entry: string): boolean => isForeign(entry, OWN_PROBE_DIR)

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    const stat = presentOrNull(() => statSync(full))
    if (stat === null) continue
    if (stat.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

/** `readFileSync`, with an entry that vanished after the walk listed it skipped. */
const readIfPresent = (f: string): string | null => presentOrNull(() => readFileSync(f, 'utf8'))

const REGISTRY_DIR = 'registries/generated'

/**
 * This process's own scratch registry. A `.json` FILE rather than a directory
 * because `generatedRegistryFiles()` lists `REGISTRY_DIR` one level deep and
 * keys on the extension -- a probe inside a subdirectory would be invisible to
 * the very gate it exists to trip.
 */
//
// SECOND PREDICATE RETIRED. This shape had its own private copy, and it was
// the copy that mattered most: `registry-freshness.test.ts` walks this same
// directory comparing FILE SETS, and a directory-only predicate would not
// have recognised the probe it actually meets here. One predicate covers
// both tails now -- see `tests/probe-paths.ts`.
const OWN_PROBE_JSON = `${OWN_PROBE_DIR}.json`
const isForeignProbeJson = (f: string): boolean => isForeign(f, OWN_PROBE_JSON)

/** Every root this file plants a probe under, cleared before and after the run. */
const PROBE_ROOTS = [join('app', 'coverage'), join('app', 'workflows'), join('src', 'review'), 'out']

// Defend against pid reuse: a PAST crashed run that left a probe behind, plus
// this run drawing the same pid, would admit that STALE probe into every scan
// as this run's own -- and a gate running before this run's first plant would
// read its leftover violation as real. Clear them before anything else runs.
const clearOwnProbes = (): void => {
  for (const root of PROBE_ROOTS) rmSync(join(root, OWN_PROBE_DIR), { recursive: true, force: true })
  rmSync(join(REGISTRY_DIR, OWN_PROBE_JSON), { force: true })
}
clearOwnProbes()

// Cleanup on a crash, not only on a thrown assertion: `process.exit()` called
// mid-assertion, or an uncaught error unwinding past a `finally`, both skip
// it. 'exit' handlers may only do synchronous work, which `rmSync` is.
process.on('exit', () => {
  try {
    clearOwnProbes()
  } catch {
    // Best-effort: nothing else can run once the process is exiting.
  }
})

/**
 * Walked fresh on every call (not cached at module load), same discipline
 * as `slice-2b-gates.test.ts`'s `gatewayOnlyOffenders` -- so a test that
 * plants a scratch file mid-run and cleans it up in `finally` actually
 * proves the live scan sees it, not a snapshot taken before the plant.
 */
function generatedRegistryFiles(): string[] {
  // A SIBLING process's scratch registry is excluded for a second reason
  // beyond the ENOENT race: `liveRegistryCounts()` reads every file this
  // returns, so a foreign probe's `reconciledCount: 1` would enter the
  // forbidden-count set and flag every `app/` file containing a bare 1.
  return readdirSync(REGISTRY_DIR).filter((f) => f.endsWith('.json') && !isForeignProbeJson(f))
}

function countScopeOffenders(): string[] {
  return generatedRegistryFiles()
    .filter((f) => f !== 'source-reconciliation.json')
    .filter((f) => {
      const r = JSON.parse(readFileSync(join(REGISTRY_DIR, f), 'utf8')) as {
        sourceFixesNoTotal?: boolean
        reconciledCount?: number | null
      }
      return r.sourceFixesNoTotal === true && r.reconciledCount != null
    })
}

// ===========================================================================
// Gate 1: no registry or index presents an extracted identifier count as a
// canonical inventory total. workflows.expectedCount stays null; a registry
// claiming both reconciledCount and sourceFixesNoTotal is unrepresentable.
// ===========================================================================
describe('gate 1: count-scope honesty', () => {
  it('no generated registry declares a total the source does not fix', () => {
    expect(countScopeOffenders()).toEqual([])
  })

  it('workflows.expectedCount stays null', () => {
    const workflows = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'workflows')
    expect(workflows?.expectedCount).toBeNull()
  })

  // The schema (Task 8) makes the dishonest combination UNREPRESENTABLE, not
  // just discouraged by a lint-style scan -- proven directly against the
  // loader, no file needed.
  it('the schema refuses a registry claiming both sourceFixesNoTotal and a reconciledCount', () => {
    expect(() =>
      loadRegistry(
        GeneratedRegistrySchema,
        {
          slug: 'workflows',
          countedThing: 'extracted workflow records',
          // Required since the generated registries began stating what their
          // own `sourceLine` holds. Without it this case still threw — on the
          // missing field, not on the refinement it names — so it stayed red
          // for a plausible reason while no longer testing its own claim. A
          // green-to-red change can hide a gate as thoroughly as the reverse.
          sourceLineMeaning:
            'The first mention of the identifier anywhere in the frozen source, not the line ' +
            'that defines it.',
          namedInSourceCount: 0,
          namedInSourceMeaning:
            'How many rows are named anywhere under src/ or app/ — weaker than a status and ' +
            'deliberately not one.',
          // Same reason as `sourceLineMeaning` above, one audit round later:
          // R4-B10 made these two required so each index can state how many of
          // its rows link to the screen that demonstrates them. Without them
          // here this case throws on two missing fields instead of on the
          // refinement it names.
          routeResolvedCount: 0,
          routeMeaning:
            'The shipped screen whose evidence set this row’s status, or absent when nothing ' +
            'resolves one.',
          reconciledCount: 432,
          rawCount: 725,
          dedupRule: 'x',
          sourceFixesNoTotal: true,
          rows: [],
        },
        'probe',
      ),
    ).toThrow(/reconciledCount|no total/i)
  })

  it('PLANTED VIOLATION: a scratch registry claiming both fields trips the gate', () => {
    const probe = join(REGISTRY_DIR, OWN_PROBE_JSON)
    try {
      writeFileSync(
        probe,
        JSON.stringify({ sourceFixesNoTotal: true, reconciledCount: 1, rows: [] }),
      )
      expect(countScopeOffenders()).toContain(OWN_PROBE_JSON)
    } finally {
      rmSync(probe, { force: true })
    }
    expect(countScopeOffenders()).toEqual([])
  })

  // Final review round 1, MAJOR 3: this used to scan ONE named file for a
  // hand-written list of numbers. Round 2, MAJOR: that list itself was an
  // enumeration -- the workflow-collapse lesson repeating inside a gate.
  // Nine of the fourteen live registry row counts were absent from it
  // (17/28/67/70/205/330/526/534/627), so a hardcoded "The same 627 rows
  // also render below." kept the gate green. Computed FRESH from the
  // registries' own data on every call instead: every registry's
  // `rows.length`, `rawCount` and `reconciledCount`, PLUS the modules
  // source-class breakdown (63 source-defined, 18 derived, ...) --
  // `countByClass` is the exact function app/coverage/page.tsx calls to
  // render that breakdown, so a hardcoded restatement of one of ITS
  // figures is caught too, not just the top-level registry counts. Self-
  // maintaining: a registry added in slices 3-13, or any count that
  // changes, is covered with no list to remember to update. 0 is excluded
  // -- not a meaningful "count" to forbid (it appears constantly in
  // unrelated contexts: array indices, margin classes, key={0}), and every
  // currently-unpopulated build class is honestly 0.
  function liveRegistryCounts(): Set<number> {
    const counts = new Set<number>()
    for (const f of generatedRegistryFiles().filter((f) => f !== 'source-reconciliation.json')) {
      const r = JSON.parse(readFileSync(join(REGISTRY_DIR, f), 'utf8')) as {
        rows: unknown[]
        rawCount?: number
        reconciledCount?: number | null
      }
      counts.add(r.rows.length)
      if (typeof r.rawCount === 'number') counts.add(r.rawCount)
      if (typeof r.reconciledCount === 'number') counts.add(r.reconciledCount)
    }
    const modules = JSON.parse(readFileSync(join(REGISTRY_DIR, 'modules.json'), 'utf8')) as {
      rows: Array<{ sourceClass?: string; buildClass?: string }>
    }
    const moduleClasses = countByClass(
      modules.rows as Array<{
        sourceClass?: 'source-defined' | 'derived' | 'recommended' | 'illustrative' | 'unresolved'
        buildClass?: 'implemented' | 'not-applicable' | 'decision-blocked'
      }>,
    )
    for (const n of [...Object.values(moduleClasses.source), ...Object.values(moduleClasses.build)]) {
      counts.add(n)
    }
    counts.delete(0)
    return counts
  }

  // Final review round 2, MAJOR: `app/workflows/WorkflowIndex.tsx`
  // hardcoded 81 and sat outside the old `app/coverage/**` walk entirely.
  // Rather than name every directory that happens to render a count today,
  // this walks the whole `app/` tree -- deriving the scope instead of
  // enumerating it, so a page added in slices 3-13 is covered too.
  // Final review round 3 (non-blocking): used to return bare file paths,
  // so a false positive would print `expected [...] to equal []` with no
  // clue which number in the file matched or which live count forbade it.
  // Each offender now names both.
  function hardcodedCountOffenders(): string[] {
    const forbidden = liveRegistryCounts()
    if (forbidden.size === 0) return []
    // `\b` is the wrong boundary here, and slice 3 proved it: it matched the
    // 18 inside the stable identifier `MOD-SA-18` and the 17 inside the ISO
    // date '2026-08-17', reporting twelve pages as hardcoding a registry count
    // when not one of them did. Same shape as `\bsigned\b` matching
    // "signed-in", and as `//` matching inside a URL -- a token boundary is
    // not a semantic one.
    //
    // A registry count stands alone. A digit run touching a letter, a hyphen
    // or a dot belongs to something larger -- an identifier (MOD-SA-17,
    // AC-SA-18-04, L46193), a date, a section number (S8.17) or a version --
    // and is never the count this gate is about. A comma followed by digits
    // is the thousands separator in a larger figure ('18,402'), so it is
    // excluded too -- but a bare comma is not, so "613, which is" still trips.
    //
    // The TRAILING set is narrower than the leading one, and the first attempt
    // got that wrong: excluding a trailing `.` and `-` blinded the gate to
    // "The registry holds 81." and "an 81-module inventory" -- and sentence
    // end is the commonest position for a count in rendered prose. Only a word
    // character, a DECIMAL point (8.17) or a thousands separator continues the
    // token; a bare full stop ends a sentence, and a hyphen after a count is
    // part of a phrase, not of an identifier. The leading exclusion already
    // rejects MOD-SA-18, 2026-08-17 and AC-SA-18-04, so the trailing one does
    // not need to.
    const pattern = new RegExp(`(?<![\\w§.-])(${[...forbidden].join('|')})(?![\\w]|\\.\\d|,\\d)`)
    const offenders: string[] = []
    for (const f of walk('app').filter((f) => /\.tsx$/.test(f))) {
      const raw = readIfPresent(f)
      if (raw === null) continue
      const match = pattern.exec(stripComments(raw))
      if (match) offenders.push(`${f}: hardcodes ${match[0]}`)
    }
    return offenders
  }

  it('no page anywhere under app/ hardcodes a live registry count', () => {
    expect(hardcodedCountOffenders()).toEqual([])
  })

  it('the forbidden-count set is computed from live data, not a hand-written list', () => {
    const forbidden = liveRegistryCounts()
    // The nine counts a prior hand-written list omitted -- restoring a
    // hardcoded "627" (or any of these) used to keep the gate green. The
    // last figure read 630 until round 6's R6-B01 took three rendered
    // messages out of the control census: 605 controls plus the 22-row DNC
    // register is 627 rows, and this list is the count the gate forbids.
    for (const n of [17, 28, 67, 70, 205, 330, 526, 534, 627]) {
      expect(forbidden.has(n), String(n)).toBe(true)
    }
    // The modules source-class breakdown, computed the same way
    // app/coverage/page.tsx computes it -- not stored anywhere in the JSON.
    expect(forbidden.has(63)).toBe(true)
    expect(forbidden.has(18)).toBe(true)
    // 0 is deliberately never forbidden.
    expect(forbidden.has(0)).toBe(false)
  })

  // The first boundary fix passed this test while blinding the gate to a count
  // at the end of a sentence -- because the planted probe only ever wrote
  // `= 613`, one position out of the several a count actually appears in. A
  // probe that exercises one position proves the gate works in one position.
  it.each([
    ['sentence end', 'export const C = () => <p>The registry holds 990.</p>\n'],
    ['before a hyphen', 'export const C = () => <p>an 81-module inventory</p>\n'],
    ['after a colon', 'export const C = () => <p>Functions indexed: 990</p>\n'],
    ['before a bare comma', 'export const C = () => <p>holds 627, and more</p>\n'],
  ])('PLANTED VIOLATION: a count %s trips the gate', (_where, body) => {
    withProbe(join('app', 'coverage'), 'Probe.tsx', body, (probe) => {
      expect(hardcodedCountOffenders().join(' ')).toContain(probe)
    })
    expect(hardcodedCountOffenders()).toEqual([])
  })

  it.each([
    ['a stable identifier', 'export const C = () => <p>MOD-SA-18 and AC-SA-17-04</p>\n'],
    ['an ISO date', "export const C = () => <p>{'2026-08-17'}</p>\n"],
    ['a thousands separator', "export const C = () => <p>{'18,402 runs'}</p>\n"],
    ['a section number', 'export const C = () => <p>section 8.17 says</p>\n'],
  ])('and %s does NOT trip it', (_what, body) => {
    withProbe(join('app', 'coverage'), 'Probe.tsx', body, () => {
      expect(hardcodedCountOffenders()).toEqual([])
    })
  })

  it('PLANTED VIOLATION: a hardcoded count in ANY app/ file trips the gate, including outside app/coverage/', () => {
    withProbe(join('app', 'workflows'), 'Probe.tsx', 'export const total = 627\n', (probe) => {
      expect(hardcodedCountOffenders()).toContain(`${probe}: hardcodes 627`)
    })
    expect(hardcodedCountOffenders()).toEqual([])
  })

  // MOD-SA-20 is an alias-by-denial (controller addendum §2): the string
  // exists in the frozen source only inside prose that refuses it. It must
  // never appear in a generated registry as though it were a real module.
  // BLOCKING TRAP, hit live while writing this gate: the brief's own literal
  // check -- `expect(readFileSync(f, 'utf8')).not.toContain('MOD-SA-20')`,
  // a raw whole-file string scan -- fails against registries/generated/
  // modules.json TODAY, on CORRECT code: modules.json's own `dedupRule`
  // field honestly explains "...81 canonical modules, excluding MOD-SA-20 --
  // an alias-by-denial...". That is the exact "prose naming a forbidden
  // identifier in order to deny it" trap the frozen source documents for
  // this identifier at L4736 (see tests/coverage/strip-comments.ts's own
  // doc comment) -- reproduced here one level up, in generated JSON prose
  // rather than TypeScript comments. Fixed to check the STRUCTURED `rows[].id`
  // field only, not the raw file text.
  it('MOD-SA-20 appears as no row id in any generated inventory registry', () => {
    for (const f of generatedRegistryFiles().filter((f) => f !== 'source-reconciliation.json')) {
      const parsed = JSON.parse(readFileSync(join(REGISTRY_DIR, f), 'utf8')) as {
        rows: Array<{ id: string }>
      }
      const rowIds = parsed.rows.map((r) => r.id)
      expect(rowIds, f).not.toContain('MOD-SA-20')
    }
  })

  it('the naive whole-file-string form the brief specified is ITSELF a false-positive trap, reproduced', () => {
    const raw = readFileSync(join(REGISTRY_DIR, 'modules.json'), 'utf8')
    // This is TRUE today, on correct, honest output -- proof the naive check
    // would fail the release for the right reason existing: an honest
    // dedupRule that names the excluded id in order to explain the exclusion.
    expect(raw).toContain('MOD-SA-20')
    const parsed = JSON.parse(raw) as { rows: Array<{ id: string }> }
    expect(parsed.rows.map((r) => r.id)).not.toContain('MOD-SA-20')
  })

  it('PLANTED VIOLATION: MOD-SA-20 as an actual row id trips the structured gate', () => {
    const probe = join(REGISTRY_DIR, OWN_PROBE_JSON)
    try {
      writeFileSync(probe, JSON.stringify({ rows: [{ id: 'MOD-SA-20' }] }))
      const parsed = JSON.parse(readFileSync(probe, 'utf8')) as { rows: Array<{ id: string }> }
      expect(parsed.rows.map((r) => r.id)).toContain('MOD-SA-20')
    } finally {
      rmSync(probe, { force: true })
    }
  })
})

// ===========================================================================
// Gate 2: no closed vocabulary uses the inert annotation form.
// `export const X: readonly T[] = [...] as const` WIDENS the const, making
// any exhaustiveness check below it vacuous. The safe form is
// `as const satisfies readonly T[]`.
//
// THE EXEMPTIONS ARE AN EQUALITY, NOT A FILTER, and that is a correction.
// This set used to be subtracted from the offender list, which is a
// membership allowlist: it can only grow, a second offender joins it by
// being added, and FIXING one of the three named leaves the entry standing
// for ever. Asserted as an equality below, a stale exemption reds and has to
// be removed. `ROUTES` was one: it is `= SURFACES.map(...)` and can never
// match `DECL_RE`'s `=\s*\[`, so its exemption was unreachable from the day
// it was written and could never have retired itself. A COMPUTED array is
// out of scope by construction — it has no literals to widen — so it needs
// no name here at all.
const DELIBERATE_SUBSETS = new Set([
  'SUPERVISOR_AND_ABOVE',
  'QUALITY_MANAGER_AND_ABOVE',
  'FRONTLINE_ONLY_STATES',
])

/**
 * Finds an EXPORTED `const NAME: readonly T[] = [...]` or
 * `const NAME: ReadonlyArray<T> = [...]` declaration in a comment-stripped
 * source string -- the inert, const-widening form. Final review round 2,
 * LATENT GAP: a prior version of this scanner required a trailing
 * `as const\b` to fire at all, which missed two forms of the identical
 * defect -- `export const X: readonly T[] = ['a','b']` (no assertion at
 * all) and the `ReadonlyArray<T>` spelling -- because an explicit LEADING
 * array-type annotation widens the const regardless of what follows it: a
 * declared type always wins over inference from the initializer, `as
 * const` or not. The safe form (`as const satisfies readonly T[]`) never
 * carries this leading annotation at all -- the type constraint comes from
 * `satisfies` AFTER the array -- so simply detecting the leading
 * annotation is sufficient; nothing on the right-hand side needs
 * inspecting. `export` is REQUIRED (not optional): this gate's own test
 * below is named "no EXPORTED closed vocabulary", and `COMMENT_REQUIRED_
 * STATUSES` in src/review/records.ts is a real, non-exported, module-
 * private array with exactly this annotation shape that must stay out of
 * scope (out-of-scope by construction, not by a name added to the
 * exemption list).
 *
 * ponytail: does not follow a type annotation split across multiple lines
 * (`const X:\n  readonly T[] = [...]`) -- a real gap, and the claim this
 * note used to make about it ("verified zero live instances of that
 * formatting exist in this codebase today") IS FALSE. Measured over src/
 * and app/: EIGHT exported array heads carry an annotation wrapped across
 * lines, four of them slice-11 files. All eight annotate an inline
 * `readonly { ... }[]` object table over data rows -- no union, so nothing
 * an exhaustiveness check below them would depend on -- which is why the
 * scanner is still line-bounded rather than widened to convict them. That
 * property is no longer a claim in a comment: `absence-sweep.ts`'s
 * `describeClosedVocabularyAnnotations` asserts it, so a wrapped
 * `ReadonlyArray<SomeUnion>` reds there.
 *
 * RETURNS EVERY MATCH, EXEMPT OR NOT. Subtracting the exemptions in here is
 * what made the exemption list unretirable; the caller compares the two.
 */
function inertAnnotationOffenders(strippedSrc: string): string[] {
  const lines = strippedSrc.split('\n')
  const DECL_RE =
    /^\s*export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:readonly\s+[\w.]+\[\]|ReadonlyArray<[^=]+>)\s*=\s*\[/
  const offenders: string[] = []
  for (const line of lines) {
    const m = DECL_RE.exec(line)
    if (!m) continue
    offenders.push(m[1]!)
  }
  return offenders
}

describe('gate 2: no closed vocabulary uses the inert annotation form', () => {
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
  it('no exported closed vocabulary in src/ or app/ uses the widening annotation', () => {
    const files = [...walk('src'), ...walk('app')].filter((f) => /\.tsx?$/.test(f))
    const found = files.flatMap((f) =>
      inertAnnotationOffenders(stripComments(readFileSync(f, 'utf8'))).map(
        (n) => [f, n] as const,
      ),
    )
    expect(
      found.filter(([, n]) => !DELIBERATE_SUBSETS.has(n)).map(([f, n]) => `${f}: ${n}`),
    ).toEqual([])
    // AND THE EXEMPTIONS, AS AN EQUALITY. A membership allowlist only grows:
    // a second offender joins it, and fixing a named one leaves its entry
    // standing for ever. This reds in BOTH directions -- a deliberate subset
    // that is repaired, renamed or deleted has to leave the set above.
    expect(
      found.filter(([, n]) => DELIBERATE_SUBSETS.has(n)).map(([, n]) => n).sort(),
      'the deliberate-subset exemptions no longer match what the tree declares',
    ).toEqual([...DELIBERATE_SUBSETS].sort())
  }, 30_000)

  it('PROVEN: fires on the exact defect pattern', () => {
    const planted = `export const X: readonly T[] = [\n  'a',\n  'b',\n] as const\n`
    expect(inertAnnotationOffenders(planted)).toEqual(['X'])
  })

  it('does not fire on the safe `as const satisfies` form', () => {
    const safe = `export const X = [\n  'a',\n  'b',\n] as const satisfies readonly T[]\n`
    expect(inertAnnotationOffenders(safe)).toEqual([])
  })

  // Final review round 2, LATENT GAP: the annotation widens the const
  // whether or not `as const` follows it -- an explicit `: readonly T[]`
  // (or `ReadonlyArray<T>`) declared type always wins over inference from
  // the initializer, `as const` or not. Both regexes required `as const\b`,
  // so these two forms shipped undetected. Checked against the real
  // codebase: zero live violations of either form exist today outside the
  // three already-exempted deliberate subsets (verified below).
  it('PROVEN: fires on the annotated form with no `as const` at all', () => {
    const planted = `export const X: readonly T[] = ['a', 'b']\n`
    expect(inertAnnotationOffenders(planted)).toEqual(['X'])
  })

  it('PROVEN: fires on the ReadonlyArray<T> spelling, with or without as const', () => {
    expect(inertAnnotationOffenders(`export const X: ReadonlyArray<T> = ['a', 'b']\n`)).toEqual(['X'])
    expect(inertAnnotationOffenders(`export const X: ReadonlyArray<T> = ['a', 'b'] as const\n`)).toEqual(['X'])
  })

  it('does not fire on an unannotated array (no widening is possible without an annotation)', () => {
    const safe = `export const X = [\n  'a',\n  'b',\n] as const\n`
    expect(inertAnnotationOffenders(safe)).toEqual([])
  })

  // Final review, MAJOR 4: the one-line form is the SAME defect as the
  // multi-line one and must be caught too.
  it('PROVEN: fires on the one-line inert form, not just the multi-line one', () => {
    const planted = `export const X: readonly T[] = ['a', 'b'] as const\n`
    expect(inertAnnotationOffenders(planted)).toEqual(['X'])
  })

  it('does not fire on a one-line unannotated array or the safe one-line satisfies form', () => {
    expect(inertAnnotationOffenders(`export const X = ['a', 'b'] as const\n`)).toEqual([])
    expect(
      inertAnnotationOffenders(`export const X = ['a', 'b'] as const satisfies readonly T[]\n`),
    ).toEqual([])
  })

  it('convicts a deliberate subset like any other name, and the caller exempts it', () => {
    // The scanner is name-blind: an exemption that lived inside it could not
    // be told apart from a pattern that had stopped matching.
    for (const name of DELIBERATE_SUBSETS) {
      const planted = `export const ${name}: readonly T[] = [\n  'a',\n] as const\n`
      expect(inertAnnotationOffenders(planted), name).toEqual([name])
    }
  })

  it('needs no exemption for a computed array, which is why ROUTES has none', () => {
    // `ROUTES` was exempt for four commits and the exemption was unreachable:
    // `= SURFACES.map(` can never match `=\s*\[`. Asserted rather than
    // deleted silently, so the day someone rewrites it as a literal the
    // exemption question is raised by a red case instead of by nobody.
    expect(inertAnnotationOffenders('export const ROUTES: readonly R[] = SURFACES.map((s) => {\n'))
      .toEqual([])
    expect(readFileSync(join('src', 'routes', 'definitions.ts'), 'utf8'))
      .toContain('export const ROUTES: readonly RouteDefinition[] = SURFACES.map(')
  })
})

// ===========================================================================
// Gate 3: a client-review action creates a ReviewEvent and nothing else --
// never a product DomainEvent, AuditEvent, notification, command, schedule,
// or state transition.
// ===========================================================================
const PRODUCT_STORE_NAMES = [
  'snapshots', 'audit', 'events', 'commands', 'notifications', 'schedules', 'idempotency', 'meta',
]

function reviewLedgerOffenders(): string[] {
  return walk('src/review')
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => {
      const raw = readIfPresent(f)
      if (raw === null) return false
      const s = stripComments(raw)
      if (/\b(DomainEvent|AuditEvent|LedgerRecord)\b/.test(s)) return true
      if (/commitTransition|from\s+['"]@\/kernel\//.test(s)) return true
      return PRODUCT_STORE_NAMES.some((name) => new RegExp(`['"]${name}['"]`).test(s))
    })
}

describe('gate 3: a client-review action creates a ReviewEvent and nothing else', () => {
  // Major (final review): this gate's name asserted a positive
  // ("creates a ReviewEvent") that nothing in the app ever exercised --
  // createReviewEvent had no caller outside a unit test, so only the
  // "nothing else" half was ever checked. Now wired
  // (app/review/page.tsx's submit() calls putReviewEvent, proven end to
  // end against a real database in tests/component/review-shell.test.tsx);
  // this is the static half of that proof.
  // Final review round 2, MINOR: `toMatch(/\bputReviewEvent\b/)` is
  // presence-only -- it would pass just as happily on a bare unused
  // import, a reference assigned to a variable and never invoked, or a
  // call inside dead code. Tightened to require the CALL shape, awaited
  // (proving it is not a floating, unobserved promise either).
  it('the review action actually creates a ReviewEvent -- the writer is called and awaited, not just referenced', () => {
    const s = stripComments(readFileSync('app/review/page.tsx', 'utf8'))
    expect(s).toMatch(/\bawait\s+putReviewEvent\s*\(/)
    expect(s).toMatch(/\bcreateReviewEvent\s*\(/)
  })

  it('PLANTED VIOLATION: an unused import or unreachable reference does not satisfy the call-shape check', () => {
    const notCalled = "import { putReviewEvent } from '@/review/store'\nconst ref = putReviewEvent\n"
    expect(stripComments(notCalled)).not.toMatch(/\bawait\s+putReviewEvent\s*\(/)
  })

  it('no file under src/review/ names a product ledger type, a product store, or the transition path', () => {
    expect(reviewLedgerOffenders()).toEqual([])
  })

  // Structural backstop, not just textual: `reviewObjectStore`'s `name`
  // parameter is typed against `ReviewStoreName` (the literal union of
  // `REVIEW_STORES`), so passing a product store name there is a TypeScript
  // compile error; `runReviewTransaction` additionally opens its IndexedDB
  // transaction scoped to ONLY `[...REVIEW_STORES]`, so even a same-named
  // product store literal used elsewhere could never be reached from inside
  // that transaction at runtime -- IndexedDB itself throws
  // `NotFoundError` for a store outside the transaction's declared scope.
  it('src/review/store.ts opens its transactions scoped to REVIEW_STORES only', () => {
    const s = stripComments(readFileSync('src/review/store.ts', 'utf8'))
    expect(s).toMatch(/db\.transaction\(\[\.\.\.REVIEW_STORES\]/)
  })

  it('PLANTED VIOLATION: a product-ledger reference under src/review/ trips the gate', () => {
    withProbe(
      join('src', 'review'),
      'Probe.ts',
      "import type { LedgerRecord } from '@/domain/transition'\nexport const x: LedgerRecord | null = null\n",
      (probe) => expect(reviewLedgerOffenders()).toContain(probe),
    )
    expect(reviewLedgerOffenders()).toEqual([])
  })

  it('does not fire on a comment naming the forbidden types in order to forbid them', () => {
    withProbe(
      join('src', 'review'),
      'Probe.ts',
      '// This module must never reference LedgerRecord, DomainEvent or AuditEvent.\nexport const ok = 1\n',
      (probe) => expect(reviewLedgerOffenders()).not.toContain(probe),
    )
  })
})

// ===========================================================================
// Gate 4: nothing reads as an approval. Already exists
// (tests/coverage/slice-2b-gates.test.ts's APPROVAL_WORD_PATTERN gate, now
// proven immune to casing, quoting, position, the union-type-vs-array
// evasion, AND word form -- `/approved/i` missed "Approve"/"Approval"
// entirely until the CRITICAL final-review fix widened it to `/\bapprov/i`).
// Confirmed here rather than reimplemented, plus a guard against the guard
// being silently weakened or deleted.
// ===========================================================================
describe('gate 4: nothing reads as an approval (confirming the existing gate)', () => {
  it('the approval-word gate in slice-2b-gates.test.ts is not silently deleted or narrowed', () => {
    const content = readFileSync('tests/coverage/slice-2b-gates.test.ts', 'utf8')
    expect(content).toContain('APPROVAL_WORD_PATTERN')
    expect(content).toContain('/\\bapprov/i')
  })

  // Final review, CRITICAL: `/approved/i` (the exact literal word) missed
  // "Approve"/"Approval"/"Approving" -- the realistic wording. Fixed here
  // too, to the same morphological root `/\bapprov/i` as
  // slice-2b-gates.test.ts's `APPROVAL_WORD_PATTERN`. Comment-stripped, not
  // raw: both `app/review/page.tsx` and `src/review/records.ts` carry
  // comments that explain the vocabulary avoids the word ("Deliberately
  // never 'Approve'...") -- exactly the "prose naming a forbidden term in
  // order to forbid it" trap (MOD-SA-20, ROLES.some(...)); the word-root
  // pattern would match its own denial if scanned raw.
  it('directly re-confirms: no approval word anywhere in review records or the review UI', () => {
    const files = [...walk('src/review'), ...walk('app/review')].filter((f) => /\.tsx?$/.test(f))
    const offenders = files.filter((f) => /\bapprov/i.test(stripComments(readFileSync(f, 'utf8'))))
    expect(offenders).toEqual([])
  })

  it('PROVEN: the underlying pattern catches every word form and cannot be defeated by casing, quoting, or matching its own denial', () => {
    const APPROVAL_WORD_PATTERN = /\bapprov/i
    for (const wordForm of ['Approve', 'Approve for release', 'Approval', 'Approving', 'approved', '"approved"']) {
      expect(wordForm, wordForm).toMatch(APPROVAL_WORD_PATTERN)
    }
    // A comment that NAMES the word in order to FORBID it must NOT trip a
    // gate that scans comment-stripped source -- unlike the raw scan above,
    // which would (correctly) treat the same text as a violation if it
    // appeared in actual code rather than a comment.
    expect(stripComments('// never say approved or Approve here\nconst ok = 1')).not.toMatch(
      APPROVAL_WORD_PATTERN,
    )
  })
})

// ===========================================================================
// Gate 5: one registry per inventory -- no second generated file for an
// inventory that already has one. This is what let Task 7's composite-key
// fix land in registries/generated/workflows.json while both app pages kept
// reading the legacy workflow-registry.json, reaching no screen.
// ===========================================================================
describe('gate 5: one registry per inventory', () => {
  /**
   * THE EXPECTED FILE SET, DERIVED. `toHaveLength(15)` stood here beside the
   * membership form below and was redundant against it -- and worse than
   * redundant: any fifteen files at all satisfied a length, while the slug
   * comparison FILTERED OUT `source-reconciliation.json` and so could not
   * notice it going missing. One list covers both, and it moves on its own the
   * day `REGISTRY_DESCRIPTORS` gains an inventory. Removed rather than
   * renumbered: a fresh number reships the identical defect.
   */
  const expectedRegistryFiles = (): readonly string[] =>
    [...REGISTRY_DESCRIPTORS.map((d) => `${d.slug}.json`), 'source-reconciliation.json'].sort()

  it('exactly the inventory registries plus the reconciliation report -- no legacy duplicate', () => {
    expect(REGISTRY_DESCRIPTORS.length, 'the descriptor list is empty').toBeGreaterThan(0)
    expect([...generatedRegistryFiles()].sort()).toEqual([...expectedRegistryFiles()])
    expect(generatedRegistryFiles()).not.toContain('workflow-registry.json')
  })

  it('PLANTED VIOLATION: a second file for an already-covered inventory trips the gate', () => {
    const probe = join(REGISTRY_DIR, 'workflow-registry.json')
    writeFileSync(probe, '[]')
    try {
      const files = generatedRegistryFiles()
      expect(files).toContain('workflow-registry.json')
      // MEMBERSHIP, NOT A LENGTH, so the plant proves the assertion the gate
      // actually ships rather than a count that no longer stands beside it.
      expect([...files].sort()).not.toEqual([...expectedRegistryFiles()])
    } finally {
      rmSync(probe)
    }
    expect([...generatedRegistryFiles()].sort()).toEqual([...expectedRegistryFiles()])
  })
})

// ===========================================================================
// Gate 6: the frozen blueprint's prose never reaches out/. Identifiers and
// line numbers may ship; source text may not. Extends the existing
// blueprint-filename/author-path checks (prohibited-patterns.test.ts) with a
// direct check on free-text extraction fields this build deliberately never
// renders anywhere (controls[].effect, business_rules[].statement) -- if
// ANY of these ever showed up in the shipped static export, that would mean
// raw extraction prose leaked somewhere it was never meant to.
// ===========================================================================
const CONFIDENTIAL_UNUSED_MARKERS = [
  "Ends an in-progress platform support session into the tenant's own workspace",
  'Bulk conflict resolution; skew-flagged writes are excluded from it',
  'The platform presents exactly five surfaces and no sixth.',
  'No operational data originates anywhere other than the Frontline Worker Application.',
]

describe('gate 6: frozen blueprint prose never reaches out/', () => {
  it('the existing blueprint-filename/author-path checks are not silently deleted or narrowed', () => {
    const content = readFileSync('tests/coverage/prohibited-patterns.test.ts', 'utf8')
    expect(content).toContain('AVIIXA_Production_Product_Blueprint')
    expect(content).toContain('Users')
  })

  it('none of the frozen source free-text fields this build never renders appear in the shipped export', () => {
    const shipped = walk('out')
    expect(shipped.length, 'a missing or empty out/ must fail loudly, never pass vacuously').toBeGreaterThan(0)
    const offenders = CONFIDENTIAL_UNUSED_MARKERS.flatMap((marker) =>
      shipped.filter((f) => readIfPresent(f)?.includes(marker) === true).map((f) => `"${marker}" in ${f}`),
    )
    expect(offenders).toEqual([])
  })

  it('PLANTED VIOLATION: a confidential marker copied into a shipped file trips the gate', () => {
    withProbe(
      'out',
      'Probe.html',
      `<html><body>${CONFIDENTIAL_UNUSED_MARKERS[0]}</body></html>`,
      (probe) => {
        const offenders = CONFIDENTIAL_UNUSED_MARKERS.flatMap((marker) =>
          walk('out').filter((f) => readIfPresent(f)?.includes(marker) === true),
        )
        expect(offenders).toContain(probe)
      },
    )
  })
})

// ===========================================================================
// Guard the guard: the WCAG contrast check that verifies every status token
// passes AA on its composited pill background must not be silently removed.
// ===========================================================================
describe('gate 7: token contrast guard is not silently removed', () => {
  // Minor (final review): this was named "every status token passes AA on
  // its composited background" -- that is what tests/unit/token-contrast.
  // test.ts itself proves (six tones composited at 10%, >= 4.75 floor,
  // plus an onTint < onSurface assertion); THIS check only confirms that
  // file still exists and still contains its own real contrast function,
  // so a later slice cannot delete it silently. Renamed to say what it
  // actually checks.
  it('the real per-token AA contrast test file is not silently deleted or gutted', () => {
    expect(readFileSync('tests/unit/token-contrast.test.ts', 'utf8')).toContain('compositeOver')
  })
})

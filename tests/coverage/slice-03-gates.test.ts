import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'
import { SA_MODULES } from '@/surfaces/sa/modules'
import { SA_TENANTS } from '@/surfaces/sa/tenants'
import { SA_FRESHNESS, saAggregateText, saFreshnessFor } from '@/surfaces/sa/freshness'
import { SA_APPLICABLE_STATE_IDS } from '@/surfaces/sa/screen-states'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { CRITICAL_ACTIONS, CRITICAL_ACTION_COUNT_NOTE } from '@/surfaces/sa/critical-actions'

const SA_ROOT = join('app', 'super-admin')

// This process's own scratch-probe directory name (see `withPlanted` below).
// Any OTHER `.zz-probe-*` entry under SA_ROOT belongs to a different process
// -- a sibling `pnpm test:release` run, or a stale leftover from one that
// crashed. Giving each process a distinct probe path stops them overwriting
// one file, but `saSources()` still walks every directory under SA_ROOT -- so
// without this exclusion, one process's walk would list a SIBLING's probe
// too, and lose the race when that sibling's own `finally` deletes it
// mid-scan (reproduced directly: ENOENT reading the OTHER pid's Probe.tsx,
// not this process's own). Skipping every foreign `.zz-probe-*` entry makes
// each process's scan blind to every probe but its own, which removes the
// race rather than narrowing its window -- and, as a side effect, also makes
// a leftover from a crashed run invisible to every later run's scan, since a
// later run's own pid essentially never matches the stale one.
//
// Dot-prefixed, not just pid-suffixed: `tsc`'s `include` glob (`**/*.tsx`)
// does not descend into a path segment starting with `.` -- verified
// directly, a deliberate type error planted in a dot-prefixed probe was
// invisible to `pnpm typecheck` -- so a concurrent typecheck run can no
// longer observe this file mid-lifetime and fail on a path that, by the time
// it reports the error, no longer exists. `readdirSync` (what `walk` uses)
// has no such blind spot, so `saSources()` still sees the probe exactly as
// before; only external tooling that globs the tree loses sight of it.
const OWN_PROBE_DIR = `.zz-probe-${process.pid}`

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (/^\.?zz-probe/.test(e) && e !== OWN_PROBE_DIR) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

/**
 * Every authored SURF-SA source file, comments stripped.
 *
 * INCLUDES the shared spine. `src/ui/sa/` and `src/surfaces/sa/` carry copy
 * that renders on all nineteen screens — the invariant chips, the prohibition
 * notices, the access-class descriptions, the freeze disclosure — and the
 * first version of these gates walked `app/super-admin/` alone, so a forbidden
 * word or a person dimension introduced in the spine would have reached every
 * screen while every gate stayed quiet.
 */
const SA_SOURCE_ROOTS = [SA_ROOT, join('src', 'ui', 'sa'), join('src', 'surfaces', 'sa')]

function saSources(): { file: string; src: string }[] {
  return SA_SOURCE_ROOTS.filter((r) => existsSync(r))
    .flatMap((r) => walk(r))
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => ({ file: f, src: stripComments(readFileSync(f, 'utf8')) }))
}

/**
 * Plant a violation in a scratch file under app/super-admin/, prove the gate
 * catches it, then remove it and prove the gate goes quiet again. A gate that
 * cannot fail reports safety it does not provide, and this build has shipped
 * four of those: one defeated by letter casing, one blinded by a regex
 * literal, one that matched its own denial, and an approval gate that missed
 * every word form but the past tense.
 *
 * The probe directory is suffixed with `process.pid`, not fixed. Two
 * `pnpm test:release` processes running at once used to collide on the one
 * literal path `app/super-admin/zz-probe/Probe.tsx` -- one process's
 * `finally` block deleting the probe out from under the other's assertion,
 * observed as ENOENT, as `expected '' to contain …Probe.tsx`, and as 5s
 * timeouts once enough assertions queued up behind the missing file. A pid is
 * stable for the life of one process and distinct between any two processes
 * alive at once, so two runs now write to two different directories and
 * cannot delete each other's probe -- and `walk()`'s exclusion above stops
 * one process from ever reading the other's probe in the first place, which
 * a differing path alone did not: a scan can still list a sibling's probe
 * before its `finally` deletes it. Creation and the write are inside the
 * `try` too, so a failure partway through still cleans up rather than only
 * the success path doing so.
 *
 * Cleanup on a crash, not only on a thrown assertion: `process.exit()` called
 * mid-assertion, or an uncaught error unwinding past this stack, both skip a
 * pending `finally`. The module-level `process.on('exit', ...)` below is a
 * second, independent cleanup path for exactly that case -- 'exit' handlers
 * may only do synchronous work, which `rmSync` is. A hard kill (SIGKILL, an
 * OOM kill) still bypasses everything in userspace, `finally` and 'exit'
 * alike; a probe orphaned that way is handled by the two properties above
 * instead of by cleanup: dot-prefixed, so it stays invisible to `tsc` and to
 * `next build`, and foreign to every later run's `walk()`, so it never
 * re-enters a gate's scan.
 */
function withPlanted(contents: string, assertCaught: (probe: string) => void): void {
  const dir = join(SA_ROOT, OWN_PROBE_DIR)
  const probe = join(dir, 'Probe.tsx')
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(probe, contents)
    assertCaught(probe)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

process.on('exit', () => {
  try {
    rmSync(join(SA_ROOT, OWN_PROBE_DIR), { recursive: true, force: true })
  } catch {
    // Best-effort: nothing else can run once the process is exiting.
  }
})

describe('slice 3 gate 1: the six invariants are status chips, never controls', () => {
  // R2, the single most likely visual error in the slice. A lock icon on a
  // switch is the obvious design, and two source passages literally say
  // "locked and unpressable" -- while AC-SA-INV-003 (L47849) forbids an off
  // control, an approval path AND a configuration key. A disabled toggle
  // implies an enabled state exists somewhere for someone.
  it('no invariant renders as a button, input, switch or click target', () => {
    const chip = readFileSync(join('src', 'ui', 'sa', 'InvariantChip.tsx'), 'utf8')
    const stripped = stripComments(chip)
    expect(stripped).not.toMatch(/<button/i)
    expect(stripped).not.toMatch(/<input/i)
    expect(stripped).not.toMatch(/role="switch"/i)
    expect(stripped).not.toMatch(/onClick/)
    expect(stripped).not.toMatch(/tabIndex/)
  })

  it('all six invariants exist and none carries an enable/disable affordance word', () => {
    expect(SA_INVARIANTS).toHaveLength(6)
    const words = /\b(enable|disable|turn off|switch off|toggle)\b/i
    for (const inv of SA_INVARIANTS) {
      expect(`${inv.name} ${inv.description}`, inv.id).not.toMatch(words)
    }
  })
})

describe('slice 3 gate 2: nothing on SURF-SA reads as a production claim', () => {
  // AC-SCOPE-033 (L2612) forbids describing the audit log as tamper-evident,
  // chained or signed. D10 extends it to `verified`. The word-boundary form
  // matters: "signed-in" tripped this in round 1, and the fix was the copy --
  // there is no authentication in this build -- not a narrower gate.
  const FORBIDDEN = /\b(tamper-evident|chained|signed|verified)\b/i

  function vocabularyOffenders(): string[] {
    return saSources()
      .filter(({ src }) => FORBIDDEN.test(src))
      .map(({ file }) => file)
  }

  it('uses none of the four forbidden words anywhere under app/super-admin/', () => {
    expect(vocabularyOffenders()).toEqual([])
  })

  it('PLANTED VIOLATION: a scratch screen using one of them trips the gate', () => {
    withPlanted(
      'export const Probe = () => <p>The audit log is tamper-evident.</p>\n',
      (probe) => expect(vocabularyOffenders()).toContain(probe),
    )
    expect(vocabularyOffenders()).toEqual([])
  })
})

describe('slice 3 gate 3: support, not surveillance', () => {
  // R5. Nobody builds a worker ranking screen. Someone builds "Worker-Shifts
  // by tenant, trending", then per-site, then per-shift, and the last step is
  // per-worker. Worker-Shift is a billing unit (AC-GOAL-060, L2241): a count
  // on a commercial ledger, never a rate, never a series below tenant-month,
  // never a comparison between people.
  //
  // THREE AXES, because spec S6 names three and the first version of this gate
  // tested one. It was also a case-SENSITIVE eight-word list, so `WorkerId`,
  // `operatorId`, `personId`, `employeeId`, `worker_ref` and a column headed
  // 'Worker' all walked past it -- and letter casing is the exact defeat this
  // build already records once, in a gate that missed
  // `_clientMiddlewareManifest.js`.
  //
  // It matches STRUCTURE, not prose: an earlier draft matched the phrase
  // "per-worker" and flagged six DENIALS ("There is no per-worker row"), which
  // is the disclosure the spec requires.

  // AXIS 1 — a record keyed by a person, or a column naming one.
  // TWO shapes, because requiring a suffix was a REGRESSION: the rewrite that
  // added aliases also demanded `(id|name|ref|label|key)`, so `perWorker`,
  // `byWorker`, `workerRanking`, `productivityScore` and `efficiencyRating` --
  // every one of which the eight-word list it replaced DID catch -- started
  // passing. Widening one axis narrowed another.
  const PERSON_DIMENSION = new RegExp(
    [
      // a field keyed by a person
      String.raw`\b(worker|operator|person|employee|individual|staff)[_-]?(id|name|ref|label|key)\b`,
      // a measure sliced or ranked by one
      String.raw`\b(per|by)[_-]?(worker|operator|employee|person)\b`,
      String.raw`\b(worker|operator|employee)[_-]?(ranking|rank|score|league)\b`,
      String.raw`\b(productivity|efficiency|performance)[_-]?(score|rating|index)\b`,
    ].join('|'),
    'i',
  )
  // `Worker-Shift` is the BILLING UNIT (AC-GOAL-060, L2241) and belongs on the
  // metering ledger, so the person token is excluded when it is part of that
  // compound. A column headed "Worker" is surveillance; a column headed
  // "Worker-Shifts metered against allocation" is a commercial measure. This
  // is the third time in this build a gate has matched a token inside a larger
  // term it does not mean -- after `signed` inside "signed-in" and `18` inside
  // `MOD-SA-18` -- so the rule is the same: match the semantic unit.
  const PERSON_COLUMN =
    /header:\s*['"`][^'"`]*\b(worker(?!-shift)|operator|employee)\b/i

  // AXIS 2 — a rate. A measure per unit time is a pace measure.
  const RATE = /\b(per\s*(hour|minute|second)|\/\s*(hr|hour|min)|throughput|runs?\s*per\b|rate\s*of\s*work)\b/i

  // AXIS 3 — a series below tenant-month. Worker-Shift is a monthly billing
  // count; anything finer is the first step down the chain.
  const SUB_MONTH_SERIES =
    /\b(per[\s-]?(shift|run|day|hour)|by[\s-]?(shift|run|day)|daily\s+(count|total|series)|hourly\s+(count|total|series))\b/i

  function offenders(re: RegExp): string[] {
    return saSources()
      .filter(({ src }) => {
        // A denial is not a violation: "No per-shift view exists" states the
        // absence the spec requires. Only a line that is NOT a denial counts.
        return src
          .split('\n')
          .some((line) => re.test(line) && !/\b(no|never|not|cannot|neither|nor|absent|prohibited)\b/i.test(line))
      })
      .map(({ file }) => file)
  }

  it('AXIS 1: no record or column carries a person dimension', () => {
    expect(offenders(PERSON_DIMENSION)).toEqual([])
    expect(offenders(PERSON_COLUMN)).toEqual([])
  })

  it('AXIS 2: no measure is expressed as a rate', () => {
    expect(offenders(RATE)).toEqual([])
  })

  it('AXIS 3: no series runs below tenant-month', () => {
    expect(offenders(SUB_MONTH_SERIES)).toEqual([])
  })

  it.each([
    ['a worker-keyed row', 'export const R = [{ workerId: "WKR-1", shifts: 12 }]\n', 'PERSON_DIMENSION'],
    ['a camelCase variant', 'export const R = [{ WorkerName: "A" }]\n', 'PERSON_DIMENSION'],
    ['an operator alias', 'export const R = [{ operatorId: "OP-9" }]\n', 'PERSON_DIMENSION'],
    ['an employee alias', 'export const R = [{ employee_ref: "E-3" }]\n', 'PERSON_DIMENSION'],
    ['a column headed Worker', "export const C = [{ key: 'w', header: 'Worker' }]\n", 'PERSON_COLUMN'],
    ['a rate', 'export const M = "412 runs per hour"\n', 'RATE'],
    ['a per-shift series', 'export const M = "Runs per shift, trending"\n', 'SUB_MONTH_SERIES'],
  ])('PLANTED VIOLATION: %s trips the gate', (_what, body) => {
    withPlanted(body, (probe) => {
      const all = [
        ...offenders(PERSON_DIMENSION),
        ...offenders(PERSON_COLUMN),
        ...offenders(RATE),
        ...offenders(SUB_MONTH_SERIES),
      ]
      expect(all).toContain(probe)
    })
  })

  it.each([
    ['a denial of a per-worker view', 'export const N = "No per-worker view exists on this console."\n'],
    ['a denial of a per-shift series', 'export const N = "There is no per-shift or per-run series here."\n'],
  ])('and %s does NOT trip it', (_what, body) => {
    withPlanted(body, () => {
      const all = [
        ...offenders(PERSON_DIMENSION),
        ...offenders(PERSON_COLUMN),
        ...offenders(RATE),
        ...offenders(SUB_MONTH_SERIES),
      ]
      expect(all).toEqual([])
    })
  })
})

describe('slice 3 gate 4: names are canonical, screen numbers are annotations', () => {
  // D1/R6. Two SCR-SA numbering schemes disagree on nearly every number below
  // 26, and SCR-SA-03 alone names both the atom registry and the agent roster.
  // Anything keyed on a bare number eventually wires the wrong screen.
  it('no route directory is named after a bare SCR-SA number', () => {
    const dirs = readdirSync(SA_ROOT).filter((e) => statSync(join(SA_ROOT, e)).isDirectory())
    for (const d of dirs) expect(d, `${d} is keyed on a screen number`).not.toMatch(/^scr-sa-\d+$/i)
  })

  it('every module route directory matches its registry slug', () => {
    const dirs = new Set(
      readdirSync(SA_ROOT)
        .filter((e) => !/^\.?zz-probe/.test(e))
        .filter((e) => statSync(join(SA_ROOT, e)).isDirectory()),
    )
    for (const m of SA_MODULES) {
      expect(dirs.has(m.slug), `${m.id} expects app/super-admin/${m.slug}/`).toBe(true)
    }
  })
})

describe('slice 3 gate 5: the module inventory is nineteen, and MOD-SA-20 is not one', () => {
  it('ships exactly nineteen modules across two bands, seven and twelve', () => {
    expect(SA_MODULES).toHaveLength(19)
    expect(SA_MODULES.filter((m) => m.band === 'definition')).toHaveLength(7)
    expect(SA_MODULES.filter((m) => m.band === 'operations')).toHaveLength(12)
  })

  it('mints no MOD-SA-20 route, id or slug', () => {
    // Scoped to structured values, never to prose: the frozen source records
    // that a search over text "would otherwise match itself", because the only
    // place MOD-SA-20 appears is in prose refusing it (TEST-COV-111, L4736).
    expect(SA_MODULES.map((m) => m.id)).not.toContain('MOD-SA-20')
    const dirs = readdirSync(SA_ROOT).filter((e) => statSync(join(SA_ROOT, e)).isDirectory())
    for (const d of dirs) expect(d).not.toMatch(/fundability/i)
  })
})

describe('slice 3 gate 6: the eleven critical-class actions', () => {
  // D12. The source titles the list "ten" and enumerates eleven (L55942).
  // A routing table built from a list short by one silently drops a root
  // approval, so the count is eleven and the discrepancy is recorded.
  it('carries eleven, not the ten the source names', () => {
    expect(CRITICAL_ACTIONS).toHaveLength(11)
  })

  it('records the count discrepancy rather than silently padding or truncating', () => {
    // A list short by one drops a root approval; a list padded to a round
    // number invents one. The note has to say which happened and why.
    expect(CRITICAL_ACTION_COUNT_NOTE).toMatch(/\bten\b/i)
    expect(CRITICAL_ACTION_COUNT_NOTE).toMatch(/\beleven\b/i)
    expect(CRITICAL_ACTION_COUNT_NOTE).toMatch(/L55942/)
  })

  it('every critical action carries a distinct id and a source locator', () => {
    const ids = CRITICAL_ACTIONS.map((a) => a.id)
    expect(new Set(ids).size, 'duplicate critical-action id').toBe(ids.length)
    for (const a of CRITICAL_ACTIONS) expect(a.sourceRef, a.id).toMatch(/L\d+/)
  })
})

describe('slice 3 gate 7: no ambient browsing', () => {
  // AC-SA-000-07 (L42885), AC-SEC-801 (L104316). Every module screen has a
  // plausible reason to link into a tenant record -- an incident to its run, a
  // metric to its data, an audit row to the object it names. The everyday
  // instance of this hazard is a metric tile with a drill-through, not a
  // trace viewer.
  function tenantLinkOffenders(): string[] {
    const out: string[] = []
    for (const { file, src } of saSources()) {
      // A route that reaches into another surface's record space.
      if (/href=["'`]\/(hub|studio|command-center|frontline)\//.test(src)) out.push(file)
    }
    return out
  }

  it('no SURF-SA screen links into another surface’s record space', () => {
    expect(tenantLinkOffenders()).toEqual([])
  })

  it('PLANTED VIOLATION: a drill-through into the Hub trips the gate', () => {
    withPlanted(
      'export const Probe = () => <a href="/hub/runs/RUN-1">Open the run</a>\n',
      (probe) => expect(tenantLinkOffenders()).toContain(probe),
    )
    expect(tenantLinkOffenders()).toEqual([])
  })
})

describe('slice 3 gate 8: every module survives an artificial-intelligence outage', () => {
  // AC-SA-000-09 (L42887): with every model unavailable, all nineteen modules
  // remain operable and the emergency pause remains exercisable. STATE-11 is a
  // tested requirement on every module, not decoration.
  //
  // The first version of this gate COUNTED FILES -- `withState11.length >= 19`
  // over 21 sa-*.test.tsx files. It passed at the boundary by coincidence: 19
  // matched, and the two that did not happen not to be module tests. It would
  // have kept passing with two module tests missing STATE-11 entirely, and it
  // read raw text rather than comment-stripped source, so a mention in a
  // comment counted. It never mapped a module to its test at all.
  // EVERY test naming the module, not the first one found. Taking the first
  // match attributed MOD-SA-01 to a neighbouring module's test that merely
  // cross-references it, and then reported the real test as missing -- the
  // same first-match-wins fragility that made the registry build attribute a
  // route to whichever module was seen first.
  // Parsed ONCE. Reading and comment-stripping all twenty-one test files for
  // each of nineteen modules is 399 AST parses, which timed out -- a gate
  // slow enough to go red on timing teaches people to re-run it rather than
  // read it, so it is made fast rather than given more time.
  const MODULE_TESTS: readonly { file: string; src: string }[] = readdirSync(
    join('tests', 'component'),
  )
    .filter((x) => /^sa-.*\.test\.tsx$/.test(x))
    .map((f) => ({
      file: f,
      src: stripComments(readFileSync(join('tests', 'component', f), 'utf8')),
    }))

  function testSourcesFor(moduleId: string): { file: string; src: string }[] {
    return MODULE_TESTS.filter((t) => t.src.includes(moduleId))
  }

  it('every one of the nineteen modules maps to a component test naming it', () => {
    const missing = SA_MODULES.filter((m) => testSourcesFor(m.id).length === 0).map((m) => m.id)
    expect(missing, 'modules with no component test naming them').toEqual([])
  })

  it('every module test exercises STATE-11, in code and not in a comment', () => {
    const missing: string[] = []
    for (const m of SA_MODULES) {
      const ts = testSourcesFor(m.id)
      if (!ts.some((t) => t.src.includes('STATE-11'))) missing.push(m.id)
    }
    expect(missing, 'modules whose test never reaches the AI-unavailable state').toEqual([])
  })

  it('every module test walks all twelve applicable screen states', () => {
    // The test this replaces was named "…naming the applicable screen states"
    // and asserted only that a file contained the module id. It checked no
    // state at all.
    //
    // Its first replacement asked whether each test NAMED all twelve ids, and
    // flagged eighteen of nineteen -- because the tests iterate a shared list
    // rather than spelling out ids. That was the gate testing the wrong thing.
    // So the question is the honest one: does the test walk the SHARED twelve,
    // or does it enumerate them itself?
    expect(SA_APPLICABLE_STATE_IDS, 'STATE-07 is frontline-only').toHaveLength(12)
    const gaps: string[] = []
    for (const m of SA_MODULES) {
      const ts = testSourcesFor(m.id)
      if (ts.length === 0) continue
      const covered = ts.some(
        (t) =>
          t.src.includes('SA_APPLICABLE_STATE') ||
          t.src.includes('APPLICABLE_STATES') ||
          SA_APPLICABLE_STATE_IDS.every((id) => t.src.includes(id)),
      )
      if (!covered) gaps.push(m.id)
    }
    expect(gaps, 'module tests that neither walk the shared states nor name all twelve').toEqual([])
  })
})

describe('slice 3 gate 9: every critical-class action discloses its freeze', () => {
  // D13 / DEC-ROOTSUCC-001. The root approves its own critical requests
  // because no second approver exists, so root unavailability FREEZES them
  // rather than routing them elsewhere.
  //
  // THIS GATE WENT MISSING. It was written, then a later patch script that
  // rewrote gate 8 truncated the file from gate 8 onward; gates 10-13 were
  // appended after, so the sequence read 1-8, 10-13 and the count still said
  // twelve. Nothing asserted the freeze for several commits, which is how two
  // screens shipped a <RootUnavailableFreeze> stranded AFTER the component's
  // closing brace -- dead top-level JSX that typechecked, linted, and rendered
  // nothing, on the two screens carrying seven of the eleven critical actions.
  //
  // So it asks the question that survives both failures: does the built page
  // SAY it? A declaration in a file is not a disclosure on a screen.
  function declaredActions(): Map<string, string[]> {
    const byModule = new Map<string, string[]>()
    for (const d of readdirSync(SA_ROOT)) {
      const dir = join(SA_ROOT, d)
      if (!statSync(dir).isDirectory()) continue
      const src = readdirSync(dir)
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => readFileSync(join(dir, f), 'utf8'))
        .join('\n')
      const m = src.match(/<RootUnavailableFreeze\s+actions=\{\[([\s\S]*?)\]\}/)
      if (m === null) continue
      byModule.set(d, [...(m[1] ?? '').matchAll(/'([a-z-]+)'/g)].map((x) => x[1] as string))
    }
    return byModule
  }

  it('every declaring screen RENDERS the freeze in the static export', () => {
    const declaring = [...declaredActions().keys()]
    expect(declaring.length, 'no screen declares a critical action').toBeGreaterThan(0)
    const silent = declaring.filter((slug) => {
      const page = join('out', 'super-admin', slug, 'index.html')
      return !existsSync(page) || !readFileSync(page, 'utf8').includes('Critical class frozen')
    })
    expect(silent, 'screens that declare the freeze and render none').toEqual([])
  })

  it('all eleven critical actions are declared by some screen', () => {
    const declared = new Set<string>([...declaredActions().values()].flat())
    const missing = CRITICAL_ACTIONS.map((a) => a.id).filter((id) => !declared.has(id))
    expect(missing, 'critical actions offered with no freeze disclosure').toEqual([])
  })

  it('no critical action is claimed by two screens', () => {
    const declared = [...declaredActions().values()].flat()
    const dupes = declared.filter((id, i) => declared.indexOf(id) !== i)
    expect([...new Set(dupes)]).toEqual([])
  })

  it('every declared id is one of the eleven, not an invented one', () => {
    const known = new Set<string>(CRITICAL_ACTIONS.map((a) => a.id))
    for (const [mod, ids] of declaredActions()) {
      for (const id of ids) expect(known.has(id), `${mod} declares unknown action ${id}`).toBe(true)
    }
  })
})

describe('slice 3 gate 10: one name per illustrative tenant', () => {
  // A cross-module review found the same tenant id carrying two names --
  // "Bright Bikes" on five screens and "Brightbikes Manufacturing" on a sixth,
  // "North Forge" against "North Forge Components". No screen is wrong on its
  // own; only the set is, which is why per-module review could not see it.
  // "Bright Bikes" is the frozen source's own recurring fictional tenant.
  function nameConflicts(): string[] {
    const byId = new Map<string, Set<string>>()
    for (const { src } of saSources()) {
      for (const m of src.matchAll(/([A-Z][A-Za-z' -]{2,40}?)\s*\((TEN-[A-Z0-9]+)\)/g)) {
        const name = (m[1] ?? '').trim()
        const id = m[2] ?? ''
        if (!byId.has(id)) byId.set(id, new Set())
        byId.get(id)!.add(name)
      }
    }
    return [...byId.entries()]
      .filter(([, names]) => names.size > 1)
      .map(([id, names]) => `${id}: ${[...names].join(' / ')}`)
  }

  it('no tenant id is rendered under two different names', () => {
    expect(nameConflicts()).toEqual([])
  })

  it('every rendered tenant name matches the shared fixture', () => {
    const known = new Map(SA_TENANTS.map((t) => [t.id, t.name]))
    const wrong: string[] = []
    for (const { file, src } of saSources()) {
      for (const m of src.matchAll(/([A-Z][A-Za-z' -]{2,40}?)\s*\((TEN-[A-Z0-9]+)\)/g)) {
        const name = (m[1] ?? '').trim()
        const id = m[2] ?? ''
        const canonical = known.get(id)
        if (canonical !== undefined && name !== canonical) wrong.push(`${file}: ${id} as "${name}"`)
      }
    }
    expect(wrong).toEqual([])
  })

  // THE INVERSE, which the first version of this gate could not see. It
  // checked one NAME per ID and passed while the same tenant carried THREE
  // IDs: TEN-BRIGHTBIKES (the source's own, used 83 times), TEN-BRIGHT-BIKES
  // and TEN-BRIGHT. A consistency check that runs in one direction only is
  // half a check.
  it('no tenant name is rendered under two different ids', () => {
    const byName = new Map<string, Set<string>>()
    for (const { src } of saSources()) {
      for (const m of src.matchAll(/(?:id|value):\s*'(TEN-[A-Z-]+)',\s*(?:name|label):\s*'([^']+)'/g)) {
        const id = m[1] ?? ''
        const name = (m[2] ?? '').trim()
        if (!byName.has(name)) byName.set(name, new Set())
        byName.get(name)!.add(id)
      }
    }
    const conflicts = [...byName.entries()]
      .filter(([, ids]) => ids.size > 1)
      .map(([name, ids]) => `"${name}": ${[...ids].join(' / ')}`)
    expect(conflicts, 'one tenant carrying more than one id').toEqual([])
  })

  it('every tenant id on the surface is one the shared fixture knows', () => {
    const known = new Set<string>(SA_TENANTS.map((t) => t.id))
    const unknown = new Set<string>()
    for (const { src } of saSources()) {
      for (const m of src.matchAll(/\bTEN-[A-Z-]+\b/g)) {
        if (!known.has(m[0])) unknown.add(m[0])
      }
    }
    expect([...unknown], 'tenant ids invented outside SA_TENANTS').toEqual([])
  })

  // Checked against the SHARED FIXTURE, not against a second literal. Once the
  // screens stopped hardcoding names, one planted literal was the only one on
  // the surface, so there was nothing left for it to CONFLICT with -- the
  // conflict check can no longer be tripped by a single plant, which is the
  // consolidation working rather than the gate failing. What still catches it
  // is the name not matching SA_TENANTS.
  it('PLANTED VIOLATION: a re-worded tenant name trips the gate', () => {
    withPlanted(
      'export const P = () => <p>Bright Bikes Manufacturing Ltd (TEN-BRIGHTBIKES)</p>\n',
      () => {
        const known = new Map(SA_TENANTS.map((t) => [t.id, t.name]))
        const wrong: string[] = []
        for (const { file, src } of saSources()) {
          for (const m of src.matchAll(/([A-Z][A-Za-z' -]{2,40}?)\s*\((TEN-[A-Z0-9-]+)\)/g)) {
            const canonical = known.get(m[2] ?? '')
            if (canonical !== undefined && (m[1] ?? '').trim() !== canonical) wrong.push(file)
          }
        }
        expect(wrong.join(' ')).toContain('zz-probe')
      },
    )
  })
})

describe('slice 3 gate 11: one aggregate vocabulary, and two distinct states', () => {
  // Ten screens defined their own freshness type with SIX different member
  // sets between them, and one had drifted to `fresh` / `not-yet-arrived` --
  // inventing words for a vocabulary the frozen source states as
  // current/stale/unavailable/reconciled (L42991) -- while collapsing
  // STATE-02 (Loading) and STATE-13 (Recovery) into one rendering the other
  // eighteen keep apart. No screen was wrong alone.
  it('no screen invents a word outside the shared aggregate vocabulary', () => {
    const invented = /'(fresh|not-yet-arrived|nyа|pending-arrival)'/
    const offenders = saSources()
      .filter(({ src }) => invented.test(src))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('STATE-02 and STATE-13 map to different renderings', () => {
    // A value that has not arrived is not a value being rebuilt after a
    // failure, and telling a reviewer otherwise hides which one the screen is
    // in.
    expect(saFreshnessFor('STATE-02')).not.toBe(saFreshnessFor('STATE-13'))
    expect(saAggregateText(saFreshnessFor('STATE-02'), 'x')).not.toBe(
      saAggregateText(saFreshnessFor('STATE-13'), 'x'),
    )
  })

  it('no aggregate rendering is a zero or a blank (AC-SA-01-03)', () => {
    for (const f of SA_FRESHNESS) {
      const text = saAggregateText(f, 'REAL VALUE')
      expect(text.trim(), f).not.toBe('')
      expect(text.trim(), f).not.toBe('0')
    }
  })
})

describe('slice 3 gate 12: one tab-title shape across the surface', () => {
  // Four formats shipped across nineteen routes and five carried no product
  // name at all, so a reviewer with several tabs open could not tell which
  // console a tab belonged to. Cosmetic alone; a navigation defect in a
  // storyboard whose whole job is to be walked through.
  it('every Super Admin route names the console in its title', () => {
    const pages = readdirSync(SA_ROOT)
      .filter((d) => statSync(join(SA_ROOT, d)).isDirectory())
      .map((d) => join(SA_ROOT, d, 'page.tsx'))
      .filter((f) => existsSync(f))
    expect(pages.length, 'nineteen module routes').toBe(19)
    const wrong = pages.filter(
      (f) => !/— Super Admin Platform Console/.test(readFileSync(f, 'utf8')),
    )
    expect(wrong, 'routes not naming the console in their tab title').toEqual([])
  })
})

describe('slice 3 gate 13: STATE-06 states its cause once', () => {
  // src/ui/screen-state.ts: "Every input is disabled, with ONE banner naming
  // the cause" and "Never scatter the cause across several messages. One
  // banner, one cause."
  //
  // The question is HOW MANY TIMES, not whether. Two earlier drafts got this
  // wrong in opposite directions: one keyed on the identifier `blocked` and so
  // missed MOD-SA-08, which restated the cause from a `mode === 'read-only'`
  // branch; the next matched the sentence anywhere and flagged the BANNER,
  // which is the one place the cause belongs. A screen may state it once. A
  // second statement is the scatter.
  const CAUSE_SENTENCE =
    /read-only in this state|every input (on this module )?is disabled|Read-only \(STATE-06\)/gi

  function scatterOffenders(): string[] {
    const out: string[] = []
    for (const { file, src } of saSources()) {
      // `{/* ... */}` is a JSX expression container holding a comment. The
      // TypeScript scanner does not report it as a comment range, so the
      // stripper cannot remove it and the text survives while rendering
      // nothing. Dropped rather than counted.
      const rendered = src.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')

      // Count STATEMENTS, not regex matches. One sentence can contain two of
      // the alternatives -- "Read-only (STATE-06): every input is disabled"
      // matched twice and reported a single, correct banner as a scatter. A
      // statement is one string literal or one JSX text run.
      const chunks = rendered.match(/'[^']*'|"[^"]*"|`[^`]*`|>[^<>{}]+</g) ?? []
      const hits = chunks.filter((c) => {
        CAUSE_SENTENCE.lastIndex = 0
        return CAUSE_SENTENCE.test(c)
      }).length
      if (hits > 1) out.push(`${file}: states the read-only cause ${hits} times`)
    }
    return out
  }

  it('no screen states the read-only cause more than once', () => {
    expect(scatterOffenders()).toEqual([])
  })

  it('PLANTED VIOLATION: a second statement of the cause trips the gate', () => {
    withPlanted(
      'export const P = () => (<><p>Read-only (STATE-06)</p><p>every input is disabled</p></>)\n',
      (probe) => expect(scatterOffenders().join(' ')).toContain(probe),
    )
    expect(scatterOffenders()).toEqual([])
  })

  it('and ONE statement — the banner — does not', () => {
    withPlanted(
      'export const P = () => <p>Read-only (STATE-06): the fixture put this module in a read-only state.</p>\n',
      () => expect(scatterOffenders()).toEqual([]),
    )
  })
})

describe('slice 3 gate 14: no dead controls', () => {
  // "A control that looks production-grade but does nothing is a defect, not a
  // demonstration" (spec §8). MOD-SA-09 rendered three invitation buttons live
  // for the Admin with no handler at all: a click did nothing, silently. Three
  // module reviews and two cross-module passes missed it, because every one of
  // them read what the code SAYS rather than what a control DOES.
  //
  // An enabled Button must carry an onClick. A disabled one must carry a
  // disabledReason. A control with no reason is as dead as one with no handler.
  function deadControls(): string[] {
    const out: string[] = []
    for (const { file, src } of saSources()) {
      for (const m of src.matchAll(/<Button\b([^>]*)>/g)) {
        const attrs = m[1] ?? ''
        const wired = /onClick=/.test(attrs)
        const reasoned = /disabledReason=/.test(attrs)
        const spread = /\{\.\.\./.test(attrs) // {...props} may carry either
        if (!wired && !reasoned && !spread) {
          out.push(`${file}:${src.slice(0, m.index).split('\n').length}`)
        }
      }
    }
    return out
  }

  it('every Button is either wired or carries a stated reason', () => {
    expect(deadControls(), 'buttons that neither act nor say why they cannot').toEqual([])
  })

  it('PLANTED VIOLATION: a button with neither trips the gate', () => {
    withPlanted(
      'export const P = () => <Button variant="secondary">Do a thing</Button>\n',
      (probe) => expect(deadControls().join(' ')).toContain(probe),
    )
    expect(deadControls()).toEqual([])
  })
})

describe('slice 3 gates: the file itself', () => {
  // THIRD TIME. Three separate patch scripts of mine rewrote a gate with
  // `write(src.slice(0, start) + replacement)` and silently truncated every
  // gate defined after it. Gate 9 vanished that way and nothing asserted the
  // root-unavailable freeze for several commits, which is how two screens
  // shipped it as dead code; gate 14 vanished the same way minutes later.
  //
  // Both times the count still looked right because I checked how many gates
  // existed rather than WHICH. A sequence check costs nothing and catches the
  // whole class.
  it('defines gates 1..N with no gap, so a truncating edit cannot hide one', () => {
    const src = readFileSync(join('tests', 'coverage', 'slice-03-gates.test.ts'), 'utf8')
    const numbers = [...src.matchAll(/^describe\('slice 3 gate (\d+):/gm)].map((m) => Number(m[1]))
    expect(numbers.length, 'no gates found').toBeGreaterThan(0)
    const expected = Array.from({ length: numbers.length }, (_, i) => i + 1)
    expect(numbers, 'gate numbers are not a gapless 1..N sequence').toEqual(expected)
  })
})

describe('slice 3 gate 15: one label for the role switcher', () => {
  // Eighteen screens label it "View as platform role"; MOD-SA-04 said
  // "Console role" alone. A reviewer walking nineteen screens should not have
  // to relearn the control that changes what every screen shows -- and the
  // wording matters beyond consistency: "View as" says this is a VIEW
  // SWITCHER, not a login. There is no authentication in this build.
  it('every screen carrying a role switcher uses the same label', () => {
    const labels = new Set<string>()
    for (const { src } of saSources()) {
      for (const m of src.matchAll(/label="([^"]*\brole\b[^"]*)"/gi)) labels.add(m[1] ?? '')
    }
    expect([...labels], 'more than one wording for the role switcher').toEqual([
      'View as platform role',
    ])
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'
import { SA_MODULES } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { CRITICAL_ACTIONS, CRITICAL_ACTION_COUNT_NOTE } from '@/surfaces/sa/critical-actions'

const SA_ROOT = join('app', 'super-admin')

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

/** Every authored SURF-SA source file, comments stripped. */
function saSources(): { file: string; src: string }[] {
  return walk(SA_ROOT)
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
 */
function withPlanted(contents: string, assertCaught: (probe: string) => void): void {
  const dir = join(SA_ROOT, 'zz-probe')
  const probe = join(dir, 'Probe.tsx')
  mkdirSync(dir, { recursive: true })
  writeFileSync(probe, contents)
  try {
    assertCaught(probe)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

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
  const PERSON_DIMENSION =
    /\b(worker|operator|person|employee|individual|staff)[_-]?(id|name|ref|label|key)\b/i
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
      readdirSync(SA_ROOT).filter((e) => statSync(join(SA_ROOT, e)).isDirectory()),
    )
    dirs.delete('zz-probe')
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
  it('every module route has a component test naming the applicable screen states', () => {
    const tests = readdirSync(join('tests', 'component')).filter((f) => /^sa-.*\.test\.tsx$/.test(f))
    const missing = SA_MODULES.filter(
      (m) => !tests.some((t) => stripComments(readFileSync(join('tests', 'component', t), 'utf8')).includes(m.id)),
    ).map((m) => m.id)
    expect(missing, 'modules with no component test naming them').toEqual([])
  })

  it('every module test exercises STATE-11', () => {
    const dir = join('tests', 'component')
    const withState11 = readdirSync(dir)
      .filter((f) => /^sa-.*\.test\.tsx$/.test(f))
      .filter((f) => readFileSync(join(dir, f), 'utf8').includes('STATE-11'))
    expect(withState11.length, 'module tests exercising the AI-unavailable state').toBeGreaterThanOrEqual(
      SA_MODULES.length,
    )
  })
})

describe('slice 3 gate 9: every critical-class action discloses its freeze', () => {
  // D13 / DEC-ROOTSUCC-001. The root approves its own critical requests
  // because no second approver exists, so root unavailability FREEZES them
  // rather than routing them elsewhere -- the most honest thing this
  // storyboard can show about the design.
  //
  // It shipped as per-screen prose, and a cross-module review found the
  // predictable result: five screens stated it and the two carrying SEVEN of
  // the eleven -- the emergency pause, and retention and legal hold -- omitted
  // it. Per-module review cannot see that; only a comparison across screens
  // can.
  //
  // The first version of this gate tried to INFER which screens offer a
  // critical action, and flagged ten -- including one whose copy reads "No
  // control in this module is one of the eleven critical-class actions" and
  // one that names an action owned elsewhere in order to render it ABSENT.
  // Matching prose again. So the disclosure is DECLARED instead: a screen
  // offering a critical action renders <RootUnavailableFreeze actions={...}>,
  // and the gate asserts the declarations cover all eleven exactly once.
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

  it('all eleven critical actions are declared by some screen', () => {
    const declared = new Set<string>([...declaredActions().values()].flat())
    const missing = CRITICAL_ACTIONS.map((a) => a.id).filter((id) => !declared.has(id))
    expect(missing, 'critical actions offered with no freeze disclosure').toEqual([])
  })

  it('no critical action is claimed by two screens', () => {
    const declared = [...declaredActions().values()].flat()
    const dupes = declared.filter((id, i) => declared.indexOf(id) !== i)
    expect([...new Set(dupes)], 'two screens claim the same critical action').toEqual([])
  })

  it('every declared id is one of the eleven, not an invented one', () => {
    const known = new Set<string>(CRITICAL_ACTIONS.map((a) => a.id))
    for (const [mod, ids] of declaredActions()) {
      for (const id of ids) expect(known.has(id), `${mod} declares unknown action ${id}`).toBe(true)
    }
  })
})

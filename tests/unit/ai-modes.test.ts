import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  AI_MODE_IDS,
  AI_MODE_ROWS,
  AI_MODE_TRANSITIONS,
  AGENT_INVOCATION_VALUES,
  ESCALATION_DELIVERY_VALUES,
  aiMode,
  modesCarryingWorkerLabel,
} from '@/ai/modes/vocabulary'
import {
  AIMODE_WORKER_DISCLOSURE_DECISION,
  applyTransition,
  boundedLiveness,
  enterMode,
  transitionsFrom,
} from '@/ai/modes/machine'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'

/**
 * Slice 11, wave 0, task 1 — the artificial-intelligence operating-mode
 * machine.
 *
 * WHAT THIS FILE IS FOR. Not "sixteen modes exist". Six things that are each
 * a way this module could be wrong while still looking right:
 *
 *   1. THE ROWS ARE COUNTED, NEVER INFERRED FROM A SPAN. The mode table's
 *      header and separator sit inside the span the re-plan cited for it, so
 *      a span read as a row count reads eighteen rows where there are sixteen.
 *      Every row index below is located by structure in the frozen bytes at
 *      run time.
 *   2. THE WORKER-VISIBLE LABEL IS NOT AN IDENTITY. Three pairs of modes
 *      share a label. A surface keyed on the label collapses them, and one of
 *      those collapses is the exact error `AC-42-303` exists to prevent.
 *   3. THE MATRIX AND THE PROSE SPELL FOUR LABELS DIFFERENTLY. Both spellings
 *      are in the source and both are pinned, so neither can be dropped by a
 *      later tidy-up.
 *   4. BOUNDED LIVENESS MUST NOT READ CONNECTIVITY. Asserted behaviourally
 *      (`TEST-42-303`) rather than by reading the implementation's comments.
 *   5. `AC-42-305` MUST NOT BE A COMMENT. The refusal is driven by the open
 *      decision canon, so the assertion is made against the canon rather than
 *      against a boolean this module chose.
 *   6. `AC-42-304` MUST BE A PRECONDITION. Each of the three kinds of
 *      outstanding work is exercised on its own, because a guard wired to one
 *      of three is the shape this build has shipped before.
 *
 * Every count and every locator below is re-derived from the frozen bytes at
 * run time. A count copied into an assertion is a count that has stopped
 * measuring.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
/** One-based, so `LINES[n]` is the line a citation spelling `Ln` names. */
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

const linesCarrying = (token: string): readonly number[] =>
  LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

const isTableRow = (line: string): boolean => line.trimStart().startsWith('|')
const isSeparator = (line: string): boolean => /^\|[\s|:-]+\|$/.test(line.trim())

/** Every data row of the table whose header sits on `header`, counted. */
const dataRowsUnder = (header: number): readonly number[] => {
  expect(isTableRow(L(header)), `L${header} is a table row`).toBe(true)
  expect(isSeparator(L(header + 1)), `L${header + 1} is the separator`).toBe(true)
  const rows: number[] = []
  for (let n = header + 2; isTableRow(L(n)); n += 1) rows.push(n)
  return rows
}

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the two tables, located by structure rather than transcribed ──────── */

const MODE_HEADER = (() => {
  const found = linesCarrying(
    '| Mode | Worker-visible label | Agent invocation | Deterministic safety | Escalation delivery | Classification |',
  )
  expect(found, 'the mode contract matrix header occurs exactly once').toHaveLength(1)
  return found[0]!
})()

const MODE_ROW_LINES = dataRowsUnder(MODE_HEADER)

const TRANSITION_HEADER = (() => {
  const found = linesCarrying('| From | To | Trigger | Who or what decides | Classification |')
  expect(found, 'the transition-condition table header occurs exactly once').toHaveLength(1)
  return found[0]!
})()

const TRANSITION_ROW_LINES = dataRowsUnder(TRANSITION_HEADER)

describe('the two tables, counted rather than spanned', () => {
  it('puts the mode header and separator where the brief says, and sixteen rows under them', () => {
    expect(MODE_HEADER).toBe(89_354)
    expect(MODE_ROW_LINES[0]).toBe(89_356)
    expect(MODE_ROW_LINES.at(-1)).toBe(89_371)
    expect(MODE_ROW_LINES).toHaveLength(16)
  })

  it('puts the transition header ON L89375 — the brief places it above that line', () => {
    // The dispatch brief reads "Sixteen transitions. At L89375-L89392 (header
    // and separator above)". L89375 IS the header and L89376 the separator,
    // so the transition DATA rows are L89377-L89392. The row COUNT the brief
    // gives is right; the span it gives for the rows is two lines too high.
    expect(TRANSITION_HEADER).toBe(89_375)
    expect(isSeparator(L(89_376))).toBe(true)
    expect(TRANSITION_ROW_LINES[0]).toBe(89_377)
    expect(TRANSITION_ROW_LINES.at(-1)).toBe(89_392)
    expect(TRANSITION_ROW_LINES).toHaveLength(16)
  })

  it('finds `AIMODE-07` and `AIMODE-10` where the brief corrects the re-plan', () => {
    expect(cells(L(89_362))[0]).toContain('`AIMODE-07`')
    expect(cells(L(89_365))[0]).toContain('`AIMODE-10`')
    expect(cells(L(89_368))[0]).toContain('`AIMODE-13`')
    expect(cells(L(89_369))[0]).toContain('`AIMODE-14`')
  })

  it('finds the `AIMODE-13`/`-14` definition paragraphs at their own, different lines', () => {
    expect(L(89_289)).toContain('**`AIMODE-13` Tenant artificial-intelligence suspension.**')
    expect(L(89_291)).toContain('**`AIMODE-14` Platform artificial-intelligence suspension.**')
  })
})

/* ── the vocabulary is the table, cell for cell ────────────────────────── */

describe('AC-42-301 — one sixteen-value vocabulary, drawn from the matrix', () => {
  it('registers exactly the identifiers the matrix carries, in the matrix order', () => {
    const fromSource = MODE_ROW_LINES.map((n) => cells(L(n))[0]!.match(/`(AIMODE-\d\d)`/)![1])
    expect(AI_MODE_IDS).toStrictEqual(fromSource)
    expect(AI_MODE_ROWS.map((r) => r.id)).toStrictEqual(fromSource)
  })

  it('transcribes all six columns of all sixteen rows verbatim', () => {
    MODE_ROW_LINES.forEach((n, index) => {
      const c = cells(L(n))
      const row = AI_MODE_ROWS[index]!
      expect(c[0]).toBe(`\`${row.id}\` ${row.name}`)
      expect(c[1]).toBe(row.workerLabel)
      expect(c[2]).toBe(row.agentInvocation)
      expect(c[3]).toBe(row.deterministicSafety)
      expect(c[4]).toBe(row.escalationDelivery)
      expect(c[5]).toBe(row.classification)
      expect(row.matrixLocator).toBe(`L${n}`)
    })
  })

  it('closes the two permission vocabularies on what the sixteen rows actually use', () => {
    const invocation = new Set(MODE_ROW_LINES.map((n) => cells(L(n))[2]!))
    const escalation = new Set(MODE_ROW_LINES.map((n) => cells(L(n))[4]!))
    expect([...AGENT_INVOCATION_VALUES].sort()).toStrictEqual([...invocation].sort())
    expect([...ESCALATION_DELIVERY_VALUES].sort()).toStrictEqual([...escalation].sort())
  })

  it('resolves every identifier through the one lookup', () => {
    for (const id of AI_MODE_IDS) expect(aiMode(id).id).toBe(id)
  })
})

describe('AC-42-302 — deterministic safety is `Allowed` on every one of the sixteen', () => {
  it('reads `Allowed` in the deterministic-safety cell of all sixteen source rows', () => {
    const column = MODE_ROW_LINES.map((n) => cells(L(n))[3]!)
    expect(column).toHaveLength(16)
    expect(new Set(column)).toStrictEqual(new Set(['Allowed']))
  })

  it('carries no ruling in this module that could vary a deterministic outcome', () => {
    // The machine's exported rulings name a mode and a reason. None of them
    // carries a deterministic-safety field, so there is nothing here for a
    // deterministic classifier to branch on. Asserted over the whole set
    // rather than over one sample.
    const rulings = AI_MODE_IDS.map((id) =>
      enterMode(id, {
        current: 'AIMODE-01',
        priorMode: null,
        outstanding: { queuedCaptures: 0, queuedAiRequests: 0, unrecomputedAggregates: 0 },
        connectionLostForMs: null,
        settlingPeriodMs: null,
      }),
    )
    expect(rulings).toHaveLength(16)
    for (const ruling of rulings) {
      // The exact key set, not "does not contain": a `not.toContain` passes on
      // an empty object, and a ruling that grew a deterministic field would
      // have to be caught by the shape rather than by one guessed name.
      expect(new Set(Object.keys(ruling))).toStrictEqual(
        ruling.entered
          ? new Set(['entered', 'mode', 'via'])
          : new Set(['entered', 'mode', 'refusal', 'decisionRef']),
      )
      expect(aiMode(ruling.mode).deterministicSafety).toBe('Allowed')
    }
  })
})

/* ── AC-42-303 ─────────────────────────────────────────────────────────── */

describe('AC-42-303 — a paused platform is not an unreachable one', () => {
  it('MEASURES that the worker-visible label is not an identity: three pairs share one', () => {
    const shared = AI_MODE_ROWS.filter(
      (row) => modesCarryingWorkerLabel(row.workerLabel).length > 1,
    ).map((row) => row.id)
    // `AIMODE-13`/`-14`, `AIMODE-03`/`-15`, `AIMODE-01`/`-16`. A surface that
    // keys on the label therefore cannot tell a pause from an outage, which
    // is precisely what this criterion forbids.
    expect(shared).toStrictEqual([
      'AIMODE-01',
      'AIMODE-03',
      'AIMODE-13',
      'AIMODE-14',
      'AIMODE-15',
      'AIMODE-16',
    ])
  })

  it('distinguishes both paused modes from both unreachable ones on label AND on invocation', () => {
    const paused = ['AIMODE-13', 'AIMODE-14'] as const
    const unreachable = ['AIMODE-03', 'AIMODE-05'] as const
    let compared = 0
    for (const p of paused) {
      for (const u of unreachable) {
        expect(aiMode(p).workerLabel).not.toBe(aiMode(u).workerLabel)
        expect(aiMode(p).agentInvocation).not.toBe(aiMode(u).agentInvocation)
        compared += 1
      }
    }
    // Never a vacuous pass: four ordered pairs, and the loop is asserted to
    // have run all four.
    expect(compared).toBe(4)
  })

  it('leaves `AIMODE-13` and `AIMODE-14` separable only by identity, which the source states', () => {
    // The two rows are identical in every one of the five contract columns.
    // Their difference is scope, and scope lives in the definition paragraphs
    // rather than in the matrix — so a surface must render the identifier or
    // the name, never the contract columns alone.
    const thirteen = aiMode('AIMODE-13')
    const fourteen = aiMode('AIMODE-14')
    expect(thirteen.workerLabel).toBe(fourteen.workerLabel)
    expect(thirteen.agentInvocation).toBe(fourteen.agentInvocation)
    expect(thirteen.escalationDelivery).toBe(fourteen.escalationDelivery)
    expect(thirteen.classification).toBe(fourteen.classification)
    expect(thirteen.name).not.toBe(fourteen.name)
    expect(L(89_291)).toContain('Identical semantics to `AIMODE-13` with the scope widened')
  })
})

/* ── the four labels the matrix and the prose spell differently ────────── */

describe('the prose chip text differs from the matrix cell on four modes', () => {
  const PROSE = [
    ['AIMODE-04', 89_271, 'On-device assistant — not live'],
    ['AIMODE-05', 89_273, 'Offline — approved instructions only'],
    ['AIMODE-10', 89_283, 'Reconnecting — your work is saved'],
    ['AIMODE-12', 89_287, 'Your question is being checked against the current state of this run.'],
  ] as const

  it('pins both spellings of each, so neither can be tidied away', () => {
    for (const [id, line, text] of PROSE) {
      expect(L(line), `L${line} carries the prose chip text for ${id}`).toContain(`"${text}"`)
      const row = aiMode(id)
      expect(row.workerLabelProse).toBe(text)
      expect(row.workerLabelProse).not.toBe(row.workerLabel)
      expect(row.proseLocator).toBe(`L${line}`)
    }
  })

  it('records no prose variant on the twelve rows where the source states none', () => {
    const withVariant = AI_MODE_ROWS.filter((r) => r.workerLabelProse !== null).map((r) => r.id)
    expect(withVariant).toStrictEqual(PROSE.map(([id]) => id))
  })
})

/* ── the transition table, modelled honestly ───────────────────────────── */

describe('the sixteen transitions keep the shape the source gives them', () => {
  it('transcribes every column of every row', () => {
    expect(AI_MODE_TRANSITIONS).toHaveLength(TRANSITION_ROW_LINES.length)
    TRANSITION_ROW_LINES.forEach((n, index) => {
      const c = cells(L(n))
      const row = AI_MODE_TRANSITIONS[index]!
      const fromCell =
        row.from.kind === 'any'
          ? 'Any'
          : row.from.modes.map((m) => `\`${m}\``).join(' or ')
      const toCell = row.to.kind === 'prior-mode' ? 'Prior mode' : `\`${row.to.mode}\``
      expect(c[0]).toBe(fromCell)
      expect(c[1]).toBe(toCell)
      expect(c[2]).toBe(row.trigger)
      expect(c[3]).toBe(row.decidedBy)
      expect(c[4]).toBe(row.classification)
      expect(row.locator).toBe(`L${n}`)
    })
  })

  it('keeps the multi-source and `Any` cells un-flattened', () => {
    const multi = AI_MODE_TRANSITIONS.filter(
      (t) => t.from.kind === 'modes' && t.from.modes.length > 1,
    )
    const any = AI_MODE_TRANSITIONS.filter((t) => t.from.kind === 'any')
    // Three rows name two source modes; three name `Any`. Counted off the
    // source rather than asserted from the brief.
    expect(multi).toHaveLength(
      TRANSITION_ROW_LINES.filter((n) => cells(L(n))[0]!.includes(' or ')).length,
    )
    expect(any).toHaveLength(TRANSITION_ROW_LINES.filter((n) => cells(L(n))[0] === 'Any').length)
    expect(multi.length).toBeGreaterThan(0)
    expect(any.length).toBeGreaterThan(0)
  })

  it('offers every `Any` row from every one of the sixteen modes', () => {
    const anyRows = AI_MODE_TRANSITIONS.filter((t) => t.from.kind === 'any')
    for (const id of AI_MODE_IDS) {
      const offered = transitionsFrom(id)
      for (const row of anyRows) expect(offered).toContain(row)
    }
  })

  it('offers a two-source row from BOTH of its sources and from neither third mode', () => {
    const flap = AI_MODE_TRANSITIONS.find((t) => t.trigger === 'Device connectivity flapping')!
    expect(transitionsFrom('AIMODE-01')).toContain(flap)
    expect(transitionsFrom('AIMODE-02')).toContain(flap)
    expect(transitionsFrom('AIMODE-03')).not.toContain(flap)
  })
})

/* ── AC-42-305 ─────────────────────────────────────────────────────────── */

const CLEAN = {
  current: 'AIMODE-05',
  priorMode: null,
  outstanding: { queuedCaptures: 0, queuedAiRequests: 0, unrecomputedAggregates: 0 },
  connectionLostForMs: null,
  settlingPeriodMs: null,
} as const

describe('AC-42-305 — `AIMODE-04` is refused by configuration, not by convention', () => {
  it('refuses while `DEC-ONDEVICE-001` sits in the open-decision canon', () => {
    expect(OPEN_DECISION_IDS).toContain('DEC-ONDEVICE-001')
    const ruling = enterMode('AIMODE-04', CLEAN)
    expect(ruling.entered).toBe(false)
    expect(ruling.entered === false && ruling.decisionRef).toBe('DEC-ONDEVICE-001')
  })

  it('is driven by the canon and not by a constant — a decided canon permits the mode', () => {
    // The register is a parameter, so the criterion is enforced by what the
    // canon holds rather than by a boolean this module chose. Remove the
    // identifier from the register and the refusal lifts; nothing else does.
    const decided = OPEN_DECISION_IDS.filter((id) => id !== 'DEC-ONDEVICE-001')
    expect(enterMode('AIMODE-04', CLEAN, decided).entered).toBe(true)
    expect(enterMode('AIMODE-04', CLEAN).entered).toBe(false)
  })

  it('refuses `AIMODE-04` and no other mode on this ground', () => {
    const refusedOnDecision = AI_MODE_IDS.filter((id) => {
      const ruling = enterMode(id, CLEAN)
      return ruling.entered === false && ruling.decisionRef === 'DEC-ONDEVICE-001'
    })
    expect(refusedOnDecision).toStrictEqual(['AIMODE-04'])
  })

  it('names the source line that states the mode is defined but never entered', () => {
    expect(L(89_261)).toContain('`AIMODE-04` is defined but never entered')
  })
})

/* ── AC-42-304 ─────────────────────────────────────────────────────────── */

describe('AC-42-304 — recovery-complete is a precondition, exercised one kind at a time', () => {
  const KINDS = ['queuedCaptures', 'queuedAiRequests', 'unrecomputedAggregates'] as const

  it('enters `AIMODE-16` when nothing is outstanding', () => {
    expect(enterMode('AIMODE-16', { ...CLEAN, current: 'AIMODE-12' }).entered).toBe(true)
  })

  it('refuses on EACH of the three kinds on its own', () => {
    let refused = 0
    for (const kind of KINDS) {
      const ruling = enterMode('AIMODE-16', {
        ...CLEAN,
        current: 'AIMODE-12',
        outstanding: { ...CLEAN.outstanding, [kind]: 1 },
      })
      expect(ruling.entered, `${kind} outstanding must refuse AIMODE-16`).toBe(false)
      expect(ruling.entered === false && ruling.refusal).toContain(kind)
      refused += 1
    }
    expect(refused).toBe(KINDS.length)
    expect(KINDS).toHaveLength(3)
  })

  it('refuses `AIMODE-16` and permits every other reachable mode with work outstanding', () => {
    const outstanding = { queuedCaptures: 0, queuedAiRequests: 2, unrecomputedAggregates: 0 }
    const refused = AI_MODE_IDS.filter(
      (id) => enterMode(id, { ...CLEAN, outstanding }).entered === false,
    )
    // `AIMODE-04` is refused on the other ground, always.
    expect(refused).toStrictEqual(['AIMODE-04', 'AIMODE-16'])
  })

  it('gates the transition row that targets `AIMODE-16`, not merely the direct call', () => {
    const row = AI_MODE_TRANSITIONS.find(
      (t) => t.to.kind === 'mode' && t.to.mode === 'AIMODE-16',
    )!
    const context = {
      ...CLEAN,
      current: 'AIMODE-12',
      outstanding: { queuedCaptures: 0, queuedAiRequests: 0, unrecomputedAggregates: 4 },
    } as const
    expect(applyTransition(row, context).entered).toBe(false)
    expect(applyTransition(row, { ...context, outstanding: CLEAN.outstanding }).entered).toBe(true)
  })
})

/* ── TEST-42-303 ───────────────────────────────────────────────────────── */

describe('TEST-42-303 — bounded liveness, and it never reads a network interface', () => {
  const live = { current: 'AIMODE-01', windowMs: 120_000 } as const

  it('advances to unavailable when no invocation has succeeded within the window', () => {
    const ruling = boundedLiveness('AIMODE-01', {
      lastSuccessfulInvocationAt: 1_000,
      now: 1_000 + live.windowMs,
      windowMs: live.windowMs,
    })
    expect(ruling.advanced).toBe(true)
    expect(ruling.advanced === true && ruling.mode).toBe('AIMODE-03')
  })

  it('never leaves a worker on "Live coaching available" while nothing can succeed', () => {
    // The interface is up throughout — the input type has no field that could
    // say otherwise, which is the point. Only the invocation record moves.
    const claimants = AI_MODE_IDS.filter(
      (id) => aiMode(id).workerLabel === 'Live coaching available',
    )
    expect(claimants).toStrictEqual(['AIMODE-01', 'AIMODE-16'])
    for (const id of claimants) {
      const ruling = boundedLiveness(id, {
        lastSuccessfulInvocationAt: null,
        now: 9_999_999,
        windowMs: 1,
      })
      expect(ruling.advanced, `${id} must not survive a dead window`).toBe(true)
      expect(ruling.advanced === true && aiMode(ruling.mode).workerLabel).not.toBe(
        'Live coaching available',
      )
    }
  })

  it('holds the mode while an invocation has succeeded inside the window', () => {
    const ruling = boundedLiveness('AIMODE-01', {
      lastSuccessfulInvocationAt: 1_000,
      now: 1_000 + live.windowMs - 1,
      windowMs: live.windowMs,
    })
    expect(ruling.advanced).toBe(false)
  })

  it('does not re-advance a mode that already claims nothing', () => {
    const settled = AI_MODE_IDS.filter(
      (id) =>
        boundedLiveness(id, { lastSuccessfulInvocationAt: null, now: 1, windowMs: 1 }).advanced ===
        false,
    )
    // Everything the source marks offline-with-queued-escalation, plus the
    // three online modes that already refuse invocation.
    expect(settled).toContain('AIMODE-03')
    expect(settled).toContain('AIMODE-05')
    expect(settled).toContain('AIMODE-07')
    expect(settled).not.toContain('AIMODE-01')
    expect(settled.length).toBeGreaterThan(0)
    expect(settled.length).toBeLessThan(AI_MODE_IDS.length)
  })

  it('takes its window as a parameter — this module seeds no timing value', () => {
    // The first version of this gate matched two field names against a
    // default, and a planted `windowMs: number = 120_000` walked straight
    // past it: a default can be spelled a dozen ways and named anything. So
    // the property asserted is the one that actually holds — the machine
    // contains NO numeric literal other than zero. The source fixes neither
    // the liveness window nor the settling period, and a number that is not
    // in the file cannot apply silently.
    const source = readFileSync(new URL('../../src/ai/modes/machine.ts', import.meta.url), 'utf8')
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ')
      .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    const numerals = code.match(/(?<![\w$.])\d[\d_]*(?:\.\d+)?/g) ?? []
    expect(numerals.length).toBeGreaterThan(0) // `!== 0` is in there; never a vacuous pass
    expect(new Set(numerals)).toStrictEqual(new Set(['0']))
  })
})

/* ── hysteresis ────────────────────────────────────────────────────────── */

describe('hysteresis — `AIMODE-08` to `AIMODE-05` only beyond the settling period', () => {
  const row = AI_MODE_TRANSITIONS.find(
    (t) => t.trigger === 'Connection lost beyond the settling period',
  )!

  it('is the only transition row carrying the settling-period guard', () => {
    const guarded = AI_MODE_TRANSITIONS.filter((t) => t.guard === 'settling-period')
    expect(guarded).toStrictEqual([row])
    expect(L(89_380)).toContain('Connection lost beyond the settling period')
  })

  it('refuses inside the settling period and permits beyond it', () => {
    const inside = applyTransition(row, {
      ...CLEAN,
      current: 'AIMODE-08',
      connectionLostForMs: 20_000,
      settlingPeriodMs: 30_000,
    })
    expect(inside.entered).toBe(false)
    expect(inside.entered === false && inside.refusal).toContain('settling period')

    const beyond = applyTransition(row, {
      ...CLEAN,
      current: 'AIMODE-08',
      connectionLostForMs: 30_000,
      settlingPeriodMs: 30_000,
    })
    expect(beyond.entered).toBe(true)
  })

  it('refuses when the caller states no settling period, rather than assuming one', () => {
    const ruling = applyTransition(row, {
      ...CLEAN,
      current: 'AIMODE-08',
      connectionLostForMs: 9_999_999,
      settlingPeriodMs: null,
    })
    expect(ruling.entered).toBe(false)
    expect(ruling.entered === false && ruling.refusal).toContain('no settling period')
  })

  it('does not apply the guard to the other fifteen rows', () => {
    const others = AI_MODE_TRANSITIONS.filter((t) => t !== row)
    expect(others).toHaveLength(15)
    let exercised = 0
    for (const other of others) {
      // The resume row has no mode target, and `AIMODE-16` is refused on its
      // own criterion — both are covered by their own cases above.
      if (other.to.kind !== 'mode') continue
      if (other.to.mode === 'AIMODE-16') continue
      const current = other.from.kind === 'any' ? 'AIMODE-01' : other.from.modes[0]!
      expect(
        applyTransition(other, {
          ...CLEAN,
          current,
          connectionLostForMs: null,
          settlingPeriodMs: null,
        }).entered,
        `${other.locator} must not be gated on a settling period`,
      ).toBe(true)
      exercised += 1
    }
    expect(exercised).toBe(13)
  })
})

describe('a transition is refused from a state its From cell does not name', () => {
  const flap = AI_MODE_TRANSITIONS.find((t) => t.trigger === 'Device connectivity flapping')!

  it('permits both named sources and refuses a third mode', () => {
    expect(applyTransition(flap, { ...CLEAN, current: 'AIMODE-01' }).entered).toBe(true)
    expect(applyTransition(flap, { ...CLEAN, current: 'AIMODE-02' }).entered).toBe(true)
    const wrong = applyTransition(flap, { ...CLEAN, current: 'AIMODE-03' })
    expect(wrong.entered).toBe(false)
    expect(wrong.entered === false && wrong.refusal).toContain('AIMODE-03')
    // The refused mode stays in force; a refusal never blanks the state.
    expect(wrong.mode).toBe('AIMODE-03')
  })

  it('never refuses an `Any` row, from any of the sixteen', () => {
    const anyRow = AI_MODE_TRANSITIONS.find(
      (t) => t.from.kind === 'any' && t.to.kind === 'mode' && t.to.mode === 'AIMODE-13',
    )!
    const refused = AI_MODE_IDS.filter(
      (id) => applyTransition(anyRow, { ...CLEAN, current: id }).entered === false,
    )
    expect(refused).toStrictEqual([])
    expect(AI_MODE_IDS).toHaveLength(16)
  })
})

/* ── the resume row ────────────────────────────────────────────────────── */

describe('the resume row returns to the prior mode, and refuses when none was recorded', () => {
  const row = AI_MODE_TRANSITIONS.find((t) => t.to.kind === 'prior-mode')!

  it('is the one row whose target is not a mode identifier', () => {
    expect(AI_MODE_TRANSITIONS.filter((t) => t.to.kind === 'prior-mode')).toHaveLength(1)
    expect(cells(L(Number(row.locator.slice(1))))[1]).toBe('Prior mode')
  })

  it('re-enters the recorded prior mode', () => {
    const ruling = applyTransition(row, { ...CLEAN, current: 'AIMODE-13', priorMode: 'AIMODE-02' })
    expect(ruling.entered).toBe(true)
    expect(ruling.mode).toBe('AIMODE-02')
  })

  it('refuses rather than guessing when no prior mode was recorded', () => {
    const ruling = applyTransition(row, { ...CLEAN, current: 'AIMODE-13', priorMode: null })
    expect(ruling.entered).toBe(false)
    expect(ruling.entered === false && ruling.refusal).toContain('no prior mode')
  })

  it('still applies the `AC-42-305` gate through the resume path', () => {
    const ruling = applyTransition(row, { ...CLEAN, current: 'AIMODE-13', priorMode: 'AIMODE-04' })
    expect(ruling.entered).toBe(false)
    expect(ruling.entered === false && ruling.decisionRef).toBe('DEC-ONDEVICE-001')
  })
})

/* ── DEC-AIDISCLOSE-001 ────────────────────────────────────────────────── */

describe('DEC-AIDISCLOSE-001 is named and left open by this module', () => {
  it('points at the canon record rather than restating either reading', () => {
    expect(AIMODE_WORKER_DISCLOSURE_DECISION).toBe('DEC-AIDISCLOSE-001')
    expect(OPEN_DECISION_IDS).toContain(AIMODE_WORKER_DISCLOSURE_DECISION)
  })

  it('exposes no worker-facing rendering choice for the paused modes', () => {
    // Both source readings are `Derived Clarification` and neither outranks
    // the other, so this module hands a surface the mode and nothing else.
    // What a Frontline surface draws for a pause is task 13's disclosure.
    //
    // Asserted as the EXACT field set of every row rather than as the absence
    // of one guessed field name: a `not.toContain` cannot see a rendering
    // decision that arrives under a name nobody predicted.
    const FIELDS = new Set([
      'id',
      'name',
      'workerLabel',
      'workerLabelProse',
      'proseLocator',
      'agentInvocation',
      'deterministicSafety',
      'escalationDelivery',
      'classification',
      'matrixLocator',
    ])
    for (const id of AI_MODE_IDS) expect(new Set(Object.keys(aiMode(id)))).toStrictEqual(FIELDS)
    expect(L(89_396)).toContain('`DEC-AIDISCLOSE-001`')
    expect(L(87_854)).toContain(
      'the Frontline Worker Application surface shows nothing at all about the pause',
    )
  })
})

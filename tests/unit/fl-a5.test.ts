import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FL_MATRIX_SHAPE, controlsOnActsHeldElsewhere, frontlineAffordance } from '@/frontline/matrix'
import { FL_ACTS_HELD_ELSEWHERE } from '@/frontline/cross-surface'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import {
  A5_CARD,
  A5_CLAIMS_NEVER_MADE,
  A5_STATES,
  NO_OFF_SWITCH,
  PROPAGATION_IS_NOT_A_DEVICE_TIMELINE,
  STATES_THIS_DEVICE_CANNOT_HOLD,
} from '@/frontline/modules/fl-a5/charter'
import {
  FL_A5_COLUMNS,
  FL_A5_COLUMN_HEADINGS,
  FL_A5_MATRIX,
  FL_A5_SHAPE,
  type FlA5Column,
} from '@/frontline/modules/fl-a5/matrix'
import {
  A5_ACCEPTANCE_CRITERIA,
  A5_DISCLOSURES,
  A5_FUNCTIONALITIES,
  A5_MAPPED_PATTERNS,
  A5_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  A5_SOURCE_FINDINGS,
  CONTAINMENT_LADDER,
  HOLD_SCOPE_RULES,
  SAFETY_LAYER_OFFLINE,
  containmentAfter,
  containmentDecision,
  escalationDelivery,
  holdScope,
} from '@/frontline/modules/fl-a5/service'

/**
 * `MOD-FL-A5` — On-Device Detection and Containment, checked against the
 * FROZEN SOURCE rather than against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from
 * is a hypothesis, and this build has recorded ten brief-supplied assertions
 * that could not fail and eleven wrong citations. So a transcription is
 * checked by reading the line it cites and looking for the words, and a
 * locator is checked by asking whether the identifier really occurs there.
 * Nothing below asserts a string against another string this task also wrote.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note on each one names the defect that was
 * actually planted, not one that would have been convenient.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/**
 * Both sides folded identically before comparison: markdown emphasis and
 * backticks stripped, curly quotes folded to ASCII, whitespace collapsed,
 * lowercased. Every one of those was a real mismatch first — the source
 * writes `MOD-FL-A5` in backticks and a data field cannot.
 */
function norm(s: string): string {
  return s
    .replace(/[`*_]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Every `L<number>` in a `sourceRef`, in order. */
function locatorsOf(sourceRef: string): readonly number[] {
  return [...sourceRef.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
}

/** The identifier a `sourceRef` anchors on, where it has one. */
function anchorOf(sourceRef: string): string | null {
  const m = sourceRef.match(/^([A-Z][A-Z0-9-]{3,})\s+·/)
  return m?.[1] ?? null
}

/**
 * Sentences long enough to be a checkable claim. Below 25 characters a
 * "sentence" is a label rather than source prose, and asserting one would
 * pass on coincidence.
 */
function checkableSentences(text: string): readonly string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25)
}

/**
 * EVERY STRING THIS MODULE CAN PUT ON A SCREEN, in one place, because two
 * gates below walk it and a gate that walks a narrower list than the module
 * renders is a gate that passes the defect it was written for. That is not
 * hypothetical here: an earlier version of the synced gate read one field of
 * `escalationDelivery` and missed the other.
 */
function renderedStrings(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  const push = (where: string, text: string) => out.push({ where, text })
  for (const s of A5_CARD) {
    push(`card ${s.field}`, s.text)
    if (s.elision !== null) push(`card ${s.field} elision`, s.elision)
  }
  for (const row of FL_A5_MATRIX) {
    push(`row ${row.id}`, `${row.control} ${row.why}`)
    for (const column of FL_A5_COLUMNS) push(`${row.id}.${column}`, row.cells[column].note)
    const met = row.metElsewhere
    if (met !== null) push(`${row.id} met elsewhere`, met.note)
  }
  for (const s of A5_STATES) {
    push(s.id, s.gloss ?? '')
  }
  push('propagation honesty', PROPAGATION_IS_NOT_A_DEVICE_TIMELINE.claim)
  push('no off switch', `${NO_OFF_SWITCH.text} ${NO_OFF_SWITCH.whyOutsideTheCell} ${NO_OFF_SWITCH.corroboration}`)
  for (const f of A5_FUNCTIONALITIES) {
    push(f.id, `${f.statement} ${f.rolesProhibited ?? ''} ${f.connectivity} ${f.patternsNote ?? ''}`)
  }
  for (const r of HOLD_SCOPE_RULES) push(r.scope, `${r.rule} ${r.why}`)
  for (const ac of A5_ACCEPTANCE_CRITERIA) push(ac.id, ac.text)
  for (const f of A5_SOURCE_FINDINGS) push('finding', `${f.what} ${f.evidence} ${f.notClosedBecause}`)
  for (const d of A5_DISCLOSURES) {
    push(d.decisionRef, `${d.question} ${d.adopted} ${d.whyHere} ${d.canonNote}`)
    for (const r of d.readings) push(`${d.decisionRef} reading`, r.text)
  }
  for (const c of A5_CLAIMS_NEVER_MADE) push('never-claimed', `${c.claim} ${c.instead}`)
  for (const online of [true, false]) {
    const e = escalationDelivery(online)
    push(`escalation ${online ? 'online' : 'offline'}`, `${e.line} ${e.clause}`)
  }
  for (const band of [1, 2, null]) {
    for (const binding of [
      { kind: 'lot', id: 'LOT-WB-2291' },
      { kind: 'unit', id: 'RB-0011' },
      { kind: 'absent-by-design', reason: 'unit mode is none' },
    ] as const) {
      const d = containmentDecision(
        { inSpecification: band === null, severityBand: band },
        binding,
      )
      push(`containment ${String(band)} ${binding.kind}`, d.line)
    }
  }
  push('safety layer', SAFETY_LAYER_OFFLINE.reason)
  return out
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-A5’s permission matrix', () => {
  // FAILS IF: a row is dropped or added. Planted: the ninth row deleted.
  // Rows went to 8, cells to 40, and the data span stayed nine lines long —
  // which is the point of holding the span apart from the count.
  it('is nine rows over nine data lines, five columns, forty-five cells', () => {
    expect(FL_A5_SHAPE.rows).toBe(9)
    expect(FL_A5_SHAPE.columns).toBe(5)
    expect(FL_A5_SHAPE.cells).toBe(45)
    expect(FL_A5_SHAPE.rows * FL_A5_SHAPE.columns).toBe(FL_A5_SHAPE.cells)
    expect(FL_A5_SHAPE.lastDataLine - FL_A5_SHAPE.firstDataLine + 1).toBe(FL_A5_SHAPE.rows)
    expect(FL_A5_SHAPE.separatorLine).toBe(FL_A5_SHAPE.headerLine + 1)
    expect(FL_A5_SHAPE.firstDataLine).toBe(FL_A5_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's reading of its own span disagrees with wave 0's
  // reading of all twelve. Two independent transcriptions of one table.
  // Planted: firstDataLine moved to 40913. Went red on three fields.
  it('agrees with wave 0’s independent reading of the same table', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A5')
    expect(waveZero).toBeDefined()
    expect(waveZero?.rows).toBe(FL_A5_SHAPE.rows)
    expect(waveZero?.columns).toBe(FL_A5_SHAPE.columns)
    expect(waveZero?.headerLine).toBe(FL_A5_SHAPE.headerLine)
    expect(waveZero?.separatorLine).toBe(FL_A5_SHAPE.separatorLine)
    expect(waveZero?.firstDataLine).toBe(FL_A5_SHAPE.firstDataLine)
    expect(waveZero?.lastDataLine).toBe(FL_A5_SHAPE.lastDataLine)
  })

  // FAILS IF: the header row is not where the shape says, or a column
  // heading is re-worded. Planted: 'Read-only Auditor' changed to 'Auditor'.
  it('reads its five column headings off the header line itself', () => {
    const header = srcLine(FL_A5_SHAPE.headerLine)
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual(FL_A5_COLUMNS.map((c) => FL_A5_COLUMN_HEADINGS[c]))
  })

  // FAILS IF: the separator line is not a separator, which is what an
  // off-by-one span looks like. Planted: separatorLine 40912.
  it('cites a real separator line and nine real data lines', () => {
    expect(srcLine(FL_A5_SHAPE.separatorLine).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = FL_A5_SHAPE.firstDataLine; n <= FL_A5_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n).startsWith('| '), `L${n} is a data row`).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE LINE IT CITES.
 * ==================================================================== */

describe('every row and every cell against its own source line', () => {
  // FAILS IF: a row cites the wrong line, or its Action text was
  // paraphrased. Planted: row 7's control re-worded to 'Skip the checklist'.
  it('finds each row’s action text in the line the row cites', () => {
    expect(FL_A5_MATRIX).toHaveLength(9)
    for (const row of FL_A5_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      expect(n, `${row.id} names a line`).toBeDefined()
      const cells = srcLine(n as number).split('|').map((c) => c.trim())
      expect(norm(cells[1] ?? ''), `${row.id} action column`).toBe(norm(row.control))
    }
  })

  // FAILS IF: a cell's words are not the cell's words. This is the check
  // that catches an invented note and a note quietly trimmed to its token.
  // Planted: row 5's Supervisor cell flattened to the bare PROHIBITED
  // constant, dropping "Supervisors request release with a note" — which is
  // the prohibition-carrying-an-act this row exists to disclose. Went red.
  it('finds every one of the forty-five cells in its row’s source line', () => {
    let counted = 0
    for (const row of FL_A5_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const cells = srcLine(n as number).split('|').map((c) => c.trim())
      FL_A5_COLUMNS.forEach((column, i) => {
        const fromSource = cells[i + 2] ?? ''
        const cell = row.cells[column]
        expect(cell, `${row.id}.${column} exists`).toBeDefined()
        expect(norm(fromSource), `${row.id}.${column}`).toBe(norm(cell.note))
        counted += 1
      })
    }
    expect(counted).toBe(45)
  })

  // FAILS IF: an outcome is mapped to a token the cell does not carry.
  // The token is the cell's own opening words, so the outcome is derivable
  // and this is a second reading of the same cell. Planted: row 8's Tenant
  // Admin outcome set to 'allowed'.
  it('maps every outcome to the token the cell actually opens with', () => {
    const TOKEN: Readonly<Record<string, string>> = {
      allowed: 'Allowed',
      allowedWithConditions: 'Allowed with conditions',
      readOnly: 'Read-only',
      unavailable: 'Unavailable',
      explicitlyProhibited: 'Explicitly prohibited',
      clientDecisionRequired: 'Client Decision Required',
      notApplicable: 'Not applicable',
    }
    for (const row of FL_A5_MATRIX) {
      for (const column of FL_A5_COLUMNS) {
        const cell = row.cells[column]
        const token = TOKEN[cell.outcome]
        expect(token, `${cell.outcome} is a known token`).toBeDefined()
        // WHOLE TOKEN, NOT A PREFIX, and the difference is not pedantic:
        // `Allowed` is a prefix of `Allowed with conditions`, so a prefix
        // test passes an `allowedWithConditions` cell retyped `allowed` —
        // which is exactly the widening this gate exists to catch, and it
        // did pass it until the plant showed it.
        const n = norm(cell.note)
        const t = norm(token as string)
        expect(n === t || n.startsWith(`${t} —`), `${row.id}.${column} opens with ${token}`).toBe(
          true,
        )
      }
    }
  })

  // FAILS IF: the token tally and the cell count disagree — the shape a
  // truncated transcription takes when the row count still looks right.
  // Planted: one 'Not applicable' cell retyped 'explicitlyProhibited'.
  it('sums its four tokens to the cell count', () => {
    const tally = new Map<string, number>()
    for (const row of FL_A5_MATRIX) {
      for (const column of FL_A5_COLUMNS) {
        const o = row.cells[column].outcome
        tally.set(o, (tally.get(o) ?? 0) + 1)
      }
    }
    expect(tally.get('explicitlyProhibited')).toBe(34)
    expect(tally.get('notApplicable')).toBe(6)
    expect(tally.get('allowed')).toBe(3)
    expect(tally.get('allowedWithConditions')).toBe(2)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(45)
    // The three tokens this matrix does not carry, stated rather than
    // assumed: no Client Decision Required cell means no open decision.
    expect(tally.get('clientDecisionRequired')).toBeUndefined()
    expect(tally.get('unavailable')).toBeUndefined()
    expect(tally.get('readOnly')).toBeUndefined()
    for (const row of FL_A5_MATRIX) {
      for (const column of FL_A5_COLUMNS) {
        expect(row.cells[column].openDecision, `${row.id}.${column}`).toBeNull()
      }
    }
  })

  // FAILS IF: a row's governing sentence is not at the line it cites, or the
  // identifier it anchors on is not there. No window: an identifier's line is
  // a fact stated exactly. Planted: FUNC-A5-02-2-1 · L40996 changed to
  // L40995. Went red on the anchor before it went red on the words.
  it('finds each row’s governing sentence, and its anchor, at the cited line', () => {
    for (const row of FL_A5_MATRIX) {
      const [n] = locatorsOf(row.whyRef)
      const line = srcLine(n as number)
      const anchor = anchorOf(row.whyRef)
      if (anchor !== null) {
        expect(line.includes(anchor), `${row.whyRef} anchor is at L${n}`).toBe(true)
      }
      expect(norm(line).includes(norm(row.why)), `${row.id} why at L${n}`).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS, AS THIS MATRIX ANSWERS IT.
 * ==================================================================== */

describe('what each cell draws', () => {
  // FAILS IF: this module draws a control for an act the source places on
  // another surface. Wave 0's own gate, run over this matrix. Planted: row 5
  // renamed "Cancel a Run" and reclassified `screen`. Went red naming the
  // row as an EXCL-FL-06 invariant exclusion classified `screen`.
  //
  // ITS CEILING, MEASURED RATHER THAN ASSUMED. Reclassifying row 5 `screen`
  // WITHOUT renaming it does NOT trip this gate: `controlsOnActsHeldElsewhere`
  // knows only the three EXCL-FL-06 act names, and "Release a held lot, unit,
  // or run" is not one of them, so a control on a `screen` row is passed. The
  // gate below is what catches that case, and it caught it when planted.
  it('draws no control on any row whose act is held on another surface', () => {
    expect(controlsOnActsHeldElsewhere(FL_A5_MATRIX, FL_A5_COLUMNS)).toEqual([])
  })

  // FAILS IF: the module grows a third control, or loses one of its two.
  // Trap 6: placement is not an act any column holds and release is row 5,
  // so rows 1 and 6 are the whole of what this module draws. Planted: row 3
  // Worker cell set to `allowed`. Went red with a third entry.
  it('draws exactly two controls, both the Worker’s', () => {
    const controls: string[] = []
    for (const row of FL_A5_MATRIX) {
      for (const column of FL_A5_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') {
          controls.push(`${row.id}.${column}`)
        }
      }
    }
    expect(controls).toEqual([
      'trigger-deterministic-evaluation.WORKER',
      'complete-containment-checklist.WORKER',
    ])
  })

  // FAILS IF: row 4's Quality Manager cell stops pointing at row 5, or
  // points somewhere else. "The hold is placed automatically and is
  // released, not cancelled" — release is a row of this matrix, so it is a
  // routed pointer and not a cross-surface statement. Planted: routedTo
  // emptied. The cell fell through to a bare refusal and this went red.
  it('routes the Quality Manager from cancellation to release, inside this matrix', () => {
    const row = FL_A5_MATRIX.find((r) => r.id === 'prevent-or-cancel-hold')
    expect(row).toBeDefined()
    if (row === undefined) throw new Error('MOD-FL-A5 has no prevent-or-cancel-hold row')
    const drawn = frontlineAffordance(row, 'QUALITY_MANAGER')
    expect(drawn.kind).toBe('routed')
    expect(drawn.kind === 'routed' ? drawn.toRowId : null).toBe('release-held-lot')
    // and no other column on that row is routed anywhere. The annotation is
    // load-bearing: a filtered literal tuple narrows the column union, and
    // `frontlineAffordance` infers its Column parameter from both arguments.
    const others: readonly FlA5Column[] = FL_A5_COLUMNS.filter((c) => c !== 'QUALITY_MANAGER')
    for (const column of others) {
      expect(frontlineAffordance(row, column).kind).toBe('refusal')
    }
  })

  // FAILS IF: a row that is met on another surface names nowhere, or a row
  // that is met here claims to be met elsewhere. Two rows of nine.
  // Planted: row 8's metElsewhere cast to null while its surface stayed
  // `another-surface`. `frontlineAffordance` threw — wave 0's own refusal
  // for a row that classifies itself away from this screen and names
  // nowhere to send a reader — and the gate went red.
  it('classifies exactly two rows as another surface, and both name where', () => {
    const elsewhere = FL_A5_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(elsewhere.map((r) => r.id)).toEqual([
      'release-held-lot',
      'configure-severity-action-bundles',
    ])
    for (const row of elsewhere) {
      expect(row.metElsewhere, `${row.id} names where`).not.toBeNull()
      for (const column of FL_A5_COLUMNS) {
        expect(frontlineAffordance(row, column).kind).toBe('cross-surface')
      }
    }
    expect(
      elsewhere.map((r) => (r.metElsewhere?.where === 'another-surface' ? r.metElsewhere.surface : null)),
    ).toEqual(['SURF-CC', 'SURF-DOH'])
  })

  // FAILS IF: this module re-spells the surface-level ruling instead of
  // reading it. The lot-release statement is declared once for the whole
  // surface; a second wording of it is the defect shape this build has
  // recorded most. Planted: row 5's note replaced with a hand-written
  // sentence saying the same thing. Went red.
  it('reads row 5’s cross-surface statement from the surface register, not a copy', () => {
    const registerEntry = FL_ACTS_HELD_ELSEWHERE.find((a) =>
      a.capability.startsWith('Releasing a held lot, unit, or run'),
    )
    expect(registerEntry).toBeDefined()
    const row = FL_A5_MATRIX.find((r) => r.id === 'release-held-lot')
    expect(row?.metElsewhere?.note).toBe(registerEntry?.whatHappensThere)
    expect(row?.metElsewhere?.where === 'another-surface' ? row.metElsewhere.surface : null).toBe(
      registerEntry?.owningSurface,
    )
  })

  // FAILS IF: `cells` stops being total over the five columns — the one
  // thing a blank transcription looks like. Planted: row 2's TENANT_ADMIN
  // key removed. Typecheck caught it first; this catches it at runtime for
  // a cast that got past the compiler.
  it('holds a filled cell at every one of the forty-five positions', () => {
    for (const row of FL_A5_MATRIX) {
      for (const column of FL_A5_COLUMNS) {
        const cell = row.cells[column] as { note?: string } | undefined
        expect(cell?.note, `${row.id}.${column}`).toBeTruthy()
      }
    }
  })
})

/* ==================================================================== *
 * TRAP 1 — THE SAFETY LAYER IS IDENTICAL OFFLINE.
 * ==================================================================== */

describe('the safety layer does not depend on connectivity', () => {
  // FAILS IF: a connectivity parameter is added to the containment
  // decision. The function's arity IS the ruling: there is nowhere to pass
  // a connection state, so it cannot be gated behind one. Planted: a third
  // `online: boolean` parameter. Went red on arity before any behaviour
  // changed. L40948 is what it protects.
  it('gives the containment decision no connectivity parameter at all', () => {
    // ARITY ALONE IS NOT THE CHECK, and the plant is why. A parameter with a
    // default does not count towards `Function.length`, so `online = true`
    // slid past an arity test — and a DEFAULTED connectivity parameter is
    // the exact shape this gate is meant to stop, because it is the one a
    // caller never has to notice. The function's own text is read instead.
    const src = containmentDecision.toString()
    const params = src.slice(src.indexOf('(') + 1, src.indexOf(')'))
    expect(params.split(',').filter((p) => p.trim().length > 0)).toHaveLength(2)
    expect(params).not.toMatch(/online|offline|connect|network|navigator|sync/i)
    expect(src).not.toMatch(/\b(online|offline|navigator|connectivity|isConnected)\b/i)
    expect(containmentDecision.length).toBe(2)
    expect(norm(srcLine(40948))).toContain(
      norm('A Severity 1 hold fires immediately, even offline'),
    )
    expect(SAFETY_LAYER_OFFLINE.kind).toBe('safety-layer')
    expect(SAFETY_LAYER_OFFLINE.degradedOffline).toBe(false)
  })

  // FAILS IF: a Severity 1 classification stops placing a hold, or places
  // it on the wrong thing. AC-A5-3's ladder, one rung at a time. Planted:
  // the `absent-by-design` case returning 'lot'. Went red.
  it('lands the hold on the Lot, otherwise the Unit, otherwise the Run', () => {
    expect(holdScope({ kind: 'lot', id: 'LOT-WB-2291' })).toBe('lot')
    expect(holdScope({ kind: 'unit', id: 'RB-0011' })).toBe('unit')
    expect(holdScope({ kind: 'absent-by-design', reason: 'unit mode is none' })).toBe('run')
    expect(norm(srcLine(41048))).toContain(
      norm(
        'The hold lands on the Lot where one exists, otherwise the Unit for serialized work, otherwise the Run.',
      ),
    )
    expect(HOLD_SCOPE_RULES.map((r) => r.scope)).toEqual(['lot', 'unit', 'run'])
    for (const rule of HOLD_SCOPE_RULES) {
      const [n] = locatorsOf(rule.sourceRef)
      const anchor = anchorOf(rule.sourceRef)
      expect(srcLine(n as number).includes(anchor as string)).toBe(true)
      expect(norm(srcLine(n as number))).toContain(norm(rule.rule))
    }
  })

  // FAILS IF: Severity 2 starts placing a hold, or an in-specification
  // value launches containment. Planted: the `severityBand !== 1` branch
  // deleted so every deviation held. Went red on the Severity 2 case.
  it('places a hold for Severity 1 only, and launches containment on any classification', () => {
    const lot = { kind: 'lot', id: 'LOT-WB-2291' } as const
    const sev1 = containmentDecision({ inSpecification: false, severityBand: 1 }, lot)
    expect(sev1.holdPlaced).toBe(true)
    expect(sev1.scope).toBe('lot')
    expect(sev1.containment).toBe('STATE-A5-LAUNCHED')

    const sev2 = containmentDecision({ inSpecification: false, severityBand: 2 }, lot)
    expect(sev2.holdPlaced).toBe(false)
    expect(sev2.scope).toBeNull()
    expect(sev2.containment).toBe('STATE-A5-LAUNCHED')

    const inSpec = containmentDecision({ inSpecification: true, severityBand: null }, lot)
    expect(inSpec.holdPlaced).toBe(false)
    expect(inSpec.containment).toBeNull()
  })

  // FAILS IF: the escalation line claims a notification that has not
  // happened. TEST-A5-7 (L41065) asks for "queued escalation, and no claim
  // of notification". Planted: the offline line changed to "Your supervisor
  // has been notified." Went red.
  it('defers only the escalation, and never claims it was delivered', () => {
    const offline = escalationDelivery(false)
    expect(offline.delivered).toBe(false)
    expect(offline.clause).toBe('Offline: delivery queues durably.')
    expect(offline.line).toBe(
      'Your supervisor and the quality manager will be notified when this tablet reconnects.',
    )
    expect(offline.line).not.toMatch(/\b(has been|have been|was) notified\b/i)
    expect(escalationDelivery(true).delivered).toBe(true)
    expect(norm(srcLine(40988))).toContain(norm('Online: delivery is immediate.'))
    expect(norm(srcLine(40988))).toContain(norm('Offline: delivery queues durably.'))
  })
})

/* ==================================================================== *
 * TRAP 2 — THE HOLD LIFECYCLE IS NOT A DEVICE TIMELINE.
 * ==================================================================== */

describe('the states this module names, and which of them this device can hold', () => {
  // FAILS IF: a state id is not at L40930, or a gloss is not the source's,
  // or a gloss is invented for one of the three the source leaves bare.
  // Planted twice: STATE-A5-INFORCE renamed STATE-A5-IN-FORCE, and
  // STATE-A5-LAUNCHED given a written-here gloss. Both went red.
  it('finds all seven state identifiers and their glosses at L40930', () => {
    const line = srcLine(40930)
    expect(A5_STATES).toHaveLength(7)
    for (const s of A5_STATES) {
      expect(line.includes(s.id), `${s.id} at L40930`).toBe(true)
      if (s.gloss !== null) {
        expect(norm(line).includes(norm(s.gloss)), `${s.id} gloss`).toBe(true)
      }
    }
    // The three containment states carry no gloss in the source, and that
    // absence is recorded rather than filled in.
    expect(A5_STATES.filter((s) => s.gloss === null).map((s) => s.id)).toEqual([
      'STATE-A5-LAUNCHED',
      'STATE-A5-INPROGRESS',
      'STATE-A5-COMPLETE',
    ])
  })

  // FAILS IF: the device claims to know a fleet state. Exactly one of the
  // seven is not this device's to know, and the source says which in the
  // state's own gloss. Planted: STATE-A5-PROPAGATING marked
  // `heldByThisDevice: true`. Went red on both assertions.
  it('marks propagating as the one state this device cannot know', () => {
    expect(STATES_THIS_DEVICE_CANNOT_HOLD.map((s) => s.id)).toEqual(['STATE-A5-PROPAGATING'])
    const propagating = A5_STATES.find((s) => s.id === 'STATE-A5-PROPAGATING')
    expect(propagating?.gloss).toBe('known to the server, not yet applied on every sibling device')
    // TEST-STATE-003 is the criterion that says the fleet rendering belongs
    // to the Command Center, and it is at the line the module cites.
    expect(srcLine(48065).includes('TEST-STATE-003')).toBe(true)
    expect(norm(srcLine(48065))).toContain(norm('never in force'))
  })
})

/* ==================================================================== *
 * TRAP 5 — THE SENTENCE THAT HAS NO COLUMN.
 * ==================================================================== */

describe('the strongest sentence in the matrix', () => {
  // FAILS IF: the no-off-switch sentence is not at L40920, or is not the
  // source's own words. It is written in the Read-only Auditor cell and it
  // is about platform console roles, which have no column here. Planted:
  // the sentence re-worded to "no role can disable it". Went red.
  it('carries the no-off-switch sentence verbatim from row 9’s Auditor cell', () => {
    expect(norm(srcLine(40920))).toContain(norm(NO_OFF_SWITCH.text))
    const row = FL_A5_MATRIX.find((r) => r.id === 'disable-pause-or-weaken')
    expect(norm(row?.cells.READONLY_AUDITOR.note ?? '')).toContain(norm(NO_OFF_SWITCH.text))
    // and none of the five column headings is a platform role, which is why
    // the sentence needs a home outside the cell.
    const headings = FL_A5_COLUMNS.map((c) => FL_A5_COLUMN_HEADINGS[c]).join(' ')
    expect(headings.toLowerCase()).not.toContain('platform')
    const [n] = locatorsOf(NO_OFF_SWITCH.corroborationRef)
    expect(srcLine(n as number).includes('FUNC-A5-04-1-2')).toBe(true)
    expect(norm(srcLine(n as number))).toContain(norm(NO_OFF_SWITCH.corroboration))
  })
})

/* ==================================================================== *
 * THE CARD.
 * ==================================================================== */

describe('the module card, transcribed', () => {
  // FAILS IF: a card field cites a line it is not on, or was paraphrased.
  // Nineteen fields, every checkable sentence of every one of them looked
  // up in its own line. Planted: the Purpose field's locator moved one line
  // forward, onto the blank line that follows it — the off-by-one class.
  // Went red. Planted second: "beyond the
  // reach of configuration" softened to "hard to configure" with the
  // locator left correct. Went red on the sentence rather than the line,
  // which is the half a locator check alone would miss.
  it('finds every card field’s sentences in the line it cites', () => {
    expect(A5_CARD).toHaveLength(19)
    let checked = 0
    for (const s of A5_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      expect(n, `${s.field} names a line`).toBeDefined()
      const line = norm(srcLine(n as number))
      const anchor = anchorOf(s.sourceRef)
      if (anchor !== null) {
        expect(srcLine(n as number).includes(anchor), `${s.field} anchor`).toBe(true)
      }
      const sentences = checkableSentences(s.text)
      expect(sentences.length, `${s.field} has a checkable sentence`).toBeGreaterThan(0)
      for (const sentence of sentences) {
        expect(line.includes(norm(sentence)), `${s.field}: ${sentence.slice(0, 48)}`).toBe(true)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(40)
  })

  // FAILS IF: a classification is asserted for a field whose card carries
  // none. Five of the nineteen carry no marker and the section's Source
  // status paragraph does not name them either. Planted: the Audit field
  // given `sourceClass: 'SoW Fact'`. Went red — L40971 has no marker.
  it('claims a source classification only where the card states one', () => {
    for (const s of A5_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const hasMarker = /\[(SoW Fact|Derived Clarification|Client Decision Required)/.test(
        srcLine(n as number),
      )
      expect(s.sourceClass !== null, `${s.field} marker at L${n}`).toBe(hasMarker)
    }
    expect(A5_CARD.filter((s) => s.sourceClass === null).map((s) => s.field)).toEqual([
      'User benefit',
      'Objects affected',
      'Dependencies',
      'Audit',
      'Fallback identifier',
    ])
  })

  // FAILS IF: a field's prose is cut without the cut being declared. Exactly
  // one of the nineteen is elided and it says what was taken out and where
  // it went. Planted: the Security field trimmed by two sentences with
  // `elision: null` left in place. The sentence check above went red, which
  // is the pair working: an undeclared cut is a failed transcription.
  it('declares its one elision and carries the other eighteen fields whole', () => {
    const elided = A5_CARD.filter((s) => s.elision !== null)
    expect(elided.map((s) => s.field)).toEqual(['Artificial-intelligence behaviour'])
    expect(elided[0]?.elision).toContain('DEC-GATE-001')
  })

  // FAILS IF: the two claims this module must never make stop being
  // rendered, or their criteria move. Planted: the offline claim's locator
  // moved to L39098. Went red on the anchor.
  it('names the two claims it never makes, each at a real criterion', () => {
    expect(A5_CLAIMS_NEVER_MADE).toHaveLength(2)
    for (const c of A5_CLAIMS_NEVER_MADE) {
      const [n] = locatorsOf(c.sourceRef)
      const anchor = anchorOf(c.sourceRef)
      expect(srcLine(n as number).includes(anchor as string), c.sourceRef).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE TWENTY-ONE FUNCTIONALITIES AND THE FALLBACK OBLIGATION.
 * ==================================================================== */

describe('the functionalities, and AC-FL-011-1', () => {
  // FAILS IF: the module's functionality list and the source's disagree.
  // Counted off the source between the Features heading and the Mermaid
  // block, not off the brief. Planted: FUNC-A5-03-1-3 deleted from the
  // list. Went red at 20 against 21.
  it('carries every FUNC-A5-* the source states, and no other', () => {
    const fromSource = new Set<string>()
    for (let n = 40979; n <= 41015; n += 1) {
      for (const m of srcLine(n).matchAll(/FUNC-A5-[0-9-]+/g)) fromSource.add(m[0])
    }
    expect(fromSource.size).toBe(21)
    expect(A5_FUNCTIONALITIES).toHaveLength(21)
    expect(new Set(A5_FUNCTIONALITIES.map((f) => f.id))).toEqual(fromSource)
  })

  // FAILS IF: a functionality's words are not at the line it cites.
  // Statement, roles-prohibited clause and connectivity clause are three
  // separate claims about the same line. Planted: FUNC-A5-02-1-1's
  // connectivity clause changed to "Online only". Went red.
  it('finds each functionality’s statement, clause and connectivity at its line', () => {
    for (const f of A5_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const raw = srcLine(n as number)
      expect(raw.includes(f.id), `${f.id} is at L${n}`).toBe(true)
      const line = norm(raw)
      expect(line.includes(norm(f.statement)), `${f.id} statement`).toBe(true)
      if (f.rolesProhibited !== null) {
        expect(line.includes(norm(f.rolesProhibited)), `${f.id} roles prohibited`).toBe(true)
      } else {
        expect(raw.includes('Roles prohibited:'), `${f.id} really has no clause`).toBe(false)
      }
      expect(line.includes(norm(f.connectivity)), `${f.id} connectivity`).toBe(true)
    }
  })

  // FAILS IF: a fallback pattern is assigned to a functionality that does
  // not name it, which is how a gap gets papered over. Planted:
  // FB-FL-SEV1-01 added to FUNC-A5-04-1-1. Went red — L41009 does not name
  // it, and the gap test below went red at the same time.
  it('assigns a pattern only where the functionality’s own line names it', () => {
    for (const f of A5_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const raw = srcLine(n as number)
      for (const p of f.patterns) {
        expect(raw.includes(p), `${f.id} names ${p}`).toBe(true)
      }
    }
  })

  // FAILS IF: the AC-FL-011-1 gap is closed by invention rather than
  // reported. One of the twenty-one names no pattern, and the source says
  // why in its own Fallback field. This asserts the FINDING, so a later
  // task that quietly assigns a pattern goes red here. Planted: the finding
  // "fixed" by giving FUNC-A5-04-1-1 FB-FL-SEV1-01. Went red.
  it('reports the one functionality that names no FB-FL-* pattern', () => {
    expect(functionalitiesNamingNoPattern(A5_FUNCTIONALITIES)).toEqual(['FUNC-A5-04-1-1'])
    const gap = A5_FUNCTIONALITIES.find((f) => f.id === 'FUNC-A5-04-1-1')
    expect(gap?.patternsNote).toBe(
      'Not applicable — a non-configurable invariant has no fallback; its violation is a defect.',
    )
    expect(norm(srcLine(41009))).toContain(norm(gap?.patternsNote ?? ''))
    // and the criterion it does not meet is real and at the line cited.
    expect(srcLine(40151).includes('AC-FL-011-1')).toBe(true)
    expect(norm(srcLine(40151))).toContain(
      norm('Every functionality in this chapter names at least one'),
    )
  })

  // FAILS IF: the three readings of this module's fallback set are silently
  // reconciled. The §22.9 map gives three, the card gives four, the
  // functionalities give seven, and all three are carried. Planted:
  // A5_PATTERNS_NAMED_BY_FUNCTIONALITIES hand-written as the map's three.
  // Went red — it is derived from the functionality list, not listed.
  it('keeps the three divergent readings of its fallback set apart', () => {
    expect(A5_MAPPED_PATTERNS.map((p) => p.id).sort()).toEqual([
      'FB-FL-AI-01',
      'FB-FL-CAP-01',
      'FB-FL-SEV1-01',
    ])
    expect([...A5_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual([
      'FB-FL-AI-01',
      'FB-FL-CAP-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
      'FB-FL-PKG-01',
      'FB-FL-SEV1-01',
      'FB-FL-UP-01',
    ])
    // the card's own Fallback identifier field names four, and FB-FL-PKG-01
    // is the one the map does not carry for this module.
    expect(srcLine(40975)).toContain('FB-FL-PKG-01')
    expect(srcLine(40132)).toContain('FB-FL-PKG-01')
    expect(srcLine(40132)).not.toContain('MOD-FL-A5')
    expect(A5_SOURCE_FINDINGS).toHaveLength(2)
  })
})

/* ==================================================================== *
 * THE CONTAINMENT CHECKLIST HAS NO WAY OUT.
 * ==================================================================== */

describe('the containment checklist', () => {
  // FAILS IF: an act appears that leaves the checklist, or reopens a
  // completed one. The union has two members and neither is a dismissal;
  // this walks every act from every state and asserts the ladder only ever
  // moves forward. Planted: `containmentAfter` made to return
  // STATE-A5-LAUNCHED from STATE-A5-COMPLETE. Went red on the monotonic
  // check before it went red on the absorbing-state check.
  it('never moves backwards and never exits, from any state under any act', () => {
    const acts = ['start-first-item', 'complete-last-item'] as const
    for (const [i, state] of CONTAINMENT_LADDER.entries()) {
      for (const act of acts) {
        const next = containmentAfter(state, act)
        expect(CONTAINMENT_LADDER.indexOf(next)).toBeGreaterThanOrEqual(i)
      }
    }
    expect(containmentAfter('STATE-A5-COMPLETE', 'start-first-item')).toBe('STATE-A5-COMPLETE')
    expect(containmentAfter('STATE-A5-COMPLETE', 'complete-last-item')).toBe('STATE-A5-COMPLETE')
    expect(containmentAfter('STATE-A5-LAUNCHED', 'complete-last-item')).toBe('STATE-A5-LAUNCHED')
  })

  // FAILS IF: AC-A5-5 stops being where the module says it is. Planted:
  // locator moved to L41051. Went red on the anchor.
  it('cites AC-A5-5 at the line AC-A5-5 is on', () => {
    expect(srcLine(41050).includes('AC-A5-5')).toBe(true)
    expect(norm(srcLine(41050))).toContain(norm('cannot be skipped or dismissed'))
  })
})

/* ==================================================================== *
 * THE ACCEPTANCE CRITERIA AND THE THREE DISCLOSURES.
 * ==================================================================== */

describe('the acceptance criteria', () => {
  // FAILS IF: an AC is transcribed from the wrong row. Eight criteria over
  // eight consecutive lines, each anchored on its own identifier. Planted:
  // AC-A5-4 given AC-A5-5's text — the shape a transcription takes when a
  // reader's eye drops a row. Went red.
  it('finds all eight at their own lines', () => {
    expect(A5_ACCEPTANCE_CRITERIA).toHaveLength(8)
    for (const ac of A5_ACCEPTANCE_CRITERIA) {
      const [n] = locatorsOf(ac.sourceRef)
      const raw = srcLine(n as number)
      expect(raw.includes(ac.id), `${ac.id} at L${n}`).toBe(true)
      expect(norm(raw).includes(norm(ac.text)), `${ac.id} text`).toBe(true)
    }
  })
})

describe('the three open decisions', () => {
  // FAILS IF: a disclosed reading is not at the locator beside it. This is
  // the disclosure's whole contract — every reading carries its own line.
  // Planted: DEC-NOSHIFT-001's second reading pointed one line earlier than
  // the line that carries it. Went red on the anchor.
  //
  // The line numbers of the two planted defects are deliberately NOT spelled
  // here. `tests/coverage/locator-fidelity.test.ts` lexes every L-number in
  // this tree as a citation and cannot tell a citation from an example of a
  // wrong one, so writing them would file two knowingly-false citations
  // against this file to describe a test.
  it('finds every reading at its own locator, with its identifier there', () => {
    expect(A5_DISCLOSURES).toHaveLength(3)
    for (const d of A5_DISCLOSURES) {
      expect(d.readings.length).toBeGreaterThanOrEqual(2)
      for (const r of d.readings) {
        const [n] = locatorsOf(r.locator)
        const raw = srcLine(n as number)
        const anchor = anchorOf(r.locator)
        if (anchor !== null) {
          expect(raw.includes(anchor), `${r.locator} anchor`).toBe(true)
        }
        expect(norm(raw).includes(norm(r.text)), `${d.decisionRef}: ${r.text.slice(0, 48)}`).toBe(
          true,
        )
      }
    }
  })

  // FAILS IF: a decision is filed under an identifier the canon already
  // holds, or the canon grows a record for one of these three and this
  // module goes on disclosing it locally. Two wordings of one decision is
  // exactly what the shared canon exists to prevent. It reads the union out
  // of the canon file rather than trusting a comment about it.
  //
  // Planted: DEC-CLOCKWIN-001 re-filed as 'DEC-CAP-001', which the canon
  // does hold. Went red. The canon file itself was NOT edited to plant the
  // other direction — it is another task's path and a concurrent agent's
  // tree — so that half is held by the same assertion read the other way.
  it('discloses locally only because the shared canon has no record for these', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const block = canon.match(/export type DecisionId =([\s\S]*?)\n\n/)
    expect(block).not.toBeNull()
    const members = [...(block?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(members.length).toBeGreaterThan(20)
    for (const d of A5_DISCLOSURES) {
      expect(members, `${d.decisionRef} is absent from the canon`).not.toContain(d.decisionRef)
      expect(d.canonNote).toContain('DecisionId')
    }
  })
})

/* ==================================================================== *
 * CATEGORICAL ABSENCES.
 * ==================================================================== */

describe('what nothing in this module may contain', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking
  // reaches this module's rendered text. AC-FL-000-5 (L39100),
  // TEST-FL-000-3 (L39108), AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683).
  // Planted twice, in two different shapes of field: "countdown" in the
  // escalation line, and "countdown" in a hold-scope rule's why-clause.
  // Both went red naming the field.
  it('carries no pace, timing, countdown or ranking word in any rendered string', () => {
    const FORBIDDEN = /\b(pace|timer|countdown|ranking|leaderboard|productivity)\b/i
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(90)
    for (const s of strings) {
      expect(FORBIDDEN.test(s.text), `${s.where}: ${s.text.slice(0, 60)}`).toBe(false)
    }
  })

  // FAILS IF: the word "synced" is written as a state anywhere in this
  // module. L39622 says there is no such state and no bare success.
  // Planted: "Synced" used as the escalation line. Went red.
  it('never writes synced as a state', () => {
    // THE SAME COLLECTION THE GATE ABOVE WALKS, and it is shared for a
    // reason found by planting: the first version of this gate read only
    // `escalationDelivery(...).line` and missed the same function's
    // `clause`. A gate whose reach is narrower than the thing it protects
    // is a gate that passes the defect it was written for.
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\bsynced\b/i)
    }
  })
})

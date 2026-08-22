import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CAPTURE_STATES,
  CAPTURE_STATE_LABEL,
  HELD_ON_DEVICE_STATES,
  captureStateLine,
} from '@/frontline/capture'
import { DEC_SYNC_001_ORDER } from '@/frontline/commands'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import { FL_MATRIX_SHAPE, controlsOnActsHeldElsewhere, frontlineAffordance } from '@/frontline/matrix'
import { A5_DISCLOSURES } from '@/frontline/modules/fl-a5/service'
import {
  A6_CARD,
  A6_CLAIMS_NEVER_MADE,
  A6_SLICE_BOUNDARY,
  A6_STATES,
  A6_WHERE_IT_SURFACES,
  STATES_THIS_SLICE_ONLY_STATES,
} from '@/frontline/modules/fl-a6/charter'
import {
  CLOCK_SKEW_SURFACE_CORROBORATION,
  FL_A6_COLUMNS,
  FL_A6_COLUMN_HEADINGS,
  FL_A6_MATRIX,
  FL_A6_SHAPE,
} from '@/frontline/modules/fl-a6/matrix'
import { CONNECTIVITY_MODES } from '@/scenario/controls'
import { OFFLINE_CLASSIFICATION } from '@/offline/capability'
import { offMode } from '@/offline/modes'
import { PROTOCOL_STEPS, type StepOutcome } from '@/offline/protocol'
import {
  A6_BOUNDED_SETTINGS,
  A6_CLASSIFICATION_ROWS,
  A6_CONVERGENCE_ROW,
  A6_DRIVEN_COUNT,
  A6_DRIVERS,
  A6_DRIVER_OF,
  A6_INTERRUPTED_OUTCOMES,
  A6_LINK_BASIS,
  A6_LINK_BY_CONNECTIVITY,
  A6_ROWS_OUTSIDE_THE_SEVEN,
  A6_SITUATIONS,
  A6_STATES_REACHED,
  A6_STATE_AXES,
  A6_STATE_LINES,
  A6_TRUST_EXPIRED_SITUATION,
  A6_UNDRIVEN,
  a6LinkBasisCell,
  a6Reconnect,
  a6StateReading,
  boundedSetting,
  boundedSettingRuling,
  type A6StateId,
} from '@/frontline/modules/fl-a6/offline'
import {
  A6_ACCEPTANCE_CRITERIA,
  A6_CARD_PATTERNS,
  A6_DENIAL_TESTS,
  A6_DISCLOSURES,
  A6_FUNCTIONALITIES,
  A6_MAPPED_PATTERNS,
  A6_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  A6_RECONNECT_ORDER,
  A6_SOURCE_FINDINGS,
  A6_STOP_CLASS_GAP,
  A6_SYNCED_WORD_RECORD,
  CACHED_READ_OFFLINE,
  RUNGS_NOT_ON_THE_SHEET,
  SB_FL_015_DENIAL,
  SB_FL_015_LAST_SYNCED,
  SB_FL_015_SHEET,
  SB_FL_015_TOTAL,
  manualSync,
  syncSheetLine,
} from '@/frontline/modules/fl-a6/service'

/**
 * `MOD-FL-A6` — the Offline and Sync Engine, checked against the FROZEN SOURCE
 * rather than against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from is
 * a hypothesis, and this build has recorded ten brief-supplied assertions that
 * could not fail and eleven wrong citations. So a transcription is checked by
 * reading the line it cites and looking for the words, and a locator is
 * checked by asking whether the identifier really occurs there. Nothing below
 * asserts a string against another string this task also wrote — with one
 * deliberate exception, the `DEC-CLOCKWIN-001` cross-check against `fl-a5`,
 * which exists precisely to compare two things this build wrote.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note on each one names the defect that was actually
 * planted, not one that would have been convenient.
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
 * lowercased. Every one of those is a real mismatch in this module's own
 * transcription — the source writes `MOD-FL-A6` in backticks, `**Pass one:**`
 * in asterisks, and every possessive with a curly apostrophe.
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
 * "sentence" is a label rather than source prose, and asserting one would pass
 * on coincidence.
 */
function checkableSentences(text: string): readonly string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25)
}

/**
 * EVERY STRING THIS MODULE CAN PUT ON A SCREEN, in one place, because three
 * gates below walk it and a gate that walks a narrower list than the module
 * renders is a gate that passes the defect it was written for. `where` is the
 * key those gates report and allow-list on, so it has to be unique per string.
 */
function renderedStrings(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  const push = (where: string, text: string) => out.push({ where, text })
  for (const s of A6_CARD) {
    push(`card ${s.field}`, s.text)
    if (s.elision !== null) push(`card ${s.field} elision`, s.elision)
  }
  for (const row of FL_A6_MATRIX) {
    push(`row ${row.id}`, `${row.control} ${row.why}`)
    for (const column of FL_A6_COLUMNS) push(`${row.id}.${column}`, row.cells[column].note)
    const met = row.metElsewhere
    if (met !== null) push(`${row.id} met elsewhere`, met.note)
  }
  for (const c of CLOCK_SKEW_SURFACE_CORROBORATION) {
    push(`skew corroboration ${c.sourceRef}`, `${c.reading} ${c.what}`)
  }
  for (const s of A6_STATES) push(`state ${s.id}`, s.gloss ?? '')
  push('slice boundary', `${A6_SLICE_BOUNDARY.builtHere} ${A6_SLICE_BOUNDARY.builtLater} ${A6_SLICE_BOUNDARY.whyStatedNow}`)
  for (const w of A6_WHERE_IT_SURFACES) push(`surfaces ${w.sourceRef}`, `${w.place} ${w.what}`)
  for (const f of A6_FUNCTIONALITIES) {
    push(f.id, `${f.statement} ${f.rolesProhibited ?? ''} ${f.connectivity} ${f.patternsNote ?? ''}`)
  }
  for (const ac of A6_ACCEPTANCE_CRITERIA) push(ac.id, ac.text)
  for (const t of A6_DENIAL_TESTS) push(t.id, t.text)
  for (const f of A6_SOURCE_FINDINGS) {
    push(`finding ${f.sourceRef}`, `${f.what} ${f.evidence} ${f.notClosedBecause}`)
  }
  for (const r of A6_SYNCED_WORD_RECORD) push(`word record ${r.sourceRef}`, `${r.text} ${r.aboutWhat}`)
  for (const d of A6_DISCLOSURES) {
    push(d.decisionRef, `${d.question} ${d.adopted} ${d.whyHere} ${d.canonNote}`)
    d.readings.forEach((r, i) => push(`${d.decisionRef} reading ${i}`, r.text))
  }
  for (const c of A6_CLAIMS_NEVER_MADE) push(`never-claimed ${c.sourceRef}`, `${c.claim} ${c.instead}`)
  for (const p of A6_MAPPED_PATTERNS) push(`pattern ${p.id}`, `${p.title} ${p.terminalSafeState}`)
  for (const phase of A6_RECONNECT_ORDER) push(`phase ${phase.phase}`, `${phase.what} ${phase.why}`)
  for (const g of A6_STOP_CLASS_GAP) push(`stop-class gap ${g.item}`, `${g.item} ${g.whyNoClass} ${g.whereTheActLives}`)
  for (const row of SB_FL_015_SHEET) push(`sheet ${row.state}`, syncSheetLine(row))
  push('sheet last synced', SB_FL_015_LAST_SYNCED)
  push('sheet denial', SB_FL_015_DENIAL)
  for (const online of [true, false]) {
    const m = manualSync(online)
    push(`manual sync ${online ? 'online' : 'offline'}`, `${m.line} ${m.clause}`)
  }
  push('cached read treatment', CACHED_READ_OFFLINE.reason)
  for (const s of CAPTURE_STATES) push(`ladder ${s}`, captureStateLine(s))
  // THE OFFLINE HALF. A sweep that walked a narrower list than the module
  // renders is a sweep that passes the defect it was written for, and this
  // file says so at the top; every string `OfflineHalf` draws is added here
  // rather than being exempt by being newer.
  for (const a of A6_STATE_AXES) push(`axis ${a.axis}`, `${a.axis} ${a.why}`)
  for (const id of Object.keys(A6_STATE_LINES) as readonly A6StateId[]) {
    push(`state line ${id}`, A6_STATE_LINES[id].line)
  }
  for (const b of A6_BOUNDED_SETTINGS) push(`bounded ${b.id}`, `${b.name} ${b.clause}`)
  for (const d of A6_DRIVERS) push(`driver ${d.id}`, `${d.what} ${d.from} ${d.evidence}`)
  for (const u of A6_UNDRIVEN) push(`undriven ${u.id}`, u.why)
  for (const n of A6_SITUATIONS) {
    push(`situation ${n.label}`, n.label)
    for (const m of a6StateReading(n.situation).modes) {
      push(`mode ${n.label} ${m.identifier}`, `${m.mode} ${m.frontlineBehaviour}`)
    }
  }
  push('reconnect line', a6Reconnect(A6_INTERRUPTED_OUTCOMES).line)
  const refused = boundedSettingRuling('offline-trust-window', 96)
  push('ceiling refusal', refused.accepted ? 'accepted' : refused.refusal)
  for (const r of A6_CLASSIFICATION_ROWS) push(`register ${r.fn}`, `${r.fn} ${r.reason}`)
  push(
    'reconciliation',
    Object.values(A6_CONVERGENCE_ROW.cells).join(' '),
  )
  return out
}

/**
 * The subset of the above that is, or could be read as, A LABEL FOR A CAPTURE.
 * Held apart from the whole because the no-synced rule's subject is a capture
 * (`AC-FL-006-3`, L39636) and a blanket word ban is the wrong gate here — the
 * source itself writes the word twice inside this module's own section.
 */
function captureLabelStrings(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const s of CAPTURE_STATES) out.push({ where: `ladder ${s}`, text: captureStateLine(s) })
  for (const r of SB_FL_015_SHEET) out.push({ where: `sheet ${r.state}`, text: syncSheetLine(r) })
  for (const online of [true, false]) {
    const m = manualSync(online)
    out.push({ where: `manual sync ${online} line`, text: m.line })
    out.push({ where: `manual sync ${online} clause`, text: m.clause })
  }
  for (const row of FL_A6_MATRIX) {
    for (const column of FL_A6_COLUMNS) {
      out.push({ where: `${row.id}.${column}`, text: row.cells[column].note })
    }
  }
  for (const s of A6_STATES) out.push({ where: `state ${s.id}`, text: s.gloss ?? '' })
  // The seven state lines are the offline half's own worker-facing sentences,
  // and they are the strings most able to grow a capture label — three of them
  // are about what did or did not reach the office.
  for (const id of Object.keys(A6_STATE_LINES) as readonly A6StateId[]) {
    out.push({ where: `state line ${id}`, text: A6_STATE_LINES[id].line })
  }
  out.push({ where: 'reconnect line', text: a6Reconnect(A6_INTERRUPTED_OUTCOMES).line })
  return out
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-A6’s permission matrix', () => {
  // FAILS IF: a row is dropped or added. Planted: the ninth row deleted. Rows
  // went to 8, cells to 40, and the data span stayed nine lines long — which
  // is the point of holding the span apart from the count.
  it('is nine rows over nine data lines, five columns, forty-five cells', () => {
    expect(FL_A6_SHAPE.rows).toBe(9)
    expect(FL_A6_SHAPE.columns).toBe(5)
    expect(FL_A6_SHAPE.cells).toBe(45)
    expect(FL_A6_SHAPE.rows * FL_A6_SHAPE.columns).toBe(FL_A6_SHAPE.cells)
    expect(FL_A6_SHAPE.lastDataLine - FL_A6_SHAPE.firstDataLine + 1).toBe(FL_A6_SHAPE.rows)
    expect(FL_A6_SHAPE.separatorLine).toBe(FL_A6_SHAPE.headerLine + 1)
    expect(FL_A6_SHAPE.firstDataLine).toBe(FL_A6_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's reading of its own span disagrees with wave 0's
  // reading of all twelve. Two independent transcriptions of one table.
  // Planted: firstDataLine moved to 41095. Went red on three fields.
  //
  // AND IT LOOKS ITSELF UP BY ITS OWN NAME, WHICH IT DID NOT AT FIRST. The
  // first version hardcoded 'MOD-FL-A6' in the lookup, so renaming
  // `FL_A6_SHAPE.module` changed nothing and the plant stayed green — a gate
  // that could not fail. The lookup now uses the field, and the field is
  // checked against the identifier the source states at L41080.
  it('agrees with wave 0’s independent reading of the same table', () => {
    expect(srcLine(41080)).toContain(`\`${FL_A6_SHAPE.module}\``)
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === FL_A6_SHAPE.module)
    expect(waveZero, `wave 0 knows ${FL_A6_SHAPE.module}`).toBeDefined()
    expect(waveZero?.rows).toBe(FL_A6_SHAPE.rows)
    expect(waveZero?.columns).toBe(FL_A6_SHAPE.columns)
    expect(waveZero?.headerLine).toBe(FL_A6_SHAPE.headerLine)
    expect(waveZero?.separatorLine).toBe(FL_A6_SHAPE.separatorLine)
    expect(waveZero?.firstDataLine).toBe(FL_A6_SHAPE.firstDataLine)
    expect(waveZero?.lastDataLine).toBe(FL_A6_SHAPE.lastDataLine)
  })

  // FAILS IF: the header row is not where the shape says, or a column heading
  // is re-worded. Planted: 'Read-only Auditor' changed to 'Auditor'.
  it('reads its five column headings off the header line itself', () => {
    const header = srcLine(FL_A6_SHAPE.headerLine)
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual(FL_A6_COLUMNS.map((c) => FL_A6_COLUMN_HEADINGS[c]))
  })

  // FAILS IF: the separator line is not a separator, which is what an
  // off-by-one span looks like. Planted: separatorLine 41094.
  it('cites a real separator line and nine real data lines', () => {
    expect(srcLine(FL_A6_SHAPE.separatorLine).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = FL_A6_SHAPE.firstDataLine; n <= FL_A6_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n).startsWith('| '), `L${n} is a data row`).toBe(true)
    }
  })

  // FAILS IF: this build transcribes the build plan's C1/C2 rigour grade as
  // though it were a source value. It is not: the module inventory's third
  // column is Band, not grade, and MOD-FL-A6's own row reads A. Planted: a
  // `grade: 'C1'` field added to FL_A6_SHAPE. Went red on the sweep.
  //
  // THE BRIEF'S OWN LOCATOR FOR THIS IS WRONG AND THIS GATE IS WHERE IT SHOWED.
  // Both briefs say the source's grade column is "at L39848". L39848 is
  // MOD-FL-A3's data row; the inventory's header is L39844 and it has no grade
  // column at all.
  it('carries no C1 or C2 grade, and reads the inventory column the source does have', () => {
    const header = srcLine(39844).split('|').map((c) => c.trim()).filter((c) => c.length > 0)
    expect(header).toEqual(['Identifier', 'Module', 'Band', 'One-line scope'])
    const row = srcLine(39851).split('|').map((c) => c.trim())
    expect(row[1]).toBe('`MOD-FL-A6`')
    expect(row[2]).toBe('Offline and Sync Engine')
    expect(row[3]).toBe('A')
    expect(srcLine(39848)).toContain('`MOD-FL-A3`')
    for (const s of renderedStrings()) {
      expect(/\b(C1|C2)\b/.test(s.text), `${s.where} carries a build-plan grade`).toBe(false)
    }
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE LINE IT CITES.
 * ==================================================================== */

describe('every row and every cell against its own source line', () => {
  // FAILS IF: a row cites the wrong line, or its Action text was paraphrased.
  // Planted: row 8's control re-worded to 'Force a version change'.
  it('finds each row’s action text in the line the row cites', () => {
    expect(FL_A6_MATRIX).toHaveLength(9)
    for (const row of FL_A6_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      expect(n, `${row.id} names a line`).toBeDefined()
      const cells = srcLine(n as number).split('|').map((c) => c.trim())
      expect(norm(cells[1] ?? ''), `${row.id} action column`).toBe(norm(row.control))
    }
  })

  // FAILS IF: a cell's words are not the cell's words. This is the check that
  // catches an invented note and a note quietly trimmed to its token. Planted:
  // row 1's Supervisor cell flattened to the bare NA_BARE constant, dropping
  // "equivalent state is in the Client Command Center" — the pointer that
  // makes it a Not applicable carrying an alternative rather than a refusal.
  // Went red.
  it('finds every one of the forty-five cells in its row’s source line', () => {
    let counted = 0
    for (const row of FL_A6_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const cells = srcLine(n as number).split('|').map((c) => c.trim())
      FL_A6_COLUMNS.forEach((column, i) => {
        const fromSource = cells[i + 2] ?? ''
        const cell = row.cells[column]
        expect(cell, `${row.id}.${column} exists`).toBeDefined()
        expect(norm(fromSource), `${row.id}.${column}`).toBe(norm(cell.note))
        counted += 1
      })
    }
    expect(counted).toBe(45)
  })

  // FAILS IF: an outcome is mapped to a token the cell does not carry. The
  // token is the cell's own opening words, so the outcome is derivable and
  // this is a second reading of the same cell. Planted: row 5's Supervisor
  // outcome set to 'allowed'.
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
    for (const row of FL_A6_MATRIX) {
      for (const column of FL_A6_COLUMNS) {
        const cell = row.cells[column]
        const token = TOKEN[cell.outcome]
        expect(token, `${cell.outcome} is a known token`).toBeDefined()
        // WHOLE TOKEN, NOT A PREFIX, and the difference is not pedantic here:
        // `Allowed` is a prefix of `Allowed with conditions`, and this matrix
        // carries two of the first and three of the second, so a prefix test
        // passes an `allowedWithConditions` cell retyped `allowed`. That is
        // exactly the widening this gate exists to catch — the Worker's manual
        // sync would lose its "convenience only, never a dependency" condition
        // and become a bare Allowed.
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
  // Planted: row 5's Supervisor cell retyped 'explicitlyProhibited', which is
  // what losing the surface's only Read-only cell looks like. Went red twice.
  it('sums its five tokens to the cell count', () => {
    const tally = new Map<string, number>()
    for (const row of FL_A6_MATRIX) {
      for (const column of FL_A6_COLUMNS) {
        const o = row.cells[column].outcome
        tally.set(o, (tally.get(o) ?? 0) + 1)
      }
    }
    expect(tally.get('explicitlyProhibited')).toBe(33)
    expect(tally.get('notApplicable')).toBe(6)
    expect(tally.get('allowedWithConditions')).toBe(3)
    expect(tally.get('allowed')).toBe(2)
    expect(tally.get('readOnly')).toBe(1)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(45)
    // The two tokens this matrix does not carry, stated rather than assumed:
    // no Client Decision Required cell means no open decision on any cell.
    expect(tally.get('clientDecisionRequired')).toBeUndefined()
    expect(tally.get('unavailable')).toBeUndefined()
    for (const row of FL_A6_MATRIX) {
      for (const column of FL_A6_COLUMNS) {
        expect(row.cells[column].openDecision, `${row.id}.${column}`).toBeNull()
      }
    }
  })

  // FAILS IF: a cell's own clause is dropped and the cell falls back to a bare
  // token — the quiet half of a truncated transcription, which the tally above
  // cannot see because the outcome does not change. Thirty-five of the
  // forty-five carry a token and nothing else; ten carry a clause. Planted:
  // row 7's Tenant Admin note trimmed to 'Allowed with conditions'. The tally
  // stayed correct and this went red at 36 against 35.
  it('keeps the ten cells whose words go past the token', () => {
    const TOKENS = [
      'Allowed with conditions',
      'Allowed',
      'Read-only',
      'Explicitly prohibited',
      'Not applicable',
    ]
    const withWords: string[] = []
    for (const row of FL_A6_MATRIX) {
      for (const column of FL_A6_COLUMNS) {
        const note = row.cells[column].note
        if (!TOKENS.includes(note)) withWords.push(`${row.id}.${column}`)
      }
    }
    expect(withWords).toEqual([
      'view-sync-state.SUPERVISOR',
      'view-sync-state.QUALITY_MANAGER',
      'trigger-manual-sync.WORKER',
      'trigger-manual-sync.SUPERVISOR',
      'trigger-manual-sync.QUALITY_MANAGER',
      'resolve-sync-conflict.WORKER',
      'resolve-sync-conflict.SUPERVISOR',
      'resolve-sync-conflict.QUALITY_MANAGER',
      'set-offline-trust-window.TENANT_ADMIN',
      'set-clock-skew-threshold.TENANT_ADMIN',
    ])
    expect(45 - withWords.length).toBe(35)
  })

  // FAILS IF: a row's governing sentence is not at the line it cites, or the
  // identifier it anchors on is not there. No window: an identifier's line is
  // a fact stated exactly. Planted: FUNC-A6-04-2-1 · L41181 changed to L41182.
  // Went red on the anchor before it went red on the words.
  it('finds each row’s governing sentence, and its anchor, at the cited line', () => {
    for (const row of FL_A6_MATRIX) {
      const [n] = locatorsOf(row.whyRef)
      const line = srcLine(n as number)
      const anchor = anchorOf(row.whyRef)
      if (anchor !== null) {
        expect(line.includes(anchor), `${row.whyRef} anchor is at L${n}`).toBe(true)
      }
      expect(norm(line).includes(norm(row.why)), `${row.id} why at L${n}`).toBe(true)
    }
    // and eight of the nine anchor on an identifier. The ninth is row 1, whose
    // governing sentence is the card's Roles field and carries no identifier
    // of its own; asserting a null anchor there is what stops a plausible one
    // being invented for it.
    expect(FL_A6_MATRIX.filter((r) => anchorOf(r.whyRef) === null).map((r) => r.id)).toEqual([
      'view-sync-state',
    ])
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS, AS THIS MATRIX ANSWERS IT.
 * ==================================================================== */

describe('what each cell draws', () => {
  // FAILS IF: this module draws a control for an act the source places on
  // another surface. Wave 0's own gate, run over this matrix. Planted: row 5
  // renamed "Cancel a Run" and reclassified `screen`. Went red naming the row
  // as an EXCL-FL-06 invariant exclusion classified `screen`.
  //
  // ITS CEILING, MEASURED RATHER THAN ASSUMED. Reclassifying row 5 `screen`
  // WITHOUT renaming it does NOT trip this gate: `controlsOnActsHeldElsewhere`
  // knows only the three EXCL-FL-06 act names, and "Resolve a sync conflict"
  // is not one of them, so a control on a `screen` row is passed. The two
  // gates below are what catch that case, and both caught it when planted.
  it('draws no control on any row whose act is held on another surface', () => {
    expect(controlsOnActsHeldElsewhere(FL_A6_MATRIX, FL_A6_COLUMNS)).toEqual([])
  })

  // FAILS IF: the module grows a third control, or loses one of its two. The
  // two are the whole of what this module draws and both are the Worker's.
  // Planted: row 5 reclassified `screen` without renaming it — the case the
  // gate above cannot see. The Quality Manager's Resolve and Resolve-All
  // appeared as a third control on a factory tablet and this went red.
  it('draws exactly two controls, both the Worker’s', () => {
    const controls: string[] = []
    for (const row of FL_A6_MATRIX) {
      for (const column of FL_A6_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') {
          controls.push(`${row.id}.${column}`)
        }
      }
    }
    expect(controls).toEqual(['view-sync-state.WORKER', 'trigger-manual-sync.WORKER'])
  })

  // FAILS IF: a row that is met on another surface names nowhere, or a row
  // that is met here claims to be met elsewhere, or a cross-surface row's
  // statement carries no locator of its own. Three rows of nine. Planted:
  // row 7 reclassified `screen`, which is the trap this module exists to fail
  // — its cell names no surface, so nothing in the cell's own words objects.
  // The Tenant Admin cell drew a control and this went red on the row list
  // before the control gate above saw it.
  it('classifies exactly three rows as another surface, and each names where and cites it', () => {
    const elsewhere = FL_A6_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(elsewhere.map((r) => r.id)).toEqual([
      'resolve-sync-conflict',
      'set-offline-trust-window',
      'set-clock-skew-threshold',
    ])
    for (const row of elsewhere) {
      expect(row.metElsewhere, `${row.id} names where`).not.toBeNull()
      expect(row.metElsewhereRef, `${row.id} cites where it read that`).not.toBeNull()
      for (const column of FL_A6_COLUMNS) {
        expect(frontlineAffordance(row, column).kind).toBe('cross-surface')
      }
    }
    expect(
      elsewhere.map((r) =>
        r.metElsewhere?.where === 'another-surface' ? r.metElsewhere.surface : null,
      ),
    ).toEqual(['SURF-CC', 'SURF-DOH', 'SURF-DOH'])
    // and the six rows that are met here say so, with nothing to point at.
    for (const row of FL_A6_MATRIX.filter((r) => r.surface === 'screen')) {
      expect(row.metElsewhere, `${row.id}`).toBeNull()
      expect(row.metElsewhereRef, `${row.id}`).toBeNull()
    }
  })

  // FAILS IF: row 7's surface is read off row 6 rather than off the source.
  // The two rows sit next to each other, both are Tenant Admin settings, both
  // are the Hub's — and row 7's cell says none of that. So the gate asserts
  // the statement came from a DIFFERENT line and is verbatim there. Planted:
  // row 7's metElsewhere note copied from row 6 and its ref set to L41099.
  // Went red on both assertions — the note is not at L41099 in those words,
  // and the ref matched row 6's own line.
  it('reads row 7’s surface from another chapter, never from its neighbour', () => {
    const row6 = FL_A6_MATRIX.find((r) => r.id === 'set-offline-trust-window')
    const row7 = FL_A6_MATRIX.find((r) => r.id === 'set-clock-skew-threshold')
    expect(row6?.metElsewhereRef).toBe('L41099')
    expect(row7?.metElsewhereRef).toBe('L38091')
    expect(row7?.metElsewhereRef).not.toBe(row6?.metElsewhereRef)
    expect(row7?.metElsewhere?.note).not.toBe(row6?.metElsewhere?.note)
    // The cell itself really is silent about any surface, which is the trap.
    const cellNote = row7?.cells.TENANT_ADMIN.note ?? ''
    expect(cellNote).not.toMatch(/Hub|Command Center|Studio|console/i)
    expect(cellNote).toContain('platform ceiling 60 minutes')
    // and the statement the row carries instead is verbatim where it says.
    expect(norm(srcLine(38091))).toContain(norm(row7?.metElsewhere?.note ?? 'x'))
    expect(srcLine(38091)).toContain('Change the clock-skew threshold')
    // Two further readings, in two further chapters, and neither is row 6.
    expect(CLOCK_SKEW_SURFACE_CORROBORATION).toHaveLength(2)
    for (const c of CLOCK_SKEW_SURFACE_CORROBORATION) {
      const [n] = locatorsOf(c.sourceRef)
      expect(n, `${c.sourceRef} names a line`).toBeDefined()
      expect(n).not.toBe(41099)
      expect(norm(srcLine(n as number)).includes(norm(c.reading)), c.sourceRef).toBe(true)
    }
  })

  // FAILS IF: row 1 is classified by its Supervisor cell rather than by its
  // act. That cell names the Client Command Center — "equivalent state is in
  // the Client Command Center" — and a rule that classified the ROW from it
  // would turn the Worker's own Allowed into a cross-surface statement and
  // take the sheet away from the one person the module exists for. Planted:
  // row 1 reclassified `another-surface` with SURF-CC. The Worker's control
  // vanished and this went red on the first assertion.
  it('classifies row 1 by its act, not by the surface one of its cells names', () => {
    const row = FL_A6_MATRIX.find((r) => r.id === 'view-sync-state')
    expect(row?.surface).toBe('screen')
    expect(frontlineAffordance(row!, 'WORKER').kind).toBe('control')
    expect(row?.cells.SUPERVISOR.note).toContain('Client Command Center')
    expect(row?.cells.SUPERVISOR.outcome).toBe('notApplicable')
    // Not applicable is not a refusal token wearing a different name: the act
    // does not arise for that role here, and the cell says where it does.
    const drawn = frontlineAffordance(row!, 'SUPERVISOR')
    expect(drawn.kind).toBe('refusal')
    expect(drawn.kind === 'refusal' ? drawn.note : '').toContain(
      'equivalent state is in the Client Command Center',
    )
  })

  // FAILS IF: `cells` stops being total over the five columns — the one thing
  // a blank transcription looks like. Planted: row 3's TENANT_ADMIN key
  // removed. Typecheck caught it first; this catches it at runtime for a cast
  // that got past the compiler.
  it('holds a filled cell at every one of the forty-five positions', () => {
    for (const row of FL_A6_MATRIX) {
      for (const column of FL_A6_COLUMNS) {
        const cell = row.cells[column] as { note?: string } | undefined
        expect(cell?.note, `${row.id}.${column}`).toBeTruthy()
      }
    }
  })

  // FAILS IF: a routed pointer appears. There is none in this matrix and the
  // absence is asserted rather than assumed: row 1's alternative is on another
  // SURFACE, not another row here, so a `routedTo` would send a reader to a
  // capability this matrix does not hold. Planted: routedTo added on row 1
  // pointing at row 2. Went red.
  it('routes nothing inside this matrix, because nothing here routes', () => {
    for (const row of FL_A6_MATRIX) {
      expect(Object.keys(row.routedTo), `${row.id}`).toEqual([])
    }
  })
})

/* ==================================================================== *
 * TRAP 5 — THERE IS NO SYNCED STATE, AND A WORD BAN IS THE WRONG GATE.
 * ==================================================================== */

describe('the capture ladder, and the word that is not on it', () => {
  // FAILS IF: any label this module prints for a capture is, or contains, the
  // word. This is the rule where it actually applies — AC-FL-006-3's subject
  // is a capture. Planted twice: `manualSync(true).line` changed to "Synced.",
  // and a sixth sheet row added with a hand-written label. Both went red
  // naming the field.
  it('prints no capture label carrying the word synced', () => {
    const labels = captureLabelStrings()
    expect(labels.length).toBeGreaterThan(60)
    for (const s of labels) {
      expect(/\bsynced\b/i.test(s.text), `${s.where}: ${s.text.slice(0, 60)}`).toBe(false)
    }
    expect(srcLine(39622)).toContain('there is no single state called')
    expect(srcLine(39636)).toContain('AC-FL-006-3')
  })

  // FAILS IF: a fourth occurrence of the word arrives anywhere this module
  // renders. A blanket ban would have been the wrong gate — the source writes
  // the word twice inside this module's own section, at L41235 and L41199 —
  // so the three that are accounted for are named and the list is asserted
  // whole. Planted: the offline manual-sync line changed to say "nothing has
  // been synced yet". The list grew a fourth entry and this went red naming
  // it.
  it('accounts for every string that carries the word at all', () => {
    const carriers = renderedStrings()
      .filter((s) => /\bsynced\b/i.test(s.text))
      .map((s) => s.where)
      .sort()
    expect(carriers).toEqual([
      'FUNC-A6-07-1-2',
      'never-claimed AC-FL-006-3 · L39636',
      'sheet last synced',
      'word record AC-FL-006-3 · L39636',
      'word record FUNC-A6-07-1-2 · L41199',
      'word record SB-FL-015 · L41235',
    ])
    // AND THE OFFLINE HALF ADDED NONE. Its first draft did: the eviction
    // driver's own sentence said "a complete-and-synced Run", which is the
    // source's condition described in this build's words rather than quoted at
    // its line. That is a fourth occurrence with no entry in the record, and
    // this gate is where it showed. It was reworded to name the condition
    // instead; the verbatim phrase stays where it belongs, on FUNC-A6-07-1-2
    // and in the word record.
    for (const d of A6_DRIVERS) {
      expect(/\bsynced\b/i.test(`${d.what} ${d.from} ${d.evidence}`), `driver ${d.id}`).toBe(false)
    }
  })

  // FAILS IF: one of the two source-verbatim occurrences is not the source's
  // words at the line it cites, or the third — this build's own denial — is
  // asserted to be the source's when it is not. Planted: the FUNC-A6-07-1-2
  // entry re-worded to "eviction after a synced run", with verbatimAtSource
  // left true. Went red.
  it('records the three occurrences, and only claims the source for two', () => {
    expect(A6_SYNCED_WORD_RECORD).toHaveLength(3)
    expect(A6_SYNCED_WORD_RECORD.filter((r) => r.verbatimAtSource)).toHaveLength(2)
    for (const r of A6_SYNCED_WORD_RECORD) {
      const [n] = locatorsOf(r.sourceRef)
      const raw = srcLine(n as number)
      const anchor = anchorOf(r.sourceRef)
      expect(raw.includes(anchor as string), `${r.sourceRef} anchor`).toBe(true)
      if (r.verbatimAtSource) {
        expect(norm(raw).includes(norm(r.text)), `${r.sourceRef} verbatim`).toBe(true)
      }
    }
  })

  // FAILS IF: a sheet line stops coming from the capture ladder, or the
  // platform-does-not-hold clause stops travelling with the four rungs that
  // need it. The counts and the short labels are the storyboard's; the
  // SENTENCE is captureStateLine's, and holding the two apart is what stops
  // the storyboard's five words becoming a sixth state vocabulary. Planted:
  // syncSheetLine rewritten to print the storyboard label alone. Went red on
  // the missing clause for all four device-held rungs.
  it('builds every sheet line from the thirteen-rung ladder, clause and all', () => {
    expect(SB_FL_015_SHEET).toHaveLength(5)
    for (const row of SB_FL_015_SHEET) {
      const line = syncSheetLine(row)
      expect(line).toContain(CAPTURE_STATE_LABEL[row.state])
      expect(line).toContain(`${row.storyboardLabel}: ${row.count}.`)
      const held = (HELD_ON_DEVICE_STATES as readonly string[]).includes(row.state)
      expect(
        line.includes('The platform does not hold this record yet.'),
        `${row.state} holds-clause`,
      ).toBe(held)
      // and the storyboard really writes this line, in these words.
      expect(srcLine(41235)).toContain(`${row.storyboardLabel}: ${row.count}.`)
    }
    expect(SB_FL_015_SHEET.filter((r) => (HELD_ON_DEVICE_STATES as readonly string[]).includes(r.state))).toHaveLength(4)
  })

  // FAILS IF: the sheet's arithmetic is quoted rather than derived, or the
  // eight rungs it does not report go unnamed. Planted: SB_FL_015_TOTAL
  // hand-written as 20 while a row's count was changed to 3. Went red — it is
  // reduced from the rows.
  it('derives its own totals, and names the eight rungs it does not report', () => {
    expect(SB_FL_015_TOTAL).toBe(SB_FL_015_SHEET.reduce((n, r) => n + r.count, 0))
    expect(SB_FL_015_TOTAL).toBe(20)
    expect(RUNGS_NOT_ON_THE_SHEET).toHaveLength(8)
    expect(RUNGS_NOT_ON_THE_SHEET.length + SB_FL_015_SHEET.length).toBe(CAPTURE_STATES.length)
    for (const s of RUNGS_NOT_ON_THE_SHEET) {
      expect(SB_FL_015_SHEET.some((r) => r.state === s), `${s} is off the sheet`).toBe(false)
    }
  })

  // FAILS IF: the storyboard's own three lines are not the source's. Planted:
  // the denial sentence softened to "no resolve button on this sheet". Went
  // red.
  it('carries the storyboard’s last-synced line and its denial verbatim', () => {
    expect(srcLine(41235)).toContain('SB-FL-015')
    expect(srcLine(41235)).toContain(SB_FL_015_LAST_SYNCED)
    expect(srcLine(41235)).toContain(SB_FL_015_DENIAL)
    // the last-synced line names no capture and no rung. It is about the
    // device's last contact, which is why the word on it is not a state.
    for (const s of CAPTURE_STATES) {
      expect(SB_FL_015_LAST_SYNCED.toLowerCase()).not.toContain(s.replace(/-/g, ' '))
    }
  })
})

/* ==================================================================== *
 * AC-A6-11 — NO CONFLICT, NO QUEUE EDITOR, NO SYNC OBLIGATION.
 * ==================================================================== */

describe('the manual sync convenience', () => {
  // FAILS IF: anything this module renders asks the worker to synchronise.
  // AC-A6-11 (L41255) and FUNC-A6-02-2-3's own prohibited clause — no
  // behaviour may require it. Planted: the online line changed to "Sync before
  // you carry on." Went red naming the field.
  it('never asks the worker for a synchronisation', () => {
    // SECOND PERSON ONLY, AND THE NARROWING WAS FOUND BY THE GATE RATHER THAN
    // BY REASONING. The first version matched "required to sync" and went red
    // on FUNC-A6-02-1-1's own prohibited clause — "no worker may be required
    // to sync" — which is the source FORBIDDING the obligation. A gate that
    // fails on the rule it enforces is a gate that gets deleted, so what is
    // swept for is an instruction ADDRESSED TO THE WORKER.
    const OBLIGATION = /\b(you must|you need to|you have to|please sync|sync required|before you can)\b/i
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(120)
    for (const s of strings) {
      expect(OBLIGATION.test(s.text), `${s.where}: ${s.text.slice(0, 70)}`).toBe(false)
    }
    expect(srcLine(41255)).toContain('AC-A6-11')
    expect(norm(srcLine(41255))).toContain(
      norm('The worker is never presented with a conflict, a queue editor, or a sync obligation.'),
    )
  })

  // FAILS IF: the outcome grows a field an obligation could live in. The
  // result has exactly four keys and none of them is a requirement; a caller
  // cannot read a sync obligation out of this function because there is
  // nowhere to read one from. Planted: a `required: boolean` field added.
  // Went red on the key list.
  it('returns an outcome with nowhere to put an obligation', () => {
    for (const online of [true, false]) {
      const out = manualSync(online)
      expect(Object.keys(out).sort()).toEqual(['attempted', 'clause', 'line', 'sourceRef'])
      expect(out.attempted).toBe(online)
    }
    expect(manualSync.length).toBe(1)
    expect(manualSync(true).clause).toBe('Online: attempts immediately.')
    expect(manualSync(false).clause).toBe('Offline: reports no connection honestly.')
    expect(norm(srcLine(41171))).toContain(norm('Online: attempts immediately.'))
    expect(norm(srcLine(41171))).toContain(norm('Offline: reports no connection honestly.'))
    expect(norm(srcLine(41171))).toContain(norm('Roles prohibited: no behaviour may require it.'))
  })

  // FAILS IF: the offline answer claims something went out, or the online one
  // claims something arrived. Neither is a completion. Planted: the offline
  // line changed to "Everything has been sent." Went red.
  it('reports the attempt and never a completion', () => {
    expect(manualSync(false).attempted).toBe(false)
    expect(manualSync(false).line).not.toMatch(/\b(sent|uploaded|complete|done|success)\b/i)
    expect(manualSync(true).line).not.toMatch(/\b(sent|uploaded|complete|done|success)\b/i)
  })
})

/* ==================================================================== *
 * THE CARD.
 * ==================================================================== */

describe('the module card, transcribed', () => {
  // FAILS IF: a card field cites a line it is not on, or was paraphrased.
  // Twenty-two fields. Twenty-one are carried whole and are checked as one
  // contiguous span of their own line; the twenty-second declares an elision
  // and is checked sentence by sentence, because a field with a hole in the
  // middle is not contiguous by construction.
  //
  // Planted: the Purpose field's locator moved one line forward, onto the
  // blank line that follows it — the off-by-one class. Went red. Planted
  // second: "no reliable connectivity" softened to "poor connectivity" with
  // the locator left correct. Went red on the words rather than the line,
  // which is the half a locator check alone would miss.
  it('finds every card field’s words in the line it cites', () => {
    expect(A6_CARD).toHaveLength(22)
    let whole = 0
    let bySentence = 0
    for (const s of A6_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      expect(n, `${s.field} names a line`).toBeDefined()
      const line = norm(srcLine(n as number))
      expect(line.length, `${s.field} cites a non-blank line`).toBeGreaterThan(0)
      const anchor = anchorOf(s.sourceRef)
      if (anchor !== null) {
        expect(srcLine(n as number).includes(anchor), `${s.field} anchor`).toBe(true)
      }
      if (s.elision === null) {
        expect(line.includes(norm(s.text)), `${s.field} carried whole`).toBe(true)
        whole += 1
      }
      for (const sentence of checkableSentences(s.text)) {
        expect(line.includes(norm(sentence)), `${s.field}: ${sentence.slice(0, 48)}`).toBe(true)
        bySentence += 1
      }
    }
    expect(whole).toBe(21)
    expect(bySentence).toBeGreaterThan(40)
  })

  // FAILS IF: a classification is asserted for a field whose card carries
  // none. Ten of the twenty-two carry no marker and the section's Source
  // status paragraph does not name them either. Planted: the Audit field given
  // `sourceClass: 'SoW Fact'`. Went red — L41150 has no marker.
  it('claims a source classification only where the card states one', () => {
    for (const s of A6_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const hasMarker = /\[(SoW Fact|Derived Clarification|Client Decision Required)/.test(
        srcLine(n as number),
      )
      expect(s.sourceClass !== null, `${s.field} marker at L${n}`).toBe(hasMarker)
    }
    expect(A6_CARD.filter((s) => s.sourceClass === null).map((s) => s.field)).toEqual([
      'User benefit',
      'Objects affected',
      'Artificial-intelligence behaviour',
      'No-artificial-intelligence behaviour',
      'Dependencies',
      'Interconnections',
      'Audit',
      'Fallback identifier',
      'Recovery and reconciliation',
      'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    ])
    // and the one field the card classifies as an adopted position is the one
    // carrying the decision. Its marker names the decision by identifier.
    const reconnect = A6_CARD.find((s) => s.field.startsWith('Reconnect behaviour'))
    expect(reconnect?.sourceClass).toBe('Derived Clarification — adopted working position')
    expect(srcLine(41131)).toContain('DEC-SYNC-001')
  })

  // FAILS IF: a field's prose is cut without the cut being declared. Exactly
  // one of the twenty-two is elided and it says what was taken out and where
  // it went. Planted: the Security field trimmed by two sentences with
  // `elision: null` left in place. The whole-field check above went red, which
  // is the pair working: an undeclared cut is a failed transcription.
  it('declares its one elision and carries the other twenty-one fields whole', () => {
    const elided = A6_CARD.filter((s) => s.elision !== null)
    expect(elided.map((s) => s.field)).toEqual([
      'Reconnect behaviour, and the adopted ordering',
    ])
    expect(elided[0]?.elision).toContain('DEC-SYNC-001')
    // and the lifted passage really is at that line, so the elision names a
    // real thing rather than excusing a paraphrase.
    expect(norm(srcLine(41131))).toContain(
      norm('The Statement of Work never fixes which happens first'),
    )
  })

  // FAILS IF: the three claims this module must never make stop being
  // rendered, or their criteria move. Planted: the no-synced claim's locator
  // moved to L39635. Went red on the anchor.
  it('names the three claims it never makes, each at a real criterion', () => {
    expect(A6_CLAIMS_NEVER_MADE).toHaveLength(3)
    for (const c of A6_CLAIMS_NEVER_MADE) {
      const [n] = locatorsOf(c.sourceRef)
      const anchor = anchorOf(c.sourceRef)
      expect(srcLine(n as number).includes(anchor as string), c.sourceRef).toBe(true)
    }
  })

  // FAILS IF: the offline behaviour stops being on the card, or the boundary
  // stops naming what is still undriven. The first slice shipped its other
  // half's words because a screen rendering only the connected path implies
  // the safety layer needs a network; this slice built that half, and the
  // boundary now has to name the two functionalities that are still not
  // driven rather than going quiet. Planted twice: the Offline behaviour
  // field's name changed so the lookup misses it (red on `expected undefined
  // to be defined`), and `DEC-STORE-001` softened out of builtLater to "a
  // decision the client still owes" — which is the shape a finished module
  // takes when it stops naming the decision it left open. Red on
  // FUNC-A6-07-1-4's key.
  it('states the offline behaviour on the card, and names what is still undriven', () => {
    const offline = A6_CARD.find((s) => s.field === 'Offline behaviour')
    expect(offline).toBeDefined()
    expect(offline?.text).toContain('A full Run executes offline from the pinned package.')
    expect(offline?.text).toContain('platform ceiling of 72 hours')
    expect(norm(srcLine(41129))).toContain(norm(offline?.text ?? 'x'))
    expect(A6_SLICE_BOUNDARY.builtHere).toContain('reconnect ladder')
    for (const u of A6_UNDRIVEN) {
      const key = u.id === 'FUNC-A6-07-1-4' ? 'DEC-STORE-001' : 'excluded capability'
      expect(A6_SLICE_BOUNDARY.builtLater, u.id).toContain(key)
    }
    expect(srcLine(39099)).toContain('AC-FL-000-4')
    expect(norm(srcLine(39099))).toContain(
      norm('The deterministic safety layer executes with the network interface disabled'),
    )
  })
})

/* ==================================================================== *
 * THE STATES, AND WHICH HALF OF THE MODULE THIS SLICE DRIVES.
 * ==================================================================== */

describe('the seven states this module names', () => {
  // FAILS IF: a state id is not at L41112, or a gloss is not the source's, or
  // a gloss is invented for one of the six the source leaves bare. Planted
  // twice: STATE-A6-TRUSTEXPIRED renamed STATE-A6-TRUST-EXPIRED, and
  // STATE-A6-OFFLINE given a written-here gloss. Both went red.
  it('finds all seven identifiers and the one gloss at L41112', () => {
    const line = srcLine(41112)
    expect(A6_STATES).toHaveLength(7)
    for (const s of A6_STATES) {
      expect(line.includes(s.id), `${s.id} at L41112`).toBe(true)
      if (s.gloss !== null) {
        expect(norm(line).includes(norm(s.gloss)), `${s.id} gloss`).toBe(true)
      }
    }
    expect(A6_STATES.filter((s) => s.gloss !== null).map((s) => s.id)).toEqual([
      'STATE-A6-TRUSTVALID',
    ])
    // the source really lists seven and no eighth on that line.
    expect([...new Set(line.match(/STATE-A6-[A-Z]+/g) ?? [])]).toHaveLength(7)
  })

  // FAILS IF: a state claims to be driven and nothing reaches it, or something
  // reaches a state that claims not to be driven. `drivenHere` is a
  // declaration on the charter and `A6_STATES_REACHED` is what the resolver
  // ACTUALLY produced over the three named situations, so this compares a
  // claim against a run rather than against a second list.
  //
  // Planted twice, one per direction, because a one-directional check here is
  // the shape that passes the defect it was written for. First:
  // `STATE-A6-SKEWFLAGGED` marked `drivenHere: false` while the third
  // situation still reaches it — went red on the equality and on the
  // stated-only length. Second: the third situation's `skew` set to `null`, so
  // the flag is claimed and unreachable — went red on the equality, naming
  // STATE-A6-SKEWFLAGGED as present in the declaration and absent from the run.
  it('drives all seven, and proves it by reaching each one through the resolver', () => {
    expect(A6_STATES.filter((s) => s.drivenHere).map((s) => s.id)).toEqual(A6_STATES_REACHED)
    expect(A6_STATES_REACHED).toHaveLength(7)
    expect(STATES_THIS_SLICE_ONLY_STATES).toHaveLength(0)
  })
})

/* ==================================================================== *
 * THE TWENTY-EIGHT FUNCTIONALITIES AND AC-FL-011-1.
 * ==================================================================== */

describe('the functionalities, and AC-FL-011-1', () => {
  // FAILS IF: the module's functionality list and the source's disagree.
  // Counted off the source between the Features heading and the Mermaid block,
  // not off the brief. Planted: FUNC-A6-06-1-3 deleted from the list. Went red
  // at 27 against 28.
  it('carries every FUNC-A6-* the source states, and no other', () => {
    const fromSource = new Set<string>()
    for (let n = 41158; n <= 41209; n += 1) {
      for (const m of srcLine(n).matchAll(/FUNC-A6-[0-9-]+/g)) fromSource.add(m[0])
    }
    expect(fromSource.size).toBe(28)
    expect(A6_FUNCTIONALITIES).toHaveLength(28)
    expect(new Set(A6_FUNCTIONALITIES.map((f) => f.id))).toEqual(fromSource)
  })

  // FAILS IF: a functionality's words are not at the line it cites. Statement,
  // roles-prohibited clause and connectivity clause are three separate claims
  // about the same line. Planted: FUNC-A6-03-1-1's connectivity clause changed
  // to "Online and offline: identical." Went red.
  it('finds each functionality’s statement, clause and connectivity at its line', () => {
    for (const f of A6_FUNCTIONALITIES) {
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
    // one of the twenty-eight has no prohibited clause, and it is the one
    // whose whole body is Client Decision Required.
    expect(A6_FUNCTIONALITIES.filter((f) => f.rolesProhibited === null).map((f) => f.id)).toEqual([
      'FUNC-A6-07-1-4',
    ])
  })

  // FAILS IF: a fallback pattern is assigned to a functionality that does not
  // name it, which is how a gap gets papered over. Planted: FB-FL-CORE-01
  // added to FUNC-A6-08-1-2. Went red — L41205 does not name it, and the gap
  // test below went red at the same time.
  it('assigns a pattern only where the functionality’s own line names it', () => {
    for (const f of A6_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const raw = srcLine(n as number)
      for (const p of f.patterns) {
        expect(raw.includes(p), `${f.id} names ${p}`).toBe(true)
      }
      if (f.patternsNote !== null) {
        expect(norm(raw).includes(norm(f.patternsNote)), `${f.id} note`).toBe(true)
      }
    }
  })

  // FAILS IF: an AC-FL-011-1 gap is closed by invention rather than reported.
  // Two of the twenty-eight name no pattern, and the source says why in each
  // one's own Fallback field. This asserts the FINDING, so a later task that
  // quietly assigns a pattern goes red here. Planted: the finding "fixed" by
  // giving FUNC-A6-08-1-4 FB-FL-CMD-01. Went red at one against two.
  it('reports the two functionalities that name no FB-FL-* pattern', () => {
    expect(functionalitiesNamingNoPattern(A6_FUNCTIONALITIES)).toEqual([
      'FUNC-A6-08-1-2',
      'FUNC-A6-08-1-4',
    ])
    const excluded = A6_FUNCTIONALITIES.find((f) => f.id === 'FUNC-A6-08-1-2')
    expect(excluded?.patternsNote).toBe(
      'Not applicable — an excluded capability has no failure mode.',
    )
    const sameReason = A6_FUNCTIONALITIES.find((f) => f.id === 'FUNC-A6-08-1-4')
    expect(sameReason?.patternsNote).toBe('Not applicable — same reason.')
    // and the criterion neither meets is real and at the line cited.
    expect(srcLine(40151)).toContain('AC-FL-011-1')
    expect(norm(srcLine(40151))).toContain(
      norm('Every functionality in this chapter names at least one'),
    )
  })

  // FAILS IF: the three readings of this module's fallback set are silently
  // reconciled. The §22.9 map gives eight, the card gives seven, the
  // functionalities give ten, and all three are carried. Planted:
  // A6_CARD_PATTERNS given FB-FL-GATE-01 so it matched the map. Went red — the
  // card's own line does not name it.
  it('keeps the three divergent readings of its fallback set apart', () => {
    expect(A6_MAPPED_PATTERNS.map((p) => p.id).sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-CORE-01',
      'FB-FL-GATE-01',
      'FB-FL-PKG-01',
      'FB-FL-STORE-01',
      'FB-FL-TIME-01',
      'FB-FL-UP-01',
    ])
    expect([...A6_CARD_PATTERNS].sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-CORE-01',
      'FB-FL-PKG-01',
      'FB-FL-STORE-01',
      'FB-FL-TIME-01',
      'FB-FL-UP-01',
    ])
    expect([...A6_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CAP-01',
      'FB-FL-CMD-01',
      'FB-FL-CORE-01',
      'FB-FL-GATE-01',
      'FB-FL-PKG-01',
      'FB-FL-SEC-01',
      'FB-FL-STORE-01',
      'FB-FL-TIME-01',
      'FB-FL-UP-01',
    ])
    // every card pattern is really on the card's line, and the one the map
    // carries that the card does not is really absent from it.
    for (const p of A6_CARD_PATTERNS) expect(srcLine(41154)).toContain(p)
    expect(srcLine(41154)).not.toContain('FB-FL-GATE-01')
    expect(srcLine(40137)).toContain('FB-FL-GATE-01')
    expect(srcLine(40137)).toContain('MOD-FL-A6')
    // and the two the functionalities add are on map rows that do not list
    // this module, which is what makes them a third reading rather than a
    // transcription error.
    expect(srcLine(40133)).toContain('FB-FL-CAP-01')
    expect(srcLine(40133)).not.toContain('MOD-FL-A6')
    expect(srcLine(40141)).toContain('FB-FL-SEC-01')
    expect(srcLine(40141)).not.toContain('MOD-FL-A6')
  })

  // FAILS IF: a functionality claims to be exercised with no mechanism bound
  // to it, or a mechanism drives one that still claims not to be exercised.
  // The flag lives in `service.ts` and the binding is derived in `offline.ts`
  // from the drivers' own lists, so this is two independent spellings compared
  // rather than a constant compared with itself.
  //
  // Planted twice. First: FUNC-A6-07-1-4, the storage-full functionality whose
  // whole body is `Client Decision Required`, marked exercised — red,
  // "FUNC-A6-07-1-4 flagged true". Second: FUNC-A6-05-3-2 removed from the
  // `b9-gate` driver's `drives` list while its flag stayed true — red,
  // "FUNC-A6-05-3-2 flagged true", which is the direction a flag-only check
  // cannot see.
  it('exercises twenty-six of the twenty-eight, each bound to a mechanism that ran', () => {
    for (const f of A6_FUNCTIONALITIES) {
      expect(A6_DRIVER_OF[f.id] !== null, `${f.id} flagged ${String(f.exercisedInThisSlice)}`).toBe(
        f.exercisedInThisSlice,
      )
    }
    expect(A6_FUNCTIONALITIES.filter((f) => f.exercisedInThisSlice)).toHaveLength(26)
    expect(A6_DRIVEN_COUNT).toBe(26)
    expect(A6_UNDRIVEN.map((u) => u.id)).toEqual(['FUNC-A6-07-1-4', 'FUNC-A6-08-1-2'])
    expect(
      A6_FUNCTIONALITIES.filter((f) => !f.exercisedInThisSlice).map((f) => f.id),
    ).toEqual(A6_UNDRIVEN.map((u) => u.id))
  })
})

/* ==================================================================== *
 * THE ACCEPTANCE CRITERIA, THE DENIAL TESTS, AND THE ORDERING.
 * ==================================================================== */

describe('the acceptance criteria and the denial tests', () => {
  // FAILS IF: an AC is transcribed from the wrong row. Twelve criteria over
  // twelve consecutive lines, each anchored on its own identifier. Planted:
  // AC-A6-7 given AC-A6-8's text — the shape a transcription takes when a
  // reader's eye drops a row. Went red.
  it('finds all twelve at their own lines', () => {
    expect(A6_ACCEPTANCE_CRITERIA).toHaveLength(12)
    for (const ac of A6_ACCEPTANCE_CRITERIA) {
      const [n] = locatorsOf(ac.sourceRef)
      const raw = srcLine(n as number)
      expect(raw.includes(ac.id), `${ac.id} at L${n}`).toBe(true)
      expect(norm(raw).includes(norm(ac.text)), `${ac.id} text`).toBe(true)
    }
    // twelve consecutive lines, so a row cannot be silently skipped.
    expect(A6_ACCEPTANCE_CRITERIA.map((a) => locatorsOf(a.sourceRef)[0])).toEqual(
      Array.from({ length: 12 }, (_, i) => 41245 + i),
    )
  })

  // FAILS IF: a denial test is cited at a line it is not on, or answers a row
  // this matrix does not hold. Planted: TEST-A6-5's answeredBy changed to a
  // row id that does not exist. Went red.
  it('cites three denial tests, each at its line and each against a real row', () => {
    const ids = FL_A6_MATRIX.map((r) => r.id)
    for (const t of A6_DENIAL_TESTS) {
      const [n] = locatorsOf(t.sourceRef)
      const raw = srcLine(n as number)
      expect(raw.includes(t.id), `${t.id} at L${n}`).toBe(true)
      expect(norm(raw).includes(norm(t.text)), `${t.id} text`).toBe(true)
      expect(raw).toContain('Denial')
      expect(ids, `${t.id} answers a real row`).toContain(t.answeredBy)
    }
  })

  // FAILS IF: this module re-decides the reconnection order instead of reading
  // it. Three phases, in wave 0's own array, and the source's own criterion
  // says which order. Planted: A6_RECONNECT_ORDER replaced with a locally
  // written array in the opposite order. Went red on the identity check.
  it('reads DEC-SYNC-001’s order from wave 0 rather than restating it', () => {
    expect(A6_RECONNECT_ORDER).toBe(DEC_SYNC_001_ORDER)
    expect(A6_RECONNECT_ORDER.map((p) => p.phase)).toEqual([
      'stop-class',
      'capture-upload',
      'enabling-class',
    ])
    expect(srcLine(41256)).toContain('AC-A6-12')
    expect(norm(srcLine(41256))).toContain(
      norm('the stop class applies before any capture leaves the device'),
    )
    // and wave 0's stop-class gap is read, not re-spelled: two items in the
    // stop class map onto none of the five command classes.
    expect(A6_STOP_CLASS_GAP.map((g) => g.item)).toEqual([
      'Device de-authorisation',
      'Remote data wipe',
    ])
    // THIS ASSERTION READ `DEC-WIPE-001` UNTIL `MOD-FL-A7` READ L51551.
    //
    // It was written to pin wave 0's shape as it stood, so that a change to
    // it would come back here rather than pass unnoticed. It did exactly
    // that: `MOD-FL-A7` found the source raises this gap as its own decision,
    // `DEC-CMDCLASS-001` at L51551 — "device wipe and de-authorisation is not
    // one of the five named command-channel classes" — and that the same line
    // holds `DEC-WIPE-001` apart from it in the source's own words:
    // "`DEC-WIPE-001` remains separate and unresolved: it concerns how long a
    // wipe may remain pending".
    //
    // So the two identifiers answer two questions. Whether the wipe has a
    // class is `DEC-CMDCLASS-001`; how long a wipe may stay pending is
    // `DEC-WIPE-001`, and it is still open and still disclosed by this module.
    expect(A6_STOP_CLASS_GAP.every((g) => g.openDecision === 'DEC-CMDCLASS-001')).toBe(true)
    expect(srcLine(51551)).toContain('DEC-CMDCLASS-001')
    expect(norm(srcLine(51551))).toContain(
      norm('is not one of the five named command-channel classes'),
    )
    expect(norm(srcLine(51551))).toContain(norm('DEC-WIPE-001` remains separate and unresolved'))
  })
})

/* ==================================================================== *
 * THE FOUR DISCLOSURES, AND THE STAND-IN BUILT TO EXPIRE.
 * ==================================================================== */

describe('the four open decisions', () => {
  // FAILS IF: a disclosed reading is not at the locator beside it. This is the
  // disclosure's whole contract — every reading carries its own line. Planted:
  // DEC-STORE-001's second reading pointed at the neighbouring pattern's line.
  // Went red on the anchor.
  //
  // The line numbers of the planted defects are deliberately NOT spelled here.
  // `tests/coverage/locator-fidelity.test.ts` lexes every L-number in this
  // tree as a citation and cannot tell a citation from an example of a wrong
  // one, so writing them would file knowingly-false citations against this
  // file in order to describe a test.
  it('finds every reading at its own locator, with its identifier there', () => {
    expect(A6_DISCLOSURES).toHaveLength(4)
    for (const d of A6_DISCLOSURES) {
      expect(d.readings.length, d.decisionRef).toBeGreaterThanOrEqual(2)
      for (const r of d.readings) {
        const [n] = locatorsOf(r.locator)
        const raw = srcLine(n as number)
        const anchor = anchorOf(r.locator)
        expect(anchor, `${r.locator} anchors on an identifier`).not.toBeNull()
        expect(raw.includes(anchor as string), `${r.locator} anchor`).toBe(true)
        expect(norm(raw).includes(norm(r.text)), `${d.decisionRef}: ${r.text.slice(0, 48)}`).toBe(
          true,
        )
      }
    }
  })

  // FAILS IF: a decision is filed under an identifier the canon already holds,
  // or the canon grows a record for one of these four and this module goes on
  // disclosing it locally. Two wordings of one decision is exactly what the
  // shared canon exists to prevent. It reads the union out of the canon file
  // rather than trusting a comment about it.
  //
  // Planted: DEC-STORE-001 re-filed as 'DEC-CAP-001', which the canon does
  // hold. Went red. The canon file itself was NOT edited to plant the other
  // direction — it is another task's path and a concurrent agent's tree — so
  // that half is held by the same assertion read the other way.
  it('discloses locally only because the shared canon has no record for these', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const block = canon.match(/export type DecisionId =([\s\S]*?)\n\n/)
    expect(block).not.toBeNull()
    const members = [...(block?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(members.length).toBeGreaterThan(20)
    for (const d of A6_DISCLOSURES) {
      expect(members, `${d.decisionRef} is absent from the canon`).not.toContain(d.decisionRef)
      expect(d.canonNote).toContain('DecisionId')
    }
  })

  // FAILS IF: this module and MOD-FL-A5 grow two different spellings of
  // DEC-CLOCKWIN-001 while both stand-ins are local. Two modules disclosing
  // one decision is a recorded finding, not an accident — A5 discloses it
  // because its classification is the act of record, this module because the
  // threshold is row 7 of its matrix — and the readings are the part that must
  // not drift. This is the one gate here that compares two strings this build
  // wrote, and that is its whole purpose. Planted: this module's second
  // reading shortened by a clause. Went red.
  it('carries the same DEC-CLOCKWIN-001 readings MOD-FL-A5 already carries', () => {
    const mine = A6_DISCLOSURES.find((d) => d.decisionRef === 'DEC-CLOCKWIN-001')
    const theirs = A5_DISCLOSURES.find((d) => d.decisionRef === 'DEC-CLOCKWIN-001')
    expect(mine).toBeDefined()
    expect(theirs).toBeDefined()
    expect(mine?.question).toBe(theirs?.question)
    expect(mine?.readings).toEqual(theirs?.readings)
    // and the two modules say different things about why THEY hold it, which
    // is the part that is legitimately theirs.
    expect(mine?.whyHere).not.toBe(theirs?.whyHere)
  })

  // FAILS IF: the one adopted decision of the four is dressed as unresolved,
  // or an unresolved one as adopted. DEC-SYNC-001 carries an adopted working
  // position of 2026-08-14 and the source says it no longer counts against the
  // open figure; the other three are Client Decision Required. Planted: the
  // DEC-SYNC-001 adopted text rewritten to say nothing is settled. Went red.
  it('separates the adopted position from the three still open', () => {
    const sync = A6_DISCLOSURES.find((d) => d.decisionRef === 'DEC-SYNC-001')
    expect(sync?.adopted).toContain('Option C')
    expect(sync?.adopted).toContain('2026-08-14')
    expect(srcLine(42644)).toContain('DEC-SYNC-001')
    expect(norm(srcLine(42644))).toContain(norm('no longer count against the figure'))
    for (const ref of ['DEC-CLOCKWIN-001', 'DEC-STORE-001', 'DEC-WIPE-001'] as const) {
      const d = A6_DISCLOSURES.find((x) => x.decisionRef === ref)
      expect(d?.adopted, ref).toContain('Nothing is resolved here')
    }
    // and the source classifies all three that way in its own words.
    expect(srcLine(41276)).toContain('Client Decision Required — DEC-STORE-001')
    expect(srcLine(41429)).toContain('DEC-WIPE-001')
    expect(srcLine(42598)).toContain('Client Decision Required — DEC-CLOCKWIN-001')
  })
})

/* ==================================================================== *
 * THE FINDINGS, AND WHERE THIS MODULE SURFACES.
 * ==================================================================== */

describe('what did not line up', () => {
  // FAILS IF: a finding's own locator is wrong, or a finding is dropped.
  // Planted: the register finding's locator moved off AC-FL-010-5. Went red on
  // the anchor. Planted again when the offline half added two: the four-axes
  // finding deleted outright — red at 7 against 8.
  it('records eight findings, each anchored at a real line', () => {
    expect(A6_SOURCE_FINDINGS).toHaveLength(8)
    for (const f of A6_SOURCE_FINDINGS) {
      const [n] = locatorsOf(f.sourceRef)
      expect(n, `${f.sourceRef} names a line`).toBeDefined()
      const anchor = anchorOf(f.sourceRef)
      if (anchor !== null) {
        expect(srcLine(n as number).includes(anchor), f.sourceRef).toBe(true)
      }
      expect(srcLine(n as number).trim().length, f.sourceRef).toBeGreaterThan(0)
    }
  })

  // FAILS IF: this module creates a route for itself, or claims the
  // six-destination register lists it. It does not: A6 is in no row of the
  // Modules column at L48529-L48534, and it surfaces as chrome on all six plus
  // the detail sheet on Notifications. Planted: the where-it-surfaces list
  // given a fourth entry claiming a destination of its own. Went red.
  it('claims no destination of its own, and reads the register that omits it', () => {
    for (let n = 48529; n <= 48534; n += 1) {
      expect(srcLine(n).includes('MOD-FL-A6'), `L${n} does not list this module`).toBe(false)
    }
    expect(srcLine(40045)).toContain('AC-FL-010-1')
    expect(norm(srcLine(40045))).toContain(norm('exactly six destinations and no seventh'))
    expect(A6_WHERE_IT_SURFACES).toHaveLength(3)
    for (const w of A6_WHERE_IT_SURFACES) {
      const [n] = locatorsOf(w.sourceRef)
      expect(norm(srcLine(n as number)).includes(norm(w.what)), w.sourceRef).toBe(true)
    }
    // the two lines that DO name this module, so the omission above is an
    // omission rather than the module being absent from the chapter.
    expect(srcLine(40035)).toContain('MOD-FL-A6')
    expect(srcLine(39868)).toContain('MOD-FL-A6')
  })

  // FAILS IF: the wave-0 offline treatment is re-derived instead of read. Its
  // `presentedAsCurrent` is the literal `false` and its `freshness` the
  // literal `'required'`, so a module that wrote its own could present
  // back-filled content as current. Planted: CACHED_READ_OFFLINE replaced with
  // a locally written object. Went red on the kind and the two literals.
  it('reads the cached-read treatment from wave 0', () => {
    expect(CACHED_READ_OFFLINE.kind).toBe('cached-read')
    expect(CACHED_READ_OFFLINE.outcome).toBe('cachedReadOnlyOffline')
    expect(CACHED_READ_OFFLINE.rendersState).toBe('STATE-08')
    expect(CACHED_READ_OFFLINE.freshness).toBe('required')
    expect(CACHED_READ_OFFLINE.presentedAsCurrent).toBe(false)
  })
})

/* ==================================================================== *
 * CATEGORICAL ABSENCES.
 * ==================================================================== */

describe('what nothing in this module may contain', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking reaches
  // this module's rendered text. AC-FL-000-5 (L39100), TEST-FL-000-3 (L39108),
  // AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683). Planted twice, in two
  // different shapes of field: "countdown" in the offline manual-sync line,
  // and "countdown" in a state gloss. Both went red naming the field.
  //
  // A REAL HAZARD ON THIS MODULE RATHER THAN A CEREMONIAL ONE: the offline
  // trust window is a bounded period whose own functionality says it "counts
  // down", and rendering that as a countdown on a worker's screen is exactly
  // what these four criteria forbid.
  it('carries no pace, timing, countdown or ranking word in any rendered string', () => {
    const FORBIDDEN = /\b(pace|timer|countdown|ranking|leaderboard|productivity)\b/i
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(120)
    for (const s of strings) {
      expect(FORBIDDEN.test(s.text), `${s.where}: ${s.text.slice(0, 60)}`).toBe(false)
    }
    expect(srcLine(39100)).toContain('AC-FL-000-5')
    expect(srcLine(48690)).toContain('AC-SCR-FL-002')
  })
})

/* ==================================================================== *
 * THE OFFLINE HALF.
 *
 * Slice 7 built the connected path and marked what it had not driven; this
 * block is the covering suite for the half that drives it. Every gate below
 * runs a mechanism rather than reading a flag, for the reason the flags
 * themselves record: `exercisedInThisSlice` and `drivenHere` are declarations,
 * and a declaration nobody checks against a run is a claim.
 * ==================================================================== */

describe('the four axes the seven states sit on', () => {
  // FAILS IF: the axes do not partition the seven exactly — a state in two
  // axes, or a state in none. Both directions, because a one-way containment
  // check passes a duplicated member and a length check passes a swap.
  //
  // Planted twice. First: STATE-A6-SKEWFLAGGED added to the trust axis as well
  // as the clock axis — red at eight against seven, and the duplicate check
  // behind it. Second: the clock axis's `members` emptied — red at six against
  // seven, which is the state declared by the charter and on no axis.
  it('partitions the seven exactly, none twice and none left out', () => {
    const onAnAxis = A6_STATE_AXES.flatMap((a) => a.members)
    expect(onAnAxis).toHaveLength(A6_STATES.length)
    expect(new Set(onAnAxis).size).toBe(onAnAxis.length)
    expect([...onAnAxis].sort()).toEqual(A6_STATES.map((s) => s.id).sort())
  })

  // FAILS IF: an axis cites a line that does not carry what it says. The trust
  // axis turns on the one gloss the source gives, and the transfer axis turns
  // on the functionality that puts a device offline and half-transferred at
  // the same instant. Planted: the transfer axis's locator moved to L41169,
  // the durable-queue functionality, which says nothing about resuming — went
  // red on the anchor.
  it('anchors each axis at a line that carries its evidence', () => {
    for (const a of A6_STATE_AXES) {
      const [n] = locatorsOf(a.sourceRef)
      expect(n, `${a.axis} names a line`).toBeDefined()
      const anchor = anchorOf(a.sourceRef)
      if (anchor !== null) expect(srcLine(n as number).includes(anchor), a.sourceRef).toBe(true)
    }
    // the trust axis's own evidence: L41112 glosses exactly this one member.
    expect(srcLine(41112)).toContain('`STATE-A6-TRUSTVALID` inside the offline trust window')
    // and the transfer axis's: a mid-sync drop, resumed rather than restarted.
    expect(srcLine(41170)).toContain('Resume a mid-sync connection drop where it left off')
  })
})

describe('the link axis, and the one answer the source settles for this engine', () => {
  // FAILS IF: a scenario lever has no link answer, or the answer is read from
  // a mode that does not correspond to it. Total over the six members, so a
  // seventh lever cannot arrive without a decision.
  //
  // A lever REMOVED from either record does not compile, which is the point of
  // the total `Record` and is why the plant is a wrong basis rather than a
  // missing one: `A6_LINK_BASIS.flapping` moved to `OFF-MODE-04`, one tablet
  // offline. Red — "flapping: expected 'offline' to be 'flapping'", because
  // that mode's own `connectivity` is not the lever asking.
  it('reads every lever’s answer off a source mode that names that lever', () => {
    expect(Object.keys(A6_LINK_BY_CONNECTIVITY).sort()).toEqual([...CONNECTIVITY_MODES].sort())
    expect(Object.keys(A6_LINK_BASIS).sort()).toEqual([...CONNECTIVITY_MODES].sort())
    for (const lever of CONNECTIVITY_MODES) {
      expect(offMode(A6_LINK_BASIS[lever]).connectivity, lever).toBe(lever)
    }
  })

  // FAILS IF: this build decides for itself what a device does when the link
  // is up and the backend is not answering. It does not decide: the source
  // rules it for THIS ENGINE in OFF-MODE-08's own Frontline-behaviour cell.
  // Planted: `dependency-down` mapped to STATE-A6-CONNECTED — went red against
  // the cell the source writes.
  //
  // AND THE DISTINCTION THE SAME ROW DEMANDS IS NOT LOST. The row requires
  // surfaces to distinguish device-dark from server-unreachable, and the two
  // levers collapse onto one link state, so the reading carries the lever and
  // the source modes beside the state. Planted: `modes` computed from a fixed
  // `offline` lever rather than from the situation's own — red on the last
  // assertion, because the two readings then carry identical mode sets.
  it('treats a backend that stops answering as offline, because L78650 says the engine does', () => {
    expect(srcLine(78650)).toContain('`OFF-MODE-08`')
    expect(srcLine(78650)).toContain('engine treats it as offline for sync purposes')
    expect(a6LinkBasisCell('dependency-down')).toContain('engine treats it as offline for sync purposes')
    expect(A6_LINK_BY_CONNECTIVITY['dependency-down']).toBe('STATE-A6-OFFLINE')
    expect(A6_LINK_BY_CONNECTIVITY.offline).toBe('STATE-A6-OFFLINE')
    // and the two are still told apart on the reading.
    const dark = a6StateReading({
      connectivity: 'offline',
      transfer: 'none',
      hoursSinceLastSuccessfulSync: 1,
      trustWindowHours: 24,
      skew: null,
    })
    const unreachable = a6StateReading({
      connectivity: 'dependency-down',
      transfer: 'none',
      hoursSinceLastSuccessfulSync: 1,
      trustWindowHours: 24,
      skew: null,
    })
    expect(dark.held).toEqual(unreachable.held)
    expect(dark.connectivity).not.toBe(unreachable.connectivity)
    expect(dark.modes.map((m) => m.identifier)).not.toEqual(
      unreachable.modes.map((m) => m.identifier),
    )
  })
})

describe('the two bounded tenant settings, and TEST-A6-4', () => {
  // FAILS IF: a value above the platform ceiling is accepted, or the refusal
  // is not a refusal. TEST-A6-4 (L41265) asks for "platform rejection rather
  // than a logged acceptance", so the ruling union has no member carrying both
  // an acceptance and a note — this asserts the refused branch has no `value`.
  //
  // Planted: the comparison changed from `>` to `>=`. 96 was still refused, so
  // the 96-hour half stayed green — and 72, the ceiling itself, went red,
  // which is why the boundary is asserted on both sides rather than only above
  // it. Planted again: `>` changed to `<`. That one reaches no assertion at
  // all — the module throws while loading, because the resolver runs three
  // situations at import to publish what it reaches and a 24-hour window is
  // then refused. The whole file went red with "RangeError: 24 hours is above
  // the platform ceiling of 72 hours".
  it('refuses 96 hours, accepts the ceiling itself, and accepts the default', () => {
    const refused = boundedSettingRuling('offline-trust-window', 96)
    expect(refused.accepted).toBe(false)
    expect('value' in refused).toBe(false)
    if (!refused.accepted) expect(refused.refusal).toContain('72')
    expect(boundedSettingRuling('offline-trust-window', 72).accepted).toBe(true)
    expect(boundedSettingRuling('offline-trust-window', 24).accepted).toBe(true)
    expect(boundedSettingRuling('clock-skew-threshold', 61).accepted).toBe(false)
    expect(boundedSettingRuling('clock-skew-threshold', 60).accepted).toBe(true)
    // the denial test really asks for this, and the criterion really states 72.
    expect(srcLine(41265)).toContain('TEST-A6-4')
    expect(srcLine(41265)).toContain('96 hours')
    expect(srcLine(41265)).toContain('platform rejection rather than a logged acceptance')
    expect(srcLine(41251)).toContain('cannot be set above 72 hours')
  })

  // FAILS IF: a ceiling or a default is not the number the source states, or a
  // clause is not the source's words. Both settings are read against their own
  // functionality line. Planted: the skew ceiling changed from 60 to 90 — went
  // red against L41181.
  it('takes both ceilings from the functionality that states them', () => {
    expect(A6_BOUNDED_SETTINGS).toHaveLength(2)
    for (const b of A6_BOUNDED_SETTINGS) {
      const [n] = locatorsOf(b.sourceRef)
      const line = srcLine(n as number)
      expect(line.includes(anchorOf(b.sourceRef) as string), b.id).toBe(true)
      expect(norm(line).includes(norm(b.clause)), `${b.id} clause`).toBe(true)
      expect(line).toContain(String(b.ceiling))
      expect(line).toContain(String(b.defaultValue))
    }
    expect(boundedSetting('offline-trust-window').ceiling).toBe(72)
    expect(boundedSetting('clock-skew-threshold').ceiling).toBe(60)
  })

  // FAILS IF: a device situation carrying a window the platform would have
  // refused is used to decide whether cached authority is still good. It is
  // not clamped and it is not trusted; it throws. Planted: the throw replaced
  // with a clamp to the platform ceiling, which is the tempting fix and the
  // wrong one — it silently invents the tenant's intent. Red, "expected
  // function to throw an error, but it didn't".
  it('refuses to read a state from a window the platform would not have set', () => {
    expect(() =>
      a6StateReading({ ...A6_TRUST_EXPIRED_SITUATION, trustWindowHours: 96 }),
    ).toThrow(RangeError)
    expect(
      a6StateReading({ ...A6_TRUST_EXPIRED_SITUATION, trustWindowHours: 72 }).trust,
    ).toBe('STATE-A6-TRUSTVALID')
    expect(A6_TRUST_EXPIRED_SITUATION.trustWindowHours).toBe(24)
    expect(a6StateReading(A6_TRUST_EXPIRED_SITUATION).trust).toBe('STATE-A6-TRUSTEXPIRED')
  })
})

describe('the reconnect ladder, walked over the thirty-seven steps', () => {
  // FAILS IF: an interrupted reconnection restarts rather than resuming, or
  // reports a transfer pass it never reached. The fixture stops at step 22, so
  // pass one has run and passes two and three have not.
  //
  // Planted: `resumeAt.number - 1` changed to `resumeAt.number`, which counts
  // the failed step as reached. Red on the pass count — 3 against 1 — and NOT
  // on the resume step, which is identical either way, which is why the pass
  // count is asserted beside it.
  it('resumes at the step that failed and claims only the passes it reached', () => {
    const r = a6Reconnect(A6_INTERRUPTED_OUTCOMES)
    expect(r.completed).toBe(false)
    expect(r.resumeAt?.number).toBe(22)
    expect(r.passesReached).toHaveLength(1)
    expect(r.passesReached[0]?.step).toBe(21)
    expect(r.line).toContain('carries on from that step rather than starting again')
    // and the criterion this build resumes under really says so.
    expect(srcLine(41247)).toContain('AC-A6-3')
    expect(srcLine(41247)).toContain('without restarting and without duplicating')
  })

  // FAILS IF: a completed pass reports a resume point, or claims fewer than
  // the three passes it ran.
  //
  // AND THIS GATE IS WHERE A FIELD THAT COULD NOT BE FALSE WAS FOUND. The
  // first version of `A6Reconnection` carried `ac36101` and `ac36102`,
  // computed by handing `satisfiesAc36101` the steps this walk had executed —
  // and this gate asserted both were true. The plant that should have caught a
  // defect there, replacing the executed list with all thirty-seven steps,
  // left the suite GREEN, because the executed list is always a prefix of 1 to
  // 37 and on a prefix that criterion is true unconditionally. Both fields
  // were removed rather than the gate being strengthened: they constrain an
  // ORDER, `@/offline/protocol`'s own suite asserts them against real orders,
  // and this walk is in order by construction.
  //
  // Planted after the removal, twice. `isSuccessfulFullPass` swapped for
  // `outcomes.every(...)`, which drops the length requirement and calls a
  // two-step run complete — red, "expected true to be false". And the step
  // count taken from the protocol's own length rather than from the outcomes
  // given — red at three passes against none, which is the defect this gate
  // found in the first place.
  it('reports a completed pass with no resume point, and all three passes', () => {
    const full: readonly StepOutcome[] = PROTOCOL_STEPS.map(() => 'success')
    const r = a6Reconnect(full)
    expect(r.completed).toBe(true)
    expect(r.resumeAt).toBeNull()
    expect(r.passesReached).toHaveLength(3)
    expect(r.line).toContain('thirty-seven')
    // a short run of successes is NOT a completed pass: L80027's exit trigger
    // is a full pass of all thirty-seven, which is why the length matters.
    const short = a6Reconnect(['success', 'success'])
    expect(short.completed).toBe(false)
    expect(short.passesReached).toHaveLength(0)
    expect(srcLine(80048)).toContain('AC-36-101')
    expect(srcLine(80048)).toContain('before any manifest is exchanged')
  })
})

describe('the register rows this module owns, and the row AC-OFF-701 cannot account for', () => {
  // FAILS IF: the register is read as though its Module column were a key, or
  // the row outside the seven is not this module's. Five rows name this module
  // and exactly one of them carries the eighth token.
  //
  // Planted: the module filter loosened from an equality on the cell to
  // `r.module.includes('MOD-FL-A')`, which is what reading the Module column as
  // a key looks like when it is written carelessly. Red at 37 rows against 5 —
  // it swept up every Frontline module's rows at once.
  it('finds five rows for this module, and the one of them outside the seven', () => {
    expect(A6_CLASSIFICATION_ROWS).toHaveLength(5)
    expect(
      OFFLINE_CLASSIFICATION.filter((r) => r.module === '`MOD-FL-A6`'),
    ).toHaveLength(A6_CLASSIFICATION_ROWS.length)
    expect(A6_ROWS_OUTSIDE_THE_SEVEN).toHaveLength(1)
    expect(A6_ROWS_OUTSIDE_THE_SEVEN[0]?.fn).toBe('Conflict resolution')
    expect(A6_ROWS_OUTSIDE_THE_SEVEN[0]?.klass).toBe('Explicitly prohibited on the device')
    // the source really puts that class on that row, against this module.
    const cells = srcLine(78799).split('|').map((c) => c.trim())
    expect(cells[1]).toBe('Conflict resolution')
    expect(cells[2]).toBe('`MOD-FL-A6`')
    expect(cells[3]).toBe('Explicitly prohibited on the device')
    // and the criterion really closes the set at seven.
    expect(srcLine(78831)).toContain('AC-OFF-701')
    expect(srcLine(78831)).toContain('exactly one of the seven classes')
  })
})

describe('what runs each functionality', () => {
  // FAILS IF: a driver's evidence is a sentence rather than the mechanism's
  // output. Every one is re-run here from the same fixtures and compared, so a
  // driver whose mechanism stops working cannot keep its claim.
  //
  // Planted three times, one per shape of mechanism, and EVERY PLANT IS IN
  // THIS MODULE'S OWN FILES. Reaching into `@/offline/**` or `fl-b9` to break
  // a mechanism would have been a sibling's red run for the seconds it took to
  // restore, and four tasks are running: the fixtures are what get bent
  // instead, which exercises the same call. The unconfirmed-media fixture
  // flipped to confirmed on all three conditions — red, the storage driver
  // then reported an eviction. The skewed conflict's flag removed — red, the
  // conflict driver then read `automatic` on both halves. And
  // `signOffReadiness(false)` changed to `(true)` inside the gate driver's own
  // evidence — red.
  it('re-runs every mechanism and finds the evidence it published', () => {
    const byId = new Map(A6_DRIVERS.map((d) => [d.id, d]))
    expect(byId.get('conflict-routing')?.evidence).toContain('individual review')
    expect(byId.get('on-device-storage')?.evidence).toContain('An attempted upload is not receipt')
    expect(byId.get('b9-gate')?.evidence).toContain('a sign-off proceeds: false')
    expect(byId.get('b9-gate')?.evidence).toContain('STATE-B9-PARKED')
    expect(byId.get('package-staging')?.evidence).toContain('STATE-A2-NOTREADY')
    expect(byId.get('package-staging')?.evidence).toContain('enterable: false')
    expect(byId.get('version-pinning')?.evidence).toContain('restaged nothing: false')
    expect(byId.get('queue-durability')?.evidence).toContain('stays queued on the device')
    expect(byId.get('skew-guard')?.evidence).toContain('deviation of 11 minutes')
    expect(byId.get('reconciliation')?.evidence).toContain('unexplained divergence')
    expect(byId.get('bounded-settings')?.evidence).toContain('above the platform ceiling')
    expect(byId.get('reconnect-ladder')?.evidence).toBe(a6Reconnect(A6_INTERRUPTED_OUTCOMES).line)
    expect(byId.get('device-state')?.evidence).toContain('STATE-A6-INTERRUPTED')
  })

  // FAILS IF: a driver drives nothing, two drivers drive the same
  // functionality, or a driver names a functionality that does not exist.
  // Planted: `FUNC-A6-02-2-1` added to the `reconnect-ladder` driver as well
  // as to `queue-durability`. Went red on the duplicate — and `A6_DRIVER_OF`
  // would have silently taken whichever driver came first.
  it('binds every driver to something, and nothing to two drivers', () => {
    const claimed = A6_DRIVERS.flatMap((d) => d.drives)
    expect(new Set(claimed).size).toBe(claimed.length)
    const ids = A6_FUNCTIONALITIES.map((f) => f.id)
    for (const id of claimed) expect(ids, `${id} is a real functionality`).toContain(id)
    for (const d of A6_DRIVERS) {
      expect(
        d.drives.length > 0 || d.drivesCardField !== null,
        `${d.id} drives nothing`,
      ).toBe(true)
    }
    expect(claimed).toHaveLength(A6_DRIVEN_COUNT)
    expect(Object.values(A6_DRIVER_OF).filter((v) => v === null)).toHaveLength(
      A6_UNDRIVEN.length,
    )
  })

  // FAILS IF: one of the two undriven functionalities is driven, or its reason
  // is not the source's. Neither is an omission: one is `Client Decision
  // Required` under an open decision AC-FL-011-5 forbids closing silently, and
  // the other states an excluded capability. Planted: FUNC-A6-07-1-4 bound to
  // the `on-device-storage` driver — which is what closing DEC-STORE-001
  // silently looks like from the inside. Went red.
  it('leaves the two the source closes off, and gives each the source’s reason', () => {
    for (const u of A6_UNDRIVEN) expect(A6_DRIVER_OF[u.id]).toBeNull()
    expect(srcLine(40155)).toContain('AC-FL-011-5')
    expect(srcLine(40155)).toContain('remain visibly open; no implementation may close them silently')
    expect(srcLine(41201)).toContain('`Client Decision Required`')
    expect(srcLine(41205)).toContain('concurrent same-record editing is out of scope')
  })
})

describe('the three situations, and what the sheet says in each state', () => {
  // FAILS IF: a state holds and the sheet has nothing to say about it. The
  // record is total over the seven, so this is a check that each line is the
  // source's claim for that state rather than that the key exists. Planted:
  // STATE-A6-TRUSTEXPIRED's line moved to L41129, the Offline behaviour field,
  // which says nothing about a window running out — went red on the words.
  it('gives every state a line the source states at the line it cites', () => {
    expect(Object.keys(A6_STATE_LINES)).toHaveLength(A6_STATES.length)
    for (const s of A6_STATES) {
      const entry = A6_STATE_LINES[s.id]
      expect(entry, s.id).toBeDefined()
      const [n] = locatorsOf(entry.sourceRef)
      expect(srcLine(n as number).trim().length, entry.sourceRef).toBeGreaterThan(0)
      const anchor = anchorOf(entry.sourceRef)
      if (anchor !== null) expect(srcLine(n as number).includes(anchor), entry.sourceRef).toBe(true)
    }
    // THE THREE BINDINGS THAT MAKE THE ABOVE MORE THAN A NON-BLANK CHECK. Two
    // of the seven cite a bare `L#####` with no identifier to anchor on, so
    // the anchor loop cannot see a locator moved from one prose line to
    // another — the first version of this gate claimed it could and it could
    // not. Each line's own claim is asserted at the line the record cites,
    // read through the record rather than at a fixed number.
    const at = (id: A6StateId): string =>
      srcLine(locatorsOf(A6_STATE_LINES[id].sourceRef)[0] as number)
    expect(norm(at('STATE-A6-TRUSTEXPIRED'))).toContain(
      norm('on trust-window expiry, no new session and no high-risk action, with all data preserved'),
    )
    expect(norm(at('STATE-A6-SKEWFLAGGED'))).toContain(norm('ordering follows server receipt'))
    expect(norm(at('STATE-A6-OFFLINE'))).toContain(
      norm('A full Run executes offline from the pinned package.'),
    )
    expect(norm(at('STATE-A6-CONNECTED'))).toContain(norm('Continuous bidirectional sync'))
  })

  // FAILS IF: the three situations stop reaching all seven between them, or a
  // reading comes back with no state at all. Exactly one link member and one
  // trust member always hold, so `held` can never be empty.
  //
  // Planted: the second situation's `transfer` changed to `none`, which drops
  // STATE-A6-INTERRUPTED off the screen entirely. Went red on the reached set
  // and, one gate over, on the charter's `drivenHere` equality.
  it('reaches all seven, and never returns a device in no state at all', () => {
    expect(A6_SITUATIONS).toHaveLength(3)
    expect([...A6_STATES_REACHED].sort()).toEqual(A6_STATES.map((s) => s.id).sort())
    for (const n of A6_SITUATIONS) {
      const r = a6StateReading(n.situation)
      expect(r.held.length, n.label).toBeGreaterThan(0)
      expect(r.held).toContain(r.link)
      expect(r.held).toContain(r.trust)
      expect(r.modes.length, `${n.label} reproduces at least one source mode`).toBeGreaterThan(0)
      // and `held` is in the order the source names them, not in axis order.
      const order = A6_STATES.map((s) => s.id)
      expect(r.held).toEqual(order.filter((id) => r.held.includes(id)))
    }
  })
})

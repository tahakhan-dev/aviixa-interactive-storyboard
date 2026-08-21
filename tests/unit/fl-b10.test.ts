import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FL_MATRIX_SHAPE,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { FL_DESTINATIONS } from '@/frontline/screens'
import { FL_FALLBACK_PATTERNS, functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import { OPEN_DECISIONS, OPEN_DECISION_IDS } from '@/disclosure/decisions'
import {
  B10_CARD,
  B10_CLAIMS_NEVER_MADE,
  B10_DEVICE_OBSERVABLE_STATES,
  B10_NOTIFICATION_STATES,
  B10_RESIDUAL_RISK,
  B10_SERVER_SIDE_STATES,
  B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE,
  B10_WHERE_IT_SURFACES,
} from '@/frontline/modules/fl-b10/charter'
import {
  FL_B10_COLUMNS,
  FL_B10_COLUMN_HEADINGS,
  FL_B10_MATRIX,
  FL_B10_SHAPE,
  UNAVAILABLE_TWO_SENSES,
  b10Row,
  type FlB10Column,
} from '@/frontline/modules/fl-b10/matrix'
import {
  B10_ACCEPTANCE_CRITERIA,
  B10_BACKFILL_STAMP,
  B10_CARD_PATTERNS,
  B10_CHANGE_TIERS,
  B10_DENIAL_TESTS,
  B10_EXPLANATORY_VIDEO_OPEN,
  B10_FUNCTIONALITIES,
  B10_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B10_HONESTY_RULE,
  B10_ILLUSTRATIVE_EXAMPLE,
  B10_INBOX,
  B10_INBOX_IS_ILLUSTRATIVE,
  B10_LANEB_AT_THE_DEVICE_END,
  B10_MAPPED_PATTERNS,
  B10_NOTIFICATION_TABLE,
  B10_OFFLINE_STATEMENT,
  B10_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B10_PATTERN_DIVERGENCE,
  B10_SOURCE_FINDINGS,
  B10_VERSION_PINNING_HOLDS,
  B10_WHERE_ITS_DECISIONS_LIVE,
  DEVICE_RUNG_LINE,
  SB_FL_019,
  advanceOnDevice,
  deviceRungsFor,
  triggerRow,
} from '@/frontline/modules/fl-b10/service'

/**
 * `MOD-FL-B10` — Notifications, checked against the FROZEN SOURCE rather than
 * against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from is
 * a hypothesis, and this build has recorded ten brief-supplied assertions that
 * could not fail and eleven wrong citations. A transcription is checked by
 * reading the line it cites and looking for the words; a locator is checked by
 * asking whether the identifier really occurs there. Nothing below asserts a
 * string against another string this task also wrote.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note names the defect that was actually planted,
 * not one that would have been convenient.
 *
 * THE PLANTED LINE NUMBER IS NEVER SPELLED IN A PLANT DESCRIPTION.
 * `tests/coverage/locator-fidelity.test.ts` lexes every L-number in this tree
 * as a citation and cannot tell a citation from an example of a wrong one, so
 * naming a blank line in a plant description files a knowingly-false citation.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/** Both sides folded identically before comparison. */
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

/**
 * The identifier a `sourceRef` anchors on, where it has one. The `L`-number
 * guard is not cosmetic: `L41856` matches the identifier shape exactly, and
 * without the guard the anchor check would ask whether line 41856 contains the
 * string "L41856", which is false for every line in the file.
 */
function anchorOf(sourceRef: string): string | null {
  const m = sourceRef.match(/^([A-Z][A-Z0-9-]{3,})\s+·/)
  const token = m?.[1] ?? null
  return token === null || /^L\d+$/.test(token) ? null : token
}

/** The cells of a source table row, by pipe, trimmed. */
function tableCells(n: number): readonly string[] {
  return srcLine(n)
    .split('|')
    .map((c) => c.trim())
}

/**
 * The seven status tokens, longest first. THE ORDER IS LOAD-BEARING: `Allowed`
 * is a prefix of `Allowed with conditions`, so a first-match rule passes an
 * `allowedWithConditions` cell retyped `allowed`. Longest match is the only
 * rule that separates them.
 */
const TOKENS = [
  'Client Decision Required',
  'Allowed with conditions',
  'Explicitly prohibited',
  'Not applicable',
  'Unavailable',
  'Read-only',
  'Allowed',
] as const

const OUTCOME_TOKEN: Readonly<Record<string, string>> = {
  allowed: 'Allowed',
  allowedWithConditions: 'Allowed with conditions',
  readOnly: 'Read-only',
  unavailable: 'Unavailable',
  explicitlyProhibited: 'Explicitly prohibited',
  clientDecisionRequired: 'Client Decision Required',
  notApplicable: 'Not applicable',
}

function leadingToken(note: string): string | null {
  const n = norm(note)
  const hits = TOKENS.filter((t) => n.startsWith(norm(t)))
  return [...hits].sort((a, b) => b.length - a.length)[0] ?? null
}

/** §22.19's own span: `## 22.19` through the line before `## 22.20`. */
const SECTION_22_19 = { first: 41772, last: 41928 } as const

function sectionText(): string {
  return LINES.slice(SECTION_22_19.first - 1, SECTION_22_19.last).join('\n')
}

/**
 * EVERY STRING THIS MODULE CAN PUT ON A SCREEN, in one place, because three
 * sweeps below walk it and a sweep that reaches fewer strings than the module
 * renders is a sweep that passes the defect it was written for. Wave 1
 * recorded exactly that: a sweep that read one field of a two-field return.
 */
function renderedStrings(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  const push = (where: string, text: string) => out.push({ where, text })
  for (const s of B10_CARD) push(`card ${s.field}`, `${s.text} ${s.elision ?? ''}`)
  for (const s of B10_NOTIFICATION_STATES) push(`state ${s.id}`, s.id)
  push('residual risk', `${B10_RESIDUAL_RISK.risk} ${B10_RESIDUAL_RISK.mitigation}`)
  for (const w of B10_WHERE_IT_SURFACES) push('surfaces', `${w.place} ${w.what}`)
  for (const c of B10_CLAIMS_NEVER_MADE) push('never-claimed', `${c.claim} ${c.instead}`)
  for (const row of FL_B10_MATRIX) {
    push(`row ${row.id}`, `${row.control} ${row.why}`)
    for (const column of FL_B10_COLUMNS) push(`${row.id}.${column}`, row.cells[column].note)
    for (const column of FL_B10_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      push(`${row.id}.${column} drawn`, drawn.kind === 'stated-line' ? drawn.line : drawn.note)
    }
  }
  for (const u of UNAVAILABLE_TWO_SENSES) push('unavailable sense', `${u.row} ${u.cellWords} ${u.sense} ${u.routeBack}`)
  for (const t of B10_NOTIFICATION_TABLE) {
    push(`trigger ${t.id}`, `${t.trigger} ${t.recipient} ${t.channel}`)
  }
  for (const f of B10_FUNCTIONALITIES) {
    push(f.id, `${f.statement} ${f.purpose} ${f.rolesAllowed} ${f.rolesProhibited ?? ''} ${f.connectivity} ${f.fallbackClause}`)
  }
  for (const g of B10_FUNCTIONALITIES_NAMING_NO_PATTERN) push(`gap ${g.id}`, g.ground)
  push('pattern divergence', B10_PATTERN_DIVERGENCE.note)
  for (const ac of B10_ACCEPTANCE_CRITERIA) push(ac.id, ac.text)
  for (const t of B10_DENIAL_TESTS) push(t.id, t.text)
  for (const f of B10_SOURCE_FINDINGS) push('finding', `${f.what} ${f.evidence} ${f.notClosedBecause}`)
  for (const d of B10_WHERE_ITS_DECISIONS_LIVE) push(`home ${d.decisionRef}`, `${d.where} ${d.why}`)
  push(
    'explanatory video open',
    `${B10_EXPLANATORY_VIDEO_OPEN.title} ${B10_EXPLANATORY_VIDEO_OPEN.question} ${B10_EXPLANATORY_VIDEO_OPEN.whatTheSourceSays} ${B10_EXPLANATORY_VIDEO_OPEN.whatThisBuildDraws} ${B10_EXPLANATORY_VIDEO_OPEN.noDecisionIdentifier}`,
  )
  push(
    'lane b device end',
    `${B10_LANEB_AT_THE_DEVICE_END.consequence} ${B10_LANEB_AT_THE_DEVICE_END.whatTheModuleSays} ${B10_LANEB_AT_THE_DEVICE_END.authorityColumn}`,
  )
  push(
    'storyboard',
    `${SB_FL_019.heading} ${SB_FL_019.notAStep} ${SB_FL_019.carries} ${SB_FL_019.absent} ${SB_FL_019.inSitu} ${SB_FL_019.control}`,
  )
  push(
    'illustrative example',
    `${B10_ILLUSTRATIVE_EXAMPLE.workflow} ${B10_ILLUSTRATIVE_EXAMPLE.whatChanged} ${B10_ILLUSTRATIVE_EXAMPLE.whatDidNot}`,
  )
  for (const t of B10_CHANGE_TIERS) push(`tier ${t.tier}`, `${t.whatItIs} ${t.whatTheWorkerSees}`)
  push('pinning', B10_VERSION_PINNING_HOLDS.text)
  push('offline', B10_OFFLINE_STATEMENT.text)
  push('honesty', B10_HONESTY_RULE.text)
  push(
    'backfill',
    `${B10_BACKFILL_STAMP.rule} ${B10_BACKFILL_STAMP.notTheArrivalTime} ${B10_BACKFILL_STAMP.notStatedInChapter22}`,
  )
  for (const i of B10_INBOX) push(`inbox ${i.id}`, `${i.subject} ${i.stamp}`)
  push('inbox disclaimer', B10_INBOX_IS_ILLUSTRATIVE)
  for (const s of B10_DEVICE_OBSERVABLE_STATES) push(`rung ${s}`, DEVICE_RUNG_LINE[s])
  return out
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-B10’s permission matrix', () => {
  // FAILS IF: a row is dropped or added. Planted: the seventh row deleted.
  // Rows went to 6 and cells to 30 while the data span stayed seven lines
  // long, which is the point of holding the span apart from the count.
  it('is seven rows over seven data lines, five columns, thirty-five cells', () => {
    expect(FL_B10_SHAPE.rows).toBe(7)
    expect(FL_B10_SHAPE.columns).toBe(5)
    expect(FL_B10_SHAPE.cells).toBe(35)
    expect(FL_B10_SHAPE.rows * FL_B10_SHAPE.columns).toBe(FL_B10_SHAPE.cells)
    expect(FL_B10_SHAPE.lastDataLine - FL_B10_SHAPE.firstDataLine + 1).toBe(FL_B10_SHAPE.rows)
    expect(FL_B10_SHAPE.separatorLine).toBe(FL_B10_SHAPE.headerLine + 1)
    expect(FL_B10_SHAPE.firstDataLine).toBe(FL_B10_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's reading of its own span disagrees with wave 0's
  // reading of all twelve. Two independent transcriptions of one table.
  // Planted: headerLine moved one line earlier. Went red on three fields.
  it('agrees with wave 0’s independent reading of the same table', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-B10')
    expect(waveZero).toBeDefined()
    expect(waveZero?.rows).toBe(FL_B10_SHAPE.rows)
    expect(waveZero?.columns).toBe(FL_B10_SHAPE.columns)
    expect(waveZero?.headerLine).toBe(FL_B10_SHAPE.headerLine)
    expect(waveZero?.separatorLine).toBe(FL_B10_SHAPE.separatorLine)
    expect(waveZero?.firstDataLine).toBe(FL_B10_SHAPE.firstDataLine)
    expect(waveZero?.lastDataLine).toBe(FL_B10_SHAPE.lastDataLine)
  })

  // FAILS IF: the header row is not where the shape says, or a column heading
  // is re-worded. Planted: 'Read-only Auditor' shortened to 'Auditor'.
  it('reads its five column headings off the header line itself', () => {
    const header = tableCells(FL_B10_SHAPE.headerLine).filter((c) => c.length > 0)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual(FL_B10_COLUMNS.map((c) => FL_B10_COLUMN_HEADINGS[c]))
  })

  // FAILS IF: the separator line is not a separator, which is what an
  // off-by-one span looks like. Planted: separatorLine advanced by one.
  it('cites a real separator line and seven real data lines', () => {
    expect(srcLine(FL_B10_SHAPE.separatorLine).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = FL_B10_SHAPE.firstDataLine; n <= FL_B10_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n).startsWith('| '), `L${n} is a data row`).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE LINE IT CITES.
 * ==================================================================== */

describe('every row and every cell against its own source line', () => {
  // FAILS IF: a row cites the wrong line, or its Action text was paraphrased.
  // Planted: row 5's control shortened to 'Dismiss a change notice'.
  it('finds each row’s action text in the line the row cites', () => {
    expect(FL_B10_MATRIX).toHaveLength(7)
    const cited = FL_B10_MATRIX.map((r) => locatorsOf(r.sourceRef)[0])
    expect(cited).toEqual([41792, 41793, 41794, 41795, 41796, 41797, 41798])
    for (const row of FL_B10_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      expect(norm(tableCells(n as number)[1] ?? ''), `${row.id} action`).toBe(norm(row.control))
    }
  })

  // FAILS IF: a cell's words are not the cell's words. This catches an
  // invented note and a note quietly trimmed to its token. Planted: row 3's
  // Worker cell flattened to the bare prohibition, dropping "in-app
  // notifications cannot be muted, platform-wide" — which is the only place
  // this matrix says the rule is platform-wide rather than device-local.
  it('finds every one of the thirty-five cells in its row’s source line', () => {
    let counted = 0
    for (const row of FL_B10_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const cells = tableCells(n as number)
      FL_B10_COLUMNS.forEach((column, i) => {
        const cell = row.cells[column]
        expect(cell, `${row.id}.${column} exists`).toBeDefined()
        expect(norm(cells[i + 2] ?? ''), `${row.id}.${column}`).toBe(norm(cell.note))
        counted += 1
      })
    }
    expect(counted).toBe(35)
  })

  // FAILS IF: an outcome is mapped to a token the cell does not carry.
  // Planted twice, once for each half of the rule: row 4's Worker outcome
  // retyped `allowedWithConditions` (longest match stays `Allowed`, red) and
  // row 6's Worker outcome retyped `notApplicable` (longest match stays
  // `Unavailable`, red). A first-match rule passes the first plant.
  it('maps every outcome to the longest token the cell actually opens with', () => {
    for (const row of FL_B10_MATRIX) {
      for (const column of FL_B10_COLUMNS) {
        const cell = row.cells[column]
        const expected = OUTCOME_TOKEN[cell.outcome]
        expect(expected, `${cell.outcome} is a known token`).toBeDefined()
        expect(leadingToken(cell.note), `${row.id}.${column}`).toBe(expected)
      }
    }
  })

  // FAILS IF: the token tally and the cell count disagree — the shape a
  // truncated transcription takes when the row count still looks right.
  // Planted: row 1's Tenant Admin cell retyped `explicitlyProhibited`, which
  // moved two counters and left the sum at thirty-five. Went red on both.
  it('sums its four tokens to the cell count, and states the three it does not carry', () => {
    const tally = new Map<string, number>()
    for (const row of FL_B10_MATRIX) {
      for (const column of FL_B10_COLUMNS) {
        const o = row.cells[column].outcome
        tally.set(o, (tally.get(o) ?? 0) + 1)
      }
    }
    expect(tally.get('explicitlyProhibited')).toBe(22)
    expect(tally.get('notApplicable')).toBe(6)
    expect(tally.get('unavailable')).toBe(5)
    expect(tally.get('allowed')).toBe(2)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(35)
    expect(tally.get('allowedWithConditions')).toBeUndefined()
    expect(tally.get('readOnly')).toBeUndefined()
    expect(tally.get('clientDecisionRequired')).toBeUndefined()
  })

  // FAILS IF: an open decision is claimed for a cell that does not defer to
  // one. All eleven Client Decision Required cells in the twelve matrices sit
  // in the Tenant Admin column and wave 0 enumerates them; none is this
  // module's. Planted: openDecision 'AC-FL-009-5' added to row 7's Tenant
  // Admin cell — the one cell of this matrix that has its own long clause and
  // therefore looks most like it defers to something.
  it('carries no open decision on any of the thirty-five cells', () => {
    for (const row of FL_B10_MATRIX) {
      for (const column of FL_B10_COLUMNS) {
        expect(row.cells[column].openDecision, `${row.id}.${column}`).toBeNull()
      }
    }
    // The cast is not laziness: wave 0's register is `as const`, so `module`
    // is a literal union that does not include this one and `tsc` rejects the
    // comparison as having no overlap. That refusal is itself the second
    // reading — the type says no MOD-FL-B10 cell exists in the register — and
    // widening to `string` keeps the runtime check alongside it rather than
    // deleting the assertion the compiler already made.
    expect(TENANT_ADMIN_OPEN_CELLS.filter((c) => (c.module as string) === 'MOD-FL-B10')).toEqual(
      [],
    )
  })

  // FAILS IF: a row's governing sentence is not at the line it cites, or the
  // identifier it anchors on is not there. No window: an identifier's line is
  // a fact stated exactly. Planted: row 6's whyRef pointed at the line
  // carrying FUNC-B10-02-1-2 instead of FUNC-B10-02-1-1. Went red on the
  // anchor before it went red on the words.
  it('finds each row’s governing sentence, and its anchor, at the cited line', () => {
    for (const row of FL_B10_MATRIX) {
      const [n] = locatorsOf(row.whyRef)
      const anchor = anchorOf(row.whyRef)
      expect(anchor, `${row.id} anchors on an identifier`).not.toBeNull()
      expect(srcLine(n as number).includes(anchor as string), `${row.whyRef} anchor`).toBe(true)
      expect(norm(srcLine(n as number)).includes(norm(row.why)), `${row.id} why`).toBe(true)
    }
  })

  // FAILS IF: `cells` stops being total over the five columns — the one thing
  // a blank transcription looks like. Planted: row 2's TENANT_ADMIN key
  // removed. Typecheck caught it first; this catches a cast that got past.
  it('holds a filled cell at every one of the thirty-five positions', () => {
    for (const row of FL_B10_MATRIX) {
      for (const column of FL_B10_COLUMNS) {
        const cell = row.cells[column] as { note?: string } | undefined
        expect(cell?.note, `${row.id}.${column}`).toBeTruthy()
      }
    }
  })
})

/* ==================================================================== *
 * WHAT EACH CELL DRAWS.
 * ==================================================================== */

describe('what each cell draws', () => {
  // FAILS IF: a control is added or lost. Two of thirty-five, both the
  // Worker's, and the row ids are asserted rather than the count alone — a
  // count is true of the right two and of the wrong two. Planted: row 3's
  // Worker cell retyped `allowed`, which is a MUTE CONTROL and is the single
  // defect this whole screen exists to not have. Went red naming the row.
  it('draws exactly two controls, both the Worker’s, on rows one and four', () => {
    const drawn: string[] = []
    for (const row of FL_B10_MATRIX) {
      for (const column of FL_B10_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') drawn.push(`${row.id}.${column}`)
      }
    }
    expect(drawn).toEqual([
      'view-own-inbox.WORKER',
      'leave-general-notification-unread.WORKER',
    ])
  })

  // FAILS IF: a row is classified away from this screen, or an act this
  // surface does not own is drawn as a control. Not one of the seven is met
  // elsewhere, which is unusual on this surface and is asserted rather than
  // assumed. Planted: row 1 reclassified `another-surface` with a Client
  // Command Center note lifted from its own Supervisor cell — which the
  // Supervisor cell really does name, so the plant reads plausible. Wave 0's
  // fold then returned a cross-surface statement for the WORKER cell too and
  // the control count went to one.
  it('classifies every row as this screen’s and names nowhere else', () => {
    for (const row of FL_B10_MATRIX) {
      expect(row.surface, row.id).toBe('screen')
      expect(row.metElsewhere, row.id).toBeNull()
      expect(row.routedTo, row.id).toEqual({})
    }
    expect(controlsOnActsHeldElsewhere([...FL_B10_MATRIX], [...FL_B10_COLUMNS])).toEqual([])
  })

  // FAILS IF: row 6 is given the temporary sense of `Unavailable`. The token
  // is identical in both senses and only `existence` separates them, so this
  // reads the tail of the stated line the fold actually built rather than the
  // field that fed it. Planted: existence changed to 'absent-under-condition',
  // which is the OTHER real sense and compiles. The tail changed from "there
  // is nothing to come back to" to "It returns when that condition lifts", and
  // the second half of this gate proves the two tails are not interchangeable
  // by reading the other sense's own line out of the source.
  it('renders row 6 as the permanent sense, in all five columns', () => {
    const row = b10Row('receive-os-push-alert')
    expect(row.existence).toBe('not-in-scope')
    for (const column of FL_B10_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, column).toBe('stated-line')
      if (drawn.kind !== 'stated-line') throw new Error('unreachable')
      expect(drawn.existence).toBe('not-in-scope')
      expect(drawn.line).toContain('no control is drawn here')
      expect(drawn.line).toContain('there is nothing to come back to')
      expect(drawn.line).not.toContain('It returns when that condition lifts')
    }
    // The other sense of the same token, read out of the source rather than
    // asserted: B12's training-material row is absent under a stated condition
    // and the destination table gives it a route back.
    expect(norm(srcLine(42114))).toContain(norm('Unavailable'))
    expect(norm(srcLine(42114))).toContain(
      norm('the library is deliberately excluded from the offline Run bundle'),
    )
    expect(norm(srcLine(40036))).toContain(norm('online-only by design'))
  })

  // FAILS IF: row 7 is folded into row 6 as a second not-in-scope row. The
  // source drew the distinction itself, six rows apart in this matrix, and
  // this gate reads BOTH tokens off BOTH lines so it cannot pass by agreeing
  // with the transcription alone. Planted: row 7's existence changed to
  // 'not-in-scope' — which is the tidier reading and is wrong. Went red on the
  // affordance kind.
  it('keeps row 7 a prohibited act rather than an absent capability', () => {
    const row = b10Row('configure-quiet-hours-or-channels')
    expect(row.existence).toBe('present')
    for (const column of FL_B10_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, column).toBe('refusal')
    }
    // the source's own distinction, read off the two lines
    expect(leadingToken(tableCells(41797)[2] ?? '')).toBe('Unavailable')
    expect(leadingToken(tableCells(41798)[2] ?? '')).toBe('Explicitly prohibited')
    expect(leadingToken(tableCells(41798)[5] ?? '')).toBe('Explicitly prohibited')
  })

  // FAILS IF: row 1's Supervisor cell is rendered as a refusal with no pointer,
  // or the pointer is invented. `Not applicable` is not a refusal to act — it
  // says the act does not arise for that role here — and this cell names where
  // the equivalent lives. Planted: the cell's note trimmed to the bare token,
  // which is what a reviewer tidying five near-identical cells would do.
  it('keeps the pointer in row 1’s Supervisor cell, verbatim', () => {
    const cell = b10Row('view-own-inbox').cells.SUPERVISOR
    expect(cell.outcome).toBe('notApplicable')
    expect(cell.note).toContain('equivalent feeds are in the Client Command Center')
    expect(norm(tableCells(41792)[3] ?? '')).toBe(norm(cell.note))
    const drawn = frontlineAffordance(b10Row('view-own-inbox'), 'SUPERVISOR')
    expect(drawn.kind).toBe('refusal')
    if (drawn.kind !== 'refusal') throw new Error('unreachable')
    expect(drawn.note).toContain('equivalent feeds are in the Client Command Center')
  })

  // FAILS IF: the three-sense record stops matching the source. It carries
  // this module's row and two of MOD-FL-B12's, and each `cellWords` is checked
  // against its own line — a record about an overload that itself misquotes
  // one of the three would be worse than not having it. Planted: L42120's
  // words replaced with L42114's, which is exactly the confusion the record
  // exists to prevent.
  it('quotes all three Unavailable cells from their own lines', () => {
    expect(UNAVAILABLE_TWO_SENSES).toHaveLength(3)
    for (const u of UNAVAILABLE_TWO_SENSES) {
      const [n] = locatorsOf(u.sourceRef)
      expect(norm(srcLine(n as number)), u.row).toContain(norm(u.cellWords))
      expect(norm(srcLine(n as number)), u.row).toContain(norm(u.row))
    }
    expect(UNAVAILABLE_TWO_SENSES.filter((u) => u.sense === 'exists nowhere for anyone')).toHaveLength(2)
  })
})

/* ==================================================================== *
 * THE NINETEEN STATES AND THE FOUR THIS DEVICE HAS.
 * ==================================================================== */

describe('the notification state vocabulary', () => {
  // FAILS IF: a state is dropped, added, or misspelled against L41808. The
  // count is read off the source's own list rather than asserted beside it.
  // Planted: 'suppressed' removed from the charter table — the state a
  // patch-level change actually exercises, so the trigger gate below went red
  // with it. Both went red.
  it('carries all nineteen states, in the order L41808 lists them', () => {
    const line = srcLine(41808)
    const listed = (line.match(/applies in full: ([^.]+)\./)?.[1] ?? '')
      .split(',')
      .map((s) => s.trim())
    expect(listed).toHaveLength(19)
    expect(B10_NOTIFICATION_STATES.map((s) => s.id)).toEqual(listed)
    // the platform's own count of the same list, in a different chapter
    expect(srcLine(51605)).toContain('The nineteen notification states')
  })

  // FAILS IF: a fifth state is marked device-observable, or one of the four is
  // dropped. The four are read out of the narrowing clause on the same line
  // rather than listed here. Planted: 'read' marked deviceObservable false,
  // which silently shortened the ordinary inbox item's ladder by one rung.
  it('marks exactly the four the narrowing clause on the same line names', () => {
    const clause = srcLine(41808).match(
      /the states the device can observe and write are ([^;]+);/,
    )?.[1]
    expect(clause, 'the narrowing clause is on L41808').toBeDefined()
    const named = (clause as string)
      .replace(/ and /g, ', ')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    expect(named).toEqual(['delivered', 'opened', 'read', 'acknowledged'])
    expect([...B10_DEVICE_OBSERVABLE_STATES]).toEqual(named)
    expect(B10_SERVER_SIDE_STATES).toHaveLength(15)
    expect(srcLine(41808)).toContain(
      'the earlier states are server-side and are never inferred by the device',
    )
  })

  // FAILS IF: the source's own "earlier" gloss is stretched over the nine
  // states that follow acknowledged. The nine are computed here from the
  // source's list and the four, not read from the module — so the module's
  // record has to agree with an independent derivation. Planted: 'expired'
  // marked serverSideByTheEarlierClause true, which is the tidy reading and
  // makes the module claim the source glossed a state it did not.
  it('does not extend the earlier-states gloss past the four', () => {
    const ids = B10_NOTIFICATION_STATES.map((s) => s.id)
    const firstDevice = ids.indexOf('delivered')
    const lastDevice = ids.indexOf('acknowledged')
    const earlier = ids.slice(0, firstDevice)
    const later = ids.slice(lastDevice + 1)
    expect(earlier).toHaveLength(6)
    expect(later).toHaveLength(9)
    expect([...B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE]).toEqual(later)
    for (const s of B10_NOTIFICATION_STATES) {
      const expected = earlier.includes(s.id) ? true : s.deviceObservable ? null : false
      expect(s.serverSideByTheEarlierClause, s.id).toBe(expected)
    }
  })

  // FAILS IF: a rung line collapses two of the four honest distinctions. Each
  // one names what it does NOT establish, which is the whole reason the four
  // are separate states. Planted: the `opened` line's second sentence deleted,
  // leaving "Opened on this device." Went red on the pairing check.
  it('gives every device rung a line that names what it does not establish', () => {
    for (const s of B10_DEVICE_OBSERVABLE_STATES) {
      expect(DEVICE_RUNG_LINE[s], s).toBeTruthy()
      expect(DEVICE_RUNG_LINE[s].length, s).toBeGreaterThan(60)
    }
    expect(DEVICE_RUNG_LINE.delivered).toContain('Delivery is not opening')
    expect(DEVICE_RUNG_LINE.opened).toContain('Opening is not acknowledgement')
    expect(DEVICE_RUNG_LINE.acknowledged).toContain('Acknowledgement is not the business action')
    // the rule these four sentences come from, at this module's own line
    expect(norm(srcLine(41848))).toContain(norm(B10_HONESTY_RULE.text))
  })
})

/* ==================================================================== *
 * THE FOUR TRIGGERS, AND THE LADDER EACH ONE ACTUALLY HAS.
 * ==================================================================== */

describe('the notification trigger table', () => {
  // FAILS IF: a trigger row is transcribed from the wrong line, or a column is
  // paraphrased. Four rows over four data lines. Planted: the patch-level
  // row's channel text replaced with the notified row's.
  it('finds all four rows, and every column, at their own lines', () => {
    expect(B10_NOTIFICATION_TABLE).toHaveLength(4)
    expect(B10_NOTIFICATION_TABLE.map((t) => locatorsOf(t.sourceRef)[0])).toEqual([
      41837, 41838, 41839, 41840,
    ])
    expect(srcLine(41835)).toContain('| Trigger | Recipient | Channel |')
    for (const t of B10_NOTIFICATION_TABLE) {
      const [n] = locatorsOf(t.sourceRef)
      const cells = tableCells(n as number)
      expect(norm(cells[1] ?? ''), `${t.id} trigger`).toBe(norm(t.trigger))
      expect(norm(cells[2] ?? ''), `${t.id} recipient`).toBe(norm(t.recipient))
      expect(norm(cells[3] ?? ''), `${t.id} channel`).toBe(norm(t.channel))
      expect(norm(cells[4] ?? ''), `${t.id} states`).toBe(norm(t.statesExercised.join(', ')))
    }
  })

  // FAILS IF: one four-rung ladder is applied to every trigger. The four rows
  // exercise four DIFFERENT state lists and the difference is the module: an
  // ordinary inbox item has no acknowledgement, a step flag stops at opened,
  // and a patch-level change has nothing the device can see at all. Planted:
  // 'acknowledged' appended to the ordinary-notification row's state list,
  // which would put an acknowledge control on an ordinary message and break
  // L41848's rule in the one place it is most tempting. Went red on both the
  // transcription gate above and this one.
  it('derives a different device ladder per trigger, and an empty one for the patch tier', () => {
    expect(deviceRungsFor('any-notification-to-the-identity')).toEqual([
      'delivered',
      'opened',
      'read',
    ])
    expect(deviceRungsFor('notified-class-change')).toEqual([
      'delivered',
      'opened',
      'read',
      'acknowledged',
    ])
    expect(deviceRungsFor('affected-steps-flag')).toEqual(['delivered', 'opened'])
    expect(deviceRungsFor('patch-level-change')).toEqual([])
    // and the patch row's reason is in its own words, at its own line
    expect(triggerRow('patch-level-change').recipient).toBe('Nobody is forced')
    expect(norm(srcLine(41838))).toContain(norm('no notification is forced on the worker'))
  })

  // FAILS IF: the ladder walks past the end of its own trigger's list, or a
  // state the trigger never has is treated as "not yet reached". Planted:
  // `advanceOnDevice` changed to fall back to the full four-rung order when
  // the current state is not in the trigger's list, which is the plausible
  // "be helpful" repair and is exactly the bug. Went red on the last two
  // assertions.
  it('stops at the end of each trigger’s own list and never skips into another', () => {
    expect(advanceOnDevice('any-notification-to-the-identity', 'delivered')).toBe('opened')
    expect(advanceOnDevice('any-notification-to-the-identity', 'opened')).toBe('read')
    expect(advanceOnDevice('any-notification-to-the-identity', 'read')).toBeNull()
    expect(advanceOnDevice('notified-class-change', 'read')).toBe('acknowledged')
    expect(advanceOnDevice('notified-class-change', 'acknowledged')).toBeNull()
    expect(advanceOnDevice('affected-steps-flag', 'opened')).toBeNull()
    // a state this trigger never has is not "not yet reached"
    expect(advanceOnDevice('any-notification-to-the-identity', 'acknowledged')).toBeNull()
    expect(advanceOnDevice('patch-level-change', 'delivered')).toBeNull()
  })

  // FAILS IF: an inbox item is seeded on a rung its own trigger does not have,
  // or a change notice is put in the inbox list. The second is the load-
  // bearing half: the notice is the first screen of the next execution, and an
  // inbox that holds it makes it scroll-past-able. Planted: a third item added
  // with trigger 'notified-class-change'.
  it('seeds every inbox item on a rung its own trigger exercises, and holds no change notice', () => {
    expect(B10_INBOX.length).toBeGreaterThan(0)
    for (const item of B10_INBOX) {
      expect(deviceRungsFor(item.trigger), item.id).toContain(item.startsAt)
      expect(item.trigger, item.id).not.toBe('notified-class-change')
    }
  })
})

/* ==================================================================== *
 * THE MODULE CARD.
 * ==================================================================== */

describe('the module card, transcribed', () => {
  // FAILS IF: a card field cites a line it is not on, or was paraphrased.
  // Every sentence long enough to be a claim is looked for at the cited line.
  // Planted: the Offline behaviour field's last clause — "and no surface may
  // imply one has" — deleted, which is the strongest sentence on the card.
  it('finds every card field’s sentences in the line it cites', () => {
    expect(B10_CARD.length).toBeGreaterThanOrEqual(20)
    for (const s of B10_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      expect(n, `${s.field} cites a line`).toBeDefined()
      const line = norm(srcLine(n as number))
      // A field whose whole prose is shorter than one checkable sentence —
      // the identifier line is three words — is checked WHOLE rather than
      // waved through, which is what a `length >= 25` filter alone would do.
      const sentences = s.text
        .split(/(?<=\.)\s+/)
        .map((x) => x.trim())
        .filter((x) => x.length >= 25)
      const checkable = sentences.length > 0 ? sentences : [s.text]
      for (const sentence of checkable) {
        expect(line.includes(norm(sentence)), `${s.field}: ${sentence.slice(0, 50)}`).toBe(true)
      }
    }
  })

  // FAILS IF: a classification is asserted for a field whose card carries
  // none. Eight of the fields carry a marker and the rest do not, and the
  // check reads the marker off the line rather than trusting the field.
  // Planted: `sourceClass: 'SoW Fact'` added to the Security field, whose line
  // carries no marker at all.
  it('claims a source classification only where the card states one', () => {
    let withMarker = 0
    for (const s of B10_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const hasMarker = /\[`?SoW Fact/.test(srcLine(n as number))
      if (s.sourceClass !== null) {
        expect(hasMarker, `${s.field} claims ${s.sourceClass}`).toBe(true)
        withMarker += 1
      }
    }
    expect(withMarker).toBeGreaterThan(0)
    expect(withMarker).toBeLessThan(B10_CARD.length)
  })

  // FAILS IF: the residual risk is invented or attached to the wrong
  // identifier. Planted: the mitigation sentence rewritten to "the worker is
  // notified on reconnection", which is a notificational mitigation and is the
  // opposite of what the source says. Went red on the words.
  it('finds RISK-FL-B10-1 and its structural mitigation at L41850', () => {
    const line = srcLine(41850)
    expect(line).toContain('RISK-FL-B10-1')
    expect(norm(line)).toContain(norm(B10_RESIDUAL_RISK.risk))
    expect(norm(line)).toContain(norm(B10_RESIDUAL_RISK.mitigation))
  })

  // FAILS IF: the destination record drifts from wave 0's, or claims a
  // destination this module does not have. §25.5 gives it all features of
  // SCR-FL-04; the sheet that shares the destination is A6's. Planted: the
  // third entry's claim changed to say this module renders the sheet.
  it('claims the destination §25.5 gives it, and not A6’s sheet', () => {
    expect(srcLine(48532)).toContain('MOD-FL-B10 all features')
    expect(srcLine(40035)).toContain('`MOD-FL-B10`, `MOD-FL-A6`')
    expect(srcLine(39868)).toContain('Sync detail sheet')
    expect(srcLine(39868)).toContain('`MOD-FL-A2`, `MOD-FL-A6`')
    const dest = FL_DESTINATIONS.find((d) => d.slug === 'notifications-and-sync-inbox')
    expect(dest?.modulesShown).toBe('MOD-FL-B10 all features')
    const sheetEntry = B10_WHERE_IT_SURFACES.find((w) => w.sourceRef.includes('39868'))
    expect(sheetEntry?.place).toContain('MOD-FL-A6’s, not this module’s')
  })
})

/* ==================================================================== *
 * THE STORYBOARD AND THE TWO TIERS.
 * ==================================================================== */

describe('SB-FL-019 and the two change tiers', () => {
  // FAILS IF: the storyboard's own strings are paraphrased, or its stated
  // absence is dropped. The absence is the load-bearing field: a reader cannot
  // see that there is no dismiss control unless it is said. Planted: `absent`
  // shortened to "There is no dismiss control", losing the second half —
  // which is the half TEST-B10-5 actually tests.
  it('renders SB-FL-019’s own words, its one control, and its stated absence', () => {
    const line = srcLine(41894)
    expect(line).toContain('SB-FL-019')
    for (const s of [SB_FL_019.heading, SB_FL_019.notAStep, SB_FL_019.absent, SB_FL_019.inSitu]) {
      expect(norm(line).includes(norm(s)), s.slice(0, 40)).toBe(true)
    }
    expect(norm(line)).toContain(norm(SB_FL_019.carries))
    expect(SB_FL_019.control).toBe('Start')
    expect(line).toContain('a single control reading "Start"')
  })

  // FAILS IF: a tier's behaviour is swapped for the other's. The two are
  // opposites and adjacent, which is how they get crossed. Planted: the
  // patch tier's `whatTheWorkerSees` replaced with the notified tier's.
  it('keeps the two tiers apart, each at its own functionality line', () => {
    expect(B10_CHANGE_TIERS).toHaveLength(2)
    for (const t of B10_CHANGE_TIERS) {
      const [n] = locatorsOf(t.sourceRef)
      const anchor = anchorOf(t.sourceRef)
      expect(srcLine(n as number)).toContain(anchor as string)
      expect(norm(srcLine(n as number)), t.tier).toContain(norm(t.whatItIs))
    }
    expect(B10_CHANGE_TIERS[0].whatTheWorkerSees).toContain('Nothing')
    expect(B10_CHANGE_TIERS[1].whatTheWorkerSees).toContain('first screen')
    expect(B10_CHANGE_TIERS[0].trigger).toBe('patch-level-change')
    expect(B10_CHANGE_TIERS[1].trigger).toBe('notified-class-change')
  })

  // FAILS IF: the never-interrupt rule loses its own line. Both tiers obey it
  // and the source's diagram puts it under both branches. Planted: the
  // sourceRef moved to the notified tier's functionality line, where the
  // sentence does not appear.
  it('finds the never-interrupt rule at its own functionality line', () => {
    const [n] = locatorsOf(B10_VERSION_PINNING_HOLDS.sourceRef)
    expect(srcLine(n as number)).toContain('FUNC-B10-03-2-3')
    expect(norm(srcLine(n as number))).toContain(norm(B10_VERSION_PINNING_HOLDS.text))
    expect(norm(srcLine(41888))).toContain(norm('Version pinning holds'))
  })

  // FAILS IF: the worked example stops being the source's. Planted: the
  // version changed to v2.3.0, which is not in the source and would make the
  // change notice on screen a fiction wearing a citation.
  it('takes the change notice’s worked example from the source’s own line', () => {
    const line = srcLine(41896)
    expect(line).toContain('Illustrative Example')
    for (const s of [
      B10_ILLUSTRATIVE_EXAMPLE.version,
      B10_ILLUSTRATIVE_EXAMPLE.workflow,
      B10_ILLUSTRATIVE_EXAMPLE.whatChanged,
    ]) {
      expect(norm(line).includes(norm(s)), s).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE BACK-FILL STAMP — A RULE THAT IS NOT IN THIS MODULE'S CHAPTER.
 * ==================================================================== */

describe('the back-fill stamp', () => {
  // FAILS IF: the event-time rule is attributed to §22.19, which does not
  // state it. Both halves matter: the rule is at the lines cited, AND it is
  // absent from this module's whole section. Planted: the sourceRef changed to
  // the module's own purpose line, which states the back-fill and not the
  // stamp. Went red on the anchor and on the words.
  it('cites §30C for the event-time rule, because §22.19 never states it', () => {
    const [n] = locatorsOf(B10_BACKFILL_STAMP.sourceRef)
    expect(srcLine(n as number)).toContain('AC-30C-1104')
    expect(norm(srcLine(n as number))).toContain(norm(B10_BACKFILL_STAMP.rule))
    expect(srcLine(73842)).toContain('AC-30C-1205')
    expect(srcLine(73842)).toContain('original event time')
    // and the absence that makes the citation necessary
    expect(sectionText()).not.toContain('event time')
    expect(sectionText()).toContain('back-fills on login')
  })

  // FAILS IF: the notification back-fill is folded into the Hub's scheduler
  // backfill, which runs against the original DUE time and is a different
  // mechanism. Planted: the corroboration line changed to the Hub digest
  // fallback line, which says "backfill against the original due time" and
  // reads close enough to pass an eye.
  it('does not confuse the event time with the scheduler’s due time', () => {
    const [n] = locatorsOf(B10_BACKFILL_STAMP.corroboration)
    expect(srcLine(n as number)).toContain('original event time')
    expect(srcLine(n as number)).not.toContain('due time')
    expect(srcLine(27381)).toContain('original due time')
    expect(B10_BACKFILL_STAMP.notStatedInChapter22).toContain('§30C')
  })
})

/* ==================================================================== *
 * THE FUNCTIONALITIES, AND AC-FL-011-1.
 * ==================================================================== */

describe('the thirteen functionalities', () => {
  // FAILS IF: the module's functionality list and the source's disagree. The
  // source's list is read out of §22.19 rather than counted by hand. Planted:
  // FUNC-B10-02-1-2 deleted from the module, which is the "make no promise"
  // one and has no pattern, so the gap count also moved.
  it('carries every FUNC-B10-* the source states in §22.19, and no other', () => {
    const inSource = [...new Set([...sectionText().matchAll(/`(FUNC-B10-[\d-]+)`/g)].map((m) => m[1]))]
    expect(inSource).toHaveLength(13)
    expect(B10_FUNCTIONALITIES.map((f) => f.id)).toEqual(inSource)
  })

  // FAILS IF: a functionality's clauses are not at the line it cites.
  // Planted: FUNC-B10-03-2-2's connectivity clause dropped its reason —
  // "because the flags travel in the package" — which is the clause that makes
  // it a package-pattern functionality rather than a command-pattern one.
  it('finds each functionality’s clauses at its own line', () => {
    for (const f of B10_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const line = srcLine(n as number)
      expect(line, f.id).toContain(f.id)
      const nline = norm(line)
      expect(nline.includes(norm(f.statement)), `${f.id} statement`).toBe(true)
      expect(nline.includes(norm(f.purpose)), `${f.id} purpose`).toBe(true)
      expect(nline.includes(norm(f.rolesAllowed)), `${f.id} roles allowed`).toBe(true)
      expect(nline.includes(norm(f.connectivity)), `${f.id} connectivity`).toBe(true)
      if (f.rolesProhibited !== null) {
        expect(nline.includes(norm(f.rolesProhibited)), `${f.id} roles prohibited`).toBe(true)
      }
    }
  })

  // FAILS IF: the one functionality with no roles-prohibited clause is filled
  // from its neighbours. Exactly one of thirteen, and the check reads the
  // source rather than the module: every functionality claiming a clause must
  // have "Roles prohibited" on its line, and the one claiming none must not.
  // Planted: 'nobody may ship it' written into FUNC-B10-03-3-1, which is
  // plausible and is not in the source. Went red on the absence half.
  it('records the one missing roles-prohibited clause rather than inventing it', () => {
    const missing = B10_FUNCTIONALITIES.filter((f) => f.rolesProhibited === null)
    expect(missing.map((f) => f.id)).toEqual(['FUNC-B10-03-3-1'])
    for (const f of B10_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      expect(srcLine(n as number).includes('Roles prohibited'), f.id).toBe(
        f.rolesProhibited !== null,
      )
    }
  })

  // FAILS IF: a fallback pattern is assigned to a functionality whose own line
  // does not name it. Planted: FB-FL-CORE-01 assigned to FUNC-B10-01-2-1,
  // which is the AC-FL-011-1 gap being quietly filled — the exact defect the
  // common brief forbids by name.
  it('assigns a pattern only where the functionality’s own line names it', () => {
    for (const f of B10_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const line = srcLine(n as number)
      for (const p of f.patterns) expect(line, `${f.id} names ${p}`).toContain(p)
      if (f.patterns.length === 0) {
        expect(/FB-FL-[A-Z0-9]+-\d+/.test(line), `${f.id} names no pattern`).toBe(false)
        expect(norm(line), f.id).toContain(norm(f.fallbackClause))
      }
    }
  })

  // FAILS IF: the AC-FL-011-1 gap is closed by invention rather than reported.
  // Four of thirteen, each with the source's own ground. The report is derived
  // through wave 0's own helper as well as locally, so two readings have to
  // agree. Planted: the fourth gap given FB-FL-PKG-01 — went red here and in
  // the pattern gate above.
  it('reports the four functionalities that name no FB-FL pattern', () => {
    expect(B10_FUNCTIONALITIES_NAMING_NO_PATTERN.map((g) => g.id)).toEqual([
      'FUNC-B10-01-2-1',
      'FUNC-B10-01-2-2',
      'FUNC-B10-02-1-2',
      'FUNC-B10-02-1-3',
    ])
    expect(functionalitiesNamingNoPattern([...B10_FUNCTIONALITIES])).toEqual(
      B10_FUNCTIONALITIES_NAMING_NO_PATTERN.map((g) => g.id),
    )
    for (const g of B10_FUNCTIONALITIES_NAMING_NO_PATTERN) {
      expect(g.ground, g.id).toContain('Not applicable')
      const [n] = locatorsOf(g.sourceRef)
      expect(norm(srcLine(n as number)), g.id).toContain(norm(g.ground))
    }
  })

  // FAILS IF: the three divergent readings of this module's fallback set are
  // silently reconciled. Each of the three is read independently — the map out
  // of wave 0's transcription, the card out of L41846, the clauses out of the
  // functionalities — and the two the map omits are checked against the map's
  // own rows so the divergence is proven rather than claimed. Planted:
  // FB-FL-UP-01 removed from B10_CARD_PATTERNS to make the card agree with the
  // map. Went red at 2 against 3.
  it('keeps the three readings of its fallback set apart', () => {
    expect(B10_MAPPED_PATTERNS.map((p) => p.id)).toEqual(['FB-FL-CORE-01', 'FB-FL-CMD-01'])
    expect([...B10_CARD_PATTERNS]).toEqual(['FB-FL-CORE-01', 'FB-FL-CMD-01', 'FB-FL-UP-01'])
    expect([...B10_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual([
      'FB-FL-CMD-01',
      'FB-FL-CORE-01',
      'FB-FL-PKG-01',
      'FB-FL-UP-01',
    ])
    // the card's three, at the card's own line
    expect(norm(srcLine(41846))).toContain(
      norm('FB-FL-CORE-01 primary; FB-FL-CMD-01 for version-change delivery; FB-FL-UP-01 for read-state upload.'),
    )
    // the two the §22.9 map omits, read off the map's own rows
    for (const id of ['FB-FL-UP-01', 'FB-FL-PKG-01'] as const) {
      const pattern = FL_FALLBACK_PATTERNS.find((p) => p.id === id)
      expect(pattern?.primaryModules, id).not.toContain('MOD-FL-B10')
      const [mapLine] = locatorsOf(pattern?.sourceRef.split('(pattern),')[1] ?? '')
      expect(srcLine(mapLine as number), `${id} map row`).not.toContain('MOD-FL-B10')
    }
    // and the two it does list, the same way
    for (const id of ['FB-FL-CORE-01', 'FB-FL-CMD-01'] as const) {
      const pattern = FL_FALLBACK_PATTERNS.find((p) => p.id === id)
      const [mapLine] = locatorsOf(pattern?.sourceRef.split('(pattern),')[1] ?? '')
      expect(srcLine(mapLine as number), `${id} map row`).toContain('MOD-FL-B10')
    }
  })
})

/* ==================================================================== *
 * ACCEPTANCE CRITERIA AND DENIAL TESTS.
 * ==================================================================== */

describe('the acceptance criteria and the denial tests', () => {
  // FAILS IF: a criterion is transcribed from the wrong row. Eight over eight
  // consecutive lines, and the identifier is checked at the line as well as
  // the words — a row shifted by one still reads plausibly. Planted: AC-B10-6
  // and AC-B10-7 swapped.
  it('finds all eight criteria at their own lines', () => {
    expect(B10_ACCEPTANCE_CRITERIA).toHaveLength(8)
    for (const ac of B10_ACCEPTANCE_CRITERIA) {
      const [n] = locatorsOf(ac.sourceRef)
      expect(srcLine(n as number), ac.id).toContain(ac.id)
      expect(norm(srcLine(n as number)), ac.id).toContain(norm(ac.text))
    }
    expect(B10_ACCEPTANCE_CRITERIA.map((a) => locatorsOf(a.sourceRef)[0])).toEqual([
      41904, 41905, 41906, 41907, 41908, 41909, 41910, 41911,
    ])
  })

  // FAILS IF: a denial test is quoted from the wrong row. Planted: TEST-B10-4
  // pointed at the row for TEST-B10-5.
  it('finds all three denial tests at their own lines', () => {
    for (const t of B10_DENIAL_TESTS) {
      const [n] = locatorsOf(t.sourceRef)
      expect(srcLine(n as number), t.id).toContain(t.id)
      expect(srcLine(n as number), t.id).toContain('Denial')
      expect(norm(srcLine(n as number)), t.id).toContain(norm(t.text))
    }
  })
})

/* ==================================================================== *
 * THE OPEN DECISIONS, AND THE ONE THAT IS NOT THIS MODULE'S.
 * ==================================================================== */

describe('the open decisions', () => {
  // FAILS IF: this module opens a local stand-in for a decision the shared
  // canon already holds, which would put two spellings of DEC-LANEB-001 in the
  // tree. The canon's exported record set is read here, so the moment it stops
  // holding the identifier this gate goes red and forces a local disclosure.
  // Planted: 'DEC-LANEB-001' renamed in the assertion to an identifier the
  // canon does not hold — went red, which is the direction that matters.
  it('renders DEC-LANEB-001 from the shared canon, because the canon holds it', () => {
    expect([...OPEN_DECISION_IDS]).toContain('DEC-LANEB-001')
    const record = OPEN_DECISIONS.find((d) => d.id === 'DEC-LANEB-001')
    expect(record?.readings.length).toBeGreaterThanOrEqual(2)
    // this module writes no reading of its own for it
    const home = B10_WHERE_ITS_DECISIONS_LIVE.find((d) => d.decisionRef === 'DEC-LANEB-001')
    expect(home?.where).toContain('shared decision canon')
    // and the source really does attach it to this module
    expect(srcLine(41927)).toContain('Lane B patch behaviour carries `DEC-LANEB-001`')
    expect(srcLine(41869)).toContain('Contradiction preserved: `DEC-LANEB-001`')
  })

  // FAILS IF: the device-end consequence is asserted rather than read. The
  // whole claim is that ONE command class carries both routes, and the
  // authority column is pulled out of wave 0's transcription of the command
  // table and checked against the source line — not written here. Planted: the
  // class changed to CMD-FL-REASSIGN, which compiles because it is a real
  // member of the five. Went red on the authority column.
  it('reads the Lane B device-end consequence off the command table', () => {
    expect(B10_LANEB_AT_THE_DEVICE_END.whatTheDeviceReceives).toBe('CMD-FL-VERSION')
    expect(B10_LANEB_AT_THE_DEVICE_END.authorityColumn).toBe(
      'Publication authority, including Lane B auto-published patches',
    )
    const [n] = locatorsOf(B10_LANEB_AT_THE_DEVICE_END.classRef)
    expect(srcLine(n as number)).toContain('CMD-FL-VERSION')
    expect(norm(srcLine(n as number))).toContain(norm(B10_LANEB_AT_THE_DEVICE_END.authorityColumn))
    expect(B10_LANEB_AT_THE_DEVICE_END.consequence).toContain('never that the chain ran')
  })

  // FAILS IF: DEC-MSG-001 is disclosed on this screen. The dispatch assigned
  // it; §22.19 contains no occurrence of it, and MOD-FL-A1 and MOD-FL-A7 both
  // already disclose it in full. Both halves are checked: the identifier is
  // absent from this module's whole section, and neither of the two wordings
  // appears in any string this module renders. Planted: Reading A pasted into
  // the "where its decisions live" note as an illustration — went red on the
  // wording sweep, which is the half that would otherwise let a third spelling
  // in through a comment-shaped field.
  it('discloses where DEC-MSG-001 lives and prints neither of its wordings', () => {
    expect(sectionText()).not.toContain('DEC-MSG-001')
    const readingA = 'Operation suspended. Contact your supervisor. Your work has been saved.'
    const readingB = 'Operation suspended — your work has been saved.'
    expect(srcLine(5265)).toContain(readingA)
    expect(srcLine(5266)).toContain(readingB)
    for (const s of renderedStrings()) {
      expect(norm(s.text), s.where).not.toContain(norm(readingA))
      expect(norm(s.text), s.where).not.toContain(norm(readingB))
    }
    const home = B10_WHERE_ITS_DECISIONS_LIVE.find((d) => d.decisionRef === 'DEC-MSG-001')
    expect(home?.where).toContain('MOD-FL-A1')
    expect(home?.where).toContain('MOD-FL-A7')
    // TEST-SCR-FL-006 is what requires both, and it names the decision
    expect(srcLine(48703)).toContain('TEST-SCR-FL-006')
    expect(srcLine(48703)).toContain('both source wordings are preserved under `DEC-MSG-001`')
  })

  // FAILS IF: the explanatory-video open item is filed under a decision
  // identifier the source does not give it. Planted: `decisionRef:
  // 'DEC-LIB-001'` added and rendered — DEC-LIB-001 is a real canon record
  // about library edits reaching an in-flight Run, so the plant reads like a
  // transcription. Went red on the absence check.
  it('carries no decision identifier for the explanatory video, because the source attaches none', () => {
    const [n] = locatorsOf(B10_EXPLANATORY_VIDEO_OPEN.sourceRef)
    const line = srcLine(n as number)
    expect(line).toContain('FUNC-B10-03-3-1')
    expect(line).toContain('Client Decision Required')
    expect(/`DEC-[A-Z]+-\d+`/.test(line)).toBe(false)
    expect(norm(line)).toContain(norm(B10_EXPLANATORY_VIDEO_OPEN.whatTheSourceSays))
    const record = B10_EXPLANATORY_VIDEO_OPEN as Record<string, unknown>
    expect(record['decisionRef']).toBeUndefined()
    expect(B10_EXPLANATORY_VIDEO_OPEN.whatThisBuildDraws).toContain('Nothing')
  })
})

/* ==================================================================== *
 * FINDINGS.
 * ==================================================================== */

describe('the findings against the source', () => {
  // FAILS IF: a finding cites a line that does not carry what it says.
  // Planted: the third finding's sourceRef moved to the module's own Purpose
  // line, which does not name DEC-LANEB-001.
  it('anchors every finding at a line that carries its subject', () => {
    expect(B10_SOURCE_FINDINGS).toHaveLength(4)
    for (const f of B10_SOURCE_FINDINGS) {
      const [n] = locatorsOf(f.sourceRef)
      expect(n, f.what.slice(0, 40)).toBeDefined()
      const anchor = anchorOf(f.sourceRef)
      if (anchor !== null) {
        expect(srcLine(n as number).includes(anchor), f.sourceRef).toBe(true)
      }
      expect(srcLine(n as number).trim().length, `L${n} is not blank`).toBeGreaterThan(0)
    }
    expect(B10_SOURCE_FINDINGS[2].sourceRef).toBe('L41927')
    expect(srcLine(41927)).toContain('DEC-LANEB-001')
  })
})

/* ==================================================================== *
 * EVERY IDENTIFIER-ANCHORED CITATION IN THE MODULE, SWEPT.
 * ==================================================================== */

describe('every citation this module writes', () => {
  // FAILS IF: any `IDENT · L<n>` citation anywhere in this module's four files
  // names a line that does not carry that identifier. The gates above check
  // the citations they happen to walk; this one walks the FILES, so a citation
  // in a field no other gate reads is still checked.
  //
  // IT CAUGHT ONE, IN THIS MODULE, BEFORE ANY OF THE OTHERS DID. The
  // DEC-MSG-001 pointer was written `DEC-MSG-001 · L5265` — the line carrying
  // Reading A. The identifier is on the card header two lines above it, and no
  // gate that walked a data structure looked at that field. Corrected to the
  // header line with the readings named as a bare range, which is what the
  // form means.
  //
  // Planted: one citation's line number advanced by one. Went red naming the
  // file, the line and the identifier.
  it('names an identifier only at a line that carries it', () => {
    const files = [
      'src/frontline/modules/fl-b10/charter.ts',
      'src/frontline/modules/fl-b10/matrix.ts',
      'src/frontline/modules/fl-b10/service.ts',
      'src/frontline/modules/fl-b10/NotificationsInboxView.tsx',
    ]
    const offenders: string[] = []
    let checked = 0
    for (const rel of files) {
      const text = readFileSync(join(process.cwd(), rel), 'utf8')
      for (const m of text.matchAll(/\b([A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+)\s*·\s*L(\d{3,6})/g)) {
        checked += 1
        const [, ident, n] = m
        if (!srcLine(Number(n)).includes(ident as string)) {
          offenders.push(`${rel}: ${ident} is not at L${n}`)
        }
      }
    }
    expect(checked, 'the sweep found citations to check').toBeGreaterThan(30)
    expect(offenders).toEqual([])
  })

  // FAILS IF: any bare line number this module writes points outside the
  // source or at a blank line. A blank line states nothing, so a citation of
  // one is always wrong — the off-by-one class `locator-fidelity` exists for.
  // Planted: a card field's sourceRef changed to the blank line above its own.
  it('cites no blank line and no line outside the source', () => {
    const files = [
      'src/frontline/modules/fl-b10/charter.ts',
      'src/frontline/modules/fl-b10/matrix.ts',
      'src/frontline/modules/fl-b10/service.ts',
      'src/frontline/modules/fl-b10/NotificationsInboxView.tsx',
    ]
    const offenders: string[] = []
    let checked = 0
    for (const rel of files) {
      const text = readFileSync(join(process.cwd(), rel), 'utf8')
      for (const m of text.matchAll(/(?<![A-Za-z0-9-])L(\d{3,6})\b/g)) {
        checked += 1
        const n = Number(m[1])
        if (n < 1 || n > LINES.length || srcLine(n).trim() === '') {
          offenders.push(`${rel}: L${n}`)
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
    expect(offenders).toEqual([])
  })
})

/* ==================================================================== *
 * WHAT NOTHING IN THIS MODULE MAY CONTAIN.
 * ==================================================================== */

describe('what nothing in this module may contain', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking reaches
  // this module's rendered text. AC-FL-000-5 (L39100), TEST-FL-000-3 (L39108),
  // AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683).
  //
  // Planted three times, because pluralisation is how this gate dies:
  // "countdown" in the change-notice prose, "timer" in a card field, and
  // "rankings" in an acceptance criterion. All three went red naming the
  // field — the third is the one a `\branking\b` pattern would have passed.
  it('carries no pace, timing, countdown or ranking word in any rendered string', () => {
    const FORBIDDEN = /\b(pace|timers?|countdowns?|rankings?|leaderboards?|productivity)\b/i
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(120)
    const offenders = strings.filter((s) => FORBIDDEN.test(s.text))
    expect(offenders.map((o) => `${o.where}: ${o.text.slice(0, 60)}`)).toEqual([])
    // the criteria this gate answers to, read rather than cited blind
    expect(srcLine(39100)).toContain('AC-FL-000-5')
    expect(srcLine(48690)).toContain('AC-SCR-FL-002')
  })

  // FAILS IF: the word "synced" is written as a state anywhere in this module.
  // L39622 says there is no such state and no bare success, and this module's
  // card says it "carries the honest sync-status detail" — which is the phrase
  // most likely to grow a label. Planted: an inbox item subject changed to
  // "Synced 14:32". Went red naming the item.
  it('never writes synced as a state', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\bsynced\b/i)
    }
    expect(norm(srcLine(39622))).toContain(norm('there is no single state called "synced"'))
  })

  // FAILS IF: the build plan's rigour grade reaches the module. The dispatch
  // grades this module C1; the frozen source's own module-inventory column is
  // Band (header L39844) and this module's row (L39855) reads B. Neither is
  // rendered as a product fact. Planted: `grade: 'C1'` added to a card field
  // and rendered. Went red.
  it('transcribes no build-plan grade, and states the source’s own band nowhere', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\b(C1|C2)\b/)
    }
    expect(tableCells(39844).slice(1, 5)).toEqual([
      'Identifier',
      'Module',
      'Band',
      'One-line scope',
    ])
    expect(tableCells(39855)[1]).toBe('`MOD-FL-B10`')
    expect(tableCells(39855)[3]).toBe('B')
  })

  // FAILS IF: a channel the source does not carry is named as available, or a
  // quiet-hours affordance is described as existing. The V1 channels are
  // in-app and email; the five excluded things are named at L41798 and again
  // at L41865. Planted: "webhooks" added to the inbox disclaimer as an
  // available channel. Went red.
  it('names no channel outside in-application and email as available here', () => {
    const EXCLUDED = /\b(Short Message Service|webhook|webhooks|quiet hours)\b/i
    const AVAILABLE = /\b(available|offered|configurable|supported|enabled)\b/i
    for (const s of renderedStrings()) {
      if (!EXCLUDED.test(s.text)) continue
      // the excluded five may only be named as excluded, never as present
      expect(
        AVAILABLE.test(s.text),
        `${s.where} names an excluded channel as available: ${s.text.slice(0, 80)}`,
      ).toBe(false)
    }
    expect(srcLine(41798)).toContain('outside V1')
    expect(srcLine(41865)).toContain('Restrict channels to in-application and email')
  })
})

/* ==================================================================== *
 * THE COLUMN TYPE.
 * ==================================================================== */

describe('the five persona columns', () => {
  // FAILS IF: a column becomes a private twelfth spelling of the platform's
  // five tenant roles. They are an `Extract` from `RoleId`, so a rename over
  // there fails to compile here rather than splitting the vocabulary.
  // Planted: 'READONLY_AUDITOR' replaced with 'AUDITOR'. Typecheck refused it,
  // and this went red on the heading map.
  it('are five members of the platform role union, in the header’s order', () => {
    const columns: readonly FlB10Column[] = FL_B10_COLUMNS
    expect(columns).toHaveLength(5)
    expect(Object.keys(FL_B10_COLUMN_HEADINGS)).toEqual([...FL_B10_COLUMNS])
    expect(FL_B10_COLUMNS.map((c) => FL_B10_COLUMN_HEADINGS[c])).toEqual([
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
  })

  // FAILS IF: `b10Row` starts answering for a row id it does not hold, which
  // is what a silent `find` returning undefined looks like downstream.
  // Planted: the throw replaced with a `?? FL_B10_MATRIX[0]` fallback.
  it('refuses a row id this matrix does not hold', () => {
    expect(() => b10Row('not-a-row' as never)).toThrow(/no matrix row/)
    expect(() => triggerRow('not-a-trigger' as never)).toThrow(/no notification trigger/)
  })
})

/* ==================================================================== *
 * THE OFFLINE POSITION.
 * ==================================================================== */

describe('the offline position', () => {
  // FAILS IF: the offline statement loses the clause that forbids implying
  // arrival. The shared treatment says nothing implies the platform knows
  // about this device; this module's card additionally forbids implying
  // anything arrived, and only the second one is about notifications.
  // Planted: the statement replaced with the shared treatment's reason, which
  // is a real sentence from wave 0 and reads correct. Went red.
  it('carries the card’s own offline clause, not only wave 0’s treatment', () => {
    expect(norm(srcLine(41821))).toContain(norm(B10_OFFLINE_STATEMENT.text))
    expect(B10_OFFLINE_STATEMENT.text).toContain('no surface may imply one has')
    const dest = FL_DESTINATIONS.find((d) => d.slug === 'notifications-and-sync-inbox')
    expect(dest?.offline).toBe('cachedReadOnlyOffline')
  })
})

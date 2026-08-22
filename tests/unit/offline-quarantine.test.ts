import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import {
  CANCELLATION_TERMINAL_STATES,
  ENVELOPE_STEP_ANACHRONISM,
  PROTOCOL_STEPS_CITED_DIRECTLY,
  QUARANTINE_COLUMNS,
  QUARANTINE_LOCATORS,
  QUARANTINE_REGISTER,
  QUARANTINE_TERMINAL_STATES,
  STEPS_ABSENT_FROM_THE_DIAGRAM,
  cancel,
  closeQuarantine,
  openQuarantine,
  quarantineReason,
} from '@/offline/quarantine'

/**
 * THE FROZEN SOURCE IS THE GROUND TRUTH, not the constant under test. Every
 * table check below re-reads and re-splits L80389-L80398 at test time and
 * compares the shipped rows against what it found there. Editing a cell in
 * `@/offline/quarantine` turns this red, because the source still says the old
 * thing — which a `toEqual([...QUARANTINE_REGISTER])` could never do.
 *
 * EVERY LINE NUMBER THE MODULE CLAIMS IS OPENED HERE, and it is opened from
 * the module's own field rather than from a constant retyped in this file. So
 * the step ledger's lines, the anachronism's three locators and the four in
 * `QUARANTINE_LOCATORS` are all falsifiable: change one in the module and the
 * words that line carries stop matching.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** A markdown table row split header-keyed by position, never guessed. */
const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

/** One cell by its column index in the header, never `undefined` in a check. */
const cell = (n: number, column: number): string => cellsOf(n)[column] ?? ''

/** The line a `L<n>` locator string names. */
const lineOf = (locator: string): number => Number(/L(\d+)/.exec(locator)?.[1] ?? 0)

const REGISTER_FIRST_ROW = 80389
const REGISTER_LAST_ROW = 80398

/** The diagram line restating the detecting steps. */
const DIAGRAM_STEPS_LINE = 80417

describe('the quarantine register, against the frozen source', () => {
  it('the header this build transcribed carries the four columns, in order', () => {
    // The header line comes from the module, so a wrong locator there is red.
    expect(cellsOf(QUARANTINE_LOCATORS.registerHeader)).toEqual([...QUARANTINE_COLUMNS])
    expect(cellsOf(QUARANTINE_LOCATORS.registerHeader)).toEqual([
      'Reason',
      'Detected at step',
      'Owner of the resolution',
      'Status',
    ])
  })

  it('the body is ten data rows and the separator is not one of them', () => {
    // `|---|---|` splits into non-empty cells, so a naive body scan counts it.
    // It is excluded by construction: the separator sits at header + 1 and the
    // first data row is the line after it.
    const header = QUARANTINE_LOCATORS.registerHeader
    expect(sourceLine(header + 1)).toMatch(/^\|(?:---\|){4}$/)
    expect(REGISTER_FIRST_ROW).toBe(header + 2)
    expect(REGISTER_LAST_ROW - REGISTER_FIRST_ROW + 1).toBe(10)
    expect(QUARANTINE_REGISTER).toHaveLength(10)
    // The line after the last is prose, so the table really ends where the
    // transcription stops.
    expect(sourceLine(REGISTER_LAST_ROW + 1).startsWith('|')).toBe(false)
    for (let n = REGISTER_FIRST_ROW; n <= REGISTER_LAST_ROW; n += 1) {
      expect(cellsOf(n)).toHaveLength(4)
    }
  })

  it('every shipped row matches its source line cell for cell', () => {
    expect(QUARANTINE_REGISTER.map((r) => r.line)).toEqual([
      80389, 80390, 80391, 80392, 80393, 80394, 80395, 80396, 80397, 80398,
    ])
    for (const shipped of QUARANTINE_REGISTER) {
      expect(QUARANTINE_COLUMNS.map((c) => shipped.cells[c])).toEqual(cellsOf(shipped.line))
    }
  })

  it('the ten keys are minted by this build, distinct, and in source order', () => {
    const ids = QUARANTINE_REGISTER.map((r) => r.id)
    expect(new Set(ids).size).toBe(10)
    const lines = QUARANTINE_REGISTER.map((r) => r.line)
    expect(lines).toEqual([...lines].sort((a, b) => a - b))
    // Deliberately NOT in the document identifier shape, so nothing reads one
    // as a frozen-source anchor.
    for (const id of ids) expect(id).not.toMatch(/^[A-Z]{2,4}(?:-[A-Z0-9]+)+$/)
  })

  it('detectedAtSteps holds every number the source cell holds, and only those', () => {
    for (const shipped of QUARANTINE_REGISTER) {
      const fromSource = [...cell(shipped.line, 1).matchAll(/\d+/g)].map((m) => Number(m[0]))
      expect(shipped.detectedAtSteps).toEqual(fromSource)
    }
    // L80390 is the row that makes this a list rather than a number, and the
    // reason a single-digit parse would go unnoticed on the other nine.
    expect(quarantineReason('duplicate-identifier').detectedAtSteps).toEqual([17, 18])
  })
})

describe('the step ledger, every line opened', () => {
  it('each cited step line really carries the words the ledger claims for it', () => {
    for (const [key, cited] of Object.entries(PROTOCOL_STEPS_CITED_DIRECTLY)) {
      expect(sourceLine(cited.line), key).toContain(cited.what)
    }
  })

  it('the five steps are the five numbers the source gives them', () => {
    expect(PROTOCOL_STEPS_CITED_DIRECTLY['stop-class command manifest read'].step).toBe(21)
    expect(PROTOCOL_STEPS_CITED_DIRECTLY['captures upload'].step).toBe(22)
    expect(PROTOCOL_STEPS_CITED_DIRECTLY['revalidation on release'].step).toBe(19)
    expect(PROTOCOL_STEPS_CITED_DIRECTLY['expired command'].step).toBe(26)
    expect(PROTOCOL_STEPS_CITED_DIRECTLY['stale intelligence request'].step).toBe(27)
    // The numbers those lines state in words, which the `what` check alone
    // does not pin for the two that share a line.
    expect(sourceLine(PROTOCOL_STEPS_CITED_DIRECTLY['revalidation on release'].line)).toContain(
      're-runs validation from step 19 onward',
    )
    expect(sourceLine(PROTOCOL_STEPS_CITED_DIRECTLY['expired command'].line)).toContain(
      'Step 26 cancels expired commands and step 27 cancels stale artificial-intelligence requests.',
    )
  })
})

describe('the step-21 attribution, which precedes its own evidence', () => {
  it('the register locator points at the row, and that row says 21', () => {
    const row = lineOf(ENVELOPE_STEP_ANACHRONISM.registerLocator)
    expect(cell(row, 0)).toBe('Envelope incompleteness, for example a missing worker identity')
    expect(cell(row, 1)).toBe('21')
    expect(ENVELOPE_STEP_ANACHRONISM.registerSaysStep).toBe(Number(cell(row, 1)))
  })

  it('step 21 reads the command manifest and no capture has left the device', () => {
    const text = sourceLine(PROTOCOL_STEPS_CITED_DIRECTLY['stop-class command manifest read'].line)
    expect(text).toContain('the command manifest is read and the stop class is applied')
    expect(text).toContain('before any capture leaves the device')
    // The upload is NOT here, matched on the source's own wording for the
    // upload pass, which belongs to step 22 alone.
    expect(text).not.toContain('the captures upload')
  })

  it('the envelope the row names arrives at step 22, one step later', () => {
    const text = sourceLine(lineOf(ENVELOPE_STEP_ANACHRONISM.subjectLocator))
    expect(text).toContain('the captures upload')
    expect(text).toContain('Pass two drains the durable queue in full')
    // The row's example field, enumerated in step 22's own envelope list.
    expect(text).toContain('the worker identity plus any authorising second identity')
    expect(ENVELOPE_STEP_ANACHRONISM.subjectArrivesAtStep).toBe(
      PROTOCOL_STEPS_CITED_DIRECTLY['captures upload'].step,
    )
  })

  it('the detection therefore precedes its evidence, and is recorded uncorrected', () => {
    expect(ENVELOPE_STEP_ANACHRONISM.registerSaysStep).toBeLessThan(
      ENVELOPE_STEP_ANACHRONISM.subjectArrivesAtStep,
    )
    expect(ENVELOPE_STEP_ANACHRONISM.corrected).toBe(false)
    // The register still ships the source's number. A build that quietly moved
    // the row to 22 fails here AND on the cell-for-cell check.
    expect(quarantineReason('envelope-incompleteness').detectedAtSteps).toEqual([21])
    expect(ENVELOPE_STEP_ANACHRONISM.statement).toContain('precedes its own evidence')
  })

  it('step 21 is asserted twice, so it is not a typo in one cell', () => {
    expect(sourceLine(lineOf(ENVELOPE_STEP_ANACHRONISM.restatedAt))).toContain(
      'Validation returns non acceptance at step 16, 17, 18, 20, 21, 24, 28 or 32',
    )
    expect(lineOf(ENVELOPE_STEP_ANACHRONISM.restatedAt)).toBe(DIAGRAM_STEPS_LINE)
  })

  it('the diagram omits step 4, which the register uses', () => {
    const inDiagram = new Set(
      [...sourceLine(DIAGRAM_STEPS_LINE).matchAll(/\d+/g)].map((m) => Number(m[0])),
    )
    const inRegister = new Set(QUARANTINE_REGISTER.flatMap((r) => r.detectedAtSteps))
    expect([...inRegister].sort((a, b) => a - b)).toEqual([4, 16, 17, 18, 20, 21, 24, 28, 32])
    expect(inDiagram.size).toBe(8)
    const missing = [...inRegister].filter((s) => !inDiagram.has(s)).sort((a, b) => a - b)
    expect(missing).toEqual([...STEPS_ABSENT_FROM_THE_DIAGRAM])
    expect(missing).toEqual([4])
  })
})

describe('the record, which is not a failed write', () => {
  const input = {
    reason: 'missing-causal-parent' as const,
    arrivalSession: 'SESSION-2026-08-14-A',
    retained: { workerIdentity: null },
  }

  it('an audited write yields a record carrying the register owner verbatim', () => {
    expect(sourceLine(QUARANTINE_LOCATORS.auditGate)).toContain(
      'An audit entry is committed in the same transaction as the quarantine write',
    )
    const written = openQuarantine({ ...input, auditCommitted: true })
    expect(written.written).toBe(true)
    if (!written.written) throw new Error('unreachable')
    // The owner is the ROLE the register names, read off the source line
    // rather than out of the module.
    expect(written.record.owner).toBe(cell(80391, 2))
    expect(written.record.detectedAtSteps).toEqual([20])
    expect(written.record.arrivalSession).toBe('SESSION-2026-08-14-A')
    expect(written.record.retained).toBe(input.retained)
    expect(written.record.closure).toBeNull()
  })

  it('without its audit entry there is no record, and nothing is discarded', () => {
    expect(sourceLine(QUARANTINE_LOCATORS.refusalDisposition)).toContain(
      'it stays queued on the device, which is the safest place for it',
    )
    const refused = openQuarantine({ ...input, auditCommitted: false })
    expect(refused.written).toBe(false)
    if (refused.written) throw new Error('unreachable')
    expect(refused.disposition).toBe('stays queued on the device')
    // The refusal branch carries no record at all, so there is nothing a
    // caller could read past the discriminant.
    expect(Object.hasOwn(refused, 'record')).toBe(false)
  })

  it('the two terminal states are the diagram two, and a closure needs its note', () => {
    expect(sourceLine(QUARANTINE_LOCATORS.terminalStates)).toContain(
      'two distinct terminal states — permanent quarantine and dead letter',
    )
    expect([...QUARANTINE_TERMINAL_STATES]).toEqual(['permanent quarantine', 'dead letter'])
    const written = openQuarantine({ ...input, auditCommitted: true })
    if (!written.written) throw new Error('unreachable')
    expect(closeQuarantine(written.record, 'permanent quarantine', '')).toBeNull()
    // Whitespace is not a note. An `=== ''` guard passes this one.
    expect(closeQuarantine(written.record, 'permanent quarantine', '   \t ')).toBeNull()
    const closed = closeQuarantine(
      written.record,
      'dead letter',
      'Unit Execution lost to device fault; readings retained, not counted.',
    )
    expect(closed?.closure?.state).toBe('dead letter')
    expect(closed?.closure?.note).toContain('readings retained')
    // Closing returns a new record; the held one is untouched.
    expect(written.record.closure).toBeNull()
  })

  it('the module exports no path that removes a record, for any role', () => {
    const moduleText = readFileSync(join(process.cwd(), 'src', 'offline', 'quarantine.ts'), 'utf8')
    const exported = [
      ...moduleText.matchAll(/^export (?:function|const|type|interface) (\w+)/gm),
    ].map((m) => m[1] ?? '')
    // The scan found the real export list rather than an empty one.
    expect(exported).toContain('openQuarantine')
    expect(exported.length).toBeGreaterThan(10)
    expect(exported.filter((n) => /delete|purge|remove|drop|discard|expunge/i.test(n))).toEqual([])
  })
})

describe('cancellation, the companion mechanism', () => {
  it('a cancellation record carries the step its kind belongs to', () => {
    expect(cancel('expired command', 'cancelled', 'clearance window already spent')).toEqual({
      kind: 'expired command',
      atStep: 26,
      terminalState: 'cancelled',
      reason: 'clearance window already spent',
    })
    expect(
      cancel('stale intelligence request', 'superseded', 'containment record already written')
        .atStep,
    ).toBe(27)
  })

  it('cancelled and superseded are distinct, both real command states, neither a failure', () => {
    expect(sourceLine(PROTOCOL_STEPS_CITED_DIRECTLY['expired command'].line)).toContain(
      'Cancelled and superseded are distinct command states; both are audited; neither is a failure.',
    )
    expect([...CANCELLATION_TERMINAL_STATES]).toEqual(['cancelled', 'superseded'])
    expect(new Set(CANCELLATION_TERMINAL_STATES).size).toBe(2)
    // Narrowed from the fifteen already settled, not respelled beside them.
    for (const state of CANCELLATION_TERMINAL_STATES) {
      expect(COMMAND_STATES).toContain(state)
    }
    for (const notACancellation of ['failed', 'rejected', 'expired'] as const) {
      expect([...CANCELLATION_TERMINAL_STATES]).not.toContain(notACancellation)
    }
  })
})

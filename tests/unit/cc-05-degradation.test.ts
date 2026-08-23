import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AI_ABILITY_REGISTER, abilityAttribute, aiAbility } from '@/ai/abilities/register'
import { AI_MODE_IDS, aiMode, type AiModeId } from '@/ai/modes'
import { matrixCellProvenance } from '@/ai/agents/contracts'
import { PROVENANCE_CLASS_IDS } from '@/ai/provenance/classes'
import { cellFromSource } from '@/policy/columns'
import { CC_DECISION_REGISTER } from '@/surfaces/cc/decisions/register'
import {
  CC05_AGENT_CONTRACT,
  CC05_AI07,
  CC05_AI07_ATTRIBUTES,
  CC05_GATE_DECISION_ROW,
  CC05_PERSISTENCE_PROVENANCE,
  CC05_PROPOSING_AGENT,
  CC05_STATE_PROVENANCE,
  cc05DegradationFold,
  cc05EmptyQueueReading,
  cc05InvocationReading,
  cc05NewItemsArise,
  cc05PendingStandingUnder,
} from '@/surfaces/cc/modules/cc-05/degradation'
import { CC05_NOT_DECIDABLE_ITEM, CC05_STORYBOARD_ITEM } from '@/surfaces/cc/modules/cc-05/queue'

/**
 * `MOD-CC-05` UNDER ARTIFICIAL-INTELLIGENCE DEGRADATION, GATED AGAINST THE
 * FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME, and
 * no count below is taken from the array under test. The sixteen modes are
 * walked out of the operating-mode matrix's own rows; the ability attributes
 * are re-parsed out of `AI-07`'s paragraph; the two sentences that decide this
 * overlay are located by their own words rather than by a line this task
 * wrote down.
 *
 * ── THE VACUITY THIS SUITE HAD TO AVOID ──────────────────────────────────
 *
 * The fold is BUILT from `AI_MODE_IDS`, so "the fold covers every mode" is a
 * claim about itself and can only ever pass — this build's ninth defect shape.
 * The mode identifiers the fold is checked against are therefore read out of
 * the frozen matrix rows, so a mode the source carries and the vocabulary has
 * lost fails here.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')
const unticked = (s: string): string => s.replaceAll('`', '')

function cells(line: string): string[] {
  return line
    .trim()
    .split('|')
    .slice(1, -1)
    .map((c) => unticked(c).trim())
}

/**
 * The data rows of the table whose separator is at `separatorLine`, counted
 * off the SOURCE. Starts after the separator, so the separator can never be
 * counted as data, and stops at the first line that is not a table row.
 */
function dataRows(separatorLine: number): { line: number; cells: string[] }[] {
  const out: { line: number; cells: string[] }[] = []
  for (let n = separatorLine + 1; isTableRow(srcLine(n)); n += 1) {
    out.push({ line: n, cells: cells(srcLine(n)) })
  }
  return out
}

function columnIndex(headerLine: number, name: string): number {
  const i = cells(srcLine(headerLine)).indexOf(name)
  if (i < 0) {
    throw new Error(
      `L${headerLine} has no column named "${name}". Its columns are ` +
        `${JSON.stringify(cells(srcLine(headerLine)))}.`,
    )
  }
  return i
}

/** Section 42.3's operating-mode contract matrix. Header, then separator. */
const MODE_HEADER = 89354
const MODE_SEPARATOR = 89355

/** `AI-07`'s paragraph in the §40.16 ability register. */
const AI07_LINE = 87934

/** §21.8's two behaviour paragraphs, and the emergency-pause diagram nodes. */
const AI_BEHAVIOUR = 37165
const NO_AI_BEHAVIOUR = 37167
const PAUSE_STOP_NEW_ACTIVATIONS = 87834
const PAUSE_KEEP_GATE_ITEMS = 87839

const MODE_ROWS = dataRows(MODE_SEPARATOR)
const MODE_ID_COLUMN = columnIndex(MODE_HEADER, 'Mode')
const INVOCATION_COLUMN = columnIndex(MODE_HEADER, 'Agent invocation')

/**
 * The Mode cell is the identifier followed by the mode's name — `AIMODE-01
 * Online and healthy` once the backticks are off — so the identifier is the
 * first token. Split rather than sliced, because the names differ in length.
 */
const modeIdOf = (row: { cells: string[] }): string =>
  (row.cells[MODE_ID_COLUMN] ?? '').split(' ')[0] ?? ''

/** The sixteen identifiers, read off the matrix rather than off the union. */
const MODE_IDS_FROM_SOURCE: string[] = MODE_ROWS.map(modeIdOf)

describe('the constraint is AI-07 and it is consumed, not re-transcribed', () => {
  // FAILS IF: this module quotes AI-07 out of its own file instead of reading
  // the register. The register's values are re-parsed off the frozen paragraph
  // here, so a second transcription anywhere in the chain shows up as a
  // mismatch rather than as two copies that happen to agree.
  it('every attribute this overlay consumes is the frozen paragraph’s own value', () => {
    const paragraph = srcLine(AI07_LINE)
    expect(paragraph).toContain('`AI-07`')
    for (const attribute of CC05_AI07_ATTRIBUTES) {
      expect(paragraph).toContain(`*${attribute.label}:* ${attribute.value}`)
    }
  })

  // FAILS IF: the overlay reaches for a different ability, or the register's
  // AI-07 record stops pointing at the paragraph it transcribes.
  it('is AI-07’s own record, at AI-07’s own line', () => {
    expect(CC05_AI07.id).toBe('AI-07')
    expect(CC05_AI07).toBe(aiAbility(AI_ABILITY_REGISTER, 'AI-07'))
    expect(CC05_AI07.sourceRef).toBe(`L${AI07_LINE}`)
  })

  // FAILS IF: the four attributes that decide this overlay stop being carried.
  // Named individually rather than counted, because a count is true of the
  // wrong four as well as of the right four.
  it('carries the human approval, the validation gate, the expiry and the safe stop', () => {
    const names = CC05_AI07_ATTRIBUTES.map((a) => a.attribute)
    expect(names).toContain('humanApproval')
    expect(names).toContain('validationGates')
    expect(names).toContain('expiry')
    expect(names).toContain('safeStop')
  })

  // FAILS IF: the never-expires rule is softened into an expiry anywhere in
  // the chain. This is the sentence that decides the empty state.
  it('the expiry attribute says the item never expires — it ages and re-routes', () => {
    const expiry = abilityAttribute(CC05_AI07, 'expiry')
    expect(srcLine(AI07_LINE)).toContain(`*Expiry:* ${expiry.value}`)
    expect(expiry.value).toContain('never expires')
    expect(expiry.value).toContain('re-routes')
  })
})

describe('the proposing agent is read from the roster, not named here', () => {
  // FAILS IF: the overlay invents an agent, or binds to one whose governance
  // is not a runtime human gate. AI-07 is human-gated where it proposes
  // beyond policy, and the roster row is where that binding lives.
  it('is the Deviation and Containment Agent, bound to a runtime human gate', () => {
    expect(CC05_PROPOSING_AGENT.id).toBe('deviation-and-containment')
    expect(CC05_PROPOSING_AGENT.governanceBinding).toBe('runtime human gate')
    expect(CC05_AGENT_CONTRACT.agentId).toBe(CC05_PROPOSING_AGENT.id)
  })
})

describe('whether a new gate item arises is derived, never hand-assigned', () => {
  // FAILS IF: a mode's answer stops tracking its own agent-invocation cell.
  // The expected value is recomputed from the FROZEN matrix cell through the
  // tree's own cell parser, so a hand-flipped boolean in the module cannot
  // agree with it.
  it('every mode’s answer follows its own agent-invocation cell in the source', () => {
    for (const row of MODE_ROWS) {
      const id = modeIdOf(row)
      const cell = row.cells[INVOCATION_COLUMN] ?? ''
      let expected: boolean
      try {
        const outcome = cellFromSource(cell).outcome
        expected = outcome === 'allowed' || outcome === 'allowedWithConditions'
      } catch {
        // The one value outside the nine tokens. L89279 answers it in the
        // source's own words rather than leaving it to this build.
        expected = false
      }
      expect(cc05NewItemsArise(id as AiModeId)).toBe(expected)
    }
  })

  // FAILS IF: the discriminator is written by hand rather than taken from the
  // parser's own refusal. Proved by ADDING the foreign value: the reading of
  // a mode whose cell the nine-token parser refuses must be the refusing arm,
  // and every mode whose cell it accepts must be the other arm.
  it('the reading’s arm is the parser’s own verdict on the cell', () => {
    for (const row of MODE_ROWS) {
      const id = modeIdOf(row) as AiModeId
      const cell = row.cells[INVOCATION_COLUMN] ?? ''
      let parses = true
      try {
        cellFromSource(cell)
      } catch {
        parses = false
      }
      expect(cc05InvocationReading(id).kind).toBe(parses ? 'nine-token' : 'outside-the-nine')
    }
  })

  // FAILS IF: the value outside the nine tokens is quietly folded into
  // `Explicitly prohibited`. It is a sixth value of this column's own and the
  // source answers it directly, so the refusing arm must carry that answer.
  it('the value outside the nine tokens keeps the source’s own reason', () => {
    const outside = AI_MODE_IDS.map((id) => cc05InvocationReading(id)).filter(
      (r) => r.kind === 'outside-the-nine',
    )
    expect(outside.length).toBeGreaterThan(0)
    for (const reading of outside) {
      if (reading.kind !== 'outside-the-nine') throw new Error('unreachable')
      expect(srcLine(reading.answerLine)).toContain(reading.answer)
    }
  })
})

describe('the pending item persists under every one of the sixteen modes', () => {
  // FAILS IF: the fold stops covering a mode the SOURCE carries. Checked
  // against the matrix's own identifiers rather than against `AI_MODE_IDS`,
  // which the fold is built from and so could only agree with.
  it('folds over exactly the modes the frozen matrix declares', () => {
    const folded = cc05DegradationFold(CC05_STORYBOARD_ITEM).map((r) => r.mode)
    expect(folded).toStrictEqual(MODE_IDS_FROM_SOURCE)
  })

  // FAILS IF: any failure state gains a path to a self-decision, a
  // disappearance or an expiry. Asserted per mode and by name, never by a
  // count of modes that behave.
  it('no mode lets the item self-approve, self-decline, expire or leave the queue', () => {
    for (const standing of cc05DegradationFold(CC05_STORYBOARD_ITEM)) {
      expect(standing.stillInQueue).toBe(true)
      expect(standing.selfApproved).toBe(false)
      expect(standing.selfDeclined).toBe(false)
      expect(standing.expired).toBe(false)
    }
  })

  // FAILS IF: a mode changes what the item's decision requires. The expected
  // strings are AI-07's own, so a softened wording on the screen cannot agree.
  it('the decision stays human, on AI-07’s own terms, under every mode', () => {
    const approval = abilityAttribute(CC05_AI07, 'humanApproval').value
    const expiry = abilityAttribute(CC05_AI07, 'expiry').value
    const safeStop = abilityAttribute(CC05_AI07, 'safeStop').value
    for (const standing of cc05DegradationFold(CC05_STORYBOARD_ITEM)) {
      expect(standing.humanApproval).toBe(approval)
      expect(standing.expiry).toBe(expiry)
      expect(standing.safeStop).toBe(safeStop)
    }
  })

  // FAILS IF: the mode is allowed to reach the decidability answer. An outage
  // that made a stuck item decidable, or a healthy mode that made a decidable
  // item stuck, would both be caught here: the same item is folded over all
  // sixteen and its decidability must not move.
  it('the mode never moves an item’s decidability', () => {
    for (const item of [CC05_STORYBOARD_ITEM, CC05_NOT_DECIDABLE_ITEM]) {
      const answers = cc05DegradationFold(item).map((s) => JSON.stringify(s.decidability))
      expect(new Set(answers).size).toBe(1)
    }
    const decidable = cc05PendingStandingUnder(CC05_STORYBOARD_ITEM, 'AIMODE-01')
    const stuck = cc05PendingStandingUnder(CC05_NOT_DECIDABLE_ITEM, 'AIMODE-01')
    expect(decidable.decidability).toStrictEqual({ decidable: true })
    expect(stuck.decidability.decidable).toBe(false)
  })

  // FAILS IF: the mode's own cells stop being carried through, so a screen
  // cannot say which state it is speaking about. Read off the vocabulary,
  // which the modes suite pins to the frozen rows.
  it('carries the mode’s own name and agent-invocation cell', () => {
    for (const standing of cc05DegradationFold(CC05_STORYBOARD_ITEM)) {
      const row = aiMode(standing.mode)
      expect(standing.modeName).toBe(row.name)
      expect(standing.agentInvocation).toBe(row.agentInvocation)
      expect(standing.deterministicSafety).toBe('Allowed')
    }
  })
})

describe('an empty queue is never a quiet floor', () => {
  // FAILS IF: the empty state stops distinguishing an unavailable agent from
  // a genuinely quiet one. Both arms are required to exist over the sixteen,
  // so a single hard-coded statement cannot pass.
  it('has both arms across the sixteen modes, each derived from item creation', () => {
    const kinds = AI_MODE_IDS.map((id) => cc05EmptyQueueReading(id).kind)
    expect(new Set(kinds)).toStrictEqual(new Set(['agents-unavailable', 'agents-active']))
    for (const id of AI_MODE_IDS) {
      expect(cc05EmptyQueueReading(id).kind).toBe(
        cc05NewItemsArise(id) ? 'agents-active' : 'agents-unavailable',
      )
    }
  })

  // FAILS IF: the statement stops naming the mode, so a reader cannot tell
  // which state the queue is empty under.
  it('names the mode it is speaking about', () => {
    for (const id of AI_MODE_IDS) {
      expect(cc05EmptyQueueReading(id).statement).toContain(aiMode(id).name)
    }
  })

  // FAILS IF: an empty queue is ever attributed to items expiring. AI-07's
  // own expiry value is the refusal, and it is quoted rather than paraphrased.
  it('refuses expiry as an explanation, in AI-07’s own words', () => {
    const expiry = abilityAttribute(CC05_AI07, 'expiry').value
    for (const id of AI_MODE_IDS) {
      expect(cc05EmptyQueueReading(id).statement).toContain(expiry)
    }
  })
})

describe('the two source sentences this overlay rests on are where it says', () => {
  // FAILS IF: a locator drifts. Each is located by the sentence's own words,
  // so a line number that moved is caught rather than assumed.
  it('§21.8’s artificial-intelligence paragraph names the three refusals', () => {
    const line = srcLine(AI_BEHAVIOUR)
    expect(line).toContain('**Artificial-intelligence behaviour.**')
    expect(line).toContain('they never decide them, never execute on timeout, and never self-approve')
  })

  it('§21.8’s no-artificial-intelligence paragraph rules the empty queue', () => {
    const line = srcLine(NO_AI_BEHAVIOUR)
    expect(line).toContain('**No-artificial-intelligence behaviour.**')
    expect(line).toContain('no new gate items arise')
    expect(line).toContain('Items already raised remain fully decidable, including during an emergency pause')
    expect(line).toContain('an empty queue is not misread as a quiet floor')
  })

  it('the emergency-pause diagram stops activations and keeps gate items', () => {
    expect(srcLine(PAUSE_STOP_NEW_ACTIVATIONS)).toContain('No new agent activations')
    expect(srcLine(PAUSE_KEEP_GATE_ITEMS)).toContain('Raised gate items stay human-decidable')
  })
})

describe('DEC-GATE-001 gets no fifth home', () => {
  // FAILS IF: this module writes its own reading of DEC-GATE-001. The row is
  // required to be the very object the surface register holds — identity, not
  // equality — so a copy with the same fields cannot pass.
  it('is the Command Center register’s own row, by identity', () => {
    const registered = CC_DECISION_REGISTER.find((r) => r.id === 'DEC-GATE-001')
    expect(CC05_GATE_DECISION_ROW).toBe(registered)
    expect(CC05_GATE_DECISION_ROW.whereItAppears).toContain('21.8')
  })
})

describe('the overlay’s provenance classes are resolved, not pinned', () => {
  // FAILS IF: a literal is written where the contract's own resolution
  // belongs. Both are compared against the classification tree's answer for
  // the facts, which is what the wave-0 contract module computes.
  it('are two distinct classes, both members of the six', () => {
    expect(PROVENANCE_CLASS_IDS).toContain(CC05_STATE_PROVENANCE)
    expect(PROVENANCE_CLASS_IDS).toContain(CC05_PERSISTENCE_PROVENANCE)
    expect(CC05_STATE_PROVENANCE).not.toBe(CC05_PERSISTENCE_PROVENANCE)
  })

  // FAILS IF: the persistence table is ever labelled live artificial
  // intelligence. It is a packaged value producing an outcome by comparison,
  // and the absolute rule in this slice forbids the other label in terms.
  it('the degraded state carries the class the agent contract already resolved', () => {
    expect(CC05_STATE_PROVENANCE).toBe(CC05_AGENT_CONTRACT.degradationStateProvenance)
  })

  // FAILS IF: the persistence table is ever labelled live artificial
  // intelligence. It is a packaged value producing an outcome by comparison,
  // and the absolute rule in this slice forbids the other label in terms.
  it('the persistence table is a deterministic rule and is never the live class', () => {
    expect(CC05_PERSISTENCE_PROVENANCE).toBe(matrixCellProvenance())
    expect(CC05_PERSISTENCE_PROVENANCE).not.toBe('PROV-1')
    expect(CC05_PERSISTENCE_PROVENANCE).not.toBe('PROV-2')
  })
})

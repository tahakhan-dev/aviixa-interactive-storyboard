import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PROVENANCE_CLASSES,
  PROVENANCE_CLASS_IDS,
  provenanceClass,
  type ProvenanceClassId,
} from '@/ai/provenance/classes'
import {
  contractPermits,
  resolveProvenance,
  type GuidanceElementFacts,
} from '@/ai/provenance/contract'
import { decisionRecord } from '@/disclosure/decisions'

/**
 * Slice 11, wave 0, task 2 — the provenance rendering contract.
 *
 * WHAT THIS FILE IS FOR. Not "six classes exist". Four claims that are each a
 * defect if they are wrong, and none of which a reader can check by looking:
 *
 *   1. THE TABLE IS TRANSCRIBED, NOT PARAPHRASED. Every one of the forty-two
 *      cells is re-read out of the frozen bytes at run time and compared to
 *      the record. A cell copied by hand into a record is a cell that has
 *      stopped agreeing with the source the moment either moves.
 *   2. THE ABSOLUTE RULE IS A MEASURED PROPERTY. Cached approved guidance and
 *      deterministic rules are never labelled live artificial intelligence.
 *      The "may be called live" column is read from the source, the count of
 *      `Allowed` cells is measured there, and the marker vocabulary is then
 *      checked against it — so the rule is enforced by the source's own
 *      column rather than by this build's opinion of it.
 *   3. DISJOINT IS ASSERTED, NOT INTENDED. Four properties, below.
 *   4. FAIL-CLOSED IS EXHAUSTIVE. `AC-42-403` is proved over the whole input
 *      space of the decision tree — ninety-six combinations — rather than on
 *      the one input a hand-written case would have chosen.
 *
 * AND ONE PIN THAT EXISTS BECAUSE THE BUILD ALREADY GOT IT WRONG ONCE. The
 * fail-closed rule is `AC-42-403`. The re-plan cited `AC-43-403`, which is a
 * different criterion in a different chapter about a different subject. Both
 * lines are pinned below by their own text, so the collision cannot be
 * re-introduced by anyone reading either number in isolation.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
/** One-based, so `LINES[n]` is the line a citation spelling `Ln` names. */
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim())

describe('the frozen source these assertions are read from', () => {
  it('is the blueprint this build was written against, byte for byte', () => {
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    expect(LINES.length - 1).toBe(122241)
  })
})

/* ── the contract table: counted, never inferred from a span ───────────── */

/**
 * The row indices are DERIVED here rather than written down. The dispatch
 * brief located the table's rows as "starting L89465"; L89465 is the header
 * and L89466 the separator, so the first data row is two lines below the
 * number given for it. The same slip is what put a four-agent roster inside a
 * three-row span in task 6. Deriving costs four lines and cannot be off.
 */
const HEADER_LINE = 89465
const FIRST_ROW = HEADER_LINE + 2
const rowLineNumbers: readonly number[] = (() => {
  const found: number[] = []
  for (let n = FIRST_ROW; L(n).startsWith('|'); n += 1) found.push(n)
  return found
})()

describe('the provenance rendering contract table', () => {
  it('has its header where the transcription says, and a separator under it', () => {
    expect(L(HEADER_LINE)).toBe(
      '| Class | May be called live | Carries model or agent identity | Carries content version | Carries human identity | Permitted while offline | Classification |',
    )
    expect(L(HEADER_LINE + 1)).toBe('|---|---|---|---|---|---|---|')
    // The caption sits TWO lines above the header, with a blank line between.
    // Pinned because an off-by-one locator for this table lands on the blank
    // line, and a citation of a blank line states nothing at all.
    expect(L(HEADER_LINE - 1)).toBe('')
    expect(L(HEADER_LINE - 2)).toBe('**Provenance rendering contract.**')
  })

  it('carries six data rows, counted to the line the body actually stops on', () => {
    expect(rowLineNumbers).toEqual([89467, 89468, 89469, 89470, 89471, 89472])
    // The row after the last is not a row. A span that included it would have
    // seven rows and no reader of the span would know.
    expect(L(89473)).toBe('')
  })

  it('has seven columns on every row, so no cell is silently absent', () => {
    for (const n of rowLineNumbers) {
      expect(cells(L(n)), `L${n}`).toHaveLength(7)
    }
  })

  it('is transcribed cell for cell into the class records', () => {
    expect(PROVENANCE_CLASSES).toHaveLength(rowLineNumbers.length)

    rowLineNumbers.forEach((n, index) => {
      const row = cells(L(n))
      const record = PROVENANCE_CLASSES[index]!
      expect(record.sourceRef, `L${n}`).toBe(`L${n}`)
      // Column 1 is `PROV-n` followed by the class name.
      expect(row[0], `L${n}`).toBe(`\`${record.id}\` ${record.name}`)
      expect(record.mayBeCalledLive, `L${n} col 2`).toBe(row[1])
      expect(record.carriesModelOrAgentIdentity, `L${n} col 3`).toBe(row[2])
      expect(record.carriesContentVersion, `L${n} col 4`).toBe(row[3])
      expect(record.carriesHumanIdentity, `L${n} col 5`).toBe(row[4])
      expect(record.permittedWhileOffline, `L${n} col 6`).toBe(row[5])
      expect(record.classification, `L${n} col 7`).toBe(row[6])
    })
  })

  it('registers the six classes as a literal list, in the source’s order', () => {
    // A LITERAL LIST, NOT A LENGTH. A length passes when a seventh class is
    // added and a real one is dropped; this does not, and the gate below
    // proves it by ADDING rather than by removing.
    expect(PROVENANCE_CLASS_IDS).toEqual(['PROV-1', 'PROV-2', 'PROV-3', 'PROV-4', 'PROV-5', 'PROV-6'])
    expect(PROVENANCE_CLASSES.map((c) => c.id)).toEqual([...PROVENANCE_CLASS_IDS])
    expect(rowLineNumbers.map((n) => cells(L(n))[0]!.match(/`(PROV-\d)`/)![1]!)).toEqual([
      ...PROVENANCE_CLASS_IDS,
    ])
    for (const id of PROVENANCE_CLASS_IDS) expect(provenanceClass(id).id).toBe(id)
  })
})

/* ── the absolute rule ─────────────────────────────────────────────────── */

describe('the absolute rule: cached guidance and rules are never called live', () => {
  /**
   * THE RULE HAS ITS OWN LINE, AND NEITHER BRIEF GAVE IT. Both dispatches
   * stated the rule and cited the table for it. It is stated outright at
   * L89439, above the tree, and the sentence names the two classes, the three
   * scopes it holds under, and why it is not a style preference. Pinned here
   * so the strongest statement of the rule in the source is the one the build
   * is checked against, rather than a column read as though it implied it.
   */
  it('is stated outright at L89439, and names its own scope', () => {
    expect(L(89439)).toContain(
      'Cached approved guidance (`PROV-3`) and deterministic rules (`PROV-4`) are never, on any surface, in any locale, under any failure condition, labelled or described as live artificial intelligence.',
    )
    expect(L(89439)).toContain('This is not a style preference.')
  })

  it('measures one Allowed cell in the live column, and it is PROV-1’s', () => {
    const liveColumn = rowLineNumbers.map((n) => cells(L(n))[1]!)
    expect(liveColumn.filter((cell) => cell === 'Allowed')).toHaveLength(1)
    expect(liveColumn[0]).toBe('Allowed')
    expect(liveColumn.slice(1)).toEqual([
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Explicitly prohibited',
      'Explicitly prohibited',
    ])
  })

  it('lets exactly the classes the column permits be called live', () => {
    const permitted = PROVENANCE_CLASS_IDS.filter((id) => contractPermits(id, 'mayBeCalledLive'))
    expect(permitted).toEqual(['PROV-1'])
  })

  /**
   * The rule as a RENDERING property rather than a data one. The word "live"
   * is the label the source forbids on five of the six classes, so it may
   * appear in exactly one marker and that marker must be the one class whose
   * cell reads `Allowed`.
   */
  it('spends the word "live" on one marker only', () => {
    const withLive = PROVENANCE_CLASSES.filter((c) => /\blive\b/i.test(c.markerText))
    expect(withLive.map((c) => c.id)).toEqual(['PROV-1'])
  })

  /**
   * `AC-42-402` (L89479) — no `PROV-3` or `PROV-4` element renders any string
   * carrying an artificial-intelligence attribution. Asserted over every
   * authored string on those two records, not only the marker, because the
   * criterion names strings, badges, icons and accessibility labels alike.
   *
   * ONE AUTHORED LOCALE, STATED. `TEST-42-402` asks for this against the
   * English and Spanish locale packs. This tree has no locale pack and no
   * runtime translation layer: every rendered string is authored once, in
   * English, in the record. So the sweep is over every string the record
   * holds, and the Spanish half is not claimed.
   */
  it('puts no artificial-intelligence attribution in PROV-3 or PROV-4 strings', () => {
    const attribution = /\bAI\b|artificial intelligence|\bagent\b|\bmodel\b|assistant/i
    for (const id of ['PROV-3', 'PROV-4'] as const) {
      const record = provenanceClass(id)
      for (const field of ['name', 'markerText', 'meaning'] as const) {
        expect(record[field], `${id}.${field}`).not.toMatch(attribution)
      }
      expect(contractPermits(id, 'carriesModelOrAgentIdentity')).toBe(false)
    }
  })
})

/* ── visually disjoint, as four asserted properties ────────────────────── */

/**
 * `SB-42-401` (L89459) requires the six treatments be visually disjoint —
 * "Six shapes, six meanings, no shared visual language between them." That is
 * an intention until it is written as a property, and this build targets WCAG
 * 2.2 AA, so a distinction carried by colour is not a distinction at all.
 *
 * The property, in four parts:
 *   1. the six marker texts are pairwise distinct;
 *   2. no marker text is a substring of another, so one cannot be misread as
 *      a truncation of another;
 *   3. each marker text carries at least one WORD that appears in no other
 *      marker text — the part that makes them distinguishable at a glance
 *      rather than merely unequal at the end;
 *   4. the marker text is the whole of the distinction — no record carries a
 *      colour, and the six are still distinct with every style stripped. The
 *      DOM half of (4) is asserted against real rendered output in
 *      `tests/component/provenance-mark.test.tsx`; this half asserts the data
 *      names no colour for a rendering path to reach for.
 */
describe('the six treatments are visually disjoint, asserted', () => {
  const normalise = (s: string): string => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const markers = PROVENANCE_CLASSES.map((c) => normalise(c.markerText))

  it('1. gives every class a marker text no other class shares', () => {
    expect(new Set(markers).size).toBe(PROVENANCE_CLASSES.length)
    expect(markers.every((m) => m.length > 0)).toBe(true)
  })

  it('2. lets no marker text be a substring of another', () => {
    for (const a of markers) {
      for (const b of markers) {
        if (a === b) continue
        expect(b.includes(a), `"${a}" is contained in "${b}"`).toBe(false)
      }
    }
  })

  it('3. gives every marker a word that occurs in no other marker', () => {
    const words = markers.map((m) => new Set(m.split(/[^a-z0-9-]+/).filter(Boolean)))
    words.forEach((own, index) => {
      const others = new Set(words.filter((_, i) => i !== index).flatMap((s) => [...s]))
      const unique = [...own].filter((w) => !others.has(w))
      expect(unique.length, `${PROVENANCE_CLASSES[index]!.id} shares every word it uses`)
        .toBeGreaterThan(0)
    })
  })

  it('4. names no colour anywhere in the class records', () => {
    // A colour named in the DATA is a colour a rendering path can carry the
    // whole distinction in. The records hold meaning; the stylesheet holds
    // appearance, and it cannot make a class identifiable on its own.
    const colour = /\b(red|green|amber|yellow|orange|blue|grey|gray|colour|color|#[0-9a-f]{3,8})\b/i
    for (const record of PROVENANCE_CLASSES) {
      for (const [key, value] of Object.entries(record)) {
        if (typeof value !== 'string') continue
        expect(value, `${record.id}.${key}`).not.toMatch(colour)
      }
    }
  })
})

/* ── the decision tree and AC-42-403 ───────────────────────────────────── */

describe('the classification decision tree', () => {
  it('is the tree the source draws, leaf for leaf', () => {
    // The mermaid leaves, pinned. Each names its class and what it must carry.
    expect(L(89446)).toContain('PROV-1 cloud artificial intelligence: label live')
    expect(L(89447)).toContain('PROV-2 validated on device artificial intelligence: label not live')
    expect(L(89449)).toContain('PROV-3 cached approved guidance: label approved and packaged')
    expect(L(89451)).toContain('PROV-4 deterministic rules: label rule')
    expect(L(89453)).toContain('PROV-5 manual human workflow: attribute to identity')
    expect(L(89454)).toContain('PROV-6 artificial intelligence unavailable: render the absence')
  })

  const base: GuidanceElementFacts = {
    producedByModelThisSession: null,
    approvedContentAuthoredAndReleasedEarlier: false,
    packagedValueProducingAnOutcomeByComparison: false,
    namedPersonDecidedOrInstructed: false,
    agentRunId: null,
    decisionRecordId: null,
  }
  const identified = { agentRunId: 'run-1', decisionRecordId: 'dr-1' }

  it('routes each leaf of the tree to its class', () => {
    expect(
      resolveProvenance({ ...base, ...identified, producedByModelThisSession: 'server side' }),
    ).toEqual({ classId: 'PROV-1', failedClosed: false })
    expect(resolveProvenance({ ...base, producedByModelThisSession: 'on device' })).toEqual({
      classId: 'PROV-2',
      failedClosed: false,
    })
    expect(
      resolveProvenance({ ...base, approvedContentAuthoredAndReleasedEarlier: true }),
    ).toEqual({ classId: 'PROV-3', failedClosed: false })
    expect(
      resolveProvenance({ ...base, packagedValueProducingAnOutcomeByComparison: true }),
    ).toEqual({ classId: 'PROV-4', failedClosed: false })
    expect(resolveProvenance({ ...base, namedPersonDecidedOrInstructed: true })).toEqual({
      classId: 'PROV-5',
      failedClosed: false,
    })
    expect(resolveProvenance(base)).toEqual({ classId: 'PROV-6', failedClosed: false })
  })

  it('never returns a class outside the six, on any input', () => {
    for (const facts of everyInput()) {
      expect(PROVENANCE_CLASS_IDS as readonly string[]).toContain(
        resolveProvenance(facts).classId,
      )
    }
  })
})

/**
 * `AC-42-403` (L89480) — an element classified `PROV-1` that cannot produce an
 * agent run identifier and a decision record fails closed to `PROV-6`.
 *
 * Proved over the WHOLE input space rather than on one hand-picked input: the
 * ninety-six combinations of the tree's four questions and the two
 * identifiers. A single-case test of a fail-closed rule proves the case it
 * chose, and the case it chose is the one the author already had in mind.
 */
function* everyInput(): Generator<GuidanceElementFacts> {
  const produced = ['server side', 'on device', null] as const
  for (const producedByModelThisSession of produced) {
    for (const approved of [true, false]) {
      for (const packaged of [true, false]) {
        for (const person of [true, false]) {
          for (const agentRunId of ['run-1', null]) {
            for (const decisionRecordId of ['dr-1', null]) {
              yield {
                producedByModelThisSession,
                approvedContentAuthoredAndReleasedEarlier: approved,
                packagedValueProducingAnOutcomeByComparison: packaged,
                namedPersonDecidedOrInstructed: person,
                agentRunId,
                decisionRecordId,
              }
            }
          }
        }
      }
    }
  }
}

describe('AC-42-403 — PROV-1 fails closed to PROV-6', () => {
  it('pins AC-42-403 to the line that carries it, and AC-43-403 to the line that does not', () => {
    // THE 42/43 COLLISION, PINNED FROM BOTH SIDES. Two criteria one digit
    // apart in one identifier, in two chapters, about two subjects. The
    // re-plan cited the second for the first. Whichever number a later reader
    // arrives with, one of these two assertions catches the swap.
    expect(L(89480)).toContain('`AC-42-403`')
    expect(L(89480)).toContain(
      'An element classified `PROV-1` that cannot produce an agent run identifier and a decision record fails closed to `PROV-6`.',
    )
    expect(L(91373)).toContain('`AC-43-403`')
    expect(L(91373)).toContain('Model quarantine, provider failover policy, and safe replay')
    expect(L(91373)).not.toContain('PROV-')
    expect(L(89480)).not.toContain('quarantine')
  })

  it('yields PROV-1 only when BOTH identifiers are present', () => {
    let prov1 = 0
    for (const facts of everyInput()) {
      const resolution = resolveProvenance(facts)
      if (resolution.classId !== 'PROV-1') continue
      prov1 += 1
      expect(facts.producedByModelThisSession).toBe('server side')
      expect(facts.agentRunId).not.toBeNull()
      expect(facts.decisionRecordId).not.toBeNull()
    }
    // NOT VACUOUS: the loop above passes on an empty set, so the set is
    // measured. Eight of the ninety-six inputs are server-side with both
    // identifiers (2 x 2 x 2 for the three questions below the model branch).
    expect(prov1).toBe(8)
  })

  it('downgrades every server-side element missing either identifier', () => {
    let downgraded = 0
    for (const facts of everyInput()) {
      const resolution = resolveProvenance(facts)
      if (!resolution.failedClosed) continue
      downgraded += 1
      expect(resolution.classId).toBe('PROV-6')
      expect(facts.producedByModelThisSession).toBe('server side')
      expect(facts.agentRunId === null || facts.decisionRecordId === null).toBe(true)
    }
    expect(downgraded).toBe(24)
  })

  it('never sets failedClosed on a class the rule does not govern', () => {
    for (const facts of everyInput()) {
      const resolution = resolveProvenance(facts)
      if (resolution.classId === 'PROV-6') continue
      expect(resolution.failedClosed).toBe(false)
    }
  })

  it('reaches all six classes across the input space, so no branch is dead', () => {
    const reached = new Set([...everyInput()].map((f) => resolveProvenance(f).classId))
    expect([...reached].sort()).toEqual([...PROVENANCE_CLASS_IDS])
  })
})

/* ── PROV-2 is an undecided class ──────────────────────────────────────── */

describe('PROV-2 renders as undecided, never as a working class', () => {
  it('reads Client Decision Required in the offline column of the source', () => {
    expect(cells(L(89468))[5]).toBe('Client Decision Required')
    expect(contractPermits('PROV-2', 'permittedWhileOffline')).toBe(false)
  })

  it('is the only class whose offline cell is undecided', () => {
    const undecided = rowLineNumbers.filter((n) => cells(L(n))[5] === 'Client Decision Required')
    expect(undecided).toEqual([89468])
  })

  it('cites the dual-identity pair through the canon, so both identifiers render', () => {
    const record = provenanceClass('PROV-2')
    expect(record.decisionRefs).toEqual(['DEC-ONDEVICE-001'])
    // Consumed, not restated. The canon holds the alias and every reading; a
    // second copy here is how two screens start disclosing one decision
    // differently.
    const canon = decisionRecord('DEC-ONDEVICE-001')
    expect(canon.alias).toBe('DEC-LOCALAI-001')
    expect(canon.readings.some((r) => r.locator.includes('DEC-LOCALAI-001'))).toBe(true)
  })

  it('classifies PROV-2 as a recommendation rather than a stated fact', () => {
    expect(provenanceClass('PROV-2').classification).toBe('`Recommendation — R&D`')
    // Every other class rests on a SoW Fact. If that stops being true the
    // undecided class has been quietly promoted or another demoted.
    const others = PROVENANCE_CLASSES.filter((c) => c.id !== 'PROV-2')
    for (const record of others) {
      expect(record.classification, record.id).toMatch(/^`SoW Fact/)
    }
  })
})

/* ── the contract columns drive rendering ──────────────────────────────── */

describe('contractPermits reads the source cell rather than a convention', () => {
  it('permits Allowed and Allowed-with-conditions, and nothing else', () => {
    expect(contractPermits('PROV-1', 'carriesModelOrAgentIdentity')).toBe(true)
    expect(contractPermits('PROV-1', 'carriesContentVersion')).toBe(true) // with conditions
    expect(contractPermits('PROV-3', 'carriesModelOrAgentIdentity')).toBe(false) // prohibited
    expect(contractPermits('PROV-5', 'carriesModelOrAgentIdentity')).toBe(false) // not applicable
    expect(contractPermits('PROV-6', 'carriesContentVersion')).toBe(false) // not applicable
    expect(contractPermits('PROV-2', 'permittedWhileOffline')).toBe(false) // undecided
  })

  it('refuses no class its human identity that the source allows one', () => {
    const allowed = PROVENANCE_CLASS_IDS.filter((id) => contractPermits(id, 'carriesHumanIdentity'))
    expect(allowed).toEqual(['PROV-3', 'PROV-5'])
  })

  /**
   * `PROV-1`'s offline cell reads `Unavailable`, which is the token slice 4
   * adjudicated as carrying two senses that render oppositely. That
   * adjudication is not re-litigated here. What is recorded is the per-cell
   * sense with its locator, so a reviewer can check it rather than infer it.
   */
  it('records the sense of PROV-1’s overloaded offline cell', () => {
    expect(cells(L(89467))[5]).toBe('Unavailable')
    expect(provenanceClass('PROV-1').permittedWhileOfflineSense).toContain('L89467')
    expect(contractPermits('PROV-1', 'permittedWhileOffline')).toBe(false)
  })
})

/* ── the treatments are the source's, verbatim ─────────────────────────── */

describe('the six treatments', () => {
  const treatments = new Map<ProvenanceClassId, string>(
    L(89459)
      .split(/(?=`PROV-[1-6]`)/)
      .slice(1)
      .map((segment) => [segment.slice(1, 7) as ProvenanceClassId, segment.trim()]),
  )

  it('are split out of SB-42-401 into six segments, one per class', () => {
    expect([...treatments.keys()]).toEqual([...PROVENANCE_CLASS_IDS])
    expect(L(89459)).toContain('Six shapes, six meanings, no shared visual language between them.')
  })

  it('are transcribed verbatim onto the records', () => {
    for (const record of PROVENANCE_CLASSES) {
      expect(treatments.get(record.id), record.id).toBe(record.treatment)
      expect(record.treatmentRef).toBe('L89459')
    }
  })
})

/* ── the failure paragraph the lint is designed from ───────────────────── */

describe('the failure and fallback paragraph', () => {
  it('names mislabelling as the failure and detection as twofold', () => {
    const paragraph = L(89474)
    expect(paragraph).toContain('The failure mode is mislabelling.')
    expect(paragraph).toContain(
      'a build-time lint asserting that every rendering path emits exactly one provenance class',
    )
    expect(paragraph).toContain(
      'a runtime assertion that a card carrying the agent badge has a non-null agent run identifier and decision record',
    )
    // The first fallback and the terminal safe state, pinned because the
    // rendering paths built on this contract must not invent a different one.
    expect(paragraph).toContain('degrade the claim, never the content')
    expect(paragraph).toContain('The terminal safe state is `PROV-4` plus `PROV-6`')
  })

  it('pins TEST-42-401 to the four surfaces the lint must cover', () => {
    expect(L(89485)).toContain('`TEST-42-401`')
    for (const surface of [
      'Frontline Worker Application',
      'Client Command Center',
      'Delivery Operations Hub',
      'Standards and Operations Studio',
    ]) {
      expect(L(89485)).toContain(surface)
    }
  })
})

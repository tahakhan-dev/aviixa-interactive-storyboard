import { describe, expect, it } from 'vitest'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { STORYBOARDS_01_TO_10 } from '@/ai/storyboards/sb-01-to-10'
import {
  SB_01_TO_10_CANON_BACKED_DECISIONS,
  SB_01_TO_10_LOCAL_DISCLOSURES,
} from '@/ai/storyboards/sb-01-to-10/decisions'

/**
 * Slice 11, wave 4, task 16 — every `DEC-*` these ten cards name, disclosed.
 *
 * §44A puts its decision identifiers INSIDE the transcribed field text, which
 * is where the source puts them: `DEC-AIRTO-001` is the entire content of every
 * card's `Recovery Time Objective and Recovery Point Objective` row. So the
 * gate that matters is not "is the list complete" — a list is complete against
 * itself — but "does every identifier the PROSE names have a disclosure". This
 * suite scans the ten cards' own strings and holds the answer against a literal
 * list.
 *
 * ── SEVEN OF THE ELEVEN ARE NOT MEMBERS OF THE EXPORTED UNION ──────────────
 * `src/disclosure/decisions.ts` is wave 5's and read-only to this task, and its
 * `DecisionId` union has no member for `DEC-AIRTO-001`, `DEC-NOSHIFT-001`,
 * `DEC-PLUS-001`, `DEC-SYNC-001`, `DEC-WIPE-001`, `DEC-ASK-001` or
 * `DEC-LOCALAI-001`. `decisionRecord` for any of them does not compile. Those
 * seven are disclosed locally, and their ABSENCE from the canon is asserted
 * here — so a later slice that lifts one turns this suite red and forces the
 * switch, rather than leaving the build with two spellings of one question.
 */

const DEC_TOKEN = /DEC-[A-Z]+-\d{3}/g

function everyDecisionTheCardsName(): readonly string[] {
  const found = new Set<string>()
  for (const card of STORYBOARDS_01_TO_10) {
    const strings = [
      ...Object.values(card.content),
      card.finalOfficialState.name,
      ...card.audit.map((event) => event.statement),
      ...Object.values(card.surfaces).map((effect) =>
        effect.kind === 'affected' ? effect.statement : effect.reason,
      ),
      card.absentCapability?.statement ?? '',
    ]
    for (const text of strings) {
      for (const match of text.matchAll(DEC_TOKEN)) found.add(match[0])
    }
  }
  return [...found].sort()
}

describe('the decisions these ten cards name', () => {
  it('is the eleven this task disclosed, and no twelfth travels undisclosed', () => {
    // A LITERAL LIST, not a count. Adding a `DEC-*` to any of the nineteen
    // rows of any of the ten cards without disclosing it turns this red.
    expect(everyDecisionTheCardsName()).toEqual([
      'DEC-AIRETRY-001',
      'DEC-AIRTO-001',
      'DEC-ASK-001',
      'DEC-LANEB-001',
      'DEC-LIB-001',
      'DEC-LOCALAI-001',
      'DEC-NOSHIFT-001',
      'DEC-PLUS-001',
      'DEC-SYNC-001',
      'DEC-WIDIFF-001',
      'DEC-WIPE-001',
    ])
  })

  it('splits into canon-backed and locally disclosed with nothing left over', () => {
    const disclosed = [
      ...SB_01_TO_10_CANON_BACKED_DECISIONS,
      ...SB_01_TO_10_LOCAL_DISCLOSURES.map((record) => record.decisionRef),
    ].sort()
    expect(disclosed).toEqual([...everyDecisionTheCardsName()])
  })
})

describe('the canon-backed four', () => {
  it('are members of the exported union, so the canon holds the record', () => {
    for (const id of SB_01_TO_10_CANON_BACKED_DECISIONS) {
      expect(OPEN_DECISION_IDS, id).toContain(id)
    }
  })

  it('are exactly these four, proved by adding rather than by counting', () => {
    expect([...SB_01_TO_10_CANON_BACKED_DECISIONS]).toEqual([
      'DEC-AIRETRY-001',
      'DEC-LANEB-001',
      'DEC-LIB-001',
      'DEC-WIDIFF-001',
    ])
  })
})

describe('the seven local disclosures', () => {
  it('are exactly these seven', () => {
    expect(SB_01_TO_10_LOCAL_DISCLOSURES.map((record) => record.decisionRef)).toEqual([
      'DEC-ASK-001',
      'DEC-LOCALAI-001',
      'DEC-AIRTO-001',
      'DEC-NOSHIFT-001',
      'DEC-PLUS-001',
      'DEC-SYNC-001',
      'DEC-WIPE-001',
    ])
  })

  it('name identifiers the exported union does not carry', () => {
    // The load-bearing half. If one of these becomes a union member, this goes
    // red and the local record must be retired in favour of the canon's.
    for (const record of SB_01_TO_10_LOCAL_DISCLOSURES) {
      expect(OPEN_DECISION_IDS as readonly string[], record.decisionRef).not.toContain(
        record.decisionRef,
      )
    }
  })

  it('disclose every reading with a locator, never only the one this build acted on', () => {
    for (const record of SB_01_TO_10_LOCAL_DISCLOSURES) {
      expect(record.question.trim(), record.decisionRef).not.toBe('')
      expect(record.readings.length, record.decisionRef).toBeGreaterThanOrEqual(2)
      for (const reading of record.readings) {
        expect(reading.text.trim(), record.decisionRef).not.toBe('')
        const line = /L(\d{4,6})/.exec(reading.locator)
        expect(line, `${record.decisionRef} ${reading.locator}`).not.toBeNull()
        expect(Number(line![1]), record.decisionRef).toBeLessThanOrEqual(122241)
      }
    }
  })

  it('says on the record that the canon has no member to point at', () => {
    for (const record of SB_01_TO_10_LOCAL_DISCLOSURES) {
      expect(record.canonNote, record.decisionRef).toContain('not a member of the exported union')
    }
  })

  it('names which of the ten cards carries each one', () => {
    for (const record of SB_01_TO_10_LOCAL_DISCLOSURES) {
      expect(record.namedBy.length, record.decisionRef).toBeGreaterThan(0)
      for (const identifier of record.namedBy) {
        const card = STORYBOARDS_01_TO_10.find((entry) => entry.identifier === identifier)
        expect(card, `${record.decisionRef} ${identifier}`).toBeDefined()
      }
    }
  })
})

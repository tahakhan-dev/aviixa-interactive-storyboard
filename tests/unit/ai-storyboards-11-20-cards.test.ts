import { describe, expect, it } from 'vitest'
import {
  STORYBOARD_CARD_FIELDS,
  STORYBOARD_CARD_HEADER_REFS,
  STORYBOARD_SURFACE_TABLE_REFS,
  storyboardCardRows,
  type Storyboard,
} from '@/ai/storyboards/contract'
import { storyboardViolations } from '@/ai/storyboards/invariants'
import { ownerAt, ownersOf } from '@/ai/fallbacks/registry'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { STORYBOARDS_11_TO_20 } from '@/ai/storyboards/sb-11-to-20'

/**
 * Slice 11, wave 4, task 17 — storyboards 44A.11 to 44A.20 as data.
 *
 * The shape, the invariants and the compound fallback key are task 15A's and
 * are imported, never re-declared. What this file proves is that the TEN CARDS
 * are the ten the source has, keyed to the owners the source registers, with
 * nineteen filled fields, five surface rows, and a final official state a
 * reader can actually rebuild from the audit events beside it.
 *
 * ── THE MEMBERSHIP GATE IS A LITERAL LIST, AND IT IS PROVED BY ADDING ──────
 * `EXPECTED` below is the ten storyboard numbers and their `SB-AI-NN`
 * identifiers, written out here rather than derived from the data under test.
 * A length assertion agrees with any substitution — 30 cards of the wrong ten
 * satisfy `toHaveLength(10)` — so the gate is a set comparison against a list
 * declared outside the module it polices. ADDING an eleventh member here, or
 * an eleventh card there, turns it red from either side.
 */

const EXPECTED = [
  { number: 11, identifier: 'SB-AI-11', fallback: 'FB-AI-11', chapter: '44A.11' },
  { number: 12, identifier: 'SB-AI-12', fallback: 'FB-AI-12', chapter: '44A.12' },
  { number: 13, identifier: 'SB-AI-13', fallback: 'FB-AI-13', chapter: '44A.13' },
  { number: 14, identifier: 'SB-AI-14', fallback: 'FB-AI-14', chapter: '44A.14' },
  { number: 15, identifier: 'SB-AI-15', fallback: 'FB-AI-15', chapter: '44A.15' },
  { number: 16, identifier: 'SB-AI-16', fallback: 'FB-AI-16', chapter: '44A.16' },
  { number: 17, identifier: 'SB-AI-17', fallback: 'FB-AI-17', chapter: '44A.17' },
  { number: 18, identifier: 'SB-AI-18', fallback: 'FB-AI-18', chapter: '44A.18' },
  { number: 19, identifier: 'SB-AI-19', fallback: 'FB-AI-19', chapter: '44A.19' },
  { number: 20, identifier: 'SB-AI-20', fallback: 'FB-AI-20', chapter: '44A.20' },
] as const

/**
 * The six literals in this task's range that name TWO contracts. Chapter
 * 40/41's register claims `FB-AI-11` through `FB-AI-16` for the agentic
 * layer's per-section contracts, and §44A claims the same six for storyboards
 * 11 to 16. Written out as a literal list so a collision quietly disappearing
 * from the registry is a red test rather than a silently narrower keyspace.
 */
const COLLIDING = [
  { storyboard: '44A.11', other: '40.11', literal: 'FB-AI-11' },
  { storyboard: '44A.12', other: '40.12', literal: 'FB-AI-12' },
  { storyboard: '44A.13', other: '40.13', literal: 'FB-AI-13' },
  { storyboard: '44A.14', other: '40.14', literal: 'FB-AI-14' },
  { storyboard: '44A.15', other: '40.15', literal: 'FB-AI-15' },
  { storyboard: '44A.16', other: '40.16', literal: 'FB-AI-16' },
] as const

function cardOf(number: number): Storyboard {
  const card = STORYBOARDS_11_TO_20.find((entry) => entry.number === number)
  if (card === undefined) throw new Error(`No card for storyboard ${number}.`)
  return card
}

describe('the ten cards this task owns', () => {
  it('is exactly the ten the source numbers 44A.11 to 44A.20', () => {
    expect(STORYBOARDS_11_TO_20.map((card) => card.number)).toEqual(
      EXPECTED.map((entry) => entry.number),
    )
  })

  it("carries each card's own identifier as its Identifier row names it", () => {
    expect(STORYBOARDS_11_TO_20.map((card) => card.identifier)).toEqual(
      EXPECTED.map((entry) => entry.identifier),
    )
  })

  it('cites the card header and surface table the contract pins for its number', () => {
    for (const entry of EXPECTED) {
      const card = cardOf(entry.number)
      expect(card.cardHeaderRef).toBe(STORYBOARD_CARD_HEADER_REFS[entry.number - 1])
      expect(card.surfaceTableRef).toBe(STORYBOARD_SURFACE_TABLE_REFS[entry.number - 1])
    }
  })
})

describe('the compound fallback key', () => {
  it('resolves every one of the ten to its §44A owner', () => {
    for (const entry of EXPECTED) {
      const card = cardOf(entry.number)
      expect(card.fallback).toEqual({ chapter: entry.chapter, identifier: entry.fallback })
      const owner = ownerAt(card.fallback.chapter, card.fallback.identifier)
      expect(owner).not.toBeNull()
      expect(owner!.chapter).toBe(entry.chapter)
    }
  })

  it('resolves a colliding literal to the storyboard contract and not the chapter-40 one', () => {
    for (const collision of COLLIDING) {
      const mine = ownerAt(collision.storyboard, collision.literal)
      const theirs = ownerAt(collision.other, collision.literal)
      expect(mine).not.toBeNull()
      expect(theirs).not.toBeNull()
      // The whole reason the key is compound: one literal, two contracts.
      expect(mine!.contract).not.toBe(theirs!.contract)
      expect(ownersOf(collision.literal).length).toBeGreaterThan(1)
    }
  })
})

describe('the nineteen fields', () => {
  it('fills every one of the nineteen on every card', () => {
    for (const card of STORYBOARDS_11_TO_20) {
      const rows = storyboardCardRows(card)
      expect(rows.map((row) => row.id)).toEqual(STORYBOARD_CARD_FIELDS.map((field) => field.id))
      for (const row of rows) {
        expect(row.content.trim(), `${card.identifier} · ${row.label}`).not.toBe('')
      }
    }
  })
})

describe('the five-surface reaction', () => {
  it('renders a statement or a reason for every surface, on every card', () => {
    for (const card of STORYBOARDS_11_TO_20) {
      for (const surface of JOURNEY_SURFACES) {
        const effect = card.surfaces[surface.code]
        const text = effect.kind === 'affected' ? effect.statement : effect.reason
        expect(text.trim(), `${card.identifier} · ${surface.name}`).not.toBe('')
        expect(effect.sourceRef, `${card.identifier} · ${surface.name}`).toMatch(/^L\d+$/)
      }
    }
  })
})

describe('AC-44A-004 — the final official state from the audit alone', () => {
  it('names the state and reconstructs it from audit events the log holds', () => {
    for (const card of STORYBOARDS_11_TO_20) {
      const ids = card.audit.map((event) => event.id)
      expect(new Set(ids).size, `${card.identifier} duplicate audit id`).toBe(ids.length)
      expect(card.finalOfficialState.name.trim()).not.toBe('')
      expect(card.finalOfficialState.derivedFrom.length).toBeGreaterThan(0)
      for (const id of card.finalOfficialState.derivedFrom) {
        expect(ids, `${card.identifier} derivedFrom ${id}`).toContain(id)
      }
    }
  })
})

describe("§44A's render-time prohibitions", () => {
  for (const entry of EXPECTED) {
    it(`holds for ${entry.identifier}`, () => {
      expect(storyboardViolations(cardOf(entry.number))).toEqual([])
    })
  }
})

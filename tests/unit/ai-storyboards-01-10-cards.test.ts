import { describe, expect, it } from 'vitest'
import {
  STORYBOARD_CARD_FIELDS,
  STORYBOARD_CARD_HEADER_REFS,
  STORYBOARD_SURFACE_TABLE_REFS,
} from '@/ai/storyboards/contract'
import { storyboardViolations } from '@/ai/storyboards/invariants'
import { ownerAt, ownersOf } from '@/ai/fallbacks/registry'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { STORYBOARDS_01_TO_10 } from '@/ai/storyboards/sb-01-to-10'

/**
 * Slice 11, wave 4, task 16 — storyboards 44A.1 to 44A.10, as data.
 *
 * Task 15A owns the shape, the compound fallback key and the nine render-time
 * invariants. This suite owns the ten cards' CONTENT and the four things that
 * can be wrong about content while the shape is perfectly legal:
 *
 *   - A FIELD FILLED WITH NOTHING. `StoryboardCardContent` is a mapped type,
 *     so `tsc` catches an absent field; it cannot catch an empty string, and
 *     a card renders every one of the nineteen rows whether or not the row
 *     says anything.
 *   - THE WRONG SIDE OF THE FB-AI COLLISION. Ten of this task's ten literals
 *     name a chapter-40 contract as well as a storyboard. A key resolving to
 *     the chapter-40 owner still resolves, and still renders a contract name
 *     that reads plausibly beside an offline worker.
 *   - A FINAL STATE THAT IS NOT RECONSTRUCTIBLE. `AC-44A-004` (L92749) is an
 *     assertion about what the data emits. The invariant module checks that
 *     the named events exist; this suite additionally checks that no card
 *     leans on the single-event minimum by accident.
 *   - A CARD PINNED TO ANOTHER CARD'S LOCATOR. The thirty header locators sit
 *     eighty-odd lines apart and every one of them is a plausible value for
 *     its neighbour, so each card's pair is checked against its own index in
 *     15A's lists rather than against the shape of a line number.
 *
 * The invariant run itself is one line per card, deliberately: the
 * interpretation of the six prohibitions is 15A's and this task adds none.
 */

describe('the ten cards of 44A.1 to 44A.10', () => {
  it('holds ten, numbered one to ten in order', () => {
    expect(STORYBOARDS_01_TO_10.map((card) => card.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })

  it('breaks none of the chapter\'s render-time invariants', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      expect(storyboardViolations(card), card.identifier).toEqual([])
    }
  })

  it('names each card by the identifier its own card row carries', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      expect(card.identifier).toBe(`SB-AI-${String(card.number).padStart(2, '0')}`)
      expect(card.content.identifier, card.identifier).toContain(card.identifier)
    }
  })

  it('fills all nineteen fields with something a reader can read', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      for (const field of STORYBOARD_CARD_FIELDS) {
        const content = card.content[field.id]
        expect(content.trim(), `${card.identifier} ${field.id}`).not.toBe('')
        // A row saying "n/a" is a row that stopped short of the reason. The
        // source writes "Not applicable" followed by why, every time it uses
        // it, and the shortest real cell in these ten is far longer than this.
        expect(content.trim().length, `${card.identifier} ${field.id}`).toBeGreaterThan(12)
      }
    }
  })

  it('pins each card to its own header and surface-table locator', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const index = card.number - 1
      expect(card.cardHeaderRef, card.identifier).toBe(STORYBOARD_CARD_HEADER_REFS[index])
      expect(card.surfaceTableRef, card.identifier).toBe(STORYBOARD_SURFACE_TABLE_REFS[index])
    }
  })
})

describe('the five-surface reaction of each card', () => {
  it('carries all five surfaces and a sourceRef inside its own table', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      // The table's five body rows sit two to six lines below its header:
      // header, separator, then five rows.
      const header = Number(card.surfaceTableRef.slice(1))
      for (const surface of JOURNEY_SURFACES) {
        const effect = card.surfaces[surface.code]
        const cited = Number(effect.sourceRef.slice(1))
        expect(cited, `${card.identifier} ${surface.code}`).toBeGreaterThan(header + 1)
        expect(cited, `${card.identifier} ${surface.code}`).toBeLessThanOrEqual(header + 6)
      }
    }
  })

  it('gives every absent surface a reason, never a blank', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      for (const surface of JOURNEY_SURFACES) {
        const effect = card.surfaces[surface.code]
        if (effect.kind !== 'noDirectEffect') continue
        expect(effect.reason.trim(), `${card.identifier} ${surface.code}`).not.toBe('')
      }
    }
  })
})

/**
 * Chapter 40's contract for each of the ten literals this task keys on,
 * verbatim from its register's rows L88916-L88925. A LITERAL LIST rather than
 * a lookup, because the point of the assertion below is that the two owners
 * say different things, and a check that reads both sides out of one array
 * agrees with itself whatever the array holds.
 */
const CHAPTER_40_CONTRACTS = [
  'Boundary violation attempt',
  'Orchestrator loop failure',
  'Coaching retrieval and delivery failure',
  'Deviation brief assembly and gate delivery failure',
  'Shift handoff brief failure',
  'Vision scope-creep guard',
  'Atom failure and evaluation regression',
  'Memory store failure',
  'Model and provider failure',
  'Governance gate delivery and decision failure',
] as const

describe('the compound fallback key, against the sixteen-literal collision', () => {
  it('carries the literal its own storyboard number names', () => {
    // Derived from `card.number`, never from the field under test. An earlier
    // version of this suite resolved the expected chapter out of
    // `card.fallback.chapter` and therefore agreed with itself; it could not
    // have gone red for any value.
    for (const card of STORYBOARDS_01_TO_10) {
      const padded = String(card.number).padStart(2, '0')
      expect(card.fallback.chapter, card.identifier).toBe(`44A.${card.number}`)
      expect(card.fallback.identifier, card.identifier).toBe(`FB-AI-${padded}`)
    }
  })

  it('resolves every card to its 44A owner and not to the chapter-40 one', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const owner = ownerAt(card.fallback.chapter, card.fallback.identifier)
      expect(owner, card.identifier).not.toBeNull()
      expect(owner!.chapter, card.identifier).toBe(`44A.${card.number}`)
      expect(owner!.locator, card.identifier).toBe(`L${Number(card.cardHeaderRef.slice(1)) + 2}`)
    }
  })

  it('resolves the FOREIGN owner too, and the two contracts differ', () => {
    // Proved rather than assumed. All ten of this task's literals sit inside
    // the sixteen-literal overlap, so every one has a chapter-40 owner to
    // assert against — `FB-AI-01` is a worker asking while offline here and a
    // boundary violation attempt there, and a resolver answering with the
    // second on a Frontline surface answers about the wrong thing.
    for (const card of STORYBOARDS_01_TO_10) {
      const mine = ownerAt(`44A.${card.number}`, card.fallback.identifier)
      const foreign = ownerAt(`40.${card.number}`, card.fallback.identifier)
      expect(foreign, card.identifier).not.toBeNull()
      expect(foreign!.contract, card.identifier).toBe(CHAPTER_40_CONTRACTS[card.number - 1])
      expect(mine!.contract, card.identifier).not.toBe(foreign!.contract)
      expect(mine!.locator, card.identifier).not.toBe(foreign!.locator)
    }
  })

  it('is a literal every one of the ten shares with more than one owner', () => {
    // If this ever stops holding, the collision has been resolved in the
    // source and the compound key can be reconsidered — not silently, but here.
    for (const card of STORYBOARDS_01_TO_10) {
      const chapters = ownersOf(card.fallback.identifier).map((owner) => owner.chapter)
      expect(chapters, card.identifier).toContain(`44A.${card.number}`)
      expect(
        chapters.filter((chapter) => !chapter.startsWith('44A.')),
        card.identifier,
      ).not.toEqual([])
    }
  })
})

describe('AC-44A-004 — the final official state, from the audit log alone', () => {
  it('names a state and derives it from events the log holds', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const ids = card.audit.map((event) => event.id)
      expect(new Set(ids).size, card.identifier).toBe(ids.length)
      expect(card.finalOfficialState.name.trim(), card.identifier).not.toBe('')
      expect(card.finalOfficialState.derivedFrom.length, card.identifier).toBeGreaterThan(0)
      for (const id of card.finalOfficialState.derivedFrom) {
        expect(ids, `${card.identifier} ${id}`).toContain(id)
      }
    }
  })

  it('reconstructs the state without reading anything but the audit log', () => {
    // The reconstruction `TEST-44A-003` (L92756) describes, performed here on
    // the data: take the audit events the state names, and nothing else, and
    // assert they are sufficient to identify the state. Sufficiency is
    // modelled as the state being recoverable from a log holding ONLY those
    // events — which is what "from the audit log alone" forbids leaning on
    // the card's prose for.
    for (const card of STORYBOARDS_01_TO_10) {
      const log = card.audit.filter((event) =>
        card.finalOfficialState.derivedFrom.includes(event.id),
      )
      expect(log.map((event) => event.id), card.identifier).toEqual(
        [...card.finalOfficialState.derivedFrom],
      )
      for (const event of log) {
        expect(event.statement.trim(), `${card.identifier} ${event.id}`).not.toBe('')
        expect(event.sourceRef, `${card.identifier} ${event.id}`).toMatch(/^L\d{5}$/)
      }
    }
  })
})

describe('AC-44A-005 — a presumed-absent capability says so first', () => {
  it('declares one wherever the section\'s own text does', () => {
    // Which cards carry one is a literal list, not a count: the three that do
    // are the three whose own narrative writes the admission. A card added to
    // or removed from this list turns the suite red, which a length would not.
    const declaring = STORYBOARDS_01_TO_10.filter(
      (card) => card.absentCapability !== null,
    ).map((card) => card.identifier)
    expect(declaring).toEqual(['SB-AI-01', 'SB-AI-02', 'SB-AI-03', 'SB-AI-04'])
  })

  it('cites a line inside its own section for the declaration', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      if (card.absentCapability === null) continue
      expect(card.absentCapability.statement.trim(), card.identifier).not.toBe('')
      const cited = Number(card.absentCapability.sourceRef.slice(1))
      const header = Number(card.cardHeaderRef.slice(1))
      // The narrative sits above the card table, inside the same section.
      expect(cited, card.identifier).toBeLessThan(header)
      expect(cited, card.identifier).toBeGreaterThan(header - 30)
    }
  })
})

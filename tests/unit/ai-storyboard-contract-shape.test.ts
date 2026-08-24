import { describe, expect, it } from 'vitest'
import {
  STORYBOARD_ACCEPTANCE_CRITERIA,
  STORYBOARD_CARD_FIELDS,
  STORYBOARD_CARD_HEADER_REFS,
  STORYBOARD_CARD_SCHEMA_REF,
  STORYBOARD_SURFACE_TABLE_REFS,
  STORYBOARD_TESTS,
  storyboardCardRows,
} from '@/ai/storyboards/contract'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { FALLBACK_CONTRACT_OWNERS, ownerAt, ownersOf } from '@/ai/fallbacks/registry'
import { FIXTURE_STORYBOARD } from './ai-storyboard-contract-fixture.test'

/**
 * Slice 11, wave 4, task 15A — the storyboard card schema, as data.
 *
 * Every expectation here is a LITERAL LIST DECLARED IN THIS FILE, outside the
 * module it polices. That is the whole point: a gate that reads its expected
 * set out of the thing it is checking is a gate that agrees with any change,
 * and this build has shipped four of those. Deleting a field from
 * `STORYBOARD_CARD_FIELDS` fails twice — here, at run time, and at `tsc`,
 * because `StoryboardCardContent` is a mapped type over the same union.
 *
 * Membership is proved by ADDING. A twentieth entry in `EXPECTED_FIELD_LABELS`
 * must turn this file red; a length assertion would not notice.
 *
 * The field labels are transcribed from the frozen source's first card header
 * at L92791 with rows L92793-L92811. Measured independently for this test:
 * all thirty cards under `## 44A.` are nineteen rows with one byte-identical
 * field tuple, and all thirty five-surface tables are five rows with one
 * identical surface tuple. Zero deviations in sixty tables.
 */

// L92793-L92811, in source order. The source's own field names, verbatim.
const EXPECTED_FIELD_LABELS = [
  'Identifier',
  'Preconditions',
  'Trigger',
  'Actors and roles',
  'Worker-visible experience',
  'Automatic fallback',
  'Manual fallback',
  'Fallback-of-fallback',
  'Safe stop',
  'Local data',
  'Central data',
  'Notifications',
  'Reconnection',
  'Conflict resolution',
  'Final official state',
  'Audit',
  'Recovery Time Objective and Recovery Point Objective',
  'Residual risk',
  'Source status',
] as const

// The five-surface tuple, in source order, from every one of the thirty tables.
const EXPECTED_SURFACE_NAMES = [
  'Delivery Operations Hub',
  'Standards and Operations Studio',
  'Client Command Center',
  'Frontline Worker Application',
  'Super Admin platform console',
] as const

// The thirty card headers, measured by scanning L92596-L95408 for the exact
// header line. Held as a literal here so a drift in the module is caught by a
// list rather than by a count.
const EXPECTED_CARD_HEADER_REFS = [
  'L92791', 'L92874', 'L92958', 'L93039', 'L93127', 'L93219', 'L93303', 'L93391',
  'L93472', 'L93564', 'L93643', 'L93728', 'L93814', 'L93899', 'L93990', 'L94071',
  'L94155', 'L94238', 'L94323', 'L94403', 'L94484', 'L94566', 'L94661', 'L94741',
  'L94823', 'L94905', 'L94989', 'L95074', 'L95159', 'L95249',
] as const

const EXPECTED_SURFACE_TABLE_REFS = [
  'L92815', 'L92898', 'L92982', 'L93063', 'L93151', 'L93243', 'L93327', 'L93415',
  'L93496', 'L93588', 'L93667', 'L93752', 'L93838', 'L93923', 'L94014', 'L94095',
  'L94179', 'L94262', 'L94347', 'L94427', 'L94508', 'L94590', 'L94685', 'L94765',
  'L94847', 'L94929', 'L95013', 'L95098', 'L95183', 'L95273',
] as const

/**
 * Each storyboard's own Identifier row — the line where the source writes
 * `SB-AI-NN` — paired with that identifier so the pairing is checkable rather
 * than a bare line number. The card header is the line two above it, which is
 * how the thirty headers above were confirmed and how a reader confirms them
 * again without counting blank lines.
 */
const IDENTIFIER_ROWS = [
  'SB-AI-01 L92793', 'SB-AI-02 L92876', 'SB-AI-03 L92960', 'SB-AI-04 L93041',
  'SB-AI-05 L93129', 'SB-AI-06 L93221', 'SB-AI-07 L93305', 'SB-AI-08 L93393',
  'SB-AI-09 L93474', 'SB-AI-10 L93566', 'SB-AI-11 L93645', 'SB-AI-12 L93730',
  'SB-AI-13 L93816', 'SB-AI-14 L93901', 'SB-AI-15 L93992', 'SB-AI-16 L94073',
  'SB-AI-17 L94157', 'SB-AI-18 L94240', 'SB-AI-19 L94325', 'SB-AI-20 L94405',
  'SB-AI-21 L94486', 'SB-AI-22 L94568', 'SB-AI-23 L94663', 'SB-AI-24 L94743',
  'SB-AI-25 L94825', 'SB-AI-26 L94907', 'SB-AI-27 L94991', 'SB-AI-28 L95076',
  'SB-AI-29 L95161', 'SB-AI-30 L95251',
] as const

const EXPECTED_ACCEPTANCE_IDS = [
  'AC-44A-001',
  'AC-44A-002',
  'AC-44A-003',
  'AC-44A-004',
  'AC-44A-005',
] as const

const EXPECTED_TEST_IDS = [
  'TEST-44A-001',
  'TEST-44A-002',
  'TEST-44A-003',
  'TEST-44A-004',
] as const

describe('the nineteen-field storyboard card schema', () => {
  it('holds the source\'s own field names, in source order', () => {
    expect(STORYBOARD_CARD_FIELDS.map((field) => field.label)).toEqual([
      ...EXPECTED_FIELD_LABELS,
    ])
  })

  it('cites the card header rather than the head\'s ten-item reading guide', () => {
    // L92660-L92669's "How to read a storyboard" list has TEN items, includes
    // the five-surface reaction (a separate table, not a card row), and omits
    // four fields the card carries. A contract built from it has the wrong
    // field set, so the schema's citation is the card header.
    expect(STORYBOARD_CARD_SCHEMA_REF).toBe('L92791')
  })

  it('gives every field a distinct identifier', () => {
    const ids = STORYBOARD_CARD_FIELDS.map((field) => field.id)
    expect([...new Set(ids)]).toEqual(ids)
  })

  it('renders every field of a card, in schema order, with no blank content', () => {
    const rows = storyboardCardRows(FIXTURE_STORYBOARD)
    expect(rows.map((row) => row.label)).toEqual([...EXPECTED_FIELD_LABELS])
    for (const row of rows) {
      expect(row.content.trim()).not.toBe('')
    }
  })
})

describe('the five-surface reaction contract', () => {
  it('reuses the shared journey surfaces and matches the source tuple', () => {
    expect(JOURNEY_SURFACES.map((surface) => surface.name)).toEqual([
      ...EXPECTED_SURFACE_NAMES,
    ])
  })

  it('requires a reason on every surface with no direct effect', () => {
    for (const surface of JOURNEY_SURFACES) {
      const effect = FIXTURE_STORYBOARD.surfaces[surface.code]
      if (effect.kind === 'noDirectEffect') {
        expect(effect.reason.trim()).not.toBe('')
      } else {
        expect(effect.statement.trim()).not.toBe('')
      }
    }
  })
})

describe('the thirty measured locators', () => {
  it('pins every card header', () => {
    expect([...STORYBOARD_CARD_HEADER_REFS]).toEqual([...EXPECTED_CARD_HEADER_REFS])
  })

  it('pins every surface-table header', () => {
    expect([...STORYBOARD_SURFACE_TABLE_REFS]).toEqual([...EXPECTED_SURFACE_TABLE_REFS])
  })

  it('places every card header two lines above its own identifier row', () => {
    // Not decoration: an off-by-one locator still looks right, because the row
    // above a card header is a blank line and the row below is the separator.
    // Anchoring the header to the identifier the source writes at header+2 is
    // the check that an off-by-one cannot pass.
    IDENTIFIER_ROWS.forEach((pair, index) => {
      const identifierRow = Number(pair.split(' L')[1])
      expect(Number(STORYBOARD_CARD_HEADER_REFS[index]!.slice(1)), pair).toBe(identifierRow - 2)
    })
  })

  it('pairs each card with the surface table that follows it', () => {
    for (const [index, card] of STORYBOARD_CARD_HEADER_REFS.entries()) {
      const surface = STORYBOARD_SURFACE_TABLE_REFS[index]!
      expect(Number(surface.slice(1))).toBeGreaterThan(Number(card.slice(1)))
    }
  })
})

describe('the chapter-level criteria', () => {
  it('holds the five acceptance rows, L92746-L92750', () => {
    expect(STORYBOARD_ACCEPTANCE_CRITERIA.map((row) => row.id)).toEqual([
      ...EXPECTED_ACCEPTANCE_IDS,
    ])
    expect(STORYBOARD_ACCEPTANCE_CRITERIA.map((row) => row.sourceRef)).toEqual([
      'L92746',
      'L92747',
      'L92748',
      'L92749',
      'L92750',
    ])
  })

  it('holds the four test rows, L92754-L92757', () => {
    expect(STORYBOARD_TESTS.map((row) => row.id)).toEqual([...EXPECTED_TEST_IDS])
    expect(STORYBOARD_TESTS.map((row) => row.sourceRef)).toEqual([
      'L92754',
      'L92755',
      'L92756',
      'L92757',
    ])
  })
})

describe('the compound fallback key', () => {
  it('resolves a storyboard\'s contract through (chapter, identifier)', () => {
    const owner = ownerAt(FIXTURE_STORYBOARD.fallback.chapter, FIXTURE_STORYBOARD.fallback.identifier)
    expect(owner).not.toBeNull()
    expect(owner!.chapter).toBe('44A.1')
  })

  it('never answers a bare literal with one record, because sixteen have two owners', () => {
    // `FB-AI-01` is a boundary violation attempt at L88916, storyboard 1 at
    // L92793, a contract FAMILY at L46951 and trace-store unavailability at
    // L74495. A flat keyspace merges them.
    const owners = ownersOf('FB-AI-01').map((owner) => owner.chapter)
    expect(owners).toContain('40.1')
    expect(owners).toContain('44A.1')
    expect(owners.length).toBeGreaterThan(2)
  })

  it('keys the sixteen-literal overlap on the chapter, so the two registers stay apart', () => {
    // The overlap the brief names: FB-AI-01 through FB-AI-16 exist in both
    // chapter 40's register and section 44A's storyboards.
    for (let n = 1; n <= 16; n += 1) {
      const literal = `FB-AI-${String(n).padStart(2, '0')}`
      expect(ownerAt(`40.${n}`, literal), literal).not.toBeNull()
      expect(ownerAt(`44A.${n}`, literal), literal).not.toBeNull()
    }
  })

  it('registers no FB-AI-31, because L95353 is an Illustrative Example', () => {
    // The register is `as const`, so `tsc` already refuses a comparison
    // against `'FB-AI-31'` as having no overlap — which is the stronger half
    // of this assertion. The identifiers are widened here so the runtime half
    // can still say it out loud, and so that a future registration of the
    // literal is caught by a test rather than only by a type.
    const identifiers: readonly string[] = FALLBACK_CONTRACT_OWNERS.map(
      (owner) => owner.identifier,
    )
    expect(identifiers).not.toContain('FB-AI-31')
  })
})

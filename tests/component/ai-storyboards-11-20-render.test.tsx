import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { StoryboardCard } from '@/ui/shared/StoryboardCard'
import {
  STORYBOARD_CARD_FIELDS,
  storyboardCardProvenance,
} from '@/ai/storyboards/contract'
import { PROVENANCE_CLASS_ATTRIBUTE, provenanceViolations } from '@/ai/provenance/contract'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { STORYBOARDS_11_TO_20 } from '@/ai/storyboards/sb-11-to-20'

/**
 * Slice 11, wave 4, task 17 — the ten cards through 15A's renderer.
 *
 * The unit file proves the ten as data. This file proves the things only a
 * rendered tree can be wrong about, over the real ten rather than a fixture:
 *
 *   - A FIELD SILENTLY DROPPED. All nineteen read out of the DOM, in schema
 *     order, on every one of the ten.
 *   - A SURFACE ROW SILENTLY DROPPED, or rendered blank. All five, with text.
 *   - MORE THAN ONE PROVENANCE CLASS, or the wrong one. A storyboard card is
 *     transcribed approved content, never live artificial intelligence, and
 *     the class is the resolved one rather than a literal repeated here.
 *   - A BREACH RENDERED AS THOUGH IT WERE FINE. The renderer raises an alert
 *     for a card that breaks an invariant; none of these ten may raise one.
 *   - AC-44A-005 ASSERTED AS A LABEL RATHER THAN AS AN ORDER. "Before
 *     describing behaviour" is a DOM position, so it is checked as one.
 */

describe('the ten cards, rendered', () => {
  for (const card of STORYBOARDS_11_TO_20) {
    describe(`${card.identifier}`, () => {
      it('renders all nineteen field labels in schema order', () => {
        const { container } = render(<StoryboardCard storyboard={card} />)
        const labels = [...container.querySelectorAll('[data-storyboard-field] dt')].map(
          (node) => node.textContent,
        )
        expect(labels).toEqual(STORYBOARD_CARD_FIELDS.map((field) => field.label))
      })

      it('renders all five surfaces, each with words in its cell', () => {
        const { container } = render(<StoryboardCard storyboard={card} />)
        const rows = [...container.querySelectorAll('[data-storyboard-surface]')]
        expect(rows.map((row) => row.getAttribute('data-storyboard-surface'))).toEqual(
          JOURNEY_SURFACES.map((surface) => surface.code),
        )
        for (const row of rows) {
          expect(row.querySelector('dd')!.textContent!.trim()).not.toBe('')
        }
      })

      it('emits exactly one provenance class, and it is the resolved one', () => {
        const { container } = render(<StoryboardCard storyboard={card} />)
        expect(provenanceViolations(container)).toEqual([])
        const marks = [...container.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)]
        expect(marks).toHaveLength(1)
        expect(marks[0]!.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe(
          storyboardCardProvenance(),
        )
      })

      it('raises no render-time-rule alert', () => {
        const { container } = render(<StoryboardCard storyboard={card} />)
        expect(container.querySelector('[role="alert"]')).toBeNull()
      })

      it('names the fallback contract with its own section, never the bare literal', () => {
        const { getByTestId } = render(<StoryboardCard storyboard={card} />)
        const text = getByTestId('storyboard-fallback-key').textContent ?? ''
        // Derived from the storyboard NUMBER, not from `fallback.chapter`, so a
        // card keyed to the wrong chapter fails here instead of agreeing with
        // itself. A bare `FB-AI-15` on screen has not said which of two
        // contracts it means.
        expect(text).toContain(`44A.${card.number}`)
        expect(text).toContain(`FB-AI-${card.number}`)
      })
    })
  }
})

describe('AC-44A-005 (L92750) — the declaration comes before the behaviour', () => {
  /**
   * Six of the ten declare a Statement-of-Work absence in their own narrative
   * before the behaviour: 44A.11 (L93631), 44A.12 (L93713), 44A.14 (L93885),
   * 44A.15 (L93975), 44A.17 (L94140) and 44A.20 (L94390). A literal list, so
   * the seventh card acquiring or losing one is red here rather than silent.
   */
  const DECLARING = ['SB-AI-11', 'SB-AI-12', 'SB-AI-14', 'SB-AI-15', 'SB-AI-17', 'SB-AI-20']

  it('is exactly those six of the ten', () => {
    expect(
      STORYBOARDS_11_TO_20.filter((card) => card.absentCapability !== null).map(
        (card) => card.identifier,
      ),
    ).toEqual(DECLARING)
  })

  it('places the declaration above the first field row on every one of the six', () => {
    for (const card of STORYBOARDS_11_TO_20) {
      if (card.absentCapability === null) continue
      const { container } = render(<StoryboardCard storyboard={card} />)
      const declaration = container.querySelector('[data-testid="storyboard-absent-capability"]')!
      const firstField = container.querySelector('[data-storyboard-field]')!
      expect(
        declaration.compareDocumentPosition(firstField)
          & Node.DOCUMENT_POSITION_FOLLOWING,
        `${card.identifier} declares its absence after its first field row`,
      ).toBeTruthy()
    }
  })
})

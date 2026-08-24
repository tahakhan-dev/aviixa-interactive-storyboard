import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { StoryboardCard } from '@/ui/shared/StoryboardCard'
import { STORYBOARD_CARD_FIELDS } from '@/ai/storyboards/contract'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { STORYBOARDS_01_TO_10 } from '@/ai/storyboards/sb-01-to-10'

/**
 * Slice 11, wave 4, task 16 — the ten cards through 15A's renderer.
 *
 * `tests/component/ai-storyboard-card-render.test.tsx` already proves the
 * renderer against a fixture, and nothing here re-proves it. What only a
 * rendered tree can catch about REAL data is narrower and is all this file
 * checks: a row whose transcribed content is present in the data and yet
 * reaches the reader empty, a surface whose absent arm renders without its
 * reason, an `AC-44A-005` declaration that renders below the behaviour it is
 * required to precede, and a violation banner on a card this task believes is
 * sound. Ten cards, each one rendered.
 */

describe('every one of the ten, rendered', () => {
  it('renders all nineteen labels and nineteen non-empty rows', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const { container } = render(<StoryboardCard storyboard={card} />)
      const rows = [...container.querySelectorAll('[data-storyboard-field]')]
      expect(rows.map((row) => row.querySelector('dt')?.textContent), card.identifier).toEqual(
        STORYBOARD_CARD_FIELDS.map((field) => field.label),
      )
      for (const row of rows) {
        const id = row.getAttribute('data-storyboard-field')
        expect(row.querySelector('dd')?.textContent?.trim(), `${card.identifier} ${id}`).not.toBe(
          '',
        )
      }
    }
  })

  it('renders all five surfaces in the source\'s order, absent arms with their reason', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const { container } = render(<StoryboardCard storyboard={card} />)
      const cells = [...container.querySelectorAll('[data-storyboard-surface]')]
      expect(cells.map((cell) => cell.getAttribute('data-storyboard-surface')), card.identifier)
        .toEqual(JOURNEY_SURFACES.map((surface) => surface.code))
      for (const cell of cells) {
        const code = cell.getAttribute('data-storyboard-surface')
        const text = cell.querySelector('dd')?.textContent ?? ''
        if (!text.includes('No direct effect')) continue
        // "No direct effect" alone is a blank cell wearing a label. The reason
        // is what makes it a rendering.
        expect(text.replace('No direct effect —', '').trim().length, `${card.identifier} ${code}`)
          .toBeGreaterThan(12)
      }
    }
  })

  it('renders no contract-breach alert, because none of the ten breaches one', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const { container } = render(<StoryboardCard storyboard={card} />)
      expect(container.querySelector('[role="alert"]'), card.identifier).toBeNull()
    }
  })

  it('places a presumed-absent capability above the first field row', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const { container } = render(<StoryboardCard storyboard={card} />)
      const declaration = container.querySelector('[data-testid="storyboard-absent-capability"]')
      if (card.absentCapability === null) {
        expect(declaration, card.identifier).toBeNull()
        continue
      }
      expect(declaration, card.identifier).not.toBeNull()
      const firstRow = container.querySelector('[data-storyboard-field]')!
      expect(
        declaration!.compareDocumentPosition(firstRow) & Node.DOCUMENT_POSITION_FOLLOWING,
        card.identifier,
      ).toBeTruthy()
    }
  })

  it('renders the chapter beside the fallback literal, never the literal alone', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const { container } = render(<StoryboardCard storyboard={card} />)
      const key = container.querySelector('[data-testid="storyboard-fallback-key"]')?.textContent
      expect(key, card.identifier).toContain(card.fallback.identifier)
      expect(key, card.identifier).toContain(`44A.${card.number}`)
    }
  })

  it('renders the audit events the final official state is derived from', () => {
    for (const card of STORYBOARDS_01_TO_10) {
      const { container } = render(<StoryboardCard storyboard={card} />)
      for (const id of card.finalOfficialState.derivedFrom) {
        expect(
          container.querySelector(`[data-storyboard-audit-event="${id}"]`),
          `${card.identifier} ${id}`,
        ).not.toBeNull()
      }
    }
  })
})

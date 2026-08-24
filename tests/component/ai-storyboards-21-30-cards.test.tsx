import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  PROVENANCE_CLASS_ATTRIBUTE,
  provenanceViolations,
} from '@/ai/provenance/contract'
import { STORYBOARD_CARD_FIELDS } from '@/ai/storyboards/contract'
import { StoryboardCard } from '@/ui/shared/StoryboardCard'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import {
  SB_21_TO_30,
  SB_21_TO_30_DISCLOSED_VIOLATIONS,
} from '@/ai/storyboards/sb-21-to-30/storyboards'

/**
 * Slice 11 · wave 4 · task 18 — the ten cards, RENDERED.
 *
 * The renderer is 15A's `StoryboardCard` and is not reimplemented here. What
 * this file asserts is that this task's ten data objects survive it: nineteen
 * field rows each, five surface rows each with a reason where the effect is
 * absent, exactly ONE provenance class per card, and the compound fallback key
 * on screen with its chapter attached.
 *
 * ── WHY THE FALLBACK KEY IS ASSERTED ON SCREEN AND NOT ONLY IN DATA ────────
 * Sixteen `FB-AI-*` literals name two different contracts each. A card
 * rendering the bare literal has not told the reader which contract it means,
 * and storyboard 26's own identifier row names a second sense's worth of
 * literals in one line. So the chapter has to be visible, not merely stored.
 */

const EXPECTED_NUMBERS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const

describe('storyboards 44A.21 to 44A.30 — rendered', () => {
  for (const number of EXPECTED_NUMBERS) {
    const storyboard = SB_21_TO_30.find((entry) => entry.number === number)!

    it(`storyboard ${number} renders all nineteen field rows with content`, () => {
      const { container } = render(<StoryboardCard storyboard={storyboard} />)
      for (const field of STORYBOARD_CARD_FIELDS) {
        const row = container.querySelector(`[data-storyboard-field="${field.id}"]`)
        expect(row, `${number} · ${field.label}`).not.toBeNull()
        // The label AND the content, because a row rendering only its label is
        // the omission the projection exists to prevent.
        expect(row!.textContent).toContain(field.label)
        expect(row!.textContent!.replace(field.label, '').trim()).not.toBe('')
      }
    })

    it(`storyboard ${number} renders all five surfaces, absent ones with a reason`, () => {
      const { container } = render(<StoryboardCard storyboard={storyboard} />)
      for (const surface of JOURNEY_SURFACES) {
        const row = container.querySelector(`[data-storyboard-surface="${surface.code}"]`)
        expect(row, `${number} · ${surface.name}`).not.toBeNull()
        const effect = storyboard.surfaces[surface.code]
        if (effect.kind === 'noDirectEffect') {
          // "No direct effect" WITH the reason. Never the phrase alone.
          //
          // The reason is asserted NON-EMPTY on screen before it is compared,
          // because `toContain('')` is true of every string: an earlier version
          // of this assertion passed a blank reason while the unit gate caught
          // it, which is a gate that could not fail.
          expect(effect.reason.trim()).not.toBe('')
          expect(row!.textContent).toContain('No direct effect')
          expect(row!.textContent).toContain(effect.reason)
          const rendered = row!.textContent!.split('No direct effect —')[1] ?? ''
          expect(rendered.replace(effect.sourceRef, '').trim()).not.toBe('')
        } else {
          expect(row!.textContent).toContain(effect.statement)
        }
      }
    })

    it(`storyboard ${number} emits exactly one provenance class`, () => {
      const { container } = render(<StoryboardCard storyboard={storyboard} />)
      const marks = container.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)
      expect(marks.length, `${number} emitted ${marks.length} provenance classes`).toBe(1)
      // A storyboard card is transcribed, approved, previously released content
      // — PROV-3 — and emphatically not live artificial intelligence. The
      // class is whatever the shared resolver answers; what is asserted here is
      // that exactly one is emitted and the shared lint is satisfied.
      expect(provenanceViolations(container)).toEqual([])
    })

    it(`storyboard ${number} shows its fallback contract with the chapter attached`, () => {
      render(<StoryboardCard storyboard={storyboard} />)
      const key = screen.getByTestId('storyboard-fallback-key')
      expect(key.textContent).toContain(`FB-AI-${number}`)
      expect(key.textContent).toContain(`44A.${number}`)
    })

    it(`storyboard ${number} renders its presumed-absent capability before the fields`, () => {
      const { container } = render(<StoryboardCard storyboard={storyboard} />)
      const declared = container.querySelector('[data-testid="storyboard-absent-capability"]')
      if (storyboard.absentCapability === null) {
        expect(declared).toBeNull()
        return
      }
      expect(declared).not.toBeNull()
      // Present is not enough: the element has to SAY something. A whitespace
      // statement renders a visually empty declaration and satisfies a
      // presence check, which is the same defect as omitting it.
      expect(declared!.textContent!.replace(storyboard.absentCapability.sourceRef, '').trim())
        .not.toBe('')
      // `AC-44A-005` (L92750) makes the ORDER the requirement: a storyboard
      // presuming an absent capability says so BEFORE describing behaviour.
      const firstField = container.querySelector('[data-storyboard-field]')!
      expect(
        declared!.compareDocumentPosition(firstField) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })
  }

  it('renders no violation banner on the nine cards that report none', () => {
    for (const storyboard of SB_21_TO_30) {
      const disclosed = SB_21_TO_30_DISCLOSED_VIOLATIONS.filter(
        (entry) => entry.storyboard === storyboard.number,
      )
      if (disclosed.length > 0) continue
      const { container } = render(<StoryboardCard storyboard={storyboard} />)
      expect(
        container.querySelector('[role="alert"]'),
        `storyboard ${storyboard.number} rendered an undisclosed violation`,
      ).toBeNull()
    }
  })

  /**
   * Storyboard 25's disclosed report RENDERS. It is not swallowed.
   *
   * The Spanish rendering of `SCR-FL-LOCK-01`'s fixed message does not exist in
   * the frozen source, and `TEST-44A-004` (L92757) requires the message set
   * complete in both languages. A build that knew this and showed nothing would
   * be the dishonest version of the same state.
   */
  it('renders storyboard 25 disclosed report on screen, citing its line', () => {
    const twentyFive = SB_21_TO_30.find((entry) => entry.number === 25)!
    const { container } = render(<StoryboardCard storyboard={twentyFive} />)
    const alert = container.querySelector('[role="alert"]')
    expect(alert).not.toBeNull()
    expect(alert!.textContent).toContain('SCR-FL-LOCK-01')
    expect(alert!.textContent).toContain('Spanish')
    expect(alert!.textContent).toContain('L92757')
  })

  it('renders storyboard 25 fixed message verbatim, unparaphrased', () => {
    const twentyFive = SB_21_TO_30.find((entry) => entry.number === 25)!
    const { container } = render(<StoryboardCard storyboard={twentyFive} />)
    const row = container.querySelector('[data-storyboard-field="workerVisibleExperience"]')!
    // L94829's wording, exactly. L94876 forbids paraphrase or re-localisation
    // into a different meaning.
    expect(row.textContent).toContain(
      'Operation suspended. Contact your supervisor. Your work has been saved.',
    )
  })

  /**
   * The two authored defects do not leak into the rendering.
   *
   * Storyboards 29 and 30 name no decision in their section bodies. The glance
   * table attributes one to each. The body is the specification, so nothing on
   * either card claims a decision reference — and the conflict is disclosed as
   * data, with both locators, rather than resolved on screen in one direction.
   */
  for (const [number, id] of [
    [29, 'DEC-PLUS-001'],
    [30, 'DEC-DIVERGE-001'],
  ] as const) {
    it(`storyboard ${number} renders no ${id} reference anywhere on the card`, () => {
      const storyboard = SB_21_TO_30.find((entry) => entry.number === number)!
      const { container } = render(<StoryboardCard storyboard={storyboard} />)
      expect(container.textContent).not.toContain(id)
      // And no other decision either: the body names none at all.
      expect(container.textContent).not.toContain('DEC-')
    })
  }
})

import { describe, it, expect } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { provenanceViolations } from '@/ai/provenance/contract'
import { FeedbackSignalCapture } from '@/surfaces/cc/modules/cc-07/FeedbackSignalCapture'
import {
  CC07_DEGRADATION_GAPS,
  CC07_SAFETY_FLAG_DISCLOSURE,
  uniformlyProhibitedRows,
} from '@/surfaces/cc/modules/cc-07/degradation'

/**
 * `MOD-CC-07`'s overlay AS A RENDERING.
 *
 * THE ONE CLAIM THIS FILE EXISTS TO CHECK. Chapters 40 to 44 never name this
 * module, so everything the overlay says about it rests on a name match. A
 * panel that states the behaviour without stating that it is an inference is
 * indistinguishable, from the outside, from a panel that read the identifier
 * off the source. So the caveat is asserted as a rendered string, not as a
 * data field that might never reach a screen.
 */

describe('the inferred attribution reaches the screen as an inference', () => {
  it('renders the behaviour, its parsed outcome, and the caveat', () => {
    render(<FeedbackSignalCapture />)
    const behaviour = screen.getByTestId('cc-07-ai-behaviour').textContent ?? ''
    expect(behaviour).toContain('Feedback signal capture')
    expect(behaviour).toContain('MOD-CC-07')
    expect(screen.getByTestId('cc-07-ai-outcome').textContent).toBe('allowed')

    const caveat = screen.getByTestId('cc-07-ai-attribution').textContent ?? ''
    expect(caveat).toContain('build inference')
    expect(caveat).toContain('APP-012')
    cleanup()
  })

  it('renders what could not be established rather than leaving it silent', () => {
    render(<FeedbackSignalCapture />)
    const gaps = screen.getAllByTestId('cc-07-degradation-gap')
    expect(gaps.length).toBe(CC07_DEGRADATION_GAPS.length)
    expect(gaps.map((g) => g.textContent ?? '').join(' ')).toContain('zero times')
    cleanup()
  })
})

describe('exactly one provenance class per element', () => {
  it('reports no violation over the whole rendered panel', () => {
    const { container } = render(<FeedbackSignalCapture />)
    expect(provenanceViolations(container)).toEqual([])
    cleanup()
  })

  it('names the two classes it emits and keeps them apart', () => {
    render(<FeedbackSignalCapture />)
    const text = screen.getByTestId('cc-07-provenance').textContent ?? ''
    expect(text).toContain('PROV-4')
    expect(text).toContain('PROV-5')
    expect(text).not.toContain('PROV-1')
    cleanup()
  })

  it('states that the produced-at obligation binds this module vacuously', () => {
    render(<FeedbackSignalCapture />)
    const text = screen.getByTestId('cc-07-ai-element-obligation').textContent ?? ''
    expect(text).toContain('produced-at time and a context reference')
    expect(text).toContain('vacuously')
    cleanup()
  })
})

describe('the inverted-polarity row draws no control', () => {
  it('renders each qualifying row as a sentence with nothing clickable in it', () => {
    render(<FeedbackSignalCapture />)
    const rows = screen.getAllByTestId('cc-07-no-control-row')
    expect(rows.length).toBe(uniformlyProhibitedRows().length)
    for (const row of rows) {
      expect(row.querySelectorAll('button, input, select, textarea').length).toBe(0)
      expect(row.querySelector('[aria-disabled="true"], [disabled]')).toBeNull()
    }
    expect(rows.map((r) => r.textContent ?? '').join(' ')).toContain(
      'Have feedback required before proceeding',
    )
    cleanup()
  })

  it('leaves the two permitted feedback controls alone — the rule is about the row, not the module', () => {
    render(<FeedbackSignalCapture />)
    const live = screen.getByTestId('cc-07-controls-live')
    expect(within(live).getAllByRole('button').length).toBeGreaterThan(0)
    cleanup()
  })
})

describe('DEC-SAFETY-001 is disclosed here too, from this surface’s side', () => {
  it('renders every reading with its locator', () => {
    render(<FeedbackSignalCapture />)
    const readings = screen.getAllByTestId('cc-07-safety-flag-reading')
    expect(readings.length).toBe(CC07_SAFETY_FLAG_DISCLOSURE.readings.length)
    expect(readings.map((r) => r.textContent ?? '').join(' ')).toContain(
      'visually separate from learning signals',
    )
    cleanup()
  })

  it('adopts nothing and names the module holding the other end', () => {
    render(<FeedbackSignalCapture />)
    expect(screen.getByTestId('cc-07-safety-flag-adopted').textContent ?? '').toContain(
      'No safety-flag item is built here',
    )
    expect(screen.getByTestId('cc-07-safety-flag-co-discloser').textContent ?? '').toContain(
      'MOD-FL-B8',
    )
    expect(screen.getByTestId('cc-07-safety-flag-canon-note').textContent ?? '').toContain(
      'does not hold this identifier',
    )
    cleanup()
  })

  it('builds no safety-flag control anywhere on the panel', () => {
    const { container } = render(<FeedbackSignalCapture />)
    for (const control of container.querySelectorAll('button, input, select, textarea')) {
      const name = `${control.textContent ?? ''} ${control.getAttribute('aria-label') ?? ''}`
      expect(/safety flag|quarantine|report a problem/i.test(name), name.trim()).toBe(false)
    }
    cleanup()
  })
})

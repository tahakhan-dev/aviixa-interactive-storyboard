import { describe, it, expect } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { AI_MODE_IDS, aiMode } from '@/ai/modes'
import { decisionRecord } from '@/disclosure/decisions'
import {
  GUIDANCE_ELEMENT_ATTRIBUTE,
  PROVENANCE_CLASS_ATTRIBUTE,
  provenanceViolations,
} from '@/ai/provenance/contract'
import { CoachingView } from '@/frontline/modules/fl-b8/CoachingPanel'
import {
  COACHING_ASSET_PROVENANCE,
  FL_B8_SAFETY_FLAG_DISCLOSURE,
  uniformlyProhibitedRows,
} from '@/frontline/modules/fl-b8/degradation'
import { FL_B8_COLUMNS, type FlB8Column } from '@/frontline/modules/fl-b8/matrix'

/**
 * `MOD-FL-B8`'s overlay AS A RENDERING. The unit suite asks whether the
 * transcription matches the frozen source; this one asks whether the two
 * things that would be safety claims on a tablet actually reach the screen —
 * and whether the two things that would BE the claims are actually absent.
 *
 * WHY EVERY REACH AND EVERY CARD STATE. The card has four reachable states and
 * four agent reaches, and a provenance declaration is exactly the kind of
 * thing that is right on first paint and wrong after a click. The sixth of
 * this build's defect shapes is a fold applied to one render branch of four.
 */

const REACH_BUTTONS = [
  'Connected, agent layer answering',
  'This tablet has no connection',
  'A server-side agent outage',
  'A platform-wide or per-tenant emergency pause',
] as const

function cardRegion(): HTMLElement {
  return screen.getByTestId('fl-b8-card-region')
}

/**
 * Walk the card through every reachable state for the reach in force, calling
 * `check` in each one.
 *
 * IT RETURNS THE STATES IT VISITED RATHER THAN A COUNT, and the caller asserts
 * against the reach. Three of the four reaches draw the authored fallback,
 * which has no controls at all, so exactly one state is reachable in each —
 * asserting "more than one" against all four reds on a correct panel, which is
 * how this helper was written the first time.
 */
function walkCardStates(check: (state: string) => void): readonly string[] {
  const visited: string[] = []
  const record = (): void => {
    const state = cardRegion().getAttribute('data-card-state') ?? ''
    visited.push(state)
    check(state)
  }
  record()
  for (const label of ['Play again', 'Leave it open and carry on', 'Dismiss']) {
    const control = screen.queryByRole('button', { name: label })
    if (control === null) continue
    fireEvent.click(control)
    record()
  }
  return visited
}

describe('exactly one provenance class, in every reach and every card state', () => {
  it('holds across the whole panel for every viewer column', () => {
    for (const column of FL_B8_COLUMNS) {
      const { container, unmount } = render(<CoachingView viewerRole={column} />)
      expect(provenanceViolations(container), column).toEqual([])
      unmount()
    }
  })

  it('holds after every reach change and every card interaction', () => {
    const { container } = render(<CoachingView />)
    const seen: string[] = []
    for (const reach of REACH_BUTTONS) {
      fireEvent.click(screen.getByRole('button', { name: reach }))
      const visited = walkCardStates((state) => {
        expect(provenanceViolations(container), `${reach} · ${state}`).toEqual([])
      })
      seen.push(...visited)
    }
    // The walk really moved, rather than checking one state four times: the
    // connected reach reaches all four of the card's states.
    expect([...new Set(seen)].sort()).toEqual(['dismissed', 'offered', 'replayed', 'viewed'])
    cleanup()
  })

  it('declares the guidance class inside the card region while guidance is shown', () => {
    render(<CoachingView />)
    const region = cardRegion()
    expect(region.getAttribute(GUIDANCE_ELEMENT_ATTRIBUTE)).toBe('MOD-FL-B8 coaching guidance')
    const marks = region.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)
    expect(marks.length).toBe(1)
    expect(marks[0]?.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe(COACHING_ASSET_PROVENANCE)
    cleanup()
  })

  it('claims no class for an empty region once the card is waved away', () => {
    render(<CoachingView />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    const region = cardRegion()
    expect(region.getAttribute('data-card-state')).toBe('dismissed')
    expect(region.hasAttribute(GUIDANCE_ELEMENT_ATTRIBUTE)).toBe(false)
    expect(region.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`).length).toBe(0)
    cleanup()
  })

  it('claims no class for a column the matrix draws no card for', () => {
    render(<CoachingView viewerRole={'READONLY_AUDITOR' satisfies FlB8Column} />)
    const region = cardRegion()
    expect(within(region).getByTestId('fl-b8-no-card-for-role')).toBeTruthy()
    expect(region.hasAttribute(GUIDANCE_ELEMENT_ATTRIBUTE)).toBe(false)
    cleanup()
  })

  it('draws no agent badge and no agent name on the card, in any reach', () => {
    render(<CoachingView />)
    for (const reach of REACH_BUTTONS) {
      fireEvent.click(screen.getByRole('button', { name: reach }))
      expect(cardRegion().textContent ?? '', reach).not.toContain('Prevention Agent')
      expect(within(cardRegion()).queryByTestId('provenance-agent'), reach).toBeNull()
    }
    cleanup()
  })
})

describe('the coaching card carries the controls SB-AI-003 names, and no others', () => {
  it('offers replay and dismiss', () => {
    render(<CoachingView />)
    expect(within(cardRegion()).getByRole('button', { name: 'Play again' })).toBeTruthy()
    expect(within(cardRegion()).getByRole('button', { name: 'Dismiss' })).toBeTruthy()
    cleanup()
  })

  it('offers no way to flag, report, rate or quarantine anything, in any reach', () => {
    const { container } = render(<CoachingView />)
    for (const reach of REACH_BUTTONS) {
      fireEvent.click(screen.getByRole('button', { name: reach }))
      for (const control of container.querySelectorAll('button, input, select, textarea')) {
        const name = `${control.textContent ?? ''} ${control.getAttribute('aria-label') ?? ''}`
        expect(
          /report a problem|flag|unsafe|rate this|quarantine/i.test(name),
          `${reach}: "${name.trim()}"`,
        ).toBe(false)
      }
    }
    cleanup()
  })
})

describe('the conflict is disclosed rather than resolved', () => {
  it('renders both readings of DEC-SAFETY-001 on the screen', () => {
    render(<CoachingView />)
    const disclosure = screen.getByTestId('fl-b8-safety-flag-disclosure')
    const rendered = within(disclosure)
      .getAllByTestId('fl-b8-safety-flag-reading')
      .map((node) => node.textContent ?? '')
    expect(rendered.length).toBe(FL_B8_SAFETY_FLAG_DISCLOSURE.readings.length)
    const all = rendered.join(' ')
    expect(all).toContain('carries no feedback control at all')
    expect(all).toContain('visually and functionally distinct from the dismiss control')
    cleanup()
  })

  it('states which reading is demonstrated, why, and that neither is adopted', () => {
    render(<CoachingView />)
    const adopted = screen.getByTestId('fl-b8-safety-flag-adopted').textContent ?? ''
    expect(adopted).toContain('Neither reading is adopted')
    expect(adopted).toContain('DEMONSTRATES')
    expect(adopted).toContain('APP-012')
    expect(screen.getByTestId('fl-b8-safety-flag-consequence').textContent ?? '').toContain(
      'second control',
    )
    cleanup()
  })

  it('renders the pause decision through the shared canon and names no mode on the card', () => {
    const { container } = render(<CoachingView />)
    const pause = screen.getByTestId('fl-b8-pause-disclosure')
    /*
      THE SHARED RENDERER, NOT A LOCAL COPY — checked by comparing what the
      note carries against the record the canon holds, field for field. A local
      re-typing would drift from it and this would go red; a rendering that
      dropped a reading would too.
    */
    const record = decisionRecord('DEC-AIDISCLOSE-001')
    const shown = within(pause).getByRole('note', { name: /DEC-AIDISCLOSE-001/ })
    const text = shown.textContent ?? ''
    expect(text).toContain(record.question)
    expect(text).toContain(record.adopted)
    for (const reading of record.readings) {
      expect(text.includes(reading.text), reading.locator).toBe(true)
      expect(text.includes(reading.locator), reading.locator).toBe(true)
    }

    /*
      NO MODE IS NAMED ANYWHERE THE DISCLOSURE IS NOT — and the exclusion is
      the finding rather than a convenience. The canon record's own readings
      cite `AIMODE-13` and `AIMODE-14` by identifier, because that is where the
      corroborating matrix rows are. So a check over the whole panel reds on a
      panel that is behaving correctly, and the claim worth making is narrower:
      outside the disclosure the surface names no mode at all, and nowhere on
      it does a mode's worker-visible label appear as a chip.
    */
    for (const reach of REACH_BUTTONS) {
      fireEvent.click(screen.getByRole('button', { name: reach }))
      const outside = (container.textContent ?? '').split(pause.textContent ?? ' ').join(' ')
      for (const id of AI_MODE_IDS) {
        expect(outside.includes(id), `${reach}: ${id} outside the disclosure`).toBe(false)
      }
      for (const id of AI_MODE_IDS) {
        expect(outside, `${reach}: ${id} label`).not.toContain(aiMode(id).workerLabel)
      }
    }
    cleanup()
  })

  it('keeps the module’s existing shows-nothing statement beside the decision, not alone', () => {
    render(<CoachingView />)
    const statement = screen.getByTestId('fl-b8-pause-existing-statement').textContent ?? ''
    expect(statement).toContain('does not announce agent failures to the worker')
    expect(statement).toContain('one side of an open decision')
    cleanup()
  })
})

describe('the rows that draw no control draw none', () => {
  it('renders each as a sentence with no control of any kind beside it', () => {
    render(<CoachingView />)
    const rendered = screen.getAllByTestId('fl-b8-no-control-row')
    expect(rendered.length).toBe(uniformlyProhibitedRows().length)
    for (const row of rendered) {
      expect(row.querySelectorAll('button, input, select, textarea').length).toBe(0)
      expect(row.querySelector('[aria-disabled="true"], [disabled]')).toBeNull()
      expect(row.textContent ?? '').toContain('no control is drawn')
    }
    cleanup()
  })

  it('names the inverted-polarity dismissal row among them', () => {
    render(<CoachingView />)
    const all = screen
      .getAllByTestId('fl-b8-no-control-row')
      .map((n) => n.textContent ?? '')
      .join(' ')
    expect(all).toContain('Let a dismissal block or delay a step')
    cleanup()
  })
})

describe('the failure-chapter row reaches the screen', () => {
  it('shows the behaviour cell, its parsed outcome, and the module it names', () => {
    render(<CoachingView />)
    const behaviour = screen.getByTestId('fl-b8-ai-behaviour').textContent ?? ''
    expect(behaviour).toContain('MOD-FL-B8')
    expect(behaviour).toContain('Cached read-only while offline')
    expect(screen.getByTestId('fl-b8-ai-outcome').textContent).toBe('cachedReadOnlyOffline')
    cleanup()
  })

  it('names the version seam and its owner rather than inventing a version', () => {
    render(<CoachingView />)
    const seam = screen.getByTestId('fl-b8-version-seam').textContent ?? ''
    expect(seam).toContain('MOD-FL-A6')
    expect(within(screen.getByTestId('fl-b8-card-region')).queryByTestId(
      'provenance-content-version',
    )).toBeNull()
    cleanup()
  })
})

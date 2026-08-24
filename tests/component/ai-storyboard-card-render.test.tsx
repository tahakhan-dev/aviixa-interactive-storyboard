import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { StoryboardCard } from '@/ui/shared/StoryboardCard'
import {
  STORYBOARD_CARD_CLASSIFICATION,
  STORYBOARD_CARD_CLASSIFICATION_REF,
  STORYBOARD_CARD_FIELDS,
  STORYBOARD_CARD_FACTS,
  storyboardCardProvenance,
  type Storyboard,
} from '@/ai/storyboards/contract'
import { PROVENANCE_CLASS_ATTRIBUTE, provenanceViolations } from '@/ai/provenance/contract'
import { JOURNEY_SURFACES, noEffect } from '@/ui/shared/journey'
import { FIXTURE_STORYBOARD } from '../unit/ai-storyboard-contract-fixture.test'

/**
 * Slice 11, wave 4, task 15A — the nineteen-field renderer, against a rendered
 * tree.
 *
 * `tests/unit/ai-storyboard-contract-*.test.ts` prove the contract as data.
 * This file proves the things only a rendered tree can be wrong about:
 *
 *   - A FIELD SILENTLY DROPPED. All nineteen are required present, in schema
 *     order, read out of the DOM rather than out of the projection.
 *   - AN ORDERING REQUIREMENT ASSERTED AS A LABEL. `AC-44A-005` (L92750) says
 *     a presumed-absent capability is declared BEFORE the behaviour is
 *     described. Before is a DOM position, so it is checked as one.
 *   - MORE THAN ONE PROVENANCE CLASS, or the wrong one. Checked with the
 *     shared `provenanceViolations` lint over the real tree, and the class is
 *     asserted to be the resolved one rather than a literal this file repeats.
 *   - A CONTROL WHERE THE SOURCE WANTS NONE. A storyboard card is a reading
 *     surface; it offers no action, and an absence of control is asserted
 *     rather than assumed.
 *   - A CONTRACT BREACH RENDERED AS THOUGH IT WERE FINE. A card whose data
 *     breaks an invariant renders the breach, visibly.
 */

function withFacts(overrides: Partial<Storyboard['facts']>): Storyboard {
  return { ...FIXTURE_STORYBOARD, facts: { ...FIXTURE_STORYBOARD.facts, ...overrides } }
}

describe('the nineteen-field card', () => {
  it('renders every field label, in schema order', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const labels = [...container.querySelectorAll('[data-storyboard-field] dt')].map(
      (node) => node.textContent,
    )
    expect(labels).toEqual(STORYBOARD_CARD_FIELDS.map((field) => field.label))
  })

  it('renders every field\'s content, none of them blank', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    for (const field of STORYBOARD_CARD_FIELDS) {
      const row = container.querySelector(`[data-storyboard-field="${field.id}"] dd`)
      expect(row, field.id).not.toBeNull()
      expect(row!.textContent?.trim(), field.id).not.toBe('')
    }
  })

  it('names the card by its identifier and pins the locator it is read from', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    expect(container.textContent).toContain('SB-AI-01')
    expect(container.textContent).toContain('L92791')
  })

  it('renders the compound fallback key, never the bare literal alone', () => {
    // `FB-AI-01` on its own names four different contracts. A card showing the
    // literal without its chapter is a card that has not disambiguated.
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const key = container.querySelector('[data-testid="storyboard-fallback-key"]')
    expect(key).not.toBeNull()
    expect(key!.textContent).toContain('44A.1')
    expect(key!.textContent).toContain('FB-AI-01')
  })

  it('offers no control, because a storyboard card is a reading surface', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    expect(container.querySelectorAll('button, input, select, textarea')).toHaveLength(0)
  })
})

describe('the five-surface reaction', () => {
  it('renders all five surfaces, in the source\'s order', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const names = [...container.querySelectorAll('[data-storyboard-surface] dt')].map(
      (node) => node.textContent,
    )
    expect(names).toEqual(JOURNEY_SURFACES.map((surface) => surface.name))
  })

  it('renders "No direct effect" WITH the reason, never a blank cell', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const studio = container.querySelector('[data-storyboard-surface="STU"] dd')
    expect(studio!.textContent).toContain('No direct effect')
    expect(studio!.textContent).toContain('the fixture states no Studio effect')
  })

  it('renders the breach where a reason is blank, rather than a label alone', () => {
    // The defect the tenth invariant exists for, seen the way a reader sees
    // it: `noEffect('', ref)` compiles and renders "No direct effect — " with
    // nothing after the dash. A rendered tree is the only place this looks
    // like what it is.
    const storyboard: Storyboard = {
      ...FIXTURE_STORYBOARD,
      surfaces: { ...FIXTURE_STORYBOARD.surfaces, STU: noEffect('', 'L92818') },
    }
    const { container } = render(<StoryboardCard storyboard={storyboard} />)
    const studio = container.querySelector('[data-storyboard-surface="STU"] dd')
    expect(studio!.textContent).toContain('No direct effect')
    const alert = container.querySelector('[role="alert"]')
    expect(alert, 'a blank reason must render as a breach, not as a label').not.toBeNull()
    expect(alert!.textContent).toContain('Standards and Operations Studio')
    expect(alert!.textContent).toContain('L92664')
  })
})

describe('the field set\'s classification, L92766', () => {
  it('renders the chapter\'s own classification and the row it is read from', () => {
    // The citation is reachable by a reader rather than exported and unread.
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const line = container.querySelector('[data-testid="storyboard-field-set-classification"]')
    expect(line).not.toBeNull()
    expect(line!.textContent).toContain(STORYBOARD_CARD_CLASSIFICATION)
    expect(line!.textContent).toContain(STORYBOARD_CARD_CLASSIFICATION_REF)
    expect(STORYBOARD_CARD_CLASSIFICATION_REF).toBe('L92766')
  })
})

describe('AC-44A-005 — a presumed-absent capability is declared before the behaviour', () => {
  it('renders the statement above the first field row', () => {
    const storyboard: Storyboard = {
      ...FIXTURE_STORYBOARD,
      absentCapability: {
        statement: 'This storyboard presumes a capability absent from the Statement of Work.',
        sourceRef: 'L92750',
      },
    }
    const { container } = render(<StoryboardCard storyboard={storyboard} />)
    const notice = container.querySelector('[data-testid="storyboard-absent-capability"]')
    const firstField = container.querySelector('[data-storyboard-field]')
    expect(notice).not.toBeNull()
    expect(firstField).not.toBeNull()
    // DOCUMENT_POSITION_FOLLOWING === 4: the notice precedes the first field.
    expect(notice!.compareDocumentPosition(firstField!) & 4).toBe(4)
  })

  it('renders nothing where the storyboard presumes nothing absent', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    expect(container.querySelector('[data-testid="storyboard-absent-capability"]')).toBeNull()
  })
})

describe('the provenance class', () => {
  it('emits exactly one, and it is the resolved class rather than a repeated literal', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const marks = container.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)
    expect(marks).toHaveLength(1)
    expect(marks[0]!.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe(storyboardCardProvenance())
  })

  it('resolves to approved content, never to live artificial intelligence', () => {
    // The absolute rule: cached approved guidance and deterministic rules are
    // never labelled live artificial intelligence. A storyboard card is
    // transcribed, approved, released-earlier content — no model in the path.
    expect(STORYBOARD_CARD_FACTS.producedByModelThisSession).toBeNull()
    expect(storyboardCardProvenance()).not.toBe('PROV-1')
    expect(storyboardCardProvenance()).toBe('PROV-3')
  })

  it('passes the shared exactly-one lint over the whole rendered tree', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    expect(provenanceViolations(container)).toEqual([])
  })

  it('carries the locator as the content version, which PROV-3 permits', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    const version = container.querySelector('[data-testid="provenance-content-version"]')
    expect(version!.textContent).toContain('L92791')
  })
})

describe('a card whose data breaks an invariant', () => {
  it('renders the breach rather than the card as though it were sound', () => {
    const defect = withFacts({ connectivity: 'knownOffline', showsRetryControl: true })
    const { container } = render(<StoryboardCard storyboard={defect} />)
    const alert = container.querySelector('[role="alert"]')
    expect(alert).not.toBeNull()
    expect(alert!.textContent).toContain('theatre')
    expect(alert!.textContent).toContain('L92843')
  })

  it('renders no alert for a sound card', () => {
    const { container } = render(<StoryboardCard storyboard={FIXTURE_STORYBOARD} />)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('still renders all nineteen fields, so a breach hides nothing', () => {
    const defect = withFacts({ contentOrigin: 'modelGenerated' })
    const { container } = render(<StoryboardCard storyboard={defect} />)
    expect(container.querySelectorAll('[data-storyboard-field]')).toHaveLength(
      STORYBOARD_CARD_FIELDS.length,
    )
  })
})

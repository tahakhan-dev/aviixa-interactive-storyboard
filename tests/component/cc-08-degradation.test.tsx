import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { crossMatrixContradiction } from '@/ai/agents/contracts'
import { PROVENANCE_CLASS_IDS, provenanceClass } from '@/ai/provenance/classes'
import {
  GUIDANCE_ELEMENT_ATTRIBUTE,
  PROVENANCE_CLASS_ATTRIBUTE,
  provenanceViolations,
} from '@/ai/provenance/contract'
import { AgentActivityPanel } from '@/surfaces/cc/modules/cc-08/AgentActivityPanel'
import {
  CC08_DEGRADATION_PROVENANCE,
  CC08_DEGRADATION_SEAMS,
  CC08_NO_AI_CLAIMS,
  CC08_PAUSE_BANNER_STATEMENTS,
  cc08HealthFlagRollUpLeak,
  cc08PauseStates,
} from '@/surfaces/cc/modules/cc-08/degradation'

/**
 * `MOD-CC-08`'S DEGRADATION OVERLAY AS A RENDERING.
 *
 * The unit suite next door asks whether the overlay's model matches the frozen
 * source. This one asks what a client SEES, and on this overlay the two come
 * apart in one place that matters: the model can hold two distinguishable
 * pause states and the screen can still show one, if the message is drawn from
 * the mode rather than from the catalogue. `AC-42-303` is a property of the
 * SCREEN, so it is asserted on the screen.
 *
 * ── BEATEN-GATE SHAPES ACTIVE HERE ───────────────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS. The two pause banners sit in one
 *    list, so asserting "the platform message is on the page" would pass with
 *    both messages inside one card and the scopes swapped. Every assertion
 *    below is scoped to the card carrying that scope's own `data-testid`, and
 *    each card is checked to NOT carry the other scope's message.
 *  - A PRESENCE CHECK IS SATISFIED BY A DISABLED CONTROL. `AC-CC-301` allows
 *    no control on this panel that acts on an agent, and a pause resume is
 *    such an act, so the overlay is asserted to add no button at all rather
 *    than to add a disabled one.
 *  - AN ITERATION OVER AN ARRAY CAN ONLY EVER PASS. The spelling list is
 *    iterated, so it is ALSO asserted non-empty and each entry is looked up by
 *    its own line rather than by index.
 */

afterEach(cleanup)

const RENDER = () => render(<AgentActivityPanel viewerRole="SUPERVISOR" />)

/* ── the pause banners ─────────────────────────────────────────────────── */

describe('the pause banner', () => {
  it('draws one card per scope, each carrying its own message and not the other', () => {
    RENDER()
    const states = cc08PauseStates()
    expect(states.length).toBeGreaterThan(1)
    for (const state of states) {
      const card = screen.getByTestId(`cc-08-pause-${state.scope}`)
      expect(card.getAttribute('data-mode')).toBe(state.mode.id)
      expect(card.getAttribute('data-failure')).toBe(state.failure.id)
      // `getByText` throws when absent, so the message really is its own node
      // and is not welded out of two neighbouring ones.
      expect(within(card).getByText(state.tenantWebMessage).textContent).toBe(
        state.tenantWebMessage,
      )
      // Scoped, so the two cards cannot satisfy each other's assertion.
      for (const other of states) {
        if (other.scope === state.scope) continue
        expect(card.textContent).not.toContain(other.tenantWebMessage)
      }
    }
  })

  it('shows the two pauses different words, which is the whole of AC-42-303 here', () => {
    RENDER()
    const rendered = cc08PauseStates().map((state) =>
      screen.getByTestId(`cc-08-pause-${state.scope}`).textContent ?? '',
    )
    expect(new Set(rendered).size).toBe(rendered.length)
  })

  it('states on screen that the mode contract matrix separates them on nothing', () => {
    RENDER()
    const note = screen.getByTestId('cc-08-ac-42-303')
    expect(note.textContent).toContain('no column at all')
    expect(note.textContent).toContain('the failure catalogue')
    // And the shared worker label is named, so a reader can see why the mode
    // chip cannot be the discriminator.
    expect(note.textContent).toContain('AIMODE-13')
    expect(note.textContent).toContain('AIMODE-14')
  })

  it('carries the operational band and no manufacturing severity component', () => {
    RENDER()
    for (const state of cc08PauseStates()) {
      const card = screen.getByTestId(`cc-08-pause-${state.scope}`)
      expect(card.textContent).toContain(state.operationalSeverity)
      // `AC-43-103`: the two severity worlds share no rendering. Nothing the
      // slice-6 and slice-9 severity components emit appears in this card.
      expect(card.querySelector('[data-severity]')).toBeNull()
      expect(card.querySelector('[data-severity-symbol]')).toBeNull()
    }
  })

  it('adds no control at all — a resume is not an act of this panel', () => {
    const { container } = RENDER()
    const banners = screen.getByTestId('cc-08-pause-banners')
    expect(within(banners).queryAllByRole('button')).toEqual([])
    expect(banners.querySelectorAll('input, select, textarea')).toHaveLength(0)
    // And the pause section adds no link away either: the resume lives on the
    // Super Admin console and this panel points at no route for it.
    expect(within(banners).queryAllByRole('link')).toEqual([])
    expect(container).toBeTruthy()
  })
})

/* ── the spellings ─────────────────────────────────────────────────────── */

describe('the banner spellings on screen', () => {
  it('renders every spelling with its own line and its own scope', () => {
    RENDER()
    expect(CC08_PAUSE_BANNER_STATEMENTS.length).toBeGreaterThan(0)
    for (const statement of CC08_PAUSE_BANNER_STATEMENTS) {
      const item = screen.getByTestId(`cc-08-pause-spelling-${statement.line}`)
      expect(item.textContent).toContain(statement.text)
      expect(item.textContent).toContain(`L${statement.line}`)
      if (statement.scope === null) {
        expect(item.textContent).toContain('not stated by this line')
      } else {
        expect(item.textContent).toContain(statement.scope)
      }
    }
  })

  it('says which spelling its own table calls exact, and does not correct the others', () => {
    RENDER()
    const exact = CC08_PAUSE_BANNER_STATEMENTS.filter((s) => s.labelledExactBySource)
    expect(exact.length).toBeGreaterThan(0)
    for (const statement of CC08_PAUSE_BANNER_STATEMENTS) {
      const item = screen.getByTestId(`cc-08-pause-spelling-${statement.line}`)
      expect(item.textContent?.includes('labelled an exact user-visible message')).toBe(
        statement.labelledExactBySource,
      )
    }
  })

  it('names the scopeless spelling rather than filling its scope in', () => {
    RENDER()
    const note = screen.getByTestId('cc-08-scopeless-spelling')
    expect(note.textContent).toContain('L48474')
    expect(note.textContent).toContain('does not add a scope the line does not carry')
  })
})

/* ── provenance ────────────────────────────────────────────────────────── */

describe('the provenance of the degradation state', () => {
  it('marks the state with the computed class and never as live artificial intelligence', () => {
    RENDER()
    const mark = screen.getByTestId('cc-08-degradation-provenance')
    const marked = mark.querySelector(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)
    expect(marked).not.toBeNull()
    expect(marked!.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe(CC08_DEGRADATION_PROVENANCE)
    expect(mark.textContent).toContain(provenanceClass(CC08_DEGRADATION_PROVENANCE).markerText)
    // The absolute rule at L89439, checked as an absence on the rendered text.
    expect(mark.textContent).not.toContain('Live artificial intelligence')
  })

  it('emits exactly one class from the degradation element, and never PROV-1 anywhere', () => {
    // THIS TEST FIRST ASSERTED THE WHOLE PANEL EMITTED ONE CLASS AND WENT RED
    // ON `PROV-4`. That was the test being wrong, not the panel: the rule is
    // that no rendering path emits more than one, and the panel has two paths
    // — this overlay's degradation state, and the deterministic boundary it
    // mounts, whose cells are deterministic rules and are therefore `PROV-4`
    // by the contract's own resolution. Asserting one class panel-wide would
    // have forced the boundary to be mislabelled.
    const { container } = RENDER()
    const own = [
      ...screen
        .getByTestId('cc-08-degradation-provenance')
        .querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`),
    ].map((el) => el.getAttribute(PROVENANCE_CLASS_ATTRIBUTE))
    expect(own.length).toBeGreaterThan(0)
    expect(new Set(own)).toEqual(new Set([CC08_DEGRADATION_PROVENANCE]))

    const all = [...container.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)].map((el) =>
      el.getAttribute(PROVENANCE_CLASS_ATTRIBUTE),
    )
    for (const emitted of all) {
      // A real member of the closed set, never an invented string.
      expect(PROVENANCE_CLASS_IDS).toContain(emitted)
      // The absolute rule: nothing on a panel about absent agents is live
      // artificial intelligence, under any failure condition.
      expect(emitted).not.toBe('PROV-1')
    }
  })

  it('breaks no rule of the exactly-one lint over the rendered tree', () => {
    const { container } = RENDER()
    expect(provenanceViolations(container)).toEqual([])
    // The lint is not vacuous here: the panel really does declare a guidance
    // element, so there is something for it to inspect.
    expect(container.querySelectorAll(`[${GUIDANCE_ELEMENT_ATTRIBUTE}]`).length).toBeGreaterThan(0)
  })
})

/* ── the deterministic boundary ────────────────────────────────────────── */

describe('the deterministic boundary under the banner', () => {
  it('is mounted, which is what makes the banner claim checkable', () => {
    RENDER()
    const holder = screen.getByTestId('cc-08-deterministic-boundary')
    expect(holder.querySelector('[data-deterministic-boundary]')).not.toBeNull()
  })
})

/* ── the roll-up leak ──────────────────────────────────────────────────── */

describe('the roll-up leak on screen', () => {
  it('renders both cells with their own lines and says they differ', () => {
    RENDER()
    const leak = cc08HealthFlagRollUpLeak()
    const block = screen.getByTestId('cc-08-rollup-leak')
    expect(block.getAttribute('data-tokens-differ')).toBe(String(leak.tokensDiffer))
    expect(block.textContent).toContain(leak.flags.row.capability)
    expect(block.textContent).toContain(leak.rollUp.row.capability)
    expect(block.textContent).toContain(leak.flags.cellText)
    expect(block.textContent).toContain(leak.rollUp.cellText)
    expect(block.textContent).toContain(leak.flags.row.sourceRef)
    expect(block.textContent).toContain(leak.rollUp.row.sourceRef)
  })

  it('says the column is reached by the header word, naming both matrix orders', () => {
    RENDER()
    const block = screen.getByTestId('cc-08-rollup-leak')
    expect(block.textContent).toContain('chapter 44 runs Worker first')
  })
})

/* ── the contradictions ────────────────────────────────────────────────── */

describe('the cross-chapter contradictions on screen', () => {
  it('renders every reading of both, each with its own line', () => {
    RENDER()
    for (const id of [
      'tenant-admin-and-the-ai-degradation-state',
      'switch-an-agent-on-or-off',
    ]) {
      const record = crossMatrixContradiction(id)
      const block = screen.getByTestId(`cc-08-contradiction-${id}`)
      expect(record.readings.length).toBeGreaterThan(1)
      for (const reading of record.readings) {
        expect(block.textContent, `${id} · ${reading.sourceRef}`).toContain(reading.sourceRef)
        expect(block.textContent).toContain(reading.reading)
      }
      expect(block.textContent).toContain('Adopted: nothing')
    }
  })

  it('renders the corrected line and never the off-by-one both briefs carried', () => {
    RENDER()
    const block = screen.getByTestId('cc-08-contradiction-tenant-admin-and-the-ai-degradation-state')
    expect(block.textContent).toContain('L91768')
    // L91767 appears only inside the record's own warning that it is the wrong
    // line, never as a reading's locator — so the check is on the cell markup.
    const locators = [...block.querySelectorAll('code')].map((el) => el.textContent)
    expect(locators).not.toContain('L91767')
  })

  it('names each reading its column and the header that orders that column', () => {
    RENDER()
    const block = screen.getByTestId('cc-08-contradiction-switch-an-agent-on-or-off')
    // The two headers run in opposite orders and both are named on screen, so
    // a reader can see the index was not carried between them.
    expect(block.textContent).toContain('L37664')
    expect(block.textContent).toContain('L91761')
    expect(block.textContent).toContain('prose rather than a matrix cell')
  })
})

/* ── the no-artificial-intelligence claims and the seams ───────────────── */

describe('what the panel says with no agents, and what it leaves open', () => {
  it('quotes each claim with its line', () => {
    RENDER()
    expect(CC08_NO_AI_CLAIMS.length).toBeGreaterThan(0)
    for (const claim of CC08_NO_AI_CLAIMS) {
      const item = screen.getByTestId(`cc-08-no-ai-${claim.id}`)
      expect(item.textContent).toContain(claim.claim)
      expect(item.textContent).toContain(`L${claim.line}`)
    }
  })

  it('renders every seam with its owner', () => {
    RENDER()
    expect(CC08_DEGRADATION_SEAMS.length).toBeGreaterThan(0)
    for (const seam of CC08_DEGRADATION_SEAMS) {
      const item = screen.getByTestId(`cc-08-degradation-seam-${seam.id}`)
      expect(item.textContent).toContain(seam.what)
      expect(item.textContent).toContain(seam.owner)
    }
  })
})

/* ── the overlay does not disturb what slice 9 shipped ─────────────────── */

describe('the module slice 9 shipped', () => {
  it('still renders its matrix, its trace boundary and its divergences', () => {
    RENDER()
    // `getByTestId` throws when absent, so each call is the assertion. The
    // returned node is checked to be attached, because a detached one would
    // still be returned by a query over a detached container.
    for (const id of [
      'cc-08-matrix',
      'cc-08-trace-boundary',
      'cc-08-status',
      'cc-08-recheck-frozen',
    ]) {
      expect(screen.getByTestId(id).isConnected, id).toBe(true)
    }
  })
})

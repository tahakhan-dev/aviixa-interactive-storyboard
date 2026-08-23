import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { RoleId } from '@/domain/roles'
import { ownersOf } from '@/ai/fallbacks/registry'
import { provenanceViolations } from '@/ai/provenance/contract'
import { LearnedChangeApprovals } from '@/surfaces/cc/modules/cc-06/LearnedChangeApprovals'
import { CC06_MATRIX } from '@/surfaces/cc/modules/cc-06/matrix'
import {
  CC06_DEGRADATION,
  CC06_LANEA_SEAM,
  CC06_REVERSE_CONTROL,
  cc06DegradationProvenance,
} from '@/surfaces/cc/modules/cc-06/degradation'

/**
 * `MOD-CC-06`'S ARTIFICIAL-INTELLIGENCE OVERLAY, AS A RENDERING.
 *
 * The unit suite asks whether the overlay's model matches the frozen source.
 * This one asks what a client SEES, because the whole task comes apart in the
 * rendering rather than in the model:
 *
 *  - A REVERSE CONTROL THE SOURCE REQUIRES CAN BE LOST BY OMISSION, and an
 *    omission looks identical to a considered absence from outside. So the
 *    control's PRESENCE is asserted, by accessible name, on the mounted panel.
 *  - IT CAN EQUALLY BE LOST BY BEING GRANTED. The Quality Manager holds every
 *    other decision on this module, so a rendering that read the reversal off
 *    the Lane B rows by analogy would look right and would settle an open
 *    decision by building it. The panel is rendered AS the Quality Manager and
 *    the control is asserted still disabled.
 *
 * ── BEATEN-GATE SHAPES ACTIVE HERE, ALL PREVIOUSLY SHIPPED IN THIS BUILD ──
 *
 *  - `Button` uses `aria-disabled`, not the `disabled` attribute, so a check
 *    that asserts only PRESENCE passes on a live button. Every disabledness
 *    assertion below reads `aria-disabled` off the control itself.
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that the disabled
 *    control carries its identifier passes when the paragraph beside it does.
 *    The reason is resolved through `aria-describedby` off the control, with
 *    `hidden === false` asserted, as the sibling suite established.
 *  - A LIST RENDERED FROM THE SAME ARRAY THE TEST ITERATES CAN ONLY PASS.
 *    The fallback owners are taken from the shared registry rather than from
 *    the module's own copy, so a module that dropped one goes red.
 */

afterEach(cleanup)

const AS_QM: RoleId = 'QUALITY_MANAGER'
const AS_SUPERVISOR: RoleId = 'SUPERVISOR'

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

/** The reverse control, by its accessible name, inside its own region. */
function reverseControl(): HTMLElement {
  const region = screen.getByTestId('cc-06-lane-a-reversal')
  const button = region.querySelector('button')
  expect(button, 'the reverse control must be a control, not a sentence').not.toBeNull()
  return button as HTMLElement
}

describe('the reverse control is drawn, because the source states the capability', () => {
  // FAILS IF: the control is omitted. An omission is what the storyboard names
  // as the defect — "a property with no control is a claim rather than a
  // feature" — and it is the failure mode that looks like nothing at all.
  // PLANTED: deleted the `<WriteControl>` element from the reversal region in
  //   `LearnedChangeApprovals.tsx`, leaving the region and its prose — which
  //   is what an omission actually looks like: the words stay, the control
  //   goes.
  // RED: "AssertionError: the reverse control must be a control, not a
  //   sentence: expected null not to be null", on this test and the two
  //   below. RESTORED.
  it('renders a control carrying the source’s own name for the act', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    expect(reverseControl().textContent).toContain(CC06_REVERSE_CONTROL.label)
  })

  // FAILS IF: the control becomes actionable for the role that holds every
  // other decision on this module. This is the whole trap: the Quality
  // Manager is `Allowed` on approve, decline and the queue, and reading the
  // reversal off those by analogy would settle DEC-LANEA-001 by building it.
  // PLANTED: swapped the handed-in decision for `allow('BASE_ROLE', […])`.
  // RED: "AssertionError: expected null to be 'true' // Object.is equality"
  //   — an enabled button carries no `aria-disabled` at all, which is why
  //   presence alone would not have caught this. RESTORED.
  it('stays disabled for the Quality Manager, who holds every other decision here', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    expect(reverseControl().getAttribute('aria-disabled')).toBe('true')
  })

  // FAILS IF: the disabled control stops naming the decision that disables
  // it. A disabled control with no identifier is indistinguishable from a
  // control that is broken, and the identifier is what makes it answerable.
  // PLANTED (first attempt): removed `${openDecision}` from the explanation
  //   in `cc06ReversalDecision`. 10 passed — INSUFFICIENT, because
  //   `WriteControl` concatenates `conditionToEnable` after the explanation
  //   and that string named the identifier too. The gate was right; the
  //   plant was not.
  // PLANTED: removed it from the explanation AND the condition.
  // RED: "AssertionError: expected 'Who may reverse a Lane A refinement i…'
  //   to contain 'DEC-LANEA-001'". RESTORED.
  it('names the open decision in the reason, off the control itself', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    expect(reasonOf(reverseControl()).textContent).toContain(CC06_REVERSE_CONTROL.openDecision)
  })

  // FAILS IF: the panel renders one side of the authority question and not
  // the other. The source contradicts itself — the storyboard says no
  // authority is stated and a Studio module's matrix states one — and this
  // build discloses both rather than choosing. Both are asserted by their
  // OWN locators, so dropping either goes red.
  // THIS TEST DID NOT FIRE in its first form. It iterated
  // `CC06_REVERSE_CONTROL.readings` — the same array the panel renders from —
  // so dropping a reading dropped the expectation with it and ten stayed
  // green. That is the vacuous-iteration shape this build has shipped before.
  // The two locators are now named here as literals, because a test that
  // asks the subject what to expect is asking the wrong party.
  // PLANTED: dropped the second entry from `CC06_REVERSE_CONTROL.readings`.
  // RED (first form): 10 passed — the plant walked past it.
  // RED (this form): "AssertionError: expected '…' to contain 'L34196'".
  //   RESTORED.
  it('renders every reading of the authority question with its locator', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    const rendered = screen
      .getAllByTestId(/^cc-06-lane-a-reading-/)
      .map((el) => el.textContent ?? '')
      .join(' · ')

    // The storyboard, which says no authority is stated.
    expect(rendered).toContain('L87729')
    // The Studio module's matrix row, which states one. Both, or neither is
    // disclosed and the panel has silently picked a side.
    expect(rendered).toContain('L34196')
  })
})

describe('the inverted-polarity row gets no control, in any role', () => {
  // FAILS IF: "Turn learning off" ever acquires a control. The capability it
  // names is itself a NEGATIVE, so its prohibition means the behaviour must
  // not occur; drawing it as a disabled control would invent the affordance
  // and invite the belief that a sufficiently privileged account could reach
  // it. Asserted across both roles that reach this surface, because a
  // per-role branch is how a control appears for one viewer only.
  // PLANTED: added a second `<WriteControl label={cc06Row(6).capability} …>`
  //   beside the reversal control — the exact mistake the trap describes.
  // RED: "AssertionError: expected [ Array(1) ] to have a length of +0 but
  //   got 1". RESTORED.
  it('draws no control named for the negative capability', () => {
    const inverted = CC06_MATRIX.find((r) => r.capability === 'Turn learning off')
    expect(inverted).toBeDefined()

    for (const role of [AS_QM, AS_SUPERVISOR]) {
      cleanup()
      const { container } = render(<LearnedChangeApprovals viewerRole={role} />)
      const named = [...container.querySelectorAll('button')].filter((b) =>
        (b.textContent ?? '').includes(inverted!.capability),
      )
      expect(named).toHaveLength(0)
    }
  })
})

describe('the degradation contract renders resolved, with every rival owner', () => {
  // FAILS IF: the panel shows the resolved contract and hides the collision.
  // The register row names the literal bare, four chapters own it, and a
  // reader holding the bare literal cannot tell which contract they have. The
  // owners are read from the SHARED registry, not from the module's copy, so
  // a module that dropped one goes red rather than agreeing with itself.
  // PLANTED: rendered only `CC06_DEGRADATION.resolved` instead of the full
  //   owner list, which is what showing the collision resolved but not shown
  //   would look like.
  // RED: "TestingLibraryElementError: Unable to find an element by:
  //   [data-testid=\"cc-06-fb-ai-01-owner-40.1\"]". RESTORED.
  it('renders one row per owner of the bare literal', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    const owners = ownersOf(CC06_DEGRADATION.identifier)
    expect(owners.length).toBeGreaterThan(1)
    for (const owner of owners) {
      const row = screen.getByTestId(`cc-06-fb-ai-01-owner-${owner.chapter}`)
      expect(row.textContent).toContain(owner.contract)
      expect(row.textContent).toContain(owner.locator)
    }
  })

  // FAILS IF: the panel stops saying WHICH owner it resolved, or resolves a
  // different one. An absence with no reason is the shape of an oversight,
  // and a collision shown with no resolution is the same thing.
  // PLANTED: hard-coded the rendered `data-chapter` to '40.1'.
  // RED: "AssertionError: expected '40.1' to be '24' // Object.is equality".
  //   RESTORED.
  it('says which owner it resolved and on what key', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    const resolved = screen.getByTestId('cc-06-fb-ai-01-resolved')
    expect(resolved.getAttribute('data-chapter')).toBe(CC06_DEGRADATION.resolved.chapter)
    expect(resolved.textContent).toContain(CC06_DEGRADATION.registerRow)
    expect(resolved.textContent).toContain(CC06_DEGRADATION.resolved.contract)
  })
})

describe('the panel emits exactly one provenance class, and it is an absence', () => {
  // FAILS IF: any rendering path in this panel emits two classes, nests one
  // mark inside another, or declares a guidance element with no class. This
  // is the shared build-time lint run over real rendered output rather than
  // over a fixture.
  // PLANTED: wrapped the section's own mark in a second element carrying
  //   `data-provenance-class`, which is how an element ends up with two and
  //   cannot be seen by looking at either component alone.
  // RED: "AssertionError: expected [ Array(1) ] to strictly equal []".
  //   RESTORED.
  it('breaks none of the provenance contract on the rendered tree', () => {
    const { container } = render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    expect(provenanceViolations(container)).toStrictEqual([])
  })

  // FAILS IF: this panel ever labels its own deterministic rendering as live
  // artificial intelligence. It reports an absence and an open decision; the
  // class it emits is resolved by the shared contract from its facts, and the
  // marker text is the class's own rather than a sentence written here.
  // PLANTED: changed the `classId` passed to the mark to 'PROV-1'.
  // RED: "AssertionError: expected 'PROV-1' to be 'PROV-6' // Object.is
  //   equality". RESTORED.
  it('marks the degradation panel with the class the contract resolved', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    const mark = screen
      .getByTestId('cc-06-degradation')
      .querySelector('[data-provenance-class]')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('data-provenance-class')).toBe(cc06DegradationProvenance())
  })
})

describe('the seam is on the screen, not only in a comment', () => {
  // FAILS IF: the seam stops naming the criterion that opens it or the files
  // that can close it. A declared seam nobody picks up is a defect, and a
  // seam recorded only in a source comment is not declared to anyone.
  // The two paths are named here as literals rather than iterated off
  // `CC06_LANEA_SEAM.owners`, for the reason the readings test records: a
  // loop over the subject's own array cannot see the subject drop an entry.
  // PLANTED: removed the owners list from the rendered seam block.
  // RED: "AssertionError: expected 'What this module could not close, and…'
  //   to contain 'src/surfaces/cc/modules/cc-06/LearningReadView.tsx'".
  //   Re-planted by emptying `CC06_LANEA_SEAM.owners`, which gave the same
  //   red — the literals hold under both. RESTORED.
  it('renders the criterion, the tension and every owner', () => {
    render(<LearnedChangeApprovals viewerRole={AS_QM} />)
    const seam = screen.getByTestId('cc-06-lane-a-seam')
    expect(seam.textContent).toContain(CC06_LANEA_SEAM.criterion)
    expect(seam.textContent).toContain(CC06_LANEA_SEAM.criterionRef)

    // The shared read view, whose own prohibition disagrees with the
    // criterion, and the canon, which carries no record for this decision.
    expect(seam.textContent).toContain('src/surfaces/cc/modules/cc-06/LearningReadView.tsx')
    expect(seam.textContent).toContain('src/disclosure/decisions.ts')

    expect(seam.textContent).toContain(CC06_LANEA_SEAM.unestablished)
  })
})

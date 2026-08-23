import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  PROVENANCE_CLASSES,
  PROVENANCE_CLASS_IDS,
  provenanceClass,
  type ProvenanceClassId,
} from '@/ai/provenance/classes'
import {
  GUIDANCE_ELEMENT_ATTRIBUTE,
  PROVENANCE_CLASS_ATTRIBUTE,
  contractPermits,
  provenanceViolations,
  resolveProvenance,
} from '@/ai/provenance/contract'
import type { AiAgentId } from '@/ai/agents/roster'

/**
 * Slice 11, wave 0, task 2 — the provenance mark, against rendered output.
 *
 * `tests/unit/ai-provenance.test.ts` proves the contract as data. This file
 * proves the things only a rendered tree can be wrong about, and every one of
 * them has been a shipped defect somewhere in this build:
 *
 *   - A PROPERTY ASSERTED ON THE DATA AND NOT ON THE SCREEN. "Visually
 *     disjoint" is a claim about pixels. So the six marks are rendered, every
 *     `class` and `style` attribute is STRIPPED, and they are required to
 *     stay distinguishable — which is what "does not rely on colour alone"
 *     means when it is a test rather than a promise.
 *   - A CONTRACT COLUMN THAT DECORATES RATHER THAN GOVERNS. Each of the three
 *     identity details is passed to all six classes and asserted to render
 *     only where the source's own cell permits it. A prohibition enforced by
 *     asking callers to behave is a prohibition enforced nowhere.
 *   - A LINT THAT CANNOT FAIL. `provenanceViolations` is watched finding each
 *     of the three violations it names, and returning nothing on a clean tree.
 */

const MARK = `[${PROVENANCE_CLASS_ATTRIBUTE}]`

function renderMark(
  classId: ProvenanceClassId,
  extra: {
    agent?: AiAgentId
    contentVersion?: string
    humanIdentity?: string
    statement?: string
  } = {},
): HTMLElement {
  const { container } = render(<ProvenanceMark classId={classId} {...extra} />)
  const mark = container.querySelector(MARK)
  expect(mark, `${classId} rendered no provenance mark at all`).not.toBeNull()
  return mark as HTMLElement
}

/** Every attribute value on the tree that an assistive technology speaks. */
function spokenAttributes(root: Element): readonly string[] {
  const values: string[] = []
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ['aria-label', 'aria-description', 'title', 'alt']) {
      const value = element.getAttribute(name)
      if (value !== null) values.push(value)
    }
  }
  return values
}

/** The tree with every appearance-carrying attribute removed. */
function withoutAppearance(root: Element): Element {
  const clone = root.cloneNode(true) as Element
  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    element.removeAttribute('class')
    element.removeAttribute('style')
  }
  return clone
}

const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim()

describe('the mark renders one class and only one', () => {
  it('carries exactly one known class identifier, for every class', () => {
    for (const id of PROVENANCE_CLASS_IDS) {
      const mark = renderMark(id)
      expect(mark.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe(id)
      expect(mark.querySelectorAll(MARK)).toHaveLength(0)
    }
  })

  it('passes the rendering-contract lint on every class', () => {
    for (const id of PROVENANCE_CLASS_IDS) {
      const { container } = render(<ProvenanceMark classId={id} />)
      expect(provenanceViolations(container), id).toEqual([])
    }
  })

  it('renders the class’s marker text, and the marker text is real text', () => {
    for (const record of PROVENANCE_CLASSES) {
      const mark = renderMark(record.id)
      const marker = mark.querySelector('[data-testid="provenance-marker"]')
      expect(marker, record.id).not.toBeNull()
      expect(normalise(marker!.textContent ?? '')).toBe(record.markerText)
      // NOT AN IMAGE, NOT A GLYPH, NOT AN EMPTY BOX WITH A BORDER. A marker
      // whose text is supplied by an `alt` or an `aria-label` is a marker a
      // sighted reader distinguishes by shape and colour alone.
      expect(marker!.querySelectorAll('img, svg')).toHaveLength(0)
    }
  })

  it('offers nothing to act through — a mark is a label, not a control', () => {
    for (const id of PROVENANCE_CLASS_IDS) {
      const mark = renderMark(id)
      expect(
        mark.querySelectorAll('button, input, select, textarea, [role="button"]'),
        id,
      ).toHaveLength(0)
    }
  })
})

/* ── the disjointness property, on the rendered tree ───────────────────── */

describe('the six treatments are visually disjoint, on screen', () => {
  // Rendered inside each case, not once at collection time: `cleanup` runs
  // after every test, so a tree built in the describe body is detached from
  // the document by the second case that reads it.
  const renderAll = (): readonly HTMLElement[] => PROVENANCE_CLASS_IDS.map((id) => renderMark(id))

  it('gives no two marks the same marker text', () => {
    const markers = renderAll().map((mark) =>
      normalise(mark.querySelector('[data-testid="provenance-marker"]')!.textContent ?? ''),
    )
    expect(new Set(markers).size).toBe(PROVENANCE_CLASS_IDS.length)
  })

  it('keeps them distinguishable with every class and style attribute stripped', () => {
    const rendered = renderAll()
    // THE COLOUR TEST. `class` carries every colour in this build's Tailwind
    // vocabulary and `style` carries any inline one. With both gone, the six
    // marks must still read as six different things — text alone. This build
    // targets WCAG 2.2 AA, and SC 1.4.1 is the reason the assertion is this
    // shape rather than an eyeball comparison of the palette.
    const texts = rendered.map((mark) => normalise(withoutAppearance(mark).textContent ?? ''))
    expect(new Set(texts).size).toBe(PROVENANCE_CLASS_IDS.length)
    for (const text of texts) expect(text.length).toBeGreaterThan(0)
  })

  it('never lets an inline style be the only difference between two marks', () => {
    for (const mark of renderAll()) {
      for (const element of [mark, ...mark.querySelectorAll('*')]) {
        expect(element.getAttribute('style')).toBeNull()
      }
    }
  })
})

/* ── the absolute rule, rendered ───────────────────────────────────────── */

describe('cached guidance and rules are never labelled live artificial intelligence', () => {
  const attribution = /\bAI\b|artificial intelligence|\bagents?\b|\bmodels?\b|assistant/i

  it('puts no artificial-intelligence attribution anywhere in a PROV-3 or PROV-4 mark', () => {
    for (const id of ['PROV-3', 'PROV-4'] as const) {
      // Every detail is passed, INCLUDING the agent the contract prohibits.
      // A caller that hands an agent to cached guidance is exactly the mistake
      // the column exists to stop, so the mistake is made here on purpose.
      const mark = renderMark(id, {
        agent: 'prevention',
        contentVersion: 'v2.1.0',
        humanIdentity: 'Elena, Quality Manager, 15:12',
      })
      expect(normalise(mark.textContent ?? ''), `${id} text`).not.toMatch(attribution)
      for (const spoken of spokenAttributes(mark)) {
        expect(spoken, `${id} spoken attribute`).not.toMatch(attribution)
      }
      expect(mark.querySelector('[data-testid="provenance-agent"]'), id).toBeNull()
    }
  })

  it('spends the word "live" on the one class whose cell allows it', () => {
    const carrying = PROVENANCE_CLASS_IDS.filter((id) =>
      /\blive\b/i.test(normalise(renderMark(id).textContent ?? '')),
    )
    expect(carrying).toEqual(['PROV-1'])
  })
})

/* ── the contract columns govern what renders ──────────────────────────── */

describe('each identity detail renders only where the source’s cell permits', () => {
  const details = [
    { column: 'carriesModelOrAgentIdentity', testid: 'provenance-agent' },
    { column: 'carriesContentVersion', testid: 'provenance-content-version' },
    { column: 'carriesHumanIdentity', testid: 'provenance-human-identity' },
  ] as const

  it('renders each detail for exactly the classes the column permits', () => {
    for (const { column, testid } of details) {
      const permitted: ProvenanceClassId[] = []
      for (const id of PROVENANCE_CLASS_IDS) {
        const mark = renderMark(id, {
          agent: 'prevention',
          contentVersion: 'v2.1.0',
          humanIdentity: 'Elena, Quality Manager, 15:12',
        })
        if (mark.querySelector(`[data-testid="${testid}"]`) !== null) permitted.push(id)
      }
      expect(permitted, column).toEqual(PROVENANCE_CLASS_IDS.filter((id) => contractPermits(id, column)))
      // NOT VACUOUS IN EITHER DIRECTION: the column must both permit
      // something and refuse something, or the assertion above is satisfied by
      // a component that renders the detail always, or never.
      expect(permitted.length, column).toBeGreaterThan(0)
      expect(permitted.length, column).toBeLessThan(PROVENANCE_CLASS_IDS.length)
    }
  })

  it('omits a detail the caller never supplied, without inventing one', () => {
    const mark = renderMark('PROV-1')
    expect(mark.querySelector('[data-testid="provenance-agent"]')).toBeNull()
    expect(mark.querySelector('[data-testid="provenance-content-version"]')).toBeNull()
  })

  it('names the agent in full beside the marker, never inside it', () => {
    const mark = renderMark('PROV-1', { agent: 'prevention' })
    const agent = mark.querySelector('[data-testid="provenance-agent"]')
    expect(agent?.textContent).toContain('Prevention Agent')
    // The marker stays class-level. An agent name inside it would make the
    // marker instance-dependent, and a marker that varies per instance cannot
    // carry the disjointness property asserted above.
    expect(
      mark.querySelector('[data-testid="provenance-marker"]')!.textContent,
    ).not.toContain('Prevention')
  })
})

/* ── AC-42-403, end to end ─────────────────────────────────────────────── */

describe('TEST-42-403 — nulling the agent run identifier renders PROV-6', () => {
  const delivered = {
    producedByModelThisSession: 'server side',
    approvedContentAuthoredAndReleasedEarlier: false,
    packagedValueProducingAnOutcomeByComparison: false,
    namedPersonDecidedOrInstructed: false,
    agentRunId: 'run-1',
    decisionRecordId: 'dr-1',
  } as const

  it('renders a PROV-1 card while both identifiers are present', () => {
    const resolution = resolveProvenance(delivered)
    expect(resolution).toEqual({ classId: 'PROV-1', failedClosed: false })
    const mark = renderMark(resolution.classId, { agent: 'prevention' })
    expect(mark.textContent).toContain(provenanceClass('PROV-1').markerText)
  })

  it('renders PROV-6, not a silent PROV-1 card, once the run identifier is null', () => {
    const resolution = resolveProvenance({ ...delivered, agentRunId: null })
    expect(resolution).toEqual({ classId: 'PROV-6', failedClosed: true })

    const mark = renderMark(resolution.classId, {
      agent: 'prevention',
      statement: 'Live coaching is unavailable. Continue with the approved instructions.',
    })
    expect(mark.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe('PROV-6')
    expect(normalise(mark.textContent ?? '')).toContain('Artificial intelligence unavailable')
    // The agent badge is the thing that must not survive the downgrade — a
    // card still wearing it is the "silent PROV-1" the test names.
    expect(mark.querySelector('[data-testid="provenance-agent"]')).toBeNull()
    expect(normalise(mark.textContent ?? '')).not.toMatch(/\blive artificial intelligence\b/i)
    // The caller's sentence is what says what the worker may do instead.
    expect(mark.textContent).toContain('Continue with the approved instructions.')
  })
})

/* ── PROV-2 is undecided ───────────────────────────────────────────────── */

describe('PROV-2 renders as an undecided class', () => {
  it('discloses both identifiers of the dual-identity pair', () => {
    const mark = renderMark('PROV-2')
    const text = normalise(mark.textContent ?? '')
    expect(text).toContain('DEC-ONDEVICE-001')
    expect(text).toContain('DEC-LOCALAI-001')
    expect(text).toContain('Client Decision Required')
  })

  it('claims nothing live, and no other class drags the disclosure in', () => {
    expect(normalise(renderMark('PROV-2').textContent ?? '')).not.toMatch(/\blive\b/i)
    for (const id of PROVENANCE_CLASS_IDS.filter((c) => c !== 'PROV-2')) {
      expect(normalise(renderMark(id).textContent ?? ''), id).not.toContain('DEC-ONDEVICE-001')
    }
  })
})

/* ── the lint finds what it claims to find ─────────────────────────────── */

describe('provenanceViolations', () => {
  it('returns nothing for a tree of well-formed marks side by side', () => {
    // Four classes on one screen is the source's own illustrative example, so
    // a lint that flagged it would be wrong about the contract.
    const { container } = render(
      <div {...{ [GUIDANCE_ELEMENT_ATTRIBUTE]: 'torque screen' }}>
        <ProvenanceMark classId="PROV-4" />
        <ProvenanceMark classId="PROV-3" contentVersion="v2.1.0" />
        <ProvenanceMark classId="PROV-6" />
        <ProvenanceMark classId="PROV-5" humanIdentity="Elena, Quality Manager, 15:12" />
      </div>,
    )
    expect(provenanceViolations(container)).toEqual([])
  })

  it('catches one guidance element carrying two classes by nesting', () => {
    const { container } = render(
      <div {...{ [PROVENANCE_CLASS_ATTRIBUTE]: 'PROV-1' }}>
        <ProvenanceMark classId="PROV-3" />
      </div>,
    )
    const violations = provenanceViolations(container)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('two provenance classes')
  })

  it('catches a class identifier that is not one of the six', () => {
    const { container } = render(<div {...{ [PROVENANCE_CLASS_ATTRIBUTE]: 'PROV-7' }} />)
    expect(provenanceViolations(container)).toHaveLength(1)
    expect(provenanceViolations(container)[0]).toContain('PROV-7')
  })

  it('catches two identifiers crammed into one attribute', () => {
    const { container } = render(<div {...{ [PROVENANCE_CLASS_ATTRIBUTE]: 'PROV-1 PROV-3' }} />)
    expect(provenanceViolations(container)).toHaveLength(1)
  })

  it('catches a guidance element carrying no class at all', () => {
    const { container } = render(
      <div {...{ [GUIDANCE_ELEMENT_ATTRIBUTE]: 'coaching card' }}>Do the thing</div>,
    )
    const violations = provenanceViolations(container)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('no provenance class at all')
  })
})

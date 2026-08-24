import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiAndItsAbsenceScreen } from '../../app/workflows/ai-and-its-absence/page'
import {
  ALL_THIRTY_STORYBOARDS,
  STORYBOARD_IDENTIFIER_ORDER,
} from '../../app/workflows/ai-and-its-absence/scope'
import { WorkflowIndex } from '../../app/workflows/page'
import { provenanceViolations } from '@/ai/provenance/contract'

/**
 * THE RENDERED ROUTE, WHICH IS THE HALF THE TOKEN SCAN CANNOT SEE.
 *
 * `tests/unit/ai-and-its-absence-route.test.ts` proves the thirty identifiers
 * are whole tokens in the route directory, which is what moves
 * `registries/generated/ai-storyboards.json`. That is a scan over SOURCE TEXT,
 * and a file could satisfy it while rendering nothing at all. This file is the
 * other half: every one of the thirty is on the RENDERED page, the one expected
 * contract breach still shows, the ordering `AC-44A-005` requires holds by
 * document position, and no rendering path emits more than one provenance class.
 */

/** The thirty, as a literal list in this file. Never mapped from the value under test. */
const EXPECTED_IDENTIFIERS = [
  'SB-AI-01', 'SB-AI-02', 'SB-AI-03', 'SB-AI-04', 'SB-AI-05',
  'SB-AI-06', 'SB-AI-07', 'SB-AI-08', 'SB-AI-09', 'SB-AI-10',
  'SB-AI-11', 'SB-AI-12', 'SB-AI-13', 'SB-AI-14', 'SB-AI-15',
  'SB-AI-16', 'SB-AI-17', 'SB-AI-18', 'SB-AI-19', 'SB-AI-20',
  'SB-AI-21', 'SB-AI-22', 'SB-AI-23', 'SB-AI-24', 'SB-AI-25',
  'SB-AI-26', 'SB-AI-27', 'SB-AI-28', 'SB-AI-29', 'SB-AI-30',
] as const

/**
 * THE RENDERED TEXT AS RUNS, NOT AS ONE `textContent` STRING.
 *
 * `Element.textContent` concatenates with NO separator across element
 * boundaries, so a heading ending in `SB-AI-11` followed by a paragraph
 * beginning "Fallback contract" reads as `SB-AI-11Fallback` — and a whole-token
 * matcher correctly refuses it. Measured on this page while writing this file:
 * ten of the thirty identifiers were reported missing for exactly that reason
 * while all thirty were on screen. Concatenating without a boundary is the
 * defect; loosening the matcher to `\b` to work around it would be the other
 * one, since `\b` lets `SB-AI-010` satisfy `SB-AI-01` and the neighbouring
 * register really does hold `SB-AI-001` and `SB-AI-010`.
 *
 * So the text is collected as the runs the DOM actually holds, joined by a
 * boundary the matcher can see. Same reasoning as the release sweep's own
 * "joins inline neighbours into one run and stops at a block boundary".
 */
function renderedRuns(root: Element): string {
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* SHOW_TEXT */)
  const runs: string[] = []
  while (walker.nextNode() !== null) runs.push(walker.currentNode.nodeValue ?? '')
  return runs.join('\n')
}

/**
 * Whole-token, the way the registry build matches: a letter, a digit or a
 * hyphen on the trailing side disqualifies, and so does a letter or digit on
 * the leading side.
 */
const wholeTokenCount = (text: string, token: string): number =>
  text.match(new RegExp(`(?<![A-Za-z0-9])${token}(?![A-Za-z0-9-])`, 'g'))?.length ?? 0

describe('the route renders all thirty storyboards', () => {
  it('names every one of the thirty as a whole token on the page', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const text = renderedRuns(container)
    const missing = EXPECTED_IDENTIFIERS.filter((id) => wholeTokenCount(text, id) === 0)
    expect(missing, 'a storyboard the page does not name at all').toEqual([])
  })

  it('names each of them in its index entry AND in its own card heading', () => {
    // Two independent places, so the page cannot satisfy the count above with
    // an index alone and thirty unlabelled cards.
    const { container } = render(<AiAndItsAbsenceScreen />)
    for (const identifier of EXPECTED_IDENTIFIERS) {
      const entry = container.querySelector(`[data-storyboard-index-entry="${identifier}"]`)
      expect(wholeTokenCount(renderedRuns(entry!), identifier), `index ${identifier}`).toBe(1)
      const article = screen.getByRole('article', { name: `Storyboard ${identifier}` })
      const heading = article.querySelector('h2')
      expect(wholeTokenCount(renderedRuns(heading!), identifier), `heading ${identifier}`).toBe(1)
    }
  })

  it('renders a card article for each, and exactly thirty of them', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    for (const identifier of EXPECTED_IDENTIFIERS) {
      expect(
        screen.getByRole('article', { name: `Storyboard ${identifier}` }),
        identifier,
      ).toBeTruthy()
    }
    expect(container.querySelectorAll('article[aria-label^="Storyboard "]')).toHaveLength(
      EXPECTED_IDENTIFIERS.length,
    )
  })

  it('renders no gap placeholder, because every index entry has a card', () => {
    render(<AiAndItsAbsenceScreen />)
    expect(screen.queryByText(/is named in this chapter/)).toBeNull()
  })
})

describe('the index is a real way into a long document', () => {
  it('holds one in-page link per storyboard, in the chapter order', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const entries = [
      ...container.querySelectorAll('[data-storyboard-index-entry] a[href^="#"]'),
    ].map((a) => a.getAttribute('href'))
    expect(entries).toEqual(EXPECTED_IDENTIFIERS.map((id) => `#${id.toLowerCase()}`))
  })

  it('and every link has a target section on the same page', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const dangling = EXPECTED_IDENTIFIERS.filter(
      (id) => container.querySelector(`section[id="${id.toLowerCase()}"]`) === null,
    )
    expect(dangling, 'an index entry linking to an anchor that is not on the page').toEqual([])
  })

  it('labels each entry with the fallback contract it traces to, at the compound key', () => {
    // `AC-44A-001` (L92746) is traceability to a NAMED fallback contract, and
    // the compound key is what makes the name unambiguous. Both halves are on
    // the entry: the section number and the literal.
    const { container } = render(<AiAndItsAbsenceScreen />)
    for (const storyboard of ALL_THIRTY_STORYBOARDS) {
      const entry = container.querySelector(
        `[data-storyboard-index-entry="${storyboard.identifier}"]`,
      )
      expect(entry, storyboard.identifier).not.toBeNull()
      const text = entry?.textContent ?? ''
      expect(text, storyboard.identifier).toContain(storyboard.fallback.chapter)
      expect(text, storyboard.identifier).toContain(storyboard.fallback.identifier)
    }
  })
})

describe('the page states its own scope, and states it as derived', () => {
  it('names the delegated-choice classification and the section span', () => {
    render(<AiAndItsAbsenceScreen />)
    const status = screen.getByTestId('route-source-status')
    expect(status.textContent).toContain('APP-012')
    expect(status.textContent).toContain('L92596-L95408')
  })

  it('renders the chapter acceptance criteria, each with its own line', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    for (const id of ['AC-44A-001', 'AC-44A-002', 'AC-44A-003', 'AC-44A-004', 'AC-44A-005']) {
      expect(container.querySelector(`[data-chapter-criterion="${id}"]`), id).not.toBeNull()
    }
  })
})

describe('AC-44A-005 holds by position, not by presence', () => {
  it('an absent-capability statement precedes every field of its own card', () => {
    // L92750 requires the storyboard to say so "in its own text, before
    // describing behaviour". Presence is not the requirement; order is. So this
    // compares document position rather than asserting the node exists.
    render(<AiAndItsAbsenceScreen />)
    const declaring = ALL_THIRTY_STORYBOARDS.filter((s) => s.absentCapability !== null)
    expect(declaring.length, 'no card declares an absent capability, so this proves nothing')
      .toBeGreaterThan(0)
    for (const storyboard of declaring) {
      const article = screen.getByRole('article', { name: `Storyboard ${storyboard.identifier}` })
      const statement = article.querySelector('[data-testid="storyboard-absent-capability"]')
      const firstField = article.querySelector('[data-storyboard-field]')
      expect(statement, storyboard.identifier).not.toBeNull()
      expect(firstField, storyboard.identifier).not.toBeNull()
      expect(
        statement!.compareDocumentPosition(firstField!) & Node.DOCUMENT_POSITION_FOLLOWING,
        `${storyboard.identifier} describes behaviour before it declares the absent capability`,
      ).toBeTruthy()
    }
  })
})

describe('the one legitimate breach still shows', () => {
  it('exactly one alert renders, and it is storyboard 25 reporting the fixed message', () => {
    // Storyboard 25 reports `fixedMessageIsNotParaphrased`: the Spanish
    // rendering of SCR-FL-LOCK-01's fixed message exists nowhere in the frozen
    // source, while TEST-44A-004 (L92757) requires the worker-facing message
    // set complete in both languages. This is the page behaving correctly. The
    // only way to silence it is to omit the fixed message, and that would
    // silence the one paraphrase prohibition the source states (L94876).
    const { container } = render(<AiAndItsAbsenceScreen />)
    const alerts = [...container.querySelectorAll('[role="alert"]')]
    expect(alerts).toHaveLength(1)
    const twentyFive = screen.getByRole('article', { name: 'Storyboard SB-AI-25' })
    expect(twentyFive.contains(alerts[0]!)).toBe(true)
    expect(alerts[0]!.textContent).toContain('SCR-FL-LOCK-01')
    expect(alerts[0]!.textContent).toContain('Spanish')
  })
})

describe('the compound key is rendered, and so is what a bare literal hides', () => {
  it('names the other claimant of every overlapping literal', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const listed = [...container.querySelectorAll('[data-fallback-collision]')].map((el) =>
      el.getAttribute('data-fallback-collision'),
    )
    expect(listed).toEqual([
      'FB-AI-01', 'FB-AI-02', 'FB-AI-03', 'FB-AI-04', 'FB-AI-05', 'FB-AI-06',
      'FB-AI-07', 'FB-AI-08', 'FB-AI-09', 'FB-AI-10', 'FB-AI-11', 'FB-AI-12',
      'FB-AI-13', 'FB-AI-14', 'FB-AI-15', 'FB-AI-16',
    ])
  })

  it('every card renders its key as section-and-literal, never the bare chapter', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const keys = [...container.querySelectorAll('[data-testid="storyboard-fallback-key"]')]
    expect(keys).toHaveLength(EXPECTED_IDENTIFIERS.length)
    for (const [index, key] of keys.entries()) {
      const storyboard = ALL_THIRTY_STORYBOARDS[index]!
      expect(key.textContent, storyboard.identifier).toContain(`44A.${storyboard.number}`)
    }
  })

  it('names the emergency-pause feature triple that claims the first literal', () => {
    render(<AiAndItsAbsenceScreen />)
    const text = screen.getByTestId('emergency-pause-attribution').textContent ?? ''
    for (const id of ['FEAT-SA-0703', 'SUB-SA-0703', 'FUNC-SA-0703']) {
      expect(wholeTokenCount(text, id), id).toBe(1)
    }
    expect(text).toContain('L47803')
  })
})

describe('provenance: one class per rendering path and none on the chrome', () => {
  it('breaks no rule of AC-42-401 anywhere on the page', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    expect(provenanceViolations(container)).toEqual([])
  })

  it('carries exactly one mark per card, all of one class, and none nested', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const marks = [...container.querySelectorAll('[data-provenance-class]')]
    expect(marks).toHaveLength(EXPECTED_IDENTIFIERS.length)
    expect([...new Set(marks.map((m) => m.getAttribute('data-provenance-class')))]).toEqual([
      'PROV-3',
    ])
  })

  it('marks the thirty cards as guidance elements and nothing else', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const elements = [...container.querySelectorAll('[data-guidance-element]')]
    expect(elements).toHaveLength(EXPECTED_IDENTIFIERS.length)
    expect([...new Set(elements.map((e) => e.getAttribute('data-guidance-element')))]).toEqual([
      'storyboard-card',
    ])
  })
})

describe('reachability is by navigation, not only by URL', () => {
  it('the workflow index links to this route, and the route links back', () => {
    // A route nothing links to is a page only its author can find, and a
    // component reachable from nothing is not shipped. The parent index is the
    // natural way in; the card page carries the return.
    //
    // Compared without the trailing slash: `next/link` renders `href="/x/"` as
    // `/x` in this environment, so asserting the authored spelling would fail
    // on a link that works. Measured, not assumed — the index's own coverage
    // link is authored with the slash and renders without it.
    const withoutSlash = (a: Element): string =>
      (a.getAttribute('href') ?? '').replace(/\/$/, '')

    const { container: index } = render(<WorkflowIndex />)
    const inbound = [...index.querySelectorAll('a[href]')].map(withoutSlash)
    expect(inbound).toContain('/workflows/ai-and-its-absence')

    const { container: route } = render(<AiAndItsAbsenceScreen />)
    const outbound = [...route.querySelectorAll('a[href]')].map(withoutSlash)
    expect(outbound).toContain('/workflows')
  })
})

describe('the page is driven by its literal index, so a missing card is visible', () => {
  it('the index order and the section order are the same list', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const sections = [...container.querySelectorAll('[data-storyboard-section]')].map((el) =>
      el.getAttribute('data-storyboard-section'),
    )
    expect(sections).toEqual([...STORYBOARD_IDENTIFIER_ORDER])
    expect(sections).toEqual([...EXPECTED_IDENTIFIERS])
  })
})

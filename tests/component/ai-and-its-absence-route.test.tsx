import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiAndItsAbsenceScreen } from '../../app/workflows/ai-and-its-absence/page'
import {
  ALL_THIRTY_STORYBOARDS,
  STORYBOARD_IDENTIFIER_ORDER,
} from '../../app/workflows/ai-and-its-absence/scope'
import { WorkflowIndex } from '../../app/workflows/page'
import { provenanceViolations } from '@/ai/provenance/contract'
import { SB_01_TO_10_LOCAL_DISCLOSURES } from '@/ai/storyboards/sb-01-to-10/decisions'
import { SB_21_TO_30_CONTRACT_SEAMS } from '@/ai/storyboards/sb-21-to-30/storyboards'
import { ownersOf } from '@/ai/fallbacks/registry'

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

  it('the intro names the claimants its own list holds, not only chapter 40 and 41', () => {
    // C-37(b). The prose used to read "Chapter 40 and 41 hold a
    // fallback-contract register of their own" while the first item of its own
    // list names owners in chapter 24 and section 30D.8 -- and chapter 41
    // overlaps nothing here at all, since its literals run FB-AI-101 upward.
    //
    // The expected claimants are read off the REGISTRY, not off the prose: the
    // section's list is generated from `ownersOf`, so that is the same source
    // the list itself draws from, and the equality below pins it so this case
    // cannot quietly start asserting about an empty array.
    const { container } = render(<AiAndItsAbsenceScreen />)
    const section = container.querySelector('[data-testid="fallback-key-collisions"]')!
    const intro = section.querySelector('p')!.textContent ?? ''
    const others = ownersOf('FB-AI-01')
      .filter((owner) => owner.chapter !== '44A.1')
      .map((owner) => owner.chapter)
    expect(others, 'the four-way collision the intro has to describe').toEqual([
      '40.1',
      '24',
      '30D.8',
    ])
    for (const chapter of others) {
      expect(intro, `the intro does not name chapter ${chapter}, which its own list does`)
        .toContain(chapter)
    }
  })

  it('states that 30D.8 and 40.12 are one subject under two literals, citing both lines', () => {
    // C-37(a). `src/ai/fallbacks/registry.ts` states this in a comment: 30D.8's
    // `FB-AI-01` subject and chapter 40.12's `FB-AI-12` subject are the same
    // failure under two literals. The list above renders them as two unrelated
    // items, so a reader had to notice the coincidence unaided.
    render(<AiAndItsAbsenceScreen />)
    const text = screen.getByTestId('fb-ai-01-and-12-one-subject').textContent ?? ''
    expect(wholeTokenCount(text, 'FB-AI-01'), 'FB-AI-01').toBe(1)
    expect(wholeTokenCount(text, 'FB-AI-12'), 'FB-AI-12').toBe(1)
    // Both lines, because a claim about two register rows that cites one of
    // them is a claim a reader cannot check.
    expect(text, "30D.8's line").toContain('L74495')
    expect(text, "40.12's line").toContain('L88927')
    expect(text).toContain('30D.8')
    expect(text).toContain('40.12')
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

/* ==================================================================== *
 * THE SEVEN LOCAL DECISION DISCLOSURES, WHICH USED TO REACH NO SCREEN.
 *
 * `src/ai/storyboards/sb-01-to-10/decisions.ts` was reached from nothing:
 * measured by transitive closure from `app/`, zero importers under `src/` or
 * `app/`, named only in a COMMENT in `src/coverage/uninventoried.ts`. It
 * reached a gate — `tests/unit/ai-storyboards-01-10-decisions.test.ts` — and no
 * reader. These cases cover the mount.
 * ==================================================================== */

/** The seven, as a literal list in this file. Never mapped from the value under test. */
const EXPECTED_LOCAL_DECISIONS = [
  'DEC-ASK-001',
  'DEC-LOCALAI-001',
  'DEC-AIRTO-001',
  'DEC-NOSHIFT-001',
  'DEC-PLUS-001',
  'DEC-SYNC-001',
  'DEC-WIPE-001',
] as const

/** The four the canon holds a record for, likewise literal. */
const EXPECTED_CANON_BACKED = [
  'DEC-AIRETRY-001',
  'DEC-LANEB-001',
  'DEC-LIB-001',
  'DEC-WIDIFF-001',
] as const

/**
 * Section 44A's own bounds, declared here rather than read from the screen's
 * parse of them. `## 44A.` at L92596 to the chapter's closing rule at L95408.
 */
const SECTION_44A = { first: 92_596, last: 95_408 } as const

describe('the decisions storyboards 1 to 10 name are disclosed on the page', () => {
  it('renders all seven local records, by membership and not by count', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const rendered = [...container.querySelectorAll('[data-local-decision]')].map((el) =>
      el.getAttribute('data-local-decision'),
    )
    // AN EQUALITY OVER A LITERAL LIST. An eighth record turns this red instead
    // of passing with a bigger number, and a substituted identifier reds too.
    expect(rendered).toEqual([...EXPECTED_LOCAL_DECISIONS])
  })

  it('renders every reading of every record, with the line it was read from', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const text = renderedRuns(container)
    for (const record of SB_01_TO_10_LOCAL_DISCLOSURES) {
      expect(text, `${record.decisionRef}: its question is not on screen`).toContain(
        record.question,
      )
      expect(text, `${record.decisionRef}: its canon note is not on screen`).toContain(
        record.canonNote,
      )
      expect(text, `${record.decisionRef}: what the cards do is not on screen`).toContain(
        record.behaviour,
      )
      for (const reading of record.readings) {
        expect(text, `${record.decisionRef}: a reading is not on screen`).toContain(reading.text)
        expect(text, `${record.decisionRef}: ${reading.locator} is not named`).toContain(
          reading.locator,
        )
      }
    }
    // And the four the canon holds are named as whole tokens rather than
    // silently omitted because they need no local record.
    for (const id of EXPECTED_CANON_BACKED) {
      expect(wholeTokenCount(text, id), `${id} is not named on the page`).toBeGreaterThan(0)
    }
  })

  it('marks exactly the readings that come from outside section 44A', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    // THE EXPECTED SET IS COMPUTED HERE FROM THE RECORDS AND THE SPAN, not
    // read off the page: the asymmetry with the other two storyboard ranges is
    // the reason these records are rendered at all, so the claim carrying it
    // has to be checked against the lines rather than against the rendering.
    const expected = SB_01_TO_10_LOCAL_DISCLOSURES.flatMap((record) =>
      record.readings
        .filter((reading) => {
          const line = Number(/L(\d{4,6})/.exec(reading.locator)?.[1] ?? '0')
          return line < SECTION_44A.first || line > SECTION_44A.last
        })
        .map((reading) => reading.locator),
    )
    const tagged = [...container.querySelectorAll('[data-outside-44a]')].map(
      (el) => el.closest('[data-reading-locator]')?.getAttribute('data-reading-locator') ?? '',
    )
    expect(tagged.sort()).toEqual([...expected].sort())
    // A FLOOR AND A CEILING, because an empty tag set and a fully-tagged one
    // would both make the claim meaningless.
    expect(tagged.length).toBeGreaterThan(0)
    expect(tagged.length).toBeLessThan(
      SB_01_TO_10_LOCAL_DISCLOSURES.reduce((n, r) => n + r.readings.length, 0),
    )
  })

  it('adds no provenance class and no alert to the chrome', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const section = container.querySelector('[data-testid="sb-01-to-10-decisions"]')!
    expect(section.querySelectorAll('[data-provenance-class]')).toHaveLength(0)
    expect(section.querySelectorAll('[data-guidance-element]')).toHaveLength(0)
    expect(section.querySelectorAll('[role="alert"]')).toHaveLength(0)
    expect(provenanceViolations(container)).toEqual([])
  })
})

/* ==================================================================== *
 * THE THREE CONTRACT SEAMS, WHICH LIKEWISE REACHED NO SCREEN.
 *
 * `SB_21_TO_30_CONTRACT_SEAMS` was measured reachable from nothing: a grep for
 * it over `app`, `src` and `tests` returned its own declaration, two comments
 * inside the same file and the findings register. No screen rendered it and no
 * test asserted it, which made the build's only disclosure of the missing sixth
 * `contentOrigin` member -- the case where a storyboard renders no guidance
 * element at all -- unreachable by any reader of the four cards it is about.
 * ==================================================================== */

/** The three, as a literal list in this file. Never mapped from the value under test. */
const EXPECTED_CONTRACT_SEAMS = [
  'StoryboardRenderFacts.contentOrigin',
  'PINNED_WORKER_MESSAGES',
  'TEST-44A-004 and the Spanish message set',
] as const

describe('the seams storyboards 21 to 30 left in the shared contract are disclosed', () => {
  it('renders all three seam records, by equality and not by a floor', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const rendered = [...container.querySelectorAll('[data-contract-seam]')].map((el) =>
      el.getAttribute('data-contract-seam'),
    )
    // AN EQUALITY OVER A LITERAL LIST, on C-18.4's reasoning: a floor of one
    // does not catch a drop from three. A fourth record turns this red instead
    // of passing with a bigger number, and a dropped one reds too.
    expect(rendered).toEqual([...EXPECTED_CONTRACT_SEAMS])
    // And the exported array is that same list, so the literal above cannot
    // drift into agreement with a rendering that has silently lost a record
    // from the data it iterates.
    expect(SB_21_TO_30_CONTRACT_SEAMS.map((seam) => seam.subject)).toEqual([
      ...EXPECTED_CONTRACT_SEAMS,
    ])
  })

  it('renders each seam’s finding, what was done instead, and the storyboards it concerns', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const text = renderedRuns(container)
    for (const seam of SB_21_TO_30_CONTRACT_SEAMS) {
      // Verbatim, because these are the record's own words about four cards on
      // this page and a re-wording would be this page's claim rather than the
      // record's.
      expect(text, `${seam.subject}: its finding is not on screen`).toContain(seam.finding)
      expect(text, `${seam.subject}: what the transcription did is not on screen`).toContain(
        seam.whatThisTaskDid,
      )
      const record = container.querySelector(`[data-contract-seam="${seam.subject}"]`)
      expect(record, seam.subject).not.toBeNull()
      expect(
        record!.getAttribute('data-seam-storyboards'),
        `${seam.subject}: the storyboards it concerns are not the record's own`,
      ).toBe(seam.storyboards.join(' '))
    }
  })

  it('adds no provenance class and no alert to the chrome', () => {
    const { container } = render(<AiAndItsAbsenceScreen />)
    const section = container.querySelector('[data-testid="sb-21-to-30-contract-seams"]')!
    expect(section.querySelectorAll('[data-provenance-class]')).toHaveLength(0)
    expect(section.querySelectorAll('[data-guidance-element]')).toHaveLength(0)
    expect(section.querySelectorAll('[role="alert"]')).toHaveLength(0)
    expect(provenanceViolations(container)).toEqual([])
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Each plant was spliced into a real shipping file, the suite run, and the file
 * restored and asserted byte-identical against a sha256 taken before the plant.
 * The harness required its anchor to occur exactly once and refused an empty
 * replacement. The message each produced is recorded, because "it went red"
 * without the message does not say which assertion fired.
 *
 * P5 to P7 belong to the seven local decision disclosures; P8 to P14 to the
 * three contract seams and the two collision-section statements below them.
 *
 *  P8  A SEAM RECORD REMOVED from `SB_21_TO_30_CONTRACT_SEAMS` — the
 *      `PINNED_WORKER_MESSAGES` record, 19 lines, deleted from the exported
 *      array. This is the direction the equality exists for, and the direction
 *      a floor of one cannot see (audit C-18.4).
 *      RED  at 'renders all three seam records, by equality and not by a
 *           floor': expected [ …(2) ] to deeply equal [ …(3) ]
 *
 *  P9  A FOURTH SEAM RECORD ADDED to the same array — the other direction.
 *      RED  same case: expected [ …(4) ] to deeply equal [ …(3) ]
 *
 * P10  THE SEAM `finding` DROPPED FROM THE RENDERING (`<p />` in place of
 *      `{seam.finding}`), which leaves three headed records, three subjects
 *      and three storyboard lists on screen and looks like a full disclosure.
 *      RED  at 'renders each seam’s finding, what was done instead, and the
 *           storyboards it concerns': StoryboardRenderFacts.contentOrigin: its
 *           finding is not on screen: expected '…' to contain 'The union has
 *           no member meaning "this…'
 *
 * P11  THE WHOLE ONE-SUBJECT SENTENCE REMOVED from the collision section.
 *      RED  at 'states that 30D.8 and 40.12 are one subject under two
 *           literals, citing both lines': Unable to find an element by:
 *           [data-testid="fb-ai-01-and-12-one-subject"]
 *
 * P12  THE SENTENCE KEPT AND ONE OF ITS TWO LINES DROPPED (`L88927`), which
 *      is the shape that states a true thing a reader cannot check.
 *      RED  same case: 40.12's line: expected 'Two of the rows above are one
 *           subject…' to contain 'L88927'
 *
 * P13  THE INTRO REVERTED to its exact pre-fix wording, "Chapter 40 and 41
 *      hold a fallback-contract register of their own".
 *      RED  at 'the intro names the claimants its own list holds, not only
 *           chapter 40 and 41': the intro does not name chapter 40.1, which
 *           its own list does
 *
 * P14  ONLY CHAPTER 24'S CLAUSE DROPPED from the widened intro, leaving 40.1
 *      to 40.16 and 30D.8 named — because a substring as short as "24" could
 *      have been satisfied by a neighbouring line number by accident.
 *      RED  same case: the intro does not name chapter 24, which its own list
 *           does
 *
 *  P5  AN EIGHTH RECORD ADDED to `SB_01_TO_10_LOCAL_DISCLOSURES` — the ADD
 *      direction, which is the one a count cannot see.
 *      RED  at 'renders all seven local records, by membership and not by
 *           count': expected [ 'DEC-ASK-001', …(7) ] to deeply equal
 *           [ 'DEC-ASK-001', …(6) ]
 *
 *  P6  THE OUTSIDE-44A COMPARISON INVERTED in the screen, so the tag lands on
 *      exactly the wrong readings while the page still looks complete.
 *      RED  at 'marks exactly the readings that come from outside section 44A':
 *           expected [ 'DEC-ASK-001 · L92732', …(6) ] to deeply equal
 *           [ 'DEC-AIRTO-001 · L87880', …(15) ]
 *           — the complement, which is why this case computes its expected set
 *           from the lines rather than reading the page's own marking back.
 *
 *  P7  THE FIRST READING OF EVERY RECORD DROPPED from the rendering
 *      (`record.readings.slice(1)`), which is the shape that discloses most of
 *      a question and looks like a full disclosure.
 *      RED  twice, and both are the right red:
 *           'renders every reading of every record' — DEC-ASK-001: a reading is
 *           not on screen: expected '…' to contain 'Option (a) — no question
 *           channel. Coa…'; and
 *           'marks exactly the readings that come from outside section 44A' —
 *           expected […(10)] to deeply equal […(15)].
 * ==================================================================== */

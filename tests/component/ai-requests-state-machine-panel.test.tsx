import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PROVENANCE_CLASS_ATTRIBUTE, provenanceViolations } from '@/ai/provenance/contract'
import { StateMachinePanel } from '@/ai/requests/StateMachinePanel'
import { QUEUED_REQUEST_TRANSITIONS, STATE_SET_RULES } from '@/ai/requests/machine'
import { QUEUED_REQUEST_STATE_IDS, stateRecord } from '@/ai/requests/states'

/**
 * `src/ai/requests/machine.ts`, RENDERED — the six rules and the nineteen edges.
 *
 * WHY THIS SUITE EXISTS. `machine.ts` was reached from nothing: measured by
 * transitive closure from `app/`, it had zero importers anywhere under `src/`
 * or `app/` while its two siblings were mounted, and it stated no abstention.
 * `tests/coverage/slice-11-gates.test.ts` gate 12 named it. This suite covers
 * the mount that retires the naming.
 *
 * WHAT IT HOLDS, AND WHY EACH CASE IS NOT REDUNDANT:
 *
 *   1. THE SIX RULES ARE ON SCREEN, BY MEMBERSHIP AND NOT BY LENGTH. The
 *      locator list is a LITERAL declared here, outside the module, so adding
 *      a seventh rule to `STATE_SET_RULES` turns this red rather than passing
 *      with a bigger number. Proved by ADDING in the plant campaign below.
 *   2. RULE 5 IS DERIVED, NOT DECORATED. Every terminal state other than
 *      `reconciled` must render its own edge into `reconciled`. The expected
 *      set is computed here from the state records rather than read off the
 *      panel, and the breach branch must be absent — a panel that renders the
 *      breach alert for a state the diagram does covers is as wrong as one
 *      that omits the state.
 *   3. THE RULE-4 CLAIM ON SCREEN IS HELD AGAINST THE MODULE'S OWN BYTES.
 *      The panel says rule 4 is enforced at compile time and cannot be shown
 *      by any rendering. That sentence is a claim about `machine.ts`, so it is
 *      checked against `machine.ts`: no exported predicate, no exported state
 *      key, one reader, no default branch. If the enforcement is ever softened
 *      the sentence becomes false and this reds.
 *   4. ONE PROVENANCE CLASS, AND THE BUILD'S OWN LINT OVER THE TREE. Counting
 *      the marks is not enough on its own — the count can be right while a
 *      mark sits nested inside another — and the lint alone passes over a tree
 *      with no mark at all, so both run.
 *   5. NO CONTROL. The panel renders states on a Hub route; a control here
 *      would put the human gate (a Command Center act, L89702) or a
 *      cancellation next to the record of truth. There is no interactive
 *      element at all, which is a property of the tree rather than of a
 *      handler nobody wired.
 *
 * ON READING THE RENDERED TEXT. `Element.textContent` concatenates across
 * element boundaries with no separator, which in this slice has already made a
 * count gate unable to fail and hidden ten of thirty identifiers that were on
 * screen. So every assertion below reads TEXT NODES, collected in document
 * order and joined with an explicit ` | ` boundary; two adjacent nodes cannot
 * fuse into a third string that satisfies a `toContain` neither of them does.
 */

const MOUNT = 'MOD-DOH-08 — Execution Summary Review and Distribution'

/** Every text node, in order, joined with a boundary that cannot be crossed. */
function textRuns(root: ParentNode): readonly string[] {
  const runs: string[] = []
  const walk = (node: Node): void => {
    if (node.nodeType === 3) {
      const text = (node.textContent ?? '').trim()
      if (text !== '') runs.push(text)
      return
    }
    node.childNodes.forEach(walk)
  }
  walk(root as unknown as Node)
  return runs
}

const joined = (root: ParentNode): string => textRuns(root).join(' | ')

const MACHINE_SOURCE = readFileSync(
  join(process.cwd(), 'src/ai/requests/machine.ts'),
  'utf8',
)

/**
 * THE SIX RULE LOCATORS, AS A LITERAL LIST DECLARED OUTSIDE THE MODULE.
 * Not a length: a length agrees with any substitution, and this build has
 * shipped a count gate that could not fail. L89641-L89646, the rules that bind
 * the state set.
 */
const RULE_LOCATORS = [
  'L89641',
  'L89642',
  'L89643',
  'L89644',
  'L89645',
  'L89646',
] as const

describe('the queued-request state machine, rendered beside its states', () => {
  it('renders the six rules that bind the state set, by locator membership', () => {
    const { container } = render(<StateMachinePanel mountedOn={MOUNT} />)
    const rendered = [...container.querySelectorAll('[data-state-set-rule]')]
    // AN EQUALITY OVER THE LITERAL LIST, not a length: a length agrees with any
    // substitution, and an addition and a swap must both red. The locator is
    // its own text run — `[`, the line and `]` are three separate nodes, so a
    // joined-string `toContain('[L89641]')` would fail on text that IS on
    // screen, which is the boundary problem in the false-red direction.
    const renderedLocators = rendered.flatMap((li) =>
      textRuns(li).filter((run) => /^L\d{5}$/.test(run)),
    )
    expect(renderedLocators).toEqual([...RULE_LOCATORS])
    for (const [index] of RULE_LOCATORS.entries()) {
      expect(rendered[index]!.getAttribute('data-state-set-rule')).toBe(String(index + 1))
    }
    // And the rules are the source's own sentences rather than a summary of
    // them: each is asserted as a WHOLE run, so no two nodes can fuse into a
    // string that satisfies a match neither of them does.
    const runs = textRuns(container)
    for (const rule of STATE_SET_RULES) {
      expect(runs, `the rule at ${rule.locator} is not on screen in its own words`).toContain(
        rule.text,
      )
    }
  })

  it('derives rule 5 from the edges: every terminal state but reconciled reaches it', () => {
    const { container } = render(<StateMachinePanel mountedOn={MOUNT} />)
    const expected = QUEUED_REQUEST_STATE_IDS.filter(
      (id) => stateRecord(id).terminal.terminal && id !== 'reconciled',
    )
    const rows = [...container.querySelectorAll('[data-terminal-state]')]
    expect(rows.map((r) => r.getAttribute('data-terminal-state'))).toEqual([...expected])
    // THE PANEL-SIDE ASSERTIONS COME FIRST, AND THE ORDER IS THE POINT. An
    // earlier draft looked the edge up in the module before reading the row,
    // so removing an edge red on the TEST's own lookup rather than on anything
    // the panel drew — a red for the wrong reason, which proves nothing about
    // the rendering. The breach branch being absent is what the panel is on
    // the hook for.
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
    expect(joined(container)).not.toContain('which is a breach of rule 5')
    for (const row of rows) {
      const id = row.getAttribute('data-terminal-state')!
      const runs = textRuns(row)
      expect(runs, `${id} does not render its edge into reconciled`).toContain('reconciled')
      const edge = QUEUED_REQUEST_TRANSITIONS.find((t) => t.from === id && t.to === 'reconciled')
      expect(edge, `${id} has no edge into reconciled in the transcribed diagram`).toBeDefined()
      expect(runs, `${id} does not render the edge's own trigger`).toContain(edge!.trigger)
      expect(runs, `${id} does not name the line the edge was read from`).toContain(edge!.locator)
    }
  })

  it('renders all nineteen labelled edges, grouped by the state they leave', () => {
    const { container } = render(<StateMachinePanel mountedOn={MOUNT} />)
    const groups = [...container.querySelectorAll('[data-transitions-from]')]
    expect(groups.map((g) => g.getAttribute('data-transitions-from'))).toEqual([
      ...QUEUED_REQUEST_STATE_IDS,
    ])
    for (const edge of QUEUED_REQUEST_TRANSITIONS) {
      const group = groups.find((g) => g.getAttribute('data-transitions-from') === edge.from)!
      const text = joined(group)
      expect(text, `${edge.from} → ${edge.to} is not rendered under ${edge.from}`).toContain(
        edge.trigger,
      )
      expect(text, `${edge.from} → ${edge.to} names no line`).toContain(edge.locator)
    }
    // The one state the diagram never leaves renders a stated absence rather
    // than an empty list, because an empty list and an oversight look the same.
    const reconciled = groups.find((g) => g.getAttribute('data-transitions-from') === 'reconciled')!
    expect(joined(reconciled)).toContain('registers no edge leaving this state')
  })

  it('names the three rules the rendering cannot demonstrate', () => {
    const { container } = render(<StateMachinePanel mountedOn={MOUNT} />)
    const named = [...container.querySelectorAll('[data-not-demonstrated]')].map(
      (li) => li.getAttribute('data-not-demonstrated'),
    )
    // A LITERAL LIST. Rules 1, 4 and 6 are quoted and not shown; 2, 3 and 5
    // are demonstrated above. Moving a rule from one half to the other has to
    // be a deliberate edit here rather than a silent change of claim.
    expect(named).toEqual(['4', '1', '6'])
    const text = joined(container)
    expect(text).toContain('no rendering can demonstrate the absence of a predicate')
    expect(text).toContain('an absence is consistent with the rule and is not proof of it')
  })

  it('and the rule-4 claim it makes on screen is true of the module’s own bytes', () => {
    // The panel says rule 4 is enforced in `machine.ts` at compile time. That
    // is a claim about a file, so it is held against the file.
    expect(MACHINE_SOURCE).not.toMatch(/export\s+(?:const|function|let)\s+is[A-Z]/)
    expect(MACHINE_SOURCE).not.toMatch(/export\s+const\s+OBSERVED_STATE_ID/)
    expect(MACHINE_SOURCE).toContain('const OBSERVED_STATE_ID: unique symbol')
    expect(MACHINE_SOURCE).toContain('export function matchState')
    // No default branch and no rest parameter, which is what makes leaving a
    // state out a compile error rather than a silent fallthrough.
    expect(MACHINE_SOURCE).not.toContain('default:')
    expect(MACHINE_SOURCE).not.toMatch(/otherwise|fallback\s*:/)
  })

  it('emits exactly one provenance class, PROV-4, and passes the build’s own lint', () => {
    const { container } = render(<StateMachinePanel mountedOn={MOUNT} />)
    const marks = [...container.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)]
    expect(marks).toHaveLength(1)
    expect(marks[0]?.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe('PROV-4')
    expect(provenanceViolations(container)).toEqual([])
    // And it never labels a transcribed rule live artificial intelligence.
    expect(joined(container)).not.toContain('Live artificial intelligence')
  })

  it('offers no control at all, on a route that holds the record of truth', () => {
    const { container } = render(<StateMachinePanel mountedOn={MOUNT} />)
    expect(container.querySelectorAll('button, input, select, textarea, a[href]')).toHaveLength(0)
  })

  it('is MOUNTED on the Hub route, not merely imported by it', () => {
    // MEASURED LIMIT THIS CLOSES. `tests/coverage/slice-11-gates.test.ts` gate
    // 12 walks the IMPORT closure, so a route that keeps the import and deletes
    // the JSX still reads as reachable — planted, and the gate stayed 54/54
    // green with the panel off the page. An import edge is not a mount, so the
    // mount is asserted here, in the route's own bytes, the way the sibling
    // overlay suite already asserts its own.
    const page = readFileSync(
      join(process.cwd(), 'app/hub/execution-summary-review/page.tsx'),
      'utf8',
    )
    expect(page).toContain('<StateMachinePanel')
    expect(page).toContain("from '@/ai/requests/StateMachinePanel'")
  })

  /* ────────────────────────────────────────────────────────────────────
   * R7-C02 — AND IT IS MOUNTED INSIDE THE EXTENSION LABEL, NOT BESIDE IT.
   *
   * This panel and `QueuedRequestSurfaceMatrix` render the twelve-state
   * worker-initiated help machine and its 12x5 surface matrix. L89727
   * classifies that state set `User-Mandated Product Extension`; the channel
   * it presumes is the open `DEC-ASK-001` (L92730/L92732, option (a) being no
   * channel); and master prompt §18.3 requires those modes in a separate
   * extension decision preview, `DEC-AIHELP-001` preserved, excluded from
   * implemented V1 coverage. They were mounted flush against `MOD-DOH-08`'s
   * own V1 content with none of that on the page.
   *
   * CONTAINMENT, NOT A SUBSTRING. A `toContain` over the route would stay
   * green with the label at the top of the file and a panel dragged out from
   * under it — the shape this build calls "an import edge is not a mount", one
   * level up. The route's own element tree is rendered here and each panel's
   * ancestry is walked to the labelled section.
   *
   * PLANTED, on a copy of the route restored byte-exact against a sha256 taken
   * before:
   *   moved `<StateMachinePanel …/>` out of the section, after its closing
   *     tag — red: "the queued-request state machine renders outside the
   *     extension decision preview".
   *   deleted the whole `<section data-extension-decision-preview>` wrapper,
   *     leaving both panels bare — red on the section being absent.
   *   deleted only `<DecisionDisclosure id="DEC-AIHELP-001" />` — red naming
   *     DEC-ASK-001 missing from the preview.
   * ──────────────────────────────────────────────────────────────────── */
  it('R7-C02: both extension panels render inside the extension decision preview', async () => {
    const { default: ExecutionSummaryReviewPage } = await import(
      '../../app/hub/execution-summary-review/page'
    )
    const { container } = render(<ExecutionSummaryReviewPage />)

    const preview = container.querySelector('[data-extension-decision-preview]')
    expect(
      preview,
      'the route renders no extension decision preview. Master prompt §18.3 requires these '
        + 'modes in a separately labelled one, excluded from implemented V1 coverage.',
    ).not.toBeNull()

    for (const [what, selector] of [
      ['the queued-request state machine', '[data-testid="queued-request-state-machine"]'],
      ['the queued-request surface matrix', '[data-testid="queued-request-surface-matrix"]'],
    ] as const) {
      const panel = container.querySelector(selector)
      expect(panel, `${what} is not on the route at all`).not.toBeNull()
      expect(
        preview!.contains(panel),
        `${what} renders outside the extension decision preview, so a reader meets it as `
          + 'ordinary V1 module content.',
      ).toBe(true)
    }

    // The classification and the open decision, both inside the label, both
    // by their own source words rather than by a paraphrase.
    const text = (preview!.textContent ?? '').replace(/\s+/g, ' ')
    expect(text, 'the source classification at L89727').toContain('User-Mandated Product Extension')
    expect(text, 'L89727, cited').toContain('L89727')
    expect(text, "§44A's spelling of the open decision").toContain('DEC-ASK-001')
    expect(text, "§42.6's spelling, which the canon keys on").toContain('DEC-AIHELP-001')
    expect(text, 'option (a): no channel at all').toContain('no question channel')
    // And the preview never claims the question is settled here.
    expect(text).toContain('None is this build’s to settle.')
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Each plant was spliced into `src/ai/requests/machine.ts`, the suite run, and
 * the file restored and asserted byte-identical against a digest taken before
 * the plant. The message each produced is recorded, because "it went red"
 * without the message does not say which assertion fired.
 *
 * The harness required its anchor to occur EXACTLY ONCE and refused an empty
 * replacement; the refusal was exercised on P2's first form and is recorded
 * below rather than quietly worked around.
 *
 *  P1  A SEVENTH RULE ADDED to `STATE_SET_RULES` — the ADD direction, which is
 *      the one a length cannot see.
 *      RED  at 'renders the six rules that bind the state set, by locator
 *           membership':
 *           expected [ 'L89641', 'L89642', 'L89643', …(4) ] to deeply equal
 *           [ 'L89641', 'L89642', 'L89643', …(3) ]
 *      AND THE FIRST FORM OF THIS GATE WAS WEAKER AND IS RECORDED AS SUCH: it
 *      asserted `toHaveLength(RULE_LOCATORS.length)`, which convicted the same
 *      plant ("expected [ …(7) ] to have a length of 6") but would have passed
 *      a SUBSTITUTED locator. It was replaced by the equality above.
 *
 *  P2  THE `failed --> reconciled` EDGE REMOVED from the transcribed diagram —
 *      a real rule-5 breach in the data the panel derives from.
 *      RED  at 'derives rule 5 from the edges':
 *           expected <span role="alert" …(1)>…(1)</span> to have a length of +0
 *           but got 1
 *      THE FIRST ATTEMPT PRODUCED THE WRONG RED AND IS RECORDED. The case
 *      originally looked the edge up in the module BEFORE reading the row, so
 *      the red was "failed has no edge into reconciled in the transcribed
 *      diagram: expected undefined to be defined" — the test's own lookup
 *      firing, which says nothing about what the panel drew. The panel-side
 *      assertions were moved ahead of the data lookup, and the message above is
 *      the panel rendering its breach branch, which is the assertion meant.
 *
 *  P3  `OBSERVED_STATE_ID` EXPORTED, which is the one edit that makes rule 4
 *      unenforceable while leaving every rendering byte-identical.
 *      RED  at 'the rule-4 claim it makes on screen is true of the module’s own
 *           bytes': expected 'import {\n  QUEUED_REQUEST_STATE_IDS,…' not to
 *           match /export\s+const\s+OBSERVED_STATE_ID/. The other six cases
 *           stayed green, which is exactly why this one reads the bytes.
 *
 *  P4  A FOURTH `data-not-demonstrated` ENTRY ADDED to the panel, claiming rule
 *      2 is not demonstrated when it is.
 *      RED  at 'names the three rules the rendering cannot demonstrate':
 *           expected [ '4', '2', '1', '6' ] to deeply equal [ '4', '1', '6' ]
 * ==================================================================== */

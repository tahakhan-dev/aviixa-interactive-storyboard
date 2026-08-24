import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { isForeignProbe, ownProbeDir, withPlanted } from '../probe-paths'
import { fold, isBareClaim, phrasingMatches } from '@/honesty/lexicon'

/**
 * # THE PROHIBITED-PHRASING SWEEP OVER THE WHOLE BUILT TREE
 *
 * `TEST-OFF-401` at L78451 asks for a lexical scan of every rendered string on
 * all five surfaces against a prohibited-phrasing dictionary, failing the build
 * on any match in a device-effect context. The dictionary is
 * `src/honesty/lexicon.ts`, transcribed from the eight-row table at
 * L78400-L78407 and checked against the frozen source by
 * `tests/unit/honesty-kernel.test.ts`. This file is the scan.
 *
 * The rule it serves is L78386: no surface may display, phrase, colour, badge,
 * animate, count, aggregate, export or notify in any way that implies an
 * offline tablet has received or applied any of the enumerated artefacts.
 *
 * ## WHAT WAS ENFORCING THIS BEFORE, WHICH WAS NOT NOTHING
 *
 * `tests/coverage/contract-gates.test.ts` already refuses three words as
 * literal state names in authored `src/` — a value assigned to a field called
 * state or status. It reads no rendered output and knows none of the eight
 * rows. This sweep is the other half and does not repeat it.
 *
 * ## THE SCOPE IS EVERY BUILT PAGE, NOT THE FIVE SURFACE DIRECTORIES
 *
 * L78386 names five surfaces, and this build also exports coverage, workflow
 * and review pages that quote the same prose. Sweeping only the five would be
 * exempting a region, and a region is where anything hides — so every
 * `index.html` under `out/` is read, and the five surfaces are asserted to be
 * among them so a shrunken export cannot pass by having less to say.
 *
 * ## THE FOUR WAYS A SWEEP OF THIS SHAPE HAS ALREADY BEEN WATCHED TO FAIL
 *
 * Every one was proved by planting in slice 7, not reasoned about, and
 * `tests/coverage/slice-07-absence-sweep.test.ts` records them in full.
 *
 * 1. **`textContent` WELDS ADJACENT ELEMENTS.** It concatenates with no
 *    separator, so `a timer` followed by a state token reads back as one run of
 *    letters and a word-boundary pattern never matches. That sweep's fix was to
 *    keep text nodes APART, because its dictionary is single words.
 *
 *    THAT FIX IS THE WRONG ONE HERE, AND INVERTING IT IS THE POINT. This
 *    dictionary is PHRASES. Keeping `<span>hold</span><span>released</span>`
 *    apart would hand the matcher two nodes neither of which is a phrasing, and
 *    the phrase would be invisible — the same defect with the polarity
 *    reversed. So text nodes are joined WITH A SINGLE SPACE, which is what a
 *    reader sees, and cannot weld two words into a third the way `textContent`
 *    does. The join stops at the first non-inline element, so two unrelated
 *    paragraphs never make a phrase between them. `reports a phrase split
 *    across two adjacent elements` plants exactly that split.
 *
 * 2. **A `hidden` ATTRIBUTE DEFEATS A SWEEP THAT CONSULTS IT.** This gate
 *    asserts absence, so hidden text is deliberately in scope: no ancestor is
 *    consulted for `hidden`, `aria-hidden` or `display:none`, and computing
 *    visibility could only ever shrink what the sweep sees.
 *
 * 3. **PLURALS.** A singular pattern passed a planted plural. Every rule that
 *    names a noun carries its plural.
 *
 * 4. **THE WORDS APPEAR LEGITIMATELY, IN PROSE THAT DESCRIBES THE RULE.** The
 *    rendered runs in this tree that carry a prohibited phrasing honestly are
 *    each subtracted BY NAME as one exact run — never as a region, never as a
 *    page, never as a heuristic about prose that contains a negation. Those
 *    that quote the frozen source are pinned to the line whose words they
 *    carry, and no number is written here for them: each one is PROVED against
 *    that line on every run, so a count would be a second, unchecked claim
 *    about a population the gate below already measures — and this paragraph
 *    has already carried one stale count of exactly that kind.
 *    Nine are this build's own sentences and carry no line, because none
 *    exists; those nine are held at a fixed count that a tenth cannot join
 *    without turning this file red and forcing the decision, the same idiom
 *    `tests/coverage/prohibited-patterns.test.ts` uses for its one probe-copy
 *    exemption.
 *
 * ## WHAT THIS DOES NOT COVER, STATED RATHER THAN IMPLIED
 *
 * A static export contains what the server rendered. A branch of a client
 * component that renders only after a click is not in `out/`, so this sweep
 * covers every state the export emits, hidden subtrees included, and not a
 * branch reachable only at run time. The authored-source half is a different
 * instrument and is not merged in here.
 */

/* ── the frozen source ──────────────────────────────────────────────────── */

/**
 * Resolved from the repository rather than written absolute:
 * `prohibited-patterns.test.ts` bans an author path from the release artifact
 * and there is no reason to type one here either.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)

/**
 * The trailing newline yields one extra empty element that is not a line.
 * Leaving it in makes the count 122,242 and lets a disclosure one past the end
 * pass the range check.
 */
const sourceLines = ((lines: readonly string[]) =>
  lines.at(-1) === '' ? lines.slice(0, -1) : lines)(sourceBytes.toString('utf8').split('\n'))

/* ── the built tree, read as a reader reads it ──────────────────────────── */

const OUT = 'out'

/** This process's own scratch route, planted by the proofs at the bottom. */
const OWN_PROBE_DIR = ownProbeDir()

/**
 * Tags whose text is not rendered text. `SCRIPT` is the load-bearing one: Next
 * inlines the flight payload as escaped JavaScript strings, so a page's whole
 * prose appears there a second time, split across chunk boundaries and quoted.
 * Counting it would double every hit and shred the exact runs the disclosures
 * are keyed on.
 */
const NOT_RENDERED_TEXT: ReadonlySet<string> = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'])

/**
 * The tags that do NOT interrupt a sentence. Anything outside this set closes
 * the run, so a phrase is only ever assembled from words a reader meets as one
 * line of prose. `BR` is deliberately absent — it is a line break, and text on
 * two sides of one is not one sentence.
 */
const INLINE: ReadonlySet<string> = new Set([
  'SPAN',
  'A',
  'STRONG',
  'EM',
  'B',
  'I',
  'CODE',
  'SMALL',
  'SUP',
  'SUB',
  'ABBR',
  'MARK',
  'TIME',
  'U',
  'S',
  'Q',
  'CITE',
  'DFN',
  'KBD',
  'SAMP',
  'VAR',
  'BDI',
  'BDO',
])

/**
 * Every rendered run in the body: the maximal sequence of text nodes separated
 * only by inline markup, joined with one space.
 *
 * No ancestor is consulted for `hidden`, `aria-hidden` or `display:none` — see
 * finding 2 in the header.
 */
export function renderedRuns(html: string): readonly string[] {
  const doc = new JSDOM(html).window.document
  const runs: string[] = []
  let buffer: string[] = []
  const flush = (): void => {
    const text = buffer.join(' ').replace(/\s+/g, ' ').trim()
    if (text !== '') runs.push(text)
    buffer = []
  }
  const visit = (node: Node): void => {
    for (const child of node.childNodes) {
      // 3 is Node.TEXT_NODE and 1 is Node.ELEMENT_NODE. The DOM constant object
      // is a browser global and does not exist in the release project's node
      // environment.
      if (child.nodeType === 3) {
        const text = (child.nodeValue ?? '').replace(/\s+/g, ' ').trim()
        if (text !== '') buffer.push(text)
        continue
      }
      if (child.nodeType !== 1) continue
      const tag = (child as Element).tagName
      if (NOT_RENDERED_TEXT.has(tag)) continue
      if (INLINE.has(tag)) {
        visit(child)
        continue
      }
      flush()
      visit(child)
      flush()
    }
  }
  visit(doc.body)
  flush()
  return runs
}

interface BuiltPage {
  /** The path under `out/`, as a route. */
  readonly route: string
  readonly file: string
  readonly runs: readonly string[]
}

/**
 * Every `index.html` the export emits, except the framework chunks. THE WALK
 * ONLY — parsing is separate, because parsing eighty-four documents is what
 * this file costs and every gate below would otherwise pay it again. Written
 * as one function first: the release project runs in one worker, and repeating
 * the parse ran the heap out of memory at four gigabytes.
 *
 * The probe convention is hoisted into `tests/probe-paths.ts`: a scratch
 * directory belonging to a CONCURRENT process is skipped, so this listing is
 * blind to every probe but the one it plants itself. Passing `OWN_PROBE_DIR` is
 * what keeps the planted proofs visible — a scan that skipped its own plant
 * would be a gate that cannot fail.
 */
function builtPageFiles(): readonly { readonly route: string; readonly file: string }[] {
  const found: { route: string; file: string }[] = []
  const visit = (dir: string, route: string): void => {
    const index = join(dir, 'index.html')
    if (existsSync(index)) found.push({ route, file: index })
    // Throws on a missing out/ rather than listing zero pages, which would pass
    // every negative assertion in this file. Run `pnpm build`.
    for (const entry of readdirSync(dir)) {
      if (entry === '_next') continue
      if (isForeignProbe(entry, OWN_PROBE_DIR)) continue
      const child = join(dir, entry)
      if (statSync(child).isDirectory()) visit(child, `${route}/${entry}`)
    }
  }
  visit(OUT, '')
  return found
}

const pageOf = ({ route, file }: { route: string; file: string }): BuiltPage => ({
  route,
  file,
  runs: renderedRuns(readFileSync(file, 'utf8')),
})

/** The pages this process planted itself, read through the real walk. */
const probePages = (): readonly BuiltPage[] =>
  builtPageFiles()
    .filter((p) => p.route.includes(OWN_PROBE_DIR))
    .map(pageOf)

/** The five surfaces L78386 names, as the directories this build exports them to. */
const FIVE_SURFACES = ['/hub', '/studio', '/command-center', '/frontline', '/super-admin']

/**
 * THE NON-EMPTY GUARD, called by every gate that goes on to make a negative
 * assertion. A sweep of zero pages passes every `toEqual([])` that can be
 * written, which is how a gate reports safety over nothing.
 *
 * The floor is on RUNS rather than on pages: an export that still emits every
 * route but renders almost nothing on them is the same vacuous sweep with a
 * page count that looks healthy.
 *
 * PARSED ONCE, AT MODULE LOAD, AND HELD. Eighty-four documents through JSDOM
 * is 2.8s warm and was measured at 5.4s against a freshly written `out/` — over
 * the release project's 5,000 ms default, which has no override and is not this
 * file's to change. Doing it lazily inside the first gate made that gate time
 * out on a cold cache while doing nothing wrong; module load is not under the
 * test timeout, so the work happens once and no case pays for being first.
 *
 * The planted proofs below deliberately do NOT read this, so nothing they write
 * can reach a parsed page, and nothing parsed can hide a plant.
 */
const SWEPT: readonly BuiltPage[] = builtPageFiles()
  .filter((p) => !p.route.includes(OWN_PROBE_DIR))
  .map(pageOf)

function sweptPages(): readonly BuiltPage[] {
  const pages = SWEPT
  const missing = FIVE_SURFACES.filter((s) => !pages.some((p) => p.route.startsWith(s)))
  expect(
    missing,
    'a surface L78386 names exports no page at all. Run `pnpm build`. A sweep of an absent ' +
      'export reports zero prohibited phrasings over zero pages.',
  ).toEqual([])
  const runs = pages.reduce((total, p) => total + p.runs.length, 0)
  expect(runs, 'the built export contributed almost no rendered text').toBeGreaterThan(10_000)
  return pages
}

/* ── the disclosures ────────────────────────────────────────────────────── */

interface Disclosure {
  /** The exact rendered run, whitespace-collapsed. */
  readonly text: string
  /**
   * The words that carry the prohibited phrasing honestly. Every prohibited
   * match in `text` must fall inside this span.
   */
  readonly anchor: string
  /**
   * The frozen-source line `anchor` is verbatim at, or `null` where the run is
   * this build's own sentence and no such line exists.
   */
  readonly line: number | null
  /** Why this rendering is honest. Prose, and not machine-checked. */
  readonly why: string
}

/**
 * EXACT RUNS, EACH SUBTRACTED BY NAME.
 *
 * Not a region, not a page, not a component, not a heuristic about prose that
 * contains a qualifier — whole rendered runs. A prohibited phrasing appended to
 * any of them changes the run, matches nothing here, and is reported; that is
 * the property a region-based exemption cannot have.
 *
 * Deleting one from a screen is also a failure rather than a silent shrink:
 * `is still reached, every entry` requires every one to be found in the built
 * tree, so this list cannot pre-authorise a violation that has not shipped yet.
 *
 * WHY THE LIST IS AS LONG AS IT IS. Some of these exist only because the
 * dictionary reads a claim written through a copula — `the hold HAS BEEN
 * released`, `the clearance IS granted` — and dropping the copula would delete
 * them from this list in one edit. (This paragraph carried two different
 * counts of that split, one after the other, and the second was stale within a
 * wave of being written. Removed rather than renumbered, per RESUME §7: the
 * count was never the claim a reader could act on, and every entry below is
 * readable in full.) The copula is not dropped. That form is how a
 * completion claim is written as a sentence rather than printed on a badge, and
 * it is exactly the form the compliant confirmation dialog at L78432 exists to
 * refuse. The costs are not symmetric: a false report costs one reviewed line
 * in this list, and a missed one costs a supervisor being told something
 * happened on a device that has not happened.
 */
const DISCLOSURES: readonly Disclosure[] = [
  /* --- the source's own words, pinned to the line that carries them --- */
  {
    text: 'qualification clearance granted while the device was offline',
    anchor: 'qualification clearance granted while the device was offline',
    line: 81532,
    why: "UC-OFF-042's own title. The use case exists to say what happens when the grant cannot arrive, so its name is the disclosure.",
  },
  {
    text: "Apply a clearance granted as Client Command Center action 10 by a Supervisor acting from their own device, wherever they are, audited, and delivered on the command channel at the device's next sync. Roles allowed: Supervisor and above grant; the device applies. Online: applies within seconds. Offline: cannot arrive. Fallback: FB-FL-CMD-01. [ FUNC-B9-01-3-1 · L41695 ]",
    anchor:
      "Apply a clearance granted as Client Command Center action 10 by a Supervisor acting from their own device, wherever they are, audited, and delivered on the command channel at the device's next sync.",
    line: 41695,
    why: 'The clause names the command channel and the next sync in the same sentence as the grant, and the run goes on to say that offline it cannot arrive.',
  },
  {
    text: 'A qualification block is lifted by a clearance granted by a Supervisor in the Client Command Center and delivered over the command channel [ L2642 · Chapter 4.4’s own prose, two paragraphs above its matrix ]',
    anchor:
      'A qualification block is lifted by a clearance granted by a Supervisor in the Client Command Center and delivered over the command channel',
    line: 2642,
    why: 'Quoted on the screen with its own locator beside it, and the delivery is named in the same clause as the grant.',
  },
  {
    text: 'NOTIF-025 — “Clearance granted against an expired certification” (Chapter 30C.2 register name, L72989) 🔒 Locked — On, cannot be switched off',
    anchor: 'Clearance granted against an expired certification',
    line: 72989,
    why: "The Chapter 30C.2 notification register's own name for a notification type, which is a row of a catalogue and not a claim about a device — the notification is the thing that fires when a clearance is granted against an expired certification, and the reader is being told they cannot switch it off. It is quoted on the screen as the register's name with the line it is transcribed from, which is what makes it a quotation rather than the screen's own words; unmarked and unlocated it was reported here, and correctly.",
  },
  {
    text: 'SB-AI-25 44A.25 · FB-AI-25 — An offline tablet is suspended or wiped',
    anchor: 'An offline tablet is suspended or wiped',
    line: 94802,
    why: "Storyboard 25's own name, and the source's. It is the section heading verbatim at L94802 and the glance-table cell verbatim at L92717, and `src/ai/fallbacks/registry.ts` already records L94802 as this contract's locator. Same shape as the Chapter 30C.2 register name above: a catalogue entry naming a scenario, rendered inside an index of thirty entries all built as identifier, section, literal and title, not a claim that a particular tablet applied a suspension. The build may not rewrite a title the source writes.",
  },
  {
    text: 'The shift starts on time with degraded awareness, honestly stated. No run is blocked and no hold is released',
    anchor: 'No run is blocked and no hold is released',
    line: 95084,
    why: "Storyboard 28's Safe stop cell, verbatim at L95084 — the source's own words, which this build may not rewrite. It is also honest on the rule's own terms twice over: L78386 forbids a display implying an offline tablet HAS received or applied a hold release, and this sentence states that no hold was released at all. A negation of the prohibited claim is the one thing that cannot be the prohibited claim, and it is the same shape the device-wiped refusal below is exempted for.",
  },
  {
    text: 'Hold released; deviation dispositioned; Critical anomaly moves toward Resolved with a closure note',
    anchor: 'Hold released; deviation dispositioned; Critical anomaly moves toward Resolved with a closure note',
    line: 93319,
    why: "Storyboard 7's Final official state, transcribed cell for cell from L93319. It is not a live status: the card's own facts record every relevant device as acknowledged at this state, which is the only condition L12782 leaves open — it prohibits the claim as a GLOBAL one BEFORE all acknowledgements, and L12785 allows a claim that states exactly what is known. The build may not rewrite the source's cell, and rewording it would also delete the reconciled end state the storyboard exists to name.",
  },
  {
    text: 'Hold released; deviation dispositioned; Critical anomaly moves toward Resolved with a closure note [SoW Fact — §3.3]',
    anchor: 'Hold released; deviation dispositioned; Critical anomaly moves toward Resolved with a closure note',
    line: 93319,
    why: "The same cell rendered with the source's own classification marking, which L93319 carries inside the cell. Two runs rather than one because the card renders the field text with the marking and the reconstructed final-state name without it; both are subtracted by name, and a prohibited phrasing appended to either would land outside the anchor and be reported.",
  },

  /* --- this build's own sentences. FIXED AT NINE; see AUTHORED_BUDGET. --- */
  {
    text: 'On which surface is a Severity 1 lot hold released, and where does a Supervisor request one?',
    anchor: 'a Severity 1 lot hold released',
    line: null,
    why: 'A question about which surface owns the act. It asserts nothing about any device.',
  },
  {
    text: 'hold released and rendered issued → propagating → in force per device, deviation lands in the execution summary and on the Anomaly Register with Open to Resolved and a closure note',
    anchor: 'hold released and rendered issued',
    line: null,
    why: 'The run names the three-stage rendering the compliant replacement column asks for, in the same breath as the release.',
  },
  {
    text: 'hold released everywhere once every relevant device acknowledges, Anomaly Register entry Resolved with a closure note',
    anchor: 'hold released everywhere once every relevant device acknowledges',
    line: null,
    why: 'Conditioned on acknowledgement, which is exactly the qualifier whose absence L12782 prohibits.',
  },
  {
    text: 'The Run is blocked at a qualification gate awaiting a clearance. A clearance is granted remotely by a Supervisor or above and arrives on the command channel at the next synchronisation; there is no on-device worker override, ever. All prior captures are preserved and queued, and the worker continues with their other assigned Runs. [ SB-FL-011 L40471; FB-FL-GATE-01 L40112; STATE-A2-PARKED L40379; EXCL-FL-05 L39488 ]',
    anchor:
      'A clearance is granted remotely by a Supervisor or above and arrives on the command channel at the next synchronisation',
    line: null,
    why: 'Says where the grant is made and that it arrives at the next synchronisation. Nothing here claims a device has applied it.',
  },
  {
    text: 'A clearance is required. Clearances are granted in the Client Command Center.',
    anchor: 'Clearances are granted in the Client Command Center.',
    line: null,
    why: 'A statement of which surface holds the act, on a screen that does not hold it. It is about a surface, not about a worker.',
  },
  {
    text: 'An override control on a blocked assignment . Prohibited in all five columns (L28123), and AC-DOH-07-10 (L28235) requires the blocked row to offer "the clearance path and never an inline override". The clearance is granted in the Client Command Center as action number 10 and renders as a cross-surface statement, which carries no editing affordance by construction.',
    anchor: 'The clearance is granted in the Client Command Center as action number 10',
    line: null,
    why: 'Names the surface that holds action 10, inside a paragraph whose subject is a control this screen refuses to draw.',
  },
  {
    text: 'A clearance granted from here would run for 7 days before it lapses automatically, which is the tenant setting held in the gate settings below rather than a fixed per-shift expiry. On lapse the qualification returns to Expired and never to Valid.',
    anchor: 'A clearance granted from here would run for 7 days',
    line: null,
    why: 'States the duration a grant would have, not that a worker is unblocked. The subjunctive carries the whole sentence.',
  },
  {
    text: 'D21 — The module identity card governs the object vocabularies over the rivals elsewhere in the source: a Worker is active, archived or reactivated; a qualification runs the four warning stages as real states; a clearance is granted, active, lapsed or superseded by renewal. Cleared is the clearance showing through on the qualification chip and is not a seventh qualification state.',
    anchor: 'a clearance is granted, active, lapsed or superseded by renewal',
    line: null,
    why: 'The four names of a clearance object as a vocabulary list. Granted is one member of a lifecycle, not a claim that one landed.',
  },
  {
    text: 'No control marks a command applied, or a device wiped, locked or updated, on anything weaker than the device’s own report. There is no override for an unreached device (AC-SA-13-05, AC-SA-000-08).',
    anchor: 'or a device wiped, locked or updated, on anything weaker than the device’s own report',
    line: null,
    why: 'A refusal. The words name the thing being refused, which is the shape a sweep must not report.',
  },
]

/**
 * FIXED AT EXACTLY NINE, AND ASSERTED AS AN EQUALITY.
 *
 * A disclosure with no frozen-source line cannot be checked against the source
 * the way the other three are — there is nothing to check it against — so what
 * holds it is a budget rather than a proof. A tenth turns this file red and
 * forces somebody to decide whether the rendering is honest, instead of
 * widening a list nobody rereads.
 */
const AUTHORED_BUDGET = 9

const DISCLOSURE_BY_TEXT: ReadonlyMap<string, Disclosure> = new Map(
  DISCLOSURES.map((d) => [fold(d.text), d]),
)

/** Every `[start, end)` at which `needle` occurs in `haystack`. */
function spansOf(haystack: string, needle: string): readonly (readonly [number, number])[] {
  const spans: (readonly [number, number])[] = []
  if (needle === '') return spans
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    spans.push([at, at + needle.length])
  }
  return spans
}

interface Offence {
  readonly route: string
  readonly ruleId: string
  readonly words: string
  readonly bare: boolean
  readonly text: string
}

/**
 * Every prohibited phrasing in the built tree that no disclosure accounts for.
 *
 * A `bare-claim` match — the whole run IS the phrasing — is an offence with no
 * disclosure available at all, because that is the badge L12782, L12783 and
 * L12784 each prohibit and there is no honest way to render one. Everything
 * else is accounted for only when the WHOLE run matches a disclosure exactly
 * and the match falls inside that disclosure's anchor.
 */
function offencesIn(pages: readonly BuiltPage[]): readonly Offence[] {
  const offences: Offence[] = []
  for (const page of pages) {
    for (const text of page.runs) {
      const folded = fold(text)
      for (const match of phrasingMatches(folded)) {
        const bare = isBareClaim(folded, match)
        if (match.scope === 'bare-claim' && !bare) continue
        const disclosure = bare ? undefined : DISCLOSURE_BY_TEXT.get(folded)
        const inside =
          disclosure !== undefined &&
          spansOf(folded, fold(disclosure.anchor)).some(
            ([from, to]) => match.at >= from && match.at + match.words.length <= to,
          )
        if (!inside) {
          offences.push({ route: page.route, ruleId: match.ruleId, words: match.words, bare, text })
        }
      }
    }
  }
  return offences
}

const describeOffence = (o: Offence): string =>
  `${o.route}: [${o.ruleId}${o.bare ? ' · rendered as the whole claim' : ''}] “${o.words}” in — ` +
  `${o.text.length > 220 ? `${o.text.slice(0, 220)}…` : o.text}`

/* ── the gates ──────────────────────────────────────────────────────────── */

describe('slice 8: the frozen source these disclosures are checked against', () => {
  it('is present where every disclosure points', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
  })

  it('is the frozen bytes and not a drifted copy', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
  })

  it('has the line count the disclosures are numbered against', () => {
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

describe('slice 8: the sweep reads rendered runs, and finds phrasings to read', () => {
  it('covers every built page, and the five surfaces are among them', () => {
    expect(sweptPages().length).toBeGreaterThan(0)
  })

  // RED when: the matcher stops matching. A sweep whose dictionary fires on
  // nothing passes `toEqual([])` over an empty set for ever, and this build has
  // shipped fifteen gates that could not fail.
  it('its dictionary fires on the built tree', () => {
    const found = sweptPages().flatMap((p) => p.runs.flatMap((t) => phrasingMatches(fold(t))))
    expect(found.length, 'the prohibited-phrasing dictionary matched nothing at all').toBeGreaterThan(
      20,
    )
  })

  // The join is what makes a PHRASE dictionary work at all, and the two ways it
  // can silently stop working are joining nothing and joining everything.
  it('joins inline neighbours into one run and stops at a block boundary', () => {
    const runs = renderedRuns(
      '<html lang="en"><body><p>a <span>hold</span> <span>released</span></p>' +
        '<p>the hold</p><p>released at 11:04</p></body></html>',
    )
    expect(runs).toEqual(['a hold released', 'the hold', 'released at 11:04'])
  })

  it('reads the destination documents and not the framework chunks', () => {
    expect(sweptPages().filter((p) => p.file.includes('_next'))).toEqual([])
    const chunks = join(OUT, '_next')
    expect(existsSync(chunks), 'no out/_next — run `pnpm build`').toBe(true)
  })
})

describe('slice 8: no surface renders a phrasing the honesty rule prohibits', () => {
  it('in any state the export emits, hidden subtrees included', () => {
    expect(
      offencesIn(sweptPages()).map(describeOffence).sort(),
      'A rendered string implies an offline tablet received or applied something. The rule is ' +
        'L78386 and the dictionary is the table at L78400-L78407, transcribed in ' +
        'src/honesty/lexicon.ts. If this run is a DISCLOSURE describing the rule rather than a ' +
        'claim about a device, add it to DISCLOSURES as the exact run — never a region — with ' +
        'the frozen-source line its words come from where one exists. A run reported as the ' +
        'whole claim has no disclosure available: it is the badge L12782 prohibits, and the fix ' +
        'is the compliant replacement in column three.',
    ).toEqual([])
  })
})

describe('slice 8: the disclosures are checkable, and stay checkable', () => {
  it('names each rendered run exactly once', () => {
    const folded = DISCLOSURES.map((d) => fold(d.text))
    expect(folded.length).toBe(new Set(folded).size)
  })

  it('holds the build\'s own sentences at a fixed count', () => {
    const authored = DISCLOSURES.filter((d) => d.line === null)
    expect(
      authored.length,
      'a disclosure with no frozen-source line is held by a budget rather than by a proof. ' +
        'Decide whether the new rendering is honest, and change this number deliberately.',
    ).toBe(AUTHORED_BUDGET)
  })

  it('quotes a line inside the frozen source', () => {
    const outside = DISCLOSURES.filter(
      (d) => d.line !== null && (d.line < 1 || d.line > sourceLines.length),
    )
    expect(outside.map((d) => d.line)).toEqual([])
  })

  it('quotes words that are verbatim at the line each one names', () => {
    const wrong = DISCLOSURES.filter(
      (d) => d.line !== null && !fold(sourceLines[d.line - 1] ?? '').includes(fold(d.anchor)),
    ).map((d) => `L${String(d.line)} does not carry: ${d.anchor.slice(0, 120)}`)
    expect(
      wrong,
      'a disclosure claims the frozen source says something it does not say at that line',
    ).toEqual([])
  })

  it('quotes words the rendered run actually contains', () => {
    const wrong = DISCLOSURES.filter((d) => !fold(d.text).includes(fold(d.anchor))).map(
      (d) => `not inside the rendered run: ${d.anchor.slice(0, 120)}`,
    )
    expect(wrong).toEqual([])
  })

  // An unpinned disclosure whose anchor is the whole run would be a permission
  // that took its allowed string from the value under test — the tautology this
  // build has already shipped once. A real subspan is what makes appending a
  // claim to the end of the sentence land outside the anchor.
  it('keeps every authored anchor a real subspan of its run', () => {
    const whole = DISCLOSURES.filter(
      (d) => d.line === null && fold(d.anchor).length >= fold(d.text).length,
    ).map((d) => d.text.slice(0, 120))
    expect(whole).toEqual([])
  })

  // THE CLAUSE THAT MAKES THE LIST UNCHEATABLE. A disclosure may carry a
  // prohibited phrasing only inside the words it quotes; one appended to a real
  // quotation lands outside the anchor and is reported, so a disclosure cannot
  // be widened into a hiding place by extending its sentence.
  it('leaves no prohibited phrasing outside the words it quotes', () => {
    const leaked: string[] = []
    for (const d of DISCLOSURES) {
      const folded = fold(d.text)
      const spans = spansOf(folded, fold(d.anchor))
      for (const match of phrasingMatches(folded)) {
        if (match.scope === 'bare-claim' && !isBareClaim(folded, match)) continue
        const inside = spans.some(
          ([from, to]) => match.at >= from && match.at + match.words.length <= to,
        )
        if (!inside) leaked.push(`${d.text.slice(0, 60)}: “${match.words}” outside the quotation`)
      }
    }
    expect(leaked).toEqual([])
  })

  it('carries at least one prohibited phrasing in every anchor', () => {
    const idle = DISCLOSURES.filter((d) => phrasingMatches(fold(d.anchor)).length === 0).map((d) =>
      d.text.slice(0, 80),
    )
    expect(idle, 'a disclosure that discloses nothing is one nobody can audit').toEqual([])
  })

  it('states why every one of them is honest', () => {
    expect(DISCLOSURES.filter((d) => d.why.trim().length < 30).map((d) => d.text)).toEqual([])
  })

  it('is still reached, every entry, so none can pre-authorise a future violation', () => {
    const rendered = new Set(sweptPages().flatMap((p) => p.runs.map((t) => fold(t))))
    const stale = DISCLOSURES.filter((d) => !rendered.has(fold(d.text))).map((d) =>
      d.text.slice(0, 120),
    )
    expect(
      stale,
      'a disclosure no page renders any more. Delete it: a disclosure that has outlived its ' +
        'subject is a standing permission for text nobody has read.',
    ).toEqual([])
  })
})

/* ── the sweep reports planted defects ──────────────────────────────────── */

/**
 * Each proof plants a real page into the built tree at this process's own
 * scratch route, runs the REAL sweep over it, and removes it. The route is
 * excluded from the population guard and from nothing else, so the plant is
 * read by exactly the code the gate above runs.
 */
const plantedPage = (body: string): string =>
  `<!DOCTYPE html><html lang="en"><head><title>probe</title></head><body>${body}</body></html>`

const plantedOffences = (body: string, assertOn: (found: readonly Offence[]) => void): void => {
  withPlanted(OUT, 'index.html', plantedPage(body), () => {
    const planted = probePages()
    expect(planted.length, 'the plant was not read at all').toBe(1)
    assertOn(offencesIn(planted))
  })
}

const caught = (body: string, ruleId: string): void => {
  plantedOffences(body, (found) => {
    expect(found.map((o) => o.ruleId)).toContain(ruleId)
  })
}

describe('slice 8: the sweep reports planted defects', () => {
  it('reports a plain completion claim', () => {
    caught('<p>Hold released.</p>', 'hold-released')
  })

  // FINDING 1, AND THE ONE THIS FILE INVERTS. The two spans are adjacent, so
  // `textContent` returns `holdreleased` and no phrase pattern can match it;
  // keeping the nodes APART would leave `hold` and `released` in two separate
  // strings and no phrase pattern could match that either. Both controls are
  // asserted so the trap is proved live rather than assumed.
  it('reports a phrase split across two adjacent elements', () => {
    const body = '<p><span>Hold</span><span>released</span> at 11:04.</p>'
    const welded = new JSDOM(plantedPage(body)).window.document.body.textContent ?? ''
    expect(welded, 'the concatenation trap is no longer live').toContain('Holdreleased')
    expect(phrasingMatches(fold(welded)), 'a textContent sweep would have caught this').toEqual([])
    // And the other trap, which is the one this file had to step over: reading
    // the text nodes APART hands the matcher two words and no phrase.
    const apart = ['Hold', 'released', 'at 11:04.']
    expect(apart.flatMap((t) => phrasingMatches(fold(t)))).toEqual([])
    caught(body, 'hold-released')
  })

  // FINDING 2. Three ways to take text off the screen while leaving it in the
  // document. L78386 admits no state in which the rule does not apply.
  it('reports a hidden completion claim', () => {
    caught('<div hidden><p>Device wiped.</p></div>', 'device-wiped')
  })

  it('reports an aria-hidden completion claim', () => {
    caught('<div aria-hidden="true"><p>Device wiped.</p></div>', 'device-wiped')
  })

  it('reports a display:none completion claim', () => {
    caught('<div style="display:none"><p>Device wiped.</p></div>', 'device-wiped')
  })

  // FINDING 3.
  it('reports the plural of every rule that names a noun', () => {
    caught('<p>Holds released.</p>', 'hold-released')
    caught('<p>Clearances granted to the line.</p>', 'clearance-granted')
    caught('<p>Devices suspended.</p>', 'device-suspended')
    caught('<p>Tablets wiped.</p>', 'device-wiped')
    caught('<p>All tablets up to date.</p>', 'all-devices-up-to-date')
  })

  // The copula is how the same claim is written as a sentence instead of a
  // badge, and it is the form the compliant confirmation dialog at L78432
  // exists to refuse.
  it('reports the claim written through a copula', () => {
    caught('<p>The hold has been released.</p>', 'hold-released')
    caught('<p>The device was wiped.</p>', 'device-wiped')
    caught('<p>Version v2.2.0 deployed to the floor.</p>', 'deployed-to-the-floor')
    caught('<p>Notification sent to the worker.</p>', 'notification-sent-to')
  })

  // The bare-claim rules, which have no disclosure available at all. Both are
  // rendered as a badge would render them, and the second control proves the
  // scope is doing real work rather than banning the word outright.
  it('reports a lone state badge and leaves the honest sentence alone', () => {
    plantedOffences('<p><span>Synced</span></p>', (found) => {
      expect(found.map((o) => o.ruleId)).toContain('synced-alone')
      expect(found.every((o) => o.bare)).toBe(true)
    })
    plantedOffences('<p><span>Done</span></p>', (found) => {
      expect(found.map((o) => o.ruleId)).toContain('tick-next-to-done')
    })
    plantedOffences('<p>Last synced 08:29 · 14 pending, and the work is done.</p>', (found) => {
      expect(found).toEqual([])
    })
  })

  // A tick beside the word is the artefact L78384 names, and trimming only the
  // ends is what stops the decoration buying it a pass.
  it('reports a lone state badge wearing a tick', () => {
    caught('<p>✓ Synced ·</p>', 'synced-alone')
  })

  // FINDING 4, BOTH DIRECTIONS. The disclosure passes verbatim; the same run
  // with a claim welded onto it does not. This is the whole reason a disclosure
  // is an exact run and not a region.
  it('passes a disclosure verbatim and reports the claim that quotes it', () => {
    const disclosure = 'qualification clearance granted while the device was offline'
    plantedOffences(`<p>${disclosure}</p>`, (found) => {
      expect(found).toEqual([])
    })
    caught(`<p>${disclosure}. Hold released.</p>`, 'hold-released')
  })

  it('reports a claim appended to a real quotation', () => {
    caught(
      '<p>A qualification block is lifted by a clearance granted by a Supervisor in the ' +
        'Client Command Center and delivered over the command channel. Clearance granted.</p>',
      'clearance-granted',
    )
  })
})

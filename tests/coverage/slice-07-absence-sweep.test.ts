import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { isForeignProbe, ownProbeDir, withPlanted } from '../probe-paths'

/**
 * # THE RENDERED-TEXT CATEGORICAL-ABSENCE SWEEP OVER THE BUILT FRONTLINE TREE
 *
 * The Frontline Worker Application carries one prohibition that is not a
 * setting, not a permission and not a default: **no pace, no timer, no
 * countdown, no ranking, no productivity comparison, anywhere in rendered
 * text, in any state.**
 *
 * The governing invariant is §3.3, Support, Not Surveillance, which opens at
 * L1994 and is stated at L2000 — the application must be felt by the worker
 * as support rather than as an instrument watching them. Prohibition one at
 * L2002 is the pace half of it. (It is NOT §15.2, which is the role-grant
 * lifecycle; a sweep filed under the wrong invariant is a sweep nobody can
 * check.)
 *
 * The surface-level statements are `AC-FL-000-5` (L39100), `TEST-FL-000-3`
 * (L39108), `AC-SCR-FL-002` (L48690) and `AC-SCOPE-045` (L2683).
 * `EXCL-FL-08` (L39491) classes it Invariant rather than Placement or
 * Roadmap — it is not a thing this release defers, it is a thing the product
 * does not do.
 *
 * ## THE INSTRUMENT, AND THE FIVE WAYS THIS SLICE ALREADY WATCHED ONE FAIL
 *
 * Every one of these was proved by planting, not reasoned about.
 *
 * 1. **`textContent` CANNOT FAIL.** It concatenates adjacent elements with no
 *    separator, so a rendered `a timer` followed by a state token reads back
 *    as one run of letters and a word-boundary pattern never matches.
 *    `MOD-FL-A3` planted a pace word and watched its gate stay green. This
 *    file walks TEXT NODES and keeps them apart, and matches on letter
 *    lookarounds rather than `\b` — either fix alone would do; both are here
 *    because the failure was silent.
 *
 * 2. **`hidden` DEFEATS `textContent` TOO** — for a gate asserting PRESENCE.
 *    `MOD-FL-B9` and `MOD-FL-B12` each moved a statement behind a click and
 *    watched it pass verbatim. This gate asserts ABSENCE, so the polarity
 *    inverts: hidden text is deliberately IN scope. A pace figure behind a
 *    `hidden` attribute, an `aria-hidden` wrapper or a `display:none` rule is
 *    still rendered text in a state, and `AC-FL-000-5` says any state. So no
 *    ancestor is consulted and no visibility is computed — everything in the
 *    body counts.
 *
 * 3. **PLURALS.** `MOD-FL-B9` planted `timers` against a singular pattern and
 *    it passed. Every spelling below carries its plural.
 *
 * 4. **THE WORDS APPEAR LEGITIMATELY, IN PROSE THAT FORBIDS THEM.** A naive
 *    grep reports this build's own honesty as a violation: the storyboard
 *    quotes `AC-SCOPE-045` at L2683 and `EXCL-FL-08` at L39491 by name, it
 *    renders the source's own word for the rejected artefact inside
 *    `FUNC-A3-06-1-2` at L40634, and `DEC-PARK-001`'s third candidate
 *    behaviour at L41682 legitimately contains a timer word — that is the
 *    source's own open proposal and quoting it IS the disclosure.
 *
 *    So the sweep separates a word used as a PRODUCT AFFORDANCE from a word
 *    used in a DISCLOSURE THAT FORBIDS IT, and it does that the way
 *    `MOD-FL-A2` did: by subtracting one exact string, named, and asserting
 *    it verbatim against its line — never by exempting a region, because a
 *    region is where anything can hide.
 *
 *    Every exemption below is a triple. `text` is the exact rendered text
 *    node. `line` is the frozen-source line it comes from. `anchor` is the
 *    source's own words. the gates below assert all three at once:
 *    the anchor is verbatim at that line of the frozen source, the anchor is
 *    inside the rendered text, and **every prohibited word in the rendered
 *    text falls inside the anchor**. The last clause is what makes this
 *    uncheatable in the direction that matters — to render a pace figure you
 *    would have to find a frozen-source line that already contains it.
 *
 * 5. **FRAMEWORK CHUNKS.** `out/_next/**` carries these words in unrelated
 *    JavaScript. The sweep reads rendered HTML text from the seven
 *    destination documents and nothing else, and the gate named `reads the
 *    destination documents and not the framework chunks` proves that
 *    exclusion is load-bearing rather than assumed.
 *
 * ## WHAT THIS DOES NOT COVER, STATED RATHER THAN IMPLIED
 *
 * A static export contains what the server rendered. Eleven Frontline
 * components are client components, and a branch of one that renders only
 * after a click is not in `out/`. This sweep therefore covers every state the
 * export emits — which today includes forty state tokens on the Run Player
 * alone, hidden subtrees included — and not a branch reachable only at
 * runtime. The authored-source half of that question is a different
 * instrument (`slice-03-gates.test.ts` scans source LINES) and is not
 * merged in here: a line carries prose and needs denial exemptions, a
 * rendered text node does not, and one matcher would have to be wrong for
 * one of them.
 */

/* ── the frozen source ──────────────────────────────────────────────────── */

/**
 * Resolved from the repository rather than written absolute:
 * `prohibited-patterns.test.ts` bans an author path from the release
 * artifact and there is no reason to type one here either.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)

/**
 * The trailing newline yields one extra empty element that is not a line.
 * Leaving it in makes the count 122,242 and lets an exemption one past the
 * end pass the range check.
 */
const sourceLines = ((lines: readonly string[]) =>
  lines.at(-1) === '' ? lines.slice(0, -1) : lines)(sourceBytes.toString('utf8').split('\n'))

/**
 * The one normalisation both sides pass through, so a comparison between a
 * markdown line and a rendered text node is a comparison of words rather
 * than of typography.
 *
 * The frozen source writes identifiers in backticks and emphasis in
 * asterisks; the built pages render neither. React renders a typographic
 * apostrophe where the source has a straight one, and the same sentence
 * appears BOTH ways in the built tree — `MOD-FL-B9` and `MOD-FL-B11` render
 * the identical `DEC-PARK-001` sentence with different apostrophes. Folding
 * is what stops that being two problems.
 *
 * Lower-casing at the end is why the matcher below needs no `i` flag: every
 * string it ever sees has already been folded.
 */
const fold = (s: string): string =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[`*_]/g, '')
    .replace(/[–—‒]/g, '-')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/* ── the words, and where each one's authority comes from ───────────────── */

interface ProhibitedWord {
  /** The name this word is reported under. */
  readonly id: string
  /** Its spellings, as an alternation. Plurals are mandatory — finding 3. */
  readonly spellings: string
}

/**
 * Nine concepts, every one of them a word the frozen source itself uses for
 * the artefact it refuses. Nothing here is invented vocabulary: a gate that
 * hunts words the source never names is a gate whose failures nobody can
 * adjudicate.
 *
 *   pace         `AC-FL-000-5` L39100, `AC-SCOPE-045` L2683, `EXCL-FL-08`
 *                L39491, `AC-SCR-FL-002` L48690, and prohibition one at
 *                L2002.
 *   timer        `TEST-FL-000-3` L39108, `AC-SCOPE-045` L2683,
 *                `AC-SCR-FL-002` L48690, `EXCL-FL-08` L39491.
 *   countdown    `AC-FL-000-5` L39100 — the only one of the four statements
 *                that uses this word, which is precisely why it is here.
 *   ranking      `TEST-FL-000-3` L39108 scans for ranking widgets; §3.3 at
 *                L1998 says the application never ranks workers against each
 *                other, which is where `ranks` and `ranked` come from.
 *   leaderboard  L121236 — no per-worker pace leaderboard, for supervisors
 *                or for anybody.
 *   stopwatch    §3.3 at L1998 and at L2002; `AC-FL-002-3` L39264.
 *   productivity L2040 — the per-worker productivity dashboard the platform
 *                refuses as a position rather than as a configuration.
 *   performance  `AC-SCOPE-045` L2683 and `EXCL-FL-08` L39491 both name a
 *                performance display. It is the noisiest word here — four of
 *                the twenty exemptions exist only because of it — and it
 *                stays, because dropping it would let a rendered score walk
 *                past every other pattern.
 *   elapsed      `SB-FL-002` L39235 renders the REJECTED design's own
 *                artefact: an elapsed figure against a target. Zero
 *                occurrences today, which is the point.
 *
 * `paced` is deliberately absent: a self-paced training item is a learner
 * control, not a measurement of a worker, and the source refuses the second.
 * Adding it would buy one exemption and no coverage.
 */
const PROHIBITED_WORDS: readonly ProhibitedWord[] = [
  { id: 'pace', spellings: 'paces?|pacing' },
  { id: 'timer', spellings: 'timers?' },
  { id: 'countdown', spellings: 'countdowns?' },
  { id: 'ranking', spellings: 'rankings?|ranks?|ranked' },
  { id: 'leaderboard', spellings: 'leaderboards?' },
  { id: 'stopwatch', spellings: 'stopwatch(?:es)?' },
  { id: 'productivity', spellings: 'productivity' },
  { id: 'performance', spellings: 'performance' },
  { id: 'elapsed', spellings: 'elapsed' },
]

/**
 * LETTER LOOKAROUNDS, NEVER `\b`, and that is finding 1 written as a regex.
 *
 * `\b` fails on `a timerSTATE-A3-REVIEW` — the join `textContent` produces —
 * because the boundary it needs sits between two word characters. A letter
 * lookaround does not care what `textContent` would have done, and it also
 * refuses `space`, `namespace` and `self-paced` for the same one reason: the
 * neighbour is a letter. Digits and hyphens are NOT letters, so `timer-2`
 * and `pace 40` are still found.
 *
 * Built fresh at each call. A shared `g` regex carries `lastIndex` between
 * calls and would skip hits in every second string it was handed.
 */
const wordPattern = (): RegExp =>
  new RegExp(`(?<![a-z])(?:${PROHIBITED_WORDS.map((w) => w.spellings).join('|')})(?![a-z])`, 'g')

interface Hit {
  /** The matched spelling, as folded. */
  readonly word: string
  /** Offset into the folded string. */
  readonly at: number
}

const hitsIn = (folded: string): readonly Hit[] =>
  [...folded.matchAll(wordPattern())].map((m) => ({ word: m[0], at: m.index }))

/* ── the built tree ─────────────────────────────────────────────────────── */

const OUT_FRONTLINE = join('out', 'frontline')
const APP_FRONTLINE = join('app', 'frontline')

/** This process's own scratch route, planted by the proofs at the bottom. */
const OWN_PROBE_DIR = ownProbeDir()
const OWN_PROBE_ROUTE = `/frontline/${OWN_PROBE_DIR}`

/**
 * Tags whose text is not rendered text. `SCRIPT` is the load-bearing one:
 * Next inlines the flight payload as escaped JavaScript strings, so a page's
 * whole prose appears there a second time, split across chunk boundaries and
 * quoted. Counting it would double every hit and shred the exact strings the
 * exemptions are keyed on.
 */
const NOT_RENDERED_TEXT: ReadonlySet<string> = new Set([
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
  'NOSCRIPT',
])

/**
 * Every text node in the body, whitespace-collapsed, kept APART.
 *
 * No ancestor is consulted for `hidden`, `aria-hidden`, `display:none` or
 * `visibility:hidden` — see finding 2. This gate asserts absence, so hidden
 * text is in scope, and computing visibility could only ever shrink what it
 * sees.
 */
function renderedTextNodes(html: string): readonly string[] {
  const doc = new JSDOM(html).window.document
  // 4 is NodeFilter.SHOW_TEXT. The DOM constant object is a browser global
  // and does not exist in the release project's node environment.
  const walker = doc.createTreeWalker(doc.body, 4)
  const nodes: string[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const owner = node.parentElement
    if (owner !== null && NOT_RENDERED_TEXT.has(owner.tagName)) continue
    const text = (node.nodeValue ?? '').replace(/\s+/g, ' ').trim()
    if (text !== '') nodes.push(text)
  }
  return nodes
}

interface BuiltPage {
  /** `/frontline` or `/frontline/<slug>`. */
  readonly route: string
  readonly file: string
  readonly texts: readonly string[]
}

/**
 * The probe convention is hoisted into `tests/probe-paths.ts`: a scratch
 * directory belonging to a CONCURRENT process is skipped, so this listing is
 * blind to every probe but the one it plants itself. Passing `OWN_PROBE_DIR`
 * is what keeps the planted proofs visible — a scan that skipped its own
 * plant would be a gate that cannot fail.
 */
function builtFrontlinePages(): readonly BuiltPage[] {
  const pages: BuiltPage[] = []
  const push = (route: string, dir: string): void => {
    const file = join(dir, 'index.html')
    if (!existsSync(file)) return
    pages.push({ route, file, texts: renderedTextNodes(readFileSync(file, 'utf8')) })
  }
  push('/frontline', OUT_FRONTLINE)
  // Throws on a missing out/ rather than scanning zero pages, which would
  // pass every negative assertion in this file. Run `pnpm build`.
  for (const entry of readdirSync(OUT_FRONTLINE)) {
    if (isForeignProbe(entry, OWN_PROBE_DIR)) continue
    const child = join(OUT_FRONTLINE, entry)
    if (!statSync(child).isDirectory()) continue
    push(`/frontline/${entry}`, child)
  }
  return pages
}

/** The destinations authored under `app/frontline`, as routes. */
function authoredFrontlineRoutes(): readonly string[] {
  const routes: string[] = []
  const visit = (dir: string, route: string): void => {
    if (existsSync(join(dir, 'page.tsx'))) routes.push(route)
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const child = join(dir, entry)
      if (statSync(child).isDirectory()) visit(child, `${route}/${entry}`)
    }
  }
  visit(APP_FRONTLINE, '/frontline')
  return routes.sort()
}

/**
 * THE NON-EMPTY GUARD, called by every gate that goes on to make a negative
 * assertion. A sweep of zero pages passes every `toEqual([])` that can be
 * written, which is how a gate reports safety over nothing.
 */
function sweptPages(): readonly BuiltPage[] {
  const pages = builtFrontlinePages()
  const population = pages
    .map((p) => p.route)
    .filter((r) => r !== OWN_PROBE_ROUTE)
    .sort()
  expect(
    population,
    'the built Frontline export no longer matches the destinations authored under ' +
      'app/frontline. Run `pnpm build`. A route on one side only is either a page that ' +
      'stopped exporting or an export with no author — and a sweep of an absent export ' +
      'reports zero pace figures over zero pages.',
  ).toEqual(authoredFrontlineRoutes())
  return pages
}

/* ── the exemptions ─────────────────────────────────────────────────────── */

interface Disclosure {
  /** The exact rendered text node, whitespace-collapsed. */
  readonly text: string
  /** The frozen-source line the words come from. */
  readonly line: number
  /**
   * The source's own words, verbatim at `line` and inside `text`. Omitted
   * when the whole rendered node is the source's own words.
   */
  readonly anchor?: string
}

const anchorOf = (d: Disclosure): string => d.anchor ?? d.text

/**
 * TWENTY EXACT STRINGS, EACH SUBTRACTED BY NAME.
 *
 * Not a region, not a page, not a component, not a "prose containing a
 * negation" heuristic — twenty whole rendered text nodes, each pinned to
 * the frozen-source line whose words it carries. Adding a twenty-first
 * requires finding those words already in the source at the line you name;
 * the gates below refuse anything else, and refuse an exemption whose
 * rendered node carries a prohibited word OUTSIDE the words it quotes.
 *
 * Deleting a disclosure from a screen is also a failure, not a silent
 * shrink: `is still reached, every entry` requires every one of them to be
 * found in the built tree, so this list cannot be used to pre-authorise a
 * violation that has not shipped yet.
 */
const DISCLOSURES: readonly Disclosure[] = [
  /* --- the device profile, open until DEC-DEVICE-001 lands --- */
  {
    text: 'AC-FL-025-5 requires DEC-DEVICE-001 and DEC-SCAN-001 to remain visibly open, and no published budget or performance commitment to be stated as final before they close.',
    line: 42561,
    anchor: 'no published budget or performance commitment',
  },
  {
    text: 'AC-FL-025-5 requires DEC-DEVICE-001 to remain visibly open and no published budget or performance commitment to be stated as final before it closes.',
    line: 42561,
    anchor: 'no published budget or performance commitment',
  },
  {
    text: 'The standardised device profile — the make or class, capability tier, and operating-system split the target fleets will standardise on. The published minimum specification and the performance envelope are all set against this answer.',
    line: 42506,
    anchor: 'and the performance envelope are all set against this answer',
  },

  /* --- the prohibition itself, quoted on the screens that carry it --- */
  {
    text: 'AC-SCOPE-045 — no pace, timer, or performance display exists in any module or state.',
    line: 2683,
    anchor: 'no pace, timer, or performance display exists in any module or state',
  },
  {
    text: 'No screen in any module, in any state, in any release of this scope displays a pace figure, a countdown against expectation, or a comparison to another worker.',
    line: 39100,
  },
  {
    text: 'Worker-facing pace, timer, or performance display',
    line: 39491,
  },

  /* --- timing drives coaching, and the worker is never shown the clock --- */
  {
    text: 'Let Studio-authored timing thresholds drive coaching while never surfacing the stopwatch.',
    line: 40634,
  },
  {
    text: 'Let Studio-authored timing thresholds drive coaching while the worker sees the support content and never the stopwatch.',
    line: 41543,
  },
  {
    text: "Offline, the step's authored Work Instructions serve as the fallback. A dismissal, recorded but silent to the supervisor by default. A repeated-coaching pattern, escalating to an actionable signal. A timing-threshold trigger, which produces a card and never a stopwatch.",
    line: 41494,
  },
  {
    text: 'Help arrives at the moment of difficulty rather than in a binder across the shop floor, and it never becomes a performance record.',
    line: 41458,
  },

  /* --- DEC-PARK-001's third candidate behaviour, an OPEN source proposal.
         Quoting it is the disclosure; paraphrasing it away would be the
         build deciding an open client decision on the client's behalf.

         MOD-FL-B9 and MOD-FL-B11 render the second sentence with DIFFERENT
         apostrophes — one straight, one typographic — and it is ONE entry
         here, not two. That is `fold` earning its place: the alternative is
         an exemption list carrying a row per glyph, where the row nobody
         updated is the hiding place. --- */
  {
    text: 'Candidate behaviour three: the run no-show timers at plus 15 and plus 30 minutes take over.',
    line: 41682,
    anchor: 'the run no-show timers at plus 15 and plus 30 minutes take over',
  },
  {
    text: "Open item: what happens when the parked Run is the worker's only assigned Run is Not specified in the Statement of Work and is proposed as DEC-PARK-001; the candidate behaviours are that the worker idles with an honest explanation, that the Supervisor is escalated to immediately rather than through the ordinary path, or that the run no-show timers at plus 15 and plus 30 minutes take over.",
    line: 41682,
  },

  /* --- the artificial-intelligence rows, which name the refused capability
         in order to refuse it --- */
  {
    text: "Not applicable — no artificial-intelligence capability participates in assignment, ordering, readiness, or selection on this surface. Ordering presents what the Delivery Operations Hub assigned; introducing a ranking model here would be work allocation by another name, which §7.1.5 excludes. Lane A learning tunes selection and ranking preferences elsewhere in the platform, never the worker's assigned-work list.",
    line: 40398,
    anchor:
      "Ordering presents what the Delivery Operations Hub assigned; introducing a ranking model here would be work allocation by another name, which §7.1.5 excludes. Lane A learning tunes selection and ranking preferences elsewhere in the platform, never the worker's assigned-work list.",
  },
  {
    text: 'Ordering presents what the Delivery Operations Hub assigned; introducing a ranking model here would be work allocation by another name, which §7.1.5 excludes.',
    line: 40398,
  },
  {
    text: "Not applicable — no artificial-intelligence capability composes, ranks, filters, or suppresses notifications on this surface. Notification routing is a structured, tenant-scoped record keyed by severity level, resolving roles to people on shift, and introducing a model into that path would make delivery non-deterministic where the platform's escalation guarantees depend on determinism.",
    line: 41825,
    anchor:
      'no artificial-intelligence capability composes, ranks, filters, or suppresses notifications on this surface',
  },
  {
    text: 'Not applicable — no artificial-intelligence capability selects, ranks, translates, or summarises training material in this release. The platform does not machine-translate or dub long-form media; training content stays authored, controlled, and predictable. A Vision Reasoning Agent ships in a later release with the vision atoms and has no role here.',
    line: 42147,
    anchor:
      'no artificial-intelligence capability selects, ranks, translates, or summarises training material in this release',
  },

  /* --- DEC-PLUS-001: `Supervisor and above` is a role reading, never an
         ordering of people. The word here is `rank` in the sense of
         hierarchy, and the sentence exists to refuse that reading. --- */
  {
    text: 'This chapter therefore reads Supervisor and above as "any identity holding the Supervisor role or the Quality Manager role", and never as a rank comparison, and preserves the ambiguity as DEC-PLUS-001.',
    line: 39840,
  },
  {
    text: 'Chapter 22 reads "Supervisor and above" as "any identity holding the Supervisor role or the Quality Manager role", and never as a rank comparison, and preserves the ambiguity.',
    line: 39840,
    anchor: 'and never as a rank comparison',
  },
  {
    text: 'The chapter’s reading is carried and labelled as the chapter’s: an identity holding the Supervisor role or the Quality Manager role, never a rank comparison. It costs this module nothing to carry, because the matrix rows it governs are both on the far side of the surface boundary and neither draws a control here. Nothing on this screen orders the five roles, and no cell is widened or narrowed by the reading.',
    line: 39840,
    anchor: 'a rank comparison',
  },
  {
    text: 'The chapter’s reading is carried and labelled as the chapter’s: an identity holding the Supervisor role or the Quality Manager role, never a rank comparison. Nothing on this screen orders the five roles, and no cell is widened or narrowed by the reading.',
    line: 39840,
    anchor: 'a rank comparison',
  },
]

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
  readonly word: string
  readonly text: string
}

/**
 * Every prohibited word in the built tree that no exemption accounts for.
 *
 * An exemption accounts for a hit only when the WHOLE rendered node matches
 * an entry exactly and the hit falls inside that entry's quoted anchor.
 * Adding a pace figure to the end of an exempted sentence therefore changes
 * the node, matches nothing, and is reported — which is the property that a
 * region-based exemption cannot have.
 */
function offencesIn(pages: readonly BuiltPage[]): readonly Offence[] {
  const offences: Offence[] = []
  for (const page of pages) {
    for (const text of page.texts) {
      const folded = fold(text)
      const hits = hitsIn(folded)
      if (hits.length === 0) continue
      const disclosure = DISCLOSURE_BY_TEXT.get(folded)
      const spans =
        disclosure === undefined ? [] : spansOf(folded, fold(anchorOf(disclosure)))
      for (const hit of hits) {
        const inside = spans.some(
          ([from, to]) => hit.at >= from && hit.at + hit.word.length <= to,
        )
        if (!inside) offences.push({ route: page.route, word: hit.word, text })
      }
    }
  }
  return offences
}

const describeOffence = (o: Offence): string =>
  `${o.route}: “${o.word}” in — ${o.text.length > 220 ? `${o.text.slice(0, 220)}…` : o.text}`

/* ── the gates ──────────────────────────────────────────────────────────── */

describe('slice 7: the frozen source these exemptions are checked against', () => {
  it('is present where every exemption points', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
  })

  it('is the frozen bytes and not a drifted copy', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
  })

  it('has the line count the exemptions are numbered against', () => {
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

describe('slice 7: the sweep reads rendered text, and finds words to read', () => {
  it('covers every authored Frontline destination', () => {
    const pages = sweptPages()
    expect(pages.length).toBeGreaterThan(0)
  })

  it('reads enough of each page to be reading the page', () => {
    for (const page of sweptPages()) {
      expect(page.texts.length, `${page.route} contributed almost no rendered text`).toBeGreaterThan(
        100,
      )
    }
  })

  // RED when: the matcher stops matching. A sweep whose pattern fires on
  // nothing passes `toEqual([])` over an empty set for ever, and this build
  // has shipped fifteen gates that could not fail.
  it('its pattern fires on the built tree', () => {
    const found = sweptPages().flatMap((p) => p.texts.flatMap((t) => hitsIn(fold(t))))
    expect(found.length, 'the prohibited-word pattern matched nothing at all').toBeGreaterThan(20)
  })

  // Finding 5, asserted rather than assumed: the framework chunks DO carry
  // these words, and the sweep does not read them. A `_next` that stopped
  // carrying one would make this check vacuous, so both halves are asserted.
  it('reads the destination documents and not the framework chunks', () => {
    const swept = sweptPages().map((p) => p.file)
    expect(swept.filter((f) => f.includes('_next'))).toEqual([])
    const chunks = join('out', '_next')
    expect(existsSync(chunks), 'no out/_next — run `pnpm build`').toBe(true)
    const carriers = readdirSync(join(chunks, 'static'), { recursive: true })
      .map((e) => join(chunks, 'static', String(e)))
      .filter((f) => f.endsWith('.js') && statSync(f).isFile())
      .filter((f) => hitsIn(fold(readFileSync(f, 'utf8'))).length > 0)
    expect(
      carriers.length,
      'out/_next no longer carries a prohibited word, so excluding it proves nothing',
    ).toBeGreaterThan(0)
  })
})

describe('slice 7: no Frontline screen renders pace, a timer, a countdown, a ranking or a productivity comparison', () => {
  it('in any state the export emits, hidden subtrees included', () => {
    expect(
      offencesIn(sweptPages()).map(describeOffence).sort(),
      'A Frontline screen renders a word the platform refuses to show a worker. §3.3 ' +
        '(L1994) is the invariant and L2002 is prohibition one; AC-FL-000-5 (L39100) and ' +
        'AC-SCOPE-045 (L2683) state it, and EXCL-FL-08 (L39491) classes it Invariant. If ' +
        'this text is a DISCLOSURE quoting the source rather than an affordance, add it to ' +
        'DISCLOSURES with the frozen-source line its words come from — the exact node, never ' +
        'a region.',
    ).toEqual([])
  })
})

describe('slice 7: the exemptions are the frozen source’s own words', () => {
  it('names each rendered node exactly once', () => {
    const folded = DISCLOSURES.map((d) => fold(d.text))
    expect(folded.length).toBe(new Set(folded).size)
  })

  it('quotes a line inside the frozen source', () => {
    const outside = DISCLOSURES.filter((d) => d.line < 1 || d.line > sourceLines.length)
    expect(outside.map((d) => d.line)).toEqual([])
  })

  it('quotes words that are verbatim at the line each one names', () => {
    const wrong = DISCLOSURES.filter(
      (d) => !fold(sourceLines[d.line - 1] ?? '').includes(fold(anchorOf(d))),
    ).map((d) => `L${d.line} does not carry: ${anchorOf(d).slice(0, 120)}`)
    expect(
      wrong,
      'an exemption claims the frozen source says something it does not say at that line',
    ).toEqual([])
  })

  it('quotes words the rendered node actually contains', () => {
    const wrong = DISCLOSURES.filter((d) => !fold(d.text).includes(fold(anchorOf(d)))).map(
      (d) => `not inside the rendered node: ${anchorOf(d).slice(0, 120)}`,
    )
    expect(wrong).toEqual([])
  })

  // THE CLAUSE THAT MAKES THE LIST UNCHEATABLE. An exemption may carry a
  // prohibited word only where the frozen source carries it. A pace figure
  // appended to a real quotation lands outside the anchor and is reported,
  // so an exemption cannot be widened into a hiding place by extending its
  // sentence.
  it('leaves no prohibited word outside the words it quotes', () => {
    const leaked: string[] = []
    for (const d of DISCLOSURES) {
      const folded = fold(d.text)
      const spans = spansOf(folded, fold(anchorOf(d)))
      for (const hit of hitsIn(folded)) {
        const inside = spans.some(
          ([from, to]) => hit.at >= from && hit.at + hit.word.length <= to,
        )
        if (!inside) leaked.push(`L${d.line}: “${hit.word}” outside the quotation`)
      }
    }
    expect(leaked).toEqual([])
  })

  it('quotes at least one prohibited word in every anchor', () => {
    const idle = DISCLOSURES.filter((d) => hitsIn(fold(anchorOf(d))).length === 0).map(
      (d) => `L${d.line}`,
    )
    expect(idle, 'an exemption that exempts nothing is an exemption nobody can audit').toEqual([])
  })

  it('is still reached, every entry, so none can pre-authorise a future violation', () => {
    const rendered = new Set(sweptPages().flatMap((p) => p.texts.map((t) => fold(t))))
    const stale = DISCLOSURES.filter((d) => !rendered.has(fold(d.text))).map(
      (d) => `L${d.line}: ${d.text.slice(0, 120)}`,
    )
    expect(
      stale,
      'an exemption no Frontline page renders any more. Delete it: an exemption that has ' +
        'outlived its subject is a standing permission for text nobody has read.',
    ).toEqual([])
  })
})

/* ── the sweep reports planted defects ──────────────────────────────────── */

/**
 * Each proof plants a real page into the built tree at this process's own
 * scratch route, runs the REAL sweep over it, and removes it. The route is
 * excluded from the population guard and from nothing else, so the plant is
 * read by exactly the code the gate above runs.
 *
 * The five findings each get one, because each of them is a way a sweep of
 * this shape has already been watched to stay green over a live defect.
 */
const plantedPage = (body: string): string =>
  `<!DOCTYPE html><html lang="en"><head><title>probe</title></head><body>${body}</body></html>`

const caught = (body: string, expected: string): void => {
  withPlanted(OUT_FRONTLINE, 'index.html', plantedPage(body), () => {
    const offences = offencesIn(sweptPages()).filter((o) => o.route === OWN_PROBE_ROUTE)
    expect(offences.map((o) => o.word)).toContain(expected)
  })
}

describe('slice 7: the sweep reports planted defects', () => {
  it('reports a plain pace figure', () => {
    caught('<p>Your pace this shift: 41 units per hour.</p>', 'pace')
  })

  // FINDING 1. The two spans are adjacent with no whitespace between them, so
  // `textContent` returns `a timerSTATE-A3-REVIEW` and `\btimer\b` finds
  // nothing. The control below is the proof that the trap is live and that
  // this reader is what steps over it.
  it('reports a word that textContent would weld to its neighbour', () => {
    const body = '<span>a timer</span><span>STATE-A3-REVIEW</span>'
    const welded = new JSDOM(plantedPage(body)).window.document.body.textContent ?? ''
    expect(welded, 'the concatenation trap is no longer live').toMatch(/timerSTATE/)
    expect(/\btimer\b/.test(welded), 'a textContent sweep would still have caught this').toBe(false)
    caught(body, 'timer')
  })

  // FINDING 2. Three ways to take text off the screen while leaving it in the
  // document. AC-FL-000-5 (L39100) says any state, so all three are in scope.
  it('reports a hidden countdown', () => {
    caught('<div hidden><p>Countdown to target: 00:35</p></div>', 'countdown')
  })

  it('reports an aria-hidden countdown', () => {
    caught('<div aria-hidden="true"><p>Countdown to target: 00:35</p></div>', 'countdown')
  })

  it('reports a display:none countdown', () => {
    caught('<div style="display:none"><p>Countdown to target: 00:35</p></div>', 'countdown')
  })

  // FINDING 3.
  it('reports the plural of every measured word', () => {
    caught('<p>Two timers are running.</p>', 'timers')
    caught('<p>Two countdowns are running.</p>', 'countdowns')
    caught('<p>Shift rankings are published nightly.</p>', 'rankings')
    caught('<p>Shift leaderboards are published nightly.</p>', 'leaderboards')
  })

  // FINDING 4, BOTH DIRECTIONS. The disclosure passes verbatim; the same
  // sentence with a figure welded onto it does not. This is the whole reason
  // the exemption is an exact string and not a region.
  it('passes the disclosure verbatim and reports the affordance that quotes it', () => {
    const disclosure = 'Worker-facing pace, timer, or performance display'
    withPlanted(OUT_FRONTLINE, 'index.html', plantedPage(`<p>${disclosure}</p>`), () => {
      expect(
        offencesIn(sweptPages()).filter((o) => o.route === OWN_PROBE_ROUTE),
      ).toEqual([])
    })
    caught(`<p>${disclosure}: 41 units per hour</p>`, 'pace')
  })

  it('reports a pace figure appended to a real quotation', () => {
    caught(
      '<p>AC-SCOPE-045 — no pace, timer, or performance display exists in any module or state. ' +
        'Current pace: 41/h.</p>',
      'pace',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'

/**
 * MARKUP THAT ESCAPED INTO PROSE — a sweep over every built page.
 *
 * WHY THIS FILE EXISTS. An independent review of slice 7 found the literal
 * text `role="group"` printed **fourteen times** on the Run Player, the
 * worker's main screen. It was there because an accessibility repair inserted
 * the attribute twice: once correctly inside the opening tag, and once on the
 * line after it, where JSX reads it as a text child. The built HTML carried it
 * as escaped body text.
 *
 * NOTHING IN THE SUITE COULD SEE IT, and the list of what could not is the
 * reason this gate is general rather than Frontline-shaped:
 *
 *   - the module's own component suite was 28/28 green, because every text
 *     assertion in it is `toContain` or a testid count and none compares an
 *     element's whole text for equality;
 *   - the categorical-absence sweep looks for nine specific prohibited words;
 *   - the accessibility scan has no rule for stray text — the markup was
 *     valid, it just said the wrong thing;
 *   - the slice gates read `src/` against the blueprint and never open
 *     `out/`.
 *
 * So the defect was invisible to four independent harnesses and visible to any
 * human who loaded the page. That asymmetry is what this gate closes.
 *
 * WHAT IT LOOKS FOR. Text nodes of every built page, matched against shapes
 * that are markup rather than prose: an attribute assignment (`name="value"`
 * or `name={value}`), a bare JSX tag, or a lone closing brace-paren. A
 * sentence in this build may legitimately quote an identifier or a source
 * line; none of them looks like an attribute assignment.
 *
 * SCOPE. Every `index.html` under `out/`, not one surface, because the repair
 * that produced this ran over one directory and the mistake it made is
 * available to any hand-edit anywhere.
 */

const OUT = join(process.cwd(), 'out')

/**
 * `isForeignProbe` is not optional politeness. Every gate in this build proves
 * it can fail by planting a scratch file on the real shared filesystem, so two
 * suites running at once walk each other's probes: one lists a sibling's and
 * ENOENTs on it the moment the sibling's `finally` removes it. This walk was
 * written without it and `tests/coverage/prohibited-patterns.test.ts` caught
 * that on the first release run — which is the gate whose whole subject is
 * directory walks that are not probe-aware.
 */
function pagesUnder(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (entry === '_next') continue
    if (statSync(full).isDirectory()) pagesUnder(full, acc)
    else if (entry === 'index.html') acc.push(full)
  }
  return acc
}

/**
 * Text nodes only, kept apart. `textContent` welds adjacent elements together
 * with no separator, which is how a `\b` pattern was twice proved unable to
 * fail in this build — so the nodes are extracted and joined with a newline
 * rather than concatenated. `<script>` is dropped: Next inlines the whole page
 * prose again as its flight payload, and a hit there is the same hit twice.
 */
function textNodes(html: string): string[] {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, '')
  return withoutStyles
    .split(/<[^>]*>/)
    .map((t) =>
      t
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim(),
    )
    .filter((t) => t.length > 0)
}

/**
 * The shapes. Each is markup that reached prose, and none of them can be
 * produced by writing an ordinary sentence.
 *
 * `attribute` is deliberately narrow: a lowercase identifier, optionally
 * hyphenated or namespaced, immediately followed by `=` and a quote or brace.
 * That is an attribute assignment and not a sentence — this build's prose
 * quotes identifiers like `MOD-FL-A3` and lines like `L40045` constantly, and
 * neither matches.
 */
const MARKUP_SHAPES: readonly { readonly name: string; readonly re: RegExp }[] = [
  { name: 'attribute assignment', re: /(?:^|\s)[a-z][a-zA-Z0-9]*(?:[-:][a-zA-Z0-9]+)*=["'{]/ },
  // A tag, but ONLY a closing one or one carrying an attribute. A bare
  // `<name>` is not markup escaping into prose in this build — it is how the
  // documentation writes a placeholder, and three real pages use it:
  // `registries/generated/<slug>.json`, `Synced <time>`, and one more on the
  // notifications register. Requiring a slash or an attribute keeps every
  // genuinely escaped tag and drops all three, without an exemption list —
  // and an exemption list is where the next one would hide.
  { name: 'escaped JSX tag', re: /<\/[A-Za-z][A-Za-z0-9]*>|<[A-Za-z][A-Za-z0-9]*\s+[a-z-]+=["'{]/ },
  { name: 'orphaned closing brace-paren', re: /^\s*\}\)?\s*;?\s*$/ },
]

const PAGES = pagesUnder(OUT)

describe('markup that escaped into prose', () => {
  // FAILS IF: `out/` is not built, in which case every sweep below would pass
  // by having nothing to read. Planted: OUT pointed at a directory with no
  // pages. Went red here rather than silently green everywhere else.
  it('reads a built tree with pages in it', () => {
    expect(PAGES.length).toBeGreaterThan(50)
  })

  // FAILS IF: any built page renders text shaped like markup.
  //
  // Planted: `role="group"` restored as a text child on one line of
  // `src/frontline/modules/fl-b8/CoachingPanel.tsx`, then `pnpm build`. Went
  // red naming the page, the shape and the node. Restored, rebuilt, green.
  it('renders no attribute assignment, bare tag or orphaned brace as prose', () => {
    const offenders: string[] = []
    for (const page of PAGES) {
      const nodes = textNodes(readFileSync(page, 'utf8'))
      for (const node of nodes) {
        for (const shape of MARKUP_SHAPES) {
          if (shape.re.test(node)) {
            offenders.push(
              `${page.replace(OUT, 'out')}: ${shape.name} — ${JSON.stringify(node.slice(0, 90))}`,
            )
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  // FAILS IF: the sweep above stops being able to see the defect it was
  // written for. This is the vacuity proof, and it is here because eleven
  // gates in the surrounding slice could not fail when first written and none
  // was found by review.
  //
  // It runs the real predicate over a synthetic node carrying the exact text
  // that shipped, and over ordinary prose from this build that must NOT match.
  it('can see the defect it was written for, and does not fire on this build’s prose', () => {
    const shouldMatch = [
      'role="group"',
      '  role="group"',
      'aria-label={heading}',
      '<div className="space-y-6">',
      '</section>',
      '})',
    ]
    for (const text of shouldMatch) {
      expect(
        MARKUP_SHAPES.some((s) => s.re.test(text)),
        `must be caught: ${text}`,
      ).toBe(true)
    }

    const mustNotMatch = [
      'MOD-FL-A3 — Run Player',
      'Explicitly prohibited — Supervisors act by step-up, not by session',
      'The hold stands; no device write lifts it',
      'L40045',
      'Severity 1 hold fires immediately, even offline.',
      'AC-FL-010-1 counts destinations a worker can stand in.',
      'a < b and c > d',
      'registries/generated/<slug>.json',
      'Synced <time> · N of M devices offline',
    ]
    for (const text of mustNotMatch) {
      const hit = MARKUP_SHAPES.find((s) => s.re.test(text))
      expect(hit?.name ?? null, `must not be caught: ${text}`).toBeNull()
    }
  })
})

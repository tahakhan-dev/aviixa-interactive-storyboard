import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { renderedText } from './rendered-text'

/**
 * THE NOT-REAL STATEMENT, OVER THE WHOLE EXPORT (audit round 6, `R6-B08`).
 *
 * WHY THIS FILE EXISTS, AND WHY IT IS THE ONE NEW GATE THIS WAVE ADDS.
 * Master prompt §29.4's last blocking condition forbids a completion claim
 * when "the application implies a production backend, native application,
 * security enforcement, integration, scheduler, artificial-intelligence
 * provider, real device command, or audit guarantee that was only
 * simulated". Six of those eight categories are answered in this build by
 * one convention and nothing else: every screen says, in its own reading
 * order, that its behaviour is simulated.
 *
 * EIGHTEEN COMPONENT TESTS ASSERT THAT CONVENTION AND EVERY ONE IS A
 * PER-SCREEN QUERY. A per-screen query can only ever speak for the screen it
 * names, so the population it covers is whatever set of screens somebody
 * remembered to write a test for. Measured on the built export at round 6:
 * 85 of 103 pages carried a not-real statement in payload-stripped rendered
 * text and EIGHTEEN CARRIED NONE — the fourteen `/coverage/<registry>/`
 * indexes (which render from `app/coverage/[registry]/page.tsx` while the
 * disclosure lived one level up in `app/coverage/page.tsx`), the three 404
 * variants, and `/workflows/ai-and-its-absence/`, at 155,695 characters the
 * largest page in the export and entirely artificial-intelligence prose.
 * Nothing in the suite could see any of it, because nothing walked `out/`.
 *
 * THE EXEMPTION LIST IS EMPTY, AND THAT IS A DELIBERATE OUTCOME RATHER THAN
 * A CONVENIENCE. The brief asked for any exemption to be written as an
 * equality over a named list, not as a count, and asked for the 404 variants
 * to be checked deliberately rather than exempted by reflex. They were, and
 * the check came out the same way it does for every other page: a reader who
 * lands on the 404 has landed in the deliverable. One line in
 * `app/not-found.tsx` is a stronger result than a three-entry exemption list.
 *
 * THE STATEMENTS ARE A NAMED LIST, NOT A SUBSTRING. Round 5's standing
 * lesson is that a gate holds the wording it was written against rather than
 * the class it was written for. So the accepted statements are enumerated,
 * and each one must still be EARNED by at least one page: a statement nobody
 * renders any more is removed from the list by the gate going red, rather
 * than sitting here widening the predicate for free.
 */

const OUT = join(process.cwd(), 'out')

/**
 * Every page in the export, `404.html` included — it is a real page a reader
 * reaches and it is not an `index.html`, so a walk keyed on that filename
 * misses it. `_next` is build output rather than a page.
 *
 * `isForeignProbe` is not politeness: this project's files plant scratch
 * files under `out/` to prove themselves permeable, and a walk that is not
 * probe-aware ENOENTs on a sibling's probe the moment its `finally` runs.
 */
function pagesUnder(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '_next' || isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) pagesUnder(full, acc)
    else if (entry.endsWith('.html')) acc.push(full)
  }
  return acc
}

/**
 * The not-real statements this build actually renders, each one a phrase a
 * reader sees rather than a marker in the markup.
 *
 * Two members, and the second is why this is a list. Every surface console,
 * every module screen, the coverage dashboard, the workflow index and now the
 * registry indexes, the 404 and the artificial-intelligence page open with
 * `Simulated behaviour only`. The entry page at `/` says the same thing in
 * its own words and always has, and rewriting its opening paragraph to match
 * a test would be the test dictating the product.
 */
const NOT_REAL_STATEMENTS = [
  'Simulated behaviour only',
  'Every action here is simulated against local fixtures',
] as const

/**
 * Pages allowed to carry no not-real statement, compared BY EQUALITY rather
 * than by count. It is empty, and an entry added here has to argue for
 * itself in the reason beside it.
 */
const DISCLOSURE_EXEMPT: readonly { readonly page: string; readonly why: string }[] = []

const PAGES = pagesUnder(OUT).sort()

interface PageRead {
  readonly page: string
  readonly statements: readonly string[]
}

const READS: readonly PageRead[] = PAGES.map((page) => {
  const text = renderedText(readFileSync(page, 'utf8'))
  return {
    page: relative(process.cwd(), page),
    statements: NOT_REAL_STATEMENTS.filter((s) => text.includes(s)),
  }
})

describe('the not-real statement, over every built page', () => {
  // FAILS IF: `out/` is missing or thin, in which case every absence claim
  // below would pass by having nothing to read. 103 pages shipped at round 6;
  // the floor is deliberately below that so adding a route is not a red, and
  // deliberately above the point where a broken build could sneak past.
  it('reads a built export with the whole page population in it', () => {
    expect(PAGES.length).toBeGreaterThanOrEqual(100)
    // `404.html` is not an `index.html` and is the page this walk exists to
    // include; asserting it by name stops a future walk narrowing to
    // `index.html` and silently dropping a third of the 404 variants.
    expect(READS.map((r) => r.page)).toContain('out/404.html')
  })

  // FAILS IF: any built page renders no not-real statement.
  //
  // The offender list carries the page and its rendered size, because the
  // finding this gate closes was found by noticing that the LARGEST page in
  // the export was on it.
  //
  // Planted: the disclosure paragraph deleted from
  // `app/coverage/[registry]/page.tsx` and `pnpm build` re-run. Went red
  // naming all fourteen registry index pages. Restored, rebuilt, green — and
  // the restored file checksummed against the pre-plant bytes.
  it('renders a not-real statement on every page, with an exemption list asserted by equality', () => {
    const missing = READS.filter((r) => r.statements.length === 0).map((r) => r.page)
    expect(missing).toEqual(DISCLOSURE_EXEMPT.map((e) => e.page))
  })

  // FAILS IF: an exemption loses its reason. Vacuous today by construction --
  // the list is empty -- and that is the point: the shape is here so the
  // first entry cannot be added without one.
  it('gives every exemption a reason', () => {
    for (const entry of DISCLOSURE_EXEMPT) {
      expect(entry.why.length, `${entry.page} needs a reason`).toBeGreaterThan(40)
    }
  })

  // FAILS IF: an accepted statement is rendered by no page. A list of
  // accepted wordings is a widened predicate, and a widened predicate that
  // nothing uses is how the next unlisted wording gets waved through. Every
  // member has to be earned.
  it('renders every accepted statement somewhere, so the list cannot grow unused members', () => {
    const unused = NOT_REAL_STATEMENTS.filter(
      (s) => !READS.some((r) => r.statements.includes(s)),
    )
    expect(unused).toEqual([])
  })

  // FAILS IF: the predicate stops being able to see the defect it was written
  // for. Eleven gates in this build could not fail when first written, so the
  // real predicate is run here over a page whose visible body has been
  // emptied but whose React flight payload still carries every sentence --
  // which is exactly the state `R5-Q01` found three gates in, and exactly
  // what a raw grep over `out/` cannot tell from a real disclosure.
  it('is not satisfied by a disclosure that survives only in the flight payload', () => {
    const payloadOnly =
      '<html><body><main><h1>Coverage</h1></main>' +
      '<script>self.__next_f.push([1,"Simulated behaviour only. This surface is a ' +
      'client-validation storyboard, not a connected production system."])</script>' +
      '</body></html>'
    const text = renderedText(payloadOnly)
    expect(NOT_REAL_STATEMENTS.filter((s) => text.includes(s))).toEqual([])

    const real =
      '<html><body><main><p>Simulated behaviour only. Not a connected system.</p></main></body></html>'
    expect(NOT_REAL_STATEMENTS.filter((s) => renderedText(real).includes(s))).toEqual([
      'Simulated behaviour only',
    ])
  })
})

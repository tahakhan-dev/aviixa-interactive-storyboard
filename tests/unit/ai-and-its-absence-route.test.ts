import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  AI_AND_ITS_ABSENCE_ROUTE,
  ALL_THIRTY_STORYBOARDS,
  PAUSE_FEATURE_IDENTIFIERS,
  STORYBOARD_IDENTIFIER_ORDER,
} from '../../app/workflows/ai-and-its-absence/scope'
import { PAUSE_FEATURE_ATTRIBUTION } from '@/ai/controls/decisions'
import { ownersOf } from '@/ai/fallbacks/registry'

/**
 * THE ROUTE THAT MAKES THIRTY STORYBOARDS REACHABLE, AND THE EVIDENCE CLASS
 * THAT MAKES "REACHABLE" A MEASUREMENT RATHER THAN A CLAIM.
 *
 * ── WHY A TOKEN SCAN IS THE SUBJECT OF THIS FILE ───────────────────────────
 * `registries/generated/ai-storyboards.json` read 0 of 48 for the `SB-AI-*`
 * register on the tree this route landed on, and that zero was CORRECT. The
 * status computation in `scripts/build-registries.mjs` walks every directory
 * under `app/` holding a `page.tsx`, reads the `.ts`/`.tsx` files sitting
 * DIRECTLY in it (a nested route owns itself), and collects every
 * `[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+` token it finds. A row reads
 * `demonstrated-in-storyboard` when that set holds its exact identifier as a
 * whole token. Six `SB-AI-*` identifiers were already named under `src/` and
 * not one of them moved the status, because `src/` is not `app/`.
 *
 * So a page that resolves its identifiers at RUN time from an imported data
 * module renders them for a human and is invisible to that scan. That is not a
 * hypothetical: `FEAT-SA-0703`, `SUB-SA-0703` and `FUNC-SA-0703` are real
 * source identifiers at L47803, rendered on the incident console since wave 3,
 * and all three read `not-represented` for exactly this reason — the console
 * renders them out of a constant in `src/`.
 *
 * The literal lists this file checks therefore are not decoration. They are the
 * page's own navigable index and its own disclosure, declared where the
 * evidence class can see them, and cross-checked here against the canonical
 * records so they cannot drift into a list that agrees with nothing.
 *
 * ── THE MEMBERSHIP GATES ARE LISTS, AND THEY ARE PROVED BY ADDING ──────────
 * `EXPECTED_IDENTIFIERS` below is a literal list declared in this file, not
 * `ALL_THIRTY_STORYBOARDS.map(...)` and not a length. A list derived from the
 * value under test agrees with any set that value happens to hold; a length
 * agrees with any set of the same size. Both were watched to pass on a wrong
 * population in this build. Adding a thirty-first member to the route's own
 * order, or dropping one, is red here.
 */

/**
 * The thirty, transcribed from the card identifier rows rather than counted.
 * `SB-AI-01` L92793 · `SB-AI-15` L93992 · `SB-AI-30` L95251 anchor the ends and
 * the middle; `src/ai/storyboards/contract.ts` carries the full index of the
 * thirty identifier rows, all thirty confirmed against it.
 */
const EXPECTED_IDENTIFIERS = [
  'SB-AI-01', 'SB-AI-02', 'SB-AI-03', 'SB-AI-04', 'SB-AI-05',
  'SB-AI-06', 'SB-AI-07', 'SB-AI-08', 'SB-AI-09', 'SB-AI-10',
  'SB-AI-11', 'SB-AI-12', 'SB-AI-13', 'SB-AI-14', 'SB-AI-15',
  'SB-AI-16', 'SB-AI-17', 'SB-AI-18', 'SB-AI-19', 'SB-AI-20',
  'SB-AI-21', 'SB-AI-22', 'SB-AI-23', 'SB-AI-24', 'SB-AI-25',
  'SB-AI-26', 'SB-AI-27', 'SB-AI-28', 'SB-AI-29', 'SB-AI-30',
] as const

const ROUTE_DIR = join(process.cwd(), 'app/workflows/ai-and-its-absence')

/** The exact expression `scripts/build-registries.mjs` collects citations with. */
const CITED_TOKEN = /[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g
/** The exact expression the same script counts module ownership with. */
const MODULE_TOKEN = /MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g

/**
 * The token set the registry build would compute for this route directory,
 * gathered the way the script gathers it: files directly in the directory, no
 * descent, `.ts` and `.tsx` alike, raw text including comments. A gate that
 * scanned a different shape would be green on evidence the build cannot see.
 *
 * THE SKIP IS THE SHARED PREDICATE, IMPORTED AND NEVER RE-DECLARED. Five
 * files in this slice wrote a narrower inline form and were corrected for it.
 * This listing keeps DIRECTORY entries, which is exactly the shape a probe
 * arrives as, so a concurrent gate's probe would be listed here and then
 * ENOENT the moment that process's `finally` removes it — or be read as a
 * finding. The prose lives OUT here on purpose: the gate that polices this
 * reads each function's body text WITH its comments, so a note about the
 * predicate written inside the body would satisfy the gate on its own and the
 * skip below could then be deleted without turning anything red.
 */
function routeDirSources(): { readonly name: string; readonly text: string }[] {
  const out: { name: string; text: string }[] = []
  for (const entry of readdirSync(ROUTE_DIR, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    if (entry.isDirectory()) continue
    if (!/\.tsx?$/.test(entry.name)) continue
    out.push({ name: entry.name, text: readFileSync(join(ROUTE_DIR, entry.name), 'utf8') })
  }
  return out
}

function citedTokensOfRouteDir(): Set<string> {
  const tokens = new Set<string>()
  for (const { text } of routeDirSources()) {
    for (const token of text.match(CITED_TOKEN) ?? []) tokens.add(token)
  }
  return tokens
}

describe('the route is a shipped route screen', () => {
  it('holds a page.tsx, which is what makes its directory a route at all', () => {
    const files = readdirSync(ROUTE_DIR)
    expect(files, 'no page.tsx means no route, and no evidence of any kind').toContain('page.tsx')
  })

  it('states its own path, and states that the source names none', () => {
    expect(AI_AND_ITS_ABSENCE_ROUTE.path).toBe('/workflows/ai-and-its-absence')
    // Measured: `grep -n` for this path in the frozen source returns zero, the
    // same measurement `/super-admin/ai-incidents` recorded. The slug is this
    // build's, and the route says so above the fold.
    expect(AI_AND_ITS_ABSENCE_ROUTE.sourceStatus).toContain('APP-012')
    expect(AI_AND_ITS_ABSENCE_ROUTE.chapterSpan).toBe('L92596-L95408')
  })
})

describe('the thirty, as a literal order rather than a length', () => {
  it('the route order is exactly the thirty identifiers', () => {
    expect([...STORYBOARD_IDENTIFIER_ORDER]).toEqual([...EXPECTED_IDENTIFIERS])
  })

  it('the aggregated cards are those thirty, in that order', () => {
    expect(ALL_THIRTY_STORYBOARDS.map((s) => s.identifier)).toEqual([...EXPECTED_IDENTIFIERS])
  })

  it('and their numbers ascend one to thirty with no gap and no repeat', () => {
    const numbers = ALL_THIRTY_STORYBOARDS.map((s) => s.number)
    expect(numbers).toEqual(EXPECTED_IDENTIFIERS.map((_, i) => i + 1))
  })
})

describe('reachability: every one of the thirty is a whole token in the route directory', () => {
  const tokens = citedTokensOfRouteDir()

  it.each(EXPECTED_IDENTIFIERS)('%s is cited by this shipped route screen', (identifier) => {
    expect(
      tokens.has(identifier),
      `${identifier} is not a whole token in any file of ${AI_AND_ITS_ABSENCE_ROUTE.path}, `
        + 'so its registry row stays not-represented however well the page renders it',
    ).toBe(true)
  })

  it('and the count of the thirty found is the whole thirty', () => {
    const missing = EXPECTED_IDENTIFIERS.filter((id) => !tokens.has(id))
    expect(missing).toEqual([])
  })

  it('names no MOD-* identifier, which the build would read as route ownership', () => {
    // Same rule and same reason as `tests/unit/ai-controls-route-ownership.
    // test.ts`: the registry build counts `MOD-*` mentions in a route's own
    // files and reads the winner as the owner, and this chapter mints no module
    // identifier at all. A reader still sees the pause feature's
    // source-attributed module, rendered from `PAUSE_FEATURE_ATTRIBUTION`.
    const offenders: string[] = []
    for (const { name, text } of routeDirSources()) {
      for (const token of text.match(MODULE_TOKEN) ?? []) {
        offenders.push(`${name}: ${token}`)
      }
    }
    expect(offenders, 'a module mention read as ownership of a route no module claims').toEqual([])
  })
})

describe('the compound fallback key, never the bare literal', () => {
  it('every card keys on a section number and not on the bare chapter', () => {
    for (const storyboard of ALL_THIRTY_STORYBOARDS) {
      expect(storyboard.fallback.chapter, storyboard.identifier).toBe(`44A.${storyboard.number}`)
      expect(storyboard.fallback.chapter, storyboard.identifier).not.toBe('44A')
    }
  })

  it('sixteen of the thirty literals are claimed by another chapter too', () => {
    // Not asserted as sixteen. The set is named: `FB-AI-01` through `FB-AI-16`
    // are the overlap between chapter 40/41's register (L88915-L88939) and
    // §44A's, so those and only those carry another owner. A count would agree
    // with any sixteen.
    const colliding = ALL_THIRTY_STORYBOARDS.filter(
      (s) =>
        ownersOf(s.fallback.identifier).filter((o) => o.chapter !== s.fallback.chapter).length > 0,
    ).map((s) => s.fallback.identifier)
    expect(colliding).toEqual([
      'FB-AI-01', 'FB-AI-02', 'FB-AI-03', 'FB-AI-04', 'FB-AI-05', 'FB-AI-06',
      'FB-AI-07', 'FB-AI-08', 'FB-AI-09', 'FB-AI-10', 'FB-AI-11', 'FB-AI-12',
      'FB-AI-13', 'FB-AI-14', 'FB-AI-15', 'FB-AI-16',
    ])
  })
})

describe('the emergency pause feature triple, named where the collision is rendered', () => {
  /**
   * `FB-AI-01` has four owners and the route renders storyboard 1's. One of the
   * other three is the chapter-24 family row at L46951, "Artificial-intelligence
   * degraded or unavailable, including the platform emergency pause" — and
   * L47803 files that emergency pause as a source-attributed feature whose own
   * declared fallback is that same literal. So the reader looking at
   * `44A.1 · FB-AI-01` needs the feature the other owner belongs to, by name.
   *
   * Naming it here is also what makes three earned census rows visible. All
   * three read `not-represented` today because the incident console renders
   * them out of a constant, and the status rule counts whole tokens in an
   * `app/` file.
   */
  it('is the triple the source-attributed record holds, and not a retyped guess', () => {
    expect([...PAUSE_FEATURE_IDENTIFIERS]).toEqual([
      PAUSE_FEATURE_ATTRIBUTION.feature.id,
      PAUSE_FEATURE_ATTRIBUTION.subFeature.id,
      PAUSE_FEATURE_ATTRIBUTION.function.id,
    ])
  })

  it('is the literal triple L47803 carries', () => {
    expect([...PAUSE_FEATURE_IDENTIFIERS]).toEqual([
      'FEAT-SA-0703',
      'SUB-SA-0703',
      'FUNC-SA-0703',
    ])
  })

  it('and the pause feature declares the literal this page renders four owners of', () => {
    expect(PAUSE_FEATURE_ATTRIBUTION.fallback).toBe('FB-AI-01')
    const owners = ownersOf('FB-AI-01').map((o) => o.chapter)
    expect(owners).toContain('24')
    expect(owners).toContain('44A.1')
  })

  it.each(['FEAT-SA-0703', 'SUB-SA-0703', 'FUNC-SA-0703'])(
    '%s is a whole token in the route directory',
    (identifier) => {
      expect(citedTokensOfRouteDir().has(identifier)).toBe(true)
    },
  )
})

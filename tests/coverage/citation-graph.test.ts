/**
 * THE CITATION GATE.
 *
 * This build's evidence is line citations into a frozen 122,241-line blueprint,
 * and the measured position is uncomfortable: of ~13,594 citations, only about a
 * fifth can be checked against the words at the line they name. The rest prove a
 * line exists and nothing more.
 *
 * `registries/blueprint-locators.json` is a second, independent record of where
 * each identifier actually sits, distilled from the knowledge graph and
 * re-verified against the frozen source. This gate is what makes that record
 * trustworthy enough to lean on, and it does two things:
 *
 *   1. SELF-VERIFICATION. Every locator in the index is opened in the frozen
 *      source and required to carry its identifier. An index of wrong lines is
 *      worse than no index -- it lends a bad locator the authority of a
 *      generated artefact, and this build has already shipped 66 wrong locators
 *      in one document and a coverage count inflated by identifiers that
 *      appeared only in comments.
 *
 *   2. PROMOTION, MEASURED. It counts how many citations in the tree the index
 *      can independently corroborate. That number is the whole point of the
 *      exercise, so it is asserted rather than printed -- a figure nothing
 *      defends is a figure that quietly rots, which is exactly what happened to
 *      the strong/weak split until a ratchet was put under it.
 *
 * WHY THE INDEX AND NOT THE GRAPH. `graphify-out/graph.json` is ~10MB and
 * git-ignored, so a gate reading it would be red on any clean checkout -- and a
 * check that is red for a reason nobody caused is a check people learn to
 * ignore, then delete. The graph is a local tool; this is its committed residue.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { isForeignProbe } from '../probe-paths'

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const INDEX_FILE = join(ROOT, 'registries', 'blueprint-locators.json')

interface LocatorIndex {
  readonly source: { readonly sha256: string; readonly lines: number }
  readonly windowLines: number
  readonly index: Readonly<Record<string, readonly number[]>>
}

const index = JSON.parse(readFileSync(INDEX_FILE, 'utf8')) as LocatorIndex
const sourceBytes = readFileSync(SOURCE)
const sourceLines = sourceBytes.toString('utf8').split('\n')

/**
 * A citation and the identifier immediately before it, e.g. `DEC-SYNC-001 (L39672)`
 * or `AC-OFF-505 L78560`. The identifier must PRECEDE the line number within a
 * few characters: an identifier after a citation is the co-citation form, which
 * was measured on this build at forty reports and zero defects.
 */
const CITED = /\b((?:MOD|SCR|FEAT|SUB|FUNC|AC|TEST|DEC|WF|SB|OBJ|FB|SEQ|STATE|EVT|CMD|NOTIF|SCHED|UC|REQ|OFF|RISK|ASSUM)-[A-Z0-9][A-Z0-9.-]*[A-Z0-9])[\s(,—-]{0,6}L(\d{3,6})\b/g

const SCAN_ROOTS = ['src', 'app', 'tests', 'scripts'] as const
const SCANNED = /\.(ts|tsx|mjs|js)$/

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry) || entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (SCANNED.test(entry)) acc.push(full)
  }
  return acc
}

const files = SCAN_ROOTS.flatMap((r) => walk(join(ROOT, r)))

interface Citation {
  readonly file: string
  readonly identifier: string
  readonly line: number
}
const citations: Citation[] = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(CITED)) {
    citations.push({ file, identifier: m[1] as string, line: Number(m[2]) })
  }
}

describe('the locator index describes the frozen source it claims to', () => {
  it('is built against the blueprint this repository actually has', () => {
    const sha = createHash('sha256').update(sourceBytes).digest('hex')
    expect(sha, 'the frozen source has changed since the index was built').toBe(index.source.sha256)
    expect(sourceLines.length).toBe(index.source.lines)
  })

  it('is not a stub', () => {
    // Non-vacuity, and it guards every negative assertion below: an empty index
    // corroborates nothing and would let the promotion floor be met by zero.
    expect(Object.keys(index.index).length, 'identifiers indexed').toBeGreaterThan(1_500)
  })

  it('every locator it lists carries its identifier in the frozen source', () => {
    // THE SELF-VERIFICATION. Opened and read, not trusted. A window is allowed
    // because a permission-matrix row is labelled with a module id that sits in
    // the table heading above it -- but the window is the one the index declares,
    // so it cannot be widened here until things pass.
    const offenders: string[] = []
    for (const [identifier, locators] of Object.entries(index.index)) {
      for (const line of locators) {
        const from = Math.max(0, line - index.windowLines + 2)
        const window = sourceLines.slice(from, line + 2).join('\n')
        if (!window.includes(identifier)) offenders.push(`${identifier} -> L${line}`)
      }
    }
    expect(offenders.slice(0, 20), 'indexed locators whose line does not carry them').toEqual([])
  })
})

describe('the index corroborates this build\'s citations', () => {
  it('finds citations to corroborate at all', () => {
    // Guards the promotion count below. A scan that found nothing would satisfy
    // any floor phrased as "no disagreement".
    expect(files.length, 'files scanned').toBeGreaterThan(400)
    expect(citations.length, 'identifier-anchored citations found').toBeGreaterThan(200)
  })

  it('corroborates a measured number of them, and the number is pinned', () => {
    const known = citations.filter((c) => index.index[c.identifier] !== undefined)
    const agreeing = known.filter((c) => {
      const locators = index.index[c.identifier] as readonly number[]
      return locators.some((l) => Math.abs(l - c.line) <= index.windowLines)
    })

    /*
     * PINNED TO WHAT WAS MEASURED, not to a comfortable floor. Measured at the
     * time of writing: 1,199 identifier-anchored citations in the tree, 95 whose
     * identifier the index knows, 37 corroborated.
     *
     * A floor set far below the truth is a number that cannot fail, and this
     * build has already had to repair three of those -- `> 250` guarding a real
     * 744, `> 1_000` guarding 1,806, `toBe(9)` guarding a route count that grew.
     * So these sit just under the measurement, and rise with it.
     */
    expect(known.length, 'citations whose identifier the index knows').toBeGreaterThanOrEqual(90)
    expect(
      agreeing.length,
      'citations corroborated by an independently verified locator',
    ).toBeGreaterThanOrEqual(35)
  })

  it('reports the citations it cannot yet corroborate, and does NOT call them wrong', () => {
    const known = citations.filter((c) => index.index[c.identifier] !== undefined)
    const uncorroborated = known.filter((c) => {
      const locators = index.index[c.identifier] as readonly number[]
      return !locators.some((l) => Math.abs(l - c.line) <= index.windowLines)
    })

    /*
     * THIS DOES NOT ASSERT ZERO, AND ASSERTING ZERO WOULD BE A FALSE CLAIM.
     *
     * Roughly 7% of the blueprint is indexed so far, so the index holds SOME of
     * each identifier's locations, not all of them. `DEC-LANEB-001` is cited in
     * code at the line where the decision is RAISED; the index knows the line
     * where it is REGISTERED. Both are real locations for one identifier, and a
     * gate calling the first wrong because it has only seen the second would be
     * manufacturing defects out of its own partial coverage.
     *
     * So the count is reported and bounded from ABOVE: it may not grow without
     * someone noticing. When the remaining chapters are indexed this number
     * should fall sharply, and the ceiling comes down with it -- that is the
     * ratchet, pointed the other way.
     */
    console.error(
      `[citation-graph] ${uncorroborated.length} of ${known.length} citations name a line the ` +
        `index has not yet verified — expected while ${'~7%'} of the blueprint is indexed.`,
    )
    expect(uncorroborated.length, 'uncorroborated citations must not grow').toBeLessThanOrEqual(70)
  })
})

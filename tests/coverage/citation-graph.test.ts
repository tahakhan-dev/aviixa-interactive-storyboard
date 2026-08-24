/**
 * THE CITATION GATE.
 *
 * This build's evidence is line citations into a frozen 122,241-line blueprint.
 * When this gate was first written the measured position was poor: of the
 * citations that name an identifier, only 37 could be checked against an
 * independent record of where that identifier actually sits. The rest proved a
 * line exists and nothing more.
 *
 * `registries/blueprint-locators.json` is that independent record, and it is
 * built from two sources that each know their own half:
 *
 *   WHICH identifiers matter -> the knowledge graph, which read the document and
 *                               judged what is an entity rather than a passing
 *                               mention. A regex cannot make that call.
 *   WHERE each one appears   -> the frozen blueprint, scanned directly. Every
 *                               occurrence, not a sample -- 19,897 identifiers
 *                               at 39,138 lines.
 *
 * That split is why the number moved: 37 corroborated citations became 1,019.
 * The old index held one line per identifier -- whichever line an extracting
 * agent happened to be looking at -- so a citation naming any other real
 * occurrence could not be confirmed and looked like a disagreement.
 *
 * WHAT IT ALREADY CAUGHT. Sixteen citations matched nothing. Eleven were
 * genuinely wrong and are fixed: `AC-SA-18-04` cited at L1632 actually sits at
 * L46193, and four `FUNC-DOH-04` citations were each seven lines adrift, landing
 * on the `SUB-` line above. The other five were correct in a form this gate has
 * to understand rather than punish -- see below.
 *
 * WHY THE INDEX AND NOT THE GRAPH. `graphify-out/graph.json` is ~30MB and
 * git-ignored, so a gate reading it would be red on any clean checkout -- and a
 * check that is red for a reason nobody caused is one people learn to ignore,
 * then delete. The graph is a local tool; this is its committed residue.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { isForeignProbe } from '../probe-paths'

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')

interface LocatorIndex {
  readonly source: { readonly sha256: string; readonly lines: number }
  readonly identifiers: number
  readonly locators: number
  readonly index: Readonly<Record<string, readonly number[]>>
}
interface Prefixes {
  readonly matching: { readonly leadingGuard: string; readonly trailing: string }
  readonly registered: readonly string[]
  readonly unregisteredButPresent: { readonly prefixes: readonly string[] }
}

const index = JSON.parse(
  readFileSync(join(ROOT, 'registries', 'blueprint-locators.json'), 'utf8'),
) as LocatorIndex
const prefixes = JSON.parse(
  readFileSync(join(ROOT, 'registries', 'blueprint-prefixes.json'), 'utf8'),
) as Prefixes
const sourceBytes = readFileSync(SOURCE)
const sourceText = sourceBytes.toString('utf8')
const sourceLines = sourceText.split('\n')

/*
 * The leading guard is not decoration. Without it `\bAI-` matches inside
 * `FAIL-AI-01` and invents an identifier `AI-01` that exists nowhere -- sixty
 * phantoms in one chapter, which made a correct extraction measure at 74% and
 * sent it back for a needless re-run. Longest-first alternation for the same
 * class of reason: `SCHED` must not claim `SCHEDRUN-001`.
 */
const ALT = [...prefixes.registered, ...prefixes.unregisteredButPresent.prefixes]
  .sort((a, b) => b.length - a.length)
  .join('|')

/**
 * A citation and the identifier immediately before it: `DEC-SYNC-001 (L524)`,
 * `AC-OFF-505 L78560`. The identifier must PRECEDE the line number within a few
 * characters -- an identifier AFTER a citation is the co-citation form, measured
 * on this build at forty reports and zero defects.
 *
 * BOTH EXAMPLES ARE REAL AND WERE CHECKED. The first draft of this comment
 * illustrated the form with a decision identifier paired to a line that carries
 * a DIFFERENT decision, and `locator-fidelity` failed the build over it --
 * correctly. An example citation in a comment is still a citation in the tree,
 * and a gate about wrong line numbers is a poor place to keep one.
 *
 * The second draft explained that mistake by quoting it, and was caught again by
 * the same gate for the same reason. A wrong citation does not become inert by
 * being described, so this paragraph names neither half of it.
 */
const CITED = new RegExp(
  `${prefixes.matching.leadingGuard}((?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9])[\\s(,—-]{0,6}L(\\d{3,6})\\b`,
  'g',
)

/** The bare identifier, without the trailing `L<line>` the citation form needs. */
const CITED_IDENT = new RegExp(
  `${prefixes.matching.leadingGuard}(?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]${prefixes.matching.trailing}`,
)

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
  for (const m of readFileSync(file, 'utf8').matchAll(CITED)) {
    citations.push({ file, identifier: m[1] as string, line: Number(m[2]) })
  }
}

const known = citations.filter((c) => index.index[c.identifier] !== undefined)
const locatorsOf = (c: Citation): readonly number[] => index.index[c.identifier] as readonly number[]
const exact = known.filter((c) => locatorsOf(c).includes(c.line))

/*
 * THE SECOND HONEST FORM, and the gate would be wrong to fail it.
 *
 * `WF-EXE-001 L53798 — "Client Command Center — action 8 reassignment mid-shift"`
 * does not claim the identifier sits on L53798. It claims that line, inside that
 * workflow's section, says that thing -- and it does, word for word. Likewise a
 * permission row at L32637 sits inside `20.2.7 MOD-STU-07 — Content Libraries`,
 * which opens at L32574.
 *
 * Five of the sixteen initially-flagged citations were this form. Treating them
 * as defects would have meant "correcting" five accurate citations into
 * inaccurate ones -- the gate manufacturing the errors it exists to catch.
 *
 * So a citation also passes if it falls after an occurrence of its identifier
 * and within a section's reach of it. The window is generous because module
 * cards are long; it is bounded because "somewhere later in the document" is
 * not a citation.
 */
const SECTION_REACH = 120
const withinSection = known.filter((c) => {
  if (locatorsOf(c).includes(c.line)) return false
  const opensAt = locatorsOf(c).filter((l) => l <= c.line).pop()
  return opensAt !== undefined && c.line - opensAt <= SECTION_REACH
})

describe('the locator index describes the frozen source it claims to', () => {
  it('is built against the blueprint this repository actually has', () => {
    const sha = createHash('sha256').update(sourceBytes).digest('hex')
    expect(sha, 'the frozen source has changed since the index was built').toBe(index.source.sha256)
    /*
     * THE INDEX PUBLISHES THE DOCUMENT'S LINE COUNT, NOT THE SPLIT ARRAY'S.
     * `split('\n')` on a file ending in a newline yields a trailing empty
     * element, so `sourceLines.length` is 122,242 for a document of 122,241
     * (`wc -l` agrees). `build-locator-index.mjs` was off by one about the
     * simplest fact it publishes — audit C-32 — and was corrected to drop that
     * element. THIS assertion was not, so the corrected generator turned its
     * own verifier red: the gate had pinned the wrong convention as the
     * expectation. Both counts are asserted, so a silent flip back — either
     * side — reds rather than passing on a coincidence.
     */
    const trailingEmpty = sourceLines[sourceLines.length - 1] === '' ? 1 : 0
    expect(trailingEmpty, 'the frozen source ends in a newline').toBe(1)
    expect(sourceLines.length - trailingEmpty).toBe(index.source.lines)
  })

  it('is not a stub', () => {
    // Non-vacuity, and it guards every count below: an empty index corroborates
    // nothing and would let the promotion floors be met by zero.
    expect(Object.keys(index.index).length, 'identifiers indexed').toBeGreaterThan(15_000)
    expect(index.locators, 'locators indexed').toBeGreaterThan(30_000)
  })

  it('every locator it lists carries its identifier on that exact line', () => {
    /*
     * The index is correct by construction -- a line is listed because the
     * identifier was found on it -- so this test should be impossible to fail.
     * That is precisely why it is here. A property believed to hold by
     * construction is the one nobody re-checks after the construction changes,
     * and this index has already been rebuilt three times in one session.
     *
     * No window. The earlier index needed one because its lines came from an
     * extracting agent; these come from the source itself.
     */
    const offenders: string[] = []
    for (const [identifier, locators] of Object.entries(index.index)) {
      for (const line of locators) {
        if (!String(sourceLines[line - 1] ?? '').includes(identifier)) {
          offenders.push(`${identifier} -> L${line}`)
        }
      }
    }
    expect(offenders.slice(0, 20), 'indexed locators whose line does not carry them').toEqual([])
  })

  it('indexes no identifier the frozen source does not contain', () => {
    /*
     * An extraction agent emitted AC-AUTH-007 through AC-AUTH-015 and AC-SEC-002
     * through AC-SEC-004 -- twelve identifiers that occur nowhere in the
     * blueprint. It had seen a few real acceptance criteria and continued the
     * sequence. A fabricated identifier looks exactly like a real one, sorts
     * beside its real siblings, and answers queries with total confidence.
     *
     * They are dropped at merge now. This is the assertion that keeps them out.
     */
    /*
     * One pass over the source collecting what it contains, then set membership
     * -- not `whole.includes(id)` per identifier. The naive form scans 18MB
     * nearly twenty thousand times, around 350GB of work, and the test does not
     * fail so much as never finish. A gate that times out is a gate someone
     * disables.
     */
    const present = new Set<string>()
    const SCAN = new RegExp(CITED_IDENT.source, 'g')
    for (let m = SCAN.exec(sourceText); m !== null; m = SCAN.exec(sourceText)) {
      present.add(m[0])
    }
    const fabricated = Object.keys(index.index).filter((id) => !present.has(id))
    expect(fabricated.slice(0, 20), 'indexed identifiers absent from the source').toEqual([])
  })
})

describe("the index corroborates this build's citations", () => {
  it('finds citations to corroborate at all', () => {
    // Guards every count below. A scan that found nothing would satisfy any
    // floor phrased as "no disagreement".
    expect(files.length, 'files scanned').toBeGreaterThan(400)
    expect(citations.length, 'identifier-anchored citations found').toBeGreaterThan(800)
  })

  it('prints the split it pins, so the next raise is a read rather than a guess', () => {
    const uncorroborated = known.length - exact.length - withinSection.length
    console.error(
      `\n[citation-graph] ${citations.length} identifier-anchored citations in ${files.length} files` +
        `\n  identifier known to the index  ${known.length}` +
        `\n  confirmed at the exact line    ${exact.length}` +
        `\n  within-section form (accepted) ${withinSection.length}` +
        `\n  UNCORROBORATED                 ${uncorroborated}` +
        `\n  identifier NOT in the index    ${citations.length - known.length}`,
    )
    // Not decoration: the four sub-counts must partition `known`, or a raise
    // made from this print would be made from arithmetic that does not close.
    expect(exact.length + withinSection.length + uncorroborated).toBe(known.length)
  })

  it('corroborates the measured number of them, and the number is pinned', () => {
    /*
     * PINNED JUST UNDER THE MEASUREMENT, not at a comfortable floor.
     *
     * MEASURED 2026-08-23 on this tree, by the print above: 1,630
     * identifier-anchored citations in 794 files, 1,478 whose identifier the
     * index knows, 1,416 confirmed at the exact line.
     *
     * It was `>= 1_000` against both, written when the measurement was 1,053
     * and 1,019. The tree then grew by four slices and the floor did not, so by
     * slice 9 it guarded roughly two thirds of its subject and a third of the
     * corroborated citations in the build could have been deleted green. A
     * floor set far below the truth is a number that cannot fail, and this
     * build has now had to repair four of those -- `> 250` guarding a real 744,
     * `> 1_000` guarding 1,806, `toBe(9)` guarding a route count that grew, and
     * this one.
     *
     * WHO RAISES IT, AND WHEN. Whichever task grows either number raises it in
     * the same commit, to what the print above reports on its own run -- not
     * to a rounder number and never to an equality, because these counts grow
     * every slice and `toBe` would make every future citation a red gate.
     * `EROSION_BAND` is the entire allowance and is the same half a per cent
     * `locator-fidelity` measured: wide enough that rewording a comment can
     * move a citation between grades, too narrow to hide a file.
     */
    // PLANTED, 2026-08-23, on the real filesystem, restored from a copy with
    // sha256 compared before and after. Both plants were on
    // `src/frontline/modules/fl-a4/service.ts`, the densest single file at 55
    // index-known citations, all 55 exact:
    //   citations stripped (`L<n>` -> `line <n>`): known 1478 -> 1423  RED
    //   lines shifted by +100000, identifiers kept: exact 1416 -> 1361 RED
    //     (and uncorroborated 12 -> 67, so the ceiling below fired too)
    // Under the previous `>= 1_000` both plants were green, which is what a
    // floor at two thirds of its subject buys.
    const MEASURED = { known: 1_478, exact: 1_416 } as const
    const EROSION_BAND = 0.005
    const atLeast = (n: number): number => Math.floor(n * (1 - EROSION_BAND))
    expect(
      known.length,
      `citations whose identifier the index knows fell below the ${MEASURED.known} measurement`,
    ).toBeGreaterThanOrEqual(atLeast(MEASURED.known))
    expect(
      exact.length,
      `citations confirmed at the exact line fell below the ${MEASURED.exact} measurement`,
    ).toBeGreaterThanOrEqual(atLeast(MEASURED.exact))
  })

  it('leaves few uncorroborated, and that ceiling only comes down', () => {
    /*
     * A CEILING, NOT A FLOOR, because the honest direction of travel here is
     * downward. Sixteen were uncorroborated when the full index first landed;
     * eleven were real defects and were fixed, five were the within-section form
     * and are now understood by the check above.
     *
     * It does not assert zero. Twelve remain, and each is a citation whose
     * identifier occurs far from the cited line -- some are long module cards
     * that outrun SECTION_REACH. Asserting zero would either be false or would
     * push someone to widen the window until it stopped meaning anything.
     */
    const uncorroborated = known.length - exact.length - withinSection.length
    expect(uncorroborated, 'uncorroborated citations must not grow').toBeLessThanOrEqual(20)
  })
})

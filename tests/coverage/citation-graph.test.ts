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

/*
 * R2-02: `docs` AND `.md` WERE MISSING, AND THE PRINTED FIGURE DID NOT SAY SO.
 *
 * The scan was `['src','app','tests','scripts']` over `/\.(ts|tsx|mjs|js)$/`
 * while the describe below is titled "the index corroborates this build's
 * citations" and printed one unqualified number. Measured: 84% of the build's
 * identifier-anchored citations. The unscanned 16% is 48 files and 290
 * citations, and round 1's audit E found 28 wrong `L<n>` references in
 * `RESUME.md` BY HAND — this blind spot is where they lived.
 *
 * `locator-fidelity.test.ts` already scans `docs` and `.md` (its own
 * SCAN_ROOTS) but reads no locator index, so for the "is the identifier AT
 * that line" question this file is the only instrument there is. It is now
 * pointed at the same population.
 */
const SCAN_ROOTS = ['src', 'app', 'tests', 'scripts', 'docs'] as const
const SCANNED = /\.(ts|tsx|mjs|js|md)$/

/**
 * The prose half, keyed on the EXTENSION rather than on the root: a `.md` under
 * `src/` is prose and a `.ts` under `docs/` would be code, and the split below
 * is about what kind of claim a citation is making, not where it sits.
 */
const isProse = (file: string): boolean => file.endsWith('.md')

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
/**
 * RANGE SHORTHAND IS NOT AN IDENTIFIER. `SCR-CC-01..13` and `SPOF-INF-001..007`
 * are a writer's abbreviation for a run of identifiers; the capture group
 * accepts `.` (real identifiers carry it -- `AC-28.4-01`, `FUNC-DOH-03-1.2.1`)
 * and so swallows the `..` too. Six captures, six distinct forms, all in plans
 * and briefs, and every one reports "absent from the frozen source" because the
 * string genuinely is. Grading them would fill the named lists below with six
 * entries that can never be fixed, which is how a curated list turns into
 * noise nobody reads.
 *
 * The count is asserted, not just the filter: an exclusion that silently grows
 * is a hole, and this one would swallow a real identifier the day a `..` form
 * appears in one.
 */
const RANGE_SHORTHAND = /\.\./
const excludedRanges: Citation[] = []
const citations: Citation[] = []
for (const file of files) {
  for (const m of readFileSync(file, 'utf8').matchAll(CITED)) {
    const c = { file, identifier: m[1] as string, line: Number(m[2]) }
    ;(RANGE_SHORTHAND.test(c.identifier) ? excludedRanges : citations).push(c)
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

/**
 * R4-C06 HOLE 1 — THE REACH WINDOW WAS ACCEPTING THE DEFECT IT WAS BUILT TO
 * TELL APART FROM A CORRECT CITATION.
 *
 * `withinSection` passed anything up to 120 lines after an occurrence of its
 * identifier. Round 4's audit found twelve citations that are NOT the section
 * idiom at all: the cited line carries a DIFFERENT member of the same register,
 * with a sibling sitting between the identifier and the cited line. Seven of
 * the twelve were one to six lines out, comfortably inside the window, so this
 * gate graded them "within-section (accepted)" and printed them as evidence.
 *
 * ONE PREDICATE SEPARATES THE TWO FORMS. The documented-correct form cites a
 * line that carries no identifier of its own -- a permission row, a table row,
 * a paragraph inside a long card. The defect cites a line that carries a
 * SIBLING: another identifier in the same family. So a within-section grade is
 * withdrawn when the cited line itself names a different identifier sharing the
 * citation's family.
 *
 * FAMILY IS THE IDENTIFIER MINUS ITS LAST SEGMENT, which is what makes
 * `FUNC-DOH-04-1.2.1` and `FUNC-DOH-04-2.2.1` siblings and leaves
 * `FEAT-STU-05-02` and `FUNC-STU-05-02-A-1` unrelated. MEASURED on this tree
 * after round 4's citation fixes landed: 65 within-section citations, 0
 * withdrawn -- the predicate convicts none of the documented-correct cases. It
 * was proved to convict by planting one of the twelve back; see the report.
 */
const familyOf = (identifier: string): string => {
  const cut = identifier.lastIndexOf('-')
  return cut < 0 ? identifier : identifier.slice(0, cut)
}
const IDENT_ON_LINE = new RegExp(CITED_IDENT.source, 'g')
const identifiersOn = (line: number): string[] => [
  ...String(sourceLines[line - 1] ?? '').matchAll(IDENT_ON_LINE),
].map((m) => m[0] as string)

/** The cited line names a different member of the citation's own family. */
const siblingSitsOnCitedLine = (c: Citation): boolean =>
  identifiersOn(c.line).some((id) => id !== c.identifier && familyOf(id) === familyOf(c.identifier))

const withinSection = known.filter((c) => {
  if (locatorsOf(c).includes(c.line)) return false
  if (siblingSitsOnCitedLine(c)) return false
  const opensAt = locatorsOf(c).filter((l) => l <= c.line).pop()
  return opensAt !== undefined && c.line - opensAt <= SECTION_REACH
})

/**
 * The same three grades as one predicate, so the uncorroborated citations can be
 * NAMED and not only counted by subtraction. The count still has to agree with
 * the subtraction — asserted in the print below.
 */
const graded = new Set([...exact, ...withinSection])
const uncorroborated = known.filter((c) => !graded.has(c))

/**
 * A claim, not a citation: the identifier and the line it names. Two files
 * quoting the same brief make the same claim, and pinning the claim rather than
 * the file means moving a paragraph between documents does not change the pin.
 */
const claimKey = (identifier: string, line: number): string => `${identifier} at line ${line}`
const claimOf = (c: Citation): string => claimKey(c.identifier, c.line)

/**
 * THE DOCS POPULATION THIS SCAN INHERITED, NAMED RATHER THAN THRESHOLDED.
 *
 * Widening the scan takes uncorroborated from 12 to 31, over a ceiling of 20.
 * THE CEILING IS NOT RAISED AND NOTHING WAS MASS-EDITED. This build has the
 * precedent: when the strict anchor check landed, 177 citations would newly have
 * convicted — seven times the stop threshold — and nothing was corrected,
 * because the population was three different things and one of them was
 * documented as correct. `locator-fidelity`'s `STRICT_ANCHOR_ALLOWANCE` is the
 * shape that came out of it, and this is the same shape: a literal list of
 * claims, asserted as an equality in both directions, so it retires itself as
 * each one is read.
 *
 * NONE OF THESE IS ASSERTED TO BE CORRECT. Nineteen citations, eighteen distinct
 * claims, four files — twelve of them in one superseded replan. The round-2
 * auditor opened two of the 41 non-exact docs citations and found BOTH honest:
 * the co-citation and locator-list forms, which RESUME §2a documents as correct
 * and warns have nearly been "corrected" into wrongness five times. So the
 * reading is: assume more of them are correct than not, read each one against
 * the frozen source before touching it, and when one is read either correct the
 * citation or delete its key here. Deleting a key that still misses turns the
 * gate red; keeping one that no longer misses turns it red too.
 *
 * The entries are written as identifier + number rather than as `ID L<n>`
 * deliberately: the string `ID L<n>` in this file would BE a citation, scanned
 * by this gate, and a list of wrong citations written in citation form is how a
 * gate convicts itself. `locator-fidelity` has been caught by exactly that
 * twice, on two consecutive drafts of one comment.
 */
const DOCS_UNCORROBORATED: readonly { readonly id: string; readonly line: number }[] = [
  // docs/process/2026-08-22-slice-06-verification.md
  { id: 'DEC-PLUS-001', line: 28122 },
  // docs/superpowers/plans/2026-08-21-replan-slices-05-13.md — superseded plan,
  // twelve claims, none of them load-bearing for any gate.
  { id: 'ASSUM-006', line: 3410 },
  { id: 'WF-QLT-006', line: 13423 },
  { id: 'MOD-DOH-17', line: 29718 },
  { id: 'CMD-FL-VERSION', line: 39662 },
  { id: 'SCR-FL-23', line: 39869 },
  { id: 'AC-SA-07-13-01', line: 44548 },
  { id: 'SB-25-05', line: 48557 },
  { id: 'SB-25-06', line: 48571 },
  { id: 'AC-30C-1003', line: 73702 },
  { id: 'SB-42-401', line: 89451 },
  { id: 'DEC-SAFETY-001', line: 95391 },
  // docs/superpowers/plans/2026-08-21-replan-slices-05-13.md and
  // docs/superpowers/plans/2026-08-23-slice-10-common-brief.md — one claim, two
  // documents, which is why the key is the claim and not the file.
  { id: 'SB-PREF-01', line: 73684 },
  // docs/superpowers/plans/2026-08-23-slice-11-common-brief.md — five module
  // cards, each cited at a line inside a long card that outruns SECTION_REACH.
  { id: 'MOD-CC-05', line: 37247 },
  { id: 'MOD-CC-06', line: 37467 },
  { id: 'MOD-CC-07', line: 37630 },
  { id: 'MOD-CC-08', line: 37822 },
  { id: 'MOD-FL-B8', line: 41596 },
]
const ALLOWED_CLAIMS = new Set(DOCS_UNCORROBORATED.map((a) => claimKey(a.id, a.line)))

/* ------------------------------------------------------------------ *
 * R4-C06 HOLE 3 — THE HALF THIS GATE USED TO DROP ON THE FLOOR.
 *
 * `known` is the citations whose identifier the locator index carries.
 * Everything else was filtered out and never graded: 169 citations, 155 of
 * them in `src/` and `app/`. Not checked and not reported -- the print called
 * them "identifier NOT in the index" and stopped there. Two of them named
 * identifiers that occur NOWHERE in the frozen source, which is the strongest
 * defect this gate can detect, and it was passing over them.
 *
 * The index is not the only authority available. The frozen source is right
 * here, already read into `sourceLines` for the assertions above. So an
 * unindexed citation is graded against the SOURCE by the same three grades:
 * exact, within-section, uncorroborated -- including the sibling predicate,
 * which convicts one instance of round 4's C04 shape that lives outside the
 * index (`FUNC-STU-07-04-B-1` cited six lines short of itself, on a line
 * carrying `FUNC-STU-07-01-B-1`).
 *
 * WHY THE IDENTIFIERS ARE MISSING FROM THE INDEX AT ALL. The index's
 * identifier set comes from the knowledge graph, which judged what is an
 * entity. `FB-STU-01`, `SURF-CC` and `AC-STU-049` are real and are in the
 * source; the graph simply did not mint nodes for them. That is a reason to
 * check them against the source, not a reason to skip them.
 * ------------------------------------------------------------------ */
const unindexed = citations.filter((c) => index.index[c.identifier] === undefined)

/** Every line of the frozen source carrying this identifier. Memoised: the
 *  naive form rescans 18MB per identifier. */
const occurrenceCache = new Map<string, readonly number[]>()
const occurrencesOf = (identifier: string): readonly number[] => {
  const hit = occurrenceCache.get(identifier)
  if (hit !== undefined) return hit
  const found: number[] = []
  for (let i = 0; i < sourceLines.length; i += 1) {
    if ((sourceLines[i] as string).includes(identifier)) found.push(i + 1)
  }
  occurrenceCache.set(identifier, found)
  return found
}

const unindexedExact = unindexed.filter((c) => occurrencesOf(c.identifier).includes(c.line))
const unindexedWithinSection = unindexed.filter((c) => {
  if (occurrencesOf(c.identifier).includes(c.line)) return false
  if (siblingSitsOnCitedLine(c)) return false
  const opensAt = occurrencesOf(c.identifier)
    .filter((l) => l <= c.line)
    .pop()
  return opensAt !== undefined && c.line - opensAt <= SECTION_REACH
})
const unindexedGraded = new Set([...unindexedExact, ...unindexedWithinSection])
const unindexedUncorroborated = unindexed.filter((c) => !unindexedGraded.has(c))

/**
 * THE UNGRADED CLAIMS THIS HOLE HAD BEEN HIDING, NAMED — none of them fixable
 * by the stream that opened the hole, all of them reported.
 *
 * Same shape and same rules as `DOCS_UNCORROBORATED` above: an equality in both
 * directions, so the list retires itself as each claim is read, and NONE of
 * these is asserted to be correct. Each carries the reading measured when it
 * was surfaced. Read the line against the frozen source before touching it.
 *
 * `WF-LEDGER-EXPORT` appears twice: two citations, one claim, two call sites in
 * one file. The list is keyed on file AND claim here rather than on the claim
 * alone, because unlike the prose half these are not the same paragraph copied
 * between documents.
 */
const UNINDEXED_UNCORROBORATED: readonly { readonly file: string; readonly id: string; readonly line: number }[] =
  [
    // The identifier occurs NOWHERE in the frozen source. The strongest grade
    // this gate has, and both belong to the concurrent Super Admin fix stream,
    // which was told about them rather than reached across for.
    {
      file: 'app/super-admin/platform-overview-and-health/OverviewScreen.tsx',
      id: 'SB-SEC-013-S1',
      line: 105076,
    },
    { file: 'app/super-admin/usage-and-metering/fixtures.ts', id: 'WF-LEDGER-EXPORT', line: 2765 },
    { file: 'docs/census/2026-08-17-surf-sa-build-map.md', id: 'SB-SEC-013-S1', line: 105076 },

    // ROUND 4's C04 SHAPE, OUTSIDE THE INDEX. The cited line carries
    // `FUNC-STU-07-01-B-1`; the identifier's own line is twenty-two later.
    // Two call sites, one claim, neither file this stream's.
    {
      file: 'tests/unit/stu-content-libraries.test.ts',
      id: 'FUNC-STU-07-04-B-1',
      line: 32656,
    },
    {
      file: 'docs/process/audits/briefs/fix-G-round2-reachability.md',
      id: 'FUNC-STU-07-04-B-1',
      line: 32656,
    },

    // The identifier occurs LATER than the cited line, so the backward-looking
    // window cannot reach it. Each may be the forward form of the section
    // idiom -- a table header cited for a row inside it -- and each needs its
    // own read. Measured positions are in the round-4 report.
    { file: 'src/studio/journey/effects.ts', id: 'FB-STU-01', line: 31443 },
    { file: 'src/studio/modules/stu-07/writes.ts', id: 'FB-STU-05', line: 32647 },
    { file: 'src/surfaces/cc/modules/cc-08/AgentActivityPanel.tsx', id: 'SURF-CC', line: 35014 },
    { file: 'app/studio/workflow-library/WorkflowLibraryScreen.tsx', id: 'AC-STU-049', line: 31910 },
  ]
const UNINDEXED_KEY = (file: string, id: string, line: number): string =>
  `${file}: ${claimKey(id, line)}`
const ALLOWED_UNINDEXED = new Set(
  UNINDEXED_UNCORROBORATED.map((a) => UNINDEXED_KEY(a.file, a.id, a.line)),
)

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
    // And the half that was missing: `docs` dropping back out of SCAN_ROOTS, or
    // `.md` out of SCANNED, is the defect R2-02 named and it looks like a
    // shrinking population and nothing else. MEASURED: 48 files, 290 citations.
    expect(files.filter(isProse).length, 'prose files scanned').toBeGreaterThan(40)
    expect(
      citations.filter((c) => isProse(c.file)).length,
      'identifier-anchored citations found in prose',
    ).toBeGreaterThan(250)
  })

  it('prints the split it pins, so the next raise is a read rather than a guess', () => {
    const prose = uncorroborated.filter((c) => isProse(c.file))
    console.error(
      `\n[citation-graph] ${citations.length} identifier-anchored citations in ${files.length} files` +
        ` (${citations.filter((c) => isProse(c.file)).length} of them in ${files.filter(isProse).length} prose files)` +
        `\n  identifier known to the index  ${known.length}` +
        `\n  confirmed at the exact line    ${exact.length}` +
        `\n  within-section form (accepted) ${withinSection.length}` +
        `\n  UNCORROBORATED                 ${uncorroborated.length}` +
        `\n    in code                      ${uncorroborated.length - prose.length}` +
        `\n    in prose (named, pinned)     ${prose.length}` +
        `\n  identifier NOT in the index    ${unindexed.length}` +
        `\n    graded against the SOURCE:` +
        `\n      exact                      ${unindexedExact.length}` +
        `\n      within-section (accepted)  ${unindexedWithinSection.length}` +
        `\n      UNCORROBORATED             ${unindexedUncorroborated.length}` +
        `\n  range shorthand, not graded    ${excludedRanges.length}`,
    )
    // Not decoration: the three sub-counts must partition `known`, or a raise
    // made from this print would be made from arithmetic that does not close.
    expect(exact.length + withinSection.length + uncorroborated.length).toBe(known.length)
    // And the same for the half this gate used to drop: every citation is now
    // in exactly one of the two populations, and every member of each is
    // graded. A citation that falls out of both is a citation nothing checks.
    expect(known.length + unindexed.length).toBe(citations.length)
    expect(
      unindexedExact.length + unindexedWithinSection.length + unindexedUncorroborated.length,
    ).toBe(unindexed.length)
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
    //
    // RAISED for R2-02, in the commit that widened the scan: the population is
    // now the whole build, so the floors are what the whole build measures.
    // MEASURED 2026-08-24, by the print above: 2,119 identifier-anchored
    // citations in 1,004 files, 1,952 index-known, 1,848 exact — of which the
    // newly-scanned prose half contributes 290 citations, 277 known and 236
    // exact. The previous pins (1,478 / 1,416, measured 2026-08-23 over
    // 1,630 citations in 794 files) guarded 84% of the evidence.
    //
    // RAISED for round 4's citation fixes (R4-C04, R4-C05, R4-C07) and the new
    // gate code, which together moved fifteen citations from non-exact to
    // exact and added citations of their own. MEASURED 2026-08-25 by the print
    // above: 2,135 identifier-anchored citations (plus 6 range-shorthand
    // captures now excluded) in 1,024 files, 1,972 index-known, 1,880 exact.
    const MEASURED = { known: 1_972, exact: 1_880 } as const
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

  /**
   * R4-C06 HOLE 2 — THE CODE POPULATION IS NAMED, THE WAY THE PROSE ONE IS.
   *
   * This used to read `expect(code.length).toBeLessThanOrEqual(20)` with an
   * occupancy of 12, and it named none of its members. Eight wrong citations
   * could therefore land and stay green -- and round 4 measured that FOUR of
   * the twelve occupants were real defects sitting inside the allowance,
   * unread because nothing made anybody read them. The comment beside it
   * argued the ceiling should not be raised, which was the right instinct
   * applied to the wrong instrument: a ceiling with headroom is a threshold,
   * and this build's round-2 lesson is that a threshold cannot express "every
   * member".
   *
   * So it is an equality in both directions over a literal list, exactly like
   * the prose half twenty lines below. NONE of these is asserted correct.
   * Reading one ends either in a corrected citation or in a deleted key, and
   * a key that no longer misses reds just as loudly as a miss that is not
   * keyed.
   */
  const CODE_UNCORROBORATED: readonly { readonly file: string; readonly id: string; readonly line: number }[] =
    [
      { file: 'src/disclosure/decisions.ts', id: 'SEQ-012', line: 68307 },
      { file: 'src/disclosure/decisions.ts', id: 'SEQ-013', line: 68455 },
      { file: 'src/surfaces/doh/modules/doh-16/matrix.ts', id: 'NOTIF-DOH-16-2', line: 29674 },
      {
        file: 'app/super-admin/atom-registry/AtomRegistryScreen.tsx',
        id: 'MOD-SA-10',
        line: 107350,
      },
      {
        file: 'app/super-admin/console-users-roles-and-change-approvals/fixtures.ts',
        id: 'SCR-SA-13',
        line: 42804,
      },
      {
        file: 'app/super-admin/console-users-roles-and-change-approvals/fixtures.ts',
        id: 'SCR-SA-10',
        line: 48738,
      },
      { file: 'app/super-admin/tenant-metrics-and-aggregates/fixtures.ts', id: 'MOD-SA-12', line: 45385 },
      { file: 'app/super-admin/tiers-entitlements-and-caps/TiersScreen.tsx', id: 'MOD-SA-11', line: 45273 },
    ]
  const ALLOWED_CODE = new Set(
    CODE_UNCORROBORATED.map((a) => UNINDEXED_KEY(a.file, a.id, a.line)),
  )
  const codeKeyOf = (c: Citation): string =>
    UNINDEXED_KEY(c.file.replace(`${ROOT}/`, ''), c.identifier, c.line)

  it('names every uncorroborated code citation rather than counting them', () => {
    const code = uncorroborated.filter((c) => !isProse(c.file))
    // Non-vacuity: the population this equality is drawn from must exist.
    expect(known.length, 'index-known citations').toBeGreaterThan(1_000)
    const unlisted = code
      .filter((c) => !ALLOWED_CODE.has(codeKeyOf(c)))
      .map(codeKeyOf)
      .sort()
    if (unlisted.length > 0) {
      console.error(
        `\n[citation-graph] uncorroborated code citations (${unlisted.length}):\n  ${unlisted.join('\n  ')}`,
      )
    }
    expect(
      unlisted,
      'a code citation names a line the index cannot corroborate. READ IT AGAINST THE FROZEN ' +
        'SOURCE FIRST, then either fix the citation or add the claim to CODE_UNCORROBORATED with ' +
        'the reading in the report — never raise a threshold to absorb it.',
    ).toEqual([])
  })

  it('carries no allowance for a code claim that no longer misses', () => {
    const live = new Set(uncorroborated.filter((c) => !isProse(c.file)).map(codeKeyOf))
    expect(
      [...ALLOWED_CODE].filter((k) => !live.has(k)).sort(),
      'an allowance for a code citation that is no longer uncorroborated. Delete it',
    ).toEqual([])
  })

  /*
   * The prose half, as an equality in both directions. Not a ceiling: a ceiling
   * of nineteen would let any nineteen citations be wrong, and these nineteen
   * are the ones this build has inherited and not yet read.
   */
  it('names every uncorroborated prose citation rather than counting them', () => {
    const prose = uncorroborated.filter((c) => isProse(c.file))
    const unlisted = prose
      .filter((c) => !ALLOWED_CLAIMS.has(claimOf(c)))
      .map((c) => `${c.file.replace(`${ROOT}/`, '')}: ${claimOf(c)}`)
      .sort()
    if (unlisted.length > 0) {
      console.error(`\n[citation-graph] uncorroborated prose citations (${unlisted.length}):\n  ${unlisted.join('\n  ')}`)
    }
    expect(
      unlisted,
      'a prose citation names a line the index cannot corroborate. READ IT AGAINST THE FROZEN ' +
        'SOURCE FIRST: the co-citation and locator-list forms are documented as correct in ' +
        'RESUME §2a and have nearly been "corrected" into wrongness five times. If it is wrong, ' +
        'fix the citation. If it is one of those forms, add the claim to DOCS_UNCORROBORATED ' +
        'with the reading in the report — never raise a threshold to absorb it.',
    ).toEqual([])
  })

  it('carries no allowance for a prose claim that no longer misses', () => {
    // The half that makes the list retire itself. When one of these is read and
    // corrected, its claim stops occurring, and removing the key is the closing
    // step of that fix rather than a tidy-up nobody does.
    const live = new Set(uncorroborated.filter((c) => isProse(c.file)).map(claimOf))
    expect(
      [...ALLOWED_CLAIMS].filter((k) => !live.has(k)).sort(),
      'an allowance for a prose citation that is no longer uncorroborated. Delete it',
    ).toEqual([])
  })
})

describe('the frozen source grades the citations the index does not know', () => {
  it('has an unindexed population to grade, and grades all of it', () => {
    // Non-vacuity in both directions. An empty `unindexed` would satisfy every
    // assertion below, and that is exactly the state this gate was in: it
    // filtered the population away and then asserted nothing about it.
    // MEASURED 2026-08-25: 1,024 files, 2,135 identifier-anchored citations
    // (6 range-shorthand captures excluded), 1,972 index-known / 1,880 exact /
    // 65 within-section / 27 uncorroborated (8 code, 19 prose); and on this
    // half, 163 unindexed citations -- 149 exact against the source, 4
    // within-section, 10 uncorroborated over 9 distinct claims.
    expect(unindexed.length, 'citations whose identifier the index does not carry').toBeGreaterThan(
      100,
    )
    expect(unindexedExact.length, 'unindexed citations exact against the source').toBeGreaterThan(
      100,
    )
    expect(excludedRanges.length, 'range-shorthand captures excluded from grading').toBe(6)
  })

  it('names every unindexed citation the source cannot corroborate', () => {
    const unlisted = unindexedUncorroborated
      .map((c) => UNINDEXED_KEY(c.file.replace(`${ROOT}/`, ''), c.identifier, c.line))
      .filter((k) => !ALLOWED_UNINDEXED.has(k))
      .sort()
    if (unlisted.length > 0) {
      console.error(
        `\n[citation-graph] unindexed citations the source cannot corroborate (${unlisted.length}):\n  ${unlisted.join('\n  ')}`,
      )
    }
    expect(
      unlisted,
      'a citation names a line the FROZEN SOURCE does not corroborate, and its identifier is not ' +
        'in the locator index either. Open the line. If the identifier occurs nowhere in the ' +
        'source, the citation is fabricated and the claim beside it needs rewriting, not ' +
        'renumbering.',
    ).toEqual([])
  })

  it('carries no allowance for an unindexed claim that no longer misses', () => {
    const live = new Set(
      unindexedUncorroborated.map((c) =>
        UNINDEXED_KEY(c.file.replace(`${ROOT}/`, ''), c.identifier, c.line),
      ),
    )
    expect(
      [...ALLOWED_UNINDEXED].filter((k) => !live.has(k)).sort(),
      'an allowance for an unindexed citation that is no longer uncorroborated. Delete it',
    ).toEqual([])
  })

  it('reports every identifier cited but absent from the frozen source', () => {
    /*
     * THE STRONGEST GRADE THIS GATE HAS, AND IT HAD NO ASSERTION AT ALL.
     *
     * `indexes no identifier the frozen source does not contain` above holds
     * the INDEX to the source. Nothing held the BUILD's citations to it, so a
     * citation naming an identifier that exists nowhere -- the shape an
     * extraction agent produced twelve of, by continuing a sequence -- was
     * simply filtered out as "not in the index" and never looked at.
     *
     * Two such claims are live, both under `app/super-admin/**` plus one copy
     * in a census document, and all three belong to another stream. They are
     * named, not absorbed: this asserts the exact set, so a third reds.
     */
    const present = new Set<string>()
    const SCAN = new RegExp(CITED_IDENT.source, 'g')
    for (let m = SCAN.exec(sourceText); m !== null; m = SCAN.exec(sourceText)) {
      present.add(m[0])
    }
    const fabricated = [
      ...new Set(
        citations
          .filter((c) => !present.has(c.identifier) && occurrencesOf(c.identifier).length === 0)
          .map((c) => `${c.file.replace(`${ROOT}/`, '')}: ${claimOf(c)}`),
      ),
    ].sort()
    expect(present.size, 'identifiers found in the frozen source').toBeGreaterThan(15_000)
    expect(fabricated, 'a citation names an identifier the frozen source does not contain').toEqual(
      [
        'app/super-admin/platform-overview-and-health/OverviewScreen.tsx: SB-SEC-013-S1 at line 105076',
        'app/super-admin/usage-and-metering/fixtures.ts: WF-LEDGER-EXPORT at line 2765',
        'docs/census/2026-08-17-surf-sa-build-map.md: SB-SEC-013-S1 at line 105076',
      ],
    )
  })
})

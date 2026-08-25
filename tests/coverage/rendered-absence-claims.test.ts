import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  describeFrozenSourcePin,
  expectPopulationFloor,
  frozenSourceBytes,
  frozenSourceLines,
  sweptSources,
} from './absence-sweep'

/**
 * TWO STATEMENTS THIS BUILD PUBLISHED ABOUT THE FROZEN SOURCE THAT THE FROZEN
 * SOURCE REFUTES, AND THE TWO PLACES NO EXISTING GATE LOOKS.
 *
 * Audit round 4, findings R4-01 and R4-06. Same shape both times: a claim
 * ABOUT the document, rendered to a reader, somewhere the suite does not read.
 *
 * ── R4-01, THE FAMILY-MEMBER-ABSENT DISCLOSURE ───────────────────────────
 *
 * Six Super Admin module pages rendered a panel saying an acceptance
 * criterion is missing from the frozen source, and abstained from building
 * it. The cited lines carry the complete runs:
 *
 *   L45684 carries AC-SA-14-01 to -07.  The page said 01,02,03,04,06,07.
 *   L45938 carries AC-SA-16-01 to -07.  The page said 01,02,06.
 *   L45342 carries AC-SA-11-01 to -06.  The page said 01,02,03,04,06.
 *   L43253-L43262 carry AC-SA-02-01 to -10.  The page said 01,03,06,07.
 *   L44875-L44886 carry AC-SA-08-01 to -12.  The page said all but 02,03,04,11.
 *   L45456 carries AC-SA-12-01 to -07.  The page said 02,03,04,07.
 *
 * Sixteen real criteria, several of them prohibitions on a platform surface,
 * reported to a reader as absent from the document that states them. The
 * audit found three of the six pages; the run-gap detector below found the
 * other three on its first run.
 *
 * NOTHING COULD RED. Every citation is a bare line number, so
 * `locator-fidelity` grades it WEAK, and a line that exists and is non-blank
 * passes -- which L45684 is. The claim was never about the LINE. It was about
 * the IDENTIFIER, and no gate read it that way.
 *
 * ── R4-06, THE BLANK-LINE CITATION ───────────────────────────────────────
 *
 * Three of the 5,018 `sourceLine` fields across the seventeen generated
 * registries cited a blank line, each exactly one line below the heading that
 * names it, and two of the three were printed to a reader as the workflow's
 * identity: the placeholder id `unstated@` with the blank line's own number
 * appended, which is an L-prefixed number and therefore a citation of a blank
 * line. The three numbers are written as bare `line` values below and never in
 * that form, because writing one here would make this comment the offence it
 * describes -- a mistake this build has already made twice in a register. `locator-fidelity`'s own doctrine calls a citation of a blank
 * line always wrong; it scans `src`, `app`, `tests` and `scripts`, and these
 * are bare numbers in `registries/generated`. The extractor is anchored to
 * the heading in `scripts/build-registries.mjs`. This is what keeps it there.
 *
 * ── WHY THE DETECTORS ARE REPLAYED AND NOT ONLY RUN ──────────────────────
 *
 * Round 3's finding was a correct fix that emptied a gate's population, and
 * this file is exactly that risk: closing R4-01 takes the offender population
 * to zero AND takes the run-gap population to zero with it, so a detector
 * that had silently stopped matching would look identical to a clean tree.
 * So each detector is replayed against the six disclosures AS THEY SHIPPED
 * and must convict all six, the blank-line predicate is run against three
 * real blank lines and the three real headings above them, and a third
 * population that cannot empty -- every `AC-*` identifier this build names --
 * carries a floor.
 */

describeFrozenSourcePin('rendered absence claims')

/* ==================================================================== *
 * The swept tree
 * ==================================================================== */

const SWEPT_FILES = [...sweptSources('app'), ...sweptSources('src')]

function textOf(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8')
}

/* ==================================================================== *
 * DETECTOR 1 — an enumerated identifier run with a gap in it
 * ==================================================================== */

/**
 * `AC-SA-11-01, -02, -03, -04 and -06` is a claim with a hole in it, and the
 * hole is the assertion: whatever number the enumeration skips is being
 * reported as not existing. Mechanical, and therefore not fooled by phrasing
 * -- all six disclosures used a different sentence and the same enumeration.
 *
 * THE CONTINUATION MUST BE A BARE `-NN`. `AC-SA-08-01, -05, -06` is an
 * enumeration of one family; `MOD-STU-02 to MOD-STU-15` is a range, and
 * `STATE-01, STATE-02, STATE-04` is a list of three things that happen to
 * share a prefix. A looser rule was measured against this tree and returned
 * 46 hits of which 43 were one of those two shapes; this one returned 3, and
 * all 3 were real. `(?!-)` keeps `-01-A2` out: `FUNC-SA-11-01-A1, -01-A2` is
 * a sub-family enumeration whose numbering says nothing about a gap.
 */
const ENUMERATED_RUN =
  /\b([A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]+)*?)-(\d{2})(?!-)((?:(?:,| and|, and)\s+-\d{2}(?!-))+)/g

export interface RunGap {
  readonly file: string
  readonly stem: string
  /** The members the enumeration skipped that the frozen source does carry. */
  readonly carried: readonly string[]
}

function runGapsIn(file: string, text: string): RunGap[] {
  const found: RunGap[] = []
  ENUMERATED_RUN.lastIndex = 0
  let hit: RegExpExecArray | null
  while ((hit = ENUMERATED_RUN.exec(text)) !== null) {
    const stem = hit[1] as string
    const members = [
      Number(hit[2]),
      ...[...(hit[3] as string).matchAll(/-(\d{2})/g)].map((m) => Number(m[1])),
    ]
    const lo = Math.min(...members)
    const hi = Math.max(...members)
    const gaps: string[] = []
    for (let n = lo; n <= hi; n += 1) {
      if (!members.includes(n)) gaps.push(`${stem}-${String(n).padStart(2, '0')}`)
    }
    const carried = gaps.filter((id) => frozenSourceBytes.includes(id))
    if (carried.length > 0) found.push({ file, stem, carried })
  }
  return found
}

/* ==================================================================== *
 * DETECTOR 2 — prose saying the source does not carry a named identifier
 * ==================================================================== */

/**
 * The phrasings this build actually uses to say "the frozen source does not
 * carry this", transcribed from the tree rather than imagined.
 *
 * `source\b(?!-)` and not `source`: without the boundary, "absent from the
 * source-reconciliation artefact" in `app/hub/shift-management/fixtures.ts`
 * -- a true statement about a DERIVED artefact -- reads as a claim about the
 * frozen document and is convicted for naming `DEC-SHIFT-001`, which the
 * source does carry. That was this detector's first false positive and it is
 * why the boundary is there.
 */
const ABSENCE_MARKERS: readonly RegExp[] = [
  /not represented anywhere this build can read/gi,
  /(?:is|are) missing from the (?:frozen )?source\b(?!-)/gi,
  /absent from the (?:frozen )?source\b(?!-)/gi,
  /(?:occurs?|appears?) nowhere in (?:the frozen source\b(?!-)|it)/gi,
  /(?:does not|do not) (?:occur|appear|exist) (?:anywhere )?in the (?:frozen )?source\b(?!-)/gi,
  /there is no [`A-Z][^.]{0,60} in the frozen source\b(?!-)/gi,
  /no such (?:criterion|acceptance criterion|identifier)/gi,
  /nowhere in the (?:frozen )?source\b(?!-)/gi,
]

/**
 * An AVIIXA identifier: two or more upper-case segments joined by hyphens.
 * Deliberately NOT anchored to a prefix allow-list -- a claim about an
 * invented prefix is exactly as wrong as one about a real prefix, and an
 * allow-list is a thing to forget to update.
 */
const IDENTIFIER = /\b[A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]+)+\b/g

export interface AbsenceClaim {
  readonly file: string
  /** Identifiers the claim's own sentence names that the source does carry. */
  readonly carried: readonly string[]
}

/**
 * A SENTENCE, and not a wider window. A 600-character window was measured
 * against this tree and paired four markers with identifiers sitting in
 * neighbouring prose that the claim was not about -- `WF-ROLE-021` beside a
 * claim about a THRESHOLD VALUE, `MOD-DOH-10` beside a claim about the `S10-`
 * prefix. The binding a claim has to an identifier is that it names it.
 */
function prosClaimsIn(file: string, text: string): AbsenceClaim[] {
  const found: AbsenceClaim[] = []
  for (const marker of ABSENCE_MARKERS) {
    marker.lastIndex = 0
    let hit: RegExpExecArray | null
    while ((hit = marker.exec(text)) !== null) {
      const from = Math.max(0, text.lastIndexOf('.', hit.index - 1))
      const to = text.indexOf('.', marker.lastIndex)
      const sentence = text.slice(from, to === -1 ? text.length : to + 1)
      const named = [...new Set(sentence.match(IDENTIFIER) ?? [])].sort()
      const carried = named.filter((id) => frozenSourceBytes.includes(id))
      if (carried.length > 0) found.push({ file, carried })
    }
  }
  return found
}

/* ==================================================================== *
 * The six disclosures, as they shipped
 * ==================================================================== */

/**
 * Verbatim from the tree before this fix stream. They are the detectors'
 * calibration: each one must still be convicted, by one detector or the
 * other, or the detector has stopped seeing the defect it was written for.
 */
const DISCLOSURES_AS_SHIPPED: readonly (readonly [string, string])[] = [
  [
    'tiers-entitlements-and-caps',
    'The extraction carries AC-SA-11-01, -02, -03, -04 and -06 at L45342. The gap at -05 is ' +
      'not represented anywhere this build can read, and no affordance on this screen stands ' +
      'in for it.',
  ],
  [
    'jbs-access',
    'The extraction carries AC-SA-16-01, -02 and -06 at L45938. The three gaps in between are ' +
      'not represented anywhere this build can read, and no affordance on this screen stands ' +
      'in for them.',
  ],
  [
    'atom-registry',
    'The extraction carries AC-SA-02-01, -03, -06 and -07. The gaps in the numbering are not ' +
      'represented anywhere this build can read, and nothing on this screen stands in for them.',
  ],
  [
    'platform-notifications-and-tenant-communications',
    'The acceptance criteria extracted at L45684 run AC-SA-14-01, -02, -03, -04, -06 and -07. ' +
      'There is no AC-SA-14-05 in the frozen source.',
  ],
  [
    'console-users-roles-and-change-approvals',
    'The extraction carries AC-SA-08-01, -05, -06, -07, -08, -09, -10 and -12 for this module ' +
      'and no others. Four identifiers in the run are absent from the frozen source, so ' +
      'nothing was built to satisfy them.',
  ],
  [
    'usage-and-metering',
    'The extraction carries AC-SA-12-02, -03, -04 and -07 for this module and no others; the ' +
      'numbering implies at least three more that were never captured.',
  ],
]

describe('R4-01: no rendered text says the frozen source lacks an identifier it carries', () => {
  it('sweeps a file population that has not collapsed', () => {
    expectPopulationFloor(SWEPT_FILES, 600, 'app/ and src/ .ts and .tsx sources')
  })

  it('convicts all six disclosures as they shipped', () => {
    for (const [page, text] of DISCLOSURES_AS_SHIPPED) {
      const convicted = [
        ...runGapsIn(page, text).flatMap((r) => r.carried),
        ...prosClaimsIn(page, text).flatMap((c) => c.carried),
      ]
      expect(convicted, `the detectors no longer see the disclosure on /${page}/`)
        .not.toEqual([])
    }
  })

  it('acquits an enumeration whose gaps the source really does not carry', () => {
    // The same detector on the same shape with a family the document has
    // never heard of: a rule that convicted this would convict everything.
    expect(runGapsIn('probe', 'The extraction carries AC-GHOST-999-01, -02 and -05.')).toEqual([])
  })

  it('acquits a true absence claim about a build-local identifier', () => {
    // `DEC-OFFMODE-001` is this build's own name for a question the source
    // leaves open under no name at all, so saying so is true and is the point
    // of saying it. A detector that reddened here would punish honesty.
    expect(
      prosClaimsIn('probe', 'DEC-OFFMODE-001 appears NOWHERE in the frozen source.'),
    ).toEqual([])
  })

  it('finds no enumerated run whose gap the frozen source carries', () => {
    const offenders = SWEPT_FILES.flatMap((f) => runGapsIn(f, textOf(f))).map(
      (r) => `${r.file}: ${r.stem} skips ${r.carried.join(', ')}`,
    )
    expect(offenders).toEqual([])
  })

  it('finds no prose claim naming an identifier the frozen source carries', () => {
    const offenders = SWEPT_FILES.flatMap((f) => prosClaimsIn(f, textOf(f))).map(
      (c) => `${c.file}: ${c.carried.join(', ')}`,
    )
    expect(offenders).toEqual([])
  })

  /**
   * THE POPULATION THAT CANNOT EMPTY. The two assertions above are both
   * "found nothing", which is the shape most at risk of passing because it
   * stopped looking. This one is the same question asked positively over 784
   * identifiers, and it also catches the inverse defect the build has already
   * shipped once: an extractor that continued a numbering sequence and
   * invented twelve acceptance criteria the source does not contain.
   */
  it('names no AC identifier the frozen source does not carry', () => {
    const named = [
      ...new Set(
        SWEPT_FILES.flatMap((f) => [...textOf(f).matchAll(/\bAC-[A-Z0-9]+(?:-[A-Z0-9]+)+\b/g)])
          .map((m) => m[0])
          .filter((id): id is string => id !== undefined),
      ),
    ].sort()
    expectPopulationFloor(named, 700, 'AC-* identifiers named under app/ and src/')
    expect(named.filter((id) => !frozenSourceBytes.includes(id))).toEqual([])
  })
})

/* ==================================================================== *
 * R4-06 — no generated citation points at a blank line
 * ==================================================================== */

const GENERATED_DIR = join(process.cwd(), 'registries', 'generated')

function generatedJsonFiles(dir: string, into: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    // Nine release gates plant and delete probes on the real filesystem, and
    // a walk that does not skip them lists one and then ENOENTs on it the
    // moment its owner cleans up. `tests/coverage/prohibited-patterns.test.ts`
    // convicted this walk for exactly that.
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) generatedJsonFiles(full, into)
    else if (entry.endsWith('.json')) into.push(full)
  }
  return into
}

export interface GeneratedCitation {
  readonly file: string
  readonly line: number
}

function generatedCitations(): readonly GeneratedCitation[] {
  const out: GeneratedCitation[] = []
  for (const file of generatedJsonFiles(GENERATED_DIR)) {
    const walk = (node: unknown): void => {
      if (node === null || typeof node !== 'object') return
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === 'sourceLine' && typeof v === 'number') out.push({ file, line: v })
        else walk(v)
      }
    }
    walk(JSON.parse(readFileSync(file, 'utf8')))
  }
  return out
}

/** True when the frozen source's line `n` is blank, or is not a line at all. */
function citesNothing(n: number): boolean {
  return (frozenSourceLines[n - 1] ?? '').trim() === ''
}

function short(file: string): string {
  return file.slice(process.cwd().length + 1)
}

describe('R4-06: no generated sourceLine cites a blank line of the frozen source', () => {
  const citations = generatedCitations()

  it('reads a sourceLine population that has not collapsed', () => {
    expectPopulationFloor(citations, 5_000, 'sourceLine fields under registries/generated')
  })

  /**
   * THE PREDICATE, ON THE THREE LINES THAT WERE ACTUALLY CITED. Each pair
   * below is a blank line and the heading immediately above it -- the line the
   * extractor recorded, and the line the row cites now. They are bare numbers
   * and not L-prefixed ones on purpose: an L-prefixed number is a citation
   * wherever it appears, including in a comment about a bad citation, and
   * `locator-fidelity` convicted an earlier draft of this very block.
   *
   * Without this case a `citesNothing` that had stopped recognising a blank
   * line would let the assertion below pass over a tree full of them.
   */
  it('tells a blank line and the heading above it apart', () => {
    for (const [blank, heading] of [
      [101_683, 101_682],
      [34_886, 34_885],
      [95_239, 95_238],
    ] as const) {
      expect(citesNothing(blank), `L${blank} should be blank`).toBe(true)
      expect(citesNothing(heading), `L${heading} should be the heading`).toBe(false)
    }
  })

  it('cites no blank line anywhere', () => {
    const blank = citations
      .filter((c) => citesNothing(c.line))
      .map((c) => `${short(c.file)} L${c.line}`)
    expect(blank).toEqual([])
  })

  /**
   * A composite row id is itself a citation: the placeholder id carries an
   * L-prefixed line number inside it, and an L-prefixed number is a citation
   * wherever it appears. Two of the three blank citations reached a reader in
   * exactly that form, as the
   * workflow's own identity on the Workflow Index.
   */
  it('embeds no blank line in a generated row id', () => {
    const offenders: string[] = []
    for (const file of generatedJsonFiles(GENERATED_DIR)) {
      for (const m of readFileSync(file, 'utf8').matchAll(/"[^"]*@L(\d+)[^"]*"/g)) {
        if (citesNothing(Number(m[1]))) offenders.push(`${short(file)} ${m[0]}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

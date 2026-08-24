import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { JSDOM } from 'jsdom'
import { isForeignProbe } from '../probe-paths'
import {
  MANUFACTURING_SEVERITY_SYMBOLS,
  OPERATIONAL_SEVERITY_SYMBOLS,
  describeClosedVocabularyAnnotations,
  describeFrozenSourcePin,
  expectEverySymbolExists,
  expectPopulationFloor,
  sourceLine,
  sweptSources,
} from './absence-sweep'

import { AI_MODE_IDS, AI_MODE_ROWS, AI_MODE_TRANSITIONS, type AiModeId } from '@/ai/modes/vocabulary'
import {
  PROVENANCE_CLASS_IDS,
  PROVENANCE_CLASSES,
  provenanceClass,
  type ProvenanceClassId,
} from '@/ai/provenance/classes'
import {
  GUIDANCE_ELEMENT_ATTRIBUTE,
  PROVENANCE_CLASS_ATTRIBUTE,
  provenanceViolations,
} from '@/ai/provenance/contract'
import { AI_ABILITY_IDS, type AiAbilityId } from '@/ai/abilities/register'
import {
  AI_PROHIBITIONS,
  PROHIBITION_DIAGRAM,
  prohibitionsWithoutRefusalEdge,
  type ProhibitionNumber,
} from '@/ai/abilities/prohibitions'
import { FAILURE_CATALOGUE, FAILURE_FAMILIES, catalogueRow } from '@/ai/failures/catalogue'
import { OPERATIONAL_SEVERITY_BANDS, type OperationalSeverityBand } from '@/ai/failures/severity'
import { RESPONSE_SPINE, SPINE_ITEM_NUMBERS } from '@/ai/failures/spine'
import { QUEUED_REQUEST_STATE_IDS, type QueuedRequestStateId } from '@/ai/requests/states'
import {
  QUEUED_REQUEST_SURFACE_IDS,
  QUEUED_REQUEST_SURFACE_MATRIX,
  cellAt,
} from '@/ai/requests/surface-matrix'
import { AI_AGENT_IDS, AI_AGENT_ROSTER, type AiAgentId } from '@/ai/agents/roster'
import {
  FALLBACK_CONTRACT_OWNERS,
  FALLBACK_IDENTIFIER_RANGES,
  expandRange,
  fallbackKey,
  ownerAt,
  ownersOf,
} from '@/ai/fallbacks/registry'
import { FIVE_SURFACE_OBLIGATIONS } from '@/ai/five-surface/overlay'
import { FIVE_SURFACE_OVERLAYS } from '@/ai/five-surface/journey-overlay'
import {
  STORYBOARD_ACCEPTANCE_CRITERIA,
  STORYBOARD_CARD_FIELDS,
  STORYBOARD_CARD_HEADER_REFS,
  STORYBOARD_SURFACE_TABLE_REFS,
  type Storyboard,
  type StoryboardNumber,
} from '@/ai/storyboards/contract'
import { STORYBOARDS_01_TO_10 } from '@/ai/storyboards/sb-01-to-10'
import { STORYBOARDS_11_TO_20 } from '@/ai/storyboards/sb-11-to-20'
import { SB_21_TO_30 } from '@/ai/storyboards/sb-21-to-30/storyboards'
import { storyboardViolations } from '@/ai/storyboards/invariants'
import { pauseJoinForScope, PAUSE_SCOPES } from '@/ai/join/mode-failure'

/* ==================================================================== *
 * SLICE 11 RELEASE GATES — artificial intelligence and its absence.
 *
 * WHAT THIS FILE IS FOR, AND WHAT IT DELIBERATELY LEAVES TO THE UNIT SUITES.
 * Thirty-four unit files already check slice 11's records cell for cell
 * against the frozen bytes. Repeating that here would buy a second copy of
 * one claim, which is the shape this build keeps paying for. What no unit or
 * component suite can see is the other half:
 *
 *   - WHAT SHIPPED. `provenanceViolations` was written for "a
 *     `tests/coverage/` gate over the built tree, which is not this task's to
 *     write" — its own words, at `src/ai/provenance/contract.ts`. This is
 *     that gate: fifty provenance marks across sixteen exported pages, read
 *     out of `out/` with a real parser, plus the absolute rule of L89439
 *     checked against the bytes a reader is served.
 *   - MEMBERSHIP FROM OUTSIDE THE MODULE. `AI_MODE_IDS`, `AI_AGENT_IDS` and
 *     the rest are `as const satisfies` with an exhaustiveness witness INSIDE
 *     their own file, so a deletion from the union AND the array together
 *     leaves nothing in there to notice it. A literal list out here catches
 *     that twice — red at run time, and a `tsc` error naming the identifier —
 *     and, unlike a length, catches an ADDITION too.
 *   - TREE-WIDE PROPERTIES. `AC-43-103`'s separation is about a rendering
 *     COMPONENT, and the unit gate for it scans one data directory that holds
 *     no components at all. Reachability from `app/` spans two trees. Neither
 *     fits in a module's own test.
 *
 * EVERY ASSERTION HERE WAS PLANTED AGAINST AND WATCHED GO RED. The campaign
 * is recorded at the foot of this file, with the message each plant produced,
 * because a gate nobody has watched fail is a gate nobody has tested.
 * ==================================================================== */

const ROOT = process.cwd()
const OUT = join(ROOT, 'out')
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8')

/**
 * SLICE 11'S OWN FILES, walked rather than listed.
 *
 * Listed as ROOTS and not as one tree: `src/ui/shared` and `src/surfaces`
 * hold other slices' work, and slice 8's copy of this sweep was already
 * caught reading slice 9's twelve modules as its own after a shared directory
 * grew. The five `ai-degradation.ts` overlays are named individually for the
 * same reason — each lives inside a surface another slice owns.
 */
const SLICE_11_ROOTS: readonly string[] = ['src/ai', 'app/super-admin/ai-incidents', 'app/workflows/ai-and-its-absence']
const SLICE_11_LEAVES: readonly string[] = [
  'src/frontline/ai-degradation.ts',
  'src/studio/ai-degradation.ts',
  'src/surfaces/cc/ai-degradation.ts',
  'src/surfaces/doh/ai-degradation.ts',
  'src/surfaces/sa/ai-degradation.ts',
  'src/surfaces/sa/ai-failure-authority.ts',
  'src/ui/sa/AiFailureAuthorityPanel.tsx',
  'src/ui/shared/ProvenanceMark.tsx',
  'src/ui/shared/DeterministicBoundary.tsx',
  'src/ui/shared/StoryboardCard.tsx',
  'src/coverage/uninventoried.ts',
]

const SLICE_11_FILES: readonly string[] = [
  ...SLICE_11_ROOTS.flatMap((r) => sweptSources(r)),
  ...SLICE_11_LEAVES,
]

/**
 * THE POPULATION IS HAND-MAINTAINED, SO SOMETHING HAS TO GRADE IT.
 *
 * `SLICE_11_ROOTS` plus `SLICE_11_LEAVES` is a list a person keeps current,
 * and a grading population narrower than its subject is defect shape 10 —
 * a helper scoped to exclude the defect it names. The audit found four files
 * outside it; measured properly there are ten, and the difference is the
 * point: the number was never the claim, the reconciliation is.
 *
 * The subject is defined by the identifiers rather than by a diff, because a
 * test may not run `git`: any file naming an `AIMODE-`, `PROV-`, `FB-AI-`,
 * `FAIL-AI-` or `SB-AI-` token is slice-11 subject matter wherever it lives.
 *
 * Files outside the population are listed as an EQUALITY, not a membership,
 * so this reds twice — when a new identifier-bearing file lands outside, and
 * when one of these is folded into the population and the entry goes stale.
 * That is the shape this slice adopted for `KNOWN_PARAPHRASE` and
 * `KNOWN_UNREACHABLE` after a membership exemption was found rotting.
 */
const SLICE_11_IDENTIFIER = /(?<![A-Za-z0-9-])(?:AIMODE-\d+|PROV-\d|FB-AI-\d+|FAIL-AI-\d+|SB-AI-\d+)(?![A-Za-z0-9-])/

/**
 * Carries a slice-11 identifier and is NOT graded by this file's sweeps.
 * Each is another slice's module wearing a slice-11 overlay, or a registry
 * that names the identifiers to account for them. Folding them in would
 * subject another slice's code to this slice's prose rules.
 */
const IDENTIFIER_BEARING_OUTSIDE_POPULATION: readonly string[] = [
  'src/coverage/descriptors.ts',
  'src/disclosure/decisions.ts',
  'src/fallbacks/contracts.ts',
  'src/frontline/modules/fl-b8/CoachingPanel.tsx',
  'src/frontline/modules/fl-b8/degradation.ts',
  'src/surfaces/cc/modules/cc-05/degradation.ts',
  'src/surfaces/cc/modules/cc-06/degradation.ts',
  'src/surfaces/cc/modules/cc-07/degradation.ts',
  'src/surfaces/cc/modules/cc-08/AgentActivityPanel.tsx',
  'src/surfaces/cc/modules/cc-08/degradation.ts',
]

describe('the slice-11 grading population is reconciled against its own subject', () => {
  const bearing = (): readonly string[] =>
    [...sweptSources('src'), ...sweptSources('app')]
      .filter((f) => SLICE_11_IDENTIFIER.test(readFileSync(f, 'utf8')))
      .sort()

  it('finds identifier-bearing files at all', () => {
    // The positive control. An empty sweep would satisfy the equality below
    // by vacuity, which is defect shape 9 and has shipped here before.
    expect(bearing().length, 'no file in src or app names a slice-11 identifier').toBeGreaterThan(20)
  })

  it('accounts for every identifier-bearing file, in the population or by name', () => {
    const outside = bearing().filter((f) => !SLICE_11_FILES.includes(f))
    expect(outside).toEqual([...IDENTIFIER_BEARING_OUTSIDE_POPULATION].sort())
  })

  it('lists nothing that is already inside the population', () => {
    // The half that makes it an equality rather than an allowlist: fixing a
    // named file by folding it in must red until its entry is removed.
    const stale = IDENTIFIER_BEARING_OUTSIDE_POPULATION.filter((f) => SLICE_11_FILES.includes(f))
    expect(stale, 'an entry naming a file that is now graded').toEqual([])
  })
})

/** Backticks and markdown emphasis, dropped from both sides of a comparison. */
const flat = (s: string): string => s.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim()

const THIRTY_STORYBOARDS: readonly Storyboard[] = [
  ...STORYBOARDS_01_TO_10,
  ...STORYBOARDS_11_TO_20,
  ...SB_21_TO_30,
]

/* ==================================================================== *
 * THE PREAMBLE — the frozen-source pin, the population, and no widening
 * annotation on a closed vocabulary. Shared with the three other absence
 * sweeps rather than re-implemented here; `./absence-sweep` carries the
 * account of why a fourth private copy was the thing to avoid.
 * ==================================================================== */

describeFrozenSourcePin('slice 11')

describe('slice 11 gates: the population, before anything is claimed about it', () => {
  it('sweeps the files slice 11 actually shipped', () => {
    expectPopulationFloor(SLICE_11_FILES, 45, 'the slice-11 file set')
    for (const leaf of SLICE_11_LEAVES) {
      expect(existsSync(join(ROOT, leaf)), `${leaf} is named as a slice-11 file and is missing`)
        .toBe(true)
    }
  })

  it('reads a non-empty static export', () => {
    // A gate over `out/` that finds no pages passes every absence it asserts.
    expectPopulationFloor(exportedPages(), 50, 'the static export')
  })
})

describeClosedVocabularyAnnotations('slice 11 gates', SLICE_11_FILES, 40)

/* ==================================================================== *
 * GATE 1 — THE CLOSED VOCABULARIES, AS MEMBERSHIP LISTS DECLARED HERE.
 *
 * A LITERAL LIST, NEVER A LENGTH, AND TYPED TO THE EXPORTED UNION. Each list
 * below is annotated `readonly XId[]`, so removing a member from the union
 * inside the module is a `tsc` error out here that NAMES the identifier, and
 * removing it from the module's array is a run-time failure that names it
 * too. `toHaveLength(16)` is satisfied by any sixteen modes at all, and this
 * build has shipped a four-agent roster gated with `toBeGreaterThan(0)` —
 * green on a deletion AND on an addition.
 * ==================================================================== */

const EVERY_AI_MODE: readonly AiModeId[] = [
  'AIMODE-01', 'AIMODE-02', 'AIMODE-03', 'AIMODE-04', 'AIMODE-05', 'AIMODE-06',
  'AIMODE-07', 'AIMODE-08', 'AIMODE-09', 'AIMODE-10', 'AIMODE-11', 'AIMODE-12',
  'AIMODE-13', 'AIMODE-14', 'AIMODE-15', 'AIMODE-16',
]

const EVERY_PROVENANCE_CLASS: readonly ProvenanceClassId[] = [
  'PROV-1', 'PROV-2', 'PROV-3', 'PROV-4', 'PROV-5', 'PROV-6',
]

const EVERY_ABILITY: readonly AiAbilityId[] = [
  'AI-01', 'AI-02', 'AI-03', 'AI-04', 'AI-05', 'AI-06', 'AI-07',
  'AI-08', 'AI-09', 'AI-10', 'AI-11', 'AI-12', 'AI-13',
]

const EVERY_PROHIBITION: readonly ProhibitionNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const EVERY_QUEUED_REQUEST_STATE: readonly QueuedRequestStateId[] = [
  'saved locally', 'waiting for connection', 'uploaded', 'revalidating',
  'processing', 'pending human review', 'answer available', 'stale',
  'expired', 'cancelled', 'failed', 'reconciled',
]

/** Four, and the fourth is the Vision Reasoning Agent chapter 20's table omits. */
const EVERY_AI_AGENT: readonly AiAgentId[] = [
  'prevention', 'deviation-and-containment', 'shift-handoff', 'vision-reasoning',
]

const EVERY_SEVERITY_BAND: readonly OperationalSeverityBand[] = [
  'Critical', 'Major', 'Minor', 'Informational',
]

/** Sixty, spelled out, so a family losing a row is named rather than counted. */
const EVERY_FAILURE: readonly string[] = Array.from(
  { length: 60 },
  (_, i) => `FAIL-AI-${String(i + 1).padStart(2, '0')}`,
)

const EVERY_STORYBOARD: readonly StoryboardNumber[] = Array.from(
  { length: 30 },
  (_, i) => (i + 1) as StoryboardNumber,
)

/**
 * Twenty-one, WRITTEN OUT HERE. This is the one closed vocabulary gate 1 held
 * by a bare `toHaveLength(21)` beside `RESPONSE_SPINE.map(...)` compared to
 * `SPINE_ITEM_NUMBERS` — one export of a module compared to another export of
 * the same module, which is a self-comparison and stays green when the two
 * are deleted together. This gate's own headline rule is A LITERAL LIST,
 * NEVER A LENGTH, and the spine was the one member of the slice that did not
 * get one: a length passes on a renumbered item, a reordered list and a
 * duplicate alike.
 */
const EVERY_SPINE_ITEM: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
]

describe('slice 11 gate 1: every closed vocabulary, by membership', () => {
  it('sixteen operating modes, and the matrix holds one row for each', () => {
    expect([...AI_MODE_IDS]).toEqual([...EVERY_AI_MODE])
    expect(AI_MODE_ROWS.map((r) => r.id)).toEqual([...EVERY_AI_MODE])
  })

  it('six provenance classes, in the contract order', () => {
    expect([...PROVENANCE_CLASS_IDS]).toEqual([...EVERY_PROVENANCE_CLASS])
    expect(PROVENANCE_CLASSES.map((c) => c.id)).toEqual([...EVERY_PROVENANCE_CLASS])
  })

  it('thirteen abilities and twelve prohibitions', () => {
    expect([...AI_ABILITY_IDS]).toEqual([...EVERY_ABILITY])
    expect(AI_PROHIBITIONS.map((p) => p.number)).toEqual([...EVERY_PROHIBITION])
  })

  it('twelve queued-request states, in the source order', () => {
    expect([...QUEUED_REQUEST_STATE_IDS]).toEqual([...EVERY_QUEUED_REQUEST_STATE])
  })

  it('four agents, four operational severity bands, twenty-one spine items', () => {
    expect([...AI_AGENT_IDS]).toEqual([...EVERY_AI_AGENT])
    expect(AI_AGENT_ROSTER.map((a) => a.id)).toEqual([...EVERY_AI_AGENT])
    expect([...OPERATIONAL_SEVERITY_BANDS]).toEqual([...EVERY_SEVERITY_BAND])
    // BOTH EXPORTS AGAINST THE LITERAL, not against each other. The pair used
    // to be compared to one another and then measured with `toHaveLength(21)`,
    // which is satisfied by any twenty-one numbers in any order.
    expect([...SPINE_ITEM_NUMBERS]).toEqual([...EVERY_SPINE_ITEM])
    expect(RESPONSE_SPINE.map((s) => s.item)).toEqual([...EVERY_SPINE_ITEM])
  })

  it('sixty failures in six families, and each family holds the rows its title names', () => {
    expect(FAILURE_CATALOGUE.map((r) => r.id)).toEqual([...EVERY_FAILURE])
    // THE FAMILY SIZES ARE DERIVED FROM EACH FAMILY'S OWN TITLE, not stored.
    // Every title states its range — "`FAIL-AI-37` to `FAIL-AI-46`" — so the
    // size is readable from the string the source wrote, and a row filed under
    // the wrong family lands outside its own family's range.
    for (const family of FAILURE_FAMILIES) {
      const range = /`FAIL-AI-(\d+)` to `FAIL-AI-(\d+)`/.exec(family.title)
      expect(range, `${family.key}'s title states no identifier range`).not.toBeNull()
      const expected = EVERY_FAILURE.slice(Number(range![1]) - 1, Number(range![2]))
      expect(
        FAILURE_CATALOGUE.filter((r) => r.family === family.key).map((r) => r.id),
        `${family.key} does not hold exactly the rows its own title names`,
      ).toEqual(expected)
    }
    // And the six families partition the sixty, so no row is in two or none.
    expect(
      FAILURE_FAMILIES.flatMap((f) => FAILURE_CATALOGUE.filter((r) => r.family === f.key)),
    ).toHaveLength(FAILURE_CATALOGUE.length)
  })

  it('thirty storyboards, numbered one to thirty with no gap', () => {
    expect(THIRTY_STORYBOARDS.map((s) => s.number)).toEqual([...EVERY_STORYBOARD])
  })
})

/* ==================================================================== *
 * GATE 2 — EVERY VERBATIM-AND-LOCATOR PAIR READS AT THE LINE IT NAMES.
 *
 * ONE PREDICATE OVER EVERY RECORD SET, so a record set slice 12 adds is
 * covered without an edit here, and so a paraphrase cannot ship behind a
 * correct-looking line number. This is the defect shape this build has paid
 * for more than any other: nineteen wrong locators in one re-plan, every one
 * found by an agent opening the line and none by a suite.
 *
 * A COMPARISON OF WORDS, NOT OF TYPOGRAPHY. Backticks and markdown emphasis
 * are dropped from both sides — the source writes identifiers in backticks
 * and bolds fragments mid-sentence, and a record carrying the words is
 * correct about the claim. Whitespace is collapsed for the same reason.
 * ==================================================================== */

interface LocatedClaim {
  readonly what: string
  readonly line: number
  readonly text: string
}

const lineOf = (ref: string): number => {
  const m = /^L(\d+)$/.exec(ref)
  if (m === null) throw new Error(`not a locator: ${ref}`)
  return Number(m[1])
}

function locatedClaims(): readonly LocatedClaim[] {
  const claims: LocatedClaim[] = [
    ...AI_MODE_TRANSITIONS.map((t) => ({
      what: `transition to ${t.to.kind === 'mode' ? t.to.mode : t.to.kind}`,
      line: lineOf(t.locator),
      text: t.trigger,
    })),
    ...AI_MODE_ROWS.map((r) => ({
      what: `${r.id} worker label`,
      line: lineOf(r.matrixLocator),
      text: r.workerLabel,
    })),
    ...FIVE_SURFACE_OBLIGATIONS.map((o) => ({
      what: o.id,
      line: lineOf(o.sourceRef),
      text: o.text,
    })),
    ...STORYBOARD_ACCEPTANCE_CRITERIA.map((c) => ({
      what: c.id,
      line: lineOf(c.sourceRef),
      text: c.text,
    })),
  ]
  // The transcribed overlay tables' captions. A DERIVED table has no caption
  // line and `captionRef: null`, which is the whole point of that field being
  // nullable, so it contributes nothing here rather than a fabricated line.
  for (const overlay of FIVE_SURFACE_OVERLAYS) {
    for (const table of overlay.tables) {
      if (table.captionRef === null) continue
      claims.push({
        what: `${overlay.surfaceId} table caption`,
        line: lineOf(table.captionRef),
        text: table.caption,
      })
    }
  }
  return claims
}

/**
 * ONE CLAIM CONVICTED BY THIS GATE ON ITS FIRST RUN, AND IT IS NOT FIXED HERE.
 *
 * The line the record names is L89408 and it is the RIGHT line: it reads
 * "Mode-parity test: drive each of the sixteen modes in a staging tenant and
 * assert the rendered label on all five surfaces matches the mode vocabulary
 * table, in both English and Spanish authored variants."
 *
 * The record in `src/ai/five-surface/overlay.ts` drops the middle of that
 * sentence and joins the remaining ends with the word `asserting`, which the
 * source does not use. What it removes is `drive each of the sixteen modes in a
 * staging tenant and assert`.
 *
 * `OverlayObligation.text` is documented as "the
 * obligation in the source's own words, trimmed to the clause"; a trim removes
 * a clause from an end, and the old text removed the middle and rewrote the
 * seam. What it dropped was the half saying the test drives all SIXTEEN modes
 * in a STAGING TENANT -- the method, not decoration. Its seven siblings in the
 * same array, `TEST-43-002` and `TEST-43-301` included, were always exact.
 *
 * THE FINDING IS CLOSED AND THIS LIST IS EMPTY, WHICH IS THE EXEMPTION DOING
 * WHAT IT WAS BUILT FOR. It was declared as an EQUALITY rather than a
 * membership so that a second paraphrase would red it instead of joining a
 * widened exception -- and so that correcting the record would red it too. The
 * record was corrected in `src/ai/five-surface/overlay.ts` and this list went
 * red on the very next run. It stays here, empty, with the floor below it,
 * because the empty list is the assertion: no record in the slice pairs a
 * quotation with a line that does not carry it.
 */
const KNOWN_PARAPHRASE: readonly string[] = []

describe('slice 11 gate 2: every quoted claim reads at the line it names', () => {
  const claims = locatedClaims()

  it('finds the claims it is meant to grade', () => {
    // A FLOOR, because a `.map` over a record set that shrank to nothing
    // passes the loop below without executing it once.
    expectPopulationFloor(claims, 40, 'the located-claim set')
    // And every record set contributes, so a set silently dropping out of the
    // collector is a failure rather than a smaller number nobody reads.
    for (const required of ['AC-42-303', 'AC-43-005', 'AC-43-301', 'AC-44A-004']) {
      expect(claims.map((c) => c.what)).toContain(required)
    }
    expect(claims.filter((c) => c.what.endsWith('table caption'))).toHaveLength(4)
  })

  it('and none of them is a paraphrase or an off-by-one', () => {
    const wrong = claims.filter((c) => !flat(sourceLine(c.line)).includes(flat(c.text)))
    expect(
      wrong.map((c) => c.what).sort(),
      'a record pairs a quotation with a line that does not carry it. Open the line. '
        + wrong.map((c) => `${c.what} claims L${c.line} carries "${c.text}"`).join(' | '),
    ).toEqual([...KNOWN_PARAPHRASE].sort())
    // AND THE RECORD THAT USED TO BE THE EXCEPTION IS NOW GRADED LIKE THE REST.
    // Kept as its own case rather than folded into the sweep above, because a
    // corrected paraphrase is the one claim in this file with a history: the
    // sweep would pass if this record vanished, and this will not.
    const named = claims.find((c) => c.what === 'TEST-42-301')!
    expect(named.line).toBe(89_408)
    expect(sourceLine(89_408)).toContain('`TEST-42-301`')
    // The method is the half the old text dropped, so it is the half asserted.
    expect(flat(named.text)).toContain(flat('drive each of the sixteen modes in a staging tenant'))
    expect(flat(sourceLine(89_408))).toContain(flat(named.text))
  })

  // RED when: the comparison stops comparing. `flat` folding two different
  // sentences together, or an empty `text` making `includes` trivially true,
  // would let the whole gate above pass over anything.
  it('its comparison is not satisfied by an empty or a wrong string', () => {
    expect(flat(sourceLine(89_402)).includes(flat('a paused platform and an unreachable one')))
      .toBe(true)
    expect(flat(sourceLine(89_402)).includes(flat('a paused platform and a reachable one')))
      .toBe(false)
    // No claim may carry an empty quotation, which `includes` accepts from any
    // line at all — the `line !== ''` failure of an earlier gate, inverted.
    expect(claims.filter((c) => flat(c.text) === '')).toEqual([])
  })
})

/* ==================================================================== *
 * GATE 3 — `AC-42-303` IS A PAUSE-VERSUS-OUTAGE RULE, AND THE
 * TENANT-VERSUS-PLATFORM DISTINCTION IS MEASURED RATHER THAN ASSERTED.
 *
 * The criterion (L89402, its only occurrence) distinguishes `AIMODE-13`/`-14`
 * from `AIMODE-03`/`-05`, and `TEST-42-302` at L89409 is named
 * "Pause-versus-outage test". Two briefs and one module had restated it as
 * distinguishing the two pause SCOPES from each other, which it does not do —
 * and cannot, because `AIMODE-13` and `AIMODE-14` are byte-identical across
 * every contract column.
 *
 * What separates a tenant pause from a platform pause is `FAIL-AI-41` and
 * `-42`: their Frontline message cells are byte-identical and their tenant-web
 * cells differ, at L90513 and L90514. So the Command Center can tell them
 * apart and THE DEVICE CANNOT, and the join leans on the cells rather than on
 * the criterion. Both halves are asserted, because either alone lets the
 * paraphrase back in.
 * ==================================================================== */

describe('slice 11 gate 3: the pause-versus-outage rule and its measured basis', () => {
  it('L89402 is the criterion, names all four modes, and is its only occurrence', () => {
    const at = sourceLine(89_402)
    expect(at).toContain('`AC-42-303`')
    for (const mode of ['AIMODE-13', 'AIMODE-14', 'AIMODE-03', 'AIMODE-05']) {
      expect(at, `L89402 does not name ${mode}`).toContain(mode)
    }
    expect(sourceLine(89_409)).toContain('Pause-versus-outage test')
  })

  it('the two pause modes are indistinguishable in the matrix, which is why the cells matter', () => {
    const thirteen = AI_MODE_ROWS.find((r) => r.id === 'AIMODE-13')!
    const fourteen = AI_MODE_ROWS.find((r) => r.id === 'AIMODE-14')!
    // Every contract column but the identifier and the name.
    for (const column of [
      'workerLabel', 'agentInvocation', 'deterministicSafety', 'escalationDelivery', 'classification',
    ] as const) {
      expect(thirteen[column], `AIMODE-13 and -14 differ on ${column}`).toBe(fourteen[column])
    }
    expect(thirteen.name).not.toBe(fourteen.name)
  })

  it('FAIL-AI-41 and -42 agree on the Frontline cell and differ on the tenant-web one', () => {
    const tenant = catalogueRow('FAIL-AI-42')
    const platform = catalogueRow('FAIL-AI-41')
    expect(platform.cells.frontlineMessage).toBe(tenant.cells.frontlineMessage)
    expect(platform.cells.tenantWebMessage).not.toBe(tenant.cells.tenantWebMessage)
    // Read off the frozen bytes, not restated: each cell is IN the line the row
    // gives as its own locator, so a reworded cell is convicted here as well as
    // by gate 2's sweep.
    expect(platform.attributeLocators[0]).toBe(90_513)
    expect(tenant.attributeLocators[0]).toBe(90_514)
    expect(sourceLine(90_513)).toContain(platform.cells.tenantWebMessage)
    expect(sourceLine(90_514)).toContain(tenant.cells.tenantWebMessage)
    expect(sourceLine(90_513)).toContain(platform.cells.frontlineMessage)
    expect(sourceLine(90_514)).toContain(tenant.cells.frontlineMessage)
  })

  it('the shipped join distinguishes the two scopes and neither collapses into the other', () => {
    expect([...PAUSE_SCOPES]).toEqual(['platform-wide', 'per tenant'])
    const joins = PAUSE_SCOPES.map((s) => pauseJoinForScope(s))
    expect(new Set(joins.map((j) => j.failure.id)).size).toBe(2)
    expect(new Set(joins.map((j) => j.mode.id)).size).toBe(2)
  })
})

/* ==================================================================== *
 * GATE 4 — THE ABSOLUTE RULE, IN THE BYTES A READER IS SERVED.
 *
 * L89439: cached approved guidance (`PROV-3`) and deterministic rules
 * (`PROV-4`) are never, on any surface, in any locale, under any failure
 * condition, labelled or described as live artificial intelligence.
 *
 * Enforced over the EXPORT rather than over the source, because the rule is
 * about what a person is shown. The forbidden strings are read off `PROV-1`'s
 * and `PROV-2`'s own records — the two classes that DO mean live inference —
 * so a treatment reworded in the module cannot leave this gate policing a
 * phrase nothing renders any more.
 * ==================================================================== */

/** Every `index.html` the export emitted, repo-relative. */
function exportedPages(): readonly string[] {
  if (!existsSync(OUT)) return []
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry === 'index.html') out.push(relative(ROOT, full))
    }
  }
  walk(OUT)
  return out.sort()
}

interface ShippedMark {
  readonly page: string
  readonly classId: string
  readonly text: string
}

/** Every provenance mark in the export, with the text of its own subtree. */
function shippedMarks(): readonly ShippedMark[] {
  const marks: ShippedMark[] = []
  for (const page of exportedPages()) {
    const html = read(page)
    if (!html.includes(PROVENANCE_CLASS_ATTRIBUTE)) continue
    const { document } = new JSDOM(html).window
    for (const el of document.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)) {
      marks.push({
        page,
        classId: el.getAttribute(PROVENANCE_CLASS_ATTRIBUTE) ?? '',
        text: el.textContent ?? '',
      })
    }
  }
  return marks
}

/**
 * The two labels that mean live inference, from the records rather than from
 * this file. `PROV-1` is "Live artificial intelligence" and `PROV-2` is the
 * on-device assistant; a `PROV-3` or `PROV-4` element carrying either has
 * described cached guidance or a deterministic rule as live.
 */
const LIVE_LABELS: readonly string[] = [provenanceClass('PROV-1'), provenanceClass('PROV-2')].map(
  (c) => c.markerText,
)

const NEVER_LIVE: readonly string[] = ['PROV-3', 'PROV-4']

describe('slice 11 gate 4: the absolute rule of L89439, over the export', () => {
  it('reads the rule at the line that carries it', () => {
    const at = sourceLine(89_439)
    expect(at).toContain('The absolute rule')
    expect(at).toContain('`PROV-3`')
    expect(at).toContain('`PROV-4`')
    expect(at).toContain('labelled or described as live artificial intelligence')
  })

  it('the labels it forbids are real, distinct, and not empty', () => {
    expect(LIVE_LABELS).toHaveLength(2)
    expect(new Set(LIVE_LABELS).size).toBe(2)
    for (const label of LIVE_LABELS) expect(label.length).toBeGreaterThan(4)
    expect(LIVE_LABELS).toContain('Live artificial intelligence')
  })

  it('no cached-guidance or deterministic-rule element in the export is labelled live', () => {
    const marks = shippedMarks()
    // THE FLOORS FIRST. An export with no marks satisfies every absence below.
    expectPopulationFloor(marks, 40, 'the shipped provenance marks')
    expectPopulationFloor(
      marks.filter((m) => NEVER_LIVE.includes(m.classId)),
      40,
      'the shipped PROV-3 and PROV-4 marks',
    )
    expectPopulationFloor(
      [...new Set(marks.map((m) => m.page))],
      10,
      'the pages carrying a provenance mark',
    )

    const offenders = marks
      .filter((m) => NEVER_LIVE.includes(m.classId))
      .flatMap((m) =>
        LIVE_LABELS.filter((label) => m.text.includes(label)).map(
          (label) => `${m.page}: a ${m.classId} element is labelled "${label}"`,
        ),
      )
    expect(
      offenders,
      'L89439 forbids cached approved guidance and deterministic rules being labelled or '
        + 'described as live artificial intelligence, on any surface, in any locale, under any '
        + 'failure condition.',
    ).toEqual([])
  })

  // RED when: the predicate stops firing. The export happens to render no
  // `PROV-1` mark today, so the forbidden label appears nowhere in it — which
  // is exactly the state in which an absence check quietly stops being a
  // check. The predicate is therefore run against a synthesised subtree.
  it('its predicate convicts a PROV-3 element carrying the live label', () => {
    const planted = new JSDOM(
      `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-3"><span>${LIVE_LABELS[0]!}</span>`
        + '<span>Approved guidance</span></div>',
    ).window.document
    const el = planted.querySelector(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)!
    expect(NEVER_LIVE).toContain(el.getAttribute(PROVENANCE_CLASS_ATTRIBUTE))
    expect(LIVE_LABELS.some((l) => (el.textContent ?? '').includes(l))).toBe(true)
    // And silent on the compliant treatment, so it is not convicting everything.
    const clean = new JSDOM(
      `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-3"><span>Approved guidance</span></div>`,
    ).window.document.querySelector(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)!
    expect(LIVE_LABELS.some((l) => (clean.textContent ?? '').includes(l))).toBe(false)
  })

  /**
   * THE LIMIT, ASSERTED AS A LIMIT, in the shape gate 5 uses below. L89439
   * forbids cached guidance and deterministic rules being "labelled OR
   * DESCRIBED as live artificial intelligence … IN ANY LOCALE". This gate
   * enforces LABELLED, in English, in exact case. Three narrowings, all
   * deliberate, none of them previously written down — and an unstated
   * narrowing and an oversight look identical from outside.
   *
   *  1. EXACT CASE. The tree writes the phrase lowercase inside running
   *     prose, overwhelmingly as a negation — "…is never labelled as live
   *     artificial intelligence". Case-insensitive matching convicts those,
   *     which is why it is not used; the case below MEASURES that rather than
   *     asserting it, so the justification cannot rot into a claim.
   *  2. ENGLISH ONLY. `src/surfaces/doh/ai-degradation.ts` ships rendered
   *     Spanish, and `LIVE_LABELS` comes from `provenanceClass(...).markerText`,
   *     which has one spelling. A Spanish live-AI label on a `PROV-4` element
   *     would ship past this gate.
   *  3. LABELLED, NOT DESCRIBED. A paraphrase that describes a deterministic
   *     rule as live inference without using the marker text is outside the
   *     predicate entirely. Closing that needs a claim classifier, not a
   *     string match.
   *
   * What would close 1 and 2 is a per-locale marker vocabulary carried on the
   * provenance classes themselves, so the label a surface renders and the
   * label this gate forbids are the same record in every locale. That is a
   * records change, not a gate's to make.
   */
  it('and does NOT convict lowercase, Spanish, or a description — the three open limits', () => {
    const convicts = (text: string): boolean => LIVE_LABELS.some((l) => text.includes(l))
    expect(sourceLine(89_439)).toContain('in any locale')
    expect(sourceLine(89_439)).toContain('labelled or described')

    expect(convicts('Live artificial intelligence is monitoring this step'), 'the exact label')
      .toBe(true)
    expect(convicts('live artificial intelligence is monitoring this step'), 'lowercase')
      .toBe(false)
    expect(convicts('Inteligencia artificial en vivo'), 'the Spanish label').toBe(false)
    expect(convicts('An agent evaluated this worker’s situation just now'), 'a description')
      .toBe(false)

    // Narrowing 1 is load-bearing rather than arbitrary, MEASURED on what
    // shipped: a case-insensitive predicate convicts marks that are compliant
    // today, so relaxing the case would turn this gate into one people widen.
    const lowered = LIVE_LABELS.map((l) => l.toLowerCase())
    const overConvicted = shippedMarks()
      .filter((m) => NEVER_LIVE.includes(m.classId))
      .filter((m) => lowered.some((l) => m.text.toLowerCase().includes(l)))
    expect(
      overConvicted.length,
      'a case-insensitive predicate now convicts nothing, so narrowing 1 has no cost and the '
        + 'gate should be widened to close it',
    ).toBeGreaterThan(0)
    // Narrowing 2 is live too: the tree really does render another locale.
    expect(read('src/surfaces/doh/ai-degradation.ts')).toContain('inteligencia artificial')
  })
})

/* ==================================================================== *
 * GATE 5 — THE PROVENANCE CONTRACT, OVER THE BUILT TREE.
 *
 * `src/ai/provenance/contract.ts` says of its own checker that the sweep
 * calling it is "a `tests/coverage/` gate over the built tree, which is not
 * this task's to write". This is that gate.
 *
 * A GATE LIMIT MEASURED HERE AND LEFT OPEN, WITH THE MEASUREMENT.
 * Task 15A found by planting that `provenanceViolations` convicts a mark
 * NESTED inside another mark and says nothing about two marks placed SIDE BY
 * SIDE under one `data-guidance-element`. A closure was written, run, and
 * REVERTED, and the reason is worth more than the closure would have been:
 * counting the marks under a region convicts §42.4's own worked example.
 *
 * L89461 is headed "Illustrative Example — one screen, four provenance classes
 * at once", and it is the contract HOLDING, not breaking: Maya's torque screen
 * carries the limits beside the input, the authored Work Instruction, a muted
 * unavailable panel, and a human-attributed line — four classes, four sibling
 * elements, one screen. `AC-42-401` (L89478) reads "Every user-visible
 * guidance element on every surface resolves to exactly one of the six
 * provenance classes", and its unit is the GUIDANCE ELEMENT rather than the
 * region. `data-guidance-element` cannot tell the two apart: the same
 * attribute names a leaf that must carry one class and a screen region that
 * legitimately holds four. Measured cost of closing it as-is: the whole
 * component suite went from 3005 green to one red, at
 * `tests/component/provenance-mark.test.tsx:306`, on a fixture whose own
 * comment says a lint flagging it "would be wrong about the contract" — and
 * that fixture is right. So the gap is real and is not a gate's to close: what
 * would close it is a marking convention that distinguishes a leaf element
 * from a container, in every rendering path. Reported rather than papered
 * over, and the checker's bytes are unchanged.
 *
 * What this gate DOES enforce is every half the attribute can answer, over the
 * export: a malformed class, a nested pair, and a region declaring itself
 * guidance while carrying no class anywhere inside it.
 * ==================================================================== */

describe('slice 11 gate 5: what shipped obeys the exactly-one-class contract', () => {
  const pagesWithMarks = (): readonly string[] =>
    exportedPages().filter((p) => read(p).includes(PROVENANCE_CLASS_ATTRIBUTE))

  it('sweeps the pages that actually carry a mark', () => {
    expectPopulationFloor(pagesWithMarks(), 10, 'the pages carrying a provenance mark')
    expectPopulationFloor(
      exportedPages().filter((p) => read(p).includes(GUIDANCE_ELEMENT_ATTRIBUTE)),
      2,
      'the pages declaring a guidance element',
    )
  })

  it('no exported page breaks AC-42-401', () => {
    const offenders: string[] = []
    for (const page of pagesWithMarks()) {
      const { document } = new JSDOM(read(page)).window
      for (const violation of provenanceViolations(document)) offenders.push(`${page}: ${violation}`)
    }
    expect(offenders).toEqual([])
  })

  /**
   * EVERY SHAPE THE CHECKER CAN SEE, AND THE ONE IT CANNOT — both asserted,
   * so the limit is a measurement in a suite rather than a sentence in a
   * report. A gate whose predicate is silent on everything passes every
   * absence it makes.
   */
  it('and its checker convicts a malformed class, a nested pair and an empty region', () => {
    const of = (html: string): readonly string[] =>
      provenanceViolations(new JSDOM(html).window.document)

    const nested =
      `<div ${GUIDANCE_ELEMENT_ATTRIBUTE}="g">`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-3">`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-4"></div></div></div>`
    expect(of(nested).join(' ')).toContain('carries two provenance classes')

    const none = `<div ${GUIDANCE_ELEMENT_ATTRIBUTE}="g"><p>text</p></div>`
    expect(of(none).join(' ')).toContain('carries no provenance class at all')

    const unknown = `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-9"></div>`
    expect(of(unknown).join(' ')).toContain('needs exactly one of')

    const two = `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-3 PROV-4"></div>`
    expect(of(two).join(' ')).toContain('needs exactly one of')

    // And SILENT on the correct shape, so it is not convicting everything.
    const one =
      `<div ${GUIDANCE_ELEMENT_ATTRIBUTE}="g">`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-3"></div></div>`
    expect(of(one)).toEqual([])
  })

  /**
   * THE LIMIT, ASSERTED AS A LIMIT. This is the shape the checker does NOT
   * convict, and it is recorded as a live expectation rather than as prose so
   * that the day someone closes it, this case goes red and forces the reader
   * to the paragraph at the head of this gate. An assertion that the gap is
   * still there is the only kind of documentation of a gap that cannot rot.
   *
   * And the same four-class region is what §42.4's illustrative example
   * describes, so this case is simultaneously the reason the gap may not be
   * closed at the attribute.
   */
  it('and does NOT convict four sibling marks in one region, which is the open limit', () => {
    const siblings =
      `<div ${GUIDANCE_ELEMENT_ATTRIBUTE}="torque screen">`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-4"></div>`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-3"></div>`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-6"></div>`
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-5"></div></div>`
    expect(provenanceViolations(new JSDOM(siblings).window.document)).toEqual([])
    // The source's own line, read rather than paraphrased, because it is what
    // makes the four-class region correct rather than merely undetected.
    expect(sourceLine(89_461)).toContain('one screen, four provenance classes at once')
    expect(sourceLine(89_478)).toContain('resolves to exactly one of the six provenance classes')
  })

  /**
   * PLANTED INTO THE REAL BYTES, IN MEMORY, NOT ONTO THE REAL FILE.
   *
   * This case used to `writeFileSync` the plant into a real `out/**` page and
   * restore it in a `finally`. Between those two writes the SHIPPED export was
   * corrupt on disk: a crash, a `process.exit`, a hard kill or a `pnpm build`
   * running in the same tree left a page with an extra `PROV-5` mark in it,
   * and two agents in this build have already had `out/` change under them
   * mid-run. Nothing about the plant needed the filesystem — the checker takes
   * a `Document` — so the mutation is gone and the property it proved is not:
   * the plant is spliced into the bytes that actually shipped, read from the
   * page they shipped in.
   */
  it('PLANTED: a nested mark spliced into a real exported page convicts', () => {
    const page = exportedPages().find((p) => read(p).includes(PROVENANCE_CLASS_ATTRIBUTE))
    expect(page, 'no exported page carries a provenance mark to plant into').toBeDefined()
    const shipped = read(page!)
    // Splice a mark INSIDE an existing one, which is the shape the checker
    // does see, against the bytes that actually shipped.
    const anchor = `<div ${PROVENANCE_CLASS_ATTRIBUTE}=`
    const at = shipped.indexOf(anchor)
    expect(at, 'the anchor this plant splices at is not in the page').toBeGreaterThan(-1)
    const open = shipped.indexOf('>', at) + 1
    const planted =
      shipped.slice(0, open)
      + `<div ${PROVENANCE_CLASS_ATTRIBUTE}="PROV-5"></div>`
      + shipped.slice(open)
    expect(planted).not.toBe(shipped)
    const found = provenanceViolations(new JSDOM(planted).window.document)
    expect(found.join(' '), 'the plant produced no violation at all').toContain(
      'carries two provenance classes',
    )
    // And the unplanted bytes are clean, so the conviction came from the
    // splice rather than from something the page already carried. Read from
    // disk a second time: an unchanged page is what this asserts.
    expect(read(page!)).toBe(shipped)
    expect(provenanceViolations(new JSDOM(shipped).window.document)).toEqual([])
  })
})

/* ==================================================================== *
 * GATE 6 — `AC-43-103`: OPERATIONAL AND MANUFACTURING SEVERITY SHARE NO
 * RENDERING COMPONENT.
 *
 * WHY THIS EXISTS WHEN A UNIT GATE ALREADY NAMES THE CRITERION. That gate
 * scans `src/ai/failures/`, which holds no components at all — it is a data
 * directory. `AC-43-103`'s words are "never share a RENDERING COMPONENT", and
 * this build has already shipped a severity gate that "scanned a directory
 * and could not see the panel that directory mounts". So this one is keyed on
 * `.tsx` files across `src/` and `app/`, in both directions, and follows the
 * component import graph.
 *
 * IT DOES NOT FOLLOW DATA IMPORTS, and that is measured rather than assumed.
 * The full import closure convicts `AgentActivityPanel.tsx`, which reaches a
 * manufacturing `severityBands` field three hops away through the Studio
 * agent register it legitimately reuses. A data type reached transitively is
 * not a shared rendering, and convicting it would force a real reuse to be
 * duplicated — the opposite of the rule.
 * ==================================================================== */

/*
 * THE SYMBOL LISTS ARE IMPORTED, NOT RESTATED. This file's private copy held
 * SIX and was the TREE-WIDE scan; `tests/unit/ai-failures.test.ts` held SEVEN
 * over one data directory, and `tests/component/ai-degradation-overlays.test.tsx`
 * held TWO, one of which was in neither. The omissions were real:
 * `\bseverityBand\b` does not match `severityBands`, and two live components
 * carry the two names this copy omitted while scoring zero hits on its six.
 * See `absence-sweep.ts` for the measurement.
 */
const namesAny = (text: string, symbols: readonly string[]): boolean =>
  symbols.some((s) => new RegExp(`\\b${s}\\b`).test(text))

const allSources = (): readonly string[] => [...sweptSources('src'), ...sweptSources('app')]

/** Resolve one import specifier to a repo-relative source path, or `null`. */
function resolveImport(from: string, spec: string, known: ReadonlySet<string>): string | null {
  let base: string
  if (spec.startsWith('@/')) base = join('src', spec.slice(2))
  else if (spec.startsWith('.')) base = relative(ROOT, resolve(join(ROOT, dirname(from)), spec))
  else return null
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
    base,
  ]) {
    if (known.has(candidate)) return candidate
  }
  return null
}

/**
 * `from`'s imports, resolved.
 *
 * `[^'";]*?` and not `[^\n]*?`, and the difference is the whole scan: a
 * line-bounded matcher cannot see a multi-line import, and this tree writes
 * many of them that way. A planted multi-line import walked past the
 * line-bounded form of exactly this pattern in another gate, 21/21 green.
 *
 * `['"]` AND NOT `'`, AND THE DIRECTION IS WHY IT MATTERED. The specifier
 * class used to exclude the double quote. For gate 12 a missed edge only
 * makes a file look unreachable, which REDS — fail-safe. For gate 6 a missed
 * edge SHRINKS the component closure, so the offender list empties and the
 * gate goes GREEN on the defect it exists to catch. Every specifier in this
 * tree is single-quoted today and none is double-quoted, so the hole is latent
 * rather than live — which is exactly the kind that survives, since nothing
 * reds when someone hand-writes one quote character. The sibling resolver at
 * `tests/component/ai-incidents-console.test.tsx` already used `['"]`.
 *
 * NO SPECIFIER COUNT IS WRITTEN DOWN HERE ANY MORE, and that is the fix rather
 * than a tidy-up. This paragraph said "2,877 single-quoted" and the measured
 * figure was 2,880 by the time it was audited — a number that drifts with
 * every import anyone adds, restated as evidence for a property. The property
 * is what matters and it is asserted directly instead, on every run, by
 * `its specifier matcher reads both quote styles and a multi-line import` in
 * gate 6 below.
 */
const IMPORT_FROM = /(?:^|\n)\s*(?:import|export)\b[^'";]*?from\s*['"]([^'"]+)['"]/g

/** Every `from '…'` specifier in `text`, in order. Both quote styles. */
const specifiersIn = (text: string): readonly string[] =>
  [...text.matchAll(IMPORT_FROM)].map((m) => m[1]!)

function importsOf(from: string, known: ReadonlySet<string>): readonly string[] {
  return specifiersIn(read(from))
    .map((s) => resolveImport(from, s, known))
    .filter((s): s is string => s !== null)
}

/**
 * The `.tsx`-only import closure of `entry` — the components it mounts.
 *
 * ONLY `.tsx` IS ENQUEUED, AND THAT IS A LIMIT, not just a filter. A component
 * re-exported through a `.ts` barrel is reached by an edge this traversal
 * refuses to follow, so it is outside EVERY closure this gate builds — the
 * same shape as the star-re-export gap already recorded against
 * `src/ui/primitives/index.ts`. Enqueuing `.ts` too would follow every data
 * import and convict the transitive data reuse the paragraph above explains
 * must not be convicted; separating "a barrel that re-exports a component"
 * from "a module that exports data" needs the export resolved rather than the
 * extension matched. Stated rather than widened, because an unstated limit
 * and an oversight look identical from outside.
 *
 * AND THE LIMIT IS NOW LIVE RATHER THAN PROSE. A paragraph nothing checks is
 * true until it silently is not: this one was a written-down claim and the day
 * a `.ts` barrel re-exported a severity component the gate would have gone
 * green on a real shared rendering with nothing to say so. `barrelComponentEdges`
 * below enumerates every `.ts` module in the tree that re-exports a `.tsx` one
 * — the exact edge this traversal refuses — and gate 6 asserts that none of
 * them re-exports a component in either severity world. So the gap stays open
 * and unwidened, but the moment it becomes REACHABLE the case reds and names
 * this paragraph.
 */
function componentClosure(entry: string, known: ReadonlySet<string>): ReadonlySet<string> {
  const seen = new Set([entry])
  const queue = [entry]
  while (queue.length > 0) {
    for (const next of importsOf(queue.pop()!, known)) {
      if (next.endsWith('.tsx') && !seen.has(next)) {
        seen.add(next)
        queue.push(next)
      }
    }
  }
  return seen
}

const BARREL_EXPORT_FROM = /(?:^|\n)\s*export\b[^'";]*?from\s*['"]([^'"]+)['"]/g

/**
 * Every `<a `.ts` module, the `.tsx` module it RE-EXPORTS>` edge in the tree.
 *
 * `export … from` and not `import … from`: a `.ts` file that IMPORTS a
 * component is using it, which is a `.tsx`-to-`.tsx` question the closure
 * already answers through its own file. What the closure cannot see is the
 * re-export — the barrel that makes someone else's component available under
 * its own path, so an importer names the `.ts` and mounts the `.tsx`.
 *
 * `IMPORT_FROM`'s specifier class is reused rather than a second pattern
 * written, narrowed to `export`. Both halves of that matter: the `[^'";]*?`
 * body crosses newlines, and twelve of this tree's re-exports are written
 * across lines.
 */
function barrelComponentEdges(
  known: ReadonlySet<string>,
): readonly (readonly [string, string])[] {
  const edges: (readonly [string, string])[] = []
  for (const file of known) {
    if (!file.endsWith('.ts')) continue
    for (const spec of [...read(file).matchAll(BARREL_EXPORT_FROM)].map((m) => m[1]!)) {
      const target = resolveImport(file, spec, known)
      if (target?.endsWith('.tsx')) edges.push([file, target])
    }
  }
  return edges
}

describe('slice 11 gate 6: AC-43-103 — the two severity worlds share no rendering', () => {
  const sources = allSources()
  const known = new Set(sources)
  const components = sources.filter((f) => f.endsWith('.tsx'))
  const operational = components.filter((f) => namesAny(read(f), OPERATIONAL_SEVERITY_SYMBOLS))
  const manufacturing = components.filter((f) => namesAny(read(f), MANUFACTURING_SEVERITY_SYMBOLS))

  it('reads the criterion at its own line', () => {
    expect(sourceLine(89_975)).toContain('`AC-43-103`')
    expect(sourceLine(89_975)).toContain('never share a rendering component')
    expect(sourceLine(89_981)).toContain('`TEST-43-103`')
  })

  it('finds components in BOTH worlds, so the disjointness is over two non-empty sets', () => {
    expectPopulationFloor(components, 80, 'the component population')
    expectPopulationFloor(operational, 1, 'the operational-severity components')
    expectPopulationFloor(manufacturing, 1, 'the manufacturing-severity components')
    // And every forbidden symbol exists somewhere, so the scan is not
    // policing ghosts — a typo in a forbidden name is invisible from inside.
    const everything = sources.map((f) => read(f)).join('\n')
    expectEverySymbolExists(everything, [
      ...MANUFACTURING_SEVERITY_SYMBOLS,
      ...OPERATIONAL_SEVERITY_SYMBOLS,
    ])
  })

  it('no component names both vocabularies', () => {
    expect(operational.filter((f) => manufacturing.includes(f))).toEqual([])
  })

  it('and no component in either world mounts one from the other', () => {
    const offenders: string[] = []
    for (const file of operational) {
      for (const mounted of componentClosure(file, known)) {
        if (mounted !== file && manufacturing.includes(mounted)) {
          offenders.push(`${file} mounts the manufacturing-severity component ${mounted}`)
        }
      }
    }
    for (const file of manufacturing) {
      for (const mounted of componentClosure(file, known)) {
        if (mounted !== file && operational.includes(mounted)) {
          offenders.push(`${file} mounts the operational-severity component ${mounted}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  /**
   * THE `.tsx`-ONLY LIMIT, AS A LIVE EXPECTATION.
   *
   * `componentClosure` enqueues `.tsx` only, so a component re-exported
   * through a `.ts` barrel is outside every closure this gate builds. That was
   * written down at the head of the function and NOTHING RED IF IT STOPPED
   * BEING TRUE — a limit stated in prose is a limit until it is a hole.
   *
   * This is the narrowest live form of it: not "no barrel re-exports a
   * component", which the tree does eighteen times through
   * `src/ui/primitives/index.ts` alone, but "no barrel re-exports a component
   * in EITHER severity world". That is exactly the state in which the gap
   * becomes reachable — an operational component naming the barrel would mount
   * a manufacturing component along an edge the traversal refuses to follow,
   * and the offender list would stay empty. Whoever reds this case either
   * widens the traversal and pays the transitive-data cost the paragraph above
   * describes, or shows the re-export is not a rendering. Both are decisions;
   * silence was not.
   *
   * DERIVED, WITH NO LIST OF PERMITTED BARRELS. An allowlist here would be
   * nineteen entries of derived data with a hand-maintained copy, which is the
   * shape this slice has already had rot on it twice.
   */
  it('and no `.ts` barrel re-exports a component of either severity world', () => {
    const edges = barrelComponentEdges(known)
    // The population floor. Zero edges means the re-export matcher stopped
    // matching, and an empty offender list over an empty population is the
    // vacuous green this whole file is written against. A FLOOR, not a count:
    // measured nineteen today and it moves with every barrel anyone adds.
    expectPopulationFloor(edges, 10, 'the `.ts`-barrel component re-export edges')
    // And the recorded one is among them, so the scan is demonstrably looking
    // at the gap this build already knows about rather than at nineteen
    // accidents.
    expect(
      edges.map(([barrel]) => barrel),
      'the star-re-export barrel already recorded as a known gap is not in the edge set',
    ).toContain('src/ui/primitives/index.ts')

    const offenders = edges
      .filter(([, target]) => operational.includes(target) || manufacturing.includes(target))
      .map(
        ([barrel, target]) =>
          `${barrel} re-exports the severity component ${target}, which no closure this gate `
          + 'builds can reach',
      )
    expect(
      offenders,
      'a `.ts` barrel re-exports a severity-naming component. `componentClosure` enqueues `.tsx` '
        + 'only, so this component is outside EVERY closure this gate builds and the disjointness '
        + 'above is now claimed over an edge nobody walks. Read the limit paragraph at the head of '
        + '`componentClosure`: either widen the traversal — and prove the transitive-data '
        + 'convictions it causes are handled — or show this re-export is not a rendering.',
    ).toEqual([])
  })

  // RED when: the specifier class narrows back to one quote style, or the
  // body stops crossing newlines. Both have shipped here: the double quote
  // was missing until this round, and a planted multi-line import walked past
  // the line-bounded form of this pattern 21/21 green in another gate. This
  // replaces a measured specifier COUNT that used to sit in `importsOf`'s
  // comment as evidence for the same property and was three low when audited.
  it('its specifier matcher reads both quote styles and a multi-line import', () => {
    expect(specifiersIn("import { A } from '@/a'\n")).toEqual(['@/a'])
    expect(specifiersIn('import { A } from "@/a"\n')).toEqual(['@/a'])
    expect(specifiersIn('import {\n  A,\n  B,\n} from "@/a"\n')).toEqual(['@/a'])
    expect(specifiersIn("export * from './b'\n")).toEqual(['./b'])
    expect(specifiersIn("export {\n  C,\n} from './c'\n")).toEqual(['./c'])
    // And the barrel matcher, which shares the specifier class, does NOT read
    // a plain import as a re-export.
    const barrelSpecs = (t: string) => [...t.matchAll(BARREL_EXPORT_FROM)].map((m) => m[1]!)
    expect(barrelSpecs("export {\n  C,\n} from './c'\n")).toEqual(['./c'])
    expect(barrelSpecs("import { C } from './c'\n")).toEqual([])
  })

  // RED when: the closure stops closing. A `componentClosure` that returned
  // only its entry would report every pair disjoint for ever.
  it('its closure follows more than one hop', () => {
    const deep = components.find((f) => componentClosure(f, known).size > 2)
    expect(deep, 'no component closure reaches two others; the graph walk is not walking')
      .toBeDefined()
  })
})

/* ==================================================================== *
 * GATE 7 — THE TWELVE QUEUED-REQUEST STATES AND THE 12x5 MATRIX.
 *
 * THE STUDIO COLUMN IS NOT UNIFORM, AND TWO BRIEFS SAID IT WAS. Both this
 * task's brief and the common brief describe it as
 * `Not applicable — authoring surface` on all twelve rows. Eleven rows read
 * that; the `saved locally` row carries its own longer reason. A gate written
 * from the brief would have asserted the wrong reason onto row one, which is
 * why the DISPOSITION is held uniform and the REASONS are held by membership.
 * ==================================================================== */

describe('slice 11 gate 7: the queued-request matrix', () => {
  it('is twelve rows by five columns with no cell missing', () => {
    expect(QUEUED_REQUEST_SURFACE_MATRIX).toHaveLength(QUEUED_REQUEST_STATE_IDS.length)
    expect(QUEUED_REQUEST_SURFACE_MATRIX.map((r) => r.state)).toEqual([
      ...EVERY_QUEUED_REQUEST_STATE,
    ])
    expect([...QUEUED_REQUEST_SURFACE_IDS]).toEqual([
      'frontline', 'command-center', 'hub', 'studio', 'super-admin',
    ])
    for (const state of QUEUED_REQUEST_STATE_IDS) {
      for (const surface of QUEUED_REQUEST_SURFACE_IDS) {
        expect(cellAt(state, surface).disposition.length, `${state} x ${surface}`).toBeGreaterThan(0)
      }
    }
  })

  it('every Studio cell is a stated absence, and its reasons are held by membership', () => {
    const studio = QUEUED_REQUEST_STATE_IDS.map((s) => cellAt(s, 'studio'))
    expect(studio).toHaveLength(12)
    for (const cell of studio) expect(cell.disposition).toBe('not applicable')
    const reasons = studio.map((c) => (c.disposition === 'not applicable' ? c.reason : ''))
    // A MEMBERSHIP, NOT A UNIFORMITY. Eleven share the short reason and one
    // carries its own; an invented reason on any row is outside this set.
    expect([...new Set(reasons)].sort()).toEqual([
      'authoring surface',
      'the Studio authors content, it does not observe runtime requests',
    ])
    expect(reasons.filter((r) => r === 'authoring surface')).toHaveLength(11)
    // And the row that differs is the FIRST one, named rather than counted, so
    // the exception cannot silently move to another row.
    expect(reasons[0]).toBe('the Studio authors content, it does not observe runtime requests')
    // No reason is blank: requiring a field is not requiring its content.
    for (const reason of reasons) expect(reason.trim().length).toBeGreaterThan(10)
  })
})

/* ==================================================================== *
 * GATE 8 — THE PROHIBITIONS COME FROM THE TABLE, NOT FROM THE DIAGRAM.
 *
 * The table holds twelve rows; the diagram draws EIGHT refusal edges. Four
 * prohibitions therefore have no refusal edge — #3, #10, #11 and #12 — and
 * the re-plan named three, missing #12, which the diagram models as three
 * dotted `does not alter` NON-EFFECTS. A non-effect is not a refusal. A build
 * from the diagram ships eight prohibitions and calls them twelve.
 * ==================================================================== */

describe('slice 11 gate 8: twelve prohibitions, eight refusal edges, four without one', () => {
  it('the table is the source of the population', () => {
    expect(AI_PROHIBITIONS).toHaveLength(12)
    expect(AI_PROHIBITIONS.map((p) => p.number)).toEqual([...EVERY_PROHIBITION])
    // Each row carries its own test identifier, so a row is a row of the table
    // rather than a diagram node promoted into one.
    for (const p of AI_PROHIBITIONS) {
      expect(p.testId, `prohibition ${p.number} names no test`).toBe(
        `TEST-AI-016-${p.number}`,
      )
    }
  })

  it('the diagram is short by four, and the four are named', () => {
    // EIGHT, DERIVED FROM THE ROWS THAT CARRY AN EDGE rather than stored. The
    // caption counts the flowchart correctly, which is what makes the shortfall
    // easy to miss, so the count and the caption are checked against each other
    // instead of either being trusted.
    const withEdge = AI_PROHIBITIONS.filter((p) => p.refusalEdge !== null)
    expect(withEdge).toHaveLength(8)
    expect(PROHIBITION_DIAGRAM.caption).toContain('one rule expressed eight ways')
    expect(prohibitionsWithoutRefusalEdge().map((p) => p.number)).toEqual([3, 10, 11, 12])
    // THE FOUR ARE STATED ABSENCES, NOT SILENCES. `diagramAbsence` is non-null
    // exactly where `refusalEdge` is null, in both directions, so a row cannot
    // lose its edge and its account of losing it at the same time.
    for (const p of AI_PROHIBITIONS) {
      expect(p.diagramAbsence === null, `prohibition ${p.number}`).toBe(p.refusalEdge !== null)
      expect(p.refusalEdgeMapping === null, `prohibition ${p.number}`).toBe(p.refusalEdge === null)
    }
    // #12 IS MODELLED, AND NOT AS A REFUSAL. Three dotted `does not alter`
    // edges, which is what makes it the fourth rather than the third — and its
    // own row says so, because the diagram pairs no edge with any row.
    expect(PROHIBITION_DIAGRAM.nonEffectEdges).toHaveLength(3)
    for (const edge of PROHIBITION_DIAGRAM.nonEffectEdges) {
      expect(edge.label).toBe('does not alter')
      expect(flat(sourceLine(lineOf(edge.sourceRef))), `${edge.target} at ${edge.sourceRef}`)
        .toContain(flat(edge.label))
    }
    const twelve = AI_PROHIBITIONS.find((p) => p.number === 12)!
    expect(twelve.prohibition).toContain('failover')
    expect(twelve.diagramAbsence).toContain('A non-effect is not a refusal')
  })
})

/* ==================================================================== *
 * GATE 9 — THE COMPOUND `(chapter, identifier)` FALLBACK KEY.
 *
 * Sixteen `FB-AI-*` literals name more than one contract, so a bare literal
 * does not identify one. And §44A.31's thirteenth row is a RANGE —
 * `FB-AI-01 to FB-AI-30` — which stands for thirty contracts, so a gate keyed
 * on thirteen asserts the wrong cardinality about that register.
 * ==================================================================== */

describe('slice 11 gate 9: the fallback key is compound, and the range is not one contract', () => {
  const fbAi = FALLBACK_CONTRACT_OWNERS.filter((o) => o.identifier.startsWith('FB-AI-'))

  it('sixteen literals have more than one owner, and they are the FB-AI-01 to -16 run', () => {
    expectPopulationFloor(fbAi, 40, 'the FB-AI owner rows')
    const colliding = [...new Set(fbAi.map((o) => o.identifier))]
      .filter((id) => ownersOf(id).length > 1)
      .sort()
    expect(colliding).toEqual(
      Array.from({ length: 16 }, (_, i) => `FB-AI-${String(i + 1).padStart(2, '0')}`),
    )
    // A collision is a collision of CHAPTERS, not of duplicate rows.
    for (const id of colliding) {
      const chapters = ownersOf(id).map((o) => o.chapter)
      expect(new Set(chapters).size, `${id} has duplicate rows rather than several owners`)
        .toBe(chapters.length)
    }
  })

  it('the compound key answers where the bare literal cannot', () => {
    // `FB-AI-01` means four different things, and the key separates them.
    const owners = ownersOf('FB-AI-01')
    expect(owners.length).toBeGreaterThanOrEqual(2)
    for (const owner of owners) {
      expect(ownerAt(owner.chapter, 'FB-AI-01')).toBe(owner)
      expect(fallbackKey(owner.chapter, 'FB-AI-01')).toBe(`${owner.chapter}::FB-AI-01`)
    }
    // Distinct keys for distinct contracts, which is the property that makes
    // the compound key a key at all.
    expect(new Set(owners.map((o) => fallbackKey(o.chapter, o.identifier))).size)
      .toBe(owners.length)
    // And a pair naming no contract answers null rather than the first row.
    expect(ownerAt('no such chapter', 'FB-AI-01')).toBeNull()
  })

  it('the thirteenth §44A.31 row is a range standing for thirty, never for one', () => {
    expect(FALLBACK_IDENTIFIER_RANGES).toHaveLength(1)
    const range = FALLBACK_IDENTIFIER_RANGES[0]!
    expect(range.first).toBe('FB-AI-01')
    expect(range.last).toBe('FB-AI-30')
    expect(expandRange(range)).toHaveLength(30)
    // AND THE THIRTY ARE SEPARATELY OWNED. Expanding is not enough: what
    // makes the row thirty contracts rather than one is that each expanded
    // identifier has its own 44A.N owner, which is exactly what a gate keyed
    // on thirteen would miss.
    for (const [index, id] of expandRange(range).entries()) {
      expect(ownerAt(`44A.${index + 1}`, id), `${id} has no 44A.${index + 1} owner`).not.toBeNull()
    }
    // RED when: the expansion stops expanding. A range whose endpoints are
    // spelled differently must throw rather than invent plausible members.
    expect(() => expandRange({ ...range, last: 'FB-XX-30' })).toThrow()
  })
})

/* ==================================================================== *
 * GATE 10 — THE THIRTY STORYBOARDS, AND ONE VIOLATION THAT MUST STAND.
 *
 * Nineteen fields each, five surface rows each, `AC-44A-001` to `-005`.
 *
 * AND STORYBOARD 25 REPORTS `fixedMessageIsNotParaphrased`, ON PURPOSE. The
 * Spanish rendering of `SCR-FL-LOCK-01`'s fixed message does not exist
 * anywhere in the frozen source, and `TEST-44A-004` (L92757) requires both
 * locales. The only way to silence it is to omit the fixed message, which
 * would silence the one paraphrase prohibition the source states here
 * (L94876). A GATE THAT REQUIRES ALL THIRTY TO BE VIOLATION-FREE IS WRONG,
 * so this one asserts the violation set EXACTLY: the twenty-nine are clean,
 * the twenty-fifth reports that one invariant and no other, and a thirty-first
 * violation anywhere turns this red.
 * ==================================================================== */

const STANDING_VIOLATION = { storyboard: 25, invariant: 'fixedMessageIsNotParaphrased' } as const

describe('slice 11 gate 10: thirty cards, and the one violation that stands', () => {
  it('nineteen fields and five surface rows on every one of the thirty', () => {
    expect(THIRTY_STORYBOARDS).toHaveLength(30)
    expect(STORYBOARD_CARD_FIELDS).toHaveLength(19)
    expect(STORYBOARD_CARD_HEADER_REFS).toHaveLength(30)
    expect(STORYBOARD_SURFACE_TABLE_REFS).toHaveLength(30)
    const fieldIds = STORYBOARD_CARD_FIELDS.map((f) => f.id)
    for (const board of THIRTY_STORYBOARDS) {
      expect(Object.keys(board.content).sort(), `storyboard ${board.number}`).toEqual(
        [...fieldIds].sort(),
      )
      // Requiring a field is not requiring its content, and this build has
      // corrected four claims that a required field made an empty string
      // structurally impossible. It does not; this does.
      for (const id of fieldIds) {
        expect(board.content[id].trim().length, `storyboard ${board.number} field ${id} is blank`)
          .toBeGreaterThan(0)
      }
      expect(Object.keys(board.surfaces), `storyboard ${board.number} surfaces`).toHaveLength(5)
    }
  })

  it('the five chapter criteria are the five the source states', () => {
    expect(STORYBOARD_ACCEPTANCE_CRITERIA.map((c) => c.id)).toEqual([
      'AC-44A-001', 'AC-44A-002', 'AC-44A-003', 'AC-44A-004', 'AC-44A-005',
    ])
    expect(STORYBOARD_ACCEPTANCE_CRITERIA.map((c) => c.sourceRef)).toEqual([
      'L92746', 'L92747', 'L92748', 'L92749', 'L92750',
    ])
    // `AC-44A-004`'s substance, at its own line: the final state must be
    // derivable from the audit log ALONE.
    expect(sourceLine(92_749)).toContain('derivable from the audit log alone')
    // `AC-44A-005`'s substance is an ORDERING, which is why it renders above
    // the field table rather than as a twentieth field.
    expect(sourceLine(92_750)).toContain('before describing behaviour')
  })

  /**
   * A WEAKER CASE USED TO WEAR THIS TITLE. It asserted a non-empty audit
   * trail and a non-blank final-state name and called that `AC-44A-004`,
   * which is "the final official state is derivable from the audit log
   * ALONE". Derivability is enforced — by `finalStateDerivableFromAuditAlone`
   * through the violations case below — so the title was not false about the
   * build, only about this case. What nothing checked is that the invariant
   * enforcing it CAN FIRE: a checker silent on everything passes every
   * absence made with it. So the populations stay, and the predicate is run
   * against a synthesised card in both directions.
   */
  it('AC-44A-004 holds, and its checker convicts a state the audit cannot reconstruct', () => {
    for (const board of THIRTY_STORYBOARDS) {
      expectPopulationFloor(board.audit, 0, `storyboard ${board.number}'s audit trail`)
      expect(board.finalOfficialState.name.trim().length, `storyboard ${board.number}`)
        .toBeGreaterThan(0)
    }
    const clean = THIRTY_STORYBOARDS[0]!
    const violationsOf = (board: Storyboard): readonly string[] =>
      storyboardViolations(board)
        .filter((v) => v.invariant === 'finalStateDerivableFromAuditAlone')
        .map((v) => v.message)

    // Silent on a real card, so it is not convicting everything.
    expect(violationsOf(clean), `storyboard ${clean.number}`).toEqual([])
    // And convicting on each of the three shapes L92749 rules out.
    expect(
      violationsOf({ ...clean, finalOfficialState: { ...clean.finalOfficialState, derivedFrom: [] } })
        .join(' '),
    ).toContain('names no audit event')
    expect(
      violationsOf({
        ...clean,
        finalOfficialState: { ...clean.finalOfficialState, derivedFrom: ['AUD-NOT-IN-THE-LOG'] },
      }).join(' '),
    ).toContain('which the audit log does not hold')
    expect(
      violationsOf({ ...clean, audit: [...clean.audit, clean.audit[0]!] }).join(' '),
    ).toContain('more than one event under')
  })

  it('exactly one violation stands across the thirty, and it is storyboard 25 of one invariant', () => {
    const reported = THIRTY_STORYBOARDS.flatMap((board) =>
      storyboardViolations(board).map((v) => ({ storyboard: board.number, invariant: v.invariant })),
    )
    expect(reported).toEqual([STANDING_VIOLATION])
    // ASSERTED FROM BOTH SIDES, because "exactly one" is the claim and an
    // equality on an array is satisfied by nothing changing anywhere else. The
    // twenty-nine are named clean individually, so a thirtieth going quiet
    // does not hide behind the standing one.
    for (const board of THIRTY_STORYBOARDS) {
      if (board.number === STANDING_VIOLATION.storyboard) continue
      expect(storyboardViolations(board), `storyboard ${board.number}`).toEqual([])
    }
    // AND THE STANDING ONE MUST KEEP STANDING. A card that quietly dropped its
    // fixed message would silence the paraphrase prohibition this violation IS.
    const twentyFive = THIRTY_STORYBOARDS.find((b) => b.number === 25)!
    expectPopulationFloor(twentyFive.facts.fixedMessages, 0, "storyboard 25's fixed messages")
    expect(sourceLine(92_757)).toContain('`TEST-44A-004`')
  })
})

/* ==================================================================== *
 * GATE 11 — THE DERIVED-VERSUS-TRANSCRIBED BOUNDARY.
 *
 * Three surfaces have a source table and are TRANSCRIBED: the Studio (12
 * rows, L90989), the Command Center (13 rows, L91080) and the Frontline (12
 * rows, L91179). The Hub and the Super Admin console have no per-module
 * source table at all and their overlays are DERIVED — §43.3.1's only table is
 * by failure family and §43.3.5's is `Control` by role.
 *
 * The property that keeps that honest is negative: a derived table has NO
 * caption line and NO header line, because no chapter-43 line states a
 * per-module behaviour for either surface. The Hub's derived table once gave
 * L90861 for both, which is required-behaviour PROSE, and the console's gave
 * L91304, which is an acceptance criterion — a basis presented as a caption.
 * ==================================================================== */

describe('slice 11 gate 11: three transcribed, two derived, and no borrowed caption', () => {
  const tables = FIVE_SURFACE_OVERLAYS.flatMap((o) =>
    o.tables.map((t) => ({ surface: o.surfaceId, table: t })),
  )

  it('sweeps five overlays and more tables than surfaces', () => {
    expect(FIVE_SURFACE_OVERLAYS).toHaveLength(5)
    expect(new Set(FIVE_SURFACE_OVERLAYS.map((o) => o.surfaceId)).size).toBe(5)
    expectPopulationFloor(tables, 5, 'the overlay tables')
  })

  it('the surfaces carrying a derived table are exactly the Hub and the console', () => {
    const derived = [...new Set(tables.filter((t) => t.table.kind === 'derived').map((t) => t.surface))]
    expect([...derived].sort()).toEqual(['SURF-DOH', 'SURF-SA'])
    const transcribedOnly = FIVE_SURFACE_OVERLAYS.filter((o) =>
      o.tables.every((t) => t.kind === 'transcribed'),
    ).map((o) => o.surfaceId)
    expect([...transcribedOnly].sort()).toEqual(['SURF-CC', 'SURF-FL', 'SURF-STU'])
  })

  it('a derived table cites no chapter-43 line as its caption or its header', () => {
    const derived = tables.filter((t) => t.table.kind === 'derived')
    expectPopulationFloor(derived, 1, 'the derived tables')
    for (const { surface, table } of derived) {
      expect(table.captionRef, `${surface}'s derived table claims a caption line`).toBeNull()
      expect(table.headerRef, `${surface}'s derived table claims a header line`).toBeNull()
      // The reason is REQUIRED non-null on a derived table, and requiring a
      // field is not requiring its content.
      expect(table.whyDerived, `${surface} gives no reason for deriving`).not.toBeNull()
      expect(table.whyDerived!.trim().length).toBeGreaterThan(40)
    }
  })

  it('a transcribed table names both its caption line and its header line', () => {
    const transcribed = tables.filter((t) => t.table.kind === 'transcribed')
    expectPopulationFloor(transcribed, 3, 'the transcribed tables')
    for (const { surface, table } of transcribed) {
      expect(table.captionRef, `${surface} transcribes a table with no caption line`).not.toBeNull()
      expect(table.headerRef, `${surface} transcribes a table with no header line`).not.toBeNull()
      expect(table.whyDerived, `${surface} transcribes a table and gives a derivation reason`)
        .toBeNull()
      // The header line carries the table's own headings, which is what makes
      // "transcribed" a claim about the source rather than about this build.
      const header = sourceLine(lineOf(table.headerRef!))
      for (const heading of table.headings) {
        expect(flat(header), `${surface}: L${table.headerRef} lacks the heading "${heading}"`)
          .toContain(flat(heading))
      }
      expectPopulationFloor(table.rows, 4, `${surface}'s transcribed rows`)
    }
  })
})

/* ==================================================================== *
 * GATE 12 — EVERY SLICE-11 FILE IS REACHED FROM `app/`, OR IS NAMED HERE.
 *
 * A COMPONENT REACHABLE FROM NOTHING IS NOT SHIPPED, and this slice has
 * already had five committed modules reachable from nothing, none of which
 * stated an abstention. A stated abstention and an oversight look identical
 * from outside, which is why the abstention has to be written down.
 *
 * BOTH ENTRIES ARE CLOSED AND THIS LIST IS EMPTY, WHICH IS THE EXEMPTION DOING
 * WHAT IT WAS BUILT FOR. It named two files and was declared as an EQUALITY
 * rather than a membership precisely so that resolving either one would red it
 * and force this paragraph to be rewritten:
 *
 *   `src/ai/requests/machine.ts` — wave 0 task 5's transition function and the
 *   six rules that bind the state set. Its two siblings were rescued by wave 3
 *   task 15, whose own comment claimed all three; measured, `machine.ts` had
 *   ZERO importers anywhere under `src/` or `app/`, so the twelve states
 *   rendered on `app/hub/execution-summary-review/` and the rules governing
 *   movement between them did not. Now mounted, on that same route and beside
 *   those same states, by `src/ai/requests/StateMachinePanel.tsx`. Rendering the
 *   edges alone would have been a picture, so the six rules render as the
 *   source's own sentences with their own lines, rule 5 is DERIVED from the
 *   edges, and rules 1, 4 and 6 are named on screen as quoted-not-demonstrated
 *   rather than left to be inferred. Covered by
 *   `tests/component/ai-requests-state-machine-panel.test.tsx`.
 *
 *   `src/ai/storyboards/sb-01-to-10/decisions.ts` — wave 4's seven local
 *   decision records, named in a COMMENT by `src/coverage/uninventoried.ts` and
 *   imported by nothing. A comment is not an importer. Now rendered on
 *   `app/workflows/ai-and-its-absence/`, which already discloses per card.
 *   Rendered rather than deleted because most of their readings are read from
 *   lines OUTSIDE section 44A — chapter 21, §36, the offline register, chapter
 *   40 — which no card on that page transcribes, so they are not a second home
 *   for the card text. Covered by
 *   `tests/component/ai-and-its-absence-route.test.tsx`.
 *
 * THE EMPTY LIST STAYS, WITH ITS FLOOR BELOW IT, BECAUSE THE EMPTY LIST IS THE
 * ASSERTION: no file this slice shipped is reached from nothing. Deleting the
 * case would delete the claim. A new orphan reds it, and so would deleting a
 * mount.
 * ==================================================================== */

const KNOWN_UNREACHABLE: readonly string[] = []

/**
 * The two that used to be named, kept as their own case below rather than
 * folded into the sweep: a resolved orphan is the one claim in this gate with a
 * history, and the sweep above would pass if either file vanished from the
 * tree entirely.
 */
const FORMERLY_UNREACHABLE = [
  'src/ai/requests/machine.ts',
  'src/ai/storyboards/sb-01-to-10/decisions.ts',
] as const

describe('slice 11 gate 12: reachability from app/', () => {
  const sources = allSources()
  const known = new Set(sources)

  const reachable = ((): ReadonlySet<string> => {
    const roots = sources.filter((f) => f.startsWith('app/'))
    const seen = new Set(roots)
    const queue = [...roots]
    while (queue.length > 0) {
      for (const next of importsOf(queue.pop()!, known)) {
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    return seen
  })()

  it('the closure is a closure, and it starts from a real route population', () => {
    expectPopulationFloor(sources.filter((f) => f.startsWith('app/')), 100, 'the app/ tree')
    // A closure that resolved nothing would equal its roots and report every
    // src/ file orphaned; one that resolved everything would report none.
    expect(reachable.size).toBeGreaterThan(sources.filter((f) => f.startsWith('app/')).length)
    expect(reachable.size).toBeLessThan(sources.length)
    // And it follows `@/` aliases, which is how almost every edge is written.
    expect(reachable.has('src/ai/provenance/contract.ts')).toBe(true)
  })

  it('every slice-11 file is reached from a route, and the exemption list is empty', () => {
    const orphaned = SLICE_11_FILES.filter((f) => !reachable.has(f)).sort()
    expect(
      orphaned,
      'a slice-11 module no route reaches. It is not shipped, and a stated abstention and an '
        + 'oversight look identical from outside — so either mount it or say in the file why not.',
    ).toEqual([...KNOWN_UNREACHABLE].sort())
    expect(KNOWN_UNREACHABLE, 'the exemption list grew; read the paragraph above it').toEqual([])
  })

  it('and the two that used to be exempt are now graded like the rest', () => {
    // NOT a loop over `KNOWN_UNREACHABLE`, which is empty and would execute
    // zero times — a vacuous case that passes on anything is how an exemption
    // rots into decoration. These two are named, so the day a mount is removed
    // this reds beside the sweep rather than only the sweep noticing.
    for (const file of FORMERLY_UNREACHABLE) {
      expect(known.has(file), `${file} no longer exists`).toBe(true)
      expect(SLICE_11_FILES, `${file} is no longer a slice-11 file`).toContain(file)
      expect(reachable.has(file), `${file} is reached from no route again`).toBe(true)
    }
    // And each is reached through the mount that closed it, so a file made
    // reachable by some unrelated import does not read as this gate's closure.
    expect(importsOf('src/ai/requests/StateMachinePanel.tsx', known))
      .toContain('src/ai/requests/machine.ts')
    expect(importsOf('app/workflows/ai-and-its-absence/AiAndItsAbsenceScreen.tsx', known))
      .toContain('src/ai/storyboards/sb-01-to-10/decisions.ts')
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Every plant below was spliced into a real shipping file, run, and restored
 * against a sha256 captured before the plant; each restoration was asserted
 * BYTE-IDENTICAL rather than assumed. The harness required its anchor to occur
 * exactly once, refused an empty replacement, and treated a ZERO-TEST run as a
 * failure state rather than a green. The message each plant produced is
 * recorded, because "it went red" without the message does not say which
 * assertion fired — and a plant that reds for the wrong reason has proved
 * nothing. Two plants below were defective on their first attempt and both are
 * recorded as such, because that is the more useful half of the record.
 *
 * GATE 1, MEMBERSHIP, PROVED IN BOTH DIRECTIONS.
 *  P1  a seventeenth entry ADDED to AI_MODE_IDS
 *      RED  expected [ 'AIMODE-01', … (15) ] to deeply equal [ … (14) ]
 *           + Received "AIMODE-16"
 *  P2  AIMODE-16 REMOVED from the union, from AI_MODE_IDS and from its matrix row
 *      RED  twice over, which is the whole reason the list is annotated:
 *           run time — Received/Expected differ by "AIMODE-16"; and
 *           tsc — TS2820 at slice-11-gates.test.ts:181, "Type '\"AIMODE-16\"'
 *           is not assignable to type 'AiModeId'"
 *  P3  FAIL-AI-42 refiled into the connectivity family
 *      RED  governance-evaluation-and-gate does not hold exactly the rows its
 *           own title names: expected …(7) to deeply equal …(8)
 *
 * GATE 2, THE LOCATOR AND THE WORDS.
 *  P4  AC-42-303's sourceRef moved from L89402 to a blank line
 *      [cited-in-error: L89412] is that blank line, and it needs the marker
 *      for the same reason RESUME §8's own paragraph about it does:
 *      `locator-fidelity` lexes any L-number in a file as a citation and
 *      refuses one landing on a blank line, so recording the plant trips the
 *      gate the plant exists to complement.
 *      RED  AC-42-303 claims that line carries "`AIMODE-13` and `AIMODE-14`
 *           are distinguishable from …"
 *      This is the case `locator-fidelity`'s strict anchor check does NOT
 *      grade in these files: they write the identifier as one data field and
 *      the locator as another, so its six-character adjacency never fires.
 *
 * GATE 3, THE PAUSE BASIS.
 *  P5  FAIL-AI-41's tenant-web cell copied onto FAIL-AI-42, collapsing the one
 *      measured difference between a platform pause and a tenant pause
 *      RED  expected '"Agents paused by the platform. Deter…' not to be
 *           '"Agents paused by the platform. Deter…'
 *
 * GATE 4, THE ABSOLUTE RULE, IN THE EXPORT.
 *  P6  a span carrying PROV-1's marker text spliced INSIDE a PROV-3 element of
 *      out/workflows/ai-and-its-absence/index.html
 *      RED  out/workflows/ai-and-its-absence/index.html: a PROV-3 element is
 *           labelled "Live artificial intelligence"
 *      Restored byte-identically, sha256 compared before and after.
 *
 * GATE 5, THE NESTED PAIR IN THE BYTES THAT SHIPPED.
 *  P7  a second mark spliced INSIDE an existing mark of a real exported page,
 *      by the case that runs on every run
 *      RED  when the splice is removed the same case reports "the plant
 *           produced no violation at all", which is what proves the plant is
 *           load-bearing rather than decorative
 *      A SIBLING plant was also written, watched go red against a closure of
 *      the sibling gap, and then BOTH were reverted: the closure convicted
 *      `tests/component/provenance-mark.test.tsx:306`, whose four-class region
 *      is §42.4's own illustrative example. See the paragraph at the head of
 *      gate 5. The gap stays open, asserted as a limit, and
 *      `src/ai/provenance/contract.ts` is byte-unchanged.
 *
 * GATE 6, THE SEVERITY SEPARATION — AND A DEFECTIVE PLANT.
 *  P8a `const _plantedSeverityBands = 1` added to AiIncidentConsoleScreen.tsx
 *      GREEN, and the GATE WAS RIGHT. `\bseverityBands\b` is case-sensitive and
 *      `_plantedSeverityBands` does not contain it. The plant was defective,
 *      not the gate, and it is recorded because a green here read as a passing
 *      plant would have banked a proof nobody had.
 *  P8b `{ severityBands: [] as readonly string[] }` added to the same file
 *      RED  no component names both vocabularies: + Received
 *           "app/super-admin/ai-incidents/AiIncidentConsoleScreen.tsx"
 *
 * GATE 7, THE STUDIO COLUMN.
 *  P9  an invented third Studio reason on the `answer available` row
 *      RED  expected [ 'authoring surface', …(2) ] to deeply equal
 *           [ 'authoring surface', …(1) ]
 *           + Received "the Studio has no view of this state"
 *
 * GATE 8, THE DIAGRAM'S SHORTFALL.
 * P10  prohibition #12 given a refusal edge, as a build from the diagram would
 *      RED  expected [ … ] to have a length of 8 but got 9
 *
 * GATE 9, THE RANGE THAT STANDS FOR THIRTY.
 * P11  the 44A.17 owner row deleted, leaving the range standing for 29
 *      RED  FB-AI-17 has no 44A.17 owner: expected null not to be null
 *
 * GATE 10, THE THIRTY CARDS — AND A SECOND DEFECTIVE PLANT.
 * P12a storyboard 25's `fixedMessages` array opened and not closed
 *      RED, BUT FOR THE WRONG REASON: a ZERO-TEST run, which the harness
 *      reports as a failure state rather than as a pass. Re-planted.
 * P12b storyboard 25's `fixedMessages` emptied to `[]` — the only way to
 *      silence its standing violation
 *      RED  expected [] to deeply equal [ { storyboard: 25, …(1) } ]
 *      Nine cards report none and the tenth must keep reporting one; a gate
 *      requiring all thirty to be violation-free would be wrong, and this is
 *      the plant that says so.
 * P13  storyboard 11's `trigger` blanked to ''
 *      RED  storyboard 11 field trigger is blank: expected 0 to be greater
 *           than 0
 *      Requiring a field is not requiring its content, and four claims of
 *      structural impossibility in this slice said otherwise.
 *
 * GATE 11, DERIVED VERSUS TRANSCRIBED.
 * P14  the console's derived table given captionRef 'L91304' — the acceptance
 *      criterion that is its derivation's BASIS, presented as its caption
 *      RED  three ways, which is the point: gate 2's caption population moved
 *           from 4 to 5; gate 2's verbatim check reported "SURF-SA table
 *           caption"; and gate 11 reported "SURF-SA's derived table claims a
 *           caption line".
 *
 * GATE 12, REACHABILITY.
 * P15  an orphan module added under src/ai, importing nothing and imported by
 *      nothing — the ADDING direction
 *      RED  a slice-11 module no route reaches …
 *           + Received "src/ai/zz-plant-orphan.ts"
 *
 * GATE 12 AGAIN, AFTER BOTH EXEMPTIONS WERE RESOLVED AND THE LIST EMPTIED.
 * P16  the `StateMachinePanel` IMPORT EDGE removed from
 *      `app/hub/execution-summary-review/page.tsx`, which is what un-mounting
 *      actually looks like to an import closure
 *      RED  twice, and both are the right red:
 *           'expected [ …(2) ] to deeply equal []' on the sweep — TWO files,
 *           because the panel and the machine orphan together; and
 *           'src/ai/requests/machine.ts is reached from no route again:
 *           expected false to be true' on the formerly-exempt case.
 * P17  a WIDENED exemption: `KNOWN_UNREACHABLE` given back the two entries AND
 *      the import edge removed, so the sweep's own equality is satisfied and
 *      only the emptiness assertion can convict. This is the shape the empty
 *      list exists to catch.
 *      RED  'the exemption list grew; read the paragraph above it: expected
 *           [ 'src/ai/requests/machine.ts', …(1) ] to deeply equal []'
 *
 * AND ONE PLANT WAS DEFECTIVE, WHICH IS THE MORE USEFUL HALF OF THE RECORD.
 * P18  the `<StateMachinePanel …/>` JSX removed from the route while the import
 *      was LEFT IN PLACE — the panel off the page, the edge still there.
 *      GREEN, 54/54. This gate walks the IMPORT closure, so an import edge is
 *      not a mount and this gate cannot tell the difference. The limit is
 *      reported rather than papered over: what closes it is a bytes-level
 *      assertion in the mounting route's own suite, and
 *      `tests/component/ai-requests-state-machine-panel.test.tsx` now carries
 *      one ('is MOUNTED on the Hub route, not merely imported by it'), which
 *      the same plant reds. The sibling overlay suite already asserted its own
 *      mount that way; this gate's closure is unchanged.
 *
 * GATE 6 AGAIN — THE `.tsx`-ONLY LIMIT, ONCE IT WAS A LIVE EXPECTATION.
 * P19  `'ToastProps'` added to `MANUFACTURING_SEVERITY_SYMBOLS` in
 *      `tests/coverage/absence-sweep.ts`, which puts exactly ONE file in the
 *      manufacturing world — `src/ui/primitives/Toast.tsx`, the identifier
 *      occurs nowhere else in `src/`+`app/` (measured) — and that file is
 *      re-exported by `src/ui/primitives/index.ts`. This is the defect the
 *      limit describes, planted rather than described: a component reachable
 *      only through a `.ts` barrel.
 *      RED  1 failed | 60 passed, and the ONE failure is the new case:
 *           'src/ui/primitives/index.ts re-exports the severity component
 *           src/ui/primitives/Toast.tsx, which no closure this gate builds can
 *           reach'
 *      THE 60 GREENS ARE THE PROOF, not the red. Every other case in gate 6 —
 *      including 'and no component in either world mounts one from the other',
 *      the one this defect belongs to — walked past it. Before this case the
 *      whole file was green on a shared rendering.
 *      A FIRST PLANT WAS DISCARDED as insufficiently isolated rather than
 *      wrong: `'StatusPillProps'` reds the same case AND the mounts-one-from-
 *      the-other case, because `AiIncidentConsoleScreen.tsx` imports
 *      `StatusPill.tsx` DIRECTLY as well — a `.tsx` edge the closure does
 *      follow. It proves the gate works; it does not isolate the barrel hole.
 *      Toast is reached from no operational component by any `.tsx` path
 *      (measured over every operational closure), so only the barrel edge can
 *      convict it.
 *      Restored byte-identically, sha256 compared before and after.
 * P20  `IMPORT_FROM` narrowed back to its pre-fix form — the single-quote-only
 *      specifier class AND the line-bounded body, both of which this file has
 *      shipped.
 *      RED  3 failed | 58 passed. The intended one is the matcher case:
 *           'its specifier matcher reads both quote styles and a multi-line
 *           import: expected [] to deeply equal [ "@/a" ]'. Gate 12 reds
 *           alongside it with ten orphans, which is the fail-SAFE direction
 *           the `importsOf` paragraph describes — a narrowed matcher makes
 *           files look unreachable there, while for gate 6 it would have gone
 *           green. Both reds are correct; the matcher case is the one that
 *           says WHY.
 *      This case replaces a measured specifier COUNT that sat in `importsOf`'s
 *      comment as evidence for the same property and was three low (2,877
 *      written, 2,880 measured) when it was audited. A count restated as
 *      evidence drifts; the property does not.
 *
 * WHAT IS NOT PLANTED, STATED RATHER THAN LEFT. Gate 1's five other membership
 * lists, gate 11's transcribed-header comparison and gate 12's closure-sanity
 * case rest on predicates the plants above exercised — the same `toEqual` over
 * a literal list, the same `flat`-normalised `includes`, the same import
 * resolver. Each also carries a floor or a both-directions case in the same
 * `it`, so none of them can pass over an empty set.
 * ==================================================================== */

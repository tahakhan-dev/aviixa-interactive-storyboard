import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  describeClosedVocabularyAnnotations,
  describeFrozenSourcePin,
  expectPopulationFloor,
  sourceLine as line,
  sweptSources,
} from './absence-sweep'

import { OPEN_DECISIONS, OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { CC_LOCAL_DISCLOSURES } from '@/surfaces/cc/decisions/disclosure'
import { CC_MODULE_SPINE, CC_CLAIMED_SLUGS } from '@/surfaces/cc/modules'
import { CC_SCREENS } from '@/surfaces/cc/screens'
import { CC_FALLBACK_PATTERN_IDS } from '@/surfaces/cc/fallback/patterns'
import { CC_SESSION_STATES } from '@/surfaces/cc/fallback/session'
import { CONNECTIVITY_MODES } from '@/scenario/controls'

/* ==================================================================== *
 * SLICE 9 ABSENCE SWEEP — what this surface must NOT hold.
 *
 * AN ABSENCE CLAIM IS THE SHAPE MOST AT RISK OF BEING SATISFIED BY FINDING
 * NOTHING. Every population swept below is asserted non-empty, and at or
 * above a measured floor, BEFORE the absence is checked; and every sweep is
 * derived from a directory walk or from a shipped constant rather than from
 * a literal file list, so a file added later is covered without an edit here.
 *
 * The five absences, and why each one is load-bearing:
 *
 *  1. NO LOCAL DISCLOSURE'S IDENTIFIER IS IN THE SHARED CANON. This surface
 *     follows the local-disclosure idiom because the canon carries almost
 *     none of its decisions. The gate is what turns a later lift into a red
 *     suite rather than into two spellings of one decision. The one
 *     identifier that IS in the canon declares that it is, in the record
 *     that points at it — so the exception is a statement, not a silence.
 *  2. NO DECISION THE SOURCE LEAVES OPEN IS ADOPTED HERE. Adoption is a
 *     separate arm of the position type carrying the frozen-source line that
 *     adopts it; an open position has no slot for one at all.
 *  3. NO FOURTEENTH ROUTE, AND NO `sign-in` DIRECTORY ON THIS SURFACE. The
 *     slug the spine offers that screen is the one name a Command Center
 *     directory may never take, because two other surfaces already carry it
 *     and the generator matches a claimed slug on the BASENAME across every
 *     surface.
 *  4. NO VOCABULARY HAS GROWN A MEMBER. A tenth fallback pattern, a
 *     fourteenth screen, a seventh connectivity mode, a third session state.
 *     A frozen viewer session is deliberately NOT a seventh connectivity
 *     mode and this is what stops it drifting into one.
 *  5. NO ANSWER IS FABRICATED WHERE THE SOURCE DECLINES ONE.
 * ==================================================================== */

/**
 * THE PREAMBLE IS SHARED NOW, and this file is one of the three copies it was
 * hoisted out of. `./absence-sweep` carries the frozen-source pin, the
 * probe-aware walk, the population floor and the widening-annotation check;
 * what stays here is this surface's own ROOTS and its own FLOORS, which are
 * measurements of the Command Center and belong to nobody else.
 */
const ROOT = process.cwd()

const sourcesUnder = sweptSources

const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8')

/** Every `.ts`/`.tsx` file this surface owns, route files included. */
const SURFACE_FILES: readonly string[] = [
  ...sourcesUnder('src/surfaces/cc'),
  ...sourcesUnder('app/command-center'),
]

describeFrozenSourcePin('slice 9')

describe('slice 9 absence sweep: the populations swept, before anything is claimed absent', () => {
  it('sweeps a real surface, not an empty one', () => {
    // FLOORS, not existence checks. An absence claim over a population that
    // silently shrank to nothing reports safety it does not provide.
    expectPopulationFloor(SURFACE_FILES, 75, 'the Command Center surface')
    expectPopulationFloor(sourcesUnder('src/surfaces/cc/modules'), 40, 'the module directories')
    expectPopulationFloor(sourcesUnder('app/command-center'), 11, 'the route directories')
    expect(CC_MODULE_SPINE).toHaveLength(13)
    expect(CC_SCREENS).toHaveLength(13)
    // A FLOOR, like everything else in this test, and it was the one exact
    // count among them. `toHaveLength(29)` is a stored copy of a derived answer
    // — this sweep's stake in the canon is only that it is not empty, because
    // an absence claim over an empty canon reports safety it does not provide.
    // Slice 10 registered fourteen records and turned an exact copy red; a
    // floor never needs editing when the canon grows.
    expect(OPEN_DECISIONS.length).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * 1. NO LOCAL DISCLOSURE'S IDENTIFIER IS IN THE SHARED CANON.
 * ==================================================================== */

/** Every decision identifier any file on this surface declares a record for. */
function declaredDecisionRefs(): readonly string[] {
  const refs = new Set<string>()
  for (const f of SURFACE_FILES) {
    for (const m of read(f).matchAll(/^\s*decisionRef: '([A-Z0-9-]+)',?$/gm)) refs.add(m[1]!)
  }
  return [...refs].sort()
}

/** The canon's own identifiers, by both spellings it uses. */
function canonIdentifiers(): ReadonlySet<string> {
  const ids = new Set<string>()
  for (const d of OPEN_DECISIONS) {
    ids.add(d.id)
    if (d.decisionRef !== null) ids.add(d.decisionRef)
  }
  return ids
}

describe('slice 9 absence sweep: local disclosures are absent from the shared canon', () => {
  it('every identifier this surface discloses locally is ABSENT from the canon', () => {
    const declared = declaredDecisionRefs()
    // The floor first: a sweep that found no records would pass trivially.
    expect(declared.length).toBeGreaterThanOrEqual(12)
    const canon = canonIdentifiers()
    expect(canon.size).toBeGreaterThanOrEqual(29)

    const inCanon = declared.filter((id) => canon.has(id))
    // ONE EXCEPTION, AND IT DECLARES ITSELF. `DEC-LANEB-001` is in the canon,
    // so this surface POINTS at it rather than minting a second spelling —
    // and its record says so in a field, not in a comment. Asserted in both
    // directions: a second lifted identifier goes red, and so does this one
    // losing its declaration.
    expect(inCanon).toEqual(['DEC-LANEB-001'])
    const declaringFiles = SURFACE_FILES.filter((f) => /^\s*inSharedCanon: true,?$/m.test(read(f)))
    expect(declaringFiles).toHaveLength(1)
    const declaring = read(declaringFiles[0]!)
    expect(declaring).toMatch(/^\s*decisionRef: 'DEC-LANEB-001',$/m)
    expect(OPEN_DECISION_IDS).toContain('DEC-LANEB-001')

    // And every OTHER identifier is absent, which is the claim that turns a
    // later lift into a red suite rather than into two spellings.
    for (const id of declared) {
      if (id === 'DEC-LANEB-001') continue
      expect(canon.has(id), `${id} has been lifted into the canon and is still disclosed locally`)
        .toBe(false)
    }
  })

  it('the surface never re-spells a canon record under its own name', () => {
    // A local file may NAME a canon identifier to point at it. What it may
    // not do is declare a second record for one. The distinction is the
    // `decisionRef:` FIELD, which is a declaration, against a mention.
    const canon = canonIdentifiers()
    const registerIds = new Set(
      [...read('src/surfaces/cc/decisions/register.ts').matchAll(/^\s*id: '([A-Z0-9-]+)',$/gm)].map(
        (m) => m[1]!,
      ),
    )
    expect(registerIds.size).toBe(18)
    // TWO of the eighteen are also in the canon, and that is correct rather
    // than a re-spelling: this register TRANSCRIBES the chapter's own
    // register of decisions raised elsewhere, so an identifier the canon
    // holds appears here as a row about the chapter, not as a second record
    // of the decision. What would be a re-spelling is a LOCAL DISCLOSURE of
    // one, which the assertion above forbids.
    expect([...registerIds].filter((id) => canon.has(id)).sort()).toEqual([
      'DEC-LANEB-001',
      'DEC-ROLE-001',
    ])
  })
})

/* ==================================================================== *
 * 2. NO DECISION THE SOURCE LEAVES OPEN IS ADOPTED HERE.
 * ==================================================================== */

describe('slice 9 absence sweep: no open decision is adopted on this surface', () => {
  it('every local disclosure is open, or names the frozen-source line that adopts it', () => {
    expect(CC_LOCAL_DISCLOSURES.length).toBeGreaterThanOrEqual(4)
    for (const d of CC_LOCAL_DISCLOSURES) {
      expect(d.position.readings, `${d.decisionRef} carries a number of readings other than two`)
        .toHaveLength(2)
      expect(d.canonNote.length, `${d.decisionRef} gives no reason for disclosing locally`)
        .toBeGreaterThan(40)
      if (d.position.kind === 'adopted-in-source') {
        // An adoption must be READABLE at the line it names. A record that
        // merely asserts one is the defect this arm exists to prevent.
        // Markdown emphasis is dropped from both sides: the source bolds
        // three fragments inside that sentence and the record carries the
        // words. A typographic difference, not a claim.
        const plain = (s: string): string => s.replace(/\*\*/g, '')
        expect(plain(line(d.position.adoptedLine))).toContain(plain(d.position.adoptedText))
      } else {
        expect(d.position.kind).toBe('open')
      }
    }
    // NON-VACUITY: the open arm has no slot for an adoption at all, so the
    // check above cannot be satisfied by a record quietly adopting under a
    // different field name. Read off the type declaration itself.
    const positionType = read('src/surfaces/cc/decisions/disclosure.ts')
    expect(positionType).toMatch(/kind: 'open'/)
    expect(positionType).toMatch(/readonly adoptedLine: number/)
    const openArm = positionType.slice(
      positionType.indexOf("kind: 'open'"),
      positionType.indexOf("kind: 'adopted-in-source'"),
    )
    expect(openArm).not.toContain('adopted')
  })

  it('no file on this surface asserts that it settled something', () => {
    // A SETTLEMENT WORD SET TO `true` IS A CLAIM BY THIS BUILD. A settlement
    // word carrying a STRING is a transcription of a settlement the SOURCE
    // made, and it brings the source's own words with it — this surface has
    // two, one naming what the open item settles and one naming the
    // criterion that reconciles a seam. Convicting those would forbid
    // transcribing what the source settled, which is the opposite of the
    // rule. So the predicate tests the boolean, and the message says so.
    const settling =
      /^[ \t]*(?:readonly[ \t]+)?(?:settled|adjudicated|reconciled|decided|resolved)[A-Za-z]*[ \t]*\??:[ \t]*true\b/m
    const offenders = SURFACE_FILES.filter((f) => settling.test(read(f)))
    expect(
      offenders,
      'these files assert a settlement as a boolean of this build rather than transcribing one ' +
        "the source made; a settlement word carrying a string is exempt because it brings the " +
        "source's own words with it",
    ).toEqual([])
    // NON-VACUITY, on this run: it fires on the boolean and is silent on
    // both real transcriptions, read off the files that carry them.
    expect(settling.test('  readonly settledBy: true')).toBe(true)
    expect(settling.test("  settled: 'the number, five, and the home, this surface',")).toBe(false)
    expect(read('src/surfaces/cc/modules/cc-11/report-sets.ts')).toMatch(/^ {2}settled: '/m)
    expect(read('src/surfaces/cc/seams/source-of-truth.ts')).toMatch(/^ {2}reconciledBy: '/m)
  })
})

/* ==================================================================== *
 * 3. NO FOURTEENTH ROUTE, AND NO `sign-in` DIRECTORY.
 * ==================================================================== */

describe('slice 9 absence sweep: the routes this surface does not author', () => {
  it('no Command Center route directory is named sign-in, on either spelling', () => {
    // `ccScreenSlug` returns `sign-in` for that screen and it is the one name
    // a directory here may never take: the generator matches a claimed slug
    // on the route-directory BASENAME across every surface, and two already
    // carry it. So the slug the spine offers IS the forbidden name, and
    // every other name is refused from the other side by the reach script.
    expect(existsSync(join(ROOT, 'app/command-center/sign-in'))).toBe(false)
    expect(existsSync(join(ROOT, 'app/frontline/sign-in'))).toBe(true)
    expect(existsSync(join(ROOT, 'app/studio/sign-in'))).toBe(true)
    expect(CC_CLAIMED_SLUGS).not.toContain('sign-in')
    const signIn = CC_SCREENS.find((s) => s.id === 'SCR-CC-01')!
    expect(signIn.owningModule).toBeNull()
    expect(signIn.unownedSlug).toBe('sign-in')
    // The abstention is declared, and nothing imports the screen it would
    // have rendered — so the day an importer appears, this goes red.
    const importers = [...sourcesUnder('src'), ...sourcesUnder('app')].filter(
      (f) =>
        f !== 'src/surfaces/cc/sign-in/SignInScreen.tsx' &&
        /surfaces\/cc\/sign-in\/SignInScreen/.test(read(f)),
    )
    expect(importers).toEqual([])
  })

  it('no directory under app/command-center is claimed by a module the register does not seat', () => {
    const dirs = readdirSync(join(ROOT, 'app/command-center'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
      .sort()
    expect(dirs.length).toBeGreaterThan(0)
    // Every directory is either a slug a module claims, or the one unowned
    // screen the register seats and no module owns. A fourteenth is neither.
    const unownedSlugs: readonly string[] = CC_SCREENS.map((s) => s.unownedSlug).filter(
      (s) => s !== null,
    )
    for (const d of dirs) {
      expect(
        CC_CLAIMED_SLUGS.includes(d) || unownedSlugs.includes(d),
        `app/command-center/${d} is claimed by no module and seats no register row`,
      ).toBe(true)
    }
    // And `MOD-CC-13` has no directory of any kind: no slug to name one with.
    expect(CC_MODULE_SPINE.find((m) => m.id === 'MOD-CC-13')!.slug).toBeNull()
    expect(dirs).not.toContain('operational-actions')
    expect(dirs).not.toContain('action-rail')
  })
})

/* ==================================================================== *
 * 4. NO VOCABULARY HAS GROWN A MEMBER.
 * ==================================================================== */

describe('slice 9 absence sweep: the closed vocabularies are still closed', () => {
  it('nine fallback patterns, thirteen screens, six connectivity modes, two session states', () => {
    expect(CC_FALLBACK_PATTERN_IDS).toHaveLength(9)
    expect(CC_SCREENS).toHaveLength(13)
    // A FROZEN VIEWER SESSION IS NOT A SEVENTH CONNECTIVITY MODE. That mode
    // set is about a device holding captures it will sync later; this surface
    // holds nothing and has no device. The pin is what forces a later slice
    // wanting the mode to reconcile rather than drift into a second spelling.
    expect(CONNECTIVITY_MODES).toHaveLength(6)
    expect([...CONNECTIVITY_MODES]).toEqual([
      'online',
      'slow',
      'flapping',
      'offline',
      'dependency-down',
      'recovering',
    ])
    expect([...CC_SESSION_STATES]).toEqual(['live', 'frozen'])
  })
})

// Obligation 3, from the shared preamble. It used to be a private copy here,
// scoped to this surface — which is why commit `018b390`'s slice-11 defect was
// caught by this file's author rather than by a gate that covered slice 11.
describeClosedVocabularyAnnotations('slice 9 absence sweep', SURFACE_FILES, 40)

/* ==================================================================== *
 * 5. NO ANSWER IS FABRICATED WHERE THE SOURCE DECLINES ONE.
 * ==================================================================== */

describe('slice 9 absence sweep: no fabricated answer stands where the source declines one', () => {
  it('no numeric cap value is bound anywhere on this surface', () => {
    // The panel's cap is an open decision raised twice under two identifiers
    // with different scopes, different owners and recommendations that do not
    // agree. The storyboard's illustrative figure is not a value.
    //
    // THIS GATE COULD NOT FAIL IN ITS FIRST FORM AND THE PLANT IS WHAT SAID
    // SO. It matched `\b(?:cap|CAP)\w*` against a binding named
    // CC10_CAP_VALUE — where the underscore before CAP is a word character,
    // so there is no boundary there and the pattern never fired. It also
    // asked only about the literal 50, which would have let any OTHER
    // invented cap through. Both are fixed: no word boundary, and any
    // numeric value at all. `captur` is excluded by name because a capture
    // count is a different quantity that legitimately holds a number.
    const binding = /\b([A-Za-z_][A-Za-z0-9_]*)[ \t]*[:=][ \t]*(\d+)\b/g
    const offenders: string[] = []
    for (const f of SURFACE_FILES) {
      for (const m of read(f).matchAll(binding)) {
        if (/cap/i.test(m[1]!) && !/captur/i.test(m[1]!)) offenders.push(`${f}: ${m[0]}`)
      }
    }
    expect(
      offenders,
      'a cap on this surface is an open decision with two identifiers and two recommendations ' +
        "that do not agree; the storyboard's figure is an illustration and not a value",
    ).toEqual([])

    // NON-VACUITY, ON THIS RUN: the predicate fires on the shape the plant
    // used and on any other invented value, and is silent on a capture count.
    const fires = (text: string): boolean =>
      [...text.matchAll(binding)].some((m) => /cap/i.test(m[1]!) && !/captur/i.test(m[1]!))
    expect(fires('export const CC10_CAP_VALUE = 50')).toBe(true)
    expect(fires('  readonly capLimit: 200')).toBe(true)
    expect(fires('    pendingCaptures: 0,')).toBe(false)
    // And the two identifiers this absence is about are disclosed here, so
    // the subject is present in the tree rather than absent along with it.
    expect(declaredDecisionRefs()).toContain('DEC-CONFLICTCAP-001')
    // The panel's own record quotes the storyboard figure INSIDE prose,
    // which is a quotation and not a binding — the distinction the
    // predicate above turns on.
    expect(read('src/surfaces/cc/modules/cc-10/service.ts')).toContain(
      'Showing the 50 most recent',
    )
  })

  it('no count is computed for the question the source cannot separate', () => {
    // A count of items awaiting another actor's authority cannot be
    // separated from one raised to oneself, because the same role appears on
    // both sides of the release row. A fabricated number on a client screen
    // is worse than a named gap, so no such field exists.
    const fabricated = /^[ \t]*(?:readonly[ \t]+)?awaiting[A-Za-z]*(?:Count|Total)[ \t]*\??:/m
    const offenders = SURFACE_FILES.filter((f) => fabricated.test(read(f)))
    expect(offenders).toEqual([])
    expect(fabricated.test('  readonly awaitingQualityManagerCount: number')).toBe(true)
  })

  it('an unknown pending-capture count is untypeable as a number', () => {
    // THE RULE IS ABOUT THE TYPE, NOT ABOUT THE VALUE, and the first draft of
    // this test got that backwards: it forbade the literal zero and convicted
    // two rows that legitimately have none waiting. A zero is only a lie when
    // the count is UNKNOWN, and what makes that expressible is the union.
    // Typing the field a bare `number` is what forces a model to write zero
    // for something it cannot know.
    const markerFiles = SURFACE_FILES.filter((f) => /pendingCaptures/.test(read(f)))
    expect(markerFiles.length).toBeGreaterThan(1)
    const declarations = markerFiles.flatMap((f) =>
      [...read(f).matchAll(/^[ \t]*(?:readonly[ \t]+)?pendingCaptures[ \t]*\??:[ \t]*(.+?),?$/gm)].map(
        (m) => `${f}: ${m[1]!.trim()}`,
      ),
    )
    expect(declarations.length).toBeGreaterThan(0)
    for (const d of declarations) {
      expect(d, 'a pending-capture count typed a bare number cannot say it is unknown').not.toMatch(
        /: number$/,
      )
    }
    // And the union it must be typed as admits the unknown, read off the
    // model rather than restated here.
    expect(read('src/surfaces/cc/live/model.ts')).toMatch(
      /^export type CcPendingCaptures = number \| 'unknown'$/m,
    )
    // At least one shipped row actually carries the unknown, so the union has
    // a live inhabitant rather than only a declared one.
    expect(
      markerFiles.some((f) => /pendingCaptures: 'unknown'/.test(read(f))),
      'nothing in this surface ever renders an unknown pending-capture count',
    ).toBe(true)
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Same harness discipline as the gates file: one baseline before the first
 * plant, an anchor required exactly once, no empty replacement, splice and
 * reverse by recorded offset, baseline re-checked per step, vitest through an
 * args array, and a zero-test run treated as a failure.
 *
 *   A1  a locally disclosed identifier lifted into the shared canon
 *       RED  expected [ 'DEC-ARCH-001', 'DEC-LANEB-001' ] to equal [ 'DEC-LANEB-001' ]
 *   A2  a settlement asserted as a boolean of this build
 *       RED  these files assert a settlement as a boolean of this build …
 *   A3  the abstaining sign-in screen given an importer
 *       RED  expected [ 'src/surfaces/cc/shell/CommandCenterShell.tsx' ] to equal []
 *   A4  a route directory left claimed by no module
 *       RED  app/command-center/agent-activity-panel is claimed by no module
 *   A5  a seventh connectivity mode added for the frozen session
 *       RED  expected 7 to have a length of 6
 *   A6  a closed vocabulary given a leading readonly annotation
 *       RED  expected [ 'src/surfaces/cc/fallback/patterns.ts: …' ] to equal []
 *   A7  A GATE THAT COULD NOT FAIL, FOUND BY PLANTING AND FIXED HERE. The
 *       first form asked `\b(?:cap|CAP)\w*\s*[:=]\s*50` and the plant bound
 *       `CC10_CAP_VALUE = 50` — the underscore before CAP is a word
 *       character, so `\b` never matched and the plant came back GREEN. It
 *       also asked only about the literal 50, so any other invented cap would
 *       have passed. Both fixed; re-planted twice:
 *       RED  CC10_CAP_VALUE = 50
 *       RED  CC10_CONFLICT_CAP = 200
 *   A8  a count fabricated for the question the source cannot separate
 *       RED  expected [ 'src/surfaces/cc/modules/cc-05/queue.ts' ] to equal []
 *   A9  the pending-capture count typed so it cannot say unknown
 *       RED  expected the model to match the union declaration
 * ==================================================================== */

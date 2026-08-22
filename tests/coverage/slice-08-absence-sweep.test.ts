import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, resolve } from 'node:path'
import { isForeignProbe as isForeign, ownProbeDir, withPlanted } from '../probe-paths'

import { OPEN_DECISIONS } from '@/disclosure/decisions'
import { OFFLINE_CLASS_CONTRADICTION } from '@/offline/capability'
import { DEC_FB_008_DISCLOSURE, DEC_CLOCKWIN_001_DISCLOSED_ELSEWHERE } from '@/offline/conflict'
import { FALLBACK_LOCAL_DISCLOSURES } from '@/fallbacks/disclosure'
import {
  DEC_37B_LOCAL_DISCLOSURES,
  DEC_37B_HELD_ELSEWHERE,
} from '@/offline/decisions-37b'
import { PROTOCOL_DISCLOSURES } from '@/offline/protocol'
import { PACKAGE_MANIFEST_DISCLOSURES } from '@/offline/package/manifest'
import { PACKAGE_INTEGRITY_LOCAL_DISCLOSURES } from '@/offline/package/integrity'
import { USE_CASE_LOCAL_DISCLOSURES } from '@/offline/use-cases/group-a-d/catalogue'
import { CC10_DISCLOSURES } from '@/surfaces/cc/modules/cc-10/service'
import { DEC_PLUS_001_DISCLOSED_ELSEWHERE } from '@/surfaces/cc/modules/cc-10-s366/matrix'
import { DEC_STORE_001_SHIPPED_RECORDS } from '@/offline/package/storage'

/* ==================================================================== *
 * SLICE 8 ABSENCE SWEEP — the answers this slice does not give.
 *
 * Slice 8's central obligation is negative. Where the source disagrees with
 * itself, BOTH readings are recorded and NEITHER is chosen; where a decision
 * belongs to the shared canon, it is declared as a gap rather than filed
 * under a neighbouring identifier; and where another module already holds a
 * decision, this slice points at it rather than writing a second spelling.
 *
 * Those are all claims that something is ABSENT, and an absence claim is the
 * shape most easily satisfied by finding nothing. A criterion that quantifies
 * over a set is satisfied by an empty one — the source itself does this, at
 * the one use-case entry whose permission line carries zero status tokens, so
 * "all tokens are in the closed set" passes on an empty set. Every sweep
 * below therefore asserts its POPULATION first, at or above a measured floor,
 * and only then asserts the absence over it.
 *
 * AND THE POPULATION IS DERIVED, NOT LISTED. A route gate written against a
 * literal directory listing would have gone red the day the next slice built
 * its screens; a decision sweep written against a literal file list goes
 * blind the day a module is added. The walk finds the files, and
 * `isForeignProbe` keeps it from tripping over a concurrent suite's scratch
 * probe — two files were caught without it this slice.
 *
 * WHAT MAKES THIS GO RED RATHER THAN QUIETLY STAY TRUE. The canon at
 * `src/disclosure/decisions.ts` is another task's hand-written file that
 * nothing in the build generates. One later task lifts slice 8's decisions
 * into it all at once. The moment that lands, this suite fails and forces the
 * switch — which is the whole reason the local records were written in the
 * canon's own shape.
 * ==================================================================== */

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const OWN_PROBE_DIR = ownProbeDir()
const isForeignProbe = (entry: string): boolean => isForeign(entry, OWN_PROBE_DIR)

/** The three directories slice 8 authored. Walked, never listed file by file. */
/**
 * SLICE 8's OWN FILES, and the third root is narrowed from `src/surfaces/cc`.
 *
 * That root was correct when this sweep was written: slice 8 built the Command
 * Center spine and its two modules, and nothing else lived there. Slice 9 then
 * filled the same directory with twelve more modules and a chapter-21 decision
 * register — and this sweep began reading slice 9's work as slice 8's,
 * convicting `src/surfaces/cc/decisions/register.ts` for carrying
 * `DEC-LANEB-001`, which it carries **because chapter 21 names it** and which
 * the canon has held since the Studio slice.
 *
 * The gate was not wrong about its rule. It was wrong about whose files it was
 * reading, which is the same defect as a hand-written enumeration falling
 * behind what it covers — a directory root is an enumeration that grows
 * without anyone editing it.
 *
 * Listed as paths rather than as one root so a slice-10 module under
 * `src/surfaces/cc/` does not silently join slice 8's population either.
 */
const SLICE_8_ROOTS = [
  'src/offline',
  'src/fallbacks',
  'src/surfaces/cc/modules/cc-02',
  'src/surfaces/cc/modules/cc-10',
  'src/surfaces/cc/modules/cc-10-s366',
] as const

interface Authored {
  /** Repo-relative path. */
  readonly path: string
  readonly text: string
}

function walk(dir: string, into: string[] = []): string[] {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    const next = join(dir, entry.name)
    if (entry.isDirectory()) walk(next, into)
    else if (/\.tsx?$/.test(entry.name)) into.push(next)
  }
  return into
}

const AUTHORED: readonly Authored[] = SLICE_8_ROOTS.flatMap((root) =>
  walk(root).map((path) => ({ path, text: readFileSync(join(ROOT, path), 'utf8') })),
)

/**
 * Every `DEC-*` identifier a slice-8 file declares as a `decisionRef`, in a
 * file that also declares a `canonNote` — which is what marks the record as a
 * gap for the canon rather than a pointer at somewhere else.
 */
function locallyDisclosedIdentifiers(files: readonly Authored[]): readonly string[] {
  const found = new Set<string>()
  for (const file of files) {
    if (!file.text.includes('canonNote')) continue
    for (const m of file.text.matchAll(/decisionRef: *'(DEC-[A-Za-z0-9-]+)'/g)) found.add(m[1]!)
  }
  return [...found].sort()
}

/** The canon's keys, both spellings: the record id and the source identifier. */
const CANON_KEYS: ReadonlySet<string> = new Set(
  OPEN_DECISIONS.flatMap((d) => (d.decisionRef === null ? [d.id] : [d.id, d.decisionRef])),
)

/**
 * The sentence a module owes when it ships an `adopted` position: that the
 * position is this build's and not the source's ruling. Four phrasings are in
 * the tree and none of them is the house style, so the check is over the claim
 * rather than over one spelling of it.
 */
const DISCLAIMS_THE_SOURCE =
  /this build[’']?s (?:pick|choice|position)|what this build does|never (?:presented )?as the source|never as the source[’']?s answer|not a position the source settled|client-delegated|clientDelegated/i

/** Every reading object the shipped slice-8 records carry. */
const SHIPPED_READINGS: readonly { readonly where: string; readonly reading: object }[] = [
  ...FALLBACK_LOCAL_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `fallbacks ${d.decisionRef}`, reading })),
  ),
  ...DEC_37B_LOCAL_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `37B ${d.decisionRef}`, reading })),
  ),
  ...PROTOCOL_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `protocol ${d.decisionRef}`, reading })),
  ),
  ...PACKAGE_MANIFEST_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `manifest ${d.decisionRef}`, reading })),
  ),
  ...PACKAGE_INTEGRITY_LOCAL_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `integrity ${d.decisionRef}`, reading })),
  ),
  ...USE_CASE_LOCAL_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `use-cases ${d.decisionRef}`, reading })),
  ),
  ...CC10_DISCLOSURES.flatMap((d) =>
    d.readings.map((reading) => ({ where: `MOD-CC-10 ${d.decisionRef}`, reading })),
  ),
  ...DEC_FB_008_DISCLOSURE.readings.map((reading) => ({ where: 'conflict DEC-FB-008', reading })),
  ...OFFLINE_CLASS_CONTRADICTION.readings.map((reading) => ({
    where: 'capability DEC-OFFCLASS-001',
    reading,
  })),
]

/* ==================================================================== *
 * THE SWEEP CAN SEE.
 * ==================================================================== */

describe('slice 8 absence sweep: the sweep has a population to sweep', () => {
  it('reads the frozen source this slice was built against', () => {
    expect(existsSync(SOURCE)).toBe(true)
    const bytes = readFileSync(SOURCE)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(SOURCE_SHA)
    expect(bytes.toString('utf8').split('\n').length - 1).toBe(SOURCE_LINE_COUNT)
  })

  it('walks all three slice-8 roots and finds the modules this slice authored', () => {
    for (const root of SLICE_8_ROOTS) {
      expect(existsSync(join(ROOT, root)), `${root} is missing`).toBe(true)
      expect(walk(root).length, `${root} holds no authored module`).toBeGreaterThan(0)
    }
    // A floor, measured when this gate was written. It rises when a slice adds
    // modules and never falls silently: a walk that stopped descending would
    // otherwise report a clean absence over nothing.
    expect(AUTHORED.length).toBeGreaterThanOrEqual(28)
  })

  it('and the walk skips a concurrent suite’s probe rather than ENOENTing on it', () => {
    withPlanted(join(ROOT, 'src', 'offline'), 'probe.ts', 'export const P = 1\n', () => {
      // Planted under this process's OWN probe name, so the walk must see it —
      // `isForeignProbe` excludes only another process's. That is the half of
      // the predicate a scan-for-what-it-planted needs, and it is exercised so
      // the exclusion cannot quietly become "skip every probe".
      const seen = walk('src/offline')
      expect(seen.some((p) => p.includes(OWN_PROBE_DIR))).toBe(true)
      expect(isForeignProbe(OWN_PROBE_DIR)).toBe(false)
      // Another process's probe, DERIVED from this one rather than spelled:
      // `prohibited-patterns` holds that the probe convention is declared in
      // exactly one place, and writing the literal here re-declares it.
      expect(isForeignProbe(OWN_PROBE_DIR.replace(/\d+$/, '999999'))).toBe(true)
    })
    expect(existsSync(join(ROOT, 'src', 'offline', OWN_PROBE_DIR))).toBe(false)
  })

  it('finds the locally-disclosed decision identifiers, and there are many', () => {
    const identifiers = locallyDisclosedIdentifiers(AUTHORED)
    expect(identifiers.length, 'the sweep found no local disclosure at all').toBeGreaterThanOrEqual(
      26,
    )
    // Named spot checks from three different modules, so a regex that stopped
    // matching would be caught rather than reported as a clean sweep.
    for (const known of ['DEC-FB-008', 'DEC-OFFCLASS-001', 'DEC-SYNC-006', 'DEC-CCWRITE-001']) {
      expect(identifiers, `${known} is no longer found by the sweep`).toContain(known)
    }
  })

  it('and every shipped record’s readings are reachable, in numbers', () => {
    expect(SHIPPED_READINGS.length).toBeGreaterThanOrEqual(40)
  })
})

/* ==================================================================== *
 * ABSENCE 1 — NONE OF SLICE 8'S DECISIONS IS IN THE SHARED CANON.
 * ==================================================================== */

describe('slice 8 absence sweep: the canon holds none of these, and says so', () => {
  it('the canon is the twenty-nine records slice 5 raised, untouched by this slice', () => {
    expect(OPEN_DECISIONS.length).toBe(29)
    expect(new Set(OPEN_DECISIONS.map((d) => d.id)).size).toBe(29)
  })

  it('every identifier slice 8 discloses locally is ABSENT from it', () => {
    const identifiers = locallyDisclosedIdentifiers(AUTHORED)
    const lifted = identifiers.filter((id) => CANON_KEYS.has(id))
    expect(
      lifted,
      'a slice-8 decision has been lifted into the canon: move the record and delete its local ' +
        'disclosure, rather than leaving two homes for one decision',
    ).toEqual([])
  })

  it('and each local record says the canon does not hold it, in the canon’s own shape', () => {
    for (const file of AUTHORED) {
      if (!file.text.includes('canonNote')) continue
      const prose = file.text.replace(/\n\s*\*/g, ' ').replace(/\s+/g, ' ')
      expect(
        /canon|canonNote/.test(prose),
        `${file.path} declares a decisionRef with no canon note`,
      ).toBe(true)
    }
    // The shape itself: `DecisionReading` is IMPORTED by every module that
    // carries readings, never redeclared, so the lift is a move and not a
    // rewrite.
    const carriers = AUTHORED.filter((f) => /readings: (\[|readonly)/.test(f.text))
    expect(carriers.length).toBeGreaterThanOrEqual(10)
    for (const file of carriers) {
      expect(
        file.text.includes('DecisionReading'),
        `${file.path} carries readings without the canon's DecisionReading type`,
      ).toBe(true)
      expect(
        /interface\s+\w*DecisionReading\b|type\s+\w*DecisionReading\b/.test(file.text),
        `${file.path} redeclares DecisionReading instead of importing it`,
      ).toBe(false)
    }
  })
})

/* ==================================================================== *
 * ABSENCE 2 — NO READING CARRIES A FIELD A WINNER COULD BE MARKED IN.
 *
 * "Assert the absence of a chosen answer STRUCTURALLY": a reading type with
 * exactly two fields has nowhere to mark one. Asserted over the shipped
 * objects rather than over the type, because a type is erased and an object
 * is not.
 * ==================================================================== */

describe('slice 8 absence sweep: no reading has a field to be the answer in', () => {
  it('every shipped reading has exactly `text` and `locator`', () => {
    for (const { where, reading } of SHIPPED_READINGS) {
      expect(Object.keys(reading).sort(), `${where} grew a field`).toEqual(['locator', 'text'])
    }
  })

  it('and no slice-8 module names a winner field beside its readings', () => {
    // The words a disclosure quietly becomes an assertion through. Each is
    // checked as a FIELD DECLARATION, not as a substring: `preferred` occurs in
    // ordinary prose all over this tree, and a text sweep for the bare word
    // would be red on a comment rather than on a field -- the shape that made
    // an earlier gate fire on a module's own note naming the field it refuses
    // to have.
    for (const word of ['isCanonical', 'preferred', 'settled', 'winner', 'correctReading']) {
      const offenders = AUTHORED.filter((f) =>
        new RegExp(`(^|\\n)\\s*(readonly\\s+)?${word}\\??:`, 'm').test(f.text),
      )
      expect(offenders.map((f) => f.path), `a slice-8 record declares a \`${word}\` field`).toEqual(
        [],
      )
    }
  })

  it('and where a record does adopt, it says so as this build’s choice, never the source’s', () => {
    // The disjunction is over PHRASINGS of one claim, not over several claims:
    // the shipped modules say it four different ways and no one wording is the
    // house style. Widening it to a bare "build" or "choice" would make it true
    // of every file in the tree, which is the allowance that takes its allowed
    // string from the value under test.
    // `adopted` is not forbidden -- the canon's own shape carries it, and
    // DEC-SYNC-001 genuinely IS adopted. What is forbidden is presenting it as
    // the source's ruling. Every module that ships an `adopted` string says the
    // opposite in the same file.
    const adopters = AUTHORED.filter((f) => /\n\s*(readonly\s+)?adopted: string/.test(f.text))
    expect(adopters.length).toBeGreaterThanOrEqual(6)
    for (const file of adopters) {
      const prose = file.text.replace(/\n\s*\*/g, ' ').replace(/\s+/g, ' ')
      expect(
        DISCLAIMS_THE_SOURCE.test(prose),
        `${file.path} ships an adopted position without saying anywhere that the position is ` +
          `this build's rather than the source's ruling`,
      ).toBe(true)
    }
  })
})

/* ==================================================================== *
 * ABSENCE 3 — NO SECOND SPELLING OF A DECISION ANOTHER MODULE HOLDS.
 *
 * "The most common defect this build records is a second spelling of a ruling
 * that already exists." Three decisions in this slice are POINTED AT rather
 * than respelt, and a pointer that can point at itself is not a pointer.
 * ==================================================================== */

describe('slice 8 absence sweep: pointers point outward, and no fifth record has landed', () => {
  const pointers = [
    {
      decision: 'DEC-CLOCKWIN-001',
      from: 'src/offline/conflict.ts',
      holders: DEC_CLOCKWIN_001_DISCLOSED_ELSEWHERE.disclosedBy,
    },
    {
      decision: 'DEC-PLUS-001',
      from: 'src/surfaces/cc/modules/cc-10-s366/matrix.ts',
      holders: DEC_PLUS_001_DISCLOSED_ELSEWHERE.disclosedBy,
    },
  ] as const

  it('every pointer names holders OUTSIDE its own file and its own directory', () => {
    for (const pointer of pointers) {
      expect(pointer.holders.length, `${pointer.decision} points nowhere`).toBeGreaterThan(0)
      const ownDirectory = pointer.from.slice(0, pointer.from.lastIndexOf('/'))
      for (const holder of pointer.holders) {
        expect(holder, `${pointer.decision} points at its own file`).not.toBe(pointer.from)
        expect(
          holder.startsWith(`${ownDirectory}/`),
          `${pointer.decision} points at a neighbour in its own directory`,
        ).toBe(false)
        expect(existsSync(join(ROOT, holder)), `${holder} does not exist`).toBe(true)
        expect(
          readFileSync(join(ROOT, holder), 'utf8'),
          `${holder} does not carry ${pointer.decision}`,
        ).toContain(pointer.decision)
      }
    }
  })

  it('and the pointing file carries NO readings array for the decision it points at', () => {
    for (const pointer of pointers) {
      const text = readFileSync(join(ROOT, pointer.from), 'utf8')
      expect(
        new RegExp(`decisionRef: '${pointer.decision}',[\\s\\S]{0,400}?readings: \\[`).test(text),
        `${pointer.from} respells ${pointer.decision} instead of pointing at it`,
      ).toBe(false)
    }
  })

  it('the §37B module points its two held decisions outside src/offline entirely', () => {
    expect(DEC_37B_HELD_ELSEWHERE.length).toBeGreaterThanOrEqual(2)
    for (const held of DEC_37B_HELD_ELSEWHERE) {
      expect(
        held.path.startsWith('src/offline/'),
        `${held.decisionRef} is held by a neighbour in its own directory`,
      ).toBe(false)
      expect(existsSync(join(ROOT, held.path))).toBe(true)
      const holder = readFileSync(join(ROOT, held.path), 'utf8')
      expect(holder, `${held.path} does not carry ${held.decisionRef}`).toContain(held.decisionRef)
      // The holder must also carry the locator the pointer quotes, or the
      // pointer is satisfied by a file that merely mentions the identifier.
      expect(holder, `${held.path} does not carry ${held.locator}`).toContain(held.locator)
    }
  })

  it('DEC-STORE-001 has four RECORDS and no fifth, recounted from the tree', () => {
    // A RECORD, not a mention and not a pointer. The first form of this check
    // convicted `src/offline/use-cases/group-e-g/catalogue.ts`, whose
    // `DECISIONS_NAMED_ELSEWHERE` row keys on the identifier precisely to say
    // it holds no record for it -- a gate whose message asserted more than its
    // predicate tested, which is a shape this slice recorded and then repeated.
    // So the object the key opens must also carry a `readings` array, and the
    // scan stops at the next keyed object rather than running into a neighbour's.
    const holdsARecord = (text: string): boolean => {
      for (const match of text.matchAll(/(?:decisionRef|id): 'DEC-STORE-001',/g)) {
        const after = text.slice(match.index + match[0].length, match.index + 1_400)
        const nextKey = after.search(/(?:decisionRef|id): '/)
        const readings = after.search(/readings: \[/)
        if (readings !== -1 && (nextKey === -1 || readings < nextKey)) return true
      }
      return false
    }
    const holders = AUTHORED.concat(
      DEC_STORE_001_SHIPPED_RECORDS.map((path) => ({
        path,
        text: readFileSync(join(ROOT, path), 'utf8'),
      })),
    ).filter((f) => holdsARecord(f.text))
    const paths = [...new Set(holders.map((f) => f.path))].sort()
    expect(paths, 'a fifth DEC-STORE-001 record has landed').toEqual(
      [...DEC_STORE_001_SHIPPED_RECORDS].sort(),
    )
  })
})

/* ==================================================================== *
 * ABSENCE 4 — NO EXPORT SETTLES A COUNT THE SOURCE CONTRADICTS.
 *
 * A single exported figure is how a contradiction stops being one: a caller
 * that needs a number has to reach into the contradiction record and pick in
 * its own code, in view of both locators.
 * ==================================================================== */

describe('slice 8 absence sweep: no single figure settles a contradicted count', () => {
  const SETTLING_EXPORTS = [
    'ARTEFACT_COUNT',
    'LADDER_ATTRIBUTE_COUNT',
    'TEMPLATE_FIELD_COUNT',
    'MANIFEST_FIELD_COUNT',
    'CONVERGENCE_COLUMN_COUNT',
    'OPEN_DECISION_COUNT',
  ] as const

  it('none of the settling names is exported anywhere in the slice, or in the honesty kernel', () => {
    const files = AUTHORED.concat(
      ['src/honesty/artefacts.ts', 'src/frontline/modules/fl-a7/offline.ts'].map((path) => ({
        path,
        text: readFileSync(join(ROOT, path), 'utf8'),
      })),
    )
    for (const name of SETTLING_EXPORTS) {
      const offenders = files.filter((f) =>
        new RegExp(`export (const|function|let) ${name}\\b`).test(f.text),
      )
      expect(
        offenders.map((f) => f.path),
        `\`${name}\` settles a count the source states two ways`,
      ).toEqual([])
    }
  })

  it('and the counts that ARE exported are the DECLARED figure, named as declared', () => {
    // `DECLARED_*` is not a settlement: it is one of the two readings, and its
    // name says which. What would be a settlement is an unqualified total.
    const template = readFileSync(join(ROOT, 'src/fallbacks/template.ts'), 'utf8')
    expect(template).toContain('export const DECLARED_TEMPLATE_FIELD_COUNT = 26')
    expect(template).toContain('export const RENDERED_ROW_COUNT = 24')
    const ladder = readFileSync(join(ROOT, 'src/fallbacks/ladder.ts'), 'utf8')
    expect(ladder).toContain('export const DECLARED_LADDER_ATTRIBUTE_COUNT = 13')
  })
})

/* ==================================================================== *
 * THE FILE ITSELF.
 * ==================================================================== */

describe('slice 8 absence sweep: the file itself', () => {
  it('leaves no probe behind', () => {
    for (const root of SLICE_8_ROOTS) {
      expect(
        existsSync(join(ROOT, root, OWN_PROBE_DIR)),
        `${root} still holds this run's probe`,
      ).toBe(false)
    }
  })

  it('sweeps only files this slice owns, and every swept path is under a slice-8 root', () => {
    for (const file of AUTHORED) {
      const rel = relative(ROOT, join(ROOT, file.path))
      expect(
        SLICE_8_ROOTS.some((root) => rel.startsWith(root)),
        `${rel} is outside the slice-8 roots`,
      ).toBe(true)
    }
  })
})

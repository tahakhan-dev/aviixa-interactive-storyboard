import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CANON_CONSOLIDATION_VERDICTS,
  NAMESPACES_ACCOUNTED_ELSEWHERE,
  UNINVENTORIED_DECISION_LABEL,
  UNINVENTORIED_FAMILIES,
  UNINVENTORIED_IDENTIFIERS,
  decAiDisclosedLocally,
  decAiInTheCanon,
  fbAiLiteralsWithMoreThanOneOwner,
} from '@/coverage/uninventoried'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import { loadGeneratedRegistry } from '@/coverage/registry-loader'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'

/**
 * THE GATE THAT MAKES "SILENTLY UNCOUNTED" IMPOSSIBLE.
 *
 * Slice 11 wave 5 task 20 decided that a set of identifier families belongs in
 * none of the fourteen inventories (`src/coverage/uninventoried.ts` carries the
 * decision and its reasons). A decision like that is worth exactly as much as
 * the check behind it: the forbidden outcome was never "no fifteenth registry",
 * it was leaving shipped identifiers uncounted, and a hand-written list of
 * families is uncounted again the first time someone ships another one.
 *
 * IT HAPPENED. Three families — `FAIL-AI-*`, the `AI-NN` abilities and
 * `FB-AGT-*`, 85 identifiers — shipped past this file green, because the sweep
 * below was keyed on the prefixes the module already declared. That is audit
 * finding C-27 and defect shape 10, and the second block near the end of this
 * file is the answer to it: a sweep over `src/ai/` whose token shape is
 * general and which asks the module nothing.
 *
 * So the first load-bearing assertion is a SET EQUALITY, in both directions,
 * between what the tree ships and what the module declares:
 *
 *   - a token in `src/` or `app/` that no family accounts for turns this red,
 *     which is the "silently uncounted" case; and
 *   - a declared identifier no longer in the tree turns this red too, which is
 *     the stale-declaration case, and is the half a one-directional subset
 *     check would miss. `docs/process/RESUME.md` §7 lists the vacuous subset
 *     assertion as defect shape 9 for exactly this reason.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED: a count. Not one number in this file is a
 * literal standing for the size of anything the module derives. The family list
 * is held by MEMBERSHIP on its prefixes, so a deletion is caught by name
 * rather than by a length that any substitution satisfies — and per this
 * build's rule, membership is proved by ADDING. The floors below are
 * non-vacuity floors, which is a different thing from a count: they exist so
 * that a broken walk or a broken regex fails loudly instead of passing on an
 * empty scan.
 */

const REPO = join(import.meta.dirname, '..', '..')
const SWEPT_ROOTS = ['src', 'app'] as const

/**
 * THE DECLARING MODULE IS EXCLUDED FROM THE SWEEP, AND THAT IS THE WHOLE GATE.
 *
 * Found by planting, not by reading, and the first version of this file shipped
 * without it. `src/coverage/uninventoried.ts` names many of these identifiers
 * in its own prose and in its own literal lists, and it lives under `src/`. So
 * while it was swept, EVERY DECLARATION JUSTIFIED ITSELF: a planted
 * `AIMODE-99` added to the declared list was then found by the sweep in the
 * very line that declared it, the two sets stayed equal, and the gate exited 0
 * on a defect it was written to catch.
 *
 * The consequence was worse in the other direction. A future task that shipped
 * an undeclared identifier could have silenced this gate by writing the token
 * into a COMMENT in the declaring module instead of accounting for it — the
 * cheapest possible way to make the count wrong and the check green.
 *
 * Excluding the file makes both directions bite: the declared set must now be
 * justified by the REST of the tree, which is the claim it is actually making.
 * Every identifier this module names in prose is verified below to occur
 * somewhere else as well, so the exclusion removes self-justification without
 * removing any real evidence.
 *
 * This is the shape `docs/process/RESUME.md` names as the cause of most of the
 * eleven gates in this slice that could not fail: a gate scoped to include or
 * exclude exactly the wrong thing.
 */
const DECLARING_MODULE = join('src', 'coverage', 'uninventoried.ts')

/**
 * ONE TOKEN SHAPE, DERIVED FROM EACH FAMILY'S OWN PREFIX. Never a table keyed
 * beside the declaration: the previous version of this file held four literal
 * patterns for the four prefixes the module declared, so the equality below
 * was true by construction for any family outside them and three shipped
 * families — `FAIL-AI-*`, `AI-NN` and `FB-AGT-*` — were invisible to it (audit
 * C-27, defect shape 10). Deriving the pattern means a family added to the
 * module is swept the moment it is declared.
 *
 * The leading lookbehind is load-bearing for `AI-`: `\bAI-01\b` matches inside
 * `FAIL-AI-01`, `FB-AI-01` and `SB-AI-01`, so a word boundary alone would file
 * three other families' identifiers under the abilities.
 */
const tokenPattern = (prefix: string): RegExp =>
  new RegExp(`(?<![A-Za-z0-9-])${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[A-Z]*-?\\d+\\b`, 'g')

const TOKEN_PATTERNS: Readonly<Record<string, RegExp>> = Object.fromEntries(
  UNINVENTORIED_FAMILIES.map((f) => [f.prefix, tokenPattern(f.prefix)]),
)

function sourceFiles(): readonly string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(REPO, dir))) {
      if (isForeignProbe(entry)) continue
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
      const rel = join(dir, entry)
      let stats
      try {
        stats = statSync(join(REPO, rel))
      } catch {
        continue
      }
      if (stats.isDirectory()) walk(rel)
      else if (/\.(ts|tsx)$/.test(entry)) out.push(rel)
    }
  }
  for (const root of SWEPT_ROOTS) walk(root)
  return out.filter((f) => f !== DECLARING_MODULE)
}

const FILES = sourceFiles()

/** Every token of every shape, with the files it was found in. */
function sweep(): ReadonlyMap<string, readonly string[]> {
  const found = new Map<string, string[]>()
  for (const file of FILES) {
    const text = readFileSync(join(REPO, file), 'utf8')
    for (const pattern of Object.values(TOKEN_PATTERNS)) {
      for (const match of text.matchAll(pattern)) {
        const list = found.get(match[0]) ?? []
        if (!list.includes(file)) list.push(file)
        found.set(match[0], list)
      }
    }
  }
  return found
}

const SWEPT = sweep()

describe('the sweep itself can see the tree', () => {
  /**
   * THE POSITIVE CONTROL. Every assertion below is over `SWEPT`, so a walk
   * that returned nothing, or a regex that matched nothing, would make each
   * one of them pass on an empty set. `cc-02.test.ts`'s absence loop shipped
   * exactly that hole — a failed parse made every absence pass — and it now
   * carries a control for the same reason this does.
   */
  it('reads a substantial number of source files', () => {
    expect(FILES.length).toBeGreaterThan(200)
  })

  /**
   * THE EXCLUSION IS REAL AND IS THE ONLY ONE. A gate that grew a second
   * exemption would be back where this one started, so the exclusion is
   * asserted to be exactly one file and that file to exist — an exclusion
   * pointing at a path that no longer exists silently stops excluding.
   */
  it('excludes the declaring module and nothing else', () => {
    expect(existsSync(join(REPO, DECLARING_MODULE))).toBe(true)
    expect(FILES).not.toContain(DECLARING_MODULE)
    const allFiles: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(join(REPO, dir))) {
        if (isForeignProbe(entry)) continue
        if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
        const rel = join(dir, entry)
        let stats
        try {
          stats = statSync(join(REPO, rel))
        } catch {
          continue
        }
        if (stats.isDirectory()) walk(rel)
        else if (/\.(ts|tsx)$/.test(entry)) allFiles.push(rel)
      }
    }
    for (const root of SWEPT_ROOTS) walk(root)
    expect(allFiles.filter((f) => !FILES.includes(f))).toEqual([DECLARING_MODULE])
  })

  it('finds at least one token of every declared shape', () => {
    for (const [prefix, pattern] of Object.entries(TOKEN_PATTERNS)) {
      const hits = [...SWEPT.keys()].filter((id) => pattern.test(id) || id.startsWith(prefix))
      expect(hits.length, `the ${prefix} sweep found nothing, so its regex is broken`).toBeGreaterThan(0)
    }
  })
})

describe('every shipped identifier in these declared families is accounted for', () => {
  /**
   * THE ONE THAT MATTERS. Both directions, and the failure message names the
   * identifiers rather than printing two numbers, because "expected 91 to be
   * 92" tells a reader nothing about which one they shipped.
   */
  it('declares exactly the set the tree ships — no more, no fewer', () => {
    const declared = new Set(UNINVENTORIED_IDENTIFIERS)
    const shipped = new Set(SWEPT.keys())

    const undeclared = [...shipped].filter((id) => !declared.has(id)).sort()
    const stale = [...declared].filter((id) => !shipped.has(id)).sort()

    expect(
      undeclared,
      'these identifiers are shipped in src/ or app/ and are in NO generated inventory and NO '
        + 'declared family, which is the one outcome APP-012 forbade. Add each to its family in '
        + 'src/coverage/uninventoried.ts — as a held identifier if a register holds it, or to '
        + `alsoCitedWithoutARecord with the reason if nothing does. Found in: ${undeclared
          .map((id) => `${id} (${SWEPT.get(id)?.join(', ')})`)
          .join(' | ')}`,
    ).toEqual([])

    expect(
      stale,
      'these identifiers are declared uninventoried but no longer appear in src/ or app/. Remove '
        + 'them rather than leaving a declaration that describes a tree that no longer exists.',
    ).toEqual([])
  })

  it('puts every identifier in a family whose prefix it actually carries', () => {
    for (const family of UNINVENTORIED_FAMILIES) {
      for (const id of [
        ...family.identifiers,
        ...family.alsoCitedWithoutARecord.map((c) => c.id),
      ]) {
        expect(id.startsWith(family.prefix), `${id} is filed under ${family.prefix}`).toBe(true)
      }
    }
  })

  it('never files one identifier as both held and merely cited', () => {
    for (const family of UNINVENTORIED_FAMILIES) {
      const held = new Set(family.identifiers)
      for (const cited of family.alsoCitedWithoutARecord) {
        expect(
          held.has(cited.id),
          `${cited.id} is declared both held by a register and cited without a record; those are `
            + 'opposite claims and one of them is wrong',
        ).toBe(false)
      }
    }
  })
})

describe('the decision is recorded, not merely implied', () => {
  /**
   * Membership, not length: the four prefixes by name. Proved by ADDING — the
   * plant that closed this gate added a fifth family and a matching token, and
   * the equality above convicted it.
   */
  it('declares every family the decision covers', () => {
    const prefixes = UNINVENTORIED_FAMILIES.map((f) => f.prefix)
    for (const expectedPrefix of [
      'AIMODE-',
      'PROV-',
      'FB-AI-',
      'DEC-AI',
      // The three the slice-11 audit found shipped and declared nowhere
      // (C-27). Held by name, so a deletion is caught by name.
      'FAIL-AI-',
      'AI-',
      'FB-AGT-',
    ]) {
      expect(prefixes).toContain(expectedPrefix)
    }
  })

  it('gives every family a reason a fifteenth inventory would be wrong', () => {
    for (const family of UNINVENTORIED_FAMILIES) {
      expect(family.whyNotAnInventory.length, `${family.prefix} has no reason`).toBeGreaterThan(80)
      expect(family.whatItIs.length).toBeGreaterThan(40)
      expect(family.sizeMeaning.length).toBeGreaterThan(40)
    }
  })

  it('names the build approval the choice was made under', () => {
    expect(UNINVENTORIED_DECISION_LABEL).toContain('APP-012')
    // And says APP-012 is not citable with a source line, because it is not in
    // the frozen source at all -- a build label quoted as a blueprint fact is
    // the boundary this build has crossed before.
    expect(UNINVENTORIED_DECISION_LABEL).toContain('zero times in the frozen source')
  })

  it('leaves the client-named fourteen untouched', () => {
    // The whole point of choosing option (a): the number the client named does
    // not move. Held by membership on the slugs, so a swap is caught too.
    const slugs = REGISTRY_DESCRIPTORS.map((d) => d.slug)
    for (const slug of ['modules', 'ai-storyboards', 'features', 'actionable-controls'] as const) {
      expect(slugs).toContain(slug)
    }
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('states where every family is actually held, and the paths open', () => {
    for (const family of UNINVENTORIED_FAMILIES) {
      expect(family.heldIn.length, `${family.prefix} names no home`).toBeGreaterThan(0)
      for (const path of family.heldIn) {
        expect(
          existsSync(join(REPO, path)),
          `${family.prefix} names ${path} as its home and that file does not exist. A record `
            + 'naming a file nobody can open is the same thing as no record.',
        ).toBe(true)
      }
    }
  })

  it('says where each merely-cited identifier is cited, and that file opens', () => {
    for (const family of UNINVENTORIED_FAMILIES) {
      for (const cited of family.alsoCitedWithoutARecord) {
        expect(existsSync(join(REPO, cited.citedBy)), `${cited.id}: ${cited.citedBy}`).toBe(true)
        expect(cited.why.length, `${cited.id} has no reason`).toBeGreaterThan(40)
        // And the file it names must really carry the token, or the citation
        // is a plausible string rather than a measurement.
        expect(readFileSync(join(REPO, cited.citedBy), 'utf8')).toContain(cited.id)
      }
    }
  })
})

/* ==================================================================== *
 * THE SWEEP THAT KNOWS NOTHING ABOUT THE DECLARATION.
 * ==================================================================== */

/**
 * WHY THIS SECOND SWEEP EXISTS, AND WHAT THE FIRST ONE COULD NOT DO.
 *
 * The equality above is a strong check inside a family and a vacuous one
 * outside it: its patterns come from the prefixes the module declares, so a
 * family the module has never heard of is not swept for and the two sets stay
 * equal. That is defect shape 10 — a gate scoped to exclude what it is named
 * for — and it is how `FAIL-AI-*` (60), the `AI-NN` abilities (13) and
 * `FB-AGT-*` (12) shipped in no inventory row, in no declared family, and past
 * a green suite whose module header claimed it "cannot silently miss an
 * identifier the build ships".
 *
 * So this one is written the other way round. It matches an identifier SHAPE —
 * an uppercase prefix and a numeric tail, any prefix — over `src/ai/`, and then
 * subtracts, in this order:
 *
 *   1. every row id of the fourteen generated inventories (read from the
 *      files, not from `idPrefix`, so a registry that holds more shapes than
 *      its descriptor names still accounts for them);
 *   2. every identifier the families above declare;
 *   3. every namespace `NAMESPACES_ACCOUNTED_ELSEWHERE` answers for.
 *
 * The remainder must be empty. Nothing in that computation asks the module
 * which prefixes it knows about, so a family nobody has declared lands in the
 * remainder by construction rather than by anyone remembering to look.
 *
 * SCOPE, STATED RATHER THAN IMPLIED: `src/ai/`, where every register in this
 * disclosure's subject area is transcribed. It is not the whole tree, and the
 * whole tree would not be honest here — `src/` and `app/` carry 3,300 distinct
 * identifiers across a hundred namespaces belonging to twelve other slices,
 * and an allowlist that long would be a rubber stamp. The per-family sweep
 * above still runs over `src/` and `app/`, so a declared family's identifier
 * cited outside `src/ai/` is still caught.
 */
const AI_ROOT = join('src', 'ai')

/** `PREFIX-…-NN`: two or more leading uppercase characters, numeric tail. */
const IDENTIFIER_SHAPE = /(?<![A-Za-z0-9-])[A-Z][A-Z0-9]+(?:-[A-Z0-9]+)*-\d{1,4}\b/g

function aiAreaTokens(): ReadonlyMap<string, readonly string[]> {
  const found = new Map<string, string[]>()
  for (const file of FILES) {
    if (!file.startsWith(AI_ROOT)) continue
    const text = readFileSync(join(REPO, file), 'utf8')
    for (const match of text.matchAll(IDENTIFIER_SHAPE)) {
      const list = found.get(match[0]) ?? []
      if (!list.includes(file)) list.push(file)
      found.set(match[0], list)
    }
  }
  return found
}

/**
 * Every row id of the fourteen, read from the generated files. `@L`-suffixed
 * composite keys are split back to the bare identifier: a composite key is the
 * registry disambiguating two owners, not a different identifier.
 */
function inventoryRowIds(): ReadonlySet<string> {
  const ids = new Set<string>()
  for (const descriptor of REGISTRY_DESCRIPTORS) {
    for (const row of loadGeneratedRegistry(descriptor.slug).rows) {
      ids.add(row.id.split('@')[0] ?? row.id)
    }
  }
  return ids
}

const AI_AREA_TOKENS = aiAreaTokens()
const INVENTORY_IDS = inventoryRowIds()

describe('nothing in the artificial-intelligence area is counted nowhere', () => {
  /**
   * THE POSITIVE CONTROLS. Every assertion in this block is a subtraction, so
   * an empty sweep or an empty inventory read would make it pass on nothing.
   */
  it('reads the AI area and the fourteen inventories', () => {
    expect(FILES.filter((f) => f.startsWith(AI_ROOT)).length).toBeGreaterThan(20)
    expect(AI_AREA_TOKENS.size).toBeGreaterThan(300)
    expect(INVENTORY_IDS.size).toBeGreaterThan(1000)
    expect(REGISTRY_DESCRIPTORS.length).toBe(14)
  })

  /**
   * THE ONE THAT REPLACES A GATE THAT COULD NOT FAIL. Proved by planting: a
   * file under `src/ai/` carrying a token of an undeclared namespace turns
   * this red and names the token and the file.
   */
  it('accounts for every identifier-shaped token in src/ai/', () => {
    const declared = new Set(UNINVENTORIED_IDENTIFIERS)
    const accountedPrefixes = NAMESPACES_ACCOUNTED_ELSEWHERE.flatMap((n) => n.prefixes)

    const unaccounted = [...AI_AREA_TOKENS.keys()]
      .filter((id) => !INVENTORY_IDS.has(id))
      .filter((id) => !declared.has(id))
      .filter((id) => !UNINVENTORIED_FAMILIES.some((f) => id.startsWith(f.prefix)))
      .filter((id) => !accountedPrefixes.some((p) => id.startsWith(p)))
      .sort()

    expect(
      unaccounted,
      'these identifier-shaped tokens are shipped under src/ai/ and are in NO row of the '
        + 'fourteen generated inventories, NO declared uninventoried family and NO namespace '
        + 'NAMESPACES_ACCOUNTED_ELSEWHERE answers for. That is the outcome APP-012 forbade. '
        + 'Declare the family in src/coverage/uninventoried.ts, or record where it is answered '
        + `— never leave it uncounted. Found in: ${unaccounted
          .map((id) => `${id} (${AI_AREA_TOKENS.get(id)?.join(', ')})`)
          .join(' | ')}`,
    ).toEqual([])
  })

  /**
   * An accounted-elsewhere entry is a claim that something else answers for
   * the namespace. A claim nothing matches is a rubber stamp growing in the
   * dark, so each entry must still be earning its place.
   */
  it('keeps every accounted-elsewhere entry matched and reasoned', () => {
    for (const entry of NAMESPACES_ACCOUNTED_ELSEWHERE) {
      expect(entry.prefixes.length, `${entry.title} names no prefix`).toBeGreaterThan(0)
      expect(entry.why.length, `${entry.title} has no reason`).toBeGreaterThan(80)
      expect(entry.accountedIn.length).toBeGreaterThan(10)
      const matched = [...AI_AREA_TOKENS.keys()].filter((id) =>
        entry.prefixes.some((p) => id.startsWith(p)),
      )
      expect(
        matched.length,
        `${entry.prefixes.join('/')} matches nothing under src/ai/ any more. Remove the entry `
          + 'rather than leaving an exemption for a namespace the build no longer carries.',
      ).toBeGreaterThan(0)
    }
  })

  /**
   * C-31, held as a measurement rather than a sentence. The AC-* entry states
   * that this build cites no chapter-44 acceptance criterion and no chapter-44
   * test identifier. The day one is cited, the abstention is false and this
   * says so.
   */
  it('holds the chapter-44 abstention the AC- and TEST- entries claim', () => {
    const cited = FILES.flatMap((file) => {
      const text = readFileSync(join(REPO, file), 'utf8')
      return [...text.matchAll(/\b(?:AC|TEST)-44-\d+\b/g)].map((m) => `${m[0]} (${file})`)
    })
    expect(
      cited,
      'a chapter-44 AC-44-* or TEST-44-* identifier is now cited under src/ or app/. The '
        + 'abstention recorded in NAMESPACES_ACCOUNTED_ELSEWHERE says the build enforces none of '
        + 'them; either the citation is wrong or the record is. Fix one of the two.',
    ).toEqual([])
  })
})

describe('the argument against a flat FB-AI inventory rests on a live measurement', () => {
  /**
   * Reason 2 in the module says a bare `FB-AI-NN` literal does not identify a
   * contract. That is an empirical claim about the registry, not a principle,
   * so it is checked here. If the namespace ever became unambiguous this goes
   * red and the decision has to be re-argued rather than inherited.
   */
  it('finds FB-AI literals with more than one owning chapter', () => {
    expect(fbAiLiteralsWithMoreThanOneOwner.length).toBeGreaterThan(0)
    for (const id of fbAiLiteralsWithMoreThanOneOwner) {
      expect(id.startsWith('FB-AI-')).toBe(true)
    }
  })
})

describe('the canon consolidation verdicts', () => {
  it('reaches a verdict on every identifier that named wave 5', () => {
    const ids = CANON_CONSOLIDATION_VERDICTS.map((v) => v.id)
    for (const id of [
      'DEC-ASK-001',
      'DEC-LOCALAI-001',
      'DEC-NOSHIFT-001',
      'DEC-PLUS-001',
      'DEC-SYNC-001',
      'DEC-WIPE-001',
      'DEC-AIRTO-001',
      'DEC-AIPAUSE-001',
      'DEC-KILL-001',
      'DEC-PAUSE-001',
      'DEC-AIFALLBACK-001',
      'DEC-HANDOFF-001',
      'DEC-HANDOFF-002',
    ]) {
      expect(ids, `no wave-5 verdict recorded for ${id}`).toContain(id)
    }
    expect(new Set(ids).size, 'one identifier, one verdict').toBe(ids.length)
  })

  it('gives every verdict a reason and a home that opens', () => {
    for (const verdict of CANON_CONSOLIDATION_VERDICTS) {
      expect(verdict.reason.length, `${verdict.id} has no reason`).toBeGreaterThan(60)
      expect(existsSync(join(REPO, verdict.homeAfter)), `${verdict.id}: ${verdict.homeAfter}`).toBe(
        true,
      )
    }
  })

  /**
   * THE FORCING FUNCTION, AND THE REASON THIS FILE IS NOT JUST A NOTE.
   *
   * A verdict of `stays-local` or `handed-back` is a claim that the canon does
   * NOT hold the identifier. The day someone registers one, this goes red and
   * names it — so the verdict cannot quietly become false, and whoever
   * registers it is told to delete the local record and update the verdict in
   * the same change rather than leaving two homes. That is the same mechanism
   * `src/ai/controls/decisions.ts` enforces by throwing at load; this covers
   * the identifiers whose local home is a file that does not throw.
   */
  it('holds the non-membership every stays-local and handed-back verdict claims', () => {
    const canon = new Set<string>(OPEN_DECISION_IDS)
    for (const verdict of CANON_CONSOLIDATION_VERDICTS) {
      if (verdict.verdict === 'stays-local' || verdict.verdict === 'handed-back') {
        expect(
          canon.has(verdict.id),
          `${verdict.id} is recorded as ${verdict.verdict} — meaning its record lives at `
            + `${verdict.homeAfter} and NOT in the canon — but it is now a member of the canon's `
            + 'exported union. Two homes for one decision is the defect DecisionDisclosure '
            + 'exists to prevent: delete the local record and change this verdict to '
            + '`registered` in the same change.',
        ).toBe(false)
      }
    }
  })

  /** And the inverse, so `already-consolidated` cannot go stale either. */
  it('holds the membership every already-consolidated verdict rests on', () => {
    const text = readFileSync(join(REPO, 'src/disclosure/decisions.ts'), 'utf8')
    for (const verdict of CANON_CONSOLIDATION_VERDICTS) {
      if (verdict.verdict === 'already-consolidated') {
        // These two are ALIASES rather than union members, so membership is the
        // wrong check: the canon registers them as `alias:` on a canonical
        // record. Assert that, which is what the verdict actually claims.
        expect(
          text,
          `${verdict.id} is recorded as already consolidated via an alias, so the canon must `
            + 'register it as one',
        ).toContain(`alias: '${verdict.id}'`)
      }
    }
  })

  it('agrees with the canon about which DEC-AI ids it holds', () => {
    const canon = new Set<string>(OPEN_DECISION_IDS)
    for (const id of decAiInTheCanon) expect(canon.has(id), `${id}`).toBe(true)
    for (const id of decAiDisclosedLocally) expect(canon.has(id), `${id}`).toBe(false)
    // Non-vacuity on both halves: a filter that returned nothing would make
    // both loops pass.
    expect(decAiInTheCanon.length).toBeGreaterThan(0)
    expect(decAiDisclosedLocally.length).toBeGreaterThan(0)
  })
})

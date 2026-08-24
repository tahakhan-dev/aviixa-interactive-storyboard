import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CANON_CONSOLIDATION_VERDICTS,
  UNINVENTORIED_DECISION_LABEL,
  UNINVENTORIED_FAMILIES,
  UNINVENTORIED_IDENTIFIERS,
  decAiDisclosedLocally,
  decAiInTheCanon,
  fbAiLiteralsWithMoreThanOneOwner,
} from '@/coverage/uninventoried'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'

/**
 * THE GATE THAT MAKES "SILENTLY UNCOUNTED" IMPOSSIBLE.
 *
 * Slice 11 wave 5 task 20 decided that four identifier families belong in none
 * of the fourteen inventories (`src/coverage/uninventoried.ts` carries the
 * decision and its reasons). A decision like that is worth exactly as much as
 * the check behind it: the forbidden outcome was never "no fifteenth registry",
 * it was leaving shipped identifiers uncounted, and a hand-written list of
 * families is uncounted again the first time someone ships a fifth one.
 *
 * So the load-bearing assertion here is a SET EQUALITY, in both directions,
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
 * is held by MEMBERSHIP on its four prefixes, so a deletion is caught by name
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

/** The four token shapes, as whole tokens. Keyed by the family prefix. */
const TOKEN_PATTERNS: Readonly<Record<string, RegExp>> = {
  'AIMODE-': /\bAIMODE-\d+\b/g,
  'PROV-': /\bPROV-\d+\b/g,
  'FB-AI-': /\bFB-AI-\d+\b/g,
  'DEC-AI': /\bDEC-AI[A-Z]*-\d+\b/g,
}

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

  it('finds at least one token of every one of the four shapes', () => {
    for (const [prefix, pattern] of Object.entries(TOKEN_PATTERNS)) {
      const hits = [...SWEPT.keys()].filter((id) => pattern.test(id) || id.startsWith(prefix))
      expect(hits.length, `the ${prefix} sweep found nothing, so its regex is broken`).toBeGreaterThan(0)
    }
  })
})

describe('every shipped identifier in these four families is accounted for', () => {
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
  it('declares all four families the decision covers', () => {
    const prefixes = UNINVENTORIED_FAMILIES.map((f) => f.prefix)
    for (const expectedPrefix of ['AIMODE-', 'PROV-', 'FB-AI-', 'DEC-AI']) {
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

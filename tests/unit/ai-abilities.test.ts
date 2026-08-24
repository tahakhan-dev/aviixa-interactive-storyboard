import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  ABILITY_ATTRIBUTES,
  ABILITY_ATTRIBUTE_PREAMBLE_REF,
  AI_ABILITY_IDS,
  AI_ABILITY_REGISTER,
  abilityAttribute,
  aiAbility,
  type AiAbility,
  type AiAbilityId,
} from '@/ai/abilities/register'

/**
 * Slice 11, wave 0, task 3 — the artificial-intelligence ability register.
 *
 * WHAT THIS FILE IS FOR. Not "the register exists". Four things that are each
 * a way this register can be wrong while looking right:
 *
 *   1. A VALUE QUOTED SHORT. The dispatch brief says in terms that the
 *      costliest brief error this build produced dropped a third of one
 *      sentence. A truncated attribute value still reads as a sentence, still
 *      passes review, and changes what the platform claims an agent may do.
 *      So no assertion here checks that a stored value is FOUND in the source
 *      line — that is satisfied by any prefix of it. Every value is compared
 *      against the source paragraph re-parsed at run time, whole and in
 *      order, so a dropped clause is a diff rather than a pass.
 *   2. TWO AXES CONFLATED. `TEST-AI-016-A` (L88013) walks "the fourteen
 *      attributes"; the abilities are a different axis with a different size.
 *      Nothing in the source is inconsistent about this and there is no
 *      discrepancy to report — but an implementer reading fast writes one
 *      number where the other belongs, so both are measured and their
 *      DIFFERENCE is asserted rather than either being transcribed.
 *   3. AN ABSENCE RENDERED AS AN OVERSIGHT. `AI-13` states that its
 *      attributes are not specified, names five fixed ones, and is governed
 *      by `SB-AI-006` (L86781), which forbids the platform to display a
 *      greyed-out "coming soon" agent. From outside, a stated absence and a
 *      forgotten field look identical, so the absence is measured here.
 *   4. A LOCATOR CARRIED RATHER THAN OPENED. The dispatch brief located the
 *      six `DEC-VISION-*` rows at L95384-L95389. Measured on the frozen
 *      bytes they are two lines lower; L95384 and L95385 are `DEC-HANDOFF`
 *      rows. Every line number the register stores is re-derived here.
 *
 * Every count and every locator below is measured off the frozen bytes at run
 * time. A count copied into an assertion has stopped measuring.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
/** One-based, so `LINES[n]` is the line a citation spelling `Ln` names. */
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

/** The one-based line number of the only line carrying a token, or a throw. */
const soleLineCarrying = (token: string): number => {
  const hits = LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])
  if (hits.length !== 1) {
    throw new Error(`"${token}" is on ${hits.length} lines, not one: ${hits.join(', ')}`)
  }
  return hits[0] as number
}

/** `Ln` -> n. Every `sourceRef` in the register is this shape. */
const lineOf = (sourceRef: string): number => {
  const m = /^L(\d+)$/.exec(sourceRef)
  if (m === null) throw new Error(`"${sourceRef}" is not a single-line locator.`)
  return Number(m[1])
}

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the register, located by structure rather than by transcription ───── */

/**
 * The preamble sentence that declares the attribute axis. Located by its own
 * opening rather than by a line number, so a locator slip cannot survive.
 */
const PREAMBLE_LINE = soleLineCarrying('**The artificial-intelligence ability register.**')

/** The sentence that opens the prohibition list — the register's end fence. */
const PROHIBITION_INTRO_LINE = soleLineCarrying(
  '**The complete prohibition list, restated, with a test for each.**',
)

/** Every ability paragraph between the preamble and the prohibition list. */
const measuredAbilityLines = (): ReadonlyMap<string, number> => {
  const found = new Map<string, number>()
  for (let n = PREAMBLE_LINE; n < PROHIBITION_INTRO_LINE; n += 1) {
    const m = /^\*\*`(AI-\d\d)` — /.exec(L(n))
    if (m !== null) found.set(m[1] as string, n)
  }
  return found
}

/**
 * A paragraph's `*Label:*` runs, re-parsed. The value of a run is everything
 * up to the next run, or to the end of the paragraph for the last one — which
 * is what makes a dropped trailing clause visible.
 */
const parseAttributeRuns = (paragraph: string): readonly { label: string; value: string }[] => {
  const marks = [...paragraph.matchAll(/\*([^*]+?):\*/g)]
  return marks.map((mark, index) => {
    const start = (mark.index ?? 0) + mark[0].length
    const end = index + 1 < marks.length ? (marks[index + 1]?.index ?? paragraph.length) : paragraph.length
    return { label: mark[1] as string, value: paragraph.slice(start, end).trim() }
  })
}

describe('the attribute axis, from the register’s own preamble', () => {
  it('carries the preamble’s attributes, in the preamble’s order and its words', () => {
    expect(lineOf(ABILITY_ATTRIBUTE_PREAMBLE_REF)).toBe(PREAMBLE_LINE)
    const declared = L(PREAMBLE_LINE)
      .split('Each ability below carries:')[1]
      ?.replace(/\.$/, '')
      .split(';')
      .map((s) => s.trim())
    expect(declared).toBeDefined()
    expect(ABILITY_ATTRIBUTES.map((a) => a.preambleWording)).toEqual(declared)
  })

  it('names each attribute once, so no two attributes share a key', () => {
    const names = ABILITY_ATTRIBUTES.map((a) => a.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('the ability register', () => {
  it('registers every ability paragraph the source enumerates, at the line it is on', () => {
    const measured = measuredAbilityLines()
    expect(measured.size).toBeGreaterThan(0)
    expect(AI_ABILITY_REGISTER.map((a) => a.id)).toEqual([...measured.keys()])
    expect(AI_ABILITY_IDS).toEqual([...measured.keys()])
    for (const ability of AI_ABILITY_REGISTER) {
      expect(lineOf(ability.sourceRef)).toBe(measured.get(ability.id))
    }
  })

  it('titles each ability with the source’s own heading for it', () => {
    for (const ability of AI_ABILITY_REGISTER) {
      const heading = /^\*\*`AI-\d\d` — (.+?)\*\*/.exec(L(lineOf(ability.sourceRef)))
      expect(heading, ability.id).not.toBeNull()
      expect(ability.title).toBe((heading?.[1] as string).replace(/\.$/, ''))
    }
  })

  it('quotes every attribute value WHOLE — re-parsed from the paragraph, not merely found in it', () => {
    for (const ability of AI_ABILITY_REGISTER) {
      const runs = parseAttributeRuns(L(lineOf(ability.sourceRef)))
      if (ability.notSpecified === null) {
        expect(runs.map((r) => r.label), ability.id).toEqual(ability.attributes.map((a) => a.label))
        expect(runs.map((r) => r.value), ability.id).toEqual(ability.attributes.map((a) => a.value))
      } else {
        // The one ability the source writes as a single collective run.
        expect(runs.map((r) => r.label), ability.id).toEqual([ability.notSpecified.collectiveLabel])
        const collective = runs[0]?.value ?? ''
        expect(collective, ability.id).toContain(ability.notSpecified.literal)
        expect(collective, ability.id).toContain(ability.notSpecified.reason)
        expect(collective, ability.id).toContain(ability.notSpecified.fixedAttributesLead)
        const declaredFixed = collective
          .split(ability.notSpecified.fixedAttributesLead)[1]
          ?.replace(/\.$/, '')
          .split(';')
          .map((s) => s.trim())
        expect(ability.notSpecified.fixedAttributes).toEqual(declaredFixed)
      }
    }
  })

  it('populates all fourteen attributes for every ability, with the source’s own literal where unstated — TEST-AI-016-A', () => {
    const testRow = soleLineCarrying('`TEST-AI-016-A`')
    expect(L(testRow)).toContain('assert each of the fourteen attributes is populated for every ability')
    expect(L(testRow)).toContain('`Not specified in the Statement of Work`')

    const axis = ABILITY_ATTRIBUTES.map((a) => a.name)
    for (const ability of AI_ABILITY_REGISTER) {
      expect(ability.attributes.map((a) => a.attribute), ability.id).toEqual(axis)
      for (const attr of ability.attributes) {
        expect(attr.value.length, `${ability.id} ${attr.attribute}`).toBeGreaterThan(0)
        if (ability.notSpecified !== null) {
          expect(attr.value, `${ability.id} ${attr.attribute}`).toBe(ability.notSpecified.literal)
        }
      }
    }
  })

  it('keeps the ability axis and the attribute axis apart — they are two axes, not one count', () => {
    const abilities = measuredAbilityLines().size
    const attributes = L(PREAMBLE_LINE)
      .split('Each ability below carries:')[1]
      ?.replace(/\.$/, '')
      .split(';').length
    expect(abilities).not.toBe(attributes)
    expect(AI_ABILITY_REGISTER.length).toBe(abilities)
    expect(ABILITY_ATTRIBUTES.length).toBe(attributes)
  })
})

describe('the three load-bearing values the dispatch names, quoted whole', () => {
  const valueOf = (id: AiAbilityId, name: (typeof ABILITY_ATTRIBUTES)[number]['name']): string =>
    abilityAttribute(aiAbility(AI_ABILITY_REGISTER, id), name).value

  it('AI-01’s human approval keeps the authoring-time clause AND the DEC-GATE-001 clause', () => {
    const value = valueOf('AI-01', 'humanApproval')
    expect(value).toContain('governance binding `authoring-time policy`')
    expect(value).toContain('there is no per-event runtime gate')
    expect(value).toContain('the source disagreement stays on the record in `DEC-GATE-001`')
  })

  it('AI-04’s validation gate keeps the reason the launch is on-device', () => {
    const value = valueOf('AI-04', 'validationGates')
    expect(value).toContain('every step must be fully renderable from the work package with no server call')
    expect(value).toContain('because a step that requires a server lookup cannot be a launch-time step')
  })

  it('AI-07 ages and re-routes rather than expiring, and its window is severity-dependent', () => {
    expect(valueOf('AI-07', 'expiry')).toContain('the item never expires; it ages and re-routes')
    const gate = valueOf('AI-07', 'validationGates')
    expect(gate).toContain('window of 10 minutes at Severity 1, 30 minutes otherwise')
    expect(gate).toContain('never executes on its own')
  })
})

describe('AI-13 is a stated absence with its reason, and no coming-soon agent', () => {
  const vision = AI_ABILITY_REGISTER.find((a) => a.notSpecified !== null) as AiAbility

  it('is the only ability the source writes as unspecified', () => {
    expect(AI_ABILITY_REGISTER.filter((a) => a.notSpecified !== null)).toHaveLength(1)
    expect(vision.id).toBe('AI-13')
  })

  it('names its fixed attributes from the source rather than leaving the axis empty', () => {
    const fixed = vision.notSpecified?.fixedAttributes ?? []
    expect(fixed.length).toBeGreaterThan(0)
    for (const attribute of fixed) expect(L(lineOf(vision.sourceRef))).toContain(attribute)
  })

  it('carries SB-AI-006’s ruling verbatim at the line that states it', () => {
    const rule = vision.notSpecified?.renderingRule ?? ''
    const ruleLine = soleLineCarrying('**Storyboard `SB-AI-006`')
    expect(lineOf(vision.notSpecified?.renderingRuleRef ?? 'L0')).toBe(ruleLine)
    expect(L(ruleLine)).toContain(rule)
    expect(rule).toContain('the platform must not display a greyed-out "coming soon" agent')
  })

  /**
   * THREE TABLES IN THE FROZEN SOURCE CARRY `DEC-VISION` ROWS and only one of
   * them raises the whole set: chapter 40's new-decision register carries
   * `DEC-VISION-001` alone, chapter 44A's register carries all six, and the
   * appendix occurrence index carries six again as counts. So "the register
   * that raises them" is the longest CONTIGUOUS run, derived here rather than
   * located — which is also how the dispatch's L95384-L95389 was found to be
   * two lines short at both ends.
   */
  const longestContiguousVisionRun = (): readonly { id: string; line: number }[] => {
    const rows = LINES.reduce<{ id: string; line: number }[]>((acc, text, index) => {
      const m = index > 0 ? /^\| `(DEC-VISION-\d+)` \|/.exec(text) : null
      if (m !== null) acc.push({ id: m[1] as string, line: index })
      return acc
    }, [])
    let best: { id: string; line: number }[] = []
    let run: { id: string; line: number }[] = []
    for (const row of rows) {
      const prev = run[run.length - 1]
      run = prev !== undefined && row.line === prev.line + 1 ? [...run, row] : [row]
      if (run.length > best.length) best = run
    }
    return best
  }

  it('pins every DEC-VISION row of the register that raises them, at the line that carries it', () => {
    const decisions = vision.notSpecified?.openDecisions ?? []
    const measured = longestContiguousVisionRun()
    expect(measured.length).toBeGreaterThan(0)
    expect(decisions.map((d) => d.id)).toEqual(measured.map((m) => m.id))
    expect(decisions.map((d) => lineOf(d.sourceRef))).toEqual(measured.map((m) => m.line))
    expect(new Set(decisions.map((d) => d.id)).size).toBe(decisions.length)
    for (const decision of decisions) {
      expect(L(lineOf(decision.sourceRef)).startsWith(`| \`${decision.id}\` |`)).toBe(true)
    }
  })
})

describe('the lookups', () => {
  it('returns the registered ability', () => {
    expect(aiAbility(AI_ABILITY_REGISTER, 'AI-07').title).toBe(
      'Beyond-policy containment proposal',
    )
  })

  it('refuses an unregistered ability rather than returning an approximation', () => {
    expect(() => aiAbility(AI_ABILITY_REGISTER, 'AI-99' as AiAbilityId)).toThrow(/AI-99/)
  })

  it('refuses an attribute the ability does not carry', () => {
    const ability = aiAbility(AI_ABILITY_REGISTER, 'AI-01')
    expect(() =>
      abilityAttribute(ability, 'notAnAttribute' as (typeof ABILITY_ATTRIBUTES)[number]['name']),
    ).toThrow(/notAnAttribute/)
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import {
  MODULE_ACCEPTANCE_CRITERIA,
  MODULE_TESTS,
  UNRESOLVED_IN_SOURCE,
  spelled,
} from '../../app/hub/shift-management/fixtures'
import {
  A7_FUNCTIONALITIES,
  CHAPTER_FUNCTIONALITIES_NAMING_NO_PATTERN,
  CHAPTER_NAMING_NO_PATTERN_TOTAL,
  CHAPTER_NAMING_NO_PATTERN_ELSEWHERE,
} from '@/frontline/modules/fl-a7/service'
import { A1_FUNCTIONALITIES } from '@/frontline/modules/fl-a1/service'
import { A2_FUNCTIONALITIES } from '@/frontline/modules/fl-a2/service'
import { A3_FUNCTIONALITIES } from '@/frontline/modules/fl-a3/service'
import { FLA4_FUNCTIONALITIES } from '@/frontline/modules/fl-a4/service'
import { A5_FUNCTIONALITIES } from '@/frontline/modules/fl-a5/service'
import { A6_FUNCTIONALITIES } from '@/frontline/modules/fl-a6/service'
import { B8_FUNCTIONALITIES } from '@/frontline/modules/fl-b8/service'
import { B9_FUNCTIONALITIES } from '@/frontline/modules/fl-b9/service'
import { B10_FUNCTIONALITIES } from '@/frontline/modules/fl-b10/service'
import { B11_FUNCTIONALITIES } from '@/frontline/modules/fl-b11/service'
import { B12_FUNCTIONALITIES } from '@/frontline/modules/fl-b12/service'

/**
 * TWO FIGURES THIS BUILD PRINTS TO A READER AS FACTS ABOUT THE FROZEN SOURCE,
 * HELD TO SOMETHING THAT IS NOT THE SENTENCE ITSELF.
 *
 * Round 4 findings R4-C02 and R4-C03. Both were hand-typed integers inside a
 * rendered string: "the nine acceptance criteria" against a chapter carrying
 * six, and "Twelve functionalities elsewhere in this chapter name none"
 * against a chapter where the figure is twenty-eight. Neither had a gate,
 * because the only thing either number had to agree with was itself.
 *
 * Each is now DERIVED from a set, and this file holds each set to an
 * INDEPENDENT authority — the locator index, which is a scan of the frozen
 * source, and the eleven sibling modules' own data.
 */

const LOCATORS = JSON.parse(readFileSync('registries/blueprint-locators.json', 'utf8')) as {
  source: { sha256: string; lines: number }
  index: Record<string, number[]>
}

describe('R4-C02 · MOD-DOH-03 counts its own criteria and tests', () => {
  it('reads the locator index built from the frozen source this build was written against', () => {
    expect(LOCATORS.source.sha256).toBe(
      '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27',
    )
    expect(LOCATORS.source.lines).toBe(122241)
  })

  it('lists exactly the AC-DOH-03-* the source carries, and no more', () => {
    const fromSource = Object.keys(LOCATORS.index)
      .filter((id) => /^AC-DOH-03-\d+$/.test(id))
      .sort()
    expect(fromSource.length).toBeGreaterThan(0)
    expect([...MODULE_ACCEPTANCE_CRITERIA].sort()).toEqual(fromSource)
  })

  it('lists exactly the TEST-DOH-03-* the source carries, and no more', () => {
    const fromSource = Object.keys(LOCATORS.index)
      .filter((id) => /^TEST-DOH-03-[A-Z0-9]+$/.test(id))
      .sort()
    expect(fromSource.length).toBeGreaterThan(0)
    expect([...MODULE_TESTS].sort()).toEqual(fromSource)
  })

  /**
   * The rendered sentence, read back. Asserting the arrays alone would leave
   * the prose free to carry a fourth hand-typed number beside them, which is
   * the whole shape of this finding.
   */
  it('renders those counts, spelled, in the sentence a reader sees', () => {
    const sentence = UNRESOLVED_IN_SOURCE.find((s) => s.includes('acceptance criteria'))
    expect(sentence).toBeDefined()
    expect(sentence).toContain(`not in the ${spelled(MODULE_ACCEPTANCE_CRITERIA.length)} acceptance criteria`)
    expect(sentence).toContain(`not in the ${spelled(MODULE_TESTS.length)} tests`)
    // The measured values, written out so this test states a fact rather than
    // restating whatever the fixtures happen to hold.
    expect(sentence).toContain('not in the six acceptance criteria, not in the ten tests')
    expect(sentence).not.toContain('nine acceptance criteria')
  })
})

/**
 * The eleven siblings' own functionality data, each module's count computed by
 * the SHARED rule (`functionalitiesNamingNoPattern`) rather than read off a
 * sibling's prose.
 */
const SIBLING_COUNTS: Readonly<Record<string, readonly { readonly patterns: readonly string[] }[]>> =
  {
    'MOD-FL-A1': A1_FUNCTIONALITIES,
    'MOD-FL-A2': A2_FUNCTIONALITIES,
    'MOD-FL-A3': A3_FUNCTIONALITIES,
    'MOD-FL-A4': FLA4_FUNCTIONALITIES,
    'MOD-FL-A5': A5_FUNCTIONALITIES,
    'MOD-FL-A6': A6_FUNCTIONALITIES,
    'MOD-FL-A7': A7_FUNCTIONALITIES,
    'MOD-FL-B8': B8_FUNCTIONALITIES,
    'MOD-FL-B9': B9_FUNCTIONALITIES,
    'MOD-FL-B10': B10_FUNCTIONALITIES,
    'MOD-FL-B11': B11_FUNCTIONALITIES,
    'MOD-FL-B12': B12_FUNCTIONALITIES,
  }

describe('R4-C03 · the chapter-wide FB-FL-* gap MOD-FL-A7 reports', () => {
  it('holds the table to all twelve modules by equality, entry by entry', () => {
    const measured = Object.fromEntries(
      Object.entries(SIBLING_COUNTS).map(([id, fns]) => [
        id,
        functionalitiesNamingNoPattern(
          fns as readonly { readonly id: string; readonly patterns: readonly never[] }[],
        ).length,
      ]),
    )
    // Equality on the OBJECT, so a thirteenth module or a missing one reds too.
    expect(CHAPTER_FUNCTIONALITIES_NAMING_NO_PATTERN).toEqual(measured)
  })

  it('sums to the measured chapter figure, and MOD-FL-A7 contributes nothing', () => {
    // Measured over the frozen source directly, with the family segment
    // allowed to carry digits so `FB-FL-SEV1-01` is seen:
    //   181 FUNC entries in the chapter, 28 of them naming no FB-FL-* pattern.
    expect(CHAPTER_NAMING_NO_PATTERN_TOTAL).toBe(28)
    expect(CHAPTER_FUNCTIONALITIES_NAMING_NO_PATTERN['MOD-FL-A7']).toBe(0)
    expect(CHAPTER_NAMING_NO_PATTERN_ELSEWHERE).toBe(28)
    expect(Object.keys(CHAPTER_FUNCTIONALITIES_NAMING_NO_PATTERN)).toHaveLength(12)
  })

  it('counts 181 functionalities across the twelve modules, matching the chapter', () => {
    const total = Object.values(SIBLING_COUNTS).reduce((n, fns) => n + fns.length, 0)
    expect(total).toBe(181)
  })
})

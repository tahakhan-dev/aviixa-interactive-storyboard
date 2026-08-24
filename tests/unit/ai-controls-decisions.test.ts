import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import {
  APP_012_LABEL,
  FEAT_SA_0702_COLLISION,
  LOCAL_OPEN_DECISIONS,
  MEMBERSHIP_IS_MEASURED,
  PAUSE_FEATURE_ATTRIBUTION,
  localDecision,
} from '@/ai/controls/decisions'

/**
 * THE FOUR DECISIONS DISCLOSED LOCALLY, AND THE ONE THE SOURCE DOES ATTRIBUTE.
 *
 * WHAT EACH CASE BELOW IS FOR:
 *
 *   1. A DECISION SILENTLY REGISTERED IN THE CANON. All four are asserted
 *      absent from `OPEN_DECISION_IDS` here, and the module itself throws at
 *      load if one appears — so two homes for one decision is a loud failure
 *      rather than a stale sentence.
 *   2. A READING WITH A LOCATOR THAT DOES NOT CARRY IT. Every locator of every
 *      reading is opened and required to name the decision it is cited for, or
 *      to carry the identifier the reading quotes. Nine controller locator
 *      errors in the last wave were found exactly this way.
 *   3. AN ADOPTED POSITION PRESENTED AS THE SOURCE'S. Every record carries its
 *      build position and the APP-012 label is required to say it is a build
 *      approval and not a frozen-source fact.
 *   4. `DEC-AIRTO-001` GIVEN A NUMBER. The record is scanned for a digit and
 *      for a spelled-out duration, because L87880 says inventing one is a
 *      defect and an invented value arrives in either spelling.
 *   5. `FEAT-SA-0702` RESOLVED TO ONE MEANING. Both owners are asserted, both
 *      locators opened, and nothing asserts which is canonical.
 *   6. THE PAUSE FEATURE'S ATTRIBUTION CONFLATED WITH THE MATRIX'S. The pause
 *      feature IS source-attributed (L47803). The matrix is not, and the record
 *      is required to say so in its own words.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

describe('the frozen source these disclosures were read from', () => {
  it('is the bytes every locator below names', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('the four are disclosed locally because the canon does not hold them', () => {
  it('names them as a literal list, declared outside the module', () => {
    expect(LOCAL_OPEN_DECISIONS.map((d) => d.id)).toEqual([
      'DEC-PAUSE-001',
      'DEC-KILL-001',
      'DEC-AIPAUSE-001',
      'DEC-AIRTO-001',
    ])
    expect(MEMBERSHIP_IS_MEASURED).toEqual(LOCAL_OPEN_DECISIONS.map((d) => d.id))
  })

  it('is none of them a member of the canon\'s exported identifier union', () => {
    // MEASURED, not asserted in prose. The module throws at load if one is
    // registered, which is what turns a wave-5 registration into a loud
    // failure instead of a second home nobody notices.
    for (const decision of LOCAL_OPEN_DECISIONS) {
      expect(OPEN_DECISION_IDS as readonly string[], decision.id).not.toContain(decision.id)
    }
  })

  /**
   * THE FOUR LOCATORS THAT DO NOT CARRY THEIR DECISION'S IDENTIFIER, AND WHAT
   * EACH ONE MUST CARRY INSTEAD.
   *
   * Measured, not assumed: of the twenty locators these four records name,
   * sixteen carry the identifier they are cited for on the cited line. The
   * remaining four are cited for something the line says WITHOUT naming the
   * decision — a role card's approval row, a role card's feature list, the
   * §43.3.5 narrative item, and the authority matrix row. Each is pinned to a
   * verbatim fragment of its own line, so a locator moved off it goes red.
   *
   * This list is the reason the check is not "the identifier is on the line":
   * that rule would convict four correct citations, and a gate that cries wolf
   * gets loosened until it convicts nothing. Which is what happened here — the
   * assertion this replaces was `expect(line).not.toBe('')`, and a locator off
   * by thousands of lines passed it.
   */
  const ANCHORS_FOR_LINES_WITHOUT_THE_IDENTIFIER: Readonly<Record<string, string>> = {
    'DEC-PAUSE-001/L15939': 'None. The role approves nothing; it submits.',
    'DEC-PAUSE-001/L15945': 'emergency pause proposal (`FEAT-SA-0702`)',
    'DEC-KILL-001/L91231': 'The runaway-loop kill switch is a named Orchestration control',
    'DEC-KILL-001/L91290': '| Runaway-loop kill switch |',
  }

  it('opens every locator of every reading and finds the decision it is cited for', () => {
    // THE CHECK, AND IT IS NOT "THE LINE IS NON-BLANK". A blank-line check
    // convicts one failure mode — the off-by-one onto a separator — and passes
    // every other wrong line in the file. All twenty-three locators here
    // resolve correctly today; this rewrite is so that they can be known to.
    let checked = 0
    for (const decision of LOCAL_OPEN_DECISIONS) {
      const locators = [
        ...decision.locators,
        ...decision.readings.map((reading) => reading.locator),
      ]
      for (const locator of new Set(locators)) {
        const line = lineAt(Number(locator.replace(/^L/, '')))
        const where = `${decision.id} cites ${locator}`
        expect(line, where).not.toBe('')
        const anchor = ANCHORS_FOR_LINES_WITHOUT_THE_IDENTIFIER[`${decision.id}/${locator}`]
        if (anchor === undefined) {
          expect(line, `${where} and that line does not name it`).toContain(decision.id)
        } else {
          expect(line, `${where} on the strength of a fragment it does not carry`).toContain(anchor)
          // And the identifier really is absent, so an anchor entry cannot be
          // added to excuse a line that would have passed the plain rule.
          expect(line, `${where} — this anchor entry is unnecessary`).not.toContain(decision.id)
        }
        checked += 1
      }
      // Every locator a reading names is also in the record's locator set, so
      // a reader following the record reaches every line it rests on.
      for (const reading of decision.readings) {
        expect(decision.locators, `${decision.id} ${reading.locator}`).toContain(reading.locator)
      }
    }
    // Not a pinned count — a floor, so the loop cannot silently check nothing.
    expect(checked).toBeGreaterThan(Object.keys(ANCHORS_FOR_LINES_WITHOUT_THE_IDENTIFIER).length)
  })

  it('labels every adopted position a build approval under APP-012', () => {
    expect(APP_012_LABEL).toMatch(/APP-012/)
    expect(APP_012_LABEL).toMatch(/build approval/)
    for (const decision of LOCAL_OPEN_DECISIONS) {
      expect(decision.buildPosition.trim(), decision.id).not.toBe('')
      expect(decision.whyLocal, decision.id).toMatch(/exported identifier union/)
    }
  })
})

describe('DEC-PAUSE-001 and its fourth reading', () => {
  it('carries the source\'s own statement of the gap, from L87799', () => {
    expect(lineAt(87_799)).toContain(
      'The Statement of Work does not state who may initiate a pause, nor what happens when the ' +
        'root is unavailable.',
    )
  })

  it('carries the Platform Engineer role card as a PROPOSAL right and not an initiation grant', () => {
    const fourth = localDecision('DEC-PAUSE-001').readings.find((r) => r.locator === 'L15945')
    expect(fourth).toBeDefined()
    expect(fourth?.text).toMatch(/PROPOSAL right and not an initiation right/)
    expect(lineAt(15_945)).toContain('emergency pause proposal (`FEAT-SA-0702`)')
    // And the same card approves nothing, which is what makes it a proposal.
    expect(lineAt(15_939)).toContain('None. The role approves nothing; it submits.')
  })

  it('cites L87801 for the card and L87799 for the gap, which are different lines', () => {
    expect(lineAt(87_801)).toContain('`DEC-PAUSE-001` — pause initiation and root unavailability')
    expect(lineAt(87_800)).toBe('')
  })
})

describe('DEC-KILL-001', () => {
  it('carries the card at L87797 and the register row at L88905', () => {
    expect(lineAt(87_797)).toContain('`DEC-KILL-001` — the runaway-loop kill switch')
    expect(lineAt(88_905)).toContain('`DEC-KILL-001`')
    expect(lineAt(88_905)).toContain('Runaway-loop kill switch scope, threshold, authority and class')
  })

  it('carries the matrix cell that is permissive and undecided at once', () => {
    const reading = localDecision('DEC-KILL-001').readings.find((r) => r.locator === 'L91290')
    expect(reading?.text).toMatch(/simultaneously permissive and undecided/)
  })
})

describe('DEC-AIRTO-001 — no value, in either spelling', () => {
  it('quotes the source\'s own refusal from L87880', () => {
    expect(lineAt(87_880)).toContain('No value is proposed here. Inventing one would be a defect.')
    expect(localDecision('DEC-AIRTO-001').readings[0]?.text).toContain(
      'No value is proposed here. Inventing one would be a defect.',
    )
  })

  it('carries no duration anywhere in the record, as a digit or as a word', () => {
    // The default-scan, applied to the one decision whose whole content is a
    // refused number. A seeded value arrives as `30` or as `thirty minutes`,
    // and a digit rule alone was measured missing the word form.
    const record = localDecision('DEC-AIRTO-001')
    const text = [
      record.question,
      record.buildPosition,
      ...record.readings.map((r) => r.text),
    ].join(' ')
    // Identifiers, section references and locators are the SOURCE's own
    // numbers and are removed before scanning; anything numeric left is a
    // figure this build wrote, which is what L87880 forbids. The exemption
    // list is narrow on purpose — it names the four citation forms the source
    // uses and nothing else, so a duration cannot hide inside one.
    const scrubbed = text
      .replaceAll(/DEC-[A-Z0-9]+-\d+/g, '')
      .replaceAll(/§[\d.]+/g, '')
      .replaceAll(/\bL\d+\b/g, '')
      .replaceAll(/\bsection \d+(?:\.\d+)*/gi, '')
      .replaceAll(/\(?[abc]\)/g, '')
    expect(scrubbed, 'a numeral in the recovery-objective record').not.toMatch(/\d/)
    expect(scrubbed, 'a spelled-out duration in the recovery-objective record').not.toMatch(
      /\b(one|two|three|four|five|six|ten|fifteen|thirty|sixty|ninety)\s+(second|minute|hour|day)/i,
    )
  })
})

describe('FEAT-SA-0702 names two features and this build resolves neither', () => {
  it('carries both owners with both locators, and both lines say what the record says', () => {
    expect(FEAT_SA_0702_COLLISION.owners.map((o) => o.locator)).toEqual(['L47802', 'L15945'])
    expect(lineAt(47_802)).toContain('FEAT-SA-0702 | Global severity catalog and floor register')
    expect(lineAt(15_945)).toContain('emergency pause proposal (`FEAT-SA-0702`)')
    expect(FEAT_SA_0702_COLLISION.finding).toMatch(/no cross-reference/)
  })

  it('occurs on exactly those two lines and nowhere else in the frozen source', () => {
    const occurrences = sourceLines
      .map((line, index) => (line.includes('FEAT-SA-0702') ? index + 1 : null))
      .filter((n): n is number => n !== null)
    expect(occurrences).toEqual([15_945, 47_802])
  })
})

describe('the pause FEATURE is source-attributed, and the matrix is not', () => {
  it('reads all three identifiers, the actor, the fallback and the class off L47803', () => {
    const line = lineAt(47_803)
    expect(line).toContain('MOD-SA-07')
    expect(line).toContain('FEAT-SA-0703 | The emergency pause')
    expect(line).toContain('SUB-SA-0703 | Checkpoint at stage boundary, resume separately')
    expect(line).toContain(
      'FUNC-SA-0703 | Render agent unavailability honestly and never suppress the on-device ' +
        'deterministic layer',
    )
    expect(line).toContain('Root Super Admin')
    expect(line).toContain('FB-AI-01')
    expect(line).toContain('SoW Fact — §8.7.5')
    expect(PAUSE_FEATURE_ATTRIBUTION.sourceRef).toBe('L47803')
    expect(PAUSE_FEATURE_ATTRIBUTION.feature.id).toBe('FEAT-SA-0703')
    expect(PAUSE_FEATURE_ATTRIBUTION.subFeature.id).toBe('SUB-SA-0703')
    expect(PAUSE_FEATURE_ATTRIBUTION.function.id).toBe('FUNC-SA-0703')
    expect(PAUSE_FEATURE_ATTRIBUTION.fallback).toBe('FB-AI-01')
  })

  it('opens both siblings and finds them on their own lines', () => {
    for (const sibling of PAUSE_FEATURE_ATTRIBUTION.siblings) {
      expect(lineAt(Number(sibling.locator.replace(/^L/, '')))).toContain(sibling.id)
    }
  })

  it('says in its own words that it licenses no claim about the authority matrix', () => {
    expect(PAUSE_FEATURE_ATTRIBUTION.whatItDoesNotLicense).toMatch(/nowhere in chapter 43/)
    expect(PAUSE_FEATURE_ATTRIBUTION.whatItDoesNotLicense).toMatch(/build inference/)
  })

  it('is true that MOD-SA-07 occurs nowhere in chapter 43', () => {
    // The sweep the claim rests on, run rather than trusted. Chapter 43 runs
    // from its first section heading to the line before chapter 44 opens.
    const inChapter43 = sourceLines
      .slice(89_880 - 1, 91_585)
      .filter((line) => line.includes('MOD-SA-07'))
    expect(inChapter43).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import {
  STORYBOARD_CARD_FIELDS,
  STORYBOARD_CARD_HEADER_REFS,
  STORYBOARD_SURFACE_TABLE_REFS,
  storyboardCardRows,
} from '@/ai/storyboards/contract'
import { storyboardViolations } from '@/ai/storyboards/invariants'
import { ownerAt } from '@/ai/fallbacks/registry'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import {
  SB_21_TO_30,
  SB_21_TO_30_CONTRACT_SEAMS,
  SB_21_TO_30_CRITERIA,
  SB_21_TO_30_CROSS_REFERENCED_FALLBACKS,
  SB_21_TO_30_DECISION_CITATIONS,
  SB_21_TO_30_DISCLOSED_VIOLATIONS,
  type TranscribedStoryboard,
} from '@/ai/storyboards/sb-21-to-30/storyboards'

/**
 * Slice 11 · wave 4 · task 18 — storyboards 44A.21 to 44A.30.
 *
 * This file asserts the DATA. The shape, the surface order, the compound
 * fallback key and the nine render-time invariants are task 15A's and are
 * consumed here, never redeclared: every check below either runs 15A's own
 * exported function or compares a transcription against the frozen source.
 *
 * ── WHY THE VIOLATION ASSERTION IS NOT `toEqual([])` FOR ALL TEN ────────────
 * It is, for nine. Storyboard 25 is the only card in the chapter that carries
 * `SCR-FL-LOCK-01`, whose wording L94876 fixes and declares "authored in both
 * supported languages as approved content". The frozen source writes no
 * Spanish string for it, so 15A's `fixedMessageIsNotParaphrased` reports the
 * absent Spanish rendering against `TEST-44A-004` (L92757). That report is
 * TRUE and is left standing rather than suppressed: the alternative — omitting
 * the fixed message from the card so the check has nothing to look at — would
 * silence the one prohibition the source states about this exact message. So
 * the expected violation is declared as data, by identifier, and asserted
 * exactly. A tenth violation appearing anywhere still turns this red.
 */

const BLUEPRINT = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

/** The frozen source's line `n`, 1-based, as the `L` locators name it. */
function sourceLine(locator: string): string {
  const n = Number(locator.replace(/^L/, ''))
  return BLUEPRINT[n - 1] ?? ''
}

/**
 * THE TEN, AS A LITERAL LIST DECLARED OUTSIDE THE MODULE UNDER TEST.
 *
 * Not `SB_21_TO_30.map(s => s.number)`, which would agree with any set the
 * module happened to hold, and not a length, which agrees with any
 * substitution. Adding an eleventh member here goes red naming it.
 */
const EXPECTED_NUMBERS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const

/**
 * The nineteen field labels as THIS task read them off the cards, transcribed
 * independently of 15A's list so that agreement is evidence rather than a
 * tautology. Every one was read from a card's own first column.
 */
const FIELD_LABELS_AS_READ = [
  'Identifier',
  'Preconditions',
  'Trigger',
  'Actors and roles',
  'Worker-visible experience',
  'Automatic fallback',
  'Manual fallback',
  'Fallback-of-fallback',
  'Safe stop',
  'Local data',
  'Central data',
  'Notifications',
  'Reconnection',
  'Conflict resolution',
  'Final official state',
  'Audit',
  'Recovery Time Objective and Recovery Point Objective',
  'Residual risk',
  'Source status',
] as const

/** The surface tuple as read from the ten surface tables in this task's range. */
const SURFACE_NAMES_AS_READ = [
  'Delivery Operations Hub',
  'Standards and Operations Studio',
  'Client Command Center',
  'Frontline Worker Application',
  'Super Admin platform console',
] as const

function card(number: number): TranscribedStoryboard {
  const found = SB_21_TO_30.find((storyboard) => storyboard.number === number)
  if (found === undefined) throw new Error(`No storyboard ${number} in this task's ten.`)
  return found
}

describe('storyboards 44A.21 to 44A.30 — the set', () => {
  it('holds exactly the ten this task owns, in order', () => {
    expect(SB_21_TO_30.map((storyboard) => storyboard.number)).toEqual([...EXPECTED_NUMBERS])
  })

  it('names each card SB-AI-NN on its own identifier row', () => {
    for (const storyboard of SB_21_TO_30) {
      expect(storyboard.identifier).toBe(`SB-AI-${storyboard.number}`)
    }
  })
})

describe('storyboards 44A.21 to 44A.30 — the nine invariants', () => {
  /**
   * `AC-44A-001` … `AC-44A-005` and the six render-time prohibitions, run as
   * 15A wrote them. Nothing is added to that module and nothing is skipped:
   * `storyboardViolations` runs the whole list, so a tenth invariant added
   * upstream applies here without this file changing.
   */
  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} reports only its disclosed violations`, () => {
      const disclosed = SB_21_TO_30_DISCLOSED_VIOLATIONS.filter(
        (entry) => entry.storyboard === number,
      )
      const actual = storyboardViolations(card(number))
      expect(
        actual.map((breach) => ({
          invariant: breach.invariant,
          sourceRef: breach.sourceRef,
        })),
      ).toEqual(disclosed.map((entry) => ({ invariant: entry.invariant, sourceRef: entry.sourceRef })))
    })
  }

  it('discloses a violation only where the source leaves one standing', () => {
    // The disclosure list is not a mute button. Every entry names the line the
    // check fires on AND the line that makes the gap the source's rather than
    // this build's, so a reviewer can open both.
    for (const entry of SB_21_TO_30_DISCLOSED_VIOLATIONS) {
      expect(entry.whyItStands).not.toBe('')
      expect(sourceLine(entry.sourceRef)).not.toBe('')
      expect(sourceLine(entry.sourceStatesTheGapAt)).not.toBe('')
    }
  })
})

describe('storyboards 44A.21 to 44A.30 — the nineteen fields', () => {
  it('reads the same nineteen labels this task counted off the cards', () => {
    expect(STORYBOARD_CARD_FIELDS.map((field) => field.label)).toEqual([...FIELD_LABELS_AS_READ])
  })

  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} renders all nineteen fields with content`, () => {
      const rows = storyboardCardRows(card(number))
      expect(rows.map((row) => row.label)).toEqual([...FIELD_LABELS_AS_READ])
      for (const row of rows) {
        expect(row.content.trim(), `${number} · ${row.label}`).not.toBe('')
      }
    })
  }
})

describe('storyboards 44A.21 to 44A.30 — the five surfaces', () => {
  it('reads the same surface tuple this task counted off the tables', () => {
    expect(JOURNEY_SURFACES.map((surface) => surface.name)).toEqual([...SURFACE_NAMES_AS_READ])
  })

  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} answers for all five surfaces with a reason where absent`, () => {
      const surfaces = card(number).surfaces
      for (const surface of JOURNEY_SURFACES) {
        const effect = surfaces[surface.code]
        // A surface with no effect renders "No direct effect" WITH the reason.
        // The reason is what makes the absence a rendering rather than a gap,
        // so an empty one is the defect this asserts against.
        const text = effect.kind === 'affected' ? effect.statement : effect.reason
        expect(text.trim(), `${number} · ${surface.name}`).not.toBe('')
        expect(effect.sourceRef).toMatch(/^L\d+$/)
      }
    })
  }
})

describe('storyboards 44A.21 to 44A.30 — locators against the frozen source', () => {
  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} pins the card header and surface table 15A measured`, () => {
      const storyboard = card(number)
      expect(storyboard.cardHeaderRef).toBe(STORYBOARD_CARD_HEADER_REFS[number - 1])
      expect(storyboard.surfaceTableRef).toBe(STORYBOARD_SURFACE_TABLE_REFS[number - 1])
    })

    it(`storyboard ${number}'s card header carries the card header row`, () => {
      expect(sourceLine(card(number).cardHeaderRef)).toBe('| Storyboard field | Content |')
    })

    it(`storyboard ${number}'s surface table carries the surface header row`, () => {
      expect(sourceLine(card(number).surfaceTableRef)).toBe('| Surface | Reaction |')
    })

    it(`storyboard ${number}'s identifier row sits two lines below its header`, () => {
      // 15A measured this for all thirty and it is the anchor this task
      // transcribed from: the header is two lines above the `Identifier` row,
      // and `SB-AI-NN` is on that row, not on the header.
      const header = Number(card(number).cardHeaderRef.replace(/^L/, ''))
      expect(sourceLine(`L${header + 2}`)).toContain(`\`SB-AI-${number}\``)
    })
  }
})

describe('storyboards 44A.21 to 44A.30 — every locator this task writes', () => {
  /**
   * EVERY `L`-NUMBER IN THIS TASK'S THREE FILES POINTS AT A LINE WITH CONTENT.
   *
   * This gate exists because this task shipped the defect it catches. The
   * brief's own table gave a `Section span` per storyboard, and **all ten span
   * end lines are blank** — each is the separator before the next `###`
   * header, so the last CONTENT line of every section is one earlier, its
   * `**Source classification.**` paragraph. Two of those blank ends were cited
   * here as span locators — storyboard 29's and storyboard 30's — before
   * this scan was written; both now name the content-end instead. The wrong
   * numbers are deliberately NOT spelled in this comment: an `L`-number in a
   * comment is a citation to the lexer whatever the surrounding prose says
   * about it, so naming them as counter-examples would reintroduce exactly the
   * defect being described. This gate caught that on its first run.
   *
   * A blank-line citation is invisible on review, because the line above a
   * section end is exactly the kind of line a reader expects to find there.
   * `tests/coverage/locator-fidelity.test.ts` lexes any `L`-number in a comment
   * as a citation, and this slice has now produced the same defect three times,
   * so the scan runs over prose comments AND data strings AND span ends rather
   * than trusting a convention.
   */
  const OWN_FILES = [
    'src/ai/storyboards/sb-21-to-30/storyboards.ts',
    'tests/unit/ai-storyboards-21-30-cards.test.ts',
    'tests/component/ai-storyboards-21-30-cards.test.tsx',
  ] as const

  for (const file of OWN_FILES) {
    it(`${file} cites no blank line and no rule`, () => {
      const text = readFileSync(file, 'utf8')
      const offenders: string[] = []
      for (const match of text.matchAll(/L(\d{4,6})/g)) {
        const n = Number(match[1])
        const line = BLUEPRINT[n - 1]
        if (line === undefined) {
          offenders.push(`L${n} is past the end of the frozen source`)
        } else if (line.trim() === '') {
          offenders.push(`L${n} is a blank line`)
        } else if (line.trim() === '---') {
          offenders.push(`L${n} is a horizontal rule`)
        }
      }
      expect([...new Set(offenders)]).toEqual([])
    })
  }

  it('cites the content-end of a section span, never the blank separator', () => {
    // The two spans this task states, checked at BOTH ends. The start is a
    // `###` heading and the end is a `**Source classification.**` paragraph.
    for (const [first, last] of [
      ['L95138', 'L95219'],
      ['L95221', 'L95308'],
    ] as const) {
      expect(sourceLine(first)).toContain('### 44A.')
      expect(sourceLine(last)).toContain('**Source classification.**')
      // And the line after the content-end is the blank one a span end would
      // have landed on, which is the defect this pins away from.
      expect(sourceLine(`L${Number(last.replace(/^L/, '')) + 1}`).trim()).toBe('')
    }
  })
})

describe('storyboards 44A.21 to 44A.30 — the compound fallback key', () => {
  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} keys its contract on chapter AND literal`, () => {
      const { fallback } = card(number)
      expect(fallback.identifier).toBe(`FB-AI-${number}`)
      expect(fallback.chapter).toBe(`44A.${number}`)
    })

    it(`storyboard ${number}'s key resolves to the 44A owner, not chapter 40's`, () => {
      const { fallback } = card(number)
      const owner = ownerAt(fallback.chapter, fallback.identifier)
      expect(owner, `${fallback.chapter} · ${fallback.identifier}`).not.toBeNull()
      // The owner's own locator must carry the literal, so the resolution is
      // checked against the source rather than against the registry's word.
      expect(sourceLine(owner!.locator)).toContain(`\`${fallback.identifier}\``)
    })

    it(`storyboard ${number}'s literal has no chapter 40 or 41 owner`, () => {
      /**
       * THE COLLISION IS PROVED, NOT ASSUMED — INCLUDING WHERE IT IS ABSENT.
       *
       * Chapter 40/41's register holds `FB-AI-00`, `FB-AI-01`…`-16` and
       * `FB-AI-101`…`-108` at L88915-L88939. The overlap with the thirty
       * storyboard literals is exactly `FB-AI-01` through `FB-AI-16`, so NONE
       * of this task's ten — 21 through 30 — has a foreign owner. That is
       * asserted rather than believed: a lookup under the chapter-40 section
       * that ever started resolving would mean the register had grown a row
       * this range's compound keys need to disambiguate against.
       */
      const foreign = ownerAt(`40.${number}`, `FB-AI-${number}`)
      expect(foreign, `40.${number} unexpectedly owns FB-AI-${number}`).toBeNull()
    })
  }

  /**
   * STORYBOARD 26 NAMES A SECOND SENSE'S WORTH OF LITERALS IN ONE ROW.
   *
   * L94907 verbatim: `SB-AI-26`; fallback contract `FB-AI-26`; terminal case
   * of `FB-AGT-PREV-01` and `FB-AI-04`. That `FB-AI-04` is the §44A sense —
   * storyboard 4, "No artificial intelligence and no cached guidance" — and
   * NOT chapter 40.4's `FB-AI-04`, "Deviation brief assembly and gate delivery
   * failure" at L88919. Both records exist and both look plausible, which is
   * why the cross-reference is keyed compoundly as data and asserted against
   * the contract text rather than left in prose.
   */
  it('keys storyboard 26 cross-references, including the foreign-sense literal', () => {
    for (const reference of SB_21_TO_30_CROSS_REFERENCED_FALLBACKS) {
      const owner = ownerAt(reference.key.chapter, reference.key.identifier)
      expect(owner, `${reference.key.chapter} · ${reference.key.identifier}`).not.toBeNull()
      expect(owner!.contract).toBe(reference.contract)
      // The row that names the literal really does name it.
      expect(sourceLine(reference.namedAt)).toContain(`\`${reference.key.identifier}\``)
    }
  })

  it('does not read storyboard 26 FB-AI-04 as the chapter 40 contract', () => {
    const sense = SB_21_TO_30_CROSS_REFERENCED_FALLBACKS.find(
      (reference) => reference.key.identifier === 'FB-AI-04',
    )
    expect(sense).toBeDefined()
    expect(sense!.key.chapter).toBe('44A.4')
    // The two senses are different records under the compound key, which is
    // the whole reason the key is compound.
    const foreign = ownerAt('40.4', 'FB-AI-04')
    expect(foreign).not.toBeNull()
    expect(foreign!.contract).not.toBe(sense!.contract)
  })
})

describe('storyboards 44A.21 to 44A.30 — AC-44A-004, the audit log', () => {
  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} names a final state reconstructible from its audit`, () => {
      const storyboard = card(number)
      const ids = storyboard.audit.map((event) => event.id)

      expect(storyboard.audit.length, `${number} has no audit events`).toBeGreaterThan(0)
      expect(new Set(ids).size, `${number} has a duplicate audit id`).toBe(ids.length)
      expect(storyboard.finalOfficialState.name.trim()).not.toBe('')
      expect(storyboard.finalOfficialState.derivedFrom.length).toBeGreaterThan(0)

      for (const id of storyboard.finalOfficialState.derivedFrom) {
        expect(ids, `${number} derives from ${id}, which its audit lacks`).toContain(id)
      }
      for (const event of storyboard.audit) {
        expect(event.statement.trim()).not.toBe('')
        expect(sourceLine(event.sourceRef), `${number} · ${event.id}`).not.toBe('')
      }
    })

    it(`storyboard ${number}'s reconstruction is written down, not implied`, () => {
      // `AC-44A-004` is an assertion about what the card EMITS. A reader has to
      // be able to check the reconstruction, so each card states in words how
      // its final state follows from the events it names.
      expect(card(number).reconstruction.trim()).not.toBe('')
    })
  }
})

describe('storyboards 44A.21 to 44A.30 — AC-44A-005, presumed-absent capabilities', () => {
  for (const number of EXPECTED_NUMBERS) {
    it(`storyboard ${number} states any presumed-absent capability from the source`, () => {
      const absent = card(number).absentCapability
      if (absent === null) return
      expect(absent.statement.trim()).not.toBe('')
      expect(sourceLine(absent.sourceRef), `${number} · ${absent.sourceRef}`).not.toBe('')
    })
  }
})

describe('storyboards 44A.21 to 44A.30 — the acceptance criteria and tests I counted', () => {
  /**
   * COUNTED FROM EACH TABLE'S OWN LINE, NEVER INFERRED FROM A SPAN.
   *
   * Held as the identifiers rather than as counts, so storyboard 30's SIXTH
   * criterion is a named member instead of a number that agrees with any
   * substitution. `AC-44A-30-6` is the one this range's outlier turns on, and
   * it is `AC-44A-NN-N` shape — storyboard-level — never `AC-44A-004`, which
   * is chapter-level. One regex conflates the two shapes.
   */
  for (const number of EXPECTED_NUMBERS) {
    const entry = SB_21_TO_30_CRITERIA.find((row) => row.storyboard === number)!

    it(`storyboard ${number}'s acceptance line carries exactly the criteria named`, () => {
      const line = sourceLine(entry.acceptanceRef)
      expect(line).toContain('**Acceptance criteria.**')
      const found = [...line.matchAll(/`(AC-44A-\d+-\d+)`/g)].map((match) => match[1])
      expect(found).toEqual([...entry.acceptance])
    })

    it(`storyboard ${number}'s test line carries exactly the tests named`, () => {
      const line = sourceLine(entry.testsRef)
      expect(line).toContain('**Tests.**')
      const found = [...line.matchAll(/`(TEST-44A-\d+-\d+)`/g)].map((match) => match[1])
      expect(found).toEqual([...entry.tests])
    })
  }

  it('records storyboard 30 as the range outlier, with six criteria', () => {
    const thirty = SB_21_TO_30_CRITERIA.find((row) => row.storyboard === 30)!
    expect(thirty.acceptance).toContain('AC-44A-30-6')
    // Every other storyboard in this range names five. Asserted as membership
    // of the sixth rather than as a count of six.
    for (const row of SB_21_TO_30_CRITERIA) {
      if (row.storyboard === 30) continue
      expect(row.acceptance).not.toContain(`AC-44A-${row.storyboard}-6`)
    }
  })
})

describe('storyboards 44A.21 to 44A.30 — the decisions, disclosed locally', () => {
  /**
   * `src/disclosure/decisions.ts` is wave 5's and read-only here, so every
   * `DEC-*` these ten sections name is disclosed in this task's own directory,
   * in the slice-8 pattern: every reading, every locator, nothing adopted.
   */
  /**
   * THIS GATE WAS INERT, AND A CORRECT FIX ELSEWHERE IS WHAT EMPTIED IT.
   *
   * It matched `` `DEC-XXX-000` `` — backtick-delimited — and swept only
   * `storyboardCardRows()`, which is `STORYBOARD_CARD_FIELDS` and excludes
   * `audit`, `surfaces` and `absentCapability`. Audit C-41 then removed every
   * backtick from every rendered string in these ten cards, for the right
   * reason: `StoryboardCard` prints text, so a backtick reached the reader as a
   * grave accent. **The population went to zero and the loop stopped
   * executing.** Measured at the time of this repair: 20 bare `DEC-` ids named
   * across the ten cards, 0 backtick-wrapped, and the body ran no assertion at
   * all. Audit round 3, `R3-U01`.
   *
   * The shape is worth more than the repair: **a correct fix in one place can
   * silently empty a gate in another**, and nothing reds when it happens —
   * the suite simply keeps passing with less to say. It is the inverse of the
   * abstention that rots, and the same remedy applies: assert the population,
   * not only the offenders.
   *
   * So this now (a) matches the bare token, the idiom
   * `ai-storyboards-01-10-decisions.test.ts` already uses on the same data
   * family, (b) sweeps every string surface of the card rather than the field
   * rows alone, and (c) **floors the population**, so emptying it again is a
   * failure rather than a silence.
   *
   * Widening it convicted nothing: every decision these cards name is
   * disclosed for its own storyboard. The artefact was correct; the gate over
   * it was not.
   */
  const DEC_TOKEN = /DEC-[A-Z]+-\d{3}/g

  /** Every string a reader can see on the card, not only the field rows. */
  function cardStrings(storyboard: (typeof SB_21_TO_30)[number]): readonly string[] {
    return [
      ...storyboardCardRows(storyboard).map((row) => row.content),
      storyboard.finalOfficialState.name,
      ...storyboard.audit.map((event) => event.statement),
      ...Object.values(storyboard.surfaces).map((effect) =>
        effect.kind === 'affected' ? effect.statement : effect.reason,
      ),
      storyboard.absentCapability?.statement ?? '',
    ]
  }

  it('names decisions in these cards at all, so the disclosure check has a subject', () => {
    // THE FLOOR THIS GATE DID NOT HAVE. Without it the check below is satisfied
    // by a card family that mentions no decision — which is exactly the state
    // C-41 put it in, silently.
    const named = SB_21_TO_30.flatMap((storyboard) =>
      cardStrings(storyboard).flatMap((text) => [...text.matchAll(DEC_TOKEN)].map((m) => m[0])),
    )
    expect(named.length, 'no DEC-* id found in any of the ten cards').toBeGreaterThan(10)
  })

  it('discloses every DEC-* literal these ten cards name', () => {
    for (const storyboard of SB_21_TO_30) {
      const named = new Set(
        cardStrings(storyboard).flatMap((text) => [...text.matchAll(DEC_TOKEN)].map((m) => m[0])),
      )
      const disclosed = new Set(
        SB_21_TO_30_DECISION_CITATIONS.filter((entry) => entry.storyboard === storyboard.number).map(
          (entry) => entry.decision,
        ),
      )
      for (const id of named) {
        expect(disclosed, `storyboard ${storyboard.number} names ${id} undisclosed`).toContain(id)
      }
    }
  })

  it('cites every decision at least once, and every locator carries content', () => {
    for (const entry of SB_21_TO_30_DECISION_CITATIONS) {
      expect(entry.citations.length, `${entry.decision} has no reading`).toBeGreaterThan(0)
      for (const citation of entry.citations) {
        expect(citation.text.trim()).not.toBe('')
        expect(citation.locator).toMatch(/^L\d+(-L\d+)?$/)
        expect(sourceLine(citation.locator.split('-')[0]!), citation.locator).not.toBe('')
      }
    }
  })

  it('never states the decision canon size, only membership', () => {
    for (const entry of SB_21_TO_30_DECISION_CITATIONS) {
      expect(['member', 'notAMemberOfTheExportedUnion']).toContain(entry.canonMembership)
    }
  })

  /**
   * THE TWO AUTHORED DEFECTS.
   *
   * Storyboards 29 and 30 name no `DEC-*` anywhere in their section bodies —
   * measured, zero occurrences across L95138-L95219 and L95221-L95308 — while
   * the chapter's glance table attributes `DEC-PLUS-001` to 29 at L92721 and
   * `DEC-DIVERGE-001` to 30 at L92722. The section body is the specification
   * and the glance table is an index. Both readings render with both locators
   * and neither is adopted, because "correcting" the source is not this task's
   * to do.
   */
  for (const [number, id, bodySpan, glanceRef] of [
    [29, 'DEC-PLUS-001', 'L95138-L95219', 'L92721'],
    [30, 'DEC-DIVERGE-001', 'L95221-L95308', 'L92722'],
  ] as const) {
    it(`discloses the storyboard ${number} glance-table conflict with both locators`, () => {
      const entry = SB_21_TO_30_DECISION_CITATIONS.find(
        (row) => row.storyboard === number && row.decision === id,
      )
      expect(entry, `${number} does not disclose ${id}`).toBeDefined()
      expect(entry!.conflict).toBe('glanceTableAttributesWhatTheBodyDoesNotName')
      const locators = entry!.citations.map((citation) => citation.locator)
      expect(locators).toContain(bodySpan)
      expect(locators).toContain(glanceRef)
    })

    it(`confirms storyboard ${number}'s body names no decision at all`, () => {
      const [first, last] = bodySpan.split('-').map((part) => Number(part.replace(/^L/, '')))
      const body = BLUEPRINT.slice(first! - 1, last!).join('\n')
      expect(body).not.toContain('DEC-')
    })

    it(`confirms the glance table really does attribute ${id} to ${number}`, () => {
      expect(sourceLine(glanceRef)).toContain(`\`${id}\``)
      expect(sourceLine(glanceRef)).toContain(`\`SB-AI-${number}\``)
    })

    it(`does not put ${id} in storyboard ${number}'s transcribed card text`, () => {
      // The body's position is what the card renders. Were the glance-table
      // attribution silently adopted into a field, this range would ship a
      // decision reference the specification does not make.
      const text = storyboardCardRows(card(number))
        .map((row) => row.content)
        .join(' ')
      expect(text).not.toContain(id)
    })
  }
})

/* ══════════════════════════════════════════════════════════════════════
 * R7-C03 — A CHAPTER-WIDE CRITERION, REPORTED AT ITS FULL POPULATION.
 *
 * The `TEST-44A-004 and the Spanish message set` seam renders on
 * `/workflows/ai-and-its-absence/` under a heading naming a criterion whose
 * subject is every storyboard in chapter 44A, and it reported ONE card.
 * Measured, twelve of the thirty cards quote a verbatim worker-facing string
 * and the frozen source writes no Spanish for any of them — so the disclosure
 * was at one twelfth of its subject.
 *
 * THE POPULATION IS RE-MEASURED HERE RATHER THAN TRANSCRIBED, which is what
 * stops the fix being undone by narrowing the measurement instead of the gap.
 * The chapter's thirty `| Worker-visible experience |` rows are counted off the
 * frozen bytes, the twelve carrying a quoted string are found, each is mapped
 * to its own `### 44A.N` heading, and both the line list and the storyboard
 * list in the rendered seam are compared against that BY EQUALITY.
 *
 * WHAT IS DELIBERATELY NOT WIDENED, and the gate says so: the pinned set. The
 * paraphrase prohibition is stated exactly once in the chapter and it is
 * stated about `SCR-FL-LOCK-01`, so pinning only that one is correct.
 *
 * PLANTED, against a sha256 of the module taken before and restored
 * byte-exact:
 *   `storyboards: [25]` restored — red: 12 expected, 1 found, naming the
 *     eleven missing.
 *   dropped L93734 from the seam's finding — red naming L93734 (storyboard 12).
 *   `### 44A.31` renamed to `### 44A.12` in a scratch copy of the scan input —
 *     red on the storyboard mapping rather than silently absorbing it.
 * ══════════════════════════════════════════════════════════════════════ */
describe('R7-C03: the Spanish message-set gap is disclosed at its measured population', () => {
  const LINES = readFileSync('../AVIIXA_Production_Product_Blueprint.md', 'utf8').split('\n')

  /** Chapter 44A, by its own headings rather than by a hard-coded window. */
  const chapterStart = LINES.findIndex((l) => /^## 44A\./.test(l)) + 1
  const chapterEnd = LINES.findIndex((l, i) => i > chapterStart && /^## 45\./.test(l)) + 1

  /** Every `### 44A.N` card heading, with the storyboard number it opens. */
  const CARD_HEADINGS = LINES.flatMap((text, i) => {
    const m = /^###\s+44A\.(\d+)\s/.exec(text)
    return m === null ? [] : [{ number: Number(m[1]), line: i + 1 }]
  })

  const storyboardOwning = (line: number): number => {
    const owner = [...CARD_HEADINGS].reverse().find((h) => h.line < line)
    if (owner === undefined) throw new Error(`no 44A.N heading opens before L${line}`)
    return owner.number
  }

  /** The chapter's worker-visible rows, and the subset quoting a string. */
  const workerVisible = LINES.flatMap((text, i) =>
    i + 1 >= chapterStart && i + 1 <= chapterEnd && text.includes('| Worker-visible experience |')
      ? [{ line: i + 1, text }]
      : [],
  )
  const quoted = workerVisible.filter((r) => r.text.includes('"'))

  const seam = SB_21_TO_30_CONTRACT_SEAMS.find(
    (s) => s.subject === 'TEST-44A-004 and the Spanish message set',
  )

  it('the chapter has thirty worker-visible rows and twelve quote a fixed string', () => {
    expect(chapterStart, 'the §44A heading').toBeGreaterThan(0)
    expect(chapterEnd, 'the §45 heading after it').toBeGreaterThan(chapterStart)
    expect(CARD_HEADINGS.filter((h) => h.number <= 30).length, '§44A.1-30 headings').toBe(30)
    expect(workerVisible.length, 'Worker-visible experience rows in §44A').toBe(30)
    expect(quoted.length, 'rows quoting a verbatim worker-facing string').toBe(12)
  })

  it('TEST-44A-004 is chapter-wide, and the source writes no Spanish for any of the twelve', () => {
    expect(LINES[92_756], 'L92757').toContain('`TEST-44A-004`')
    expect(LINES[92_756], 'its subject is every storyboard').toContain("every storyboard's")
    const chapter = LINES.slice(chapterStart - 1, chapterEnd).join('\n')
    expect(
      chapter.match(/[áéíóúñ¿¡]/g) ?? [],
      'accented characters in §44A. Any Spanish string would carry one.',
    ).toHaveLength(0)
  })

  it('the rendered seam names all twelve lines and all twelve storyboards, by equality', () => {
    expect(seam, 'the TEST-44A-004 seam').toBeDefined()
    const numbers = [...new Set(quoted.map((r) => storyboardOwning(r.line)))].sort((a, b) => a - b)
    expect(numbers.length, 'distinct storyboards carrying a quoted string').toBe(12)

    expect(
      [...seam!.storyboards].sort((a, b) => a - b),
      `the seam must disclose all ${numbers.length} storyboards TEST-44A-004 covers, not a subset`,
    ).toEqual(numbers)

    const cited = [...seam!.finding.matchAll(/\bL(\d{5})\b/g)].map((m) => Number(m[1]))
    for (const row of quoted) {
      expect(cited, `L${row.line} (storyboard ${storyboardOwning(row.line)}) is named`).toContain(
        row.line,
      )
    }
  })

  it('the sibling PINNED_WORKER_MESSAGES seam covers the same measurement, in its own range', () => {
    // Found while deriving the twelve: this seam named 22, 23 and 26 and
    // omitted 27, whose card transcribes its string exactly as they do. Same
    // shape one row down, so it is derived here too rather than read.
    const inRange = [...new Set(quoted.map((r) => storyboardOwning(r.line)))]
      .filter((n) => n >= 21 && n <= 30)
      .filter((n) => !SB_21_TO_30_DISCLOSED_VIOLATIONS.some((v) => v.storyboard === n))
      .sort((a, b) => a - b)
    const pinnedSeam = SB_21_TO_30_CONTRACT_SEAMS.find((x) => x.subject === 'PINNED_WORKER_MESSAGES')
    expect(pinnedSeam, 'the PINNED_WORKER_MESSAGES seam').toBeDefined()
    expect(
      [...pinnedSeam!.storyboards].sort((a, b) => a - b),
      'cards in 21-30 quoting a fixed worker-facing string that the pinned set does not cover',
    ).toEqual(inRange)
  })

  it('and it still says the pinned set is correctly one — the prohibition is stated once', () => {
    // L94829 writes the message, L94876 states the prohibition, AC-44A-25-2
    // turns it into a criterion. No other line in the chapter forbids
    // paraphrase, which is why widening the PINNED set would be wrong.
    expect(LINES[94_875], 'L94876').toContain('must not be paraphrased')
    expect(LINES[94_879], 'L94880 carries AC-44A-25-2').toContain('`AC-44A-25-2`')
    const chapter = LINES.slice(chapterStart - 1, chapterEnd)
    const forbidding = chapter.flatMap((l, i) =>
      /must not be paraphrased|with no paraphrase/.test(l) ? [chapterStart + i] : [],
    )
    expect(forbidding, 'lines in §44A forbidding paraphrase').toEqual([94_876, 94_880])
    expect(seam!.whatThisTaskDid, 'the pinned set is not widened').toContain('AC-44A-25-2')
    expect(SB_21_TO_30_DISCLOSED_VIOLATIONS.map((v) => v.storyboard)).toEqual([25])
  })
})

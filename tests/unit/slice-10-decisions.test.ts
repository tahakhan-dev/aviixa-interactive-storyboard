import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { OPEN_DECISIONS, decisionRecord, type DecisionId } from '@/disclosure/decisions'

/**
 * Slice 10, wave 0, task 2 — the slice-10 decision canon.
 *
 * WHAT THIS FILE IS FOR, and it is not "the records exist". Fourteen records
 * were added and three of them are shapes the canon had not carried:
 *
 *   - TWO ALIAS PAIRS. One question, two identifiers, no cross-reference in
 *     the source. The defect is not a missing record; it is a client searching
 *     on the identifier the build dropped and finding nothing.
 *   - A DECISION WHOSE THREE READINGS DISAGREE ABOUT WHETHER IT EXISTS.
 *     `DEC-SCHED-011` is bounded out of its own band in one chapter, indexed
 *     as open in another, and declared closed in a third. Settling it is the
 *     defect; so the gate is that all three render and none is adopted.
 *   - A RECORD WITH NO READINGS. `DEC-FINISH-002` occurs twice in 122,241
 *     lines and neither occurrence states a reading. The failure mode here is
 *     not omission — it is INVENTION, because two fabricated readings are
 *     indistinguishable on screen from two real ones. So the assertion is on
 *     the count, measured against the frozen source rather than restated.
 *
 * EVERY MEASUREMENT BELOW IS TAKEN FROM THE FROZEN SOURCE AT RUN TIME. A count
 * copied into an assertion is a count that stops measuring; slice 8 shipped a
 * citation figure that was stale by roughly three times because twenty briefs
 * quoted it verbatim.
 */

/* ── the frozen source, and the floor that makes reading it meaningful ── */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
/** One-based, so `LINES[n]` is the line a citation spelling `Ln` names. */
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]

/** The line a citation names, whole. Truncating one is how three correct findings were nearly overturned. */
const L = (n: number): string => LINES[n] ?? ''

/** Every one-based line number on which a token occurs. */
const linesCarrying = (token: string): readonly number[] =>
  LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])

const render = (id: DecisionId): string =>
  renderToStaticMarkup(createElement(DecisionDisclosure, { id }))

/**
 * The fourteen this task added. Declared as a literal, NOT filtered off
 * `OPEN_DECISIONS` — a population derived from the array it polices shrinks
 * along with its subject and the gate goes on passing. That exact shape is in
 * this build's catalogue of gates that could not fail.
 */
const SLICE_10_IDS: readonly DecisionId[] = [
  'DEC-AUDITSUP-001',
  'DEC-AUDITQM-001',
  'DEC-AUDITHASH-001',
  'DEC-AUDITOFF-001',
  'DEC-NOTIFCOUNT-001',
  'DEC-NOTIFSEV-001',
  'DEC-NOTIFPRI-001',
  'DEC-NOTIFPREF-001',
  'DEC-NOTIFACK-001',
  'DEC-SCHED-002',
  'DEC-SCHED-011',
  'DEC-FINISH-002',
  'DEC-CMDEXP-001',
  'S10-IDENT-SCHED-001',
]

describe('the population, before anything is claimed about it', () => {
  it('reads the frozen source these records were built against', () => {
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    expect(LINES.length - 1).toBe(122_241)
  })

  // FAILS IF: a slice-10 record is dropped from the canon, or one is added
  // without being declared here. Both directions, because the literal above
  // is only worth having if it can disagree with the array.
  //
  // Planted: `DEC-CMDEXP-001` deleted from `OPEN_DECISIONS` and from
  // `OPEN_DECISION_IDS`. RED — "expected [ ... ] to include 'DEC-CMDEXP-001'".
  it('holds a record for each of the fourteen, and the canon holds no other new one', () => {
    expect(SLICE_10_IDS).toHaveLength(14)
    const canon = OPEN_DECISIONS.map((d): string => d.id)
    for (const id of SLICE_10_IDS) expect(canon, id).toContain(id)
    // The canon's own count, so the fourteen are additions rather than
    // replacements: twenty-nine slice-5 records plus these.
    expect(OPEN_DECISIONS).toHaveLength(43)
  })

  // FAILS IF: a new record pins a closed-vocabulary member. `pins` is checked
  // against the STUDIO vocabulary by `stu-vocab.test.ts`, so a slice-10 pin
  // would either resolve against the wrong surface's vocabulary or go red
  // there for the wrong reason. The right answer is that these carry none.
  it('pins no vocabulary member, because none of these decisions is about the Studio vocabulary', () => {
    for (const id of SLICE_10_IDS) expect(decisionRecord(id).pins, id).toEqual([])
  })

  // FAILS IF: a reading gains a third field — the structural guarantee that no
  // reading can be flagged as the source's answer. Asserted on this slice's
  // records specifically, because the canon-wide form of it lives in
  // `stu-vocab.test.ts` and a new record must not be the exception.
  it('gives every reading exactly two fields, so none can be marked the answer', () => {
    for (const id of SLICE_10_IDS) {
      for (const r of decisionRecord(id).readings) {
        expect(Object.keys(r).sort(), `${id} reading shape`).toEqual(['locator', 'text'])
      }
    }
  })
})

/* ==================================================================== *
 * ALIAS PAIR ONE — DEC-SCHED-002 canonical, DEC-SCHED-MISFIRE-001 alias.
 * ==================================================================== */

describe('alias pair one: one misfire question under two identifiers', () => {
  // FAILS IF: the pair is reversed, the alias is dropped, or either identifier
  // stops rendering. Rendering BOTH is the whole point — a client searching on
  // the identifier the build did not pick must still reach this card.
  //
  // Planted: `alias: null` on the record. RED on the alias assertion, and RED
  // again on the markup for `DEC-SCHED-MISFIRE-001`.
  it('registers DEC-SCHED-002 canonical with DEC-SCHED-MISFIRE-001 as its alias, and renders both', () => {
    const d = decisionRecord('DEC-SCHED-002')
    expect(d.decisionRef).toBe('DEC-SCHED-002')
    expect(d.alias).toBe('DEC-SCHED-MISFIRE-001')
    const markup = render('DEC-SCHED-002')
    expect(markup).toContain('DEC-SCHED-002')
    expect(markup).toContain('also cited as DEC-SCHED-MISFIRE-001')
  })

  // FAILS IF: the screen stops saying that an alias was REGISTERED rather than
  // dropped. That sentence is the disclosure the two limits require — the
  // client delegated the decision, not the pretence that one identifier was
  // the only one.
  it('says on screen that the build registered an alias rather than dropping one', () => {
    const markup = render('DEC-SCHED-002')
    expect(markup).toContain('registered an alias rather than dropping one')
    expect(markup).toContain('client-delegated choice under APP-012')
  })

  // FAILS IF: the reason for the pairing stops being true of the frozen
  // source. This is the measurement, not a restatement of one: the two
  // identifiers are two chapters that did not know about each other, and the
  // evidence is that each chapter's span contains zero occurrences of the
  // other's identifier. Re-measured on every run.
  //
  // Planted: the span end moved from 103156 to 115200, which pulls the §51.12
  // index row into the window. RED — "expected [ 115149 ] to have a length
  // of +0".
  it('measures the no-cross-reference claim against the source rather than asserting it', () => {
    // Chapter 45A, which owns scheduled work, never names the alias.
    const misfireInsideCh45A = linesCarrying('DEC-SCHED-MISFIRE-001').filter(
      (n) => n >= 97_959 && n <= 103_156,
    )
    expect(misfireInsideCh45A).toHaveLength(0)
    // Chapter 30A, which mints the alias, never names the canonical.
    const canonicalInsideCh30A = linesCarrying('DEC-SCHED-002').filter(
      (n) => n >= 66_438 && n <= 71_700,
    )
    expect(canonicalInsideCh30A).toHaveLength(0)
    // NON-VACUITY: both identifiers exist in the source at all, so the two
    // emptinesses above are absences from a span and not absences from the
    // document. A gate proving nothing is worse than no gate.
    expect(linesCarrying('DEC-SCHED-MISFIRE-001').length).toBeGreaterThan(1)
    expect(linesCarrying('DEC-SCHED-002').length).toBeGreaterThan(1)
  })

  // FAILS IF: a locator in this record names a line that does not carry its
  // identifier. The canonical card, and the alias's mint and register rows.
  it('cites the card, the mint and the register row at lines that carry them', () => {
    expect(L(114_327)).toContain('DEC-SCHED-002')
    expect(L(114_327)).toContain('Misfire policy per schedule class')
    expect(L(66_451)).toContain('DEC-SCHED-MISFIRE-001')
    expect(L(71_650)).toContain('DEC-SCHED-MISFIRE-001')
    // The register row is what makes the alias a raised decision rather than a
    // mention, so its status text is asserted rather than assumed.
    expect(L(71_650)).toContain('Client Decision Required')
  })
})

/* ==================================================================== *
 * ALIAS PAIR TWO — the scheduler identity register, and NO DEC identifier.
 * ==================================================================== */

describe('alias pair two: three spellings of two non-human identities, no decision identifier', () => {
  // FAILS IF: a `DEC-*` identifier is minted for a collision the source
  // raises none for. That is the specific instruction, and the reason for it
  // is that a build-minted decision identifier gets searched for in the
  // source and is not there.
  //
  // Planted: `id` and `decisionRef` set to 'DEC-SCHEDIDENT-001'. RED on both
  // the null check and the prefix check.
  it('mints no DEC identifier and keeps a build-local key the source does not contain', () => {
    const d = decisionRecord('S10-IDENT-SCHED-001')
    // NOT THE MISSING-RECORD STAND-IN. `decisionRecord` never throws — it
    // returns a typed stand-in whose `decisionRef` is also null, so deleting
    // the record would satisfy the two assertions below on nothing at all.
    // Asserted first, because it is what makes them about this record.
    expect(d.question).toContain('three chapters spell the same two non-human identities')
    expect(d.decisionRef).toBeNull()
    expect(d.id).not.toMatch(/^DEC-/)
    // The key is build-local only if the source really does not carry it.
    expect(SOURCE_TEXT).not.toContain('S10-IDENT-SCHED')
    expect(SOURCE_TEXT).not.toContain('S10-')
  })

  // FAILS IF: the alias stops rendering on a record whose `decisionRef` is
  // null. THIS IS THE REGRESSION THE COMPONENT EDIT EXISTS FOR — the branch
  // that says "the source gives it no identifier" was the branch that dropped
  // the alias, and it was invisible while the only aliased record in the canon
  // also had a `DEC-*` identifier.
  //
  // Planted: the alias fragment removed from the null branch of
  // `DecisionDisclosure`. RED — the markup no longer contains
  // "also cited as IDENT-SCHED-CTL".
  it('renders the aliased spellings even though the record has no DEC identifier', () => {
    const markup = render('S10-IDENT-SCHED-001')
    expect(markup).toContain('no `DEC-*` identifier')
    expect(markup).toContain('also cited as IDENT-SCHED-CTL')
    expect(markup).toContain('IDENT-SCHED-WRK')
    expect(markup).toContain('IDENT-SCHED-PLATFORM')
  })

  // FAILS IF: a spelling stops being disclosed, or a spelling's locator stops
  // carrying it. All three, because a search on any of them has to reach this
  // record — which is the rule the source itself supplies at 45A.7.
  it('discloses all three spellings, each at a line that carries it', () => {
    const d = decisionRecord('S10-IDENT-SCHED-001')
    expect(d.readings).toHaveLength(3)
    expect(L(17_887)).toContain('IDENT-SCHEDCTL')
    expect(L(17_888)).toContain('IDENT-SCHEDWKR')
    expect(L(18_612)).toContain('IDENT-SCHEDCTL')
    expect(L(98_883)).toContain('IDENT-SCHED-CTL')
    expect(L(98_885)).toContain('IDENT-SCHED-WRK')
    expect(L(51_000)).toContain('IDENT-SCHED-PLATFORM')
    expect(L(51_000)).toContain('IDENT-DEV-SYNC')
    // And the rule that makes the collision consequential rather than untidy.
    expect(L(99_197)).toContain('never "acting as role"')
    const markup = render('S10-IDENT-SCHED-001')
    for (const r of d.readings) expect(markup, r.locator).toContain(r.locator)
  })

  // FAILS IF: the canonical spelling is chosen for a reason that is not true.
  // (a) wins because it is the only spelling carrying the identity contract,
  // so the contract's size is measured here rather than quoted from a brief —
  // the brief said eighteen fields and the table has seventeen.
  it('counts the identity contract rather than quoting a count for it', () => {
    const body: string[] = []
    for (let n = 18_614; n <= 18_700; n += 1) {
      if (!L(n).startsWith('|')) break
      body.push(L(n))
    }
    expect(body).toHaveLength(17)
    expect(body[0]).toContain('Purpose')
    expect(body[16]).toContain('Reconciliation')
    // NON-VACUITY: the walk really stopped at a non-table line rather than at
    // the loop bound, so the count is the table's and not the window's.
    expect(L(18_631).startsWith('|')).toBe(false)
    // And the record names the count it measured.
    expect(decisionRecord('S10-IDENT-SCHED-001').readings[0]!.text).toContain('seventeen field rows')
  })
})

/* ==================================================================== *
 * THREE READINGS, THREE RENDERINGS — and one that disagrees about itself.
 * ==================================================================== */

describe('the three-reading decisions', () => {
  // FAILS IF: a third reading is dropped to two, which is how a
  // three-way conflict quietly becomes a two-way one with a winner.
  it('carries three readings on each of the three-reading records, and renders every locator', () => {
    for (const id of ['DEC-AUDITSUP-001', 'DEC-AUDITQM-001', 'DEC-SCHED-011'] as const) {
      const d = decisionRecord(id)
      expect(d.readings, id).toHaveLength(3)
      const markup = render(id)
      for (const r of d.readings) expect(markup, `${id} ${r.locator}`).toContain(r.locator)
    }
  })

  // FAILS IF: any of the three audit tokens stops being what the source says
  // it is. The three tokens are the reason this decision renders three
  // different ways — STATE-06, ABSENT, and DISABLED with the identifier — so
  // the tokens are read off the source rather than described.
  //
  // Planted: the reading (b) locator changed from L28865-L28867 to
  // L28865-L28866, dropping the export row. Not caught by the locator check —
  // caught here, because L28867 is asserted by content.
  it('reads the Supervisor’s three audit tokens off the three chapters', () => {
    // (a) chapter 17 — `Read-only`, with a condition note calling the
    // narrowing a recommendation over a stated silence.
    expect(L(22_017)).toContain('MOD-DOH-11')
    expect(L(22_017)).toContain('`Read-only` `[H23]`')
    expect(L(22_027)).toContain(
      'Not specified in the Statement of Work whether audit reading is scope-narrowed for a Supervisor',
    )
    // (b) chapter 19.13 — `Unavailable` on both read rows, `Explicitly
    // prohibited` on export. Whole cells, so a truncation cannot pass.
    expect(L(28_865)).toContain('Read the full tenant audit log')
    expect(L(28_866)).toContain('Read Summary and run-state audit events')
    expect(L(28_867)).toContain('Export audit as comma-separated values')
    // (b) again, from the screen register: the Supervisor is absent from the
    // audit log explorer's role list, which is the fourth locator.
    expect(L(48_114)).toContain('SCR-DOH-20')
    expect(L(48_114)).toContain('Read-only Auditor, Tenant Admin, Quality Manager')
    expect(L(48_114)).not.toContain('Supervisor')
    // (c) chapter 30D.4 — `Client Decision Required`, naming the identifier,
    // with the options in prose because there is no card.
    expect(L(74_217)).toContain('Client Decision Required — `DEC-AUDITSUP-001`')
    expect(L(74_178)).toContain(
      "The options are no access, matching the literal source, scoped read as recommended, or read of the Supervisor's own actions only",
    )
    expect(L(74_198)).toContain('DEC-AUDITSUP-001')
  })

  // FAILS IF: DEC-SCHED-011 is settled, or one of its three readings stops
  // being carried by the line it names. The three disagree about whether the
  // decision EXISTS, so a pick is a claim the source contradicts on its own
  // page — and the gate is the three lines plus the absence of an adoption.
  //
  // Planted: `adopted` rewritten to "Reading (c): the crosswalk closed it, so
  // nothing is open." RED on the settled-nothing assertion.
  it('renders all three readings of DEC-SCHED-011 and settles none', () => {
    // (a) the band is bounded at 010, and §51.9's card set stops there.
    expect(L(51_002)).toContain('`DEC-SCHED-001` through `DEC-SCHED-010`')
    expect(L(114_479)).toContain('DEC-SCHED-010')
    expect(linesCarrying('**DEC-SCHED-011 —')).toHaveLength(0)
    // (b) indexed as open, with its reference count.
    expect(L(115_148)).toContain('DEC-SCHED-011')
    expect(L(115_148)).toContain('| 9 |')
    // (c) closed, stated twice.
    expect(L(102_392)).toContain('That crosswalk closes `DEC-SCHED-011`, which recorded its absence')
    // NOT verbatim, and the difference was found by opening the line: the
    // deployable register says "That crosswalk closes", the classification
    // paragraph says "This crosswalk closes". Both close it; one word differs,
    // and a record calling the second a verbatim restatement would be wrong.
    expect(L(102_547)).toContain('This crosswalk closes `DEC-SCHED-011`, which recorded its absence')
    // And the position is that there is no position.
    expect(decisionRecord('DEC-SCHED-011').adopted).toContain('Nothing is settled here')
    expect(render('DEC-SCHED-011')).toContain('client-delegated choice under APP-012')
    // The reference count in the index reconciles with the document, so
    // reading (b)'s nine is measured and not repeated.
    expect(linesCarrying('DEC-SCHED-011')).toHaveLength(9)
  })
})

/* ==================================================================== *
 * THE ABSENCE — DEC-FINISH-002 has no readings, and that is the record.
 * ==================================================================== */

describe('DEC-FINISH-002: the absence is the disclosure', () => {
  // FAILS IF: readings are invented for it. Inventing two was the worst
  // outcome available here, because two fabricated readings render exactly
  // like two real ones and get quoted back as the source's.
  //
  // Planted: two readings added, both locating L98703. RED on the length, and
  // RED again on the only-record-below-the-floor assertion below.
  it('carries no reading at all, and renders the absence rather than an empty region', () => {
    // The stand-in `decisionRecord` returns for an id with no record ALSO has
    // no readings, so the emptiness below has to be pinned to this record
    // before it means anything. Its working position is the discriminator.
    expect(decisionRecord('DEC-FINISH-002').adopted).toContain('The absence is what is disclosed')
    expect(decisionRecord('DEC-FINISH-002').readings).toEqual([])
    const markup = render('DEC-FINISH-002')
    expect(markup).toContain('No reading is listed, and none has been invented to fill the gap')
    expect(markup).toContain('DEC-FINISH-002')
    expect(markup).toContain('client-delegated choice under APP-012')
  })

  // FAILS IF: the exception spreads. A record below the two-reading floor is
  // a disclosure of absence exactly once; a second one is a record somebody
  // did not finish writing, and the two look identical from outside.
  it('is the only record in the whole canon below the two-reading floor', () => {
    const thin = OPEN_DECISIONS.filter((d) => d.readings.length < 2).map((d): string => d.id)
    expect(thin).toEqual(['DEC-FINISH-002'])
  })

  // FAILS IF: the source starts carrying a reading and the record is not
  // updated — or, the direction that actually matters, if the claim "no
  // reading was recorded" was never true. Measured on every run: two
  // occurrences in 122,241 lines, and those two are its own naming and its
  // own index row.
  it('measures the absence in the frozen source rather than asserting it', () => {
    const at = linesCarrying('DEC-FINISH-002')
    expect(at).toEqual([98_703, 115_082])
    // The naming: listed as open, called a contradiction, with no reading.
    expect(L(98_703)).toContain('the manual-close anchor contradiction recorded as `DEC-FINISH-002`')
    // The index row: home chapter named, two references counted — and the two
    // references ARE these two lines, so the identifier is defined entirely
    // by its own registration.
    expect(L(115_082)).toContain('Chapter 45A')
    expect(L(115_082)).toContain('| 2 |')
    // NON-VACUITY: the sibling that DOES have a card is found by the same
    // predicate, so an empty result here would be a broken predicate rather
    // than a real absence.
    expect(linesCarrying('DEC-FINISH-001').length).toBeGreaterThan(10)
  })
})

/* ==================================================================== *
 * WHAT MAY NOT BE CLAIMED — the classification that makes it checkable.
 * ==================================================================== */

describe('no simulated capability is presented as a source-backed value', () => {
  // FAILS IF: the severity and priority records stop carrying the source's own
  // classification. The limit is "no screen may present a notification
  // severity as a source-backed value", and what makes that checkable is that
  // the canon names the classification the source gives it.
  it('carries `Recommendation — R&D` on severity and priority, and reads it off the source', () => {
    expect(L(73_186)).toContain(
      'The four severity levels, the three priority levels, the assignment table, and the unclassified fallback are `Recommendation — R&D`',
    )
    for (const id of ['DEC-NOTIFSEV-001', 'DEC-NOTIFPRI-001'] as const) {
      const markup = render(id)
      expect(markup, id).toContain('Recommendation — R&amp;D')
      expect(markup, id).toContain('source-backed value')
    }
    // And the one level the source DOES name for notifications, so the record
    // is not claiming the whole vocabulary is invented.
    expect(L(73_141)).toContain('It uses the word Critical for notifications in exactly one operative place')
  })

  // FAILS IF: the eighty-seven stops carrying its `Derived Clarification`
  // label. A derived count rendered bare reads as a source fact, which is the
  // DEC-STUDIO-001 precedent this follows.
  it('labels the eighty-seven a Derived Clarification wherever it renders', () => {
    expect(L(72_927)).toContain('The number eighty-seven is `Derived Clarification`, not a source fact')
    const markup = render('DEC-NOTIFCOUNT-001')
    expect(markup).toContain('Derived Clarification')
    expect(markup).toContain('eighty-seven')
  })

  // FAILS IF: the preference matrix claim is taken from a span instead of from
  // the table. Counted here because the brief said three columns read a
  // prohibition in every cell and the table says two — the third column
  // breaks on the fourth data row, which a span ending at L73710 excludes.
  //
  // Planted: the loop bound reduced to L73710, reproducing the truncation.
  // RED — "expected 3 to be 2".
  it('counts the preference matrix’s all-prohibited columns from the whole table', () => {
    const body: string[][] = []
    for (let n = 73_708; n <= 73_720; n += 1) {
      if (!L(n).startsWith('|')) break
      body.push(
        L(n)
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim()),
      )
    }
    expect(body).toHaveLength(4)
    // Five permission columns after the level label.
    const permissionColumns = 5
    expect(body[0]).toHaveLength(permissionColumns + 1)
    let allProhibited = 0
    for (let col = 1; col <= permissionColumns; col += 1) {
      if (body.every((row) => row[col]!.includes('Explicitly prohibited'))) allProhibited += 1
    }
    expect(allProhibited).toBe(2)
    // NON-VACUITY: the walk stopped at the table's end, and the fourth row is
    // the one that breaks the third column.
    expect(L(73_712).startsWith('|')).toBe(false)
    expect(body[3]![3]).toContain('Not applicable')
    // The storyboard the matrix contradicts, at the line that carries it —
    // and NOT at L73684, which is a numbered workflow step.
    expect(L(73_702)).toContain('SB-PREF-01')
    expect(L(73_702)).toContain(
      'Every locked control states its reason inline rather than showing a disabled control with no explanation',
    )
    expect(L(73_684)).not.toContain('SB-PREF-01')
  })
})

/* ==================================================================== *
 * THE TWO ROWS CITED BY CONTENT RATHER THAN BY LINE NUMBER.
 * ==================================================================== */

describe('the offline audit rows the record quotes without a locator', () => {
  // FAILS IF: either row stops saying what the record says it says. Neither
  // row carries an identifier, so a line number beside them in the `locator`
  // would be a citation nothing anchors — the record quotes their words
  // instead and this is where the words are checked. Asserted by CONTENT,
  // which is stronger than a locator: it cannot be satisfied by the wrong row.
  it('reads the continue-and-halt pair off the audit-unavailable action classes', () => {
    expect(L(74_872)).toContain('Frontline capture and step execution')
    expect(L(74_872)).toContain(
      "Continue into the local durable append-only queue, which is the device's audit store",
    )
    expect(L(74_873)).toContain('Frontline capture when the local queue is unwritable')
    expect(L(74_873)).toContain('Halt, upload-only mode')
    // And the record carries both, so the two are disclosed rather than only
    // verified here.
    const markup = render('DEC-AUDITOFF-001')
    expect(markup).toContain('Continue into the local durable append-only queue')
    expect(markup).toContain('Halt, upload-only mode')
  })
})

/* ==================================================================== *
 * EVERY NEW CITATION, AGAINST THE LINE IT NAMES.
 * ==================================================================== */

describe('every identifier-anchored locator in these records is true at its line', () => {
  /**
   * Locators in this canon are written as `IDENTIFIER · Lnnnnn`, sometimes as
   * `IDENTIFIER · Lnnnnn · label Lnnnnn`, and sometimes with the identifier
   * followed by several citations that all belong to it. So each citation is
   * paired with the nearest identifier to its LEFT anywhere in the locator.
   *
   * THIS CHECK COULD NOT FAIL IN ITS FIRST FORM, AND THE PLANT IS WHAT SAID SO.
   * The first form split the locator on the middot and required an identifier
   * and a citation inside the SAME segment — but the house style puts them in
   * adjacent segments, so the two never met and the pairing never happened.
   * It swept fifteen accidentally co-located citations and reported a clean
   * run; a locator pointed one line off its subject came back green. Fixed by
   * scanning the whole locator in order and carrying the last identifier
   * forward, which is what the sentence above always claimed it did.
   *
   * The global form of this check lives in
   * `tests/coverage/locator-fidelity.test.ts`; this one is scoped so a failure
   * names the record.
   */
  // The alternation includes `[Hnn]`, the source's own condition-note marker,
  // because chapter 17 anchors a citation on one -- the fixed lexer's first run
  // caught `condition [H23] L22027` pairing that line with the module
  // identifier three tokens earlier, which is not at L22027.
  const TOKEN =
    /(?<id>\b(?:DEC|AC|SCR|MOD|IDENT|TEST|SB|OBJ|FUNC|NOTIF|SCHED|MTX|EVT|CMD)-[A-Z0-9-]*[A-Z0-9]\b|\[H\d+\])|L(?<line>\d{3,6})/g

  it('splits the citations strong from weak, and pins both counts', () => {
    /**
     * AND THE SECOND FORM WAS WRONG THE OTHER WAY, which the plants also
     * showed. Demanding the anchor AT the line convicts a form this build has
     * already settled is correct: a citation may name a line INSIDE a section
     * rather than the identifier's own line — a permission row inside a module
     * section, the reconciliation sentence inside the paragraph that raises the
     * decision. Five accurate citations were nearly "corrected" into inaccurate
     * ones before that was understood. Some lines carry no identifier at all
     * (a matrix row, a prose paragraph) and a citation of one is weak by
     * nature, not wrong.
     *
     * So this is a SPLIT, not a pass/fail, and both halves are pinned:
     *
     *   strong  the nearest-left anchor is at the cited line
     *   weak    it is not: a section-internal line, or a line with no
     *           identifier on it at all
     *
     * Pinning BOTH counts is what makes it a gate rather than a report. A
     * citation moved one line off its subject drops out of `strong` and lands
     * in `weak`, so both numbers change and both assertions fire — which is
     * exactly the plant that came back green against the pass/fail form.
     */
    let strong = 0
    let weak = 0
    let total = 0
    for (const id of SLICE_10_IDS) {
      for (const r of decisionRecord(id).readings) {
        let anchor: string | null = null
        for (const m of r.locator.matchAll(TOKEN)) {
          const token = m.groups?.id
          if (token !== undefined) {
            anchor = token
            continue
          }
          const line = Number(m.groups!.line)
          total += 1
          // PLAUSIBILITY, which every citation owes whether it is anchored or
          // not: the line exists, and it is not blank. A blank line states
          // nothing, so a citation of one is always wrong — that is the
          // off-by-one class this build has already shipped once.
          expect(line, `${id} ${r.locator}`).toBeGreaterThan(0)
          expect(line, `${id} ${r.locator}`).toBeLessThanOrEqual(122_241)
          expect(L(line).trim().length, `${id} cites blank L${line}`).toBeGreaterThan(0)
          if (anchor !== null && L(line).includes(anchor)) strong += 1
          else weak += 1
        }
      }
    }
    expect(total).toBe(60)
    expect(strong).toBe(45)
    expect(weak).toBe(15)
    // NON-VACUITY: the split is a real split rather than one bucket and an
    // empty one, and the strong half is the majority — a lexer that stopped
    // matching identifiers would put everything in `weak` and still satisfy a
    // total.
    expect(strong).toBeGreaterThan(weak)
  })
})

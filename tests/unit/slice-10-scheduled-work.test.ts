import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { OPEN_DECISIONS, decisionRecord } from '@/disclosure/decisions'
import {
  ANCHORED_TIMERS,
  CANDIDATE_GROUPS,
  CARD_VERSUS_CROSSWALK,
  CARRIED_SCHEDULES,
  CROSSWALK,
  DEC_SCHED_011_INDEPENDENCE,
  DEPLOYABLE_OBLIGATIONS,
  DISCOVERY_FINDINGS,
  DNC_COVERAGE_OF_THE_SIX,
  DO_NOT_USE_CRON,
  INDEPENDENT_PROVENANCE,
  MATRIX_14_SCHEDULES,
  MATRIX_14_UNRECONCILED,
  NOT_AN_OBLIGATION,
  NOT_AN_OBLIGATION_COUNT,
  OBLIGATIONS_ABSENT_FROM_MATRIX_14,
  RECONCILIATION,
  SCHEDULED_WORK_CENSUS,
  STANDING_PROHIBITIONS,
  findingsFor,
  resolveFinding,
  scheduleKey,
  readScheduleKey,
  type DeployableObligationId,
  type DiscoveryFindingId,
} from '@/scheduling'

/**
 * Slice 10, wave 1, task 6 — the scheduled-work register spine.
 *
 * WHAT THIS FILE IS FOR, and it is not "the registers exist". Six registers
 * were transcribed and the failure modes that matter are all counting failures:
 *
 *   - A ROW COUNT SATISFIED BY THE SEPARATOR. Every count below is taken by
 *     walking the frozen source from a header line, past a separator that must
 *     be there, to where the body stops. `countTableBody` REFUSES a line that
 *     is not a header, and `the counter refuses a separator row` is the positive
 *     control that proves it — this build's catalogue holds "a table check
 *     satisfied by the `|---|---|` separator row".
 *   - A ROW COUNT PROVED BY A RENAME. A length is satisfied by any thirty-five
 *     rows at all, so every register is checked by SET EQUALITY of identifiers
 *     against the source, in both directions. The same catalogue holds "a
 *     row-count gate proved by a defect that renamed a row instead of deleting
 *     one".
 *   - TWO CATEGORIES WITH THE SAME NUMBER OF ROWS. §45A.2's discovery register
 *     and §45A.4.1's anchored timer register BOTH hold thirty-five rows, and the
 *     brief that dispatched this task guessed forty-six for the second. A count
 *     check would pass with the two registers swapped, so each is checked
 *     against its own body span and its own key shape: the timers carry no
 *     `SCHED-*` identifier at all.
 *
 * EVERY COUNT IS MEASURED FROM THE FROZEN SOURCE AT RUN TIME. A count copied
 * into an assertion is a count that stops measuring.
 */

/* ── the frozen source, and the floor that makes reading it meaningful ── */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const LINES: readonly string[] = ['', ...SOURCE_BYTES.toString('utf8').replace(/\n$/, '').split('\n')]

/** The line a citation names, whole. Truncating one is how findings get overturned. */
const L = (n: number): string => LINES[n] ?? ''

/** Chapter 45A owns scheduled work. Section 54.7 mints a register it never mentions. */
const CH_45A = { first: 97_959, last: 103_156 } as const
const SEC_54_7 = { first: 117_835, last: 118_034 } as const

const isRow = (text: string): boolean => text.startsWith('| ')
const isSeparator = (text: string): boolean => /^\|(?:-+\|)+$/.test(text.replace(/\s/g, ''))

/**
 * Walks a markdown table from its HEADER line and returns its body's line
 * numbers. Throws unless the line after the header is a separator, so a
 * separator can never be mistaken for a header and its own row can never be
 * counted as data.
 */
function countTableBody(header: number): readonly number[] {
  if (isSeparator(L(header))) throw new Error(`L${header} is a separator, not a header`)
  if (!isRow(L(header))) throw new Error(`L${header} is not a table row`)
  if (!isSeparator(L(header + 1))) throw new Error(`L${header + 1} is not a separator`)
  const body: number[] = []
  for (let n = header + 2; isRow(L(n)) && !isSeparator(L(n)); n += 1) body.push(n)
  return body
}

/** The first cell of a table row, backticks stripped. */
const firstCell = (n: number): string =>
  (L(n).split('|')[1] ?? '').trim().replace(/^`|`$/g, '')

/** Every one-based line in a span whose text contains a token. */
const linesIn = (span: { first: number; last: number }, token: string): readonly number[] => {
  const out: number[] = []
  for (let n = span.first; n <= span.last; n += 1) if (L(n).includes(token)) out.push(n)
  return out
}

/** The header line of each register, and nothing else hard-coded about its size. */
const HEADERS = {
  discoveryA: 98_339,
  discoveryB: 98_379,
  doNotUseCron: 98_483,
  anchoredTimers: 98_582,
  deployable: 102_394,
  crosswalk: 102_490,
  independentProvenance: 102_530,
  matrix14A: 117_890,
  matrix14B: 117_921,
  matrix14C: 117_952,
  carried: 66_408,
} as const

describe('the source, before anything is counted in it', () => {
  it('reads the frozen bytes these registers were transcribed from', () => {
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    expect(LINES.length - 1).toBe(122_241)
  })

  // THE POSITIVE CONTROL for every count in this file. Without it, a counter
  // that happily started on a separator row would make every table one row
  // longer and every assertion below would still be checked against the same
  // wrong number, because both sides would be wrong together.
  //
  // Planted: the `isSeparator(L(header))` guard removed from `countTableBody`.
  // RED — "expected [Function] to throw an error".
  it('refuses a separator row as a header, and never counts one as data', () => {
    for (const header of Object.values(HEADERS)) {
      expect(isSeparator(L(header)), `L${header} header`).toBe(false)
      expect(isSeparator(L(header + 1)), `L${header + 1} separator`).toBe(true)
      expect(() => countTableBody(header + 1)).toThrow(/separator, not a header/)
      const body = countTableBody(header)
      // THE ASSERTION THAT MAKES THIS A CONTROL RATHER THAN A RESTATEMENT: the
      // body starts two lines after the header, never one. A counter off by one
      // here inflates EVERY register in this file by exactly one row, and both
      // sides of every comparison below would be wrong together.
      expect(body[0], `L${header} first body line`).toBe(header + 2)
      expect(
        body.filter((n): boolean => isSeparator(L(n))),
        `L${header} body`,
      ).toEqual([])
    }
  })
})

describe('§45A.2 — the discovery register, thirty-five findings', () => {
  const bodyA = countTableBody(HEADERS.discoveryA)
  const bodyB = countTableBody(HEADERS.discoveryB)

  // FAILS IF: a finding is dropped, added, or RENAMED. Set equality in both
  // directions, because a length is satisfied by any thirty-five rows at all.
  //
  // Planted (a): `SCHED-020` deleted from `DISCOVERY_FINDINGS`. RED — the
  // module set is missing SCHED-020.
  // Planted (b): `SCHED-020` renamed to `SCHED-036`, length unchanged. RED —
  // the module set contains SCHED-036, which the source does not.
  it('holds exactly the identifiers the source enumerates, and no others', () => {
    const fromSource = bodyA.map(firstCell)
    const fromModule = DISCOVERY_FINDINGS.map((f): string => f.id)
    expect(fromSource).toHaveLength(35)
    expect([...fromModule].sort()).toEqual([...fromSource].sort())
    expect(bodyA[0]).toBe(98_341)
    expect(bodyA[bodyA.length - 1]).toBe(98_375)
  })

  // FAILS IF: Table B is treated as a second register rather than a second view.
  // It carries the SAME thirty-five identifiers, so the module declares them
  // once — and the census says so with two rows over one key space.
  it('gives Table B the same thirty-five identifiers, not a second set', () => {
    expect(bodyB.map(firstCell).sort()).toEqual(bodyA.map(firstCell).sort())
    const discoveryRows = SCHEDULED_WORK_CENSUS.filter(
      (r): boolean => r.keySpace === 'ch-45a.2-discovery',
    )
    expect(discoveryRows).toHaveLength(2)
    for (const row of discoveryRows) expect(row.counted).toBe(35)
  })

  // FAILS IF: a transcribed row is attributed to the wrong line. Each row's
  // `line` must carry its own identifier.
  it('pins every finding to a line that carries it', () => {
    for (const f of DISCOVERY_FINDINGS) expect(L(f.line), f.id).toContain(`\`${f.id}\``)
  })
})

describe('§45A.4.1 — the anchored timer register, and why its count is not the same fact', () => {
  const body = countTableBody(HEADERS.anchoredTimers)

  // FAILS IF: the timer register is confused with the discovery register. BOTH
  // hold thirty-five rows, which is exactly the shape "a count check true of
  // both the defect and the fix because two categories had the same number of
  // rows" — so the discriminator is asserted, not the number: this register is
  // keyed by TIMER NAME and carries no `SCHED-*` identifier anywhere.
  //
  // Planted: a thirty-sixth timer appended to `ANCHORED_TIMERS`. RED — 36
  // against the 35 rows the source body holds.
  it('holds thirty-five rows keyed by name, with no `SCHED-` identifier in any of them', () => {
    expect(body).toHaveLength(35)
    expect(ANCHORED_TIMERS).toHaveLength(body.length)
    expect(body[0]).toBe(98_584)
    expect(body[body.length - 1]).toBe(98_618)
    for (const n of body) expect(L(n), `L${n}`).not.toContain('`SCHED-')
    for (const t of ANCHORED_TIMERS) {
      expect(t.timer).not.toMatch(/SCHED-/)
      expect(L(t.line), t.timer).toContain(t.timer)
    }
  })

  // FAILS IF: a timer's value is paraphrased. The register exists because
  // "numbers drift" — a hedge dropped from a value is the defect it prevents.
  it('carries every value as the source states it, hedges included', () => {
    for (const t of ANCHORED_TIMERS) expect(L(t.line), t.timer).toContain(t.value)
  })
})

describe('§45A.3 and §45A.4.3 — twenty-two controls and eight prohibitions, which are not the same list', () => {
  // FAILS IF: the two enumerations are conflated. The `SCHED-*` cards cite the
  // EIGHT by bare number ("Prohibitions: 1, 2, 4"), so reading those numbers
  // against the twenty-two names the wrong rule every time.
  it('keeps the twenty-two `DNC-` controls and the eight standing prohibitions apart', () => {
    const body = countTableBody(HEADERS.doNotUseCron)
    expect(body).toHaveLength(22)
    expect(DO_NOT_USE_CRON.map((r): string => r.id)).toEqual(body.map(firstCell))
    expect(STANDING_PROHIBITIONS).toHaveLength(8)
    expect(STANDING_PROHIBITIONS.length).not.toBe(DO_NOT_USE_CRON.length)
    // The source states the eight beside the enumeration and the two agree.
    expect(L(98_845)).toContain('Each of the eight prohibitions')
    for (const p of STANDING_PROHIBITIONS) {
      expect(L(p.line), `prohibition ${p.number}`).toContain(`Prohibition ${p.number} —`)
      expect(L(p.line), `prohibition ${p.number}`).toContain(p.rule)
    }
  })

  it('pins each `DNC-` row to a line carrying its identifier and its correct mechanism', () => {
    for (const r of DO_NOT_USE_CRON) {
      expect(L(r.line), r.id).toContain(`\`${r.id}\``)
      expect(L(r.line), r.id).toContain(r.correctMechanism)
    }
  })

  it('holds the thirteen candidate groups the section title claims', () => {
    expect(CANDIDATE_GROUPS).toHaveLength(13)
    expect(L(98_691)).toContain('45A.4.2 The Thirteen Candidate Groups')
    for (const g of CANDIDATE_GROUPS) {
      expect(L(g.line), `group ${g.group}`).toContain(`Group ${g.group} — ${g.title}`)
    }
  })
})

describe('§45A.17 — the deployable register and the crosswalk', () => {
  const deployBody = countTableBody(HEADERS.deployable)
  const crossBody = countTableBody(HEADERS.crosswalk)
  const provBody = countTableBody(HEADERS.independentProvenance)

  it('holds twenty-four commitments, exactly the mnemonics the source lists', () => {
    expect(deployBody).toHaveLength(24)
    expect(DEPLOYABLE_OBLIGATIONS.map((o): string => o.id)).toEqual(deployBody.map(firstCell))
    for (const o of DEPLOYABLE_OBLIGATIONS) {
      expect(L(o.line), o.id).toContain(`\`${o.id}\``)
      expect(L(o.line), o.id).toContain(o.cadence)
    }
  })

  // `AC-SCHED-380`, L102543: every numbered finding appears exactly once here.
  //
  // Planted: `SCHED-020`'s crosswalk row deleted. RED — set equality fails and
  // the "exactly once" count drops to 34.
  it('resolves every numbered finding exactly once — `AC-SCHED-380`', () => {
    expect(L(102_543)).toContain(
      'every numbered finding in section 45A.2 appears exactly once in this crosswalk',
    )
    expect(crossBody).toHaveLength(35)
    const findings = CROSSWALK.map((r): string => r.finding)
    expect(new Set(findings).size).toBe(findings.length)
    expect([...findings].sort()).toEqual(DISCOVERY_FINDINGS.map((f): string => f.id).sort())
    expect(findings).toEqual(crossBody.map(firstCell))
  })

  // `AC-SCHED-381`, L102543: every obligation reachable from a finding or from
  // the independent-provenance table.
  it('leaves no commitment unreachable — `AC-SCHED-381`', () => {
    expect(provBody).toHaveLength(2)
    const reachable = new Set<string>([
      ...CROSSWALK.flatMap((r): readonly string[] => (r.obligation === null ? [] : [r.obligation])),
      ...INDEPENDENT_PROVENANCE.map((p): string => p.obligation),
    ])
    for (const o of DEPLOYABLE_OBLIGATIONS) expect([...reachable], o.id).toContain(o.id)
    expect(reachable.size).toBe(DEPLOYABLE_OBLIGATIONS.length)
    for (const p of INDEPENDENT_PROVENANCE) {
      expect(L(p.line), p.obligation).toContain(`\`${p.obligation}\``)
    }
  })

  // `AC-SCHED-383`, L102543: every "not an obligation" row names the mechanism
  // carrying the behaviour instead.
  //
  // Planted: `SCHED-034`'s resolution truncated to "Not a scheduled
  // obligation." RED — no replacement mechanism named.
  it('names a replacement mechanism on every non-obligation — `AC-SCHED-383`', () => {
    for (const finding of NOT_AN_OBLIGATION) {
      const r = resolveFinding(finding)
      expect(r?.kind, finding).toBe('not-an-obligation')
      const mechanism = r?.kind === 'not-an-obligation' ? r.mechanism : ''
      expect(mechanism, finding).toMatch(/^Not a scheduled obligation/)
      // The classification alone is not a resolution. What must be there is the
      // mechanism that carries the behaviour instead, so the remainder after the
      // bare phrase is what is measured — a row truncated to the classification
      // leaves nothing here and goes red.
      expect(
        mechanism.slice('Not a scheduled obligation'.length).replace(/^[\s,.:;]+/, '').length,
        finding,
      ).toBeGreaterThan(20)
    }
  })

  // FAILS IF: a resolution is transcribed from anywhere but its own row.
  it('quotes every resolution from the line it cites', () => {
    for (const r of CROSSWALK) expect(L(r.line), r.finding).toContain(r.resolution)
  })

  // THE COUNT THE SOURCE STATES AGAINST THE ONE IT ENUMERATES. L102467 and
  // L102486 say fourteen; L102535 says thirteen; the rows say thirteen. Both
  // figures are pinned so neither can quietly become the other.
  //
  // Planted: `SCHED-034`'s obligation set to `SCHED-DB-MAINT`. RED — counted
  // drops to 12 and the reconciliation's mapped count rises to 23.
  it('counts thirteen non-obligations where the source says both thirteen and fourteen', () => {
    expect(NOT_AN_OBLIGATION).toHaveLength(NOT_AN_OBLIGATION_COUNT.counted)
    expect(NOT_AN_OBLIGATION_COUNT.counted).toBe(13)
    expect(L(NOT_AN_OBLIGATION_COUNT.statedAsThirteen)).toContain(
      '35 numbered findings resolve to 22 mapped obligations and 13 classified as not scheduled obligations',
    )
    expect(L(NOT_AN_OBLIGATION_COUNT.statedAsFourteen)).toContain(
      'Fourteen of the thirty-five findings resolve to "not a scheduled obligation"'.replace(
        /"/g,
        '"',
      ),
    )
    expect(L(NOT_AN_OBLIGATION_COUNT.restatedAsFourteen)).toContain(
      'fourteen findings resolve to no obligation',
    )
  })

  it('recomputes the reconciliation rather than quoting it', () => {
    expect(RECONCILIATION).toEqual({
      findings: 35,
      mapped: 22,
      notObligations: 13,
      independentProvenance: 2,
      obligations: 24,
    })
    // Several findings may map to one commitment; `SCHED-001` is the only
    // finding behind the run auto-close, and `SCHED-SUSPEND-HARD` has none.
    expect(findingsFor('SCHED-RUN-AUTOCLOSE')).toEqual(['SCHED-001'])
    expect(findingsFor('SCHED-SUSPEND-HARD')).toEqual([])
  })
})

describe('L102392 — the line that dissolves the card-versus-crosswalk conflict', () => {
  // FAILS IF: the sentence this whole task turns on stops saying what it says.
  // Read whole, and quoted in the three fragments that carry the argument.
  it('states two schemes, a finding against a commitment, and findings mapping to none', () => {
    const line = L(102_392)
    expect(line).toContain('stated plainly because two numbering schemes exist')
    expect(line).toContain('it includes candidates that turned out **not** to be scheduled obligations at all')
    expect(line).toContain('a numbered row is a finding, a mnemonic row is a commitment')
    expect(line).toContain(
      'several numbered findings map to none because the sweep classified them as event-driven, request-time validated or device-local',
    )
    expect(line).toContain('That crosswalk closes `DEC-SCHED-011`, which recorded its absence')
  })

  // FAILS IF: any of the six pairs becomes a real conflict, or a seventh
  // appears. Six is not asserted as a number alone — the six are exactly the
  // non-obligations that have a card in §45A.8, and that is what is checked.
  //
  // Planted: `SCHED-020`'s `cardAgrees` text changed to a sentence that is not
  // on L99430. RED — the card line does not contain the quotation.
  it('finds all six cards agreeing with their crosswalk row, and no seventh card at all', () => {
    expect(CARD_VERSUS_CROSSWALK).toHaveLength(6)
    for (const pair of CARD_VERSUS_CROSSWALK) {
      expect(pair.conflicts, pair.finding).toBe(false)
      expect(L(pair.cardLine), pair.finding).toContain(`**Card \`${pair.finding}\``)
      expect(L(pair.cardLine), pair.finding).toContain(pair.cardAgrees)
      expect(L(pair.crosswalkLine), pair.finding).toContain('Not a scheduled obligation')
      expect(NOT_AN_OBLIGATION, pair.finding).toContain(pair.finding)
    }
    // The population, measured: of the thirteen non-obligations, exactly these
    // six carry a card. A card exists for a finding when §45A.8 opens a line
    // with `**Card \`SCHED-0NN\``.
    const carded = NOT_AN_OBLIGATION.filter((finding): boolean =>
      linesIn(CH_45A, `**Card \`${finding}\``).length > 0,
    )
    expect([...carded].sort()).toEqual(CARD_VERSUS_CROSSWALK.map((p): string => p.finding).sort())
  })

  // FAILS IF: the plan's claim that `DNC-02` covers the qualification-calendar
  // horizon is reinstated. It does not: `DNC-02` is the qualification GATE, and
  // what it licenses a sweeper to do is the warning ladder.
  it('finds `DNC-03` naming clearance expiry and `DNC-02` naming the gate, not the calendar', () => {
    expect(DNC_COVERAGE_OF_THE_SIX.clearanceLapse.namedProhibition).toBe(true)
    expect(DNC_COVERAGE_OF_THE_SIX.qualificationCalendarHorizon.namedProhibition).toBe(false)
    expect(L(98_487)).toContain('Clearance validity and its expiry')
    expect(L(98_486)).toContain('Qualification gate at assignment, run start and gated screens')
    expect(L(98_486)).not.toContain('Calendar')
    const calendarRows = DO_NOT_USE_CRON.filter((r): boolean =>
      r.functionality.includes('Calendar'),
    )
    expect(calendarRows).toEqual([])
  })
})

describe('the fourth key space, and the register nothing cross-references', () => {
  // FAILS IF: `SCHED-01` and `SCHED-010` are conflated. Both are real
  // identifiers of different things, and one is a prefix of the other — the
  // same shape as `Allowed` being a prefix of `Allowed with conditions`.
  it('keeps `SCHED-01` and `SCHED-010` apart even though one is a prefix of the other', () => {
    expect('SCHED-010'.startsWith('SCHED-01')).toBe(true)
    const a = scheduleKey('ch-54.7-matrix-14', 'SCHED-01')
    const b = scheduleKey('ch-45a.2-discovery', 'SCHED-010')
    expect(a).not.toBe(b)
    expect(readScheduleKey(a)).toEqual({ space: 'ch-54.7-matrix-14', id: 'SCHED-01' })
    expect(readScheduleKey(b)).toEqual({ space: 'ch-45a.2-discovery', id: 'SCHED-010' })
    // `SCHED-01` is the per-shift digest and `SCHED-010` is the visibility
    // horizon — different subjects, so conflating them renders the wrong row.
    expect(L(117_892)).toContain('Per-shift digest delivery')
    expect(L(98_350)).toContain('Schedule visibility horizon')
  })

  // @ts-expect-error a key space cannot be defaulted, and a bare id is not a key
  const _noSpace = (): unknown => scheduleKey('SCHED-01')
  // @ts-expect-error `SCHED-010` is not in Matrix 14's range
  const _wrongSpace = (): unknown => scheduleKey('ch-54.7-matrix-14', 'SCHED-010')
  // @ts-expect-error a bare string is not a `ScheduleKey`
  const _unbranded = (): unknown => readScheduleKey('SCHED-01')

  it('rejects a bare identifier and a cross-space one at compile time', () => {
    expect([_noSpace, _wrongSpace, _unbranded]).toHaveLength(3)
  })

  // FAILS IF: a cross-reference appears and the collision stops being one, or
  // the module keeps claiming an isolation the source no longer has. Measured
  // in both directions over both spans.
  it('measures zero cross-reference between chapter 45A and section 54.7', () => {
    for (const token of ['Matrix 14', 'Matrix Fourteen', 'section 54.7']) {
      expect(linesIn(CH_45A, token), token).toEqual([])
    }
    expect(linesIn(SEC_54_7, '45A')).toEqual([])
    // Both spans really are the chapters this claims. Without this the two
    // emptiness checks above would pass on any two empty ranges.
    expect(L(CH_45A.first)).toContain('# 45A. Scheduled Jobs')
    expect(L(SEC_54_7.first)).toContain('## 54.7 Matrix Fourteen: The Scheduled-Work Chain')
  })

  it('holds Matrix 14 as twenty-four rows over one key space in three blocks', () => {
    const a = countTableBody(HEADERS.matrix14A)
    const b = countTableBody(HEADERS.matrix14B)
    const c = countTableBody(HEADERS.matrix14C)
    expect(a).toHaveLength(24)
    expect(b.map(firstCell)).toEqual(a.map(firstCell))
    expect(c.map(firstCell)).toEqual(a.map(firstCell))
    expect(MATRIX_14_SCHEDULES.map((m): string => m.id)).toEqual(a.map(firstCell))
    for (const m of MATRIX_14_SCHEDULES) {
      expect(L(m.line), m.id).toContain(`\`${m.id}\``)
      expect(L(m.line), m.id).toContain(m.requirement)
    }
  })

  // FAILS IF: the six conflicts are softened into an agreement, or one side is
  // picked. Both statements must be present at their own lines and neither may
  // be marked the answer — the records carry no field in which one could be.
  //
  // Planted: `SCHED-22`'s `findings` changed to `['SCHED-004']`, a finding that
  // IS an obligation. RED — the finding is not in `NOT_AN_OBLIGATION`.
  it('carries six unreconciled pairs and settles none of them', () => {
    expect(MATRIX_14_UNRECONCILED).toHaveLength(6)
    for (const conflict of MATRIX_14_UNRECONCILED) {
      expect(Object.keys(conflict).sort()).toEqual([
        'crosswalkLines',
        'crosswalkSays',
        'findings',
        'matrix14',
        'matrix14Line',
        'matrix14Says',
      ])
      expect(L(conflict.matrix14Line), conflict.matrix14).toContain(`\`${conflict.matrix14}\``)
      for (const finding of conflict.findings) {
        expect(NOT_AN_OBLIGATION, finding).toContain(finding)
      }
      for (const n of conflict.crosswalkLines) {
        expect(L(n)).toContain('Not a scheduled obligation')
      }
      expect(conflict.findings.length).toBe(conflict.crosswalkLines.length)
    }
    // The six are exactly the Matrix 14 rows whose subject the crosswalk denies,
    // and the four commitments Matrix 14 omits are the complement of the twenty
    // it covers: 24 rows, 20 obligations covered, 4 absent.
    expect(OBLIGATIONS_ABSENT_FROM_MATRIX_14).toHaveLength(4)
    const absent: readonly string[] = OBLIGATIONS_ABSENT_FROM_MATRIX_14
    const covered = DEPLOYABLE_OBLIGATIONS.filter((o): boolean => !absent.includes(o.id))
    expect(covered).toHaveLength(20)
  })

  // FAILS IF: §30A.3's seven are treated as authoritative. L102537 rules them
  // narrative short forms of the same obligations, and the deployable register
  // wins where they differ.
  it('carries §30A.3 seven short forms under the ruling that governs them', () => {
    const body = countTableBody(HEADERS.carried)
    expect(body).toHaveLength(7)
    expect(CARRIED_SCHEDULES.map((s): string => s.id)).toEqual(body.map(firstCell))
    expect(L(66_398)).toContain('30A.3 The Seven Carried Schedules')
    expect(L(102_537)).toContain(
      'Chapters 27 and 30A use abbreviated mnemonics for readability inside a story',
    )
    expect(L(102_537)).toContain('this table and section 45A.17.1 are authoritative')
  })

  // FAILS IF: the census stops naming four key spaces, or names a fifth without
  // a register behind it. Declared as a literal list outside the module, so a
  // deletion inside it has something left to disagree with.
  it('accounts for four `SCHED-` key spaces and the registers that carry none', () => {
    const spaces = new Set(
      SCHEDULED_WORK_CENSUS.flatMap((r): readonly string[] => (r.keySpace === null ? [] : [r.keySpace])),
    )
    expect([...spaces].sort()).toEqual([
      'ch-30a.3-carried',
      'ch-45a.17.1-deployable',
      'ch-45a.2-discovery',
      'ch-54.7-matrix-14',
    ])
    // The four registers with no key space: two prohibition-shaped
    // enumerations, the candidate groups, and the name-keyed timer register.
    expect(SCHEDULED_WORK_CENSUS.filter((r): boolean => r.keySpace === null)).toHaveLength(4)
    // Where the source states a count, it agrees with the enumeration.
    for (const row of SCHEDULED_WORK_CENSUS) {
      if (row.stated !== null) expect(row.stated, row.register).toBe(row.counted)
    }
  })
})

describe('`DEC-SCHED-011` — one home, and this module independent of all three readings', () => {
  // FAILS IF: a second home for the decision appears under `src/scheduling/`.
  // `DecisionDisclosure` exists to prevent exactly that, and the trap fired
  // once already this slice when a task's prose named `DEC-STORE-001`.
  it('discloses the three readings in the canon and restates none of them here', () => {
    expect(DEC_SCHED_011_INDEPENDENCE.disclosedIn).toBe('src/disclosure/decisions.ts')
    expect(DEC_SCHED_011_INDEPENDENCE.settlesNothing).toBe(true)
    const record = decisionRecord('DEC-SCHED-011')
    expect(record.readings).toHaveLength(3)
    expect(record.adopted).toContain('Nothing is settled here')
    // The three locators, each carrying what the reading claims of it.
    expect(L(51_002)).toContain('`DEC-SCHED-001` through `DEC-SCHED-010`')
    expect(L(115_148)).toContain('`DEC-SCHED-011`')
    expect(L(102_547)).toContain('This crosswalk closes `DEC-SCHED-011`, which recorded its absence')
    // And the canon holds it as one record, not two.
    expect(OPEN_DECISIONS.filter((d): boolean => d.id === 'DEC-SCHED-011')).toHaveLength(1)
  })

  // FAILS IF: any code path in this spine branches on which reading is true.
  // The crosswalk is correct whether the decision does not exist, is open, or
  // is closed — so nothing here may read it, and the resolver's answers are the
  // proof: they come from the rows and from nothing else.
  it('resolves every finding without consulting the decision at all', () => {
    for (const f of DISCOVERY_FINDINGS) {
      const r = resolveFinding(f.id)
      expect(r, f.id).toBeDefined()
      if (r?.kind === 'obligation') {
        expect(
          DEPLOYABLE_OBLIGATIONS.map((o): DeployableObligationId => o.id),
          f.id,
        ).toContain(r.obligation)
      }
    }
    // A finding outside the register is a miss, not a wrong answer.
    expect(resolveFinding('SCHED-036' as DiscoveryFindingId)).toBeUndefined()
  })
})

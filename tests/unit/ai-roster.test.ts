import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  AI_AGENT_IDS,
  AI_AGENT_ROSTER,
  GOVERNANCE_BINDINGS,
  GOVERNANCE_BINDING_ALIAS,
  aiRosterAgent,
  canonicalGovernanceBinding,
} from '@/ai/agents/roster'
import {
  GOVERNANCE_BINDINGS as STUDIO_GOVERNANCE_BINDINGS,
  STANDARD_AGENTS,
} from '@/studio/modules/stu-02/agents'

/**
 * Slice 11, wave 0, task 6 — the cross-surface agent roster and the
 * governance-binding alias pair.
 *
 * WHAT THIS FILE IS FOR. Not "the roster exists". Three things that were each
 * wrong somewhere before this file existed:
 *
 *   1. THE ROSTER IS FOUR AND THE REPO HELD THREE. Chapter 20's table gives
 *      the three V1 agents; chapter 44's roster adds the Vision Reasoning
 *      Agent. The dispatch brief located that roster's data rows one table
 *      row too high — it named a span whose first two lines are the header
 *      and the separator, and whose last line is the third agent, so the
 *      fourth agent was outside the span the brief cited for it. Every row
 *      index below is measured off the frozen source at run time rather than
 *      transcribed, so the same slip cannot be re-shipped here.
 *   2. THE THIRD GOVERNANCE VALUE IS SPELLED TWO WAYS IN THE SOURCE and this
 *      tree already ships BOTH, in two files that do not know about each
 *      other. Deleting either breaks a verbatim-string assertion somewhere.
 *      So one is registered canonical, the other as its alias, both render,
 *      and both locator sets are pinned.
 *   3. THE VISION AGENT HAS NO ROLE MATRIX ANYWHERE. That is an absence in
 *      the source, and an absence and an oversight look identical from
 *      outside — so it is MEASURED here across the whole of its section
 *      rather than asserted in a comment.
 *
 * Every count and every locator below is re-derived from the frozen bytes at
 * run time. A count copied into an assertion is a count that has stopped
 * measuring.
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

/** Every one-based line number on which a token occurs. */
const linesCarrying = (token: string): readonly number[] =>
  LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])

/** Occurrences, not lines. Three lines carry the canonical spelling twice. */
const occurrencesOf = (token: string): number => SOURCE_TEXT.split(token).length - 1

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the roster table, located by structure rather than by transcription ─ */

/**
 * The roster's header row. Found by searching, not asserted from the brief:
 * the brief's span started here and this line is not a data row.
 */
const ROSTER_HEADER = (() => {
  const found = linesCarrying('| Agent | Type | Governance | Availability at V1 | Failure impact class |')
  expect(found, 'the roster header occurs exactly once in the frozen source').toHaveLength(1)
  return found[0]!
})()

/** The contiguous run of table rows under the header, minus the separator. */
const ROSTER_ROWS = (() => {
  const rows: number[] = []
  for (let n = ROSTER_HEADER + 1; L(n).startsWith('|'); n += 1) {
    if (/^\|[\s|:-]+\|$/.test(L(n))) continue
    rows.push(n)
  }
  return rows
})()

describe('the roster is located by counting rows, never by trusting a span', () => {
  /**
   * FAILS IF: the header or the separator is ever counted as an agent, which
   * is the slip that put the fourth agent outside the span the dispatch brief
   * cited for it. Asserted on the CONTENT of the two lines rather than on
   * their numbers, so it states what is there and not merely where.
   */
  it('puts the header and the separator above the first agent', () => {
    expect(L(ROSTER_HEADER)).toContain('| Agent | Type | Governance |')
    expect(L(ROSTER_HEADER + 1), 'the separator is not a data row').toMatch(/^\|[\s|:-]+\|$/)
    expect(ROSTER_ROWS[0], 'the first data row').toBe(ROSTER_HEADER + 2)
    expect(cells(L(ROSTER_ROWS[0]!))[0]).toBe('Prevention Agent')
  })

  /**
   * FAILS IF: an agent is added to or lost from the register, or the register
   * stops matching the source's own row order. Both directions, and the
   * expectation is the SOURCE's first column rather than a literal list, so
   * the register cannot pass by agreeing with a copy of itself.
   *
   * Planted: the Vision Reasoning Agent record deleted from `AI_AGENT_ROSTER`.
   * RED, naming the missing name against the source's fourth row.
   */
  it('registers exactly the agents the source rosters, in the source’s order', () => {
    const fromSource = ROSTER_ROWS.map((n) => cells(L(n))[0]!)
    expect(AI_AGENT_ROSTER.map((a) => a.name)).toEqual(fromSource)
    expect(AI_AGENT_ROSTER.map((a) => a.id)).toEqual([...AI_AGENT_IDS])
  })

  /**
   * FAILS IF: a transcribed cell drifts from the cell it claims. Every record
   * names its own row, and every verbatim field is checked against that row's
   * own cell — so a record pointing at the wrong row is red even when its
   * text is a real sentence from somewhere else in the chapter.
   *
   * Planted: `failureImpactClass` on the Shift Handoff Agent replaced with the
   * Prevention Agent's. RED, naming the cell.
   */
  it('transcribes every roster cell from the row it cites', () => {
    for (const agent of AI_AGENT_ROSTER) {
      const row = Number(agent.sourceRef.replace(/^L/, ''))
      expect(ROSTER_ROWS, `${agent.id} cites a roster row`).toContain(row)
      const [name, type, governance, availability, impact] = cells(L(row))
      expect(agent.name, `${agent.id} name`).toBe(name)
      expect(agent.typeWording, `${agent.id} type`).toBe(type)
      expect(agent.governanceWording, `${agent.id} governance`).toBe(governance)
      expect(agent.availabilityAtV1, `${agent.id} availability`).toBe(availability)
      expect(agent.failureImpactClass, `${agent.id} failure impact`).toBe(impact)
    }
  })

  /**
   * FAILS IF: a STRUCTURED field disagrees with the source cell it is derived
   * from. The verbatim cells above are checked against the row; `kind` and
   * `governanceBinding` are not verbatim — they are this build's reading of
   * the Type and Governance cells — and nothing read their VALUES until this
   * gate existed. A record could carry `kind: 'reasoning agent'` beside
   * `typeWording: 'Action'`, and `governanceBinding: 'runtime human gate'`
   * beside a governance cell declaring `authoring-time policy`, and the whole
   * file stayed green. That second pairing is exactly what this module's own
   * doc comment cites L31692 to forbid: pre-authorised policy presented as
   * though it were a runtime human gate.
   *
   * The expectation needs no new data. The Type cell says Action or Reasoning
   * and the Governance cell either declares a binding literal in backticks or
   * declares none, so both structured fields are DERIVED from the source row
   * here and compared with what the record claims.
   *
   * Planted: the controller's own defect — `kind: 'reasoning agent'` and
   * `governanceBinding: 'runtime human gate'` on the Prevention Agent, whose
   * cells say Action and `authoring-time policy`. RED on both fields, naming
   * the agent. Restored.
   */
  it('derives kind and the governance binding from the cells, and the record agrees', () => {
    for (const agent of AI_AGENT_ROSTER) {
      const [, type, governance] = cells(L(Number(agent.sourceRef.replace(/^L/, ''))))

      // Type cell → kind. The Vision row's cell is 'Reasoning at the roster
      // level (§8.3.3)', so the cell is read by its opening word.
      const firstWord = type!.split(' ')[0]
      expect(['Action', 'Reasoning'], `${agent.id} type cell`).toContain(firstWord)
      expect(agent.kind, `${agent.id} kind`).toBe(
        firstWord === 'Action' ? 'action agent' : 'reasoning agent',
      )

      // Governance cell → binding. A backticked literal after the words
      // 'Governance binding' is a declared binding; anything else is not one,
      // and a record inventing a binding where the cell declares none is the
      // Vision agent's defect rather than the Prevention Agent's.
      const declared = governance!.match(/Governance binding `([^`]+)`/)?.[1] ?? null
      expect(agent.governanceBinding, `${agent.id} governance binding`).toBe(
        declared === null ? null : canonicalGovernanceBinding(declared),
      )
      if (declared !== null) {
        expect(canonicalGovernanceBinding(declared), `${agent.id} declares a known binding`).not.
          toBeNull()
      }

      // And the absence field is the exact complement of the binding field, so
      // a record can never carry both or neither.
      expect(agent.governanceAbsence === null, `${agent.id} governance absence`).toBe(
        declared !== null,
      )
      if (agent.governanceAbsence !== null) {
        expect(governance, `${agent.id} absence is the cell’s own words`).toContain(
          agent.governanceAbsence,
        )
      }
    }
  })
})

/* ── the Vision agent: three stated absences, all measured ─────────────── */

/** The three permission tokens this build renders role matrices from. */
const PERMISSION_TOKENS = ['Explicitly prohibited', 'Allowed with conditions', 'Read-only'] as const

/** A `## ` heading through the line before the next `## ` heading. */
const sectionSpan = (heading: string): { readonly start: number; readonly end: number } => {
  const found = linesCarrying(heading)
  expect(found, `${heading} occurs exactly once`).toHaveLength(1)
  const start = found[0]!
  let end = start + 1
  while (!L(end).startsWith('## ')) end += 1
  return { start, end: end - 1 }
}

/**
 * All four agent sections, not only the one with the absence. The claim is
 * comparative — 44.4 is the ONLY one of the four with no permission table —
 * and a sweep of 44.4 alone proves only half of it.
 */
const AGENT_SECTIONS = [
  '## 44.1 Prevention Agent',
  '## 44.2 Deviation and Containment Agent',
  '## 44.3 Shift Handoff Agent',
  '## 44.4 Vision Reasoning Agent',
] as const

const SECTION_44_4 = sectionSpan(AGENT_SECTIONS[3])

describe('the Vision agent renders as a stated absence, never as a coming-soon placeholder', () => {
  /**
   * FAILS IF: the build ever gives the Vision agent a governance binding. The
   * source's cell says the governance is not specified beyond the roster
   * entry, so a binding here would be an invention that reads as a contract.
   *
   * Planted: `governanceBinding: 'none — reasoning agent'` on the Vision
   * record. RED on both halves — the binding is no longer null and the
   * absence note is no longer the source's own words.
   */
  it('gives the Vision agent no governance binding, because the source states none', () => {
    const vision = aiRosterAgent(AI_AGENT_ROSTER, 'vision-reasoning')
    expect(vision.governanceBinding).toBeNull()
    expect(vision.governanceAbsence).not.toBeNull()
    expect(L(Number(vision.sourceRef.replace(/^L/, '')))).toContain(vision.governanceAbsence!)
    expect(vision.availableAtV1).toBe(false)
    for (const other of AI_AGENT_ROSTER) {
      if (other.id === 'vision-reasoning') continue
      expect(other.governanceBinding, `${other.id}`).not.toBeNull()
      expect(other.availableAtV1, `${other.id}`).toBe(true)
    }
  })

  /**
   * FAILS IF: the role-matrix absence is asserted rather than measured. The
   * whole of section 44.4 is swept for the three permission tokens this build
   * renders matrices from; the record's absence note may stand only while the
   * sweep finds none of them.
   *
   * AND THE CLAIM IS COMPARATIVE, so both sides are measured. "44.4 is the
   * only one of the four agent sections with no permission table" is two
   * facts: 44.4 has none, and 44.1, 44.2 and 44.3 each have some. Sweeping
   * only 44.4 proves the first and leaves the second an assertion — and a
   * sweep that found nothing in ANY of the four (a mis-spelled token, a
   * changed span helper) would have passed the half-measured version while
   * proving nothing at all. So all four sections are swept and the zero is
   * asserted to be unique among them.
   *
   * Planted: the sweep narrowed to the section's first ten lines. RED — the
   * span no longer covers the section it claims to have swept.
   * Planted: all three permission tokens mis-spelled, so the sweep can find
   * nothing anywhere. The half-measured version of this test was GREEN on that
   * plant — it only ever asked 44.4 for an empty result and got one. This
   * version is RED, listing all four sections as empty.
   */
  it('finds no permission token in 44.4, and finds them in the other three', () => {
    const sweepOf = (heading: string): readonly string[] => {
      const span = sectionSpan(heading)
      return LINES.slice(span.start, span.end + 1)
    }
    const hitLines = (swept: readonly string[]): readonly string[] =>
      swept.filter((t) => PERMISSION_TOKENS.some((token) => t.includes(token)))

    const swept = LINES.slice(SECTION_44_4.start, SECTION_44_4.end + 1)
    expect(swept.length, 'the sweep covers the whole section').toBeGreaterThan(200)
    for (const token of PERMISSION_TOKENS) {
      const hits = swept.filter((t) => t.includes(token))
      expect(hits, `${token} inside section 44.4`).toEqual([])
    }

    // The other side of the same claim: the three sections that DO have a
    // matrix carry permission tokens, so the zero above is a property of 44.4
    // and not of the sweep.
    const empty = AGENT_SECTIONS.filter((heading) => hitLines(sweepOf(heading)).length === 0)
    expect(empty, 'exactly one agent section carries no permission token').toEqual([
      AGENT_SECTIONS[3],
    ])
    for (const heading of AGENT_SECTIONS.slice(0, 3)) {
      expect(hitLines(sweepOf(heading)).length, `${heading} permission rows`).toBeGreaterThan(0)
    }

    const vision = aiRosterAgent(AI_AGENT_ROSTER, 'vision-reasoning')
    expect(vision.roleMatrixAbsence).not.toBeNull()
    for (const other of AI_AGENT_ROSTER) {
      if (other.id === 'vision-reasoning') continue
      expect(other.roleMatrixAbsence, `${other.id}`).toBeNull()
    }
  })

  /**
   * FAILS IF: the absence note stops carrying the ruling that forbids the
   * obvious wrong rendering. `SB-AI-006` is the reason this is an absence and
   * not a disabled row, and the record must carry it where a reader looking at
   * the record will find it.
   */
  it('carries SB-AI-006’s ruling on the record, checked against the line it cites', () => {
    const vision = aiRosterAgent(AI_AGENT_ROSTER, 'vision-reasoning')
    const note = vision.roleMatrixAbsence!
    expect(note).toContain('SB-AI-006')
    const cited = note.match(/L(\d{3,6})/g) ?? []
    expect(cited.length, 'the note pins at least one line').toBeGreaterThan(0)
    for (const token of cited) {
      const n = Number(token.slice(1))
      expect(L(n).length, `${token} is not a blank line`).toBeGreaterThan(0)
    }
    const sbLine = linesCarrying('Storyboard `SB-AI-006`')
    expect(sbLine).toHaveLength(1)
    expect(note).toContain(`L${sbLine[0]}`)
    expect(L(sbLine[0]!)).toContain('must not display a greyed-out')
  })
})

/* ── the alias pair ────────────────────────────────────────────────────── */

describe('the governance-binding alias pair, both spellings kept', () => {
  /**
   * FAILS IF: the canonical and the alias are ever swapped. The criterion is
   * the source's own weight of usage, re-measured here — the register may not
   * simply agree with a constant this file also declares.
   *
   * Planted: canonical and alias swapped in `GOVERNANCE_BINDING_ALIAS`. RED,
   * because the alias then outweighs the canonical in the frozen source.
   */
  it('registers the spelling the source uses more often as the canonical one', () => {
    const canonical = GOVERNANCE_BINDING_ALIAS.canonical
    const alias = GOVERNANCE_BINDING_ALIAS.alias
    expect(occurrencesOf(canonical)).toBeGreaterThan(occurrencesOf(alias))
    expect(linesCarrying(canonical).length).toBeGreaterThan(linesCarrying(alias).length)
    expect(GOVERNANCE_BINDINGS).toContain(canonical)
    expect(GOVERNANCE_BINDINGS as readonly string[]).not.toContain(alias)
  })

  /**
   * FAILS IF: a pinned locator stops carrying the spelling it is pinned for.
   * Both sets, in both directions, so a locator moved onto the other spelling
   * is red rather than silently plausible.
   *
   * Planted: `L31709` moved from the alias set to the canonical set. RED —
   * that line carries the alias spelling and not the canonical one.
   */
  it('pins both locator sets, and each line carries the spelling it is pinned for', () => {
    for (const locator of GOVERNANCE_BINDING_ALIAS.canonicalLocators) {
      expect(L(Number(locator.slice(1))), `${locator} canonical`).toContain(
        GOVERNANCE_BINDING_ALIAS.canonical,
      )
    }
    for (const locator of GOVERNANCE_BINDING_ALIAS.aliasLocators) {
      expect(L(Number(locator.slice(1))), `${locator} alias`).toContain(
        GOVERNANCE_BINDING_ALIAS.alias,
      )
      expect(L(Number(locator.slice(1))), `${locator} is alias-only`).not.toContain(
        GOVERNANCE_BINDING_ALIAS.canonical,
      )
    }
    expect(GOVERNANCE_BINDING_ALIAS.aliasLocators.length).toBeGreaterThan(0)
    expect(GOVERNANCE_BINDING_ALIAS.canonicalLocators.length).toBeGreaterThan(0)
  })

  /**
   * FAILS IF: the resolver stops mapping the alias onto the canonical value,
   * or starts accepting a spelling the source does not carry. The second half
   * is the one that matters: a resolver that maps anything is a resolver that
   * silently invents a fourth value.
   */
  it('resolves either spelling to one value, and nothing else to any value', () => {
    expect(canonicalGovernanceBinding(GOVERNANCE_BINDING_ALIAS.alias)).toBe(
      GOVERNANCE_BINDING_ALIAS.canonical,
    )
    for (const binding of GOVERNANCE_BINDINGS) {
      expect(canonicalGovernanceBinding(binding), binding).toBe(binding)
    }
    expect(canonicalGovernanceBinding('no gate')).toBeNull()
    expect(canonicalGovernanceBinding('')).toBeNull()
  })
})

/* ── the lift: the Studio keeps its own view, and its own spelling ─────── */

describe('the Studio view survives the lift with the spelling it shipped', () => {
  /**
   * FAILS IF: the lift deletes the spelling the Studio ships. A verbatim
   * assertion in `stu-agents.test.ts` is written against that literal, and a
   * check written against one spelling fails on the other — which is why the
   * alias is registered rather than corrected.
   *
   * Planted: the Studio's third binding replaced with the canonical spelling.
   * RED here AND in `stu-agents.test.ts`, which is the point.
   */
  it('keeps the alias spelling in the Studio’s own vocabulary', () => {
    expect(STUDIO_GOVERNANCE_BINDINGS as readonly string[]).toContain(
      GOVERNANCE_BINDING_ALIAS.alias,
    )
    const handoff = STANDARD_AGENTS.find((a) => a.id === 'shift-handoff')!
    expect(handoff.governanceBinding).toBe(GOVERNANCE_BINDING_ALIAS.alias)
    expect(canonicalGovernanceBinding(handoff.governanceBinding)).toBe(
      GOVERNANCE_BINDING_ALIAS.canonical,
    )
  })

  /**
   * FAILS IF: the Studio's chapter-20 view silently grows the chapter-44
   * agent. They are different tables with different columns, and the Studio's
   * one has no Vision row — asserted against the source's own chapter-20
   * table rather than against a number.
   */
  it('leaves the Studio’s chapter-20 view holding only the agents that table names', () => {
    const studioRows = STANDARD_AGENTS.map((a) => Number(a.sourceRef.replace(/^L/, '')))
    for (const n of studioRows) expect(L(n), `L${n}`).toMatch(/^\| .* Agent \|/)
    expect(STANDARD_AGENTS.map((a) => a.name)).toEqual(studioRows.map((n) => cells(L(n))[0]!))
    expect(STANDARD_AGENTS.map((a) => a.id as string)).not.toContain('vision-reasoning')
    // And the roster is the superset, not a parallel list: every Studio agent
    // is a roster agent under the same id.
    for (const a of STANDARD_AGENTS) {
      expect(AI_AGENT_IDS as readonly string[], a.id).toContain(a.id)
    }
  })
})

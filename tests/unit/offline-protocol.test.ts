import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { DEC_SYNC_001_ORDER } from '@/frontline/commands'
import {
  AC_36_101_CRITERION,
  CAPTURE_UPLOAD_STEP,
  COMMAND_MANIFEST_READ_STEP,
  MANIFEST_EXCHANGE_STEP,
  PHASE_EIGHT_STEP_COUNT_CONTRADICTION,
  PROTOCOL_DISCLOSURES,
  PROTOCOL_PHASES,
  PROTOCOL_SOURCE_CLASSIFICATIONS,
  PROTOCOL_STEPS,
  TRANSFER_PASSES,
  firstNonSuccessStep,
  isSuccessfulFullPass,
  satisfiesAc36101,
  satisfiesAc36102,
  step,
  stepsInPhase,
  type StepOutcome,
} from '@/offline/protocol'

/**
 * THE FROZEN SOURCE IS THE ORACLE, NOT THE MODULE.
 *
 * Every structural assertion below derives its expectation by PARSING the
 * blueprint and then compares the shipped constant to that. The shape
 * `expect(SHIPPED).toEqual([...SHIPPED])` proves nothing and slice 7 shipped
 * one; nothing here compares a constant to itself.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const source = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-indexed, as citations are. */
const line = (n: number): string => source[n - 1] ?? ''

/** Quote marks and dashes folded, markdown emphasis stripped, space collapsed. */
const norm = (s: string): string =>
  s
    .replace(/['‘’“”]/g, '"')
    .replace(/[`*_]/g, '')
    .replace(/[–—‒]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

const FIRST_STEP_LINE = 79908
const LAST_STEP_LINE = 79967
/** §36.1 opens here; the span below is bounded by it and by the mermaid block. */
const SECTION_HEAD = 79894

/** `N. **Title**` — the enumeration's own shape. */
const STEP_RE = /^ *(\d+)\. \*\*([^*]*)\*\*/
/** `**Phase N — Title (steps R).**` */
const PHASE_RE = /^ *\*\*Phase (\d) — ([^(]*) \(steps ([^)]*)\)\.\*\*/

interface SourceStep {
  readonly number: number
  readonly title: string
  readonly sourceLine: number
}
interface SourcePhase {
  readonly phase: number
  readonly title: string
  readonly headingLine: number
  readonly declaredRange: string
}

const sourceSteps: SourceStep[] = []
const sourcePhases: SourcePhase[] = []

/** A capture group the regex guarantees. Throwing beats defaulting to `''`. */
const group = (m: RegExpExecArray, i: number, what: string): string => {
  const g = m[i]
  if (g === undefined) throw new Error(`${what}: group ${i} did not participate`)
  return g
}

for (let n = SECTION_HEAD; n <= LAST_STEP_LINE; n += 1) {
  const raw = line(n)
  const s = STEP_RE.exec(raw)
  if (s !== null) {
    sourceSteps.push({
      number: Number(group(s, 1, `step at L${n}`)),
      title: group(s, 2, `step at L${n}`),
      sourceLine: n,
    })
    continue
  }
  const p = PHASE_RE.exec(raw)
  if (p !== null) {
    sourcePhases.push({
      phase: Number(group(p, 1, `phase at L${n}`)),
      title: group(p, 2, `phase at L${n}`),
      headingLine: n,
      declaredRange: group(p, 3, `phase at L${n}`),
    })
  }
}

/** Which phase heading most recently precedes a given line. */
const phaseGoverning = (sourceLine: number): number => {
  let governing = 0
  for (const p of sourcePhases) if (p.headingLine < sourceLine) governing = p.phase
  return governing
}

/** `"34 to 36"` and `"21 and 22"` both read out. */
const readRange = (declared: string): number[] => {
  const m = /^(\d+) (?:to|and) (\d+)$/.exec(declared)
  if (m === null) throw new Error(`unparseable declared range: ${declared}`)
  const out: number[] = []
  for (let n = Number(m[1]); n <= Number(m[2]); n += 1) out.push(n)
  return out
}

describe('the enumeration, counted from the frozen source', () => {
  it('the span L79908-L79967 holds exactly thirty-seven numbered steps', () => {
    expect(sourceSteps).toHaveLength(37)
    expect(sourceSteps[0]?.sourceLine).toBe(FIRST_STEP_LINE)
    expect(sourceSteps[36]?.sourceLine).toBe(LAST_STEP_LINE)
    // Numbered 1..37 with no gap and no repeat, read off the source.
    expect(sourceSteps.map((s) => s.number)).toEqual(
      Array.from({ length: 37 }, (_, i) => i + 1),
    )
    expect(PROTOCOL_STEPS).toHaveLength(sourceSteps.length)
  })

  it('exactly eight phase headings govern that span', () => {
    expect(sourcePhases).toHaveLength(8)
    expect(sourcePhases.map((p) => p.phase)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(PROTOCOL_PHASES).toHaveLength(sourcePhases.length)
  })

  it('the eight phase step-counts sum to thirty-seven', () => {
    const byPhase = sourcePhases.map(
      (p) => sourceSteps.filter((s) => phaseGoverning(s.sourceLine) === p.phase).length,
    )
    expect(byPhase).toEqual([7, 3, 4, 6, 2, 5, 6, 4])
    expect(byPhase.reduce((a, b) => a + b, 0)).toBe(37)
    // The same arithmetic against the shipped machine.
    expect(PROTOCOL_PHASES.map((p) => stepsInPhase(p.phase).length)).toEqual(byPhase)
  })

  it('every step is transcribed verbatim, at the line it is cited to', () => {
    for (const found of sourceSteps) {
      const shipped = PROTOCOL_STEPS.find((s) => s.number === found.number)
      expect(shipped, `no shipped step ${found.number}`).toBeDefined()
      if (shipped === undefined) continue
      expect(shipped.title, `step ${found.number} title`).toBe(found.title)
      expect(shipped.sourceLine, `step ${found.number} line`).toBe(found.sourceLine)
      // And the cited line really carries that step number.
      expect(STEP_RE.exec(line(shipped.sourceLine))?.[1]).toBe(String(found.number))
    }
  })

  it('every step sits in the phase whose heading precedes it', () => {
    for (const shipped of PROTOCOL_STEPS) {
      expect(shipped.phase, `step ${shipped.number} phase`).toBe(
        phaseGoverning(shipped.sourceLine),
      )
    }
  })

  it('every phase heading is transcribed verbatim with its declared range', () => {
    for (const found of sourcePhases) {
      const shipped = PROTOCOL_PHASES.find((p) => p.phase === found.phase)
      expect(shipped, `no shipped phase ${found.phase}`).toBeDefined()
      if (shipped === undefined) continue
      expect(shipped.title, `phase ${found.phase} title`).toBe(found.title)
      expect(shipped.headingLine, `phase ${found.phase} line`).toBe(found.headingLine)
      expect(shipped.declaredRange, `phase ${found.phase} range`).toBe(found.declaredRange)
      expect(shipped.declaredSteps, `phase ${found.phase} range read out`).toEqual(
        readRange(found.declaredRange),
      )
      expect(shipped.steps, `phase ${found.phase} membership`).toEqual(
        sourceSteps
          .filter((s) => phaseGoverning(s.sourceLine) === found.phase)
          .map((s) => s.number),
      )
    }
  })
})

describe('the phase-8 count contradiction', () => {
  it('seven headings agree with their enumeration and the eighth does not', () => {
    const disagreeing = PROTOCOL_PHASES.filter(
      (p) => JSON.stringify(p.declaredSteps) !== JSON.stringify(p.steps),
    )
    expect(disagreeing.map((p) => p.phase)).toEqual([8])
    const eight = disagreeing[0]
    expect(eight?.declaredSteps).toEqual([34, 35, 36])
    expect(eight?.steps).toEqual([34, 35, 36, 37])
  })

  it('the heading really says "steps 34 to 36" and step 37 really sits under it', () => {
    const phase8Heading = 79962
    expect(norm(line(phase8Heading))).toBe('Phase 8 - Convergence and audit (steps 34 to 36).')
    // Nothing between the phase-8 heading and step 37 is another phase heading.
    for (let n = phase8Heading + 1; n <= 79967; n += 1) expect(PHASE_RE.test(line(n))).toBe(false)
    expect(STEP_RE.exec(line(79967))?.[1]).toBe('37')
  })

  it('L79904 states the other reading in the source’s own words', () => {
    expect(norm(line(79904))).toContain(
      'Step 37, the worker-facing confirmation, closes phase eight rather than opening a ninth.',
    )
  })

  it('the traceability table corroborates the heading by splitting 37 out', () => {
    expect(norm(line(80011))).toContain('| 34 to 36 | Convergence and audit |')
    expect(norm(line(80012))).toContain('| 37 | Worker confirmation |')
  })

  it('both readings are carried with their locators and neither is chosen', () => {
    const locators = PHASE_EIGHT_STEP_COUNT_CONTRADICTION.readings.map((r) => r.locator).join(' ')
    expect(locators).toContain('L79962')
    expect(locators).toContain('L79904')
    // A reading has two fields and neither can mark it the answer.
    for (const r of PHASE_EIGHT_STEP_COUNT_CONTRADICTION.readings) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
    // No step number moved to make a heading true.
    expect(PROTOCOL_STEPS.map((s) => s.number)).toEqual(sourceSteps.map((s) => s.number))
  })
})

describe('AC-36-101, at the line that carries it', () => {
  it('AC-36-101 is at L80048 and states the steps-1-to-14 invariant', () => {
    expect(line(80048)).toContain('`AC-36-101`')
    expect(norm(line(80048))).toContain(
      'Steps 1 to 14 complete before any manifest is exchanged, in every reconnection.',
    )
    expect(AC_36_101_CRITERION).toBe(
      'Steps 1 to 14 complete before any manifest is exchanged, in every reconnection.',
    )
  })

  it('AC-36-101 appears at exactly one line in the whole source', () => {
    const hits = source.flatMap((l, i) => (l.includes('`AC-36-101`') ? [i + 1] : []))
    expect(hits).toEqual([80048])
  })

  it('L80042 is the Source status bullet and does NOT carry the identifier', () => {
    expect(line(80042)).toContain('**Source status.**')
    expect(line(80042)).not.toContain('AC-36-101')
  })

  it('the manifest exchange is step 15, and it is the first step that moves data', () => {
    expect(MANIFEST_EXCHANGE_STEP).toBe(15)
    expect(step(MANIFEST_EXCHANGE_STEP).title).toBe('Exchange of synchronization manifests.')
    // Steps 1-14 are the three proof phases; 15 opens phase 4.
    expect(step(14).phase).toBe(3)
    expect(step(15).phase).toBe(4)
  })
})

describe('the three source classifications L80042 carries', () => {
  it('all three tokens are on that one line', () => {
    const l = norm(line(80042))
    expect(l).toContain('SoW Fact')
    expect(l).toContain('User-Mandated Product Extension')
    expect(l).toContain('Derived Clarification - adopted working position')
    expect(l).toContain('DEC-SYNC-001')
  })

  it('each is carried with a distinct thing it governs', () => {
    expect(PROTOCOL_SOURCE_CLASSIFICATIONS).toHaveLength(3)
    const classifications = PROTOCOL_SOURCE_CLASSIFICATIONS.map((c) => c.classification)
    expect(new Set(classifications).size).toBe(3)
    expect(new Set(PROTOCOL_SOURCE_CLASSIFICATIONS.map((c) => c.governs)).size).toBe(3)
    // Every classification token is one the cited line actually uses. `SoW
    // Fact` is a PREFIX of nothing here, but the enumeration's token is not a
    // prefix of the ordering's, so exact membership is asserted rather than
    // `toContain` on a join.
    for (const c of PROTOCOL_SOURCE_CLASSIFICATIONS) {
      expect(norm(line(80042)), `${c.classification} at ${c.locator}`).toContain(
        norm(c.classification),
      )
      expect(c.locator).toBe('L80042')
    }
    // The enumeration is NOT classified as a SoW Fact.
    const enumeration = PROTOCOL_SOURCE_CLASSIFICATIONS.find((c) =>
      c.governs.includes('thirty-seven-step enumeration'),
    )
    expect(enumeration?.classification).toBe('User-Mandated Product Extension')
  })
})

describe('step 21 is the manifest read and step 22 is the capture upload', () => {
  it('the two step numbers are what the source says they are', () => {
    expect(COMMAND_MANIFEST_READ_STEP).toBe(21)
    expect(CAPTURE_UPLOAD_STEP).toBe(22)
    expect(COMMAND_MANIFEST_READ_STEP).toBeLessThan(CAPTURE_UPLOAD_STEP)
  })

  it('step 21 reads the command manifest and no capture has left the device', () => {
    const twentyOne = step(21)
    expect(twentyOne.title).toContain('the command manifest is read and the stop class is applied')
    expect(norm(line(twentyOne.sourceLine))).toContain('before any capture leaves the device')
  })

  it('step 22 is where the durable queue drains', () => {
    const twentyTwo = step(22)
    expect(twentyTwo.title).toContain('the captures upload')
    expect(norm(line(twentyTwo.sourceLine))).toContain('Pass two drains the durable queue in full')
  })

  it('nothing before step 22 can have inspected an uploaded capture', () => {
    // The claim task 8's register turns on, as arithmetic rather than prose.
    expect(CAPTURE_UPLOAD_STEP).toBeGreaterThan(COMMAND_MANIFEST_READ_STEP)
    const uploadedAt = PROTOCOL_STEPS.filter((s) => s.number < CAPTURE_UPLOAD_STEP)
    expect(uploadedAt.every((s) => s.number <= 21)).toBe(true)
  })
})

describe('the three transfer passes, read from the settled order', () => {
  it('they are DEC_SYNC_001_ORDER, not a second spelling of it', () => {
    expect(TRANSFER_PASSES).toHaveLength(DEC_SYNC_001_ORDER.length)
    expect(TRANSFER_PASSES.map((p) => p.reconnectionPhase)).toEqual(
      DEC_SYNC_001_ORDER.map((r) => r.phase),
    )
  })

  it('pass one runs at step 21 and passes two and three at step 22', () => {
    expect(TRANSFER_PASSES.map((p) => p.pass)).toEqual([1, 2, 3])
    expect(TRANSFER_PASSES.map((p) => p.step)).toEqual([21, 22, 22])
    expect(TRANSFER_PASSES[0]?.reconnectionPhase).toBe('stop-class')
    expect(TRANSFER_PASSES[1]?.reconnectionPhase).toBe('capture-upload')
    expect(TRANSFER_PASSES[2]?.reconnectionPhase).toBe('enabling-class')
  })

  it('phase 5 is the three-pass transfer and holds exactly those two steps', () => {
    expect(norm(line(79938))).toContain('Phase 5 - The three-pass transfer (steps 21 and 22).')
    expect(stepsInPhase(5).map((s) => s.number)).toEqual([21, 22])
  })
})

describe('the ordering invariants, against an observed execution order', () => {
  const inOrder = Array.from({ length: 37 }, (_, i) => i + 1)

  it('AC-36-101 holds for the protocol order and fails when 15 jumps the queue', () => {
    expect(satisfiesAc36101(inOrder)).toBe(true)
    // Step 15 before step 14 — the exact violation the criterion names.
    const jumped = [...inOrder.filter((n) => n !== 15)]
    jumped.splice(13, 0, 15)
    expect(satisfiesAc36101(jumped)).toBe(false)
    // A single missing proof step is enough to break it.
    expect(satisfiesAc36101(inOrder.filter((n) => n !== 11))).toBe(false)
  })

  it('AC-36-101 holds vacuously where no manifest is ever exchanged', () => {
    expect(satisfiesAc36101([1, 2, 3])).toBe(true)
    expect(satisfiesAc36101([])).toBe(true)
  })

  it('AC-36-102 requires step 7 before both transfer steps', () => {
    expect(norm(line(80049))).toContain('step 7 evaluates before steps 21 and 22')
    expect(satisfiesAc36102(inOrder)).toBe(true)
    expect(satisfiesAc36102([21, 7, 22])).toBe(false)
    expect(satisfiesAc36102([1, 21])).toBe(false)
    expect(satisfiesAc36102([7, 21, 22])).toBe(true)
    // Vacuous where no transfer happens.
    expect(satisfiesAc36102([1, 2, 3])).toBe(true)
  })
})

describe('per-step outcome codes, and the two triggers the source states', () => {
  const allGood = (): StepOutcome[] => Array.from({ length: 37 }, () => 'success')

  it('the source names the mechanism and the two triggers', () => {
    expect(norm(line(80020))).toContain('Per-step outcome codes')
    expect(norm(line(80026))).toContain('Any step returning a non-success outcome')
    expect(norm(line(80027))).toContain('A successful full pass of steps 1 to 37')
  })

  it('a full pass is thirty-seven successes and thirty-six is not one', () => {
    expect(isSuccessfulFullPass(allGood())).toBe(true)
    expect(isSuccessfulFullPass(allGood().slice(0, 36))).toBe(false)
    const oneBad = allGood()
    oneBad[36] = 'non-success'
    expect(isSuccessfulFullPass(oneBad)).toBe(false)
  })

  it('the failed step is named, because the fallback resumes from it', () => {
    expect(firstNonSuccessStep(allGood())).toBeNull()
    const failedAt13 = allGood()
    failedAt13[12] = 'non-success'
    expect(firstNonSuccessStep(failedAt13)?.number).toBe(13)
    expect(firstNonSuccessStep(failedAt13)?.title).toBe('Local database integrity.')
    // The FIRST one, not the last.
    const two = allGood()
    two[12] = 'non-success'
    two[30] = 'non-success'
    expect(firstNonSuccessStep(two)?.number).toBe(13)
  })
})

describe('the blockers three steps route to', () => {
  it('11, 13 and 14 name a Chapter 37 blocker and no other step does', () => {
    const carrying = PROTOCOL_STEPS.filter((s) => s.blocker !== null)
    expect(carrying.map((s) => s.number)).toEqual([11, 13, 14])
    for (const s of carrying) {
      expect(line(s.sourceLine), `step ${s.number} blocker`).toContain(s.blocker ?? '')
    }
    // And the steps carrying `null` really name none.
    for (const s of PROTOCOL_STEPS.filter((s) => s.blocker === null)) {
      expect(/OFF-BLK-\d+/.test(line(s.sourceLine)), `step ${s.number}`).toBe(false)
    }
  })
})

describe('step() and stepsInPhase()', () => {
  it('every number 1..37 resolves and nothing outside it does', () => {
    for (let n = 1; n <= 37; n += 1) expect(step(n).number).toBe(n)
    expect(() => step(0)).toThrow(RangeError)
    expect(() => step(38)).toThrow(RangeError)
  })

  it('the eight phases partition the thirty-seven with no overlap', () => {
    const seen = PROTOCOL_PHASES.flatMap((p) => stepsInPhase(p.phase).map((s) => s.number))
    expect(seen).toHaveLength(37)
    expect(new Set(seen).size).toBe(37)
    expect([...seen].sort((a, b) => a - b)).toEqual(sourceSteps.map((s) => s.number))
  })
})

describe('DEC-SYNC-001, disclosed locally and built to expire', () => {
  const canon = readFileSync(join(process.cwd(), 'src', 'disclosure', 'decisions.ts'), 'utf8')
  const canonIds = ((): string[] => {
    const block = /export type DecisionId =([\s\S]*?)\n\n/.exec(canon)?.[1]
    if (block === undefined) throw new Error('DecisionId union not found in the canon')
    return [...block.matchAll(/'([^']+)'/g)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))
  })()

  it('DEC-SYNC-001 is not one of the canon’s records', () => {
    // A POSITIVE CONTROL, NOT A COUNT. `toHaveLength(29)` stood here: a stored
    // copy of a derived answer, stale the moment slice 10 registered fourteen
    // more records, in a suite whose only stake in the canon is one absence.
    // What it was really buying — that a `not.toContain` over a failed parse
    // cannot pass vacuously — is bought by an identifier the canon does hold.
    expect(canonIds, 'the DecisionId union parsed').toContain('DEC-LIB-001')
    expect(canonIds).not.toContain('DEC-SYNC-001')
    // The expiry gate: the moment it is lifted, this goes red.
    for (const d of PROTOCOL_DISCLOSURES) {
      expect(canonIds, `${d.decisionRef} has been lifted into the canon`).not.toContain(
        d.decisionRef,
      )
    }
  })

  it('the disclosure is in the canon’s own shape, with the imported reading type', () => {
    expect(PROTOCOL_DISCLOSURES).toHaveLength(1)
    const d = PROTOCOL_DISCLOSURES[0]
    expect(d?.decisionRef).toBe('DEC-SYNC-001')
    for (const r of d?.readings ?? []) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
    // The note's ABSENCE claim, not its count. This asserted `'twenty-nine'`
    // and so required the note to keep spelling a canon size that is now
    // forty-three — a test holding a stale on-screen claim in place. The count
    // has since been removed from the note in `src/offline/protocol.ts`, and
    // this pins the absence clause that replaced it.
    expect(d?.canonNote).toContain('not a member of that file’s DecisionId union')
    expect(d?.adopted).toContain('APP-012')
    expect(d?.adopted).toContain('not a position the source settled')
  })

  it('both source readings are carried, and the card is adopted at Option C', () => {
    const d = PROTOCOL_DISCLOSURES[0]
    const texts = norm((d?.readings ?? []).map((r) => r.text).join(' '))
    expect(texts).toContain('Interpretation A - commands first')
    expect(texts).toContain('Interpretation B - captures first')
    // The source's own card, at the lines cited.
    expect(norm(line(80067))).toContain('Adopted at Option C on 2026-08-14')
    expect(norm(line(80070))).toContain('Interpretation A - commands first.')
    expect(norm(line(80071))).toContain('Interpretation B - captures first.')
    expect(norm(line(80072))).toContain('The source contains one sentence supporting each.')
  })

  it('every locator the disclosure cites lands on a line that carries it', () => {
    const d = PROTOCOL_DISCLOSURES[0]
    const cited = (d?.readings ?? []).flatMap((r) =>
      [...r.locator.matchAll(/L(\d{5})/g)].map((m) => Number(m[1])),
    )
    expect(cited.length).toBeGreaterThanOrEqual(6)
    for (const n of cited) {
      expect(n, `L${n} out of range`).toBeGreaterThan(0)
      expect(n).toBeLessThanOrEqual(source.length)
      expect(line(n).trim(), `L${n} is blank`).not.toBe('')
      // Every cited line is inside the DEC-SYNC-001 card at §36.2, which runs
      // from the section heading to its last bullet.
      expect(n, `L${n} is outside the card`).toBeGreaterThanOrEqual(80059)
      expect(n).toBeLessThanOrEqual(80076)
    }
  })

  it('the ordering is read from @/frontline/commands and not respelt here', () => {
    const module = readFileSync(join(process.cwd(), 'src', 'offline', 'protocol.ts'), 'utf8')
    // The module imports the settled order rather than declaring one.
    expect(module).toContain('DEC_SYNC_001_ORDER')
    expect(module).not.toMatch(/export const .*_ORDER = \[/)
    // And it does not re-spell the five command classes.
    expect(module).not.toContain('CMD-FL-')
  })
})

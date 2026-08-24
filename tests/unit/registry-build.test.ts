import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { isForeignProbe } from '../probe-paths'
import { SOURCE_CLASSIFICATIONS } from '@/registry/schemas'

/**
 * §45A.17.1's twenty-four deployable obligations, listed rather than counted.
 * A row-count gate is proved by a defect that RENAMES a row rather than
 * deleting one — this build's catalogue of gates that could not fail holds
 * exactly that shape — and §54.7 Matrix 14 also holds twenty-four rows, so a
 * count alone is true of the register and of its neighbour at once.
 *
 * Transcribed from the frozen source's own table (body L102396-L102419)
 * independently of `scripts/build-registries.mjs`, which is the point: a list
 * copied from the thing under test proves nothing.
 */
const DEPLOYABLE = new Set([
  'SCHED-RUN-AUTOCLOSE', 'SCHED-QUAL-WARN', 'SCHED-QUAL-ACK', 'SCHED-DIGEST',
  'SCHED-NOSHOW-ALERT', 'SCHED-NOSHOW-CANCEL', 'SCHED-HANDOFF', 'SCHED-HANDOFF-GRACE',
  'SCHED-GATE-TIMEOUT', 'SCHED-CRIT-RENOTIFY', 'SCHED-PROPOSAL-STALE', 'SCHED-CONNECTIVITY',
  'SCHED-USAGE-LADDER', 'SCHED-SUSPEND-SOFT', 'SCHED-SUSPEND-HARD', 'SCHED-PILOT-EXPIRY',
  'SCHED-TIERING', 'SCHED-ANONYMISE', 'SCHED-DRIFT-CANARY', 'SCHED-REPORT-DELIVERY',
  'SCHED-COMMAND-AGE', 'SCHED-TRACE-RETENTION', 'SCHED-BACKUP', 'SCHED-DB-MAINT',
])

const SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
] as const

const load = (s: string) => JSON.parse(readFileSync(`registries/generated/${s}.json`, 'utf8'))

/**
 * Two FRESH generations, both redirected with AVIIXA_REGISTRY_OUT so this
 * file writes nothing under `registries/generated/` -- see the long note on
 * the determinism test below, and gate 2 of
 * `tests/coverage/registry-freshness.test.ts`, which fails any test that
 * shells out to a generator without the redirect.
 *
 * Everything asserted about what the GENERATOR PRODUCES reads from `fresh`,
 * never from the committed artefacts: during a wave of parallel work the
 * committed files legitimately lag the tree, and an assertion against them
 * would be red for a reason that has nothing to do with the claim it makes.
 * Freshness -- committed equals generated -- is the release gate's job.
 */
let first = ''
let second = ''
const generateInto = (dir: string): void => {
  execFileSync('node', ['scripts/build-registries.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, AVIIXA_REGISTRY_OUT: dir },
  })
}
const fresh = (s: string) => JSON.parse(readFileSync(join(first, `${s}.json`), 'utf8'))

beforeAll(() => {
  first = mkdtempSync(join(tmpdir(), 'aviixa-registry-'))
  second = mkdtempSync(join(tmpdir(), 'aviixa-registry-'))
  generateInto(first)
  generateInto(second)
})

afterAll(() => {
  for (const dir of [first, second]) rmSync(dir, { recursive: true, force: true })
})

describe('generated registries', () => {
  it.each(SLUGS)('%s exists and has rows', (slug) => {
    expect(existsSync(`registries/generated/${slug}.json`), slug).toBe(true)
    expect(load(slug).rows.length, slug).toBeGreaterThan(0)
  })

  /**
   * FAILS IF: a registry stops saying what its `sourceLine` actually is.
   *
   * The field's name implies a definition and its value is the FIRST MENTION —
   * `Math.min` over the identifier index. Measured on one sample of thirty
   * offline use-case rows, eighteen point at a group table, a diagram-reuse
   * paragraph, or a neighbouring entry rather than at the entry that defines
   * the identifier.
   *
   * The coverage pages put this number in front of a client, so the artefact
   * states its own meaning. Planted: SOURCE_LINE_MEANING emptied in the
   * generator; went red on all fourteen.
   */
  it.each(SLUGS)('%s says what its sourceLine is, and does not imply a definition', (slug) => {
    const meaning = fresh(slug).sourceLineMeaning as string
    expect(typeof meaning, slug).toBe('string')
    expect(meaning, slug).toMatch(/FIRST MENTION/)
    expect(meaning, slug).toMatch(/NOT necessarily the line that defines/)
  })

  it.each(SLUGS)('%s says what its number counts', (slug) => {
    const r = load(slug)
    expect(typeof r.countedThing, slug).toBe('string')
    expect(r.countedThing.length, slug).toBeGreaterThan(8)
  })

  it.each(SLUGS)('%s gives every row a source line locator', (slug) => {
    for (const row of load(slug).rows) expect(typeof row.sourceLine, `${slug}/${row.id}`).toBe('number')
  })

  // The reconciliation this project spent a full extraction wave establishing.
  it('ships the RECONCILED module count, not the raw key count', () => {
    const r = load('modules')
    expect(r.reconciledCount).toBe(81)
    expect(r.rows).toHaveLength(81)
    expect(r.dedupRule.length).toBeGreaterThan(10)
  })

  it('records where the source fixes no total at all', () => {
    for (const slug of ['workflows', 'events', 'notifications']) {
      expect(load(slug).sourceFixesNoTotal, slug).toBe(true)
    }
    expect(load('modules').sourceFixesNoTotal).toBe(false)
  })

  it('carries the reconciled counts the source does fix', () => {
    expect(load('business-objects').reconciledCount).toBe(99)
    expect(load('offline-scenarios').reconciledCount).toBe(70)
  })

  it('shows both figures whenever raw and reconciled differ', () => {
    for (const slug of SLUGS) {
      const r = load(slug)
      if (r.reconciledCount != null && r.reconciledCount !== r.rawCount) {
        expect(r.dedupRule, slug).toBeTruthy()
      }
    }
  })

  it('is deterministic — rows sorted by id, byte-identical across runs', () => {
    for (const slug of SLUGS) {
      const ids = load(slug).rows.map((x: { id: string }) => x.id)
      expect([...ids], slug).toEqual([...ids].sort())
    }
  })

  // Invariant 5: no ambient Date.now()/Math.random() anywhere in the
  // generator, proven directly rather than assumed -- two runs from the same
  // inputs must produce the exact same bytes.
  //
  // This used to generate OVER registries/generated and then compare the result
  // to what it had just overwritten, which made it two broken things at once. It
  // could not stay red -- a failing run repaired the very files it was checking,
  // so a second run of the same suite went green regardless. And it meant the
  // committed artefacts silently tracked whatever half-built code was in the
  // tree when someone last ran the tests.
  //
  // The two claims it conflated are now separate. DETERMINISM lives here and is
  // true whatever state the working tree is in. FRESHNESS -- committed bytes
  // equal what the current tree generates -- is a release gate in
  // tests/coverage/registry-freshness.test.ts, because it is only meaningful
  // when the tree is coherent, which during a wave of parallel work it is not.
  it('two runs from the same inputs produce byte-identical files', () => {
    for (const slug of SLUGS) {
      expect(readFileSync(join(second, `${slug}.json`), 'utf8'), slug).toBe(
        readFileSync(join(first, `${slug}.json`), 'utf8'),
      )
    }
  })
})

describe('composite keys stop distinct workflows collapsing', () => {
  const wf = () => load('workflows')

  it('no row now stands for more than five raw entries', () => {
    const worst = Math.max(...wf().rows.map((r: { collapsedFrom?: number }) => r.collapsedFrom ?? 1))
    expect(worst).toBeLessThanOrEqual(5)
  })

  it('the 199-entry unnumbered row is gone', () => {
    const un = wf().rows.filter((r: { id: string }) => r.id.startsWith('unnumbered'))
    for (const r of un) expect(r.collapsedFrom ?? 1).toBeLessThanOrEqual(5)
  })

  it('still represents every raw entry — none dropped', () => {
    const total = wf().rows.reduce((n: number, r: { collapsedFrom?: number }) => n + (r.collapsedFrom ?? 1), 0)
    expect(total).toBe(725)
  })

  it('composite keys stay unique', () => {
    const ids = wf().rows.map((r: { id: string }) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('still records the source fixes no workflow total', () => {
    expect(wf().sourceFixesNoTotal).toBe(true)
    expect(wf().reconciledCount).toBeNull()
  })
})

// Fix round 1: actionable-controls was keyed on DNC-* (the do-not-use-cron
// register — scheduling policy). The real actionable controls are the
// semantic `controls[]` extraction (759 raw entries: label/surface/
// module_id/allowed_roles/effect/line), deduped by label to 608 per spec
// §2.10. DNC-* is a real, separate, reconciled inventory (22) that gets its
// own clearly labelled section on the same index, not the whole slug.
describe('actionable controls is the UI-action catalogue, not the do-not-cron register', () => {
  it('counts the semantic controls extraction (608 of 759), not DNC-*', () => {
    const r = load('actionable-controls')
    expect(r.reconciledCount).toBe(608)
    expect(r.rawCount).toBe(759)
  })

  it('discloses the DNC-01..DNC-22 register separately, labelled, never merged into the 608', () => {
    const r = load('actionable-controls')
    const dnc = r.rows.filter((row: { id: string }) => row.id.startsWith('DNC-'))
    const controls = r.rows.filter((row: { id: string }) => !row.id.startsWith('DNC-'))
    expect(dnc).toHaveLength(22)
    expect(controls).toHaveLength(608)
    for (const row of dnc) expect(row.register, row.id).toMatch(/do-not-use-cron/i)
    for (const row of controls) expect(row.register, row.id).not.toMatch(/do-not-use-cron/i)
  })

  // Minor (final review): every one of the 608 control rows set `id:
  // c.label` but never `label: c.label` -- so the ID column rendered the
  // label text and the Name column rendered "—" for all 608 rows.
  it('each of the 608 control rows carries the same text as both id and label', () => {
    const r = load('actionable-controls')
    const controls = r.rows.filter((row: { id: string }) => !row.id.startsWith('DNC-'))
    for (const row of controls) expect(row.label, row.id).toBe(row.id)
  })
})

// Fix round 1: ai-storyboards scoped to SB-AI-* only (48 of 613 SB-*
// identifiers), silently dropping the other 565 — the same defect the
// addendum named for the 20 unjoinable FUNC- ids, just unaddressed here.
// Every SB-* identifier must render, tagged with which register it belongs
// to, never dropped.
describe('ai-storyboards discloses every SB-* register, not only SB-AI-*', () => {
  it('renders all 613 SB-* identifiers, not just the 48 SB-AI-* ones', () => {
    const r = load('ai-storyboards')
    expect(r.rows).toHaveLength(613)
    expect(r.rawCount).toBe(613)
  })

  it('labels every row with which register it belongs to', () => {
    const r = load('ai-storyboards')
    for (const row of r.rows) expect(typeof row.register, row.id).toBe('string')
    const registers = new Set(r.rows.map((row: { register: string }) => row.register))
    expect(registers.size).toBeGreaterThanOrEqual(4)
  })

  it('still keeps the SB-AI-* AI/fallback storyboards separately labelled (48)', () => {
    const r = load('ai-storyboards')
    const ai = r.rows.filter((row: { id: string }) => row.id.startsWith('SB-AI-'))
    expect(ai).toHaveLength(48)
  })

  /**
   * C-28 AND C-29, HELD AS A MEASUREMENT RATHER THAN A LABEL.
   *
   * Every SB-AI-* row read "Chapter 44, 48 total" while 19 of the 48 are not
   * in chapter 44 — 17 in chapter 40, 1 in chapter 41, and SB-AI-01 in
   * chapter 30D because `sourceLine` is the FIRST occurrence anywhere and
   * SB-AI-01 has three. A register label naming a chapter is a claim about
   * every row under it, so it is checked as one, against the chapter bands
   * the generator uses. The bands are the frozen source's `^# N\.` heading
   * lines: ch 30 L60895-L66117, ch 40-41 L85974-L88992, ch 44 L91386-L95409.
   *
   * The generator throws on the same condition. This is the independent
   * recomputation, because a generator that checked itself and got the check
   * wrong would ship exactly the row that started this.
   */
  it('puts every chapter-claiming register\'s rows inside the chapter it claims', () => {
    const bands: readonly { readonly match: RegExp; readonly first: number; readonly last: number }[] =
      [
        { match: /^SB-\d{3}$/, first: 60895, last: 66117 },
        { match: /^SB-AI-\d{2}$/, first: 91386, last: 95409 },
        { match: /^SB-AI-\d{3}$/, first: 85974, last: 88992 },
      ]
    const rows = load('ai-storyboards').rows
    const strays: string[] = []
    let checked = 0
    for (const row of rows) {
      const band = bands.find((b) => b.match.test(row.id))
      if (band === undefined) continue
      checked += 1
      if (row.sourceLine < band.first || row.sourceLine > band.last) {
        strays.push(`${row.id}@L${row.sourceLine} (${row.register})`)
      }
    }
    // Non-vacuity: 30 + 30 + 18. A regex that matched nothing would make the
    // loop above pass on an empty set, which is defect shape 9.
    expect(checked).toBe(78)
    expect(strays, 'rows citing a line outside the chapter their register names').toEqual([])
  })

  it('splits SB-AI-* into its two real registers rather than merging them', () => {
    const rows: Row[] = load('ai-storyboards').rows
    const twoDigit = rows.filter((r) => /^SB-AI-\d{2}$/.test(r.id))
    const threeDigit = rows.filter((r) => /^SB-AI-\d{3}$/.test(r.id))
    expect(twoDigit).toHaveLength(30)
    expect(threeDigit).toHaveLength(18)
    expect(new Set(twoDigit.map((r) => r.register)).size).toBe(1)
    expect(new Set(threeDigit.map((r) => r.register)).size).toBe(1)
    expect(twoDigit[0]?.register).not.toBe(threeDigit[0]?.register)
    // C-29: SB-AI-01 must point at its own register's home, not at the
    // chapter-30D panel that happens to mention it first.
    expect(rows.find((r) => r.id === 'SB-AI-01')?.sourceLine).toBeGreaterThanOrEqual(91386)
  })

  /**
   * C-32: a bare `not-represented` beside 30 transcribed siblings reads as a
   * shortfall. These 18 belong to a different register and the row says so.
   */
  it('gives every not-represented SB-AI row a stated reason', () => {
    const rows = (load('ai-storyboards').rows as Row[]).filter(
      (r) => r.id.startsWith('SB-AI-') && r.status === 'not-represented',
    )
    expect(rows).toHaveLength(18)
    for (const row of rows) {
      expect(row.statusReason, `${row.id} carries no reason for not-represented`).toBeDefined()
      expect(row.statusReason?.length ?? 0).toBeGreaterThan(40)
    }
  })
})

// Every registry's status used to be the literal `'not-represented'`, written
// on every row of all fourteen files with no code path that wrote anything
// else -- a coverage dashboard reporting zero for everything the build had
// already built, which reads as a fact rather than as the missing measurement
// it was. Status is now computed from the shipped route tree. These tests
// recompute the evidence independently of the generator, so a generator that
// started inventing statuses fails here rather than agreeing with itself.
describe('per-item status is computed from the built tree, not hardcoded', () => {
  const namedByAShippedScreen = (): Set<string> => {
    const named = new Set<string>()
    // A scratch probe belonging to a CONCURRENT process: the release gates
    // plant one under `app/` and delete it as soon as their own assertion
    // finishes, so this walk can list one and then read a path that no longer
    // exists -- a correct build failing on a race, not on a finding.
    // `tests/coverage/slice-2c-gates.test.ts` carries the full account. EXACT
    // match, never a prefix: a prefix form would also hide a real screen file
    // named `zz-probe.tsx` from this scan.
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name)) continue
        if (e.isDirectory()) walk(`${dir}/${e.name}`)
        else if (/\.tsx?$/.test(e.name)) {
          const text = readFileSync(`${dir}/${e.name}`, 'utf8')
          for (const t of text.match(/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g) ?? []) named.add(t)
          for (const m of text.matchAll(/\bcontrol:\s*(?:\r?\n\s*)?'((?:[^'\\]|\\.)*)'/g)) {
            const label = m[1]
            if (label !== undefined) named.add(label.replace(/\\(.)/g, '$1'))
          }
        }
      }
    }
    walk('app')
    return named
  }

  it('at least one registry has a demonstrated row — a build with 27 module screens reporting fourteen zeros is a broken measurement', () => {
    const demonstrated = SLUGS.map(
      (slug) =>
        load(slug).rows.filter((r: { status: string }) => r.status === 'demonstrated-in-storyboard')
          .length,
    )
    expect(demonstrated.some((n) => n > 0)).toBe(true)
  })

  it('every demonstrated row is named by a file under app/ — no status without evidence', () => {
    const named = namedByAShippedScreen()
    expect(named.size).toBeGreaterThan(0)
    for (const slug of SLUGS) {
      for (const row of load(slug).rows) {
        if (row.status !== 'demonstrated-in-storyboard') continue
        expect(named.has(row.id), `${slug}/${row.id}`).toBe(true)
      }
    }
  })

  /**
   * `mounted-in-another-screen` joined this vocabulary and this gate is what
   * noticed. It belongs here for the same reason the other four do: it names
   * the EVIDENCE rather than a claim about completeness. A module reads mounted
   * because a route file imports its directory — a fact about the built tree,
   * checkable, and falsified the moment the import is removed. "Implemented" is
   * the word this list exists to keep out, because nothing can check it.
   */
  it('every row carries one of the honest coverage statuses, never an "implemented" claim', () => {
    for (const slug of SLUGS) {
      for (const row of load(slug).rows) {
        expect(
          [
            'demonstrated-in-storyboard',
            'mounted-in-another-screen',
            'decision-blocked',
            'not-applicable',
            'not-represented',
          ],
          `${slug}/${row.id}`,
        ).toContain(row.status)
      }
    }
  })

  it('every registry states, on screen, which signal set its statuses and what it counted', () => {
    for (const slug of SLUGS) {
      const r = load(slug)
      expect(r.dedupRule, slug).toContain('Status is computed from the built route tree')
      const n = r.rows.filter((x: { status: string }) => x.status === 'demonstrated-in-storyboard').length
      expect(r.dedupRule, slug).toContain(`${n} of ${r.rows.length} rows`)
    }
  })
})

// ---------------------------------------------------------------------
// Slice 5 Task 25. Every assertion below reads `fresh(...)` -- a redirected
// generation -- not the committed artefacts, so it states what the generator
// PRODUCES and stays true while the committed files lag a wave of parallel
// work.
// ---------------------------------------------------------------------

type Row = {
  id: string
  sourceLine: number
  status: string
  label?: string
  purpose?: string
  moduleId?: string
  register?: string
  statusReason?: string
  sourceClass?: string
}

const STU_CARD_BAND = { first: 31552, last: 34689 }
const derivedTriggers = (): Row[] =>
  (fresh('notifications').rows as Row[]).filter((r) => r.id.startsWith('STU-TRIGGER-'))

// R19: content with no identifiers. The eighteen Studio module cards state
// notification TRIGGERS and the source mints no NOTIF-* identifier for any of
// them, so a slice-10 reconciliation reading notifications.json would find
// these behaviours nowhere. Slice 4's R9 was the mirror -- identifiers with no
// content -- and the two have opposite fixes: R9 could not invent content,
// this must not invent an identifier.
describe('R19 — the Studio notification triggers are registered as derived rows', () => {
  it('registers 56 trigger rows — the count MEASURED in the cards, not the 41 the brief stated', () => {
    // 57 trigger rows across the eighteen cards, less the one the source
    // itself makes an absence (MOD-STU-01 position 3, L31664). 41 is the
    // running total through MOD-STU-13 and is a truncated figure.
    expect(derivedTriggers()).toHaveLength(56)
  })

  it('spreads them across all eighteen cards in the measured distribution', () => {
    const perCard: Record<string, number> = {}
    for (const r of derivedTriggers()) {
      const card = (r.moduleId ?? '').slice(-2)
      perCard[card] = (perCard[card] ?? 0) + 1
    }
    expect(perCard).toEqual({
      '01': 2, '02': 4, '03': 3, '04': 2, '05': 3, '06': 2,
      '07': 5, '08': 2, '09': 2, '10': 2, '11': 5, '12': 4,
      '13': 4, '14': 3, '15': 4, '16': 4, '17': 2, '18': 3,
    })
  })

  it('mints no NOTIF-* identifier the source does not have', () => {
    for (const r of derivedTriggers()) {
      expect(r.id, r.id).not.toMatch(/NOTIF-/)
      expect(r.label ?? '', r.id).not.toMatch(/NOTIF-/)
    }
    // And the register it sits beside still holds zero Studio rows, which is
    // the whole reason these rows exist.
    const identifierRows = (fresh('notifications').rows as Row[]).filter(
      (r) => !r.id.startsWith('STU-TRIGGER-'),
    )
    expect(identifierRows.filter((r) => /STU/.test(r.id))).toHaveLength(0)
  })

  it('gives every derived row its card locator, its module, and sourceClass derived', () => {
    for (const r of derivedTriggers()) {
      expect(r.sourceClass, r.id).toBe('derived')
      expect(r.moduleId, r.id).toMatch(/^MOD-STU-\d{2}$/)
      expect(r.register, r.id).toMatch(/derived/i)
      expect(r.label, r.id).toBeTruthy()
      expect(r.sourceLine, r.id).toBeGreaterThanOrEqual(STU_CARD_BAND.first)
      expect(r.sourceLine, r.id).toBeLessThanOrEqual(STU_CARD_BAND.last)
    }
  })

  it("excludes MOD-STU-01's deliberately-absent row (L31664) and says why", () => {
    expect(derivedTriggers().map((r) => r.sourceLine)).not.toContain(31664)
    expect(derivedTriggers().map((r) => r.id)).not.toContain('STU-TRIGGER-01-03')
    expect(fresh('notifications').dedupRule).toContain('a refusal is audited, not notified')
  })

  it('keeps the registers separate — 205 stays the NOTIF-* count, never the row count', () => {
    const n = fresh('notifications')
    // 205 distinct NOTIF-* identifier strings. The row count is HIGHER than
    // the identifier count and that is the whole point of the register split:
    // twenty-five identifiers stand for two notifications each.
    expect(n.rawCount).toBe(205)
    expect(n.rows).toHaveLength(286)
    const identifierRows = (n.rows as Row[]).filter((r) => !r.id.startsWith('STU-TRIGGER-'))
    expect(identifierRows).toHaveLength(230)
    expect(identifierRows.length - n.rawCount).toBe(25)
    for (const r of identifierRows) expect(typeof r.register, r.id).toBe('string')
    expect(n.reconciledCount).toBeNull()
  })
})

/* ====================================================================
 * SLICE 10 TASK 13 — the three generator defects, each asserted against
 * the FRESH generation so the check is on the code and not on a committed
 * artefact that might lag it.
 * ==================================================================== */
describe('T13 — two notification registers share one key space and both are now held', () => {
  const plain = (): Row[] =>
    (fresh('notifications').rows as Row[]).filter((r) => /^NOTIF-\d+(?:@L\d+)?$/.test(r.id))

  it('holds 112 plain rows, 25 + 87, where the identifier-only key held 87', () => {
    const rows = plain()
    expect(rows).toHaveLength(112)
    const from277 = rows.filter((r) => r.sourceLine >= 51_688 && r.sourceLine <= 51_712)
    const from30c2 = rows.filter((r) => r.sourceLine >= 72_950 && r.sourceLine <= 73_096)
    // Per-band, not just the total: the defect scored 25 and 62 and also
    // summed to its own row count, so a total alone told the two apart only
    // by luck. 87 in the second band is the claim a blend cannot satisfy.
    expect(from277).toHaveLength(25)
    expect(from30c2).toHaveLength(87)
    expect(from277.length + from30c2.length).toBe(rows.length)
  })

  it('composite-keys only the ambiguous twenty-five, leaving sixty-two bare', () => {
    const rows = plain()
    const composite = rows.filter((r) => r.id.includes('@L'))
    expect(composite).toHaveLength(50)
    expect(rows.filter((r) => !r.id.includes('@L'))).toHaveLength(62)
    // Two rows per shared identifier, and the composite names its own line.
    const bare = new Set(composite.map((r) => r.id.replace(/@L\d+$/, '')))
    expect(bare.size).toBe(25)
    for (const r of composite) expect(r.id, r.id).toBe(`${r.id.replace(/@L\d+$/, '')}@L${r.sourceLine}`)
    // A composite-keyed row cannot be demonstrated by a bare citation, which
    // is the point: `app/hub/notifications` names NOTIF-001 in order to say
    // both registers number from it, and that names neither notification.
    for (const r of composite) expect(r.status, r.id).toBe('not-represented')
  })

  it('tags every plain row with the chapter its own locator falls in', () => {
    for (const r of plain()) {
      const in277 = r.sourceLine >= 51_688 && r.sourceLine <= 51_712
      expect(r.register, r.id).toContain(in277 ? '27.7' : '30C.2')
    }
  })

  it('says in its dedupRule that the two registers are a different assignment, not a subset', () => {
    const note = fresh('notifications').dedupRule as string
    expect(note).toContain('L51688-L51712')
    expect(note).toContain('L72950-L73096')
    expect(note).toMatch(/NOT ONE of them names the same notification in each/)
    expect(note).toMatch(/different assignment of one key space, not a shorter version of one/)
  })
})

describe('T13 — scheduled work is four key spaces, one dropped token, one added register', () => {
  const sw = () => fresh('scheduled-work')

  it('holds 90 rows across four key spaces: 35 + 24 + 24 + 7', () => {
    const rows = sw().rows as Row[]
    expect(rows).toHaveLength(90)
    const count = (re: RegExp): number => rows.filter((r) => re.test(r.id)).length
    expect(count(/^SCHED-\d{3}$/)).toBe(35)
    expect(count(/^SCHED-\d{2}$/)).toBe(24)
    expect(count(/^SCHED-[A-Z-]+-001$/)).toBe(7)
    // The mnemonics are what is left, and they are counted by NAME rather
    // than by shape: 24 and 24 are the same number, so a shape count alone
    // cannot tell the deployable register from Matrix 14.
    expect(rows.filter((r) => DEPLOYABLE.has(r.id))).toHaveLength(24)
    expect(new Set(rows.map((r) => r.register)).size).toBe(4)
  })

  it('holds every one of the twenty-four deployable mnemonics, each at its own row line', () => {
    const byId = new Map((sw().rows as Row[]).map((r) => [r.id, r]))
    // A row-count gate is proved by a defect that RENAMES a row rather than
    // deleting one, so this names all twenty-four rather than counting them.
    for (const id of DEPLOYABLE) expect(byId.has(id), id).toBe(true)
    const lines = [...DEPLOYABLE].map((id) => byId.get(id)?.sourceLine ?? 0).sort((a, b) => a - b)
    expect(lines[0]).toBe(102_396)
    expect(lines[lines.length - 1]).toBe(102_419)
    expect(new Set(lines).size).toBe(24)
  })

  it('drops SCHED-0NN, the source’s own prose template token, and says why', () => {
    expect((sw().rows as Row[]).map((r) => r.id)).not.toContain('SCHED-0NN')
    const note = sw().dedupRule as string
    expect(note).toContain('SCHED-0NN')
    expect(note).toMatch(/prose TEMPLATE token/)
    // rawCount stays the index's 67 -- the dropped row and the twenty-four
    // added ones are reconciled in prose, never by restating one as the other.
    expect(sw().rawCount).toBe(67)
    expect(sw().reconciledCount).toBeNull()
  })

  it('withdraws the false-positive story every earlier brief carried', () => {
    const note = sw().dedupRule as string
    expect(note).toMatch(/are §54\.7 Matrix 14 and are NOT false positives/)
    for (const pattern of ['PER-SCHED-NN', 'FB-SCHED-01/02', 'SB-030A-SCHED-01']) {
      expect(note, pattern).toContain(pattern)
    }
    expect(note).toMatch(/matches whole tokens/)
  })

  it('names the registers of this chapter that key on no SCHED-* identifier', () => {
    const note = sw().dedupRule as string
    expect(note).toContain('DNC-01..DNC-22')
    expect(note).toMatch(/keyed by TIMER NAME/)
    expect(note).toContain('src/scheduling/registers.ts')
  })
})

describe('T13 — events.json states that it is a subset, in both directions', () => {
  it('still holds 28 rows and no longer presents them as the events', () => {
    const e = fresh('events')
    expect(e.rows).toHaveLength(28)
    expect(e.countedThing).toMatch(/neither a catalogue nor a census/)
    const note = e.dedupRule as string
    expect(note).toMatch(/THIS IS A SUBSET AND SAYS SO/)
    expect(note).toContain('378')
    expect(note).toContain('L51051-L51059')
    expect(note).toContain('L51177-L51192')
    expect(note).toContain('L26171-L26180')
  })

  it('names the families that have no representation at all', () => {
    const note = fresh('events').dedupRule as string
    for (const family of ['EVT-TENCFG-*', 'EVT-CC-*', 'EVT-SA-*', 'EVT-FL-*']) {
      expect(note, family).toContain(family)
    }
    expect(note).toMatch(/EVT-DOH-\* is represented by 2 of its\s+30/)
  })
})

describe('T13 — the classification map is the frozen source’s own legend', () => {
  const generator = readFileSync('scripts/build-registries.mjs', 'utf8')
  const mapKeys = (): string[] => {
    const body = /const SOURCE_CLASSIFICATION_TO_SOURCE_CLASS = \{([\s\S]*?)\n\}/.exec(generator)
    if (body === null || body[1] === undefined) {
      throw new Error('SOURCE_CLASSIFICATION_TO_SOURCE_CLASS not found')
    }
    return [...body[1].matchAll(/^ {2}(?:'([^']+)'|([A-Za-z]+)):/gm)].flatMap((m) => {
      const key = m[1] ?? m[2]
      return key === undefined ? [] : [key]
    })
  }

  it('finds the map at all, with eight keys — the regex is not vacuous', () => {
    expect(mapKeys()).toHaveLength(8)
  })

  it('carries the two labels the source writes, and neither of the spellings it does not', () => {
    const keys = mapKeys()
    // The defect, in both directions, and asserted as membership rather than
    // as a count: seven was the map's size before and after the repair of
    // one label, so a count could not have caught it.
    expect(keys).toContain('Recommendation — R&D')
    expect(keys).toContain('User-Mandated Product Extension')
    expect(keys).not.toContain('Recommendation — Research and Development')
    expect(SOURCE_CLASSIFICATIONS).toContain('Recommendation — R&D')
    expect(SOURCE_CLASSIFICATIONS).toContain('User-Mandated Product Extension')
    expect(SOURCE_CLASSIFICATIONS as readonly string[]).not.toContain(
      'Recommendation — Research and Development',
    )
  })

  it('holds exactly the same label set as SOURCE_CLASSIFICATIONS, so the two cannot drift', () => {
    expect([...mapKeys()].sort()).toEqual([...SOURCE_CLASSIFICATIONS].sort())
  })

  it('spells every label the way the frozen source spells it', () => {
    const source = readFileSync(
      join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
      'utf8',
    )
    for (const label of SOURCE_CLASSIFICATIONS) {
      expect(source.includes(label), label).toBe(true)
    }
  })
})

// D11: three Studio objects the source names and gives lifecycle states, none
// of which has a numeric counterpart in the closed OBJ-001..OBJ-099 register.
// Three module tasks found them independently and all three declined to mint
// a number; minting OBJ-100..102 would inflate a closed ninety-nine (R23).
describe('D11 — three Studio object gaps, registered without minting an object', () => {
  const GAPS = ['OBJ-STU-QUALREQ', 'OBJ-STU-CAPSTATE', 'OBJ-STU-LOCALE'] as const

  it('leaves the closed register at exactly ninety-nine numeric cards', () => {
    const b = fresh('business-objects')
    expect(b.rows).toHaveLength(99)
    expect(b.reconciledCount).toBe(99)
    for (const r of b.rows as Row[]) expect(r.id, r.id).toMatch(/^OBJ-\d{3}$/)
  })

  it('adds no OBJ-1xx row for any of the three', () => {
    const ids = new Set((fresh('business-objects').rows as Row[]).map((r) => r.id))
    for (const g of GAPS) expect(ids.has(g), g).toBe(false)
    for (const n of ['OBJ-100', 'OBJ-101', 'OBJ-102']) expect(ids.has(n), n).toBe(false)
  })

  it('states each gap with its mnemonic, its card locator, and why no numeric row exists', () => {
    const note = fresh('business-objects').dedupRule as string
    expect(note).toContain('gap')
    for (const g of GAPS) expect(note, g).toContain(g)
    for (const card of ['MOD-STU-13', 'MOD-STU-15', 'MOD-STU-17']) {
      expect(note, card).toContain(card)
    }
    // The reason, not just the fact: the two nearest numeric rows are named
    // and told apart from the Studio object, and the third gap is named as
    // having nothing to map onto at all.
    expect(note).toContain('OBJ-031')
    expect(note).toContain('OBJ-051')
    expect(note).toMatch(/no capability, enablement or entitlement object/)
  })
})

// D10: the source runs two numbering schemes over the same Studio features
// and never reconciles them. Mapped once, in one table, on the features
// registry -- and nowhere else.
describe('D10 — both Studio feature schemes, mapped once, in one table', () => {
  const note = (): string => fresh('features').dedupRule as string

  it('names the four-digit catalogue as the traceability key', () => {
    expect(note()).toMatch(/four-digit catalogue is the traceability key/i)
    expect(note()).toContain('L47378-L47431')
    expect(note()).toMatch(/never mixed in one ticket/i)
  })

  it('carries all eighteen modules in the one table, both schemes side by side', () => {
    for (let i = 1; i <= 18; i++) {
      const c = String(i).padStart(2, '0')
      expect(note(), `MOD-STU-${c}`).toContain(`MOD-STU-${c} ch20 [`)
      expect(note(), `catalogue ${c}`).toContain(`catalogue [${c}01 ${c}02 ${c}03]`)
    }
  })

  it('records that the two schemes do NOT correspond positionally', () => {
    // The reason the never-mix rule is a correctness rule and not tidiness:
    // ten of eighteen modules disagree on feature count, so FEAT-STU-05-02
    // is not FEAT-STU-0502.
    expect(note()).toMatch(/10 of the 18 modules/)
    expect(note()).toContain('MOD-STU-05 ch20 [05-01 05-02 05-03 05-04 05-05 05-06 05-07 05-08 05-09 05-10] -> catalogue [0501 0502 0503]')
  })

  it('declares the SUB-/FUNC- extraction gap rather than under-reporting silently', () => {
    expect(note()).toContain('SUB-STU-01-01-A')
    expect(note()).toContain('FUNC-STU-01-01-A-1')
    expect(note()).toMatch(/absent from this build's identifier index/)
  })
})

/**
 * OWNERSHIP, NOT MENTION — the sentence the header of `modules.json` has
 * always carried, and which was FALSE OF THE GENERATOR for a whole slice.
 *
 * The dedup note says a route is awarded "ownership, not mention, so a screen
 * cross-referencing a neighbour does not demonstrate it". The code did not do
 * that. The walk ran argmax over every route directory and awarded its winner
 * UNCONDITIONALLY; the slug rule then awarded the claimant on top. So a route
 * claimed by a slug handed itself to two modules — its owner, and whichever
 * module its files happened to name most.
 *
 * It shipped. `MOD-CC-02` is Command Center chrome. It declares `slug: null`
 * deliberately, because the source gives it no screen of its own and
 * `AC-CC-040` forbids a fourteenth module route. It is named once inside
 * `app/command-center/sync-conflict-review-panel/`, the route `MOD-CC-10`
 * claims by slug, as the chrome mounted into that screen. Being the only id
 * that file mentioned, it won the argmax outright and read
 * `demonstrated-in-storyboard` off a route it does not have. The inventory
 * reported 58 demonstrated modules where 57 are.
 *
 * Nothing caught it because nothing tested the award rule at all — the
 * freshness gate compares the committed file to a fresh generation, so a
 * generator that is consistently wrong is consistently green.
 */
describe('module route awards — ownership, not mention', () => {
  /** `MOD-* -> declared slug`, parsed the way the generator parses it. */
  const declaredSlugs = (): Map<string, string | null> => {
    const out = new Map<string, string | null>()
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name)) continue
        if (e.isDirectory()) walk(join(dir, e.name))
        else if (e.name === 'modules.ts') {
          const text = readFileSync(join(dir, e.name), 'utf8')
          for (const m of text.matchAll(/\bid:\s*'(MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+))'([\s\S]*?)(?=\bid:\s*'MOD-|$)/g)) {
            const [, id, body] = m
            if (id === undefined || body === undefined) continue
            const slug = /\bslug:\s*'([^'\\]+)'/.exec(body)
            out.set(id, slug?.[1] ?? null)
          }
        }
      }
    }
    walk(join(process.cwd(), 'src'))
    return out
  }

  // FAILS IF: a module is demonstrated by a route that another module claims
  // by slug and it does not claim itself.
  //
  // Planted: the `SLUG_CLAIMED_DIRS.has(...)` guard removed from the argmax
  // award loop in `scripts/build-registries.mjs`, restoring the exact defect.
  // Went red naming MOD-CC-02 and the route. Restored byte-identically.
  it('does not award a slug-claimed route to a module merely mentioned inside it', () => {
    const slugs = declaredSlugs()
    expect(slugs.size, 'no modules.ts was parsed — the walk is broken').toBeGreaterThan(50)

    const claimedDirs = new Map<string, string>() // route dir name -> claimant id
    for (const [id, slug] of slugs) {
      if (slug === null) continue
      claimedDirs.set(slug, id)
    }

    const status = new Map<string, string>(
      (fresh('modules').rows as { id: string; status: string }[]).map((r) => [r.id, r.status]),
    )

    /**
     * Every route directory no slug claims. A slugless module can be
     * demonstrated LEGITIMATELY by winning the argmax on one of these — which
     * is the whole point of the argmax rule — so being mentioned inside a
     * claimed route only convicts a module that has no unclaimed route of its
     * own. `MOD-FL-A1` is the live case: it declares no slug because `sign-in`
     * exists on two surfaces, and it is demonstrated by
     * `app/frontline/sign-in/`, which nothing claims. The first form of this
     * test flagged it, and its own failure message said "only mentioned
     * inside", which the check never established.
     */
    const unclaimedMentions = new Set<string>()
    const collectUnclaimed = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name) || !e.isDirectory()) continue
        const full = join(dir, e.name)
        if (!claimedDirs.has(e.name)) {
          for (const f of readdirSync(full, { withFileTypes: true })) {
            if (f.isDirectory() || !/\.tsx?$/.test(f.name)) continue
            for (const id of readFileSync(join(full, f.name), 'utf8').match(/MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g) ?? []) {
              unclaimedMentions.add(id)
            }
          }
        }
        collectUnclaimed(full)
      }
    }
    collectUnclaimed(join(process.cwd(), 'app'))

    const offenders: string[] = []
    const walkRoutes = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name)) continue
        if (!e.isDirectory()) continue
        const full = join(dir, e.name)
        const claimant = claimedDirs.get(e.name)
        if (claimant !== undefined) {
          const mentioned = new Set<string>()
          for (const f of readdirSync(full, { withFileTypes: true })) {
            if (f.isDirectory() || !/\.tsx?$/.test(f.name)) continue
            for (const id of readFileSync(join(full, f.name), 'utf8').match(/MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g) ?? []) {
              mentioned.add(id)
            }
          }
          for (const id of mentioned) {
            // Only a module that claims NO route of its own can have taken its
            // status from here. One that declares a slug is demonstrated by
            // its own directory and this route says nothing either way.
            if (id === claimant) continue
            if (slugs.get(id) != null) continue
            if (unclaimedMentions.has(id)) continue
            if (status.get(id) === 'demonstrated-in-storyboard') {
              offenders.push(`${id} reads demonstrated and is only mentioned inside ${e.name}, which ${claimant} claims`)
            }
          }
        }
        walkRoutes(full)
      }
    }
    walkRoutes(join(process.cwd(), 'app'))
    expect(offenders).toEqual([])
  })

  // FAILS IF: MOD-CC-02 ever gains a route. It is chrome; the source gives it
  // no screen and AC-CC-040 caps the surface at thirteen module routes.
  //
  // Its STATUS moved from not-represented to mounted-in-another-screen the day
  // the live shift board mounted its chrome, and this case asserted the old
  // value. That was right when written — nothing mounted it — and the claim
  // worth holding was never "absent": it is "owns no route". A module can be
  // slugless, routeless and on screen at the same time, which is the whole
  // reason the third status exists.
  it('keeps MOD-CC-02 slugless and unrouted, because it is chrome', () => {
    const slugs = declaredSlugs()
    // `.get() ?? 'ABSENT'` cannot express this: `??` fires on the very null
    // the assertion is looking for, so a correctly-slugless module and an
    // unparsed one read the same. Absence and `slug: null` are different
    // facts and this checks both.
    expect(slugs.has('MOD-CC-02'), 'MOD-CC-02 was not parsed from any modules.ts').toBe(true)
    expect(slugs.get('MOD-CC-02')).toBeNull()
    const row = (fresh('modules').rows as { id: string; status: string }[]).find((r) => r.id === 'MOD-CC-02')
    // Not a route of its own, and not absent either.
    expect(row?.status).toBe('mounted-in-another-screen')
    expect(readdirSync(join(process.cwd(), 'app', 'command-center'))).not.toContain('sync-state')
  })
})

/**
 * MOUNTED IS NEITHER DEMONSTRATED NOR ABSENT.
 *
 * A module that owns no route can still be built and on screen — the source
 * requires it. `MOD-CC-13`'s action rail and `MOD-CC-07` mount inside other
 * modules' screens, and `MOD-CC-02` is chrome that `AC-CC-040` forbids a route.
 * Until the third status existed every one of them read `not-represented`, the
 * same word the inventory uses for a module with no code at all.
 *
 * It was understating the build by seven modules. Five are substantial:
 * `MOD-FL-A4`, `A5`, `B8`, `B9` and `B11` are ninety-nine source files between
 * them, all five imported by `app/frontline/run-player/page.tsx`, and every one
 * read not-represented — because that route imports them by path and never
 * names a module id in its text, so the mention scan could not see them.
 */
describe('module status — mounted, demonstrated and absent are three different facts', () => {
  const rowsOf = () => fresh('modules').rows as { id: string; status: string }[]

  // FAILS IF: the third status stops being produced at all — which is how the
  // first implementation failed silently. It looked modules up in the map of
  // DECLARED SLUGS, and the modules the rule exists for are exactly the ones
  // that declare `slug: null`, so it reported seven mounted modules as zero and
  // every other assertion here would have passed on an empty set.
  it('produces all three statuses and nothing else', () => {
    const seen = new Set(rowsOf().map((r) => r.status))
    expect([...seen].sort()).toEqual([
      'demonstrated-in-storyboard',
      'mounted-in-another-screen',
      'not-represented',
    ])
    expect(rowsOf().filter((r) => r.status === 'mounted-in-another-screen').length).toBeGreaterThan(0)
  })

  // FAILS IF: a module whose directory a route imports reads not-represented.
  //
  // Planted: the `importedModuleDirs` collection removed from the route walk in
  // `scripts/build-registries.mjs`. Went red listing all seven. Restored
  // byte-identically.
  //
  // Derived from the imports, not from a list of ids: a hand-written list is
  // the enumeration this file's neighbours exist to kill.
  it('never reports a module as absent when a route imports its directory', () => {
    const imported = new Set<string>()
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(e.name)) continue
        if (e.isDirectory()) walk(join(dir, e.name))
        else if (/\.tsx?$/.test(e.name)) {
          for (const m of readFileSync(join(dir, e.name), 'utf8').matchAll(
            /from\s+'[^']*\/modules\/([a-z]+-[a-z]?\d+)(?:\/[^']*)?'/g,
          )) {
            const dirName = m[1]
            if (dirName !== undefined) imported.add(`MOD-${dirName.toUpperCase()}`)
          }
        }
      }
    }
    walk(join(process.cwd(), 'app'))
    expect(imported.size, 'no route imports any module directory — the scan is broken').toBeGreaterThan(3)

    const status = new Map(rowsOf().map((r) => [r.id, r.status]))
    const wrong = [...imported]
      .filter((id) => status.has(id))
      .filter((id) => status.get(id) === 'not-represented')
    expect(wrong, 'modules a route imports but the registry calls absent').toEqual([])
  })

  // FAILS IF: owning a route stops outranking being imported. A module that
  // owns its screen is demonstrated whether or not something else also mounts
  // it; reversing the precedence would demote a module for being reused.
  //
  // PLANTED AND IT NEVER REACHED THIS ASSERTION, which is worth recording
  // rather than dressing up. Reversing the precedence in the generator makes it
  // THROW — `slugClaimedButNotDemonstrated` refuses to write a registry in
  // which a module declaring a slug whose route directory exists reads anything
  // but demonstrated — so the whole suite skipped instead of this case going
  // red. The precedence is genuinely protected, and by a stronger guard than
  // this one: the generator will not produce the output at all. This case
  // remains as the cheap statement of the same fact, and its honest status is
  // that the generator's refusal is what enforces it.
  it('keeps a module that owns a route demonstrated even when another route imports it', () => {
    const status = new Map(rowsOf().map((r) => [r.id, r.status]))
    // MOD-FL-A3 owns `/frontline/run-player/` by slug AND is imported by it.
    expect(status.get('MOD-FL-A3')).toBe('demonstrated-in-storyboard')
  })
})

/**
 * TWO NUMBERS, BECAUSE ONE READS AS THE WHOLE TRUTH.
 *
 * `status` answers whether a ROUTE SCREEN names a row's identifier. That is
 * the right question for a status and an incomplete answer for a reader:
 * measured across the fourteen inventories, **258 rows read demonstrated and
 * 813 are named somewhere under `src/` or `app/`.** The 555-row gap is not
 * unbuilt work — it is work no route happens to spell.
 *
 * Both numbers are sums over the fourteen `registries/generated/*.json` that
 * `pnpm build:registries` writes — the `demonstrated-in-storyboard` rows, and
 * `namedInSourceCount`. Re-measure them there rather than quoting this comment;
 * the pair it used to carry, 237 and 663, was true one slice earlier.
 *
 * The sharpest case is `offline-scenarios`: **0 of 70 demonstrated, 70 of 70
 * named.** Two slice-8 tasks transcribed every one of the seventy use cases,
 * and nothing under `app/` names a `UC-OFF-*` identifier, so the registry
 * reports none. True to the rule, false about the build — and the coverage
 * dashboard puts that number in front of a client.
 */
describe('named-in-source — the weaker fact, published beside the stronger one', () => {
  // FAILS IF: a registry stops carrying the pair, or the count stops being
  // reachable from the rows. Planted: `namedInSourceCount` hard-coded to 0 in
  // the generator; went red on every inventory that has any named row.
  it.each(SLUGS)('%s publishes a named count and what it means', (slug) => {
    const r = fresh(slug)
    expect(typeof r.namedInSourceCount, slug).toBe('number')
    expect(r.namedInSourceCount, slug).toBeLessThanOrEqual((r.rows as unknown[]).length)
    expect(r.namedInSourceMeaning as string, slug).toMatch(/WEAKER than a status|weaker than a status/i)
  })

  // FAILS IF: named-in-source stops being a superset of demonstrated.
  //
  // It must be, by construction: a route file that names an identifier is a
  // file under `app/`, and the named walk covers `app/`. If this ever fails,
  // the two walks have diverged and the smaller number is the one to trust.
  //
  // Planted: the named walk narrowed to `src/` only; went red on `modules`,
  // where route files name module ids that no src file does.
  it.each(SLUGS)('%s never reports fewer named than demonstrated', (slug) => {
    const r = fresh(slug)
    const demonstrated = (r.rows as { status: string }[]).filter(
      (x) => x.status === 'demonstrated-in-storyboard',
    ).length
    expect(r.namedInSourceCount as number, `${slug}: named must include demonstrated`).toBeGreaterThanOrEqual(
      demonstrated,
    )
  })

  // FAILS IF: the gap this exists to show closes silently — which would mean
  // either every transcription gained a route, or the measure stopped
  // measuring. Both are worth knowing about; neither should pass unnoticed.
  it('shows a real gap today, so the pair is not decorative', () => {
    const totals = SLUGS.map((s) => {
      const r = fresh(s)
      const d = (r.rows as { status: string }[]).filter(
        (x) => x.status === 'demonstrated-in-storyboard',
      ).length
      return { demonstrated: d, named: r.namedInSourceCount as number }
    })
    const demonstrated = totals.reduce((a, t) => a + t.demonstrated, 0)
    const named = totals.reduce((a, t) => a + t.named, 0)
    expect(named, `named ${named} must exceed demonstrated ${demonstrated}`).toBeGreaterThan(demonstrated)
  })
})

/**
 * MOUNTING IS TRANSITIVE — a module two hops from a route is still on screen.
 *
 * The first version of the mounting rule read only the import specifiers of
 * files sitting **directly inside** a route directory. That saw the five
 * Frontline modules the Run Player imports by name, and it did not see
 * `MOD-CC-02`, whose chrome is imported by the live shift board's own chrome
 * component — one hop further out. Chrome mounted inside a module mounted
 * inside a route is exactly the shape the status exists for, and the
 * direct-only rule reported it absent.
 *
 * Four independent agent reachability probes in this build reached the same
 * design from the other side, and every one recorded the same failure mode: a
 * walk following only `@/…`, or only single-line `import … from`,
 * under-reports — **and a reachability check that under-reports goes green on
 * a broken chain.**
 */
describe('mounting is transitive', () => {
  // FAILS IF: the walk stops following imports and falls back to direct-only.
  //
  // Planted: `followImports(target)` replaced with `reachedFiles.add(target)`,
  // which visits each direct import and descends no further. Went red — the
  // mounted count fell from 10 to 8 and `MOD-CC-02` returned to
  // not-represented. Restored byte-identically.
  it('reports a module reached only through another module as mounted', () => {
    const rows = fresh('modules').rows as { id: string; status: string }[]
    const status = new Map(rows.map((r) => [r.id, r.status]))

    // MOD-CC-02 is chrome. No route imports it; `app/command-center/
    // live-shift-board/` imports MOD-CC-01's board, which imports MOD-CC-02's.
    // Two hops, and it is on screen.
    expect(status.get('MOD-CC-02')).toBe('mounted-in-another-screen')

    // And the rule has not collapsed into "everything is mounted": some
    // modules are genuinely reached by nothing, which is what makes the
    // status above a measurement.
    const absent = rows.filter((r) => r.status === 'not-represented')
    expect(absent.length, 'no module reads absent — the rule has stopped discriminating').toBeGreaterThan(0)
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { isForeignProbe } from '../probe-paths'

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

  it('keeps the two registers separate — 205 stays the NOTIF-* count, never the row count', () => {
    const n = fresh('notifications')
    expect(n.rawCount).toBe(205)
    expect(n.rows).toHaveLength(261)
    const identifierRows = (n.rows as Row[]).filter((r) => !r.id.startsWith('STU-TRIGGER-'))
    expect(identifierRows).toHaveLength(205)
    for (const r of identifierRows) expect(r.register, r.id).toMatch(/identifier/i)
    expect(n.reconciledCount).toBeNull()
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
  it('keeps MOD-CC-02 slugless and unrouted, because it is chrome', () => {
    const slugs = declaredSlugs()
    // `.get() ?? 'ABSENT'` cannot express this: `??` fires on the very null
    // the assertion is looking for, so a correctly-slugless module and an
    // unparsed one read the same. Absence and `slug: null` are different
    // facts and this checks both.
    expect(slugs.has('MOD-CC-02'), 'MOD-CC-02 was not parsed from any modules.ts').toBe(true)
    expect(slugs.get('MOD-CC-02')).toBeNull()
    const row = (fresh('modules').rows as { id: string; status: string }[]).find((r) => r.id === 'MOD-CC-02')
    expect(row?.status).toBe('not-represented')
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

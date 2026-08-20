import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
] as const

const load = (s: string) => JSON.parse(readFileSync(`registries/generated/${s}.json`, 'utf8'))

describe('generated registries', () => {
  it.each(SLUGS)('%s exists and has rows', (slug) => {
    expect(existsSync(`registries/generated/${slug}.json`), slug).toBe(true)
    expect(load(slug).rows.length, slug).toBeGreaterThan(0)
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
    const first = mkdtempSync(join(tmpdir(), 'aviixa-registry-'))
    const second = mkdtempSync(join(tmpdir(), 'aviixa-registry-'))
    try {
      for (const dir of [first, second]) {
        execFileSync('node', ['scripts/build-registries.mjs'], {
          cwd: process.cwd(),
          env: { ...process.env, AVIIXA_REGISTRY_OUT: dir },
        })
      }
      for (const slug of SLUGS) {
        expect(readFileSync(join(second, `${slug}.json`), 'utf8'), slug).toBe(
          readFileSync(join(first, `${slug}.json`), 'utf8'),
        )
      }
    } finally {
      rmSync(first, { recursive: true, force: true })
      rmSync(second, { recursive: true, force: true })
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
    const isForeignProbe = (name: string): boolean => /^\.zz-probe-(?:[a-z0-9-]+-)?\d+$/.test(name)
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

  it('every row carries one of the honest coverage statuses, never an "implemented" claim', () => {
    for (const slug of SLUGS) {
      for (const row of load(slug).rows) {
        expect(['demonstrated-in-storyboard', 'decision-blocked', 'not-applicable', 'not-represented'], `${slug}/${row.id}`).toContain(row.status)
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

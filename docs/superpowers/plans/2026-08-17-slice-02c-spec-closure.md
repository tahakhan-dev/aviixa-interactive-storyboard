# Slice 2c — Spec Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every gap recorded against the approved slice 2b spec — the contrast defect, the missing review and package fields, import conflict handling, the dashboard count classes, the missing controls and filters, composite registry keys, and all thirteen unpopulated registry indexes.

**Architecture:** Nothing here is new design; each task closes a named spec section. Registry indexes are generated at build time from data already extracted — `registries/raw/identifier-index.json` (17,931 stable identifiers with line locators) and the semantic chunk extraction — then runtime-validated with strict Zod like every other registry.

**Tech Stack:** Next.js 16.3.1 (`output: 'export'`), React 19.2.8, TypeScript 5.9.3 strict, Tailwind 4.3.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.62.1, `fake-indexeddb` 6.2.5, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-17-slice-02c-spec-closure-design.md` (sha256 `fb82c5e96d80e1a98dfbbab60773f006c4235d1bd826a89ffcc50f59d2ce33b2`)

**Branch:** `slice-02c-spec-closure`, based on `main` at `0fd9bb8`.

## Global Constraints

- **No runtime backend.** No API routes, Route Handlers, Server Actions, middleware. The static-export build fails if one appears.
- **No external-origin network request at runtime.**
- TypeScript 5.9.3 with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ON. **Never weaken them.**
- **Determinism.** No ambient `Date.now()`, `new Date()`, `Math.random()` in `src/` — except review-record ids, which use `crypto.randomUUID()` with the reasoning already recorded in code. Do not extend that exception.
- **A client-review action creates a `ReviewEvent` and nothing else.** Gate-enforced.
- **"Accept for client review", never "Approve".**
- **Only `ScenarioCommandGateway` may mutate.** Gate walks all of `src/` and `app/`, exempting `src/scenario/gateway.ts` by name.
- **Memory has no export path at V1.** Structurally, not by convention.
- **Coverage status values:** `demonstrated-in-storyboard`, `decision-blocked`, `not-applicable`, `not-represented`. Never `implemented`, `complete`, or a green check — this application has no backend and such a label would claim a capability that does not exist.
- **`workflows.expectedCount` stays `null`.** The frozen source fixes no workflow total; 81 is the MODULE count and nothing else.
- **No index may present an extracted identifier count as a canonical inventory total.**
- **WCAG 2.2 AA** on every route and state. Every gate proven able to fail by planting a violation.
- **Production-grade engineering:** typed failures over thrown exceptions, every failure path tested, no silent catch, no swallowed rejection. And no implication of a real backend, scheduler, integration or audit guarantee.

## Two binding lessons from earlier slices

**Probe the axis the CONTRACT spans, not the one the implementation suggests.** Four defects in this project were found only when a later probe changed axis: synchronous versus asynchronous, one argument position versus four, volume versus reload lifecycle, and colour measured against white versus the background that actually renders.

**Compute a property generically rather than enumerating known instances.** Scoping the workflow-collapse fix to the two placeholder ids someone had already found would have left thirty further collapses shipping undisclosed behind well-formed ids.

---

## File Structure

```
app/globals.css                      MODIFY  --color-status-attention
app/workflows/page.tsx               MODIFY  filters; revert the info-tone workaround
app/coverage/page.tsx                MODIFY  eight count classes
app/coverage/[registry]/page.tsx     MODIFY  render real rows for all fourteen
app/review/layout.tsx                CREATE  server wrapper exporting metadata
src/review/records.ts                MODIFY  eleven missing fields
src/review/package.ts                MODIFY  seven payload elements; dedupe/merge/conflict
src/scenario/controls.ts             MODIFY  startClean, loadCanonicalStory, compareBeforeAndAfter
src/coverage/descriptors.ts          MODIFY  eight count classes; per-index reconciled scope
src/coverage/registry-loader.ts      CREATE  runtime-validated loader for all fourteen
scripts/build-registries.mjs         CREATE  generates all fourteen from extracted data
registries/generated/*.json          CREATE  fourteen registry files
tests/                               unit, component, coverage, e2e
```

---

## Task 1: The `attention` token contrast defect

**Files:**
- Modify: `app/globals.css`
- Modify: `app/workflows/page.tsx` (revert the slice-2b `info`-tone workaround)
- Test: `tests/unit/token-contrast.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `--color-status-attention: #a04a08`; a reusable contrast helper `contrastRatio(hex, hex)` and `compositeOver(hex, hex, alpha)` exported from `tests/unit/token-contrast.test.ts`'s sibling `tests/unit/contrast.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/contrast.ts`:

```ts
export function toRgb(hex: string): readonly [number, number, number] {
  const h = hex.replace('#', '')
  const p = (i: number) => Number.parseInt(h.slice(i, i + 2), 16)
  return [p(0), p(2), p(4)]
}

function channelLuminance(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(rgb: readonly [number, number, number]): number {
  const [r, g, b] = rgb
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(toRgb(a))
  const lb = relativeLuminance(toRgb(b))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Composite `fg` over `bg` at `alpha`, returning the resulting hex. */
export function compositeOver(fg: string, bg: string, alpha: number): string {
  const f = toRgb(fg)
  const b = toRgb(bg)
  const out = [0, 1, 2].map((i) => Math.round((f[i] ?? 0) * alpha + (b[i] ?? 0) * (1 - alpha)))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
```

`tests/unit/token-contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { contrastRatio, compositeOver } from './contrast'

const CSS = readFileSync('app/globals.css', 'utf8')
function token(name: string): string {
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(CSS)
  if (!m?.[1]) throw new Error(`Token ${name} not found or not a 6-digit hex`)
  return m[1]
}

const TONES = ['ok', 'info', 'attention', 'blocked', 'stale', 'neutral'] as const
/** StatusPill paints the label in the tone colour over a 10% tint of ITSELF. */
const PILL_TINT_ALPHA = 0.1

describe('status token contrast, measured where it actually renders', () => {
  const surface = token('--color-surface')

  it.each(TONES)('%s passes AA at 12px on the composited pill background', (tone) => {
    const c = token(`--color-status-${tone}`)
    const rendered = compositeOver(c, surface, PILL_TINT_ALPHA)
    expect(contrastRatio(c, rendered)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(TONES)('%s also passes against the plain surface', (tone) => {
    expect(contrastRatio(token(`--color-status-${tone}`), surface)).toBeGreaterThanOrEqual(4.5)
  })

  // Slice 1 shipped a token with 0.05 of headroom that would have flipped to
  // failing the first time anything shifted. Require real margin.
  it.each(TONES)('%s carries at least 0.25 of headroom on the tint', (tone) => {
    const c = token(`--color-status-${tone}`)
    expect(contrastRatio(c, compositeOver(c, surface, PILL_TINT_ALPHA))).toBeGreaterThanOrEqual(4.75)
  })

  it('measures the tint, not the surface — the two differ for every tone', () => {
    for (const tone of TONES) {
      const c = token(`--color-status-${tone}`)
      const onSurface = contrastRatio(c, surface)
      const onTint = contrastRatio(c, compositeOver(c, surface, PILL_TINT_ALPHA))
      expect(onTint, tone).toBeLessThan(onSurface)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/token-contrast.test.ts`
Expected: FAIL — `attention` is `#b45309`, giving 4.391:1 on the composited tint, below both the 4.5 floor and the 4.75 headroom bar. Every other tone passes.

- [ ] **Step 3: Fix the token**

In `app/globals.css`, change:

```css
  --color-status-attention: #a04a08;
```

Measured: 5.226:1 on the composited tint (0.73 of headroom), 6.04:1 on the plain surface. It stays in the amber family, so the visual language is unchanged.

Then in `app/workflows/page.tsx`, revert the slice-2b workaround: the `StatusPill` that was switched to the `info` tone because `attention` failed contrast goes back to `attention`. Search for the comment recording that substitution and remove it along with the workaround — the token now passes, so the note would become a false statement about the code.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/token-contrast.test.ts && pnpm build && pnpm test:e2e`
Expected: all four contrast test groups PASS; the axe suite still passes with `attention` restored on `/workflows/`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/workflows/page.tsx tests/unit/contrast.ts tests/unit/token-contrast.test.ts
git commit -m "fix(slice-02c): attention token passes AA on the background that actually renders"
```

---

## Task 2: The eleven missing `ReviewRecord` fields

**Files:**
- Modify: `src/review/records.ts`
- Test: `tests/unit/review-records.test.ts` (extend)

**Interfaces:**
- Consumes: `Clock`
- Produces:
  - `type ReviewSeverity = 'blocking' | 'major' | 'minor' | 'question'`
  - `const REVIEW_SEVERITIES: readonly ReviewSeverity[]` — `as const satisfies readonly ReviewSeverity[]`
  - `type ReviewDisposition = 'open' | 'accepted' | 'declined' | 'superseded'`
  - `const REVIEW_DISPOSITIONS: readonly ReviewDisposition[]`
  - `CreateReviewRecordInput` gains `module?`, `functionId?`, `route?`, `screen?`, `storyState?`, `severity`, `requestedChange?`
  - `ReviewRecord` gains `updatedAtLogical`, `disposition`, `response`, `supersededBy`
  - `function superseded(record, bySupersedingId, clock): ReviewRecord`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/review-records.test.ts`:

```ts
import {
  REVIEW_SEVERITIES, REVIEW_DISPOSITIONS, superseded,
} from '@/review/records'

const full = {
  anchorType: 'screen' as const, anchorId: 'SCR-1', surface: 'SURF-DOH' as const,
  module: 'MOD-DOH-07', functionId: 'FUNC-A1-01-1-1', route: '/hub/',
  screen: 'SCR-DOH-RUNS', storyState: 'STEP-03',
  reviewerLabel: 'Client reviewer', status: 'needs-change' as const,
  severity: 'major' as const,
  comment: 'The freshness label should name the source surface.',
  requestedChange: 'Add the owning surface beside the as-at time.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}

describe('the full twenty-one field review record', () => {
  it('carries every field spec section 4 names', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    for (const k of [
      'id', 'anchorType', 'anchorId', 'surface', 'module', 'functionId', 'route',
      'screen', 'storyState', 'reviewerLabel', 'status', 'severity', 'comment',
      'requestedChange', 'createdAtLogical', 'updatedAtLogical', 'disposition',
      'response', 'sourceFingerprint', 'scenarioVersion', 'buildHash', 'supersededBy',
    ]) {
      expect(Object.hasOwn(r, k), `missing field: ${k}`).toBe(true)
    }
  })

  it('closes the severity and disposition vocabularies', () => {
    expect(REVIEW_SEVERITIES).toHaveLength(4)
    expect(REVIEW_DISPOSITIONS).toHaveLength(4)
    expect(REVIEW_DISPOSITIONS.join(' ')).not.toMatch(/\bapprove/i)
  })

  it('starts open, unanswered and unsuperseded', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    expect(r.disposition).toBe('open')
    expect(r.response).toBeNull()
    expect(r.supersededBy).toBeNull()
  })

  it('never lets updatedAtLogical precede createdAtLogical', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    expect(r.updatedAtLogical).toBeGreaterThanOrEqual(r.createdAtLogical)
  })

  it('supersession links forward and marks the disposition', () => {
    const clock = fixedClock(CANONICAL_EPOCH_MS)
    const first = createReviewRecord(full, clock)
    const second = createReviewRecord(full, clock)
    const closed = superseded(first, second.id, clock)
    expect(closed.supersededBy).toBe(second.id)
    expect(closed.disposition).toBe('superseded')
    expect(closed.updatedAtLogical).toBeGreaterThanOrEqual(closed.createdAtLogical)
  })

  it('refuses to supersede a record by itself', () => {
    const clock = fixedClock(CANONICAL_EPOCH_MS)
    const r = createReviewRecord(full, clock)
    expect(() => superseded(r, r.id, clock)).toThrow(/itself/i)
  })

  it('requires a requestedChange when the status asks for a change', () => {
    expect(() =>
      createReviewRecord({ ...full, status: 'needs-change', requestedChange: '   ' }, fixedClock(CANONICAL_EPOCH_MS)),
    ).toThrow(/requested change/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-records.test.ts`
Expected: FAIL — `REVIEW_SEVERITIES`, `REVIEW_DISPOSITIONS` and `superseded` are not exported, and the field-presence loop fails on `module` first.

- [ ] **Step 3: Write the implementation**

Add the two closed vocabularies with the same `as const satisfies` shape and compile-time exhaustiveness check already used for `REVIEW_STATUSES` — a plain annotation widens the const and makes the check vacuous, which this project has shipped once already.

`module`, `functionId`, `route`, `screen`, `storyState` and `requestedChange` are optional on the input (a comment on a page need not name a function); `severity` is required. `ReviewRecord` adds `updatedAtLogical` (initialised to `createdAtLogical`), `disposition` (`'open'`), `response` (`null`) and `supersededBy` (`null`).

`superseded` returns a NEW record — records are append-only, so it never mutates its argument. It throws when asked to supersede a record by its own id, because a self-reference is a cycle, not a supersession.

Note the field is named `functionId`, not `function`, because `function` is a reserved word and an object key called `function` would read as a keyword at every call site.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:unit`
Expected: the seven new tests PASS and every pre-existing review test still passes.

- [ ] **Step 5: Commit**

```bash
git add src/review/records.ts tests/unit/review-records.test.ts
git commit -m "feat(slice-02c): the full twenty-one field review record with supersession"
```

---

## Task 3: The seven missing package payload elements

**Files:**
- Modify: `src/review/package.ts`
- Test: `tests/unit/review-package.test.ts` (extend)

**Interfaces:**
- Consumes: `ReviewRecord`, `canonicalSerialize`, `sha256Hex`
- Produces: `ReviewPackage` gains `promptHash`, `scenarioSeed`, `fixtureRefs`, `decisions`, `bookmarks`, `coverageSnapshot`, `screenshotRefs`; `CoverageSnapshot` interface

- [ ] **Step 1: Write the failing test**

```ts
describe('the full eleven-element review package', () => {
  const input = () => ({
    sourceHash: '47bd18db', promptHash: 'p-1', buildHash: 'abc',
    scenarioVersion: '1', scenarioSeed: 'seed-1',
    fixtureRefs: ['FIX-1'], records: [rec()], decisions: ['DEC-TAX-002'],
    bookmarks: ['/coverage/modules/'],
    coverageSnapshot: { takenAtLogical: CANONICAL_EPOCH_MS, byStatus: { 'not-represented': 14 } },
    screenshotRefs: ['shot-1.png'],
  })

  it('carries every element spec section 5 names', async () => {
    const p = await exportReviewPackage(input())
    for (const k of [
      'formatVersion', 'sourceHash', 'promptHash', 'buildHash', 'scenarioVersion',
      'scenarioSeed', 'fixtureRefs', 'records', 'decisions', 'bookmarks',
      'coverageSnapshot', 'screenshotRefs', 'manifest', 'manifestChecksum',
    ]) {
      expect(Object.hasOwn(p, k), `missing element: ${k}`).toBe(true)
    }
  })

  it('brings every new element inside the manifest hash scope', async () => {
    const base = input()
    const a = await exportReviewPackage(base)
    for (const mutate of [
      (i: ReturnType<typeof input>) => ({ ...i, promptHash: 'p-2' }),
      (i: ReturnType<typeof input>) => ({ ...i, scenarioSeed: 'seed-2' }),
      (i: ReturnType<typeof input>) => ({ ...i, fixtureRefs: ['FIX-2'] }),
      (i: ReturnType<typeof input>) => ({ ...i, decisions: ['DEC-SYNC-001'] }),
      (i: ReturnType<typeof input>) => ({ ...i, bookmarks: ['/workflows/'] }),
      (i: ReturnType<typeof input>) => ({ ...i, screenshotRefs: ['shot-2.png'] }),
      (i: ReturnType<typeof input>) => ({
        ...i, coverageSnapshot: { takenAtLogical: CANONICAL_EPOCH_MS, byStatus: { 'not-represented': 13 } },
      }),
    ]) {
      const b = await exportReviewPackage(mutate(base))
      expect(b.manifestChecksum, 'a changed element must change the checksum').not.toBe(a.manifestChecksum)
    }
  })

  it('still excludes the checksum from its own hash scope', async () => {
    const p = await exportReviewPackage(input())
    expect(JSON.stringify(p.manifest)).not.toContain(p.manifestChecksum)
  })

  it('still refuses memory data', async () => {
    await expect(exportReviewPackage({ ...input(), memory: [{ a: 1 }] } as never)).rejects.toThrow(/memory/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-package.test.ts`
Expected: FAIL — the element-presence loop fails on `promptHash`.

- [ ] **Step 3: Write the implementation**

Add the seven elements to the input type and the package type, and include each in the manifest so it falls inside the hash scope. The mutation test above is the real requirement: an element outside the hash scope would let a package's content change without its checksum changing, which defeats the corruption detection the checksum exists for.

`CoverageSnapshot` is `{ takenAtLogical: number; byStatus: Readonly<Record<string, number>> }` — it records what the build claimed at export time, so two packages reviewed against different coverage states can be told apart.

Keep the memory guard exactly as it is.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/review-package.test.ts`
Expected: all four new groups PASS, including all seven mutation cases.

- [ ] **Step 5: Commit**

```bash
git add src/review/package.ts tests/unit/review-package.test.ts
git commit -m "feat(slice-02c): the full eleven-element review package, all inside the hash scope"
```

---

## Task 4: Import dedupe, merge, replace and conflict reporting

**Files:**
- Modify: `src/review/package.ts`
- Test: `tests/unit/review-import.test.ts` (extend)

**Interfaces:**
- Consumes: `ReviewRecord`, `importReviewPackage`
- Produces:
  - `interface ImportPreview { incoming; duplicates: readonly string[]; conflicts: readonly ImportConflict[]; newRecords: readonly ReviewRecord[] }`
  - `interface ImportConflict { id: string; existing: ReviewRecord; incoming: ReviewRecord }`
  - `type MergeStrategy = 'merge' | 'replace'`
  - `function planImport(incoming, existing): ImportPreview`
  - `function applyImport(preview, strategy): readonly ReviewRecord[]`

- [ ] **Step 1: Write the failing test**

```ts
describe('import dedupe, conflict and merge', () => {
  const mk = (id: string, comment: string) => ({ ...rec(), id, comment })

  it('reports a record already present as a duplicate, not a new record', () => {
    const existing = [mk('R-1', 'same')]
    const p = planImport([mk('R-1', 'same')], existing)
    expect(p.duplicates).toEqual(['R-1'])
    expect(p.newRecords).toEqual([])
    expect(p.conflicts).toEqual([])
  })

  it('reports a same-id different-content record as a conflict, showing both', () => {
    const existing = [mk('R-1', 'original text')]
    const p = planImport([mk('R-1', 'ALTERED text')], existing)
    expect(p.conflicts).toHaveLength(1)
    expect(p.conflicts[0]?.existing.comment).toBe('original text')
    expect(p.conflicts[0]?.incoming.comment).toBe('ALTERED text')
    expect(p.duplicates).toEqual([])
  })

  it('reports an unseen record as new', () => {
    const p = planImport([mk('R-2', 'fresh')], [mk('R-1', 'a')])
    expect(p.newRecords.map((r) => r.id)).toEqual(['R-2'])
  })

  it('merge keeps the existing side of every conflict', () => {
    const existing = [mk('R-1', 'original')]
    const out = applyImport(planImport([mk('R-1', 'incoming')], existing), 'merge')
    expect(out.find((r) => r.id === 'R-1')?.comment).toBe('original')
  })

  it('replace takes the incoming side of every conflict', () => {
    const existing = [mk('R-1', 'original')]
    const out = applyImport(planImport([mk('R-1', 'incoming')], existing), 'replace')
    expect(out.find((r) => r.id === 'R-1')?.comment).toBe('incoming')
  })

  it('both strategies add new records and never drop an existing one', () => {
    const existing = [mk('R-1', 'a'), mk('R-9', 'keep me')]
    for (const s of ['merge', 'replace'] as const) {
      const out = applyImport(planImport([mk('R-2', 'b')], existing), s)
      expect(out.map((r) => r.id).sort(), s).toEqual(['R-1', 'R-2', 'R-9'])
    }
  })

  it('planning mutates neither input', () => {
    const incoming = [mk('R-1', 'x')]
    const existing = [mk('R-1', 'y')]
    const before = JSON.stringify({ incoming, existing })
    planImport(incoming, existing)
    expect(JSON.stringify({ incoming, existing })).toBe(before)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-import.test.ts`
Expected: FAIL — `planImport` and `applyImport` are not exported.

- [ ] **Step 3: Write the implementation**

`planImport` compares by id, then by canonical serialisation of the record: same id and same content is a duplicate; same id and different content is a conflict carrying both sides; unseen id is new. It is pure and mutates neither argument — the last test is the contract.

`applyImport` is the only function that resolves a conflict, and it does so by an explicit strategy the reviewer chose. Neither strategy ever drops an existing record, because losing a reviewer's note to an import is the same silent data loss slice 2b already fixed once.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/review-import.test.ts`
Expected: all seven new tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/package.ts tests/unit/review-import.test.ts
git commit -m "feat(slice-02c): import dedupe, conflict reporting and explicit merge or replace"
```

---

## Task 5: The three missing scenario controls

**Files:**
- Modify: `src/scenario/controls.ts`
- Test: `tests/unit/controls.test.ts` (extend)

**Interfaces:**
- Consumes: `Clock`, `ScenarioDomainState`, `hashState`, `scenarioRunId`
- Produces: `ScenarioControls` gains `startClean(newRunId)`, `loadCanonicalStory(seed)`, `compareBeforeAndAfter(before, after)`; `interface StateComparison { changedTenants; sequenceDelta; priorHash; nextHash; identical }`

- [ ] **Step 1: Write the failing test**

```ts
describe('the three remaining scenario controls', () => {
  it('startClean produces a run with no parent lineage', () => {
    const h = harness()
    const r = h.controls.startClean(scenarioRunId('RUN-CLEAN'))
    expect(r.state.runId).toBe('RUN-CLEAN')
    expect(r.lineage.parentRunId).toBeNull()
    expect(r.lineage.branchedFromSequence).toBeNull()
  })

  it('startClean leaves any prior state untouched', async () => {
    const h = harness()
    const prior = h.controls.startClean(scenarioRunId('RUN-A')).state
    const before = await hashState(prior)
    h.controls.startClean(scenarioRunId('RUN-B'))
    expect(await hashState(prior)).toBe(before)
  })

  it('loadCanonicalStory is deterministic — same seed, same state hash', async () => {
    const a = harness().controls.loadCanonicalStory('seed-1')
    const b = harness().controls.loadCanonicalStory('seed-1')
    expect(await hashState(a)).toBe(await hashState(b))
  })

  it('a different seed produces a different state', async () => {
    const a = harness().controls.loadCanonicalStory('seed-1')
    const b = harness().controls.loadCanonicalStory('seed-2')
    expect(await hashState(a)).not.toBe(await hashState(b))
  })

  it('compareBeforeAndAfter reports identical states as identical', async () => {
    const h = harness()
    const s = h.controls.loadCanonicalStory('seed-1')
    const c = await h.controls.compareBeforeAndAfter(s, s)
    expect(c.identical).toBe(true)
    expect(c.changedTenants).toEqual([])
    expect(c.sequenceDelta).toBe(0)
  })

  it('compareBeforeAndAfter names the tenants that changed', async () => {
    const h = harness()
    const before = h.controls.loadCanonicalStory('seed-1')
    const after = withTenant(before, tenantId('TEN-A'), (p) => ({ ...p, displayName: 'Renamed' }))
    const c = await h.controls.compareBeforeAndAfter(before, after)
    expect(c.identical).toBe(false)
    expect(c.changedTenants).toContain('TEN-A')
  })

  it('compareBeforeAndAfter is pure — neither side is mutated', async () => {
    const h = harness()
    const before = h.controls.loadCanonicalStory('seed-1')
    const after = h.controls.loadCanonicalStory('seed-2')
    const snap = JSON.stringify({ before, after })
    await h.controls.compareBeforeAndAfter(before, after)
    expect(JSON.stringify({ before, after })).toBe(snap)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/controls.test.ts`
Expected: FAIL — the three methods do not exist on `ScenarioControls`.

- [ ] **Step 3: Write the implementation**

`startClean` returns a fresh `ScenarioDomainState` plus a `RunLineage` whose `parentRunId` and `branchedFromSequence` are both `null` — that is what distinguishes a clean start from a branch, and it must never reuse an existing run id.

`loadCanonicalStory` builds the fixture world from a seed deterministically. No `Math.random()`: derive every generated value from the seed string so the same seed always produces the same state hash. The determinism test is the contract.

`compareBeforeAndAfter` is async only because it hashes; it mutates nothing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/controls.test.ts`
Expected: all seven new tests PASS alongside the existing control tests.

- [ ] **Step 5: Commit**

```bash
git add src/scenario/controls.ts tests/unit/controls.test.ts
git commit -m "feat(slice-02c): start-clean, deterministic canonical story, and state comparison"
```

---

## Task 6: The registry build script

**Files:**
- Create: `scripts/build-registries.mjs`
- Test: `tests/unit/registry-build.test.ts`

**Interfaces:**
- Consumes: `registries/raw/identifier-index.json`, `registries/raw/extract/CHK-*.json`
- Produces: fourteen files under `registries/generated/`, each `{ slug, countedThing, reconciledCount, rawCount, dedupRule, sourceFixesNoTotal, rows }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'

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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/registry-build.test.ts`
Expected: FAIL — only `workflow-registry.json` and `source-reconciliation.json` exist under `registries/generated/`.

- [ ] **Step 3: Write the generator**

`scripts/build-registries.mjs` reads the two raw sources and writes fourteen files. Wire it as a `build:registries` script in `package.json` and run it before `next build`.

Three families of source:
- **semantic extraction** — modules, business objects, actionable controls: rows carry name, and whatever of actor/surface/purpose the extraction captured;
- **identifier index** — functions, features, sub-features, use cases, events, commands, notifications, offline scenarios, scheduled work, AI storyboards: rows carry the stable id and its first source line;
- **workflows** — already generated; fold its generation into this script so there is ONE generator, not two.

Every file records `countedThing` in words, `rawCount`, `reconciledCount` (or `null`), `dedupRule` when the two differ, and `sourceFixesNoTotal`.

**The modules row is the one that will go wrong if rushed.** The semantic extraction keys 92 module records; the canonical inventory is 81. Filter to the canonical `MOD-` families — `MOD-SA-01`…`19`, `MOD-DOH-01`…`19`, `MOD-STU-01`…`18`, `MOD-CC-01`…`13`, `MOD-FL-A1`…`A7` and `MOD-FL-B8`…`B12` — and record the dedup rule as excluding aliases, label-keyed duplicates, and negative-assertion tokens. `MOD-SA-20` must not appear: it exists in the frozen source only inside a test asserting its absence.

Sort rows by id so the output is deterministic and diffable.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm build:registries && pnpm vitest run tests/unit/registry-build.test.ts`
Expected: all nine test groups PASS across all fourteen slugs.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-registries.mjs registries/generated package.json tests/unit/registry-build.test.ts
git commit -m "feat(slice-02c): one generator for all fourteen registries with reconciled counts"
```

---

## Task 7: Composite registry keys for collapsed workflows

**Files:**
- Modify: `scripts/build-registries.mjs`
- Test: `tests/unit/registry-build.test.ts` (extend)

**Interfaces:**
- Consumes: the generator from Task 6
- Produces: workflow rows keyed on id plus source line; `collapsedFrom` and `idIsPlaceholder` retained

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm build:registries && pnpm vitest run tests/unit/registry-build.test.ts`
Expected: FAIL — the worst collapse is 199, far above 5.

- [ ] **Step 3: Write the implementation**

Key each workflow row on `${id}@L${sourceLine}` when the id is a placeholder OR when the same id appears at more than one source line. A real, unique id keeps its bare form so existing references stay readable.

The total-entries test is the guard that matters: re-keying must not drop anything, and the sum of `collapsedFrom` across all rows must still be exactly 725.

Keep `collapsedFrom` and `idIsPlaceholder`, and keep the on-page disclosure — it now reports smaller numbers rather than disappearing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm build:registries && pnpm vitest run tests/unit/registry-build.test.ts`
Expected: all five new tests PASS, and Task 6's nine still pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-registries.mjs registries/generated tests/unit/registry-build.test.ts
git commit -m "feat(slice-02c): composite keys so distinct workflows stop collapsing"
```

---

## Task 8: The runtime-validated registry loader

**Files:**
- Create: `src/coverage/registry-loader.ts`
- Test: `tests/unit/registry-loader.test.ts`

**Interfaces:**
- Consumes: `loadRegistry` from `@/registry/load`; the fourteen generated files
- Produces:
  - `const GeneratedRegistrySchema` — strict Zod
  - `function loadGeneratedRegistry(slug): GeneratedRegistry`
  - `interface GeneratedRegistry { slug; countedThing; reconciledCount: number | null; rawCount: number; dedupRule: string | null; sourceFixesNoTotal: boolean; rows: readonly RegistryRow[] }`

- [ ] **Step 1: Write the failing test**

```ts
describe('generated registry loading', () => {
  it('loads every one of the fourteen', () => {
    for (const slug of SLUGS) expect(loadGeneratedRegistry(slug).rows.length).toBeGreaterThan(0)
  })

  it('REJECTS an unknown field rather than ignoring it', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'modules', countedThing: 'canonical modules', reconciledCount: 81,
        rawCount: 92, dedupRule: 'x', sourceFixesNoTotal: false, rows: [],
        unexpected: 'from a newer schema',
      }, 'generated registry'),
    ).toThrow(/unexpected|unrecognized/i)
  })

  it('rejects a row with no source line', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'modules', countedThing: 'canonical modules', reconciledCount: 81,
        rawCount: 92, dedupRule: 'x', sourceFixesNoTotal: false,
        rows: [{ id: 'MOD-SA-01', label: 'Overview' }],
      }, 'generated registry'),
    ).toThrow()
  })

  it('rejects a reconciled count on a registry declaring the source fixes no total', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'workflows', countedThing: 'extracted records', reconciledCount: 432,
        rawCount: 725, dedupRule: 'x', sourceFixesNoTotal: true, rows: [],
      }, 'generated registry'),
    ).toThrow(/no total|reconciledCount/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/registry-loader.test.ts`
Expected: FAIL — cannot resolve `@/coverage/registry-loader`.

- [ ] **Step 3: Write the implementation**

A `.strict()` Zod schema with a refinement: `sourceFixesNoTotal === true` requires `reconciledCount === null`. That refinement is the type system enforcing the count-scope rule — without it, someone can ship a number for a total the source never states, which is the single failure this slice's spec warns about most.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/registry-loader.test.ts`
Expected: all four tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/coverage/registry-loader.ts tests/unit/registry-loader.test.ts
git commit -m "feat(slice-02c): runtime-validated registry loading that refuses a total the source never states"
```

---

## Task 9: Render real rows in all fourteen registry indexes

**Files:**
- Modify: `app/coverage/[registry]/page.tsx`
- Test: `tests/component/registry-index.test.tsx`, `tests/e2e/coverage.spec.ts` (extend)

**Interfaces:**
- Consumes: `loadGeneratedRegistry`, `REGISTRY_DESCRIPTORS`, the primitives barrel, `ScreenStateBoundary`

- [ ] **Step 1: Write the failing test**

```tsx
describe('registry index rows', () => {
  it.each(SLUGS)('%s renders real rows with source lines', (slug) => {
    render(<RegistryIndex slug={slug} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('states what the number counts, next to the number', () => {
    render(<RegistryIndex slug="modules" />)
    expect(screen.getByText(/canonical modules/i)).toBeDefined()
  })

  it('shows both figures where raw and reconciled differ', () => {
    const { container } = render(<RegistryIndex slug="modules" />)
    const t = container.textContent ?? ''
    expect(t).toContain('81')
    expect(t).toContain('92')
    expect(t.toLowerCase()).toMatch(/alias|duplicate|dedup/)
  })

  it('says plainly where the source fixes no total', () => {
    const { container } = render(<RegistryIndex slug="workflows" />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/no single .*total|fixes no/)
  })

  it('never presents an extracted identifier count as a canonical total', () => {
    for (const slug of ['functions', 'features', 'notifications']) {
      const { container, unmount } = render(<RegistryIndex slug={slug} />)
      expect((container.textContent ?? '').toLowerCase()).toMatch(/extracted|identifier/)
      unmount()
    }
  })

  it('never claims production capability', () => {
    for (const slug of SLUGS) {
      const { container, unmount } = render(<RegistryIndex slug={slug} />)
      const t = (container.textContent ?? '').toLowerCase()
      expect(t, slug).not.toContain('production-ready')
      expect(t, slug).not.toMatch(/\bimplemented\b/)
      unmount()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/registry-index.test.tsx`
Expected: FAIL — every index renders zero rows.

- [ ] **Step 3: Write the implementation**

The generic index reads its registry through `loadGeneratedRegistry`, renders a `Table` of rows with id, label and source line, and renders the count header with `countedThing` beside the figure. Where `rawCount` and `reconciledCount` differ it shows both and the dedup rule. Where `sourceFixesNoTotal` it says so instead of showing a total.

Use `ScreenStateBoundary` for the states, so an empty registry renders `STATE-01` naming what would appear rather than a blank panel.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run --project component tests/component/registry-index.test.tsx && pnpm build && pnpm test:e2e`
Expected: all six groups PASS across fourteen slugs; the e2e route suite still passes.

- [ ] **Step 5: Commit**

```bash
git add app/coverage tests/component/registry-index.test.tsx tests/e2e/coverage.spec.ts
git commit -m "feat(slice-02c): all fourteen registry indexes render real rows with honest counts"
```

---

## Task 10: The eight dashboard count classes

**Files:**
- Modify: `src/coverage/descriptors.ts`, `app/coverage/page.tsx`
- Test: `tests/unit/coverage.test.ts`, `tests/component/coverage.test.tsx` (extend)

**Interfaces:**
- Produces:
  - `type SourceClass = 'source-defined' | 'derived' | 'recommended' | 'illustrative' | 'unresolved'`
  - `type BuildClass = 'implemented' | 'not-applicable' | 'decision-blocked'`
  - `const SOURCE_CLASSES`, `const BUILD_CLASSES` — `as const satisfies`
  - `function countByClass(rows): { source: Record<SourceClass, number>; build: Record<BuildClass, number> }`

- [ ] **Step 1: Write the failing test**

```ts
describe('the eight count classes', () => {
  it('splits five source classes from three build classes', () => {
    expect(SOURCE_CLASSES).toHaveLength(5)
    expect(BUILD_CLASSES).toHaveLength(3)
  })

  it('keeps them orthogonal — an item can be source-defined AND not built', () => {
    const c = countByClass([{ sourceClass: 'source-defined', buildClass: 'not-applicable' }])
    expect(c.source['source-defined']).toBe(1)
    expect(c.build['not-applicable']).toBe(1)
  })

  it('returns every key even at zero', () => {
    const c = countByClass([])
    expect(Object.keys(c.source).sort()).toEqual([...SOURCE_CLASSES].sort())
    expect(Object.keys(c.build).sort()).toEqual([...BUILD_CLASSES].sort())
    for (const v of Object.values(c.source)) expect(v).toBe(0)
  })

  it('does not collapse the build class into the status vocabulary', () => {
    expect([...BUILD_CLASSES]).not.toEqual([...COVERAGE_STATUSES])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/coverage.test.ts`
Expected: FAIL — `SOURCE_CLASSES`, `BUILD_CLASSES` and `countByClass` are not exported.

- [ ] **Step 3: Write the implementation**

The two vocabularies are deliberately separate. The five source classes say what the frozen source claims about an item; the three build classes say what this build did with it. An item is routinely source-defined and not-applicable at once, and collapsing them would destroy the distinction between "the source never specified this" and "we have not built it" — the distinction a client most needs.

`implemented` appears in `BUILD_CLASSES` because it is a build fact about a storyboard demonstration, not a production claim. The dashboard must render it as "demonstrated in storyboard" in user-facing copy, never as a bare "implemented" that could read as production capability.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:unit && pnpm vitest run --project component tests/component/coverage.test.tsx`
Expected: all four new tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/coverage/descriptors.ts app/coverage/page.tsx tests/unit/coverage.test.ts tests/component/coverage.test.tsx
git commit -m "feat(slice-02c): eight count classes, source and build kept orthogonal"
```

---

## Task 11: Workflow Index filters

**Files:**
- Modify: `app/workflows/page.tsx`
- Test: `tests/component/workflow-index.test.tsx`

**Interfaces:**
- Consumes: `loadGeneratedRegistry('workflows')`, `Select`, `Table`, `EmptyState`

- [ ] **Step 1: Write the failing test**

```tsx
describe('workflow index filters', () => {
  it('filters by surface', async () => {
    render(<WorkflowIndex />)
    const before = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    expect(screen.getAllByRole('row').length).toBeLessThan(before)
  })

  it('filters compose — surface AND status together narrow further', async () => {
    render(<WorkflowIndex />)
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    const afterOne = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'not-represented')
    expect(screen.getAllByRole('row').length).toBeLessThanOrEqual(afterOne)
  })

  // Empty and no-match say different things.
  it('a filter matching nothing renders no-match, NOT the empty state', async () => {
    render(<WorkflowIndex />)
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-SA')
    await userEvent.selectOptions(screen.getByLabelText(/actor/i), '__none__')
    expect(screen.getByText(/no workflows match/i)).toBeDefined()
    expect(screen.queryByText(/no workflows have been registered/i)).toBeNull()
  })

  it('clearing filters restores every row', async () => {
    render(<WorkflowIndex />)
    const before = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(screen.getAllByRole('row').length).toBe(before)
  })

  it('every filter control has an accessible name', () => {
    render(<WorkflowIndex />)
    for (const label of [/surface/i, /actor/i, /status/i, /collapsed/i]) {
      expect(screen.getByLabelText(label)).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/workflow-index.test.tsx`
Expected: FAIL — no filter controls exist.

- [ ] **Step 3: Write the implementation**

Four `Select` filters — surface, actor, status, collapsed-or-not — plus a clear button. Filter state lives in component state and is presentation-only: it never dispatches a command and never touches domain truth.

The no-match state must differ from the empty state. A table filtered to zero says something different from a registry with nothing in it, and conflating them is the defect the `Table` primitive already guards against.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run --project component tests/component/workflow-index.test.tsx`
Expected: all five tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/workflows tests/component/workflow-index.test.tsx
git commit -m "feat(slice-02c): workflow index filters, composing, with a distinct no-match state"
```

---

## Task 12: The `/review/` page title

**Files:**
- Create: `app/review/layout.tsx`
- Test: `tests/e2e/review.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test'

test('the review route has its own page title', async ({ page }) => {
  await page.goto('/review/')
  await expect(page).toHaveTitle(/client review/i)
})

test('the review route still has one primary heading and a main landmark', async ({ page }) => {
  await page.goto('/review/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('main')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm build && pnpm test:e2e`
Expected: FAIL — the title is the layout default, because `app/review/page.tsx` is a client component and cannot export `metadata`.

- [ ] **Step 3: Write the implementation**

```tsx
// app/review/layout.tsx
import type { Metadata } from 'next'

// A client component cannot export `metadata`, so the title lives on a server
// layout wrapping it. The page itself stays a client component because it holds
// reviewer input state.
export const metadata: Metadata = {
  title: 'Client review — AVIIXA Interactive Storyboard',
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm build && pnpm test:e2e`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/review/layout.tsx tests/e2e/review.spec.ts
git commit -m "feat(slice-02c): review route carries its own page title"
```

---

## Task 13: Slice gates

**Files:**
- Create: `tests/coverage/slice-2c-gates.test.ts`
- Test: itself

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { stripComments } from './strip-comments'

const SLUGS = readdirSync('registries/generated')
  .filter((f) => f.endsWith('.json') && f !== 'source-reconciliation.json')

describe('slice 2c gates', () => {
  it('no generated registry declares a total the source does not fix', () => {
    const offenders = SLUGS.filter((f) => {
      const r = JSON.parse(readFileSync(`registries/generated/${f}`, 'utf8'))
      return r.sourceFixesNoTotal === true && r.reconciledCount !== null
    })
    expect(offenders).toEqual([])
  })

  it('no index page hardcodes a count — every figure comes from a registry', () => {
    const s = stripComments(readFileSync('app/coverage/[registry]/page.tsx', 'utf8'))
    expect(s).not.toMatch(/\b(81|92|99|432|725|990|613)\b/)
  })

  it('MOD-SA-20 appears in no generated registry', () => {
    for (const f of SLUGS) {
      expect(readFileSync(`registries/generated/${f}`, 'utf8'), f).not.toContain('MOD-SA-20')
    }
  })

  it('every status token passes AA on its composited background', () => {
    // Guarded in full by tests/unit/token-contrast.test.ts; this gate fails the
    // release if that file is ever deleted.
    expect(readFileSync('tests/unit/token-contrast.test.ts', 'utf8')).toContain('compositeOver')
  })
})
```

- [ ] **Step 2: Prove each gate can fail**

Plant each violation, confirm failure, revert:
- set `reconciledCount: 432` on `workflows.json` with `sourceFixesNoTotal: true` → gate 1 fails;
- add `const total = 81` to the index page → gate 2 fails;
- add `MOD-SA-20` to `modules.json` → gate 3 fails;
- rename `compositeOver` in the contrast test → gate 4 fails.

Record every probe result.

- [ ] **Step 3: Run the full chain**

Run: `rm -rf out .next && pnpm verify`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/coverage/slice-2c-gates.test.ts
git commit -m "test(slice-02c): gates for count-scope honesty and token contrast"
```

---

## Slice 2c exit criteria

- [ ] `pnpm verify` exits 0 on a clean rebuild.
- [ ] Every status token passes AA on its composited pill background with ≥0.25 headroom.
- [ ] `ReviewRecord` carries all twenty-one fields; supersession links forward and refuses self-reference.
- [ ] The package carries all eleven elements, each inside the hash scope; the checksum still excludes its own field.
- [ ] Import reports duplicates and conflicts, and merge and replace are explicit reviewer choices that never drop an existing record.
- [ ] All fourteen registry indexes render real rows with source line locators.
- [ ] The modules index ships 81, not 92, with the dedup rule stated.
- [ ] No registry declares a total where the source fixes none; `workflows.expectedCount` is `null`.
- [ ] The worst workflow collapse is ≤5 entries, and the total across all rows is still exactly 725.
- [ ] Filters compose, and no-match differs from empty.
- [ ] Each of the four gates proven able to fail.
- [ ] Independent review passes with every Critical and Important finding resolved.

## Self-review record

**Spec coverage.** §2.1 → Task 2. §2.2 → Task 3. §2.3 → Task 4. §2.4 → Task 10.
§2.5 → Task 5. §2.6 → Task 11. §2.7 → Task 7. §2.8 → Task 1. §2.9 → Task 12.
§2.10 → Tasks 6, 8, 9. §4 testing → every task plus Task 13.

**Placeholder scan.** No TBD, TODO, "handle edge cases", or "similar to Task N".
Every code step carries runnable code, and the token value in Task 1 is a measured
figure (5.226:1 on the composited tint) rather than an instruction to darken.

**Type consistency.** `GeneratedRegistry` from Task 8 is consumed by Tasks 9 and
10. The generator's output shape in Task 6 is what Task 8's schema validates and
Task 7 extends. `SOURCE_CLASSES`/`BUILD_CLASSES` from Task 10 are distinct from
`COVERAGE_STATUSES`, and a test asserts they are not the same list.
`contrastRatio`/`compositeOver` from Task 1 are reused by Task 13's gate. The
review-record field is `functionId`, never `function`, at every reference.

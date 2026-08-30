# Slice 2b — Scenario Engine and Review Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single mutation entry point, the client store, scenario controls with non-destructive branching, the client-review shell, review package export and import, evidence projections, and the browsable coverage layer.

**Architecture:** `ScenarioCommandGateway` is the only path to a domain mutation — components dispatch through it and never call `reduce` or `commitTransition`. Review runs entirely beside the product pipeline in its own stores, and a gate proves a review action cannot produce a product event. Coverage indexes read the same runtime-validated registries the reconciliation reads, so an on-screen count and a reported count cannot diverge.

**Tech Stack:** Next.js 16.3.1 (`output: 'export'`), React 19.2.8, TypeScript 5.9.3 strict, Tailwind 4.3.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.62.1, `fake-indexeddb` 6.2.5, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-16-slice-02b-review-shell-design.md` (sha256 `355ed35c4774ff72c05293f05150b338f540000b3c9e3f6bdc8f638cd3813743`)

**Branch:** `slice-02b-review-shell`, based on `main` at `9f50841`.

## Global Constraints

Every task's requirements implicitly include this section.

- **No runtime backend.** No API routes, Route Handlers, Server Actions, middleware, databases, secrets, or external telemetry. The static-export build fails if one appears — that is the boundary enforcing itself.
- **No external-origin network request at runtime.** Only same-origin `GET`/`HEAD` reads of emitted static-export files.
- **TypeScript 5.9.3** with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ON. **Never weaken them.**
- **Determinism.** No ambient `Date.now()`, `new Date()`, `Math.random()`, locale-dependent ordering, or uncontrolled timers in `src/`. Time comes only from the injected `Clock`.
- **A client-review action creates a `ReviewEvent` and nothing else.** Never a product `DomainEvent`, `AuditEvent`, notification, command, schedule, or business-state transition. Gate-enforced.
- **Labels: "Accept for client review", never "Approve".** Nothing in review mode may read like Workflow approval, Job approval, Quality release, or production authorisation.
- **Only `ScenarioCommandGateway` may mutate.** No component imports `reduce` or `commitTransition`. Gate-enforced with comment-stripped matching.
- **Restore never rewrites history.** A checkpoint restore creates a new `ScenarioRunId` with parent lineage; the prior run's snapshot and audit ledger are untouched.
- **Memory has no export path at V1.** The exporter must be structurally incapable of including memory data, not merely omit it.
- **The package manifest hash excludes its own checksum field** and is labelled corruption detection — never cryptographic authenticity, signer identity, or non-repudiation.
- **Coverage status values are honest:** `demonstrated in storyboard`, `decision blocked`, `not applicable`, `not represented`. Never a green check implying a production control exists.
- **WCAG 2.2 AA** on every route and state. Every gate proven able to fail by planting a violation.
- **Production-grade engineering, not production claims.** Typed failures over thrown exceptions, every failure path tested, no silent catch, no swallowed rejection. And no implication of a real backend, scheduler, integration or audit guarantee.

## A note on generic screens versus hand-authored ones

The client chose **hand-authored per module** for the 81 product module screens in slices 3–13. That decision governs product surfaces.

The registry index screens in Tasks 12–14 are **reviewer tooling, not product modules**. They are genuinely the same screen over different data — a list of registry entries with counts, status and a drill-down. Hand-authoring fourteen near-identical index screens would be duplication with no reader benefit, and the substance gate exists to stop label-swapped *product* screens, not to forbid a correctly generic tool. They are therefore one generic index driven by a registry descriptor. Product module screens remain hand-authored.

---

## File Structure

```
src/
  domain/hash.ts             MODIFY  split the array guard so it names the right cause
  scenario/
    gateway.ts               CREATE  ScenarioCommandGateway — the only mutation entry point
    store.ts                 CREATE  ScenarioStore + role-aware selectors
    controls.ts              CREATE  step, jump, reset, connectivity, clock
    lineage.ts               CREATE  checkpoint branching with parent lineage
    evidence.ts              CREATE  read-only impact and interaction projections
  review/
    records.ts               CREATE  ReviewRecord / ReviewEvent types + constructors
    store.ts                 CREATE  ReviewStore over its own object stores
    package.ts               CREATE  export/import, manifest hashing, validation
  persistence/schema.ts      MODIFY  DB_VERSION 2, add reviewRecords + reviewEvents
  coverage/
    descriptors.ts           CREATE  the fourteen registry descriptors
    status.ts                CREATE  honest status vocabulary + counts
app/
  review/page.tsx            CREATE  review shell
  coverage/page.tsx          CREATE  coverage dashboard
  coverage/[registry]/page.tsx CREATE generic registry index (finite generateStaticParams)
  workflows/page.tsx         CREATE  Workflow Index
tests/
  unit/        gateway, store, controls, lineage, review records, package, coverage
  component/   review shell, coverage dashboard, registry index, workflow index
  coverage/    separation gate, gateway-only gate, memory-no-export gate
  e2e/         review round-trip, coverage navigation
```

---

## Task 1: The parked residual — name the right cause

**Files:**
- Modify: `src/domain/hash.ts`
- Test: `tests/unit/hash.test.ts` (extend)

**Interfaces:**
- Consumes: nothing
- Produces: unchanged public API; only the thrown message changes

- [ ] **Step 1: Write the failing test**

```ts
describe('array guard names the right cause', () => {
  it('reports a non-index property as a non-index property, not as sparseness', () => {
    const a: number[] & { extra?: string } = [1, 2]
    a.extra = 'smuggled'
    expect(() => canonicalSerialize(a)).toThrow(/non-index own property "extra"/)
  })

  it('still reports a genuine hole as sparse', () => {
    expect(() => canonicalSerialize(new Array(1))).toThrow(/sparse/i)
    expect(() => canonicalSerialize([1, , 3])).toThrow(/sparse/i)
  })

  it('reports the non-index cause even when a hole is also present', () => {
    const a: number[] & { tag?: string } = [1, , 3]
    a.tag = 'x'
    // Both are wrong, but the extra property is the more actionable diagnosis.
    expect(() => canonicalSerialize(a)).toThrow(/non-index own property "tag"/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hash.test.ts`
Expected: FAIL — the first test receives "Sparse array in state", because `Object.keys` returns three keys against a length of two and the hole check fires first.

- [ ] **Step 3: Write the implementation**

In `src/domain/hash.ts`, replace the array branch's guard ordering:

```ts
  if (Array.isArray(value)) {
    const keys = Object.keys(value)
    // Check non-index keys FIRST. An extra property inflates keys.length, so a
    // length comparison would otherwise report "sparse" for an array that has no
    // holes at all — sending the reader hunting something that is not there.
    const indexKeys: string[] = []
    for (const k of keys) {
      if (/^(0|[1-9]\d*)$/.test(k)) indexKeys.push(k)
      else throw new Error(
        `Array carries a non-index own property "${k}": domain state has no use for one`,
      )
    }
    if (indexKeys.length !== value.length) {
      throw new Error('Sparse array in state (a hole is not a value)')
    }
    return `[${value.map(canonicalSerialize).join(',')}]`
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:unit`
Expected: the three new tests PASS and all pre-existing hash tests still pass — in particular the ones asserting symbol keys and non-enumerable properties are still ACCEPTED, since `Object.keys` returns neither.

- [ ] **Step 5: Commit**

```bash
git add src/domain/hash.ts tests/unit/hash.test.ts
git commit -m "fix(slice-02b): array guard names the non-index cause instead of sparseness"
```

---

## Task 2: Review stores and the schema migration

**Files:**
- Modify: `src/persistence/schema.ts`
- Test: `tests/unit/migration.test.ts`

**Interfaces:**
- Consumes: `DB_NAME`, `openDatabase` from `@/persistence/schema`
- Produces: `DB_VERSION = 2`; `STORES` gains `'reviewRecords'` and `'reviewEvents'`; `PRODUCT_STORES` and `REVIEW_STORES` exported as disjoint frozen lists

- [ ] **Step 1: Write the failing test**

`tests/unit/migration.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase, STORES, PRODUCT_STORES, REVIEW_STORES, DB_VERSION } from '@/persistence/schema'

describe('review stores and migration', () => {
  it('is at version 2', () => {
    expect(DB_VERSION).toBe(2)
  })

  it('separates product stores from review stores with no overlap', () => {
    const overlap = PRODUCT_STORES.filter((s) => (REVIEW_STORES as readonly string[]).includes(s))
    expect(overlap).toEqual([])
    expect([...PRODUCT_STORES, ...REVIEW_STORES].sort()).toEqual([...STORES].sort())
  })

  it('creates both review stores on a fresh database', async () => {
    const db = await openDatabase(new IDBFactory())
    for (const s of REVIEW_STORES) expect(Array.from(db.objectStoreNames)).toContain(s)
    db.close()
  })

  it('upgrades a version-1 database without losing its product data', async () => {
    const factory = new IDBFactory()
    // Build a v1 database by hand, with one audit row in it.
    await new Promise<void>((res, rej) => {
      const req = factory.open('aviixa-storyboard', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const s of ['snapshots', 'audit', 'events', 'commands', 'notifications', 'schedules', 'idempotency', 'meta']) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { autoIncrement: true })
        }
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('audit', 'readwrite')
        tx.objectStore('audit').put({ id: 'A-PRE', kind: 'PRE_MIGRATION' })
        tx.oncomplete = () => { db.close(); res() }
        tx.onerror = () => rej(tx.error)
      }
      req.onerror = () => rej(req.error)
    })

    const db = await openDatabase(factory)
    expect(db.version).toBe(2)
    for (const s of REVIEW_STORES) expect(Array.from(db.objectStoreNames)).toContain(s)
    const rows = await new Promise<unknown[]>((res) => {
      const r = db.transaction('audit', 'readonly').objectStore('audit').getAll()
      r.onsuccess = () => res(r.result)
    })
    expect(rows).toHaveLength(1)
    db.close()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/migration.test.ts`
Expected: FAIL — `DB_VERSION` is 1 and `PRODUCT_STORES`/`REVIEW_STORES` do not exist.

- [ ] **Step 3: Write the implementation**

In `src/persistence/schema.ts`:

```ts
export const DB_VERSION = 2

/** Product truth. A review action may never write to any of these. */
export const PRODUCT_STORES = [
  'snapshots', 'audit', 'events', 'commands',
  'notifications', 'schedules', 'idempotency', 'meta',
] as const

/**
 * Client-review metadata. Deliberately separate stores, not a flag on a product
 * record: the separation is the invariant, and a shared store would make it a
 * convention that the next implementer could quietly break.
 */
export const REVIEW_STORES = ['reviewRecords', 'reviewEvents'] as const

export const STORES = [...PRODUCT_STORES, ...REVIEW_STORES] as const
```

`onupgradeneeded` creates any store in `STORES` that is absent, so a v1 database
gains the two review stores and keeps every existing row.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/migration.test.ts`
Expected: all four tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/schema.ts tests/unit/migration.test.ts
git commit -m "feat(slice-02b): review stores, disjoint from product stores, with a v1 to v2 migration"
```

---

## Task 3: ScenarioCommandGateway — the only mutation entry point

**Files:**
- Create: `src/scenario/gateway.ts`
- Test: `tests/unit/gateway.test.ts`

**Interfaces:**
- Consumes: `reduce` from `@/kernel/reduce`; `commitTransition` from `@/persistence/coordinator`; `permittedUnder` from `@/persistence/capability`; `ScenarioCommand`, `TransitionContext`, `ProposedTransition`, `ScenarioDomainState`
- Produces:
  - `interface GatewayDeps { db: IDBDatabase; storageState: StorageBootstrapState }`
  - `type GatewayResult = { ok: true; committed: CommittedTransition } | { ok: false; reason: string; decision: PermissionDecision | null; blockedBy: 'capability' | 'policy' | 'validation' | 'persistence' }`
  - `async function dispatch(state, command, ctx, deps): Promise<GatewayResult>`

- [ ] **Step 1: Write the failing test**

`tests/unit/gateway.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase } from '@/persistence/schema'
import { dispatch } from '@/scenario/gateway'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId, correlationId } from '@/domain/ids'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const RUN = scenarioRunId('RUN-1')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
let db: IDBDatabase
beforeEach(async () => { db = await openDatabase(new IDBFactory()) })

const state = () => withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
  ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE' as const,
  objects: { 'lot:LOT-1': { held: true } },
}))
const ctx = (role: 'QUALITY_MANAGER' | 'SUPERVISOR') => ({
  clock: fixedClock(CANONICAL_EPOCH_MS),
  identity: { signedIn: true, role, tenant: BRIGHT, siteScope: ['S'], areaScope: ['A'],
    qualifications: [], deviceId: null, stepUpActive: false, accessSessionId: null },
  online: true, deviceTrusted: true, actorOfRecord: 'P',
  correlationId: correlationId('C'), failureInjection: null,
})
const RELEASE = { type: 'CC_RELEASE_LOT_HOLD', tenant: BRIGHT, lotId: 'LOT-1', note: 'done' } as const

describe('scenario command gateway', () => {
  it('commits an authorised command and reports the committed transition', async () => {
    const r = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    expect(r.ok).toBe(true)
  })

  it('refuses an unauthorised command with the policy decision attached', async () => {
    const r = await dispatch(state(), RELEASE, ctx('SUPERVISOR'), { db, storageState: 'ready-durable' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.blockedBy).toBe('policy')
      expect(r.decision?.reasonCode).toBe('ROLE_NOT_GRANTED')
    }
  })

  // ephemeral-preview blocks every durable action class.
  it('refuses a durable command when storage is not durable, before touching the kernel', async () => {
    const r = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ephemeral-preview' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.blockedBy).toBe('capability')
  })

  it('writes nothing when capability blocks the command', async () => {
    await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ephemeral-preview' })
    const rows = await new Promise<unknown[]>((res) => {
      const r = db.transaction('audit', 'readonly').objectStore('audit').getAll()
      r.onsuccess = () => res(r.result)
    })
    expect(rows).toEqual([])
  })

  it('never throws — a persistence failure returns a typed result', async () => {
    db.close() // force a persistence failure
    let threw = false
    let ok: unknown = null
    try {
      const r = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
      ok = r.ok
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(ok).toBe(false)
  })

  it('gives every refusal a plain-language reason, never a bare identifier', async () => {
    const r = await dispatch(state(), RELEASE, ctx('SUPERVISOR'), { db, storageState: 'ready-durable' })
    if (!r.ok) {
      expect(r.reason.length).toBeGreaterThan(20)
      expect(r.reason).not.toMatch(/^[A-Z_]+$/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gateway.test.ts`
Expected: FAIL — cannot resolve `@/scenario/gateway`.

- [ ] **Step 3: Write the implementation**

`dispatch` runs three stages in this order and stops at the first refusal:

1. **Capability** — map the command to its `ActionClass` and consult
   `permittedUnder(storageState, actionClass)`. A durable command under a
   non-durable storage state is refused here, before the kernel runs, so no work
   is done that cannot be persisted.
2. **Kernel** — `await reduce(state, command, ctx)`. A non-accepted result is
   returned as `blockedBy: 'policy'` (or `'validation'` for `validationFailed`)
   with the decision attached.
3. **Persistence** — `await commitTransition(db, proposed)`. A failure is
   returned as `blockedBy: 'persistence'`.

It never throws: every stage's failure is a typed result.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gateway.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenario/gateway.ts tests/unit/gateway.test.ts
git commit -m "feat(slice-02b): scenario command gateway as the only mutation entry point"
```

---

## Task 4: ScenarioStore and role-aware selectors

**Files:**
- Create: `src/scenario/store.ts`
- Test: `tests/unit/store.test.ts`

**Interfaces:**
- Consumes: `dispatch` from `@/scenario/gateway`; `ScenarioDomainState`, `IdentitySimulationState`, `PresentationState`
- Produces:
  - `function createScenarioStore(initial: ScenarioDomainState): ScenarioStore`
  - `interface ScenarioStore { getState(); subscribe(fn): () => void; dispatchCommand(command, ctx, deps); getIdentity(); setIdentity(i); getPresentation(); setPresentation(p); }`
  - `function selectVisibleTenants(state, identity): readonly TenantId[]`
  - `function selectTenantObjects(state, identity, tenant): Readonly<Record<string, unknown>> | null`

- [ ] **Step 1: Write the failing test**

`tests/unit/store.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createScenarioStore, selectVisibleTenants, selectTenantObjects } from '@/scenario/store'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'

const RUN = scenarioRunId('RUN-1')
const A = tenantId('TEN-A'); const B = tenantId('TEN-B')
const two = () => {
  let s = withTenant(emptyDomainState(RUN), A, (p) => ({ ...p, displayName: 'A', lifecycleState: 'ACTIVE' as const, objects: { x: 1 } }))
  return withTenant(s, B, (p) => ({ ...p, displayName: 'B', lifecycleState: 'ACTIVE' as const, objects: { secret: 'B-ONLY' } }))
}
const ident = (tenant: typeof A | null, role: IdentitySimulationState['role']): IdentitySimulationState => ({
  signedIn: true, role, tenant, siteScope: [], areaScope: [], qualifications: [],
  deviceId: null, stepUpActive: false, accessSessionId: null,
})

describe('scenario store', () => {
  it('notifies subscribers when state changes', () => {
    const store = createScenarioStore(two())
    let calls = 0
    store.subscribe(() => { calls += 1 })
    store.setPresentation({ ...store.getPresentation(), locale: 'es' })
    expect(calls).toBeGreaterThan(0)
  })

  it('returns an unsubscribe function that actually unsubscribes', () => {
    const store = createScenarioStore(two())
    let calls = 0
    const off = store.subscribe(() => { calls += 1 })
    off()
    store.setPresentation({ ...store.getPresentation(), locale: 'es' })
    expect(calls).toBe(0)
  })

  // Tenant isolation at the selector layer, not only in the evaluator.
  it('shows a tenant role only its own tenant', () => {
    const s = two()
    expect(selectVisibleTenants(s, ident(A, 'QUALITY_MANAGER'))).toEqual([A])
  })

  it('returns null rather than another tenant’s objects', () => {
    const s = two()
    expect(selectTenantObjects(s, ident(A, 'QUALITY_MANAGER'), B)).toBeNull()
  })

  it('returns the actor’s own tenant objects', () => {
    const s = two()
    expect(selectTenantObjects(s, ident(A, 'QUALITY_MANAGER'), A)).toEqual({ x: 1 })
  })

  // A platform role reaches tenant data only through a named access session.
  it('shows a platform role no tenant without an access session', () => {
    const s = two()
    expect(selectVisibleTenants(s, ident(null, 'ADMIN'))).toEqual([])
  })

  it('clears presentation state on identity change but leaves domain truth intact', () => {
    const store = createScenarioStore(two())
    store.setPresentation({ ...store.getPresentation(), filters: { q: 'x' }, selection: [] })
    const before = store.getState()
    store.setIdentity(ident(B, 'SUPERVISOR'))
    expect(store.getPresentation().filters).toEqual({})
    expect(store.getState()).toBe(before)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/store.test.ts`
Expected: FAIL — cannot resolve `@/scenario/store`.

- [ ] **Step 3: Write the implementation**

A small subscription store holding the three domains separately. `setIdentity`
clears `PresentationState` (filters, selection, expanded panels) and leaves
`ScenarioDomainState` untouched by identity reference. Selectors take the identity
explicitly rather than reading ambient state, so they are pure and testable.

`selectVisibleTenants` returns `[identity.tenant]` for a tenant-domain role with a
tenant, and `[]` for a platform-domain role with no access session.
`selectTenantObjects` returns `null` when the requested tenant is not the actor's.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/store.test.ts`
Expected: all seven tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenario/store.ts tests/unit/store.test.ts
git commit -m "feat(slice-02b): scenario store with role-aware isolating selectors"
```

---

## Task 5: Scenario controls

**Files:**
- Create: `src/scenario/controls.ts`
- Test: `tests/unit/controls.test.ts`

**Interfaces:**
- Consumes: `Clock` from `@/domain/clock`; `PresentationState`
- Produces:
  - `type ConnectivityMode = 'online' | 'slow' | 'flapping' | 'offline' | 'dependency-down' | 'reconnecting'`
  - `interface ScenarioControls { step(n): void; jumpTo(id): void; play(); pause(); replay(); resetPresentation(); setConnectivity(m); advanceClock(ms); }`
  - `function createControls(deps): ScenarioControls`
  - `const CONNECTIVITY_MODES: readonly ConnectivityMode[]` (length 6)

- [ ] **Step 1: Write the failing test**

`tests/unit/controls.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createControls, CONNECTIVITY_MODES } from '@/scenario/controls'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

function harness() {
  const clock = fixedClock(CANONICAL_EPOCH_MS)
  let presentation = { surface: null, locale: 'en' as const, density: 'comfortable' as const,
    filters: { q: 'x' }, selection: [], storyStepId: 'STEP-03' }
  const steps = ['STEP-01', 'STEP-02', 'STEP-03', 'STEP-04']
  const controls = createControls({
    clock, steps,
    getPresentation: () => presentation,
    setPresentation: (p) => { presentation = p },
  })
  return { controls, clock, get presentation() { return presentation } }
}

describe('scenario controls', () => {
  it('steps forward and back through the story', () => {
    const h = harness()
    h.controls.step(1)
    expect(h.presentation.storyStepId).toBe('STEP-04')
    h.controls.step(-2)
    expect(h.presentation.storyStepId).toBe('STEP-02')
  })

  it('clamps at both ends rather than wrapping or going out of range', () => {
    const h = harness()
    h.controls.step(99)
    expect(h.presentation.storyStepId).toBe('STEP-04')
    h.controls.step(-99)
    expect(h.presentation.storyStepId).toBe('STEP-01')
  })

  it('jumps to a named step', () => {
    const h = harness()
    h.controls.jumpTo('STEP-02')
    expect(h.presentation.storyStepId).toBe('STEP-02')
  })

  it('throws on a jump to an unknown step rather than silently doing nothing', () => {
    const h = harness()
    expect(() => h.controls.jumpTo('STEP-99')).toThrow(/STEP-99/)
  })

  it('resets presentation only — filters clear, story position clears', () => {
    const h = harness()
    h.controls.resetPresentation()
    expect(h.presentation.filters).toEqual({})
  })

  it('offers exactly the six connectivity modes', () => {
    expect(CONNECTIVITY_MODES).toHaveLength(6)
    expect([...CONNECTIVITY_MODES]).toContain('flapping')
  })

  it('advances only the injected clock, never real time', () => {
    const h = harness()
    const before = h.clock.now()
    h.controls.advanceClock(60_000)
    expect(h.clock.now()).toBe(before + 60_000)
  })

  it('refuses to move the clock backwards', () => {
    const h = harness()
    expect(() => h.controls.advanceClock(-1)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/controls.test.ts`
Expected: FAIL — cannot resolve `@/scenario/controls`.

- [ ] **Step 3: Write the implementation**

`step(n)` clamps into range rather than wrapping — wrapping from the last step to
the first would misrepresent the story as circular. `jumpTo` throws on an unknown
id naming the id, because a silent no-op leaves a reviewer believing they moved.
`resetPresentation` clears view state only. `advanceClock` delegates to the
injected `Clock`, which already refuses a negative delta.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/controls.test.ts`
Expected: all eight tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenario/controls.ts tests/unit/controls.test.ts
git commit -m "feat(slice-02b): scenario controls with clamping, explicit jumps and an injected clock"
```

---

## Task 6: Checkpoint branching with parent lineage

**Files:**
- Create: `src/scenario/lineage.ts`
- Test: `tests/unit/lineage.test.ts`

**Interfaces:**
- Consumes: `ScenarioRunId`, `scenarioRunId`, `ScenarioDomainState`, `hashState`
- Produces:
  - `interface RunLineage { runId; parentRunId: ScenarioRunId | null; branchedFromSequence: number | null; createdAtLogical: number }`
  - `async function branchFrom(state, atSequence, newRunId, clock): Promise<{ lineage: RunLineage; state: ScenarioDomainState }>`

- [ ] **Step 1: Write the failing test**

`tests/unit/lineage.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { branchFrom } from '@/scenario/lineage'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { hashState } from '@/domain/hash'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const RUN = scenarioRunId('RUN-1')
const T = tenantId('TEN-A')
const base = () => ({
  ...withTenant(emptyDomainState(RUN), T, (p) => ({ ...p, displayName: 'A', lifecycleState: 'ACTIVE' as const })),
  sequence: 5,
})

describe('checkpoint branching', () => {
  it('creates a new run id carrying the parent', async () => {
    const clock = fixedClock(CANONICAL_EPOCH_MS)
    const { lineage } = await branchFrom(base(), 3, scenarioRunId('RUN-2'), clock)
    expect(lineage.runId).toBe('RUN-2')
    expect(lineage.parentRunId).toBe('RUN-1')
    expect(lineage.branchedFromSequence).toBe(3)
  })

  // The whole point: history is never rewritten.
  it('leaves the parent state byte-identical', async () => {
    const parent = base()
    const before = await hashState(parent)
    await branchFrom(parent, 3, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS))
    expect(await hashState(parent)).toBe(before)
  })

  it('gives the branch the new run id, not the parent’s', async () => {
    const { state } = await branchFrom(base(), 3, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS))
    expect(state.runId).toBe('RUN-2')
  })

  it('refuses a branch point beyond the parent’s sequence', async () => {
    await expect(branchFrom(base(), 99, scenarioRunId('RUN-2'), fixedClock(CANONICAL_EPOCH_MS)))
      .rejects.toThrow(/sequence/i)
  })

  it('refuses to reuse the parent’s run id', async () => {
    await expect(branchFrom(base(), 3, RUN, fixedClock(CANONICAL_EPOCH_MS)))
      .rejects.toThrow(/run id/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/lineage.test.ts`
Expected: FAIL — cannot resolve `@/scenario/lineage`.

- [ ] **Step 3: Write the implementation**

`branchFrom` returns a NEW state object carrying the new run id, and a `RunLineage`
recording the parent and the branch point. It never mutates the parent — the
byte-identical assertion is the contract. It rejects a branch point beyond the
parent's sequence, and rejects reusing the parent's run id, because both would make
the lineage a lie.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/lineage.test.ts`
Expected: all five tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenario/lineage.ts tests/unit/lineage.test.ts
git commit -m "feat(slice-02b): non-destructive checkpoint branching with parent lineage"
```

---

## Task 7: Review records

**Files:**
- Create: `src/review/records.ts`
- Test: `tests/unit/review-records.test.ts`

**Interfaces:**
- Consumes: `Clock`
- Produces:
  - `type ReviewStatus = 'accepted-for-review' | 'needs-change' | 'question' | 'comment'`
  - `const REVIEW_STATUSES: readonly ReviewStatus[]` (length 4)
  - `interface ReviewRecord`, `interface ReviewEvent`
  - `function createReviewRecord(input, clock): ReviewRecord`
  - `function createReviewEvent(recordId, kind, clock): ReviewEvent`

- [ ] **Step 1: Write the failing test**

`tests/unit/review-records.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createReviewRecord, createReviewEvent, REVIEW_STATUSES } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const clock = () => fixedClock(CANONICAL_EPOCH_MS)
const input = {
  anchorType: 'screen' as const, anchorId: 'SCR-1', surface: 'SURF-DOH' as const,
  reviewerLabel: 'Client reviewer', status: 'needs-change' as const,
  comment: 'The freshness label should name the source surface.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc123',
}

describe('review records', () => {
  it('offers exactly four statuses and none of them is an approval', () => {
    expect(REVIEW_STATUSES).toHaveLength(4)
    const joined = REVIEW_STATUSES.join(' ')
    expect(joined).not.toMatch(/\bapproved\b/i)
    expect(joined).toContain('accepted-for-review')
  })

  it('binds a record to the source fingerprint and build hash it was made against', () => {
    const r = createReviewRecord(input, clock())
    expect(r.sourceFingerprint).toBe('47bd18db')
    expect(r.buildHash).toBe('abc123')
  })

  it('timestamps from the injected clock, never ambient time', () => {
    const r = createReviewRecord(input, clock())
    expect(r.createdAtLogical).toBe(CANONICAL_EPOCH_MS)
  })

  it('requires a non-empty comment for needs-change', () => {
    expect(() => createReviewRecord({ ...input, comment: '   ' }, clock()))
      .toThrow(/comment/i)
  })

  it('creates a review event that carries no product fields', () => {
    const e = createReviewEvent('REV-1', 'created', clock())
    const keys = Object.keys(e)
    for (const forbidden of ['auditExpectation', 'correlationId', 'affectedSurfaces', 'commandState', 'tenant']) {
      expect(keys, forbidden).not.toContain(forbidden)
    }
  })

  it('gives every record a stable unique id', () => {
    const a = createReviewRecord(input, clock())
    const b = createReviewRecord(input, clock())
    expect(a.id).not.toBe(b.id)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-records.test.ts`
Expected: FAIL — cannot resolve `@/review/records`.

- [ ] **Step 3: Write the implementation**

Ids are derived from the injected clock's logical tick plus a monotonic counter, so
they are unique without `Math.random()`. `createReviewRecord` rejects an empty
comment on `needs-change` and `question`, because a change request with no text is
not actionable. `ReviewEvent` deliberately carries no product field — the test
asserts their absence, and that is the separation invariant in miniature.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/review-records.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/records.ts tests/unit/review-records.test.ts
git commit -m "feat(slice-02b): review records with no product fields and no approval status"
```

---

## Task 8: ReviewStore over its own object stores

**Files:**
- Create: `src/review/store.ts`
- Test: `tests/unit/review-store.test.ts`

**Interfaces:**
- Consumes: `REVIEW_STORES`, `PRODUCT_STORES`, `openDatabase`; `ReviewRecord`, `ReviewEvent`
- Produces:
  - `async function putReviewRecord(db, record): Promise<void>`
  - `async function listReviewRecords(db): Promise<readonly ReviewRecord[]>`
  - `async function resetReview(db): Promise<void>`

- [ ] **Step 1: Write the failing test**

`tests/unit/review-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase, PRODUCT_STORES } from '@/persistence/schema'
import { putReviewRecord, listReviewRecords, resetReview } from '@/review/store'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

let db: IDBDatabase
beforeEach(async () => { db = await openDatabase(new IDBFactory()) })

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', comment: 'Looks right to me.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const countAll = async (store: string) => new Promise<number>((res) => {
  const r = db.transaction(store, 'readonly').objectStore(store).count()
  r.onsuccess = () => res(r.result)
})

describe('review store', () => {
  it('stores and lists review records', async () => {
    await putReviewRecord(db, rec())
    expect(await listReviewRecords(db)).toHaveLength(1)
  })

  // The separation invariant, at the storage layer.
  it('writes to NO product store', async () => {
    await putReviewRecord(db, rec())
    for (const s of PRODUCT_STORES) {
      expect(await countAll(s), s).toBe(0)
    }
  })

  it('reset clears review records and touches no product store', async () => {
    await putReviewRecord(db, rec())
    await resetReview(db)
    expect(await listReviewRecords(db)).toHaveLength(0)
    for (const s of PRODUCT_STORES) expect(await countAll(s), s).toBe(0)
  })

  it('never throws — a closed database returns rather than rejecting', async () => {
    db.close()
    let threw = false
    try { await putReviewRecord(db, rec()) } catch { threw = true }
    expect(threw).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-store.test.ts`
Expected: FAIL — cannot resolve `@/review/store`.

- [ ] **Step 3: Write the implementation**

Every function opens a transaction spanning **only** `REVIEW_STORES`. Naming a
product store here would be a type error, because the transaction store list is
typed against `REVIEW_STORES`. Failures resolve rather than reject, matching the
coordinator's contract.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/review-store.test.ts`
Expected: all four tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/store.ts tests/unit/review-store.test.ts
git commit -m "feat(slice-02b): review store writing only to review object stores"
```

---

## Task 9: Review package export

**Files:**
- Create: `src/review/package.ts`
- Test: `tests/unit/review-package.test.ts`

**Interfaces:**
- Consumes: `sha256Hex`, `canonicalSerialize` from `@/domain/hash`; `ReviewRecord`
- Produces:
  - `interface PackageManifestEntry { path: string; bytes: number; sha256: string }`
  - `interface ReviewPackage { formatVersion; sourceHash; buildHash; scenarioVersion; records; manifest: readonly PackageManifestEntry[]; manifestChecksum: string }`
  - `async function exportReviewPackage(input): Promise<ReviewPackage>`
  - `const PACKAGE_FORMAT_VERSION = 1`

- [ ] **Step 1: Write the failing test**

`tests/unit/review-package.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { exportReviewPackage, PACKAGE_FORMAT_VERSION } from '@/review/package'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', comment: 'Fine.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const input = () => ({
  sourceHash: '47bd18db', buildHash: 'abc', scenarioVersion: '1', records: [rec()],
})

describe('review package export', () => {
  it('stamps the format version', async () => {
    expect((await exportReviewPackage(input())).formatVersion).toBe(PACKAGE_FORMAT_VERSION)
  })

  it('sorts the manifest by normalised path so the checksum is stable', async () => {
    const p = await exportReviewPackage(input())
    const paths = p.manifest.map((m) => m.path)
    expect([...paths]).toEqual([...paths].sort())
  })

  // The hash scope must not include the field that holds the hash.
  it('excludes its own checksum field from the checksum', async () => {
    const p = await exportReviewPackage(input())
    const recomputed = await exportReviewPackage(input())
    expect(p.manifestChecksum).toBe(recomputed.manifestChecksum)
    expect(JSON.stringify(p.manifest)).not.toContain(p.manifestChecksum)
  })

  it('changes the checksum when a payload changes', async () => {
    const a = await exportReviewPackage(input())
    const b = await exportReviewPackage({ ...input(), records: [rec(), rec()] })
    expect(a.manifestChecksum).not.toBe(b.manifestChecksum)
  })

  it('records byte length and sha256 for every entry', async () => {
    const p = await exportReviewPackage(input())
    for (const e of p.manifest) {
      expect(e.bytes).toBeGreaterThan(0)
      expect(e.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  // Memory has no export path at V1.
  it('refuses an input carrying memory data', async () => {
    await expect(exportReviewPackage({ ...input(), memory: [{ any: 'thing' }] } as never))
      .rejects.toThrow(/memory/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-package.test.ts`
Expected: FAIL — cannot resolve `@/review/package`.

- [ ] **Step 3: Write the implementation**

The manifest is built from the payload files, sorted by normalised relative path,
each carrying byte length and SHA-256. `manifestChecksum` hashes the canonically
serialised manifest array — which does not contain the checksum field, so the scope
is never self-referential.

The exporter's input type has no memory field, and a runtime guard rejects one
anyway: the source closes the data classes at seven and gives memory no export path
at V1, so being structurally unable to export it is the requirement, not a
convention.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/review-package.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/package.ts tests/unit/review-package.test.ts
git commit -m "feat(slice-02b): review package export with a non-self-referential manifest hash"
```

---

## Task 10: Review package import, validation and quarantine

**Files:**
- Modify: `src/review/package.ts`
- Test: `tests/unit/review-import.test.ts`

**Interfaces:**
- Consumes: everything from Task 9
- Produces:
  - `type ImportOutcome = { ok: true; preview: ImportPreview } | { ok: false; quarantined: true; failingEntry: string | null; expected: string | null; actual: string | null; reason: string }`
  - `async function importReviewPackage(raw: unknown, expected: { sourceHash; buildHash }): Promise<ImportOutcome>`
  - `const MAX_PACKAGE_BYTES = 5_000_000`

- [ ] **Step 1: Write the failing test**

`tests/unit/review-import.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { exportReviewPackage, importReviewPackage, MAX_PACKAGE_BYTES } from '@/review/package'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', comment: 'Fine.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const good = () => exportReviewPackage({ sourceHash: '47bd18db', buildHash: 'abc', scenarioVersion: '1', records: [rec()] })
const expected = { sourceHash: '47bd18db', buildHash: 'abc' }

describe('review package import', () => {
  it('accepts a valid package and returns a preview rather than applying it', async () => {
    const r = await importReviewPackage(await good(), expected)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.preview.recordCount).toBe(1)
  })

  it('quarantines a tampered payload and names the failing entry', async () => {
    const p = await good()
    const tampered = { ...p, records: [{ ...p.records[0], comment: 'ALTERED' }] }
    const r = await importReviewPackage(tampered, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.quarantined).toBe(true)
      expect(r.expected).not.toBe(r.actual)
    }
  })

  it('quarantines a wrong manifest checksum', async () => {
    const p = await good()
    const r = await importReviewPackage({ ...p, manifestChecksum: 'f'.repeat(64) }, expected)
    expect(r.ok).toBe(false)
  })

  it('quarantines an incompatible source hash rather than merging across sources', async () => {
    const r = await importReviewPackage(await good(), { sourceHash: 'DIFFERENT', buildHash: 'abc' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/source/i)
  })

  it('quarantines an oversized package', async () => {
    const p = await good()
    const huge = { ...p, records: [{ ...p.records[0], comment: 'x'.repeat(MAX_PACKAGE_BYTES + 1) }] }
    const r = await importReviewPackage(huge, expected)
    expect(r.ok).toBe(false)
  })

  it('quarantines a non-object payload without throwing', async () => {
    for (const bad of [null, 42, 'string', []]) {
      const r = await importReviewPackage(bad, expected)
      expect(r.ok, String(bad)).toBe(false)
    }
  })

  it('never applies anything on the failing path — preview only, always', async () => {
    const r = await importReviewPackage({ nonsense: true }, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(10)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/review-import.test.ts`
Expected: FAIL — `importReviewPackage` is not exported.

- [ ] **Step 3: Write the implementation**

Validation order: size → shape (Zod, strict) → format version → source and build
compatibility → per-entry hashes → manifest checksum. The first failure quarantines,
returning the failing entry with expected and actual values, and never proceeds to a
preview. A valid package returns a **preview** — import never applies directly, so a
reviewer always sees what would change before it changes.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/review-import.test.ts`
Expected: all seven tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/package.ts tests/unit/review-import.test.ts
git commit -m "feat(slice-02b): review package import validating before preview, quarantine on any mismatch"
```

---

## Task 11: Evidence projections

**Files:**
- Create: `src/scenario/evidence.ts`
- Test: `tests/unit/evidence.test.ts`

**Interfaces:**
- Consumes: `CommittedTransition`
- Produces:
  - `interface ImpactProjection { initiatingSurface; affectedSurfaces; objectsChanged; eventCount; auditCount; notificationCount }`
  - `interface InteractionEvidenceRecord { commandType; outcome; priorStateHash; nextStateHash; affectedSurfaces }`
  - `function projectImpact(c: CommittedTransition): ImpactProjection`
  - `function projectEvidence(c: CommittedTransition): InteractionEvidenceRecord`

- [ ] **Step 1: Write the failing test**

`tests/unit/evidence.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { projectImpact, projectEvidence } from '@/scenario/evidence'

const committed = {
  status: 'accepted', committed: true,
  priorStateHash: 'a'.repeat(64), nextStateHash: 'b'.repeat(64),
  affectedSurfaces: ['SURF-DOH', 'SURF-CC'],
  events: [{ id: 'E1' }], audit: [{ id: 'A1' }], notifications: [],
  commands: [], schedules: [],
  decision: { outcome: 'allowed' },
} as never

describe('evidence projections', () => {
  it('summarises impact without inventing anything not in the transition', () => {
    const p = projectImpact(committed)
    expect(p.affectedSurfaces).toEqual(['SURF-DOH', 'SURF-CC'])
    expect(p.eventCount).toBe(1)
    expect(p.auditCount).toBe(1)
    expect(p.notificationCount).toBe(0)
  })

  it('is pure — the same input gives an equal result and the input is unchanged', () => {
    const before = JSON.stringify(committed)
    const a = projectImpact(committed)
    const b = projectImpact(committed)
    expect(a).toEqual(b)
    expect(JSON.stringify(committed)).toBe(before)
  })

  it('carries both state hashes so a reviewer can see the transition moved', () => {
    const e = projectEvidence(committed)
    expect(e.priorStateHash).not.toBe(e.nextStateHash)
  })

  it('produces no review record — evidence is a projection, not a review action', () => {
    const e = projectEvidence(committed)
    expect(Object.keys(e)).not.toContain('reviewerLabel')
    expect(Object.keys(e)).not.toContain('status')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/evidence.test.ts`
Expected: FAIL — cannot resolve `@/scenario/evidence`.

- [ ] **Step 3: Write the implementation**

Both functions are pure and read-only. They derive counts and identifiers from the
committed transition and invent nothing. Neither creates a `ReviewRecord`; only an
explicit reviewer action does that.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/evidence.test.ts`
Expected: all four tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenario/evidence.ts tests/unit/evidence.test.ts
git commit -m "feat(slice-02b): read-only impact and interaction evidence projections"
```

---

## Task 12: Coverage descriptors and honest status

**Files:**
- Create: `src/coverage/descriptors.ts`, `src/coverage/status.ts`
- Test: `tests/unit/coverage.test.ts`

**Interfaces:**
- Consumes: `loadRegistry` from `@/registry/load`; the reconciliation JSON
- Produces:
  - `type CoverageStatus = 'demonstrated-in-storyboard' | 'decision-blocked' | 'not-applicable' | 'not-represented'`
  - `const COVERAGE_STATUSES: readonly CoverageStatus[]` (length 4)
  - `interface RegistryDescriptor { slug; title; idPrefix; expectedCount: number | null; sourceNote }`
  - `const REGISTRY_DESCRIPTORS: readonly RegistryDescriptor[]` (length 14)
  - `function countByStatus(entries): Record<CoverageStatus, number>`

- [ ] **Step 1: Write the failing test**

`tests/unit/coverage.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES, countByStatus } from '@/coverage/descriptors'

describe('coverage descriptors', () => {
  it('describes exactly the fourteen inventories the master prompt names', () => {
    expect(REGISTRY_DESCRIPTORS).toHaveLength(14)
    const slugs = REGISTRY_DESCRIPTORS.map((d) => d.slug)
    for (const required of [
      'modules', 'features', 'sub-features', 'functions', 'workflows',
      'business-use-cases', 'business-objects', 'events', 'commands',
      'notifications', 'offline-scenarios', 'ai-storyboards',
      'scheduled-work', 'actionable-controls',
    ]) expect(slugs, required).toContain(required)
  })

  it('uses url-safe slugs so each becomes a static route', () => {
    for (const d of REGISTRY_DESCRIPTORS) expect(d.slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('gives every descriptor a full human-readable title, never a bare identifier', () => {
    for (const d of REGISTRY_DESCRIPTORS) {
      expect(d.title.length, d.slug).toBeGreaterThan(4)
      expect(d.title, d.slug).not.toMatch(/^[A-Z]+-/)
    }
  })

  // Honest status vocabulary: nothing here reads as a production guarantee.
  it('offers four statuses and none of them claims production capability', () => {
    expect(COVERAGE_STATUSES).toHaveLength(4)
    const joined = COVERAGE_STATUSES.join(' ')
    expect(joined).not.toMatch(/\bimplemented\b/)
    expect(joined).not.toMatch(/\bcomplete\b/)
    expect(joined).toContain('not-represented')
  })

  it('counts by status with every status present even at zero', () => {
    const counts = countByStatus([{ status: 'not-represented' }, { status: 'not-represented' }])
    expect(counts['not-represented']).toBe(2)
    expect(counts['demonstrated-in-storyboard']).toBe(0)
    expect(Object.keys(counts).sort()).toEqual([...COVERAGE_STATUSES].sort())
  })

  it('carries the reconciled expected count where the source fixes one', () => {
    const modules = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'modules')
    expect(modules?.expectedCount).toBe(81)
    const workflows = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'workflows')
    // The source fixes no workflow total; 81 is the MODULE count and nothing else.
    expect(workflows?.expectedCount).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/coverage.test.ts`
Expected: FAIL — cannot resolve `@/coverage/descriptors`.

- [ ] **Step 3: Write the implementation**

Fourteen descriptors with url-safe slugs, full titles, and `expectedCount` taken
from the umbrella spec §12 reconciliation — `81` for modules, `99` for business
objects, `70` for offline scenarios, `22` for do-not-use-cron, and **`null` for
workflows**, because the frozen source fixes no workflow total and 81 is the module
count and nothing else. `sourceNote` carries the reconciliation verdict so the
screen can show why a number is what it is.

`countByStatus` always returns every status key, so a zero renders as a zero rather
than as an absent row.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/coverage.test.ts`
Expected: all six tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/coverage tests/unit/coverage.test.ts
git commit -m "feat(slice-02b): coverage descriptors with honest status and reconciled counts"
```

---

## Task 13: Coverage dashboard, registry index and Workflow Index routes

**Files:**
- Create: `app/coverage/page.tsx`, `app/coverage/[registry]/page.tsx`, `app/workflows/page.tsx`
- Test: `tests/component/coverage.test.tsx`, `tests/e2e/coverage.spec.ts`

**Interfaces:**
- Consumes: `REGISTRY_DESCRIPTORS`, `COVERAGE_STATUSES`, `countByStatus`; the primitives barrel; `ScreenStateBoundary`
- Produces: three routes; `generateStaticParams` returning exactly the fourteen slugs

- [ ] **Step 1: Write the failing test**

`tests/component/coverage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CoveragePage from '../../app/coverage/page'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'

describe('coverage dashboard', () => {
  it('links to every one of the fourteen registry indexes', () => {
    render(<CoveragePage />)
    for (const d of REGISTRY_DESCRIPTORS) {
      expect(screen.getByRole('link', { name: new RegExp(d.title, 'i') }), d.slug).toBeDefined()
    }
  })

  it('has exactly one level-1 heading', () => {
    render(<CoveragePage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('never renders a green check implying a production control exists', () => {
    const { container } = render(<CoveragePage />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('✅')
    expect(text.toLowerCase()).not.toMatch(/\bproduction[- ]ready\b/)
  })

  it('states plainly that behaviour is simulated', () => {
    const { container } = render(<CoveragePage />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/simulated/)
  })
})
```

`tests/e2e/coverage.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('every registry index route renders from the static export', async ({ page }) => {
  const slugs = [
    'modules', 'features', 'sub-features', 'functions', 'workflows',
    'business-use-cases', 'business-objects', 'events', 'commands',
    'notifications', 'offline-scenarios', 'ai-storyboards',
    'scheduled-work', 'actionable-controls',
  ]
  for (const s of slugs) {
    const res = await page.goto(`/coverage/${s}/`)
    expect(res?.status(), s).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  }
})

test('the workflow index renders and states its reconciled count honestly', async ({ page }) => {
  await page.goto('/workflows/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  // 81 is the module count and must never be presented as a workflow total.
  const body = (await page.textContent('body')) ?? ''
  expect(body).not.toMatch(/81\s+workflows/i)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run --project component tests/component/coverage.test.tsx`
Expected: FAIL — the routes do not exist.

- [ ] **Step 3: Write the implementation**

`app/coverage/page.tsx` renders the dashboard: one `<h1>`, a table of the fourteen
registries with live counts and status breakdown, a link into each, an explicit
"simulated behaviour" statement, and the §12 reconciliation summary.

`app/coverage/[registry]/page.tsx` is the generic index. `generateStaticParams`
returns exactly the fourteen slugs, so the route census stays finite and
build-time-known. It uses `ScreenStateBoundary` for its states, so an empty
registry renders `STATE-01` naming what would appear and what creates it — never a
blank panel.

`app/workflows/page.tsx` is the Workflow Index: stable ID, plain-language name,
owning surface and module, initiating and participating roles, primary objects,
implementation status, and variant coverage, filterable by each.

Today most rows read `not-represented`, because slices 3–13 have not run. The
dashboard shows the true state of the build rather than appearing complete.

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm vitest run --project component tests/component/coverage.test.tsx
pnpm build && pnpm test:e2e
```
Expected: all four component tests PASS; both e2e tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/coverage app/workflows tests/component/coverage.test.tsx tests/e2e/coverage.spec.ts
git commit -m "feat(slice-02b): coverage dashboard, fourteen registry indexes and the workflow index"
```

---

## Task 14: The review shell route

**Files:**
- Create: `app/review/page.tsx`
- Test: `tests/component/review-shell.test.tsx`

**Interfaces:**
- Consumes: `REVIEW_STATUSES`, `createReviewRecord`; the primitives barrel
- Produces: the `/review/` route

- [ ] **Step 1: Write the failing test**

`tests/component/review-shell.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReviewPage from '../../app/review/page'

describe('review shell', () => {
  it('labels its accept action for client review, never as an approval', () => {
    render(<ReviewPage />)
    expect(screen.getByRole('button', { name: /accept for client review/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^approve$/i })).toBeNull()
  })

  it('uses no product-approval language anywhere on the page', () => {
    const { container } = render(<ReviewPage />)
    const t = (container.textContent ?? '').toLowerCase()
    for (const forbidden of ['workflow approval', 'job approval', 'quality release', 'production authorisation']) {
      expect(t, forbidden).not.toContain(forbidden)
    }
  })

  it('states that review records are storyboard metadata, not product audit', () => {
    const { container } = render(<ReviewPage />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/not.*(product )?audit|storyboard metadata/)
  })

  it('offers all four review statuses', () => {
    render(<ReviewPage />)
    for (const s of ['needs change', 'question', 'comment']) {
      expect(screen.getByText(new RegExp(s, 'i')), s).toBeDefined()
    }
  })

  it('has exactly one level-1 heading and a main landmark', () => {
    render(<ReviewPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('main')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project component tests/component/review-shell.test.tsx`
Expected: FAIL — the route does not exist.

- [ ] **Step 3: Write the implementation**

The shell renders the four statuses, a comment field, and an accept control labelled
**"Accept for client review"**. It states in visible copy that review records are
storyboard metadata kept separately from product audit. It carries the
prototype-versus-production disclosure. It uses the primitives rather than raw
markup, so the accessibility guarantees come along.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project component tests/component/review-shell.test.tsx`
Expected: all five tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/review tests/component/review-shell.test.tsx
git commit -m "feat(slice-02b): review shell labelled for client review, never approval"
```

---

## Task 15: The three slice gates

**Files:**
- Create: `tests/coverage/slice-2b-gates.test.ts`
- Test: itself

**Interfaces:**
- Consumes: the comment-stripping helper already in `tests/coverage/contract-gates.test.ts` — export it from a shared module rather than duplicating it
- Produces: three gates, each proven able to fail

- [ ] **Step 1: Write the failing test**

`tests/coverage/slice-2b-gates.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}
const SRC = walk('src').filter((f) => /\.tsx?$/.test(f))
const UI = SRC.filter((f) => f.includes(`${'src'}/ui/`) || f.includes(`${'src'}/coverage/`))
const APP = walk('app').filter((f) => /\.tsx?$/.test(f))

describe('slice 2b gates', () => {
  // Only the gateway may mutate.
  it('no component imports reduce or commitTransition', () => {
    const offenders = [...UI, ...APP].filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      return /from\s+['"]@\/kernel\/reduce['"]|from\s+['"]@\/persistence\/coordinator['"]/.test(s)
    })
    expect(offenders).toEqual([])
  })

  // A review action creates a ReviewEvent and nothing else.
  it('review modules import no product ledger writer', () => {
    const review = SRC.filter((f) => f.includes(`${'src'}/review/`))
    const offenders = review.filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      return /commitTransition|from\s+['"]@\/kernel\//.test(s)
    })
    expect(offenders).toEqual([])
  })

  // Memory has no export path at V1.
  it('the exporter references no memory data class', () => {
    const s = stripComments(readFileSync('src/review/package.ts', 'utf8'))
    expect(s).not.toMatch(/\bmemoryRecords\b|\bMemoryRecord\b/)
  })

  it('review status vocabulary contains no approval word', () => {
    const s = readFileSync('src/review/records.ts', 'utf8')
    const block = s.slice(s.indexOf('REVIEW_STATUSES'))
    expect(block.slice(0, 300)).not.toMatch(/'approved'/)
  })
})
```

- [ ] **Step 2: Extract the shared comment stripper**

Move `stripComments` out of `tests/coverage/contract-gates.test.ts` into
`tests/coverage/strip-comments.ts` and import it in both files. It already handles
`//`, `/* */`, JSDoc, string and template literals containing `//`, and regex
literals. Do not duplicate it — one implementation, two consumers.

- [ ] **Step 3: Prove each gate can fail**

Plant each violation, confirm the failure, revert:
- add `import { reduce } from '@/kernel/reduce'` plus a use to a file under `src/ui/` → gate 1 fails;
- add `import { commitTransition } from '@/persistence/coordinator'` to `src/review/store.ts` → gate 2 fails;
- add `const memoryRecords = []` to `src/review/package.ts` → gate 3 fails;
- add `'approved'` to `REVIEW_STATUSES` → gate 4 fails.

Then prove the comment case does NOT trip any gate: add a comment to `src/ui/` reading
`// never import reduce or commitTransition here` and confirm all four still pass.

Record every probe result in your report.

- [ ] **Step 4: Run the full chain**

Run: `pnpm verify`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add tests/coverage
git commit -m "test(slice-02b): gateway-only, review-separation and memory-no-export gates"
```

---

## Slice 2b exit criteria

- [ ] `pnpm verify` exits 0 on a clean rebuild (`out/` and `.next/` removed first).
- [ ] The array guard names the non-index cause; symbol keys and non-enumerable properties are still accepted.
- [ ] A v1 database upgrades to v2 gaining both review stores without losing product data.
- [ ] The gateway refuses on capability before the kernel runs, and never throws.
- [ ] Selectors return `null` rather than another tenant's objects.
- [ ] A branch leaves the parent state byte-identical.
- [ ] A review action writes to no product store — asserted across every product store.
- [ ] The package checksum excludes its own field; a tampered payload quarantines.
- [ ] The exporter cannot include memory data.
- [ ] All fourteen registry index routes render from the static export.
- [ ] The review shell says "Accept for client review" and never "Approve".
- [ ] Each of the four gates proven able to fail, and proven NOT to trip on a comment.
- [ ] Independent review passes with every Critical and Important finding resolved.

## Self-review record

**Spec coverage.** §1 separation → Tasks 7, 8, 15. §2 architecture → Tasks 3, 4.
§3 controls → Tasks 5, 6. §4 review records → Tasks 7, 8. §5 export/import →
Tasks 9, 10. §6 evidence → Task 11. §7 coverage indexes → Tasks 12, 13. §8
production-grade → the Global Constraints and every task's typed-failure
requirement. §9 residual → Task 1. §11 testing → every task plus Task 15.

**Deferred by design:** product surfaces and module screens (slices 3–13); the
product's Author → Reviewer → Release Authority chain (slice 5); screenshot
generation and walkthrough runners (slice 13).

**Placeholder scan.** No TBD, TODO, "handle edge cases", or "similar to Task N".
Every code step carries runnable code.

**Type consistency.** `GatewayResult` from Task 3 is consumed by Task 4's
`dispatchCommand`. `ReviewRecord` from Task 7 is consumed by Tasks 8, 9, 10.
`PACKAGE_FORMAT_VERSION` and the manifest types from Task 9 are consumed by Task 10.
`REGISTRY_DESCRIPTORS` and `COVERAGE_STATUSES` from Task 12 are consumed by Task 13.
`PRODUCT_STORES` and `REVIEW_STORES` from Task 2 are consumed by Task 8 and Task 15.
`stripComments` is extracted once in Task 15 and shared, not duplicated.
